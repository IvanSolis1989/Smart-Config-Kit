// Fixed-purpose transport through this extension's trusted local frontend tab.
const MAX_READY_ATTEMPTS = 20;
const READY_DELAY_MS = 150;
const sessions = new WeakMap();
const noCleanup = Object.freeze({ ok: true, errors: Object.freeze([]) });
const guardFailures = new Set(['site_not_trusted', 'site_permission_required', 'site_access_changed', 'disabled',
  'site_script_registration_failed', 'candidate_superseded', 'document_changed']);

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

function cleanupMetadata(error, receipt) {
  if (!receipt.ok) {
    error.cleanupFailed = true;
    error.cleanupErrors = receipt.errors;
  }
}

function abortable(operation, signal, release) {
  if (!signal) return operation;
  return new Promise((resolve, reject) => {
    let listening = true;
    const cleanup = () => {
      if (listening) signal.removeEventListener('abort', onAbort);
      listening = false;
    };
    const onAbort = () => {
      cleanup();
      const error = aborted();
      // Abort remains prompt even if tabs.create has not returned an id yet.
      // The receipt exposes eventual cleanup without exposing Chrome exceptions.
      error.cleanup = release().then(receipt => {
        cleanupMetadata(error, receipt);
        return receipt;
      });
      reject(error);
    };
    signal.addEventListener('abort', onAbort, { once: true });
    operation.then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
    // Cover an abort between the caller's initial check and listener registration.
    if (signal.aborted) onAbort();
  });
}

function sessionState(session) {
  if (!sessions.has(session)) sessions.set(session, { tail: Promise.resolve(), jobs: new Map() });
  return sessions.get(session);
}

function withSession(state, action) {
  const result = state.tail.then(action);
  state.tail = result.then(() => {}, () => {});
  return result;
}

function assertWanted(job) {
  if (job.abandoned) throw aborted();
}

