#!/usr/bin/env node
'use strict';

// Karing accepts custom diversion rules, not an unchanged sing-box configuration.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { repositoryAssetUrl } = require('./lib/generated-asset-url');
const { SOURCE_GRAPH_VERSION } = require('../rulesets/source/routing-graph');

const ROOT = path.resolve(__dirname, '..');
const LAYOUT = require('./client-layout.json');
const FAMILY = LAYOUT.families.find(item => item.clients.includes('Karing')).directory;
const CLIENT_DIR = `${FAMILY}/Karing`;
const CONFIG_PATH = `${FAMILY}/SingBox/SingBox(sing-box)-1.13.json`;
const FUSED_PATH = 'rulesets/generated/fused/manifest.json';
const SUPPORT_DIR = 'rulesets/source/karing-support';
const SUPPORT_PATH = `${SUPPORT_DIR}/manifest.json`;
const ASSET_DIR = 'rulesets/generated/karing';
const PROFILE_PATH = `${CLIENT_DIR}/diversion_rules_custom.json`;
const MANIFEST_PATH = `${CLIENT_DIR}/adapter-manifest.json`;
const VERSION = `${SOURCE_GRAPH_VERSION}-karing.2`;
const BUILD = '2026-10-28';
const MAX_ASSET_BYTES = 18 * 1024 * 1024;
const NON_TERMINAL = new Set(['sniff', 'resolve', 'route-options']);
// Headless source format version 3 (sing-box >= 1.11). Unknown route-only
// matchers must fail rather than silently widening a rule.
const STRINGS = new Set(['network', 'domain', 'domain_suffix', 'domain_keyword', 'domain_regex',
  'source_ip_cidr', 'ip_cidr', 'source_port_range', 'port_range', 'process_name',
  'process_path', 'process_path_regex', 'package_name', 'network_type', 'wifi_ssid', 'wifi_bssid']);
const NUMBERS = new Set(['source_port', 'port']);
const BOOLEANS = new Set(['network_is_expensive', 'network_is_constrained']);
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const encode = value => `${JSON.stringify(value, null, 2)}\n`;
const clone = value => JSON.parse(JSON.stringify(value));
function insist(condition, message) { if (!condition) throw new Error(message); }
function array(value) { return Array.isArray(value) ? value : [value]; }
function safePath(root, relative) {
  const absolute = path.resolve(root, relative);
  insist(absolute.startsWith(path.resolve(root) + path.sep), `unsafe output path: ${relative}`);
  return absolute;
}

function indexByTag(items, kind) {
  insist(Array.isArray(items), `missing ${kind} list`);
  const result = new Map();
  for (const item of items) {
    insist(item && typeof item.tag === 'string' && item.tag, `invalid ${kind} tag`);
    insist(!result.has(item.tag), `duplicate ${kind} tag: ${item.tag}`);
    result.set(item.tag, item);
  }
  return result;
}

function resolveOutbound(tag, outbounds, trail = []) {
  insist(typeof tag === 'string' && tag, 'missing outbound');
  insist(!trail.includes(tag), `outbound default cycle: ${[...trail, tag].join(' -> ')}`);
  const item = outbounds.get(tag);
  insist(item, `missing outbound: ${tag}`);
  const chain = [...trail, tag];
  if (item.type === 'direct') return { outbound: 'direct', path: chain };
  if (item.type === 'block') return { outbound: 'block', path: chain };
  if (item.type === 'selector') {
    insist(typeof item.default === 'string' && item.default, `selector missing explicit default: ${tag}`);
    insist(Array.isArray(item.outbounds) && item.outbounds.includes(item.default), `selector default not in outbounds: ${tag}`);
    return resolveOutbound(item.default, outbounds, chain);
  }
  if (item.type === 'urltest') {
    insist(Array.isArray(item.outbounds) && item.outbounds.length, `urltest missing outbounds: ${tag}`);
    for (const child of item.outbounds) insist(outbounds.has(child), `missing outbound: ${child}`);
  } else {
    insist(['socks', 'http', 'shadowsocks', 'shadowsocksr', 'trojan', 'vmess', 'vless', 'hysteria',
      'hysteria2', 'tuic', 'wireguard', 'ssh', 'shadowtls', 'anytls', 'tor', 'naive'].includes(item.type),
    `unsupported outbound type: ${item.type}`);
  }
  // The source's proxy topology is reported, never inserted into Karing's action.
  return { outbound: 'currentSelected', path: chain };
}

