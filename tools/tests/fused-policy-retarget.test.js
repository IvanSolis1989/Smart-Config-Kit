'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const toolPath = '../retarget-fused-provider';
function api() { return require(toolPath); }
const DOWNLOAD = '📥 下载更新', GOOGLE = '🔍 Google 服务';

function fixture() {
  const rules = [
    `RULE-SET,download-guard,${DOWNLOAD}`,
    `RULE-SET,googlefcm-domain,${DOWNLOAD}`,
    `RULE-SET,googlefcm-ipcidr,${DOWNLOAD}`,
    `RULE-SET,google,${GOOGLE}`,
    `RULE-SET,google-ip,${GOOGLE},no-resolve`,
    'MATCH,🐟 漏网之鱼',
  ];
  const providers = Object.fromEntries(['download-guard', 'googlefcm-domain', 'googlefcm-ipcidr', 'google', 'google-ip'].map(id => [id, { type: 'http', url: `https://example.test/${id}.mrs`, interval: 100 }]));
  const before = { rules, providers };
  const after = structuredClone(before);
  after.rules[1] = `RULE-SET,googlefcm-domain,${GOOGLE}`;
  after.rules[2] = `RULE-SET,googlefcm-ipcidr,${GOOGLE}`;
  const catalog = [
    { id: 'scki-fused-001-download', policy: DOWNLOAD, source_rules: rules.slice(0, 3) },
    { id: 'scki-fused-002-google', policy: GOOGLE, source_rules: rules.slice(3, 5) },
  ];
  const buckets = {
    'scki-fused-001-download': { domain: ['DOMAIN-SUFFIX,download.test', 'DOMAIN,mtalk.google.com'], ipcidr: ['IP-CIDR,74.125.24.188/32'], ipcidrNoResolve: [], residual: ['DOMAIN-KEYWORD,download-client'] },
    'scki-fused-002-google': { domain: ['DOMAIN-SUFFIX,google.com'], ipcidr: [], ipcidrNoResolve: ['IP-CIDR,74.125.0.0/16'], residual: [] },
  };
  const manifest = { source_segments: catalog, pruned_empty_segments: [], inline_rules: ['MATCH,🐟 漏网之鱼'], unresolved_providers: [], unresolved_sources: [], passthrough_providers: [], segments: catalog.map(row => ({ id: row.id, policy: row.policy, source_rules: row.source_rules.length })) };
  return { before, after, manifest, buckets, providerEntries: { domain: ['DOMAIN,mtalk.google.com'], ipcidr: ['IP-CIDR,74.125.24.188/32'] } };
}

test('moves only FCM predicates out of a shared download segment and keeps resolving and no-resolve buckets distinct', () => {
  assert.equal(typeof api().planRetarget, 'function', 'frozen FCM retarget planner must exist');
  const plan = api().planRetarget(fixture());
  assert.deepEqual(plan.segments[0].domain, ['DOMAIN-SUFFIX,download.test']);
  assert.deepEqual(plan.segments[0].residual, ['DOMAIN-KEYWORD,download-client']);
  assert.deepEqual(plan.segments[0].ipcidr, []);
  assert.deepEqual(plan.segments[1].ipcidr, ['IP-CIDR,74.125.24.188/32']);
  assert.deepEqual(plan.segments[1].ipcidrNoResolve, ['IP-CIDR,74.125.0.0/16']);
  assert.deepEqual(plan.segments[1].domain, ['DOMAIN-SUFFIX,google.com']);
  assert.equal(plan.segments[0].sourceRules.length, 1);
  assert.equal(plan.segments[1].sourceRules.length, 4);
  assert.equal(plan.timeline.at(-1).rule, 'MATCH,🐟 漏网之鱼');
});

test('rejects unrelated provider or rule changes rather than hiding them in the retarget receipt', () => {
  const provider = fixture(); provider.after.providers.google.url = 'https://unreviewed.test/google.mrs';
  assert.throws(() => api().planRetarget(provider), /provider definitions/);
  const order = fixture(); [order.after.rules[3], order.after.rules[4]] = [order.after.rules[4], order.after.rules[3]];
  assert.throws(() => api().planRetarget(order), /only googlefcm/);
  const extra = fixture(); extra.after.rules.push('DOMAIN,other.test,DIRECT');
  assert.throws(() => api().planRetarget(extra), /only googlefcm/);
});

test('rejects missing FCM predicates and no-resolve reinterpretation before writing', () => {
  const missing = fixture(); missing.buckets['scki-fused-001-download'].ipcidr = [];
  assert.throws(() => api().planRetarget(missing), /frozen donor/);
  const modifier = fixture(); modifier.after.rules[2] += ',no-resolve';
  assert.throws(() => api().planRetarget(modifier), /only googlefcm/);
});

test('source gate permits the one target replacement and version metadata only', () => {
  const source = "const SOURCE_GRAPH_VERSION = 'v6.0.20';\nconst r = `RULE-SET,googlefcm,${BIZ.DOWNLOAD}`;\n";
  const after = source.replace('v6.0.20', 'v6.0.21').replace('${BIZ.DOWNLOAD}', '${BIZ.GOOGLE}');
  assert.doesNotThrow(() => api().assertSourceChange(source, after));
  assert.throws(() => api().assertSourceChange(source, after + '// unrelated\n'), /source change/);
});

