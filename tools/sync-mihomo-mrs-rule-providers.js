#!/usr/bin/env node
'use strict';

const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const {
  SOURCE_GRAPH_ID,
  getRawRoutingGraph,
  getMihomoNormalizedRoutingGraph,
} = require('../rulesets/source/routing-graph');
const {
  partitionMihomoDomainEntries,
} = require('./lib/mihomo-domain-payload');
const {
  localPathForRepositoryRuleUrl,
} = require('./lib/repository-rule-asset');
const { writeRepositoryArtifact } = require('./lib/write-repository-artifact');
const {
  sha256, parseGitSource, acquireSource, createSourceReceipt,
  buildProviderLedger, buildSnapshotProviderLedger, collectManifestOutputReceipts,
} = require('./lib/source-provenance');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'rulesets/generated/mihomo-mrs');
const CACHE_DIR = path.join(REPO_ROOT, '.cache/mihomo-mrs');
const MIHOMO_REPO_API = 'https://api.github.com/repos/MetaCubeX/mihomo/releases/latest';
const SCKI_GENERATED_MARKERS = [
  '/rulesets/generated/mihomo-mrs/',
  '/rulesets/generated/fused/',
];
const CONCURRENCY = 8;
const FETCH_ATTEMPTS = 3;

const DOMAIN_RULE_TYPES = new Set([
  'DOMAIN',
  'DOMAIN-SUFFIX',
  'DOMAIN-KEYWORD',
  'DOMAIN-REGEX',
  'DOMAIN-WILDCARD',
]);
const IPCIDR_RULE_TYPES = new Set(['IP-CIDR', 'IP-CIDR6']);

function usage() {
  return [
    'Usage: node tools/sync-mihomo-mrs-rule-providers.js [--mihomo-bin <path>] [--keep-cache] [--offline]',
    '       node tools/sync-mihomo-mrs-rule-providers.js --legacy-snapshot [--receipt-output <path>]',
    '',
    'Downloads upstream Mihomo rule-providers, converts every safely convertible',
    'domain/ipcidr provider to .mrs, and writes rulesets/generated/mihomo-mrs/.',
  ].join('\n');
}

