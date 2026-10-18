#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');

const routeModule = import('../../SubStore/scripts/extension-sync-route.mjs');
const patchModule = import('../../SubStore/scripts/patch-extension-sync-worker.mjs');
const prefix = '/ext-' + 'a'.repeat(64);
const env = { SUB_STORE_EXTENSION_BACKEND_PATH: prefix };
const base = 'https://worker.example.invalid';
const limit = 4 * 1024 * 1024;
const persistedSubscription = { name: '机场 A', source: 'remote', url: 'https://old.example.invalid/feed',
  process: [{ type: 'Script Operator', args: { content: 'original code', stage: 'node' } }],
  ua: 'example-agent', proxy: 'DIRECT', content: 'existing', remark: '原备注' };

function previewBody(changes = {}) {
  return { ...structuredClone(persistedSubscription), url: 'https://sub.example.invalid/feed?token=private-token',
    noCache: true, ignoreFailedRemoteSub: false, ...changes };
}

function request(path, method = 'GET', body, headers = {}) {
  return new Request(base + prefix + path, {
    method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
}

async function route(req, configuration = env, lookup = async () => persistedSubscription) {
  const { routeExtensionSyncRequest } = await routeModule;
  return routeExtensionSyncRequest(req, configuration, lookup);
}

async function rejected(req, status, lookup) {
  const result = await route(req, env, lookup);
  assert.ok(result?.response instanceof Response);
  assert.equal(result.request, undefined);
  if (status) assert.equal(result.response.status, status);
  assert.ok(result.response.status >= 400);
  const text = await result.response.text();
  assert.ok(!text.includes(prefix));
  assert.doesNotMatch(text, /private-|node\.example/);
  return result.response;
}

test('unset or invalid dedicated prefix and unrelated paths leave the legacy route alone', async () => {
  for (const value of [undefined, '', '/ext-short', '/ext-' + 'A'.repeat(64), prefix + '/', '/api/' + 'a'.repeat(64)]) {
    assert.equal(await route(request('/api/subs'), { SUB_STORE_EXTENSION_BACKEND_PATH: value }), null);
  }
  const { routeExtensionSyncRequest } = await routeModule;
  assert.equal(await routeExtensionSyncRequest(request('/api/subs'), undefined), null);
  assert.equal(await route(new Request(base + '/legacy/api/subs')), null);
  assert.equal(await route(new Request(base + prefix + '-other/api/subs')), null);
});

test('GET collection is forwarded without the dedicated prefix and with share=true', async () => {
  const result = await route(request('/api/subs'));
  assert.equal(result.response, undefined);
  assert.equal(result.request.url, base + '/api/subs?share=true');
  assert.equal(result.request.method, 'GET');
  assert.equal(result.request.redirect, 'error');
});

test('GET named subscription supports encoded Unicode and spaces', async () => {
  const name = '机场 A';
  const result = await route(request('/api/sub/' + encodeURIComponent(name)));
  assert.equal(result.request.url, base + '/api/sub/' + encodeURIComponent(name) + '?share=true');
});

test('preview preserves the complete original JSON body and headers', async () => {
  const body = JSON.stringify(previewBody());
  const req = request('/api/preview/sub?target=JSON', 'POST', body, { 'X-Example': 'kept' });
  const result = await route(req);
  assert.equal(req.bodyUsed, false);
  assert.equal(result.request.url, base + '/api/preview/sub?target=JSON&share=true');
  assert.equal(result.request.method, 'POST');
  assert.equal(result.request.redirect, 'error');
  assert.equal(result.request.headers.get('X-Example'), 'kept');
  assert.equal(await result.request.text(), body);
});

test('preview requires trusted lookup and fails closed on lookup errors or missing records', async () => {
  const { routeExtensionSyncRequest } = await routeModule;
  const missing = await routeExtensionSyncRequest(request('/api/preview/sub?target=JSON', 'POST', previewBody()), env);
  assert.equal(missing.response.status, 503);
  for (const lookup of [null, async () => { throw new Error('private-state'); }, async () => null, async () => undefined]) {
    await rejected(request('/api/preview/sub?target=JSON', 'POST', previewBody()), 503, lookup);
  }
});

test('preview rejects arbitrary ScriptOperator, content and all other persisted field changes', async () => {
  for (const changes of [
    { process: [{ type: 'Script Operator', args: { content: '$substore.read("private-state")', stage: 'node' } }] },
    { content: 'arbitrary content' }, { ua: 'different-agent' }, { proxy: 'OTHER' }, { remark: 'changed' },
    { extra: true }, { source: 'local' },
  ]) await rejected(request('/api/preview/sub?target=JSON', 'POST', previewBody(changes)), 403);
  const omitted = previewBody();
  delete omitted.process;
  await rejected(request('/api/preview/sub?target=JSON', 'POST', omitted), 403);
});

test('preview accepts canonical field ordering but requires exact persisted remote record name', async () => {
  const reordered = previewBody({ process: [{ args: { stage: 'node', content: 'original code' }, type: 'Script Operator' }] });
  const names = [];
  const accepted = await route(request('/api/preview/sub?target=JSON', 'POST', reordered), env,
    async (name) => { names.push(name); return structuredClone(persistedSubscription); });
  assert.ok(accepted.request instanceof Request);
  assert.deepEqual(names, ['机场 A']);
  await rejected(request('/api/preview/sub?target=JSON', 'POST', previewBody()), 403,
    async () => ({ ...persistedSubscription, name: 'Different record' }));
  await rejected(request('/api/preview/sub?target=JSON', 'POST', previewBody()), 403,
    async () => ({ ...persistedSubscription, source: 'local' }));
});

test('only explicit safe preview flags are accepted and invalid requests do not invoke lookup', async () => {
  let lookups = 0;
  const lookup = async () => { lookups += 1; return persistedSubscription; };
  for (const changes of [{ noCache: false }, { noCache: undefined }, { ignoreFailedRemoteSub: true }, { ignoreFailedRemoteSub: undefined }]) {
    await rejected(request('/api/preview/sub?target=JSON', 'POST', previewBody(changes)), 400, lookup);
  }
  await rejected(request('/api/admin', 'POST', previewBody()), 403, lookup);
  assert.equal(lookups, 0);
});

test('PATCH forwards only a valid subscription URL with its original body', async () => {
  const body = '{ "url": "https://sub.example.invalid/feed?token=private-token" }';
  const result = await route(request('/api/sub/' + encodeURIComponent('机场 A'), 'PATCH', body));
  assert.equal(result.request.method, 'PATCH');
  assert.equal(result.request.redirect, 'error');
  assert.equal(await result.request.text(), body);
});

test('PATCH rejects unknown fields and nonobject JSON', async () => {
  for (const body of [{ url: 'https://sub.example.invalid', process: [] }, { url: 'https://sub.example.invalid', name: 'other' },
    {}, [], null, true, '"https://sub.example.invalid"']) {
    await rejected(request('/api/sub/Example', 'PATCH', body));
  }
});

test('HTTP URLs must have a host and no credentials, literal whitespace or control characters', async () => {
  for (const url of ['ftp://sub.example.invalid', 'https://user:private-password@sub.example.invalid',
    'https://user@sub.example.invalid', 'https://sub.example.invalid/a b', ' https://sub.example.invalid',
    'https://sub.example.invalid/\nprivate-token', 'https://sub.example.invalid/\u0085', 'https:sub.example.invalid',
    'https://', 'https://sub.example.invalid\\private-token', '', null, 1]) {
    await rejected(request('/api/sub/Example', 'PATCH', { url }));
    await rejected(request('/api/preview/sub?target=JSON', 'POST', { name: 'Example', url }));
  }
});

test('preview requires an object with a valid name and URL while preserving other fields', async () => {
  for (const name of [undefined, null, '', ' ', 'x'.repeat(101), 'bad\nname', 'bad\u007fname', 1]) {
    await rejected(request('/api/preview/sub?target=JSON', 'POST', { name, url: 'https://sub.example.invalid' }));
  }
  for (const body of [[], null, '{}', 'not JSON']) await rejected(request('/api/preview/sub?target=JSON', 'POST', body));
});

test('only the exact preview target and no GET or PATCH query are accepted', async () => {
  for (const path of ['/api/subs?share=true', '/api/sub/Example?x=1']) await rejected(request(path));
  await rejected(request('/api/sub/Example?x=1', 'PATCH', { url: 'https://sub.example.invalid' }));
  for (const query of ['', '?target=Clash', '?target=JSON&url=https://node.example', '?target=JSON&target=JSON', '?%74arget=JSON']) {
    await rejected(request('/api/preview/sub' + query, 'POST', { name: 'Example', url: 'https://sub.example.invalid' }));
  }
});

test('other APIs, methods and nested or ambiguous path encodings are rejected', async () => {
  for (const path of ['', '/', '/api/subs/', '/api/sub/', '/api/admin', '/api/sub/Example/other',
    '/api/sub/%2fadmin', '/api/sub/%5cadmin', '/api/sub/%252fadmin', '/api/sub/%252e%252e',
    '/api/sub/%00name', '/api/sub/%C0%AF', '/api/sub/%', '/api/%73ubs']) {
    await rejected(request(path));
  }
  for (const method of ['POST', 'PUT', 'DELETE', 'HEAD']) await rejected(request('/api/subs', method));
  await rejected(request('/api/preview/sub?target=JSON'));
  await rejected(request('/api/sub/Example', 'POST', {}));
});

test('OPTIONS for allowed routes has wildcard origin and only the three authorized methods', async () => {
  for (const path of ['/api/subs', '/api/sub/Example', '/api/preview/sub?target=JSON']) {
    const result = await route(request(path, 'OPTIONS'));
    assert.equal(result.response.status, 204);
    assert.equal(await result.response.text(), '');
    assert.equal(result.response.headers.get('Access-Control-Allow-Origin'), '*');
    assert.equal(result.response.headers.get('Access-Control-Allow-Methods'), 'GET, POST, PATCH');
  }
  await rejected(request('/api/admin', 'OPTIONS'));
});

test('JSON methods require valid JSON content type and reject malformed UTF-8', async () => {
  await rejected(request('/api/sub/Example', 'PATCH', '{}', { 'Content-Type': 'text/plain' }));
  await rejected(request('/api/sub/Example', 'PATCH', '{'));
  const invalid = new Request(base + prefix + '/api/sub/Example', { method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }, body: new Uint8Array([0xff, 0xfe]) });
  await rejected(invalid);
});

test('body limits are measured in actual UTF-8 bytes and accept the exact boundary', async () => {
  const baseBody = JSON.stringify({ name: 'Example', source: 'remote', url: 'https://sub.example.invalid', content: '',
    noCache: true, ignoreFailedRemoteSub: false });
  const content = 'x'.repeat(limit - Buffer.byteLength(baseBody));
  const body = baseBody.replace('"content":""', '"content":"' + content + '"');
  assert.equal(Buffer.byteLength(body), limit);
  const result = await route(request('/api/preview/sub?target=JSON', 'POST', body), env,
    async () => ({ name: 'Example', source: 'remote', url: 'https://old.example.invalid', content }));
  assert.equal((await result.request.text()).length, limit);
  await rejected(request('/api/preview/sub?target=JSON', 'POST', body + ' '), 413);
  await rejected(request('/api/preview/sub?target=JSON', 'POST', { name: 'Example', url: 'https://sub.example.invalid', content: '界'.repeat(limit / 2) }), 413);
  await rejected(request('/api/sub/Example', 'PATCH', '{}', { 'Content-Length': String(limit + 1) }), 413);
});

test('streamed body cannot bypass the byte limit', async () => {
  const stream = new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode('x'.repeat(limit)));
    controller.enqueue(new Uint8Array([32]));
    controller.close();
  } });
  const req = new Request(base + prefix + '/api/preview/sub?target=JSON', { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: stream, duplex: 'half' });
  await rejected(req, 413);
});

