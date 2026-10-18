// Durable local snapshot v1.0.0 — Build 2026-10-18.
// Existing local subscriptions only; change history: SubStore/CHANGELOG.md.
import { canonical, realNodeCount, sha256 } from '../edge-extension/core.mjs';
export const VERSION = '1.0.0';

const MAX_BYTES = 4 * 1024 * 1024;
const controls = /[\u0000-\u001f\u007f-\u009f]/u;
const placeholder = /在线设备数量超过套餐允许值|打开官网获取新订阅链接|请复制新订阅链接重新导入更新|使用的设备过多|请去官网获取新订阅链接/u;
const types = new Set(['ss', 'ssr', 'vmess', 'vless', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'wireguard', 'socks5', 'http', 'snell', 'anytls', 'mieru', 'ssh']);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' };
const bytes = value => new TextEncoder().encode(value).byteLength;

function failure(status) {
  return { status, error: { code: status === 409 ? 'local_snapshot_conflict' : status === 503 ? 'local_snapshot_unavailable' : status === 413 ? 'local_snapshot_too_large' : 'local_snapshot_rejected' } };
}
const success = data => ({ status: 200, data });
export const localSnapshotRevision = sub => sha256(canonical(sub));

function validName(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 100 && value.trim().length > 0 && !controls.test(value) && !/[\\/]/u.test(value);
}
function policyFor(env, name) {
  const policies = JSON.parse(env?.SUB_STORE_LOCAL_SNAPSHOT_POLICIES || '[]');
  if (!Array.isArray(policies)) throw new Error();
  const seen = new Set();
  for (const policy of policies) {
    if (!policy || Array.isArray(policy) || typeof policy !== 'object' || Object.keys(policy).sort().join(',') !== 'minNodes,name'
      || !validName(policy.name) || !Number.isSafeInteger(policy.minNodes) || policy.minNodes <= 0 || seen.has(policy.name)) throw new Error();
    seen.add(policy.name);
  }
  return policies.find(policy => policy.name === name);
}
function validateNodes(nodes, minimum) {
  if (!Array.isArray(nodes) || nodes.length < minimum || realNodeCount(nodes) !== nodes.length) throw new Error();
  for (const node of nodes) if (!node || typeof node.name !== 'string' || !node.name.trim() || controls.test(node.name)
    || !types.has(node.type) || placeholder.test(node.name)) throw new Error();
  return nodes.length;
}

/** Caller MUST serialize this entire operation with all other durable writes.
 * Adapters perform native preview without commit, content-only PATCH, readback.
 * The revision covers the COMPLETE subscription including its previous content.
 * No remote URL, processor or source field is accepted from the caller.
 */
export async function executeLocalSnapshotOperation(env, name, body, adapters, signal) {
  let policy;
  try { policy = policyFor(env, name); } catch { return failure(503); }
  if (!policy) return body === null ? success({ allowed: false }) : failure(403);
  if (typeof adapters?.readSubscription !== 'function') return failure(503);
  let before;
  try { before = await adapters.readSubscription(name); } catch { return failure(503); }
  if (!before || before.name !== name || before.source !== 'local' || before.url !== '') return body === null ? success({ allowed: false }) : failure(403);
  let revision;
  try { revision = await localSnapshotRevision(before); } catch { return failure(503); }
  if (body === null) {
    try {
      const preview = await adapters.previewSubscription({ ...JSON.parse(JSON.stringify(before)), noCache: true, ignoreFailedRemoteSub: false });
      const originalNodes = validateNodes(preview?.original, policy.minNodes);
      const processedNodes = validateNodes(preview?.processed, policy.minNodes);
      return success({ name, allowed: true, minNodes: policy.minNodes, revision, originalNodes, processedNodes });
    } catch { return failure(400); }
  }
  if (signal?.aborted) return failure(408);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return failure(400);
  const fields = Object.keys(body).sort().join(',');
  if (!['expectedRevision,original', 'expectedRevision,restoreContent', 'dryRun,expectedRevision,original'].includes(fields)
    || (Object.hasOwn(body, 'dryRun') && body.dryRun !== true) || !/^[a-f0-9]{64}$/.test(body.expectedRevision || '')) return failure(400);
  if (body.expectedRevision !== revision) return failure(409);
  if (typeof adapters.previewSubscription !== 'function' || typeof adapters.writeContent !== 'function') return failure(503);
  let content;
  try {
    if (Object.hasOwn(body, 'original')) { validateNodes(body.original, policy.minNodes); content = JSON.stringify({ proxies: body.original }); }
    else { if (typeof body.restoreContent !== 'string' || !body.restoreContent.trim()) return failure(400); content = body.restoreContent; }
    if (bytes(content) > MAX_BYTES) return failure(413);
  } catch { return failure(400); }
  const candidate = { ...JSON.parse(JSON.stringify(before)), content, noCache: true, ignoreFailedRemoteSub: false };
  let originalNodes, processedNodes;
  try {
    const preview = await adapters.previewSubscription(candidate);
    originalNodes = validateNodes(preview?.original, policy.minNodes);
    processedNodes = validateNodes(preview?.processed, policy.minNodes);
    // Normalized original arrays must survive parsing without loss/replacement.
    if (Object.hasOwn(body, 'original') && originalNodes !== body.original.length) return failure(400);
  } catch { return failure(400); }
  if (signal?.aborted) return failure(408);
  try {
    const current = await adapters.readSubscription(name);
    if (!current || await localSnapshotRevision(current) !== revision) return failure(409);
    if (signal?.aborted) return failure(408);
    if (body.dryRun === true) return success({ status: 'dry_run', name, revision, originalNodes, processedNodes });
    if (content !== before.content) await adapters.writeContent(content, before);
    const after = await adapters.readSubscription(name);
    const expected = { ...before, content };
    if (!after || canonical(after) !== canonical(expected)) return failure(503);
    return success({ status: content === before.content ? 'unchanged' : 'updated', name,
      revision: await localSnapshotRevision(after), originalNodes, processedNodes });
  } catch { return failure(503); }
}

