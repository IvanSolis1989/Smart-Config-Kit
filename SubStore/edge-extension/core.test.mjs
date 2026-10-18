import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { DEFAULT_SETTINGS as CORE_DEFAULT_SETTINGS, SyncError, settingsFrom, candidateURL, mergeURL, withoutCacheKey, realNodeCount,
  canonical, sha256, syncSubscription, restoreBackup, SubStoreClient, targetSettingsFrom } from './core.mjs';
const DEFAULT_SETTINGS = { ...CORE_DEFAULT_SETTINGS, subscriptionName: '良心云' };

const oldURL = 'https://sub.example.com/api/v1/client/subscribe?token=old-secret#flowDedup=account';
const candidate = 'https://sub.example.com/api/v1/client/subscribe?token=new-secret';
const crossOriginCandidate = 'https://cdn.new.example.net/sub?token=new-cdn-secret';
const node = { type: 'trojan', name: '香港 01', server: 'hk.example.com', port: 443, password: 'private-node-value' };
const placeholderHosts = ['0:0:0:0:0:0:0:0', '0:0:0:0:0:0:0:1', '[0000:0000:0000:0000:0000:0000:0000:0001]',
  '::ffff:127.0.0.1', '[::ffff:127.0.0.1]', '::FFFF:7F00:1', '0:0:0:0:0:ffff:7f00:1', '::ffff:0.0.0.0', '::ffff:0:1',
  'localhost.', 'LOCALHOST.', 'edge.localhost.', 'nested.edge.LOCALHOST..', '127.0.0.1.', '127.1', '2130706433', '0x7f000001', '0177.0.0.1', '0.0.0.0', '0.1.2.3'];
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

test('cloud settings preserve HTTPS backend prefix while local settings remain strict', () => {
  const global = settingsFrom({ cloudEnabled: true, cloudBackendUrl: 'https://worker.example/private-prefix/' });
  assert.equal(global.cloudBackendUrl, 'https://worker.example/private-prefix');
  assert.equal(targetSettingsFrom(global, 'cloud').backendUrl, global.cloudBackendUrl);
  assert.equal(targetSettingsFrom(global, 'cloud').targetId, 'cloud');
  for (const cloudBackendUrl of ['http://worker.example/key', 'https://user:pw@worker.example/key',
    'https://worker.example/key?x=1', 'https://worker.example/key#x', 'https://worker.example/a/../key',
    'https://worker.example/a/%2e%2e/key', 'https://worker.example/a/%252e%252e/key', 'https://worker.example/a%2fkey']) {
    assert.throws(() => settingsFrom({ cloudEnabled: true, cloudBackendUrl }), code('invalid_settings'));
  }
  assert.equal(settingsFrom().cloudEnabled, false);
});

test('cloud synchronization uses its complete prefix for preview, URL-only PATCH and readback', async () => {
  const f = fixture();
  const settings = targetSettingsFrom({ ...DEFAULT_SETTINGS, cloudEnabled: true, cloudBackendUrl: 'https://worker.example/private-prefix' }, 'cloud');
  settings.subscriptionName = DEFAULT_SETTINGS.subscriptionName;
  const result = await syncSubscription({ ...f.input(), settings });
  assert.equal(result.status, 'updated');
  assert.ok(f.calls.every(call => call.url.startsWith('https://worker.example/private-prefix/api/')));
  assert.equal(f.backups[0].targetId, 'cloud');
});

test('bodyless GET omits JSON Content-Type while preview and URL-only PATCH declare JSON', async () => {
  const f = fixture();
  const client = new SubStoreClient(DEFAULT_SETTINGS, f.fetcher);
  await client.request('/api/subs');
  await syncSubscription(f.input());
  const reads = f.calls.filter(call => call.method === 'GET');
  assert.ok(reads.length >= 4, 'covers catalog, source checks and writeback GET');
  for (const call of reads) {
    assert.equal(new Headers(call.headers).has('Content-Type'), false);
    assert.equal(call.body, undefined);
  }
  for (const method of ['POST', 'PATCH']) {
    const writes = f.calls.filter(call => call.method === method);
    assert.equal(writes.length, 1);
    assert.equal(new Headers(writes[0].headers).get('Content-Type'), 'application/json');
    assert.ok(JSON.parse(writes[0].body));
  }
  assert.deepEqual(Object.keys(JSON.parse(f.calls.find(call => call.method === 'PATCH').body)), ['url']);
});

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

