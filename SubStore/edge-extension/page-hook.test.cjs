'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const extractorSource = fs.readFileSync(path.join(__dirname, 'extractors.js'), 'utf8');
const hookSource = fs.readFileSync(path.join(__dirname, 'page-hook.js'), 'utf8');
const bridgeSource = fs.readFileSync(path.join(__dirname, 'bridge.js'), 'utf8');
const PAGE_ORIGIN = 'https://xn--9kqz23b19z.com';
const TARGET = 'https://apiweb.liangxin.xyz/api/v1/user/getSubscribe';
const SOURCE = 'scki-substore-link-v2';
const CANDIDATE = 'https://subscription.example.com/api/v1/client/subscribe?token=PRIVATE-FIXTURE-TOKEN#udp=true';
const CONTROL_SELECTOR = '[data-clipboard-text], [data-clipboard], [data-subscribe-url], input, textarea, rb-text-field, a[href]';
const observed = (candidateUrl = CANDIDATE, siteNames = []) => ({ type: 'OBSERVED_SUBSCRIPTION', candidateUrl, siteNames });

function normalized(value) {
  return JSON.parse(JSON.stringify(value));
}

function mockResponse({ url = TARGET, status = 200, payload = { data: { subscribe_url: CANDIDATE } }, cloneError = null, jsonError = null } = {}) {
  let consumed = false;
  let clones = 0;
  const response = {
    url, status,
    get bodyUsed() { return consumed; },
    get cloneCount() { return clones; },
    clone() {
      if (cloneError) throw cloneError;
      clones += 1;
      return { json: () => jsonError ? Promise.reject(jsonError) : Promise.resolve(normalized(payload)) };
    },
    json() {
      consumed = true;
      return Promise.resolve(payload);
    },
  };
  return response;
}

function emptyDocument() {
  return { title: '', visibilityState: 'visible', addEventListener() {}, querySelectorAll() { return []; } };
}

// This shared context covers response and message contracts only. Real MAIN /
// ISOLATED injection is covered by the separate browser end-to-end fixture.
function fixture({ response = mockResponse(), fetchImpl = null, origin = PAGE_ORIGIN, sendMessage = null, document = emptyDocument(), contextReply = { allowed: true } } = {}) {
  const eventHandlers = new Map();
  const messages = [];
  const backgroundMessages = [];
  const statusMessages = [];
  const runtimeListeners = [];
  const timers = [];
  const intervals = [];
  const consoleCalls = [];
  const fetchCalls = [];
  const promise = Promise.resolve(response);
  const originalFetch = fetchImpl || function (...args) { fetchCalls.push({ receiver: this, args }); return promise; };

  class FakeXHR {
    static DONE = 4;
    constructor() {
      this.listeners = new Map();
      this.responseURL = '';
      this.responseType = '';
      this.status = 0;
    }
    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) || [];
      listeners.push(listener);
      this.listeners.set(type, listeners);
    }
    open(...args) { this.openArguments = args; return 'original-open-result'; }
    send(...args) { this.sendArguments = args; return 'original-send-result'; }
    finish({ url = TARGET, status = 200, type = '', payload = { data: { subscribe_url: CANDIDATE } }, text = null } = {}) {
      this.responseURL = url;
      this.responseType = type;
      this.status = status;
      this.response = payload;
      this.responseText = text === null ? JSON.stringify(payload) : text;
      for (const listener of this.listeners.get('load') || []) listener.call(this, { type: 'load' });
    }
  }

  const window = {
    location: { origin },
    fetch: originalFetch,
    XMLHttpRequest: FakeXHR,
    addEventListener(type, listener) {
      const listeners = eventHandlers.get(type) || [];
      listeners.push(listener);
      eventHandlers.set(type, listeners);
    },
    postMessage(data, targetOrigin) {
      messages.push({ data: normalized(data), targetOrigin });
      if (targetOrigin !== window.location.origin) return;
      window.dispatchMessage({ data, source: window, origin: window.location.origin });
    },
    dispatchMessage(event) {
      for (const listener of eventHandlers.get('message') || []) listener(event);
    },
    setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length; },
    setInterval(callback, delay) { intervals.push({ callback, delay, cleared: false }); return intervals.length; },
    clearInterval(id) { intervals[id - 1].cleared = true; },
  };
  const chrome = {
    runtime: {
      sendMessage(message) {
        (['PAGE_CONTEXT', 'PAGE_OBSERVER_STATUS'].includes(message.type) ? statusMessages : backgroundMessages).push(normalized(message));
        return sendMessage ? sendMessage(message) : Promise.resolve(message.type === 'PAGE_CONTEXT' ? contextReply : { ok: true });
      },
      onMessage: { addListener(listener) { runtimeListeners.push(listener); } },
    },
  };
  const context = vm.createContext({ window, chrome, URL, document, console: Object.fromEntries(['log', 'info', 'warn', 'error', 'debug'].map((name) => [name, (...args) => consoleCalls.push({ name, args })])) });
  return {
    window, chrome, context, messages, backgroundMessages, statusMessages, runtimeListeners, timers, intervals, consoleCalls, fetchCalls, promise, response, FakeXHR, eventHandlers,
    hook() { vm.runInContext(extractorSource, context); vm.runInContext(hookSource, context, { filename: 'page-hook.js' }); },
    bridge() { vm.runInContext(extractorSource, context); vm.runInContext(bridgeSource, context, { filename: 'bridge.js' }); },
    ready(extra = {}) { window.dispatchMessage({ data: { source: SOURCE, kind: 'ready', ...extra }, source: window, origin: window.location.origin }); },
    subscriptions() { return messages.filter((message) => message.data.kind === 'subscription'); },
    handshakeTimers() { return timers.filter(timer => [1000, 3000].includes(timer.delay)); },
  };
}

