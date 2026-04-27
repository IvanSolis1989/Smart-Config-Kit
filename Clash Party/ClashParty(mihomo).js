// Clash 普通内核覆写脚本 - SUB-STORE 多机场精细分流版（非 Smart 内核）
// 版本：v5.3.0-normal.2 (2026-04-28)
// 架构：SUB-STORE 多机场融合 + 18 url-test 区域组（9 全部 + 9 家宽）+ 31 业务策略组（含 13 流媒体平台组）+ 371+ rule-providers 100%+ 服务覆盖
// 基线：Clash Party v5.3.0（与同目录 ClashParty(mihomo-smart).js 规则 100% 等价，仅 18 区域组从 smart 改为 url-test）
// 适用：Mihomo / Clash.Meta 稳定版内核、不支持 smart + LightGBM 的分支；也适用于想完全关闭 ML 评估的用户
// 变更历史：见 `Clash Party/CHANGELOG.md`

// ================================================================
//  版本常量
// ================================================================

const VERSION = 'v5.3.0-normal.2'

// ================================================================
//  模块 A：节点过滤 / 家宽识别
// ================================================================

function isInfoNode(name) {
  const infoPatterns = ['导航网址', '距离下次重置', '剩余流量', '套餐到期', '网址导航', '官网', '订阅', '到期', '剩余', '重置']
  const s = String(name || '')
  return infoPatterns.some(p => s.includes(p))
}

