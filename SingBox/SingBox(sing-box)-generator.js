const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { repositoryAssetUrl } = require('../tools/lib/generated-asset-url');

const VERSION = 'v6.0.14-sing.5';
const BUILD = '2026-09-29';
const BASELINE = 'Clash Party v6.0.14';

const SMART = {
  GLOBAL: '🌍 全球节点',
  GLOBAL_HOME: '🏡 全球家宽',
  HK: '🇭🇰 香港节点',
  HK_HOME: '🏡 香港家宽',
  TW: '🇹🇼 台湾节点',
  TW_HOME: '🏡 台湾家宽',
  JPKR: '🇯🇵 日韩节点',
  JPKR_HOME: '🏡 日韩家宽',
  SG: '🇸🇬 狮城节点',
  SG_HOME: '🏡 狮城家宽',
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
  TOK: '🎵 TikTok',
  NFLX: '🎥 Netflix',
  DSNP: '🎬 Disney+',
  HBO: '📡 HBO/Max',
  HULU: '📺 Hulu',
  PRIME: '🎬 Prime Video',
  YT: '📹 YouTube',
  MUSIC: '🎵 音乐流媒体',
  STREAM_HK: '🇭🇰 香港流媒体',
  STREAM_TW: '🇹🇼 台湾流媒体',
  STREAM_JP: '🇯🇵 日韩流媒体',
  STREAM_EU: '🇪🇺 欧洲流媒体',
  STREAM_OTHER: '🌐 其他国外流媒体',
  GAME_CN: '🕹️ 国内游戏',
  GAME_INTL: '🎮 国外游戏',
  GOOGLE: '🔍 Google 服务',
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

const REGION_ORDER = ['GLOBAL', 'HK', 'TW', 'JPKR', 'SG', 'APAC', 'US', 'EU', 'AMERICAS', 'AFRICA'];
const REGION_HOME_MAP = {
  GLOBAL: 'GLOBAL_HOME',
  HK: 'HK_HOME',
  TW: 'TW_HOME',
  JPKR: 'JPKR_HOME',
  SG: 'SG_HOME',
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
  SG: ['proxy-sg-1', 'DIRECT'],
  SG_HOME: ['proxy-sg-home-1', 'DIRECT'],
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
const baseConfig = {
  log: {
    level: 'info',
    timestamp: true
  },
  _meta: {
    name: 'SingBox Smart Full',
    version: VERSION,
    build: BUILD,
    baseline: BASELINE,
    changelog: '见 SingBox/CHANGELOG.md'
  },
  experimental: {
    cache_file: {
      enabled: true,
      path: 'cache.db',
      store_fakeip: true
    }
  }
};

const sandbox = { console: { log: function(){}, error: function(){}, warn: function(){} } };
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
const FUSED_MANIFEST_FILE = path.join(__dirname, '..', 'rulesets', 'generated', 'fused', 'manifest.json');

function loadFusedManifest() {
  if (!fs.existsSync(FUSED_MANIFEST_FILE)) throw new Error(`missing fused manifest: ${FUSED_MANIFEST_FILE}`);
  const manifest = JSON.parse(fs.readFileSync(FUSED_MANIFEST_FILE, 'utf8'));
  if (!Array.isArray(manifest.segments) || manifest.segments.length === 0) throw new Error('fused manifest has no segments');
  return manifest;
}

const fusedManifest = loadFusedManifest();
const fusedAssetRevision = fusedManifest.asset_revision;
const fusedProviderToSegment = new Map();
for (const segment of fusedManifest.segments) {
  const targetTag = segment.files && segment.files.sing_box ? segment.id : null;
  for (const [fileKey, suffix] of [
    ['domain', 'domain'],
    ['ipcidr', 'ipcidr'],
    ['ipcidr_no_resolve', 'ipcidr-no-resolve'],
    ['residual', 'residual'],
  ]) {
    if (segment.files && segment.files[fileKey]) fusedProviderToSegment.set(`${segment.id}-${suffix}`, targetTag);
  }
}
const unmappedFusedProviders = Object.keys(providers).filter((tag) => !fusedProviderToSegment.has(tag));
if (unmappedFusedProviders.length > 0) {
  throw new Error(`Mihomo fused providers absent from fused manifest: ${unmappedFusedProviders.join(',')}`);
}

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
  return ['REJECT', 'DIRECT'].concat(withResidential(['GLOBAL', 'HK', 'SG', 'APAC']));
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
    interval: '5m',
    tolerance: 10
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
    selector(BIZ.TOK, buildStandardProxies()),
    selector(BIZ.NFLX, buildStandardProxies()),
    selector(BIZ.DSNP, buildStandardProxies()),
    selector(BIZ.HBO, buildStandardProxies()),
    selector(BIZ.HULU, buildStandardProxies()),
    selector(BIZ.PRIME, buildStandardProxies()),
    selector(BIZ.YT, buildStandardProxies()),
    selector(BIZ.MUSIC, buildStandardProxies()),
    selector(BIZ.STREAM_HK, buildRegionPreferredProxies('HK')),
    selector(BIZ.STREAM_TW, buildRegionPreferredProxies('TW')),
    selector(BIZ.STREAM_JP, buildRegionPreferredProxies('JPKR')),
    selector(BIZ.STREAM_EU, buildRegionPreferredProxies('EU')),
    selector(BIZ.STREAM_OTHER, buildStandardProxies()),
    selector(BIZ.GAME_CN, buildDirectFirstProxies()),
    selector(BIZ.GAME_INTL, buildStandardProxies()),
    selector(BIZ.GOOGLE, buildStandardProxies()),
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
      SMART.SG,
      SMART.APAC,
      SMART.US,
      SMART.EU,
      SMART.AMERICAS,
      SMART.AFRICA
    ]),
    ...businessOutbounds,
    urltest(SMART.GLOBAL_HOME, [
      SMART.HK_HOME,
      SMART.TW_HOME,
      SMART.JPKR_HOME,
      SMART.SG_HOME,
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
    selector(SMART.SG, REGION_SELECTOR_MEMBERS.SG),
    selector(SMART.SG_HOME, REGION_SELECTOR_MEMBERS.SG_HOME),
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
    ...REGION_PLACEHOLDERS.map(([tag, server]) => trojanTemplate(tag, server)),
    { type: 'direct', tag: 'DIRECT' },
    { type: 'block', tag: 'REJECT' }
  ];
}

