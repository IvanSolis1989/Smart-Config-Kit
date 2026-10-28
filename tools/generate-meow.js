#!/usr/bin/env node
'use strict';

// Candidate adapter: reuse the maintained JS routing runtime, with no DNS or
// platform settings projection. routing-graph.js remains the rule authority.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { SOURCE_GRAPH_VERSION } = require('../rulesets/source/routing-graph');
const { trafficSourceFingerprint } = require('./build-fused-rule-sets');
const { writeRepositoryArtifact } = require('./lib/write-repository-artifact');
const { buildNativeProfile } = require('./lib/meow-native-profile');
const { projectAeroveRouting } = require('./lib/aerove-rule-projection');
const ROOT = path.resolve(__dirname, '..');
const SOURCE_PATH = 'Mihomo内核系/FlClash/FlClash(mihomo).js';
const FAMILY_DIR = 'Meow内核系';
const CLIENT_DIR = `${FAMILY_DIR}/Meow`;
const SCRIPT_CLIENT_DIR = `${FAMILY_DIR}/Aerove Lite`;
const SCRIPT_PATH = `${SCRIPT_CLIENT_DIR}/AeroveLite(meow).js`;
const NATIVE_PATH = `${CLIENT_DIR}/Meow(meow).yaml`;
const CMFA_PATH = 'Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml';
const MANIFEST_PATH = `${FAMILY_DIR}/adapter-manifest.json`;
const VERSION = `${SOURCE_GRAPH_VERSION}-meow.6`;
const BUILD = '2026-10-28';
// The native client has no Lite per-resource cap; preserve its published bytes.
const NATIVE_VERSION = `${SOURCE_GRAPH_VERSION}-meow.4`;
const NATIVE_BUILD = '2026-10-28';
const canonical = text => text.replace(/\r\n/g, '\n');
const hash = text => crypto.createHash('sha256').update(canonical(text)).digest('hex');
const read = file => canonical(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const insist = (condition, message) => { if (!condition) throw new Error(message); };

function rubyYaml(code, input, args = []) {
  const result = spawnSync(process.env.RUBY_BIN || 'ruby', ['-EUTF-8:UTF-8', '-rjson', '-ryaml', '-e', code, ...args],
    { input, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  insist(!result.error && result.status === 0, `Meow YAML generation requires Ruby >= 3.0: ${result.error?.message || result.stderr}`);
  return canonical(result.stdout);
}

function readCmfa() {
  return JSON.parse(rubyYaml('print JSON.generate(YAML.safe_load(STDIN.read, aliases: true))', read(CMFA_PATH)));
}

function renderNative(profile) {
  return [
    `# Meow 原生 YAML ${NATIVE_VERSION} | Build: ${NATIVE_BUILD}`,
    '# 架构：22 provider-filter 区域组 + 33 业务组；融合 MRS / residual YAML',
    `# 规则源：rulesets/source/routing-graph.js ${SOURCE_GRAPH_VERSION}`,
    '# 生成：node tools/generate-meow.js（禁止手工改生成物）',
    '# 变更历史：Meow内核系/Meow/CHANGELOG.md；官方 App 导入与宿主设置另验。',
    '# 使用前将 proxy-providers.Subscribe.url 替换为自己的 Clash 格式节点订阅。',
    '# 官方核心/官方 App 使用本 YAML；JS 仅供提供 main(config) 宿主的客户端。',
    '', rubyYaml('STDOUT.write(JSON.parse(STDIN.read).to_yaml(line_width: -1))', JSON.stringify(profile))
  ].join('\n');
}

function replaceOnce(source, anchor, replacement) {
  const first = source.indexOf(anchor);
  insist(first >= 0 && source.indexOf(anchor, first + anchor.length) < 0, `source anchor missing or duplicated: ${anchor.slice(0, 70)}`);
  return source.slice(0, first) + replacement + source.slice(first + anchor.length);
}

function removeBetween(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  insist(a >= 0 && b > a && source.indexOf(start, a + start.length) < 0, `source anchor drift: ${start}`);
  return source.slice(0, a) + source.slice(b);
}

function renderScript(input, splits) {
  let source = canonical(input);
  const start = source.indexOf('const VERSION = ');
  insist(start >= 0, 'source VERSION anchor missing');
  source = source.slice(start);
  source = replaceOnce(source, source.split('\n')[0], `const VERSION = '${VERSION}'`);
  // Delete the complete Node-DNS/global-settings module. Do not copy unsupported
  // Mihomo fields and then silently strip them from the user's configuration.
  source = removeBetween(source, '// >>> SCKI NODE DNS HINTS: BEGIN', 'function cleanupSubscription(config)');
  source = removeBetween(source, 'function _simpleHash(str)', 'function sortProxyGroups(config)');
  source = replaceOnce(source, 'function main(config)', 'function sckiRoutingMain(config)');
  source = replaceOnce(source, "const SCKI_SUBSCRIPTION_ADAPTER_PROFILE = 'adaptive'", "const SCKI_SUBSCRIPTION_ADAPTER_PROFILE = 'off'");
  source = replaceOnce(source, "    if (!config || typeof config !== 'object') return config", '');
  source = replaceOnce(source,
    "      log(`[${VERSION}] Node preflight rejected: ${nodePlan.reason}${nodePlan.reason === 'provider-input' ? '; flatten in SubStore for provider subscriptions' : ''}`)\n      return config",
    "      throw new Error('Node preflight rejected: ' + nodePlan.reason + '; flatten provider subscriptions in SubStore first')");
  source = replaceOnce(source, '    if (nodePlan.sourceCount === 0 && nodePlan.flattenedProviders === 0) return config',
    "    if (nodePlan.sourceCount === 0 && nodePlan.flattenedProviders === 0) throw new Error('Meow adapter requires inline proxy nodes; import or flatten a subscription first')");
  source = replaceOnce(source,
    '    var activeNodeServers = collectActiveSubscriptionNodeServers(config.proxies)\n' +
    '    var nodeDnsHints = SckiSubscriptionAdapter.captureNodeDns(config, activeNodeServers, SCKI_SUBSCRIPTION_ADAPTER_PROFILE)\n' +
    '    var nodeDnsReport = overwriteGeneral(config, nodeDnsHints)\n    logSubscriptionAdapterReport(nodeDnsReport)\n', '');
  source = replaceOnce(source, '    injectSmartFingerprint(config)\n', '');
  source = replaceOnce(source, '    log(`[${VERSION}] Error:`, e)\n    return config', '    throw e');
  if (splits === undefined) {
    const routing = readSharedRouting(input);
    splits = readAeroveAssets(routing.providers).splits;
  }
  const runtimeSplits = Object.fromEntries(Object.entries(splits).map(([name, parts]) => [name,
    parts.map(part => ({ id: part.id, url: part.url, cache_path: part.cache_path }))]));
  source += '\nconst SCKI_AEROVE_RULE_SPLITS = ' + JSON.stringify(runtimeSplits) + '\n' +
    canonical(projectAeroveRouting.toString()) + '\n' +
    '// DNS rule-set references cannot survive replacement of subscription providers.\n' +
    'function sckiAssertIndependentDns(value) {\n' +
    '  function check(text) {\n' +
    "    if (/(^|,)\\s*rule-set\\s*[:,]/i.test(text)) throw new Error('DNS rule-set dependency would be replaced: ' + text + '; use independent DNS policies before applying this adapter')\n" +
    '  }\n' +
    "  if (typeof value === 'string') check(value)\n" +
    "  else if (value && typeof value === 'object') Object.keys(value).forEach(function (key) { check(key); sckiAssertIndependentDns(value[key]) })\n" +
    '}\n' +
    '// JSON object in/out for clients with a main(config) script host. Never commit a\n' +
    '// partly rewritten input; the App owns validation of nodes and platform fields.\n' +
    'function main(config) {\n' +
    "  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Expected a Meow configuration object')\n" +
    '  sckiAssertIndependentDns(config.dns)\n' +
    '  return projectAeroveRouting(sckiRoutingMain(JSON.parse(JSON.stringify(config))), SCKI_AEROVE_RULE_SPLITS)\n}\n';
  return [
    '// AEROVE Lite / meow-rs 分流覆写候选（共享 Meow 分流实现）',
    `// 版本：${VERSION} | Build：${BUILD}`,
    '// 架构：最多 22 个 url-test 区域组 + 33 业务组；融合 MRS / residual YAML',
    `// 规则源：rulesets/source/routing-graph.js ${SOURCE_GRAPH_VERSION}`,
    `// 生成：node tools/generate-meow.js；运行时输入：${SOURCE_PATH}`,
    `// 变更历史：${SCRIPT_CLIENT_DIR}/CHANGELOG.md；状态：docs/support-queue.md#aerove-lite-meow`,
    '// 只维护节点清洗、分组、rule-providers、rules；DNS / TUN / 端口 / 嗅探由 App 管理。',
    '// 前提：已展开节点的订阅；远程 proxy-providers 请先用 SubStore 展平。',
    '// 目标接口：main(config)，JSON 对象入出；无网络、文件系统或定时器依赖。',
    '// 官方 Meow 客户端使用相邻 Meow 目录的原生 YAML；不假定官方 App 执行 JS。',
    '// Lite 大资源按安全预算无损分片，同目标 RULE-SET 在原位置连续展开。',
    '// 客户端联调和真实连接验收状态见支持队列。',
    '', source
  ].join('\n');
}

function readSharedRouting(input = read(SOURCE_PATH)) {
  const context = vm.createContext({ console: { log() {} } });
  new vm.Script(renderScript(input, {})).runInContext(context, { timeout: 3000 });
  const routing = vm.runInContext(`(function () {
    var config = {};
    applyMihomoFusedRuleSets(config);
    return { providers: config['rule-providers'], rules: config.rules, business: Object.values(BIZ) };
  })()`, context, { timeout: 3000 });
  const fused = JSON.parse(read('rulesets/generated/fused/manifest.json'));
  insist(fused.baseline_version === SOURCE_GRAPH_VERSION, 'fused/source version mismatch');
  insist(fused.traffic_source_fingerprint === trafficSourceFingerprint(),
    'fused/source graph fingerprint mismatch; regenerate the shared routing chain first');
  insist(routing.rules.length === fused.fused_rule_count && Object.keys(routing.providers).length === fused.fused_provider_count,
    'routing consumer/fused manifest drift; regenerate the shared routing chain first');
  insist(routing.business.length === 33, 'unexpected business group topology');
  insist(routing.rules.at(-1) === 'MATCH,🐟 漏网之鱼', 'missing final routing rule');
  return JSON.parse(JSON.stringify(routing));
}

function readAeroveAssets(providers) {
  const { readAssetManifest } = require('./lib/aerove-rule-assets');
  return readAssetManifest({ repoRoot: ROOT, providers, fusedManifest: JSON.parse(read('rulesets/generated/fused/manifest.json')) });
}

function buildOutputs() {
  const input = read(SOURCE_PATH);
  const routing = readSharedRouting(input);
  const assetManifest = readAeroveAssets(routing.providers);
  const script = renderScript(input, assetManifest.splits);
  const aerove = projectAeroveRouting({ 'rule-providers': routing.providers, rules: routing.rules }, assetManifest.splits);
  const ruleResourceBytes = assetManifest.sources.filter(source => !assetManifest.splits[source.provider])
    .reduce((sum, source) => sum + source.bytes, 0) + assetManifest.assets.reduce((sum, asset) => sum + asset.bytes, 0);
  insist(Object.keys(aerove['rule-providers']).length <= 256 && ruleResourceBytes <= 256 * 1024 * 1024,
    'AEROVE rule resources exceed the App bundle budget; App-owned/derived resources still require final prepared validation');
  const nativeProfile = buildNativeProfile(readCmfa(), JSON.parse(JSON.stringify(routing)));
  const nativeText = renderNative(nativeProfile);
  const inputs = [SOURCE_PATH, CMFA_PATH, 'rulesets/source/routing-graph.js', 'rulesets/generated/fused/manifest.json',
    'tools/generate-meow.js', 'tools/lib/meow-native-profile.js', 'tools/lib/aerove-rule-assets.js',
    'tools/lib/aerove-rule-projection.js', 'tools/generate-aerove-rule-assets.js',
    'Meow内核系/Aerove Lite/rule-assets/manifest.json'];
  const manifest = {
    schema_version: 2, version: VERSION, build: BUILD, client: 'Meow', kernel: 'meow-rs',
    status: 'pre-adapted-awaiting-app', source_authority: 'rulesets/source/routing-graph.js',
    queue: 'docs/support-queue.md#meow',
    input_sha256_lf: Object.fromEntries(inputs.map(file => [file, hash(read(file))])),
    output: { path: SCRIPT_PATH, sha256_lf: hash(script) },
    native_output: { path: NATIVE_PATH, version: NATIVE_VERSION, sha256_lf: hash(nativeText), requires_js_host: false },
    aerove_rule_assets: { manifest: 'Meow内核系/Aerove Lite/rule-assets/manifest.json',
      assets: assetManifest.assets.map(asset => ({ path: asset.path, sha256: asset.sha256, bytes: asset.bytes })) },
    aerove_routing: { rule_count: aerove.rules.length, provider_count: Object.keys(aerove['rule-providers']).length,
      split_provider_count: Object.keys(assetManifest.splits).length, rule_resource_bytes: ruleResourceBytes,
      app_owned_and_derived_resources: 'not included; final App prepared bundle validation required' },
    client_entries: {
      meow: { name: 'Meow', readme: `${CLIENT_DIR}/README.md`, artifact: NATIVE_PATH },
      aerove_lite: { name: 'AEROVE Lite', readme: `${SCRIPT_CLIENT_DIR}/README.md`, artifact: SCRIPT_PATH }
    },
    consumers: ['meow-rs core', 'meow-android (YAML; App verification pending)', 'meow-ios (YAML; App verification pending)',
      'AEROVE Lite (JS; App verification pending)'],
    routing: { rule_count: routing.rules.length, provider_count: Object.keys(routing.providers).length,
      business_group_count: routing.business.length, maximum_region_group_count: 22 },
    js_managed_fields: ['proxies', 'proxy-providers (inline flattening only)', 'proxy-groups', 'rule-providers', 'rules'],
    js_preserved_fields: ['dns', 'hosts', 'sniffer', 'tun', 'ports', 'mode', 'external-controller', 'secret', 'geodata'],
    native_managed_fields: Object.keys(nativeProfile),
    verification: { node_vm: 'covered-by-tests', native_core: 'requires-actual-core-test', quickjs_android: 'pending', app_import: 'pending', actual_routing: 'pending' }
  };
  return { [SCRIPT_PATH]: script, [NATIVE_PATH]: nativeText, [MANIFEST_PATH]: JSON.stringify(manifest, null, 2) + '\n' };
}

function checkOutputs(outputs = buildOutputs()) {
  return Object.entries(outputs).filter(([file, text]) => !fs.existsSync(path.join(ROOT, file)) || read(file) !== text).map(([file]) => file);
}

function main() {
  const args = process.argv.slice(2);
  insist(args.every(arg => arg === '--check'), 'Usage: node tools/generate-meow.js [--check]');
  const outputs = buildOutputs();
  if (!args.includes('--check')) {
    for (const [file, text] of Object.entries(outputs)) writeRepositoryArtifact(path.join(ROOT, file), text);
  }
  const drift = checkOutputs(outputs);
  insist(drift.length === 0, `Meow generated output drift:\n${drift.join('\n')}`);
  console.log(`Meow JS + native YAML ${args.includes('--check') ? 'check OK' : 'generated and read back'}: ${VERSION}; App/core verification recorded separately`);
}

module.exports = { renderScript, renderNative, readCmfa, readSharedRouting, buildOutputs, checkOutputs,
  SCRIPT_PATH, NATIVE_PATH, MANIFEST_PATH, VERSION, NATIVE_VERSION };
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
