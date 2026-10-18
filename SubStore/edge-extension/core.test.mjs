import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { DEFAULT_SETTINGS as CORE_DEFAULT_SETTINGS, SyncError, settingsFrom, candidateURL, mergeURL, withoutCacheKey, realNodeCount,
  canonical, sha256, syncSubscription, restoreBackup, SubStoreClient } from './core.mjs';
const DEFAULT_SETTINGS = { ...CORE_DEFAULT_SETTINGS, subscriptionName: '良心云' };

const oldURL = 'https://sub.example.com/api/v1/client/subscribe?token=old-secret#flowDedup=account';
const candidate = 'https://sub.example.com/api/v1/client/subscribe?token=new-secret';
const crossOriginCandidate = 'https://cdn.new.example.net/sub?token=new-cdn-secret';
const node = { type: 'trojan', name: '香港 01', server: 'hk.example.com', port: 443, password: 'private-node-value' };
const subscription = () => ({ name: '良心云', displayName: '良心云', source: 'remote', url: oldURL,
  mergeSources: 'localFirst', content: '', ua: 'custom-ua', proxy: 'PROXY',
  process: [{ type: 'Script Operator', args: { content: 'keep-me' } }], custom: { preserve: true } });
function fixture(options = {}) {
  let sub = subscription();
  const calls = [], backups = [];
  let reads = 0;
  const fetcher = async (url, request) => {
    calls.push({ url, ...request });
    assert.equal(request.redirect, 'error');
    assert.equal(request.credentials, 'omit');
    let data;
    if (request.method === 'GET') {
      reads++;
      if (options.concurrent && reads === 2) sub.custom.changed = true;
      data = structuredClone(sub);
    } else if (request.method === 'POST') {
      data = options.preview || { original: [node], processed: [node] };
    } else if (request.method === 'PATCH') {
      const body = JSON.parse(request.body);
      assert.deepEqual(Object.keys(body), ['url']);
      sub.url = body.url;
      if (options.badReadback) sub.process = [];
      data = {};
    } else assert.fail('unexpected method');
    return new Response(JSON.stringify({ status: 'success', data }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return { fetcher, calls, backups, sub: () => sub, input: () => ({ settings: DEFAULT_SETTINGS, candidateUrl: candidate,
    fetcher, saveBackup: async value => backups.push(value) }) };
}
const code = expected => error => error instanceof SyncError && error.code === expected;

test('fixed local-only settings reject remote hosts, credentials and paths', () => {
  for (const backendUrl of ['https://127.0.0.1:38324', 'http://example.com:38324', 'http://user:pw@127.0.0.1:38324',
    'http://127.0.0.1:38324/api', 'http://127.0.0.1:38324?x=1', 'http://localhost:38324']) {
    assert.throws(() => settingsFrom({ backendUrl }), code('invalid_settings'));
  }
  assert.equal(settingsFrom({ backendUrl: 'http://127.0.0.1:3000/' }).backendUrl, 'http://127.0.0.1:3000');
});
test('authorized domain and IP subscriptions support HTTP(S) while credentials and malformed URLs fail', () => {
  for (const value of ['http://sub.example.com/a', 'https://127.0.0.1/a', 'https://[::1]/a', 'https://host.local/a']) assert.ok(candidateURL(value));
  for (const value of ['ftp://sub.example.com/a', 'https:sub.example.com/a', 'https://@sub.example.com/a',
    'https://user:pw@sub.example.com/a', 'https://sub.example.com/\na']) assert.throws(() => candidateURL(value), code('invalid_candidate'));
});
test('merge preserves original fragment and requires exact subscription origin', () => {
  assert.equal(mergeURL(candidate, oldURL), candidate + '#flowDedup=account');
  assert.throws(() => mergeURL('https://other.example.com/a', oldURL), code('candidate_origin_changed'));
  assert.throws(() => mergeURL(candidate + '#different=x', oldURL), code('fragment_conflict'));
});
test('explicit origin change permission preserves fragments without bypassing URL and conflict validation', () => {
  assert.equal(mergeURL(crossOriginCandidate, oldURL, true), crossOriginCandidate + '#flowDedup=account');
  assert.equal(mergeURL('http://192.168.1.20:8080/sub?token=new', oldURL, true), 'http://192.168.1.20:8080/sub?token=new#flowDedup=account');
  for (const permission of [false, undefined, null, 1, 'true', {}]) {
    assert.throws(() => mergeURL(crossOriginCandidate, oldURL, permission), code('candidate_origin_changed'));
  }
  assert.throws(() => mergeURL(crossOriginCandidate + '#different=option', oldURL, true), code('fragment_conflict'));
  for (const invalid of ['ftp://cdn.example.net/sub', 'https:cdn.example.net/sub', 'https://user:pw@cdn.example.net/sub',
    'https://@cdn.example.net/sub', crossOriginCandidate + '\n', crossOriginCandidate + '\\injected']) {
    assert.throws(() => mergeURL(invalid, oldURL, true), code('invalid_candidate'));
    assert.throws(() => mergeURL(crossOriginCandidate, invalid, true), code('invalid_candidate'));
  }
});
test('cacheKey is removed only from temporary params preview', () => {
  assert.equal(withoutCacheKey(candidate + '#flowDedup=a&cacheKey=old&noCache'), candidate + '#flowDedup=a&noCache');
  assert.equal(withoutCacheKey(candidate + '#noCache'), candidate + '#noCache');
});
test('removing cacheKey preserves raw encoded headers, spaces, plus and flag semantics', () => {
  const header = 'headers=%7B%22X-Test%22%3A%22a%20b%2Bc%22%7D';
  assert.equal(withoutCacheKey(candidate + '#' + header + '&cacheKey=stale&noCache'), candidate + '#' + header + '&noCache');
});
test('cacheKey JSON and encoded JSON fragments preserve all other options', () => {
  for (const encode of [value => value, encodeURIComponent]) {
    const url = withoutCacheKey(candidate + '#' + encode(JSON.stringify({ cacheKey: 'stale', headers: { 'X-Test': 'keep' }, flowDedup: 'account' })));
    assert.deepEqual(JSON.parse(decodeURIComponent(new URL(url).hash.slice(1))), { headers: { 'X-Test': 'keep' }, flowDedup: 'account' });
  }
});
test('HTTP200 sentinel and metadata nodes do not count as real', () => {
  assert.equal(realNodeCount([
    { ...node, server: '127.0.0.1', port: 65535, name: '在线设备数量超过套餐允许值' },
    { ...node, server: '::1', name: '打开官网获取新订阅链接' }, { ...node, name: '剩余流量 100GB' },
  ]), 0);
  assert.equal(realNodeCount([node, { ...node, server: '127.0.0.1' }]), 1);
});
test('valid candidate runs original processing chain, backs up, PATCHes url only and reads back', async () => {
  const f = fixture();
  const before = structuredClone(f.sub());
  const result = await syncSubscription(f.input());
  assert.equal(result.status, 'updated');
  assert.equal(f.backups.length, 1);
  assert.equal(f.backups[0].previousURL, oldURL);
  assert.deepEqual(f.sub(), { ...before, url: candidate + '#flowDedup=account' });
  const preview = JSON.parse(f.calls.find(call => call.method === 'POST').body);
  assert.deepEqual(preview.process, before.process);
  assert.equal(preview.ua, before.ua); assert.equal(preview.proxy, before.proxy); assert.equal(preview.noCache, true);
  assert.deepEqual(f.calls.map(call => call.method), ['GET', 'POST', 'GET', 'PATCH', 'GET']);
  assert.equal(JSON.stringify(result).includes('secret'), false);
  assert.equal(JSON.stringify(result).includes('private-node-value'), false);
});
test('empty original and processed output each prevent writes', async () => {
  for (const preview of [{ original: [], processed: [node] }, { original: [node], processed: [] },
    { original: [{ ...node, server: '127.0.0.1' }], processed: [node] }]) {
    const f = fixture({ preview });
    await assert.rejects(syncSubscription(f.input()), code('candidate_has_no_real_nodes'));
    assert.equal(f.calls.some(call => call.method === 'PATCH'), false); assert.equal(f.backups.length, 0);
  }
});
test('malformed preview fails closed', async () => {
  const f = fixture({ preview: { processed: [node] } });
  await assert.rejects(syncSubscription(f.input()), code('preview_invalid'));
  assert.equal(f.calls.some(call => call.method === 'PATCH'), false);
});
test('dry run does not back up or mutate', async () => {
  const f = fixture(); const result = await syncSubscription({ ...f.input(), dryRun: true });
  assert.equal(result.status, 'dry_run'); assert.equal(f.backups.length, 0); assert.equal(f.sub().url, oldURL);
});
test('same URL is validated and never PATCHed again', async () => {
  const f = fixture(); const result = await syncSubscription({ ...f.input(), candidateUrl: oldURL });
  assert.equal(result.status, 'unchanged'); assert.equal(f.calls.length, 2); assert.equal(f.backups.length, 0);
});
test('disabled automation performs no backend access', async () => {
  const f = fixture(); assert.equal((await syncSubscription({ ...f.input(), settings: { ...DEFAULT_SETTINGS, enabled: false } })).status, 'disabled');
  assert.equal(f.calls.length, 0);
});
test('origin changes are blocked before remote preview', async () => {
  const f = fixture(); await assert.rejects(syncSubscription({ ...f.input(), candidateUrl: 'https://new.example.net/sub?token=changed' }), code('candidate_origin_changed'));
  assert.equal(f.calls.length, 1);
});
test('authorized origin change validates the full processing chain and updates only URL with original options preserved', async () => {
  const f = fixture();
  const before = structuredClone(f.sub());
  const result = await syncSubscription({ ...f.input(), candidateUrl: crossOriginCandidate, allowOriginChange: true, expectedBeforeURL: before.url });
  const writtenURL = crossOriginCandidate + '#flowDedup=account';
  assert.equal(result.status, 'updated');
  assert.equal(result.candidateHost, 'cdn.new.example.net');
  assert.equal(result.originalNodes, 1);
  assert.equal(result.processedNodes, 1);
  assert.deepEqual(f.calls.map(call => call.method), ['GET', 'POST', 'GET', 'PATCH', 'GET']);
  assert.deepEqual(JSON.parse(f.calls.find(call => call.method === 'POST').body), { ...before, url: writtenURL, noCache: true, ignoreFailedRemoteSub: false });
  assert.deepEqual(JSON.parse(f.calls.find(call => call.method === 'PATCH').body), { url: writtenURL });
  assert.deepEqual(f.sub(), { ...before, url: writtenURL });
  assert.equal(f.backups.length, 1);
  assert.equal(f.backups[0].previousURL, before.url);
});
test('origin change permission still requires real original and processed nodes before any backup or PATCH', async () => {
  const warning = { ...node, server: '127.0.0.1', port: 65535, name: '在线设备数量超过套餐允许值' };
  for (const preview of [{ original: [], processed: [node] }, { original: [node], processed: [] },
    { original: [warning], processed: [node] }, { original: [node], processed: [warning] }]) {
    const f = fixture({ preview });
    await assert.rejects(syncSubscription({ ...f.input(), candidateUrl: crossOriginCandidate, allowOriginChange: true, expectedBeforeURL: oldURL }), code('candidate_has_no_real_nodes'));
    assert.deepEqual(f.calls.map(call => call.method), ['GET', 'POST']);
    assert.equal(f.backups.length, 0);
    assert.equal(f.sub().url, oldURL);
  }
});
test('a stale directory URL snapshot fails on the first source read before preview, backup or PATCH', async () => {
  for (const allowOriginChange of [false, true]) {
    const f = fixture();
    const newerURL = oldURL.replace('old-secret', 'concurrently-changed-secret');
    f.sub().url = newerURL;
    const before = structuredClone(f.sub());
    await assert.rejects(syncSubscription({ ...f.input(), candidateUrl: crossOriginCandidate, allowOriginChange, expectedBeforeURL: oldURL }), code('concurrent_change'));
    assert.deepEqual(f.calls.map(call => call.method), ['GET']);
    assert.equal(f.backups.length, 0);
    assert.deepEqual(f.sub(), before);
  }
  for (const expectedBeforeURL of [null, oldURL.replace('https:', 'HTTPS:')]) {
    const f = fixture();
    await assert.rejects(syncSubscription({ ...f.input(), expectedBeforeURL }), code('concurrent_change'));
    assert.deepEqual(f.calls.map(call => call.method), ['GET'], 'snapshot equality is exact, not normalized URL equality');
    assert.equal(f.backups.length, 0);
  }
});
test('concurrent source changes block backup and PATCH', async () => {
  for (const options of [{}, { candidateUrl: crossOriginCandidate, allowOriginChange: true, expectedBeforeURL: oldURL }]) {
    const f = fixture({ concurrent: true }); await assert.rejects(syncSubscription({ ...f.input(), ...options }), code('concurrent_change'));
    assert.equal(f.backups.length, 0); assert.equal(f.calls.some(call => call.method === 'PATCH'), false);
  }
});
test('backup failure prevents write', async () => {
  const f = fixture(); await assert.rejects(syncSubscription({ ...f.input(), saveBackup: async () => { throw new Error('disk-full'); } }));
  assert.equal(f.calls.some(call => call.method === 'PATCH'), false);
});
test('independent readback detects processing changes and preserves backup', async () => {
  const f = fixture({ badReadback: true }); await assert.rejects(syncSubscription(f.input()), code('writeback_verification_failed'));
  assert.equal(f.backups.length, 1);
});
test('network and HTTP errors are fixed codes without URLs or tokens', async () => {
  for (const [fetcher, expected] of [
    [async () => { throw new Error(candidate); }, 'backend_unavailable'],
    [async () => new Response('secret-in-error', { status: 500 }), 'backend_http_error'],
    [async () => new Response('<html>wrong port</html>'), 'backend_invalid_json'],
    [async () => new Response(JSON.stringify({ status: 'failed', message: candidate })), 'backend_rejected'],
  ]) {
    await assert.rejects(syncSubscription({ settings: DEFAULT_SETTINGS, candidateUrl: candidate, fetcher }), error => {
      assert.equal(error.message, expected); return code(expected)(error);
    });
  }
});
test('restoration is conditional on the written URL and unchanged other fields', async () => {
  const f = fixture(); await syncSubscription(f.input());
  assert.equal((await restoreBackup({ settings: DEFAULT_SETTINGS, backup: f.backups[0], fetcher: f.fetcher })).status, 'restored');
  assert.equal(f.sub().url, oldURL);
  await assert.rejects(restoreBackup({ settings: DEFAULT_SETTINGS, backup: f.backups[0], fetcher: f.fetcher }), code('concurrent_change'));
});
test('canonical hashes ignore property order while preserving array order', async () => {
  assert.equal(canonical({ a: 1, b: [2, 3] }), canonical({ b: [2, 3], a: 1 }));
  assert.equal(await sha256({ a: 1, b: 2 }), await sha256({ b: 2, a: 1 }));
});
test('actual fetch exercises local HTTP service and readback without external requests', async () => {
  let sub = subscription(); let patches = 0;
  const server = http.createServer(async (req, res) => {
    const parts = []; for await (const part of req) parts.push(part);
    let data;
    if (req.method === 'POST') data = { original: [node], processed: [node] };
    else if (req.method === 'PATCH') { sub.url = JSON.parse(Buffer.concat(parts)).url; patches++; data = {}; }
    else data = sub;
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ status: 'success', data }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const settings = { ...DEFAULT_SETTINGS, backendUrl: `http://127.0.0.1:${server.address().port}` };
    assert.equal((await syncSubscription({ settings, candidateUrl: candidate })).status, 'updated');
    assert.equal(patches, 1);
    assert.equal((await new SubStoreClient(settings).getSub()).url, candidate + '#flowDedup=account');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
