'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { localPathForRepositoryRuleUrl } = require('../lib/repository-rule-asset');
const root = path.resolve(__dirname, '../..');
const source = () => fs.readFileSync(path.join(root, 'Mihomo内核系/FlClash/FlClash(mihomo).js'), 'utf8');
const api = () => require('../generate-meow');
const plain = value => JSON.parse(JSON.stringify(value));

function run(script, input) {
  const context = vm.createContext({ console: { log() {} } });
  new vm.Script(script).runInContext(context, { timeout: 3000 });
  context.input = plain(input);
  return plain(vm.runInContext('main(input)', context, { timeout: 3000 }));
}

function fixture() {
  return {
    proxies: ['香港 HKG 家宽', '台湾 TWN 家宽', '狮城 SGP 家宽', '日本 JPN 家宽',
      '美国 USA 家宽', '德国 DEU 家宽', '巴西 BRA 家宽', '南非 ZAF 家宽', '月球 ZZZ 家宽']
      .map((name, i) => ({ name, type: 'ss', server: `192.0.2.${i + 1}`, port: 443,
        cipher: 'aes-128-gcm', password: 'synthetic-only' })),
    'proxy-groups': [{ name: 'legacy', type: 'select', proxies: ['DIRECT'] }],
    'rule-providers': { legacy: { type: 'inline', behavior: 'domain', payload: ['old.example'] } },
    rules: ['MATCH,legacy']
  };
}

test('Meow adapter preserves the shared ordered routing and region/business topology', () => {
  const input = fixture();
  const expected = run(source(), input);
  const actual = run(api().renderScript(source()), input);
  for (const key of ['proxy-groups', 'rule-providers', 'rules']) assert.deepEqual(actual[key], expected[key], key);
  assert.equal(actual['proxy-groups'].length, 55);
  assert.equal(actual['proxy-groups'].filter(group => group.type === 'select').length, 33);
  assert.equal(actual.rules.at(-1), 'MATCH,🐟 漏网之鱼');
});

test('routing-only adapter preserves App DNS, TUN, hosts, listeners and mode exactly', () => {
  const input = Object.assign(fixture(), {
    dns: { enable: true, nameserver: ['https://resolver.example/dns-query'], 'enhanced-mode': 'fake-ip' },
    tun: { enable: true, 'file-descriptor': 42 }, hosts: { 'node.example': ['192.0.2.40'] },
    sniffer: { enable: false }, mode: 'global', 'mixed-port': 7893,
    'external-controller': '127.0.0.1:19090', secret: 'synthetic-secret', ipv6: true
  });
  const before = plain(input);
  const result = run(api().renderScript(source()), input);
  for (const key of Object.keys(before).filter(key => !['proxies', 'proxy-groups', 'rule-providers', 'rules'].includes(key))) {
    assert.deepEqual(result[key], before[key], key);
  }
  assert.deepEqual(Object.keys(result).sort(), Object.keys(before).sort());
  const bare = run(api().renderScript(source()), fixture());
  assert.equal(Object.hasOwn(bare, 'dns'), false);
  assert.equal(Object.hasOwn(bare, 'profile'), false);
  assert.equal(Object.hasOwn(bare, 'sniffer'), false);
});

test('does not inject TLS fingerprints or mutate the supplied object', () => {
  const context = vm.createContext({ console: { log() {} } });
  new vm.Script(api().renderScript(source())).runInContext(context);
  const input = fixture();
  input.proxies[0] = { name: 'HK TLS', type: 'trojan', server: 'node.example', port: 443, password: 'test', tls: true };
  context.input = plain(input);
  const output = plain(vm.runInContext('main(input)', context));
  assert.deepEqual(plain(context.input), input);
  assert.deepEqual(output.proxies[0], input.proxies[0]);
});

test('rejects unresolved HTTP provider subscriptions atomically with an actionable error', () => {
  const input = fixture();
  input['proxy-providers'] = { airport: { type: 'http', url: 'https://example.invalid/private.yaml' } };
  assert.throws(() => run(api().renderScript(source()), input), /flatten|SubStore/i);
  assert.throws(() => run(api().renderScript(source()), {}), /nodes|节点/i);
});

test('generation fails visibly when source transformation anchors drift', () => {
  assert.throws(() => api().renderScript(source().replace('function main(config)', 'function changed(config)')), /anchor/i);
});

