'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const originalRoot = path.resolve(__dirname, '../..');
// Publish the current source only into an isolated fixture HEAD. Maintenance
// edits in the user's real checkout must still fail the production reuse gate.
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-traffic-published-'));
test.after(() => fs.rmSync(root, { recursive: true, force: true }));
for (const directory of ['tools', 'rulesets/source', 'rulesets/supplemental', 'rulesets/generated/fused', 'Sing-box内核系/SingBox']) {
  fs.mkdirSync(path.dirname(path.join(root, directory)), { recursive: true });
  fs.cpSync(path.join(originalRoot, directory), path.join(root, directory), { recursive: true });
}
for (const file of ['Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml', 'Mihomo内核系/FlClash/FlClash(mihomo).js']) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.copyFileSync(path.join(originalRoot, file), path.join(root, file));
}
const fixtureGit = args => execFileSync('git', ['-c', 'core.safecrlf=false', ...args], { cwd: root, windowsHide: true, stdio: 'pipe' });
fixtureGit(['init', '-q']);
fixtureGit(['add', '--', 'rulesets/source']);
fixtureGit(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'published source fixture']);
const graph = require(path.join(root, 'rulesets/source/routing-graph'));
const { reuseSnapshotTopology, assertTrafficOnlySourceChange, assertSnapshotBinding, trafficSourceFingerprint, fusedPayloadReceipt } = require(path.join(root, 'tools/build-fused-rule-sets'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'rulesets/generated/fused/manifest.json'), 'utf8'));
function source(policy) {
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    const output = graph.buildMihomoRoutingGraph({ quicPolicy: policy });
    return { providers: output['rule-providers'], rules: output.rules, version: output.version };
  } finally { Math.random = originalRandom; }
}

test('both QUIC modes reuse exactly the published segment topology', () => {
  for (const policy of ['block-foreign', 'follow-rules']) {
    const output = source(policy);
    assertTrafficOnlySourceChange(output);
    const reused = reuseSnapshotTopology(output, manifest);
    assert.deepEqual(reused.segments.map(segment => segment.id), manifest.segments.map(segment => segment.id));
    assert.equal(reused.inlineRules.length, policy === 'block-foreign' ? 19 : 14);
  }
});

test('asset reuse rejects unrelated provider, rule and segment ownership changes', () => {
  const providerChange = source('block-foreign');
  providerChange.providers['anti-ad'].url = 'https://example.invalid/rules';
  assert.throws(() => assertTrafficOnlySourceChange(providerChange), /unchanged source providers/);
  const ruleChange = source('block-foreign');
  ruleChange.rules[ruleChange.rules.indexOf('DST-PORT,123,DIRECT')] = 'DST-PORT,124,DIRECT';
  assert.throws(() => assertTrafficOnlySourceChange(ruleChange), /only traffic preset changes/);
  const ownershipChange = source('block-foreign');
  ownershipChange.rules[0] = ownershipChange.rules[0].replace(/,DIRECT$/, ',REJECT');
  assert.throws(() => reuseSnapshotTopology(ownershipChange, manifest), /topology mismatch/);
});

test('snapshot reuse dry run leaves manifest and client files unchanged', () => {
  const files = ['rulesets/generated/fused/manifest.json', 'Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml', 'Mihomo内核系/FlClash/FlClash(mihomo).js'];
  const before = files.map(file => fs.readFileSync(path.join(root, file)));
  execFileSync(process.execPath, ['tools/build-fused-rule-sets.js', '--reuse-assets', '--dry-run'], { cwd: root, stdio: 'pipe' });
  files.forEach((file, index) => assert.deepEqual(fs.readFileSync(path.join(root, file)), before[index]));
});

test('snapshot binding accepts matching source and assets and rejects either mismatch', () => {
  const bound = { ...manifest, traffic_source_fingerprint: trafficSourceFingerprint(), payload_fingerprint: fusedPayloadReceipt().digest };
  const receipt = assertSnapshotBinding(bound);
  assert.equal(receipt.sourceFingerprint, bound.traffic_source_fingerprint);
  assert.equal(receipt.payloadFingerprint, bound.payload_fingerprint);
  assert.throws(() => assertSnapshotBinding({ ...bound, traffic_source_fingerprint: 'wrong' }), /full ruleset build is required/);
  assert.throws(() => assertSnapshotBinding({ ...bound, payload_fingerprint: 'wrong' }), /full ruleset build is required/);
});
