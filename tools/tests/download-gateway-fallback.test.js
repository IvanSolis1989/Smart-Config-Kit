#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const recoveryModule = import('../../SubStore/scripts/download-gateway-fallback.mjs');
const patchModule = import('../../SubStore/scripts/patch-download-gateway-worker.mjs');
const targetUrl = 'https://subscription.example.invalid/feed?token=private-target-token';
const gatewayUrl = 'https://gateway.example.invalid/download';

async function recover(overrides = {}) {
  const { recoverDownloadGateway530 } = await recoveryModule;
  return recoverDownloadGateway530({ gatewayResponse: new Response(null, { status: 530 }), targetUrl,
    method: 'GET', headers: { 'User-Agent': 'example-agent' }, signal: new AbortController().signal,
    fetchTarget: async () => new Response('complete subscription'), ...overrides });
}

test('HTTP 530 recovery makes one GET or HEAD to the unchanged target with original headers and signal', async () => {
  for (const method of ['GET', 'HEAD']) {
    const headers = { 'User-Agent': 'example-agent', Authorization: 'provider-private-token' };
    const signal = new AbortController().signal;
    const calls = [];
    const response = new Response(method === 'HEAD' ? null : 'complete subscription');
    const result = await recover({ method, headers, signal, fetchTarget: async (url, options) => {
      calls.push(url);
      assert.equal(url, targetUrl);
      assert.equal(options.method, method);
      assert.strictEqual(options.headers, headers);
      assert.strictEqual(options.signal, signal);
      assert.equal(options.redirect, 'manual');
      assert.equal(options.body, undefined);
      return response;
    } });
    assert.strictEqual(result, response);
    assert.deepEqual(calls, [targetUrl]);
  }
});

test('other gateway statuses and nonread methods never use the direct path', async () => {
  const fetchTarget = async () => { assert.fail('Unexpected direct fetch'); };
  for (const status of [200, 301, 403, 429, 500, 502, 529, 531]) {
    assert.equal(await recover({ gatewayResponse: new Response(null, { status }), fetchTarget }), null);
  }
  for (const method of ['PATCH', 'POST', 'PUT', 'DELETE', 'get', undefined]) {
    assert.equal(await recover({ method, fetchTarget }), null);
  }
});

test('direct redirects and non-success responses fail without any second attempt', async () => {
  for (const status of [301, 302, 307, 308, 403, 429, 500, 530]) {
    let attempts = 0;
    await assert.rejects(recover({ fetchTarget: async (_url, options) => {
      attempts += 1;
      assert.equal(options.redirect, 'manual');
      return new Response(null, { status, headers: { Location: 'https://external.example.invalid' } });
    } }), /direct recovery|direct redirect/i);
    assert.equal(attempts, 1);
  }
});

test('direct exceptions are propagated unchanged and are never retried', async () => {
  const failure = new Error('original fetch failure');
  let attempts = 0;
  await assert.rejects(recover({ fetchTarget: async () => { attempts += 1; throw failure; } }), (error) => error === failure);
  assert.equal(attempts, 1);
});

test('an aborted original signal prevents the recovery request', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(recover({ signal: controller.signal, fetchTarget: async () => assert.fail('Expired request fetched') }), /abort/i);
});

test('invalid targets fail closed and observations contain only fixed codes and HTTP status', async () => {
  for (const targetUrl of ['file:///private-path', 'https://user:private-password@subscription.example.invalid', 'not a URL']) {
    await assert.rejects(recover({ targetUrl, fetchTarget: async () => assert.fail('Invalid target fetched') }), /recovery target/i);
  }
  const observations = [];
  await recover({ observe: (...args) => observations.push(args) });
  assert.deepEqual(observations, [['DIRECT_ATTEMPT', 530], ['DIRECT_STATUS', 200]]);
  assert.doesNotMatch(JSON.stringify(observations), /private-|https?:/);
});

