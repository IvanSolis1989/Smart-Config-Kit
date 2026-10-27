// AEROVE Lite / meow-rs 分流覆写候选（共享 Meow 分流实现）
// 版本：v6.0.20-meow.5 | Build：2026-10-27
// 架构：最多 22 个 url-test 区域组 + 33 业务组；融合 MRS / residual YAML
// 规则源：rulesets/source/routing-graph.js v6.0.20
// 生成：node tools/generate-meow.js；运行时输入：Mihomo内核系/FlClash/FlClash(mihomo).js
// 变更历史：Meow内核系/Aerove Lite/CHANGELOG.md；状态：docs/support-queue.md#aerove-lite-meow
// 只维护节点清洗、分组、rule-providers、rules；DNS / TUN / 端口 / 嗅探由 App 管理。
// 前提：已展开节点的订阅；远程 proxy-providers 请先用 SubStore 展平。
// 目标接口：main(config)，JSON 对象入出；无网络、文件系统或定时器依赖。
// 官方 Meow 客户端使用相邻 Meow 目录的原生 YAML；不假定官方 App 执行 JS。
// Lite 大资源按安全预算无损分片，同目标 RULE-SET 在原位置连续展开。
// 客户端联调和真实连接验收状态见支持队列。

const VERSION = 'v6.0.20-meow.5'

// 受信任的本地订阅适配模式：off | policy | adaptive。
// 不从机场订阅读取；三档均不会改变 55 组、规则或仓库 DNS 基线。
const SCKI_SUBSCRIPTION_ADAPTER_PROFILE = 'off'
// 仅本地可调；null 关闭倍率筛选，正数才按“倍率 > 阈值”剔除。
const SCKI_MAX_NODE_MULTIPLIER = null

// SCKI local traffic options. Sync restores health/QUIC presets and preserves the explicit local ZeroTier choice.
const SCKI_HEALTH_CHECK_PROFILE = 'standard'
const SCKI_QUIC_POLICY = 'block-foreign'
const SCKI_ZEROTIER_PLANET_PROXY = false

