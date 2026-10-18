// Real-browser automatic-flow acceptance. All account/source data below is synthetic.
// Run after build.mjs. No popup, reload, button interaction or existing profile is used.
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { buildEntries } from './build.mjs';

const extensionDirectory = path.dirname(fileURLToPath(import.meta.url));
const RUNTIME_FILES = ['manifest.json', 'background.js', 'core.mjs', 'auto-match.mjs', 'site-access.mjs', 'local-fetch.mjs',
  'local-transport.js', 'page-main.bundle.js', 'page-bridge.bundle.js', 'popup.html', 'popup.js', 'popup.css',
  'README.md', 'CHANGELOG.md', 'build.mjs', 'extractors.js', 'page-hook.js', 'bridge.js'];
const CASE_TIMEOUT_MS = 8000;
const FRAGMENT = '#flowDedup=account&ua=fixture%20ua&cacheKey=fixture-cache';
const PREVIEW_FRAGMENT = '#flowDedup=account&ua=fixture%20ua';
const NODES = [
  { name: 'Fixture HK', type: 'trojan', server: 'node-one.example.com', port: 443, password: 'fixture-node-one' },
  { name: 'Fixture JP', type: 'ss', server: 'node-two.example.com', port: 443, cipher: 'aes-128-gcm', password: 'fixture-node-two' },
];
const clone = value => structuredClone(value);
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function check(condition, code) { if (!condition) { const error = new Error(code); error.code = code; throw error; } }
function withoutURL(sub) { const copy = { ...sub }; delete copy.url; return copy; }
function safeCode(error) { return /^[a-z0-9_]+$/.test(error?.code || '') ? error.code : 'unexpected_error'; }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }
async function within(promise, code, timeout = CASE_TIMEOUT_MS) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => { const error = new Error(code); error.code = code; reject(error); }, timeout); })]); }
  finally { clearTimeout(timer); }
}

function subscription(name, url) {
  return { name, displayName: name, source: 'remote', url: url + FRAGMENT, ua: 'fixture-ua', proxy: 'PROXY',
    process: [{ type: 'Script Operator', args: { content: '// fixture-keep-script', arguments: { fixture: true } } }, { type: 'Sort Operator' }],
    icon: 'fixture-icon', custom: { preserve: true } };
}

