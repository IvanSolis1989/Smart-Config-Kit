'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildConfigurationPages, verifyPagesOutput } = require('../build-configuration-pages');

const commit = 'a'.repeat(40);
function fixture(t, mode = 'check') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-pages-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'docs'));
  fs.mkdirSync(path.join(root, 'tools'));
  const source = Buffer.from('\ufeff<!doctype html>\r\n<title>本地配置</title>\r\n');
  fs.writeFileSync(path.join(root, 'docs/configuration.html'), source);
  fs.writeFileSync(path.join(root, 'expected.html'), source);
  const check = mode === 'mutate'
    ? "fs.appendFileSync(source, 'changed');"
    : "if (!fs.readFileSync(source).equals(fs.readFileSync(path.join(__dirname, '../expected.html')))) process.exitCode = 1;";
  fs.writeFileSync(path.join(root, 'tools/generate-configuration-form.js'), `'use strict';\r\nconst FORM_VERSION = '1.4.0';\r\nconst fs = require('node:fs'), path = require('node:path');\r\nconst source = path.join(__dirname, '../docs/configuration.html');\r\nif (process.argv.includes('--check')) { ${check} } else throw new Error('Only --check is permitted');\r\n`);
  return { root, source, outputDir: path.join(root, '.cache/configuration-pages'), commit };
}

test('package contains only exact source bytes, nojekyll and public build metadata', t => {
  const options = fixture(t);
  process.env.SCKI_PAGES_PRIVATE_TEST = 'must-not-be-published';
  try {
    const result = buildConfigurationPages(options);
    assert.deepEqual(fs.readdirSync(options.outputDir).sort(), ['.nojekyll', 'build-info.json', 'index.html']);
    assert.deepEqual(fs.readFileSync(path.join(options.outputDir, 'index.html')), options.source);
    assert.equal(fs.statSync(path.join(options.outputDir, '.nojekyll')).size, 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(options.outputDir, 'build-info.json'), 'utf8')), { schema_version: 1, form_version: '1.4.0', commit });
    assert.deepEqual(result.files, ['index.html', '.nojekyll', 'build-info.json']);
    assert.equal(fs.readFileSync(path.join(options.outputDir, 'build-info.json'), 'utf8').includes(process.env.SCKI_PAGES_PRIVATE_TEST), false);
  } finally { delete process.env.SCKI_PAGES_PRIVATE_TEST; }
});

test('stale saved HTML and a source changed by the checker never produce an artifact', t => {
  const stale = fixture(t);
  fs.appendFileSync(path.join(stale.root, 'docs/configuration.html'), 'stale');
  assert.throws(() => buildConfigurationPages(stale), /synchronization check failed/);
  assert.equal(fs.existsSync(stale.outputDir), false);
  const changing = fixture(t, 'mutate');
  assert.throws(() => buildConfigurationPages(changing), /changed during synchronization check/);
  assert.equal(fs.existsSync(changing.outputDir), false);
});

test('nonempty output and unexpected files are refused without changing their contents', t => {
  const options = fixture(t);
  fs.mkdirSync(options.outputDir, { recursive: true });
  fs.writeFileSync(path.join(options.outputDir, 'private.txt'), 'keep');
  assert.throws(() => buildConfigurationPages(options), /must be empty/);
  assert.equal(fs.readFileSync(path.join(options.outputDir, 'private.txt'), 'utf8'), 'keep');
  assert.throws(() => verifyPagesOutput(options.outputDir), /Unexpected Pages output/);
});

test('only a child of repository cache may be written and metadata cannot carry arbitrary values', t => {
  const options = fixture(t);
  for (const outputDir of [options.root, path.join(options.root, 'docs/site'), path.join(options.root, '.cache'), path.join(options.root, '../other-site')]) {
    assert.throws(() => buildConfigurationPages({ ...options, outputDir }), /inside .*\.cache/);
  }
  assert.throws(() => buildConfigurationPages({ ...options, commit: 'private arbitrary value' }), /40-character Git commit/);
  assert.equal(fs.existsSync(options.outputDir), false);
});

test('source and output directory junctions or symbolic links are refused', t => {
  const source = fixture(t);
  fs.renameSync(path.join(source.root, 'docs'), path.join(source.root, 'real-docs'));
  fs.symlinkSync(path.join(source.root, 'real-docs'), path.join(source.root, 'docs'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => buildConfigurationPages(source), /symbolic link/);
  const target = fixture(t);
  fs.mkdirSync(path.join(target.root, 'other'));
  fs.mkdirSync(path.join(target.root, '.cache'));
  fs.symlinkSync(path.join(target.root, 'other'), path.join(target.root, '.cache/linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => buildConfigurationPages({ ...target, outputDir: path.join(target.root, '.cache/linked/site') }), /symbolic link/);
  assert.deepEqual(fs.readdirSync(path.join(target.root, 'other')), []);
});

test('readback rejects any unexpected file or linked artifact', t => {
  const options = fixture(t);
  buildConfigurationPages(options);
  fs.writeFileSync(path.join(options.outputDir, 'unexpected.txt'), 'not public');
  assert.throws(() => verifyPagesOutput(options.outputDir), /Unexpected Pages output/);
  fs.unlinkSync(path.join(options.outputDir, 'unexpected.txt'));
  fs.mkdirSync(path.join(options.outputDir, 'extra'));
  assert.throws(() => verifyPagesOutput(options.outputDir), /Unexpected Pages output/);
  fs.rmdirSync(path.join(options.outputDir, 'extra'));
  fs.unlinkSync(path.join(options.outputDir, '.nojekyll'));
  fs.linkSync(path.join(options.root, 'expected.html'), path.join(options.outputDir, '.nojekyll'));
  assert.throws(() => verifyPagesOutput(options.outputDir), /Unexpected Pages output type/);
});

test('Pages workflow builds only main, validates saved HTML and uploads the allowlisted directory', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../../.github/workflows/deploy-configuration-pages.yml'), 'utf8');
  assert.match(workflow, /push:\s*\n\s+branches: \[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request|paths:|configure-pages|path: ['"]?\.['"]?\s*$/m);
  assert.match(workflow, /group: configuration-pages/);
  assert.match(workflow, /group: configuration-pages-\$\{\{ github\.ref \}\}/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /if: github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /permissions: \{\}/);
  assert.match(workflow, /build:[\s\S]*?permissions:\s*\n\s+contents: read/);
  assert.match(workflow, /deploy:[\s\S]*?needs: build[\s\S]*?permissions:\s*\n\s+pages: write\s*\n\s+id-token: write/);
  assert.match(workflow, /node-version: '22'/);
  assert.match(workflow, /ruby-version: '3\.3'/);
  assert.match(workflow, /node --test tools\/tests\/configuration-pages\.test\.js/);
  assert.match(workflow, /node tools\/build-configuration-pages\.js/);
  assert.match(workflow, /path: \.cache\/configuration-pages/);
  assert.match(workflow, /include-hidden-files: true/);
  assert.match(workflow, /environment:\s*\n\s+name: github-pages/);
  for (const action of ['actions/checkout', 'actions/setup-node', 'ruby/setup-ruby', 'actions/upload-pages-artifact', 'actions/deploy-pages']) {
    assert.match(workflow, new RegExp(action + '@[a-f0-9]{40} # v[0-9.]+'));
  }
});