async function flush() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

test('fetch returns the exact original promise/response and leaves original body readable', async () => {
  const f = fixture();
  f.hook();
  const receiver = { fixture: true };
  const options = { method: 'GET' };
  const returned = f.window.fetch.call(receiver, TARGET, options);
  assert.equal(returned, f.promise);
  assert.equal(await returned, f.response);
  await flush();
  assert.equal(f.response.bodyUsed, false);
  assert.equal(f.response.cloneCount, 1);
  assert.deepEqual(await f.response.json(), { data: { subscribe_url: CANDIDATE } });
  assert.equal(f.fetchCalls[0].receiver, receiver);
  assert.equal(f.fetchCalls[0].args[1], options);
  assert.deepEqual(f.subscriptions(), [{ data: { source: SOURCE, kind: 'subscription', url: CANDIDATE }, targetOrigin: PAGE_ORIGIN }]);
});

test('original synchronous exception is propagated unchanged', () => {
  const failure = new Error('synthetic original failure');
  const f = fixture({ fetchImpl() { throw failure; } });
  f.hook();
  assert.throws(() => f.window.fetch(TARGET), (error) => error === failure);
  assert.equal(f.subscriptions().length, 0);
});

test('original rejected promise and rejection object are preserved', async () => {
  const failure = new Error('synthetic rejection');
  const original = Promise.reject(failure);
  const f = fixture({ fetchImpl: () => original });
  f.hook();
  assert.equal(f.window.fetch(TARGET), original);
  await assert.rejects(original, (error) => error === failure);
  await flush();
  assert.equal(f.subscriptions().length, 0);
});

test('response clone or JSON failure does not break fetch or print data', async () => {
  for (const failure of [{ cloneError: new Error(CANDIDATE) }, { jsonError: new Error(CANDIDATE) }]) {
    const f = fixture({ response: mockResponse(failure) });
    f.hook();
    assert.equal(await f.window.fetch(TARGET), f.response);
    await flush();
    assert.equal(f.subscriptions().length, 0);
    assert.equal(f.consoleCalls.length, 0);
    assert.equal(f.response.bodyUsed, false);
  }
});

