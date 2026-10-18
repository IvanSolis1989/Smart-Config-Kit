import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalFetcher } from './local-fetch.mjs';

const settings = {
  frontendUrl: 'http://127.0.0.1:14122', backendUrl: 'http://127.0.0.1:38324', subscriptionName: '良心云',
};
const endpoint = settings.backendUrl + '/api/sub/' + encodeURIComponent(settings.subscriptionName);
const response = { ok: true, status: 200, contentType: 'application/json', bodyText: '{"status":"success"}' };
const tick = () => new Promise(resolve => setImmediate(resolve));

function fixture({ stored, readiness = () => true, backend = async () => response } = {}) {
  const calls = [], creates = [], sleeps = [], live = new Set();
  let transportTab = stored;
  if (stored) live.add(stored.id);
  let nextId = 100;
  const api = {
    storage: { session: {
      async get(key) { assert.equal(key, 'transportTab'); return { transportTab }; },
      async set(value) { transportTab = structuredClone(value.transportTab); },
    } },
    tabs: {
      async create(options) { creates.push(structuredClone(options)); const id = nextId++; live.add(id); return { id }; },
      async sendMessage(id, message) {
        calls.push({ id, message: structuredClone(message) });
        if (!live.has(id)) throw new Error('PRIVATE-EXCEPTION');
        if (message.type === 'LOCAL_TRANSPORT_PING') {
          const ready = readiness(id, calls.filter(call => call.message.type === 'LOCAL_TRANSPORT_PING').length);
          return typeof ready === 'object' ? ready : { ready, origin: settings.frontendUrl };
        }
        return backend(id, message);
      },
    },
  };
  return { api, calls, creates, sleeps, live, stored: () => transportTab,
    fetcher: createLocalFetcher(api, settings, { sleep: async milliseconds => sleeps.push(milliseconds) }) };
}

test('concurrent fetches create exactly one inactive owned tab without needing Tab.url', async () => {
  const f = fixture();
  const results = await Promise.all([f.fetcher(endpoint), f.fetcher(endpoint), f.fetcher(endpoint)]);
  assert.equal(f.creates.length, 1);
  assert.deepEqual(f.creates[0], { url: settings.frontendUrl + '/?api=' + encodeURIComponent(settings.backendUrl), active: false });
  assert.deepEqual(f.stored(), { id: 100, frontendUrl: settings.frontendUrl, backendUrl: settings.backendUrl });
  assert.ok(results.every(result => result instanceof Response));
  assert.equal(f.calls.filter(call => call.message.type === 'LOCAL_BACKEND_REQUEST').length, 3);
});

test('an existing owned ready tab is reused, and a closed tab is recreated only during ping', async () => {
  const f = fixture({ stored: { id: 42, ...settings } });
  await f.fetcher(endpoint);
  assert.equal(f.creates.length, 0);
  f.live.delete(42);
  await f.fetcher(endpoint);
  assert.equal(f.creates.length, 1);
  assert.equal(f.calls.at(-1).id, 100);
});

test('a navigated existing tab fails ping and is replaced without navigating it', async () => {
  const f = fixture({ stored: { id: 42, ...settings }, readiness: id => ({ ready: true, origin: id === 42 ? 'https://wrong.example' : settings.frontendUrl }) });
  await f.fetcher(endpoint);
  assert.equal(f.creates.length, 1);
  assert.equal(f.calls.at(-1).id, 100);
});

test('new tab readiness retries have a finite budget, with no repeated creation or backend request', async () => {
  for (const ready of [false, { ready: true, origin: 'https://wrong.example' }]) {
    const f = fixture({ readiness: () => ready });
    await assert.rejects(f.fetcher(endpoint), { code: 'local_transport_not_ready' });
    assert.equal(f.creates.length, 1);
    assert.equal(f.calls.length, 20);
    assert.deepEqual(f.sleeps, Array(19).fill(150));
    assert.ok(f.calls.every(call => call.message.type === 'LOCAL_TRANSPORT_PING'));
  }
});

test('readiness can succeed after bounded loading retries', async () => {
  const f = fixture({ readiness: (_id, attempt) => attempt === 3 });
  await f.fetcher(endpoint);
  assert.deepEqual(f.sleeps, [150, 150]);
});

test('backend origin, credentials, fragments and unsupported methods fail before any tab access', async () => {
  const f = fixture();
  for (const url of ['https://private.example/?token=PRIVATE', 'http://127.0.0.1:38325/api/sub/x',
    'http://private:password@127.0.0.1:38324/api/sub/x', endpoint + '#PRIVATE', '/api/sub/x']) {
    await assert.rejects(f.fetcher(url), { code: 'local_transport_invalid_request' });
  }
  await assert.rejects(f.fetcher(endpoint, { method: 'DELETE' }), { code: 'local_transport_invalid_request' });
  assert.equal(f.creates.length, 0);
  assert.equal(f.calls.length, 0);
});

