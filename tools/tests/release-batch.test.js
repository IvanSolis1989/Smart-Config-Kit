'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');
const { VERSION, createReleaseBatch, checkReleaseBatch, writeExternalJson, CONTRACT_PATH, inventoryFromManifests } = require('../lib/release-batch');
const { clientDirectory } = require('../lib/client-layout');
const cli = path.resolve(__dirname, '../validate-release-batch.js');
const hash = text => crypto.createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');
const SOURCE = 'rulesets/source/routing-graph.js';
const CMFA = 'Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml';
const PROFILE = '独立内核系/Egern/Egern.yaml';
const MRS = 'rulesets/generated/mihomo-mrs/manifest.json';
const FUSED = 'rulesets/generated/fused/manifest.json';
const EGERN = 'rulesets/generated/egern/manifest.json';
function fixture(t, { crlf = false, extraStaticOutputs = [] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-release-batch-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const save = (file, obj) => write(file, `${JSON.stringify(obj, null, 2)}\n`);
  git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  git('config', 'core.autocrlf', crlf ? 'true' : 'false');
  write(SOURCE, "const SOURCE_GRAPH_VERSION = 'v1.0.0';\n// BEGIN AUTO-GENERATED MIHOMO MRS OVERRIDES\nconst generated = 1;\n// END AUTO-GENERATED MIHOMO MRS OVERRIDES\n");
  write(CMFA, 'cmfa: original\n'); write(PROFILE, 'egern: original\n');
  for (const file of extraStaticOutputs) write(file, '{}\n');
  write('source-input.txt', 'frozen\n'); write('fixture-validator.js', "console.log('fixture validator passed');\n");
  const contract = { schemaVersion: 1, version: VERSION, purpose: 'upstream-refresh', sourceGraph: SOURCE,
    generatedSourceBlock: 'MIHOMO MRS OVERRIDES', manifests: { mrs: MRS, fused: FUSED, egern: EGERN },
    staticOutputs: [CMFA, PROFILE, ...extraStaticOutputs], validators: [['fixture-validator.js']] };
  save(CONTRACT_PATH, contract);
  const mrs = { converted: [{ id: 'old', generated: [{ behavior: 'domain', file: 'old.mrs' }] }], split: [], partial: [], failed: [] };
  const fused = { baseline_version: 'v1.0.0', asset_revision: 'v1.0.0', segments: [], unresolved_providers: [], unresolved_sources: [], passthrough_providers: [] };
  write('rulesets/generated/mihomo-mrs/old.mrs', 'binary-old');
  write('rulesets/generated/egern/geosite-cn.yaml', 'domain_set:\n  - fixture.invalid\n');
  const egern = { asset_revision: 'v1.0.0', source: {}, rendered: {}, assets: { files: [] } };
  function bind() {
    egern.source = { routing_graph_sha256: hash(read(SOURCE)), cmfa_sha256: hash(read(CMFA)) };
    egern.rendered = { profile_sha256: hash(read(PROFILE)) };
    const content = read('rulesets/generated/egern/geosite-cn.yaml').replace(/\r\n/g, '\n');
    egern.assets.files = [{ file: 'geosite-cn.yaml', bytes: Buffer.byteLength(content), sha256: hash(content) }];
    save(MRS, mrs); save(FUSED, fused); save(EGERN, egern);
  }
  bind(); git('add', '--', '.'); git('commit', '-qm', 'baseline');
  const prepare = () => createReleaseBatch({ repoRoot: root });
  const check = (receipt, mode = 'staged') => checkReleaseBatch({ repoRoot: root, receipt, mode });
  const stage = receipt => { if (receipt.changedPaths.length) git('--literal-pathspecs', 'add', '--', ...receipt.changedPaths); };
  return { root, git, write, read, save, prepare, check, stage, mrs, fused, egern, bind };
}

test('published repository contract and CLI use the supported release gate version', () => {
  const contract = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../..', CONTRACT_PATH), 'utf8'));
  assert.equal(contract.version, VERSION);
  assert.ok(contract.staticOutputs.includes('rulesets/generated/mihomo-mrs/source-ledger.json'), 'MRS source receipts must be covered by the release batch');
  assert.ok(contract.staticOutputs.includes('Sing-box内核系/SingBox/SingBox(sing-box)-full.json'));
  assert.ok(contract.staticOutputs.includes('Sing-box内核系/SingBox/SingBox(sing-box)-1.13.json'), 'Both generated sing-box schemas must be frozen in automatic refreshes');
  assert.ok(contract.staticOutputs.includes('Meow内核系/Aerove Lite/AeroveLite(meow).js'));
  assert.ok(contract.staticOutputs.includes('Meow内核系/Aerove Lite/adapter-manifest.json'), 'Candidate and provenance must refresh together');
  assert.ok(contract.validators.some(command => command[0] === 'tools/generate-aerove-meow.js' && command[1] === '--check'));
  const result = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.startsWith(`Release batch v${contract.version}:`));
});