test('rejects a corrupted identity-bound MRS before invoking the native decoder', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fcm-retarget-test-'));
  try {
    const directory = path.join(root, 'rulesets/generated/mihomo-mrs'); fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'googlefcm-domain.mrs'), 'corrupt');
    fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({ split: [{ id: 'googlefcm', source_entry_count: 41, generated: [
      { behavior: 'domain', file: 'googlefcm-domain.mrs', output_receipt: { content: { sha256: '0'.repeat(64) } } },
      { behavior: 'ipcidr', file: 'googlefcm-ipcidr.mrs' },
    ] }] }));
    assert.throws(() => api().decodeProvider({ baselineRoot: root, temporary: root, mihomoBin: process.execPath }), /MRS hash mismatch/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('DNS boundary rejects a changed resolver even when rule outputs are valid', () => {
  const before = 'dns:\n  nameserver: [https://dns.example/query]\nsniffer:\n  enable: true\nrule-providers:\n  old: {}\nrules:\n- MATCH,DIRECT\n';
  const rulesOnly = before.replace('old: {}', 'new: {}');
  assert.doesNotThrow(() => api().assertDnsBoundary('client.yaml', before, rulesOnly));
  assert.throws(() => api().assertDnsBoundary('client.yaml', before, rulesOnly.replace('dns.example', 'other.example')), /DNS or sniff/);
});

function nativeFixture() {
  const donor = 'scki-fused-007-download', target = 'scki-fused-008-google';
  const domains = Array.from({ length: 15 }, (_, i) => `fcm${i}.google.com`);
  const ips = Array.from({ length: 26 }, (_, i) => `74.125.24.${i + 1}/32`);
  const render = (id, key, values, noResolve = false) => '# Generated by tools/generate-egern-from-cmfa.js\n' + `# Source id: ${id}\n# Source URL: https://example.test/${id}.yaml\n` + (noResolve ? 'no_resolve: true\n' : '') + key + ':\n' + values.map(value => `  - ${JSON.stringify(value)}\n`).join('');
  const source = `provider-${donor}-domain.yaml`, sourceIp = `provider-${donor}-ipcidr.yaml`, stable = `provider-${target}-ipcidr-no-resolve.yaml`;
  const assetTexts = { [source]: render(source.slice(0, -5), 'domain_set', ['keep-download.test', ...domains]), [sourceIp]: render(sourceIp.slice(0, -5), 'ip_cidr_set', ips), [stable]: render(stable.slice(0, -5), 'ip_cidr_set', ['74.125.0.0/16'], true) };
  const snapshot = { schemaVersion: 1, assets: assetTexts, fusedMihomoHashes: {}, publishedRendered: { source_entry_count: 43, dedup_removed: 0, global_exact_duplicates_removed: 0, empty_asset_count: 1 }, publishedAssets: Object.entries(assetTexts).map(([file, text]) => ({ file, sha256: crypto.createHash('sha256').update(text).digest('hex'), bytes: Buffer.byteLength(text) })) };
  const receipt = { affected_segments: [donor, target], moved_predicates: [...domains.map(value => ({ bucket: 'domain', entry: `DOMAIN,${value}`, from: donor, to: target, no_resolve: false })), ...ips.map(value => ({ bucket: 'ipcidr', entry: `IP-CIDR,${value}`, from: donor, to: target, no_resolve: false }))] };
  const assets = new Map([source, `provider-${target}-domain.yaml`, `provider-${target}-ipcidr.yaml`, stable].map(file => [file, { file, id: file.slice(0, -5), sourceUrl: `https://example.test/${file}`, noResolve: file === stable }]));
  return { snapshot, receipt, assets, source, sourceIp, stable, domains, ips, target };
}

test('native Egern migration moves all 15 domains and 26 IPs without consuming the old no-resolve asset', () => {
  const f = nativeFixture(); const result = api().planEgernRetarget(f);
  const egern = require('../generate-egern-from-cmfa');
  assert.deepEqual([...egern.parseFrozenRuleSet(result.snapshot.assets[f.source]).sets.domain_set], ['keep-download.test']);
  assert.equal(result.snapshot.assets[f.sourceIp], undefined);
  assert.deepEqual([...egern.parseFrozenRuleSet(result.snapshot.assets[`provider-${f.target}-domain.yaml`]).sets.domain_set].sort(), f.domains.slice().sort());
  const targetIp = egern.parseFrozenRuleSet(result.snapshot.assets[`provider-${f.target}-ipcidr.yaml`]);
  assert.deepEqual([...targetIp.sets.ip_cidr_set].sort(), f.ips.slice().sort());
  assert.equal(targetIp.noResolve, false);
  assert.equal(result.snapshot.assets[f.stable], f.snapshot.assets[f.stable]);
});

test('native migration rejects corruption in any frozen asset before changing domain ownership', () => {
  const f = nativeFixture(); f.snapshot.assets[f.stable] += '# changed\n';
  assert.throws(() => api().planEgernRetarget(f), /snapshot asset hash mismatch/);
});

test('historical Egern metadata bridge must reconstruct the exact frozen manifest and preserve all counts', () => {
  const manifest = { schema_version: 1, generator: 'tools/generate-egern-from-cmfa.js', asset_revision: 'v6.0.20', source: { routing_graph_sha256: 'before', cmfa_sha256: 'old', cmfa_provider_count: 2 }, rendered: { profile_sha256: 'old-profile', native_rule_set_count: 3 }, assets: { files: [] } };
  const snapshot = { publishedSource: manifest.source, publishedRendered: manifest.rendered, publishedManifestSha256: crypto.createHash('sha256').update(JSON.stringify(manifest, null, 2) + '\n').digest('hex') };
  const current = structuredClone(manifest); current.source.routing_graph_sha256 = 'new'; current.rendered.profile_sha256 = 'new-profile';
  assert.doesNotThrow(() => api().assertNativeManifestBridge(snapshot, JSON.stringify(current)));
  current.rendered.native_rule_set_count = 4;
  assert.throws(() => api().assertNativeManifestBridge(snapshot, JSON.stringify(current)), /metadata bridge/);
});
