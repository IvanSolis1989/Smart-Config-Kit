'use strict';

// File-level upstream refresh gate v1.0.0. This module never stages or commits.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');

const VERSION = '1.0.0';
const CONTRACT_PATH = 'rulesets/source/release-batch-contract.json';
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const normalized = bytes => Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
const sorted = values => [...new Set(values)].sort();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function assert(ok, message) { if (!ok) throw new Error(message); }
function safePath(file) {
  assert(typeof file === 'string' && file.length > 0 && !/[\x00-\x1f\\:*?"<>|]/.test(file)
    && !file.startsWith('/') && !file.split('/').some(p => p === '' || p === '.' || p === '..' || p === '.git'), `Unsafe path: ${JSON.stringify(file)}`);
  return file;
}
function git(root, args, input) {
  return execFileSync('git', args, { cwd: root, input, maxBuffer: 256 * 1024 * 1024, windowsHide: true,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' }, stdio: ['pipe', 'pipe', 'pipe'] });
}
const zpaths = buffer => buffer.toString('utf8').split('\0').filter(Boolean);
function resolveCommit(root, ref) { return git(root, ['rev-parse', '--verify', `${ref}^{commit}`]).toString().trim(); }
function tree(root, ref) {
  const map = new Map();
  for (const row of zpaths(git(root, ['ls-tree', '-r', '-z', ref]))) {
    const match = /^(\d+) (\w+) ([0-9a-f]+)\t([\s\S]+)$/.exec(row);
    assert(match, 'Invalid Git tree entry');
    map.set(match[4], { mode: match[1], type: match[2], blob: match[3] });
  }
  return map;
}
function indexTree(root) {
  const map = new Map();
  for (const row of zpaths(git(root, ['ls-files', '--stage', '-z']))) {
    const match = /^(\d+) ([0-9a-f]+) (\d)\t([\s\S]+)$/.exec(row);
    assert(match && match[3] === '0', 'Unmerged index is not a release batch');
    map.set(match[4], { mode: match[1], type: 'blob', blob: match[2] });
  }
  return map;
}
function readBlobs(root, entries) {
  const ids = sorted(entries.map(row => row.blob));
  const result = git(root, ['cat-file', '--batch'], ids.join('\n') + '\n');
  const blobs = new Map(); let offset = 0;
  for (const id of ids) {
    const end = result.indexOf(10, offset);
    const [actual, type, size] = result.subarray(offset, end).toString().split(' ');
    assert(actual === id && type === 'blob' && /^\d+$/.test(size), 'Invalid Git blob response');
    offset = end + 1; const count = Number(size);
    blobs.set(id, result.subarray(offset, offset + count)); offset += count + 1;
  }
  return blobs;
}
function gitReader(root, inventory) {
  // Manifests are read first; output blobs are then loaded in one batch.
  return file => {
    safePath(file); const row = inventory.get(file);
    assert(row && row.type === 'blob' && /^100(644|755)$/.test(row.mode), `Missing/nonregular tracked output: ${file}`);
    return git(root, ['cat-file', 'blob', row.blob]);
  };
}
function workReader(root) {
  return file => {
    safePath(file); let cursor = root;
    for (const part of file.split('/')) {
      cursor = path.join(cursor, part);
      assert(fs.existsSync(cursor), `Missing output: ${file}`);
      assert(!fs.lstatSync(cursor).isSymbolicLink(), `Symlink is forbidden: ${file}`);
    }
    assert(fs.statSync(cursor).isFile(), `Nonregular output: ${file}`);
    return fs.readFileSync(cursor);
  };
}
function json(read, file) { return JSON.parse(read(file).toString('utf8')); }
function leaf(file, pattern) { assert(typeof file === 'string' && pattern.test(file), `Illegal manifest filename: ${file}`); return file; }
function inventoryFromManifests(contract, read) {
  assert(contract.schemaVersion === 1 && contract.version === VERSION && contract.purpose === 'upstream-refresh', 'Unsupported release contract');
  const files = new Set([...contract.staticOutputs, contract.sourceGraph, ...Object.values(contract.manifests)].map(safePath));
  assert(files.size === contract.staticOutputs.length + 4, 'Duplicate contract outputs');
  const mrs = json(read, contract.manifests.mrs);
  for (const bucket of ['converted', 'split', 'partial']) {
    assert(Array.isArray(mrs[bucket]), `Missing MRS ${bucket}`);
    for (const row of mrs[bucket]) {
      leaf(row.id, /^[a-z0-9][a-z0-9._-]*$/);
      assert(Array.isArray(row.generated) && row.generated.length > 0, `Missing MRS outputs: ${row.id}`);
      for (const asset of row.generated) {
        assert(['domain', 'ipcidr'].includes(asset.behavior), 'Unsupported MRS behavior');
        const expected = bucket === 'converted' ? `${row.id}.mrs` : `${row.id}-${asset.behavior}.mrs`;
        assert(asset.file === expected, `MRS filename does not match provider: ${asset.file}`);
        files.add(`rulesets/generated/mihomo-mrs/${asset.file}`);
      }
      if (row.residual) {
        assert(bucket === 'partial' && row.residual.file === `${row.id}-classical.yaml`, 'Invalid MRS residual');
        files.add(`rulesets/generated/mihomo-mrs/${row.residual.file}`);
      }
    }
  }
  assert(Array.isArray(mrs.failed) && mrs.failed.length === 0, 'MRS manifest reports failures');
  const fused = json(read, contract.manifests.fused);
  assert(Array.isArray(fused.segments), 'Missing fused segments');
  for (const key of ['unresolved_providers', 'unresolved_sources', 'passthrough_providers'])
    assert(Array.isArray(fused[key]) && fused[key].length === 0, `Fused manifest ${key} is not empty`);
  assert((fused.required_support_providers || []).length === 0, 'Support-provider assets require an explicit contract revision');
  const ids = new Set();
  const dimensions = { domain: ['mihomo', '-domain.mrs', '-domain.yaml'], ipcidr: ['mihomo', '-ipcidr.mrs', '-ipcidr.yaml'],
    ipcidr_no_resolve: ['mihomo', '-ipcidr-no-resolve.mrs', '-ipcidr-no-resolve.yaml'], residual: ['mihomo', '-residual.yaml'],
    clash: ['clash', '.list'], surge: ['surge', '.list'], quantumultx: ['quantumultx', '.list'],
    egern: ['egern', '.yaml'], sing_box: ['sing-box', '.srs', '.json'], passwall: ['passwall', '.list'] };
  for (const segment of fused.segments) {
    leaf(segment.id, /^scki-fused-\d{3}-[a-z0-9-]+$/);
    assert(!ids.has(segment.id), 'Duplicate fused segment'); ids.add(segment.id);
    assert(segment.files && typeof segment.files === 'object', 'Missing fused file records');
    for (const [bucket, asset] of Object.entries(segment.files)) {
      if (bucket === 'xray') {
        assert(asset.file === 'v2rayN/v2rayN(xray).json' && asset.source === `sing-box/${segment.id}.json`, 'Invalid Xray file mapping');
        continue;
      }
      const spec = dimensions[bucket]; assert(spec, `Unknown fused dimension: ${bucket}`);
      assert(asset.file === `${segment.id}${spec[1]}`, `Fused filename mismatch: ${asset.file}`);
      files.add(`rulesets/generated/fused/${spec[0]}/${asset.file}`);
      if (spec[2]) {
        assert(asset.source === `${segment.id}${spec[2]}`, `Missing fused source: ${segment.id}/${bucket}`);
        files.add(`rulesets/generated/fused/${spec[0]}/${asset.source}`);
      } else if (bucket === 'passwall') {
        assert(asset.source === `sing-box/${segment.id}.srs`, 'Invalid Passwall source');
        for (const app of ['Passwall', 'Passwall2']) files.add(`${app}/shunt-rules/${asset.file}`);
      } else assert(!asset.source, `Unexpected source mapping: ${bucket}`);
    }
  }
  const egern = json(read, contract.manifests.egern);
  assert(Array.isArray(egern.assets?.files), 'Missing Egern assets');
  for (const asset of egern.assets.files) {
    leaf(asset.file, /^(?:geosite-[a-z0-9-]+|provider-scki-fused-\d{3}-[a-z0-9-]+)\.yaml$/);
    files.add(`rulesets/generated/egern/${asset.file}`);
  }
  return { paths: sorted(files), mrs, fused, egern };
}
function stripGeneratedBlock(bytes, block) {
  const text = normalized(bytes).toString();
  const begin = `// BEGIN AUTO-GENERATED ${block}`; const end = `// END AUTO-GENERATED ${block}`;
  const start = text.indexOf(begin); const finish = text.indexOf(end);
  assert(start >= 0 && finish > start && text.indexOf(begin, start + 1) < 0 && text.indexOf(end, finish + 1) < 0,
    'Source graph must have exactly one generated block');
  return text.slice(0, start) + text.slice(finish + end.length);
}
function record(file, bytes, row, blob) {
  return { path: file, mode: row.mode, blob: blob || row.blob, bytes: bytes.length, sha256: sha256(bytes) };
}
function baselineCoverage(root, inventory, files) {
  const rows = files.map(file => { const row = inventory.get(file); assert(row && /^100(644|755)$/.test(row.mode), `Missing/nonregular baseline output: ${file}`); return row; });
  const blobs = readBlobs(root, rows);
  return files.map((file, i) => record(file, blobs.get(rows[i].blob), rows[i]));
}
function workCoverage(root, inventory, files, read) {
  const oids = git(root, ['hash-object', '--stdin-paths'], files.join('\n') + '\n').toString().trim().split('\n');
  assert(oids.length === files.length, 'Git output hash count mismatch');
  return files.map((file, i) => record(file, read(file), inventory.get(file) || { mode: '100644' }, oids[i]));
}
function checkBindings(contract, manifests, read) {
  const { fused, egern } = manifests;
  const source = normalized(read(contract.sourceGraph)).toString();
  const version = /const SOURCE_GRAPH_VERSION = ['"]([^'"]+)/.exec(source)?.[1];
  assert(version && fused.baseline_version === version && fused.asset_revision === egern.asset_revision, 'Source graph / derived manifest version binding failed');
  const bindings = [[egern.source?.routing_graph_sha256, contract.sourceGraph],
    [egern.source?.cmfa_sha256, 'Clash Meta For Android/CMFA(mihomo).yaml'], [egern.rendered?.profile_sha256, 'Egern/Egern.yaml']];
  for (const [hash, file] of bindings) assert(hash === sha256(normalized(read(file))), `Egern source binding failed: ${file}`);
  for (const asset of egern.assets.files) {
    const bytes = normalized(read(`rulesets/generated/egern/${asset.file}`));
    assert(asset.sha256 === sha256(bytes) && asset.bytes === bytes.length, `Egern asset binding failed: ${asset.file}`);
  }
}
function changedPaths(root, base) {
  return sorted([...zpaths(git(root, ['diff', '--name-only', '--no-renames', '-z', base, '--'])),
    ...zpaths(git(root, ['diff', '--name-only', '--no-renames', '-z', '--'])),
    ...zpaths(git(root, ['ls-files', '--others', '--exclude-standard', '-z']))]);
}
const ASSET_DIRECTORIES = ['rulesets/generated/mihomo-mrs', 'rulesets/generated/fused', 'rulesets/generated/egern',
  'rulesets/supplemental/egern', 'Passwall/shunt-rules', 'Passwall2/shunt-rules'];
function assertInventoryCoverage(root, beforeTree, before, current) {
  const covered = file => ASSET_DIRECTORIES.some(dir => file.startsWith(`${dir}/`));
  assert(same(sorted([...beforeTree.keys()].filter(covered)), before.paths.filter(covered)),
    'Baseline generated inventory differs from manifest/contract');
  const actual = [];
  function walk(dir) {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) return;
    assert(!fs.lstatSync(full).isSymbolicLink(), `Symlink is forbidden: ${dir}`);
    for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
      const file = `${dir}/${entry.name}`;
      assert(!entry.isSymbolicLink(), `Symlink is forbidden: ${file}`);
      if (entry.isDirectory()) walk(file); else actual.push(file);
    }
  }
  ASSET_DIRECTORIES.forEach(walk);
  assert(same(sorted(actual), current.paths.filter(covered)), 'Current generated inventory differs from manifest/contract');
}
function assertModes(root, base, allowed) {
  for (const args of [['diff', '--raw', '--no-renames', '-z', base, '--'], ['diff', '--raw', '--no-renames', '-z', '--']]) {
    const rows = zpaths(git(root, args));
    for (let i = 0; i < rows.length; i += 2) {
      const [before, after] = rows[i].slice(1).split(' ');
      assert(allowed.has(rows[i + 1]), `Unexpected changed path: ${rows[i + 1]}`);
      assert((before === '000000' || /^100(644|755)$/.test(before)) && (after === '000000' || /^100(644|755)$/.test(after)), 'Symlink/submodule is forbidden');
      assert(before === '000000' || after === '000000' || before === after, `Mode change is forbidden: ${rows[i + 1]}`);
    }
  }
}
function loadContract(root, baseInventory) {
  const read = workReader(root); const bytes = read(CONTRACT_PATH);
  const before = gitReader(root, baseInventory)(CONTRACT_PATH);
  assert(same(normalized(bytes).toString(), normalized(before).toString()), 'Release contract must be frozen in the baseline');
  return { contract: JSON.parse(bytes.toString()), contractSha256: sha256(normalized(bytes)) };
}
function runContractValidators(root, contract) {
  assert(Array.isArray(contract.validators), 'Missing contract validators');
  return contract.validators.map(args => {
    assert(Array.isArray(args) && args.length && args.every(arg => typeof arg === 'string'), 'Invalid validator command');
    safePath(args[0]);
    const result = spawnSync(process.execPath, args, { cwd: root, windowsHide: true, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } });
    assert(!result.error && result.status === 0, `Validator failed: node ${args.join(' ')}\n${result.stderr || result.stdout || result.error}`);
    return { command: ['node', ...args], passed: true, stdoutSha256: sha256(Buffer.from(result.stdout)), stderrSha256: sha256(Buffer.from(result.stderr)) };
  });
}
function inspect(root, base) {
  const beforeTree = tree(root, base); const { contract, contractSha256 } = loadContract(root, beforeTree);
  const beforeRead = gitReader(root, beforeTree); const currentRead = workReader(root);
  const before = inventoryFromManifests(contract, beforeRead); const current = inventoryFromManifests(contract, currentRead);
  const allowed = new Set([...before.paths, ...current.paths]); const changed = changedPaths(root, base);
  for (const file of changed) assert(allowed.has(file), `Unexpected changed path: ${file}`);
  assertModes(root, base, allowed);
  assertInventoryCoverage(root, beforeTree, before, current);
  assert(stripGeneratedBlock(beforeRead(contract.sourceGraph), contract.generatedSourceBlock) === stripGeneratedBlock(currentRead(contract.sourceGraph), contract.generatedSourceBlock),
    'Source graph changed outside its generated MRS block');
  // A removed manifest output must be absent, rather than left as an orphan.
  for (const file of before.paths.filter(file => !current.paths.includes(file))) assert(!fs.existsSync(path.join(root, file)), `Obsolete output still exists: ${file}`);
  checkBindings(contract, current, currentRead);
  return { contract, contractSha256, changedPaths: changed,
    baselineOutputs: baselineCoverage(root, beforeTree, before.paths),
    currentOutputs: workCoverage(root, indexTree(root), current.paths, currentRead) };
}
function createReleaseBatch({ repoRoot, baselineRef = 'HEAD', runValidators = runContractValidators } = {}) {
  const root = fs.realpathSync(repoRoot || path.resolve(__dirname, '../..'));
  assert(fs.realpathSync(git(root, ['rev-parse', '--show-toplevel']).toString().trim()) === root, 'repoRoot must be the Git worktree root');
  const base = resolveCommit(root, baselineRef);
  assert(base === resolveCommit(root, 'HEAD'), 'Before-stage baseline must be current HEAD');
  const initial = inspect(root, base);
  const validations = runValidators(root, initial.contract);
  assert(validations.length === initial.contract.validators.length && validations.every(row => row.passed === true), 'Missing validator pass evidence');
  const final = inspect(root, base);
  assert(same(initial, final), 'Repository changed during release validation');
  return { schemaVersion: 1, version: VERSION, purpose: 'upstream-refresh', baseCommit: base,
    contractSha256: final.contractSha256, changedPaths: final.changedPaths,
    baselineOutputs: final.baselineOutputs, currentOutputs: final.currentOutputs, validations,
    coverageSha256: sha256(Buffer.from(JSON.stringify([final.baselineOutputs, final.currentOutputs]))) };
}
function checkReleaseBatch({ repoRoot, receipt, mode = 'staged', baselineRef } = {}) {
  const root = fs.realpathSync(repoRoot || path.resolve(__dirname, '../..'));
  assert(fs.realpathSync(git(root, ['rev-parse', '--show-toplevel']).toString().trim()) === root, 'repoRoot must be the Git worktree root');
  assert(receipt?.schemaVersion === 1 && receipt.version === VERSION && receipt.purpose === 'upstream-refresh', 'Invalid release batch receipt');
  assert(/^[0-9a-f]{40,64}$/.test(receipt.baseCommit), 'Invalid receipt baseline');
  if (baselineRef) assert(resolveCommit(root, baselineRef) === receipt.baseCommit, 'Receipt baseline mismatch');
  const head = resolveCommit(root, 'HEAD');
  assert(['staged', 'committed'].includes(mode), 'Check mode must be staged or committed');
  if (mode === 'staged') assert(head === receipt.baseCommit, 'HEAD moved after before-stage check');
  else assert(git(root, ['rev-list', '--parents', '-n', '1', head]).toString().trim() === `${head} ${receipt.baseCommit}`, 'Committed batch must have exactly the approved baseline parent');
  const actual = inspect(root, receipt.baseCommit);
  assert(receipt.contractSha256 === actual.contractSha256, 'Receipt contract binding changed');
  assert(same(receipt.changedPaths, actual.changedPaths), 'Changed path set differs from receipt');
  assert(same(receipt.baselineOutputs, actual.baselineOutputs) && same(receipt.currentOutputs, actual.currentOutputs), 'Output coverage/hash differs from receipt');
  assert(receipt.coverageSha256 === sha256(Buffer.from(JSON.stringify([actual.baselineOutputs, actual.currentOutputs]))), 'Receipt coverage binding mismatch');
  assert(Array.isArray(receipt.validations) && receipt.validations.length === actual.contract.validators.length
    && receipt.validations.every((row, i) => row.passed === true && same(row.command, ['node', ...actual.contract.validators[i]])), 'Receipt validator evidence mismatch');
  assert(zpaths(git(root, ['diff', '--name-only', '-z', '--'])).length === 0, 'Unstaged changes remain after staging');
  assert(zpaths(git(root, ['ls-files', '--others', '--exclude-standard', '-z'])).length === 0, 'Untracked changes remain after staging');
  const candidate = mode === 'staged' ? indexTree(root) : tree(root, head);
  const candidatePaths = zpaths(git(root, ['diff', ...(mode === 'staged' ? ['--cached'] : []), '--name-only', '--no-renames', '-z', receipt.baseCommit,
    ...(mode === 'committed' ? [head] : []), '--'])).sort();
  assert(same(candidatePaths, receipt.changedPaths), 'Staged/committed path set differs from receipt (partial stage)');
  for (const row of actual.currentOutputs) assert(candidate.get(row.path)?.blob === row.blob && candidate.get(row.path)?.mode === row.mode, `Candidate blob/mode differs: ${row.path}`);
  if (mode === 'committed') assert(zpaths(git(root, ['diff', '--cached', '--name-only', '-z', head, '--'])).length === 0, 'Index differs from committed batch');
  return { ok: true, mode, baseCommit: receipt.baseCommit, candidateCommit: mode === 'committed' ? head : null, changedPaths: receipt.changedPaths, coverageSha256: receipt.coverageSha256 };
}
function writeExternalJson(repoRoot, output, value) {
  assert(path.isAbsolute(output), '--output must be an explicit absolute path outside the repository');
  const target = path.resolve(output); const root = fs.realpathSync(repoRoot);
  let ancestor = path.dirname(target);
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  const realTarget = path.join(fs.realpathSync(ancestor), path.relative(ancestor, target));
  const relative = path.relative(root, realTarget);
  assert(relative && relative !== '..' && !(!relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)), '--output must be outside the repository');
  assert(!fs.existsSync(target) || !fs.lstatSync(target).isSymbolicLink(), 'Output symlink is forbidden');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}
module.exports = { VERSION, CONTRACT_PATH, createReleaseBatch, checkReleaseBatch, writeExternalJson, inventoryFromManifests, runContractValidators };
