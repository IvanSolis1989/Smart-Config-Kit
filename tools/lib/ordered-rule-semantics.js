'use strict';

// Static evidence, not a simulation of DNS, process discovery, UDP support or a live core.
// Mihomo rule semantics: https://wiki.metacubex.one/config/rules/
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { splitTopLevel, canonicalizeEntry, parseCidr } = require('./fused-rule-optimizer');
const { toMihomoDomainPayload } = require('./mihomo-domain-payload');

// DOMAIN-PAYLOAD is an audit representation of behavior:domain wildcard syntax,
// not a new client rule type. Its '*' has different semantics from DOMAIN-WILDCARD.
const DOMAIN_TYPES = new Set(['DOMAIN', 'DOMAIN-SUFFIX', 'DOMAIN-KEYWORD', 'DOMAIN-WILDCARD', 'DOMAIN-REGEX', 'DOMAIN-PAYLOAD']);
const IP_TYPES = new Set(['IP-CIDR', 'IP-CIDR6', 'SRC-IP-CIDR']);
const FINAL_JS = 'Clash Party/ClashParty(mihomo-smart).js';
const MANIFEST = 'rulesets/generated/fused/manifest.json';
const digest = (text) => crypto.createHash('sha256').update(text).digest('hex');
const result = (status, reason) => ({ status, ...(reason ? { reason } : {}) });

