#!/usr/bin/env node
'use strict';
const { resolveContractSegments } = require('../lib/fused-contract-segments');
const CONTRACT_SEGMENTS = resolveContractSegments();

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
const { loadRepository, parseFusedRules: parseRules, firstDomainRoute: projectDomainRoute, firstMatch, matchEntry } = require('../lib/ordered-rule-semantics');
const SEMANTICS = loadRepository({ root: REPO_ROOT });
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
const WECHAT_CONNECTION_DIRECT_HOSTS = [
  'szlong.weixin.qq.com',
  'hklong.weixin.qq.com',
  'hkshort.weixin.qq.com',
];

function readText(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function parseFusedRules() {
  return parseRules(readText('Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js'));
}

// Deliberate domain-provider projection; this does not assert full connection routing.
function firstDomainRoute(host) {
  return projectDomainRoute(SEMANTICS, host);
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

// This finite projection records the first decidable pure-domain predicate, including
// residual keywords. Unknown RE2 blockers remain in the shared evidence result;
// it does not establish complete first-match connection routing.
function firstAuditDomainRoute(host) {
  const result = firstMatch(SEMANTICS, { host }, { mode: 'domain-projection' });
  return result.firstDecidableMatch;
}

function firstProcessRoute(processName) {
  for (const row of SEMANTICS.rules) {
    const provider = SEMANTICS.providers.get(row.provider);
    for (const entry of provider?.entries || []) {
      if (!entry.startsWith('PROCESS-NAME,')) continue;
      if (matchEntry(entry, { processName }).status === 'match') return { policy: row.policy, provider: row.provider };
    }
  }
  return null;
}

test('confirmed routing audit collisions retain their declared business policy', () => {
  const cases = [
    ['www.wegame.com.cn', '🕹️ 国内游戏'],
    ['ptlogin2.wegame.com.cn', '🕹️ 国内游戏'],
    ['keepalive.wegame.com.cn', '🕹️ 国内游戏'],
    ['dir-update.wegame.com.cn', '🕹️ 国内游戏'],
    ['lol-data-filter.wegame.com.cn', '🕹️ 国内游戏'],
    ['wegame.gtimg.com', '🕹️ 国内游戏'],
    ['ied-tqos-tgp.qq.com', '🕹️ 国内游戏'],
    ['mlol.qt.qq.com', '🕹️ 国内游戏'],
    ['hn1-k8s-sgp.lol.qq.com', '🕹️ 国内游戏'],
    ['tqos.gamesafe.qq.com', '🕹️ 国内游戏'],
    ['tqos.anticheatexpert.com', '🕹️ 国内游戏'],
    ['cn.voice.gcloudcs.com', '🕹️ 国内游戏'],
    ['idcconfig.gcloudsdk.com', '🕹️ 国内游戏'],
    ['lol.ams.game.qq.com', '🕹️ 国内游戏'],
    ['img.crawler.qq.com', '🕹️ 国内游戏'],
    ['api.me.com', '🍎 苹果服务'],
    ['mail.me.com', '🌐 国外网站'],
    ['api.apple.com', '🍎 苹果服务'],
    ['login.live.com', 'Ⓜ️ 微软服务'],
    ['g.live.com', 'Ⓜ️ 微软服务'],
    ['designerapp.officeapps.live.com', '🤖 AI 服务'],
    ['edge.microsoft.com', 'Ⓜ️ 微软服务'],
    ['aks-prod-southeastasia.access-point.cloudmessaging.edge.microsoft.com', 'Ⓜ️ 微软服务'],
    ['ecs.office.com', 'Ⓜ️ 微软服务'],
    ['assets.msn.com', 'Ⓜ️ 微软服务'],
    ['api.msn.com', 'Ⓜ️ 微软服务'],
    ['ntp.msn.com', 'Ⓜ️ 微软服务'],
    ['storage.live.com', 'Ⓜ️ 微软服务'],
    ['nav-edge.smartscreen.microsoft.com', 'Ⓜ️ 微软服务'],
    ['onedriveclucprodbn20003.blob.core.windows.net', 'Ⓜ️ 微软服务'],
    ['onedriveclucproddm20046.blob.core.windows.net', 'Ⓜ️ 微软服务'],
    ['onedrive.live.com', 'Ⓜ️ 微软服务'],
    ['copilot.microsoft.com', '🤖 AI 服务'],
    ['cr.m365copilotapp.svc.cloud.microsoft', '🤖 AI 服务'],
    ['mail.live.com', '🌐 国外网站'],
    ['outlook.live.com', '🌐 国外网站'],
    ['odc.officeapps.live.com', 'Ⓜ️ 微软服务'],
    ['gyao.yahoo.co.jp', '🇯🇵 日韩流媒体'],
    ['kakaotv.daum.net', '🇯🇵 日韩流媒体'],
    ['www.yahoo.co.jp', '🔧 工具与服务'],
    ['aws.amazon.com', '🔧 工具与服务'],
    ['elasticbeanstalk.com', '🔧 工具与服务'],
    ['app.heroku.com', '🔧 工具与服务'],
    ['myapp.herokuapp.com', '🔧 工具与服务'],
    ['amazon.com', '🌐 国外网站'],
    ['www.amazon.co.jp', '🌐 国外网站'],
    ['www.amazon.com', '🌐 国外网站'],
    ['www.primevideo.com', '🎬 Prime Video'],
    ['configuration-server-lb-1105093370.us-east-1.elb.amazonaws.com', '🌐 国外网站'],
    ['generic-cdn-node.cloudfront.net', '🌐 国外网站'],
    ['client.relay.crisp.chat', '🌐 国外网站'],
    ['awsstatic.com', '🌐 国外网站'],
    ['foo.azureedge.net', '🌐 国外网站'],
    ['foo.azurefd.net', '🌐 国外网站'],
    ['otelrules.azureedge.net', 'Ⓜ️ 微软服务'],
    ['mlccdnprod.azureedge.net', 'Ⓜ️ 微软服务'],
    ['flightsimulator.azureedge.net', 'Ⓜ️ 微软服务'],
    ['cdn.msecnd.net', 'Ⓜ️ 微软服务'],
    ['foo.akamai.net', '🌐 国外网站'],
    ['foo.akamaihd.net', '🌐 国外网站'],
    ['foo.akamaized.net', '🌐 国外网站'],
    ['foo.edgesuite.net', '🌐 国外网站'],
    ['openaiapi-site.azureedge.net', '🤖 AI 服务'],
    ['cdn.lemon8cdn.com', '📱 社交媒体'],
    ['api.lemon8-app.com', '📱 社交媒体'],
    ['api.byteoversea.com', '🎵 TikTok'],
    ['foo.capcut.com', '🎵 TikTok'],
    ['api.capcutapi.com', '🎵 TikTok'],
    ['vcs-sg.byteoversea.com', '🤖 AI 服务'],
    ['api.marscode.com', '🤖 AI 服务'],
    ['ntes53.netease.com', CN_MEDIA],
    ['cdn.bootcss.com', CN_SITE],
    ['assets.staticfile.org', CN_SITE],
  ];

  for (const [host, policy] of cases) {
    assert.equal(firstAuditDomainRoute(host)?.policy, policy, `${host} must keep its intended route`);
  }
  assert.notEqual(firstAuditDomainRoute('notmsecnd.net')?.policy, 'Ⓜ️ 微软服务', 'msecnd.net must use a suffix boundary, not a substring match');

  for (const host of [
    'crl3.digicert.com', 'crl4.digicert.com',
    'ocsp.digicert.com', 'ocsp.sectigo.com',
  ]) {
    assert.equal(firstAuditDomainRoute(host)?.policy, DIRECT, `${host} must use the early certificate-status DIRECT exception`);
  }
  for (const host of [
    'logs.game.qq.com', 'sentry.qt.qq.com', 'prod-diagnostic.lol.qq.com',
    'self.events.data.microsoft.com', 'c.msn.com', 'srtb.msn.com',
    'arc.msn.com', 'browser.events.data.msn.com',
    'd2wy8f7a9ursnm.cloudfront.net',
  ]) {
    assert.equal(firstAuditDomainRoute(host)?.policy, '🛑 广告拦截', `${host} must remain blocked before broad product-domain guards`);
  }
  assert.notEqual(firstAuditDomainRoute('fakeapple.invalid')?.policy, '🍎 苹果服务');

  for (const [processName, policy] of [
    ['TikTok', '🎵 TikTok'],
    ['CapCut', '🎵 TikTok'],
    ['Lemon8', '📱 社交媒体'],
  ]) {
    assert.equal(firstProcessRoute(processName)?.policy, policy, `${processName} must keep its app route`);
  }

  const downloads = [
    'windowsupdate.com', 'update.microsoft.com', 'download.microsoft.com',
    'delivery.mp.microsoft.com', 'officecdn.microsoft.com',
    'officecdn.microsoft.com.edgesuite.net', 'archive.ubuntu.com',
    'security.ubuntu.com', 'mirrors.kernel.org', 'dl.fedoraproject.org',
    'repo.anaconda.com', 'conda.anaconda.org', 'repo.continuum.io',
    'sourceforge.net', 'fosshub.com', 'filehippo.com', 'softonic.com',
    'gcr.io', 'ghcr.io', 'quay.io', 'registry.k8s.io',
    'down.qq.com', 'dldir1.qq.com',
    'lol-wegame-client-1258344700.file.myqcloud.com',
  ];
  for (const host of downloads) {
    assert.equal(firstAuditDomainRoute(host)?.policy, '📥 下载更新', `${host} must keep its download route`);
  }

  const ciciaiMirror = readText('mirrors/CiciAi.list');
  assert.doesNotMatch(ciciaiMirror, /^DOMAIN-KEYWORD,byteoversea$/m);
  assert.doesNotMatch(ciciaiMirror, /^PROCESS-NAME,(?:TikTok|CapCut|Lemon8)$/m);
});

test('LINUX DO mainland backup domain stays domestic without broadening the main site', () => {
  const domesticGuard = readText('rulesets/supplemental/clash/cnsite-guard.list');
  const qxGuard = readText('rulesets/supplemental/quantumultx/cnsite-guard.list');
  const egernProvider = readText(`rulesets/generated/egern/provider-${CONTRACT_SEGMENTS["scki-fused-013-cn-site"]}-domain.yaml`);
  const qxFused = readText(`rulesets/generated/fused/quantumultx/${CONTRACT_SEGMENTS["scki-fused-013-cn-site"]}.list`);
  const surgeFused = readText(`rulesets/generated/fused/surge/${CONTRACT_SEGMENTS["scki-fused-013-cn-site"]}.list`);
  const singBoxFused = JSON.parse(readText(`rulesets/generated/fused/sing-box/${CONTRACT_SEGMENTS["scki-fused-013-cn-site"]}.json`));
  const xrayRules = JSON.parse(readText('Xray内核系/v2rayN/v2rayN(xray).json'));
  const xrayDomesticRule = xrayRules.find((rule) => rule.id === `${CONTRACT_SEGMENTS["scki-fused-013-cn-site"]}`);
  const fusedRules = parseFusedRules();
  const domesticIndex = fusedRules.indexOf(`RULE-SET,${CONTRACT_SEGMENTS["scki-fused-013-cn-site"]}-domain,🏠 国内网站`);
  const genericIntlIpIndex = fusedRules.findIndex((rule) => rule.startsWith(`RULE-SET,${CONTRACT_SEGMENTS["scki-fused-068-intl-site"]}-ipcidr,`));
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
      provider: `${CONTRACT_SEGMENTS["scki-fused-013-cn-site"]}-domain`,
      policy: CN_SITE,
    });
  }

  assert.deepEqual(firstDomainRoute('linux.do'), {
    provider: `${CONTRACT_SEGMENTS["scki-fused-059-gfw"]}-domain`,
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
  const shadowrocket = readText('独立内核系/Shadowrocket/Shadowrocket.conf');
  const shadowrocketDirectRule = `${CONTRACT_SEGMENTS["scki-fused-001-direct"]}.list?scki=${SOURCE_GRAPH_VERSION},DIRECT`;
  const shadowrocketGameRule = `${CONTRACT_SEGMENTS["scki-fused-060-game-cn"]}.list?scki=${SOURCE_GRAPH_VERSION},🕹️ 国内游戏`;
  assert.ok(shadowrocket.indexOf(shadowrocketDirectRule) < shadowrocket.indexOf(shadowrocketGameRule), 'Shadowrocket must reference the direct guard before domestic games');

  for (const host of NETEASE_GAME_DIRECT_HOSTS) {
    assert.match(directGuard, new RegExp(`^DOMAIN,${host}$`, 'm'));
    assert.deepEqual(firstDomainRoute(host), {
      provider: `${CONTRACT_SEGMENTS["scki-fused-001-direct"]}-domain`,
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
    provider: `${CONTRACT_SEGMENTS["scki-fused-001-direct"]}-domain`,
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
      provider: `${CONTRACT_SEGMENTS["scki-fused-001-direct"]}-domain`,
      policy: DIRECT,
    });
  }
});

for (const host of WECHAT_CONNECTION_DIRECT_HOSTS) {
  for (const [label, processFields] of [
    ['desktop process', { processName: 'Weixin.exe' }],
    ['without process metadata', {}],
  ]) {
    test(`WeChat connection endpoint ${host} reaches the early direct guard ${label}`, () => {
      const route = firstMatch(SEMANTICS, {
        host, network: 'tcp', destinationPort: 443, ...processFields,
      });
      assert.equal(route.status, 'match', `${host} must have a decidable first match ${label}`);
      assert.equal(route.policy, DIRECT, `${host} must reach DIRECT independently of process discovery`);
      assert.equal(route.hit.provider, `${CONTRACT_SEGMENTS['scki-fused-001-direct']}-domain`);
      assert.deepEqual(firstDomainRoute(host), {
        provider: `${CONTRACT_SEGMENTS['scki-fused-001-direct']}-domain`,
        policy: DIRECT,
      });
    });
  }
}

test('WeChat connection exceptions preserve sibling ad rejection and do not exempt the parent or child domains', () => {
  for (const host of ['ad.weixin.qq.com', 'log.weixin.qq.com']) {
    const route = firstMatch(SEMANTICS, {
      host, network: 'tcp', destinationPort: 443, processName: 'Weixin.exe',
    });
    assert.equal(route.status, 'match');
    assert.equal(route.policy, '🛑 广告拦截', `${host} must retain its existing ad/privacy rejection`);
  }
  for (const host of ['weixin.qq.com', ...WECHAT_CONNECTION_DIRECT_HOSTS.map(host => `child.${host}`)]) {
    assert.equal(firstDomainRoute(host)?.policy, CN_SITE, `${host} must retain the domestic policy outside the exact exceptions`);
  }
});
