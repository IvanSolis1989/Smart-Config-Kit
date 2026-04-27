const fs = require('fs');
const vm = require('vm');

const VERSION = 'v5.3.1-sing.1';
const BUILD = '2026-04-28';
const BASELINE = 'Clash Party v5.3.1';

const SMART = {
  GLOBAL: '🌍 全球节点',
  GLOBAL_HOME: '🏡 全球家宽',
  HK: '🇭🇰 香港节点',
  HK_HOME: '🏡 香港家宽',
  TW: '🇹🇼 台湾节点',
  TW_HOME: '🏡 台湾家宽',
  JPKR: '🇯🇵 日韩节点',
  JPKR_HOME: '🏡 日韩家宽',
  APAC: '🌏 亚太节点',
  APAC_HOME: '🏡 亚太家宽',
  US: '🇺🇸 美国节点',
  US_HOME: '🏡 美国家宽',
  EU: '🇪🇺 欧洲节点',
  EU_HOME: '🏡 欧洲家宽',
  AMERICAS: '🌎 美洲节点',
  AMERICAS_HOME: '🏡 美洲家宽',
  AFRICA: '🌍 非洲节点',
  AFRICA_HOME: '🏡 非洲家宽'
};

const BIZ = {
  AI: '🤖 AI 服务',
  CRYPTO: '💰 加密货币',
  PAYMENTS: '🏦 金融支付',
  IM: '💬 即时通讯',
  SOCIAL: '📱 社交媒体',
  WORK: '🧑‍💼 会议协作',
  CNMEDIA: '📺 国内流媒体',
  NFLX: '🎥 Netflix',
  DSNP: '🎬 Disney+',
  HBO: '📡 HBO/Max',
  HULU: '📺 Hulu',
  PRIME: '🎬 Prime Video',
  YT: '📹 YouTube',
  MUSIC: '🎵 音乐流媒体',
  STREAM_OTHER: '🌐 其他国外流媒体',
  STREAM_HK: '🇭🇰 香港流媒体',
  STREAM_TW: '🇹🇼 台湾流媒体',
  STREAM_JP: '🇯🇵 日韩流媒体',
  STREAM_EU: '🇪🇺 欧洲流媒体',
  GAME_CN: '🕹️ 国内游戏',
  GAME_INTL: '🎮 国外游戏',
  TOOLS: '🔧 工具与服务',
  MS: 'Ⓜ️ 微软服务',
  APPLE: '🍎 苹果服务',
  DOWNLOAD: '📥 下载更新',
  TRACKER: '🛰️ BT/PT Tracker',
  CN_SITE: '🏠 国内网站',
  GFW: '🚫 受限网站',
  INTL_SITE: '🌐 国外网站',
  FINAL: '🐟 漏网之鱼',
  AD: '🛑 广告拦截'
};

const REGION_ORDER = ['GLOBAL', 'HK', 'TW', 'JPKR', 'APAC', 'US', 'EU', 'AMERICAS', 'AFRICA'];
const REGION_HOME_MAP = {
  GLOBAL: 'GLOBAL_HOME',
  HK: 'HK_HOME',
  TW: 'TW_HOME',
  JPKR: 'JPKR_HOME',
  APAC: 'APAC_HOME',
  US: 'US_HOME',
  EU: 'EU_HOME',
  AMERICAS: 'AMERICAS_HOME',
  AFRICA: 'AFRICA_HOME'
};

const REGION_SELECTOR_MEMBERS = {
  HK: ['proxy-hk-1', 'proxy-hk-2', 'DIRECT'],
  HK_HOME: ['proxy-hk-home-1', 'DIRECT'],
  TW: ['proxy-tw-1', 'DIRECT'],
  TW_HOME: ['proxy-tw-home-1', 'DIRECT'],
  JPKR: ['proxy-jp-1', 'proxy-kr-1', 'DIRECT'],
  JPKR_HOME: ['proxy-jp-home-1', 'proxy-kr-home-1', 'DIRECT'],
  APAC: ['proxy-sg-1', 'proxy-id-1', 'proxy-hk-1', 'proxy-jp-1', 'DIRECT'],
  APAC_HOME: ['proxy-sg-home-1', 'proxy-hk-home-1', 'proxy-jp-home-1', 'proxy-tw-home-1', 'DIRECT'],
  US: ['proxy-us-1', 'proxy-us-2', 'DIRECT'],
  US_HOME: ['proxy-us-home-1', 'DIRECT'],
  EU: ['proxy-eu-1', 'DIRECT'],
  EU_HOME: ['proxy-eu-home-1', 'DIRECT'],
  AMERICAS: ['proxy-ca-1', 'proxy-us-1', 'DIRECT'],
  AMERICAS_HOME: ['proxy-ca-home-1', 'proxy-us-home-1', 'DIRECT'],
  AFRICA: ['proxy-af-1', 'DIRECT'],
  AFRICA_HOME: ['proxy-af-home-1', 'DIRECT']
};

