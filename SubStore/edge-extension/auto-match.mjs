// Subscription matching v1.8.0. This module never performs IO or returns source URLs.
const CONTROLS = /[\u0000-\u001f\u007f-\u009f]/;
const FORMAT_KEYS = new Set(['format', 'target', 'type', 'client', 'flag']);
const FORMAT_VALUES = new Set(['clash', 'clashmeta', 'clash-meta', 'meta', 'mihomo', 'singbox', 'sing-box',
  'surge', 'surge2', 'surge3', 'surge4', 'surge5', 'loon', 'quantumult', 'quantumultx', 'quantumult-x', 'qx',
  'shadowrocket', 'ss', 'ssr', 'v2ray', 'v2rayn', 'vmess', 'trojan', 'hiddify', 'surfboard', 'base64', 'raw',
  'mixed', 'json', 'yaml', 'uri']);
const FORMAT_FLAGS = new Set(['clash', 'singbox', 'sing-box', 'surge', 'loon', 'qx', 'quantumult', 'quantumultx',
  'shadowrocket', 'hiddify', 'surfboard', 'ss', 'ssr', 'v2ray']);
const DASH = /[-\u2010-\u2015\u2212]+/u;
const ALL_DASHES = /[-\u2010-\u2015\u2212]+/gu;
const ACCOUNT_SUFFIX = /copy(?:[\s_-]*\d+)?|个人|工作|私人|账户|账号|\b(?:personal|work|private|account)(?:[\s_-]*\d+)?\b/iu;

function own(object, key) {
  if (!object || typeof object !== 'object') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  return descriptor && Object.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
}

function text(value, limit) {
  return typeof value === 'string' && value.length <= limit && !!value.trim() && !CONTROLS.test(value);
}

function formatParameter(key, value) {
  const lower = key.toLowerCase();
  return (FORMAT_KEYS.has(lower) && FORMAT_VALUES.has(value.toLowerCase())) ||
    (FORMAT_FLAGS.has(lower) && /^(?:0|1|2|3|4|5|true|false)$/i.test(value));
}

function sourceURL(value) {
  if (!text(value, 16384) || value !== value.trim() || /[\s|\\]/u.test(value)) return null;
  try {
    // URL would otherwise accept raw newlines and silently normalize some bad sources.
    if (CONTROLS.test(decodeURIComponent(value))) return null;
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    const parameters = new Map();
    for (const part of url.search.slice(1).split('&')) {
      if (!part) continue;
      const separator = part.indexOf('=');
      const key = decodeURIComponent(separator < 0 ? part : part.slice(0, separator));
      const val = decodeURIComponent(separator < 0 ? '' : part.slice(separator + 1));
      if (formatParameter(key, val)) continue;
      if (!parameters.has(key)) parameters.set(key, []);
      // Decode percent escapes, but keep literal '+' distinct from encoded space.
      // Preserve repeated account parameters and their order (first/last may win).
      parameters.get(key).push([val, separator >= 0]);
    }
    const query = [...parameters.keys()].sort().map(key => [key, parameters.get(key)]);
    return { origin: url.origin, pathname: url.pathname, identity: JSON.stringify([url.origin, url.pathname, query]) };
  } catch { return null; }
}

function normalizeName(value) {
  if (!text(value, 200)) return '';
  return value.normalize('NFKC').toLowerCase()
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u200d\ufe0e\ufe0f\u20e3]/gu, '')
    .replace(/dashboard|network|vpn|仪表盘|机场/giu, '')
    .replace(/\s+/gu, '').replace(ALL_DASHES, '');
}

function pageNameKeys(names) {
  const keys = new Set();
  if (!Array.isArray(names) || names.length > 64) return keys;
  for (const value of names) {
    if (!text(value, 200)) continue;
    const whole = normalizeName(value);
    if (whole) keys.add(whole);
    // A page title can have a slogan/UI segment. Account labels must remain whole.
    if (!ACCOUNT_SUFFIX.test(value.normalize('NFKC'))) {
      for (const segment of value.split(DASH)) {
        const key = normalizeName(segment);
        if (key) keys.add(key);
      }
    }
  }
  return keys;
}

export function exactBrandName(name, names) { return pageNameKeys(names).has(normalizeName(name)); }

function namedCandidates(records, keys) {
  if (!keys.size) return [];
  // name is the stable Sub-Store identifier. Copies may inherit displayName, so
  // do not let their copied display label defeat one exact identifier match.
  const byName = records.filter(record => keys.has(normalizeName(record.name)));
  return byName.length ? byName : records.filter(record => keys.has(normalizeName(record.displayName)));
}

function matched(record, method, nameCounts) {
  const count = nameCounts.get(record.name);
  return count > 1 ? { status: 'ambiguous', count } : { status: 'matched', subscriptionName: record.name, method };
}

function resolve(records, method, keys, nameCounts) {
  if (records.length === 1) return matched(records[0], method, nameCounts);
  const named = namedCandidates(records, keys);
  return named.length === 1 ? matched(named[0], method, nameCounts)
    : { status: 'ambiguous', count: named.length || records.length };
}

/**
 * Match existing single-source remote subscriptions using ordered evidence.
 * method: exact_url (fragment/explicit client format ignored), same_path
 * (same origin and pathname), same_origin_name (path changed, exact name),
 * or unique_name_new_origin (unique exact brand after all URL stages miss).
 * A stronger ambiguous stage never falls through to weaker evidence.
 */
export function chooseSubscription(input = {}) {
  const none = { status: 'none', count: 0 };
  try {
    const candidate = sourceURL(own(input, 'candidateUrl'));
    const catalog = own(input, 'catalog') ?? [];
    if (!candidate || !Array.isArray(catalog) || catalog.length > 10000) return none;
    const keys = pageNameKeys(own(input, 'siteNames') ?? []);
    const records = [];
    const nameCounts = new Map();
    for (const sub of catalog) {
      const name = own(sub, 'name');
      if (!text(name, 100) || name.includes('://')) continue;
      nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
      if (own(sub, 'source') !== 'remote') continue;
      if (['localFirst', 'remoteFirst'].includes(own(sub, 'mergeSources')) && String(own(sub, 'content') || '').trim()) continue;
      const url = sourceURL(own(sub, 'url'));
      if (url) records.push({ name, displayName: own(sub, 'displayName'), ...url });
    }
    const exact = records.filter(record => record.identity === candidate.identity);
    if (exact.length) return resolve(exact, 'exact_url', keys, nameCounts);
    const sameOrigin = records.filter(record => record.origin === candidate.origin);
    const samePath = sameOrigin.filter(record => record.pathname === candidate.pathname);
    if (samePath.length) return resolve(samePath, 'same_path', keys, nameCounts);
    const named = namedCandidates(sameOrigin, keys);
    if (named.length === 1) return matched(named[0], 'same_origin_name', nameCounts);
    if (named.length) return { status: 'ambiguous', count: named.length };
    // A provider can rotate its subscription CDN. A unique exact brand is the
    // final evidence level; callers still validate fresh nodes and unchanged
    // catalog source before authorizing an origin-changing URL-only PATCH.
    const acrossOrigins = namedCandidates(records, keys);
    if (acrossOrigins.length === 1) return matched(acrossOrigins[0], 'unique_name_new_origin', nameCounts);
    return acrossOrigins.length ? { status: 'ambiguous', count: acrossOrigins.length } : none;
  } catch { return none; }
}
