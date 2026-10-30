'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const runtime = require('../runtime/traffic-options');
const graph = require('../../rulesets/source/routing-graph');
const { firstMatch } = require('../lib/ordered-rule-semantics');
const { prepareUpdates } = require('../sync-traffic-options');
const { setLocalTrafficOptions, parseLocalTrafficOptions } = require('../lib/local-traffic-options');

const root = path.resolve(__dirname, '../..');
const targets = ['Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js', 'Mihomo内核系/Clash Party/ClashParty(mihomo).js', 'Mihomo内核系/FlClash/FlClash(mihomo).js'];
const guards = [
  'AND,((NETWORK,UDP),(PROCESS-NAME,chrome.exe)),REJECT',
  'AND,((NETWORK,UDP),(PROCESS-NAME,msedge.exe)),REJECT',
  'AND,((NETWORK,UDP),(PROCESS-NAME,firefox.exe)),REJECT',
];
const plain = value => JSON.parse(JSON.stringify(value));
function input() {
  return { proxies: [{ name: 'US Privacy Fixture', type: 'ss', server: 'example.invalid', port: 443, cipher: 'aes-128-gcm', password: 'fixture', udp: true }], 'proxy-groups': [], rules: [] };
}
function compile(target, policy, quic = 'block-foreign', zeroTier = false) {
  let source = fs.readFileSync(path.join(root, target), 'utf8');
  if (arguments.length > 1) {
    assert.match(source, /const SCKI_BROWSER_UDP_POLICY = 'off'(?:\s|;|$)/);
    source = source.replace("const SCKI_BROWSER_UDP_POLICY = 'off'", 'const SCKI_BROWSER_UDP_POLICY = ' + JSON.stringify(policy));
  }
  source = source.replace(/const SCKI_QUIC_POLICY = '[^']*'/, `const SCKI_QUIC_POLICY = '${quic}'`)
    .replace('const SCKI_ZEROTIER_PLANET_PROXY = false', 'const SCKI_ZEROTIER_PLANET_PROXY = ' + zeroTier);
  const messages = [];
  const sandbox = { process: { env: { SCKI_BROWSER_UDP_POLICY: 'reject' } }, console: { log: (...args) => messages.push(args.join(' ')), error: (...args) => messages.push(args.join(' ')) } };
  vm.runInNewContext(source + '\nthis.run = main', sandbox, { filename: target, timeout: 15000 });
  return { run: sandbox.run, messages };
}
function route(rules, probe) {
  return firstMatch({ providers: new Map(), rules: rules.map((rule, index) => ({ rule, index, policy: rule.slice(rule.lastIndexOf(',') + 1), provider: null, path: 'fixture/rules', source: 'fixture' })) }, probe);
}

test('invalid browser UDP policy rejects before a caller can mutate its configuration', () => {
  for (const browserUdpPolicy of ['allow', undefined]) {
    assert.throws(() => runtime.validate({ healthCheckProfile: 'standard', quicPolicy: 'block-foreign', browserUdpPolicy }), /Invalid SCKI traffic options/);
  }
});

test('browser UDP opt-in catches STUN and arbitrary ports without rejecting TCP or other applications', () => {
  const baseline = ['DST-PORT,19302,DIRECT', 'MATCH,DIRECT'];
  const rules = baseline.slice();
  runtime.applyBrowserUdpPolicy(rules, 'reject');
  for (const processName of ['chrome.exe', 'msedge.exe', 'firefox.exe', 'CHROME.EXE']) {
    for (const destinationPort of [19302, 3478, 443, 49152]) {
      assert.equal(route(rules, { processName, network: 'udp', destinationPort }).policy, 'REJECT');
    }
  }
  assert.equal(route(rules, { processName: 'chrome.exe', network: 'tcp', destinationPort: 19302 }).policy, 'DIRECT');
  assert.equal(route(rules, { processName: 'zerotier-one.exe', network: 'udp', destinationPort: 19302 }).policy, 'DIRECT');
  assert.equal(route(rules, { network: 'udp', destinationPort: 19302 }).status, 'unknown', 'Unavailable process attribution is not proven protected');
  runtime.applyBrowserUdpPolicy(rules, 'reject');
  assert.deepEqual(rules, guards.concat(baseline), 'Repeated activation has no duplicates');
  runtime.applyBrowserUdpPolicy(rules, 'off');
  runtime.applyBrowserUdpPolicy(rules, 'off');
  assert.deepEqual(rules, baseline, 'Deactivation removes only the owned safety layer');
  assert.throws(() => runtime.applyBrowserUdpPolicy(rules, true), /Invalid/);
  assert.deepEqual(rules, baseline, 'Invalid selection cannot remove or insert rules');
});

