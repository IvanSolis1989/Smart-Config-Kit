#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const guard = import('../../SubStore/scripts/fusion-publication-guard.mjs');
const contract = { schemaVersion: 1, minimumNodes: 3, requiredNamePrefixes: ['[A] ', '[B] '] };
const document = { proxies: [{ name: '[A] Hong Kong' }, { name: '[A] Tokyo' }, { name: '[B] Singapore' }] };

test('standalone contract validation rejects invalid policy before any publication is available', async () => {
  const { validateFusionContract } = await guard;
  assert.equal(typeof validateFusionContract, 'function');
  assert.doesNotThrow(() => validateFusionContract(contract));
  for (const invalid of [null, {}, { ...contract, minimumNodes: 0 }, { ...contract, requiredNamePrefixes: [] },
    { ...contract, schemaVersion: 2 }, { ...contract, requiredNamePrefixes: ['[A] ', '[A] '] }]) {
    assert.throws(() => validateFusionContract(invalid), /contract/i);
  }
});

test('complete publication returns only node and prefix counts', async () => {
  const { validateFusionPublication, VERSION } = await guard;
  assert.equal(typeof VERSION, 'string');
  assert.ok(VERSION.length > 0);
  assert.deepEqual(validateFusionPublication(document, contract), { nodes: 3, coveredPrefixes: 2 });
});

test('six otherwise valid nodes cannot replace a 325-node publication', async () => {
  const { validateFusionPublication } = await guard;
  const partial = { proxies: Array.from({ length: 6 }, (_, i) => ({ name: `[A] ${i}` })) };
  assert.throws(() => validateFusionPublication(partial, { ...contract, minimumNodes: 325 }), /node count.*6.*325/i);
});

test('enough nodes cannot hide a missing required source', async () => {
  const { validateFusionPublication } = await guard;
  const partial = { proxies: [{ name: '[A] One' }, { name: '[A] Two' }, { name: '[A] Three' }] };
  assert.throws(() => validateFusionPublication(partial, contract), /required name prefixes.*1.*2/i);
});

test('a required prefix in the middle or after leading whitespace does not count', async () => {
  const { validateFusionPublication } = await guard;
  for (const name of ['Other [B] Singapore', ' [B] Singapore', '[b] Singapore']) {
    assert.throws(() => validateFusionPublication({ proxies: [{ name }] }, {
      schemaVersion: 1, minimumNodes: 1, requiredNamePrefixes: ['[B] '],
    }), /required name prefixes/i);
  }
});

test('prefixes are literal strings and never regular expressions', async () => {
  const { validateFusionPublication } = await guard;
  const literalContract = { schemaVersion: 1, minimumNodes: 1, requiredNamePrefixes: ['.*[A]+ '] };
  assert.throws(() => validateFusionPublication({ proxies: [{ name: 'Anything AAAAA Tokyo' }] }, literalContract), /required name prefixes/i);
  assert.deepEqual(validateFusionPublication({ proxies: [{ name: '.*[A]+ Tokyo' }] }, literalContract), { nodes: 1, coveredPrefixes: 1 });
});

test('every required prefix must be covered even when all sources are missing', async () => {
  const { validateFusionPublication } = await guard;
  assert.throws(() => validateFusionPublication({ proxies: [{ name: '[C] One' }] }, {
    ...contract, minimumNodes: 1,
  }), /required name prefixes.*0.*2/i);
});

test('invalid contract shape and unsupported schema are rejected', async () => {
  const { validateFusionPublication } = await guard;
  for (const invalid of [undefined, null, {}, [], 'contract', 1,
    { ...contract, schemaVersion: 2 }, { ...contract, schemaVersion: '1' },
    { minimumNodes: 3, requiredNamePrefixes: ['[A] '] },
    { ...contract, optional: true }, Object.create(contract)]) {
    assert.throws(() => validateFusionPublication(document, invalid), /contract/i);
  }
});

test('minimumNodes must be a positive safe integer', async () => {
  const { validateFusionPublication } = await guard;
  for (const minimumNodes of [undefined, null, 0, -1, 1.5, '3', true, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validateFusionPublication(document, { ...contract, minimumNodes }), /minimumNodes/i);
  }
});

