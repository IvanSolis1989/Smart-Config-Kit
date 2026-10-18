// Sub-Store dual-target transport v1.5.0 (2026-10-18). See CHANGELOG.md.
import { candidateURL, normalizeCloudBackendUrl } from './core.mjs';

function failure(code) { return Object.assign(new Error(code), { code }); }
function checkAbort(signal) {
  if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
}

/** A permission-gated service-worker transport, never exposed to page scripts. */
export function createCloudFetcher(chromeApi, settings, {
  assertCurrent = () => {}, onWriteSent = () => {}, fetcher = fetch,
} = {}) {
  let backendUrl;
  try { backendUrl = normalizeCloudBackendUrl(settings?.backendUrl); }
  catch { throw failure('cloud_transport_invalid_settings'); }
  const name = settings?.subscriptionName;
  if (typeof name !== 'string' || !name.trim() || name.length > 100 || /[\x00-\x1f\x7f]/.test(name)) {
    throw failure('cloud_transport_invalid_settings');
  }
  const subPath = '/api/sub/' + encodeURIComponent(name);
  const origin = new URL(backendUrl).origin;

  return async function cloudFetch(input, request = {}) {
    checkAbort(request.signal);
    let path, method;
    try {
      if (typeof input !== 'string' || !input.startsWith(backendUrl + '/')) throw new Error();
      const parsed = new URL(input);
      if (parsed.href !== input || parsed.origin !== origin || parsed.username || parsed.password || parsed.hash) throw new Error();
      path = input.slice(backendUrl.length);
      method = request.method || 'GET';
      const read = method === 'GET' && (path === '/api/subs' || path === subPath);
      const preview = method === 'POST' && path === '/api/preview/sub?target=JSON';
      const patch = method === 'PATCH' && path === subPath;
      if (!read && !preview && !patch) throw new Error();
      if (read && request.body !== undefined && request.body !== null) throw new Error();
      if (preview || patch) {
        if (typeof request.body !== 'string' || new TextEncoder().encode(request.body).length > 4 * 1024 * 1024) throw new Error();
        const body = JSON.parse(request.body);
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
        if (patch) {
          if (Object.keys(body).length !== 1 || !Object.hasOwn(body, 'url')) throw new Error();
          candidateURL(body.url);
        } else if (body.name !== name) throw new Error();
      }
    } catch { throw failure('cloud_transport_invalid_request'); }

    await assertCurrent();
    checkAbort(request.signal);
    let permitted = false;
    try { permitted = await chromeApi.permissions.contains({ origins: [origin + '/*'] }); } catch {}
    if (!permitted) throw failure('cloud_permission_required');
    // Permission lookup is asynchronous: close the candidate/revocation window
    // again immediately before the real request, including its write marker.
    await assertCurrent();
    checkAbort(request.signal);
    if (method === 'PATCH') onWriteSent();
    try {
      return await fetcher(input, { ...request, method, credentials: 'omit', redirect: 'error', cache: 'no-store' });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw failure('cloud_backend_request_failed');
    }
  };
}
