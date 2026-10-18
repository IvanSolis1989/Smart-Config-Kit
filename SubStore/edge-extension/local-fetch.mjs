// Fixed-purpose transport through this extension's trusted local frontend tab.
const MAX_READY_ATTEMPTS = 20;
const READY_DELAY_MS = 150;

const defaultDelay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function failure(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function aborted() { return new DOMException('The operation was aborted.', 'AbortError'); }

function throwIfAborted(signal) {
  if (signal?.aborted) throw aborted();
}

function abortable(operation, signal) {
  if (!signal) return operation;
  return new Promise((resolve, reject) => {
    const onAbort = () => { cleanup(); reject(aborted()); };
    const cleanup = () => signal.removeEventListener('abort', onAbort);
    signal.addEventListener('abort', onAbort, { once: true });
    operation.then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
    // Cover an abort between the caller's initial check and listener registration.
    if (signal.aborted) onAbort();
  });
}

function loopbackOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port ||
        url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch { throw failure('local_transport_invalid_settings'); }
}

export function createLocalFetcher(chromeApi, settings, { sleep = defaultDelay } = {}) {
  const frontendUrl = loopbackOrigin(settings?.frontendUrl);
  const backendUrl = loopbackOrigin(settings?.backendUrl);
  const subscriptionName = settings?.subscriptionName;
  if (typeof subscriptionName !== 'string' || !subscriptionName.trim() ||
      subscriptionName.length > 100 || /[\x00-\x1f\x7f]/.test(subscriptionName)) {
    throw failure('local_transport_invalid_settings');
  }
  let preparing = null;

  async function ping(id) {
    try {
      const reply = await chromeApi.tabs.sendMessage(id, { type: 'LOCAL_TRANSPORT_PING', frontendUrl });
      return reply?.ready === true && reply.origin === frontendUrl;
    } catch { return false; }
  }

  async function prepare() {
    let saved;
    try { saved = (await chromeApi.storage.session.get('transportTab')).transportTab; }
    catch { throw failure('local_transport_storage_failed'); }
    if (saved && Number.isInteger(saved.id) && saved.id >= 0 &&
        saved.frontendUrl === frontendUrl && saved.backendUrl === backendUrl && await ping(saved.id)) {
      return saved.id;
    }

    let tab;
    try {
      tab = await chromeApi.tabs.create({
        url: frontendUrl + '/?api=' + encodeURIComponent(backendUrl), active: false,
      });
    } catch { throw failure('local_transport_unavailable'); }
    if (!Number.isInteger(tab?.id) || tab.id < 0) throw failure('local_transport_unavailable');
    try {
      await chromeApi.storage.session.set({ transportTab: { id: tab.id, frontendUrl, backendUrl } });
    } catch { throw failure('local_transport_storage_failed'); }
    for (let attempt = 0; attempt < MAX_READY_ATTEMPTS; attempt++) {
      if (await ping(tab.id)) return tab.id;
      if (attempt + 1 < MAX_READY_ATTEMPTS) await sleep(READY_DELAY_MS);
    }
    throw failure('local_transport_not_ready');
  }

  function transport() {
    // All concurrent fetches share creation/readiness; no other tabs are inspected or navigated.
    if (!preparing) {
      preparing = prepare().finally(() => { preparing = null; });
    }
    return preparing;
  }

  return async function localFetch(input, request = {}) {
    const signal = request.signal;
    throwIfAborted(signal);
    let url;
    try {
      url = new URL(input);
      if (url.origin !== backendUrl || url.username || url.password || url.hash ||
          !(typeof input === 'string' || input instanceof URL)) throw new Error();
    } catch { throw failure('local_transport_invalid_request'); }
    const method = request.method || 'GET';
    if (!['GET', 'POST', 'PATCH'].includes(method) ||
        (request.body !== undefined && request.body !== null && typeof request.body !== 'string')) {
      throw failure('local_transport_invalid_request');
    }
    const operation = (async () => {
      const id = await transport();
      throwIfAborted(signal);
      let reply;
      try {
        // Once sent, never recreate a tab or retry: a lost PATCH response may hide a successful write.
        reply = await chromeApi.tabs.sendMessage(id, {
          type: 'LOCAL_BACKEND_REQUEST', frontendUrl, backendUrl, subscriptionName,
          path: url.pathname + url.search, method, body: request.body,
        });
      } catch { throw failure('local_backend_request_failed'); }
      throwIfAborted(signal);
      if (reply?.ok !== true) throw failure('local_backend_request_failed');
      if (!Number.isInteger(reply.status) || reply.status < 200 || reply.status > 599 ||
          typeof reply.bodyText !== 'string' || typeof reply.contentType !== 'string' ||
          /[\r\n]/.test(reply.contentType)) throw failure('local_transport_invalid_response');
      try {
        const body = [204, 205, 304].includes(reply.status) ? null : reply.bodyText;
        return new Response(body, { status: reply.status, headers: { 'Content-Type': reply.contentType } });
      } catch { throw failure('local_transport_invalid_response'); }
    })();
    return abortable(operation, signal);
  };
}
