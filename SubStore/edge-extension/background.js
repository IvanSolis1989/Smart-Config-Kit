import { SyncError, settingsFrom, candidateURL, syncSubscription, restoreBackup, SubStoreClient } from './core.mjs';
import { createLocalFetcher } from './local-fetch.mjs';
import { chooseSubscription } from './auto-match.mjs';
import { createSiteAccess } from './site-access.mjs';

let queue = Promise.resolve();
function serial(action) { const task = queue.then(action, action); queue = task.catch(() => {}); return task; }
// Admission is intentionally independent of the work queue: an authorized new
// observation must invalidate an older preview before that preview can write.
const generations = new Map(), admissions = new Map(), tabAdmissions = new Map(), observedTabs = new Map(), tabEpochs = new Map();
function version() { return chrome.runtime.getManifest().version; }
function siteOrigin(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.origin : null; }
  catch { return null; }
}
function pageOrigin(sender) {
  const origin = siteOrigin(sender?.url);
  return origin && sender.id === chrome.runtime.id && sender.frameId === 0 && Number.isInteger(sender.tab?.id) && sender.tab.id >= 0 &&
    (sender.documentId === undefined || (typeof sender.documentId === 'string' && sender.documentId.length > 0)) &&
    (sender.documentLifecycle === undefined || sender.documentLifecycle === 'active') &&
    (sender.origin === undefined || sender.origin === origin) &&
    (sender.tab.url === undefined || siteOrigin(sender.tab.url) === origin) ? origin : null;
}
function fromPopup(sender) { return sender?.id === chrome.runtime.id && sender.url === chrome.runtime.getURL('popup.html') && !sender.tab; }
function rootSettings(value = {}) {
  const checked = settingsFrom({ ...value, subscriptionName: 'auto' });
  return { enabled: checked.enabled, backendUrl: checked.backendUrl, frontendUrl: checked.frontendUrl };
}
async function getSettings() { return rootSettings((await chrome.storage.local.get('settings')).settings); }
const siteAccess = createSiteAccess(chrome, { getSettings, onInvalidate: invalidateAccess });
function cleanNames(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(name => typeof name === 'string' && name.trim() && name.length <= 80 &&
    !/[@\u0000-\u001f\u007f-\u009f]|https?:\/\/|[a-z0-9_-]{32}/i.test(name)).map(name => name.trim()))].slice(0, 12);
}
function validNonce(value) { return typeof value === 'string' && /^[a-zA-Z0-9:_-]{16,128}$/.test(value); }
function invalidateAccess(origin) {
  for (const [key, state] of generations) if (origin === null || origin === key) {
    state.generation += 1; state.kind = 'invalid'; state.candidateUrl = null;
  }
  serial(async () => {
    const pending = (await chrome.storage.session.get('pendingByOrigin')).pendingByOrigin || {};
    if (origin === null) await chrome.storage.session.set({ pendingByOrigin: {} });
    else { delete pending[origin]; await chrome.storage.session.set({ pendingByOrigin: pending }); }
  }).catch(() => {});
}
async function documentPresent(ticket) {
  if (!Number.isInteger(ticket.tabId) || !validNonce(ticket.documentNonce)) return false;
  try {
    const tab = await chrome.tabs.get(ticket.tabId);
    if (siteOrigin(tab?.url) !== ticket.origin) return false;
    const reply = await chrome.tabs.sendMessage(ticket.tabId, { type: 'VERIFY_DOCUMENT' }, { frameId: 0 });
    return reply?.present === true && reply.origin === ticket.origin && reply.documentNonce === ticket.documentNonce;
  } catch { return false; }
}
function invalidateCurrentDocument(ticket) {
  const state = generations.get(ticket.origin);
  if (state !== ticket.state || state.documentKey !== ticket.documentKey || state.documentNonce !== ticket.documentNonce) return;
  invalidateAccess(ticket.origin);
}
function invalidateDocument(origin, documentKey) {
  const state = generations.get(origin);
  if (!state || state.documentKey !== documentKey) return;
  state.retired.add(documentKey);
  state.generation += 1;
  state.kind = 'invalid';
  state.candidateUrl = null;
}
function invalidateTab(tabId) {
  const previous = observedTabs.get(tabId);
  if (previous) {
    invalidateDocument(previous.origin, previous.documentKey);
    const state = generations.get(previous.origin);
    const control = observationControl({ ...previous, state, generation: state.generation, tabId });
    serial(async () => {
      await control.checkpoint();
      if (state.kind === 'invalid') await clearPending(previous.origin, control);
    }).catch(() => {});
  }
  observedTabs.delete(tabId);
}
function tabClosed(tabId) {
  if (!observedTabs.has(tabId) && !tabAdmissions.has(tabId)) return;
  tabEpochs.set(tabId, (tabEpochs.get(tabId) || 0) + 1);
  invalidateTab(tabId);
}
function admit(event) {
  const previous = admissions.get(event.origin) || Promise.resolve();
  const previousTab = tabAdmissions.get(event.tabId) || Promise.resolve();
  // Begin authorization at receipt, but apply observations in their arrival order.
  const verification = (async () => {
    for (let attempt = 0; ; attempt++) {
      try { await siteAccess.require(event.origin); return true; }
      catch (error) {
        // Initial context can race startup's permission reconciliation. Retry
        // only this handshake after it settles; candidate sends never retry access.
        if (event.type !== 'PAGE_CONTEXT' || attempt >= 1 || error?.code !== 'site_access_changed') return false;
        await siteAccess.whenIdle();
      }
    }
  })().catch(() => false);
  const admission = Promise.all([previous.catch(() => {}), previousTab.catch(() => {})]).then(async () => {
    if (!await verification) return null;
    if ((tabEpochs.get(event.tabId) || 0) !== event.tabEpoch) return null;
    let state = generations.get(event.origin);
    if (state?.retired.has(event.documentKey)) {
      // A bfcache document may become current again; an old message alone may not revive it.
      if (event.type !== 'PAGE_CONTEXT' || !await documentPresent(event)) return null;
      state.retired.delete(event.documentKey);
    }
    const previousDocument = observedTabs.get(event.tabId);
    if (previousDocument && previousDocument.documentKey !== event.documentKey) invalidateTab(event.tabId);
    if (!state) {
      state = { generation: 0, documentKey: null, kind: 'empty', candidateUrl: null, retired: new Set() };
      generations.set(event.origin, state);
    }
    const documentChanged = state.documentKey !== event.documentKey;
    if (documentChanged) {
      if (state.documentKey) state.retired.add(state.documentKey);
      state.documentKey = event.documentKey;
      state.tabId = event.tabId;
      state.documentNonce = event.documentNonce;
      state.generation += 1;
      state.kind = 'empty'; state.candidateUrl = null;
    }
    if (state.documentNonce !== event.documentNonce) return null;
    if (event.type === 'OBSERVATION_AMBIGUOUS') {
      state.generation += 1; state.kind = 'ambiguous'; state.candidateUrl = null;
    } else if (event.type === 'OBSERVED_SUBSCRIPTION' && (state.kind !== 'candidate' || state.candidateUrl !== event.candidateUrl)) {
      state.generation += 1; state.kind = 'candidate'; state.candidateUrl = event.candidateUrl;
    }
    observedTabs.set(event.tabId, { origin: event.origin, documentKey: event.documentKey, documentNonce: event.documentNonce, tabId: event.tabId });
    return { ...event, state, generation: state.generation, documentChanged };
  }).catch(() => null);
  admissions.set(event.origin, admission);
  tabAdmissions.set(event.tabId, admission);
  return admission;
}
async function settledAdmissions(origin, tabId) {
  for (;;) {
    const pending = admissions.get(origin), tabPending = tabAdmissions.get(tabId);
    await Promise.all([pending, tabPending]);
    if (admissions.get(origin) === pending && tabAdmissions.get(tabId) === tabPending) return;
  }
}
function controlFor(ticket) {
  const control = {
    ticket,
    writeSent: false,
    assertCurrent() {
      if (generations.get(ticket.origin) !== ticket.state || ticket.state.generation !== ticket.generation ||
          ticket.state.documentKey !== ticket.documentKey || ['ambiguous', 'invalid'].includes(ticket.state.kind)) {
        throw new SyncError('candidate_superseded');
      }
    },
    async checkpoint() { await settledAdmissions(ticket.origin, ticket.tabId ?? ticket.state.tabId); control.assertCurrent(); },
  };
  return control;
}
function observationControl(ticket) {
  const control = controlFor(ticket);
  control.assertCurrent = () => {
    if (generations.get(ticket.origin) !== ticket.state || ticket.state.generation !== ticket.generation ||
        ticket.state.documentKey !== ticket.documentKey) throw new SyncError('candidate_superseded');
  };
  return control;
}
function recoverPendingDocument(origin, pending, candidate = false) {
  if (!validNonce(pending?.documentNonce) || !Number.isInteger(pending.tabId) || pending.tabId < 0 ||
      typeof pending.documentKey !== 'string' || !pending.documentKey.startsWith(pending.tabId + ':')) return null;
  const state = { generation: 1, documentKey: pending.documentKey, documentNonce: pending.documentNonce, tabId: pending.tabId,
    kind: candidate ? 'candidate' : 'empty', candidateUrl: candidate ? pending.candidateUrl : null, retired: new Set() };
  generations.set(origin, state);
  observedTabs.set(pending.tabId, { origin, documentKey: pending.documentKey, documentNonce: pending.documentNonce, tabId: pending.tabId });
  return state;
}
function currentFetcher(settings, control) {
  return async (input, request = {}) => {
    await control.checkpoint();
    // Guard the actual send as well as core's PATCH call. The transport's tab
    // readiness awaits must not reopen an authorization/generation race.
    const scopedChrome = { storage: chrome.storage, tabs: {
      create: options => chrome.tabs.create(options),
      remove: id => chrome.tabs.remove(id),
      async sendMessage(id, message) {
        if (message.type === 'LOCAL_BACKEND_REQUEST') {
          await control.checkpoint();
          await siteAccess.require(control.ticket.origin);
          if (!await documentPresent(control.ticket)) {
            invalidateCurrentDocument(control.ticket);
            throw new SyncError('candidate_superseded');
          }
          await control.checkpoint();
          if (request.signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
          if (message.method === 'PATCH') control.writeSent = true;
        }
        return chrome.tabs.sendMessage(id, message);
      },
    } };
    return createLocalFetcher(scopedChrome, settings)(input, request);
  };
}
function capped(map, maximum = 128) { return Object.fromEntries(Object.entries(map).slice(-maximum)); }
async function observe(origin, stage, names, control) {
  await control?.checkpoint();
  const pages = (await chrome.storage.session.get('pageObservations')).pageObservations || {};
  await control?.checkpoint();
  delete pages[origin];
  pages[origin] = { origin, ...(names?.[0] ? { siteName: names[0] } : {}),
    observation: { stage, at: new Date().toISOString(), extensionVersion: version() } };
  await chrome.storage.session.set({ pageObservations: capped(pages) });
}
async function record(origin, result, names, control) {
  await control?.checkpoint();
  const sites = (await chrome.storage.local.get('sites')).sites || {};
  await control?.checkpoint();
  const safe = { ...result, origin, at: new Date().toISOString(), extensionVersion: version() };
  const previous = sites[origin] || {};
  delete sites[origin];
  sites[origin] = { ...previous, origin, ...(names?.[0] ? { siteName: names[0] } : {}),
    ...(result.subscriptionName ? { subscriptionName: result.subscriptionName } : {}), lastResult: safe };
  await chrome.storage.local.set({ sites: capped(sites), lastResult: safe });
  const ok = ['updated', 'unchanged', 'restored'].includes(safe.status);
  await chrome.action.setBadgeText({ text: ok ? 'OK' : safe.status === 'disabled' ? '' : '!' });
  await chrome.action.setBadgeBackgroundColor({ color: ok ? '#16734c' : '#a73a2a' });
  return safe;
}
async function savePending(origin, value, control) {
  await control?.checkpoint();
  const pendingByOrigin = (await chrome.storage.session.get('pendingByOrigin')).pendingByOrigin || {};
  await control?.checkpoint();
  delete pendingByOrigin[origin];
  pendingByOrigin[origin] = value;
  await chrome.storage.session.set({ pendingByOrigin: capped(pendingByOrigin) });
}
async function clearPending(origin, control) {
  const pending = (await chrome.storage.session.get('pendingByOrigin')).pendingByOrigin || {};
  await control.checkpoint();
  delete pending[origin]; await chrome.storage.session.set({ pendingByOrigin: pending });
}
async function readCatalog(settings, control) {
  const catalogSettings = { ...settings, subscriptionName: 'auto' };
  for (let attempt = 0; ; attempt++) {
    try {
      const catalog = await new SubStoreClient(catalogSettings, currentFetcher(catalogSettings, control)).request('/api/subs');
      await control.checkpoint(); return catalog;
    }
    catch (error) {
      // This is read-only and precedes matching, preview, backup and PATCH.
      // A failed or ambiguous write is never retried by this loop.
      if (attempt >= 2 || !['local_transport_unavailable', 'local_transport_not_ready', 'local_backend_request_failed',
        'backend_unavailable', 'backend_timeout'].includes(error?.code)) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt === 0 ? 400 : 1200));
      await control.checkpoint();
    }
  }
}
async function syncCandidate(origin, pending, control, dryRun = false) {
  let matchedName, backupBefore, backupWritten;
  try {
    await control.checkpoint();
    const settings = await siteAccess.require(origin);
    await control.checkpoint();
    const catalog = await readCatalog(settings, control);
    if (!Array.isArray(catalog) || catalog.length > 1000) throw new SyncError('catalog_unavailable');
    const match = chooseSubscription({ candidateUrl: pending.candidateUrl, siteNames: pending.siteNames, catalog });
    if (match.status !== 'matched') throw new SyncError(match.status === 'ambiguous' ? 'auto_match_ambiguous' : 'auto_match_none');
    matchedName = match.subscriptionName;
    const selected = catalog.find(item => item?.name === matchedName);
    const chosen = { ...settings, subscriptionName: match.subscriptionName };
    const result = await syncSubscription({ settings: chosen, candidateUrl: pending.candidateUrl, dryRun,
      expectedBeforeURL: selected.url, allowOriginChange: match.method === 'unique_name_new_origin',
      assertCurrent: control.assertCurrent, fetcher: currentFetcher(chosen, control), saveBackup: async backup => {
        await control.checkpoint();
        const previous = (await chrome.storage.local.get('backups')).backups || [];
        await control.checkpoint();
        const own = previous.filter(item => item.subscriptionName === chosen.subscriptionName && item.backendUrl === settings.backendUrl).slice(0, 2);
        const other = previous.filter(item => item.subscriptionName !== chosen.subscriptionName || item.backendUrl !== settings.backendUrl);
        backupBefore = previous; backupWritten = [{ ...backup, origin }, ...own, ...other].slice(0, 64);
        await chrome.storage.local.set({ backups: backupWritten });
        await control.checkpoint();
      } });
    await control.checkpoint();
    return await record(origin, { ...result, matchMethod: match.method }, pending.siteNames, control);
  } catch (error) {
    try { await control.checkpoint(); }
    catch (currentError) { error = currentError; }
    if (error?.code === 'candidate_superseded') {
      // Keep a backup once a PATCH may have been dispatched. Before dispatch,
      // undo only our exact backup snapshot; never overwrite another writer.
      if (backupWritten && !control.writeSent) {
        const current = (await chrome.storage.local.get('backups')).backups || [];
        if (JSON.stringify(current) === JSON.stringify(backupWritten)) await chrome.storage.local.set({ backups: backupBefore });
      }
      return { status: 'error', code: 'candidate_superseded' };
    }
    return record(origin, { status: 'error', code: error instanceof SyncError ? error.code : 'unexpected_error',
      ...(error?.cleanupFailed === true ? { cleanupFailed: true } : {}),
      candidateHost: new URL(pending.candidateUrl).host, ...(matchedName ? { subscriptionName: matchedName } : {}) }, pending.siteNames, control);
  }
}
async function status() {
  const settings = await getSettings();
  const local = await chrome.storage.local.get(['sites', 'lastResult', 'backups']);
  const session = await chrome.storage.session.get(['pageObservations', 'pendingByOrigin']);
  const sites = { ...local.sites };
  for (const [origin, page] of Object.entries(session.pageObservations || {})) sites[origin] = { ...sites[origin], ...page };
  for (const [origin, site] of Object.entries(sites)) {
    site.hasPending = !!session.pendingByOrigin?.[origin] && Date.now() - session.pendingByOrigin[origin].at <= 30 * 60 * 1000;
    site.backupCount = (local.backups || []).filter(item => item.origin === origin && item.subscriptionName === site.subscriptionName && item.backendUrl === settings.backendUrl).length;
  }
  return { settings, extensionVersion: version(), sites, trustedOrigins: await siteAccess.trustedOrigins(), lastResult: local.lastResult || null };
}