const REGION_PLACEHOLDERS = [
  ['proxy-hk-1', 'example-hk-1.com'],
  ['proxy-hk-2', 'example-hk-2.com'],
  ['proxy-hk-home-1', 'example-hk-home-1.com'],
  ['proxy-tw-1', 'example-tw-1.com'],
  ['proxy-tw-home-1', 'example-tw-home-1.com'],
  ['proxy-jp-1', 'example-jp-1.com'],
  ['proxy-kr-1', 'example-kr-1.com'],
  ['proxy-jp-home-1', 'example-jp-home-1.com'],
  ['proxy-kr-home-1', 'example-kr-home-1.com'],
  ['proxy-sg-1', 'example-sg-1.com'],
  ['proxy-id-1', 'example-id-1.com'],
  ['proxy-sg-home-1', 'example-sg-home-1.com'],
  ['proxy-us-1', 'example-us-1.com'],
  ['proxy-us-2', 'example-us-2.com'],
  ['proxy-us-home-1', 'example-us-home-1.com'],
  ['proxy-eu-1', 'example-eu-1.com'],
  ['proxy-eu-home-1', 'example-eu-home-1.com'],
  ['proxy-ca-1', 'example-ca-1.com'],
  ['proxy-ca-home-1', 'example-ca-home-1.com'],
  ['proxy-af-1', 'example-af-1.com'],
  ['proxy-af-home-1', 'example-af-home-1.com']
];

const clashScript = fs.readFileSync('Clash Party/ClashParty(mihomo-smart).js', 'utf8');
const baseConfig = JSON.parse(fs.readFileSync('SingBox/SingBox(sing-box)-full.json', 'utf8'));

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(clashScript + '\nthis.__main = main;', sandbox);
if (typeof sandbox.__main !== 'function') throw new Error('main() not found');

function p(name) {
  return { name, type: 'trojan', server: 'example.com', port: 443, password: 'x', tls: true };
}

const proxies = [
  p('🇭🇰 HK-01'),
  p('🇭🇰 HK-Home'),
  p('🇹🇼 TW-Home'),
  p('🇯🇵 JP-Home'),
  p('🇸🇬 SG-Home'),
  p('🇺🇸 US-Home'),
  p('🇪🇺 EU-Home'),
  p('🇨🇦 CA-Home'),
  p('🇿🇦 South Africa-Home'),
  p('🇹🇼 TW-01'),
  p('🇯🇵 JP-01'),
  p('🇰🇷 KR-01'),
  p('🇸🇬 SG-01'),
  p('印尼 Jakarta 01'),
  p('🇺🇸 US-01'),
  p('🇺🇸 US-02'),
  p('🇪🇺 DE-01'),
  p('🇨🇦 CA-01'),
  p('🇿🇦 South Africa-01'),
  p('🇨🇳 回国专线-01')
];

const clashConfig = { proxies, 'proxy-groups': [], rules: [] };
const out = sandbox.__main(clashConfig);
const providers = out['rule-providers'] || {};
const rules = out.rules || [];
const ADS_OUTBOUND = '🛑 广告拦截';

function withResidential(keys) {
  const result = [];
  for (const key of keys) {
    if (SMART[key]) result.push(SMART[key]);
    const homeKey = REGION_HOME_MAP[key];
    if (homeKey && SMART[homeKey]) result.push(SMART[homeKey]);
  }
  return result;
}

function buildHomeFirstProxies(keys) {
  const homes = [];
  const full = [];
  for (const key of keys) {
    const homeKey = REGION_HOME_MAP[key];
    if (homeKey && SMART[homeKey]) homes.push(SMART[homeKey]);
  }
  for (const key of keys) {
    if (SMART[key]) full.push(SMART[key]);
  }
  return homes.concat(full, ['DIRECT']);
}

function buildStandardProxies() {
  return withResidential(REGION_ORDER).concat('DIRECT');
}

function buildDirectFirstProxies() {
  return ['DIRECT'].concat(withResidential(REGION_ORDER));
}

function buildTrackerProxies() {
  return ['REJECT', 'DIRECT'].concat(withResidential(['GLOBAL', 'HK', 'APAC']));
}

function buildRegionPreferredProxies(primaryKey) {
  const order = [primaryKey].concat(REGION_ORDER.filter((key) => key !== primaryKey));
  return withResidential(order).concat('DIRECT');
}

