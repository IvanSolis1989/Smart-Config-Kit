'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_ROOT = path.resolve(__dirname, '../..');
const REGISTRY_RELATIVE_PATH = 'rulesets/source/adfp-exceptions.json';
const PROVIDER_PREFIX = 'scki-adfp-';
const REQUIRED_PROVIDERS = [
  'scki-adfp-direct',
  'scki-adfp-intl-site',
  'scki-adfp-payments',
  'scki-adfp-ai',
];
const ALLOWED_EVIDENCE_PATHS = new Set([
  'rulesets/supplemental/README.md',
  'docs/GEOSITE_COVERAGE_LEDGER.md',
  'docs/2026-05-30-proxy-override-借鉴设计.md',
  'Clash Party/CHANGELOG.md',
  'tools/tests/domestic-route-regression.test.js',
  'rulesets/source/routing-graph.js',
  ...REQUIRED_PROVIDERS.map(provider => `rulesets/supplemental/clash/${provider.replace('scki-', '')}.list`),
]);

function fail(message) {
  throw new Error(`ADFP exceptions: ${message}`);
}

function normalizeDomain(domain) {
  return String(domain).trim().toLowerCase().replace(/\.$/, '');
}

function domainMatchesScope(domain, record) {
  const candidate = normalizeDomain(domain);
  const rule = /^DOMAIN(-SUFFIX)?,([^,]+)$/.exec(record.rule);
  if (!rule) return false;
  const value = normalizeDomain(rule[2]);
  return rule[1] === '-SUFFIX'
    ? candidate === value || candidate.endsWith(`.${value}`)
    : candidate === value;
}

function parsePayload(text, payloadPath) {
  const entries = [];
  const seen = new Set();
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^(DOMAIN|DOMAIN-SUFFIX),([a-z0-9.-]+)$/.exec(line);
    if (!match) fail(`${payloadPath}:${index + 1} is not an exact DOMAIN or DOMAIN-SUFFIX rule: ${line}`);
    const key = `${match[1]},${normalizeDomain(match[2])}`;
    if (seen.has(key)) fail(`${payloadPath}:${index + 1} duplicates ${key}`);
    seen.add(key);
    entries.push({ rule: line, line: index + 1 });
  }
  return entries;
}

