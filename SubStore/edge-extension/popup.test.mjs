import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Execute the actual browser module while preserving the repository's existing Node package type.
const source = (await readFile(new URL('./popup.js', import.meta.url), 'utf8'))
  .replace(/from '\.\/([^']+)'/g, (_, file) => `from '${new URL(file, import.meta.url).href}'`);
const { createPopup, pageOrigin, globalSettingsFrom, resultView } =
  await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const clone = value => structuredClone(value);
const SETTINGS = Object.freeze({ enabled: true, backendUrl: 'http://127.0.0.1:38324', frontendUrl: 'http://127.0.0.1:14122' });
const VERSION = '1.3.0', ORIGIN = 'https://airport.example.com';

class Element {
  value = ''; checked = false; disabled = false; hidden = false; textContent = ''; className = '';
  listeners = new Map(); attributes = new Map(); children = [];
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  emit(type) { return this.listeners.get(type)?.({ target: this }); }
}

async function fixture({ url = ORIGIN + '/dashboard?token=never-display', sites, saveError } = {}) {
  const html = await readFile(new URL('./popup.html', import.meta.url), 'utf8');
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element()]));
  const document = { body: new Element(), getElementById: id => elements.get(id), createElement: () => new Element() };
  const state = { settings: clone(SETTINGS), extensionVersion: VERSION,
    sites: sites || { [ORIGIN]: { origin: ORIGIN, siteName: '自动识别机场', subscriptionName: '已有订阅A', hasPending: true, backupCount: 0 } } };
  const messages = [], storageListeners = [];
  const chrome = {
    storage: { onChanged: { addListener: listener => storageListeners.push(listener) } },
    tabs: { query: async query => { assert.deepEqual(query, { active: true, currentWindow: true }); return [{ url }]; } },
    runtime: {
      getManifest: () => ({ version: VERSION }),
      sendMessage: async message => {
        messages.push(clone(message));
        if (message.type === 'GET_STATUS') return clone(state);
        if (message.type === 'SAVE_SETTINGS') {
          if (saveError) return { status: 'error', code: saveError };
          state.settings = clone(message.settings);
          return { settings: clone(state.settings) };
        }
        if (message.type === 'SYNC_PENDING') {
          const result = { status: message.dryRun ? 'dry_run' : 'unchanged', at: '2026-10-18T05:00:00Z',
            extensionVersion: VERSION, subscriptionName: state.sites[message.origin]?.subscriptionName,
            originalNodes: 4, processedNodes: 3 };
          state.sites[message.origin].lastResult = result;
          return result;
        }
        if (message.type === 'RESTORE_LATEST') {
          state.sites[message.origin].backupCount--;
          return { status: 'restored', at: '2026-10-18T05:00:00Z', extensionVersion: VERSION };
        }
        throw new Error('Unexpected message');
      },
    },
  };
  const popup = createPopup(document, chrome);
  await popup.load();
  const $ = id => elements.get(id);
  return { $, document, popup, state, chrome, messages,
    async changed(changes, area = 'local') { await Promise.all(storageListeners.map(listener => listener(changes, area))); },
    input(id, value) { if (typeof value === 'boolean') $(id).checked = value; else $(id).value = value; return $(id).emit('input'); },
    select(origin) { $('site').value = origin; return $('site').emit('change'); },
    click(id) { assert.equal($(id).disabled, false, `${id} must be enabled`); return $(id).emit('click'); },
  };
}

test('HTTP/HTTPS domains and IP origins work without fixed providers, credentials or private tab fields', () => {
  for (const [url, expected] of [
    ['https://new.example.com/dashboard?token=secret#hidden', 'https://new.example.com'],
    ['http://192.168.1.22:8080/user', 'http://192.168.1.22:8080'],
    ['https://203.0.113.7:8443/user', 'https://203.0.113.7:8443'],
    ['http://[2001:db8::1]:8080/panel', 'http://[2001:db8::1]:8080'],
  ]) assert.equal(pageOrigin(url, SETTINGS), expected);
  for (const url of [undefined, 'https://user:password@example.com', 'blob:https://example.com/id',
    'edge://extensions/', 'chrome-extension://id/popup.html', SETTINGS.backendUrl + '/api/subs', SETTINGS.frontendUrl + '/?api=hidden']) {
    assert.equal(pageOrigin(url, SETTINGS), null, String(url));
  }
});

test('current website shows automatically recognized identity and never saves or requests site access', async () => {
  const f = await fixture();
  assert.equal(f.$('site').value, ORIGIN);
  assert.equal(f.$('siteName').textContent, '自动识别机场');
  assert.equal(f.$('subscriptionName').textContent, '已有订阅A');
  assert.equal(f.$('automatic').textContent, '自动同步：已开启');
  assert.ok(!f.$('currentSite').textContent.includes('never-display'));
  assert.deepEqual(f.messages, [{ type: 'GET_STATUS' }]);
  assert.ok(!source.includes('permissions.request'));
  assert.ok(!source.includes('profiles.mjs'));
});

