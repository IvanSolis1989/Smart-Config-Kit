#!/usr/bin/env node
'use strict';

const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const {
  SOURCE_GRAPH_ID,
  normalizeMihomoMrsProviderEntries,
  getTrafficOptions,
  getHealthCheckSettings,
  getQuicRules,
  getMihomoNormalizedRoutingGraph,
  getRawRoutingGraph,
} = require('../rulesets/source/routing-graph');
const {
  generateFusedFallbackArtifacts,
} = require('./generate-fused-fallback-artifacts');
const {
  canonicalizeEntry,
  materializeGeoIpEntries,
  materializeIpAsnEntries,
  optimizeEntries,
  resolveOpaqueMrsSource,
} = require('./lib/fused-rule-optimizer');
const {
  toMihomoDomainPayload,
} = require('./lib/mihomo-domain-payload');
const {
  localPathForRepositoryRuleUrl,
} = require('./lib/repository-rule-asset');
const {
  mihomoAssetCachePath,
  repositoryAssetUrl,
} = require('./lib/generated-asset-url');
const { createFusedSourceLoader } = require('./lib/fused-source-provenance');
const { downloadSource } = require('./sync-mihomo-mrs-rule-providers');
const { refreshRuleQuality } = require('./refresh-rule-quality');

const REPO_ROOT = path.resolve(__dirname, '..');
const MIHOMO_MRS_MANIFEST_FILE = path.join(REPO_ROOT, 'rulesets/generated/mihomo-mrs/manifest.json');
const FUSED_ROOT = path.join(REPO_ROOT, 'rulesets/generated/fused');
const FUSED_MIHOMO_DIR = path.join(FUSED_ROOT, 'mihomo');
const FUSED_CLASH_DIR = path.join(FUSED_ROOT, 'clash');
const FUSED_SURGE_DIR = path.join(FUSED_ROOT, 'surge');
const FUSED_QX_DIR = path.join(FUSED_ROOT, 'quantumultx');
const FUSED_EGERN_DIR = path.join(FUSED_ROOT, 'egern');
const FUSED_SING_BOX_DIR = path.join(FUSED_ROOT, 'sing-box');
const CACHE_DIR = path.join(REPO_ROOT, '.cache/fused-rule-sets');
const MIHOMO_CACHE_DIR = path.join(REPO_ROOT, '.cache/mihomo-mrs');

const MIHOMO_MRS_BASE_PATH = '/rulesets/generated/mihomo-mrs/';
const FUSED_MIHOMO_BASE_PATH = '/rulesets/generated/fused/mihomo/';
const META_GEOSITE_BASE = 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite';
const META_GEOIP_BASE = 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip';
const MIHOMO_REPO = 'MetaCubeX/mihomo';
const SING_BOX_REPO = 'SagerNet/sing-box';
const MIHOMO_REPO_API = `https://api.github.com/repos/${MIHOMO_REPO}/releases/latest`;
const SING_BOX_REPO_API = `https://api.github.com/repos/${SING_BOX_REPO}/releases/latest`;
const RELEASE_FETCH_TIMEOUT_MS = Number(process.env.SCKI_RELEASE_FETCH_TIMEOUT_MS || 15000);
const SOURCE_FETCH_TIMEOUT_MS = Number(process.env.SCKI_SOURCE_FETCH_TIMEOUT_MS || 30000);
const SCKI_OFFLINE = process.env.SCKI_OFFLINE === '1';
const sourceResolutionMemo = new Map();
const fusedSources = createFusedSourceLoader({
  repoRoot: REPO_ROOT,
  cacheDir: path.join(CACHE_DIR, 'source-receipts'),
  mrsCacheDir: path.join(MIHOMO_CACHE_DIR, 'raw-inputs'),
  offline: SCKI_OFFLINE,
  fetchSource: url => downloadSource(url, fetch, sourceResolutionMemo, { sourceTimeoutMs: SOURCE_FETCH_TIMEOUT_MS }),
});
// jsDelivr rejects files at 20 MB. Keep a 2 MiB buffer for all client-facing text assets.
const MAX_REMOTE_RULE_SET_BYTES = 18 * 1024 * 1024;

const DOMAIN_TYPES = new Set(['DOMAIN', 'DOMAIN-SUFFIX', 'DOMAIN-KEYWORD', 'DOMAIN-REGEX', 'DOMAIN-WILDCARD']);
const IPCIDR_TYPES = new Set(['IP-CIDR', 'IP-CIDR6']);
const RESIDUAL_TYPES = new Set(['PROCESS-NAME', 'PROCESS-PATH', 'PROCESS-PATH-REGEX', 'SRC-IP-CIDR', 'SRC-PORT', 'GEOSITE', 'GEOIP', 'IP-ASN']);

const INLINE_ONLY_TYPES = new Set(['AND', 'OR', 'NOT', 'DST-PORT', 'SRC-PORT', 'MATCH', 'FINAL', 'NETWORK']);
// Final Mihomo-family products should only expose generated scki-fused-* providers.
// GEO checks that must remain runtime-local are emitted as GEOSITE/GEOIP inline rules.
const REQUIRED_SUPPORT_PROVIDERS = new Set();

const POLICY_SLUGS = new Map([
  ['DIRECT', 'direct'],
  ['REJECT', 'reject'],
  ['REJECT-DROP', 'reject-drop'],
  ['🤖 AI 服务', 'ai'],
  ['💰 加密货币', 'crypto'],
  ['🏦 金融支付', 'payments'],
  ['💬 即时通讯', 'im'],
  ['📱 社交媒体', 'social'],
  ['🧑‍💼 会议协作', 'work'],
  ['📺 国内流媒体', 'cnmedia'],
  ['🎵 TikTok', 'tiktok'],
  ['🎥 Netflix', 'netflix'],
  ['🎬 Disney+', 'disney'],
  ['📡 HBO/Max', 'hbo-max'],
  ['📺 Hulu', 'hulu'],
  ['🎬 Prime Video', 'prime-video'],
  ['📹 YouTube', 'youtube'],
  ['🎵 音乐流媒体', 'music'],
  ['🇭🇰 香港流媒体', 'stream-hk'],
  ['🇹🇼 台湾流媒体', 'stream-tw'],
  ['🇯🇵 日韩流媒体', 'stream-jpkr'],
  ['🇪🇺 欧洲流媒体', 'stream-eu'],
  ['🌐 其他国外流媒体', 'stream-other'],
  ['🕹️ 国内游戏', 'game-cn'],
  ['🎮 国外游戏', 'game-intl'],
  ['🔍 Google 服务', 'google'],
  ['🔧 工具与服务', 'tools'],
  ['Ⓜ️ 微软服务', 'microsoft'],
  ['🍎 苹果服务', 'apple'],
  ['📥 下载更新', 'download'],
  ['🛰️ BT/PT Tracker', 'tracker'],
  ['🏠 国内网站', 'cn-site'],
  ['🚫 受限网站', 'gfw'],
  ['🌐 国外网站', 'intl-site'],
  ['🐟 漏网之鱼', 'final'],
  ['🛑 广告拦截', 'ad'],
]);

const PRIVATE_CIDRS = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.0.2.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  '198.51.100.0/24',
  '203.0.113.0/24',
  '224.0.0.0/4',
  '240.0.0.0/4',
  '255.255.255.255/32',
  '::1/128',
  'fc00::/7',
  'fe80::/10',
];

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}

function utf8ByteLength(text) {
  const value = String(text);
  return /[^\u0000-\u007f]/.test(value) ? Buffer.byteLength(value) : value.length;
}

function splitRemoteText(text, maxBytes = MAX_REMOTE_RULE_SET_BYTES) {
  const source = String(text);
  const parts = [];
  let start = 0;
  let cursor = 0;
  let currentBytes = 0;

  while (cursor < source.length) {
    const newline = source.indexOf('\n', cursor);
    const end = newline === -1 ? source.length : newline + 1;
    const line = source.slice(cursor, end);
    const lineBytes = utf8ByteLength(line);
    if (lineBytes > maxBytes) throw new Error(`single remote rule line exceeds ${maxBytes} bytes`);
    if (currentBytes > 0 && currentBytes + lineBytes > maxBytes) {
      parts.push(source.slice(start, cursor));
      start = cursor;
      currentBytes = 0;
    }
    currentBytes += lineBytes;
    cursor = end;
  }

  if (start < source.length || parts.length === 0) parts.push(source.slice(start));
  return parts;
}

function shardFileName(file, index, total) {
  if (total === 1) return file;
  const extension = path.extname(file);
  const stem = extension ? file.slice(0, -extension.length) : file;
  return `${stem}-part-${String(index + 1).padStart(3, '0')}${extension}`;
}

function writeRemoteTextParts(directory, file, text) {
  const parts = splitRemoteText(text);
  const files = parts.map((part, index) => shardFileName(file, index, parts.length));
  for (let index = 0; index < parts.length; index += 1) writeText(path.join(directory, files[index]), parts[index]);
  return files;
}

function remoteTextFileRecord(files) {
  if (files.length === 1) return { format: 'text', file: files[0] };
  return { format: 'text', parts: files, max_bytes: MAX_REMOTE_RULE_SET_BYTES };
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function safeSlug(value) {
  return String(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'rules';
}

function policySlug(policy) {
  return POLICY_SLUGS.get(policy) || safeSlug(policy);
}

function splitTopLevel(rule) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of String(rule)) {
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim());
}

function stripInlineComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if ((char === '"' || char === "'") && line[i - 1] !== '\\') {
      quote = quote === char ? null : quote || char;
    }
    if (char === '#' && !quote) return line.slice(0, i);
  }
  return line;
}

