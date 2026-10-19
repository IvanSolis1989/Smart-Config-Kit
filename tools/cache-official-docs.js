#!/usr/bin/env node
'use strict';

// Official documentation snapshot tool v1.0.0. Bodies retain exact downloaded
// bytes inside gzip; receipts reuse the repository's source-provenance contract.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { createSourceReceipt, assertReceiptMatches, sha256 } = require('./lib/source-provenance');

const VERSION = '1.0.0';
const ROOT = path.resolve(__dirname, '..');
const LIMIT = 20 * 1024 * 1024;
const slug = /^[a-z0-9][a-z0-9-]*$/;
const execFileAsync = promisify(execFile);
const inventoryHash = directory => sha256(Buffer.from(fs.readFileSync(path.join(directory, 'sources.json'), 'utf8').replace(/\r\n/g, '\n'), 'utf8'));

// gh uses the user's existing credential store; credentials never enter this
// process or the receipt. Only public GitHub API URLs use this opt-in transport.
async function githubCliFetch(url, options) {
  const parsed = new URL(url);
  if (parsed.origin !== 'https://api.github.com') return fetch(url, options);
  let output;
  try {
    output = (await execFileAsync('gh', ['api', '--include', '--method', 'GET', `${parsed.pathname}${parsed.search}`],
      { encoding: 'buffer', maxBuffer: LIMIT + 512 * 1024, timeout: 45000, windowsHide: true })).stdout;
  } catch (error) {
    if (!error.stdout?.length) throw new Error('GitHub CLI API request failed');
    output = error.stdout;
  }
  const match = /\r?\n\r?\n/.exec(output.toString('utf8', 0, Math.min(output.length, 65536)));
  if (!match) throw new Error('GitHub CLI response has no HTTP headers');
  const headerText = output.subarray(0, match.index).toString('utf8');
  const status = /^HTTP\/[\d.]+ (\d+)/.exec(headerText)?.[1];
  if (!status) throw new Error('GitHub CLI response has no HTTP status');
  const headers = new Headers();
  for (const line of headerText.split(/\r?\n/).slice(1)) {
    const colon = line.indexOf(':');
    if (colon > 0) headers.append(line.slice(0, colon), line.slice(colon + 1).trim());
  }
  return new Response(output.subarray(match.index + match[0].length), { status: Number(status), headers });
}

function inside(root, relative) {
  const result = path.resolve(root, relative);
  const rel = path.relative(root, result);
  if (!rel || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`Path outside snapshot: ${relative}`);
  }
  return result;
}

function readSources(directory) {
  const config = JSON.parse(fs.readFileSync(path.join(directory, 'sources.json'), 'utf8').replace(/^\uFEFF/, ''));
  if (!slug.test(config.group) || !Array.isArray(config.sources) || !config.sources.length) throw new Error('Invalid source inventory');
  const ids = new Set();
  for (const source of config.sources) {
    if (!slug.test(source.id) || ids.has(source.id) || !source.product) throw new Error(`Invalid/duplicate source: ${source.id}`);
    ids.add(source.id);
    const url = new URL(source.url);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`Public HTTPS source required: ${source.id}`);
    if (!['release', 'documentation', 'source'].includes(source.kind)) throw new Error(`Invalid kind: ${source.id}`);
  }
  return config;
}

function validateBody(source, bytes, type = '') {
  if (!bytes.length || bytes.length > LIMIT) throw new Error(`Invalid body length: ${bytes.length}`);
  const text = bytes.toString('utf8').replace(/^\uFEFF/, '');
  const html = /^\s*(?:<!doctype html|<html)/i.test(text);
  if (source.expected_content_type === 'json') JSON.parse(text);
  if (source.expected_content_type === 'html' && !/html/i.test(type) && !html) throw new Error('Expected HTML');
  if (source.expected_content_type === 'text' && html) throw new Error('HTML returned for a text source');
  if (html && /<title>\s*(?:Just a moment|Access denied|Attention Required|Sign in)/i.test(text)) throw new Error('Challenge/sign-in page returned');
}

