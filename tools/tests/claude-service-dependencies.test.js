'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createProvider, digest } = require('../lib/ordered-rule-semantics');
const { VERSION, INVENTORY_PATH, validateInventory, buildReport, checkReport, serialize } = require('../lib/claude-service-dependencies');
const inventory = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../..', INVENTORY_PATH), 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const AI = '🤖 AI 服务';
const AD = '🛑 广告拦截';

function model(rows) {
  const providers = new Map();
  const rules = rows.map((row, index) => {
    if (row.entries) providers.set(row.id, createProvider(row.entries, { provider: row.id, policy: row.policy, kind: row.kind || 'domain', path: `fixture/${row.id}.yaml`, source: 'fixture' }));
    return { index, rule: row.rule || `RULE-SET,${row.id},${row.policy}`, provider: row.entries ? row.id : null, policy: row.policy, path: 'fixture/rules', source: 'fixture' };
  });
  return { root: 'fixture', providers, rules, identity: digest(JSON.stringify(rules.map((row) => [row.rule, providers.get(row.provider)?.semanticDigest]))) };
}
const allAi = () => model([{ rule: `DOMAIN-WILDCARD,*,${AI}`, policy: AI }]);

test('checked inventory has five service stages, bounded roles and an independent tool version', () => {
  assert.equal(VERSION, '1.0.0');
  assert.deepEqual(validateInventory(inventory), { ok: true, errors: [] });
  assert.ok(inventory.entries.some((row) => row.service_stages.includes('upload') && row.domain === 'api.anthropic.com'));
  const pending = inventory.entries.filter((row) => row.evidence_status === 'pending-verification');
  assert.ok(pending.length);
  assert.ok(pending.every((row) => row.policy.target === null && row.policy.allowed.length === 0));
});

test('earlier AD collision fails coverage even though a later AI suffix contains the endpoint', () => {
  // A set-membership audit would pass this real failure pattern: both hosts exist in AI.
  const m = model([{ id: 'ad', entries: ['DOMAIN,a-api.anthropic.com', 'DOMAIN,a-cdn.anthropic.com'], policy: AD }, { id: 'ai', entries: ['DOMAIN-SUFFIX,anthropic.com'], policy: AI }, { rule: `DOMAIN-WILDCARD,*,${AI}`, policy: AI }]);
  const report = buildReport(inventory, m);
  assert.equal(report.coverage.ok, false);
  assert.equal(report.summary.required_policy_gap_count, 2);
  assert.deepEqual(report.policy_gaps.map((row) => row.host), ['a-api.anthropic.com', 'a-cdn.anthropic.com']);
  assert.equal(report.policy_gaps[0].current.hit.provider, 'ad');
  assert.equal(report.policy_gaps[0].current.hit.entry, 'DOMAIN,a-api.anthropic.com');
  assert.equal(report.coverage.service_health_proved, false);
});

test('a precise earlier AI exception removes the recorded collision without changing unrelated telemetry', () => {
  const m = model([{ id: 'exception', entries: ['DOMAIN,a-api.anthropic.com', 'DOMAIN,a-cdn.anthropic.com'], policy: AI }, { id: 'ad', entries: ['DOMAIN,a-api.anthropic.com', 'DOMAIN,a-cdn.anthropic.com', 'DOMAIN,browser-intake-us5-datadoghq.com'], policy: AD }, { rule: `DOMAIN-WILDCARD,*,${AI}`, policy: AI }]);
  const report = buildReport(inventory, m);
  assert.equal(report.summary.required_policy_gap_count, 0);
  assert.equal(report.summary.optional_blocked_count, 1);
  assert.equal(report.coverage.ok, true);
  assert.equal(report.coverage.service_health_proved, false);
});

test('a host-only full-static result cannot hide an earlier unknown process condition behind AI projection', () => {
  const m = model([{ rule: 'PROCESS-NAME,curl,DIRECT', policy: 'DIRECT' }, { rule: `DOMAIN-WILDCARD,*,${AI}`, policy: AI }]);
  const report = buildReport(inventory, m);
  const route = report.entries.find((row) => row.id === 'api-and-files').routes[0];
  assert.equal(route.domainProjection.policy, AI);
  assert.equal(route.fullStatic.status, 'unknown');
  assert.equal(route.fullStatic.policy, null);
  assert.equal(route.fullStatic.hit, null);
  assert.equal(route.fullStatic.firstDecidableMatch.policy, AI);
  assert.equal(route.fullStatic.unknownBlockers[0].entry, 'PROCESS-NAME,curl,DIRECT');
  assert.equal(report.summary.full_static_unknown_count, report.summary.witnesses);
});

test('an undecidable pure-domain predicate is retained and fails strict finite coverage', () => {
  const m = model([{ id: 're2', entries: ['DOMAIN-REGEX,(?i)claude'], policy: AD }, { rule: `DOMAIN-WILDCARD,*,${AI}`, policy: AI }]);
  const report = buildReport(inventory, m);
  assert.equal(report.coverage.ok, false);
  assert.equal(report.summary.domain_projection_unknown_count, report.summary.witnesses);
  assert.match(report.entries[0].routes[0].domainProjection.unknownBlockers[0].reason, /RE2/);
});

test('shared hosts and pending roles cannot turn an observation into a required AI exception', () => {
  const m = model([{ id: 'shared', entries: ['DOMAIN,storage.googleapis.com', 'DOMAIN,anthropic.auth0.com'], policy: 'DIRECT' }, { rule: `DOMAIN-WILDCARD,*,${AI}`, policy: AI }]);
  const report = buildReport(inventory, m);
  assert.equal(report.entries.find((row) => row.domain === 'storage.googleapis.com').routes[0].assessment, 'shared-host-observed');
  assert.equal(report.entries.find((row) => row.domain === 'anthropic.auth0.com').routes[0].assessment, 'pending-verification');
  assert.equal(report.summary.policy_gap_count, 0);
});

