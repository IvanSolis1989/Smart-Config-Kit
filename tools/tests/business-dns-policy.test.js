'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const graph = require('../../rulesets/source/routing-graph');
const {
  SOURCE_FILE, validateBusinessDnsPolicy, compileBusinessDnsPolicy,
} = require('../lib/business-dns-policy');

const contract = () => JSON.parse(fs.readFileSync(path.resolve(__dirname, '../..', SOURCE_FILE), 'utf8'));
const rawGraph = () => graph.getRawRoutingGraph();
const expected = {
  '+.jsdelivr.net': ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
  '+.github.com': ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
  '+.githubusercontent.com': ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
  '+.githubassets.com': ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
  '+.fastly.net': ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
  'geosite:cn': ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'],
  'geosite:geolocation-!cn': ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
};

test('real routing graph compiles the seven existing policies without changing values', () => {
  const source = contract();
  assert.equal(validateBusinessDnsPolicy(source, rawGraph()), source);
  const result = compileBusinessDnsPolicy(source, rawGraph());
  assert.deepEqual(result.javascript, expected);
  assert.deepEqual(result.yaml, expected);
  assert.deepEqual(Object.keys(result.javascript), Object.keys(expected));
  assert.deepEqual(Object.keys(result.yaml), [
    'geosite:cn', 'geosite:geolocation-!cn', '+.jsdelivr.net', '+.github.com',
    '+.githubusercontent.com', '+.githubassets.com', '+.fastly.net',
  ]);
});