function validateHeadless(rule, context = 'headless') {
  insist(rule && typeof rule === 'object' && !Array.isArray(rule), `${context}: invalid rule`);
  if (rule.type === 'logical') {
    insist(Object.keys(rule).every(key => ['type', 'mode', 'rules', 'invert'].includes(key)), `${context}: unsupported logical field`);
    insist(['and', 'or'].includes(rule.mode), `${context}: invalid logical mode`);
    insist(Array.isArray(rule.rules) && rule.rules.length, `${context}: empty logical rule`);
    rule.rules.forEach(child => validateHeadless(child, context));
  } else {
    insist(!rule.type || rule.type === 'default', `${context}: unsupported rule type ${rule.type}`);
    let matchCount = 0;
    for (const [key, value] of Object.entries(rule)) {
      if (key === 'type' || key === 'invert') continue;
      insist(STRINGS.has(key) || NUMBERS.has(key) || BOOLEANS.has(key), `${context}: unsupported match ${key}`);
      if (BOOLEANS.has(key)) insist(typeof value === 'boolean', `${context}: invalid ${key}`);
      else {
        const values = array(value);
        insist(values.length, `${context}: empty ${key}`);
        if (STRINGS.has(key)) insist(values.every(v => typeof v === 'string' && v.length), `${context}: invalid ${key}`);
        else insist(values.every(v => Number.isInteger(v) && v >= 0 && v <= 65535), `${context}: invalid ${key}`);
      }
      matchCount++;
    }
    insist(matchCount > 0, `${context}: empty matcher`);
  }
  if (Object.hasOwn(rule, 'invert')) insist(typeof rule.invert === 'boolean', `${context}: invalid invert`);
  return rule;
}

function validateRemote(item) {
  insist(item.type === 'remote' && ['source', 'binary'].includes(item.format), `unsupported rule-set definition: ${item.tag}`);
  let url;
  try { url = new URL(item.url); } catch { throw new Error(`invalid rule-set URL: ${item.tag}`); }
  insist(url.protocol === 'https:' && /\.(srs|json)$/.test(url.pathname), `unsupported Karing rule-set URL: ${item.url}`);
  insist(item.format === (url.pathname.endsWith('.json') ? 'source' : 'binary'), `rule-set format mismatch: ${item.tag}`);
}

