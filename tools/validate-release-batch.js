#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { VERSION, createReleaseBatch, checkReleaseBatch, writeExternalJson } = require('./lib/release-batch');

function main(argv) {
  const options = { repoRoot: path.resolve(__dirname, '..') }; let check = false; let output; let receiptFile;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') { check = true; continue; }
    if (arg === '--help') { console.log(`Release batch v${VERSION}: [--repo-root DIR] [--baseline-ref HEAD] [--output ABSOLUTE_EXTERNAL_JSON]\nPost-stage: --check --receipt JSON [--mode staged|committed] [--baseline-ref REF]`); return; }
    const keys = { '--repo-root': 'repoRoot', '--baseline-ref': 'baselineRef', '--mode': 'mode' };
    if (keys[arg]) { if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Missing value: ${arg}`); options[keys[arg]] = argv[++i]; }
    else if (arg === '--output' || arg === '--receipt') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Missing value: ${arg}`);
      if (arg === '--output') output = argv[++i]; else receiptFile = argv[++i];
    } else throw new Error(`Unknown option: ${arg}`);
  }
  if (check !== Boolean(receiptFile)) throw new Error('--check requires --receipt; --receipt requires --check');
  if (!check && options.mode) throw new Error('--mode is only valid with --check');
  options.repoRoot = path.resolve(options.repoRoot);
  const result = check ? checkReleaseBatch({ ...options, receipt: JSON.parse(fs.readFileSync(receiptFile, 'utf8')) }) : createReleaseBatch(options);
  if (output) writeExternalJson(options.repoRoot, output, result);
  console.log(JSON.stringify(output ? { ok: true, output, changedPaths: result.changedPaths, coverageSha256: result.coverageSha256 } : result, null, 2));
}
if (require.main === module) { try { main(process.argv.slice(2)); } catch (error) { console.error(`Release batch rejected: ${error.message}`); process.exitCode = 1; } }
module.exports = { main };
