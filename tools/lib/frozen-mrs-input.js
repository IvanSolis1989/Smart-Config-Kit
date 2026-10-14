'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { sha256, safeRelativePath, createSourceReceipt } = require('./source-provenance');
// Explicit published-output recovery only. This never adopts URL-only download caches.
function readFrozenMrsInput({ repoRoot, manifestPath, providerId, requestedUrl, mihomoBin, sourceBehavior, sourceFormat }) {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(repoRoot, manifestPath), 'utf8'));
  if (manifest.schema_version !== 1 || !/^[a-f0-9]{40}$/.test(manifest.baseline_ref || '')) throw new Error('Invalid frozen MRS input manifest');
  const row = manifest.providers?.[providerId];
  if (!row) return null;
  if (row.requested_url !== requestedUrl) throw new Error('Frozen provider URL differs from current provider');
  const baseline = JSON.parse(execFileSync('git', ['-c', 'core.safecrlf=false', 'show', manifest.baseline_ref + ':rulesets/generated/mihomo-mrs/manifest.json'], { cwd: repoRoot, maxBuffer: 32 * 1024 * 1024 }));
  const baselineRow = ['converted', 'split', 'partial'].flatMap(key => baseline[key] || []).find(item => item.id === providerId);
  if (!baselineRow || baselineRow.source_url !== requestedUrl) throw new Error('Frozen provider ID/URL differs from baseline manifest');
  if (baselineRow.source_behavior && baselineRow.source_behavior !== sourceBehavior) throw new Error('Frozen provider behavior differs from current source provider');
  if (baselineRow.source_format && baselineRow.source_format !== sourceFormat) throw new Error('Frozen provider format differs from current source provider');
  const expected = [...baselineRow.generated.map(item => ({ path: 'rulesets/generated/mihomo-mrs/' + item.file, behavior: item.behavior })), ...(baselineRow.residual ? [{ path: 'rulesets/generated/mihomo-mrs/' + baselineRow.residual.file, behavior: 'residual' }] : [])];
  if (!Array.isArray(row.origin_files) || JSON.stringify(row.origin_files.map(item => item.path).sort()) !== JSON.stringify(expected.map(item => item.path).sort())) throw new Error('Frozen provider origin inventory differs from baseline manifest');
  const local = path.resolve(repoRoot, row.decoded_file);
  safeRelativePath(repoRoot, local);
  safeRelativePath(fs.realpathSync(repoRoot), fs.realpathSync(local));
  const bytes = fs.readFileSync(local);
  if (sha256(bytes) !== row.decoded_sha256 || bytes.length !== row.decoded_bytes) throw new Error('Frozen decoded provider input changed');
  if (!Array.isArray(row.origin_files) || !row.origin_files.length) throw new Error('Frozen provider origin missing');
  const originals = new Map();
  for (const origin of row.origin_files) {
    if (!/^rulesets\/generated\/mihomo-mrs\/[^/]+$/.test(origin.path)) throw new Error('Invalid frozen origin path');
    const original = execFileSync('git', ['-c', 'core.safecrlf=false', 'show', manifest.baseline_ref + ':' + origin.path], { cwd: repoRoot, maxBuffer: 32 * 1024 * 1024 });
    if (sha256(original) !== origin.sha256) throw new Error('Frozen origin differs from published baseline');
    originals.set(origin.path, original);
  }
  // A self-reported decoded hash is insufficient: re-decode the identity-bound
  // baseline files with the explicitly supplied native converter and compare
  // the exact classical predicate set, including wildcard/root boundaries.
  if (!mihomoBin || !fs.existsSync(mihomoBin)) throw new Error('Frozen MRS input verification requires an explicit Mihomo binary');
  const cache = path.join(repoRoot, '.cache');
  fs.mkdirSync(cache, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(cache, 'frozen-mrs-verify-'));
  const entries = [];
  try {
    for (const asset of expected) {
      const original = originals.get(asset.path);
      if (asset.behavior === 'residual') {
        for (const line of original.toString('utf8').split(/\r?\n/)) {
          const item = line.match(/^\s*-\s+(.+)$/);
          if (item) entries.push(item[1].startsWith('"') ? JSON.parse(item[1]) : item[1].replace(/^'|'$/g, ''));
        }
      } else {
        if (!['domain', 'ipcidr'].includes(asset.behavior)) throw new Error('Invalid baseline MRS behavior');
        const source = path.join(temporary, path.basename(asset.path));
        const target = source + '.txt';
        fs.writeFileSync(source, original);
        execFileSync(mihomoBin, ['convert-ruleset', asset.behavior, 'mrs', source, target], { windowsHide: true });
        for (const value of fs.readFileSync(target, 'utf8').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'))) {
          entries.push(asset.behavior === 'ipcidr' ? (value.includes(':') ? 'IP-CIDR6,' : 'IP-CIDR,') + value
            : value.startsWith('+.') ? 'DOMAIN-SUFFIX,' + value.slice(2)
              : value.startsWith('.') ? 'DOMAIN-WILDCARD,*' + value
                : value.includes('*') ? 'DOMAIN-WILDCARD,' + value : 'DOMAIN,' + value);
        }
      }
    }
    const canonical = values => JSON.stringify([...new Set(values.map(value => value.trim()).filter(Boolean))].sort());
    if (canonical(entries) !== canonical(bytes.toString('utf8').split(/\r?\n/))) throw new Error('Frozen decoded predicates differ from identity-bound native output');
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
  const receipt = createSourceReceipt({ requestedUrl, bytes, localPath: local, repoRoot, inputKind: 'legacy-snapshot', acquisition: 'published-mrs-decode' });
  receipt.output_lineage = { baseline_ref: manifest.baseline_ref, origin_files: row.origin_files, transformation: 'Mihomo convert-ruleset mrs to text plus published residual YAML', original_upstream_provenance: 'unknown' };
  return { text: bytes.toString('utf8'), receipt };
}
module.exports = { readFrozenMrsInput };
