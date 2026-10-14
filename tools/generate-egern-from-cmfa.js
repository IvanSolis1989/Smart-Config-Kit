#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { optimizeEntries, canonicalizeEntry, resolveOpaqueMrsSource } = require('./lib/fused-rule-optimizer');
const { buildEgernGenerationManifest, validateEgernGenerationManifest, listGeneratedEgernAssetRecords } = require('./lib/egern-generation-manifest');
const { SNAPSHOT_FILE, loadSnapshot, loadSupplementalPatchSnapshot, packStagedOutput, saveSnapshot, hash: snapshotHash } = require('./lib/egern-traffic-snapshot');
const {
  SCKI_REPOSITORY_BASE,
  repositoryAssetUrl,
  withAssetRevision,
} = require('./lib/generated-asset-url');
const { SOURCE_GRAPH_VERSION, getTrafficOptions, getQuicRules } = require('../rulesets/source/routing-graph');

const REPO_ROOT = path.resolve(__dirname, '..');
const CMFA_FILE = path.join(REPO_ROOT, 'Clash Meta For Android/CMFA(mihomo).yaml');
const EGERN_FILE = path.join(REPO_ROOT, 'Egern/Egern.yaml');
const GENERATED_RULESET_DIR = path.join(REPO_ROOT, 'rulesets/generated/egern');
const EGERN_GENERATION_MANIFEST_FILE = path.join(GENERATED_RULESET_DIR, 'manifest.json');
const MIHOMO_MRS_MANIFEST_FILE = path.join(REPO_ROOT, 'rulesets/generated/mihomo-mrs/manifest.json');
const ROUTING_GRAPH_FILE = path.join(REPO_ROOT, 'rulesets/source/routing-graph.js');
const FUSED_SOURCE_CACHE_DIR = path.join(REPO_ROOT, '.cache/fused-rule-sets');
const SCKI_OFFLINE = process.env.SCKI_OFFLINE === '1';

const SCKI_BASE = SCKI_REPOSITORY_BASE;
const ASSET_REVISION = SOURCE_GRAPH_VERSION;
const META_GEOSITE_BASE = 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite';
const META_GEOIP_BASE = 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip';
const EGERN_VERSION = 'v6.0.19-egern.9';
const BUILD_DATE = '2026-10-15';
const FETCH_CONCURRENCY = 3;
const MIHOMO_MRS_BASE_PATH = '/rulesets/generated/mihomo-mrs/';
// jsDelivr rejects files at 20 MB. Keep generated Egern-native rule sets below 18 MiB.
const MAX_REMOTE_RULE_SET_BYTES = 18 * 1024 * 1024;

