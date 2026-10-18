'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'local-transport.js'), 'utf8');
const FRONTEND = 'http://127.0.0.1:14122';
const BACKEND = 'http://127.0.0.1:38324';
const EXTENSION_ID = 'synthetic-extension-id';
const BACKGROUND_URL = `chrome-extension://${EXTENSION_ID}/background.js`;
const NAME = '良心云';
const SUB_PATH = '/api/sub/' + encodeURIComponent(NAME);
const PRIVATE_URL = 'https://subscription.example/api/v1/client/subscribe?token=PRIVATE-FIXTURE-TOKEN#flowDedup=account';
const LIMIT = 4 * 1024 * 1024;
const normalize = value => JSON.parse(JSON.stringify(value));

function request(extra = {}) {
  return { type: 'LOCAL_BACKEND_REQUEST', frontendUrl: FRONTEND, backendUrl: BACKEND, subscriptionName: NAME, path: SUB_PATH, method: 'GET', ...extra };
}

test('only the explicitly bound snapshot name permits local preview and a content-only patch', async () => {
  const f = fixture(), name = '都是梦', path = '/api/sub/' + encodeURIComponent(name);
  for (const input of [request({subscriptionName:name,path,method:'PATCH',body:JSON.stringify({content:'{"proxies":[]}'})}),
    request({subscriptionName:name,path:'/api/preview/sub?target=JSON',method:'POST',body:JSON.stringify({name,source:'local',url:'',content:'{"proxies":[]}'})})]) {
    assert.equal((await f.send(input)).value.ok,true);
  }
  for (const input of [request({method:'PATCH',body:JSON.stringify({content:'secret'})}),
    request({subscriptionName:name,path,method:'PATCH',body:JSON.stringify({content:'secret',url:''})}),
    request({subscriptionName:name,path,method:'PATCH',body:JSON.stringify({content:''})})]) {
    assert.equal((await f.send(input)).value.code,'local_transport_invalid_request');
  }
  assert.equal(f.calls.length,2);
});

function fixture({ origin = FRONTEND, iframe = true, parentOrigin = 'chrome-extension://' + EXTENSION_ID, bind = true, responder = null } = {}) {
  const listeners = [];
  const calls = [];
  const timers = new Map();
  const logs = [];
  const handshakes = [], bindingListeners = [];
  const replies = new Map();
  let requestId = 0;
  let nextTimer = 1;
  const window = {
    location: { origin, ancestorOrigins: [parentOrigin] },
    parent: {},
    addEventListener(type, listener) { assert.equal(type, 'message'); bindingListeners.push(listener); },
    setTimeout(callback, delay) { const id = nextTimer++; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  window.top = iframe ? {} : window;
  const forbidden = () => { throw new Error('forbidden account/storage/DOM access'); };
  for (const key of ['localStorage', 'sessionStorage', 'document', 'cookie']) Object.defineProperty(window, key, { get: forbidden });
  const chrome = {
    runtime: {
      id: EXTENSION_ID,
      getURL: file => `chrome-extension://${EXTENSION_ID}/${file}`,
      connect({ name }) {
        assert.equal(name, 'scki-local-offscreen-v1');
        return { onMessage: { addListener(listener) { listeners.push(listener); } }, postMessage(message) {
          if (message.type === 'LOCAL_TRANSPORT_HELLO') { handshakes.push(normalize(message)); return; }
          const value = { ...message }; delete value.type; delete value.requestId;
          replies.get(message.requestId)?.(value); replies.delete(message.requestId);
        } };
      },
    },
  };
  Object.defineProperty(chrome, 'storage', { get: forbidden });
  const fetch = async (url, options) => {
    calls.push({ url, options });
    return responder ? responder(url, options) : new Response(JSON.stringify({ status: 'success', data: { fixture: true } }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  };
  const context = vm.createContext({ window, chrome, URL, fetch, AbortController, TextDecoder, TextEncoder, Uint8Array,
    console: Object.fromEntries(['log', 'warn', 'error', 'info', 'debug'].map(name => [name, (...args) => logs.push(args)])) });
  for (const key of ['localStorage', 'sessionStorage', 'document', 'cookie']) Object.defineProperty(context, key, { get: forbidden });
  function install() { vm.runInContext(source, context, { filename: 'local-transport.js' }); }
  function invoke(message) {
    if (!listeners.length) return { keepAlive: false, result: Promise.resolve(undefined) };
    let respond;
    const result = new Promise(resolve => { respond = resolve; });
    const id = ++requestId;
    replies.set(id, respond);
    const keepAlive = message.type === 'LOCAL_BACKEND_REQUEST';
    listeners[0]({ ...message, requestId: id });
    return { keepAlive, result: keepAlive === true ? result : Promise.resolve(undefined) };
  }
  async function send(message, sender) {
    const pending = invoke(message, sender);
    let timer;
    try {
      const result = await Promise.race([pending.result, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('transport callback timed out')), 2000); })]);
      return { keepAlive: pending.keepAlive, value: result === undefined ? undefined : normalize(result) };
    } finally { clearTimeout(timer); }
  }
  install();
  function bindFrame(extra = {}, event = {}) { for (const listener of bindingListeners) listener({ source: window.parent,
    origin: 'chrome-extension://' + EXTENSION_ID, data: { type: 'BIND_LOCAL_OFFSCREEN', frontendUrl: FRONTEND, backendUrl: BACKEND, nonce: 'a'.repeat(64), ...extra }, ...event }); }
  if (bind) bindFrame();
  return { window, context, chrome, calls, timers, logs, listeners, handshakes, bindFrame, install, invoke, send };
}

