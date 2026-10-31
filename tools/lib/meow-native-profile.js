'use strict';

// Schema and selection semantics are pinned to meow-rs v0.26.1:
// crates/meow-config/src/raw.rs (RawDns/RawFallbackFilter/RawProxyGroup),
// proxy_parser.rs:3097-3104 (filters affect provider members only), and
// crates/meow-proxy/src/group/urltest.rs:140-198 (healthy measured members
// take priority over the first static member). No Mihomo extension leaks in.
const GROUP_FIELDS = [
  'name', 'type', 'proxies', 'use', 'filter', 'exclude-filter', 'exclude-type',
  'include-all', 'include-all-proxies', 'url', 'interval', 'lazy', 'tolerance',
];
const GROUP_TYPES = new Set(['select', 'url-test', 'fallback', 'load-balance', 'relay']);
const DNS_FIELDS = [
  'enable', 'enhanced-mode', 'nameserver', 'fallback', 'default-nameserver',
  'proxy-server-nameserver', 'nameserver-policy', 'fake-ip-range', 'fake-ip-filter',
  'fake-ip-filter-mode', 'store-fake-ip', 'use-hosts', 'use-system-hosts',
];
const SUBSCRIPTION_FIELDS = [
  'type', 'path', 'interval', 'filter', 'exclude-filter', 'exclude-type',
  'health-check', 'header', 'proxy',
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function pick(source, fields) {
  return Object.fromEntries(fields.filter(key => source[key] !== undefined)
    .map(key => [key, clone(source[key])]));
}

/**
 * Project an already parsed CMFA profile into the official native YAML schema.
 * `routing` is the validated fused runtime projection; never derive its rules
 * or providers from CMFA. Callers own YAML I/O and subscription URL replacement.
 */
function buildNativeProfile(cmfa, routing) {
  if (!cmfa || !Array.isArray(cmfa['proxy-groups']) || !cmfa['proxy-providers']?.Subscribe) {
    throw new Error('CMFA proxy-groups and Subscribe proxy-provider are required');
  }
  if (!routing?.providers || !Array.isArray(routing.rules)) {
    throw new Error('Validated routing providers and rules are required');
  }

  const subscription = pick(cmfa['proxy-providers'].Subscribe, SUBSCRIPTION_FIELDS);
  subscription.type = 'http';
  // Deliberately unusable: replace before the first native config check/import.
  subscription.url = 'https://example.invalid/replace-with-your-subscription-url';
  if (subscription['health-check']) {
    subscription['health-check'] = pick(subscription['health-check'], ['enable', 'url', 'interval', 'lazy']);
  }

  const groups = cmfa['proxy-groups'].map(source => {
    if (!GROUP_TYPES.has(source.type)) {
      throw new Error(`Unsupported native proxy-group type: ${source.type} (${source.name})`);
    }
    const group = pick(source, GROUP_FIELDS);
    for (const provider of group.use || []) {
      if (provider !== 'Subscribe') throw new Error(`Unknown native proxy-provider: ${provider} (${group.name})`);
    }
    if (group.type === 'url-test') {
      // A real empty provider slot is legal. Keep a static reject member so
      // cold starts, empty regions and total health failure never dial DIRECT.
      // Static members bypass filter/exclude-type; real measured nodes win.
      group.proxies = ['REJECT'];
      group['exclude-type'] = ['direct', 'reject'];
    }
    return group;
  });

  const dns = pick(cmfa.dns || {}, DNS_FIELDS);
  dns.listen = '127.0.0.1:1053';
  if (dns['store-fake-ip'] === undefined && cmfa.profile?.['store-fake-ip'] !== undefined) {
    dns['store-fake-ip'] = Boolean(cmfa.profile['store-fake-ip']);
  }
  if (cmfa.dns?.['fallback-filter']) {
    // RawFallbackFilter has no geosite field in v0.26.1.
    dns['fallback-filter'] = pick(cmfa.dns['fallback-filter'], ['geoip', 'geoip-code', 'ipcidr', 'domain']);
  }

  const profile = {
    'mixed-port': cmfa['mixed-port'] ?? 7890,
    'allow-lan': false,
    'bind-address': '127.0.0.1',
    mode: cmfa.mode || 'rule',
    'log-level': cmfa['log-level'] || 'info',
    ipv6: cmfa.ipv6 ?? false,
    strict: true,
    ...pick(cmfa, ['hosts']),
    dns,
    'proxy-groups': groups,
    'proxy-providers': { Subscribe: subscription },
    'rule-providers': clone(routing.providers),
    rules: clone(routing.rules),
  };
  if (cmfa['geox-url']) {
    profile.geodata = {
      'auto-update': cmfa['geo-auto-update'] ?? true,
      'auto-update-interval': cmfa['geo-update-interval'] ?? 24,
      // The native loader supports both MRS and V2Ray geosite.dat.
      url: pick(cmfa['geox-url'], ['mmdb', 'asn', 'geosite']),
    };
  }
  return profile;
}

module.exports = { buildNativeProfile };
