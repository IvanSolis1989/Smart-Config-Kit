#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

const scripts = path.resolve(__dirname, '../../SubStore/scripts');
const alias = '/web-' + 'a'.repeat(64);
const oldPrefix = '/existing-private-path';
const extensionPrefix = '/ext-' + 'b'.repeat(64);
const origin = 'https://worker.example.invalid';
const guardImport = 'import { webManagementEnvForRequest } from "./scki-web-management-route.mjs";';

async function load(name) {
  const file = path.join(scripts, name);
  assert.ok(fs.existsSync(file), name + ' must provide the new alias implementation');
  return import(pathToFileURL(file).href);
}

function request(resource, init) { return new Request(origin + resource, init); }

// Existing legacy prefix semantics, with only synthetic routing and no backend.
function routeLegacyRequest(req, env) {
  const url = new URL(req.url);
  const prefix = env.SUB_STORE_FRONTEND_BACKEND_PATH;
  if (!prefix || !prefix.startsWith('/') || prefix.endsWith('/') || /^\/(api|share|download)(\/|$)/.test(prefix)) {
    return { response: new Response('not configured', { status: 503 }) };
  }
  const publicApi = /^\/(api\/download|api\/preview|api\/sub\/flow)/.test(url.pathname);
  if (!publicApi && url.pathname.startsWith('/api/')) return { response: new Response('unauthorized', { status: 401 }) };
  if (url.pathname.startsWith(prefix + '/')) {
    url.pathname = url.pathname.slice(prefix.length);
    if (url.pathname.startsWith('/api/')) url.searchParams.set('share', 'true');
  }
  return { request: new Request(url.href, req) };
}

test('matching alias clones only the legacy prefix binding without mutating the original environment', async () => {
  const { webManagementEnvForRequest, VERSION } = await load('web-management-route.mjs');
  assert.equal(typeof VERSION, 'string');
  const binding = Object.freeze({ marker: 'same KV binding' });
  const env = Object.freeze({ SUB_STORE_FRONTEND_BACKEND_PATH: oldPrefix, SUB_STORE_WEB_BACKEND_PATH: alias,
    SUB_STORE_EXTENSION_BACKEND_PATH: extensionPrefix, SUB_STORE_DATA: binding, untouched: 'preserved' });
  for (const resource of [alias, alias + '/', alias + '/api/subs', alias + '/api/settings']) {
    const routed = webManagementEnvForRequest(request(resource), env);
    assert.notStrictEqual(routed, env);
    assert.deepEqual(routed, { ...env, SUB_STORE_FRONTEND_BACKEND_PATH: alias });
    assert.strictEqual(routed.SUB_STORE_DATA, binding);
  }
  assert.equal(env.SUB_STORE_FRONTEND_BACKEND_PATH, oldPrefix);
});

test('old, extension and unrelated paths retain the exact original environment', async () => {
  const { webManagementEnvForRequest } = await load('web-management-route.mjs');
  const env = { SUB_STORE_FRONTEND_BACKEND_PATH: oldPrefix, SUB_STORE_WEB_BACKEND_PATH: alias };
  for (const resource of [oldPrefix + '/api/subs', extensionPrefix + '/api/subs', '/api/subs', '/', '/download/collection/example',
    '/unrelated?backend=' + encodeURIComponent(alias)]) {
    assert.strictEqual(webManagementEnvForRequest(request(resource), env), env);
  }
});

test('missing or malformed alias binding never establishes another management prefix', async () => {
  const { webManagementEnvForRequest } = await load('web-management-route.mjs');
  for (const value of [undefined, null, false, 1, {}, '', '/web-', '/web-' + 'a'.repeat(63), '/web-' + 'a'.repeat(65),
    '/web-' + 'A'.repeat(64), '/web-' + 'g'.repeat(64), alias + '/', ' ' + alias, alias + '\n',
    '/api/' + alias.slice(1), 'https://worker.example.invalid' + alias]) {
    const env = { SUB_STORE_FRONTEND_BACKEND_PATH: oldPrefix, SUB_STORE_WEB_BACKEND_PATH: value };
    assert.strictEqual(webManagementEnvForRequest(request(alias + '/api/subs'), env), env);
  }
  assert.equal(webManagementEnvForRequest(request(alias), undefined), undefined);
  assert.equal(webManagementEnvForRequest(request(alias), null), null);
});

test('alias recognition requires the literal case-sensitive path and segment boundary', async () => {
  const { webManagementEnvForRequest } = await load('web-management-route.mjs');
  const env = { SUB_STORE_WEB_BACKEND_PATH: alias };
  for (const resource of [alias + 'x/api/subs', alias + '-suffix/api/subs', alias.replace('/web-', '/WEB-') + '/api/subs',
    alias.replace('/web-', '/%77eb-') + '/api/subs', alias + '%2Fapi/subs', alias + '%252Fapi/subs',
    '/nested' + alias + '/api/subs']) {
    assert.strictEqual(webManagementEnvForRequest(request(resource), env), env);
  }
  assert.strictEqual(webManagementEnvForRequest({ url: 'not a URL' }, env), env);
  assert.strictEqual(webManagementEnvForRequest(null, env), env);
});