function normalizeHost(value) {
  if (typeof value !== 'string') return null;
  const host = value.toLowerCase().replace(/\.$/, '');
  // One legal absolute-DNS tail dot only. Reject malformed probes instead of repairing them.
  return host && host.length <= 253 && host.split('.').every((label) => /^[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?$/.test(label)) ? host : null;
}

function wildcardMatches(pattern, host) {
  const expression = [...pattern].map((char) => char === '*' ? '.*' : char === '?' ? '.' : char.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')).join('');
  return new RegExp(`^${expression}$`, 'i').test(host);
}

function unwrap(value) {
  const text = String(value || '').trim();
  return text.startsWith('(') && text.endsWith(')') ? text.slice(1, -1) : text;
}

function isDomainOnly(entry) {
  const [type, value] = splitTopLevel(entry);
  if (DOMAIN_TYPES.has(type)) return true;
  return ['AND', 'OR', 'NOT'].includes(type) && value && splitTopLevel(unwrap(value)).every((child) => isDomainOnly(unwrap(child)));
}

function matchDomainPayload(pattern, host) {
  if (pattern.startsWith('.')) return result(host.endsWith(pattern) ? 'match' : 'no-match');
  const labels = pattern.split('.');
  if (labels.some((label) => label.includes('?') || label.includes('+') || (label.includes('*') && label !== '*'))) return result('unknown', 'unsupported behavior:domain wildcard shape');
  const hostLabels = host.split('.');
  return result(labels.length === hostLabels.length && labels.every((label, index) => label === '*' || label === hostLabels[index]) ? 'match' : 'no-match');
}

function matchUnsignedRanges(value, actual, maximum) {
  // common/utils/ranges.go + range.go: slash-separated uint ranges, inclusive
  // endpoints, at most 28 terms; NewRange normalizes reversed endpoints.
  const terms = value.trim().split('/');
  if (terms.length > 28) return result('unknown', 'too many unsigned ranges');
  const ranges = [];
  for (const term of terms) {
    if (!term) continue;
    const bounds = term.trim().split('-').map((bound) => bound.replace(/^[\[\] ]+|[\[\] ]+$/g, ''));
    if (bounds.length > 2 || bounds.some((bound) => !/^\d+$/.test(bound) || Number(bound) > maximum)) return result('unknown', 'unsupported unsigned range payload');
    const [first, last = first] = bounds.map(Number);
    ranges.push([Math.min(first, last), Math.max(first, last)]);
  }
  if (!ranges.length) return result('unknown', 'unsigned range payload missing');
  return result(ranges.some(([low, high]) => actual >= low && actual <= high) ? 'match' : 'no-match');
}

function matchEntry(entry, probe = {}, { mode = 'full', predicate = false, forceNoResolve = false } = {}) {
  const parts = splitTopLevel(entry);
  const type = parts[0].toUpperCase();
  const value = parts[1];
  if (predicate && parts.slice(2).some((modifier) => !['no-resolve', 'src'].includes(modifier))) return result('unknown', 'unsupported predicate modifier');
  if (mode === 'domain-projection' && !isDomainOnly(entry)) return result('no-match', 'excluded predicate outside pure-domain projection');
  if (['AND', 'OR', 'NOT'].includes(type)) {
    if (!value || !value.startsWith('(') || !value.endsWith(')')) return result('unknown', 'malformed logical payload');
    const children = splitTopLevel(unwrap(value)).map(unwrap);
    if (!children.length || (type === 'NOT' && children.length !== 1)) return result('unknown', 'invalid logical arity');
    const states = children.map((child) => matchEntry(child, probe, { mode, predicate: true, forceNoResolve }));
    if (type === 'NOT') return states[0].status === 'unknown' ? states[0] : result(states[0].status === 'match' ? 'no-match' : 'match');
    if (type === 'AND' && states.some((state) => state.status === 'no-match')) return result('no-match');
    if (type === 'OR' && states.some((state) => state.status === 'match')) return result('match');
    if (states.some((state) => state.status === 'unknown')) return result('unknown', states.filter((state) => state.status === 'unknown').map((state) => state.reason).join('; '));
    return result(type === 'AND' ? 'match' : 'no-match');
  }
  if (DOMAIN_TYPES.has(type)) {
    if (probe.hostAbsent === true && probe.host === null) return result('no-match', 'explicit IP-literal connection without a domain');
    const host = normalizeHost(probe.host);
    if (!host) return result('unknown', 'host missing or malformed');
    if (!value) return result('unknown', `${type} payload missing`);
    if (type === 'DOMAIN-REGEX') return result('unknown', 'DOMAIN-REGEX requires the core RE2 engine; JS RegExp is not substituted');
    if (value.endsWith('..')) return result('unknown', 'malformed domain payload');
    const candidate = value.toLowerCase().replace(/\.$/, '');
    if (type === 'DOMAIN-PAYLOAD') return matchDomainPayload(candidate, host);
    const matches = type === 'DOMAIN' ? host === candidate
      : type === 'DOMAIN-SUFFIX' ? host === candidate || host.endsWith(`.${candidate}`)
        : type === 'DOMAIN-KEYWORD' ? host.includes(candidate) : wildcardMatches(candidate, host);
    return result(matches ? 'match' : 'no-match');
  }
  if (mode === 'domain-projection') return result('no-match', 'excluded non-domain predicate in domain projection');
  if (IP_TYPES.has(type)) {
    let cidr;
    try { cidr = parseCidr(value); } catch (error) { return result('unknown', error.message); }
    const source = type === 'SRC-IP-CIDR' || parts.includes('src');
    const address = source ? probe.sourceIp : probe.ip;
    if (address === undefined || address === null) {
      if (!source && (forceNoResolve || parts.includes('no-resolve')) && probe.resolution === 'unresolved') return result('no-match', 'no-resolve does not initiate DNS');
      if (!source && probe.resolution === 'failed') return result('no-match', 'explicit DNS failure');
      return result('unknown', source ? 'source IP missing' : 'destination IP or DNS resolution outcome missing');
    }
    if (typeof address !== 'string') return result('unknown', 'IP connection field must be a string address');
    try {
      const ip = parseCidr(`${address}/${String(address).includes(':') ? 128 : 32}`);
      if (ip.family !== cidr.family) return result('no-match');
      const end = cidr.network + (1n << BigInt(cidr.bits - cidr.prefix)) - 1n;
      return result(ip.network >= cidr.network && ip.network <= end ? 'match' : 'no-match');
    } catch (error) { return result('unknown', error.message); }
  }
  if (type === 'MATCH' || type === 'FINAL') return result('match');
  const fields = { 'PROCESS-NAME': 'processName', 'PROCESS-PATH': 'processPath', NETWORK: 'network', 'DST-PORT': 'destinationPort', 'SRC-PORT': 'sourcePort', 'IN-PORT': 'inboundPort', 'IN-NAME': 'inboundName', UID: 'uid' };
  const field = fields[type];
  if (field) {
    const actual = probe[field];
    if (actual === undefined || actual === null) return result('unknown', `${field} missing`);
    if (!value) return result('unknown', `${type} payload missing`);
    if (type.endsWith('PORT') || type === 'UID') {
      const maximum = type === 'UID' ? 4294967295 : 65535;
      if (typeof actual !== 'number' || !Number.isInteger(actual) || actual < 0 || actual > maximum) return result('unknown', `${field} must be a valid unsigned integer connection field`);
      // uid.go treats zero as failure to discover the process UID. It does not
      // establish an absent process, nor a trustworthy root UID for this audit.
      if (type === 'UID' && actual === 0) return result('unknown', 'process UID unavailable (zero sentinel)');
      return matchUnsignedRanges(value, actual, maximum);
    }
    if (typeof actual !== 'string' || !actual || actual.includes('\0')) return result('unknown', `${field} must be a nonempty string connection field`);
    if (type === 'IN-NAME') {
      // rules/common/in_name.go: trim each slash-delimited payload name, then
      // compare metadata.InName == name (case-sensitive; no metadata trimming).
      const names = value.split('/').map((name) => name.trim());
      if (names.some((name) => !name)) return result('unknown', 'empty inbound name in payload');
      return result(names.includes(actual) ? 'match' : 'no-match');
    }
    if (type === 'NETWORK' && (!/^(tcp|udp)$/i.test(actual) || !/^(tcp|udp)$/i.test(value))) return result('unknown', 'unsupported network field or payload');
    // process.go uses strings.EqualFold. ASCII folding is exact here; broader
    // Unicode case folding requires Go semantics rather than JS lowercasing.
    if (actual === value) return result('match');
    if (/[^\x00-\x7f]/.test(actual + value)) return result('unknown', 'non-ASCII process case folding requires core semantics');
    return result(actual.toLowerCase() === value.toLowerCase() ? 'match' : 'no-match');
  }
  return result('unknown', `unsupported predicate ${type}`);
}

function parseFusedRules(text) {
  const match = text.match(/const\s+MIHOMO_FUSED_RULES\s*=\s*(\[[^\r\n]*\])/);
  if (!match) throw new Error(`${FINAL_JS}: MIHOMO_FUSED_RULES missing`);
  return JSON.parse(match[1]);
}

function repositoryReader(root, ref) {
  const absolute = path.resolve(root);
  const revision = ref ? execFileSync('git', ['-C', absolute, 'rev-parse', '--verify', `${ref}^{commit}`], { encoding: 'utf8' }).trim() : null;
  return {
    root: absolute, ref: revision,
    read(relative) {
      const normalized = relative.replace(/\\/g, '/');
      if (path.isAbsolute(relative) || normalized.split('/').includes('..')) throw new Error(`unsafe repository asset path: ${relative}`);
      return revision ? execFileSync('git', ['-C', absolute, 'show', `${revision}:${normalized}`], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 }) : fs.readFileSync(path.join(absolute, relative), 'utf8');
    },
  };
}

function parsePayload(text) {
  // Generated YAML uses JSON-quoted strings. Anything outside this small format fails closed.
  const entries = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed === 'payload:') continue;
    const match = trimmed.match(/^- (.+)$/);
    if (!match) throw new Error(`unsupported generated payload line: ${trimmed}`);
    const raw = match[1];
    entries.push(raw.startsWith('"') ? JSON.parse(raw) : raw.startsWith("'") ? raw.slice(1, -1).replace(/''/g, "'") : raw);
  }
  return entries;
}