test('only explicit HTTP(S) subscription endpoints and HTTP 2xx are observed', async () => {
  for (const url of ['ftp://127.0.0.1/api/v1/user/getSubscribe', 'https://apiweb.liangxin.xyz/api/v1/user/getSubscribe/extra', 'https://apiweb.liangxin.xyz/api/v1/passport/auth/login', 'https://localhost/api/v1/user/info', 'not an absolute URL']) {
    const f = fixture({ response: mockResponse({ url }) });
    f.hook();
    await f.window.fetch(TARGET);
    await flush();
    assert.equal(f.subscriptions().length, 0, url);
    assert.equal(f.response.cloneCount, 0, url);
  }
  for (const status of [0, 199, 300, 401, 500]) {
    const f = fixture({ response: mockResponse({ status }) });
    f.hook();
    await f.window.fetch(TARGET);
    await flush();
    assert.equal(f.subscriptions().length, 0, String(status));
  }
  const f = fixture({ response: mockResponse({ url: TARGET + '?fixture=1', status: 299 }) });
  f.hook();
  await f.window.fetch('https://different-input.example/');
  await flush();
  assert.equal(f.subscriptions().length, 1, 'checks the actual response URL, including redirected requests');
});

test('malformed payloads, credentials, non-HTTP(S), multiple/oversized URLs are ignored', async () => {
  const invalid = ['', null, 7, 'ftp://subscription.example.com/?token=x', 'https:subscription.example.com', 'https://user:pass@subscription.example.com/', 'https://subscription.example.com/\nhttps://other.example/', ' https://subscription.example.com/', 'https://subscription.example.com/\u0000', 'https://subscription.example.com/' + 'x'.repeat(8192)];
  const payloads = [null, [], {}, { data: null }, { data: [] }, ...invalid.map((subscribe_url) => ({ data: { subscribe_url } }))];
  for (const payload of payloads) {
    const f = fixture({ response: mockResponse({ payload }) });
    f.hook();
    await f.window.fetch(TARGET);
    await flush();
    assert.equal(f.subscriptions().length, 0);
  }
});

test('XHR preserves original open/send/prototype, supports JSON and text responses', () => {
  const f = fixture();
  const open = f.FakeXHR.prototype.open;
  const send = f.FakeXHR.prototype.send;
  f.hook();
  assert.equal(f.window.XMLHttpRequest.prototype, f.FakeXHR.prototype);
  assert.equal(f.window.XMLHttpRequest.prototype.open, open);
  assert.equal(f.window.XMLHttpRequest.prototype.send, send);
  assert.equal(f.window.XMLHttpRequest.DONE, 4);
  for (const type of ['', 'text', 'json']) {
    const xhr = new f.window.XMLHttpRequest();
    assert.ok(xhr instanceof f.FakeXHR);
    assert.ok(xhr instanceof f.window.XMLHttpRequest);
    assert.equal(xhr.open('GET', TARGET, true), 'original-open-result');
    assert.equal(xhr.send(null), 'original-send-result');
    xhr.finish({ type });
    assert.equal(xhr.responseText, JSON.stringify({ data: { subscribe_url: CANDIDATE } }));
  }
  class ChildXHR extends f.window.XMLHttpRequest {}
  const child = new ChildXHR();
  assert.ok(child instanceof ChildXHR);
  child.finish({ type: 'json' });
  assert.equal(f.subscriptions().length, 4);
  assert.throws(() => f.window.XMLHttpRequest(), TypeError);
});

test('XHR ignores unsuccessful, wrong endpoint, binary, and malformed responses', () => {
  const f = fixture();
  f.hook();
  for (const options of [{ status: 500 }, { url: TARGET + '/extra' }, { url: 'https://other.example/api/v1/user/info' }, { type: 'blob' }, { type: 'arraybuffer' }, { text: '<html>error</html>' }, { type: 'json', payload: { data: { subscribe_url: 'ftp://invalid.example/' } } }]) {
    const xhr = new f.window.XMLHttpRequest();
    xhr.finish(options);
  }
  assert.equal(f.subscriptions().length, 0);
});