const workerFixture = 'import existing from "existing-module";\nconst legacyWorkers = { async fetch(request, env2) {\n  const route = routeLegacyRequest(request, env2);\n  if (route.response) return route.response;\n  return route.request;\n} };\n';
const extensionImport = 'import { routeExtensionSyncRequest } from "./scki-extension-sync-route.mjs";';

test('Worker patch preserves unrelated source and CRLF while adding the dedicated route', async () => {
  const { patchExtensionSyncWorker } = await patchModule;
  const patched = patchExtensionSyncWorker(workerFixture);
  assert.ok(patched.startsWith(extensionImport + '\nimport existing from "existing-module";\nconst legacyWorkers'));
  assert.ok(patched.endsWith('  if (route.response) return route.response;\n  return route.request;\n} };\n'));
  const crlf = patchExtensionSyncWorker(workerFixture.replace(/\n/g, '\r\n'));
  assert.doesNotMatch(crlf.replace(/\r\n/g, ''), /\n/);
});

test('patched handler uses extension results and calls legacy only for a nonmatch', async () => {
  const { patchExtensionSyncWorker } = await patchModule;
  let legacyCalls = 0;
  const context = vm.createContext({
    routeExtensionSyncRequest: async (req) => req === 'special' ? { request: 'extension-forward' } : null,
    routeLegacyRequest: () => { legacyCalls += 1; return { request: 'legacy-forward' }; },
  });
  vm.runInContext(patchExtensionSyncWorker(workerFixture).replace(/^import .*;\n/gm, '') + '\nglobalThis.handler = legacyWorkers;', context);
  assert.equal(await context.handler.fetch('special', {}), 'extension-forward');
  assert.equal(legacyCalls, 0);
  assert.equal(await context.handler.fetch('legacy', {}), 'legacy-forward');
  assert.equal(legacyCalls, 1);
});

