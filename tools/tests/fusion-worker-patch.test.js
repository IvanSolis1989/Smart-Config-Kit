#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');

const patcher = import('../../SubStore/scripts/patch-fusion-worker.mjs');
const guard = import('../../SubStore/scripts/fusion-publication-guard.mjs');
const guardImport = 'import { validateFusionPublication, validateFusionContract } from "./scki-fusion-publication-guard.mjs";';
const cacheKey = 'static:fusion:clashmeta';
const contractKey = 'static:fusion:contract:v1';
const recoveryContractKey = 'static:fusion:recovery-contract:v1';
const contract = { schemaVersion: 1, minimumNodes: 100, requiredNamePrefixes: ['SOURCE-A-', 'SOURCE-B-'] };

// Minimal deployed-handler fixture. All source/account identifiers are examples.
const fixture = String.raw`const SCKI_FUSION_GIST = "https://example.invalid/Fusion";
const SCKI_FUSION_CACHE_KEY = "static:fusion:clashmeta";
const SCKI_SYNC_KEY = "example:sync";
const cors = { "Access-Control-Allow-Origin": "*" };
function json(body, status) { return new Response(JSON.stringify(body), { status }); }
function sckiValidFusion(content) {
  if (typeof content !== "string" || content.length < 256 || content.length > 5 * 1024 * 1024 || !/^\uFEFF?proxies:\s*\n/.test(content) || /<!doctype|<html/i.test(content)) return false;
  try {
    const parsed = sckiYaml.parse(content, { schema: "core", uniqueKeys: true, maxAliasCount: 20 });
    if (!Array.isArray(parsed?.proxies) || !parsed.proxies.length || parsed.proxies.length > 5000) return false;
    const names = new Set();
    for (const proxy of parsed.proxies) {
      if (!proxy || typeof proxy.name !== "string" || !proxy.name.trim() || names.has(proxy.name) || typeof proxy.type !== "string" || !proxy.type || typeof proxy.server !== "string" || !proxy.server.trim() || !Number.isInteger(proxy.port) || proxy.port < 1 || proxy.port > 65535) return false;
      names.add(proxy.name);
    }
    return true;
  } catch { return false; }
}

async function sckiPublishedFusion(request, env2, receipt) {
  let content;
  let source = "gist";
  try {
    const response = await fetch(SCKI_FUSION_GIST, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error("Fusion publication unavailable");
    content = await response.text();
    if (!sckiValidFusion(content)) throw new Error("Fusion publication invalid");
  } catch {
    try { content = await env2.SUB_STORE_DATA.get(SCKI_FUSION_CACHE_KEY); } catch { content = null; }
    if (!sckiValidFusion(content)) return json({ status: "failed", message: "Fusion publication and saved replica unavailable" }, 503);
    source = "saved-replica";
  }
  if (source === "gist") {
    try {
      const cached = await env2.SUB_STORE_DATA.get(SCKI_FUSION_CACHE_KEY);
      if (cached !== content) await env2.SUB_STORE_DATA.put(SCKI_FUSION_CACHE_KEY, content);
    } catch { console.warn("Fusion saved replica update unavailable"); }
  }
  const headers = new Headers({ ...cors, "Content-Type": "text/yaml; charset=utf-8", "Cache-Control": "no-store", "profile-update-interval": "6", "X-SCKI-Source": source });
  if (receipt?.revision) {
    headers.set("X-SCKI-Sync-Revision", receipt.revision);
    headers.set("X-SCKI-Synced-Subscriptions", String(receipt.subscriptions));
  }
  let manifest;
  try { manifest = await env2.SUB_STORE_DATA.get(SCKI_SYNC_KEY, "json"); } catch { console.warn("Fusion optional metadata unavailable"); }
  const flow = manifest?.subscriptionUserinfo;
  if (typeof flow === "string" && flow.length < 512 && /^[\w=; .-]+$/.test(flow)) headers.set("subscription-userinfo", flow);
  return new Response(request.method === "HEAD" ? null : content, { status: 200, headers });
}
`;

