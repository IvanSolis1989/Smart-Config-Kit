'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'extractors.js'), 'utf8');
const LINK = 'https://sub.example.com/api/v1/client/subscribe?token=PRIVATE-FIXTURE-TOKEN';
const CONTROL_SELECTOR = '[data-clipboard-text], [data-clipboard], [data-subscribe-url], input, textarea, rb-text-field, a[href]';
const SITE_META_SELECTOR = 'meta[property="og:site_name"], meta[name="application-name"], meta[name="apple-mobile-web-app-title"]';
const SITE_BRAND_SELECTOR = 'header [data-brand], header .brand, header .navbar-brand, header .logo, header a[rel~="home"], header img[alt], [role="banner"] [data-brand], [role="banner"] .brand, [role="banner"] .navbar-brand, [role="banner"] .logo, [role="banner"] a[rel~="home"], [role="banner"] img[alt], nav .brand, nav .navbar-brand';
const normalize = value => JSON.parse(JSON.stringify(value));

function fixture() {
  const accesses = [];
  const logs = [];
  const context = vm.createContext({ URL, console: Object.fromEntries(['log', 'error', 'warn', 'info', 'debug'].map(key => [key, (...args) => logs.push(args)])) });
  for (const key of ['fetch', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'cookie', 'chrome']) Object.defineProperty(context, key, { get() { accesses.push(key); throw new Error('forbidden external access'); } });
  vm.runInContext(source, context, { filename: 'extractors.js' });
  return { api: context.SCKISubStoreExtractors, context, accesses, logs,
    install() { vm.runInContext(source, context); } };
}

function element(tagName, attributes = {}, { text = '', value = undefined, labels = [], previous = null, next = null, enclosing = null, forbidValue = false, shadowRoot = null, componentLabel, componentType, inForm = false, containsForm = false } = {}) {
  const node = { tagName: tagName.toUpperCase(), textContent: text, labels, previousElementSibling: previous, nextElementSibling: next, valueReads: 0,
    shadowRoot, label: componentLabel, type: componentType,
    getAttribute(name) { return Object.hasOwn(attributes, name) ? attributes[name] : null; },
    closest(selector) { if (selector === 'form') return inForm ? {} : null; assert.equal(selector, 'label'); return enclosing; },
    querySelector(selector) { assert.equal(selector, 'input, textarea, select, form'); return containsForm ? {} : null; } };
  Object.defineProperty(node, 'value', { get() { node.valueReads++; if (forbidValue) assert.fail('credential input value was read'); return value; } });
  return node;
}

function brandDocument({ title = '', metas = [], brands = [] } = {}) {
  const queries = [];
  const forbiddenReads = [];
  const doc = { title, queries, forbiddenReads, querySelectorAll(selector) {
    queries.push(selector);
    if (selector === SITE_META_SELECTOR) return metas;
    assert.equal(selector, SITE_BRAND_SELECTOR, 'brand reads must use bounded metadata/header selectors');
    return brands;
  } };
  for (const key of ['cookie', 'body', 'documentElement', 'scripts', 'textContent', 'forms']) Object.defineProperty(doc, key, { get() { forbiddenReads.push(key); assert.fail('account forms or whole page were read'); } });
  return doc;
}

function document(controls, labels = {}, { hosts = [], baseURI } = {}) {
  const queries = [];
  const doc = {
    queries, baseURI,
    querySelectorAll(selector) {
      queries.push(selector);
      if (selector === CONTROL_SELECTOR) return controls;
      assert.equal(selector, '*', 'only control queries and element structure may be inspected');
      return [...new Set([...controls, ...hosts])];
    },
    getElementById(id) { return labels[id] || null; },
  };
  for (const key of ['cookie', 'body', 'documentElement', 'scripts', 'textContent']) Object.defineProperty(doc, key, { get() { assert.fail('whole document or credentials were read'); } });
  return doc;
}

const candidate = (url, signal = 'api:subscribe_url') => ({ url, signal });

test('exports a frozen origin-independent API with independent world instances and idempotent installation', () => {
  const f = fixture();
  assert.equal(Object.hasOwn(f.api, 'profiles'), false);
  assert.equal(typeof f.api.siteNames, 'function');
  assert.equal(Object.isFrozen(f.api), true);
  const api = f.api;
  f.install();
  assert.equal(f.context.SCKISubStoreExtractors, api);
  assert.notEqual(fixture().api, api, 'MAIN and ISOLATED worlds get independent instances');
  assert.deepEqual(f.accesses, []);
  assert.deepEqual(f.logs, []);
});