function selector(tag, outbounds) {
  return {
    type: 'selector',
    tag,
    outbounds,
    default: outbounds[0]
  };
}

function urltest(tag, outbounds) {
  return {
    type: 'urltest',
    tag,
    outbounds,
    interval: '3m',
    tolerance: 50
  };
}

function trojanTemplate(tag, server) {
  return {
    type: 'trojan',
    tag,
    server,
    server_port: 443,
    password: 'REPLACE_ME',
    tls: {
      enabled: true,
      server_name: server
    }
  };
}

function buildOutbounds() {
  const businessOutbounds = [
    selector(BIZ.AI, buildHomeFirstProxies(REGION_ORDER)),
    selector(BIZ.CRYPTO, buildStandardProxies()),
    selector(BIZ.PAYMENTS, buildStandardProxies()),
    selector(BIZ.IM, buildStandardProxies()),
    selector(BIZ.SOCIAL, buildStandardProxies()),
    selector(BIZ.WORK, buildStandardProxies()),
    selector(BIZ.CNMEDIA, buildDirectFirstProxies()),
    selector(BIZ.NFLX, buildStandardProxies()),
    selector(BIZ.DSNP, buildStandardProxies()),
    selector(BIZ.HBO, buildStandardProxies()),
    selector(BIZ.HULU, buildStandardProxies()),
    selector(BIZ.PRIME, buildStandardProxies()),
    selector(BIZ.YT, buildStandardProxies()),
    selector(BIZ.MUSIC, buildStandardProxies()),
    selector(BIZ.STREAM_OTHER, buildStandardProxies()),
    selector(BIZ.STREAM_HK, buildRegionPreferredProxies('HK')),
    selector(BIZ.STREAM_TW, buildRegionPreferredProxies('TW')),
    selector(BIZ.STREAM_JP, buildRegionPreferredProxies('JPKR')),
    selector(BIZ.STREAM_EU, buildRegionPreferredProxies('EU')),
    selector(BIZ.GAME_CN, buildDirectFirstProxies()),
    selector(BIZ.GAME_INTL, buildStandardProxies()),
    selector(BIZ.TOOLS, buildStandardProxies()),
    selector(BIZ.MS, buildStandardProxies()),
    selector(BIZ.APPLE, buildDirectFirstProxies()),
    selector(BIZ.DOWNLOAD, buildStandardProxies()),
    selector(BIZ.TRACKER, buildTrackerProxies()),
    selector(BIZ.CN_SITE, buildDirectFirstProxies()),
    selector(BIZ.GFW, buildStandardProxies()),
    selector(BIZ.INTL_SITE, buildStandardProxies()),
    selector(BIZ.FINAL, buildStandardProxies()),
    selector(BIZ.AD, ['REJECT', 'DIRECT'])
  ];

  return [
    selector('🚀 节点选择', [SMART.GLOBAL, SMART.GLOBAL_HOME, 'DIRECT']),
    urltest(SMART.GLOBAL, [
      SMART.HK,
      SMART.TW,
      SMART.JPKR,
      SMART.APAC,
      SMART.US,
      SMART.EU,
      SMART.AMERICAS,
      SMART.AFRICA
    ]),
    urltest(SMART.GLOBAL_HOME, [
      SMART.HK_HOME,
      SMART.TW_HOME,
      SMART.JPKR_HOME,
      SMART.APAC_HOME,
      SMART.US_HOME,
      SMART.EU_HOME,
      SMART.AMERICAS_HOME,
      SMART.AFRICA_HOME
    ]),
    selector(SMART.HK, REGION_SELECTOR_MEMBERS.HK),
    selector(SMART.HK_HOME, REGION_SELECTOR_MEMBERS.HK_HOME),
    selector(SMART.TW, REGION_SELECTOR_MEMBERS.TW),
    selector(SMART.TW_HOME, REGION_SELECTOR_MEMBERS.TW_HOME),
    selector(SMART.JPKR, REGION_SELECTOR_MEMBERS.JPKR),
    selector(SMART.JPKR_HOME, REGION_SELECTOR_MEMBERS.JPKR_HOME),
    selector(SMART.APAC, REGION_SELECTOR_MEMBERS.APAC),
    selector(SMART.APAC_HOME, REGION_SELECTOR_MEMBERS.APAC_HOME),
    selector(SMART.US, REGION_SELECTOR_MEMBERS.US),
    selector(SMART.US_HOME, REGION_SELECTOR_MEMBERS.US_HOME),
    selector(SMART.EU, REGION_SELECTOR_MEMBERS.EU),
    selector(SMART.EU_HOME, REGION_SELECTOR_MEMBERS.EU_HOME),
    selector(SMART.AMERICAS, REGION_SELECTOR_MEMBERS.AMERICAS),
    selector(SMART.AMERICAS_HOME, REGION_SELECTOR_MEMBERS.AMERICAS_HOME),
    selector(SMART.AFRICA, REGION_SELECTOR_MEMBERS.AFRICA),
    selector(SMART.AFRICA_HOME, REGION_SELECTOR_MEMBERS.AFRICA_HOME),
    ...businessOutbounds,
    ...REGION_PLACEHOLDERS.map(([tag, server]) => trojanTemplate(tag, server)),
    { type: 'direct', tag: 'DIRECT' },
    { type: 'block', tag: 'REJECT' }
  ];
}

