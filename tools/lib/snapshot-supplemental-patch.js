'use strict';

// A partial sync consumes only the named local supplement. The remaining
// inputs are immutable generated snapshot values, never freshly read upstream.
const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const compiler = require('../build-fused-rule-sets');
const { canonicalizeEntry } = require('./fused-rule-optimizer');
const { toMihomoDomainPayload } = require('./mihomo-domain-payload');
const { parseEgernYaml, renderEgernYaml: renderSnapshotEgern } = require('../rebuild-fused-from-snapshot');
const { createSourceReceipt, sha256, safeRelativePath } = require('./source-provenance');

const SOURCE = 'rulesets/source/routing-graph.js';
const FUSED = 'rulesets/generated/fused';
const MRS = 'rulesets/generated/mihomo-mrs';
const RECEIPT = 'rulesets/generated/supplemental-patch.json';
const BUCKETS = { domain: 'domain', ipcidr: 'ipcidr', ipcidrNoResolve: 'ipcidr_no_resolve', residual: 'residual' };
const lf = value => Buffer.from(value).toString('utf8').replace(/\r\n/g, '\n');
const canonicalBytes = (file, bytes) => /\.(mrs|srs)$/.test(file) ? Buffer.from(bytes) : Buffer.from(lf(bytes));
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const frozenCache = new Map();