test('binding requires the extension parent and reports the nonce without a fetch', async () => {
  const f = fixture();
  assert.deepEqual(f.handshakes, [{ type: 'LOCAL_TRANSPORT_HELLO', nonce: 'a'.repeat(64) }]);
  assert.equal(f.calls.length, 0);
  assert.equal(f.timers.size, 0);
});

test('valid GET, preview and url-only PATCH use natural Origin and exact JSON transport options', async () => {
  const f = fixture();
  const preview = JSON.stringify({ name: NAME, source: 'remote', url: PRIVATE_URL,
    process: [{ type: 'Script Operator', args: { content: 'fixture-keep' } }], noCache: true });
  const patchBody = JSON.stringify({ url: PRIVATE_URL });
  const inputs = [request(), request({ path: '/api/preview/sub?target=JSON', method: 'POST', body: preview }), request({ method: 'PATCH', body: patchBody })];
  for (const input of inputs) {
    const result = await f.send(input, { id: EXTENSION_ID, url: BACKGROUND_URL });
    assert.equal(result.keepAlive, true);
    assert.equal(result.value.ok, true);
    assert.equal(result.value.status, 200);
    assert.equal(result.value.contentType, 'application/json; charset=utf-8');
    assert.deepEqual(JSON.parse(result.value.bodyText), { status: 'success', data: { fixture: true } });
  }
  assert.equal(f.calls.length, 3);
  for (let index = 0; index < inputs.length; index += 1) {
    const { url, options } = f.calls[index];
    assert.equal(url, BACKEND + inputs[index].path);
    assert.deepEqual(options.headers && normalize(options.headers), inputs[index].body === undefined ? undefined : { 'Content-Type': 'application/json' });
    assert.equal(Object.keys(options.headers || {}).some(key => key.toLowerCase() === 'origin'), false);
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.method, inputs[index].method);
    assert.equal(options.body, inputs[index].body);
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.signal.aborted, false);
  }
  assert.equal(f.timers.size, 0);
  assert.equal(f.window.location.origin, FRONTEND);
  assert.equal(f.logs.length, 0);
});

test('other websites, HTTPS local pages, top-level tabs and unrelated parents never bind', async () => {
  for (const options of [{ origin: 'https://evil.example' }, { origin: 'https://127.0.0.1:14122' }, { origin: 'http://localhost:14122' }, { origin: 'http://127.0.0.2:14122' }, { iframe: false }, { parentOrigin: 'https://evil.example' }]) {
    const f = fixture(options);
    assert.equal(f.listeners.length, 0);
    assert.equal((await f.send(request())).keepAlive, false);
    assert.equal(f.calls.length, 0);
  }
});

test('wrong parent window, page origin, nonce, endpoint or unrelated handshake cannot bind', async () => {
  for (const [extra, event] of [[{}, { source: {} }], [{}, { origin: 'http://127.0.0.1:14122' }], [{ nonce: 'bad' }, {}],
    [{ frontendUrl: 'http://127.0.0.1:14123' }, {}], [{ backendUrl: 'https://evil.example' }, {}], [{ type: 'OTHER' }, {}]]) {
    const f = fixture({ bind: false }); f.bindFrame(extra, event); assert.equal(f.listeners.length, 0); assert.equal(f.calls.length, 0);
  }
  const f = fixture();
  assert.deepEqual(await f.send({ type: 'OTHER' }), { keepAlive: false, value: undefined });
  assert.equal(f.calls.length, 0);
  assert.equal(f.timers.size, 0);
});