test('site choices come from observed records and accept an arbitrary new HTTP IP current site', async () => {
  const ip = 'http://192.168.1.22:8080', historical = 'https://another.example.net';
  const f = await fixture({ url: ip + '/dashboard', sites: { [historical]: {
    origin: historical, siteName: '历史机场', subscriptionName: '历史订阅', hasPending: false, backupCount: 0 } } });
  assert.equal(f.$('site').value, ip);
  assert.deepEqual(f.$('site').children.map(option => option.value), ['', ip, historical]);
  assert.equal(f.$('siteName').textContent, '等待自动识别');
  f.select(historical);
  assert.equal(f.$('siteName').textContent, '历史机场');
  assert.equal(f.$('subscriptionName').textContent, '历史订阅');
  assert.equal(f.$('sync').disabled, true);
});

test('extension and own local Sub-Store pages wait for a website instead of showing historical success', async () => {
  for (const url of ['edge://extensions/', SETTINGS.frontendUrl + '/', SETTINGS.backendUrl + '/api/subs']) {
    const f = await fixture({ url });
    assert.equal(f.$('site').value, '');
    assert.equal(f.$('status').textContent, '等待打开机场网站');
    assert.equal(f.$('sync').disabled, true);
  }
});

test('settings are exactly three global fields and preserve other-window changes on save', async () => {
  assert.deepEqual(Object.keys(globalSettingsFrom({ ...SETTINGS, profiles: [], subscriptionName: 'ignored' })).sort(),
    ['backendUrl', 'enabled', 'frontendUrl']);
  const f = await fixture();
  f.input('backend', 'http://127.0.0.1:3001');
  f.state.settings.frontendUrl = 'http://127.0.0.1:3002';
  await f.click('save');
  assert.deepEqual(f.messages.find(message => message.type === 'SAVE_SETTINGS').settings,
    { enabled: true, backendUrl: 'http://127.0.0.1:3001', frontendUrl: 'http://127.0.0.1:3002' });
  assert.equal(f.$('dirty').hidden, true);
});

test('switching historical sites preserves global drafts and failed save retains accepted settings', async () => {
  const other = 'http://203.0.113.5';
  const f = await fixture({ saveError: 'unexpected_error', sites: {
    [ORIGIN]: { origin: ORIGIN, hasPending: true, backupCount: 0 },
    [other]: { origin: other, hasPending: true, backupCount: 0 },
  } });
  f.input('backend', 'http://127.0.0.1:3001');
  f.select(other);
  assert.equal(f.$('backend').value, 'http://127.0.0.1:3001');
  assert.equal(f.$('sync').disabled, true);
  await f.click('save');
  assert.equal(f.state.settings.backendUrl, SETTINGS.backendUrl);
  assert.equal(f.$('backend').value, 'http://127.0.0.1:3001');
  assert.match(f.$('notice').textContent, /保存失败/);
  f.input('backend', SETTINGS.backendUrl);
  assert.equal(f.$('sync').disabled, false);
});

test('manual diagnostics send only selected origin and Boolean dryRun', async () => {
  const f = await fixture();
  await f.click('check');
  await f.click('sync');
  assert.deepEqual(f.messages.filter(message => message.type === 'SYNC_PENDING'), [
    { type: 'SYNC_PENDING', origin: ORIGIN, dryRun: true },
    { type: 'SYNC_PENDING', origin: ORIGIN, dryRun: false },
  ]);
  assert.equal(f.$('restore').disabled, true);
});

test('restoring the last backup keeps restore disabled after busy completion', async () => {
  const f = await fixture();
  f.state.sites[ORIGIN].backupCount = 1;
  await f.popup.load();
  await f.click('restore');
  assert.deepEqual(f.messages.find(message => message.type === 'RESTORE_LATEST'), { type: 'RESTORE_LATEST', origin: ORIGIN });
  assert.equal(f.$('restore').disabled, true);
  f.state.sites[ORIGIN].backupCount = '1';
  await f.popup.load();
  assert.equal(f.$('restore').disabled, true, 'non-numeric backup metadata cannot enable restore');
});

test('failed status refresh after restore clears stale backup availability', async () => {
  const f = await fixture();
  f.state.sites[ORIGIN].backupCount = 1;
  await f.popup.load();
  const original = f.chrome.runtime.sendMessage;
  f.chrome.runtime.sendMessage = message => message.type === 'GET_STATUS' ? Promise.reject(new Error('offline')) : original(message);
  await f.click('restore');
  assert.equal(f.$('restore').disabled, true);
  assert.match(f.$('notice').textContent, /状态刷新失败/);
});