function headersObject(response) {
  return Object.fromEntries(['content-type', 'etag', 'last-modified', 'date', 'x-ratelimit-remaining']
    .map(key => [key, response.headers.get(key)]).filter(([, value]) => value));
}

async function responseBytes(response) {
  if (Number(response.headers.get('content-length')) > LIMIT) throw new Error('Response exceeds 20 MiB');
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > LIMIT) throw new Error('Response exceeds 20 MiB');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const resolvedRefs = new Map();
async function pinnedUrl(url, fetchImpl) {
  const parsed = new URL(url);
  const match = parsed.hostname === 'raw.githubusercontent.com' && /^\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/.exec(parsed.pathname);
  if (!match || /^[a-f0-9]{40}$/i.test(match[3])) return url;
  const [, owner, repo, ref, file] = match;
  const key = `${owner}/${repo}/${ref}`;
  if (!resolvedRefs.has(key)) resolvedRefs.set(key, (async () => {
    const response = await fetchImpl(`https://api.github.com/repos/${owner}/${repo}/commits/${ref}`, {
      headers: { 'user-agent': `Smart-Config-Kit-Docs/${VERSION}`, accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Cannot pin ${key}: HTTP ${response.status}`);
    const result = JSON.parse((await responseBytes(response)).toString('utf8'));
    if (!/^[a-f0-9]{40}$/i.test(result.sha)) throw new Error(`No commit for ${key}`);
    return result.sha;
  })());
  return `https://raw.githubusercontent.com/${owner}/${repo}/${await resolvedRefs.get(key)}/${file}`;
}

function verifyRecord(directory, source, record) {
  if (!record || record.status !== 'ok' || record.url !== source.url || record.kind !== source.kind || record.product !== source.product) {
    throw new Error(`Snapshot missing/mismatched: ${source.id}`);
  }
  if (!/^bodies\/[a-f0-9]{64}\.gz$/.test(record.file || '')) throw new Error(`Invalid body path: ${source.id}`);
  const compressed = fs.readFileSync(inside(directory, record.file));
  if (sha256(compressed) !== record.gzip_sha256) throw new Error(`Compressed hash mismatch: ${source.id}`);
  const bytes = zlib.gunzipSync(compressed, { maxOutputLength: LIMIT });
  assertReceiptMatches(record.receipt, bytes, source.url);
  if (record.file !== `bodies/${sha256(bytes)}.gz`) throw new Error(`Body identity mismatch: ${source.id}`);
  validateBody(source, bytes, record.headers?.['content-type']);
  return bytes;
}

async function acquire(directory, source, fetchImpl = fetch) {
  const attemptedAt = new Date().toISOString();
  let response;
  try {
    const url = await pinnedUrl(source.url, fetchImpl);
    response = await fetchImpl(url, { headers: { 'user-agent': `Smart-Config-Kit-Docs/${VERSION}` }, signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = await responseBytes(response);
    const headers = headersObject(response);
    validateBody(source, bytes, headers['content-type']);
    const receipt = createSourceReceipt({ requestedUrl: source.url, effectiveUrl: response.url || url, bytes });
    const file = `bodies/${receipt.content.sha256}.gz`;
    const destination = inside(directory, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    if (!fs.existsSync(destination)) fs.writeFileSync(destination, zlib.gzipSync(bytes, { level: 9 }), { flag: 'wx' });
    const record = { ...source, status: 'ok', fetched_at: attemptedAt, http_status: response.status, headers, file,
      gzip_sha256: sha256(fs.readFileSync(destination)), receipt };
    verifyRecord(directory, source, record);
    return record;
  } catch (error) {
    return { ...source, status: 'failed', attempted_at: attemptedAt, http_status: response?.status || null,
      headers: response ? headersObject(response) : {}, error: error.message };
  }
}

function loadManifest(directory) {
  const file = path.join(directory, 'manifest.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

async function snapshot(directory, { refresh = false, fetchImpl = fetch } = {}) {
  const config = readSources(directory);
  const previous = loadManifest(directory);
  const records = new Array(config.sources.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, records.length) }, async () => {
    while (next < config.sources.length) {
      const index = next++;
      const source = config.sources[index];
      const old = previous?.sources.find(item => item.id === source.id);
      if (!refresh && old?.status === 'ok') {
        verifyRecord(directory, source, old);
        records[index] = { ...old, ...source };
      } else records[index] = await acquire(directory, source, fetchImpl);
      process.stdout.write(`${records[index].status} ${source.id}${records[index].error ? `: ${records[index].error}` : ''}\n`);
    }
  }));
  if (previous) {
    const bytes = Buffer.from(`${JSON.stringify(previous, null, 2)}\n`);
    const archive = inside(directory, `manifests/${sha256(bytes)}.json`);
    fs.mkdirSync(path.dirname(archive), { recursive: true });
    if (!fs.existsSync(archive)) fs.writeFileSync(archive, bytes, { flag: 'wx' });
  }
  const manifest = { schema_version: 1, tool_version: VERSION, group: config.group,
    generated_at: new Date().toISOString(), inventory_normalization: 'LF', sources_sha256: inventoryHash(directory),
    counts: { total: records.length, ok: records.filter(x => x.status === 'ok').length, failed: records.filter(x => x.status !== 'ok').length }, sources: records };
  const target = path.join(directory, 'manifest.json');
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.renameSync(temporary, target);
  return manifest;
}

function verify(directory) {
  const config = readSources(directory);
  const manifest = loadManifest(directory);
  if (!manifest || manifest.schema_version !== 1 || manifest.group !== config.group || manifest.sources.length !== config.sources.length
      || manifest.inventory_normalization !== 'LF' || manifest.sources_sha256 !== inventoryHash(directory)) throw new Error('Inventory/manifest mismatch');
  if (new Set(manifest.sources.map(x => x.id)).size !== manifest.sources.length) throw new Error('Duplicate manifest IDs');
  const failures = [];
  for (const source of config.sources) {
    const record = manifest.sources.find(item => item.id === source.id);
    if (record?.status === 'failed' && record.url === source.url && record.error && source.required === false) {
      failures.push(source.id);
      continue;
    }
    verifyRecord(directory, source, record);
  }
  const ok = manifest.sources.filter(x => x.status === 'ok').length;
  if (manifest.counts.total !== config.sources.length || manifest.counts.ok !== ok || manifest.counts.failed !== config.sources.length - ok) throw new Error('Invalid manifest counts');
  return { group: config.group, verified: ok, optional_failures: failures };
}

async function main(args) {
  const groupIndex = args.indexOf('--group');
  if (groupIndex === -1 || !args[groupIndex + 1]) throw new Error('Usage: node tools/cache-official-docs.js --group docs/upstream/YYYY-MM-DD/GROUP [--verify|--read ID|--refresh]');
  const directory = inside(ROOT, args[groupIndex + 1]);
  const readIndex = args.indexOf('--read');
  if (args.includes('--verify')) console.log(JSON.stringify(verify(directory)));
  else if (readIndex !== -1) {
    const source = readSources(directory).sources.find(item => item.id === args[readIndex + 1]);
    if (!source) throw new Error('Unknown source ID');
    const record = loadManifest(directory)?.sources.find(item => item.id === source.id);
    process.stdout.write(verifyRecord(directory, source, record));
  } else {
    const manifest = await snapshot(directory, { refresh: args.includes('--refresh'), fetchImpl: args.includes('--github-cli') ? githubCliFetch : fetch });
    console.log(JSON.stringify(manifest.counts));
    if (manifest.sources.some(item => item.status !== 'ok' && item.required !== false)) process.exitCode = 1;
  }
}

if (require.main === module) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { readSources, validateBody, acquire, verifyRecord, snapshot, verify, inside };