async function currentPopupTab(origin, expectedId) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !Number.isInteger(tab.id) || siteOrigin(tab.url) !== origin || (expectedId !== undefined && tab.id !== expectedId)) throw new SyncError('document_changed');
  return tab;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'DOCUMENT_RETIRED' && sender?.id === chrome.runtime.id && sender.frameId === 0 && Number.isInteger(sender.tab?.id)) {
    const retiredOrigin = siteOrigin(sender.url), state = generations.get(retiredOrigin);
    const documentKey = sender.tab.id + ':' + (sender.documentId || sender.url);
    if (state?.documentKey === documentKey && state.documentNonce === message.documentNonce) invalidateCurrentDocument({ origin: retiredOrigin, state, documentKey, documentNonce: message.documentNonce });
    sendResponse({ received: true }); return true;
  }
  const origin = pageOrigin(sender);
  if (origin && ['PAGE_CONTEXT', 'PAGE_OBSERVER_STATUS', 'OBSERVED_SUBSCRIPTION', 'OBSERVATION_AMBIGUOUS'].includes(message?.type)) {
    if (!validNonce(message.documentNonce)) { sendResponse({ allowed: false, received: false }); return true; }
    if (message.type === 'PAGE_OBSERVER_STATUS' && message.stage !== 'observer_ready') { sendResponse({ received: false }); return true; }
    let candidateUrl;
    try { if (message.type === 'OBSERVED_SUBSCRIPTION') candidateUrl = candidateURL(message.candidateUrl).href; }
    catch { sendResponse({ received: false }); return true; }
    const documentKey = sender.tab.id + ':' + (sender.documentId || sender.url);
    const admission = admit({ origin, type: message.type, names: cleanNames(message.siteNames), candidateUrl, documentKey, documentNonce: message.documentNonce,
      tabId: sender.tab.id, tabEpoch: tabEpochs.get(sender.tab.id) || 0 });
    serial(async () => {
      const ticket = await admission;
      if (!ticket) return { allowed: false, received: false };
      const control = observationControl(ticket), names = ticket.names;
      await control.checkpoint();
      if (ticket.type === 'PAGE_CONTEXT') {
        if (ticket.documentChanged) await clearPending(origin, control);
        await observe(origin, 'bridge_ready', names, control); return { allowed: true };
      }
      if (ticket.type === 'PAGE_OBSERVER_STATUS') {
        await observe(origin, 'observer_ready', names, control); return { received: true };
      }
      if (ticket.type === 'OBSERVATION_AMBIGUOUS') {
        await clearPending(origin, control);
        await observe(origin, 'candidate_ambiguous', names, control);
        await record(origin, { status: 'error', code: 'candidate_ambiguous' }, names, control); return { received: true };
      }
      const previous = (await chrome.storage.session.get('pendingByOrigin')).pendingByOrigin?.[origin];
      await control.checkpoint();
      const completedAgo = Date.now() - previous?.finishedAt;
      if (previous?.candidateUrl === candidateUrl && previous.generation === ticket.generation && previous.documentKey === ticket.documentKey &&
          Number.isFinite(previous.finishedAt) && completedAgo >= 0 && completedAgo < 10000) return { received: true };
      const pending = { candidateUrl, siteNames: names, at: Date.now(), generation: ticket.generation, documentKey: ticket.documentKey,
        documentNonce: ticket.documentNonce, tabId: ticket.tabId };
      await observe(origin, 'candidate_received', names, control);
      await savePending(origin, pending, control);
      const result = await syncCandidate(origin, pending, controlFor(ticket));
      if (result.code !== 'candidate_superseded') await savePending(origin, { ...pending, finishedAt: Date.now() }, control);
      return { received: true };
    }).then(sendResponse, error => sendResponse({ received: error?.code === 'candidate_superseded' }));
    return true;
  }
  if (!fromPopup(sender)) return false;
  if (message?.type === 'GET_STATUS') {
    status().then(sendResponse, () => sendResponse({ status: 'error', code: 'settings_unavailable' })); return true;
  }
  if (message?.type === 'SAVE_SETTINGS' || message?.type === 'UNTRUST_SITE') {
    let action;
    try { action = message.type === 'SAVE_SETTINGS' ? siteAccess.saveSettings(rootSettings(message.settings)) : siteAccess.revoke(siteOrigin(message.origin)); }
    catch (error) { sendResponse({ status: 'error', code: error?.code || 'invalid_settings' }); return true; }
    action.then(async () => sendResponse(message.type === 'SAVE_SETTINGS' ? { settings: await getSettings() } : { status: 'site_untrusted' }),
      error => sendResponse({ status: 'error', code: error?.code || 'site_access_changed' }));
    return true;
  }
  if (message?.type === 'TRUST_CURRENT_SITE') {
    (async () => {
      const origin = siteOrigin(message.origin);
      if (!origin || origin !== message.origin) throw new SyncError('site_not_trusted');
      const tab = await currentPopupTab(origin, message.tabId);
      await siteAccess.grant(origin);
      // Permission was a one-time explicit gesture. Reload once to capture responses already consumed by the page.
      await currentPopupTab(origin, tab.id);
      await chrome.tabs.reload(tab.id);
      return { status: 'site_trusted' };
    })().then(sendResponse, error => sendResponse({ status: 'error', code: error?.code || 'site_access_changed' }));
    return true;
  }
  serial(async () => {
    const selectedOrigin = siteOrigin(message?.origin);
    if (!selectedOrigin) throw new SyncError('open_dashboard_first');
    const settings = await siteAccess.require(selectedOrigin);
    await currentPopupTab(selectedOrigin);
    if (message.type === 'SYNC_PENDING') {
      await settledAdmissions(selectedOrigin);
      const pending = (await chrome.storage.session.get('pendingByOrigin')).pendingByOrigin?.[selectedOrigin];
      if (!pending || Date.now() - pending.at > 30 * 60 * 1000 || !validNonce(pending.documentNonce) || !Number.isInteger(pending.tabId)) throw new SyncError('open_dashboard_first');
      let state = generations.get(selectedOrigin);
      if (!state) {
        // A service-worker restart may keep an unexpired session candidate.
        state = recoverPendingDocument(selectedOrigin, pending, true);
        if (!state) throw new SyncError('open_dashboard_first');
      }
      if (state.kind !== 'candidate' || state.candidateUrl !== pending.candidateUrl) throw new SyncError('candidate_superseded');
      return syncCandidate(selectedOrigin, pending, controlFor({ origin: selectedOrigin, state, generation: state.generation,
        documentKey: state.documentKey, documentNonce: state.documentNonce, tabId: state.tabId }), message.dryRun === true);
    }
    if (message.type === 'RESTORE_LATEST') {
      const site = (await chrome.storage.local.get('sites')).sites?.[selectedOrigin];
      const backups = (await chrome.storage.local.get('backups')).backups || [];
      const backup = backups.find(item => item.origin === selectedOrigin && item.subscriptionName === site?.subscriptionName && item.backendUrl === settings.backendUrl);
      const chosen = { ...settings, subscriptionName: site?.subscriptionName || 'auto' };
      const state = generations.get(selectedOrigin) || recoverPendingDocument(selectedOrigin,
        (await chrome.storage.session.get('pendingByOrigin')).pendingByOrigin?.[selectedOrigin]);
      if (!state || !validNonce(state.documentNonce)) throw new SyncError('open_dashboard_first');
      const control = observationControl({ origin: selectedOrigin, state, generation: state.generation,
        documentKey: state.documentKey, documentNonce: state.documentNonce, tabId: state.tabId });
      const result = await restoreBackup({ settings: chosen, backup, fetcher: currentFetcher(chosen, control) });
      await chrome.storage.local.set({ backups: backups.filter(item => item !== backup) });
      return record(selectedOrigin, result, undefined, control);
    }
    throw new SyncError('unsupported_action');
  }).then(sendResponse, error => sendResponse({ status: 'error', code: error instanceof SyncError ? error.code : 'unexpected_error' }));
  return true;
});
async function initialize() {
  await chrome.storage.local.set({ settings: await getSettings() });
  await siteAccess.refresh();
}
chrome.runtime.onInstalled.addListener(() => { initialize().catch(() => {}); });
chrome.runtime.onStartup?.addListener(() => { initialize().catch(() => {}); });
chrome.tabs.onRemoved?.addListener(tabId => tabClosed(tabId));
chrome.permissions.onRemoved?.addListener(() => { siteAccess.refresh().catch(() => {}); });
chrome.tabs.onUpdated?.addListener((tabId, change) => {
  if (change.status !== 'loading' && change.url === undefined) return;
  const ticket = observedTabs.get(tabId), state = ticket && generations.get(ticket.origin);
  if (!ticket || !state) return;
  const snapshot = { ...ticket, state };
  documentPresent(snapshot).then(present => { if (!present) invalidateCurrentDocument(snapshot); });
});

// Internal deterministic test barrier. No runtime message or page API exposes it.
export async function whenIdle() {
  for (;;) {
    const work = queue, checks = [...admissions.entries()], tabs = [...tabAdmissions.entries()];
    await Promise.allSettled([work, siteAccess.whenIdle(), ...checks.map(([, pending]) => pending), ...tabs.map(([, pending]) => pending)]);
    if (queue === work && checks.length === admissions.size && tabs.length === tabAdmissions.size &&
        checks.every(([origin, pending]) => admissions.get(origin) === pending) && tabs.every(([id, pending]) => tabAdmissions.get(id) === pending)) return;
  }
}