function fixtures() {
  const sources = id => ({ old: `https://${id}-source.example.com/subscribe?token=OLD-${id}-FIXTURE`,
    candidate: `https://${id}-source.example.com/subscribe?token=NEW-${id}-FIXTURE` });
  const good = [
    { id: 'ssone', label: 'SSONE DOM', origin: 'https://m.ssone.uk', brand: 'SSONE', name: 'SSONE', mode: 'clipboard' },
    { id: 'liangxin', label: 'Liangxin fetch', origin: 'https://xn--9kqz23b19z.com', brand: '良心云', name: 'Internal Liangxin fixture', mode: 'fetch', api: 'https://apiweb.liangxin.xyz/api/v1/user/getSubscribe' },
    { id: 'peiqian', label: 'Peiqian input', origin: 'https://www.xn--mes358aby2apfg.com', brand: '赔钱机场', name: 'Internal Peiqian fixture', mode: 'input' },
    { id: 'kitty', label: 'Kitty XHR', origin: 'https://kitty.sb', brand: 'Kitty Network', name: 'Internal Kitty fixture', mode: 'xhr', api: 'https://moka.tainaka-ritsu.com/api/v3/user/getSubscribe' },
    { id: 'star', label: 'Starnetwork fetch', origin: 'https://ad.zstarzzz.cc', brand: '星网-Starnetwork', name: 'Internal Star fixture', mode: 'fetch', api: 'https://ad.zstarzzz.cc/api/v1/user/getSubscribe' },
    { id: 'dream', label: 'Doushimeng import', origin: 'https://therun.6128888.xyz', brand: '都是梦', name: 'Internal Dream fixture', mode: 'import' },
    { id: 'unknown', label: 'Unknown HTTPS DOM', origin: 'https://unknown-airport.example.com', brand: '任意演示机场', name: 'Unrelated catalog identifier', mode: 'attribute' },
    { id: 'httpip', label: 'HTTP IP fetch', origin: 'http://192.0.2.99:8080', brand: 'HTTP IP 演示机场', name: 'IP catalog identifier', mode: 'fetch', api: 'http://192.0.2.99:8080/api/v1/user/getSubscribe',
      old: 'http://198.51.100.24:9090/subscribe?token=OLD-IP-FIXTURE', candidate: 'http://198.51.100.24:9090/subscribe?token=NEW-IP-FIXTURE' },
    { id: 'kitty_cdn', label: 'Unique Kitty brand CDN rotation', origin: 'https://kitty-cdn-page.example.com', brand: 'Kitty Network', name: 'Kitty', mode: 'attribute',
      old: 'https://kitty-old-cdn.example.com/subscribe?token=OLD-KITTY-FIXTURE', candidate: 'https://kitty-new-cdn.example.com/new-subscribe?token=NEW-KITTY-FIXTURE', expectedMatchMethod: 'unique_name_new_origin' },
    { id: 'peiqian_cdn', label: 'Unique Peiqian brand CDN rotation', origin: 'https://peiqian-cdn-page.example.com', brand: '赔钱机场', name: '赔钱', mode: 'attribute',
      old: 'https://peiqian-old-cdn.example.com/subscribe?token=OLD-PEIQIAN-FIXTURE', candidate: 'https://peiqian-new-cdn.example.com/subscribe?token=NEW-PEIQIAN-FIXTURE', expectedMatchMethod: 'unique_name_new_origin' },
    { id: 'relative_anchor', label: 'Relative subscription anchor', origin: 'https://relative-panel.example.com', brand: 'Relative fixture', name: 'Relative fixture', mode: 'relative',
      old: 'https://relative-panel.example.com/subscribe?token=OLD-RELATIVE-FIXTURE', candidate: 'https://relative-panel.example.com/subscribe?token=NEW-RELATIVE-FIXTURE' },
    { id: 'ipv6_panel', label: 'Native IPv6 registration and DOM capture', origin: 'https://[2001:db8::99]:8443', brand: 'IPv6 演示机场', name: 'IPv6 fixture', mode: 'attribute' },
  ].map(fixture => ({ ...sources(fixture.id), ...fixture, expectedStatus: 'updated' }));
  const bad = [
    { id: 'catalog_ambiguous', label: 'Catalog ambiguity stops', origin: 'https://catalog-ambiguous.example.com', brand: 'Unknown account', mode: 'attribute',
      candidate: 'https://shared-source.example.com/subscribe?token=RESET-FIXTURE', expectedStatus: 'error', expectedCode: 'auto_match_ambiguous', operations: ['GET:catalog'] },
    { id: 'dom_ambiguous', label: 'Page ambiguity stops', origin: 'https://dom-ambiguous.example.com', brand: 'Ambiguous page', mode: 'ambiguous',
      candidate: 'https://ambiguous-source.example.com/subscribe?token=ONE-FIXTURE', second: 'https://ambiguous-source.example.com/subscribe?token=TWO-FIXTURE',
      expectedStatus: 'error', expectedCode: 'candidate_ambiguous', operations: [] },
    { id: 'unmatched', label: 'Cross-origin unmatched stops', origin: 'https://unmatched.example.com', brand: 'Unmapped brand', mode: 'attribute',
      candidate: 'https://unmatched-source.example.com/subscribe?token=UNMATCHED-FIXTURE', expectedStatus: 'error', expectedCode: 'auto_match_none', operations: ['GET:catalog'] },
    { id: 'no_brand', label: 'Cross-origin without brand stops', origin: 'https://no-brand.example.com', brand: '', name: 'Unbranded catalog record', mode: 'attribute',
      old: 'https://unbranded-old-source.example.com/subscribe?token=OLD-NOBRAND-FIXTURE', candidate: 'https://unbranded-new-source.example.com/subscribe?token=NEW-NOBRAND-FIXTURE',
      expectedStatus: 'error', expectedCode: 'auto_match_none', operations: ['GET:catalog'] },
    { ...sources('warning'), id: 'warning', label: 'Invalid warning nodes stop', origin: 'https://warning.example.com', brand: 'Warning fixture', name: 'Invalid preview fixture', mode: 'attribute',
      expectedStatus: 'error', expectedCode: 'candidate_has_no_real_nodes', operations: ['GET:catalog', 'GET:sub', 'POST:preview'], warning: true },
    { id: 'query_bytes', label: 'Distinct plus and space accounts stop', origin: 'https://query-bytes.example.com', brand: 'Query fixture', mode: 'ambiguous',
      candidate: 'https://query-source.example.com/subscribe?token=ACCOUNT+ONE', second: 'https://query-source.example.com/subscribe?token=ACCOUNT%20ONE',
      expectedStatus: 'error', expectedCode: 'candidate_ambiguous', operations: [] },
    { ...sources('mapped_loopback'), id: 'mapped_loopback', label: 'Mapped and expanded loopback nodes stop', origin: 'https://mapped-loopback.example.com', brand: 'Loopback fixture', name: 'Loopback fixture', mode: 'attribute',
      expectedStatus: 'error', expectedCode: 'candidate_has_no_real_nodes', operations: ['GET:catalog', 'GET:sub', 'POST:preview'], loopback: true },
    { ...sources('late_ambiguity'), id: 'late_ambiguity', label: 'Late ambiguity cancels a held preview', origin: 'https://late-ambiguity.example.com', brand: 'Late fixture', name: 'Late fixture', mode: 'attribute',
      second: 'https://late_ambiguity-source.example.com/subscribe?token=SECOND-ACCOUNT-FIXTURE', lateAmbiguity: true,
      expectedStatus: 'error', expectedCode: 'candidate_ambiguous', operations: ['GET:catalog', 'GET:sub', 'POST:preview'] },
  ];
  const crossResponse = [
    ['fetch_xhr_distinct', 'fetch', 'xhr', false], ['xhr_fetch_distinct', 'xhr', 'fetch', false],
    ['fetch_xhr_same', 'fetch', 'xhr', true], ['xhr_fetch_same', 'xhr', 'fetch', true],
  ].map(([id, mode, lateNetwork, same]) => {
    const urls = sources(id), origin = 'https://' + id.replaceAll('_', '-') + '.example.com';
    return { ...urls, id, label: `${mode} then ${lateNetwork} ${same ? 'same candidate continues' : 'distinct candidates stop'}`,
      origin, brand: id, name: id, mode, api: origin + '/api/v1/user/getSubscribe?response=one', secondAPI: origin + '/api/v1/user/getSubscribe?response=two',
      second: same ? urls.candidate : urls.candidate.replace('NEW-', 'SECOND-'), lateNetwork, holdPreview: true,
      expectedStatus: same ? 'updated' : 'error', ...(same ? {} : { expectedCode: 'candidate_ambiguous', operations: ['GET:catalog', 'GET:sub', 'POST:preview'] }) };
  });
  const leaving = ['blank', 'frontend', 'unobserved'].map(destination => {
    const id = 'leave_' + destination;
    return { ...sources(id), id, label: 'Held preview leaves for ' + destination, origin: 'https://leave-' + destination + '.example.com',
      brand: id, name: id, mode: 'attribute', holdPreview: true, navigation: destination, expectedStatus: null,
      operations: ['GET:catalog', 'GET:sub', 'POST:preview'] };
  });
  const untrusted = { id: 'untrusted_brand', label: 'Broad browser grant cannot trust a spoofed brand', origin: 'https://untrusted-spoof.example.com',
    brand: 'Kitty Network', candidate: 'https://kitty-new-cdn.example.com/new-subscribe?token=FORGED-UNTRUSTED-FIXTURE', mode: 'attribute',
    untrusted: true, expectedStatus: null, operations: [] };
  const withdrawn = [false, true].map(reappear => {
    const id = reappear ? 'dom_reappears' : 'dom_withdrawn';
    return { ...sources(id), id, label: reappear ? 'Withdrawn same DOM URL revalidates without retiring document' : 'DOM withdrawal cancels a held preview',
      origin: 'https://' + id.replaceAll('_', '-') + '.example.com', brand: id, name: id, mode: 'attribute', holdPreview: true,
      domWithdrawal: true, reappear, expectedStatus: reappear ? 'updated' : null,
      operations: reappear ? ['GET:catalog', 'GET:sub', 'POST:preview', 'GET:catalog', 'GET:sub', 'POST:preview', 'GET:sub', 'PATCH:sub', 'GET:sub'] :
        ['GET:catalog', 'GET:sub', 'POST:preview'] };
  });
  const offline = { ...sources('offline_relay'), id: 'offline_relay', label: 'Offline relay retries leave no owned tabs',
    origin: 'https://offline-relay.example.com', brand: 'Offline fixture', name: 'Offline fixture', mode: 'attribute', offlineRelay: true,
    expectedStatus: 'error', expectedCode: 'local_transport_not_ready', operations: [], timeout: 20000 };
  const cases = [...good, ...bad, untrusted, ...crossResponse, ...leaving, ...withdrawn, offline]
    .map(fixture => ({ ...fixture, pageURL: fixture.origin + '/__scki_fixture__/' + fixture.id }));
  const catalog = cases.filter(fixture => fixture.name).map(fixture => subscription(fixture.name, fixture.old));
  const base = catalog.find(sub => sub.name === 'SSONE');
  catalog.push({ ...clone(base), name: 'SSONE-copy5806' }, { ...clone(base), name: 'SSONE-copy9268' });
  catalog.push(subscription('Shared account one', 'https://shared-source.example.com/subscribe?token=ACCOUNT-ONE-FIXTURE'),
    subscription('Shared account two', 'https://shared-source.example.com/subscribe?token=ACCOUNT-TWO-FIXTURE'));
  return { cases, catalog };
}

