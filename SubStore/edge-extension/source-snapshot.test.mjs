import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareSourceSnapshot } from './source-snapshot.mjs';
const CLOUD = { targetId: 'cloud', enabled: true, backendUrl: 'https://worker.example/private', frontendUrl: 'http://127.0.0.1:14122', subscriptionName: 'Cloud Name' };
const LOCAL = { enabled: true, backendUrl: 'http://127.0.0.1:38324', frontendUrl: 'http://127.0.0.1:14122' };
const old = 'https://airport.example/sub?token=old#flowDedup=cloud&cacheKey=old';
const candidateUrl = 'https://airport.example/sub?token=new';
const node = { name: 'Raw node', type: 'trojan', server: 'raw.example', port: 443, password: 'PRIVATE-RAW-PASSWORD' };
const processed = { ...node, name: 'Processed node', server: 'processed.example' };
const source = name => ({ name, displayName: 'Airport', source: 'remote', url: old, process: [{ type: 'Flag Operator' }] });
function fixture({ allowed = true, legacyStatus, preview, localCatalog, concurrent = false, policyData, storedData } = {}) {
  const cloudCalls = [], localCalls = []; let localReads = 0;
  const response = data => new Response(JSON.stringify({ status: 'success', data }), { headers: { 'Content-Type': 'application/json' } });
  const cloudFetcher = async (url, request) => {
    cloudCalls.push({ url, ...request });
    if (url.endsWith('/api/source-snapshot/Cloud%20Name') && request.method === 'GET') return legacyStatus ? new Response('{}', { status: legacyStatus }) : response(policyData || { allowed, minNodes: 1, ttlSeconds: 86400 });
    if (request.method === 'GET') return response(source('Cloud Name'));
    return response(storedData || { stored: true, nodeCount: 1, capturedAt: '2026-10-18T12:00:00Z', expiresAt: '2026-10-19T12:00:00Z' });
  };
  const localFetcherFor = () => async (url, request) => {
    localCalls.push({ url, ...request });
    if (request.method === 'POST') return response(preview || { original: [node], processed: [processed] });
    localReads++; return response({ ...source('Local Name'), ...(concurrent && localReads > 1 ? { ua: 'changed' } : {}) });
  };
  return { cloudCalls, localCalls, input: { cloudSettings: CLOUD, localSettings: LOCAL, expectedBeforeURL: old, candidateUrl,
    siteNames: ['Airport'], cloudFetcher, localFetcherFor, readLocalCatalog: async () => localCatalog || [source('Local Name')], checkpoint: async () => {} } };
}
test('server policy limits the fallback and healthy subscriptions do not require any local access', async () => {
  const f = fixture({ allowed: false });
  f.input.readLocalCatalog = () => assert.fail('healthy cloud source cannot depend on local');
  assert.equal(await prepareSourceSnapshot(f.input), undefined); assert.equal(f.cloudCalls.length, 1); assert.equal(f.localCalls.length, 0);
});
test('old servers denying or lacking policy route retain the previous cloud flow', async () => {
  for (const legacyStatus of [403, 404]) { const f = fixture({ legacyStatus }); assert.equal(await prepareSourceSnapshot(f.input), undefined); assert.equal(f.localCalls.length, 0); }
});
test('only exact fresh candidate raw nodes are uploaded after independent local preview and recheck', async () => {
  const f = fixture(); const metadata = await prepareSourceSnapshot(f.input);
  const upload = f.cloudCalls.find(call => call.method === 'POST'); const body = JSON.parse(upload.body);
  assert.deepEqual(body, { url: candidateUrl + '#flowDedup=cloud&cacheKey=old', expectedUrl: old, original: [node] });
  const preview = JSON.parse(f.localCalls.find(call => call.method === 'POST').body);
  assert.equal(preview.url, candidateUrl + '#flowDedup=cloud'); assert.equal(preview.name, 'Local Name');
  assert.equal(preview.noCache, true); assert.equal(preview.ignoreFailedRemoteSub, false);
  assert.equal(f.localCalls.filter(call => call.method === 'GET').length, 2);
  assert.equal(metadata.kind, 'validated_local_snapshot'); assert.equal(metadata.originalNodes, 1); assert.equal(metadata.processedNodes, 1);
  assert.ok(!JSON.stringify(metadata).includes('PRIVATE')); assert.ok(!JSON.stringify(metadata).includes('token='));
});
test('dry run never uploads or introduces local dependency', async () => {
  const f = fixture(); assert.equal(await prepareSourceSnapshot({ ...f.input, dryRun: true }), undefined);
  assert.equal(f.cloudCalls.length, 1); assert.equal(f.localCalls.length, 0);
});