function subscription(count, prefixes = ['SOURCE-A-', 'SOURCE-B-']) {
  return 'proxies:\n' + JSON.stringify(Array.from({ length: count }, (_, i) => ({
    name: `${prefixes[i % prefixes.length]}Node-${i}`, type: 'ss', server: 'node.example.invalid', port: 443,
  })));
}

async function runtime({ upstream, cached, publicationContract = contract, recoveryContract,
  contractReadFails = false, recoveryReadFails = false, method = 'GET' }) {
  const { patchFusionWorker } = await patcher;
  const { validateFusionPublication, validateFusionContract } = await guard;
  const storage = new Map([[cacheKey, cached], [contractKey, publicationContract],
    [recoveryContractKey, recoveryContract],
    ['example:sync', { subscriptionUserinfo: 'upload=1; download=2; total=1000; expire=2000000000' }]]);
  const gets = [];
  const puts = [];
  let parses = 0;
  let fetches = 0;
  const context = vm.createContext({
    validateFusionPublication, validateFusionContract, Response, Headers, AbortSignal, console,
    // JSON flow arrays are valid YAML. This boundary accepts just that fixture
    // subset; the deployed parser and its schema rules remain unchanged.
    sckiYaml: { parse(content) { parses += 1; return { proxies: JSON.parse(content.slice('proxies:\n'.length)) }; } },
    fetch: async (url, options) => {
      fetches += 1;
      assert.equal(url, 'https://example.invalid/Fusion');
      assert.equal(options.headers['Cache-Control'], 'no-cache');
      return new Response(upstream);
    },
  });
  vm.runInContext(patchFusionWorker(fixture).replace(/^import \{ [^}]+ \} from "\.\/scki-fusion-publication-guard\.mjs";\r?\n/, ''), context);
  const env = { SUB_STORE_DATA: {
    async get(key, format) {
      gets.push([key, format]);
      if (contractReadFails && key === contractKey) throw new Error('unavailable');
      if (recoveryReadFails && key === recoveryContractKey) throw new Error('unavailable');
      return storage.get(key) ?? null;
    },
    async put(key, value) { puts.push([key, value]); storage.set(key, value); },
  } };
  const response = await context.sckiPublishedFusion(new Request('https://example.invalid/download', { method }), env, { revision: 'example-revision', subscriptions: 2 });
  return { response, storage, gets, puts, parses, fetches };
}

const sixSourcePrefixes = ['SOURCE-A-', 'SOURCE-B-', 'SOURCE-C-', 'SOURCE-D-', 'SOURCE-E-', 'SOURCE-F-'];
const sixSourceRecovery = { schemaVersion: 1, minimumNodes: 150, requiredNamePrefixes: sixSourcePrefixes };
const sevenSourceStrict = { ...sixSourceRecovery, requiredNamePrefixes: [...sixSourcePrefixes, 'SOURCE-G-'] };

test('six-source Gist cannot overwrite a verified six-source cache under the seven-source strict contract', async () => {
  const cached = subscription(325, sixSourcePrefixes);
  const upstream = cached.replace('Node-0', 'Fresh-0');
  const result = await runtime({ upstream, cached, publicationContract: sevenSourceStrict, recoveryContract: sixSourceRecovery });
  assert.equal(result.response.status, 200);
  assert.equal(result.response.headers.get('X-SCKI-Source'), 'saved-replica');
  assert.equal(await result.response.text(), cached);
  assert.equal(result.storage.get(cacheKey), cached);
  assert.deepEqual(result.puts, []);
  assert.ok(result.gets.some(([key, format]) => key === recoveryContractKey && format === 'json'));
});

