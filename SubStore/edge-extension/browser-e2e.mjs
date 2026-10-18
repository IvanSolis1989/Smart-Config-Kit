// Real-browser automatic-flow acceptance. All account/source data below is synthetic.
// Run after build.mjs. No popup, reload, button interaction or existing profile is used.
import http from 'node:http';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { buildEntries } from './build.mjs';

const extensionDirectory = path.dirname(fileURLToPath(import.meta.url));
const RUNTIME_FILES = ['manifest.json', 'background.js', 'core.mjs', 'auto-match.mjs', 'site-access.mjs', 'local-fetch.mjs', 'cloud-fetch.mjs', 'source-snapshot.mjs', 'durable-snapshot.mjs',
  'local-transport.js', 'offscreen.html', 'offscreen.js', 'page-main.bundle.js', 'page-bridge.bundle.js', 'popup.html', 'popup.js', 'popup.css',
  'README.md', 'CHANGELOG.md', 'build.mjs', 'extractors.js', 'page-hook.js', 'bridge.js'];
const CASE_TIMEOUT_MS = 8000;
const FRAGMENT = '#flowDedup=account&ua=fixture%20ua&cacheKey=fixture-cache';
const PREVIEW_FRAGMENT = '#flowDedup=account&ua=fixture%20ua';
const CLOUD_BASE = 'https://cloud-fixture.example.invalid/private-fixture-prefix';
const NODES = [
  { name: 'Fixture HK', type: 'trojan', server: 'node-one.example.com', port: 443, password: 'fixture-node-one' },
  { name: 'Fixture JP', type: 'ss', server: 'node-two.example.com', port: 443, cipher: 'aes-128-gcm', password: 'fixture-node-two' },
];
const DURABLE_NODES = Array.from({ length: 18 }, (_, index) => ({ name: `Dream node ${index + 1}`, type: 'ss',
  server: `dream-node-${index + 1}.example.com`, port: 443, cipher: 'aes-128-gcm', password: `fixture-dream-${index + 1}` }));
const DURABLE_DRYRUN_NODES = Array.from({ length: 18 }, (_, index) => ({ name: `Dream dry-run node ${index + 1}`, type: 'ss',
  server: `dryrun-dream-node-${index + 1}.example.com`, port: 443, cipher: 'aes-128-gcm', password: `fixture-dryrun-dream-${index + 1}` }));
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

function durableSubscription(name) {
  const oldNodes = DURABLE_NODES.map(node => ({ ...node, password: 'previous-durable-snapshot' }));
  return { ...subscription(name, ''), source: 'local', url: '', content: JSON.stringify({ proxies: oldNodes }) };
}

function cloudNameFor(fixture) { return fixture.durableSnapshot ? fixture.name : 'Cloud ' + fixture.name; }
function cloudFixtureFor(cases, name) { return cases.find(item => item.dual && cloudNameFor(item) === name); }
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
function revision(value) { return createHash('sha256').update(canonical(value)).digest('hex'); }

