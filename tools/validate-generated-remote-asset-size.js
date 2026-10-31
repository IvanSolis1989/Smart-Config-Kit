#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { REPOSITORY_URL_PREFIXES } = require('./lib/repository-rule-asset');
const { clientDirectory, clientIdForPath } = require('./lib/client-layout');

const REPO_ROOT = path.resolve(__dirname, '..');
const MAX_JSDELIVR_ASSET_BYTES = 18 * 1024 * 1024;
const DEFAULT_CLIENT_BUDGET = Object.freeze({ maxBytes: 128 * 1024 * 1024, maxTextRules: 2_000_000 });
const CLIENT_BUDGETS = new Map([
  ['Shadowrocket', { maxBytes: 32 * 1024 * 1024, maxTextRules: 1_000_000 }],
  ['Surge', { maxBytes: 32 * 1024 * 1024, maxTextRules: 1_000_000 }],
  ['Loon', { maxBytes: 32 * 1024 * 1024, maxTextRules: 1_000_000 }],
  ['Quantumult X', { maxBytes: 32 * 1024 * 1024, maxTextRules: 1_000_000 }],
  ['Egern', { maxBytes: 32 * 1024 * 1024, maxTextRules: 1_000_000 }],
  ['Stash', { maxBytes: 32 * 1024 * 1024, maxTextRules: 1_000_000 }],
  ['SingBox', { maxBytes: 64 * 1024 * 1024, maxTextRules: 2_000_000 }],
  ['Karing', { maxBytes: 32 * 1024 * 1024, maxTextRules: 1_000_000 }],
]);
const REPOSITORY_URL_RE = new RegExp(`(?:${REPOSITORY_URL_PREFIXES.map((prefix) => prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})[^\\s,"'\\\\]+`, 'g');
const CLIENT_FILES = [
  'Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js',
  'Mihomo内核系/Clash Party/ClashParty(mihomo).js',
  'Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml',
  '独立内核系/Egern/Egern.yaml',
  'Mihomo内核系/FlClash/FlClash(mihomo).js',
  '独立内核系/Loon/Loon.conf',
  'Mihomo内核系/OpenClash/OpenClash(mihomo).sh',
  'Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh',
  '独立内核系/Quantumult X/QuantumultX.conf',
  '独立内核系/Shadowrocket/Shadowrocket.conf',
  'Sing-box内核系/SingBox/SingBox(sing-box)-full.json',
  'Sing-box内核系/Karing/diversion_rules_custom.json',
  '独立内核系/Stash/Stash.yaml',
  '独立内核系/Surge/Surge.conf',
  'Xray内核系/v2rayN/v2rayN(xray).json',
];
const CLIENT_DIRECTORIES = [
  'Passwall',
  'Passwall2',
];

function collectClientFiles() {
  const files = CLIENT_FILES.map((relative) => path.join(REPO_ROOT, relative));
  for (const relativeDirectory of CLIENT_DIRECTORIES) {
    const directory = path.join(REPO_ROOT, clientDirectory(relativeDirectory));
    for (const entry of fs.readdirSync(directory, { recursive: true, withFileTypes: true })) {
      if (entry.isFile() && (entry.name.endsWith('.conf') || entry.name.endsWith('.sh') || entry.name.endsWith('.list'))) {
        files.push(path.join(entry.parentPath, entry.name));
      }
    }
  }
  return files;
}

function generatedAssetUrls(source) {
  return [...source.matchAll(REPOSITORY_URL_RE)]
    .map((match) => match[0])
    .filter((url) => new URL(url).pathname.includes('/rulesets/generated/'));
}

