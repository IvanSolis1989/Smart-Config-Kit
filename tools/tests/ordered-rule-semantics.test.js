'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { execFileSync, spawnSync } = require('node:child_process');
const { matchEntry, normalizeHost, createProvider, firstMatch, loadRepository, compareRepositories, checkReport, digest, entryWitnesses } = require('../lib/ordered-rule-semantics');

function model(rows) {
  const providers = new Map();
  const rules = rows.map((row, index) => {
    if (row.entries) providers.set(row.id, createProvider(row.entries, { provider: row.id, policy: row.policy, kind: row.kind || 'domain', path: `${row.id}.yaml`, source: 'fixture' }));
    return { index, rule: row.rule || `RULE-SET,${row.id},${row.policy}`, provider: row.entries ? row.id : null, policy: row.policy, path: 'fixture/rules', source: 'fixture' };
  });
  return { root: 'fixture', ref: null, providers, rules, identity: digest(JSON.stringify(rules.map((row) => [row.rule, providers.get(row.provider)?.semanticDigest]))) };
}

test('domain boundary and a single legal DNS tail dot preserve exact/suffix meaning', () => {
  assert.equal(matchEntry('DOMAIN-SUFFIX,me.com', { host: 'www.wegame.com.cn' }).status, 'no-match');
  assert.equal(matchEntry('DOMAIN-KEYWORD,me.com', { host: 'www.wegame.com.cn' }).status, 'match');
  assert.equal(matchEntry('DOMAIN-SUFFIX,example.com', { host: 'notexample.com' }).status, 'no-match');
  assert.equal(matchEntry('DOMAIN,example.com', { host: 'EXAMPLE.COM.' }).status, 'match');
  assert.equal(matchEntry('DOMAIN,example.com', { host: 'child.example.com' }).status, 'no-match');
  assert.equal(normalizeHost('example.com..'), null);
  assert.equal(matchEntry('DOMAIN-WILDCARD,?.example.com', { host: 'x.example.com' }).status, 'match');
  assert.equal(matchEntry('DOMAIN-WILDCARD,?.example.com', { host: 'xy.example.com' }).status, 'no-match');
});

test('an earlier unknown prevents a later definite domain policy from being called first-match', () => {
  const rules = model([{ rule: 'PROCESS-NAME,curl,DIRECT', policy: 'DIRECT' }, { id: 'later', entries: ['DOMAIN,example.com'], policy: 'proxy' }]);
  const full = firstMatch(rules, { host: 'example.com' });
  assert.equal(full.status, 'unknown');
  assert.equal(full.policy, null);
  assert.equal(full.hit, null);
  assert.equal(full.firstDecidableMatch.policy, 'proxy');
  assert.equal(full.unknownBlockers[0].index, 0);
  assert.equal(firstMatch(rules, { host: 'example.com', processName: 'browser' }).policy, 'proxy');
  assert.equal(firstMatch(rules, { host: 'example.com' }, { mode: 'domain-projection' }).policy, 'proxy');
});

test('connection field rules retain inbound-name case/list and unsigned UID ranges', () => {
  assert.equal(matchEntry('IN-NAME,A/B', { inboundName: 'A' }).status, 'match');
  assert.equal(matchEntry('IN-NAME,A/B', { inboundName: 'B' }).status, 'match');
  assert.equal(matchEntry('IN-NAME,A', { inboundName: 'a' }).status, 'no-match');
  assert.equal(matchEntry('IN-NAME, A / B ', { inboundName: 'B' }).status, 'match');
  assert.equal(matchEntry('UID,1000-2000', { uid: 1500 }).status, 'match');
  assert.equal(matchEntry('UID,1000-2000/3000', { uid: 3000 }).status, 'match');
  assert.equal(matchEntry('UID,1000-2000', { uid: 2001 }).status, 'no-match');
  assert.equal(matchEntry('UID,2000-1000', { uid: 1500 }).status, 'match', 'the core normalizes reversed range endpoints');
  assert.equal(matchEntry('UID,1000-2000', { uid: 1000 }).status, 'match');
  assert.equal(matchEntry('UID,1000-2000', { uid: 2000 }).status, 'match');
  assert.equal(matchEntry('IN-NAME,A/', { inboundName: 'A' }).status, 'unknown');
});

