'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const crypto = require('node:crypto');
const graph = require('../../rulesets/source/routing-graph');
const { getBusinessProfileCatalog, resolveBusinessProfile, buildProfilePlan, projectMihomoConfig,
  generateBusinessProfile, rulePolicy } = require('../lib/business-profiles');
const { artifactInventory, validateOutputDirectory, publishDirectory } = require('../lib/business-profile-output');
const { parseYaml, projectSingBox, projectPlatform, segmentFor } = require('../lib/business-profile-platforms');
const { parseArguments } = require('../generate-business-profile');

const ROOT = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const customPlan = () => buildProfilePlan({ profile: 'custom', enable: [] });
function scratch(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-business-profile-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert(path.basename(directory).startsWith('scki-business-profile-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return directory;
}
function frozenRepository(t) {
  const temp = scratch(t), root = path.join(temp, 'source');
  const files = artifactInventory().map(item => item.path);
  for (const directory of ['双内核系/Passwall/shunt-rules', '双内核系/Passwall2/shunt-rules', 'Meow内核系/Aerove Lite/rule-assets']) {
    for (const name of fs.readdirSync(path.join(ROOT, directory))) files.push(`${directory}/${name}`);
  }
  files.push('Meow内核系/adapter-manifest.json', 'Sing-box内核系/Karing/adapter-manifest.json',
    'rulesets/source/routing-graph.js', 'rulesets/source/business-profiles.json', 'rulesets/generated/fused/manifest.json');
  const manifest = JSON.parse(read('rulesets/generated/fused/manifest.json'));
  for (const segment of manifest.segments.filter(item => item.files.residual)) {
    files.push(`rulesets/generated/fused/mihomo/${segment.files.residual.file}`);
    if (segment.files.surge) files.push(`rulesets/generated/fused/surge/${segment.files.surge.file}`);
    if (segment.files.sing_box?.source) files.push(`rulesets/generated/fused/sing-box/${segment.files.sing_box.source}`);
  }
  for (const relative of files) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(ROOT, relative), target);
  }
  return { root, temp, read: relative => fs.readFileSync(path.join(root, relative), 'utf8') };
}

test('source catalog partitions BIZ and protects base, financial and safety groups', () => {
  const catalog = getBusinessProfileCatalog();
  assert.equal(catalog.services.length, 24);
  assert.equal(catalog.protectedGroups.length, 9);
  assert.deepEqual(new Set([...catalog.services.map(item => item.group), ...catalog.protectedGroups]), new Set(Object.values(graph.BIZ)));
  for (const key of ['AD', 'CRYPTO', 'PAYMENTS', 'DOWNLOAD', 'TRACKER', 'GFW', 'FINAL']) assert(catalog.protectedGroups.includes(graph.BIZ[key]));
  assert.deepEqual(resolveBusinessProfile({ profile: 'lite' }).enabled.map(item => item.id), ['ai', 'im', 'work', 'youtube']);
  assert.equal(resolveBusinessProfile({ profile: 'default' }).profile, 'full');
  assert.throws(() => resolveBusinessProfile({ profile: 'custom', enable: ['payments'] }), /Unknown/);
  assert.throws(() => resolveBusinessProfile({ profile: 'custom', enable: ['ai', 'ai'] }), /Duplicate/);
  assert.throws(() => resolveBusinessProfile({ profile: 'lite', enable: ['ai'] }), /only valid/);
});

test('profile planning never changes default source routing, DNS or traffic options', () => {
  // The existing source graph jitters provider refresh intervals on every
  // call. Fix its random input while comparing otherwise identical graphs.
  const random = Math.random;
  Math.random = () => 0.5;
  try {
  const before = graph.getMihomoNormalizedRoutingGraph();
  const dns = graph.getBusinessDnsPolicy(), traffic = graph.getTrafficOptions();
  const plan = customPlan();
  assert(plan.sourceRules.removed.length > 0);
  assert(plan.protectedSegments.length > 0);
  assert(plan.safetyByProvider['scki-fused-064-tools-residual'].includes('PROCESS-NAME,UnityHub.exe'));
  assert(plan.safetyByProvider['scki-fused-008-social-residual'].includes('PROCESS-NAME,Lemon8'));
  assert(plan.nativeSafetySegments.includes('scki-fused-064-tools'));
  assert(plan.sourceRules.retainedRetargeted.some(item => item.before.includes('(GEOSITE,google)') && item.after.endsWith(graph.BIZ.INTL_SITE)));
  assert(plan.sourceRules.retainedRetargeted.some(item => item.before.includes('(GEOSITE,apple)') && item.after.endsWith(graph.BIZ.CN_SITE)));
  assert.deepEqual(graph.getMihomoNormalizedRoutingGraph(), before);
  assert.deepEqual(graph.getBusinessDnsPolicy(), dns);
  assert.deepEqual(graph.getTrafficOptions(), traffic);
  assert(plan.sourceRules.removed.every(rule => !['DIRECT', 'REJECT', 'REJECT-DROP', graph.BIZ.AD].includes(rulePolicy(rule))));
  } finally { Math.random = random; }
});