test('explicit package metadata is removed while all 53 or 68 original real nodes remain unchanged', async () => {
  for (const count of [53, 68]) {
    const original = Array.from({ length: count }, (_, i) => ({ ...node, name: 'Raw ' + i }));
    const metadata = [{ ...node, type: 'vless', name: '剩余流量：711.75 GB' },
      { ...node, type: 'ss', server: '0.0.0.0', name: '套餐到期:长期有效' }];
    const f = fixture({ preview: { original: [...original, ...metadata], processed: [processed] },
      policyData: { allowed: true, minNodes: count },
      storedData: { stored: true, nodeCount: count, capturedAt: '2026-10-18T12:00:00Z', expiresAt: '2026-10-19T12:00:00Z' } });
    const result = await prepareSourceSnapshot(f.input);
    assert.equal(result.originalNodes, count);
    assert.deepEqual(JSON.parse(f.cloudCalls.find(call => call.method === 'POST').body).original, original);
    assert.equal(f.localCalls.filter(call => call.method === 'GET').length, 2);
  }
});

test('unknown invalid or device-limit warning mixed with sufficient real nodes still prevents upload', async () => {
  for (const invalid of [{ ...node, name: 'Unknown invalid', server: '127.0.0.1' },
    { ...node, name: '设备数量超过允许上限' }, { ...node, name: '订阅无效' },
    { ...node, name: '前缀剩余流量：711 GB' }]) {
    const f = fixture({ preview: { original: [node, invalid], processed: [processed] } });
    await assert.rejects(prepareSourceSnapshot(f.input), { code: 'candidate_has_no_real_nodes' });
    assert.equal(f.cloudCalls.filter(call => call.method === 'POST').length, 0);
  }
});
test('absent or ambiguous local match cannot upload', async () => {
  for (const localCatalog of [[], [source('A'), source('B')]]) {
    const f = fixture({ localCatalog }); await assert.rejects(prepareSourceSnapshot(f.input), error => ['auto_match_none', 'auto_match_ambiguous'].includes(error.code));
    assert.equal(f.cloudCalls.filter(call => call.method === 'POST').length, 0);
  }
});
test('empty processed output, placeholder original or concurrent local edit prevents upload', async () => {
  for (const options of [{ preview: { original: [node], processed: [] } }, { preview: { original: [{ ...node, server: '127.0.0.1' }], processed: [processed] } }, { concurrent: true }]) {
    const f = fixture(options); await assert.rejects(prepareSourceSnapshot(f.input), error => ['candidate_has_no_real_nodes', 'concurrent_change'].includes(error.code));
    assert.equal(f.cloudCalls.filter(call => call.method === 'POST').length, 0);
  }
});
test('candidate invalidation after preview cannot upload raw nodes', async () => {
  const f = fixture(); f.input.checkpoint = async () => { if (f.localCalls.some(call => call.method === 'POST')) throw Object.assign(Error('candidate_superseded'), { code: 'candidate_superseded' }); };
  await assert.rejects(prepareSourceSnapshot(f.input), { code: 'candidate_superseded' }); assert.equal(f.cloudCalls.filter(call => call.method === 'POST').length, 0);
});
test('cloud catalog URL drift stops before local preview or upload', async () => {
  const f = fixture(); f.input.expectedBeforeURL = old.replace('old#', 'other#');
  await assert.rejects(prepareSourceSnapshot(f.input), { code: 'concurrent_change' }); assert.equal(f.localCalls.length, 0);
});
test('invalid server policy, insufficient count and unconfirmed upload never manufacture snapshot proof', async () => {
  for (const policyData of [{}, { allowed: true, minNodes: 0 }, { allowed: true, minNodes: '1' }, { allowed: true, minNodes: 10001 }]) {
    const f = fixture({ policyData }); await assert.rejects(prepareSourceSnapshot(f.input), { code: 'source_snapshot_policy_invalid' }); assert.equal(f.localCalls.length, 0);
  }
  const small = fixture({ policyData: { allowed: true, minNodes: 2 } });
  await assert.rejects(prepareSourceSnapshot(small.input), { code: 'source_snapshot_insufficient_nodes' }); assert.equal(small.cloudCalls.filter(call => call.method === 'POST').length, 0);
  for (const storedData of [{ stored: false }, { stored: true, nodeCount: 99, capturedAt: '2026-10-18T12:00:00Z', expiresAt: '2026-10-19T12:00:00Z' },
    { stored: true, nodeCount: 1, capturedAt: 'invalid', expiresAt: '2026-10-19T12:00:00Z' }]) {
    const f = fixture({ storedData }); await assert.rejects(prepareSourceSnapshot(f.input), { code: 'source_snapshot_invalid_response' });
  }
});
