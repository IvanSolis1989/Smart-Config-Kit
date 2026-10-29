'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { definitions, isValidValue } = require('../lib/configuration-schema');
const { getBusinessProfileCatalog } = require('../lib/business-profiles');
const root = path.join(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'docs/configuration.html'), 'utf8');

function runPage() {
  const ids = {};
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.listeners = {}; this.value = ''; this.checked = false; }
    set id(value) { this._id = value; ids[value] = this; } get id() { return this._id; }
    append(...children) { this.children.push(...children); if (this.tag === 'select') { const selected = children.find(child => child.selected); if (selected) this.value = selected.value; } }
    setAttribute(key, value) { this[key] = value; }
    addEventListener(name, listener) { this.listeners[name] = listener; }
    click() { if (this.tag === 'a') { downloaded = { text: blob.parts.join(''), type: blob.type, filename: this.download }; } else if (this.listeners.click) this.listeners.click(); }
    querySelectorAll(selector) { return this.children.flatMap(child => child.children.filter(item => item.tag === 'input' && (selector !== 'input:checked' || item.checked))); }
  }
  for (const id of ['fields','services','fallback','profile','custom','local-tab','business-tab','local-panel','business-panel','command','error','download','download-json','summary','business-help','local-help','baseline']) { ids[id] = new Element('div'); ids[id]._id = id; }
  ids.profile.value = 'full'; let downloaded, blob;
  const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
  const document = { getElementById: id => ids[id], createElement: tag => new Element(tag) };
  class Blob { constructor(parts, options) { this.parts = parts; this.type = options.type; blob = this; } }
  vm.runInNewContext(script, { document, Blob, URL: { createObjectURL: () => 'blob:local', revokeObjectURL() {} }, setTimeout() {} });
  return { ids, download: (id = 'download') => { downloaded = undefined; ids[id].click(); return downloaded; } };
}

test('generated page is deterministic and contains no external resources', () => {
  execFileSync(process.execPath, ['tools/generate-configuration-form.js', '--check'], { cwd: root });
  // Embedded trusted source is data; scan executable page code independently.
  const executable = html.replace(/^const bundle = .*;$/m, 'const bundle = {};');
  assert.doesNotMatch(executable, /(?:src|href)=["']https?:|\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|eval|Function)\s*\(/i);
});
test('local controls cover the schema and export valid typed defaults and choices', () => {
  const { ids, download } = runPage();
  assert.deepEqual(Object.keys(JSON.parse(download().text).localOptions), Object.keys(definitions));
  for (const [key, def] of Object.entries(definitions)) {
    assert.equal(JSON.parse(download().text).localOptions[key], def.default);
    for (const value of def.values || [null, 2.5]) {
      ids[key].value = value === null ? '' : String(value);
      assert.ok(isValidValue(key, JSON.parse(download().text).localOptions[key]));
      assert.equal(JSON.parse(download().text).localOptions[key], value);
    }
  }
  ids.maxNodeMultiplier.value = '-1'; ids.download.click(); assert.match(ids.error.textContent, /大于 0/);
});
test('business exports FlClash scripts matching the shared builder and independent JSON', () => {
  const { buildFlClashBrowserBundle, generateFlClashScript } = require('../lib/flclash-browser-export');
  const bundle = buildFlClashBrowserBundle();
  const { ids, download } = runPage(); ids['business-tab'].click();
  function check(selection) { const result = download(); const expected = generateFlClashScript(bundle, selection); assert.equal(result.text, expected.source); assert.equal(result.filename, expected.filename); assert.match(result.type, /javascript/); assert.match(result.text, /^\/\//); }
  assert.match(ids.summary.textContent, /^完整方案：保留全部 24 项可选业务与基础保护$/);
  check({ profile: 'full' }); assert.deepEqual(JSON.parse(download('download-json').text).business, { profile: 'full' });
  ids.profile.value = 'lite'; ids.profile.listeners.change(); assert.match(ids.summary.textContent, /保留 4 项/); for (const service of getBusinessProfileCatalog().services.filter(item => bundle.presets.lite.includes(item.id))) assert.ok(ids.summary.textContent.includes(service.group)); check({ profile: 'lite' }); assert.deepEqual(JSON.parse(download('download-json').text).business, { profile: 'lite' });
  ids.profile.value = 'custom'; ids.profile.listeners.change();
  assert.match(ids.summary.textContent, /保留 24 项：.*等，可在下方调整/);
  for (const child of ids.services.children) child.children[0].checked = false;
  ids.services.children[0].children[0].checked = true;
  ids.services.children[0].children[0].listeners.change(); assert.match(ids.summary.textContent, /^保留 1 项：/); assert.ok(ids.summary.textContent.includes(getBusinessProfileCatalog().services[0].group));
  const enable = [getBusinessProfileCatalog().services[0].id]; check({ profile: 'custom', enable });
  assert.deepEqual(JSON.parse(download('download-json').text).business, { profile: 'custom', enable });
  ids['local-tab'].click(); assert.ok(JSON.parse(download().text).localOptions);
  ids['business-tab'].click(); check({ profile: 'custom', enable });
  ids.services.children[0].children[0].value = 'unknown';
  assert.equal(download(), undefined); assert.ok(ids.error.textContent);
  ids.services.children[0].children[0].value = enable[0];
  ids.services.children[1].children[0].value = enable[0]; ids.services.children[1].children[0].checked = true;
  assert.equal(download(), undefined); assert.ok(ids.error.textContent);
});