function domainPayloadEntry(payload) {
  // Do not use canonicalizeEntry('*.x'): classical canonicalization treats that as suffix.
  if (payload.startsWith('+.')) return `DOMAIN-SUFFIX,${payload.slice(2)}`;
  if (payload.startsWith('.') || payload.includes('*') || payload.includes('?') || payload.includes('+')) return `DOMAIN-PAYLOAD,${payload}`;
  return `DOMAIN,${payload}`;
}

function createProvider(entries, metadata = {}) {
  const exact = new Map();
  const suffix = new Map();
  const other = [];
  const cidrs = new Map();
  const normalized = entries.map((entry, index) => {
    let canonical;
    try { canonical = canonicalizeEntry(entry); } catch { canonical = String(entry).trim(); }
    // The optimizer supports only its compiler modifiers. The audit preserves
    // every source modifier, including unsupported ones, rather than deleting uncertainty.
    const rawModifiers = splitTopLevel(entry).slice(2);
    for (const modifier of rawModifiers) if (!splitTopLevel(canonical).slice(2).includes(modifier)) canonical += `,${modifier}`;
    const parts = splitTopLevel(canonical);
    if (parts[0] === 'DOMAIN') { if (!exact.has(parts[1])) exact.set(parts[1], index); }
    else if (parts[0] === 'DOMAIN-SUFFIX') { if (!suffix.has(parts[1])) suffix.set(parts[1], index); }
    else if (IP_TYPES.has(parts[0])) {
      try {
        const cidr = parseCidr(parts[1]);
        const key = `${cidr.family}/${cidr.prefix}`;
        if (!cidrs.has(key)) cidrs.set(key, new Map());
        if (!cidrs.get(key).has(cidr.network)) cidrs.get(key).set(cidr.network, index);
      } catch { other.push(index); }
    } else other.push(index);
    return canonical;
  });
  return { ...metadata, entries: normalized, exact, suffix, cidrs, other, semanticDigest: digest(normalized.join('\n')) };
}