const LIVE_STALE_RESULT = Object.freeze({ status: 'unchanged', at: '2026-10-18T04:41:52.440Z',
  originalNodes: 53, processedNodes: 53, subscriptionName: '良心云' });

test('legacy 13:41 result stays historical and an unowned global cache is never assigned to current origin', async () => {
  const f = await fixture();
  f.state.sites[ORIGIN].subscriptionName = '良心云';
  f.state.sites[ORIGIN].lastResult = clone(LIVE_STALE_RESULT);
  await f.popup.load();
  assert.equal(f.$('status').textContent, '上次同步记录，当前版本待验证');
  assert.match(f.$('detail').textContent, /原始 53，处理后 53/);
  assert.match(f.$('time').textContent, /^上次同步时间：/);
  delete f.state.sites[ORIGIN].lastResult;
  f.state.lastResult = clone(LIVE_STALE_RESULT);
  await f.popup.load();
  assert.equal(f.$('status').textContent, '等待网站自动返回订阅');
  assert.ok(!f.$('detail').textContent.includes('53'));
});

test('new readiness and received candidate supersede old success until this round has a result', () => {
  const result = { ...LIVE_STALE_RESULT, extensionVersion: VERSION };
  for (const stage of ['bridge_ready', 'observer_ready', 'candidate_received']) {
    const context = { extensionVersion: VERSION, observation: { stage, at: '2026-10-18T04:58:00Z', extensionVersion: VERSION } };
    const view = resultView(result, SETTINGS, context);
    assert.notEqual(view.title, '当前链接已一致');
    assert.match(view.detail, /尚无本轮网页的同步结果/);
    assert.match(view.detail, /53/);
    assert.match(view.pageTime, /^阶段时间：/);
    if (stage === 'candidate_received') assert.match(view.title, /正在匹配与验证/);
    const complete = resultView({ ...result, at: '2026-10-18T04:59:00Z' }, SETTINGS, context);
    assert.equal(complete.title, '当前链接已一致');
    assert.ok(!complete.pageStage.includes('正在'));
  }
});

test('matching errors stay safe, with fixed text for unknown errors and no subscription URL leakage', async () => {
  for (const code of ['auto_match_none', 'auto_match_ambiguous', 'catalog_unavailable', 'secret=https://example.com/token']) {
    const view = resultView({ status: 'error', code, extensionVersion: VERSION }, SETTINGS, { extensionVersion: VERSION });
    assert.ok(!JSON.stringify(view).includes('https://'));
    assert.ok(!JSON.stringify(view).includes('token'));
    assert.ok(view.detail.length > 0);
  }
  const f = await fixture();
  f.state.sites[ORIGIN].siteName = 'https://example.com/private?token=never-display';
  f.state.sites[ORIGIN].subscriptionName = 'https://example.com/private?token=never-display';
  await f.popup.load();
  assert.equal(f.$('siteName').textContent, '等待自动识别');
  assert.equal(f.$('subscriptionName').textContent, '等待自动匹配');
});

test('storage notifications refresh through sanitized GET_STATUS while retaining global drafts', async () => {
  const f = await fixture();
  f.input('frontend', 'http://127.0.0.1:3003');
  f.state.sites[ORIGIN].observation = { stage: 'candidate_received', at: '2026-10-18T04:58:00Z', extensionVersion: VERSION };
  const count = f.messages.length;
  await f.changed({ sites: { newValue: { unsafeRawStorage: 'never-display' } } });
  assert.equal(f.messages[count].type, 'GET_STATUS');
  assert.match(f.$('status').textContent, /正在匹配与验证/);
  assert.equal(f.$('frontend').value, 'http://127.0.0.1:3003');
  assert.ok(!f.$('detail').textContent.includes('never-display'));
});

test('manual controls stay in collapsed advanced details; dynamic identity and status stay outside', async () => {
  const html = await readFile(new URL('./popup.html', import.meta.url), 'utf8');
  const details = [...html.matchAll(/<details\b([^>]*)>([\s\S]*?)<\/details>/g)];
  assert.equal(details.length, 1);
  assert.match(details[0][1], /\bid="advanced"/);
  assert.ok(!/\bopen(?:\s|=|$)/.test(details[0][1]));
  const outside = html.replace(details[0][0], '');
  for (const id of ['enabled', 'backend', 'frontend', 'save', 'sync', 'check', 'restore']) {
    assert.ok(details[0][2].includes(`id="${id}"`));
    assert.ok(!outside.includes(`id="${id}"`));
  }
  for (const id of ['site', 'automatic', 'siteName', 'subscriptionName', 'status', 'pageStage']) assert.ok(outside.includes(`id="${id}"`));
  assert.match(outside, /自动识别、自动同步/);
  assert.ok(!html.includes('association'));
  assert.ok(!html.includes('profile'));
  assert.ok(!html.includes('六家'));
});
