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
  ];
  const cases = [...good, ...bad].map(fixture => ({ ...fixture, pageURL: fixture.origin + '/__scki_fixture__/' + fixture.id }));
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
  const state = { subs: new Map(catalog.map(sub => [sub.name, clone(sub)])), operations: [], corsRejected: 0, failure: null };
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
          const nodes = fixture.warning ? [{ ...NODES[0], name: '订阅无效，请打开官网重新导入' }] : NODES;
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
  let context, services, profileDirectory, temporaryRoot;
  let label = 'bootstrap', passed = 0;
  try {
    temporaryRoot = await fs.realpath(os.tmpdir());
    buildEntries(extensionDirectory, { check: true });
    const moduleName = process.env.PLAYWRIGHT_MODULE_PATH || 'playwright';
    const { chromium } = createRequire(import.meta.url)(moduleName);
    const executablePath = process.env.BROWSER_EXECUTABLE || (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined);
    const { cases, catalog } = fixtures();
    services = await mockServices(cases, catalog);
    profileDirectory = await fs.mkdtemp(path.join(temporaryRoot, 'scki-browser-e2e-'));
    context = await chromium.launchPersistentContext(profileDirectory, { executablePath, ...(executablePath ? {} : { channel: 'chromium' }), headless: true,
      args: ['--disable-extensions-except=' + extensionDirectory, '--load-extension=' + extensionDirectory,
        '--no-first-run', '--no-default-browser-check', '--no-proxy-server', '--disable-background-networking', '--disable-component-update', '--disable-sync'] });
    const worker = context.serviceWorkers().find(item => item.url().endsWith('/background.js')) ||
      await context.waitForEvent('serviceworker', { predicate: item => item.url().endsWith('/background.js'), timeout: 10000 });
    const initialized = await poll(() => worker.evaluate(async () => Boolean((await chrome.storage.local.get('settings')).settings)));
    check(initialized, 'initialization_timeout');
    await worker.evaluate(async settings => {
      await chrome.storage.local.clear(); await chrome.storage.session.clear(); await chrome.storage.local.set({ settings });
    }, { enabled: true, backendUrl: services.backend.origin, frontendUrl: services.frontend.origin });

    const documents = new Map(cases.map(fixture => [fixture.pageURL, fixture]));
    const apis = new Map(cases.filter(fixture => fixture.api).map(fixture => [fixture.api, fixture]));
    let blocked = 0;
    await context.route(/^https?:\/\//, async route => {
      const request = route.request();
      const url = new URL(request.url());
      if ([services.backend.origin, services.frontend.origin].includes(url.origin)) { await route.continue(); return; }
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
      if (url.pathname === '/favicon.ico' && cases.some(item => item.origin === url.origin)) {
        await route.fulfill({ status: 204 }); return;
      }
      blocked += 1; await route.abort('blockedbyclient');
    });

    for (const fixture of cases) {
      label = fixture.label;
      const originals = new Map([...services.state.subs].map(([name, sub]) => [name, clone(sub)]));
      const callsBefore = services.state.operations.length;
      const backupsBefore = await worker.evaluate(async () => (await chrome.storage.local.get('backups')).backups?.length || 0);
      const page = await context.newPage();
      try {
        const startedAt = Date.now();
        await page.goto(fixture.pageURL, { waitUntil: 'domcontentloaded', timeout: CASE_TIMEOUT_MS });
        const result = await poll(() => worker.evaluate(async origin => (await chrome.storage.local.get('sites')).sites?.[origin]?.lastResult || null, fixture.origin),
          Math.max(100, CASE_TIMEOUT_MS - (Date.now() - startedAt)));
        check(!services.state.failure, services.state.failure || 'mock_contract_failed');
        check(result, 'automatic_result_timeout');
        check(result.status === fixture.expectedStatus, 'result_status_failed');
        if (fixture.expectedCode) check(result.code === fixture.expectedCode, 'result_error_code_failed');
        check(!/token=|OLD-.+-FIXTURE|NEW-.+-FIXTURE|fixture-keep-script/.test(JSON.stringify(result)), 'result_privacy_failed');
        const operations = services.state.operations.slice(callsBefore);
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
        check(services.state.corsRejected === 0, 'frontend_origin_required');
        passed += 1;
        console.log(`${label}: PASS count=${operations.length}`);
      } finally { await page.close(); }
    }
    check(blocked === 0, 'unexpected_network_blocked');
    check(!context.pages().some(page => /chrome-extension:\/\/[^/]+\/popup\.html/.test(page.url())), 'unexpected_popup');
    console.log(`Browser automatic flow: PASS count=${passed}`);
  } catch (error) {
    console.error(`${label}: FAIL status=${safeCode(error)} count=${passed}`);
    process.exitCode = 1;
  } finally {
    await context?.close().catch(() => {});
    if (services) await Promise.all([closeServer(services.frontend.server), closeServer(services.backend.server)]);
    if (profileDirectory) {
      // Delete only the exact private directory created by this invocation.
      const resolved = await fs.realpath(profileDirectory).catch(() => null);
      if (resolved && path.dirname(resolved) === temporaryRoot && path.basename(resolved).startsWith('scki-browser-e2e-')) {
        await fs.rm(resolved, { recursive: true, force: true }).catch(() => {});
      }
    }
  }
}

await main();