test('patched preview callback synchronizes and reads the same owner before validating persisted fields', async () => {
  const { patchExtensionSyncWorker } = await patchModule;
  const { routeExtensionSyncRequest } = await routeModule;
  const operations = [];
  const context = vm.createContext({ routeExtensionSyncRequest, Request, URL,
    routeLegacyRequest: () => { throw new Error('Legacy must not process a matched extension request'); },
    owner: () => ({
      syncLocalReplica: async () => { operations.push('sync'); },
      fetch: async (req) => {
        operations.push('lookup');
        assert.equal(req.url, base + '/api/sub/' + encodeURIComponent('机场 A') + '?share=true');
        assert.equal(req.method, 'GET');
        assert.equal(req.redirect, 'error');
        return new Response(JSON.stringify({ status: 'success', data: persistedSubscription }));
      },
    }),
  });
  vm.runInContext(patchExtensionSyncWorker(workerFixture).replace(/^import .*;\n/gm, '') + '\nglobalThis.handler = legacyWorkers;', context);
  const result = await context.handler.fetch(request('/api/preview/sub?target=JSON', 'POST', previewBody()), env);
  assert.ok(result instanceof Request);
  assert.deepEqual(operations, ['sync', 'lookup']);
  operations.length = 0;
  const denied = await context.handler.fetch(request('/api/admin'), env);
  assert.equal(denied.status, 403);
  assert.deepEqual(operations, []);
});

