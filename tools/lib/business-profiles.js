'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const graph = require('../../rulesets/source/routing-graph');
const { splitTopLevel } = require('./fused-rule-optimizer');

function getBusinessProfileCatalog() {
  const definitions = graph.getBusinessProfileDefinitions();
  if (definitions.schemaVersion !== 1) throw new Error('Unsupported business profile schema');
  const allKeys = [...definitions.protectedBusinessKeys, ...Object.values(definitions.services)];
  if (new Set(allKeys).size !== allKeys.length || allKeys.length !== Object.keys(graph.BIZ).length ||
      allKeys.some(key => !Object.hasOwn(graph.BIZ, key))) throw new Error('Business profile catalog must partition the source BIZ keys exactly');
  return {
    schemaVersion: 1,
    protectedGroups: definitions.protectedBusinessKeys.map(key => graph.BIZ[key]),
    services: Object.entries(definitions.services).map(([id, key]) => ({ id, key, group: graph.BIZ[key] })),
    presets: definitions.presets,
    fallbackExplanation: definitions.fallbackExplanation,
  };
}

function resolveBusinessProfile(options = {}) {
  const catalog = getBusinessProfileCatalog();
  const profile = options.profile === undefined || options.profile === 'default' ? 'full' : options.profile;
  if (!['full', 'lite', 'custom'].includes(profile)) throw new Error('profile must be full, lite or custom');
  const supplied = options.enable !== undefined;
  if (supplied && profile !== 'custom') throw new Error('--enable is only valid with --profile custom');
  const enable = supplied ? (typeof options.enable === 'string' ? options.enable.split(',').filter(Boolean) : options.enable) : [];
  if (!Array.isArray(enable) || enable.some(id => typeof id !== 'string' || !catalog.services.some(service => service.id === id))) {
    throw new Error('Unknown business service; use --list to inspect the source catalog');
  }
  if (new Set(enable).size !== enable.length) throw new Error('Duplicate enabled business service');
  const selected = new Set(profile === 'full' ? catalog.services.map(service => service.id) : profile === 'lite' ? catalog.presets.lite : enable);
  return {
    profile,
    enabled: catalog.services.filter(service => selected.has(service.id)),
    disabled: catalog.services.filter(service => !selected.has(service.id)),
    protectedGroups: catalog.protectedGroups,
    fallbackExplanation: catalog.fallbackExplanation,
  };
}

function rulePolicy(rule) {
  const parts = splitTopLevel(rule);
  return parts[parts[parts.length - 1] === 'no-resolve' ? parts.length - 2 : parts.length - 1];
}

