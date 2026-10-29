'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const { artifactInventory } = require('../lib/business-profile-output');
const { buildProfilePlan } = require('../lib/business-profiles');
const { projectPlatform, parseYaml } = require('../lib/business-profile-platforms');
const { applyClientOptions } = require('../lib/offline-client-options');
const ROOT = path.resolve(__dirname, '../..');
const lf = value => value.replace(/\r\n/g, '\n');
const api = () => require('../lib/offline-configuration-export');
let shared;
const bundle = () => shared || (shared = api().buildOfflineConfigurationBundle());

test('offline configuration catalog covers exactly the current twenty maintained entrypoints', () => {
  const data = bundle();
  assert.equal(data.clients.length, 20);
  assert.equal(new Set(data.clients.map(client => client.id)).size, 20);
  assert.deepEqual(data.clients.map(client => client.path), artifactInventory().map(item => item.path));
  for (const client of data.clients) {
    assert.equal(typeof client.help, 'string'); assert(client.help.length > 0);
    assert.equal(typeof client.localOptionSchema, 'object');
  }
});

test('every default Full text is canonical LF of its formal source', () => {
  for (const client of bundle().clients) {
    const actual = api().generateOfflineConfiguration(bundle(), { client: client.id, profile: 'full' });
    assert.equal(actual.files[0].content, lf(fs.readFileSync(path.join(ROOT, client.path), 'utf8')), client.id);
    assert.equal(actual.summary.fullCanonicalSourceUnchanged, true, client.id);
    assert.equal(actual.summary.client, client.id);
    assert.equal(actual.mimeType, actual.files.length > 1 ? 'application/zip' : client.mimeType);
    assert(actual.filename.endsWith(actual.files.length > 1 ? '.zip' : path.extname(client.path)));
    for (const file of actual.files) assert(!file.path.startsWith('/') && !file.path.split('/').includes('..'));
  }
});

test('Lite and Custom projections match existing CLI semantics across all entrypoints', () => {
  for (const profile of ['lite', 'custom']) {
    const options = { profile, ...(profile === 'custom' ? { enable: ['ai', 'youtube'] } : {}) };
    const plan = buildProfilePlan(options);
    for (const client of bundle().clients) {
      const source = lf(fs.readFileSync(path.join(ROOT, client.path), 'utf8'));
      const expected = projectPlatform(source, client.kind, plan, { runtimeContract: client.runtimeContract });
      const actual = api().generateOfflineConfiguration(bundle(), { client: client.id, ...options }).files[0].content;
      if (['mihomo-yaml', 'egern'].includes(client.kind)) assert.deepEqual(parseYaml(actual), parseYaml(expected), client.id);
      else if (client.kind === 'openclash') {
        const unwrap = text => [...text.matchAll(/^(?:cat (?:>|>>) "\$OVERRIDE_YAML" << 'OVERRIDE_EOF'\n)([\s\S]*?)(?:^OVERRIDE_EOF$)/gm)].map(match => match[1]).join('\n');
        assert.deepEqual(parseYaml(unwrap(actual)), parseYaml(unwrap(expected)), client.id);
      } else assert.equal(actual, lf(expected), client.id);
    }
  }
});

test('client packages filter Passwall segments and retain exact AEROVE resource bytes', () => {
  const data = bundle();
  const full = api().generateOfflineConfiguration(data, { client: 'passwall', profile: 'full' });
  const lite = api().generateOfflineConfiguration(data, { client: 'passwall', profile: 'custom', enable: [] });
  assert(full.files.length > lite.files.length);
  const plan = buildProfilePlan({ profile: 'custom', enable: [] });
  for (const file of lite.files.slice(1)) for (const id of plan.disabledSegments) assert(!file.path.endsWith(`${id}.list`));
  const aerove = api().generateOfflineConfiguration(data, { client: 'aerove-lite', profile: 'custom', enable: [] });
  assert(aerove.files.some(file => file.path.endsWith('/rule-assets/manifest.json')));
  for (const file of aerove.files.filter(file => file.base64 !== undefined)) {
    assert.deepEqual(Buffer.from(file.base64, 'base64'), fs.readFileSync(path.join(ROOT, file.path)));
  }
  assert(api().generateOfflineConfiguration(data, { client: 'meow', profile: 'full' }).files.some(file => file.path.endsWith('adapter-manifest.json')));
  assert(!api().generateOfflineConfiguration(data, { client: 'meow', profile: 'lite' }).files.some(file => file.path.endsWith('adapter-manifest.json')));
});

