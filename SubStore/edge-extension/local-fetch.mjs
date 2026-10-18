// Hidden localhost iframe transport. No visible-tab fallback.
const managers = new WeakMap();
const PORT_NAME = 'scki-local-offscreen-v1';
const READY_ATTEMPTS = 20;
const guards = new Set(['site_not_trusted', 'site_permission_required', 'site_access_changed', 'disabled',
  'site_script_registration_failed', 'candidate_superseded', 'document_changed']);
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const failure = code => Object.assign(new Error(code), { code });
const aborted = () => new DOMException('The operation was aborted.', 'AbortError');
function checkAbort(signal) { if (signal?.aborted) throw aborted(); }
function localOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) throw Error();
    return url.origin;
  } catch { throw failure('local_transport_invalid_settings'); }
}
function nonce() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join(''); }
function managerFor(api) {
  const runtime = api.runtime;
  if (!runtime?.onConnect || !api.offscreen) throw failure('local_transport_unavailable');
  if (managers.has(runtime)) return managers.get(runtime);
  const state = { current: null, preparing: Promise.resolve(), sequence: 0 };
  runtime.onConnect.addListener(port => {
    if (port.name !== PORT_NAME) return;
    const job = state.current, sender = port.sender;
    if (!job || job.failed || job.abandoned || job.port) return;
    if (sender?.id !== runtime.id || sender.tab || sender.origin !== job.frontendUrl ||
        sender.url !== job.frontendUrl + '/?api=' + encodeURIComponent(job.backendUrl)) { try { port.disconnect(); } catch {} return; }
    let authenticated = false;
    port.onMessage.addListener(message => {
      if (!authenticated) {
        if (message?.type !== 'LOCAL_TRANSPORT_HELLO' || message.nonce !== job.nonce || job.abandoned || state.current !== job || job.port) {
          try { port.disconnect(); } catch {} return;
        }
        authenticated = true; job.port = port; return;
      }
      const pending = job.pending.get(message?.requestId);
      if (pending && message.type === 'LOCAL_BACKEND_RESPONSE') { job.pending.delete(message.requestId); pending.resolve(message); }
    });
    port.onDisconnect.addListener(() => {
      if (!authenticated || job.port !== port) return;
      job.port = null; job.failed = true;
      for (const pending of job.pending.values()) pending.reject(failure('local_backend_request_failed'));
      job.pending.clear();
    });
  });
  managers.set(runtime, state); return state;
}
async function hasDocument(api, clients) {
  const url = api.runtime.getURL('offscreen.html');
  if (typeof api.runtime.getContexts === 'function') {
    const contexts = await api.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [url] });
    return contexts.some(context => context.documentUrl === url);
  }
  // Chrome 111-115: ServiceWorker Clients sees this extension's hidden window.
  if (!clients?.matchAll) throw failure('local_transport_unavailable');
  const contexts = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  return contexts.some(context => context.url === url);
}
async function cleanupUnused(api, job) {
  if (!job.created || job.used || job.cleanup) return job.cleanup;
  job.cleanup = (async () => {
    try { await api.offscreen.closeDocument(); return { ok: true, errors: [] }; }
    catch { return { ok: false, errors: ['local_transport_document_cleanup_failed'] }; }
  })();
  return job.cleanup;
}
function attachCleanup(error, receipt) { if (receipt?.ok === false) { error.cleanupFailed = true; error.cleanupErrors = receipt.errors; } }

