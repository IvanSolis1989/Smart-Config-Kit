#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createHash } = require('node:crypto');
const { ASSET_DIR, MANIFEST_PATH, buildAssetOutputs, readAssetManifest, safeFile } = require('./lib/aerove-rule-assets');
const ROOT = path.resolve(__dirname, '..');

function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--check')) throw new Error('Usage: node tools/generate-aerove-rule-assets.js [--check] (MIHOMO_BIN=v1.19.32)');
  const providers = require('./generate-meow').readSharedRouting().providers;
  const fusedManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'rulesets/generated/fused/manifest.json'), 'utf8'));
  const mihomoBin = process.env.AEROVE_MIHOMO_BIN || process.env.MIHOMO_BIN || path.join(ROOT, '.cache/mihomo-mrs', `mihomo-v1.19.32${process.platform === 'win32' ? '.exe' : ''}`);
  const { outputs, manifest } = buildAssetOutputs({ repoRoot: ROOT, providers, fusedManifest, mihomoBin });
  const oldPath = safeFile(ROOT, MANIFEST_PATH);
  let old;
  if (fs.existsSync(oldPath)) old = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
  if (old && (old.schema_version !== 1 || !Array.isArray(old.assets))) throw new Error('Invalid prior AEROVE asset ownership manifest');
  const obsolete = (old?.assets || []).map(row => row.path).filter(file => !Object.hasOwn(outputs, file));
  for (const file of obsolete) {
    if (!file.startsWith(`${ASSET_DIR}/`) || !/^[-a-zA-Z0-9._]+\.mrs$/.test(file.slice(ASSET_DIR.length + 1))) throw new Error(`Unsafe obsolete asset: ${file}`);
    safeFile(ROOT, file);
    const previous = old.assets.find(row => row.path === file);
    const target = safeFile(ROOT, file);
    if (fs.existsSync(target) && createHash('sha256').update(fs.readFileSync(target)).digest('hex') !== previous.sha256) {
      throw new Error(`Preserve modified obsolete asset; resolve explicitly: ${file}`);
    }
  }
  const directory = safeFile(ROOT, ASSET_DIR);
  if (fs.existsSync(directory)) {
    const owned = new Set(['manifest.json', ...(old?.assets || []).map(row => path.basename(row.path)), ...Object.keys(outputs).map(file => path.basename(file))]);
    for (const entry of fs.readdirSync(directory)) if (!owned.has(entry)) throw new Error(`Unowned AEROVE asset blocks generation: ${entry}`);
  }
  const differences = Object.entries(outputs).filter(([file, content]) => {
    const target = safeFile(ROOT, file);
    if (!fs.existsSync(target)) return true;
    return typeof content === 'string'
      ? fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== content.replace(/\r\n/g, '\n')
      : !fs.readFileSync(target).equals(content);
  });
  if (args.includes('--check')) {
    if (differences.length || obsolete.length) throw new Error(`AEROVE asset drift: ${[...differences.map(([file]) => file), ...obsolete].join(', ')}`);
  } else {
    // Manifest is last: it is the ownership and completion marker for all shards.
    for (const [file, content] of differences) {
      const target = safeFile(ROOT, file); fs.mkdirSync(path.dirname(target), { recursive: true });
      const temporary = `${target}.${randomUUID()}.tmp`;
      try { fs.writeFileSync(temporary, content, { flag: 'wx' }); fs.renameSync(temporary, target); }
      finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
    }
    for (const file of obsolete) if (fs.existsSync(safeFile(ROOT, file))) fs.unlinkSync(safeFile(ROOT, file));
  }
  readAssetManifest({ repoRoot: ROOT, providers, fusedManifest });
  console.log(`AEROVE resource assets ${args.includes('--check') ? 'check OK' : 'generated/read back'}: ${manifest.sources.length} sources; ${Object.keys(manifest.splits).length} split sources; ${manifest.assets.length} shards; native exact predicate union verified`);
}
module.exports = { main };
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
