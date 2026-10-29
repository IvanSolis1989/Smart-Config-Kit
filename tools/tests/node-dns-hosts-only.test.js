'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const os = require('node:os');
const cp = require('node:child_process');
const test = require('node:test');
const profiles = require('../lib/subscription-adapter-profiles');
const root = path.resolve(__dirname, '../..');
const contract = profiles.readProfileContract(root);
const js = profiles.renderJavaScriptProfileRuntime(contract) + '\n' + fs.readFileSync(path.join(root, 'tools/runtime/node-dns-hints.js'), 'utf8');
const ruby = profiles.renderRubyProfileRuntime(contract) + '\n' + fs.readFileSync(path.join(root, 'tools/runtime/node-dns-hints.rb'), 'utf8');
function runtime() { const ctx = vm.createContext({}); vm.runInContext(js, ctx); return ctx.SckiSubscriptionAdapter; }
function plain(value) { return JSON.parse(JSON.stringify(value)); }
function repository() { return { dns: { 'proxy-server-nameserver': ['1.1.1.1'], 'proxy-server-nameserver-policy': { 'owned.test': ['8.8.8.8'] } }, hosts: { 'NODE.EXAMPLE.TEST.': ['192.0.2.99'] }, proxies: [{ server: 'node.example.test', sni: 'tls.example.test', 'ws-opts': { headers: { Host: 'http.example.test' } } }] }; }
function fixture() { return { hosts: { 'NODE.EXAMPLE.TEST.': ['198.51.100.1', '[2001:DB8::1]', '198.51.100.2'], 'other.example.test': '203.0.113.1', '*.example.test': '203.0.113.2', 'alias.example.test': 'other.example.test' }, dns: { nameserver: ['9.9.9.9'], fallback: ['8.8.8.8'], 'proxy-server-nameserver': ['8.8.4.4'] } }; }
const invalidValues = ['alias.example.test', 'https://1.1.1.1', '1.1.1.1#DIRECT', '[1.1.1.1]', '256.0.0.1', '01.2.3.4', '1:2:3:4:5:6:7:8:', ':1:2:3:4:5:6:7:8', '1:2:3:4:5:6:192.0.2.1::', ['1.1.1.1', 'bad'], Array(9).fill('1.1.1.1')];

test('off/policy/adaptive capture, apply and report preserve the original byte semantics', () => {
  for (const profile of ['off', 'policy', 'adaptive']) {
    const api = runtime(); const repo = repository(); const expectedRepo = repository();
    const expected = { profile, domains: profile === 'off' ? [] : ['node.example.test', 'alias.example.test'], resolvers: [], policy: {}, hosts: {}, stats: { domains: profile === 'off' ? 0 : 2, resolvers: 0, policies: 0, hosts: 0, rejected: 0 } };
    if (profile === 'adaptive') {
      expected.resolvers = ['8.8.4.4']; expected.policy = { 'node.example.test': ['8.8.4.4'], 'alias.example.test': ['8.8.4.4'] };
      expected.hosts = { 'node.example.test': ['198.51.100.1', '2001:db8::1', '198.51.100.2'], 'alias.example.test': 'other.example.test' };
      Object.assign(expected.stats, { resolvers: 1, policies: 2, hosts: 2 });
      expectedRepo.dns['proxy-server-nameserver-policy'] = plain(expected.policy); Object.assign(expectedRepo.hosts, expected.hosts);
    }
    const snapshot = api.captureNodeDns(fixture(), ['node.example.test', 'alias.example.test'], profile);
    assert.equal(JSON.stringify(snapshot), JSON.stringify(expected));
    const report = api.applyNodeDns(repo, snapshot, profile);
    assert.equal(JSON.stringify(repo), JSON.stringify(expectedRepo));
    const expectedReport = { profile, mode: profile, applied: profile === 'adaptive', reason: profile === 'off' ? 'profile-off' : (profile === 'policy' ? 'no-hints' : 'applied'), ...expected.stats };
    assert.equal(JSON.stringify(report), JSON.stringify(expectedReport));
  }
});

