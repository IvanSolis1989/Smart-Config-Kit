#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  getAssetRevisionFromUrl,
  mihomoAssetCachePath,
  repositoryAssetUrl,
  withAssetRevision,
} = require('../lib/generated-asset-url');

test('generated asset URLs use a release cache key and Mihomo uses an isolated local path', () => {
  const revision = 'v6.0.8';
  const url = repositoryAssetUrl('rulesets/generated/fused/mihomo/scki-fused-061-cn-site-domain.mrs', revision);

  assert.equal(url, 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-061-cn-site-domain.mrs?scki=v6.0.8');
  assert.equal(getAssetRevisionFromUrl(url), revision);
  assert.equal(mihomoAssetCachePath('scki-fused-061-cn-site-domain.mrs', revision), './ruleset/v6.0.8/scki-fused-061-cn-site-domain.mrs');
  assert.equal(withAssetRevision('https://example.test/ruleset.mrs?old=1', revision), 'https://example.test/ruleset.mrs?old=1&scki=v6.0.8');
});

test('generated asset URLs reject unsafe revisions and local file names', () => {
  assert.throws(() => repositoryAssetUrl('../secret.mrs', 'v6.0.8'), /invalid repository asset path/);
  assert.throws(() => repositoryAssetUrl('rulesets/generated/fused/test.mrs', '6.0.8'), /invalid generated asset revision/);
  assert.throws(() => mihomoAssetCachePath('../test.mrs', 'v6.0.8'), /invalid Mihomo asset file name/);
});
