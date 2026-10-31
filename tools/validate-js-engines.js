#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { TARGETS, scenarios } = require('./lib/js-engine-fixtures');

const ROOT = path.resolve(__dirname, '..');
const DEPENDENCY_ROOT = path.join(__dirname, 'js-engine-tests');
const INSTALL_COMMAND = 'npm --prefix tools/js-engine-tests ci --ignore-scripts';
const TIMEOUT_MS = 15000;

function loadQuickJS(dependencyRoot = DEPENDENCY_ROOT) {
  const packagePath = path.join(dependencyRoot, 'node_modules', 'quickjs-emscripten');
  if (!fs.existsSync(path.join(packagePath, 'package.json'))) {
    throw new Error(`QuickJS dependency missing. Run: ${INSTALL_COMMAND}`);
  }
  // Other initialization/package/WASM errors deliberately propagate as failures.
  return require(packagePath);
}

function driver(source, config) {
  return `var console = { log: function() {}, warn: function() {}, error: function() {} };\n${source}\n;
var __engineInput = JSON.parse(${JSON.stringify(JSON.stringify(config))});
var __engineGroups = __engineInput['proxy-groups'];
var __engineRules = __engineInput.rules;
var __engineProviders = __engineInput['rule-providers'];
var __engineOutput = main(__engineInput);
JSON.stringify({ output: __engineOutput, identity: {
  config: __engineOutput === __engineInput,
  groups: __engineInput['proxy-groups'] === __engineGroups,
  rules: __engineInput.rules === __engineRules,
  providers: __engineInput['rule-providers'] === __engineProviders
} });`;
}

function prepareSource(source, options = {}) {
  const replacements = [];
  if (Object.hasOwn(options, 'maxMultiplier')) replacements.push({
    pattern: /^const SCKI_MAX_NODE_MULTIPLIER = null\s*$/gm,
    value: `const SCKI_MAX_NODE_MULTIPLIER = ${JSON.stringify(options.maxMultiplier)}\n`,
  });
  if (Object.hasOwn(options, 'profile')) {
    if (!/^[a-z-]+$/.test(options.profile)) throw new Error('Invalid local adapter profile');
    replacements.push({ pattern: /^const SCKI_SUBSCRIPTION_ADAPTER_PROFILE = '[a-z-]+'\s*$/gm,
      value: `const SCKI_SUBSCRIPTION_ADAPTER_PROFILE = '${options.profile}'\n` });
  }
  for (const { pattern, value } of replacements) {
    if ((source.match(pattern) || []).length !== 1) throw new Error('Expected one trusted local option declaration');
    source = source.replace(pattern, value);
  }
  return source;
}

function executeNode(source, config, filename = 'overwrite.js') {
  return JSON.parse(new vm.Script(driver(source, config), { filename }).runInNewContext({}, { timeout: TIMEOUT_MS }));
}

function executeQuickJS(engine, source, config, filename = 'overwrite.js') {
  const context = engine.newContext();
  try {
    const deadline = Date.now() + TIMEOUT_MS;
    context.runtime.setMemoryLimit(128 * 1024 * 1024);
    context.runtime.setInterruptHandler(() => Date.now() > deadline);
    // Global script evaluation really parses the entire source (including
    // uncalled bodies/regex literals), executes top-level code, then calls main.
    // Its grammar is the pinned engine's grammar, not an arbitrary ES/API ban.
    const result = context.evalCode(driver(source, config), filename, { type: 'global' });
    if (result.error) {
      try {
        const detail = context.dump(result.error);
        throw new Error(`${filename}: QuickJS ${detail.name || 'Error'}: ${detail.message || JSON.stringify(detail)}${detail.stack ? `\n${detail.stack}` : ''}`);
      } finally { result.error.dispose(); }
    }
    try { return JSON.parse(context.getString(result.value)); }
    finally { result.value.dispose(); }
  } finally { context.dispose(); }
}

function compareExecutions(node, quickjs, target, scenario) {
  const label = `${target.id}/${scenario.id}`;
  // JSON is the config bridge contract. Compare every value, array order and
  // object key/value, rather than counts (which miss changed policy targets).
  assert.deepEqual(quickjs.output, node.output, `${label}: QuickJS/Node JSON output differs`);
  assert.equal(node.identity.config, true, `${label}: Node config identity changed`);
  assert.equal(quickjs.identity.config, true, `${label}: QuickJS config identity changed`);
  if (target.id === 'flclash') {
    for (const key of ['groups', 'rules', 'providers']) {
      assert.equal(node.identity[key], true, `${label}: Node ${key} identity changed`);
      assert.equal(quickjs.identity[key], true, `${label}: QuickJS ${key} identity changed`);
    }
  }
}

async function runValidation(options = {}) {
  if (options.target && !TARGETS.some(target => target.id === options.target)) throw new Error(`Unknown target: ${options.target}`);
  const cases = scenarios().filter(scenario => !options.scenario || scenario.id === options.scenario);
  if (!cases.length) throw new Error(`Unknown scenario: ${options.scenario}`);
  const engine = await loadQuickJS().getQuickJS();
  const results = [];
  for (const target of TARGETS.filter(target => !options.target || target.id === options.target)) {
    const originalSource = fs.readFileSync(path.join(ROOT, target.file), 'utf8');
    for (const scenario of cases) {
      const source = prepareSource(originalSource, { ...scenario.options, ...(options.profile ? { profile: options.profile } : {}) });
      const node = executeNode(source, scenario.config, target.file);
      const quickjs = executeQuickJS(engine, source, scenario.config, target.file);
      compareExecutions(node, quickjs, target, scenario);
      if (scenario.unchanged) {
        assert.deepEqual(quickjs.output, scenario.config, `${target.id}/${scenario.id}: rejection must leave input unchanged`);
      } else {
        assert.deepEqual(quickjs.output.proxies.map(proxy => proxy.name), scenario.expectedNames, `${target.id}/${scenario.id}: retained nodes`);
        assert.ok(quickjs.output.rules.length > 1, `${target.id}/${scenario.id}: main did not build routing rules`);
        assert.ok(Object.keys(quickjs.output['rule-providers']).length > 1, `${target.id}/${scenario.id}: missing rule providers`);
        if (scenario.id === 'valid-dialer-chain') {
          assert.equal(quickjs.output.proxies[2]['dialer-proxy'], 'JP Transit x1');
          assert.ok(!quickjs.output['proxy-groups'].find(group => group.name === '🌍 全球节点').proxies.includes('HK Interface'));
        }
        if (scenario.id === 'mixed-inline-provider') assert.equal(Object.hasOwn(quickjs.output, 'proxy-providers'), false);
      }
      results.push({ target: target.id, scenario: scenario.id, rules: (quickjs.output.rules || []).length,
        providers: Object.keys(quickjs.output['rule-providers'] || {}).length });
    }
  }
  return results;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== '--target' || !args[i + 1]) throw new Error('Usage: node tools/validate-js-engines.js [--target smart|normal|flclash]');
    options.target = args[++i];
  }
  runValidation(options).then(results => {
    for (const result of results) console.log(`PASS QuickJS/Node ${result.target}/${result.scenario} full JSON equal rules=${result.rules} providers=${result.providers}`);
  }).catch(error => { console.error(error.stack || error); process.exitCode = 1; });
}

module.exports = { runValidation, loadQuickJS, executeNode, executeQuickJS, compareExecutions, prepareSource };
