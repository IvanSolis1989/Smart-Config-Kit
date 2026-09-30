#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const runtime = fs.readFileSync(path.join(__dirname, 'runtime', 'subscription-node-filter.rb'), 'utf8').replace(/\r\n/g, '\n').trimEnd();
const begin = '# >>> SCKI SUBSCRIPTION NODE FILTER: BEGIN';
const end = '# <<< SCKI SUBSCRIPTION NODE FILTER: END';
const targets = ['OpenClash(mihomo).sh', 'OpenClash(mihomo-smart).sh'];

function rubyBinary() {
  for (const name of [process.env.RUBY, 'ruby', 'C:\\Ruby34-x64\\bin\\ruby.exe', 'C:\\Ruby33-x64\\bin\\ruby.exe'].filter(Boolean)) {
    if (cp.spawnSync(name, ['-v'], { encoding: 'utf8' }).status === 0) return name;
  }
  throw new Error('Ruby required');
}
const ruby = rubyBinary();
function extract(source, start, finish) {
  const a = source.indexOf(start);
  assert(a >= 0, `missing ${start}`);
  const b = source.indexOf(finish, a + start.length);
  assert(b >= 0, `missing ${finish}`);
  return source.slice(a + start.length, b).trim();
}
function run(code, args) { return cp.spawnSync(ruby, [code, ...args], { encoding: 'utf8' }); }
function yamlRead(file) {
  const result = cp.spawnSync(ruby, ['-ryaml', '-rjson', '-e', 'puts JSON.generate(YAML.load_file(ARGV[0], permitted_classes: [Symbol], aliases: true))', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
function makeProxy(name, extra = {}) { return { name, type: 'ss', server: 'test.example', port: 443, ...extra }; }
function fixture(temp, name, proxies, extra = {}) {
  const config = path.join(temp, `${name}.yaml`);
  const override = path.join(temp, `${name}.override.yaml`);
  const status = path.join(temp, `${name}.status`);
  const data = { proxies, 'proxy-groups': [], 'rule-providers': {}, rules: [], ...extra };
  fs.writeFileSync(config, JSON.stringify(data));
  fs.writeFileSync(override, JSON.stringify({ 'proxy-groups': [{ name: '🐟 漏网之鱼', type: 'select', proxies: ['🌍 全球节点', 'DIRECT'] }], rules: ['MATCH,🐟 漏网之鱼'], 'rule-providers': {} }));
  return { config, override, status };
}
function execute(processor, files, limit = '') {
  return run(processor, [files.config, files.override, files.status, 'off', limit]);
}

const parityNames = [
  '香港 IPLC x2', '香港中转 2x', 'DNSxx 香港', 'Telegram 香港', 'airport 香港',
  'HK 0.5x', 'US 0.59x', 'JP 1.5x', 'KR 1.50x', 'SG ×0.5', 'DE x3',
  'HK x0', 'US x2 x3', 'JP 2x 3倍', 'HK x? x3', 'HK x未知 x3',
  'HK-02', 'HK x-3', 'HK -2x', 'HK 1.2.3.4:443', 'IP:443',
  'Panelist HK', 'Channell US', 'Authoritative JP', 'Panel HK', 'Panel香港', '香港Panel', '香港Panel香港', '剩余流量 1G',
  '香港（倍率2）', '香港|2倍', '香港;×0.5', '香港x2', 'HK x2.5', 'HK 2×', 'HK ?× x3',
];
const rubyParity = cp.spawnSync(ruby, ['-rjson', '-r', path.join(__dirname, 'runtime', 'subscription-node-filter.rb'), '-e',
  'names = JSON.parse(STDIN.read); puts JSON.generate(names.map { |name| [SckiSubscriptionNodeFilter.info_node?(name), SckiSubscriptionNodeFilter.multiplier(name)] })'],
{ input: JSON.stringify(parityNames), encoding: 'utf8' });
assert.equal(rubyParity.status, 0, rubyParity.stderr);
const jsRuntime = fs.readFileSync(path.join(__dirname, 'runtime', 'subscription-node-filter.js'), 'utf8');
const jsFilter = vm.runInNewContext(`${jsRuntime}\nSckiSubscriptionNodeFilter`);
const jsParity = parityNames.map(name => [jsFilter.isInfoNode(name), jsFilter.multiplier(name)]);
assert.deepEqual(JSON.parse(rubyParity.stdout), jsParity, 'JS/Ruby filter parity');

for (const target of targets) {
  const source = fs.readFileSync(path.join(root, 'OpenClash', target), 'utf8');
  assert.equal(extract(source, begin, end).replace(/\r/g, ''), runtime, `${target}: embedded runtime drift`);
  assert(source.includes('"$SCKI_MAX_NODE_MULTIPLIER" 2>>'), `${target}: shell argument missing`);
  const processor = extract(source, 'cat > "$RUBY_SCRIPT" << \'RUBY_EOF\'', '\nRUBY_EOF');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-oc-filter-'));
  try {
    const script = path.join(temp, 'processor.rb');
    fs.writeFileSync(script, processor);
    const names = ['香港 IPLC x2', '香港中转 2x', 'DNSxx 香港', 'Telegram 香港', 'airport 香港', '香港 x3', '香港 ×0.5', '香港 倍率2', '香港 0x', '香港 x未知', '香港 x2 x3', '香港端口443', '香港 1.2.3.4', '香港02', 'Signal 香港', 'Sign Up', '剩余流量 1G', 'Panel Notice'];
    let files = fixture(temp, 'normal', names.map(n => makeProxy(n)));
    let result = execute(script, files);
    assert.equal(result.status, 0, `${target}: default run ${result.stderr}`);
    let output = yamlRead(files.config);
    let kept = output.proxies.map(p => p.name);
    for (const name of names.slice(0, 15)) assert(kept.includes(name), `${target}: default lost ${name}`);
    for (const name of names.slice(15)) assert(!kept.includes(name), `${target}: kept info ${name}`);

    files = fixture(temp, 'limited', names.map(n => makeProxy(n)));
    result = execute(script, files, '2');
    assert.equal(result.status, 0, `${target}: limited run ${result.stderr}`);
    output = yamlRead(files.config);
    kept = output.proxies.map(p => p.name);
    assert(!kept.includes('香港 x3'), `${target}: over limit retained`);
    for (const name of ['香港 IPLC x2', '香港中转 2x', '香港 ×0.5', '香港 倍率2', '香港 0x', '香港 x未知', '香港 x2 x3', 'DNSxx 香港']) assert(kept.includes(name), `${target}: boundary lost ${name}`);

    files = fixture(temp, 'decimal-half', ['HK 0.5x', 'US 0.59x', 'JP 1.5x', 'KR 1.50x', 'SG ×0.5'].map(n => makeProxy(n)));
    result = execute(script, files, '0.5');
    assert.equal(result.status, 0, `${target}: half threshold ${result.stderr}`);
    assert.deepEqual(yamlRead(files.config).proxies.map(p => p.name), ['HK 0.5x', 'SG ×0.5']);
    files = fixture(temp, 'decimal-one', ['HK 0.5x', 'US 0.59x', 'JP 1.5x', 'KR 1.50x', 'SG ×0.5'].map(n => makeProxy(n)));
    result = execute(script, files, '1');
    assert.equal(result.status, 0, `${target}: one threshold ${result.stderr}`);
    assert.deepEqual(yamlRead(files.config).proxies.map(p => p.name), ['HK 0.5x', 'US 0.59x', 'SG ×0.5']);

    for (const [label, list, extra] of [
      ['bad-entry', [null], {}], ['bad-name', [makeProxy(23)], {}], ['bad-type', [makeProxy('A', { type: [] })], {}],
      ['bad-flow', [makeProxy('A', { flow: 2 })], {}],
      ['ambiguous', [makeProxy('A'), makeProxy('A', { server: 'different.example' })], {}],
      ['group-conflict', [makeProxy('🐟 漏网之鱼')], {}], ['built-in-conflict', [makeProxy('DIRECT')], {}],
      ['global-conflict', [makeProxy('GLOBAL')], {}],
      ['provider-only', [], { 'proxy-providers': { airport: { type: 'http' } } }],
      ['provider-mixed', [makeProxy('A')], { 'proxy-providers': { airport: { type: 'http' } } }],
      ['reserved-region', [makeProxy('🇭🇰 香港节点')], {}],
      ['dialer-removed', [makeProxy('香港 x3'), makeProxy('香港依赖', { 'dialer-proxy': '香港 x3' })], {}],
      ['dialer-global', [makeProxy('香港依赖', { 'dialer-proxy': 'GLOBAL' })], {}],
      ['dialer-self-cycle', [makeProxy('A', { 'dialer-proxy': 'A' })], {}],
      ['dialer-two-cycle', [makeProxy('A', { 'dialer-proxy': 'B' }), makeProxy('B', { 'dialer-proxy': 'A' })], {}],
    ]) {
      files = fixture(temp, label, list, extra);
      const before = fs.readFileSync(files.config);
      result = execute(script, files, '2');
      assert.notEqual(result.status, 0, `${target}: ${label} accepted`);
      assert(before.equals(fs.readFileSync(files.config)), `${target}: ${label} wrote source`);
      assert(!fs.existsSync(files.status), `${target}: ${label} wrote status before preflight`);
    }
    files = fixture(temp, 'bad-limit', [makeProxy('A')]);
    const before = fs.readFileSync(files.config);
    result = execute(script, files, 'oops');
    assert.notEqual(result.status, 0, `${target}: invalid limit accepted`);
    assert(before.equals(fs.readFileSync(files.config)), `${target}: invalid limit wrote source`);
    assert(!fs.existsSync(files.status), `${target}: invalid limit wrote status before preflight`);

    for (const [label, provider] of [['empty-provider', {}], ['null-provider', null]]) {
      files = fixture(temp, label, [makeProxy('A', { 'dialer-proxy': 'DIRECT' })], { 'proxy-providers': provider });
      result = execute(script, files);
      assert.equal(result.status, 0, `${target}: ${label} rejected ${result.stderr}`);
      assert.equal(yamlRead(files.config).proxies[0]['dialer-proxy'], 'DIRECT');
    }
    files = fixture(temp, 'dialer-chain', [
      makeProxy('A', { 'dialer-proxy': 'B' }), makeProxy('B', { 'dialer-proxy': 'C' }), makeProxy('C', { 'dialer-proxy': 'DIRECT' }),
    ]);
    result = execute(script, files);
    assert.equal(result.status, 0, `${target}: valid multihop dialer rejected ${result.stderr}`);
    assert.deepEqual(yamlRead(files.config).proxies.map(p => p.name), ['A', 'B', 'C']);

    files = fixture(temp, 'equal-duplicate', [makeProxy('A'), makeProxy('A')]);
    result = execute(script, files);
    assert.equal(result.status, 0, `${target}: equal duplicate rejected ${result.stderr}`);
    assert.equal(yamlRead(files.config).proxies.length, 1, `${target}: equal duplicate not deduped`);
    files = fixture(temp, 'reordered-duplicate', [makeProxy('A'), { port: 443, server: 'test.example', type: 'ss', name: 'A' }]);
    result = execute(script, files);
    assert.equal(result.status, 0, `${target}: reordered equal duplicate rejected ${result.stderr}`);
    assert.equal(yamlRead(files.config).proxies.length, 1, `${target}: reordered equal duplicate not deduped`);

    files = fixture(temp, 'all-info', [makeProxy('剩余流量 1G')]);
    result = execute(script, files);
    assert.equal(result.status, 0, `${target}: all info failed ${result.stderr}`);
    output = yamlRead(files.config);
    const global = output['proxy-groups'].find(g => g.name === '🌍 全球节点');
    assert.equal(global.type, 'select', `${target}: empty global must select REJECT`);
    assert.deepEqual(global.proxies, ['REJECT'], `${target}: empty global not REJECT`);
    assert(!global['include-all-proxies'], `${target}: empty global includes all`);
    console.log(`PASS ${target} node filter`);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