test('MAIN caches only the latest candidate and replays for a valid ready handshake', async () => {
  const f = fixture();
  f.hook();
  f.ready();
  assert.equal(f.subscriptions().length, 0);
  await f.window.fetch(TARGET);
  await flush();
  f.ready();
  assert.equal(f.subscriptions().length, 2);
  const newer = CANDIDATE.replace('PRIVATE-FIXTURE-TOKEN', 'NEW-FIXTURE-TOKEN');
  new f.window.XMLHttpRequest().finish({ type: 'json', payload: { data: { subscribe_url: newer } } });
  f.ready();
  assert.equal(f.subscriptions().at(-1).data.url, newer);
  const before = f.subscriptions().length;
  f.window.dispatchMessage({ data: { source: SOURCE, kind: 'ready' }, source: {}, origin: PAGE_ORIGIN });
  f.window.dispatchMessage({ data: { source: SOURCE, kind: 'ready' }, source: f.window, origin: 'https://evil.example' });
  f.ready({ extra: true });
  assert.equal(f.subscriptions().length, before);
});

test('MAIN repeated injection is idempotent and sends every real successful response', async () => {
  const f = fixture();
  f.hook();
  assert.equal(f.window.__sckiSubstorePageHookV2, true);
  const fetch = f.window.fetch;
  const xhrConstructor = f.window.XMLHttpRequest;
  f.hook();
  assert.equal(f.window.fetch, fetch);
  assert.equal(f.window.XMLHttpRequest, xhrConstructor);
  assert.equal(f.eventHandlers.get('message').length, 1);
  await f.window.fetch(TARGET);
  await f.window.fetch(TARGET);
  await flush();
  assert.equal(f.fetchCalls.length, 2);
  assert.equal(f.subscriptions().length, 2);
  const xhr = new f.window.XMLHttpRequest();
  xhr.finish();
  assert.equal(f.subscriptions().length, 3);
});

test('bridge installed after successful response recovers it via handshake', async () => {
  const f = fixture();
  f.hook();
  await f.window.fetch(TARGET);
  await flush();
  f.bridge();
  await flush();
  assert.deepEqual(f.backgroundMessages, [observed()]);
  assert.deepEqual(f.handshakeTimers().map((timer) => timer.delay), [1000, 3000]);
  for (const timer of f.handshakeTimers()) timer.callback();
  assert.equal(f.backgroundMessages.length, 3);
  assert.equal(f.handshakeTimers().length, 2, 'the handshake never starts perpetual polling');
});

test('bridge installed first receives later observation and REQUEST_REPLAY asks MAIN only', async () => {
  const f = fixture();
  f.bridge();
  f.hook();
  await f.window.fetch(TARGET);
  await flush();
  assert.equal(f.backgroundMessages.length, 1);
  let acknowledgement;
  f.runtimeListeners[0]({ type: 'REQUEST_REPLAY' }, {}, (value) => { acknowledgement = normalized(value); });
  assert.deepEqual(acknowledgement, { ok: true });
  assert.equal(f.backgroundMessages.length, 2);
  assert.equal(f.fetchCalls.length, 1, 'manual replay does not fetch or log in');
  f.runtimeListeners[0]({ type: 'UNRELATED' }, {}, () => assert.fail('unexpected response'));
  assert.equal(f.backgroundMessages.length, 2);
});

test('PAGE_CONTEXT must explicitly allow the page before candidates or ambiguity can reach the background', async () => {
  for (const origin of ['http://127.0.0.1:14122', 'http://127.0.0.1:38324', 'https://permission-denied.example.com']) {
    const f = fixture({ origin, contextReply: { allowed: false } });
    f.hook();
    f.bridge();
    new f.window.XMLHttpRequest().finish({ type: 'json' });
    await flush();
    f.ready();
    f.window.dispatchMessage({ data: { source: SOURCE, kind: 'ambiguous', count: 2 }, source: f.window, origin });
    let acknowledgement;
    f.runtimeListeners[0]({ type: 'REQUEST_REPLAY' }, {}, value => { acknowledgement = normalized(value); });
    assert.deepEqual(acknowledgement, { ok: true });
    assert.deepEqual(f.backgroundMessages, [], 'local frontend/backend and permission-denied contexts cannot forward links');
    assert.deepEqual(f.statusMessages, [{ type: 'PAGE_CONTEXT', siteNames: [] }]);
    assert.equal(f.handshakeTimers().length, 0, 'denied pages never schedule replay requests');
    assert.equal(f.messages.filter(message => message.data.kind === 'ready').length, 0);
    assert.equal(f.fetchCalls.length, 0);
  }
  for (const contextReply of [null, {}, { allowed: 'true' }, { ok: true }]) {
    const f = fixture({ contextReply });
    f.bridge();
    await flush();
    f.window.dispatchMessage({ data: { source: SOURCE, kind: 'subscription', url: CANDIDATE }, source: f.window, origin: PAGE_ORIGIN });
    assert.deepEqual(f.backgroundMessages, [], 'missing or truthy nonboolean allowance must remain disabled');
  }
});

