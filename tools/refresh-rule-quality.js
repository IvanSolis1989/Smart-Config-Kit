#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const graph = require('../rulesets/source/routing-graph');
const { sha256, assertReceiptMatches, safeRelativePath, buildSnapshotProviderLedger, buildProviderLedger, collectManifestOutputReceipts } = require('./lib/source-provenance');
const { validateAdfpExceptions } = require('./lib/adfp-exceptions');
const { writeRepositoryArtifact } = require('./lib/write-repository-artifact');
const { buildReport: buildClaudeReport, serialize: serializeClaudeReport } = require('./lib/claude-service-dependencies');

const ROOT = path.resolve(__dirname, '..');
const LEDGER_FILE = 'rulesets/generated/source-ledger.json';
const EXCEPTIONS_FILE = 'rulesets/generated/adfp-exceptions.json';
const FUSED_MANIFEST = 'rulesets/generated/fused/manifest.json';
const MRS_MANIFEST = 'rulesets/generated/mihomo-mrs/manifest.json';
const SEMANTIC_FILE = 'rulesets/generated/semantic-diff.json';
const CLAUDE_FILE = 'rulesets/generated/claude-service-dependencies.json';
const canonicalText = bytes => Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
const fileRecord = relative => {
  const bytes = fs.readFileSync(path.join(ROOT, relative));
  const content = /\.(mrs|srs)$/.test(relative) ? bytes : canonicalText(bytes);
  return { path: relative, sha256: sha256(content), bytes: content.length, text_normalization: /\.(mrs|srs)$/.test(relative) ? null : 'LF' };
};
const json = value => `${JSON.stringify(value, null, 2)}\n`;

