// Download gateway HTTP 530 recovery v1.0.0 — Build 2026-10-18.
// Change history: SubStore/CHANGELOG.md.
export const VERSION = '1.0.0';

/**
 * Called only from the existing origin-authorized gateway path. Recover only
 * transport HTTP 530 on GET/HEAD, once, using the original request budget.
 * Return null for nonmatches, the successful direct Response for a match, or
 * throw without retrying. No gateway credentials or response headers are used.
 */
export async function recoverDownloadGateway530({ gatewayResponse, targetUrl, method, headers, signal, fetchTarget, observe }) {
  if (gatewayResponse?.status !== 530 || (method !== 'GET' && method !== 'HEAD')) return null;
  let target;
  try { target = new URL(targetUrl); } catch { throw new Error('Invalid download gateway recovery target'); }
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) {
    throw new Error('Invalid download gateway recovery target');
  }
  if (signal?.aborted) throw new Error('Download gateway recovery aborted');
  if (typeof fetchTarget !== 'function') throw new Error('Download gateway recovery unavailable');
  const emit = typeof observe === 'function' ? observe : () => {};
  emit('DIRECT_ATTEMPT', 530);
  let response;
  try {
    response = await fetchTarget(targetUrl, { method, headers, signal, redirect: 'manual' });
  } catch (error) {
    emit('DIRECT_THROW', 0);
    throw error;
  }
  if (!Number.isInteger(response?.status) || response.status < 100 || response.status > 599) {
    throw new Error('Invalid download gateway direct recovery response');
  }
  emit('DIRECT_STATUS', response.status);
  if (response.status >= 300 && response.status < 400) throw new Error('Download gateway direct redirect rejected');
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Download gateway direct recovery failed (HTTP ${response.status})`);
  }
  return response;
}
