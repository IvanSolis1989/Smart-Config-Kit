'use strict';

// Publish only the already verified, self-contained form. No repository directory
// is ever used as the Pages artifact root.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const FILES = Object.freeze(['index.html', '.nojekyll', 'build-info.json']);

function assertNoSymlinks(target) {
  const absolute = path.resolve(target);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  for (const part of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    let stat;
    try { stat = fs.lstatSync(current); } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`Pages paths must not contain a symbolic link: ${current}`);
  }
}

function assertOutputPath(root, outputDir) {
  const cache = path.join(root, '.cache');
  const relative = path.relative(cache, outputDir);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Pages output must be inside a child directory of repository .cache');
  }
  assertNoSymlinks(outputDir);
  if (fs.existsSync(outputDir)) {
    if (!fs.lstatSync(outputDir).isDirectory()) throw new Error('Pages output must be a directory');
    if (fs.readdirSync(outputDir).length) throw new Error('Pages output directory must be empty; existing files are never overwritten');
  }
}

function readRegularFile(filename) {
  assertNoSymlinks(filename);
  if (!fs.lstatSync(filename).isFile()) throw new Error(`Pages source must be a regular file: ${filename}`);
  return fs.readFileSync(filename);
}

function verifyPagesOutput(outputDir, expected = {}) {
  assertNoSymlinks(outputDir);
  const entries = fs.readdirSync(outputDir).sort();
  if (entries.length !== FILES.length || entries.some((entry, index) => entry !== [...FILES].sort()[index])) {
    throw new Error('Unexpected Pages output: only index.html, .nojekyll and build-info.json are permitted');
  }
  for (const entry of FILES) {
    const filename = path.join(outputDir, entry);
    const stat = fs.lstatSync(filename);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) throw new Error(`Unexpected Pages output type: ${entry}`);
  }
  if (fs.statSync(path.join(outputDir, '.nojekyll')).size !== 0) throw new Error('Pages .nojekyll must be empty');
  const metadata = JSON.parse(fs.readFileSync(path.join(outputDir, 'build-info.json'), 'utf8'));
  if (JSON.stringify(Object.keys(metadata).sort()) !== JSON.stringify(['commit', 'form_version', 'schema_version'])
      || metadata.schema_version !== 1 || !/^\d+\.\d+\.\d+$/.test(metadata.form_version)
      || !/^[a-f0-9]{40}$/.test(metadata.commit)) throw new Error('Pages metadata must contain only public form version and commit');
  if (expected.source && !fs.readFileSync(path.join(outputDir, 'index.html')).equals(expected.source)) throw new Error('Pages index.html failed exact-byte readback');
  if (expected.metadata && JSON.stringify(metadata) !== JSON.stringify(expected.metadata)) throw new Error('Pages build metadata failed readback');
  return { files: [...FILES], metadata };
}

function buildConfigurationPages(options = {}) {
  const root = path.resolve(options.root || ROOT);
  const outputDir = path.resolve(root, options.outputDir || '.cache/configuration-pages');
  assertNoSymlinks(root);
  assertOutputPath(root, outputDir);
  const commit = options.commit === undefined
    ? execFileSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true }).trim()
    : options.commit;
  if (typeof commit !== 'string' || !/^[a-f0-9]{40}$/i.test(commit)) throw new Error('Pages metadata requires a 40-character Git commit');
  const sourcePath = path.join(root, 'docs/configuration.html');
  const generatorPath = path.join(root, 'tools/generate-configuration-form.js');
  const source = readRegularFile(sourcePath);
  const generator = readRegularFile(generatorPath);
  const version = generator.toString('utf8').match(/^const FORM_VERSION = '(\d+\.\d+\.\d+)';\r?$/m);
  if (!version) throw new Error('Cannot read the public configuration form version');
  try {
    execFileSync(process.execPath, [generatorPath, '--check'], { cwd: root, windowsHide: true, maxBuffer: 1024 * 1024 });
  } catch (error) {
    const detail = `${error.stderr || ''}${error.stdout || ''}`.trim().slice(0, 2000);
    throw new Error(`Configuration form synchronization check failed${detail ? `: ${detail}` : ''}`);
  }
  if (!readRegularFile(sourcePath).equals(source) || !readRegularFile(generatorPath).equals(generator)) {
    throw new Error('Configuration form source changed during synchronization check');
  }
  const metadata = { schema_version: 1, form_version: version[1], commit: commit.toLowerCase() };
  // Recheck before mkdir/write; wx additionally refuses files introduced by a
  // concurrent writer. Nothing in an existing output directory is removed.
  assertOutputPath(root, outputDir);
  fs.mkdirSync(outputDir, { recursive: true });
  assertOutputPath(root, outputDir);
  fs.writeFileSync(path.join(outputDir, 'index.html'), source, { flag: 'wx' });
  fs.writeFileSync(path.join(outputDir, '.nojekyll'), '', { flag: 'wx' });
  fs.writeFileSync(path.join(outputDir, 'build-info.json'), `${JSON.stringify(metadata, null, 2)}\n`, { flag: 'wx' });
  return { outputDir, ...verifyPagesOutput(outputDir, { source, metadata }) };
}

function main(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--output-dir' || argument === '--commit') {
      const key = argument === '--output-dir' ? 'outputDir' : 'commit';
      if (options[key] !== undefined || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`Missing or duplicate ${argument}`);
      options[key] = args[++index];
    } else throw new Error(`Unknown Pages build argument: ${argument}`);
  }
  const result = buildConfigurationPages(options);
  console.log(`Verified configuration form v${result.metadata.form_version} at ${result.metadata.commit}`);
  console.log(`Pages artifact: ${result.outputDir} (${result.files.join(', ')})`);
}

module.exports = { buildConfigurationPages, verifyPagesOutput };
if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
