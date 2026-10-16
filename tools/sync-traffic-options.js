#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const graph = require('../rulesets/source/routing-graph.js');
const { writeRepositoryArtifact } = require('./lib/write-repository-artifact');
const { parseLocalTrafficOptions, setLocalTrafficOptions } = require('./lib/local-traffic-options');
const runtimePath = 'tools/runtime/traffic-options.js';
const targets = [
  'Clash Party/ClashParty(mihomo-smart).js',
  'Clash Party/ClashParty(mihomo).js',
  'FlClash/FlClash(mihomo).js',
];
const ruleBegin = '  // >>> SCKI QUIC RULES: BEGIN';
const ruleEnd = '  // <<< SCKI QUIC RULES: END';
const healthBegin = '  // >>> SCKI HEALTH CHECK: BEGIN';
const healthEnd = '  // <<< SCKI HEALTH CHECK: END';
const zeroTierBegin = '  // >>> SCKI ZEROTIER PLANET: BEGIN';
const zeroTierEnd = '  // <<< SCKI ZEROTIER PLANET: END';
const embedBegin = '// >>> SCKI TRAFFIC OPTIONS: BEGIN';
const embedEnd = '// <<< SCKI TRAFFIC OPTIONS: END';

function replaceMarked(source, begin, end, block, label) {
  const start = source.indexOf(begin);
  const close = source.indexOf(end);
  if (start < 0 || close < start || source.indexOf(begin, start + begin.length) >= 0 || source.indexOf(end, close + end.length) >= 0) {
    throw new Error(label + ': invalid synchronization markers');
  }
  let after = source.indexOf('\n', close);
  if (after < 0) after = source.length;
  // Keep the full original line ending after the closing marker.
  else if (source[after - 1] === '\r') after--;
  return source.slice(0, start) + block + source.slice(after);
}

function prepareUpdates(defaults = graph.getTrafficOptions(), readFile = fs.readFileSync) {
  graph.validateTrafficOptions(defaults);
  const updates = [];
  const runtimeFile = path.join(root, runtimePath);
  const originalRuntime = readFile(runtimeFile, 'utf8');
  const runtimeEol = originalRuntime.includes('\r\n') ? '\r\n' : '\n';
  const ruleBlock = ruleBegin + '\n  var BLOCK_FOREIGN_QUIC_RULES = ' + JSON.stringify(graph.getQuicRules('block-foreign')) + ';\n' + ruleEnd;
  const profiles = { standard: graph.getHealthCheckSettings('standard'), 'power-save': graph.getHealthCheckSettings('power-save') };
  const healthBlock = healthBegin + '\n  var HEALTH_CHECK_PROFILES = ' + JSON.stringify(profiles) + ';\n' + healthEnd;
  const zeroTierBlock = zeroTierBegin + '\n  var ZEROTIER_PLANET_PROXY_POLICY = ' + JSON.stringify(graph.getZeroTierPlanetProxyPolicy()) + ';\n' + zeroTierEnd;
  const runtime = replaceMarked(replaceMarked(replaceMarked(originalRuntime, ruleBegin, ruleEnd, ruleBlock.replace(/\n/g, runtimeEol), runtimePath), healthBegin, healthEnd, healthBlock.replace(/\n/g, runtimeEol), runtimePath), zeroTierBegin, zeroTierEnd, zeroTierBlock.replace(/\n/g, runtimeEol), runtimePath);
  updates.push({ file: runtimeFile, original: originalRuntime, updated: runtime });

  for (const target of targets) {
    const file = path.join(root, target);
    const original = readFile(file, 'utf8');
    const localOptions = parseLocalTrafficOptions(original, target).options;
    const eol = original.includes('\r\n') ? '\r\n' : '\n';
    const runtimeForTarget = runtime.trimEnd().replace(/\r\n/g, '\n').replace(/\n/g, eol);
    const block = [embedBegin + ' — generated from ' + runtimePath + ', routing-graph.js and traffic-options.json.', runtimeForTarget, embedEnd].join(eol);
    let updated = original;
    if (original.includes(embedBegin) || original.includes(embedEnd)) {
      updated = replaceMarked(original, embedBegin, embedEnd, block, target);
    } else {
      const anchor = 'const SCKI_MAX_NODE_MULTIPLIER = null';
      const at = original.indexOf(anchor);
      if (at < 0 || original.indexOf(anchor, at + 1) >= 0) throw new Error(target + ': missing constant anchor');
      const after = original.indexOf('\n', at);
      updated = original.slice(0, after + 1) + eol + block + eol + original.slice(after + 1);
    }
    updated = setLocalTrafficOptions(updated, {
      healthCheckProfile: defaults.healthCheckProfile,
      quicPolicy: defaults.quicPolicy,
      zeroTierPlanetProxy: localOptions.zeroTierPlanetProxy ?? false,
    }, target);
    updates.push({ file, original, updated });
  }

  return updates;
}

function main(args = process.argv.slice(2)) {
  if (args.some(arg => arg !== '--check')) throw new Error('Usage: node tools/sync-traffic-options.js [--check]');
  const check = args.includes('--check');
  const stale = prepareUpdates().filter(item => item.original !== item.updated);
  if (check && stale.length) throw new Error('Traffic options out of sync: ' + stale.map(item => path.relative(root, item.file)).join(', '));
  if (!check) for (const item of stale) writeRepositoryArtifact(item.file, item.updated);
  console.log(check ? 'PASS traffic options synchronized' : 'SYNC traffic options synchronized');
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { main, prepareUpdates, replaceMarked };
