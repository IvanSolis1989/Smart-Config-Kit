'use strict';

const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { setTimeout: wait } = require('node:timers/promises');
const { normalizeHost } = require('./ordered-rule-semantics');

const VERSION = '1.0.0';
const LIMITS = Object.freeze({
  bytes: 8 * 1024 * 1024,
  totalBytes: 32 * 1024 * 1024,
  snapshots: 120,
  connections: 10000,
  totalObservations: 100000,
  chains: 32,
  text: 512,
  timeoutMs: 5000,
  durationMs: 60000,
});
const PROXY_TYPES = new Set([
  'ss', 'shadowsocks', 'ssr', 'shadowsocksr', 'vmess', 'vless', 'trojan', 'snell',
  'socks5', 'http', 'wireguard', 'hysteria', 'hysteria2', 'tuic', 'ssh', 'mieru', 'anytls',
  'sudoku', 'masque', 'trusttunnel', 'shadowquic', 'openvpn', 'tailscale', 'zerotier', 'easytier', 'gostrelay',
]);
// Source and process-path rules and logical predicates can contain private identifiers.
const PRIVATE_PAYLOAD = /^(?:src|in|uid$|process-?path|and$|or$|not$)/i;
const CREDENTIAL_TEXT = /(?:\bbearer +\S|\b[a-z][a-z0-9+.-]*:\/\/[^\s/?#]+@)/i;

function fail() {
  throw new Error('Invalid or excessive connection evidence.');
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value, maximum = LIMITS.text) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > maximum || /[\x00-\x1f\x7f]/.test(value)) fail();
  return value;
}

function disclosed(value, secret) {
  return !CREDENTIAL_TEXT.test(value) && !(secret && value.toLowerCase().includes(secret));
}

function host(value) {
  const original = text(value, 254);
  if (!original) return null;
  if (net.isIP(original)) return original.toLowerCase();
  const normalized = normalizeHost(original);
  if (!normalized || normalized.split('.').some(label => label.length > 63)) fail();
  return normalized;
}

function counter(value) {
  if (value === undefined) return null;
  if (!Number.isSafeInteger(value) || value < 0) fail();
  return value;
}

function normalize(connection, secret) {
  if (!object(connection) || !object(connection.metadata)) fail();
  const id = text(connection.id, 128);
  if (!id) fail();

  const metadata = connection.metadata;
  const originalHost = host(metadata.host);
  const sniffHost = host(metadata.sniffHost);
  // Mihomo's Metadata.RuleHost prefers a non-empty SniffHost.
  const ruleHost = sniffHost || originalHost;
  const ipText = text(metadata.destinationIP, 64);
  if (ipText && !net.isIP(ipText)) fail();
  const literal = net.isIP(ruleHost || '') ? ruleHost : null;
  const ip = ipText || literal;
  const safeHost = ruleHost && disclosed(ruleHost, secret);
  const probe = {};
  let destinationKind = 'unknown';
  if (safeHost && !literal) {
    probe.host = ruleHost;
    destinationKind = 'domain';
  } else if ((safeHost && literal) || (!ruleHost && metadata.host === '')) {
    probe.host = null;
    probe.hostAbsent = true;
    if (ip && disclosed(ip, secret)) destinationKind = 'ip-only';
  }
  if (ip && disclosed(ip, secret)) probe.ip = ip;

  const network = text(metadata.network, 8).toLowerCase();
  if (network && !['tcp', 'udp'].includes(network)) fail();
  if (network) probe.network = network;
  const port = metadata.destinationPort;
  if (port != null && port !== '') {
    if (!(typeof port === 'number' || typeof port === 'string' && /^\d{1,5}$/.test(port))) fail();
    const number = Number(port);
    if (!Number.isInteger(number) || number < 0 || number > 65535) fail();
    probe.destinationPort = number;
  }
  const process = text(metadata.process, 4096);
  if (process && disclosed(process, secret)) {
    const basename = text(path.win32.basename(path.posix.basename(process)), 256);
    if (basename && basename !== '..' && basename !== '.') probe.processName = basename;
  }

  const chain = connection.chains ?? [];
  if (!Array.isArray(chain) || chain.length > LIMITS.chains) fail();
  const rawChains = chain.map(value => text(value));
  const rawRule = text(connection.rule, 64);
  const rawPayload = text(connection.rulePayload, 4096);
  const rule = disclosed(rawRule, secret) ? rawRule : null;
  const rulePayload = rule !== null && !(rawPayload && (!rule || PRIVATE_PAYLOAD.test(rule))) && disclosed(rawPayload, secret) ? rawPayload : null;
  const chains = rawChains.map(value => disclosed(value, secret) ? value : null);
  const observedHosts = {
    host: originalHost && disclosed(originalHost, secret) ? originalHost : null,
    sniffHost: sniffHost && disclosed(sniffHost, secret) ? sniffHost : null,
  };
  const identity = JSON.stringify([
    ruleHost, originalHost, sniffHost, ip, network, probe.destinationPort, process,
    rawRule, rawPayload, rawChains, text(connection.start, 64),
  ]);
  return {
    id,
    identity,
    row: {
      probe,
      observedHosts,
      hostMismatch: Boolean(originalHost && sniffHost && originalHost !== sniffHost),
      ruleHostSource: safeHost ? (sniffHost ? 'sniffHost' : 'host') : null,
      destinationKind,
      rule,
      rulePayload,
      chains,
      upload: counter(connection.upload),
      download: counter(connection.download),
    },
  };
}

