'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { transformBody, extractVersions, extractCounts } = require('../generate-stash-from-cmfa');

const source = fs.readFileSync(path.join(__dirname, '../../Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml'), 'utf8');
const versions = extractVersions(source);
const counts = extractCounts(source);

test('Stash standard keeps 300s checks with explicit lazy true and compatibility trimming', () => {
  const rendered = transformBody(source, versions, counts, { healthCheckProfile: 'standard', quicPolicy: 'block-foreign' });
  assert.equal((rendered.match(/^  lazy: true$/gm) || []).length, 22);
  assert.equal((rendered.match(/^  interval: 300$/gm) || []).length, 22);
  assert.doesNotMatch(rendered, /^  (tolerance|exclude-type|empty-fallback):/m);
});

test('Stash power-save preserves documented lazy while still trimming unsupported fields', () => {
  const presetSource = source.replace(/^  interval: \d+$/gm, '  interval: 900').replace(/^  lazy: (?:false|true)$/gm, '  lazy: true');
  const rendered = transformBody(presetSource, versions, counts, { healthCheckProfile: 'power-save', quicPolicy: 'follow-rules' });
  assert.equal((rendered.match(/^  lazy: true$/gm) || []).length, 22);
  assert.equal((rendered.match(/^  interval: 900$/gm) || []).length, 22);
  assert.doesNotMatch(rendered, /^  (tolerance|exclude-type|empty-fallback):/m);
});
