#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  validateGeneratedRemoteAssetSizes,
} = require('../validate-generated-remote-asset-size');
const { optimizeEntries } = require('../lib/fused-rule-optimizer');
const { getMihomoNormalizedRoutingGraph } = require('../../rulesets/source/routing-graph');

const REPO_ROOT = path.resolve(__dirname, '../..');
const FUSED_ROOT = path.join(REPO_ROOT, 'rulesets/generated/fused');

function read(relative) {
  return fs.readFileSync(path.join(REPO_ROOT, relative), 'utf8');
}

function generatedAssetPath(url, marker) {
  const pathname = new URL(url).pathname;
  const index = pathname.indexOf(marker);
  assert.notEqual(index, -1, `unexpected generated asset URL: ${url}`);
  return decodeURIComponent(pathname.slice(index + 1));
}

function nonCommentLines(file) {
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith('#'));
}

function payloadEntries(file) {
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.match(/^\s+-\s+(.+)$/))
    .filter(Boolean)
    .map((match) => JSON.parse(match[1]));
}

function segmentClashEntries(segment) {
  const record = segment.files && segment.files.clash;
  if (!record) return [];
  return (record.parts || [record.file])
    .flatMap((file) => nonCommentLines(path.join(FUSED_ROOT, 'clash', file)));
}

function segmentResidualEntries(segment) {
  const record = segment.files && segment.files.residual;
  if (!record) return [];
  return payloadEntries(path.join(FUSED_ROOT, 'mihomo', record.file));
}

function egernNativeRuleSet(file) {
  const source = fs.readFileSync(file, 'utf8');
  const sets = {};
  let current = null;
  for (const line of source.split(/\r?\n/)) {
    if (/^no_resolve:\s*true\s*$/i.test(line)) continue;
    const field = line.match(/^([a-z0-9_]+):\s*$/i);
    if (field) {
      current = field[1];
      sets[current] = 0;
      continue;
    }
    if (current && /^  - /.test(line)) sets[current] += 1;
  }
  return { noResolve: /^no_resolve:\s*true\s*$/im.test(source), sets };
}

test('Issue #176 CN domain guards precede generic international Geo/CDN fallbacks', () => {
  const graph = getMihomoNormalizedRoutingGraph();
  const cnAuthorityRule = 'RULE-SET,acc-geo-ip-asia-china,🏠 国内网站,no-resolve';
  const cnRuleIndex = graph.rules.indexOf(cnAuthorityRule);
  assert.notEqual(cnRuleIndex, -1, 'the final CN authority rule must exist in the source graph');

  const genericFallbackRules = [
    'RULE-SET,cloudflare-ip,🌐 国外网站,no-resolve',
    'RULE-SET,cloudfront-ip,🌐 国外网站,no-resolve',
    'RULE-SET,fastly-ip,🌐 国外网站,no-resolve',
    'RULE-SET,cloudflare-domain,🌐 国外网站',
    'RULE-SET,cloudflare-ipcidr,🌐 国外网站',
    'RULE-SET,acc-fastly,🌐 国外网站',
    'GEOIP,ID,🌐 国外网站,no-resolve',
  ];
  for (const rule of genericFallbackRules) {
    const index = graph.rules.indexOf(rule);
    assert.ok(index > cnRuleIndex, `${rule} must follow every CN authority rule`);
  }

  const regionalFallbackIndexes = graph.rules
    .map((rule, index) => ({ rule, index }))
    .filter(({ rule }) => /^RULE-SET,acc-geo-(?:d|ip)-(?!asia-china,)[^,]+,🌐 国外网站/.test(rule))
    .map(({ index }) => index);
  assert.equal(regionalFallbackIndexes.length, 32, 'all 16 non-China regional domain/IP fallbacks must remain present');
  assert.ok(regionalFallbackIndexes.every((index) => index > cnRuleIndex), 'non-China regional fallbacks must follow every CN authority rule');

  const manifest = JSON.parse(fs.readFileSync(path.join(FUSED_ROOT, 'manifest.json'), 'utf8'));
  const issueCorpus = [
    ['www.mi.com', 'mi.com'],
    ['api-paas.yunxuetang.cn', 'cn'],
    ['apiws-phx-tc.yunxuetang.cn', 'cn'],
    ['images.yxt.com', 'yxt.com'],
    ['stc.yxt.com', 'yxt.com'],
  ];
  const cnIndexes = issueCorpus.map(([host, suffix]) => {
    const index = manifest.segments.findIndex((segment) => (
      segment.policy === '🏠 国内网站'
      && segmentClashEntries(segment).includes(`DOMAIN-SUFFIX,${suffix}`)
    ));
    assert.notEqual(index, -1, `CN fused payload must cover ${host}`);
    return index;
  });
  const genericGeoIndex = manifest.segments.findIndex((segment) => (
    segment.policy === '🌐 国外网站'
    && segmentResidualEntries(segment).includes('GEOIP,US,no-resolve')
  ));
  assert.notEqual(genericGeoIndex, -1, 'foreign GEOIP fallback must exist');
  assert.ok(cnIndexes.every((index) => index < genericGeoIndex), 'Issue #176 CN domain guards must win before foreign GEOIP fallback');
});