test('null or malformed connection fields cannot silently remove an earlier blocker', () => {
  for (const [rule, field, invalidValues] of [
    ['PROCESS-NAME,curl', 'processName', [null, '', 42, {}, []]],
    ['PROCESS-PATH,/usr/bin/curl', 'processPath', [null, '', 42]],
    ['DST-PORT,443', 'destinationPort', [null, '', '443', NaN, -1, 65536, 443.5]],
    ['SRC-PORT,443', 'sourcePort', [null, {}, true]],
    ['IN-PORT,443', 'inboundPort', [null, []]],
    ['IN-NAME,A', 'inboundName', [null, '', 42]],
    ['UID,1000-2000', 'uid', [null, 0, -1, 1.5, '1500', 4294967296]],
    ['NETWORK,tcp', 'network', [null, '', 42, 'invalid']],
    ['IP-CIDR,192.0.2.0/24', 'ip', [[], ['192.0.2.4'], {}, 3221225988]],
  ]) {
    for (const invalid of invalidValues) assert.equal(matchEntry(rule, { [field]: invalid }).status, 'unknown', `${rule} must reject ${String(invalid)} as unknown`);
  }
  const rules = model([{ rule: 'PROCESS-NAME,curl,DIRECT', policy: 'DIRECT' }, { id: 'later', entries: ['DOMAIN,example.com'], policy: 'proxy' }]);
  const route = firstMatch(rules, { host: 'example.com', processName: null });
  assert.equal(route.status, 'unknown');
  assert.equal(route.policy, null);
  assert.equal(route.firstDecidableMatch.policy, 'proxy');
  assert.equal(route.unknownBlockers[0].index, 0);
  const ipRules = model([{ id: 'ip', entries: ['IP-CIDR,192.0.2.0/24'], kind: 'ipcidr', policy: 'direct' }]);
  assert.equal(firstMatch(ipRules, { ip: ['192.0.2.4'] }).status, 'unknown', 'the provider index cannot coerce malformed IP metadata into a match');
});

test('RE2 expressions are never assumed to be JavaScript-compatible false or true', () => {
  const rules = model([{ id: 'early', entries: ['DOMAIN-REGEX,(?i)^example\\.com$'], policy: 'block' }, { id: 'later', entries: ['DOMAIN,example.com'], policy: 'proxy' }]);
  assert.equal(firstMatch(rules, { host: 'example.com' }, { mode: 'domain-projection' }).status, 'unknown');
  assert.match(firstMatch(rules, { host: 'example.com' }).unknownBlockers[0].reason, /RE2/);
});

test('nested Kleene logic can reject irrelevant missing fields but cannot erase a possible match', () => {
  const rule = 'AND,((PROCESS-NAME,Code Helper (Plugin)),(OR,((DOMAIN,api.github.com),(DOMAIN,api.githubcopilot.com))))';
  assert.equal(matchEntry(rule, { host: 'elsewhere.example' }).status, 'no-match');
  assert.equal(matchEntry(rule, { host: 'api.github.com' }).status, 'unknown');
  assert.equal(matchEntry(rule, { host: 'api.github.com', processName: 'Code Helper (Plugin)' }).status, 'match');
  assert.equal(matchEntry('NOT,((PROCESS-NAME,curl))', {}).status, 'unknown');
  assert.equal(matchEntry('NOT,((PROCESS-NAME,curl))', { host: 'example.com' }, { mode: 'domain-projection' }).status, 'no-match', 'excluded process condition must not become true through NOT');
  assert.equal(matchEntry('OR,((PROCESS-NAME,curl),(DOMAIN,example.com))', { host: 'example.com' }).status, 'match');
});