function parsePayloadEntries(text) {
  const normalized = String(text || '').replace(/\r\n/g, '\n');
  const hasPayload = /^payload:\s*$/m.test(normalized);
  const entries = [];
  let inPayload = !hasPayload;
  for (const rawLine of normalized.split('\n')) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;
    if (line === 'payload:') {
      inPayload = true;
      continue;
    }
    if (!inPayload) continue;
    const itemMatch = line.match(/^-\s*(.+)$/);
    if (itemMatch) line = itemMatch[1].trim();
    else if (hasPayload) continue;
    line = stripInlineComment(line).trim().replace(/^['"]|['"]$/g, '').trim();
    if (line && !line.startsWith('#')) entries.push(line);
  }
  return entries;
}

function runSourceRoutingGraphBaseline(options = {}) {
  const originalRandom = Math.random;
  let output;
  try {
    if (options.deterministicIntervals) Math.random = () => 0;
    output = getMihomoNormalizedRoutingGraph();
  } finally {
    Math.random = originalRandom;
  }
  return {
    version: output.version,
    providers: output['rule-providers'] || {},
    rules: output.rules || [],
    logs: [],
  };
}

function encodeRuleAssetName(name) {
  return encodeURIComponent(name).replace(/%21/g, '%21');
}

function metaSourceForMrsUrl(url) {
  const match = String(url || '').match(/^https:\/\/(?:fastly\.|cdn\.)?jsdelivr\.net\/gh\/MetaCubeX\/meta-rules-dat@meta\/geo\/(geosite|geoip)\/(.+)\.mrs$/i);
  if (!match) return null;
  const [, family, name] = match;
  const file = encodeRuleAssetName(decodeURIComponent(name));
  const base = family === 'geosite' ? META_GEOSITE_BASE : META_GEOIP_BASE;
  return {
    sourceUrl: `${base}/${file}.yaml`,
    sourceFilter: family === 'geosite' ? 'domain' : 'ipcidr',
  };
}

function readMihomoMrsSourceMap(manifest = null) {
  const byFile = new Map();
  if (!manifest) {
    if (!fs.existsSync(MIHOMO_MRS_MANIFEST_FILE)) return byFile;
    manifest = JSON.parse(readText(MIHOMO_MRS_MANIFEST_FILE));
  }
  for (const row of [...(manifest.converted || []), ...(manifest.split || []), ...(manifest.partial || [])]) {
    for (const generated of row.generated || []) {
      byFile.set(generated.file, {
        id: row.id,
        sourceUrl: row.source_url,
        localPath: row.source_receipt?.local_path ? path.resolve(REPO_ROOT, row.source_receipt.local_path) : null,
        sourceFilter: generated.behavior,
        expectedReceipt: row.source_receipt || null,
      });
    }
    if (row.residual) {
      byFile.set(row.residual.file, {
        id: row.id,
        localPath: path.join(REPO_ROOT, 'rulesets/generated/mihomo-mrs', row.residual.file),
        sourceFilter: null,
        expectedReceipt: row.residual.output_receipt || null,
      });
    }
  }
  return byFile;
}

function sourceInfoForGeneratedMihomoMrs(url, byFile) {
  if (!String(url || '').includes(MIHOMO_MRS_BASE_PATH)) return null;
  const file = decodeURIComponent(String(url).split(MIHOMO_MRS_BASE_PATH).pop().split(/[?#]/)[0]);
  return byFile.get(file) || null;
}

function sourceInfoForProvider(provider, byFile) {
  if (!provider || !provider.url) return null;
  const providerFilter = provider.behavior === 'domain' || provider.behavior === 'ipcidr' ? provider.behavior : null;
  // Generated residuals and local MRS inputs must retain their recorded receipt
  // before the generic repository URL shortcut is considered.
  const generated = sourceInfoForGeneratedMihomoMrs(provider.url, byFile);
  if (generated) return generated;

  const opaqueMrs = resolveOpaqueMrsSource(provider.url);
  if (opaqueMrs) return opaqueMrs;
  const local = localPathForRepositoryRuleUrl(provider.url);
  if (local && !/\.mrs$/i.test(local)) return { localPath: local, sourceFilter: providerFilter };

  const meta = metaSourceForMrsUrl(provider.url);
  if (meta) return meta;

  if (/\.mrs(?:[?#].*)?$/i.test(provider.url)) return null;

  return {
    sourceUrl: String(provider.url)
      .replace('https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/', 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/')
      .replace('https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/', 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/'),
    sourceFilter: providerFilter,
  };
}

async function fetchText(url) {
  return (await fusedSources.load({ sourceUrl: url })).text;
}

async function loadSourceEntries(sourceInfo) {
  if (!sourceInfo) return null;
  const { text } = await fusedSources.load(sourceInfo);
  let entries = parsePayloadEntries(text);
  if (sourceInfo.sourceFilter) {
    entries = entries.filter((entry) => classifyEntry(entry).bucket === sourceInfo.sourceFilter);
  }
  const providerId = sourceInfo.id || sourceInfo.providerId;
  if (providerId) entries = normalizeMihomoMrsProviderEntries(String(providerId).replace(/^GEOSITE:/, "geosite:"), entries);
  return entries;
}

async function expandResolvableEntries(entries) {
  const output = [];
  for (const rawEntry of entries) {
    const entry = canonicalizeEntry(rawEntry);
    const parts = splitTopLevel(entry);
    const type = String(parts[0] || '').toUpperCase();
    if (type === 'GEOSITE' && parts[1]) {
      const nested = await loadSourceEntries({ sourceUrl: `${META_GEOSITE_BASE}/${encodeRuleAssetName(parts[1])}.yaml`, sourceFilter: 'domain' });
      output.push(...(nested || []).map(canonicalizeEntry));
      continue;
    }
    if (type === 'GEOIP' && parts[1]) {
      output.push(entry);
      continue;
    }
    output.push(entry);
  }
  return output;
}

function classifyEntry(entry) {
  const text = String(entry || '').trim();
  if (!text) return { bucket: 'unknown', type: 'EMPTY' };
  if (!text.includes(',')) {
    if (/^[0-9a-fA-F:.]+\/\d+$/.test(text)) return { bucket: 'ipcidr', type: text.includes(':') ? 'IP-CIDR6' : 'IP-CIDR', value: text };
    return { bucket: 'domain', type: 'DOMAIN-SET', value: text };
  }
  const parts = splitTopLevel(text);
  const type = String(parts[0] || '').toUpperCase().replace(/\s+/g, '');
  if (DOMAIN_TYPES.has(type)) return { bucket: 'domain', type, value: parts[1] || '', parts };
  if (IPCIDR_TYPES.has(type)) return { bucket: 'ipcidr', type, value: parts[1] || '', parts };
  if (RESIDUAL_TYPES.has(type)) return { bucket: 'residual', type, value: parts[1] || '', parts };
  return { bucket: 'unsupported', type, value: parts[1] || '', parts };
}

function entryToClassical(entry) {
  const classical = canonicalizeEntry(entry);
  const info = classifyEntry(classical);
  if (info.bucket === 'domain' || info.bucket === 'ipcidr' || info.bucket === 'residual') return classical;
  return null;
}

function entryToQx(entry) {
  const classical = entryToClassical(entry);
  if (!classical) return null;
  const parts = splitTopLevel(classical);
  const type = parts[0];
  if (type === 'DOMAIN') return `host, ${parts[1]}`;
  if (type === 'DOMAIN-SUFFIX') return `host-suffix, ${parts[1]}`;
  if (type === 'DOMAIN-KEYWORD') return `host-keyword, ${parts[1]}`;
  if (type === 'IP-CIDR') return `ip-cidr, ${parts[1]}${parts.includes('no-resolve') ? ', no-resolve' : ''}`;
  if (type === 'IP-CIDR6') return `ip6-cidr, ${parts[1]}${parts.includes('no-resolve') ? ', no-resolve' : ''}`;
  if (type === 'GEOIP') return `geoip, ${parts[1].toLowerCase()}${parts.includes('no-resolve') ? ', no-resolve' : ''}`;
  if (type === 'IP-ASN') return `ip-asn, ${parts[1]}${parts.includes('no-resolve') ? ', no-resolve' : ''}`;
  return null;
}

function addToSingBoxRule(rule, entry) {
  const classical = entryToClassical(entry);
  if (!classical) return false;
  const parts = splitTopLevel(classical);
  const type = parts[0];
  const value = parts[1];
  if (type === 'DOMAIN') (rule.domain ||= []).push(value);
  else if (type === 'DOMAIN-SUFFIX') (rule.domain_suffix ||= []).push(value);
  else if (type === 'DOMAIN-KEYWORD') (rule.domain_keyword ||= []).push(value);
  else if (type === 'DOMAIN-REGEX') (rule.domain_regex ||= []).push(value);
  else if (type === 'IP-CIDR' || type === 'IP-CIDR6') (rule.ip_cidr ||= []).push(value);
  else if (type === 'SRC-IP-CIDR') (rule.source_ip_cidr ||= []).push(value);
  else if (type === 'PROCESS-NAME') (rule.process_name ||= []).push(value);
  else if (type === 'PROCESS-PATH') (rule.process_path ||= []).push(value);
  else if (type === 'PROCESS-PATH-REGEX') (rule.process_path_regex ||= []).push(value);
  else return false;
  return true;
}

function addToEgernSets(sets, entry) {
  const classical = entryToClassical(entry);
  if (!classical) return;
  const parts = splitTopLevel(classical);
  const type = parts[0];
  const value = parts[1];
  const map = {
    DOMAIN: 'domain_set',
    'DOMAIN-SUFFIX': 'domain_suffix_set',
    'DOMAIN-KEYWORD': 'domain_keyword_set',
    'DOMAIN-REGEX': 'domain_regex_set',
    'DOMAIN-WILDCARD': 'domain_wildcard_set',
    'IP-CIDR': 'ip_cidr_set',
    'IP-CIDR6': 'ip_cidr6_set',
    GEOIP: 'geoip_set',
    'IP-ASN': 'asn_set',
  };
  const key = map[type];
  if (key) (sets[key] ||= []).push(value);
}

function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

function createSegment(index, policy) {
  const prefix = `scki-fused-${String(index).padStart(3, '0')}-${policySlug(policy)}`;
  return {
    id: prefix,
    policy,
    sourceRules: [],
    domain: [],
    ipcidr: [],
    ipcidrNoResolve: [],
    residual: [],
    optimization: null,
  };
}

function getSourceSegmentCatalog(rules) {
  const segments = [];
  let current = null;
  for (const rule of rules) {
    const parts = splitTopLevel(rule);
    if (INLINE_ONLY_TYPES.has(parts[0])) { current = null; continue; }
    if (!current || current.policy !== parts[2]) {
      current = { id: createSegment(segments.length + 1, parts[2]).id, policy: parts[2], source_rules: [] };
      segments.push(current);
    }
    current.source_rules.push(rule);
  }
  return segments;
}

function segmentHasPayload(segment) {
  return segment.domain.length || segment.ipcidr.length || segment.ipcidrNoResolve.length || segment.residual.length;
}

function addEntriesToSegment(segment, rule, entries, noResolve) {
  segment.sourceRules.push(rule);
  for (const rawEntry of entries) {
    let entry = canonicalizeEntry(rawEntry);
    const info = classifyEntry(entry);
    if (info.bucket === 'domain') {
      // DOMAIN-KEYWORD and DOMAIN-REGEX cannot be represented by a domain MRS.
      // Keep them in the segment's classical residual provider instead of widening them.
      if (toMihomoDomainPayload(entry)) segment.domain.push(entry);
      else segment.residual.push(entry);
    }
    else if (info.bucket === 'ipcidr') {
      const parts = splitTopLevel(entry);
      const entryNoResolve = parts.includes('no-resolve');
      const bucketEntry = parts.filter((part) => part !== 'no-resolve').join(',');
      if (noResolve || entryNoResolve) segment.ipcidrNoResolve.push(bucketEntry);
      else segment.ipcidr.push(bucketEntry);
    } else if (info.bucket === 'residual') {
      if (noResolve && (info.type === 'GEOIP' || info.type === 'IP-ASN') && !splitTopLevel(entry).includes('no-resolve')) {
        entry = `${entry},no-resolve`;
      }
      segment.residual.push(entry);
    } else {
      throw new Error(`unsupported fused entry from ${rule}: ${entry}`);
    }
  }
}

function sumOptimizationStats(rows) {
  return rows.reduce((total, row) => {
    for (const key of ['input', 'output', 'exactDuplicates', 'domainSubsumed', 'cidrSubsumed', 'normalized']) {
      total[key] += row[key] || 0;
    }
    return total;
  }, { input: 0, output: 0, exactDuplicates: 0, domainSubsumed: 0, cidrSubsumed: 0, normalized: 0 });
}

function optimizeSegment(segment) {
  const buckets = {};
  for (const key of ['domain', 'ipcidr', 'ipcidrNoResolve', 'residual']) {
    const result = optimizeEntries(segment[key]);
    segment[key] = result.entries;
    buckets[key] = result.stats;
  }
  const total = sumOptimizationStats(Object.values(buckets));
  return {
    ...total,
    removed: total.input - total.output,
    buckets,
  };
}

function removeGloballyRepeatedEntries(segments) {
  const seenByBucket = new Map([
    ['domain', new Set()],
    ['ipcidr', new Set()],
    ['ipcidrNoResolve', new Set()],
    ['residual', new Set()],
  ]);
  let removed = 0;
  for (const segment of segments) {
    let segmentRemoved = 0;
    for (const [key, seen] of seenByBucket) {
      let bucketRemoved = 0;
      segment[key] = segment[key].filter((entry) => {
        if (seen.has(entry)) {
          bucketRemoved += 1;
          return false;
        }
        seen.add(entry);
        return true;
      });
      if (bucketRemoved) {
        segment.optimization.buckets[key].output -= bucketRemoved;
        segment.optimization.buckets[key].globalExactDuplicates = bucketRemoved;
      }
      segmentRemoved += bucketRemoved;
    }
    segment.optimization.globalExactDuplicates = segmentRemoved;
    segment.optimization.output -= segmentRemoved;
    segment.optimization.removed += segmentRemoved;
    removed += segmentRemoved;
  }
  return removed;
}

function removeTargetRepeatedEntries(result, seen) {
  let removed = 0;
  const entries = result.entries.filter((entry) => {
    if (seen.has(entry)) {
      removed += 1;
      return false;
    }
    seen.add(entry);
    return true;
  });
  return {
    entries,
    stats: {
      ...result.stats,
      output: entries.length,
      globalExactDuplicates: removed,
    },
  };
}

async function resolveMainRule(rule, providers, sourceMap, stats) {
  const parts = splitTopLevel(rule);
  const type = parts[0];
  if (INLINE_ONLY_TYPES.has(type)) return { fusable: false, rule, reason: type };
  if (type === 'RULE-SET') {
    const providerName = parts[1];
    const provider = providers[providerName];
    const policy = parts[2];
    if (!provider) return { fusable: false, rule, reason: `missing-provider:${providerName}` };
    const sourceInfo = sourceInfoForProvider({ ...provider, name: providerName }, sourceMap);
    if (sourceInfo) sourceInfo.providerId = providerName;
    let rawEntries = null;
    try {
      rawEntries = await loadSourceEntries(sourceInfo);
      if (!rawEntries) throw new Error('missing-source-info');
      rawEntries = await expandResolvableEntries(rawEntries);
    } catch (error) {
      stats.unresolvedProviders.push({ id: providerName, error: error.message });
      throw new Error(`cannot fuse provider ${providerName}: ${error.message}`);
    }
    return { fusable: true, policy, entries: rawEntries, noResolve: parts.includes('no-resolve'), source: providerName };
  }
  if (type === 'GEOSITE') {
    const name = parts[1];
    let entries = null;
    try {
      entries = await loadSourceEntries({ sourceUrl: `${META_GEOSITE_BASE}/${encodeRuleAssetName(name)}.yaml`, sourceFilter: 'domain', providerId: `GEOSITE:${name}` });
    } catch (error) {
      stats.unresolvedSources.push({ id: `GEOSITE:${name}`, error: error.message });
      throw new Error(`cannot fuse GEOSITE:${name}: ${error.message}`);
    }
    return { fusable: true, policy: parts[2], entries: entries.map(canonicalizeEntry), noResolve: false, source: `GEOSITE:${name}` };
  }
  if (type === 'GEOIP') {
    const name = parts[1];
    return {
      fusable: true,
      policy: parts[2],
      entries: [`GEOIP,${name}`],
      noResolve: parts.includes('no-resolve'),
      source: `GEOIP:${name}`,
    };
  }
  if (DOMAIN_TYPES.has(type) || IPCIDR_TYPES.has(type) || RESIDUAL_TYPES.has(type)) {
    return {
      fusable: true,
      policy: parts[2],
      entries: [[type, parts[1], ...parts.slice(3).filter((part) => part !== 'no-resolve')].join(',')],
      noResolve: parts.includes('no-resolve'),
      source: 'inline',
    };
  }
  return { fusable: false, rule, reason: type || 'unknown' };
}

async function buildSegments(clashOutput) {
  const sourceMap = readMihomoMrsSourceMap();
  const stats = {
    unresolvedProviders: [],
    unresolvedSources: [],
    passthroughProviderIds: new Set(),
    optimization: null,
  };
  const segments = [];
  const inlineRules = [];
  const timeline = [];
  let current = null;
  let index = 1;

  function flush() {
    if (current && segmentHasPayload(current)) {
      current.optimization = optimizeSegment(current);
      segments.push(current);
      timeline.push({ type: 'segment', segment: current });
    }
    current = null;
  }

  for (const rule of clashOutput.rules) {
    const resolved = await resolveMainRule(rule, clashOutput.providers, sourceMap, stats);
    if (!resolved.fusable) {
      flush();
      inlineRules.push(rule);
      timeline.push({ type: 'inline', rule });
      continue;
    }
    if (!current || current.policy !== resolved.policy) {
      flush();
      current = createSegment(index, resolved.policy);
      index += 1;
    }
    addEntriesToSegment(current, rule, resolved.entries, resolved.noResolve);
  }
  flush();
  const globalExactDuplicates = removeGloballyRepeatedEntries(segments);
  const optimization = sumOptimizationStats(segments.map((segment) => segment.optimization));
  const prunedEmptySegments = segments
    .filter((segment) => !segmentHasPayload(segment))
    .map((segment) => segment.id);
  stats.optimization = {
    ...optimization,
    globalExactDuplicates,
    removed: optimization.input - optimization.output,
  };
  stats.prunedEmptySegments = prunedEmptySegments;
  if (prunedEmptySegments.length) {
    const pruned = new Set(prunedEmptySegments);
    segments.splice(0, segments.length, ...segments.filter((segment) => !pruned.has(segment.id)));
    timeline.splice(0, timeline.length, ...timeline.filter(
      (event) => event.type !== 'segment' || !pruned.has(event.segment.id),
    ));
  }
  return { segments, inlineRules, timeline, stats };
}

function renderPayload(entries) {
  const lines = ['payload:'];
  for (const entry of entries) lines.push(`  - ${yamlQuote(entry)}`);
  lines.push('');
  return lines.join('\n');
}

function normalizeIpCidrEntry(entry) {
  const text = String(entry || '').trim();
  if (!text.includes(',')) return text;
  const parts = splitTopLevel(text);
  return String(parts[1] || '').trim();
}

function renderClassicalList(entries, { includeProcess }) {
  return `${dedupe(entries.map(entryToClassical).filter((entry) => {
    if (!entry) return false;
    if (!includeProcess && /^PROCESS-/.test(entry)) return false;
    return true;
  })).join('\n')}\n`;
}

function renderQxList(entries) {
  return `${dedupe(entries.map(entryToQx).filter(Boolean)).join('\n')}\n`;
}

function renderEgernYaml(entries) {
  const sets = {};
  for (const entry of entries) addToEgernSets(sets, entry);
  const lines = [
    '# Generated by tools/build-fused-rule-sets.js',
  ];
  const ipEntries = entries.map(entryToClassical).filter((entry) => /^(?:GEOIP|IP-ASN|IP-CIDR|IP-CIDR6),/.test(entry || ''));
  if (ipEntries.length && ipEntries.every((entry) => splitTopLevel(entry).includes('no-resolve'))) lines.push('no_resolve: true');
  for (const key of [
    'domain_set',
    'domain_suffix_set',
    'domain_keyword_set',
    'domain_regex_set',
    'domain_wildcard_set',
    'geoip_set',
    'ip_cidr_set',
    'ip_cidr6_set',
    'asn_set',
  ]) {
    const values = dedupe(sets[key] || []);
    if (!values.length) continue;
    lines.push(`${key}:`);
    for (const value of values) lines.push(`  - ${yamlQuote(value)}`);
  }
  lines.push('');
  return lines.join('\n');
}

function renderSingBoxSource(entries) {
  const rule = {};
  const unsupported = entries.filter((entry) => !addToSingBoxRule(rule, entry));
  if (unsupported.length) throw new Error(`unsupported sing-box target entries: ${unsupported.slice(0, 10).join(' | ')}`);
  for (const key of Object.keys(rule)) rule[key] = dedupe(rule[key]);
  return `${JSON.stringify({ version: 3, rules: Object.keys(rule).length ? [rule] : [] }, null, 2)}\n`;
}

function entriesWithNoResolve(segment) {
  const addModifier = (entry) => splitTopLevel(entry).includes('no-resolve') ? entry : `${entry},no-resolve`;
  return [
    ...segment.domain,
    ...segment.ipcidr,
    ...segment.ipcidrNoResolve.map(addModifier),
    ...segment.residual,
  ];
}

function countTargetIpEntries(entries) {
  return entries.reduce((total, entry) => {
    const type = splitTopLevel(entry)[0];
    return total + (['IP-CIDR', 'IP-CIDR6', 'SRC-IP-CIDR', 'GEOIP', 'IP-ASN', 'ASN'].includes(type) ? 1 : 0);
  }, 0);
}

async function resolveGeoIpCidrs(name) {
  if (name === 'private') return PRIVATE_CIDRS;
  const entries = await loadSourceEntries({
    sourceUrl: `${META_GEOIP_BASE}/${encodeRuleAssetName(name)}.yaml`,
    sourceFilter: 'ipcidr',
  });
  if (!entries || !entries.length) throw new Error(`GEOIP:${name} resolved to an empty CIDR set`);
  return entries;
}

async function resolveAsnCidrs(asn) {
  const text = await fetchText(`https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS${asn}`);
  const payload = JSON.parse(text);
  const prefixes = payload && payload.data && payload.data.prefixes;
  if (!Array.isArray(prefixes) || !prefixes.length) throw new Error(`IP-ASN:${asn} resolved to an empty prefix set`);
  return prefixes.map((row) => row.prefix).filter(Boolean);
}

async function materializeTargetEntries(entries, options) {
  const geoip = await materializeGeoIpEntries(entries, resolveGeoIpCidrs, {
    preserve: options.nativeCountryGeoIp ? (name) => /^[a-z]{2}$/.test(name) : null,
  });
  const asn = await materializeIpAsnEntries(geoip, resolveAsnCidrs, { preserve: options.nativeAsn });
  const normalized = options.ignoreNoResolve
    ? asn.map((entry) => splitTopLevel(entry).filter((part) => part !== 'no-resolve').join(','))
    : asn;
  return optimizeEntries(normalized);
}

async function downloadJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RELEASE_FETCH_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'Smart-Config-Kit-Fused-Rules/1.0' },
    });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return response.json();
}

function findExecutable(command) {
  try {
    const finder = process.platform === 'win32' ? 'where.exe' : 'which';
    const found = childProcess.execFileSync(finder, [command], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).split(/\r?\n/)[0].trim();
    return found || null;
  } catch {
    return null;
  }
}

function configuredExecutable(envName, commands) {
  const configured = process.env[envName];
  if (configured) {
    if (!fs.existsSync(configured)) throw new Error(`${envName} points to missing file: ${configured}`);
    return configured;
  }
  for (const command of commands) {
    const found = findExecutable(command);
    if (found) return found;
  }
  return null;
}

function readReleaseWithGhCli(repo) {
  try {
    const raw = childProcess.execFileSync('gh', ['release', 'view', '-R', repo, '--json', 'tagName,assets'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const release = JSON.parse(raw);
    return {
      tag_name: release.tagName,
      assets: (release.assets || []).map((asset) => ({
        name: asset.name,
        browser_download_url: asset.url,
      })),
    };
  } catch {
    return null;
  }
}

async function downloadRelease(repo, apiUrl) {
  const ghRelease = readReleaseWithGhCli(repo);
  if (ghRelease) return ghRelease;
  return downloadJson(apiUrl);
}

async function downloadBuffer(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RELEASE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'Smart-Config-Kit-Fused-Rules/1.0' },
    });
    if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    const curl = findExecutable(process.platform === 'win32' ? 'curl.exe' : 'curl');
    if (!curl) throw error;
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const urlPath = new URL(url).pathname;
    const filename = path.basename(urlPath) || `download-${Date.now()}`;
    const target = path.join(CACHE_DIR, `${Date.now()}-${filename}`);
    const result = childProcess.spawnSync(curl, ['-L', '--fail', '--silent', '--show-error', '-o', target, url], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      if (fs.existsSync(target)) fs.rmSync(target, { force: true });
      throw new Error(result.stderr || result.stdout || error.message);
    }
    const buffer = fs.readFileSync(target);
    fs.rmSync(target, { force: true });
    return buffer;
  } finally {
    clearTimeout(timer);
  }
}

function mihomoAssetPattern() {
  const arch = os.arch();
  if (process.platform === 'win32') {
    if (arch !== 'x64') throw new Error(`Unsupported Windows arch: ${arch}`);
    return /^mihomo-windows-amd64-compatible-.*\.zip$/;
  }
  if (process.platform === 'linux') {
    if (arch === 'x64') return /^mihomo-linux-amd64-compatible-.*\.gz$/;
    if (arch === 'arm64') return /^mihomo-linux-arm64-.*\.gz$/;
  }
  if (process.platform === 'darwin') {
    if (arch === 'x64') return /^mihomo-darwin-amd64-compatible-.*\.gz$/;
    if (arch === 'arm64') return /^mihomo-darwin-arm64-.*\.gz$/;
  }
  throw new Error(`Unsupported platform for mihomo: ${process.platform}/${arch}`);
}

async function ensureMihomoBinary() {
  const configured = configuredExecutable('SCKI_MIHOMO_BIN', process.platform === 'win32' ? ['mihomo.exe', 'mihomo'] : ['mihomo']);
  if (configured) return configured;

  fs.mkdirSync(MIHOMO_CACHE_DIR, { recursive: true });
  const existing = fs.readdirSync(MIHOMO_CACHE_DIR).find((file) => /^mihomo-v.*\.exe$/.test(file) || /^mihomo-v/.test(file));
  if (existing) return path.join(MIHOMO_CACHE_DIR, existing);

  const release = await downloadRelease(MIHOMO_REPO, MIHOMO_REPO_API);
  const asset = release.assets.find((candidate) => mihomoAssetPattern().test(candidate.name));
  if (!asset) throw new Error('No mihomo release asset found');
  const target = path.join(MIHOMO_CACHE_DIR, `mihomo-${release.tag_name}${process.platform === 'win32' ? '.exe' : ''}`);
  if (fs.existsSync(target)) return target;
  const archive = path.join(MIHOMO_CACHE_DIR, asset.name);
  fs.writeFileSync(archive, await downloadBuffer(asset.browser_download_url));
  if (asset.name.endsWith('.gz')) {
    fs.writeFileSync(target, zlib.gunzipSync(fs.readFileSync(archive)));
    fs.chmodSync(target, 0o755);
  } else {
    const unzipDir = path.join(MIHOMO_CACHE_DIR, `unzip-${release.tag_name}`);
    fs.rmSync(unzipDir, { recursive: true, force: true });
    fs.mkdirSync(unzipDir, { recursive: true });
    const result = childProcess.spawnSync('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath ${JSON.stringify(archive)} -DestinationPath ${JSON.stringify(unzipDir)} -Force`], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Expand-Archive failed');
    const exe = fs.readdirSync(unzipDir).find((file) => file.endsWith('.exe'));
    if (!exe) throw new Error(`No mihomo exe in ${asset.name}`);
    fs.copyFileSync(path.join(unzipDir, exe), target);
  }
  return target;
}

function convertWithMihomo(mihomoBin, behavior, sourceFile, targetFile) {
  const result = childProcess.spawnSync(mihomoBin, ['convert-ruleset', behavior, 'yaml', sourceFile, targetFile], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`mihomo convert-ruleset ${behavior} failed: ${result.stderr || result.stdout}`);
}

function singBoxAssetPattern() {
  const arch = os.arch();
  if (process.platform === 'win32' && arch === 'x64') return /sing-box-.*-windows-amd64\.zip$/;
  if (process.platform === 'linux' && arch === 'x64') return /sing-box-.*-linux-amd64\.tar\.gz$/;
  if (process.platform === 'linux' && arch === 'arm64') return /sing-box-.*-linux-arm64\.tar\.gz$/;
  if (process.platform === 'darwin' && arch === 'x64') return /sing-box-.*-darwin-amd64\.tar\.gz$/;
  if (process.platform === 'darwin' && arch === 'arm64') return /sing-box-.*-darwin-arm64\.tar\.gz$/;
  return null;
}

async function ensureSingBoxBinary() {
  const command = process.platform === 'win32' ? 'sing-box.exe' : 'sing-box';
  const configured = configuredExecutable('SCKI_SING_BOX_BIN', process.platform === 'win32' ? ['sing-box.exe', 'sing-box'] : ['sing-box']);
  if (configured) return configured;

  const pattern = singBoxAssetPattern();
  if (!pattern) return null;
  const dir = path.join(CACHE_DIR, 'sing-box');
  fs.mkdirSync(dir, { recursive: true });
  const existing = fs.readdirSync(dir).find((file) => file === command || file === 'sing-box.exe');
  if (existing) return path.join(dir, existing);

  const release = await downloadRelease(SING_BOX_REPO, SING_BOX_REPO_API);
  const asset = release.assets.find((candidate) => pattern.test(candidate.name));
  if (!asset) return null;
  const archive = path.join(dir, asset.name);
  fs.writeFileSync(archive, await downloadBuffer(asset.browser_download_url));
  const extractDir = path.join(dir, `unpack-${release.tag_name}`);
  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir, { recursive: true });
  if (asset.name.endsWith('.zip')) {
    const result = childProcess.spawnSync('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath ${JSON.stringify(archive)} -DestinationPath ${JSON.stringify(extractDir)} -Force`], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Expand-Archive failed');
  } else {
    const result = childProcess.spawnSync('tar', ['-xzf', archive, '-C', extractDir], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'tar failed');
  }
  const stack = [extractDir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name === command || entry.name === 'sing-box.exe') {
        const target = path.join(dir, command);
        fs.copyFileSync(full, target);
        if (process.platform !== 'win32') fs.chmodSync(target, 0o755);
        return target;
      }
    }
  }
  return null;
}

