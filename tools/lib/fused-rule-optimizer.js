'use strict';

const OPAQUE_MRS_SOURCES = [
  {
    pattern: /^https:\/\/(?:fastly\.|cdn\.)?jsdelivr\.net\/gh\/MiHomoer\/MiHomo-Hagezi@release\/HageziUltimate\.mrs$/i,
    sourceUrl: 'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/ultimate-onlydomains.txt',
    sourceFilter: 'domain',
    identity: 'hagezi-ultimate',
  },
  {
    pattern: /^https:\/\/(?:fastly\.|cdn\.)?jsdelivr\.net\/gh\/DustinWin\/ruleset_geodata@mihomo-ruleset\/ads\.mrs$/i,
    // Official README lists this Git file and anti-ad.net/clash.yaml as the same feed.
    // Git transport preserves commit-bound receipts and same-ref CDN fallback.
    sourceUrl: 'https://raw.githubusercontent.com/privacy-protection-tools/anti-AD/master/anti-ad-clash.yaml',
    sourceFilter: 'domain',
    identity: 'anti-ad',
  },
];

const DOMAIN_TYPES = new Set([
  'DOMAIN',
  'DOMAIN-SUFFIX',
  'DOMAIN-KEYWORD',
  'DOMAIN-WILDCARD',
]);
const IP_TYPES = new Set(['IP-CIDR', 'IP-CIDR6', 'SRC-IP-CIDR']);
const NO_RESOLVE_TYPES = new Set([...IP_TYPES, 'GEOIP', 'IP-ASN']);
const VALUE_TYPES = new Set([
  ...DOMAIN_TYPES,
  'DOMAIN-REGEX',
  ...IP_TYPES,
  'GEOIP',
  'IP-ASN',
  'GEOSITE',
  'PROCESS-NAME',
  'PROCESS-PATH',
  'PROCESS-PATH-REGEX',
  'SRC-PORT',
]);

function splitTopLevel(rule) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of String(rule)) {
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    current += char;
  }
  parts.push(current.trim());
  return parts;
}

function resolveOpaqueMrsSource(url) {
  const value = String(url || '').trim();
  const mapping = OPAQUE_MRS_SOURCES.find((candidate) => candidate.pattern.test(value));
  if (!mapping) return null;
  return {
    sourceUrl: mapping.sourceUrl,
    sourceFilter: mapping.sourceFilter,
    identity: mapping.identity,
  };
}

function parseIpv4(value) {
  const octets = String(value).split('.');
  if (octets.length !== 4) throw new Error(`invalid IPv4 address: ${value}`);
  let address = 0n;
  for (const octet of octets) {
    if (!/^\d+$/.test(octet)) throw new Error(`invalid IPv4 address: ${value}`);
    const number = Number(octet);
    if (number < 0 || number > 255) throw new Error(`invalid IPv4 address: ${value}`);
    address = (address << 8n) | BigInt(number);
  }
  return address;
}

function ipv4TailToHextets(value) {
  const address = parseIpv4(value);
  return [
    Number((address >> 16n) & 0xffffn).toString(16),
    Number(address & 0xffffn).toString(16),
  ];
}

function parseIpv6(value) {
  let source = String(value).toLowerCase();
  if ((source.match(/::/g) || []).length > 1) throw new Error(`invalid IPv6 address: ${value}`);
  const convertTail = (items) => {
    if (!items.length || !items[items.length - 1].includes('.')) return items;
    return [...items.slice(0, -1), ...ipv4TailToHextets(items[items.length - 1])];
  };
  const halves = source.split('::');
  let left = convertTail(halves[0] ? halves[0].split(':') : []);
  let right = convertTail(halves.length === 2 && halves[1] ? halves[1].split(':') : []);
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) {
    throw new Error(`invalid IPv6 address: ${value}`);
  }
  const groups = halves.length === 2 ? [...left, ...Array(missing).fill('0'), ...right] : left;
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) {
    throw new Error(`invalid IPv6 address: ${value}`);
  }
  let address = 0n;
  for (const group of groups) address = (address << 16n) | BigInt(`0x${group}`);
  return address;
}

