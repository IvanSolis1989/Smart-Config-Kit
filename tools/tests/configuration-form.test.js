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

function runPage({ storage = {}, storageThrows = false } = {}) {
  const ids = {}; let downloaded, blob;
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.listeners = {}; this.value = ''; this.checked = false; }
    set id(value) { this._id = value; ids[value] = this; } get id() { return this._id; }
    append(...children) { this.children.push(...children); if (this.tag === 'select') { const selected = children.find(child => child.selected); if (selected) this.value = selected.value; } }
    replaceChildren() { this.children = []; }
    setAttribute(key, value) { this[key] = value; }
    getAttribute(key) { return this[key]; }
    addEventListener(name, listener) { this.listeners[name] = listener; }
    click() { if (this.tag === 'a') downloaded = { bytes: Buffer.from(blob.parts[0]), type: blob.type, filename: this.download }; else if (this.listeners.click) this.listeners.click(); }
    querySelectorAll(selector) { return this.children.flatMap(child => child.children.filter(item => item.tag === 'input' && (selector !== 'input:checked' || item.checked))); }
  }
  for (const id of ['language','fields','services','client','client-help','profile','custom','local-tab','business-tab','local-panel','business-panel','error','download','download-business-json','download-local-json','local-json-note','summary','selection-summary','baseline']) { ids[id] = new Element(id === 'client' ? 'select' : 'div'); ids[id]._id = id; }
  ids.profile.value = 'full';
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  const staticElements = [...html.slice(0,html.indexOf('<script>')).matchAll(/data-l10n(?:-aria)?="([^"]+)"/g)].map(match => { const element = new Element('span'); const key=match[0].startsWith('data-l10n-aria')?'data-l10n-aria':'data-l10n'; element[key]=match[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&'); return element; });
  const document = { documentElement: {lang:'en'}, getElementById: id => ids[id], createElement: tag => new Element(tag),
    querySelectorAll: selector => staticElements.filter(element => Object.hasOwn(element, selector.slice(1,-1))) };
  const writes = [];
  const localStorage = { getItem(key) { if(storageThrows) throw new Error('denied'); return storage[key]; }, setItem(key,value) { if(storageThrows) throw new Error('denied'); writes.push([key,value]); storage[key]=value; } };
  class Blob { constructor(parts, options) { this.parts = parts; this.type = options.type; blob = this; } }
  const context = { document, localStorage, navigator: {language:'zh-CN',languages:['zh-CN']}, Blob, URL: { createObjectURL: () => 'blob:local', revokeObjectURL() {} }, setTimeout() {}, Uint8Array, TextEncoder, TextDecoder, atob: value => Buffer.from(value, 'base64').toString('binary') };
  context.self = context; vm.createContext(context); for (const script of scripts) vm.runInContext(script, context);
  return { ids, context, staticElements, writes, storage, download: (id = 'download') => { downloaded = undefined; ids[id].click(); return downloaded; } };
}
function language(page, value) { page.ids.language.value=value; page.ids.language.listeners.change(); }
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
  assert.doesNotMatch(html, /<input[^>]+type=["']file["']|navigator\.serviceWorker|sessionStorage/);
});
test('explicit Chinese parameter choices display Chinese and original literals without changing values or defaults', () => {
  const labels = {
    healthCheckProfile: { standard:'标准（standard）', 'power-save':'省电（power-save）' },
    quicPolicy: { 'block-foreign':'拦截（block-foreign）', 'follow-rules':'按规则（follow-rules）' },
    browserUdpPolicy: { off:'关闭（off）', reject:'拒绝（reject）' },
    zeroTierPlanetProxy: { true:'开启（true）', false:'关闭（false）' },
    subscriptionAdapterProfile: { off:'关闭适配（off）', policy:'显式策略（policy）', adaptive:'自适应（adaptive）', 'hosts-only':'精确映射（hosts-only）' },
  };
  const page = runPage(); language(page, 'zh');
  for (const client of bundle.clients) {
    select(page, client.id);
    for (const [key, definition] of Object.entries(client.localOptionSchema)) {
      if (!definition.values || definition.values.length <= 1) continue;
      const control = page.ids[key];
      assert.equal(control.value, String(definition.default), `${client.id}/${key} default`);
      assert.deepEqual(control.children.map(option => ({ value:option.value, label:option.textContent })),
        definition.values.map(value => ({ value:String(value), label:labels[key][String(value)] })), `${client.id}/${key} labels`);
    }
  }
});
test('bilingual parameter selections preserve typed JSON, configuration bytes and summary meaning', () => {
  const page = runPage(), options = { healthCheckProfile:'power-save', quicPolicy:'follow-rules', browserUdpPolicy:'reject', zeroTierPlanetProxy:true, subscriptionAdapterProfile:'hosts-only' };
  language(page, 'zh');
  for (const [key, value] of Object.entries(options)) { page.ids[key].value = String(value); page.ids[key].listeners.change(); }
  const settings = JSON.parse(page.download('download-local-json').bytes);
  assert.deepEqual(settings.localOptions, { ...options, maxNodeMultiplier:null });
  checkDownload(page.download(), generateOfflineConfiguration(bundle, { client:'flclash', profile:'full', localOptions:options }));
  for (const text of ['省电（power-save）','按规则（follow-rules）','拒绝（reject）','开启（true）','精确映射（hosts-only）']) assert.ok(page.ids['selection-summary'].textContent.includes(text), text);
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
  const page = runPage(); language(page, 'zh');
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
  const page = runPage(); language(page, 'zh'); select(page, 'openclash-normal');
  const field = page.ids.maxNodeMultiplier; assert.equal(field.max, '100000000000000000000');
  const row = page.ids.fields.children.find(item => item.children.includes(field));
  assert.match(row.children[0].children[1].textContent, /最多 100000000000000000000；使用普通数字/);
  field.value = '1e21'; assert.equal(page.download(), undefined); assert.match(page.ids.error.textContent, /最多/);
});

