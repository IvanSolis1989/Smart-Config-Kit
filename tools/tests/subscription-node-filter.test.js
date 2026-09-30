'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const targets = [
  'Clash Party/ClashParty(mihomo-smart).js',
  'Clash Party/ClashParty(mihomo).js',
  'FlClash/FlClash(mihomo).js',
];

function node(name, extra = {}) {
  return { name, type: 'trojan', server: 'example.invalid', port: 443, password: 'secret', ...extra };
}

function run(target, config, max = null) {
  let source = fs.readFileSync(path.join(root, target), 'utf8');
  source = source.replace(/const SCKI_MAX_NODE_MULTIPLIER = null/, `const SCKI_MAX_NODE_MULTIPLIER = ${JSON.stringify(max)}`);
  const messages = [];
  const sandbox = { console: { log: (...args) => messages.push(args.join(' ')), error: (...args) => messages.push(args.join(' ')) } };
  vm.createContext(sandbox);
  vm.runInContext(`${source}\nthis.__main = main`, sandbox, { filename: target, timeout: 15000 });
  const input = structuredClone(config);
  const refs = { proxies: input.proxies, groups: input['proxy-groups'], rules: input.rules };
  const result = sandbox.__main(input);
  return { input, result, refs, messages: messages.join('\n') };
}