function readSafetyResiduals(root, manifest) {
  const safetyByProvider = {}, surgeSafetyBySegment = {}, nativeSafetySegments = [], safetySourceAssets = [], safetySourceHashes = {};
  function readAsset(relative) {
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(`${root}${path.sep}`)) throw new Error('Safety asset escaped repository');
    let current = absolute;
    while (current !== root) {
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Refusing safety source symlink: ${relative}`);
      current = path.dirname(current);
    }
    const bytes = fs.readFileSync(absolute);
    safetySourceHashes[relative] = crypto.createHash('sha256').update(bytes).digest('hex');
    return bytes.toString('utf8');
  }
  const hasNativeProcess = value => value && typeof value === 'object' &&
    (Object.keys(value).some(key => /^process_|^package_/.test(key)) || Object.values(value).some(item =>
      Array.isArray(item) ? item.some(hasNativeProcess) : hasNativeProcess(item)));
  for (const segment of manifest.segments) {
    const residual = segment.files?.residual;
    if (!residual) continue;
    const relative = `rulesets/generated/fused/mihomo/${residual.file}`;
    if (!/^[a-z0-9.-]+\.yaml$/.test(residual.file)) throw new Error('Unsafe fused residual filename');
    const text = readAsset(relative);
    const entries = [];
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim() || line.trim().startsWith('#') || line === 'payload:') continue;
      const match = /^\s+- (".*")\s*$/.exec(line);
      if (!match) throw new Error(`Unknown generated residual payload structure: ${relative}`);
      const entry = JSON.parse(match[1]);
      if (/^(?:PROCESS-|AND,|OR,|NOT,)/.test(entry)) entries.push(entry);
    }
    if (!entries.length) continue;
    safetySourceAssets.push(relative);
    safetyByProvider[residual.file.replace(/\.yaml$/, '')] = entries;
    const surge = segment.files?.surge;
    if (surge) {
      if (!/^[a-z0-9.-]+\.list$/.test(surge.file)) throw new Error('Unsafe fused Surge filename');
      const surgeRelative = `rulesets/generated/fused/surge/${surge.file}`;
      const actual = new Set(readAsset(surgeRelative).split(/\r?\n/).map(line => line.trim()));
      surgeSafetyBySegment[segment.id] = entries.filter(entry => actual.has(entry));
      safetySourceAssets.push(surgeRelative);
    }
    const native = segment.files?.sing_box;
    if (native?.source) {
      if (!/^[a-z0-9.-]+\.json$/.test(native.source)) throw new Error('Unsafe fused native source filename');
      const nativeRelative = `rulesets/generated/fused/sing-box/${native.source}`;
      const value = JSON.parse(readAsset(nativeRelative));
      if (hasNativeProcess(value)) nativeSafetySegments.push(segment.id);
      safetySourceAssets.push(nativeRelative);
    }
  }
  return { safetyByProvider, surgeSafetyBySegment, nativeSafetySegments, safetySourceAssets, safetySourceHashes };
}

function buildProfilePlan(options = {}) {
  const selection = resolveBusinessProfile(options);
  const root = path.resolve(options.root || path.join(__dirname, '../..'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'rulesets/generated/fused/manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.source_segments) || !Array.isArray(manifest.segments)) throw new Error('Fused compiler source segment catalog missing');
  const { trafficSourceFingerprint } = require('../build-fused-rule-sets');
  if (manifest.baseline_version !== graph.SOURCE_GRAPH_VERSION || manifest.traffic_source_fingerprint !== trafficSourceFingerprint()) {
    throw new Error('Fused snapshot differs from the current source routing graph; regenerate the default artifacts first');
  }
  const source = graph.getMihomoNormalizedRoutingGraph();
  const sourceRules = new Set(source.rules);
  if (manifest.source_segments.some(segment => segment.source_rules.some(rule => !sourceRules.has(rule)))) {
    throw new Error('Fused source catalog differs from current routing graph; regenerate the default artifacts first');
  }
  const disabledGroups = selection.disabled.map(service => service.group);
  const direct = new Set(graph.getBusinessProfileDefinitions().directFallbackKeys);
  const fallbacks = Object.fromEntries(selection.disabled.map(service => [service.group, direct.has(service.key) ? graph.BIZ.CN_SITE : graph.BIZ.INTL_SITE]));
  const safety = readSafetyResiduals(root, manifest);
  const protectedSegments = Object.keys(safety.safetyByProvider).map(name => name.replace(/-residual$/, ''));
  const disabledSegments = manifest.source_segments.filter(segment => disabledGroups.includes(segment.policy) && !safety.nativeSafetySegments.includes(segment.id)).map(segment => segment.id);
  const plan = {
    schemaVersion: 1, source: graph.SOURCE_GRAPH_ID, sourceVersion: graph.SOURCE_GRAPH_VERSION,
    finalRule: source.rules[source.rules.length - 1],
    profile: selection.profile, enabled: selection.enabled.map(service => service.id),
    disabled: selection.disabled.map(service => service.id), disabledGroups,
    protectedGroups: selection.protectedGroups, fallbacks, protectedSegments, disabledSegments,
    nativeFallbacks: Object.fromEntries(selection.disabled.map(service => [service.group, direct.has(service.key) ? 'direct' : 'proxy'])),
    ...safety,
    segmentPolicies: Object.fromEntries(manifest.source_segments.map(segment => [segment.id, segment.policy])),
    fallbackExplanation: selection.fallbackExplanation,
  };
  const projected = projectMihomoConfig({ 'rule-providers': source['rule-providers'], rules: source.rules }, plan);
  plan.sourceRules = { before: source.rules.length, after: projected.rules.length,
    removed: source.rules.filter(rule => !projected.rules.includes(rule) && !isProtectedRule(rule, plan)),
    retainedRetargeted: source.rules.filter(rule => disabledGroups.includes(rulePolicy(rule)) && isProtectedRule(rule, plan))
      .map(rule => ({ before: rule, after: rewriteRulePolicy(rule, fallbacks[rulePolicy(rule)]) })) };
  return plan;
}

function isProtectedRule(rule, plan) {
  const parts = splitTopLevel(rule);
  return ['AND', 'OR', 'NOT'].includes(parts[0]) || /^PROCESS-/.test(parts[0]) ||
    (parts[0] === 'RULE-SET' && Boolean(plan.safetyByProvider?.[parts[1]])) ||
    /RULE-SET,[^,)]*process(?:[,)]|$)/i.test(rule);
}

function rewriteRulePolicy(rule, policy) {
  const parts = splitTopLevel(rule);
  parts[parts[parts.length - 1] === 'no-resolve' ? parts.length - 2 : parts.length - 1] = policy;
  return parts.join(',');
}

// Self contained so generated QuickJS scripts can use the same projection.
// The only inputs are the maintained main(config) result and a build-time plan.
function projectMihomoConfig(config, plan) {
  function split(rule) {
    let depth = 0, token = ''; const parts = [];
    for (const char of String(rule)) {
      if (char === ',' && depth === 0) { parts.push(token.trim()); token = ''; continue; }
      if (char === '(') depth++; else if (char === ')') depth--;
      if (depth < 0) throw new Error('Unbalanced business profile rule: ' + rule);
      token += char;
    }
    if (depth !== 0) throw new Error('Unbalanced business profile rule: ' + rule);
    parts.push(token.trim()); return parts;
  }
  const disabled = new Set(plan.disabledGroups);
  function checkRetainedReferences(value, dns) {
    if (typeof value === 'string' && dns) {
      let decoded = value; try { decoded = decodeURIComponent(value); } catch {}
      const suffix = decoded.includes('#') ? decoded.slice(decoded.indexOf('#') + 1).split('&')[0] : '';
      if (disabled.has(value) || disabled.has(suffix)) throw new Error('Business profile would remove a DNS outbound dependency: ' + (suffix || value));
    } else if (Array.isArray(value)) value.forEach(item => checkRetainedReferences(item, dns));
    else if (value && typeof value === 'object') for (const key of Object.keys(value)) {
      if (['dialer-proxy', 'detour', 'download_detour', 'proxy', 'underlying-proxy'].includes(key) && disabled.has(value[key])) {
        throw new Error('Business profile would remove a retained node/provider dependency: ' + value[key]);
      }
      checkRetainedReferences(value[key], dns);
    }
  }
  checkRetainedReferences(config.proxies, false);
  checkRetainedReferences(config['proxy-providers'], false);
  checkRetainedReferences(config.dns, true);
  if (!Array.isArray(config.rules)) throw new Error('Mihomo profile rules must be an array');
  // Object spread defines own data properties and cannot invoke the inherited
  // __proto__ setter on JSON subscription keys.
  const result = { ...config };
  result.rules = [];
  for (const rule of config.rules) {
    const parts = split(rule);
    const targetIndex = parts.length - (parts[parts.length - 1] === 'no-resolve' ? 2 : 1);
    const target = parts[targetIndex];
    if (!disabled.has(target)) { result.rules.push(rule); continue; }
    const safetyEntries = parts[0] === 'RULE-SET' && plan.safetyByProvider && plan.safetyByProvider[parts[1]];
    if (safetyEntries) {
      for (const entry of safetyEntries) {
        const matcher = split(entry);
        const noResolve = matcher[matcher.length - 1] === 'no-resolve';
        if (noResolve) matcher.pop();
        matcher.push(plan.fallbacks[target]);
        if (noResolve) matcher.push('no-resolve');
        result.rules.push(matcher.join(','));
      }
      continue;
    }
    const protectedRule = ['AND', 'OR', 'NOT'].includes(parts[0]) || /^PROCESS-/.test(parts[0]) ||
      /RULE-SET,[^,)]*process(?:[,)]|$)/i.test(rule);
    if (protectedRule) { parts[targetIndex] = plan.fallbacks[target]; result.rules.push(parts.join(',')); }
  }
  if (config['proxy-groups']) {
    result['proxy-groups'] = config['proxy-groups'].filter(group => !disabled.has(group.name)).map(group => {
      if (!Array.isArray(group.proxies)) return group;
      if (group.type === 'relay' && group.proxies.some(name => disabled.has(name))) throw new Error('Business profile would alter a retained relay chain: ' + group.name);
      const proxies = group.proxies.filter(name => !disabled.has(name));
      if (!proxies.length && group.proxies.length) throw new Error('Empty profile proxy-group: ' + group.name);
      return { ...group, proxies };
    });
  }
  const providers = config['rule-providers'] || {}, dependencies = new Set();
  function collect(value) {
    if (typeof value === 'string') {
      let match;
      const pattern = /(?:RULE-SET\s*,\s*|rule-set\s*:\s*)([^,\s)]+)/gi;
      while ((match = pattern.exec(value))) dependencies.add(match[1]);
    } else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') Object.keys(value).forEach(key => { collect(key); collect(value[key]); });
  }
  for (const key of Object.keys(result)) if (key !== 'rule-providers') collect(result[key]);
  const inspected = new Set();
  while (inspected.size < dependencies.size) {
    for (const name of dependencies) {
      if (inspected.has(name)) continue;
      if (!Object.prototype.hasOwnProperty.call(providers, name)) throw new Error('Unknown profile rule-provider dependency: ' + name);
      inspected.add(name); collect(providers[name]);
    }
  }
  result['rule-providers'] = Object.fromEntries(Object.entries(providers).filter(([name]) => dependencies.has(name)));
  checkRetainedReferences(result['rule-providers'], false);
  return result;
}

module.exports = { getBusinessProfileCatalog, resolveBusinessProfile, buildProfilePlan, rulePolicy,
  isProtectedRule, rewriteRulePolicy, projectMihomoConfig,
  generateBusinessProfile: options => require('./business-profile-output').generateBusinessProfile(options) };
