'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { acquireSource, cachePaths, createSourceReceipt } = require('../lib/source-provenance');
const { createFusedSourceLoader } = require('../lib/fused-source-provenance');
const { readMihomoMrsSourceMap, sourceInfoForProvider } = require('../build-fused-rule-sets');

const requestedUrl = 'https://raw.githubusercontent.com/example/rules/main/a.yaml';
const effectiveUrl = `https://raw.githubusercontent.com/example/rules/${'a'.repeat(40)}/a.yaml`;
const bytes = Buffer.from('payload:\n  - example.com\n');
function fixture(t, fetchSource) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-source-binding-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const cacheDir = path.join(root, 'fused');
  const mrsCacheDir = path.join(root, 'mrs');
  return { root, cacheDir, mrsCacheDir,
    make: offline => createFusedSourceLoader({ repoRoot: root, cacheDir, mrsCacheDir, offline, fetchSource }) };
}

test('fused replay uses the exact MRS input without contacting the floating upstream', async t => {
  let contacted = false;
  const f = fixture(t, async () => { contacted = true; throw new Error('unexpected transport'); });
  const acquired = await acquireSource({ requestedUrl, cacheDir: f.mrsCacheDir, keepCache: true,
    fetchSource: async () => ({ bytes, effectiveUrl }) });
  const result = await f.make(false).load({ sourceUrl: requestedUrl, expectedReceipt: acquired.receipt });
  assert.equal(result.text, bytes.toString());
  assert.equal(contacted, false);
  assert.equal(result.receipt.source.resolved_commit, 'a'.repeat(40));
});

test('same-length MRS cache corruption is rejected before a fused output can be built', async t => {
  const f = fixture(t, async () => { throw new Error('unexpected transport'); });
  const acquired = await acquireSource({ requestedUrl, cacheDir: f.mrsCacheDir, keepCache: true,
    fetchSource: async () => ({ bytes, effectiveUrl }) });
  fs.writeFileSync(cachePaths(f.mrsCacheDir, requestedUrl).bytes, Buffer.from(bytes.toString().replace('example', 'changed')));
  await assert.rejects(f.make(false).load({ sourceUrl: requestedUrl, expectedReceipt: acquired.receipt }), /hash\/identity mismatch/);
});

test('a missing cache is downloaded by pinned URL and a different input is rejected', async t => {
  const calls = [];
  const f = fixture(t, async url => { calls.push(url); return { bytes: Buffer.from('different'), effectiveUrl: url }; });
  const expectedReceipt = createSourceReceipt({ requestedUrl, effectiveUrl, bytes });
  await assert.rejects(f.make(false).load({ sourceUrl: requestedUrl, expectedReceipt }), /hash\/identity mismatch/);
  assert.deepEqual(calls, [effectiveUrl]);
});

test('offline misses never invoke a release or source transport', async t => {
  let contacted = false;
  const f = fixture(t, async () => { contacted = true; return { bytes, effectiveUrl }; });
  await assert.rejects(f.make(true).load({ sourceUrl: requestedUrl }), /offline source cache miss/);
  assert.equal(contacted, false);
});

test('local residual output changes cannot pass the MRS output receipt binding', async t => {
  const f = fixture(t, async () => { throw new Error('unexpected transport'); });
  const file = path.join(f.root, 'residual.yaml');
  fs.writeFileSync(file, bytes);
  const expectedReceipt = createSourceReceipt({ localPath: file, repoRoot: f.root, bytes, inputKind: 'generated-output' });
  fs.writeFileSync(file, 'different residual');
  await assert.rejects(f.make(false).load({ localPath: file, expectedReceipt }), /hash\/identity mismatch/);
});

test('compiler source selection retains residual receipts ahead of generic local URL resolution', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const localPath = 'rulesets/generated/mihomo-mrs/acc-microsoftapps-classical.yaml';
  const expectedReceipt = createSourceReceipt({ localPath, repoRoot, bytes: fs.readFileSync(path.join(repoRoot, localPath)), inputKind: 'generated-output' });
  const sourceMap = readMihomoMrsSourceMap({ partial: [{ id: 'example', generated: [],
    residual: { file: 'acc-microsoftapps-classical.yaml', output_receipt: expectedReceipt } }] });
  const source = sourceInfoForProvider({ url: 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/' + localPath, behavior: 'classical' }, sourceMap);
  assert.equal(source.expectedReceipt, expectedReceipt);
  assert.equal(source.localPath, path.join(repoRoot, localPath));
});

test('compiler uses the recorded local supplemental input for generated MRS rather than downloading main', async t => {
  const localPath = 'rulesets/supplemental/clash/adfp-direct.list';
  const repoRoot = path.resolve(__dirname, '../..');
  const actualBytes = fs.readFileSync(path.join(repoRoot, localPath));
  const sourceUrl = 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/' + localPath;
  const expectedReceipt = createSourceReceipt({ requestedUrl: sourceUrl, localPath, repoRoot, bytes: actualBytes, acquisition: 'local-file' });
  const sourceMap = readMihomoMrsSourceMap({ converted: [{ id: 'example', source_url: sourceUrl, source_receipt: expectedReceipt,
    generated: [{ file: 'example-domain.mrs', behavior: 'domain' }] }] });
  const source = sourceInfoForProvider({ url: 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/mihomo-mrs/example-domain.mrs', behavior: 'domain' }, sourceMap);
  assert.equal(source.localPath, path.join(repoRoot, localPath));
  let contacted = false;
  const f = fixture(t, async () => { contacted = true; throw new Error('unexpected transport'); });
  const loader = createFusedSourceLoader({ repoRoot, cacheDir: f.cacheDir, mrsCacheDir: f.mrsCacheDir, fetchSource: async () => { contacted = true; throw new Error('unexpected transport'); } });
  const result = await loader.load(source);
  assert.equal(contacted, false);
  assert.equal(result.receipt.local_path, localPath);
  assert.equal(result.receipt.content.sha256, expectedReceipt.content.sha256);
});
