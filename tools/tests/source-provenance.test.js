'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const provenance = require('../lib/source-provenance');
const { downloadSource, ensureMihomoBinary, parseArgs, parsePayloadEntries, classifyEntry } = require('../sync-mihomo-mrs-rule-providers');

const commit = '0123456789abcdef0123456789abcdef01234567';
const requested = 'https://fastly.jsdelivr.net/gh/Example/Rules@main/list.txt';
const pinned = `https://raw.githubusercontent.com/Example/Rules/${commit}/list.txt`;

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'source-provenance-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('raw-byte receipt binds the consumed pinned URL and original requested ref', () => {
  const bytes = Buffer.from('payload:\r\n  - "+.example.com"\r\n');
  const receipt = provenance.createSourceReceipt({ requestedUrl: requested, effectiveUrl: pinned, bytes, resolvedCommit: commit });
  assert.equal(receipt.content.sha256, provenance.sha256(bytes));
  assert.equal(receipt.content.bytes, bytes.length);
  assert.equal(receipt.source.requested_ref, 'main');
  assert.equal(receipt.source.resolved_commit, commit);
  assert.equal(receipt.source.version_state, 'pinned-commit');
  assert.throws(() => provenance.createSourceReceipt({ requestedUrl: requested, effectiveUrl: requested, bytes, resolvedCommit: commit }), /not bound/);
  assert.throws(() => provenance.createSourceReceipt({ requestedUrl: requested, effectiveUrl: pinned.replace('list.txt', 'wrong.txt'), bytes, resolvedCommit: commit }), /not bound/);
});

test('floating and non-Git sources stay content addressed without invented commit', () => {
  for (const url of [requested, 'https://ruleset.skk.moe/Clash/domainset/reject_phishing.txt']) {
    const receipt = provenance.createSourceReceipt({ requestedUrl: url, effectiveUrl: url, bytes: Buffer.from('a') });
    assert.equal(receipt.source.resolved_commit, null);
    assert.equal(receipt.source.version_state, 'content-addressed');
    if (url === requested) assert.equal(receipt.source.license.status, 'unknown');
    else assert.equal(receipt.source.license.data_license_status, 'component-review-required');
  }
});

test('unread binary MRS and failed fetch cannot be recorded as verified input', () => {
  const binary = provenance.createSourceReceipt({ requestedUrl: requested.replace('.txt', '.mrs'), inputKind: 'binary-source', acquisition: 'unread-reference' });
  assert.equal(binary.verification, 'unread');
  assert.equal(binary.content, null);
  assert.equal(binary.source.version_state, 'unknown');
  const failed = provenance.createSourceReceipt({ requestedUrl: requested, acquisition: 'failed' });
  assert.equal(failed.verification, 'failed');
  assert.equal(failed.source.resolved_commit, null);
});

test('cache replay verifies raw hash and preserves pinned binding without a network call', async t => {
  const root = fixture(t);
  let calls = 0;
  const options = { requestedUrl: requested, cacheDir: root, keepCache: true,
    fetchSource: async () => { calls++; return { bytes: Buffer.from('before'), effectiveUrl: pinned, resolvedCommit: commit }; } };
  await provenance.acquireSource(options);
  const cached = await provenance.acquireSource({ ...options, offline: true });
  assert.equal(calls, 1);
  assert.equal(cached.receipt.acquisition, 'offline-cache');
  assert.equal(cached.receipt.source.resolved_commit, commit);
  await provenance.acquireSource({ ...options, fetchSource: async () => { calls++; return { bytes: Buffer.from('after'), effectiveUrl: requested }; } });
  assert.equal(calls, 2); // Online refresh cannot freeze a floating source forever.
  const refreshed = await provenance.acquireSource({ ...options, offline: true });
  assert.equal(refreshed.bytes.toString(), 'after');
  assert.equal(refreshed.receipt.source.resolved_commit, null);
});

test('offline cache miss and same-size tampering fail before transport', async t => {
  const root = fixture(t);
  const options = { requestedUrl: requested, cacheDir: root, offline: true,
    fetchSource: async () => { throw new Error('NETWORK MUST NOT RUN'); } };
  await assert.rejects(provenance.acquireSource(options), /offline source cache miss/);
  await provenance.acquireSource({ ...options, offline: false, keepCache: true,
    fetchSource: async () => ({ bytes: Buffer.from('abc'), effectiveUrl: requested }) });
  fs.writeFileSync(provenance.cachePaths(root, requested).bytes, 'def');
  await assert.rejects(provenance.acquireSource(options), /hash\/identity mismatch/);
});

