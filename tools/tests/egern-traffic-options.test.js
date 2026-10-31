'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { loadSnapshot, hash, packStagedOutput } = require('../lib/egern-traffic-snapshot');
const { listGeneratedEgernAssetRecords } = require('../lib/egern-generation-manifest');
const generator = require('../generate-egern-from-cmfa');
const { getQuicRules } = require('../../rulesets/source/routing-graph');

const ROOT = path.resolve(__dirname, '../..');
const CMFA = path.join(ROOT, 'Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml');
const ids = require('../lib/fused-contract-segments').resolveContractSegments();

function withStage(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-egern-test-'));
  try { return callback(directory); } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

test('portable snapshot binds every published native asset and source payload', () => {
  const snapshot = loadSnapshot();
  assert(snapshot.publishedAssets.length > 0);
  for (const record of snapshot.publishedAssets) assert.equal(hash(snapshot.assets[record.file]), record.sha256);
  assert.match(snapshot.trafficSourceFingerprint, /^[a-f0-9]{64}$/);
  assert.match(snapshot.fusedPayloadFingerprint, /^[a-f0-9]{64}$/);
});

test('default reuse preserves every published native asset byte', () => withStage((directory) => {
  const snapshot = loadSnapshot();
  const cmfa = fs.readFileSync(CMFA, 'utf8');
  const providers = generator.parseProviders(cmfa);
  const rules = generator.canonicalBlockRules(generator.parseRules(cmfa));
  const assets = generator.discoverAssets(rules, providers);
  const stats = generator.generateNativeRuleSetsFromSnapshot(assets, snapshot, { outputDir: directory, followRules: false });
  assert.equal(stats.assetCount, snapshot.publishedAssets.length);
  for (const record of snapshot.publishedAssets) {
    assert.equal(fs.readFileSync(path.join(directory, record.file), 'utf8'), snapshot.assets[record.file]);
  }
  const profile = generator.renderProfile(rules, providers, assets, stats).output;
  generator.validateStaged(directory, profile, cmfa, providers, rules, stats);
}));

test('follow-rules removes conditional QUIC geos and restores domain providers', () => withStage((directory) => {
  const snapshot = loadSnapshot();
  const cmfa = fs.readFileSync(CMFA, 'utf8');
  const providers = generator.parseProviders(cmfa);
  const blockQuic = getQuicRules('block-foreign');
  const rules = generator.parseRules(cmfa).filter((rule) => !blockQuic.includes(rule));
  const assets = generator.discoverAssets(rules, providers);
  const stats = generator.generateNativeRuleSetsFromSnapshot(assets, snapshot, { outputDir: directory, followRules: true });
  const files = fs.readdirSync(directory);
  assert(!files.some((file) => file.startsWith('geosite-')));
  for (const name of [`provider-${ids['scki-fused-022-google']}-domain.yaml`, `provider-${JSON.parse(fs.readFileSync(path.join(ROOT, 'rulesets/generated/fused/manifest.json'), 'utf8')).source_segments.find(row => row.source_rules.includes('RULE-SET,microsoft,Ⓜ️ 微软服务')).id}-domain.yaml`]) {
    assert(files.includes(name), `${name} must be restored`);
    const text = fs.readFileSync(path.join(directory, name), 'utf8');
    assert.match(text, /domain_(?:suffix_)?set:/);
  }
  assert(stats.assetCount > 0);
  const profile = generator.renderProfile(rules, providers, assets, stats).output;
  generator.validateStaged(directory, profile, cmfa, providers, rules, stats);
  for (const file of files) {
    if (!snapshot.assets[file]) continue;
    const current = generator.parseFrozenRuleSet(fs.readFileSync(path.join(directory, file), 'utf8'));
    const frozen = generator.parseFrozenRuleSet(snapshot.assets[file]);
    for (const key of ['geoip_set', 'ip_cidr_set', 'ip_cidr6_set', 'asn_set', 'dest_port_set', 'protocol_set']) {
      assert.deepEqual([...current.sets[key]].sort(), [...frozen.sets[key]].sort(), `${file}: ${key}`);
    }
  }
}));

test('canonical block reconstruction inserts the five graph rules at the original anchor', () => {
  const quic = getQuicRules('block-foreign');
  const sample = ['DOMAIN,example.com,DIRECT', 'DST-PORT,7680,REJECT', 'MATCH,🌍 全球节点'];
  assert.deepEqual(generator.canonicalBlockRules(sample), [sample[0], ...quic, sample[1], sample[2]]);
});

test('full canonical staging can freeze a neutral asset without network access', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-egern-canonical-'));
  try {
    const assets = generator.discoverAssets(['GEOSITE,google,🔍 Google 服务'], new Map());
    const stats = await generator.generateNativeRuleSets(assets, {
      outputDir: directory,
      fetcher: async () => 'payload:\n  - DOMAIN-SUFFIX,example.test\n',
    });
    assert.equal(stats.assetCount, 1);
    const manifest = { assets: { files: listGeneratedEgernAssetRecords(directory) }, source: {}, rendered: { source_entry_count: 1, dedup_removed: 0, global_exact_duplicates_removed: 0, empty_asset_count: 0 } };
    const snapshot = packStagedOutput(directory, manifest);
    assert.equal(Object.keys(snapshot.assets).length, 1);
    assert.match(snapshot.assets['geosite-google.yaml'], /example\.test/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