export function createLocalFetcher(api, settings, { sleep = delay, beforeSend = () => {}, clients = globalThis.clients } = {}) {
  const frontendUrl = localOrigin(settings?.frontendUrl), backendUrl = localOrigin(settings?.backendUrl);
  const subscriptionName = settings?.subscriptionName;
  if (typeof subscriptionName !== 'string' || !subscriptionName.trim() || subscriptionName.length > 100 || /[\x00-\x1f\x7f]/.test(subscriptionName)) throw failure('local_transport_invalid_settings');
  const state = managerFor(api), key = frontendUrl + '|' + backendUrl;
  function acquire() {
    let job = state.current;
    if (job && job.key !== key && (job.consumers.size || job.pending.size)) throw failure('local_transport_not_ready');
    if (!job || job.key !== key || job.failed || job.abandoned) {
      // Never replace a document that may still be executing an aborted write.
      if (job?.pending.size) throw failure('local_transport_not_ready');
      job = { key, frontendUrl, backendUrl, nonce: nonce(), consumers: new Set(), pending: new Map(), used: false,
        abandoned: false, failed: false, created: false, port: null };
      state.current = job;
      const wanted = () => { if (job.abandoned || state.current !== job) throw aborted(); };
      job.ready = state.preparing.then(async () => {
        try {
          wanted();
          if (!await hasDocument(api, clients)) {
            wanted();
            await api.offscreen.createDocument({ url: 'offscreen.html', reasons: ['IFRAME_SCRIPTING'],
              justification: 'Use a hidden localhost iframe to communicate with the local Sub-Store using its frontend Origin.' });
            job.created = true;
          }
          wanted();
          await api.runtime.sendMessage({ type: 'CONFIGURE_LOCAL_OFFSCREEN', frontendUrl, backendUrl, nonce: job.nonce });
          for (let attempt = 0; attempt < READY_ATTEMPTS; attempt++) {
            wanted();
            if (job.port) return job.port;
            if (attempt + 1 < READY_ATTEMPTS) await sleep(150);
          }
          throw failure('local_transport_not_ready');
        } catch (error) {
          job.failed = true;
          const safe = error?.name === 'AbortError' || ['local_transport_unavailable', 'local_transport_not_ready'].includes(error?.code) ? error : failure('local_transport_unavailable');
          attachCleanup(safe, await cleanupUnused(api, job));
          throw safe;
        }
      });
      state.preparing = job.ready.then(() => {}, () => {});
      job.ready.catch(() => {});
    }
    const consumer = {}; job.consumers.add(consumer);
    return { job, release() {
      job.consumers.delete(consumer);
      if (!job.consumers.size && !job.used) {
        job.abandoned = true;
        return job.ready.then(() => cleanupUnused(api, job), () => job.cleanup).then(receipt => receipt || { ok: true, errors: [] });
      }
      return Promise.resolve({ ok: true, errors: [] });
    } };
  }
  return async function localFetch(input, request = {}) {
    checkAbort(request.signal);
    let url;
    try {
      if (!(typeof input === 'string' || input instanceof URL)) throw Error();
      url = new URL(input);
      if (url.origin !== backendUrl || url.username || url.password || url.hash) throw Error();
    } catch { throw failure('local_transport_invalid_request'); }
    const method = request.method || 'GET';
    if (!['GET', 'POST', 'PATCH'].includes(method) || (request.body !== undefined && request.body !== null && typeof request.body !== 'string')) throw failure('local_transport_invalid_request');
    const lease = acquire(), job = lease.job, signal = request.signal;
    const operation = (async () => {
      const port = await job.ready;
      checkAbort(signal);
      if (job.abandoned || job.failed || state.current !== job || job.port !== port) throw failure('local_transport_not_ready');
      const message = { type: 'LOCAL_BACKEND_REQUEST', requestId: ++state.sequence, frontendUrl, backendUrl,
        subscriptionName, path: url.pathname + url.search, method, body: request.body };
      try { await beforeSend(message, request); }
      catch (error) {
        if (error instanceof Error && guards.has(error.code) && error.message === error.code) throw error;
        throw failure('local_backend_request_failed');
      }
      checkAbort(signal);
      if (job.port !== port || job.failed || state.current !== job) throw failure('local_transport_not_ready');
      const reply = await new Promise((resolve, reject) => {
        job.pending.set(message.requestId, { resolve, reject });
        // Once dispatched, retain the document even after caller cancellation.
        job.used = true;
        try { port.postMessage(message); }
        catch { job.pending.delete(message.requestId); reject(failure('local_backend_request_failed')); }
      });
      checkAbort(signal);
      if (reply?.ok !== true) throw failure('local_backend_request_failed');
      if (!Number.isInteger(reply.status) || reply.status < 200 || reply.status > 599 || typeof reply.bodyText !== 'string' ||
          typeof reply.contentType !== 'string' || /[\r\n]/.test(reply.contentType)) throw failure('local_transport_invalid_response');
      try { return new Response([204, 205, 304].includes(reply.status) ? null : reply.bodyText,
        { status: reply.status, headers: { 'Content-Type': reply.contentType } }); }
      catch { throw failure('local_transport_invalid_response'); }
    })();
    try {
      if (!signal) return await operation;
      return await new Promise((resolve, reject) => {
        const onAbort = () => { const error = aborted(); error.cleanup = lease.release().then(receipt => { attachCleanup(error, receipt); return receipt; }); reject(error); };
        signal.addEventListener('abort', onAbort, { once: true });
        operation.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
        if (signal.aborted) onAbort();
      });
    } finally { lease.release(); }
  };
}
