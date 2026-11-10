#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  MATRIX_OUTPUT,
  formatIssues,
  readClientCapabilityMatrix,
  renderClientCapabilityMatrix,
  validateClientCapabilityMatrix,
} = require('./lib/client-capability-matrix');

const REPOSITORY_ROOT = path.resolve(__dirname, '..');

function usage() {
  return [
    'Usage: node tools/generate-client-capability-matrix.js [--check]',
    '',
    'Generates docs/client-capability-matrix.md from its evidence-backed JSON source.',
  ].join('\n');
}

function main(argv) {
  const args = new Set(argv);
  if (args.has('--help') || args.has('-h')) {
    console.log(usage());
    return;
  }
  if ([...args].some((arg) => arg !== '--check')) {
    throw new Error(`unknown argument: ${[...args].find((arg) => arg !== '--check')}\n${usage()}`);
  }

  const matrix = readClientCapabilityMatrix(REPOSITORY_ROOT);
  const validation = validateClientCapabilityMatrix(matrix, REPOSITORY_ROOT);
  if (!validation.ok) throw new Error(`invalid client capability matrix: ${formatIssues(validation.issues)}`);

  const translated = renderClientCapabilityMatrix(matrix, 'zh-CN');
  const translatedTarget = path.join(REPOSITORY_ROOT, 'docs/client-capability-matrix.zh-CN.md');
  if (args.has('--check')) {
    if (!fs.existsSync(translatedTarget) || fs.readFileSync(translatedTarget, 'utf8') !== translated) throw new Error('Chinese capability matrix is stale');
  } else fs.writeFileSync(translatedTarget, translated, 'utf8');
  const rendered = renderClientCapabilityMatrix(matrix);
  const target = path.join(REPOSITORY_ROOT, ...MATRIX_OUTPUT.split('/'));
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (args.has('--check')) {
    if (current !== rendered) {
      throw new Error(`${MATRIX_OUTPUT} is stale; run node tools/generate-client-capability-matrix.js`);
    }
    console.log(`PASS client capability matrix is current (${matrix.products.length} products)`);
    return;
  }

  fs.writeFileSync(target, rendered, 'utf8');
  console.log(`WROTE ${MATRIX_OUTPUT} (${matrix.products.length} products)`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
}