for (const target of targets) {
  test(`${target}: inline filtering projects only surviving node DNS hints`, () => {
    const source = {
      'proxy-providers': { local: { type: 'inline', payload: [
        node('HK Inline x1', { server: 'inline.private.example' }),
        node('US Inline x3', { server: 'removed.private.example' }),
        node('Panel Notice'),
      ] } },
      dns: { 'proxy-server-nameserver-policy': {
        'inline.private.example': ['10.0.0.53'], 'removed.private.example': ['10.0.0.54'],
      } }, 'proxy-groups': [], rules: [],
    };
    const { input, messages } = run(target, source, 2);
    assert.deepEqual(Array.from(input.proxies, p => p.name), ['HK Inline x1']);
    assert.deepEqual(Array.from(input.dns['proxy-server-nameserver-policy']['inline.private.example']), ['10.0.0.53']);
    assert.equal(Object.hasOwn(input.dns['proxy-server-nameserver-policy'], 'removed.private.example'), false);
    assert.doesNotMatch(messages, /inline\.private\.example|10\.0\.0\.53|secret/);
    assert.deepEqual(Array.from(run(target, input, 2).input.proxies, p => p.name), ['HK Inline x1']);
  });

  test(`${target}: every inline provider option outside literal payload is rejected atomically`, () => {
    for (const field of ['filter', 'exclude-filter', 'exclude-type', 'override', 'health-check', 'url', 'path', 'interval', 'proxy', 'unknown']) {
      const source = { proxies: [node('JP Explicit')], 'proxy-providers': {
        good: { type: 'inline', payload: [node('HK Inline')] },
        bad: { type: 'inline', payload: [node('US Inline')], [field]: null },
      }, dns: { nameserver: ['1.1.1.1'] }, rules: ['MATCH,DIRECT'] };
      const { input, messages } = run(target, source);
      assert.deepEqual(input, source, field);
      assert.match(messages, /provider-input/);
    }
  });

  test(`${target}: conflicting inline identity and cross-source cycles reject before any mutation`, () => {
    const cases = [
      { proxies: [node('HK Shared')], 'proxy-providers': { local: { type: 'inline', payload: [node('HK Shared', { server: 'different.invalid' })] } } },
      { proxies: [node('HK A', { 'dialer-proxy': 'US B' })], 'proxy-providers': { local: { type: 'inline', payload: [node('US B', { 'dialer-proxy': 'HK A' })] } } },
      { proxies: [node('HK Dependent', { 'dialer-proxy': 'US x3' })], 'proxy-providers': { local: { type: 'inline', payload: [node('US x3')] } } },
    ];
    for (const entry of cases) {
      const source = { ...entry, dns: { nameserver: ['1.1.1.1'] }, rules: ['MATCH,DIRECT'] };
      const { input, messages } = run(target, source, 2);
      assert.deepEqual(input, source);
      assert.match(messages, /duplicate-name-conflict|dialer-cycle|dialer-dependency/);
    }
  });

  test(`${target}: inline-only provider is flattened before classification`, () => {
    const source = { 'proxy-providers': { local: { type: 'inline', payload: [node('HK Inline 01')] } }, 'proxy-groups': [], rules: [] };
    const { input, result, messages } = run(target, source);
    assert.equal(result, input);
    assert.deepEqual(Array.from(input.proxies, p => p.name), ['HK Inline 01']);
    assert.equal(Object.hasOwn(input, 'proxy-providers'), false);
    assert.ok(input['proxy-groups'].find(g => g.name === '🌍 全球节点').proxies.includes('HK Inline 01'));
    assert.match(messages, /inline=/);
  });

  test(`${target}: empty inline provider still receives a safe global selector`, () => {
    const source = { 'proxy-providers': { local: { type: 'inline', payload: [] } }, 'proxy-groups': [], rules: [] };
    const { input } = run(target, source);
    assert.deepEqual(Array.from(input.proxies), []);
    assert.equal(Object.hasOwn(input, 'proxy-providers'), false);
    const global = input['proxy-groups'].find(g => g.name === '🌍 全球节点');
    assert.equal(global.type, 'select');
    assert.deepEqual(Array.from(global.proxies), ['REJECT']);
  });

  test(`${target}: inline payload alias is not changed when node defaults are injected`, () => {
    const inline = node('HK Inline TLS', { tls: true, custom: { note: 'retained' } });
    const source = {
      'proxy-providers': { local: { type: 'inline', payload: [inline, inline] } },
      external: { linked: inline }, 'proxy-groups': [], rules: [],
    };
    const { input } = run(target, source);
    assert.equal(Object.hasOwn(input, 'proxy-providers'), false);
    assert.equal(input.proxies.length, 1);
    assert.notEqual(input.proxies[0], input.external.linked);
    assert.equal(input.external.linked['client-fingerprint'], undefined);
    assert.equal(input.proxies[0].custom.note, 'retained');
  });

  test(`${target}: mixed inline nodes retain order, deduplicate, resolve dialer and receive DNS baseline`, () => {
    const source = {
      proxies: [node('US Linked', { 'dialer-proxy': 'HK Inline 01' }), node('JP Explicit')],
      'proxy-providers': { local: { type: 'inline', payload: [node('HK Inline 01'), node('JP Explicit')] } },
      'proxy-groups': [], rules: [], dns: { nameserver: ['1.1.1.1'] },
    };
    const { input } = run(target, source);
    assert.deepEqual(input.proxies.map(p => p.name), ['US Linked', 'JP Explicit', 'HK Inline 01']);
    assert.equal(input.proxies[0]['dialer-proxy'], 'HK Inline 01');
    assert.equal(Object.hasOwn(input, 'proxy-providers'), false);
    assert.ok(input['proxy-groups'].find(g => g.name === '🌍 全球节点').proxies.includes('HK Inline 01'));
    assert.notDeepEqual(input.dns.nameserver, ['1.1.1.1']);
  });

  test(`${target}: unsupported provider shape leaves complete source unchanged`, () => {
    for (const providers of [
      { remote: { type: 'http', url: 'https://example.invalid/subscribe' } },
      { local: { type: 'inline', payload: [node('HK Inline')], url: 'https://example.invalid' } },
    ]) {
      const source = { proxies: [node('US Explicit')], 'proxy-providers': providers, 'proxy-groups': [], rules: [], dns: { nameserver: ['1.1.1.1'] } };
      const { input, messages } = run(target, source);
      assert.deepEqual(input, source);
      assert.match(messages, /flatten in SubStore/);
    }
  });

  test(`${target}: direct support proxy stays available for dialer but outside traffic groups`, () => {
    const source = { proxies: [
      { name: 'HK Interface Direct', type: 'direct', 'interface-name': 'eth0' },
      { name: 'US Block', type: 'reject' },
      node('US Linked', { 'dialer-proxy': 'HK Interface Direct' }),
    ], 'proxy-groups': [], rules: [] };
    const { input } = run(target, source);
    assert.deepEqual(input.proxies.map(p => p.name), ['HK Interface Direct', 'US Block', 'US Linked']);
    const global = input['proxy-groups'].find(g => g.name === '🌍 全球节点');
    assert.deepEqual(Array.from(global.proxies), ['US Linked']);
    assert.equal(input['proxy-groups'].some(g => g.name === '🇭🇰 香港节点'), false);
    assert.deepEqual(Array.from(input['proxy-groups'].find(g => g.name === '🇺🇸 美国节点').proxies), ['US Linked']);
  });

  test(`${target}: only support proxies use the existing global REJECT fallback`, () => {
    const source = { proxies: [{ name: 'HK Interface Direct', type: 'direct', 'interface-name': 'eth0' }], 'proxy-groups': [], rules: [] };
    const { input } = run(target, source);
    assert.equal(input.proxies.length, 1);
    const global = input['proxy-groups'].find(g => g.name === '🌍 全球节点');
    assert.equal(global.type, 'select');
    assert.deepEqual(Array.from(global.proxies), ['REJECT']);
  });

  test(`${target}: default retains multipliers, removes information and exact duplicates`, () => {
    const reordered = { port: 443, password: 'secret', server: 'example.invalid', type: 'trojan', name: 'HK x3' };
    const source = { proxies: [node('HK x3'), node('Panelist HK'), node('Channell US'), node('Authoritative JP'), reordered, node('Panel HK')], 'proxy-groups': [], rules: [] };
    const { input, result } = run(target, source);
    assert.equal(result, input);
    assert.deepEqual(input.proxies.map(p => p.name), ['HK x3', 'Panelist HK', 'Channell US', 'Authoritative JP']);
  });

  test(`${target}: threshold is strict and ambiguous or unmarked names are retained`, () => {
    const names = ['HK x2', 'US 2x', 'JP 2倍', 'KR 倍率2', 'SG ×0.5', 'DE x3', 'HK x0',
      'US x2 x3', 'JP 2x 3倍', 'CN mystery', 'US 192.168.2.5:443', 'HK-02', 'HK x-3', 'HK x2.5', 'HK x? x3', 'HK ?× x3', 'HK x未知 x3', 'HK xunknown x3'];
    const { input } = run(target, { proxies: names.map(name => node(name)), 'proxy-groups': [], rules: [] }, 2);
    assert.deepEqual(input.proxies.map(p => p.name), names.filter(name => !['DE x3', 'HK x2.5'].includes(name)));
  });

  test(`${target}: invalid local threshold does not filter`, () => {
    const source = { proxies: [node('HK x3')], 'proxy-groups': [], rules: [], dns: { nameserver: ['1.1.1.1'] } };
    const { input, messages } = run(target, source, 0);
    assert.deepEqual(input, source);
    assert.match(messages, /invalid-multiplier-limit/);
  });

  test(`${target}: bad node shapes, collisions and provider input fail closed before DNS changes`, () => {
    const cases = [
      { proxies: [node('HK'), []] },
      { proxies: [node('HK', { flow: [] })] },
      { proxies: [node('HK', { type: [] })] },
      { proxies: [node('HK'), node('HK', { server: 'different.invalid' })] },
      { proxies: [node('DIRECT')] },
      { proxies: [node('GLOBAL')] },
      { proxies: [node('PASS-RULE')] },
      { proxies: [node('🌍 全球节点')] },
      { proxies: [node('HK')], 'proxy-providers': { remote: { type: 'http' } } },
      { proxies: [], 'proxy-providers': { remote: { type: 'http' } } },
    ];
    for (const entry of cases) {
      const original = { 'proxy-groups': [{ name: 'source-group', type: 'select', proxies: ['HK'] }], rules: ['MATCH,DIRECT'], dns: { nameserver: ['1.1.1.1'] }, ...entry };
      const { input, result, messages } = run(target, original);
      assert.equal(result, input);
      assert.deepEqual(input, original);
      assert.match(messages, /flatten in SubStore|preflight|unsupported/i);
      assert.doesNotMatch(messages, /different\.invalid|example\.invalid|secret/);
    }
  });

  test(`${target}: dependency on a filtered dialer rejects the entire processing`, () => {
    const source = { proxies: [node('HK Panel'), node('US usable', { 'dialer-proxy': 'HK Panel' })], 'proxy-groups': [], rules: [] };
    const { input, messages } = run(target, source);
    assert.deepEqual(input, source);
    assert.match(messages, /dialer|preflight/i);
  });

  test(`${target}: self-referential dialer rejects the entire processing`, () => {
    const source = { proxies: [node('HK 01', { 'dialer-proxy': 'HK 01' })], 'proxy-groups': [], rules: [], dns: { nameserver: ['1.1.1.1'] } };
    const { input, messages } = run(target, source);
    assert.deepEqual(input, source);
    assert.match(messages, /dialer-cycle/);
  });

  test(`${target}: multi-node dialer cycle rejects the entire processing`, () => {
    const source = { proxies: [node('HK 01', { 'dialer-proxy': 'HK 02' }), node('HK 02', { 'dialer-proxy': 'HK 01' })], 'proxy-groups': [], rules: [] };
    const { input, messages } = run(target, source);
    assert.deepEqual(input, source);
    assert.match(messages, /dialer-cycle/);
  });

  test(`${target}: finite multi-hop dialer chain remains available`, () => {
    const source = { proxies: [node('HK 01', { 'dialer-proxy': 'DIRECT' }), node('HK 02', { 'dialer-proxy': 'HK 01' }), node('HK 03', { 'dialer-proxy': 'HK 02' })], 'proxy-groups': [], rules: [] };
    const { input, messages } = run(target, source);
    assert.deepEqual(input.proxies.map(p => p.name), ['HK 01', 'HK 02', 'HK 03']);
    assert.doesNotMatch(messages, /dialer-cycle/);
  });

  test(`${target}: built-in dialer and empty providers are accepted`, () => {
    const { input } = run(target, { proxies: [node('HK x1', { 'dialer-proxy': 'DIRECT' })], 'proxy-providers': {}, 'proxy-groups': [], rules: [] });
    assert.equal(input.proxies.length, 1);
    assert.equal(input.proxies[0]['dialer-proxy'], 'DIRECT');
    const withNull = run(target, { proxies: [node('HK x1')], 'proxy-providers': null, 'proxy-groups': [], rules: [] });
    assert.equal(withNull.input.proxies.length, 1);
    const groupDialer = { proxies: [node('HK x1', { 'dialer-proxy': 'GLOBAL' })], 'proxy-groups': [], rules: [] };
    const rejected = run(target, groupDialer);
    assert.deepEqual(rejected.input, groupDialer);
    assert.match(rejected.messages, /dialer-dependency/);
  });

  test(`${target}: preserves unknown protocol fields and redacts node input from diagnostics`, () => {
    const source = { proxies: [node('US PRIVATE_TOKEN_7129 x2', { type: 'hysteria2', custom: { nested: 'opaque' } })], 'proxy-groups': [], rules: [] };
    const { input, messages } = run(target, source, 1);
    assert.equal(input.proxies.length, 0);
    assert.doesNotMatch(messages, /PRIVATE_TOKEN_7129|example\.invalid|secret|opaque/);
  });

  test(`${target}: parses full decimal values without truncation`, () => {
    const names = ['HK 0.5x', 'US 0.59x', 'JP 1.5x', 'KR 1.50x', 'SG ×0.5', 'TW 2×'];
    const half = run(target, { proxies: names.map(name => node(name)), 'proxy-groups': [], rules: [] }, 0.5).input;
    assert.deepEqual(half.proxies.map(p => p.name), ['HK 0.5x', 'SG ×0.5']);
    const one = run(target, { proxies: names.map(name => node(name)), 'proxy-groups': [], rules: [] }, 1).input;
    assert.deepEqual(one.proxies.map(p => p.name), ['HK 0.5x', 'US 0.59x', 'SG ×0.5']);
  });

  test(`${target}: all filtered nodes produce a safe global REJECT selector`, () => {
    const { input } = run(target, { proxies: [node('HK Panel')], 'proxy-groups': [], rules: [] });
    assert.equal(input.proxies.length, 0);
    const global = input['proxy-groups'].find(g => g.name === '🌍 全球节点');
    assert.equal(global.type, 'select');
    assert.deepEqual(Array.from(global.proxies), ['REJECT']);
  });

  test(`${target}: second execution is stable`, () => {
    const source = { proxies: [node('HK x1'), node('US x3')], 'proxy-groups': [], rules: [] };
    let data = run(target, source, 2).input;
    const count = data.proxies.length;
    data = run(target, data, 2).input;
    assert.equal(data.proxies.length, count);
    assert.deepEqual(data.proxies.map(p => p.name), ['HK x1']);
  });
}