test('iOS fused payload stays within the repository Network Extension budget', () => {
  const config = read('Shadowrocket/Shadowrocket.conf');
  const urls = [...config.matchAll(/^RULE-SET,(https:\/\/[^,]+),/gm)].map((match) => match[1]);
  const uniqueUrls = [...new Set(urls)];
  const files = uniqueUrls.map((url) => {
    const marker = '/rulesets/generated/';
    assert.ok(url.includes(marker), `unexpected non-fused URL: ${url}`);
    return path.join(REPO_ROOT, generatedAssetPath(url, marker));
  });
  const bytes = files.reduce((total, file) => total + fs.statSync(file).size, 0);
  const rules = files.reduce((total, file) => total + nonCommentLines(file).length, 0);

  const manifest = JSON.parse(read('rulesets/generated/fused/manifest.json'));
  const expectedFiles = manifest.segments
    .flatMap((segment) => segment.files.clash ? (segment.files.clash.parts || [segment.files.clash.file]) : [])
    .filter((file) => nonCommentLines(path.join(FUSED_ROOT, 'clash', file)).length > 0);
  assert.deepEqual(
    files.map((file) => path.basename(file)),
    expectedFiles,
    'every non-empty Shadowrocket-compatible asset is referenced exactly once in manifest order',
  );
  for (const file of files) assert.ok(nonCommentLines(file).length > 0, `${file} is an empty referenced rule set`);
  assert.ok(bytes <= 32 * 1024 * 1024, `Shadowrocket fused payload is ${bytes} bytes`);
  assert.ok(rules <= 1_000_000, `Shadowrocket fused payload contains ${rules} rules`);
});

test('runtime GEOIP rules are not amplified into country CIDR payloads', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(FUSED_ROOT, 'manifest.json'), 'utf8'));
  const international = manifest.segments.filter((segment) => segment.policy === '🌐 国外网站');
  const expandedCidrs = international.reduce(
    (total, segment) => total + segment.counts.ipcidr + segment.counts.ipcidr_no_resolve,
    0,
  );
  const residualFiles = international
    .map((segment) => segment.files.residual && segment.files.residual.file)
    .filter(Boolean)
    .map((file) => fs.readFileSync(path.join(FUSED_ROOT, 'mihomo', file), 'utf8'))
    .join('\n');

  assert.ok(expandedCidrs < 100_000, `international segments contain ${expandedCidrs} expanded CIDRs`);
  assert.match(residualFiles, /GEOIP,US/);
  assert.doesNotMatch(residualFiles, /GEOIP\s+,|GEOIP,[a-z]{2}(?:\s|$)/);
});

