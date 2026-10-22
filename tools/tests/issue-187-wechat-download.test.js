'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { getRawRoutingGraph } = require('../../rulesets/source/routing-graph');
const { firstMatch, loadRepository, matchEntry } = require('../lib/ordered-rule-semantics');

const ROOT = path.resolve(__dirname, '../..');
const HOST = 'dldir1.qq.com';
const DOWNLOAD = '📥 下载更新';
const model = loadRepository({ root: ROOT });
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const segment = model.manifest.segments.find(item =>
  item.policy === DOWNLOAD && model.providers.get(`${item.id}-domain`)?.exact.has(HOST));

test('Issue #187 download host has an exact download route without a broad Tencent exemption', () => {
  assert.ok(segment, 'the download guard must be compiled into the download segment');
  assert.ok(getRawRoutingGraph().rules.includes('RULE-SET,scki-download-guard,📥 下载更新'));
  assert.match(read('rulesets/supplemental/clash/download-guard.list'), /^DOMAIN,dldir1\.qq\.com$/m);
  const route = firstMatch(model, { host: HOST }, { mode: 'domain-projection' });
  assert.equal(route.status, 'match');
  assert.deepEqual(route.unknownBlockers, []);
  assert.equal(route.policy, DOWNLOAD);
  assert.equal(route.hit.provider, `${segment.id}-domain`);
  assert.equal(route.hit.entry, `DOMAIN,${HOST}`);
  for (const host of ['qq.com', `child.${HOST}`, 'notdldir1.qq.com']) {
    assert.equal(matchEntry(`DOMAIN,${HOST}`, { host }).status, 'no-match');
  }
  assert.equal(firstMatch(model, { host: 'dldir2.qq.com' }, { mode: 'domain-projection' }).policy,
    '🛑 广告拦截', 'the existing sibling ad rejection must remain intact');
});

test('Issue #187 desktop WeChat process DIRECT precedes the generic download policy', () => {
  for (const processName of ['Weixin.exe', 'WeChat.exe', 'WeChatAppEx.exe']) {
    for (const destinationPort of [80, 443]) {
      // Synthetic connection metadata; this checks precedence, not DNS or a live download.
      const route = firstMatch(model, { host: HOST, processName, network: 'tcp', destinationPort,
        ip: '198.18.1.200', resolution: 'resolved' });
      assert.equal(route.status, 'match', `${processName}:${destinationPort}`);
      assert.equal(route.policy, 'DIRECT');
      assert.equal(route.hit.entry, `PROCESS-NAME,${processName}`);
      assert.deepEqual(route.unknownBlockers, []);
    }
  }
});

test('Issue #187 exact host survives every generated native download format', () => {
  for (const format of ['clash', 'surge']) {
    assert.match(read(`rulesets/generated/fused/${format}/${segment.id}.list`), /^DOMAIN,dldir1\.qq\.com$/m);
  }
  assert.match(read(`rulesets/generated/fused/quantumultx/${segment.id}.list`), /^host, dldir1\.qq\.com$/m);
  for (const file of [
    `rulesets/generated/fused/egern/${segment.id}.yaml`,
    `rulesets/generated/egern/provider-${segment.id}-domain.yaml`,
  ]) assert.match(read(file), /^  - "dldir1\.qq\.com"$/m);
  const singbox = JSON.parse(read(`rulesets/generated/fused/sing-box/${segment.id}.json`));
  assert.ok(singbox.rules.some(rule => rule.domain?.includes(HOST)));
  const xray = JSON.parse(read('v2rayN/v2rayN(xray).json')).find(rule => rule.id === segment.id);
  assert.ok(xray.domain.includes(`full:${HOST}`));
  for (const app of ['Passwall', 'Passwall2']) {
    assert.ok(read(`${app}/shunt-rules/${segment.id}.list`).includes(`${segment.id}.srs`));
  }
});

for (const file of ['Clash Party/ClashParty(mihomo-smart).js', 'Clash Party/ClashParty(mihomo).js', 'FlClash/FlClash(mihomo).js']) {
  test(`${file}: Issue #187 download route retains selectable DIRECT and a proxy-first default`, () => {
    const sandbox = { console: { log() {}, error() {} } };
    vm.createContext(sandbox);
    vm.runInContext(read(file) + '\nthis.entry = main;', sandbox);
    const config = sandbox.entry({ proxies: [{ name: 'HK Test', type: 'ss', server: '192.0.2.1', port: 443,
      cipher: 'aes-128-gcm', password: 'test' }], 'proxy-groups': [], rules: [] });
    const group = config['proxy-groups'].find(item => item.name === DOWNLOAD);
    assert.equal(group.type, 'select');
    assert.equal(group.proxies[0], '🌍 全球节点');
    assert.ok(group.proxies.includes('DIRECT'));
    assert.ok(config.rules.includes(`RULE-SET,${segment.id}-domain,${DOWNLOAD}`));
    assert.ok(config['rule-providers'][`${segment.id}-domain`].url.includes(`${segment.id}-domain.mrs`));
  });
}
