'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const { readFrozenMrsInput } = require('../lib/frozen-mrs-input');
const { sha256 } = require('../lib/source-provenance');

test('published MRS recovery binds provider inventory and independently verifies decoded predicates', t => {
  const binary = process.env.SCKI_MIHOMO_BIN || process.env.MIHOMO_BIN;
  if (!binary || !fs.existsSync(binary)) return t.skip('native converter required; also checked by the actual 355-file integration roundtrip');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frozen-mrs-native-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = args => execFileSync('git', ['-c', 'core.safecrlf=false', ...args], { cwd: root, encoding: 'utf8', windowsHide: true });
  const output = path.join(root, 'rulesets/generated/mihomo-mrs');
  fs.mkdirSync(output, { recursive: true });
  fs.mkdirSync(path.join(root, '.cache'), { recursive: true });
  const providers = [
    { id: 'acc-apple', source_url: 'https://example.test/apple.list', behavior: 'domain', payload: 'example.com\n+.suffix.test\n.child.test\n*.wild.test\n', decoded: 'DOMAIN,example.com\nDOMAIN-SUFFIX,suffix.test\nDOMAIN-WILDCARD,*.child.test\nDOMAIN-WILDCARD,*.wild.test\nPROCESS-NAME,Sample\nIP-CIDR,192.0.2.0/24,no-resolve\n' },
    { id: '56', source_url: 'https://example.test/56.list', behavior: 'domain', payload: '56.com\n', decoded: 'DOMAIN,56.com\n' },
    { id: 'address', source_url: 'https://example.test/ip.list', behavior: 'ipcidr', payload: '192.0.2.0/24\n2001:db8::/32\n', decoded: 'IP-CIDR,192.0.2.0/24\nIP-CIDR6,2001:db8::/32\n' },
  ];
  const rows = [];
  for (const provider of providers) {
    const source = path.join(root, '.cache', provider.id + '.txt');
    fs.writeFileSync(source, provider.payload);
    execFileSync(binary, ['convert-ruleset', provider.behavior, 'text', source, path.join(output, provider.id + '.mrs')], { windowsHide: true });
    const row = { id: provider.id, source_url: provider.source_url, source_behavior: provider.behavior, source_format: 'text', generated: [{ file: provider.id + '.mrs', behavior: provider.behavior }] };
    if (provider.id === 'acc-apple') {
      row.residual = { file: provider.id + '-classical.yaml' };
      fs.writeFileSync(path.join(output, row.residual.file), 'payload:\n  - "PROCESS-NAME,Sample"\n  - "IP-CIDR,192.0.2.0/24,no-resolve"\n');
    }
    rows.push(row);
  }
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({ converted: rows.filter(row => !row.residual), split: [], partial: rows.filter(row => row.residual) }));
  git(['init', '-q']);
  git(['add', '--', 'rulesets']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'native fixture']);
  const baseline = git(['rev-parse', 'HEAD']).trim();
  const snapshot = { schema_version: 1, baseline_ref: baseline, providers: {} };
  for (const provider of providers) {
    const row = rows.find(item => item.id === provider.id);
    const file = '.cache/' + provider.id + '.list';
    fs.writeFileSync(path.join(root, file), provider.decoded);
    const bytes = Buffer.from(provider.decoded);
    snapshot.providers[provider.id] = { requested_url: provider.source_url, decoded_file: file, decoded_sha256: sha256(bytes), decoded_bytes: bytes.length, origin_files: [...row.generated, ...(row.residual ? [row.residual] : [])].map(asset => ({ path: 'rulesets/generated/mihomo-mrs/' + asset.file, sha256: sha256(fs.readFileSync(path.join(output, asset.file))) })) };
  }
  const manifestPath = path.join(root, '.cache/inputs.json');
  const run = (value, current = {}) => {
    fs.writeFileSync(manifestPath, JSON.stringify(value));
    return readFrozenMrsInput({ repoRoot: root, manifestPath, providerId: 'acc-apple', requestedUrl: providers[0].source_url, mihomoBin: binary, sourceBehavior: 'domain', sourceFormat: 'text', ...current });
  };
  const accepted = run(snapshot);
  assert.equal(accepted.receipt.source.resolved_commit, null);
  assert.equal(accepted.receipt.source.version_state, 'legacy-output-only');
  assert.match(accepted.text, /IP-CIDR,192\.0\.2\.0\/24,no-resolve/);
  const wrongOrigin = structuredClone(snapshot);
  wrongOrigin.providers['acc-apple'] = { ...wrongOrigin.providers['56'], requested_url: providers[0].source_url };
  assert.throws(() => run(wrongOrigin), /origin inventory/);
  const wrongDecode = structuredClone(snapshot);
  Object.assign(wrongDecode.providers['acc-apple'], { decoded_file: wrongDecode.providers['56'].decoded_file, decoded_sha256: wrongDecode.providers['56'].decoded_sha256, decoded_bytes: wrongDecode.providers['56'].decoded_bytes });
  assert.throws(() => run(wrongDecode), /decoded predicates/);
  const missingResidual = structuredClone(snapshot);
  missingResidual.providers['acc-apple'].origin_files.pop();
  assert.throws(() => run(missingResidual), /origin inventory/);
  assert.throws(() => run(snapshot, { sourceBehavior: 'ipcidr' }), /behavior/);
  assert.throws(() => run(snapshot, { sourceFormat: 'yaml' }), /format/);
});