function formatIpv4(address) {
  return [24n, 16n, 8n, 0n]
    .map((shift) => Number((address >> shift) & 0xffn))
    .join('.');
}

function formatIpv6(address) {
  const groups = [];
  for (let shift = 112n; shift >= 0n; shift -= 16n) {
    groups.push(Number((address >> shift) & 0xffffn).toString(16));
  }
  let bestStart = -1;
  let bestLength = 0;
  for (let start = 0; start < groups.length;) {
    if (groups[start] !== '0') {
      start += 1;
      continue;
    }
    let end = start;
    while (end < groups.length && groups[end] === '0') end += 1;
    if (end - start > bestLength && end - start >= 2) {
      bestStart = start;
      bestLength = end - start;
    }
    start = end;
  }
  if (bestStart === -1) return groups.join(':');
  const left = groups.slice(0, bestStart).join(':');
  const right = groups.slice(bestStart + bestLength).join(':');
  return `${left}::${right}`;
}

function parseCidr(value, expectedType) {
  const match = String(value || '').trim().match(/^(.+)\/(\d+)$/);
  if (!match) throw new Error(`invalid CIDR: ${value}`);
  const family = match[1].includes(':') ? 6 : 4;
  if (expectedType === 'IP-CIDR' && family !== 4) throw new Error(`IP-CIDR requires IPv4: ${value}`);
  if (expectedType === 'IP-CIDR6' && family !== 6) throw new Error(`IP-CIDR6 requires IPv6: ${value}`);
  const bits = family === 6 ? 128 : 32;
  const prefix = Number(match[2]);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > bits) throw new Error(`invalid CIDR prefix: ${value}`);
  const address = family === 6 ? parseIpv6(match[1]) : parseIpv4(match[1]);
  const hostBits = BigInt(bits - prefix);
  const all = (1n << BigInt(bits)) - 1n;
  const mask = prefix === 0 ? 0n : (all << hostBits) & all;
  const network = address & mask;
  const formatted = family === 6 ? formatIpv6(network) : formatIpv4(network);
  return { family, bits, prefix, network, value: `${formatted}/${prefix}` };
}

function normalizeDomain(value) {
  const normalized = String(value || '').trim().replace(/\.+$/, '').toLowerCase();
  if (!normalized) throw new Error('domain rule requires a value');
  return normalized;
}

function canonicalizeEntry(entry) {
  const text = String(entry || '').trim();
  if (!text) throw new Error('empty rule entry');
  if (!text.includes(',')) {
    if (/^[0-9a-f:.]+\/\d+$/i.test(text)) {
      const type = text.includes(':') ? 'IP-CIDR6' : 'IP-CIDR';
      return `${type},${parseCidr(text, type).value}`;
    }
    if (text.startsWith('+.')) return `DOMAIN-SUFFIX,${normalizeDomain(text.slice(2))}`;
    if (text.startsWith('*.')) return `DOMAIN-SUFFIX,${normalizeDomain(text.slice(2))}`;
    if (text.startsWith('.')) return `DOMAIN-SUFFIX,${normalizeDomain(text.slice(1))}`;
    if (text.includes('*')) return `DOMAIN-WILDCARD,${normalizeDomain(text)}`;
    if (/^[A-Za-z][A-Za-z0-9 -]*$/.test(text) && !text.includes('.')) {
      throw new Error(`${text.toUpperCase().replace(/\s+/g, '')} requires a value`);
    }
    return `DOMAIN,${normalizeDomain(text)}`;
  }

  const parts = splitTopLevel(text);
  const type = String(parts[0] || '').toUpperCase().replace(/\s+/g, '');
  if (!VALUE_TYPES.has(type)) throw new Error(`unsupported fused rule type: ${type || 'EMPTY'}`);
  if (!parts[1]) throw new Error(`${type} requires a value`);
  let value = parts[1].trim();
  if (DOMAIN_TYPES.has(type)) value = normalizeDomain(value);
  else if (type === 'IP-CIDR' || type === 'IP-CIDR6') value = parseCidr(value, type).value;
  else if (type === 'SRC-IP-CIDR') value = parseCidr(value).value;
  else if (type === 'GEOIP') value = value.toUpperCase();
  else if (type === 'IP-ASN') {
    value = value.toUpperCase().replace(/^AS/, '');
    if (!/^\d+$/.test(value)) throw new Error(`invalid IP-ASN value: ${parts[1]}`);
  }
  else if (type === 'GEOSITE') value = value.toLowerCase();
  const modifiers = NO_RESOLVE_TYPES.has(type) && parts.slice(2).some(
    (item) => String(item).trim().toLowerCase() === 'no-resolve',
  ) ? ['no-resolve'] : [];
  return [type, value, ...modifiers].join(',');
}