function isRejectTarget(target) {
  return target === 'REJECT' || target === ADS_OUTBOUND;
}

// szkane/ClashRuleSet BilibiliHMT.list 为 Clash 私有 .list 文本，
// MetaCubeX/meta-rules-dat 没有对应的 .srs，无法作为 sing-box remote rule_set 使用。
// 将 21 条原始条目内联到一条默认规则里；sing-box 对同一分类下的
// domain / domain_suffix / ip_cidr 默认按 OR 组合（见官方 route/rule 文档）。
const SZKANE_BILIHMT_RULE = {
  domain: [
    'p-bstarstatic.akamaized.net',
    'p.bstarstatic.com',
    'upos-bstar-mirrorakam.akamaized.net',
    'upos-bstar1-mirrorakam.akamaized.net',
    'upos-hz-mirrorakam.akamaized.net'
  ],
  domain_suffix: [
    'acgvideo.com',
    'bilibili.com',
    'bilibili.tv'
  ],
  ip_cidr: [
    '45.43.32.234/32',
    '103.151.150.0/23',
    '119.29.29.29/32',
    '128.1.62.200/32',
    '128.1.62.201/32',
    '150.116.92.250/32',
    '164.52.33.178/32',
    '164.52.33.182/32',
    '164.52.76.18/32',
    '203.107.1.33/32',
    '203.107.1.34/32',
    '203.107.1.65/32',
    '203.107.1.66/32'
  ]
};

function toSingRule(ruleText, availableRuleSets) {
  if (typeof ruleText !== 'string') return null;
  const parts = ruleText.split(',');
  const type = parts[0];

  if (type === 'RULE-SET') {
    if (parts[1] === 'szkane-bilihmt') {
      if (isRejectTarget(parts[2])) {
        return { ...SZKANE_BILIHMT_RULE, action: 'reject' };
      }
      return { ...SZKANE_BILIHMT_RULE, action: 'route', outbound: parts[2] };
    }
    if (!availableRuleSets.has(parts[1])) return null;
    if (isRejectTarget(parts[2])) return { rule_set: [parts[1]], action: 'reject' };
    return { rule_set: [parts[1]], action: 'route', outbound: parts[2] };
  }
  if (type === 'DOMAIN-SUFFIX') {
    if (isRejectTarget(parts[2])) return { domain_suffix: [parts[1]], action: 'reject' };
    return { domain_suffix: [parts[1]], action: 'route', outbound: parts[2] };
  }
  if (type === 'DOMAIN') {
    if (isRejectTarget(parts[2])) return { domain: [parts[1]], action: 'reject' };
    return { domain: [parts[1]], action: 'route', outbound: parts[2] };
  }
  if (type === 'DOMAIN-KEYWORD') {
    if (isRejectTarget(parts[2])) return { domain_keyword: [parts[1]], action: 'reject' };
    return { domain_keyword: [parts[1]], action: 'route', outbound: parts[2] };
  }
  if (type === 'IP-CIDR' || type === 'IP-CIDR6' || type === 'SRC-IP-CIDR') {
    if (isRejectTarget(parts[2])) return { ip_cidr: [parts[1]], action: 'reject' };
    return { ip_cidr: [parts[1]], action: 'route', outbound: parts[2] };
  }
  if (type === 'GEOIP') {
    if (parts[1] === 'private') {
      if (isRejectTarget(parts[2])) return { ip_is_private: true, action: 'reject' };
      return { ip_is_private: true, action: 'route', outbound: parts[2] };
    }
    if (isRejectTarget(parts[2])) return { geoip: [parts[1]], action: 'reject' };
    return { geoip: [parts[1]], action: 'route', outbound: parts[2] };
  }
  if (type === 'PROCESS-NAME') {
    if (isRejectTarget(parts[2])) return { process_name: [parts[1]], action: 'reject' };
    return { process_name: [parts[1]], action: 'route', outbound: parts[2] };
  }
  if (type === 'DST-PORT') {
    const port = Number(parts[1]);
    if (isRejectTarget(parts[2])) return { port: Number.isFinite(port) ? [port] : [parts[1]], action: 'reject' };
    return { port: Number.isFinite(port) ? [port] : [parts[1]], action: 'route', outbound: parts[2] };
  }
  if (type === 'GEOSITE') {
    const tag = `geosite-${parts[1]}`;
    if (!availableRuleSets.has(tag)) return null;
    if (isRejectTarget(parts[2])) return { rule_set: [tag], action: 'reject' };
    return { rule_set: [tag], action: 'route', outbound: parts[2] };
  }
  if (type === 'NETWORK') {
    if (isRejectTarget(parts[2])) return { network: parts[1], action: 'reject' };
    return { network: parts[1], action: 'route', outbound: parts[2] };
  }
  if (type === 'MATCH') {
    return { action: 'route', outbound: parts[1] };
  }
  return null;
}