function pageHTML(fixture) {
  const url = escapeHTML(fixture.candidate);
  let body = '';
  if (fixture.mode === 'clipboard') body = `<button data-clipboard-text="${url}">复制订阅链接</button>`;
  if (fixture.mode === 'attribute') body = `<button data-subscribe-url="${url}">订阅链接</button>`;
  if (fixture.mode === 'input') body = `<label for="subscription-link">订阅链接</label><input id="subscription-link" type="url" readonly value="${url}">`;
  if (fixture.mode === 'import') body = `<a href="${escapeHTML('clash://install-config?url=' + encodeURIComponent(fixture.candidate))}">一键导入订阅</a>`;
  if (fixture.mode === 'relative') body = `<a href="${escapeHTML(new URL(fixture.candidate).pathname + new URL(fixture.candidate).search)}">复制订阅链接</a>`;
  if (fixture.mode === 'ambiguous') body = `<button data-subscribe-url="${url}">订阅一</button><button data-subscribe-url="${escapeHTML(fixture.second)}">订阅二</button>`;
  if (fixture.mode === 'fetch') body = `<script>fetch(${JSON.stringify(fixture.api)}).then(response => response.json()).catch(() => {});</script>`;
  if (fixture.mode === 'xhr') body = `<script>{const request = new XMLHttpRequest();request.open('GET', ${JSON.stringify(fixture.api)});request.responseType='json';request.send();}</script>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta property="og:site_name" content="${escapeHTML(fixture.brand)}"><title>${escapeHTML(fixture.brand)} - Dashboard</title></head><body><h1 data-brand="${escapeHTML(fixture.brand)}">${escapeHTML(fixture.brand)}</h1>${body}</body></html>`;
}

