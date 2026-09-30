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
