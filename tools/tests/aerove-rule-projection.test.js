'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { projectAeroveRouting } = require('../lib/aerove-rule-projection');

const splits = { ads: [
  { id: 'ads-part-001', url: 'https://rules.example/ads-001.mrs', cache_path: './rules/ads-001.mrs' },
  { id: 'ads-part-002', url: 'https://rules.example/ads-002.mrs', cache_path: './rules/ads-002.mrs' }
] };
function fixture() {
  return {
    'rule-providers': {
      guard: { type: 'http', url: 'https://rules.example/guard.mrs' },
      ads: { type: 'http', behavior: 'domain', format: 'mrs', url: 'https://rules.example/ads.mrs',
        path: './rules/ads.mrs', interval: 86400, proxy: 'download', header: { Authorization: ['synthetic'] } }
    },
    rules: ['DOMAIN,allowed.example,DIRECT', 'RULE-SET,ads,block,no-resolve', 'RULE-SET,guard,proxy',
      'RULE-SET,ads,alternate', 'MATCH,final'],
    dns: { nameserver: ['127.0.0.1'] }, tun: { enable: true }
  };
}
test('shards replace every reference in place while preserving policy, no-resolve and provider metadata', () => {
  const input = fixture(), before = structuredClone(input);
  const output = projectAeroveRouting(input, splits);
  assert.deepEqual(input, before);
  assert.deepEqual(output.rules, ['DOMAIN,allowed.example,DIRECT',
    'RULE-SET,ads-part-001,block,no-resolve', 'RULE-SET,ads-part-002,block,no-resolve', 'RULE-SET,guard,proxy',
    'RULE-SET,ads-part-001,alternate', 'RULE-SET,ads-part-002,alternate', 'MATCH,final']);
  assert.deepEqual(Object.keys(output['rule-providers']), ['guard', 'ads-part-001', 'ads-part-002']);
  for (const shard of splits.ads) {
    assert.deepEqual(output['rule-providers'][shard.id], { ...before['rule-providers'].ads, url: shard.url, path: shard.cache_path });
  }
  assert.deepEqual(output.dns, before.dns);
  assert.deepEqual(output.tun, before.tun);
});
test('adjacent same-policy union preserves first-match behavior including an earlier direct exception', () => {
  const output = projectAeroveRouting(fixture(), splits);
  const providers = { ads: new Set(['allowed.example', 'ad-a.example', 'ad-b.example']),
    'ads-part-001': new Set(['allowed.example', 'ad-a.example']), 'ads-part-002': new Set(['ad-b.example']),
    guard: new Set(['guard.example', 'ad-b.example']) };
  function match(rules, domain) {
    for (const line of rules) {
      const [kind, value, target] = line.split(',');
      if (kind === 'DOMAIN' && value === domain) return target;
      if (kind === 'RULE-SET' && providers[value].has(domain)) return target;
      if (kind === 'MATCH') return value;
    }
  }
  for (const domain of ['allowed.example', 'ad-a.example', 'ad-b.example', 'guard.example', 'other.example']) {
    assert.equal(match(output.rules, domain), match(fixture().rules, domain));
  }
});
test('projection rejects missing providers, identifier collisions and unsupported nested references', () => {
  const missing = fixture(); delete missing['rule-providers'].ads;
  assert.throws(() => projectAeroveRouting(missing, splits), /missing.*ads/i);
  const collision = fixture(); collision['rule-providers']['ads-part-001'] = {};
  assert.throws(() => projectAeroveRouting(collision, splits), /collision/i);
  const nested = fixture(); nested.rules[1] = 'AND,((RULE-SET,ads),(NETWORK,UDP)),block';
  assert.throws(() => projectAeroveRouting(nested, splits), /nested|unsupported/i);
});
