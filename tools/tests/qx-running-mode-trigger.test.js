'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const { validateQxRunningModeTrigger: validate } = require('../lib/qx-running-mode-trigger');
const root = path.resolve(__dirname, '../..');
const wrap = value => `[general]\nrunning_mode_trigger=${value}\n`;

test('repository default uses the official filter mode without SSID overrides', () => {
  const config = fs.readFileSync(path.join(root, '独立内核系/Quantumult X/QuantumultX.conf'), 'utf8');
  assert.match(config, /^running_mode_trigger=filter, filter$/m);
  assert.deepEqual(validate(config), { ok: true, errors: [], count: 1 });
});

test('pinned official sample is verified and its trigger example is accepted', () => {
  const dir = path.join(root, 'docs/upstream/2026-10-19/apple');
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const record = manifest.sources.find(item => item.id === 'qx-sample-conf');
  const bytes = zlib.gunzipSync(fs.readFileSync(path.join(dir, record.file)));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), record.receipt.content.sha256);
  const example = bytes.toString('utf8').split(/\r?\n/).find(line => /^;running_mode_trigger\s*=/.test(line));
  assert.ok(example);
  assert.equal(validate(`[general]\n${example.slice(1)}\n`).ok, true);
});

for (const value of ['filter, filter', 'all_direct, all_proxy', 'filter, filter, Home WiFi:filter', 'filter, filter, Home:all_direct, Office:all_proxy']) {
  test(`accept documented modes and SSID mappings: ${value}`, () => assert.equal(validate(wrap(value)).ok, true));
}
for (const value of ['auto, auto, auto', 'filter, filter, auto', 'filter, filter, filter', 'direct, proxy', 'follower, none', 'filter', '', 'filter,', 'filter, filter,', 'filter, filter, :filter', 'filter, filter, Home:auto', 'filter, filter, Home:filter, Home:all_proxy']) {
  test(`reject invalid trigger: ${JSON.stringify(value)}`, () => assert.equal(validate(wrap(value)).ok, false));
}

test('comments and omitted optional key are accepted; CRLF and whitespace are supported', () => {
  assert.equal(validate('[general]\n# running_mode_trigger=auto, auto, auto\n;running_mode_trigger=x\n// running_mode_trigger=x\n').ok, true);
  assert.equal(validate('[general]\r\n  running_mode_trigger = filter, filter\r\n').ok, true);
});
test('reject duplicate keys and misplaced trigger', () => {
  assert.equal(validate(`${wrap('filter, filter')}running_mode_trigger=filter, filter`).ok, false);
  assert.equal(validate('[dns]\nrunning_mode_trigger=filter, filter').ok, false);
});
test('aggregate contract uses grammar validation, not a ban on filter', () => {
  const code = fs.readFileSync(path.join(root, 'tools/validate-artifact-contracts.js'), 'utf8');
  assert.match(code, /validateQxRunningModeTrigger\(qx\)/);
  assert.doesNotMatch(code, /running_mode_trigger cannot use filter/);
});

test('full, lite and custom Quantumult X projections preserve valid trigger and general settings', () => {
  const { buildProfilePlan } = require('../lib/business-profiles');
  const { projectPlatform } = require('../lib/business-profile-platforms');
  const source = fs.readFileSync(path.join(root, '独立内核系/Quantumult X/QuantumultX.conf'), 'utf8');
  const general = text => text.match(/\[general\]([\s\S]*?)\[dns\]/)[1];
  for (const profile of ['full', 'lite', 'custom']) {
    const plan = buildProfilePlan({ profile, ...(profile === 'custom' ? { enable: [] } : {}), root });
    const output = profile === 'full' ? source : projectPlatform(source, 'quantumult', plan);
    assert.equal(validate(output).ok, true, profile);
    assert.equal(general(output), general(source), profile);
  }
});