test('requiredNamePrefixes must contain unique nonblank strings', async () => {
  const { validateFusionPublication } = await guard;
  for (const requiredNamePrefixes of [undefined, null, '[A] ', [], [''], [' '], ['\t\n'],
    ['[A] ', '[A] '], ['[A] ', null], ['[A] ', 1], ['[A] ', {}], new Array(1)]) {
    assert.throws(() => validateFusionPublication(document, { ...contract, requiredNamePrefixes }), /requiredNamePrefixes/i);
  }
});

test('missing, nonarray and empty proxies cannot be published', async () => {
  const { validateFusionPublication } = await guard;
  for (const invalid of [undefined, null, {}, { proxies: null }, { proxies: {} }, { proxies: '' }, { proxies: [] }]) {
    assert.throws(() => validateFusionPublication(invalid, contract), /proxies/i);
  }
});

test('ineligible names do not provide source coverage', async () => {
  const { validateFusionPublication } = await guard;
  const invalid = { proxies: [null, {}, { name: 7 }, { name: '' }] };
  assert.throws(() => validateFusionPublication(invalid, contract), /required name prefixes/i);
});

test('frozen inputs stay unchanged across successful and failed checks', async () => {
  const { validateFusionPublication } = await guard;
  const node = Object.freeze({ name: '[A] Tokyo', server: 'private.example', password: 'private-password' });
  const proxies = Object.freeze([node]);
  const frozenDocument = Object.freeze({ proxies });
  const frozenContract = Object.freeze({ schemaVersion: 1, minimumNodes: 1, requiredNamePrefixes: Object.freeze(['[A] ']) });
  assert.deepEqual(validateFusionPublication(frozenDocument, frozenContract), { nodes: 1, coveredPrefixes: 1 });
  assert.throws(() => validateFusionPublication(frozenDocument, contract), /node count/i);
  assert.strictEqual(frozenDocument.proxies, proxies);
  assert.strictEqual(frozenDocument.proxies[0], node);
  assert.deepEqual(node, { name: '[A] Tokyo', server: 'private.example', password: 'private-password' });
  assert.deepEqual(frozenContract, { schemaVersion: 1, minimumNodes: 1, requiredNamePrefixes: ['[A] '] });
});

test('failure messages disclose no node names, prefixes, credentials or unknown values', async () => {
  const { validateFusionPublication } = await guard;
  const privateDocument = { proxies: [{ name: 'private-node-name', server: 'private-server', password: 'private-password', uuid: 'private-uuid' }] };
  const privateContract = { schemaVersion: 1, minimumNodes: 1, requiredNamePrefixes: ['private-required-prefix'] };
  const cases = [privateContract, { ...privateContract, minimumNodes: 325 }, { ...privateContract, minimumNodes: 'private-threshold' },
    { ...privateContract, 'private-key': 'private-value' }, { ...privateContract, requiredNamePrefixes: ['private-required-prefix', 'private-required-prefix'] }];
  for (const invalid of cases) {
    assert.throws(() => validateFusionPublication(privateDocument, invalid), (error) => {
      assert.ok(error instanceof Error);
      assert.doesNotMatch(String(error), /private-/);
      return true;
    });
  }
});

test('explicit subscription error placeholders are rejected despite sufficient count and all source prefixes', async () => {
  const { validateFusionPublication } = await guard;
  for (const message of ['在线设备数量超过套餐允许值！', '打开官网获取新订阅链接',
    '请复制新订阅链接重新导入更新', '使用的设备过多', '请去官网获取新订阅链接']) {
    const placeholder = { name: `[A] 【机场公告】${message}【服务提示】`, type: 'ss', server: 'private-server', port: 443, password: 'private-password' };
    const withPlaceholder = { proxies: [document.proxies[0], document.proxies[2], placeholder] };
    assert.throws(() => validateFusionPublication(withPlaceholder, contract), (error) => {
      assert.match(error.message, /subscription error placeholder/i);
      assert.doesNotMatch(String(error), /private-|机场公告|服务提示/);
      assert.ok(!String(error).includes(message));
      return true;
    });
  }
});

test('ordinary remaining-traffic and expiry information alone does not mark nodes as subscription errors', async () => {
  const { validateFusionPublication } = await guard;
  const informational = { proxies: [
    { name: '[A] 剩余流量：100 GB' },
    { name: '[B] 套餐到期日期：2027-01-01' },
    { name: '[A] 订阅到期提醒与流量说明' },
  ] };
  assert.deepEqual(validateFusionPublication(informational, contract), { nodes: 3, coveredPrefixes: 2 });
});
