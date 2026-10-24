'use strict';

const { families } = require('../client-layout.json');
const { spawnSync } = require('node:child_process');
const directories = new Map(families.flatMap(family => family.clients.map(id => [id, `${family.directory}/${id}`])));

function clientDirectory(id) {
  if (!directories.has(id)) throw new Error(`Unknown client: ${id}`);
  return directories.get(id);
}

function clientIdForPath(relative) {
  for (const [id, directory] of directories) {
    if (relative.startsWith(`${directory}/`)) return id;
  }
  return null;
}

// Only the explicit client relocation is reversible. Never search arbitrary
// basenames or a different ref when reading immutable historical evidence.
function historicalClientPaths(relative) {
  const id = clientIdForPath(relative);
  return id ? [relative, `${id}/${relative.slice(clientDirectory(id).length + 1)}`] : [relative];
}

function readHistoricalClientFile(root, ref, relative) {
  if (typeof relative !== 'string' || relative.startsWith('/') || /[\\:\x00-\x1f]/.test(relative)
    || relative.split('/').some(part => !part || part === '.' || part === '..')) throw new Error(`Unsafe historical path: ${relative}`);
  for (const candidate of historicalClientPaths(relative)) {
    const exists = spawnSync('git', ['cat-file', '-e', `${ref}:${candidate}`], { cwd: root, windowsHide: true });
    if (exists.error) throw exists.error;
    if (exists.status !== 0) continue;
    const result = spawnSync('git', ['show', `${ref}:${candidate}`], { cwd: root, windowsHide: true, maxBuffer: 256 * 1024 * 1024 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`git show ${ref}:${candidate} failed: ${result.stderr}`);
    return result.stdout;
  }
  throw new Error(`git show ${ref}:${relative} failed: no exact current or legacy client path in this revision`);
}

module.exports = { clientDirectory, clientIdForPath, historicalClientPaths, readHistoricalClientFile };
