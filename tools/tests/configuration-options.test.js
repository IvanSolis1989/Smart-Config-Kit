'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync}=require('node:child_process');
const { parseLocalTrafficOptions, planLocalTrafficOptions } = require('../lib/local-traffic-options');
const { validateSettings, parseArgs, main } = require('../configure');

const source = (profile = 'adaptive', multiplier = 'null') => `// >>> SCKI NODE DNS HINTS: BEGIN\nvar SCKI_SUBSCRIPTION_ADAPTER_PROFILES = {\n  "off": { id: "off", nodeDnsProjection: "off" },\n  "policy": { id: "policy", nodeDnsProjection: "policy" },\n  "adaptive": { id: "adaptive", nodeDnsProjection: "adaptive" },\n  "hosts-only": { id: "hosts-only", nodeDnsProjection: "hosts-only" }\n}\nconst SCKI_SUBSCRIPTION_ADAPTER_PROFILE = '${profile}'\nconst SCKI_MAX_NODE_MULTIPLIER = ${multiplier}\nconst SCKI_HEALTH_CHECK_PROFILE = 'standard'\nconst SCKI_QUIC_POLICY = 'block-foreign'\nconst SCKI_ZEROTIER_PLANET_PROXY = false\nthrow new Error('Never execute target scripts')\n`;

test('local options parse exact profile and numeric multiplier without executing code', () => {
  assert.equal(parseLocalTrafficOptions(source('hosts-only', '2.5')).options.subscriptionAdapterProfile, 'hosts-only');
  assert.equal(parseLocalTrafficOptions(source('adaptive', '1e2')).options.maxNodeMultiplier, 100);
  for (const value of ['0', '-1', 'NaN', 'Infinity', 'process.env.VALUE', '"2"', '010', '077', '00.5']) {
    assert.throws(() => parseLocalTrafficOptions(source('adaptive', value)), /invalid/i);
  }
  assert.throws(() => parseLocalTrafficOptions(source('untrusted')), /invalid/i);
});

test('source updates preserve trusted DNS and multiplier choices by default', () => {
  const local = source('hosts-only', '2.5');
  const update = source() + '// updated\n';
  const plan = planLocalTrafficOptions(local, update);
  assert.equal(plan.options.subscriptionAdapterProfile, 'hosts-only');
  assert.equal(plan.options.maxNodeMultiplier, 2.5);
  assert.equal(planLocalTrafficOptions(local, update, { maxNodeMultiplier: null }).options.maxNodeMultiplier, null);
  const older=update.replace('  "hosts-only": { id: "hosts-only", nodeDnsProjection: "hosts-only" }\n','');
  assert.throws(()=>planLocalTrafficOptions(local,older),/Node-DNS capability/);
});

test('browser UDP choice is typed, preserved on updates and explicit options take priority', () => {
  const supported = source() + "const SCKI_BROWSER_UDP_POLICY = 'off'\n";
  const enabled = supported.replace("SCKI_BROWSER_UDP_POLICY = 'off'", "SCKI_BROWSER_UDP_POLICY = 'reject'");
  assert.equal(parseArgs(['--target','x.js','--browser-udp','reject']).localOptions.browserUdpPolicy, 'reject');
  assert.deepEqual(validateSettings({schema_version:1,localOptions:{browserUdpPolicy:'reject'}}).localOptions, {browserUdpPolicy:'reject'});
  assert.equal(planLocalTrafficOptions(enabled, supported).options.browserUdpPolicy, 'reject');
  assert.equal(planLocalTrafficOptions(enabled, supported, {browserUdpPolicy:'off'}).options.browserUdpPolicy, 'off');
  assert.match(planLocalTrafficOptions(supported, supported, {browserUdpPolicy:'reject'}).updated, /SCKI_BROWSER_UDP_POLICY = 'reject'/);
  for (const value of ['true','proxy',true,null]) {
    assert.throws(() => validateSettings({schema_version:1,localOptions:{browserUdpPolicy:value}}), /Invalid trusted local option/);
  }
});

test('browser UDP reject cannot silently deploy to an older or App-managed script without the slot', () => {
  const older = source();
  const enabled = older + "const SCKI_BROWSER_UDP_POLICY = 'reject'\n";
  const defaultPlan = planLocalTrafficOptions(older, older);
  assert.equal(defaultPlan.options.browserUdpPolicy, undefined);
  assert.equal(defaultPlan.updated, older);
  assert.doesNotMatch(planLocalTrafficOptions(older, older, {browserUdpPolicy:'off'}).updated, /SCKI_BROWSER_UDP_POLICY/);
  assert.throws(() => planLocalTrafficOptions(older, older, {browserUdpPolicy:'reject'}), /browser UDP capability/i);
  assert.throws(() => planLocalTrafficOptions(enabled, older), /browser UDP capability/i);
  assert.doesNotMatch(planLocalTrafficOptions(enabled, older, {browserUdpPolicy:'off'}).updated, /SCKI_BROWSER_UDP_POLICY/);
});