test('seven-source complete Gist can update a six-source recovered cache', async () => {
  const upstream = subscription(350, sevenSourceStrict.requiredNamePrefixes);
  const result = await runtime({ upstream, cached: subscription(325, sixSourcePrefixes),
    publicationContract: sevenSourceStrict, recoveryContract: sixSourceRecovery });
  assert.equal(result.response.status, 200);
  assert.equal(result.response.headers.get('X-SCKI-Source'), 'gist');
  assert.equal(await result.response.text(), upstream);
  assert.deepEqual(result.puts, [[cacheKey, upstream]]);
});

test('missing or malformed strict contract blocks upstream and recovery before fetching', async () => {
  for (const publicationContract of [null, {}, { ...sevenSourceStrict, minimumNodes: 0 },
    { ...sevenSourceStrict, requiredNamePrefixes: [] }, { ...sevenSourceStrict, schemaVersion: 2 }]) {
    const result = await runtime({ upstream: subscription(350, sevenSourceStrict.requiredNamePrefixes),
      cached: subscription(325, sixSourcePrefixes), publicationContract, recoveryContract: sixSourceRecovery });
    assert.equal(result.response.status, 503);
    assert.equal(result.fetches, 0);
    assert.equal(result.parses, 0);
    assert.deepEqual(result.puts, []);
  }
});

test('invalid recovery contract cannot authorize cache fallback', async () => {
  const result = await runtime({ upstream: subscription(325, sixSourcePrefixes), cached: subscription(325, sixSourcePrefixes),
    publicationContract: sevenSourceStrict, recoveryContract: { ...sixSourceRecovery, minimumNodes: 0 } });
  assert.equal(result.response.status, 503);
  assert.deepEqual(result.puts, []);
});

test('missing recovery contract uses the strict contract without weakening source coverage', async () => {
  const result = await runtime({ upstream: subscription(325, sixSourcePrefixes), cached: subscription(325, sixSourcePrefixes),
    publicationContract: sevenSourceStrict });
  assert.equal(result.response.status, 503);
  assert.deepEqual(result.puts, []);
});

test('unavailable recovery contract read can use only a cache that passes the strict contract', async () => {
  const cached = subscription(350, sevenSourceStrict.requiredNamePrefixes);
  const result = await runtime({ upstream: subscription(6), cached, publicationContract: sevenSourceStrict, recoveryReadFails: true });
  assert.equal(result.response.status, 200);
  assert.equal(await result.response.text(), cached);
  assert.deepEqual(result.puts, []);
});

test('partial six-node upstream falls back to complete 325-node cache without overwriting KV', async () => {
  const complete = subscription(325);
  const result = await runtime({ upstream: subscription(6), cached: complete });
  assert.equal(result.response.status, 200);
  assert.equal(await result.response.text(), complete);
  assert.equal(result.response.headers.get('X-SCKI-Source'), 'saved-replica');
  assert.equal(result.storage.get(cacheKey), complete);
  assert.deepEqual(result.puts, []);
  assert.equal(result.parses, 2);
  assert.deepEqual(result.gets[0], [contractKey, 'json']);
});

test('large upstream missing one source also falls back without overwriting KV', async () => {
  const complete = subscription(325);
  const result = await runtime({ upstream: subscription(400, ['SOURCE-A-']), cached: complete });
  assert.equal(await result.response.text(), complete);
  assert.deepEqual(result.puts, []);
});