function loadRepository({ root = path.resolve(__dirname, '../..'), ref, chronology = 'final' } = {}) {
  const reader = repositoryReader(root, ref);
  const manifest = JSON.parse(reader.read(MANIFEST));
  // Segment order alone cannot locate inline rules. Require a complete explicit chronology.
  const rules = chronology === 'manifest' ? manifest.ordered_rules : parseFusedRules(reader.read(FINAL_JS));
  if (!Array.isArray(rules)) throw new Error('manifest.ordered_rules unavailable: segment order plus inline_rules is not a complete chronology; use final rules');
  const providers = new Map();
  for (const segment of manifest.segments) {
    for (const [key, suffix] of [['domain', 'domain'], ['ipcidr', 'ipcidr'], ['ipcidr_no_resolve', 'ipcidr-no-resolve'], ['residual', 'residual']]) {
      const file = segment.files?.[key];
      if (!file) continue;
      const assets = file.parts || [file];
      for (let part = 0; part < assets.length; part += 1) {
        const asset = typeof assets[part] === 'string' ? { source: assets[part] } : assets[part];
        const source = asset.source || asset.file;
        if (!source || !source.endsWith('.yaml')) throw new Error(`${segment.id}/${key}: readable generated YAML source missing`);
        const relative = `rulesets/generated/fused/mihomo/${source}`;
        const raw = parsePayload(reader.read(relative));
        const entries = raw.map((entry) => key === 'domain' ? domainPayloadEntry(entry) : key.startsWith('ipcidr') ? `${entry.includes(':') ? 'IP-CIDR6' : 'IP-CIDR'},${entry}${key === 'ipcidr_no_resolve' ? ',no-resolve' : ''}` : entry);
        const provider = assets.length > 1 ? `${segment.id}-${suffix}-part-${String(part + 1).padStart(3, '0')}` : `${segment.id}-${suffix}`;
        providers.set(provider, createProvider(entries, { provider, segment: segment.id, policy: segment.policy, path: relative, source: manifest.authority, kind: key }));
      }
    }
  }
  const ordered = rules.map((rule, index) => {
    const parts = splitTopLevel(rule);
    return { rule, index, provider: parts[0] === 'RULE-SET' ? parts[1] : null, policy: parts[0] === 'MATCH' || parts[0] === 'FINAL' ? parts[1] : parts[2], path: chronology === 'manifest' ? MANIFEST : FINAL_JS, source: manifest.authority };
  });
  const signature = ordered.map((row) => [row.rule, providers.get(row.provider)?.kind || '', providers.get(row.provider)?.semanticDigest || (row.provider ? 'MISSING' : '')]);
  return { root: reader.root, ref: reader.ref, manifest, rules: ordered, providers, identity: digest(JSON.stringify(signature)), chronology };
}

