'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const graph = require('../../rulesets/source/routing-graph');
const runtime = require('../runtime/traffic-options');
const { prepareUpdates } = require('../sync-traffic-options');

const root = path.resolve(__dirname, '../..');
const targets = ['Clash Party/ClashParty(mihomo-smart).js', 'Clash Party/ClashParty(mihomo).js', 'FlClash/FlClash(mihomo).js'];
const planet = graph.getZeroTierPlanetProxyPolicy();
const plain = value => JSON.parse(JSON.stringify(value));
function node(name) {
  return { name, type: 'ss', server: 'example.invalid', port: 443, cipher: 'aes-128-gcm', password: 'fixture', udp: true };
}
function input() { return { proxies: [node('US Evidence Node'), node('HK Evidence Node')], 'proxy-groups': [], rules: [] }; }
function compile(target, value, profile = 'standard', policy = 'block-foreign') {
  let source = fs.readFileSync(path.join(root, target), 'utf8');
  assert.match(source, /const SCKI_ZEROTIER_PLANET_PROXY = false\b/, 'Published default must stay off');
  if (value !== undefined) source = source.replace('const SCKI_ZEROTIER_PLANET_PROXY = false', 'const SCKI_ZEROTIER_PLANET_PROXY = ' + JSON.stringify(value));
  source = source.replace(/const SCKI_HEALTH_CHECK_PROFILE = '[^']*'/, `const SCKI_HEALTH_CHECK_PROFILE = '${profile}'`)
    .replace(/const SCKI_QUIC_POLICY = '[^']*'/, `const SCKI_QUIC_POLICY = '${policy}'`);
  const messages = [];
  const sandbox = { process: { env: { SCKI_ZEROTIER_PLANET_PROXY: 'true' } }, console: { log: (...args) => messages.push(args.join(' ')), error: (...args) => messages.push(args.join(' ')) } };
  vm.createContext(sandbox);
  vm.runInContext(source + '\nthis.mainUnderTest = main', sandbox, { filename: target, timeout: 15000 });
  return { main: sandbox.mainUnderTest, messages };
}

test('source policy is exactly the four retained trial rules, outside the default graph', () => {
  assert.deepEqual(planet, { targetGroup: '🇺🇸 美国节点', rules: [
    'AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,103.195.103.66/32,no-resolve)),🇺🇸 美国节点',
    'AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,79.127.159.187/32,no-resolve)),🇺🇸 美国节点',
    'AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,84.17.53.155/32,no-resolve)),🇺🇸 美国节点',
    'AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,185.152.67.145/32,no-resolve)),🇺🇸 美国节点',
  ] });
  for (const baseline of [graph.getRawRoutingGraph(), graph.getMihomoNormalizedRoutingGraph()]) {
    assert.ok(planet.rules.every(rule => !baseline.rules.includes(rule)));
    assert.ok(baseline.rules.every(rule => !rule.includes('DST-PORT,9993')));
  }
  const copy = graph.getZeroTierPlanetProxyPolicy();
  copy.rules[0] = 'MATCH,DIRECT';
  assert.deepEqual(graph.getZeroTierPlanetProxyPolicy(), planet, 'Consumers cannot mutate source policy');
});

test('runtime prepends idempotently, preserves unrelated rules, and fails before mutation without the target', () => {
  const other = 'AND,((NETWORK,TCP),(DST-PORT,9993),(IP-CIDR,103.195.103.66/32,no-resolve)),DIRECT';
  const baseline = [other, 'IP-CIDR,103.195.103.66/32,DIRECT,no-resolve', 'MATCH,DIRECT'];
  const rules = baseline.slice();
  assert.equal(runtime.applyZeroTierPlanetProxy(rules, true, [planet.targetGroup]), rules);
  assert.deepEqual(rules, planet.rules.concat(baseline));
  runtime.applyZeroTierPlanetProxy(rules, true, [planet.targetGroup]);
  assert.deepEqual(rules, planet.rules.concat(baseline));
  runtime.applyZeroTierPlanetProxy(rules, false, []);
  assert.deepEqual(rules, baseline);
  assert.throws(() => runtime.applyZeroTierPlanetProxy(rules, true, []), /requires existing/);
  assert.deepEqual(rules, baseline);
  assert.throws(() => runtime.applyZeroTierPlanetProxy(rules, 'true', [planet.targetGroup]), /Invalid/);
  assert.deepEqual(rules, baseline);
});

for (const target of targets) {
  for (const profile of ['standard', 'power-save']) for (const policy of ['block-foreign', 'follow-rules']) {
    test(`${target}: local opt-in adds only four highest-priority rules (${profile}, ${policy})`, () => {
      const baseline = compile(target, undefined, profile, policy).main(input());
      const enabled = compile(target, true, profile, policy).main(input());
      assert.deepEqual(plain(enabled.rules.slice(0, 4)), planet.rules);
      assert.deepEqual(plain(enabled.rules.slice(4)), plain(baseline.rules));
      assert.deepEqual(plain(enabled['proxy-groups']), plain(baseline['proxy-groups']));
      const enabledWithoutLocalRules = plain(enabled); enabledWithoutLocalRules.rules = enabledWithoutLocalRules.rules.slice(4);
      assert.deepEqual(enabledWithoutLocalRules, plain(baseline));
      assert.ok(enabled['proxy-groups'].some(group => group.name === planet.targetGroup));
      const repeat = compile(target, true, profile, policy).main(enabled);
      assert.deepEqual(plain(repeat.rules), planet.rules.concat(plain(baseline.rules)));
    });
  }
  test(`${target}: subscription and system environment cannot select the local option`, () => {
    const baseline = compile(target).main(input());
    const config = input();
    config.SCKI_ZEROTIER_PLANET_PROXY = true;
    config['zero-tier-planet-proxy'] = true;
    config.trafficOptions = { zeroTierPlanetProxy: true };
    config.env = { SCKI_ZEROTIER_PLANET_PROXY: true };
    const actual = compile(target).main(config);
    assert.deepEqual(plain(actual.rules), plain(baseline.rules));
    assert.ok(planet.rules.every(rule => !actual.rules.includes(rule)));
  });
  test(`${target}: absent or filtered target rejects before any input change`, () => {
    for (const proxies of [[node('HK Evidence Node')], [node('US 套餐到期')], [{ name: 'US Direct', type: 'direct' }], []]) {
      const config = { proxies, 'proxy-groups': [{ name: planet.targetGroup, type: 'select', proxies: ['DIRECT'] }], rules: ['MATCH,DIRECT'] };
      const before = structuredClone(config);
      const runner = compile(target, true);
      assert.equal(runner.main(config), config);
      assert.deepEqual(plain(config), before);
      assert.match(runner.messages.join('\n'), /requires existing/);
    }
  });
  test(`${target}: malformed local values reject before any input change`, () => {
    for (const value of ['true', 1, null, {}]) {
      const config = input(); const before = structuredClone(config);
      const runner = compile(target, value);
      assert.equal(runner.main(config), config);
      assert.deepEqual(plain(config), before);
      assert.match(runner.messages.join('\n'), /Invalid SCKI traffic options/);
    }
  });
}

test('runtime and all JS products synchronize graph policy and default-off local constants', () => {
  const updates = prepareUpdates();
  assert.equal(updates.length, 4);
  assert.ok(updates.every(update => update.original === update.updated));
  for (const update of updates.slice(1)) assert.match(update.updated, /const SCKI_ZEROTIER_PLANET_PROXY = false\b/);
});