test('a response arriving before asynchronous PAGE_CONTEXT approval is replayed only after approval', async () => {
  let approve;
  const permission = new Promise(resolve => { approve = resolve; });
  const f = fixture({ sendMessage(message) { return message.type === 'PAGE_CONTEXT' ? permission : Promise.resolve({ ok: true }); } });
  f.hook();
  f.bridge();
  new f.window.XMLHttpRequest().finish({ type: 'json' });
  await flush();
  assert.deepEqual(f.backgroundMessages, []);
  assert.equal(f.handshakeTimers().length, 0);
  assert.deepEqual(f.statusMessages, [{ type: 'PAGE_CONTEXT', siteNames: [] }]);
  approve({ allowed: true });
  await flush();
  assert.deepEqual(f.backgroundMessages, [observed()]);
  assert.deepEqual(f.statusMessages, [{ type: 'PAGE_CONTEXT', siteNames: [] }, { type: 'PAGE_OBSERVER_STATUS', stage: 'observer_ready', siteNames: [] }]);
  assert.equal(f.handshakeTimers().length, 2);
  assert.equal(f.fetchCalls.length, 0, 'approval replays memory rather than fetching the account');
});

test('approved HTTP and IP pages forward HTTP self-hosted subscription candidates from fetch and XHR', async () => {
  const candidateUrl = 'http://192.168.1.20:8080/link/self-hosted?token=PRIVATE-FIXTURE';
  const endpoint = 'http://10.0.0.20:8080/api/v3/user/getSubscribe';
  for (const origin of ['http://panel.example.com', 'http://192.168.1.50:8080', 'https://[fd00::1]:8443']) {
    const f = fixture({ origin, response: mockResponse({ url: endpoint, payload: { data: { subscribe_url: candidateUrl } } }) });
    f.bridge();
    f.hook();
    await f.window.fetch(endpoint);
    await flush();
    assert.deepEqual(f.backgroundMessages, [observed(candidateUrl)]);
    new f.window.XMLHttpRequest().finish({ url: endpoint, type: 'json', payload: { data: { subscribe_url: candidateUrl } } });
    assert.deepEqual(f.backgroundMessages, [observed(candidateUrl), observed(candidateUrl)]);
    assert.ok(f.subscriptions().every(message => message.targetOrigin === origin));
    assert.equal(f.fetchCalls.length, 1);
    assert.equal(f.response.bodyUsed, false);
  }
});

test('brand metadata reaches PAGE_CONTEXT, status and candidate messages without email or subscription URL metadata', async () => {
  const document = emptyDocument();
  document.title = '自托管新品牌 - Dashboard | fixture@example.com | https://private.example.com/?token=PRIVATE';
  const f = fixture({ document });
  f.hook();
  f.bridge();
  await flush();
  new f.window.XMLHttpRequest().finish({ type: 'json' });
  assert.deepEqual(f.statusMessages, [{ type: 'PAGE_CONTEXT', siteNames: ['自托管新品牌'] },
    { type: 'PAGE_OBSERVER_STATUS', stage: 'observer_ready', siteNames: ['自托管新品牌'] }]);
  assert.deepEqual(f.backgroundMessages, [observed(CANDIDATE, ['自托管新品牌'])]);
  assert.equal(f.consoleCalls.length, 0);
});