test('validCandidate accepts bounded HTTP(S) URLs on arbitrary domains, public/private IPs and self-hosted panels', () => {
  const { api } = fixture();
  for (const valid of [LINK, 'https://sub.example.com:8443/link/abc?clash=1', 'https://订阅.example.com/sub/abc', 'http://sub.example.com/a',
    'https://127.0.0.1/a', 'https://8.8.8.8/a', 'https://127.1/a', 'https://0x7f000001/a', 'https://127%2e0%2e0%2e1/a', 'https://[::1]/a', 'https://[2606:4700::1111]/a',
    'http://192.168.12.8:8080/sub', 'http://10.0.0.2/api/subscription', 'http://[fd00::1]:8080/sub',
    'https://localhost/a', 'https://a.localhost/a', 'https://host.local/a', 'https://host.internal/a', 'https://host.lan/a', 'https://singlelabel/a', 'http://fixture.test/sub']) assert.equal(api.validCandidate(valid), true);
  for (const invalid of [null, 4, '', 'https:sub.example.com/a', 'http:///path', 'https://user:pass@sub.example.com/a', 'http://user@192.168.1.2/sub', 'http://@localhost/sub',
    'ftp://sub.example.com/a', 'ws://sub.example.com/a', 'file:///sub', 'javascript:alert(1)', 'data:text/plain,hello', '//sub.example.com/sub', 'http://', 'http://[invalid]/sub',
    LINK + '\n', ' ' + LINK, 'http://sub.example.com/a b', 'https://sub.example.com/\\evil', LINK + '%0d%0aHeader:x', LINK + '%250a', LINK + '%00', LINK + '\u007f', LINK + '\u202e', LINK + '\u200b', LINK + 'x'.repeat(8192)]) assert.equal(api.validCandidate(invalid), false, 'invalid candidate should be rejected');
  assert.equal(api.validCandidate('http://a/' + 'x'.repeat(8192 - 'http://a/'.length - 1)), true);
  assert.equal(api.validCandidate('http://a/' + 'x'.repeat(8192 - 'http://a/'.length)), false);
});

test('client imports unwrap exactly once and preserve complete inner query/fragment options', () => {
  const { api } = fixture();
  const inner = LINK + '&format=clash#headers=%7B%22X-Test%22%3A%22a%20b%2Bc%22%7D';
  const encoded = encodeURIComponent(inner);
  for (const value of [inner, 'clash://install-config?url=' + encoded, 'sing-box://import-remote-profile?url=' + encoded,
    'hiddify://import/' + inner, 'hiddify://import/' + encoded, 'surge:///install-config?url=' + encoded,
    'surgeconfig:///install-config?url=' + encoded, 'loon://import?sub=' + encoded, 'loon://import?nodelist=' + encoded,
    'https://www.nsloon.com/openloon/import?nodelist=' + encoded]) assert.equal(api.unwrapImportLink(value), inner);
});

test('all supported client wrappers accept HTTP self-hosted subscription targets', () => {
  const { api } = fixture();
  const inner = 'http://192.168.1.20:8080/link/self-hosted?token=FIXTURE&format=clash#noCache';
  const encoded = encodeURIComponent(inner);
  for (const wrapper of [inner, 'clash://install-config?url=' + encoded, 'sing-box://import-remote-profile?url=' + encoded,
    'hiddify://import/' + inner, 'hiddify://import/' + encoded, 'surge:///install-config?url=' + encoded,
    'surgeconfig:///install-config?url=' + encoded, 'loon://import?sub=' + encoded, 'https://www.nsloon.com/openloon/import?nodelist=' + encoded]) {
    assert.equal(api.unwrapImportLink(wrapper), inner);
  }
});

test('invalid, duplicate, injected, plugin and rule import targets fail closed', () => {
  const { api } = fixture();
  for (const value of ['javascript:alert(1)', 'data:text/plain,' + LINK, 'clash://install-config?url=javascript%3Aalert(1)',
    'clash://install-config?url=' + encodeURIComponent(encodeURIComponent(LINK)),
    'clash://install-config?url=' + encodeURIComponent(LINK) + '&url=' + encodeURIComponent(LINK.replace('TOKEN', 'OTHER')),
    'surge:///install-module?url=' + encodeURIComponent(LINK), 'loon://import?rules=' + encodeURIComponent(LINK),
    'loon://import?plugin=' + encodeURIComponent(LINK), 'loon://import?sub=' + encodeURIComponent(LINK) + '&nodelist=' + encodeURIComponent(LINK),
    'https://www.nsloon.com/openloon/import?rules=' + encodeURIComponent(LINK),
    'hiddify://import/' + encodeURIComponent('ftp://sub.example.com/'), 'clash://install-config?url=' + encodeURIComponent('http://user:pass@127.0.0.1/'),
    'clash://install-config?url=' + encodeURIComponent(LINK + '\r\nInjected:true'),
    'clash://install-config?url=' + encodeURIComponent(LINK) + '&extra=\u200b']) assert.equal(api.unwrapImportLink(value), null);
});

