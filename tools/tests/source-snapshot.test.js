const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const vm = require('node:vm');

const load = () => import(pathToFileURL(path.resolve(__dirname, '../../SubStore/scripts/source-snapshot.mjs')).href);
const loadPatcher = () => import(pathToFileURL(path.resolve(__dirname, '../../SubStore/scripts/patch-source-snapshot-worker.mjs')).href);
const prefix = '/ext-' + 'a'.repeat(64);
const candidate = 'https://provider.example/new#cacheKey=old&flag=yes';
const previewUrl = 'https://provider.example/new#flag=yes';
const oldUrl = 'https://provider.example/old#cacheKey=old&flag=yes';
const originals = [1, 2].map(i => ({ name: 'Node ' + i, type: 'ss', server: 'edge' + i + '.example', port: 443, cipher: 'aes-128-gcm', password: 'private-value' }));
const persisted = () => ({ name: 'source', source: 'remote', url: oldUrl, ua: 'ExampleClient', process: [{ type: 'RenameOperator', args: { from: 'Node', to: 'Renamed' } }], content: '' });
function setup() {
  const store = new Map();
  const writes = [];
  const env = { SUB_STORE_EXTENSION_BACKEND_PATH: prefix, SUB_STORE_SOURCE_SNAPSHOT_POLICIES: JSON.stringify([{ name: 'source', minNodes: 2 }]), SUB_STORE_DATA: {
    async get(key, mode) { const value = store.get(key); return value === undefined ? null : mode === 'json' ? JSON.parse(value) : value; },
    async put(key, value, options) { writes.push({ key, value, options }); store.set(key, value); },
  } };
  let sub = persisted();
  const reader = async name => name === sub?.name ? sub : null;
  return { env, store, writes, reader, setSub(value) { sub = value; } };
}
const request = (method = 'POST', body = { url: candidate, expectedUrl: oldUrl, original: originals }, suffix = '/api/source-snapshot/source') => new Request('https://worker.example' + prefix + suffix, { method, ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
async function upload(f, body) { const { routeSourceSnapshotRequest } = await load(); return (await routeSourceSnapshotRequest(request('POST', body), f.env, f.reader)).response; }
const challenge = () => new Response('<html><title>Just a moment...</title></html>', { status: 403, headers: { 'cf-mitigated': 'challenge', 'content-type': 'text/html' } });

test('stores validated originals separately and exposes safe status without private data', async () => {
  const f = setup(); const response = await upload(f); assert.equal(response.status, 200);
  const saved = await response.json(); assert.equal(saved.status, 'success'); assert.equal(saved.data.nodeCount, 2); assert.equal(saved.data.stored, true);
  assert.equal(f.writes.length, 1); assert.equal(f.writes[0].options.expirationTtl, 86400);
  const record = JSON.parse(f.writes[0].value); assert.deepEqual(JSON.parse(record.body), { proxies: originals });
  assert.equal(record.url, candidate); assert.equal(record.expectedUrl, oldUrl);
  f.setSub({ ...persisted(), url: candidate });
  const { routeSourceSnapshotRequest } = await load();
  const state = await (await routeSourceSnapshotRequest(request('GET'), f.env, f.reader)).response.json();
  assert.equal(state.data.allowed, true); assert.equal(state.data.minNodes, 2); assert.equal(state.data.available, true);
  assert.doesNotMatch(JSON.stringify(state), /private-value|provider\.example|ExampleClient|RenameOperator/);
});

test('unconfigured names remain healthy and unrelated routes are untouched', async () => {
  const { routeSourceSnapshotRequest } = await load(); const f = setup();
  const r = await routeSourceSnapshotRequest(request('GET', undefined, '/api/source-snapshot/healthy'), f.env, f.reader);
  assert.deepEqual(await r.response.json(), { status: 'success', data: { allowed: false } });
  assert.equal(await routeSourceSnapshotRequest(new Request('https://worker.example/legacy/api/subs'), f.env, f.reader), null);
  assert.equal(await routeSourceSnapshotRequest(request('GET'), { ...f.env, SUB_STORE_EXTENSION_BACKEND_PATH: '/bad' }, f.reader), null);
});

test('rejects policy ambiguity, unsafe names, query, extra fields, bad methods and URLs', async () => {
  const { routeSourceSnapshotRequest } = await load(); const f = setup();
  for (const body of [
    { url: candidate, expectedUrl: oldUrl, original: originals, process: [] },
    { url: 'https://user:password@provider.example/new', expectedUrl: oldUrl, original: originals },
    { url: 'https://provider.example/a b', expectedUrl: oldUrl, original: originals },
    { url: candidate, expectedUrl: oldUrl, original: [] },
  ]) assert.ok((await upload(f, body)).status >= 400);
  for (const suffix of ['/api/source-snapshot/source?other=1', '/api/source-snapshot/%252f', '/api/source-snapshot/%2f', '/api/source-snapshot/source/extra']) {
    const result = await routeSourceSnapshotRequest(request('GET', undefined, suffix), f.env, f.reader); assert.ok(result && result.response.status >= 400);
  }
  assert.equal((await routeSourceSnapshotRequest(request('DELETE'), f.env, f.reader)).response.status, 405);
  f.env.SUB_STORE_SOURCE_SNAPSHOT_POLICIES = '[{"name":"source","minNodes":2},{"name":"source","minNodes":1}]';
  assert.equal((await upload(f)).status, 503); assert.equal(f.writes.length, 0);
});

test('rejects incomplete or error placeholder nodes without leaking credentials', async () => {
  const f = setup();
  for (const original of [originals.slice(0, 1), [{ ...originals[0], name: '标签：请去官网获取新订阅链接' }, originals[1]], [{ ...originals[0], server: '127.0.0.1' }, originals[1]], [{ ...originals[0], type: 'ScriptOperator' }, originals[1]]]) {
    const response = await upload(f, { url: candidate, expectedUrl: oldUrl, original });
    assert.equal(response.status, 400); assert.doesNotMatch(await response.text(), /private-value|标签|127\.0\.0\.1/);
  }
  assert.equal(f.writes.length, 0);
});

test('guards current persisted URL and configuration and fails closed on missing lookup/KV', async () => {
  const f = setup(); f.setSub({ ...persisted(), url: 'https://provider.example/concurrent' });
  assert.equal((await upload(f)).status, 409);
  f.setSub({ ...persisted(), source: 'local' }); assert.equal((await upload(f)).status, 403);
  const { routeSourceSnapshotRequest } = await load();
  assert.equal((await routeSourceSnapshotRequest(request(), f.env)).response.status, 503);
  f.setSub(persisted()); f.env.SUB_STORE_DATA.put = async () => { throw new Error('private-value'); };
  const r = await upload(f); assert.equal(r.status, 503); assert.doesNotMatch(await r.text(), /private-value/);
});

test('enforces streamed body size rather than trusting Content-Length', async () => {
  const f = setup(); const { routeSourceSnapshotRequest } = await load();
  const tooLarge = new Request('https://worker.example' + prefix + '/api/source-snapshot/source', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ padding: 'x'.repeat(4 * 1024 * 1024) }) });
  assert.equal((await routeSourceSnapshotRequest(tooLarge, f.env, f.reader)).response.status, 413);
  assert.equal(f.writes.length, 0);
});