test('complete new publication updates KV once and preserves existing response metadata', async () => {
  const updated = subscription(326);
  const result = await runtime({ upstream: updated, cached: subscription(325) });
  assert.equal(result.response.status, 200);
  assert.equal(await result.response.text(), updated);
  assert.deepEqual(result.puts, [[cacheKey, updated]]);
  assert.equal(result.parses, 1);
  assert.equal(result.response.headers.get('X-SCKI-Source'), 'gist');
  assert.equal(result.response.headers.get('Cache-Control'), 'no-store');
  assert.equal(result.response.headers.get('profile-update-interval'), '6');
  assert.equal(result.response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(result.response.headers.get('X-SCKI-Sync-Revision'), 'example-revision');
  assert.equal(result.response.headers.get('X-SCKI-Synced-Subscriptions'), '2');
  assert.equal(result.response.headers.get('subscription-userinfo'), 'upload=1; download=2; total=1000; expire=2000000000');
});

test('missing contract fails closed even with otherwise complete upstream and cache', async () => {
  const result = await runtime({ upstream: subscription(325), cached: subscription(325), publicationContract: null });
  assert.equal(result.response.status, 503);
  assert.deepEqual(result.puts, []);
});

test('failed contract read fails closed without writing KV', async () => {
  const result = await runtime({ upstream: subscription(325), cached: subscription(325), contractReadFails: true });
  assert.equal(result.response.status, 503);
  assert.deepEqual(result.puts, []);
});

test('incomplete upstream without a valid cache returns 503', async () => {
  const result = await runtime({ upstream: subscription(6), cached: subscription(6) });
  assert.equal(result.response.status, 503);
  assert.deepEqual(result.puts, []);
});

test('existing basic node validity checks still reject duplicate node names', async () => {
  const node = { name: 'SOURCE-A-duplicate', type: 'ss', server: 'node.example.invalid', port: 443 };
  const invalid = 'proxies:\n' + JSON.stringify(Array.from({ length: 325 }, () => node));
  const complete = subscription(325);
  const result = await runtime({ upstream: invalid, cached: complete });
  assert.equal(await result.response.text(), complete);
  assert.deepEqual(result.puts, []);
});

test('leading country and neutral flags are normalized only for coverage, preserving output bytes', async () => {
  for (const flag of ['🇭🇰', '🇸🇬', '🏳', '🏳️', '🌐']) {
    const upstream = subscription(325, [`${flag} SOURCE-A-`, `${flag} SOURCE-B-`]);
    const result = await runtime({ upstream });
    assert.equal(result.response.status, 200, flag);
    assert.equal(await result.response.text(), upstream);
    assert.deepEqual(result.puts, [[cacheKey, upstream]]);
  }
});

test('other emoji and flag prefixes without whitespace are not stripped', async () => {
  for (const prefix of ['🐱 ', '🇭🇰', '🏳️‍🌈 ', '⭐ ']) {
    const result = await runtime({ upstream: subscription(325, [`${prefix}SOURCE-A-`, `${prefix}SOURCE-B-`]) });
    assert.equal(result.response.status, 503, prefix);
    assert.deepEqual(result.puts, []);
  }
});

test('HEAD keeps the existing empty body behavior', async () => {
  const result = await runtime({ upstream: subscription(325), method: 'HEAD' });
  assert.equal(result.response.status, 200);
  assert.equal(await result.response.text(), '');
});

test('patch preserves unrelated imports, suffixes and CRLF line endings', async () => {
  const { patchFusionWorker } = await patcher;
  const prefix = 'import unrelated from "example-module";\n';
  const suffix = '\nexport { sckiPublishedFusion };\n';
  const patched = patchFusionWorker((prefix + fixture + suffix).replace(/\n/g, '\r\n'));
  assert.ok(patched.startsWith(guardImport + '\r\n' + prefix.replace(/\n/g, '\r\n')));
  assert.ok(patched.endsWith(suffix.replace(/\n/g, '\r\n')));
  assert.doesNotMatch(patched.replace(/\r\n/g, ''), /\n/);
});

test('patch rejects missing, changed, ambiguous and already patched baselines', async () => {
  const { patchFusionWorker } = await patcher;
  for (const source of [null, '', fixture.replace('names.add(proxy.name);', 'names.add(proxy.name.trim());'),
    fixture + fixture, fixture.replace('sckiValidFusion(content))', 'sckiValidFusion(other))'),
    fixture + '\nif (!sckiValidFusion(content)) {}',
    fixture + '\nasync function sckiPublishedFusion (request, env2, receipt) {}']) {
    assert.throws(() => patchFusionWorker(source), /source|baseline|ambiguous|expected/i);
  }
  assert.throws(() => patchFusionWorker(patchFusionWorker(fixture)), /already patched/i);
});