test('automatic refresh freezes and requires both generated sing-box profiles', t => {
  const profiles = ['Sing-box内核系/SingBox/SingBox(sing-box)-full.json', 'Sing-box内核系/SingBox/SingBox(sing-box)-1.13.json'];
  const f = fixture(t, { extraStaticOutputs: profiles });
  for (const file of profiles) f.write(file, '{"revision":"updated-asset"}\n');
  const receipt = f.prepare();
  assert.deepEqual(receipt.changedPaths, [...profiles].sort());
  for (const file of profiles) {
    assert.ok(receipt.baselineOutputs.some(row => row.path === file));
    assert.ok(receipt.currentOutputs.some(row => row.path === file));
  }
  f.git('add', '--', profiles[0]);
  assert.throws(() => f.check(receipt), /Unstaged|partial stage|blob\/mode/);
  f.stage(receipt);
  assert.equal(f.check(receipt).ok, true);
});

test('no-op coverage is complete and validation never stages the workset', t => {
  const f = fixture(t); const receipt = f.prepare();
  assert.equal(receipt.currentOutputs.length, 8);
  assert.deepEqual(receipt.changedPaths, []);
  assert.equal(receipt.validations[0].passed, true);
  f.write(CMFA, 'cmfa: changed\n'); f.bind();
  const modified = f.prepare();
  assert.deepEqual(modified.changedPaths, [CMFA, EGERN].sort());
  assert.equal(f.git('diff', '--cached', '--name-only'), '');
  assert.throws(() => f.check(modified), /Unstaged|partial stage/);
  f.stage(modified); assert.equal(f.check(modified).ok, true);
});

for (const file of ['rulesets/generated/mihomo-mrs/unexpected.mrs', '独立内核系/Egern/unexpected.yaml', 'outside.txt', 'secret.env']) {
  test(`rejects unknown path without staging: ${file}`, t => {
    const f = fixture(t); f.write(file, 'sensitive fixture data\n');
    assert.throws(() => f.prepare(), /Unexpected changed path/);
    assert.equal(f.git('diff', '--cached', '--name-only'), '');
  });
}
test('staged outside file and rename across boundary are rejected', t => {
  const f = fixture(t); f.git('mv', '--', CMFA, 'moved.conf');
  assert.throws(() => f.prepare(), /Unexpected changed path/);
});
test('manifest-driven old asset deletion and new asset addition are accepted', t => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.root, 'rulesets/generated/mihomo-mrs/old.mrs'));
  f.mrs.converted = [{ id: 'new', generated: [{ behavior: 'domain', file: 'new.mrs' }] }];
  f.write('rulesets/generated/mihomo-mrs/new.mrs', 'binary-new'); f.bind();
  const receipt = f.prepare();
  assert(receipt.changedPaths.includes('rulesets/generated/mihomo-mrs/old.mrs'));
  assert(receipt.changedPaths.includes('rulesets/generated/mihomo-mrs/new.mrs'));
  assert(receipt.baselineOutputs.some(row => row.path.endsWith('/old.mrs')));
  assert(receipt.currentOutputs.some(row => row.path.endsWith('/new.mrs')));
  f.stage(receipt); assert.equal(f.check(receipt).ok, true);
  f.git('commit', '-qm', 'generated batch'); assert.equal(f.check(receipt, 'committed').ok, true);
});
test('both manifest rename paths must be valid and cannot widen the allowlist', t => {
  const f = fixture(t);
  f.mrs.converted[0].generated[0].file = '../escaped.mrs'; f.bind();
  assert.throws(() => f.prepare(), /filename does not match provider/);
});
test('fused manifest derives precise native/source/shunt output names for a new segment', t => {
  const f = fixture(t); const id = 'scki-fused-001-direct';
  const files = { domain: { file: `${id}-domain.mrs`, source: `${id}-domain.yaml` },
    clash: { file: `${id}.list` }, surge: { file: `${id}.list` }, quantumultx: { file: `${id}.list` },
    egern: { file: `${id}.yaml` }, sing_box: { file: `${id}.srs`, source: `${id}.json` },
    passwall: { file: `${id}.list`, source: `sing-box/${id}.srs` },
    xray: { file: 'Xray内核系/v2rayN/v2rayN(xray).json', source: `sing-box/${id}.json` } };
  f.fused.segments = [{ id, files }];
  for (const [family, names] of Object.entries({ mihomo: [`${id}-domain.mrs`, `${id}-domain.yaml`],
    clash: [`${id}.list`], surge: [`${id}.list`], quantumultx: [`${id}.list`], egern: [`${id}.yaml`],
    'sing-box': [`${id}.srs`, `${id}.json`], passwall: [`${id}.list`] })) {
    for (const name of names) f.write(`rulesets/generated/fused/${family}/${name}`, `fixture ${name}\n`);
  }
  for (const app of ['Passwall', 'Passwall2']) f.write(`${clientDirectory(app)}/shunt-rules/${id}.list`, 'fixture shunt\n');
  f.bind(); const receipt = f.prepare();
  assert.equal(receipt.currentOutputs.length - receipt.baselineOutputs.length, 11);
  f.stage(receipt); assert.equal(f.check(receipt).ok, true);
  files.domain.source = 'unexpected.yaml'; f.bind();
  assert.throws(() => f.prepare(), /Missing fused source/);
});

