// Extension sync route v1.0.1 — Build 2026-10-18.
// Independent backend path; change history: SubStore/CHANGELOG.md.
export const VERSION = '1.0.1';

const MAX_BODY_BYTES = 4 * 1024 * 1024;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

function reject(status = 403) {
  return { response: new Response(JSON.stringify({ status: 'failed', message: 'Extension sync request rejected' }), {
    status, headers: { ...cors, 'Content-Type': 'application/json;charset=UTF-8' },
  }) };
}

function validName(name) {
  return typeof name === 'string' && name.length >= 1 && name.length <= 100
    && name.trim().length > 0 && !/[\u0000-\u001f\u007f-\u009f]/u.test(name);
}

function validSubscriptionUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)
    || /[\s\u0000-\u001f\u007f-\u009f\\]/u.test(value)
    || /^https?:\/\/[^/?#]*@/i.test(value)) return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

function samePreviewConfiguration(candidate, persisted) {
  const ignored = new Set(['url', 'noCache', 'ignoreFailedRemoteSub']);
  const pending = [[candidate, persisted, true]];
  while (pending.length) {
    const [left, right, top] = pending.pop();
    if (left === right) continue;
    if (!left || !right || typeof left !== 'object' || typeof right !== 'object'
      || Array.isArray(left) !== Array.isArray(right)) return false;
    if (Array.isArray(left) && left.length !== right.length) return false;
    const leftKeys = Object.keys(left).filter((key) => !top || !ignored.has(key)).sort();
    const rightKeys = Object.keys(right).filter((key) => !top || !ignored.has(key)).sort();
    if (leftKeys.length !== rightKeys.length) return false;
    for (let i = 0; i < leftKeys.length; i += 1) {
      if (leftKeys[i] !== rightKeys[i]) return false;
      pending.push([left[leftKeys[i]], right[rightKeys[i]], false]);
    }
  }
  return true;
}

async function readJsonObject(request) {
  const declared = request.headers.get('Content-Length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > MAX_BODY_BYTES) return { status: 413 };
  let reader;
  try {
    reader = request.clone().body?.getReader();
    if (!reader) return { status: 400 };
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const parts = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        // A cloned stream is a tee; waiting for cancellation can wait on the
        // untouched original body. Do not consume or forward rejected input.
        void reader.cancel().catch(() => {});
        return { status: 413 };
      }
      parts.push(decoder.decode(value, { stream: true }));
    }
    parts.push(decoder.decode());
    const body = JSON.parse(parts.join(''));
    if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 400 };
    return { body };
  } catch { return { status: 400 }; }
  finally { if (reader) reader.releaseLock(); }
}

/**
 * Route only the configured extension prefix. Return null for unrelated input,
 * { response } for rejection/preflight, or { request } for the existing backend.
 * Preview alone invokes readSubscription(name) to obtain trusted persisted
 * state; only URL and the explicit safe refresh flags may differ from it.
 * No direct network calls; JSON validation reads a bounded body clone.
 */
export async function routeExtensionSyncRequest(request, env, readSubscription) {
  const prefix = env?.SUB_STORE_EXTENSION_BACKEND_PATH;
  if (typeof prefix !== 'string' || !/^\/ext-[a-f0-9]{64}$/.test(prefix)) return null;
  const url = new URL(request.url);
  if (url.pathname !== prefix && !url.pathname.startsWith(prefix + '/')) return null;

  const path = url.pathname.slice(prefix.length);
  const collection = path === '/api/subs';
  const preview = path === '/api/preview/sub';
  let named = false;
  if (path.startsWith('/api/sub/')) {
    const segment = path.slice('/api/sub/'.length);
    try {
      const name = decodeURIComponent(segment);
      named = validName(name) && !/[\/\\]/.test(name) && name !== '.' && name !== '..'
        && !/%[a-f0-9]{2}/i.test(name);
    } catch { return reject(); }
  }
  if ((!collection && !preview && !named) || (preview ? url.search !== '?target=JSON' : url.search !== '')) return reject();
  if (request.method === 'OPTIONS') return { response: new Response(null, { status: 204, headers: cors }) };
  const allowed = (request.method === 'GET' && (collection || named))
    || (request.method === 'POST' && preview) || (request.method === 'PATCH' && named);
  if (!allowed) return reject();

  if (request.method === 'POST' || request.method === 'PATCH') {
    if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return reject(400);
    const decoded = await readJsonObject(request);
    if (decoded.status) return reject(decoded.status);
    const body = decoded.body;
    if (!validSubscriptionUrl(body.url)) return reject(400);
    if (request.method === 'PATCH') {
      if (Object.keys(body).length !== 1 || !Object.prototype.hasOwnProperty.call(body, 'url')) return reject(400);
    } else {
      if (!validName(body.name) || body.noCache !== true || body.ignoreFailedRemoteSub !== false) return reject(400);
      if (typeof readSubscription !== 'function') return reject(503);
      let persisted;
      try { persisted = await readSubscription(body.name); } catch { return reject(503); }
      if (!persisted || typeof persisted !== 'object' || Array.isArray(persisted)) return reject(503);
      if (persisted.name !== body.name || persisted.source !== 'remote') return reject();
      try { if (!samePreviewConfiguration(body, persisted)) return reject(); }
      catch { return reject(400); }
    }
  }

  url.pathname = path;
  url.searchParams.set('share', 'true');
  const init = { method: request.method, headers: request.headers, signal: request.signal, redirect: 'manual' };
  if (request.method === 'POST' || request.method === 'PATCH') {
    init.body = request.body;
    init.duplex = 'half';
  }
  return { request: new Request(url.href, init) };
}
