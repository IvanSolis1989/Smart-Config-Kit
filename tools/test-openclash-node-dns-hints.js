#!/usr/bin/env node
'use strict';

const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const subscriptionAdapterProfiles = require('./lib/subscription-adapter-profiles');
const SUBSCRIPTION_ADAPTER_PROFILE_CONTRACT = subscriptionAdapterProfiles.assertValidProfileContract(
  subscriptionAdapterProfiles.readProfileContract(REPO_ROOT),
);
const RUNTIME_PATH = path.join(REPO_ROOT, 'tools/runtime/node-dns-hints.rb');
const RUNTIME = [
  subscriptionAdapterProfiles.renderRubyProfileRuntime(SUBSCRIPTION_ADAPTER_PROFILE_CONTRACT),
  fs.readFileSync(RUNTIME_PATH, 'utf8').trimEnd(),
].join('\n\n').trimEnd().replace(/\r?\n/g, '\n');
const BEGIN = '# >>> SCKI NODE DNS HINTS: BEGIN';
const END = '# <<< SCKI NODE DNS HINTS: END';
const TARGETS = [
  { id: 'normal', file: path.join('OpenClash', 'OpenClash(mihomo).sh') },
  { id: 'smart', file: path.join('OpenClash', 'OpenClash(mihomo-smart).sh') },
];

function findRuby() {
  const candidates = [process.env.RUBY, 'ruby'].filter(Boolean);
  if (process.platform === 'win32') {
    candidates.push('C:\\Ruby34-x64\\bin\\ruby.exe', 'C:\\Ruby33-x64\\bin\\ruby.exe', 'C:\\Ruby32-x64\\bin\\ruby.exe');
  }
  for (const candidate of candidates) {
    const result = childProcess.spawnSync(candidate, ['-v'], { encoding: 'utf8' });
    if (result.status === 0) return candidate;
  }
  throw new Error('Ruby is required for the OpenClash Node-DNS hint contract');
}

function extractEmbeddedRuntime(source) {
  const begin = source.indexOf(BEGIN);
  const end = source.indexOf(END, begin);
  if (begin === -1 || end === -1) return null;
  const bodyStart = source.indexOf('\n', begin);
  return bodyStart === -1 ? null : source.slice(bodyStart + 1, end).trimEnd().replace(/\r?\n/g, '\n');
}

function extractRubyProcessor(source, file) {
  const startMarker = 'cat > "$RUBY_SCRIPT" << \'RUBY_EOF\'';
  const start = source.indexOf(startMarker);
  if (start === -1) throw new Error(`${file}: Ruby heredoc start not found`);
  const contentStart = source.indexOf('\n', start) + 1;
  const end = source.indexOf('\nRUBY_EOF', contentStart);
  if (end === -1) throw new Error(`${file}: Ruby heredoc end not found`);
  return source.slice(contentStart, end);
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function assertArray(actual, expected, message, failures) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}; expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`, failures);
}

function writeFixtureFiles(tempDir) {
  const configPath = path.join(tempDir, 'subscription.yaml');
  const overridePath = path.join(tempDir, 'override.yaml');
  const statusPath = path.join(tempDir, 'status.log');
  const config = `proxies:
  - name: HK node
    type: ss
    server: hk.edge.private.test
    port: 443
  - name: US node
    type: ss
    server: us.edge.private.test
    port: 443
  - name: IP node
    type: ss
    server: 198.51.100.8
    port: 443
  - name: Fallback node
    type: ss
    server: fallback.node.test
    port: 443
  - name: Global policy node
    type: ss
    server: region.global.private.test
    port: 443
  - name: 剩余流量 1G
    type: ss
    server: ignored.edge.private.test
    port: 443