test('six sample panels include v1/v3 cross-origin and nested subscribe objects without defining scope', () => {
  const { api } = fixture();
  const endpoints = {
    ssone: 'https://m.ssone.uk/api/v1/user/getSubscribe', liangxin: 'https://apiweb.liangxin.xyz/api/v1/user/getSubscribe',
    peiqian: 'https://www.xn--mes358aby2apfg.com/api/v1/user/getSubscribe', kitty: 'https://moka.tainaka-ritsu.com/api/v3/user/getSubscribe',
    starnet: 'https://ad.zstarzzz.cc/api/v1/user/getSubscribe', dream: 'https://therun.6128888.xyz/api/v1/user/getSubscribe',
  };
  for (const endpoint of Object.values(endpoints)) {
    assert.deepEqual(normalize(api.networkCandidates({ data: { subscribe: { subscribe_url: LINK } } }, endpoint)), [candidate(LINK)]);
  }
  for (const key of ['subscribe_url', 'subscription_url', 'sub_url']) assert.deepEqual(normalize(api.networkCandidates({ data: { [key]: LINK } }, endpoints.kitty)), [candidate(LINK, 'api:' + key)]);
});

test('network extraction rejects unrelated account/payment paths and never scans generic url fields', () => {
  const { api } = fixture();
  for (const path of ['/api/v1/user/info', '/api/v1/passport/auth/login', '/api/v1/user/getSubscribe/extra', '/api/v1/user/getSubscribeEvil', '/api/v1/payment/subscription', '/articles/subscription', '/api/v1/user/%67etSubscribe']) {
    assert.deepEqual(normalize(api.networkCandidates({ data: { subscribe_url: LINK } }, 'https://api.example.com' + path)), []);
  }
  for (const endpoint of ['http://api.example.com/api/v1/user/getSubscribe', 'http://10.0.0.10:8080/api/v3/user/getSubscribe', 'http://[fd00::1]/api/subscription/current']) {
    const localLink = 'http://192.168.1.20:8080/sub?token=FIXTURE';
    assert.deepEqual(normalize(api.networkCandidates({ data: { subscribe_url: localLink } }, endpoint)), [candidate(localLink)]);
  }
  assert.deepEqual(normalize(api.networkCandidates({ data: { url: LINK }, url: LINK }, 'https://api.example.com/api/v1/user/getSubscribe')), []);
  for (const path of ['/user/getSubscribe', '/api/v3/subscription', '/api/subscription/current', '/user/subscription/info']) assert.equal(api.networkCandidates({ sub_url: LINK }, 'https://api.example.com' + path).length, 1);
});

test('subscriptionResponse can filter official v1/v3 and explicit endpoints before reading JSON', () => {
  const { api } = fixture();
  for (const endpoint of ['https://apiweb.liangxin.xyz/api/v1/user/getSubscribe', 'https://moka.tainaka-ritsu.com/api/v3/user/getSubscribe',
    'https://api.example.com/user/getSubscribe', 'https://api.example.com/api/subscription/current', 'https://api.example.com/api/v3/subscription',
    'https://api.example.com/user/subscription/info', 'http://api.example.com/api/v1/user/getSubscribe',
    'http://127.0.0.1:8080/api/v3/user/getSubscribe']) assert.equal(api.subscriptionResponse(endpoint), true);
  for (const endpoint of ['https://api.example.com/api/v1/passport/auth/login', 'https://api.example.com/api/v1/user/info',
    'https://api.example.com/articles/subscription', 'ftp://api.example.com/api/v1/user/getSubscribe',
    'https://api.example.com/api/v3/user/getSubscribe/extra']) assert.equal(api.subscriptionResponse(endpoint), false);
});

test('network traversal is bounded to depth four and skips secret/request branches and accessors', () => {
  const { api } = fixture();
  const payload = { data: { subscribe: { subscribe_url: LINK } } };
  for (const key of ['password', 'email', 'token', 'auth_data', 'headers', 'request', 'requestBody', 'cookie', 'localStorage']) Object.defineProperty(payload, key, { enumerable: true, get() { assert.fail('secret accessor was read'); } });
  payload.headers_data = { subscribe_url: LINK.replace('TOKEN', 'HEADER') };
  payload.requestBodyData = { subscribe_url: LINK.replace('TOKEN', 'BODY') };
  Object.defineProperty(payload, 'unrelatedAccessor', { enumerable: true, get() { assert.fail('arbitrary accessor was invoked'); } });
  assert.deepEqual(normalize(api.networkCandidates(payload, 'https://api.example.com/api/v3/user/getSubscribe')), [candidate(LINK)]);
  assert.equal(api.networkCandidates({ a: { b: { c: { d: { subscribe_url: LINK } } } } }, 'https://api.example.com/api/v1/user/getSubscribe').length, 1);
  assert.equal(api.networkCandidates({ a: { b: { c: { d: { e: { subscribe_url: LINK } } } } } }, 'https://api.example.com/api/v1/user/getSubscribe').length, 0);
  const cycle = { subscribe_url: LINK }; cycle.data = cycle;
  assert.equal(api.networkCandidates(cycle, 'https://api.example.com/api/v1/user/getSubscribe').length, 1);
  const large = { subscribe_url: LINK, data: Array.from({ length: 1100 }, () => ({ sub_url: LINK })) };
  assert.deepEqual(normalize(api.networkCandidates(large, 'https://api.example.com/api/v1/user/getSubscribe')), [], 'truncation must never select a partial account set');
});

