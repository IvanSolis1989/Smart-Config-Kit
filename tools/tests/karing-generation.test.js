'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const generatorPath = path.resolve(__dirname, '../generate-karing.js');

function api() {
  assert.ok(fs.existsSync(generatorPath), 'Karing generator must exist');
  return require(generatorPath);
}

function fixture(rules) {
  return {
    config: {
      outbounds: [
        { tag: 'DIRECT', type: 'direct' }, { tag: 'REJECT', type: 'block' },
        { tag: 'leaf', type: 'socks' },
        { tag: 'business', type: 'selector', default: 'leaf', outbounds: ['leaf', 'DIRECT'] },
        { tag: 'domestic', type: 'selector', default: 'nested', outbounds: ['nested'] },
        { tag: 'nested', type: 'selector', default: 'DIRECT', outbounds: ['DIRECT'] }
      ],
      route: {
        rules, final: 'business',
        rule_set: [{ tag: 'scki-fused-001-test', type: 'remote', format: 'binary', url: 'https://example.com/test.srs' }]
      }
    },
    fusedManifest: { baseline_version: 'v6.0.20', segments: [{ id: 'scki-fused-001-test', policy: 'business' }] },
    assetUrl: file => `https://example.com/${file}`,
    loadRuleSetSource: () => ({ version: 3, rules: [{ domain_suffix: ['example.com'] }] })
  };
}

test('preserves source order and distinct actions for repeated assets instead of merging by target', () => {
  const input = fixture([
    { rule_set: ['scki-fused-001-test'], action: 'route', outbound: 'business' },
    { rule_set: ['scki-fused-001-test'], action: 'route', outbound: 'domestic' },
    { rule_set: ['scki-fused-001-test'], action: 'reject' }
  ]);
  const { profile, manifest } = api().buildKaring(input);
  assert.deepEqual(profile.rules.map(rule => rule.outbound), ['currentSelected', 'direct', 'block']);
  assert.equal(new Set(profile.rules.map(rule => rule.name)).size, 3);
  assert.deepEqual(profile.rules.map(rule => rule.rule_set), Array(3).fill(['https://example.com/test.srs']));
  assert.deepEqual(manifest.mappings.map(rule => rule.source_rule_index), [0, 1, 2]);
  assert.deepEqual(manifest.mappings[1].outbound_path, ['domestic', 'nested', 'DIRECT']);
  assert.ok(profile.rules.every(rule => Object.keys(rule).sort().join() === 'name,or,outbound,rule_set,switch'));
});

test('compiles nested AND and NOT plus rule-set/port/network into a standard headless source asset', () => {
  const rule = {
    type: 'logical', mode: 'and', action: 'route', outbound: 'business', rules: [
      { rule_set: ['scki-fused-001-test'], port: [443], network: 'udp' },
      { type: 'logical', mode: 'or', invert: true, rules: [{ process_name: ['skip.exe'] }, { domain: ['skip.example'] }] }
    ]
  };
  const { profile, assets } = api().buildKaring(fixture([rule]));
  assert.equal(profile.rules.length, 1);
  const source = JSON.parse(Object.values(assets)[0]);
  assert.equal(source.version, 3);
  assert.equal(source.rules[0].type, 'logical');
  assert.equal(source.rules[0].mode, 'and');
  assert.deepEqual(source.rules[0].rules[1], { type: 'logical', mode: 'or', invert: true, rules: [{ process_name: ['skip.exe'] }, { domain: ['skip.example'] }] });
  const compiledText = JSON.stringify(source);
  assert.ok(compiledText.includes('example.com'));
  assert.ok(compiledText.includes('443') && compiledText.includes('udp'));
  assert.ok(!compiledText.includes('rule_set') && !compiledText.includes('outbound') && !compiledText.includes('action'));
  assert.ok(profile.rules[0].rule_set[0].endsWith('.json'));
});

test('records sniff and an empty FINAL for manual App settings without exporting catch-all rules', () => {
  const { profile, manifest } = api().buildKaring(fixture([
    { inbound: ['tun-in'], action: 'sniff' },
    { action: 'route', outbound: 'business' }
  ]));
  assert.equal(profile.rules.length, 0);
  assert.equal(manifest.omitted_operations[0].action, 'sniff');
  assert.equal(manifest.manual_final.outbound, 'currentSelected');
  assert.equal(manifest.client_validation.status, 'not-run');
});

test('fails closed on missing assets, bad outbounds, default cycles and unsupported matches', () => {
  const build = api().buildKaring;
  assert.throws(() => build(fixture([{ rule_set: ['missing'], outbound: 'business' }])), /missing.*rule.set/i);
  assert.throws(() => build(fixture([{ domain: ['a'], outbound: 'missing' }])), /missing.*outbound/i);
  const cycle = fixture([{ domain: ['a'], outbound: 'domestic' }]);
  cycle.config.outbounds.find(o => o.tag === 'nested').default = 'domestic';
  cycle.config.outbounds.find(o => o.tag === 'nested').outbounds = ['domestic'];
  assert.throws(() => build(cycle), /cycle/i);
  const noDefault = fixture([{ domain: ['a'], outbound: 'business' }]);
  delete noDefault.config.outbounds.find(o => o.tag === 'business').default;
  assert.throws(() => build(noDefault), /default/i);
  assert.throws(() => build(fixture([{ inbound: ['tun-in'], outbound: 'DIRECT' }])), /unsupported.*inbound/i);
  assert.throws(() => build(fixture([{ domain: ['a'], action: 'hijack-dns' }])), /unsupported.*action/i);
});

