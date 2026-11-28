'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { normalizeMihomoMrsProviderEntries } = require('../../rulesets/source/routing-graph');
const { firstMatch, loadRepository } = require('../lib/ordered-rule-semantics');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const segment = 'scki-fused-033-ai';
const ai = '🤖 AI 服务';
const advertising = '🛑 广告拦截';

test('Dola and Trae keep AI routing while unrelated shared domains leave it', () => {
  assert.deepEqual(normalizeMihomoMrsProviderEntries('szkane-ai', [
    'DOMAIN-SUFFIX,usefathom.com', '+.usefathom.com', 'DOMAIN-SUFFIX,muse.ai',
  ]), ['DOMAIN-SUFFIX,muse.ai']);
  const mirror = read('mirrors/CiciAi.list');
  assert.doesNotMatch(mirror, /^(?:DOMAIN-KEYWORD,dola|DOMAIN-SUFFIX,(?:(?:mcs|mon)\.)?zijieapi\.com)$/m);

  const model = loadRepository();
  const route = host => firstMatch(model, { host }, { mode: 'domain-projection', collectOverlaps: true });
  for (const host of ['www.dola.com', 'api.dola.com', 'www.trae.ai', 'api.marscode.com']) {
    assert.equal(route(host).policy, ai, host);
  }
  for (const host of ['cdn.usefathom.com', 'collect.usefathom.com', 'mcs.zijieapi.com', 'mon.zijieapi.com']) {
    assert.equal(route(host).policy, advertising, host);
  }
  for (const host of ['developer-product.zijieapi.com', 'rtc-access-src.zijieapi.com',
    'thedolab.com', 'thedolab.myshopify.com', 'api.usefathom.com', 'app.usefathom.com']) {
    const result = route(host);
    assert.notEqual(result.firstDecidableMatch?.policy, ai, host);
    assert.ok(!result.overlaps.some(match => match.policy === ai), host);
    // The static matcher leaves the anchored Azure Web PubSub expression undecided.
    for (const blocker of result.unknownBlockers) {
      assert.equal(blocker.entry, 'DOMAIN-REGEX,^chatgpt-async-webps-prod-\\S+-\\d+\\.webpubsub\\.azure\\.com$');
      assert.ok(!host.endsWith('.webpubsub.azure.com'), host);
    }
  }
});

test('033 projections preserve the explicit Dola suffix and independent IP and process predicates', () => {
  for (const platform of ['clash', 'surge', 'quantumultx']) {
    const list = read(`rulesets/generated/fused/${platform}/${segment}.list`).split(/\r?\n/);
    assert.ok(list.includes(platform === 'quantumultx' ? 'host-suffix, dola.com' : 'DOMAIN-SUFFIX,dola.com'), platform);
    assert.ok(!list.includes(platform === 'quantumultx' ? 'host-keyword, dola' : 'DOMAIN-KEYWORD,dola'), platform);
  }
  const { rules } = JSON.parse(read(`rulesets/generated/fused/sing-box/${segment}.json`));
  assert.ok(rules.some(rule => rule.domain_suffix?.includes('dola.com')));
  assert.ok(!rules.some(rule => rule.domain_keyword?.includes('dola')
    || rule.domain_suffix?.some(host => host === 'usefathom.com' || host === 'zijieapi.com')));
  assert.ok(rules.some(rule => rule.ip_cidr?.includes('23.41.4.0/22')));
  assert.ok(rules.some(rule => rule.process_name?.includes('Code Helper (Plugin)') && Object.keys(rule).length === 1));

  const egern = `rulesets/generated/egern/provider-${segment}`;
  assert.match(read(`${egern}-domain.yaml`), /^  - "dola\.com"$/m);
  assert.doesNotMatch(read(`${egern}-domain.yaml`), /^  - "(?:usefathom|zijieapi)\.com"$/m);
  assert.doesNotMatch(read(`${egern}-residual.yaml`), /^  - "dola"$/m);
});