dns:
  proxy-server-nameserver:
    - https://resolver.private.test/dns-query
    - https://dns.google/dns-query
    - "[2001:db8::54]"
    - system
    - https://blocked.private.test/dns-query#DIRECT
    - https://unsafe.private.test/dns-query?skip-cert-verify=true
  proxy-server-nameserver-policy:
    hk.edge.private.test:
      - https://policy.private.test/dns-query
    '+.edge.private.test':
      - tls://198.51.100.53
    '*.edge.private.test':
      - tls://198.51.100.54
    unrelated.private.test:
      - https://unrelated.private.test/dns-query
    'geosite:cn':
      - https://should-not-appear.private.test/dns-query
  nameserver-policy:
    '+.global.private.test':
      - https://global.private.test/dns-query
    '*.edge.private.test':
      - https://wildcard.private.test/dns-query
    'rule-set:private':
      - https://should-not-appear.private.test/dns-query
hosts:
  hk.edge.private.test:
    - 198.51.100.11
  '+.edge.private.test':
    - 198.51.100.10
  '*.edge.private.test': alias.private.test
  resolver.private.test:
    - 198.51.100.53
    - "2001:db8::53"
    - "::ffff:192.0.2.53"
  dns.google:
    - 203.0.113.11
  unrelated.private.test:
    - 203.0.113.12
  malformed.private.test:
    malformed: true
proxy-groups: []
rules: []
rule-providers: {}
`;
  const override = `hosts:
  dns.alidns.com:
    - 223.5.5.5
    - 223.6.6.6
  doh.pub:
    - 119.29.29.29
  dns.google:
    - 8.8.8.8
    - 8.8.4.4
  cloudflare-dns.com:
    - 1.1.1.1
    - 1.0.0.1
dns:
  proxy-server-nameserver:
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  nameserver-policy:
    'geosite:cn':
      - https://dns.alidns.com/dns-query
      - https://doh.pub/dns-query
  nameserver:
    - https://dns.alidns.com/dns-query
  fallback:
    - https://cloudflare-dns.com/dns-query
proxy-groups: []
rule-providers: {}
rules: []
`;
  fs.writeFileSync(configPath, config, 'utf8');
  fs.writeFileSync(overridePath, override, 'utf8');
  return { configPath, overridePath, statusPath };
}

function writeCapacityFixtureFiles(tempDir) {
  const paths = writeFixtureFiles(tempDir);
  const proxyLines = [];
  const policyLines = [];
  const hostLines = [
    '  resolver.capacity.private.test:',
    '    - 198.51.100.200',
  ];
  for (let index = 0; index < 70; index += 1) {
    const domain = `node-${index}.capacity.private.test`;
    proxyLines.push(`  - name: Capacity ${index}\n    type: ss\n    server: ${domain}\n    port: 443`);
    hostLines.push(`  ${domain}:`, `    - 198.51.100.${(index % 200) + 1}`);
  }
  for (let index = 0; index < 300; index += 1) {
    hostLines.push(`  unrelated-${index}.capacity.private.test:`, '    - 203.0.113.200');
    policyLines.push(`    unrelated-policy-${index}.capacity.private.test:`, '      - https://late-policy.private.test/dns-query');
  }
  policyLines.push('    NODE-0.CAPACITY.PRIVATE.TEST:', '      - https://late-policy.private.test/dns-query');
  const config = [
    'proxies:',
    proxyLines.join('\n'),
    'dns:',
    '  proxy-server-nameserver:',
    '    - https://resolver.capacity.private.test/dns-query',
    '  proxy-server-nameserver-policy:',
    policyLines.join('\n'),
    'hosts:',
    hostLines.join('\n'),
    'proxy-groups: []',
    'rules: []',
    'rule-providers: {}',
    '',
  ].join('\n');
  fs.writeFileSync(paths.configPath, config, 'utf8');
  return paths;
}

function writeResolverCapacityFixtureFiles(tempDir) {
  const paths = writeFixtureFiles(tempDir);
  const proxyLines = [];
  const policyLines = [];
  const hostLines = [];
  for (let index = 0; index < 13; index += 1) {
    const node = `resolver-node-${index}.private.test`;
    const resolver = `resolver-${index}.private.test`;
    proxyLines.push(`  - name: Resolver ${index}\n    type: ss\n    server: ${node}\n    port: 443`);
    policyLines.push(`    ${node}:`, `      - https://${resolver}/dns-query`);
    hostLines.push(`  ${resolver}:`, `    - 198.51.100.${index + 30}`);
  }
  const config = [
    'proxies:',
    proxyLines.join('\n'),
    'dns:',
    '  proxy-server-nameserver:',
    '    - https://resolver-baseline.private.test/dns-query',
    '  proxy-server-nameserver-policy:',
    policyLines.join('\n'),
    'hosts:',
    hostLines.join('\n'),
    'proxy-groups: []',
    'rules: []',
    'rule-providers: {}',
    '',
  ].join('\n');
  fs.writeFileSync(paths.configPath, config, 'utf8');
  return paths;
}