test('fusion manifest records optimization and has no unresolved source fallback', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(FUSED_ROOT, 'manifest.json'), 'utf8'));
  assert.deepEqual(manifest.unresolved_providers, []);
  assert.deepEqual(manifest.unresolved_sources, []);
  assert.ok(manifest.optimization);
  assert.ok(manifest.optimization.removed > 0);
  for (const segment of manifest.segments) assert.ok(segment.optimization, `${segment.id} lacks optimization metrics`);
});

test('fusion manifest does not publish empty source or target rule sets', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(FUSED_ROOT, 'manifest.json'), 'utf8'));
  for (const segment of manifest.segments) {
    const sourceCount = Object.values(segment.counts).reduce((total, count) => total + count, 0);
    assert.ok(sourceCount > 0, `${segment.id} is an empty source segment`);

    const hasMobileFiles = ['clash', 'surge', 'quantumultx', 'egern']
      .every((target) => Boolean(segment.files[target]));
    assert.equal(
      hasMobileFiles,
      segment.target_counts.mobile > 0,
      `${segment.id} mobile target/file mismatch`,
    );
    assert.equal(
      Boolean(segment.files.sing_box),
      segment.target_counts.sing_box > 0,
      `${segment.id} sing-box target/file mismatch`,
    );
  }
});

test('Passwall marks every fused SRS containing IP rules as an IP payload', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(FUSED_ROOT, 'manifest.json'), 'utf8'));
  const script = read('Passwall/Passwall(xray+sing-box)-apply.sh');
  for (const segment of manifest.segments.filter((row) => row.files.sing_box)) {
    const sourceFile = segment.files.sing_box.source;
    const source = JSON.parse(fs.readFileSync(path.join(FUSED_ROOT, 'sing-box', sourceFile), 'utf8'));
    const containsIp = source.rules.some((rule) => (
      (Array.isArray(rule.ip_cidr) && rule.ip_cidr.length > 0)
      || (Array.isArray(rule.ip_cidr6) && rule.ip_cidr6.length > 0)
    ));
    const escapedId = segment.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const call = script.match(new RegExp(`add_fused_shunt_rule '${escapedId} \\| [^']+' '[^']+' '([01])'`));
    assert.ok(call, `${segment.id} is absent from the Passwall apply script`);
    assert.equal(call[1] === '1', containsIp, `${segment.id} Passwall IP payload flag is wrong`);
  }
});

test('Sing-box uses each non-empty fused SRS exactly once', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(FUSED_ROOT, 'manifest.json'), 'utf8'));
  const config = JSON.parse(read('SingBox/SingBox(sing-box)-full.json'));
  const expectedTags = manifest.segments
    .filter((segment) => segment.files.sing_box)
    .map((segment) => segment.id);
  const fusedRuleSets = config.route.rule_set.filter((ruleSet) => (
    String(ruleSet.url || '').includes('/rulesets/generated/fused/sing-box/')
  ));
  assert.deepEqual(fusedRuleSets.map((ruleSet) => ruleSet.tag), expectedTags);
  assert.equal(new Set(fusedRuleSets.map((ruleSet) => ruleSet.url)).size, fusedRuleSets.length);

  const referencedTags = config.route.rules
    .flatMap((rule) => rule.rule_set || [])
    .filter((tag) => tag.startsWith('scki-fused-'));
  assert.deepEqual(referencedTags, expectedTags);
});

test('formal remote-asset validator enforces aggregate client budgets', () => {
  const result = validateGeneratedRemoteAssetSizes();
  assert.deepEqual(result.failures, []);
  assert.ok(result.clientAggregates instanceof Map);
  const shadowrocket = result.clientAggregates.get('Shadowrocket');
  assert.ok(shadowrocket);
  assert.ok(shadowrocket.bytes <= shadowrocket.budget.maxBytes);
  assert.ok(shadowrocket.textRules <= shadowrocket.budget.maxTextRules);
});

