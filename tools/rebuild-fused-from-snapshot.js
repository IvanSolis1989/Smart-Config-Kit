#!/usr/bin/env node
'use strict';

// Rebuild generated fused payloads from a committed snapshot while using a
// separately-built probe only for its new first-match ownership topology.
// This keeps an order-only routing fix from accidentally publishing upstream
// rule-list refreshes that happened after the snapshot commit.

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { readHistoricalClientFile } = require('./lib/client-layout');
const {
  buildEgernGenerationManifest,
  getGeneratedEgernRuleSetReferences,
} = require('./lib/egern-generation-manifest');
const { optimizeEntries } = require('./lib/fused-rule-optimizer');
const { convertEntriesToSets } = require('./generate-egern-from-cmfa');

const REPO_ROOT = path.resolve(__dirname, '..');
const FUSED_RELATIVE_ROOT = 'rulesets/generated/fused';
const NATIVE_EGERN_RELATIVE_ROOT = 'rulesets/generated/egern';
const MIHOMO_BUCKETS = ['domain', 'ipcidr', 'ipcidr_no_resolve', 'residual'];
const TEXT_PLATFORMS = ['clash', 'surge', 'quantumultx'];
const ISSUE_176_MOVING_SEGMENT = 'scki-fused-058-intl-site';
const ISSUE_176_DESTINATIONS = [
  'scki-fused-060-cnmedia',
  'scki-fused-061-cn-site',
  'scki-fused-064-intl-site',
];
const ISSUE_176_WINDOW = [
  ISSUE_176_MOVING_SEGMENT,
  'scki-fused-059-payments',
  ...ISSUE_176_DESTINATIONS.slice(0, 2),
  'scki-fused-062-direct',
  'scki-fused-063-cn-site',
  ISSUE_176_DESTINATIONS[2],
];
const MAX_REMOTE_RULE_SET_BYTES = 18 * 1024 * 1024;
const NATIVE_EGERN_SET_ORDER = [
  'domain_set', 'domain_suffix_set', 'domain_keyword_set', 'domain_regex_set', 'domain_wildcard_set',
  'geoip_set', 'ip_cidr_set', 'ip_cidr6_set', 'url_regex_set', 'asn_set', 'user_agent_set',
  'dest_port_set', 'protocol_set',
];
const NATIVE_EGERN_IP_SET_KEYS = new Set(['geoip_set', 'ip_cidr_set', 'ip_cidr6_set', 'asn_set']);

function usage() {
  return [
    'Usage: node tools/rebuild-fused-from-snapshot.js --baseline-ref <git-ref> --probe-root <directory> [--write-root <directory>] [--dry-run]',
    '',
    'Reads payload values from the immutable git baseline and uses the probe only',
    'to determine the new first-match owner for the known moved source window.',
    'Only values whose committed baseline owner is the moved segment may transfer.',
    'Probe-only values are discarded and every other baseline owner is immutable.',
  ].join('\n');
}

