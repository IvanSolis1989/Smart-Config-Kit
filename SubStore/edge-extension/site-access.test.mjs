import test from 'node:test';
import assert from 'node:assert/strict';
import { createSiteAccess, permissionPattern } from './site-access.mjs';

const A = 'https://panel.example';
const B = 'http://192.0.2.19:8080';
const SETTINGS = { enabled: true, backendUrl: 'http://127.0.0.1:38324', frontendUrl: 'http://127.0.0.1:14122' };
const OWNED = ['scki-site-main', 'scki-site-bridge'];
const copy = value => value === undefined ? undefined : structuredClone(value);
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }

function fixture({ registry, permissions = [], enabled = true } = {}) {
  const state = { local: { settings: { ...SETTINGS, enabled }, ...(registry === undefined ? {} : { trustedOrigins: copy(registry) }) },
    permissions: new Set(permissions), scripts: new Map([['unrelated-owner', { id: 'unrelated-owner', matches: ['https://elsewhere.example/*'] }]]),
    invalidations: [], calls: [], fail: '', permissionHook: null };
  const api = {
    storage: { local: {
      async get(key) { if (state.fail === 'get') throw Error('PRIVATE-STORAGE'); return { [key]: copy(state.local[key]) }; },
      async set(value) { if (state.fail === 'set') throw Error('PRIVATE-STORAGE'); Object.assign(state.local, copy(value)); },
    } },
    permissions: { async contains(request) {
      state.calls.push(['contains', copy(request)]);
      if (state.fail === 'permissions') throw Error('PRIVATE-PERMISSION');
      if (state.permissionHook) await state.permissionHook(request);
      return request.origins.every(pattern => state.permissions.has(pattern) || state.permissions.has(pattern.startsWith('https:') ? 'https://*/*' : 'http://*/*'));
    } },
    scripting: {
      async getRegisteredContentScripts({ ids } = {}) {
        if (state.fail === 'getScripts') throw Error('PRIVATE-SCRIPT');
        return [...state.scripts.values()].filter(script => !ids || ids.includes(script.id)).map(copy);
      },
      async unregisterContentScripts({ ids }) {
        state.calls.push(['unregister', copy(ids)]);
        if (state.fail === 'unregister') throw Error('PRIVATE-SCRIPT');
        for (const id of ids) state.scripts.delete(id);
      },
      async registerContentScripts(scripts) {
        state.calls.push(['register', copy(scripts)]);
        if (state.fail === 'register') throw Error('PRIVATE-SCRIPT');
        for (const script of scripts) state.scripts.set(script.id, copy(script));
      },
    },
  };
  const access = createSiteAccess(api, {
    getSettings: async () => copy(state.local.settings),
    onInvalidate: origin => state.invalidations.push(origin),
  });
  return { state, api, access, ownScripts: () => OWNED.map(id => state.scripts.get(id)).filter(Boolean) };
}
const registry = (...origins) => ({ version: 1, origins });

test('permission patterns accept arbitrary canonical HTTP(S) origins without granting sibling ports business trust', () => {
  assert.equal(permissionPattern(A), 'https://panel.example/*');
  assert.equal(permissionPattern(B), 'http://192.0.2.19/*');
  assert.equal(permissionPattern('https://[2001:db8::19]:9443'), 'https://[2001:db8::19]/*');
  for (const invalid of [A + '/', A + '/dashboard', 'HTTPS://PANEL.EXAMPLE', 'https://user:secret@panel.example', 'file:///tmp', 'null', null]) {
    assert.throws(() => permissionPattern(invalid), { code: 'site_not_trusted' });
  }
});

test('default, legacy arrays, observed sites and old broad browser grants never establish explicit trust', async () => {
  for (const saved of [undefined, [A], { origins: [A] }, { version: 0, origins: [A] }, registry(A + '/')]) {
    const f = fixture({ registry: saved, permissions: ['http://*/*', 'https://*/*'] });
    f.state.local.sites = { [A]: { origin: A, subscriptionName: 'brand' } };
    f.state.local.pendingByOrigin = { [A]: { candidateUrl: 'https://subscription.example/?token=private' } };
    assert.deepEqual(await f.access.trustedOrigins(), []);
    assert.equal(await f.access.allowed(A), false);
    await assert.rejects(f.access.require(A), { code: 'site_not_trusted' });
    await f.access.refresh();
    assert.deepEqual(f.state.local.trustedOrigins, registry());
    assert.equal(f.ownScripts().length, 0);
  }
});