test('bridge validates event source/origin/schema/URL and sends only the required fields', async () => {
  const f = fixture();
  f.bridge();
  await flush();
  const valid = { source: SOURCE, kind: 'subscription', url: CANDIDATE };
  for (const event of [
    { data: valid, source: {}, origin: PAGE_ORIGIN },
    { data: valid, source: f.window, origin: 'https://evil.example' },
    ...[null, [], {}, { ...valid, extra: true }, { ...valid, source: 'other' }, { ...valid, source: 'scki-substore-link-v1' }, { ...valid, kind: 'other' }, { ...valid, url: 'ftp://subscription.example.com/' }, { ...valid, url: 'https:subscription.example.com' }, { ...valid, url: 'https://user:pass@subscription.example.com/' }, { ...valid, url: CANDIDATE + '\n' }, { ...valid, url: 'https://subscription.example.com/' + 'x'.repeat(8192) }].map((data) => ({ data, source: f.window, origin: PAGE_ORIGIN })),
  ]) f.window.dispatchMessage(event);
  assert.equal(f.backgroundMessages.length, 0);
  f.window.dispatchMessage({ data: valid, source: f.window, origin: PAGE_ORIGIN });
  assert.deepEqual(f.backgroundMessages, [observed()]);
});

test('bridge repeated injection does not duplicate listeners, timers, or delivery', async () => {
  const f = fixture();
  f.bridge();
  f.bridge();
  await flush();
  assert.equal(f.window.__sckiSubstoreBridgeV2, true);
  assert.equal(f.runtimeListeners.length, 1);
  assert.equal(f.eventHandlers.get('message').length, 1);
  assert.equal(f.timers.length, 2);
  f.window.dispatchMessage({ data: { source: SOURCE, kind: 'subscription', url: CANDIDATE }, source: f.window, origin: PAGE_ORIGIN });
  assert.equal(f.backgroundMessages.length, 1);
});

test('candidate length limit is strictly less than 8192 in both worlds', async () => {
  const f = fixture();
  f.hook();
  f.bridge();
  await flush();
  const prefix = 'https://subscription.example.com/';
  const atLimit = prefix + 'x'.repeat(8192 - prefix.length);
  const withinLimit = atLimit.slice(0, -1);
  new f.window.XMLHttpRequest().finish({ type: 'json', payload: { data: { subscribe_url: atLimit } } });
  f.window.dispatchMessage({ data: { source: SOURCE, kind: 'subscription', url: atLimit }, source: f.window, origin: PAGE_ORIGIN });
  assert.equal(f.backgroundMessages.length, 0);
  new f.window.XMLHttpRequest().finish({ type: 'json', payload: { data: { subscribe_url: withinLimit } } });
  assert.equal(f.backgroundMessages.length, 1);
  assert.equal(f.backgroundMessages[0].candidateUrl.length, 8191);
});

test('extension context failures are swallowed without private logging', async () => {
  for (const sendMessage of [() => { throw new Error(CANDIDATE); }, () => Promise.reject(new Error(CANDIDATE))]) {
    const f = fixture({ sendMessage });
    f.hook();
    f.bridge();
    await f.window.fetch(TARGET);
    await flush();
    assert.equal(f.consoleCalls.length, 0);
    assert.equal(f.response.bodyUsed, false);
    assert.deepEqual(f.backgroundMessages, [], 'failed context authorization cannot enable candidate forwarding');
  }
});

