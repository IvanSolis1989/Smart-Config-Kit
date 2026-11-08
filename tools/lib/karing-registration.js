'use strict';

// Karing's custom-rule import and its remote-resource registry are distinct.
// This is an audit/activation checklist, never an alternative import schema.
function registrationChecklist(profile) {
  if (!profile || !Array.isArray(profile.rules)) throw new Error('Expected Karing custom rules');
  const records = new Map();
  for (const rule of profile.rules) {
    if (!rule || typeof rule.name !== 'string' || !Array.isArray(rule.rule_set)) throw new Error('Invalid Karing rule');
    for (const url of rule.rule_set) {
      let parsed;
      try { parsed = new URL(url); } catch { throw new Error('Invalid remote rule URL'); }
      if (parsed.protocol !== 'https:' || !/\.(srs|json)$/.test(parsed.pathname)) throw new Error('Unsupported remote rule URL');
      const format = parsed.pathname.endsWith('.json') ? 'source' : 'binary';
      if (!records.has(url)) records.set(url, { type: 'remote', tag: url, format, url, groups: [] });
      if (!records.get(url).groups.includes(rule.name)) records.get(url).groups.push(rule.name);
    }
  }
  return [...records.values()];
}

function auditRegistration(profile, savedConfig) {
  if (!savedConfig || !Array.isArray(savedConfig.rule_set_items)) {
    throw new Error('Expected Karing internal diversion configuration with rule_set_items; a custom-rule export is not registration evidence');
  }
  const expected = registrationChecklist(profile);
  const missing = expected.filter(want => !savedConfig.rule_set_items.some(item =>
    item && ['type', 'tag', 'format', 'url'].every(key => item[key] === want[key])));
  return {
    registration_complete: missing.length === 0,
    expected_resource_count: expected.length,
    missing_resource_count: missing.length,
    groups_requiring_save: [...new Set(missing.flatMap(item => item.groups))],
    // Registry membership does not establish downloaded bytes or connectivity.
    download_verified: false,
    client_validation: 'not-run'
  };
}

module.exports = { registrationChecklist, auditRegistration };