test('grant refuses absent browser capability and never persists trust', async () => {
  const f = fixture();
  const operation = f.access.grant(A);
  assert.deepEqual(f.state.invalidations, [A], 'grant invalidates synchronously before any await');
  await assert.rejects(operation, { code: 'site_permission_required' });
  assert.deepEqual(await f.access.trustedOrigins(), []);
  assert.equal(await f.access.allowed(A), false);
});

test('only explicit exact origins register the two owned top-frame worlds and preserve unrelated scripts', async () => {
  const f = fixture({ permissions: ['https://*/*', 'http://*/*'] });
  await f.access.grant(A);
  await f.access.grant(B);
  assert.deepEqual(f.state.local.trustedOrigins, registry(A, B));
  assert.deepEqual(await f.access.require(B), SETTINGS);
  assert.equal(await f.access.allowed('http://192.0.2.19:8081'), false);
  assert.equal(await f.access.allowed('https://child.panel.example'), false);
  assert.ok(f.state.scripts.has('unrelated-owner'));
  assert.equal(f.ownScripts().length, 2);
  for (const script of f.ownScripts()) {
    assert.deepEqual(script.matches, ['https://panel.example/*', 'http://192.0.2.19/*']);
    assert.equal(script.runAt, 'document_start');
    assert.equal(script.allFrames, false);
    assert.equal(script.persistAcrossSessions, true);
    assert.deepEqual(script.js, [script.world === 'MAIN' ? 'page-main.bundle.js' : 'page-bridge.bundle.js']);
  }
  assert.deepEqual(f.ownScripts().map(script => script.world).sort(), ['ISOLATED', 'MAIN']);
  for (const [, ids] of f.state.calls.filter(call => call[0] === 'unregister')) assert.ok(ids.every(id => OWNED.includes(id)));
});

test('revoke immediately invalidates a held require, removes trust, and cannot be undone by broad browser permission', async () => {
  const f = fixture({ registry: registry(A), permissions: ['https://*/*'] });
  const entered = deferred(), release = deferred();
  f.state.permissionHook = async () => { entered.resolve(); await release.promise; };
  const request = f.access.require(A);
  await entered.promise;
  const revoked = f.access.revoke(A);
  assert.deepEqual(f.state.invalidations, [A]);
  release.resolve();
  await assert.rejects(request, { code: 'site_access_changed' });
  await revoked;
  assert.deepEqual(await f.access.trustedOrigins(), []);
  assert.equal(await f.access.allowed(A), false);
});

test('saving disabled settings invalidates in flight immediately, stores only global fields, and unregisters external worlds', async () => {
  const f = fixture({ registry: registry(A), permissions: ['https://*/*'] });
  await f.access.refresh();
  const entered = deferred(), release = deferred();
  f.state.permissionHook = async () => { entered.resolve(); await release.promise; };
  const request = f.access.require(A);
  await entered.promise;
  const operation = f.access.saveSettings({ ...SETTINGS, enabled: false, subscriptionName: 'never-save', arbitrary: 'discard' });
  assert.equal(f.state.invalidations.at(-1), null);
  release.resolve();
  await assert.rejects(request, { code: 'site_access_changed' });
  await operation;
  assert.deepEqual(f.state.local.settings, { ...SETTINGS, enabled: false });
  assert.equal(f.ownScripts().length, 0);
  await assert.rejects(f.access.require(A), { code: 'disabled' });
});

test('a separate airport grant does not cancel an already authorized in-flight require', async () => {
  const f = fixture({ registry: registry(A), permissions: ['http://*/*', 'https://*/*'] });
  const entered = deferred(), release = deferred();
  let paused = false;
  f.state.permissionHook = async request => {
    if (!paused && request.origins[0] === permissionPattern(A)) { paused = true; entered.resolve(); await release.promise; }
  };
  const request = f.access.require(A);
  await entered.promise;
  await f.access.grant(B);
  release.resolve();
  assert.deepEqual(await request, SETTINGS);
  assert.deepEqual(f.state.invalidations, [B]);
});