test('optional Karing manifest contributes exact generated source assets to release inventory', t => {
  const f = fixture(t);
  const contract = JSON.parse(f.read(CONTRACT_PATH));
  const manifestPath = `${clientDirectory('Karing')}/adapter-manifest.json`;
  contract.manifests.karing = manifestPath;
  contract.staticOutputs.push(`${clientDirectory('Karing')}/diversion_rules_custom.json`, manifestPath);
  const source = 'rulesets/generated/karing/compound-001.json';
  f.save(manifestPath, { rule_assets: [{ kind: 'generated', path: source }, { kind: 'reused', url: 'https://example.invalid/existing.srs' }] });
  const read = file => Buffer.from(f.read(file));
  assert.ok(inventoryFromManifests(contract, read).paths.includes(source));
  f.save(manifestPath, { rule_assets: [{ kind: 'generated', path: 'rulesets/generated/karing/../outside.json' }] });
  assert.throws(() => inventoryFromManifests(contract, read), /Unsafe|Karing/);
  f.save(manifestPath, { rule_assets: [{ kind: 'generated', path: 'rulesets/generated/fused/outside.json' }] });
  assert.throws(() => inventoryFromManifests(contract, read), /Karing/);
});
test('baseline manifest inventory is frozen and detects undeclared tracked assets', t => {
  const f = fixture(t); f.write('rulesets/generated/mihomo-mrs/undeclared.mrs', 'fixture\n');
  f.git('add', '--', 'rulesets/generated/mihomo-mrs/undeclared.mrs'); f.git('commit', '-qm', 'bad baseline fixture');
  assert.throws(() => f.prepare(), /Baseline generated inventory/);
});
test('Egern asset content must match declared bytes/hash before creating a receipt', t => {
  const f = fixture(t); f.write('rulesets/generated/egern/geosite-cn.yaml', 'domain_set:\n  - tamperx.invalid\n');
  assert.throws(() => f.prepare(), /Egern asset binding/);
});
test('missing output and obsolete leftover cannot form a complete batch', t => {
  const f = fixture(t); fs.unlinkSync(path.join(f.root, 'rulesets/generated/mihomo-mrs/old.mrs'));
  assert.throws(() => f.prepare(), /inventory|Missing output/);
});
test('receipt rejects equal-length tampering, including an unchanged output', t => {
  const f = fixture(t); const receipt = f.prepare();
  f.write('rulesets/generated/mihomo-mrs/old.mrs', 'binary-bad');
  assert.throws(() => f.check(receipt), /Changed path set|coverage\/hash/);
  f.write('rulesets/generated/mihomo-mrs/old.mrs', 'binary-old');
  f.write(CMFA, 'cmfa: modified\n'); f.bind(); const next = f.prepare(); f.stage(next);
  f.write(CMFA, 'cmfa: tampered\n'); f.bind(); f.stage(next);
  assert.throws(() => f.check(next), /coverage\/hash/);
});
test('partial stage and new untracked path after receipt fail', t => {
  const f = fixture(t); f.write(CMFA, 'cmfa: changed\n'); f.bind(); const receipt = f.prepare();
  f.git('add', '--', CMFA); assert.throws(() => f.check(receipt), /Unstaged|blob\/mode|partial stage/);
  f.stage(receipt); f.write('late-secret.env', 'fake secret\n');
  assert.throws(() => f.check(receipt), /Unexpected changed path/);
});
test('receipt is bound to baseline and frozen contract/source graph', t => {
  const f = fixture(t); const receipt = f.prepare();
  const forged = { ...receipt, baseCommit: '0'.repeat(40) }; assert.throws(() => f.check(forged), /HEAD moved/);
  f.write(SOURCE, f.read(SOURCE).replace('v1.0.0', 'v1.0.1')); f.bind();
  assert.throws(() => f.prepare(), /outside its generated/);
  f.write(CONTRACT_PATH, f.read(CONTRACT_PATH).replace('upstream-refresh', 'other'));
  assert.throws(() => f.prepare(), /contract must be frozen/);
});
test('generated source block can change while its surrounding source stays frozen', t => {
  const f = fixture(t); f.write(SOURCE, f.read(SOURCE).replace('generated = 1', 'generated = 2')); f.bind();
  const receipt = f.prepare(); f.stage(receipt); assert.equal(f.check(receipt).ok, true);
});
test('CRLF worktree and LF blobs survive exact staging with filters', t => {
  const f = fixture(t, { crlf: true });
  f.write(CMFA, 'cmfa: changed\r\n'); f.bind();
  const receipt = f.prepare(); const current = receipt.currentOutputs.find(row => row.path === CMFA);
  const before = receipt.baselineOutputs.find(row => row.path === CMFA);
  assert.notEqual(current.sha256, before.sha256);
  f.stage(receipt); assert.equal(f.check(receipt).ok, true);
});
test('NUL Git paths reject unexpected filenames with whitespace without interpreting them', t => {
  const f = fixture(t); f.write('private odd name.txt', 'fixture\n');
  assert.throws(() => f.prepare(), /Unexpected changed path: private odd name.txt/);
});
test('mode changes and symlink entries cannot enter a release', t => {
  const f = fixture(t); f.git('update-index', '--chmod=+x', CMFA);
  assert.throws(() => f.prepare(), /Mode change/);
  f.git('update-index', '--chmod=-x', CMFA);
  // An index symlink is portable even on Windows without symlink privileges.
  const oid = f.git('hash-object', '-w', '--stdin');
  f.git('update-index', '--cacheinfo', `120000,${oid},${CMFA}`);
  assert.throws(() => f.prepare(), /Symlink\/submodule/);
});
test('validator failure or repository mutation prevents receipt creation', t => {
  const f = fixture(t);
  assert.throws(() => createReleaseBatch({ repoRoot: f.root, runValidators: () => [{ passed: false }] }), /pass evidence/);
  assert.throws(() => createReleaseBatch({ repoRoot: f.root, runValidators: () => {
    f.write(CMFA, 'cmfa: changed\n'); f.bind(); return [{ passed: true }];
  } }), /changed during release validation/);
});
test('CLI produces only external receipts and performs no automatic stage', t => {
  const f = fixture(t); const external = path.join(os.tmpdir(), `scki-receipt-${crypto.randomUUID()}.json`);
  t.after(() => fs.rmSync(external, { force: true }));
  const result = spawnSync(process.execPath, [cli, '--repo-root', f.root, '--output', external], { encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr); assert(fs.existsSync(external));
  assert.equal(f.git('status', '--porcelain'), '');
  assert.throws(() => writeExternalJson(f.root, path.join(f.root, 'receipt.json'), {}), /outside the repository/);
  assert(!fs.existsSync(path.join(f.root, 'receipt.json')));
  const check = spawnSync(process.execPath, [cli, '--repo-root', f.root, '--check', '--receipt', external], { encoding: 'utf8', windowsHide: true });
  assert.equal(check.status, 0, check.stderr);
});