function evidence(row, provider, index) {
  return { source: provider?.source || row.source, path: provider?.path || row.path, entry: provider ? provider.entries[index] : row.rule, entryIndex: provider ? index : null, index: row.index, policy: row.policy, ...(row.provider ? { provider: row.provider } : {}) };
}

function providerMatch(provider, probe, options) {
  options = { ...options, predicate: true };
  if (provider.kind === 'domain' && normalizeHost(probe.host)) {
    const host = normalizeHost(probe.host);
    const candidates = [];
    if (provider.exact.has(host)) candidates.push(provider.exact.get(host));
    const labels = host.split('.');
    for (let index = 0; index < labels.length; index += 1) {
      const key = labels.slice(index).join('.');
      if (provider.suffix.has(key)) candidates.push(provider.suffix.get(key));
    }
    // Indexed exact/suffix entries are decidable; evaluate only wildcard/keyword/regex residuals.
    candidates.push(...provider.other);
    candidates.sort((a, b) => a - b);
    let unknown;
    for (const index of candidates) {
      const state = matchEntry(provider.entries[index], probe, options);
      if (state.status === 'match') return { ...state, entryIndex: index };
      if (state.status === 'unknown') unknown ||= { ...state, entryIndex: index };
    }
    return unknown || result('no-match');
  }
  if (provider.kind?.startsWith('ipcidr') && provider.entries.length) {
    if (options.mode === 'domain-projection') return result('no-match');
    if (probe.ip === undefined || probe.ip === null) return { ...matchEntry(provider.entries[0], probe, options), entryIndex: 0 };
    if (typeof probe.ip !== 'string') return result('unknown', 'IP connection field must be a string address');
    try {
      const ip = parseCidr(`${probe.ip}/${String(probe.ip).includes(':') ? 128 : 32}`);
      const candidates = [];
      for (const [key, networks] of provider.cidrs) {
        const [family, prefix] = key.split('/').map(Number);
        if (family !== ip.family) continue;
        const shift = BigInt(ip.bits - prefix);
        const index = networks.get((ip.network >> shift) << shift);
        if (index !== undefined) candidates.push(index);
      }
      candidates.push(...provider.other);
      candidates.sort((a, b) => a - b);
      let unknown;
      for (const index of candidates) {
        const state = matchEntry(provider.entries[index], probe, options);
        if (state.status === 'match') return { ...state, entryIndex: index };
        if (state.status === 'unknown') unknown ||= { ...state, entryIndex: index };
      }
      return unknown || result('no-match');
    } catch (error) { return result('unknown', error.message); }
  }
  let unknown;
  for (let index = 0; index < provider.entries.length; index += 1) {
    const state = matchEntry(provider.entries[index], probe, options);
    if (state.status === 'match') return { ...state, entryIndex: index };
    if (state.status === 'unknown') unknown ||= { ...state, entryIndex: index };
  }
  return unknown || result('no-match');
}