test('Mihomo structural projection preserves logical/process safety and provider dependency closure', () => {
  const plan = customPlan();
  const input = {
    dns: { 'nameserver-policy': { 'rule-set:needed': 'https://dns.example/dns-query' }, 'fake-ip-filter': ['rule-set:nested'] },
    proxies: [{ name: 'node', type: 'socks5', 'dialer-proxy': 'chain' }],
    'proxy-providers': { Subscribe: { type: 'http', url: 'https://example.invalid' } },
    'proxy-groups': [{ name: graph.BIZ.WORK, proxies: ['node'] }, { name: graph.BIZ.INTL_SITE, proxies: ['node'] }],
    'rule-providers': { needed: {}, nested: { dependency: 'rule-set:transitive' }, transitive: {}, unused: {}, process: {} },
    rules: [`RULE-SET,unused,${graph.BIZ.WORK}`, `PROCESS-NAME,RustDesk.exe,${graph.BIZ.WORK}`,
      `AND,((NETWORK,UDP),(DST-PORT,443),(RULE-SET,process)),${graph.BIZ.GOOGLE}`, 'DST-PORT,7680,REJECT', `MATCH,${graph.BIZ.FINAL}`],
  };
  const after = projectMihomoConfig(input, plan);
  assert.deepEqual(after.dns, input.dns);
  assert.deepEqual(after.proxies, input.proxies);
  assert.deepEqual(after['proxy-providers'], input['proxy-providers']);
  assert.deepEqual(Object.keys(after['rule-providers']).sort(), ['needed', 'nested', 'process', 'transitive']);
  assert(after.rules.includes(`PROCESS-NAME,RustDesk.exe,${graph.BIZ.INTL_SITE}`));
  assert(after.rules.includes(`AND,((NETWORK,UDP),(DST-PORT,443),(RULE-SET,process)),${graph.BIZ.INTL_SITE}`));
  assert(after.rules.includes('DST-PORT,7680,REJECT'));
  assert.throws(() => projectMihomoConfig({ rules: ['AND,((NETWORK,UDP),REJECT'] }, plan), /Unbalanced/);
  assert.throws(() => projectMihomoConfig({ rules: ['RULE-SET,missing,DIRECT'] }, plan), /Unknown.*dependency/);
  assert.throws(() => projectMihomoConfig({ rules: [], proxies: [{ name: 'node', 'dialer-proxy': graph.BIZ.AI }] }, plan), /node\/provider dependency/);
  assert.throws(() => projectMihomoConfig({ rules: [], dns: { nameserver: [`https://dns.example/dns-query#${encodeURIComponent(graph.BIZ.GOOGLE)}`] } }, plan), /DNS outbound dependency/);
  assert.throws(() => projectMihomoConfig({ rules: [], 'proxy-groups': [{ name: 'retained-relay', type: 'relay', proxies: [graph.BIZ.AI] }] }, plan), /relay chain/);
});

