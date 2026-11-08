#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { auditRegistration } = require('./lib/karing-registration');
// Read-only. Never edit a live Karing data directory or import internal state.
if (process.argv.length !== 4) {
  console.error('Usage: node tools/audit-karing-registration.js <custom-rules.json> <internal-diversion-config-copy.json>');
  process.exitCode = 2;
} else {
  try {
    const report = auditRegistration(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')),
      JSON.parse(fs.readFileSync(process.argv[3], 'utf8')));
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.registration_complete ? 0 : 1;
  } catch {
    console.error('Registration audit failed: provide valid custom rules and an internal diversion configuration copy containing rule_set_items. No files were changed.');
    process.exitCode = 2;
  }
}
