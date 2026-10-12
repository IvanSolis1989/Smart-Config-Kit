#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const graph = require('../rulesets/source/routing-graph');
const { sha256, buildSnapshotProviderLedger, buildProviderLedger, collectManifestOutputReceipts } = require('./lib/source-provenance');
const { validateAdfpExceptions } = require('./lib/adfp-exceptions');
const { writeRepositoryArtifact } = require('./lib/write-repository-artifact');

const ROOT = path.resolve(__dirname, '..');
const LEDGER_FILE = 'rulesets/generated/source-ledger.json';
const EXCEPTIONS_FILE = 'rulesets/generated/adfp-exceptions.json';
const FUSED_MANIFEST = 'rulesets/generated/fused/manifest.json';
const MRS_MANIFEST = 'rulesets/generated/mihomo-mrs/manifest.json';
const SEMANTIC_FILE = 'rulesets/generated/semantic-diff.json';
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
    const raw = buildProviderLedger({ rawGraph, mrsManifest, receipts: sourceReceipts, outputReceipts: outputs });
    const normalized = buildProviderLedger({ rawGraph: normalizedGraph, mrsManifest, receipts: sourceReceipts, outputReceipts: outputs });
    ledger = { ...raw, normalized_provider_count: normalized.provider_count,
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
    'SingBox/SingBox(sing-box)-generator.js', 'tools/generate-fused-fallback-artifacts.js'].map(fileRecord);
  ledger.mrs_manifest = fileRecord(MRS_MANIFEST);
  ledger.fused_inputs = sourceReads;
  ledger.fused_outputs = payloadFiles;
  ledger.fused_payload_fingerprint = manifest.payload_fingerprint || null;
  const exceptionReport = validateAdfpExceptions();
  const exceptionRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, 'rulesets/source/adfp-exceptions.json'), 'utf8'));
  exceptionReport.scope = 'Existing payload coverage, matching boundaries and static early first-match probes; no live-client claim or added exceptions.';
  exceptionReport.registry = fileRecord('rulesets/source/adfp-exceptions.json');
  exceptionReport.payloads = ['direct', 'intl-site', 'payments', 'ai'].map(name => fileRecord(`rulesets/supplemental/clash/adfp-${name}.list`));
  exceptionReport.probes = exceptionRegistry.records.flatMap(record => record.positive_examples.map(host => ({ host, expected_policy: record.target_policy, exception_id: record.id })));
  const { loadRepository, firstMatch } = require('./lib/ordered-rule-semantics');
  const current = loadRepository({ root: ROOT });
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
  };
  if (fs.existsSync(path.join(ROOT, SEMANTIC_FILE))) {
    const report = JSON.parse(fs.readFileSync(path.join(ROOT, SEMANTIC_FILE), 'utf8'));
    if (report.after?.identity !== current.identity || report.check?.ok !== true) {
      if (requireSemanticReport) throw new Error('Saved semantic report is stale or has not passed the review gate');
    } else manifest.rule_quality.semantic_diff = { ...fileRecord(SEMANTIC_FILE), after_identity: report.after.identity };
  } else if (requireSemanticReport) throw new Error(`Missing ${SEMANTIC_FILE}; run the identity-bound comparison first`);
  return [{ path: LEDGER_FILE, text: ledgerText }, { path: EXCEPTIONS_FILE, text: exceptionsText },
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
