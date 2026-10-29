'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const test = require('node:test');
const { buildProfilePlan, getBusinessProfileCatalog } = require('../lib/business-profiles');
const { projectScript } = require('../lib/business-profile-platforms');
const { clientDirectory } = require('../lib/client-layout');
const { loadQuickJS, executeNode, executeQuickJS, compareExecutions } = require('../validate-js-engines');
const { scenarios } = require('../lib/js-engine-fixtures');

const ROOT = path.resolve(__dirname, '../..');
const SOURCE = path.join(ROOT, clientDirectory('FlClash'), 'FlClash(mihomo).js');
const lf = text => text.replace(/\r\n/g, '\n');
const api = () => require('../lib/flclash-browser-export');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

test('browser export provides a trusted build bundle and a static pure renderer', () => {
  const { buildFlClashBrowserBundle, generateFlClashScript, renderFlClashBrowserExporter } = api();
  assert.equal(typeof buildFlClashBrowserBundle, 'function');
  assert.equal(typeof generateFlClashScript, 'function');
  const source = renderFlClashBrowserExporter();
  assert(!source.includes('\r'));
  assert(!/\beval\s*\(|\bnew\s+Function\b|\brequire\s*\(|\bfetch\s*\(/.test(source));
  assert(!source.includes('</script'));
  const bundle = buildFlClashBrowserBundle();
  assert.equal(bundle.sourceSha256, sha256(lf(fs.readFileSync(SOURCE, 'utf8'))));
  assert.equal(bundle.canonicalSource, lf(fs.readFileSync(SOURCE, 'utf8')));
  assert.equal(bundle.services.length, 24);
});

test('canonical LF bundle is identical for CRLF and LF checkout sources', () => {
  const { buildFlClashBrowserBundle, generateFlClashScript } = api();
  const original = fs.readFileSync, source = lf(original(SOURCE, 'utf8'));
  const bundle = buildFlClashBrowserBundle();
  fs.readFileSync = function (file, options) {
    if (path.resolve(String(file)) === SOURCE) {
      const content = source.replace(/\n/g, '\r\n');
      return typeof options === 'string' || options?.encoding ? content : Buffer.from(content);
    }
    return original.call(this, file, options);
  };
  let crlfBundle;
  try { crlfBundle = buildFlClashBrowserBundle(); } finally { fs.readFileSync = original; }
  assert.deepEqual(crlfBundle, bundle);
  for (const profile of ['full', 'lite', 'custom']) {
    const result = generateFlClashScript(bundle, { profile });
    assert(!result.source.includes('\r'));
    assert.equal(result.summary.lineEndings, 'canonical-lf');
    assert.equal(result.summary.fullCanonicalSourceUnchanged, profile === 'full');
  }
});

test('every selection uses exactly the CLI script emitter after canonical LF normalization', () => {
  const { buildFlClashBrowserBundle, generateFlClashScript } = api();
  const bundle = buildFlClashBrowserBundle(), source = fs.readFileSync(SOURCE, 'utf8');
  const services = getBusinessProfileCatalog().services.map(service => service.id);
  const choices = [{ profile: 'full' }, { profile: 'lite' }, { profile: 'custom' },
    { profile: 'custom', enable: [] }, { profile: 'custom', enable: ['youtube', 'ai', 'work'] },
    { profile: 'custom', enable: services }, ...services.map(id => ({ profile: 'custom', enable: [id] }))];
  for (const options of choices) {
    const generated = generateFlClashScript(bundle, options);
    const expected = options.profile === 'full' ? lf(source) : lf(projectScript(source, buildProfilePlan(options), { runtimeContract: 'in-place' }));
    assert.equal(generated.source, expected, JSON.stringify(options));
    assert.match(generated.filename, /^FlClash\(mihomo\)-(?:full|lite|custom)\.js$/);
    assert.equal(generated.summary.sourceSha256, bundle.sourceSha256);
    assert.equal(generated.summary.runtimeContract, 'in-place');
  }
});

test('browser export rejects unknown, duplicate and non-string business selections', () => {
  const { buildFlClashBrowserBundle, generateFlClashScript } = api();
  const bundle = buildFlClashBrowserBundle();
  for (const options of [null, [], {}, { profile: 'default' }, { profile: true },
    { profile: 'full', enable: [] }, { profile: 'lite', enable: [] },
    { profile: 'custom', enable: 'ai' }, { profile: 'custom', enable: ['ai', 'ai'] },
    { profile: 'custom', enable: new Array(1) },
    { profile: 'custom', enable: [1] }, { profile: 'custom', enable: ['unknown'] },
    { profile: 'custom', enable: ['ai);throw new Error(1)//'] },
    { profile: 'custom', subscription: { profile: 'full' } },
    JSON.parse('{"profile":"custom","__proto__":{"profile":"full"}}')]) {
    assert.throws(() => generateFlClashScript(bundle, options), /profile|business|enable|option|service|plain/i);
  }
});

test('renderer works without Node, network or code evaluation and does not run canonical main', () => {
  const { buildFlClashBrowserBundle, generateFlClashScript, renderFlClashBrowserExporter } = api();
  const bundle = buildFlClashBrowserBundle();
  const context = vm.createContext({ fetch() { throw new Error('network forbidden'); }, eval() { throw new Error('eval forbidden'); }, Function() { throw new Error('Function forbidden'); } });
  vm.runInContext(renderFlClashBrowserExporter(), context);
  const before = JSON.stringify(bundle);
  for (const options of [{ profile: 'full' }, { profile: 'lite' }, { profile: 'custom', enable: ['ai'] }]) {
    const browser = context.generateFlClashScript(bundle, options);
    assert.deepEqual(JSON.parse(JSON.stringify(browser)), generateFlClashScript(bundle, options));
  }
  assert.equal(context.main, undefined);
  assert.equal(JSON.stringify(bundle), before);
});

test('real QuickJS executes exported Lite and Custom with identity and rejection boundaries', async () => {
  const { buildFlClashBrowserBundle, generateFlClashScript } = api();
  const bundle = buildFlClashBrowserBundle(), engine = await loadQuickJS().getQuickJS();
  const cases = scenarios().filter(scenario => ['normal-subscription', 'valid-dialer-chain', 'dialer-cycle-rejected', 'remote-provider-rejected'].includes(scenario.id));
  for (const options of [{ profile: 'lite' }, { profile: 'custom', enable: [] }]) {
    const generated = generateFlClashScript(bundle, options);
    for (const scenario of cases) {
      const node = executeNode(generated.source, scenario.config), quickjs = executeQuickJS(engine, generated.source, scenario.config);
      compareExecutions(node, quickjs, { id: 'flclash' }, scenario);
      if (scenario.unchanged) assert.deepEqual(quickjs.output, scenario.config);
      else {
        for (const disabled of generated.summary.disabledGroups) assert(!quickjs.output['proxy-groups'].some(group => group.name === disabled));
        assert.equal(quickjs.output.rules[quickjs.output.rules.length - 1], bundle.basePlan.finalRule);
      }
    }
  }
});
