// Local Sub-Store transport v1.0.0 — 2026-10-18. Local-only extension source.
// ISOLATED world: the browser supplies the frontend Origin naturally.
(() => {
  'use strict';

  const MAX_BODY = 4 * 1024 * 1024;
  const TIMEOUT_MS = 23000;
  const INSTALLED = '__sckiSubstoreLocalTransportV1';
  if (window.top !== window || Object.prototype.hasOwnProperty.call(window, INSTALLED)) return;
  try {
    const page = new URL(window.location.origin);
    if (page.protocol !== 'http:' || page.hostname !== '127.0.0.1' || page.origin !== window.location.origin) return;
  } catch { return; }
  Object.defineProperty(window, INSTALLED, { value: true });

  class TransportError extends Error {
    constructor(code) { super(code); this.code = code; }
  }

  function localOrigin(value, code) {
    if (typeof value !== 'string') throw new TransportError(code);
    const match = /^http:\/\/127\.0\.0\.1:([0-9]{1,5})\/?$/i.exec(value);
    if (!match || Number(match[1]) < 1 || Number(match[1]) > 65535) throw new TransportError(code);
    try { return new URL(value).origin; }
    catch { throw new TransportError(code); }
  }

  function validURL(value) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || value.length >= 8192 || /[\\\s\u0000-\u001f\u007f-\u009f]/u.test(value)) return false;
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
    } catch { return false; }
  }

  function trustedSender(sender) {
    return Boolean(sender && sender.id === chrome.runtime.id && !sender.tab &&
      (sender.url === undefined || sender.url === chrome.runtime.getURL('background.js')));
  }

  function requestFrom(message) {
    const backend = localOrigin(message.backendUrl, 'local_transport_invalid_backend');
    const name = message.subscriptionName;
    if (typeof name !== 'string' || !name.trim() || name.length > 100 || /[\u0000-\u001f\u007f-\u009f]/u.test(name)) throw new TransportError('local_transport_invalid_request');
    let subPath;
    try { subPath = '/api/sub/' + encodeURIComponent(name); }
    catch { throw new TransportError('local_transport_invalid_request'); }
    const { path, method, body } = message;
    const get = method === 'GET' && (path === subPath || path === '/api/subs') && body === undefined;
    const patch = method === 'PATCH' && path === subPath;
    const preview = method === 'POST' && path === '/api/preview/sub?target=JSON';
    if (!get && !patch && !preview) throw new TransportError('local_transport_invalid_request');
    if (!get) {
      if (typeof body !== 'string') throw new TransportError('local_transport_invalid_request');
      let parsed;
      try { parsed = JSON.parse(body); }
      catch { throw new TransportError('local_transport_invalid_request'); }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !validURL(parsed.url)) throw new TransportError('local_transport_invalid_request');
      if (patch && (Object.keys(parsed).length !== 1 || !Object.prototype.hasOwnProperty.call(parsed, 'url'))) throw new TransportError('local_transport_invalid_request');
      if (preview && (parsed.name !== name || parsed.source !== 'remote')) throw new TransportError('local_transport_invalid_request');
    }
    const target = new URL(backend + path);
    // Dot-segment subscription names must not normalize into a global API path.
    if (target.origin !== backend || target.pathname + target.search !== path || target.hash) throw new TransportError('local_transport_invalid_request');
    return { url: target.href, method, body };
  }

  async function bodyText(response) {
    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_BODY) {
      try { await response.body?.cancel(); } catch {}
      throw new TransportError('backend_response_too_large');
    }
    if (!response.body) return '';
    const reader = response.body.getReader();
    const chunks = [];
    let length = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > MAX_BODY) {
          try { await reader.cancel(); } catch {}
          throw new TransportError('backend_response_too_large');
        }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder().decode(bytes);
  }

  async function execute(message) {
    let timer;
    let controller;
    try {
      const frontend = localOrigin(message.frontendUrl, 'local_transport_invalid_frontend');
      if (frontend !== window.location.origin) throw new TransportError('local_transport_invalid_frontend');
      if (message.type === 'LOCAL_TRANSPORT_PING') return { ready: true, origin: window.location.origin };
      const request = requestFrom(message);
      controller = new AbortController();
      timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
      const response = await fetch(request.url, {
        method: request.method, credentials: 'omit', redirect: 'error', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        ...(request.body === undefined ? {} : { body: request.body }),
      });
      return { ok: true, status: response.status, contentType: response.headers.get('content-type') || '', bodyText: await bodyText(response) };
    } catch (error) {
      if (error instanceof TransportError) return { ok: false, code: error.code };
      return { ok: false, code: controller?.signal.aborted || error?.name === 'AbortError' ? 'backend_timeout' : 'backend_unavailable' };
    } finally {
      if (timer !== undefined) window.clearTimeout(timer);
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!trustedSender(sender) || !message || !['LOCAL_TRANSPORT_PING', 'LOCAL_BACKEND_REQUEST'].includes(message.type)) return false;
    const reply = result => { try { sendResponse(result); } catch {} };
    execute(message).then(reply, () => reply({ ok: false, code: 'backend_unavailable' }));
    return true;
  });
})();
