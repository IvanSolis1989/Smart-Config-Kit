#!/usr/bin/env node
'use strict';

// Claude dependency validator Version 1.0.0. Read-only, including --check.
const fs = require('node:fs');
const path = require('node:path');
const { loadRepository } = require('./lib/ordered-rule-semantics');
const { VERSION, INVENTORY_PATH, REPORT_PATH, buildReport, checkReport, serialize } = require('./lib/claude-service-dependencies');

function main(args = process.argv.slice(2)) {
  if (args.some((arg) => !['--check', '--json', '--strict-coverage', '--help'].includes(arg))) throw new Error('usage: node tools/validate-claude-service-dependencies.js [--check] [--json] [--strict-coverage]');
  if (args.includes('--help')) { console.log(`Claude dependency validator ${VERSION}: --check reads ${REPORT_PATH}; --json emits the deterministic report; --strict-coverage rejects known domain policy gaps/unknowns, without proving live service health. No writes or network calls.`); return 0; }
  const root = path.resolve(__dirname, '..');
  const inventory = JSON.parse(fs.readFileSync(path.join(root, INVENTORY_PATH), 'utf8'));
  const report = buildReport(inventory, loadRepository({ root }));
  if (args.includes('--json')) process.stdout.write(serialize(report));
  else console.log(`Claude dependencies ${VERSION}: ${JSON.stringify(report.summary)}; semantic_identity=${report.semantic_identity}`);
  if (args.includes('--check')) {
    const savedPath = path.join(root, REPORT_PATH);
    const saved = fs.existsSync(savedPath) ? JSON.parse(fs.readFileSync(savedPath, 'utf8')) : null;
    const result = checkReport(report, saved);
    if (!result.ok) throw new Error(result.reason);
    if (!args.includes('--json')) console.log(result.reason);
  }
  if (args.includes('--strict-coverage') && !report.coverage.ok) throw new Error(`domain projection coverage has ${report.summary.policy_gap_count} policy gaps and ${report.summary.enforced_domain_projection_unknown_count} required/conditional unknowns; live service health is untested`);
  // This inventory audits gaps; route modifications need separate review. Optional blocks
  // and full-static unknowns remain visible without masquerading as service failures.
  return 0;
}
if (require.main === module) {
  try { process.exitCode = main(); } catch (error) { console.error(`Claude dependency validation failed: ${error.message}`); process.exitCode = 1; }
}
module.exports = { main };
