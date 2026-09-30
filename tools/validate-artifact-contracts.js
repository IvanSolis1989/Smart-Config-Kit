#!/usr/bin/env node
'use strict';

const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {
  MAX_JSDELIVR_ASSET_BYTES,
  validateGeneratedRemoteAssetSizes,
} = require('./validate-generated-remote-asset-size');
const { validateEgernGenerationManifest } = require('./lib/egern-generation-manifest');
const {
  getAssetRevisionFromUrl,
  repositoryAssetUrl,
} = require('./lib/generated-asset-url');
const {
  formatIssues: formatCapabilityMatrixIssues,
  readClientCapabilityMatrix,
  renderClientCapabilityMatrix,
  validateClientCapabilityMatrix,
} = require('./lib/client-capability-matrix');
const {
  readProfileContract,
  validateProfileContract,
} = require('./lib/subscription-adapter-profiles');
const {
  SOURCE_GRAPH_ID,
  DOMESTIC_AUTHORITY_ANCHOR_RULE,
  GENERIC_INTL_FALLBACK_RULES,
  getRawRoutingGraph,
  getMihomoNormalizedRoutingGraph,
} = require('../rulesets/source/routing-graph');

const REPO_ROOT = path.resolve(__dirname, '..');
const EXPECTED_GROUPS = 55;
const EXPECTED_BUSINESS_GROUPS = 33;
const EXPECTED_REGION_GROUPS = EXPECTED_GROUPS - EXPECTED_BUSINESS_GROUPS;
const EXPECTED_SINGBOX_GROUPS = 54;
const EXPECTED_SINGBOX_URLTEST_GROUPS = 2;
const EXPECTED_PASSWALL_RULES = 69;
const EXPECTED_REGION_TEST_INTERVAL_SECONDS = 300;
const EXPECTED_SINGBOX_URLTEST_INTERVAL = '5m';
const SOURCE_FULL_PROVIDERS = 514;
const SOURCE_FULL_RULES = 973;
const MIN_FULL_PROVIDERS = 132;
const EXPECTED_SINGBOX_RUNTIME_GEO_RULE_SETS = 7;
const MIN_FULL_RULES = 151;
const EXPECTED_FUSED_SEGMENTS = 72;
const EXPECTED_FUSED_MOBILE_SEGMENTS = 69;
const EXPECTED_FUSED_INLINE_RULES = 19;
const EXPECTED_FUSED_MRS_FILES = 96;
const EXPECTED_FUSED_SRS_FILES = 69;
const EXPECTED_FUSED_PASSWALL_FILES = 69;
const EXPECTED_FUSED_XRAY_SEGMENTS = 69;
const EXPECTED_XRAY_RULES = 89;
const EXPECTED_MIHOMO_MRS_CONVERTED = 237;
const EXPECTED_MIHOMO_MRS_SPLIT = 28;
const EXPECTED_MIHOMO_MRS_PARTIAL = 70;
const EXPECTED_MIHOMO_MRS_EXISTING = 35;
const EXPECTED_MIHOMO_MRS_RETAINED = 23;
const EXPECTED_MIHOMO_MRS_FILES = 386;
const EXPECTED_MIHOMO_MRS_RESIDUAL_FILES = 70;
const EXPECTED_MIHOMO_MRS_PROVIDER_REFS = EXPECTED_MIHOMO_MRS_FILES + EXPECTED_MIHOMO_MRS_EXISTING;
const EXPECTED_SINGBOX_ROUTE_RULES = 88;
const RESTRICTED_SITE = '\u{1F6AB} \u53D7\u9650\u7F51\u7AD9';
const RESTRICTED_SITE_RUBY = '\\U0001F6AB \u53D7\u9650\u7F51\u7AD9';
const CLOUD_CDN = '\u2601\uFE0F \u4E91\u4E0ECDN';
const SUPPLEMENTAL_RULESET_BASE = 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/supplemental';
const SOURCE_GRAPH_FILE = 'rulesets/source/routing-graph.js';
const SUPPLEMENTAL_CLASH_RULESETS = [
  { id: 'scki-adfp-direct', file: 'adfp-direct', policy: 'DIRECT' },
  { id: 'scki-adfp-intl-site', file: 'adfp-intl-site', policy: '🌐 国外网站' },
  { id: 'scki-adfp-payments', file: 'adfp-payments', policy: '🏦 金融支付' },
  { id: 'scki-adfp-ai', file: 'adfp-ai', policy: '🤖 AI 服务' },
  { id: 'scki-cnmedia-guard', file: 'cnmedia-guard', policy: '📺 国内流媒体' },
  { id: 'scki-local-direct', file: 'local-direct', policy: 'DIRECT' },
  { id: 'scki-local-process-direct', file: 'local-process-direct', policy: 'DIRECT', process: true },
  { id: 'scki-work-process', file: 'work-process', policy: '🧑‍💼 会议协作', process: true },
  { id: 'scki-gfw-guard', file: 'gfw-guard', policy: '🚫 受限网站' },
  { id: 'scki-youtube-guard', file: 'youtube-guard', policy: '📹 YouTube' },
  { id: 'scki-google-mail-intl', file: 'google-mail-intl', policy: '🌐 国外网站' },
  { id: 'scki-google-work', file: 'google-work', policy: '🧑‍💼 会议协作' },
  { id: 'scki-download-guard', file: 'download-guard', policy: '📥 下载更新' },
  { id: 'scki-cnsite-guard', file: 'cnsite-guard', policy: '🏠 国内网站' },
  { id: 'scki-work-guard', file: 'work-guard', policy: '🧑‍💼 会议协作' },
  { id: 'scki-ai-supplement', file: 'ai-supplement', policy: '🤖 AI 服务' },
];
const SUPPLEMENTAL_MOBILE_CLASH_RULESETS = SUPPLEMENTAL_CLASH_RULESETS.filter((spec) => !spec.process);
const SUPPLEMENTAL_SURGE_PROCESS_RULESETS = [
  { id: 'scki-local-process-direct', file: 'local-process-direct', policy: 'DIRECT' },
  { id: 'scki-work-process', file: 'work-process', policy: '🧑‍💼 会议协作' },
];
// v5.4.21 #4: DoH-over-IP bootstrap + 1 plaintext fallback
const DNS_BOOTSTRAP_DOH_OVER_IP = ['https://223.5.5.5/dns-query', 'https://223.6.6.6/dns-query', 'https://8.8.8.8/dns-query', 'https://1.1.1.1/dns-query'];
const DNS_BOOTSTRAP_IPS = [...DNS_BOOTSTRAP_DOH_OVER_IP, '223.5.5.5'];
const DNS_BOOTSTRAP_PLAINTEXT = ['223.5.5.5', '119.29.29.29', '1.1.1.1', '8.8.8.8'];
const DNS_DOMESTIC_DOH = ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'];
const DNS_FOREIGN_DOH = ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'];
const DNS_PROXY_DOH = [...DNS_FOREIGN_DOH, ...DNS_DOMESTIC_DOH];
const STUN_DIRECT_PORTS = [3478, 3479, 5349, 19302, 19305, 19307];
const STUN_FAKE_IP_FILTER_ENTRIES = [
  '+.stun.*.*',
  '+.stun.*.*.*',
  '+.turn.*.*',
  '+.turn.*.*.*',
  'stun.l.google.com',
  'stun1.l.google.com',
  'stun2.l.google.com',
  'stun3.l.google.com',
  'stun4.l.google.com',
  'global.turn.twilio.com',
];
const REQUIRED_FAKE_IP_FILTER_ENTRIES = [
  '+.pub.3gppnetwork.org',
  '+.bing.com',
  '+.miwifi.com',
  '+.courier.push.apple.com',
  '+.miui.com',
  '+.xiaomi.com',
  '+.xiaomi.net',
  '+.mijia.tech',
  '+.gotui.com',
];
const DOUYIN_CNMEDIA_DOMAINS = [
  'douyin.com',
  'douyincdn.com',
  'douyinpic.com',
  'douyinstatic.com',
  'douyinvod.com',
  'idouyinvod.com',
  'iesdouyin.com',
  'iesdouyin.net',
  'amemv.com',
  'zjcdn.com',
];
const AMAP_DOMAINS = [
  'a-map.cn',
  'a-map.co',
  'a-map.link',
  'a-map.vip',
  'acloudrender.com',
  'amap.com',
  'amapauto.com',
  'anav.com',
  'autonavi.com',
  'gaode.com',
];
const PASSWALL_AMAP_REQUIRED = AMAP_DOMAINS.map((domain) => `domain:${domain}`);
const CN_GAME_PRIORITY_DOMAINS = ['mihoyo.com', 'yuanshen.com'];
const PASSWALL_CN_GAME_REQUIRED = [
  'domain:mihoyo.com',
  'domain:miyoushe.com',
  'domain:yuanshen.com',
  'domain:game.163.com',
  'domain:netease.com',
  'domain:wegame.com',
  'domain:wanmei.com',
  'domain:battlenet.com.cn',
];
const SINGBOX_BUSINESS_ORDER = [
  '🤖 AI 服务',
  '💰 加密货币',
  '🏦 金融支付',
  '💬 即时通讯',
  '📱 社交媒体',
  '🧑‍💼 会议协作',
  '📺 国内流媒体',
  '🎵 TikTok',
  '🎥 Netflix',
  '🎬 Disney+',
  '📡 HBO/Max',
  '📺 Hulu',
  '🎬 Prime Video',
  '📹 YouTube',
  '🎵 音乐流媒体',
  '🇭🇰 香港流媒体',
  '🇹🇼 台湾流媒体',
  '🇯🇵 日韩流媒体',
  '🇪🇺 欧洲流媒体',
  '🌐 其他国外流媒体',
  '🕹️ 国内游戏',
  '🎮 国外游戏',
  '🔍 Google 服务',
  '🔧 工具与服务',
  'Ⓜ️ 微软服务',
  '🍎 苹果服务',
  '📥 下载更新',
  '🛰️ BT/PT Tracker',
  '🏠 国内网站',
  '🚫 受限网站',
  '🌐 国外网站',
  '🐟 漏网之鱼',
  '🛑 广告拦截',
];

// 用户报告的真实节点名：小写 ISO alpha-2 紧接数字编号必须进入主区域及其大区。
// 这组用例同时约束 JS、Mihomo YAML、OpenClash Ruby 和 Apple 文本产物。
const LOWERCASE_NUMBERED_REGION_CASES = [
  { name: 'yun hk01', region: 'HK', primary: '🇭🇰 香港节点', aggregate: '🌏 亚太节点', home: '🏡 香港家宽', aggregateHome: '🏡 亚太家宽', loonFilter: 'HK_Filter' },
  { name: 'yun hk02', region: 'HK', primary: '🇭🇰 香港节点', aggregate: '🌏 亚太节点', home: '🏡 香港家宽', aggregateHome: '🏡 亚太家宽', loonFilter: 'HK_Filter' },
  { name: 'yun hk03', region: 'HK', primary: '🇭🇰 香港节点', aggregate: '🌏 亚太节点', home: '🏡 香港家宽', aggregateHome: '🏡 亚太家宽', loonFilter: 'HK_Filter' },
  { name: 'yun hk04', region: 'HK', primary: '🇭🇰 香港节点', aggregate: '🌏 亚太节点', home: '🏡 香港家宽', aggregateHome: '🏡 亚太家宽', loonFilter: 'HK_Filter' },
  { name: 'yun us01', region: 'US', primary: '🇺🇸 美国节点', aggregate: '🌎 美洲节点', home: '🏡 美国家宽', aggregateHome: '🏡 美洲家宽', loonFilter: 'US_Filter' },
  { name: 'yun us02', region: 'US', primary: '🇺🇸 美国节点', aggregate: '🌎 美洲节点', home: '🏡 美国家宽', aggregateHome: '🏡 美洲家宽', loonFilter: 'US_Filter' },
  { name: 'yun us03', region: 'US', primary: '🇺🇸 美国节点', aggregate: '🌎 美洲节点', home: '🏡 美国家宽', aggregateHome: '🏡 美洲家宽', loonFilter: 'US_Filter' },
  { name: 'yun us04', region: 'US', primary: '🇺🇸 美国节点', aggregate: '🌎 美洲节点', home: '🏡 美国家宽', aggregateHome: '🏡 美洲家宽', loonFilter: 'US_Filter' },
  { name: 'yun jp01', region: 'JP', primary: '🇯🇵 日韩节点', aggregate: '🌏 亚太节点', home: '🏡 日韩家宽', aggregateHome: '🏡 亚太家宽', loonFilter: 'JPKR_Filter' },
  { name: 'yun sg01', region: 'SG', primary: '🇸🇬 狮城节点', aggregate: '🌏 亚太节点', home: '🏡 狮城家宽', aggregateHome: '🏡 亚太家宽', loonFilter: 'SG_Filter' },
  { name: 'yun us05', region: 'US', primary: '🇺🇸 美国节点', aggregate: '🌎 美洲节点', home: '🏡 美国家宽', aggregateHome: '🏡 美洲家宽', loonFilter: 'US_Filter' },
  { name: 'yun tw01', region: 'TW', primary: '🇹🇼 台湾节点', aggregate: '🌏 亚太节点', home: '🏡 台湾家宽', aggregateHome: '🏡 亚太家宽', loonFilter: 'TW_Filter' },
];
// Apple 文本产物仅应为小写短码紧接编号的写法新增匹配，不能吸收普通英文短词。
const LOWERCASE_UNNUMBERED_ISO_GUARDS = [
  { name: 'plain hk label', group: '🇭🇰 香港节点' },
  { name: 'plain us label', group: '🇺🇸 美国节点' },
  { name: 'plain jp label', group: '🇯🇵 日韩节点' },
  { name: 'plain sg label', group: '🇸🇬 狮城节点' },
  { name: 'plain tw label', group: '🇹🇼 台湾节点' },
  { name: 'plain in label', group: '🌏 亚太节点' },
];
const LOON_REGION_GROUP_TO_FILTER = {
  '🇭🇰 香港节点': 'HK_Filter',
  '🏡 香港家宽': 'HK_HOME_Filter',
  '🇹🇼 台湾节点': 'TW_Filter',
  '🏡 台湾家宽': 'TW_HOME_Filter',
  '🇯🇵 日韩节点': 'JPKR_Filter',
  '🏡 日韩家宽': 'JPKR_HOME_Filter',
  '🇸🇬 狮城节点': 'SG_Filter',
  '🏡 狮城家宽': 'SG_HOME_Filter',
  '🌏 亚太节点': 'APAC_Filter',
  '🏡 亚太家宽': 'APAC_HOME_Filter',
  '🇺🇸 美国节点': 'US_Filter',
  '🏡 美国家宽': 'US_HOME_Filter',
  '🌎 美洲节点': 'AM_Filter',
  '🏡 美洲家宽': 'AM_HOME_Filter',
};

const ARTIFACT_FILES = [
  'Clash Party/ClashParty(mihomo-smart).js',
  'Clash Party/ClashParty(mihomo).js',
  'FlClash/FlClash(mihomo).js',
  'Clash Meta For Android/CMFA(mihomo).yaml',
  'Stash/Stash.yaml',
  'OpenClash/OpenClash(mihomo).conf',
  'OpenClash/OpenClash(mihomo).sh',
  'OpenClash/OpenClash(mihomo-smart).sh',
  'Shadowrocket/Shadowrocket.conf',
  'Surge/Surge.conf',
  'Loon/Loon.conf',
  'Quantumult X/QuantumultX.conf',
  'SingBox/SingBox(sing-box)-full.json',
  'Egern/Egern.yaml',
  'v2rayN/v2rayN(xray).json',
  'Passwall/Passwall(xray+sing-box)-apply.sh',
  'Passwall/Passwall(xray+sing-box).conf',
  'Passwall2/Passwall2(xray+sing-box)-apply.sh',
  'Passwall2/Passwall2(xray+sing-box).conf',
];

function usage() {
  return [
    'Usage: node tools/validate-artifact-contracts.js [--json] [--verbose]',
    '       [--write-manifest <path>] [--strict-ruby]',
    '',
    'Validates cross-client artifact contracts without changing published files.',
  ].join('\n');
}