function compileSingBoxRuleSet(singBoxBin, sourceFile, targetFile) {
  if (!singBoxBin) return false;
  const result = childProcess.spawnSync(singBoxBin, ['rule-set', 'compile', '--output', targetFile, sourceFile], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    console.warn(`sing-box rule-set compile failed for ${sourceFile}: ${result.stderr || result.stdout}`);
    return false;
  }
  return true;
}

async function writeFusedRuleSets(segments) {
  fs.rmSync(FUSED_ROOT, { recursive: true, force: true });
  fs.mkdirSync(FUSED_MIHOMO_DIR, { recursive: true });
  fs.mkdirSync(FUSED_CLASH_DIR, { recursive: true });
  fs.mkdirSync(FUSED_SURGE_DIR, { recursive: true });
  fs.mkdirSync(FUSED_QX_DIR, { recursive: true });
  fs.mkdirSync(FUSED_EGERN_DIR, { recursive: true });
  fs.mkdirSync(FUSED_SING_BOX_DIR, { recursive: true });

  const mihomoBin = await ensureMihomoBinary();
  const singBoxBin = await ensureSingBoxBinary();
  const manifestSegments = [];
  let generatedMrs = 0;
  let generatedSrs = 0;
  const seenMobileEntries = new Set();
  const seenSingBoxEntries = new Set();

  for (const segment of segments) {
    const allEntries = entriesWithNoResolve(segment);
    const mobileEntries = removeTargetRepeatedEntries(
      await materializeTargetEntries(allEntries, { nativeCountryGeoIp: true, nativeAsn: true }),
      seenMobileEntries,
    );
    const singBoxEntries = removeTargetRepeatedEntries(
      await materializeTargetEntries(allEntries, { nativeCountryGeoIp: false, nativeAsn: false, ignoreNoResolve: true }),
      seenSingBoxEntries,
    );
    const row = {
      id: segment.id,
      policy: segment.policy,
      source_rules: segment.sourceRules.length,
      files: {},
      counts: {
        domain: segment.domain.length,
        ipcidr: segment.ipcidr.length,
        ipcidr_no_resolve: segment.ipcidrNoResolve.length,
        residual: segment.residual.length,
      },
      optimization: segment.optimization,
      target_counts: {
        mobile: mobileEntries.entries.length,
        sing_box: singBoxEntries.entries.length,
      },
      target_ip_counts: {
        mobile: countTargetIpEntries(mobileEntries.entries),
        sing_box: countTargetIpEntries(singBoxEntries.entries),
      },
      target_optimization: {
        mobile: mobileEntries.stats,
        sing_box: singBoxEntries.stats,
      },
    };

    if (segment.domain.length) {
      const yamlFile = `${segment.id}-domain.yaml`;
      const mrsFile = `${segment.id}-domain.mrs`;
      writeText(
        path.join(FUSED_MIHOMO_DIR, yamlFile),
        renderPayload(segment.domain.map(toMihomoDomainPayload).filter(Boolean)),
      );
      convertWithMihomo(mihomoBin, 'domain', path.join(FUSED_MIHOMO_DIR, yamlFile), path.join(FUSED_MIHOMO_DIR, mrsFile));
      row.files.domain = { behavior: 'domain', format: 'mrs', file: mrsFile, source: yamlFile };
      generatedMrs += 1;
    }
    if (segment.ipcidr.length) {
      const yamlFile = `${segment.id}-ipcidr.yaml`;
      const mrsFile = `${segment.id}-ipcidr.mrs`;
      writeText(path.join(FUSED_MIHOMO_DIR, yamlFile), renderPayload(segment.ipcidr.map(normalizeIpCidrEntry).filter(Boolean)));
      convertWithMihomo(mihomoBin, 'ipcidr', path.join(FUSED_MIHOMO_DIR, yamlFile), path.join(FUSED_MIHOMO_DIR, mrsFile));
      row.files.ipcidr = { behavior: 'ipcidr', format: 'mrs', file: mrsFile, source: yamlFile, no_resolve: false };
      generatedMrs += 1;
    }
    if (segment.ipcidrNoResolve.length) {
      const yamlFile = `${segment.id}-ipcidr-no-resolve.yaml`;
      const mrsFile = `${segment.id}-ipcidr-no-resolve.mrs`;
      writeText(path.join(FUSED_MIHOMO_DIR, yamlFile), renderPayload(segment.ipcidrNoResolve.map(normalizeIpCidrEntry).filter(Boolean)));
      convertWithMihomo(mihomoBin, 'ipcidr', path.join(FUSED_MIHOMO_DIR, yamlFile), path.join(FUSED_MIHOMO_DIR, mrsFile));
      row.files.ipcidr_no_resolve = { behavior: 'ipcidr', format: 'mrs', file: mrsFile, source: yamlFile, no_resolve: true };
      generatedMrs += 1;
    }
    if (segment.residual.length) {
      const residualFile = `${segment.id}-residual.yaml`;
      writeText(path.join(FUSED_MIHOMO_DIR, residualFile), renderPayload(segment.residual));
      row.files.residual = { behavior: 'classical', format: 'yaml', file: residualFile };
    }

    let clashFiles = [];
    let surgeFiles = [];
    let quantumultxFiles = [];
    if (mobileEntries.entries.length > 0) {
      clashFiles = writeRemoteTextParts(FUSED_CLASH_DIR, `${segment.id}.list`, renderClassicalList(mobileEntries.entries, { includeProcess: false }));
      surgeFiles = writeRemoteTextParts(FUSED_SURGE_DIR, `${segment.id}.list`, renderClassicalList(mobileEntries.entries, { includeProcess: true }));
      quantumultxFiles = writeRemoteTextParts(FUSED_QX_DIR, `${segment.id}.list`, renderQxList(mobileEntries.entries));
      writeText(path.join(FUSED_EGERN_DIR, `${segment.id}.yaml`), renderEgernYaml(mobileEntries.entries));
      row.files.clash = remoteTextFileRecord(clashFiles);
      row.files.surge = remoteTextFileRecord(surgeFiles);
      row.files.quantumultx = remoteTextFileRecord(quantumultxFiles);
      row.files.egern = { format: 'yaml', file: `${segment.id}.yaml` };
    }
    segment.remoteRuleSetFiles = {
      clash: clashFiles,
      surge: surgeFiles,
      quantumultx: quantumultxFiles,
    };
    if (singBoxEntries.entries.length > 0) {
      const singSource = path.join(FUSED_SING_BOX_DIR, `${segment.id}.json`);
      const singBinary = path.join(FUSED_SING_BOX_DIR, `${segment.id}.srs`);
      writeText(singSource, renderSingBoxSource(singBoxEntries.entries));
      if (!compileSingBoxRuleSet(singBoxBin, singSource, singBinary)) {
        throw new Error(`cannot compile required sing-box rule set: ${segment.id}`);
      }
      row.files.sing_box = { format: 'binary', file: `${segment.id}.srs`, source: `${segment.id}.json` };
      generatedSrs += 1;
    }
    manifestSegments.push(row);
  }
  return { manifestSegments, generatedMrs, generatedSrs, singBoxBinary: singBoxBin ? path.basename(singBoxBin) : null };
}

