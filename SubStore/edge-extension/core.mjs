// Sub-Store Link Sync v1.3.2 (2026-10-18). See README.md.
export const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  backendUrl: 'http://127.0.0.1:38324',
  frontendUrl: 'http://127.0.0.1:14122',
  subscriptionName: 'auto',
});
const MAX_BODY = 4 * 1024 * 1024;
const WARNING = /设备.{0,20}(超过|超限|上限|允许|限制)|订阅.{0,12}(失效|无效|过期|错误)|打开官网|重新导入|复制新订阅|剩余流量|流量重置|套餐到期|device.{0,12}(limit|exceed)|invalid.{0,12}subscription/i;

export class SyncError extends Error {
  constructor(code) { super(code); this.code = code; }
}

export function settingsFrom(value = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...value };
  try {
    const url = new URL(settings.backendUrl);
    const frontend = new URL(settings.frontendUrl);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port ||
        url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
        frontend.protocol !== 'http:' || frontend.hostname !== '127.0.0.1' || !frontend.port ||
        frontend.username || frontend.password || frontend.pathname !== '/' || frontend.search || frontend.hash ||
        typeof settings.enabled !== 'boolean' || typeof settings.subscriptionName !== 'string' ||
        !settings.subscriptionName.trim() || settings.subscriptionName.length > 100 || /[\r\n\x00-\x1f]/.test(settings.subscriptionName)) {
      throw new Error();
    }
    return { enabled: settings.enabled, backendUrl: url.origin, frontendUrl: frontend.origin, subscriptionName: settings.subscriptionName };
  } catch { throw new SyncError('invalid_settings'); }
}

export function candidateURL(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || /^https?:\/\/[^/?#]*@/i.test(value) || value.length < 8 || value.length >= 8192 || /[\\\s\x00-\x1f\x7f-\x9f]/.test(value)) {
    throw new SyncError('invalid_candidate');
  }
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname) throw new Error();
    return url;
  } catch { throw new SyncError('invalid_candidate'); }
}

export function mergeURL(candidate, previous, allowOriginChange = false) {
  const incoming = candidateURL(candidate);
  const old = candidateURL(previous);
  if (incoming.origin !== old.origin && allowOriginChange !== true) throw new SyncError('candidate_origin_changed');
  if (old.hash && incoming.hash && old.hash !== incoming.hash) throw new SyncError('fragment_conflict');
  if (old.hash) incoming.hash = old.hash;
  return incoming.href;
}

export function withoutCacheKey(value) {
  const url = candidateURL(value);
  if (!url.hash) return url.href;
  let fragment = url.hash.slice(1);
  let decoded;
  try { decoded = decodeURIComponent(fragment); } catch { throw new SyncError('invalid_fragment'); }
  if (decoded.trim().startsWith('{')) {
    let options;
    try { options = JSON.parse(decoded); } catch { throw new SyncError('invalid_fragment'); }
    if (!options || Array.isArray(options) || typeof options !== 'object') throw new SyncError('invalid_fragment');
    if (!Object.hasOwn(options, 'cacheKey')) return url.href;
    delete options.cacheKey;
    url.hash = Object.keys(options).length ? JSON.stringify(options) : '';
  } else {
    // Its parser uses decodeURIComponent, not form decoding: never turn %20 into +.
    const parts = fragment.split('&');
    const retained = parts.filter(part => part.split('=', 1)[0] !== 'cacheKey');
    if (retained.length === parts.length) return url.href;
    url.hash = retained.join('&');
  }
  return url.href;
}

