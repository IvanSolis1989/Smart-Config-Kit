import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalFetcher } from './local-fetch.mjs';

const settings = {
  frontendUrl: 'http://127.0.0.1:14122', backendUrl: 'http://127.0.0.1:38324', subscriptionName: '良心云',
};
const endpoint = settings.backendUrl + '/api/sub/' + encodeURIComponent(settings.subscriptionName);
const response = { ok: true, status: 200, contentType: 'application/json', bodyText: '{"status":"success"}' };
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function rejection(operation) {
  try { await operation; assert.fail('expected rejection'); }
  catch (error) { return error; }
}

function fixture({ stored, readiness = () => true, backend = async () => response } = {}) {
  const calls = [], creates = [], removals = [], sleeps = [], live = new Set();
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
      async remove(id) { removals.push(id); live.delete(id); },
      async sendMessage(id, message) {
        calls.push({ id, message: structuredClone(message) });
        if (!live.has(id)) throw new Error('PRIVATE-EXCEPTION');
        if (message.type === 'LOCAL_TRANSPORT_PING') {
          const ready = await readiness(id, calls.filter(call => call.message.type === 'LOCAL_TRANSPORT_PING').length);
          return typeof ready === 'object' ? ready : { ready, origin: settings.frontendUrl };
        }
        return backend(id, message);
      },
    },
  };
  return { api, calls, creates, removals, sleeps, live, stored: () => transportTab,
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

test('separate fetcher instances share preparation while preserving each subscription name', async () => {
  const f = fixture();
  const second = createLocalFetcher({ storage: f.api.storage, tabs: { ...f.api.tabs } }, {
    ...settings, subscriptionName: 'Example second',
  });
  await Promise.all([f.fetcher(endpoint), second(endpoint)]);
  assert.equal(f.creates.length, 1);
  assert.deepEqual(f.calls.filter(call => call.message.type === 'LOCAL_BACKEND_REQUEST')
    .map(call => call.message.subscriptionName), [settings.subscriptionName, 'Example second']);
  assert.deepEqual(f.removals, []);
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
  assert.deepEqual(f.removals, []);
  assert.equal(f.live.has(42), true);
});

test('new tab readiness retries have a finite budget, with no repeated creation or backend request', async () => {
  for (const ready of [false, { ready: true, origin: 'https://wrong.example' }]) {
    const f = fixture({ readiness: () => ready });
    await assert.rejects(f.fetcher(endpoint), { code: 'local_transport_not_ready' });
    assert.equal(f.creates.length, 1);
    assert.equal(f.calls.length, 20);
    assert.deepEqual(f.sleeps, Array(19).fill(150));
    assert.ok(f.calls.every(call => call.message.type === 'LOCAL_TRANSPORT_PING'));
    assert.deepEqual(f.removals, [100]);
    assert.equal(f.live.size, 0);
    assert.equal(f.stored(), null);
  }
});

test('failed tab storage setup closes the created tab and clears only its own record', async () => {
  const f = fixture();
  const set = f.api.storage.session.set;
  f.api.storage.session.set = async value => {
    await set(value);
    if (value.transportTab) throw new Error('PRIVATE-STORAGE-ERROR');
  };
  await assert.rejects(f.fetcher(endpoint), { code: 'local_transport_storage_failed' });
  assert.deepEqual(f.removals, [100]);
  assert.equal(f.live.size, 0);
  assert.equal(f.stored(), null);
});

test('a rejected setup write cannot clear the older saved record or close its tab', async () => {
  const saved = { id: 42, ...settings };
  const f = fixture({ stored: saved, readiness: () => false });
  f.api.storage.session.set = async () => { throw new Error('PRIVATE-STORAGE-ERROR'); };
  await assert.rejects(f.fetcher(endpoint), { code: 'local_transport_storage_failed' });
  assert.deepEqual(f.removals, [100]);
  assert.deepEqual(f.stored(), saved);
  assert.deepEqual([...f.live], [42]);
});

test('successive read-only retries do not accumulate offline frontend tabs', async () => {
  const f = fixture({ readiness: () => false });
  for (let attempt = 0; attempt < 3; attempt++) {
    await assert.rejects(f.fetcher(endpoint), { code: 'local_transport_not_ready' });
    assert.equal(f.live.size, 0);
    assert.equal(f.stored(), null);
  }
  assert.equal(f.creates.length, 3);
  assert.deepEqual(f.removals, [100, 101, 102]);
});

test('shared readiness failure removes the new tab exactly once and preserves a saved tab', async () => {
  const saved = { id: 42, ...settings };
  const f = fixture({ stored: saved, readiness: () => false });
  const results = await Promise.allSettled([f.fetcher(endpoint), f.fetcher(endpoint)]);
  assert.ok(results.every(result => result.status === 'rejected' && result.reason.code === 'local_transport_not_ready'));
  assert.deepEqual(f.removals, [100]);
  assert.deepEqual([...f.live], [42]);
  assert.equal(f.stored(), null);
});

test('cleanup preserves a newer transport record installed while the old tab is removed', async () => {
  const f = fixture({ readiness: () => false });
  const replacement = { id: 777, frontendUrl: settings.frontendUrl, backendUrl: settings.backendUrl };
  const remove = f.api.tabs.remove;
  f.api.tabs.remove = async id => {
    await remove(id);
    f.live.add(replacement.id);
    await f.api.storage.session.set({ transportTab: replacement });
  };
  await assert.rejects(f.fetcher(endpoint), { code: 'local_transport_not_ready' });
  assert.deepEqual(f.removals, [100]);
  assert.deepEqual(f.stored(), replacement);
  assert.deepEqual([...f.live], [777]);
});

test('cleanup errors preserve the primary code and expose only fixed safe details', async () => {
  const f = fixture({ readiness: () => false });
  const get = f.api.storage.session.get;
  let reads = 0;
  f.api.storage.session.get = async key => {
    if (++reads > 1) throw new Error('PRIVATE-STORAGE-ERROR');
    return get(key);
  };
  f.api.tabs.remove = async () => { throw new Error('PRIVATE-TAB-ERROR'); };
  const error = await rejection(f.fetcher(endpoint));
  assert.equal(error.code, 'local_transport_not_ready');
  assert.equal(error.message, error.code);
  assert.equal(error.cleanupFailed, true);
  assert.deepEqual(error.cleanupErrors, ['local_transport_tab_cleanup_failed', 'local_transport_storage_cleanup_failed']);
  assert.ok(!JSON.stringify(error).includes('PRIVATE'));
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
    assert.deepEqual(f.removals, []);
    assert.equal(f.live.size, 1);
  }
});

