import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalFetcher } from './local-fetch.mjs';
const settings = { frontendUrl: 'http://127.0.0.1:14122', backendUrl: 'http://127.0.0.1:38324', subscriptionName: '良心云' };
const endpoint = settings.backendUrl + '/api/sub/' + encodeURIComponent(settings.subscriptionName);
const response = { type: 'LOCAL_BACKEND_RESPONSE', ok: true, status: 200, contentType: 'application/json', bodyText: '{"status":"success"}' };
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
function event() { const listeners = new Set(); return { addListener: f => listeners.add(f), emit: (...args) => { for (const f of listeners) f(...args); } }; }
function fixture({ existing = false, readiness = true, backend = async () => response, legacy = false, senderChange, wrongNonce = false } = {}) {
  const calls = [], creates = [], closes = [], configurations = [];
  const state = { exists: existing, createGate: null, fail: '', port: null };
  const runtime = { id: 'fixture-extension', getURL: file => 'chrome-extension://fixture-extension/' + file, onConnect: event(),
    async sendMessage(message) {
      configurations.push(structuredClone(message));
      if (state.fail === 'configure') throw Error('PRIVATE-CONFIGURE');
      if (!readiness) return;
      const sender = { id: runtime.id, url: message.frontendUrl + '/?api=' + encodeURIComponent(message.backendUrl), origin: message.frontendUrl, ...senderChange };
      const port = { name: 'scki-local-offscreen-v1', sender, onMessage: event(), onDisconnect: event(), disconnect() { this.onDisconnect.emit(); },
        postMessage(request) { calls.push(structuredClone(request)); if (state.fail === 'send') throw Error('PRIVATE-SEND');
          Promise.resolve(backend(request)).then(value => port.onMessage.emit({ ...value, requestId: request.requestId }), () => port.disconnect()); } };
      state.port = port; runtime.onConnect.emit(port);
      port.onMessage.emit({ type: 'LOCAL_TRANSPORT_HELLO', nonce: wrongNonce ? '0'.repeat(64) : message.nonce });
    },
  };
  if (!legacy) runtime.getContexts = async () => state.exists ? [{ documentUrl: runtime.getURL('offscreen.html') }] : [];
  const api = { runtime, offscreen: {
    async createDocument(options) { creates.push(options); if (state.createGate) await state.createGate; if (state.fail === 'create') throw Error('PRIVATE-CREATE'); state.exists = true; },
    async closeDocument() { closes.push(true); if (state.fail === 'close') throw Error('PRIVATE-CLOSE'); state.exists = false; state.port?.disconnect(); },
  }, tabs: { create() { assert.fail('visible tabs must never be created'); } } };
  const clients = { async matchAll(options) { assert.deepEqual(options, { type: 'window', includeUncontrolled: true }); return state.exists ? [{ url: runtime.getURL('offscreen.html') }] : []; } };
  const options = { sleep: async () => {}, clients };
  return { api, state, calls, creates, closes, configurations, options, fetcher: createLocalFetcher(api, settings, options) };
}
test('concurrent requests share one hidden document and bound iframe without visible tabs', async () => {
  const f = fixture(); await Promise.all([f.fetcher(endpoint), f.fetcher(endpoint), f.fetcher(endpoint)]);
  assert.equal(f.creates.length, 1); assert.equal(f.configurations.length, 1); assert.equal(f.calls.length, 3);
  assert.equal(f.creates[0].url, 'offscreen.html'); assert.deepEqual(f.creates[0].reasons, ['IFRAME_SCRIPTING']);
});
test('separate fetcher instances reuse one binding while preserving subscription names', async () => {
  const f = fixture(), second = createLocalFetcher(f.api, { ...settings, subscriptionName: 'Second' }, f.options);
  await f.fetcher(endpoint); await second(settings.backendUrl + '/api/sub/Second');
  assert.equal(f.creates.length, 1); assert.equal(f.configurations.length, 1);
  assert.deepEqual(f.calls.map(call => call.subscriptionName), [settings.subscriptionName, 'Second']);
});
test('legacy clients fallback recovers an existing offscreen document without documentId or tab', async () => {
  const f = fixture({ existing: true, legacy: true }); await f.fetcher(endpoint);
  assert.equal(f.creates.length, 0); assert.match(f.configurations[0].nonce, /^[a-f0-9]{64}$/);
  assert.equal(f.state.port.sender.documentId, undefined); assert.equal(f.state.port.sender.tab, undefined);
});
test('only the expected extension, exact iframe URL, origin, nonce and no tab can bind', async () => {
  for (const options of [{ senderChange: { id: 'other' } }, { senderChange: { url: settings.frontendUrl + '/other' } },
    { senderChange: { origin: 'https://evil.example' } }, { senderChange: { tab: { id: 99 } } }, { wrongNonce: true }]) {
    const f = fixture(options); await assert.rejects(f.fetcher(endpoint), { code: 'local_transport_not_ready' }); assert.equal(f.calls.length, 0);
  }
});
test('readiness failure is bounded and only a newly created unused document is closed', async () => {
  for (const existing of [false, true]) { const f = fixture({ existing, readiness: false });
    await assert.rejects(f.fetcher(endpoint), { code: 'local_transport_not_ready' }); assert.equal(f.calls.length, 0); assert.equal(f.closes.length, existing ? 0 : 1); }
});
test('setup and cleanup exceptions expose only fixed safe codes', async () => {
  const f = fixture(); f.state.fail = 'create';
  await assert.rejects(f.fetcher(endpoint), error => error.code === 'local_transport_unavailable' && !String(error).includes('PRIVATE'));
  const g = fixture({ readiness: false }); g.state.fail = 'close';
  await assert.rejects(g.fetcher(endpoint), error => error.code === 'local_transport_not_ready' && error.cleanupFailed === true && error.cleanupErrors[0] === 'local_transport_document_cleanup_failed');
});
test('invalid target origins, credentials, fragments, methods and body types fail before document access', async () => {
  const f = fixture();
  for (const [url, request] of [['http://elsewhere.example/api/sub/x', {}], [endpoint + '#x', {}], ['http://u:p@127.0.0.1:38324/api/sub/x', {}], [endpoint, { method: 'DELETE' }], [endpoint, { body: {} }]]) await assert.rejects(f.fetcher(url, request), { code: 'local_transport_invalid_request' });
  assert.equal(f.creates.length, 0);
});
test('private request bodies travel only over the bound Port and never iframe configuration', async () => {
  const f = fixture(), body = JSON.stringify({ url: 'https://sub.example?token=PRIVATE-FIXTURE' });
  await f.fetcher(endpoint, { method: 'PATCH', body }); assert.equal(f.calls[0].body, body);
  assert.ok(!JSON.stringify(f.configurations).includes('PRIVATE-FIXTURE'));
});
test('GET POST PATCH transport loss never retries or recreates a document after send', async () => {
  for (const method of ['GET', 'POST', 'PATCH']) { const f = fixture({ backend: async () => { throw Error('PRIVATE-LOST'); } });
    await assert.rejects(f.fetcher(endpoint, { method }), { code: 'local_backend_request_failed' }); assert.equal(f.calls.length, 1); assert.equal(f.creates.length, 1); assert.equal(f.closes.length, 0); }
});
test('a disconnected binding is recovered only for a later explicit request', async () => {
  const f = fixture(); await f.fetcher(endpoint); f.state.port.disconnect(); await f.fetcher(endpoint);
  assert.equal(f.configurations.length, 2); assert.equal(f.creates.length, 1); assert.equal(f.calls.length, 2);
});
test('in-flight GET or PATCH disconnect clears rejected work and permits a fresh GET without replaying the original request', async () => {
  for (const method of ['GET', 'PATCH']) {
    const lost = deferred(); let requests = 0;
    const f = fixture({ backend: () => ++requests === 1 ? lost.promise : Promise.resolve(response) });
    const first = f.fetcher(endpoint, { method });
    const failed = assert.rejects(first, { code: 'local_backend_request_failed' });
    await tick(); assert.equal(f.calls.length, 1);
    const firstNonce = f.configurations[0].nonce;
    f.state.port.disconnect(); await failed;
    const recovered = await f.fetcher(endpoint);
    assert.equal(recovered.status, 200);
    assert.deepEqual(f.calls.map(call => call.method), [method, 'GET']);
    assert.notEqual(f.configurations[1].nonce, firstNonce);
    assert.equal(f.creates.length, 1, 'rebinds the existing hidden document');
    assert.equal(f.closes.length, 0, 'a dispatched request never causes cleanup/replay');
    if (method === 'PATCH') assert.equal(f.calls.filter(call => call.method === 'PATCH').length, 1);
    lost.resolve(response); await tick();
    assert.equal(f.calls.length, 2, 'a late old response cannot send more work');
  }
});
test('disconnect rejects all in-flight consumers and their old port cannot answer a new binding', async () => {
  const gate = deferred(); let requests = 0;
  const f = fixture({ backend: () => ++requests <= 2 ? gate.promise : Promise.resolve(response) });
  const first = f.fetcher(endpoint), second = f.fetcher(endpoint, { method: 'PATCH' });
  const failures = [assert.rejects(first, { code: 'local_backend_request_failed' }), assert.rejects(second, { code: 'local_backend_request_failed' })];
  await tick(); assert.equal(f.calls.length, 2); f.state.port.disconnect(); await Promise.all(failures);
  assert.equal((await f.fetcher(endpoint)).status, 200);
  assert.deepEqual(f.calls.map(call => call.method), ['GET', 'PATCH', 'GET']);
  gate.resolve(response); await tick(); assert.equal(f.calls.length, 3);
});
test('final asynchronous guard runs after readiness and blocks before send without losing its fixed error', async () => {
  const f = fixture(), guarded = createLocalFetcher(f.api, settings, { ...f.options, beforeSend: async () => { throw Object.assign(Error('candidate_superseded'), { code: 'candidate_superseded' }); } });
  await assert.rejects(guarded(endpoint), { code: 'candidate_superseded' }); assert.equal(f.calls.length, 0);
});
test('unknown guard failures are sanitized and malformed replies never become valid Responses', async () => {
  const f = fixture(); await assert.rejects(createLocalFetcher(f.api, settings, { ...f.options, beforeSend() { throw Error('PRIVATE'); } })(endpoint), { code: 'local_backend_request_failed' });
  for (const value of [{ ...response, ok: false }, { ...response, status: 0 }, { ...response, bodyText: null }, { ...response, contentType: 'bad\r\nheader' }]) {
    const g = fixture({ backend: async () => value }); await assert.rejects(g.fetcher(endpoint), error => ['local_backend_request_failed', 'local_transport_invalid_response'].includes(error.code)); }
});
test('HTTP errors and content types remain available to core validation', async () => {
  const f = fixture({ backend: async () => ({ ...response, status: 503, contentType: 'text/plain', bodyText: 'offline' }) });
  const result = await f.fetcher(endpoint); assert.equal(result.status, 503); assert.equal(await result.text(), 'offline');
});
test('an already aborted caller never creates a document', async () => {
  const f = fixture(), controller = new AbortController(); controller.abort();
  await assert.rejects(f.fetcher(endpoint, { signal: controller.signal }), { name: 'AbortError' }); assert.equal(f.creates.length, 0);
});
test('one aborted preparation consumer cannot close a document needed by another', async () => {
  const f = fixture(), gate = deferred(), controller = new AbortController(); f.state.createGate = gate.promise;
  const first = f.fetcher(endpoint, { signal: controller.signal }), rejected = assert.rejects(first, { name: 'AbortError' });
  const second = f.fetcher(endpoint); await tick(); controller.abort(); gate.resolve(); await rejected; await second;
  assert.equal(f.calls.length, 1); assert.equal(f.closes.length, 0);
});
test('abort during pending creation promptly rejects, then cleans its eventual unused document', async () => {
  const f = fixture(), gate = deferred(), controller = new AbortController(); f.state.createGate = gate.promise;
  const pending = f.fetcher(endpoint, { signal: controller.signal }), rejected = assert.rejects(pending, { name: 'AbortError' });
  await tick(); controller.abort(); await rejected; gate.resolve(); await tick(); await tick();
  assert.equal(f.calls.length, 0); assert.equal(f.closes.length, 1);
});
test('abort after PATCH dispatch never closes the in-flight frame or resends', async () => {
  const gate = deferred(), f = fixture({ backend: () => gate.promise }), controller = new AbortController();
  const pending = f.fetcher(endpoint, { method: 'PATCH', signal: controller.signal }), rejected = assert.rejects(pending, { name: 'AbortError' });
  await tick(); assert.equal(f.calls.length, 1); controller.abort(); await rejected; assert.equal(f.closes.length, 0);
  gate.resolve(response); await tick(); assert.equal(f.calls.length, 1);
});
test('configuration changes cannot replace a frame carrying an in-flight request', async () => {
  const gate = deferred(), f = fixture({ backend: () => gate.promise }), pending = f.fetcher(endpoint, { method: 'PATCH' }); await tick();
  const other = createLocalFetcher(f.api, { ...settings, frontendUrl: 'http://127.0.0.1:14123' }, f.options);
  await assert.rejects(other(endpoint), { code: 'local_transport_not_ready' }); assert.equal(f.configurations.length, 1);
  gate.resolve(response); await pending; await other(endpoint); assert.equal(f.configurations.length, 2);
});
