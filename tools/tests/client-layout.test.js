'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { clientDirectory, clientIdForPath, historicalClientPaths, readHistoricalClientFile } = require('../lib/client-layout');

test('client identity remains distinct inside a shared kernel family', () => {
  for (const id of ['Surge', 'Stash', 'Passwall', 'Passwall2', 'Karing']) {
    const directory = clientDirectory(id);
    assert.equal(clientIdForPath(`${directory}/profile.conf`), id);
    assert.equal(clientIdForPath(directory.split('/')[0] + '/unknown/profile.conf'), null);
    assert.deepEqual(historicalClientPaths(`${directory}/profile.conf`), [`${directory}/profile.conf`, `${id}/profile.conf`]);
  }
  assert.throws(() => clientDirectory('unknown'), /Unknown client/);
  assert.equal(clientIdForPath('../Surge/Surge.conf'), null);
  assert.deepEqual(historicalClientPaths('rulesets/generated/fused/manifest.json'), ['rulesets/generated/fused/manifest.json']);
});

test('historical reads use only exact mapped paths in the requested revision', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-layout-history-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, windowsHide: true });
  git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  fs.mkdirSync(path.join(root, 'Surge'));
  fs.writeFileSync(path.join(root, 'Surge/profile.conf'), 'legacy');
  git('add', '.'); git('commit', '-qm', 'legacy');
  const current = `${clientDirectory('Surge')}/profile.conf`;
  assert.equal(readHistoricalClientFile(root, 'HEAD', current).toString(), 'legacy');
  fs.mkdirSync(path.dirname(path.join(root, current)), { recursive: true });
  fs.writeFileSync(path.join(root, current), 'current');
  git('add', '.'); git('commit', '-qm', 'current');
  assert.equal(readHistoricalClientFile(root, 'HEAD', current).toString(), 'current');
  assert.equal(readHistoricalClientFile(root, 'HEAD~1', current).toString(), 'legacy');
  assert.throws(() => readHistoricalClientFile(root, 'HEAD', `${clientDirectory('Stash')}/profile.conf`), /no exact/);
  assert.throws(() => readHistoricalClientFile(root, 'HEAD', '../Surge/profile.conf'), /Unsafe/);
});