function git(root, args, binary = false) {
  return cp.execFileSync('git', args, { cwd: root, encoding: binary ? null : 'utf8', maxBuffer: 256 * 1024 * 1024 });
}
function frozenRead(root, ref, relative) {
  safeRelativePath(root, relative);
  const cached = frozenCache.get(`${root}\0${ref}`)?.get(relative.replace(/\\/g, '/'));
  if (cached) return cached;
  return git(root, ['show', `${ref}:${relative.replace(/\\/g, '/')}`], true);
}
function assertSupplementalPath(root, relative) {
  if (typeof relative !== 'string' || !/^rulesets\/supplemental\/clash\/[a-z0-9._-]+\.list$/.test(relative)) {
    throw new Error('Local source must be an explicit rulesets/supplemental/clash/*.list path');
  }
  const actual = fs.realpathSync(path.resolve(root, relative));
  safeRelativePath(fs.realpathSync(root), actual);
  return actual;
}
function graphDefinition(graph) {
  const providers = Object.fromEntries(Object.entries(graph['rule-providers']).map(([id, provider]) => {
    const stable = { ...provider };
    delete stable.interval; // source intervals deliberately contain jitter
    return [id, stable];
  }));
  return JSON.stringify({ providers, rules: graph.rules })
    .replace(/([?&]scki=)v\d+\.\d+\.\d+/g, '$1__revision__')
    .replace(/\.\/ruleset\/v\d+\.\d+\.\d+\//g, './ruleset/__revision__/');
}
function assertGraphUnchanged(baseline, current) {
  for (const key of ['raw', 'normalized']) {
    if (graphDefinition(baseline[key]) !== graphDefinition(current[key])) {
      throw new Error(`Incremental supplemental patch requires unchanged ${key} provider definitions, policy and rule order`);
    }
  }
}
function evaluateGraph(source, trafficOptions, label) {
  const module = { exports: {} };
  const fixedMath = Object.create(Math);
  fixedMath.random = () => 0;
  vm.runInNewContext(source, { module, exports: module.exports, Math: fixedMath,
    process: { env: {} }, console: { log() {} }, require: id => {
      if (id !== './traffic-options.json') throw new Error(`Unexpected graph dependency: ${id}`);
      return trafficOptions;
    } }, { filename: label, timeout: 15000 });
  const build = module.exports.buildMihomoRoutingGraph;
  return { raw: build({ applyMihomoMrsOverrides: false, quicPolicy: 'block-foreign' }),
    normalized: build({ quicPolicy: 'block-foreign' }), version: module.exports.SOURCE_GRAPH_VERSION };
}
function assertFrozenSnapshot(root, ref) {
  if (!/^[a-f0-9]{40}$/i.test(ref) || git(root, ['rev-parse', 'HEAD']).trim() !== ref.toLowerCase()) {
    throw new Error('Baseline must be the full current HEAD commit SHA');
  }
  const prefixes = ['mihomo', 'clash', 'surge', 'quantumultx', 'egern', 'sing-box'].map(p => `${FUSED}/${p}`);
  prefixes.push(MRS);
  const tree = git(root, ['ls-tree', '-r', ref, '--', ...prefixes]);
  const frozen = new Set();
  const records = [];
  for (const line of tree.trim().split('\n').filter(Boolean)) {
    const match = /^\d+ blob ([a-f0-9]+)\t(.+)$/.exec(line);
    if (!match) throw new Error('Unexpected baseline tree entry');
    const relative = match[2];
    records.push([relative, match[1]]);
    frozen.add(relative);
    const actual = path.resolve(root, relative);
    safeRelativePath(fs.realpathSync(root), fs.realpathSync(actual));
    const bytes = canonicalBytes(relative, fs.readFileSync(actual));
    const oid = require('node:crypto').createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if (oid !== match[1]) throw new Error(`Snapshot differs from baseline: ${relative}`);
  }
  // Batch immutable blobs once. Hundreds of per-file git processes are both
  // unnecessary and especially slow on Windows.
  const packed = cp.execFileSync('git', ['cat-file', '--batch'], { cwd: root,
    input: records.map(([, oid]) => `${oid}\n`).join(''), maxBuffer: 256 * 1024 * 1024 });
  const cached = new Map();
  let cursor = 0;
  for (const [relative, oid] of records) {
    const newline = packed.indexOf(10, cursor);
    const header = packed.subarray(cursor, newline).toString('utf8');
    const match = /^([a-f0-9]+) blob (\d+)$/.exec(header);
    if (!match || match[1] !== oid) throw new Error('Invalid batched baseline blob');
    const size = Number(match[2]); cursor = newline + 1;
    cached.set(relative, packed.subarray(cursor, cursor + size)); cursor += size + 1;
  }
  frozenCache.set(`${root}\0${ref}`, cached);
  function walk(directory) {
    for (const item of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const relative = `${directory}/${item.name}`;
      if (item.isDirectory()) walk(relative);
      else if (!frozen.has(relative)) throw new Error(`Unexpected snapshot asset: ${relative}`);
    }
  }
  prefixes.forEach(walk);
  const relative = `${FUSED}/manifest.json`;
  if (lf(fs.readFileSync(path.join(root, relative))) !== lf(frozenRead(root, ref, relative))) {
    throw new Error('Fused manifest differs from baseline');
  }
}
function assertTypedDomains(entries, label) {
  for (const entry of entries) {
    if (!/^DOMAIN,[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z0-9-]+$/.test(entry)
        || entry !== canonicalizeEntry(entry) || entry.includes('..')) {
      throw new Error(`${label} only accepts canonical typed DOMAIN exact hosts: ${entry}`);
    }
  }
  if (new Set(entries).size !== entries.length) throw new Error(`${label} contains duplicate entries`);
}
function assertLocalDelta(before, after, adds, removes) {
  assertTypedDomains(adds, 'add');
  assertTypedDomains(removes, 'remove');
  if (!adds.length && !removes.length) throw new Error('An explicit nonempty DOMAIN delta is required');
  if (adds.some(entry => removes.includes(entry))) throw new Error('Overlapping add/remove delta');
  if (new Set(before).size !== before.length || new Set(after).size !== after.length) throw new Error('Duplicate supplemental payload');
  const oldSet = new Set(before), newSet = new Set(after);
  const actualAdds = after.filter(entry => !oldSet.has(entry)).sort();
  const actualRemoves = before.filter(entry => !newSet.has(entry)).sort();
  if (JSON.stringify(actualAdds) !== JSON.stringify([...adds].sort())
      || JSON.stringify(actualRemoves) !== JSON.stringify([...removes].sort())) {
    throw new Error('Current supplemental payload differs outside the explicit DOMAIN delta');
  }
  const unchangedBefore = before.filter(entry => !removes.includes(entry));
  const unchangedAfter = after.filter(entry => !adds.includes(entry));
  if (JSON.stringify(unchangedBefore) !== JSON.stringify(unchangedAfter)) throw new Error('Existing supplemental rule order changed');
}
function patchSegmentDomains(segments, targetId, adds, removes) {
  const before = new Map(segments.map(s => [s.id, [...s.domain]]));
  const otherBuckets = new Map(segments.map(s => [s.id, JSON.stringify([s.ipcidr, s.ipcidrNoResolve, s.residual])]));
  const target = segments.find(s => s.id === targetId);
  if (!target) throw new Error('Missing supplemental target segment');
  // A post-dedup snapshot cannot recover hidden later upstream owners after
  // deleting the first owner. Reject that operation rather than invent lineage.
  if (removes.length) throw new Error('Deletion requires original later provider inputs; snapshot-only replay cannot prove fallback ownership');
  target.domain.push(...adds);
  target.optimization = compiler.optimizeSegment(target);
  for (const segment of segments) {
    if (JSON.stringify([segment.ipcidr, segment.ipcidrNoResolve, segment.residual]) !== otherBuckets.get(segment.id)) {
      throw new Error(`Optimizer changed a non-domain bucket outside the patch: ${segment.id}`);
    }
    if (!segment.optimization) {
      const copy = { ...segment, ...Object.fromEntries(Object.keys(BUCKETS).map(key => [key, [...segment[key]]])) };
      segment.optimization = compiler.optimizeSegment(copy);
    }
  }
  compiler.removeGloballyRepeatedEntries(segments);
  const allowed = new Set([...adds, ...removes]);
  const changes = [];
  for (const segment of segments) {
    const old = before.get(segment.id), next = segment.domain;
    const oldSet = new Set(old), nextSet = new Set(next);
    const deleted = old.filter(entry => !nextSet.has(entry));
    const added = next.filter(entry => !oldSet.has(entry));
    if ([...deleted, ...added].some(entry => !allowed.has(entry))) throw new Error(`Optimizer changed an entry outside the patch: ${segment.id}`);
    if (JSON.stringify(old.filter(e => !allowed.has(e))) !== JSON.stringify(next.filter(e => !allowed.has(e)))) {
      throw new Error(`Optimizer reordered unrelated entries: ${segment.id}`);
    }
    if (deleted.length || added.length) changes.push({ id: segment.id, added, deleted });
  }
  for (const entry of adds) {
    const owners = segments.filter(s => s.domain.includes(entry));
    if (owners.length !== 1 || owners[0].id !== targetId) throw new Error(`Added host is shadowed or widened: ${entry}`);
  }
  return changes;
}

function loadPlan({ root, baselineRef, provider, localSource, adds, removes = [] }) {
  assertFrozenSnapshot(root, baselineRef);
  const sourcePath = assertSupplementalPath(root, localSource);
  const baselineGraph = evaluateGraph(lf(frozenRead(root, baselineRef, SOURCE)),
    JSON.parse(lf(frozenRead(root, baselineRef, 'rulesets/source/traffic-options.json'))), `${SOURCE}@${baselineRef}`);
  const currentGraph = evaluateGraph(lf(fs.readFileSync(path.join(root, SOURCE))),
    JSON.parse(lf(fs.readFileSync(path.join(root, 'rulesets/source/traffic-options.json')))), SOURCE);
  assertGraphUnchanged(baselineGraph, currentGraph);
  const definition = currentGraph.raw['rule-providers'][provider];
  if (!definition) throw new Error('Unknown explicit provider');
  const expectedSuffix = `/${localSource}`;
  if (!/^https:\/\/(fastly|cdn)\.jsdelivr\.net\/gh\/IvanSolis1989\/Smart-Config-Kit@main\//.test(definition.url)
      || !definition.url.split(/[?#]/)[0].endsWith(expectedSuffix)) throw new Error('Provider URL is not bound to the explicit local supplement');
  const currentBytes = fs.readFileSync(sourcePath);
  const before = compiler.parsePayloadEntries(lf(frozenRead(root, baselineRef, localSource)));
  const after = compiler.parsePayloadEntries(lf(currentBytes));
  assertLocalDelta(before, after, adds, removes);
  const manifest = JSON.parse(lf(frozenRead(root, baselineRef, `${FUSED}/manifest.json`)));
  if (manifest.baseline_version !== baselineGraph.version) throw new Error('Baseline source version is not bound to fused manifest');
  const topology = compiler.reuseSnapshotTopology({ providers: currentGraph.normalized['rule-providers'], rules: currentGraph.normalized.rules }, manifest);
  const mrsManifest = JSON.parse(lf(frozenRead(root, baselineRef, `${MRS}/manifest.json`)));
  const conversion = mrsManifest.converted.filter(row => row.id === provider);
  if (conversion.length !== 1 || conversion[0].generated.length !== 1
      || conversion[0].generated[0].behavior !== 'domain' || conversion[0].source_url !== definition.url) {
    throw new Error('Incremental patch requires one existing domain-only conversion row');
  }
  const normalizedProvider = conversion[0].generated[0].file.replace(/\.mrs$/, '');
  const targets = topology.segments.filter(s => s.sourceRules.some(rule => rule.startsWith(`RULE-SET,${normalizedProvider},`)));
  if (targets.length !== 1 || targets[0].sourceRules.length !== 1) throw new Error('Explicit local provider requires a unique isolated source segment');
  const rows = new Map(manifest.segments.map(row => [row.id, row]));
  for (const segment of topology.segments) {
    const row = rows.get(segment.id);
    segment.optimization = structuredClone(row.optimization);
    for (const [bucket, manifestBucket] of Object.entries(BUCKETS)) {
      const record = row.files[manifestBucket];
      segment[bucket] = record ? compiler.parsePayloadEntries(lf(frozenRead(root, baselineRef, `${FUSED}/mihomo/${record.source || record.file}`))).map(canonicalizeEntry) : [];
      if (segment[bucket].length !== row.counts[manifestBucket]) throw new Error(`Snapshot bucket count mismatch: ${segment.id}/${bucket}`);
    }
  }
  if (JSON.stringify(targets[0].domain) !== JSON.stringify(before.map(canonicalizeEntry))) {
    throw new Error('Local supplemental baseline is not bound to the isolated segment payload');
  }
  const changes = patchSegmentDomains(topology.segments, targets[0].id, adds, removes);
  const sourceReceipt = createSourceReceipt({ requestedUrl: definition.url, bytes: currentBytes, localPath: sourcePath,
    repoRoot: root, inputKind: 'original-source', acquisition: 'local-file' });
  return { root, baselineRef, provider, localSource, adds, removes, before, after, manifest, mrsManifest,
    changes, topology, sourceReceipt, currentGraph, conversion: conversion[0],
    receipt: { schema_version: 1, mode: 'partial-sync', baseline_commit: baselineRef,
      baseline_source_sha256: sha256(Buffer.from(lf(frozenRead(root, baselineRef, SOURCE)))),
      baseline_manifest_sha256: sha256(Buffer.from(lf(frozenRead(root, baselineRef, `${FUSED}/manifest.json`)))),
      baseline_payload_sha256: compiler.fusedPayloadReceipt().digest,
      baseline_supplemental_sha256: sha256(Buffer.from(lf(frozenRead(root, baselineRef, localSource)))),
      provider_id: provider, local_delta: { added: adds, removed: removes }, source_receipt: sourceReceipt,
      changed_segments: changes, untouched_original_inputs: 'legacy-unknown; not read or refreshed', outputs: [] } };
}

// Render only DOMAIN changes against already-materialized target assets. This
// avoids rematerializing unrelated GeoIP/ASN values or widening suffix rules.
function patchNativeAssets({ row, change, read }) {
  const result = new Map();
  const hostsAdded = change.added.map(e => e.slice('DOMAIN,'.length));
  const hostsDeleted = change.deleted.map(e => e.slice('DOMAIN,'.length));
  for (const [platform, render] of [
    ['clash', entries => compiler.renderClassicalList(entries, { includeProcess: false })],
    ['surge', entries => compiler.renderClassicalList(entries, { includeProcess: true })],
    ['quantumultx', compiler.renderQxList],
  ]) {
    const files = row.files[platform]?.parts || [row.files[platform]?.file];
    if (files.some(f => !f)) throw new Error(`Missing native ${platform} assets`);
    const deletedLines = new Set(render(change.deleted).trim().split('\n').filter(Boolean));
    const remaining = new Set(deletedLines);
    files.forEach((file, index) => {
      const relative = `${FUSED}/${platform}/${file}`;
      const lines = lf(read(relative)).trimEnd().split('\n').filter(line => {
        if (!deletedLines.has(line)) return true;
        remaining.delete(line); return false;
      });
      if (index === files.length - 1) lines.push(...render(change.added).trim().split('\n').filter(Boolean));
      const content = `${lines.join('\n')}\n`;
      if (Buffer.byteLength(content) > 18 * 1024 * 1024) throw new Error('Incremental text asset exceeds remote size budget');
      result.set(relative, Buffer.from(content));
    });
    if (remaining.size) throw new Error(`Deleted host absent from native ${platform} snapshot`);
  }
  const egernFile = `${FUSED}/egern/${row.files.egern.file}`;
  const originalEgern = lf(read(egernFile));
  const egern = parseEgernYaml(Buffer.from(originalEgern));
  const domains = egern.sets.get('domain_set') || [];
  for (const host of hostsDeleted) if (!domains.includes(host)) throw new Error('Deleted host absent from Egern snapshot');
  egern.sets.set('domain_set', [...domains.filter(h => !hostsDeleted.includes(h)), ...hostsAdded]);
  let renderedEgern = renderSnapshotEgern(egern);
  // The snapshot parser records scalar values as strings. Preserve their
  // original spelling so a YAML boolean cannot become a quoted string.
  for (const key of egern.scalars.keys()) {
    const line = originalEgern.split('\n').find(value => value.startsWith(`${key}:`));
    renderedEgern = renderedEgern.replace(new RegExp(`^${key}:.*$`, 'm'), line);
  }
  result.set(egernFile, Buffer.from(renderedEgern));
  const singFile = `${FUSED}/sing-box/${row.files.sing_box.source}`;
  const sing = JSON.parse(lf(read(singFile)));
  if (sing.rules.length !== 1) throw new Error('Incremental SRS requires a single existing materialized rule');
  const oldDomains = sing.rules[0].domain || [];
  for (const host of hostsDeleted) if (!oldDomains.includes(host)) throw new Error('Deleted host absent from sing-box snapshot');
  // Use the existing compiler to supply the native DOMAIN field.
  const nativeAdded = JSON.parse(compiler.renderSingBoxSource(change.added)).rules[0]?.domain || [];
  sing.rules[0].domain = [...oldDomains.filter(h => !hostsDeleted.includes(h)), ...nativeAdded];
  result.set(singFile, Buffer.from(json(sing)));
  return result;
}

function renderPlan(plan) {
  const outputs = new Map();
  const rows = new Map(plan.manifest.segments.map(row => [row.id, row]));
  const read = relative => frozenRead(plan.root, plan.baselineRef, relative);
  for (const change of plan.changes) {
    const row = rows.get(change.id);
    const segment = plan.topology.segments.find(s => s.id === change.id);
    if (!row.files.domain || !segment.domain.length) throw new Error('Patch must retain existing nonempty domain asset topology');
    outputs.set(`${FUSED}/mihomo/${row.files.domain.source}`, Buffer.from(compiler.renderPayload(segment.domain.map(toMihomoDomainPayload))));
    for (const [file, bytes] of patchNativeAssets({ row, change, read })) outputs.set(file, bytes);
  }
  return outputs;
}
function adjustStats(stats, added, deleted) {
  if (!stats) return;
  stats.input += added;
  stats.output += added - deleted;
  if (deleted) stats.globalExactDuplicates = (stats.globalExactDuplicates || 0) + deleted;
  if ('removed' in stats) stats.removed = stats.input - stats.output;
}
function prepareManifest(plan, outputs) {
  const manifest = structuredClone(plan.manifest);
  for (const change of plan.changes) {
    const row = manifest.segments.find(s => s.id === change.id);
    const added = change.added.length, deleted = change.deleted.length;
    row.counts.domain += added - deleted;
    adjustStats(row.optimization, added, deleted);
    adjustStats(row.optimization?.buckets?.domain, added, deleted);
    for (const target of ['mobile', 'sing_box']) {
      row.target_counts[target] += added - deleted;
      adjustStats(row.target_optimization[target], added, deleted);
    }
    adjustStats(manifest.optimization, added, deleted);
  }
  manifest.supplemental_patch_receipt = RECEIPT;
  manifest.traffic_source_fingerprint = compiler.trafficSourceFingerprint();
  // Hash the complete resulting inventory without mutating the snapshot first.
  const inventory = compiler.fusedPayloadReceipt().files;
  for (const [file, bytes] of outputs) if (file.startsWith(`${FUSED}/`)) inventory.set(file, canonicalBytes(file, bytes));
  const crypto = require('node:crypto');
  const hash = crypto.createHash('sha256');
  for (const [file, bytes] of [...inventory].sort(([a], [b]) => a.localeCompare(b, 'en'))) hash.update(`${file}\0${sha256(bytes)}\n`);
  manifest.payload_fingerprint = hash.digest('hex');
  return manifest;
}
function writePlan(plan, { mihomoBin, singBoxBin }) {
  for (const [name, binary] of [['mihomo', mihomoBin], ['sing-box', singBoxBin]]) {
    if (!binary || !fs.statSync(binary).isFile()) throw new Error(`Explicit existing ${name} binary is required; no download is permitted`);
  }
  const outputs = renderPlan(plan);
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-supplemental-'));
  try {
    const writeStage = (relative, bytes) => {
      safeRelativePath(stage, relative);
      const target = path.join(stage, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
      return target;
    };
    for (const [file, bytes] of outputs) writeStage(file, bytes);
    for (const change of plan.changes) {
      const row = plan.manifest.segments.find(s => s.id === change.id);
      const source = `${FUSED}/mihomo/${row.files.domain.source}`;
      const mrs = `${FUSED}/mihomo/${row.files.domain.file}`;
      compiler.convertWithMihomo(mihomoBin, 'domain', path.join(stage, source), writeStage(mrs, Buffer.alloc(0)));
      outputs.set(mrs, fs.readFileSync(path.join(stage, mrs)));
      const singSource = `${FUSED}/sing-box/${row.files.sing_box.source}`;
      const srs = `${FUSED}/sing-box/${row.files.sing_box.file}`;
      if (!compiler.compileSingBoxRuleSet(singBoxBin, path.join(stage, singSource), writeStage(srs, Buffer.alloc(0)))) throw new Error(`SRS compilation failed: ${change.id}`);
      outputs.set(srs, fs.readFileSync(path.join(stage, srs)));
    }
    const conversion = plan.conversion.generated[0];
    const supplementSource = writeStage('local-domain.yaml', compiler.renderPayload(plan.after.map(toMihomoDomainPayload)));
    const supplementMrs = `${MRS}/${conversion.file}`;
    compiler.convertWithMihomo(mihomoBin, 'domain', supplementSource, writeStage(supplementMrs, Buffer.alloc(0)));
    outputs.set(supplementMrs, fs.readFileSync(path.join(stage, supplementMrs)));
    const mrsManifest = structuredClone(plan.mrsManifest);
    const changed = mrsManifest.converted.find(row => row.id === plan.provider);
    changed.source_receipt = plan.sourceReceipt;
    changed.type_counts = { domain: plan.after.length };
    changed.generated[0].entries = plan.after.length;
    changed.generated[0].output_receipt = createSourceReceipt({ bytes: outputs.get(supplementMrs), localPath: supplementMrs,
      repoRoot: plan.root, inputKind: 'generated-output', acquisition: 'local-file' });
    outputs.set(`${MRS}/manifest.json`, Buffer.from(json(mrsManifest)));
    const fusedManifest = prepareManifest(plan, outputs);
    outputs.set(`${FUSED}/manifest.json`, Buffer.from(json(fusedManifest)));
    const outputRows = [...outputs].map(([file, bytes]) => ({ file, sha256: sha256(canonicalBytes(file, bytes)), bytes: canonicalBytes(file, bytes).length }));
    // Client regeneration legitimately updates manifest metadata afterward.
    // Stable payload hashes remain the current binding; stage manifest hashes
    // describe only this operation and must not attest a later metadata write.
    plan.receipt.outputs = outputRows.filter(row => !row.file.endsWith('/manifest.json'));
    plan.receipt.stage_manifest_outputs = outputRows.filter(row => row.file.endsWith('/manifest.json'));
    plan.receipt.binding = { fused_payload_sha256: fusedManifest.payload_fingerprint,
      traffic_source_fingerprint: fusedManifest.traffic_source_fingerprint,
      local_source_sha256: plan.sourceReceipt.content.sha256 };
    plan.receipt.converters = Object.fromEntries([['mihomo', mihomoBin], ['sing_box', singBoxBin]].map(([id, file]) => [id, { sha256: sha256(fs.readFileSync(file)), file: path.basename(file) }]));
    outputs.set(RECEIPT, Buffer.from(json(plan.receipt)));
    // Revalidate the frozen snapshot and local receipt immediately before any
    // destination write. A concurrent writer cannot silently be overwritten.
    assertFrozenSnapshot(plan.root, plan.baselineRef);
    const graphNow = evaluateGraph(lf(fs.readFileSync(path.join(plan.root, SOURCE))),
      JSON.parse(lf(fs.readFileSync(path.join(plan.root, 'rulesets/source/traffic-options.json')))), SOURCE);
    assertGraphUnchanged(plan.currentGraph, graphNow);
    if (sha256(Buffer.from(lf(fs.readFileSync(path.join(plan.root, plan.localSource))))) !== plan.sourceReceipt.content.sha256) throw new Error('Local source changed after planning');
    for (const [file, bytes] of outputs) {
      safeRelativePath(plan.root, file);
      const target = path.join(plan.root, file);
      safeRelativePath(fs.realpathSync(plan.root), fs.realpathSync(path.dirname(target)));
      if (fs.existsSync(target)) safeRelativePath(fs.realpathSync(plan.root), fs.realpathSync(target));
      fs.writeFileSync(target, bytes);
      if (!fs.readFileSync(target).equals(bytes)) throw new Error(`Saved output read-back failed: ${file}`);
    }
    return { files: [...outputs.keys()], receipt: plan.receipt };
  } finally { fs.rmSync(stage, { recursive: true, force: true }); }
}

module.exports = { RECEIPT, graphDefinition, assertGraphUnchanged, assertTypedDomains, assertLocalDelta,
  assertSupplementalPath, assertFrozenSnapshot, patchSegmentDomains, patchNativeAssets, loadPlan, renderPlan, writePlan };
