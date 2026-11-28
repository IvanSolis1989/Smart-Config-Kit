'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { clientDirectory } = require('../lib/client-layout');
const { parseYaml } = require('../lib/business-profile-platforms');
const { extractOpenClashYaml } = require('../lib/business-profile-platform-core');
const { localPathForRepositoryRuleUrl } = require('../lib/repository-rule-asset');
const { TARGETS, scenarios } = require('../lib/js-engine-fixtures');
const { getTrafficOptions } = require('../../rulesets/source/routing-graph');
const { executeNode } = require('../validate-js-engines');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const fixture = scenarios()[0].config;
const offlineUrl = 'http://127.0.0.1:0/';

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 30000, windowsHide: true });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${path.basename(command)} ${args[0]}\n${result.stdout}${result.stderr}`);
  return result.stdout;
}

function openClashConfig(variant, home) {
  const source = read(`${clientDirectory('OpenClash')}/OpenClash(mihomo${variant === 'smart' ? '-smart' : ''}).sh`);
  const ruby = source.match(/^cat > "\$RUBY_SCRIPT" << 'RUBY_EOF'\r?\n([\s\S]*?)^RUBY_EOF\r?$/m);
  assert.ok(ruby, 'OpenClash Ruby processor is missing');
  const input = path.join(home, 'openclash-input.yaml');
  fs.writeFileSync(input, JSON.stringify(fixture));
  fs.writeFileSync(path.join(home, 'override.yaml'), extractOpenClashYaml(source));
  fs.writeFileSync(path.join(home, 'openclash.rb'), ruby[1]);
  const { healthCheckProfile, quicPolicy } = getTrafficOptions();
  run(process.env.RUBY_BIN || 'ruby', ['openclash.rb', 'openclash-input.yaml', 'override.yaml', 'openclash-status.txt',
    'off', '', healthCheckProfile, quicPolicy], home);
  return parseYaml(fs.readFileSync(input, 'utf8'));
}

function offlineConfiguration(config, home) {
  assert.ok(config.rules.length && Object.keys(config['rule-providers']).length, 'Complete routing fixture is required');
  const { proxies } = fixture;
  const providerFile = 'subscription-fixture.yaml';
  fs.writeFileSync(path.join(home, providerFile), JSON.stringify({ proxies }));
  const rulesDir = path.join(home, 'fused');
  fs.mkdirSync(rulesDir, { recursive: true });
  for (const provider of Object.values(config['rule-providers'])) {
    const repositoryFile = localPathForRepositoryRuleUrl(provider.url);
    assert.ok(repositoryFile, `Missing local rule asset: ${provider.url}`);
    provider.path = `./fused/${path.basename(repositoryFile)}`;
    fs.copyFileSync(repositoryFile, path.join(home, provider.path));
    provider.type = 'file';
    delete provider.url;
  }
  for (const provider of Object.values(config['proxy-providers'] || {})) {
    if (provider.type !== 'http') continue;
    provider.type = 'file';
    provider.path = providerFile;
    delete provider.url;
  }
  config['geo-auto-update'] = false;
  config['geox-url'] = Object.fromEntries(['geoip', 'mmdb', 'asn', 'geosite'].map(key => [key, `${offlineUrl}${key}`]));
  return config;
}

for (const [variant, envName, versionPattern] of [
  ['normal', 'MIHOMO_NATIVE_BIN', /Mihomo Meta v1\.19\./i],
  ['smart', 'MIHOMO_SMART_NATIVE_BIN', /Mihomo Meta alpha-smart-/i],
]) {
  test(`native Mihomo parses the ${variant} artifact configuration`, { skip: !Object.hasOwn(process.env, envName) }, t => {
    const binary = path.resolve(process.env[envName]);
    assert.ok(fs.statSync(binary).isFile(), `${envName} must point to a file`);
    assert.ok(process.env.MIHOMO_NATIVE_GEODATA, 'MIHOMO_NATIVE_GEODATA must contain local GeoIP.dat, GeoSite.dat and Country.mmdb fixtures');
    const geodata = path.resolve(process.env.MIHOMO_NATIVE_GEODATA);
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-mihomo-native-'));
    t.after(() => fs.rmSync(home, { recursive: true, force: true }));
    assert.match(run(binary, ['-v'], home), versionPattern);
    for (const name of ['GeoIP.dat', 'GeoSite.dat', 'Country.mmdb']) fs.copyFileSync(path.join(geodata, name), path.join(home, name));

    const configs = TARGETS.filter(target => (target.id === 'smart') === (variant === 'smart'))
      .map(target => [target.id, executeNode(read(target.file), fixture, target.file).output]);
    if (variant === 'normal') configs.push(['cmfa', parseYaml(read(`${clientDirectory('Clash Meta For Android')}/CMFA(mihomo).yaml`))]);
    configs.push([`openclash-${variant}`, openClashConfig(variant, home)]);

    for (const [name, config] of configs) {
      const file = `${name}.json`;
      fs.writeFileSync(path.join(home, file), JSON.stringify(offlineConfiguration(config, home)));
      assert.match(run(binary, ['-t', '-d', home, '-f', file], home), /test is successful/, name);
      t.diagnostic(`parsed ${name}`);
    }
  });
}