test('cache receipt tampering cannot upgrade floating bytes to a commit', async t => {
  const root = fixture(t);
  await provenance.acquireSource({ requestedUrl: requested, cacheDir: root, keepCache: true,
    fetchSource: async () => ({ bytes: Buffer.from('abc'), effectiveUrl: requested }) });
  const file = provenance.cachePaths(root, requested).receipt;
  const receipt = JSON.parse(fs.readFileSync(file, 'utf8'));
  receipt.source.resolved_commit = commit;
  receipt.source.version_state = 'pinned-commit';
  fs.writeFileSync(file, JSON.stringify(receipt));
  await assert.rejects(provenance.acquireSource({ requestedUrl: requested, cacheDir: root, offline: true }), /commit binding mismatch/);
});

test('local supplemental receipt has a safe repository path and raw hash', async t => {
  const root = fixture(t);
  const file = path.join(root, 'supplemental.list');
  fs.writeFileSync(file, 'DOMAIN-SUFFIX,example.com\n');
  const result = await provenance.acquireSource({ requestedUrl: requested, localPath: file, repoRoot: root, offline: true });
  assert.equal(result.receipt.local_path, 'supplemental.list');
  assert.equal(result.receipt.effective_url, null);
  assert.equal(result.receipt.source.resolved_commit, null);
  assert.equal(result.receipt.content.sha256, provenance.sha256(fs.readFileSync(file)));
  assert.throws(() => provenance.createSourceReceipt({ localPath: '../escape.txt', repoRoot: root, bytes: Buffer.from('a') }), /outside repository/);
});

test('download resolves a floating Git ref once before fetching the pinned bytes', async () => {
  const calls = [];
  const fetchMock = async url => {
    calls.push(url);
    if (url.startsWith('https://api.github.com/')) return { ok: true, json: async () => ({ sha: commit }) };
    assert.equal(url, pinned);
    return { ok: true, url, arrayBuffer: async () => Buffer.from('raw') };
  };
  const memo = new Map();
  const fetched = await downloadSource(requested, fetchMock, memo);
  assert.equal(fetched.resolvedCommit, commit);
  await downloadSource(requested, fetchMock, memo);
  assert.equal(calls.filter(url => url.startsWith('https://api.github.com/')).length, 1);
});

test('failed Git resolution still records actual content without a commit', async () => {
  const fetched = await downloadSource(requested, async url => url.startsWith('https://api.github.com/')
    ? { ok: false, status: 403 } : { ok: true, url, arrayBuffer: async () => Buffer.from('raw') });
  const receipt = provenance.createSourceReceipt({ requestedUrl: requested, effectiveUrl: fetched.effectiveUrl, bytes: fetched.bytes });
  assert.equal(fetched.resolvedCommit, null);
  assert.equal(receipt.source.version_state, 'content-addressed');
});

for (const ref of [commit, 'meta', 'release']) {
  test(`raw GitHub fallback preserves @${ref} in jsDelivr URL`, async () => {
    const url = `https://raw.githubusercontent.com/Example/Rules/${ref}/list.txt`;
    const fallback = `https://fastly.jsdelivr.net/gh/Example/Rules@${ref}/list.txt`;
    const calls = [];
    const fetched = await downloadSource(url, async candidate => {
      calls.push(candidate);
      if (candidate.startsWith('https://api.github.com/') || candidate === url) return { ok: false, status: 404 };
      assert.equal(candidate, fallback);
      return { ok: true, url: candidate, arrayBuffer: async () => Buffer.from('fallback bytes') };
    });
    assert.equal(fetched.effectiveUrl, fallback);
    assert.equal(calls.filter(candidate => candidate === fallback).length, 1);
    const receipt = provenance.createSourceReceipt({ requestedUrl: url, effectiveUrl: fetched.effectiveUrl, bytes: fetched.bytes });
    assert.equal(receipt.source.resolved_commit, ref === commit ? commit : null);
  });
}