test('sing-box dependency closure includes DNS and logical rules without schema changes', () => {
  const plan = customPlan();
  const input = {
    dns: { servers: [{ tag: 'dns', type: 'local' }], rules: [{ rule_set: ['dns-only'], action: 'route', server: 'dns' }] },
    outbounds: [{ tag: graph.BIZ.GOOGLE, type: 'selector', outbounds: ['node'] }, { tag: graph.BIZ.INTL_SITE, type: 'selector', outbounds: ['node'] }],
    route: { final: graph.BIZ.FINAL, rules: [
      { rule_set: ['service-only'], outbound: graph.BIZ.GOOGLE },
      { type: 'logical', mode: 'and', rules: [{ rule_set: ['logic-only'] }, { network: 'udp', port: 443 }], outbound: graph.BIZ.GOOGLE },
      { process_name: ['RustDesk.exe'], outbound: graph.BIZ.WORK },
    ], rule_set: ['dns-only', 'service-only', 'logic-only'].map(tag => ({ tag, type: 'remote', format: 'binary', url: `https://example/${tag}.srs` })) },
  };
  const dns = structuredClone(input.dns);
  const output = projectSingBox(input, plan);
  assert.deepEqual(output.dns, dns);
  assert.deepEqual(output.route.rule_set.map(item => item.tag), ['dns-only', 'logic-only']);
  assert(output.route.rules.every(rule => rule.outbound === graph.BIZ.INTL_SITE));
  assert.equal(output.route.final, graph.BIZ.FINAL);
  assert.throws(() => projectSingBox({ outbounds: [{ tag: 'node', type: 'socks', detour: graph.BIZ.AI }], route: { rules: [] } }, plan), /native node\/DNS\/HTTP dependency/);
  assert.throws(() => projectSingBox({ outbounds: [], dns: { servers: [{ tag: 'dns', detour: graph.BIZ.GOOGLE }] }, route: { rules: [] } }, plan), /native node\/DNS\/HTTP dependency/);
});

test('mixed fused residuals keep exact independent process predicates without retaining disabled domains', () => {
  const plan = customPlan();
  const value = projectMihomoConfig({
    'rule-providers': { 'scki-fused-064-tools-domain': {}, 'scki-fused-064-tools-residual': {} },
    rules: [`RULE-SET,scki-fused-064-tools-domain,${graph.BIZ.TOOLS}`, `RULE-SET,scki-fused-064-tools-residual,${graph.BIZ.TOOLS}`, `MATCH,${graph.BIZ.FINAL}`],
  }, plan);
  assert.deepEqual(value.rules, [
    `PROCESS-NAME,UnityHub.exe,${graph.BIZ.INTL_SITE}`, `PROCESS-NAME,OrbStack,${graph.BIZ.INTL_SITE}`,
    `PROCESS-NAME,OrbStack Helper,${graph.BIZ.INTL_SITE}`, `MATCH,${graph.BIZ.FINAL}`,
  ]);
  assert.deepEqual(value['rule-providers'], {});
});

test('segment identities come from compiler policy catalog, never proxy/direct labels', () => {
  const plan = customPlan();
  assert.equal(segmentFor('https://example/scki-fused-019-work-residual.yaml?scki=v6.0.21', plan), 'scki-fused-019-work');
  assert.throws(() => segmentFor('scki-fused-999-unknown.list', plan), /Unknown fused/);
  assert.throws(() => projectPlatform('add_fused_shunt_rule nonsense', 'passwall', plan), /Unknown Passwall/);
  assert.throws(() => projectPlatform('function notMain() {}', 'script', plan), /anchor/);
});

function loadRuntime(source) {
  const context = vm.createContext({ console: { log() {}, warn() {}, error() {} } });
  vm.runInContext(source, context);
  return context;
}
function runtimeInput() {
  return {
    proxies: [
      { name: '香港 HK Test', type: 'socks5', server: '127.0.0.1', port: 1000 },
      { name: '美国 US Test', type: 'socks5', server: '127.0.0.1', port: 1001 },
    ],
    'proxy-groups': [{ name: 'airport-group', type: 'select', proxies: ['香港 HK Test'] }],
    rules: ['MATCH,DIRECT'], 'rule-providers': { airport: { type: 'http', behavior: 'domain', url: 'https://example.invalid/rules' } },
    dns: { enable: true, nameserver: ['https://dns.example.invalid/dns-query'] },
  };
}

test('optional JS runtime preserves config and existing bridge container identities', () => {
  const plan = customPlan();
  for (const artifact of artifactInventory().filter(item => item.kind === 'script' && item.runtimeContract === 'in-place')) {
    const runtime = loadRuntime(projectPlatform(read(artifact.path), 'script', plan, artifact));
    const input = runtimeInput(), refs = { proxies: input.proxies, rules: input.rules, groups: input['proxy-groups'], providers: input['rule-providers'] };
    const output = runtime.main(input);
    assert.equal(output, input, `${artifact.path}: config identity`);
    assert.equal(output.rules, refs.rules, `${artifact.path}: rules identity`);
    assert.equal(output['proxy-groups'], refs.groups, `${artifact.path}: proxy-groups identity`);
    assert.equal(output['rule-providers'], refs.providers, `${artifact.path}: rule-providers identity`);
    assert.equal(output.proxies, refs.proxies, `${artifact.path}: proxies identity`);
    assert(output.rules.includes(`MATCH,${graph.BIZ.FINAL}`));
    assert(output['proxy-groups'].every(group => !plan.disabledGroups.includes(group.name)));
  }
});