function firstMatch(model, probe, { mode = 'full', collectOverlaps = false, providerDomainsOnly = false, maxEvidence = 30 } = {}) {
  if (!['full', 'domain-projection'].includes(mode)) throw new Error(`invalid matching mode: ${mode}`);
  const unknownBlockers = [];
  const overlaps = [];
  let firstDecidableMatch = null;
  let blockerCount = 0;
  let overlapCount = 0;
  for (const row of model.rules) {
    const provider = row.provider ? model.providers.get(row.provider) : null;
    if (mode === 'domain-projection' && row.provider && provider && !['domain', 'residual'].includes(provider.kind)) continue;
    if (providerDomainsOnly && (!row.provider || provider?.kind !== 'domain')) continue;
    const modifiers = row.provider ? splitTopLevel(row.rule).slice(3) : [];
    const state = row.provider ? modifiers.some((modifier) => modifier !== 'no-resolve') ? result('unknown', 'unsupported RULE-SET modifier') : provider ? providerMatch(provider, probe, { mode, forceNoResolve: modifiers.includes('no-resolve') }) : result('unknown', 'referenced provider source missing') : matchEntry(row.rule, probe, { mode });
    const location = evidence(row, provider, state.entryIndex);
    if (state.status === 'unknown' && !firstDecidableMatch) {
      blockerCount += 1;
      if (unknownBlockers.length < maxEvidence) unknownBlockers.push({ ...location, reason: state.reason });
    }
    if (state.status === 'match') {
      if (!firstDecidableMatch) firstDecidableMatch = location;
      else { overlapCount += 1; if (overlaps.length < maxEvidence) overlaps.push(location); }
      if (!collectOverlaps) break;
    }
  }
  return { mode, status: blockerCount ? 'unknown' : firstDecidableMatch ? 'match' : 'no-match', policy: blockerCount ? null : firstDecidableMatch?.policy || null, hit: blockerCount ? null : firstDecidableMatch, firstDecidableMatch, unknownBlockers, unknownBlockerCount: blockerCount, overlaps, overlapCount, evidenceTruncated: blockerCount > maxEvidence || overlapCount > maxEvidence };
}

function firstDomainRoute(model, host) {
  const route = firstMatch(model, { host }, { mode: 'domain-projection', providerDomainsOnly: true });
  if (route.status === 'unknown') throw new Error(`uncertain domain-provider projection for ${host}: ${JSON.stringify(route.unknownBlockers)}`);
  return route.hit ? { provider: route.hit.provider, policy: route.policy } : null;
}

function formatAddress(address, family) {
  if (family === 4) return [24n, 16n, 8n, 0n].map((shift) => Number((address >> shift) & 255n)).join('.');
  return Array.from({ length: 8 }, (_, index) => ((address >> BigInt((7 - index) * 16)) & 65535n).toString(16)).join(':');
}

function entryWitnesses(entry) {
  const [type, value] = splitTopLevel(entry);
  if (type === 'DOMAIN' || type === 'DOMAIN-SUFFIX') return [{ host: value }, { host: `witness.${value}` }, { host: `boundary-${value}` }, { host: `${value}.outside.invalid` }];
  if (type === 'DOMAIN-KEYWORD') return [{ host: value.includes('.') ? value : `${value}.invalid` }, { host: `boundary-${value}.invalid` }];
  if (type === 'DOMAIN-WILDCARD' || type === 'DOMAIN-PAYLOAD') return [{ host: `${value.startsWith('.') ? 'witness' : ''}${value.replace(/\*/g, 'witness').replace(/\?/g, 'x')}` }];
  if (IP_TYPES.has(type)) {
    try {
      const cidr = parseCidr(value);
      const end = cidr.network + (1n << BigInt(cidr.bits - cidr.prefix)) - 1n;
      const addresses = [cidr.network, end];
      if (cidr.network > 0n) addresses.push(cidr.network - 1n);
      if (end < (1n << BigInt(cidr.bits)) - 1n) addresses.push(end + 1n);
      return addresses.map((address) => ({ host: null, hostAbsent: true, [type === 'SRC-IP-CIDR' ? 'sourceIp' : 'ip']: formatAddress(address, cidr.family), resolution: 'resolved' }));
    } catch { return []; }
  }
  if (['AND', 'OR', 'NOT'].includes(type)) return splitTopLevel(unwrap(value)).flatMap((child) => entryWitnesses(unwrap(child)));
  return [];
}

