'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const graph = require('../../rulesets/source/routing-graph.js');

const root = path.resolve(__dirname, '../..');
const targets = [
  ['Clash Party/ClashParty(mihomo-smart).js', 'smart'],
  ['Clash Party/ClashParty(mihomo).js', 'url-test'],
  ['FlClash/FlClash(mihomo).js', 'url-test'],
];
const five = graph.getQuicRules('block-foreign');
const ids = require('../lib/fused-contract-segments').resolveContractSegments();

function run(target, profile, policy) {
  let source = fs.readFileSync(path.join(root, target), 'utf8');
  source = source.replace(/const SCKI_HEALTH_CHECK_PROFILE = '[^']*'/, `const SCKI_HEALTH_CHECK_PROFILE = '${profile}'`)
    .replace(/const SCKI_QUIC_POLICY = '[^']*'/, `const SCKI_QUIC_POLICY = '${policy}'`);
  const messages = [];
  const sandbox = { console: { log: (...args) => messages.push(args.join(' ')), error: (...args) => messages.push(args.join(' ')) } };
  vm.createContext(sandbox);
  vm.runInContext(`${source}\nthis.__main = main`, sandbox, { filename: target, timeout: 15000 });
  const config = { proxies: [{ name: 'HK Node', type: 'ss', server: 'example.invalid', port: 443, cipher: 'aes-128-gcm', password: 'x' }], 'proxy-groups': [], rules: [] };
  const before = structuredClone(config);
  const result = sandbox.__main(config);
  return { config, before, result, messages: messages.join('\n') };
}

test('source options and QUIC authority retain baseline order', () => {
  const configured = JSON.parse(fs.readFileSync(path.join(root, 'rulesets/source/traffic-options.json'), 'utf8'));
  assert.deepEqual(graph.getTrafficOptions(), configured);
  assert.equal(graph.validateTrafficOptions(configured), configured);
  assert.equal(five.length, 5);
  const rules = graph.buildMihomoRoutingGraph({ quicPolicy: 'block-foreign' }).rules;
  const quicStart = rules.indexOf(five[0]);
  assert.ok(quicStart > rules.indexOf('RULE-SET,anti-ad,🛑 广告拦截'));
  assert.deepEqual(rules.slice(quicStart, quicStart + five.length), five);
  assert.ok(quicStart < rules.indexOf('GEOIP,private,DIRECT,no-resolve'));
  const following = graph.buildMihomoRoutingGraph({ quicPolicy: 'follow-rules' }).rules;
  assert.ok(five.every(rule => !following.includes(rule)));
  assert.throws(() => graph.buildMihomoRoutingGraph({ quicPolicy: 'unknown' }), /Invalid QUIC policy/);
});

test('source health profiles keep the selected interval with lazy checks in both modes', () => {
  assert.deepEqual(graph.getHealthCheckSettings('standard'), { intervalSeconds: 300, lazy: true });
  assert.deepEqual(graph.getHealthCheckSettings('power-save'), { intervalSeconds: 900, lazy: true });
  assert.deepEqual(graph.getHealthCheckSettings(), graph.getHealthCheckSettings(graph.getTrafficOptions().healthCheckProfile));
  assert.throws(() => graph.getHealthCheckSettings('unknown'), /Invalid health check profile/);
});

for (const [target, groupType] of targets) {
  for (const profile of ['standard', 'power-save']) {
    for (const policy of ['block-foreign', 'follow-rules']) {
      test(`${target}: ${profile} + ${policy}`, () => {
        const { config, result } = run(target, profile, policy);
        assert.equal(result, config);
        const groups = config['proxy-groups'].filter(group => group.type === groupType);
        assert.ok(groups.length > 0);
        assert.ok(groups.every(group => group.interval === (profile === 'power-save' ? 900 : 300)));
        assert.ok(groups.every(group => group.lazy === true));
        for (const rule of five) assert.equal(config.rules.includes(rule), policy === 'block-foreign');
        assert.ok(config.rules.indexOf(`RULE-SET,${ids['scki-fused-006-ad']}-domain,🛑 广告拦截`) < config.rules.indexOf('DST-PORT,7680,REJECT'));
        assert.ok(config.rules.indexOf('DST-PORT,7680,REJECT') < config.rules.indexOf(`RULE-SET,${ids['scki-fused-008-direct']}-domain,DIRECT`));
      });
    }
  }
  test(`${target}: invalid local values reject before mutation`, () => {
    for (const [profile, policy] of [['unknown', 'block-foreign'], ['standard', 'unknown']]) {
      const { config, before, messages } = run(target, profile, policy);
      assert.deepEqual(config, before);
      assert.match(messages, /Invalid SCKI traffic options/);
    }
  });
}

test('embedded runtime is synchronized with the source graph', () => {
  execFileSync(process.execPath, ['tools/sync-traffic-options.js', '--check'], { cwd: root, stdio: 'pipe' });
});