function fixtures() {
  const sources = id => ({ old: `https://${id}-source.example.com/subscribe?token=OLD-${id}-FIXTURE`,
    candidate: `https://${id}-source.example.com/subscribe?token=NEW-${id}-FIXTURE` });
  const good = [
    { id: 'ssone', label: 'SSONE DOM', origin: 'https://m.ssone.uk', brand: 'SSONE', name: 'SSONE', mode: 'clipboard' },
    { id: 'liangxin', label: 'Liangxin fetch', origin: 'https://xn--9kqz23b19z.com', brand: '良心云', name: 'Internal Liangxin fixture', mode: 'fetch', api: 'https://apiweb.liangxin.xyz/api/v1/user/getSubscribe' },
    { id: 'peiqian', label: 'Peiqian input', origin: 'https://www.xn--mes358aby2apfg.com', brand: '赔钱机场', name: 'Internal Peiqian fixture', mode: 'input' },
    { id: 'kitty', label: 'Kitty XHR', origin: 'https://kitty.sb', brand: 'Kitty Network', name: 'Internal Kitty fixture', mode: 'xhr', api: 'https://moka.tainaka-ritsu.com/api/v3/user/getSubscribe' },
    { id: 'star', label: 'Starnetwork fetch', origin: 'https://ad.zstarzzz.cc', brand: '星网-Starnetwork', name: 'Internal Star fixture', mode: 'fetch', api: 'https://ad.zstarzzz.cc/api/v1/user/getSubscribe' },
    { id: 'dream', label: 'Doushimeng import', origin: 'https://therun.6128888.xyz', brand: 'Doushimeng legacy panel', name: 'Internal Dream fixture', mode: 'import' },
    { id: 'dream_remote_regression', label: 'Doushimeng outside restricted source keeps remote sync', origin: 'https://dream-remote-regression.example.com', brand: '都是梦', name: 'Dream remote regression fixture', mode: 'import' },
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
  const offline = { ...sources('offline_relay'), id: 'offline_relay', label: 'Offline hidden transport leaves no documents or tabs',
    origin: 'https://offline-relay.example.com', brand: 'Offline fixture', name: 'Offline fixture', mode: 'attribute', offlineRelay: true,
    expectedStatus: 'error', expectedCode: 'local_transport_not_ready', operations: [], timeout: 20000 };
  const dual = [
    { id: 'dual_success', cloudWarning: false, legacySnapshotRoute: false, infoNodes: [
      { name: '剩余流量：29.8 GB' }, { name: '套餐到期: 2026-12-31' },
    ] },
    { id: 'dual_cloud_warning', cloudWarning: true, legacySnapshotRoute: true },
    { id: 'dual_snapshot_cloud_warning', cloudWarning: true, legacySnapshotRoute: false },
  ].map(({ id, cloudWarning, legacySnapshotRoute }) => {
    const legacySuffix = legacySnapshotRoute ? ' and legacy snapshot route returns 404' : '';
    return { ...sources(id), id, label: cloudWarning ? 'Dual target keeps local success when cloud preview fails' + legacySuffix :
        'Dual target uploads local preview and updates independent cloud subscription',
      origin: 'https://' + id.replaceAll('_', '-') + '.example.com', brand: id, name: id, mode: 'attribute',
      dual: true, cloudWarning, legacySnapshotRoute,
      operations: legacySnapshotRoute ? ['GET:catalog', 'GET:sub', 'POST:preview', 'GET:sub', 'PATCH:sub', 'GET:sub'] :
        ['GET:catalog', 'GET:sub', 'POST:preview', 'GET:sub', 'PATCH:sub', 'GET:sub', 'GET:catalog', 'GET:sub', 'POST:preview', 'GET:sub'],
      expectedStatus: cloudWarning ? 'partial' : 'updated', expectedLocalStatus: 'updated' };
  });
  const durable = [
    { id: 'durable_snapshot_success', providerFailure: false },
    { id: 'durable_snapshot_provider_failure', providerFailure: true },
  ].map(({ id, providerFailure }) => {
    const urls = sources(id);
    return { ...urls, id, label: providerFailure ? 'Durable snapshot provider failure preserves existing local and cloud content' :
      'Durable snapshot burns once and updates local and Cloudflare content', origin: 'https://therun.6128888.xyz',
      brand: '都是梦', name: '都是梦', mode: 'import', dual: true, durableSnapshot: true, providerFailure,
      expectedStatus: providerFailure ? 'error' : 'updated', expectedCode: providerFailure ? 'snapshot_nodes_invalid' : undefined,
      operations: providerFailure ? ['GET:catalog', 'GET:sub', 'POST:preview'] :
        ['GET:catalog', 'GET:sub', 'POST:preview', 'POST:preview', 'GET:sub', 'PATCH:sub', 'GET:sub'] };
  });
  const cases = [...good, ...bad, untrusted, ...crossResponse, ...leaving, ...withdrawn, ...dual, ...durable, offline]
    .map(fixture => ({ ...fixture, pageURL: fixture.origin + '/__scki_fixture__/' + fixture.id }));
  const named = cases.filter(fixture => fixture.name).filter((fixture, index, all) => all.findIndex(other => other.name === fixture.name) === index);
  const catalog = named.map(fixture => fixture.durableSnapshot ? durableSubscription(fixture.name) : subscription(fixture.name, fixture.old));
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
  const state = { subs: new Map(catalog.map(sub => [sub.name, clone(sub)])), operations: [], timeline: [], sequence: 0, activeFixture: null,
    corsRejected: 0, failure: null, previewGates: new Map(), previewHeld: new Set() };
  const byName = new Map();
  for (const fixture of cases.filter(item => item.name)) if (!byName.has(fixture.name)) byName.set(fixture.name, fixture);
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
      state.timeline.push({ source: 'local', method: operation.method, kind: operation.kind, order: ++state.sequence });
      try {
        let data;
        if (request.method === 'GET' && url.pathname === '/api/subs') data = [...state.subs.values()];
        else if (request.method === 'POST' && url.pathname === '/api/preview/sub') {
          const body = await readJSON(request);
          const before = state.subs.get(body.name);
          const fixture = state.activeFixture?.name === body.name ? state.activeFixture : byName.get(body.name);
          operation.name = body.name;
          check(before && fixture && url.search === '?target=JSON', 'preview_scope_failed');
          check(body.noCache === true && body.ignoreFailedRemoteSub === false, 'preview_cache_options_failed');
          if (fixture.durableSnapshot && body.source === 'remote') {
            state.durableBurns ||= [];
            state.durableBurns.push({ name: body.name, url: body.url });
            check(body.url === fixture.candidate && body.name === '都是梦' && body.content === '' && equal(body.process, []), 'durable_burn_request_failed');
            check(body.noCache === true && body.noFlow === true && body.ignoreFailedRemoteSub === false, 'durable_burn_preview_options_failed');
          } else if (fixture.durableSnapshot) {
            check(body.source === 'local' && body.url === '' && body.name === '都是梦', 'durable_local_preview_identity_failed');
            check(body.noCache === true && body.noFlow === true && body.ignoreFailedRemoteSub === false, 'durable_local_preview_options_failed');
            const proxies = JSON.parse(body.content).proxies;
            check(equal(proxies, DURABLE_NODES) || equal(proxies, DURABLE_DRYRUN_NODES), 'durable_local_preview_content_failed');
          } else check(body.url === fixture.candidate + PREVIEW_FRAGMENT, 'preview_fragment_failed');
          if (fixture.durableSnapshot && body.source === 'remote') {
            check(equal(Object.keys(body).sort(), ['content', 'ignoreFailedRemoteSub', 'name', 'noCache', 'noFlow', 'process', 'source', 'url'].sort()), 'durable_burn_fields_failed');
          } else {
            const originalFields = { ...body }; delete originalFields.url; delete originalFields.noCache; delete originalFields.noFlow; delete originalFields.ignoreFailedRemoteSub;
            const expectedBefore = fixture.durableSnapshot ? { ...before, content: body.content } : before;
            check(equal(originalFields, withoutURL(expectedBefore)), 'preview_process_preservation_failed');
          }
          if ((fixture.lateAmbiguity || fixture.holdPreview) && !state.previewHeld.has(body.name)) {
            state.previewHeld.add(body.name);
            await new Promise(resolve => state.previewGates.set(body.name, resolve));
          }
          const durableBurn = fixture.durableSnapshot && body.source === 'remote';
          const durableLocalPreview = fixture.durableSnapshot && body.source === 'local';
          const nodes = durableBurn ? (fixture.providerFailure ? DURABLE_NODES.slice(0, 17) : state.durableDryRunMode ? DURABLE_DRYRUN_NODES : DURABLE_NODES) :
            durableLocalPreview ? JSON.parse(body.content).proxies : fixture.loopback ? [
            { ...NODES[0], server: '0:0:0:0:0:0:0:1' }, { ...NODES[1], server: '::ffff:127.0.0.1' },
            { ...NODES[0], server: 'localhost.' },
          ] : fixture.warning ? [{ ...NODES[0], name: '订阅无效，请打开官网重新导入' }] : [...NODES, ...(fixture.infoNodes || [])];
          data = { original: nodes, processed: nodes };
        } else if (url.pathname.startsWith('/api/sub/')) {
          const name = decodeURIComponent(url.pathname.slice('/api/sub/'.length));
          const before = state.subs.get(name);
          operation.name = name;
          check(before, 'subscription_scope_failed');
          if (request.method === 'GET') data = before;
          else if (request.method === 'PATCH') {
            const body = await readJSON(request);
            const fixture = state.activeFixture?.name === name ? state.activeFixture : byName.get(name);
            if (fixture?.durableSnapshot) {
              check(equal(Object.keys(body), ['content']) && typeof body.content === 'string' && !!body.content, 'durable_local_patch_fields_failed');
              state.subs.set(name, { ...before, content: body.content }); data = {};
            } else {
              check(equal(Object.keys(body), ['url']), 'patch_fields_failed');
              check(fixture && body.url === fixture.candidate + FRAGMENT, 'patch_fragment_failed');
              state.subs.set(name, { ...before, url: body.url }); data = {};
            }
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
    const playwright = moduleName.startsWith('file:')
      ? await import(moduleName)
      : createRequire(import.meta.url)(moduleName);
    const { chromium } = playwright;
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
globalThis.__fixtureDryRunCandidate = async origin => {
  const state = generations.get(origin);
  const pending = (await chrome.storage.session.get('pendingByOrigin')).pendingByOrigin?.[origin];
  if (!state || !pending || state.kind !== 'candidate') throw new Error('fixture_document_state_missing');
  return syncCandidate(origin, pending, controlFor({ origin, state, generation: state.generation, documentKey: state.documentKey,
    documentNonce: state.documentNonce, tabId: state.tabId, candidateUrl: pending.candidateUrl }), true, true);
};
globalThis.__fixtureRefreshAccess = () => siteAccess.refresh();
globalThis.__fixtureEvents = {};
globalThis.__fixtureTabLifecycle = { created: 0, removed: 0 };
globalThis.__fixtureOffscreenLifecycle = { created: 0, closed: 0 };
const fixtureCreateOffscreen = chrome.offscreen.createDocument.bind(chrome.offscreen);
const fixtureCloseOffscreen = chrome.offscreen.closeDocument.bind(chrome.offscreen);
chrome.offscreen.createDocument = async (...args) => { const result = await fixtureCreateOffscreen(...args); globalThis.__fixtureOffscreenLifecycle.created += 1; return result; };
chrome.offscreen.closeDocument = async (...args) => { const result = await fixtureCloseOffscreen(...args); globalThis.__fixtureOffscreenLifecycle.closed += 1; return result; };
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
    const cloudOperations = [];
    const cloudSubs = new Map();
    for (const fixture of cases.filter(item => item.dual)) {
      const name = cloudNameFor(fixture);
      if (!cloudSubs.has(name)) cloudSubs.set(name, fixture.durableSnapshot ? durableSubscription(name) : subscription(name, fixture.old));
    }
    const cloudSnapshots = new Map();
    let blocked = 0;
    await context.route(/^https?:\/\//, async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === new URL(CLOUD_BASE).origin) {
        const relative = url.href.slice(CLOUD_BASE.length);
        const method = request.method();
        const snapshotRoute = relative.match(/^\/api\/source-snapshot\/([^/?]+)$/);
        const durableRoute = relative.match(/^\/api\/local-snapshot\/([^/?]+)$/);
        const kind = relative === '/api/subs' ? 'catalog' : relative === '/api/preview/sub?target=JSON' ? 'preview' :
          snapshotRoute ? method === 'GET' ? 'snapshot-policy' : 'snapshot-upload' :
          durableRoute ? method === 'GET' ? 'durable-policy' : 'durable-upload' : 'sub';
        const operation = { method, kind, order: ++services.state.sequence };
        cloudOperations.push(operation);
        services.state.timeline.push({ source: 'cloud', method, kind, order: operation.order });
        try {
          check(url.href.startsWith(CLOUD_BASE + '/'), 'cloud_prefix_failed');
          let data;
          if (method === 'GET' && relative === '/api/subs') data = [...cloudSubs.values()];
          else if (durableRoute && method === 'GET') {
            const durableName = decodeURIComponent(durableRoute[1]);
            const fixture = cloudFixtureFor(cases, durableName);
            const before = cloudSubs.get(durableName);
            operation.name = durableName;
            check(fixture?.durableSnapshot && before?.source === 'local' && before.url === '', 'durable_cloud_policy_scope_failed');
            data = { allowed: true, name: durableName, minNodes: 18, revision: revision(before), originalNodes: 18, processedNodes: 18 };
          } else if (durableRoute && method === 'POST') {
            const durableName = decodeURIComponent(durableRoute[1]);
            const body = request.postDataJSON(), before = cloudSubs.get(durableName);
            const fixture = cloudFixtureFor(cases, durableName);
            operation.name = durableName;
            check(fixture?.durableSnapshot && !fixture.providerFailure && before?.source === 'local' && before.url === '', 'durable_cloud_upload_scope_failed');
            const dryRun = body.dryRun === true;
            check(equal(Object.keys(body).sort(), dryRun ? ['dryRun', 'expectedRevision', 'original'] : ['expectedRevision', 'original']) &&
              (!dryRun || body.dryRun === true) && body.expectedRevision === revision(before), 'durable_cloud_upload_contract_failed');
            check((equal(body.original, DURABLE_NODES) || equal(body.original, DURABLE_DRYRUN_NODES)) && body.original.length === 18, 'durable_cloud_upload_nodes_failed');
            const processed = body.original;
            services.state.timeline.push({ source: 'cloud', method: 'INTERNAL', kind: 'durable-provider-preview', order: ++services.state.sequence });
            if (dryRun) {
              services.state.durableDryRuns ||= [];
              services.state.durableDryRuns.push({ name: durableName, expectedRevision: body.expectedRevision });
              data = { status: 'dry_run', name: durableName, revision: body.expectedRevision, originalNodes: body.original.length, processedNodes: processed.length };
            } else {
              const updated = { ...before, content: JSON.stringify({ proxies: body.original }) };
              cloudSubs.set(durableName, updated);
              data = { status: 'updated', name: durableName, revision: revision(updated), originalNodes: body.original.length, processedNodes: processed.length };
            }
          }
          else if (snapshotRoute && method === 'GET') {
            const cloudName = decodeURIComponent(snapshotRoute[1]);
            const fixture = cloudFixtureFor(cases, cloudName);
            operation.name = cloudName;
            check(fixture, 'cloud_snapshot_policy_scope_failed');
            if (fixture.legacySnapshotRoute) {
              operation.responseStatus = 404;
              await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ status: 'failed', error: { code: 'not_found' } }) });
              return;
            }
            operation.responseStatus = 200;
            data = { allowed: true, minNodes: 2, ttlSeconds: 86400, available: false };
          } else if (snapshotRoute && method === 'POST') {
            const cloudName = decodeURIComponent(snapshotRoute[1]);
            const body = request.postDataJSON();
            const previous = cloudSubs.get(cloudName);
            const fixture = cloudFixtureFor(cases, cloudName);
            operation.name = cloudName;
            check(previous && fixture && !fixture.legacySnapshotRoute, 'cloud_snapshot_upload_scope_failed');
            check(body.url === fixture.candidate + FRAGMENT && body.expectedUrl === previous.url, 'cloud_snapshot_url_scope_failed');
            check(equal(body.original, NODES), 'cloud_snapshot_local_strict_preview_failed');
            const policy = cloudOperations.find(item => item.name === cloudName && item.kind === 'snapshot-policy' && item.responseStatus === 200);
            const localProofs = services.state.timeline.filter(event => event.source === 'local' && event.method === 'POST' && event.kind === 'preview' &&
              event.order > policy?.order && event.order < operation.order);
            check(policy && localProofs.length > 0, 'cloud_snapshot_uploaded_without_policy_and_local_preview');
            operation.responseStatus = 200;
            cloudSnapshots.set(cloudName, { url: body.url, expectedUrl: body.expectedUrl, original: clone(body.original) });
            const capturedAt = new Date().toISOString();
            const expiresAt = new Date(Date.now() + 86400000).toISOString();
            data = { stored: true, nodeCount: body.original.length, capturedAt, expiresAt, sha256: 'a'.repeat(64) };
          }
          else if (method === 'POST' && relative === '/api/preview/sub?target=JSON') {
            const body = request.postDataJSON(), previous = cloudSubs.get(body.name);
            const fixture = cloudFixtureFor(cases, body.name);
            operation.name = body.name;
            check(previous && fixture && body.url === fixture.candidate + PREVIEW_FRAGMENT, 'cloud_preview_scope_failed');
            check(body.source !== 'local', 'cloud_generic_preview_rejected_source_local');
            if (!fixture.legacySnapshotRoute) {
              const uploaded = cloudSnapshots.has(body.name) && services.state.timeline.some(event => event.source === 'cloud' && event.kind === 'snapshot-upload' && event.order < operation.order);
              check(uploaded, 'cloud_preview_skipped_after_local_snapshot_upload');
            }
            check(body.noCache === true && body.ignoreFailedRemoteSub === false, 'cloud_preview_options_failed');
            const originalFields = { ...body }; delete originalFields.url; delete originalFields.noCache; delete originalFields.ignoreFailedRemoteSub;
            check(equal(originalFields, withoutURL(previous)), 'cloud_preview_fields_failed');
            const nodes = fixture.cloudWarning ? [{ ...NODES[0], name: '订阅无效，请打开官网重新导入' }] : NODES;
            data = { original: nodes, processed: nodes };
          } else if (relative.startsWith('/api/sub/')) {
            const name = decodeURIComponent(relative.slice('/api/sub/'.length)), previous = cloudSubs.get(name);
            const fixture = cloudFixtureFor(cases, name);
            operation.name = name;
            check(previous && fixture, 'cloud_sub_scope_failed');
            if (method === 'GET') data = previous;
            else {
              const body = request.postDataJSON();
              check(method === 'PATCH' && equal(Object.keys(body), ['url']) && body.url === fixture.candidate + FRAGMENT, 'cloud_patch_fields_failed');
              cloudSubs.set(name, { ...previous, url: body.url }); data = {};
            }
          } else check(false, 'cloud_path_failed');
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', data }) });
        } catch (error) {
          services.state.failure = safeCode(error);
          await route.fulfill({ status: 500, contentType: 'application/json', body: '{"status":"failed"}' });
        }
        return;
      }
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
      services.state.activeFixture = fixture;
      // Several isolated fixtures intentionally share the allowlisted Dream
      // origin. Do not let that origin's previous fixture result satisfy the
      // next fixture's result poll before its new candidate is processed.
      await worker.evaluate(async origin => {
        const { sites = {} } = await chrome.storage.local.get('sites');
        if (sites[origin]) sites[origin] = { ...sites[origin], lastResult: null };
        await chrome.storage.local.set({ sites });
      }, fixture.origin);
      await worker.evaluate(async ({ enabled, backend }) => {
        const current = (await chrome.storage.local.get('settings')).settings;
        await chrome.storage.local.set({ settings: { ...current, cloudEnabled: enabled, cloudBackendUrl: enabled ? backend : '' } });
        await globalThis.__fixtureRefreshAccess();
        await globalThis.__fixtureWhenIdle();
      }, { enabled: Boolean(fixture.dual), backend: CLOUD_BASE });
      const cloudCallsBefore = cloudOperations.length;
      const originals = new Map([...services.state.subs].map(([name, sub]) => [name, clone(sub)]));
      const cloudOriginals = new Map([...cloudSubs].map(([name, sub]) => [name, clone(sub)]));
      const durableBurnsBefore = services.state.durableBurns?.length || 0;
      const durableDryRunsBefore = services.state.durableDryRuns?.length || 0;
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
            const documents = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
            if (documents.length) await chrome.offscreen.closeDocument();
            return { ids: (await chrome.tabs.query({})).map(tab => tab.id).sort((left, right) => left - right),
              lifecycle: { ...globalThis.__fixtureTabLifecycle }, documents: { ...globalThis.__fixtureOffscreenLifecycle } };
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
          const changed = (fixture.expectedLocalStatus || fixture.expectedStatus) === 'updated' && name === fixture.name;
          const expectedAfter = changed ? fixture.durableSnapshot ? { ...before, content: JSON.stringify({ proxies: DURABLE_NODES }) } : { ...before, url: fixture.candidate + FRAGMENT } : before;
          check(equal(after, expectedAfter), 'stored_subscription_preservation_failed');
        }
        if ((fixture.expectedLocalStatus || fixture.expectedStatus) === 'updated') {
          check(result.subscriptionName === fixture.name, 'automatic_name_match_failed');
          if (fixture.expectedMatchMethod) check(result.matchMethod === fixture.expectedMatchMethod, 'automatic_match_method_failed');
          check(result.originalNodes === (fixture.durableSnapshot ? 18 : 2) && result.processedNodes === (fixture.durableSnapshot ? 18 : 2), 'preview_node_count_failed');
          check(operations.filter(operation => operation.kind !== 'catalog').every(operation => operation.name === fixture.name), 'wrong_subscription_requested');
          const backup = await worker.evaluate(async name => (await chrome.storage.local.get('backups')).backups?.find(item => item.subscriptionName === name), fixture.name);
          if (fixture.durableSnapshot) check(backup?.previousContent === originals.get(fixture.name).content && backup?.kind === 'content', 'durable_backup_preservation_failed');
          else check(backup?.previousURL === originals.get(fixture.name).url, 'backup_preservation_failed');
        } else {
          const backupsAfter = await worker.evaluate(async () => (await chrome.storage.local.get('backups')).backups?.length || 0);
          check(backupsAfter === backupsBefore, 'error_backup_changed');
        }
        if (fixture.dual) {
          check(result.targets?.local?.status === (fixture.providerFailure ? 'error' : 'updated'), 'dual_local_result_failed');
          const cloudResult = result.targets?.cloud;
          check(cloudResult?.status === (fixture.providerFailure || fixture.cloudWarning ? 'error' : 'updated'), 'dual_cloud_result_failed');
          if (fixture.durableSnapshot) {
            check((services.state.durableBurns?.length || 0) - durableBurnsBefore === 1, 'durable_candidate_burned_more_than_once');
            check(services.state.durableBurns.at(-1).name === fixture.name && services.state.durableBurns.at(-1).url === fixture.candidate,
              'durable_burn_candidate_mismatch');
            if (fixture.providerFailure) {
              check(result.status === 'error' && result.targets.local.code === 'snapshot_nodes_invalid', 'durable_provider_failure_not_reported');
              check(!services.state.operations.slice(callsBefore).some(operation => operation.method === 'PATCH'), 'durable_provider_failure_wrote_local');
              check(!cloudOperations.slice(cloudCallsBefore).some(operation => operation.kind === 'durable-upload'), 'durable_provider_failure_wrote_cloud');
              check(equal(services.state.subs.get(fixture.name), originals.get(fixture.name)), 'durable_provider_failure_changed_local_snapshot');
              check(equal(cloudSubs.get(cloudNameFor(fixture)), cloudOriginals.get(cloudNameFor(fixture))), 'durable_provider_failure_changed_cloud_snapshot');
              const backupsAfter = await worker.evaluate(async () => (await chrome.storage.local.get('backups')).backups || []);
              check(backupsAfter.length === backupsBefore, 'durable_provider_failure_changed_backups');
            } else {
              check(result.targets.local.mode === 'local_snapshot' && cloudResult.mode === 'local_snapshot', 'durable_snapshot_mode_missing');
              check(!JSON.stringify(result).includes(fixture.candidate), 'durable_burn_url_leaked');
              check(result.originalNodes === 18 && result.processedNodes === 18, 'durable_aggregate_node_count_failed');
              const cloudName = cloudNameFor(fixture), cloudAfter = cloudSubs.get(cloudName), cloudBefore = cloudOriginals.get(cloudName);
              check(equal(cloudAfter, { ...cloudBefore, content: JSON.stringify({ proxies: DURABLE_NODES }) }), 'durable_cloud_content_readback_failed');
              check(cloudAfter.url === '' && cloudAfter.source === 'local' && equal(cloudAfter.process, cloudBefore.process), 'durable_cloud_configuration_changed');
              const cloudBackup = await worker.evaluate(async name => (await chrome.storage.local.get('backups')).backups?.find(item => item.subscriptionName === name && item.targetId === 'cloud'), fixture.name);
              check(cloudBackup?.previousContent === cloudBefore.content && cloudBackup.targetId === 'cloud', 'durable_cloud_backup_missing');
            }
            const expectedCloud = fixture.providerFailure
              ? ['GET:catalog', 'GET:sub', 'GET:durable-policy']
              : ['GET:catalog', 'GET:sub', 'GET:durable-policy', 'GET:sub', 'POST:durable-upload', 'GET:sub'];
            check(equal(cloudOperations.slice(cloudCallsBefore).map(item => item.method + ':' + item.kind), expectedCloud), 'durable_cloud_sequence_failed');
            if (fixture.durableSnapshot && !fixture.providerFailure) {
              const localAfter = services.state.operations.length, cloudAfter = cloudOperations.length;
              const burnsAfter = services.state.durableBurns?.length || 0;
              const beforeCachedBackups = await worker.evaluate(async () => (await chrome.storage.local.get('backups')).backups?.length || 0);
              await worker.evaluate(async origin => {
                const { sites = {} } = await chrome.storage.local.get('sites');
                if (sites[origin]) sites[origin] = { ...sites[origin], lastResult: null };
                await chrome.storage.local.set({ sites });
              }, fixture.origin);
              await page.reload({ waitUntil: 'domcontentloaded', timeout: caseTimeout });
              const cachedVerified = await poll(async () => worker.evaluate(async origin => {
                const { sites = {} } = await chrome.storage.local.get('sites');
                return sites[origin]?.lastResult?.status === 'unchanged' && sites[origin]?.lastResult?.mode === 'local_snapshot';
              }, fixture.origin), caseTimeout);
              check(cachedVerified, 'durable_cached_candidate_not_revalidated');
              check(equal(services.state.operations.slice(localAfter).map(item => item.method + ':' + item.kind), ['GET:sub', 'POST:preview', 'GET:sub']),
                'durable_cached_local_verification_sequence_failed');
              check(equal(cloudOperations.slice(cloudAfter).map(item => item.method + ':' + item.kind), ['GET:sub', 'GET:durable-policy', 'GET:sub']),
                'durable_cached_cloud_verification_sequence_failed');
              check((services.state.durableBurns?.length || 0) === burnsAfter, 'durable_cached_candidate_burned_again');
              const cachedResult = await worker.evaluate(async origin => (await chrome.storage.local.get('sites')).sites?.[origin]?.lastResult, fixture.origin);
              check(cachedResult.originalNodes === 18 && cachedResult.processedNodes === 18, 'durable_cached_verification_counts_failed');
              check((await worker.evaluate(async () => (await chrome.storage.local.get('backups')).backups?.length || 0)) === beforeCachedBackups,
                'durable_cached_verification_changed_backups');

              // Run the real background dry-run path through an isolated harness hook.
              services.state.durableDryRunMode = true;
              let durableDryRun;
              try { durableDryRun = await worker.evaluate(origin => globalThis.__fixtureDryRunCandidate(origin), fixture.origin); }
              finally { services.state.durableDryRunMode = false; }
              check(durableDryRun?.status === 'dry_run' && durableDryRun.targets?.local?.status === 'dry_run' &&
                durableDryRun.targets?.cloud?.status === 'dry_run' && durableDryRun.targets.local.originalNodes === 18 &&
                durableDryRun.targets.local.processedNodes === 18 && durableDryRun.targets.cloud.originalNodes === 18 &&
                durableDryRun.targets.cloud.processedNodes === 18, 'durable_dry_run_contract_failed');
              check((services.state.durableBurns?.length || 0) === burnsAfter + 1 &&
                services.state.durableBurns.at(-1)?.url === fixture.candidate, 'durable_dry_run_burn_count_failed');
              check((services.state.durableDryRuns?.length || 0) === durableDryRunsBefore + 1, 'durable_cloud_dry_run_not_observed');
              check(!durableDryRun.targets.cloud.writeState &&
                (await worker.evaluate(async () => (await chrome.storage.local.get('backups')).backups?.length || 0)) === beforeCachedBackups,
                'durable_dry_run_write_marker_or_backup_seen');
              check(equal(services.state.subs.get(fixture.name), { ...originals.get(fixture.name), content: JSON.stringify({ proxies: DURABLE_NODES }) }) &&
                equal(cloudSubs.get(fixture.name), { ...cloudOriginals.get(fixture.name), content: JSON.stringify({ proxies: DURABLE_NODES }) }),
                'durable_dry_run_changed_subscription');
              check(!services.state.operations.slice(localAfter).some(item => item.method === 'PATCH'), 'durable_dry_run_local_write_seen');
            }
          } else {
          if (fixture.cloudWarning) check(cloudResult.code === 'candidate_has_no_real_nodes', 'dual_cloud_failure_code_failed');
          if (fixture.legacySnapshotRoute) {
            check(!cloudSnapshots.has('Cloud ' + fixture.name), 'legacy_snapshot_404_did_not_fallback');
            check(!cloudResult.sourceSnapshot, 'legacy_snapshot_404_reported_snapshot_metadata');
          } else {
            check(cloudResult.sourceSnapshot?.kind === 'validated_local_snapshot', 'dual_local_snapshot_proof_missing');
            const policyOrder = services.state.timeline.find(event => event.source === 'cloud' && event.kind === 'snapshot-policy' && event.order > 0)?.order;
            const uploadOrder = services.state.timeline.find(event => event.source === 'cloud' && event.kind === 'snapshot-upload' && event.order > policyOrder)?.order;
            const localPreviewOrder = services.state.timeline.find(event => event.source === 'local' && event.method === 'POST' && event.kind === 'preview' && event.order > policyOrder)?.order;
            const cloudPreviewOrder = services.state.timeline.find(event => event.source === 'cloud' && event.kind === 'preview' && event.order > uploadOrder)?.order;
            check(policyOrder && localPreviewOrder > policyOrder && uploadOrder > localPreviewOrder && cloudPreviewOrder > uploadOrder,
              'dual_snapshot_policy_local_preview_upload_cloud_preview_order_failed');
          }
          const ownCloudOperations = cloudOperations.slice(cloudCallsBefore);
          const expectedCloud = fixture.legacySnapshotRoute
            ? ['GET:catalog', 'GET:snapshot-policy', 'GET:sub', 'POST:preview']
            : fixture.cloudWarning
              ? ['GET:catalog', 'GET:snapshot-policy', 'GET:sub', 'POST:snapshot-upload', 'GET:sub', 'POST:preview']
            : ['GET:catalog', 'GET:snapshot-policy', 'GET:sub', 'POST:snapshot-upload', 'GET:sub', 'POST:preview', 'GET:sub', 'PATCH:sub', 'GET:sub'];
          check(equal(ownCloudOperations.map(item => item.method + ':' + item.kind), expectedCloud), 'dual_cloud_sequence_failed');
          const cloudName = cloudNameFor(fixture);
          check(cloudSubs.get(cloudName).url === (fixture.cloudWarning ? fixture.old : fixture.candidate) + FRAGMENT, 'dual_cloud_saved_url_failed');
          const backups = await worker.evaluate(async origin => (await chrome.storage.local.get('backups')).backups.filter(item => item.origin === origin), fixture.origin);
          check(backups.length === (fixture.cloudWarning ? 1 : 2), 'dual_independent_backups_failed');
          check(!JSON.stringify(result).includes('/private-fixture-prefix'), 'dual_private_prefix_leaked');
          }
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
            const created = globalThis.__fixtureTabLifecycle.created - before.lifecycle.created;
            const removed = globalThis.__fixtureTabLifecycle.removed - before.lifecycle.removed;
            const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
            const documentCreates = globalThis.__fixtureOffscreenLifecycle.created - before.documents.created;
            const documentCloses = globalThis.__fixtureOffscreenLifecycle.closed - before.documents.closed;
            return JSON.stringify(after) === JSON.stringify(before.ids) && created === 0 && removed === 0 && contexts.length === 0
              && documentCreates >= 2 && documentCreates === documentCloses ? { created, removed, documentCreates, documentCloses } : null;
          }, offlineTabsBefore));
          check(clean, 'offline_hidden_transport_leaked');
          relayRetries = clean.documentCreates;
        }
        const visibleFrontendTabs = await worker.evaluate(async origin => (await chrome.tabs.query({})).filter(tab => {
          try { return new URL(tab.url).origin === origin; } catch { return false; }
        }).length, services.frontend.origin);
        check(visibleFrontendTabs === (fixture.navigation === 'frontend' ? 1 : 0), 'visible_local_transport_tab_created');
        check(services.state.corsRejected === 0, 'frontend_origin_required');
        passed += 1;
        report.cases.push({ id: fixture.id, label, status: 'passed', operations: operations.length, visibleTransportTabs: 0, ...(relayRetries ? { hiddenDocumentAttempts: relayRetries, ownedTabsLeaked: 0, hiddenDocumentsLeaked: 0 } : {}),
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
