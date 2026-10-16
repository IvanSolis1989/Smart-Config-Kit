#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const REPO_ROOT = path.resolve(__dirname, '..');
const RESTRICTED_SITE = '🚫 受限网站';
const { getTrafficOptions, getQuicRules } = require('../rulesets/source/routing-graph');
const TRAFFIC_OPTIONS = getTrafficOptions();
const EXPECTED_REGION_TEST_INTERVAL_SECONDS = TRAFFIC_OPTIONS.healthCheckProfile === 'power-save' ? 900 : 300;
const FUSED_MANIFEST = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'rulesets/generated/fused/manifest.json'), 'utf8'));
const EXPECTED_FUSED_PROVIDERS = FUSED_MANIFEST.fused_provider_count;
const EXPECTED_FUSED_RULES = FUSED_MANIFEST.fused_rule_count;
const subscriptionAdapterProfiles = require('./lib/subscription-adapter-profiles');
const SUBSCRIPTION_ADAPTER_PROFILE_CONTRACT = subscriptionAdapterProfiles.assertValidProfileContract(
  subscriptionAdapterProfiles.readProfileContract(REPO_ROOT),
);
const NODE_DNS_RUNTIME = [
  subscriptionAdapterProfiles.renderJavaScriptProfileRuntime(SUBSCRIPTION_ADAPTER_PROFILE_CONTRACT),
  fs.readFileSync(path.join(REPO_ROOT, 'tools/runtime/node-dns-hints.js'), 'utf8').trimEnd(),
].join('\n\n').trimEnd().replace(/\r?\n/g, '\n');
const NODE_DNS_BEGIN = '// >>> SCKI NODE DNS HINTS: BEGIN';
const NODE_DNS_END = '// <<< SCKI NODE DNS HINTS: END';

const TARGETS = [
  {
    id: 'smart',
    label: 'Clash Party Smart',
    file: path.join('Clash Party', 'ClashParty(mihomo-smart).js'),
    regionType: 'smart',
    preserveArrayRefs: false,
    requireTunExcludes: true,
  },
  {
    id: 'normal',
    label: 'Clash Party Normal',
    file: path.join('Clash Party', 'ClashParty(mihomo).js'),
    regionType: 'url-test',
    preserveArrayRefs: false,
    requireTunExcludes: true,
  },
  {
    id: 'flclash',
    label: 'FlClash',
    file: path.join('FlClash', 'FlClash(mihomo).js'),
    regionType: 'url-test',
    preserveArrayRefs: true,
    requireTunExcludes: false,
  },
];

const SMART_GROUPS = [
  '🌍 全球节点',
  '🏡 全球家宽',
  '🇭🇰 香港节点',
  '🏡 香港家宽',
  '🇹🇼 台湾节点',
  '🏡 台湾家宽',
  '🇸🇬 狮城节点',
  '🏡 狮城家宽',
  '🇯🇵 日韩节点',
  '🏡 日韩家宽',
  '🌏 亚太节点',
  '🏡 亚太家宽',
  '🇺🇸 美国节点',
  '🏡 美国家宽',
  '🇪🇺 欧洲节点',
  '🏡 欧洲家宽',
  '🌎 美洲节点',
  '🏡 美洲家宽',
  '🌍 非洲节点',
  '🏡 非洲家宽',
  '🌏 其他节点',
  '🏡 其他家宽',
];

