'use strict';

// AEROVE App resource projection only. Shared fused payloads are immutable inputs.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { spawnSync } = require('node:child_process');
const { REPOSITORY_URL_PREFIXES } = require('./repository-rule-asset');
const { repositoryAssetUrl, mihomoAssetCachePath } = require('./generated-asset-url');
const { parsePayloadEntries, renderPayload, convertWithMihomo } = require('../build-fused-rule-sets');
const { SOURCE_GRAPH_VERSION } = require('../../rulesets/source/routing-graph');

const ASSET_DIR = 'Meow内核系/Aerove Lite/rule-assets';
const MANIFEST_PATH = `${ASSET_DIR}/manifest.json`;
const VERSION = `${SOURCE_GRAPH_VERSION}-meow.5`;
const COMPILER_VERSION = 'v1.19.32';
const LIMITS = Object.freeze({ max_entries: 250000, max_entry_bytes: 2048, max_entry_labels: 128,
  max_labels: 500000, max_text_bytes: 64 * 1024 * 1024, max_input_bytes: 64 * 1024 * 1024,
  max_decompressed_bytes: 256 * 1024 * 1024 });
const POLICY = Object.freeze({ app: 'AEROVE Lite', app_commit: '457fab8455ac8713fc9828e129d2050b11bf1beb', limits: LIMITS,
  source_hash_normalization: 'raw binary MRS; canonical LF for repository text assets',
  entry_normalization: 'trim; UTF-8; labels=entry.split(".").length; text_bytes=sum(UTF8(entry)+1)',
  native_domain_enumeration: 'Mihomo DumpMrs folds +.domain and domain into one predicate; fixed Rust reader visits both encoded leaves. Budget the unique expanded leaf set before partitioning.',
  fixed_rust_parser_sha256: '6ccf928c318e5524669775c35767cfa12dd21f349abe0bba430fb15507f34eb3',
  count_semantics: 'domain header_entries equals native traversal entries; ipcidr header_entries is successful pre-merge Insert count and can exceed canonical DumpMrs entries; both counts must be <=250000 in projected resources',
  count_source: 'Mihomo rules/provider/ipcidr_strategy.go: Count, Insert, FinishInsert, FromMrs, DumpMrs; native convert-ruleset full traversal',
  proof: 'Mihomo native MRS full traversal; exact string predicate union after native shard round-trip',
  compiler: { name: 'Mihomo', version: COMPILER_VERSION, operations: ['convert-ruleset behavior mrs to text', 'convert-ruleset behavior yaml to mrs'] } });
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const lfBytes = bytes => Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
const stable = value => JSON.stringify(value && typeof value === 'object'
  ? Array.isArray(value) ? value.map(item => JSON.parse(stable(item)))
    : Object.fromEntries(Object.keys(value).sort().map(key => [key, JSON.parse(stable(value[key]))])) : value);
const insist = (ok, message) => { if (!ok) throw new Error(message); };
const json = value => JSON.stringify(value, null, 2) + '\n';

function safeFile(repoRoot, relative) {
  insist(typeof relative === 'string' && relative && !/[\\\x00-\x1f:*?"<>|]/.test(relative)
    && !relative.split('/').some(part => !part || part === '.' || part === '..'), `Unsafe asset path: ${relative}`);
  const result = path.resolve(repoRoot, relative);
  insist(!path.relative(path.resolve(repoRoot), result).startsWith('..') && !path.isAbsolute(path.relative(repoRoot, result)), 'Asset escapes repository');
  let cursor = path.resolve(repoRoot);
  for (const part of relative.split('/')) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor)) insist(!fs.lstatSync(cursor).isSymbolicLink(), `Symlink asset forbidden: ${relative}`);
  }
  return result;
}