// >>> SCKI TRAFFIC OPTIONS: BEGIN — generated from tools/runtime/traffic-options.js, routing-graph.js and traffic-options.json.
// Browser and QuickJS safe. Synchronize rule data from routing-graph.js with tools/sync-traffic-options.js.
var SckiTrafficOptions = (function() {
  // >>> SCKI HEALTH CHECK: BEGIN
  var HEALTH_CHECK_PROFILES = {"standard":{"intervalSeconds":300,"lazy":true},"power-save":{"intervalSeconds":900,"lazy":true}};
  // <<< SCKI HEALTH CHECK: END
  // >>> SCKI QUIC RULES: BEGIN
  var BLOCK_FOREIGN_QUIC_RULES = ["AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,youtube)),📹 YouTube","AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,google)),🔍 Google 服务","AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,microsoft)),Ⓜ️ 微软服务","AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,apple)),🍎 苹果服务","AND,((DST-PORT,443),(NETWORK,UDP),(NOT,((GEOSITE,cn)))),REJECT"];
  // <<< SCKI QUIC RULES: END
  // >>> SCKI ZEROTIER PLANET: BEGIN
  var ZEROTIER_PLANET_PROXY_POLICY = {"targetGroup":"🇺🇸 美国节点","rules":["AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,103.195.103.66/32,no-resolve)),🇺🇸 美国节点","AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,79.127.159.187/32,no-resolve)),🇺🇸 美国节点","AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,84.17.53.155/32,no-resolve)),🇺🇸 美国节点","AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,185.152.67.145/32,no-resolve)),🇺🇸 美国节点"]};
  // <<< SCKI ZEROTIER PLANET: END

  function validate(options) {
    if (!options || Object.prototype.toString.call(options) !== '[object Object]' ||
        (options.healthCheckProfile !== 'standard' && options.healthCheckProfile !== 'power-save') ||
        (options.quicPolicy !== 'block-foreign' && options.quicPolicy !== 'follow-rules') ||
        (options.zeroTierPlanetProxy !== undefined && typeof options.zeroTierPlanetProxy !== 'boolean')) {
      throw new Error('Invalid SCKI traffic options');
    }
    return options;
  }

  function applyHealthCheckProfile(config, profile, platform) {
    if (profile !== 'standard' && profile !== 'power-save') throw new Error('Invalid SCKI health check profile');
    if (platform !== 'smart' && platform !== 'normal') throw new Error('Invalid SCKI health check platform');
    var type = platform === 'smart' ? 'smart' : 'url-test';
    var settings = HEALTH_CHECK_PROFILES[profile];
    var groups = config['proxy-groups'];
    for (var i = 0; i < groups.length; i++) {
      var group = groups[i];
      if (!group || group.type !== type) continue;
      group.interval = settings.intervalSeconds;
      group.lazy = settings.lazy;
    }
    return config;
  }

  function applyQuicPolicy(rules, mode) {
    if (mode !== 'block-foreign' && mode !== 'follow-rules') throw new Error('Invalid SCKI QUIC policy');
    if (!Array.isArray(rules)) throw new Error('SCKI rules must be an array');
    var anchor = rules.indexOf('DST-PORT,7680,REJECT');
    if (anchor < 0) throw new Error('Missing SCKI QUIC insertion anchor');
    for (var i = rules.length - 1; i >= 0; i--) {
      if (BLOCK_FOREIGN_QUIC_RULES.indexOf(rules[i]) >= 0) rules.splice(i, 1);
    }
    if (mode === 'block-foreign') {
      anchor = rules.indexOf('DST-PORT,7680,REJECT');
      for (var j = 0; j < BLOCK_FOREIGN_QUIC_RULES.length; j++) rules.splice(anchor + j, 0, BLOCK_FOREIGN_QUIC_RULES[j]);
    }
    return rules;
  }

  function requireZeroTierPlanetProxyTarget(enabled, groupNames) {
    if (typeof enabled !== 'boolean') throw new Error('Invalid SCKI ZeroTier planet proxy option');
    if (enabled && (!Array.isArray(groupNames) || groupNames.indexOf(ZEROTIER_PLANET_PROXY_POLICY.targetGroup) < 0)) {
      throw new Error('SCKI ZeroTier planet proxy requires existing ' + ZEROTIER_PLANET_PROXY_POLICY.targetGroup);
    }
  }

  function applyZeroTierPlanetProxy(rules, enabled, groupNames) {
    requireZeroTierPlanetProxyTarget(enabled, groupNames);
    if (!Array.isArray(rules)) throw new Error('SCKI rules must be an array');
    var ownedRules = ZEROTIER_PLANET_PROXY_POLICY.rules;
    for (var i = rules.length - 1; i >= 0; i--) {
      if (ownedRules.indexOf(rules[i]) >= 0) rules.splice(i, 1);
    }
    if (enabled) {
      for (var j = ownedRules.length - 1; j >= 0; j--) rules.unshift(ownedRules[j]);
    }
    return rules;
  }

  return { validate: validate, applyHealthCheckProfile: applyHealthCheckProfile, applyQuicPolicy: applyQuicPolicy, requireZeroTierPlanetProxyTarget: requireZeroTierPlanetProxyTarget, applyZeroTierPlanetProxy: applyZeroTierPlanetProxy };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SckiTrafficOptions;
// <<< SCKI TRAFFIC OPTIONS: END

function log() {
  if (typeof console !== 'undefined' && console.log) console.log.apply(console, arguments)
}

// >>> SCKI SUBSCRIPTION NODE FILTER: BEGIN — generated from tools/runtime/subscription-node-filter.js; edit runtime then synchronize.
// Shared browser-safe runtime. Embedded verbatim in the three JS overwrite adapters.
var SckiSubscriptionNodeFilter = (function() {
  'use strict'

  var INFO_TEXT = ['导航网址', '距离下次重置', '剩余流量', '套餐到期', '网址导航', '官网', '订阅', '到期', '剩余', '重置', '免费', '试用', '应急', '已用流量', '到期时间', '下次重置']
  var INFO_RE = /\b(?:USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Sign|Login|Register|Help|FAQ)\b/i
  var DIALER_BUILTIN = ['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE']
  var RESERVED_BUILTIN = DIALER_BUILTIN.concat(['GLOBAL', 'PASS-RULE'])
  var NUMBER = '(?:[0-9]+(?:\\.[0-9]+)?)'
  var LEFT = '(^|[\\s|/\\(\\)\\[\\]{}【】（）,，;；:_·｜])'
  var RIGHT = '(?=$|[\\s|/\\(\\)\\[\\]{}【】（）,，;；:_·｜])'
  // The delimiter excludes dots and hyphens so IPs, ports and negative values cannot look like rates.
  var RATE_RE = new RegExp(LEFT + '(?:[xX×]\\s*(' + NUMBER + ')|(' + NUMBER + ')\\s*[xX×倍]|倍率\\s*(' + NUMBER + '))' + RIGHT, 'g')
  var UNKNOWN_RATE_RE = new RegExp(LEFT + '(?:[xX×]\\s*(?:\\?|未知|unknown|nan|∞)|\\?\\s*[xX×倍]|倍率\\s*(?:\\?|未知|unknown|nan|∞))' + RIGHT, 'i')

  function isInfoNode(name) {
    if (typeof name !== 'string') return false
    for (var i = 0; i < INFO_TEXT.length; i++) if (name.indexOf(INFO_TEXT[i]) !== -1) return true
    return INFO_RE.test(name)
  }

  // Keep named direct outbounds for interface/dialer settings, but never auto-select them as remote nodes.
  function isSelectableProxy(proxy) {
    var type = proxy.type.toLowerCase()
    return type !== 'direct' && type !== 'reject'
  }

  function multiplier(name) {
    if (UNKNOWN_RATE_RE.test(name)) return null
    RATE_RE.lastIndex = 0
    var values = []
    var match
    while ((match = RATE_RE.exec(name)) !== null) {
      var value = Number(match[2] || match[3] || match[4])
      if (!Number.isFinite(value) || value <= 0) return null
      values.push(value)
    }
    if (!values.length) return null
    for (var i = 1; i < values.length; i++) if (values[i] !== values[0]) return null
    return values[0]
  }

  function canonical(value, stack, depth) {
    if (depth > 32) throw new Error('invalid-node-shape')
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
    if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value)
    if (!value || typeof value !== 'object' || stack.indexOf(value) !== -1) throw new Error('invalid-node-shape')
    stack.push(value)
    var result
    if (Array.isArray(value)) {
      result = '[' + value.map(function(item) { return canonical(item, stack, depth + 1) }).join(',') + ']'
    } else {
      if (Object.prototype.toString.call(value) !== '[object Object]') throw new Error('invalid-node-shape')
      var keys = Object.keys(value).sort()
      result = '{' + keys.map(function(key) { return JSON.stringify(key) + ':' + canonical(value[key], stack, depth + 1) }).join(',') + '}'
    }
    stack.pop()
    return result
  }

  function preflight(config, reservedNames, maxMultiplier) {
    try {
      var providers = config['proxy-providers']
      var providerNames = []
      var inlineNodes = []
      if (providers !== undefined && providers !== null) {
        if (Object.prototype.toString.call(providers) !== '[object Object]') return { ok: false, reason: 'provider-input' }
        providerNames = Object.keys(providers)
        for (var pi = 0; pi < providerNames.length; pi++) {
          var provider = providers[providerNames[pi]]
          // Flatten only literal payloads. Filters, overrides and remote refresh semantics require a separate adapter.
          if (!provider || Object.prototype.toString.call(provider) !== '[object Object]' ||
              provider.type !== 'inline' || !Array.isArray(provider.payload) ||
              Object.keys(provider).some(function(key) { return key !== 'type' && key !== 'payload' })) {
            return { ok: false, reason: 'provider-input' }
          }
          for (var pn = 0; pn < provider.payload.length; pn++) inlineNodes.push(provider.payload[pn])
        }
      }
      if (maxMultiplier !== null && (typeof maxMultiplier !== 'number' || !Number.isFinite(maxMultiplier) || maxMultiplier <= 0)) {
        return { ok: false, reason: 'invalid-multiplier-limit' }
      }
      var explicit = config.proxies
      if (explicit === undefined && providerNames.length) explicit = []
      if (!Array.isArray(explicit)) return { ok: false, reason: 'no-explicit-nodes' }
      var source = explicit.concat(inlineNodes)
      var reserved = Object.create(null)
      RESERVED_BUILTIN.concat(reservedNames).forEach(function(name) { reserved[name] = true })
      var seen = Object.create(null)
      var unique = []
      var duplicates = 0
      for (var i = 0; i < source.length; i++) {
        var proxy = source[i]
        if (!proxy || Object.prototype.toString.call(proxy) !== '[object Object]' ||
            typeof proxy.name !== 'string' || !proxy.name.trim() ||
            typeof proxy.type !== 'string' || !proxy.type.trim() ||
            (proxy.flow !== undefined && typeof proxy.flow !== 'string')) return { ok: false, reason: 'invalid-node-shape' }
        if (reserved[proxy.name]) return { ok: false, reason: 'reserved-name' }
        var fingerprint = canonical(proxy, [], 0)
        if (Object.prototype.hasOwnProperty.call(seen, proxy.name)) {
          if (seen[proxy.name] !== fingerprint) return { ok: false, reason: 'duplicate-name-conflict' }
          duplicates++
          continue
        }
        seen[proxy.name] = fingerprint
        // Payloads can be shared with another provider or a YAML alias; subsequent fingerprint injection owns this copy.
        unique.push(i < explicit.length ? proxy : JSON.parse(fingerprint))
      }
      var limit = maxMultiplier
      var kept = []
      var removedInfo = 0
      var removedRate = 0
      for (var j = 0; j < unique.length; j++) {
        var item = unique[j]
        if (isInfoNode(item.name)) { removedInfo++; continue }
        var rate = limit === null ? null : multiplier(item.name)
        if (rate !== null && rate > limit) { removedRate++; continue }
        kept.push(item)
      }
      var keptNames = Object.create(null)
      kept.forEach(function(item) { keptNames[item.name] = true })
      DIALER_BUILTIN.forEach(function(name) { keptNames[name] = true })
      var dialerTargets = Object.create(null)
      for (var k = 0; k < kept.length; k++) {
        var dialer = kept[k]['dialer-proxy']
        if (dialer !== undefined && (typeof dialer !== 'string' || !keptNames[dialer])) return { ok: false, reason: 'dialer-dependency' }
        if (dialer !== undefined) dialerTargets[kept[k].name] = dialer
      }
      // Each node is marked once; iterative traversal avoids recursion limits on large subscriptions.
      var dialerState = Object.create(null)
      for (var n = 0; n < kept.length; n++) {
        var cursor = kept[n].name
        var path = []
        while (cursor && dialerState[cursor] !== 2) {
          if (dialerState[cursor] === 1) return { ok: false, reason: 'dialer-cycle' }
          dialerState[cursor] = 1
          path.push(cursor)
          cursor = dialerTargets[cursor]
        }
        for (var p = 0; p < path.length; p++) dialerState[path[p]] = 2
      }
      return { ok: true, proxies: kept, duplicates: duplicates, removedInfo: removedInfo, removedRate: removedRate,
        sourceCount: source.length, flattenedProviders: providerNames.length, flattenedNodes: inlineNodes.length }
    } catch (_) {
      return { ok: false, reason: 'invalid-node-shape' }
    }
  }

  return { isInfoNode: isInfoNode, isSelectableProxy: isSelectableProxy, multiplier: multiplier, preflight: preflight }
})()
// <<< SCKI SUBSCRIPTION NODE FILTER: END

// ================================================================
//  模块 A：节点过滤 / 家宽识别
// ================================================================

function isInfoNode(name) {
  return SckiSubscriptionNodeFilter.isInfoNode(name)
}

const RESIDENTIAL_PATTERNS = [
  /家宽|家庭宽带|家庭住宅|住宅宽带|住宅|宽带/,
  /\bresi(?:dential)?\b/i,
  /\bhome(?:\s|-|_)?ip\b/i,
  /\bhome(?:\s|-|_)?broadband\b/i,
  /\bhome\b/i,
  /\bbroadband\b/i,
  /\bisp\b/i,
  /\biplc\b/i,
  /\biepl\b/i,
  /专线/,
]

function isResidentialNode(name) {
  const s = String(name || '')
  return RESIDENTIAL_PATTERNS.some(re => re.test(s))
}

// ================================================================
//  模块 B：国家/地区分类数据库（v4.5.1 修复 CN 区域）
// ================================================================

const REGION_DB = [
  // v5.2.6-normal.1 FIX#24-P0: 补齐 ISO alpha-3 代码（TWN/JPN/KOR/SGP/CHN），
  //   与 Clash Smart 内核覆写脚本.js 保持对齐（见 Smart 版同编号修复）
  { id: 'HK', kw: ['香港', 'hong kong', 'hongkong', 'hkg', '港'], iso: ['HK'] },
  { id: 'TW', kw: ['台湾', '台北', '台中', '高雄', '新北', '桃园', 'taiwan', 'taipei', 'taichung', 'kaohsiung', 'tpe', 'twn'], iso: ['TW'] },
  { id: 'CN', kw: ['中国', '大陆', '国内', '中国大陆', 'china', 'mainland', '回国节点', '回国专线', '回国线路', '回国加速', '回国服务', '直连国内', '国内直连', '中转国内', '落地国内', '北京', '上海', '广州', '深圳', 'beijing', 'shanghai', 'guangzhou', 'shenzhen', '成都', '重庆', '杭州', '南京', '武汉', '天津', '苏州', '西安', '长沙', 'chengdu', 'chongqing', 'hangzhou', 'nanjing', 'wuhan', 'tianjin', 'suzhou', 'xian', 'changsha', '沈阳', '青岛', '郑州', '大连', '东莞', '宁波', '厦门', '济南', '无锡', '合肥', '昆明', '福州', '哈尔滨', '佛山', '长春', '石家庄', '太原', '南宁', '贵阳', '乌鲁木齐', '兰州', '海口', '银川', '西宁', '拉萨', '呼和浩特', '电信', '联通', '移动', '铁通', 'chinatelecom', 'chinaunicom', 'chinamobile', 'chn', 'pek', 'pkx', 'pvg', 'szx', 'ctu', 'ckg', 'hgh', 'nkg', 'wuh', 'tsn', 'syx', 'xiy', 'csx', 'kmg', 'hak', 'dlc', 'tao', 'she', 'hrb', 'cgo'], iso: ['CN'] },
  { id: 'JP', kw: ['日本', '东京', '大阪', '横滨', '名古屋', '福冈', '札幌', '京都', '神户', '千叶', '埼玉', '仙台', '广岛', '冲绳', '那霸', 'japan', 'tokyo', 'osaka', 'yokohama', 'nagoya', 'fukuoka', 'sapporo', 'kyoto', 'kobe', 'chiba', 'sendai', 'hiroshima', 'okinawa', 'naha', 'jpn', 'nrt', 'hnd', 'kix', 'ngo', 'fuk', 'cts', 'oka'], iso: ['JP'] },
  { id: 'KR', kw: ['韩国', '首尔', '釜山', '仁川', '大田', '大邱', '光州', '济州', 'korea', 'seoul', 'busan', 'incheon', 'daejeon', 'daegu', 'gwangju', 'jeju', 'kor', 'icn', 'gmp', 'pus'], iso: ['KR'] },
  { id: 'SG', kw: ['新加坡', 'singapore', 'sgp', 'sin'], iso: ['SG'] },
  { id: 'US', kw: ['美国', 'united states', 'america', 'usa', '洛杉矶', 'los angeles', '圣何塞', 'san jose', '旧金山', '三藩市', 'san francisco', '西雅图', 'seattle', '纽约', 'new york', '芝加哥', 'chicago', '达拉斯', 'dallas', '丹佛', 'denver', '凤凰城', 'phoenix', '亚特兰大', 'atlanta', '迈阿密', 'miami', '波士顿', 'boston', '华盛顿', 'washington', '费城', 'philadelphia', '休斯顿', 'houston', '圣地亚哥', 'san diego', '拉斯维加斯', 'las vegas', '波特兰', 'portland', '硅谷', 'silicon valley', '弗吉尼亚', 'virginia', '夏洛特', 'charlotte', '奥斯汀', 'austin', '纳什维尔', 'nashville', '盐湖城', 'salt lake', '明尼阿波利斯', 'minneapolis', '圣路易斯', 'st louis', '堪萨斯', 'kansas city', '底特律', 'detroit', '匹兹堡', 'pittsburgh', '克利夫兰', 'cleveland', '檀香山', 'honolulu', '安克雷奇', 'anchorage', 'lax', 'sjc', 'sfo', 'sea', 'jfk', 'ewr', 'ord', 'dfw', 'iad', 'atl', 'mia', 'bos', 'den', 'phx', 'iah', 'msp', 'dtw', 'phl', 'san', 'las', 'slc', 'pdx', 'clt', 'hnl', 'anc'], iso: ['US'] },
  { id: 'EU', kw: ['欧洲', 'europe', '英国', 'united kingdom', 'england', 'britain', 'london', '伦敦', 'manchester', '曼彻斯特', 'birmingham', 'glasgow', 'edinburgh', 'liverpool', 'leeds', 'bristol', 'lhr', 'lgw', 'man', 'edi', '爱尔兰', 'ireland', 'dublin', '都柏林', '法国', 'france', 'paris', '巴黎', 'marseille', '马赛', 'lyon', '里昂', 'nice', 'toulouse', 'cdg', 'ory', '德国', 'germany', 'frankfurt', '法兰克福', 'berlin', '柏林', 'munich', '慕尼黑', 'hamburg', '汉堡', 'dusseldorf', 'cologne', 'fra', 'muc', 'ber', '荷兰', 'netherlands', 'holland', 'amsterdam', '阿姆斯特丹', 'rotterdam', 'ams', '比利时', 'belgium', 'brussels', '布鲁塞尔', '卢森堡', 'luxembourg', '瑞士', 'switzerland', 'zurich', '苏黎世', 'geneva', '日内瓦', 'bern', 'zrh', '奥地利', 'austria', 'vienna', '维也纳', 'vie', '列支敦士登', 'liechtenstein', '摩纳哥', 'monaco', '丹麦', 'denmark', 'copenhagen', '哥本哈根', '冰岛', 'iceland', 'reykjavik', '挪威', 'norway', 'oslo', '奥斯陆', '瑞典', 'sweden', 'stockholm', '斯德哥尔摩', '芬兰', 'finland', 'helsinki', '赫尔辛基', '爱沙尼亚', 'estonia', 'tallinn', '塔林', '拉脱维亚', 'latvia', 'riga', '里加', '立陶宛', 'lithuania', 'vilnius', '维尔纽斯', '意大利', 'italy', 'rome', '罗马', 'milan', '米兰', 'naples', 'florence', 'fco', 'mxp', '西班牙', 'spain', 'madrid', '马德里', 'barcelona', '巴塞罗那', 'mad', 'bcn', '葡萄牙', 'portugal', 'lisbon', '里斯本', '希腊', 'greece', 'athens', '雅典', '马耳他', 'malta', '安道尔', 'andorra', '圣马力诺', 'san marino', '波兰', 'poland', 'warsaw', '华沙', 'krakow', 'waw', '捷克', 'czech', 'prague', '布拉格', '斯洛伐克', 'slovakia', 'bratislava', '匈牙利', 'hungary', 'budapest', '布达佩斯', '罗马尼亚', 'romania', 'bucharest', '布加勒斯特', '保加利亚', 'bulgaria', 'sofia', '索菲亚', '俄罗斯', 'russia', 'moscow', '莫斯科', 'svo', 'dme', '乌克兰', 'ukraine', 'kiev', 'kyiv', '基辅', '白俄罗斯', 'belarus', 'minsk', '明斯克', '摩尔多瓦', 'moldova', 'chisinau', '塞尔维亚', 'serbia', 'belgrade', '贝尔格莱德', '黑山', 'montenegro', '克罗地亚', 'croatia', 'zagreb', '斯洛文尼亚', 'slovenia', 'ljubljana', '波黑', 'bosnia', 'herzegovina', 'sarajevo', '马其顿', 'macedonia', 'skopje', '阿尔巴尼亚', 'albania', 'tirana', '科索沃', 'kosovo', 'pristina', '塞浦路斯', 'cyprus', 'nicosia', '格鲁吉亚', 'georgia', 'tbilisi', '第比利斯'], iso: ['GB', 'UK', 'IE', 'FR', 'DE', 'NL', 'LU', 'CH', 'DK', 'SE', 'FI', 'EE', 'LV', 'LT', 'ES', 'PT', 'GR', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'RU', 'UA', 'MD', 'RS', 'HR', 'SI', 'MK', 'XK', 'CY', 'GE', 'EU'] },
  { id: 'AM', kw: ['美洲', 'americas', '拉丁美洲', 'latin america', '南美', 'south america', '中美洲', 'central america', '加勒比', 'caribbean', '加拿大', 'canada', 'toronto', '多伦多', 'vancouver', '温哥华', 'montreal', '蒙特利尔', 'ottawa', '渥太华', 'calgary', '卡尔加里', 'edmonton', 'winnipeg', 'yyz', 'yvr', 'yul', '墨西哥', 'mexico', 'mexico city', '墨西哥城', 'cancun', '坎昆', 'guadalajara', 'monterrey', 'mex', '危地马拉', 'guatemala', '伯利兹', 'belize', '萨尔瓦多', 'el salvador', '洪都拉斯', 'honduras', '尼加拉瓜', 'nicaragua', '哥斯达黎加', 'costa rica', '巴拿马', 'panama', '古巴', 'cuba', '牙买加', 'jamaica', '多米尼加', 'dominican republic', '波多黎各', 'puerto rico', '巴哈马', 'bahamas', '巴巴多斯', 'barbados', '特立尼达', 'trinidad', '海地', 'haiti', '巴西', 'brazil', 'sao paulo', '圣保罗', 'rio de janeiro', '里约热内卢', 'gru', 'gig', '阿根廷', 'argentina', 'buenos aires', '布宜诺斯艾利斯', 'eze', '智利', 'chile', 'santiago', '秘鲁', 'peru', 'lima', '利马', '哥伦比亚', 'colombia', 'bogota', '波哥大', 'medellin', '委内瑞拉', 'venezuela', '厄瓜多尔', 'ecuador', '玻利维亚', 'bolivia', '巴拉圭', 'paraguay', '乌拉圭', 'uruguay', 'montevideo', '圭亚那', 'guyana', '苏里南', 'suriname'], iso: ['CA', 'MX', 'GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA', 'CU', 'JM', 'PR', 'BS', 'BB', 'TT', 'HT', 'BR', 'AR', 'CL', 'PE', 'CO', 'VE', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR'] },
  { id: 'AF', kw: ['非洲', 'africa', '埃及', 'egypt', 'cairo', '开罗', 'cai', '苏丹', 'sudan', '南苏丹', 'south sudan', '利比亚', 'libya', '突尼斯', 'tunisia', '阿尔及利亚', 'algeria', '摩洛哥', 'morocco', 'casablanca', '埃塞俄比亚', 'ethiopia', '索马里', 'somalia', '肯尼亚', 'kenya', 'nairobi', 'nbo', '坦桑尼亚', 'tanzania', '乌干达', 'uganda', '卢旺达', 'rwanda', '布隆迪', 'burundi', '厄立特里亚', 'eritrea', '吉布提', 'djibouti', '马达加斯加', 'madagascar', '毛里求斯', 'mauritius', '莫桑比克', 'mozambique', '塞舌尔', 'seychelles', '赞比亚', 'zambia', '津巴布韦', 'zimbabwe', '马拉维', 'malawi', '喀麦隆', 'cameroon', '刚果', 'congo', '安哥拉', 'angola', '加蓬', 'gabon', '乍得', 'chad', '中非', 'central african', '赤道几内亚', 'equatorial guinea', '南非', 'south africa', 'johannesburg', '约翰内斯堡', 'cape town', '开普敦', 'pretoria', 'jnb', 'cpt', '纳米比亚', 'namibia', '博茨瓦纳', 'botswana', '莱索托', 'lesotho', '斯威士兰', 'eswatini', 'swaziland', '尼日利亚', 'nigeria', 'lagos', 'abuja', '加纳', 'ghana', 'accra', '塞内加尔', 'senegal', 'dakar', '马里', 'mali', '布基纳法索', 'burkina faso', '几内亚', 'guinea', '科特迪瓦', 'ivory coast', "cote d'ivoire", '塞拉利昂', 'sierra leone', '利比里亚', 'liberia', '多哥', 'togo', '贝宁', 'benin', '尼日尔', 'niger', '毛里塔尼亚', 'mauritania', '冈比亚', 'gambia', '佛得角', 'cape verde'], iso: ['EG', 'SD', 'SS', 'LY', 'TN', 'DZ', 'ET', 'KE', 'TZ', 'UG', 'RW', 'MG', 'MU', 'MZ', 'ZM', 'ZW', 'MW', 'CM', 'CD', 'CG', 'AO', 'GA', 'TD', 'ZA', 'BW', 'LS', 'SZ', 'NG', 'GH', 'SN', 'ML', 'BF', 'GN', 'CI', 'SL', 'LR', 'TG', 'BJ', 'NE', 'MR', 'GM', 'CV'] },
  { id: 'APAC_OTHER', kw: ['马来','亚太', 'apac', 'asia pacific', 'asia', '亚洲', '大洋洲', 'oceania', 'iplc', 'iepl', '专线', '低延迟', 'cn2', 'gia', '马来西亚', 'malaysia', 'kuala lumpur', '吉隆坡', 'kul', '印度尼西亚', '印尼', 'indonesia', 'jakarta', '雅加达', '泰国', 'thailand', 'bangkok', '曼谷', 'bkk', '越南', 'vietnam', 'hanoi', '河内', 'ho chi minh', '胡志明', 'saigon', 'sgn', 'han', '菲律宾', 'philippines', 'manila', '马尼拉', 'mnl', '柬埔寨', 'cambodia', 'phnom penh', '金边', '缅甸', 'myanmar', 'yangon', '老挝', 'laos', 'vientiane', '文莱', 'brunei', '东帝汶', 'timor-leste', '印度', 'india', 'mumbai', '孟买', 'delhi', '新德里', 'bangalore', '班加罗尔', 'chennai', 'hyderabad', 'kolkata', 'bom', 'del', 'blr', '巴基斯坦', 'pakistan', 'karachi', 'islamabad', '孟加拉', 'bangladesh', 'dhaka', '斯里兰卡', 'sri lanka', 'colombo', '尼泊尔', 'nepal', 'kathmandu', '马尔代夫', 'maldives', '不丹', 'bhutan', '阿富汗', 'afghanistan', '土耳其', 'turkey', 'turkiye', 'istanbul', '伊斯坦布尔', 'ankara', 'ist', '以色列', 'israel', 'tel aviv', 'tlv', '沙特', 'saudi', 'riyadh', '阿联酋', 'uae', 'emirates', 'dubai', '迪拜', 'abu dhabi', 'dxb', 'auh', '卡塔尔', 'qatar', 'doha', 'doh', '科威特', 'kuwait', '巴林', 'bahrain', '阿曼', 'oman', 'muscat', '伊拉克', 'iraq', 'baghdad', '伊朗', 'iran', 'tehran', '约旦', 'jordan', 'amman', '黎巴嫩', 'lebanon', 'beirut', '叙利亚', 'syria', '也门', 'yemen', '巴勒斯坦', 'palestine', '亚美尼亚', 'armenia', 'yerevan', '阿塞拜疆', 'azerbaijan', 'baku', '哈萨克斯坦', 'kazakhstan', 'almaty', 'astana', '乌兹别克斯坦', 'uzbekistan', 'tashkent', '吉尔吉斯斯坦', 'kyrgyzstan', '土库曼斯坦', 'turkmenistan', '塔吉克斯坦', 'tajikistan', '澳门', 'macau', 'macao', '蒙古', 'mongolia', 'ulaanbaatar', '澳大利亚', 'australia', 'sydney', '悉尼', 'melbourne', '墨尔本', 'brisbane', 'perth', 'adelaide', 'syd', 'mel', '新西兰', 'new zealand', 'auckland', '奥克兰', 'wellington', 'akl', '斐济', 'fiji', '巴布亚新几内亚', 'papua new guinea', '关岛', 'guam', '新喀里多尼亚', 'new caledonia'], iso: ['IN','IND','MY','ID', 'TH', 'VN', 'PH', 'KH', 'MM', 'BN', 'TL', 'PK', 'BD', 'LK', 'NP', 'MV', 'BT', 'AF', 'TR', 'IL', 'AE', 'QA', 'KW', 'BH', 'OM', 'IQ', 'IR', 'JO', 'LB', 'SY', 'YE', 'PS', 'AZ', 'KZ', 'UZ', 'KG', 'TM', 'TJ', 'MO', 'MN', 'AU', 'NZ', 'FJ', 'PG', 'GU', 'NC', 'PF'] },
]

// ================================================================
//  模块 C：单次分类引擎
// ================================================================

const _regexCache = new Map()
function _getWordBoundaryRegex(keyword, caseSensitive) {
  const key = (caseSensitive ? 'S:' : 'I:') + keyword
  if (_regexCache.has(key)) return _regexCache.get(key)
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const flags = caseSensitive ? '' : 'i'
  const re = new RegExp('(^|[^a-zA-Z])' + escaped + '([^a-zA-Z]|$)', flags)
  _regexCache.set(key, re)
  return re
}
// ISO alpha-2 在机场节点中常被写成 hk01 / us-05。不能直接让全部 ISO
// 忽略大小写：US、IN 等会误命中普通英文词。仅在紧随编号时放开大小写，
// 并继续沿用“非英文字母”为边界的跨平台约定。
function _getNumberedIsoRegex(keyword) {
  const key = 'N:' + keyword
  if (_regexCache.has(key)) return _regexCache.get(key)
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp('(^|[^a-zA-Z])' + escaped + '(?=[^a-zA-Z]*[0-9])', 'i')
  _regexCache.set(key, re)
  return re
}
function _isChinese(str) { return /[\u4e00-\u9fa5]/.test(str) }

const _compiledRegions = REGION_DB.map(function(region) {
  var matchers = []
  for (var i = 0; i < region.iso.length; i++) {
    matchers.push({ type: 'iso', regex: _getWordBoundaryRegex(region.iso[i], true) })
    matchers.push({ type: 'iso-numbered', regex: _getNumberedIsoRegex(region.iso[i]) })
  }
  for (var j = 0; j < region.kw.length; j++) {
    var kw = region.kw[j]
    if (_isChinese(kw)) { matchers.push({ type: 'cn', text: kw }) }
    else { matchers.push({ type: 'en', regex: _getWordBoundaryRegex(kw, false) }) }
  }
  return { id: region.id, matchers: matchers }
})

// 运营商/线路营销词不表示节点落地地区。先从分类输入中剥离；仅当没有任何
// 地区信号命中时，才把只含此类标签的节点兜底归为 CN。
const _CN_CARRIER_LABEL_RE = /中国(?:电信|联通|移动|铁通)|电信|联通|移动|铁通|\bchina[\s_-]*(?:telecom|unicom|mobile)\b|\b(?:chinatelecom|chinaunicom|chinamobile)\b/i
function _stripCnCarrierLabels(name) {
  return name.replace(/中国(?:电信|联通|移动|铁通)|电信|联通|移动|铁通|\bchina[\s_-]*(?:telecom|unicom|mobile)\b|\b(?:chinatelecom|chinaunicom|chinamobile)\b/ig, ' ')
}

function classifyNode(name) {
  var originalName = String(name || '')
  if (!originalName) return null
  var nameStr = _stripCnCarrierLabels(originalName)
  for (var i = 0; i < _compiledRegions.length; i++) {
    var region = _compiledRegions[i]
    for (var j = 0; j < region.matchers.length; j++) {
      var m = region.matchers[j]
      if (m.type === 'cn') { if (nameStr.indexOf(m.text) !== -1) return region.id }
      else { if (m.regex.test(nameStr)) return region.id }
    }
  }
  if (_CN_CARRIER_LABEL_RE.test(originalName)) return 'CN'
  return 'OTHER'
}

function classifyAllNodes(proxies) {
  var result = {
    HK: [], TW: [], CN: [], JP: [], KR: [], SG: [], US: [], EU: [], AM: [], AF: [], APAC_OTHER: [], OTHER: [], ALL: [],
    HOME_HK: [], HOME_TW: [], HOME_CN: [], HOME_JP: [], HOME_KR: [], HOME_SG: [], HOME_US: [], HOME_EU: [], HOME_AM: [], HOME_AF: [], HOME_APAC_OTHER: [], HOME_OTHER: [], HOME_ALL: [],
  }
  for (var i = 0; i < proxies.length; i++) {
    var p = proxies[i]
    if (!p || typeof p !== 'object' || !p.name) continue
    if (!SckiSubscriptionNodeFilter.isSelectableProxy(p)) continue
    if (isInfoNode(p.name)) continue
    var name = String(p.name)
    var isHome = isResidentialNode(name)
    result.ALL.push(name)
    if (isHome) result.HOME_ALL.push(name)
    var region = classifyNode(name)
    if (region && result[region]) {
      result[region].push(name)
      if (isHome && result['HOME_' + region]) result['HOME_' + region].push(name)
    } else {
      result.OTHER.push(name)
      if (isHome) result.HOME_OTHER.push(name)
    }
  }
  return result
}

// ================================================================
//  模块 D：常量定义
// ================================================================

const SMART = {
  GLOBAL: '🌍 全球节点', GLOBAL_HOME: '🏡 全球家宽',
  HK: '🇭🇰 香港节点', HK_HOME: '🏡 香港家宽',
  TW: '🇹🇼 台湾节点', TW_HOME: '🏡 台湾家宽',
  SG: '🇸🇬 狮城节点', SG_HOME: '🏡 狮城家宽',
  JPKR: '🇯🇵 日韩节点', JPKR_HOME: '🏡 日韩家宽',
  APAC: '🌏 亚太节点', APAC_HOME: '🏡 亚太家宽',
  US: '🇺🇸 美国节点', US_HOME: '🏡 美国家宽',
  EU: '🇪🇺 欧洲节点', EU_HOME: '🏡 欧洲家宽',
  AMERICAS: '🌎 美洲节点', AMERICAS_HOME: '🏡 美洲家宽',
  AFRICA: '🌍 非洲节点', AFRICA_HOME: '🏡 非洲家宽',
  OTHER: '🌏 其他节点', OTHER_HOME: '🏡 其他家宽',
}

const BIZ = {
  AI: '🤖 AI 服务', CRYPTO: '💰 加密货币', PAYMENTS: '🏦 金融支付',
  IM: '💬 即时通讯', SOCIAL: '📱 社交媒体',
  WORK: '🧑‍💼 会议协作', CNMEDIA: '📺 国内流媒体',
  TOK: '🎵 TikTok',
  NFLX: '🎥 Netflix', DSNP: '🎬 Disney+', HBO: '📡 HBO/Max',
  HULU: '📺 Hulu', PRIME: '🎬 Prime Video',
  YT: '📹 YouTube', MUSIC: '🎵 音乐流媒体',
  STREAM_HK: '🇭🇰 香港流媒体', STREAM_TW: '🇹🇼 台湾流媒体',
  STREAM_JP: '🇯🇵 日韩流媒体', STREAM_EU: '🇪🇺 欧洲流媒体',
  STREAM_OTHER: '🌐 其他国外流媒体',
  GAME_CN: '🕹️ 国内游戏', GAME_INTL: '🎮 国外游戏',
  GOOGLE: '🔍 Google 服务',
  TOOLS: '🔧 工具与服务', MS: 'Ⓜ️ 微软服务', APPLE: '🍎 苹果服务',
  DOWNLOAD: '📥 下载更新', TRACKER: '🛰️ BT/PT Tracker',
  CN_SITE: '🏠 国内网站',
  GFW: '🚫 受限网站', INTL_SITE: '🌐 国外网站',
  FINAL: '🐟 漏网之鱼', AD: '🛑 广告拦截',
}














// BEGIN AUTO-GENERATED MIHOMO FUSED RULE-SETS
// Generated by tools/build-fused-rule-sets.js from rulesets/source/routing-graph.js.
const MIHOMO_FUSED_RULE_PROVIDERS = {"scki-fused-001-direct-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-001-direct-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-001-direct-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-002-intl-site-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-002-intl-site-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-002-intl-site-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-003-payments-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-003-payments-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-003-payments-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-004-ai-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-004-ai-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-004-ai-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-005-cnmedia-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-005-cnmedia-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-005-cnmedia-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-006-cn-site-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-006-cn-site-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-006-cn-site-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-007-stream-jpkr-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-007-stream-jpkr-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-007-stream-jpkr-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-008-social-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-008-social-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-008-social-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-008-social-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-008-social-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-008-social-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-009-tiktok-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-009-tiktok-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-009-tiktok-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-009-tiktok-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-009-tiktok-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-009-tiktok-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-010-ad-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-010-ad-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-010-ad-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-010-ad-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-010-ad-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-010-ad-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-010-ad-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-010-ad-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-010-ad-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-011-tools-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-011-tools-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-011-tools-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-012-intl-site-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-012-intl-site-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-012-intl-site-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-013-ai-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-013-ai-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-013-ai-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-014-game-cn-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-014-game-cn-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-014-game-cn-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-015-microsoft-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-015-microsoft-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-015-microsoft-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-015-microsoft-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-015-microsoft-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-015-microsoft-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-016-ad-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-016-ad-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-016-ad-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-016-ad-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-016-ad-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-016-ad-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-016-ad-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-016-ad-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-016-ad-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-017-cn-site-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-017-cn-site-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-017-cn-site-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-018-direct-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-018-direct-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-018-direct-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-018-direct-ipcidr-no-resolve":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-018-direct-ipcidr-no-resolve.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-018-direct-ipcidr-no-resolve.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-018-direct-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-018-direct-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-018-direct-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-019-work-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-019-work-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-019-work-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-020-crypto-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-020-crypto-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-020-crypto-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-021-gfw-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-021-gfw-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-021-gfw-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-022-youtube-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-022-youtube-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-022-youtube-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-023-ai-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-023-ai-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-023-ai-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-024-google-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-024-google-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-024-google-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-024-google-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-024-google-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-024-google-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-025-work-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-025-work-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-025-work-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-026-ai-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-026-ai-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-026-ai-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-026-ai-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-026-ai-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-026-ai-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-026-ai-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-026-ai-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-026-ai-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-027-intl-site-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-027-intl-site-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-027-intl-site-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-028-im-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-028-im-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-028-im-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-029-work-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-029-work-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-029-work-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-030-download-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-030-download-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-030-download-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-030-download-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-030-download-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-030-download-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-030-download-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-030-download-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-030-download-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-031-google-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-031-google-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-031-google-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-031-google-ipcidr-no-resolve":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-031-google-ipcidr-no-resolve.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-031-google-ipcidr-no-resolve.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-032-tools-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-032-tools-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-032-tools-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-033-ai-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-033-ai-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-033-ai-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-033-ai-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-033-ai-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-033-ai-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-033-ai-ipcidr-no-resolve":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-033-ai-ipcidr-no-resolve.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-033-ai-ipcidr-no-resolve.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-033-ai-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-033-ai-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-033-ai-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-034-google-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-034-google-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-034-google-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-035-ai-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-035-ai-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-035-ai-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-035-ai-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-035-ai-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-035-ai-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-035-ai-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-035-ai-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-035-ai-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-036-crypto-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-036-crypto-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-036-crypto-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-036-crypto-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-036-crypto-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-036-crypto-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-037-payments-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-037-payments-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-037-payments-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-037-payments-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-037-payments-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-037-payments-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-039-intl-site-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-039-intl-site-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-039-intl-site-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-040-direct-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-040-direct-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-040-direct-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-041-im-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-041-im-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-041-im-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-041-im-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-041-im-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-041-im-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-041-im-ipcidr-no-resolve":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-041-im-ipcidr-no-resolve.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-041-im-ipcidr-no-resolve.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-041-im-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-041-im-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-041-im-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-042-social-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-042-social-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-042-social-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-042-social-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-042-social-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-042-social-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-042-social-ipcidr-no-resolve":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-042-social-ipcidr-no-resolve.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-042-social-ipcidr-no-resolve.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-042-social-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-042-social-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-042-social-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-043-cn-site-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-043-cn-site-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-043-cn-site-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-044-social-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-044-social-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-044-social-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-045-work-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-045-work-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-045-work-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-045-work-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-045-work-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-045-work-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-045-work-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-045-work-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-045-work-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-046-direct-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-046-direct-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-046-direct-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-047-cnmedia-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-047-cnmedia-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-047-cnmedia-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-048-tiktok-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-048-tiktok-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-048-tiktok-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-049-youtube-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-049-youtube-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-049-youtube-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-050-netflix-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-050-netflix-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-050-netflix-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-050-netflix-ipcidr-no-resolve":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-050-netflix-ipcidr-no-resolve.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-050-netflix-ipcidr-no-resolve.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-051-disney-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-051-disney-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-051-disney-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-051-disney-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-051-disney-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-051-disney-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-052-hbo-max-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-052-hbo-max-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-052-hbo-max-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-052-hbo-max-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-052-hbo-max-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-052-hbo-max-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-053-hulu-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-053-hulu-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-053-hulu-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-053-hulu-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-053-hulu-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-053-hulu-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-054-prime-video-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-054-prime-video-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-054-prime-video-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-054-prime-video-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-054-prime-video-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-054-prime-video-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-055-intl-site-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-055-intl-site-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-055-intl-site-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-055-intl-site-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-055-intl-site-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-055-intl-site-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-055-intl-site-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-055-intl-site-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-055-intl-site-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-056-music-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-056-music-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-056-music-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-056-music-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-056-music-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-056-music-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-057-stream-hk-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-057-stream-hk-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-057-stream-hk-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-057-stream-hk-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-057-stream-hk-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-057-stream-hk-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-057-stream-hk-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-057-stream-hk-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-057-stream-hk-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-058-stream-tw-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-058-stream-tw-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-058-stream-tw-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-058-stream-tw-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-058-stream-tw-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-058-stream-tw-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-059-stream-jpkr-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-059-stream-jpkr-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-059-stream-jpkr-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-059-stream-jpkr-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-059-stream-jpkr-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-059-stream-jpkr-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-059-stream-jpkr-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-059-stream-jpkr-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-059-stream-jpkr-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-060-stream-eu-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-060-stream-eu-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-060-stream-eu-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-060-stream-eu-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-060-stream-eu-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-060-stream-eu-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-061-stream-other-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-061-stream-other-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-061-stream-other-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-061-stream-other-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-061-stream-other-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-061-stream-other-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-061-stream-other-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-061-stream-other-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-061-stream-other-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-062-tools-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-062-tools-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-062-tools-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-063-google-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-063-google-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-063-google-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-064-tools-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-064-tools-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-064-tools-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-064-tools-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-064-tools-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-064-tools-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-064-tools-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-064-tools-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-064-tools-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-065-microsoft-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-065-microsoft-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-065-microsoft-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-065-microsoft-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-065-microsoft-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-065-microsoft-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-066-apple-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-066-apple-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-066-apple-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-066-apple-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-066-apple-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-066-apple-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-066-apple-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-066-apple-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-066-apple-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-067-download-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-067-download-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-067-download-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-067-download-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-067-download-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-067-download-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-067-download-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-067-download-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-067-download-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-068-tracker-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-068-tracker-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-068-tracker-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-068-tracker-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-068-tracker-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-068-tracker-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-068-tracker-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-068-tracker-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-068-tracker-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-069-gfw-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-069-gfw-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-069-gfw-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-069-gfw-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-069-gfw-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-069-gfw-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-069-gfw-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-069-gfw-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-069-gfw-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-070-game-cn-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-070-game-cn-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-070-game-cn-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-071-game-intl-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-071-game-intl-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-071-game-intl-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-071-game-intl-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-071-game-intl-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-071-game-intl-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-071-game-intl-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-071-game-intl-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-071-game-intl-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-072-intl-site-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-072-intl-site-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-072-intl-site-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-072-intl-site-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-072-intl-site-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-072-intl-site-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-072-intl-site-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-072-intl-site-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-072-intl-site-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-073-payments-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-073-payments-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-073-payments-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-074-cnmedia-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-074-cnmedia-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-074-cnmedia-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-074-cnmedia-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-074-cnmedia-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-074-cnmedia-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-074-cnmedia-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-074-cnmedia-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-074-cnmedia-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-075-cn-site-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-075-cn-site-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-075-cn-site-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-075-cn-site-ipcidr-no-resolve":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-075-cn-site-ipcidr-no-resolve.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-075-cn-site-ipcidr-no-resolve.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-076-direct-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-076-direct-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-076-direct-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-077-cn-site-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-077-cn-site-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-077-cn-site-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-077-cn-site-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-077-cn-site-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-077-cn-site-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-078-intl-site-domain":{"type":"http","behavior":"domain","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-078-intl-site-domain.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-078-intl-site-domain.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-078-intl-site-ipcidr":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-078-intl-site-ipcidr.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-078-intl-site-ipcidr.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-078-intl-site-ipcidr-no-resolve":{"type":"http","behavior":"ipcidr","format":"mrs","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-078-intl-site-ipcidr-no-resolve.mrs?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-078-intl-site-ipcidr-no-resolve.mrs","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-078-intl-site-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-078-intl-site-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-078-intl-site-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-079-im-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-079-im-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-079-im-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-080-netflix-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-080-netflix-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-080-netflix-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-081-social-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-081-social-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-081-social-residual.yaml","interval":86400,"proxy":"🚫 受限网站"},"scki-fused-082-google-residual":{"type":"http","behavior":"classical","format":"yaml","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/mihomo/scki-fused-082-google-residual.yaml?scki=v6.0.20","path":"./ruleset/v6.0.20/scki-fused-082-google-residual.yaml","interval":86400,"proxy":"🚫 受限网站"}}
const MIHOMO_FUSED_RULES = ["RULE-SET,scki-fused-001-direct-domain,DIRECT","RULE-SET,scki-fused-002-intl-site-domain,🌐 国外网站","RULE-SET,scki-fused-003-payments-domain,🏦 金融支付","RULE-SET,scki-fused-004-ai-domain,🤖 AI 服务","RULE-SET,scki-fused-005-cnmedia-domain,📺 国内流媒体","RULE-SET,scki-fused-006-cn-site-domain,🏠 国内网站","RULE-SET,scki-fused-007-stream-jpkr-domain,🇯🇵 日韩流媒体","RULE-SET,scki-fused-008-social-domain,📱 社交媒体","RULE-SET,scki-fused-008-social-residual,📱 社交媒体","RULE-SET,scki-fused-009-tiktok-domain,🎵 TikTok","RULE-SET,scki-fused-009-tiktok-residual,🎵 TikTok","RULE-SET,scki-fused-010-ad-domain,🛑 广告拦截","RULE-SET,scki-fused-010-ad-ipcidr,🛑 广告拦截","RULE-SET,scki-fused-010-ad-residual,🛑 广告拦截","RULE-SET,scki-fused-011-tools-domain,🔧 工具与服务","RULE-SET,scki-fused-012-intl-site-domain,🌐 国外网站","RULE-SET,scki-fused-013-ai-domain,🤖 AI 服务","RULE-SET,scki-fused-014-game-cn-domain,🕹️ 国内游戏","RULE-SET,scki-fused-015-microsoft-domain,Ⓜ️ 微软服务","RULE-SET,scki-fused-015-microsoft-residual,Ⓜ️ 微软服务","RULE-SET,scki-fused-016-ad-domain,🛑 广告拦截","RULE-SET,scki-fused-016-ad-ipcidr,🛑 广告拦截","RULE-SET,scki-fused-016-ad-residual,🛑 广告拦截","RULE-SET,scki-fused-017-cn-site-domain,🏠 国内网站","AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,youtube)),📹 YouTube","AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,google)),🔍 Google 服务","AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,microsoft)),Ⓜ️ 微软服务","AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,apple)),🍎 苹果服务","AND,((DST-PORT,443),(NETWORK,UDP),(NOT,((GEOSITE,cn)))),REJECT","DST-PORT,7680,REJECT","RULE-SET,scki-fused-018-direct-domain,DIRECT","RULE-SET,scki-fused-018-direct-ipcidr-no-resolve,DIRECT,no-resolve","RULE-SET,scki-fused-018-direct-residual,DIRECT","RULE-SET,scki-fused-019-work-residual,🧑‍💼 会议协作","DST-PORT,26880,DIRECT","DST-PORT,6540,DIRECT","DST-PORT,33068,DIRECT","DST-PORT,123,DIRECT","DST-PORT,3478,DIRECT","DST-PORT,3479,DIRECT","DST-PORT,5349,DIRECT","DST-PORT,19302,DIRECT","DST-PORT,19305,DIRECT","DST-PORT,19307,DIRECT","RULE-SET,scki-fused-020-crypto-domain,💰 加密货币","RULE-SET,scki-fused-021-gfw-domain,🚫 受限网站","RULE-SET,scki-fused-022-youtube-domain,📹 YouTube","RULE-SET,scki-fused-023-ai-domain,🤖 AI 服务","RULE-SET,scki-fused-024-google-domain,🔍 Google 服务","RULE-SET,scki-fused-024-google-residual,🔍 Google 服务","RULE-SET,scki-fused-025-work-domain,🧑‍💼 会议协作","RULE-SET,scki-fused-026-ai-domain,🤖 AI 服务","RULE-SET,scki-fused-026-ai-ipcidr,🤖 AI 服务","RULE-SET,scki-fused-026-ai-residual,🤖 AI 服务","RULE-SET,scki-fused-027-intl-site-domain,🌐 国外网站","RULE-SET,scki-fused-028-im-domain,💬 即时通讯","RULE-SET,scki-fused-029-work-domain,🧑‍💼 会议协作","RULE-SET,scki-fused-030-download-domain,📥 下载更新","RULE-SET,scki-fused-030-download-ipcidr,📥 下载更新","RULE-SET,scki-fused-030-download-residual,📥 下载更新","RULE-SET,scki-fused-031-google-domain,🔍 Google 服务","RULE-SET,scki-fused-031-google-ipcidr-no-resolve,🔍 Google 服务,no-resolve","AND,((PROCESS-NAME,Code Helper),(DOMAIN,api.github.com)),🤖 AI 服务","AND,((PROCESS-NAME,Code Helper (Plugin)),(DOMAIN,api.github.com)),🤖 AI 服务","RULE-SET,scki-fused-032-tools-domain,🔧 工具与服务","RULE-SET,scki-fused-033-ai-domain,🤖 AI 服务","RULE-SET,scki-fused-033-ai-ipcidr,🤖 AI 服务","RULE-SET,scki-fused-033-ai-ipcidr-no-resolve,🤖 AI 服务,no-resolve","RULE-SET,scki-fused-033-ai-residual,🤖 AI 服务","RULE-SET,scki-fused-034-google-domain,🔍 Google 服务","RULE-SET,scki-fused-035-ai-domain,🤖 AI 服务","RULE-SET,scki-fused-035-ai-ipcidr,🤖 AI 服务","RULE-SET,scki-fused-035-ai-residual,🤖 AI 服务","RULE-SET,scki-fused-036-crypto-domain,💰 加密货币","RULE-SET,scki-fused-036-crypto-residual,💰 加密货币","RULE-SET,scki-fused-037-payments-domain,🏦 金融支付","RULE-SET,scki-fused-037-payments-residual,🏦 金融支付","RULE-SET,scki-fused-039-intl-site-domain,🌐 国外网站","RULE-SET,scki-fused-040-direct-domain,DIRECT","RULE-SET,scki-fused-041-im-domain,💬 即时通讯","RULE-SET,scki-fused-041-im-ipcidr,💬 即时通讯","RULE-SET,scki-fused-041-im-ipcidr-no-resolve,💬 即时通讯,no-resolve","RULE-SET,scki-fused-041-im-residual,💬 即时通讯","RULE-SET,scki-fused-042-social-domain,📱 社交媒体","RULE-SET,scki-fused-042-social-ipcidr,📱 社交媒体","RULE-SET,scki-fused-042-social-ipcidr-no-resolve,📱 社交媒体,no-resolve","RULE-SET,scki-fused-042-social-residual,📱 社交媒体","RULE-SET,scki-fused-043-cn-site-domain,🏠 国内网站","RULE-SET,scki-fused-044-social-domain,📱 社交媒体","RULE-SET,scki-fused-045-work-domain,🧑‍💼 会议协作","RULE-SET,scki-fused-045-work-ipcidr,🧑‍💼 会议协作","RULE-SET,scki-fused-045-work-residual,🧑‍💼 会议协作","RULE-SET,scki-fused-046-direct-domain,DIRECT","RULE-SET,scki-fused-047-cnmedia-domain,📺 国内流媒体","RULE-SET,scki-fused-048-tiktok-domain,🎵 TikTok","RULE-SET,scki-fused-049-youtube-domain,📹 YouTube","RULE-SET,scki-fused-050-netflix-domain,🎥 Netflix","RULE-SET,scki-fused-050-netflix-ipcidr-no-resolve,🎥 Netflix,no-resolve","RULE-SET,scki-fused-051-disney-domain,🎬 Disney+","RULE-SET,scki-fused-051-disney-residual,🎬 Disney+","RULE-SET,scki-fused-052-hbo-max-domain,📡 HBO/Max","RULE-SET,scki-fused-052-hbo-max-residual,📡 HBO/Max","RULE-SET,scki-fused-053-hulu-domain,📺 Hulu","RULE-SET,scki-fused-053-hulu-residual,📺 Hulu","RULE-SET,scki-fused-054-prime-video-domain,🎬 Prime Video","RULE-SET,scki-fused-054-prime-video-residual,🎬 Prime Video","RULE-SET,scki-fused-055-intl-site-domain,🌐 国外网站","RULE-SET,scki-fused-055-intl-site-ipcidr,🌐 国外网站","RULE-SET,scki-fused-055-intl-site-residual,🌐 国外网站","RULE-SET,scki-fused-056-music-domain,🎵 音乐流媒体","RULE-SET,scki-fused-056-music-ipcidr,🎵 音乐流媒体","RULE-SET,scki-fused-057-stream-hk-domain,🇭🇰 香港流媒体","RULE-SET,scki-fused-057-stream-hk-ipcidr,🇭🇰 香港流媒体","RULE-SET,scki-fused-057-stream-hk-residual,🇭🇰 香港流媒体","RULE-SET,scki-fused-058-stream-tw-domain,🇹🇼 台湾流媒体","RULE-SET,scki-fused-058-stream-tw-residual,🇹🇼 台湾流媒体","RULE-SET,scki-fused-059-stream-jpkr-domain,🇯🇵 日韩流媒体","RULE-SET,scki-fused-059-stream-jpkr-ipcidr,🇯🇵 日韩流媒体","RULE-SET,scki-fused-059-stream-jpkr-residual,🇯🇵 日韩流媒体","RULE-SET,scki-fused-060-stream-eu-domain,🇪🇺 欧洲流媒体","RULE-SET,scki-fused-060-stream-eu-residual,🇪🇺 欧洲流媒体","RULE-SET,scki-fused-061-stream-other-domain,🌐 其他国外流媒体","RULE-SET,scki-fused-061-stream-other-ipcidr,🌐 其他国外流媒体","RULE-SET,scki-fused-061-stream-other-residual,🌐 其他国外流媒体","RULE-SET,scki-fused-062-tools-domain,🔧 工具与服务","RULE-SET,scki-fused-063-google-domain,🔍 Google 服务","RULE-SET,scki-fused-064-tools-domain,🔧 工具与服务","RULE-SET,scki-fused-064-tools-ipcidr,🔧 工具与服务","RULE-SET,scki-fused-064-tools-residual,🔧 工具与服务","RULE-SET,scki-fused-065-microsoft-domain,Ⓜ️ 微软服务","RULE-SET,scki-fused-065-microsoft-residual,Ⓜ️ 微软服务","RULE-SET,scki-fused-066-apple-domain,🍎 苹果服务","RULE-SET,scki-fused-066-apple-ipcidr,🍎 苹果服务","RULE-SET,scki-fused-066-apple-residual,🍎 苹果服务","RULE-SET,scki-fused-067-download-domain,📥 下载更新","RULE-SET,scki-fused-067-download-ipcidr,📥 下载更新","RULE-SET,scki-fused-067-download-residual,📥 下载更新","RULE-SET,scki-fused-068-tracker-domain,🛰️ BT/PT Tracker","RULE-SET,scki-fused-068-tracker-ipcidr,🛰️ BT/PT Tracker","RULE-SET,scki-fused-068-tracker-residual,🛰️ BT/PT Tracker","RULE-SET,scki-fused-069-gfw-domain,🚫 受限网站","RULE-SET,scki-fused-069-gfw-ipcidr,🚫 受限网站","RULE-SET,scki-fused-069-gfw-residual,🚫 受限网站","RULE-SET,scki-fused-070-game-cn-domain,🕹️ 国内游戏","RULE-SET,scki-fused-071-game-intl-domain,🎮 国外游戏","RULE-SET,scki-fused-071-game-intl-ipcidr,🎮 国外游戏","RULE-SET,scki-fused-071-game-intl-residual,🎮 国外游戏","RULE-SET,scki-fused-072-intl-site-domain,🌐 国外网站","RULE-SET,scki-fused-072-intl-site-ipcidr,🌐 国外网站","RULE-SET,scki-fused-072-intl-site-residual,🌐 国外网站","RULE-SET,scki-fused-073-payments-domain,🏦 金融支付","RULE-SET,scki-fused-074-cnmedia-domain,📺 国内流媒体","RULE-SET,scki-fused-074-cnmedia-ipcidr,📺 国内流媒体","RULE-SET,scki-fused-074-cnmedia-residual,📺 国内流媒体","RULE-SET,scki-fused-075-cn-site-domain,🏠 国内网站","RULE-SET,scki-fused-075-cn-site-ipcidr-no-resolve,🏠 国内网站,no-resolve","RULE-SET,scki-fused-076-direct-domain,DIRECT","RULE-SET,scki-fused-077-cn-site-domain,🏠 国内网站","RULE-SET,scki-fused-077-cn-site-residual,🏠 国内网站","RULE-SET,scki-fused-078-intl-site-domain,🌐 国外网站","RULE-SET,scki-fused-078-intl-site-ipcidr,🌐 国外网站","RULE-SET,scki-fused-078-intl-site-ipcidr-no-resolve,🌐 国外网站,no-resolve","RULE-SET,scki-fused-078-intl-site-residual,🌐 国外网站","RULE-SET,scki-fused-079-im-residual,💬 即时通讯","RULE-SET,scki-fused-080-netflix-residual,🎥 Netflix","RULE-SET,scki-fused-081-social-residual,📱 社交媒体","RULE-SET,scki-fused-082-google-residual,🔍 Google 服务","MATCH,🐟 漏网之鱼"]

function applyMihomoFusedRuleSets(config) {
  if (typeof SCKI_DISABLE_FUSED_RULESETS !== 'undefined' && SCKI_DISABLE_FUSED_RULESETS) return
  var providers = config['rule-providers'] || {}
  Object.keys(providers).forEach(function(key) { delete providers[key] })
  Object.keys(MIHOMO_FUSED_RULE_PROVIDERS).forEach(function(key) { providers[key] = MIHOMO_FUSED_RULE_PROVIDERS[key] })
  config['rule-providers'] = providers
  if (Array.isArray(config.rules)) {
    config.rules.splice.apply(config.rules, [0, config.rules.length].concat(MIHOMO_FUSED_RULES))
  } else {
    config.rules = MIHOMO_FUSED_RULES.slice()
  }
}
// END AUTO-GENERATED MIHOMO FUSED RULE-SETS

const REGION_ORDER = ['GLOBAL', 'HK', 'TW', 'SG', 'JPKR', 'APAC', 'US', 'EU', 'AMERICAS', 'AFRICA', 'OTHER']
const REGION_HOME_MAP = {
  GLOBAL: 'GLOBAL_HOME', HK: 'HK_HOME', TW: 'TW_HOME',
  SG: 'SG_HOME', JPKR: 'JPKR_HOME', APAC: 'APAC_HOME', US: 'US_HOME',
  EU: 'EU_HOME', AMERICAS: 'AMERICAS_HOME', AFRICA: 'AFRICA_HOME',
  OTHER: 'OTHER_HOME',
}

function withResidential(keys) {
  var result = []
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    if (SMART[key]) result.push(SMART[key])
    var homeKey = REGION_HOME_MAP[key]
    if (homeKey && SMART[homeKey]) result.push(SMART[homeKey])
  }
  return result
}

function buildStandardProxies() {
  return withResidential(REGION_ORDER).concat('DIRECT')
}

function buildHomeFirstProxies(keys) {
  var homes = []
  var full = []
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    var homeKey = REGION_HOME_MAP[key]
    if (homeKey && SMART[homeKey]) homes.push(SMART[homeKey])
  }
  for (var j = 0; j < keys.length; j++) {
    var fullKey = keys[j]
    if (SMART[fullKey]) full.push(SMART[fullKey])
  }
  return homes.concat(full, ['DIRECT'])
}

function buildRegionPreferredProxies(primaryKey) {
  var order = [primaryKey].concat(REGION_ORDER.filter(function(key) { return key !== primaryKey }))
  return withResidential(order).concat('DIRECT')
}

function buildDirectFirstProxies() {
  return ['DIRECT'].concat(withResidential(REGION_ORDER))
}

function buildTrackerProxies() {
  return ['REJECT', 'DIRECT'].concat(withResidential(['GLOBAL', 'HK', 'SG', 'APAC']))
}

function buildSeaProxies() {
  return withResidential(['SG', 'APAC', 'GLOBAL', 'HK', 'JPKR', 'US']).concat('DIRECT')
}

// ================================================================
//  模块 E：区域组创建（url-test，非 Smart 内核等价写法）
// ================================================================

function upsertUrlTestGroup(config, name, proxies) {
  var group = { name: name, type: 'url-test', url: 'https://www.gstatic.com/generate_204', interval: 300, tolerance: 10, lazy: true, proxies: proxies.slice() }
  var idx = config['proxy-groups'].findIndex(function(g) { return g && g.name === name })
  if (idx !== -1) { config['proxy-groups'][idx] = group } else { config['proxy-groups'].push(group) }
  log(`[${VERSION}] url-test: "${name}" -> ${proxies.length} nodes`)
}

// ================================================================
//  模块 F：业务策略组注入（33组）
// ================================================================

function injectBusinessGroups(config, activeSmartNames) {
  function filterActive(arr) {
    if (!activeSmartNames) return arr.slice()
    return arr.filter(function(p) { return activeSmartNames.has(p) })
  }
  var aiProxies = filterActive(buildHomeFirstProxies(REGION_ORDER))
  var standardProxies = filterActive(buildStandardProxies())
  var streamUsProxies = filterActive(buildRegionPreferredProxies('US'))
  var streamHkProxies = filterActive(buildRegionPreferredProxies('HK'))
  var streamTwProxies = filterActive(buildRegionPreferredProxies('TW'))
  var streamJpProxies = filterActive(buildRegionPreferredProxies('JPKR'))
  var streamEuProxies = filterActive(buildRegionPreferredProxies('EU'))
  var directFirstProxies = filterActive(buildDirectFirstProxies())
  var trackerProxies = filterActive(buildTrackerProxies())
  var seaProxies = filterActive(buildSeaProxies())
  var groups = [
    { name: BIZ.AI, type: 'select', proxies: aiProxies.slice() },
    { name: BIZ.CRYPTO, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.PAYMENTS, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.IM, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.SOCIAL, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.WORK, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.CNMEDIA, type: 'select', proxies: directFirstProxies.slice() },
    { name: BIZ.TOK, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.NFLX, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.DSNP, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.HBO, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.HULU, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.PRIME, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.YT, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.MUSIC, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.STREAM_HK, type: 'select', proxies: streamHkProxies.slice() },
    { name: BIZ.STREAM_TW, type: 'select', proxies: streamTwProxies.slice() },
    { name: BIZ.STREAM_JP, type: 'select', proxies: streamJpProxies.slice() },
    { name: BIZ.STREAM_EU, type: 'select', proxies: streamEuProxies.slice() },
    { name: BIZ.STREAM_OTHER, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.GAME_CN, type: 'select', proxies: directFirstProxies.slice() },
    { name: BIZ.GAME_INTL, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.GOOGLE, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.TOOLS, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.MS, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.APPLE, type: 'select', proxies: directFirstProxies.slice() },
    { name: BIZ.DOWNLOAD, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.TRACKER, type: 'select', proxies: trackerProxies.slice() },
    { name: BIZ.CN_SITE, type: 'select', proxies: directFirstProxies.slice() },
    { name: BIZ.GFW, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.INTL_SITE, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.FINAL, type: 'select', proxies: standardProxies.slice() },
    { name: BIZ.AD, type: 'select', proxies: ['REJECT', 'DIRECT'] },
  ]
  var _smartNameSet = new Set(Object.values(SMART))
  var firstSmartIdx = config['proxy-groups'].findIndex(function(g) { return g && _smartNameSet.has(g.name) })
  groups.forEach(function(group, i) {
    var existIdx = config['proxy-groups'].findIndex(function(g) { return g && g.name === group.name })
    if (existIdx !== -1) { config['proxy-groups'][existIdx] = group }
    else if (firstSmartIdx !== -1) { config['proxy-groups'].splice(firstSmartIdx + i, 0, group) }
    else { config['proxy-groups'].push(group) }
  })
  log(`[${VERSION}] Injected ${groups.length} business groups`)
}

// ================================================================
function cleanupSubscription(config) {
  // FlClash: 必须用原地修改（splice/length=0），不能重新赋值（= []）。
  //    QuickJS ↔ Dart FFI 桥接层：若创建新数组，Dart 端仍持有旧引用 → 修改丢失。
  //    旧注释(v5.2.6-normal.1 FIX#26-P0): 4 关键词黑名单无法清除机场模板 → 全量重建。
  var removed = (config['proxy-groups'] || []).length
  if (config['proxy-groups'] && config['proxy-groups'].length > 0) {
    config['proxy-groups'].splice(0, config['proxy-groups'].length)
  }
  if (config.rules && config.rules.length > 0) config.rules.splice(0, config.rules.length)
  if (config['rule-providers'] && Object.prototype.toString.call(config['rule-providers']) === '[object Object]') {
    Object.keys(config['rule-providers']).forEach(function(k) { delete config['rule-providers'][k] })
  } else config['rule-providers'] = {}
  log(`[${VERSION}] Cleared ${removed} subscription proxy-groups; rebuilt from Smart-Config-Kit baseline`)
}
// ================================================================
//  模块 K：注入智能 TLS 指纹
// ================================================================

function sortProxyGroups(config) {
  const bizGroups = [], smartGroups = [], otherGroups = []
  const bizNames = new Set(Object.values(BIZ))
  const smartNames = new Set(Object.values(SMART))
  config['proxy-groups'].forEach(g => {
    if (!g || !g.name) return
    if (bizNames.has(g.name)) { bizGroups.push(g) }
    else if (smartNames.has(g.name)) { smartGroups.push(g) }
    else { otherGroups.push(g) }
  })
  const bizOrder = Object.values(BIZ)
  bizGroups.sort((a, b) => bizOrder.indexOf(a.name) - bizOrder.indexOf(b.name))
  const smartOrder = Object.values(SMART)
  smartGroups.sort((a, b) => { const ia = smartOrder.indexOf(a.name); const ib = smartOrder.indexOf(b.name); return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) })
  // FlClash: 必须原地修改，不能重新赋值（QuickJS FFI 桥接层限制）
  var globalGroup = null, restSmartGroups = []
  for (var s = 0; s < smartGroups.length; s++) {
    if (smartGroups[s].name === SMART.GLOBAL) { globalGroup = smartGroups[s] }
    else { restSmartGroups.push(smartGroups[s]) }
  }
  config['proxy-groups'].splice(0, config['proxy-groups'].length)
  if (globalGroup) { config['proxy-groups'].push(globalGroup) }
  for (var i = 0; i < bizGroups.length; i++) { config['proxy-groups'].push(bizGroups[i]) }
  for (var j = 0; j < restSmartGroups.length; j++) { config['proxy-groups'].push(restSmartGroups[j]) }
  for (var k = 0; k < otherGroups.length; k++) { config['proxy-groups'].push(otherGroups[k]) }
}

