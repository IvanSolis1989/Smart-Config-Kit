'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const registry = require('../../rulesets/source/adfp-exceptions.json');
const {
  domainMatchesScope,
  validateAdfpExceptionData,
  validateAdfpExceptions,
} = require('../lib/adfp-exceptions');

test('the exception ledger covers the current four payloads and source graph order', () => {
  const report = validateAdfpExceptions();
  assert.equal(report.total_records, 35);
  assert.deepEqual(report.coverage, {
    'scki-adfp-direct': 26,
    'scki-adfp-intl-site': 3,
    'scki-adfp-payments': 1,
    'scki-adfp-ai': 5,
  });
  assert.ok(report.registry_sha256 && /^[a-f0-9]{64}$/.test(report.registry_sha256));
  assert.ok(report.ordered_provider_indices['scki-adfp-direct'] < report.anti_ad_index);
  assert.ok(report.ordered_provider_indices['scki-adfp-ai'] < report.anti_ad_index);
});

test('pure scope checks honor exact host and DNS-label suffix boundaries', () => {
  const exact = { rule: 'DOMAIN,login.nvidia.cn', match_scope: 'exact' };
  const suffix = { rule: 'DOMAIN-SUFFIX,paddle.com', match_scope: 'suffix' };
  assert.equal(domainMatchesScope('login.nvidia.cn', exact), true);
  assert.equal(domainMatchesScope('x.login.nvidia.cn', exact), false);
  assert.equal(domainMatchesScope('analytics.paddle.com', suffix), true);
  assert.equal(domainMatchesScope('paddle.com', suffix), true);
  assert.equal(domainMatchesScope('paddle.com.example', suffix), false);
});

test('validator rejects a missing record (old-code-fail regression)', () => {
  const changed = structuredClone(registry);
  changed.records.pop();
  assert.throws(() => validateAdfpExceptionData({ registry: changed }), /missing from registry|coverage count/);
});

test('validator rejects widening a DOMAIN exception to DOMAIN-SUFFIX', () => {
  const changed = structuredClone(registry);
  const record = changed.records.find(entry => entry.id === 'nvidia-cn-login');
  record.rule = 'DOMAIN-SUFFIX,login.nvidia.cn';
  record.match_scope = 'suffix';
  record.positive_examples.push('x.login.nvidia.cn');
  record.negative_examples = record.negative_examples.filter(host => host !== 'x.login.nvidia.cn');
  assert.throws(() => validateAdfpExceptionData({ registry: changed }), /disagrees with source graph|adds rule absent from payload|coverage count/);
});
