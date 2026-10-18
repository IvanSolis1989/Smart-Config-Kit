import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { referencedFiles } from './package.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const cli = path.join(here, 'package.mjs');
const ref = 'HEAD';
const temp = await mkdtemp(path.join(os.tmpdir(), 'substore-package-'));
const out = path.join(temp, 'extension');

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: repo, encoding: 'utf8' });
}

const expectedManifestResult = spawnSync('git', ['show', `${ref}:SubStore/edge-extension/manifest.json`], { cwd: repo, encoding: 'utf8' });
assert.equal(expectedManifestResult.status, 0, expectedManifestResult.stderr);
const expectedManifest = JSON.parse(expectedManifestResult.stdout);

const offscreenSource = `async function ensureLocalBridge(api) {
  await api.offscreen.createDocument({ url: 'offscreen.html', reasons: ['IFRAME_SCRIPTING'], justification: 'bridge' });
}`;
assert.deepEqual(referencedFiles('background.js', Buffer.from(offscreenSource)), ['offscreen.html']);
assert.deepEqual(
  referencedFiles('offscreen.html', Buffer.from('<!doctype html><script type="module" src="offscreen.js"></script>')),
  ['offscreen.js'],
);
assert.throws(
  () => referencedFiles('local-fetch.mjs', Buffer.from("api.offscreen.createDocument({ url: '../../private.json' });")),
  /Path escapes extension root/,
);
const sourceUsesOffscreen = expectedManifest.permissions?.includes('offscreen') === true;

try {
  const packed = run(['--out', out]);
  assert.equal(packed.status, 0, packed.stderr || packed.stdout);
  const names = (await readdir(out)).sort();
  const manifest = JSON.parse(await readFile(path.join(out, 'manifest.json'), 'utf8'));
  assert.equal(manifest.name, expectedManifest.name);
  assert.equal(manifest.version, expectedManifest.version);
  assert(names.includes('page-main.bundle.js'));
  assert(names.includes('page-bridge.bundle.js'));
  assert(names.includes('background.js'));
  assert(names.includes('core.mjs'));
  assert(names.includes('popup.html'));
  assert(names.includes('popup.js'));
  assert(names.includes('popup.css'));
  if (sourceUsesOffscreen) {
    assert(names.includes('offscreen.html'));
    assert(names.includes('offscreen.js'));
  } else {
    assert(!names.includes('offscreen.html'));
    assert(!names.includes('offscreen.js'));
  }
  const snapshotImported = (await Promise.all(names.filter(name => /\.(?:m?js)$/.test(name)).map(async name => {
    const source = await readFile(path.join(out, name), 'utf8');
    return /\b(?:from\s*|import\s*\()(['"])\.\/source-snapshot\.mjs\1/.test(source);
  }))).some(Boolean);
  assert.equal(names.includes('source-snapshot.mjs'), snapshotImported, 'source-snapshot.mjs must be packaged exactly when a runtime module imports it');
  assert(!names.some((name) => /(?:\.test\.|secret|\.env)/i.test(name)));
  assert(!names.includes('package.test.mjs'));
  assert(!names.includes('build.mjs'));

  const before = await Promise.all(names.map(async (name) => [name, (await stat(path.join(out, name))).size, await readFile(path.join(out, name))]));
  const checked = run(['--out', out, '--check']);
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);
  const afterNames = (await readdir(out)).sort();
  assert.deepEqual(afterNames, names);
  for (const [name, size, bytes] of before) {
    assert.equal((await stat(path.join(out, name))).size, size);
    assert.deepEqual(await readFile(path.join(out, name)), bytes);
  }

  const foreign = path.join(temp, 'foreign');
  await mkdir(foreign);
  await writeFile(path.join(foreign, 'manifest.json'), JSON.stringify({ name: 'Other extension', version: '1' }));
  const sentinel = Buffer.from('preserve foreign install');
  await writeFile(path.join(foreign, 'keep.txt'), sentinel);
  const refused = run(['--out', foreign]);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /different extension/);
  assert.deepEqual(await readFile(path.join(foreign, 'keep.txt')), sentinel);
} finally {
  await rm(temp, { recursive: true, force: true });
}

console.log('package CLI artifact contract passed');
