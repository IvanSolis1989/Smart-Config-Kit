'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const test = require('node:test');

const repository = path.resolve(__dirname, '../..');
const binary = process.env.MIHOMO_BIN || path.join(repository, '.cache/official-tools/mihomo-v1.19.32/expanded/mihomo-windows-amd64-compatible.exe');

function fixture(t) {
  if (!fs.existsSync(binary)) { t.skip('native Mihomo binary required'); return null; }
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mrs-publication-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'tools'), { recursive: true });
  fs.cpSync(path.join(repository, 'tools/lib'), path.join(root, 'tools/lib'), { recursive: true });
  fs.copyFileSync(path.join(repository, 'tools/sync-mihomo-mrs-rule-providers.js'), path.join(root, 'tools/sync-mihomo-mrs-rule-providers.js'));
  fs.mkdirSync(path.join(root, 'rulesets/source'), { recursive: true });
  fs.copyFileSync(path.join(repository, 'rulesets/source/upstream-sources.json'), path.join(root, 'rulesets/source/upstream-sources.json'));
  const graph = { 'rule-providers': { selected: { type: 'http', behavior: 'domain', format: 'yaml', url: 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/source/selected.yaml' } }, rules: ['RULE-SET,selected,DIRECT'] };
  fs.writeFileSync(path.join(root, 'rulesets/source/routing-graph.js'), `module.exports={SOURCE_GRAPH_ID:'fixture',getRawRoutingGraph:()=>(${JSON.stringify(graph)}),getMihomoNormalizedRoutingGraph:()=>(${JSON.stringify(graph)}),normalizeMihomoMrsProviderEntries:(_id,entries)=>entries};`);
  fs.writeFileSync(path.join(root, 'rulesets/source/selected.yaml'), 'payload:\n  - "+.selected.example"\n');
  const output = path.join(root, 'rulesets/generated/mihomo-mrs');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({ converted: [], split: [], partial: [], existing_mrs: [], retained: [], failed: [] }));
  fs.writeFileSync(path.join(output, 'source-ledger.json'), JSON.stringify({ provider_count: 0, providers: [] }));
  function inventory() {
    return Object.fromEntries(fs.readdirSync(output).sort().map(file => [file, createHash('sha256').update(fs.readFileSync(path.join(output, file))).digest('hex')]));
  }
  function run(receipt, preload) {
    return spawnSync(process.execPath, [...(preload ? ['--require', preload] : []), path.join(root, 'tools/sync-mihomo-mrs-rule-providers.js'), '--offline', '--mihomo-bin', binary, '--ids', 'selected', '--receipt-output', receipt], { cwd: root, encoding: 'utf8', timeout: 60000 });
  }
  return { root, output, inventory, run };
}

test('actual MRS CLI keeps the published ledger and assets unchanged when stage rename fails with a canonical custom receipt', t => {
  const f = fixture(t); if (!f) return;
  const before = f.inventory();
  const preload = path.join(f.root, 'fail-rename.cjs');
  fs.writeFileSync(preload, `const fs=require('node:fs');const rename=fs.renameSync;fs.renameSync=function(from,to){if(require('node:path').basename(from).startsWith('output-')&&require('node:path').basename(to)==='mihomo-mrs'){const e=new Error('injected stage rename failure');e.code='EACCES';throw e;}return rename.apply(this,arguments);};`);
  const result = f.run('rulesets/generated/mihomo-mrs/source-ledger.json', preload);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /injected stage rename failure/);
  assert.deepEqual(f.inventory(), before);
});

test('actual MRS CLI publishes the authoritative ledger and an identical additional receipt', t => {
  const f = fixture(t); if (!f) return;
  const result = f.run('.cache/custom-source-ledger.json');
  assert.equal(result.status, 0, result.stderr);
  const official = fs.readFileSync(path.join(f.output, 'source-ledger.json'));
  assert.deepEqual(fs.readFileSync(path.join(f.root, '.cache/custom-source-ledger.json')), official);
  assert.equal(JSON.parse(official).provider_count, 1);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.output, 'manifest.json'))).converted[0].id, 'selected');
  assert.ok(fs.statSync(path.join(f.output, 'selected.mrs')).size > 0);
});

test('actual MRS CLI rejects a custom receipt that would overwrite a published manifest', t => {
  const f = fixture(t); if (!f) return;
  const before = f.inventory();
  const result = f.run('rulesets/generated/mihomo-mrs/manifest.json');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must be source-ledger.json/);
  assert.deepEqual(f.inventory(), before);
});

test('actual MRS CLI reports successful publication separately from an additional receipt failure', t => {
  const f = fixture(t); if (!f) return;
  fs.mkdirSync(path.join(f.root, '.cache'), { recursive: true });
  fs.writeFileSync(path.join(f.root, '.cache/blocked'), 'a file, not a receipt directory');
  const result = f.run('.cache/blocked/receipt.json');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /MRS output published successfully, but additional receipt copy failed/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.output, 'source-ledger.json'))).provider_count, 1);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.output, 'manifest.json'))).converted[0].id, 'selected');
});
