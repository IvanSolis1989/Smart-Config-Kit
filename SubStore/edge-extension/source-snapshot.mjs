// Restricted source snapshot preparation v1.7.0. Raw nodes never enter storage.
import { SubStoreClient, SyncError, candidateURL, mergeURL, realNodeCount, canonical } from './core.mjs';
import { chooseSubscription } from './auto-match.mjs';

export async function prepareSourceSnapshot({ cloudSettings, localSettings, candidateUrl, expectedBeforeURL, siteNames,
  cloudFetcher, localFetcherFor, readLocalCatalog, checkpoint = async () => {}, allowOriginChange = false, dryRun = false }) {
  const path = '/api/source-snapshot/' + encodeURIComponent(cloudSettings.subscriptionName);
  let policyStatus;
  const cloud = new SubStoreClient(cloudSettings, async (...args) => {
    const response = await cloudFetcher(...args); policyStatus = response.status; return response;
  });
  await checkpoint();
  let policy;
  try { policy = await cloud.request(path); }
  catch (error) {
    // A legacy API may reject an unknown management route; it must not add a
    // local-service dependency to subscriptions that previously worked remotely.
    if (error?.code === 'backend_http_error' && [403, 404].includes(policyStatus)) return undefined;
    throw error;
  }
  await checkpoint();
  if (policy?.allowed === false) return undefined;
  if (policy?.allowed !== true || !Number.isSafeInteger(policy.minNodes) || policy.minNodes < 1 || policy.minNodes > 10000) throw new SyncError('source_snapshot_policy_invalid');
  // "Only validate" continues to mean no backend mutation, including snapshots.
  if (dryRun) return undefined;
  const before = await cloud.getSub();
  await checkpoint();
  if (before.url !== expectedBeforeURL) throw new SyncError('concurrent_change');
  const url = mergeURL(candidateUrl, before.url, allowOriginChange);
  candidateURL(url);
  const catalog = await readLocalCatalog();
  await checkpoint();
  if (!Array.isArray(catalog) || catalog.length > 1000) throw new SyncError('catalog_unavailable');
  const match = chooseSubscription({ candidateUrl: url, siteNames, catalog });
  if (match.status !== 'matched') throw new SyncError(match.status === 'ambiguous' ? 'auto_match_ambiguous' : 'auto_match_none');
  const selected = catalog.find(item => item?.name === match.subscriptionName);
  const chosen = { ...localSettings, subscriptionName: match.subscriptionName };
  const local = new SubStoreClient(chosen, localFetcherFor(chosen));
  const localBefore = await local.getSub();
  await checkpoint();
  if (localBefore.url !== selected.url) throw new SyncError('concurrent_change');
  const preview = await local.preview(localBefore, url);
  await checkpoint();
  // Some providers encode these two account facts as proxy records. Only those
  // exact metadata prefixes may be omitted; unknown invalid/warning nodes fail.
  realNodeCount(preview?.original);
  const original = preview.original.filter(node => !(typeof node?.name === 'string' &&
    /^(剩余流量|套餐到期)[:：]/.test(node.name) && realNodeCount([node]) === 0));
  const originalNodes = realNodeCount(original), processedNodes = realNodeCount(preview?.processed);
  if (!originalNodes || !processedNodes || originalNodes !== original.length) throw new SyncError('candidate_has_no_real_nodes');
  if (originalNodes < policy.minNodes) throw new SyncError('source_snapshot_insufficient_nodes');
  const localCurrent = await local.getSub();
  await checkpoint();
  if (canonical(localCurrent) !== canonical(localBefore)) throw new SyncError('concurrent_change');
  const stored = await cloud.request(path, 'POST', { url, expectedUrl: before.url, original });
  await checkpoint();
  if (stored?.stored !== true || stored.nodeCount !== originalNodes || typeof stored.capturedAt !== 'string' || typeof stored.expiresAt !== 'string' ||
      !Number.isFinite(Date.parse(stored.capturedAt)) || !Number.isFinite(Date.parse(stored.expiresAt)) ||
      Date.parse(stored.expiresAt) <= Date.parse(stored.capturedAt)) throw new SyncError('source_snapshot_invalid_response');
  return { kind: 'validated_local_snapshot', originalNodes, processedNodes,
    capturedAt: new Date(stored.capturedAt).toISOString(), expiresAt: new Date(stored.expiresAt).toISOString() };
}