function buildKaring({ config, fusedManifest, loadRuleSetSource, assetUrl = file => repositoryAssetUrl(file, SOURCE_GRAPH_VERSION), inputHashes = {} }) {
  insist(config?.route && Array.isArray(config.route.rules), 'missing route.rules');
  insist(fusedManifest?.baseline_version === SOURCE_GRAPH_VERSION, 'Karing fused baseline mismatch');
  const outbounds = indexByTag(config.outbounds, 'outbound');
  const ruleSets = indexByTag(config.route.rule_set, 'rule-set');
  const segments = new Map(fusedManifest.segments.map(segment => [segment.id, segment]));
  const profile = { rules: [] };
  const assets = {};
  const assetRecords = new Map();
  const mappings = [];
  const omitted = [];
  const sourceCache = new Map();
  let final = config.route.final ? { source_outbound: config.route.final, ...resolveOutbound(config.route.final, outbounds) } : null;

  function getRuleSet(tag, usage = 'profile-reference') {
    const item = ruleSets.get(tag);
    insist(item, `missing rule-set asset: ${tag}`);
    validateRemote(item);
    if (tag.startsWith('scki-fused-')) insist(segments.has(tag), `missing fused manifest segment: ${tag}`);
    if (!assetRecords.has(item.url)) assetRecords.set(item.url, { tag, url: item.url, format: item.format, kind: 'reused', usage: [] });
    const record = assetRecords.get(item.url);
    if (!record.usage.includes(usage)) record.usage.push(usage);
    return item;
  }

  function expand(tag) {
    const item = getRuleSet(tag, 'headless-source-input');
    if (!sourceCache.has(tag)) {
      insist(typeof loadRuleSetSource === 'function', `missing rule-set source loader: ${tag}`);
      const source = loadRuleSetSource(item);
      insist(source && [1, 2, 3].includes(source.version) && Array.isArray(source.rules) && source.rules.length,
        `invalid or unsupported headless source: ${tag}`);
      source.rules.forEach(rule => validateHeadless(rule, tag));
      sourceCache.set(tag, source.rules);
    }
    const rules = sourceCache.get(tag);
    return rules.length === 1 ? clone(rules[0]) : { type: 'logical', mode: 'or', rules: clone(rules) };
  }

  function headless(match) {
    if (match.type === 'logical') {
      insist(Object.keys(match).every(key => ['type', 'mode', 'rules', 'invert'].includes(key)), 'unsupported logical route matcher');
      insist(Array.isArray(match.rules), 'missing logical rules');
      return validateHeadless({ ...clone(match), rules: match.rules.map(headless) });
    }
    const { rule_set: tags, ...base } = clone(match);
    if (!tags) return validateHeadless(base);
    const refs = array(tags);
    insist(refs.length && refs.every(tag => typeof tag === 'string'), 'empty or invalid rule_set');
    const referenced = refs.map(expand);
    let refMatch = referenced.length === 1 ? referenced[0] : { type: 'logical', mode: 'or', rules: referenced };
    const invert = base.invert;
    delete base.invert;
    const fields = Object.keys(base).filter(key => key !== 'type');
    // sing-box merges the fields of a single default rule-set rule into the
    // outer matcher. AND expansion is equivalent only if their matching
    // groups do not overlap. Refuse future ambiguous inputs rather than
    // silently tightening OR-of-domain/IP or OR-of-port matching.
    const matchingGroup = key => {
      if (['domain', 'domain_suffix', 'domain_keyword', 'domain_regex', 'ip_cidr'].includes(key)) return 'destination';
      if (['port', 'port_range'].includes(key)) return 'port';
      if (['source_port', 'source_port_range'].includes(key)) return 'source-port';
      return key;
    };
    const outerGroups = new Set(fields.map(matchingGroup));
    for (const tag of refs) {
      const rules = sourceCache.get(tag);
      if (rules.length !== 1 || rules[0].type === 'logical' || rules[0].invert) continue;
      const overlap = Object.keys(rules[0]).filter(key => !['type', 'invert'].includes(key)).find(key => outerGroups.has(matchingGroup(key)));
      insist(!overlap, `rule-set field merging cannot be safely AND-expanded: ${tag} (${overlap})`);
    }
    if (fields.length) refMatch = { type: 'logical', mode: 'and', rules: [refMatch, validateHeadless(base)] };
    if (invert !== undefined) refMatch = { type: 'logical', mode: 'and', rules: [refMatch], invert };
    return validateHeadless(refMatch);
  }

  config.route.rules.forEach((sourceRule, index) => {
    const { action = 'route', outbound: target, ...match } = sourceRule;
    if (NON_TERMINAL.has(action)) {
      omitted.push({ source_rule_index: index, action, reason: 'App-managed non-terminal operation', source: clone(sourceRule) });
      return;
    }
    insist(['route', 'reject'].includes(action), `unsupported route action: ${action}`);
    const resolved = action === 'reject' ? { outbound: 'block', path: [] } : resolveOutbound(target, outbounds);
    insist(action !== 'reject' || !target, 'reject rule must not carry outbound');
    if (!Object.keys(match).length) {
      insist(index === config.route.rules.length - 1, 'empty FINAL before later rules');
      final = { source_outbound: target || 'reject', ...resolved };
      return;
    }
    const refs = match.rule_set ? array(match.rule_set) : [];
    const pureReference = Object.keys(match).length === 1 && refs.length;
    let urls;
    let asset;
    if (pureReference) urls = refs.map(tag => getRuleSet(tag).url);
    else {
      const source = { version: 3, rules: [headless(match)] };
      const content = encode(source);
      const id = `scki-karing-${String(index + 1).padStart(3, '0')}-${sha256(content).slice(0, 12)}`;
      asset = `${ASSET_DIR}/${id}.json`;
      insist(Buffer.byteLength(content) <= MAX_ASSET_BYTES, `Karing source asset exceeds budget: ${asset}`);
      assets[asset] = content;
      const url = assetUrl(asset);
      validateRemote({ tag: id, type: 'remote', format: 'source', url });
      assetRecords.set(url, { tag: id, url, format: 'source', kind: 'generated', path: asset, sha256: sha256(content), bytes: Buffer.byteLength(content) });
      urls = [url];
    }
    const segmentId = refs.find(tag => segments.has(tag)) || null;
    const sourcePolicy = target || 'REJECT';
    const name = `SCKI ${String(index + 1).padStart(3, '0')} ${segmentId || 'inline'} · ${sourcePolicy}`;
    profile.rules.push({ name, outbound: resolved.outbound, switch: true, or: true, rule_set: urls });
    mappings.push({ source_rule_index: index, name, segment_id: segmentId, source_action: action,
      source_outbound: sourcePolicy, outbound: resolved.outbound, outbound_path: resolved.path,
      source_rule_set_tags: refs, rule_set: urls, ...(asset ? { generated_asset: asset } : {}) });
  });
  insist(new Set(profile.rules.map(rule => rule.name)).size === profile.rules.length, 'duplicate Karing rule names');
  const manifest = {
    schema_version: 1, version: VERSION, build: BUILD, baseline_version: SOURCE_GRAPH_VERSION,
    authority: 'rulesets/source/routing-graph.js -> fused manifest -> generated SingBox 1.13 route',
    input_hashes: inputHashes,
    source_rule_count: config.route.rules.length, generated_rule_count: profile.rules.length,
    generated_source_asset_count: Object.keys(assets).length,
    profile_sha256: sha256(encode(profile)),
    manual_final: final ? { ...final, instruction: '在 Karing 分流规则中设置最终默认动作；原生导入不输出空匹配 FINAL。' } : null,
    mappings, rule_assets: [...assetRecords.values()], omitted_operations: omitted,
    ip_resolution: {
      status: 'requires-client-readback',
      source_segments_with_no_resolve: fusedManifest.segments.filter(segment => (segment.counts?.ipcidr_no_resolve || 0) > 0).map(segment => segment.id),
      note: 'SRS 无独立 no-resolve 匹配项；当前派生链已有的 IP 解析差异不能由原生导入 JSON 修复。'
    },
    manual_settings: [
      '先导入节点订阅，再在设置 → 分流 → 分流规则 → 编辑 → 自定义分流组菜单导入 diversion_rules_custom.json。',
      '首次导入使用干净的自定义规则列表；更新前备份并移除旧 SCKI 项，核对顺序。不要按相同业务名称合并不同序号段。',
      '代理业务映射 currentSelected；导入不会恢复业务/区域节点组，需要在 App 逐项绑定自定义节点组。',
      'DNS、TUN、嗅探、最终动作、规则下载路径和更新周期由 App 配置；按需关闭会抢先命中的 ISP/内置地区规则。',
      'IP 规则 no-resolve 与先解析行为、进程匹配平台权限、远程规则下载成功及最终生成配置须在 App 读回核验。'
    ],
    client_validation: { status: 'not-run', reason: '未下载或运行 Karing；本地生成/读回和标准 headless schema 检查不构成实机验收。' }
  };
  return { profile, manifest, assets };
}

