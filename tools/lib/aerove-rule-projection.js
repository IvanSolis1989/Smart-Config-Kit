'use strict';

// Self-contained: this function is embedded in the QuickJS script at generation.
function projectAeroveRouting(config, splits) {
  const sourceNames = Object.keys(splits);
  if (sourceNames.length === 0) return config;
  const providers = config['rule-providers'] || {};
  const names = new Set(Object.keys(providers));
  const used = Object.create(null);
  for (const original of sourceNames) {
    if (!Object.prototype.hasOwnProperty.call(providers, original)) throw new Error('Missing split provider: ' + original);
    if (!Array.isArray(splits[original]) || splits[original].length < 2) throw new Error('Invalid split plan: ' + original);
    for (const part of splits[original]) {
      if (!/^[a-z0-9][a-z0-9._-]*$/.test(part.id) || !part.url || !part.cache_path) throw new Error('Invalid split asset: ' + original);
      if (names.has(part.id)) throw new Error('Split provider identifier collision: ' + part.id);
      names.add(part.id);
    }
    used[original] = 0;
  }
  const projectedRules = [];
  for (const rule of config.rules) {
    const match = /^RULE-SET,([^,]+)(,.*)$/.exec(rule);
    const parts = match && Object.prototype.hasOwnProperty.call(splits, match[1]) && splits[match[1]];
    if (parts) {
      for (const part of parts) projectedRules.push('RULE-SET,' + part.id + match[2]);
      used[match[1]]++;
    } else {
      for (const original of sourceNames) {
        if (rule.includes('RULE-SET,' + original + ',') || rule.includes('RULE-SET,' + original + ')')) {
          throw new Error('Unsupported nested split rule reference: ' + original);
        }
      }
      projectedRules.push(rule);
    }
  }
  const projectedProviders = {};
  for (const [name, provider] of Object.entries(providers)) {
    if (!Object.prototype.hasOwnProperty.call(splits, name)) projectedProviders[name] = provider;
    else {
      if (!used[name]) throw new Error('Missing RULE-SET reference for split provider: ' + name);
      for (const part of splits[name]) {
        projectedProviders[part.id] = Object.assign({}, provider, { url: part.url, path: part.cache_path });
      }
    }
  }
  return Object.assign({}, config, { 'rule-providers': projectedProviders, rules: projectedRules });
}

module.exports = { projectAeroveRouting };