test('browser UDP settings save with readback and reject unsupported updates before backup or write', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-browser-udp-'));
  t.after(() => fs.rmSync(directory, {recursive:true,force:true}));
  const target = path.join(directory,'local.js'), settings = path.join(directory,'settings.json'), incoming = path.join(directory,'older.js');
  fs.writeFileSync(target,source() + "const SCKI_BROWSER_UDP_POLICY = 'off'\n");
  fs.writeFileSync(settings,JSON.stringify({schema_version:1,localOptions:{browserUdpPolicy:'reject'}}));
  fs.writeFileSync(incoming,source());
  main(['--target',target,'--settings',settings]);
  const saved = fs.readFileSync(target,'utf8'), before = fs.readdirSync(directory).sort();
  assert.equal(parseLocalTrafficOptions(saved).options.browserUdpPolicy,'reject');
  assert.throws(() => main(['--target',target,'--source',incoming]), /browser UDP capability/i);
  assert.equal(fs.readFileSync(target,'utf8'),saved);
  assert.deepEqual(fs.readdirSync(directory).sort(),before);
  main(['--target',target,'--source',incoming,'--browser-udp','off']);
  assert.equal(parseLocalTrafficOptions(fs.readFileSync(target,'utf8')).options.browserUdpPolicy,undefined);
});

test('settings reject unknown fields, mixed modes, and subscription-controlled values', () => {
  const valid = {schema_version:1,localOptions:{subscriptionAdapterProfile:'hosts-only',maxNodeMultiplier:2}};
  assert.deepEqual(validateSettings(valid), valid);
  for (const settings of [
    {...valid, schema_version:2}, {...valid, surprise:true},
    {...valid, business:{profile:'lite',enable:[]}},
    {schema_version:1,localOptions:{maxNodeMultiplier:'2'}},
    {schema_version:1,localOptions:{subscriptionAdapterProfile:'airport'}},
    {schema_version:1,localOptions:{zeroTierPlanetProxy:'false'}},
    {schema_version:1,business:{profile:'lite',enable:['ai']}},
    JSON.parse('{"schema_version":1,"localOptions":{"__proto__":{}}}'),
  ]) assert.throws(() => validateSettings(settings));
  assert.throws(() => parseArgs(['--target','x.js','--unknown','value']));
  assert.throws(() => parseArgs(['--target','x.js','--profile','lite','--output-dir','new']));
});

test('unified local dry-run has no writes; apply saves with original backup and readback', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-config-'));
  t.after(() => fs.rmSync(directory, {recursive:true,force:true}));
  const target = path.join(directory,'local.js');
  const settings = path.join(directory,'options.json');
  const original = source();
  fs.writeFileSync(target, original);
  fs.writeFileSync(settings,JSON.stringify({schema_version:1,localOptions:{subscriptionAdapterProfile:'hosts-only',maxNodeMultiplier:2,healthCheckProfile:'power-save'}}));
  main(['--settings',settings,'--target',target,'--dry-run']);
  assert.equal(fs.readFileSync(target,'utf8'),original);
  assert.deepEqual(fs.readdirSync(directory).sort(),['local.js','options.json']);
  main(['--settings',settings,'--target',target]);
  const actual = parseLocalTrafficOptions(fs.readFileSync(target,'utf8')).options;
  assert.equal(actual.subscriptionAdapterProfile,'hosts-only');
  assert.equal(actual.maxNodeMultiplier,2);
  assert.equal(actual.healthCheckProfile,'power-save');
  const backups = fs.readdirSync(directory).filter(file=>file.endsWith('.bak'));
  assert.equal(backups.length,1);
  assert.equal(fs.readFileSync(path.join(directory,backups[0]),'utf8'),original);
});

test('DNS option refuses an App-managed or older script without the Node-DNS capability', t => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'scki-config-capability-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const target=path.join(directory,'lite.js');
  const original=source('off').replace('// >>> SCKI NODE DNS HINTS: BEGIN\n','');
  fs.writeFileSync(target,original);
  assert.throws(()=>main(['--target',target,'--dns-profile','hosts-only']),/Node-DNS capability/);
  assert.equal(fs.readFileSync(target,'utf8'),original);
  assert.deepEqual(fs.readdirSync(directory),['lite.js']);
});

test('unified business CLI prints an inspectable full-profile dry-run without creating output',t=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'scki-config-preview-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const outputDir=path.join(directory,'preview');
  const result=spawnSync(process.execPath,[path.resolve(__dirname,'../configure.js'),'--profile','full','--output-dir',outputDir,'--dry-run'],{encoding:'utf8',windowsHide:true,timeout:30000});
  assert.equal(result.status,0,result.stderr);
  const preview=JSON.parse(result.stdout);
  assert.equal(preview.profile,'full');
  assert.equal(preview.dryRun,true);
  assert.equal(preview.entryPoints.length,20);
  assert.equal(fs.existsSync(outputDir),false);
});