test('fetches strictly first then recovers only exact fresh challenge snapshot', async () => {
  const f = setup(); await upload(f); const { fetchWithSourceSnapshot } = await load();
  const signal = new AbortController().signal, headers = { 'User-Agent': 'ExampleClient' }; let received;
  const result = await fetchWithSourceSnapshot(f.env, 'https://provider.example/new', { method: 'GET', signal, headers }, async (url, init) => { received = { url, init }; return challenge(); }, f.reader, previewUrl);
  assert.equal(received.url, 'https://provider.example/new'); assert.equal(received.init.signal, signal); assert.equal(received.init.headers, headers);
  assert.equal(result.status, 200); assert.deepEqual(await result.json(), { proxies: originals });
  assert.equal(result.headers.get('x-sub-store-source-snapshot'), '1');
});

test('never swallows ordinary HTTP errors, throws, aborts or redirects', async () => {
  const f = setup(); await upload(f); const { fetchWithSourceSnapshot } = await load();
  for (const response of [new Response('ok'), new Response('forbidden', { status: 403 }), new Response('bad', { status: 500 }), new Response(null, { status: 302, headers: { location: 'https://elsewhere.example' } })]) {
    assert.equal(await fetchWithSourceSnapshot(f.env, 'https://provider.example/new', {}, async () => response, f.reader, previewUrl), response);
  }
  const failure = new Error('sentinel'); await assert.rejects(fetchWithSourceSnapshot(f.env, 'https://provider.example/new', {}, async () => { throw failure; }, f.reader, previewUrl), e => e === failure);
  const controller = new AbortController(); controller.abort();
  const response = challenge(); assert.equal(await fetchWithSourceSnapshot(f.env, 'https://provider.example/new', { signal: controller.signal }, async () => response, f.reader, previewUrl), response);
});

