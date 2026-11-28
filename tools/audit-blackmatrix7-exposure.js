#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { sha256 } = require('./lib/source-provenance');

const ROOT = path.resolve(__dirname, '..');
const BLACKMATRIX7 = 'https://github.com/blackmatrix7/ios_rule_script';
const LEDGER = 'rulesets/generated/source-ledger.json';
const MANIFEST = 'rulesets/generated/fused/manifest.json';
const BLACKMATRIX7_RAW_URL = /https:\/\/(?:raw\.githubusercontent\.com\/blackmatrix7\/ios_rule_script\/|github\.com\/blackmatrix7\/ios_rule_script\/raw\/)[^\s"']+/i;

function readArtifact(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return { text, sha256: sha256(text) };
}

function collectWorkflowReads(text) {
  const reads = [];
  for (const [index, line] of text.split('\n').entries()) {
    const url = line.match(BLACKMATRIX7_RAW_URL)?.[0];
    if (!url || line.trimStart().startsWith('#')) continue;
    const destination = line.match(/\s>\s+(\S+)\s*$/)?.[1] ?? null;
    reads.push({ line: index + 1, url, destination });
  }
  return reads;
}

function buildReport(ledger, manifest) {
  if (!ledger.fused_payload_fingerprint || ledger.fused_payload_fingerprint !== manifest.payload_fingerprint) {
    throw new Error('The source ledger and fused manifest cover different payloads');
  }
  const raw = ledger.providers.filter(row => row.identity?.repository_url?.toLowerCase() === BLACKMATRIX7);
  const normalized = ledger.normalized_providers.filter(row => row.identity?.repository_url?.toLowerCase() === BLACKMATRIX7);
  const byNormalizedId = new Map(normalized.map(row => [row.id, []]));
  for (const segment of manifest.source_segments) {
    for (const rule of segment.source_rules) {
      const [type, provider] = rule.split(',');
      if (type === 'RULE-SET' && byNormalizedId.has(provider)) {
        byNormalizedId.get(provider).push({ segment: segment.id, policy: segment.policy });
      }
    }
  }
  const normalizedByOrigin = new Map();
  for (const row of normalized) {
    const origin = row.origin_provider_id || row.source_provider_id || row.id;
    if (!normalizedByOrigin.has(origin)) normalizedByOrigin.set(origin, []);
    normalizedByOrigin.get(origin).push({ id: row.id, uses: byNormalizedId.get(row.id) });
  }
  const versionStates = {};
  const sourcesByPolicy = new Map();
  const sources = raw.map(row => {
    const state = row.identity.version_state ?? 'unknown';
    versionStates[state] = (versionStates[state] ?? 0) + 1;
    const normalized = normalizedByOrigin.get(row.id) ?? [];
    const policies = new Set(normalized.flatMap(item => item.uses.map(use => use.policy)));
    for (const policy of policies) {
      sourcesByPolicy.set(policy, (sourcesByPolicy.get(policy) ?? 0) + 1);
    }
    return {
      id: row.id,
      source_path: row.identity.source_path,
      request_url: row.requested_url,
      version_state: state,
      resolved_commit: row.identity.resolved_commit,
      input_sha256: row.input_receipt?.content?.sha256 ?? null,
      normalized,
    };
  });
  return {
    repository: BLACKMATRIX7,
    payload_fingerprint: manifest.payload_fingerprint,
    raw_source_count: sources.length,
    raw_graph_provider_count: ledger.providers.length,
    normalized_provider_count: normalized.length,
    normalized_graph_provider_count: ledger.normalized_providers.length,
    version_states: versionStates,
    policy_counts: [...sourcesByPolicy].map(([policy, distinct_sources]) => ({ policy, distinct_sources }))
      .sort((left, right) => right.distinct_sources - left.distinct_sources || left.policy.localeCompare(right.policy, 'en')),
    sources_without_direct_fused_reference: sources.filter(source => !source.normalized.some(item => item.uses.length)).map(source => source.id),
    sources,
  };
}

function main([workflow, ...extra]) {
  if (extra.length || workflow === '--help') {
    const output = workflow === '--help' && !extra.length ? process.stdout : process.stderr;
    output.write('Usage: node tools/audit-blackmatrix7-exposure.js [locally saved MetaCubeX workflow]\n');
    return output === process.stdout ? 0 : 1;
  }
  const ledger = readArtifact(path.join(ROOT, LEDGER));
  const manifest = readArtifact(path.join(ROOT, MANIFEST));
  const report = buildReport(JSON.parse(ledger.text), JSON.parse(manifest.text));
  const transitive = workflow && readArtifact(workflow);
  process.stdout.write(`${JSON.stringify({
    source_ledger: { path: LEDGER, sha256_lf: ledger.sha256 },
    fused_manifest: { path: MANIFEST, sha256_lf: manifest.sha256 },
    ...report,
    metacubex_workflow: transitive ? {
      sha256_lf: transitive.sha256,
      literal_workflow_references: collectWorkflowReads(transitive.text),
    } : null,
  }, null, 2)}\n`);
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { buildReport, collectWorkflowReads };