test('browser renderer runs offline without Node or execution of source configurations', () => {
  const data = bundle(), rendered = api().renderOfflineConfigurationExporter();
  assert(!/\beval\s*\(|\bnew\s+Function\b|\brequire\s*\(|\bfetch\s*\(/.test(rendered));
  const context = vm.createContext({ fetch() { throw new Error('network forbidden'); }, Function() { throw new Error('dynamic code forbidden'); } });
  vm.runInContext(rendered, context);
  const subset = { ...data, clients: data.clients.filter(client => ['flclash','cmfa','egern','singbox-1.13','loon','passwall','aerove-lite'].includes(client.id)) };
  for (const client of subset.clients) {
    const options = { client: client.id, profile: 'custom', enable: [] };
    const actual = context.generateOfflineConfiguration(subset, options);
    assert.deepEqual(JSON.parse(JSON.stringify(actual)), api().generateOfflineConfiguration(subset, options));
  }
  assert.equal(context.main, undefined);
});

test('unsupported client options, unsafe IDs, accessors and sparse choices are refused', () => {
  const data = bundle();
  for (const options of [{ client: '../cmfa', profile: 'full' }, { client: 'cmfa', profile: 'invalid' },
    { client: 'cmfa', profile: 'custom', enable: new Array(1) }, { client: 'cmfa', profile: 'full', enable: [] },
    { client: 'egern', profile: 'full', localOptions: { maxNodeMultiplier: 2.5 } },
    JSON.parse('{"client":"cmfa","profile":"full","__proto__":{}}')]) assert.throws(() => api().generateOfflineConfiguration(data, options));
  let reads = 0;
  const options = Object.defineProperty({ client: 'cmfa', profile: 'full' }, 'localOptions', { enumerable: true, get() { reads++; return {}; } });
  assert.throws(() => api().generateOfflineConfiguration(data, options));
  assert.equal(reads, 0);
});

test('single-file names distinguish Full Lite and Custom and retain FlClash naming', () => {
  for (const profile of ['full','lite','custom']) {
    const result = api().generateOfflineConfiguration(bundle(), { client: 'flclash', profile });
    assert.equal(result.filename, `FlClash(mihomo)-${profile}.js`);
    const yaml = api().generateOfflineConfiguration(bundle(), { client: 'cmfa', profile });
    assert.equal(yaml.filename, `CMFA(mihomo)-${profile}.yaml`);
  }
});

test('nondefault native parameters are applied before business projection', () => {
  const data = bundle(), plan = buildProfilePlan({ profile: 'lite' });
  for (const id of ['flclash','cmfa','stash','meow','openclash-normal','singbox-1.13']) {
    const client = data.clients.find(item => item.id === id);
    const values = { healthCheckProfile: 'power-save', quicPolicy: 'follow-rules', subscriptionAdapterProfile: 'hosts-only', maxNodeMultiplier: 2.5, zeroTierPlanetProxy: false };
    const selected = Object.fromEntries(Object.keys(client.localOptionSchema).map(key => [key, values[key]]));
    const changed = applyClientOptions(client.optionSpec, client.canonicalSource, selected);
    const expected = projectPlatform(changed, client.kind, plan, { runtimeContract: client.runtimeContract });
    const actual = api().generateOfflineConfiguration(data, { client: id, profile: 'lite', localOptions: selected }).files[0].content;
    if (client.kind === 'mihomo-yaml') assert.deepEqual(parseYaml(actual), parseYaml(expected), id);
    else if (client.kind === 'openclash') {
      const yaml = source => [...source.matchAll(/^(?:cat (?:>|>>) "\$OVERRIDE_YAML" << 'OVERRIDE_EOF'\n)([\s\S]*?)(?:^OVERRIDE_EOF$)/gm)].map(match => match[1]).join('\n');
      assert.deepEqual(parseYaml(yaml(actual)), parseYaml(yaml(expected)), id);
    } else assert.equal(actual, lf(expected), id);
  }
  assert(!api().generateOfflineConfiguration(data, { client: 'meow', profile: 'full', localOptions: { healthCheckProfile: 'power-save' } }).files.some(file => file.path.endsWith('adapter-manifest.json')));
});