const RESIDENTIAL_PATTERNS = [
  /家宽|家庭宽带|家庭住宅|住宅宽带|住宅|宽带/,
  /\bresi(?:dential)?\b/i,
  /\bhome(?:\s|-|_)?ip\b/i,
  /\bhome(?:\s|-|_)?broadband\b/i,
  /\bbroadband\b/i,
  /\bisp\b/i,
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
  { id: 'HK', kw: ['香港', 'hong kong', 'hongkong', 'hkg'], iso: ['HK'] },
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
function _isChinese(str) { return /[\u4e00-\u9fa5]/.test(str) }

const _compiledRegions = REGION_DB.map(function(region) {
  var matchers = []
  for (var i = 0; i < region.iso.length; i++) {
    matchers.push({ type: 'iso', regex: _getWordBoundaryRegex(region.iso[i], true) })
  }
  for (var j = 0; j < region.kw.length; j++) {
    var kw = region.kw[j]
    if (_isChinese(kw)) { matchers.push({ type: 'cn', text: kw }) }
    else { matchers.push({ type: 'en', regex: _getWordBoundaryRegex(kw, false) }) }
  }
  return { id: region.id, matchers: matchers }
})

function classifyNode(name) {
  var nameStr = String(name || '')
  if (!nameStr) return null
  for (var i = 0; i < _compiledRegions.length; i++) {
    var region = _compiledRegions[i]
    for (var j = 0; j < region.matchers.length; j++) {
      var m = region.matchers[j]
      if (m.type === 'cn') { if (nameStr.indexOf(m.text) !== -1) return region.id }
      else { if (m.regex.test(nameStr)) return region.id }
    }
  }
  return null
}

function classifyAllNodes(proxies) {
  var result = {
    HK: [], TW: [], CN: [], JP: [], KR: [], SG: [], US: [], EU: [], AM: [], AF: [], APAC_OTHER: [], UNCLASSIFIED: [], ALL: [],
    HOME_HK: [], HOME_TW: [], HOME_CN: [], HOME_JP: [], HOME_KR: [], HOME_SG: [], HOME_US: [], HOME_EU: [], HOME_AM: [], HOME_AF: [], HOME_APAC_OTHER: [], HOME_UNCLASSIFIED: [], HOME_ALL: [],
  }
  for (var i = 0; i < proxies.length; i++) {
    var p = proxies[i]
    if (!p || typeof p !== 'object' || !p.name) continue
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
      result.UNCLASSIFIED.push(name)
      if (isHome) result.HOME_UNCLASSIFIED.push(name)
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
  JPKR: '🇯🇵 日韩节点', JPKR_HOME: '🏡 日韩家宽',
  APAC: '🌏 亚太节点', APAC_HOME: '🏡 亚太家宽',
  US: '🇺🇸 美国节点', US_HOME: '🏡 美国家宽',
  EU: '🇪🇺 欧洲节点', EU_HOME: '🏡 欧洲家宽',
  AMERICAS: '🌎 美洲节点', AMERICAS_HOME: '🏡 美洲家宽',
  AFRICA: '🌍 非洲节点', AFRICA_HOME: '🏡 非洲家宽',
}

const BIZ = {
  AI: '🤖 AI 服务', CRYPTO: '💰 加密货币', PAYMENTS: '🏦 金融支付',
  IM: '💬 即时通讯', SOCIAL: '📱 社交媒体',
  WORK: '🧑‍💼 会议协作', CNMEDIA: '📺 国内流媒体',
  NFLX: '🎥 Netflix', DSNP: '🎬 Disney+', HBO: '📡 HBO/Max',
  HULU: '📺 Hulu', PRIME: '🎬 Prime Video',
  YT: '📹 YouTube', MUSIC: '🎵 音乐流媒体',
  STREAM_HK: '🇭🇰 香港流媒体', STREAM_TW: '🇹🇼 台湾流媒体',
  STREAM_JP: '🇯🇵 日韩流媒体', STREAM_EU: '🇪🇺 欧洲流媒体',
  STREAM_OTHER: '🌐 其他国外流媒体',
  GAME_CN: '🕹️ 国内游戏', GAME_INTL: '🎮 国外游戏',
  TOOLS: '🔧 工具与服务', MS: 'Ⓜ️ 微软服务', APPLE: '🍎 苹果服务',
  DOWNLOAD: '📥 下载更新', TRACKER: '🛰️ BT/PT Tracker',
  CN_SITE: '🏠 国内网站',
  GFW: '🚫 受限网站', INTL_SITE: '🌐 国外网站',
  FINAL: '🐟 漏网之鱼', AD: '🛑 广告拦截',
}

const REGION_ORDER = ['GLOBAL', 'HK', 'TW', 'JPKR', 'APAC', 'US', 'EU', 'AMERICAS', 'AFRICA']
const REGION_HOME_MAP = {
  GLOBAL: 'GLOBAL_HOME', HK: 'HK_HOME', TW: 'TW_HOME',
  JPKR: 'JPKR_HOME', APAC: 'APAC_HOME', US: 'US_HOME',
  EU: 'EU_HOME', AMERICAS: 'AMERICAS_HOME', AFRICA: 'AFRICA_HOME',
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
  return ['REJECT', 'DIRECT'].concat(withResidential(['GLOBAL', 'HK', 'APAC']))
}

function buildSeaProxies() {
  return withResidential(['APAC', 'GLOBAL', 'HK', 'JPKR', 'US']).concat('DIRECT')
}

// v5.1.2: GeoRouting 区域列表（module-level，供 providers + rules 共用）
// ★ FIX#1: Asia_China 从 INTL 循环剥离，单独映射 CN_SITE（v5.1.1 误将中国域名/IP 路由到国外网站）
const GEO_REGIONS_ALL = [
  'Asia_East', 'Asia_EastSouth', 'Asia_South', 'Asia_Central', 'Asia_West',
  'Asia_China',
  'America_North', 'America_South',
  'Europe_West', 'Europe_East',
  'Oceania', 'Antarctica',
  'Africa_North', 'Africa_South', 'Africa_West', 'Africa_East', 'Africa_Central'
]
const GEO_REGIONS_INTL = GEO_REGIONS_ALL.filter(r => r !== 'Asia_China')

// ================================================================
//  模块 E：区域组创建（url-test，非 Smart 内核等价写法）
// ================================================================

function upsertSmartGroup(config, name, proxies) {
  var group = { name: name, type: 'url-test', url: 'https://www.gstatic.com/generate_204', interval: 120, tolerance: 30, lazy: true, proxies: proxies.slice() }
  var idx = config['proxy-groups'].findIndex(function(g) { return g && g.name === name })
  if (idx !== -1) { config['proxy-groups'][idx] = group } else { config['proxy-groups'].push(group) }
  console.log(`[${VERSION}] url-test: "${name}" -> ${proxies.length} nodes`)
}

// ================================================================
//  模块 F：业务策略组注入（28组）
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
  console.log(`[${VERSION}] Injected ${groups.length} business groups`)
}

// ================================================================
//  模块 G：rule-providers 注入（v5.0: 326 providers）
// ================================================================

function injectRuleProviders(config) {
  if (!config['rule-providers']) config['rule-providers'] = {}

  // v5.1.6 P0-FIX#2: CDN 切换（raw.githubusercontent.com → fastly.jsdelivr.net）消除启动 EOF 风暴
  const META = 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo'
  // v5.1.8 PERF#2: BM7 常量移至下方 CDN 混合策略区块（BM7_FASTLY + BM7_CF）
  const ACC  = 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main'

  // v5.1.6 P0-FIX#1: 所有 rule-providers 走代理下载，避免 DIRECT 在墙内环境拉取失败
  // v5.2.1 FIX: jsdelivr 和 rule-provider 下载走受限网站组（中国用代理，印尼用直连）
  const RP_PROXY = BIZ.GFW

  const RP_BASE = 85500
  const RP_STEP = 15
  let _rpIdx = 0
  // v5.1.8 PERF#2: 随机抖动 0~59s 打破整齐步长的周期性并发浪峰
  const nextInterval = () => RP_BASE + ((_rpIdx++) * RP_STEP) + Math.floor(Math.random() * 60)

  // v5.1.8 PERF#2: bm7 CDN 混合策略（奇偶轮替 Fastly / Cloudflare，分散 EOF 风暴）
  const BM7_FASTLY = 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash'
  const BM7_CF     = 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash'
  let _bm7Idx = 0

  const metaDomain = (id, name) => {
    config['rule-providers'][id] = { type: 'http', behavior: 'domain', format: 'mrs', url: `${META}/geosite/${name}.mrs`, path: `./ruleset/meta-${name}.mrs`, interval: nextInterval(), proxy: RP_PROXY }
  }
  const metaIpCidr = (id, name) => {
    config['rule-providers'][id] = { type: 'http', behavior: 'ipcidr', format: 'mrs', url: `${META}/geoip/${name}.mrs`, path: `./ruleset/meta-ip-${name}.mrs`, interval: nextInterval(), proxy: RP_PROXY }
  }
  const bm7 = (id, name) => {
    const cdn = ((_bm7Idx++) % 2 === 0) ? BM7_FASTLY : BM7_CF
    config['rule-providers'][id] = { type: 'http', behavior: 'classical', url: `${cdn}/${name}/${name}.yaml`, path: `./ruleset/bm7-${name}.yaml`, interval: nextInterval(), proxy: RP_PROXY }
  }
  const bm7Custom = (id, dir, file) => {
    const cdn = ((_bm7Idx++) % 2 === 0) ? BM7_FASTLY : BM7_CF
    config['rule-providers'][id] = { type: 'http', behavior: 'classical', url: `${cdn}/${dir}/${file}.yaml`, path: `./ruleset/bm7-${id}.yaml`, interval: nextInterval(), proxy: RP_PROXY }
  }

  // ============ #1 广告拦截 ============
  // v5.1.7 PERF: anti-ad → DustinWin ads.mrs（同源 privacy-protection-tools/anti-AD，domain behavior + mrs format）
  // 备选方案（若 DustinWin .mrs 源不可用，取消下方注释并注释掉 mrs 版本）：
  //   config['rule-providers']['anti-ad'] = { type: 'http', behavior: 'domain', url: 'https://anti-ad.net/clash.yaml', path: './ruleset/anti-ad.yaml', interval: nextInterval(), proxy: RP_PROXY }
  config['rule-providers']['anti-ad'] = { type: 'http', behavior: 'domain', format: 'mrs', url: 'https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@mihomo-ruleset/ads.mrs', path: './ruleset/anti-ad.mrs', interval: nextInterval(), proxy: RP_PROXY }

  // ============ #2~5 AI 服务 ============
  metaDomain('openai', 'openai')
  bm7('claude',  'Claude')
  bm7('gemini',  'Gemini')
  bm7('copilot', 'Copilot')

  // ============ #6 加密货币 ============
  bm7('cryptocurrency', 'Cryptocurrency')

  // ============ #7~12 即时通讯 ============
  metaDomain('telegram', 'telegram')
  metaIpCidr('telegram-ip', 'telegram')
  bm7('discord', 'Discord')
  bm7('line', 'Line')
  bm7('whatsapp', 'Whatsapp')
  bm7('kakaotalk', 'KakaoTalk')

  // ============ #13~22 社交媒体 ============
  metaDomain('twitter', 'twitter')
  metaIpCidr('twitter-ip', 'twitter')
  metaDomain('tiktok', 'tiktok')
  bm7('reddit', 'Reddit')
  bm7('facebook', 'Facebook')
  bm7('instagram', 'Instagram')
  // v5.2.3 FIX: Snap 规则改用 Meta geosite（兼容 mihomo，不再触发 USER-AGENT,TikTok* 解析警告）
  // bm7 Apple 相关 provider 含格式错误 IP-CIDR（多余空格），每次 reload 产生 warning，不影响功能
  // v5.2.4 FIX#22-P0: MetaCubeX geosite 的实际文件名是 `snap.mrs` 不是 `snapchat.mrs`，
  //   之前 metaDomain('snapchat','snapchat') 会产生 [Provider] snapchat pull error: 403 Forbidden
  metaDomain('snapchat', 'snap')
  bm7('pinterest', 'Pinterest')
  bm7('linkedin', 'LinkedIn')
  metaIpCidr('facebook-ip', 'facebook')

  // ============ #23~25 会议协作 ============
  bm7('slack', 'Slack')
  config['rule-providers']['zoom'] = { type: 'http', behavior: 'classical', url: 'https://fastly.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/Providers/Ruleset/Zoom.yaml', path: './ruleset/acl4ssr-Zoom.yaml', interval: nextInterval(), proxy: RP_PROXY }
  bm7('teams', 'Teams')

  // ============ #26~29 搜索引擎 ============
  metaDomain('google', 'google')
  metaIpCidr('google-ip', 'google')
  bm7('bing', 'Bing')
  bm7('googlesearch', 'GoogleSearch')

  // ============ #30~41 美国流媒体 ============
  metaDomain('youtube', 'youtube')
  metaDomain('netflix', 'netflix')
  metaIpCidr('netflix-ip', 'netflix')
  metaDomain('spotify', 'spotify')
  bm7('disney', 'Disney')
  bm7('hbo', 'HBO')
  bm7('primevideo', 'PrimeVideo')
  bm7('hulu', 'Hulu')
  bm7('paramount', 'ParamountPlus')
  bm7('amazon', 'Amazon')
  bm7('peacock', 'Peacock')
  bm7('twitch', 'Twitch')

  // ============ #42~43 台湾流媒体 ============
  metaDomain('bahamut', 'bahamut')
  bm7('kktv', 'KKTV')

  // ============ #44~45 日韩流媒体 ============
  metaDomain('abema', 'abema')
  bm7('dazn', 'DAZN')

  // ============ #46 欧洲流媒体 ============
  // v5.2.3 FIX: BBC 规则改用 Meta geosite（兼容 mihomo，不再触发 USER-AGENT,BBCiPlayer* 解析警告）
  metaDomain('bbc', 'bbc')

  // ============ #47~53 国外游戏 ============
  bm7('steam', 'Steam')
  bm7('epic', 'Epic')
  bm7('playstation', 'PlayStation')
  bm7('nintendo', 'Nintendo')
  bm7('xbox', 'Xbox')
  bm7('ea', 'EA')
  bm7('blizzard', 'Blizzard')

  // ============ #54~55 微软服务 ============
  metaDomain('microsoft', 'microsoft')
  metaDomain('onedrive', 'onedrive')

  // ============ #56~58 苹果服务 ============
  metaDomain('apple', 'apple')
  metaDomain('icloud', 'icloud')
  bm7('applemusic', 'AppleMusic')

  // ============ #59~61 开发者服务 ============
  metaDomain('github', 'github')
  bm7('docker', 'Docker')
  bm7('gitlab', 'GitLab')

  // ============ #62 金融支付 ============
  bm7('paypal', 'PayPal')

  // ============ #63~65 云与CDN ============
  metaIpCidr('cloudflare-ip', 'cloudflare')
  metaIpCidr('cloudfront-ip', 'cloudfront')
  metaIpCidr('fastly-ip', 'fastly')

  // ============ #66 下载更新 ============
  bm7('systemota', 'SystemOTA')

  // ============ #67 东南亚流媒体 ============
  bm7('viu', 'ViuTV')

  // ============ #68~69 国内流媒体 ============
  metaDomain('bilibili', 'bilibili')
  metaDomain('biliintl', 'biliintl')

  // ============ #70~72 国内/国外兜底 ============
  metaDomain('cn', 'cn')
  metaIpCidr('cn-ip', 'cn')
  metaDomain('proxy', 'geolocation-!cn')

    // ============ v5.0 新增 254 providers (bm7) ============
    bm7('advertising', 'Advertising')
    bm7('advertisingmitv', 'AdvertisingMiTV')
    bm7('adobeactivation', 'AdobeActivation')
    bm7('blockhttpdns', 'BlockHttpDNS')
    bm7('domob', 'Domob')
    bm7('hijacking', 'Hijacking')
    bm7('jiguangtuisong', 'JiGuangTuiSong')
    bm7('marketing', 'Marketing')
    bm7('miuiprivacy', 'MIUIPrivacy')
    bm7('privacy', 'Privacy')
    bm7('youmengchuangxiang', 'YouMengChuangXiang')
    bm7('civitai', 'Civitai')
    bm7('binance', 'Binance')
    bm7('stripe', 'Stripe')
    bm7('visa', 'VISA')
    bm7('tigerfintech', 'TigerFintech')
    bm7('mail', 'Mail')
    bm7('mailru', 'Mailru')
    bm7('protonmail', 'Protonmail')
    bm7('spark', 'Spark')
    bm7('telegramnl', 'TelegramNL')
    bm7('telegramsg', 'TelegramSG')
    bm7('telegramus', 'TelegramUS')
    bm7('zalo', 'Zalo')
    bm7('googlevoice', 'GoogleVoice')
    bm7('italkbb', 'iTalkBB')
    bm7('tumblr', 'Tumblr')
    bm7('clubhouse', 'Clubhouse')
    bm7('clubhouseip', 'ClubhouseIP')
    bm7('pixiv', 'Pixiv')
    bm7('truthsocial', 'TruthSocial')
    bm7('vk', 'VK')
    bm7('blued', 'Blued')
    bm7('disqus', 'Disqus')
    bm7('imgur', 'Imgur')
    bm7('pixnet', 'Pixnet')
    bm7('atlassian', 'Atlassian')
    bm7('notion', 'Notion')
    bm7('teamviewer', 'TeamViewer')
    bm7('zoho', 'Zoho')
    bm7('salesforce', 'Salesforce')
    bm7('zendesk', 'Zendesk')
    bm7('intercom', 'Intercom')
    bm7('remotedesktop', 'RemoteDesktop')
    bm7('iqiyi', 'iQIYI')
    bm7('youku', 'Youku')
    bm7('tencentvideo', 'TencentVideo')
    bm7('douyin', 'DouYin')
    bm7('bytedance', 'ByteDance')
    bm7('kuaishou', 'KuaiShou')
    bm7('weibo', 'Weibo')
    bm7('xiaohongshu', 'XiaoHongShu')
    bm7('neteasemusic', 'NetEaseMusic')
    bm7('kugoukuwo', 'KugouKuwo')
    bm7('sohu', 'Sohu')
    bm7('acfun', 'AcFun')
    bm7('douyu', 'Douyu')
    bm7('huya', 'HuYa')
    bm7('himalaya', 'Himalaya')
    bm7('cctv', 'CCTV')
    bm7('hunantv', 'HunanTV')
    bm7('pptv', 'PPTV')
    bm7('funshion', 'Funshion')
    bm7('letv', 'LeTV')
    bm7('taihemusic', 'TaiheMusic')
    bm7('kukemusic', 'KuKeMusic')
    bm7('hibymusic', 'HibyMusic')
    bm7('miwu', 'MiWu')
    bm7('migu', 'Migu')
    bm7('iptvmainland', 'IPTVMainland')
    bm7('iptvother', 'IPTVOther')
    bm7('cibn', 'CIBN')
    bm7('bestv', 'BesTV')
    bm7('huashutv', 'HuaShuTV')
    bm7('smg', 'SMG')
    bm7('hwtv', 'HWTV')
    bm7('nivodtv', 'NivodTV')
    bm7('olevod', 'Olevod')
    bm7('dandanzan', 'DanDanZan')
    bm7('dandanplay', 'Dandanplay')
    bm7('tiantiankankan', 'TianTianKanKan')
    bm7('yizhibo', 'YiZhiBo')
    bm7('ku6', 'Ku6')
    bm7('56', '56')
    bm7('cetv', 'CETV')
    bm7('yyets', 'YYeTs')
    bm7('asianmedia', 'AsianMedia')
    bm7('iqiyiintl', 'iQIYIIntl')
    bm7('joox', 'JOOX')
    bm7('mewatch', 'MeWatch')
    bm7('viki', 'Viki')
    bm7('wetv', 'WeTV')
    bm7('zee', 'Zee')
    bm7('cbs', 'CBS')
    bm7('nbc', 'NBC')
    bm7('pbs', 'PBS')
    bm7('attwatchtv', 'ATTWatchTV')
    bm7('fox', 'Fox')
    bm7('fubotv', 'FuboTV')
    bm7('sling', 'Sling')
    bm7('soundcloud', 'SoundCloud')
    bm7('pandora', 'Pandora')
    bm7('pandoratv', 'PandoraTV')
    bm7('tidal', 'TIDAL')
    bm7('vimeo', 'Vimeo')
    bm7('dailymotion', 'Dailymotion')
    bm7('deezer', 'Deezer')
    bm7('discoveryplus', 'DiscoveryPlus')
    bm7('overcast', 'Overcast')
    bm7('americasvoice', 'Americasvoice')
    bm7('cake', 'Cake')
    bm7('dood', 'Dood')
    bm7('ehgallery', 'EHGallery')
    bm7('lastfm', 'LastFM')
    bm7('emby', 'Emby')
    bm7('mytvsuper', 'myTVSUPER')
    bm7('tvb', 'TVB')
    bm7('encoretvb', 'EncoreTVB')
    bm7('nowe', 'NowE')
    bm7('rthk', 'RTHK')
    bm7('cabletv', 'CableTV')
    bm7('moov', 'MOOV')
    bm7('litv', 'LiTV')
    bm7('friday', 'friDay')
    bm7('hamivideo', 'HamiVideo')
    bm7('linetv', 'LineTV')
    bm7('vidoltv', 'VidolTV')
    bm7('taiwangood', 'TaiWanGood')
    bm7('cht', 'CHT')
    bm7('dmm', 'DMM')
    bm7('tver', 'TVer')
    bm7('niconico', 'Niconico')
    bm7('rakuten', 'Rakuten')
    bm7('japonx', 'Japonx')
    bm7('nikkei', 'Nikkei')
    bm7('itv', 'ITV')
    bm7('all4', 'All4')
    bm7('my5', 'My5')
    bm7('skygo', 'SkyGO')
    bm7('britboxuk', 'BritboxUK')
    bm7('londonreal', 'LondonReal')
    bm7('qobuz', 'Qobuz')
    bm7('steamcn', 'SteamCN')
    bm7('wanmeishijie', 'WanMeiShiJie')
    bm7('wankahuanju', 'WanKaHuanJu')
    bm7('majsoul', 'Majsoul')
    bm7('rockstar', 'Rockstar')
    bm7('riot', 'Riot')
    bm7('gog', 'Gog')
    bm7('supercell', 'Supercell')
    bm7('garena', 'Garena')
    bm7('hoyoverse', 'HoYoverse')
    bm7('ubi', 'UBI')
    bm7('wildrift', 'WildRift')
    bm7('sony', 'Sony')
    bm7('yandex', 'Yandex')
    bm7('googledrive', 'GoogleDrive')
    bm7('googleearth', 'GoogleEarth')
    bm7('naver', 'Naver')
    bm7('scholar', 'Scholar')
    bm7('developer', 'Developer')
    bm7('python', 'Python')
    bm7('gitbook', 'GitBook')
    bm7('jfrog', 'Jfrog')
    bm7('sublimetext', 'SublimeText')
    bm7('wordpress', 'Wordpress')
    bm7('wix', 'WIX')
    bm7('cisco', 'Cisco')
    bm7('ibm', 'IBM')
    bm7('oracle', 'Oracle')
    bm7('unity', 'Unity')
    bm7('microsoftedge', 'MicrosoftEdge')
    bm7('appstore', 'AppStore')
    bm7('appletv', 'AppleTV')
    bm7('applenews', 'AppleNews')
    bm7('appledev', 'AppleDev')
    bm7('appleproxy', 'AppleProxy')
    bm7('siri', 'Siri')
    bm7('testflight', 'TestFlight')
    bm7('applefirmware', 'AppleFirmware')
    bm7('findmy', 'FindMy')
    bm7('download', 'Download')
    bm7('ubuntu', 'Ubuntu')
    bm7('mozilla', 'Mozilla')
    bm7('apkpure', 'Apkpure')
    bm7('android', 'Android')
    bm7('googlefcm', 'GoogleFCM')
    bm7('intel', 'Intel')
    bm7('nvidia', 'Nvidia')
    bm7('dell', 'Dell')
    bm7('hp', 'HP')
    bm7('canon', 'Canon')
    bm7('lg', 'LG')
    bm7('cloudflare', 'Cloudflare')
    bm7('akamai', 'Akamai')
    // v5.1.2 FIX#6: 删除 bm7 DNS provider（混合中外DNS锁死CLOUD_CDN，改为自然分流）
    // bm7('dns', 'DNS')  ← REMOVED
    bm7('digicert', 'DigiCert')
    bm7('globalsign', 'GlobalSign')
    bm7('sectigo', 'Sectigo')
    bm7('brightcove', 'BrightCove')
    bm7('jwplayer', 'Jwplayer')
    bm7('privatetracker', 'PrivateTracker')
    bm7('cnn', 'CNN')
    bm7('nytimes', 'NYTimes')
    bm7('bloomberg', 'Bloomberg')
    bm7('ebay', 'eBay')
    bm7('nike', 'Nike')
    bm7('adobe', 'Adobe')
    bm7('samsung', 'Samsung')
    bm7('tesla', 'Tesla')
    bm7('dropbox', 'Dropbox')
    bm7('mega', 'MEGA')
    bm7('wikipedia', 'Wikipedia')
    bm7('duolingo', 'Duolingo')


    // ================================================================
    //  v5.1 Step 1: P0/P2 安全规则 + 量化交易增强
    // ================================================================

    // ── P0: Ckrvxr/MihomoRules 安全防护 ──
    // v5.2.1 REMOVED: ckrvxr-antipcdn 和 ckrvxr-antifraud 规则源已下线（持续 404），已删除
    // P0: SukkaW 13万钓鱼域名拦截（domain behavior + text format）
    config['rule-providers']['sukka-phishing'] = {
      type: 'http', behavior: 'domain', format: 'text',
      url: 'https://ruleset.skk.moe/Clash/domainset/reject_phishing.txt',
      path: './ruleset/sukka-reject-phishing.txt',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // v5.1.6-P0: Hagezi Threat Intelligence Feeds（威胁情报：malware/cryptojacking/C2/scam/spam）
    // 优先方案：MiHomoer .mrs 二进制格式（domain behavior，冷启动开销极小）
    // 备选方案（若 mrs 源不可用，取消下方注释并注释掉 mrs 版本）：
    //   config['rule-providers']['hagezi-tif'] = {
    //     type: 'http', behavior: 'domain', format: 'text',
    //     url: 'https://fastly.jsdelivr.net/gh/hagezi/dns-blocklists@main/domains/tif.medium.txt',
    //     path: './ruleset/hagezi-tif-medium.txt',
    //     interval: nextInterval(),
    //     proxy: RP_PROXY
    //   }
    config['rule-providers']['hagezi-tif'] = {
      type: 'http', behavior: 'domain', format: 'mrs',
      url: 'https://fastly.jsdelivr.net/gh/MiHomoer/MiHomo-Hagezi@release/HageziUltimate.mrs',
      path: './ruleset/hagezi-tif.mrs',
      interval: nextInterval(),
      proxy: RP_PROXY
    }

    // ================================================================
    //  v5.1 Step 3: szkane/ClashRuleSet 全量补充
    // ================================================================

    // ── szkane AI 服务（OpenAI/Claude/Grok/Perplexity/Gemini 合并）──
    config['rule-providers']['szkane-ai'] = {
      type: 'http', behavior: 'classical', format: 'text',
      url: 'https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/AiDomain.list',
      path: './ruleset/szkane-AiDomain.list',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // ── szkane CiciAI（字节海外AI：Coze International/Luma AI，需新加坡节点）──
    // v5.2.7 FIX#27-P1: upstream `Clash/Ruleset/CiciAi.list` 含 `USER-AGENT,TikTok*`，mihomo
    //   classical provider 不识别 USER-AGENT 会触发 `parse classical rule [USER-AGENT,TikTok*]
    //   error: unsupported rule type: USER-AGENT`。改用本仓库 mirrors/ 的清洗副本（仅删该行，
    //   TikTok 域名已由 metaDomain('tiktok','tiktok') 覆盖）。
    config['rule-providers']['szkane-ciciai'] = {
      type: 'http', behavior: 'classical', format: 'text',
      url: 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/mirrors/CiciAi.list',
      path: './ruleset/szkane-CiciAi.list',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // ── szkane Web3（DeFi/NFT/区块链RPC/交易所）★量化交易核心 ──
    config['rule-providers']['szkane-web3'] = {
      type: 'http', behavior: 'classical', format: 'text',
      url: 'https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Web3.list',
      path: './ruleset/szkane-Web3.list',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // ── szkane Developer（Docker镜像/HuggingFace模型/开发者下载）──
    config['rule-providers']['szkane-developer'] = {
      type: 'http', behavior: 'classical', format: 'text',
      url: 'https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/Developer.list',
      path: './ruleset/szkane-Developer.list',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // ── szkane Education（Khan Academy）──
    config['rule-providers']['szkane-khan'] = {
      type: 'http', behavior: 'classical', format: 'text',
      url: 'https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/Khan.list',
      path: './ruleset/szkane-Khan.list',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // ── szkane Education（Coursera/edX/Udacity等）──
    config['rule-providers']['szkane-edutools'] = {
      type: 'http', behavior: 'classical', format: 'text',
      url: 'https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/Edutools.list',
      path: './ruleset/szkane-Edutools.list',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // ── szkane UK Apps ──
    // v5.2.7 FIX#27-P1: upstream `Clash/Ruleset/UK.list` 含 `USER-AGENT,BBCiPlayer*`，
    //   mihomo classical provider 不识别 USER-AGENT 会触发
    //   `parse classical rule [USER-AGENT,BBCiPlayer*] error: unsupported rule type: USER-AGENT`。
    //   改用本仓库 mirrors/ 的清洗副本（BBC 域名已由 metaDomain('bbc','bbc') 覆盖）。
    config['rule-providers']['szkane-uk'] = {
      type: 'http', behavior: 'classical', format: 'text',
      url: 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/mirrors/UK.list',
      path: './ruleset/szkane-UK.list',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // ── szkane BilibiliHMT（港澳台哔哩哔哩）──
    config['rule-providers']['szkane-bilihmt'] = {
      type: 'http', behavior: 'classical', format: 'text',
      url: 'https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/BilibiliHMT.list',
      path: './ruleset/szkane-BilibiliHMT.list',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // ── szkane Netflix IP 段 ──
    config['rule-providers']['szkane-netflixip'] = {
      type: 'http', behavior: 'classical', format: 'text',
      url: 'https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/NetflixIP.list',
      path: './ruleset/szkane-NetflixIP.list',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // ── szkane ProxyGFWlist（GFW域名补充）──
    config['rule-providers']['szkane-proxygfw'] = {
      type: 'http', behavior: 'classical', format: 'text',
      url: 'https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/ProxyGFWlist.list',
      path: './ruleset/szkane-ProxyGFWlist.list',
      interval: nextInterval(),
      proxy: RP_PROXY
    }

    // ================================================================
    //  v5.1.4: Loyalsoldier/clash-rules GFW 封锁域名规则集
    //  ★ 中国 GFW 领域最权威的 Clash 格式规则源（⭐3.6k）
    //  上游数据链：
    //    gfwlist/gfwlist（⭐11k，GFW 封锁域名原始列表）
    //    + v2fly/domain-list-community（⭐7.1k，V2Ray 社区域名分类数据库）
    //    + GreatFire Analyzer（独立封锁探测机构）
    //    → Loyalsoldier/v2ray-rules-dat（聚合转换）
    //    → Loyalsoldier/clash-rules（Clash 格式 GitHub Actions 每日北京时间6:30自动构建）
    //  ❌ 排除 tld-not-cn.txt：包含所有非CN顶级域名(.com/.net/.org)，太宽泛会吞掉几乎所有国外域名
    // ================================================================

    // ── GFWList 封锁域名（核心列表，~4000+ 域名）──
    // v5.1.7 PERF: text → MetaCubeX geosite:gfw.mrs（同源 gfwlist → v2fly/domain-list-community）
    // 备选方案（若 MetaCubeX .mrs 源不可用，取消下方注释并注释掉 mrs 版本）：
    //   config['rule-providers']['loyalsoldier-gfw'] = {
    //     type: 'http', behavior: 'domain', format: 'text',
    //     url: 'https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt',
    //     path: './ruleset/loyalsoldier-gfw.txt',
    //     interval: nextInterval(),
    //     proxy: RP_PROXY
    //   }
    metaDomain('loyalsoldier-gfw', 'gfw')
    // ── GreatFire 封锁域名（独立探测源，与 GFWList 互补）──
    // v5.1.7 PERF: text → MetaCubeX geosite:greatfire.mrs（同源 GreatFire Analyzer → v2fly）
    // 备选方案（若 MetaCubeX .mrs 源不可用，取消下方注释并注释掉 mrs 版本）：
    //   config['rule-providers']['loyalsoldier-greatfire'] = {
    //     type: 'http', behavior: 'domain', format: 'text',
    //     url: 'https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/greatfire.txt',
    //     path: './ruleset/loyalsoldier-greatfire.txt',
    //     interval: nextInterval(),
    //     proxy: RP_PROXY
    //   }
    metaDomain('loyalsoldier-greatfire', 'greatfire')

    // ================================================================
    //  v5.1 Step 2: Accademia/Additional_Rule_For_Clash 全量35目录
    //  ★ 作为 blackmatrix7/ios_rule_script 的补充规则
    // ================================================================

    // ── AI 服务补充 ──
    config['rule-providers']['acc-appleai'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/AppleAI/AppleAI.yaml',
      path: './ruleset/acc-AppleAI.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // v5.2.7 FIX#27-P1: upstream `Grok/Grok.yaml` 含 `IP-CIDR         , 17.253.4.125`
    //   （多余空格 + 缺 CIDR 掩码）会触发
    //   `parse classical rule [IP-CIDR , 17.253.4.125] error: payloadRule error`。
    //   改用本仓库 mirrors/ 的清洗副本（仅删该行 + 规整空格）。
    config['rule-providers']['acc-grok'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/mirrors/Grok.yaml',
      path: './ruleset/acc-Grok.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    config['rule-providers']['acc-gemini'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Gemini/Gemini.yaml',
      path: './ruleset/acc-Gemini.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    config['rule-providers']['acc-copilot'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Copilot/Copilot.yaml',
      path: './ruleset/acc-Copilot.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }

    // ── 金融服务：Bank × 10国（原 acc-bank 404 → 拆分为子 provider）──
    for (const cc of ['US', 'UK', 'HK', 'SG', 'JP', 'AU', 'CA', 'DE', 'NL', 'FR']) {
      config['rule-providers'][`acc-bank-${cc.toLowerCase()}`] = {
        type: 'http', behavior: 'classical',
        url: `${ACC}/Bank/Bank${cc}.yaml`,
        path: `./ruleset/acc-Bank${cc}.yaml`,
        interval: nextInterval(),
        proxy: RP_PROXY
      }
    }
    // ── 金融服务：VirtualFinance × 4（原 acc-virtualfinance 404 → 拆分）──
    for (const svc of ['Paypal', 'Wise', 'Monzo', 'Revolut']) {
      config['rule-providers'][`acc-vf-${svc.toLowerCase()}`] = {
        type: 'http', behavior: 'classical',
        url: `${ACC}/VirtualFinance/${svc}.yaml`,
        path: `./ruleset/acc-${svc}.yaml`,
        interval: nextInterval(),
        proxy: RP_PROXY
      }
    }

    // ── 苹果补充 ──
    config['rule-providers']['acc-applenews'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/AppleNews/AppleNews.yaml',
      path: './ruleset/acc-AppleNews.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    config['rule-providers']['acc-apple'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Apple/Apple.yaml',
      path: './ruleset/acc-Apple.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }

    // ── 微软补充 ──
    config['rule-providers']['acc-microsoftapps'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/MicrosoftAPPs/MicrosoftAPPs.yaml',
      path: './ruleset/acc-MicrosoftAPPs.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }

    // ── 即时通讯 ──
    config['rule-providers']['acc-signal'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Signal/Signal.yaml',
      path: './ruleset/acc-Signal.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }

    // ── 远程协作 ──
    config['rule-providers']['acc-rustdesk'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/RustDesk/RustDesk.yaml',
      path: './ruleset/acc-RustDesk.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    config['rule-providers']['acc-parsec'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Parsec/Parsec.yaml',
      path: './ruleset/acc-Parsec.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }

    // ── 国内云盘/流媒体 ──
    config['rule-providers']['acc-alipan'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Alipan/Alipan.yaml',
      path: './ruleset/acc-Alipan.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    config['rule-providers']['acc-baidunetdisk'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/BaiduNetDisk/BaiduNetDisk.yaml',
      path: './ruleset/acc-BaiduNetDisk.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    config['rule-providers']['acc-weiyun'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/WeiYun/WeiYun.yaml',
      path: './ruleset/acc-WeiYun.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    config['rule-providers']['acc-kwai'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Kwai/Kwai.yaml',
      path: './ruleset/acc-Kwai.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // v5.1.1: FakeLocation × 10 平台（原 acc-fakelocation 404 → 拆分）
    for (const app of [
      'BiliBili', 'DouYin', 'KuaiShou', 'XiaoHongShu', 'XiGua',
      'WeiBo', 'ZhiHu', 'TieBa', 'DouBan', 'XianYu'
    ]) {
      config['rule-providers'][`acc-fl-${app.toLowerCase()}`] = {
        type: 'http', behavior: 'classical',
        url: `${ACC}/FakeLocation/FakeLocation${app}.yaml`,
        path: `./ruleset/acc-FakeLocation${app}.yaml`,
        interval: nextInterval(),
        proxy: RP_PROXY
      }
    }

    // ── 广告/安全/隐私 ──
    config['rule-providers']['acc-hijackingplus'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/HijackingPlus/HijackingPlus.yaml',
      path: './ruleset/acc-HijackingPlus.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    config['rule-providers']['acc-blockhttpdnsplus'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/BlockHttpDNSPlus/BlockHttpDNSPlus.yaml',
      path: './ruleset/acc-BlockHttpDNSPlus.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    config['rule-providers']['acc-prerepaireasyprivacy'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/PreRepairEasyPrivacy/PreRepairEasyPrivacy.yaml',
      path: './ruleset/acc-PreRepairEasyPrivacy.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    config['rule-providers']['acc-unsupportvpn'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/UnsupportVPN/UnsupportVPN.yaml',
      path: './ruleset/acc-UnsupportVPN.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }

    // ── 下载更新 ──
    config['rule-providers']['acc-macappupgrade'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/MacAppUpgrade/MacAppUpgrade.yaml',
      path: './ruleset/acc-MacAppUpgrade.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }

    // ── CDN/DNS ──
    config['rule-providers']['acc-fastly'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Fastly/Fastly.yaml',
      path: './ruleset/acc-Fastly.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // v5.1.2 FIX#6: 删除 acc-globaldns provider（国外DNS由各服务商规则自然分流）
    // acc-globaldns  ← REMOVED
    // v5.1.2 FIX#6: 删除 acc-chinadns provider（中国DNS由CN兜底规则自然分流到直连）
    // acc-chinadns  ← REMOVED
    // v5.2.5 FIX#23-P1: acc-geositecn + acc-china 删除
    //   这两个是 geosite:cn (metaDomain('cn', 'cn') 已提供) 的纯重复，
    //   保留 acc-chinamax 作为 ChinaMax 独立补充覆盖

    // ── 国内兜底补充 ──
    config['rule-providers']['acc-chinamax'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/ChinaMax/ChinaMax.yaml',
      path: './ruleset/acc-ChinaMax.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    // v5.1.1: HomeIP × 2国（原 acc-homeip 404 → 拆分）
    for (const cc of ['US', 'JP']) {
      config['rule-providers'][`acc-homeip-${cc.toLowerCase()}`] = {
        type: 'http', behavior: 'classical',
        url: `${ACC}/HomeIP/HomeIP${cc}.yaml`,
        path: `./ruleset/acc-HomeIP${cc}.yaml`,
        interval: nextInterval(),
        proxy: RP_PROXY
      }
    }

    // ── 国外网站 ──
    config['rule-providers']['acc-waybackmachine'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/WaybackMachine/WaybackMachine.yaml',
      path: './ruleset/acc-WaybackMachine.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    config['rule-providers']['acc-pornhub'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Pornhub/Pornhub.yaml',
      path: './ruleset/acc-Pornhub.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }

    // ── IoT：Aqara × 2（原 acc-aqara 404 → 拆分国内/国际）──
    config['rule-providers']['acc-aqara-cn'] = {
      type: 'http', behavior: 'classical',
      url: `${ACC}/Aqara/AqaraCN.yaml`,
      path: './ruleset/acc-AqaraCN.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }
    config['rule-providers']['acc-aqara-global'] = {
      type: 'http', behavior: 'classical',
      url: `${ACC}/Aqara/AqaraGlobal.yaml`,
      path: './ruleset/acc-AqaraGlobal.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }

    // ── P2P/Tracker ──
    config['rule-providers']['acc-emuleserver'] = {
      type: 'http', behavior: 'classical',
      url: 'https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/eMuleServer/eMuleServer.yaml',
      path: './ruleset/acc-eMuleServer.yaml',
      interval: nextInterval(),
      proxy: RP_PROXY
    }

    // ── GeoRouting Domain × 17 区域（原 acc-georouting-domain 404 → 按区域拆分，Domain版=作者推荐🔥）──
    for (const region of GEO_REGIONS_ALL) {
      const slug = region.toLowerCase().replace(/_/g, '-')
      config['rule-providers'][`acc-geo-d-${slug}`] = {
        type: 'http', behavior: 'domain',
        url: `${ACC}/GeoRouting_For_Domain/GeoRouting_${region}_ccTLD_Domain.yaml`,
        path: `./ruleset/acc-GeoD-${region}.yaml`,
        interval: nextInterval(),
        proxy: RP_PROXY
      }
    }
    // ── GeoRouting IP × 17 区域（原 acc-georouting-ip 404 → 按区域拆分）──
    for (const region of GEO_REGIONS_ALL) {
      const slug = region.toLowerCase().replace(/_/g, '-')
      config['rule-providers'][`acc-geo-ip-${slug}`] = {
        type: 'http', behavior: 'classical',
        url: `${ACC}/GeoRouting_For_IP/GeoRouting_${region}_GeoIP.yaml`,
        path: `./ruleset/acc-GeoIP-${region}.yaml`,
        interval: nextInterval(),
        proxy: RP_PROXY
      }
    }

  const count = Object.keys(config['rule-providers']).length
  console.log(`[${VERSION}] Injected ${count} rule-providers (base=${RP_BASE}s step=${RP_STEP}s spread=${_rpIdx * RP_STEP}s/${(_rpIdx * RP_STEP / 60).toFixed(1)}min)`)
}

// ================================================================
//  模块 H：规则注入
// ================================================================

function injectRules(config) {
  config.rules = [
    `RULE-SET,anti-ad,${BIZ.AD}`,
    // v5.1: P0 安全 - 钓鱼域名拦截（13万条，SukkaW）
    `RULE-SET,sukka-phishing,${BIZ.AD}`,
    // v5.1.6: P0 安全 - 威胁情报（Hagezi TIF：malware/cryptojacking/C2/scam/spam）
    `RULE-SET,hagezi-tif,${BIZ.AD}`,
    // v5.2.1 REMOVED: ckrvxr-antifraud 和 ckrvxr-antipcdn 规则源已下线
    // v5.1: Accademia 安全补充
    `RULE-SET,acc-hijackingplus,${BIZ.AD}`,
    `RULE-SET,acc-blockhttpdnsplus,${BIZ.AD}`,
    `RULE-SET,acc-prerepaireasyprivacy,${BIZ.AD}`,
    `RULE-SET,acc-unsupportvpn,${BIZ.AD}`,
    `GEOSITE,category-ads-all,${BIZ.AD}`,
    `RULE-SET,advertising,${BIZ.AD}`,
    `RULE-SET,advertisingmitv,${BIZ.AD}`,
    `RULE-SET,adobeactivation,${BIZ.AD}`,
    `RULE-SET,blockhttpdns,${BIZ.AD}`,
    `RULE-SET,domob,${BIZ.AD}`,
    `RULE-SET,hijacking,${BIZ.AD}`,
    `RULE-SET,jiguangtuisong,${BIZ.AD}`,
    `RULE-SET,marketing,${BIZ.AD}`,
    `RULE-SET,miuiprivacy,${BIZ.AD}`,
    `RULE-SET,privacy,${BIZ.AD}`,
    `RULE-SET,youmengchuangxiang,${BIZ.AD}`,
    // v5.2.1 FIX#19: DST-PORT,7680 必须在 GEOIP,private 之前，否则私有 IP 先匹配走 DIRECT
    'DST-PORT,7680,REJECT',
    'GEOSITE,private,DIRECT',
    'GEOIP,private,DIRECT,no-resolve',
    'IP-CIDR,172.90.1.130/32,DIRECT,no-resolve',
    'PROCESS-NAME,WorkPro.exe,DIRECT',
    'PROCESS-NAME,GCUService.exe,DIRECT',
    'PROCESS-NAME,GCUBridge.exe,DIRECT',
    'PROCESS-NAME,CCUWinUI.exe,DIRECT',
    'PROCESS-NAME,HipsDaemon.exe,DIRECT',
    'PROCESS-NAME,gdphost.exe,DIRECT',
    'PROCESS-NAME,gehsender.exe,DIRECT',
    'PROCESS-NAME,GSCService.exe,DIRECT',
    // v5.1.8 FIX#12-P1: GSCService.exe 每 2h 访问 ip.cip.cc 做外部 IP 检测，TUN 下 DNS 解析失败
    // 日志：dial DIRECT (match ProcessName/GSCService.exe) --> ip.cip.cc:80 error: dns resolve failed
    'DOMAIN,ip.cip.cc,DIRECT',
    'PROCESS-NAME,gsupservice.exe,DIRECT',
    'PROCESS-NAME,gchsvc.exe,DIRECT',
    'PROCESS-NAME,Weixin.exe,DIRECT',
    'DST-PORT,26880,DIRECT',
    'DST-PORT,6540,DIRECT',
    'DST-PORT,33068,DIRECT',
    'DST-PORT,123,DIRECT',
    'DST-PORT,3478,DIRECT',
    'DST-PORT,3479,DIRECT',
    `PROCESS-NAME,QQ.exe,${BIZ.CN_SITE}`,
    `PROCESS-NAME,WeChat.exe,${BIZ.CN_SITE}`,
    'DOMAIN-SUFFIX,chiphell.com,DIRECT',
    'DOMAIN-SUFFIX,iwipwedabay.com,DIRECT',
    // v5.2.0 CLEAN#2: Binance 精确 DOMAIN 规则已清理（全部被同组 DOMAIN-SUFFIX 覆盖）
    // 保留 fake-ip-filter 中的精确域名（DNS 层独立于规则层，不受影响）
    `DOMAIN-SUFFIX,binance.vision,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,binance.com,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,binance.info,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,binance.cloud,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,binance.me,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,binance.org,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,binancefuture.com,${BIZ.CRYPTO}`,
    // v5.1.8 FIX#11-P0: dns.google 是 DoH 服务，前置拦截防止 szkane-ai 宽规则吞入 AI 组
    // v5.2.10 FIX#39: 由 ☁️ 云与CDN 改路由到 🚫 受限网站——dns.google 在境内被封，
    //                 若用户把 CDN 组误设直连，DoH 必失败；放在 GFW 组语义更准确
    `DOMAIN,dns.google,${BIZ.GFW}`,
    `DOMAIN,dns.google.com,${BIZ.GFW}`,
    // v5.1.8 FIX#14-P0: YouTube/googlevideo 被 szkane-ai 宽规则吞入 AI 组
    // szkane AiDomain.list 含 Google 宽域名（因 Gemini），导致 YouTube 全系误走 AI 代理
    // 日志：[TCP] dial 🤖 AI 服务 (match RuleSet/szkane-ai) --> www.youtube.com / yt3.ggpht.com / googlevideo.com
    // 前置精准拦截到 STREAM_US，优先于 RULE-SET,szkane-ai 生效
    `DOMAIN-SUFFIX,youtube.com,${BIZ.YT}`,
    `DOMAIN-SUFFIX,youtu.be,${BIZ.YT}`,
    `DOMAIN-SUFFIX,googlevideo.com,${BIZ.YT}`,
    `DOMAIN-SUFFIX,ytimg.com,${BIZ.YT}`,
    `DOMAIN-SUFFIX,ggpht.com,${BIZ.YT}`,
    `DOMAIN-SUFFIX,youtube-nocookie.com,${BIZ.YT}`,
    `DOMAIN-SUFFIX,youtubekids.com,${BIZ.YT}`,
    `RULE-SET,openai,${BIZ.AI}`,
    `RULE-SET,claude,${BIZ.AI}`,
    `RULE-SET,gemini,${BIZ.AI}`,
    `RULE-SET,copilot,${BIZ.AI}`,
    `DOMAIN-SUFFIX,perplexity.ai,${BIZ.AI}`,
    `DOMAIN-SUFFIX,mistral.ai,${BIZ.AI}`,
    `DOMAIN-SUFFIX,x.ai,${BIZ.AI}`,
    `DOMAIN-SUFFIX,grok.com,${BIZ.AI}`,
    `DOMAIN-SUFFIX,deepseek.com,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,huggingface.co,${BIZ.AI}`,
    `DOMAIN-SUFFIX,replicate.com,${BIZ.AI}`,
    `DOMAIN-SUFFIX,together.ai,${BIZ.AI}`,
    `DOMAIN-SUFFIX,cohere.ai,${BIZ.AI}`,
    `DOMAIN-SUFFIX,cohere.com,${BIZ.AI}`,
    `DOMAIN-SUFFIX,midjourney.com,${BIZ.AI}`,
    `DOMAIN-SUFFIX,stability.ai,${BIZ.AI}`,
    `DOMAIN-SUFFIX,anthropic.com,${BIZ.AI}`,
    `DOMAIN-SUFFIX,cursor.com,${BIZ.AI}`,
    `DOMAIN-SUFFIX,cursor.sh,${BIZ.AI}`,
    `DOMAIN-SUFFIX,v0.dev,${BIZ.AI}`,
    `DOMAIN-SUFFIX,vercel.ai,${BIZ.AI}`,
    `DOMAIN-SUFFIX,notebooklm.google,${BIZ.AI}`,
    `DOMAIN-SUFFIX,poe.com,${BIZ.AI}`,
    `DOMAIN-SUFFIX,character.ai,${BIZ.AI}`,
    // v5.2.2: PI.ai/Inflection → GFW（中国被墙需代理，印尼可直连）
    `DOMAIN-SUFFIX,inflection.ai,${BIZ.GFW}`,
    `DOMAIN-SUFFIX,pi.ai,${BIZ.GFW}`,
    `DOMAIN-SUFFIX,suno.ai,${BIZ.AI}`,
    `DOMAIN-SUFFIX,suno.com,${BIZ.AI}`,
    `DOMAIN-SUFFIX,runway.ml,${BIZ.AI}`,
    `DOMAIN-SUFFIX,runwayml.com,${BIZ.AI}`,
    `DOMAIN-SUFFIX,openrouter.ai,${BIZ.AI}`,
    `DOMAIN-SUFFIX,fireworks.ai,${BIZ.AI}`,
    `DOMAIN-SUFFIX,modal.com,${BIZ.AI}`,
    `DOMAIN-SUFFIX,modal.run,${BIZ.AI}`,
    `DOMAIN-SUFFIX,runpod.io,${BIZ.AI}`,
    `RULE-SET,civitai,${BIZ.AI}`,
    // ════════════════════════════════════════════════════════════════
    //  v5.1.8 FIX#14-P0：Google 子服务防吞盾
    //  szkane AiDomain.list 含 Google 宽域名（因 Gemini/Bard），导致 Google 全系误走 AI 代理
    //  解法：在 RULE-SET,szkane-ai 之前前置所有 Google 非 AI 子服务精准规则
    //  已安全（在此之前已匹配）：Gemini(RULE-SET) / NotebookLM / YouTube / dns.google
    //  ▼ 以下规则从各业务区块提升至此，原位置 dead rules 已在 v5.1.9 清除
    // ════════════════════════════════════════════════════════════════
    // ── Google 邮件 ──
    `DOMAIN-SUFFIX,gmail.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,googlemail.com,${BIZ.INTL_SITE}`,
    `DOMAIN,mail.google.com,${BIZ.INTL_SITE}`,
    `DOMAIN,inbox.google.com,${BIZ.INTL_SITE}`,
    // ── Google 即时通讯 ──
    `RULE-SET,googlevoice,${BIZ.IM}`,
    // ── Google 会议协作 ──
    `DOMAIN-SUFFIX,meet.google.com,${BIZ.WORK}`,
    `DOMAIN,meet.googleapis.com,${BIZ.WORK}`,
    // ── Google 下载更新 ──
    `DOMAIN-SUFFIX,dl.google.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,play.googleapis.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,android.clients.google.com,${BIZ.DOWNLOAD}`,
    `RULE-SET,googlefcm,${BIZ.DOWNLOAD}`,
    // ── Google 搜索引擎（兜底：MetaCubeX geosite:google 覆盖 google.com/co.*/com.*）──
    `RULE-SET,googlesearch,${BIZ.TOOLS}`,
    `RULE-SET,googledrive,${BIZ.TOOLS}`,
    `RULE-SET,googleearth,${BIZ.TOOLS}`,
    `RULE-SET,google,${BIZ.TOOLS}`,
    `RULE-SET,google-ip,${BIZ.TOOLS},no-resolve`,
    // ════════════════════════════════════════════════════════════════
    // v5.1: szkane AI 综合 + Accademia AI 补充
    `RULE-SET,szkane-ai,${BIZ.AI}`,
    `RULE-SET,szkane-ciciai,${BIZ.AI}`,
    `RULE-SET,acc-appleai,${BIZ.AI}`,
    `RULE-SET,acc-grok,${BIZ.AI}`,
    `RULE-SET,acc-gemini,${BIZ.AI}`,
    // v5.1.8 FIX#13-P2: 微软 Delivery Optimization 遥测非 Copilot AI，前置拦截
    // 日志：match RuleSet/acc-copilot) --> geover.prod.do.dsp.mp.microsoft.com:443
    `DOMAIN-SUFFIX,do.dsp.mp.microsoft.com,${BIZ.DOWNLOAD}`,
    `RULE-SET,acc-copilot,${BIZ.AI}`,
    `DOMAIN-SUFFIX,tradingview.com,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,tvcdn.com,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,coinglass.com,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,hyperliquid.xyz,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,hyperliquid-testnet.xyz,${BIZ.CRYPTO}`,
    `RULE-SET,cryptocurrency,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,eth.limo,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,glitternode.ru,${BIZ.CRYPTO}`,
    `RULE-SET,binance,${BIZ.CRYPTO}`,
    // v5.1: szkane Web3（DeFi/NFT/区块链RPC）★量化交易核心
    `RULE-SET,szkane-web3,${BIZ.CRYPTO}`,
    `RULE-SET,paypal,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,stripe.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,stripe.network,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,stripecdn.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,stripe.dev,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,wise.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,transferwise.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,revolut.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,revolut.me,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,braintreegateway.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,braintree-api.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,venmo.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,cash.app,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,squareup.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,square.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,adyen.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,checkout.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,klarna.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,afterpay.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,plaid.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,midtrans.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,gopay.co.id,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,ovo.id,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,dana.id,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,shopeepay.co.id,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,xendit.co,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,doku.com,${BIZ.PAYMENTS}`,
    `RULE-SET,stripe,${BIZ.PAYMENTS}`,
    `RULE-SET,visa,${BIZ.PAYMENTS}`,
    `RULE-SET,tigerfintech,${BIZ.PAYMENTS}`,
    // v5.1.1: Accademia 银行 × 10国 + 虚拟金融 × 4
    ...['US','UK','HK','SG','JP','AU','CA','DE','NL','FR'].map(cc => `RULE-SET,acc-bank-${cc.toLowerCase()},${BIZ.PAYMENTS}`),
    ...['paypal','wise','monzo','revolut'].map(svc => `RULE-SET,acc-vf-${svc},${BIZ.PAYMENTS}`),
    `DOMAIN,login.live.com,${BIZ.MS}`,
    `DOMAIN,g.live.com,${BIZ.MS}`,
    `DOMAIN-SUFFIX,officeapps.live.com,${BIZ.MS}`,
    // v5.1.9 CLEAN#1: gmail.com/googlemail.com/mail.google.com/inbox.google.com 已提升至防吞盾（FIX#14），dead rules 已清除
    `DOMAIN-SUFFIX,outlook.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,outlook.live.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,hotmail.com,${BIZ.INTL_SITE}`,
    `DOMAIN,mail.live.com,${BIZ.INTL_SITE}`,
    `DOMAIN,outlook.office365.com,${BIZ.INTL_SITE}`,
    `DOMAIN,outlook.office.com,${BIZ.INTL_SITE}`,
    `DOMAIN,mail.yahoo.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,ymail.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,protonmail.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,proton.me,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,pm.me,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,tutanota.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,tuta.com,${BIZ.INTL_SITE}`,
    // v5.1.3 FIX#7: Zoho 宽域名收窄为邮件专用子域名（防止吞掉 RULE-SET,zoho 会议协作规则）
    `DOMAIN,mail.zoho.com,${BIZ.INTL_SITE}`,
    `DOMAIN,mail.zoho.eu,${BIZ.INTL_SITE}`,
    `DOMAIN,mail.zoho.in,${BIZ.INTL_SITE}`,
    `DOMAIN,mail.zoho.com.au,${BIZ.INTL_SITE}`,
    `DOMAIN,mail.zoho.jp,${BIZ.INTL_SITE}`,
    `DOMAIN,mail.me.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,fastmail.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,fastmail.fm,${BIZ.INTL_SITE}`,
    `RULE-SET,mail,${BIZ.INTL_SITE}`,
    `RULE-SET,mailru,${BIZ.INTL_SITE}`,
    `RULE-SET,protonmail,${BIZ.INTL_SITE}`,
    `RULE-SET,spark,${BIZ.INTL_SITE}`,
    'DOMAIN-SUFFIX,mail.qq.com,DIRECT',
    'DOMAIN-SUFFIX,mail.163.com,DIRECT',
    'DOMAIN-SUFFIX,mail.126.com,DIRECT',
    'DOMAIN-SUFFIX,mail.sina.com.cn,DIRECT',
    'DOMAIN-SUFFIX,mail.aliyun.com,DIRECT',
    `RULE-SET,telegram,${BIZ.IM}`,
    `RULE-SET,telegram-ip,${BIZ.IM},no-resolve`,
    `RULE-SET,discord,${BIZ.IM}`,
    `RULE-SET,whatsapp,${BIZ.IM}`,
    `RULE-SET,line,${BIZ.IM}`,
    `RULE-SET,kakaotalk,${BIZ.IM}`,
    `DOMAIN-SUFFIX,skype.com,${BIZ.IM}`,
    `DOMAIN-SUFFIX,skypeecs.net,${BIZ.IM}`,
    `DOMAIN-SUFFIX,skypeforbusiness.com,${BIZ.IM}`,
    `DOMAIN-SUFFIX,sfbassets.com,${BIZ.IM}`,
    `DOMAIN-SUFFIX,lync.com,${BIZ.IM}`,
    `DOMAIN-SUFFIX,signal.org,${BIZ.IM}`,
    `DOMAIN-SUFFIX,whispersystems.org,${BIZ.IM}`,
    `DOMAIN-SUFFIX,signal.art,${BIZ.IM}`,
    `DOMAIN-SUFFIX,viber.com,${BIZ.IM}`,
    `DOMAIN-SUFFIX,viber.io,${BIZ.IM}`,
    `DOMAIN-SUFFIX,element.io,${BIZ.IM}`,
    `DOMAIN-SUFFIX,matrix.org,${BIZ.IM}`,
    `DOMAIN-SUFFIX,zalo.me,${BIZ.IM}`,
    `DOMAIN-SUFFIX,zalopay.vn,${BIZ.IM}`,
    `DOMAIN-SUFFIX,wire.com,${BIZ.IM}`,
    `DOMAIN-SUFFIX,threema.ch,${BIZ.IM}`,
    `RULE-SET,telegramnl,${BIZ.IM},no-resolve`,
    `RULE-SET,telegramsg,${BIZ.IM},no-resolve`,
    `RULE-SET,telegramus,${BIZ.IM},no-resolve`,
    `RULE-SET,zalo,${BIZ.IM}`,
    // v5.1.9 CLEAN#1: googlevoice 已提升至防吞盾（FIX#14），dead rule 已清除
    `RULE-SET,italkbb,${BIZ.IM}`,
    // v5.1: Accademia Signal 补充
    `RULE-SET,acc-signal,${BIZ.IM}`,
    `DOMAIN-SUFFIX,icq.com,${BIZ.IM}`,
    `RULE-SET,twitter,${BIZ.SOCIAL}`,
    `RULE-SET,twitter-ip,${BIZ.SOCIAL},no-resolve`,
    `RULE-SET,tiktok,${BIZ.SOCIAL}`,
    `RULE-SET,reddit,${BIZ.SOCIAL}`,
    `RULE-SET,facebook,${BIZ.SOCIAL}`,
    `RULE-SET,facebook-ip,${BIZ.SOCIAL},no-resolve`,
    `RULE-SET,instagram,${BIZ.SOCIAL}`,
    `RULE-SET,snapchat,${BIZ.SOCIAL}`,
    `RULE-SET,pinterest,${BIZ.SOCIAL}`,
    `RULE-SET,linkedin,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,mastodon.social,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,joinmastodon.org,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,threads.net,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,bsky.app,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,bsky.social,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,tumblr.com,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,quora.com,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,medium.com,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,flickr.com,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,clubhouse.com,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,lemon8-app.com,${BIZ.SOCIAL}`,
    `RULE-SET,tumblr,${BIZ.SOCIAL}`,
    `RULE-SET,clubhouse,${BIZ.SOCIAL}`,
    `RULE-SET,clubhouseip,${BIZ.SOCIAL},no-resolve`,
    `RULE-SET,pixiv,${BIZ.SOCIAL}`,
    `RULE-SET,truthsocial,${BIZ.SOCIAL}`,
    `RULE-SET,vk,${BIZ.SOCIAL}`,
    `RULE-SET,blued,${BIZ.CN_SITE}`,
    `RULE-SET,disqus,${BIZ.SOCIAL}`,
    `RULE-SET,imgur,${BIZ.SOCIAL}`,
    `RULE-SET,pixnet,${BIZ.SOCIAL}`,
    `RULE-SET,zoom,${BIZ.WORK}`,
    `RULE-SET,slack,${BIZ.WORK}`,
    `RULE-SET,teams,${BIZ.WORK}`,
    // v5.1.9 CLEAN#1: meet.google.com/meet.googleapis.com 已提升至防吞盾（FIX#14），dead rules 已清除
    `DOMAIN-SUFFIX,webex.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,wbx2.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,ciscospark.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,notion.so,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,notion.site,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,figma.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,linear.app,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,atlassian.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,jira.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,trello.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,bitbucket.org,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,asana.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,monday.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,clickup.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,basecamp.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,airtable.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,miro.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,canva.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,coda.io,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,loom.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,larksuite.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,larkoffice.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,gotomeeting.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,logmein.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,goto.com,${BIZ.WORK}`,
    `RULE-SET,atlassian,${BIZ.WORK}`,
    `RULE-SET,notion,${BIZ.WORK}`,
    `RULE-SET,teamviewer,${BIZ.WORK}`,
    `RULE-SET,zoho,${BIZ.WORK}`,
    `RULE-SET,salesforce,${BIZ.WORK}`,
    `RULE-SET,zendesk,${BIZ.WORK}`,
    `RULE-SET,intercom,${BIZ.WORK}`,
    `RULE-SET,remotedesktop,${BIZ.WORK}`,
    // v5.1: Accademia 远程桌面补充
    `RULE-SET,acc-rustdesk,${BIZ.WORK}`,
    `RULE-SET,acc-parsec,${BIZ.WORK}`,
    'DOMAIN-SUFFIX,feishu.cn,DIRECT',
    'DOMAIN-SUFFIX,dingtalk.com,DIRECT',
    'DOMAIN-SUFFIX,welink.huaweicloud.com,DIRECT',
    `RULE-SET,bilibili,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,iqiyi.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,iqiyipic.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,71.am,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,youku.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,ykimg.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,soku.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,v.qq.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,video.qq.com,${BIZ.CNMEDIA}`,
    `DOMAIN-KEYWORD,tencentvideo,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,mgtv.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,hitv.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,hunantv.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,douyin.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,douyinpic.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,douyinvod.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,ixigua.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,pstatp.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,snssdk.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,sohu.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,music.163.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,ntes53.netease.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,y.qq.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,music.qq.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,kugou.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,kuwo.cn,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,xiaohongshu.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,xhscdn.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,kuaishou.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,gifshow.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,weibo.com,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,weibo.cn,${BIZ.CNMEDIA}`,
    `DOMAIN-SUFFIX,sinaimg.cn,${BIZ.CNMEDIA}`,
    `RULE-SET,iqiyi,${BIZ.CNMEDIA}`,
    `RULE-SET,youku,${BIZ.CNMEDIA}`,
    `RULE-SET,tencentvideo,${BIZ.CNMEDIA}`,
    `RULE-SET,douyin,${BIZ.CNMEDIA}`,
    `RULE-SET,bytedance,${BIZ.CNMEDIA}`,
    `RULE-SET,kuaishou,${BIZ.CNMEDIA}`,
    `RULE-SET,weibo,${BIZ.CNMEDIA}`,
    `RULE-SET,xiaohongshu,${BIZ.CNMEDIA}`,
    `RULE-SET,neteasemusic,${BIZ.CNMEDIA}`,
    `RULE-SET,kugoukuwo,${BIZ.CNMEDIA}`,
    `RULE-SET,sohu,${BIZ.CNMEDIA}`,
    `RULE-SET,acfun,${BIZ.CNMEDIA}`,
    `RULE-SET,douyu,${BIZ.CNMEDIA}`,
    `RULE-SET,huya,${BIZ.CNMEDIA}`,
    `RULE-SET,himalaya,${BIZ.CNMEDIA}`,
    `RULE-SET,cctv,${BIZ.CNMEDIA}`,
    `RULE-SET,hunantv,${BIZ.CNMEDIA}`,
    `RULE-SET,pptv,${BIZ.CNMEDIA}`,
    `RULE-SET,funshion,${BIZ.CNMEDIA}`,
    `RULE-SET,letv,${BIZ.CNMEDIA}`,
    `RULE-SET,taihemusic,${BIZ.CNMEDIA}`,
    `RULE-SET,kukemusic,${BIZ.CNMEDIA}`,
    `RULE-SET,hibymusic,${BIZ.CNMEDIA}`,
    `RULE-SET,miwu,${BIZ.CNMEDIA}`,
    `RULE-SET,migu,${BIZ.CNMEDIA}`,
    `RULE-SET,iptvmainland,${BIZ.CNMEDIA}`,
    `RULE-SET,iptvother,${BIZ.CNMEDIA}`,
    `RULE-SET,cibn,${BIZ.CNMEDIA}`,
    `RULE-SET,bestv,${BIZ.CNMEDIA}`,
    `RULE-SET,huashutv,${BIZ.CNMEDIA}`,
    `RULE-SET,smg,${BIZ.CNMEDIA}`,
    `RULE-SET,hwtv,${BIZ.CNMEDIA}`,
    `RULE-SET,nivodtv,${BIZ.CNMEDIA}`,
    `RULE-SET,olevod,${BIZ.CNMEDIA}`,
    `RULE-SET,dandanzan,${BIZ.CNMEDIA}`,
    `RULE-SET,dandanplay,${BIZ.CNMEDIA}`,
    `RULE-SET,tiantiankankan,${BIZ.CNMEDIA}`,
    `RULE-SET,yizhibo,${BIZ.CNMEDIA}`,
    `RULE-SET,ku6,${BIZ.CNMEDIA}`,
    `RULE-SET,56,${BIZ.CNMEDIA}`,
    `RULE-SET,cetv,${BIZ.CNMEDIA}`,
    `RULE-SET,yyets,${BIZ.CNMEDIA}`,
    // v5.1: Accademia 国内云盘/媒体补充
    `RULE-SET,acc-alipan,${BIZ.CNMEDIA}`,
    `RULE-SET,acc-baidunetdisk,${BIZ.CNMEDIA}`,
    `RULE-SET,acc-weiyun,${BIZ.CNMEDIA}`,
    // v5.1.3 FIX#8: acc-kwai（Kwai国际版）从 CNMEDIA 移到 STREAM_SEA（海外APP需代理）
    // RULE-SET,acc-kwai 已移至东南亚流媒体区块
    // v5.1.1: Accademia FakeLocation × 10 平台（国内APP IP归属地伪装）
    ...['bilibili','douyin','kuaishou','xiaohongshu','xigua',
        'weibo','zhihu','tieba','douban','xianyu'].map(app => `RULE-SET,acc-fl-${app},${BIZ.CNMEDIA}`),
    // v5.1.2 FIX#2: 港澳台哔哩哔哩需港区代理解锁（v5.1.1 误归入 CNMEDIA/DIRECT 导致 412）
    `RULE-SET,szkane-bilihmt,${BIZ.STREAM_HK}`,
    `RULE-SET,viu,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,wetv.vip,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,wetvinfo.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,iq.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,vidio.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,vidio.static6.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,rctiplus.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,visionplus.id,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,genflix.co.id,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,goplay.co.id,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,maxstream.tv,${BIZ.STREAM_OTHER}`,
    `RULE-SET,biliintl,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,viki.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,viki.io,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,iflix.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,catchplay.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,mewatch.sg,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,trueid.net,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,dimsum.my,${BIZ.STREAM_OTHER}`,
    `RULE-SET,asianmedia,${BIZ.STREAM_OTHER}`,
    `RULE-SET,iqiyiintl,${BIZ.STREAM_OTHER}`,
    `RULE-SET,joox,${BIZ.STREAM_OTHER}`,
    `RULE-SET,mewatch,${BIZ.STREAM_OTHER}`,
    `RULE-SET,viki,${BIZ.STREAM_OTHER}`,
    `RULE-SET,wetv,${BIZ.STREAM_OTHER}`,
    `RULE-SET,zee,${BIZ.STREAM_OTHER}`,
    // v5.1.3 FIX#8: acc-kwai（Kwai国际版）移入东南亚流媒体（巴西/印尼主战场需代理）
    `RULE-SET,acc-kwai,${BIZ.STREAM_OTHER}`,
    `RULE-SET,youtube,${BIZ.YT}`,
    `RULE-SET,netflix,${BIZ.NFLX}`,
    `RULE-SET,netflix-ip,${BIZ.NFLX},no-resolve`,
    `RULE-SET,spotify,${BIZ.MUSIC}`,
    `RULE-SET,disney,${BIZ.DSNP}`,
    `RULE-SET,hbo,${BIZ.HBO}`,
    `RULE-SET,primevideo,${BIZ.PRIME}`,
    `RULE-SET,hulu,${BIZ.HULU}`,
    `RULE-SET,paramount,${BIZ.STREAM_OTHER}`,
    `RULE-SET,peacock,${BIZ.STREAM_OTHER}`,
    `RULE-SET,twitch,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,amazonaws.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,awsstatic.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,aws.amazon.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,elasticbeanstalk.com,${BIZ.TOOLS}`,
    `RULE-SET,amazon,${BIZ.PRIME}`,
    `DOMAIN-SUFFIX,crunchyroll.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,vrv.co,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,soundcloud.com,${BIZ.MUSIC}`,
    `DOMAIN-SUFFIX,sndcdn.com,${BIZ.MUSIC}`,
    `DOMAIN-SUFFIX,pandora.com,${BIZ.MUSIC}`,
    `DOMAIN-SUFFIX,pluto.tv,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,tubi.tv,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,fubo.tv,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,discoveryplus.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,max.com,${BIZ.HBO}`,
    `DOMAIN-SUFFIX,appletv.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,deezer.com,${BIZ.MUSIC}`,
    `DOMAIN-SUFFIX,tidal.com,${BIZ.MUSIC}`,
    `DOMAIN-SUFFIX,vimeo.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,dailymotion.com,${BIZ.STREAM_OTHER}`,
    `RULE-SET,cbs,${BIZ.STREAM_OTHER}`,
    `RULE-SET,nbc,${BIZ.STREAM_OTHER}`,
    `RULE-SET,pbs,${BIZ.STREAM_OTHER}`,
    `RULE-SET,attwatchtv,${BIZ.STREAM_OTHER}`,
    `RULE-SET,fox,${BIZ.STREAM_OTHER}`,
    `RULE-SET,fubotv,${BIZ.STREAM_OTHER}`,
    `RULE-SET,sling,${BIZ.STREAM_OTHER}`,
    `RULE-SET,soundcloud,${BIZ.MUSIC}`,
    `RULE-SET,pandora,${BIZ.MUSIC}`,
    `RULE-SET,pandoratv,${BIZ.MUSIC}`,
    `RULE-SET,tidal,${BIZ.MUSIC}`,
    `RULE-SET,vimeo,${BIZ.STREAM_OTHER}`,
    `RULE-SET,dailymotion,${BIZ.STREAM_OTHER}`,
    `RULE-SET,deezer,${BIZ.MUSIC}`,
    `RULE-SET,discoveryplus,${BIZ.STREAM_OTHER}`,
    `RULE-SET,overcast,${BIZ.MUSIC}`,
    `RULE-SET,americasvoice,${BIZ.STREAM_OTHER}`,
    `RULE-SET,cake,${BIZ.STREAM_OTHER}`,
    `RULE-SET,dood,${BIZ.STREAM_OTHER}`,
    // v5.1.3 FIX#9: ehgallery 从 STREAM_US 移到 INTL_SITE（非流媒体，全球节点更灵活）
    // RULE-SET,ehgallery 已移至国外网站区块
    `RULE-SET,lastfm,${BIZ.MUSIC}`,
    `RULE-SET,emby,${BIZ.STREAM_OTHER}`,
    // v5.1: szkane Netflix IP 段补充
    `RULE-SET,szkane-netflixip,${BIZ.NFLX},no-resolve`,
    `DOMAIN-SUFFIX,mytvsuper.com,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,mytv.com.hk,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,viu.com,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,viu.tv,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,hktv.com.hk,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,hktvmall.com,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,nowtv.com,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,nowe.com,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,rthk.hk,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,icable.com,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,cabletv.com.hk,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,hmvod.com.hk,${BIZ.STREAM_HK}`,
    `RULE-SET,mytvsuper,${BIZ.STREAM_HK}`,
    `RULE-SET,tvb,${BIZ.STREAM_HK}`,
    `RULE-SET,encoretvb,${BIZ.STREAM_HK}`,
    `RULE-SET,nowe,${BIZ.STREAM_HK}`,
    `RULE-SET,rthk,${BIZ.STREAM_HK}`,
    `RULE-SET,cabletv,${BIZ.STREAM_HK}`,
    `RULE-SET,moov,${BIZ.STREAM_HK}`,
    `RULE-SET,bahamut,${BIZ.STREAM_TW}`,
    `RULE-SET,kktv,${BIZ.STREAM_TW}`,
    `DOMAIN-SUFFIX,litv.tv,${BIZ.STREAM_TW}`,
    `DOMAIN-SUFFIX,video.friday.tw,${BIZ.STREAM_TW}`,
    `DOMAIN-SUFFIX,friday.tw,${BIZ.STREAM_TW}`,
    `DOMAIN-SUFFIX,linetv.tw,${BIZ.STREAM_TW}`,
    `DOMAIN-SUFFIX,elta.tv,${BIZ.STREAM_TW}`,
    `DOMAIN-SUFFIX,mod.cht.com.tw,${BIZ.STREAM_TW}`,
    `DOMAIN-SUFFIX,hamivideo.hinet.net,${BIZ.STREAM_TW}`,
    `DOMAIN-SUFFIX,ofiii.com,${BIZ.STREAM_TW}`,
    `DOMAIN-SUFFIX,pts.org.tw,${BIZ.STREAM_TW}`,
    `DOMAIN-SUFFIX,4gtv.tv,${BIZ.STREAM_TW}`,
    `RULE-SET,litv,${BIZ.STREAM_TW}`,
    `RULE-SET,friday,${BIZ.STREAM_TW}`,
    `RULE-SET,hamivideo,${BIZ.STREAM_TW}`,
    `RULE-SET,linetv,${BIZ.STREAM_TW}`,
    `RULE-SET,vidoltv,${BIZ.STREAM_TW}`,
    `RULE-SET,taiwangood,${BIZ.STREAM_TW}`,
    `RULE-SET,cht,${BIZ.STREAM_TW}`,
    `RULE-SET,abema,${BIZ.STREAM_JP}`,
    `RULE-SET,dazn,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,tver.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,unext.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,video.unext.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,nhk.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,nhk.or.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,dmm.com,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,dmm.co.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,dtv.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,paravi.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,videomarket.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,fod.fujitv.co.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,hulu.jp,${BIZ.HULU}`,
    `DOMAIN-SUFFIX,happyon.jp,${BIZ.HULU}`,
    `DOMAIN-SUFFIX,gyao.yahoo.co.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,music.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,nicovideo.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,nicovideo.me,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,dmc.nico,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,radiko.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,lemino.docomo.ne.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,wowow.co.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,wavve.com,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,tving.com,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,watcha.com,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,coupangplay.com,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,sbs.co.kr,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,kbs.co.kr,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,mbc.co.kr,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,jtbc.co.kr,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,tvn.cjenm.com,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,afreecatv.com,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,tv.naver.com,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,now.naver.com,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,vod.naver.com,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,navertv.naver.com,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,kakaotv.daum.net,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,navercorp.com,${BIZ.STREAM_JP}`,
    `RULE-SET,dmm,${BIZ.STREAM_JP}`,
    `RULE-SET,tver,${BIZ.STREAM_JP}`,
    `RULE-SET,niconico,${BIZ.STREAM_JP}`,
    `RULE-SET,rakuten,${BIZ.STREAM_JP}`,
    `RULE-SET,japonx,${BIZ.STREAM_JP}`,
    `RULE-SET,nikkei,${BIZ.STREAM_JP}`,
    `RULE-SET,bbc,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,itv.com,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,itvstatic.com,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,channel4.com,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,channel5.com,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,sky.com,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,nowtv.co.uk,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,britbox.com,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,canalplus.com,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,mycanal.fr,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,france.tv,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,tf1.fr,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,molotov.tv,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,arte.tv,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,joyn.de,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,zdf.de,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,ard.de,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,ardmediathek.de,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,rtlplus.com,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,raiplay.it,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,rtve.es,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,videoland.com,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,ruutu.fi,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,tv2.dk,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,svtplay.se,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,nrk.no,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,ivi.ru,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,kinopoisk.ru,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,okko.tv,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,more.tv,${BIZ.STREAM_EU}`,
    `RULE-SET,itv,${BIZ.STREAM_EU}`,
    `RULE-SET,all4,${BIZ.STREAM_EU}`,
    `RULE-SET,my5,${BIZ.STREAM_EU}`,
    `RULE-SET,skygo,${BIZ.STREAM_EU}`,
    `RULE-SET,britboxuk,${BIZ.STREAM_EU}`,
    `RULE-SET,londonreal,${BIZ.STREAM_EU}`,
    `RULE-SET,qobuz,${BIZ.MUSIC}`,
    // v5.1: szkane UK Apps
    `RULE-SET,szkane-uk,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,mihoyo.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,miyoushe.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,yuanshen.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,bhsr.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,zenlesszonezero.com,${BIZ.GAME_CN}`,
    `DOMAIN,game.163.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,gm.163.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,ds.163.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,nie.163.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,nie.netease.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,update.netease.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,netease.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,wegame.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,wegame.com.cn,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,perfect-world.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,wanmei.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,xd.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,taptap.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,taptap.io,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,papegames.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,hypergryph.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,gryphline.com,${BIZ.GAME_CN}`,
    `DOMAIN-SUFFIX,lilith.com,${BIZ.GAME_CN}`,
    `RULE-SET,steamcn,${BIZ.GAME_CN}`,
    `RULE-SET,wanmeishijie,${BIZ.GAME_CN}`,
    `RULE-SET,wankahuanju,${BIZ.GAME_CN}`,
    `RULE-SET,majsoul,${BIZ.GAME_CN}`,
    `RULE-SET,steam,${BIZ.GAME_INTL}`,
    `RULE-SET,epic,${BIZ.GAME_INTL}`,
    `RULE-SET,playstation,${BIZ.GAME_INTL}`,
    `RULE-SET,nintendo,${BIZ.GAME_INTL}`,
    `RULE-SET,xbox,${BIZ.GAME_INTL}`,
    `RULE-SET,ea,${BIZ.GAME_INTL}`,
    `RULE-SET,blizzard,${BIZ.GAME_INTL}`,
    `GEOSITE,category-games,${BIZ.GAME_INTL}`,
    `DOMAIN-SUFFIX,ubisoft.com,${BIZ.GAME_INTL}`,
    `DOMAIN-SUFFIX,ubi.com,${BIZ.GAME_INTL}`,
    `DOMAIN-SUFFIX,riotgames.com,${BIZ.GAME_INTL}`,
    `DOMAIN-SUFFIX,leagueoflegends.com,${BIZ.GAME_INTL}`,
    `DOMAIN-SUFFIX,valorant.com,${BIZ.GAME_INTL}`,
    `DOMAIN-SUFFIX,rockstargames.com,${BIZ.GAME_INTL}`,
    // v5.2.0 CLEAN#3: socialclub.rockstargames.com 已被上行 SUFFIX 覆盖，dead rule 已清除
    `DOMAIN-SUFFIX,gog.com,${BIZ.GAME_INTL}`,
    `DOMAIN-SUFFIX,gogalaxy.com,${BIZ.GAME_INTL}`,
    `DOMAIN-SUFFIX,bethesda.net,${BIZ.GAME_INTL}`,
    `DOMAIN-SUFFIX,supercell.com,${BIZ.GAME_INTL}`,
    `DOMAIN-SUFFIX,garena.com,${BIZ.GAME_INTL}`,
    `DOMAIN-SUFFIX,hoyoverse.com,${BIZ.GAME_INTL}`,
    `DOMAIN-SUFFIX,hoyolab.com,${BIZ.GAME_INTL}`,
    `RULE-SET,rockstar,${BIZ.GAME_INTL}`,
    `RULE-SET,riot,${BIZ.GAME_INTL}`,
    `RULE-SET,gog,${BIZ.GAME_INTL}`,
    `RULE-SET,supercell,${BIZ.GAME_INTL}`,
    `RULE-SET,garena,${BIZ.GAME_INTL}`,
    `RULE-SET,hoyoverse,${BIZ.GAME_INTL}`,
    `RULE-SET,ubi,${BIZ.GAME_INTL}`,
    `RULE-SET,wildrift,${BIZ.GAME_INTL}`,
    `RULE-SET,sony,${BIZ.GAME_INTL}`,
    // v5.1.9 CLEAN#1: googlesearch/googledrive/googleearth/google/google-ip + dl.google.com/play.googleapis.com/android.clients.google.com
    //   已提升至防吞盾（FIX#14），dead rules 已清除
    `RULE-SET,bing,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,yahoo.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,yahoo.co.jp,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,duckduckgo.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,ddg.co,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,brave.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,yandex.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,yandex.ru,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,ecosia.org,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,startpage.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,you.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,search.naver.com,${BIZ.TOOLS}`,
    // v5.1.2 FIX#3: 补充孤儿 provider 规则引用（v5.1.1 定义了 provider 但未注入 RULE-SET）
    // v5.1.9 CLEAN#1: googledrive/googleearth 已提升至防吞盾，此处仅保留 scholar/yandex
    `RULE-SET,scholar,${BIZ.TOOLS}`,
    `RULE-SET,yandex,${BIZ.TOOLS}`,
    `RULE-SET,github,${BIZ.TOOLS}`,
    `RULE-SET,onedrive,${BIZ.MS}`,
    `RULE-SET,microsoft,${BIZ.MS}`,
    `RULE-SET,microsoftedge,${BIZ.MS}`,
    // v5.1: Accademia 微软APP补充
    `RULE-SET,acc-microsoftapps,${BIZ.MS}`,
    `RULE-SET,applemusic,${BIZ.APPLE}`,
    `RULE-SET,icloud,${BIZ.APPLE}`,
    `RULE-SET,apple,${BIZ.APPLE}`,
    `RULE-SET,appstore,${BIZ.APPLE}`,
    `RULE-SET,appletv,${BIZ.APPLE}`,
    `RULE-SET,applenews,${BIZ.APPLE}`,
    `RULE-SET,appledev,${BIZ.APPLE}`,
    `RULE-SET,appleproxy,${BIZ.APPLE}`,
    `RULE-SET,siri,${BIZ.APPLE}`,
    `RULE-SET,testflight,${BIZ.APPLE}`,
    `RULE-SET,applefirmware,${BIZ.APPLE}`,
    `RULE-SET,findmy,${BIZ.APPLE}`,
    // v5.1: Accademia 苹果补充（AppleAI与AppleNews交叉规则，建议同节点）
    `RULE-SET,acc-applenews,${BIZ.APPLE}`,
    `RULE-SET,acc-apple,${BIZ.APPLE}`,
    `RULE-SET,docker,${BIZ.TOOLS}`,
    `RULE-SET,gitlab,${BIZ.TOOLS}`,
    `GEOSITE,category-dev,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,npmjs.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,npmjs.org,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,yarnpkg.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,pypi.org,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,pythonhosted.org,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,crates.io,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,rubygems.org,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,packagist.org,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,maven.org,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,nuget.org,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,cocoapods.org,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,stackoverflow.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,stackexchange.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,sstatic.net,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,vercel.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,vercel.app,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,netlify.app,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,netlify.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,pages.dev,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,workers.dev,${BIZ.TOOLS}`,
    // v5.2.0 FIX#16: cloudflare.com 收窄为开发者入口精确匹配
    // 原 DOMAIN-SUFFIX 会吞掉 cdnjs.cloudflare.com 等 CDN 子域名，导致无法命中后续 RULE-SET,cloudflare → CLOUD_CDN
    `DOMAIN,dash.cloudflare.com,${BIZ.TOOLS}`,
    `DOMAIN,api.cloudflare.com,${BIZ.TOOLS}`,
    `DOMAIN,developers.cloudflare.com,${BIZ.TOOLS}`,
    `DOMAIN,www.cloudflare.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,heroku.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,herokuapp.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,fly.io,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,railway.app,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,render.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,supabase.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,supabase.co,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,planetscale.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,neon.tech,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,digitalocean.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,vultr.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,linode.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,sentry.io,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,datadog.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,grafana.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,postman.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,jetbrains.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,hashicorp.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,terraform.io,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,vagrantup.com,${BIZ.TOOLS}`,
    `RULE-SET,developer,${BIZ.TOOLS}`,
    `RULE-SET,python,${BIZ.TOOLS}`,
    `RULE-SET,gitbook,${BIZ.TOOLS}`,
    `RULE-SET,jfrog,${BIZ.TOOLS}`,
    `RULE-SET,sublimetext,${BIZ.TOOLS}`,
    `RULE-SET,wordpress,${BIZ.TOOLS}`,
    `RULE-SET,wix,${BIZ.TOOLS}`,
    `RULE-SET,cisco,${BIZ.TOOLS}`,
    `RULE-SET,ibm,${BIZ.TOOLS}`,
    `RULE-SET,oracle,${BIZ.TOOLS}`,
    `RULE-SET,unity,${BIZ.TOOLS}`,
    // v5.1: szkane Developer（Docker镜像/模型文件下载）
    `RULE-SET,szkane-developer,${BIZ.TOOLS}`,
    `RULE-SET,systemota,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,windowsupdate.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,update.microsoft.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,download.microsoft.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,delivery.mp.microsoft.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,dl.delivery.mp.microsoft.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,officecdn.microsoft.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,officecdn.microsoft.com.edgesuite.net,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,download.mozilla.org,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,archive.mozilla.org,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,releases.ubuntu.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,archive.ubuntu.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,security.ubuntu.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,mirrors.kernel.org,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,dl.fedoraproject.org,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,repo.anaconda.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,conda.anaconda.org,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,repo.continuum.io,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,sourceforge.net,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,fosshub.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,filehippo.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,softonic.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,gcr.io,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,ghcr.io,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,quay.io,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,registry.k8s.io,${BIZ.DOWNLOAD}`,
    `RULE-SET,download,${BIZ.DOWNLOAD}`,
    `RULE-SET,ubuntu,${BIZ.DOWNLOAD}`,
    `RULE-SET,mozilla,${BIZ.DOWNLOAD}`,
    `RULE-SET,apkpure,${BIZ.DOWNLOAD}`,
    `RULE-SET,android,${BIZ.DOWNLOAD}`,
    // v5.1.9 CLEAN#1: googlefcm 已提升至防吞盾（FIX#14），dead rule 已清除
    `RULE-SET,intel,${BIZ.DOWNLOAD}`,
    `RULE-SET,nvidia,${BIZ.DOWNLOAD}`,
    `RULE-SET,dell,${BIZ.DOWNLOAD}`,
    `RULE-SET,hp,${BIZ.DOWNLOAD}`,
    `RULE-SET,canon,${BIZ.DOWNLOAD}`,
    `RULE-SET,lg,${BIZ.DOWNLOAD}`,
    // v5.1: Accademia MacApp升级规则（Homebrew/Sparkle源）
    `RULE-SET,acc-macappupgrade,${BIZ.DOWNLOAD}`,
    `RULE-SET,cloudflare-ip,${BIZ.INTL_SITE},no-resolve`,
    `RULE-SET,cloudfront-ip,${BIZ.INTL_SITE},no-resolve`,
    `RULE-SET,fastly-ip,${BIZ.INTL_SITE},no-resolve`,
    `DOMAIN-SUFFIX,akamai.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,akamaized.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,akamaihd.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,akamaiedge.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,akamaitechnologies.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,edgekey.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,edgesuite.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,cloudfront.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,fastly.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,fastlylb.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,kxcdn.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,stackpathdns.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,stackpathcdn.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,b-cdn.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,bunny.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,bunnycdn.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,cdn77.org,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,azureedge.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,azurefd.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,msecnd.net,${BIZ.INTL_SITE}`,
    // v5.2.1 FIX: jsdelivr 走受限网站组（中国用代理，海外可设直连），避免 rule-provider 刷新时 DNS 循环依赖
    `DOMAIN-SUFFIX,jsdelivr.net,${BIZ.GFW}`,
    `DOMAIN-SUFFIX,unpkg.com,${BIZ.INTL_SITE}`,
    // v5.2.10 FIX#39: 同 dns.google 改到 GFW 组（cloudflare-dns.com 在境内被封）
    `DOMAIN-SUFFIX,cloudflare-dns.com,${BIZ.GFW}`,
    `DOMAIN-SUFFIX,cloudflarestorage.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,r2.dev,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,ziffstatic.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,ucoz.ru,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,ucoz.net,${BIZ.INTL_SITE}`,
    `RULE-SET,cloudflare,${BIZ.INTL_SITE}`,
    `RULE-SET,akamai,${BIZ.INTL_SITE}`,
    // v5.1.2 FIX#6: RULE-SET,dns 已删除（DNS自然分流，不锁死代理组）
    `RULE-SET,digicert,${BIZ.INTL_SITE}`,
    `RULE-SET,globalsign,${BIZ.INTL_SITE}`,
    `RULE-SET,sectigo,${BIZ.INTL_SITE}`,
    `RULE-SET,brightcove,${BIZ.INTL_SITE}`,
    `RULE-SET,jwplayer,${BIZ.INTL_SITE}`,
    // v5.1: Accademia CDN 补充
    `RULE-SET,acc-fastly,${BIZ.INTL_SITE}`,
    // v5.1.2 FIX#6: RULE-SET,acc-globaldns 已删除（DNS自然分流）
    `DOMAIN-SUFFIX,letsencrypt.org,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,lencr.org,${BIZ.INTL_SITE}`,
    `GEOSITE,tracker,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,tracker.opentrackr.org,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,open.stealth.si,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,tracker.torrent.eu.org,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,exodus.desync.com,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,tracker.openbittorrent.com,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,tracker.publicbt.com,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,tracker.dler.org,${BIZ.TRACKER}`,
    `RULE-SET,privatetracker,${BIZ.TRACKER}`,
    // v5.1: Accademia eMule服务器
    `RULE-SET,acc-emuleserver,${BIZ.TRACKER}`,
    // ═══ v5.1.5: 原「印尼本地」规则重分配 → 银行/证券归入金融支付 ═══
    `DOMAIN-SUFFIX,bca.co.id,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,klikbca.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,bni.co.id,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,bri.co.id,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,bankmandiri.co.id,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,danamon.co.id,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,permatabank.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,cimbniaga.co.id,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,btn.co.id,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,ocbcnisp.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,banksinarmas.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,idx.co.id,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,ksei.co.id,${BIZ.PAYMENTS}`,
    // ═══ v5.1.5: 原「印尼本地」规则重分配 → 电商/出行/外卖/电信/政府/新闻归入国外网站 ═══
    `DOMAIN-SUFFIX,tokopedia.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,tokopedia.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,shopee.co.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,bukalapak.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,blibli.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,lazada.co.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,grab.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,gojek.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,gojek.co.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,traveloka.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,tiket.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,telkomsel.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,telkom.co.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,indosatooredoo.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,im3.co.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,xl.co.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,smartfren.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,tri.co.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,by.u.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,myrepublic.co.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,firstmedia.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,biznet.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,go.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,or.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,kompas.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,detik.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,tempo.co,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,cnnindonesia.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,cnbcindonesia.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,liputan6.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,tribunnews.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,kumparan.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,idntimes.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,gofood.co.id,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,grabfood.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,66tutup.com,${BIZ.INTL_SITE}`,
    // v5.1.5: GEOIP,ID 归入国外网站（与 GEOIP,CN→国内网站 对称）
    `GEOIP,ID,${BIZ.INTL_SITE},no-resolve`,
    `DOMAIN-SUFFIX,163.com,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,126.com,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,126.net,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,jianguoyun.com,${BIZ.CN_SITE}`,
    `RULE-SET,cn,${BIZ.CN_SITE}`,
    `RULE-SET,cn-ip,${BIZ.CN_SITE},no-resolve`,
    `DOMAIN-SUFFIX,alimama.com,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,zxtdjy.com,${BIZ.CN_SITE}`,
    // v5.1.2 FIX#6: RULE-SET,acc-chinadns 已删除（中国DNS由CN兜底自然直连）
    // v5.2.5 FIX#23-P1: acc-geositecn / acc-china 删除（与 metaDomain('cn','cn') 纯重复）
    `RULE-SET,acc-chinamax,${BIZ.CN_SITE}`,
    // v5.1.2 FIX#4: HomeIP × 2国 → INTL_SITE（v5.1.1 误归入 CN_SITE 导致美日IP段走直连）
    `RULE-SET,acc-homeip-us,${BIZ.INTL_SITE},no-resolve`,
    `RULE-SET,acc-homeip-jp,${BIZ.INTL_SITE},no-resolve`,
    // v5.1.2 FIX#5: Aqara 国内 → CN_SITE，国际 → INTL_SITE（v5.1.1 Global 误归入 CN_SITE）
    `RULE-SET,acc-aqara-cn,${BIZ.CN_SITE}`,
    `RULE-SET,acc-aqara-global,${BIZ.INTL_SITE}`,

    // ═══ v5.1.4: 🚫 受限网站（GFW 封锁域名兜底，位于 INTL_SITE 之前）═══
    // 语义区分：GFW 组 = 确认被中国 GFW 封锁的域名 / INTL_SITE = 普通国外域名
    // 在中国：GFW 组手动选代理节点，INTL_SITE 保持默认可探测直连
    // 在印尼：GFW 组选 DIRECT（被墙站点在印尼可直连），INTL_SITE 也选 DIRECT
    `GEOSITE,gfw,${BIZ.GFW}`,
    `RULE-SET,loyalsoldier-gfw,${BIZ.GFW}`,
    `RULE-SET,loyalsoldier-greatfire,${BIZ.GFW}`,
    `RULE-SET,szkane-proxygfw,${BIZ.GFW}`,

    `RULE-SET,cnn,${BIZ.INTL_SITE}`,
    `RULE-SET,nytimes,${BIZ.INTL_SITE}`,
    `RULE-SET,bloomberg,${BIZ.INTL_SITE}`,
    `RULE-SET,ebay,${BIZ.INTL_SITE}`,
    `RULE-SET,nike,${BIZ.INTL_SITE}`,
    `RULE-SET,adobe,${BIZ.INTL_SITE}`,
    `RULE-SET,samsung,${BIZ.INTL_SITE}`,
    `RULE-SET,tesla,${BIZ.INTL_SITE}`,
    `RULE-SET,dropbox,${BIZ.INTL_SITE}`,
    `RULE-SET,mega,${BIZ.INTL_SITE}`,
    `RULE-SET,wikipedia,${BIZ.INTL_SITE}`,
    `RULE-SET,duolingo,${BIZ.INTL_SITE}`,
    `RULE-SET,proxy,${BIZ.INTL_SITE}`,
    // v5.1.4: szkane-proxygfw 已移至「🚫 受限网站」GFW 组（见上方）
    // v5.1: Accademia 国外网站补充
    `RULE-SET,acc-waybackmachine,${BIZ.INTL_SITE}`,
    `RULE-SET,acc-pornhub,${BIZ.INTL_SITE}`,
    // v5.1: szkane Education
    `RULE-SET,szkane-khan,${BIZ.INTL_SITE}`,
    `RULE-SET,szkane-edutools,${BIZ.INTL_SITE}`,
    // v5.1.2 FIX#3: naver 宽域名兜底（子域名已精准分流到日韩流媒体/搜索引擎）
    `RULE-SET,naver,${BIZ.INTL_SITE}`,
    // v5.1.3 FIX#9: ehgallery 移入国外网站（非流媒体服务，全球节点更灵活）
    `RULE-SET,ehgallery,${BIZ.INTL_SITE}`,
    // v5.1.2 FIX#1: GeoRouting Domain × 16国外 + 1中国（Asia_China → CN_SITE）
    ...GEO_REGIONS_INTL.map(r => `RULE-SET,acc-geo-d-${r.toLowerCase().replace(/_/g,'-')},${BIZ.INTL_SITE}`),
    ...GEO_REGIONS_INTL.map(r => `RULE-SET,acc-geo-ip-${r.toLowerCase().replace(/_/g,'-')},${BIZ.INTL_SITE},no-resolve`),
    `RULE-SET,acc-geo-d-asia-china,${BIZ.CN_SITE}`,
    `RULE-SET,acc-geo-ip-asia-china,${BIZ.CN_SITE},no-resolve`,
    `DOMAIN-SUFFIX,archive.org,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,udemy.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,udemycdn.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,grammarly.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,grammarly.io,${BIZ.INTL_SITE}`,
    // v5.1.6 P0-FIX#7: jetbrains.com 已在 DEV 组覆盖（line ~1796），此处为死规则，已删除
    `DOMAIN-SUFFIX,jetbrains.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,theguardian.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,guardianapis.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,box.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,boxcdn.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,noip.com,${BIZ.INTL_SITE}`,
    // ㉑½ v5.1: Loyalsoldier GEOIP 精准标签路由（需 Loyalsoldier 加强版 MMDB）
    `GEOIP,cloudflare,${BIZ.INTL_SITE},no-resolve`,
    `GEOIP,telegram,${BIZ.IM},no-resolve`,
    `GEOIP,netflix,${BIZ.NFLX},no-resolve`,
    `GEOIP,facebook,${BIZ.SOCIAL},no-resolve`,
    `GEOIP,twitter,${BIZ.SOCIAL},no-resolve`,
    `GEOIP,google,${BIZ.TOOLS},no-resolve`,

    // ㉒ GEOIP CN
    `GEOIP,CN,${BIZ.CN_SITE},no-resolve`,
    `MATCH,${BIZ.FINAL}`,
  ]
  console.log(`[${VERSION}] Injected ${config.rules.length} rules`)
}

// ================================================================
//  模块 I：全局参数覆写
// ================================================================

function overwriteGeneral(config) {
  config['unified-delay'] = true
  config['tcp-concurrent'] = true
  config['find-process-mode'] = 'strict'
  config['keep-alive-idle'] = 30
  config['keep-alive-interval'] = 15
  config['geodata-mode'] = true
  // v5.1: Loyalsoldier 加强版 MMDB（含 cloudflare/telegram/netflix/facebook/twitter/google IP段）
  // geoip.dat 保留 MetaCubeX（最全面），MMDB 切换 Loyalsoldier（精准标签）
  // v5.1.9 CFG#1: geosite URL 移除（由 Clash Party UI 手动管理 fastly/cdn 切换策略）
  config['geox-url'] = {
    geoip:   'https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/geoip.dat',
    mmdb:    'https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb',
    asn:     'https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb',
  }
  config['geo-auto-update'] = true
  // v5.1.9 CFG#1: geo-update-interval 移除（由 Clash Party UI 手动管理）
  if (!config.profile) config.profile = {}
  config.profile['store-selected'] = true
  config.profile['store-fake-ip'] = true
  config.profile['tracing'] = true
  if (!config.tun) config.tun = {}
  if (!config.tun['exclude-process']) config.tun['exclude-process'] = []
  // v5.2.1 FIX#20: GSCService.exe 加入排除列表，fake-ip 模式下 ip.cip.cc 无法解析
  var gcuExcludes = ['GCUService.exe', 'GCUBridge.exe', 'WorkPro.exe', 'GSCService.exe', 'gsupservice.exe', 'gchsvc.exe']
  gcuExcludes.forEach(function(proc) {
    if (config.tun['exclude-process'].indexOf(proc) === -1) { config.tun['exclude-process'].push(proc) }
  })
}

// ================================================================
//  模块 J：清理订阅自带的旧组和旧规则
// ================================================================

function cleanupSubscription(config) {
  // v5.2.6-normal.1 FIX#26-P0: 与 Smart 版保持对齐 —— 清空订阅自带的所有 proxy-groups
  //   原 4 关键词黑名单无法清除机场模板提供的地区组 / 流媒体组，导致代理组 60+。
  //   本脚本 46 组（18 url-test + 28 select）是唯一权威来源。
  var removed = (config['proxy-groups'] || []).length
  config['proxy-groups'] = []
  if (removed > 0) console.log(`[${VERSION}] Removed ${removed} subscription proxy-groups`)
  config.rules = []
  config['rule-providers'] = {}
}

// ================================================================
//  模块 K：注入智能 TLS 指纹
// ================================================================

function _simpleHash(str) {
  var hash = 0
  for (var i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0 }
  // >>> 0 converts to unsigned 32-bit; avoids Math.abs(-2147483648) === -2147483648 edge case
  return hash >>> 0
}

function injectSmartFingerprint(config) {
  if (!Array.isArray(config.proxies)) return
  const fpByPurpose = { STREAM: 'chrome', GAME: 'ios', SOCIAL: 'firefox', DEV: 'edge' }
  const fpFallbackCandidates = ['chrome','firefox','safari','ios','android','edge']
  config.proxies.forEach(p => {
    if (!p || typeof p !== 'object') return
    // v5.2.0 FIX#15: 先判断协议类型，再判断是否需要指纹（逻辑顺序优化）
    if (['vless','vmess','trojan'].indexOf(p.type) === -1) return
    const isReality = !!(p['reality-opts'] || p['reality_opts'])
    const flow = (p.flow || '').toLowerCase()
    const isXTLS = /xtls-rprx/.test(flow)
    // 仅对 TLS 或 Reality/XTLS 节点注入指纹（非加密连接无需指纹）
    if (!p.tls && !isReality && !isXTLS) return
    // v5.1.6 P0-FIX#4: 不覆盖节点已有 fingerprint（机场可能为 Reality 节点调优过）
    if (p['client-fingerprint']) return
    let chosenFP = null
    const name = String(p.name)
    if (/netflix|youtube|hulu|primevideo|disney|twitch/i.test(name)) { chosenFP = fpByPurpose.STREAM }
    else if (/game|steam|playstation|nintendo|epic|valorant/i.test(name)) { chosenFP = fpByPurpose.GAME }
    else if (/twitter|facebook|instagram|tiktok|snapchat|linkedin/i.test(name)) { chosenFP = fpByPurpose.SOCIAL }
    else if (/api|dev|github|gitlab|npm|pypi|docker/i.test(name)) { chosenFP = fpByPurpose.DEV }
    if (!chosenFP) { const idx = _simpleHash(name) % fpFallbackCandidates.length; chosenFP = fpFallbackCandidates[idx] }
    p['client-fingerprint'] = chosenFP
  })
}

// ================================================================
//  模块 L：proxy-groups 最终排序
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
  config['proxy-groups'] = [...bizGroups, ...otherGroups, ...smartGroups]
}

// ================================================================
//  主函数
// ================================================================

function main(config) {
  try {
    if (!config || typeof config !== 'object') return config
    if (!Array.isArray(config.proxies) || config.proxies.length === 0) return config
    console.log(`[${VERSION}] Start processing, ${config.proxies.length} proxies`)
    if (!Array.isArray(config['proxy-groups'])) config['proxy-groups'] = []
    if (!Array.isArray(config.rules)) config.rules = []
    overwriteGeneral(config)
    cleanupSubscription(config)
    injectSmartFingerprint(config)
    var c = classifyAllNodes(config.proxies)
    console.log(`[${VERSION}] Classification: ALL=${c.ALL.length} HOME_ALL=${c.HOME_ALL.length} HK=${c.HK.length}/${c.HOME_HK.length} TW=${c.TW.length}/${c.HOME_TW.length} CN=${c.CN.length}/${c.HOME_CN.length} JP=${c.JP.length}/${c.HOME_JP.length} KR=${c.KR.length}/${c.HOME_KR.length} SG=${c.SG.length}/${c.HOME_SG.length} US=${c.US.length}/${c.HOME_US.length} EU=${c.EU.length}/${c.HOME_EU.length} AM=${c.AM.length}/${c.HOME_AM.length} AF=${c.AF.length}/${c.HOME_AF.length} APAC_OTHER=${c.APAC_OTHER.length}/${c.HOME_APAC_OTHER.length} UNCLASSIFIED=${c.UNCLASSIFIED.length}/${c.HOME_UNCLASSIFIED.length}`)
    var jpkrNodes = c.JP.concat(c.KR)
    var apacNodes = c.HK.concat(c.TW, c.CN, c.JP, c.KR, c.SG, c.APAC_OTHER)
    var americasNodes = c.US.concat(c.AM)
    var homeJpkrNodes = c.HOME_JP.concat(c.HOME_KR)
    var homeApacNodes = c.HOME_HK.concat(c.HOME_TW, c.HOME_CN, c.HOME_JP, c.HOME_KR, c.HOME_SG, c.HOME_APAC_OTHER)
    var homeAmericasNodes = c.HOME_US.concat(c.HOME_AM)
    upsertSmartGroup(config, SMART.GLOBAL, c.ALL)
    if (c.HOME_ALL.length > 0) upsertSmartGroup(config, SMART.GLOBAL_HOME, c.HOME_ALL)
    // v5.2.8-normal.2: 全部/家宽区域统一空组不创建，避免静默回退污染家宽或地区语义
    //   （与 Smart 版同步修复。SMART.GLOBAL 始终存在兜底）
    if (c.HK.length > 0) upsertSmartGroup(config, SMART.HK, c.HK)
    if (c.HOME_HK.length > 0) upsertSmartGroup(config, SMART.HK_HOME, c.HOME_HK)
    if (c.TW.length > 0) upsertSmartGroup(config, SMART.TW, c.TW)
    if (c.HOME_TW.length > 0) upsertSmartGroup(config, SMART.TW_HOME, c.HOME_TW)
    if (jpkrNodes.length > 0) upsertSmartGroup(config, SMART.JPKR, jpkrNodes)
    if (homeJpkrNodes.length > 0) upsertSmartGroup(config, SMART.JPKR_HOME, homeJpkrNodes)
    if (apacNodes.length > 0) upsertSmartGroup(config, SMART.APAC, apacNodes)
    if (homeApacNodes.length > 0) upsertSmartGroup(config, SMART.APAC_HOME, homeApacNodes)
    if (c.US.length > 0) upsertSmartGroup(config, SMART.US, c.US)
    if (c.HOME_US.length > 0) upsertSmartGroup(config, SMART.US_HOME, c.HOME_US)
    if (c.EU.length > 0) upsertSmartGroup(config, SMART.EU, c.EU)
    if (c.HOME_EU.length > 0) upsertSmartGroup(config, SMART.EU_HOME, c.HOME_EU)
    if (americasNodes.length > 0) upsertSmartGroup(config, SMART.AMERICAS, americasNodes)
    if (homeAmericasNodes.length > 0) upsertSmartGroup(config, SMART.AMERICAS_HOME, homeAmericasNodes)
    if (c.AF.length > 0) upsertSmartGroup(config, SMART.AFRICA, c.AF)
    if (c.HOME_AF.length > 0) upsertSmartGroup(config, SMART.AFRICA_HOME, c.HOME_AF)

    // 收集实际创建的区域组名（按 SMART 常量名匹配），过滤业务组的 proxy 引用
    var _regionNameSet = new Set(Object.values(SMART))
    var activeSmartNames = new Set(config['proxy-groups'].filter(function(g) { return g && _regionNameSet.has(g.name) }).map(function(g) { return g.name }))
    activeSmartNames.add('DIRECT'); activeSmartNames.add('REJECT')
    console.log(`[${VERSION}] Active url-test region groups: ${[...activeSmartNames].filter(function(n) { return n !== 'DIRECT' && n !== 'REJECT' }).join(', ')}`)

    injectBusinessGroups(config, activeSmartNames)
    injectRuleProviders(config)
    injectRules(config)
    sortProxyGroups(config)
    console.log(`[${VERSION}] Done! Groups: ${config['proxy-groups'].length}, Rules: ${config.rules.length}, Providers: ${Object.keys(config['rule-providers']).length}`)
    return config
  } catch (e) {
    console.error(`[${VERSION}] Error:`, e)
    return config
  }
}
