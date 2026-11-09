'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const api = () => require('../lib/aerove-rule-assets');

test('partitions on aggregate logical labels before the entry limit and preserves exact strings', () => {
  const entries = ['sub.one.example', 'exact.example', '*.wild.example', '.sub.example'];
  const parts = api().partitionEntries(entries, { ...api().LIMITS, max_labels: 6 });
  assert.deepEqual(parts, [entries.slice(0, 2), entries.slice(2, 4)]);
  assert.deepEqual(parts.flat(), entries);
  assert.equal(api().measureEntries(['  中文.example  ']).text_bytes, Buffer.byteLength('中文.example') + 1);
});

test('budgets the actual MRS wildcard and apex leaves instead of folded Mihomo text', () => {
  const entries = ['+.one.example', 'two.example'];
  assert.deepEqual(api().nativeMrsEntries(entries, 'domain'), ['+.one.example', 'one.example', 'two.example']);
  assert.deepEqual(api().partitionEntries(entries, { ...api().LIMITS, max_entries: 2 }), [[entries[0]], [entries[1]]]);
  assert.deepEqual(api().partitionEntries(entries, { ...api().LIMITS, max_labels: 5 }), [[entries[0]], [entries[1]]]);
  assert.deepEqual(api().nativeMrsEntries(['+.example', 'example'], 'domain'), ['+.example', 'example']);
});

test('rejects indivisible oversized entries and detects omitted or introduced predicates', () => {
  assert.throws(() => api().partitionEntries(['a'.repeat(2049)]), /entry.*bytes/i);
  assert.throws(() => api().partitionEntries([Array(129).fill('a').join('.')]), /entry.*labels/i);
  assert.throws(() => api().assertSamePredicates(['+.example'], ['example']), /predicates/i);
  assert.throws(() => api().assertSamePredicates(['a', 'b'], ['a']), /predicates/i);
  api().assertSamePredicates(['b', 'a'], ['a', 'b']);
});

test('validates MRS decompression, magic, behavior and rejects forged/truncated binary', () => {
  const z = require('node:zlib');
  const header = Buffer.alloc(21); Buffer.from([77, 82, 83, 1]).copy(header);
  header.writeBigInt64BE(3n, 5);
  const body = Buffer.alloc(42); body[0] = 1;
  body.writeBigInt64BE(1n, 1); body.writeBigUInt64BE(2n, 9);
  body.writeBigInt64BE(1n, 17); body.writeBigUInt64BE(6n, 25);
  body.writeBigInt64BE(1n, 33); body[41] = 97;
  const compressed = z.zstdCompressSync(Buffer.concat([header, body]));
  assert.equal(api().inspectMrs(compressed, 'domain').header_entries, 3);
  assert.throws(() => api().inspectMrs(compressed, 'ipcidr'), /behavior/i);
  assert.throws(() => api().inspectMrs(Buffer.from('invalid'), 'domain'), /MRS/i);
});