const PROCESS_RULE_SETS = new Set([
  'scki-local-process-direct',
  'scki-work-process',
]);
const PROCESS_MATCH_TYPES = new Set([
  'PROCESS-NAME',
  'PROCESS-PATH',
  'PROCESS-PATH-REGEX',
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
];

const EGERN_SET_ORDER = [
  'domain_set',
  'domain_suffix_set',
  'domain_keyword_set',
  'domain_regex_set',
  'domain_wildcard_set',
  'geoip_set',
  'ip_cidr_set',
  'ip_cidr6_set',
  'url_regex_set',
  'asn_set',
  'user_agent_set',
  'dest_port_set',
  'protocol_set',
];
const DOMAIN_SET_KEYS = new Set(EGERN_SET_ORDER.filter((key) => key.startsWith('domain_')));

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function sourceCacheFile(url, cacheDir = FUSED_SOURCE_CACHE_DIR) {
  return path.join(cacheDir, `${Buffer.from(url).toString('base64url')}.txt`);
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function unquote(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

function parseProviders(source) {
  const startMatch = /\r?\nrule-providers:\r?\n/.exec(source);
  const start = startMatch ? startMatch.index : -1;
  const endMatch = start === -1 ? null : /\r?\nrules:\r?\n/.exec(source.slice(start + 1));
  const end = endMatch ? start + 1 + endMatch.index : -1;
  if (start === -1 || end === -1) throw new Error('Cannot locate CMFA rule-providers/rules sections');

  const providers = new Map();
  let current = null;
  for (const rawLine of source.slice(start, end).split(/\r?\n/)) {
    const nameMatch = rawLine.match(/^  ([^:\s][^:]*):\s*$/);
    if (nameMatch) {
      current = { name: unquote(nameMatch[1]) };
      providers.set(current.name, current);
      continue;
    }
    if (!current) continue;
    const fieldMatch = rawLine.match(/^    ([A-Za-z0-9_-]+):\s*(.+?)\s*$/);
    if (!fieldMatch) continue;
    current[fieldMatch[1]] = unquote(fieldMatch[2]);
  }
  return providers;
}

function parseRules(source) {
  const startMatch = /\r?\nrules:\r?\n/.exec(source);
  const start = startMatch ? startMatch.index : -1;
  if (start === -1) throw new Error('Cannot locate CMFA rules section');
  const rules = [];
  for (const rawLine of source.slice(start).split(/\r?\n/)) {
    const line = rawLine.trim();
    const match = line.match(/^-\s*["'](.+)["']\s*$/);
    if (match) rules.push(match[1]);
  }
  return rules;
}

function splitTopLevel(rule) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of rule) {
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

function splitTupleList(value) {
  const inner = String(value || '').trim().replace(/^\(/, '').replace(/\)$/, '');
  return splitTopLevel(inner)
    .map((item) => item.trim().replace(/^\(/, '').replace(/\)$/, ''))
    .filter(Boolean);
}

function containsProcessMatch(condition) {
  const parts = splitTopLevel(condition);
  if (PROCESS_MATCH_TYPES.has(parts[0])) return true;
  if (parts[0] === 'AND' || parts[0] === 'OR' || parts[0] === 'NOT') {
    return splitTupleList(parts[1]).some(containsProcessMatch);
  }
  return false;
}

function encodeRuleAssetName(name) {
  return encodeURIComponent(name).replace(/%21/g, '%21');
}

function geositeUrl(name) {
  return `${META_GEOSITE_BASE}/${encodeRuleAssetName(name)}.yaml`;
}

function geoipUrl(name) {
  return `${META_GEOIP_BASE}/${encodeRuleAssetName(name)}.yaml`;
}

function safeAssetFileName(name) {
  return `${String(name).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'ruleset'}.yaml`;
}

function sourceUrlForProvider(provider) {
  const sourceInfo = sourceInfoForProvider(provider);
  return sourceInfo ? sourceInfo.sourceUrl : null;
}

function sourceInfoForProvider(provider) {
  if (!provider) return null;
  if (!provider.url) return null;
  const providerUrl = String(provider.url).split(/[?#]/)[0];
  const opaqueMrs = resolveOpaqueMrsSource(providerUrl);
  if (opaqueMrs) return opaqueMrs;
  const localMrsSource = sourceInfoForGeneratedMihomoMrs(providerUrl);
  if (localMrsSource) return localMrsSource;
  let url = providerUrl;
  if (url.endsWith('.mrs')) url = url.replace(/\.mrs$/, '.yaml').replace('geolocation-!cn', 'geolocation-%21cn');
  return {
    sourceUrl: url.replace('https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/', 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/'),
    sourceFilter: null,
  };
}

let mihomoMrsSourceByFile = null;

function sourceInfoForGeneratedMihomoMrs(url) {
  if (!String(url || '').includes(MIHOMO_MRS_BASE_PATH)) return null;
  if (!mihomoMrsSourceByFile) {
    const manifest = JSON.parse(readText(MIHOMO_MRS_MANIFEST_FILE));
    mihomoMrsSourceByFile = new Map();
    for (const row of [...manifest.converted, ...manifest.split, ...(manifest.partial || [])]) {
      for (const generated of row.generated) {
        mihomoMrsSourceByFile.set(generated.file, { sourceUrl: row.source_url, sourceFilter: generated.behavior });
      }
      if (row.residual) {
        mihomoMrsSourceByFile.set(row.residual.file, {
          sourceUrl: `${SCKI_BASE}/${MIHOMO_MRS_BASE_PATH.replace(/^\//, '')}${row.residual.file}`,
          sourceFilter: null,
        });
      }
    }
  }
  const file = decodeURIComponent(String(url).split(MIHOMO_MRS_BASE_PATH).pop().split(/[?#]/)[0]);
  return mihomoMrsSourceByFile.get(file) || null;
}

function addGeneratedAsset(assets, id, sourceInfo, behavior, options = {}) {
  const file = safeAssetFileName(id);
  let asset = assets.get(file);
  if (!asset) {
    asset = {
      file,
      id,
      sourceUrl: sourceInfo && sourceInfo.sourceUrl,
      sourceFilter: sourceInfo && sourceInfo.sourceFilter,
      behavior: behavior || 'classical',
      noResolve: Boolean(options.noResolve),
    };
    assets.set(file, asset);
  } else if (options.noResolve) {
    asset.noResolve = true;
  }
  return asset.urls || [repositoryAssetUrl(`rulesets/generated/egern/${file}`, ASSET_REVISION)];
}

function providerUrlToEgern(provider, assets, options = {}) {
  if (!provider || !provider.url) return null;
  if (PROCESS_RULE_SETS.has(provider.name)) return null;
  if (provider.url.includes('/rulesets/supplemental/clash/')) {
    return [withAssetRevision(provider.url.replace('/rulesets/supplemental/clash/', '/rulesets/supplemental/egern/').replace(/\.list$/, '.yaml'), ASSET_REVISION)];
  }
  return addGeneratedAsset(assets, `provider-${provider.name}`, sourceInfoForProvider(provider), provider.behavior || 'classical', options);
}

function geositeEgernUrl(name, assets) {
  return addGeneratedAsset(assets, `geosite-${name}`, { sourceUrl: geositeUrl(name), sourceFilter: null }, 'domain');
}

function geoipEgernUrl(name, assets) {
  return addGeneratedAsset(assets, `geoip-${name}`, { sourceUrl: geoipUrl(name), sourceFilter: null }, 'ipcidr');
}

function renderRuleBlock(type, fields, indent = '  ') {
  const lines = [`${indent}- ${type}:`];
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'boolean') lines.push(`${indent}    ${key}: ${value}`);
    else if (typeof value === 'number') lines.push(`${indent}    ${key}: ${value}`);
    else lines.push(`${indent}    ${key}: ${yamlQuote(value)}`);
  }
  return lines;
}

function renderNestedCondition(condition, providers, assets) {
  const parts = splitTopLevel(condition);
  const type = parts[0];
  const value = parts[1];
  if (type === 'DST-PORT') return ['        - dest_port:', `            match: ${yamlQuote(value)}`];
  if (type === 'NETWORK') return ['        - protocol:', `            match: ${yamlQuote(String(value).toLowerCase())}`];
  if (type === 'RULE-SET') {
    const urls = providerUrlToEgern(providers.get(value), assets);
    if (!urls || urls.length === 0) return [];
    if (urls.length > 1) throw new Error(`Cannot expand split Egern rule_set inside nested condition: ${value}`);
    return ['        - rule_set:', `            match: ${yamlQuote(urls[0])}`];
  }
  if (type === 'GEOSITE') {
    const urls = geositeEgernUrl(value, assets);
    if (urls.length === 0) return [];
    if (urls.length > 1) throw new Error(`Cannot expand split Egern geosite inside nested condition: ${value}`);
    return ['        - rule_set:', `            match: ${yamlQuote(urls[0])}`];
  }
  if (type === 'NOT') {
    const nested = splitTupleList(value)[0];
    const nestedLines = renderNestedCondition(nested, providers, assets);
    if (nestedLines.length < 2) return [];
    return [
      '        - not:',
      '            match:',
      nestedLines[0].replace('        - ', '              '),
      nestedLines[1].replace('            ', '                '),
    ];
  }
  throw new Error(`Unsupported nested Egern condition: ${condition}`);
}

function renderPrivateGeoip(policy) {
  const lines = [
    '  - or:',
    '      match:',
  ];
  for (const cidr of PRIVATE_CIDRS) {
    lines.push('        - ip_cidr:');
    lines.push(`            match: ${yamlQuote(cidr)}`);
  }
  lines.push(`      policy: ${yamlQuote(policy)}`);
  return lines;
}

function renderEgernRule(rule, providers, assets, stats) {
  const parts = splitTopLevel(rule);
  const type = parts[0];
  if (type === 'RULE-SET') {
    const providerName = parts[1];
    const policy = parts[2];
    if (PROCESS_RULE_SETS.has(providerName)) {
      stats.skippedProcessRuleSets.push(providerName);
      return [];
    }
    const urls = providerUrlToEgern(providers.get(providerName), assets, { noResolve: parts.includes('no-resolve') });
    if (!urls) throw new Error(`Missing provider URL for ${providerName}`);
    if (urls.length === 0) {
      stats.skippedEmptyRuleSets.push(providerName);
      return [];
    }
    stats.ruleSetRefs += urls.length;
    return urls.flatMap((url) => renderRuleBlock('rule_set', { match: url, policy, update_interval: 86400 }));
  }
  if (type === 'DOMAIN') return renderRuleBlock('domain', { match: parts[1], policy: parts[2] });
  if (type === 'DOMAIN-SUFFIX') return renderRuleBlock('domain_suffix', { match: parts[1], policy: parts[2] });
  if (type === 'DOMAIN-KEYWORD') return renderRuleBlock('domain_keyword', { match: parts[1], policy: parts[2] });
  if (type === 'IP-CIDR') return renderRuleBlock('ip_cidr', { match: parts[1], policy: parts[2], no_resolve: parts.includes('no-resolve') });
  if (type === 'IP-CIDR6') return renderRuleBlock('ip_cidr6', { match: parts[1], policy: parts[2], no_resolve: parts.includes('no-resolve') });
  if (type === 'DST-PORT') return renderRuleBlock('dest_port', { match: parts[1], policy: parts[2] });
  if (type === 'GEOIP') {
    const name = parts[1];
    const policy = parts[2];
    if (name === 'private') return renderPrivateGeoip(policy);
    if (/^[A-Z]{2}$/.test(name)) return renderRuleBlock('geoip', { match: name, policy, no_resolve: parts.includes('no-resolve') });
    const urls = geoipEgernUrl(name, assets);
    stats.ruleSetRefs += urls.length;
    return urls.flatMap((url) => renderRuleBlock('rule_set', { match: url, policy, update_interval: 86400 }));
  }
  if (type === 'GEOSITE') {
    const urls = geositeEgernUrl(parts[1], assets);
    stats.ruleSetRefs += urls.length;
    return urls.flatMap((url) => renderRuleBlock('rule_set', { match: url, policy: parts[2], update_interval: 86400 }));
  }
  if (type === 'AND') {
    const policy = parts[2];
    const conditions = splitTupleList(parts[1]);
    if (conditions.some(containsProcessMatch)) {
      stats.skippedProcessLogicRules.push(rule);
      return [];
    }
    const lines = ['  - and:', '      match:'];
    for (const condition of conditions) {
      const nested = renderNestedCondition(condition, providers, assets);
      if (nested.length === 0) return [];
      lines.push(...nested);
    }
    lines.push(`      policy: ${yamlQuote(policy)}`);
    return lines;
  }
  if (type === 'MATCH') return ['  - default:', `      policy: ${yamlQuote(parts[1])}`];
  throw new Error(`Unsupported Egern rule type: ${rule}`);
}

function renderPrefix(assetCount, cmfaProviderCount, cmfaRuleCount) {
  const current = readText(EGERN_FILE);
  const bodyStart = current.indexOf('\nipv6:');
  const rulesStart = current.indexOf('\nrules:');
  if (bodyStart === -1 || rulesStart === -1) throw new Error('Cannot locate Egern body/rules sections');
  let body = current.slice(bodyStart + 1, rulesStart).replace(/\r\n/g, '\n');
  body = body
    .replace('Egern Preview Profile', 'Egern Profile')
    .replace('type: auto_test', 'type: select')
    .replace(/  - auto_test:/g, '  - smart:')
    .replace(/\n      interval: 300\n      tolerance: 100\n      timeout: 5/g, '')
    .replace(/\n      interval: 300\n      tolerance: 100/g, '')
    .replace(/(?:\n# Generated from Clash Meta For Android\/CMFA\(mihomo\)\.yaml\.\n# Non-supplemental provider rule_set URLs point at generated Egern-native\n# YAML files under rulesets\/generated\/egern\/.\n# (?:The two PROCESS-NAME supplemental rule sets|PROCESS-NAME supplemental rule sets and process-scoped logic rules) are omitted because Egern\n# does not document a process-name rule or process-name rule-set field\.\n# Target-empty rule sets removed by global first-match deduplication are omitted\.\s*)+$/, '')
    .replace(/(?:\n# Generated from Clash Meta For Android\/CMFA\(mihomo\)\.yaml\.\n# The two PROCESS-NAME supplemental rule sets are omitted because Egern\n# does not document a process-name rule or process-name rule-set field\.\s*)+$/, '');

  return [
    '---',
    '# ======================================================================',
    `# Egern Smart ${EGERN_VERSION} - Egern Profile`,
    `# Build: ${BUILD_DATE}`,
    `# Baseline: Clash Party ${SOURCE_GRAPH_VERSION}`,
    '# Architecture: 22 smart region groups + 33 business groups + fused CMFA rule order.',
    `# Rule parity: generated from CMFA ${cmfaProviderCount} rule-providers and ${cmfaRuleCount} rules.`,
    `# Egern rule sets: ${assetCount} generated native YAML files.`,
    '# Platform limit: Egern official rules do not expose Clash PROCESS-NAME.',
    '# Change history: see Egern/CHANGELOG.md',
    '# ======================================================================',
    '',
    body.trimEnd(),
    '',
  ].join('\n');
}

function createEmptySets() {
  return Object.fromEntries(EGERN_SET_ORDER.map((key) => [key, new Set()]));
}

function addValue(sets, key, value) {
  const text = String(value || '').trim();
  if (!text) return;
  sets[key].add(text);
}

function parsePayloadEntries(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  const hasPayload = /^payload:\s*$/m.test(normalized);
  const entries = [];
  let inPayload = !hasPayload;
  for (const rawLine of normalized.split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (trimmed === 'payload:') {
      inPayload = true;
      continue;
    }
    if (!inPayload) continue;
    let value = trimmed;
    const itemMatch = value.match(/^-\s*(.+)$/);
    if (itemMatch) value = itemMatch[1].trim();
    else if (hasPayload) continue;
    if (!value || value.startsWith('#')) continue;
    value = value.replace(/^['"]|['"]$/g, '').trim();
    if (value && !value.startsWith('#')) entries.push(value);
  }
  return entries;
}

function classifyClashEntry(entry) {
  if (!String(entry).includes(',')) {
    if (/^[0-9a-fA-F:.]+\/\d+$/.test(String(entry).trim())) return 'ipcidr';
    return 'domain';
  }
  const type = splitTopLevel(entry)[0].toUpperCase().replace(/\s+/g, '');
  if (['DOMAIN', 'DOMAIN-SUFFIX', 'DOMAIN-KEYWORD', 'DOMAIN-REGEX', 'DOMAIN-WILDCARD'].includes(type)) return 'domain';
  if (['IP-CIDR', 'IP-CIDR6'].includes(type)) return 'ipcidr';
  return type || 'unknown';
}

function addDomainLike(sets, value, exactBareDomain) {
  let token = String(value || '').trim();
  if (!token || token.startsWith('#')) return;
  if (token.startsWith('regexp:')) {
    addValue(sets, 'domain_regex_set', token.slice('regexp:'.length));
    return;
  }
  if (token.startsWith('keyword:')) {
    addValue(sets, 'domain_keyword_set', token.slice('keyword:'.length));
    return;
  }
  if (token.startsWith('full:')) {
    addValue(sets, 'domain_set', token.slice('full:'.length));
    return;
  }
  if (token.startsWith('domain:')) token = token.slice('domain:'.length);
  if (token.startsWith('+.')) {
    addValue(sets, 'domain_suffix_set', token.slice(2));
    return;
  }
  if (token.startsWith('.')) {
    addValue(sets, 'domain_suffix_set', token.slice(1));
    return;
  }
  if (token.includes('*')) {
    addValue(sets, 'domain_wildcard_set', token);
    return;
  }
  addValue(sets, exactBareDomain ? 'domain_set' : 'domain_suffix_set', token);
}

function addCidrLike(sets, value) {
  const parts = splitTopLevel(value);
  const type = String(parts[0] || '').toUpperCase();
  const cidr = (type === 'IP-CIDR' || type === 'IP-CIDR6' ? parts[1] : parts[0]).trim();
  if (!cidr || cidr.startsWith('#')) return;
  addValue(sets, cidr.includes(':') ? 'ip_cidr6_set' : 'ip_cidr_set', cidr);
}

function addClassicalEntry(sets, entry, skipped) {
  const parts = splitTopLevel(entry);
  const type = String(parts[0] || '').trim().toUpperCase();
  const value = parts[1];
  if (!type) return;
  if (!value && !entry.includes(',')) {
    addDomainLike(sets, entry, false);
    return;
  }
  if (type === 'DOMAIN') addValue(sets, 'domain_set', value);
  else if (type === 'DOMAIN-SUFFIX') addValue(sets, 'domain_suffix_set', value);
  else if (type === 'DOMAIN-KEYWORD') addValue(sets, 'domain_keyword_set', value);
  else if (type === 'DOMAIN-REGEX') addValue(sets, 'domain_regex_set', value);
  else if (type === 'DOMAIN-WILDCARD') addValue(sets, 'domain_wildcard_set', value);
  else if (type === 'IP-CIDR') addValue(sets, 'ip_cidr_set', value);
  else if (type === 'IP-CIDR6') addValue(sets, 'ip_cidr6_set', value);
  else if (type === 'GEOIP' && /^[A-Z]{2}$/.test(value || '')) addValue(sets, 'geoip_set', value);
  else if (type === 'IP-ASN' || type === 'ASN') addValue(sets, 'asn_set', value);
  else if (type === 'USER-AGENT') addValue(sets, 'user_agent_set', value);
  else if (type === 'URL-REGEX') addValue(sets, 'url_regex_set', value);
  else if (type === 'DST-PORT' || type === 'DEST-PORT') addValue(sets, 'dest_port_set', value);
  else if (type === 'PROCESS-NAME' || type === 'PROCESS-PATH') skipped.add(type);
  else skipped.add(type);
}

function convertEntriesToSets(entries, behavior) {
  const sets = createEmptySets();
  const skipped = new Set();
  let ipEntries = 0;
  let noResolveIpEntries = 0;
  for (const entry of entries) {
    const parts = splitTopLevel(entry);
    const type = String(parts[0] || '').toUpperCase().replace(/\s+/g, '');
    const isIpEntry = behavior === 'ipcidr' || ['IP-CIDR', 'IP-CIDR6', 'GEOIP', 'IP-ASN', 'ASN'].includes(type);
    if (isIpEntry) {
      ipEntries += 1;
      if (parts.includes('no-resolve')) noResolveIpEntries += 1;
    }
    if (behavior === 'ipcidr') addCidrLike(sets, entry);
    else if (behavior === 'domain') {
      const maybeType = String(entry).split(',', 1)[0].toUpperCase();
      if (maybeType.includes('-') || ['DOMAIN', 'IP-CIDR', 'GEOIP'].includes(maybeType)) addClassicalEntry(sets, entry, skipped);
      else addDomainLike(sets, entry, true);
    } else {
      addClassicalEntry(sets, entry, skipped);
    }
  }
  return { sets, skipped: [...skipped].sort(), noResolve: ipEntries > 0 && ipEntries === noResolveIpEntries };
}

function renderEgernRuleSet(asset, converted) {
  const lines = [
    '# Generated by tools/generate-egern-from-cmfa.js',
    `# Source id: ${asset.id}`,
    `# Source URL: ${asset.sourceUrl}`,
  ];
  if (converted.skipped.length > 0) lines.push(`# Skipped unsupported source rule types: ${converted.skipped.join(', ')}`);
  if (asset.noResolve || converted.noResolve) lines.push('no_resolve: true');
  let emitted = false;
  for (const key of EGERN_SET_ORDER) {
    const values = [...converted.sets[key]].sort();
    if (values.length === 0) continue;
    emitted = true;
    lines.push(`${key}:`);
    for (const value of values) lines.push(`  - ${yamlQuote(value)}`);
  }
  if (!emitted) {
    lines.push('domain_set: []');
  }
  lines.push('');
  return lines.join('\n');
}

function convertedRuleSetHasEntries(converted) {
  return EGERN_SET_ORDER.some((key) => converted.sets[key].size > 0);
}

function renderedRuleSetHeaderBytes(asset, skipped, noResolve) {
  const lines = [
    '# Generated by tools/generate-egern-from-cmfa.js',
    `# Source id: ${asset.id}`,
    `# Source URL: ${asset.sourceUrl}`,
  ];
  if (skipped.length > 0) lines.push(`# Skipped unsupported source rule types: ${skipped.join(', ')}`);
  if (asset.noResolve || noResolve) lines.push('no_resolve: true');
  return Buffer.byteLength(`${lines.join('\n')}\n`);
}

function splitConvertedRuleSet(asset, converted) {
  if (!convertedRuleSetHasEntries(converted)) return [converted];

  const parts = [];
  let current = { sets: createEmptySets(), skipped: [...converted.skipped], noResolve: converted.noResolve };
  let currentBytes = renderedRuleSetHeaderBytes(asset, current.skipped, current.noResolve);

  function flush() {
    if (!convertedRuleSetHasEntries(current)) return;
    parts.push(current);
    current = { sets: createEmptySets(), skipped: [...converted.skipped], noResolve: converted.noResolve };
    currentBytes = renderedRuleSetHeaderBytes(asset, current.skipped, current.noResolve);
  }

  for (const key of EGERN_SET_ORDER) {
    for (const value of [...converted.sets[key]].sort()) {
      const keyBytes = current.sets[key].size === 0 ? Buffer.byteLength(`${key}:\n`) : 0;
      const valueBytes = Buffer.byteLength(`  - ${yamlQuote(value)}\n`);
      if (currentBytes + keyBytes + valueBytes > MAX_REMOTE_RULE_SET_BYTES && convertedRuleSetHasEntries(current)) flush();
      const nextKeyBytes = current.sets[key].size === 0 ? Buffer.byteLength(`${key}:\n`) : 0;
      if (currentBytes + nextKeyBytes + valueBytes > MAX_REMOTE_RULE_SET_BYTES) {
        throw new Error(`${asset.id}: a single Egern rule-set entry exceeds ${MAX_REMOTE_RULE_SET_BYTES} bytes`);
      }
      current.sets[key].add(value);
      currentBytes += nextKeyBytes + valueBytes;
    }
  }
  flush();
  return parts;
}

function shardRuleSetFileName(file, index, total) {
  if (total === 1) return file;
  const extension = path.extname(file);
  const stem = extension ? file.slice(0, -extension.length) : file;
  return `${stem}-part-${String(index + 1).padStart(3, '0')}${extension}`;
}

function fetchCandidates(url) {
  const candidates = [url];
  const rawMatch = url.match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/);
  if (rawMatch) {
    const [, owner, repo, ref, filePath] = rawMatch;
    candidates.push(`https://fastly.jsdelivr.net/gh/${owner}/${repo}@${ref}/${filePath}`);
    candidates.push(`https://cdn.jsdelivr.net/gh/${owner}/${repo}@${ref}/${filePath}`);
    candidates.push(`https://testingcf.jsdelivr.net/gh/${owner}/${repo}@${ref}/${filePath}`);
  }

  const jsdelivrMatch = url.match(/^https:\/\/(?:fastly\.|cdn\.|testingcf\.)?jsdelivr\.net\/gh\/([^/]+)\/([^@/]+)@([^/]+)\/(.+)$/);
  if (jsdelivrMatch) {
    const [, owner, repo, ref, filePath] = jsdelivrMatch;
    candidates.push(`https://fastly.jsdelivr.net/gh/${owner}/${repo}@${ref}/${filePath}`);
    candidates.push(`https://cdn.jsdelivr.net/gh/${owner}/${repo}@${ref}/${filePath}`);
    candidates.push(`https://testingcf.jsdelivr.net/gh/${owner}/${repo}@${ref}/${filePath}`);
    candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`);
  }

  return [...new Set(candidates)];
}

function localSckiPath(url) {
  const prefix = `${SCKI_BASE}/`;
  if (!String(url || '').startsWith(prefix)) return null;
  const relative = decodeURIComponent(String(url).slice(prefix.length).split(/[?#]/)[0]);
  const target = path.resolve(REPO_ROOT, relative);
  if (!target.startsWith(REPO_ROOT + path.sep)) return null;
  return target;
}

async function fetchText(url, { cacheDir = FUSED_SOURCE_CACHE_DIR, offline = SCKI_OFFLINE } = {}) {
  const local = localSckiPath(url);
  if (local && fs.existsSync(local)) return readText(local);
  if (local && offline) throw new Error(`SCKI_OFFLINE missing local repository source: ${url}`);

  const cacheFile = sourceCacheFile(url, cacheDir);
  if (fs.existsSync(cacheFile)) return readText(cacheFile);
  if (offline) throw new Error(`SCKI_OFFLINE cache miss: ${url}`);

  const candidates = fetchCandidates(url);

  const errors = [];
  for (const candidate of candidates) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(candidate, {
        signal: controller.signal,
        headers: { 'user-agent': 'Smart-Config-Kit-Egern-Generator/1.0' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(cacheFile, buffer);
      return buffer.toString('utf8');
    } catch (error) {
      errors.push(`${candidate} -> ${error.message}`);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(errors.join('; '));
}

const geoipSourceCache = new Map();

async function materializeEgernGeoIp(entries, fetcher = fetchText) {
  const output = [];
  for (const entry of entries) {
    const parts = splitTopLevel(entry);
    const type = String(parts[0] || '').trim().toUpperCase().replace(/\s+/g, '');
    if (type !== 'GEOIP' || !parts[1]) {
      output.push(entry);
      continue;
    }
    const name = String(parts[1]).trim();
    const upperName = name.toUpperCase();
    const noResolve = parts.includes('no-resolve');
    if (/^[A-Z]{2}$/.test(upperName)) {
      output.push(`GEOIP,${upperName}${noResolve ? ',no-resolve' : ''}`);
      continue;
    }
    let cidrs;
    if (name.toLowerCase() === 'private') {
      cidrs = PRIVATE_CIDRS;
    } else {
      const cacheKey = name.toLowerCase();
      if (!geoipSourceCache.has(cacheKey)) {
        const source = await fetcher(geoipUrl(cacheKey));
        const nested = parsePayloadEntries(source).filter((candidate) => classifyClashEntry(candidate) === 'ipcidr');
        if (!nested.length) throw new Error(`GEOIP:${name} resolved to an empty Egern CIDR set`);
        geoipSourceCache.set(cacheKey, nested);
      }
      cidrs = geoipSourceCache.get(cacheKey);
    }
    for (const cidrEntry of cidrs) {
      const cidr = String(cidrEntry).includes(',') ? splitTopLevel(cidrEntry)[1] : String(cidrEntry).trim();
      if (!cidr) continue;
      output.push(`${cidr.includes(':') ? 'IP-CIDR6' : 'IP-CIDR'},${cidr}${noResolve ? ',no-resolve' : ''}`);
    }
  }
  return output;
}

async function runLimited(items, limit, worker) {
  let cursor = 0;
  const results = [];
  async function next() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}

const EGERN_IP_SET_KEYS = new Set(['geoip_set', 'ip_cidr_set', 'ip_cidr6_set', 'asn_set']);

function removeGloballyRepeatedEgernValues(converted, seen, forceNoResolve) {
  const sets = createEmptySets();
  const effectiveNoResolve = Boolean(forceNoResolve || converted.noResolve);
  let removed = 0;
  for (const key of EGERN_SET_ORDER) {
    for (const value of converted.sets[key]) {
      const noResolve = effectiveNoResolve && EGERN_IP_SET_KEYS.has(key);
      const identity = `${key}\u0000${value}\u0000${noResolve ? 'no-resolve' : ''}`;
      if (seen.has(identity)) {
        removed += 1;
        continue;
      }
      seen.add(identity);
      sets[key].add(value);
    }
  }
  return {
    converted: { ...converted, sets },
    removed,
  };
}

function convertedEntryCount(converted) {
  return EGERN_SET_ORDER.reduce((total, key) => total + converted.sets[key].size, 0);
}

async function generateNativeRuleSets(assets, { outputDir = GENERATED_RULESET_DIR, fetcher = fetchText } = {}) {
  const assetList = [...assets.values()];
  let assetCount = 0;
  let totalEntries = 0;
  let removedEntries = 0;
  let globalExactDuplicates = 0;
  let emptyAssets = 0;
  const skippedTypes = new Set();
  const prepared = await runLimited(assetList, FETCH_CONCURRENCY, async (asset) => {
    const source = await fetcher(asset.sourceUrl);
    let entries = parsePayloadEntries(source);
    if (asset.sourceFilter === 'domain' || asset.sourceFilter === 'ipcidr') {
      entries = entries.filter((entry) => classifyClashEntry(entry) === asset.sourceFilter);
    }
    entries = await materializeEgernGeoIp(entries, fetcher);
    const optimized = optimizeEntries(entries);
    const converted = convertEntriesToSets(optimized.entries, asset.behavior);
    return { asset, converted, locallyRemoved: optimized.stats.input - optimized.stats.output };
  });

  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const seen = new Set();
  for (const row of prepared) {
    const { asset } = row;
    removedEntries += row.locallyRemoved;
    const deduped = removeGloballyRepeatedEgernValues(row.converted, seen, asset.noResolve);
    const converted = deduped.converted;
    removedEntries += deduped.removed;
    globalExactDuplicates += deduped.removed;
    for (const type of converted.skipped) skippedTypes.add(type);
    if (!convertedRuleSetHasEntries(converted)) {
      asset.urls = [];
      emptyAssets += 1;
      continue;
    }
    totalEntries += convertedEntryCount(converted);
    const convertedParts = splitConvertedRuleSet(asset, converted);
    const files = convertedParts.map((part, index) => shardRuleSetFileName(asset.file, index, convertedParts.length));
    asset.urls = files.map((file) => repositoryAssetUrl(`rulesets/generated/egern/${file}`, ASSET_REVISION));
    for (let index = 0; index < convertedParts.length; index += 1) {
      const partAsset = convertedParts.length === 1 ? asset : { ...asset, file: files[index] };
      const rendered = renderEgernRuleSet(partAsset, convertedParts[index]);
      if (Buffer.byteLength(rendered) > MAX_REMOTE_RULE_SET_BYTES) throw new Error(`${files[index]} exceeds ${MAX_REMOTE_RULE_SET_BYTES} bytes after rendering`);
      fs.writeFileSync(path.join(outputDir, files[index]), rendered, 'utf8');
    }
    assetCount += files.length;
  }
  return {
    assetCount,
    totalEntries,
    removedEntries,
    globalExactDuplicates,
    emptyAssets,
    skippedTypes: [...skippedTypes].sort(),
  };
}

function parseFrozenRuleSet(text) {
  const converted = { sets: createEmptySets(), skipped: [], noResolve: /^no_resolve: true$/m.test(text) };
  let key = null;
  for (const line of text.split(/\r?\n/)) {
    if (EGERN_SET_ORDER.some((candidate) => line === `${candidate}:`)) {
      key = line.slice(0, -1);
    } else if (/^  - /.test(line) && key) {
      converted.sets[key].add(JSON.parse(line.slice(4)));
    } else if (!/^  - /.test(line)) {
      key = null;
    }
  }
  return converted;
}

function frozenFiles(snapshot, asset) {
  const stem = asset.file.slice(0, -5);
  return Object.keys(snapshot.assets).filter((file) => file === asset.file ||
    (file.startsWith(`${stem}-part-`) && /^\d{3}\.yaml$/.test(file.slice(stem.length + 6)))).sort();
}

function frozenNonDomain(snapshot, asset) {
  const converted = { sets: createEmptySets(), skipped: [], noResolve: false };
  for (const file of frozenFiles(snapshot, asset)) {
    const part = parseFrozenRuleSet(snapshot.assets[file]);
    converted.noResolve ||= part.noResolve;
    for (const key of EGERN_SET_ORDER) {
      if (!DOMAIN_SET_KEYS.has(key)) for (const value of part.sets[key]) converted.sets[key].add(value);
    }
  }
  return converted;
}

function applySupplementalPatchToNativeSnapshot(snapshot, assets) {
  const patch = snapshot.supplementalPatch;
  if (!patch) throw new Error('Missing validated Egern supplemental transition');
  const updated = { ...snapshot, assets: { ...snapshot.assets }, publishedRendered: { ...snapshot.publishedRendered } };
  let netEntries = 0;
  const touched = new Set();
  for (const change of patch.changes) {
    const id = `provider-${change.id}-domain`;
    const asset = [...assets.values()].find(candidate => candidate.id === id);
    if (!asset || asset.sourceFilter === 'ipcidr') throw new Error(`Missing Egern native DOMAIN asset: ${id}`);
    const sourcePath = localSckiPath(asset.sourceUrl);
    if (!sourcePath || path.relative(REPO_ROOT, sourcePath).replace(/\\/g, '/') !== change.sourceFile) throw new Error(`Egern patched asset source mismatch: ${id}`);
    // Validate conversion against the accepted *current* domain YAML, without
    // optimizing any historical set or regenerating non-domain sources.
    const current = convertEntriesToSets(parsePayloadEntries(change.sourceText).map(canonicalizeEntry), 'domain');
    const added = change.added.map(entry => entry.slice('DOMAIN,'.length));
    const deleted = change.deleted.map(entry => entry.slice('DOMAIN,'.length));
    if (added.some(host => !current.sets.domain_set.has(host)) || deleted.some(host => current.sets.domain_set.has(host))) throw new Error(`Egern typed DOMAIN conversion mismatch: ${id}`);
    const files = frozenFiles(snapshot, asset);
    if (!files.length) throw new Error(`Egern transition cannot create a previously empty asset: ${id}`);
    const parts = files.map(file => ({ file, text: snapshot.assets[file], parsed: parseFrozenRuleSet(snapshot.assets[file]) }));
    const oldDomains = new Set(parts.flatMap(part => [...part.parsed.sets.domain_set]));
    if (added.some(host => oldDomains.has(host)) || deleted.some(host => !oldDomains.has(host))) throw new Error(`Egern frozen native DOMAIN delta mismatch: ${id}`);
    parts.forEach((part, index) => {
      if (touched.has(part.file)) throw new Error('Duplicate Egern patched native asset');
      touched.add(part.file);
      const values = [...part.parsed.sets.domain_set].filter(host => !deleted.includes(host));
      if (index === parts.length - 1) values.push(...added);
      const block = values.length ? `domain_set:\n${values.sort().map(host => `  - ${yamlQuote(host)}\n`).join('')}` : '';
      // The canonical renderer's domain_set is first. Preserve every other
      // byte, including URL lineage, non-domain sets and scalar no_resolve.
      const match = /^domain_set:(?: \[\])?\n(?:  - .*\n)*/m.exec(part.text);
      const text = match ? part.text.slice(0, match.index) + block + part.text.slice(match.index + match[0].length) : part.text.replace(/^(?=[a-z][a-z0-9_]*_set:)/m, block);
      if ((!match && !block) || Buffer.byteLength(text) > MAX_REMOTE_RULE_SET_BYTES) throw new Error(`Invalid Egern native patch rendering: ${part.file}`);
      const parsed = parseFrozenRuleSet(text);
      for (const key of EGERN_SET_ORDER) {
        const expected = key === 'domain_set' ? [...values].sort() : [...part.parsed.sets[key]].sort();
        if (JSON.stringify([...parsed.sets[key]].sort()) !== JSON.stringify(expected)) throw new Error(`Egern patch changed unrelated native values: ${part.file}/${key}`);
      }
      if (parsed.noResolve !== part.parsed.noResolve) throw new Error('Egern patch changed no_resolve');
      updated.assets[part.file] = text;
    });
    netEntries += added.length - deleted.length;
  }
  updated.publishedRendered.source_entry_count += netEntries;
  return updated;
}

function generateNativeRuleSetsFromSnapshot(assets, snapshot, { outputDir, followRules }) {
  if (!outputDir) throw new Error('Egern snapshot generation requires a staging directory');
  if (snapshot.supplementalPatch) {
    if (followRules) throw new Error('Egern supplemental patch requires the frozen block-foreign QUIC policy; switch traffic options separately');
    snapshot = applySupplementalPatchToNativeSnapshot(snapshot, assets);
  }
  fs.mkdirSync(outputDir, { recursive: true });
  const used = new Set();
  const seenDomain = new Set();
  let assetCount = 0;
  let totalEntries = 0;
  let removedEntries = 0;
  let emptyAssets = 0;
  for (const asset of assets.values()) {
    const files = frozenFiles(snapshot, asset);
    if (!followRules) {
      asset.urls = files.map((file) => repositoryAssetUrl(`rulesets/generated/egern/${file}`, ASSET_REVISION));
      for (const file of files) {
        if (used.has(file)) throw new Error(`Duplicate frozen Egern asset: ${file}`);
        used.add(file);
        fs.writeFileSync(path.join(outputDir, file), snapshot.assets[file], 'utf8');
        totalEntries += convertedEntryCount(parseFrozenRuleSet(snapshot.assets[file]));
      }
      assetCount += files.length;
      if (!files.length) emptyAssets += 1;
      continue;
    }
    if (asset.id.startsWith('geosite-')) throw new Error(`Unexpected GEOSITE asset in follow-rules: ${asset.id}`);
    const sourcePath = localSckiPath(asset.sourceUrl);
    if (!sourcePath || !sourcePath.startsWith(path.join(REPO_ROOT, 'rulesets/generated/fused/mihomo') + path.sep)) {
      throw new Error(`Egern follow-rules needs frozen fused source: ${asset.id}`);
    }
    const sourceText = readText(sourcePath);
    if (snapshot.fusedMihomoHashes[path.basename(sourcePath)] !== snapshotHash(sourceText)) {
      throw new Error(`Egern frozen fused source changed: ${asset.id}`);
    }
    let entries = parsePayloadEntries(sourceText).filter((entry) => classifyClashEntry(entry) === 'domain');
    if (asset.sourceFilter === 'ipcidr') entries = [];
    const optimized = optimizeEntries(entries);
    const domain = convertEntriesToSets(optimized.entries, asset.behavior);
    removedEntries += optimized.stats.input - optimized.stats.output;
    const converted = frozenNonDomain(snapshot, asset);
    for (const key of DOMAIN_SET_KEYS) {
      for (const value of domain.sets[key]) {
        const identity = `${key}\u0000${value}`;
        if (seenDomain.has(identity)) { removedEntries += 1; continue; }
        seenDomain.add(identity);
        converted.sets[key].add(value);
      }
    }
    if (!convertedRuleSetHasEntries(converted)) { asset.urls = []; emptyAssets += 1; continue; }
    const parts = splitConvertedRuleSet(asset, converted);
    const names = parts.map((part, index) => shardRuleSetFileName(asset.file, index, parts.length));
    asset.urls = names.map((file) => repositoryAssetUrl(`rulesets/generated/egern/${file}`, ASSET_REVISION));
    for (let index = 0; index < parts.length; index += 1) {
      const partAsset = names.length === 1 ? asset : { ...asset, file: names[index] };
      const rendered = renderEgernRuleSet(partAsset, parts[index]);
      if (Buffer.byteLength(rendered) > MAX_REMOTE_RULE_SET_BYTES) throw new Error(`${names[index]} exceeds Egern rule-set size`);
      fs.writeFileSync(path.join(outputDir, names[index]), rendered, 'utf8');
      totalEntries += convertedEntryCount(parts[index]);
      assetCount += 1;
    }
  }
  if (!followRules && used.size !== Object.keys(snapshot.assets).length) throw new Error('Egern frozen asset inventory differs from current routing discovery');
  if (!followRules) {
    totalEntries = snapshot.publishedRendered.source_entry_count;
    removedEntries = snapshot.publishedRendered.dedup_removed;
    emptyAssets = snapshot.publishedRendered.empty_asset_count;
  }
  return { assetCount, totalEntries, removedEntries, globalExactDuplicates: followRules ? 0 : snapshot.publishedRendered.global_exact_duplicates_removed, emptyAssets, skippedTypes: [] };
}

function discoverAssets(rules, providers) {
  const assets = new Map();
  const stats = { ruleSetRefs: 0, skippedProcessRuleSets: [], skippedProcessLogicRules: [], skippedEmptyRuleSets: [] };
  for (const rule of rules) renderEgernRule(rule, providers, assets, stats);
  return assets;
}

function renderProfile(rules, providers, assets, ruleSetStats) {
  const stats = { ruleSetRefs: 0, skippedProcessRuleSets: [], skippedProcessLogicRules: [], skippedEmptyRuleSets: [] };
  const renderedRules = [];
  for (const rule of rules) {
    const block = renderEgernRule(rule, providers, assets, stats);
    if (block.length > 0) renderedRules.push(...block);
  }
  return {
    output: [
      renderPrefix(ruleSetStats.assetCount, providers.size, rules.length),
      '# Generated from Clash Meta For Android/CMFA(mihomo).yaml.',
      '# Non-supplemental provider rule_set URLs point at generated Egern-native',
      '# YAML files under rulesets/generated/egern/.',
      '# PROCESS-NAME supplemental rule sets and process-scoped logic rules are omitted because Egern',
      '# does not document a process-name rule or process-name rule-set field.',
      '# Target-empty rule sets removed by global first-match deduplication are omitted.',
      'rules:', ...renderedRules, '',
    ].join('\n'), stats,
  };
}

function validateStaged(directory, output, cmfa, providers, rules, ruleSetStats) {
  const manifest = buildEgernGenerationManifest({
    assetRevision: ASSET_REVISION,
    cmfaSource: cmfa,
    routingGraphSource: readText(ROUTING_GRAPH_FILE),
    profileSource: output,
    generatedRuleSetDirectory: directory,
    sourceProviderCount: providers.size,
    sourceRuleCount: rules.length,
    ruleSetStats,
  });
  const result = validateEgernGenerationManifest({
    manifest, cmfaSource: cmfa, routingGraphSource: readText(ROUTING_GRAPH_FILE),
    profileSource: output, generatedRuleSetDirectory: directory,
    expectedSourceProviderCount: providers.size, expectedSourceRuleCount: rules.length,
    expectedAssetRevision: ASSET_REVISION,
  });
  if (result.failures.length) throw new Error(`Staged Egern validation failed: ${JSON.stringify(result.failures)}`);
  return manifest;
}

function publishStaged(directory, output, manifest, canonicalSnapshot) {
  const parent = path.dirname(GENERATED_RULESET_DIR);
  if (path.resolve(directory).startsWith(path.resolve(parent) + path.sep) !== true) throw new Error('Unsafe Egern staging path');
  const backup = path.join(parent, `.egern-backup-${process.pid}-${Date.now()}`);
  const profileTemp = `${EGERN_FILE}.tmp-${process.pid}`;
  const previousProfile = fs.readFileSync(EGERN_FILE);
  const previousSnapshot = canonicalSnapshot && fs.existsSync(SNAPSHOT_FILE) ? fs.readFileSync(SNAPSHOT_FILE) : null;
  fs.writeFileSync(profileTemp, output, 'utf8');
  fs.writeFileSync(path.join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  let movedOld = false;
  try {
    fs.renameSync(GENERATED_RULESET_DIR, backup);
    movedOld = true;
    fs.renameSync(directory, GENERATED_RULESET_DIR);
    fs.renameSync(profileTemp, EGERN_FILE);
    if (canonicalSnapshot) saveSnapshot(canonicalSnapshot);
  } catch (error) {
    if (movedOld) {
      if (fs.existsSync(GENERATED_RULESET_DIR)) fs.renameSync(GENERATED_RULESET_DIR, directory);
      fs.renameSync(backup, GENERATED_RULESET_DIR);
      fs.writeFileSync(profileTemp, previousProfile);
      fs.renameSync(profileTemp, EGERN_FILE);
      if (previousSnapshot) {
        const snapshotTemp = `${SNAPSHOT_FILE}.tmp-${process.pid}`;
        try { fs.writeFileSync(snapshotTemp, previousSnapshot); fs.renameSync(snapshotTemp, SNAPSHOT_FILE); }
        finally { if (fs.existsSync(snapshotTemp)) fs.rmSync(snapshotTemp); }
      } else if (canonicalSnapshot && fs.existsSync(SNAPSHOT_FILE)) fs.rmSync(SNAPSHOT_FILE);
    }
    throw error;
  } finally {
    if (fs.existsSync(profileTemp)) fs.rmSync(profileTemp);
  }
  fs.rmSync(backup, { recursive: true, force: true });
}

function canonicalBlockRules(rules) {
  const quic = getQuicRules('block-foreign');
  const without = rules.filter((rule) => !quic.includes(rule));
  const anchor = without.findIndex((rule) => rule.startsWith('DST-PORT,7680,'));
  if (anchor < 0) throw new Error('Cannot locate Egern QUIC insertion anchor');
  without.splice(anchor, 0, ...quic);
  return without;
}

async function main() {
  const args = process.argv.slice(2);
  const cli = parseCliOptions(args);
  const reuseAssets = cli.reuseAssets;
  const cmfa = readText(CMFA_FILE);
  const providers = parseProviders(cmfa);
  const rules = parseRules(cmfa);
  const options = getTrafficOptions();
  if (cli.supplementalPatch && options.quicPolicy !== 'block-foreign') throw new Error('Egern supplemental patch requires block-foreign; switch traffic options separately');
  let snapshot = cli.supplementalPatch ? loadSupplementalPatchSnapshot(cli.supplementalPatch) : reuseAssets ? loadSnapshot() : null;
  let canonicalSnapshot = null;
  const parent = path.dirname(GENERATED_RULESET_DIR);
  const canonicalDir = reuseAssets ? null : fs.mkdtempSync(path.join(parent, '.egern-canonical-'));
  const stageDir = fs.mkdtempSync(path.join(parent, '.egern-stage-'));
  let stagePublished = false;
  try {
    if (!reuseAssets) {
      const blockRules = canonicalBlockRules(rules);
      const canonicalAssets = discoverAssets(blockRules, providers);
      const canonicalStats = await generateNativeRuleSets(canonicalAssets, { outputDir: canonicalDir });
      const canonicalProfile = renderProfile(blockRules, providers, canonicalAssets, canonicalStats).output;
      const canonicalManifest = buildEgernGenerationManifest({ assetRevision: ASSET_REVISION, cmfaSource: cmfa,
        routingGraphSource: readText(ROUTING_GRAPH_FILE), profileSource: canonicalProfile,
        generatedRuleSetDirectory: canonicalDir, sourceProviderCount: providers.size,
        sourceRuleCount: blockRules.length, ruleSetStats: canonicalStats });
      canonicalSnapshot = packStagedOutput(canonicalDir, canonicalManifest);
      snapshot = canonicalSnapshot;
    }
    const assets = discoverAssets(rules, providers);
    const ruleSetStats = generateNativeRuleSetsFromSnapshot(assets, snapshot, { outputDir: stageDir, followRules: options.quicPolicy === 'follow-rules' });
    const { output, stats } = renderProfile(rules, providers, assets, ruleSetStats);
    const manifest = validateStaged(stageDir, output, cmfa, providers, rules, ruleSetStats);
    if (cli.supplementalPatch) {
      // Freeze the actually rendered and validated new assets, never rebind the
      // historical snapshot in place. Preserve its lineage in a separate field.
      const revalidated = loadSupplementalPatchSnapshot(cli.supplementalPatch);
      if (revalidated.supplementalPatch.receiptSha256 !== snapshot.supplementalPatch.receiptSha256) throw new Error('Egern supplemental receipt changed during staging');
      canonicalSnapshot = packStagedOutput(stageDir, manifest);
      canonicalSnapshot.supplementalPatchProvenance = {
        receipt_sha256: snapshot.supplementalPatch.receiptSha256,
        baseline_snapshot_sha256: snapshot.supplementalPatch.baselineSnapshotSha256,
        baseline_commit: snapshot.supplementalPatch.receipt.baseline_commit,
        untouched_original_inputs: snapshot.supplementalPatch.receipt.untouched_original_inputs,
      };
    }
    publishStaged(stageDir, output, manifest, canonicalSnapshot);
    stagePublished = true;
  console.log(`Generated Egern/Egern.yaml rules=${manifest.rendered.rule_count} rule_set_refs=${manifest.rendered.rule_set_ref_count} native_rule_sets=${manifest.rendered.native_rule_set_count} source_entries=${ruleSetStats.totalEntries} dedup_removed=${ruleSetStats.removedEntries} global_exact_removed=${ruleSetStats.globalExactDuplicates} empty_assets=${ruleSetStats.emptyAssets} skipped_process=${stats.skippedProcessRuleSets.join(',') || 'none'} skipped_process_logic=${stats.skippedProcessLogicRules.length} skipped_empty=${stats.skippedEmptyRuleSets.join(',') || 'none'} skipped_source_types=${ruleSetStats.skippedTypes.join(',') || 'none'}`);
  } finally {
    if (!stagePublished && fs.existsSync(stageDir)) fs.rmSync(stageDir, { recursive: true, force: true });
    if (canonicalDir && fs.existsSync(canonicalDir)) fs.rmSync(canonicalDir, { recursive: true, force: true });
  }
}

function parseCliOptions(args) {
  let reuseAssets = false;
  let supplementalPatch = null;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--reuse-assets' && !reuseAssets) reuseAssets = true;
    else if (args[index] === '--supplemental-patch' && !supplementalPatch && args[index + 1] && !args[index + 1].startsWith('--')) supplementalPatch = args[++index];
    else throw new Error(`Unknown or incomplete Egern generator option: ${args[index]}`);
  }
  if (supplementalPatch && reuseAssets) throw new Error('Use --supplemental-patch separately from --reuse-assets');
  return { reuseAssets: reuseAssets || Boolean(supplementalPatch), supplementalPatch };
}

module.exports = {
  applySupplementalPatchToNativeSnapshot,
  canonicalBlockRules,
  convertEntriesToSets,
  discoverAssets,
  fetchText,
  generateNativeRuleSets,
  generateNativeRuleSetsFromSnapshot,
  parseFrozenRuleSet,
  parseCliOptions,
  parsePayloadEntries,
  parseProviders,
  parseRules,
  renderProfile,
  sourceCacheFile,
  sourceInfoForProvider,
  validateStaged,
};

// Snapshot conversion reuses modules that import these helpers. Export them
// before the CLI starts its first synchronous validation pass.
if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}