function normalizedNodeHost(value) {
  if (!value || /[\\/@?#%\s\p{Cc}\p{Cf}]/u.test(value)) return null;
  const bracketed = value.startsWith('[');
  if ((bracketed && !value.endsWith(']')) || (!bracketed && /[\[\]]/.test(value))) return null;
  try {
    // WHATWG URL canonicalizes IPv4 alternate spellings, expanded IPv6 and
    // dotted IPv4-mapped IPv6 identically in browsers, without a Node IP parser.
    const authority = value.includes(':') && !bracketed ? '[' + value + ']' : value;
    const parsed = new URL('http://' + authority + '/');
    if (parsed.username || parsed.password || parsed.port || parsed.pathname !== '/' || parsed.search || parsed.hash) return null;
    return parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.+$/, '') || null;
  } catch { return null; }
}

function placeholderHost(host) {
  if (!host || host === '::' || host === '::1' || host === 'localhost' || host.endsWith('.localhost') || /^(?:0|127)\./.test(host)) return true;
  const mapped = /^::ffff:([a-f0-9]{1,4}):([a-f0-9]{1,4})$/.exec(host);
  return Boolean(mapped && [0, 127].includes(parseInt(mapped[1], 16) >>> 8));
}

export function realNodeCount(nodes) {
  if (!Array.isArray(nodes)) throw new SyncError('preview_invalid');
  return nodes.filter(node => {
    if (!node || typeof node !== 'object' || typeof node.server !== 'string' ||
        typeof node.type !== 'string' || /^(direct|reject|block|selector|urltest)$/i.test(node.type) ||
        !Number.isInteger(Number(node.port)) || Number(node.port) <= 0 || Number(node.port) > 65535) return false;
    return !placeholderHost(normalizedNodeHost(node.server)) && !WARNING.test(String(node.name || ''));
  }).length;
}

export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

export async function sha256(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(typeof value === 'string' ? value : canonical(value)));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

function withoutURL(sub) { const copy = { ...sub }; delete copy.url; return copy; }

export class SubStoreClient {
  constructor(settings, fetcher = fetch) { this.settings = settingsFrom(settings); this.fetcher = fetcher; }
  async request(path, method = 'GET', body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await this.fetcher(this.settings.backendUrl + path, {
        method, redirect: 'error', credentials: 'omit', cache: 'no-store', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!response.ok) throw new SyncError('backend_http_error');
      const declaredLength = Number(response.headers.get('content-length') || 0);
      if (declaredLength > MAX_BODY) throw new SyncError('backend_response_too_large');
      const reader = response.body.getReader();
      const chunks = []; let total = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_BODY) { await reader.cancel(); throw new SyncError('backend_response_too_large'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(total); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      let result;
      try { result = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new SyncError('backend_invalid_json'); }
      if (!result || result.status !== 'success') throw new SyncError('backend_rejected');
      return result.data;
    } catch (error) {
      if (error instanceof SyncError) throw error;
      if (['local_transport_invalid_settings', 'local_transport_invalid_request', 'local_transport_storage_failed',
        'local_transport_unavailable', 'local_transport_not_ready', 'local_transport_invalid_response',
        'local_backend_request_failed'].includes(error?.code)) throw new SyncError(error.code);
      throw new SyncError(error?.name === 'AbortError' ? 'backend_timeout' : 'backend_unavailable');
    } finally { clearTimeout(timer); }
  }
  async getSub() {
    const sub = await this.request('/api/sub/' + encodeURIComponent(this.settings.subscriptionName));
    if (!sub || sub.name !== this.settings.subscriptionName || sub.source !== 'remote' ||
        typeof sub.url !== 'string' || !sub.url || /[\r\n]/.test(sub.url) ||
        (['localFirst', 'remoteFirst'].includes(sub.mergeSources) && String(sub.content || '').trim())) throw new SyncError('unsupported_subscription');
    candidateURL(sub.url);
    return sub;
  }
  preview(sub, url) {
    const copy = { ...sub, url: withoutCacheKey(url), noCache: true, ignoreFailedRemoteSub: false };
    return this.request('/api/preview/sub?target=JSON', 'POST', copy);
  }
  patchURL(url) { return this.request('/api/sub/' + encodeURIComponent(this.settings.subscriptionName), 'PATCH', { url }); }
}

export async function syncSubscription({ settings, candidateUrl, fetcher = fetch, saveBackup = async () => {}, dryRun = false, allowOriginChange = false, expectedBeforeURL, assertCurrent = () => {} }) {
  const safeSettings = settingsFrom(settings);
  if (!safeSettings.enabled) return { status: 'disabled' };
  assertCurrent();
  candidateURL(candidateUrl);
  const client = new SubStoreClient(safeSettings, fetcher);
  const before = await client.getSub();
  assertCurrent();
  if (expectedBeforeURL !== undefined && expectedBeforeURL !== before.url) throw new SyncError('concurrent_change');
  const url = mergeURL(candidateUrl, before.url, allowOriginChange);
  const preview = await client.preview(before, url);
  assertCurrent();
  const originalNodes = realNodeCount(preview?.original);
  const processedNodes = realNodeCount(preview?.processed);
  if (!originalNodes || !processedNodes) throw new SyncError('candidate_has_no_real_nodes');
  const metadata = { subscriptionName: safeSettings.subscriptionName, originalNodes, processedNodes, candidateHost: new URL(url).host };
  if (url === before.url) { assertCurrent(); return { status: 'unchanged', ...metadata }; }
  if (dryRun) { assertCurrent(); return { status: 'dry_run', ...metadata }; }
  const current = await client.getSub();
  assertCurrent();
  if (canonical(current) !== canonical(before)) throw new SyncError('concurrent_change');
  const expectedURLHash = await sha256(url);
  assertCurrent();
  const otherFieldsHash = await sha256(withoutURL(before));
  assertCurrent();
  const backup = {
    at: new Date().toISOString(), subscriptionName: safeSettings.subscriptionName,
    backendUrl: safeSettings.backendUrl, previousURL: before.url,
    expectedURLHash, otherFieldsHash,
  };
  assertCurrent();
  await saveBackup(backup);
  assertCurrent();
  // Sub-Store has no atomic conditional PATCH; keep this window short and read back.
  await client.patchURL(url);
  assertCurrent();
  const after = await client.getSub();
  assertCurrent();
  if (after.url !== url || canonical(withoutURL(after)) !== canonical(withoutURL(before))) throw new SyncError('writeback_verification_failed');
  return { status: 'updated', ...metadata };
}

export async function restoreBackup({ settings, backup, fetcher = fetch }) {
  const safeSettings = settingsFrom(settings);
  if (!backup || backup.backendUrl !== safeSettings.backendUrl || backup.subscriptionName !== safeSettings.subscriptionName) throw new SyncError('backup_not_found');
  const client = new SubStoreClient(safeSettings, fetcher);
  const current = await client.getSub();
  if (await sha256(current.url) !== backup.expectedURLHash || await sha256(withoutURL(current)) !== backup.otherFieldsHash) throw new SyncError('concurrent_change');
  candidateURL(backup.previousURL);
  await client.patchURL(backup.previousURL);
  const after = await client.getSub();
  if (after.url !== backup.previousURL || canonical(withoutURL(current)) !== canonical(withoutURL(after))) throw new SyncError('writeback_verification_failed');
  return { status: 'restored', subscriptionName: safeSettings.subscriptionName };
}
