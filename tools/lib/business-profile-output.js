'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { clientDirectory } = require('./client-layout');
const { buildProfilePlan } = require('./business-profiles');
const { projectPlatform, segmentFor } = require('./business-profile-platforms');

const ROOT = path.resolve(__dirname, '../..');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const encode = value => `${JSON.stringify(value, null, 2)}\n`;
const insist = (condition, message) => { if (!condition) throw new Error(message); };

function artifactInventory() {
  const entry = (client, name, kind, note) => ({ path: `${clientDirectory(client)}/${name}`, kind, note: note || null,
    ...(kind === 'script' ? { runtimeContract: 'in-place' } : {}) });
  return [
    entry('Clash Party', 'ClashParty(mihomo-smart).js', 'script'),
    entry('Clash Party', 'ClashParty(mihomo).js', 'script'),
    entry('FlClash', 'FlClash(mihomo).js', 'script'),
    entry('Clash Meta For Android', 'CMFA(mihomo).yaml', 'mihomo-yaml'),
    entry('OpenClash', 'OpenClash(mihomo).sh', 'openclash'),
    entry('OpenClash', 'OpenClash(mihomo-smart).sh', 'openclash'),
    entry('Stash', 'Stash.yaml', 'mihomo-yaml', 'Retains the existing Stash field and rule capability limits.'),
    entry('Egern', 'Egern.yaml', 'egern', 'Existing Egern projection omits unsupported process matchers; no process support is added.'),
    entry('Shadowrocket', 'Shadowrocket.conf', 'conf', 'Retains the existing engine-level QUIC and process limitations.'),
    entry('Surge', 'Surge.conf', 'conf', 'Retains the existing engine-level QUIC and iOS process limitations.'),
    entry('Loon', 'Loon.conf', 'conf', 'Retains the existing UDP-port/QUIC and iOS process limitations.'),
    entry('Quantumult X', 'QuantumultX.conf', 'quantumult', 'Existing QX projection omits unsupported logical/process matchers; no support is added.'),
    entry('SingBox', 'SingBox(sing-box)-full.json', 'sing-box', 'Full configuration for the repository sing-box 1.14 target.'),
    entry('SingBox', 'SingBox(sing-box)-1.13.json', 'sing-box', 'Separate existing sing-box 1.13 schema; no fields are migrated.'),
    entry('v2rayN', 'v2rayN(xray).json', 'xray', 'Existing Xray fallback has proxy/direct/block destinations, without nested business selectors.'),
    entry('Passwall', 'Passwall(xray+sing-box)-apply.sh', 'passwall', 'Existing SRS shunt fallback requires a sing-box backend and manual LuCI target selection; no node/DNS/group configuration is implied.'),
    entry('Passwall2', 'Passwall2(xray+sing-box)-apply.sh', 'passwall', 'Existing SRS shunt fallback requires a sing-box backend and manual LuCI target selection; no node/DNS/group configuration is implied.'),
    entry('Karing', 'diversion_rules_custom.json', 'karing', 'Rules only; node groups, DNS and the final default action remain Karing App settings.'),
    { path: 'Meow内核系/Meow/Meow(meow).yaml', kind: 'mihomo-yaml', note: 'Existing Meow native candidate; a generated profile does not certify App/core import or connection acceptance.' },
    { path: 'Meow内核系/Aerove Lite/AeroveLite(meow).js', kind: 'script', runtimeContract: 'clone', note: 'Existing AEROVE Lite candidate requires a main(config) JS host; input cloning, published resource shards and App safety budgets are preserved. App acceptance remains separate.' },
  ];
}

