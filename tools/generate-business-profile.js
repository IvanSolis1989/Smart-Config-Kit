#!/usr/bin/env node
'use strict';

const os = require('node:os');
const { getBusinessProfileCatalog, generateBusinessProfile } = require('./lib/business-profiles');

function parseArguments(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--dry-run') { if (options.dryRun) throw new Error('Duplicate --dry-run'); options.dryRun = true; continue; }
    const key = { '--profile': 'profile', '--enable': 'enable', '--output-dir': 'outputDir' }[flag];
    if (!key || options[key] !== undefined || args[i + 1] === undefined || args[i + 1].startsWith('--')) throw new Error(`Unknown, duplicate or incomplete argument: ${flag}`);
    options[key] = args[++i];
  }
  return options;
}

function main(args = process.argv.slice(2)) {
  // Batch generation is intentionally a background workload on Windows.
  if (process.platform === 'win32') { try { os.setPriority(0, os.constants.priority.PRIORITY_LOW); } catch {} }
  if (args.length === 1 && args[0] === '--list') { console.log(JSON.stringify(getBusinessProfileCatalog(), null, 2)); return; }
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('node tools/generate-business-profile.js --profile full|lite|custom [--enable ai,youtube] --output-dir <new-directory> [--dry-run]\nnode tools/generate-business-profile.js --list\nThe output parent must already exist. Existing output directories are never overwritten. full/default copies every formal entry byte-for-byte. Other profiles retain safety, DNS and node behavior; disabled services fall through subsequent base rules.'); return;
  }
  const result = generateBusinessProfile(parseArguments(args));
  console.log(JSON.stringify({ outputDir: result.outputDir, dryRun: result.dryRun, profile: result.manifest.profile,
    artifacts: result.manifest.artifacts.length, disabled_services: result.manifest.disabled_services,
    manifest: result.manifestPath || null }, null, 2));
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`Business profile generation failed: ${error.message}`); process.exitCode = 1; }
}
module.exports = { parseArguments, main };
