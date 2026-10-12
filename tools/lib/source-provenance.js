'use strict';

// Receipts describe bytes actually read. A repository identity or a floating
// branch name alone is never evidence that those bytes came from a commit.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const registryDefault = require('../../rulesets/source/upstream-sources.json');

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

// Git may materialize checked-out text with CRLF on Windows. Local text is
// consumed in LF form so its receipt has the same identity on every platform.
// Remote downloads and binary artifacts always retain their exact raw bytes.
function localContentNormalization(file) {
  return /\.(?:ya?ml|list|txt|conf|json|ini|md|js|csv|tsv)$/i.test(file || '') ? 'LF' : 'raw-bytes';
}

function normalizedContentBytes(bytes, normalization) {
  const buffer = Buffer.from(bytes);
  if (normalization === 'raw-bytes') return buffer;
  if (normalization !== 'LF') throw new Error(`Unsupported source content normalization: ${normalization}`);
  if (!buffer.includes(Buffer.from('\r\n'))) return buffer;
  const canonical = Buffer.allocUnsafe(buffer.length);
  let length = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] === 13 && buffer[index + 1] === 10) continue;
    canonical[length++] = buffer[index];
  }
  return canonical.subarray(0, length);
}

function parseGitSource(url) {
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  let match;
  if (parsed.hostname === 'raw.githubusercontent.com') {
    match = /^\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/.exec(parsed.pathname);
  } else if (/^(?:(?:cdn|fastly|testingcf)\.)?jsdelivr\.net$/.test(parsed.hostname)) {
    match = /^\/gh\/([^/]+)\/([^/@]+)@([^/]+)\/(.+)$/.exec(parsed.pathname);
  }
  if (!match) return null;
  const [, owner, repo, ref, file] = match.map(decodeURIComponent);
  return { repository: `${owner}/${repo}`, repository_url: `https://github.com/${owner}/${repo}`, ref, file };
}

function safeRelativePath(repoRoot, file) {
  if (!repoRoot) throw new Error('A repository root is required for local receipts');
  const root = path.resolve(repoRoot);
  const target = path.resolve(root, file);
  const relative = path.relative(root, target);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Source path is outside repository: ${file}`);
  }
  return relative.split(path.sep).join('/');
}

function sourceIdentity(requestedUrl, registry = registryDefault, localPath = null) {
  const git = parseGitSource(requestedUrl);
  const declaration = git
    ? (registry.sources || []).find(item => item.repository === git.repository)
    : (registry.sources || []).find(item => (item.url_prefixes || []).some(prefix => String(requestedUrl).startsWith(prefix)));
  return {
    id: declaration ? declaration.id : git ? git.repository : localPath ? 'repository-local' : 'unregistered-source',
    kind: localPath ? 'local' : git ? 'git' : 'non-git',
    repository_url: git ? git.repository_url : declaration?.repository_url || null,
    requested_ref: git?.ref || null,
    source_path: git?.file || localPath,
    declaration: declaration ? `rulesets/source/upstream-sources.json#${declaration.id}` : null,
    license: declaration?.license || { status: 'unknown', spdx: null, declaration_url: null, note: 'No license evidence registered.' },
  };
}

function createSourceReceipt({ requestedUrl = null, effectiveUrl = null, bytes = null, localPath = null,
  repoRoot, registry = registryDefault, inputKind = 'original-source', acquisition = 'downloaded', resolvedCommit = null }) {
  if (acquisition === 'failed' && bytes !== null) throw new Error('A failed acquisition cannot attest consumed bytes');
  const relative = localPath ? safeRelativePath(repoRoot, localPath) : null;
  const source = sourceIdentity(requestedUrl, registry, relative);
  const normalization = relative ? localContentNormalization(relative) : 'raw-bytes';
  const consumedBytes = bytes === null ? null : normalizedContentBytes(bytes, normalization);
  const content = consumedBytes === null ? null : { sha256: sha256(consumedBytes), bytes: consumedBytes.length };
  const requestedGit = parseGitSource(requestedUrl);
  const effectiveGit = parseGitSource(effectiveUrl);
  const pinned = !relative && content && effectiveGit && /^[a-f0-9]{40}$/i.test(effectiveGit.ref)
    && requestedGit && requestedGit.repository === effectiveGit.repository && requestedGit.file === effectiveGit.file;
  if (resolvedCommit && (!pinned || resolvedCommit.toLowerCase() !== effectiveGit.ref.toLowerCase())) {
    throw new Error('Resolved commit is not bound to the consumed pinned URL');
  }
  const commit = pinned ? effectiveGit.ref.toLowerCase() : null;
  return {
    schema_version: 1,
    requested_url: requestedUrl,
    effective_url: effectiveUrl,
    local_path: relative,
    input_kind: inputKind,
    acquisition,
    verification: acquisition === 'failed' ? 'failed' : content ? 'content-sha256' : 'unread',
    content_normalization: normalization,
    content,
    source: {
      ...source,
      resolved_commit: commit,
      version_state: inputKind === 'legacy-snapshot' ? 'legacy-output-only'
        : commit ? 'pinned-commit' : content ? relative ? 'local-content-addressed' : 'content-addressed' : 'unknown',
    },
  };
}