function parseArgs(argv) {
  const options = {
    baselineRef: null,
    probeRoot: null,
    writeRoot: null,
    dryRun: false,
    movingSegment: ISSUE_176_MOVING_SEGMENT,
    destinations: ISSUE_176_DESTINATIONS.slice(),
    window: ISSUE_176_WINDOW.slice(),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--baseline-ref') options.baselineRef = argv[++index];
    else if (token === '--probe-root') options.probeRoot = argv[++index];
    else if (token === '--write-root') options.writeRoot = argv[++index];
    else if (token === '--moving-segment') options.movingSegment = argv[++index];
    else if (token === '--destinations') options.destinations = String(argv[++index] || '').split(',').filter(Boolean);
    else if (token === '--window') options.window = String(argv[++index] || '').split(',').filter(Boolean);
    else if (token === '--dry-run') options.dryRun = true;
    else if (token === '--help' || token === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${token}`);
  }
  if (options.help) return options;
  if (!options.baselineRef || !options.probeRoot) throw new Error('--baseline-ref and --probe-root are required');
  if (!options.dryRun && !options.writeRoot) throw new Error('--write-root is required unless --dry-run is used');
  if (!options.window.includes(options.movingSegment)) options.window.unshift(options.movingSegment);
  for (const id of options.destinations) if (!options.window.includes(id)) options.window.push(id);
  return options;
}

function normalizeText(value) {
  return String(value || '').replace(/\r\n/g, '\n');
}

function gitShow(ref, relative) {
  return readHistoricalClientFile(REPO_ROOT, ref, relative.replace(/\\/g, '/'));
}

function readProbe(probeRoot, relative) {
  return fs.readFileSync(path.join(probeRoot, relative));
}

function readJson(buffer, label) {
  try {
    return JSON.parse(Buffer.from(buffer).toString('utf8'));
  } catch (error) {
    throw new Error(`${label}: invalid JSON: ${error.message}`);
  }
}

function recordFiles(record) {
  if (!record) return [];
  if (Array.isArray(record.parts)) return record.parts;
  return record.file ? [record.file] : [];
}

function unquoteYaml(value) {
  const text = String(value || '').trim();
  if (text.startsWith('"')) return JSON.parse(text);
  if (text.startsWith("'")) return text.slice(1, -1).replace(/''/g, "'");
  return text;
}

function parsePayload(buffer) {
  return normalizeText(Buffer.from(buffer).toString('utf8'))
    .split('\n')
    .map((line) => line.match(/^\s*-\s+(.+)$/))
    .filter(Boolean)
    .map((match) => unquoteYaml(match[1]));
}

function renderPayload(entries) {
  return `payload:\n${entries.map((entry) => `  - ${JSON.stringify(entry)}`).join('\n')}\n`;
}

function parseTextList(buffer) {
  return normalizeText(Buffer.from(buffer).toString('utf8'))
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function renderTextList(entries) {
  return `${entries.join('\n')}\n`;
}

function parseEgernYaml(buffer) {
  const result = { scalars: new Map(), sets: new Map() };
  let current = null;
  for (const raw of normalizeText(Buffer.from(buffer).toString('utf8')).split('\n')) {
    if (!raw || raw.startsWith('#')) continue;
    const key = raw.match(/^([a-z0-9_]+):\s*(.*)$/i);
    if (key) {
      current = key[1];
      if (key[2]) result.scalars.set(current, unquoteYaml(key[2]));
      else if (!result.sets.has(current)) result.sets.set(current, []);
      continue;
    }
    const value = raw.match(/^\s+-\s+(.+)$/);
    if (value && current) result.sets.get(current).push(unquoteYaml(value[1]));
  }
  return result;
}

function renderEgernYaml({ scalars, sets }) {
  const lines = ['# Generated by tools/build-fused-rule-sets.js'];
  for (const [key, value] of scalars) lines.push(`${key}: ${JSON.stringify(value)}`);
  for (const [key, values] of sets) {
    if (!values.length) continue;
    lines.push(`${key}:`);
    for (const value of values) lines.push(`  - ${JSON.stringify(value)}`);
  }
  lines.push('');
  return lines.join('\n');
}

function addOwner(map, identity, owner) {
  if (!map.has(identity)) map.set(identity, owner);
}

function collectMihomo(manifest, read) {
  const records = [];
  const owners = new Map();
  const groups = new Map();
  for (const segment of manifest.segments || []) {
    for (const bucket of MIHOMO_BUCKETS) {
      const record = segment.files && segment.files[bucket];
      if (!record) continue;
      const source = record.source || record.file;
      const relative = `${FUSED_RELATIVE_ROOT}/mihomo/${source}`;
      const group = { owner: segment.id, key: bucket, relative, entries: parsePayload(read(relative)) };
      groups.set(`${segment.id}\u0000${bucket}`, group);
      for (const value of group.entries) {
        const identity = `${bucket}\u0000${value}`;
        addOwner(owners, identity, segment.id);
        records.push({ identity, owner: segment.id, key: bucket, value });
      }
    }
  }
  return { records, owners, groups };
}

function collectText(manifest, read, platform) {
  const records = [];
  const owners = new Map();
  const groups = new Map();
  for (const segment of manifest.segments || []) {
    const files = recordFiles(segment.files && segment.files[platform]);
    if (!files.length) continue;
    const entries = files.flatMap((file) => parseTextList(read(`${FUSED_RELATIVE_ROOT}/${platform}/${file}`)));
    const group = { owner: segment.id, key: platform, files, entries };
    groups.set(`${segment.id}\u0000${platform}`, group);
    for (const value of entries) {
      addOwner(owners, value, segment.id);
      records.push({ identity: value, owner: segment.id, key: platform, value });
    }
  }
  return { records, owners, groups };
}

function collectEgern(manifest, read) {
  const records = [];
  const owners = new Map();
  const groups = new Map();
  for (const segment of manifest.segments || []) {
    const record = segment.files && segment.files.egern;
    if (!record || !record.file) continue;
    const relative = `${FUSED_RELATIVE_ROOT}/egern/${record.file}`;
    const parsed = parseEgernYaml(read(relative));
    const group = { owner: segment.id, key: 'egern', relative, parsed };
    groups.set(`${segment.id}\u0000egern`, group);
    for (const [key, values] of parsed.sets) {
      for (const value of values) {
        const identity = `${key}\u0000${value}`;
        addOwner(owners, identity, segment.id);
        records.push({ identity, owner: segment.id, key: 'egern', field: key, value });
      }
    }
  }
  return { records, owners, groups };
}

function collectSingBox(manifest, read) {
  const records = [];
  const owners = new Map();
  const groups = new Map();
  for (const segment of manifest.segments || []) {
    const record = segment.files && segment.files.sing_box;
    if (!record || !record.source) continue;
    const relative = `${FUSED_RELATIVE_ROOT}/sing-box/${record.source}`;
    const parsed = readJson(read(relative), relative);
    const fields = (parsed.rules || []).flatMap((rule) => Object.entries(rule));
    const group = { owner: segment.id, key: 'sing_box', relative, parsed };
    groups.set(`${segment.id}\u0000sing_box`, group);
    for (const [field, values] of fields) {
      if (!Array.isArray(values)) continue;
      for (const value of values) {
        const identity = `${field}\u0000${value}`;
        addOwner(owners, identity, segment.id);
        records.push({ identity, owner: segment.id, key: 'sing_box', field, value });
      }
    }
  }
  return { records, owners, groups };
}

function selectManifestSegments(manifest, ids) {
  const selected = new Set(ids);
  return {
    ...manifest,
    segments: (manifest.segments || []).filter((segment) => selected.has(segment.id)),
  };
}

function groupRecordsByOwner(records) {
  const grouped = new Map();
  for (const record of records) {
    const rows = grouped.get(record.owner) || [];
    rows.push(record);
    grouped.set(record.owner, rows);
  }
  return grouped;
}

function probeOrderFor(manifest, ids) {
  const wanted = new Set(ids);
  const order = new Map();
  for (const [index, segment] of (manifest.segments || []).entries()) {
    if (wanted.has(segment.id)) order.set(segment.id, index);
  }
  return order;
}

// Reconcile a sequence-only source change without trusting the probe payload.
// The probe is an owner/order oracle only for values that were first owned by
// the one segment whose source rules actually moved. This gate is critical:
// dynamic upstream drift can make a probe claim a baseline value from a
// different segment, but that value must never move during an order-only fix.
function reconcileSnapshot({ baseline, probe, movingSegment, destinations, order }) {
  const allowed = new Set(destinations);
  const movingOrder = order.get(movingSegment);
  if (movingOrder === undefined) throw new Error(`missing moving segment in probe order: ${movingSegment}`);

  // `records` are physical payload locations. A value can still appear in a
  // later physical file after an earlier segment already claims it; routing is
  // defined by the first owner map, not by that later location. Retain only
  // baseline-effective values before evaluating the moved segment.
  const effectiveRecords = [];
  const seenEffective = new Set();
  for (const record of baseline.records) {
    if (baseline.owners.get(record.identity) !== record.owner || seenEffective.has(record.identity)) continue;
    seenEffective.add(record.identity);
    effectiveRecords.push(record);
  }
  const recordsByOwner = groupRecordsByOwner(effectiveRecords);
  const output = new Map();
  const push = (owner, record) => {
    const rows = output.get(owner) || [];
    rows.push({ ...record, owner });
    output.set(owner, rows);
  };
  const moved = [];
  const kept = [];

  for (const [owner, records] of recordsByOwner) {
    for (const record of records) {
      if (owner !== movingSegment) {
        push(owner, record);
        continue;
      }
      const probeOwner = probe.owners.get(record.identity);
      if (!probeOwner) {
        throw new Error(`strict-moving-miss: ${movingSegment} value absent from probe: ${record.identity}`);
      }
      if (probeOwner === movingSegment) {
        push(owner, record);
        kept.push(record.identity);
        continue;
      }
      if (!allowed.has(probeOwner)) {
        throw new Error(`unexpected moved owner for ${record.identity}: ${probeOwner} is not an allowed destination`);
      }
      const destinationOrder = order.get(probeOwner);
      if (destinationOrder === undefined || destinationOrder <= movingOrder) {
        throw new Error(`backward/unknown moved owner for ${record.identity}: ${probeOwner}`);
      }
      push(probeOwner, record);
      moved.push({ identity: record.identity, from: movingSegment, to: probeOwner });
    }
  }

  // Reorder only with positions from the topology probe. Probe values are
  // filtered through the immutable baseline records, so no upstream addition
  // can enter the output.
  const ordered = new Map();
  for (const [owner, records] of output) {
    const available = new Map(records.map((record) => [record.identity, record]));
    const next = [];
    const probeRecords = groupRecordsByOwner(probe.records).get(owner) || [];
    for (const record of probeRecords) {
      const value = available.get(record.identity);
      if (!value) continue;
      next.push(value);
      available.delete(record.identity);
    }
    for (const record of records) {
      const value = available.get(record.identity);
      if (!value) continue;
      next.push(value);
      available.delete(record.identity);
    }
    ordered.set(owner, next);
  }

  // Report only values present in this replay window. The full ownership map
  // intentionally spans all segments, so comparing it with a selected window
  // would make the audit report misleadingly count every unrelated payload.
  const probeOnly = [...new Set(probe.records.map((record) => record.identity))]
    .filter((identity) => !baseline.owners.has(identity));
  return {
    grouped: ordered,
    moved,
    kept,
    probeOnly,
    immutableBaselineRecords: effectiveRecords.filter((record) => record.owner !== movingSegment).length,
  };
}

function summarizeAssignments(name, assignment) {
  const byDestination = {};
  for (const move of assignment.moved) byDestination[move.to] = (byDestination[move.to] || 0) + 1;
  return {
    adapter: name,
    moved_values: assignment.moved.length,
    kept_in_moving_segment: assignment.kept.length,
    immutable_baseline_values: assignment.immutableBaselineRecords,
    moved_by_destination: byDestination,
    ignored_probe_only_values: assignment.probeOnly.length,
  };
}

function annotateOriginalOwners(snapshot) {
  for (const record of snapshot.records) record.originalOwner = record.owner;
  return snapshot;
}

function buildPlan({ baselineManifest, probeManifest, baselineRead, probeRead, movingSegment, destinations, window }) {
  const adapters = ['mihomo', ...TEXT_PLATFORMS, 'egern', 'sing_box'];
  const affected = [movingSegment, ...destinations];
  const baselineSelected = selectManifestSegments(baselineManifest, affected);
  const probeSelected = selectManifestSegments(probeManifest, window);
  const order = probeOrderFor(probeManifest, window);
  const plan = {};
  for (const name of adapters) {
    const baseline = adapterSnapshot(name, baselineSelected, baselineRead);
    baseline.owners = collectFirstOwners(name, baselineManifest, baselineRead);
    const probe = adapterSnapshot(name, probeSelected, probeRead);
    probe.owners = collectFirstOwners(name, probeManifest, probeRead);
    const assignment = reconcileSnapshot({ baseline, probe, movingSegment, destinations, order });
    // Keep only the replay result. Full first-owner maps can be million-entry
    // structures (especially sing-box) and are not needed once reconciliation
    // has completed; retaining them turns a deterministic repair into an
    // avoidable multi-gigabyte process.
    plan[name] = { assignment, summary: summarizeAssignments(name, assignment) };
    if (global.gc) global.gc();
  }
  return plan;
}

function adapterSnapshot(name, manifest, read) {
  if (name === 'mihomo') return annotateOriginalOwners(collectMihomo(manifest, read));
  if (name === 'egern') return annotateOriginalOwners(collectEgern(manifest, read));
  if (name === 'sing_box') return annotateOriginalOwners(collectSingBox(manifest, read));
  if (TEXT_PLATFORMS.includes(name)) return annotateOriginalOwners(collectText(manifest, read, name));
  throw new Error(`unknown snapshot adapter: ${name}`);
}

// Build first-match ownership without retaining every payload row. This keeps
// the replay bounded even for the million-entry sing-box target artifacts.
function collectFirstOwners(name, manifest, read) {
  const owners = new Map();
  const add = (identity, owner) => {
    if (!owners.has(identity)) owners.set(identity, owner);
  };
  for (const segment of manifest.segments || []) {
    if (name === 'mihomo') {
      for (const bucket of MIHOMO_BUCKETS) {
        const artifact = segment.files && segment.files[bucket];
        if (!artifact) continue;
        const file = artifact.source || artifact.file;
        for (const value of parsePayload(read(`${FUSED_RELATIVE_ROOT}/mihomo/${file}`))) add(`${bucket}\u0000${value}`, segment.id);
      }
      continue;
    }
    if (TEXT_PLATFORMS.includes(name)) {
      const artifact = segment.files && segment.files[name];
      for (const file of recordFiles(artifact)) {
        for (const value of parseTextList(read(`${FUSED_RELATIVE_ROOT}/${name}/${file}`))) add(value, segment.id);
      }
      continue;
    }
    if (name === 'egern') {
      const artifact = segment.files && segment.files.egern;
      if (!artifact || !artifact.file) continue;
      const parsed = parseEgernYaml(read(`${FUSED_RELATIVE_ROOT}/egern/${artifact.file}`));
      for (const [field, values] of parsed.sets) {
        for (const value of values) add(`${field}\u0000${value}`, segment.id);
      }
      continue;
    }
    if (name === 'sing_box') {
      const artifact = segment.files && segment.files.sing_box;
      if (!artifact || !artifact.source) continue;
      const parsed = readJson(read(`${FUSED_RELATIVE_ROOT}/sing-box/${artifact.source}`), artifact.source);
      for (const rule of parsed.rules || []) {
        for (const [field, values] of Object.entries(rule)) {
          if (!Array.isArray(values)) continue;
          for (const value of values) add(`${field}\u0000${value}`, segment.id);
        }
      }
      continue;
    }
    throw new Error(`unknown snapshot adapter: ${name}`);
  }
  return owners;
}

function getSegment(manifest, id) {
  const segment = (manifest.segments || []).find((candidate) => candidate.id === id);
  if (!segment) throw new Error(`missing segment ${id}`);
  return segment;
}

function writeBuffer(root, relative, content) {
  const target = path.resolve(root, relative);
  const relativeToRoot = path.relative(root, target);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) throw new Error(`refusing to write outside output root: ${relative}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function listGitFiles(ref, relativeRoot) {
  const result = childProcess.spawnSync('git', ['ls-tree', '-r', '--name-only', ref, '--', relativeRoot], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr || `git ls-tree failed for ${relativeRoot}`);
  return String(result.stdout || '').split(/\r?\n/).filter(Boolean);
}

function restoreGitTree(ref, relativeRoot, writeRoot) {
  const target = path.join(writeRoot, relativeRoot);
  fs.rmSync(target, { recursive: true, force: true });
  for (const relative of listGitFiles(ref, relativeRoot)) writeBuffer(writeRoot, relative, gitShow(ref, relative));
}

function removeFiles(root, relatives) {
  for (const relative of new Set(relatives.filter(Boolean))) {
    const target = path.resolve(root, relative);
    const relativeToRoot = path.relative(root, target);
    if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) throw new Error(`refusing to remove outside output root: ${relative}`);
    fs.rmSync(target, { force: true });
  }
}

function textRecordBaseName(record) {
  const files = recordFiles(record);
  if (!files.length) throw new Error('text artifact record has no files');
  return files[0].replace(/-part-\d{3}(\.[^.]+)$/i, '$1');
}

function remoteTextFileRecord(files) {
  if (files.length === 1) return { format: 'text', file: files[0] };
  return { format: 'text', parts: files, max_bytes: MAX_REMOTE_RULE_SET_BYTES };
}

function shardFileName(file, index, total) {
  if (total === 1) return file;
  const extension = path.extname(file);
  const stem = extension ? file.slice(0, -extension.length) : file;
  return `${stem}-part-${String(index + 1).padStart(3, '0')}${extension}`;
}

function splitRemoteText(text, maxBytes = MAX_REMOTE_RULE_SET_BYTES) {
  const source = String(text);
  const parts = [];
  let start = 0;
  let cursor = 0;
  let currentBytes = 0;
  while (cursor < source.length) {
    const newline = source.indexOf('\n', cursor);
    const end = newline === -1 ? source.length : newline + 1;
    const line = source.slice(cursor, end);
    const bytes = Buffer.byteLength(line, 'utf8');
    if (bytes > maxBytes) throw new Error(`single remote rule line exceeds ${maxBytes} bytes`);
    if (currentBytes > 0 && currentBytes + bytes > maxBytes) {
      parts.push(source.slice(start, cursor));
      start = cursor;
      currentBytes = 0;
    }
    currentBytes += bytes;
    cursor = end;
  }
  if (start < source.length || parts.length === 0) parts.push(source.slice(start));
  return parts;
}

function groupedRecords(assignment, owner, predicate = () => true) {
  return (assignment.grouped.get(owner) || []).filter(predicate);
}

function uniqueRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (seen.has(record.identity)) return false;
    seen.add(record.identity);
    return true;
  });
}