function parseArgs(argv) {
  const options = {
    json: false,
    verbose: false,
    strictRuby: false,
    manifestPath: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--verbose') {
      options.verbose = true;
      continue;
    }
    if (arg === '--strict-ruby') {
      options.strictRuby = true;
      continue;
    }
    if (arg === '--write-manifest') {
      options.manifestPath = argv[i + 1];
      if (!options.manifestPath) throw new Error('--write-manifest requires a path');
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}\n${usage()}`);
  }
  return options;
}

function relPath(...parts) {
  return path.join(REPO_ROOT, ...parts);
}

function readText(relativePath) {
  return fs.readFileSync(relPath(relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sha256(relativePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(relPath(relativePath))).digest('hex');
}

function countMatches(source, regex) {
  const matches = source.match(regex);
  return matches ? matches.length : 0;
}

function checkNeedleBefore(record, id, source, beforeNeedle, afterNeedle) {
  const beforeIndex = source.indexOf(beforeNeedle);
  const afterIndex = source.indexOf(afterNeedle);
  record.check(`${id}.exists`, beforeIndex !== -1, failureMessage(beforeIndex !== -1, `missing ${beforeNeedle}`));
  record.check(`${id}.guard-order`, beforeIndex !== -1 && afterIndex !== -1 && beforeIndex < afterIndex, {
    message: afterIndex === -1 ? `missing ${afterNeedle}` : `${beforeNeedle} must appear before ${afterNeedle}`,
  });
}

function checkNeedleSequence(record, id, source, needles) {
  let previousIndex = -1;
  let valid = true;
  for (const needle of needles) {
    const index = source.indexOf(needle);
    if (index === -1 || index <= previousIndex) {
      valid = false;
      break;
    }
    previousIndex = index;
  }
  record.check(id, valid, {
    message: valid ? undefined : `missing or reordered fused rules: ${needles.join(' -> ')}`,
  });
}

function fusedTextRuleSetFiles(manifest, platform, segmentId) {
  const segment = (manifest.segments || []).find((row) => row.id === segmentId);
  const entry = segment && segment.files && segment.files[platform];
  if (!entry) return [];
  if (Array.isArray(entry.parts)) return entry.parts;
  return entry.file ? [entry.file] : [];
}

function fusedTextRuleSetUrls(manifest, platform, segmentId) {
  return fusedTextRuleSetFiles(manifest, platform, segmentId)
    .map((file) => repositoryAssetUrl(`rulesets/generated/fused/${platform}/${file}`, manifest.asset_revision));
}

function supplementalUrl(flavor, file) {
  return `${SUPPLEMENTAL_RULESET_BASE}/${flavor}/${file}.list`;
}

function generatedMihomoMrsUrl(file) {
  return `rulesets/generated/mihomo-mrs/${file}`;
}

function generatedEgernUrl(id) {
  return `${SUPPLEMENTAL_RULESET_BASE.replace('/rulesets/supplemental', '/rulesets/generated/egern')}/provider-${id}.yaml`;
}

const GENERATED_ASSET_URL_RE = /https:\/\/(?:fastly\.)?jsdelivr\.net\/gh\/IvanSolis1989\/Smart-Config-Kit@main\/rulesets\/generated\/(?:fused|egern)\/[^\s,"'\\]+/g;

function generatedAssetUrls(source) {
  return [...source.matchAll(GENERATED_ASSET_URL_RE)].map((match) => match[0]);
}

function validateGeneratedAssetRevision(record) {
  const manifest = readJson('rulesets/generated/fused/manifest.json');
  const assetRevision = manifest.asset_revision;
  const expectedRevision = getMihomoNormalizedRoutingGraph().version;
  record.check('generated-assets.manifest-revision', assetRevision === expectedRevision, {
    value: { assetRevision, expectedRevision },
    message: 'fused manifest asset revision must match the source routing graph version',
  });

  const products = [
    { id: 'clash-party-smart', file: 'Clash Party/ClashParty(mihomo-smart).js', mihomo: true },
    { id: 'clash-party-normal', file: 'Clash Party/ClashParty(mihomo).js', mihomo: true },
    { id: 'flclash', file: 'FlClash/FlClash(mihomo).js', mihomo: true },
    { id: 'cmfa', file: 'Clash Meta For Android/CMFA(mihomo).yaml', mihomo: true },
    { id: 'stash', file: 'Stash/Stash.yaml', mihomo: true },
    { id: 'openclash-normal', file: 'OpenClash/OpenClash(mihomo).sh', mihomo: true },
    { id: 'openclash-smart', file: 'OpenClash/OpenClash(mihomo-smart).sh', mihomo: true },
    { id: 'shadowrocket', file: 'Shadowrocket/Shadowrocket.conf' },
    { id: 'surge', file: 'Surge/Surge.conf' },
    { id: 'loon', file: 'Loon/Loon.conf' },
    { id: 'quantumult-x', file: 'Quantumult X/QuantumultX.conf' },
    { id: 'egern', file: 'Egern/Egern.yaml' },
    { id: 'sing-box', file: 'SingBox/SingBox(sing-box)-full.json' },
    { id: 'passwall', file: 'Passwall/Passwall(xray+sing-box)-apply.sh' },
    { id: 'passwall2', file: 'Passwall2/Passwall2(xray+sing-box)-apply.sh' },
  ];
  for (const product of products) {
    const source = readText(product.file);
    const urls = generatedAssetUrls(source);
    const revisionOk = urls.length > 0 && urls.every((url) => getAssetRevisionFromUrl(url) === assetRevision);
    record.check(`generated-assets.${product.id}.revisioned-urls`, revisionOk, {
      value: { urlCount: urls.length, assetRevision },
      message: `${product.file} must reference every generated asset with ?scki=${assetRevision}`,
    });
    if (product.mihomo) {
      const cachePath = `./ruleset/${assetRevision}/`;
      record.check(`generated-assets.${product.id}.versioned-mihomo-cache`, source.includes(cachePath) && !source.includes('./ruleset/scki-fused-'), {
        message: `${product.file} must use a versioned Mihomo local rule-provider path`,
      });
    }
  }
}

function supplementalMihomoProviderExpectations(spec) {
  if (spec.process) {
    return [{ id: spec.id, url: supplementalUrl('clash', spec.file) }];
  }
  if (spec.id === 'scki-local-direct') {
    return [
      { id: 'scki-local-direct-domain', url: generatedMihomoMrsUrl('scki-local-direct-domain.mrs') },
      { id: 'scki-local-direct-ipcidr', url: generatedMihomoMrsUrl('scki-local-direct-ipcidr.mrs') },
    ];
  }
  return [{ id: spec.id, url: generatedMihomoMrsUrl(`${spec.id}.mrs`) }];
}

function supplementalMihomoRuleExpectations(spec) {
  if (spec.id === 'scki-local-direct') {
    return [
      { id: 'scki-local-direct-domain', policy: spec.policy },
      { id: 'scki-local-direct-ipcidr', policy: spec.policy },
    ];
  }
  return [{ id: spec.id, policy: spec.policy }];
}

function supplementalEgernExpectations(spec) {
  if (spec.id === 'scki-local-direct') {
    return [
      { id: 'scki-local-direct-domain', file: 'provider-scki-local-direct-domain.yaml', policy: spec.policy },
      { id: 'scki-local-direct-ipcidr', file: 'provider-scki-local-direct-ipcidr.yaml', policy: spec.policy },
    ];
  }
  return [{ id: spec.id, file: `provider-${spec.id}.yaml`, policy: spec.policy }];
}

function validateMihomoMrsRuleSets(record) {
  const manifest = readJson('rulesets/generated/mihomo-mrs/manifest.json');
  const mrsDir = relPath('rulesets/generated/mihomo-mrs');
  const mrsFiles = fs.readdirSync(mrsDir).filter((file) => file.endsWith('.mrs'));
  const residualFilesOnDisk = fs.readdirSync(mrsDir).filter((file) => file.endsWith('.yaml'));
  const generatedRows = [...manifest.converted, ...manifest.split, ...(manifest.partial || [])];
  const generatedFiles = generatedRows.flatMap((row) => row.generated || []);
  const generatedFileNames = generatedFiles.map((row) => row.file);
  const residualFiles = (manifest.partial || []).map((row) => row.residual).filter(Boolean);
  const residualFileNames = residualFiles.map((row) => row.file);
  const missingFiles = generatedFileNames.filter((file) => !fs.existsSync(path.join(mrsDir, file)));
  const emptyFiles = generatedFileNames.filter((file) => {
    const fullPath = path.join(mrsDir, file);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).size === 0;
  });
  const missingResidualFiles = residualFileNames.filter((file) => !fs.existsSync(path.join(mrsDir, file)));
  const emptyResidualFiles = residualFileNames.filter((file) => {
    const fullPath = path.join(mrsDir, file);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).size === 0;
  });
  const badBehaviors = generatedFiles.filter((row) => !['domain', 'ipcidr'].includes(row.behavior));
  const badResiduals = residualFiles.filter((row) => row.behavior !== 'classical' || !row.file.endsWith('.yaml'));
  const retainedWithoutReason = manifest.retained.filter((row) => !row.reason);

  record.check('mihomo-mrs.converted-count', manifest.converted.length === EXPECTED_MIHOMO_MRS_CONVERTED, { value: manifest.converted.length });
  record.check('mihomo-mrs.split-count', manifest.split.length === EXPECTED_MIHOMO_MRS_SPLIT, { value: manifest.split.length });
  record.check('mihomo-mrs.partial-count', (manifest.partial || []).length === EXPECTED_MIHOMO_MRS_PARTIAL, { value: (manifest.partial || []).length });
  record.check('mihomo-mrs.existing-count', manifest.existing_mrs.length === EXPECTED_MIHOMO_MRS_EXISTING, { value: manifest.existing_mrs.length });
  record.check('mihomo-mrs.retained-count', manifest.retained.length === EXPECTED_MIHOMO_MRS_RETAINED, { value: manifest.retained.length });
  record.check('mihomo-mrs.failed-count', manifest.failed.length === 0, { value: manifest.failed.length });
  record.check('mihomo-mrs.generated-file-count', mrsFiles.length === EXPECTED_MIHOMO_MRS_FILES, { value: mrsFiles.length });
  record.check('mihomo-mrs.residual-file-count', residualFilesOnDisk.length === EXPECTED_MIHOMO_MRS_RESIDUAL_FILES, { value: residualFilesOnDisk.length });
  record.check('mihomo-mrs.generated-files-present', missingFiles.length === 0, { message: missingFiles.join(', ') });
  record.check('mihomo-mrs.generated-files-nonempty', emptyFiles.length === 0, { message: emptyFiles.join(', ') });
  record.check('mihomo-mrs.residual-files-present', missingResidualFiles.length === 0, { message: missingResidualFiles.join(', ') });
  record.check('mihomo-mrs.residual-files-nonempty', emptyResidualFiles.length === 0, { message: emptyResidualFiles.join(', ') });
  record.check('mihomo-mrs.domain-ipcidr-only', badBehaviors.length === 0, { message: badBehaviors.map((row) => `${row.file}:${row.behavior}`).join(', ') });
  record.check('mihomo-mrs.residual-classical-yaml', badResiduals.length === 0, { message: badResiduals.map((row) => `${row.file}:${row.behavior}`).join(', ') });
  record.check('mihomo-mrs.retained-has-reason', retainedWithoutReason.length === 0, { message: retainedWithoutReason.map((row) => row.id).join(', ') });

  const sourceGraph = readText(SOURCE_GRAPH_FILE);
  const rawGraph = getRawRoutingGraph();
  const normalizedGraph = getMihomoNormalizedRoutingGraph();
  record.check('mihomo-mrs.source-graph.tool-disable-switch', sourceGraph.includes('SCKI_DISABLE_MIHOMO_MRS_OVERRIDES'), {
    message: 'Source graph must expose a tool-only disable switch so MRS sync can read raw upstream providers',
  });
  record.check('mihomo-mrs.source-graph.raw-provider-count', Object.keys(rawGraph['rule-providers'] || {}).length > 0, {
    value: Object.keys(rawGraph['rule-providers'] || {}).length,
  });
  record.check('mihomo-mrs.source-graph.normalized-provider-count', Object.keys(normalizedGraph['rule-providers'] || {}).length === SOURCE_FULL_PROVIDERS, {
    value: Object.keys(normalizedGraph['rule-providers'] || {}).length,
  });
  record.check('mihomo-mrs.source-graph.normalized-rule-count', (normalizedGraph.rules || []).length === SOURCE_FULL_RULES, {
    value: (normalizedGraph.rules || []).length,
  });

  for (const spec of [
    { id: 'js-smart', file: 'Clash Party/ClashParty(mihomo-smart).js' },
    { id: 'js-normal', file: 'Clash Party/ClashParty(mihomo).js' },
    { id: 'flclash', file: 'FlClash/FlClash(mihomo).js' },
  ]) {
    const source = readText(spec.file);
    record.check(`mihomo-mrs.${spec.id}.no-source-mrs-block`, !source.includes('SCKI_DISABLE_MIHOMO_MRS_OVERRIDES'), {
      message: 'Client JS products must not carry source MRS override blocks',
    });
    record.check(`mihomo-mrs.${spec.id}.no-source-provider-injection`, !source.includes('function injectRuleProviders'), {
      message: 'Client JS products must consume fused rule-providers only',
    });
    record.check(`mihomo-mrs.${spec.id}.no-source-rule-injection`, !source.includes('function injectRules'), {
      message: 'Client JS products must consume fused rules only',
    });
  }
}

function xrayDomainIncludes(rule, value) {
  const domains = Array.isArray(rule && rule.domain) ? rule.domain : [];
  const normalized = String(value).replace(/^(domain|full|keyword|regexp):/, '');
  return domains.some((candidate) => {
    if (candidate === value || candidate === normalized || candidate === `full:${normalized}`) return true;
    if (candidate.startsWith('domain:')) {
      const suffix = candidate.slice('domain:'.length);
      return normalized === suffix || normalized.endsWith(`.${suffix}`);
    }
    if (candidate.startsWith('keyword:')) return normalized.includes(candidate.slice('keyword:'.length));
    return false;
  });
}

function singBoxSourceCoversDomain(id, domain) {
  const source = JSON.parse(fusedSingBoxText(id));
  return (source.rules || []).some((rule) => (
    (rule.domain || []).includes(domain)
    || (rule.domain_suffix || []).some((suffix) => domain === suffix || domain.endsWith(`.${suffix}`))
    || (rule.domain_keyword || []).some((keyword) => domain.includes(keyword))
  ));
}

function generatedYamlPayloadEntries(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s+(.+)\s*$/))
    .filter(Boolean)
    .map((match) => JSON.parse(match[1]));
}

function fusedSegmentClashEntries(segment) {
  const artifact = segment && segment.files && segment.files.clash;
  if (!artifact) return [];
  const files = Array.isArray(artifact.parts) ? artifact.parts : [artifact.file];
  return files.filter(Boolean).flatMap((file) => meaningfulRuleLines(path.join('rulesets/generated/fused/clash', file)));
}

function fusedSegmentResidualEntries(segment) {
  const artifact = segment && segment.files && segment.files.residual;
  if (!artifact || !artifact.file) return [];
  return generatedYamlPayloadEntries(relPath('rulesets/generated/fused/mihomo', artifact.file));
}

function getDomesticAuthorityFusedPriority(manifest) {
  const segments = manifest.segments || [];
  const cnSegment = segments.find((segment) => (
    segment.policy === '🏠 国内网站'
    && fusedSegmentClashEntries(segment).includes('DOMAIN-SUFFIX,cn')
  ));
  const internationalGeoSegment = segments.find((segment) => (
    segment.policy === '🌐 国外网站'
    && fusedSegmentClashEntries(segment).includes('DOMAIN-SUFFIX,akamaiedge.net')
    && fusedSegmentClashEntries(segment).includes('GEOIP,US,no-resolve')
  ));
  return { segments, cnSegment, internationalGeoSegment };
}

function checkDomesticAuthorityPriorityOrder(record, artifactId, beforeIndex, afterIndex, beforeLabel, afterLabel) {
  const ok = beforeIndex !== -1 && afterIndex !== -1 && beforeIndex < afterIndex;
  record.check(`${artifactId}.domestic-authority-before-generic-international-fallback`, ok, {
    value: { beforeIndex, afterIndex, before: beforeLabel, after: afterLabel },
    message: `expected ${beforeLabel} before ${afterLabel}`,
  });
}

function validateMihomoDomainPayloadGrammar(record, manifest, fusedDir) {
  const classicalPrefix = /^(?:DOMAIN(?:-(?:SUFFIX|KEYWORD|REGEX|WILDCARD))?|IP-CIDR6?|SRC-IP-CIDR|GEOIP|GEOSITE|IP-ASN),/i;
  const invalid = [];
  const bySegment = new Map();
  for (const segment of manifest.segments || []) {
    const domain = segment.files && segment.files.domain;
    if (!domain || !domain.source) continue;
    const entries = generatedYamlPayloadEntries(path.join(fusedDir, 'mihomo', domain.source));
    bySegment.set(segment.id, entries);
    for (const entry of entries) {
      if (classicalPrefix.test(entry)) invalid.push(`${domain.source}:${entry}`);
    }
  }
  record.check('fused.mihomo-domain-payload-wildcard-grammar', invalid.length === 0, {
    message: invalid.slice(0, 20).join(', '),
  });

  const guardEntries = ['browser-intake-datadoghq.com', 'o33249.ingest.sentry.io', 'o33249.ingest.us.sentry.io'];
  const guardSegment = (manifest.segments || []).find((segment) => {
    const entries = bySegment.get(segment.id) || [];
    return guardEntries.every((entry) => entries.includes(entry));
  });
  const adIndex = (manifest.segments || []).findIndex((segment) => segment.policy === '🛑 广告拦截');
  const guardIndex = guardSegment ? (manifest.segments || []).indexOf(guardSegment) : -1;
  record.check('fused.ai-guard-domain-payload', Boolean(guardSegment), {
    message: `missing AI false-positive guard payload: ${guardEntries.join(', ')}`,
  });
  record.check('fused.ai-guard-before-ad', guardIndex !== -1 && adIndex !== -1 && guardIndex < adIndex, {
    value: { guard: guardSegment && guardSegment.id, adIndex, guardIndex },
    message: 'ChatGPT Sentry/DataDog guard must precede the broad ad rule set',
  });

  const requiredAiDomainPayloads = [
    {
      segmentId: 'scki-fused-014-ai',
      entries: ['+.chatgpt.com', '+.oaistatic.com', '+.openai.com'],
    },
    {
      segmentId: 'scki-fused-024-ai',
      entries: ['+.a.nel.cloudflare.com'],
    },
  ];
  for (const required of requiredAiDomainPayloads) {
    const entries = bySegment.get(required.segmentId) || [];
    record.check(`fused.${required.segmentId}.chatgpt-domain-coverage`, required.entries.every((entry) => entries.includes(entry)), {
      message: `missing AI domain payloads: ${required.entries.filter((entry) => !entries.includes(entry)).join(', ')}`,
    });
  }

  const openAiIndex = (manifest.segments || []).findIndex((segment) => segment.id === 'scki-fused-014-ai');
  const aiAuxIndex = (manifest.segments || []).findIndex((segment) => segment.id === 'scki-fused-024-ai');
  const intlSiteIndex = (manifest.segments || []).findIndex((segment) => segment.id === 'scki-fused-062-intl-site');
  record.check('fused.chatgpt-ai-before-intl-site', openAiIndex !== -1 && aiAuxIndex !== -1 && intlSiteIndex !== -1 && openAiIndex < intlSiteIndex && aiAuxIndex < intlSiteIndex, {
    value: { openAiIndex, aiAuxIndex, intlSiteIndex },
    message: 'ChatGPT/OpenAI domain segments must precede the final international-site fallback',
  });
}

function validateFusedRuleSets(record) {
  const manifest = readJson('rulesets/generated/fused/manifest.json');
  const fusedDir = relPath('rulesets/generated/fused');
  const countFiles = (subdir, suffix) => fs.readdirSync(path.join(fusedDir, subdir)).filter((file) => file.endsWith(suffix)).length;
  const checkTextPlatformFiles = (platform) => {
    const expected = (manifest.segments || [])
      .flatMap((segment) => fusedTextRuleSetFiles(manifest, platform, segment.id))
      .sort();
    const actual = fs.readdirSync(path.join(fusedDir, platform))
      .filter((file) => file.endsWith('.list'))
      .sort();
    record.check(`fused.${platform}-file-count`, actual.length === expected.length, {
      value: { actual: actual.length, expected: expected.length },
    });
    record.check(`fused.${platform}-file-names`, JSON.stringify(actual) === JSON.stringify(expected), {
      message: 'generated text files must exactly match fused manifest parts',
    });
  };
  const checkTargetFileNames = (platform, suffix, manifestKey = platform) => {
    const expected = (manifest.segments || [])
      .map((segment) => segment.files && segment.files[manifestKey] && segment.files[manifestKey].file)
      .filter((file) => file && file.endsWith(suffix))
      .sort();
    const actual = fs.readdirSync(path.join(fusedDir, platform))
      .filter((file) => file.endsWith(suffix))
      .sort();
    record.check(`fused.${platform}-file-names`, JSON.stringify(actual) === JSON.stringify(expected), {
      value: { actual, expected },
    });
  };

  record.check('fused.authority-source-graph', String(manifest.authority || '').includes(SOURCE_GRAPH_ID), { value: manifest.authority });
  record.check('fused.source-provider-count', manifest.source_provider_count === SOURCE_FULL_PROVIDERS, { value: manifest.source_provider_count });
  record.check('fused.source-rule-count', manifest.source_rule_count === SOURCE_FULL_RULES, { value: manifest.source_rule_count });
  record.check('fused.provider-count', manifest.fused_provider_count === MIN_FULL_PROVIDERS, { value: manifest.fused_provider_count });
  record.check('fused.rule-count', manifest.fused_rule_count === MIN_FULL_RULES, { value: manifest.fused_rule_count });
  record.check('fused.segment-count', manifest.segment_count === EXPECTED_FUSED_SEGMENTS, { value: manifest.segment_count });
  record.check('fused.inline-rule-count', manifest.inline_rule_count === EXPECTED_FUSED_INLINE_RULES, { value: manifest.inline_rule_count });
  record.check('fused.generated-mrs-files', manifest.generated_mrs_files === EXPECTED_FUSED_MRS_FILES, { value: manifest.generated_mrs_files });
  record.check('fused.generated-srs-files', manifest.generated_srs_files === EXPECTED_FUSED_SRS_FILES, { value: manifest.generated_srs_files });
  record.check('fused.generated-passwall-files', manifest.generated_passwall_files === EXPECTED_FUSED_PASSWALL_FILES, { value: manifest.generated_passwall_files });
  record.check('fused.generated-xray-segments', manifest.generated_xray_fused_segments === EXPECTED_FUSED_XRAY_SEGMENTS, { value: manifest.generated_xray_fused_segments });
  record.check('fused.remote-asset-max-bytes', manifest.remote_asset_max_bytes === MAX_JSDELIVR_ASSET_BYTES, {
    value: manifest.remote_asset_max_bytes,
  });
  record.check('fused.unresolved-providers', (manifest.unresolved_providers || []).length === 0, { value: manifest.unresolved_providers });
  record.check('fused.unresolved-sources', (manifest.unresolved_sources || []).length === 0, { value: manifest.unresolved_sources });
  record.check('fused.passthrough-providers', (manifest.passthrough_providers || []).length === 0, { value: manifest.passthrough_providers });
  record.check('fused.pruned-empty-segments', JSON.stringify(manifest.pruned_empty_segments || []) === JSON.stringify(['scki-fused-073-cn-site']), {
    value: manifest.pruned_empty_segments,
  });
  validateMihomoDomainPayloadGrammar(record, manifest, fusedDir);
  checkTextPlatformFiles('clash');
  checkTextPlatformFiles('surge');
  checkTextPlatformFiles('quantumultx');
  record.check('fused.egern-file-count', countFiles('egern', '.yaml') === EXPECTED_FUSED_MOBILE_SEGMENTS, { value: countFiles('egern', '.yaml') });
  record.check('fused.sing-box-srs-count', countFiles('sing-box', '.srs') === EXPECTED_FUSED_SRS_FILES, { value: countFiles('sing-box', '.srs') });
  record.check('fused.passwall-file-count', countFiles('passwall', '.list') === EXPECTED_FUSED_PASSWALL_FILES, { value: countFiles('passwall', '.list') });
  checkTargetFileNames('egern', '.yaml');
  checkTargetFileNames('sing-box', '.srs', 'sing_box');
  checkTargetFileNames('passwall', '.list');
  for (const id of [
    'scki-fused-006-ad',
    'scki-fused-008-direct',
    'scki-fused-009-work',
    'scki-fused-022-google',
    'scki-fused-036-work',
    'scki-fused-039-tiktok',
    'scki-fused-059-gfw',
    'scki-fused-060-game-cn',
    'scki-fused-061-game-intl',
    'scki-fused-062-intl-site',
  ]) {
    const segment = (manifest.segments || []).find((row) => row.id === id);
    record.check(`fused.segment.${id}`, Boolean(segment), { message: `missing ${id}` });
    record.check(`fused.segment-passwall.${id}`, Boolean(segment && segment.files && segment.files.passwall && segment.files.passwall.file === `${id}.list`), {
      message: `missing Passwall fused mapping for ${id}`,
    });
    record.check(`fused.segment-xray.${id}`, Boolean(segment && segment.files && segment.files.xray && segment.files.xray.file === 'v2rayN/v2rayN(xray).json'), {
      message: `missing Xray fused mapping for ${id}`,
    });
  }
}

function checkSupplementalProviderRefs(record, id, providersBlock) {
  for (const expected of [
    'scki-fused-002-intl-site-domain',
    'scki-fused-005-cnmedia-domain',
    'scki-fused-006-ad-domain',
    'scki-fused-007-cn-site-domain',
    'scki-fused-008-direct-residual',
    'scki-fused-009-work-residual',
    'scki-fused-022-google-domain',
    'scki-fused-036-work-residual',
    'scki-fused-039-tiktok-domain',
    'scki-fused-060-game-cn-domain',
    'scki-fused-061-game-intl-domain',
    'scki-fused-062-intl-site-domain',
  ]) {
    const hasProvider = new RegExp(`^\\s{2}${expected}:\\s*$`, 'm').test(providersBlock);
    const hasUrl = providersBlock.includes(`/rulesets/generated/fused/mihomo/${expected.replace(/-residual$/, '-residual.yaml').replace(/-(domain|ipcidr|ipcidr-no-resolve)$/, '-$1.mrs')}`);
    record.check(`${id}.fused-provider.${expected}`, hasProvider && hasUrl, {
      message: `${expected} must point to generated fused Mihomo ruleset`,
    });
  }
}

function checkSupplementalMihomoRules(record, id, rulesSource) {
  for (const needle of [
    'RULE-SET,scki-fused-002-intl-site-domain,🌐 国外网站',
    'RULE-SET,scki-fused-005-cnmedia-domain,📺 国内流媒体',
    'RULE-SET,scki-fused-006-ad-domain,🛑 广告拦截',
    'RULE-SET,scki-fused-007-cn-site-domain,🏠 国内网站',
    'RULE-SET,scki-fused-008-direct-residual,DIRECT',
    'RULE-SET,scki-fused-009-work-residual,🧑‍💼 会议协作',
    'RULE-SET,scki-fused-022-google-domain,🔍 Google 服务',
    'RULE-SET,scki-fused-036-work-residual,🧑‍💼 会议协作',
    'RULE-SET,scki-fused-039-tiktok-domain,🎵 TikTok',
    'RULE-SET,scki-fused-060-game-cn-domain,🕹️ 国内游戏',
    'RULE-SET,scki-fused-061-game-intl-domain,🎮 国外游戏',
    'RULE-SET,scki-fused-062-intl-site-domain,🌐 国外网站',
  ]) {
    record.check(`${id}.fused-rule.${needle.split(',')[1]}`, rulesSource.includes(needle), {
      message: `missing ${needle}`,
    });
  }
  checkNeedleBefore(record, `${id}.fused.cloudflarestorage-before-ads`, rulesSource, 'RULE-SET,scki-fused-002-intl-site-domain,🌐 国外网站', 'RULE-SET,scki-fused-006-ad-domain,🛑 广告拦截');
  checkNeedleBefore(record, `${id}.fused.cnmedia-before-tiktok`, rulesSource, 'RULE-SET,scki-fused-005-cnmedia-domain,📺 国内流媒体', 'RULE-SET,scki-fused-039-tiktok-domain,🎵 TikTok');
  checkNeedleBefore(record, `${id}.fused.cnmedia-before-foreign-tail`, rulesSource, 'RULE-SET,scki-fused-005-cnmedia-domain,📺 国内流媒体', 'RULE-SET,scki-fused-062-intl-site-domain,🌐 国外网站');
  checkNeedleBefore(record, `${id}.fused.cnsite-before-foreign-tail`, rulesSource, 'RULE-SET,scki-fused-007-cn-site-domain,🏠 国内网站', 'RULE-SET,scki-fused-062-intl-site-domain,🌐 国外网站');
  checkNeedleBefore(record, `${id}.fused.cn-game-before-intl-game`, rulesSource, 'RULE-SET,scki-fused-060-game-cn-domain,🕹️ 国内游戏', 'RULE-SET,scki-fused-061-game-intl-domain,🎮 国外游戏');
}

function checkSupplementalMobileRules(record, id, source, flavor, options = {}, fusedManifest) {
  const platform = options.qx ? 'quantumultx' : id === 'surge' ? 'surge' : 'clash';
  const segments = [
    'scki-fused-002-intl-site',
    'scki-fused-005-cnmedia',
    'scki-fused-006-ad',
    'scki-fused-007-cn-site',
    'scki-fused-008-direct',
    'scki-fused-009-work',
    'scki-fused-022-google',
    'scki-fused-036-work',
    'scki-fused-039-tiktok',
    'scki-fused-060-game-cn',
    'scki-fused-061-game-intl',
    'scki-fused-062-intl-site',
  ];
  const urlsFor = (segment) => fusedTextRuleSetUrls(fusedManifest, platform, segment);
  for (const segment of segments) {
    const urls = urlsFor(segment);
    record.check(`${id}.fused-manifest.${segment}`, urls.length > 0, {
      message: `missing ${platform} fused manifest mapping for ${segment}`,
    });
    record.check(`${id}.fused-rule.${segment}`, urls.length > 0 && urls.every((url) => source.includes(url)), {
      message: `missing fused ${segment} part in ${id}`,
    });
    checkNeedleSequence(record, `${id}.fused-rule.${segment}.part-order`, source, urls);
  }
  checkNeedleSequence(record, `${id}.fused.timeline-order`, source, segments.flatMap((segment) => urlsFor(segment)));
}

function countLiteral(source, literal) {
  return source.split(literal).length - 1;
}

function extractJsVersion(source) {
  const match = source.match(/const\s+VERSION\s*=\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

function extractVersionPrefix(version) {
  const match = String(version || '').match(/^(v\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

function compileJs(relativePath) {
  const source = readText(relativePath);
  new vm.Script(source, { filename: relativePath });
  return source;
}

function extractYamlBlock(source, key) {
  const lines = source.split(/\r?\n/);
  const output = [];
  let inBlock = false;
  for (const line of lines) {
    if (line === `${key}:`) {
      inBlock = true;
      continue;
    }
    if (inBlock && /^[A-Za-z0-9_.-]+:/.test(line)) break;
    if (inBlock) output.push(line);
  }
  return output.join('\n');
}

function extractOpenClashOverride(relativePath) {
  const source = readText(relativePath);
  const output = [];
  let inBlock = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^cat (?:>|>>) "\$OVERRIDE_YAML" << '?OVERRIDE_EOF'?/.test(line)) {
      inBlock = true;
      continue;
    }
    if (line === 'OVERRIDE_EOF') {
      inBlock = false;
      continue;
    }
    if (inBlock) output.push(line);
  }
  return `${output.join('\n')}\n`;
}

function extractIndentedListBlock(source, key) {
  const lines = source.split(/\r?\n/);
  const output = [];
  let inBlock = false;
  const keyPattern = new RegExp(`^\\s*${key}:\\s*$`);
  for (const line of lines) {
    if (keyPattern.test(line)) {
      inBlock = true;
      continue;
    }
    if (inBlock && /^\s*(?!-\s).+:\s*$/.test(line)) break;
    if (inBlock) output.push(line.trim());
  }
  return output.join('\n');
}

function extractYamlListItems(source, key) {
  return extractIndentedListBlock(source, key)
    .split(/\r?\n/)
    .map((line) => {
      const match = line.trim().match(/^-\s+(.+?)\s*$/);
      return match ? match[1].replace(/^['"]|['"]$/g, '') : null;
    })
    .filter(Boolean);
}

function extractConfSection(source, sectionName) {
  const lines = source.split(/\r?\n/);
  const output = [];
  let inSection = false;
  for (const line of lines) {
    if (line.trim() === `[${sectionName}]`) {
      inSection = true;
      continue;
    }
    if (inSection && /^\s*\[[^\]]+\]\s*$/.test(line)) break;
    if (inSection) output.push(line);
  }
  return output.join('\n');
}

function unquoteConfigValue(value) {
  const trimmed = String(value || '').trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
    || (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function compileNodeNameFilter(pattern) {
  let source = String(pattern || '');
  let flags = '';
  if (source.startsWith('(?i)')) {
    source = source.slice(4);
    flags = 'i';
  }
  return new RegExp(source, flags);
}

function extractYamlGroupFilters(source) {
  const filters = new Map();
  let currentName = null;
  for (const line of source.split(/\r?\n/)) {
    const nameMatch = line.match(/^\s*name:\s*(.+?)\s*$/);
    if (nameMatch) {
      currentName = unquoteConfigValue(nameMatch[1]);
      continue;
    }
    const filterMatch = line.match(/^\s*filter:\s*(.+?)\s*$/);
    if (filterMatch && currentName) filters.set(currentName, unquoteConfigValue(filterMatch[1]));
  }
  return filters;
}

function validateYamlGroupFilterSyntax(record, productId, filters) {
  for (const [groupName, pattern] of filters) {
    let valid = true;
    let message;
    if (/(?:\(\?(?:[=!]|<[=!])|\\[1-9])/.test(pattern)) {
      valid = false;
      message = 'node filter for ' + groupName + ' uses lookaround or backreference unsupported by Go RE2';
    } else {
      try {
        compileNodeNameFilter(pattern);
      } catch (error) {
        valid = false;
        message = 'invalid node filter for ' + groupName + ': ' + error.message;
      }
    }
    record.check(productId + '.filter-syntax.' + groupName, valid, { message });
  }
}

function extractConfGroupFilter(source, groupName, key) {
  for (const line of source.split(/\r?\n/)) {
    if (line.startsWith('#') || !line.includes(key + '=')) continue;
    const expectedPrefix = key === 'server-tag-regex'
      ? 'url-latency-benchmark=' + groupName + ','
      : groupName + ' =';
    if (!line.startsWith(expectedPrefix)) continue;
    const start = line.indexOf(key + '=') + key.length + 1;
    const end = key === 'server-tag-regex' ? line.indexOf(', check-interval=', start) : line.length;
    if (end === -1) return null;
    return line.slice(start, end).trim();
  }
  return null;
}

function extractLoonFilter(source, filterName) {
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(filterName) || !trimmed.includes('NameRegex')) continue;
    const marker = 'FilterKey = ';
    const index = trimmed.indexOf(marker);
    if (index === -1) return null;
    return unquoteConfigValue(trimmed.slice(index + marker.length));
  }
  return null;
}

function validateNumberedLowercaseRegionFilters(record, productId, lookup) {
  for (const sample of LOWERCASE_NUMBERED_REGION_CASES) {
    const checks = [
      { target: sample.primary, name: sample.name },
      { target: sample.aggregate, name: sample.name },
      { target: sample.home, name: sample.name + ' IEPL' },
      { target: sample.aggregateHome, name: sample.name + ' IEPL' },
    ];
    for (const check of checks) {
      const pattern = lookup(check.target);
      let ok = false;
      let message;
      if (!pattern) {
        message = 'missing node filter for ' + check.target;
      } else {
        try {
          ok = compileNodeNameFilter(pattern).test(check.name);
        } catch (error) {
          message = 'invalid node filter for ' + check.target + ': ' + error.message;
        }
      }
      record.check(
        productId + '.lowercase-numbered.' + sample.name + '.' + check.target,
        ok,
        {
          message: message || ('expected ' + check.target + ' filter to match ' + check.name),
        },
      );
    }
  }
}

function validateUnnumberedLowercaseIsoGuards(record, productId, lookup) {
  for (const sample of LOWERCASE_UNNUMBERED_ISO_GUARDS) {
    const pattern = lookup(sample.group);
    let matches = false;
    let message;
    if (!pattern) {
      message = 'missing node filter for ' + sample.group;
    } else {
      try {
        matches = compileNodeNameFilter(pattern).test(sample.name);
      } catch (error) {
        message = 'invalid node filter for ' + sample.group + ': ' + error.message;
      }
    }
    const ok = !matches;
    record.check(
      productId + '.lowercase-unnumbered-guard.' + sample.name,
      ok,
      {
        message: message || ('expected ' + sample.group + ' filter not to match ' + sample.name),
      },
    );
  }
}

function checkExactList(record, id, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  record.check(id, ok, failureMessage(ok, `expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`));
}

function listFiles(relativeDir) {
  return fs.readdirSync(relPath(relativeDir), { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(relativeDir, entry.name).replace(/\\/g, '/'))
    .sort();
}

function meaningfulRuleLines(relativePath) {
  return readText(relativePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function fusedSrsUrl(segmentId, assetRevision) {
  return repositoryAssetUrl(`rulesets/generated/fused/sing-box/${segmentId}.srs`, assetRevision);
}

function fusedSingBoxText(segmentId) {
  return readText(`rulesets/generated/fused/sing-box/${segmentId}.json`);
}

function findRuby() {
  const candidates = [];
  if (process.env.RUBY) candidates.push(process.env.RUBY);
  candidates.push('ruby');
  if (process.platform === 'win32') {
    candidates.push('C:\\Ruby33-x64\\bin\\ruby.exe');
    candidates.push('C:\\Ruby34-x64\\bin\\ruby.exe');
    candidates.push('C:\\Ruby32-x64\\bin\\ruby.exe');
  }
  for (const candidate of candidates) {
    try {
      const result = childProcess.spawnSync(candidate, ['-v'], { encoding: 'utf8' });
      if (result.status === 0) return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

function rubyOpenClashProbe(yamlText, rubyPath) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-openclash-'));
  const yamlPath = path.join(tempDir, 'override.yaml');
  fs.writeFileSync(yamlPath, yamlText, 'utf8');
  const rubyScript = [
    'require "yaml"',
    'require "json"',
    'path = ARGV.fetch(0)',
    'raw = File.read(path, encoding: "UTF-8")',
    'data = YAML.load_file(path, permitted_classes: [Symbol], aliases: true)',
    'puts JSON.generate({',
    '  top_providers: raw.scan(/^rule-providers:$/).length,',
    '  top_rules: raw.scan(/^rules:$/).length,',
    '  providers: (data["rule-providers"] || {}).size,',
    '  rules: (data["rules"] || []).size,',
    '  groups: (data["proxy-groups"] || []).size',
    '})',
  ].join('\n');
  const result = childProcess.spawnSync(rubyPath, ['-e', rubyScript, yamlPath], { encoding: 'utf8' });
  fs.rmSync(tempDir, { recursive: true, force: true });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'Ruby YAML probe failed').trim());
  }
  return JSON.parse(result.stdout);
}

function rubyOpenClashRegionClassificationProbe(source, rubyPath) {
  const start = source.indexOf('REGIONS = {');
  const end = source.indexOf('\nbuckets =', start);
  const moduleBegin = '# >>> SCKI SUBSCRIPTION NODE FILTER: BEGIN';
  const moduleEnd = '# <<< SCKI SUBSCRIPTION NODE FILTER: END';
  const moduleStart = source.indexOf(moduleBegin);
  const moduleFinish = source.indexOf(moduleEnd, moduleStart);
  if (start === -1 || end === -1 || moduleStart === -1 || moduleFinish === -1) {
    throw new Error('OpenClash Ruby region-classification block not found');
  }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-openclash-region-'));
  const statusPath = path.join(tempDir, 'probe.status');
  const rubyScript = [
    'require "json"',
    source.slice(moduleStart + moduleBegin.length, moduleFinish).trim(),
    'nodes = ' + JSON.stringify(LOWERCASE_NUMBERED_REGION_CASES.map((sample) => sample.name)),
    'config = { "proxies" => nodes.map { |name| { "name" => name, "type" => "ss", "server" => "example.invalid", "port" => 443 } } }',
    'override = { "proxy-groups" => [] }',
    'ARGV.replace(["", "", "", "off", ""])',
    'VERSION = "region-probe"',
    'STATUS_LOG = ' + JSON.stringify(statusPath),
    'def status(_msg); end',
    'is_residential = ->(_name) { false }',
    'module SckiSubscriptionAdapterProfiles; def self.resolve(_profile); "off"; end; end',
    'module SckiSubscriptionAdapter; def self.capture_node_dns(_config, _servers, _profile); {}; end; end',
    source.slice(start, end),
    'results = {}',
    'nodes.each { |name| results[name] = classify.call(name) }',
    'puts JSON.generate(results)',
  ].join('\n');
  // Windows Ruby can decode non-ASCII source passed through the -e argument
  // with the active console code page. Persist this Unicode-heavy probe as UTF-8.
  const scriptPath = path.join(tempDir, 'region-probe.rb');
  fs.writeFileSync(scriptPath, '# encoding: UTF-8\n' + rubyScript, 'utf8');
  let result;
  try {
    result = childProcess.spawnSync(rubyPath, [scriptPath], { encoding: 'utf8' });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'OpenClash Ruby region probe failed').trim());
  }
  return JSON.parse(result.stdout);
}

function rubyYamlFileProbe(relativePath, rubyPath) {
  const rubyScript = [
    'require "yaml"',
    'require "json"',
    'path = ARGV.fetch(0)',
    'raw = File.read(path, encoding: "UTF-8")',
    'data = YAML.load_file(path, permitted_classes: [Symbol], aliases: true)',
    'puts JSON.generate({',
    '  top_providers: raw.scan(/^rule-providers:$/).length,',
    '  top_rules: raw.scan(/^rules:$/).length,',
    '  providers: (data["rule-providers"] || {}).size,',
    '  rules: (data["rules"] || []).size,',
    '  groups: (data["proxy-groups"] || []).size',
    '})',
  ].join('\n');
  const result = childProcess.spawnSync(rubyPath, ['-e', rubyScript, relPath(relativePath)], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'Ruby YAML file probe failed').trim());
  }
  return JSON.parse(result.stdout);
}

function makeRecorder() {
  const checks = [];
  const failures = [];
  const warnings = [];
  return {
    checks,
    failures,
    warnings,
    check(id, condition, details = {}) {
      checks.push({ id, ok: Boolean(condition), ...details });
      if (!condition) failures.push(`${id}${details.message ? `: ${details.message}` : ''}`);
    },
    warn(id, message) {
      warnings.push(`${id}: ${message}`);
    },
  };
}

function failureMessage(condition, message) {
  return condition ? {} : { message };
}

function validateJsProducts(record) {
  const smart = compileJs('Clash Party/ClashParty(mihomo-smart).js');
  const normal = compileJs('Clash Party/ClashParty(mihomo).js');
  const flclash = compileJs('FlClash/FlClash(mihomo).js');
  const runtimeVersion = extractJsVersion(smart);
  // A runtime-only Adapter can receive a platform suffix without changing the
  // source routing-graph revision consumed by static client artifacts.
  const baselineVersion = extractVersionPrefix(runtimeVersion);
  const normalVersion = extractJsVersion(normal);
  const flclashVersion = extractJsVersion(flclash);

  record.check('js.smart.version', /^v\d+\.\d+\.\d+(?:-[a-z0-9]+(?:\.[a-z0-9]+)*)?$/.test(String(runtimeVersion)), { value: runtimeVersion, message: `got ${runtimeVersion}` });
  record.check('js.smart.routing-baseline', Boolean(baselineVersion), { value: baselineVersion, message: `cannot extract routing baseline from ${runtimeVersion}` });
  record.check('js.normal.version-prefix', Boolean(baselineVersion && normalVersion && normalVersion.startsWith(`${baselineVersion}-normal`)), { value: normalVersion });
  record.check('js.flclash.version-prefix', Boolean(baselineVersion && flclashVersion && flclashVersion.startsWith(`${baselineVersion}-flclash`)), { value: flclashVersion });
  record.check('js.smart.region-interval-300', smart.includes(`interval: ${EXPECTED_REGION_TEST_INTERVAL_SECONDS}, tolerance: 30`), {
    message: 'Smart region groups must use 300s health-test interval',
  });
  record.check('js.normal.region-interval-300', normal.includes(`interval: ${EXPECTED_REGION_TEST_INTERVAL_SECONDS}, tolerance: 10`), {
    message: 'Normal region url-test groups must use 300s interval',
  });
  record.check('js.flclash.region-interval-300', flclash.includes(`interval: ${EXPECTED_REGION_TEST_INTERVAL_SECONDS}, tolerance: 10`), {
    message: 'FlClash region url-test groups must use 300s interval',
  });
  record.check('js.no-legacy-fast-region-interval', !/interval:\s*(120|180),\s*tolerance:/.test(`${smart}\n${normal}\n${flclash}`), {
    message: 'JS region interval must not regress to 120s/180s',
  });
  return { baselineVersion, runtimeVersion };
}

function validateClashYaml(record, baselineVersion, options) {
  const file = 'Clash Meta For Android/CMFA(mihomo).yaml';
  const source = readText(file);
  validateYamlGroupFilterSyntax(record, 'cmfa', extractYamlGroupFilters(source));
  const providersBlock = extractYamlBlock(source, 'rule-providers');
  const rulesBlock = extractYamlBlock(source, 'rules');
  const groupCount = countMatches(source, /^- name: |^  name: /gm);
  const providerCount = countMatches(providersBlock, /^  [^ #][^:]+:\s*$/gm);
  const ruleCount = countMatches(rulesBlock, /^- /gm);

  record.check('cmfa.group-count', groupCount === EXPECTED_GROUPS, { value: groupCount });
  record.check('cmfa.provider-count', providerCount >= MIN_FULL_PROVIDERS, { value: providerCount });
  record.check('cmfa.rule-count', ruleCount >= MIN_FULL_RULES, { value: ruleCount });
  const hasBaselineHeader = source.includes(`Clash Party ${baselineVersion}`);
  record.check('cmfa.baseline-header', hasBaselineHeader, failureMessage(hasBaselineHeader, `missing Clash Party ${baselineVersion}`));
  record.check('cmfa.rule-provider-singleton', countMatches(source, /^rule-providers:$/gm) === 1, { value: countMatches(source, /^rule-providers:$/gm) });
  record.check('cmfa.rules-singleton', countMatches(source, /^rules:$/gm) === 1, { value: countMatches(source, /^rules:$/gm) });
  const cmfaInterval300Count = countMatches(source, /^\s+interval:\s*300\s*$/gm);
  const cmfaLegacyRegionIntervals = (source.match(/^\s+interval:\s*(120|180)\s*$/gm) || []).length;
  record.check('cmfa.region-test-interval-300', cmfaInterval300Count >= EXPECTED_REGION_GROUPS + 1, {
    value: cmfaInterval300Count,
    message: 'CMFA region url-test groups plus provider health-check must use 300s',
  });
  record.check('cmfa.no-legacy-fast-region-interval', cmfaLegacyRegionIntervals === 0, {
    value: cmfaLegacyRegionIntervals,
    message: 'CMFA must not use 120s/180s region test intervals',
  });
  const nativeRegionGroups = extractYamlBlock(source, 'proxy-groups').split(/(?=^- )/m).filter(block => /^- type: url-test$/m.test(block));
  record.check('cmfa.region-excludes-local-outbounds', nativeRegionGroups.length === EXPECTED_REGION_GROUPS && nativeRegionGroups.every(block => /^  exclude-type: ['"]direct\|reject['"]$/m.test(block)), {
    message: 'Every CMFA region group must exclude direct/reject provider members without deleting dialer dependencies',
  });
  record.check('cmfa.region-empty-reject', nativeRegionGroups.length === EXPECTED_REGION_GROUPS && nativeRegionGroups.every(block => /^  empty-fallback: REJECT$/m.test(block)), {
    message: 'A region with no remote nodes must not fall back to COMPATIBLE/direct',
  });
  const rubyPath = findRuby();
  if (!rubyPath) {
    const message = 'Ruby not found; exact CMFA YAML parsing skipped';
    if (options.strictRuby) record.check('cmfa.ruby-available', false, { message });
    else record.warn('cmfa.ruby-available', message);
  } else {
    try {
      const parsed = rubyYamlFileProbe(file, rubyPath);
      record.check('cmfa.ruby-top-provider-singleton', parsed.top_providers === 1, { value: parsed.top_providers });
      record.check('cmfa.ruby-top-rules-singleton', parsed.top_rules === 1, { value: parsed.top_rules });
      record.check('cmfa.ruby-group-count', parsed.groups === EXPECTED_GROUPS, { value: parsed.groups });
      record.check('cmfa.ruby-provider-count', parsed.providers >= MIN_FULL_PROVIDERS, { value: parsed.providers });
      record.check('cmfa.ruby-rule-count', parsed.rules >= MIN_FULL_RULES, { value: parsed.rules });
    } catch (error) {
      record.check('cmfa.ruby-parse', false, { message: error.message });
    }
  }
  record.check('cmfa.no-direct-provider-downloads', !/proxy:\s*['"]?DIRECT['"]?/.test(source));
  record.check('cmfa.no-cloud-cdn-provider-downloads', !source.includes(CLOUD_CDN));
  record.check('cmfa.restricted-provider-downloads', countLiteral(source, RESTRICTED_SITE) >= MIN_FULL_PROVIDERS, {
    value: countLiteral(source, RESTRICTED_SITE),
  });
  checkSupplementalProviderRefs(record, 'cmfa', providersBlock);
  checkSupplementalMihomoRules(record, 'cmfa', rulesBlock);
  record.check('cmfa.no-legacy-amap-provider', !/^  amap:\s*$/m.test(providersBlock));
  record.check('cmfa.no-legacy-scholar-rule', !/RULE-SET,scholar,/.test(rulesBlock));
  record.check('cmfa.no-foldable-domain-inline-rules', !/^- "DOMAIN(?:-SUFFIX|-KEYWORD)?,/m.test(rulesBlock));
  const fakeIpFilterBlock = extractIndentedListBlock(source, 'fake-ip-filter');
  record.check('cmfa.fake-ip-filter-blacklist-mode', /fake-ip-filter-mode:\s*blacklist/.test(source));
  const hasNoFakeIpRuleSetRefs = !/RULE-SET,/.test(fakeIpFilterBlock);
  record.check(
    'cmfa.fake-ip-filter-no-ruleset-references',
    hasNoFakeIpRuleSetRefs,
    failureMessage(hasNoFakeIpRuleSetRefs, 'fake-ip blacklist mode must not contain rule-mode RULE-SET entries'),
  );
  for (const entry of STUN_FAKE_IP_FILTER_ENTRIES) {
    const hasEntry = fakeIpFilterBlock.includes(entry);
    record.check(`cmfa.fake-ip-filter.${entry}`, hasEntry, failureMessage(hasEntry, `missing ${entry}`));
  }
  for (const entry of REQUIRED_FAKE_IP_FILTER_ENTRIES) {
    const hasEntry = fakeIpFilterBlock.includes(entry);
    record.check(`cmfa.fake-ip-filter.${entry}`, hasEntry, failureMessage(hasEntry, `missing ${entry}`));
  }
  for (const entry of ['+.msftconnecttest.com', '+.msftncsi.com', '+.in-addr.arpa', '+.ip6.arpa']) {
    const hasEntry = fakeIpFilterBlock.includes(entry);
    record.check(`cmfa.fake-ip-filter.${entry}`, hasEntry, failureMessage(hasEntry, `missing ${entry}`));
  }
  record.check('cmfa.dns.prefer-h3-disabled-with-respect-rules', /prefer-h3:\s*false/.test(source));
  record.check('cmfa.dns.respect-rules-enabled', /respect-rules:\s*true/.test(source));
  record.check('cmfa.dns.cache-arc', /cache-algorithm:\s*arc/.test(source));
  // v5.4.22 review (FIX#HOSTS-DEDUP 防复发)：dns 块标量键不得重复（YAML last-wins 静默覆盖）
  for (const dnsKey of ['use-hosts', 'use-system-hosts', 'enhanced-mode', 'prefer-h3', 'respect-rules']) {
    const dupN = countMatches(source, new RegExp(`^\\s+${dnsKey}:`, 'gm'));
    if (dupN >= 1) record.check(`cmfa.dns.singleton.${dnsKey}`, dupN === 1, { value: dupN, message: `dns 块标量键 ${dnsKey} 出现 ${dupN} 次（重复键 → YAML last-wins 静默覆盖）` });
  }
  record.check('cmfa.dns.githubusercontent-policy', /['"]?\+\.githubusercontent\.com['"]?:/.test(source));
  checkExactList(record, 'cmfa.dns.policy-geosite-cn', extractYamlListItems(source, 'geosite:cn'), DNS_DOMESTIC_DOH);
  checkExactList(record, 'cmfa.dns.policy-geosite-not-cn', extractYamlListItems(source, 'geosite:geolocation-!cn'), DNS_FOREIGN_DOH);
  record.check('cmfa.dns.fallback-geosite-gfw', /fallback-filter:[^]*?geosite:[^]*?-\s*gfw/.test(source));
  record.check('cmfa.dns.fallback-geosite-not-cn', /fallback-filter:[^]*?geosite:[^]*?-\s*geolocation-!cn/.test(source));
  checkExactList(record, 'cmfa.dns.default-nameserver-exact', extractYamlListItems(source, 'default-nameserver'), DNS_BOOTSTRAP_IPS);
  checkExactList(record, 'cmfa.dns.nameserver-exact', extractYamlListItems(source, 'nameserver'), DNS_DOMESTIC_DOH);
  checkExactList(record, 'cmfa.dns.direct-nameserver-exact', extractYamlListItems(source, 'direct-nameserver'), DNS_DOMESTIC_DOH);
  checkExactList(record, 'cmfa.dns.proxy-server-nameserver-exact', extractYamlListItems(source, 'proxy-server-nameserver'), DNS_PROXY_DOH);
  checkExactList(record, 'cmfa.dns.fallback-exact', extractYamlListItems(source, 'fallback'), DNS_FOREIGN_DOH);
  for (const port of STUN_DIRECT_PORTS) {
    const hasPortRule = source.includes(`DST-PORT,${port},DIRECT`);
    record.check(`cmfa.stun-port.${port}`, hasPortRule, failureMessage(hasPortRule, `missing DST-PORT,${port},DIRECT`));
  }
  checkNeedleBefore(record, 'cmfa.cn-game-before-intl-game-fused', rulesBlock, 'RULE-SET,scki-fused-060-game-cn-domain,🕹️ 国内游戏', 'RULE-SET,scki-fused-061-game-intl-domain,🎮 国外游戏');
}

function validateStashYaml(record, baselineVersion, options) {
  const file = 'Stash/Stash.yaml';
  const source = readText(file);
  validateYamlGroupFilterSyntax(record, 'stash', extractYamlGroupFilters(source));
  const generator = readText('tools/generate-stash-from-cmfa.js');
  const providersBlock = extractYamlBlock(source, 'rule-providers');
  const rulesBlock = extractYamlBlock(source, 'rules');
  const groupCount = countMatches(source, /^- name: |^  name: /gm);
  const providerCount = countMatches(providersBlock, /^  [^ #][^:]+:\s*$/gm);
  const ruleCount = countMatches(rulesBlock, /^- /gm);
  const stashInterval300Count = countMatches(source, /^\s+interval:\s*300\s*$/gm);
  const legacyRegionIntervals = countMatches(source, /^\s+interval:\s*(120|180)\s*$/gm);

  record.check('stash.group-count', groupCount === EXPECTED_GROUPS, { value: groupCount });
  record.check('stash.provider-count', providerCount >= MIN_FULL_PROVIDERS, { value: providerCount });
  record.check('stash.rule-count', ruleCount >= MIN_FULL_RULES, { value: ruleCount });
  record.check('stash.baseline-header', source.includes(`rulesets/source/routing-graph.js ${baselineVersion}`), {
    message: `missing source graph ${baselineVersion}`,
  });
  record.check('stash.version-prefix', source.includes(`Stash Smart ${baselineVersion}-stash.`), {
    message: `missing Stash Smart ${baselineVersion}-stash.*`,
  });
  record.check('stash.generated-header', source.includes('node tools/generate-stash-from-cmfa.js'));
  record.check('stash.generator-from-cmfa', generator.includes('Clash Meta For Android/CMFA(mihomo).yaml'));
  record.check('stash.generator-not-reading-generated-output', !/readFileSync\([^)]*Stash\/Stash\.yaml/.test(generator));
  record.check('stash.rule-provider-singleton', countMatches(source, /^rule-providers:$/gm) === 1, { value: countMatches(source, /^rule-providers:$/gm) });
  record.check('stash.rules-singleton', countMatches(source, /^rules:$/gm) === 1, { value: countMatches(source, /^rules:$/gm) });
  record.check('stash.region-test-interval-300', stashInterval300Count === EXPECTED_REGION_GROUPS, {
    value: stashInterval300Count,
    message: 'Stash region url-test groups must use 300s; proxy-provider health-check is intentionally omitted',
  });
  record.check('stash.no-legacy-fast-region-interval', legacyRegionIntervals === 0, {
    value: legacyRegionIntervals,
    message: 'Stash must not use 120s/180s region test intervals',
  });

  const rubyPath = findRuby();
  if (!rubyPath) {
    const message = 'Ruby not found; exact Stash YAML parsing skipped';
    if (options.strictRuby) record.check('stash.ruby-available', false, { message });
    else record.warn('stash.ruby-available', message);
  } else {
    try {
      const parsed = rubyYamlFileProbe(file, rubyPath);
      record.check('stash.ruby-top-provider-singleton', parsed.top_providers === 1, { value: parsed.top_providers });
      record.check('stash.ruby-top-rules-singleton', parsed.top_rules === 1, { value: parsed.top_rules });
      record.check('stash.ruby-group-count', parsed.groups === EXPECTED_GROUPS, { value: parsed.groups });
      record.check('stash.ruby-provider-count', parsed.providers >= MIN_FULL_PROVIDERS, { value: parsed.providers });
      record.check('stash.ruby-rule-count', parsed.rules >= MIN_FULL_RULES, { value: parsed.rules });
    } catch (error) {
      record.check('stash.ruby-parse', false, { message: error.message });
    }
  }

  const forbiddenMihomoKeys = [
    'bind-address',
    'unified-delay',
    'tcp-concurrent',
    'find-process-mode',
    'keep-alive-idle',
    'keep-alive-interval',
    'geodata-mode',
    'geo-auto-update',
    'geo-update-interval',
    'geox-url',
    'profile',
    'sniffer',
    'prefer-h3',
    'fake-ip-filter-mode',
    'use-hosts',
    'use-system-hosts',
    'cache-algorithm',
    'respect-rules',
    'proxy-server-nameserver',
    'direct-nameserver',
    'direct-nameserver-follow-policy',
    'fallback',
    'fallback-filter',
    'health-check',
    'exclude-filter',
    'lazy',
    'tolerance',
    'exclude-type',
    'empty-fallback',
  ];
  for (const key of forbiddenMihomoKeys) {
    const pattern = new RegExp(`^\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`, 'm');
    record.check(`stash.no-mihomo-key.${key}`, !pattern.test(source), {
      message: `Stash YAML must not carry unverified Mihomo-only key ${key}`,
    });
  }

  record.check('stash.no-direct-provider-downloads', !/proxy:\s*['"]?DIRECT['"]?/.test(providersBlock));
  record.check('stash.no-provider-download-proxy-key', !/^    proxy:\s*/m.test(providersBlock), {
    message: 'Stash rule-providers do not document a provider download proxy field',
  });
  record.check('stash.no-restricted-provider-proxy-key', !/^\s+proxy:\s*['"]?\u{1F6AB} \u53D7\u9650\u7F51\u7AD9['"]?\s*$/mu.test(providersBlock), {
    message: 'Stash rule-providers do not document a provider download proxy field',
  });
  record.check('stash.no-cloud-cdn-provider-downloads', !providersBlock.includes(CLOUD_CDN));
  const badMrsProviders = [];
  let currentProvider = null;
  for (const line of providersBlock.split(/\r?\n/)) {
    const providerHeader = line.match(/^  ([^ #][^:]+):\s*$/);
    if (providerHeader) currentProvider = { name: providerHeader[1], behavior: null };
    if (!currentProvider) continue;
    const behavior = line.match(/^    behavior:\s*(\S+)/);
    if (behavior) currentProvider.behavior = behavior[1];
    const format = line.match(/^    format:\s*(\S+)/);
    if (format && format[1] === 'mrs' && !['domain', 'ipcidr'].includes(currentProvider.behavior)) {
      badMrsProviders.push(currentProvider.name);
    }
  }
  record.check('stash.mrs-domain-ipcidr-only', badMrsProviders.length === 0, {
    value: badMrsProviders,
    message: 'Stash MRS rule sets support domain/ipcidr only',
  });
  checkSupplementalProviderRefs(record, 'stash', providersBlock);
  checkSupplementalMihomoRules(record, 'stash', rulesBlock);
  record.check('stash.no-legacy-amap-provider', !/^  amap:\s*$/m.test(providersBlock));
  record.check('stash.no-legacy-scholar-rule', !/RULE-SET,scholar,/.test(rulesBlock));
  record.check('stash.no-foldable-domain-inline-rules', !/^- "DOMAIN(?:-SUFFIX|-KEYWORD)?,/m.test(rulesBlock));

  const fakeIpFilterBlock = extractIndentedListBlock(source, 'fake-ip-filter');
  const hasNoFakeIpRuleSetRefs = !/RULE-SET,/.test(fakeIpFilterBlock);
  record.check(
    'stash.fake-ip-filter-no-ruleset-references',
    hasNoFakeIpRuleSetRefs,
    failureMessage(hasNoFakeIpRuleSetRefs, 'Stash fake-ip-filter must not contain rule-mode RULE-SET entries'),
  );
  for (const entry of STUN_FAKE_IP_FILTER_ENTRIES) {
    const hasEntry = fakeIpFilterBlock.includes(entry);
    record.check(`stash.fake-ip-filter.${entry}`, hasEntry, failureMessage(hasEntry, `missing ${entry}`));
  }
  for (const entry of REQUIRED_FAKE_IP_FILTER_ENTRIES) {
    const hasEntry = fakeIpFilterBlock.includes(entry);
    record.check(`stash.fake-ip-filter.${entry}`, hasEntry, failureMessage(hasEntry, `missing ${entry}`));
  }
  for (const entry of ['+.msftconnecttest.com', '+.msftncsi.com', '+.in-addr.arpa', '+.ip6.arpa']) {
    const hasEntry = fakeIpFilterBlock.includes(entry);
    record.check(`stash.fake-ip-filter.${entry}`, hasEntry, failureMessage(hasEntry, `missing ${entry}`));
  }
  record.check('stash.dns.githubusercontent-policy', /['"]?\+\.githubusercontent\.com['"]?:/.test(source));
  checkExactList(record, 'stash.dns.default-nameserver-plaintext', extractYamlListItems(source, 'default-nameserver'), DNS_BOOTSTRAP_PLAINTEXT);
  checkExactList(record, 'stash.dns.nameserver-exact', extractYamlListItems(source, 'nameserver'), DNS_DOMESTIC_DOH);
  checkExactList(record, 'stash.dns.policy-geosite-cn', extractYamlListItems(source, 'geosite:cn'), DNS_DOMESTIC_DOH);
  checkExactList(record, 'stash.dns.policy-geosite-not-cn', extractYamlListItems(source, 'geosite:geolocation-!cn'), DNS_FOREIGN_DOH);
  for (const port of STUN_DIRECT_PORTS) {
    const hasPortRule = source.includes(`DST-PORT,${port},DIRECT`);
    record.check(`stash.stun-port.${port}`, hasPortRule, failureMessage(hasPortRule, `missing DST-PORT,${port},DIRECT`));
  }
  checkNeedleBefore(record, 'stash.cn-game-before-intl-game-fused', rulesBlock, 'RULE-SET,scki-fused-060-game-cn-domain,🕹️ 国内游戏', 'RULE-SET,scki-fused-061-game-intl-domain,🎮 国外游戏');
}

function validateOpenClash(record, baselineVersion, options) {
  const conf = readText('OpenClash/OpenClash(mihomo).conf');
  if (!conf.includes(baselineVersion)) {
    record.warn('openclash.conf.baseline', `OpenClash(mihomo).conf does not advertise ${baselineVersion}; primary .sh artifacts remain authoritative`);
  }

  const rubyPath = findRuby();
  if (!rubyPath) {
    const message = 'Ruby not found; exact OpenClash heredoc YAML parsing skipped';
    if (options.strictRuby) record.check('openclash.ruby-available', false, { message });
    else record.warn('openclash.ruby-available', message);
  } else if (options.verbose && !options.json) {
    console.log(`Ruby probe: ${rubyPath}`);
  }

  for (const spec of [
    { id: 'normal', file: 'OpenClash/OpenClash(mihomo).sh', suffix: 'oc-normal', minProviders: MIN_FULL_PROVIDERS, minRules: MIN_FULL_RULES },
    { id: 'smart', file: 'OpenClash/OpenClash(mihomo-smart).sh', suffix: 'oc-smart', minProviders: MIN_FULL_PROVIDERS, minRules: MIN_FULL_RULES },
  ]) {
    const source = readText(spec.file);
    const yaml = extractOpenClashOverride(spec.file);
    const providersOnly = extractYamlBlock(yaml, 'rule-providers');
    const rulesOnly = extractYamlBlock(yaml, 'rules');
    const staticBizGroups = countMatches(source, /^- name: /gm);
    const topProviders = countMatches(yaml, /^rule-providers:$/gm);
    const topRules = countMatches(yaml, /^rules:$/gm);
    const restrictedCount = countLiteral(source, RESTRICTED_SITE_RUBY) + countLiteral(yaml, RESTRICTED_SITE);

    record.check(`openclash.${spec.id}.static-business-groups`, staticBizGroups === EXPECTED_BUSINESS_GROUPS, { value: staticBizGroups });
    const hasBaselineHeader = source.includes(`Clash Party ${baselineVersion}`);
    record.check(`openclash.${spec.id}.baseline-header`, hasBaselineHeader, failureMessage(hasBaselineHeader, `missing Clash Party ${baselineVersion}`));
    const versionPrefixPattern = `${baselineVersion}-${spec.suffix}.`;
    const hasShellVersionPrefix = source.includes(`VERSION_TAG="${versionPrefixPattern}`);
    const hasRubyVersionPrefix = source.includes(`VERSION = "${versionPrefixPattern}`);
    record.check(`openclash.${spec.id}.shell-version-prefix`, hasShellVersionPrefix, failureMessage(hasShellVersionPrefix, `missing VERSION_TAG ${versionPrefixPattern}*`));
    record.check(`openclash.${spec.id}.ruby-version-prefix`, hasRubyVersionPrefix, failureMessage(hasRubyVersionPrefix, `missing Ruby VERSION ${versionPrefixPattern}*`));
    record.check(`openclash.${spec.id}.region-test-interval-300`, source.includes(`"interval"           => ${EXPECTED_REGION_TEST_INTERVAL_SECONDS}`), {
      message: 'OpenClash generated region groups must use 300s interval',
    });
    record.check(`openclash.${spec.id}.no-legacy-fast-region-interval`, !/"interval"\s*=>\s*(120|180)\b/.test(source), {
      message: 'OpenClash interval must not regress to 120s/180s',
    });
    const hasNumberedIsoNormalization = source.includes('normalize_region_name')
      && source.includes('(?<=[A-Za-z])(?=\\d)');
    record.check(
      'openclash.' + spec.id + '.lowercase-numbered-normalizer',
      hasNumberedIsoNormalization,
      failureMessage(hasNumberedIsoNormalization, 'missing ASCII letter-to-digit region-name normalization'),
    );
    record.check(`openclash.${spec.id}.rule-provider-singleton`, topProviders === 1, { value: topProviders });
    record.check(`openclash.${spec.id}.rules-singleton`, topRules === 1, { value: topRules });
    record.check(`openclash.${spec.id}.no-direct-provider-downloads`, !/proxy:\s*['"]?DIRECT['"]?/.test(source));
    record.check(`openclash.${spec.id}.restricted-provider-downloads`, restrictedCount >= spec.minProviders, { value: restrictedCount });
    checkSupplementalProviderRefs(record, `openclash.${spec.id}`, providersOnly);
    checkSupplementalMihomoRules(record, `openclash.${spec.id}`, rulesOnly);
    record.check(`openclash.${spec.id}.no-legacy-amap-provider`, !/^  amap:\s*$/m.test(providersOnly));
    record.check(`openclash.${spec.id}.no-legacy-scholar-rule`, !/RULE-SET,scholar,/.test(rulesOnly));
    record.check(`openclash.${spec.id}.no-foldable-domain-inline-rules`, !/^- "DOMAIN(?:-SUFFIX|-KEYWORD)?,/m.test(rulesOnly));
    for (const entry of STUN_FAKE_IP_FILTER_ENTRIES) {
      const hasEntry = yaml.includes(entry);
      record.check(`openclash.${spec.id}.fake-ip-filter.${entry}`, hasEntry, failureMessage(hasEntry, `missing ${entry}`));
    }
    for (const entry of REQUIRED_FAKE_IP_FILTER_ENTRIES) {
      const hasEntry = yaml.includes(entry);
      record.check(`openclash.${spec.id}.fake-ip-filter.${entry}`, hasEntry, failureMessage(hasEntry, `missing ${entry}`));
    }
    for (const entry of ['+.msftconnecttest.com', '+.msftncsi.com', '+.in-addr.arpa', '+.ip6.arpa']) {
      const hasEntry = yaml.includes(entry);
      record.check(`openclash.${spec.id}.fake-ip-filter.${entry}`, hasEntry, failureMessage(hasEntry, `missing ${entry}`));
    }
    record.check(`openclash.${spec.id}.dns.prefer-h3-disabled-with-respect-rules`, /prefer-h3:\s*false/.test(yaml));
    record.check(`openclash.${spec.id}.dns.respect-rules-enabled`, /respect-rules:\s*true/.test(yaml));
    record.check(`openclash.${spec.id}.dns.cache-arc`, /cache-algorithm:\s*arc/.test(yaml));
    // v5.4.22 review (FIX#HOSTS-DEDUP 防复发)：dns 块标量键不得重复——YAML last-wins 会静默覆盖前者，
    //   #159(#4) 曾用重复 `use-hosts: false` 回退 #156 的 `use-hosts: true`，validator 此前未覆盖嵌套层重复键。
    for (const dnsKey of ['use-hosts', 'use-system-hosts', 'enhanced-mode', 'prefer-h3', 'respect-rules']) {
      const dupN = countMatches(source, new RegExp(`^\\s+${dnsKey}:`, 'gm'));
      if (dupN >= 1) record.check(`openclash.${spec.id}.dns.singleton.${dnsKey}`, dupN === 1, { value: dupN, message: `dns 块标量键 ${dnsKey} 出现 ${dupN} 次（重复键 → YAML last-wins 静默覆盖；见 FIX#HOSTS-DEDUP）` });
    }
    record.check(`openclash.${spec.id}.dns.githubusercontent-policy`, /['"]?\+\.githubusercontent\.com['"]?:/.test(yaml));
    checkExactList(record, `openclash.${spec.id}.dns.policy-geosite-cn`, extractYamlListItems(yaml, 'geosite:cn'), DNS_DOMESTIC_DOH);
    checkExactList(record, `openclash.${spec.id}.dns.policy-geosite-not-cn`, extractYamlListItems(yaml, 'geosite:geolocation-!cn'), DNS_FOREIGN_DOH);
    record.check(`openclash.${spec.id}.dns.fallback-geosite-gfw`, /fallback-filter:[^]*?geosite:[^]*?-\s*gfw/.test(yaml));
    record.check(`openclash.${spec.id}.dns.fallback-geosite-not-cn`, /fallback-filter:[^]*?geosite:[^]*?-\s*geolocation-!cn/.test(yaml));
    checkExactList(record, `openclash.${spec.id}.dns.default-nameserver-exact`, extractYamlListItems(yaml, 'default-nameserver'), DNS_BOOTSTRAP_IPS);
    checkExactList(record, `openclash.${spec.id}.dns.nameserver-exact`, extractYamlListItems(yaml, 'nameserver'), DNS_DOMESTIC_DOH);
    checkExactList(record, `openclash.${spec.id}.dns.direct-nameserver-exact`, extractYamlListItems(yaml, 'direct-nameserver'), DNS_DOMESTIC_DOH);
    checkExactList(record, `openclash.${spec.id}.dns.proxy-server-nameserver-exact`, extractYamlListItems(yaml, 'proxy-server-nameserver'), DNS_PROXY_DOH);
    checkExactList(record, `openclash.${spec.id}.dns.fallback-exact`, extractYamlListItems(yaml, 'fallback'), DNS_FOREIGN_DOH);
    for (const port of STUN_DIRECT_PORTS) {
      const hasPortRule = yaml.includes(`DST-PORT,${port},DIRECT`);
      record.check(`openclash.${spec.id}.stun-port.${port}`, hasPortRule, failureMessage(hasPortRule, `missing DST-PORT,${port},DIRECT`));
    }
    checkNeedleBefore(record, `openclash.${spec.id}.cn-game-before-intl-game-fused`, rulesOnly, 'RULE-SET,scki-fused-060-game-cn-domain,🕹️ 国内游戏', 'RULE-SET,scki-fused-061-game-intl-domain,🎮 国外游戏');

    if (rubyPath) {
      try {
        const parsed = rubyOpenClashProbe(yaml, rubyPath);
        record.check(`openclash.${spec.id}.ruby-top-provider-singleton`, parsed.top_providers === 1, { value: parsed.top_providers });
        record.check(`openclash.${spec.id}.ruby-top-rules-singleton`, parsed.top_rules === 1, { value: parsed.top_rules });
        record.check(`openclash.${spec.id}.ruby-provider-count`, parsed.providers >= spec.minProviders, { value: parsed.providers });
        record.check(`openclash.${spec.id}.ruby-rule-count`, parsed.rules >= spec.minRules, { value: parsed.rules });
        record.check(`openclash.${spec.id}.ruby-business-group-count`, parsed.groups === EXPECTED_BUSINESS_GROUPS, { value: parsed.groups });
      } catch (error) {
        record.check(`openclash.${spec.id}.ruby-parse`, false, { message: error.message });
      }
      try {
        const classifications = rubyOpenClashRegionClassificationProbe(source, rubyPath);
        for (const sample of LOWERCASE_NUMBERED_REGION_CASES) {
          const actual = classifications[sample.name];
          const ok = actual === sample.region;
          record.check(
            'openclash.' + spec.id + '.lowercase-numbered.' + sample.name,
            ok,
            failureMessage(ok, 'expected ' + sample.name + ' to classify as ' + sample.region + ', got ' + actual),
          );
        }
      } catch (error) {
        record.check('openclash.' + spec.id + '.lowercase-numbered-ruby-probe', false, { message: error.message });
      }
    }
  }
}

function validateConfProducts(record, baselineVersion) {
  const fusedManifest = readJson('rulesets/generated/fused/manifest.json');
  const specs = [
    { id: 'shadowrocket', file: 'Shadowrocket/Shadowrocket.conf', regex: / = select,|= url-test,/g },
    { id: 'surge', file: 'Surge/Surge.conf', regex: / = select,|= url-test,/g },
    { id: 'loon', file: 'Loon/Loon.conf', regex: / = select,|= url-test,/g },
    { id: 'qx', file: 'Quantumult X/QuantumultX.conf', regex: /^(url-latency-benchmark|static)=/gm },
  ];
  for (const spec of specs) {
    const source = readText(spec.file);
    const groupCount = countMatches(source, spec.regex);
    record.check(`${spec.id}.group-count`, groupCount === EXPECTED_GROUPS, { value: groupCount });
    const hasBaselineHeader = source.includes(`Clash Party ${baselineVersion}`);
    record.check(`${spec.id}.baseline-header`, hasBaselineHeader, failureMessage(hasBaselineHeader, `missing Clash Party ${baselineVersion}`));
    record.check(`${spec.id}.changelog-reference`, source.includes('CHANGELOG.md'));
    const intervalToken = spec.id === 'qx' ? 'check-interval=300' : 'interval=300';
    const legacyIntervalPattern = spec.id === 'qx' ? /check-interval=(120|180)\b/ : /interval=(120|180)\b/;
    const intervalCount = countLiteral(source, intervalToken);
    record.check(`${spec.id}.region-test-interval-300`, intervalCount === EXPECTED_REGION_GROUPS, {
      value: intervalCount,
      message: `${spec.id} must emit ${EXPECTED_REGION_GROUPS} region test intervals at 300s`,
    });
    record.check(`${spec.id}.no-legacy-fast-region-interval`, !legacyIntervalPattern.test(source), {
      message: `${spec.id} must not regress to 120s/180s interval`,
    });
  }

  const shadowrocket = readText('Shadowrocket/Shadowrocket.conf');
  const surge = readText('Surge/Surge.conf');
  const loon = readText('Loon/Loon.conf');
  const qx = readText('Quantumult X/QuantumultX.conf');
  const loonRemoteRule = extractConfSection(loon, 'Remote Rule');
  const loonRuleSection = extractConfSection(loon, 'Rule');
  const qxFilterRemote = extractConfSection(qx, 'filter_remote');
  const qxFilterLocal = extractConfSection(qx, 'filter_local');
  record.check('shadowrocket.no-legacy-scholar-list', !shadowrocket.includes('/Scholar/Scholar.list'));
  record.check('surge.no-legacy-scholar-list', !surge.includes('/Scholar/Scholar.list'));
  record.check('loon.no-legacy-scholar-list', !loon.includes('/Scholar/Scholar.list'));
  record.check('qx.no-legacy-scholar-list', !qx.includes('/Scholar/Scholar.list'));
  checkSupplementalMobileRules(record, 'shadowrocket', shadowrocket, 'clash', {}, fusedManifest);
  checkSupplementalMobileRules(record, 'surge', surge, 'clash', { surgeProcess: true }, fusedManifest);
  checkSupplementalMobileRules(record, 'loon', loonRemoteRule, 'clash', { loon: true }, fusedManifest);
  checkSupplementalMobileRules(record, 'qx', qxFilterRemote, 'quantumultx', { qx: true }, fusedManifest);
  record.check('shadowrocket.no-foldable-domain-inline-rules', !/^DOMAIN(?:-SUFFIX|-KEYWORD)?,/m.test(shadowrocket));
  record.check('surge.no-foldable-domain-inline-rules', !/^DOMAIN(?:-SUFFIX|-KEYWORD)?,/m.test(surge));
  record.check('loon.no-foldable-domain-inline-rules', !/^DOMAIN(?:-SUFFIX|-KEYWORD)?,/m.test(loonRuleSection));
  record.check('qx.no-foldable-host-inline-rules', !/^\s*host(?:-suffix|-keyword)?,/mi.test(qxFilterLocal));
  // v5.4.18: normalize whitespace around commas to avoid false failures on cosmetic formatting changes
  const srNorm = (s) => s.replace(/\s*,\s*/g, ',');
  // v5.4.21 #4: DoH-over-IP — all DoH URLs use IP host to eliminate bootstrap leak
  record.check('shadowrocket.dns.nameserver-doh-over-ip', srNorm(shadowrocket).includes('dns-server = https://223.5.5.5/dns-query,https://223.6.6.6/dns-query,https://8.8.8.8/dns-query,https://1.1.1.1/dns-query'));
  record.check('shadowrocket.dns.proxy-server-doh-over-ip', srNorm(shadowrocket).includes('proxy-dns-server = https://8.8.8.8/dns-query,https://1.1.1.1/dns-query,https://223.5.5.5/dns-query,https://223.6.6.6/dns-query'));
  record.check('shadowrocket.dns.fallback-doh-over-ip', srNorm(shadowrocket).includes('fallback-dns-server = https://8.8.8.8/dns-query,https://1.1.1.1/dns-query'));
  record.check('surge.dns.bootstrap-plaintext-fallback', surge.includes('dns-server = 223.5.5.5, 119.29.29.29, 1.1.1.1, 8.8.8.8'));
  record.check('surge.dns.encrypted-doh-over-ip', surge.includes('encrypted-dns-server = https://223.5.5.5/dns-query, https://223.6.6.6/dns-query, https://8.8.8.8/dns-query, https://1.1.1.1/dns-query'));
  record.check('surge.dns.fallback-doh-over-ip', surge.includes('fallback-dns-server = https://8.8.8.8/dns-query, https://1.1.1.1/dns-query'));
  record.check('loon.dns.bootstrap-plaintext-fallback', loon.includes('dns-server = 223.5.5.5, 119.29.29.29, 1.1.1.1, 8.8.8.8'));
  record.check('loon.dns.doh-over-ip', loon.includes('doh-server = https://223.5.5.5/dns-query, https://223.6.6.6/dns-query, https://8.8.8.8/dns-query, https://1.1.1.1/dns-query'));
  for (const server of DNS_BOOTSTRAP_PLAINTEXT) record.check(`qx.dns.server.${server}`, qx.includes(`server=${server}`));
  for (const server of DNS_BOOTSTRAP_DOH_OVER_IP) record.check(`qx.dns.doh-server.${server}`, qx.includes(`doh-server=${server}`));
  for (const port of STUN_DIRECT_PORTS) {
    const srHasPortRule = shadowrocket.includes(`DST-PORT,${port},DIRECT`);
    const surgeHasPortRule = surge.includes(`DEST-PORT,${port},DIRECT`);
    const loonHasPortRule = loon.includes(`DEST-PORT,${port},DIRECT`);
    const qxHasPortRule = qx.includes(`dest-port, ${port}, direct`);
    record.check(`shadowrocket.stun-port.${port}`, srHasPortRule, failureMessage(srHasPortRule, `missing DST-PORT,${port},DIRECT`));
    record.check(`surge.stun-port.${port}`, surgeHasPortRule, failureMessage(surgeHasPortRule, `missing DEST-PORT,${port},DIRECT`));
    record.check(`loon.stun-port.${port}`, loonHasPortRule, failureMessage(loonHasPortRule, `missing DEST-PORT,${port},DIRECT`));
    record.check(`qx.stun-port.${port}`, qxHasPortRule, failureMessage(qxHasPortRule, `missing dest-port, ${port}, direct`));
  }

  const loonHasNoDstPortPrefix = !loon.split(/\r?\n/).some((line) => /^DST-PORT,/.test(line));
  record.check(
    'loon.no-dst-port-prefix',
    loonHasNoDstPortPrefix,
    failureMessage(loonHasNoDstPortPrefix, 'Loon must use DEST-PORT, not DST-PORT'),
  );

  const surgeHasNoDstPortPrefix = !surge.split(/\r?\n/).some((line) => /^DST-PORT,/.test(line));
  record.check(
    'surge.no-dst-port-prefix',
    surgeHasNoDstPortPrefix,
    failureMessage(surgeHasNoDstPortPrefix, 'Surge must use DEST-PORT, not DST-PORT'),
  );

  const qxHasNoDohUrlInServerField = !qx.split(/\r?\n/).some((line) => /^server=https:\/\//.test(line));
  record.check(
    'qx.no-doh-url-in-server-field',
    qxHasNoDohUrlInServerField,
    failureMessage(qxHasNoDohUrlInServerField, 'QX DoH URLs must use doh-server='),
  );
  const qxHasValidRunningModeTrigger = !/^running_mode_trigger=.*\bfilter\b/m.test(qx);
  record.check(
    'qx.running-mode-trigger-values',
    qxHasValidRunningModeTrigger,
    failureMessage(qxHasValidRunningModeTrigger, 'QX running_mode_trigger cannot use filter'),
  );
  const qxLocalRuleInRemote = qxFilterRemote.split(/\r?\n/).some((line) => /^\s*(host|host-suffix|host-keyword|ip-cidr|ip6-cidr|dst-port),/i.test(line));
  record.check(
    'qx.filter-remote-no-local-rules',
    !qxLocalRuleInRemote,
    failureMessage(!qxLocalRuleInRemote, 'QX local filter rules must live in [filter_local], not [filter_remote]'),
  );
}

function validateRuntimeNodeNameProducts(record) {
  for (const spec of [
    { id: 'cmfa', file: 'Clash Meta For Android/CMFA(mihomo).yaml' },
    { id: 'stash', file: 'Stash/Stash.yaml' },
    { id: 'egern', file: 'Egern/Egern.yaml' },
  ]) {
    const filters = extractYamlGroupFilters(readText(spec.file));
    validateNumberedLowercaseRegionFilters(record, spec.id, (groupName) => filters.get(groupName));
  }

  const loon = readText('Loon/Loon.conf');
  validateNumberedLowercaseRegionFilters(
    record,
    'loon',
    (groupName) => extractLoonFilter(loon, LOON_REGION_GROUP_TO_FILTER[groupName]),
  );

  for (const spec of [
    { id: 'shadowrocket', file: 'Shadowrocket/Shadowrocket.conf', key: 'policy-regex-filter' },
    { id: 'surge', file: 'Surge/Surge.conf', key: 'policy-regex-filter' },
    { id: 'qx', file: 'Quantumult X/QuantumultX.conf', key: 'server-tag-regex' },
  ]) {
    const source = readText(spec.file);
    validateNumberedLowercaseRegionFilters(
      record,
      spec.id,
      (groupName) => extractConfGroupFilter(source, groupName, spec.key),
    );
    validateUnnumberedLowercaseIsoGuards(
      record,
      spec.id,
      (groupName) => extractConfGroupFilter(source, groupName, spec.key),
    );
  }
}

function validateJsonProducts(record, baselineVersion) {
  const singbox = readJson('SingBox/SingBox(sing-box)-full.json');
  const singboxGenerator = readText('SingBox/SingBox(sing-box)-generator.js');
  const generatorVersion = (singboxGenerator.match(/const\s+VERSION\s*=\s*'([^']+)'/) || [])[1];
  const generatorBuild = (singboxGenerator.match(/const\s+BUILD(?:_DATE)?\s*=\s*'([^']+)'/) || [])[1];
  const generatorBaseline = (singboxGenerator.match(/const\s+BASELINE\s*=\s*'([^']+)'/) || [])[1];
  const selectorCount = (singbox.outbounds || []).filter((outbound) => outbound.type === 'selector' || outbound.type === 'urltest').length;
  const singboxUrltests = (singbox.outbounds || []).filter((outbound) => outbound.type === 'urltest');
  const outboundTags = (singbox.outbounds || []).map((outbound) => outbound.tag).filter(Boolean);
  const singboxBusinessOrder = outboundTags.filter((tag) => SINGBOX_BUSINESS_ORDER.includes(tag));
  const routeRules = ((singbox.route || {}).rules || []);
  const ruleSetCount = ((singbox.route || {}).rule_set || []).length;
  const routeRuleCount = routeRules.length;
  const dnsRules = ((singbox.dns || {}).rules || []);
  const dnsServers = ((singbox.dns || {}).servers || []);
  const dnsServerByTag = Object.fromEntries(dnsServers.filter((server) => server && server.tag).map((server) => [server.tag, server]));
  record.check('singbox.baseline-meta', singbox._meta && singbox._meta.baseline === `Clash Party ${baselineVersion}`, { value: singbox._meta && singbox._meta.baseline });
  record.check('singbox.generator-version-meta', singbox._meta && singbox._meta.version === generatorVersion, {
    value: { meta: singbox._meta && singbox._meta.version, generator: generatorVersion },
  });
  record.check('singbox.generator-build-meta', singbox._meta && singbox._meta.build === generatorBuild, {
    value: { meta: singbox._meta && singbox._meta.build, generator: generatorBuild },
  });
  record.check('singbox.generator-baseline-meta', singbox._meta && singbox._meta.baseline === generatorBaseline, {
    value: { meta: singbox._meta && singbox._meta.baseline, generator: generatorBaseline },
  });
  record.check('singbox.generator-clean-base', !/readFileSync\(['"]SingBox\/SingBox\(sing-box\)-full\.json['"]/.test(singboxGenerator));
  record.check('singbox.selector-urltest-count', selectorCount === EXPECTED_SINGBOX_GROUPS, { value: selectorCount });
  record.check('singbox.urltest-interval-5m', singboxUrltests.length === EXPECTED_SINGBOX_URLTEST_GROUPS && singboxUrltests.every((outbound) => outbound.interval === EXPECTED_SINGBOX_URLTEST_INTERVAL), {
    value: Array.from(new Set(singboxUrltests.map((outbound) => outbound.interval))).sort(),
    message: 'SingBox urltest outbounds must use 5m interval (300s)',
  });
  record.check('singbox.generator-urltest-interval-5m', singboxGenerator.includes(`interval: '${EXPECTED_SINGBOX_URLTEST_INTERVAL}'`) && !singboxGenerator.includes("interval: '3m'"), {
    message: 'SingBox generator must emit 5m urltest intervals',
  });
  checkExactList(record, 'singbox.business-group-order', singboxBusinessOrder, SINGBOX_BUSINESS_ORDER);
  const finalAsUnconditionalRule = routeRules.some((rule) => (
    rule
      && rule.action === 'route'
      && rule.outbound === '🐟 漏网之鱼'
      && Object.keys(rule).every((key) => key === 'action' || key === 'outbound')
  ));
  record.check('singbox.no-unconditional-final-route-rule', !finalAsUnconditionalRule, {
    message: 'SingBox must use route.final for MATCH fallback; an unconditional final rule would shadow later QUIC rules',
  });
  record.check('singbox.rule-set-count', ruleSetCount === EXPECTED_FUSED_SRS_FILES + EXPECTED_SINGBOX_RUNTIME_GEO_RULE_SETS, { value: ruleSetCount });
  record.check('singbox.route-rule-count', routeRuleCount === EXPECTED_SINGBOX_ROUTE_RULES, { value: routeRuleCount });
  const singboxScholarGoogle = routeRules.some((rule) => (
    Array.isArray(rule.rule_set) && rule.rule_set.includes('scki-fused-022-google') && rule.outbound === '🔍 Google 服务'
  ));
  record.check('singbox.scholar-target-google-fused', singboxScholarGoogle, failureMessage(singboxScholarGoogle, 'Google service fused rule_set must include scholar coverage'));
  record.check('singbox.dns.bootstrap-doh-over-ip', dnsServerByTag.dns_bootstrap && dnsServerByTag.dns_bootstrap.address === 'https://223.5.5.5/dns-query' && dnsServerByTag.dns_bootstrap.tls && dnsServerByTag.dns_bootstrap.tls.server_name === 'dns.alidns.com', {
    value: dnsServerByTag.dns_bootstrap && dnsServerByTag.dns_bootstrap.address,
  });
  record.check('singbox.dns.direct-doh', dnsServerByTag.dns_direct && dnsServerByTag.dns_direct.address === 'https://dns.alidns.com/dns-query', {
    value: dnsServerByTag.dns_direct && dnsServerByTag.dns_direct.address,
  });
  record.check('singbox.dns.proxy-doh', dnsServerByTag.dns_proxy && dnsServerByTag.dns_proxy.address === 'https://cloudflare-dns.com/dns-query', {
    value: dnsServerByTag.dns_proxy && dnsServerByTag.dns_proxy.address,
  });
  record.check('singbox.dns.direct-bootstrap-resolver', dnsServerByTag.dns_direct && dnsServerByTag.dns_direct.address_resolver === 'dns_bootstrap');
  record.check('singbox.dns.proxy-bootstrap-resolver', dnsServerByTag.dns_proxy && dnsServerByTag.dns_proxy.address_resolver === 'dns_bootstrap');
  record.check('singbox.dns.proxy-detour-main-selector', dnsServerByTag.dns_proxy && dnsServerByTag.dns_proxy.detour === '🚀 节点选择', {
    value: dnsServerByTag.dns_proxy && dnsServerByTag.dns_proxy.detour,
  });
  // v5.4.18: verify DNS redundancy — bootstrap/direct/proxy each have backup servers
  record.check('singbox.dns.bootstrap-redundancy', dnsServers.filter((s) => s.tag && s.tag.startsWith('dns_bootstrap')).length >= 2, {
    value: dnsServers.filter((s) => s.tag && s.tag.startsWith('dns_bootstrap')).map((s) => s.tag),
  });
  record.check('singbox.dns.direct-redundancy', dnsServers.filter((s) => s.tag && s.tag.startsWith('dns_direct')).length >= 2, {
    value: dnsServers.filter((s) => s.tag && s.tag.startsWith('dns_direct')).map((s) => s.tag),
  });
  record.check('singbox.dns.proxy-redundancy', dnsServers.filter((s) => s.tag && s.tag.startsWith('dns_proxy')).length >= 2, {
    value: dnsServers.filter((s) => s.tag && s.tag.startsWith('dns_proxy')).map((s) => s.tag),
  });
  const singboxPrivateDnsDirect = dnsRules.some((rule) => (
    Array.isArray(rule.rule_set) && rule.rule_set.includes('geosite-private') && rule.server === 'dns_direct'
  ));
  record.check('singbox.dns.private-direct', singboxPrivateDnsDirect, failureMessage(singboxPrivateDnsDirect, 'geosite-private DNS must use dns_direct'));
  const singboxCnDnsDirect = dnsRules.some((rule) => (
    Array.isArray(rule.rule_set)
      && rule.rule_set.includes('geosite-cn')
      && rule.rule_set.includes('geoip-cn')
      && rule.server === 'dns_direct'
  ));
  record.check('singbox.dns.cn-direct', singboxCnDnsDirect, failureMessage(singboxCnDnsDirect, 'geosite-cn and geoip-cn DNS must use dns_direct'));
  record.check('singbox.dns.final-proxy', (singbox.dns || {}).final === 'dns_proxy', { value: (singbox.dns || {}).final });
  for (const port of STUN_DIRECT_PORTS) {
    const hasPortRule = ((singbox.route || {}).rules || []).some((rule) => (
      Array.isArray(rule.port) && rule.port.includes(port) && rule.outbound === 'DIRECT'
    ));
    record.check(`singbox.stun-port.${port}`, hasPortRule, failureMessage(hasPortRule, `missing route rule for port ${port} -> DIRECT`));
  }
  const singboxRules = (singbox.route || {}).rules || [];
  const singboxCloudflareR2Index = singboxRules.findIndex((rule) => (
    Array.isArray(rule.rule_set) && rule.rule_set.includes('scki-fused-002-intl-site') && rule.outbound === '🌐 国外网站'
  ));
  const singboxAntiAdIndex = singboxRules.findIndex((rule) => (
    Array.isArray(rule.rule_set) && rule.rule_set.includes('scki-fused-006-ad') && rule.action === 'reject'
  ));
  record.check('singbox.cloudflarestorage-before-ads', singboxCloudflareR2Index !== -1 && singboxAntiAdIndex !== -1 && singboxCloudflareR2Index < singboxAntiAdIndex, {
    value: { cloudflarestorage: singboxCloudflareR2Index, antiAd: singboxAntiAdIndex },
  });
  const singboxDouyinIndex = singboxRules.findIndex((rule) => (
    Array.isArray(rule.rule_set) && rule.rule_set.includes('scki-fused-005-cnmedia') && rule.outbound === '📺 国内流媒体'
  ));
  const singboxTikTokIndex = singboxRules.findIndex((rule) => (
    Array.isArray(rule.rule_set) && rule.rule_set.includes('scki-fused-039-tiktok') && rule.outbound === '🎵 TikTok'
  ));
  const singboxForeignTailIndex = singboxRules.findIndex((rule) => (
    Array.isArray(rule.rule_set) && rule.rule_set.includes('scki-fused-062-intl-site') && rule.outbound === '🌐 国外网站'
  ));
  const singboxAmapIndex = singboxRules.findIndex((rule) => (
    Array.isArray(rule.rule_set) && rule.rule_set.includes('scki-fused-007-cn-site') && rule.outbound === '🏠 国内网站'
  ));
  record.check('singbox.douyin-zjcdn-cnmedia', singboxDouyinIndex !== -1, failureMessage(singboxDouyinIndex !== -1, 'zjcdn.com must route to CN media'));
  record.check('singbox.douyin-zjcdn-before-tiktok', singboxDouyinIndex !== -1 && singboxTikTokIndex !== -1 && singboxDouyinIndex < singboxTikTokIndex, {
    value: { douyin: singboxDouyinIndex, tiktok: singboxTikTokIndex },
  });
  record.check('singbox.douyin-zjcdn-before-foreign-tail', singboxDouyinIndex !== -1 && singboxForeignTailIndex !== -1 && singboxDouyinIndex < singboxForeignTailIndex, {
    value: { douyin: singboxDouyinIndex, foreignTail: singboxForeignTailIndex },
  });
  record.check('singbox.amap-cnsite', singboxAmapIndex !== -1, failureMessage(singboxAmapIndex !== -1, 'amap rule_set must route to CN site'));
  record.check('singbox.amap-before-foreign-tail', singboxAmapIndex !== -1 && singboxForeignTailIndex !== -1 && singboxAmapIndex < singboxForeignTailIndex, {
    value: { amap: singboxAmapIndex, foreignTail: singboxForeignTailIndex },
  });
  const singboxCnGameIndex = singboxRules.findIndex((rule) => (
    Array.isArray(rule.rule_set) && rule.rule_set.includes('scki-fused-060-game-cn') && rule.outbound === '🕹️ 国内游戏'
  ));
  const singboxIntlGameIndex = singboxRules.findIndex((rule) => (
    Array.isArray(rule.rule_set) && rule.rule_set.includes('scki-fused-061-game-intl') && rule.outbound === '🎮 国外游戏'
  ));
  record.check('singbox.cn-game-before-intl-game-fused', singboxCnGameIndex !== -1 && singboxIntlGameIndex !== -1 && singboxCnGameIndex < singboxIntlGameIndex, {
    value: { cnGame: singboxCnGameIndex, intlGame: singboxIntlGameIndex },
  });

  const v2rayn = readJson('v2rayN/v2rayN(xray).json');
  const allowedTags = new Set(['proxy', 'direct', 'block']);
  record.check('v2rayn.top-level-array', Array.isArray(v2rayn));
  record.check('v2rayn.rule-count', Array.isArray(v2rayn) && v2rayn.length === EXPECTED_XRAY_RULES, { value: Array.isArray(v2rayn) ? v2rayn.length : null });
  record.check('v2rayn.baseline-remarks', Array.isArray(v2rayn) && String(v2rayn[0] && v2rayn[0].remarks).includes(`Clash Party ${baselineVersion}`));
  record.check('v2rayn.generated-from-fused', Array.isArray(v2rayn) && String(v2rayn[0] && v2rayn[0].remarks).includes('rulesets/generated/fused/sing-box'), {
    message: 'v2rayN Xray output must be generated from fused sing-box source JSON',
  });
  record.check('v2rayn.outbound-tags', Array.isArray(v2rayn) && v2rayn.every((rule) => allowedTags.has(rule.outboundTag)), {
    value: Array.isArray(v2rayn) ? Array.from(new Set(v2rayn.map((rule) => rule.outboundTag))).sort() : null,
  });
  for (const id of ['scki-fused-002-intl-site', 'scki-fused-005-cnmedia', 'scki-fused-006-ad', 'scki-fused-007-cn-site', 'scki-fused-022-google', 'scki-fused-060-game-cn', 'scki-fused-061-game-intl']) {
    record.check(`v2rayn.fused-rule.${id}`, Array.isArray(v2rayn) && v2rayn.some((rule) => rule.id === id), {
      message: `missing ${id}`,
    });
  }
  record.check('v2rayn.no-legacy-handwritten-rule-ids', Array.isArray(v2rayn) && !v2rayn.some((rule) => /^scki-(000[abcde]|00[1-9]|0[1-9][0-9])-/.test(String(rule.id || ''))), {
    message: 'v2rayN must not retain old handwritten scki-NNN route ids',
  });
  for (const port of STUN_DIRECT_PORTS) {
    const hasPortRule = Array.isArray(v2rayn) && v2rayn.some((rule) => (
      rule.outboundTag === 'direct' && String(rule.port || '').split(',').map((item) => item.trim()).includes(String(port))
    ));
    record.check(`v2rayn.stun-port.${port}`, hasPortRule, failureMessage(hasPortRule, `missing port ${port} -> direct`));
  }
  const v2CloudflareR2Index = Array.isArray(v2rayn) ? v2rayn.findIndex((rule) => (
    rule.id === 'scki-fused-002-intl-site'
      && rule.outboundTag === 'proxy'
      && xrayDomainIncludes(rule, 'domain:cloudflarestorage.com')
  )) : -1;
  const v2AdsIndex = Array.isArray(v2rayn) ? v2rayn.findIndex((rule) => rule.id === 'scki-fused-006-ad') : -1;
  const v2DouyinIndex = Array.isArray(v2rayn) ? v2rayn.findIndex((rule) => (
    rule.id === 'scki-fused-005-cnmedia'
      && rule.outboundTag === 'direct'
      && DOUYIN_CNMEDIA_DOMAINS.every((domain) => xrayDomainIncludes(rule, `domain:${domain}`))
  )) : -1;
  const v2AmapIndex = Array.isArray(v2rayn) ? v2rayn.findIndex((rule) => (
    rule.id === 'scki-fused-007-cn-site'
      && rule.outboundTag === 'direct'
      && PASSWALL_AMAP_REQUIRED.every((domain) => xrayDomainIncludes(rule, domain))
  )) : -1;
  const v2ScholarGoogle = Array.isArray(v2rayn) && v2rayn.some((rule) => (
    rule.id === 'scki-fused-022-google' && rule.outboundTag === 'proxy' && xrayDomainIncludes(rule, 'domain:scholar.google.com')
  ));
  const v2CnGameIndex = Array.isArray(v2rayn) ? v2rayn.findIndex((rule) => rule.id === 'scki-fused-060-game-cn') : -1;
  const v2IntlGameIndex = Array.isArray(v2rayn) ? v2rayn.findIndex((rule) => rule.id === 'scki-fused-061-game-intl') : -1;
  const v2CnGame = v2CnGameIndex === -1 ? null : v2rayn[v2CnGameIndex];
  record.check('v2rayn.douyin-web-direct-guard', v2DouyinIndex !== -1, failureMessage(v2DouyinIndex !== -1, 'scki-fused-005-cnmedia must direct all Douyin Web guard domains'));
  record.check('v2rayn.douyin-web-before-ads', v2DouyinIndex !== -1 && v2AdsIndex !== -1 && v2DouyinIndex < v2AdsIndex, {
    value: { douyin: v2DouyinIndex, ads: v2AdsIndex },
  });
  record.check('v2rayn.amap-direct-guard', v2AmapIndex !== -1, failureMessage(v2AmapIndex !== -1, 'scki-fused-007-cn-site must direct all GaoDe/AMap fallback domains'));
  record.check('v2rayn.amap-after-ads', v2AmapIndex !== -1 && v2AdsIndex !== -1 && v2AdsIndex < v2AmapIndex, {
    value: { amap: v2AmapIndex, ads: v2AdsIndex },
  });
  record.check('v2rayn.cn-game-before-intl-game', v2CnGameIndex !== -1 && v2IntlGameIndex !== -1 && v2CnGameIndex < v2IntlGameIndex, {
    value: { cnGame: v2CnGameIndex, intlGame: v2IntlGameIndex },
  });
  for (const domain of PASSWALL_CN_GAME_REQUIRED) {
    record.check(
      `v2rayn.cn-game.${domain}`,
      v2CnGame && xrayDomainIncludes(v2CnGame, domain),
      failureMessage(v2CnGame && xrayDomainIncludes(v2CnGame, domain), `scki-fused-060-game-cn missing ${domain}`),
    );
  }
  record.check('v2rayn.scholar-target-google', v2ScholarGoogle, failureMessage(v2ScholarGoogle, 'scki-fused-022-google must include domain:scholar.google.com'));
  record.check('v2rayn.cloudflarestorage-before-ads', v2CloudflareR2Index !== -1 && v2AdsIndex !== -1 && v2CloudflareR2Index < v2AdsIndex, {
    value: { cloudflarestorage: v2CloudflareR2Index, ads: v2AdsIndex },
  });
}

function validateEgern(record, baselineVersion, options) {
  const file = 'Egern/Egern.yaml';
  const source = readText(file);
  const rulesStart = source.search(/\r?\nrules:\r?\n/);
  const rulesSource = rulesStart === -1 ? '' : source.slice(rulesStart);
  const smartCount = countMatches(source, /^\s+- smart:\s*$/gm);
  const autoTestCount = countMatches(source, /^\s+- auto_test:\s*$/gm);
  const selectCount = countMatches(source, /^\s+- select:\s*$/gm);
  const ruleSetCount = countMatches(rulesSource, /^  - rule_set:\s*$/gm);
  const ruleCount = countMatches(rulesSource, /^  - [a-z_]+:\s*$/gm);

  record.check('egern.version-prefix', source.includes(`Egern Smart ${baselineVersion}-egern.`), {
    message: `missing Egern Smart ${baselineVersion}-egern.*`,
  });
  record.check('egern.baseline-header', source.includes(`Baseline: Clash Party ${baselineVersion}`), {
    message: `missing Clash Party ${baselineVersion}`,
  });
  record.check('egern.not-preview', !/Preview/i.test(source), {
    message: 'Egern is a formal generated artifact, not a Preview profile',
  });
  record.check('egern.generated-from-cmfa', source.includes('Generated from Clash Meta For Android/CMFA(mihomo).yaml.'), {
    message: 'missing CMFA generation marker',
  });
  record.check('egern.rule-parity-header', source.includes(`Rule parity: generated from CMFA ${MIN_FULL_PROVIDERS} rule-providers and ${MIN_FULL_RULES} rules.`), {
    message: 'missing formal CMFA parity header',
  });
  record.check('egern.external-subscription', /^\s+- external:\s*$/m.test(source) && source.includes('name: Subscribe'));
  record.check('egern.region-smart-count', smartCount === EXPECTED_REGION_GROUPS, { value: smartCount });
  record.check('egern.no-region-auto-test', autoTestCount === 0, { value: autoTestCount });
  record.check('egern.business-select-count', selectCount === EXPECTED_BUSINESS_GROUPS + 1, { value: selectCount });
  for (const group of SINGBOX_BUSINESS_ORDER) {
    const hasGroup = source.includes(`name: ${group}`);
    record.check(`egern.business-group.${group}`, hasGroup, failureMessage(hasGroup, `missing ${group}`));
  }
  record.check('egern.no-mrs-url', !source.includes('.mrs'), {
    message: 'Egern official rule_set docs do not document Mihomo .mrs consumption',
  });
  record.check('egern.no-process-rulesets', !/local-process-direct|work-process/.test(source), {
    message: 'Egern must not include Clash-style process rule set files',
  });
  const generatedEgernDirectory = relPath('rulesets/generated/egern');
  const generatedEgernFiles = fs.readdirSync(generatedEgernDirectory).filter((entry) => entry.endsWith('.yaml'));
  const egernGenerationManifestFile = 'rulesets/generated/egern/manifest.json';
  let egernGenerationManifest;
  try {
    egernGenerationManifest = readJson(egernGenerationManifestFile);
  } catch (error) {
    record.check('egern.generation-manifest.readable', false, { message: error.message });
  }
  if (egernGenerationManifest) {
    const generationValidation = validateEgernGenerationManifest({
      manifest: egernGenerationManifest,
      cmfaSource: readText('Clash Meta For Android/CMFA(mihomo).yaml'),
      routingGraphSource: readText(SOURCE_GRAPH_FILE),
      profileSource: source,
      generatedRuleSetDirectory: generatedEgernDirectory,
      expectedSourceProviderCount: MIN_FULL_PROVIDERS,
      expectedSourceRuleCount: MIN_FULL_RULES,
      expectedAssetRevision: getMihomoNormalizedRoutingGraph().version,
    });
    for (const failure of generationValidation.failures) {
      record.check(`egern.generation-manifest.${failure.id}`, false, {
        message: failure.message,
        value: failure.value,
      });
    }
    record.check('egern.generation-manifest.valid', generationValidation.failures.length === 0, {
      value: {
        rules: ruleCount,
        rule_set_refs: ruleSetCount,
        generated_assets: generatedEgernFiles.length,
      },
    });
  }
  for (const fusedId of [
    'provider-scki-fused-002-intl-site-domain',
    'provider-scki-fused-005-cnmedia-domain',
    'provider-scki-fused-006-ad-domain',
    'provider-scki-fused-007-cn-site-domain',
    'provider-scki-fused-053-google-domain',
    'provider-scki-fused-039-tiktok-domain',
    'provider-scki-fused-060-game-cn-domain',
    'provider-scki-fused-061-game-intl-domain',
    'provider-scki-fused-062-intl-site-domain',
  ]) {
    const fusedFiles = generatedEgernFiles
      .filter((file) => file === `${fusedId}.yaml` || new RegExp(`^${fusedId}-part-\\d+\\.yaml$`).test(file))
      .sort();
    record.check(`egern.generated-fused.${fusedId}`, fusedFiles.length > 0 && fusedFiles.every((file) => source.includes(`/rulesets/generated/egern/${file}`)), {
      message: `missing generated Egern fused mapping ${fusedId}`,
    });
  }
  const { internationalGeoSegment } = getDomesticAuthorityFusedPriority(readJson('rulesets/generated/fused/manifest.json'));
  const egernGeoipResidualFile = internationalGeoSegment
    && internationalGeoSegment.files
    && internationalGeoSegment.files.residual
    && `rulesets/generated/egern/provider-${internationalGeoSegment.id}-residual.yaml`;
  const egernGeoipResidual = egernGeoipResidualFile ? readText(egernGeoipResidualFile) : '';
  record.check('egern.geoip-native', egernGeoipResidual.includes('geoip_set:') && !/Skipped unsupported source rule types:.*GEOIP/.test(egernGeoipResidual), {
    value: egernGeoipResidualFile,
    message: 'Egern generic international GEOIP residual must preserve country GEOIP through geoip_set',
  });
  for (const fileName of fs.readdirSync(relPath('rulesets/generated/egern')).filter((entry) => entry.endsWith('.yaml'))) {
    const egernFile = `rulesets/generated/egern/${fileName}`;
    const egernSource = readText(egernFile);
    record.check(`egern.generated-file.${fileName}`, /_set:\s*(?:\[\])?$/m.test(egernSource), {
      message: `${egernFile} must contain Egern YAML set fields`,
    });
    record.check(`egern.generated-file-no-process.${fileName}`, !/^PROCESS-NAME,/m.test(egernSource), {
      message: `${egernFile} must not contain active process rules`,
    });
  }

  const rubyPath = findRuby();
  if (!rubyPath) {
    const message = 'Ruby not found; exact Egern YAML parsing skipped';
    if (options.strictRuby) record.check('egern.ruby-available', false, { message });
    else record.warn('egern.ruby-available', message);
  } else {
    try {
      rubyYamlFileProbe(file, rubyPath);
      for (const fileName of fs.readdirSync(relPath('rulesets/generated/egern')).filter((entry) => entry.endsWith('.yaml'))) {
        rubyYamlFileProbe(`rulesets/generated/egern/${fileName}`, rubyPath);
      }
      record.check('egern.ruby-parse', true);
    } catch (error) {
      record.check('egern.ruby-parse', false, { message: error.message });
    }
  }
}

function validatePasswall(record, baselineVersion) {
  const manifest = readJson('rulesets/generated/fused/manifest.json');
  const passwallSegments = (manifest.segments || []).filter((segment) => segment.files && segment.files.sing_box);
  const expectedListNames = passwallSegments.map((segment) => `${segment.id}.list`).sort();
  const passwallGeneratedLists = listFiles('rulesets/generated/fused/passwall').filter((file) => file.endsWith('.list')).map((file) => path.basename(file)).sort();
  record.check('passwall.generated-fused-list-count', passwallGeneratedLists.length === EXPECTED_FUSED_PASSWALL_FILES, { value: passwallGeneratedLists.length });
  record.check('passwall.generated-fused-list-names', JSON.stringify(passwallGeneratedLists) === JSON.stringify(expectedListNames), {
    value: { expected: expectedListNames, actual: passwallGeneratedLists },
  });

  const specs = [
    { id: 'passwall', file: 'Passwall/Passwall(xray+sing-box)-apply.sh', reference: 'Passwall/Passwall(xray+sing-box).conf', dir: 'Passwall/shunt-rules' },
    { id: 'passwall2', file: 'Passwall2/Passwall2(xray+sing-box)-apply.sh', reference: 'Passwall2/Passwall2(xray+sing-box).conf', dir: 'Passwall2/shunt-rules' },
  ];

  for (const spec of specs) {
    const source = readText(spec.file);
    const reference = readText(spec.reference);
    const shuntFiles = listFiles(spec.dir).filter((file) => file.endsWith('.list'));
    const activeRuleText = [source, reference, ...shuntFiles.map((file) => readText(file))].join('\n');
    const ruleAdds = countMatches(source, /^add_fused_shunt_rule /gm);
    const hasBaselineHeader = source.includes(baselineVersion);
    record.check(`${spec.id}.baseline-header`, hasBaselineHeader, failureMessage(hasBaselineHeader, `missing ${baselineVersion}`));
    record.check(`${spec.id}.script-rule-count`, ruleAdds === EXPECTED_PASSWALL_RULES, { value: ruleAdds });
    record.check(`${spec.id}.list-file-count`, shuntFiles.length === EXPECTED_PASSWALL_RULES, { value: shuntFiles.length });
    record.check(`${spec.id}.list-file-names`, JSON.stringify(shuntFiles.map((file) => path.basename(file)).sort()) === JSON.stringify(expectedListNames), {
      value: shuntFiles.map((file) => path.basename(file)).sort(),
    });
    record.check(`${spec.id}.generated-marker`, source.includes('node tools/generate-fused-fallback-artifacts.js'), {
      message: 'Passwall fallback artifacts must be generated, not hand-maintained',
    });
    record.check(`${spec.id}.apply-script-replace-mode`, source.includes('MODE="${1:---replace}"') && source.includes('cleanup_existing_scki_rules'), {
      message: 'apply script must default to --replace and delete existing Smart-Config-Kit shunt rules before recreating them',
    });
    if (!reference.includes(baselineVersion)) {
      record.warn(`${spec.id}.reference-conf.baseline`, `${spec.reference} does not advertise ${baselineVersion}; apply script plus shunt-rules are authoritative`);
    }

    for (const segment of passwallSegments) {
      const url = fusedSrsUrl(segment.id, manifest.asset_revision);
      record.check(`${spec.id}.script-fused-url.${segment.id}`, source.includes(`add_fused_shunt_rule '${segment.id} | ${segment.policy}' '${url}'`), {
        message: `missing ${segment.id} in apply script`,
      });
      record.check(`${spec.id}.reference-fused-url.${segment.id}`, reference.includes(`rule-set:remote:${url}`), {
        message: `missing ${segment.id} in reference conf`,
      });
      const listFile = path.join(spec.dir, `${segment.id}.list`);
      const lines = meaningfulRuleLines(listFile);
      record.check(`${spec.id}.list-fused-url.${segment.id}`, lines.length === 1 && lines[0] === `rule-set:remote:${url}`, {
        message: `${listFile} must contain exactly one native Passwall rule-set:remote entry`,
        value: lines,
      });
    }

    const cnmediaJson = fusedSingBoxText('scki-fused-005-cnmedia');
    const cnSiteJson = fusedSingBoxText('scki-fused-007-cn-site');
    const googleJson = fusedSingBoxText('scki-fused-022-google');
    const cnGameJson = fusedSingBoxText('scki-fused-060-game-cn');
    const intlGameJson = fusedSingBoxText('scki-fused-061-game-intl');
    const imJson = `${fusedSingBoxText('scki-fused-019-im')}\n${fusedSingBoxText('scki-fused-032-im')}`;

    record.check(`${spec.id}.cloudflarestorage-fused-source`, fusedSingBoxText('scki-fused-002-intl-site').includes('cloudflarestorage.com'));
    record.check(`${spec.id}.scholar-target-google`, singBoxSourceCoversDomain('scki-fused-022-google', 'scholar.google.com'), {
      message: 'Google fused source must semantically cover scholar.google.com',
    });
    record.check(
      `${spec.id}.douyin-web-domain-fallbacks`,
      DOUYIN_CNMEDIA_DOMAINS.every((domain) => cnmediaJson.includes(domain)),
      { message: 'CN media fused source must include explicit Douyin Web / zjcdn.com domain fallbacks' },
    );
    record.check(
      `${spec.id}.amap-domain-fallbacks`,
      PASSWALL_AMAP_REQUIRED.every((domain) => cnSiteJson.includes(domain.replace(/^domain:/, ''))),
      { message: 'CN site fused source must include explicit GaoDe / AMap domain fallbacks' },
    );
    checkNeedleBefore(
      record,
      `${spec.id}.cloudflarestorage-script-before-ads`,
      source,
      "add_fused_shunt_rule 'scki-fused-002-intl-site",
      "add_fused_shunt_rule 'scki-fused-006-ad",
    );
    checkNeedleBefore(
      record,
      `${spec.id}.cnmedia-script-before-tiktok`,
      source,
      "add_fused_shunt_rule 'scki-fused-005-cnmedia",
      "add_fused_shunt_rule 'scki-fused-039-tiktok",
    );
    checkNeedleBefore(
      record,
      `${spec.id}.cn-game-script-before-intl-game`,
      source,
      "add_fused_shunt_rule 'scki-fused-060-game-cn",
      "add_fused_shunt_rule 'scki-fused-061-game-intl",
    );
    for (const domain of PASSWALL_CN_GAME_REQUIRED) {
      const normalized = domain.replace(/^domain:/, '');
      record.check(
        `${spec.id}.cn-game-fused-source.${normalized}`,
        cnGameJson.includes(normalized),
        failureMessage(cnGameJson.includes(normalized), `scki-fused-060-game-cn missing ${normalized}`),
      );
    }
    record.check(`${spec.id}.cn-game-mihoyo-before-intl-game`, cnGameJson.includes('"mihoyo.com"') && source.indexOf("add_fused_shunt_rule 'scki-fused-060-game-cn") < source.indexOf("add_fused_shunt_rule 'scki-fused-061-game-intl"), {
      message: 'domain:mihoyo.com must be protected by an earlier CN game fused segment even if later broad game providers also contain it',
    });
    record.check(`${spec.id}.no-legacy-kakaotalk-geosite`, !activeRuleText.includes('geosite:kakaotalk'), {
      message: 'geosite:kakaotalk is not a valid v2fly/domain-list-community category; use geosite:kakao plus domain fallbacks',
    });
    record.check(
      `${spec.id}.kakao-domain-fallbacks`,
      imJson.includes('kakao.com') && imJson.includes('kakaocorp.com') && imJson.includes('kakaotalk.com'),
      { message: 'KakaoTalk fused source must include explicit kakao.com/kakaocorp.com/kakaotalk.com fallbacks' },
    );
    for (const file of shuntFiles) {
      const badLine = readText(file).split(/\r?\n/).find((line) => !/^\s*#/.test(line) && /^(DOMAIN|DOMAIN-SUFFIX|DOMAIN-KEYWORD|IP-CIDR|IP-CIDR6|RULE-SET),/.test(line));
      record.check(`${spec.id}.${path.basename(file)}.passwall-syntax`, !badLine, { message: badLine ? `Clash-style prefix: ${badLine}` : undefined });
    }
  }

  const passwallLists = listFiles('Passwall/shunt-rules').filter((file) => file.endsWith('.list')).map((file) => path.basename(file)).sort();
  const passwall2Lists = listFiles('Passwall2/shunt-rules').filter((file) => file.endsWith('.list')).map((file) => path.basename(file)).sort();
  record.check('passwall2.same-list-names-as-passwall', JSON.stringify(passwall2Lists) === JSON.stringify(passwallLists), {
    value: { passwall: passwallLists, passwall2: passwall2Lists },
  });
  for (const fileName of passwallLists) {
    const pwRules = meaningfulRuleLines(path.join('Passwall/shunt-rules', fileName));
    const pw2Rules = meaningfulRuleLines(path.join('Passwall2/shunt-rules', fileName));
    record.check(`passwall2.${fileName}.same-rules-as-passwall`, JSON.stringify(pw2Rules) === JSON.stringify(pwRules), {
      message: `${fileName} differs between Passwall and Passwall2`,
    });
  }
}

function extractMihomoFusedRules(relativePath) {
  const source = readText(relativePath);
  const match = source.match(/const\s+MIHOMO_FUSED_RULES\s*=\s*(\[[^\r\n]*\])/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

function validateDomesticAuthorityPriorityAcrossArtifacts(record) {
  const graph = getRawRoutingGraph();
  const cnSourceIndex = graph.rules.indexOf(DOMESTIC_AUTHORITY_ANCHOR_RULE);
  const genericFallbackIndexes = GENERIC_INTL_FALLBACK_RULES.map((rule) => graph.rules.indexOf(rule));
  record.check(
    'domestic-authority.source.cn-before-generic-cdn-geo-fallbacks',
    cnSourceIndex !== -1 && genericFallbackIndexes.every((index) => index > cnSourceIndex),
    {
      value: { cnSourceIndex, genericFallbackIndexes },
      message: `${DOMESTIC_AUTHORITY_ANCHOR_RULE} must precede every shared edge, CDN, geolocation and GeoIP fallback`,
    },
  );
  const regionalFallbackIndexes = graph.rules
    .map((rule, index) => ({ rule, index }))
    .filter(({ rule }) => /^RULE-SET,acc-geo-(?:d|ip)-(?!asia-china,)[^,]+,🌐 国外网站/.test(rule))
    .map(({ index }) => index);
  record.check(
    'domestic-authority.source.cn-before-regional-fallbacks',
    regionalFallbackIndexes.length === 32 && regionalFallbackIndexes.every((index) => index > cnSourceIndex),
    {
      value: { cnSourceIndex, regionalFallbackIndexes },
      message: 'all non-China regional domain/IP fallbacks must follow domestic authority',
    },
  );

  const manifest = readJson('rulesets/generated/fused/manifest.json');
  const { segments, cnSegment, internationalGeoSegment } = getDomesticAuthorityFusedPriority(manifest);
  const cnSegmentIndex = segments.indexOf(cnSegment);
  const internationalGeoSegmentIndex = segments.indexOf(internationalGeoSegment);
  record.check('domestic-authority.fused.cn-domain-coverage', Boolean(cnSegment), {
    value: cnSegment && cnSegment.id,
    message: 'one domestic fused segment must cover the .cn authority suffix',
  });
  record.check('domestic-authority.fused.generic-international-fallback', Boolean(internationalGeoSegment), {
    value: internationalGeoSegment && internationalGeoSegment.id,
    message: 'one generic international fused segment must contain shared edge domains and GEOIP fallback',
  });
  checkDomesticAuthorityPriorityOrder(
    record,
    'fused',
    cnSegmentIndex,
    internationalGeoSegmentIndex,
    cnSegment ? cnSegment.id : 'missing domestic segment',
    internationalGeoSegment ? internationalGeoSegment.id : 'missing generic international segment',
  );

  const cnId = cnSegment && cnSegment.id;
  const internationalGeoId = internationalGeoSegment && internationalGeoSegment.id;
  const cnMihomoRule = cnId ? `RULE-SET,${cnId}-domain,🏠 国内网站` : '';
  const internationalGeoMihomoRule = internationalGeoId ? `RULE-SET,${internationalGeoId}-residual,🌐 国外网站` : '';
  for (const spec of [
    { id: 'clash-party-smart', file: 'Clash Party/ClashParty(mihomo-smart).js' },
    { id: 'clash-party-normal', file: 'Clash Party/ClashParty(mihomo).js' },
    { id: 'flclash', file: 'FlClash/FlClash(mihomo).js' },
  ]) {
    const rules = extractMihomoFusedRules(spec.file);
    checkDomesticAuthorityPriorityOrder(record, spec.id, rules.indexOf(cnMihomoRule), rules.indexOf(internationalGeoMihomoRule), cnMihomoRule, internationalGeoMihomoRule);
  }

  const mihomoProducts = [
    { id: 'cmfa', source: readText('Clash Meta For Android/CMFA(mihomo).yaml') },
    { id: 'stash', source: readText('Stash/Stash.yaml') },
    { id: 'openclash-normal', source: extractOpenClashOverride('OpenClash/OpenClash(mihomo).sh') },
    { id: 'openclash-smart', source: extractOpenClashOverride('OpenClash/OpenClash(mihomo-smart).sh') },
  ];
  for (const product of mihomoProducts) {
    const rules = extractYamlBlock(product.source, 'rules');
    checkDomesticAuthorityPriorityOrder(record, product.id, rules.indexOf(cnMihomoRule), rules.indexOf(internationalGeoMihomoRule), cnMihomoRule, internationalGeoMihomoRule);
  }

  const cnMobileNeedle = cnId ? `${cnId}.list` : '';
  const internationalGeoMobileNeedle = internationalGeoId ? `${internationalGeoId}.list` : '';
  for (const spec of [
    { id: 'shadowrocket', file: 'Shadowrocket/Shadowrocket.conf', section: 'Rule' },
    { id: 'surge', file: 'Surge/Surge.conf', section: 'Rule' },
    { id: 'loon', file: 'Loon/Loon.conf', section: 'Remote Rule' },
    { id: 'quantumult-x', file: 'Quantumult X/QuantumultX.conf', section: 'filter_remote' },
  ]) {
    const section = extractConfSection(readText(spec.file), spec.section);
    checkDomesticAuthorityPriorityOrder(record, spec.id, section.indexOf(cnMobileNeedle), section.indexOf(internationalGeoMobileNeedle), cnMobileNeedle, internationalGeoMobileNeedle);
  }

  const egernRules = extractYamlBlock(readText('Egern/Egern.yaml'), 'rules');
  const cnEgernNeedle = cnId ? `provider-${cnId}-domain.yaml` : '';
  const internationalGeoEgernNeedle = internationalGeoId ? `provider-${internationalGeoId}-residual.yaml` : '';
  checkDomesticAuthorityPriorityOrder(record, 'egern', egernRules.indexOf(cnEgernNeedle), egernRules.indexOf(internationalGeoEgernNeedle), cnEgernNeedle, internationalGeoEgernNeedle);

  const singBox = readJson('SingBox/SingBox(sing-box)-full.json');
  const singBoxRules = singBox.route && Array.isArray(singBox.route.rules) ? singBox.route.rules : [];
  const singBoxRuleIndex = (segmentId) => segmentId ? singBoxRules.findIndex((rule) => {
    const ruleSets = Array.isArray(rule.rule_set) ? rule.rule_set : [rule.rule_set];
    return ruleSets.includes(segmentId);
  }) : -1;
  checkDomesticAuthorityPriorityOrder(record, 'sing-box', singBoxRuleIndex(cnId), singBoxRuleIndex(internationalGeoId), cnId, internationalGeoId);

  const xrayRules = readJson('v2rayN/v2rayN(xray).json');
  const xrayRuleIndex = (segmentId) => segmentId ? (Array.isArray(xrayRules) ? xrayRules : []).findIndex((rule) => rule.id === segmentId) : -1;
  checkDomesticAuthorityPriorityOrder(record, 'v2rayn-xray', xrayRuleIndex(cnId), xrayRuleIndex(internationalGeoId), cnId, internationalGeoId);

  for (const spec of [
    { id: 'passwall', file: 'Passwall/Passwall(xray+sing-box)-apply.sh' },
    { id: 'passwall2', file: 'Passwall2/Passwall2(xray+sing-box)-apply.sh' },
  ]) {
    const source = readText(spec.file);
    const cnNeedle = cnId ? `add_fused_shunt_rule '${cnId} | 🏠 国内网站'` : '';
    const internationalGeoNeedle = internationalGeoId ? `add_fused_shunt_rule '${internationalGeoId} | 🌐 国外网站'` : '';
    checkDomesticAuthorityPriorityOrder(record, spec.id, source.indexOf(cnNeedle), source.indexOf(internationalGeoNeedle), cnNeedle, internationalGeoNeedle);
  }
}

function validateSubscriptionAdapterProfileContract(record) {
  try {
    const errors = validateProfileContract(readProfileContract(REPO_ROOT));
    record.check('subscription-adapter-profiles.schema', errors.length === 0, {
      message: errors.join('; '),
    });
  } catch (error) {
    record.check('subscription-adapter-profiles.schema', false, {
      message: error && error.message ? error.message : String(error),
    });
  }
}

function validateClientCapabilityMatrixContract(record) {
  try {
    const matrix = readClientCapabilityMatrix(REPO_ROOT);
    const validation = validateClientCapabilityMatrix(matrix, REPO_ROOT);
    record.check('client-capability-matrix.schema-and-evidence', validation.ok, {
      message: formatCapabilityMatrixIssues(validation.issues),
    });
    if (!validation.ok) return;

    const expected = renderClientCapabilityMatrix(matrix);
    const current = readText('docs/client-capability-matrix.md');
    record.check('client-capability-matrix.generated-doc-current', current === expected, {
      message: 'docs/client-capability-matrix.md is stale; run node tools/generate-client-capability-matrix.js',
    });
  } catch (error) {
    record.check('client-capability-matrix.schema-and-evidence', false, {
      message: error && error.message ? error.message : String(error),
    });
  }
}

function buildManifest(baselineVersion) {
  return {
    generatedAt: new Date().toISOString(),
    baselineVersion,
    expectations: {
      groups: EXPECTED_GROUPS,
      businessGroups: EXPECTED_BUSINESS_GROUPS,
      singBoxSelectorUrltestGroups: EXPECTED_SINGBOX_GROUPS,
      passwallShuntRules: EXPECTED_PASSWALL_RULES,
    },
    artifacts: ARTIFACT_FILES.map((file) => {
      const stat = fs.statSync(relPath(file));
      return {
        path: file,
        bytes: stat.size,
        sha256: sha256(file),
      };
    }),
  };
}

function printHuman(result) {
  const ok = result.failures.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'} artifact contracts baseline=${result.manifest.baselineVersion}`);
  for (const check of result.checks) {
    if (!check.ok) console.log(`  - ${check.id}${check.message ? `: ${check.message}` : ''}`);
  }
  for (const warning of result.warnings) console.log(`  ! ${warning}`);
  console.log(`checks=${result.checks.length} artifacts=${result.manifest.artifacts.length}`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const record = makeRecorder();
  const { baselineVersion } = validateJsProducts(record);
  validateMihomoMrsRuleSets(record);
  validateFusedRuleSets(record);
  validateClashYaml(record, baselineVersion, options);
  validateStashYaml(record, baselineVersion, options);
  validateOpenClash(record, baselineVersion, options);
  validateConfProducts(record, baselineVersion);
  validateRuntimeNodeNameProducts(record);
  validateJsonProducts(record, baselineVersion);
  validateEgern(record, baselineVersion, options);
  validatePasswall(record, baselineVersion);
  validateGeneratedAssetRevision(record);
  validateDomesticAuthorityPriorityAcrossArtifacts(record);
  validateSubscriptionAdapterProfileContract(record);
  validateClientCapabilityMatrixContract(record);
  const remoteAssetValidation = validateGeneratedRemoteAssetSizes();
  record.check('generated-remote-assets.size-limit', remoteAssetValidation.failures.length === 0, {
    value: { referenced_assets: remoteAssetValidation.references.size, max_bytes: MAX_JSDELIVR_ASSET_BYTES },
    message: remoteAssetValidation.failures.join('; '),
  });
  const manifest = buildManifest(baselineVersion);
  const result = {
    ok: record.failures.length === 0,
    checks: record.checks,
    failures: record.failures,
    warnings: record.warnings,
    manifest,
  };

  if (options.manifestPath) {
    const target = path.resolve(REPO_ROOT, options.manifestPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }

  if (options.json) console.log(JSON.stringify(result, null, 2));
  else printHuman(result);
  if (!result.ok) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
}