test('hosts-only is explicit, exact, complete multi-IP and leaves DNS/server/TLS untouched', () => {
  const api = runtime();
  assert.equal(api.resolveProfile('hosts-only').id, 'hosts-only');
  const source = fixture();
  const snapshot = api.captureNodeDns(source, ['node.example.test', 'alias.example.test'], 'hosts-only');
  assert.deepEqual(plain(snapshot.hosts), { 'node.example.test': ['198.51.100.1', '2001:db8::1', '198.51.100.2'] });
  assert.deepEqual(plain(snapshot.policy), {}); assert.deepEqual(plain(snapshot.resolvers), []);
  const repo = repository(); const before = JSON.stringify(repo);
  assert.equal(api.applyNodeDns(repo, snapshot, 'hosts-only').applied, true);
  assert.equal(JSON.stringify(repo), before, 'repository canonical-equivalent hosts take precedence');
  delete repo.hosts['NODE.EXAMPLE.TEST.'];
  api.applyNodeDns(repo, snapshot, 'hosts-only');
  assert.deepEqual(plain(repo.hosts['node.example.test']), ['198.51.100.1', '2001:db8::1', '198.51.100.2']);
  assert.equal(api.resolveProfile().id, 'adaptive');
  assert.deepEqual(plain(api.captureNodeDns({ hosts: source.hosts, 'adapter-profile': 'hosts-only' }, ['node.example.test']).hosts), {});
  const wildcardRepo = repository(); wildcardRepo.hosts = { '*.example.test': ['192.0.2.88'] };
  const wildcardBefore = JSON.stringify(wildcardRepo); api.applyNodeDns(wildcardRepo, snapshot, 'hosts-only');
  assert.equal(JSON.stringify(wildcardRepo), wildcardBefore, 'repository wildcard hosts retain precedence');
});

test('hosts-only rejects aliases, malformed and oversized IP arrays without partial values', () => {
  for (const value of invalidValues) {
    const api = runtime(); const snapshot = api.captureNodeDns({ hosts: { 'node.example.test': value } }, ['node.example.test'], 'hosts-only');
    assert.deepEqual(plain(snapshot.hosts), {}, JSON.stringify(value));
  }
  const api = runtime();
  assert.deepEqual(plain(api.captureNodeDns({ hosts: { '*.example.test': '1.1.1.1', 'single': '1.1.1.1' } }, ['node.example.test', 'single'], 'hosts-only').hosts), {});
});

test('hosts-only snapshot provenance, closure, profile and budgets fail closed before any mutation', () => {
  for (const mutate of [s => { s.hosts['escape.test'] = ['1.1.1.1']; s.domains.push('escape.test'); }, s => { s.hosts['node.example.test'] = ['9.9.9.9']; }, s => { s.policy['node.example.test'] = ['1.1.1.1']; }, s => { s.resolvers.push('1.1.1.1'); }, s => { s.hosts_only_version = 2; }]) {
    const api = runtime(); const snapshot = api.captureNodeDns(fixture(), ['node.example.test'], 'hosts-only'); mutate(snapshot);
    const repo = repository(); const before = JSON.stringify(repo);
    assert.equal(api.applyNodeDns(repo, snapshot, 'hosts-only').applied, false); assert.equal(JSON.stringify(repo), before);
  }
  const api = runtime(); const snapshot = api.captureNodeDns(fixture(), ['node.example.test'], 'hosts-only');
  for (const [candidate, profile] of [[plain(snapshot), 'hosts-only'], [snapshot, 'adaptive']]) { const repo = repository(); const before = JSON.stringify(repo); assert.equal(api.applyNodeDns(repo, candidate, profile).applied, false); assert.equal(JSON.stringify(repo), before); }
  snapshot.profile = 'adaptive'; delete snapshot.hosts_only_version; snapshot.policy['node.example.test'] = ['9.9.9.9'];
  const downgradedRepo = repository(); const downgradedBefore = JSON.stringify(downgradedRepo);
  assert.equal(api.applyNodeDns(downgradedRepo, snapshot, 'adaptive').applied, false); assert.equal(JSON.stringify(downgradedRepo), downgradedBefore);
  const hosts = {}; const servers = [];
  for (let i = 0; i < 65; i++) { const domain = `node-${i}.test`; hosts[domain] = '1.1.1.1'; servers.push(domain); }
  const over = api.captureNodeDns({ hosts }, servers, 'hosts-only'); const repo = repository(); const before = JSON.stringify(repo);
  assert.equal(api.applyNodeDns(repo, over, 'hosts-only').applied, false); assert.equal(JSON.stringify(repo), before);
  const conflict = api.captureNodeDns({ hosts: { 'node.example.test': '1.1.1.1', 'NODE.EXAMPLE.TEST': '2.2.2.2', 'good.example.test': '3.3.3.3' } }, ['node.example.test', 'good.example.test'], 'hosts-only');
  assert.deepEqual(plain(conflict.hosts), {});
});