test('scripts never read credential storage, cookies, or initiate a request', async () => {
  let credentialReads = 0;
  let titleReads = 0;
  const password = { tagName: 'INPUT', textContent: '', getAttribute(key) { return key === 'type' ? 'password' : key === 'aria-label' ? 'Subscription' : ''; } };
  Object.defineProperty(password, 'value', { get() { credentialReads++; throw new Error('password value must remain unread'); } });
  const document = emptyDocument();
  document.querySelectorAll = selector => [CONTROL_SELECTOR, '*'].includes(selector) ? [password] : [];
  Object.defineProperty(document, 'title', { get() { titleReads++; return 'Safe fixture brand - Dashboard'; } });
  const f = fixture({ document });
  const forbidden = () => { credentialReads++; throw new Error('forbidden account access'); };
  for (const key of ['localStorage', 'sessionStorage', 'cookie']) {
    Object.defineProperty(f.window, key, { get: forbidden });
    Object.defineProperty(f.context, key, { get: forbidden });
  }
  Object.defineProperty(document, 'cookie', { get: forbidden });
  f.hook();
  f.bridge();
  for (const timer of f.timers) timer.callback();
  await flush();
  assert.equal(f.fetchCalls.length, 0);
  assert.equal(f.consoleCalls.length, 0);
  assert.equal(credentialReads, 0);
  assert.ok(titleReads > 0, 'semantic title metadata is allowed');
  assert.deepEqual(f.statusMessages[0], { type: 'PAGE_CONTEXT', siteNames: ['Safe fixture brand'] });
  f.runtimeListeners[0]({ type: 'REQUEST_REPLAY' }, {}, () => {});
  assert.equal(f.fetchCalls.length, 0);
  assert.equal(credentialReads, 0);
});

test('scripts remain inactive on non-HTTP(S) pages; registration controls the allowed sites', () => {
  const f = fixture({ origin: 'ftp://other.example.com' });
  const fetch = f.window.fetch;
  f.hook();
  f.bridge();
  assert.equal(f.window.fetch, fetch);
  assert.equal(f.window.XMLHttpRequest, f.FakeXHR);
  assert.equal(f.messages.length, 0);
  assert.equal(f.runtimeListeners.length, 0);
  assert.equal(f.timers.length, 0);
});


test('all registered origins observe cross-origin v1/v3 subscription JSON without new page requests', async () => {
  const cases = [
    ['https://m.ssone.uk', 'https://m.ssone.uk/subscription/current'],
    ['https://kitty.sb', 'https://moka.tainaka-ritsu.com/api/v3/user/getSubscribe'],
    ['https://ad.zstarzzz.cc', 'https://ad.zstarzzz.cc/api/v1/user/getSubscribe'],
    ['https://therun.6128888.xyz', 'https://therun.6128888.xyz/api/v1/user/getSubscribe'],
    ['https://www.xn--mes358aby2apfg.com', 'https://www.xn--mes358aby2apfg.com/api/subscription'],
    ['https://custom.example.com', 'https://api.custom.example.com/user/getSubscribe'],
    ['http://custom.example.com', 'http://api.custom.example.com/api/v1/user/getSubscribe'],
    ['http://192.168.1.50:8080', 'http://192.168.1.50:8080/api/v3/user/getSubscribe'],
    ['http://[fd00::1]:8080', 'http://[fd00::2]:8080/user/getSubscribe'],
  ];
  for (const [origin, url] of cases) {
    const f = fixture({ origin, response: mockResponse({ url, payload: { data: { subscribe: { subscribe_url: CANDIDATE } } } }) });
    f.bridge(); f.hook();
    await f.window.fetch(url);
    await flush();
    assert.deepEqual(f.backgroundMessages, [observed()]);
    assert.equal(f.fetchCalls.length, 1);
    assert.equal(f.response.bodyUsed, false);
  }
});

function clipboardDocument(urls) {
  return {
    title: '',
    addEventListener() {},
    querySelectorAll(selector) {
      if (selector === '*') return [];
      if (selector !== CONTROL_SELECTOR) return [];
      return urls.map(url => ({ tagName: 'BUTTON', textContent: '复制订阅链接',
        getAttribute(key) { return key === 'data-clipboard-text' ? url : ''; } }));
    },
  };
}

