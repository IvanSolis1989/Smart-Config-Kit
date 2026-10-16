'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const graph = require('../../rulesets/source/routing-graph.js');
const { prepareUpdates, replaceMarked } = require('../sync-traffic-options.js');

const root = path.resolve(__dirname, '../..');
const targets = [
  ['Clash Party/ClashParty(mihomo-smart).js', 'smart'],
  ['Clash Party/ClashParty(mihomo).js', 'url-test'],
  ['FlClash/FlClash(mihomo).js', 'url-test'],
];
const five = graph.getQuicRules('block-foreign');
const ids = require('../lib/fused-contract-segments').resolveContractSegments();

function run(target, profile, policy) {
  let source = fs.readFileSync(path.join(root, target), 'utf8');
  source = source.replace(/const SCKI_HEALTH_CHECK_PROFILE = '[^']*'/, `const SCKI_HEALTH_CHECK_PROFILE = '${profile}'`)
    .replace(/const SCKI_QUIC_POLICY = '[^']*'/, `const SCKI_QUIC_POLICY = '${policy}'`);
  const messages = [];
  const sandbox = { console: { log: (...args) => messages.push(args.join(' ')), error: (...args) => messages.push(args.join(' ')) } };
  vm.createContext(sandbox);
  vm.runInContext(`${source}\nthis.__main = main`, sandbox, { filename: target, timeout: 15000 });
  const config = { proxies: [{ name: 'HK Node', type: 'ss', server: 'example.invalid', port: 443, cipher: 'aes-128-gcm', password: 'x' }], 'proxy-groups': [], rules: [] };
  const before = structuredClone(config);
  const result = sandbox.__main(config);
  return { config, before, result, messages: messages.join('\n') };
}

test('source options and QUIC authority retain baseline order', () => {
  const configured = JSON.parse(fs.readFileSync(path.join(root, 'rulesets/source/traffic-options.json'), 'utf8'));
  assert.deepEqual(graph.getTrafficOptions(), configured);
  assert.equal(graph.validateTrafficOptions(configured), configured);
  assert.equal(five.length, 5);
  const rules = graph.buildMihomoRoutingGraph({ quicPolicy: 'block-foreign' }).rules;
  const quicStart = rules.indexOf(five[0]);
  assert.ok(quicStart > rules.indexOf('RULE-SET,anti-ad,🛑 广告拦截'));
  assert.deepEqual(rules.slice(quicStart, quicStart + five.length), five);
  assert.ok(quicStart < rules.indexOf('GEOIP,private,DIRECT,no-resolve'));
  const following = graph.buildMihomoRoutingGraph({ quicPolicy: 'follow-rules' }).rules;
  assert.ok(five.every(rule => !following.includes(rule)));
  assert.throws(() => graph.buildMihomoRoutingGraph({ quicPolicy: 'unknown' }), /Invalid QUIC policy/);
});

test('source health profiles keep the selected interval with lazy checks in both modes', () => {
  assert.deepEqual(graph.getHealthCheckSettings('standard'), { intervalSeconds: 300, lazy: true });
  assert.deepEqual(graph.getHealthCheckSettings('power-save'), { intervalSeconds: 900, lazy: true });
  assert.deepEqual(graph.getHealthCheckSettings(), graph.getHealthCheckSettings(graph.getTrafficOptions().healthCheckProfile));
  assert.throws(() => graph.getHealthCheckSettings('unknown'), /Invalid health check profile/);
});

for (const [target, groupType] of targets) {
  for (const profile of ['standard', 'power-save']) {
    for (const policy of ['block-foreign', 'follow-rules']) {
      test(`${target}: ${profile} + ${policy}`, () => {
        const { config, result } = run(target, profile, policy);
        assert.equal(result, config);
        const groups = config['proxy-groups'].filter(group => group.type === groupType);
        assert.ok(groups.length > 0);
        assert.ok(groups.every(group => group.interval === (profile === 'power-save' ? 900 : 300)));
        assert.ok(groups.every(group => group.lazy === true));
        for (const rule of five) assert.equal(config.rules.includes(rule), policy === 'block-foreign');
        assert.ok(config.rules.indexOf(`RULE-SET,${ids['scki-fused-006-ad']}-domain,🛑 广告拦截`) < config.rules.indexOf('DST-PORT,7680,REJECT'));
        assert.ok(config.rules.indexOf('DST-PORT,7680,REJECT') < config.rules.indexOf(`RULE-SET,${ids['scki-fused-008-direct']}-domain,DIRECT`));
      });
    }
  }
  test(`${target}: invalid local values reject before mutation`, () => {
    for (const [profile, policy] of [['unknown', 'block-foreign'], ['standard', 'unknown']]) {
      const { config, before, messages } = run(target, profile, policy);
      assert.deepEqual(config, before);
      assert.match(messages, /Invalid SCKI traffic options/);
    }
  });
}