function assertNoSymlinkAncestors(target) {
  let current = path.resolve(target);
  for (;;) {
    try { insist(!fs.lstatSync(current).isSymbolicLink(), `Refusing symlink/junction path: ${current}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

function validateOutputDirectory(outputDir, root = ROOT) {
  insist(typeof outputDir === 'string' && outputDir.trim(), '--output-dir is required');
  const output = path.resolve(outputDir);
  assertNoSymlinkAncestors(output);
  try { fs.lstatSync(output); throw new Error(`Output already exists; choose a new independent directory: ${output}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const relative = path.relative(root, output);
  insist(relative && relative !== '.', 'Refusing repository root output');
  if (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative)) {
    const top = relative.split(path.sep)[0];
    if (top !== '.cache' && top !== '.artifacts') {
      insist(!fs.existsSync(path.join(root, top)), 'Output cannot be inside an existing repository source/client directory; use .cache or an external directory');
    }
  }
  insist(fs.statSync(path.dirname(output)).isDirectory(), 'The output parent directory must already exist');
  return output;
}

function safeSource(root, relative) {
  insist(typeof relative === 'string' && !path.isAbsolute(relative) && !relative.split(/[\\/]/).some(part => !part || part === '..' || part === '.'), 'Unsafe profile artifact path');
  const source = path.resolve(root, relative);
  insist(source.startsWith(`${root}${path.sep}`), 'Profile source escaped repository');
  assertNoSymlinkAncestors(source);
  insist(fs.statSync(source).isFile(), `Profile source is not a file: ${relative}`);
  return source;
}

function publishDirectory(staging, outputDir) {
  assertNoSymlinkAncestors(outputDir);
  try { fs.lstatSync(outputDir); throw new Error(`Output appeared before publication; refusing overwrite: ${outputDir}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (process.platform === 'win32') {
    // Windows directory rename refuses an existing directory destination,
    // including an empty directory created after the preflight check.
    fs.renameSync(staging, outputDir);
  } else if (process.platform === 'linux') {
    // Node's POSIX rename can replace an empty directory. GNU mv uses the
    // no-replace operation here; never fall back to an overwriting rename.
    const result = spawnSync('mv', ['--no-target-directory', '--no-clobber', '--', staging, outputDir], { encoding: 'utf8', windowsHide: true });
    insist(!result.error && result.status === 0, `Atomic no-clobber publication requires GNU mv: ${result.error?.message || result.stderr}`);
    insist(!fs.existsSync(staging), `Output appeared during publication; refusing overwrite: ${outputDir}`);
  } else {
    throw new Error(`Atomic no-clobber directory publication is not supported on build host ${process.platform}; use Windows or Linux with GNU mv`);
  }
}

function cleanupOwnedStaging(staging, outputDir) {
  if (!staging) return;
  const parent = path.dirname(outputDir), prefix = `.${path.basename(outputDir)}.scki-profile-`;
  insist(path.dirname(staging) === parent && path.basename(staging).startsWith(prefix), 'Refusing cleanup outside the owned profile staging directory');
  let entry;
  try { entry = fs.lstatSync(staging); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  insist(entry.isDirectory() && !entry.isSymbolicLink(), 'Refusing cleanup of replaced staging directory');
  assertNoSymlinkAncestors(staging);
  fs.rmSync(staging, { recursive: true, force: false });
}

function addLocalDependencies(artifacts, root, plan) {
  // Passwall users can also import the list files manually. Keep these in the
  // same order/catalog as the generated shell; no shared fused files are copied.
  for (const client of ['Passwall', 'Passwall2']) {
    const relativeDir = `${clientDirectory(client)}/shunt-rules`;
    for (const name of fs.readdirSync(path.join(root, relativeDir)).sort()) {
      insist(name.endsWith('.list'), `Unexpected shunt directory member: ${name}`);
      const id = segmentFor(name, plan);
      insist(id, `Unknown Passwall shunt asset: ${name}`);
      if (plan.profile !== 'full' && plan.disabledSegments.includes(id)) continue;
      artifacts.push({ path: `${relativeDir}/${name}`, kind: 'copy', note: 'Manual shunt import companion; remote SRS asset remains published.' });
    }
  }
  // Preserve the small client-owned shard closure, including its budget proof.
  // Large common fused/MRS assets remain remote and are never copied here.
  const aeroveDir = 'Meow内核系/Aerove Lite/rule-assets';
  for (const name of fs.readdirSync(path.join(root, aeroveDir)).sort()) {
    artifacts.push({ path: `${aeroveDir}/${name}`, kind: 'copy', note: 'Byte-identical AEROVE Lite shard/budget proof, unchanged by business selection.' });
  }
  if (plan.profile === 'full') for (const relative of ['Meow内核系/adapter-manifest.json', `${clientDirectory('Karing')}/adapter-manifest.json`]) {
    artifacts.push({ path: relative, kind: 'copy', note: 'Byte-identical default adapter provenance.' });
  }
}

function generateBusinessProfile(options = {}) {
  const accepted = new Set(['profile', 'enable', 'outputDir', 'dryRun', 'root']);
  insist(Object.keys(options).every(key => accepted.has(key)), 'Unknown business profile generation option');
  insist(options.dryRun === undefined || typeof options.dryRun === 'boolean', 'dryRun must be a boolean');
  const root = path.resolve(options.root || ROOT);
  const outputDir = validateOutputDirectory(options.outputDir, root);
  const inputFiles = ['rulesets/source/routing-graph.js', 'rulesets/source/business-profiles.json', 'rulesets/generated/fused/manifest.json'];
  const inputHashes = Object.fromEntries(inputFiles.map(relative => [relative, hash(fs.readFileSync(safeSource(root, relative)))]));
  const plan = buildProfilePlan({ profile: options.profile, enable: options.enable, root });
  Object.assign(inputHashes, plan.safetySourceHashes);
  const artifacts = artifactInventory();
  addLocalDependencies(artifacts, root, plan);
  const rendered = [], remoteAssets = new Set();
  for (const artifact of artifacts) {
    const source = safeSource(root, artifact.path), input = fs.readFileSync(source);
    const bytes = plan.profile === 'full' || artifact.kind === 'copy' ? input : Buffer.from(projectPlatform(input.toString('utf8'), artifact.kind, plan, artifact));
    const text = bytes.toString('utf8');
    for (const match of text.matchAll(/https:\/\/[^\s"'<>]+\/(?:rulesets\/generated|rule-assets)\/[^\s"'<>),]+/g)) remoteAssets.add(match[0]);
    rendered.push({ artifact, source, inputHash: hash(input), bytes });
  }
  const manifest = {
    schema_version: 1, generator: 'tools/generate-business-profile.js', status: 'generated-client-acceptance-separate',
    source_authority: plan.source, source_version: plan.sourceVersion,
    inputs_sha256: inputHashes,
    profile: plan.profile, enabled_services: plan.enabled, disabled_services: plan.disabled,
    protected_groups: plan.protectedGroups, disabled_groups: plan.disabledGroups,
    source_rules: plan.sourceRules, preserved_process_segments: plan.protectedSegments,
    disabled_segments: plan.disabledSegments, protected_rule_fallbacks: plan.fallbacks,
    fallback_explanation: plan.fallbackExplanation,
    asset_policy: 'Reuse published native assets; never regenerate or modify shared fused/MRS resources. Client-owned AEROVE shards and manual Passwall lists are copied with byte hashes.',
    remote_asset_references: [...remoteAssets].sort(),
    artifacts: rendered.map(({ artifact, inputHash, bytes }) => ({ path: artifact.path, platform: artifact.kind,
      mode: plan.profile === 'full' || artifact.kind === 'copy' ? 'byte-copy' : 'profile-projection',
      source_sha256: inputHash, sha256: hash(bytes), bytes: bytes.length, capability_note: artifact.note,
      ...(artifact.kind === 'script' ? { runtime_contract: artifact.runtimeContract } : {}),
      ...(['sing-box', 'xray', 'karing', 'passwall'].includes(artifact.kind) && plan.profile !== 'full' ? {
        preserved_safety_residuals: plan.nativeSafetySegments.filter(id => plan.disabledGroups.includes(plan.segmentPolicies[id])).map(id => ({
          segment: id, status: 'preserved-safety-residual', previous_policy: plan.segmentPolicies[id],
          fallback_policy: plan.fallbacks[plan.segmentPolicies[id]],
          limitation: 'The existing native predicate includes process matchers and may combine domain/IP fields. Keep the complete original predicate at the same position; extracting process fields would widen its AND semantics. Passwall targets still require manual LuCI selection.',
        })),
      } : {}) })),
  };
  if (options.dryRun) return { outputDir, dryRun: true, manifest };
  // Refuse a concurrent input change before creating any output.
  for (const relative of Object.keys(inputHashes)) insist(hash(fs.readFileSync(safeSource(root, relative))) === inputHashes[relative], `Profile authority changed during generation: ${relative}`);
  for (const item of rendered) insist(hash(fs.readFileSync(item.source)) === item.inputHash, `Profile source changed during generation: ${item.artifact.path}`);
  validateOutputDirectory(outputDir, root);
  let staging;
  try {
    staging = fs.mkdtempSync(path.join(path.dirname(outputDir), `.${path.basename(outputDir)}.scki-profile-`));
    assertNoSymlinkAncestors(staging);
    for (const { artifact, bytes } of rendered) {
      const target = path.join(staging, artifact.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      assertNoSymlinkAncestors(target);
      fs.writeFileSync(target, bytes, { flag: 'wx' });
      insist(hash(fs.readFileSync(target)) === hash(bytes), `Profile artifact read-back failed: ${artifact.path}`);
    }
    const stagingManifest = path.join(staging, 'business-profile-manifest.json');
    fs.writeFileSync(stagingManifest, encode(manifest), { flag: 'wx' });
    insist(encode(JSON.parse(fs.readFileSync(stagingManifest, 'utf8'))) === encode(manifest), 'Business profile manifest read-back failed');
    publishDirectory(staging, outputDir);
    return { outputDir, dryRun: false, manifestPath: path.join(outputDir, 'business-profile-manifest.json'), manifest };
  } catch (error) {
    try { cleanupOwnedStaging(staging, outputDir); }
    catch (cleanupError) { error.message += `; staging cleanup refused/failed: ${cleanupError.message}`; }
    throw error;
  }
}

module.exports = { artifactInventory, generateBusinessProfile, validateOutputDirectory, assertNoSymlinkAncestors, publishDirectory, addLocalDependencies, safeSource };