test('optional JS runtime leaves preflight-rejected subscription inputs untouched without throwing', () => {
  const plan = customPlan();
  for (const artifact of artifactInventory().filter(item => item.kind === 'script' && item.runtimeContract === 'in-place')) {
    for (const reason of ['invalid-dialer', 'remote-provider', 'already-complete-but-rejected']) {
      const runtime = loadRuntime(projectPlatform(read(artifact.path), 'script', plan, artifact));
      let input = reason === 'remote-provider' ? { 'proxy-providers': { Remote: { type: 'http', url: 'https://example.invalid/sub' } }, dns: { enable: true } } : runtimeInput();
      if (reason === 'already-complete-but-rejected') input = loadRuntime(read(artifact.path)).main(input);
      if (reason !== 'remote-provider') input.proxies[0]['dialer-proxy'] = 'missing-hop';
      const before = JSON.stringify(input), refs = { proxies: input.proxies, rules: input.rules, groups: input['proxy-groups'], providers: input['rule-providers'] };
      let output;
      assert.doesNotThrow(() => { output = runtime.main(input); }, `${artifact.path}: ${reason}`);
      assert.equal(output, input, `${artifact.path}: ${reason} config identity`);
      assert.equal(JSON.stringify(input), before, `${artifact.path}: ${reason} input boundary`);
      assert.equal(input.proxies, refs.proxies); assert.equal(input.rules, refs.rules);
      assert.equal(input['proxy-groups'], refs.groups); assert.equal(input['rule-providers'], refs.providers);
    }
  }
});

test('AEROVE optional runtime retains independent candidates and original DNS/error boundaries', () => {
  const plan = customPlan(), artifact = artifactInventory().find(item => item.runtimeContract === 'clone');
  const source = read(artifact.path), generated = projectPlatform(source, 'script', plan, artifact);
  const input = runtimeInput(), before = JSON.stringify(input);
  const output = loadRuntime(generated).main(input);
  assert.notEqual(output, input);
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(JSON.parse(JSON.stringify(output.dns)), input.dns);
  assert(output['proxy-groups'].every(group => !plan.disabledGroups.includes(group.name)));
  for (const reason of ['invalid-dialer', 'remote-provider', 'dns-rule-set']) {
    const rejected = reason === 'remote-provider' ? { 'proxy-providers': { Remote: { type: 'http', url: 'https://example.invalid/sub' } } } : runtimeInput();
    if (reason === 'invalid-dialer') rejected.proxies[0]['dialer-proxy'] = 'missing-hop';
    if (reason === 'dns-rule-set') rejected.dns.nameserver = ['rule-set:airport'];
    const snapshot = JSON.stringify(rejected);
    function outcome(text) {
      try { return { value: JSON.parse(JSON.stringify(loadRuntime(text).main(rejected))) }; }
      catch (error) { return { error: error.message }; }
    }
    assert.deepEqual(outcome(generated), outcome(source), reason);
    assert.equal(JSON.stringify(rejected), snapshot, reason);
  }
});

test('optional in-place runtime refuses projection or immutable-container failures before committing', () => {
  const plan = customPlan(), artifact = artifactInventory().find(item => item.runtimeContract === 'in-place');
  const generated = projectPlatform(read(artifact.path), 'script', plan, artifact);
  for (const failure of ['projector', 'frozen-rules']) {
    const runtime = loadRuntime(generated), input = runtimeInput();
    if (failure === 'projector') runtime.projectMihomoConfig = function () { throw new Error('injected projection refusal'); };
    if (failure === 'frozen-rules') Object.freeze(input.rules);
    const snapshot = JSON.stringify(input), rules = input.rules, groups = input['proxy-groups'], providers = input['rule-providers'];
    assert.equal(runtime.main(input), input);
    assert.equal(JSON.stringify(input), snapshot);
    assert.equal(input.rules, rules); assert.equal(input['proxy-groups'], groups); assert.equal(input['rule-providers'], providers);
  }
});