function buildMihomoProvidersAndRules(segments, baseProviders, passthroughProviderIds, assetRevision) {
  const providers = {};
  const rules = [];
  for (const id of REQUIRED_SUPPORT_PROVIDERS) {
    if (baseProviders[id]) providers[id] = baseProviders[id];
  }
  for (const id of passthroughProviderIds || []) {
    if (baseProviders[id]) providers[id] = baseProviders[id];
  }
  for (const segment of segments) {
    if (segment.domain.length) {
      const id = `${segment.id}-domain`;
      providers[id] = {
        type: 'http',
        behavior: 'domain',
        format: 'mrs',
        url: repositoryAssetUrl(`rulesets/generated/fused/mihomo/${segment.id}-domain.mrs`, assetRevision),
        path: mihomoAssetCachePath(`${segment.id}-domain.mrs`, assetRevision),
        interval: 86400,
        proxy: '🚫 受限网站',
      };
      rules.push(`RULE-SET,${id},${segment.policy}`);
    }
    if (segment.ipcidr.length) {
      const id = `${segment.id}-ipcidr`;
      providers[id] = {
        type: 'http',
        behavior: 'ipcidr',
        format: 'mrs',
        url: repositoryAssetUrl(`rulesets/generated/fused/mihomo/${segment.id}-ipcidr.mrs`, assetRevision),
        path: mihomoAssetCachePath(`${segment.id}-ipcidr.mrs`, assetRevision),
        interval: 86400,
        proxy: '🚫 受限网站',
      };
      rules.push(`RULE-SET,${id},${segment.policy}`);
    }
    if (segment.ipcidrNoResolve.length) {
      const id = `${segment.id}-ipcidr-no-resolve`;
      providers[id] = {
        type: 'http',
        behavior: 'ipcidr',
        format: 'mrs',
        url: repositoryAssetUrl(`rulesets/generated/fused/mihomo/${segment.id}-ipcidr-no-resolve.mrs`, assetRevision),
        path: mihomoAssetCachePath(`${segment.id}-ipcidr-no-resolve.mrs`, assetRevision),
        interval: 86400,
        proxy: '🚫 受限网站',
      };
      rules.push(`RULE-SET,${id},${segment.policy},no-resolve`);
    }
    if (segment.residual.length) {
      const id = `${segment.id}-residual`;
      providers[id] = {
        type: 'http',
        behavior: 'classical',
        format: 'yaml',
        url: repositoryAssetUrl(`rulesets/generated/fused/mihomo/${segment.id}-residual.yaml`, assetRevision),
        path: mihomoAssetCachePath(`${segment.id}-residual.yaml`, assetRevision),
        interval: 86400,
        proxy: '🚫 受限网站',
      };
      rules.push(`RULE-SET,${id},${segment.policy}`);
    }
  }
  return { providers, rules };
}