test('an unknown limited to a pending candidate or optional telemetry is informational', () => {
  const m = model([{ id: 'unconfirmed', entries: ['AND,((DOMAIN,anthropic.auth0.com),(DOMAIN-REGEX,^anthropic))', 'AND,((DOMAIN,browser-intake-us5-datadoghq.com),(DOMAIN-REGEX,^browser))'], kind: 'residual', policy: AD }, { rule: `DOMAIN-WILDCARD,*,${AI}`, policy: AI }]);
  const report = buildReport(inventory, m);
  assert.equal(report.summary.domain_projection_unknown_count, 2);
  assert.equal(report.summary.enforced_domain_projection_unknown_count, 0);
  assert.equal(report.coverage.ok, true);
});

test('controlled suffix boundary rejects external, concatenated and apex witnesses', () => {
  for (const host of ['claudeusercontent.com.outside.invalid', 'notclaudeusercontent.com', 'claudeusercontent.com']) {
    const bad = clone(inventory);
    bad.entries.find((row) => row.id === 'desktop-user-content').witnesses = [host];
    assert.equal(validateInventory(bad).ok, false, host);
  }
  const good = buildReport(inventory, allAi());
  assert.equal(good.entries.find((row) => row.id === 'desktop-user-content').coverage, 'finite-suffix-witnesses-only');
});

test('shared vendor suffix cannot be approved by merely supplying an official source', () => {
  for (const domain of ['googleapis.com', 'auth0.com', 'sentry.io', 'statsigapi.net', 'datadoghq.com']) {
    const bad = clone(inventory);
    Object.assign(bad.entries[0], { domain, scope: 'controlled-suffix', include_apex: false, shared_domain: true, witnesses: [`tenant.${domain}`] });
    const result = validateInventory(bad);
    assert.equal(result.ok, false, domain);
    assert.ok(result.errors.some((error) => /shared infrastructure suffix|suffix not in/.test(error)));
  }
});

test('third-party, stale and lookalike URLs cannot certify current required service roles', () => {
  for (const url of ['https://code.claude.com.attacker.invalid/docs', 'https://github.com/other/claude-code', 'https://code.claude.com@attacker.invalid/docs']) {
    const bad = clone(inventory);
    bad.sources[0].url = url;
    assert.equal(validateInventory(bad).ok, false, url);
  }
  const bad = clone(inventory);
  bad.entries[0].evidence = { level: 'official-historical', source_ids: ['anthropic-legacy-network'], checked_date: inventory.checked_date };
  assert.equal(validateInventory(bad).ok, false);
  const pending = clone(inventory);
  pending.entries.find((row) => row.id === 'auth0-candidate').policy = { target: AI, allowed: [AI] };
  assert.equal(validateInventory(pending).ok, false);
});

test('schema fails closed for malformed dates, source links, duplicate IDs, missing stages and array types', () => {
  for (const mutate of [
    (data) => { data.checked_date = '2026-02-30'; },
    (data) => { data.entries[0].evidence.source_ids = ['missing']; },
    (data) => { data.entries[1].id = data.entries[0].id; },
    (data) => { data.entries.forEach((row) => { row.service_stages = row.service_stages.filter((stage) => stage !== 'upload'); }); },
    (data) => { data.sources = {}; },
    (data) => { data.entries = {}; },
    (data) => { data.entries[0].domain = 'https://claude.ai/login'; },
    (data) => { data.entries[0].policy.allowed = [AD]; data.entries[0].policy.target = AD; },
  ]) {
    const bad = clone(inventory); mutate(bad);
    assert.equal(validateInventory(bad).ok, false);
    assert.throws(() => buildReport(bad, allAi()), /invalid Claude dependency inventory/);
  }
});

test('report receipt binds semantic identity, source evidence and saved content', () => {
  const report = buildReport(inventory, allAi());
  assert.equal(checkReport(report, clone(report)).ok, true);
  assert.equal(checkReport(report, null).ok, false);
  const reordered = model([{ rule: 'DOMAIN,a-api.anthropic.com,DIRECT', policy: 'DIRECT' }, { rule: `DOMAIN-WILDCARD,*,${AI}`, policy: AI }]);
  assert.match(checkReport(buildReport(inventory, reordered), report).reason, /semantic identity/);
  const changed = clone(inventory); changed.entries[0].restriction += ' evidence changed';
  assert.match(checkReport(buildReport(changed, allAi()), report).reason, /inventory identity/);
  const tampered = clone(report); tampered.entries[0].routes[0].domainProjection.policy = 'DIRECT';
  assert.match(checkReport(report, tampered).reason, /content differs/);
});

test('pure report is reproducible across root paths and object key order with canonical LF', () => {
  const input = clone(inventory);
  const before = JSON.stringify(input);
  const m = allAi(); m.root = 'C:\\checkout-a';
  const report = buildReport(input, m);
  m.root = '/ci/checkout-b';
  const other = buildReport(JSON.parse(serialize(input)), m);
  assert.equal(serialize(report), serialize(other));
  assert.equal(JSON.stringify(input), before);
  assert.ok(!serialize(report).includes('\r'));
  assert.ok(!serialize(report).includes('checkout-a'));
  assert.equal(report.report_identity.length, 64);
});