test('Ruby and JavaScript share hosts-only capture and fail-closed apply semantics', () => {
  const executable = [process.env.RUBY, 'ruby', 'C:/Ruby34-x64/bin/ruby.exe', 'C:/Ruby33-x64/bin/ruby.exe'].filter(Boolean).find(x => cp.spawnSync(x, ['-v'], { windowsHide: true }).status === 0);
  assert.ok(executable, 'Ruby required');
  const cases = ['hosts-only', 'off', 'policy', 'adaptive'].map(profile => ({ source: fixture(), servers: ['node.example.test', 'alias.example.test'], profile, repo: repository() }));
  for (const value of invalidValues) cases.push({ source: { hosts: { 'node.example.test': value } }, servers: ['node.example.test'], profile: 'hosts-only', repo: repository() });
  const hosts = {}; const servers = [];
  for (let i = 0; i < 65; i++) { hosts[`n${i}.test`] = '1.1.1.1'; servers.push(`n${i}.test`); }
  cases.push({ source: { hosts }, servers, profile: 'hosts-only', repo: repository() });
  cases.push({ source: { hosts: { 'node.example.test': '1.1.1.1', 'NODE.EXAMPLE.TEST': '2.2.2.2' } }, servers: ['node.example.test'], profile: 'hosts-only', repo: repository() });
  const script = `require 'json'\n${ruby}\npayload=JSON.parse(File.read(ARGV.fetch(0)))\nresults=payload.map do |item|\n  s=SckiSubscriptionAdapter.capture_node_dns(item['source'],item['servers'],item['profile'])\n  r=item['repo']\n  report=SckiSubscriptionAdapter.apply_node_dns(r,s,item['profile'])\n  result={'snapshot'=>Marshal.load(Marshal.dump(s)),'repo'=>r,'report'=>report}\n  if item['profile']=='hosts-only'\n    copy=Marshal.load(Marshal.dump(s))\n    result['forged']=SckiSubscriptionAdapter.apply_node_dns(r,copy,'hosts-only')\n    s['hosts']['node.example.test']=['9.9.9.9']\n    result['tampered']=SckiSubscriptionAdapter.apply_node_dns(r,s,'hosts-only')\n  end\n  result\nend\nputs JSON.generate(results)`;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-hosts-only-'));
  fs.writeFileSync(path.join(directory, 'probe.rb'), script);
  fs.writeFileSync(path.join(directory, 'input.json'), JSON.stringify(cases));
  const result = cp.spawnSync(executable, [path.join(directory, 'probe.rb'), path.join(directory, 'input.json')], { encoding: 'utf8', windowsHide: true, timeout: 20000 });
  fs.rmSync(directory, { recursive: true, force: true });
  assert.equal(result.status, 0, result.stderr); const actual = JSON.parse(result.stdout);
  cases.forEach((item, index) => {
    const api = runtime(); const snapshot = api.captureNodeDns(item.source, item.servers, item.profile); const repo = item.repo; const report = api.applyNodeDns(repo, snapshot, item.profile);
    assert.deepEqual(actual[index].snapshot, plain(snapshot)); assert.deepEqual(actual[index].repo, plain(repo)); assert.deepEqual(actual[index].report, plain(report));
    if (item.profile === 'hosts-only') { assert.equal(actual[index].forged.applied, false); assert.equal(actual[index].tampered.applied, false); }
  });
});