class KeywordMatcher {
  constructor(patterns) {
    this.nodes = [{ next: new Map(), fail: 0, match: false }];
    for (const pattern of patterns) this.add(pattern);
    this.buildFailures();
  }

  add(pattern) {
    let state = 0;
    for (const char of pattern) {
      let next = this.nodes[state].next.get(char);
      if (next === undefined) {
        next = this.nodes.length;
        this.nodes[state].next.set(char, next);
        this.nodes.push({ next: new Map(), fail: 0, match: false });
      }
      state = next;
    }
    this.nodes[state].match = true;
  }

  buildFailures() {
    const queue = [];
    for (const child of this.nodes[0].next.values()) queue.push(child);
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const state = queue[cursor];
      for (const [char, child] of this.nodes[state].next) {
        queue.push(child);
        let fallback = this.nodes[state].fail;
        while (fallback && !this.nodes[fallback].next.has(char)) fallback = this.nodes[fallback].fail;
        if (this.nodes[fallback].next.has(char)) fallback = this.nodes[fallback].next.get(char);
        this.nodes[child].fail = fallback;
        this.nodes[child].match ||= this.nodes[fallback].match;
      }
    }
  }

  matches(value) {
    let state = 0;
    for (const char of value) {
      while (state && !this.nodes[state].next.has(char)) state = this.nodes[state].fail;
      if (this.nodes[state].next.has(char)) state = this.nodes[state].next.get(char);
      if (this.nodes[state].match) return true;
    }
    return false;
  }
}

function suffixCovers(value, suffixes, strict) {
  let candidate = value;
  if (!strict && suffixes.has(candidate)) return true;
  while (candidate.includes('.')) {
    candidate = candidate.slice(candidate.indexOf('.') + 1);
    if (suffixes.has(candidate)) return true;
  }
  return false;
}

function cidrSubsumedIndexes(entries) {
  const covered = new Set();
  const byFamily = new Map([[4, new Map()], [6, new Map()]]);
  const rows = [];
  entries.forEach((entry, index) => {
    const parts = splitTopLevel(entry);
    if (parts[0] !== 'IP-CIDR' && parts[0] !== 'IP-CIDR6') return;
    const cidr = parseCidr(parts[1], parts[0]);
    const modifier = parts.slice(2).join(',');
    const familyMap = byFamily.get(cidr.family);
    const key = `${modifier}|${cidr.network}`;
    const prefixes = familyMap.get(cidr.prefix) || new Set();
    prefixes.add(key);
    familyMap.set(cidr.prefix, prefixes);
    rows.push({ ...cidr, modifier, index });
  });
  for (const row of rows) {
    const familyMap = byFamily.get(row.family);
    for (let prefix = 0; prefix < row.prefix; prefix += 1) {
      const prefixes = familyMap.get(prefix);
      if (!prefixes) continue;
      const hostBits = BigInt(row.bits - prefix);
      const all = (1n << BigInt(row.bits)) - 1n;
      const mask = prefix === 0 ? 0n : (all << hostBits) & all;
      if (prefixes.has(`${row.modifier}|${row.network & mask}`)) {
        covered.add(row.index);
        break;
      }
    }
  }
  return covered;
}