test('frontend must be the exact current local origin with an explicit port and no path or secrets', async () => {
  const f = fixture();
  for (const frontendUrl of [undefined, 'http://127.0.0.1', 'http://127.0.0.1:0', 'http://127.0.0.1:65536', 'http://127.0.0.1:14123', 'http://127.0.0.1:14122/path', FRONTEND + '?token=PRIVATE-FIXTURE-TOKEN', FRONTEND + '#x', 'http://user:pass@127.0.0.1:14122', 'https://127.0.0.1:14122', 'http://localhost:14122']) {
    const result = await f.send(request({ frontendUrl }));
    assert.deepEqual(result.value, { ok: false, code: 'local_transport_invalid_frontend' });
  }
  assert.equal(f.calls.length, 0);
});

test('backend must be exact HTTP loopback with an explicit valid port and no path or secrets', async () => {
  const f = fixture();
  for (const backendUrl of [undefined, 'http://127.0.0.1', 'http://127.0.0.1:0', 'http://127.0.0.1:65536', 'https://127.0.0.1:38324', 'http://localhost:38324', 'http://127.0.0.2:38324', 'http://external.example:38324', BACKEND + '/api', BACKEND + '?x=1', BACKEND + '#x', 'http://user:pass@127.0.0.1:38324']) {
    assert.deepEqual((await f.send(request({ backendUrl }))).value, { ok: false, code: 'local_transport_invalid_backend' });
  }
  assert.equal(f.calls.length, 0);
});

test('only the exact subscription GET/PATCH and JSON preview route are allowed', async () => {
  const f = fixture();
  for (const extra of [
    { path: '/api/subs', method: 'PATCH', body: '{}' }, { path: '/api/collections' }, { path: '/api/sub/other' },
    { path: SUB_PATH + '?all=true' }, { path: '/api/sub/../subs' },
    { path: '/api/preview/sub?target=ClashMeta', method: 'POST', body: '{}' },
    { path: '/api/preview/sub?target=JSON&all=true', method: 'POST', body: '{}' },
    { method: 'DELETE' }, { method: 'POST' }, { method: 'get' }, { method: undefined },
    { path: 'https://external.example/api/sub/x' }, { path: '//external.example/api/sub/x' },
    { body: '{}' },
    { subscriptionName: '.', path: '/api/sub/.' },
    { subscriptionName: '..', path: '/api/sub/..' },
  ]) assert.deepEqual((await f.send(request(extra))).value, { ok: false, code: 'local_transport_invalid_request' });
  assert.equal(f.calls.length, 0);
});

test('subscription names are nonempty bounded strings without control characters', async () => {
  const f = fixture();
  for (const subscriptionName of [undefined, 23, '', '  ', 'x'.repeat(101), NAME + '\n', NAME + '\u0000', NAME + '\u007f', '\ud800']) {
    assert.deepEqual((await f.send(request({ subscriptionName }))).value, { ok: false, code: 'local_transport_invalid_request' });
  }
  assert.equal(f.calls.length, 0);
});

test('PATCH permits exactly one HTTPS url field and rejects non-string, malformed or privileged bodies', async () => {
  const f = fixture();
  for (const body of [undefined, {}, 'invalid-json', 'null', '[]', '{}', JSON.stringify({ name: NAME, url: PRIVATE_URL }), JSON.stringify({ url: PRIVATE_URL, process: [] }),
    ...[undefined, 4, '', 'ftp://subscription.example/', 'https:subscription.example', 'https://user:pass@subscription.example/', PRIVATE_URL + '\nhttps://other.example/', 'https://subscription.example/' + 'x'.repeat(8192)].map(url => JSON.stringify({ url }))]) {
    assert.deepEqual((await f.send(request({ method: 'PATCH', body }))).value, { ok: false, code: 'local_transport_invalid_request' });
  }
  assert.equal(f.calls.length, 0);
});

