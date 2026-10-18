#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_DIR = 'SubStore/edge-extension';
const REQUIRED_RUNTIME = ['page-main.bundle.js', 'page-bridge.bundle.js'];
const SCRIPT_RE = /(?:^|[;\n}]\s*)\s*(?:import\s+(?:[^'";]*?\s+from\s*)?|export\s+[^'";]*?\s+from\s*|import\s*\()(['"])(\.{1,2}\/[^'"]+)\1/gm;
const HTML_REF_RE = /(?:src|href)\s*=\s*(['"])(?![a-z]+:|#)([^'"]+)\1/gi;
const CSS_URL_RE = /url\(\s*(['"]?)(\.{1,2}\/[^)'"\s]+)\1\s*\)/gi;
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');

function fail(message) { throw new Error(message); }

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function parseArgs(argv) {
  let out;
  let ref = 'HEAD';
  let check = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out' || arg === '--ref') {
      const value = argv[++i];
      if (!value || value.startsWith('--')) fail(`${arg} requires a value`);
      if (arg === '--out') out = value;
      else ref = value;
    } else if (arg === '--check') check = true;
    else fail(`Unknown argument: ${arg}`);
  }
  if (!out || !path.isAbsolute(out)) fail('--out must be an absolute directory path');
  return { out: path.resolve(out), ref, check };
}

function git(args, encoding = 'utf8') {
  const result = spawnSync('git', args, { cwd: repo, encoding, maxBuffer: 32 * 1024 * 1024 });
  if (result.error) fail(`git failed: ${result.error.message}`);
  if (result.status !== 0) fail(`git ${args[0]} failed: ${String(result.stderr).trim()}`);
  return result.stdout;
}

function relativeTarget(from, specifier) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) fail(`Not a relative asset: ${specifier}`);
  const joined = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));
  if (joined === '..' || joined.startsWith('../') || path.posix.isAbsolute(joined)) fail(`Path escapes extension root: ${from} -> ${specifier}`);
  return joined;
}

function rootTarget(specifier) {
  if (!specifier || specifier.startsWith('/') || specifier.includes('\\')) fail(`Unsafe extension path: ${specifier}`);
  const normalized = path.posix.normalize(specifier);
  if (normalized === '..' || normalized.startsWith('../') || normalized.startsWith('.')) fail(`Path escapes extension root: ${specifier}`);
  return normalized;
}

function showFile(ref, relative) {
  const tree = git(['ls-tree', ref, `${SOURCE_DIR}/${relative}`]).trim();
  if (!tree) fail(`Missing source file at ${ref}:${SOURCE_DIR}/${relative}`);
  const mode = tree.split(/\s+/, 1)[0];
  if (mode !== '100644' && mode !== '100755') fail(`Refusing non-regular source file: ${relative}`);
  const bytes = spawnSync('git', ['show', `${ref}:${SOURCE_DIR}/${relative}`], { cwd: repo, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  if (bytes.error || bytes.status !== 0) fail(`Cannot read ${ref}:${SOURCE_DIR}/${relative}`);
  return bytes.stdout;
}

function textOf(buffer) { return buffer.toString('utf8'); }

function referencedFiles(relative, contents) {
  const text = textOf(contents);
  const refs = [];
  const matches = relative.endsWith('.html')
    ? [...text.matchAll(HTML_REF_RE)]
    : relative.endsWith('.css')
      ? [...text.matchAll(CSS_URL_RE)]
      : [...text.matchAll(SCRIPT_RE)];
  for (const match of matches) {
    const specifier = match[2];
    refs.push(relative.endsWith('.html') ? rootTarget(specifier) : relativeTarget(relative, specifier));
  }
  return refs;
}

function manifestRefs(manifest) {
  const refs = [];
  if (manifest.background?.service_worker) refs.push(rootTarget(manifest.background.service_worker));
  if (manifest.action?.default_popup) refs.push(rootTarget(manifest.action.default_popup));
  for (const item of manifest.content_scripts ?? []) refs.push(...(item.js ?? []).map(rootTarget), ...(item.css ?? []).map(rootTarget));
  for (const icon of Object.values(manifest.icons ?? {})) refs.push(rootTarget(icon));
  for (const icon of Object.values(manifest.action?.default_icon ?? {})) refs.push(rootTarget(icon));
  return refs;
}

async function verifyOutput(out, expectedNames) {
  let manifest;
  try { manifest = JSON.parse(await readFile(path.join(out, 'manifest.json'), 'utf8')); }
  catch (error) { fail(`Invalid or missing manifest.json: ${error.message}`); }
  const names = (await readdir(out)).sort();
  const expected = [...new Set(['manifest.json', ...expectedNames])].sort();
  if (JSON.stringify(names) !== JSON.stringify(expected)) fail(`Output contains unexpected or missing files. Expected: ${expected.join(', ')}; found: ${names.join(', ')}`);
  for (const name of names) {
    if (name.includes('/') || name.includes('\\') || name.startsWith('.')) fail(`Unsafe output entry: ${name}`);
    const info = await stat(path.join(out, name));
    if (!info.isFile()) fail(`Output entry is not a regular file: ${name}`);
  }
  return manifest;
}

async function main() {
  const { out, ref, check } = parseArgs(process.argv.slice(2));
  if (check) {
    const entries = await readdir(out);
    const manifest = JSON.parse(await readFile(path.join(out, 'manifest.json'), 'utf8'));
    const listed = new Set(entries);
    const todo = [...manifestRefs(manifest), ...REQUIRED_RUNTIME];
    const seen = new Set();
    while (todo.length) {
      const name = todo.pop();
      if (seen.has(name)) continue;
      seen.add(name);
      if (!listed.has(name)) fail(`Missing referenced runtime file: ${name}`);
      const data = await readFile(path.join(out, name));
      if (name.endsWith('.json')) {
        try { JSON.parse(textOf(data)); } catch (error) { fail(`Invalid JSON in ${name}: ${error.message}`); }
      }
      todo.push(...referencedFiles(name, data));
    }
    const names = [...seen].sort();
    await verifyOutput(out, names);
    console.log(`Package valid: ${names.length} files, manifest ${manifest.name} ${manifest.version}`);
    return;
  }

  const sources = new Map();
  const todo = ['manifest.json'];
  while (todo.length) {
    const name = todo.pop();
    if (sources.has(name)) continue;
    if (name.startsWith('test') || name.includes('.test.') || name.startsWith('dev') || name.startsWith('.')) fail(`Refusing non-runtime path: ${name}`);
    const data = showFile(ref, name);
    if (name.endsWith('.json')) {
      try { JSON.parse(textOf(data)); } catch (error) { fail(`Source JSON is invalid in ${name}: ${error.message}`); }
    }
    if (name === 'manifest.json') {
      let manifest;
      try { manifest = JSON.parse(textOf(data)); } catch (error) { fail(`Source manifest is invalid JSON: ${error.message}`); }
      todo.push(...manifestRefs(manifest));
    } else {
      todo.push(...referencedFiles(name, data));
    }
    sources.set(name, data);
  }
  for (const name of REQUIRED_RUNTIME) {
    if (!sources.has(name)) sources.set(name, showFile(ref, name));
  }

  let outExists = false;
  try { await stat(out); outExists = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (outExists) {
    let current;
    try { current = JSON.parse(await readFile(path.join(out, 'manifest.json'), 'utf8')); }
    catch { fail(`Output directory already exists without a valid manifest: ${out}`); }
    const sourceManifest = JSON.parse(textOf(sources.get('manifest.json')));
    if (current.name !== sourceManifest.name) fail(`Output directory belongs to a different extension (${current.name}); refusing update`);
    for (const entry of await readdir(out)) {
      const info = await stat(path.join(out, entry));
      if (!info.isFile()) fail(`Refusing to overwrite non-file output entry: ${entry}`);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupRoot = path.join(homedir(), 'Documents', 'Codex', localDate(), 'substore-extension-update', 'backups', timestamp);
  if (outExists) {
    for (const name of sources.keys()) {
      try {
        await stat(path.join(out, name));
        await mkdir(backupRoot, { recursive: true });
        await copyFile(path.join(out, name), path.join(backupRoot, name));
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  } else await mkdir(out, { recursive: true });

  for (const [name, data] of sources) {
    const destination = path.join(out, name);
    const temp = path.join(out, `.${name}.${process.pid}.tmp`);
    await writeFile(temp, data, { flag: 'wx' });
    try { await rename(temp, destination); }
    catch (error) { fail(`Atomic replacement failed for ${name}: ${error.message}`); }
  }
  const manifest = await verifyOutput(out, [...sources.keys()]);
  console.log(`Packaged ${manifest.name} ${manifest.version} from ${ref}: ${sources.size} files -> ${out}`);
  if (outExists) console.log(`Backups: ${backupRoot}`);
}

main().catch((error) => {
  console.error(`package: ${error.message}`);
  process.exitCode = 1;
});
