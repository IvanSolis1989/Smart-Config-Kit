#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  DOMESTIC_AUTHORITY_ANCHOR_RULE,
  GENERIC_INTL_FALLBACK_RULES,
  SOURCE_GRAPH_VERSION,
  getRawRoutingGraph,
} = require('../../rulesets/source/routing-graph');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FUSED_ROOT = path.join(REPO_ROOT, 'rulesets/generated/fused');
const CN_SITE = '🏠 国内网站';
const CN_MEDIA = '📺 国内流媒体';
const DIRECT = 'DIRECT';
const NVIDIA_CHINA_LOGIN_HOST = 'login.nvidia.cn';
const LINUX_DO_MAINLAND_HOSTS = [
  'linuxdo.org',
  'connect.linuxdo.org',
  'invite.linuxdo.org',
];
const NETEASE_GAME_DIRECT_HOSTS = [
  'drpf-g10.proxima.nie.netease.com',
  'sigma-performance-g10.proxima.nie.netease.com',
];
const WECHAT_HTTPDNS_DIRECT_HOSTS = [
  'dns.weixin.qq.com',
  'dns.weixin.qq.com.cn',
];

function readText(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function parseFusedRules() {
  const source = readText('Clash Party/ClashParty(mihomo-smart).js');
  const match = source.match(/const\s+MIHOMO_FUSED_RULES\s*=\s*(\[[^\r\n]*\])/);
  assert.ok(match, 'Clash Party Smart must contain MIHOMO_FUSED_RULES');
  return JSON.parse(match[1]);
}

function ruleSetEntries(segment) {
  const entry = segment.files && segment.files.clash;
  const files = Array.isArray(entry && entry.parts) ? entry.parts : [entry && entry.file].filter(Boolean);
  return files.flatMap((file) => readText(`rulesets/generated/fused/clash/${file}`)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#')));
}

function wildcardMatches(pattern, host) {
  const expression = `^${pattern.split('*').map((part) => part.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')).join('.*')}$`;
  return new RegExp(expression, 'i').test(host);
}

function matchesDomainRule(rule, host) {
  const [type, value] = rule.split(',', 3);
  const normalized = host.toLowerCase();
  const candidate = String(value || '').toLowerCase();
  if (type === 'DOMAIN') return normalized === candidate;
  if (type === 'DOMAIN-SUFFIX') return normalized === candidate || normalized.endsWith(`.${candidate}`);
  if (type === 'DOMAIN-KEYWORD') return normalized.includes(candidate);
  if (type === 'DOMAIN-WILDCARD') return wildcardMatches(candidate, normalized);
  if (type === 'DOMAIN-REGEX') return new RegExp(value, 'i').test(normalized);
  return false;
}

function firstDomainRoute(host) {
  const manifest = JSON.parse(fs.readFileSync(path.join(FUSED_ROOT, 'manifest.json'), 'utf8'));
  const segments = new Map(manifest.segments.map((segment) => [segment.id, segment]));
  for (const rule of parseFusedRules()) {
    const [type, provider, policy] = rule.split(',', 3);
    if (type !== 'RULE-SET' || !provider.endsWith('-domain')) continue;
    const segment = segments.get(provider.slice(0, -'-domain'.length));
    if (segment && ruleSetEntries(segment).some((entry) => matchesDomainRule(entry, host))) {
      return { provider, policy };
    }
  }
  return null;
}

test('all generic CDN, geolocation and region fallbacks stay after domestic authority', () => {
  const graph = getRawRoutingGraph();
  const anchorIndex = graph.rules.indexOf(DOMESTIC_AUTHORITY_ANCHOR_RULE);
  const genericIndexes = GENERIC_INTL_FALLBACK_RULES.map((rule) => graph.rules.indexOf(rule));
  const regionalIndexes = graph.rules
    .map((rule, index) => ({ rule, index }))
    .filter(({ rule }) => /^RULE-SET,acc-geo-(?:d|ip)-(?!asia-china,)[^,]+,🌐 国外网站/.test(rule))
    .map(({ index }) => index);

  assert.ok(anchorIndex >= 0, 'domestic authority anchor must exist');
  assert.equal(genericIndexes.length, 43, 'generic fallback inventory must include every shared edge/CDN/geo rule');
  assert.ok(genericIndexes.every((index, position) => graph.rules.filter((rule) => rule === GENERIC_INTL_FALLBACK_RULES[position]).length === 1), 'generic fallback inventory rules must not be injected twice');
  assert.ok(genericIndexes.every((index) => index > anchorIndex), 'every generic fallback must follow domestic authority');
  assert.equal(regionalIndexes.length, 32, 'all 16 non-China regions must retain domain and IP fallbacks');
  assert.ok(regionalIndexes.every((index) => index > anchorIndex), 'every regional fallback must follow domestic authority');
});

test('reported domestic services and representative shared-CDN hosts keep their first-match policy', () => {
  const cases = [
    ['www.mi.com', CN_SITE],
    ['api-paas.yunxuetang.cn', CN_SITE],
    ['apiws-phx-tc.yunxuetang.cn', CN_SITE],
    ['images.yxt.com', CN_SITE],
    ['stc.yxt.com', CN_SITE],
    ['g.alicdn.com', CN_MEDIA],
    ['o.alicdn.com', CN_MEDIA],
    ['x.alicdn.com', CN_MEDIA],
    ['hudong.alicdn.com', CN_MEDIA],
    ['s.url.cn', CN_SITE],
    ['wwcdn.weixin.qq.com', CN_SITE],
    ['login.work.weixin.qq.com', CN_SITE],
    ['res.wx.qq.com', CN_SITE],
    ['docpr.weixin.qq.com', CN_SITE],
    ['doc.weixin.qq.com', CN_SITE],
    ['drive.weixin.qq.com', CN_SITE],
    ['tencent-doc.cdn-go.cn', CN_SITE],
    ['cube.weixinbridge.com', CN_SITE],
  ];

  for (const [host, policy] of cases) {
    const route = firstDomainRoute(host);
    assert.ok(route, `${host} must match a fused domain rule set`);
    assert.equal(route.policy, policy, `${host} first matched ${route.provider}`);
  }
});

test('LINUX DO mainland backup domain stays domestic without broadening the main site', () => {
  const domesticGuard = readText('rulesets/supplemental/clash/cnsite-guard.list');
  const qxGuard = readText('rulesets/supplemental/quantumultx/cnsite-guard.list');
  const egernProvider = readText('rulesets/generated/egern/provider-scki-fused-013-cn-site-domain.yaml');
  const qxFused = readText('rulesets/generated/fused/quantumultx/scki-fused-013-cn-site.list');
  const surgeFused = readText('rulesets/generated/fused/surge/scki-fused-013-cn-site.list');
  const singBoxFused = JSON.parse(readText('rulesets/generated/fused/sing-box/scki-fused-013-cn-site.json'));
  const xrayRules = JSON.parse(readText('v2rayN/v2rayN(xray).json'));
  const xrayDomesticRule = xrayRules.find((rule) => rule.id === 'scki-fused-013-cn-site');
  const fusedRules = parseFusedRules();
  const domesticIndex = fusedRules.indexOf('RULE-SET,scki-fused-013-cn-site-domain,🏠 国内网站');
  const genericIntlIpIndex = fusedRules.findIndex((rule) => rule.startsWith('RULE-SET,scki-fused-068-intl-site-ipcidr,'));
  assert.match(domesticGuard, /^DOMAIN-SUFFIX,linuxdo\.org$/m);
  assert.match(qxGuard, /^host-suffix, linuxdo\.org$/m);
  assert.match(egernProvider, /^  - "linuxdo\.org"$/m);
  assert.match(qxFused, /^host-suffix, linuxdo\.org$/m);
  assert.match(surgeFused, /^DOMAIN-SUFFIX,linuxdo\.org$/m);
  assert.ok(singBoxFused.rules[0].domain_suffix.includes('linuxdo.org'));
  assert.ok(xrayDomesticRule.domain.includes('domain:linuxdo.org'));
  assert.ok(domesticIndex >= 0, 'the LINUX DO domestic domain segment must exist');
  assert.ok(genericIntlIpIndex > domesticIndex, 'the LINUX DO domestic segment must precede the generic international IP fallback');

  for (const host of LINUX_DO_MAINLAND_HOSTS) {
    assert.deepEqual(firstDomainRoute(host), {
      provider: 'scki-fused-013-cn-site-domain',
      policy: CN_SITE,
    });
  }

  assert.deepEqual(firstDomainRoute('linux.do'), {
    provider: 'scki-fused-059-gfw-domain',
    policy: '🚫 受限网站',
  }, 'linux.do must retain its existing GFW route');
});

test('reported NetEase game endpoints use the early direct guard before generic game routing', () => {
  const graph = getRawRoutingGraph();
  const directGuardIndex = graph.rules.indexOf('RULE-SET,scki-adfp-direct,DIRECT');
  const antiAdIndex = graph.rules.indexOf('RULE-SET,anti-ad,🛑 广告拦截');
  const domesticGameIndex = graph.rules.indexOf('DOMAIN-SUFFIX,netease.com,🕹️ 国内游戏');

  assert.ok(directGuardIndex >= 0, 'the early direct guard must exist');
  assert.ok(antiAdIndex >= 0, 'the upstream anti-AD segment must exist');
  assert.ok(domesticGameIndex >= 0, 'the generic NetEase domestic-game rule must exist');
  assert.ok(directGuardIndex < antiAdIndex, 'the direct guard must precede anti-AD');
  assert.ok(directGuardIndex < domesticGameIndex, 'the direct guard must precede domestic games');

  const directGuard = readText('rulesets/supplemental/clash/adfp-direct.list');
  const shadowrocket = readText('Shadowrocket/Shadowrocket.conf');
  const shadowrocketDirectRule = `scki-fused-001-direct.list?scki=${SOURCE_GRAPH_VERSION},DIRECT`;
  const shadowrocketGameRule = `scki-fused-060-game-cn.list?scki=${SOURCE_GRAPH_VERSION},🕹️ 国内游戏`;
  assert.ok(shadowrocket.indexOf(shadowrocketDirectRule) < shadowrocket.indexOf(shadowrocketGameRule), 'Shadowrocket must reference the direct guard before domestic games');

  for (const host of NETEASE_GAME_DIRECT_HOSTS) {
    assert.match(directGuard, new RegExp(`^DOMAIN,${host}$`, 'm'));
    assert.deepEqual(firstDomainRoute(host), {
      provider: 'scki-fused-001-direct-domain',
      policy: DIRECT,
    });
  }
});

test('NVIDIA China login uses the early exact direct guard before generic NVIDIA download routing', () => {
  const graph = getRawRoutingGraph();
  const directGuardIndex = graph.rules.indexOf('RULE-SET,scki-adfp-direct,DIRECT');
  const nvidiaDownloadIndex = graph.rules.indexOf('RULE-SET,nvidia,📥 下载更新');

  assert.ok(directGuardIndex >= 0, 'the early direct guard must exist');
  assert.ok(nvidiaDownloadIndex >= 0, 'the generic NVIDIA download rule must exist');
  assert.ok(directGuardIndex < nvidiaDownloadIndex, 'the exact direct guard must precede generic NVIDIA downloads');

  const directGuard = readText('rulesets/supplemental/clash/adfp-direct.list');
  assert.match(directGuard, new RegExp(`^DOMAIN,${NVIDIA_CHINA_LOGIN_HOST}$`, 'm'));
  assert.deepEqual(firstDomainRoute(NVIDIA_CHINA_LOGIN_HOST), {
    provider: 'scki-fused-001-direct-domain',
    policy: DIRECT,
  });

  for (const host of ['download.nvidia.com', 'developer.nvidia.com']) {
    assert.equal(firstDomainRoute(host)?.policy, '📥 下载更新', `${host} must keep the generic NVIDIA download policy`);
  }
});

test('WeChat HTTPDNS endpoints bypass generic BlockHttpDNS rejection through the early direct guard', () => {
  const graph = getRawRoutingGraph();
  const directGuardIndex = graph.rules.indexOf('RULE-SET,scki-adfp-direct,DIRECT');
  const blockHttpDnsIndex = graph.rules.indexOf('RULE-SET,blockhttpdns,🛑 广告拦截');
  const blockHttpDnsPlusIndex = graph.rules.indexOf('RULE-SET,acc-blockhttpdnsplus,🛑 广告拦截');
  const directGuard = readText('rulesets/supplemental/clash/adfp-direct.list');

  assert.ok(directGuardIndex >= 0, 'the early direct guard must exist');
  assert.ok(blockHttpDnsPlusIndex >= 0, 'the supplementary BlockHttpDNS rule must exist');
  assert.ok(blockHttpDnsIndex >= 0, 'the upstream BlockHttpDNS rule must exist');
  assert.ok(directGuardIndex < blockHttpDnsPlusIndex, 'the direct guard must precede supplementary BlockHttpDNS');
  assert.ok(directGuardIndex < blockHttpDnsIndex, 'the direct guard must precede upstream BlockHttpDNS');

  for (const host of WECHAT_HTTPDNS_DIRECT_HOSTS) {
    assert.match(directGuard, new RegExp(`^DOMAIN,${host}$`, 'm'));
    assert.deepEqual(firstDomainRoute(host), {
      provider: 'scki-fused-001-direct-domain',
      policy: DIRECT,
    });
  }
});