test('SSPanel clipboard attributes and explicitly named subscription controls are extracted', () => {
  const { api } = fixture();
  const link = 'https://sub.example.com/link/PRIVATE-FIXTURE-TOKEN?clash=1';
  const doc = document([
    element('button', { 'data-clipboard-text': link }, { text: '复制订阅' }),
    element('button', { 'data-clipboard': LINK }, { text: '' }),
    element('div', { 'data-subscribe-url': 'https://sub.example.com/opaque-private-path' }),
    element('button', { 'data-clipboard-text': 'https://sub.example.com/opaque-private-path' }, { text: 'Copy subscription' }),
  ]);
  assert.deepEqual(normalize(api.domCandidates(doc)), [candidate(link, 'dom:clipboard'), candidate(LINK, 'dom:clipboard'),
    candidate('https://sub.example.com/opaque-private-path', 'dom:subscribe-attribute'), candidate('https://sub.example.com/opaque-private-path', 'dom:clipboard')]);
});

test('label/aria/placeholder subscription inputs and textareas are read semantically', () => {
  const { api } = fixture();
  const label = element('label', {}, { text: '订阅链接' });
  const doc = document([
    element('input', { type: 'url', placeholder: 'Subscription URL' }, { value: LINK }),
    element('textarea', { 'aria-label': '复制订阅' }, { value: LINK }),
    element('input', {}, { value: LINK, labels: [label] }),
    element('input', {}, { value: LINK, previous: label }),
    element('input', {}, { value: LINK, enclosing: label }),
    element('input', { 'aria-labelledby': 'sub-label' }, { value: LINK }),
    element('input', { placeholder: 'Unrelated website' }, { forbidValue: true }),
  ], { 'sub-label': label });
  assert.equal(api.domCandidates(doc).length, 6);
  assert.ok(api.domCandidates(doc).every(item => item.signal === 'dom:labeled-input'));
  assert.equal(doc.querySelectorAll(CONTROL_SELECTOR).at(-1).valueReads, 0);
});

test('password and email input values are never read even when labeled subscription or given clipboard data', () => {
  const { api } = fixture();
  const nodes = [
    element('input', { type: 'password', 'aria-label': 'Subscription', 'data-clipboard-text': LINK }, { forbidValue: true }),
    element('input', { type: 'email', placeholder: '订阅链接' }, { forbidValue: true }),
    element('input', { type: 'text', name: 'account_email', placeholder: '订阅链接' }, { forbidValue: true }),
    element('input', { type: 'text', autocomplete: 'current-password', placeholder: '订阅链接' }, { forbidValue: true }),
    element('textarea', { id: 'login-password', 'aria-label': 'Subscription' }, { forbidValue: true }),
  ];
  assert.deepEqual(normalize(api.domCandidates(document(nodes))), []);
  assert.ok(nodes.every(node => node.valueReads === 0), 'reject before touching credential values, even when their getters would be caught');
});

test('Kitty rb-text-field reads only explicitly labeled subscription values and never password/email fields', () => {
  const { api } = fixture();
  const allowed = [
    element('rb-text-field', { label: '订阅链接' }, { value: LINK }),
    element('rb-text-field', {}, { componentLabel: 'Subscription URL', componentType: 'text', value: LINK }),
    element('rb-text-field', { 'aria-label': '复制订阅' }, { value: LINK }),
  ];
  const forbidden = [
    element('rb-text-field', {}, { forbidValue: true }),
    element('rb-text-field', {}, { componentLabel: 'Subscription', componentType: 'password', forbidValue: true }),
    element('rb-text-field', { label: 'Subscription', type: 'email' }, { forbidValue: true }),
    element('rb-text-field', { 'aria-label': 'Subscription' }, { componentLabel: '邮箱', forbidValue: true }),
    element('rb-text-field', { label: '订阅密码' }, { forbidValue: true }),
  ];
  const found = normalize(api.domCandidates(document([...allowed, ...forbidden])));
  assert.deepEqual(found, allowed.map(() => candidate(LINK, 'dom:labeled-input')));
  assert.ok(allowed.every(node => node.valueReads === 1));
  assert.ok(forbidden.every(node => node.valueReads === 0));
});

test('nested open shadow DOM supports native/custom controls and shadow-local labels without credential reads', () => {
  const { api } = fixture();
  const label = element('label', {}, { text: 'Subscription link' });
  const password = element('input', { type: 'password', placeholder: 'Subscription' }, { forbidValue: true });
  const customPassword = element('rb-text-field', {}, { componentLabel: 'Subscription', componentType: 'password', forbidValue: true });
  const input = element('input', { 'aria-labelledby': 'shadow-label' }, { value: LINK });
  const inner = document([input, password, customPassword], { 'shadow-label': label });
  const rb = element('rb-text-field', {}, { componentLabel: '订阅链接', value: LINK, shadowRoot: inner });
  const middle = document([rb]);
  const host = element('app-shell', {}, { shadowRoot: middle });
  const page = document([], {}, { hosts: [host] });
  const found = api.domCandidates(page);
  assert.equal(found.length, 2);
  assert.equal(api.selectCandidates(found).status, 'one');
  assert.equal(password.valueReads, 0);
  assert.equal(customPassword.valueReads, 0);
  assert.deepEqual(page.queries, [CONTROL_SELECTOR, '*']);
  assert.deepEqual(inner.queries, [CONTROL_SELECTOR, '*']);
});

