import { SyncError, settingsFrom, candidateURL, syncSubscription, restoreBackup, SubStoreClient } from './core.mjs';
import { createLocalFetcher } from './local-fetch.mjs';
import { chooseSubscription } from './auto-match.mjs';

let queue = Promise.resolve();
function serial(action) { const task = queue.then(action, action); queue = task.catch(() => {}); return task; }
function version() { return chrome.runtime.getManifest().version; }
function siteOrigin(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.origin : null; }
  catch { return null; }
}
function pageOrigin(sender) {
  const origin = siteOrigin(sender?.url);
  return origin && sender.id === chrome.runtime.id && sender.frameId === 0 && Number.isInteger(sender.tab?.id) && sender.tab.id >= 0 &&
    (sender.origin === undefined || sender.origin === origin) &&
    (sender.tab.url === undefined || siteOrigin(sender.tab.url) === origin) ? origin : null;
}
function fromPopup(sender) { return sender?.id === chrome.runtime.id && sender.url === chrome.runtime.getURL('popup.html') && !sender.tab; }
function rootSettings(value = {}) {
  const checked = settingsFrom({ ...value, subscriptionName: 'auto' });
  return { enabled: checked.enabled, backendUrl: checked.backendUrl, frontendUrl: checked.frontendUrl };
}
async function getSettings() { return rootSettings((await chrome.storage.local.get('settings')).settings); }
function cleanNames(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(name => typeof name === 'string' && name.trim() && name.length <= 80 &&
    !/[@\u0000-\u001f\u007f-\u009f]|https?:\/\/|[a-z0-9_-]{32}/i.test(name)).map(name => name.trim()))].slice(0, 12);
}
async function allowed(origin, settings) {
  if (!settings.enabled || origin === settings.backendUrl || origin === settings.frontendUrl) return false;
  const url = new URL(origin);
  try { return await chrome.permissions.contains({ origins: [url.protocol + '//' + url.hostname + '/*'] }); }
  catch { return false; }
}
function capped(map, maximum = 128) { return Object.fromEntries(Object.entries(map).slice(-maximum)); }
async function observe(origin, stage, names) {
  const pages = (await chrome.storage.session.get('pageObservations')).pageObservations || {};
  delete pages[origin];
  pages[origin] = { origin, ...(names?.[0] ? { siteName: names[0] } : {}),
    observation: { stage, at: new Date().toISOString(), extensionVersion: version() } };
  await chrome.storage.session.set({ pageObservations: capped(pages) });
}
async function record(origin, result, names) {
  const sites = (await chrome.storage.local.get('sites')).sites || {};
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
async function savePending(origin, value) {
  const pendingByOrigin = (await chrome.storage.session.get('pendingByOrigin')).pendingByOrigin || {};
  delete pendingByOrigin[origin];
  pendingByOrigin[origin] = value;
  await chrome.storage.session.set({ pendingByOrigin: capped(pendingByOrigin) });
}
async function readCatalog(settings) {
  const catalogSettings = { ...settings, subscriptionName: 'auto' };
  for (let attempt = 0; ; attempt++) {
    try { return await new SubStoreClient(catalogSettings, createLocalFetcher(chrome, catalogSettings)).request('/api/subs'); }
    catch (error) {
      // This is read-only and precedes matching, preview, backup and PATCH.
      // A failed or ambiguous write is never retried by this loop.
      if (attempt >= 2 || !['local_transport_unavailable', 'local_transport_not_ready', 'local_backend_request_failed',
        'backend_unavailable', 'backend_timeout'].includes(error?.code)) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt === 0 ? 400 : 1200));
    }
  }
}
async function syncCandidate(origin, pending, dryRun = false) {
  let matchedName;
  try {
    const settings = await getSettings();
    if (!await allowed(origin, settings)) return record(origin, { status: 'disabled' }, pending.siteNames);
    const catalog = await readCatalog(settings);
    if (!Array.isArray(catalog) || catalog.length > 1000) throw new SyncError('catalog_unavailable');
    const match = chooseSubscription({ candidateUrl: pending.candidateUrl, siteNames: pending.siteNames, catalog });
    if (match.status !== 'matched') throw new SyncError(match.status === 'ambiguous' ? 'auto_match_ambiguous' : 'auto_match_none');
    matchedName = match.subscriptionName;
    const selected = catalog.find(item => item?.name === matchedName);
    const chosen = { ...settings, subscriptionName: match.subscriptionName };
    const result = await syncSubscription({ settings: chosen, candidateUrl: pending.candidateUrl, dryRun,
      expectedBeforeURL: selected.url, allowOriginChange: match.method === 'unique_name_new_origin',
      fetcher: createLocalFetcher(chrome, chosen), saveBackup: async backup => {
        const previous = (await chrome.storage.local.get('backups')).backups || [];
        const own = previous.filter(item => item.subscriptionName === chosen.subscriptionName && item.backendUrl === settings.backendUrl).slice(0, 2);
        const other = previous.filter(item => item.subscriptionName !== chosen.subscriptionName || item.backendUrl !== settings.backendUrl);
        await chrome.storage.local.set({ backups: [{ ...backup, origin }, ...own, ...other].slice(0, 64) });
      } });
    return record(origin, { ...result, matchMethod: match.method }, pending.siteNames);
  } catch (error) { return record(origin, { status: 'error', code: error instanceof SyncError ? error.code : 'unexpected_error',
    candidateHost: new URL(pending.candidateUrl).host, ...(matchedName ? { subscriptionName: matchedName } : {}) }, pending.siteNames); }
}
async function status() {
  const settings = await getSettings();
  const local = await chrome.storage.local.get(['sites', 'lastResult', 'backups']);
  const session = await chrome.storage.session.get(['pageObservations', 'pendingByOrigin']);
  const sites = { ...local.sites };
  for (const [origin, page] of Object.entries(session.pageObservations || {})) sites[origin] = { ...sites[origin], ...page };
  for (const [origin, site] of Object.entries(sites)) {
    site.hasPending = !!session.pendingByOrigin?.[origin] && Date.now() - session.pendingByOrigin[origin].at <= 30 * 60 * 1000;
    site.backupCount = (local.backups || []).filter(item => item.subscriptionName === site.subscriptionName && item.backendUrl === settings.backendUrl).length;
  }
  return { settings, extensionVersion: version(), sites, lastResult: local.lastResult || null };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const origin = pageOrigin(sender);
  if (origin && ['PAGE_CONTEXT', 'PAGE_OBSERVER_STATUS', 'OBSERVED_SUBSCRIPTION', 'OBSERVATION_AMBIGUOUS'].includes(message?.type)) {
    serial(async () => {
      const settings = await getSettings();
      if (!await allowed(origin, settings)) return { allowed: false, received: false };
      const names = cleanNames(message.siteNames);
      if (message.type === 'PAGE_CONTEXT') { await observe(origin, 'bridge_ready', names); return { allowed: true }; }
      if (message.type === 'PAGE_OBSERVER_STATUS') {
        if (message.stage !== 'observer_ready') return { received: false };
        await observe(origin, 'observer_ready', names); return { received: true };
      }
      if (message.type === 'OBSERVATION_AMBIGUOUS') {
        await observe(origin, 'candidate_ambiguous', names);
        const pending = (await chrome.storage.session.get('pendingByOrigin')).pendingByOrigin || {};
        delete pending[origin]; await chrome.storage.session.set({ pendingByOrigin: pending });
        await record(origin, { status: 'error', code: 'candidate_ambiguous' }, names); return { received: true };
      }
      const candidateUrl = candidateURL(message.candidateUrl).href;
      const previous = (await chrome.storage.session.get('pendingByOrigin')).pendingByOrigin?.[origin];
      if (previous?.candidateUrl === candidateUrl && Date.now() - (previous.finishedAt || previous.at) < 10000) return { received: true };
      const pending = { candidateUrl, siteNames: names, at: Date.now() };
      await observe(origin, 'candidate_received', names);
      await savePending(origin, pending);
      await syncCandidate(origin, pending);
      await savePending(origin, { ...pending, finishedAt: Date.now() });
      return { received: true };
    }).then(sendResponse, () => sendResponse({ received: false }));
    return true;
  }
  if (!fromPopup(sender)) return false;
  if (message?.type === 'GET_STATUS') {
    status().then(sendResponse, () => sendResponse({ status: 'error', code: 'settings_unavailable' })); return true;
  }
  serial(async () => {
    if (message?.type === 'SAVE_SETTINGS') {
      const settings = rootSettings(message.settings);
      await chrome.storage.local.set({ settings });
      if (!settings.enabled) await chrome.action.setBadgeText({ text: '' });
      return { settings };
    }
    const selectedOrigin = siteOrigin(message?.origin);
    if (!selectedOrigin) throw new SyncError('open_dashboard_first');
    if (message.type === 'SYNC_PENDING') {
      const pending = (await chrome.storage.session.get('pendingByOrigin')).pendingByOrigin?.[selectedOrigin];
      if (!pending || Date.now() - pending.at > 30 * 60 * 1000) throw new SyncError('open_dashboard_first');
      return syncCandidate(selectedOrigin, pending, message.dryRun === true);
    }
    if (message.type === 'RESTORE_LATEST') {
      const settings = await getSettings();
      const site = (await chrome.storage.local.get('sites')).sites?.[selectedOrigin];
      const backups = (await chrome.storage.local.get('backups')).backups || [];
      const backup = backups.find(item => item.subscriptionName === site?.subscriptionName && item.backendUrl === settings.backendUrl);
      const chosen = { ...settings, subscriptionName: site?.subscriptionName || 'auto' };
      const result = await restoreBackup({ settings: chosen, backup, fetcher: createLocalFetcher(chrome, chosen) });
      await chrome.storage.local.set({ backups: backups.filter(item => item !== backup) });
      return record(selectedOrigin, result);
    }
    throw new SyncError('unsupported_action');
  }).then(sendResponse, error => sendResponse({ status: 'error', code: error instanceof SyncError ? error.code : 'unexpected_error' }));
  return true;
});
async function initialize() { await chrome.storage.local.set({ settings: await getSettings() }); }
chrome.runtime.onInstalled.addListener(() => initialize());
chrome.runtime.onStartup?.addListener(() => initialize());