test('offline binary selection never calls the release API and validates cached executable', async t => {
  const root = fixture(t);
  const originalFetch = global.fetch;
  global.fetch = async () => { throw new Error('NETWORK MUST NOT RUN'); };
  t.after(() => { global.fetch = originalFetch; });
  await assert.rejects(ensureMihomoBinary(null, { offline: true }, root), /offline mihomo binary cache miss/);
  const file = path.join(root, 'mihomo-test.exe');
  fs.writeFileSync(file, 'binary');
  fs.writeFileSync(path.join(root, 'binary.json'), JSON.stringify({ file: path.basename(file), sha256: provenance.sha256(Buffer.from('binary')), bytes: 6 }));
  assert.equal(await ensureMihomoBinary(null, { offline: true }, root), file);
  assert.equal(await ensureMihomoBinary(file, { offline: true }, root), file);
  fs.writeFileSync(file, 'mutant');
  await assert.rejects(ensureMihomoBinary(null, { offline: true }, root), /hash mismatch/);
});

test('small mixed provider fixture records partition statistics and output hashes independently', t => {
  const root = fixture(t);
  const out = path.join(root, 'out');
  fs.mkdirSync(out);
  fs.writeFileSync(path.join(out, 'fixture.mrs'), Buffer.from([1, 2, 3]));
  fs.writeFileSync(path.join(out, 'fixture-classical.yaml'), 'payload:\n  - DST-PORT,443\n');
  const bytes = Buffer.from('payload:\n  - DOMAIN-SUFFIX,example.com\n  - DST-PORT,443\n');
  const typeCounts = {};
  for (const entry of parsePayloadEntries(bytes.toString())) {
    const type = classifyEntry(entry);
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
  const manifest = { partial: [{ id: 'fixture', source_url: requested, type_counts: typeCounts,
    generated: [{ file: 'fixture.mrs', behavior: 'domain', entries: 1 }],
    residual: { file: 'fixture-classical.yaml', behavior: 'classical', entries: 1 } }] };
  const receipt = provenance.createSourceReceipt({ requestedUrl: requested, effectiveUrl: pinned, bytes });
  const outputReceipts = provenance.collectManifestOutputReceipts({ mrsManifest: manifest, outputDir: out, repoRoot: root });
  const ledger = provenance.buildProviderLedger({ rawGraph: { 'rule-providers': { fixture: { url: requested, format: 'yaml', behavior: 'classical' } } },
    mrsManifest: manifest, receipts: { fixture: receipt }, outputReceipts });
  assert.equal(ledger.stats.pinned_commits, 1);
  assert.deepEqual(ledger.providers[0].conversion.type_counts, { domain: 1, 'DST-PORT': 1 });
  assert.equal(ledger.providers[0].conversion.status, 'partial');
  assert.equal(ledger.stats.output_receipts, 2);
  assert.equal(outputReceipts['fixture.mrs'].content.sha256, provenance.sha256(Buffer.from([1, 2, 3])));
});

test('legacy output receipt is not an original source or a historical pinned commit', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'old.mrs'), 'old asset');
  const manifest = { converted: [{ id: 'old', source_url: requested, generated: [{ file: 'old.mrs', entries: 1 }] }] };
  const outputs = provenance.collectManifestOutputReceipts({ mrsManifest: manifest, outputDir: root, repoRoot: root, inputKind: 'legacy-snapshot' });
  const ledger = provenance.buildProviderLedger({ rawGraph: { 'rule-providers': { old: { url: requested } } }, mrsManifest: manifest, outputReceipts: outputs, mode: 'legacy-snapshot' });
  assert.equal(ledger.providers[0].input_receipt, null);
  assert.equal(ledger.providers[0].provenance_state, 'unknown');
  assert.equal(outputs['old.mrs'].input_kind, 'legacy-snapshot');
  assert.equal(outputs['old.mrs'].source.version_state, 'legacy-output-only');
});

test('ledger covers unread existing binary, failed and unrecorded providers explicitly', () => {
  const rawGraph = { 'rule-providers': { binary: { url: requested, format: 'mrs' }, failed: { url: requested }, absent: { url: requested } } };
  const ledger = provenance.buildProviderLedger({ rawGraph, mrsManifest: { existing_mrs: [{ id: 'binary' }], failed: [{ id: 'failed', error: 'cache miss' }] } });
  assert.equal(ledger.provider_count, 3);
  assert.equal(ledger.stats.unknown_provenance, 3);
  assert.equal(ledger.providers.find(row => row.id === 'failed').conversion.status, 'failed');
  assert.equal(ledger.providers.find(row => row.id === 'binary').conversion.status, 'existing_mrs');
});