test('encoded resource names do not change the literal alias and URL/query are not rewritten by the helper', async () => {
  const { webManagementEnvForRequest } = await load('web-management-route.mjs');
  const env = { SUB_STORE_WEB_BACKEND_PATH: alias };
  const req = request(alias + '/api/sub/%E6%B5%8B%E8%AF%95?raw=true');
  const before = req.url;
  assert.equal(webManagementEnvForRequest(req, env).SUB_STORE_FRONTEND_BACKEND_PATH, alias);
  assert.equal(req.url, before);
});

const workerFixture = 'import existing from "existing-module";\n'
  + 'async function handle(request, env2) {\n'
  + '  const extensionRoute = await extensionHandler(request, env2);\n'
  + '  const route = extensionRoute || routeLegacyRequest(request, env2);\n'
  + '  if (route.response) return route.response;\n'
  + '  return ownerFetch(route.request, env2);\n'
  + '}\n';

async function runtime(extensionHandler = async () => null) {
  const { patchWebManagementWorker } = await load('patch-web-management-worker.mjs');
  const { webManagementEnvForRequest } = await load('web-management-route.mjs');
  let aliasCalls = 0, legacyCalls = 0;
  const context = vm.createContext({
    extensionHandler,
    webManagementEnvForRequest(req, env) { aliasCalls++; return webManagementEnvForRequest(req, env); },
    routeLegacyRequest(req, env) { legacyCalls++; return routeLegacyRequest(req, env); },
    ownerFetch: async (req, originalEnv) => new Response(JSON.stringify({ url: req.url,
      unchangedOldPrefix: originalEnv.SUB_STORE_FRONTEND_BACKEND_PATH })),
  });
  vm.runInContext(patchWebManagementWorker(workerFixture)
    .replace(guardImport + '\n', '').replace('import existing from "existing-module";\n', ''), context);
  return { handle: context.handle, counts: () => ({ aliasCalls, legacyCalls }) };
}

test('patched legacy routing accepts both old and new API prefixes and preserves the owner environment', async () => {
  const instance = await runtime();
  const env = Object.freeze({ SUB_STORE_FRONTEND_BACKEND_PATH: oldPrefix, SUB_STORE_WEB_BACKEND_PATH: alias });
  for (const prefix of [oldPrefix, alias]) {
    const response = await instance.handle(request(prefix + '/api/subs'), env);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { url: origin + '/api/subs?share=true', unchangedOldPrefix: oldPrefix });
  }
  assert.equal((await instance.handle(request('/api/subs'), env)).status, 401);
  assert.equal(env.SUB_STORE_FRONTEND_BACKEND_PATH, oldPrefix);
});

test('a valid alias can serve management API when the unknown legacy binding is absent', async () => {
  const instance = await runtime();
  const env = Object.freeze({ SUB_STORE_WEB_BACKEND_PATH: alias });
  const response = await instance.handle(request(alias + '/api/settings'), env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).url, origin + '/api/settings?share=true');
  assert.equal(env.SUB_STORE_FRONTEND_BACKEND_PATH, undefined);
});

test('extension response and forwarded request keep priority without invoking alias or legacy routing', async () => {
  for (const extensionRoute of [{ response: new Response('extension response') }, { request: request('/api/subs?share=true') }]) {
    const instance = await runtime(async () => extensionRoute);
    const env = { SUB_STORE_FRONTEND_BACKEND_PATH: oldPrefix, SUB_STORE_WEB_BACKEND_PATH: alias,
      SUB_STORE_EXTENSION_BACKEND_PATH: extensionPrefix };
    const response = await instance.handle(request(extensionPrefix + '/api/subs'), env);
    assert.equal(response.status, 200);
    assert.deepEqual(instance.counts(), { aliasCalls: 0, legacyCalls: 0 });
  }
});

test('patch preserves unrelated code and LF/CRLF conventions while changing only the reviewed line', async () => {
  const { patchWebManagementWorker } = await load('patch-web-management-worker.mjs');
  for (const newline of ['\n', '\r\n']) {
    const source = (workerFixture + '\n// unrelated suffix\n').replace(/\n/g, newline);
    const patched = patchWebManagementWorker(source);
    assert.equal(patched, guardImport + newline + source.replace(
      'const route = extensionRoute || routeLegacyRequest(request, env2);',
      'const route = extensionRoute || routeLegacyRequest(request, webManagementEnvForRequest(request, env2));'));
    if (newline === '\r\n') assert.doesNotMatch(patched.replace(/\r\n/g, ''), /\n/);
  }
});

test('unsupported, ambiguous and already patched source is rejected without a partial result', async () => {
  const { patchWebManagementWorker } = await load('patch-web-management-worker.mjs');
  for (const source of [undefined, null, '', {}, workerFixture.replace('extensionRoute || ', ''),
    workerFixture + workerFixture, workerFixture.replace('routeLegacyRequest(request, env2)', 'routeLegacyRequest(other, env2)'),
    workerFixture + '\nconst route = extensionRoute || routeLegacyRequest (request, env2);\n',
    workerFixture + '\n// webManagementEnvForRequest\n',
    workerFixture + '\n// scki-web-management-route.mjs\n']) {
    assert.throws(() => patchWebManagementWorker(source), /source|baseline|ambiguous|already|conflicting/i);
  }
  assert.throws(() => patchWebManagementWorker(patchWebManagementWorker(workerFixture)), /already|conflicting/i);
});
