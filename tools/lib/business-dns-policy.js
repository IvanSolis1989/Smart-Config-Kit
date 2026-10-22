'use strict';

// Routing references establish provenance, not upstream membership for each domain.
const SOURCE_FILE = 'rulesets/source/business-dns-policy.json';
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

function fail(location, message) {
  throw new Error(`${SOURCE_FILE}: ${location}: ${message}`);
}

function objectWithKeys(value, keys, location) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(location, 'expected an object');
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) fail(location, `unknown key ${key}`);
  }
  for (const key of keys) {
    if (!own(value, key)) fail(location, `missing key ${key}`);
  }
}

function nonemptyString(value, location) {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim()) {
    fail(location, 'expected a nonempty string without surrounding whitespace');
  }
}

function validDomain(value) {
  return typeof value === 'string' && value.length <= 253 && value.includes('.') &&
    value.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
}

function resolverUrl(value, location) {
  nonemptyString(value, location);
  let url;
  try { url = new URL(value); } catch { fail(location, 'invalid resolver URL'); }
  if (url.protocol !== 'https:') fail(location, 'resolver URL must use HTTPS');
  if (!/^https:\/\/[^/]/.test(value) || !url.hostname || url.username || url.password || url.hash || /[\s\\]/.test(value)) {
    fail(location, 'unsupported resolver URL (credentials, fragments and whitespace are forbidden)');
  }
}

function validateReference(reference, rawGraph, location) {
  if (!reference || typeof reference !== 'object' || Array.isArray(reference)) fail(location, 'expected a reference object');
  const providers = rawGraph['rule-providers'];
  if (reference.type === 'provider') {
    objectWithKeys(reference, ['type', 'name', 'policy'], location);
    nonemptyString(reference.name, `${location}.name`);
    nonemptyString(reference.policy, `${location}.policy`);
    if (!own(providers, reference.name)) fail(location, `missing routing provider ${reference.name}`);
    const rule = `RULE-SET,${reference.name},${reference.policy}`;
    if (!rawGraph.rules.includes(rule)) fail(location, `missing provider policy routing rule ${rule}`);
  } else if (reference.type === 'provider-url-suffix') {
    objectWithKeys(reference, ['type', 'value'], location);
    if (!validDomain(reference.value)) fail(location, 'invalid provider URL hostname suffix');
    const found = Object.values(providers).some(provider => {
      if (!provider || provider.type !== 'http' || typeof provider.url !== 'string') return false;
      let url;
      try { url = new URL(provider.url); } catch { return false; }
      return ['https:', 'http:'].includes(url.protocol) &&
        (url.hostname === reference.value || url.hostname.endsWith(`.${reference.value}`));
    });
    if (!found) fail(location, `no HTTP provider URL with hostname suffix ${reference.value}`);
  } else if (reference.type === 'rule') {
    objectWithKeys(reference, ['type', 'value'], location);
    nonemptyString(reference.value, `${location}.value`);
    if (!rawGraph.rules.includes(reference.value)) fail(location, `missing exact routing rule ${reference.value}`);
  } else {
    fail(location, `unsupported routing reference type ${String(reference.type)}`);
  }
}

function validateBusinessDnsPolicy(contract, rawGraph) {
  objectWithKeys(contract, ['schemaVersion', 'resolvers', 'policies'], 'contract');
  if (contract.schemaVersion !== 1) fail('schemaVersion', 'expected version 1');
  objectWithKeys(contract.resolvers, ['domestic', 'foreign'], 'resolvers');
  for (const [name, urls] of Object.entries(contract.resolvers)) {
    const location = `resolvers.${name}`;
    if (!Array.isArray(urls) || !urls.length) fail(location, 'expected a nonempty URL array');
    const seen = new Set();
    for (const [index, url] of urls.entries()) {
      resolverUrl(url, `${location}[${index}]`);
      if (seen.has(url)) fail(location, `duplicate resolver URL ${url}`);
      seen.add(url);
    }
  }
  if (!rawGraph || typeof rawGraph !== 'object' || !rawGraph['rule-providers'] ||
      typeof rawGraph['rule-providers'] !== 'object' || Array.isArray(rawGraph['rule-providers']) ||
      !Array.isArray(rawGraph.rules) || !rawGraph.rules.every(rule => typeof rule === 'string')) {
    fail('rawGraph', 'expected rule-providers object and routing rules array');
  }
  if (!Array.isArray(contract.policies) || !contract.policies.length) fail('policies', 'expected a nonempty policy array');
  const ids = new Set();
  const matches = new Set();
  for (const [index, policy] of contract.policies.entries()) {
    const location = `policies[${index}]`;
    objectWithKeys(policy, ['id', 'match', 'resolver', 'routingReferences'], location);
    nonemptyString(policy.id, `${location}.id`);
    if (ids.has(policy.id)) fail(location, `duplicate policy id ${policy.id}`);
    ids.add(policy.id);
    nonemptyString(policy.match, `${location}.match`);
    if (!(policy.match.startsWith('+.') && validDomain(policy.match.slice(2))) &&
        !/^geosite:[a-z0-9][a-z0-9_!@-]*$/.test(policy.match)) {
      fail(location, `unsupported policy match ${policy.match}; expected +.domain or geosite:name`);
    }
    if (matches.has(policy.match)) fail(location, `duplicate policy match ${policy.match}`);
    matches.add(policy.match);
    if (typeof policy.resolver !== 'string' || !own(contract.resolvers, policy.resolver)) {
      fail(location, `undefined resolver ${String(policy.resolver)}`);
    }
    if (!Array.isArray(policy.routingReferences) || !policy.routingReferences.length) {
      fail(`${location}.routingReferences`, 'expected nonempty routingReferences array');
    }
    policy.routingReferences.forEach((reference, referenceIndex) => {
      validateReference(reference, rawGraph, `${location}.routingReferences[${referenceIndex}]`);
    });
  }
  return contract;
}

function compileBusinessDnsPolicy(contract, rawGraph) {
  validateBusinessDnsPolicy(contract, rawGraph);
  const compile = policies => Object.fromEntries(policies.map(policy =>
    [policy.match, [...contract.resolvers[policy.resolver]]],
  ));
  // Preserve each client's established insertion order without changing the values.
  const yamlPolicies = [
    ...contract.policies.filter(policy => policy.match.startsWith('geosite:')),
    ...contract.policies.filter(policy => !policy.match.startsWith('geosite:')),
  ];
  return { javascript: compile(contract.policies), yaml: compile(yamlPolicies) };
}

module.exports = { SOURCE_FILE, validateBusinessDnsPolicy, compileBusinessDnsPolicy };