function validateAdfpExceptionData(options = {}) {
  const root = path.resolve(options.root || DEFAULT_ROOT);
  const registryPath = path.resolve(root, options.registryPath || REGISTRY_RELATIVE_PATH);
  const rawRegistryBytes = options.registry === undefined
    ? fs.readFileSync(registryPath)
    : Buffer.from(`${JSON.stringify(options.registry, null, 2)}\n`, 'utf8');
  const registryBytes = Buffer.from(rawRegistryBytes.toString('utf8').replace(/\r\n/g, '\n'));
  const registry = options.registry === undefined ? JSON.parse(registryBytes.toString('utf8')) : options.registry;
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };

  check(registry && registry.schema_version === 1, 'schema_version must equal 1');
  check(Array.isArray(registry && registry.records), 'records must be an array');
  if (!Array.isArray(registry && registry.records)) fail(errors.join('; '));

  const graph = require(path.join(root, 'rulesets/source/routing-graph.js')).getRawRoutingGraph();
  const rules = graph.rules;
  const providers = graph['rule-providers'] || {};
  const antiAdIndex = rules.indexOf('RULE-SET,anti-ad,🛑 广告拦截');
  check(antiAdIndex >= 0, 'raw source graph has no anti-ad precedence anchor');
  const graphBindings = new Map();
  for (const [index, rule] of rules.entries()) {
    const match = /^RULE-SET,(scki-adfp-[^,]+),(.+)$/.exec(rule);
    if (match) graphBindings.set(match[1], { index, target: match[2] });
  }
  check(JSON.stringify([...graphBindings.keys()].sort()) === JSON.stringify(REQUIRED_PROVIDERS.slice().sort()),
    'raw source graph ADFP provider set differs from the four governed providers');

  const ids = new Set();
  const coveredByProvider = new Map();
  const recordsByPayload = new Map();
  const payloadEntries = new Map();
  for (const provider of REQUIRED_PROVIDERS) {
    const providerConfig = providers[provider];
    const binding = graphBindings.get(provider);
    check(Boolean(providerConfig && binding), `${provider} is missing from raw source graph providers or rules`);
    if (!providerConfig || !binding) continue;
    const expectedUrl = `https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/supplemental/clash/${provider.replace('scki-', '')}.list`;
    const expectedPath = `./ruleset/${provider}.list`;
    check(providerConfig.url === expectedUrl, `${provider} URL does not point to its governed payload`);
    check(providerConfig.path === expectedPath, `${provider} path does not point to its governed local payload`);
    check(binding.index < antiAdIndex, `${provider} must be ordered before anti-ad in source graph`);
    coveredByProvider.set(provider, binding);
    const payloadPath = `rulesets/supplemental/clash/${provider.replace('scki-', '')}.list`;
    const payload = parsePayload(fs.readFileSync(path.join(root, payloadPath), 'utf8'), payloadPath);
    payloadEntries.set(provider, payload);
    recordsByPayload.set(provider, new Set());
  }

  for (const [index, record] of registry.records.entries()) {
    const where = `records[${index}]`;
    check(record && typeof record === 'object', `${where} must be an object`);
    if (!record || typeof record !== 'object') continue;
    check(typeof record.id === 'string' && record.id.length > 0, `${where}.id is required`);
    if (record.id) {
      check(!ids.has(record.id), `${where}.id duplicates ${record.id}`);
      ids.add(record.id);
    }
    check(REQUIRED_PROVIDERS.includes(record.provider), `${where}.provider is not one of the four governed providers`);
    check(typeof record.reason === 'string' && record.reason.trim().length > 0, `${where}.reason is required`);
    check(['exact', 'suffix'].includes(record.match_scope), `${where}.match_scope must be exact or suffix`);
    check(typeof record.rule === 'string' && /^(DOMAIN|DOMAIN-SUFFIX),[a-z0-9.-]+$/.test(record.rule), `${where}.rule must be a raw domain rule`);
    check(Array.isArray(record.evidence) && record.evidence.length > 0, `${where}.evidence must be non-empty`);
    check(Array.isArray(record.positive_examples) && record.positive_examples.length > 0, `${where}.positive_examples must be non-empty`);
    check(Array.isArray(record.negative_examples) && record.negative_examples.length > 0, `${where}.negative_examples must be non-empty`);
    check(record.expected_relation && record.expected_relation.positive_examples_match === true && record.expected_relation.negative_examples_match === false,
      `${where}.expected_relation must declare positive=true and negative=false`);
    if (record.rule) {
      const ruleMatch = /^(DOMAIN|DOMAIN-SUFFIX),([^,]+)$/.exec(record.rule);
      const actualScope = ruleMatch && ruleMatch[1] === 'DOMAIN' ? 'exact' : 'suffix';
      check(actualScope === record.match_scope, `${where}.match_scope disagrees with ${record.rule}`);
    }

    const binding = coveredByProvider.get(record.provider);
    check(Boolean(binding), `${where}.provider is not in source graph`);
    if (binding) check(record.target_policy === binding.target, `${where}.target_policy disagrees with source graph target ${binding.target}`);

    if (Array.isArray(record.evidence)) {
      for (const [evidenceIndex, evidence] of record.evidence.entries()) {
        const evidenceWhere = `${where}.evidence[${evidenceIndex}]`;
        check(evidence && typeof evidence.path === 'string' && ALLOWED_EVIDENCE_PATHS.has(evidence.path), `${evidenceWhere}.path is not an approved local evidence source`);
        check(evidence && ['historical-owner-decision', 'static', 'inferred'].includes(evidence.level), `${evidenceWhere}.level is invalid`);
        check(evidence && typeof evidence.anchor === 'string' && evidence.anchor.trim().length > 0, `${evidenceWhere}.anchor is required`);
        if (evidence && ALLOWED_EVIDENCE_PATHS.has(evidence.path) && evidence.anchor) {
          const evidenceAbsolutePath = path.resolve(root, evidence.path);
          check(evidenceAbsolutePath.startsWith(`${root}${path.sep}`), `${evidenceWhere}.path escapes repository root`);
          check(fs.existsSync(evidenceAbsolutePath), `${evidenceWhere}.path does not exist`);
          if (fs.existsSync(evidenceAbsolutePath)) {
            check(fs.readFileSync(evidenceAbsolutePath, 'utf8').includes(evidence.anchor), `${evidenceWhere}.anchor not found in ${evidence.path}`);
          }
        }
      }
    }

    if (Array.isArray(record.positive_examples)) {
      for (const host of record.positive_examples) check(domainMatchesScope(host, record) === record.expected_relation?.positive_examples_match,
        `${where} positive example has unexpected scope relation: ${host}`);
    }
    if (Array.isArray(record.negative_examples)) {
      for (const host of record.negative_examples) check(domainMatchesScope(host, record) === record.expected_relation?.negative_examples_match,
        `${where} negative example has unexpected scope relation: ${host}`);
    }

    if (typeof record.provider === 'string' && recordsByPayload.has(record.provider)) {
      const payloadRule = recordsByPayload.get(record.provider);
      check(!payloadRule.has(record.rule), `${where} duplicates payload rule ${record.rule}`);
      payloadRule.add(record.rule);
    }
  }

  for (const [provider, payload] of payloadEntries) {
    const registryRules = recordsByPayload.get(provider);
    const payloadRules = new Set(payload.map(entry => entry.rule));
    for (const entry of payload) check(registryRules.has(entry.rule), `${provider}:${entry.line} is missing from registry: ${entry.rule}`);
    for (const rule of registryRules) check(payloadRules.has(rule), `${provider} registry adds rule absent from payload: ${rule}`);
    check(registryRules.size === payload.length, `${provider} registry coverage count ${registryRules.size} differs from payload count ${payload.length}`);
  }

  if (errors.length) fail(errors.join('\n- '));
  const counts = Object.fromEntries([...payloadEntries].map(([provider, entries]) => [provider, entries.length]));
  return {
    schema_version: registry.schema_version,
    source_graph_version: graph.version,
    registry_sha256: crypto.createHash('sha256').update(registryBytes).digest('hex'),
    total_records: registry.records.length,
    coverage: counts,
    ordered_provider_indices: Object.fromEntries([...coveredByProvider].map(([provider, binding]) => [provider, binding.index])),
    anti_ad_index: antiAdIndex,
  };
}

function validateAdfpExceptions(options) {
  return validateAdfpExceptionData(options);
}

module.exports = {
  REQUIRED_PROVIDERS,
  domainMatchesScope,
  validateAdfpExceptionData,
  validateAdfpExceptions,
};
