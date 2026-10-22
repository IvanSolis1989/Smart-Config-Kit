'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const cli = path.join(root, 'tools/sync-business-dns-policy.js');
const jsTargets = ['Clash Party/ClashParty(mihomo-smart).js', 'Clash Party/ClashParty(mihomo).js', 'FlClash/FlClash(mihomo).js'];
const expected = {
  '+.jsdelivr.net': ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
  '+.github.com': ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
  '+.githubusercontent.com': ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
  '+.githubassets.com': ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
  '+.fastly.net': ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
  'geosite:cn': ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'],
  'geosite:geolocation-!cn': ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
};

test('first migration preserves Normal DNS siblings before the later node-DNS seam', () => {
  const { renderBlock, replaceProjection } = require('../sync-business-dns-policy');
  const legacy = `function apply(config) {
  var foreignDoH = ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'];
  var domesticDoH = ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'];
  config.dns['nameserver-policy'] = {};
  ['+.jsdelivr.net', '+.github.com', '+.githubusercontent.com', '+.githubassets.com', '+.fastly.net'].forEach(function(host) {
    config.dns['nameserver-policy'][host] = foreignDoH.slice();
  })
  var geositeDnsPolicy = {'geosite:cn': domesticDoH, 'geosite:geolocation-!cn': foreignDoH};
  Object.keys(geositeDnsPolicy).forEach(function(key) {
    config.dns['nameserver-policy'][key] = geositeDnsPolicy[key].slice();
  })
  config.dns['fallback-filter'] = {geoip: true};
  config.dns['fake-ip-filter-mode'] = 'blacklist';
  config.hosts = {'dns.google': ['8.8.8.8', '8.8.4.4']};
  // Clear any source PSS policy before the adapter projects a profile-scoped snapshot.
  delete config.dns['proxy-server-nameserver-policy'];
  return config;
}`;
  const run = source => {
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source + '\nthis.result=apply({dns:{}});', sandbox);
    return JSON.parse(JSON.stringify(sandbox.result));
  };
  const migrated = replaceProjection(legacy, renderBlock(expected, 'javascript'), 'javascript', 'legacy-normal');
  assert.deepEqual(run(migrated), run(legacy));
  for (const broken of [
    migrated.replace('SCKI BUSINESS DNS POLICY: END', 'missing'),
    migrated + '\n// >>> SCKI BUSINESS DNS POLICY: BEGIN',
    legacy + "\n  config.dns['nameserver-policy'] = {};",
  ]) assert.throws(() => replaceProjection(broken, renderBlock(expected, 'javascript'), 'javascript', 'broken'), /marker|anchor/i);
});

test('business DNS synchronizer checks all owned projections without writing', () => {
  const run = spawnSync(process.execPath, [cli, '--check'], { encoding: 'utf8', windowsHide: true });
  assert.equal(run.status, 0, run.stdout + run.stderr);
});

test('projection preparation is pure and rejects a corrupt later target before any writes', () => {
  const { prepareUpdates } = require('../sync-business-dns-policy');
  const prepared = prepareUpdates();
  assert.equal(prepared.length, 6);
  assert.ok(prepared.every(item => fs.readFileSync(item.file, 'utf8') === item.original));
  assert.ok(prepared.every(item => item.updated === item.original));
  assert.throws(() => prepareUpdates({ readFile(file, encoding) {
    const source = fs.readFileSync(file, encoding);
    return file.endsWith('OpenClash(mihomo-smart).sh')
      ? source.replace('SCKI BUSINESS DNS POLICY: END', 'missing-end') : source;
  } }), /markers|marker/i);
  assert.ok(prepared.every(item => fs.readFileSync(item.file, 'utf8') === item.original));
});

