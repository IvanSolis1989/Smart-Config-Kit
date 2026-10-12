#!/usr/bin/env node
'use strict';

const { validateAdfpExceptions } = require('./lib/adfp-exceptions');

try {
  const report = validateAdfpExceptions();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