test('Egern native rule sets do not silently drop GEOIP rules', () => {
  const directory = path.join(REPO_ROOT, 'rulesets/generated/egern');
  const skippedGeoip = fs.readdirSync(directory)
    .filter((file) => file.endsWith('.yaml'))
    .filter((file) => /Skipped unsupported source rule types:.*GEOIP/.test(fs.readFileSync(path.join(directory, file), 'utf8')));
  assert.deepEqual(skippedGeoip, []);
});

test('Issue #176 keeps native Egern authority segments valid across upstream refreshes', () => {
  const directory = path.join(REPO_ROOT, 'rulesets/generated/egern');
  const manifest = JSON.parse(read('rulesets/generated/fused/manifest.json'));
  const segments = manifest.segments || [];
  const findSegment = (suffix, startIndex = 0, reverse = false) => {
    const indexes = segments.map((segment, index) => ({ segment, index }))
      .filter(({ segment, index }) => index >= startIndex && segment.id.endsWith(`-${suffix}`));
    return reverse ? indexes[indexes.length - 1] : indexes[0];
  };
  const gameIntl = findSegment('game-intl');
  const genericIntl = gameIntl && findSegment('intl-site', gameIntl.index + 1);
  const lateCnmedia = findSegment('cnmedia', 0, true);
  const lateCnsite = lateCnmedia && findSegment('cn-site', lateCnmedia.index + 1);
  const intlTail = findSegment('intl-site', 0, true);
  assert.ok(genericIntl, 'the generic international fallback following international games must exist');
  assert.ok(lateCnsite, 'the late CN site authority segment must exist');
  assert.ok(intlTail, 'the final international fallback segment must exist');
  assert.equal(lateCnsite.segment.policy, '🏠 国内网站');
  assert.equal(intlTail.segment.policy, '🌐 国外网站');
  const asset = (segment, part) => egernNativeRuleSet(path.join(directory, 'provider-' + segment.id + '-' + part + '.yaml'));
  const assertNonEmptyAsset = (segment, part, noResolve) => {
    const result = asset(segment, part);
    const entryCount = Object.values(result.sets).reduce((total, count) => total + count, 0);
    assert.equal(result.noResolve, noResolve, segment.id + '-' + part + ' no_resolve mismatch');
    assert.ok(entryCount > 0, segment.id + '-' + part + ' must remain non-empty after generation');
  };
  assert.equal(
    fs.existsSync(path.join(directory, 'provider-' + genericIntl.segment.id + '-ipcidr-no-resolve.yaml')),
    false,
    'the emptied old international no-resolve asset must be removed',
  );
  assertNonEmptyAsset(genericIntl.segment, 'domain', false);
  assertNonEmptyAsset(genericIntl.segment, 'ipcidr', false);
  assertNonEmptyAsset(genericIntl.segment, 'residual', false);
  assertNonEmptyAsset(lateCnsite.segment, 'domain', false);
  assertNonEmptyAsset(lateCnsite.segment, 'ipcidr-no-resolve', true);
  assertNonEmptyAsset(intlTail.segment, 'domain', false);
  assertNonEmptyAsset(intlTail.segment, 'ipcidr', false);
  assertNonEmptyAsset(intlTail.segment, 'ipcidr-no-resolve', true);
  assertNonEmptyAsset(intlTail.segment, 'residual', true);

  const egernProfile = read('Egern/Egern.yaml');
  const profilePosition = (segment) => egernProfile.indexOf('provider-' + segment.id + '-');
  const lateCnsitePosition = profilePosition(lateCnsite.segment);
  const intlTailPosition = profilePosition(intlTail.segment);
  assert.ok(lateCnsitePosition >= 0, 'the late CN Egern rule set must be referenced by the profile');
  assert.ok(intlTailPosition >= 0, 'the final international Egern rule set must be referenced by the profile');
  assert.ok(lateCnsitePosition < intlTailPosition, 'the late CN authority segment must precede the final international fallback');
});