const baseline = String.raw`async function fetchViaGateway(config2, targetUrl, method, headers, signal) {
  const gatewayResponse = await fetch(config2.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: ` + '`Bearer ${config2.token}`' + String.raw`
    },
    body: JSON.stringify({ url: targetUrl, method, headers }),
    signal
  });
  if (!gatewayResponse.ok) throw new Error(` + '`download gateway request failed (HTTP ${gatewayResponse.status})`' + String.raw`);
  let data;
  try {
    data = await gatewayResponse.json();
  } catch {
    throw new Error("download gateway response invalid");
  }
  if (!data || !Number.isInteger(data.status) || data.status < 100 || data.status > 599 || !data.headers || typeof data.headers !== "object" || Array.isArray(data.headers)) {
    throw new Error("download gateway response invalid");
  }
  const bytes = decodeBase64(data.bodyBase64);
  return {
    status: data.status,
    headers: data.headers,
    text: () => new TextDecoder().decode(bytes),
    arrayBuffer: () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  };
}`;
const moduleImport = 'import { recoverDownloadGateway530 } from "./scki-download-gateway-fallback.mjs";';

async function patchedGateway(gatewayResponse, directResponse = new Response('complete subscription')) {
  const { patchDownloadGatewayWorker } = await patchModule;
  const { recoverDownloadGateway530 } = await recoveryModule;
  const calls = [];
  const observations = [];
  const context = vm.createContext({ recoverDownloadGateway530, TextDecoder,
    decodeBase64: (value) => Buffer.from(value, 'base64'),
    console: { log: (...args) => observations.push(args) },
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url === gatewayUrl) return gatewayResponse;
      assert.equal(url, targetUrl);
      return directResponse;
    },
  });
  vm.runInContext(patchDownloadGatewayWorker(baseline).replace(moduleImport + '\n', ''), context);
  const config = { endpoint: gatewayUrl, token: 'private-gateway-token' };
  const headers = { 'User-Agent': 'example-agent' };
  const signal = new AbortController().signal;
  return { result: context.fetchViaGateway(config, targetUrl, 'GET', headers, signal), calls, observations, headers, signal };
}

test('patched gateway uses the direct response only after gateway transport HTTP 530', async () => {
  const response = new Response('complete subscription');
  const run = await patchedGateway(new Response(null, { status: 530, headers: { Authorization: 'private-gateway-token' } }), response);
  assert.strictEqual(await run.result, response);
  assert.equal(run.calls.length, 2);
  assert.equal(run.calls[0].options.redirect, 'manual');
  assert.equal(run.calls[0].options.headers.Authorization, 'Bearer private-gateway-token');
  assert.strictEqual(run.calls[1].options.headers, run.headers);
  assert.equal(run.calls[1].options.headers.Authorization, undefined);
  assert.strictEqual(run.calls[1].options.signal, run.signal);
  assert.doesNotMatch(JSON.stringify(run.observations), /private-|https?:/);
});

test('patched gateway preserves non-530 failures and does not follow gateway redirects', async () => {
  for (const status of [302, 403, 502]) {
    const run = await patchedGateway(new Response(null, { status }));
    await assert.rejects(run.result, new RegExp(`download gateway request failed \\(HTTP ${status}\\)`));
    assert.equal(run.calls.length, 1);
    assert.equal(run.calls[0].options.redirect, 'manual');
  }
});

test('upstream HTTP 530 inside a valid gateway envelope does not trigger transport recovery', async () => {
  const run = await patchedGateway(new Response(JSON.stringify({ status: 530, headers: {}, bodyBase64: Buffer.from('upstream failed').toString('base64') })));
  const response = await run.result;
  assert.equal(response.status, 530);
  assert.equal(response.text(), 'upstream failed');
  assert.equal(run.calls.length, 1);
  assert.deepEqual(run.observations, []);
});

test('gateway patch rejects missing, changed, ambiguous and already patched baselines and preserves other source', async () => {
  const { patchDownloadGatewayWorker } = await patchModule;
  for (const source of [null, '', 'const unrelated = true;', baseline + '\n' + baseline,
    baseline.replace('if (!gatewayResponse.ok)', 'if (gatewayResponse.status >= 400)')]) {
    assert.throws(() => patchDownloadGatewayWorker(source), /source|baseline|ambiguous/i);
  }
  const patched = patchDownloadGatewayWorker('// before\r\n' + baseline.replace(/\n/g, '\r\n') + '\r\n// after');
  assert.ok(patched.startsWith(moduleImport + '\r\n// before\r\n'));
  assert.ok(patched.endsWith('\r\n// after'));
  assert.doesNotMatch(patched.replace(/\r\n/g, ''), /\n/);
  assert.throws(() => patchDownloadGatewayWorker(patchDownloadGatewayWorker(baseline)), /already patched/i);
});