test('CLI parses cache and legacy modes without starting a sync on import', () => {
  const options = parseArgs(['--offline', '--keep-cache', '--legacy-snapshot', '--receipt-output', 'receipts.json']);
  assert.equal(options.offline, true);
  assert.equal(options.keepCache, true);
  assert.equal(options.legacySnapshot, true);
  assert.equal(options.receiptOutput, 'receipts.json');
});

test('snapshot maps normalized split assets to raw origins without inflating upstream count', t => {
  const root = fixture(t);
  const outputDir = path.join(root, 'rulesets/generated/mihomo-mrs');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'fixture-domain.mrs'), 'domain binary');
  fs.writeFileSync(path.join(outputDir, 'fixture-ip.mrs'), 'ip binary');
  const rawGraph = { 'rule-providers': { fixture: { url: requested, format: 'yaml' } } };
  const normalizedGraph = { 'rule-providers': {
    'fixture-domain': { url: 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/mihomo-mrs/fixture-domain.mrs', format: 'mrs' },
    'fixture-ip': { url: 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/mihomo-mrs/fixture-ip.mrs', format: 'mrs' },
  } };
  const mrsManifest = { split: [{ id: 'fixture', source_url: requested,
    generated: [{ file: 'fixture-domain.mrs', behavior: 'domain' }, { file: 'fixture-ip.mrs', behavior: 'ipcidr' }] }] };
  const ledger = provenance.buildSnapshotProviderLedger({ rawGraph, normalizedGraph, mrsManifest, repoRoot: root });
  assert.equal(ledger.provider_count, 1);
  assert.equal(ledger.normalized_provider_count, 2);
  assert.deepEqual(ledger.normalized_providers.map(row => row.origin_provider_id), ['fixture', 'fixture']);
  for (const row of ledger.normalized_providers) {
    assert.equal(row.source_requested_url, requested);
    assert.equal(row.identity.repository_url, 'https://github.com/Example/Rules');
    assert.equal(row.conversion.outputs.length, 1);
    assert.equal(row.provenance_state, 'unknown');
  }
});

test('recorded output digests fail on same-size asset mutation', t => {
  const root = fixture(t);
  const file = path.join(root, 'asset.mrs');
  fs.writeFileSync(file, 'old');
  const outputReceipt = provenance.createSourceReceipt({ bytes: Buffer.from('old'), localPath: file, repoRoot: root, inputKind: 'generated-output' });
  fs.writeFileSync(file, 'new');
  assert.throws(() => provenance.collectManifestOutputReceipts({ repoRoot: root, outputDir: root,
    mrsManifest: { converted: [{ id: 'one', generated: [{ file: 'asset.mrs', output_receipt: outputReceipt }] }] } }), /hash\/identity mismatch/);
});

test('license declaration commit stays separate from opaque service payload version', () => {
  const url = 'https://anti-ad.net/anti-ad-clash.yaml';
  const receipt = provenance.createSourceReceipt({ requestedUrl: url, effectiveUrl: url, bytes: Buffer.from('payload') });
  assert.equal(receipt.source.license.spdx, 'MIT');
  assert.equal(receipt.source.license.scope, 'repository');
  assert.equal(receipt.source.license.data_license_status, 'component-review-required');
  assert.equal(receipt.source.license.declaration_commit, '735f818950a22f817b2b2a14d229c742d1448b45');
  assert.equal(receipt.source.resolved_commit, null);
  assert.equal(receipt.source.version_state, 'content-addressed');
});

