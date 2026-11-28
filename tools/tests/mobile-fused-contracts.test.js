#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { checkMobileFusedRuleSets } = require('../validate-artifact-contracts');
const manifest = require('../../rulesets/generated/fused/manifest.json');

const clients = [
  { id: 'shadowrocket', file: 'Shadowrocket/Shadowrocket.conf', adPolicy: ',🛑 广告拦截', directPolicy: ',DIRECT' },
  { id: 'surge', file: 'Surge/Surge.conf', adPolicy: ',🛑 广告拦截', directPolicy: ',DIRECT' },
  { id: 'loon', file: 'Loon/Loon.conf', adPolicy: 'policy=🛑 广告拦截', directPolicy: 'policy=DIRECT' },
  { id: 'qx', file: 'Quantumult X/QuantumultX.conf', adPolicy: 'force-policy=🛑 广告拦截', directPolicy: 'force-policy=direct' },
];

function loadConfig(file) {
  return fs.readFileSync(path.join(__dirname, '../../独立内核系', file), 'utf8');
}

function failures(id, source) {
  const results = [];
  checkMobileFusedRuleSets({
    check(name, ok, detail) {
      if (!ok) results.push({ name, message: detail.message });
    },
  }, id, source, manifest);
  return results;
}

function replaceAdReference(source, replaceLine) {
  const firstAdReference = /^(?:RULE-SET,)?https:\/\/[^,]*\/scki-fused-\d+-ad\.list[^,]*,.*$/m;
  const changed = source.replace(firstAdReference, replaceLine);
  assert.notEqual(changed, source, 'fixture must mutate the first ad reference');
  return changed;
}

for (const { id, file, adPolicy, directPolicy } of clients) {
  test(`${id} routes every nonempty fused asset to the generated group in order`, () => {
    assert.deepEqual(failures(id, loadConfig(file)), []);
  });

  test(`${id} rejects an ad reference retargeted to a valid direct policy`, () => {
    const source = replaceAdReference(loadConfig(file), line => line.replace(adPolicy, directPolicy));
    const errors = failures(id, source);
    assert.deepEqual(errors.map(error => error.name), [`${id}.fused.rule-set-bindings`]);
    assert.match(errors[0].message, /expected .*policy=🛑 广告拦截 .*got .*policy=direct enabled=true/i);
  });
}

test('Shadowrocket rejects a dangling fused group after its definition is renamed', () => {
  const original = loadConfig('Shadowrocket/Shadowrocket.conf');
  const source = original.replace(/^🛑 广告拦截(?=\s*=\s*select,)/m, '🛑 Renamed advertising');
  assert.notEqual(source, original);
  assert.deepEqual(failures('shadowrocket', source), [{
    name: 'shadowrocket.fused.rule-set-targets',
    message: 'undefined policy groups: 🛑 广告拦截',
  }]);
});

test('QX requires exactly one force-policy and rejects inactive or duplicate entries', () => {
  const original = loadConfig('Quantumult X/QuantumultX.conf');
  const mutations = [
    line => line.replace(/, force-policy=[^,]+/, ''),
    line => line + ', force-policy=direct',
    line => line.replace(/(force-policy=[^,]+)/, '$1=unexpected'),
    line => line.replace('enabled=true', 'enabled=false'),
    line => `${line}\n${line}`,
  ];
  for (const mutate of mutations) {
    const errors = failures('qx', replaceAdReference(original, mutate));
    assert.ok(errors.some(error => error.name === 'qx.fused.rule-set-bindings'), mutate.toString());
  }
});

test('Surge rejects an ad reference moved ahead of an earlier exception', () => {
  const original = loadConfig('Surge/Surge.conf');
  let adLine;
  const withoutAd = replaceAdReference(original, line => {
    adLine = line;
    return '';
  });
  const firstReference = /^(?=RULE-SET,https:\/\/[^,]*\/rulesets\/generated\/fused\/surge\/)/m;
  const source = withoutAd.replace(firstReference, `${adLine}\n`);
  assert.notEqual(source, withoutAd);
  assert.deepEqual(failures('surge', source).map(error => error.name), ['surge.fused.rule-set-bindings']);
});