test('embedded runtime is synchronized with the source graph', () => {
  execFileSync(process.execPath, ['tools/sync-traffic-options.js', '--check'], { cwd: root, stdio: 'pipe' });
});

for (const [label, eol] of [['LF', '\n'], ['CRLF', '\r\n']]) {
  for (const [ending, suffix] of [
    ['following line and final newline', eol + 'after' + eol],
    ['blank lines and following text', eol + eol + 'after' + eol + eol],
    ['following text without final newline', eol + 'after'],
    ['closing marker at EOF', ''],
  ]) {
    test(`replaceMarked ${label}: preserves ${ending} byte for byte`, () => {
      const begin = '// BEGIN';
      const end = '// END';
      const prefix = 'before' + eol;
      const source = prefix + [begin, 'old body', end].join(eol) + suffix;
      const block = [begin, 'new body', end].join(eol);
      const expected = prefix + block + suffix;
      const updated = replaceMarked(source, begin, end, block, 'fixture');
      assert.deepEqual(Buffer.from(updated), Buffer.from(expected));
      assert.deepEqual(Buffer.from(replaceMarked(updated, begin, end, block, 'fixture')), Buffer.from(updated));
    });
  }

  function makeSources() {
    const files = ['tools/runtime/traffic-options.js', ...targets.map(([file]) => file)];
    return new Map(files.map(file => {
      const filename = path.join(root, file);
      // Derive platform-independent inputs; generated outputs are compared without normalization.
      const input = fs.readFileSync(filename, 'utf8').replace(/\r\n/g, '\n').replace(/\n/g, eol);
      return [filename, input];
    }));
  }

  function readFrom(sources) {
    return (filename, encoding) => {
      assert.equal(encoding, 'utf8');
      assert.ok(sources.has(filename), 'synchronizer reads only the runtime and three JS fixtures');
      return sources.get(filename);
    };
  }

  test(`prepareUpdates ${label}: synchronized runtime and three adapters need zero byte changes`, () => {
    const sources = makeSources();
    const updates = prepareUpdates(graph.getTrafficOptions(), readFrom(sources));
    assert.equal(updates.length, sources.size);
    for (const update of updates) {
      assert.equal(update.original, sources.get(update.file));
      assert.ok(update.original === update.updated, `${path.relative(root, update.file)} stays byte-identical`);
    }
  });

  test(`prepareUpdates ${label}: full generation preserves line endings and is byte-stable`, () => {
    const expected = makeSources();
    const sources = new Map(Array.from(expected, ([filename, source]) => {
      const stale = source.replace(/var HEALTH_CHECK_PROFILES = [^\r\n]+/, 'var HEALTH_CHECK_PROFILES = {};');
      assert.notEqual(stale, source, 'fixture contains a stale health-check block');
      return [filename, stale];
    }));
    const updates = prepareUpdates(graph.getTrafficOptions(), readFrom(sources));
    assert.equal(updates.length, expected.size);
    for (const update of updates) {
      const file = path.relative(root, update.file);
      assert.ok(update.original !== update.updated, `${file} receives the regenerated block`);
      assert.doesNotMatch(update.updated, label === 'CRLF' ? /(?<!\r)\n|\r(?!\n)/ : /\r/, `${file} keeps ${label} throughout`);
      assert.ok(update.updated === expected.get(update.file), `${file} regenerates the complete expected bytes`);
    }
    const synced = new Map(updates.map(update => [update.file, update.updated]));
    const repeated = prepareUpdates(graph.getTrafficOptions(), readFrom(synced));
    assert.equal(repeated.length, synced.size);
    for (const update of repeated) {
      assert.equal(update.original, synced.get(update.file));
      assert.ok(update.original === update.updated, `${path.relative(root, update.file)} second generation changes zero bytes`);
    }
  });
}