test('known pre-dispatch guard failures retain their identity without reaching the backend', async () => {
  for (const code of ['site_not_trusted', 'site_permission_required', 'site_access_changed', 'disabled',
    'site_script_registration_failed', 'candidate_superseded', 'document_changed']) {
    let backendCalls = 0, guardCalls = 0;
    const f = fixture({ backend: async () => { backendCalls++; return response; } });
    const sendMessage = f.api.tabs.sendMessage;
    const guarded = Object.assign(new Error(code), { code });
    f.api.tabs.sendMessage = async (id, message) => {
      if (message.type === 'LOCAL_BACKEND_REQUEST') { guardCalls++; throw guarded; }
      return sendMessage(id, message);
    };
    const error = await rejection(f.fetcher(endpoint, { method: 'PATCH', body: '{}' }));
    assert.equal(error, guarded);
    assert.equal(guardCalls, 1);
    assert.equal(backendCalls, 0);
    assert.equal(f.creates.length, 1);
    assert.deepEqual(f.removals, []);
    assert.equal(f.live.size, 1);
  }
});

test('unknown guard exceptions, strings and lookalike objects expose only a fixed transport code', async () => {
  for (const unknown of [new Error('PRIVATE-CHROME-ERROR'), 'PRIVATE-STRING', { code: 'disabled', message: 'disabled' },
    Object.assign(new Error('PRIVATE-MESSAGE'), { code: 'disabled' })]) {
    const f = fixture();
    const sendMessage = f.api.tabs.sendMessage;
    f.api.tabs.sendMessage = async (id, message) => {
      if (message.type === 'LOCAL_BACKEND_REQUEST') throw unknown;
      return sendMessage(id, message);
    };
    const error = await rejection(f.fetcher(endpoint));
    assert.equal(error.code, 'local_backend_request_failed');
    assert.equal(error.message, error.code);
    assert.notEqual(error, unknown);
    assert.ok(!JSON.stringify(error).includes('PRIVATE'));
    assert.equal(f.creates.length, 1);
    assert.deepEqual(f.removals, []);
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
  assert.deepEqual(f.removals, []);
  assert.equal(f.live.size, 1);
});

test('abort while a shared tab is preparing does not submit an abandoned backend request', async () => {
  let makeReady;
  const f = fixture({ readiness: () => false });
  const fetcher = createLocalFetcher(f.api, settings, { sleep: () => new Promise(resolve => { makeReady = resolve; }) });
  const controller = new AbortController();
  const operation = fetcher(endpoint, { signal: controller.signal });
  await tick(); controller.abort();
  const error = await rejection(operation);
  assert.equal(error.name, 'AbortError');
  assert.deepEqual(await error.cleanup, { ok: true, errors: [] });
  assert.deepEqual(f.removals, [100]);
  assert.equal(f.stored(), null);
  assert.equal(f.live.size, 0);
  // Finish readiness without retaining a stalled test operation.
  f.api.tabs.sendMessage = async (_id, message) => message.type === 'LOCAL_TRANSPORT_PING'
    ? { ready: true, origin: settings.frontendUrl } : response;
  makeReady(); await tick();
  assert.ok(f.calls.every(call => call.message.type === 'LOCAL_TRANSPORT_PING'));
});

test('one aborted consumer cannot close a shared preparation used by another', async () => {
  const ready = deferred();
  const f = fixture({ readiness: () => ready.promise });
  const controller = new AbortController();
  const first = f.fetcher(endpoint, { signal: controller.signal });
  const second = createLocalFetcher(f.api, settings)(endpoint);
  await tick(); controller.abort();
  const error = await rejection(first);
  assert.equal(error.name, 'AbortError');
  assert.deepEqual(await error.cleanup, { ok: true, errors: [] });
  ready.resolve(true);
  await second;
  assert.equal(f.creates.length, 1);
  assert.deepEqual(f.removals, []);
  assert.equal(f.calls.filter(call => call.message.type === 'LOCAL_BACKEND_REQUEST').length, 1);
});

test('abort during a saved tab ping neither removes nor clears that saved tab', async () => {
  const ready = deferred();
  const saved = { id: 42, ...settings };
  const f = fixture({ stored: saved, readiness: () => ready.promise });
  const controller = new AbortController();
  const operation = f.fetcher(endpoint, { signal: controller.signal });
  await tick(); controller.abort();
  const error = await rejection(operation);
  assert.equal(error.name, 'AbortError');
  await error.cleanup;
  assert.deepEqual(f.removals, []);
  assert.deepEqual(f.stored(), saved);
  assert.deepEqual([...f.live], [42]);
  ready.resolve(true);
  await tick();
  assert.equal(f.calls.filter(call => call.message.type === 'LOCAL_BACKEND_REQUEST').length, 0);
});

test('abort during creation closes its eventual tab before a replacement preparation starts', async () => {
  const created = deferred();
  const f = fixture();
  const create = f.api.tabs.create;
  let first = true;
  f.api.tabs.create = async options => {
    const tab = await create(options);
    if (first) { first = false; await created.promise; }
    return tab;
  };
  const controller = new AbortController();
  const operation = f.fetcher(endpoint, { signal: controller.signal });
  await tick(); controller.abort();
  const error = await rejection(operation);
  assert.equal(error.name, 'AbortError');
  assert.equal(f.creates.length, 1);
  const next = createLocalFetcher(f.api, settings)(endpoint);
  await tick();
  assert.equal(f.creates.length, 1);
  created.resolve();
  assert.deepEqual(await error.cleanup, { ok: true, errors: [] });
  await next;
  assert.equal(f.creates.length, 2);
  assert.deepEqual(f.removals, [100]);
  assert.deepEqual([...f.live], [101]);
  assert.equal(f.stored().id, 101);
  assert.equal(f.calls.filter(call => call.message.type === 'LOCAL_BACKEND_REQUEST').length, 1);
});

test('abort waits for an in-progress storage write before conditionally clearing its record', async () => {
  const writing = deferred();
  const f = fixture();
  const set = f.api.storage.session.set;
  f.api.storage.session.set = async value => {
    if (value.transportTab) await writing.promise;
    await set(value);
  };
  const controller = new AbortController();
  const operation = f.fetcher(endpoint, { signal: controller.signal });
  await tick(); controller.abort();
  const error = await rejection(operation);
  assert.equal(error.name, 'AbortError');
  assert.equal(f.live.size, 1);
  writing.resolve();
  assert.deepEqual(await error.cleanup, { ok: true, errors: [] });
  assert.deepEqual(f.removals, [100]);
  assert.equal(f.stored(), null);
  assert.equal(f.calls.filter(call => call.message.type === 'LOCAL_BACKEND_REQUEST').length, 0);
});

test('all aborted preparation consumers share one eventual cleanup', async () => {
  const ready = deferred();
  const f = fixture({ readiness: () => ready.promise });
  const first = new AbortController(), second = new AbortController();
  const a = f.fetcher(endpoint, { signal: first.signal });
  const b = createLocalFetcher(f.api, settings)(endpoint, { signal: second.signal });
  await tick(); first.abort(); second.abort();
  const errors = await Promise.all([rejection(a), rejection(b)]);
  assert.ok(errors.every(error => error.name === 'AbortError'));
  await Promise.all(errors.map(error => error.cleanup));
  assert.equal(f.creates.length, 1);
  assert.deepEqual(f.removals, [100]);
  assert.equal(f.stored(), null);
  assert.equal(f.live.size, 0);
  assert.equal(f.calls.filter(call => call.message.type === 'LOCAL_BACKEND_REQUEST').length, 0);
  ready.resolve(true);
});

test('abort cleanup failures have a safe awaitable receipt without changing AbortError', async () => {
  const ready = deferred();
  const f = fixture({ readiness: () => ready.promise });
  f.api.tabs.remove = async () => { throw new Error('PRIVATE-TAB-ERROR'); };
  const controller = new AbortController();
  const operation = f.fetcher(endpoint, { signal: controller.signal });
  await tick(); controller.abort();
  const error = await rejection(operation);
  assert.equal(error.name, 'AbortError');
  assert.deepEqual(await error.cleanup, { ok: false, errors: ['local_transport_tab_cleanup_failed'] });
  assert.equal(error.cleanupFailed, true);
  assert.deepEqual(error.cleanupErrors, ['local_transport_tab_cleanup_failed']);
  assert.ok(!JSON.stringify(error).includes('PRIVATE'));
  ready.resolve(true);
});
