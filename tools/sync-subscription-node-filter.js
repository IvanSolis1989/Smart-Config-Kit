#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourcePath = 'tools/runtime/subscription-node-filter.js';
const targets = [
  'Clash Party/ClashParty(mihomo-smart).js',
  'Clash Party/ClashParty(mihomo).js',
  'FlClash/FlClash(mihomo).js',
];
const begin = '// >>> SCKI SUBSCRIPTION NODE FILTER: BEGIN';
const end = '// <<< SCKI SUBSCRIPTION NODE FILTER: END';
const anchor = '//  模块 A：节点过滤 / 家宽识别';

function main() {
  const check = process.argv.includes('--check');
  if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Usage: node tools/sync-subscription-node-filter.js [--check]');
  const runtime = fs.readFileSync(path.join(root, sourcePath), 'utf8').replace(/\r\n/g, '\n').trimEnd();
  for (const target of targets) {
    const file = path.join(root, target);
    const original = fs.readFileSync(file, 'utf8');
    const eol = original.includes('\r\n') ? '\r\n' : '\n';
    const block = [begin + ' — generated from ' + sourcePath + '; edit runtime then synchronize.', runtime, end].join('\n').replace(/\n/g, eol);
    let updated;
    const first = original.indexOf(begin);
    const firstEnd = original.indexOf(end);
    if ((first < 0) !== (firstEnd < 0)) throw new Error(target + ': unmatched node filter marker');
    if (first >= 0) {
      const last = original.indexOf(end, first);
      if (last < 0) throw new Error(target + ': missing end marker');
      if (firstEnd !== last || original.indexOf(begin, first + begin.length) >= 0 || original.indexOf(end, last + end.length) >= 0) {
        throw new Error(target + ': duplicate node filter marker');
      }
      updated = original.slice(0, first) + block + original.slice(last + end.length);
    } else {
      const at = original.indexOf(anchor);
      if (at < 0) throw new Error(target + ': missing insertion anchor');
      const heading = original.lastIndexOf('// ================================================================', at);
      if (heading < 0) throw new Error(target + ': missing section heading');
      updated = original.slice(0, heading) + block + eol + eol + original.slice(heading);
    }
    if (updated !== original) {
      if (check) throw new Error(target + ': node filter runtime out of sync');
      fs.writeFileSync(file, updated);
    }
  }
  console.log(check ? 'PASS subscription node filter synchronized' : 'SYNC subscription node filter synchronized');
}

try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