test('one source resolver edit reaches all six prepared projections without touching global DNS', () => {
  const graph = require('../../rulesets/source/routing-graph');
  const { prepareUpdates } = require('../sync-business-dns-policy');
  const contract = graph.getBusinessDnsPolicy();
  contract.resolvers.foreign = ['https://new-resolver.example/dns-query'];
  const prepared = prepareUpdates({ contract });
  assert.ok(prepared.every(item => item.updated.includes('https://new-resolver.example/dns-query')));
  for (const item of prepared.filter(item => item.file.endsWith('.js'))) {
    const sandbox = { console: { log() {}, error() {} } };
    vm.createContext(sandbox);
    vm.runInContext(item.updated + '\nthis.entry=main;', sandbox);
    const result = sandbox.entry({ proxies: [{ name: 'HK Node', type: 'ss', server: 'node.example', port: 443, cipher: 'aes-128-gcm', password: 'test' }], 'proxy-groups': [], rules: [] });
    assert.deepEqual(JSON.parse(JSON.stringify(result.dns['nameserver-policy']['+.github.com'])), ['https://new-resolver.example/dns-query']);
    assert.deepEqual(JSON.parse(JSON.stringify(result.dns.fallback)), ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query']);
  }
  assert.deepEqual(graph.getBusinessDnsPolicy().resolvers.foreign, expected['+.github.com']);
  assert.ok(prepared.every(item => fs.readFileSync(item.file, 'utf8') === item.original));
});

test('CMFA, both OpenClash heredocs and generated Stash parse to the original policy map', context => {
  const ruby = process.env.RUBY || 'ruby';
  if (spawnSync(ruby, ['--version'], { encoding: 'utf8', windowsHide: true }).status !== 0) return context.skip('Ruby unavailable');
  const files = ['Clash Meta For Android/CMFA(mihomo).yaml', 'OpenClash/OpenClash(mihomo).sh', 'OpenClash/OpenClash(mihomo-smart).sh', 'Stash/Stash.yaml'];
  const inputs = files.map(file => {
    let source = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
    if (file.endsWith('.sh')) {
      const blocks = [...source.matchAll(/^cat (?:>|>>) "\$OVERRIDE_YAML" << '?OVERRIDE_EOF'?\n([\s\S]*?)^OVERRIDE_EOF$/gm)];
      assert.ok(blocks.length > 0, file);
      source = blocks.map(block => block[1]).join('\n');
    }
    return source;
  });
  const probe = spawnSync(ruby, ['-ryaml', '-rjson', '-e',
    "puts JSON.generate(JSON.parse(STDIN.read).map { |text| YAML.safe_load(text, aliases: true).fetch('dns').fetch('nameserver-policy') })"],
  { input: JSON.stringify(inputs), encoding: 'utf8', windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
  assert.equal(probe.status, 0, probe.stderr);
  const maps = JSON.parse(probe.stdout);
  assert.equal(maps.length, 4);
  for (const map of maps) {
    assert.deepEqual(map, expected);
    assert.deepEqual(Object.keys(map), ['geosite:cn', 'geosite:geolocation-!cn', ...Object.keys(expected).filter(key => key.startsWith('+.'))]);
  }
});

for (const target of jsTargets) {
  test(`${target}: business policy survives main and stays separate from node DNS hints`, () => {
    const sandbox = { console: { log() {}, error() {} } };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(root, target), 'utf8') + '\nthis.entry=main;', sandbox);
    const config = { proxies: [{ name: 'HK Node', type: 'ss', server: 'private.example', port: 443, cipher: 'aes-128-gcm', password: 'test' }],
      'proxy-groups': [], rules: [], dns: { 'enhanced-mode': 'fake-ip', 'nameserver-policy': { '+.hijack.invalid': ['127.0.0.1'] },
        'proxy-server-nameserver-policy': { 'private.example': ['https://private-dns.example/dns-query'] } } };
    const result = sandbox.entry(config);
    assert.deepEqual(JSON.parse(JSON.stringify(result.dns['nameserver-policy'])), expected);
    assert.equal(result.dns['proxy-server-nameserver-policy']['private.example'][0], 'https://private-dns.example/dns-query');
    assert.deepEqual(JSON.parse(JSON.stringify(result.dns['proxy-server-nameserver'])), [
      'https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query', 'https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query',
    ]);
    assert.equal(result.dns['fake-ip-filter-mode'], 'blacklist');
  });
}
