// Verified source snapshot v1.0.0 — Build 2026-10-18.
// Availability from user supplied original nodes, not independent source refresh.
// Change history: SubStore/CHANGELOG.md.
import { realNodeCount, canonical, sha256, withoutCacheKey } from '../edge-extension/core.mjs';
export const VERSION = '1.0.0';

const MAX_BYTES = 4 * 1024 * 1024;
const TTL = 86400;
const CANDIDATE_WINDOW = 120000;
const errors = /在线设备数量超过套餐允许值|打开官网获取新订阅链接|请复制新订阅链接重新导入更新|使用的设备过多|请去官网获取新订阅链接/u;
const controls = /[\u0000-\u001f\u007f-\u009f]/u;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' };

function reply(data, status = 200) {
  return { response: new Response(JSON.stringify(status === 200 ? { status: 'success', data } : {
    status: 'failed', error: { code: status === 413 ? 'source_snapshot_too_large' : status === 503 ? 'source_snapshot_unavailable' : 'source_snapshot_rejected' },
  }), { status, headers: { ...cors, 'Content-Type': 'application/json;charset=UTF-8' } }) };
}

function validName(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 100 && value.trim().length > 0
    && !controls.test(value) && !/[\\/]/u.test(value);
}

function checkedUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || /[\s\u0000-\u001f\u007f-\u009f\\]/u.test(value)) throw new Error();
  const url = new URL(value);
  if (!url.hostname || url.username || url.password || /^https?:\/\/[^/?#]*@/i.test(value)) throw new Error();
  return url;
}

function identity(value) {
  checkedUrl(value);
  return withoutCacheKey(value);
}

function policies(env) {
  const value = JSON.parse(env?.SUB_STORE_SOURCE_SNAPSHOT_POLICIES || '[]');
  if (!Array.isArray(value)) throw new Error();
  const seen = new Set();
  for (const policy of value) {
    if (!policy || typeof policy !== 'object' || Array.isArray(policy) || Object.keys(policy).sort().join(',') !== 'minNodes,name'
      || !validName(policy.name) || !Number.isSafeInteger(policy.minNodes) || policy.minNodes <= 0 || seen.has(policy.name)) throw new Error();
    seen.add(policy.name);
  }
  return value;
}

function configuration(sub) {
  return canonical(Object.fromEntries(Object.entries(sub).filter(([key]) => !['url', 'noCache', 'ignoreFailedRemoteSub'].includes(key))));
}

const digest = sha256;

async function key(name, url) {
  return 'scki:source-snapshot:v1:' + await digest(name + '\n' + identity(url).split('#')[0]);
}

function validateNodes(original, minimum) {
  const supported = new Set(['ss', 'ssr', 'vmess', 'vless', 'trojan', 'hysteria', 'hysteria2', 'tuic', 'wireguard', 'socks5', 'http', 'snell', 'anytls', 'mieru', 'ssh']);
  if (!Array.isArray(original) || original.length < minimum || realNodeCount(original) !== original.length) throw new Error();
  for (const node of original) {
    if (!node || typeof node !== 'object' || Array.isArray(node) || typeof node.name !== 'string' || !node.name.trim() || controls.test(node.name)
      || errors.test(node.name) || !supported.has(node.type)) throw new Error();
  }
}

async function readBody(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return { status: 400 };
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES) return { status: 413 };
  let reader;
  try {
    reader = request.clone().body?.getReader();
    if (!reader) return { status: 400 };
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const parts = []; let size = 0;
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { void reader.cancel().catch(() => {}); return { status: 413 }; }
      parts.push(decoder.decode(value, { stream: true }));
    }
    parts.push(decoder.decode());
    const body = JSON.parse(parts.join(''));
    if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 400 };
    return { body };
  } catch { return { status: 400 }; }
  finally { reader?.releaseLock(); }
}

async function usable(env, record, policy, sub, logicalUrl) {
  if (!record || record.schemaVersion !== 1 || record.name !== policy.name || sub?.name !== policy.name || sub.source !== 'remote') return false;
  const now = Date.now();
  if (!Number.isSafeInteger(record.capturedAt) || !Number.isSafeInteger(record.expiresAt) || record.capturedAt > now
    || record.expiresAt !== record.capturedAt + TTL * 1000 || now >= record.expiresAt || typeof record.body !== 'string' || new TextEncoder().encode(record.body).byteLength > MAX_BYTES) return false;
  if (record.configHash !== await digest(configuration(sub)) || record.sha256 !== await digest(record.body)) return false;
  const normalized = identity(record.url);
  if (identity(logicalUrl) !== normalized) return false;
  const current = identity(sub.url);
  if (current !== normalized && (sub.url !== record.expectedUrl || now - record.capturedAt > CANDIDATE_WINDOW)) return false;
  const document = JSON.parse(record.body);
  if (!document || Object.keys(document).join(',') !== 'proxies') return false;
  validateNodes(document.proxies, policy.minNodes);
  return document.proxies.length === record.nodeCount;
}

/** The secret prefix authenticates the trusted client. Original nodes are
 * normalized preview output, NOT the provider's byte-for-byte HTTP response.
 * The client must perform a fresh strict local preview before every POST.
 */