function mainRuleTarget(rule) {
  const parts = splitTopLevel(rule);
  if (parts[0] === 'MATCH' || parts[0] === 'FINAL') return parts[1];
  return parts[2];
}

function mergeFusedRules(segments, timeline, baseProviders, passthroughProviderIds, assetRevision) {
  const { providers, rules } = buildMihomoProvidersAndRules(segments, baseProviders, passthroughProviderIds, assetRevision);
  const finalRules = [];
  for (const marker of timeline) {
    if (marker.type === 'segment') {
      const segment = marker.segment;
      if (segment.domain.length) finalRules.push(`RULE-SET,${segment.id}-domain,${segment.policy}`);
      if (segment.ipcidr.length) finalRules.push(`RULE-SET,${segment.id}-ipcidr,${segment.policy}`);
      if (segment.ipcidrNoResolve.length) finalRules.push(`RULE-SET,${segment.id}-ipcidr-no-resolve,${segment.policy},no-resolve`);
      if (segment.residual.length) finalRules.push(`RULE-SET,${segment.id}-residual,${segment.policy}`);
    } else {
      finalRules.push(marker.rule);
    }
  }
  return { providers, rules: finalRules };
}

function buildTimeline(segments, inlineRules) {
  const events = [];
  let inlineIndex = 0;
  let segmentIndex = 0;
  const all = [];
  for (const segment of segments) {
    all.push({ first: segment.sourceRules[0], segment });
  }
  const sourceOrder = new Map();
  let ordinal = 0;
  for (const segment of segments) {
    for (const rule of segment.sourceRules) {
      if (!sourceOrder.has(rule)) sourceOrder.set(rule, ordinal);
      ordinal += 1;
    }
  }
  for (const rule of inlineRules) {
    if (!sourceOrder.has(rule)) sourceOrder.set(rule, ordinal);
    ordinal += 1;
  }
  const segmentFirstOrder = new Map(segments.map((segment) => [segment, sourceOrder.get(segment.sourceRules[0])]));
  const inlineEvents = inlineRules.map((rule) => ({ type: 'inline', rule, order: sourceOrder.get(rule) }));
  const segmentEvents = segments.map((segment) => ({ type: 'segment', segment, order: segmentFirstOrder.get(segment) }));
  events.push(...segmentEvents, ...inlineEvents);
  events.sort((a, b) => a.order - b.order);
  return events;
}