test('trusted privacy policy leaves both default source graphs unchanged', () => {
  for (const baseline of [graph.getRawRoutingGraph(), graph.getMihomoNormalizedRoutingGraph()]) {
    assert.ok(guards.every(rule => !baseline.rules.includes(rule)));
    assert.ok(baseline.rules.includes('DST-PORT,19302,DIRECT'));
  }
});

test('runtime synchronization preserves each explicit local privacy choice', () => {
  for (const browserUdpPolicy of ['off', 'reject']) {
    const updates = prepareUpdates(graph.getTrafficOptions(), (file, encoding) => {
      const source = fs.readFileSync(file, encoding);
      return targets.some(target => path.resolve(root, target) === file)
        ? setLocalTrafficOptions(source, { browserUdpPolicy }) : source;
    });
    for (const update of updates.slice(1)) {
      assert.equal(parseLocalTrafficOptions(update.updated).options.browserUdpPolicy, browserUdpPolicy);
    }
  }
});

for (const target of targets) {
  test(`${target}: default remains off and subscription/environment data cannot enable privacy`, () => {
    const baseline = compile(target).run(input());
    assert.ok(guards.every(rule => !baseline.rules.includes(rule)));
    assert.ok(baseline.rules.includes('DST-PORT,19302,DIRECT'));
    const config = input();
    config.SCKI_BROWSER_UDP_POLICY = 'reject';
    config.browserUdpPolicy = 'reject';
    config.trafficOptions = { browserUdpPolicy: 'reject' };
    config.env = { SCKI_BROWSER_UDP_POLICY: 'reject' };
    assert.deepEqual(plain(compile(target).run(config).rules), plain(baseline.rules));
  });
  test(`${target}: local privacy has highest priority for each QUIC/ZeroTier combination`, () => {
    for (const quic of ['block-foreign', 'follow-rules']) for (const zeroTier of [false, true]) {
      const baseline = compile(target, 'off', quic, zeroTier).run(input());
      const enabled = compile(target, 'reject', quic, zeroTier).run(input());
      assert.deepEqual(plain(enabled.rules.slice(0, guards.length)), guards);
      const withoutGuards = plain(enabled); withoutGuards.rules = withoutGuards.rules.slice(guards.length);
      assert.deepEqual(withoutGuards, plain(baseline), 'Only the browser safety rules change');
      assert.equal(enabled['find-process-mode'], 'strict');
      assert.ok(enabled.rules.indexOf('DST-PORT,19302,DIRECT') >= guards.length);
      if (zeroTier) assert.ok(enabled.rules.indexOf(graph.getZeroTierPlanetProxyPolicy().rules[0]) >= guards.length);
      if (quic === 'block-foreign') assert.ok(enabled.rules.indexOf(graph.getQuicRules(quic)[0]) >= guards.length);
      const repeated = compile(target, 'reject', quic, zeroTier).run(enabled);
      assert.deepEqual(plain(repeated.rules), guards.concat(plain(baseline.rules)));
      assert.deepEqual(plain(compile(target, 'off', quic, zeroTier).run(repeated).rules), plain(baseline.rules));
    }
  });
  test(`${target}: invalid local policy rejects before input mutation`, () => {
    for (const policy of ['allow', true, 1, null, {}, undefined]) {
      const config = input(); const before = plain(config);
      const runner = compile(target, policy);
      assert.equal(runner.run(config), config);
      assert.deepEqual(plain(config), before);
      assert.match(runner.messages.join('\n'), /Invalid SCKI traffic options/);
    }
  });
}
