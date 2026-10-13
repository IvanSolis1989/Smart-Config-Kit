#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { loadPlan, renderPlan, writePlan, RECEIPT } = require('./lib/snapshot-supplemental-patch');

function parseArgs(argv) {
  const options = { root: path.resolve(__dirname, '..'), adds: [], removes: [], write: false };
  const keys = { '--baseline-ref': 'baselineRef', '--provider': 'provider', '--local-source': 'localSource',
    '--mihomo-bin': 'mihomoBin', '--sing-box-bin': 'singBoxBin' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--write') options.write = true;
    else if (arg === '--dry-run') options.write = false;
    else if (arg === '--add' || arg === '--remove' || keys[arg]) {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      if (arg === '--add') options.adds.push(value);
      else if (arg === '--remove') options.removes.push(value);
      else options[keys[arg]] = value;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  for (const key of ['baselineRef', 'provider', 'localSource']) if (!options[key]) throw new Error(`${key} is required`);
  return options;
}
function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const plan = loadPlan(options);
  const textOutputs = renderPlan(plan);
  if (options.write) {
    const saved = writePlan(plan, options);
    console.log(JSON.stringify({ mode: 'partial-sync', saved_files: saved.files, receipt: RECEIPT, changed_segments: plan.changes }, null, 2));
  } else {
    console.log(JSON.stringify({ mode: 'dry-run', baseline_commit: plan.baselineRef, changed_segments: plan.changes,
      planned_text_files: [...textOutputs.keys()], binary_conversion: 'deferred until explicit --write; no downloads',
      source_receipt: plan.sourceReceipt, untouched_original_inputs: plan.receipt.untouched_original_inputs }, null, 2));
  }
}
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
}
module.exports = { parseArgs, main };
