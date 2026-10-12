#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { loadRepository, compareRepositories, checkReport } = require('./lib/ordered-rule-semantics');

function main(argv = process.argv.slice(2)) {
  const options = { currentRoot: path.resolve(__dirname, '..'), mode: 'domain-projection', maxProbes: 1000, maxEvidence: 1000 };
  const names = { '--current-root': 'currentRoot', '--baseline-root': 'baselineRoot', '--baseline-ref': 'baselineRef', '--mode': 'mode', '--max-probes': 'maxProbes', '--max-evidence': 'maxEvidence', '--probes': 'probesFile', '--expected-changes': 'expectedFile', '--output': 'output', '--chronology': 'chronology' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help') {
      process.stdout.write('Usage: node tools/validate-ordered-rule-semantics.js (--baseline-root DIR | --baseline-ref REF) [--current-root DIR] [--mode domain-projection|full] [--chronology final|manifest] [--max-probes N] [--max-evidence N] [--probes JSON] [--expected-changes JSON] [--check] [--output PATH]\nDefault: read-only JSON on stdout. --output writes only the specified report. Probes JSON is an array of host strings or connection objects. Approvals bind beforeIdentity, afterIdentity, reviewedChangeDigest. Limited evidence additionally requires reviewedEvidenceDigest and acknowledgedUndecidableDigest / acknowledgeTruncation as applicable; unknowns are never implicitly approved.\n');
      return 0;
    }
    if (arg === '--check') { options.check = true; continue; }
    if (!names[arg] || argv[index + 1] === undefined || argv[index + 1].startsWith('--')) throw new Error(`unknown or incomplete argument: ${arg}`);
    options[names[arg]] = argv[++index];
  }
  if (Boolean(options.baselineRoot) === Boolean(options.baselineRef)) throw new Error('exactly one of --baseline-root or --baseline-ref is required');
  if (!['domain-projection', 'full'].includes(options.mode)) throw new Error('mode must be domain-projection or full');
  if (options.chronology && !['final', 'manifest'].includes(options.chronology)) throw new Error('chronology must be final or manifest');
  const before = loadRepository({ root: options.baselineRoot || options.currentRoot, ref: options.baselineRef, chronology: options.chronology });
  const after = loadRepository({ root: options.currentRoot, chronology: options.chronology });
  const probes = options.probesFile ? JSON.parse(fs.readFileSync(path.resolve(options.probesFile), 'utf8')) : [];
  if (!Array.isArray(probes) || probes.some((probe) => typeof probe !== 'string' && (!probe || typeof probe !== 'object' || Array.isArray(probe)))) throw new Error('probes must be an array of strings or connection objects');
  const report = compareRepositories(before, after, { mode: options.mode, maxProbes: Number(options.maxProbes), maxEvidence: Number(options.maxEvidence), probes });
  report.check = checkReport(report, options.expectedFile ? JSON.parse(fs.readFileSync(path.resolve(options.expectedFile), 'utf8')) : undefined);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) fs.writeFileSync(path.resolve(options.output), json);
  else process.stdout.write(json);
  return options.check && !report.check.ok ? 1 : 0;
}

if (require.main === module) {
  try { process.exitCode = main(); } catch (error) { process.stderr.write(`ordered rule semantics: ${error.message}\n`); process.exitCode = 2; }
}
module.exports = { main };
