#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  collectClientFiles,
  generatedAssetUrls,
  validateGeneratedRemoteAssetSizes,
} = require('../validate-generated-remote-asset-size');

const REPO_ROOT = path.resolve(__dirname, '../..');
const EXPECTED_BASE = 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/';
const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'rulesets/generated/fused/manifest.json'), 'utf8'));

function textRules(file) {
  return fs.readFileSync(file, 'utf8').split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith('#') && line.trim() !== 'payload:').length;
}

test('Issue #186 current Shadowrocket uses live repository assets instead of removed fin.txt', () => {
  const config = fs.readFileSync(path.join(REPO_ROOT, '独立内核系/Shadowrocket/Shadowrocket.conf'), 'utf8');
  assert.doesNotMatch(config, /DoingDog|\/a1\/fin\.txt/i);
  const urls = [...config.matchAll(/^RULE-SET,(https:\/\/[^,]+),/gm)].map((match) => match[1]);
  const expectedFiles = manifest.segments.filter((segment) => segment.files.clash)
    .flatMap((segment) => segment.files.clash.parts || [segment.files.clash.file])
    .filter((file) => textRules(path.join(REPO_ROOT, 'rulesets/generated/fused/clash', file)) > 0);
  assert.deepEqual(urls.map((url) => path.posix.basename(new URL(url).pathname)), expectedFiles);
  for (const url of urls) {
    assert.ok(url.startsWith(`${EXPECTED_BASE}rulesets/generated/fused/clash/`), url);
    assert.equal(new URL(url).searchParams.get('scki'), manifest.asset_revision, url);
    const file = path.join(REPO_ROOT, decodeURIComponent(new URL(url).pathname.split('/main/')[1]));
    assert.ok(fs.statSync(file).size > 0, file);
    assert.ok(textRules(file) > 0, file);
  }
  const files = [...new Set(urls)].map((url) => path.join(REPO_ROOT, decodeURIComponent(new URL(url).pathname.split('/main/')[1])));
  const result = validateGeneratedRemoteAssetSizes();
  assert.deepEqual(result.failures, []);
  const budget = result.clientAggregates.get('Shadowrocket');
  assert.ok(budget, 'raw GitHub consumers must not silently disappear from aggregate validation');
  assert.equal(budget.assets, files.length);
  assert.equal(budget.bytes, files.reduce((total, file) => total + fs.statSync(file).size, 0));
  assert.equal(budget.textRules, files.reduce((total, file) => total + textRules(file), 0));
});

test('all generated client references use raw/main with revision and are covered by asset budgets', () => {
  const result = validateGeneratedRemoteAssetSizes();
  let count = 0;
  for (const file of collectClientFiles()) {
    const consumer = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    // Independent URL inventory catches a recognizer that silently excludes a new endpoint.
    const urls = [...content.matchAll(/https:\/\/[^\s,"'\\]+/g)]
      .map((match) => match[0]).filter((url) => url.includes('/rulesets/generated/'));
    for (const url of urls) {
      count += 1;
      assert.ok(url.startsWith(EXPECTED_BASE), `${consumer}: ${url}`);
      assert.equal(new URL(url).searchParams.get('scki'), manifest.asset_revision, url);
      const relativeAsset = decodeURIComponent(new URL(url).pathname.split('/main/')[1]);
      const asset = path.join(REPO_ROOT, relativeAsset);
      assert.ok(fs.statSync(asset).size > 0, relativeAsset);
      if (path.extname(asset) === '.list') assert.ok(textRules(asset) > 0, relativeAsset);
      assert.ok(result.references.get(relativeAsset)?.includes(consumer), `${consumer}: budget omitted ${relativeAsset}`);
    }
    assert.equal(generatedAssetUrls(content).length, urls.length, consumer);
  }
  assert.ok(count > result.references.size && result.references.size > 0, 'generated assets must be inventoried across multiple consumers');
  assert.deepEqual(result.failures, []);
});

test('generated reference recognizer retains historical CDN and missing-asset URLs', () => {
  const suffix = 'rulesets/generated/fused/clash/missing.list?scki=v6.0.19';
  const urls = [
    `${EXPECTED_BASE}${suffix}`,
    `https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/${suffix}`,
    `https://cdn.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/${suffix}`,
    `https://jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/${suffix}`,
  ];
  assert.deepEqual(generatedAssetUrls(urls.join('\n')), urls);
  assert.deepEqual(generatedAssetUrls('https://example.test/rulesets/generated/fused/missing.list'), []);
});

test('platform consumers exclude the empty work asset while Surge keeps its four process rules', () => {
  const sourceSegment = manifest.source_segments.find((row) => row.source_rules.some((rule) => rule.startsWith('RULE-SET,scki-work-process,')));
  const segment = sourceSegment && manifest.segments.find((row) => row.id === sourceSegment.id);
  assert.ok(segment, 'the retained work source segment must remain in the manifest');
  for (const [platform, consumer] of [
    ['clash', '独立内核系/Shadowrocket/Shadowrocket.conf'],
    ['clash', '独立内核系/Loon/Loon.conf'],
    ['quantumultx', '独立内核系/Quantumult X/QuantumultX.conf'],
  ]) {
    const file = segment.files[platform].file;
    assert.equal(textRules(path.join(REPO_ROOT, 'rulesets/generated/fused', platform, file)), 0);
    const config = fs.readFileSync(path.join(REPO_ROOT, consumer), 'utf8');
    assert.ok(!config.includes(`/rulesets/generated/fused/${platform}/${file}`), `${consumer} must exclude its no-op asset`);
  }
  const surgeFile = segment.files.surge.file;
  const surgeAsset = path.join(REPO_ROOT, 'rulesets/generated/fused/surge', surgeFile);
  const processRules = fs.readFileSync(surgeAsset, 'utf8').split(/\r?\n/).filter((line) => line.startsWith('PROCESS-NAME,'));
  assert.equal(textRules(surgeAsset), 4);
  assert.equal(processRules.length, 4, 'Surge process support must preserve all four source rules');
  const surgeConfig = fs.readFileSync(path.join(REPO_ROOT, '独立内核系/Surge/Surge.conf'), 'utf8');
  assert.ok(surgeConfig.includes(`${EXPECTED_BASE}rulesets/generated/fused/surge/${surgeFile}?scki=${manifest.asset_revision}`));
});