function collectGeneratedReferences() {
  const consumers = new Map();
  for (const file of collectClientFiles()) {
    const content = fs.readFileSync(file, 'utf8');
    const relativeConsumer = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
    for (const url of generatedAssetUrls(content)) {
      const prefix = REPOSITORY_URL_PREFIXES.find((candidate) => url.startsWith(candidate));
      const relativeAsset = decodeURIComponent(url.slice(prefix.length).replace(/[?#].*$/, ''));
      const rows = consumers.get(relativeAsset) || [];
      rows.push(relativeConsumer);
      consumers.set(relativeAsset, rows);
    }
  }
  return consumers;
}

function validateGeneratedRemoteAssetSizes() {
  const failures = [];
  const references = collectGeneratedReferences();
  const assetStats = new Map();
  const clientAssets = new Map();
  for (const [relativeAsset, consumers] of references) {
    const asset = path.join(REPO_ROOT, relativeAsset);
    if (!fs.existsSync(asset)) {
      failures.push(`missing generated asset: ${relativeAsset} (referenced by ${[...new Set(consumers)].join(', ')})`);
      continue;
    }
    const size = fs.statSync(asset).size;
    if (size === 0) failures.push(`empty generated asset: ${relativeAsset}`);
    const extension = path.extname(asset).toLowerCase();
    const isText = new Set(['.conf', '.json', '.list', '.txt', '.yaml', '.yml']).has(extension);
    const textRules = isText
      ? fs.readFileSync(asset, 'utf8').split(/\r?\n/).filter((line) => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('#') && trimmed !== 'payload:';
      }).length
      : 0;
    if (isText && textRules === 0) failures.push(`generated text asset has no rules: ${relativeAsset}`);
    assetStats.set(relativeAsset, { size, textRules });
    if (size > MAX_JSDELIVR_ASSET_BYTES) {
      failures.push(`oversized generated asset: ${relativeAsset} = ${size} bytes, limit = ${MAX_JSDELIVR_ASSET_BYTES} bytes (referenced by ${[...new Set(consumers)].join(', ')})`);
    }
    for (const consumer of consumers) {
      const client = clientIdForPath(consumer);
      if (!client) throw new Error(`Unknown client consumer: ${consumer}`);
      const assets = clientAssets.get(client) || new Set();
      assets.add(relativeAsset);
      clientAssets.set(client, assets);
    }
  }
  const clientAggregates = new Map();
  if (references.size === 0) failures.push('no generated remote assets found in client artifacts');
  for (const [client, assets] of clientAssets) {
    const budget = CLIENT_BUDGETS.get(client) || DEFAULT_CLIENT_BUDGET;
    let bytes = 0;
    let textRules = 0;
    for (const asset of assets) {
      const stats = assetStats.get(asset);
      if (!stats) continue;
      bytes += stats.size;
      textRules += stats.textRules;
    }
    const aggregate = { assets: assets.size, bytes, textRules, budget };
    clientAggregates.set(client, aggregate);
    if (bytes > budget.maxBytes) {
      failures.push(`aggregate generated assets exceed ${client} byte budget: ${bytes} > ${budget.maxBytes} (${assets.size} unique assets)`);
    }
    if (textRules > budget.maxTextRules) {
      failures.push(`aggregate generated assets exceed ${client} text-rule budget: ${textRules} > ${budget.maxTextRules} (${assets.size} unique assets)`);
    }
  }
  return { failures, references, clientAggregates };
}

if (require.main === module) {
  const { failures, references, clientAggregates } = validateGeneratedRemoteAssetSizes();
  if (failures.length) {
    console.error(`FAIL generated remote asset size validation: ${failures.length} issue(s) across ${references.size} referenced assets`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`PASS generated remote asset size validation: ${references.size} referenced assets <= ${MAX_JSDELIVR_ASSET_BYTES} bytes; ${clientAggregates.size} client aggregate budgets satisfied`);
}

module.exports = {
  CLIENT_BUDGETS,
  DEFAULT_CLIENT_BUDGET,
  MAX_JSDELIVR_ASSET_BYTES,
  collectClientFiles,
  collectGeneratedReferences,
  generatedAssetUrls,
  validateGeneratedRemoteAssetSizes,
};