test('compiled arrays are isolated from the source, other keys, formats and calls', () => {
  const source = contract();
  const result = compileBusinessDnsPolicy(source, rawGraph());
  result.javascript['+.github.com'].push('changed');
  result.yaml['+.fastly.net'][0] = 'changed';
  assert.deepEqual(source.resolvers.foreign, ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query']);
  assert.deepEqual(result.javascript['+.fastly.net'], expected['+.fastly.net']);
  assert.deepEqual(result.yaml['+.github.com'], expected['+.github.com']);
  assert.deepEqual(compileBusinessDnsPolicy(source, rawGraph()).javascript, expected);
});

const invalidContracts = [
  ['nonobject contract', () => null, /contract.*object/],
  ['schema version', source => { source.schemaVersion = 2; }, /schemaVersion/],
  ['unknown root key', source => { source.extra = true; }, /unknown.*extra/i],
  ['missing root key', source => { delete source.policies; }, /policies/],
  ['unknown resolver key', source => { source.resolvers.other = []; }, /unknown.*other/i],
  ['empty resolvers', source => { source.resolvers.domestic = []; }, /resolvers.domestic/],
  ['unsupported URL scheme', source => { source.resolvers.foreign[0] = 'http://dns.example/dns-query'; }, /HTTPS/],
  ['invalid URL', source => { source.resolvers.foreign[0] = 'not a URL'; }, /URL/],
  ['ambiguous URL syntax', source => { source.resolvers.foreign[0] = 'https:dns.example/dns-query'; }, /URL/],
  ['URL credentials', source => { source.resolvers.foreign[0] = 'https://user:pass@dns.example/dns-query'; }, /URL/],
  ['URL transport fragment', source => { source.resolvers.foreign[0] += '#proxy'; }, /URL/],
  ['duplicate resolver URL', source => { source.resolvers.foreign.push(source.resolvers.foreign[0]); }, /duplicate/i],
  ['empty policies', source => { source.policies = []; }, /policies/],
  ['nonobject policy', source => { source.policies[0] = null; }, /policies\[0\].*object/],
  ['unknown policy key', source => { source.policies[0].extra = true; }, /unknown.*extra/i],
  ['empty id', source => { source.policies[0].id = ''; }, /id/],
  ['duplicate id', source => { source.policies[1].id = source.policies[0].id; }, /duplicate.*id/i],
  ['duplicate match', source => { source.policies[1].match = source.policies[0].match; }, /duplicate.*match/i],
  ['unsupported match', source => { source.policies[0].match = 'rule-set:github'; }, /match/],
  ['invalid domain match', source => { source.policies[0].match = '+.bad..example'; }, /match/],
  ['invalid geosite match', source => { source.policies[0].match = 'geosite:cn,proxy'; }, /match/],
  ['undefined resolver', source => { source.policies[0].resolver = 'missing'; }, /resolver/],
  ['empty routing references', source => { source.policies[0].routingReferences = []; }, /routingReferences/],
  ['nonobject routing reference', source => { source.policies[0].routingReferences[0] = null; }, /reference object/],
  ['unknown reference type', source => { source.policies[0].routingReferences = [{ type: 'other' }]; }, /type/],
  ['unknown reference key', source => { source.policies[0].routingReferences[0].extra = true; }, /unknown.*extra/i],
  ['invalid URL suffix', source => { source.policies[0].routingReferences[0].value = 'https://jsdelivr.net'; }, /suffix/i],
  ['unmatched URL suffix', source => { source.policies[0].routingReferences[0].value = 'missing.example'; }, /provider.*URL/i],
  ['missing provider', source => { source.policies[1].routingReferences[0].name = 'missing'; }, /provider.*missing/i],
  ['wrong provider target', source => { source.policies[1].routingReferences[0].policy = 'DIRECT'; }, /RULE-SET,github,DIRECT/],
  ['missing exact rule', source => { source.policies[4].routingReferences[0].value = 'DOMAIN-SUFFIX,fastly.net,DIRECT'; }, /exact.*rule/i],
];
for (const [name, mutate, error] of invalidContracts) {
  test(`rejects ${name}`, () => {
    const source = contract();
    const mutated = mutate(source);
    assert.throws(() => compileBusinessDnsPolicy(mutated === null ? null : source, rawGraph()), error);
  });
}

test('routing source drift fails even while the business policy is unchanged', () => {
  const source = contract();
  const missing = rawGraph();
  delete missing['rule-providers'].github;
  assert.throws(() => validateBusinessDnsPolicy(source, missing), /provider.*github/i);
  const retargeted = rawGraph();
  retargeted.rules = retargeted.rules.map(rule => rule === 'RULE-SET,github,🔧 工具与服务' ? 'RULE-SET,github,DIRECT' : rule);
  assert.throws(() => validateBusinessDnsPolicy(source, retargeted), /RULE-SET,github,🔧 工具与服务/);
  const removed = rawGraph();
  removed.rules = removed.rules.filter(rule => rule !== 'DOMAIN-SUFFIX,fastly.net,🌐 国外网站');
  assert.throws(() => validateBusinessDnsPolicy(source, removed), /exact.*rule/i);
});

test('malformed routing graph cannot bypass provenance checks', () => {
  for (const broken of [null, {}, { 'rule-providers': [], rules: [] }, { 'rule-providers': {}, rules: [null] }]) {
    assert.throws(() => validateBusinessDnsPolicy(contract(), broken), /rawGraph/);
  }
});

test('provider URL suffix uses hostname boundaries and only HTTP provider entries', () => {
  const source = contract();
  for (const url of ['https://eviljsdelivr.net/list', 'https://jsdelivr.net.evil.example/list', 'https://example.com/jsdelivr.net/list']) {
    const changed = rawGraph();
    for (const provider of Object.values(changed['rule-providers'])) provider.url = url;
    assert.throws(() => validateBusinessDnsPolicy(source, changed), /provider.*URL/i);
  }
  const changed = rawGraph();
  for (const provider of Object.values(changed['rule-providers'])) {
    provider.type = 'file';
    provider.url = 'https://cdn.jsdelivr.net/list';
  }
  assert.throws(() => validateBusinessDnsPolicy(source, changed), /provider.*URL/i);
});