function renderJsFusedBlock(providers, rules) {
  return [
    '// BEGIN AUTO-GENERATED MIHOMO FUSED RULE-SETS',
    '// Generated by tools/build-fused-rule-sets.js from rulesets/source/routing-graph.js.',
    `const MIHOMO_FUSED_RULE_PROVIDERS = ${JSON.stringify(providers)}`,
    `const MIHOMO_FUSED_RULES = ${JSON.stringify(rules)}`,
    '',
    'function applyMihomoFusedRuleSets(config) {',
    "  if (typeof SCKI_DISABLE_FUSED_RULESETS !== 'undefined' && SCKI_DISABLE_FUSED_RULESETS) return",
    "  var providers = config['rule-providers'] || {}",
    '  Object.keys(providers).forEach(function(key) { delete providers[key] })',
    '  Object.keys(MIHOMO_FUSED_RULE_PROVIDERS).forEach(function(key) { providers[key] = MIHOMO_FUSED_RULE_PROVIDERS[key] })',
    "  config['rule-providers'] = providers",
    '  if (Array.isArray(config.rules)) {',
    '    config.rules.splice.apply(config.rules, [0, config.rules.length].concat(MIHOMO_FUSED_RULES))',
    '  } else {',
    '    config.rules = MIHOMO_FUSED_RULES.slice()',
    '  }',
    '}',
    '// END AUTO-GENERATED MIHOMO FUSED RULE-SETS',
    '',
  ].join('\n');
}

function applyJsFusedBlock(relativeFile, providers, rules) {
  const file = path.join(REPO_ROOT, relativeFile);
  let source = readText(file);
  source = source.replace(/(?:\r?\n)?\/\/ BEGIN AUTO-GENERATED MIHOMO FUSED RULE-SETS[\s\S]*?\/\/ END AUTO-GENERATED MIHOMO FUSED RULE-SETS(?:\r?\n)*/g, '\n');
  source = source.replace(/(?:\r?\n)[ \t]*applyMihomoFusedRuleSets\(config\)[ \t]*(?=\r?\n)/g, '');
  source = source.replace(/(\r?\n[ \t]*injectBusinessGroups\(config, activeSmartNames\))(?:\r?\n[ \t]*){2,}(\r?\n[ \t]*sortProxyGroups\(config\))/, '$1$2');
  const block = renderJsFusedBlock(providers, rules);
  if (!source.includes('\nconst REGION_ORDER =')) throw new Error(`${relativeFile}: missing fused block anchor`);
  source = source.replace(/\nconst REGION_ORDER =/, `\n${block}\nconst REGION_ORDER =`);
  const withCall = source.replace(/(\r?\n[ \t]*)injectBusinessGroups\(config, activeSmartNames\)/, '$1injectBusinessGroups(config, activeSmartNames)$1applyMihomoFusedRuleSets(config)');
  if (withCall === source) throw new Error(`${relativeFile}: cannot locate rule injection call`);
  source = withCall;
  writeText(file, source);
}

function renderYamlProvider(id, provider) {
  const lines = [
    `  ${id}:`,
    '    type: http',
    `    behavior: ${provider.behavior}`,
  ];
  if (provider.format) lines.push(`    format: ${provider.format}`);
  lines.push(`    url: ${yamlQuote(provider.url)}`);
  lines.push(`    path: ${yamlQuote(provider.path || `./ruleset/${id}.yaml`)}`);
  if (provider.interval) lines.push(`    interval: ${provider.interval}`);
  if (provider.proxy) lines.push(`    proxy: ${yamlQuote(provider.proxy)}`);
  return lines.join('\n');
}

function replaceYamlSections(relativeFile, providers, rules) {
  const file = path.join(REPO_ROOT, relativeFile);
  let source = readText(file).replace(/\r\n/g, '\n');
  const providerStart = source.search(/\nrule-providers:\n/);
  const rulesStart = source.search(/\nrules:\n/);
  if (providerStart === -1 || rulesStart === -1 || rulesStart <= providerStart) throw new Error(`${relativeFile}: cannot locate rule-providers/rules`);
  const beforeProviders = source.slice(0, providerStart + 1);
  const heredocEnd = source.slice(rulesStart + 1).search(/\nOVERRIDE_EOF\b/);
  const sectionEnd = heredocEnd === -1 ? source.length : rulesStart + 1 + heredocEnd;
  const afterSection = source.slice(sectionEnd);
  const providersText = [
    'rule-providers:',
    ...Object.entries(providers).map(([id, provider]) => renderYamlProvider(id, provider)),
  ].join('\n');
  const rulesText = [
    'rules:',
    ...rules.map((rule) => `- ${yamlQuote(rule)}`),
    '',
  ].join('\n');
  source = `${beforeProviders}${providersText}\n${rulesText}${afterSection}`;
  writeText(file, source);
}

function replaceOpenClashYaml(relativeFile, providers, rules) {
  replaceYamlSections(relativeFile, providers, rules);
}

function qxPolicy(policy) {
  if (policy === 'DIRECT') return 'direct';
  if (policy === 'REJECT' || policy === 'REJECT-DROP') return 'reject';
  return policy;
}

function platformRuleSetLines(platform, segment, assetRevision) {
  const policy = segment.policy;
  const target = platform === 'surge' ? 'surge' : platform === 'quantumultx' ? 'quantumultx' : 'clash';
  const files = (segment.remoteRuleSetFiles && segment.remoteRuleSetFiles[target]) || [`${segment.id}.list`];
  return files.map((file) => {
    const tag = path.basename(file, '.list');
    if (platform === 'shadowrocket') return `RULE-SET,${repositoryAssetUrl(`rulesets/generated/fused/clash/${file}`, assetRevision)},${policy}`;
    if (platform === 'surge') return `RULE-SET,${repositoryAssetUrl(`rulesets/generated/fused/surge/${file}`, assetRevision)},${policy}`;
    if (platform === 'loon-remote') return `${repositoryAssetUrl(`rulesets/generated/fused/clash/${file}`, assetRevision)}, policy=${policy}, tag=${tag}, enabled=true`;
    if (platform === 'quantumultx') return `${repositoryAssetUrl(`rulesets/generated/fused/quantumultx/${file}`, assetRevision)}, tag=${tag}, force-policy=${qxPolicy(policy)}, update-interval=86400, opt-parser=false, enabled=true`;
    return null;
  }).filter(Boolean);
}

function renderMobileRules(platform, timeline, assetRevision) {
  const lines = [];
  for (const event of timeline) {
    if (event.type === 'segment') {
      lines.push(...platformRuleSetLines(platform, event.segment, assetRevision));
      continue;
    }
    if (platform === 'loon-remote' || platform === 'quantumultx') continue;
    const rule = event.rule;
    const parts = splitTopLevel(rule);
    if (parts[0] === 'DST-PORT') {
      if (platform === 'surge' || platform === 'loon-local') lines.push(`DEST-PORT,${parts[1]},${parts[2]}`);
      else if (platform === 'shadowrocket') lines.push(rule);
      else if (platform === 'quantumultx-local') lines.push(`dest-port, ${parts[1]}, ${qxPolicy(parts[2])}`);
    } else if (parts[0] === 'MATCH' || parts[0] === 'FINAL') {
      if (platform === 'quantumultx-local') lines.push(`final, ${qxPolicy(parts[1])}`);
      else lines.push(`FINAL,${parts[1]}${platform === 'shadowrocket' ? ',dns-failed' : ''}`);
    }
  }
  return lines;
}

function replaceSection(source, sectionName, replacementLines) {
  const normalized = source.replace(/\r\n/g, '\n');
  const start = normalized.indexOf(`\n[${sectionName}]\n`);
  if (start === -1) throw new Error(`Missing [${sectionName}]`);
  const afterStart = start + `\n[${sectionName}]\n`.length;
  const next = normalized.slice(afterStart).search(/\n\[[^\]]+\]\n/);
  const end = next === -1 ? normalized.length : afterStart + next;
  return `${normalized.slice(0, afterStart)}\n${replacementLines.join('\n')}\n${normalized.slice(end).replace(/^\n+/, '\n')}`;
}