test('open-root depth and cumulative element budgets fail closed instead of returning a partial account', () => {
  const { api } = fixture();
  const visible = element('input', { placeholder: '订阅链接' }, { value: LINK });
  let nested = document([element('input', { placeholder: '订阅链接' }, { value: LINK.replace('TOKEN', 'OTHER-ACCOUNT') })]);
  for (let index = 0; index < 5; index++) nested = document([], {}, { hosts: [element('app-shell', {}, { shadowRoot: nested })] });
  const deepRoot = document([visible], {}, { hosts: [element('app-shell', {}, { shadowRoot: nested })] });
  assert.deepEqual(normalize(api.domCandidates(deepRoot)), []);
  const largeRoot = document([visible], {}, { hosts: Array.from({ length: 4097 }, () => element('div')) });
  assert.deepEqual(normalize(api.domCandidates(largeRoot)), []);
});

test('anchor imports need no label, while plain HTTP(S) anchors need explicit subscription text and URL features', () => {
  const { api } = fixture();
  const doc = document([
    element('a', { href: 'clash://install-config?url=' + encodeURIComponent(LINK) }, { text: 'Clash' }),
    element('a', { href: 'loon://import?nodelist=' + encodeURIComponent(LINK) }),
    element('a', { href: LINK, title: 'Subscription' }),
    element('a', { href: LINK, 'aria-label': '订阅链接' }),
    element('a', { href: LINK }, { text: '复制订阅' }),
    element('a', { href: LINK }, { text: 'Random website' }),
    element('a', { href: 'https://sub.example.com/help' }, { text: 'Subscription' }),
    element('a', { href: 'http://192.168.1.20:8080/link/self-hosted?token=FIXTURE' }, { text: 'Random website' }),
    element('a', { href: 'http://192.168.1.20:8080/link/self-hosted?token=FIXTURE' }, { text: '复制订阅' }),
  ]);
  assert.deepEqual(normalize(api.domCandidates(doc)).map(item => item.signal), ['dom:client-import', 'dom:client-import', 'dom:subscription-link', 'dom:subscription-link', 'dom:subscription-link', 'dom:subscription-link']);
});

test('subscription anchors resolve relative, root-relative and protocol-relative hrefs against document.baseURI', () => {
  const { api } = fixture();
  for (const [href, baseURI, expected] of [
    ['subscribe?token=a+b%2Bc#noCache', 'https://panel.example.com/account/', 'https://panel.example.com/account/subscribe?token=a+b%2Bc#noCache'],
    ['/subscribe?token=FIXTURE', 'https://panel.example.com/account/dashboard', 'https://panel.example.com/subscribe?token=FIXTURE'],
    ['//sub.example.com/sub?token=FIXTURE', 'http://panel.example.com/dashboard', 'http://sub.example.com/sub?token=FIXTURE'],
    // Browsers expose a <base href> override through document.baseURI.
    ['../subscribe?token=FIXTURE', 'https://cdn.example.com/panel/account/', 'https://cdn.example.com/panel/subscribe?token=FIXTURE'],
  ]) {
    const doc = document([element('a', { href }, { text: '复制订阅' })], {}, { baseURI });
    assert.deepEqual(normalize(api.domCandidates(doc)), [candidate(expected, 'dom:subscription-link')]);
  }
  const shadow = document([element('a', { href: '/sub?token=FIXTURE', title: 'Subscription' })]);
  const doc = document([], {}, { hosts: [element('app-shell', {}, { shadowRoot: shadow })], baseURI: 'https://panel.example.com/dashboard' });
  assert.deepEqual(normalize(api.domCandidates(doc)), [candidate('https://panel.example.com/sub?token=FIXTURE', 'dom:subscription-link')]);
});