function renderMihomoPayload(entries) {
  return `payload:\n${entries.map((entry) => `  - ${JSON.stringify(entry)}`).join('\n')}\n`;
}

function writeMihomoAdapter({ root, baselineManifest, probeManifest, assignment, affectedIds }) {
  const oldFiles = [];
  for (const manifest of [baselineManifest, probeManifest]) {
    for (const id of affectedIds) {
      const files = getSegment(manifest, id).files || {};
      for (const bucket of MIHOMO_BUCKETS) {
        const record = files[bucket];
        if (record && (record.source || record.file)) oldFiles.push(`${FUSED_RELATIVE_ROOT}/mihomo/${record.source || record.file}`, `${FUSED_RELATIVE_ROOT}/mihomo/${record.file}`);
      }
    }
  }
  removeFiles(root, oldFiles);

  const records = new Map();
  for (const id of affectedIds) {
    const segment = getSegment(probeManifest, id);
    const bucketValues = {};
    for (const bucket of MIHOMO_BUCKETS) {
      const values = uniqueRecords(groupedRecords(assignment, id, (record) => record.key === bucket)).map((record) => record.value);
      bucketValues[bucket] = values;
      const artifact = segment.files && segment.files[bucket];
      if (!values.length) {
        if (artifact) throw new Error(`${id}/${bucket}: probe exposes an empty source artifact`);
        continue;
      }
      if (!artifact || !artifact.file) throw new Error(`${id}/${bucket}: missing probe source artifact metadata`);
      writeBuffer(root, `${FUSED_RELATIVE_ROOT}/mihomo/${artifact.source || artifact.file}`, renderMihomoPayload(values));
    }
    records.set(id, bucketValues);
  }
  return records;
}