// ================================================================
//  主函数
// ================================================================

function sckiRoutingMain(config) {
  try {

    SckiTrafficOptions.validate({ healthCheckProfile: SCKI_HEALTH_CHECK_PROFILE, quicPolicy: SCKI_QUIC_POLICY, zeroTierPlanetProxy: SCKI_ZEROTIER_PLANET_PROXY })
    var nodePlan = SckiSubscriptionNodeFilter.preflight(config, Object.values(SMART).concat(Object.values(BIZ)), SCKI_MAX_NODE_MULTIPLIER)
    if (!nodePlan.ok) {
      throw new Error('Node preflight rejected: ' + nodePlan.reason + '; flatten provider subscriptions in SubStore first')
    }
    if (SCKI_ZEROTIER_PLANET_PROXY) {
      SckiTrafficOptions.requireZeroTierPlanetProxyTarget(true, classifyAllNodes(nodePlan.proxies).US.length ? [SMART.US] : [])
    }
    if (nodePlan.sourceCount === 0 && nodePlan.flattenedProviders === 0) throw new Error('Meow adapter requires inline proxy nodes; import or flatten a subscription first')
    // Preflight is side-effect free; keep FlClash's source array reference when committing it.
    if (!Array.isArray(config.proxies)) config.proxies = []
    else config.proxies.splice(0, config.proxies.length)
    for (var np = 0; np < nodePlan.proxies.length; np++) config.proxies.push(nodePlan.proxies[np])
    if (nodePlan.flattenedProviders > 0) delete config['proxy-providers']
    log(`[${VERSION}] Node filter kept=${nodePlan.proxies.length} inline=${nodePlan.flattenedNodes} providers=${nodePlan.flattenedProviders} info=${nodePlan.removedInfo} multiplier=${nodePlan.removedRate} duplicate=${nodePlan.duplicates}`)
    log(`[${VERSION}] Start processing, ${config.proxies.length} proxies`)
    if (!Array.isArray(config['proxy-groups'])) config['proxy-groups'] = []
    if (!Array.isArray(config.rules)) config.rules = []
    cleanupSubscription(config)
    var c = classifyAllNodes(config.proxies)
    log(`[${VERSION}] Classification: ALL=${c.ALL.length} HOME_ALL=${c.HOME_ALL.length} HK=${c.HK.length}/${c.HOME_HK.length} TW=${c.TW.length}/${c.HOME_TW.length} CN=${c.CN.length}/${c.HOME_CN.length} JP=${c.JP.length}/${c.HOME_JP.length} KR=${c.KR.length}/${c.HOME_KR.length} SG=${c.SG.length}/${c.HOME_SG.length} US=${c.US.length}/${c.HOME_US.length} EU=${c.EU.length}/${c.HOME_EU.length} AM=${c.AM.length}/${c.HOME_AM.length} AF=${c.AF.length}/${c.HOME_AF.length} APAC_OTHER=${c.APAC_OTHER.length}/${c.HOME_APAC_OTHER.length} OTHER=${c.OTHER.length}/${c.HOME_OTHER.length}`)
    var jpkrNodes = c.JP.concat(c.KR)
    // v5.4.1 FIX: SG 同时存在于狮城组（独立）和亚太组（对标 US 在 美洲组）
    var apacNodes = c.HK.concat(c.TW, c.CN, c.JP, c.KR, c.SG, c.APAC_OTHER)
    var americasNodes = c.US.concat(c.AM)
    var homeJpkrNodes = c.HOME_JP.concat(c.HOME_KR)
    var homeApacNodes = c.HOME_HK.concat(c.HOME_TW, c.HOME_CN, c.HOME_JP, c.HOME_KR, c.HOME_SG, c.HOME_APAC_OTHER)
    var homeAmericasNodes = c.HOME_US.concat(c.HOME_AM)
    if (c.ALL.length) upsertUrlTestGroup(config, SMART.GLOBAL, c.ALL)
    else config['proxy-groups'].push({ name: SMART.GLOBAL, type: 'select', proxies: ['REJECT'] })
    if (c.HOME_ALL.length > 0) upsertUrlTestGroup(config, SMART.GLOBAL_HOME, c.HOME_ALL)
    // v5.2.8-normal.2: 全部/家宽区域统一空组不创建，避免静默回退污染家宽或地区语义
    //   （与 Smart 版同步修复。SMART.GLOBAL 始终存在兜底）
    if (c.HK.length > 0) upsertUrlTestGroup(config, SMART.HK, c.HK)
    if (c.HOME_HK.length > 0) upsertUrlTestGroup(config, SMART.HK_HOME, c.HOME_HK)
    if (c.TW.length > 0) upsertUrlTestGroup(config, SMART.TW, c.TW)
    if (c.HOME_TW.length > 0) upsertUrlTestGroup(config, SMART.TW_HOME, c.HOME_TW)
    if (c.SG.length > 0) upsertUrlTestGroup(config, SMART.SG, c.SG)
    if (c.HOME_SG.length > 0) upsertUrlTestGroup(config, SMART.SG_HOME, c.HOME_SG)
    if (jpkrNodes.length > 0) upsertUrlTestGroup(config, SMART.JPKR, jpkrNodes)
    if (homeJpkrNodes.length > 0) upsertUrlTestGroup(config, SMART.JPKR_HOME, homeJpkrNodes)
    if (apacNodes.length > 0) upsertUrlTestGroup(config, SMART.APAC, apacNodes)
    if (homeApacNodes.length > 0) upsertUrlTestGroup(config, SMART.APAC_HOME, homeApacNodes)
    if (c.US.length > 0) upsertUrlTestGroup(config, SMART.US, c.US)
    if (c.HOME_US.length > 0) upsertUrlTestGroup(config, SMART.US_HOME, c.HOME_US)
    if (c.EU.length > 0) upsertUrlTestGroup(config, SMART.EU, c.EU)
    if (c.HOME_EU.length > 0) upsertUrlTestGroup(config, SMART.EU_HOME, c.HOME_EU)
    if (americasNodes.length > 0) upsertUrlTestGroup(config, SMART.AMERICAS, americasNodes)
    if (homeAmericasNodes.length > 0) upsertUrlTestGroup(config, SMART.AMERICAS_HOME, homeAmericasNodes)
    if (c.AF.length > 0) upsertUrlTestGroup(config, SMART.AFRICA, c.AF)
    if (c.HOME_AF.length > 0) upsertUrlTestGroup(config, SMART.AFRICA_HOME, c.HOME_AF)
    if (c.OTHER.length > 0) upsertUrlTestGroup(config, SMART.OTHER, c.OTHER)
    if (c.HOME_OTHER.length > 0) upsertUrlTestGroup(config, SMART.OTHER_HOME, c.HOME_OTHER)

    // 收集实际创建的区域组名（按 SMART 常量名匹配），过滤业务组的 proxy 引用
    var activeSmartNames = new Set(config['proxy-groups'].filter(function(g) { return g && g.type === 'url-test' }).map(function(g) { return g.name }))
    activeSmartNames.add('DIRECT'); activeSmartNames.add('REJECT')
    activeSmartNames.add(SMART.GLOBAL)
    log(`[${VERSION}] Active url-test region groups: ${[...activeSmartNames].filter(function(n) { return n !== 'DIRECT' && n !== 'REJECT' }).join(', ')}`)

    injectBusinessGroups(config, activeSmartNames)
    applyMihomoFusedRuleSets(config)
    SckiTrafficOptions.applyHealthCheckProfile(config, SCKI_HEALTH_CHECK_PROFILE, 'normal')
    SckiTrafficOptions.applyQuicPolicy(config.rules, SCKI_QUIC_POLICY)
    SckiTrafficOptions.applyZeroTierPlanetProxy(config.rules, SCKI_ZEROTIER_PLANET_PROXY, config['proxy-groups'].map(function(group) { return group.name }))
    sortProxyGroups(config)
    log(`[${VERSION}] Done! Groups: ${config['proxy-groups'].length}, Rules: ${config.rules.length}, Providers: ${Object.keys(config['rule-providers']).length}`)
    return config
  } catch (e) {
    throw e
  }
}