test('generation reads back deterministically and check mode detects drift without writing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-karing-'));
  try {
    const input = fixture([{ domain: ['example.com'], outbound: 'DIRECT' }]);
    const built = api().buildKaring(input);
    api().writeKaringOutputs(root, built);
    const filename = path.join(root, api().PROFILE_PATH);
    assert.deepEqual(JSON.parse(fs.readFileSync(filename, 'utf8')), built.profile);
    assert.deepEqual(api().checkKaringOutputs(root, built), []);
    const first = fs.readFileSync(filename);
    api().writeKaringOutputs(root, api().buildKaring(input));
    assert.deepEqual(fs.readFileSync(filename), first);
    fs.writeFileSync(filename, '{}\n');
    assert.ok(api().checkKaringOutputs(root, built).includes(api().PROFILE_PATH));
    assert.equal(fs.readFileSync(filename, 'utf8'), '{}\n');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('refuses a missing published local asset before reporting check success', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-karing-missing-'));
  try {
    const input = fixture([{ rule_set: ['scki-fused-001-test'], outbound: 'DIRECT' }]);
    input.config.route.rule_set[0].url = 'https://example.com/rulesets/generated/fused/sing-box/missing.srs';
    const files = {
      [api().CONFIG_PATH]: JSON.stringify(input.config),
      'rulesets/generated/fused/manifest.json': JSON.stringify(input.fusedManifest),
      'rulesets/source/routing-graph.js': '// fixture',
      'tools/generate-karing.js': '// fixture',
      'tools/client-layout.json': '{}'
    };
    for (const [relative, content] of Object.entries(files)) {
      const file = path.join(root, relative);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    }
    assert.throws(() => api().readInputs(root), /ENOENT.*missing\.srs/s);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('rejects unsupported native asset formats and unsafe nested matcher fields', () => {
  const input = fixture([{ rule_set: ['scki-fused-001-test'], outbound: 'DIRECT' }]);
  input.config.route.rule_set[0].url = 'https://example.com/test.mrs';
  assert.throws(() => api().buildKaring(input), /unsupported Karing rule-set URL/);
  assert.throws(() => api().buildKaring(fixture([{ type: 'logical', mode: 'and', rules: [{ domain: ['a'], inbound: ['tun'] }], outbound: 'DIRECT' }])), /unsupported match inbound/);
});

test('fails closed when rule-set field merging would differ from a simple AND expansion', () => {
  const input = fixture([{ rule_set: ['scki-fused-001-test'], domain: ['outer.example'], outbound: 'business' }]);
  assert.throws(() => api().buildKaring(input), /rule.set.*field.*merg/i);
});

test('LF and CRLF text inputs produce identical manifests while binary asset bytes retain distinct hashes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-karing-eol-'));
  try {
    const localBinary = 'rulesets/generated/fused/sing-box/scki-fused-001-test.srs';
    const localSource = localBinary.replace(/\.srs$/, '.json');
    const input = fixture([{ rule_set: ['scki-fused-001-test'], port: [443], outbound: 'DIRECT' }]);
    input.config.route.rule_set[0].url = `https://example.com/${localBinary}`;
    const json = value => JSON.stringify(value, null, 2) + '\n';
    const files = {
      [api().CONFIG_PATH]: json(input.config),
      'rulesets/generated/fused/manifest.json': json(input.fusedManifest),
      'rulesets/source/karing-support/manifest.json': json({ assets: [] }),
      'rulesets/source/routing-graph.js': '// fixture source\n// second line\n',
      'tools/generate-karing.js': '// fixture generator\n// second line\n',
      'tools/client-layout.json': json({ schema_version: 1 }),
      [localSource]: json({ version: 3, rules: [{ domain_suffix: ['example.com'] }] })
    };
    for (const [relative, content] of Object.entries(files)) {
      const file = path.join(root, relative);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    }
    const binary = Buffer.from([0x53, 0x52, 0x53, 0x02, 0x0d, 0x0a, 0x00, 0xff]);
    fs.writeFileSync(path.join(root, localBinary), binary);
    const lf = api().buildKaring(api().readInputs(root));
    for (const [relative, content] of Object.entries(files)) fs.writeFileSync(path.join(root, relative), content.replace(/\n/g, '\r\n'));
    const crlf = api().buildKaring(api().readInputs(root));
    assert.deepEqual(crlf, lf, 'checkout line endings must not change generated assets or manifest');
    const rawHash = crypto.createHash('sha256').update(binary).digest('hex');
    assert.equal(crlf.manifest.input_hashes[localBinary], rawHash);
    fs.writeFileSync(path.join(root, localBinary), Buffer.from([0x53, 0x52, 0x53, 0x02, 0x0a, 0x00, 0xff]));
    assert.notEqual(api().readInputs(root).inputHashes[localBinary], rawHash, 'binary CRLF bytes must never be canonicalized');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