test('generated Clash and Surge payloads contain no removable duplicate rules', () => {
  for (const platform of ['clash', 'surge']) {
    const directory = path.join(FUSED_ROOT, platform);
    for (const file of fs.readdirSync(directory).filter((name) => name.endsWith('.list'))) {
      const entries = nonCommentLines(path.join(directory, file));
      const optimized = optimizeEntries(entries);
      assert.equal(optimized.stats.normalized, 0, `${platform}/${file} contains non-canonical rules`);
      assert.equal(optimized.stats.exactDuplicates, 0, `${platform}/${file} contains exact duplicates`);
      assert.equal(optimized.stats.domainSubsumed, 0, `${platform}/${file} contains subsumed domains`);
      assert.equal(optimized.stats.cidrSubsumed, 0, `${platform}/${file} contains subsumed CIDRs`);
    }
  }
});

test('later fused segments do not repeat an exact rule already matched earlier', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(FUSED_ROOT, 'manifest.json'), 'utf8'));
  const seen = new Map();
  const duplicates = [];
  for (const segment of manifest.segments) {
    const record = segment.files.clash;
    if (!record) continue;
    for (const file of record.parts || [record.file]) {
      for (const entry of nonCommentLines(path.join(FUSED_ROOT, 'clash', file))) {
        if (seen.has(entry)) duplicates.push(`${entry}: ${seen.get(entry)} -> ${segment.id}`);
        else seen.set(entry, segment.id);
      }
    }
  }
  assert.deepEqual(duplicates.slice(0, 20), [], `${duplicates.length} exact cross-segment duplicates`);
});

test('Mihomo source buckets do not repeat an exact rule across segments', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(FUSED_ROOT, 'manifest.json'), 'utf8'));
  const seen = new Map();
  const duplicates = [];
  for (const segment of manifest.segments) {
    const sources = [];
    if (segment.files.domain) {
      for (const entry of payloadEntries(path.join(FUSED_ROOT, 'mihomo', segment.files.domain.source))) {
        sources.push(entry);
      }
    }
    for (const [key, noResolve] of [['ipcidr', false], ['ipcidr_no_resolve', true]]) {
      if (!segment.files[key]) continue;
      for (const cidr of payloadEntries(path.join(FUSED_ROOT, 'mihomo', segment.files[key].source))) {
        sources.push(`${cidr.includes(':') ? 'IP-CIDR6' : 'IP-CIDR'},${cidr}${noResolve ? ',no-resolve' : ''}`);
      }
    }
    if (segment.files.residual) {
      for (const entry of payloadEntries(path.join(FUSED_ROOT, 'mihomo', segment.files.residual.file))) {
        sources.push(entry);
      }
    }
    for (const entry of sources) {
      if (seen.has(entry)) duplicates.push(`${entry}: ${seen.get(entry)} -> ${segment.id}`);
      else seen.set(entry, segment.id);
    }
  }
  assert.deepEqual(duplicates.slice(0, 20), [], `${duplicates.length} exact Mihomo cross-segment duplicates`);
});