test('JSON own __proto__ keys cannot change the projection or input prototype', () => {
  const plan = customPlan();
  const value = JSON.parse('{"__proto__":{"polluted":"no"},"rules":[]}');
  const projected = projectMihomoConfig(value, plan);
  assert.equal(Object.getPrototypeOf(projected), Object.prototype);
  assert(Object.hasOwn(projected, '__proto__'));
  assert.equal(projected.polluted, undefined);
  assert.equal(Object.getPrototypeOf(value), Object.prototype);
  for (const artifact of artifactInventory().filter(item => item.kind === 'script')) {
    const input = runtimeInput();
    Object.defineProperty(input, '__proto__', { value: { polluted: 'no' }, writable: true, configurable: true, enumerable: true });
    const before = JSON.stringify(input), prototype = Object.getPrototypeOf(input);
    const runtime = loadRuntime(projectPlatform(read(artifact.path), 'script', plan, artifact));
    assert.equal(runtime.main(input), input);
    assert.equal(JSON.stringify(input), before);
    assert.equal(Object.getPrototypeOf(input), prototype);
    assert.equal(input.polluted, undefined);
  }
});

test('full generation copies every official entry and companion bytes and refuses overwrite', t => {
  const { root, temp } = frozenRepository(t), outputDir = path.join(temp, 'full');
  const result = generateBusinessProfile({ profile: 'full', outputDir, root });
  assert.equal(result.manifest.disabled_services.length, 0);
  assert.equal(artifactInventory().length, 20);
  for (const artifact of result.manifest.artifacts) {
    const source = fs.readFileSync(path.join(root, artifact.path));
    const generated = fs.readFileSync(path.join(outputDir, artifact.path));
    assert.equal(hash(generated), hash(source), artifact.path);
    assert.equal(artifact.mode, 'byte-copy');
  }
  assert(result.manifest.artifacts.some(item => item.path.includes('/shunt-rules/')));
  assert(result.manifest.artifacts.some(item => item.path.includes('/rule-assets/')));
  assert.throws(() => generateBusinessProfile({ profile: 'full', outputDir, root }), /already exists/);
  assert(fs.existsSync(result.manifestPath));
});