test('challenge HTML fallback preserves original response body when snapshot does not match', async () => {
  const f = setup(); await upload(f); const { fetchWithSourceSnapshot } = await load();
  const html = '<html><script src="/cdn-cgi/challenge-platform/example"></script></html>';
  const response = new Response(html, { status: 403, headers: { 'Content-Type': 'text/html' } });
  const result = await fetchWithSourceSnapshot(f.env, 'https://provider.example/new', { headers: { 'User-Agent': 'ExampleClient' } }, async () => response, f.reader, 'https://provider.example/new#flag=different');
  assert.equal(result, response); assert.equal(await result.text(), html);
  const recovered = await fetchWithSourceSnapshot(f.env, 'https://provider.example/new', { headers: { 'User-Agent': 'ExampleClient' } }, async () => new Response(html, { status: 403, headers: { 'Content-Type': 'text/html' } }), f.reader, previewUrl);
  assert.equal(recovered.status, 200);
});

test('candidate expires after two minutes; matching persisted URL remains valid for 24 hours', async () => {
  const f = setup(); const realNow = Date.now; let now = realNow(); Date.now = () => now;
  try {
    await upload(f); const { fetchWithSourceSnapshot } = await load();
    const fetch = () => fetchWithSourceSnapshot(f.env, 'https://provider.example/new', { headers: { 'User-Agent': 'ExampleClient' } }, async () => challenge(), f.reader, previewUrl);
    now += 120001; assert.equal((await fetch()).status, 403);
    f.setSub({ ...persisted(), url: candidate }); assert.equal((await fetch()).status, 200);
    now += 86400000; assert.equal((await fetch()).status, 403);
  } finally { Date.now = realNow; }
});

test('does not turn a request aborted during cold KV lookup into snapshot success', async () => {
  const f = setup(); await upload(f); const { fetchWithSourceSnapshot } = await load();
  const controller = new AbortController(), originalGet = f.env.SUB_STORE_DATA.get;
  f.env.SUB_STORE_DATA.get = async (...args) => { const record = await originalGet(...args); controller.abort(); return record; };
  const response = challenge();
  assert.equal(await fetchWithSourceSnapshot(f.env, 'https://provider.example/new', { headers: { 'User-Agent': 'ExampleClient' }, signal: controller.signal }, async () => response, f.reader, previewUrl), response);
});

test('rejects changed processor/UA, stale expected URL, tampered hash and missing cold reader', async () => {
  const f = setup(); await upload(f); const { fetchWithSourceSnapshot } = await load();
  const fetch = reader => fetchWithSourceSnapshot(f.env, 'https://provider.example/new', { headers: { 'User-Agent': 'ExampleClient' } }, async () => challenge(), reader, previewUrl);
  assert.equal((await fetch()).status, 403);
  f.setSub({ ...persisted(), process: [] }); assert.equal((await fetch(f.reader)).status, 403);
  f.setSub({ ...persisted(), ua: 'ChangedClient' }); assert.equal((await fetch(f.reader)).status, 403);
  f.setSub({ ...persisted(), url: 'https://provider.example/third' }); assert.equal((await fetch(f.reader)).status, 403);
  f.setSub(persisted()); const [key, value] = [...f.store][0]; const record = JSON.parse(value); record.body = '{"proxies":[]}'; f.store.set(key, JSON.stringify(record));
  assert.equal((await fetch(f.reader)).status, 403);
});

test('does not confuse candidate path/query/fragment or unrelated source with exact identity', async () => {
  const f = setup(); await upload(f); const { fetchWithSourceSnapshot } = await load();
  for (const [wire, logical] of [
    ['https://provider.example/old', oldUrl],
    ['https://provider.example/new?changed=yes', 'https://provider.example/new?changed=yes#flag=yes'],
    ['https://other.example/new', 'https://other.example/new#flag=yes'],
    ['https://provider.example/new', 'https://provider.example/new#flag=changed'],
  ]) assert.equal((await fetchWithSourceSnapshot(f.env, wire, { headers: { 'User-Agent': 'ExampleClient' } }, async () => challenge(), f.reader, logical)).status, 403);
  assert.equal((await fetchWithSourceSnapshot(f.env, 'https://provider.example/new', { method: 'POST' }, async () => challenge(), f.reader, previewUrl)).status, 403);
  assert.equal((await fetchWithSourceSnapshot(f.env, 'https://provider.example/new', { headers: { 'User-Agent': 'ChangedClient' } }, async () => challenge(), f.reader, previewUrl)).status, 403);
});

