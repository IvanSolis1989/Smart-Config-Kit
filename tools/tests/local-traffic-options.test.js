'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { parseArgs } = require('../configure-traffic-options');
const { prepareUpdates } = require('../sync-traffic-options');
const { parseLocalTrafficOptions, planLocalTrafficOptions, writeLocalTrafficOptions } = require('../lib/local-traffic-options');

const root = path.resolve(__dirname, '../..');
const fixture = (zero = false, health = 'standard', quic = 'block-foreign', eol = '\n') => [
  `const SCKI_HEALTH_CHECK_PROFILE = '${health}'`,
  `const SCKI_QUIC_POLICY = '${quic}'`,
  `const SCKI_ZEROTIER_PLANET_PROXY = ${zero}`,
  'throw new Error("Target scripts must never execute")', '',
].join(eol);

test('trusted const parsing ignores comments and strings, and never executes target code', () => {
  const source = '// const SCKI_ZEROTIER_PLANET_PROXY = true\n/* const SCKI_QUIC_POLICY = "bad" */\n' +
    'const unrelated = "const SCKI_ZEROTIER_PLANET_PROXY = true"\n' + fixture();
  assert.equal(parseLocalTrafficOptions(source).options.zeroTierPlanetProxy, false);
  for (const bad of [
    fixture('"true"'), fixture('1'), fixture('process.env.VALUE'),
    fixture() + '\nfunction nested() {\nconst SCKI_ZEROTIER_PLANET_PROXY = true\n}',
    fixture().replace('const SCKI_ZEROTIER_PLANET_PROXY', 'let SCKI_ZEROTIER_PLANET_PROXY'),
    'function nested() {\nconst SCKI_ZEROTIER_PLANET_PROXY = true\n}',
  ]) assert.throws(() => parseLocalTrafficOptions(bad), /invalid|duplicate/);
});

test('deploy precedence preserves ZeroTier automatically and health/quic only when requested', () => {
  const local = fixture(true, 'power-save', 'follow-rules');
  const incoming = fixture() + '// new source\n';
  assert.deepEqual(planLocalTrafficOptions(local, incoming).options, {
    healthCheckProfile: 'standard', quicPolicy: 'block-foreign', zeroTierPlanetProxy: true,
  });
  assert.deepEqual(planLocalTrafficOptions(local, incoming, { preserveLocal: true }).options, parseLocalTrafficOptions(local).options);
  assert.deepEqual(planLocalTrafficOptions(local, incoming, { preserveLocal: true, zeroTierPlanetProxy: false, healthCheckProfile: 'standard' }).options, {
    healthCheckProfile: 'standard', quicPolicy: 'follow-rules', zeroTierPlanetProxy: false,
  });
  assert.equal(planLocalTrafficOptions(local, local, { quicPolicy: 'block-foreign' }).options.zeroTierPlanetProxy, true);
  const missing = '// first deployment\n';
  assert.equal(planLocalTrafficOptions(missing, incoming).options.zeroTierPlanetProxy, false);
  assert.equal(planLocalTrafficOptions(missing, incoming, { zeroTierPlanetProxy: true }).options.zeroTierPlanetProxy, true);
});

test('sync keeps an existing on/off const and defaults only missing declarations', () => {
  const defaults = { healthCheckProfile: 'standard', quicPolicy: 'block-foreign' };
  for (const value of [true, false, undefined]) {
    const read = (file) => {
      const source = fs.readFileSync(file, 'utf8');
      if (!file.endsWith('traffic-options.js')) return value === undefined
        ? source.replace(/^const SCKI_ZEROTIER_PLANET_PROXY[^\r\n]*\r?\n/m, '')
        : source.replace(/^const SCKI_ZEROTIER_PLANET_PROXY[^\r\n]*/m, `const SCKI_ZEROTIER_PLANET_PROXY = ${value}; // local preference`);
      return source;
    };
    const updates = prepareUpdates(defaults, read);
    for (const item of updates.slice(1)) assert.equal(parseLocalTrafficOptions(item.updated).options.zeroTierPlanetProxy, value ?? false);
    const map = new Map(updates.map(item => [item.file, item.updated]));
    assert(prepareUpdates(defaults, file => map.get(file)).every(item => item.original === item.updated));
  }
  assert.throws(() => prepareUpdates(defaults, file => fs.readFileSync(file, 'utf8').replace('const SCKI_ZEROTIER_PLANET_PROXY = false', 'const SCKI_ZEROTIER_PLANET_PROXY = "true"')), /invalid/);
});

test('local CLI rejects global ZeroTier and unrelated options before writing', () => {
  for (const args of [['--zerotier', 'on'], ['--browser-udp','reject'], ['--source', 'source.js'], ['--preserve-local'], ['--target', 'x.js', '--no-generate'], ['--target', 'x.js', '--zerotier', 'true'], ['--target','x.js','--browser-udp','proxy'], ['--target','x.js','--browser-udp','reject','--browser-udp','off']]) {
    assert.throws(() => parseArgs(args));
  }
  assert.equal(parseArgs(['--target', 'x.js', '--zerotier', 'off']).zeroTierPlanetProxy, false);
  assert.equal(parseArgs(['--target','x.js','--browser-udp','reject']).browserUdpPolicy, 'reject');
});

