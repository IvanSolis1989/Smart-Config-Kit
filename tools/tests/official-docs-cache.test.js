'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { acquire, verifyRecord, snapshot, verify, inside } = require('../cache-official-docs');

function fixture(t, overrides = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-docs-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const source = { id: 'manual', product: 'Example', kind: 'documentation', url: 'https://docs.example.com/manual', required: true, expected_content_type: 'text', ...overrides };
  fs.writeFileSync(path.join(directory, 'sources.json'), JSON.stringify({ group: 'example', sources: [source] }));
  return { directory, source };
}

test('exact downloaded bytes survive gzip and independent verification; tampering fails', async t => {
  const { directory, source } = fixture(t);
  const original = Buffer.from('原始文档\r\nexact bytes\n');
  const record = await acquire(directory, source, async () => new Response(original, { headers: { 'content-type': 'text/plain' } }));
  assert.equal(record.status, 'ok');
  assert.deepEqual(verifyRecord(directory, source, record), original);
  fs.appendFileSync(path.join(directory, record.file), 'tampered');
  assert.throws(() => verifyRecord(directory, source, record), /hash mismatch/);
});

test('HTTP failure and HTML challenge cannot become a successful JSON cache', async t => {
  const { directory, source } = fixture(t, { expected_content_type: 'json' });
  const denied = await acquire(directory, source, async () => new Response('denied', { status: 403 }));
  assert.equal(denied.status, 'failed');
  assert.equal(denied.receipt, undefined);
  const challenge = await acquire(directory, source, async () => new Response('<html><title>Just a moment</title></html>'));
  assert.equal(challenge.status, 'failed');
});

test('incremental snapshots reuse verified evidence without inventing a new fetch time', async t => {
  const { directory } = fixture(t);
  let calls = 0;
  const fetchImpl = async () => { calls++; return new Response('manual'); };
  const first = await snapshot(directory, { fetchImpl });
  const second = await snapshot(directory, { fetchImpl });
  assert.equal(calls, 1);
  assert.equal(first.sources[0].fetched_at, second.sources[0].fetched_at);
  assert.equal(verify(directory).verified, 1);
  const inventoryPath = path.join(directory, 'sources.json');
  const inventory = fs.readFileSync(inventoryPath, 'utf8');
  fs.writeFileSync(inventoryPath, inventory.replace(/\r?\n/g, '\n') + '\n');
  await snapshot(directory, { fetchImpl });
  fs.writeFileSync(inventoryPath, fs.readFileSync(inventoryPath, 'utf8').replace(/\r?\n/g, '\r\n'));
  assert.equal(verify(directory).verified, 1, 'Git LF/CRLF conversion preserves the inventory identity');
  const config = JSON.parse(fs.readFileSync(path.join(directory, 'sources.json')));
  config.sources[0].url = 'https://docs.example.com/changed';
  fs.writeFileSync(path.join(directory, 'sources.json'), JSON.stringify(config));
  assert.throws(() => verify(directory), /Inventory\/manifest mismatch/);
});

test('raw GitHub branch content is fetched from a resolved commit URL', async t => {
  const { directory, source } = fixture(t, { url: 'https://raw.githubusercontent.com/example/project/main/docs.md' });
  const commit = 'a'.repeat(40);
  const urls = [];
  const record = await acquire(directory, source, async url => {
    urls.push(url);
    return new Response(url.includes('api.github.com') ? JSON.stringify({ sha: commit }) : 'pinned manual');
  });
  assert.equal(record.status, 'ok');
  assert.equal(urls[1], `https://raw.githubusercontent.com/example/project/${commit}/docs.md`);
  assert.equal(record.receipt.source.resolved_commit, commit);
  assert.throws(() => inside(directory, '../escape'), /outside/);
  assert.throws(() => verifyRecord(directory, source, { ...record, file: '../escape' }), /Invalid body path/);
});