function proxyTypes(response) {
  if (response === undefined) return new Map();
  if (!object(response) || !object(response.proxies) || Object.keys(response.proxies).length > LIMITS.connections) fail();
  const types = new Map();
  for (const [name, value] of Object.entries(response.proxies)) {
    text(name);
    if (!object(value)) fail();
    types.set(name, text(value.type, 64).toLowerCase());
  }
  return types;
}

function outcome(leaf, types) {
  const type = types.get(leaf);
  if (leaf === 'DIRECT' || type === 'direct') return 'direct';
  if (leaf === 'REJECT' || leaf === 'REJECT-DROP' || ['reject', 'rejectdrop', 'reject-drop'].includes(type)) return 'reject';
  return PROXY_TYPES.has(type) ? 'proxy' : 'unknown';
}

function connectionList(snapshot) {
  if (!object(snapshot)) fail();
  // Mihomo's empty statistics slice serializes as null.
  if (snapshot.connections === null) return [];
  if (!Array.isArray(snapshot.connections) || snapshot.connections.length > LIMITS.connections) fail();
  return snapshot.connections;
}

function countSnapshot(snapshot, state) {
  const rows = connectionList(snapshot);
  state.snapshotCount++;
  state.observationCount += rows.length;
  if (state.snapshotCount > LIMITS.snapshots || state.observationCount > LIMITS.totalObservations) fail();
  return rows;
}

function createEvidence(secret = '') {
  const normalizedSecret = secret.toLowerCase();
  const totals = { snapshotCount: 0, observationCount: 0 };
  const sources = [];
  let uniqueConnections = 0;

  function addSource(proxies) {
    const types = proxyTypes(proxies);
    const entries = new Map();
    const counts = {
      source: sources.length + 1,
      snapshotCount: 0,
      emptySnapshotCount: 0,
      observationCount: 0,
      uniqueConnections: 0,
      hasProxyTypeSnapshot: proxies !== undefined,
    };
    sources.push({ counts, entries });

    return function appendSnapshot(snapshot) {
      const rows = countSnapshot(snapshot, totals);
      counts.snapshotCount++;
      counts.observationCount += rows.length;
      if (!rows.length) counts.emptySnapshotCount++;
      const seen = new Set();
      for (const raw of rows) {
        const { id, row, identity } = normalize(raw, normalizedSecret);
        if (seen.has(id)) throw new Error('Duplicate connection ID in one snapshot.');
        seen.add(id);
        const previous = entries.get(id);
        if (previous) {
          if (previous.identity !== identity) throw new Error('A connection ID has conflicting match evidence in one source.');
          previous.row.lastSnapshot = counts.snapshotCount;
          for (const key of ['upload', 'download']) {
            if (row[key] !== null) previous.row[key] = Math.max(previous.row[key] ?? 0, row[key]);
          }
          continue;
        }

        uniqueConnections++;
        if (uniqueConnections > LIMITS.connections) fail();
        counts.uniqueConnections++;
        const receipt = {
          source: counts.source,
          id: 's' + counts.source + '-c' + counts.uniqueConnections,
          ...row,
          firstSnapshot: counts.snapshotCount,
          lastSnapshot: counts.snapshotCount,
          outcome: outcome(row.chains[0], types),
          candidate: /^(match|final)$/i.test(row.rule || '') || row.chains.includes('🐟 漏网之鱼'),
        };
        entries.set(id, { identity, row: receipt });
      }
    };
  }

  function finish() {
    if (!sources.length || sources.some(source => source.counts.snapshotCount === 0)) fail();
    const connections = sources.flatMap(({ entries }) => [...entries.values()].map(({ row }) => row));
    return {
      report: {
        version: VERSION,
        ...totals,
        uniqueConnections,
        sources: sources.map(({ counts }) => counts),
        connections,
        limitations: [
          'Active snapshots can miss short connections. An empty snapshot only describes the sampled instant.',
          'A fallback observation alone cannot determine whether a rule needs to change.',
          'Counters are per-connection maxima. DNS state at decision time and connectivity are unknown.',
          'The report contains destinations, proxy names, and process basenames. Review before sharing.',
        ],
      },
      probes: connections.map(({ probe }) => probe),
    };
  }
  return { addSource, finish };
}

