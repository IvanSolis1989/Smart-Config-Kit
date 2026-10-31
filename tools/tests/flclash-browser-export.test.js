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
const { definitions } = require('../lib/configuration-schema');
const { parseLocalTrafficOptions, planLocalTrafficOptions } = require('../lib/local-traffic-options');
const { getQuicRules, getZeroTierPlanetProxyPolicy } = require('../../rulesets/source/routing-graph');

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
  for (const options of [{ profile: 'full' }, { profile: 'lite' }, { profile: 'custom', enable: ['ai'] },
    { profile: 'lite', localOptions: { healthCheckProfile: 'power-save', quicPolicy: 'follow-rules', subscriptionAdapterProfile: 'hosts-only', maxNodeMultiplier: 2.5, zeroTierPlanetProxy: true } }]) {
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

test('browser export combines each local field with business choices exactly like the CLI', () => {
  const { buildFlClashBrowserBundle, generateFlClashScript } = api();
  const bundle = buildFlClashBrowserBundle(), source = fs.readFileSync(SOURCE, 'utf8');
  const defaults = Object.fromEntries(Object.entries(definitions).map(([key, definition]) => [key, definition.default]));
  const choices = [
    { profile: 'full', localOptions: defaults },
    { profile: 'full', localOptions: { healthCheckProfile: 'power-save', quicPolicy: 'follow-rules', subscriptionAdapterProfile: 'hosts-only', maxNodeMultiplier: 2.5, zeroTierPlanetProxy: true } },
    { profile: 'lite', localOptions: { healthCheckProfile: 'standard', quicPolicy: 'follow-rules', subscriptionAdapterProfile: 'off', maxNodeMultiplier: null } },
    { profile: 'lite', localOptions: { healthCheckProfile: 'power-save', quicPolicy: 'block-foreign', subscriptionAdapterProfile: 'policy', maxNodeMultiplier: 2.5, zeroTierPlanetProxy: true } },
    { profile: 'custom', enable: ['ai', 'youtube'], localOptions: { healthCheckProfile: 'power-save', quicPolicy: 'follow-rules', subscriptionAdapterProfile: 'adaptive', maxNodeMultiplier: null } },
    { profile: 'custom', enable: [], localOptions: { healthCheckProfile: 'standard', quicPolicy: 'block-foreign', subscriptionAdapterProfile: 'hosts-only', maxNodeMultiplier: 2.5 } },
    ...Object.entries(definitions).flatMap(([key, definition]) => (definition.values || [null, 2.5]).map(value => ({ profile: 'full', localOptions: { [key]: value } }))),
  ];
  for (const options of choices) {
    const business = { profile: options.profile, ...(options.enable ? { enable: options.enable } : {}) };
    const local = planLocalTrafficOptions(source, source, options.localOptions);
    const expected = options.profile === 'full' ? lf(local.updated) : lf(projectScript(local.updated, buildProfilePlan(business), { runtimeContract: 'in-place' }));
    const actual = generateFlClashScript(bundle, options);
    assert.equal(actual.source, expected, JSON.stringify(options));
    assert.deepEqual(actual.summary.localOptions, local.options);
    assert.deepEqual(parseLocalTrafficOptions(actual.source).options, local.options);
    assert.equal(actual.summary.fullCanonicalSourceUnchanged, actual.source === bundle.canonicalSource);
  }
  for (const profile of ['full', 'lite', 'custom']) {
    const baseline = generateFlClashScript(bundle, { profile });
    assert.equal(generateFlClashScript(bundle, { profile, localOptions: defaults }).source, baseline.source);
    assert.deepEqual(baseline.summary.localOptions, defaults);
  }
});

test('local options reject wrong types, accessors and prototypes without running user code', () => {
  const { buildFlClashBrowserBundle, generateFlClashScript } = api();
  const bundle = buildFlClashBrowserBundle();
  const invalid = [null, [], new Array(1), 'adaptive', { unknown: true },
    { healthCheckProfile: 900 }, { healthCheckProfile: '900' }, { quicPolicy: false }, { zeroTierPlanetProxy: 'false' },
    { subscriptionAdapterProfile: null }, { subscriptionAdapterProfile: 'unknown' },
    ...[NaN, Infinity, -Infinity, 0, -1, '2.5', true, {}, [], undefined].map(value => ({ maxNodeMultiplier: value })),
    Object.create({ healthCheckProfile: 'power-save' }), JSON.parse('{"__proto__":{"quicPolicy":"follow-rules"}}'),
  ];
  for (const localOptions of invalid) assert.throws(() => generateFlClashScript(bundle, { profile: 'lite', localOptions }), /local|option|plain|value|data|profile/i);
  let executed = 0;
  const localGetter = Object.defineProperty({}, 'quicPolicy', { enumerable: true, get() { executed++; return 'follow-rules'; } });
  const hiddenGetter = Object.defineProperty({}, 'maxNodeMultiplier', { get() { executed++; return 2.5; } });
  const outerGetter = Object.defineProperty({ profile: 'lite' }, 'localOptions', { enumerable: true, get() { executed++; return {}; } });
  const taggedGetter = Object.defineProperty({}, Symbol.toStringTag, { get() { executed++; return 'Object'; } });
  const enableGetter = Object.defineProperty([], '0', { get() { executed++; return 'ai'; } });
  for (const options of [{ profile: 'lite', localOptions: localGetter }, { profile: 'lite', localOptions: hiddenGetter },
    { profile: 'lite', localOptions: taggedGetter }, { profile: 'custom', enable: enableGetter }, outerGetter]) {
    assert.throws(() => generateFlClashScript(bundle, options), /local|option|plain|value|data|profile/i);
  }
  assert.equal(executed, 0);
});

test('bundle validates duplicate local declarations and every Node-DNS capability without execution', () => {
  const { buildFlClashBrowserBundle } = api();
  const read = fs.readFileSync, source = lf(read(SOURCE, 'utf8'));
  const transform = text => { fs.readFileSync = function (file, options) {
    if (path.resolve(String(file)) === SOURCE) return typeof options === 'string' || options?.encoding ? text : Buffer.from(text);
    return read.call(this, file, options);
  }; };
  try {
    transform(source + '\nconst SCKI_HEALTH_CHECK_PROFILE = "standard";\n');
    assert.throws(() => buildFlClashBrowserBundle(), /duplicate|invalid JavaScript|declared/i);
    const withoutHostsOnly = source.replace(/^.*"hosts-only": \{ id: "hosts-only", nodeDnsProjection: "hosts-only" \},?\n/m, '');
    assert.notEqual(withoutHostsOnly, source);
    transform(withoutHostsOnly);
    assert.throws(() => buildFlClashBrowserBundle(), /capability|hosts-only/i);
    delete globalThis.__sckiBrowserBuildExecuted;
    transform(source + '\nglobalThis.__sckiBrowserBuildExecuted = true;\n');
    buildFlClashBrowserBundle();
    assert.equal(globalThis.__sckiBrowserBuildExecuted, undefined);
  } finally { fs.readFileSync = read; delete globalThis.__sckiBrowserBuildExecuted; }
});

test('trusted literal slots retain inline comments exactly like the CLI writer', () => {
  const { buildFlClashBrowserBundle, generateFlClashScript } = api();
  const read = fs.readFileSync;
  const source = lf(read(SOURCE, 'utf8')).replace(/^const SCKI_MAX_NODE_MULTIPLIER = null$/m, 'const SCKI_MAX_NODE_MULTIPLIER = null//trusted source note');
  fs.readFileSync = function (file, options) {
    if (path.resolve(String(file)) === SOURCE) return typeof options === 'string' || options?.encoding ? source : Buffer.from(source);
    return read.call(this, file, options);
  };
  let bundle;
  try { bundle = buildFlClashBrowserBundle(); } finally { fs.readFileSync = read; }
  const requested = { maxNodeMultiplier: 2.5 };
  assert.equal(generateFlClashScript(bundle, { profile: 'full', localOptions: requested }).source, planLocalTrafficOptions(source, source, requested).updated);
});

test('real QuickJS combines browser UDP privacy with power-save, QUIC, hosts-only and multiplier safety', async () => {
  const { buildFlClashBrowserBundle, generateFlClashScript } = api();
  const bundle = buildFlClashBrowserBundle(), engine = await loadQuickJS().getQuickJS();
  const cases = scenarios().filter(scenario => ['normal-subscription', 'valid-dialer-chain', 'filtered-dialer-rejected'].includes(scenario.id));
  for (const profile of ['full', 'lite', 'custom']) {
    const generated = generateFlClashScript(bundle, { profile,
      localOptions: { healthCheckProfile: 'power-save', quicPolicy: 'follow-rules', subscriptionAdapterProfile: 'hosts-only', maxNodeMultiplier: 2.5, browserUdpPolicy: 'reject' } });
    for (const scenario of cases) {
      const input = structuredClone(scenario.config);
      input.hosts['unused.fixture.test'] = '198.51.100.7';
      const node = executeNode(generated.source, input), quickjs = executeQuickJS(engine, generated.source, input);
      compareExecutions(node, quickjs, { id: 'flclash' }, scenario);
      if (scenario.unchanged) { assert.deepEqual(quickjs.output, input); continue; }
      const output = quickjs.output;
      assert.deepEqual(output.rules.slice(0, 3), [
        'AND,((NETWORK,UDP),(PROCESS-NAME,chrome.exe)),REJECT',
        'AND,((NETWORK,UDP),(PROCESS-NAME,msedge.exe)),REJECT',
        'AND,((NETWORK,UDP),(PROCESS-NAME,firefox.exe)),REJECT',
      ]);
      assert(output['proxy-groups'].filter(group => group.type === 'url-test').every(group => group.interval === 900));
      assert(!output.rules.some(rule => getQuicRules('block-foreign').includes(rule)));
      assert.deepEqual(output.hosts['node.fixture.test'], ['192.0.2.3']);
      assert(!Object.hasOwn(output.hosts, 'unused.fixture.test'));
      assert(!Object.hasOwn(output.dns['proxy-server-nameserver-policy'] || {}, 'node.fixture.test'));
      assert(!output.proxies.some(proxy => proxy.name === 'US Home x3'));
    }
  }
  const zeroTier = generateFlClashScript(bundle, { profile: 'lite', localOptions: { zeroTierPlanetProxy: true } });
  const chain = cases.find(item => item.id === 'valid-dialer-chain');
  const actual = executeQuickJS(engine, zeroTier.source, chain.config);
  for (const rule of getZeroTierPlanetProxyPolicy().rules) assert(actual.output.rules.includes(rule));
});
