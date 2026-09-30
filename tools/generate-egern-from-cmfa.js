#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { optimizeEntries, resolveOpaqueMrsSource } = require('./lib/fused-rule-optimizer');
const { buildEgernGenerationManifest } = require('./lib/egern-generation-manifest');
const {
  SCKI_REPOSITORY_BASE,
  repositoryAssetUrl,
  withAssetRevision,
} = require('./lib/generated-asset-url');
const { SOURCE_GRAPH_VERSION } = require('../rulesets/source/routing-graph');

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
const EGERN_VERSION = 'v6.0.14-egern.6';
const BUILD_DATE = '2026-09-30';
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

async function main() {
  const cmfa = readText(CMFA_FILE);
  const providers = parseProviders(cmfa);
  const rules = parseRules(cmfa);
  const assets = new Map();
  const discoveryStats = { ruleSetRefs: 0, skippedProcessRuleSets: [], skippedProcessLogicRules: [], skippedEmptyRuleSets: [] };
  for (const rule of rules) renderEgernRule(rule, providers, assets, discoveryStats);

  const ruleSetStats = await generateNativeRuleSets(assets);
  const stats = { ruleSetRefs: 0, skippedProcessRuleSets: [], skippedProcessLogicRules: [], skippedEmptyRuleSets: [] };
  const renderedRules = [];

  for (const rule of rules) {
    const block = renderEgernRule(rule, providers, assets, stats);
    if (block.length > 0) renderedRules.push(...block);
  }

  const output = [
    renderPrefix(ruleSetStats.assetCount, providers.size, rules.length),
    '# Generated from Clash Meta For Android/CMFA(mihomo).yaml.',
    '# Non-supplemental provider rule_set URLs point at generated Egern-native',
    '# YAML files under rulesets/generated/egern/.',
    '# PROCESS-NAME supplemental rule sets and process-scoped logic rules are omitted because Egern',
    '# does not document a process-name rule or process-name rule-set field.',
    '# Target-empty rule sets removed by global first-match deduplication are omitted.',
    'rules:',
    ...renderedRules,
    '',
  ].join('\n');

  fs.writeFileSync(EGERN_FILE, output, 'utf8');
  const manifest = buildEgernGenerationManifest({
    assetRevision: ASSET_REVISION,
    cmfaSource: cmfa,
    routingGraphSource: readText(ROUTING_GRAPH_FILE),
    profileSource: output,
    generatedRuleSetDirectory: GENERATED_RULESET_DIR,
    sourceProviderCount: providers.size,
    sourceRuleCount: rules.length,
    ruleSetStats,
  });
  fs.writeFileSync(EGERN_GENERATION_MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Generated Egern/Egern.yaml rules=${manifest.rendered.rule_count} rule_set_refs=${manifest.rendered.rule_set_ref_count} native_rule_sets=${manifest.rendered.native_rule_set_count} source_entries=${ruleSetStats.totalEntries} dedup_removed=${ruleSetStats.removedEntries} global_exact_removed=${ruleSetStats.globalExactDuplicates} empty_assets=${ruleSetStats.emptyAssets} skipped_process=${stats.skippedProcessRuleSets.join(',') || 'none'} skipped_process_logic=${stats.skippedProcessLogicRules.length} skipped_empty=${stats.skippedEmptyRuleSets.join(',') || 'none'} skipped_source_types=${ruleSetStats.skippedTypes.join(',') || 'none'}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}

module.exports = {
  convertEntriesToSets,
  fetchText,
  generateNativeRuleSets,
  parsePayloadEntries,
  sourceCacheFile,
  sourceInfoForProvider,
};
