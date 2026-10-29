'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const os = require('node:os');

const validatorPath = path.resolve(__dirname, '../validate-js-engines.js');

test('real QuickJS validator is available as an isolated reusable module', () => {
  assert.equal(fs.existsSync(validatorPath), true, 'missing real QuickJS validation entrypoint');
  assert.equal(typeof require(validatorPath).runValidation, 'function');
});

test('Smart representative executes main in QuickJS and matches the Node output', async () => {
  const { runValidation } = require(validatorPath);
  const results = await runValidation({ target: 'smart', scenario: 'normal-subscription' });
  assert.equal(results.length, 1);
  assert.ok(results[0].rules > 0);
  assert.ok(results[0].providers > 0);
});

test('all adapters cover chain, multiplier and provider boundaries in both engines', async () => {
  const { runValidation } = require(validatorPath);
  const results = await runValidation();
  for (const target of ['smart', 'normal', 'flclash']) {
    const names = results.filter(result => result.target === target).map(result => result.scenario);
    for (const name of ['normal-subscription', 'valid-dialer-chain', 'multiplier-boundary', 'filtered-dialer-rejected',
      'dialer-cycle-rejected', 'mixed-inline-provider', 'remote-provider-rejected']) assert.ok(names.includes(name), `${target}: missing ${name}`);
  }
});

test('same-sized rule, DNS, node, group and provider changes cannot pass equivalence', () => {
  const { compareExecutions } = require(validatorPath);
  const node = { output: { rules: ['MATCH,DIRECT'], dns: { nameserver: ['1.1.1.1'] },
    proxies: [{ name: 'node' }], 'proxy-groups': [{ name: 'group', proxies: ['node'] }],
    'rule-providers': { sample: { url: 'https://example.invalid/a' } } }, identity: { config: true } };
  for (const change of [
    output => { output.rules[0] = 'MATCH,REJECT'; },
    output => { output.dns.nameserver[0] = '8.8.8.8'; },
    output => { output.proxies[0].name = 'other'; },
    output => { output['proxy-groups'][0].proxies[0] = 'REJECT'; },
    output => { output['rule-providers'].sample.url = 'https://example.invalid/b'; },
  ]) {
    const quickjs = structuredClone(node);
    change(quickjs.output);
    assert.throws(() => compareExecutions(node, quickjs, { id: 'smart' }, { id: 'mutation' }), /JSON output differs/);
  }
});

test('FlClash identity failure is checked before JSON loses object identity', () => {
  const { compareExecutions } = require(validatorPath);
  const node = { output: {}, identity: { config: true, groups: true, rules: true, providers: true } };
  for (const key of ['config', 'groups', 'rules', 'providers']) {
    const quickjs = structuredClone(node);
    quickjs.identity[key] = false;
    assert.throws(() => compareExecutions(node, quickjs, { id: 'flclash' }, { id: 'identity' }), /identity changed/);
  }
});

test('missing dependency fails with an install command and broken packages are not skipped', () => {
  const { loadQuickJS } = require(validatorPath);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-js-engines-'));
  try {
    assert.throws(() => loadQuickJS(root), /QuickJS dependency missing.*npm --prefix tools\/js-engine-tests ci --ignore-scripts/);
    const directory = path.join(root, 'node_modules/quickjs-emscripten');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'package.json'), '{"main":"missing-entry.js"}');
    assert.throws(() => loadQuickJS(root), { code: 'MODULE_NOT_FOUND' });
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('real QuickJS accepts BigInt and rejects invalid uncalled syntax and runtime failures', async () => {
  const { loadQuickJS, executeNode, executeQuickJS } = require(validatorPath);
  const engine = await loadQuickJS().getQuickJS();
  const source = 'function main(config) { config.value = (1n + BigInt(2)).toString(); config.optional = config.nothing?.x ?? 3; return config; }';
  assert.deepEqual(executeQuickJS(engine, source, {}), executeNode(source, {}));
  assert.throws(() => executeQuickJS(engine, 'function unused() { const x = ; } function main(x) { return x; }', {}), /QuickJS SyntaxError/);
  assert.throws(() => executeQuickJS(engine, 'function main() { throw new Error("engine-runtime-error"); }', {}), /engine-runtime-error/);
  // A second fresh context also proves failed runs release their handles/runtime.
  assert.deepEqual(executeQuickJS(engine, source, {}), executeNode(source, {}));
});