function isRejectTarget(target) {
  return target === 'REJECT' || target === ADS_OUTBOUND;
}

function splitTopLevel(rule) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of String(rule)) {
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim());
}

function splitTupleList(value) {
  const inner = String(value || '').trim().replace(/^\(/, '').replace(/\)$/, '');
  return splitTopLevel(inner)
    .map((item) => item.trim().replace(/^\(/, '').replace(/\)$/, ''))
    .filter(Boolean);
}

function toSingAndRule(ruleText) {
  const [type, value, policy] = splitTopLevel(ruleText);
  if (type !== 'AND' || !policy) return null;

  const conditions = splitTupleList(value).map(splitTopLevel);
  const process = conditions.find((condition) => condition[0] === 'PROCESS-NAME');
  const domain = conditions.find((condition) => ['DOMAIN', 'DOMAIN-SUFFIX', 'DOMAIN-KEYWORD', 'DOMAIN-REGEX'].includes(condition[0]));
  if (!process || !domain || conditions.length !== 2) return null;

  const result = isRejectTarget(policy)
    ? { process_name: [process[1]], action: 'reject' }
    : { process_name: [process[1]], action: 'route', outbound: policy };
  if (domain[0] === 'DOMAIN') result.domain = [domain[1]];
  else if (domain[0] === 'DOMAIN-SUFFIX') result.domain_suffix = [domain[1]];
  else if (domain[0] === 'DOMAIN-KEYWORD') result.domain_keyword = [domain[1]];
  else result.domain_regex = [domain[1]];
  return result;
}