const BIZ_GROUPS = [
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

const EXPECTED_GROUP_ORDER = [SMART_GROUPS[0], ...BIZ_GROUPS, ...SMART_GROUPS.slice(1)];
const DIRECT_POLICIES = new Set(['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS']);
const INFO_NODES = new Set(['剩余流量 10G', '官网 example.com', 'USE 100GB']);
const EXTRA_INFO_NODES = new Set(['距离下次重置 12 天', '套餐到期 2026-06-01', 'Panel Channel Author',
  // v5.4.20 #6 借鉴 Proxy-override：新增 junk 关键词回归（免费/试用/应急 + Sign/Login/Register/Help/FAQ）
  '免费节点 01', '试用 1 天', '应急入口', 'Sign Up Panel', 'Login Portal', 'Register Now', 'Help Center', 'FAQ']);
const COST_AND_LINE_QUALITY_CASES = [
  'JP 02 0.2x Saver Home x0.2',
  'HK IPLC 03 x3',
];
const WORK_PROVIDER_RULES = ['remotedesktop', 'acc-rustdesk', 'acc-parsec'];
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
const SCKI_SUPPLEMENTAL_RULES = {
  adfpIntlSite: 'RULE-SET,scki-adfp-intl-site,🌐 国外网站',
  cnmediaGuard: 'RULE-SET,scki-cnmedia-guard,📺 国内流媒体',
  localProcessDirect: 'RULE-SET,scki-local-process-direct,DIRECT',
  workProcess: 'RULE-SET,scki-work-process,🧑‍💼 会议协作',
  workGuard: 'RULE-SET,scki-work-guard,🧑‍💼 会议协作',
  cnsiteGuard: 'RULE-SET,scki-cnsite-guard,🏠 国内网站',
};
const CN_GAME_GUARD_RULES = [
  'DOMAIN-SUFFIX,mihoyo.com,🕹️ 国内游戏',
  'DOMAIN-SUFFIX,yuanshen.com,🕹️ 国内游戏',
  'DOMAIN,game.163.com,🕹️ 国内游戏',
];
const INTL_GAME_WIDE_RULES = [
  'GEOSITE,category-games,🎮 国外游戏',
  'RULE-SET,hoyoverse,🎮 国外游戏',
];

// 机场常见的“前缀 + 小写 ISO 两位码 + 连续编号”命名回归。
// 必须逐字保留用户报告的样本；HK/TW/JP/SG 同时归入亚太，US 同时归入美洲。
const LOWERCASE_NUMBERED_ISO_CASES = [
  { name: 'yun hk01', region: 'HK', primaryGroup: '🇭🇰 香港节点', aggregateGroup: '🌏 亚太节点' },
  { name: 'yun hk02', region: 'HK', primaryGroup: '🇭🇰 香港节点', aggregateGroup: '🌏 亚太节点' },
  { name: 'yun hk03', region: 'HK', primaryGroup: '🇭🇰 香港节点', aggregateGroup: '🌏 亚太节点' },
  { name: 'yun hk04', region: 'HK', primaryGroup: '🇭🇰 香港节点', aggregateGroup: '🌏 亚太节点' },
  { name: 'yun us01', region: 'US', primaryGroup: '🇺🇸 美国节点', aggregateGroup: '🌎 美洲节点' },
  { name: 'yun us02', region: 'US', primaryGroup: '🇺🇸 美国节点', aggregateGroup: '🌎 美洲节点' },
  { name: 'yun us03', region: 'US', primaryGroup: '🇺🇸 美国节点', aggregateGroup: '🌎 美洲节点' },
  { name: 'yun us04', region: 'US', primaryGroup: '🇺🇸 美国节点', aggregateGroup: '🌎 美洲节点' },
  { name: 'yun jp01', region: 'JP', primaryGroup: '🇯🇵 日韩节点', aggregateGroup: '🌏 亚太节点' },
  { name: 'yun sg01', region: 'SG', primaryGroup: '🇸🇬 狮城节点', aggregateGroup: '🌏 亚太节点' },
  { name: 'yun us05', region: 'US', primaryGroup: '🇺🇸 美国节点', aggregateGroup: '🌎 美洲节点' },
  { name: 'yun tw01', region: 'TW', primaryGroup: '🇹🇼 台湾节点', aggregateGroup: '🌏 亚太节点' },
];
// 不能因为修复小写国家码 + 编号，把普通英文中的孤立小写短词误作地区。
const LOWERCASE_UNNUMBERED_ISO_GUARDS = [
  ['plain hk label', 'OTHER'],
  ['plain us label', 'OTHER'],
  ['plain jp label', 'OTHER'],
  ['plain sg label', 'OTHER'],
  ['plain tw label', 'OTHER'],
  ['plain in label', 'OTHER'],
];

const CLASSIFICATION_CASES = [
  ...LOWERCASE_NUMBERED_ISO_CASES.map(({ name, region }) => [name, region]),
  ...LOWERCASE_UNNUMBERED_ISO_GUARDS,
  ['HKG 01 IEPL x1', 'HK'],
  ['深港 IEPL 02 x1', 'HK'],
  ['Signal 香港 IEPL x1', 'HK'],
  ['TWN 01 AnyRoute IEPL x2.5', 'TW'],
  ['SGP 01 Home x1', 'SG'],
  ['JPN 01 Tokyo Home x1', 'JP'],
  ['🇯🇵AWS日本01 | 电信移动联通推荐', 'JP'],
  ['🇯🇵AWS日本02 | 中国电信优化', 'JP'],
  ['🇺🇸AWS美国01 | China Telecom 推荐', 'US'],
  ['电信移动联通推荐', 'CN'],
  ['中国移动', 'CN'],
  ['KOR 01 Seoul Home x1', 'KR'],
  ['USA 01 Home IP x1', 'US'],
  ['CHN Beijing Home x1', 'CN'],
  ['DE Frankfurt Home x1', 'EU'],
  ['CA Toronto Residential x1', 'AM'],
  ['EG Cairo Home x1', 'AF'],
  ['Mystery Home IP x1', 'OTHER'],
];

const GROUP_MEMBER_CASES = [
  { group: '🇭🇰 香港节点', include: ['HKG 01 IEPL x1', 'HK 09 Standard x1', '深港 IEPL 02 x1'], exclude: ['TWN 01 AnyRoute IEPL x2.5', ...INFO_NODES] },
  { group: '🏡 香港家宽', include: ['HKG 01 IEPL x1', '深港 IEPL 02 x1'], exclude: ['HK 09 Standard x1', ...INFO_NODES] },
  { group: '🇹🇼 台湾节点', include: ['TWN 01 AnyRoute IEPL x2.5'], exclude: ['HKG 01 IEPL x1', ...INFO_NODES] },
  { group: '🇸🇬 狮城节点', include: ['SGP 01 Home x1'], exclude: ['JPN 01 Tokyo Home x1', ...INFO_NODES] },
  { group: '🇯🇵 日韩节点', include: ['JPN 01 Tokyo Home x1', 'KOR 01 Seoul Home x1', '🇯🇵AWS日本01 | 电信移动联通推荐', '🇯🇵AWS日本02 | 中国电信优化'], exclude: ['SGP 01 Home x1', ...INFO_NODES] },
  { group: '🌏 亚太节点', include: ['HKG 01 IEPL x1', '深港 IEPL 02 x1', 'TWN 01 AnyRoute IEPL x2.5', 'SGP 01 Home x1', 'JPN 01 Tokyo Home x1', 'KOR 01 Seoul Home x1', 'CHN Beijing Home x1', '🇯🇵AWS日本01 | 电信移动联通推荐', '🇯🇵AWS日本02 | 中国电信优化'], exclude: ['USA 01 Home IP x1', 'CA Toronto Residential x1', ...INFO_NODES] },
  { group: '🇺🇸 美国节点', include: ['USA 01 Home IP x1', 'US 09 Standard x1'], exclude: ['CA Toronto Residential x1', ...INFO_NODES] },
  { group: '🌎 美洲节点', include: ['USA 01 Home IP x1', 'US 09 Standard x1', 'CA Toronto Residential x1'], exclude: ['DE Frankfurt Home x1', ...INFO_NODES] },
  { group: '🇪🇺 欧洲节点', include: ['DE Frankfurt Home x1'], exclude: ['EG Cairo Home x1', ...INFO_NODES] },
  { group: '🌍 非洲节点', include: ['EG Cairo Home x1'], exclude: ['DE Frankfurt Home x1', ...INFO_NODES] },
  { group: '🌏 其他节点', include: ['Mystery Home IP x1'], exclude: ['HKG 01 IEPL x1', ...INFO_NODES] },
  { group: '🏡 其他家宽', include: ['Mystery Home IP x1'], exclude: ['HK 09 Standard x1', ...INFO_NODES] },
];

function usage() {
  return [
    'Usage: node tools/validate-js-overwrites.js [--target smart|normal|flclash] [--json] [--verbose]',
    '',
    'Runs the JS overwrite smoke contract against Clash Party Smart, Clash Party Normal, and FlClash.',
    'The harness has no third-party dependencies and executes each script through its real main(config) entrypoint.',
  ].join('\n');
}

function parseArgs(argv) {
  const options = { target: null, json: false, verbose: false };
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
    if (arg === '--target') {
      options.target = argv[i + 1];
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}\n${usage()}`);
  }
  if (options.target && !TARGETS.some((t) => t.id === options.target)) {
    throw new Error(`Unknown target: ${options.target}`);
  }
  return options;
}

function makeProxy(name, overrides = {}) {
  return {
    name,
    type: 'ss',
    server: '127.0.0.1',
    port: 443,
    cipher: '2022-blake3-aes-128-gcm',
    password: 'smoke-fixture',
    ...overrides,
  };
}

function makeFixtureConfig() {
  return {
    proxies: [
      makeProxy('HKG 01 IEPL x1'),
      makeProxy('HK 09 Standard x1'),
      makeProxy('深港 IEPL 02 x1'),
      makeProxy('TWN 01 AnyRoute IEPL x2.5'),
      makeProxy('SGP 01 Home x1'),
      makeProxy('JPN 01 Tokyo Home x1', { type: 'trojan', tls: true, 'client-fingerprint': 'safari' }),
      makeProxy('🇯🇵AWS日本01 | 电信移动联通推荐'),
      makeProxy('🇯🇵AWS日本02 | 中国电信优化'),
      makeProxy('KOR 01 Seoul Home x1'),
      makeProxy('USA 01 Home IP x1', { type: 'trojan', tls: true }),
      makeProxy('US 09 Standard x1'),
      makeProxy('DE Frankfurt Home x1'),
      makeProxy('CA Toronto Residential x1'),
      makeProxy('EG Cairo Home x1'),
      makeProxy('Mystery Home IP x1'),
      makeProxy('CHN Beijing Home x1'),
      ...LOWERCASE_NUMBERED_ISO_CASES.map(({ name }) => makeProxy(name)),
      makeProxy('剩余流量 10G'),
      makeProxy('官网 example.com'),
      makeProxy('USE 100GB'),
      makeProxy('距离下次重置 12 天'),
      makeProxy('套餐到期 2026-06-01'),
      makeProxy('Panel Channel Author'),
      makeProxy('JP 02 0.2x Saver Home x0.2'),
      makeProxy('HK IPLC 03 x3'),
      // v5.4.20 #6 junk 关键词回归——以下应被 isInfoNode 过滤（排除出 classified ALL）
      makeProxy('免费节点 01'),
      makeProxy('试用 1 天'),
      makeProxy('应急入口'),
      makeProxy('Sign Up Panel'),
      makeProxy('Login Portal'),
      makeProxy('Register Now'),
      makeProxy('Help Center'),
      makeProxy('FAQ'),
      // v5.4.20 #6 合法名守卫——"Signal" 含 "Sign" 但有词边界保护，必须保留并分类到 HK
      makeProxy('Signal 香港 IEPL x1'),
    ],
    'proxy-groups': [
      { name: '机场自动选择', type: 'url-test', proxies: ['HKG 01 IEPL x1'] },
      { name: 'Netflix', type: 'select', proxies: ['机场自动选择'] },
    ],
    rules: ['DOMAIN-SUFFIX,legacy.example,机场自动选择', 'MATCH,机场自动选择'],
    'rule-providers': {
      legacy_provider: {
        type: 'http',
        behavior: 'domain',
        url: 'https://example.invalid/legacy.yaml',
        path: './ruleset/legacy.yaml',
      },
    },
    dns: {
      // A source rule-mode list must not become a blacklist: even ordinary-looking
      // domain entries have different semantics after the overwrite changes mode.
      'fake-ip-filter-mode': 'rule',
      'fake-ip-filter': [
        '+.lan',
        '+.local',
        'geosite:cn',
        'rule-set:cn domain',
        'rule-set:legacy-provider',
        'RULE-SET,legacy-provider,real-ip',
        '  +.fixture.local  ',
      ],
      // Regression fixture for Issue #183: Clash Party v2.0.3 inspects these
      // raw-profile DNS fields before the JS override runs. The script must
      // still replace them with the repository-owned DNS baseline afterward.
      'proxy-server-nameserver': ['https://source-resolver.fixture.test/dns-query'],
      'proxy-server-nameserver-policy': {
        'node.fixture.test': ['https://source-resolver.fixture.test/dns-query'],
      },
      'nameserver-policy': {
        '+.source.fixture.test': ['https://source-resolver.fixture.test/dns-query'],
      },
    },
    tun: { 'exclude-process': [] },
  };
}

function makeNodeDnsHintFixture() {
  const config = makeFixtureConfig();
  config.proxies[0].server = 'hk.edge.private.test';
  config.proxies[1].server = 'us.edge.private.test';
  config.proxies[2].server = '198.51.100.8';
  config.proxies[3].server = 'fallback.node.test';
  config.proxies[4].server = 'region.global.private.test';
  const ignoredInfoNode = config.proxies.find((proxy) => proxy.name === '剩余流量 10G');
  if (ignoredInfoNode) ignoredInfoNode.server = 'ignored.edge.private.test';
  config.dns = {
    'proxy-server-nameserver': [
      'https://resolver.private.test/dns-query',
      'https://dns.google/dns-query',
      '[2001:db8::54]',
      'system',
      'https://blocked.private.test/dns-query#DIRECT',
      'https://unsafe.private.test/dns-query?skip-cert-verify=true',
    ],
    'proxy-server-nameserver-policy': {
      'hk.edge.private.test': ['https://policy.private.test/dns-query'],
      '+.edge.private.test': ['tls://198.51.100.53'],
      '*.edge.private.test': ['tls://198.51.100.54'],
      'unrelated.private.test': ['https://unrelated.private.test/dns-query'],
      'geosite:cn': ['https://should-not-appear.private.test/dns-query'],
    },
    'nameserver-policy': {
      '+.global.private.test': ['https://global.private.test/dns-query'],
      '*.edge.private.test': ['https://wildcard.private.test/dns-query'],
      'rule-set:private': ['https://should-not-appear.private.test/dns-query'],
    },
  };
  config.hosts = {
    'hk.edge.private.test': ['198.51.100.11'],
    '+.edge.private.test': ['198.51.100.10'],
    '*.edge.private.test': 'alias.private.test',
    'resolver.private.test': ['198.51.100.53', '2001:db8::53', '::ffff:192.0.2.53'],
    'dns.google': ['203.0.113.11'],
    'unrelated.private.test': ['203.0.113.12'],
    'malformed.private.test': { malformed: true },
  };
  return config;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadOverwrite(target, profileOverride = null) {
  const filename = path.join(REPO_ROOT, target.file);
  const source = fs.readFileSync(filename, 'utf8');
  let executableSource = source;
  if (profileOverride !== null) {
    const profileDeclaration = /^const SCKI_SUBSCRIPTION_ADAPTER_PROFILE = '(?:off|policy|adaptive)'$/m;
    if (!profileDeclaration.test(source)) {
      throw new Error(`${target.file}: missing trusted subscription adapter profile declaration`);
    }
    executableSource = source.replace(
      profileDeclaration,
      `const SCKI_SUBSCRIPTION_ADAPTER_PROFILE = '${profileOverride}'`,
    );
  }
  const logs = [];
  const sandbox = {
    console: {
      log: (...args) => logs.push(args.map(String).join(' ')),
      warn: (...args) => logs.push(args.map(String).join(' ')),
      error: (...args) => logs.push(args.map(String).join(' ')),
    },
  };
  vm.createContext(sandbox);
  const trailer = '\n;globalThis.__smokeExports = { main, classifyNode, classifyAllNodes, VERSION, SckiSubscriptionAdapter };';
  vm.runInContext(executableSource + trailer, sandbox, { filename: target.file, timeout: 15000 });
  return { exports: sandbox.__smokeExports, logs, source };
}

function extractEmbeddedNodeDnsRuntime(source) {
  const begin = source.indexOf(NODE_DNS_BEGIN);
  const end = source.indexOf(NODE_DNS_END, begin);
  if (begin === -1 || end === -1) return null;
  const bodyStart = source.indexOf('\n', begin);
  if (bodyStart === -1) return null;
  return source.slice(bodyStart + 1, end).trimEnd().replace(/\r?\n/g, '\n');
}

function makeRecorder(target) {
  const failures = [];
  return {
    failures,
    expect(condition, message) {
      if (!condition) failures.push(`${target.label}: ${message}`);
    },
    expectEqual(actual, expected, message) {
      if (actual !== expected) failures.push(`${target.label}: ${message}; expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    expectArrayEqual(actual, expected, message) {
      const same = actual.length === expected.length && actual.every((item, idx) => item === expected[idx]);
      if (!same) {
        failures.push(`${target.label}: ${message}; expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
  };
}

function uniqueValues(values) {
  return Array.from(new Set(values));
}

function groupByName(config) {
  const groups = config['proxy-groups'] || [];
  return new Map(groups.map((group) => [group.name, group]));
}

function proxyByName(config) {
  const proxies = config.proxies || [];
  return new Map(proxies.map((proxy) => [proxy.name, proxy]));
}

function extractRuleSetNames(rule) {
  return Array.from(String(rule).matchAll(/RULE-SET,([^,\)]+)/g), (match) => match[1]);
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

function extractRuleTarget(rule) {
  const parts = splitTopLevel(rule);
  if (parts[0] === 'AND' || parts[0] === 'OR') return parts[2] || null;
  if (parts[0] === 'MATCH') return parts[1] || null;
  if (parts[0] === 'RULE-SET') return parts[2] || null;
  if (parts.length >= 3) return parts[2] || null;
  return null;
}

function fusedRuleIndexes(rules, suffix, policy) {
  const matcher = new RegExp(`^scki-fused-\\d+-${suffix}$`);
  return rules.reduce((indexes, rule, index) => {
    const parts = splitTopLevel(rule);
    if (parts[0] === 'RULE-SET' && matcher.test(parts[1]) && parts[2] === policy) indexes.push(index);
    return indexes;
  }, []);
}

function firstFusedRuleIndex(rules, suffix, policy) {
  return fusedRuleIndexes(rules, suffix, policy)[0] ?? -1;
}

function lastFusedRuleIndex(rules, suffix, policy) {
  const indexes = fusedRuleIndexes(rules, suffix, policy);
  return indexes.length > 0 ? indexes[indexes.length - 1] : -1;
}

function firstExistingRuleIndex(rules, candidates) {
  const indexes = candidates
    .map((rule) => rules.indexOf(rule))
    .filter((index) => index !== -1);
  return indexes.length === 0 ? -1 : Math.min(...indexes);
}

function validateClassification(target, api, fixture, record) {
  record.expect(typeof api.classifyNode === 'function', 'classifyNode is exported by the VM harness');
  record.expect(typeof api.classifyAllNodes === 'function', 'classifyAllNodes is exported by the VM harness');
  if (record.failures.length > 0) return;

  for (const [name, expectedRegion] of CLASSIFICATION_CASES) {
    record.expectEqual(api.classifyNode(name), expectedRegion, `classifies ${name}`);
  }

  const classified = api.classifyAllNodes(fixture.proxies);
  const all = new Set(classified.ALL || []);
  for (const proxy of fixture.proxies) {
    if (INFO_NODES.has(proxy.name) || EXTRA_INFO_NODES.has(proxy.name)) {
      record.expect(!all.has(proxy.name), `info node ${proxy.name} is excluded from classified ALL`);
    } else {
      record.expect(all.has(proxy.name), `traffic node ${proxy.name} is present in classified ALL`);
    }
  }
  for (const name of COST_AND_LINE_QUALITY_CASES) {
    record.expect(all.has(name), `cost or line-quality tag stays as a usable traffic node: ${name}`);
  }
  record.expect((classified.HOME_ALL || []).includes('HKG 01 IEPL x1'), 'IEPL nodes are treated as home-quality nodes');
  record.expect((classified.HOME_ALL || []).includes('HK IPLC 03 x3'), 'IPLC nodes are treated as home-quality nodes');
  record.expect((classified.HOME_ALL || []).includes('JP 02 0.2x Saver Home x0.2'), 'low-multiplier home nodes are treated as home-quality nodes');
  record.expect(!(classified.HOME_ALL || []).includes('HK 09 Standard x1'), 'standard nodes do not leak into home groups');
  record.expect((classified.HK || []).includes('深港 IEPL 02 x1'), 'HK classifier covers the bare 港 suffix case');
  record.expect((classified.HK || []).includes('HK IPLC 03 x3'), 'HK classifier keeps high-multiplier IPLC nodes in the HK bucket');
  record.expect((classified.TW || []).includes('TWN 01 AnyRoute IEPL x2.5'), 'alpha-3 TWN reaches Taiwan bucket');
  record.expect((classified.SG || []).includes('SGP 01 Home x1'), 'alpha-3 SGP reaches Singapore bucket');
  record.expect((classified.JP || []).includes('JPN 01 Tokyo Home x1'), 'alpha-3 JPN reaches Japan bucket');
  record.expect((classified.JP || []).includes('JP 02 0.2x Saver Home x0.2'), 'low-multiplier JP node reaches Japan bucket');
  record.expect((classified.KR || []).includes('KOR 01 Seoul Home x1'), 'alpha-3 KOR reaches Korea bucket');
  for (const sample of LOWERCASE_NUMBERED_ISO_CASES) {
    record.expect((classified[sample.region] || []).includes(sample.name), 'numbered lowercase ISO node reaches ' + sample.region + ': ' + sample.name);
  }
}

function validateGroups(target, output, record) {
  const groups = output['proxy-groups'];
  const groupNames = groups.map((group) => group.name);
  const groupsByName = groupByName(output);
  const proxyNames = new Set(output.proxies.map((proxy) => proxy.name));

  record.expectEqual(groups.length, EXPECTED_GROUP_ORDER.length, 'emits exactly the expected JS overwrite group count');
  record.expectEqual(uniqueValues(groupNames).length, groupNames.length, 'does not emit duplicate proxy-group names');
  record.expectArrayEqual(groupNames, EXPECTED_GROUP_ORDER, 'keeps global, business, then region group order stable');

  for (const name of BIZ_GROUPS) {
    const group = groupsByName.get(name);
    record.expect(!!group, `business group exists: ${name}`);
    if (group) record.expectEqual(group.type, 'select', `business group is select: ${name}`);
  }
  for (const name of SMART_GROUPS) {
    const group = groupsByName.get(name);
    record.expect(!!group, `region group exists: ${name}`);
    if (group) record.expectEqual(group.type, target.regionType, `region group type is ${target.regionType}: ${name}`);
    if (group) {
      record.expectEqual(group.interval, EXPECTED_REGION_TEST_INTERVAL_SECONDS, `region group interval is ${EXPECTED_REGION_TEST_INTERVAL_SECONDS}s: ${name}`);
      record.expectEqual(group.lazy, true, `region group uses lazy health checks in ${TRAFFIC_OPTIONS.healthCheckProfile}: ${name}`);
    }
  }

  record.expect(!groupsByName.has('机场自动选择'), 'subscription-native proxy-groups are removed');
  record.expect(!groupsByName.has('Netflix'), 'subscription-native business-like groups are removed');

  for (const scenario of GROUP_MEMBER_CASES) {
    const group = groupsByName.get(scenario.group);
    record.expect(!!group, `group for member checks exists: ${scenario.group}`);
    if (!group) continue;
    const members = new Set(group.proxies || []);
    for (const name of scenario.include) {
      record.expect(members.has(name), `${scenario.group} includes ${name}`);
    }
    for (const name of scenario.exclude) {
      record.expect(!members.has(name), `${scenario.group} excludes ${name}`);
    }
  }

  for (const sample of LOWERCASE_NUMBERED_ISO_CASES) {
    for (const groupName of [sample.primaryGroup, sample.aggregateGroup]) {
      const group = groupsByName.get(groupName);
      record.expect(!!group, 'lowercase ISO target group exists: ' + groupName);
      if (group) record.expect((group.proxies || []).includes(sample.name), groupName + ' includes lowercase numbered ISO node ' + sample.name);
    }
  }

  for (const group of groups) {
    for (const member of group.proxies || []) {
      const known = groupsByName.has(member) || proxyNames.has(member) || DIRECT_POLICIES.has(member);
      record.expect(known, `group ${group.name} references existing member ${member}`);
    }
  }
}

function validateRulesAndProviders(output, record, target) {
  const rules = output.rules || [];
  const providers = output['rule-providers'] || {};
  const providerNames = new Set(Object.keys(providers));
  const groupNames = new Set((output['proxy-groups'] || []).map((group) => group.name));

  record.expectEqual(rules.length, EXPECTED_FUSED_RULES, `injects the fused ruleset`);
  record.expectEqual(providerNames.size, EXPECTED_FUSED_PROVIDERS, `injects the fused rule-provider set`);
  record.expect([...providerNames].every((name) => name.startsWith('scki-fused-')), 'final rule-providers are generated fused providers only');
  record.expectEqual(rules[rules.length - 1], 'MATCH,🐟 漏网之鱼', 'keeps MATCH as the final fallback');
  record.expect(!rules.slice(0, -1).some((rule) => String(rule).startsWith('MATCH,')), 'does not place MATCH before the final rule');
  record.expect(!rules.some((rule) => String(rule).includes('机场自动选择')), 'subscription-native rules are removed');
  record.expect(!providerNames.has('legacy_provider'), 'subscription-native rule-providers are removed');

  const fusedIntlPreAd = firstFusedRuleIndex(rules, 'intl-site-domain', '🌐 国外网站');
  const fusedCnMediaPreTikTok = firstFusedRuleIndex(rules, 'cnmedia-domain', '📺 国内流媒体');
  const fusedAd = firstFusedRuleIndex(rules, 'ad-domain', '🛑 广告拦截');
  const fusedEarlyCnSite = firstFusedRuleIndex(rules, 'cn-site-domain', '🏠 国内网站');
  const fusedAmap = rules.findIndex((rule, index) => index > fusedAd && String(rule).includes('-cn-site-domain,🏠 国内网站'));
  const fusedLocalProcess = firstFusedRuleIndex(rules, 'direct-residual', 'DIRECT');
  const fusedWorkProcess = firstFusedRuleIndex(rules, 'work-residual', '🧑‍💼 会议协作');
  const fusedScholar = firstFusedRuleIndex(rules, 'google-domain', '🔍 Google 服务');
  const fusedWork = lastFusedRuleIndex(rules, 'work-residual', '🧑‍💼 会议协作');
  const fusedTikTok = firstFusedRuleIndex(rules, 'tiktok-domain', '🎵 TikTok');
  const fusedGfw = firstFusedRuleIndex(rules, 'gfw-domain', '🚫 受限网站');
  const fusedCnGame = firstFusedRuleIndex(rules, 'game-cn-domain', '🕹️ 国内游戏');
  const fusedIntlGame = firstFusedRuleIndex(rules, 'game-intl-domain', '🎮 国外游戏');
  const fusedForeignTail = lastFusedRuleIndex(rules, 'intl-site-domain', '🌐 国外网站');

  for (const [suffix, policy] of [
    ['intl-site-domain', '🌐 国外网站'],
    ['cnmedia-domain', '📺 国内流媒体'],
    ['ad-domain', '🛑 广告拦截'],
    ['direct-residual', 'DIRECT'],
    ['work-residual', '🧑‍💼 会议协作'],
    ['google-domain', '🔍 Google 服务'],
    ['tiktok-domain', '🎵 TikTok'],
    ['gfw-domain', '🚫 受限网站'],
    ['game-cn-domain', '🕹️ 国内游戏'],
    ['game-intl-domain', '🎮 国外游戏'],
  ]) {
    record.expect(firstFusedRuleIndex(rules, suffix, policy) !== -1, `fused semantic segment exists: ${suffix}`);
  }

  record.expect(fusedIntlPreAd !== -1 && fusedAd !== -1 && fusedIntlPreAd < fusedAd, 'Cloudflare R2 allowlist fused segment stays before ad/phishing reject rules');
  record.expect(fusedEarlyCnSite !== -1 && fusedEarlyCnSite < fusedAd, 'early domestic-site guard stays before ad/phishing rules');
  record.expect(fusedAmap !== -1 && fusedAd !== -1 && fusedAd < fusedAmap, 'AMap fused guard stays after ad/phishing rules');
  record.expect(fusedAmap !== -1 && fusedForeignTail !== -1 && fusedAmap < fusedForeignTail, 'AMap fused guard stays before foreign-site tail');
  record.expect(fusedCnMediaPreTikTok !== -1 && fusedTikTok !== -1 && fusedCnMediaPreTikTok < fusedTikTok, 'Douyin Web fused guard stays before TikTok');
  record.expect(fusedCnMediaPreTikTok !== -1 && fusedForeignTail !== -1 && fusedCnMediaPreTikTok < fusedForeignTail, 'Douyin Web fused guard stays before foreign-site tail');
  record.expect(fusedLocalProcess !== -1, 'local client process rules are fused into DIRECT residual segment');
  record.expect(fusedWorkProcess !== -1, 'RustDesk process rules are fused into work residual segment');
  record.expect(fusedWork !== -1, 'remote-work providers are fused into work collaboration segment');
  record.expect(fusedScholar !== -1, 'Google Scholar is fused into Google service segment');
  record.expect(fusedGfw !== -1, 'GFW tail is fused into restricted-site segment');
  record.expect(fusedCnGame !== -1 && fusedIntlGame !== -1 && fusedCnGame < fusedIntlGame, 'CN game fused segment stays before wide international game segment');

  record.expect(!rules.some((rule) => /^RULE-SET,(scholar|tiktok|amap|proxy|scki-(?!fused)[^,]+|remotedesktop|acc-rustdesk|acc-parsec),/.test(String(rule))), 'legacy individual rule-set names are not emitted in the main rule list');
  record.expect(!rules.some((rule) => /^DOMAIN(-SUFFIX|-KEYWORD)?[,]/.test(String(rule))), 'foldable domain rules are not emitted inline');
  record.expect(!rules.some((rule) => /^IP-CIDR6?[,]/.test(String(rule))), 'foldable IP-CIDR rules are not emitted inline');
  record.expect(!rules.some((rule) => /^PROCESS-NAME[,]/.test(String(rule))), 'process rules are not emitted inline');

  for (const [providerName, provider] of Object.entries(providers)) {
    if (provider && provider.type === 'http') {
      record.expectEqual(provider.proxy, RESTRICTED_SITE, `http rule-provider ${providerName} downloads through restricted-site proxy`);
    }
  }

  for (const rule of rules) {
    for (const providerName of extractRuleSetNames(rule)) {
      record.expect(providerNames.has(providerName), `rule references existing provider ${providerName}`);
    }
    const targetPolicy = extractRuleTarget(rule);
    if (!targetPolicy || targetPolicy === 'no-resolve') continue;
    const knownTarget = groupNames.has(targetPolicy) || DIRECT_POLICIES.has(targetPolicy);
    record.expect(knownTarget, `rule target exists for ${rule}`);
  }

  for (const port of STUN_DIRECT_PORTS) {
    record.expect(rules.includes(`DST-PORT,${port},DIRECT`), `STUN/TURN port stays on DIRECT: ${port}`);
  }
  record.expect(!rules.includes('DST-PORT,443,DIRECT'), 'UDP/443 TURN is not globally exempted from QUIC blocking');
  // QUIC policy is sourced from the routing graph; both modes have exact rule contracts.
  const quicAndRules = rules.filter(function(r) { return String(r).startsWith('AND,((DST-PORT,443),(NETWORK,UDP),'); });
  const expectedQuicRules = getQuicRules(TRAFFIC_OPTIONS.quicPolicy);
  record.expectArrayEqual(quicAndRules, expectedQuicRules, `QUIC ${TRAFFIC_OPTIONS.quicPolicy} emits exactly the selected UDP/443 rules`);
  const quicAnchor = rules.indexOf('DST-PORT,7680,REJECT');
  record.expect(quicAnchor !== -1, 'QUIC policy insertion anchor remains present');
  if (expectedQuicRules.length) {
    record.expectArrayEqual(rules.slice(quicAnchor - expectedQuicRules.length, quicAnchor), expectedQuicRules, 'QUIC rules retain their priority before the application port guard');
    record.expect(fusedAd !== -1 && fusedAd < quicAnchor - expectedQuicRules.length, 'ad and threat guards stay before dedicated QUIC rules');
  } else {
    record.expect(!rules.some(function(r) { return /(?:DST|DEST)-PORT,443/.test(String(r)) && /NETWORK,UDP/.test(String(r)); }), 'follow-rules has no dedicated UDP/443 override');
  }
  const fusedRustDeskGuard = firstFusedRuleIndex(rules, 'work-domain', '🧑‍💼 会议协作');
  const githubApiProcessIndexes = [
    'AND,((PROCESS-NAME,Code Helper),(DOMAIN,api.github.com)),🤖 AI 服务',
    'AND,((PROCESS-NAME,Code Helper (Plugin)),(DOMAIN,api.github.com)),🤖 AI 服务',
  ].map((rule) => rules.indexOf(rule));
  record.expect(githubApiProcessIndexes.every((index) => index !== -1), 'GitHub API process-scoped AI rules remain explicit');
  const githubApiProcessEnd = Math.max(...githubApiProcessIndexes);
  const fusedCopilot = rules.findIndex((rule, index) => (
    index > githubApiProcessEnd && splitTopLevel(rule)[0] === 'RULE-SET'
    && /-ai-domain$/.test(splitTopLevel(rule)[1]) && splitTopLevel(rule)[2] === '🤖 AI 服务'
  ));
  record.expect(fusedRustDeskGuard !== -1 && fusedCopilot !== -1 && fusedRustDeskGuard < fusedCopilot, 'RustDesk domain guard fused segment stays before broad Copilot ASN rules');
  const fusedCopilotTencent = fusedAmap;
  record.expect(fusedCopilotTencent !== -1 && fusedCopilot !== -1 && fusedCopilotTencent < fusedCopilot, 'copilot.tencent.com domestic fused guard stays before AI provider segments');

  if (target.requireTunExcludes) {
    const excludes = output.tun && output.tun['exclude-process'];
    record.expect(Array.isArray(excludes), 'TUN exclude-process list exists');
    if (Array.isArray(excludes)) {
      for (const proc of ['GSCService.exe', 'GCUService.exe']) {
        record.expect(excludes.includes(proc), `TUN exclude-process contains ${proc}`);
      }
      record.expect(!excludes.includes('WorkPro.exe'), 'WorkPro.exe enters TUN and uses the fused PROCESS-NAME DIRECT rule');
      record.expect(!excludes.includes('WorkProWebProcess.exe'), 'WorkProWebProcess.exe enters TUN and uses the fused PROCESS-NAME DIRECT rule');
    }
  }
}

function validateGeneral(output, record) {
  record.expect(output.dns && typeof output.dns === 'object', 'DNS object exists after overwrite');
  record.expectEqual(output.dns.enable, true, 'DNS is explicitly enabled');
  record.expectEqual(output.dns.listen, '0.0.0.0:1053', 'DNS listener is explicit for UI overwrite clients');
  record.expectEqual(output.dns['enhanced-mode'], 'fake-ip', 'DNS enhanced-mode defaults to fake-ip');
  record.expectEqual(output.dns['fake-ip-range'], '198.18.0.1/16', 'DNS fake-ip range is explicit');
  record.expectEqual(output.dns['fake-ip-filter-mode'], 'blacklist', 'DNS fake-ip filter stays in blacklist mode');
  record.expectEqual(output.dns['prefer-h3'], false, 'DNS prefer-h3 stays disabled when respect-rules is enabled');
  record.expectEqual(output.dns['respect-rules'], true, 'DNS resolver connections respect route rules');
  record.expectEqual(output.dns['use-system-hosts'], false, 'DNS does not inherit system hosts');
  record.expectEqual(output.dns['cache-algorithm'], 'arc', 'DNS cache uses ARC');
  record.expect(Array.isArray(output.dns.nameserver) && output.dns.nameserver.length > 0, 'DNS nameserver fallback is nonempty');
  const fakeIpFilter = Array.isArray(output.dns['fake-ip-filter']) ? output.dns['fake-ip-filter'] : [];
  record.expect(fakeIpFilter.includes('+.rustdesk.com'), 'RustDesk domains receive real IP in fake-ip-filter');
  record.expect(!fakeIpFilter.includes('geosite:cn'), 'source rule-mode geosite entry is not reinterpreted as a blacklist exemption');
  record.expect(!fakeIpFilter.includes('+.fixture.local'), 'source rule-mode domain is not reinterpreted as a blacklist exemption');
  record.expect(!fakeIpFilter.includes('rule-set:cn domain'), 'Issue #182 legacy rule-set entry is removed');
  record.expect(!fakeIpFilter.some((entry) => /^(?:rule-set:|RULE-SET,)/i.test(String(entry))), 'source rule-set references are not carried into the rebuilt provider graph');
  for (const entry of ['+.msftconnecttest.com', '+.msftncsi.com', '+.in-addr.arpa', '+.ip6.arpa']) {
    record.expect(Array.isArray(output.dns['fake-ip-filter']) && output.dns['fake-ip-filter'].includes(entry), `split DNS fake-ip bypass includes ${entry}`);
  }
  for (const entry of STUN_FAKE_IP_FILTER_ENTRIES) {
    record.expect(Array.isArray(output.dns['fake-ip-filter']) && output.dns['fake-ip-filter'].includes(entry), `STUN/TURN domain receives real IP in fake-ip-filter: ${entry}`);
  }
  record.expectArrayEqual(output.dns['default-nameserver'], ['https://223.5.5.5/dns-query', 'https://223.6.6.6/dns-query', 'https://8.8.8.8/dns-query', 'https://1.1.1.1/dns-query', '223.5.5.5'], 'v5.4.21 #4 DoH-over-IP bootstrap + 1 plaintext fallback');
  record.expectArrayEqual(output.dns.nameserver, ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'], 'primary nameserver is domestic DoH');
  record.expectArrayEqual(output.dns['direct-nameserver'], ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'], 'direct DNS is domestic DoH');
  record.expectArrayEqual(output.dns['proxy-server-nameserver'], ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query', 'https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'], 'proxy server DNS is foreign DoH first with domestic DoH backup');
  record.expect(!output.dns['proxy-server-nameserver-policy'], 'empty subscription does not create a proxy-server DNS policy');
  record.expectArrayEqual(output.dns.fallback, ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'], 'fallback DNS is foreign DoH');
  const nameserverPolicy = output.dns['nameserver-policy'] && typeof output.dns['nameserver-policy'] === 'object' ? output.dns['nameserver-policy'] : {};
  record.expect(Object.keys(nameserverPolicy).length > 0, 'DNS nameserver-policy exists');
  record.expectArrayEqual(nameserverPolicy['+.githubusercontent.com'] || [], ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'], 'GitHub asset DNS policy uses foreign DoH');
  record.expectArrayEqual(nameserverPolicy['geosite:cn'] || [], ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'], 'CN geosite DNS policy uses domestic DoH');
  record.expectArrayEqual(nameserverPolicy['geosite:geolocation-!cn'] || [], ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'], 'non-CN geosite DNS policy uses foreign DoH');
  const fallbackFilter = output.dns['fallback-filter'] && typeof output.dns['fallback-filter'] === 'object' ? output.dns['fallback-filter'] : {};
  record.expect(Object.keys(fallbackFilter).length > 0, 'DNS fallback-filter exists');
  record.expectArrayEqual(fallbackFilter.geosite || [], ['gfw', 'geolocation-!cn'], 'fallback-filter routes GFW/non-CN domains to fallback DNS');
  record.expect(output.profile && output.profile['store-selected'] === true, 'profile.store-selected is enabled');

  const proxies = proxyByName(output);
  const fpInjected = proxies.get('USA 01 Home IP x1');
  const fpPreserved = proxies.get('JPN 01 Tokyo Home x1');
  record.expect(fpInjected && !!fpInjected['client-fingerprint'], 'TLS proxy without fingerprint receives a deterministic client-fingerprint');
  record.expect(fpPreserved && fpPreserved['client-fingerprint'] === 'safari', 'existing client-fingerprint is preserved');
}

function validateClashPartyDnsGuardBoundary(target, logs, record) {
  const logText = logs.join('\n');
  if (target.id === 'smart' || target.id === 'normal') {
    record.expect(
      /Clash Party v2\.0\.3\+ DNS guard detected source fields=/.test(logText),
      'Clash Party v2.0.3+ raw-profile DNS guard boundary is reported without exposing DNS values',
    );
    for (const secretLikeValue of ['source-resolver.fixture.test', 'node.fixture.test']) {
      record.expect(!logText.includes(secretLikeValue), `Clash Party DNS guard diagnostic does not disclose ${secretLikeValue}`);
    }
  } else {
    record.expect(!/Clash Party v2\.0\.3\+ DNS guard detected/.test(logText), 'FlClash does not claim the Clash Party-only DNS guard');
  }
}

function validateFakeIpFilterInheritance(api, record) {
  const baselineFixture = makeFixtureConfig();
  delete baselineFixture.dns['fake-ip-filter-mode'];
  delete baselineFixture.dns['fake-ip-filter'];
  const baselineOutput = api.main(baselineFixture);
  const baseline = Array.from(baselineOutput.dns['fake-ip-filter'] || []);
  record.expect(baseline.includes('+.lan') && baseline.includes('+.rustdesk.com'), 'clean-source fake-ip filter retains repository real-IP exemptions');

  const inheritedEntries = ['+.inherit.fixture.test', 'custom.fixture.test', '*.wildcard.fixture.test', 'geosite:cn', '*'];
  const rejectedEntries = ['bad domain.fixture.test', 'rule-set:cn domain', 'rule-set:legacy-provider',
    'RULE-SET,legacy-provider,real-ip', 'GEOSITE,cn,real-ip', 'DOMAIN-SUFFIX,fixture.test,real-ip'];
  const cases = [
    { label: 'omitted', inherit: true },
    { label: 'blacklist', mode: 'blacklist', inherit: true },
    { label: 'normalized blacklist', mode: '  BlAcKlIsT  ', inherit: true },
    { label: 'whitelist', mode: 'whitelist', inherit: false },
    { label: 'normalized whitelist', mode: '  WhItElIsT  ', inherit: false },
    { label: 'rule', mode: 'rule', inherit: false },
    { label: 'normalized rule', mode: '  RuLe  ', inherit: false },
    { label: 'unknown', mode: 'future-mode', inherit: false },
    { label: 'empty', mode: '', inherit: false },
    { label: 'blank', mode: '   ', inherit: false },
    { label: 'null', mode: null, inherit: false },
    { label: 'number', mode: 1, inherit: false },
    { label: 'boolean', mode: false, inherit: false },
    { label: 'object', mode: { value: 'blacklist' }, inherit: false },
    { label: 'array', mode: ['blacklist'], inherit: false },
  ];

  for (const scenario of cases) {
    const fixture = makeFixtureConfig();
    delete fixture.dns['fake-ip-filter-mode'];
    if (Object.prototype.hasOwnProperty.call(scenario, 'mode')) fixture.dns['fake-ip-filter-mode'] = scenario.mode;
    fixture.dns['fake-ip-filter'] = [
      inheritedEntries[0], '  custom.fixture.test  ', ...inheritedEntries.slice(2),
      inheritedEntries[0], '+.lan', ...rejectedEntries, null, 42, {}, [],
    ];
    const output = api.main(fixture);
    record.expectEqual(output.dns['fake-ip-filter-mode'], 'blacklist', `${scenario.label}: emitted fake-ip mode is blacklist`);
    const filter = Array.isArray(output.dns['fake-ip-filter']) ? Array.from(output.dns['fake-ip-filter']) : [];
    record.expectArrayEqual(filter.filter((entry) => baseline.includes(entry)), baseline, `${scenario.label}: repository fake-ip exemptions remain intact`);
    record.expectEqual(new Set(filter).size, filter.length, `${scenario.label}: fake-ip exemptions contain no duplicates`);
    if (scenario.inherit) {
      for (const entry of inheritedEntries) record.expect(filter.includes(entry), `${scenario.label}: inherits compatible source entry ${entry}`);
    } else {
      record.expectArrayEqual(filter.filter((entry) => !baseline.includes(entry)), [], `${scenario.label}: incompatible source list contributes no blacklist exemptions`);
    }
    for (const entry of rejectedEntries) record.expect(!filter.includes(entry), `${scenario.label}: excludes incompatible source entry ${entry}`);
    record.expect(filter.every((entry) => typeof entry === 'string' && entry.length > 0 && entry.trim() === entry && !/\s/.test(entry)), `${scenario.label}: emitted fake-ip exemptions are nonempty trimmed strings without whitespace`);
    const secondOutput = api.main(output);
    record.expectEqual(secondOutput.dns['fake-ip-filter-mode'], 'blacklist', `${scenario.label}: repeated overwrite keeps blacklist mode`);
    record.expectArrayEqual(Array.from(secondOutput.dns['fake-ip-filter'] || []), filter, `${scenario.label}: repeated overwrite keeps the same fake-ip exemptions`);
  }
}

function validateNodeDnsHints(api, output, logs, record) {
  const nodePolicy = output.dns['proxy-server-nameserver-policy'] || {};
  const globalPolicy = output.dns['nameserver-policy'] || {};
  const hosts = output.hosts || {};
  record.expectArrayEqual(output.dns['proxy-server-nameserver'], [
    'https://cloudflare-dns.com/dns-query',
    'https://dns.google/dns-query',
    'https://dns.alidns.com/dns-query',
    'https://doh.pub/dns-query',
  ], 'subscription resolver hints never replace the fixed global proxy DNS baseline');
  record.expectArrayEqual(nodePolicy['hk.edge.private.test'] || [], ['https://policy.private.test/dns-query'], 'exact node policy overrides a wider source wildcard');
  record.expectArrayEqual(nodePolicy['us.edge.private.test'] || [], ['tls://198.51.100.54'], 'single-label wildcard outranks a broader + wildcard for an active node FQDN');
  record.expectArrayEqual(nodePolicy['fallback.node.test'] || [], ['https://resolver.private.test/dns-query', 'https://dns.google/dns-query', '2001:db8::54'], 'source proxy DNS becomes an exact policy only for the active fallback node');
  record.expectArrayEqual(nodePolicy['region.global.private.test'] || [], ['https://global.private.test/dns-query'], 'matching source global policy is materialized only for the active node FQDN');
  record.expectEqual(Object.keys(nodePolicy).length, 4, 'node DNS policy contains only active FQDNs');
  for (const blocked of ['unrelated.private.test', 'geosite:cn', 'rule-set:private', 'ignored.edge.private.test', '+.edge.private.test', '*.edge.private.test']) {
    record.expect(!Object.prototype.hasOwnProperty.call(nodePolicy, blocked), `node DNS policy excludes ${blocked}`);
  }
  for (const blocked of ['+.global.private.test', '*.edge.private.test', 'unrelated.private.test', 'rule-set:private']) {
    record.expect(!Object.prototype.hasOwnProperty.call(globalPolicy, blocked), `global DNS policy does not inherit ${blocked}`);
  }
  record.expectArrayEqual(globalPolicy['geosite:cn'] || [], ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'], 'source geosite policy cannot replace the repository global DNS baseline');
  record.expectArrayEqual(hosts['hk.edge.private.test'] || [], ['198.51.100.11'], 'exact node hosts record wins over a wildcard source record');
  record.expectEqual(hosts['us.edge.private.test'], 'alias.private.test', 'single-label hosts wildcard wins and preserves scalar domain redirection syntax');
  record.expectArrayEqual(hosts['resolver.private.test'] || [], ['198.51.100.53', '2001:db8::53', '::ffff:192.0.2.53'], 'private resolver IPv4, IPv6 and IPv4-mapped IPv6 bootstrap hosts are retained');
  record.expectArrayEqual(hosts['dns.google'] || [], ['8.8.8.8', '8.8.4.4'], 'repository bootstrap hosts override a subscription record for the same DNS host');
  record.expect(!Object.prototype.hasOwnProperty.call(hosts, 'unrelated.private.test'), 'unrelated subscription hosts are isolated');
  record.expect(!Object.prototype.hasOwnProperty.call(hosts, 'ignored.edge.private.test'), 'info-node host hints are ignored');
  const logText = logs.join('\n');
  record.expect(/Node-DNS profile=adaptive applied=true reason=applied domains=4 resolvers=6 policies=4 hosts=4 rejected=/.test(logText), 'node DNS adapter emits a count-only profile audit line');
  for (const secretLikeValue of ['resolver.private.test', 'policy.private.test', '198.51.100.53']) {
    record.expect(!logText.includes(secretLikeValue), `node DNS audit log does not disclose ${secretLikeValue}`);
  }

  const rerun = deepClone(output);
  const rerunOutput = api.main(rerun);
  record.expectEqual(JSON.stringify(rerunOutput), JSON.stringify(output), 'node DNS adapter is idempotent on an already-overwritten config');
}

function makeNodeDnsCapacityFixture() {
  const config = makeFixtureConfig();
  config.proxies = [];
  config.hosts = {
    'resolver.capacity.private.test': ['198.51.100.200'],
  };
  for (let index = 0; index < 70; index += 1) {
    const domain = `node-${index}.capacity.private.test`;
    config.proxies.push(makeProxy(`Capacity ${index}`, { server: domain }));
    config.hosts[domain] = [`198.51.100.${(index % 200) + 1}`];
  }
  for (let index = 0; index < 300; index += 1) {
    config.hosts[`unrelated-${index}.capacity.private.test`] = ['203.0.113.200'];
  }
  const latePolicy = {};
  for (let index = 0; index < 300; index += 1) {
    latePolicy[`unrelated-policy-${index}.capacity.private.test`] = ['https://late-policy.private.test/dns-query'];
  }
  latePolicy['NODE-0.CAPACITY.PRIVATE.TEST'] = ['https://late-policy.private.test/dns-query'];
  config.dns = {
    'proxy-server-nameserver': ['https://resolver.capacity.private.test/dns-query'],
    'proxy-server-nameserver-policy': latePolicy,
  };
  return config;
}

function validateNodeDnsCapacity(api, record) {
  const output = api.main(makeNodeDnsCapacityFixture());
  const policy = output.dns['proxy-server-nameserver-policy'] || {};
  const hosts = output.hosts || {};
  record.expectArrayEqual(hosts['resolver.capacity.private.test'] || [], ['198.51.100.200'], 'resolver bootstrap hosts are captured before node hosts when the host cap is reached');
  record.expectEqual(Object.keys(policy).length, 64, 'node DNS policy cap stays deterministic for oversized subscriptions');
  record.expectArrayEqual(policy['node-0.capacity.private.test'] || [], ['https://late-policy.private.test/dns-query'], 'late exact active-node policy survives unrelated source-map entries');
  record.expectArrayEqual(output.dns['proxy-server-nameserver'], [
    'https://cloudflare-dns.com/dns-query',
    'https://dns.google/dns-query',
    'https://dns.alidns.com/dns-query',
    'https://doh.pub/dns-query',
  ], 'oversized subscription DNS remains scoped to exact node policies rather than global proxy DNS');
}

function makeNodeDnsResolverCapacityFixture() {
  const config = makeFixtureConfig();
  config.proxies = [];
  config.hosts = {};
  const policy = {};
  for (let index = 0; index < 13; index += 1) {
    const node = `resolver-node-${index}.private.test`;
    const resolver = `resolver-${index}.private.test`;
    config.proxies.push(makeProxy(`Resolver ${index}`, { server: node }));
    policy[node] = [`https://${resolver}/dns-query`];
    config.hosts[resolver] = [`198.51.100.${index + 30}`];
  }
  config.dns = {
    'proxy-server-nameserver': ['https://resolver-baseline.private.test/dns-query'],
    'proxy-server-nameserver-policy': policy,
  };
  return config;
}

function validateNodeDnsResolverCapacity(api, record) {
  const output = api.main(makeNodeDnsResolverCapacityFixture());
  const policy = output.dns['proxy-server-nameserver-policy'] || {};
  const hosts = output.hosts || {};
  record.expectEqual(Object.keys(policy).length, 13, 'all accepted node policies survive beyond the legacy resolver cap');
  for (let index = 0; index < 13; index += 1) {
    const node = `resolver-node-${index}.private.test`;
    const resolver = `resolver-${index}.private.test`;
    record.expectArrayEqual(policy[node] || [], [`https://${resolver}/dns-query`], `resolver policy ${index} is retained atomically`);
    record.expectArrayEqual(hosts[resolver] || [], [`198.51.100.${index + 30}`], `resolver bootstrap host ${index} is retained with its policy`);
  }
}

function pickRepositoryDnsBaseline(output) {
  const dns = output.dns || {};
  return JSON.stringify({
    nameserver: dns.nameserver || [],
    directNameserver: dns['direct-nameserver'] || [],
    proxyServerNameserver: dns['proxy-server-nameserver'] || [],
    fallback: dns.fallback || [],
    nameserverPolicy: dns['nameserver-policy'] || {},
    fakeIpFilter: dns['fake-ip-filter'] || [],
  });
}

function pickRoutingTopology(output) {
  return JSON.stringify({
    proxies: output.proxies || [],
    groups: output['proxy-groups'] || [],
    rules: output.rules || [],
    providers: output['rule-providers'] || {},
  });
}

function validateNodeDnsProfiles(target, record) {
  const profiles = {};
  for (const profile of ['off', 'policy', 'adaptive']) {
    const { exports: api, logs } = loadOverwrite(target, profile);
    const output = api.main(makeNodeDnsHintFixture());
    profiles[profile] = { api, logs, output };
    record.expect(output && typeof output === 'object', `profile ${profile} returns a config object`);
  }

  const off = profiles.off.output;
  const policy = profiles.policy.output;
  const adaptive = profiles.adaptive.output;
  record.expectEqual(pickRoutingTopology(off), pickRoutingTopology(policy), 'off and policy profiles preserve identical proxy/routing topology');
  record.expectEqual(pickRoutingTopology(off), pickRoutingTopology(adaptive), 'off and adaptive profiles preserve identical proxy/routing topology');
  record.expectEqual(pickRepositoryDnsBaseline(off), pickRepositoryDnsBaseline(policy), 'off and policy profiles preserve the repository DNS baseline');
  record.expectEqual(pickRepositoryDnsBaseline(off), pickRepositoryDnsBaseline(adaptive), 'off and adaptive profiles preserve the repository DNS baseline');

  const offPolicy = off.dns['proxy-server-nameserver-policy'] || {};
  const policyOnly = policy.dns['proxy-server-nameserver-policy'] || {};
  const adaptivePolicy = adaptive.dns['proxy-server-nameserver-policy'] || {};
  record.expectEqual(Object.keys(offPolicy).length, 0, 'off profile imports no subscription node DNS policy');
  record.expect(!Object.prototype.hasOwnProperty.call(off.hosts || {}, 'hk.edge.private.test'), 'off profile imports no subscription node host hint');
  record.expectEqual(Object.keys(policyOnly).length, 3, 'policy profile materializes only matching explicit policies');
  record.expect(!Object.prototype.hasOwnProperty.call(policyOnly, 'fallback.node.test'), 'policy profile does not use source proxy DNS as a fallback policy');
  record.expectArrayEqual(policyOnly['hk.edge.private.test'] || [], ['https://policy.private.test/dns-query'], 'policy profile preserves exact matching node policy');
  record.expectArrayEqual(policyOnly['region.global.private.test'] || [], ['https://global.private.test/dns-query'], 'policy profile projects matching global policy only to an active node');
  record.expectEqual(Object.keys(adaptivePolicy).length, 4, 'adaptive profile adds only the active fallback-node policy');
  record.expectArrayEqual(adaptivePolicy['fallback.node.test'] || [], ['https://resolver.private.test/dns-query', 'https://dns.google/dns-query', '2001:db8::54'], 'adaptive profile retains the scoped proxy DNS fallback');
  record.expect(!Object.prototype.hasOwnProperty.call(adaptive.dns['nameserver-policy'] || {}, '+.global.private.test'), 'no profile imports source global DNS policy patterns');

  for (const profile of ['off', 'policy', 'adaptive']) {
    const logText = profiles[profile].logs.join('\n');
    record.expect(new RegExp(`Node-DNS profile=${profile} `).test(logText), `${profile} profile emits a redacted audit line`);
    for (const secretLikeValue of ['resolver.private.test', 'policy.private.test', '198.51.100.53']) {
      record.expect(!logText.includes(secretLikeValue), `${profile} profile audit log remains redacted`);
    }
  }

  const snapshot = profiles.adaptive.api.SckiSubscriptionAdapter.captureNodeDns(
    makeNodeDnsHintFixture(),
    ['hk.edge.private.test'],
    'adaptive',
  );
  const missingBaseline = { dns: {}, hosts: { 'repository.example': ['192.0.2.1'] } };
  const before = JSON.stringify(missingBaseline);
  const report = profiles.adaptive.api.SckiSubscriptionAdapter.applyNodeDns(missingBaseline, snapshot, 'adaptive');
  record.expectEqual(report.reason, 'missing-pss-baseline', 'adapter fails closed when the repository PSS baseline is missing');
  record.expectEqual(JSON.stringify(missingBaseline), before, 'missing repository PSS baseline causes zero mutation');

  const profileMismatchRepository = {
    dns: { 'proxy-server-nameserver': ['https://repository-baseline.example/dns-query'] },
    hosts: { 'repository.example': ['192.0.2.1'] },
  };
  const mismatchBefore = JSON.stringify(profileMismatchRepository);
  const mismatchReport = profiles.adaptive.api.SckiSubscriptionAdapter.applyNodeDns(profileMismatchRepository, snapshot, 'policy');
  record.expectEqual(mismatchReport.reason, 'profile-mismatch', 'adapter rejects an adaptive snapshot when the requested profile is policy');
  record.expectEqual(JSON.stringify(profileMismatchRepository), mismatchBefore, 'profile mismatch causes zero mutation');

  const escapedPolicySnapshotRepository = {
    dns: { 'proxy-server-nameserver': ['https://repository-baseline.example/dns-query'] },
    hosts: { 'repository.example': ['192.0.2.1'] },
  };
  const escapedPolicySnapshotBefore = JSON.stringify(escapedPolicySnapshotRepository);
  const escapedPolicySnapshotReport = profiles.adaptive.api.SckiSubscriptionAdapter.applyNodeDns(escapedPolicySnapshotRepository, {
    profile: 'adaptive',
    domains: ['allowed.private.test'],
    policy: { 'unrelated.private.test': ['https://resolver.private.test/dns-query'] },
    hosts: {},
    stats: {},
  }, 'adaptive');
  record.expectEqual(escapedPolicySnapshotReport.reason, 'invalid-snapshot', 'adapter rejects a hand-built snapshot whose policy FQDN is not an active node domain');
  record.expectEqual(JSON.stringify(escapedPolicySnapshotRepository), escapedPolicySnapshotBefore, 'out-of-bound policy snapshot causes zero mutation');

  const escapedHostSnapshotRepository = {
    dns: { 'proxy-server-nameserver': ['https://repository-baseline.example/dns-query'] },
    hosts: { 'repository.example': ['192.0.2.1'] },
  };
  const escapedHostSnapshotBefore = JSON.stringify(escapedHostSnapshotRepository);
  const escapedHostSnapshotReport = profiles.adaptive.api.SckiSubscriptionAdapter.applyNodeDns(escapedHostSnapshotRepository, {
    profile: 'adaptive',
    domains: ['allowed.private.test'],
    policy: { 'allowed.private.test': ['https://resolver.private.test/dns-query'] },
    hosts: { 'unrelated.private.test': ['192.0.2.2'] },
    stats: {},
  }, 'adaptive');
  record.expectEqual(escapedHostSnapshotReport.reason, 'invalid-snapshot', 'adapter rejects a hand-built snapshot whose host FQDN is outside the policy resolver closure');
  record.expectEqual(JSON.stringify(escapedHostSnapshotRepository), escapedHostSnapshotBefore, 'out-of-bound host snapshot causes zero mutation');

  const canonicalizedProfileSnapshot = profiles.adaptive.api.SckiSubscriptionAdapter.captureNodeDns(
    makeNodeDnsHintFixture(),
    ['hk.edge.private.test', 'us.edge.private.test', 'fallback.node.test', 'region.global.private.test'],
    { id: 'policy', nodeDnsProjection: 'adaptive' },
  );
  record.expectEqual(canonicalizedProfileSnapshot.profile, 'policy', 'adapter canonicalizes object profiles through the registered enum');
  record.expectEqual(Object.keys(canonicalizedProfileSnapshot.policy).length, 3, 'object profile projection cannot escalate policy into adaptive fallback');

  const pathCaseSnapshot = profiles.adaptive.api.SckiSubscriptionAdapter.captureNodeDns({
    dns: {
      'proxy-server-nameserver-policy': {
        'path-case.private.test': ['https://resolver.private.test/DNS'],
        'PATH-CASE.PRIVATE.TEST': ['https://resolver.private.test/dns'],
      },
    },
  }, ['path-case.private.test'], 'adaptive');
  record.expect(!Object.prototype.hasOwnProperty.call(pathCaseSnapshot.policy, 'path-case.private.test'), 'case-sensitive resolver paths conflict rather than silently deduplicating');
  record.expect(pathCaseSnapshot.stats.rejected > 0, 'case-sensitive resolver path conflict is recorded as a rejection');
}

function validateFlClashRefs(target, config, refs, record) {
  if (!target.preserveArrayRefs) return;
  record.expect(config['proxy-groups'] === refs.groups, 'FlClash preserves proxy-groups array identity for QuickJS/Dart bridge');
  record.expect(config.rules === refs.rules, 'FlClash preserves rules array identity for QuickJS/Dart bridge');
  record.expect(config['rule-providers'] === refs.providers, 'FlClash preserves rule-providers object identity for QuickJS/Dart bridge');
}

function validateFlClashGeneral(output, record) {
  record.expectEqual(output.ipv6, false, 'FlClash disables top-level IPv6 to match the DNS IPv6 policy');
}

function runTarget(target, options) {
  const record = makeRecorder(target);
  const { exports: api, logs, source } = loadOverwrite(target);
  const fixture = makeFixtureConfig();

  record.expect(api && typeof api.main === 'function', 'main(config) is exported by the VM harness');
  record.expect(extractEmbeddedNodeDnsRuntime(source) === NODE_DNS_RUNTIME, 'embedded Node-DNS hint Module matches its canonical runtime source');
  record.expect(source.includes(`const SCKI_SUBSCRIPTION_ADAPTER_PROFILE = '${SUBSCRIPTION_ADAPTER_PROFILE_CONTRACT.default}'`), 'adapter selects the profile-contract default locally');
  const fusedApplyCalls = (source.match(/^\s*applyMihomoFusedRuleSets\(config\)\s*$/gm) || []).length;
  record.expectEqual(fusedApplyCalls, 1, 'contains exactly one fused rule injection call');
  validateClassification(target, api, fixture, record);

  const config = deepClone(fixture);
  const refs = {
    groups: config['proxy-groups'],
    rules: config.rules,
    providers: config['rule-providers'],
  };

  let output = null;
  if (record.failures.length === 0) {
    output = api.main(config);
    record.expect(output === config, 'main(config) returns the same config object');
    validateFlClashRefs(target, config, refs, record);
    validateGroups(target, output, record);
    validateRulesAndProviders(output, record, target);
    validateGeneral(output, record);
    validateClashPartyDnsGuardBoundary(target, logs, record);
    validateFakeIpFilterInheritance(api, record);
    if (target.id === 'flclash') validateFlClashGeneral(output, record);

    const nodeDnsFixture = makeNodeDnsHintFixture();
    const nodeDnsOutput = api.main(nodeDnsFixture);
    record.expect(nodeDnsOutput === nodeDnsFixture, 'node DNS fixture returns the original config object');
    validateNodeDnsHints(api, nodeDnsOutput, logs, record);
    validateNodeDnsCapacity(api, record);
    validateNodeDnsResolverCapacity(api, record);
    validateNodeDnsProfiles(target, record);
  }

  const summary = output ? {
    id: target.id,
    label: target.label,
    version: api.VERSION,
    groups: (output['proxy-groups'] || []).length,
    rules: (output.rules || []).length,
    providers: Object.keys(output['rule-providers'] || {}).length,
    logs: logs.length,
  } : {
    id: target.id,
    label: target.label,
    version: api && api.VERSION,
    groups: 0,
    rules: 0,
    providers: 0,
    logs: logs.length,
  };

  if (options.verbose && !options.json) {
    for (const line of logs) console.log(`[${target.id}] ${line}`);
  }

  return { ok: record.failures.length === 0, summary, failures: record.failures };
}

function printHuman(results) {
  for (const result of results) {
    const s = result.summary;
    const status = result.ok ? 'PASS' : 'FAIL';
    console.log(`${status} ${s.label} ${s.version || ''} groups=${s.groups} rules=${s.rules} providers=${s.providers}`);
    for (const failure of result.failures) {
      console.log(`  - ${failure}`);
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const selected = options.target ? TARGETS.filter((target) => target.id === options.target) : TARGETS;
  const results = selected.map((target) => runTarget(target, options));
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printHuman(results);
  }
  if (results.some((result) => !result.ok)) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
}