function whileWanted(job, operation) {
  assertWanted(job);
  return Promise.race([operation, job.cancelled.then(() => { throw aborted(); })]);
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
  const session = chromeApi.storage.session;
  const state = sessionState(session);
  const key = frontendUrl + '|' + backendUrl;

  async function ping(id) {
    try {
      const reply = await chromeApi.tabs.sendMessage(id, { type: 'LOCAL_TRANSPORT_PING', frontendUrl });
      return reply?.ready === true && reply.origin === frontendUrl;
    } catch { return false; }
  }

  function cleanupOwned(job) {
    if (job.cleanupPromise) return job.cleanupPromise;
    job.cleanupPromise = (async () => {
      // A saved tab is never ours to remove. Once a backend message was submitted,
      // it may carry an in-flight write, so retain that tab even after abort.
      if (job.createdId === null || job.used) return noCleanup;
      const errors = [];
      try { await chromeApi.tabs.remove(job.createdId); }
      catch { errors.push('local_transport_tab_cleanup_failed'); }
      try {
        await withSession(state, async () => {
          const saved = (await session.get('transportTab')).transportTab;
          if (saved?.id === job.createdId && saved.frontendUrl === frontendUrl && saved.backendUrl === backendUrl) {
            await session.set({ transportTab: null });
          }
        });
      } catch { errors.push('local_transport_storage_cleanup_failed'); }
      return { ok: errors.length === 0, errors };
    })();
    return job.cleanupPromise;
  }

  function finishUnused(job) {
    if (!job.settled || job.consumers.size || job.finishing) return;
    job.finishing = true;
    cleanupOwned(job).then(receipt => {
      if (state.jobs.get(key) === job) state.jobs.delete(key);
      job.finish(receipt);
    });
  }

  async function prepare(job) {
    let saved;
    try { saved = (await whileWanted(job, withSession(state, () => session.get('transportTab')))).transportTab; }
    catch {
      assertWanted(job);
      throw failure('local_transport_storage_failed');
    }
    assertWanted(job);
    if (saved && Number.isInteger(saved.id) && saved.id >= 0 &&
        saved.frontendUrl === frontendUrl && saved.backendUrl === backendUrl && await whileWanted(job, ping(saved.id))) {
      return saved.id;
    }

    assertWanted(job);
    let tab;
    try {
      // Creation and storage writes must settle before cleanup: either may finish
      // after the last consumer aborts and otherwise publish an orphaned tab.
      tab = await chromeApi.tabs.create({
        url: frontendUrl + '/?api=' + encodeURIComponent(backendUrl), active: false,
      });
    } catch { throw failure('local_transport_unavailable'); }
    if (!Number.isInteger(tab?.id) || tab.id < 0) throw failure('local_transport_unavailable');
    job.createdId = tab.id;
    assertWanted(job);
    try {
      await withSession(state, async () => {
        assertWanted(job);
        await session.set({ transportTab: { id: tab.id, frontendUrl, backendUrl } });
      });
    } catch {
      assertWanted(job);
      throw failure('local_transport_storage_failed');
    }
    assertWanted(job);
    for (let attempt = 0; attempt < MAX_READY_ATTEMPTS; attempt++) {
      if (await whileWanted(job, ping(tab.id))) return tab.id;
      if (attempt + 1 < MAX_READY_ATTEMPTS) await whileWanted(job, sleep(READY_DELAY_MS));
    }
    throw failure('local_transport_not_ready');
  }

  function acquire() {
    let job = state.jobs.get(key);
    if (!job || job.abandoned || job.failed || job.finishing) {
      const previous = job?.done;
      job = { consumers: new Set(), createdId: null, used: false, abandoned: false, settled: false };
      job.cancelled = new Promise(resolve => { job.cancel = resolve; });
      job.done = new Promise(resolve => { job.finish = resolve; });
      state.jobs.set(key, job);
      const created = job;
      job.promise = Promise.resolve().then(async () => {
        // Do not reuse a tab while an abandoned preparation is removing it.
        if (previous) await previous;
        try { return await prepare(created); }
        catch (error) {
          created.failed = true;
          cleanupMetadata(error, await cleanupOwned(created));
          throw error;
        } finally {
          created.settled = true;
          finishUnused(created);
        }
      });
      // An aborted caller still owns a cleanup receipt; its preparation rejection
      // must not become an unhandled rejection while a late create is settling.
      job.promise.catch(() => {});
    }
    const consumer = {};
    job.consumers.add(consumer);
    let released;
    return { job, release() {
      if (released) return released;
      job.consumers.delete(consumer);
      if (!job.consumers.size && !job.used) {
        job.abandoned = true;
        job.cancel();
        released = job.done;
      } else released = Promise.resolve(noCleanup);
      finishUnused(job);
      return released;
    } };
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
    const lease = acquire();
    const operation = (async () => {
      const id = await lease.job.promise;
      throwIfAborted(signal);
      assertWanted(lease.job);
      let reply;
      try {
        // Once sent, never recreate a tab or retry: a lost PATCH response may hide a successful write.
        lease.job.used = true;
        reply = await chromeApi.tabs.sendMessage(id, {
          type: 'LOCAL_BACKEND_REQUEST', frontendUrl, backendUrl, subscriptionName,
          path: url.pathname + url.search, method, body: request.body,
        });
      } catch (error) {
        // The background wrapper can stop before dispatch after its final access
        // check. Preserve only its fixed guard errors, never raw Chrome failures.
        if (error instanceof Error && guardFailures.has(error.code) && error.message === error.code) throw error;
        throw failure('local_backend_request_failed');
      }
      throwIfAborted(signal);
      if (reply?.ok !== true) throw failure('local_backend_request_failed');
      if (!Number.isInteger(reply.status) || reply.status < 200 || reply.status > 599 ||
          typeof reply.bodyText !== 'string' || typeof reply.contentType !== 'string' ||
          /[\r\n]/.test(reply.contentType)) throw failure('local_transport_invalid_response');
      try {
        const body = [204, 205, 304].includes(reply.status) ? null : reply.bodyText;
        return new Response(body, { status: reply.status, headers: { 'Content-Type': reply.contentType } });
      } catch { throw failure('local_transport_invalid_response'); }
    })().finally(() => { lease.release(); });
    return abortable(operation, signal, lease.release);
  };
}