function prepareQualityArtifacts({ sourceReceipts = {}, sourceReads = null, requireSemanticReport = false } = {}) {
  const rawGraph = graph.getRawRoutingGraph();
  const normalizedGraph = graph.getMihomoNormalizedRoutingGraph();
  const mrsManifest = JSON.parse(fs.readFileSync(path.join(ROOT, MRS_MANIFEST), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, FUSED_MANIFEST), 'utf8'));
  // Readback preserves actual build receipts only for the same bound payload.
  // A fresh build supplies its reads explicitly; an unbound legacy snapshot is empty.
  if (sourceReads === null) {
    const previousFile = path.join(ROOT, LEDGER_FILE);
    const previous = fs.existsSync(previousFile) ? JSON.parse(fs.readFileSync(previousFile, 'utf8')) : null;
    sourceReads = previous && previous.fused_payload_fingerprint === manifest.payload_fingerprint
      ? previous.fused_inputs || [] : [];
  }
  const hasCapturedInputs = Object.keys(sourceReceipts).length ||
    ['converted', 'split', 'partial', 'retained'].some(key => (mrsManifest[key] || []).some(row => row.source_receipt?.content));
  let ledger = buildSnapshotProviderLedger({ rawGraph, normalizedGraph, mrsManifest, repoRoot: ROOT });
  if (hasCapturedInputs) {
    const outputs = collectManifestOutputReceipts({ mrsManifest, outputDir: path.join(ROOT, 'rulesets/generated/mihomo-mrs'), repoRoot: ROOT });
    const inheritedLocal = Object.fromEntries(ledger.providers.filter(provider => provider.input_receipt).map(provider => [provider.id, provider.input_receipt]));
    const captured = { ...inheritedLocal, ...sourceReceipts };
    for (const key of ['converted', 'split', 'partial', 'retained']) for (const row of mrsManifest[key] || []) {
      if (row.source_receipt?.content) captured[row.id] = row.source_receipt;
    }
    const raw = buildProviderLedger({ rawGraph, mrsManifest, receipts: captured, outputReceipts: outputs });
    const normalized = buildProviderLedger({ rawGraph: normalizedGraph, mrsManifest, receipts: captured, outputReceipts: outputs });
    ledger = { ...raw, mode: raw.stats.unknown_provenance ? 'partial-sync' : 'full-sync', normalized_provider_count: normalized.provider_count,
      normalized_providers: normalized.providers, normalized_stats: normalized.stats };
  }
  const payloadFiles = [];
  function walk(relative) {
    for (const entry of fs.readdirSync(path.join(ROOT, relative), { withFileTypes: true })) {
      const next = `${relative}/${entry.name}`;
      if (entry.isDirectory()) walk(next);
      else payloadFiles.push(fileRecord(next));
    }
  }
  for (const family of ['mihomo', 'clash', 'surge', 'quantumultx', 'egern', 'sing-box']) walk(`rulesets/generated/fused/${family}`);
  payloadFiles.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  ledger.source_graph = { ...fileRecord('rulesets/source/routing-graph.js'), version: graph.SOURCE_GRAPH_VERSION,
    semantic_fingerprint: manifest.traffic_source_fingerprint || null };
  ledger.registry = fileRecord('rulesets/source/upstream-sources.json');
  ledger.generators = ['tools/sync-mihomo-mrs-rule-providers.js', 'tools/build-fused-rule-sets.js',
    'tools/lib/source-provenance.js', 'tools/lib/fused-source-provenance.js', 'tools/refresh-rule-quality.js',
    'tools/lib/ordered-rule-semantics.js', 'tools/lib/adfp-exceptions.js', 'tools/lib/fused-rule-optimizer.js',
    'tools/lib/mihomo-domain-payload.js', 'tools/validate-ordered-rule-semantics.js',
    'tools/generate-stash-from-cmfa.js', 'tools/generate-egern-supplemental.js', 'tools/generate-egern-from-cmfa.js',
    'SingBox/SingBox(sing-box)-generator.js', 'tools/generate-fused-fallback-artifacts.js',
    'tools/lib/claude-service-dependencies.js', 'tools/validate-claude-service-dependencies.js',
    'tools/lib/snapshot-supplemental-patch.js', 'tools/apply-supplemental-to-snapshot.js'].map(fileRecord);
  ledger.mrs_manifest = fileRecord(MRS_MANIFEST);
  ledger.fused_inputs = sourceReads;
  ledger.fused_outputs = payloadFiles;
  ledger.fused_payload_fingerprint = manifest.payload_fingerprint || null;
  if (fs.existsSync(path.join(ROOT, 'rulesets/generated/supplemental-patch.json'))) {
    const patch = JSON.parse(fs.readFileSync(path.join(ROOT, 'rulesets/generated/supplemental-patch.json'), 'utf8'));
    const payloadHash = require('node:crypto').createHash('sha256');
    for (const row of payloadFiles) payloadHash.update(`${row.path}\0${row.sha256}\n`);
    let currentBinding = patch.mode === 'partial-sync' && patch.binding?.fused_payload_sha256 === payloadHash.digest('hex') &&
      patch.binding?.fused_payload_sha256 === manifest.payload_fingerprint &&
      patch.binding?.traffic_source_fingerprint === manifest.traffic_source_fingerprint;
    if (currentBinding) {
      try {
        const localPath = safeRelativePath(ROOT, patch.source_receipt?.local_path);
        assertReceiptMatches(patch.source_receipt, fs.readFileSync(path.join(ROOT, localPath)));
        const expectedOutputs = new Set();
        const changedSegments = new Set();
        if (!Array.isArray(patch.changed_segments) || !patch.changed_segments.length) throw new Error('Missing incremental segment inventory');
        for (const change of patch.changed_segments) {
          if (changedSegments.has(change.id)) throw new Error('Duplicate incremental segment');
          changedSegments.add(change.id);
          const row = manifest.segments.find(segment => segment.id === change.id);
          if (!row?.files.domain) throw new Error('Missing incremental domain topology');
          for (const file of [row.files.domain.file, row.files.domain.source]) expectedOutputs.add(`rulesets/generated/fused/mihomo/${file}`);
          for (const family of ['clash', 'surge', 'quantumultx']) {
            for (const file of row.files[family]?.parts || [row.files[family]?.file]) expectedOutputs.add(`rulesets/generated/fused/${family}/${file}`);
          }
          expectedOutputs.add(`rulesets/generated/fused/egern/${row.files.egern.file}`);
          for (const file of [row.files.sing_box.file, row.files.sing_box.source]) expectedOutputs.add(`rulesets/generated/fused/sing-box/${file}`);
        }
        const conversion = mrsManifest.converted.find(row => row.id === patch.provider_id);
        if (!conversion || conversion.generated.length !== 1) throw new Error('Missing incremental local MRS output');
        expectedOutputs.add(`rulesets/generated/mihomo-mrs/${conversion.generated[0].file}`);
        currentBinding = Array.isArray(patch.outputs) && patch.outputs.length === expectedOutputs.size &&
          new Set(patch.outputs.map(row => row.file)).size === expectedOutputs.size && patch.outputs.every(row => {
          if (!expectedOutputs.has(row.file)) return false;
          safeRelativePath(ROOT, row.file);
          const actual = fileRecord(row.file);
          return actual.sha256 === row.sha256 && actual.bytes === row.bytes;
        });
      } catch { currentBinding = false; }
    }
    ledger.incremental_build_receipt = { ...fileRecord('rulesets/generated/supplemental-patch.json'),
      status: currentBinding ? 'current-payload-bound' : 'historical-stage-only' };
  }
  const exceptionReport = validateAdfpExceptions();
  const exceptionRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, 'rulesets/source/adfp-exceptions.json'), 'utf8'));
  exceptionReport.scope = 'Registered payload coverage, matching boundaries and static early first-match probes; no live-client claim.';
  exceptionReport.registry = fileRecord('rulesets/source/adfp-exceptions.json');
  exceptionReport.payloads = ['direct', 'intl-site', 'payments', 'ai'].map(name => fileRecord(`rulesets/supplemental/clash/adfp-${name}.list`));
  exceptionReport.probes = exceptionRegistry.records.flatMap(record => record.positive_examples.map(host => ({ host, expected_policy: record.target_policy, exception_id: record.id })));
  const { loadRepository, firstMatch } = require('./lib/ordered-rule-semantics');
  const current = loadRepository({ root: ROOT });
  const claudeInventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'rulesets/source/claude-service-dependencies.json'), 'utf8'));
  const claudeReport = buildClaudeReport(claudeInventory, current);
  const claudeText = serializeClaudeReport(claudeReport);
  exceptionReport.ordered_positive_probes = exceptionReport.probes.map(probe => {
    const route = firstMatch(current, { host: probe.host }, { mode: 'full' });
    if (route.status !== 'match' || route.policy !== probe.expected_policy) {
      throw new Error(`ADFP first-match probe failed: ${probe.exception_id}/${probe.host} expected ${probe.expected_policy}, got ${route.status}/${route.policy}`);
    }
    return { ...probe, mode: 'full-static', status: route.status, actual_policy: route.policy, evidence: route.hit };
  });
  const ledgerText = json(ledger);
  const exceptionsText = json(exceptionReport);
  manifest.rule_quality = {
    schema_version: 1,
    source_ledger: { path: LEDGER_FILE, sha256: sha256(Buffer.from(ledgerText)), mode: ledger.mode,
      raw_provider_count: ledger.provider_count, normalized_provider_count: ledger.normalized_provider_count },
    adfp_exceptions: { path: EXCEPTIONS_FILE, sha256: sha256(Buffer.from(exceptionsText)),
      registry_sha256: exceptionReport.registry_sha256, records: exceptionReport.total_records },
    claude_service_dependencies: { path: CLAUDE_FILE, sha256: sha256(Buffer.from(claudeText)),
      inventory: fileRecord('rulesets/source/claude-service-dependencies.json'), semantic_identity: current.identity,
      coverage: claudeReport.coverage },
  };
  if (fs.existsSync(path.join(ROOT, SEMANTIC_FILE))) {
    const report = JSON.parse(fs.readFileSync(path.join(ROOT, SEMANTIC_FILE), 'utf8'));
    if (report.after?.identity !== current.identity || report.check?.ok !== true) {
      if (requireSemanticReport) throw new Error('Saved semantic report is stale or has not passed the review gate');
    } else manifest.rule_quality.semantic_diff = { ...fileRecord(SEMANTIC_FILE), after_identity: report.after.identity };
  } else if (requireSemanticReport) throw new Error(`Missing ${SEMANTIC_FILE}; run the identity-bound comparison first`);
  return [{ path: LEDGER_FILE, text: ledgerText }, { path: EXCEPTIONS_FILE, text: exceptionsText }, { path: CLAUDE_FILE, text: claudeText },
    { path: FUSED_MANIFEST, text: json(manifest) }];
}

function refreshRuleQuality({ check = false, ...input } = {}) {
  const updates = prepareQualityArtifacts({ ...input, requireSemanticReport: check });
  const stale = updates.filter(item => !fs.existsSync(path.join(ROOT, item.path)) ||
    fs.readFileSync(path.join(ROOT, item.path), 'utf8').replace(/\r\n/g, '\n') !== item.text);
  if (check && stale.length) throw new Error(`Rule quality receipts are stale: ${stale.map(item => item.path).join(', ')}`);
  if (!check) for (const item of stale) writeRepositoryArtifact(path.join(ROOT, item.path), item.text);
  return { files: updates.map(item => item.path), updated: stale.length };
}

if (require.main === module) {
  try {
    if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Usage: node tools/refresh-rule-quality.js [--check]');
    console.log(JSON.stringify(refreshRuleQuality({ check: process.argv.includes('--check') })));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { prepareQualityArtifacts, refreshRuleQuality, fileRecord };
