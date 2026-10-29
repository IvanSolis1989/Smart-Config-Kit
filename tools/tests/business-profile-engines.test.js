'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadQuickJS, executeNode, executeQuickJS } = require('../validate-js-engines');
const { scenarios, proxy, subscription } = require('../lib/js-engine-fixtures');
const { buildProfilePlan, projectMihomoConfig } = require('../lib/business-profiles');
const { projectScript, projectPlatform } = require('../lib/business-profile-platforms');
const { artifactInventory } = require('../lib/business-profile-output');

const root = path.resolve(__dirname, '../..');
const scripts = artifactInventory().filter(artifact => artifact.kind === 'script');
const plans = [buildProfilePlan({ profile: 'lite' }), buildProfilePlan({ profile: 'custom', enable: [] })];
let engine;
test.before(async () => { engine = await loadQuickJS().getQuickJS(); });

function assertProjected(output, baseline, plan) {
  assert.deepEqual(output, projectMihomoConfig(baseline, plan), 'entire candidate must equal the pure projection of maintained main');
  assert.ok(output.rules.length > 1);
  assert.equal(output.rules.at(-1), plan.finalRule);
  for (const group of plan.disabledGroups) assert.equal(output['proxy-groups'].some(item => item.name === group), false, group);
  for (const group of plan.protectedGroups) assert.ok(output['proxy-groups'].some(item => item.name === group), group);
  assert.ok(output['proxy-groups'].length < baseline['proxy-groups'].length, 'optional projection must actually remove disabled groups');
}

function assertInPlace(outcome) {
  for (const key of ['config', 'groups', 'rules', 'providers']) {
    assert.equal(outcome.identity[key], true, `${key} bridge identity`);
  }
}

// Observe the guest-owned object before/after its actual maintained main. The
// host fixture alone cannot prove clone semantics because the engine driver
// already serializes host input before entering either guest.
function observeClone(source) {
  return source + `\nvar engineObservedMain = main;
main = function (input) {
  var before = JSON.parse(JSON.stringify(input));
  try {
    var candidate = engineObservedMain(input);
    return { candidate: candidate, before: before, after: input, sameConfig: candidate === input };
  } catch (error) {
    return { error: error.message, before: before, after: input };
  }
};\n`;
}

function aeroveInput() {
  const input = subscription([proxy('HK Home x1'), proxy('US Home x1')]);
  input.dns = { enable: true, nameserver: ['https://resolver.example/dns-query'], 'enhanced-mode': 'fake-ip' };
  input.hosts = { 'node.fixture.test': ['192.0.2.40'] };
  input.tun = { enable: true, 'file-descriptor': 42 };
  return input;
}

for (const plan of plans) {
  for (const artifact of scripts.filter(item => item.runtimeContract === 'in-place')) {
    test(`${plan.profile} ${artifact.path}: QuickJS complete projection and all bridge identities match Node`, () => {
      const source = fs.readFileSync(path.join(root, artifact.path), 'utf8');
      const generated = projectScript(source, plan, artifact);
      const input = scenarios().find(item => item.id === 'normal-subscription').config;
      const baseline = executeNode(source, input, artifact.path).output;
      const node = executeNode(generated, input, artifact.path);
      const quickjs = executeQuickJS(engine, generated, input, artifact.path);
      assert.deepEqual(quickjs.output, node.output);
      assertProjected(quickjs.output, baseline, plan);
      assertInPlace(node);
      assertInPlace(quickjs);
    });

    test(`${plan.profile} ${artifact.path}: remote provider and invalid dialer refusals remain atomic in QuickJS`, () => {
      const source = fs.readFileSync(path.join(root, artifact.path), 'utf8');
      const generated = projectScript(source, plan, artifact);
      const rejected = [
        scenarios().find(item => item.id === 'remote-provider-rejected').config,
        subscription([proxy('HK Dependent', { 'dialer-proxy': 'missing-hop' })]),
      ];
      for (const input of rejected) {
        assert.deepEqual(executeNode(source, input, artifact.path).output, input, 'maintained main rejects this fixture');
        const node = executeNode(generated, input, artifact.path);
        const quickjs = executeQuickJS(engine, generated, input, artifact.path);
        assert.deepEqual(node.output, input);
        assert.deepEqual(quickjs.output, input);
        assertInPlace(node);
        assertInPlace(quickjs);
      }
    });
  }

  const artifact = scripts.find(item => item.runtimeContract === 'clone');
  test(`${plan.profile} AEROVE: QuickJS returns a projected candidate and preserves guest input and independent DNS`, () => {
    const source = fs.readFileSync(path.join(root, artifact.path), 'utf8');
    const generated = projectPlatform(source, 'script', plan, artifact);
    const input = aeroveInput();
    const baseline = executeNode(source, input, artifact.path).output;
    const observed = observeClone(generated);
    const node = executeNode(observed, input, artifact.path).output;
    const quickjs = executeQuickJS(engine, observed, input, artifact.path).output;
    assert.deepEqual(quickjs, node);
    assert.equal(Object.hasOwn(quickjs, 'error'), false);
    assert.equal(quickjs.sameConfig, false, 'AEROVE must return a separate guest candidate');
    assert.deepEqual(quickjs.after, quickjs.before);
    assert.deepEqual(quickjs.after, input);
    assert.deepEqual(quickjs.candidate.dns, input.dns);
    assert.deepEqual(quickjs.candidate.hosts, input.hosts);
    assert.deepEqual(quickjs.candidate.tun, input.tun);
    assertProjected(quickjs.candidate, baseline, plan);
  });

  test(`${plan.profile} AEROVE: QuickJS preserves maintained provider/dialer/DNS errors instead of manufacturing success`, () => {
    const source = fs.readFileSync(path.join(root, artifact.path), 'utf8');
    const generated = projectPlatform(source, 'script', plan, artifact);
    const remote = aeroveInput();
    remote['proxy-providers'] = { Remote: { type: 'http', url: 'https://example.invalid/subscription' } };
    const dialer = aeroveInput();
    dialer.proxies[0]['dialer-proxy'] = 'missing-hop';
    const dns = aeroveInput();
    dns.dns['nameserver-policy'] = { 'rule-set:old': ['https://resolver.example/dns-query'] };
    for (const [input, reason] of [[remote, /provider-input/], [dialer, /dialer-dependency/], [dns, /DNS rule-set dependency/]]) {
      assert.throws(() => executeNode(source, input, artifact.path), reason);
      assert.throws(() => executeQuickJS(engine, generated, input, artifact.path), reason);
      const node = executeNode(observeClone(generated), input, artifact.path).output;
      const quickjs = executeQuickJS(engine, observeClone(generated), input, artifact.path).output;
      assert.deepEqual(quickjs, node);
      assert.match(quickjs.error, reason);
      assert.equal(Object.hasOwn(quickjs, 'candidate'), false);
      assert.deepEqual(quickjs.after, quickjs.before);
      assert.deepEqual(quickjs.after, input);
    }
  });
}