test('local text acquisition consumes LF bytes and yields identical receipts across checkout endings', async t => {
  const root = fixture(t);
  const file = path.join(root, 'supplemental.list');
  const lf = Buffer.from('DOMAIN-SUFFIX,example.com\nDOMAIN,service.example.com\n');
  const crlf = Buffer.from(lf.toString().replace(/\n/g, '\r\n'));
  const options = { requestedUrl: requested, localPath: file, repoRoot: root, offline: true };
  fs.writeFileSync(file, crlf);
  const windows = await provenance.acquireSource(options);
  fs.writeFileSync(file, lf);
  const linux = await provenance.acquireSource(options);
  assert.deepEqual(windows.bytes, lf);
  assert.deepEqual(windows.receipt, linux.receipt);
  assert.equal(windows.receipt.content_normalization, 'LF');
  assert.equal(windows.receipt.content.bytes, lf.length);
  assert.equal(provenance.assertReceiptMatches(windows.receipt, crlf), true);
  assert.equal(provenance.assertReceiptMatches(windows.receipt, lf), true);
  assert.throws(() => provenance.assertReceiptMatches(windows.receipt, Buffer.from('DOMAIN-SUFFIX,mutated.com\n')), /hash\/identity mismatch/);
});

test('legacy and generated YAML receipts normalize LF while binary assets remain exact', async t => {
  const root = fixture(t);
  const file = path.join(root, 'residual.yaml');
  const lf = Buffer.from('payload:\n  - DOMAIN-SUFFIX,example.com\n');
  const crlf = Buffer.from(lf.toString().replace(/\n/g, '\r\n'));
  const manifest = { partial: [{ id: 'one', residual: { file: 'residual.yaml' } }] };
  for (const inputKind of ['legacy-snapshot', 'generated-output']) {
    fs.writeFileSync(file, crlf);
    const windows = provenance.collectManifestOutputReceipts({ mrsManifest: manifest, outputDir: root, repoRoot: root, inputKind });
    fs.writeFileSync(file, lf);
    const linux = provenance.collectManifestOutputReceipts({ mrsManifest: manifest, outputDir: root, repoRoot: root, inputKind });
    assert.deepEqual(windows, linux);
    assert.equal(windows['residual.yaml'].content_normalization, 'LF');
    assert.equal(windows['residual.yaml'].content.sha256, provenance.sha256(lf));
    assert.equal(provenance.assertReceiptMatches(windows['residual.yaml'], crlf), true);
  }
  for (const extension of ['mrs', 'srs', 'bin']) {
    const binary = path.join(root, `binary.${extension}`);
    fs.writeFileSync(binary, crlf);
    const consumed = await provenance.acquireSource({ requestedUrl: requested, localPath: binary, repoRoot: root, offline: true });
    assert.deepEqual(consumed.bytes, crlf);
    assert.equal(consumed.receipt.content_normalization, 'raw-bytes');
    assert.equal(consumed.receipt.content.sha256, provenance.sha256(crlf));
    assert.throws(() => provenance.assertReceiptMatches(consumed.receipt, lf), /hash\/identity mismatch/);
    assert.throws(() => provenance.assertReceiptMatches({ ...consumed.receipt, content_normalization: 'LF' }, crlf), /normalization is invalid/);
  }
});

test('remote CRLF cache remains byte-strict and cannot opt into local LF normalization', async t => {
  const root = fixture(t);
  const crlf = Buffer.from('payload:\r\n  - DOMAIN-SUFFIX,example.com\r\n');
  const lf = Buffer.from(crlf.toString().replace(/\r\n/g, '\n'));
  const options = { requestedUrl: requested, cacheDir: root, keepCache: true,
    fetchSource: async () => ({ bytes: crlf, effectiveUrl: requested }) };
  const online = await provenance.acquireSource(options);
  assert.deepEqual(online.bytes, crlf);
  assert.equal(online.receipt.content_normalization, 'raw-bytes');
  assert.equal(online.receipt.content.sha256, provenance.sha256(crlf));
  const replay = await provenance.acquireSource({ ...options, offline: true });
  assert.deepEqual(replay.bytes, crlf);
  const files = provenance.cachePaths(root, requested);
  fs.writeFileSync(files.bytes, lf);
  await assert.rejects(provenance.acquireSource({ ...options, offline: true }), /hash\/identity mismatch/);
  assert.throws(() => provenance.assertReceiptMatches({ ...online.receipt, content_normalization: 'LF' }, crlf), /normalization is invalid/);
  const legacyRaw = { ...online.receipt };
  delete legacyRaw.content_normalization;
  assert.equal(provenance.assertReceiptMatches(legacyRaw, crlf), true);
  assert.throws(() => provenance.assertReceiptMatches(legacyRaw, lf), /hash\/identity mismatch/);
});