function outputs(built) {
  return { [PROFILE_PATH]: encode(built.profile), [MANIFEST_PATH]: encode(built.manifest), ...built.assets };
}
function staleAssets(root, built) {
  const dir = safePath(root, ASSET_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(file => file.startsWith('scki-karing-') && file.endsWith('.json'))
    .map(file => `${ASSET_DIR}/${file}`).filter(file => !Object.hasOwn(built.assets, file));
}
function checkKaringOutputs(root, built) {
  const changed = [];
  for (const [relative, content] of Object.entries(outputs(built))) {
    const file = safePath(root, relative);
    if (!fs.existsSync(file) || !fs.readFileSync(file).equals(Buffer.from(content))) changed.push(relative);
  }
  return [...changed, ...staleAssets(root, built)];
}
function writeKaringOutputs(root, built) {
  for (const [relative, content] of Object.entries(outputs(built))) {
    const file = safePath(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (fs.existsSync(file) && fs.readFileSync(file).equals(Buffer.from(content))) continue;
    // Replace a sibling atomically: Windows may reject truncating a published
    // file. safePath above binds both the repository and isolated test roots.
    const temporary = `${file}.${crypto.randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporary, content, { flag: 'wx' });
      fs.renameSync(temporary, file);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }
  for (const stale of staleAssets(root, built)) fs.unlinkSync(safePath(root, stale));
  insist(!checkKaringOutputs(root, built).length, 'Karing saved output read-back failed');
}

function readInputs(root = ROOT) {
  const inputHashes = {};
  // Git may check out JS/JSON using CRLF on Windows and LF on Linux. Hash
  // canonical text so an otherwise identical checkout passes --check on both;
  // SRS and gzip receipt bytes remain exact binary inputs.
  function hashInput(relative, bytes) {
    inputHashes[relative] = sha256(/\.(?:js|json)$/.test(relative)
      ? bytes.toString('utf8').replace(/\r\n?/g, '\n')
      : bytes);
  }
  function read(relative) {
    const bytes = fs.readFileSync(safePath(root, relative));
    hashInput(relative, bytes);
    return JSON.parse(bytes);
  }
  const config = read(CONFIG_PATH);
  const fusedManifest = read(FUSED_PATH);
  const support = fs.existsSync(safePath(root, SUPPORT_PATH)) ? read(SUPPORT_PATH) : { assets: [] };
  for (const relative of ['rulesets/source/routing-graph.js', 'tools/generate-karing.js', 'tools/client-layout.json']) {
    hashInput(relative, fs.readFileSync(safePath(root, relative)));
  }
  // Read every local fused asset, including pure remote references: a dangling
  // published URL must not pass merely because no inlining was needed.
  const localFiles = new Map();
  for (const item of config.route.rule_set) {
    const marker = '/rulesets/generated/';
    const pathname = new URL(item.url).pathname;
    if (!pathname.includes(marker)) continue;
    const relative = decodeURIComponent(pathname.slice(pathname.indexOf(marker) + 1));
    const bytes = fs.readFileSync(safePath(root, relative));
    hashInput(relative, bytes);
    localFiles.set(item.tag, relative);
  }
  function loadRuleSetSource(item) {
    const local = localFiles.get(item.tag);
    if (local) return read(local.replace(/\.srs$/, '.json'));
    const record = support.assets.find(record => record.tag === item.tag && record.url === item.url);
    insist(record, `missing bound support source snapshot: ${item.tag}; run --refresh-support explicitly`);
    const file = safePath(root, record.source_file);
    const compressed = fs.readFileSync(file);
    insist(sha256(compressed) === record.source_gzip_sha256, `support gzip hash mismatch: ${item.tag}`);
    const bytes = zlib.gunzipSync(compressed);
    insist(sha256(bytes) === record.source_sha256, `support source hash mismatch: ${item.tag}`);
    inputHashes[record.source_file] = sha256(compressed);
    return JSON.parse(bytes);
  }
  return { config, fusedManifest, loadRuleSetSource, inputHashes };
}

async function refreshSupport(root = ROOT) {
  const config = JSON.parse(fs.readFileSync(safePath(root, CONFIG_PATH)));
  const sets = indexByTag(config.route.rule_set, 'rule-set');
  const required = new Set();
  function visit(rule, pureAllowed = true) {
    if (rule.rule_set && !(pureAllowed && Object.keys(rule).filter(key => !['action', 'outbound'].includes(key)).length === 1)) {
      for (const tag of array(rule.rule_set)) if (!sets.get(tag)?.url.includes('/rulesets/generated/')) required.add(tag);
    }
    for (const child of rule.rules || []) visit(child, false);
  }
  config.route.rules.forEach(rule => visit(rule));
  const executable = process.env.SING_BOX_113_BIN || path.join(root, '.cache/fused-rule-sets/sing-box', process.platform === 'win32' ? 'sing-box.exe' : 'sing-box');
  insist(fs.existsSync(executable), 'support refresh needs existing sing-box core (SING_BOX_113_BIN)');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-karing-support-'));
  const assets = [];
  try {
    for (const tag of required) {
      const item = sets.get(tag);
      insist(item, `missing rule-set: ${tag}`);
      validateRemote(item);
      const response = await fetch(item.url, { signal: AbortSignal.timeout(60000) });
      insist(response.ok, `support download failed: ${item.url} HTTP ${response.status}`);
      const binary = Buffer.from(await response.arrayBuffer());
      const input = path.join(temp, `${tag}.srs`);
      const decoded = path.join(temp, `${tag}.json`);
      fs.writeFileSync(input, binary);
      const result = spawnSync(executable, ['rule-set', 'decompile', '--output', decoded, input], { encoding: 'utf8', timeout: 60000 });
      insist(result.status === 0, `support decompile failed: ${tag}: ${result.stderr}`);
      const source = fs.readFileSync(decoded);
      const parsed = JSON.parse(source);
      parsed.rules.forEach(rule => validateHeadless(rule, tag));
      const gzip = zlib.gzipSync(source, { level: 9, mtime: 0 });
      const relative = `${SUPPORT_DIR}/${tag}.json.gz`;
      fs.mkdirSync(safePath(root, SUPPORT_DIR), { recursive: true });
      fs.writeFileSync(safePath(root, relative), gzip);
      assets.push({ tag, url: item.url, retrieved_at: new Date().toISOString(), binary_sha256: sha256(binary),
        binary_bytes: binary.length, source_file: relative, source_sha256: sha256(source),
        source_gzip_sha256: sha256(gzip), source_bytes: source.length, source_gzip_bytes: gzip.length, source_version: parsed.version });
    }
    fs.writeFileSync(safePath(root, SUPPORT_PATH), encode({ schema_version: 1, purpose: 'Exact decoded support SRS snapshots for Karing compound matchers; refresh only explicitly.', assets }));
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  return assets;
}

async function main() {
  const args = process.argv.slice(2);
  insist(args.every(arg => ['--check', '--refresh-support'].includes(arg)), 'Usage: node tools/generate-karing.js [--check | --refresh-support]');
  insist(!(args.includes('--check') && args.includes('--refresh-support')), '--check is read-only and cannot refresh support');
  if (args.includes('--refresh-support')) await refreshSupport();
  const built = buildKaring(readInputs());
  if (args.includes('--check')) {
    const drift = checkKaringOutputs(ROOT, built);
    insist(!drift.length, `Karing generated output drift:\n${drift.join('\n')}`);
    console.log(`Karing check OK: ${built.profile.rules.length} rules, ${Object.keys(built.assets).length} source assets; App validation not run`);
  } else {
    writeKaringOutputs(ROOT, built);
    console.log(`Karing generated and read back: ${built.profile.rules.length} rules, ${Object.keys(built.assets).length} source assets; App validation not run`);
  }
}

module.exports = { buildKaring, readInputs, validateHeadless, resolveOutbound, writeKaringOutputs, checkKaringOutputs,
  refreshSupport, PROFILE_PATH, MANIFEST_PATH, CONFIG_PATH, ASSET_DIR, VERSION };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