test('POST/PATCH bodies travel only through internal messages and never through tab URLs', async () => {
  const f = fixture();
  const body = JSON.stringify({ url: 'https://sub.example/?token=PRIVATE-CANDIDATE' });
  await f.fetcher(endpoint + '?target=JSON', { method: 'PATCH', body });
  const sent = f.calls.at(-1).message;
  assert.deepEqual(sent, { type: 'LOCAL_BACKEND_REQUEST', ...settings,
    path: '/api/sub/' + encodeURIComponent(settings.subscriptionName) + '?target=JSON', method: 'PATCH', body });
  assert.ok(!JSON.stringify(f.creates).includes('PRIVATE-CANDIDATE'));
});

test('GET/POST/PATCH transport loss never retries or recreates an owned tab after sending', async () => {
  for (const method of ['GET', 'POST', 'PATCH']) {
    const f = fixture({ backend: async () => { throw new Error('https://private.example/?token=PRIVATE-ERROR'); } });
    await assert.rejects(f.fetcher(endpoint, { method, ...(method === 'GET' ? {} : { body: '{}' }) }), error => {
      assert.equal(error.code, 'local_backend_request_failed');
      assert.equal(error.message, error.code);
      return true;
    });
    assert.equal(f.creates.length, 1);
    assert.equal(f.calls.filter(call => call.message.type === 'LOCAL_BACKEND_REQUEST').length, 1);
  }
});

test('bridge failures and malformed replies expose only fixed failure codes', async () => {
  const f = fixture({ backend: async () => ({ ok: false, code: 'PRIVATE-ERROR', bodyText: 'PRIVATE-BODY' }) });
  await assert.rejects(f.fetcher(endpoint), { code: 'local_backend_request_failed', message: 'local_backend_request_failed' });
  for (const reply of [{ ...response, status: 0 }, { ...response, bodyText: {} }, { ...response, contentType: 'text/plain\r\nPRIVATE' }]) {
    const malformed = fixture({ backend: async () => reply });
    await assert.rejects(malformed.fetcher(endpoint), { code: 'local_transport_invalid_response' });
  }
});

test('HTTP response status and content type are preserved for existing core checks', async () => {
  const f = fixture({ backend: async () => ({ ok: true, status: 403, contentType: 'text/plain', bodyText: 'Denied' }) });
  const result = await f.fetcher(endpoint);
  assert.equal(result.status, 403);
  assert.equal(result.ok, false);
  assert.equal(result.headers.get('content-type'), 'text/plain');
  assert.equal(await result.text(), 'Denied');
});

test('an already aborted request never creates a tab or sends a message', async () => {
  const f = fixture(); const controller = new AbortController(); controller.abort();
  await assert.rejects(f.fetcher(endpoint, { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(f.creates.length, 0); assert.equal(f.calls.length, 0);
});

test('abort races a pending backend call, removes its listener, and never resends', async () => {
  let complete;
  const f = fixture({ backend: () => new Promise(resolve => { complete = resolve; }) });
  const controller = new AbortController(); let adds = 0, removes = 0;
  const add = controller.signal.addEventListener.bind(controller.signal);
  const remove = controller.signal.removeEventListener.bind(controller.signal);
  controller.signal.addEventListener = (...args) => { adds++; add(...args); };
  controller.signal.removeEventListener = (...args) => { removes++; remove(...args); };
  const operation = f.fetcher(endpoint, { method: 'PATCH', body: '{}', signal: controller.signal });
  await tick(); controller.abort();
  await assert.rejects(operation, { name: 'AbortError' });
  assert.equal(adds, 1); assert.equal(removes, 1);
  complete(response); await tick();
  assert.equal(f.calls.filter(call => call.message.type === 'LOCAL_BACKEND_REQUEST').length, 1);
});

test('abort while a shared tab is preparing does not submit an abandoned backend request', async () => {
  let makeReady;
  const f = fixture({ readiness: () => false });
  const fetcher = createLocalFetcher(f.api, settings, { sleep: () => new Promise(resolve => { makeReady = resolve; }) });
  const controller = new AbortController();
  const operation = fetcher(endpoint, { signal: controller.signal });
  await tick(); controller.abort();
  await assert.rejects(operation, { name: 'AbortError' });
  // Finish readiness without retaining a stalled test operation.
  f.api.tabs.sendMessage = async (_id, message) => message.type === 'LOCAL_TRANSPORT_PING'
    ? { ready: true, origin: settings.frontendUrl } : response;
  makeReady(); await tick();
  assert.ok(f.calls.every(call => call.message.type === 'LOCAL_TRANSPORT_PING'));
});