test('CLI dry-run has no writes, deployment backs up original, and repeated calls are idempotent', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-local-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const target = path.join(dir, 'local.js');
  const incoming = path.join(dir, 'new.js');
  const old = fixture(true, 'power-save', 'follow-rules', '\r\n');
  fs.writeFileSync(target, old);
  fs.writeFileSync(incoming, fixture(false, 'standard', 'block-foreign', '\r\n') + '// updated\r\n');
  const cli = (...args) => spawnSync(process.execPath, ['tools/configure-traffic-options.js', '--target', target, ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(cli('--source', incoming, '--preserve-local', '--dry-run').status, 0);
  assert.equal(fs.readFileSync(target, 'utf8'), old);
  assert.equal(fs.readdirSync(dir).length, 2);
  const deployed = cli('--source', incoming, '--preserve-local');
  assert.equal(deployed.status, 0, deployed.stderr);
  const saved = fs.readFileSync(target, 'utf8');
  assert(saved.endsWith('// updated\r\n'));
  assert(!/(?<!\r)\n/.test(saved));
  assert.equal(parseLocalTrafficOptions(saved).options.zeroTierPlanetProxy, true);
  const backups = fs.readdirSync(dir).filter(file => file.endsWith('.bak'));
  assert.equal(backups.length, 1);
  assert.equal(fs.readFileSync(path.join(dir, backups[0]), 'utf8'), old);
  assert.equal(cli('--source', incoming, '--preserve-local').status, 0);
  assert.equal(fs.readdirSync(dir).filter(file => file.endsWith('.bak')).length, 1);
  assert.equal(cli('--zerotier', 'off').status, 0);
  assert.equal(parseLocalTrafficOptions(fs.readFileSync(target, 'utf8')).options.zeroTierPlanetProxy, false);
  const beforeBad = fs.readFileSync(target, 'utf8');
  fs.writeFileSync(incoming, fixture('null'));
  assert.equal(cli('--source', incoming).status, 1);
  assert.equal(fs.readFileSync(target, 'utf8'), beforeBad);
});

test('writer rejects changed input and preserves missing-const BOM and newline layout', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-write-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const target = path.join(dir, 'local.js');
  fs.writeFileSync(target, fixture());
  const plan = planLocalTrafficOptions(fixture(), fixture(), { zeroTierPlanetProxy: true });
  fs.appendFileSync(target, '// concurrent change\n');
  assert.throws(() => writeLocalTrafficOptions(target, plan), /changed/);
  assert.equal(fs.readdirSync(dir).length, 1);
  const bom = planLocalTrafficOptions('\ufeff// blank\r\n').updated;
  assert.equal(bom.charCodeAt(0), 0xfeff);
  assert(!/(?<!\r)\n/.test(bom));
});

test('replacement failure leaves target bytes intact and cleans temporary output', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-atomic-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const target = path.join(dir, 'local.js');
  const original = fixture();
  fs.writeFileSync(target, original);
  const plan = planLocalTrafficOptions(original, original, { zeroTierPlanetProxy: true });
  const rename = fs.renameSync;
  try {
    fs.renameSync = () => { throw new Error('simulated replacement failure'); };
    assert.throws(() => writeLocalTrafficOptions(target, plan), /simulated replacement failure/);
  } finally { fs.renameSync = rename; }
  assert.equal(fs.readFileSync(target, 'utf8'), original);
  assert.equal(fs.readdirSync(dir).filter(file => file.endsWith('.tmp')).length, 0);
  const backup = fs.readdirSync(dir).find(file => file.endsWith('.bak'));
  assert.equal(fs.readFileSync(path.join(dir, backup), 'utf8'), original);
});

test('concurrent write after replacement is preserved with the original backup', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-conflict-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const target = path.join(dir, 'local.js');
  const original = fixture();
  const concurrent = Buffer.from(fixture(true) + '// third-party effective update\n');
  fs.writeFileSync(target, original);
  const plan = planLocalTrafficOptions(original, original, { zeroTierPlanetProxy: true });
  const rename = fs.renameSync;
  let replacements = 0;
  try {
    fs.renameSync = (from, to) => {
      rename(from, to);
      if (to === target) {
        replacements++;
        fs.writeFileSync(target, concurrent);
      }
    };
    assert.throws(() => writeLocalTrafficOptions(target, plan), /Local script conflict: target changed after replacement.*backup preserved/);
  } finally { fs.renameSync = rename; }
  assert.equal(replacements, 1, 'unknown output must not trigger a rollback rename');
  assert.deepEqual(fs.readFileSync(target), concurrent);
  const backups = fs.readdirSync(dir).filter(file => file.endsWith('.bak'));
  assert.equal(backups.length, 1);
  assert.equal(fs.readFileSync(path.join(dir, backups[0]), 'utf8'), original);
  assert.equal(fs.readdirSync(dir).filter(file => file.endsWith('.tmp')).length, 0);
});