test('native build proves split predicate union, preserves original bytes, and verifies saved inventory', {
  skip: !process.env.MIHOMO_BIN && 'Set MIHOMO_BIN for native MRS round-trip validation'
}, t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aerove-assets-test-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('aerove-assets-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const { spawnSync } = require('node:child_process');
  const directory = path.join(root, 'rulesets/generated/fused/mihomo');
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'large-domain.mrs');
  const yaml = file.replace('.mrs', '.yaml');
  // Four labels per predicate: labels, rather than 250k entries, force two shards.
  const entries = Array.from({ length: 125001 }, (_, i) => `+.n${i}.test.example`);
  fs.writeFileSync(yaml, 'payload:\n' + entries.map(item => '  - ' + JSON.stringify(item)).join('\n') + '\n');
  const compile = spawnSync(process.env.MIHOMO_BIN, ['convert-ruleset', 'domain', 'yaml', yaml, file], { windowsHide: true });
  assert.equal(compile.status, 0, String(compile.stderr));
  const original = fs.readFileSync(file);
  const providers = { large: { type: 'http', behavior: 'domain', format: 'mrs', url: 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/large-domain.mrs?scki=v6.0.20', proxy: 'route', header: { Accept: ['*/*'] } } };
  const fusedManifest = { baseline_version: 'v6.0.20', segments: [{ files: { domain: { file: 'large-domain.mrs', source: 'large-domain.yaml' } } }] };
  const built = api().buildAssetOutputs({ repoRoot: root, providers, fusedManifest, mihomoBin: process.env.MIHOMO_BIN });
  assert.equal(built.manifest.splits.large.length, 2);
  assert.equal(built.manifest.sources[0].metrics.labels, 500004);
  assert.deepEqual(fs.readFileSync(file), original);
  for (const [relative, bytes] of Object.entries(built.outputs)) {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.writeFileSync(path.join(root, relative), bytes);
  }
  assert.deepEqual(api().readAssetManifest({ repoRoot: root, providers, fusedManifest }), built.manifest);
  fs.writeFileSync(yaml, fs.readFileSync(yaml, 'utf8').replace(/\r?\n/g, '\r\n'));
  assert.deepEqual(api().readAssetManifest({ repoRoot: root, providers, fusedManifest }), built.manifest,
    'Text-source provenance must use the same LF identity on Windows and Linux');
  assert.throws(() => api().readAssetManifest({ repoRoot: root, providers: { ...providers, extra: providers.large }, fusedManifest }), /fingerprint/i);
  const unknown = path.join(root, api().ASSET_DIR, 'unknown.mrs');
  fs.writeFileSync(unknown, 'unowned');
  assert.throws(() => api().readAssetManifest({ repoRoot: root, providers, fusedManifest }), /orphan/i);
  fs.unlinkSync(unknown);
  const shard = path.join(root, built.manifest.assets[0].path);
  fs.appendFileSync(shard, 'corrupt');
  assert.throws(() => api().readAssetManifest({ repoRoot: root, providers, fusedManifest }), /hash|bytes/i);
});

test('native IPCIDR source budgets preserve pre-merge header and full canonical traversal separately', {
  skip: !process.env.MIHOMO_BIN && 'Set MIHOMO_BIN for native IPCIDR validation'
}, t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aerove-ipcidr-test-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('aerove-ipcidr-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const source = path.join(root, 'source.yaml'); const target = path.join(root, 'source.mrs');
  fs.writeFileSync(source, 'payload:\n  - "192.0.2.0/24"\n  - "192.0.2.0/25"\n');
  const { spawnSync } = require('node:child_process');
  assert.equal(spawnSync(process.env.MIHOMO_BIN, ['convert-ruleset', 'ipcidr', 'yaml', source, target], { windowsHide: true }).status, 0);
  const providers = { ip: { format: 'mrs', behavior: 'ipcidr', url: 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/source.mrs' } };
  const { manifest } = api().buildAssetOutputs({ repoRoot: root, providers, fusedManifest: {}, mihomoBin: process.env.MIHOMO_BIN });
  assert.equal(manifest.sources[0].metrics.header_entries, 2);
  assert.equal(manifest.sources[0].metrics.entries, 1);
  assert.deepEqual(manifest.splits, {});
});

test('domain proof preserves exact/suffix semantics without accepting arbitrary count gaps', () => {
  const inputs = ['+.one.test', 'one.test', 'one.test', '.two.test', 'two.test'];
  const header = { header_entries: 5, encoded_leaves: 4 };
  const proof = api().proveDomainMrs(inputs, ['+.one.test', '+.two.test'], header);
  assert.equal(proof.insertions, 5);
  assert.equal(proof.compact_entries, 2);
  assert.throws(() => api().proveDomainMrs(inputs, ['+.one.test', '+.evil.test'], header), /predicates/);
  assert.throws(() => api().proveDomainMrs(inputs, ['+.one.test', '+.two.test'], { ...header, header_entries: 6 }), /insertion count/);
  assert.throws(() => api().proveDomainMrs(inputs, ['+.one.test', '+.two.test'], { ...header, encoded_leaves: 3 }), /encoded leaves/);
  for (const invalid of ['', 'bad..test', 'bad.test.', 'a/b', ' a.test', 'a+.test', 'a.*b.test', '+']) {
    assert.throws(() => api().domainPredicates([invalid]), /Invalid/);
  }
  assert.notDeepEqual(api().domainPredicates(['.one.test']), api().domainPredicates(['+.one.test']));
});

test('native duplicate/overlap MRS proves source semantics and rejects forged counts or lost predicates', {
  skip: !process.env.MIHOMO_BIN && 'Set MIHOMO_BIN for native MRS proof validation'
}, t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aerove-domain-proof-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const { spawnSync } = require('node:child_process'), z = require('node:zlib');
  const directory = path.join(root, 'rulesets/generated/fused/mihomo'); fs.mkdirSync(directory, { recursive: true });
  const source = path.join(directory, 'overlap.yaml'), target = path.join(directory, 'overlap.mrs');
  const inputs = ['+.one.test', 'one.test', 'one.test', '.two.test', 'two.test'];
  const yaml = entries => 'payload:\n' + entries.map(x => '  - '+JSON.stringify(x)).join('\n')+'\n';
  const compile = entries => {
    const temp = path.join(root, 'input.yaml'); fs.writeFileSync(temp, yaml(entries));
    const r = spawnSync(process.env.MIHOMO_BIN, ['convert-ruleset', 'domain', 'yaml', temp, target]);
    assert.equal(r.status, 0, String(r.stderr));
  };
  fs.writeFileSync(source, yaml(inputs)); compile(inputs);
  const bytes = fs.readFileSync(target);
  const providers = { overlap: { behavior: 'domain', format: 'mrs', url: 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/overlap.mrs' } };
  const fusedManifest = { segments: [{ files: { domain: { file: 'overlap.mrs', source: 'overlap.yaml' } } }] };
  const opts = { repoRoot: root, providers, fusedManifest, mihomoBin: process.env.MIHOMO_BIN };
  const built = api().buildAssetOutputs(opts), row = built.manifest.sources[0];
  assert.equal(row.metrics.header_entries, 5); assert.equal(row.metrics.entries, 2);
  assert.equal(row.metrics.encoded_leaves, 4); assert.equal(row.domain_proof.canonical_predicates, 4);
  assert.deepEqual(fs.readFileSync(target), bytes);
  for (const [relative, content] of Object.entries(built.outputs)) {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true }); fs.writeFileSync(path.join(root, relative), content);
  }
  assert.deepEqual(api().readAssetManifest({ repoRoot: root, providers, fusedManifest }), built.manifest);
  const manifestPath = path.join(root, api().MANIFEST_PATH), originalManifest = fs.readFileSync(manifestPath);
  const tampered = JSON.parse(originalManifest); delete tampered.sources[0].domain_proof;
  fs.writeFileSync(manifestPath, JSON.stringify(tampered));
  assert.throws(() => api().readAssetManifest({ repoRoot: root, providers, fusedManifest }), /domain proof/);
  fs.writeFileSync(manifestPath, originalManifest);
  const forged = z.zstdDecompressSync(bytes); forged.writeBigInt64BE(6n, 5); fs.writeFileSync(target, z.zstdCompressSync(forged));
  assert.throws(() => api().buildAssetOutputs(opts), /insertion count/);
  compile(['+.one.test', '+.evil.test', '+.one.test', '+.one.test', '+.one.test']);
  assert.throws(() => api().buildAssetOutputs(opts), /predicates/);
});