function compareRepositories(before, after, { mode = 'domain-projection', maxProbes = 1000, probes = [], maxEvidence = 1000 } = {}) {
  if (!Number.isInteger(maxProbes) || maxProbes < 1 || !Number.isInteger(maxEvidence) || maxEvidence < 1) throw new Error('positive integer probe/evidence budgets required');
  const changedProviders = [];
  const entryChanges = [];
  const typeChanges = {};
  let entryChangeCount = 0;
  const witnesses = new Map();
  let droppedProbes = 0;
  const addProbe = (probe) => {
    if (typeof probe === 'string') probe = { host: probe };
    const key = JSON.stringify(probe);
    if (witnesses.has(key)) return;
    if (witnesses.size >= maxProbes) { droppedProbes += 1; return; }
    witnesses.set(key, probe);
  };
  // Explicit business probes have priority over automatically generated witnesses.
  probes.forEach(addProbe);
  for (const id of new Set([...before.providers.keys(), ...after.providers.keys()])) {
    const left = before.providers.get(id);
    const right = after.providers.get(id);
    if (left?.semanticDigest === right?.semanticDigest && left?.kind === right?.kind) continue;
    changedProviders.push({ provider: id, before: left?.semanticDigest || null, after: right?.semanticDigest || null, beforeKind: left?.kind || null, afterKind: right?.kind || null });
    const leftSet = new Set(left?.entries || []);
    const rightSet = new Set(right?.entries || []);
    for (const [change, provider, other] of [['removed', left, rightSet], ['added', right, leftSet]]) {
      if (!provider) continue;
      const row = (change === 'added' ? after : before).rules.find((candidate) => candidate.provider === id) || { index: null, policy: provider.policy, provider: id };
      for (let index = 0; index < provider.entries.length; index += 1) {
        const entry = provider.entries[index];
        if (other.has(entry)) continue;
        entryChangeCount += 1;
        const type = splitTopLevel(entry)[0];
        typeChanges[type] ||= { added: 0, removed: 0 };
        typeChanges[type][change] += 1;
        if (entryChanges.length < maxEvidence) entryChanges.push({ change, ...evidence(row, provider, index), domainPayload: toMihomoDomainPayload(entry) });
        entryWitnesses(entry).forEach(addProbe);
      }
    }
  }
  const ruleOrderChanged = JSON.stringify(before.rules.map((row) => row.rule)) !== JSON.stringify(after.rules.map((row) => row.rule));
  if (ruleOrderChanged) {
    for (const model of [before, after]) for (const row of model.rules) {
      if (row.provider) {
        // Bounded representatives when only priority changes. Explicit probes remain essential.
        const provider = model.providers.get(row.provider);
        (provider?.entries || []).slice(0, 4).flatMap(entryWitnesses).forEach(addProbe);
      } else entryWitnesses(row.rule).forEach(addProbe);
    }
  }
  const routes = [];
  const routeChanges = [];
  const shadows = [];
  const crossPolicyOverlaps = [];
  const undecidable = [];
  for (const probe of witnesses.values()) {
    const left = firstMatch(before, probe, { mode, collectOverlaps: true });
    const right = firstMatch(after, probe, { mode, collectOverlaps: true });
    const row = { probe, before: left, after: right };
    routes.push(row);
    if (left.status !== right.status || left.policy !== right.policy) routeChanges.push(row);
    if (left.status === 'unknown' || right.status === 'unknown') undecidable.push(row);
    for (const [side, route] of [['before', left], ['after', right]]) {
      for (const overlap of route.overlaps) {
        // MATCH is a fallback, not a domain/CIDR coverage claim.
        if (/^(MATCH|FINAL),/.test(overlap.entry)) continue;
        const relation = { side, probe, earlier: route.firstDecidableMatch, later: overlap, scope: 'witness-only' };
        if (shadows.length < maxEvidence) shadows.push(relation);
        if (overlap.policy !== route.firstDecidableMatch.policy && crossPolicyOverlaps.length < maxEvidence) crossPolicyOverlaps.push(relation);
      }
    }
  }
  const hasChanges = before.identity !== after.identity;
  const report = { schemaVersion: 1, mode, before: { root: before.root, ref: before.ref, identity: before.identity }, after: { root: after.root, ref: after.ref, identity: after.identity }, limits: ['Finite witnesses do not prove all-domain/all-IP equivalence.', 'Domain projection includes pure domain predicates only; it is not complete first-match routing.', 'Full mode requires actual connection fields and DNS outcomes; unknowns are retained.', 'Core UDP support, sub-rules, external databases and RE2 regular expressions are not simulated.', 'DOMAIN-PAYLOAD is audit notation for behavior:domain wildcards, distinct from classical DOMAIN-WILDCARD.'], summary: { hasChanges, changedProviders: changedProviders.length, ruleOrderChanged, entryChangeCount, routeChangeCount: routeChanges.length, undecidableCount: undecidable.length }, budget: { maxProbes, evaluated: routes.length, droppedProbes, truncated: droppedProbes > 0, maxEvidence, entryEvidenceTruncated: entryChangeCount > entryChanges.length }, changedProviders, entryChanges, conversionTypes: typeChanges, ruleOrder: ruleOrderChanged ? { before: before.rules, after: after.rules } : null, routes, routeChanges, undecidable, coverage: { scope: 'finite-witness-only', shadows, crossPolicyOverlaps } };
  report.reviewedChangeDigest = digest(JSON.stringify({ changedProviders, ruleOrder: report.ruleOrder, entryChanges }));
  report.reviewedEvidenceDigest = digest(JSON.stringify({ mode, budget: report.budget, routes }));
  report.undecidableDigest = digest(JSON.stringify(undecidable));
  return report;
}