function writeTextAdapter({ root, platform, baselineManifest, probeManifest, assignment, affectedIds }) {
  const oldFiles = [];
  for (const manifest of [baselineManifest, probeManifest]) {
    for (const id of affectedIds) {
      const record = getSegment(manifest, id).files && getSegment(manifest, id).files[platform];
      for (const file of recordFiles(record)) oldFiles.push(`${FUSED_RELATIVE_ROOT}/${platform}/${file}`);
    }
  }
  removeFiles(root, oldFiles);
  const records = new Map();
  for (const id of affectedIds) {
    const segment = getSegment(probeManifest, id);
    const artifact = segment.files && segment.files[platform];
    const values = uniqueRecords(groupedRecords(assignment, id)).map((record) => record.value);
    if (!artifact) throw new Error(`${id}/${platform}: missing probe artifact metadata`);
    const text = `${values.join('\n')}\n`;
    const base = textRecordBaseName(artifact);
    const parts = splitRemoteText(text);
    const files = parts.map((part, index) => shardFileName(base, index, parts.length));
    for (const [index, file] of files.entries()) writeBuffer(root, `${FUSED_RELATIVE_ROOT}/${platform}/${file}`, parts[index]);
    records.set(id, { values, record: remoteTextFileRecord(files) });
  }
  return records;
}

const FUSED_EGERN_SET_ORDER = [
  'domain_set', 'domain_suffix_set', 'domain_keyword_set', 'domain_regex_set', 'domain_wildcard_set',
  'geoip_set', 'ip_cidr_set', 'ip_cidr6_set', 'asn_set',
];

function renderYamlScalar(value) {
  if (value === 'true' || value === 'false' || value === 'null' || /^-?\d+(?:\.\d+)?$/.test(String(value))) return String(value);
  return JSON.stringify(value);
}

function renderFusedEgern(records, scalars = new Map()) {
  const valuesByField = new Map();
  for (const record of uniqueRecords(records)) {
    const values = valuesByField.get(record.field) || [];
    values.push(record.value);
    valuesByField.set(record.field, values);
  }
  const fields = [...FUSED_EGERN_SET_ORDER, ...[...valuesByField.keys()].filter((field) => !FUSED_EGERN_SET_ORDER.includes(field)).sort()];
  const lines = ['# Generated by tools/build-fused-rule-sets.js'];
  for (const [key, value] of scalars) lines.push(`${key}: ${renderYamlScalar(value)}`);
  for (const field of fields) {
    const values = valuesByField.get(field) || [];
    if (!values.length) continue;
    lines.push(`${field}:`);
    for (const value of values) lines.push(`  - ${JSON.stringify(value)}`);
  }
  lines.push('');
  return lines.join('\n');
}

function writeFusedEgernAdapter({ root, baselineManifest, probeManifest, probeRoot, assignment, affectedIds }) {
  const oldFiles = [];
  for (const manifest of [baselineManifest, probeManifest]) {
    for (const id of affectedIds) {
      const artifact = getSegment(manifest, id).files && getSegment(manifest, id).files.egern;
      if (artifact && artifact.file) oldFiles.push(`${FUSED_RELATIVE_ROOT}/egern/${artifact.file}`);
    }
  }
  removeFiles(root, oldFiles);
  const records = new Map();
  for (const id of affectedIds) {
    const artifact = getSegment(probeManifest, id).files && getSegment(probeManifest, id).files.egern;
    if (!artifact || !artifact.file) throw new Error(`${id}/egern: missing probe artifact metadata`);
    const rows = uniqueRecords(groupedRecords(assignment, id));
    const template = parseEgernYaml(readProbe(probeRoot, `${FUSED_RELATIVE_ROOT}/egern/${artifact.file}`));
    writeBuffer(root, `${FUSED_RELATIVE_ROOT}/egern/${artifact.file}`, renderFusedEgern(rows, template.scalars));
    records.set(id, rows);
  }
  return records;
}

