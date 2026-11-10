'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { deflateSync } = require('node:zlib');
const fflate = require('../vendor/fflate/umd/index.js');
const { configurationPagesEquivalent: equivalent } = require('../lib/configuration-page-equivalence');
const payload = Buffer.from(JSON.stringify({ label: '规则 / Rules', entries: Array(100).fill('unchanged catalog') }));
const render = compressed => `<h1>Configuration</h1><script>const bundle = JSON.parse(fflate.strFromU8(fflate.unzlibSync(Uint8Array.from(atob('${compressed.toString('base64')}'), char => char.charCodeAt(0)))));\ninitialize(bundle);</script>`;
const expected = render(deflateSync(payload, { level: 9 }));
test('accepts alternative valid compression with byte-identical payload and unchanged browser decoder', () => {
  for (const compressed of [deflateSync(payload, {level:0}), deflateSync(payload, {level:1}), fflate.zlibSync(payload, {level:6})]) {
    assert.equal(equivalent(render(Buffer.from(compressed)), expected), true);
    assert.deepEqual(Buffer.from(fflate.unzlibSync(compressed)), payload);
  }
  assert.deepEqual(Buffer.from(fflate.unzlibSync(deflateSync(payload,{level:9}))),payload);
});
test('rejects payload changes including JSON-equivalent whitespace', () => {
  for (const p of [Buffer.from('tampered'), Buffer.concat([payload,Buffer.from(' ')])]) assert.equal(equivalent(render(deflateSync(p)),expected),false);
});
test('rejects any surrounding UI/code drift before or after the embedded payload', () => {
  for (const changed of [expected.replace('Configuration','Changed'),expected.replace('initialize(bundle)','executeOtherCode()'),expected+' ', ' '+expected]) assert.equal(equivalent(changed,expected),false);
});
test('rejects malformed, truncated, noncanonical and trailing compressed bytes', () => {
  const compressed=deflateSync(payload);
  for(const b of [compressed.subarray(0,compressed.length-2),Buffer.from('invalid'),Buffer.concat([compressed,Buffer.from('junk')])]) assert.equal(equivalent(render(b),expected),false);
  assert.equal(equivalent(expected.replace("atob('","atob(' "),expected),false);
});
test('rejects absent or duplicated bundle markers rather than masking code changes', () => {
  assert.equal(equivalent('<html></html>',expected),false);
  assert.equal(equivalent(expected+expected,expected+expected),false);
});