function applyMobileConfigs(timeline, assetRevision) {
  const shadowrocket = path.join(REPO_ROOT, 'Shadowrocket/Shadowrocket.conf');
  let sr = readText(shadowrocket);
  sr = replaceSection(sr, 'Rule', renderMobileRules('shadowrocket', timeline, assetRevision));
  writeText(shadowrocket, sr);

  const surge = path.join(REPO_ROOT, 'Surge/Surge.conf');
  let surgeText = readText(surge);
  surgeText = replaceSection(surgeText, 'Rule', renderMobileRules('surge', timeline, assetRevision));
  writeText(surge, surgeText);

  const loon = path.join(REPO_ROOT, 'Loon/Loon.conf');
  let loonText = readText(loon);
  loonText = replaceSection(loonText, 'Remote Rule', renderMobileRules('loon-remote', timeline, assetRevision));
  loonText = replaceSection(loonText, 'Rule', renderMobileRules('loon-local', timeline, assetRevision));
  writeText(loon, loonText);

  const qx = path.join(REPO_ROOT, 'Quantumult X/QuantumultX.conf');
  let qxText = readText(qx);
  qxText = replaceSection(qxText, 'filter_remote', renderMobileRules('quantumultx', timeline, assetRevision));
  qxText = replaceSection(qxText, 'filter_local', renderMobileRules('quantumultx-local', timeline, assetRevision));
  writeText(qx, qxText);
}

function applyCmfaTrafficOptions(source, options) {
  source = source.replace(/\r\n/g, '\n');
  const providerStart = source.indexOf('\nproxy-providers:\n');
  const groupStart = source.indexOf('\nproxy-groups:\n', providerStart);
  const rulesStart = source.indexOf('\nrules:\n', groupStart);
  if (providerStart < 0 || groupStart < 0 || rulesStart < 0) throw new Error('CMFA traffic option sections missing');
  const providerPart = source.slice(providerStart, groupStart).replace(
    /(\n    health-check:\n      enable: true\n      url: [^\n]+\n      interval: )(?:300|900)(?:\n      lazy: (?:true|false))?/g,
    (_match, prefix) => `${prefix}${getHealthCheckSettings(options.healthCheckProfile).intervalSeconds}\n      lazy: true`,
  );
  const groupPart = source.slice(groupStart, rulesStart)
    .replace(/^  interval: (?:300|900)$/gm, `  interval: ${options.healthCheckProfile === 'power-save' ? 900 : 300}`)
    .replace(/^  lazy: (?:true|false)$/gm, '  lazy: true');
  return source.slice(0, providerStart) + providerPart + groupPart + source.slice(rulesStart);
}

function applyMobileTrafficOptions(source, platform, options) {
  const interval = options.healthCheckProfile === 'power-save' ? 900 : 300;
  const lines = source.replace(/\r\n/g, '\n').split('\n').map((line) => {
    if (platform === 'quantumultx' && line.startsWith('url-latency-benchmark=')) {
      return line.replace(/check-interval=(?:300|900)/, `check-interval=${interval}`)
        .replace(/alive-checking=(?:true|false)/, `alive-checking=${options.healthCheckProfile === 'standard'}`);
    }
    if (/\s= url-test,/.test(line)) return line.replace(/interval=(?:300|900)/, `interval=${interval}`);
    return line;
  });
  let result = lines.join('\n');
  if (platform === 'shadowrocket' || platform === 'surge') {
    result = result.replace(/^block-quic = all-proxy\n/gm, '');
    if (options.quicPolicy === 'block-foreign') {
      const marker = platform === 'shadowrocket' ? '# v5.4.22 N/A#1：SR block-quic' : '# v5.4.22 N/A#1：Surge block-quic';
      const anchor = result.split('\n').find((line) => line.startsWith(marker));
      if (!anchor) throw new Error(`${platform}: QUIC toggle anchor missing`);
      result = result.replace(`${anchor}\n`, `${anchor}\nblock-quic = all-proxy\n`);
    }
  }
  if (platform === 'loon') {
    result = result.replace(/^disable-udp-ports = 443\n/gm, '');
    if (options.quicPolicy === 'block-foreign') {
      const anchor = result.split('\n').find((line) => line.startsWith('# v5.4.22 N/A#1：Loon disable-udp-ports'));
      if (!anchor) throw new Error('Loon QUIC toggle anchor missing');
      result = result.replace(`${anchor}\n`, `${anchor}\ndisable-udp-ports = 443\n`);
    }
  }
  return result;
}

function applyTrafficOptionsToStaticArtifacts(options) {
  const cmfa = path.join(REPO_ROOT, 'Clash Meta For Android/CMFA(mihomo).yaml');
  writeText(cmfa, applyCmfaTrafficOptions(readText(cmfa), options));
  for (const [platform, relative] of [
    ['shadowrocket', 'Shadowrocket/Shadowrocket.conf'],
    ['surge', 'Surge/Surge.conf'],
    ['loon', 'Loon/Loon.conf'],
    ['quantumultx', 'Quantumult X/QuantumultX.conf'],
  ]) {
    const file = path.join(REPO_ROOT, relative);
    writeText(file, applyMobileTrafficOptions(readText(file), platform, options));
  }
}