test('refresh immediately invalidates requests and prunes revoked capabilities and own frontend/backend origins', async () => {
  const f = fixture({ registry: registry(A, B, SETTINGS.backendUrl, SETTINGS.frontendUrl), permissions: ['http://127.0.0.1/*', permissionPattern(A)] });
  const operation = f.access.refresh();
  assert.deepEqual(f.state.invalidations, [null]);
  await operation;
  assert.deepEqual(await f.access.trustedOrigins(), [A]);
  assert.equal(await f.access.allowed(B), false);
  assert.equal(await f.access.allowed(SETTINGS.frontendUrl), false);
  assert.equal(f.ownScripts().length, 2);
  assert.deepEqual(f.ownScripts()[0].matches, [permissionPattern(A)]);
});

test('fresh capability is required after worker recreation and browser-only regrant never restores deleted trust', async () => {
  const f = fixture({ registry: registry(A) });
  await assert.rejects(f.access.require(A), { code: 'site_permission_required' });
  await f.access.refresh();
  f.state.permissions.add('https://*/*');
  assert.equal(await f.access.allowed(A), false);
  assert.deepEqual(await f.access.trustedOrigins(), []);
});

test('granting own Sub-Store origins is refused and max 256 never silently evicts a trusted airport', async () => {
  const origins = Array.from({ length: 256 }, (_, i) => 'https://panel-' + i + '.example');
  const f = fixture({ registry: registry(...origins), permissions: ['http://*/*', 'https://*/*'] });
  await assert.rejects(f.access.grant(SETTINGS.frontendUrl), { code: 'site_not_trusted' });
  await assert.rejects(f.access.grant(A), { code: 'site_trust_limit' });
  assert.deepEqual(await f.access.trustedOrigins(), origins);
  const oversized = fixture({ registry: registry(...origins, A), permissions: ['https://*/*'] });
  assert.deepEqual(await oversized.access.trustedOrigins(), []);
  assert.equal(await oversized.access.allowed(A), false);
});

test('permission and storage failures are fixed, private safe and closed even after a failed revoke', async () => {
  const f = fixture({ registry: registry(A), permissions: ['https://*/*'] });
  f.state.fail = 'permissions';
  await assert.rejects(f.access.require(A), { code: 'site_permission_required' });
  assert.equal(await f.access.allowed(A), false);
  f.state.fail = 'set';
  await assert.rejects(f.access.revoke(A), error => error.code === 'site_access_changed' && !String(error).includes('PRIVATE'));
  f.state.fail = '';
  assert.equal(await f.access.allowed(A), false, 'failed storage must not silently restore revoked authority');
  await f.access.revoke(A);
  assert.deepEqual(await f.access.trustedOrigins(), []);
});

test('dynamic API failures fail closed with one fixed code and can recover through successful reconciliation', async () => {
  for (const failure of ['getScripts', 'unregister', 'register']) {
    const f = fixture({ registry: registry(A), permissions: ['https://*/*'] });
    f.state.scripts.set(OWNED[0], { id: OWNED[0], matches: ['https://legacy.example/*'] });
    f.state.fail = failure;
    await assert.rejects(f.access.refresh(), error => error.code === 'site_script_registration_failed' && !String(error).includes('PRIVATE'));
    assert.equal(await f.access.allowed(A), false);
    f.state.fail = '';
    await f.access.refresh();
    assert.equal(await f.access.allowed(A), true);
    assert.ok(f.state.scripts.has('unrelated-owner'));
  }
});

test('independent serialized policy mutations cannot lose trust and whenIdle drains recovery work', async () => {
  const f = fixture({ permissions: ['https://*/*', 'http://*/*'] });
  await Promise.all([f.access.grant(A), f.access.grant(B)]);
  await f.access.whenIdle();
  assert.deepEqual(await f.access.trustedOrigins(), [A, B]);
  await Promise.all([f.access.revoke(A), f.access.saveSettings({ ...SETTINGS, enabled: false })]);
  await f.access.whenIdle();
  assert.deepEqual(await f.access.trustedOrigins(), [B]);
  assert.equal(f.ownScripts().length, 0);
});
