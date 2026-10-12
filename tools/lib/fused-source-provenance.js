'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { acquireSource, assertReceiptMatches, cachePaths } = require('./source-provenance');

// The MRS and fused passes must consume the same input when a receipt exists.
// Old URL-only caches cannot establish that binding and are never adopted here.
function createFusedSourceLoader({ repoRoot, cacheDir, mrsCacheDir, offline = false, fetchSource }) {
  const pending = new Map();
  const reads = new Map();
  const bindings = new Map();
  async function load({ sourceUrl = null, localPath = null, expectedReceipt = null, providerId = null }) {
    const requestedUrl = sourceUrl || expectedReceipt?.requested_url || null;
    const key = JSON.stringify([requestedUrl, localPath, expectedReceipt?.content?.sha256 || null]);
    if (!bindings.has(key)) bindings.set(key, new Set());
    if (providerId) bindings.get(key).add(providerId);
    if (!pending.has(key)) pending.set(key, (async () => {
      let result;
      if (localPath) {
        result = await acquireSource({ requestedUrl, localPath, repoRoot,
          inputKind: expectedReceipt?.input_kind || 'original-source' });
      } else {
        if (!requestedUrl) throw new Error('Fused source has neither a URL nor a local path');
        const existing = cachePaths(mrsCacheDir, requestedUrl);
        const useMrsCache = expectedReceipt?.content && fs.existsSync(existing.bytes) && fs.existsSync(existing.receipt);
        result = await acquireSource({ requestedUrl, repoRoot,
          cacheDir: useMrsCache ? mrsCacheDir : cacheDir,
          offline: useMrsCache || offline, keepCache: true,
          inputKind: expectedReceipt?.input_kind || 'original-source',
          fetchSource: async () => {
            // Download the consumed pinned URL rather than resolving its branch again.
            const fetched = await fetchSource(expectedReceipt?.effective_url || requestedUrl);
            return { ...fetched, resolvedCommit: expectedReceipt?.source?.resolved_commit || fetched.resolvedCommit };
          },
        });
      }
      if (expectedReceipt?.content) assertReceiptMatches(expectedReceipt, result.bytes, expectedReceipt.requested_url);
      reads.set(key, result.receipt);
      return { text: result.bytes.toString('utf8'), receipt: result.receipt };
    })());
    return pending.get(key);
  }
  return { load, receipts: () => [...reads.entries()].map(([key, receipt]) => ({
    ...receipt, provider_ids: [...bindings.get(key)].sort(),
  })).sort((a, b) => JSON.stringify([a.requested_url, a.local_path, a.content?.sha256])
    .localeCompare(JSON.stringify([b.requested_url, b.local_path, b.content?.sha256]), 'en')) };
}

module.exports = { createFusedSourceLoader };