test('DOM-only panels synchronize semantic controls and refuse distinct account candidates', async () => {
  const urls = [CANDIDATE];
  const f = fixture({ origin: 'https://www.xn--mes358aby2apfg.com', document: clipboardDocument(urls) });
  f.hook(); f.bridge();
  await flush();
  assert.equal(f.backgroundMessages.length, 1, 'ready handshake publishes a DOM candidate once');
  assert.equal(f.fetchCalls.length, 0, 'DOM-only extraction does not call account APIs');
  urls.push(CANDIDATE.replace('PRIVATE-FIXTURE-TOKEN', 'SECOND-ACCOUNT'));
  f.ready();
  assert.equal(f.backgroundMessages.at(-1).type, 'OBSERVATION_AMBIGUOUS');
  const before = f.backgroundMessages.length;
  f.window.dispatchMessage({ data: { source: SOURCE, kind: 'ambiguous', count: Number.MAX_SAFE_INTEGER + 1 }, source: f.window, origin: f.window.location.origin });
  assert.equal(f.backgroundMessages.length, before, 'bridge bounds ambiguity metadata');
  f.window.dispatchMessage({ data: { source: SOURCE, kind: 'ambiguous', count: 1028 }, source: f.window, origin: f.window.location.origin });
  assert.equal(f.backgroundMessages.at(-1).type, 'OBSERVATION_AMBIGUOUS', 'many controls must still fail closed');
});

test('network subscription responses supersede stale format controls, and ambiguity replaces the replay cache', async () => {
  const domURL = CANDIDATE.replace('PRIVATE-FIXTURE-TOKEN', 'OLD-DOM');
  const f = fixture({ document: clipboardDocument([domURL]), response: mockResponse() });
  f.hook(); f.bridge();
  await flush();
  assert.equal(f.backgroundMessages.at(-1).candidateUrl, domURL);
  await f.window.fetch(TARGET); await flush();
  f.ready();
  assert.equal(f.backgroundMessages.at(-1).candidateUrl, CANDIDATE);
  const xhr = new f.window.XMLHttpRequest();
  xhr.finish({ type: 'json', payload: { data: [{ subscribe_url: CANDIDATE }, { subscribe_url: domURL }] } });
  assert.equal(f.backgroundMessages.at(-1).type, 'OBSERVATION_AMBIGUOUS');
  f.ready();
  assert.equal(f.backgroundMessages.at(-1).type, 'OBSERVATION_AMBIGUOUS', 'old valid URL cannot replay after ambiguity');
});

test('visible DOM property-only updates are discovered after the initial handshake without account requests', async () => {
  const urls = [];
  const document = clipboardDocument(urls);
  document.visibilityState = 'visible';
  const f = fixture({ document });
  f.hook(); f.bridge();
  await flush();
  assert.equal(f.intervals.length, 1);
  assert.equal(f.intervals[0].delay, 3000);
  urls.push(CANDIDATE);
  f.intervals[0].callback();
  assert.equal(f.backgroundMessages.at(-1).candidateUrl, CANDIDATE);
  assert.equal(f.fetchCalls.length, 0);
  urls.splice(0);
  f.intervals[0].callback();
  const before = f.backgroundMessages.length;
  f.ready();
  assert.equal(f.backgroundMessages.length, before, 'disappeared DOM controls must not replay a stale URL');
  document.visibilityState = 'hidden';
  urls.push(CANDIDATE);
  f.intervals[0].callback();
  assert.equal(f.backgroundMessages.length, before, 'inactive panels do not scan controls');
  await f.window.fetch(TARGET); await flush();
  assert.equal(f.intervals[0].cleared, true, 'a definitive API result stops DOM polling');
  assert.equal(f.backgroundMessages.at(-1).candidateUrl, CANDIDATE);
});

test('bridge and MAIN report safe readiness once per document in either injection order', async () => {
  for (const bridgeFirst of [true, false]) {
    const f = fixture();
    if (bridgeFirst) { f.bridge(); f.hook(); } else { f.hook(); f.bridge(); }
    await flush();
    assert.deepEqual(f.statusMessages, [
      { type: 'PAGE_CONTEXT', siteNames: [] },
      { type: 'PAGE_OBSERVER_STATUS', stage: 'observer_ready', siteNames: [] },
    ]);
    for (const timer of f.timers) timer.callback();
    f.ready();
    assert.equal(f.statusMessages.length, 2, 'replays cannot make finished results look pending again');
    assert.equal(f.fetchCalls.length, 0);
    assert.equal(f.backgroundMessages.length, 0);
  }
});