function assertTrafficOnlySourceChange(clashOutput) {
  const relative = 'rulesets/source/routing-graph.js';
  const source = childProcess.execFileSync('git', ['show', `HEAD:${relative}`], { cwd: REPO_ROOT, encoding: 'utf8' });
  const sourceFile = path.join(REPO_ROOT, relative);
  const module = { exports: {} };
  const fixedMath = Object.create(Math);
  fixedMath.random = () => 0;
  vm.runInNewContext(source, {
    module, exports: module.exports, require: createRequire(sourceFile),
    __dirname: path.dirname(sourceFile), process: { env: {} }, Math: fixedMath, console: { log() {} },
  }, { filename: `${relative}@HEAD`, timeout: 15000 });
  const baseline = module.exports.buildMihomoRoutingGraph({ quicPolicy: 'block-foreign' });
  const normalizeProviders = providers => JSON.stringify(providers)
    .replace(/([?&]scki=)v\d+\.\d+\.\d+/g, '$1__revision__')
    .replace(/\.\/ruleset\/v\d+\.\d+\.\d+\//g, './ruleset/__revision__/');
  const baselineRaw = module.exports.buildMihomoRoutingGraph({ applyMihomoMrsOverrides: false, quicPolicy: 'block-foreign' });
  const originalRandom = Math.random;
  let currentRaw;
  try { Math.random = () => 0; currentRaw = getRawRoutingGraph(); }
  finally { Math.random = originalRandom; }
  if (normalizeProviders(baselineRaw['rule-providers']) !== normalizeProviders(currentRaw['rule-providers'])) {
    throw new Error('--reuse-assets requires unchanged raw source providers; run the full MRS and fused build for upstream changes');
  }
  if (normalizeProviders(baseline['rule-providers']) !== normalizeProviders(clashOutput.providers)) {
    throw new Error('--reuse-assets requires unchanged source providers; run a full ruleset build for provider changes');
  }
  const quic = new Set(getQuicRules('block-foreign'));
  const withoutQuic = rules => rules.filter(rule => !quic.has(rule));
  if (JSON.stringify(withoutQuic(baseline.rules)) !== JSON.stringify(withoutQuic(clashOutput.rules))) {
    throw new Error('--reuse-assets permits only traffic preset changes; other source rule changes require a full build');
  }
}

function trafficSourceFingerprint() {
  const originalRandom = Math.random;
  let raw, normalized;
  try { Math.random = () => 0; raw = getRawRoutingGraph(); normalized = getMihomoNormalizedRoutingGraph(); }
  finally { Math.random = originalRandom; }
  const quic = new Set(getQuicRules('block-foreign'));
  const canonical = JSON.stringify({
    rawProviders: raw['rule-providers'], normalizedProviders: normalized['rule-providers'],
    rawRules: raw.rules.filter(rule => !quic.has(rule)), normalizedRules: normalized.rules.filter(rule => !quic.has(rule)),
    quicRules: getQuicRules('block-foreign'),
  }).replace(/([?&]scki=)v\d+\.\d+\.\d+/g, '$1__revision__')
    .replace(/\.\/ruleset\/v\d+\.\d+\.\d+\//g, './ruleset/__revision__/');
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function fusedPayloadReceipt() {
  const files = new Map();
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else {
        const data = fs.readFileSync(file);
        const canonical = /\.(?:mrs|srs)$/.test(file) ? data : Buffer.from(data.toString('utf8').replace(/\r\n/g, '\n'));
        files.set(path.relative(REPO_ROOT, file).replace(/\\/g, '/'), canonical);
      }
    }
  }
  for (const directory of ['mihomo', 'clash', 'surge', 'quantumultx', 'egern', 'sing-box']) walk(path.join(FUSED_ROOT, directory));
  const digest = crypto.createHash('sha256');
  for (const [file, content] of [...files].sort(([a], [b]) => a.localeCompare(b, 'en'))) {
    digest.update(file + '\0' + crypto.createHash('sha256').update(content).digest('hex') + '\n');
  }
  return { files, digest: digest.digest('hex') };
}

function assertSnapshotBinding(manifest) {
  const sourceFingerprint = trafficSourceFingerprint();
  const receipt = fusedPayloadReceipt();
  if (manifest.traffic_source_fingerprint || manifest.payload_fingerprint) {
    if (manifest.traffic_source_fingerprint !== sourceFingerprint || manifest.payload_fingerprint !== receipt.digest) {
      throw new Error('Fused snapshot source or payload fingerprint changed; a full ruleset build is required');
    }
  } else {
    // Adopt a legacy snapshot only when its published source version and all
    // payload blobs match HEAD; count-only topology checks are insufficient.
    const committed = JSON.parse(childProcess.execFileSync('git', ['show', 'HEAD:rulesets/generated/fused/manifest.json'], { cwd: REPO_ROOT, encoding: 'utf8' }));
    const versionMatch = childProcess.execFileSync('git', ['show', 'HEAD:rulesets/source/routing-graph.js'], { cwd: REPO_ROOT, encoding: 'utf8' }).match(/const SOURCE_GRAPH_VERSION = ['"]([^'"]+)/);
    if (!versionMatch || committed.baseline_version !== versionMatch[1] || JSON.stringify(manifest.segments) !== JSON.stringify(committed.segments)) {
      throw new Error('Legacy fused snapshot is not bound to the committed source graph; run a full build');
    }
    const output = childProcess.execFileSync('git', ['ls-tree', '-r', 'HEAD', '--', ...['mihomo', 'clash', 'surge', 'quantumultx', 'egern', 'sing-box'].map(dir => `rulesets/generated/fused/${dir}`)], { cwd: REPO_ROOT, encoding: 'utf8' });
    const blobs = new Map(output.trim().split('\n').filter(Boolean).map(line => { const match = line.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/); if (!match) throw new Error('Unexpected snapshot tree record'); return [match[2], match[1]]; }));
    if (blobs.size !== receipt.files.size) throw new Error('Legacy fused payload inventory differs from HEAD');
    for (const [file, content] of receipt.files) {
      const oid = crypto.createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
      if (blobs.get(file) !== oid) throw new Error(`Legacy fused payload differs from HEAD: ${file}`);
    }
  }
  return { sourceFingerprint, payloadFingerprint: receipt.digest };
}

function reuseSnapshotTopology(clashOutput, manifest) {
  if ((manifest.unresolved_providers || []).length || (manifest.unresolved_sources || []).length ||
      (manifest.passthrough_providers || []).length) {
    throw new Error('Cannot reuse assets from an unresolved fused snapshot');
  }
  const oldSegments = new Map(manifest.segments.map(row => [row.id, row]));
  if (oldSegments.size !== manifest.segments.length) throw new Error('Duplicate fused snapshot segments');
  const pruned = new Set(manifest.pruned_empty_segments || []);
  const segments = [], timeline = [], inlineRules = [], seen = new Set();
  let current = null, index = 1;
  function flush() {
    if (!current) return;
    const row = oldSegments.get(current.id);
    if (!row) {
      if (!pruned.has(current.id)) throw new Error(`Fused topology mismatch: missing ${current.id}`);
      current = null;
      return;
    }
    if (row.policy !== current.policy || row.source_rules !== current.sourceRules.length) {
      throw new Error(`Fused topology mismatch: policy/source rule count for ${current.id}`);
    }
    for (const [bucket, countKey] of [['domain', 'domain'], ['ipcidr', 'ipcidr'], ['ipcidrNoResolve', 'ipcidr_no_resolve'], ['residual', 'residual']]) {
      // Existing renderers only inspect bucket presence; payload bytes remain untouched.
      current[bucket] = row.counts[countKey] > 0 ? [true] : [];
    }
    current.remoteRuleSetFiles = {};
    for (const target of ['clash', 'surge', 'quantumultx']) {
      const record = row.files[target];
      current.remoteRuleSetFiles[target] = record ? (record.parts || [record.file]) : [];
      for (const file of current.remoteRuleSetFiles[target]) {
        if (!file || !fs.existsSync(path.join(FUSED_ROOT, target, file))) throw new Error(`Missing snapshot asset: ${target}/${file}`);
      }
    }
    for (const bucket of ['domain', 'ipcidr', 'ipcidr_no_resolve', 'residual']) {
      const record = row.files[bucket];
      if (record && !fs.existsSync(path.join(FUSED_MIHOMO_DIR, record.file))) throw new Error(`Missing snapshot asset: ${record.file}`);
    }
    segments.push(current); timeline.push({ type: 'segment', segment: current }); seen.add(current.id);
    current = null;
  }
  for (const rule of clashOutput.rules) {
    const parts = splitTopLevel(rule), type = parts[0];
    if (INLINE_ONLY_TYPES.has(type)) {
      flush(); inlineRules.push(rule); timeline.push({ type: 'inline', rule }); continue;
    }
    if (!['RULE-SET', 'GEOSITE', 'GEOIP'].includes(type) && !DOMAIN_TYPES.has(type) && !IPCIDR_TYPES.has(type) && !RESIDUAL_TYPES.has(type)) {
      throw new Error(`Unsupported snapshot source rule: ${rule}`);
    }
    if (type === 'RULE-SET' && !clashOutput.providers[parts[1]]) throw new Error(`Missing snapshot source provider: ${parts[1]}`);
    const policy = parts[2];
    if (!current || current.policy !== policy) { flush(); current = createSegment(index++, policy); }
    current.sourceRules.push(rule);
  }
  flush();
  if (seen.size !== oldSegments.size) throw new Error('Fused topology mismatch: unused snapshot segments');
  return { segments, timeline, inlineRules };
}

function writeClientArtifacts(timeline, assetRevision, fused) {
  for (const file of ['Clash Party/ClashParty(mihomo-smart).js', 'Clash Party/ClashParty(mihomo).js', 'FlClash/FlClash(mihomo).js']) {
    applyJsFusedBlock(file, fused.providers, fused.rules);
  }
  for (const file of ['Clash Meta For Android/CMFA(mihomo).yaml', 'OpenClash/OpenClash(mihomo).sh', 'OpenClash/OpenClash(mihomo-smart).sh']) {
    replaceOpenClashYaml(file, fused.providers, fused.rules);
  }
  applyMobileConfigs(timeline, assetRevision);
  applyTrafficOptionsToStaticArtifacts(getTrafficOptions());
}

function rebuildClientsFromSnapshot(clashOutput) {
  assertTrafficOnlySourceChange(clashOutput);
  const manifest = JSON.parse(readText(path.join(FUSED_ROOT, 'manifest.json')));
  const binding = assertSnapshotBinding(manifest);
  const { segments, timeline, inlineRules } = reuseSnapshotTopology(clashOutput, manifest);
  const fused = mergeFusedRules(segments, timeline, clashOutput.providers, new Set(), clashOutput.version);
  if (process.argv.includes('--dry-run')) {
    console.log(`Snapshot reuse dry run: providers=${Object.keys(fused.providers).length} rules=${fused.rules.length} segments=${segments.length}`);
    return;
  }
  writeClientArtifacts(timeline, clashOutput.version, fused);
  Object.assign(manifest, {
    generated_at: new Date().toISOString(), baseline_version: clashOutput.version, asset_revision: clashOutput.version,
    source_provider_count: Object.keys(clashOutput.providers).length, source_rule_count: clashOutput.rules.length,
    fused_provider_count: Object.keys(fused.providers).length, fused_rule_count: fused.rules.length,
    inline_rule_count: inlineRules.length, inline_rules: inlineRules,
    traffic_source_fingerprint: binding.sourceFingerprint, payload_fingerprint: binding.payloadFingerprint,
  });
  writeText(path.join(FUSED_ROOT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  generateFusedFallbackArtifacts({ quiet: true, updateManifest: true });
  refreshRuleQuality();
  console.log(`Reused fused snapshot payloads: providers=${manifest.fused_provider_count} rules=${manifest.fused_rule_count} segments=${manifest.segment_count}; no upstream refresh`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--reuse-assets' && arg !== '--dry-run') || (args.includes('--dry-run') && !args.includes('--reuse-assets'))) {
    throw new Error('Usage: node tools/build-fused-rule-sets.js [--reuse-assets [--dry-run]]');
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const clashOutput = runSourceRoutingGraphBaseline({ deterministicIntervals: args.includes('--reuse-assets') });
  if (args.includes('--reuse-assets')) return rebuildClientsFromSnapshot(clashOutput);
  const assetRevision = clashOutput.version;
  const { segments, inlineRules, timeline, stats } = await buildSegments(clashOutput);
  const writeStats = await writeFusedRuleSets(segments);
  const fused = mergeFusedRules(segments, timeline, clashOutput.providers, stats.passthroughProviderIds, assetRevision);

  writeClientArtifacts(timeline, assetRevision, fused);

  const manifest = {
    generated_at: new Date().toISOString(),
    authority: `${SOURCE_GRAPH_ID} after Mihomo MRS normalization`,
    baseline_version: clashOutput.version,
    asset_revision: assetRevision,
    source_provider_count: Object.keys(clashOutput.providers).length,
    source_rule_count: clashOutput.rules.length,
    fused_provider_count: Object.keys(fused.providers).length,
    fused_rule_count: fused.rules.length,
    inline_rule_count: inlineRules.length,
    segment_count: segments.length,
    generated_mrs_files: writeStats.generatedMrs,
    generated_srs_files: writeStats.generatedSrs,
    sing_box_binary: writeStats.singBoxBinary,
    remote_asset_max_bytes: MAX_REMOTE_RULE_SET_BYTES,
    source_segments: getSourceSegmentCatalog(clashOutput.rules),
    optimization: stats.optimization,
    pruned_empty_segments: stats.prunedEmptySegments,
    unresolved_providers: stats.unresolvedProviders,
    unresolved_sources: stats.unresolvedSources,
    passthrough_providers: [...stats.passthroughProviderIds].sort(),
    required_support_providers: [...REQUIRED_SUPPORT_PROVIDERS],
    segments: writeStats.manifestSegments,
    inline_rules: inlineRules,
    traffic_source_fingerprint: trafficSourceFingerprint(),
    payload_fingerprint: fusedPayloadReceipt().digest,
  };
  writeText(path.join(FUSED_ROOT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const fallbackStats = generateFusedFallbackArtifacts({ quiet: true, updateManifest: true });
  refreshRuleQuality({ sourceReads: fusedSources.receipts() });
  console.log(`fused rule sets: source_providers=${manifest.source_provider_count} source_rules=${manifest.source_rule_count} segments=${manifest.segment_count} fused_providers=${manifest.fused_provider_count} fused_rules=${manifest.fused_rule_count} inline=${manifest.inline_rule_count} mrs=${manifest.generated_mrs_files} srs=${manifest.generated_srs_files} unresolved=${manifest.unresolved_providers.length}`);
  console.log(`fused fallback artifacts: xray_rules=${fallbackStats.xray.ruleCount} passwall_rules=${fallbackStats.passwallFiles}`);
  if (manifest.unresolved_providers.length || manifest.unresolved_sources.length) {
    console.warn(`fused rule sets warning: passthrough/unresolved items kept=${manifest.unresolved_providers.length + manifest.unresolved_sources.length}`);
  }
}

if (require.main === module) main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

module.exports = { getSourceSegmentCatalog, applyCmfaTrafficOptions, applyMobileTrafficOptions, reuseSnapshotTopology, assertTrafficOnlySourceChange, assertSnapshotBinding, trafficSourceFingerprint, fusedPayloadReceipt, readMihomoMrsSourceMap, sourceInfoForProvider,
  parsePayloadEntries, classifyEntry, optimizeSegment, removeGloballyRepeatedEntries, renderPayload, renderClassicalList, renderQxList, renderEgernYaml, renderSingBoxSource, convertWithMihomo, compileSingBoxRuleSet };