const SCKI_AEROVE_RULE_SPLITS = {"scki-fused-010-ad-domain":[{"id":"scki-fused-010-ad-domain-aerove-part-001","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Meow%E5%86%85%E6%A0%B8%E7%B3%BB/Aerove%20Lite/rule-assets/scki-fused-010-ad-domain-aerove-part-001.mrs?scki=v6.0.20-meow.5","cache_path":"./ruleset/v6.0.20-meow.5/scki-fused-010-ad-domain-aerove-part-001.mrs"},{"id":"scki-fused-010-ad-domain-aerove-part-002","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Meow%E5%86%85%E6%A0%B8%E7%B3%BB/Aerove%20Lite/rule-assets/scki-fused-010-ad-domain-aerove-part-002.mrs?scki=v6.0.20-meow.5","cache_path":"./ruleset/v6.0.20-meow.5/scki-fused-010-ad-domain-aerove-part-002.mrs"},{"id":"scki-fused-010-ad-domain-aerove-part-003","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Meow%E5%86%85%E6%A0%B8%E7%B3%BB/Aerove%20Lite/rule-assets/scki-fused-010-ad-domain-aerove-part-003.mrs?scki=v6.0.20-meow.5","cache_path":"./ruleset/v6.0.20-meow.5/scki-fused-010-ad-domain-aerove-part-003.mrs"},{"id":"scki-fused-010-ad-domain-aerove-part-004","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Meow%E5%86%85%E6%A0%B8%E7%B3%BB/Aerove%20Lite/rule-assets/scki-fused-010-ad-domain-aerove-part-004.mrs?scki=v6.0.20-meow.5","cache_path":"./ruleset/v6.0.20-meow.5/scki-fused-010-ad-domain-aerove-part-004.mrs"}],"scki-fused-075-cn-site-domain":[{"id":"scki-fused-075-cn-site-domain-aerove-part-001","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Meow%E5%86%85%E6%A0%B8%E7%B3%BB/Aerove%20Lite/rule-assets/scki-fused-075-cn-site-domain-aerove-part-001.mrs?scki=v6.0.20-meow.5","cache_path":"./ruleset/v6.0.20-meow.5/scki-fused-075-cn-site-domain-aerove-part-001.mrs"},{"id":"scki-fused-075-cn-site-domain-aerove-part-002","url":"https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Meow%E5%86%85%E6%A0%B8%E7%B3%BB/Aerove%20Lite/rule-assets/scki-fused-075-cn-site-domain-aerove-part-002.mrs?scki=v6.0.20-meow.5","cache_path":"./ruleset/v6.0.20-meow.5/scki-fused-075-cn-site-domain-aerove-part-002.mrs"}]}
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
// DNS rule-set references cannot survive replacement of subscription providers.
function sckiAssertIndependentDns(value) {
  function check(text) {
    if (/(^|,)\s*rule-set\s*[:,]/i.test(text)) throw new Error('DNS rule-set dependency would be replaced: ' + text + '; use independent DNS policies before applying this adapter')
  }
  if (typeof value === 'string') check(value)
  else if (value && typeof value === 'object') Object.keys(value).forEach(function (key) { check(key); sckiAssertIndependentDns(value[key]) })
}
// JSON object in/out for clients with a main(config) script host. Never commit a
// partly rewritten input; the App owns validation of nodes and platform fields.
function main(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Expected a Meow configuration object')
  sckiAssertIndependentDns(config.dns)
  return projectAeroveRouting(sckiRoutingMain(JSON.parse(JSON.stringify(config))), SCKI_AEROVE_RULE_SPLITS)
}