function toSingRule(ruleText, availableRuleSets) {
  if (typeof ruleText !== 'string') return null;
  const parts = ruleText.split(',');
  const type = parts[0];

  if (type === 'RULE-SET') {
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
    return null;
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

const ruleSet = fusedManifest.segments.filter((segment) => (
  segment.files && segment.files.sing_box
)).map((segment) => {
  return {
    type: 'remote',
    tag: segment.id,
    format: 'binary',
    url: repositoryAssetUrl(`rulesets/generated/fused/sing-box/${segment.files.sing_box.file}`, fusedAssetRevision),
    http_client: { detour: SMART.GLOBAL },
    update_interval: '1d'
  };
});

function metaGeositeRuleSet(tag, name) {
  return {
    type: 'remote',
    tag,
    format: 'binary',
    url: `https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/${name}.srs`,
    http_client: { detour: SMART.GLOBAL },
    update_interval: '1d'
  };
}

function metaGeoipRuleSet(tag, name) {
  return {
    type: 'remote',
    tag,
    format: 'binary',
    url: `https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/${name}.srs`,
    http_client: { detour: SMART.GLOBAL },
    update_interval: '1d'
  };
}

// Runtime GEO helpers remain explicit sing-box rule_sets. They are not upstream
// business providers and are only used for DNS/private/CN/QUIC guard logic.
const requiredGeoRuleSets = [
  metaGeositeRuleSet('geosite-private', 'private'),
  metaGeositeRuleSet('geosite-youtube', 'youtube'),
  metaGeositeRuleSet('geosite-google', 'google'),
  metaGeositeRuleSet('geosite-microsoft', 'microsoft'),
  metaGeositeRuleSet('geosite-apple', 'apple'),
  metaGeositeRuleSet('geosite-cn', 'cn'),
  metaGeoipRuleSet('geoip-cn', 'cn')
];

function uniqueRuleSets(items) {
  const seen = new Set();
  return items.filter(function(item) {
    if (!item || seen.has(item.tag)) return false;
    seen.add(item.tag);
    return true;
  });
}

const allRouteRuleSets = uniqueRuleSets([...ruleSet, ...requiredGeoRuleSets, ...extraGeoSiteTags]);
const availableRuleSets = new Set(allRouteRuleSets.map((item) => item.tag));
const adFusedRuleSet = fusedManifest.segments.find((segment) => segment.policy === BIZ.AD && segment.files && segment.files.sing_box);
if (!adFusedRuleSet) throw new Error('missing fused ad rule set for Sing-box DNS rejection');
// v5.4.22 #1 借鉴 Proxy-override：QUIC 精细化——sing-box 首命中模型逐条匹配。
// 插入到 Clash 主线 5 条 AND/QUIC 规则所在位置，避免被后续普通规则或 route.final 改变语义。
// YouTube/Google/MS/Apple QUIC → 走对应业务组；CN QUIC → DIRECT 放行；其余海外 QUIC → REJECT。
const quicRules = [
  { rule_set: ['geosite-youtube'], port: [443], network: 'udp', action: 'route', outbound: '📹 YouTube' },
  { rule_set: ['geosite-google'], port: [443], network: 'udp', action: 'route', outbound: '🔍 Google 服务' },
  { rule_set: ['geosite-microsoft'], port: [443], network: 'udp', action: 'route', outbound: 'Ⓜ️ 微软服务' },
  { rule_set: ['geosite-apple'], port: [443], network: 'udp', action: 'route', outbound: '🍎 苹果服务' },
  { rule_set: ['geosite-cn'], port: [443], network: 'udp', action: 'route', outbound: 'DIRECT' },
  { port: [443], network: 'udp', action: 'reject' },
];
let convertedRules = [];
let insertedQuicRules = false;
let convertedSourceRules = 0;
const emittedFusedSegments = new Set();
for (const rule of rules) {
  if (String(rule).startsWith('AND,((DST-PORT,443),(NETWORK,UDP),')) {
    if (!insertedQuicRules) {
      convertedRules.push(...quicRules);
      insertedQuicRules = true;
    }
    continue;
  }
  const logical = toSingAndRule(rule);
  if (logical) {
    convertedRules.push(logical);
    convertedSourceRules++;
    continue;
  }
  const parts = String(rule).split(',');
  if (parts[0] === 'RULE-SET' && fusedProviderToSegment.has(parts[1])) {
    convertedSourceRules++;
    const segmentTag = fusedProviderToSegment.get(parts[1]);
    if (!segmentTag || emittedFusedSegments.has(segmentTag)) continue;
    emittedFusedSegments.add(segmentTag);
    const converted = toSingRule(`RULE-SET,${segmentTag},${parts[2]}`, availableRuleSets);
    if (!converted) throw new Error(`cannot map fused segment to sing-box route rule: ${segmentTag}`);
    convertedRules.push(converted);
    continue;
  }
  const converted = toSingRule(rule, availableRuleSets);
  if (converted) {
    convertedRules.push(converted);
    convertedSourceRules++;
  }
}
if (!insertedQuicRules) convertedRules.unshift(...quicRules);
const skippedProviders = unmappedFusedProviders.length;
const coalescedProviders = Object.keys(providers).length - ruleSet.length;
// v5.4.22: AND/QUIC rules handled out-of-band；MATCH fallback is represented by route.final.
const QUIC_AND_RULES = 5;
const MATCH_FALLBACK_RULES = 1;
const skippedRules = rules.length - convertedSourceRules - QUIC_AND_RULES - MATCH_FALLBACK_RULES;

// v5.4.23-sing.2: Remove redundant domain_suffix rules that are fully covered by
// a corresponding rule_set pointing to the same outbound.  The "root" domain suffix
// (e.g. binance.com) is already included inside the rule_set list (e.g. RULE-SET,binance),
// so a standalone DOMAIN-SUFFIX entry for the same domain is a no-op duplicate.
// Defence-in-depth: even though the generator replaces rules entirely from Clash output
// (which never emits these duplicates), this filter protects against manual JSON edits.
const DOMAIN_SUFFIX_RULE_SET_PAIRS = [
  { domain: 'binance.com',       ruleSetTag: 'binance' },
  { domain: 'protonmail.com',    ruleSetTag: 'protonmail' },
  { domain: 'tumblr.com',        ruleSetTag: 'tumblr' },
  { domain: 'clubhouse.com',     ruleSetTag: 'clubhouse' },
  { domain: 'soundcloud.com',    ruleSetTag: 'soundcloud' },
  { domain: 'sndcdn.com',        ruleSetTag: 'soundcloud' },
  { domain: 'pandora.com',       ruleSetTag: 'pandora' },
  { domain: 'deezer.com',        ruleSetTag: 'deezer' },
  { domain: 'tidal.com',         ruleSetTag: 'tidal' },
  { domain: 'vimeo.com',         ruleSetTag: 'vimeo' },
  { domain: 'dailymotion.com',   ruleSetTag: 'dailymotion' },
];
const redundantDomainSet = new Set(
  DOMAIN_SUFFIX_RULE_SET_PAIRS
    .filter((pair) => availableRuleSets.has(pair.ruleSetTag))
    .map((pair) => pair.domain)
);
if (redundantDomainSet.size > 0) {
  const before = convertedRules.length;
  convertedRules = convertedRules.filter((rule) => {
    if (!rule.domain_suffix || rule.rule_set) return true;
    // Keep if none of the domain_suffix entries are in the redundant set
    return !rule.domain_suffix.some((d) => redundantDomainSet.has(d));
  });
  if (before !== convertedRules.length) {
    console.log(`removed ${before - convertedRules.length} redundant domain_suffix rules`);
  }
}

baseConfig.dns = {
  servers: [
    // v5.4.21 #4 借鉴 Proxy-override：bootstrap 从 udp://IP:53 升级为 DoH-over-IP（https://IP/dns-query）。
    // IP host 无需 address_resolver（免 bootstrap 循环）；TLS server_name 覆盖 SNI 以通过证书验证。
    {
      tag: 'dns_bootstrap',
      address: 'https://223.5.5.5/dns-query',
      strategy: 'prefer_ipv4',
      tls: { server_name: 'dns.alidns.com' }
    },
    {
      tag: 'dns_bootstrap2',
      address: 'https://223.6.6.6/dns-query',
      strategy: 'prefer_ipv4',
      tls: { server_name: 'dns.alidns.com' }
    },
    {
      tag: 'dns_bootstrap3',
      address: 'https://1.1.1.1/dns-query',
      strategy: 'prefer_ipv4',
      tls: { server_name: 'cloudflare-dns.com' }
    },
    {
      tag: 'dns_bootstrap4',
      address: 'https://8.8.8.8/dns-query',
      strategy: 'prefer_ipv4',
      tls: { server_name: 'dns.google' }
    },
    {
      tag: 'dns_direct',
      address: 'https://dns.alidns.com/dns-query',
      address_resolver: 'dns_bootstrap',
      detour: 'DIRECT',
      strategy: 'prefer_ipv4'
    },
    {
      tag: 'dns_direct2',
      address: 'https://doh.pub/dns-query',
      address_resolver: 'dns_bootstrap',
      detour: 'DIRECT',
      strategy: 'prefer_ipv4'
    },
    {
      tag: 'dns_proxy',
      address: 'https://cloudflare-dns.com/dns-query',
      address_resolver: 'dns_bootstrap',
      detour: '🚀 节点选择',
      strategy: 'prefer_ipv4'
    },
    {
      tag: 'dns_proxy2',
      address: 'https://dns.google/dns-query',
      address_resolver: 'dns_bootstrap',
      detour: '🚀 节点选择',
      strategy: 'prefer_ipv4'
    }
  ],
  rules: [
    {
      rule_set: ['geosite-private', 'geosite-cn', 'geoip-cn'],
      action: 'route',
      server: 'dns_direct'
    },
    {
      rule_set: [adFusedRuleSet.id],
      action: 'reject'
    }
  ],
  final: 'dns_proxy',
  strategy: 'prefer_ipv4'
};

baseConfig.inbounds = [
  {
    type: 'tun',
    tag: 'tun-in',
    address: ['172.19.0.1/30'],
    mtu: 9000,
    auto_route: true,
    strict_route: true,
    sniff: true,
    sniff_override_destination: true,
    stack: 'mixed'
  }
];

baseConfig.outbounds = buildOutbounds();
baseConfig.route = {
  auto_detect_interface: true,
  final: BIZ.FINAL
};

// v5.4.23-sing.2: Remove redundant Google sub-service rule_sets (googlesearch, googledrive,
// googleearth) — these are fully covered by the unified 'google' rule_set.
const REDUNDANT_GOOGLE_TAGS = new Set(['googlesearch', 'googledrive', 'googleearth']);
const filteredRuleSets = allRouteRuleSets.filter((rs) => !REDUNDANT_GOOGLE_TAGS.has(rs.tag));
if (filteredRuleSets.length < allRouteRuleSets.length) {
  console.log(`removed ${allRouteRuleSets.length - filteredRuleSets.length} redundant google sub-service rule_sets`);
}
baseConfig.route.rule_set = filteredRuleSets;

// v5.4.23-sing.2: Remove duplicate GEOIP,ID route rule if present (defence-in-depth).
let seenGeoipId = false;
convertedRules = convertedRules.filter((rule) => {
  // Drop route rules referencing removed google sub-service rule_sets
  if (rule.rule_set && rule.rule_set.some((t) => REDUNDANT_GOOGLE_TAGS.has(t))) return false;
  // Drop duplicate GEOIP,ID
  if (rule.geoip && rule.geoip.includes('id')) {
    if (seenGeoipId) return false; // drop duplicate
    seenGeoipId = true;
  }
  return true;
});

baseConfig.route.rules = convertedRules;

fs.writeFileSync('SingBox/SingBox(sing-box)-full.json', JSON.stringify(baseConfig, null, 2) + '\n');

console.log(`providers=${ruleSet.length} coalesced_providers=${coalescedProviders} extra_geosite=${extraGeoSiteTags.length} skipped_providers=${skippedProviders} rules=${convertedRules.length} skipped_rules=${skippedRules}`);