test('all optional native and JS outputs preserve platform settings, safety and default source bytes', t => {
  const fixture = frozenRepository(t), { root, temp } = fixture, outputDir = path.join(temp, 'custom');
  const before = Object.fromEntries(artifactInventory().map(item => [item.path, hash(fs.readFileSync(path.join(root, item.path)))]));
  const result = generateBusinessProfile({ profile: 'custom', enable: [], outputDir, root });
  const plan = buildProfilePlan({ profile: 'custom', enable: [], root });
  assert.equal(result.manifest.disabled_services.length, 24);
  for (const item of artifactInventory()) {
    assert.equal(hash(fs.readFileSync(path.join(root, item.path))), before[item.path], `source changed: ${item.path}`);
    const output = fs.readFileSync(path.join(outputDir, item.path), 'utf8');
    if (item.kind === 'mihomo-yaml') {
      const original = parseYaml(fixture.read(item.path)), projected = parseYaml(output);
      assert.deepEqual(projected.dns, original.dns, item.path);
      assert.deepEqual(projected['proxy-providers'], original['proxy-providers'], item.path);
      assert(projected.rules.includes(`MATCH,${graph.BIZ.FINAL}`));
      assert(projected['proxy-groups'].every(group => !result.manifest.disabled_groups.includes(group.name)));
      for (const rule of original.rules.filter(rule => ['DIRECT', 'REJECT', graph.BIZ.AD].includes(rulePolicy(rule)))) assert(projected.rules.includes(rule), `safety rule lost: ${rule}`);
      for (const rule of original.rules) {
        const target = rulePolicy(rule), parts = rule.split(',');
        if (!plan.disabledGroups.includes(target) || parts[0] !== 'RULE-SET') continue;
        for (const entry of plan.safetyByProvider[parts[1]] || []) assert(projected.rules.includes(`${entry},${plan.fallbacks[target]}`), `compiled process predicate lost: ${entry}`);
      }
    }
    if (item.kind === 'sing-box') {
      const original = JSON.parse(fixture.read(item.path)), projected = JSON.parse(output);
      assert.deepEqual(projected.dns, original.dns);
      assert.deepEqual(projected.inbounds, original.inbounds);
      assert.deepEqual(projected.http_clients, original.http_clients);
      assert.equal(projected.route.final, original.route.final);
      assert(projected.outbounds.every(outbound => !result.manifest.disabled_groups.includes(outbound.tag)));
      for (const id of plan.nativeSafetySegments.filter(id => plan.disabledGroups.includes(plan.segmentPolicies[id]))) {
        assert(projected.route.rules.some(rule => (Array.isArray(rule.rule_set) ? rule.rule_set : [rule.rule_set]).includes(id)), `native process predicate lost: ${id}`);
      }
    }
    if (item.kind === 'script') {
      const config = { proxies: [
        { name: '香港 HK Test', type: 'socks5', server: '127.0.0.1', port: 1000 },
        { name: '美国 US Test', type: 'socks5', server: '127.0.0.1', port: 1001 },
      ], dns: { enable: true }, 'proxy-groups': [], businessProfile: 'full', profile: { business: 'full' } };
      function run(source) { const context = vm.createContext({ console: { log() {}, warn() {}, error() {} } }); vm.runInContext(source, context); return JSON.parse(JSON.stringify(context.main(structuredClone(config)))); }
      const original = run(fixture.read(item.path)), projected = run(output);
      assert.deepEqual(projected.dns, original.dns, item.path);
      assert.deepEqual(projected.proxies, original.proxies, item.path);
      assert(projected.rules.includes(`MATCH,${graph.BIZ.FINAL}`));
      assert(projected['proxy-groups'].every(group => !result.manifest.disabled_groups.includes(group.name)));
      assert(projected.rules.every(rule => !result.manifest.disabled_groups.includes(rulePolicy(rule))));
      assert.deepEqual(projected['proxy-groups'].filter(group => group.type === 'smart' || group.type === 'url-test'),
        original['proxy-groups'].filter(group => group.type === 'smart' || group.type === 'url-test'));
    }
    if (item.kind === 'xray') {
      const original = JSON.parse(fixture.read(item.path)), projected = JSON.parse(output);
      for (const rule of original.filter(rule => rule.process?.length)) {
        const after = projected.find(item => item.id === rule.id);
        assert(after, `Xray process predicate lost: ${rule.id}`);
        for (const key of Object.keys(rule).filter(key => !['remarks', 'outboundTag'].includes(key))) assert.deepEqual(after[key], rule[key]);
      }
    }
    if (item.kind === 'karing') {
      const original = JSON.parse(fixture.read(item.path)), projected = JSON.parse(output);
      for (const id of plan.nativeSafetySegments) {
        const beforeRule = original.rules.find(rule => rule.rule_set?.some(url => url.includes(`/${id}.srs`)));
        if (!beforeRule) continue;
        const afterRule = projected.rules.find(rule => rule.rule_set?.some(url => url.includes(`/${id}.srs`)));
        assert(afterRule, `Karing native process predicate lost: ${id}`);
        assert.deepEqual(afterRule.rule_set, beforeRule.rule_set);
      }
    }
    if (item.kind === 'passwall') {
      for (const id of plan.nativeSafetySegments) assert(output.includes(`add_fused_shunt_rule '${id} |`), `Passwall native process predicate lost: ${id}`);
    }
    if (item.kind === 'conf' && fixture.read(item.path).includes('/fused/surge/')) {
      for (const [id, entries] of Object.entries(plan.surgeSafetyBySegment)) {
        const target = plan.segmentPolicies[id];
        if (plan.disabledGroups.includes(target)) for (const entry of entries) assert(output.includes(`${entry},${plan.fallbacks[target]}`), `Surge/Loon process predicate lost: ${entry}`);
      }
    }
    if (item.kind === 'conf' && item.path.includes('/Loon/')) {
      for (const group of plan.disabledGroups) assert(!output.includes(`policy=${group},`), `Loon remote rule references disabled group: ${group}`);
    }
  }
});

test('dry-run writes nothing; path guards refuse source directories and symlink ancestors', t => {
  const temp = scratch(t), outputDir = path.join(temp, 'dry');
  const result = generateBusinessProfile({ profile: 'lite', outputDir, dryRun: true });
  assert.equal(result.dryRun, true); assert(!fs.existsSync(outputDir));
  assert.throws(() => validateOutputDirectory(path.join(ROOT, 'rulesets', 'forbidden')), /repository source/);
  const junction = path.join(temp, 'link');
  fs.symlinkSync(temp, junction, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => validateOutputDirectory(path.join(junction, 'out')), /symlink/);
  fs.unlinkSync(junction);
  assert.throws(() => parseArguments(['--profile', 'lite', '--enable']), /incomplete/);
  assert.throws(() => parseArguments(['--force']), /Unknown/);
});