test('relative extraction remains limited to labeled subscription anchors with a usable HTTP(S) base', () => {
  const { api } = fixture();
  const baseURI = 'https://panel.example.com/dashboard';
  const doc = document([
    element('a', { href: '/subscribe?token=FIXTURE' }, { text: 'Random website' }),
    element('a', { href: '/help' }, { text: 'Subscription' }),
    element('a', { href: '/invite?token=FIXTURE' }, { text: 'Subscription' }),
    element('a', { href: '/sub?token=FIXTURE' }, { text: 'Subscription payment' }),
    element('button', { 'data-subscribe-url': '/subscribe?token=FIXTURE' }, { text: 'Subscription' }),
    element('button', { 'data-clipboard-text': '/subscribe?token=FIXTURE' }, { text: 'Subscription' }),
    element('input', { placeholder: 'Subscription URL' }, { value: '/subscribe?token=FIXTURE' }),
  ], {}, { baseURI });
  assert.deepEqual(normalize(api.domCandidates(doc)), []);
  for (const invalidBase of [undefined, '', 'not a URL', 'file:///tmp/dashboard', 'javascript:alert(1)', 'https://user:pass@panel.example.com/']) {
    assert.deepEqual(normalize(api.domCandidates(document([
      element('a', { href: '/subscribe?token=FIXTURE' }, { text: 'Subscription' }),
      element('a', { href: '//sub.example.com/subscribe?token=FIXTURE' }, { text: 'Subscription' }),
    ], {}, { baseURI: invalidBase }))), []);
  }
});

test('relative anchor resolution rejects dangerous schemes, credentials and normalization tricks', () => {
  const { api } = fixture();
  const hrefs = ['javascript:alert(1)', 'data:text/plain,/subscribe?token=FIXTURE', 'ftp://sub.example.com/subscribe?token=FIXTURE',
    'https:sub.example.com/subscribe?token=FIXTURE', '//user:pass@sub.example.com/subscribe?token=FIXTURE',
    '//user@sub.example.com/subscribe?token=FIXTURE', '//@sub.example.com/subscribe?token=FIXTURE',
    '/subscribe?token=FIXTURE\n', ' /subscribe?token=FIXTURE', '/\\sub.example.com/subscribe?token=FIXTURE',
    '/subscribe?token=FIXTURE%0a', ''];
  const doc = document(hrefs.map(href => element('a', { href }, { text: 'Subscription' })), {}, { baseURI: 'https://panel.example.com/dashboard' });
  assert.deepEqual(normalize(api.domCandidates(doc)), []);
});

test('ordinary invitation/payment URLs and whole-page/script URLs are never selected', () => {
  const { api } = fixture();
  const doc = document([
    element('a', { href: 'https://panel.example.com/invite?token=REFERRAL' }, { text: 'Subscription invite' }),
    element('a', { href: 'https://pay.example.com/payment?token=PAYMENT' }, { text: 'Subscription payment' }),
    element('button', { 'data-clipboard-text': 'https://panel.example.com/invite?token=REFERRAL' }, { text: 'Copy invitation' }),
    element('button', { 'data-clipboard-text': 'https://pay.example.com/invoice?token=PAYMENT' }, { text: '支付' }),
    element('a', { href: 'https://panel.example.com/dashboard' }, { text: 'Portal' }),
    element('script', {}, { text: 'const url="' + LINK + '"' }),
  ]);
  assert.deepEqual(normalize(api.domCandidates(doc)), []);
  assert.deepEqual(doc.queries, [CONTROL_SELECTOR, '*']);
});

test('selectCandidates deduplicates identical links and prefers a generic same-account URL', () => {
  const { api } = fixture();
  const list = [candidate(LINK + '&flag=clash'), candidate(LINK + '&format=sing-box'), candidate(LINK, 'dom:clipboard'), candidate(LINK)];
  assert.deepEqual(normalize(api.selectCandidates(list)), { status: 'one', candidate: candidate(LINK) });
  assert.deepEqual(normalize(api.selectCandidates([...list].reverse())), { status: 'one', candidate: candidate(LINK) });
  assert.deepEqual(normalize(api.selectCandidates([candidate(LINK + '&format=clash'), candidate(LINK, 'dom:clipboard')])), { status: 'one', candidate: candidate(LINK, 'dom:clipboard') });
  assert.deepEqual(normalize(api.selectCandidates([candidate('https://sub.example.com/link/account?clash=1'), candidate('https://sub.example.com/link/account')])), { status: 'one', candidate: candidate('https://sub.example.com/link/account') });
});

test('format-only variants keep a complete necessary format URL and use stable selection', () => {
  const { api } = fixture();
  const list = [candidate(LINK + '&format=surge'), candidate(LINK + '&format=clash')];
  const selected = normalize(api.selectCandidates(list));
  assert.equal(selected.status, 'one');
  assert.ok(list.some(item => item.url === selected.candidate.url));
  assert.ok(selected.candidate.url.includes('&format='));
  assert.deepEqual(normalize(api.selectCandidates([...list].reverse())), selected);
});

test('different account tokens, hosts, paths, fragments and unknown query formats are ambiguous', () => {
  const { api } = fixture();
  for (const other of [LINK.replace('TOKEN', 'SECOND-ACCOUNT'), LINK.replace('sub.example.com', 'other.example.com'), LINK.replace('/client/', '/other/'), LINK + '#noCache', LINK + '&format=account-identity']) {
    assert.deepEqual(normalize(api.selectCandidates([candidate(LINK), candidate(other)])), { status: 'ambiguous', count: 2 });
  }
  const first = 'https://sub.example.com/sub?token=a&token=b';
  const reverse = 'https://sub.example.com/sub?token=b&token=a';
  assert.deepEqual(normalize(api.selectCandidates([candidate(first), candidate(reverse)])), { status: 'ambiguous', count: 2 });
  assert.equal(api.selectCandidates([candidate(LINK + '&foo=bar'), candidate(LINK.replace('?token=', '?foo=bar&token='))]).status, 'one');
});