test('no-resolve, source IP and IPv6 preserve actual connection-field requirements', () => {
  assert.equal(matchEntry('IP-CIDR,192.0.2.0/24,no-resolve', { host: 'example.com' }).status, 'unknown');
  assert.equal(matchEntry('IP-CIDR,192.0.2.0/24,no-resolve', { host: 'example.com', resolution: 'unresolved' }).status, 'no-match');
  assert.equal(matchEntry('IP-CIDR,192.0.2.0/24', { host: 'example.com', resolution: 'unresolved' }).status, 'unknown');
  assert.equal(matchEntry('IP-CIDR,192.0.2.0/24,no-resolve', { ip: '192.0.2.4', resolution: 'resolved' }).status, 'match');
  assert.equal(matchEntry('IP-CIDR6,2001:db8::/126', { ip: '2001:db8::3' }).status, 'match');
  assert.equal(matchEntry('IP-CIDR6,2001:db8::/126', { ip: '2001:db8::4' }).status, 'no-match');
  assert.equal(matchEntry('SRC-IP-CIDR,192.0.2.0/24', { ip: '192.0.2.4' }).status, 'unknown');
  assert.equal(matchEntry('IP-CIDR,192.0.2.0/24,src', { ip: '192.0.2.4', sourceIp: '198.51.100.1' }).status, 'no-match');
  const cidrModel = model([{ id: 'ip', entries: ['IP-CIDR6,2001:db8::/126,no-resolve'], kind: 'ipcidr_no_resolve', policy: 'ip' }]);
  assert.equal(firstMatch(cidrModel, { ip: '2001:db8::3' }).policy, 'ip');
  assert.equal(firstMatch(cidrModel, { host: 'example.com' }).status, 'unknown');
  const modifiedProvider = model([{ id: 'normal-ip', rule: 'RULE-SET,normal-ip,ip,no-resolve', entries: ['IP-CIDR,192.0.2.0/24'], kind: 'ipcidr', policy: 'ip' }]);
  assert.equal(firstMatch(modifiedProvider, { host: 'example.com', resolution: 'unresolved' }).status, 'no-match', 'RULE-SET no-resolve modifier applies to destination-IP predicates');
  const sourceProvider = model([{ id: 'src', entries: ['IP-CIDR,192.0.2.0/24,src'], kind: 'residual', policy: 'src' }]);
  assert.equal(firstMatch(sourceProvider, { ip: '192.0.2.4' }).status, 'unknown');
  assert.equal(entryWitnesses('IP-CIDR6,2001:db8::/126').length, 4);
});

test('cross-policy suffix overlap reports the earlier winner and changed shadowed route', () => {
  const before = model([{ id: 'broad', entries: ['DOMAIN-SUFFIX,example.com'], policy: 'block' }, { id: 'specific', entries: ['DOMAIN,api.example.com'], policy: 'tools' }]);
  const after = model([{ id: 'specific', entries: ['DOMAIN,api.example.com'], policy: 'tools' }, { id: 'broad', entries: ['DOMAIN-SUFFIX,example.com'], policy: 'block' }]);
  const report = compareRepositories(before, after, { probes: ['api.example.com'] });
  assert.equal(report.routes[0].before.policy, 'block');
  assert.equal(report.routes[0].after.policy, 'tools');
  assert.ok(report.coverage.crossPolicyOverlaps.some((row) => row.earlier.policy === 'block' && row.later.policy === 'tools'));
  assert.equal(report.summary.ruleOrderChanged, true);
  assert.equal(report.summary.changedProviders, 0);
  assert.equal(checkReport(report).ok, false);
  const approval = { beforeIdentity: before.identity, afterIdentity: after.identity, reviewedChangeDigest: digest(JSON.stringify({ changedProviders: report.changedProviders, ruleOrder: report.ruleOrder, entryChanges: report.entryChanges })) };
  assert.equal(checkReport(report, approval).ok, true);
  assert.equal(checkReport(report, { ...approval, beforeIdentity: 'old-approval' }).ok, false);
});

test('probe budget is visible and truncated or unknown changes cannot receive implicit approval', () => {
  const before = model([{ id: 'a', entries: ['DOMAIN,old.example'], policy: 'direct' }]);
  const after = model([{ id: 'a', entries: ['DOMAIN-SUFFIX,new.example'], policy: 'direct' }]);
  const report = compareRepositories(before, after, { maxProbes: 1 });
  assert.equal(report.budget.evaluated, 1);
  assert.equal(report.budget.truncated, true);
  assert.deepEqual(report.conversionTypes.DOMAIN, { added: 0, removed: 1 });
  assert.deepEqual(report.conversionTypes['DOMAIN-SUFFIX'], { added: 1, removed: 0 });
  const approval = { beforeIdentity: before.identity, afterIdentity: after.identity };
  assert.equal(checkReport(report, approval).ok, false);
  assert.equal(checkReport(report, { ...approval, reviewedChangeDigest: report.reviewedChangeDigest, reviewedEvidenceDigest: report.reviewedEvidenceDigest, acknowledgeTruncation: true }).ok, true, 'bounded evidence needs an explicit review, not permanent rejection of all refreshes');
});

