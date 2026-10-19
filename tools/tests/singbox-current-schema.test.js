'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const fullPath = path.join(root, 'SingBox/SingBox(sing-box)-full.json');
const compatPath = path.join(root, 'SingBox/SingBox(sing-box)-1.13.json');
const full = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
const compat = JSON.parse(fs.readFileSync(compatPath, 'utf8'));

test('1.14 and 1.13 profiles preserve identical routing, URLs and outbound topology', () => {
  assert.deepEqual(compat.outbounds, full.outbounds);
  assert.deepEqual(compat.route.rules, full.route.rules);
  assert.equal(compat.route.final, full.route.final);
  assert.equal(full.outbounds.filter(item => ['selector', 'urltest'].includes(item.type)).length, 54);
  const payload = ({ http_client, download_detour, ...ruleSet }) => ruleSet;
  assert.deepEqual(compat.route.rule_set.map(payload), full.route.rule_set.map(payload));
  assert.deepEqual(compat.dns.servers, full.dns.servers);
  assert.deepEqual(full.route.rules[0], { inbound: ['tun-in'], action: 'sniff' });
  assert.equal(full.route.rules.filter(rule => rule.action === 'sniff').length, 1);
});

test('each schema uses its supported download and DNS response mechanisms', () => {
  assert.equal(Object.hasOwn(full, '_meta'), false);
  assert.equal(Object.hasOwn(compat, '_meta'), false);
  assert.equal(Object.hasOwn(compat, 'http_clients'), false);
  const client = full.http_clients.find(item => item.tag === full.route.default_http_client);
  assert.ok(client);
  for (const item of full.route.rule_set) {
    assert.equal(item.http_client, client.tag);
    assert.equal(Object.hasOwn(item, 'download_detour'), false);
  }
  for (const item of compat.route.rule_set) {
    assert.equal(item.download_detour, client.detour);
    assert.equal(Object.hasOwn(item, 'http_client'), false);
  }
  const evaluation = full.dns.rules.findIndex(rule => rule.action === 'evaluate');
  const response = full.dns.rules.findIndex(rule => rule.match_response);
  assert.ok(evaluation >= 0 && response > evaluation);
  assert.equal(full.dns.rules[evaluation].server, 'dns_direct');
  assert.deepEqual(full.dns.rules[response].rule_set, ['geoip-cn']);
  assert.equal(full.dns.rules[response].action, 'respond');
  assert.equal(compat.dns.rules.some(rule => rule.match_response || rule.action === 'evaluate'), false);
  assert.equal(compat.dns.rules.find(rule => rule.rule_set?.includes('geoip-cn')).server, 'dns_direct');
  for (const config of [full, compat]) {
    assert.ok(config.dns.servers.every(server => server.type === 'https' && server.server && !server.address));
    assert.ok(config.inbounds.every(inbound => !inbound.sniff && !inbound.sniff_override_destination));
  }
});

const executable = process.platform === 'win32' ? 'sing-box.exe' : 'sing-box';
const candidates = [
  ['1.14', 'SING_BOX_114_BIN', path.join(root, '.cache/official-singbox-1.14.3/sing-box-1.14.3-windows-amd64', executable), fullPath],
  ['1.13', 'SING_BOX_113_BIN', path.join(root, '.cache/fused-rule-sets/sing-box', executable), compatPath]
];
for (const [line, envName, fallbackBinary, filename] of candidates) {
  const explicitlyConfigured = Object.hasOwn(process.env, envName);
  const binary = explicitlyConfigured ? process.env[envName] : fallbackBinary;
  test(`official sing-box ${line} accepts its generated profile without legacy overrides`, { skip: !explicitlyConfigured && !fs.existsSync(binary) }, () => {
    assert.ok(binary && fs.existsSync(binary) && fs.statSync(binary).isFile(), `${envName} points to a missing or non-file executable: ${binary}`);
    const env = { ...process.env, NO_COLOR: '1' };
    for (const key of Object.keys(env)) if (key.startsWith('ENABLE_DEPRECATED_')) delete env[key];
    const version = spawnSync(binary, ['version'], { encoding: 'utf8', env, timeout: 30000 });
    assert.equal(version.status, 0, version.stderr);
    assert.match(version.stdout, new RegExp(`sing-box version ${line.replace('.', '\\.')}\\.`));
    const checked = spawnSync(binary, ['check', '-c', filename], { encoding: 'utf8', env, timeout: 30000 });
    assert.equal(checked.status, 0, `${checked.stdout}\n${checked.stderr}`);
    assert.doesNotMatch(checked.stdout + checked.stderr, /deprecated|unknown field|FATAL/i);
  });

  test(`invalid explicit ${envName} fails instead of skipping the core check`, () => {
    const missing = path.join(root, '.cache', `missing-core-${process.pid}-${line}`, executable);
    assert.equal(fs.existsSync(missing), false);
    // Select only the corresponding core test so this subprocess cannot recurse
    // into these negative-path regressions or depend on another installed core.
    const pattern = `^official sing-box ${line.replace('.', '\\.')} accepts`;
    const childEnv = { ...process.env, [envName]: missing };
    delete childEnv.NODE_TEST_CONTEXT;
    const result = spawnSync(process.execPath, ['--test', '--test-name-pattern', pattern, __filename], {
      encoding: 'utf8', env: childEnv, timeout: 30000, windowsHide: true
    });
    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout + result.stderr, new RegExp(`${envName} points to a missing or non-file executable`));
  });
}