test('candidate identity preserves literal plus and distinguishes it from encoded spaces in keys and values', () => {
  const { api } = fixture();
  for (const [left, right] of [['token=a+b', 'token=a%20b'], ['account+key=value', 'account%20key=value']]) {
    const list = [candidate('https://sub.example.com/sub?' + left), candidate('https://sub.example.com/sub?' + right)];
    assert.deepEqual(normalize(api.selectCandidates(list)), { status: 'ambiguous', count: 2 });
    assert.deepEqual(normalize(api.selectCandidates([...list].reverse())), { status: 'ambiguous', count: 2 });
  }
  for (const [left, right] of [['token=a+b', 'token=a%2Bb'], ['account+key=value', 'account%2Bkey=value']]) {
    const list = [candidate('https://sub.example.com/sub?' + left), candidate('https://sub.example.com/sub?' + right + '&format=clash')];
    assert.deepEqual(normalize(api.selectCandidates(list)), { status: 'one', candidate: list[0] });
  }
});

test('candidate identity ignores key order and known formats while preserving duplicate order and bare flags', () => {
  const { api } = fixture();
  const generic = candidate('https://sub.example.com/sub?token=a+b&account&token=c');
  const reordered = candidate('https://sub.example.com/sub?account&token=a%2Bb&format=clash&token=c');
  assert.deepEqual(normalize(api.selectCandidates([generic, reordered])), { status: 'one', candidate: generic });
  for (const query of ['token=c&account&token=a+b', 'token=a+b&account=&token=c', 'token=a+b&account&token=c&clash']) {
    assert.deepEqual(normalize(api.selectCandidates([generic, candidate('https://sub.example.com/sub?' + query)])), { status: 'ambiguous', count: 2 });
  }
  assert.deepEqual(normalize(api.selectCandidates([generic, candidate(generic.url + '&clash=1')])), { status: 'one', candidate: generic });
});

test('malformed percent encodings fail candidate selection closed without choosing the valid remainder', () => {
  const { api } = fixture();
  for (const suffix of ['?token=%', '?token=%2', '?token=%ZZ', '?token=%C3%28', '?%C3%28=value', '?format=%ZZ', '/%ZZ?token=FIXTURE', '#%ZZ']) {
    const invalid = candidate('https://sub.example.com/sub' + suffix);
    assert.deepEqual(normalize(api.selectCandidates([invalid])), { status: 'none', count: 0 });
    assert.deepEqual(normalize(api.selectCandidates([candidate(LINK), invalid])), { status: 'none', count: 0 });
    assert.deepEqual(normalize(api.selectCandidates([invalid, candidate(LINK)])), { status: 'none', count: 0 });
  }
});

test('none/invalid candidates stay empty and untrusted signal text is never reflected', () => {
  const { api } = fixture();
  assert.deepEqual(normalize(api.selectCandidates([])), { status: 'none', count: 0 });
  assert.deepEqual(normalize(api.selectCandidates([candidate('ftp://sub.example.com/a'), null])), { status: 'none', count: 0 });
  const one = api.selectCandidates([candidate(LINK, LINK)]);
  assert.equal(one.candidate.signal, 'unknown');
  assert.equal(api.selectCandidates([candidate(LINK, LINK), candidate(LINK.replace('TOKEN', 'OTHER'), LINK)]).status, 'ambiguous');
});

test('siteNames reads brand metadata, title parts and limited header labels while preserving Chinese', () => {
  const { api } = fixture();
  const doc = brandDocument({
    title: '良心云 - 用户中心 | Dashboard',
    metas: [element('meta', { content: '良心云' }), element('meta', { content: '星网' })],
    brands: [element('a', { 'aria-label': 'SSONE' }), element('span', { 'data-brand': '都是梦' }),
      element('img', { alt: 'Kitty' }), element('span', {}, { text: '赔钱机场' })],
  });
  assert.deepEqual(normalize(api.siteNames(doc)), ['良心云', '星网', 'SSONE', '都是梦', 'Kitty', '赔钱机场']);
  assert.deepEqual(doc.queries, [SITE_META_SELECTOR, SITE_BRAND_SELECTOR]);
  assert.deepEqual(doc.forbiddenReads, []);
});