function readYamlAsJson(ruby, yamlPath) {
  const probe = [
    'require "yaml"',
    'require "json"',
    'data = YAML.load_file(ARGV.fetch(0), permitted_classes: [Symbol], aliases: true)',
    'puts JSON.generate(data)',
  ].join('\n');
  const result = childProcess.spawnSync(ruby, ['-e', probe, yamlPath], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || 'Ruby YAML probe failed').trim());
  return JSON.parse(result.stdout);
}

function runProcessor(ruby, rubyPath, configPath, overridePath, statusPath, profile = 'adaptive') {
  const result = childProcess.spawnSync(ruby, [rubyPath, configPath, overridePath, statusPath, profile], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || 'OpenClash Ruby processor failed').trim());
}

function validateOutput(data, status, failures) {
  const dns = data.dns || {};
  const policy = dns['proxy-server-nameserver-policy'] || {};
  const globalPolicy = dns['nameserver-policy'] || {};
  const hosts = data.hosts || {};
  assertArray(dns['proxy-server-nameserver'], [
    'https://cloudflare-dns.com/dns-query',
    'https://dns.google/dns-query',
    'https://dns.alidns.com/dns-query',
    'https://doh.pub/dns-query',
  ], 'OpenClash preserves its fixed global proxy DNS baseline', failures);
  assertArray(policy['hk.edge.private.test'] || [], ['https://policy.private.test/dns-query'], 'OpenClash keeps exact node DNS policy', failures);
  assertArray(policy['us.edge.private.test'] || [], ['tls://198.51.100.54'], 'OpenClash favors single-label wildcard over a broader + wildcard', failures);
  assertArray(policy['fallback.node.test'] || [], ['https://resolver.private.test/dns-query', 'https://dns.google/dns-query', '2001:db8::54'], 'OpenClash materializes source proxy DNS only for an active fallback node', failures);
  assertArray(policy['region.global.private.test'] || [], ['https://global.private.test/dns-query'], 'OpenClash materializes matching global policy only for an active node', failures);
  assert(Object.keys(policy).length === 4, 'OpenClash proxy-server DNS policy has only active node FQDNs', failures);
  assert(!Object.prototype.hasOwnProperty.call(policy, 'unrelated.private.test'), 'OpenClash excludes unrelated policy', failures);
  assert(!Object.prototype.hasOwnProperty.call(policy, 'geosite:cn'), 'OpenClash excludes source geosite policy from the node resolver seam', failures);
  assertArray(globalPolicy['geosite:cn'] || [], ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'], 'OpenClash preserves its own global DNS baseline', failures);
  assertArray(hosts['hk.edge.private.test'] || [], ['198.51.100.11'], 'OpenClash exact host mapping wins', failures);
  assert(hosts['us.edge.private.test'] === 'alias.private.test', 'OpenClash preserves scalar domain hosts redirection from the winning wildcard', failures);
  assertArray(hosts['resolver.private.test'] || [], ['198.51.100.53', '2001:db8::53', '::ffff:192.0.2.53'], 'OpenClash keeps IPv4, IPv6 and IPv4-mapped IPv6 resolver bootstrap hosts', failures);
  assertArray(hosts['dns.google'] || [], ['8.8.8.8', '8.8.4.4'], 'OpenClash baseline host mapping wins over subscription value', failures);
  assert(!Object.prototype.hasOwnProperty.call(hosts, 'unrelated.private.test'), 'OpenClash excludes unrelated hosts', failures);
  assert(!Object.prototype.hasOwnProperty.call(hosts, 'ignored.edge.private.test'), 'OpenClash excludes info-node hosts', failures);
  assert(/\[node-dns\] profile=adaptive applied=true reason=applied domains=4 resolvers=6 policies=4 hosts=4 rejected=/.test(status), 'OpenClash status reports only count-based node DNS audit data', failures);
  for (const secretLikeValue of ['resolver.private.test', 'policy.private.test', '198.51.100.53']) {
    assert(!status.includes(secretLikeValue), `OpenClash status does not disclose ${secretLikeValue}`, failures);
  }
}

function validateCapacityOutput(data, failures) {
  const dns = data.dns || {};
  const policy = dns['proxy-server-nameserver-policy'] || {};
  const hosts = data.hosts || {};
  assertArray(hosts['resolver.capacity.private.test'] || [], ['198.51.100.200'], 'OpenClash keeps resolver bootstrap hosts when node hosts exceed the cap', failures);
  assert(Object.keys(policy).length === 64, 'OpenClash keeps the deterministic node-policy cap for oversized subscriptions', failures);
  assertArray(policy['node-0.capacity.private.test'] || [], ['https://late-policy.private.test/dns-query'], 'OpenClash preserves a late exact active-node policy after unrelated source entries', failures);
  assertArray(dns['proxy-server-nameserver'], [
    'https://cloudflare-dns.com/dns-query',
    'https://dns.google/dns-query',
    'https://dns.alidns.com/dns-query',
    'https://doh.pub/dns-query',
  ], 'OpenClash keeps oversized subscription DNS out of the global proxy DNS baseline', failures);
}

function validateResolverCapacityOutput(data, failures) {
  const policy = (data.dns || {})['proxy-server-nameserver-policy'] || {};
  const hosts = data.hosts || {};
  assert(Object.keys(policy).length === 13, 'OpenClash retains all accepted policies beyond the legacy resolver cap', failures);
  for (let index = 0; index < 13; index += 1) {
    const node = `resolver-node-${index}.private.test`;
    const resolver = `resolver-${index}.private.test`;
    assertArray(policy[node] || [], [`https://${resolver}/dns-query`], `OpenClash keeps resolver policy ${index} atomically`, failures);
    assertArray(hosts[resolver] || [], [`198.51.100.${index + 30}`], `OpenClash keeps resolver bootstrap host ${index} with its policy`, failures);
  }
}

function pickRepositoryDnsBaseline(data) {
  const dns = data.dns || {};
  return JSON.stringify({
    nameserver: dns.nameserver || [],
    proxyServerNameserver: dns['proxy-server-nameserver'] || [],
    fallback: dns.fallback || [],
    nameserverPolicy: dns['nameserver-policy'] || {},
  });
}

function pickRoutingTopology(data) {
  return JSON.stringify({
    proxies: data.proxies || [],
    groups: data['proxy-groups'] || [],
    rules: data.rules || [],
    providers: data['rule-providers'] || {},
  });
}

function validateProfiles(ruby, rubyPath, tempDir, failures) {
  const outputs = {};
  for (const profile of ['off', 'policy', 'adaptive']) {
    const paths = writeFixtureFiles(tempDir);
    runProcessor(ruby, rubyPath, paths.configPath, paths.overridePath, paths.statusPath, profile);
    outputs[profile] = {
      data: readYamlAsJson(ruby, paths.configPath),
      status: fs.readFileSync(paths.statusPath, 'utf8'),
    };
  }
  const off = outputs.off.data;
  const policy = outputs.policy.data;
  const adaptive = outputs.adaptive.data;
  assert(pickRoutingTopology(off) === pickRoutingTopology(policy), 'OpenClash off/policy profiles preserve identical proxy and routing topology', failures);
  assert(pickRoutingTopology(off) === pickRoutingTopology(adaptive), 'OpenClash off/adaptive profiles preserve identical proxy and routing topology', failures);
  assert(pickRepositoryDnsBaseline(off) === pickRepositoryDnsBaseline(policy), 'OpenClash off/policy profiles preserve the repository DNS baseline', failures);
  assert(pickRepositoryDnsBaseline(off) === pickRepositoryDnsBaseline(adaptive), 'OpenClash off/adaptive profiles preserve the repository DNS baseline', failures);

  const offPolicy = (off.dns || {})['proxy-server-nameserver-policy'] || {};
  const policyOnly = (policy.dns || {})['proxy-server-nameserver-policy'] || {};
  const adaptivePolicy = (adaptive.dns || {})['proxy-server-nameserver-policy'] || {};
  assert(Object.keys(offPolicy).length === 0, 'OpenClash off profile imports no subscription node DNS policy', failures);
  assert(!Object.prototype.hasOwnProperty.call(off.hosts || {}, 'hk.edge.private.test'), 'OpenClash off profile imports no subscription host hint', failures);
  assert(Object.keys(policyOnly).length === 3, 'OpenClash policy profile materializes only matching explicit policies', failures);
  assert(!Object.prototype.hasOwnProperty.call(policyOnly, 'fallback.node.test'), 'OpenClash policy profile rejects source proxy DNS fallback', failures);
  assertArray(policyOnly['hk.edge.private.test'] || [], ['https://policy.private.test/dns-query'], 'OpenClash policy profile retains exact policy', failures);
  assertArray(policyOnly['region.global.private.test'] || [], ['https://global.private.test/dns-query'], 'OpenClash policy profile projects only matching global policy', failures);
  assert(Object.keys(adaptivePolicy).length === 4, 'OpenClash adaptive profile adds only the active fallback policy', failures);
  assertArray(adaptivePolicy['fallback.node.test'] || [], ['https://resolver.private.test/dns-query', 'https://dns.google/dns-query', '2001:db8::54'], 'OpenClash adaptive profile retains scoped proxy DNS fallback', failures);
  assert(!Object.prototype.hasOwnProperty.call((adaptive.dns || {})['nameserver-policy'] || {}, '+.global.private.test'), 'OpenClash does not import source global DNS policy patterns', failures);
  for (const profile of ['off', 'policy', 'adaptive']) {
    const status = outputs[profile].status;
    assert(new RegExp(`\\[node-dns\\] profile=${profile} `).test(status), `OpenClash ${profile} profile emits an audit line`, failures);
    for (const secretLikeValue of ['resolver.private.test', 'policy.private.test', '198.51.100.53']) {
      assert(!status.includes(secretLikeValue), `OpenClash ${profile} profile audit log remains redacted`, failures);
    }
  }
}

function validateMissingBaselineFailsClosed(ruby, tempDir, failures) {
  const probePath = path.join(tempDir, 'missing-baseline.rb');
  const probe = [
    "require 'json'",
    RUNTIME,
    'source = { "dns" => { "proxy-server-nameserver-policy" => { "node.private.test" => ["https://resolver.private.test/dns-query"] } } }',
    'snapshot = SckiSubscriptionAdapter.capture_node_dns(source, ["node.private.test"], "adaptive")',
    'repository = { "dns" => {}, "hosts" => { "repository.example" => ["192.0.2.1"] } }',
    'before = Marshal.dump(repository)',
    'report = SckiSubscriptionAdapter.apply_node_dns(repository, snapshot, "adaptive")',
    'raise "expected missing-pss-baseline" unless report.fetch("reason") == "missing-pss-baseline"',
    'raise "unexpected mutation" unless Marshal.dump(repository) == before',
    'profile_repository = { "dns" => { "proxy-server-nameserver" => ["https://repository-baseline.example/dns-query"] }, "hosts" => { "repository.example" => ["192.0.2.1"] } }',
    'profile_before = Marshal.dump(profile_repository)',
    'profile_report = SckiSubscriptionAdapter.apply_node_dns(profile_repository, snapshot, "policy")',
    'raise "expected profile-mismatch" unless profile_report.fetch("reason") == "profile-mismatch"',
    'raise "profile mismatch mutated repository" unless Marshal.dump(profile_repository) == profile_before',
    'escaped_policy_repository = { "dns" => { "proxy-server-nameserver" => ["https://repository-baseline.example/dns-query"] }, "hosts" => { "repository.example" => ["192.0.2.1"] } }',
    'escaped_policy_before = Marshal.dump(escaped_policy_repository)',
    'escaped_policy_snapshot = { "profile" => "adaptive", "domains" => ["allowed.private.test"], "policy" => { "unrelated.private.test" => ["https://resolver.private.test/dns-query"] }, "hosts" => {}, "stats" => {} }',
    'escaped_policy_report = SckiSubscriptionAdapter.apply_node_dns(escaped_policy_repository, escaped_policy_snapshot, "adaptive")',
    'raise "expected out-of-bound policy invalid-snapshot" unless escaped_policy_report.fetch("reason") == "invalid-snapshot"',
    'raise "out-of-bound policy snapshot mutated repository" unless Marshal.dump(escaped_policy_repository) == escaped_policy_before',
    'escaped_host_repository = { "dns" => { "proxy-server-nameserver" => ["https://repository-baseline.example/dns-query"] }, "hosts" => { "repository.example" => ["192.0.2.1"] } }',
    'escaped_host_before = Marshal.dump(escaped_host_repository)',
    'escaped_host_snapshot = { "profile" => "adaptive", "domains" => ["allowed.private.test"], "policy" => { "allowed.private.test" => ["https://resolver.private.test/dns-query"] }, "hosts" => { "unrelated.private.test" => ["192.0.2.2"] }, "stats" => {} }',
    'escaped_host_report = SckiSubscriptionAdapter.apply_node_dns(escaped_host_repository, escaped_host_snapshot, "adaptive")',
    'raise "expected out-of-bound host invalid-snapshot" unless escaped_host_report.fetch("reason") == "invalid-snapshot"',
    'raise "out-of-bound host snapshot mutated repository" unless Marshal.dump(escaped_host_repository) == escaped_host_before',
    'profile_source = { "dns" => { "proxy-server-nameserver" => ["https://resolver.private.test/dns-query"], "proxy-server-nameserver-policy" => { "node.private.test" => ["https://policy.private.test/dns-query"] } } }',
    'canonical = SckiSubscriptionAdapter.capture_node_dns(profile_source, ["node.private.test", "fallback.private.test"], { "id" => "policy", "node_dns_projection" => "adaptive" })',
    'raise "object profile was not canonicalized" unless canonical.fetch("profile") == "policy" && canonical.fetch("policy").keys == ["node.private.test"]',
    'path_source = { "dns" => { "proxy-server-nameserver-policy" => { "path-case.private.test" => ["https://resolver.private.test/DNS"], "PATH-CASE.PRIVATE.TEST" => ["https://resolver.private.test/dns"] } } }',
    'path_snapshot = SckiSubscriptionAdapter.capture_node_dns(path_source, ["path-case.private.test"], "adaptive")',
    'raise "case-sensitive resolver path conflict was accepted" if path_snapshot.fetch("policy").key?("path-case.private.test")',
    'raise "case-sensitive resolver path conflict was not rejected" unless path_snapshot.fetch("stats").fetch("rejected").positive?',
    'puts JSON.generate(report)',
  ].join('\n');
  fs.writeFileSync(probePath, probe, 'utf8');
  const result = childProcess.spawnSync(ruby, [probePath], { encoding: 'utf8' });
  assert(result.status === 0, `OpenClash module fails closed without repository PSS baseline: ${(result.stderr || result.stdout || '').trim()}`, failures);
}

function runTarget(target, ruby) {
  const source = fs.readFileSync(path.join(REPO_ROOT, target.file), 'utf8');
  const failures = [];
  assert(extractEmbeddedRuntime(source) === RUNTIME, `${target.id}: embedded Ruby Module differs from canonical runtime source`, failures);
  assert(source.includes(`SCKI_SUBSCRIPTION_ADAPTER_PROFILE="\${SCKI_SUBSCRIPTION_ADAPTER_PROFILE:-${SUBSCRIPTION_ADAPTER_PROFILE_CONTRACT.default}}"`), `${target.id}: shell selects the profile-contract default locally`, failures);
  assert(/off\|policy\|adaptive/.test(source), `${target.id}: shell profile is constrained to the supported enum`, failures);
  assert(source.includes(`*) SCKI_SUBSCRIPTION_ADAPTER_PROFILE="${SUBSCRIPTION_ADAPTER_PROFILE_CONTRACT.default}" ;;`), `${target.id}: invalid shell profile falls back to the profile-contract default`, failures);
  assert(/"\$SCKI_SUBSCRIPTION_ADAPTER_PROFILE" "\$SCKI_MAX_NODE_MULTIPLIER" 2>>/.test(source), `${target.id}: shell passes the trusted profile and local node multiplier into the Ruby adapter`, failures);
  const rubyProcessor = extractRubyProcessor(source, target.file);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-openclash-node-dns-'));
  try {
    const rubyPath = path.join(tempDir, `${target.id}.rb`);
    fs.writeFileSync(rubyPath, rubyProcessor, 'utf8');
    const { configPath, overridePath, statusPath } = writeFixtureFiles(tempDir);
    runProcessor(ruby, rubyPath, configPath, overridePath, statusPath);
    const first = readYamlAsJson(ruby, configPath);
    const firstStatus = fs.readFileSync(statusPath, 'utf8');
    validateOutput(first, firstStatus, failures);
    const firstJson = JSON.stringify(first);
    runProcessor(ruby, rubyPath, configPath, overridePath, statusPath);
    const second = readYamlAsJson(ruby, configPath);
    assert(JSON.stringify(second) === firstJson, `${target.id}: OpenClash Node-DNS Adapter is idempotent`, failures);
    const capacityPaths = writeCapacityFixtureFiles(tempDir);
    runProcessor(ruby, rubyPath, capacityPaths.configPath, capacityPaths.overridePath, capacityPaths.statusPath);
    validateCapacityOutput(readYamlAsJson(ruby, capacityPaths.configPath), failures);
    const resolverCapacityPaths = writeResolverCapacityFixtureFiles(tempDir);
    runProcessor(ruby, rubyPath, resolverCapacityPaths.configPath, resolverCapacityPaths.overridePath, resolverCapacityPaths.statusPath);
    validateResolverCapacityOutput(readYamlAsJson(ruby, resolverCapacityPaths.configPath), failures);
    validateProfiles(ruby, rubyPath, tempDir, failures);
    validateMissingBaselineFailsClosed(ruby, tempDir, failures);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  return failures;
}

function main() {
  const ruby = findRuby();
  let failed = false;
  for (const target of TARGETS) {
    const failures = runTarget(target, ruby);
    if (failures.length) {
      failed = true;
      console.log(`FAIL OpenClash ${target.id}`);
      for (const failure of failures) console.log(`  - ${failure}`);
    } else {
      console.log(`PASS OpenClash ${target.id} Node-DNS hint contract`);
    }
  }
  if (failed) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
}