test('patched callback fails closed on owner HTTP and application-level lookup failures', async () => {
  const { patchExtensionSyncWorker } = await patchModule;
  const { routeExtensionSyncRequest } = await routeModule;
  for (const failure of [new Response('{}', { status: 500 }), new Response('{"status":"failed","message":"private-state"}')]) {
    const context = vm.createContext({ routeExtensionSyncRequest, Request, URL,
      routeLegacyRequest: () => { throw new Error('Unexpected legacy route'); },
      owner: () => ({ syncLocalReplica: async () => {}, fetch: async () => failure }),
    });
    vm.runInContext(patchExtensionSyncWorker(workerFixture).replace(/^import .*;\n/gm, '') + '\nglobalThis.handler = legacyWorkers;', context);
    const result = await context.handler.fetch(request('/api/preview/sub?target=JSON', 'POST', previewBody()), env);
    assert.equal(result.status, 503);
    assert.doesNotMatch(await result.text(), /private-state/);
  }
});

test('Worker patch rejects missing, changed, duplicate and already patched baselines', async () => {
  const { patchExtensionSyncWorker } = await patchModule;
  for (const source of [null, '', 'const unrelated = true;', workerFixture + workerFixture,
    workerFixture.replace('routeLegacyRequest(request, env2)', 'routeLegacyRequest(other, env2)')]) {
    assert.throws(() => patchExtensionSyncWorker(source), /source|baseline|ambiguous/i);
  }
  assert.throws(() => patchExtensionSyncWorker(patchExtensionSyncWorker(workerFixture)), /already patched/i);
});