function response(result) {
  return { response: new Response(JSON.stringify(result.status === 200 ? { status: 'success', data: result.data } : { status: 'failed', error: result.error }), {
    status: result.status, headers: { ...cors, 'Content-Type': 'application/json;charset=UTF-8' },
  }) };
}
async function boundedBody(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return failure(400);
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES) return failure(413);
  let reader;
  try {
    reader = request.clone().body?.getReader(); if (!reader) return failure(400);
    const decoder = new TextDecoder('utf-8', { fatal: true }); const parts = []; let length = 0;
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) { void reader.cancel().catch(() => {}); return failure(413); }
      parts.push(decoder.decode(value, { stream: true }));
    }
    parts.push(decoder.decode()); return { body: JSON.parse(parts.join('')) };
  } catch { return failure(400); }
  finally { reader?.releaseLock(); }
}

/** Private dedicated route. operate must call the serialized owner DO RPC.
 * A disconnected client cannot roll back an RPC already dispatched; clients
 * must treat an interrupted POST as unknown and re-read, never blindly retry.
 */
export async function routeLocalSnapshotRequest(request, env, operate) {
  const prefix = env?.SUB_STORE_EXTENSION_BACKEND_PATH;
  if (typeof prefix !== 'string' || !/^\/ext-[a-f0-9]{64}$/.test(prefix)) return null;
  const url = new URL(request.url), base = prefix + '/api/local-snapshot/';
  if (!url.pathname.startsWith(prefix + '/api/local-snapshot')) return null;
  let name;
  try { name = decodeURIComponent(url.pathname.slice(base.length)); } catch { return response(failure(400)); }
  if (!url.pathname.startsWith(base) || !validName(name) || /%[a-f0-9]{2}/i.test(name) || url.search) return response(failure(400));
  if (request.method === 'OPTIONS') return { response: new Response(null, { status: 204, headers: cors }) };
  if (!['GET', 'POST'].includes(request.method)) return response(failure(405));
  let allowed;
  try { allowed = policyFor(env, name); } catch { return response(failure(503)); }
  if (!allowed) return response(request.method === 'GET' ? success({ allowed: false }) : failure(403));
  if (typeof operate !== 'function') return response(failure(503));
  let body = null;
  if (request.method === 'POST') {
    const decoded = await boundedBody(request); if (decoded.status) return response(decoded); body = decoded.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)
      || !['expectedRevision,original', 'expectedRevision,restoreContent', 'dryRun,expectedRevision,original'].includes(Object.keys(body).sort().join(','))
      || (Object.hasOwn(body, 'dryRun') && body.dryRun !== true)) return response(failure(400));
  }
  if (request.signal.aborted) return response(failure(408));
  try { return response(await operate(name, body, request.signal)); } catch { return response(failure(503)); }
}
