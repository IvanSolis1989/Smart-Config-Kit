'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const { assertGraphUnchanged, assertLocalDelta, assertSupplementalPath, assertFrozenSnapshot,
  patchSegmentDomains, patchNativeAssets } = require('../lib/snapshot-supplemental-patch');
const { parseArgs } = require('../apply-supplemental-to-snapshot');

const hosts = ['DOMAIN,a-api.anthropic.com', 'DOMAIN,a-cdn.anthropic.com'];
const graph = () => ({ raw: { 'rule-providers': { local: { url: 'https://example.test/local', interval: 86400 },
  remote: { url: 'https://example.test/remote', interval: 1234 } }, rules: ['RULE-SET,local,AI', 'RULE-SET,remote,AD'] },
normalized: { 'rule-providers': { local: { url: 'https://example.test/local.mrs', interval: 86400 },
  remote: { url: 'https://example.test/remote.mrs', interval: 1234 } }, rules: ['RULE-SET,local,AI', 'RULE-SET,remote,AD'] } });
const segment = (id, entries) => ({ id, policy: id, domain: entries, ipcidr: [], ipcidrNoResolve: [], residual: [] });

test('CLI defaults to dry-run and requires explicit --write', () => {
  const args = ['--baseline-ref', 'a'.repeat(40), '--provider', 'local', '--local-source', 'rulesets/supplemental/clash/local.list', '--add', hosts[0]];
  assert.equal(parseArgs(args).write, false);
  assert.equal(parseArgs([...args, '--write']).write, true);
  assert.throws(() => parseArgs([...args, '--add']), /Missing value/);
  assert.throws(() => parseArgs([...args, '--download']), /Unknown argument/);
});
test('provider definitions and policy order are immutable in raw and normalized graphs', () => {
  const baseline = graph(), current = graph();
  current.raw['rule-providers'].remote.interval = 4321;
  assert.doesNotThrow(() => assertGraphUnchanged(baseline, current));
  current.raw['rule-providers'].remote.url += '/changed';
  assert.throws(() => assertGraphUnchanged(baseline, current), /unchanged raw/);
  const reordered = graph(); reordered.normalized.rules.reverse();
  assert.throws(() => assertGraphUnchanged(baseline, reordered), /unchanged normalized/);
  const policy = graph(); policy.raw.rules[0] = 'RULE-SET,local,DIRECT';
  assert.throws(() => assertGraphUnchanged(baseline, policy), /policy and rule order/);
});
test('only the explicit typed DOMAIN payload delta is admitted', () => {
  const old = ['DOMAIN,keep.anthropic.com'];
  assert.doesNotThrow(() => assertLocalDelta(old, [...old, ...hosts], hosts, []));
  assert.throws(() => assertLocalDelta(old, [...old, ...hosts, 'DOMAIN,extra.anthropic.com'], hosts, []), /outside the explicit/);
  assert.throws(() => assertLocalDelta(old, [...old, 'DOMAIN-SUFFIX,anthropic.com'], ['DOMAIN-SUFFIX,anthropic.com'], []), /exact hosts/);
  assert.throws(() => assertLocalDelta(old, [...old, 'DOMAIN,A-API.anthropic.com'], ['DOMAIN,A-API.anthropic.com'], []), /canonical typed/);
  assert.throws(() => assertLocalDelta(old, [...old, ...hosts], [hosts[0], hosts[0]], []), /duplicate/);
});
test('source paths and baseline misalignment fail closed', () => {
  const root = path.resolve(__dirname, '../..');
  assert.throws(() => assertSupplementalPath(root, '../outside.list'), /explicit rulesets/);
  assert.throws(() => assertSupplementalPath(root, 'rulesets/supplemental/clash/../../outside.list'), /explicit rulesets/);
  assert.throws(() => assertSupplementalPath(root, 'C:/outside.list'), /explicit rulesets/);
  assert.throws(() => assertFrozenSnapshot(root, '0'.repeat(40)), /full current HEAD/);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-source-path-'));
  try {
    fs.mkdirSync(path.join(temp, 'rulesets/supplemental/clash'), { recursive: true });
    fs.writeFileSync(path.join(temp, 'rulesets/supplemental/clash/local.list'), hosts.join('\n'));
    assert.equal(assertSupplementalPath(temp, 'rulesets/supplemental/clash/local.list'), fs.realpathSync(path.join(temp, 'rulesets/supplemental/clash/local.list')));
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
test('snapshot fixture rejects changed or extra payloads before replay', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-frozen-fixture-'));
  try {
    for (const folder of ['mihomo', 'clash', 'surge', 'quantumultx', 'egern', 'sing-box']) {
      const directory = path.join(root, 'rulesets/generated/fused', folder);
      fs.mkdirSync(directory, { recursive: true }); fs.writeFileSync(path.join(directory, 'asset.list'), 'unchanged\n');
    }
    fs.mkdirSync(path.join(root, 'rulesets/generated/mihomo-mrs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'rulesets/generated/mihomo-mrs/manifest.json'), '{}\n');
    fs.writeFileSync(path.join(root, 'rulesets/generated/fused/manifest.json'), '{}\n');
    const git = args => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    git(['init']); git(['add', '.']);
    git(['-c', 'user.name=Snapshot Fixture', '-c', 'user.email=snapshot-fixture@example.invalid', 'commit', '-m', 'fixture']);
    const ref = git(['rev-parse', 'HEAD']).trim();
    assert.doesNotThrow(() => assertFrozenSnapshot(root, ref));
    const asset = path.join(root, 'rulesets/generated/fused/clash/asset.list');
    fs.writeFileSync(asset, 'changed\n');
    assert.throws(() => assertFrozenSnapshot(root, ref), /Snapshot differs from baseline/);
    fs.writeFileSync(asset, 'unchanged\n');
    fs.writeFileSync(path.join(root, 'rulesets/generated/fused/clash/extra.list'), 'unexpected\n');
    assert.throws(() => assertFrozenSnapshot(root, ref), /Unexpected snapshot asset/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('existing optimizer transfers only exact identities AD to AI', () => {
  const segments = [segment('AI', ['DOMAIN,keep.anthropic.com']), segment('AD', [...hosts,
    'DOMAIN-SUFFIX,other.anthropic.com', 'DOMAIN,x.a-api.anthropic.com']), segment('later', ['DOMAIN,stable.test'])];
  const changes = patchSegmentDomains(segments, 'AI', hosts, []);
  assert.deepEqual(changes, [{ id: 'AI', added: hosts, deleted: [] }, { id: 'AD', added: [], deleted: hosts }]);
  assert.deepEqual(segments[1].domain, ['DOMAIN-SUFFIX,other.anthropic.com', 'DOMAIN,x.a-api.anthropic.com']);
  assert.deepEqual(segments[2].domain, ['DOMAIN,stable.test']);
  assert.throws(() => patchSegmentDomains([segment('AI', [hosts[0]])], 'AI', [], [hosts[0]]), /cannot prove fallback/);
});
test('regression detects omitted global first-match deduplication', () => {
  const compiler = require('../build-fused-rule-sets');
  const original = compiler.removeGloballyRepeatedEntries;
  try {
    compiler.removeGloballyRepeatedEntries = () => 0;
    assert.throws(() => patchSegmentDomains([segment('AI', []), segment('AD', [...hosts])], 'AI', hosts, []), /shadowed or widened/);
  } finally { compiler.removeGloballyRepeatedEntries = original; }
});
test('shadowed additions and any optimizer deletion outside the delta are rejected', () => {
  assert.throws(() => patchSegmentDomains([segment('first', [hosts[0]]), segment('AI', [])], 'AI', [hosts[0]], []), /shadowed or widened/);
  assert.throws(() => patchSegmentDomains([segment('AI', ['DOMAIN-SUFFIX,test', 'DOMAIN,old.test'])], 'AI', [hosts[0]], []), /outside the patch/);
  const segments = [segment('AI', []), segment('first', ['DOMAIN,stable.test']), segment('later', ['DOMAIN,stable.test'])];
  assert.throws(() => patchSegmentDomains(segments, 'AI', [hosts[0]], []), /outside the patch/);
});
test('native assets retain every other typed identity and suffix semantics', () => {
  const base = 'rulesets/generated/fused';
  const row = { files: { clash: { file: 'ad.list' }, surge: { file: 'ad.list' }, quantumultx: { file: 'ad.list' },
    egern: { file: 'ad.yaml' }, sing_box: { source: 'ad.json' } } };
  const assets = new Map([
    [`${base}/clash/ad.list`, `${hosts.join('\n')}\nDOMAIN-SUFFIX,anthropic.com\nDOMAIN,x.a-api.anthropic.com\n`],
    [`${base}/surge/ad.list`, `${hosts.join('\n')}\nDOMAIN-SUFFIX,anthropic.com\nDOMAIN,x.a-api.anthropic.com\n`],
    [`${base}/quantumultx/ad.list`, 'host, a-api.anthropic.com\nhost, a-cdn.anthropic.com\nhost-suffix, anthropic.com\nhost, x.a-api.anthropic.com\n'],
    [`${base}/egern/ad.yaml`, 'no_resolve: true\ndomain_set:\n  - "a-api.anthropic.com"\n  - "a-cdn.anthropic.com"\n  - "x.a-api.anthropic.com"\ndomain_suffix_set:\n  - "anthropic.com"\n'],
    [`${base}/sing-box/ad.json`, JSON.stringify({ version: 3, rules: [{ domain: ['a-api.anthropic.com', 'a-cdn.anthropic.com', 'x.a-api.anthropic.com'], domain_suffix: ['anthropic.com'], ip_cidr: ['1.1.1.1/32'] }] })],
  ]);
  const output = patchNativeAssets({ row, change: { added: [], deleted: hosts }, read: file => Buffer.from(assets.get(file)) });
  assert.equal(output.get(`${base}/clash/ad.list`).toString(), 'DOMAIN-SUFFIX,anthropic.com\nDOMAIN,x.a-api.anthropic.com\n');
  assert.equal(output.get(`${base}/quantumultx/ad.list`).toString(), 'host-suffix, anthropic.com\nhost, x.a-api.anthropic.com\n');
  const sing = JSON.parse(output.get(`${base}/sing-box/ad.json`));
  assert.deepEqual(sing.rules[0], { domain: ['x.a-api.anthropic.com'], domain_suffix: ['anthropic.com'], ip_cidr: ['1.1.1.1/32'] });
  assert.match(output.get(`${base}/egern/ad.yaml`).toString(), /domain_suffix_set:\n  - "anthropic.com"/);
  assert.match(output.get(`${base}/egern/ad.yaml`).toString(), /^#.*\nno_resolve: true\n/);
});