function sourcePath(url) {
  const prefix = REPOSITORY_URL_PREFIXES.find(item => String(url).startsWith(item));
  insist(prefix, `AEROVE requires a repository-local frozen asset: ${url}`);
  return decodeURIComponent(String(url).slice(prefix.length).split(/[?#]/)[0]);
}

function measureEntries(entries) {
  const result = { entries: 0, labels: 0, text_bytes: 0, max_entry_bytes: 0, max_entry_labels: 0 };
  for (const raw of entries) {
    const entry = raw.trim();
    insist(entry && !/[\r\n\x00]/.test(entry), 'Invalid empty or multiline rule entry');
    const bytes = Buffer.byteLength(entry, 'utf8'); const labels = entry.split('.').length;
    result.entries++; result.labels += labels; result.text_bytes += bytes + 1;
    result.max_entry_bytes = Math.max(result.max_entry_bytes, bytes);
    result.max_entry_labels = Math.max(result.max_entry_labels, labels);
  }
  return result;
}

function nativeMrsEntries(entries, behavior) {
  if (behavior !== 'domain') return entries;
  const result = new Set();
  for (const entry of entries) {
    result.add(entry);
    if (entry.startsWith('+.')) result.add(entry.slice(2));
  }
  return [...result];
}

const nativeBudget = row => ({ ...row.native_metrics,
  ...(row.metrics.header_entries === undefined ? {} : { header_entries: row.metrics.header_entries }) });

function assertIndividual(metrics, limits = LIMITS) {
  for (const key of ['entries', 'labels', 'text_bytes', 'max_entry_bytes', 'max_entry_labels']) {
    insist(Number.isSafeInteger(metrics[key]) && metrics[key] >= 0, `Invalid AEROVE resource metric: ${key}`);
  }
  insist(metrics.labels >= metrics.entries && metrics.text_bytes >= metrics.entries * 2, 'Invalid AEROVE entry aggregate metrics');
  insist(metrics.max_entry_bytes <= limits.max_entry_bytes, 'AEROVE entry exceeds UTF-8 bytes limit');
  insist(metrics.max_entry_labels <= limits.max_entry_labels, 'AEROVE entry exceeds logical labels limit');
}
function exceeds(metrics, limits = LIMITS) {
  return metrics.entries > limits.max_entries || metrics.labels > limits.max_labels || metrics.text_bytes > limits.max_text_bytes
    || (metrics.header_entries !== undefined && metrics.header_entries > limits.max_entries);
}
function assertBudget(metrics, bytes, limits = LIMITS) {
  assertIndividual(metrics, limits);
  insist(!exceeds(metrics, limits), 'AEROVE per-resource entries/labels/text bytes budget exceeded');
  insist(bytes <= limits.max_input_bytes, 'AEROVE compressed/input bytes budget exceeded');
  if (metrics.decompressed_bytes !== undefined) insist(metrics.decompressed_bytes <= limits.max_decompressed_bytes, 'AEROVE MRS decompressed budget exceeded');
}

function partitionEntries(entries, limits = LIMITS, behavior = 'domain') {
  const result = []; let part = []; let count = 0; let labels = 0; let bytes = 0;
  for (const raw of entries) {
    const entry = raw.trim(); const metric = measureEntries(nativeMrsEntries([entry], behavior)); assertIndividual(metric, limits);
    insist(!exceeds(metric, limits), 'AEROVE indivisible entry exceeds aggregate budget');
    if (part.length && (count + metric.entries > limits.max_entries || labels + metric.labels > limits.max_labels || bytes + metric.text_bytes > limits.max_text_bytes)) {
      result.push(part); part = []; count = 0; labels = 0; bytes = 0;
    }
    part.push(entry); count += metric.entries; labels += metric.labels; bytes += metric.text_bytes;
  }
  if (part.length) result.push(part);
  return result;
}

function assertSamePredicates(before, after) {
  const source = new Set(before); const result = new Set(after);
  insist(source.size === result.size && [...source].every(item => result.has(item)), 'Native round-trip predicates differ (omission or addition)');
}

function inspectMrs(bytes, behavior) {
  insist(typeof zlib.zstdDecompressSync === 'function', 'AEROVE generator requires Node >=22.15 with zstdDecompressSync');
  insist(bytes.length <= LIMITS.max_input_bytes, 'AEROVE compressed MRS input exceeds bytes limit');
  let data;
  try { data = zlib.zstdDecompressSync(bytes, { maxOutputLength: LIMITS.max_decompressed_bytes }); }
  catch (error) { throw new Error(`Invalid or oversized MRS zstd: ${error.message}`); }
  insist(data.length >= 21 && data.subarray(0, 4).equals(Buffer.from([77, 82, 83, 1])), 'Invalid MRS magic/header');
  insist(data[4] === ({ domain: 0, ipcidr: 1 })[behavior], 'Invalid MRS behavior');
  const count = data.readBigInt64BE(5); const reserved = data.readBigInt64BE(13);
  insist(count >= 0n && count <= BigInt(Number.MAX_SAFE_INTEGER) && reserved >= 0n && reserved <= BigInt(data.length - 21), 'Invalid MRS header lengths');
  const metrics = { header_entries: Number(count), decompressed_bytes: data.length };
  if (behavior === 'domain') {
    let offset = 21 + Number(reserved);
    insist(data[offset++] === 1, 'Invalid MRS domain-set version');
    const length = () => {
      insist(offset + 8 <= data.length, 'Truncated MRS domain-set length');
      const n = data.readBigInt64BE(offset); offset += 8;
      insist(n >= 0n && n <= BigInt(data.length - offset), 'Invalid MRS domain-set length');
      return Number(n);
    };
    let leaves = 0;
    for (let vector = 0; vector < 2; vector++) {
      const words = length(); insist(words * 8 <= data.length - offset, 'Truncated MRS domain-set bitmap');
      if (vector === 0) for (let i = offset; i < offset + words * 8; i++) {
        let byte = data[i]; while (byte) { byte &= byte - 1; leaves++; }
      }
      offset += words * 8;
    }
    const labelBytes = length();
    insist(offset + labelBytes === data.length, 'Invalid MRS domain-set label bytes/trailing data');
    Object.assign(metrics, { encoded_leaves: leaves, encoded_label_bytes: labelBytes });
  }
  return metrics;
}

function decodeMrs(mihomoBin, behavior, source, temporary, label) {
  const target = path.join(temporary, `${label}.txt`);
  const result = spawnSync(mihomoBin, ['convert-ruleset', behavior, 'mrs', source, target], { windowsHide: true, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  insist(!result.error && result.status === 0, `Native MRS decode failed: ${result.error?.message || result.stderr || result.stdout}`);
  return fs.readFileSync(target, 'utf8').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function yamlSourceFor(relative, fusedManifest) {
  for (const segment of fusedManifest.segments || []) {
    for (const asset of Object.values(segment.files || {})) {
      if (asset.source && relative === `rulesets/generated/fused/mihomo/${asset.file}`) return `rulesets/generated/fused/mihomo/${asset.source}`;
    }
  }
  return null;
}

function inputBinding(repoRoot, providers, fusedManifest) {
  const files = ['rulesets/source/routing-graph.js', 'tools/lib/aerove-rule-assets.js', 'tools/generate-aerove-rule-assets.js'];
  return { providers_sha256: hash(stable(providers)), fused_manifest_sha256: hash(stable(fusedManifest)),
    files: Object.fromEntries(files.filter(file => fs.existsSync(safeFile(repoRoot, file)))
      .map(file => [file, hash(fs.readFileSync(safeFile(repoRoot, file), 'utf8').replace(/\r\n/g, '\n'))])) };
}

function buildAssetOutputs({ repoRoot, providers, fusedManifest, mihomoBin }) {
  insist(mihomoBin && fs.existsSync(mihomoBin), 'Set MIHOMO_BIN to the pinned native Mihomo v1.19.32 binary');
  const version = spawnSync(mihomoBin, ['-v'], { encoding: 'utf8', windowsHide: true });
  insist(version.status === 0 && /Mihomo\s+(?:Meta\s+)?v?1\.19\.32(?:\s|$)/i.test(version.stdout), 'Mihomo compiler must be v1.19.32');
  const outputs = {}; const sources = []; const assets = []; const splits = {};
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'aerove-rule-assets-'));
  try {
    for (const [provider, definition] of Object.entries(providers)) {
      insist(/^[a-zA-Z0-9._-]+$/.test(provider), `Unsafe provider id: ${provider}`);
      const relative = sourcePath(definition.url); const file = safeFile(repoRoot, relative);
      const isMrs = definition.format === 'mrs';
      const bytes = isMrs ? fs.readFileSync(file) : lfBytes(fs.readFileSync(file));
      insist(bytes.length <= LIMITS.max_input_bytes, `Asset input bytes exceeds App limit: ${provider}`);
      const header = isMrs ? inspectMrs(bytes, definition.behavior) : {};
      const entries = isMrs ? decodeMrs(mihomoBin, definition.behavior, file, temporary, `source-${sources.length}`)
        : definition.format === 'yaml' ? parsePayloadEntries(bytes.toString('utf8'))
          : bytes.toString('utf8').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
      const metrics = { ...measureEntries(entries), ...header }; assertIndividual(metrics);
      // IPCIDR headers count successful Insert calls before FinishInsert.Merge;
      // DumpMrs traverses the merged CIDR set. Keep both counts and budget both.
      if (isMrs) insist(definition.behavior === 'domain' ? metrics.header_entries === metrics.entries
        : metrics.header_entries >= metrics.entries, `Native MRS header/traversal count mismatch: ${provider}`);
      insist(metrics.entries > 0, `Empty resource: ${provider}`);
      const source = { provider, original_path: relative, url: definition.url, behavior: definition.behavior, format: definition.format,
        sha256: hash(bytes), bytes: bytes.length, metrics,
        native_metrics: measureEntries(isMrs ? nativeMrsEntries(entries, definition.behavior) : entries) };
      if (isMrs && definition.behavior === 'domain') insist(header.encoded_leaves === source.native_metrics.entries,
        `MRS encoded leaf count differs from native enumeration model: ${provider}`);
      const yamlPath = yamlSourceFor(relative, fusedManifest);
      if (yamlPath) {
        const yamlBytes = lfBytes(fs.readFileSync(safeFile(repoRoot, yamlPath)));
        source.source_yaml = { path: yamlPath, sha256: hash(yamlBytes), bytes: yamlBytes.length, normalization: 'canonical LF' };
      }
      sources.push(source);
      if (!exceeds(nativeBudget(source))) { assertBudget(nativeBudget(source), bytes.length); continue; }
      insist(isMrs, `Oversized non-MRS resource requires explicit adaptation: ${provider}`);
      const parts = partitionEntries(entries, LIMITS, definition.behavior); const union = []; splits[provider] = [];
      for (let index = 0; index < parts.length; index++) {
        const id = `${provider}-aerove-part-${String(index + 1).padStart(3, '0')}`;
        const assetPath = `${ASSET_DIR}/${id}.mrs`; const yaml = path.join(temporary, `${id}.yaml`); const target = path.join(temporary, `${id}.mrs`);
        fs.writeFileSync(yaml, renderPayload(parts[index]));
        convertWithMihomo(mihomoBin, definition.behavior, yaml, target);
        const compiled = fs.readFileSync(target); const roundtrip = decodeMrs(mihomoBin, definition.behavior, target, temporary, id);
        assertSamePredicates(parts[index], roundtrip);
        for (const entry of roundtrip) union.push(entry);
        const shardMetrics = { ...measureEntries(roundtrip), ...inspectMrs(compiled, definition.behavior) };
        insist(shardMetrics.header_entries === shardMetrics.entries, `Native shard header/traversal count mismatch: ${id}`);
        const asset = { path: assetPath, sha256: hash(compiled), bytes: compiled.length, metrics: shardMetrics,
          native_metrics: measureEntries(nativeMrsEntries(roundtrip, definition.behavior)) };
        assertBudget(nativeBudget(asset), compiled.length);
        if (definition.behavior === 'domain') insist(shardMetrics.encoded_leaves === asset.native_metrics.entries, `MRS shard leaf count mismatch: ${id}`);
        outputs[assetPath] = compiled; assets.push(asset);
        splits[provider].push({ id, asset_path: assetPath, url: repositoryAssetUrl(assetPath, VERSION),
          cache_path: mihomoAssetCachePath(`${id}.mrs`, VERSION), sha256: asset.sha256, bytes: asset.bytes, metrics: shardMetrics, native_metrics: asset.native_metrics });
      }
      assertSamePredicates(entries, union);
      source.exact_union_verified = true;
    }
    const manifest = { schema_version: 1, version: VERSION, policy: POLICY,
      inputs: inputBinding(repoRoot, providers, fusedManifest), sources, assets, splits };
    outputs[MANIFEST_PATH] = json(manifest);
    return { outputs, manifest };
  } finally {
    insist(path.dirname(path.resolve(temporary)) === path.resolve(os.tmpdir())
      && path.basename(temporary).startsWith('aerove-rule-assets-'), 'Refuse cleanup outside the owned temporary directory');
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function readAssetManifest({ repoRoot, providers, fusedManifest }) {
  const manifest = JSON.parse(fs.readFileSync(safeFile(repoRoot, MANIFEST_PATH), 'utf8'));
  insist(manifest.schema_version === 1 && manifest.version === VERSION && stable(manifest.policy) === stable(POLICY), 'AEROVE manifest policy/version drift; regenerate');
  insist(stable(manifest.inputs) === stable(inputBinding(repoRoot, providers, fusedManifest)), 'AEROVE generation inputs fingerprint changed; regenerate');
  insist(Array.isArray(manifest.sources) && manifest.sources.length === Object.keys(providers).length, 'AEROVE source inventory mismatch');
  const seen = new Set(); const assetMap = new Map();
  function verify(row, relative, text = false) {
    const raw = fs.readFileSync(safeFile(repoRoot, relative));
    const bytes = text ? lfBytes(raw) : raw;
    insist(bytes.length === row.bytes && hash(bytes) === row.sha256, `AEROVE asset hash/bytes mismatch: ${relative}`);
    return bytes;
  }
  for (const source of manifest.sources) {
    insist(!seen.has(source.provider) && providers[source.provider] && source.original_path === sourcePath(providers[source.provider].url)
      && source.url === providers[source.provider].url && source.format === providers[source.provider].format
      && source.behavior === providers[source.provider].behavior, 'AEROVE source inventory mismatch');
    seen.add(source.provider); const original = verify(source, source.original_path, source.format !== 'mrs'); assertIndividual(source.metrics);
    insist(source.metrics.entries > 0 && source.bytes <= LIMITS.max_input_bytes, 'Invalid AEROVE source budget'); assertIndividual(source.native_metrics);
    if (source.format === 'mrs') {
      const header = inspectMrs(original, source.behavior);
      insist(stable(header) === stable(Object.fromEntries(Object.keys(header).map(key => [key, source.metrics[key]])))
        && (source.behavior === 'domain' ? header.header_entries === source.metrics.entries : header.header_entries >= source.metrics.entries), 'AEROVE source MRS metrics mismatch');
      if (source.behavior === 'domain') insist(header.encoded_leaves === source.native_metrics.entries, 'AEROVE source native leaf metrics mismatch');
    } else {
      const entries = source.format === 'yaml' ? parsePayloadEntries(original.toString('utf8'))
        : original.toString('utf8').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
      insist(stable(measureEntries(entries)) === stable(source.metrics), 'AEROVE source text metrics mismatch');
      insist(stable(source.metrics) === stable(source.native_metrics), 'AEROVE text native metrics mismatch');
    }
    if (source.source_yaml) verify(source.source_yaml, source.source_yaml.path, true);
    if (!manifest.splits[source.provider]) assertBudget(nativeBudget(source), source.bytes);
    else insist(source.exact_union_verified === true && exceeds(nativeBudget(source)), 'AEROVE invalid split proof');
  }
  for (const asset of manifest.assets) {
    insist(asset.path.startsWith(`${ASSET_DIR}/`) && /^[-a-zA-Z0-9._]+\.mrs$/.test(asset.path.slice(ASSET_DIR.length + 1)) && !assetMap.has(asset.path), 'AEROVE unsafe/duplicate shard path');
    const bytes = verify(asset, asset.path); assertBudget(nativeBudget(asset), bytes.length);
    const sourceProvider = Object.keys(manifest.splits).find(provider => manifest.splits[provider].some(row => row.asset_path === asset.path));
    insist(sourceProvider, 'AEROVE orphan shard');
    const header = inspectMrs(bytes, providers[sourceProvider].behavior);
    insist(stable(header) === stable(Object.fromEntries(Object.keys(header).map(key => [key, asset.metrics[key]]))), 'AEROVE MRS metrics mismatch');
    if (providers[sourceProvider].behavior === 'domain') insist(header.encoded_leaves === asset.native_metrics.entries, 'AEROVE shard native leaf metrics mismatch');
    assetMap.set(asset.path, asset);
  }
  const referenced = new Set(); const ids = new Set();
  for (const [provider, rows] of Object.entries(manifest.splits)) {
    insist(providers[provider] && Array.isArray(rows) && rows.length > 0, 'AEROVE unknown/empty split');
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]; const expectedId = `${provider}-aerove-part-${String(index + 1).padStart(3, '0')}`;
      const asset = assetMap.get(row.asset_path);
      insist(row.id === expectedId && !ids.has(row.id) && asset && row.asset_path === `${ASSET_DIR}/${row.id}.mrs`
        && row.sha256 === asset.sha256 && row.bytes === asset.bytes && stable(row.metrics) === stable(asset.metrics) && stable(row.native_metrics) === stable(asset.native_metrics)
        && row.url === repositoryAssetUrl(row.asset_path, VERSION) && row.cache_path === mihomoAssetCachePath(`${row.id}.mrs`, VERSION), 'AEROVE shard mapping mismatch');
      ids.add(row.id); referenced.add(row.asset_path);
    }
  }
  insist(referenced.size === assetMap.size, 'AEROVE shard inventory mismatch');
  const actual = fs.readdirSync(safeFile(repoRoot, ASSET_DIR)).sort();
  const expected = ['manifest.json', ...manifest.assets.map(row => path.basename(row.path))].sort();
  insist(stable(actual) === stable(expected), 'AEROVE asset directory contains orphan or missing files');
  return manifest;
}

module.exports = { ASSET_DIR, MANIFEST_PATH, VERSION, LIMITS, POLICY, buildAssetOutputs, readAssetManifest,
  partitionEntries, measureEntries, nativeMrsEntries, inspectMrs, assertSamePredicates, safeFile };