function assertReceiptMatches(receipt, bytes, requestedUrl = receipt?.requested_url) {
  const normalization = receipt?.content_normalization || 'raw-bytes'; // Old raw receipts remain byte-strict.
  if (normalization === 'LF' && (!receipt?.local_path || localContentNormalization(receipt.local_path) !== 'LF')) {
    throw new Error(`Source receipt normalization is invalid for remote/binary bytes: ${requestedUrl}`);
  }
  const consumedBytes = normalizedContentBytes(bytes, normalization);
  if (!receipt || receipt.schema_version !== 1 || receipt.requested_url !== requestedUrl
    || receipt.verification !== 'content-sha256' || !receipt.content
    || receipt.content.sha256 !== sha256(consumedBytes) || receipt.content.bytes !== consumedBytes.length) {
    throw new Error(`Source receipt hash/identity mismatch: ${requestedUrl}`);
  }
  // Reconstruct the binding instead of accepting a caller-supplied commit field.
  const rebuilt = createSourceReceipt({ requestedUrl, effectiveUrl: receipt.effective_url, bytes, inputKind: receipt.input_kind });
  if (!receipt.local_path && (receipt.source?.resolved_commit !== rebuilt.source.resolved_commit
      || receipt.source?.version_state !== rebuilt.source.version_state)) {
    throw new Error(`Source receipt commit binding mismatch: ${requestedUrl}`);
  }
  return true;
}

function cachePaths(cacheDir, requestedUrl) {
  const key = sha256(Buffer.from(requestedUrl, 'utf8'));
  return { bytes: path.join(cacheDir, `${key}.bin`), receipt: path.join(cacheDir, `${key}.json`) };
}

