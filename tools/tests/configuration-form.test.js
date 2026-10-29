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
    click() { if (this.listeners.click) this.listeners.click(); }
    querySelectorAll() { return this.children.flatMap(child => child.children.filter(item => item.tag === 'input' && item.checked)); }
  }
  for (const id of ['fields','services','fallback','profile','custom','local-tab','business-tab','local-panel','business-panel','command','error','download']) { ids[id] = new Element('div'); ids[id]._id = id; }
  ids.profile.value = 'full'; let downloaded;
  const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
  const document = { getElementById: id => ids[id], createElement: tag => new Element(tag) };
  class Blob { constructor(parts) { downloaded = parts.join(''); } }
  vm.runInNewContext(script, { document, Blob, URL: { createObjectURL: () => 'blob:local', revokeObjectURL() {} }, setTimeout() {} });
  return { ids, download: () => { ids.download.click(); return downloaded && JSON.parse(downloaded); } };
}

test('generated page is deterministic and contains no external resources', () => {
  execFileSync(process.execPath, ['tools/generate-configuration-form.js', '--check'], { cwd: root });
  assert.doesNotMatch(html, /(?:src|href)=["']https?:|\b(?:fetch|XMLHttpRequest|WebSocket|eval)\s*\(/i);
});
test('local controls cover the schema and export valid typed defaults and choices', () => {
  const { ids, download } = runPage();
  assert.deepEqual(Object.keys(download().localOptions), Object.keys(definitions));
  for (const [key, def] of Object.entries(definitions)) {
    assert.equal(download().localOptions[key], def.default);
    for (const value of def.values || [null, 2.5]) {
      ids[key].value = value === null ? '' : String(value);
      assert.ok(isValidValue(key, download().localOptions[key]));
      assert.equal(download().localOptions[key], value);
    }
  }
  ids.maxNodeMultiplier.value = '-1'; ids.download.click(); assert.match(ids.error.textContent, /大于 0/);
});
test('business export distinguishes presets and custom service selection', () => {
  const { ids, download } = runPage(); ids['business-tab'].click();
  assert.deepEqual(download().business, { profile: 'full' });
  ids.profile.value = 'lite'; ids.profile.listeners.change(); assert.deepEqual(download().business, { profile: 'lite' });
  ids.profile.value = 'custom'; ids.profile.listeners.change();
  for (const child of ids.services.children) child.children[0].checked = false;
  ids.services.children[0].children[0].checked = true;
  assert.deepEqual(download().business, { profile: 'custom', enable: [getBusinessProfileCatalog().services[0].id] });
});