test('preview requires the exact remote subscription identity and one valid HTTPS url', async () => {
  const f = fixture();
  for (const body of [undefined, {}, 'invalid-json', 'null', '[]', '{}', JSON.stringify({ name: 'other', source: 'remote', url: PRIVATE_URL }), JSON.stringify({ name: NAME, source: 'local', url: PRIVATE_URL }), JSON.stringify({ name: NAME, source: 'remote', url: [PRIVATE_URL] }), JSON.stringify({ name: NAME, source: 'remote', url: 'ftp://subscription.example/' })]) {
    assert.deepEqual((await f.send(request({ method: 'POST', path: '/api/preview/sub?target=JSON', body }))).value, { ok: false, code: 'local_transport_invalid_request' });
  }
  assert.equal(f.calls.length, 0);
});

test('declared oversized response is cancelled and returned as a fixed error', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ cancel() { cancelled = true; } });
  const f = fixture({ responder: async () => new Response(stream, { headers: { 'Content-Length': String(LIMIT + 1) } }) });
  assert.deepEqual((await f.send(request())).value, { ok: false, code: 'backend_response_too_large' });
  assert.equal(cancelled, true);
  assert.equal(f.timers.size, 0);
});

test('streaming limit is enforced independently of Content-Length and cancels the stream', async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(LIMIT)); controller.enqueue(new Uint8Array(1)); },
    cancel() { cancelled = true; },
  });
  const f = fixture({ responder: async () => new Response(stream, { headers: { 'Content-Length': '1' } }) });
  assert.deepEqual((await f.send(request())).value, { ok: false, code: 'backend_response_too_large' });
  assert.equal(cancelled, true);
  assert.equal(f.timers.size, 0);
});

test('exactly 4 MiB is accepted and non-2xx HTTP responses retain status for the background validator', async () => {
  const f = fixture({ responder: async () => new Response('x'.repeat(LIMIT), { status: 503, headers: { 'Content-Type': 'text/plain' } }) });
  const pending = f.invoke(request());
  assert.equal(pending.keepAlive, true);
  const result = await pending.result;
  assert.equal(result.ok, true);
  assert.equal(result.status, 503);
  assert.equal(result.contentType, 'text/plain');
  assert.equal(result.bodyText.length, LIMIT);
  assert.equal(f.timers.size, 0);
});

test('fetch and response-stream errors have fixed codes with no private exception text or logging', async () => {
  for (const responder of [async () => { throw new Error(PRIVATE_URL); }, async () => new Response(new ReadableStream({ start(controller) { controller.error(new Error(PRIVATE_URL)); } }))]) {
    const f = fixture({ responder });
    const result = await f.send(request());
    assert.deepEqual(result.value, { ok: false, code: 'backend_unavailable' });
    assert.equal(JSON.stringify(result).includes('PRIVATE-FIXTURE-TOKEN'), false);
    assert.equal(f.logs.length, 0);
    assert.equal(f.timers.size, 0);
  }
});

test('23-second controller abort covers the fetch and returns a private-safe timeout', async () => {
  const f = fixture({ responder: (_url, options) => new Promise((_, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException(PRIVATE_URL, 'AbortError')), { once: true });
  }) });
  const pending = f.invoke(request());
  assert.equal(pending.keepAlive, true);
  assert.equal(f.calls.length, 1);
  assert.equal(f.timers.size, 1);
  const timer = [...f.timers.values()][0];
  assert.equal(timer.delay, 23000);
  assert.equal(f.calls[0].options.signal.aborted, false);
  timer.callback();
  assert.deepEqual(normalize(await pending.result), { ok: false, code: 'backend_timeout' });
  assert.equal(f.calls[0].options.signal.aborted, true);
  assert.equal(f.timers.size, 0);
  assert.equal(f.logs.length, 0);
});

test('installation and repeated binding never read cookies/storage/DOM state or start requests, and are idempotent', async () => {
  const f = fixture();
  f.install();
  assert.equal(f.listeners.length, 1);
  assert.equal(f.calls.length, 0);
  f.bindFrame();
  assert.equal(f.calls.length, 0);
  assert.equal(f.logs.length, 0);
  assert.equal(f.timers.size, 0);
});

test('automatic matching may read catalog but only exact single-source mutations remain permitted', async () => {
  const f = fixture();
  assert.equal((await f.send(request({path:'/api/subs'}))).value.ok,true);
  assert.equal(f.calls[0].url,BACKEND+'/api/subs');
  const ipURL='http://192.0.2.10:8080/sub?token=FIXTURE';
  assert.equal((await f.send(request({method:'PATCH',body:JSON.stringify({url:ipURL})}))).value.ok,true);
  assert.equal(f.calls[1].options.body,JSON.stringify({url:ipURL}));
});
