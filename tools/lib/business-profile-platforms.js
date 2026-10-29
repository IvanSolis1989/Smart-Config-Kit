'use strict';

const { spawnSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const { splitTopLevel } = require('./fused-rule-optimizer');
const { projectMihomoConfig, rulePolicy, isProtectedRule, rewriteRulePolicy } = require('./business-profiles');
const { projectScript } = require('./business-profile-script');

const encode = value => `${JSON.stringify(value, null, 2)}\n`;
const insist = (condition, message) => { if (!condition) throw new Error(message); };

function rubyYaml(code, text) {
  const result = spawnSync(process.env.RUBY_BIN || 'ruby', ['-EUTF-8:UTF-8', '-rjson', '-ryaml', '-e', code],
    { input: text, encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  insist(!result.error && result.status === 0, `Optional business profiles require Ruby >= 3.0 for structural YAML parsing: ${result.error?.message || result.stderr}`);
  return result.stdout;
}
function parseYaml(text) { return JSON.parse(rubyYaml('print JSON.generate(YAML.safe_load(STDIN.read, aliases: true))', text)); }
function renderYaml(value) {
  const result = rubyYaml('STDOUT.write(JSON.parse(STDIN.read).to_yaml(line_width: -1))', JSON.stringify(value));
  insist(isDeepStrictEqual(parseYaml(result), value), 'YAML business profile read-back differs from projected object');
  return result;
}

function projectOpenClash(source, plan) {
  const pattern = /^(cat (?:>|>>) "\$OVERRIDE_YAML" << 'OVERRIDE_EOF'\r?\n)([\s\S]*?)(^OVERRIDE_EOF\r?$)/gm;
  const blocks = [...source.matchAll(pattern)];
  insist(blocks.length === 2, 'OpenClash must have exactly two recognized override YAML heredocs');
  const value = projectMihomoConfig(parseYaml(blocks.map(block => block[2]).join('\n')), plan);
  let index = 0;
  let output = source.replace(pattern, (_, start, body, end) => `${start}${index++ === 0 ? renderYaml(value) : ''}${end}`);
  // The existing Ruby runtime reinserts QUIC exceptions after reading YAML.
  // Update its own catalog too, so follow-rules still removes the same rules.
  let constants = 0;
  output = output.replace(/^SCKI_SOURCE_QUIC_RULES = (\[[^\r\n]*\])\.freeze$/gm, (_, json) => {
    constants++;
    const rules = projectMihomoConfig({ rules: JSON.parse(json), 'rule-providers': {} }, plan).rules;
    return `SCKI_SOURCE_QUIC_RULES = ${JSON.stringify(rules)}.freeze`;
  });
  insist(constants === 1, 'OpenClash QUIC runtime catalog anchor missing or duplicated');
  return output;
}

function projectEgern(value, plan) {
  const disabled = new Set(plan.disabledGroups);
  value.policy_groups = value.policy_groups.filter(group => {
    insist(group && Object.keys(group).length === 1, 'Unknown Egern policy-group structure');
    return !disabled.has(Object.values(group)[0].name);
  }).map(group => {
    const body = Object.values(group)[0];
    if (body.policies) body.policies = body.policies.filter(name => !disabled.has(name));
    return group;
  });
  value.rules = value.rules.filter(rule => {
    insist(rule && Object.keys(rule).length === 1, 'Unknown Egern rule structure');
    const [type, body] = Object.entries(rule)[0];
    if (!disabled.has(body.policy)) return true;
    if (['and', 'or', 'not'].includes(type)) {
      body.policy = plan.fallbacks[body.policy]; return true;
    }
    insist(['rule_set', 'domain', 'domain_suffix', 'domain_keyword', 'domain_regex', 'geoip', 'ip_cidr', 'ip_cidr6', 'asn'].includes(type), `Unsupported disabled Egern rule: ${type}`);
    return false;
  });
  return value;
}

function segmentFor(value, plan) {
  const text = String(value || '');
  const match = text.match(/scki-fused-\d+-[a-z-]+?(?=-(?:domain|ipcidr|residual)(?:[-.]|$)|\.(?:list|srs|json|yaml)(?:[?\s]|$)|\s*[|·]|$)/);
  if (!match) return null;
  insist(Object.hasOwn(plan.segmentPolicies, match[0]), `Unknown fused segment in business profile: ${match[0]}`);
  return match[0];
}

function collectRuleSets(value, result = new Set()) {
  if (Array.isArray(value)) value.forEach(item => collectRuleSets(item, result));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) {
    if (key === 'rule_set') for (const tag of Array.isArray(item) ? item : [item]) {
      insist(typeof tag === 'string', 'Non-string native rule_set dependency'); result.add(tag);
    } else collectRuleSets(item, result);
  }
  return result;
}

function hasProcessMatcher(rule) {
  if (!rule || typeof rule !== 'object') return false;
  return Object.keys(rule).some(key => /^process_|^package_/.test(key)) ||
    (Array.isArray(rule.rules) && rule.rules.some(hasProcessMatcher));
}

function projectSingBox(value, plan) {
  const disabled = new Set(plan.disabledGroups);
  insist(Array.isArray(value.route?.rules) && Array.isArray(value.outbounds), 'Invalid sing-box config');
  function checkRetainedReferences(item) {
    if (Array.isArray(item)) item.forEach(checkRetainedReferences);
    else if (item && typeof item === 'object') for (const [key, child] of Object.entries(item)) {
      insist(!(['detour', 'download_detour', 'dialer-proxy'].includes(key) && disabled.has(child)), `Business profile would remove a native node/DNS/HTTP dependency: ${child}`);
      checkRetainedReferences(child);
    }
  }
  checkRetainedReferences(value.outbounds.filter(outbound => !disabled.has(outbound.tag)));
  checkRetainedReferences(value.dns);
  checkRetainedReferences(value.http_clients);
  value.route.rules = value.route.rules.filter(rule => {
    if (!disabled.has(rule.outbound)) return true;
    const protectedAsset = [...collectRuleSets(rule)].some(tag => {
      const id = segmentFor(tag, plan); return id && plan.nativeSafetySegments.includes(id);
    });
    if (rule.type === 'logical' || hasProcessMatcher(rule) || protectedAsset) { rule.outbound = plan.fallbacks[rule.outbound]; return true; }
    insist(!rule.rules, 'Unsupported nested native route shape');
    return false;
  });
  value.outbounds = value.outbounds.filter(outbound => {
    if (!disabled.has(outbound.tag)) return true;
    insist(['selector', 'urltest'].includes(outbound.type), 'Disabled business tag collides with a native node');
    return false;
  }).map(outbound => {
    if (Array.isArray(outbound.outbounds)) outbound.outbounds = outbound.outbounds.filter(tag => !disabled.has(tag));
    insist(!disabled.has(outbound.default), 'Disabled business group is a native default selector dependency');
    return outbound;
  });
  const definitions = value.route.rule_set || [];
  const definitionsByTag = new Map(definitions.map(ruleSet => [ruleSet.tag, ruleSet]));
  delete value.route.rule_set;
  const needed = collectRuleSets(value);
  for (const tag of needed) {
    insist(definitionsByTag.has(tag), `Unknown native rule_set dependency: ${tag}`);
    collectRuleSets(definitionsByTag.get(tag), needed);
  }
  value.route.rule_set = definitions.filter(ruleSet => needed.has(ruleSet.tag));
  checkRetainedReferences(value.route.rule_set);
  return value;
}

function projectXray(value, plan) {
  insist(Array.isArray(value), 'Expected v2rayN RuleObject array');
  return value.filter(rule => {
    const segment = segmentFor(rule.id, plan);
    if (!segment || !plan.disabledGroups.includes(plan.segmentPolicies[segment])) return true;
    if (rule.process?.length) {
      const previousPolicy = plan.segmentPolicies[segment], fallback = plan.fallbacks[previousPolicy];
      rule.remarks = rule.remarks.replace(` | ${previousPolicy} |`, ` | ${fallback} [preserved-safety-residual] |`);
      rule.outboundTag = plan.nativeFallbacks[previousPolicy];
      return true;
    }
    return false;
  });
}

function projectKaring(value, plan) {
  insist(Array.isArray(value.rules), 'Expected Karing diversion rules');
  value.rules = value.rules.filter(rule => {
    const ids = [...collectRuleSets(rule)].map(tag => segmentFor(tag, plan)).filter(Boolean);
    const disabledIds = ids.filter(id => plan.disabledGroups.includes(plan.segmentPolicies[id]));
    if (!disabledIds.length) return true;
    insist(disabledIds.length === ids.length, 'Karing rule mixes enabled and disabled fused segments');
    if (hasProcessMatcher(rule) || disabledIds.some(id => plan.nativeSafetySegments.includes(id))) {
      const targets = [...new Set(disabledIds.map(id => plan.fallbacks[plan.segmentPolicies[id]]))];
      insist(targets.length === 1, 'Karing safety rule mixes incompatible fallback targets');
      rule.name = `${rule.name} [preserved-safety-residual -> ${targets[0]}]`;
      return true;
    }
    return false;
  });
  return value;
}

function projectConf(source, plan, quantumult = false) {
  let section = '';
  const disabled = new Set(plan.disabledGroups);
  return source.split(/\r?\n/).filter(line => {
    const header = /^\[([^\]]+)\]\s*$/.exec(line);
    if (header) { section = header[1].toLowerCase(); return true; }
    if (!line.trim() || /^\s*[#;]/.test(line)) return true;
    if (section === 'proxy group') {
      const group = /^([^=]+?)\s*=/.exec(line);
      insist(group, 'Unknown private proxy group syntax');
      return !disabled.has(group[1].trim());
    }
    if (quantumult && section === 'policy') {
      const group = /^(?:static|url-latency-benchmark)=\s*([^,]+)/.exec(line);
      insist(group, 'Unknown Quantumult X policy syntax');
      return !disabled.has(group[1].trim());
    }
    return true;
  }).map(line => {
    const header = /^\[([^\]]+)\]\s*$/.exec(line);
    if (header) { section = header[1].toLowerCase(); return line; }
    if (!line.trim() || /^\s*[#;]/.test(line)) return line;
    if (section === 'proxy group') {
      const equal = line.indexOf('=');
      const tokens = splitTopLevel(line.slice(equal + 1));
      return line.slice(0, equal + 1) + ' ' + tokens.filter(token => !disabled.has(token)).join(',');
    }
    if (quantumult && section === 'policy' && line.startsWith('static=')) {
      const tokens = splitTopLevel(line.slice('static='.length));
      return 'static=' + tokens.filter((token, index) => index === 0 || !disabled.has(token)).join(', ');
    }
    if (section === 'rule') {
      const target = rulePolicy(line);
      if (!disabled.has(target)) return line;
      const parts = splitTopLevel(line);
      if (parts[0] === 'RULE-SET' && parts[1].includes('/fused/surge/')) {
        const segment = segmentFor(parts[1], plan), entries = plan.surgeSafetyBySegment[segment] || [];
        if (entries.length) return entries.map(entry => {
          const matcher = splitTopLevel(entry), noResolve = matcher[matcher.length - 1] === 'no-resolve';
          if (noResolve) matcher.pop();
          matcher.push(plan.fallbacks[target]); if (noResolve) matcher.push('no-resolve');
          return matcher.join(',');
        }).join('\n');
      }
      return isProtectedRule(line, plan) ? rewriteRulePolicy(line, plan.fallbacks[target]) : null;
    }
    if (section === 'remote rule') {
      const tokens = splitTopLevel(line), policy = tokens.find(token => token.startsWith('policy='));
      insist(policy && /^https:\/\//.test(tokens[0]), 'Unknown Loon remote rule syntax');
      return disabled.has(policy.slice('policy='.length)) ? null : line;
    }
    if (quantumult && section === 'filter_remote') {
      const tokens = splitTopLevel(line);
      const policyIndex = tokens.findIndex(token => token.startsWith('force-policy='));
      insist(policyIndex >= 0, 'QX remote filter has no force-policy');
      const target = tokens[policyIndex].slice('force-policy='.length);
      if (!disabled.has(target)) return line;
      return null;
    }
    if (quantumult && section === 'filter_local') {
      const tokens = splitTopLevel(line), target = tokens[tokens.length - 1];
      if (disabled.has(target)) throw new Error('Unsupported QX inline business rule: ' + line);
    }
    return line;
  }).filter(line => line !== null).join('\n');
}

function projectPasswall(source, plan) {
  let calls = 0;
  const result = source.split(/\r?\n/).map(line => {
    if (!line.startsWith('add_fused_shunt_rule ')) return line;
    const match = /^add_fused_shunt_rule '(scki-fused-\d+-[a-z-]+) \| ([^']+)' '(https:\/\/[^']+)' '[01]'$/.exec(line);
    insist(match && Object.hasOwn(plan.segmentPolicies, match[1]) && plan.segmentPolicies[match[1]] === match[2], 'Unknown Passwall fused call syntax or source policy');
    calls++;
    if (plan.disabledSegments.includes(match[1])) return null;
    if (plan.disabledGroups.includes(match[2])) return line.replace(` | ${match[2]}'`, ` | ${plan.fallbacks[match[2]]} [preserved-safety-residual]'`);
    return line;
  }).filter(line => line !== null).join('\n');
  insist(calls > 0, 'Passwall fused calls missing');
  return result;
}

function projectPlatform(source, kind, plan, artifact) {
  if (kind === 'script') return projectScript(source, plan, artifact);
  if (kind === 'openclash') return projectOpenClash(source, plan);
  if (kind === 'mihomo-yaml') return renderYaml(projectMihomoConfig(parseYaml(source), plan));
  if (kind === 'egern') return renderYaml(projectEgern(parseYaml(source), plan));
  if (kind === 'sing-box') return encode(projectSingBox(JSON.parse(source), plan));
  if (kind === 'xray') return encode(projectXray(JSON.parse(source), plan));
  if (kind === 'karing') return encode(projectKaring(JSON.parse(source), plan));
  if (kind === 'conf' || kind === 'quantumult') return projectConf(source, plan, kind === 'quantumult');
  if (kind === 'passwall') return projectPasswall(source, plan);
  throw new Error(`Unsupported business profile platform: ${kind}`);
}

module.exports = { projectPlatform, parseYaml, renderYaml, segmentFor, projectSingBox, projectEgern,
  projectConf, projectScript, projectOpenClash, projectKaring, projectXray, projectPasswall };
