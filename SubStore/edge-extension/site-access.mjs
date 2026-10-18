// Explicit website consent is separate from browser host capabilities.
import { SyncError, settingsFrom } from './core.mjs';

const LIMIT = 256;
const SCRIPT_IDS = ['scki-site-main', 'scki-site-bridge'];

function exactOrigin(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname && !url.username && !url.password && url.origin === value ? value : null;
  } catch { return null; }
}

export function permissionPattern(origin) {
  if (!exactOrigin(origin)) throw new SyncError('site_not_trusted');
  const url = new URL(origin);
  // Browser capabilities cover the host; the registry independently enforces ports.
  return url.protocol + '//' + url.hostname + '/*';
}

function registryOrigins(value) {
  if (!value || Array.isArray(value) || value.version !== 1 || !Array.isArray(value.origins) || value.origins.length > LIMIT ||
      value.origins.some(origin => !exactOrigin(origin)) || new Set(value.origins).size !== value.origins.length) return [];
  return [...value.origins];
}

function globalSettings(value) {
  const checked = settingsFrom({ ...value, subscriptionName: 'auto' });
  return { enabled: checked.enabled, backendUrl: checked.backendUrl, frontendUrl: checked.frontendUrl };
}

export function createSiteAccess(chromeApi, { getSettings, onInvalidate = () => {} }) {
  let queue = Promise.resolve(), globalRevision = 0, paused = 0;
  let registrationFailed = false, policyFailed = false;
  const revisions = new Map(), suspended = new Map(), failedOrigins = new Set();

  function invalidate(origin) {
    if (origin === null) globalRevision += 1;
    else revisions.set(origin, (revisions.get(origin) || 0) + 1);
    try { onInvalidate(origin); }
    catch { policyFailed = true; }
  }

  function begin(origin) {
    if (origin === null) paused += 1;
    else suspended.set(origin, (suspended.get(origin) || 0) + 1);
    invalidate(origin);
    return () => {
      if (origin === null) paused -= 1;
      else {
        const remaining = suspended.get(origin) - 1;
        if (remaining) suspended.set(origin, remaining);
        else suspended.delete(origin);
      }
    };
  }

  function enqueue(origin, action) {
    const finish = begin(origin);
    const task = queue.then(async () => {
      try {
        await action();
        if (origin === null) policyFailed = false;
        else failedOrigins.delete(origin);
      } catch (error) {
        if (error?.code !== 'site_script_registration_failed') {
          if (origin === null) policyFailed = true;
          else failedOrigins.add(origin);
        }
        if (error instanceof SyncError) throw error;
        throw new SyncError('site_access_changed');
      } finally { finish(); }
    });
    queue = task.catch(() => {});
    return task;
  }

  async function whenIdle() {
    for (;;) {
      const pending = queue;
      await pending;
      if (queue === pending) return;
    }
  }

  async function readRegistry() {
    try { return registryOrigins((await chromeApi.storage.local.get('trustedOrigins')).trustedOrigins); }
    catch { throw new SyncError('site_access_changed'); }
  }

  async function readSettings() {
    try { return globalSettings(await getSettings()); }
    catch { throw new SyncError('site_access_changed'); }
  }

  async function writeRegistry(origins) {
    try { await chromeApi.storage.local.set({ trustedOrigins: { version: 1, origins } }); }
    catch { throw new SyncError('site_access_changed'); }
  }

  async function hasPermission(origin) {
    try { return await chromeApi.permissions.contains({ origins: [permissionPattern(origin)] }) === true; }
    catch { return false; }
  }

  function ownPage(origin, settings) { return origin === settings.frontendUrl || origin === settings.backendUrl; }

  async function permittedOrigins(origins, settings) {
    const kept = [];
    for (const origin of origins) if (!ownPage(origin, settings) && await hasPermission(origin)) kept.push(origin);
    return kept;
  }

  async function reconcile() {
    const settings = await readSettings();
    const origins = settings.enabled ? await permittedOrigins(await readRegistry(), settings) : [];
    const matches = [...new Set(origins.filter(origin => !failedOrigins.has(origin)).map(permissionPattern))];
    try {
      const existing = await chromeApi.scripting.getRegisteredContentScripts({ ids: SCRIPT_IDS });
      if (!Array.isArray(existing)) throw new Error();
      const ids = existing.map(script => script?.id).filter(id => SCRIPT_IDS.includes(id));
      if (ids.length) await chromeApi.scripting.unregisterContentScripts({ ids });
      if (matches.length) await chromeApi.scripting.registerContentScripts([
        { id: 'scki-site-bridge', js: ['page-bridge.bundle.js'], world: 'ISOLATED', matches,
          runAt: 'document_start', allFrames: false, persistAcrossSessions: true },
        { id: 'scki-site-main', js: ['page-main.bundle.js'], world: 'MAIN', matches,
          runAt: 'document_start', allFrames: false, persistAcrossSessions: true },
      ]);
      registrationFailed = false;
    } catch {
      registrationFailed = true;
      invalidate(null);
      // A partial registration cannot authorize writes; remove only our scripts.
      try { await chromeApi.scripting.unregisterContentScripts({ ids: SCRIPT_IDS }); } catch {}
      throw new SyncError('site_script_registration_failed');
    }
  }

  async function requireAccess(origin) {
    if (!exactOrigin(origin)) throw new SyncError('site_not_trusted');
    const revision = revisions.get(origin) || 0, global = globalRevision;
    function current() {
      if (global !== globalRevision || revision !== (revisions.get(origin) || 0) || paused || suspended.has(origin) ||
          policyFailed || failedOrigins.has(origin)) throw new SyncError('site_access_changed');
      if (registrationFailed) throw new SyncError('site_script_registration_failed');
    }
    await whenIdle(); current();
    const settings = await readSettings(); current();
    if (!settings.enabled) throw new SyncError('disabled');
    if (ownPage(origin, settings)) throw new SyncError('site_not_trusted');
    const origins = await readRegistry(); current();
    if (!origins.includes(origin)) throw new SyncError('site_not_trusted');
    const capable = await hasPermission(origin); current();
    if (!capable) throw new SyncError('site_permission_required');
    await whenIdle(); current();
    return settings;
  }

  function grant(origin) {
    if (!exactOrigin(origin)) return Promise.reject(new SyncError('site_not_trusted'));
    return enqueue(origin, async () => {
      const settings = await readSettings();
      if (ownPage(origin, settings)) throw new SyncError('site_not_trusted');
      if (!await hasPermission(origin)) throw new SyncError('site_permission_required');
      const origins = await readRegistry();
      if (!origins.includes(origin)) {
        if (origins.length >= LIMIT) throw new SyncError('site_trust_limit');
        origins.push(origin);
      }
      await writeRegistry(origins);
      failedOrigins.delete(origin);
      await reconcile();
    });
  }

  function revoke(origin) {
    if (!exactOrigin(origin)) return Promise.reject(new SyncError('site_not_trusted'));
    return enqueue(origin, async () => {
      await writeRegistry((await readRegistry()).filter(value => value !== origin));
      await reconcile();
    });
  }

  function saveSettings(value) {
    let settings;
    try { settings = globalSettings(value); }
    catch { return Promise.reject(new SyncError('invalid_settings')); }
    return enqueue(null, async () => {
      try { await chromeApi.storage.local.set({ settings }); }
      catch { throw new SyncError('site_access_changed'); }
      const origins = await readRegistry();
      await writeRegistry(origins.filter(origin => !ownPage(origin, settings)));
      await reconcile();
    });
  }

  function refresh() {
    return enqueue(null, async () => {
      const settings = await readSettings();
      await writeRegistry(await permittedOrigins(await readRegistry(), settings));
      await reconcile();
    });
  }

  return {
    async allowed(origin) { try { await requireAccess(origin); return true; } catch { return false; } },
    require: requireAccess,
    async trustedOrigins() { await whenIdle(); return readRegistry(); },
    grant, revoke, saveSettings, refresh, whenIdle,
  };
}