test('rejects preserved DNS dependencies when replacing their rule providers', () => {
  const input = fixture();
  input.dns = { 'nameserver-policy': { 'rule-set:legacy': ['https://resolver.example/dns-query'] } };
  assert.throws(() => run(api().renderScript(source()), input), /DNS.*rule-set.*legacy/i);
  input.dns = { 'fake-ip-filter': ['rule-set:legacy'] };
  assert.throws(() => run(api().renderScript(source()), input), /DNS.*rule-set.*legacy/i);
  input.dns = { 'nameserver-policy': { '+.corp.example, RULE-SET:legacy': ['1.1.1.1'] } };
  assert.throws(() => run(api().renderScript(source()), input), /DNS.*RULE-SET.*legacy/i);
});

test('generated script and provenance manifest are current; support remains pending App verification', () => {
  assert.deepEqual(api().checkOutputs(), []);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, api().MANIFEST_PATH), 'utf8'));
  assert.equal(manifest.status, 'pre-adapted-awaiting-app');
  assert.equal(manifest.verification.app_import, 'pending');
  assert.equal(manifest.verification.native_core, 'requires-actual-core-test');
  assert.ok(manifest.routing.rule_count > 100);
  assert.equal(manifest.routing.business_group_count, 33);
});

test('official clients receive native YAML independently of a JS host', () => {
  const outputs = api().buildOutputs();
  assert.ok(api().NATIVE_PATH && outputs[api().NATIVE_PATH], 'native YAML profile must be generated');
  assert.match(outputs[api().NATIVE_PATH], /proxy-groups:/);
  assert.doesNotMatch(outputs[api().NATIVE_PATH], /function main|AEROVE Lite 分流覆写/);
  const manifest = JSON.parse(outputs[api().MANIFEST_PATH]);
  assert.equal(manifest.client, 'Meow');
  assert.equal(manifest.native_output.path, api().NATIVE_PATH);
  assert.deepEqual(manifest.client_entries, {
    meow: { name: 'Meow', readme: 'Meow内核系/Meow/README.md', artifact: api().NATIVE_PATH },
    aerove_lite: { name: 'AEROVE Lite', readme: 'Meow内核系/Aerove Lite/README.md', artifact: api().SCRIPT_PATH }
  });
});

test('native profile passes the official Meow core with every local rule asset', {
  skip: !(process.env.MEOW_BIN && process.env.MEOW_GEOSITE_FILE && process.env.MEOW_MMDB_FILE)
    && 'Set MEOW_BIN, MEOW_GEOSITE_FILE and MEOW_MMDB_FILE for actual core validation'
}, t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-meow-core-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(dir).startsWith('scki-meow-core-'));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const parsed = spawnSync(process.env.RUBY_BIN || 'ruby', ['-EUTF-8:UTF-8', '-rjson', '-ryaml', '-e',
    'print JSON.generate(YAML.safe_load(STDIN.read, aliases: true))'],
  { input: fs.readFileSync(path.join(root, api().NATIVE_PATH)), encoding: 'utf8', windowsHide: true });
  assert.equal(parsed.status, 0, parsed.stderr);
  const config = JSON.parse(parsed.stdout);
  const subscription = path.join(dir, 'nodes.yaml');
  fs.writeFileSync(subscription, JSON.stringify({ proxies: [
    { name: '香港 HKG synthetic', type: 'socks5', server: '127.0.0.1', port: 65534 }
  ] }));
  config['proxy-providers'] = { Subscribe: { type: 'file', path: subscription } };
  for (const [name, provider] of Object.entries(config['rule-providers'])) {
    const file = localPathForRepositoryRuleUrl(provider.url);
    assert.ok(file, `Missing local provider asset: ${name}`);
    const target = path.join(dir, path.basename(file));
    fs.copyFileSync(file, target);
    config['rule-providers'][name] = { type: 'file', path: target, format: provider.format, behavior: provider.behavior };
  }
  for (const [key, env, file] of [['geosite-path', 'MEOW_GEOSITE_FILE', 'geosite.dat'], ['mmdb-path', 'MEOW_MMDB_FILE', 'Country.mmdb']]) {
    fs.copyFileSync(process.env[env], path.join(dir, file));
    config.geodata[key] = path.join(dir, file);
  }
  const target = path.join(dir, 'config.yaml');
  fs.writeFileSync(target, JSON.stringify(config));
  const result = spawnSync(process.env.MEOW_BIN, ['-d', dir, '-f', target, '-t'],
    { encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 8 * 1024 * 1024 });
  const log = result.stdout + result.stderr;
  assert.equal(result.status, 0, log);
  assert.match(log, /Configuration test passed/);
  assert.doesNotMatch(log, /\bWARN\b|\bERROR\b/);
  t.diagnostic(`Real core: ${Object.keys(config['rule-providers']).length} local providers, ${config.rules.length} rules, ${config['proxy-groups'].length} groups; synthetic node, no traffic test`);
});