test('unknown outcomes require an explicit digest acknowledgement even with matching change approval', () => {
  const before = model([{ rule: 'PROCESS-NAME,curl,direct', policy: 'direct' }, { id: 'a', entries: ['DOMAIN,old.example'], policy: 'proxy' }]);
  const after = model([{ rule: 'PROCESS-NAME,curl,direct', policy: 'direct' }, { id: 'a', entries: ['DOMAIN,new.example'], policy: 'proxy' }]);
  const report = compareRepositories(before, after, { mode: 'full' });
  const approval = { beforeIdentity: before.identity, afterIdentity: after.identity, reviewedChangeDigest: report.reviewedChangeDigest, reviewedEvidenceDigest: report.reviewedEvidenceDigest };
  assert.ok(report.undecidable.length);
  assert.equal(checkReport(report, approval).ok, false);
  assert.equal(checkReport(report, { ...approval, acknowledgedUndecidableDigest: report.undecidableDigest }).ok, true);
});

test('real frozen assets load in final order and expose bounded baseline/current evidence', () => {
  const root = path.resolve(__dirname, '../..');
  const current = loadRepository({ root });
  const baseline = loadRepository({ root, ref: 'HEAD' });
  const report = compareRepositories(baseline, current, { probes: ['api.github.com', 'linuxdo.org', 'www.wegame.com.cn'] });
  assert.ok(current.providers.size > 0);
  assert.equal(current.rules[0].rule, baseline.rules[0].rule, 'the early direct guard remains first');
  assert.equal(report.routes[0].after.policy, '🔧 工具与服务');
  assert.equal(report.routes[1].after.policy, '🏠 国内网站');
  assert.throws(() => loadRepository({ root, chronology: 'manifest' }), /complete chronology/);
});

test('CLI defaults to stdout and only writes its explicit report destination', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-ordered-'));
  try {
    fs.mkdirSync(path.join(root, 'rulesets/generated/fused/mihomo'), { recursive: true });
    fs.mkdirSync(path.join(root, 'Mihomo内核系/Clash Party'), { recursive: true });
    fs.writeFileSync(path.join(root, 'rulesets/generated/fused/manifest.json'), JSON.stringify({ authority: 'fixture', segments: [{ id: 's', policy: 'direct', files: { domain: { source: 's-domain.yaml' } } }] }));
    fs.writeFileSync(path.join(root, 'rulesets/generated/fused/mihomo/s-domain.yaml'), 'payload:\n  - "*.example.com"\n');
    fs.writeFileSync(path.join(root, 'Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js'), 'const MIHOMO_FUSED_RULES = ["RULE-SET,s-domain,direct"];\n');
    const loaded = loadRepository({ root });
    assert.equal(firstMatch(loaded, { host: 'example.com' }, { mode: 'domain-projection' }).status, 'no-match', 'domain-payload *. excludes root');
    assert.equal(firstMatch(loaded, { host: 'x.example.com' }, { mode: 'domain-projection' }).policy, 'direct');
    assert.equal(firstMatch(loaded, { host: 'a.x.example.com' }, { mode: 'domain-projection' }).status, 'no-match', 'behavior:domain wildcard * matches one label only');
    const manifestPath = path.join(root, 'rulesets/generated/fused/manifest.json');
    const metadata = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    metadata.generated_at = '2099-01-01';
    metadata.baseline_version = 'v99.0.0';
    fs.writeFileSync(manifestPath, JSON.stringify(metadata));
    assert.equal(loadRepository({ root }).identity, loaded.identity, 'real manifest metadata edits do not alter ordered semantic identity');
    const cli = path.resolve(__dirname, '../validate-ordered-rule-semantics.js');
    const args = [cli, '--current-root', root, '--baseline-root', root, '--check'];
    const stdout = JSON.parse(execFileSync(process.execPath, args, { encoding: 'utf8' }));
    assert.equal(stdout.check.ok, true);
    assert.equal(fs.existsSync(path.join(root, 'report.json')), false);
    execFileSync(process.execPath, [...args, '--output', path.join(root, 'report.json')]);
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'report.json'), 'utf8')).summary.hasChanges, false);
    assert.equal(spawnSync(process.execPath, [cli, '--baseline-root', root, '--baseline-ref', 'HEAD']).status, 2);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
