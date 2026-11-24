'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const graph = require('../../rulesets/source/routing-graph');
const { generateBusinessProfile } = require('../lib/business-profiles');

const root = path.resolve(__dirname, '../..');
const targets = [
  'Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js',
  'Mihomo内核系/Clash Party/ClashParty(mihomo).js',
];
const policy = graph.getClashPartyZeroTierPlanetProxyPolicy();
const oldPolicy = graph.getZeroTierPlanetProxyPolicy();
const plain = value => JSON.parse(JSON.stringify(value));
function node(name) {
  return { name, type: 'ss', server: 'example.invalid', port: 443, cipher: 'aes-128-gcm', password: 'fixture', udp: true };
}
function input(proxies = [node('US Evidence Node'), node('HK Evidence Node')]) {
  return { proxies, 'proxy-groups': [], rules: ['MATCH,DIRECT'] };
}
function compile(target, enabled) {
  let source = fs.readFileSync(path.join(root, target), 'utf8');
  source = source.replace('const SCKI_ZEROTIER_PLANET_PROXY = false', 'const SCKI_ZEROTIER_PLANET_PROXY = ' + JSON.stringify(enabled));
  const messages = [];
  const sandbox = { console: { log: (...args) => messages.push(args.join(' ')), error: (...args) => messages.push(args.join(' ')) } };
  vm.createContext(sandbox);
  vm.runInContext(source + '\nthis.mainUnderTest = main', sandbox, { filename: target, timeout: 15000 });
  return { main: sandbox.mainUnderTest, messages };
}
function compileSource(target, source) {
  const messages = [];
  const sandbox = { console: { log: (...args) => messages.push(args.join(' ')), error: (...args) => messages.push(args.join(' ')) } };
  vm.createContext(sandbox);
  vm.runInContext(source + '\nthis.mainUnderTest = main', sandbox, { filename: target, timeout: 15000 });
  return { main: sandbox.mainUnderTest, messages };
}

test('source policy uses only the four documented ZeroTier UDP/9993 destinations and selector target', () => {
  assert.deepEqual(policy, {
    groupName: '🛰️ ZeroTier 根节点', disabledChoice: 'PASS', targetGroup: '🇺🇸 美国节点',
    rules: oldPolicy.rules.map(rule => rule.slice(0, rule.lastIndexOf(',') + 1) + '🛰️ ZeroTier 根节点'),
  });
  assert.deepEqual(policy.rules.map(rule => rule.match(/IP-CIDR,([^,]+)/)[1]), [
    '103.195.103.66/32', '79.127.159.187/32', '84.17.53.155/32', '185.152.67.145/32',
  ]);
  for (const baseline of [graph.getRawRoutingGraph(), graph.getMihomoNormalizedRoutingGraph()]) {
    assert.ok(policy.rules.every(rule => !baseline.rules.includes(rule)));
    assert.ok(baseline.rules.every(rule => !rule.includes('DST-PORT,9993')));
  }
});

