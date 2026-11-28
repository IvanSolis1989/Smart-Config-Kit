'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repo = path.resolve(__dirname, '../..');
const fixtureSegment = 'scki-fused-001-direct';
const secondSegment = 'scki-fused-002-proxy';

function createFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-xray-fallback-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  function write(file, text) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text, 'utf8');
    return target;
  }
  for (const file of [
    'tools/generate-fused-fallback-artifacts.js',
    'tools/lib/generated-asset-url.js',
    'tools/lib/write-repository-artifact.js',
  ]) {
    write(file, fs.readFileSync(path.join(repo, file), 'utf8'));
  }

  write('rulesets/source/routing-graph.js', "module.exports = { SOURCE_REPOSITORY_ASSET_BASE: 'https://raw.githubusercontent.com/example/fixture/main' };");
  const segments = [
    { id: fixtureSegment, policy: 'DIRECT' },
    { id: secondSegment, policy: 'PROXY' },
  ].map((segment) => ({
    ...segment,
    files: { sing_box: { source: `${segment.id}.json`, file: `${segment.id}.srs`, format: 'binary' } },
  }));
  write('rulesets/generated/fused/manifest.json', JSON.stringify({
    baseline_version: 'v6.0.0', asset_revision: 'v6.0.0', segment_count: segments.length, segments,
  }));
  const fusedRules = [
    `RULE-SET,${fixtureSegment}-domain,DIRECT`,
    `RULE-SET,${fixtureSegment}-ipcidr,DIRECT`,
    'DST-PORT,53,DIRECT',
    `RULE-SET,${secondSegment}-domain,PROXY`,
    'MATCH,PROXY',
  ];
  write('Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js',
    `const MIHOMO_FUSED_RULES = ${JSON.stringify(fusedRules)}\n`);
  const writeSource = (segment, rules) => write(
    `rulesets/generated/fused/sing-box/${segment}.json`, JSON.stringify({ version: 3, rules }),
  );
  writeSource(secondSegment, [{ domain: ['second.example'] }]);
  const output = write('Xray内核系/v2rayN/v2rayN(xray).json', 'existing output\n');
  const { generateFusedFallbackArtifacts } = require(path.join(root, 'tools/generate-fused-fallback-artifacts.js'));
  return { root, writeSource, output, generate: () => generateFusedFallbackArtifacts({ quiet: true }) };
}

test('supported sing-box OR rows preserve the v2rayN GUI rows and values', (t) => {
  const { writeSource, output, generate } = createFixture(t);
  writeSource(fixtureSegment, [
    { domain: ['service.example'], domain_suffix: ['example.net'], ip_cidr: ['192.0.2.0/24'] },
    { type: 'default', invert: false, process_name: ['Example.exe'] },
    { process_path: ['/usr/bin/example'] },
    { domain_keyword: ['keyword'], domain_regex: ['^local\\.example$'], ip_cidr: ['2001:db8::/32'] },
  ]);
  assert.deepEqual(generate().xray, { ruleCount: 5, emittedSegments: 2 });
  const [meta, first, port, second, final] = JSON.parse(fs.readFileSync(output, 'utf8'));
  assert.deepEqual([meta.id, first.id, port.id, second.id, final.id], [
    'scki-000-meta', fixtureSegment, 'scki-inline-001-port-53', secondSegment, 'scki-inline-final',
  ]);
  assert.equal(meta.enabled, false);
  assert.equal(first.outboundTag, 'direct');
  assert.deepEqual(first.domain, ['full:service.example', 'domain:example.net', 'keyword:keyword', 'regexp:^local\\.example$']);
  assert.deepEqual(first.ip, ['192.0.2.0/24', '2001:db8::/32']);
  assert.deepEqual(first.process, ['Example.exe', '/usr/bin/example']);
});

test('unrepresentable headless rows fail without replacing the existing v2rayN file', (t) => {
  const { writeSource, output, generate } = createFixture(t);
  writeSource(fixtureSegment, [{ domain: ['first.example'] }]);
  const cases = [
    [{ domain: ['wrong.example'], process_name: ['Example.exe'] }, /single non-empty matching dimension/],
    [{ process_name: ['Example.exe'], process_path: ['/usr/bin/example'] }, /single non-empty matching dimension/],
    [{ type: 'logical', mode: 'and', rules: [{ domain: ['wrong.example'] }] }, /non-inverted default rule/],
    [{ domain: ['wrong.example'], invert: true }, /non-inverted default rule/],
    [{ source_ip_cidr: ['198.51.100.0/24'] }, /cannot preserve source_ip_cidr/],
    [{ process_path_regex: ['example'] }, /cannot preserve process_path_regex/],
    [{ domain: [] }, /single non-empty matching dimension/],
  ];
  for (const [row, reason] of cases) {
    writeSource(secondSegment, [row]);
    assert.throws(generate, reason);
    assert.equal(fs.readFileSync(output, 'utf8'), 'existing output\n');
    assert.deepEqual(fs.readdirSync(path.dirname(output)), ['v2rayN(xray).json']);
  }
});


test('Passwall and Passwall2 retain the asset revision and a literal SRS suffix in every output', (t) => {
  const { root, writeSource, generate } = createFixture(t);
  writeSource(fixtureSegment, [{ ip_cidr: ['192.0.2.0/24'] }]);
  generate();
  const expected = 'https://raw.githubusercontent.com/example/fixture/main/rulesets/generated/fused/sing-box/scki-fused-001-direct.srs?scki=v6.0.0&format=.srs';
  for (const app of ['Passwall', 'Passwall2']) {
    const dir = path.join(root, '双内核系', app);
    const list = fs.readFileSync(path.join(dir, 'shunt-rules', fixtureSegment + '.list'), 'utf8');
    const conf = fs.readFileSync(path.join(dir, app + '(xray+sing-box).conf'), 'utf8');
    const script = fs.readFileSync(path.join(dir, app + '(xray+sing-box)-apply.sh'), 'utf8');
    assert.ok(list.split('\n').includes('rule-set:remote:' + expected));
    assert.ok(conf.split('\n').includes('rule-set:remote:' + expected));
    assert.ok(script.includes("'" + expected + "'"));
  }
  const shared = fs.readFileSync(path.join(root, 'rulesets/generated/fused/passwall', fixtureSegment + '.list'), 'utf8');
  assert.ok(shared.split('\n').includes('rule-set:remote:' + expected));
});