test('FlClash preserves the source proxies array reference', () => {
  const { input, refs } = run(targets[2], { proxies: [node('HK x1'), node('US x3')], 'proxy-groups': [], rules: [] }, 2);
  assert.equal(input.proxies, refs.proxies);
});

for (const target of targets.slice(0, 2)) {
  test(`${target}: malformed listener and tun fields fail before DNS mutation`, () => {
    for (const extra of [{ listeners: [null] }, { listeners: {} }, { tun: { 'exclude-process': {} } }]) {
      const source = { proxies: [node('HK 01')], 'proxy-groups': [], rules: [], dns: { nameserver: ['1.1.1.1'] }, ...extra };
      const { input } = run(target, source);
      assert.deepEqual(input, source);
    }
  });
}

test('FlClash replaces malformed rule-provider container before fused output', () => {
  for (const bad of [[], 'bad', 3]) {
    const source = { proxies: [node('HK 01')], 'proxy-groups': [], rules: [], 'rule-providers': bad };
    const { input } = run(targets[2], source);
    const serialized = JSON.parse(JSON.stringify(input));
    assert.equal(Array.isArray(serialized['rule-providers']), false);
    assert.equal(typeof serialized['rule-providers'], 'object');
    assert.equal(Object.keys(serialized['rule-providers']).length, 132);
    assert.equal(serialized.rules.length, 151);
  }
});