async function acquireSource({ requestedUrl, localPath = null, repoRoot, cacheDir, offline = false,
  keepCache = false, registry = registryDefault, fetchSource, inputKind = 'original-source' }) {
  if (localPath) {
    safeRelativePath(repoRoot, localPath);
    const rootReal = fs.realpathSync(repoRoot);
    const targetReal = fs.realpathSync(path.resolve(repoRoot, localPath));
    safeRelativePath(rootReal, targetReal); // also reject symlinks escaping the checkout
    const bytes = normalizedContentBytes(fs.readFileSync(targetReal), localContentNormalization(localPath));
    return { bytes, receipt: createSourceReceipt({ requestedUrl, bytes, localPath, repoRoot, registry, inputKind, acquisition: 'local-file' }) };
  }
  const files = cacheDir ? cachePaths(cacheDir, requestedUrl) : null;
  if (offline) {
    if (!files || !fs.existsSync(files.bytes) || !fs.existsSync(files.receipt)) throw new Error(`offline source cache miss: ${requestedUrl}`);
    const bytes = fs.readFileSync(files.bytes);
    const receipt = JSON.parse(fs.readFileSync(files.receipt, 'utf8'));
    if (receipt.local_path || receipt.input_kind !== inputKind) throw new Error(`Source cache kind mismatch: ${requestedUrl}`);
    assertReceiptMatches(receipt, bytes, requestedUrl);
    return { bytes, receipt: { ...receipt, acquisition: 'offline-cache' } };
  }
  if (typeof fetchSource !== 'function') throw new Error('Online source acquisition requires a transport');
  const fetched = await fetchSource(requestedUrl);
  const bytes = Buffer.from(fetched.bytes);
  const receipt = createSourceReceipt({ requestedUrl, effectiveUrl: fetched.effectiveUrl, bytes, registry, inputKind,
    resolvedCommit: fetched.resolvedCommit, acquisition: 'downloaded' });
  if (keepCache && files) {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(files.bytes, bytes);
    fs.writeFileSync(files.receipt, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  }
  return { bytes, receipt };
}

function manifestRows(manifest = {}) {
  return ['converted', 'split', 'partial', 'existing_mrs', 'retained', 'failed']
    .flatMap(status => (manifest[status] || []).map(row => ({ ...row, status })));
}

function buildProviderLedger({ rawGraph, mrsManifest = {}, receipts = {}, outputReceipts = {},
  registry = registryDefault, mode = 'full-sync' }) {
  const rows = new Map(manifestRows(mrsManifest).map(row => [row.id, row]));
  const rowsByOutput = new Map();
  for (const row of rows.values()) {
    for (const output of [...(row.generated || []), ...(row.residual ? [row.residual] : [])]) rowsByOutput.set(output.file, row);
  }
  const providers = Object.entries(rawGraph['rule-providers'] || {}).map(([id, provider]) => {
    const generatedMatch = /\/rulesets\/generated\/mihomo-mrs\/([^?#/]+)(?:[?#].*)?$/.exec(provider.url || '');
    const generatedFile = generatedMatch ? decodeURIComponent(generatedMatch[1]) : null;
    const row = rows.get(id) || (generatedFile ? rowsByOutput.get(generatedFile) : null);
    const input = receipts[id] || receipts[row?.id] || row?.source_receipt || null;
    const outputs = [...(row?.generated || []), ...(row?.residual ? [row.residual] : [])]
      .filter(output => !generatedFile || output.file === generatedFile).map(output => ({
      ...output,
      receipt: outputReceipts[output.file] || output.output_receipt || null,
    }));
    return {
      id,
      requested_url: provider.url || null,
      source_provider_id: row?.id || id,
      origin_provider_id: row?.id || id,
      source_requested_url: row?.source_url || row?.url || provider.url || null,
      behavior: provider.behavior || null,
      format: provider.format || null,
      identity: input?.source || sourceIdentity(row?.source_url || row?.url || provider.url, registry),
      input_receipt: input,
      provenance_state: input?.content && input.input_kind !== 'current-local-source' ? input.source.version_state : 'unknown',
      conversion: {
        status: row?.status || (mode === 'legacy-snapshot' ? 'legacy-unrecorded' : 'unrecorded'),
        type_counts: row?.type_counts || null,
        reason: row?.reason || row?.error || null,
        outputs,
      },
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
  return {
    schema_version: 1, mode, provider_count: providers.length,
    stats: {
      input_receipts: providers.filter(item => item.input_receipt?.content).length,
      unknown_provenance: providers.filter(item => item.provenance_state === 'unknown').length,
      pinned_commits: providers.filter(item => item.provenance_state === 'pinned-commit').length,
      output_receipts: providers.reduce((count, item) => count + item.conversion.outputs.filter(out => out.receipt?.content).length, 0),
    },
    providers,
  };
}

function collectManifestOutputReceipts({ mrsManifest, outputDir, repoRoot, inputKind = 'generated-output' }) {
  const receipts = {};
  for (const row of manifestRows(mrsManifest)) {
    for (const output of [...(row.generated || []), ...(row.residual ? [row.residual] : [])]) {
      const file = path.resolve(outputDir, output.file);
      safeRelativePath(outputDir, file);
      const real = fs.realpathSync(file);
      safeRelativePath(fs.realpathSync(outputDir), real);
      const bytes = fs.readFileSync(real);
      if (output.output_receipt) assertReceiptMatches(output.output_receipt, bytes);
      receipts[output.file] = createSourceReceipt({ bytes, localPath: file, repoRoot,
        inputKind, acquisition: inputKind === 'legacy-snapshot' ? 'legacy-snapshot' : 'local-file' });
    }
  }
  return receipts;
}

function buildSnapshotProviderLedger({ rawGraph, normalizedGraph = null, mrsManifest, repoRoot, registry = registryDefault }) {
  const { localPathForRepositoryRuleUrl } = require('./repository-rule-asset');
  const receipts = {};
  for (const [id, provider] of Object.entries(rawGraph['rule-providers'] || {})) {
    const local = localPathForRepositoryRuleUrl(provider.url);
    if (local && !/\.mrs$/i.test(local) && !/[\\/]rulesets[\\/]generated[\\/]/.test(local)) {
      safeRelativePath(repoRoot, fs.realpathSync(local));
      receipts[id] = createSourceReceipt({ requestedUrl: provider.url, bytes: fs.readFileSync(local), localPath: local,
        repoRoot, registry, inputKind: 'current-local-source', acquisition: 'local-file' });
    }
  }
  const outputReceipts = collectManifestOutputReceipts({ mrsManifest, outputDir: path.join(repoRoot, 'rulesets/generated/mihomo-mrs'),
    repoRoot, inputKind: 'legacy-snapshot' });
  const ledger = buildProviderLedger({ rawGraph, mrsManifest, receipts, registry, mode: 'legacy-snapshot', outputReceipts });
  if (normalizedGraph) {
    const normalized = buildProviderLedger({ rawGraph: normalizedGraph, mrsManifest, receipts, registry, mode: 'legacy-snapshot', outputReceipts });
    ledger.normalized_provider_count = normalized.provider_count;
    ledger.normalized_providers = normalized.providers;
  }
  return ledger;
}

module.exports = { sha256, parseGitSource, safeRelativePath, sourceIdentity, createSourceReceipt, assertReceiptMatches,
  cachePaths, acquireSource, buildProviderLedger, collectManifestOutputReceipts, buildSnapshotProviderLedger };