for (const target of targets) {
  test(`${target}: native selector defaults PASS and only local const orders its candidates`, () => {
    const baseline = compile(target, false).main(input());
    const sourceInput = input();
    sourceInput.rules.unshift(...oldPolicy.rules);
    const enabled = compile(target, true).main(sourceInput);
    const baselineGroup = baseline['proxy-groups'].find(group => group.name === policy.groupName);
    const enabledGroup = enabled['proxy-groups'].find(group => group.name === policy.groupName);
    assert.deepEqual(plain(baselineGroup), { name: policy.groupName, type: 'select', proxies: ['PASS', policy.targetGroup] });
    assert.deepEqual(plain(enabledGroup), { name: policy.groupName, type: 'select', proxies: [policy.targetGroup, 'PASS'] });
    assert.equal(baseline.profile['store-selected'], true);
    assert.equal(enabled.profile['store-selected'], true);
    assert.deepEqual(plain(baseline.rules.slice(0, 4)), policy.rules);
    assert.deepEqual(plain(enabled.rules.slice(0, 4)), policy.rules);
    assert.deepEqual(plain(enabled.rules.slice(4)), plain(baseline.rules.slice(4)));
    assert.equal(baseline['proxy-groups'].length, enabled['proxy-groups'].length);
    assert.deepEqual(
      plain(baseline['proxy-groups'].filter(group => group.name !== policy.groupName)),
      plain(enabled['proxy-groups'].filter(group => group.name !== policy.groupName)),
      'all unrelated selector definitions remain unchanged',
    );
    assert.deepEqual(plain(baseline.dns), plain(enabled.dns));
    assert.deepEqual(plain(baseline.tun), plain(enabled.tun));
    assert.ok(oldPolicy.rules.every(rule => !enabled.rules.includes(rule)), 'legacy US-target rules are removed');
    const again = compile(target, false).main(baseline);
    assert.equal(again['proxy-groups'].filter(group => group.name === policy.groupName).length, 1);
    assert.deepEqual(plain(again.rules.slice(0, 4)), policy.rules);
    assert.deepEqual(plain(again.rules.slice(4)), plain(baseline.rules.slice(4)));
  });

  test(`${target}: absent US target exposes PASS alone; legacy opt-in fails before mutation`, () => {
    const noUs = input([node('HK Evidence Node')]);
    const result = compile(target, false).main(noUs);
    assert.deepEqual(plain(result['proxy-groups'].find(group => group.name === policy.groupName)), {
      name: policy.groupName, type: 'select', proxies: ['PASS'],
    });
    const invalid = input([node('HK Evidence Node')]);
    const before = plain(invalid);
    const runner = compile(target, true);
    assert.equal(runner.main(invalid), invalid);
    assert.deepEqual(plain(invalid), before);
    assert.match(runner.messages.join('\n'), /requires existing/);
  });

  test(`${target}: subscription cannot supply selector state and name collision rejects unchanged`, () => {
    const config = input();
    config['proxy-groups'].push({ name: policy.groupName, type: 'select', proxies: ['injected'] });
    config.trafficOptions = { zeroTierPlanetProxy: true };
    const result = compile(target, false).main(config);
    assert.deepEqual(plain(result['proxy-groups'].find(group => group.name === policy.groupName).proxies), ['PASS', policy.targetGroup]);
    const collision = input([node(policy.groupName), node('US Evidence Node')]);
    const before = plain(collision);
    const runner = compile(target, false);
    assert.equal(runner.main(collision), collision);
    assert.deepEqual(plain(collision), before);
    assert.match(runner.messages.join('\n'), /collision|reserved|duplicate|ZeroTier/i);
  });

  test(`${target}: malformed or missing local flag rejects before input mutation`, () => {
    const originalSource = fs.readFileSync(path.join(root, target), 'utf8');
    for (const source of [
      originalSource.replace('const SCKI_ZEROTIER_PLANET_PROXY = false', "const SCKI_ZEROTIER_PLANET_PROXY = 'true'"),
      originalSource.replace(/^const SCKI_ZEROTIER_PLANET_PROXY = false\r?\n/m, ''),
    ]) {
      const config = input();
      const before = plain(config);
      const runner = compileSource(target, source);
      assert.equal(runner.main(config), config);
      assert.deepEqual(plain(config), before);
      assert.match(runner.messages.join('\n'), /Invalid SCKI traffic options|SCKI_ZEROTIER_PLANET_PROXY is not defined/);
    }
  });
}

test('browser UDP guards remain ahead of all four ZeroTier routes', () => {
  for (const target of targets) {
    let source = fs.readFileSync(path.join(root, target), 'utf8');
    source = source.replace('const SCKI_ZEROTIER_PLANET_PROXY = false', 'const SCKI_ZEROTIER_PLANET_PROXY = true')
      .replace("const SCKI_BROWSER_UDP_POLICY = 'off'", "const SCKI_BROWSER_UDP_POLICY = 'reject'");
    const sandbox = { console: { log() {}, error() {} } };
    vm.createContext(sandbox);
    vm.runInContext(source + '\nthis.mainUnderTest = main', sandbox, { filename: target, timeout: 15000 });
    const result = sandbox.mainUnderTest(input());
    const guards = ['chrome.exe', 'msedge.exe', 'firefox.exe'].map(name => `AND,((NETWORK,UDP),(PROCESS-NAME,${name})),REJECT`);
    assert.deepEqual(plain(result.rules.slice(0, guards.length)), guards);
    assert.deepEqual(plain(result.rules.slice(guards.length, guards.length + 4)), policy.rules);
  }
});

test('custom business projection retains the independent ZeroTier selector and owned routes', t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-zerotier-custom-'));
  const outputDir = path.join(temp, 'out');
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const generated = generateBusinessProfile({ profile: 'custom', enable: [], outputDir, root });
  const smartPath = path.join(outputDir, targets[0]);
  const projectedSmart = fs.readFileSync(smartPath, 'utf8');
  assert.match(projectedSmart, new RegExp(policy.groupName));
  for (const rule of policy.rules) assert.ok(projectedSmart.includes(rule), `custom projection retains ${rule}`);
  assert.ok(generated.manifest.disabled_services.length > 0);
});