function optimizeEntries(entries) {
  const input = entries.length;
  let normalized = 0;
  let exactDuplicates = 0;
  const canonical = [];
  const seen = new Set();
  for (const raw of entries) {
    const entry = canonicalizeEntry(raw);
    if (entry !== String(raw).trim()) normalized += 1;
    if (seen.has(entry)) {
      exactDuplicates += 1;
      continue;
    }
    seen.add(entry);
    canonical.push(entry);
  }

  const suffixes = new Set();
  const keywords = [];
  for (const entry of canonical) {
    const parts = splitTopLevel(entry);
    if (parts[0] === 'DOMAIN-SUFFIX') suffixes.add(parts[1]);
    else if (parts[0] === 'DOMAIN-KEYWORD') keywords.push(parts[1]);
  }
  const keywordMatcher = keywords.length ? new KeywordMatcher(keywords) : null;
  const domainCovered = new Set();
  canonical.forEach((entry, index) => {
    const parts = splitTopLevel(entry);
    if (parts[0] !== 'DOMAIN' && parts[0] !== 'DOMAIN-SUFFIX') return;
    const strict = parts[0] === 'DOMAIN-SUFFIX';
    if (suffixCovers(parts[1], suffixes, strict) || (keywordMatcher && keywordMatcher.matches(parts[1]))) {
      domainCovered.add(index);
    }
  });
  const cidrCovered = cidrSubsumedIndexes(canonical);
  const output = canonical.filter((_, index) => !domainCovered.has(index) && !cidrCovered.has(index));
  return {
    entries: output,
    stats: {
      input,
      output: output.length,
      exactDuplicates,
      domainSubsumed: domainCovered.size,
      cidrSubsumed: cidrCovered.size,
      normalized,
    },
  };
}

async function materializeGeoIpEntries(entries, resolver, options = {}) {
  const output = [];
  for (const raw of entries) {
    const entry = canonicalizeEntry(raw);
    const parts = splitTopLevel(entry);
    if (parts[0] !== 'GEOIP') {
      output.push(entry);
      continue;
    }
    const name = parts[1].toLowerCase();
    if (options.preserve && options.preserve(name)) {
      output.push(entry);
      continue;
    }
    const nested = await resolver(name);
    const noResolve = parts.includes('no-resolve');
    for (const candidate of nested || []) {
      const value = String(candidate).includes(',')
        ? candidate
        : `${String(candidate).includes(':') ? 'IP-CIDR6' : 'IP-CIDR'},${candidate}`;
      const materialized = canonicalizeEntry(value);
      output.push(noResolve && !splitTopLevel(materialized).includes('no-resolve') ? `${materialized},no-resolve` : materialized);
    }
  }
  return output;
}

async function materializeIpAsnEntries(entries, resolver, options = {}) {
  const output = [];
  for (const raw of entries) {
    const entry = canonicalizeEntry(raw);
    const parts = splitTopLevel(entry);
    if (parts[0] !== 'IP-ASN') {
      output.push(entry);
      continue;
    }
    const preserve = typeof options.preserve === 'function'
      ? options.preserve(parts[1])
      : Boolean(options.preserve);
    if (preserve) {
      output.push(entry);
      continue;
    }
    const nested = await resolver(parts[1]);
    const noResolve = parts.includes('no-resolve');
    for (const candidate of nested || []) {
      const value = String(candidate).includes(',')
        ? candidate
        : `${String(candidate).includes(':') ? 'IP-CIDR6' : 'IP-CIDR'},${candidate}`;
      const materialized = canonicalizeEntry(value);
      output.push(noResolve && !splitTopLevel(materialized).includes('no-resolve') ? `${materialized},no-resolve` : materialized);
    }
  }
  return output;
}

module.exports = {
  canonicalizeEntry,
  materializeGeoIpEntries,
  materializeIpAsnEntries,
  optimizeEntries,
  parseCidr,
  resolveOpaqueMrsSource,
  splitTopLevel,
};
