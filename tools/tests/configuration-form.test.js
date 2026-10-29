'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const fflate = require('../vendor/fflate/umd/index.js');
const { buildOfflineConfigurationBundle, generateOfflineConfiguration } = require('../lib/offline-configuration-export');
const root = path.join(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'docs/configuration.html'), 'utf8');
const bundle = buildOfflineConfigurationBundle();

function runPage() {
  const ids = {}; let downloaded, blob;
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.listeners = {}; this.value = ''; this.checked = false; }
    set id(value) { this._id = value; ids[value] = this; } get id() { return this._id; }
    append(...children) { this.children.push(...children); if (this.tag === 'select') { const selected = children.find(child => child.selected); if (selected) this.value = selected.value; } }
    replaceChildren() { this.children = []; }
    setAttribute(key, value) { this[key] = value; }
    addEventListener(name, listener) { this.listeners[name] = listener; }
    click() { if (this.tag === 'a') downloaded = { bytes: Buffer.from(blob.parts[0]), type: blob.type, filename: this.download }; else if (this.listeners.click) this.listeners.click(); }
    querySelectorAll(selector) { return this.children.flatMap(child => child.children.filter(item => item.tag === 'input' && (selector !== 'input:checked' || item.checked))); }
  }
  for (const id of ['fields','services','client','client-help','profile','custom','local-tab','business-tab','local-panel','business-panel','error','download','download-business-json','download-local-json','local-json-note','summary','selection-summary','baseline']) { ids[id] = new Element(id === 'client' ? 'select' : 'div'); ids[id]._id = id; }
  ids.profile.value = 'full';
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  const document = { getElementById: id => ids[id], createElement: tag => new Element(tag) };
  class Blob { constructor(parts, options) { this.parts = parts; this.type = options.type; blob = this; } }
  const context = { document, Blob, URL: { createObjectURL: () => 'blob:local', revokeObjectURL() {} }, setTimeout() {}, Uint8Array, TextEncoder, TextDecoder, atob: value => Buffer.from(value, 'base64').toString('binary') };
  context.self = context; vm.createContext(context); for (const script of scripts) vm.runInContext(script, context);
  return { ids, context, download: (id = 'download') => { downloaded = undefined; ids[id].click(); return downloaded; } };
}
function select(page, id) { page.ids.client.value = id; page.ids.client.listeners.change(); }
function expectedBytes(file) { return file.content !== undefined ? Buffer.from(file.content) : Buffer.from(file.base64, 'base64'); }
function checkDownload(result, expected) {
  assert.ok(result); assert.equal(result.filename, expected.filename);
  if (expected.files.length === 1) { assert.equal(result.type, expected.mimeType); assert.deepEqual(result.bytes, expectedBytes(expected.files[0])); }
  else { assert.equal(result.type, 'application/zip'); const contents = fflate.unzipSync(result.bytes); assert.deepEqual(Object.keys(contents).sort(), expected.files.map(file => file.path).sort()); for (const file of expected.files) assert.deepEqual(Buffer.from(contents[file.path]), expectedBytes(file)); }
}
test('generated page is current and has no executable network or dynamic code calls', () => {
  execFileSync(process.execPath, ['tools/generate-configuration-form.js', '--check'], { cwd: root });
  const executable = html.replace(/^const bundle = .*;$/m, 'const bundle = {};');
  assert.equal(/(?:src|href)=["']https?:|\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|eval)\s*\(/i.test(executable), false);
  assert.equal(/\bFunction\s*\(/.test(executable), false);
  assert.ok(html.includes(fs.readFileSync(path.join(root, 'tools/vendor/fflate/LICENSE'), 'utf8')));
});
test('standalone page sets restrictive CSP and explains local generation', () => {
  const match = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  assert.ok(match); const policy = match[1];
  for (const directive of ["default-src 'none'", "script-src 'unsafe-inline'", "style-src 'unsafe-inline'", "connect-src 'none'", "worker-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) assert.ok(policy.split(';').map(item => item.trim()).includes(directive));
  assert.doesNotMatch(policy, /unsafe-eval|frame-ancestors/);
  assert.match(html, /页面加载后.*浏览器本地生成/); assert.match(html, /不上传订阅或个人配置/);
  assert.doesNotMatch(html, /<input[^>]+type=["']file["']|navigator\.serviceWorker|localStorage|sessionStorage/);
});
test('all 20 clients download all business profiles as exact files or complete ZIPs', () => {
  assert.equal(bundle.clients.length, 20); const page = runPage();
  for (const client of bundle.clients) { select(page, client.id); const actualFields = page.ids.fields.children.flatMap(row => row.children.filter(item => item.id).map(item => item.id)); const keys = Object.entries(client.localOptionSchema || {}).filter(([, def]) => !def.values || def.values.length > 1).map(([key]) => key); assert.deepEqual(actualFields.sort(), keys.sort()); for (const choice of [{profile:'full'}, {profile:'lite'}, {profile:'custom',enable:[bundle.services[0].id]}, {profile:'custom',enable:[]}]) { page.ids.profile.value = choice.profile; page.ids.profile.listeners.change(); if (choice.profile === 'custom') for (const child of page.ids.services.children) child.children[0].checked = choice.enable.includes(child.children[0].value); const actual = page.download(); checkDownload(actual, generateOfflineConfiguration(bundle, { client: client.id, ...choice })); if (actual.type === 'application/zip') assert.deepEqual(page.download().bytes, actual.bytes); } }
});
test('per-client parameters remain separate and business selection persists', () => {
  const page = runPage(), { ids } = page; const first = bundle.clients.find(client => client.id === 'flclash');
  const defaultDownload = page.download(); assert.equal(defaultDownload.filename, 'FlClash(mihomo)-full.js');
  const canonical = fs.readFileSync(path.join(root, 'Mihomo内核系/FlClash/FlClash(mihomo).js'), 'utf8').replace(/\r\n/g, '\n');
  assert.equal(defaultDownload.bytes.toString('utf8'), canonical);
  assert.ok(first.localOptionSchema.zeroTierPlanetProxy); ids.zeroTierPlanetProxy.value = 'true'; ids.zeroTierPlanetProxy.listeners.change();
  ids.profile.value = 'lite'; ids.profile.listeners.change();
  const other = bundle.clients.find(client => client.id !== 'flclash' && !Object.hasOwn(client.localOptionSchema, 'zeroTierPlanetProxy'));
  assert.ok(other); select(page, other.id); checkDownload(page.download(), generateOfflineConfiguration(bundle, { client: other.id, profile: 'lite' }));
  select(page, 'flclash'); assert.equal(ids.zeroTierPlanetProxy.value, 'true'); assert.equal(ids.profile.value, 'lite');
  checkDownload(page.download(), generateOfflineConfiguration(bundle, { client: 'flclash', profile: 'lite', localOptions: { zeroTierPlanetProxy: true } }));
  ids.profile.value = 'custom'; ids.profile.listeners.change(); for (const child of ids.services.children) child.children[0].checked = false; ids.services.children[0].children[0].checked = true;
  ids['local-tab'].click(); checkDownload(page.download(), generateOfflineConfiguration(bundle, { client: 'flclash', profile: 'custom', enable: [bundle.services[0].id], localOptions: { zeroTierPlanetProxy: true } }));
});
test('invalid numeric input and unknown client cannot download; empty and corrected input recover', () => {
  const page = runPage(), { ids } = page; const field = ids.maxNodeMultiplier;
  field.value = ''; field.validity = { badInput: true }; assert.equal(page.download(), undefined); assert.ok(ids.error.textContent);
  field.validity.badInput = false; checkDownload(page.download(), generateOfflineConfiguration(bundle, { client: 'flclash', profile: 'full' }));
  field.value = '-1'; assert.equal(page.download(), undefined); field.value = '2.5'; checkDownload(page.download(), generateOfflineConfiguration(bundle, { client: 'flclash', profile: 'full', localOptions: { maxNodeMultiplier: 2.5 } }));
  ids.client.value = 'unknown'; assert.equal(page.download(), undefined); assert.ok(ids.error.textContent);
});
test('ZIP paths reject traversal, prototype keys and NUL', () => {
  const page = runPage();
  for (const invalid of ['../bad', '/absolute', 'C:/bad', 'dir/constructor/file', '__proto__/x', 'prototype/x', 'a' + String.fromCharCode(0) + 'b']) {
    page.context.testPath = invalid;
    vm.runInContext("generateOfflineConfiguration = () => ({filename:'x.zip',mimeType:'application/zip',files:[{path:testPath,content:'x'},{path:'ok',content:'y'}]})", page.context);
    assert.equal(page.download(), undefined); assert.match(page.ids.error.textContent, /路径/);
  }
});
test('advanced JSON keeps separate schemas and only exposes compatible local targets', () => {
  const page = runPage(); assert.equal(page.ids['download-local-json'].hidden, false);
  assert.ok(JSON.parse(page.download('download-local-json').bytes).localOptions);
  assert.deepEqual(JSON.parse(page.download('download-business-json').bytes), {schema_version:1,business:{profile:'full'}});
  select(page, 'cmfa'); assert.equal(page.ids['download-local-json'].hidden, true); assert.equal(page.download('download-local-json'), undefined);
});
test('OpenClash multiplier advertises and enforces its maximum', () => {
  const page = runPage(); select(page, 'openclash-normal');
  const field = page.ids.maxNodeMultiplier; assert.equal(field.max, '100000000000000000000');
  const row = page.ids.fields.children.find(item => item.children.includes(field));
  assert.match(row.children[0].children[1].textContent, /最多 100000000000000000000；使用普通数字/);
  field.value = '1e21'; assert.equal(page.download(), undefined); assert.match(page.ids.error.textContent, /最多/);
});
