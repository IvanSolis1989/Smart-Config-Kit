#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const runtime = fs.readFileSync(path.join(__dirname, 'runtime', 'subscription-node-filter.rb'), 'utf8').replace(/\r\n/g, '\n').trimEnd();
const begin = '# >>> SCKI SUBSCRIPTION NODE FILTER: BEGIN';
const end = '# <<< SCKI SUBSCRIPTION NODE FILTER: END';
const files = ['OpenClash(mihomo).sh', 'OpenClash(mihomo-smart).sh'];
const check = process.argv.includes('--check');
if (process.argv.slice(2).some(arg => arg !== '--check')) {
  throw new Error('Usage: node tools/sync-openclash-node-filter.js [--check]');
}
let drift = false;

for (const file of files) {
  const target = path.join(root, 'OpenClash', file);
  const source = fs.readFileSync(target, 'utf8');
  const start = source.indexOf(begin);
  const finish = source.indexOf(end, start);
  if (start === -1 || finish === -1 || source.indexOf(begin, start + begin.length) !== -1 || source.indexOf(end, finish + end.length) !== -1) {
    throw new Error(`${file}: expected one runtime marker pair`);
  }
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const block = [begin, runtime, end].join('\n').replace(/\n/g, eol);
  const updated = source.slice(0, start) + block + source.slice(finish + end.length);
  if (source !== updated) {
    drift = true;
    if (!check) fs.writeFileSync(target, updated, 'utf8');
  }
  console.log(`${file}: ${source === updated ? 'current' : check ? 'drift' : 'synchronized'}`);
}
if (check && drift) process.exitCode = 1;