function createByteBudget(maximum = LIMITS.totalBytes) {
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > LIMITS.totalBytes) fail();
  let used = 0;
  return {
    consume(bytes) {
      if (!Number.isSafeInteger(bytes) || bytes < 0 || used + bytes > maximum) fail();
      used += bytes;
    },
  };
}

function validateController(value) {
  // Apply the syntax limit before URL parsing, which normalizes dotted integer and hex IPv4 forms.
  if (typeof value !== 'string' || !/^http:\/\/(?:127\.0\.0\.1|\[::1\]|localhost)(?::[0-9]{1,5})?\/?$/i.test(value)) {
    throw new Error('Controller must be an explicit loopback HTTP origin.');
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Controller must be an explicit loopback HTTP origin.');
  }
  if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
  return url.origin;
}

async function fetchJson(origin, endpoint, secret, budget, deadline) {
  const remaining = Math.floor(deadline - performance.now());
  if (remaining <= 0) throw new Error('Controller collection timed out.');
  const signal = AbortSignal.timeout(Math.min(remaining, LIMITS.timeoutMs));
  let response;
  try {
    response = await new Promise((resolve, reject) => {
      // A dedicated agent avoids inherited proxy behavior. GET never follows redirects.
      const headers = { Accept: 'application/json', 'Accept-Encoding': 'identity' };
      if (secret) headers.Authorization = 'Bearer ' + secret;
      http.get(origin + endpoint, { agent: false, headers, signal }, resolve).once('error', reject);
    });
    const encoding = response.headers['content-encoding'];
    if (response.statusCode !== 200 || (encoding && encoding !== 'identity') || Number(response.headers['content-length']) > LIMITS.bytes) fail();
    const chunks = [];
    let size = 0;
    for await (const chunk of response) {
      size += chunk.byteLength;
      if (size > LIMITS.bytes) fail();
      budget.consume(chunk.byteLength);
      chunks.push(chunk);
    }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, size)));
  } catch {
    throw new Error('Controller evidence request failed on ' + endpoint + '; details withheld.');
  } finally {
    if (response && !response.complete) response.destroy();
  }
}

async function collect({ controller, samples = 1, intervalMs = 1000, secret = '', byteLimit = LIMITS.totalBytes, durationMs = LIMITS.durationMs }) {
  const origin = validateController(controller);
  if (!Number.isInteger(durationMs) || durationMs < 1 || durationMs > LIMITS.durationMs ||
      !Number.isInteger(samples) || samples < 1 || samples > LIMITS.snapshots ||
      !Number.isInteger(intervalMs) || intervalMs < 1 || intervalMs > 10000 ||
      (samples - 1) * intervalMs >= durationMs) throw new Error('Invalid bounded sampling options.');

  const deadline = performance.now() + durationMs;
  const budget = createByteBudget(byteLimit);
  const evidence = createEvidence(secret);
  const append = evidence.addSource(await fetchJson(origin, '/proxies', secret, budget, deadline));
  for (let index = 0; index < samples; index++) {
    if (index) {
      if (performance.now() + intervalMs >= deadline) throw new Error('Controller collection timed out.');
      await wait(intervalMs);
    }
    append(await fetchJson(origin, '/connections', secret, budget, deadline));
  }
  return evidence.finish();
}

module.exports = { VERSION, LIMITS, createEvidence, collect, validateController, createByteBudget };