// Regression: the saved offline page must deliver QX.14, not the stale QX.13 bundle.
test('Quantumult X download preserves the corrected running-mode syntax', () => {
  const page = runPage();
  const client = bundle.clients.find(item => /Quantumult/.test(item.label));
  assert.ok(client); select(page, client.id);
  const result = page.download();
  assert.ok(result);
  const text = result.bytes.toString('utf8');
  assert.match(text, /^running_mode_trigger\s*=\s*filter,\s*filter\s*$/m);
  assert.doesNotMatch(text, /^running_mode_trigger=.*auto/m);
});

test('English is the default even for a Chinese browser; only an explicit saved choice restores Chinese', () => {
  const page = runPage();
  assert.equal(page.context.document.documentElement.lang, 'en');
  assert.equal(page.ids.language.value, 'en');
  assert.equal(page.writes.length, 0);
  assert.match(page.ids['selection-summary'].textContent, /profile: Full/);
  language(page, 'zh'); assert.equal(page.context.document.documentElement.lang, 'zh-CN');
  assert.deepEqual(page.writes, [['scki.configuration.language','zh']]);
  const restored = runPage({storage:page.storage}); assert.equal(restored.ids.language.value, 'zh');
  language(restored, 'en'); assert.equal(runPage({storage:restored.storage}).ids.language.value, 'en');
  assert.equal(runPage({storage:{'scki.configuration.language':'auto'}}).ids.language.value, 'en');
  const blocked=runPage({storageThrows:true}); language(blocked,'zh'); assert.equal(blocked.ids.language.value,'zh');
});

test('all clients display translated metadata and preserve exact exported bytes across locale switches', () => {
  const page=runPage();
  for (const client of bundle.clients) {
    select(page,client.id); language(page,'en');
    for (const text of [page.ids['client-help'].textContent,page.ids['selection-summary'].textContent,...page.ids.client.children.map(c=>c.textContent),...page.ids.services.children.map(l=>l.children[1].textContent)]) assert.doesNotMatch(text, /[\u3400-\u9fff]/u, client.id);
    for (const row of page.ids.fields.children) {
      const text=row.children[0]; if(text) for(const item of text.children) assert.doesNotMatch(item.textContent, /[\u3400-\u9fff]/u);
    }
    page.ids.profile.value='custom'; page.ids.profile.listeners.change();
    page.ids.services.children.forEach((label,index)=>label.children[0].checked=index%2===0);
    const before=page.download(); assert.ok(before);
    language(page,'zh'); const chinese=page.download(); assert.deepEqual(chinese,before,client.id);
    language(page,'en'); assert.deepEqual(page.download(),before,client.id);
  }
});

test('language changes preserve invalid drafts, selected values, tab state and localized errors', () => {
  const page=runPage(); page.ids['local-tab'].click();
  page.ids.maxNodeMultiplier.value='-2'; assert.equal(page.download(),undefined);
  assert.match(page.ids.error.textContent,/greater than 0/);
  const field=page.ids.maxNodeMultiplier;
  language(page,'zh'); assert.equal(page.ids.maxNodeMultiplier,field); assert.equal(field.value,'-2');
  assert.match(page.ids.error.textContent,/大于 0/); assert.equal(page.ids['local-panel'].hidden,false);
  language(page,'en'); assert.match(page.ids.error.textContent,/greater than 0/);
  field.value='2.5'; page.ids.healthCheckProfile.value='power-save';
  const before=page.download(); language(page,'zh'); assert.equal(field.value,'2.5'); assert.equal(page.ids.healthCheckProfile.value,'power-save'); assert.deepEqual(page.download(),before);
  page.ids.client.value='unknown'; page.download(); assert.match(page.ids.error.textContent,/未知客户端/);
  language(page,'en'); assert.match(page.ids.error.textContent,/Unknown client/);
});
