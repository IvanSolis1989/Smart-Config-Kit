'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { spawnSync } = require('node:child_process');
const { parseArgs } = require('../configure-traffic-options');
const { buildMihomoRoutingGraph, getQuicRules } = require('../../rulesets/source/routing-graph');
const { applyCmfaTrafficOptions, applyMobileTrafficOptions } = require('../build-fused-rule-sets');
const { prepareUpdates, replaceMarked } = require('../sync-traffic-options');

const root = path.resolve(__dirname, '../..');

test('traffic runtime preflight prepares all targets without writes and rejects bad markers', () => {
  const files = ['tools/runtime/traffic-options.js', 'Clash Party/ClashParty(mihomo-smart).js', 'Clash Party/ClashParty(mihomo).js', 'FlClash/FlClash(mihomo).js'];
  const before = files.map(file => fs.readFileSync(path.join(root, file)));
  const prepared = prepareUpdates({ healthCheckProfile: 'power-save', quicPolicy: 'follow-rules' });
  assert.equal(prepared.length, files.length);
  assert(prepared.slice(1).every(item => item.updated.includes("SCKI_HEALTH_CHECK_PROFILE = 'power-save'") && item.updated.includes("SCKI_QUIC_POLICY = 'follow-rules'")));
  files.forEach((file, index) => assert.deepEqual(fs.readFileSync(path.join(root, file)), before[index]));
  assert.throws(() => replaceMarked('begin without an end', 'begin', 'end-marker', 'replacement', 'fixture'), /invalid synchronization markers/);
});

test('traffic CLI accepts only the two governed option axes', () => {
  assert.deepEqual(parseArgs(['--health-check-profile', 'power-save', '--quic-policy', 'follow-rules', '--dry-run']), {
    healthCheckProfile: 'power-save', quicPolicy: 'follow-rules', dryRun: true,
  });
  assert.throws(() => parseArgs(['--health-check-profile']), /incomplete/);
  assert.throws(() => parseArgs(['--no-generate']), /Unknown/);
  assert.equal(parseArgs(['--health-check', 'power-save', '--quic', 'follow-rules']).quicPolicy, 'follow-rules');
});

test('follow-rules removes the source UDP 443 override while standard preserves it', () => {
  const block = buildMihomoRoutingGraph({ quicPolicy: 'block-foreign' }).rules;
  const follow = buildMihomoRoutingGraph({ quicPolicy: 'follow-rules' }).rules;
  const isQuicOverride = (rule) => rule.startsWith('AND,((DST-PORT,443),(NETWORK,UDP),');
  assert.equal(getQuicRules('block-foreign').length, 5);
  assert.equal(block.filter(isQuicOverride).length, 5);
  assert.equal(follow.filter(isQuicOverride).length, 0);
  assert.equal(getQuicRules('follow-rules').length, 0);
});

test('static platform presets switch reversibly and preserve UDP capability fallback', () => {
  const standard = { healthCheckProfile: 'standard', quicPolicy: 'block-foreign' };
  const saving = { healthCheckProfile: 'power-save', quicPolicy: 'follow-rules' };
  const cmfa = fs.readFileSync(path.join(root, 'Clash Meta For Android/CMFA(mihomo).yaml'), 'utf8');
  const cmfaSaving = applyCmfaTrafficOptions(cmfa, saving);
  assert.match(cmfaSaving, /health-check:\n      enable: true\n      url: [^\n]+\n      interval: 900\n      lazy: true/);
  assert.match(cmfaSaving, /proxy-groups:\n- type: url-test[\s\S]*?  interval: 900\n  tolerance: 10\n  lazy: true/);
  const cmfaStandard = applyCmfaTrafficOptions(cmfaSaving, standard);
  assert.match(cmfaStandard, /health-check:\n      enable: true\n      url: [^\n]+\n      interval: 300\n      lazy: true/);
  assert.equal((cmfaStandard.match(/^  lazy: true$/gm) || []).length, 22);

  for (const [platform, relative, blocked] of [
    ['shadowrocket', 'Shadowrocket/Shadowrocket.conf', 'block-quic = all-proxy'],
    ['surge', 'Surge/Surge.conf', 'block-quic = all-proxy'],
    ['loon', 'Loon/Loon.conf', 'disable-udp-ports = 443'],
  ]) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    const follow = applyMobileTrafficOptions(source, platform, saving);
    assert.equal(follow.includes(blocked), false, platform);
    assert.match(follow, /url-test,[^\n]*interval=900/);
    const restored = applyMobileTrafficOptions(follow, platform, standard);
    assert.equal(restored.includes(blocked), true, platform);
    assert.match(restored, /url-test,[^\n]*interval=300/);
  }
  const qx = fs.readFileSync(path.join(root, 'Quantumult X/QuantumultX.conf'), 'utf8');
  const qxSaving = applyMobileTrafficOptions(qx, 'quantumultx', saving);
  assert.match(qxSaving, /url-latency-benchmark=[^\n]*check-interval=900[^\n]*alive-checking=false/);
  assert.match(qxSaving, /fallback_udp_policy=reject/);
  assert.match(applyMobileTrafficOptions(qxSaving, 'quantumultx', standard), /check-interval=300[^\n]*alive-checking=true/);
});

test('OpenClash Ruby option block routes both modes from one generated source map', (context) => {
  const ruby = spawnSync('ruby', ['--version'], { encoding: 'utf8' });
  if (ruby.error || ruby.status !== 0) return context.skip('Ruby unavailable');
  for (const name of ['OpenClash(mihomo).sh', 'OpenClash(mihomo-smart).sh']) {
    const source = fs.readFileSync(path.join(root, 'OpenClash', name), 'utf8').replace(/\r\n/g, '\n');
    assert.match(source, /raise ArgumentError, 'invalid health check profile'/);
    assert.match(source, /raise ArgumentError, 'invalid QUIC policy'/);
    assert.match(source, /"interval"\s*=> health_profile == 'power-save' \? 900 : 300/);
    assert.match(source, /"lazy"\s*=> true\b/);
    const map = source.match(/^SCKI_SOURCE_QUIC_RULES = .*\.freeze$/m)?.[0];
    const block = source.match(/config\["rule-providers"\] = override\["rule-providers"\] if override\["rule-providers"\][\s\S]*?config\["rules"\]\.insert\(quic_anchor, \*SCKI_SOURCE_QUIC_RULES\)\nend/)?.[0];
    assert.ok(map && block, `${name}: Ruby source block missing`);
    assert.deepEqual(JSON.parse(map.slice(map.indexOf('=') + 1, -'.freeze'.length).trim()), getQuicRules('block-foreign'));
    for (const mode of ['block-foreign', 'follow-rules']) {
      const rubySource = `require 'json'\n${map}\nconfig = {"rules" => ['DST-PORT,7680,REJECT']}\noverride = {"rules" => ['DST-PORT,7680,REJECT']}\nquic_policy = '${mode}'\n${block}\nputs JSON.generate(config['rules'])`;
      const run = spawnSync('ruby', ['-e', rubySource], { encoding: 'utf8' });
      assert.equal(run.status, 0, run.stderr);
      const rules = JSON.parse(run.stdout);
      assert.equal(rules.filter((rule) => rule.startsWith('AND,((DST-PORT,443),(NETWORK,UDP),')).length, mode === 'block-foreign' ? 5 : 0);
      assert.equal(rules.at(-1), 'DST-PORT,7680,REJECT');
    }
  }
});
