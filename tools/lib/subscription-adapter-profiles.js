'use strict';

const fs = require('node:fs');
const path = require('node:path');

// This literal is embedded into published adapters and must not inherit the
// host platform's path separator. path.join(repoRoot, PROFILE_SOURCE) still
// resolves it correctly on Windows and POSIX hosts.
const PROFILE_SOURCE = 'tools/runtime/subscription-adapter-profiles.json';
const PROFILE_IDS = ['off', 'policy', 'adaptive', 'hosts-only'];
const PROJECTION_MODES = new Set(PROFILE_IDS);

function readProfileContract(repoRoot) {
  const sourcePath = path.join(repoRoot, PROFILE_SOURCE);
  return JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
}

function validateProfileContract(contract) {
  const errors = [];
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    return ['profile contract must be an object'];
  }
  if (contract.schema_version !== 1) errors.push('schema_version must be 1');
  if (!PROFILE_IDS.includes(contract.default)) errors.push(`default must be one of ${PROFILE_IDS.join(', ')}`);

  const invariants = contract.invariants;
  if (!invariants || typeof invariants !== 'object' || Array.isArray(invariants)) {
    errors.push('invariants must be an object');
  } else {
    const expected = {
      routing_graph: 'unchanged',
      proxy_groups: 'fixed-55',
      global_dns: 'repository-owned',
      subscription_may_select_profile: false,
    };
    for (const [key, value] of Object.entries(expected)) {
      if (invariants[key] !== value) errors.push(`invariants.${key} must be ${JSON.stringify(value)}`);
    }
    for (const key of Object.keys(invariants)) {
      if (!(key in expected)) errors.push(`invariants.${key} is not allowed`);
    }
  }

  const profiles = contract.profiles;
  if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) {
    errors.push('profiles must be an object');
    return errors;
  }
  const actualIds = Object.keys(profiles).sort();
  const expectedIds = PROFILE_IDS.slice().sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    errors.push(`profiles must contain exactly ${expectedIds.join(', ')}`);
  }
  for (const id of PROFILE_IDS) {
    const profile = profiles[id];
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      errors.push(`profiles.${id} must be an object`);
      continue;
    }
    if (profile.node_dns_projection !== id || !PROJECTION_MODES.has(profile.node_dns_projection)) {
      errors.push(`profiles.${id}.node_dns_projection must equal ${id}`);
    }
    if (typeof profile.label !== 'string' || !profile.label.trim()) {
      errors.push(`profiles.${id}.label must be a nonempty string`);
    }
    for (const key of Object.keys(profile)) {
      if (!['node_dns_projection', 'label'].includes(key)) errors.push(`profiles.${id}.${key} is not allowed`);
    }
  }
  return errors;
}

function assertValidProfileContract(contract) {
  const errors = validateProfileContract(contract);
  if (errors.length) throw new Error(`Invalid subscription-adapter profile contract:\n- ${errors.join('\n- ')}`);
  return contract;
}

function profileRows(contract) {
  assertValidProfileContract(contract);
  return PROFILE_IDS.map((id) => ({
    id,
    mode: contract.profiles[id].node_dns_projection,
    label: contract.profiles[id].label,
  }));
}

function renderJavaScriptProfileRuntime(contract) {
  const rows = profileRows(contract);
  const lines = [
    '// Generated from tools/runtime/subscription-adapter-profiles.json; do not edit in adapters.',
    `var SCKI_SUBSCRIPTION_ADAPTER_PROFILE_DEFAULT = ${JSON.stringify(contract.default)}`,
    'var SCKI_SUBSCRIPTION_ADAPTER_PROFILES = {',
  ];
  rows.forEach((row, index) => {
    const comma = index === rows.length - 1 ? '' : ',';
    lines.push(`  ${JSON.stringify(row.id)}: { id: ${JSON.stringify(row.id)}, nodeDnsProjection: ${JSON.stringify(row.mode)} }${comma}`);
  });
  lines.push('}');
  lines.push('function sckiResolveSubscriptionAdapterProfile(requestedProfile) {');
  lines.push('  var requested = typeof requestedProfile === \'string\' ? requestedProfile : \'\'');
  lines.push('  var selected = SCKI_SUBSCRIPTION_ADAPTER_PROFILES[requested] || SCKI_SUBSCRIPTION_ADAPTER_PROFILES[SCKI_SUBSCRIPTION_ADAPTER_PROFILE_DEFAULT]');
  lines.push('  return { id: selected.id, nodeDnsProjection: selected.nodeDnsProjection }');
  lines.push('}');
  return lines.join('\n');
}

function renderRubyProfileRuntime(contract) {
  const rows = profileRows(contract);
  const lines = [
    '# Generated from tools/runtime/subscription-adapter-profiles.json; do not edit in adapters.',
    'module SckiSubscriptionAdapterProfiles',
    `  DEFAULT = ${JSON.stringify(contract.default)}.freeze`,
    '  MODES = {',
  ];
  rows.forEach((row, index) => {
    const comma = index === rows.length - 1 ? '' : ',';
    lines.push(`    ${JSON.stringify(row.id)} => { "id" => ${JSON.stringify(row.id)}.freeze, "node_dns_projection" => ${JSON.stringify(row.mode)}.freeze }.freeze${comma}`);
  });
  lines.push('  }.freeze');
  lines.push('');
  lines.push('  module_function');
  lines.push('');
  lines.push('  def resolve(requested_profile)');
  lines.push('    requested = requested_profile.is_a?(String) ? requested_profile : ""');
  lines.push('    selected = MODES.fetch(requested, MODES.fetch(DEFAULT))');
  lines.push('    { "id" => selected.fetch("id"), "node_dns_projection" => selected.fetch("node_dns_projection") }.freeze');
  lines.push('  end');
  lines.push('end');
  return lines.join('\n');
}

module.exports = {
  PROFILE_SOURCE,
  PROFILE_IDS,
  readProfileContract,
  validateProfileContract,
  assertValidProfileContract,
  renderJavaScriptProfileRuntime,
  renderRubyProfileRuntime,
};
