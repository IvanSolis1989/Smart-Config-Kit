'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { buildReport, collectWorkflowReads } = require('../audit-blackmatrix7-exposure');

const blackmatrix7 = 'https://github.com/blackmatrix7/ios_rule_script';

test('counts upstream providers once while exposing split rules and unused providers', () => {
  const source = (id, version, repository = blackmatrix7) => ({
    id,
    identity: { repository_url: repository, version_state: version, resolved_commit: null },
  });
  const ledger = {
    fused_payload_fingerprint: 'same',
    providers: [
      source('ai', 'legacy-output-only'), source('music', 'content-addressed'),
      source('unrelated', 'pinned-commit', 'https://github.com/other/rules'),
    ],
    normalized_providers: [
      { ...source('ai-domain', 'legacy-output-only'), origin_provider_id: 'ai' },
      { ...source('ai-residual', 'legacy-output-only'), origin_provider_id: 'ai' },
      source('music', 'content-addressed'),
    ],
  };
  const report = buildReport(ledger, {
    payload_fingerprint: 'same',
    source_segments: [
      { id: 'first', policy: 'AI', source_rules: ['RULE-SET,ai-domain,AI', 'RULE-SET,ai-residual,AI'] },
      { id: 'second', policy: 'AI', source_rules: ['RULE-SET,ai-domain,AI'] },
    ],
  });
  assert.equal(report.raw_source_count, 2);
  assert.equal(report.normalized_provider_count, 3);
  assert.deepEqual(report.version_states, { 'legacy-output-only': 1, 'content-addressed': 1 });
  assert.deepEqual(report.policy_counts, [{ policy: 'AI', distinct_sources: 1 }]);
  assert.deepEqual(report.sources[0].normalized, [
    { id: 'ai-domain', uses: [{ segment: 'first', policy: 'AI' }, { segment: 'second', policy: 'AI' }] },
    { id: 'ai-residual', uses: [{ segment: 'first', policy: 'AI' }] },
  ]);
  assert.deepEqual(report.sources_without_direct_fused_reference, ['music']);
});

test('rejects mixed ledger and fused manifest payloads', () => {
  assert.throws(() => buildReport({ fused_payload_fingerprint: 'before' }, {
    payload_fingerprint: 'after',
  }), /different payloads/);
});

test('identifies both GitHub transports in an inherited workflow', () => {
  const raw = 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/AI/AI.yaml';
  const github = 'https://github.com/blackmatrix7/ios_rule_script/raw/master/rule/Clash/Google/Google.yaml';
  assert.deepEqual(collectWorkflowReads([
    `# curl ${raw}`,
    `curl ${github} | normalize > data-lite/google`,
    `echo "URL=${raw}" >> $GITHUB_ENV`,
    'curl https://github.com/blackmatrix7/another/raw/master/rule.txt > data/other',
  ].join('\n')), [
    { line: 2, url: github, destination: 'data-lite/google' },
    { line: 3, url: raw, destination: null },
  ]);
});