test('encoded option names remain literal under the documented Sub-Store fragment parser', () => {
  // download.js at 832d3a0 decodes parameter values, not their names.
  // These literal options therefore cannot select a custom cache entry.
  for (const name of ['cache%4Bey','%63acheKey','cache%254Bey']) {
    const suffix='#'+name+'=stale&headers=a+b%20c&flowDedup=account';
    assert.equal(withoutCacheKey(candidate+suffix),candidate+suffix);
    assert.equal(withoutCacheKey(candidate+'#cacheKey=real&'+suffix.slice(1)),candidate+suffix);
  }
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
test('expanded IPv6, mapped IPv4 and trailing-dot localhost placeholders never count as real nodes', () => {
  for (const server of placeholderHosts) assert.equal(realNodeCount([{ ...node, server }]), 0, server);
});
test('host normalization preserves real public, private, IPv6 and LAN hostname nodes', () => {
  for (const server of ['hk.example.com', 'HK.EXAMPLE.COM.', '10.0.0.2', '192.168.2.10', '172.16.2.2', '8.8.8.8',
    '2001:4860:4860::8888', '[2001:4860:4860::8888]', 'fd00::12', 'fe80::1', '::ffff:192.168.1.2', '::ffff:c0a8:102', 'proxy.lan', 'intranet']) {
    assert.equal(realNodeCount([{ ...node, server }]), 1, server);
  }
  for (const server of ['', ' ', 'hk.example.com:443', 'https://hk.example.com', 'hk.example.com/path', 'host?query', 'host#tag',
    'user@host', '[::1', '::1]', '[invalid]', 'a\nb', 'host\\other', '%6cocalhost']) {
    assert.equal(realNodeCount([{ ...node, server }]), 0, 'malformed server host');
  }
});
test('placeholder-only original or processed arrays stop before backup and PATCH', async () => {
  const placeholders = placeholderHosts.map(server => ({ ...node, server }));
  for (const preview of [{ original: placeholders, processed: [node] }, { original: [node], processed: placeholders },
    { original: placeholders, processed: placeholders }]) {
    const f = fixture({ preview });
    await assert.rejects(syncSubscription(f.input()), code('candidate_has_no_real_nodes'));
    assert.deepEqual(f.calls.map(call => call.method), ['GET', 'POST']);
    assert.equal(f.backups.length, 0);
    assert.equal(f.sub().url, oldURL);
  }
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
test('candidate supersession after source GET, preview or source recheck stops all later work', async () => {
  for (const methods of [['GET'], ['GET', 'POST'], ['GET', 'POST', 'GET']]) {
    const f = fixture();
    const superseded = new SyncError('candidate_superseded');
    let stale = false;
    const fetcher = async (...args) => {
      const response = await f.fetcher(...args);
      if (f.calls.length === methods.length) stale = true;
      return response;
    };
    await assert.rejects(syncSubscription({ ...f.input(), fetcher, assertCurrent() { if (stale) throw superseded; } }), error => error === superseded);
    assert.deepEqual(f.calls.map(call => call.method), methods);
    assert.equal(f.backups.length, 0);
    assert.equal(f.sub().url, oldURL);
  }
});
test('candidate supersession during asynchronous backup hashing stops before saving the backup', async () => {
  const f = fixture();
  const superseded = new SyncError('candidate_superseded');
  let stale = false;
  let scheduled = false;
  await assert.rejects(syncSubscription({ ...f.input(), assertCurrent() {
    if (stale) throw superseded;
    if (!scheduled && f.calls.map(call => call.method).join(',') === 'GET,POST,GET') {
      scheduled = true;
      queueMicrotask(() => { stale = true; });
    }
  } }), error => error === superseded);
  assert.equal(scheduled, true);
  assert.deepEqual(f.calls.map(call => call.method), ['GET', 'POST', 'GET']);
  assert.equal(f.backups.length, 0);
  assert.equal(f.sub().url, oldURL);
});
test('candidate supersession while saving backup preserves that backup but prevents PATCH', async () => {
  const f = fixture();
  const superseded = new SyncError('candidate_superseded');
  let stale = false;
  await assert.rejects(syncSubscription({ ...f.input(), saveBackup: async backup => {
    f.backups.push(backup);
    await Promise.resolve();
    stale = true;
  }, assertCurrent() { if (stale) throw superseded; } }), error => error === superseded);
  assert.deepEqual(f.calls.map(call => call.method), ['GET', 'POST', 'GET']);
  assert.equal(f.backups.length, 1);
  assert.equal(f.backups[0].previousURL, oldURL);
  assert.equal(f.sub().url, oldURL);
});
test('an externally superseded candidate cannot PATCH after a deferred preview or backup resolves', async () => {
  for (const stage of ['preview', 'backup']) {
    const f = fixture();
    const superseded = new SyncError('candidate_superseded');
    let stale = false;
    let entered;
    let release;
    const waiting = new Promise(resolve => { entered = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    const fetcher = async (url, request) => {
      const response = await f.fetcher(url, request);
      if (stage === 'preview' && request.method === 'POST') { entered(); await gate; }
      return response;
    };
    const saveBackup = async backup => {
      f.backups.push(backup);
      if (stage === 'backup') { entered(); await gate; }
    };
    const running = syncSubscription({ ...f.input(), fetcher, saveBackup, assertCurrent() { if (stale) throw superseded; } });
    const rejected = assert.rejects(running, error => error === superseded);
    await waiting;
    stale = true;
    release();
    await rejected;
    assert.deepEqual(f.calls.map(call => call.method), stage === 'preview' ? ['GET', 'POST'] : ['GET', 'POST', 'GET']);
    assert.equal(f.backups.length, stage === 'backup' ? 1 : 0);
    assert.equal(f.sub().url, oldURL);
  }
});
test('unchanged and dry-run results cannot report success after candidate supersession', async () => {
  for (const options of [{ candidateUrl: oldURL }, { dryRun: true }]) {
    const f = fixture();
    const superseded = new SyncError('candidate_superseded');
    let stale = false;
    const fetcher = async (url, request) => {
      const response = await f.fetcher(url, request);
      if (request.method === 'POST') stale = true;
      return response;
    };
    await assert.rejects(syncSubscription({ ...f.input(), ...options, fetcher, assertCurrent() { if (stale) throw superseded; } }), error => error === superseded);
    assert.deepEqual(f.calls.map(call => call.method), ['GET', 'POST']);
    assert.equal(f.backups.length, 0);
  }
});
test('assertCurrent stays synchronous and its returned thenable is never awaited', async () => {
  const f = fixture();
  let checks = 0;
  let thenReads = 0;
  const returned = Object.defineProperty({}, 'then', { get() { thenReads++; throw new Error('assertCurrent must not be awaited'); } });
  const result = await syncSubscription({ ...f.input(), assertCurrent() { checks++; return returned; } });
  assert.equal(result.status, 'updated');
  assert.ok(checks > 0);
  assert.equal(thenReads, 0);
  assert.equal(f.calls.filter(call => call.method === 'PATCH').length, 1);
});
test('supersession after PATCH or readback cannot return an obsolete updated result', async () => {
  for (const stopAt of [4, 5]) {
    const f = fixture();
    const superseded = new SyncError('candidate_superseded');
    let stale = false;
    const fetcher = async (...args) => {
      const response = await f.fetcher(...args);
      if (f.calls.length === stopAt) stale = true;
      return response;
    };
    await assert.rejects(syncSubscription({ ...f.input(), fetcher, assertCurrent() { if (stale) throw superseded; } }), error => error === superseded);
    assert.equal(f.calls.length, stopAt);
    assert.equal(f.calls.filter(call => call.method === 'PATCH').length, 1, 'an already dispatched PATCH cannot be cancelled retroactively');
    assert.equal(f.backups.length, 1);
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

test('transport cleanup failures retain only safe receipt metadata through the API client', async () => {
  for (const cleanupFailed of [true, false, 'true']) {
    const transportError = Object.assign(new Error('PRIVATE-CHROME-ERROR'), {
      code: 'local_transport_not_ready', cleanupFailed, cleanupErrors: ['PRIVATE-CHROME-ERROR'],
    });
    const client = new SubStoreClient(DEFAULT_SETTINGS, async () => { throw transportError; });
    await assert.rejects(client.getSub(), error => {
      assert.equal(error.code, 'local_transport_not_ready');
      assert.equal(error.message, 'local_transport_not_ready');
      assert.equal(error.cleanupFailed, cleanupFailed === true ? true : undefined);
      assert.equal(error.cleanupErrors, undefined);
      return true;
    });
  }
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