function checkReport(report, expected) {
  if (!report.summary.hasChanges) return { ok: true, approved: false, reason: 'ordered structure and provider payloads unchanged; finite probes are supplementary evidence' };
  if (!expected) return { ok: false, approved: false, reason: 'semantic input changes require an identity-bound review approval' };
  if (expected.beforeIdentity !== report.before.identity || expected.afterIdentity !== report.after.identity) return { ok: false, approved: false, reason: 'approval identities do not match this baseline/current pair' };
  if (expected.reviewedChangeDigest !== report.reviewedChangeDigest) return { ok: false, approved: false, reason: 'approval does not bind the reviewed change list' };
  const limited = report.undecidable.length || report.budget.truncated || report.budget.entryEvidenceTruncated;
  if (limited && expected.reviewedEvidenceDigest !== report.reviewedEvidenceDigest) return { ok: false, approved: false, reason: 'unknown or truncated evidence requires explicit review of this evidence digest' };
  if (report.undecidable.length && expected.acknowledgedUndecidableDigest !== report.undecidableDigest) return { ok: false, approved: false, reason: 'unknown outcomes require an explicit identity-bound acknowledgement digest' };
  if ((report.budget.truncated || report.budget.entryEvidenceTruncated) && expected.acknowledgeTruncation !== true) return { ok: false, approved: false, reason: 'truncated evidence requires explicit acknowledgement; no universal equivalence is established' };
  return { ok: true, approved: true, reason: 'explicit approval binds identities and recorded changes; acknowledged unknown/truncation limits remain and finite probes do not prove universal equivalence' };
}

module.exports = { DOMAIN_TYPES, normalizeHost, wildcardMatches, matchEntry, parseFusedRules, parsePayload, createProvider, loadRepository, firstMatch, firstDomainRoute, entryWitnesses, compareRepositories, checkReport, digest };
