#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildIssueContext } = require('./lib/ai-issue-context');

function main(argv = process.argv.slice(2), env = process.env) {
  if (argv.length !== 2 || argv[0] !== '--output' || !argv[1]) {
    throw new TypeError('Usage: node tools/build-ai-issue-context.js --output <file>');
  }
  const output = path.resolve(argv[1]);
  const result = buildIssueContext({
    repoRoot: process.cwd(),
    title: env.ISSUE_TITLE,
    body: env.ISSUE_BODY,
    comment: env.COMMENT_BODY,
    codeMod: env.CODE_MOD,
  });
  const { text, ...manifest } = result;
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, text, 'utf8');
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.writeFileSync(`${output}.json`, manifestText, 'utf8');
  // Neither reports, source contents, nor model/API credentials belong in logs.
  process.stdout.write(`${output}: ${Buffer.byteLength(text, 'utf8')} bytes\n`);
  process.stdout.write(`${output}.json: ${Buffer.byteLength(manifestText, 'utf8')} bytes\n`);
  return manifest;
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    process.stderr.write(error instanceof TypeError
      ? 'Usage: node tools/build-ai-issue-context.js --output <file>\n'
      : 'Repository evidence context could not be built or saved.\n');
    process.exitCode = 1;
  }
}

module.exports = { main };