async function startServer(handler) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const server = http.createServer((request, response) => {
      Promise.resolve(handler(request, response)).catch(() => {
        if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'application/json' });
        if (!response.writableEnded) response.end('{"status":"error"}');
      });
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const port = server.address().port;
    if (![38324, 14122].includes(port)) return { server, origin: 'http://127.0.0.1:' + port };
    await closeServer(server);
  }
  check(false, 'mock_ports_unavailable');
}

async function readJSON(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    check(total <= 4 * 1024 * 1024, 'mock_body_too_large');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { check(false, 'mock_body_invalid'); }
}

async function mockServices(cases, catalog) {
  const state = { subs: new Map(catalog.map(sub => [sub.name, clone(sub)])), operations: [], corsRejected: 0, failure: null, previewGates: new Map(), previewHeld: new Set() };
  const byName = new Map(cases.filter(fixture => fixture.name).map(fixture => [fixture.name, fixture]));
  const frontend = await startServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end('<!doctype html><meta charset="utf-8"><title>Mock local frontend</title><p>Local transport fixture</p>');
  });
  let backend;
  try {
    backend = await startServer(async (request, response) => {
      if (request.headers.origin !== frontend.origin) {
        state.corsRejected += 1;
        response.writeHead(403); response.end(); return;
      }
      const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': frontend.origin,
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin', 'Cache-Control': 'no-store' };
      if (request.method === 'OPTIONS') { response.writeHead(204, headers); response.end(); return; }
      const url = new URL(request.url, 'http://127.0.0.1');
      const kind = url.pathname === '/api/subs' ? 'catalog' : url.pathname === '/api/preview/sub' ? 'preview' : 'sub';
      const operation = { method: request.method, kind };
      state.operations.push(operation);
      try {
        let data;
        if (request.method === 'GET' && url.pathname === '/api/subs') data = [...state.subs.values()];
        else if (request.method === 'POST' && url.pathname === '/api/preview/sub') {
          const body = await readJSON(request);
          const before = state.subs.get(body.name);
          const fixture = byName.get(body.name);
          operation.name = body.name;
          check(before && fixture && url.search === '?target=JSON', 'preview_scope_failed');
          check(body.noCache === true && body.ignoreFailedRemoteSub === false, 'preview_cache_options_failed');
          check(body.url === fixture.candidate + PREVIEW_FRAGMENT, 'preview_fragment_failed');
          const originalFields = { ...body }; delete originalFields.url; delete originalFields.noCache; delete originalFields.ignoreFailedRemoteSub;
          check(equal(originalFields, withoutURL(before)), 'preview_process_preservation_failed');
          if ((fixture.lateAmbiguity || fixture.holdPreview) && !state.previewHeld.has(body.name)) {
            state.previewHeld.add(body.name);
            await new Promise(resolve => state.previewGates.set(body.name, resolve));
          }
          const nodes = fixture.loopback ? [
            { ...NODES[0], server: '0:0:0:0:0:0:0:1' }, { ...NODES[1], server: '::ffff:127.0.0.1' },
            { ...NODES[0], server: 'localhost.' },
          ] : fixture.warning ? [{ ...NODES[0], name: '订阅无效，请打开官网重新导入' }] : NODES;
          data = { original: nodes, processed: nodes };
        } else if (url.pathname.startsWith('/api/sub/')) {
          const name = decodeURIComponent(url.pathname.slice('/api/sub/'.length));
          const before = state.subs.get(name);
          operation.name = name;
          check(before, 'subscription_scope_failed');
          if (request.method === 'GET') data = before;
          else if (request.method === 'PATCH') {
            const body = await readJSON(request);
            const fixture = byName.get(name);
            check(equal(Object.keys(body), ['url']), 'patch_fields_failed');
            check(fixture && body.url === fixture.candidate + FRAGMENT, 'patch_fragment_failed');
            state.subs.set(name, { ...before, url: body.url }); data = {};
          } else check(false, 'mock_method_failed');
        } else check(false, 'mock_path_failed');
        response.writeHead(200, headers); response.end(JSON.stringify({ status: 'success', data }));
      } catch (error) {
        state.failure = safeCode(error);
        response.writeHead(500, headers); response.end('{"status":"error"}');
      }
    });
    return { state, frontend, backend };
  } catch (error) { await closeServer(frontend.server); throw error; }
}

async function closeServer(server) {
  if (!server.listening) return;
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise(resolve => server.close(resolve));
}

async function poll(checkValue, timeout = CASE_TIMEOUT_MS) {
  const deadline = Date.now() + timeout;
  do { const value = await checkValue(); if (value) return value; await delay(100); } while (Date.now() < deadline);
  return null;
}