function toSrsUrl(url, tag) {
  if (!url) return null;
  if (/\.srs$/i.test(url)) return url;

  const metaRulesDat = url.match(/^(https:\/\/(?:fastly\.|cdn\.)?jsdelivr\.net\/gh\/MetaCubeX\/meta-rules-dat)@meta\/geo\/(geosite|geoip)\/(.+)\.mrs$/i);
  if (metaRulesDat) {
    return `${metaRulesDat[1]}@sing/geo/${metaRulesDat[2]}/${metaRulesDat[3]}.srs`;
  }

  if (tag === 'anti-ad' && /DustinWin\/ruleset_geodata@mihomo-ruleset\/ads\.mrs$/i.test(url)) {
    return 'https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@sing-box-ruleset/ads.srs';
  }

  return null;
}

const extraGeoSiteTags = Array.from(new Set(
  rules
    .map((r) => String(r).split(','))
    .filter((p) => p[0] === 'GEOSITE' && p[1])
    .map((p) => `geosite-${p[1]}`)
)).map((tag) => ({
  type: 'remote',
  tag,
  format: 'binary',
  url: `https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/${tag.replace('geosite-', '')}.srs`,
  http_client: { detour: SMART.GLOBAL },
  update_interval: '1d'
}));

const ruleSet = Object.entries(providers).map(([tag, info]) => {
  const url = toSrsUrl(info.url, tag);
  if (!url) return null;
  return {
    type: 'remote',
    tag,
    format: 'binary',
    url,
    http_client: { detour: SMART.GLOBAL },
    update_interval: '1d'
  };
}).filter(Boolean);

const availableRuleSets = new Set([...ruleSet, ...extraGeoSiteTags].map((item) => item.tag));
const convertedRules = rules.map((rule) => toSingRule(rule, availableRuleSets)).filter(Boolean);
const skippedProviders = Object.keys(providers).length - ruleSet.length;
const skippedRules = rules.length - convertedRules.length;

baseConfig._meta = {
  name: 'SingBox Smart Full',
  version: VERSION,
  build: BUILD,
  baseline: BASELINE,
  changelog: '见 SingBox/CHANGELOG.md'
};

if (baseConfig.dns && Array.isArray(baseConfig.dns.servers)) {
  // 添加 bootstrap DNS（用 IP 直连，避免域名解析循环依赖）
  const hasBootstrap = baseConfig.dns.servers.some(function(s) { return s.tag === 'dns_bootstrap'; });
  if (!hasBootstrap) {
    baseConfig.dns.servers.unshift({
      tag: 'dns_bootstrap',
      address: 'udp://223.5.5.5:53'
    });
  }
  baseConfig.dns.servers = baseConfig.dns.servers.map(function(server) {
    if (server && server.tag === 'dns_proxy') {
      return { ...server, detour: '🚀 节点选择', address_resolver: 'dns_bootstrap' };
    }
    if (server && server.tag === 'dns_direct') {
      return { ...server, address_resolver: 'dns_bootstrap' };
    }
    return server;
  });
}

baseConfig.outbounds = buildOutbounds();
baseConfig.route.rule_set = [...ruleSet, ...extraGeoSiteTags];
baseConfig.route.rules = convertedRules;
baseConfig.route.final = BIZ.FINAL;

fs.writeFileSync('SingBox/SingBox(sing-box)-full.json', JSON.stringify(baseConfig, null, 2) + '\n');

console.log(`providers=${ruleSet.length} extra_geosite=${extraGeoSiteTags.length} skipped_providers=${skippedProviders} rules=${convertedRules.length} skipped_rules=${skippedRules}`);