test('Sing-box target rule sets do not repeat an exact rule across segments', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(FUSED_ROOT, 'manifest.json'), 'utf8'));
  const fieldTypes = {
    domain: 'DOMAIN',
    domain_suffix: 'DOMAIN-SUFFIX',
    domain_keyword: 'DOMAIN-KEYWORD',
    domain_regex: 'DOMAIN-REGEX',
    ip_cidr: 'IP-CIDR',
    source_ip_cidr: 'SRC-IP-CIDR',
    process_name: 'PROCESS-NAME',
    process_path: 'PROCESS-PATH',
    process_path_regex: 'PROCESS-PATH-REGEX',
  };
  const seen = new Map();
  const duplicates = [];
  for (const segment of manifest.segments.filter((row) => row.files.sing_box)) {
    const source = JSON.parse(fs.readFileSync(
      path.join(FUSED_ROOT, 'sing-box', segment.files.sing_box.source),
      'utf8',
    ));
    for (const rule of source.rules) {
      for (const [field, type] of Object.entries(fieldTypes)) {
        for (const value of rule[field] || []) {
          const actualType = field === 'ip_cidr' && value.includes(':') ? 'IP-CIDR6' : type;
          const entry = `${actualType},${value}`;
          if (seen.has(entry)) duplicates.push(`${entry}: ${seen.get(entry)} -> ${segment.id}`);
          else seen.set(entry, segment.id);
        }
      }
    }
  }
  assert.deepEqual(duplicates.slice(0, 20), [], `${duplicates.length} exact Sing-box cross-segment duplicates`);
});

function egernEntries(file) {
  const typeBySet = {
    domain_set: 'DOMAIN',
    domain_suffix_set: 'DOMAIN-SUFFIX',
    domain_keyword_set: 'DOMAIN-KEYWORD',
    domain_regex_set: 'DOMAIN-REGEX',
    domain_wildcard_set: 'DOMAIN-WILDCARD',
    geoip_set: 'GEOIP',
    ip_cidr_set: 'IP-CIDR',
    ip_cidr6_set: 'IP-CIDR6',
    asn_set: 'IP-ASN',
  };
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const noResolve = lines.some((line) => line.trim() === 'no_resolve: true');
  const entries = [];
  let type = null;
  for (const line of lines) {
    const key = line.match(/^([a-z0-9_]+):\s*$/);
    if (key) {
      type = typeBySet[key[1]] || null;
      continue;
    }
    const value = line.match(/^\s+-\s+(.+)$/);
    if (!type || !value) continue;
    const parsed = JSON.parse(value[1]);
    const modifier = noResolve && /^(?:GEOIP|IP-ASN|IP-CIDR|IP-CIDR6)$/.test(type) ? ',no-resolve' : '';
    entries.push(`${type},${parsed}${modifier}`);
  }
  return entries;
}

test('generated Egern payloads contain no removable duplicate rules', () => {
  const directory = path.join(REPO_ROOT, 'rulesets/generated/egern');
  for (const file of fs.readdirSync(directory).filter((name) => name.endsWith('.yaml'))) {
    const entries = egernEntries(path.join(directory, file));
    const optimized = optimizeEntries(entries);
    assert.equal(optimized.stats.exactDuplicates, 0, `egern/${file} contains exact duplicates`);
    assert.equal(optimized.stats.domainSubsumed, 0, `egern/${file} contains subsumed domains`);
    assert.equal(optimized.stats.cidrSubsumed, 0, `egern/${file} contains subsumed CIDRs`);
  }
});

test('later Egern rule-set assets do not repeat an exact rule already matched earlier', () => {
  const config = read('Egern/Egern.yaml');
  const marker = '/rulesets/generated/egern/';
  const files = [...config.matchAll(/^\s+match:\s+("[^"]+")\s*$/gm)]
    .map((match) => JSON.parse(match[1]))
    .filter((url) => url.includes(marker))
    .map((url) => path.basename(generatedAssetPath(url, marker)));
  const seen = new Map();
  const duplicates = [];
  for (const file of files) {
    const entries = egernEntries(path.join(REPO_ROOT, 'rulesets/generated/egern', file));
    assert.ok(entries.length > 0, `egern/${file} is an empty referenced rule set`);
    for (const entry of entries) {
      if (seen.has(entry)) duplicates.push(`${entry}: ${seen.get(entry)} -> ${file}`);
      else seen.set(entry, file);
    }
  }
  assert.deepEqual(duplicates.slice(0, 20), [], `${duplicates.length} exact cross-asset Egern duplicates`);
});