const fixture = `async function fetchViaGateway(config2, targetUrl, method, headers, signal) {
  const gatewayResponse = await fetch(config2.endpoint, {method:'POST'});
  const recovered = await recoverDownloadGateway530({
    gatewayResponse, targetUrl, method, headers, signal, fetchTarget: fetch,
    observe: (event, status) => console.log("[SCKI-GATEWAY-530]", event, status)
  });
  if (recovered) return recovered;
  return gatewayResponse;
}
async function nativeDownload(options, upperMethod, config2, fetchOptions, controller) {
  const response2 = gatewayTarget(options.url, upperMethod, config2) ? await fetchViaGateway(config2, options.url, upperMethod, fetchOptions.headers, controller.signal) : await fetch(options.url, fetchOptions);
  return response2;
}
async function handler(request, env2) {
  const extensionRoute = await routeExtensionSyncRequest(request, env2, async (name) => {
    return {name};
  });
  return extensionRoute;
}`;

test('patcher integrates snapshot route before restricted extension route and both download paths', async () => {
  const { patchSourceSnapshotWorker } = await loadPatcher(); const patched = patchSourceSnapshotWorker(fixture);
  const calls = [], context = { cache: { subs: [persisted()] }, request: { body: JSON.stringify({ name: 'source', url: previewUrl }) }, env: { marker: 'env' } };
  const scope = { URL, Request, Response, TextDecoder, JSON, console, getActiveSubStoreContext: () => context, fetch: async () => new Response('wire'),
    fetchWithSourceSnapshot: async (...args) => { calls.push({ type: 'download', args }); return new Response('snapshot'); },
    routeSourceSnapshotRequest: async (...args) => { calls.push({ type: 'snapshot-route', args }); return { response: new Response('stored') }; },
    routeExtensionSyncRequest: async () => { calls.push({ type: 'extension-route' }); return null; }, gatewayTarget: () => false,
  };
  vm.runInNewContext(patched.replace(/^import .*;\r?\n/gm, '') + '\nglobalThis.api={handler,nativeDownload};', scope);
  const routed = await scope.api.handler(new Request('https://worker.example'), {}); assert.equal(await routed.response.text(), 'stored'); assert.deepEqual(calls.map(c => c.type), ['snapshot-route']);
  calls.length = 0; const result = await scope.api.nativeDownload({ url: 'https://provider.example/new' }, 'GET', null, {}, new AbortController()); assert.equal(await result.text(), 'snapshot');
  assert.equal(calls[0].args[0], context.env); assert.equal((await calls[0].args[4]('source')).name, 'source'); assert.equal(calls[0].args[5], previewUrl);
  for (const input of ['', fixture + fixture, patched, fixture.replace('fetchTarget: fetch,', 'fetchTarget: alternate,')]) assert.throws(() => patchSourceSnapshotWorker(input));
});

test('patched gateway-530 and direct requests cold-read real config and return verified original JSON', async () => {
  const f = setup(); await upload(f);
  const { patchSourceSnapshotWorker } = await loadPatcher(); const { fetchWithSourceSnapshot, routeSourceSnapshotRequest } = await load();
  const { recoverDownloadGateway530 } = await import(pathToFileURL(path.resolve(__dirname, '../../SubStore/scripts/download-gateway-fallback.mjs')).href);
  const context = { cache: { subs: [persisted()] }, request: { body: JSON.stringify({ source: 'remote', name: 'source', url: previewUrl }) }, env: f.env };
  let gateway = false, networkCalls = 0;
  const scope = { URL, Request, Response, TextDecoder, JSON, console: { log() {} }, getActiveSubStoreContext: () => context,
    fetchWithSourceSnapshot, routeSourceSnapshotRequest, recoverDownloadGateway530,
    gatewayTarget: () => gateway,
    fetch: async url => { networkCalls++; return url === 'https://gateway.example/' ? new Response(null, { status: 530 }) : challenge(); },
  };
  vm.runInNewContext(patchSourceSnapshotWorker(fixture).replace(/^import .*;\r?\n/gm, '') + '\nglobalThis.api={nativeDownload};', scope);
  for (const isGateway of [false, true]) {
    gateway = isGateway; networkCalls = 0;
    const response = await scope.api.nativeDownload({ url: 'https://provider.example/new' }, 'GET', { endpoint: 'https://gateway.example/' }, { method: 'GET', headers: { 'User-Agent': 'ExampleClient' } }, new AbortController());
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), { proxies: originals });
    assert.equal(networkCalls, isGateway ? 2 : 1);
  }
});
