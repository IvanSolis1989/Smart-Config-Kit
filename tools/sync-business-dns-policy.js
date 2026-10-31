#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const graph = require('../rulesets/source/routing-graph');
const { SOURCE_FILE, compileBusinessDnsPolicy } = require('./lib/business-dns-policy');
const { writeRepositoryArtifact } = require('./lib/write-repository-artifact');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = [
  ['Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js', 'javascript'],
  ['Mihomo内核系/Clash Party/ClashParty(mihomo).js', 'javascript'],
  ['Mihomo内核系/FlClash/FlClash(mihomo).js', 'javascript'],
  ['Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml', 'yaml'],
  ['Mihomo内核系/OpenClash/OpenClash(mihomo).sh', 'yaml'],
  ['Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh', 'yaml'],
];
const BEGIN = '>>> SCKI BUSINESS DNS POLICY: BEGIN';
const END = '<<< SCKI BUSINESS DNS POLICY: END';

function renderBlock(policy, language) {
  const authority = `${SOURCE_FILE} via routing-graph.js; run tools/sync-business-dns-policy.js.`;
  if (language === 'javascript') {
    const value = JSON.stringify(policy, null, 2).replace(/\n/g, '\n  ');
    return `  // ${BEGIN} — generated from ${authority}\n  config.dns['nameserver-policy'] = ${value};\n  // ${END}`;
  }
  const lines = [`    # ${BEGIN} — generated from ${authority}`];
  for (const [match, servers] of Object.entries(policy)) {
    // Preserve the established plain geosite keys used by the artifact reader.
    lines.push(`    ${match.startsWith('geosite:') ? match : JSON.stringify(match)}:`);
    for (const server of servers) lines.push(`    - ${JSON.stringify(server)}`);
  }
  lines.push(`    # ${END}`);
  return lines.join('\n');
}

function replaceProjection(source, block, language, label) {
  const normalized = source.replace(/\r\n/g, '\n');
  const begin = normalized.indexOf(BEGIN);
  const end = normalized.indexOf(END);
  let start;
  let after;
  if (begin !== -1 || end !== -1) {
    if (begin === -1 || end < begin || normalized.indexOf(BEGIN, begin + BEGIN.length) !== -1 ||
        normalized.indexOf(END, end + END.length) !== -1) throw new Error(`${label}: invalid business DNS synchronization markers`);
    start = normalized.lastIndexOf('\n', begin) + 1;
    after = normalized.indexOf('\n', end);
    if (after === -1) after = normalized.length;
  } else if (language === 'javascript') {
    // One-time migration of the existing repository-owned seven-entry table.
    const anchor = "  config.dns['nameserver-policy'] = {};";
    const geositeCall = '  Object.keys(geositeDnsPolicy).forEach(function(key) {';
    const closing = '\n  })';
    start = normalized.indexOf(anchor);
    const call = normalized.indexOf(geositeCall, start);
    const close = normalized.indexOf(closing, call);
    if (start === -1 || call === -1 || close === -1 || normalized.indexOf(anchor, start + anchor.length) !== -1 ||
        normalized.indexOf(geositeCall, call + geositeCall.length) !== -1) {
      throw new Error(`${label}: missing business DNS policy markers or migration anchor`);
    }
    after = close + closing.length;
  } else {
    const anchor = '  nameserver-policy:\n';
    const index = normalized.indexOf(anchor);
    if (index === -1 || normalized.indexOf(anchor, index + anchor.length) !== -1) {
      throw new Error(`${label}: missing or ambiguous business DNS policy anchor`);
    }
    start = index + anchor.length;
    after = start;
    while (after < normalized.length) {
      const newline = normalized.indexOf('\n', after);
      const lineEnd = newline === -1 ? normalized.length : newline;
      const line = normalized.slice(after, lineEnd);
      if (!/^ {4}\S/.test(line)) break;
      after = newline === -1 ? normalized.length : newline + 1;
    }
    if (after === start) throw new Error(`${label}: missing business DNS policy entries`);
    if (normalized[after - 1] === '\n') after--;
  }
  const updated = normalized.slice(0, start) + block + normalized.slice(after);
  return source.includes('\r\n') ? updated.replace(/\n/g, '\r\n') : updated;
}

function prepareUpdates({ readFile = fs.readFileSync, contract = graph.getBusinessDnsPolicy(), routingGraph = graph.getRawRoutingGraph() } = {}) {
  const projections = compileBusinessDnsPolicy(contract, routingGraph);
  // Validate and prepare every target before the first write.
  return TARGETS.map(([relative, language]) => {
    const file = path.join(ROOT, relative);
    const original = readFile(file, 'utf8');
    return { file, original, updated: replaceProjection(original, renderBlock(projections[language], language), language, relative) };
  });
}

function main(args = process.argv.slice(2)) {
  if (args.some(arg => arg !== '--check')) throw new Error('Usage: node tools/sync-business-dns-policy.js [--check]');
  const stale = prepareUpdates().filter(item => item.original !== item.updated);
  if (args.includes('--check') && stale.length) {
    throw new Error('Business DNS policy projections are stale: ' + stale.map(item => path.relative(ROOT, item.file)).join(', '));
  }
  if (!args.includes('--check')) for (const item of stale) writeRepositoryArtifact(item.file, item.updated);
  console.log(`${args.includes('--check') ? 'PASS' : 'SYNC'} business DNS policy: ${TARGETS.length} owned projections; Stash inherits CMFA`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { TARGETS, main, prepareUpdates, renderBlock, replaceProjection };