function segmentForNativeEgernAsset(sourceId, segmentIds) {
  if (!String(sourceId).startsWith('provider-')) return null;
  const provider = String(sourceId).slice('provider-'.length);
  return [...segmentIds]
    .sort((left, right) => right.length - left.length)
    .find((segmentId) => provider === segmentId || provider.startsWith(`${segmentId}-`)) || null;
}

function nativeEgernSourceId(buffer, file) {
  const match = normalizeText(Buffer.from(buffer).toString('utf8')).match(/^# Source id:\s+(.+)$/m);
  if (!match) throw new Error(`native Egern rule set ${file} has no source id header`);
  return match[1].trim();
}

function nativeEgernNoResolve(parsed) {
  return String(parsed.scalars.get('no_resolve') || '').toLowerCase() === 'true';
}

function nativeEgernRecords(file, buffer, owner) {
  const parsed = parseEgernYaml(buffer);
  const noResolve = nativeEgernNoResolve(parsed);
  const records = [];
  for (const [field, values] of parsed.sets) {
    if (!NATIVE_EGERN_SET_ORDER.includes(field)) continue;
    for (const value of values) {
      const appliesNoResolve = noResolve && NATIVE_EGERN_IP_SET_KEYS.has(field);
      records.push({
        identity: `${field}\u0000${value}\u0000${appliesNoResolve ? 'no-resolve' : ''}`,
        owner,
        file,
        field,
        value,
        noResolve: appliesNoResolve,
      });
    }
  }
  return records;
}

function collectNativeEgernSnapshot({ profileSource, read, segmentIds, selectedOwners = null }) {
  const records = [];
  const owners = new Map();
  const assetFiles = new Set();
  for (const file of getGeneratedEgernRuleSetReferences(profileSource)) {
    const relative = `${NATIVE_EGERN_RELATIVE_ROOT}/${file}`;
    const buffer = read(relative);
    const owner = segmentForNativeEgernAsset(nativeEgernSourceId(buffer, file), segmentIds);
    if (!owner) continue;
    const entries = nativeEgernRecords(file, buffer, owner);
    for (const entry of entries) if (!owners.has(entry.identity)) owners.set(entry.identity, owner);
    if (!selectedOwners || selectedOwners.has(owner)) {
      assetFiles.add(file);
      records.push(...entries);
    }
  }
  return { records, owners, assetFiles };
}

function nativeEgernEffectiveRecords(snapshot) {
  const first = new Map();
  for (const record of snapshot.records) {
    if (snapshot.owners.get(record.identity) !== record.owner || first.has(record.identity)) continue;
    first.set(record.identity, record);
  }
  return first;
}

function nativeEgernTemplate(buffer) {
  const lines = normalizeText(Buffer.from(buffer).toString('utf8')).split('\n');
  const prefix = [];
  for (const line of lines) {
    const field = line.match(/^([a-z0-9_]+):/i);
    if (field && NATIVE_EGERN_SET_ORDER.includes(field[1])) break;
    prefix.push(line);
  }
  while (prefix.length && !prefix[prefix.length - 1]) prefix.pop();
  return {
    prefix,
    noResolve: prefix.some((line) => /^no_resolve:\s*true\s*$/i.test(line)),
  };
}

function renderNativeEgern(template, records) {
  const byField = new Map();
  for (const record of records) {
    if (NATIVE_EGERN_IP_SET_KEYS.has(record.field) && Boolean(record.noResolve) !== template.noResolve) {
      throw new Error(`native Egern no_resolve mismatch for ${record.file}:${record.field}:${record.value}`);
    }
    const values = byField.get(record.field) || new Set();
    values.add(record.value);
    byField.set(record.field, values);
  }
  const lines = [...template.prefix];
  for (const field of NATIVE_EGERN_SET_ORDER) {
    const values = [...(byField.get(field) || [])].sort();
    if (!values.length) continue;
    lines.push(`${field}:`);
    for (const value of values) lines.push(`  - ${JSON.stringify(value)}`);
  }
  lines.push('');
  return lines.join('\n');
}

function nativeIdentity(field, value, noResolve = false) {
  return `${field}\u0000${value}\u0000${noResolve ? 'no-resolve' : ''}`;
}

function convertedNativeIdentities(rawRecords, behavior, forceNoResolve = false) {
  const optimized = optimizeEntries(rawRecords.map((record) => record.value));
  const converted = convertEntriesToSets(optimized.entries, behavior);
  const output = new Set();
  for (const field of NATIVE_EGERN_SET_ORDER) {
    for (const value of converted.sets[field]) {
      output.add(nativeIdentity(field, value, forceNoResolve && NATIVE_EGERN_IP_SET_KEYS.has(field)));
    }
  }
  return output;
}

function nativeTemplateWithNoResolve(template, noResolve) {
  const prefix = template.prefix.filter((line) => !/^no_resolve:\s*(?:true|false)\s*$/i.test(line));
  if (noResolve) prefix.push('no_resolve: true');
  return { prefix, noResolve };
}

function nativeTemplateForNewFusedAsset(file, noResolve = false) {
  const sourceName = file.replace(/^provider-/, '');
  return {
    prefix: [
      '# Generated by tools/generate-egern-from-cmfa.js',
      `# Source id: provider-${sourceName.replace(/\.yaml$/, '')}`,
      `# Source URL: https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/${sourceName}`,
      ...(noResolve ? ['no_resolve: true'] : []),
    ],
    noResolve,
  };
}

function expectedIssue176NativeEgernReferences(baselineProfile) {
  const remove = 'provider-scki-fused-058-intl-site-ipcidr-no-resolve.yaml';
  const anchor = 'provider-scki-fused-064-intl-site-residual.yaml';
  const additions = [
    'provider-scki-fused-064-intl-site-domain.yaml',
    'provider-scki-fused-064-intl-site-ipcidr.yaml',
    'provider-scki-fused-064-intl-site-ipcidr-no-resolve.yaml',
  ];
  const refs = getGeneratedEgernRuleSetReferences(baselineProfile).filter((file) => file !== remove);
  const index = refs.indexOf(anchor);
  if (index === -1) throw new Error(`baseline Egern profile is missing ${anchor}`);
  refs.splice(index, 0, ...additions);
  return refs;
}

function effectiveNativeRecords(snapshot) {
  const seen = new Set();
  return snapshot.records.filter((record) => {
    if (snapshot.owners.get(record.identity) !== record.owner || seen.has(record.identity)) return false;
    seen.add(record.identity);
    return true;
  });
}

function buildNativeEgernPlan({ baselineRef, baselineManifest, rawMihomoAssignment, affectedIds }) {
  const baselineProfile = gitShow(baselineRef, '独立内核系/Egern/Egern.yaml').toString('utf8');
  const baseline = collectNativeEgernSnapshot({
    profileSource: baselineProfile,
    read: (relative) => gitShow(baselineRef, relative),
    segmentIds: (baselineManifest.segments || []).map((segment) => segment.id),
    selectedOwners: new Set(affectedIds),
  });
  const targetOwner = ISSUE_176_DESTINATIONS[2];
  const movedRaw = (bucket) => groupedRecords(rawMihomoAssignment, targetOwner, (record) => (
    record.originalOwner === ISSUE_176_MOVING_SEGMENT && record.key === bucket
  ));
  const targets = new Map();
  const addTargets = (identities, file) => {
    for (const identity of identities) {
      // A raw value can normalize to a native value already claimed by an
      // earlier Egern asset. It remains absent after the reorder as well.
      if (baseline.owners.get(identity) === ISSUE_176_MOVING_SEGMENT) targets.set(identity, file);
    }
  };
  addTargets(convertedNativeIdentities(movedRaw('domain'), 'domain'), 'provider-scki-fused-064-intl-site-domain.yaml');
  addTargets(convertedNativeIdentities(movedRaw('ipcidr'), 'ipcidr'), 'provider-scki-fused-064-intl-site-ipcidr.yaml');
  addTargets(convertedNativeIdentities(movedRaw('ipcidr_no_resolve'), 'ipcidr', true), 'provider-scki-fused-064-intl-site-ipcidr-no-resolve.yaml');
  for (const record of movedRaw('residual')) {
    const match = String(record.value).match(/^GEOIP,([A-Z]{2})(?:,no-resolve)?$/i);
    if (!match) continue;
    const identity = nativeIdentity('geoip_set', match[1].toUpperCase(), true);
    if (baseline.owners.get(identity) === ISSUE_176_MOVING_SEGMENT) {
      targets.set(identity, 'provider-scki-fused-064-intl-site-residual.yaml');
    }
  }
  if (targets.size !== 1504) {
    throw new Error(`native Egern replay expected 1504 movable baseline values, found ${targets.size}`);
  }

  const changedFiles = new Map([
    ['provider-scki-fused-058-intl-site-domain.yaml', []],
    ['provider-scki-fused-058-intl-site-ipcidr.yaml', []],
    ['provider-scki-fused-058-intl-site-residual.yaml', []],
    ['provider-scki-fused-064-intl-site-domain.yaml', []],
    ['provider-scki-fused-064-intl-site-ipcidr.yaml', []],
    ['provider-scki-fused-064-intl-site-ipcidr-no-resolve.yaml', []],
    ['provider-scki-fused-064-intl-site-residual.yaml', []],
  ]);
  for (const record of effectiveNativeRecords(baseline)) {
    let targetFile = record.file;
    if (record.owner === ISSUE_176_MOVING_SEGMENT && targets.has(record.identity)) targetFile = targets.get(record.identity);
    if (!changedFiles.has(targetFile)) continue;
    changedFiles.get(targetFile).push({ ...record, file: targetFile });
  }
  for (const [file, records] of changedFiles) {
    if (!records.length) throw new Error(`native Egern rebuilt rule set is empty: ${file}`);
  }

  const baselineTemplate = (file) => nativeEgernTemplate(gitShow(baselineRef, `${NATIVE_EGERN_RELATIVE_ROOT}/${file}`));
  const templates = new Map([
    ['provider-scki-fused-058-intl-site-domain.yaml', nativeTemplateWithNoResolve(baselineTemplate('provider-scki-fused-058-intl-site-domain.yaml'), false)],
    ['provider-scki-fused-058-intl-site-ipcidr.yaml', nativeTemplateWithNoResolve(baselineTemplate('provider-scki-fused-058-intl-site-ipcidr.yaml'), false)],
    ['provider-scki-fused-058-intl-site-residual.yaml', nativeTemplateWithNoResolve(baselineTemplate('provider-scki-fused-058-intl-site-residual.yaml'), false)],
    ['provider-scki-fused-064-intl-site-domain.yaml', nativeTemplateForNewFusedAsset('provider-scki-fused-064-intl-site-domain.yaml')],
    ['provider-scki-fused-064-intl-site-ipcidr.yaml', nativeTemplateForNewFusedAsset('provider-scki-fused-064-intl-site-ipcidr.yaml')],
    ['provider-scki-fused-064-intl-site-ipcidr-no-resolve.yaml', nativeTemplateForNewFusedAsset('provider-scki-fused-064-intl-site-ipcidr-no-resolve.yaml', true)],
    ['provider-scki-fused-064-intl-site-residual.yaml', nativeTemplateWithNoResolve(baselineTemplate('provider-scki-fused-064-intl-site-residual.yaml'), true)],
  ]);
  return {
    baselineProfile,
    expectedReferences: expectedIssue176NativeEgernReferences(baselineProfile),
    changedFiles,
    templates,
    removedFiles: ['provider-scki-fused-058-intl-site-ipcidr-no-resolve.yaml'],
    summary: {
      adapter: 'native-egern',
      moved_values: targets.size,
      kept_in_moving_segment: effectiveNativeRecords(baseline).filter((record) => record.owner === ISSUE_176_MOVING_SEGMENT && !targets.has(record.identity)).length,
      immutable_baseline_values: effectiveNativeRecords(baseline).filter((record) => record.owner !== ISSUE_176_MOVING_SEGMENT).length,
      moved_by_destination: { [targetOwner]: targets.size },
      ignored_probe_only_values: 0,
    },
  };
}

function writeNativeEgernSnapshot({ root, baselineRef, nativePlan }) {
  const activeProfile = fs.readFileSync(path.join(root, '独立内核系/Egern/Egern.yaml'), 'utf8');
  const expectedFiles = getGeneratedEgernRuleSetReferences(activeProfile);
  if (JSON.stringify(expectedFiles) !== JSON.stringify(nativePlan.expectedReferences)) {
    throw new Error('active Egern profile has unrelated native rule-set topology drift');
  }

  restoreGitTree(baselineRef, NATIVE_EGERN_RELATIVE_ROOT, root);
  removeFiles(root, [
    ...nativePlan.removedFiles,
    ...nativePlan.changedFiles.keys(),
  ].map((file) => `${NATIVE_EGERN_RELATIVE_ROOT}/${file}`));
  for (const [file, records] of nativePlan.changedFiles) {
    writeBuffer(root, `${NATIVE_EGERN_RELATIVE_ROOT}/${file}`, renderNativeEgern(nativePlan.templates.get(file), records));
  }
  return {
    files: [...nativePlan.changedFiles.keys()].sort(),
    movedValues: nativePlan.summary.moved_values,
  };
}

function rebuildNativeEgernManifest({ root, baselineRef, fusedManifest }) {
  const baseline = readJson(gitShow(baselineRef, `${NATIVE_EGERN_RELATIVE_ROOT}/manifest.json`), 'baseline Egern manifest');
  const rendered = baseline.rendered || {};
  const manifest = buildEgernGenerationManifest({
    assetRevision: fusedManifest.asset_revision,
    cmfaSource: fs.readFileSync(path.join(root, 'Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml'), 'utf8'),
    routingGraphSource: fs.readFileSync(path.join(root, 'rulesets/source/routing-graph.js'), 'utf8'),
    profileSource: fs.readFileSync(path.join(root, '独立内核系/Egern/Egern.yaml'), 'utf8'),
    generatedRuleSetDirectory: path.join(root, NATIVE_EGERN_RELATIVE_ROOT),
    sourceProviderCount: fusedManifest.fused_provider_count,
    sourceRuleCount: fusedManifest.fused_rule_count,
    ruleSetStats: {
      totalEntries: rendered.source_entry_count,
      removedEntries: rendered.dedup_removed,
      globalExactDuplicates: rendered.global_exact_duplicates_removed,
      emptyAssets: rendered.empty_asset_count,
    },
  });
  writeBuffer(root, `${NATIVE_EGERN_RELATIVE_ROOT}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
}

function renderSingBox(records, template) {
  const valuesByField = new Map();
  for (const record of uniqueRecords(records)) {
    const values = valuesByField.get(record.field) || [];
    values.push(record.value);
    valuesByField.set(record.field, values);
  }
  const templateFields = ((template.rules || []).flatMap((rule) => Object.keys(rule))).filter((field, index, all) => all.indexOf(field) === index);
  const fields = [...templateFields, ...[...valuesByField.keys()].filter((field) => !templateFields.includes(field)).sort()];
  const rule = {};
  for (const field of fields) {
    const values = valuesByField.get(field) || [];
    if (values.length) rule[field] = values;
  }
  return `${JSON.stringify({ version: 3, rules: Object.keys(rule).length ? [rule] : [] }, null, 2)}\n`;
}

function writeSingBoxAdapter({ root, baselineManifest, probeManifest, probeRoot, assignment, affectedIds }) {
  const oldFiles = [];
  for (const manifest of [baselineManifest, probeManifest]) {
    for (const id of affectedIds) {
      const artifact = getSegment(manifest, id).files && getSegment(manifest, id).files.sing_box;
      if (artifact) oldFiles.push(`${FUSED_RELATIVE_ROOT}/sing-box/${artifact.source}`, `${FUSED_RELATIVE_ROOT}/sing-box/${artifact.file}`);
    }
  }
  removeFiles(root, oldFiles);
  const records = new Map();
  for (const id of affectedIds) {
    const artifact = getSegment(probeManifest, id).files && getSegment(probeManifest, id).files.sing_box;
    if (!artifact || !artifact.source || !artifact.file) throw new Error(`${id}/sing-box: missing probe artifact metadata`);
    const template = readJson(readProbe(probeRoot, `${FUSED_RELATIVE_ROOT}/sing-box/${artifact.source}`), artifact.source);
    const rows = uniqueRecords(groupedRecords(assignment, id));
    writeBuffer(root, `${FUSED_RELATIVE_ROOT}/sing-box/${artifact.source}`, renderSingBox(rows, template));
    records.set(id, rows);
  }
  return records;
}

function compileRuleSets(root, manifest, affectedIds) {
  const mihomo = path.join(root, '.cache', 'mihomo-mrs', 'mihomo-v1.19.28.exe');
  const singBox = path.join(root, '.cache', 'fused-rule-sets', 'sing-box', 'sing-box.exe');
  if (!fs.existsSync(mihomo)) throw new Error(`missing fixed Mihomo compiler: ${mihomo}`);
  if (!fs.existsSync(singBox)) throw new Error(`missing fixed sing-box compiler: ${singBox}`);
  for (const id of affectedIds) {
    const segment = getSegment(manifest, id);
    for (const bucket of ['domain', 'ipcidr', 'ipcidr_no_resolve']) {
      const artifact = segment.files && segment.files[bucket];
      if (!artifact) continue;
      const behavior = bucket === 'domain' ? 'domain' : 'ipcidr';
      const source = path.join(root, FUSED_RELATIVE_ROOT, 'mihomo', artifact.source);
      const target = path.join(root, FUSED_RELATIVE_ROOT, 'mihomo', artifact.file);
      const result = childProcess.spawnSync(mihomo, ['convert-ruleset', behavior, 'yaml', source, target], { cwd: root, encoding: 'utf8' });
      if (result.status !== 0) throw new Error(`Mihomo compilation failed for ${artifact.source}: ${result.stderr || result.stdout}`);
    }
    const sing = segment.files && segment.files.sing_box;
    if (!sing) continue;
    const source = path.join(root, FUSED_RELATIVE_ROOT, 'sing-box', sing.source);
    const target = path.join(root, FUSED_RELATIVE_ROOT, 'sing-box', sing.file);
    const result = childProcess.spawnSync(singBox, ['rule-set', 'compile', '--output', target, source], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`sing-box compilation failed for ${sing.source}: ${result.stderr || result.stdout}`);
  }
}

function targetIpCount(values) {
  return values.filter((value) => /^(?:IP-CIDR6?|SRC-IP-CIDR|GEOIP|IP-ASN),/i.test(String(value))).length;
}

function simpleTargetOptimization(count) {
  return {
    input: count,
    output: count,
    exactDuplicates: 0,
    domainSubsumed: 0,
    cidrSubsumed: 0,
    normalized: 0,
    globalExactDuplicates: 0,
  };
}

function simpleRawOptimization(values) {
  const buckets = {};
  let output = 0;
  for (const [bucket, entries] of Object.entries(values)) {
    const count = entries.length;
    output += count;
    const manifestBucket = bucket === 'ipcidr_no_resolve' ? 'ipcidrNoResolve' : bucket;
    buckets[manifestBucket] = {
      input: count,
      output: count,
      exactDuplicates: 0,
      domainSubsumed: 0,
      cidrSubsumed: 0,
      normalized: 0,
      globalExactDuplicates: 0,
    };
  }
  return { input: output, output, exactDuplicates: 0, domainSubsumed: 0, cidrSubsumed: 0, normalized: 0, removed: 0, buckets, globalExactDuplicates: 0 };
}

function updateAffectedManifest({ baselineManifest, probeManifest, rawRecords, textRecords, egernRecords, singBoxRecords }) {
  const finalManifest = JSON.parse(JSON.stringify(baselineManifest));
  for (const key of [
    'generated_at', 'baseline_version', 'source_provider_count', 'source_rule_count',
    'fused_provider_count', 'fused_rule_count', 'inline_rule_count', 'segment_count',
    'generated_mrs_files', 'generated_srs_files', 'sing_box_binary', 'remote_asset_max_bytes',
    'optimization', 'pruned_empty_segments', 'unresolved_providers', 'unresolved_sources',
    'passthrough_providers', 'required_support_providers', 'inline_rules',
    'generated_passwall_files', 'generated_xray_fused_segments',
  ]) {
    if (Object.hasOwn(probeManifest, key)) finalManifest[key] = probeManifest[key];
  }
  const probeById = new Map((probeManifest.segments || []).map((segment) => [segment.id, segment]));
  finalManifest.segments = (finalManifest.segments || []).map((baselineSegment) => {
    if (!rawRecords.has(baselineSegment.id)) return baselineSegment;
    const probe = JSON.parse(JSON.stringify(probeById.get(baselineSegment.id)));
    const values = rawRecords.get(baselineSegment.id);
    probe.counts = Object.fromEntries(MIHOMO_BUCKETS.map((bucket) => [bucket, (values[bucket] || []).length]));
    probe.optimization = simpleRawOptimization(values);
    for (const bucket of MIHOMO_BUCKETS) {
      if (!probe.counts[bucket]) delete probe.files[bucket];
    }
    for (const platform of TEXT_PLATFORMS) probe.files[platform] = textRecords.get(platform).get(baselineSegment.id).record;
    // Egern has no split text representation, but force its recreated record
    // from the topology probe so the manifest never points at a stale file.
    if (!egernRecords.get(baselineSegment.id).length) delete probe.files.egern;
    const mobileValues = textRecords.get('surge').get(baselineSegment.id).values;
    const singBoxValues = singBoxRecords.get(baselineSegment.id);
    probe.target_counts = { mobile: mobileValues.length, sing_box: singBoxValues.length };
    probe.target_ip_counts = {
      mobile: targetIpCount(mobileValues),
      sing_box: singBoxValues.filter((record) => /(?:^|_)ip_cidr$/.test(record.field) || record.field === 'source_ip_cidr').length,
    };
    probe.target_optimization = {
      mobile: simpleTargetOptimization(mobileValues.length),
      sing_box: simpleTargetOptimization(singBoxValues.length),
    };
    return probe;
  });
  return finalManifest;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const baselineManifest = readJson(gitShow(options.baselineRef, `${FUSED_RELATIVE_ROOT}/manifest.json`), 'baseline manifest');
  const probeManifest = readJson(readProbe(options.probeRoot, `${FUSED_RELATIVE_ROOT}/manifest.json`), 'probe manifest');
  const baselineRead = (relative) => gitShow(options.baselineRef, relative);
  const probeRead = (relative) => readProbe(options.probeRoot, relative);
  const affectedIds = [options.movingSegment, ...options.destinations];
  const plan = buildPlan({
    baselineManifest,
    probeManifest,
    baselineRead,
    probeRead,
    movingSegment: options.movingSegment,
    destinations: options.destinations,
    window: options.window,
  });
  const nativeEgernPlan = buildNativeEgernPlan({
    baselineRef: options.baselineRef,
    baselineManifest,
    rawMihomoAssignment: plan.mihomo.assignment,
    affectedIds,
  });
  const report = {
    baseline_ref: options.baselineRef,
    probe_root: path.resolve(options.probeRoot),
    write_root: options.writeRoot ? path.resolve(options.writeRoot) : null,
    mode: options.dryRun ? 'dry-run' : 'write',
    moving_segment: options.movingSegment,
    destinations: options.destinations,
    window: options.window,
    topology: {
      source_rule_count: probeManifest.source_rule_count,
      fused_provider_count: probeManifest.fused_provider_count,
      fused_rule_count: probeManifest.fused_rule_count,
      segment_count: probeManifest.segment_count,
    },
    adapters: Object.values(plan).map((entry) => entry.summary),
    native_egern: nativeEgernPlan.summary,
  };
  console.log(JSON.stringify(report, null, 2));
  if (options.dryRun) return;

  const writeRoot = path.resolve(options.writeRoot);
  if (!fs.existsSync(path.join(writeRoot, 'rulesets'))) throw new Error(`write root is not a repository worktree: ${writeRoot}`);

  // Start from committed generated bytes; the probe never becomes an input
  // payload. That isolates this ordering fix from unpinned upstream updates.
  restoreGitTree(options.baselineRef, FUSED_RELATIVE_ROOT, writeRoot);
  const rawRecords = writeMihomoAdapter({
    root: writeRoot,
    baselineManifest,
    probeManifest,
    assignment: plan.mihomo.assignment,
    affectedIds,
  });
  const textRecords = new Map();
  for (const platform of TEXT_PLATFORMS) {
    textRecords.set(platform, writeTextAdapter({
      root: writeRoot,
      platform,
      baselineManifest,
      probeManifest,
      assignment: plan[platform].assignment,
      affectedIds,
    }));
  }
  const egernRecords = writeFusedEgernAdapter({
    root: writeRoot,
    baselineManifest,
    probeManifest,
    probeRoot: options.probeRoot,
    assignment: plan.egern.assignment,
    affectedIds,
  });
  const singBoxRecords = writeSingBoxAdapter({
    root: writeRoot,
    baselineManifest,
    probeManifest,
    probeRoot: options.probeRoot,
    assignment: plan.sing_box.assignment,
    affectedIds,
  });
  const finalManifest = updateAffectedManifest({
    baselineManifest,
    probeManifest,
    rawRecords,
    textRecords,
    egernRecords,
    singBoxRecords,
  });
  finalManifest.snapshot_replay = {
    baseline_ref: options.baselineRef,
    moving_segment: options.movingSegment,
    allowed_destinations: options.destinations,
    probe_payload_values_discarded: true,
  };
  writeBuffer(writeRoot, `${FUSED_RELATIVE_ROOT}/manifest.json`, `${JSON.stringify(finalManifest, null, 2)}\n`);
  compileRuleSets(writeRoot, finalManifest, affectedIds);
  writeNativeEgernSnapshot({
    root: writeRoot,
    baselineRef: options.baselineRef,
    nativePlan: nativeEgernPlan,
  });
  rebuildNativeEgernManifest({ root: writeRoot, baselineRef: options.baselineRef, fusedManifest: finalManifest });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.stack || error.message);
    process.exit(1);
  }
}

module.exports = {
  buildPlan,
  collectFirstOwners,
  collectEgern,
  collectMihomo,
  collectSingBox,
  collectText,
  collectNativeEgernSnapshot,
  buildNativeEgernPlan,
  parseEgernYaml,
  parsePayload,
  parseTextList,
  renderEgernYaml,
  renderPayload,
  renderTextList,
  reconcileSnapshot,
  renderNativeEgern,
};