function parseArgs(argv) {
  const options = { mihomoBin: process.env.MIHOMO_BIN || null, keepCache: false,
    offline: process.env.SCKI_OFFLINE === '1', legacySnapshot: false, receiptOutput: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    if (arg === '--mihomo-bin') {
      options.mihomoBin = argv[i + 1];
      if (!options.mihomoBin) throw new Error('--mihomo-bin requires a path');
      i += 1;
      continue;
    }
    if (arg === '--keep-cache') {
      options.keepCache = true;
      continue;
    }
    if (arg === '--offline' || arg === '--legacy-snapshot') {
      options[arg === '--offline' ? 'offline' : 'legacySnapshot'] = true;
      continue;
    }
    if (arg === '--receipt-output') {
      options.receiptOutput = argv[++i];
      if (!options.receiptOutput) throw new Error('--receipt-output requires a path');
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function unquote(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function parseProviders(source) {
  const match = /\r?\nrule-providers:\r?\n([\s\S]*?)\r?\nrules:\r?\n/.exec(source);
  if (!match) throw new Error('Cannot locate rule-providers section');
  const providers = [];
  let current = null;
  for (const rawLine of match[1].split(/\r?\n/)) {
    const providerMatch = rawLine.match(/^  ([^:\s][^:]*):\s*$/);
    if (providerMatch) {
      current = { name: unquote(providerMatch[1]) };
      providers.push(current);
      continue;
    }
    const fieldMatch = rawLine.match(/^    ([A-Za-z0-9_-]+):\s*(.+?)\s*$/);
    if (fieldMatch && current) current[fieldMatch[1]] = unquote(fieldMatch[2]);
  }
  return providers;
}

function generatedProviderUrl(url) {
  return SCKI_GENERATED_MARKERS.some((marker) => String(url || '').includes(marker));
}

function loadSourceGraphProviders() {
  const output = getRawRoutingGraph();
  return Object.entries(output['rule-providers'] || {}).map(([name, provider]) => ({
    name,
    type: provider.type,
    behavior: provider.behavior,
    format: provider.format,
    url: provider.url,
  }));
}

function readPreviousManifest() {
  const manifests = [];
  const file = path.join(OUTPUT_DIR, 'manifest.json');
  if (fs.existsSync(file)) {
    try {
      manifests.push(JSON.parse(readText(file)));
    } catch {
      // Ignore a broken worktree manifest; the git fallback below can still seed a full rebuild.
    }
  }
  try {
    const fromGit = childProcess.execFileSync('git', ['show', 'HEAD:rulesets/generated/mihomo-mrs/manifest.json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    manifests.push(JSON.parse(fromGit));
  } catch {
    // First-time generation may not have a committed manifest yet.
  }
  if (manifests.length === 0) return null;

  const merged = { converted: [], split: [], partial: [] };
  for (const key of Object.keys(merged)) {
    const byId = new Map();
    for (const manifest of manifests) {
      for (const row of manifest[key] || []) byId.set(row.id, row);
    }
    merged[key] = [...byId.values()];
  }
  return merged;
}

function providersFromPreviousManifest(manifest) {
  if (!manifest) return [];
  const rows = [
    ...(manifest.converted || []),
    ...(manifest.split || []),
    ...(manifest.partial || []),
  ];
  return rows
    .filter((row) => row.id && row.source_url)
    .map((row) => ({
      name: row.id,
      type: 'http',
      behavior: row.source_behavior || 'classical',
      format: row.source_format || 'yaml',
      url: row.source_url,
    }));
}

function splitTopLevel(rule) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of rule) {
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim());
}

function stripInlineComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if ((char === '"' || char === "'") && line[i - 1] !== '\\') {
      quote = quote === char ? null : quote || char;
    }
    if (char === '#' && !quote) return line.slice(0, i);
  }
  return line;
}

function parsePayloadEntries(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  const hasPayload = /^payload:\s*$/m.test(normalized);
  const entries = [];
  let inPayload = !hasPayload;
  for (const rawLine of normalized.split('\n')) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line === 'payload:') {
      inPayload = true;
      continue;
    }
    if (!inPayload) continue;
    const itemMatch = line.match(/^-\s*(.+)$/);
    if (itemMatch) line = itemMatch[1].trim();
    else if (hasPayload) continue;
    line = stripInlineComment(line).trim().replace(/^['"]|['"]$/g, '').trim();
    if (line) entries.push(line);
  }
  return entries;
}

function classifyEntry(entry) {
  if (!entry.includes(',')) {
    if (/^[0-9a-fA-F:.]+\/\d+$/.test(entry)) return 'ipcidr';
    return 'domain';
  }
  const type = splitTopLevel(entry)[0].toUpperCase().replace(/\s+/g, '');
  if (DOMAIN_RULE_TYPES.has(type)) return 'domain';
  if (IPCIDR_RULE_TYPES.has(type)) return 'ipcidr';
  return type || 'unknown';
}

function normalizeIpCidrEntry(entry) {
  if (!entry.includes(',')) return entry.trim();
  const parts = splitTopLevel(entry);
  return String(parts[1] || '').trim();
}

function renderPayload(entries) {
  const lines = ['payload:'];
  for (const entry of entries) lines.push(`  - ${yamlQuote(entry)}`);
  lines.push('');
  return lines.join('\n');
}

function safeFileName(name) {
  return `${String(name).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'ruleset'}.mrs`;
}

function safeYamlFileName(name) {
  return `${String(name).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'ruleset'}.yaml`;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function downloadSource(url, fetchImpl = fetch, resolveMemo = new Map(), { sourceTimeoutMs = 90000 } = {}) {
  const requestedGit = parseGitSource(url);
  let resolvedCommit = null;
  if (requestedGit && !/^[a-f0-9]{40}$/i.test(requestedGit.ref)) {
    const key = `${requestedGit.repository}@${requestedGit.ref}`;
    if (!resolveMemo.has(key)) {
      resolveMemo.set(key, (async () => {
        const response = await fetchImpl(`https://api.github.com/repos/${requestedGit.repository}/commits/${encodeURIComponent(requestedGit.ref)}`, {
          headers: { 'user-agent': 'Smart-Config-Kit-MRS-Sync/1.0' }, signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) throw new Error(`Git ref resolution HTTP ${response.status}`);
        const record = await response.json();
        if (!/^[a-f0-9]{40}$/i.test(record.sha)) throw new Error('Git ref resolution did not return a full commit');
        return record.sha.toLowerCase();
      })().catch(() => null)); // Resolution failure permits content addressing only.
    }
    resolvedCommit = await resolveMemo.get(key);
    if (resolvedCommit) url = `https://raw.githubusercontent.com/${requestedGit.repository}/${resolvedCommit}/${requestedGit.file}`;
  }
  const candidates = [url];
  const gitSource = parseGitSource(url);
  if (gitSource) {
    const ref = encodeURIComponent(gitSource.ref);
    candidates.push(`https://fastly.jsdelivr.net/gh/${gitSource.repository}@${ref}/${gitSource.file}`);
    candidates.push(`https://cdn.jsdelivr.net/gh/${gitSource.repository}@${ref}/${gitSource.file}`);
    candidates.push(`https://raw.githubusercontent.com/${gitSource.repository}/${ref}/${gitSource.file}`);
  }

  const errors = [];
  for (const candidate of [...new Set(candidates)]) {
    for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), sourceTimeoutMs);
      try {
        const response = await fetchImpl(candidate, {
          signal: controller.signal,
          headers: { 'user-agent': 'Smart-Config-Kit-MRS-Sync/1.0' },
        });
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}`);
          error.retryable = response.status >= 500;
          throw error;
        }
        return { bytes: Buffer.from(await response.arrayBuffer()), effectiveUrl: response.url || candidate, resolvedCommit };
      } catch (error) {
        errors.push(`${candidate} [${attempt}/${FETCH_ATTEMPTS}] -> ${error.message}`);
        if (error.retryable === false || attempt === FETCH_ATTEMPTS) break;
        await delay(attempt * 750);
      } finally {
        clearTimeout(timer);
      }
    }
  }
  throw new Error(errors.join('; '));
}

async function fetchText(url, options = {}, resolveMemo = new Map()) {
  const result = await acquireSource({ requestedUrl: url, localPath: localPathForRepositoryRuleUrl(url),
    repoRoot: REPO_ROOT, cacheDir: path.join(CACHE_DIR, 'raw-inputs'), offline: options.offline,
    keepCache: options.keepCache, fetchSource: candidate => downloadSource(candidate, fetch, resolveMemo) });
  return { text: result.bytes.toString('utf8'), receipt: result.receipt };
}

async function downloadJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Smart-Config-Kit-MRS-Sync/1.0' } });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return response.json();
}

function platformAssetPattern() {
  const arch = os.arch();
  if (process.platform === 'win32') {
    if (arch !== 'x64') throw new Error(`Unsupported Windows arch for automatic mihomo download: ${arch}`);
    return /^mihomo-windows-amd64-compatible-.*\.zip$/;
  }
  if (process.platform === 'linux') {
    if (arch === 'x64') return /^mihomo-linux-amd64-compatible-.*\.gz$/;
    if (arch === 'arm64') return /^mihomo-linux-arm64-.*\.gz$/;
  }
  if (process.platform === 'darwin') {
    if (arch === 'x64') return /^mihomo-darwin-amd64-compatible-.*\.gz$/;
    if (arch === 'arm64') return /^mihomo-darwin-arm64-.*\.gz$/;
  }
  throw new Error(`Unsupported platform for automatic mihomo download: ${process.platform}/${arch}`);
}

async function ensureMihomoBinary(explicitPath, options = {}, cacheDir = CACHE_DIR) {
  if (explicitPath) {
    const resolved = path.resolve(explicitPath);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw new Error(`Missing mihomo binary: ${resolved}`);
    return resolved;
  }
  const binaryReceipt = path.join(cacheDir, 'binary.json');
  if (options.offline) {
    if (!fs.existsSync(binaryReceipt)) throw new Error('offline mihomo binary cache miss; specify --mihomo-bin');
    const record = JSON.parse(readText(binaryReceipt));
    if (!record.file || path.basename(record.file) !== record.file) throw new Error('Invalid cached mihomo binary path');
    const target = path.join(cacheDir, record.file);
    if (!fs.existsSync(target)) throw new Error('offline mihomo binary cache miss');
    const bytes = fs.readFileSync(target);
    if (sha256(bytes) !== record.sha256 || bytes.length !== record.bytes) throw new Error('Cached mihomo binary hash mismatch');
    return target;
  }
  fs.mkdirSync(cacheDir, { recursive: true });
  const release = await downloadJson(MIHOMO_REPO_API);
  const pattern = platformAssetPattern();
  const asset = release.assets.find((candidate) => pattern.test(candidate.name));
  if (!asset) throw new Error(`No mihomo release asset matches ${pattern}`);

  const ext = process.platform === 'win32' ? '.exe' : '';
  const target = path.join(cacheDir, `mihomo-${release.tag_name}${ext}`);
  if (fs.existsSync(target) && fs.existsSync(binaryReceipt)) {
    const record = JSON.parse(readText(binaryReceipt));
    const bytes = fs.readFileSync(target);
    if (record.file === path.basename(target) && record.sha256 === sha256(bytes) && record.bytes === bytes.length) return target;
  }

  const archive = path.join(cacheDir, asset.name);
  const response = await fetch(asset.browser_download_url, { headers: { 'user-agent': 'Smart-Config-Kit-MRS-Sync/1.0' } });
  if (!response.ok) throw new Error(`${asset.browser_download_url} -> HTTP ${response.status}`);
  fs.writeFileSync(archive, Buffer.from(await response.arrayBuffer()));

  if (asset.name.endsWith('.gz')) {
    fs.writeFileSync(target, zlib.gunzipSync(fs.readFileSync(archive)));
    fs.chmodSync(target, 0o755);
  } else if (asset.name.endsWith('.zip') && process.platform === 'win32') {
    const unzipDir = path.join(cacheDir, `unzip-${release.tag_name}`);
    fs.rmSync(unzipDir, { recursive: true, force: true });
    fs.mkdirSync(unzipDir, { recursive: true });
    const result = childProcess.spawnSync('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath ${JSON.stringify(archive)} -DestinationPath ${JSON.stringify(unzipDir)} -Force`], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Expand-Archive failed');
    const exe = fs.readdirSync(unzipDir).find((file) => file.endsWith('.exe'));
    if (!exe) throw new Error(`No mihomo exe found in ${asset.name}`);
    fs.copyFileSync(path.join(unzipDir, exe), target);
  } else {
    throw new Error(`Unsupported mihomo archive: ${asset.name}`);
  }
  const bytes = fs.readFileSync(target);
  fs.writeFileSync(binaryReceipt, `${JSON.stringify({ file: path.basename(target), sha256: sha256(bytes), bytes: bytes.length,
    release_tag: release.tag_name, download_url: asset.browser_download_url }, null, 2)}\n`, 'utf8');
  return target;
}

function convertWithMihomo(mihomoBin, behavior, sourceFile, targetFile) {
  const result = childProcess.spawnSync(mihomoBin, ['convert-ruleset', behavior, 'yaml', sourceFile, targetFile], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error([
      `mihomo convert-ruleset ${behavior} failed for ${sourceFile}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }
}

function writeNormalizedSource(tempDir, id, behavior, entries) {
  const file = path.join(tempDir, `${id}-${behavior}.yaml`);
  const normalized = behavior === 'ipcidr'
    ? entries.map(normalizeIpCidrEntry).filter(Boolean)
    : entries;
  fs.writeFileSync(file, renderPayload(normalized), 'utf8');
  return { file, count: normalized.length };
}

function writeResidualRuleSet(id, entries) {
  const fileName = safeYamlFileName(`${id}-classical`);
  fs.writeFileSync(path.join(OUTPUT_DIR, fileName), renderPayload(entries), 'utf8');
  return { behavior: 'classical', file: fileName, entries: entries.length };
}

async function runLimited(items, limit, worker) {
  let cursor = 0;
  const results = [];
  async function next() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.legacySnapshot) {
    const mrsManifest = JSON.parse(readText(path.join(OUTPUT_DIR, 'manifest.json')));
    const ledger = buildSnapshotProviderLedger({ rawGraph: getRawRoutingGraph(), normalizedGraph: getMihomoNormalizedRoutingGraph(), mrsManifest, repoRoot: REPO_ROOT });
    const output = options.receiptOutput ? path.resolve(REPO_ROOT, options.receiptOutput) : path.join(OUTPUT_DIR, 'legacy-source-ledger.json');
    writeRepositoryArtifact(output, `${JSON.stringify(ledger, null, 2)}\n`);
    console.log(`legacy MRS receipts: providers=${ledger.provider_count} unknown=${ledger.stats.unknown_provenance}; no upstream refresh`);
    return;
  }
  const mihomoBin = await ensureMihomoBinary(options.mihomoBin, options);
  const previousProviderByName = new Map(providersFromPreviousManifest(readPreviousManifest()).map((provider) => [provider.name, provider]));
  const providerByName = new Map();
  const clashProviders = loadSourceGraphProviders();
  for (const provider of clashProviders
    .filter((provider) => provider.url)
    .filter((provider) => provider.type === 'http')
    .filter((provider) => !generatedProviderUrl(provider.url))) {
    providerByName.set(provider.name, provider);
  }
  for (const provider of clashProviders
    .filter((provider) => provider.url)
    .filter((provider) => provider.type === 'http')
    .filter((provider) => generatedProviderUrl(provider.url))
    .map((provider) => previousProviderByName.get(provider.name))
    .filter(Boolean)) providerByName.set(provider.name, provider);
  const providers = [...providerByName.values()];

  const tempDir = path.join(CACHE_DIR, 'sources');
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const manifest = {
    generated_at: new Date().toISOString(),
    source: `${SOURCE_GRAPH_ID} raw provider graph before Mihomo MRS normalization`,
    mihomo_bin: path.basename(mihomoBin),
    output_dir: 'rulesets/generated/mihomo-mrs',
    converted: [],
    split: [],
    partial: [],
    existing_mrs: [],
    retained: [],
    failed: [],
  };
  const receipts = {};
  const resolveMemo = new Map();

  await runLimited(providers, CONCURRENCY, async (provider) => {
    if (provider.format === 'mrs') {
      manifest.existing_mrs.push({
        id: provider.name,
        behavior: provider.behavior,
        url: provider.url,
        source_receipt: createSourceReceipt({ requestedUrl: provider.url, inputKind: 'binary-source', acquisition: 'unread-reference' }),
      });
      return;
    }

    try {
      const { text, receipt } = await fetchText(provider.url, options, resolveMemo);
      receipts[provider.name] = receipt;
      const entries = parsePayloadEntries(text);
      const typeCounts = {};
      for (const entry of entries) {
        const type = classifyEntry(entry);
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
      const types = Object.keys(typeCounts).sort();
      const domainEntries = entries.filter((entry) => classifyEntry(entry) === 'domain');
      const ipcidrEntries = entries.filter((entry) => classifyEntry(entry) === 'ipcidr');
      const unsupportedEntries = entries.filter((entry) => {
        const type = classifyEntry(entry);
        return type !== 'domain' && type !== 'ipcidr';
      });
      const {
        payload: domainPayloadEntries,
        residual: domainResidualEntries,
      } = partitionMihomoDomainEntries(domainEntries);
      const residualEntries = [...unsupportedEntries, ...domainResidualEntries];

      if (entries.length === 0) {
        manifest.retained.push({ id: provider.name, reason: 'empty-source', url: provider.url });
        return;
      }

      const generated = [];
      if (domainPayloadEntries.length > 0) {
        const fileName = domainPayloadEntries.length === entries.length ? safeFileName(provider.name) : safeFileName(`${provider.name}-domain`);
        const source = writeNormalizedSource(tempDir, provider.name, 'domain', domainPayloadEntries);
        convertWithMihomo(mihomoBin, 'domain', source.file, path.join(OUTPUT_DIR, fileName));
        generated.push({ behavior: 'domain', file: fileName, entries: source.count });
      }
      if (ipcidrEntries.length > 0) {
        const fileName = ipcidrEntries.length === entries.length ? safeFileName(provider.name) : safeFileName(`${provider.name}-ipcidr`);
        const source = writeNormalizedSource(tempDir, provider.name, 'ipcidr', ipcidrEntries);
        convertWithMihomo(mihomoBin, 'ipcidr', source.file, path.join(OUTPUT_DIR, fileName));
        generated.push({ behavior: 'ipcidr', file: fileName, entries: source.count });
      }

      if (residualEntries.length === 0) {
        const row = {
          id: provider.name,
          source_behavior: provider.behavior || 'classical',
          source_format: provider.format || 'yaml',
          source_url: provider.url,
          type_counts: typeCounts,
          generated,
        };
        if (generated.length === 1) manifest.converted.push(row);
        else manifest.split.push(row);
        return;
      }

      if (generated.length > 0) {
        manifest.partial.push({
          id: provider.name,
          source_behavior: provider.behavior || 'classical',
          source_format: provider.format || 'yaml',
          source_url: provider.url,
          type_counts: typeCounts,
          generated,
          residual: writeResidualRuleSet(provider.name, residualEntries),
        });
        return;
      }

      manifest.retained.push({
        id: provider.name,
        reason: 'unsupported-rule-types',
        source_behavior: provider.behavior || 'classical',
        source_format: provider.format || 'yaml',
        source_url: provider.url,
        type_counts: typeCounts,
      });
    } catch (error) {
      manifest.failed.push({ id: provider.name, url: provider.url, error: error.message });
    }
  });

  manifest.converted.sort((a, b) => a.id.localeCompare(b.id));
  manifest.split.sort((a, b) => a.id.localeCompare(b.id));
  manifest.partial.sort((a, b) => a.id.localeCompare(b.id));
  manifest.existing_mrs.sort((a, b) => a.id.localeCompare(b.id));
  manifest.retained.sort((a, b) => a.id.localeCompare(b.id));
  manifest.failed.sort((a, b) => a.id.localeCompare(b.id));
  const outputReceipts = collectManifestOutputReceipts({ mrsManifest: manifest, outputDir: OUTPUT_DIR, repoRoot: REPO_ROOT });
  for (const category of ['converted', 'split', 'partial', 'retained', 'failed']) {
    for (const row of manifest[category]) {
      row.source_receipt = receipts[row.id] || createSourceReceipt({ requestedUrl: row.source_url || row.url, acquisition: 'failed' });
      for (const output of [...(row.generated || []), ...(row.residual ? [row.residual] : [])]) output.output_receipt = outputReceipts[output.file];
    }
  }
  writeRepositoryArtifact(path.join(OUTPUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const ledger = buildProviderLedger({ rawGraph: getRawRoutingGraph(), mrsManifest: manifest, receipts, outputReceipts });
  writeRepositoryArtifact(options.receiptOutput ? path.resolve(REPO_ROOT, options.receiptOutput) : path.join(OUTPUT_DIR, 'source-ledger.json'), `${JSON.stringify(ledger, null, 2)}\n`);

  if (!options.keepCache) fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(`mihomo mrs sync: converted=${manifest.converted.length} split=${manifest.split.length} partial=${manifest.partial.length} existing=${manifest.existing_mrs.length} retained=${manifest.retained.length} failed=${manifest.failed.length}`);
  if (manifest.failed.length > 0) {
    for (const failure of manifest.failed) console.error(`${failure.id}: ${failure.error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}

module.exports = { parseArgs, downloadSource, ensureMihomoBinary, parsePayloadEntries, classifyEntry };