test('second-file write failure removes only owned staging and leaves final output absent', t => {
  const { root, temp } = frozenRepository(t), outputDir = path.join(temp, 'write-failure');
  const write = fs.writeFileSync;
  let stagedWrites = 0;
  fs.writeFileSync = function (file, ...args) {
    if (String(file).includes('.write-failure.scki-profile-') && ++stagedWrites === 2) throw new Error('injected second-file write failure');
    return write.call(this, file, ...args);
  };
  try { assert.throws(() => generateBusinessProfile({ profile: 'full', outputDir, root }), /injected second-file/); }
  finally { fs.writeFileSync = write; }
  assert.equal(stagedWrites, 2);
  assert(!fs.existsSync(outputDir));
  assert(!fs.readdirSync(temp).some(name => name.startsWith('.write-failure.scki-profile-')));
  assert(fs.existsSync(path.join(root, 'rulesets/source/routing-graph.js')));
});

test('artifact read-back failure leaves no final or staging profile directory', t => {
  const { root, temp } = frozenRepository(t), outputDir = path.join(temp, 'read-failure');
  const readFile = fs.readFileSync;
  fs.readFileSync = function (file, ...args) {
    if (String(file).includes('.read-failure.scki-profile-')) return Buffer.from('injected read-back mismatch');
    return readFile.call(this, file, ...args);
  };
  try { assert.throws(() => generateBusinessProfile({ profile: 'full', outputDir, root }), /read-back failed/); }
  finally { fs.readFileSync = readFile; }
  assert(!fs.existsSync(outputDir));
  assert(!fs.readdirSync(temp).some(name => name.startsWith('.read-failure.scki-profile-')));
});

test('third-party output created before publication remains intact and own staging is cleaned', t => {
  const { root, temp } = frozenRepository(t), outputDir = path.join(temp, 'race');
  const lstat = fs.lstatSync;
  let injected = false;
  fs.lstatSync = function (file, ...args) {
    if (path.resolve(String(file)) === outputDir && !injected && fs.readdirSync(temp).some(name => name.startsWith('.race.scki-profile-'))) {
      injected = true;
      fs.mkdirSync(outputDir);
      fs.writeFileSync(path.join(outputDir, 'third-party.txt'), 'keep this exact content');
    }
    return lstat.call(this, file, ...args);
  };
  try { assert.throws(() => generateBusinessProfile({ profile: 'full', outputDir, root }), /appeared before publication/); }
  finally { fs.lstatSync = lstat; }
  assert(injected);
  assert.equal(fs.readFileSync(path.join(outputDir, 'third-party.txt'), 'utf8'), 'keep this exact content');
  assert.deepEqual(fs.readdirSync(outputDir), ['third-party.txt']);
  assert(!fs.readdirSync(temp).some(name => name.startsWith('.race.scki-profile-')));
});

test('directory publication refuses an existing empty target as well as populated targets', t => {
  const temp = scratch(t), staging = path.join(temp, 'stage'), outputDir = path.join(temp, 'existing');
  fs.mkdirSync(staging); fs.writeFileSync(path.join(staging, 'profile'), 'profile'); fs.mkdirSync(outputDir);
  assert.throws(() => publishDirectory(staging, outputDir), /appeared before publication/);
  assert.deepEqual(fs.readdirSync(outputDir), []);
  assert.equal(fs.readFileSync(path.join(staging, 'profile'), 'utf8'), 'profile');
});

test('Windows native publication also refuses an empty target created after its last preflight', { skip: process.platform !== 'win32' }, t => {
  const temp = scratch(t), staging = path.join(temp, 'stage'), outputDir = path.join(temp, 'late-empty');
  fs.mkdirSync(staging); fs.writeFileSync(path.join(staging, 'profile'), 'profile');
  const rename = fs.renameSync;
  fs.renameSync = function (source, destination) { fs.mkdirSync(destination); return rename(source, destination); };
  try { assert.throws(() => publishDirectory(staging, outputDir)); }
  finally { fs.renameSync = rename; }
  assert.deepEqual(fs.readdirSync(outputDir), []);
  assert.equal(fs.readFileSync(path.join(staging, 'profile'), 'utf8'), 'profile');
});