async function main() {
  let context, services, profileDirectory, temporaryRoot, worker;
  let label = 'bootstrap', passed = 0;
  const report = { status: 'running', cases: [] };
  try {
    temporaryRoot = await fs.realpath(process.env.SCKI_E2E_ARTIFACT_DIRECTORY || os.tmpdir());
    const moduleName = process.env.PLAYWRIGHT_MODULE_PATH || 'playwright';
    const { chromium } = createRequire(import.meta.url)(moduleName);
    const executablePath = process.env.BROWSER_EXECUTABLE || (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined);
    const { cases, catalog } = fixtures();
    const executionCases = process.env.SCKI_E2E_CASE_ID ? cases.filter(fixture => fixture.id === process.env.SCKI_E2E_CASE_ID) : cases;
    check(executionCases.length > 0, 'fixture_case_not_found');
    report.total = executionCases.length;
    services = await mockServices(cases, catalog);
    profileDirectory = await fs.mkdtemp(path.join(temporaryRoot, 'scki-browser-e2e-'));
    if (process.env.SCKI_E2E_KEEP_ARTIFACTS === '1') console.log('Private fixture artifacts: ' + profileDirectory);
    const runtimeDirectory = path.join(profileDirectory, 'extension-under-test');
    await fs.mkdir(runtimeDirectory);
    await Promise.all(RUNTIME_FILES.map(file => fs.copyFile(path.join(extensionDirectory, file), path.join(runtimeDirectory, file))));
    // Build only the disposable runtime, never the checked-out source bundles.
    buildEntries(runtimeDirectory);
    const manifestPath = path.join(runtimeDirectory, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    check(manifest.permissions.includes('scripting'), 'fixture_manifest_scripting_missing');
    check(manifest.content_scripts.every(script => script.js.includes('local-transport.js')), 'external_static_scripts_present');
    // Browser capability is deliberately wider than website consent. This copy
    // must prove an untrusted page remains harmless despite the broad grant.
    manifest.host_permissions = ['http://*/*', 'https://*/*'];
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    // Fixture probes exist only in this private copy, never in production.
    await fs.appendFile(path.join(runtimeDirectory, 'background.js'), `
// Private acceptance probes, with no URLs/tokens retained from messages.
globalThis.__fixtureWhenIdle = whenIdle;
globalThis.__fixtureRefreshAccess = () => siteAccess.refresh();
globalThis.__fixtureEvents = {};
globalThis.__fixtureTabLifecycle = { created: 0, removed: 0 };
chrome.tabs.onCreated.addListener(() => { globalThis.__fixtureTabLifecycle.created += 1; });
chrome.tabs.onRemoved.addListener(() => { globalThis.__fixtureTabLifecycle.removed += 1; });
chrome.runtime.onMessage.addListener((message, sender) => {
  if (!['PAGE_CONTEXT','OBSERVED_SUBSCRIPTION','OBSERVATION_AMBIGUOUS','OBSERVATION_INVALIDATED','DOCUMENT_RETIRED'].includes(message?.type)) return;
  try {
    const origin = new URL(sender.url).origin;
    const counts = globalThis.__fixtureEvents[origin] ||= {};
    counts[message.type] = (counts[message.type] || 0) + 1;
  } catch {}
});
`);
    context = await chromium.launchPersistentContext(profileDirectory, { executablePath, ...(executablePath ? {} : { channel: 'chromium' }), headless: true,
      args: ['--disable-extensions-except=' + runtimeDirectory, '--load-extension=' + runtimeDirectory,
        '--no-first-run', '--no-default-browser-check', '--no-proxy-server', '--disable-background-networking', '--disable-component-update', '--disable-sync'] });
    worker = context.serviceWorkers().find(item => item.url().endsWith('/background.js')) ||
      await context.waitForEvent('serviceworker', { predicate: item => item.url().endsWith('/background.js'), timeout: 10000 });
    const initialized = await poll(() => worker.evaluate(async () => Boolean((await chrome.storage.local.get('settings')).settings)));
    check(initialized, 'initialization_timeout');
    await worker.evaluate(async ({ settings, origins }) => {
      await chrome.storage.local.clear(); await chrome.storage.session.clear();
      await chrome.storage.local.set({ settings, trustedOrigins: { version: 1, origins } });
      await globalThis.__fixtureRefreshAccess();
      await globalThis.__fixtureWhenIdle();
    }, { settings: { enabled: true, backendUrl: services.backend.origin, frontendUrl: services.frontend.origin },
      origins: [...new Set(cases.filter(fixture => !fixture.untrusted).map(fixture => fixture.origin))] });

    const documents = new Map(cases.map(fixture => [fixture.pageURL, fixture]));
    const apis = new Map(cases.filter(fixture => fixture.api).map(fixture => [fixture.api, fixture]));
    for (const fixture of cases.filter(fixture => fixture.secondAPI)) apis.set(fixture.secondAPI, { ...fixture, candidate: fixture.second });
    let blocked = 0;
    await context.route(/^https?:\/\//, async route => {
      const request = route.request();
      const url = new URL(request.url());
      if ([services.backend.origin, services.frontend.origin].includes(url.origin)) { await route.continue(); return; }
      if (url.href === 'https://unobserved-destination.example.com/__fixture__/') {
        await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><title>Unobserved destination</title>' }); return;
      }
      const fixture = documents.get(url.href);
      if (fixture && request.resourceType() === 'document') {
        await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: pageHTML(fixture) }); return;
      }
      const api = apis.get(url.href);
      if (api) {
        const headers = { 'Access-Control-Allow-Origin': api.origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
        if (request.method() === 'OPTIONS') await route.fulfill({ status: 204, headers });
        else await route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ data: { subscribe_url: api.candidate } }) });
        return;
      }
      if (url.pathname === '/favicon.ico' && (cases.some(item => item.origin === url.origin) || url.origin === 'https://unobserved-destination.example.com')) {
        await route.fulfill({ status: 204 }); return;
      }
      blocked += 1; await route.abort('blockedbyclient');
    });

    for (const fixture of executionCases) {
      label = fixture.label;
      const originals = new Map([...services.state.subs].map(([name, sub]) => [name, clone(sub)]));
      const callsBefore = services.state.operations.length;
      const backupsBefore = await worker.evaluate(async () => (await chrome.storage.local.get('backups')).backups?.length || 0);
      const page = await context.newPage();
      try {
        const startedAt = Date.now();
        const caseTimeout = fixture.timeout || CASE_TIMEOUT_MS;
        let offlineTabsBefore;
        let relayRetries;
        let withdrawalProof;
        if (fixture.offlineRelay) {
          offlineTabsBefore = await worker.evaluate(async () => {
            const saved = (await chrome.storage.session.get('transportTab')).transportTab;
            if (saved && Number.isInteger(saved.id)) await chrome.tabs.remove(saved.id);
            await chrome.storage.session.set({ transportTab: null });
            return { ids: (await chrome.tabs.query({})).map(tab => tab.id).sort((left, right) => left - right),
              lifecycle: { ...globalThis.__fixtureTabLifecycle } };
          });
          await closeServer(services.frontend.server);
        }
        if (fixture.untrusted) {
          const access = await worker.evaluate(async origin => ({
            capable: await chrome.permissions.contains({ origins: [new URL(origin).protocol + '//' + new URL(origin).hostname + '/*'] }),
            trusted: (await chrome.storage.local.get('trustedOrigins')).trustedOrigins.origins.includes(origin),
          }), fixture.origin);
          check(access.capable === true && access.trusted === false, 'untrusted_capability_setup_failed');
        }
        await page.goto(fixture.pageURL, { waitUntil: 'domcontentloaded', timeout: caseTimeout });
        if (fixture.lateAmbiguity || fixture.holdPreview) {
          check(await poll(() => services.state.previewGates.has(fixture.name)), 'held_preview_not_started');
          const eventType = fixture.domWithdrawal ? 'OBSERVATION_INVALIDATED' : fixture.expectedCode === 'candidate_ambiguous' ? 'OBSERVATION_AMBIGUOUS' : 'OBSERVED_SUBSCRIPTION';
          const countBefore = await worker.evaluate(({ origin, type }) => globalThis.__fixtureEvents[origin]?.[type] || 0,
            { origin: fixture.origin, type: eventType });
          if (fixture.lateAmbiguity) await page.evaluate(second => {
              const control = document.createElement('button'); control.dataset.subscribeUrl = second;
              control.textContent = '订阅二'; document.body.append(control);
            }, fixture.second);
          if (fixture.lateNetwork) await page.evaluate(async ({ method, url }) => {
            if (method === 'fetch') { await fetch(url).then(response => response.json()); return; }
            await new Promise((resolve, reject) => {
              const request = new XMLHttpRequest(); request.open('GET', url); request.responseType = 'json';
              request.onload = resolve; request.onerror = () => reject(new Error('fixture_xhr_failed')); request.send();
            });
          }, { method: fixture.lateNetwork, url: fixture.secondAPI });
          if (fixture.domWithdrawal) await page.evaluate(() => {
            for (const control of document.querySelectorAll('[data-subscribe-url], [data-clipboard-text], [data-clipboard], input, textarea, a[href]')) control.remove();
          });
          if (fixture.navigation) {
            const destination = fixture.navigation === 'blank' ? 'about:blank' : fixture.navigation === 'frontend' ? services.frontend.origin :
              'https://unobserved-destination.example.com/__fixture__/';
            await page.goto(destination, { waitUntil: 'domcontentloaded', timeout: caseTimeout });
          } else {
            check(await poll(() => worker.evaluate(({ origin, type, before }) => (globalThis.__fixtureEvents[origin]?.[type] || 0) > before,
              { origin: fixture.origin, type: eventType, before: countBefore })), 'late_observation_not_delivered');
          }
          services.state.previewGates.get(fixture.name)();
          services.state.previewGates.delete(fixture.name);
          await within(worker.evaluate(() => globalThis.__fixtureWhenIdle()), 'idle_barrier_timeout', caseTimeout);
          if (fixture.domWithdrawal) {
            const state = await worker.evaluate(async origin => {
              const session = await chrome.storage.session.get(['pendingByOrigin', 'pageObservations']);
              const local = await chrome.storage.local.get(['sites', 'backups']);
              return { pending: Boolean(session.pendingByOrigin?.[origin]), stage: session.pageObservations?.[origin]?.observation?.stage,
                status: local.sites?.[origin]?.lastResult?.status || null, backups: local.backups?.length || 0,
                retired: globalThis.__fixtureEvents[origin]?.DOCUMENT_RETIRED || 0 };
            }, fixture.origin);
            check(!services.state.operations.slice(callsBefore).some(operation => operation.method === 'PATCH'), 'withdrawn_candidate_wrote_subscription');
            check(!state.pending && state.stage === 'candidate_withdrawn' && state.status === null && state.backups === backupsBefore,
              'withdrawn_candidate_state_survived');
            check(state.retired === 0, 'withdrawal_retired_document');
            withdrawalProof = { received: true, patches: 0, pending: false, stage: state.stage, unappliedBackups: 0, retired: false };
            if (fixture.reappear) {
              await page.evaluate(url => {
                const control = document.createElement('button'); control.dataset.subscribeUrl = url;
                control.textContent = '订阅链接'; document.body.append(control);
              }, fixture.candidate);
              check(await poll(() => worker.evaluate(async origin => (await chrome.storage.local.get('sites')).sites?.[origin]?.lastResult?.status === 'updated', fixture.origin)),
                'reappeared_candidate_not_revalidated');
              await within(worker.evaluate(() => globalThis.__fixtureWhenIdle()), 'reappearance_idle_timeout', caseTimeout);
              const retired = await worker.evaluate(origin => globalThis.__fixtureEvents[origin]?.DOCUMENT_RETIRED || 0, fixture.origin);
              check(retired === 0, 'reappearance_retired_document');
              check(services.state.operations.slice(callsBefore).filter(operation => operation.kind === 'preview').length === 2, 'reappearance_skipped_fresh_validation');
            }
          }
        }
        if (fixture.untrusted) {
          await page.evaluate(url => window.postMessage({ source: 'scki-substore-link-v2', kind: 'subscription', url }, location.origin), fixture.candidate);
          await delay(3500);
          await within(worker.evaluate(() => globalThis.__fixtureWhenIdle()), 'idle_barrier_timeout');
        }
        const readResult = () => worker.evaluate(async ({origin, expectedCode, lateAmbiguity, lateNetwork}) => {
          const result = (await chrome.storage.local.get('sites')).sites?.[origin]?.lastResult || null;
          return (lateAmbiguity || lateNetwork) && expectedCode && result?.code !== expectedCode ? null : result;
        }, fixture);
        const result = fixture.expectedStatus === null ? await readResult() : await poll(readResult,
          Math.max(100, caseTimeout - (Date.now() - startedAt)));
        check(!services.state.failure, services.state.failure || 'mock_contract_failed');
        if (fixture.expectedStatus === null) check(result === null, 'retired_or_untrusted_result_recorded');
        else {
          check(result, 'automatic_result_timeout');
          check(result.status === fixture.expectedStatus, 'result_status_failed');
        }
        if (fixture.expectedCode) check(result.code === fixture.expectedCode, 'result_error_code_failed');
        check(!/token=|OLD-.+-FIXTURE|NEW-.+-FIXTURE|fixture-keep-script/.test(JSON.stringify(result)), 'result_privacy_failed');
        const operations = services.state.operations.slice(callsBefore);
        if (fixture.lateAmbiguity || fixture.navigation || fixture.untrusted || fixture.expectedCode === 'candidate_ambiguous' || (fixture.domWithdrawal && !fixture.reappear)) {
          check(!operations.some(operation => operation.method === 'PATCH'), 'late_ambiguity_wrote_subscription');
        }
        const expected = fixture.operations || ['GET:catalog', 'GET:sub', 'POST:preview', 'GET:sub', 'PATCH:sub', 'GET:sub'];
        check(equal(operations.map(operation => operation.method + ':' + operation.kind), expected), 'request_sequence_failed');
        for (const [name, before] of originals) {
          const after = services.state.subs.get(name);
          const changed = fixture.expectedStatus === 'updated' && name === fixture.name;
          check(equal(after, changed ? { ...before, url: fixture.candidate + FRAGMENT } : before), 'stored_subscription_preservation_failed');
        }
        if (fixture.expectedStatus === 'updated') {
          check(result.subscriptionName === fixture.name, 'automatic_name_match_failed');
          if (fixture.expectedMatchMethod) check(result.matchMethod === fixture.expectedMatchMethod, 'automatic_match_method_failed');
          check(result.originalNodes === 2 && result.processedNodes === 2, 'preview_node_count_failed');
          check(operations.filter(operation => operation.kind !== 'catalog').every(operation => operation.name === fixture.name), 'wrong_subscription_requested');
          const backup = await worker.evaluate(async name => (await chrome.storage.local.get('backups')).backups?.find(item => item.subscriptionName === name), fixture.name);
          check(backup?.previousURL === originals.get(fixture.name).url, 'backup_preservation_failed');
        } else {
          const backupsAfter = await worker.evaluate(async () => (await chrome.storage.local.get('backups')).backups?.length || 0);
          check(backupsAfter === backupsBefore, 'error_backup_changed');
        }
        if (fixture.navigation) {
          const pending = await worker.evaluate(async origin => Boolean((await chrome.storage.session.get('pendingByOrigin')).pendingByOrigin?.[origin]), fixture.origin);
          check(!pending, 'retired_document_pending_remained');
        }
        if (fixture.untrusted) check(!operations.length, 'untrusted_page_read_catalog');
        if (fixture.offlineRelay) {
          await within(worker.evaluate(() => globalThis.__fixtureWhenIdle()), 'offline_idle_timeout', caseTimeout);
          const clean = await poll(() => worker.evaluate(async before => {
            const after = (await chrome.tabs.query({})).map(tab => tab.id).sort((left, right) => left - right);
            const saved = (await chrome.storage.session.get('transportTab')).transportTab;
            const created = globalThis.__fixtureTabLifecycle.created - before.lifecycle.created;
            const removed = globalThis.__fixtureTabLifecycle.removed - before.lifecycle.removed;
            return JSON.stringify(after) === JSON.stringify(before.ids) && !saved && created >= 2 && created === removed ? { created, removed } : null;
          }, offlineTabsBefore));
          check(clean, 'offline_relay_owned_tab_leaked');
          relayRetries = clean.created;
        }
        check(services.state.corsRejected === 0, 'frontend_origin_required');
        passed += 1;
        report.cases.push({ id: fixture.id, label, status: 'passed', operations: operations.length, ...(relayRetries ? { relayAttempts: relayRetries, ownedTabsLeaked: 0 } : {}),
          ...(withdrawalProof ? { withdrawal: withdrawalProof, ...(fixture.reappear ? { validations: 2, patches: 1 } : {}) } : {}) });
        console.log(`${label}: PASS count=${operations.length}${relayRetries ? ' attempts=' + relayRetries : ''}`);
      } catch (error) {
        report.failureOperations = services.state.operations.slice(callsBefore).map(operation => operation.method + ':' + operation.kind);
        report.mockFailure = services.state.failure;
        console.error('Safe fixture operations: ' + JSON.stringify({ operations: report.failureOperations, code: report.mockFailure }));
        const probe = await worker.evaluate(async pageURL => {
          const tab = (await chrome.tabs.query({})).find(item => item.url === pageURL);
          if (!tab) return { unavailable: true };
          const result = await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] }, world: 'ISOLATED', func: () => ({
            secure: globalThis.isSecureContext, randomUUID: typeof crypto?.randomUUID === 'function',
            helper: Boolean(globalThis.SCKISubStoreExtractors), bridge: Object.hasOwn(window, '__sckiSubstoreBridgeV2'),
          }) });
          return result[0]?.result || { unavailable: true };
        }, page.url()).catch(() => ({ unavailable: true }));
        report.pageProbe = probe;
        console.error('Safe fixture page probe: ' + JSON.stringify(probe));
        throw error;
      } finally { await page.close(); }
    }
    check(blocked === 0, 'unexpected_network_blocked');
    check(!context.pages().some(page => /chrome-extension:\/\/[^/]+\/popup\.html/.test(page.url())), 'unexpected_popup');
    report.status = 'passed';
    console.log(`Browser automatic flow: PASS count=${passed}`);
  } catch (error) {
    report.status = 'failed'; report.failedCase = label; report.code = safeCode(error);
    console.error(`${label}: FAIL status=${safeCode(error)} count=${passed}`);
    if (worker) {
      const diagnosis = await worker.evaluate(async () => {
        const local = await chrome.storage.local.get(['sites']);
        const session = await chrome.storage.session.get(['pageObservations', 'pendingByOrigin']);
        return { stages: Object.values(session.pageObservations || {}).map(site => site.observation?.stage),
          pending: Object.keys(session.pendingByOrigin || {}).length,
          results: Object.values(local.sites || {}).map(site => ({ status: site.lastResult?.status, code: site.lastResult?.code })) };
      }).catch(() => ({ unavailable: true }));
      console.error('Safe browser diagnosis: ' + JSON.stringify(diagnosis));
    }
    process.exitCode = 1;
  } finally {
    report.passed = passed;
    if (profileDirectory) await fs.writeFile(path.join(profileDirectory, 'report.json'), JSON.stringify(report, null, 2) + '\n').catch(() => {});
    for (const release of services?.state.previewGates.values() || []) release();
    await context?.close().catch(() => {});
    if (services) await Promise.all([closeServer(services.frontend.server), closeServer(services.backend.server)]);
    if (profileDirectory && process.env.SCKI_E2E_KEEP_ARTIFACTS !== '1') {
      // Delete only the exact private directory created by this invocation.
      const resolved = await fs.realpath(profileDirectory).catch(() => null);
      if (resolved && path.dirname(resolved) === temporaryRoot && path.basename(resolved).startsWith('scki-browser-e2e-')) {
        await fs.rm(resolved, { recursive: true, force: true }).catch(() => {});
      }
    }
  }
}

await main();