test('siteNames strips email, URLs, long tokens, keyed secrets and controls before returning names', () => {
  const { api } = fixture();
  const doc = brandDocument({ title: '自托管机场 | alice@example.com | https://private.example.com/sub?token=PRIVATE | Login',
    metas: [element('meta', { content: '品牌甲 PRIVATESESSIONTOKEN1234567890123456789' }),
      element('meta', { content: '品牌乙 token=short-secret' }), element('meta', { content: '品牌丙\u0000\u0007\u202e\u200b' }),
      element('meta', { content: '品牌丁 ftp://private.example.com/private' }),
      element('meta', { content: '品牌戊 https:\u0000//private.example.com/sub?token=PRIVATE' }),
      element('meta', { content: '品牌己 %41%42%43%44%45%46%47%48' }),
      element('meta', { content: '品牌庚 session=short-secret' }), element('meta', { content: '品牌辛 1234567890' })] });
  const names = normalize(api.siteNames(doc));
  assert.deepEqual(names, ['品牌甲', '品牌乙', '品牌丙', '品牌丁', '品牌戊', '品牌己', '品牌庚', '品牌辛', '自托管机场']);
  const serialized = JSON.stringify(names);
  assert.doesNotMatch(serialized, /alice|@|private|secret|token|session|https?:|ftp:|%41|1234567890|[\u0000-\u001f]/i);
});

test('siteNames is case-insensitively unique, bounded to twelve names and at most eighty UTF-16 characters', () => {
  const { api } = fixture();
  const doc = brandDocument({ title: 'unused', metas: [element('meta', { content: 'Brand' }), element('meta', { content: 'brand' }),
    element('meta', { content: '云'.repeat(100) }), element('meta', { content: '云'.repeat(79) + '🚀' }),
    ...Array.from({ length: 30 }, (_, index) => element('meta', { content: '机场' + index }))] });
  const names = normalize(api.siteNames(doc));
  assert.equal(names.length, 12);
  assert.equal(names.filter(value => /^brand$/i.test(value)).length, 1);
  assert.ok(names.every(name => name.length <= 80));
  assert.equal(names[1], '云'.repeat(80));
  assert.equal(names[2], '云'.repeat(79));
  assert.deepEqual(doc.queries, [SITE_META_SELECTOR], 'stop reading after obtaining twelve candidates');
});

test('siteNames never reads account form values, generic page text, scripts or storage', () => {
  const f = fixture();
  const credential = element('input', { 'aria-label': 'Private account', 'data-brand': 'Do not return' }, { forbidValue: true });
  const password = element('rb-text-field', { label: 'password' }, { forbidValue: true, inForm: true });
  const formBrand = element('span', {}, { text: 'ACCOUNT-NAME', inForm: true });
  const containingForm = element('div', {}, { text: 'ACCOUNT-NAME', containsForm: true });
  let formTextReads = 0;
  for (const node of [credential, password, formBrand, containingForm]) {
    Object.defineProperty(node, 'textContent', { get() { formTextReads++; assert.fail('account form text was read'); } });
  }
  const doc = brandDocument({ title: '自建品牌 - Dashboard', brands: [credential, password, formBrand, containingForm,
    element('a', { title: '自建品牌' }), element('script', {}, { text: LINK })] });
  assert.deepEqual(normalize(f.api.siteNames(doc)), ['自建品牌']);
  assert.equal(credential.valueReads, 0);
  assert.equal(password.valueReads, 0);
  assert.equal(formTextReads, 0);
  assert.deepEqual(doc.forbiddenReads, []);
  assert.deepEqual(f.accesses, []);
  assert.deepEqual(f.logs, []);
});

test('siteNames limits metadata/header inspection and tolerates inaccessible metadata without broad fallback', () => {
  const { api } = fixture();
  const metas = Array.from({ length: 25 }, () => element('meta', { content: 'Dashboard' }));
  const brands = Array.from({ length: 33 }, () => element('span', {}, { text: 'Login' }));
  let extraReads = 0;
  metas[24] = { getAttribute() { extraReads++; assert.fail('metadata inspection exceeded budget'); } };
  brands[32] = { getAttribute() { extraReads++; assert.fail('header inspection exceeded budget'); }, get tagName() { extraReads++; assert.fail('header inspection exceeded budget'); } };
  assert.deepEqual(normalize(api.siteNames(brandDocument({ metas, brands }))), []);
  assert.equal(extraReads, 0);
  const doc = brandDocument({ title: 'Only title brand' });
  doc.querySelectorAll = () => { throw new Error('unavailable fixture query'); };
  assert.deepEqual(normalize(api.siteNames(doc)), ['Only title brand']);
  assert.deepEqual(normalize(api.siteNames(null)), []);
});

test('all operations remain in memory with no secret logs, network, storage or document-wide reads', () => {
  const f = fixture();
  const links = f.api.networkCandidates({ data: { subscribe_url: LINK }, password: 'PRIVATE-PASSWORD', token: 'PRIVATE-SESSION' }, 'https://api.example.com/api/v1/user/getSubscribe');
  links.push(...f.api.domCandidates(document([element('button', { 'data-clipboard-text': LINK }, { text: '复制订阅' })])));
  assert.equal(f.api.selectCandidates(links).status, 'one');
  assert.deepEqual(normalize(f.api.siteNames(brandDocument({ title: '无凭据品牌 - Dashboard' }))), ['无凭据品牌']);
  assert.deepEqual(f.accesses, []);
  assert.deepEqual(f.logs, []);
});
