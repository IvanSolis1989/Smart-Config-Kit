#!/usr/bin/env node
'use strict';

// Deliberately narrow: replay the frozen GoogleFCM DOWNLOAD -> GOOGLE change.
// No upstream acquisition, arbitrary policy editing, or loosening of snapshot gates.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const { Module, createRequire } = require('node:module');
const compiler = require('./build-fused-rule-sets');
const ROOT = path.resolve(__dirname, '..');
const SOURCE = 'rulesets/source/routing-graph.js';
const FUSED = 'rulesets/generated/fused';
const DOWNLOAD = '📥 下载更新', GOOGLE = '🔍 Google 服务';
const BUCKETS = { domain: 'domain', ipcidr: 'ipcidr', ipcidrNoResolve: 'ipcidr_no_resolve', residual: 'residual' };
const INLINE = new Set(['AND', 'OR', 'NOT', 'DST-PORT', 'SRC-PORT', 'MATCH', 'FINAL', 'NETWORK']);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const lf = bytes => String(bytes).replace(/\r\n/g, '\n');
const json = value => JSON.stringify(value, null, 2) + '\n';
function insist(ok, message) { if (!ok) throw new Error(message); }
function read(root, file) { return fs.readFileSync(path.join(root, file)); }
function stableProvider(value) {
  return JSON.stringify(value).replace(/([?&]scki=)v\d+\.\d+\.\d+/g, '$1__revision__').replace(/\.\/ruleset\/v\d+\.\d+\.\d+\//g, './ruleset/__revision__/');
}
function assertSourceChange(before, after) {
  const oldRule = 'RULE-SET,googlefcm,${BIZ.DOWNLOAD}';
  insist(lf(before).split(oldRule).length === 2, 'Expected one old GoogleFCM source rule');
  const stripVersion = text => lf(text).replace(/^const SOURCE_GRAPH_VERSION = ['"]v\d+\.\d+\.\d+['"];$/m, 'const SOURCE_GRAPH_VERSION = "__version__";');
  insist(stripVersion(before).replace(oldRule, 'RULE-SET,googlefcm,${BIZ.GOOGLE}') === stripVersion(after), 'Unsupported source change: only GoogleFCM target and source version may change');
}
function assertGraphChange(before, after, normalized = true) {
  insist(stableProvider(before.providers) === stableProvider(after.providers), 'Retarget requires unchanged provider definitions');
  const ids = normalized ? ['googlefcm-domain', 'googlefcm-ipcidr'] : ['googlefcm'];
  const expected = before.rules.map(rule => {
    const found = ids.find(id => rule === `RULE-SET,${id},${DOWNLOAD}`);
    return found ? `RULE-SET,${found},${GOOGLE}` : rule;
  });
  insist(ids.every(id => before.rules.filter(rule => rule === `RULE-SET,${id},${DOWNLOAD}`).length === 1), 'Missing or duplicate GoogleFCM source identity');
  insist(JSON.stringify(expected) === JSON.stringify(after.rules), 'Retarget permits only googlefcm DOWNLOAD -> GOOGLE at the original rule position');
}
function timelineFor(rules, segments, catalog) {
  const all = new Map(catalog.flatMap(row => row.source_rules.map(rule => [rule, row.id])));
  const active = new Map(segments.map(row => [row.id, row]));
  const emitted = new Set(), timeline = [];
  for (const rule of rules) {
    const id = all.get(rule);
    if (id) {
      if (!emitted.has(id) && active.has(id)) { timeline.push({ type: 'segment', segment: active.get(id) }); emitted.add(id); }
    } else {
      insist(INLINE.has(rule.split(',')[0]), `Unexpected non-inline source rule: ${rule}`);
      timeline.push({ type: 'inline', rule });
    }
  }
  return timeline;
}
function planRetarget({ before, after, manifest, buckets, providerEntries }) {
  assertGraphChange(before, after);
  for (const key of ['unresolved_providers', 'unresolved_sources', 'passthrough_providers']) insist(Array.isArray(manifest[key]) && manifest[key].length === 0, `Unresolved frozen manifest: ${key}`);
  const oldCatalog = compiler.getSourceSegmentCatalog(before.rules);
  insist(JSON.stringify(oldCatalog) === JSON.stringify(manifest.source_segments), 'Frozen source catalog differs from source graph');
  const newCatalog = compiler.getSourceSegmentCatalog(after.rules);
  // This named migration has two existing adjacent policies. Refuse a topology redesign.
  insist(JSON.stringify(oldCatalog.map(row => [row.id, row.policy])) === JSON.stringify(newCatalog.map(row => [row.id, row.policy])), 'Unsupported retarget segment topology');
  const donor = oldCatalog.find(row => row.source_rules.includes(`RULE-SET,googlefcm-domain,${DOWNLOAD}`));
  const target = newCatalog.find(row => row.source_rules.includes(`RULE-SET,googlefcm-domain,${GOOGLE}`));
  insist(donor && target && donor.id !== target.id, 'Missing distinct donor/target source identities');
  const segments = manifest.segments.map(row => {
    const catalog = newCatalog.find(item => item.id === row.id);
    insist(catalog && buckets[row.id], `Missing frozen segment: ${row.id}`);
    return { id: row.id, policy: row.policy, sourceRules: catalog.source_rules.slice(), ...structuredClone(buckets[row.id]), optimization: structuredClone(row.optimization || null), remoteRuleSetFiles: Object.fromEntries(['clash', 'surge', 'quantumultx'].map(key => [key, row.files?.[key] ? row.files[key].parts || [row.files[key].file] : []])) };
  });
  const from = segments.find(row => row.id === donor.id), to = segments.find(row => row.id === target.id);
  const moved = [];
  for (const key of ['domain', 'ipcidr']) {
    insist(Array.isArray(providerEntries[key]) && providerEntries[key].length > 0 && new Set(providerEntries[key]).size === providerEntries[key].length, `Invalid frozen ${key} provider predicates`);
    const entries = new Set(providerEntries[key]);
    insist([...entries].every(entry => from[key].includes(entry)), `FCM ${key} predicate missing from frozen donor`);
    from[key] = from[key].filter(entry => !entries.has(entry));
    to[key].unshift(...entries);
    moved.push(...[...entries].map(entry => ({ bucket: key, entry, from: from.id, to: to.id, no_resolve: false })));
  }
  for (const segment of [from, to]) segment.optimization = compiler.optimizeSegment(segment);
  return { segments, timeline: timelineFor(after.rules, segments, newCatalog), catalog: newCatalog, affectedIds: [from.id, to.id], moved };
}
function loadGraph(root) {
  const file = path.join(root, SOURCE);
  delete require.cache[require.resolve(file)];
  const source = require(file), random = Math.random;
  try {
    Math.random = () => 0;
    const take = graph => ({ version: graph.version, providers: graph['rule-providers'], rules: graph.rules });
    return { raw: take(source.getRawRoutingGraph()), normalized: take(source.getMihomoNormalizedRoutingGraph()) };
  } finally { Math.random = random; }
}
function treeFiles(root, relative) {
  const result = [];
  function visit(dir) {
    for (const item of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const file = `${dir}/${item.name}`;
      insist(!item.isSymbolicLink(), `Symlink in frozen assets: ${file}`);
      if (item.isDirectory()) visit(file); else result.push(file);
    }
  }
  visit(relative); return result.sort((a, b) => a.localeCompare(b, 'en'));
}
function snapshotInventory(root) { return treeFiles(root, FUSED).map(file => ({ path: file, sha256: sha(read(root, file)) })); }
function fusedPayloadDigest(root) {
  const files = ['mihomo', 'clash', 'surge', 'quantumultx', 'egern', 'sing-box'].flatMap(dir => treeFiles(root, `${FUSED}/${dir}`));
  const digest = crypto.createHash('sha256');
  for (const file of files.sort((a, b) => a.localeCompare(b, 'en'))) {
    const bytes = read(root, file), canonical = /\.(?:mrs|srs)$/.test(file) ? bytes : Buffer.from(lf(bytes));
    digest.update(file + '\0' + sha(canonical) + '\n');
  }
  return digest.digest('hex');
}
function assertInventory(root, rows) {
  insist(JSON.stringify(snapshotInventory(root)) === JSON.stringify(rows), 'Fused assets changed after the frozen baseline; preserve and reconcile that work first');
}
function decodeProvider({ baselineRoot, mihomoBin, temporary }) {
  insist(path.isAbsolute(mihomoBin) && fs.existsSync(mihomoBin), 'An existing absolute Mihomo binary is required; downloads are forbidden');
  const manifest = JSON.parse(read(baselineRoot, 'rulesets/generated/mihomo-mrs/manifest.json'));
  const row = ['converted', 'split', 'partial'].flatMap(key => manifest[key] || []).filter(item => item.id === 'googlefcm');
  insist(row.length === 1 && row[0].source_entry_count === 41 && row[0].generated.length === 2, 'Frozen GoogleFCM manifest must contain 15 domains and 26 IPs');
  const entries = {}, origins = [];
  for (const behavior of ['domain', 'ipcidr']) {
    const asset = row[0].generated.find(item => item.behavior === behavior);
    insist(asset && asset.file === `googlefcm-${behavior}.mrs`, 'Unexpected GoogleFCM MRS identity');
    const file = `rulesets/generated/mihomo-mrs/${asset.file}`, bytes = read(baselineRoot, file);
    insist(asset.output_receipt?.content?.sha256 === sha(bytes), `Frozen MRS hash mismatch: ${file}`);
    insist(sha(read(ROOT, file)) === sha(bytes), `Current MRS input differs from frozen baseline: ${file}`);
    const target = path.join(temporary, `${behavior}.txt`);
    const run = cp.spawnSync(mihomoBin, ['convert-ruleset', behavior, 'mrs', path.join(baselineRoot, file), target], { windowsHide: true, encoding: 'utf8' });
    insist(!run.error && run.status === 0, `Native GoogleFCM decode failed: ${run.stderr || run.error || ''}`);
    const values = fs.readFileSync(target, 'utf8').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    insist(values.length === (behavior === 'domain' ? 15 : 26) && values.length === asset.entries, `Unexpected native GoogleFCM ${behavior} count`);
    insist(values.every(value => behavior === 'domain' ? /^[a-z0-9.-]+$/.test(value) : /^\d+\.\d+\.\d+\.\d+\/32$/.test(value)), 'GoogleFCM inputs are outside the exact-domain/IPv4-/32 contract');
    entries[behavior] = values.map(value => `${behavior === 'domain' ? 'DOMAIN' : 'IP-CIDR'},${value}`);
    origins.push({ path: file, sha256: sha(bytes), predicates: values.length });
  }
  return { entries, origins };
}
function readBuckets(root, manifest) {
  return Object.fromEntries(manifest.segments.map(row => [row.id, Object.fromEntries(Object.entries(BUCKETS).map(([key, field]) => {
    const record = row.files[field];
    const values = record ? compiler.parsePayloadEntries(lf(read(root, `${FUSED}/mihomo/${record.source || record.file}`))) : [];
    const entries = key === 'domain' ? values.map(value => value.startsWith('+.') ? `DOMAIN-SUFFIX,${value.slice(2)}` : value.startsWith('.') ? `DOMAIN-WILDCARD,*${value}` : value.includes('*') ? `DOMAIN-WILDCARD,${value}` : `DOMAIN,${value}`) : key === 'residual' ? values : values.map(value => `${value.includes(':') ? 'IP-CIDR6' : 'IP-CIDR'},${value}`);
    insist(entries.length === row.counts[field], `Frozen bucket count differs: ${row.id}/${field}`);
    return [key, entries];
  }))]));
}
function loadPlan({ baselineRoot, mihomoBin, temporary }) {
  baselineRoot = fs.realpathSync(baselineRoot);
  insist(baselineRoot !== ROOT, 'Baseline must be a separate frozen directory');
  const sourceBefore = lf(read(baselineRoot, SOURCE)), sourceAfter = lf(read(ROOT, SOURCE));
  assertSourceChange(sourceBefore, sourceAfter);
  for (const file of ['rulesets/source/traffic-options.json', 'rulesets/source/business-dns-policy.json']) insist(lf(read(baselineRoot, file)) === lf(read(ROOT, file)), `Unrelated source input changed: ${file}`);
  for (const directory of ['rulesets/generated/mihomo-mrs', 'rulesets/supplemental']) {
    const files = treeFiles(baselineRoot, directory);
    insist(JSON.stringify(files) === JSON.stringify(treeFiles(ROOT, directory)), `Frozen input inventory changed: ${directory}`);
    for (const file of files) insist(sha(read(baselineRoot, file)) === sha(read(ROOT, file)), `Frozen input changed: ${file}`);
  }
  const before = loadGraph(baselineRoot), after = loadGraph(ROOT);
  assertGraphChange(before.raw, after.raw, false);
  const manifest = JSON.parse(read(baselineRoot, `${FUSED}/manifest.json`));
  insist(manifest.baseline_version === before.normalized.version, 'Frozen manifest/source version differs');
  insist(manifest.payload_fingerprint === fusedPayloadDigest(baselineRoot), 'Frozen payload fingerprint differs from manifest');
  const inventory = snapshotInventory(baselineRoot); assertInventory(ROOT, inventory);
  const decoded = decodeProvider({ baselineRoot, mihomoBin, temporary });
  const plan = planRetarget({ before: before.normalized, after: after.normalized, manifest, buckets: readBuckets(baselineRoot, manifest), providerEntries: decoded.entries });
  return { ...plan, manifest, inventory, baselineRoot, after: after.normalized, sourceBefore, sourceAfter, origins: decoded.origins };
}
// Compile the existing compiler in a private output root. Dependencies still use
// the real reviewed modules; only compiler-owned output paths point to staging.
function stagedCompiler(stage) {
  const filename = path.join(stage, 'tools/build-fused-rule-sets.js');
  const requireOriginal = createRequire(path.join(ROOT, 'tools/build-fused-rule-sets.js'));
  const loaded = new Module(filename, module);
  loaded.filename = filename; loaded.require = request => requireOriginal(request);
  loaded._compile(read(ROOT, 'tools/build-fused-rule-sets.js').toString('utf8'), filename);
  return loaded.exports;
}
function compileSourceAllowed(segments) {
  insist(segments.every(row => row.residual.every(entry => !/^(?:GEOIP|GEOSITE|IP-ASN),/.test(entry))), 'Changed segments require remote materialization; this entry never fetches');
}
function assertDnsBoundary(file, before, after) {
  function fields(text) {
    text = lf(text);
    if (file.endsWith('.js')) return text.match(/function overwriteGeneral\([\s\S]*?(?=\nfunction cleanupSubscription)/)?.[0] || '';
    if (/\.(?:yaml|sh)$/.test(file)) return ['dns', 'hosts', 'sniffer'].map(key => text.match(new RegExp(`^${key}:[\\s\\S]*?(?=^[a-zA-Z][a-zA-Z0-9_-]*:|$(?![\\s\\S]))`, 'm'))?.[0] || '').join('\n');
    return [...text.matchAll(/^\[([^\]]+)\]\n([\s\S]*?)(?=^\[|$(?![\s\S]))/gm)]
      .filter(match => /^(?:general|dns|host|hosts)$/i.test(match[1])).map(match => match[0]).join('\n');
  }
  insist(fields(before) === fields(after), `DNS or sniff boundary changed: ${file}`);
}
function planEgernRetarget({ snapshot, receipt, assets }) {
  const egern = require('./generate-egern-from-cmfa');
  require('./lib/egern-traffic-snapshot').validateSnapshotAssets(snapshot);
  insist(receipt.affected_segments?.length === 2, 'Invalid Egern retarget segment identities');
  const [donor, target] = receipt.affected_segments;
  const moved = receipt.moved_predicates;
  insist(Array.isArray(moved) && moved.length === 41 && moved.every(row => row.from === donor && row.to === target && row.no_resolve === false), 'Invalid Egern moved-predicate receipt');
  const domain = moved.filter(row => row.bucket === 'domain').map(row => row.entry.replace(/^DOMAIN,/, ''));
  const ip = moved.filter(row => row.bucket === 'ipcidr').map(row => row.entry.replace(/^IP-CIDR,/, ''));
  insist(domain.length === 15 && new Set(domain).size === 15 && ip.length === 26 && new Set(ip).size === 26, 'Egern retarget must move exactly 15 domains and 26 IPs');
  const result = { ...snapshot, assets: { ...snapshot.assets }, publishedRendered: { ...snapshot.publishedRendered } };
  const changes = [];
  function assetFor(file, oldText) {
    return assets.get(file) || { file, id: file.slice(0, -5), sourceUrl: oldText?.match(/^# Source URL: (.+)$/m)?.[1], noResolve: false };
  }
  for (const [bucket, values, nativeKey] of [['domain', domain, 'domain_set'], ['ipcidr', ip, 'ip_cidr_set']]) {
    const fromFile = `provider-${donor}-${bucket}.yaml`, toFile = `provider-${target}-${bucket}.yaml`;
    const before = snapshot.assets[fromFile]; insist(typeof before === 'string', `Missing Egern frozen donor asset: ${fromFile}`);
    const from = egern.parseFrozenRuleSet(before);
    const to = snapshot.assets[toFile] ? egern.parseFrozenRuleSet(snapshot.assets[toFile]) : egern.convertEntriesToSets([], 'classical');
    insist(!from.noResolve && !to.noResolve, 'Egern FCM transport must remain ordinary resolving IP semantics');
    insist(values.every(value => from.sets[nativeKey].has(value)), `Egern donor is missing ${bucket} predicates`);
    insist(values.every(value => !to.sets[nativeKey].has(value)), `Egern target already owns ${bucket} predicates`);
    for (const value of values) { from.sets[nativeKey].delete(value); to.sets[nativeKey].add(value); }
    if (Object.values(from.sets).some(set => set.size)) result.assets[fromFile] = egern.renderEgernRuleSet(assetFor(fromFile, before), from);
    else delete result.assets[fromFile];
    insist(assets.has(toFile), `Missing current Egern target rule reference: ${toFile}`);
    result.assets[toFile] = egern.renderEgernRuleSet(assetFor(toFile), to);
    changes.push({ bucket, from: fromFile, to: toFile, moved: values,
      from_before_sha256: sha(before), from_after_sha256: result.assets[fromFile] ? sha(result.assets[fromFile]) : null,
      to_before_sha256: snapshot.assets[toFile] ? sha(snapshot.assets[toFile]) : null, to_after_sha256: sha(result.assets[toFile]) });
  }
  const count = text => Object.values(egern.parseFrozenRuleSet(text).sets).reduce((n, set) => n + set.size, 0);
  const beforeCount = Object.values(snapshot.assets).reduce((n, text) => n + count(text), 0);
  const afterCount = Object.values(result.assets).reduce((n, text) => n + count(text), 0);
  insist(beforeCount === afterCount, 'Egern policy retarget changed the total native predicate count');
  result.publishedRendered.source_entry_count = afterCount;
  result.publishedRendered.native_rule_set_count = Object.keys(result.assets).length;
  result.publishedRendered.empty_asset_count = [...assets.values()].filter(asset => {
    const stem = asset.file.slice(0, -5);
    return !Object.keys(result.assets).some(file => file === asset.file || file.startsWith(stem + '-part-'));
  }).length;
  return { snapshot: result, changes };
}
function assertNativeManifestBridge(snapshot, manifestText) {
  const manifest = JSON.parse(manifestText);
  const without = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
  insist(JSON.stringify(without(manifest.source, ['routing_graph_sha256', 'cmfa_sha256'])) === JSON.stringify(without(snapshot.publishedSource, ['routing_graph_sha256', 'cmfa_sha256'])) &&
    JSON.stringify(without(manifest.rendered, ['profile_sha256'])) === JSON.stringify(without(snapshot.publishedRendered, ['profile_sha256'])), 'Egern historical metadata bridge changed generation counts');
  const historical = { ...manifest, source: snapshot.publishedSource, rendered: snapshot.publishedRendered };
  insist(sha(json(historical)) === snapshot.publishedManifestSha256, 'Egern historical metadata bridge cannot reconstruct frozen manifest hash');
  return { historical_manifest_sha256: snapshot.publishedManifestSha256, frozen_directory_manifest_sha256: sha(lf(manifestText)) };
}
function loadEgernTransition(receiptPath, temporary) {
  const zlib = require('node:zlib');
  const snapshots = require('./lib/egern-traffic-snapshot');
  const receiptBytes = fs.readFileSync(receiptPath), receipt = JSON.parse(receiptBytes);
  insist(receipt.schema_version === 1 && receipt.mode === 'frozen-googlefcm-policy-retarget' && !receipt.render_only, 'Egern requires a completed frozen retarget receipt');
  const baselineRoot = fs.realpathSync(receipt.baseline_root);
  const beforeSource = lf(read(baselineRoot, SOURCE)), afterSource = lf(read(ROOT, SOURCE));
  assertSourceChange(beforeSource, afterSource);
  insist(sha(beforeSource) === receipt.source_before_sha256 && sha(afterSource) === receipt.source_after_sha256, 'Egern policy receipt source binding mismatch');
  const before = loadGraph(baselineRoot), after = loadGraph(ROOT);
  assertGraphChange(before.raw, after.raw, false); assertGraphChange(before.normalized, after.normalized);
  const currentManifest = JSON.parse(read(ROOT, `${FUSED}/manifest.json`));
  insist(receipt.payload_fingerprint === compiler.fusedPayloadReceipt().digest && currentManifest.payload_fingerprint === receipt.payload_fingerprint, 'Egern policy receipt current fused payload binding mismatch');
  insist(currentManifest.traffic_source_fingerprint === compiler.trafficSourceFingerprint(), 'Egern current source fingerprint mismatch');
  insist(JSON.stringify(receipt.source_catalog) === JSON.stringify(currentManifest.source_segments), 'Egern receipt source catalog changed');
  const baselineFused = JSON.parse(read(baselineRoot, `${FUSED}/manifest.json`));
  insist(baselineFused.payload_fingerprint === fusedPayloadDigest(baselineRoot), 'Egern frozen fused payload hash mismatch');
  const donor = baselineFused.source_segments.find(row => row.source_rules.includes(`RULE-SET,googlefcm-domain,${DOWNLOAD}`));
  const target = currentManifest.source_segments.find(row => row.source_rules.includes(`RULE-SET,googlefcm-domain,${GOOGLE}`));
  insist(JSON.stringify(receipt.affected_segments) === JSON.stringify([donor?.id, target?.id]), 'Egern receipt donor/target source identity mismatch');
  for (const file of ['rulesets/source/traffic-options.json', 'rulesets/source/business-dns-policy.json']) insist(lf(read(baselineRoot, file)) === lf(read(ROOT, file)), `Egern unrelated input changed: ${file}`);
  const mihomoBin = process.env.SCKI_MIHOMO_BIN || path.join(ROOT, '.cache/mihomo-mrs/mihomo-v1.19.28.exe');
  const decoded = decodeProvider({ baselineRoot, mihomoBin, temporary });
  insist(JSON.stringify(decoded.origins) === JSON.stringify(receipt.origins), 'Egern receipt origin MRS hashes changed');
  for (const bucket of ['domain', 'ipcidr']) insist(JSON.stringify(decoded.entries[bucket].slice().sort()) === JSON.stringify(receipt.moved_predicates.filter(row => row.bucket === bucket).map(row => row.entry).sort()), 'Egern receipt predicates differ from native GoogleFCM decode');
  const manifestText = lf(read(baselineRoot, 'rulesets/generated/egern/manifest.json'));
  const manifest = JSON.parse(manifestText);
  const snapshotBytes = read(baselineRoot, 'rulesets/generated/egern-traffic-snapshot.json.gz');
  const snapshot = snapshots.validateSnapshotAssets(JSON.parse(zlib.gunzipSync(snapshotBytes)));
  const metadataBridge = assertNativeManifestBridge(snapshot, manifestText);
  insist(JSON.stringify(snapshot.publishedAssets) === JSON.stringify(manifest.assets.files), 'Egern frozen native asset inventory mismatch');
  insist(snapshot.fusedPayloadFingerprint === baselineFused.payload_fingerprint && snapshot.trafficSourceFingerprint === baselineFused.traffic_source_fingerprint, 'Egern frozen snapshot/source binding mismatch');
  insist(manifest.source.routing_graph_sha256 === sha(beforeSource) && manifest.source.cmfa_sha256 === sha(lf(read(baselineRoot, 'Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml'))) &&
    manifest.rendered.profile_sha256 === sha(lf(read(baselineRoot, '独立内核系/Egern/Egern.yaml'))), 'Egern frozen source/profile hash mismatch');
  for (const [file, text] of Object.entries(snapshot.assets)) insist(read(baselineRoot, `rulesets/generated/egern/${file}`).equals(Buffer.from(text)), `Egern frozen native bytes differ: ${file}`);
  return { receipt, receiptSha256: sha(receiptBytes), baselineRoot, snapshot, snapshotSha256: sha(snapshotBytes), metadataBridge };
}
async function retargetEgern(receiptFile) {
  const egern = require('./generate-egern-from-cmfa'), snapshots = require('./lib/egern-traffic-snapshot');
  const receiptPath = path.resolve(receiptFile);
  insist(receiptPath.startsWith(path.join(ROOT, '.cache') + path.sep), 'Egern policy receipt must be inside this worktree .cache');
  insist(require('../rulesets/source/routing-graph').getTrafficOptions().quicPolicy === 'block-foreign', 'Frozen Egern policy retarget requires unchanged block-foreign QUIC');
  const temporary = fs.mkdtempSync(path.join(ROOT, '.cache/egern-policy-input-'));
  const stage = fs.mkdtempSync(path.join(ROOT, 'rulesets/generated/.egern-policy-retarget-'));
  let published = false;
  try {
    const transition = loadEgernTransition(receiptPath, temporary);
    const cmfa = lf(read(ROOT, 'Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml'));
    const providers = egern.parseProviders(cmfa), rules = egern.parseRules(cmfa), assets = egern.discoverAssets(rules, providers);
    const plan = planEgernRetarget({ snapshot: transition.snapshot, receipt: transition.receipt, assets });
    const stats = egern.generateNativeRuleSetsFromSnapshot(assets, plan.snapshot, { outputDir: stage, followRules: false });
    const { output } = egern.renderProfile(rules, providers, assets, stats);
    assertDnsBoundary('Egern.yaml', lf(read(ROOT, '独立内核系/Egern/Egern.yaml')), output);
    const manifest = egern.validateStaged(stage, output, cmfa, providers, rules, stats);
    const changedFiles = new Set(plan.changes.flatMap(row => [row.from, row.to]));
    let unchanged = 0;
    for (const [file, text] of Object.entries(transition.snapshot.assets)) if (!changedFiles.has(file)) {
      insist(read(stage, file).equals(Buffer.from(text)), `Unrelated Egern native asset changed: ${file}`); unchanged++;
    }
    const verified = loadEgernTransition(receiptPath, temporary);
    insist(verified.receiptSha256 === transition.receiptSha256 && verified.snapshotSha256 === transition.snapshotSha256, 'Egern transition input changed during staging');
    const canonical = snapshots.packStagedOutput(stage, manifest);
    const provenance = { mode: 'frozen-googlefcm-policy-retarget', retarget_receipt_sha256: transition.receiptSha256,
      baseline_snapshot_sha256: transition.snapshotSha256, source_before_sha256: transition.receipt.source_before_sha256,
      historical_metadata_bridge: transition.metadataBridge,
      source_after_sha256: transition.receipt.source_after_sha256, fused_payload_fingerprint: transition.receipt.payload_fingerprint,
      moved_domains: 15, moved_ipv4_cidrs: 26, unchanged_native_asset_count: unchanged, changes: plan.changes };
    canonical.policyRetargetProvenance = provenance;
    egern.publishStaged(stage, output, manifest, canonical); published = true;
    snapshots.loadSnapshot();
    const evidence = path.join(path.dirname(receiptPath), 'egern-policy-retarget-receipt.json');
    fs.writeFileSync(evidence, json({ ...provenance, profile_sha256: manifest.rendered.profile_sha256, published_manifest_sha256: canonical.publishedManifestSha256 }));
    console.log(json({ mode: provenance.mode, receipt: evidence, moved_domains: 15, moved_ipv4_cidrs: 26, unchanged_native_asset_count: unchanged, native_assets: Object.keys(canonical.assets).length }));
    return provenance;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
    if (!published) fs.rmSync(stage, { recursive: true, force: true });
  }
}
async function publish(plan, { temporary, mihomoBin, singBoxBin, receiptPath, renderOnly = false }) {
  insist(path.isAbsolute(singBoxBin) && fs.existsSync(singBoxBin), 'An existing absolute sing-box binary is required; downloads are forbidden');
  const stage = path.join(temporary, 'stage'); fs.mkdirSync(stage);
  const staged = stagedCompiler(stage), changed = plan.segments.filter(row => plan.affectedIds.includes(row.id));
  compileSourceAllowed(changed);
  process.env.SCKI_MIHOMO_BIN = mihomoBin; process.env.SCKI_SING_BOX_BIN = singBoxBin;
  const rendered = await staged.writeFusedRuleSets(changed);
  const unaffected = plan.inventory.filter(row => !row.path.endsWith('/manifest.json') && !plan.affectedIds.some(id => path.basename(row.path).startsWith(id + '.')) && !plan.affectedIds.some(id => path.basename(row.path).startsWith(id + '-')));
  for (const row of unaffected) { const dest = path.join(stage, row.path); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(path.join(plan.baselineRoot, row.path), dest); }
  const rows = plan.manifest.segments.map(row => rendered.manifestSegments.find(item => item.id === row.id) || row);
  const fused = staged.mergeFusedRules(plan.segments, plan.timeline, plan.after.providers, new Set(), plan.after.version);
  const manifest = { ...plan.manifest, generated_at: new Date().toISOString(), baseline_version: plan.after.version, asset_revision: plan.after.version,
    source_segments: plan.catalog, fused_provider_count: Object.keys(fused.providers).length, fused_rule_count: fused.rules.length,
    generated_mrs_files: rows.reduce((n, row) => n + ['domain', 'ipcidr', 'ipcidr_no_resolve'].filter(key => row.files[key]).length, 0),
    generated_srs_files: rows.filter(row => row.files.sing_box).length, segments: rows };
  manifest.optimization = { ...manifest.optimization, input: rows.reduce((n, row) => n + row.optimization.input, 0), output: rows.reduce((n, row) => n + row.optimization.output, 0) };
  manifest.optimization.removed = manifest.optimization.input - manifest.optimization.output;
  for (const key of ['exactDuplicates', 'domainSubsumed', 'cidrSubsumed', 'normalized', 'globalExactDuplicates']) manifest.optimization[key] = rows.reduce((n, row) => n + (row.optimization[key] || 0), 0);
  manifest.traffic_source_fingerprint = staged.trafficSourceFingerprint();
  manifest.payload_fingerprint = staged.fusedPayloadReceipt().digest;
  fs.writeFileSync(path.join(stage, FUSED, 'manifest.json'), json(manifest));
  const clients = ['Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js', 'Mihomo内核系/Clash Party/ClashParty(mihomo).js', 'Mihomo内核系/FlClash/FlClash(mihomo).js', 'Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml', 'Mihomo内核系/OpenClash/OpenClash(mihomo).sh', 'Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh', '独立内核系/Shadowrocket/Shadowrocket.conf', '独立内核系/Surge/Surge.conf', '独立内核系/Loon/Loon.conf', '独立内核系/Quantumult X/QuantumultX.conf'];
  const clientHashes = new Map(), clientBefore = new Map();
  for (const file of clients) { const bytes = read(ROOT, file); clientBefore.set(file, bytes); clientHashes.set(file, sha(bytes)); fs.mkdirSync(path.dirname(path.join(stage, file)), { recursive: true }); fs.writeFileSync(path.join(stage, file), bytes); }
  staged.writeClientArtifacts(plan.timeline, plan.after.version, fused);
  for (const file of clients) assertDnsBoundary(file, clientBefore.get(file), read(stage, file));
  for (const row of unaffected) insist(sha(read(stage, row.path)) === row.sha256, `Unrelated frozen asset changed: ${row.path}`);
  insist(lf(read(ROOT, SOURCE)) === plan.sourceAfter, 'Source changed during staging');
  assertInventory(ROOT, plan.inventory);
  for (const [file, hash] of clientHashes) insist(sha(read(ROOT, file)) === hash, `Client changed during staging: ${file}`);
  const receipt = { schema_version: 1, mode: 'frozen-googlefcm-policy-retarget', baseline_root: plan.baselineRoot,
    source_before: { path: SOURCE, version: plan.manifest.baseline_version, sha256: sha(plan.sourceBefore) },
    source_after: { path: SOURCE, version: plan.after.version, sha256: sha(plan.sourceAfter) },
    source_before_sha256: sha(plan.sourceBefore), source_after_sha256: sha(plan.sourceAfter), upstream_fetches: 0,
    origins: plan.origins, moved_predicates: plan.moved, affected_segments: plan.affectedIds,
    unchanged_asset_count: unaffected.length, unchanged_assets_sha256: sha(json(unaffected)),
    source_catalog: plan.catalog, payload_fingerprint: manifest.payload_fingerprint,
    dns_sniffer_unchanged: true,
    clients: clients.map(file => ({ path: file, before_sha256: clientHashes.get(file), after_sha256: sha(read(stage, file)) })) };
  if (renderOnly) {
    receipt.render_only = true;
    if (receiptPath) { fs.mkdirSync(path.dirname(receiptPath), { recursive: true }); fs.writeFileSync(receiptPath, json(receipt)); }
    return receipt;
  }
  const backup = path.join(temporary, 'previous-fused');
  fs.renameSync(path.join(ROOT, FUSED), backup);
  try {
    fs.renameSync(path.join(stage, FUSED), path.join(ROOT, FUSED));
    for (const file of clients) fs.copyFileSync(path.join(stage, file), path.join(ROOT, file));
    fs.mkdirSync(path.dirname(receiptPath), { recursive: true }); fs.writeFileSync(receiptPath, json(receipt));
  } catch (error) {
    fs.rmSync(path.join(ROOT, FUSED), { recursive: true, force: true }); fs.renameSync(backup, path.join(ROOT, FUSED));
    for (const [file, bytes] of clientBefore) fs.writeFileSync(path.join(ROOT, file), bytes);
    throw error;
  }
  return receipt;
}
async function main(argv = process.argv.slice(2)) {
  const options = { write: false };
  for (let i = 0; i < argv.length; i++) {
    const names = { '--baseline-root': 'baselineRoot', '--mihomo-bin': 'mihomoBin', '--sing-box-bin': 'singBoxBin', '--receipt': 'receiptPath' };
    if (argv[i] === '--write') options.write = true;
    else if (argv[i] === '--render-only') options.renderOnly = true;
    else if (names[argv[i]] && argv[i + 1]) options[names[argv[i]]] = path.resolve(argv[++i]);
    else throw new Error('Usage: node tools/retarget-fused-provider.js --baseline-root DIR --mihomo-bin EXE [--sing-box-bin EXE --receipt .cache/file.json --write]');
  }
  insist(options.baselineRoot && options.mihomoBin, 'Frozen baseline and explicit Mihomo compiler are required');
  insist(!(options.write && options.renderOnly), 'Use --write or --render-only separately');
  if (options.write || options.renderOnly) insist(options.receiptPath && options.receiptPath.startsWith(path.join(ROOT, '.cache') + path.sep), 'Write receipt must be inside this worktree .cache');
  fs.mkdirSync(path.join(ROOT, '.cache'), { recursive: true });
  const temporary = fs.mkdtempSync(path.join(ROOT, '.cache/fcm-retarget-'));
  try {
    const plan = loadPlan({ ...options, temporary });
    const receipt = options.write || options.renderOnly ? await publish(plan, { ...options, temporary }) : { dry_run: true, affected_segments: plan.affectedIds, moved_predicates: plan.moved, origins: plan.origins };
    console.log(json({ mode: receipt.mode || 'dry-run', receipt: options.receiptPath || null, render_only: Boolean(options.renderOnly), write: Boolean(options.write),
      affected_segments: plan.affectedIds, moved_domains: plan.moved.filter(row => row.bucket === 'domain').length,
      moved_ipcidr: plan.moved.filter(row => row.bucket === 'ipcidr').length,
      unchanged_asset_count: receipt.unchanged_asset_count, dns_sniffer_unchanged: receipt.dns_sniffer_unchanged })); return receipt;
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}
module.exports = { assertSourceChange, assertGraphChange, assertDnsBoundary, planRetarget, decodeProvider, loadPlan, planEgernRetarget, assertNativeManifestBridge, loadEgernTransition, retargetEgern, main };
if (require.main === module) main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