export async function routeSourceSnapshotRequest(request, env, readSubscription) {
  const prefix = env?.SUB_STORE_EXTENSION_BACKEND_PATH;
  if (typeof prefix !== 'string' || !/^\/ext-[a-f0-9]{64}$/.test(prefix)) return null;
  const url = new URL(request.url);
  if (!url.pathname.startsWith(prefix + '/api/source-snapshot')) return null;
  const path = url.pathname.slice((prefix + '/api/source-snapshot/').length);
  let name;
  try { name = decodeURIComponent(path); } catch { return reply(null, 400); }
  if (url.search || !validName(name) || /%[a-f0-9]{2}/i.test(name) || !url.pathname.startsWith(prefix + '/api/source-snapshot/')) return reply(null, 400);
  if (request.method === 'OPTIONS') return { response: new Response(null, { status: 204, headers: cors }) };
  if (!['GET', 'POST'].includes(request.method)) return reply(null, 405);
  let allowed;
  try { allowed = policies(env).find(policy => policy.name === name); } catch { return reply(null, 503); }
  if (!allowed) return request.method === 'GET' ? reply({ allowed: false }) : reply(null, 403);
  if (typeof readSubscription !== 'function' || !env.SUB_STORE_DATA?.get || !env.SUB_STORE_DATA?.put) return reply(null, 503);
  let sub;
  try { sub = await readSubscription(name); } catch { return reply(null, 503); }
  if (!sub || typeof sub !== 'object') return reply(null, 503);
  if (sub.name !== name || sub.source !== 'remote') return reply(null, 403);
  if (request.method === 'GET') {
    const data = { allowed: true, minNodes: allowed.minNodes, ttlSeconds: TTL, available: false };
    try {
      const record = await env.SUB_STORE_DATA.get(await key(name, sub.url), 'json');
      if (await usable(env, record, allowed, sub, sub.url)) Object.assign(data, { available: true, nodeCount: record.nodeCount, capturedAt: new Date(record.capturedAt).toISOString(), expiresAt: new Date(record.expiresAt).toISOString(), urlMatchesCurrent: identity(record.url) === identity(sub.url) });
    } catch { return reply(null, 503); }
    return reply(data);
  }
  const decoded = await readBody(request);
  if (decoded.status) return reply(null, decoded.status);
  const body = decoded.body;
  if (Object.keys(body).sort().join(',') !== 'expectedUrl,original,url') return reply(null, 400);
  if (body.expectedUrl !== sub.url) return reply(null, 409);
  let record;
  try {
    checkedUrl(body.expectedUrl); identity(body.url); validateNodes(body.original, allowed.minNodes);
    const content = JSON.stringify({ proxies: body.original });
    if (new TextEncoder().encode(content).byteLength > MAX_BYTES) return reply(null, 413);
    const capturedAt = Date.now();
    record = { schemaVersion: 1, name, url: body.url, expectedUrl: body.expectedUrl, capturedAt, expiresAt: capturedAt + TTL * 1000,
      nodeCount: body.original.length, sha256: await digest(content), configHash: await digest(configuration(sub)), body: content };
  } catch { return reply(null, 400); }
  try {
    const current = await readSubscription(name);
    if (!current || current.url !== body.expectedUrl || configuration(current) !== configuration(sub)) return reply(null, 409);
    await env.SUB_STORE_DATA.put(await key(name, body.url), JSON.stringify(record), { expirationTtl: TTL });
  } catch { return reply(null, 503); }
  return reply({ stored: true, nodeCount: record.nodeCount, capturedAt: new Date(record.capturedAt).toISOString(), expiresAt: new Date(record.expiresAt).toISOString(), sha256: record.sha256 });
}

async function isChallenge(response) {
  if (response.status !== 403) return false;
  if (response.headers.get('cf-mitigated')?.toLowerCase() === 'challenge') return true;
  if (!/^text\/html\b/i.test(response.headers.get('content-type') || '')) return false;
  const reader = response.clone().body?.getReader();
  if (!reader) return false;
  try {
    let size = 0; const parts = []; const decoder = new TextDecoder();
    while (size < 32768) {
      const { done, value } = await reader.read(); if (done) break;
      parts.push(decoder.decode(value.subarray(0, 32768 - size))); size += value.byteLength;
    }
    return /\/cdn-cgi\/challenge-platform\/|(?:cf-chl-|_cf_chl_opt)/i.test(parts.join(''));
  } finally { void reader.cancel().catch(() => {}); reader.releaseLock(); }
}

/** Strict fetch first. The optional logicalUrl binds preview fragments that
 * never appear on HTTP requests; absent it, only the current persisted URL can
 * match. Callback reads the current request's durable configuration, no RPC to
 * the same queued Durable Object. Failures retain the exact upstream response.
 */
export async function fetchWithSourceSnapshot(env, url, init = {}, fetchTarget, readSubscription, logicalUrl) {
  const response = await fetchTarget(url, init);
  if (String(init.method || 'GET').toUpperCase() !== 'GET' || init.signal?.aborted || typeof readSubscription !== 'function') return response;
  try {
    if (!await isChallenge(response)) return response;
    const wireUrl = checkedUrl(url).href.split('#')[0];
    for (const policy of policies(env)) {
      const sub = await readSubscription(policy.name);
      if (!sub || sub.source !== 'remote') continue;
      const requested = logicalUrl || sub.url;
      if (identity(requested).split('#')[0] !== wireUrl) continue;
      const record = await env.SUB_STORE_DATA.get(await key(policy.name, requested), 'json');
      if (!await usable(env, record, policy, sub, requested)) continue;
      const actualAgent = new Headers(init.headers).get('user-agent');
      if (sub.ua && actualAgent !== sub.ua) continue;
      if (init.signal?.aborted) return response;
      return new Response(record.body, { status: 200, headers: { 'Content-Type': 'application/json;charset=UTF-8', 'Cache-Control': 'no-store', 'X-Sub-Store-Source-Snapshot': '1' } });
    }
  } catch { /* An unusable snapshot cannot turn a failed origin into success. */ }
  return response;
}
