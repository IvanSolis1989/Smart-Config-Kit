'use strict';

// Source routing graph for Smart-Config-Kit rule compilation.
// Client artifacts must consume generated fused outputs; this module owns the
// upstream provider/rule relationship used by MRS and fused-rule compilers.

const SOURCE_GRAPH_ID = 'rulesets/source/routing-graph.js';
const SOURCE_GRAPH_VERSION = 'v6.0.14';
const VERSION = SOURCE_GRAPH_VERSION;

let SCKI_DISABLE_MIHOMO_MRS_OVERRIDES = false;

function sourceGraphLog() {
  if (process.env.SCKI_SOURCE_GRAPH_VERBOSE === '1') console.log.apply(console, arguments);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
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

const DOMESTIC_AUTHORITY_ANCHOR_RULE = `RULE-SET,acc-geo-ip-asia-china,${BIZ.CN_SITE},no-resolve`;
const GENERIC_INTL_GEOIP_FALLBACK_RULE = `GEOIP,cloudflare,${BIZ.INTL_SITE},no-resolve`;
const GENERIC_INTL_EDGE_FALLBACK_RULES = [
  `DOMAIN-SUFFIX,amazonaws.com,${BIZ.INTL_SITE}`,
  `DOMAIN-SUFFIX,awsstatic.com,${BIZ.INTL_SITE}`,
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
  `DOMAIN-SUFFIX,unpkg.com,${BIZ.INTL_SITE}`,
  `DOMAIN-SUFFIX,r2.dev,${BIZ.INTL_SITE}`,
  `DOMAIN-SUFFIX,ziffstatic.com,${BIZ.INTL_SITE}`,
  `DOMAIN-SUFFIX,ucoz.ru,${BIZ.INTL_SITE}`,
  `DOMAIN-SUFFIX,ucoz.net,${BIZ.INTL_SITE}`,
  `RULE-SET,akamai,${BIZ.INTL_SITE}`,
  `RULE-SET,digicert,${BIZ.INTL_SITE}`,
  `RULE-SET,globalsign,${BIZ.INTL_SITE}`,
  `RULE-SET,sectigo,${BIZ.INTL_SITE}`,
  `RULE-SET,brightcove,${BIZ.INTL_SITE}`,
  `RULE-SET,jwplayer,${BIZ.INTL_SITE}`,
  `DOMAIN-SUFFIX,letsencrypt.org,${BIZ.INTL_SITE}`,
  `DOMAIN-SUFFIX,lencr.org,${BIZ.INTL_SITE}`,
  `RULE-SET,proxy,${BIZ.INTL_SITE}`,
];
const GENERIC_INTL_NETWORK_FALLBACK_RULES = [
  `RULE-SET,cloudflare-ip,${BIZ.INTL_SITE},no-resolve`,
  `RULE-SET,cloudfront-ip,${BIZ.INTL_SITE},no-resolve`,
  `RULE-SET,fastly-ip,${BIZ.INTL_SITE},no-resolve`,
  `RULE-SET,cloudflare,${BIZ.INTL_SITE}`,
  `RULE-SET,acc-fastly,${BIZ.INTL_SITE}`,
  `GEOIP,ID,${BIZ.INTL_SITE},no-resolve`,
];
const GENERIC_INTL_FALLBACK_RULES = [
  ...GENERIC_INTL_EDGE_FALLBACK_RULES,
  ...GENERIC_INTL_NETWORK_FALLBACK_RULES,
  GENERIC_INTL_GEOIP_FALLBACK_RULE,
];

// v5.4.25: 预计算静态规则数组，避免 injectRules() 每次调用重建
const ACC_BANK_RULES = ['US','UK','HK','SG','JP','AU','CA','DE','NL','FR'].map(function(cc) { return 'RULE-SET,acc-bank-' + cc.toLowerCase() + ',' + BIZ.PAYMENTS })
const ACC_VF_RULES = ['wise','monzo','revolut'].map(function(svc) { return 'RULE-SET,acc-vf-' + svc + ',' + BIZ.PAYMENTS })
const ACC_FAKE_LOCATION_RULES = ['bilibili','kuaishou','xigua','weibo','zhihu','tieba','douban','xianyu'].map(function(app) { return 'RULE-SET,acc-fl-' + app + ',' + BIZ.CNMEDIA })
const SCKI_SUPPLEMENTAL_BASE = 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/supplemental/clash'
const SCKI = {
  ADFP_DIRECT: 'scki-adfp-direct',
  ADFP_INTL_SITE: 'scki-adfp-intl-site',
  ADFP_PAYMENTS: 'scki-adfp-payments',
  ADFP_AI: 'scki-adfp-ai',
  CNMEDIA_GUARD: 'scki-cnmedia-guard',
  LOCAL_DIRECT: 'scki-local-direct',
  LOCAL_PROCESS_DIRECT: 'scki-local-process-direct',
  WORK_PROCESS: 'scki-work-process',
  GFW_GUARD: 'scki-gfw-guard',
  YOUTUBE_GUARD: 'scki-youtube-guard',
  GOOGLE_MAIL_INTL: 'scki-google-mail-intl',
  GOOGLE_WORK: 'scki-google-work',
  DOWNLOAD_GUARD: 'scki-download-guard',
  CNSITE_GUARD: 'scki-cnsite-guard',
  WORK_GUARD: 'scki-work-guard',
  AI_SUPPLEMENT: 'scki-ai-supplement',
  GITHUB_API_TOOLS: 'scki-github-api-tools',
}
const SCKI_SUPPLEMENTAL_RULE_SETS = [
  [SCKI.ADFP_DIRECT, 'adfp-direct.list'],
  [SCKI.ADFP_INTL_SITE, 'adfp-intl-site.list'],
  [SCKI.ADFP_PAYMENTS, 'adfp-payments.list'],
  [SCKI.ADFP_AI, 'adfp-ai.list'],
  [SCKI.CNMEDIA_GUARD, 'cnmedia-guard.list'],
  [SCKI.LOCAL_DIRECT, 'local-direct.list'],
  [SCKI.LOCAL_PROCESS_DIRECT, 'local-process-direct.list'],
  [SCKI.WORK_PROCESS, 'work-process.list'],
  [SCKI.GFW_GUARD, 'gfw-guard.list'],
  [SCKI.YOUTUBE_GUARD, 'youtube-guard.list'],
  [SCKI.GOOGLE_MAIL_INTL, 'google-mail-intl.list'],
  [SCKI.GOOGLE_WORK, 'google-work.list'],
  [SCKI.DOWNLOAD_GUARD, 'download-guard.list'],
  [SCKI.CNSITE_GUARD, 'cnsite-guard.list'],
  [SCKI.WORK_GUARD, 'work-guard.list'],
  [SCKI.AI_SUPPLEMENT, 'ai-supplement.list'],
  [SCKI.GITHUB_API_TOOLS, 'github-api-tools.list'],
]














// BEGIN AUTO-GENERATED MIHOMO MRS OVERRIDES
// Generated by tools/apply-mihomo-mrs-overrides.js from rulesets/generated/mihomo-mrs/manifest.json.
const MIHOMO_MRS_RULESET_BASE = 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/mihomo-mrs'
const MIHOMO_MRS_PROVIDER_MAP = {"56":{"behavior":"domain","file":"56.mrs"},"acc-alipan":{"behavior":"domain","file":"acc-alipan.mrs"},"acc-appleai":{"behavior":"domain","file":"acc-appleai.mrs"},"acc-applenews":{"behavior":"domain","file":"acc-applenews.mrs"},"acc-baidunetdisk":{"behavior":"domain","file":"acc-baidunetdisk.mrs"},"acc-bank-au":{"behavior":"domain","file":"acc-bank-au.mrs"},"acc-bank-ca":{"behavior":"domain","file":"acc-bank-ca.mrs"},"acc-bank-de":{"behavior":"domain","file":"acc-bank-de.mrs"},"acc-bank-fr":{"behavior":"domain","file":"acc-bank-fr.mrs"},"acc-bank-hk":{"behavior":"domain","file":"acc-bank-hk.mrs"},"acc-bank-jp":{"behavior":"domain","file":"acc-bank-jp.mrs"},"acc-bank-nl":{"behavior":"domain","file":"acc-bank-nl.mrs"},"acc-bank-sg":{"behavior":"domain","file":"acc-bank-sg.mrs"},"acc-bank-uk":{"behavior":"domain","file":"acc-bank-uk.mrs"},"acc-chinamax":{"behavior":"domain","file":"acc-chinamax.mrs"},"acc-copilot":{"behavior":"domain","file":"acc-copilot.mrs"},"acc-emuleserver":{"behavior":"ipcidr","file":"acc-emuleserver.mrs"},"acc-fastly":{"behavior":"ipcidr","file":"acc-fastly.mrs"},"acc-fl-xigua":{"behavior":"domain","file":"acc-fl-xigua.mrs"},"acc-gemini":{"behavior":"domain","file":"acc-gemini.mrs"},"acc-geo-d-africa-central":{"behavior":"domain","file":"acc-geo-d-africa-central.mrs"},"acc-geo-d-africa-east":{"behavior":"domain","file":"acc-geo-d-africa-east.mrs"},"acc-geo-d-africa-north":{"behavior":"domain","file":"acc-geo-d-africa-north.mrs"},"acc-geo-d-africa-south":{"behavior":"domain","file":"acc-geo-d-africa-south.mrs"},"acc-geo-d-africa-west":{"behavior":"domain","file":"acc-geo-d-africa-west.mrs"},"acc-geo-d-america-north":{"behavior":"domain","file":"acc-geo-d-america-north.mrs"},"acc-geo-d-america-south":{"behavior":"domain","file":"acc-geo-d-america-south.mrs"},"acc-geo-d-antarctica":{"behavior":"domain","file":"acc-geo-d-antarctica.mrs"},"acc-geo-d-asia-central":{"behavior":"domain","file":"acc-geo-d-asia-central.mrs"},"acc-geo-d-asia-china":{"behavior":"domain","file":"acc-geo-d-asia-china.mrs"},"acc-geo-d-asia-east":{"behavior":"domain","file":"acc-geo-d-asia-east.mrs"},"acc-geo-d-asia-eastsouth":{"behavior":"domain","file":"acc-geo-d-asia-eastsouth.mrs"},"acc-geo-d-asia-south":{"behavior":"domain","file":"acc-geo-d-asia-south.mrs"},"acc-geo-d-asia-west":{"behavior":"domain","file":"acc-geo-d-asia-west.mrs"},"acc-geo-d-europe-east":{"behavior":"domain","file":"acc-geo-d-europe-east.mrs"},"acc-geo-d-europe-west":{"behavior":"domain","file":"acc-geo-d-europe-west.mrs"},"acc-geo-d-oceania":{"behavior":"domain","file":"acc-geo-d-oceania.mrs"},"acc-grok":{"behavior":"domain","file":"acc-grok.mrs"},"acc-homeip-jp":{"behavior":"domain","file":"acc-homeip-jp.mrs"},"acc-kwai":{"behavior":"domain","file":"acc-kwai.mrs"},"acc-macappupgrade":{"behavior":"domain","file":"acc-macappupgrade.mrs"},"acc-parsec":{"behavior":"domain","file":"acc-parsec.mrs"},"acc-rustdesk":{"behavior":"domain","file":"acc-rustdesk.mrs"},"acc-signal":{"behavior":"domain","file":"acc-signal.mrs"},"acc-unsupportvpn":{"behavior":"domain","file":"acc-unsupportvpn.mrs"},"advertisingmitv":{"behavior":"domain","file":"advertisingmitv.mrs"},"akamai":{"behavior":"domain","file":"akamai.mrs"},"all4":{"behavior":"domain","file":"all4.mrs"},"americasvoice":{"behavior":"domain","file":"americasvoice.mrs"},"android":{"behavior":"domain","file":"android.mrs"},"apkpure":{"behavior":"domain","file":"apkpure.mrs"},"appledev":{"behavior":"domain","file":"appledev.mrs"},"applenews":{"behavior":"domain","file":"applenews.mrs"},"appstore":{"behavior":"domain","file":"appstore.mrs"},"atlassian":{"behavior":"domain","file":"atlassian.mrs"},"attwatchtv":{"behavior":"domain","file":"attwatchtv.mrs"},"bestv":{"behavior":"domain","file":"bestv.mrs"},"binance":{"behavior":"domain","file":"binance.mrs"},"bing":{"behavior":"domain","file":"bing.mrs"},"bloomberg":{"behavior":"domain","file":"bloomberg.mrs"},"blued":{"behavior":"domain","file":"blued.mrs"},"brightcove":{"behavior":"domain","file":"brightcove.mrs"},"britboxuk":{"behavior":"domain","file":"britboxuk.mrs"},"cabletv":{"behavior":"domain","file":"cabletv.mrs"},"cake":{"behavior":"domain","file":"cake.mrs"},"canon":{"behavior":"domain","file":"canon.mrs"},"cctv":{"behavior":"domain","file":"cctv.mrs"},"cetv":{"behavior":"domain","file":"cetv.mrs"},"cht":{"behavior":"domain","file":"cht.mrs"},"cibn":{"behavior":"domain","file":"cibn.mrs"},"cisco":{"behavior":"domain","file":"cisco.mrs"},"civitai":{"behavior":"domain","file":"civitai.mrs"},"claude":{"behavior":"domain","file":"claude.mrs"},"clubhouse":{"behavior":"domain","file":"clubhouse.mrs"},"cnn":{"behavior":"domain","file":"cnn.mrs"},"cryptocurrency":{"behavior":"domain","file":"cryptocurrency.mrs"},"dailymotion":{"behavior":"domain","file":"dailymotion.mrs"},"dandanplay":{"behavior":"domain","file":"dandanplay.mrs"},"dandanzan":{"behavior":"domain","file":"dandanzan.mrs"},"deezer":{"behavior":"domain","file":"deezer.mrs"},"dell":{"behavior":"domain","file":"dell.mrs"},"developer":{"behavior":"domain","file":"developer.mrs"},"digicert":{"behavior":"domain","file":"digicert.mrs"},"discord":{"behavior":"domain","file":"discord.mrs"},"disqus":{"behavior":"domain","file":"disqus.mrs"},"docker":{"behavior":"domain","file":"docker.mrs"},"domob":{"behavior":"domain","file":"domob.mrs"},"dood":{"behavior":"domain","file":"dood.mrs"},"douyin":{"behavior":"domain","file":"douyin.mrs"},"douyu":{"behavior":"domain","file":"douyu.mrs"},"dropbox":{"behavior":"domain","file":"dropbox.mrs"},"duolingo":{"behavior":"domain","file":"duolingo.mrs"},"ea":{"behavior":"domain","file":"ea.mrs"},"ebay":{"behavior":"domain","file":"ebay.mrs"},"epic":{"behavior":"domain","file":"epic.mrs"},"fox":{"behavior":"domain","file":"fox.mrs"},"friday":{"behavior":"domain","file":"friday.mrs"},"fubotv":{"behavior":"domain","file":"fubotv.mrs"},"funshion":{"behavior":"domain","file":"funshion.mrs"},"garena":{"behavior":"domain","file":"garena.mrs"},"gitbook":{"behavior":"domain","file":"gitbook.mrs"},"gitlab":{"behavior":"domain","file":"gitlab.mrs"},"globalsign":{"behavior":"domain","file":"globalsign.mrs"},"gog":{"behavior":"domain","file":"gog.mrs"},"googlevoice":{"behavior":"domain","file":"googlevoice.mrs"},"hibymusic":{"behavior":"domain","file":"hibymusic.mrs"},"himalaya":{"behavior":"domain","file":"himalaya.mrs"},"hoyoverse":{"behavior":"domain","file":"hoyoverse.mrs"},"hp":{"behavior":"domain","file":"hp.mrs"},"huashutv":{"behavior":"domain","file":"huashutv.mrs"},"hunantv":{"behavior":"domain","file":"hunantv.mrs"},"huya":{"behavior":"domain","file":"huya.mrs"},"hwtv":{"behavior":"domain","file":"hwtv.mrs"},"ibm":{"behavior":"domain","file":"ibm.mrs"},"imgur":{"behavior":"domain","file":"imgur.mrs"},"intel":{"behavior":"domain","file":"intel.mrs"},"intercom":{"behavior":"domain","file":"intercom.mrs"},"iptvmainland":{"behavior":"domain","file":"iptvmainland.mrs"},"iptvother":{"behavior":"ipcidr","file":"iptvother.mrs"},"itv":{"behavior":"domain","file":"itv.mrs"},"jfrog":{"behavior":"domain","file":"jfrog.mrs"},"jiguangtuisong":{"behavior":"domain","file":"jiguangtuisong.mrs"},"jwplayer":{"behavior":"domain","file":"jwplayer.mrs"},"kktv":{"behavior":"domain","file":"kktv.mrs"},"ku6":{"behavior":"domain","file":"ku6.mrs"},"kuaishou":{"behavior":"domain","file":"kuaishou.mrs"},"kukemusic":{"behavior":"domain","file":"kukemusic.mrs"},"lastfm":{"behavior":"domain","file":"lastfm.mrs"},"letv":{"behavior":"domain","file":"letv.mrs"},"linkedin":{"behavior":"domain","file":"linkedin.mrs"},"litv":{"behavior":"domain","file":"litv.mrs"},"londonreal":{"behavior":"domain","file":"londonreal.mrs"},"mail":{"behavior":"domain","file":"mail.mrs"},"mailru":{"behavior":"domain","file":"mailru.mrs"},"majsoul":{"behavior":"domain","file":"majsoul.mrs"},"mewatch":{"behavior":"domain","file":"mewatch.mrs"},"microsoftedge":{"behavior":"domain","file":"microsoftedge.mrs"},"migu":{"behavior":"domain","file":"migu.mrs"},"miuiprivacy":{"behavior":"domain","file":"miuiprivacy.mrs"},"miwu":{"behavior":"domain","file":"miwu.mrs"},"moov":{"behavior":"domain","file":"moov.mrs"},"mozilla":{"behavior":"domain","file":"mozilla.mrs"},"my5":{"behavior":"domain","file":"my5.mrs"},"nbc":{"behavior":"domain","file":"nbc.mrs"},"niconico":{"behavior":"domain","file":"niconico.mrs"},"nike":{"behavior":"domain","file":"nike.mrs"},"nikkei":{"behavior":"domain","file":"nikkei.mrs"},"notion":{"behavior":"domain","file":"notion.mrs"},"nowe":{"behavior":"domain","file":"nowe.mrs"},"nvidia":{"behavior":"domain","file":"nvidia.mrs"},"nytimes":{"behavior":"domain","file":"nytimes.mrs"},"oracle":{"behavior":"domain","file":"oracle.mrs"},"overcast":{"behavior":"domain","file":"overcast.mrs"},"pandora":{"behavior":"domain","file":"pandora.mrs"},"pandoratv":{"behavior":"domain","file":"pandoratv.mrs"},"paramount":{"behavior":"domain","file":"paramount.mrs"},"pbs":{"behavior":"domain","file":"pbs.mrs"},"peacock":{"behavior":"domain","file":"peacock.mrs"},"pinterest":{"behavior":"domain","file":"pinterest.mrs"},"pixiv":{"behavior":"domain","file":"pixiv.mrs"},"pixnet":{"behavior":"domain","file":"pixnet.mrs"},"playstation":{"behavior":"domain","file":"playstation.mrs"},"pptv":{"behavior":"domain","file":"pptv.mrs"},"protonmail":{"behavior":"domain","file":"protonmail.mrs"},"python":{"behavior":"domain","file":"python.mrs"},"rakuten":{"behavior":"domain","file":"rakuten.mrs"},"reddit":{"behavior":"domain","file":"reddit.mrs"},"riot":{"behavior":"domain","file":"riot.mrs"},"rockstar":{"behavior":"domain","file":"rockstar.mrs"},"rthk":{"behavior":"domain","file":"rthk.mrs"},"salesforce":{"behavior":"domain","file":"salesforce.mrs"},"samsung":{"behavior":"domain","file":"samsung.mrs"},"scholar":{"behavior":"domain","file":"scholar.mrs"},"scki-adfp-ai":{"behavior":"domain","file":"scki-adfp-ai.mrs"},"scki-adfp-direct":{"behavior":"domain","file":"scki-adfp-direct.mrs"},"scki-adfp-intl-site":{"behavior":"domain","file":"scki-adfp-intl-site.mrs"},"scki-adfp-payments":{"behavior":"domain","file":"scki-adfp-payments.mrs"},"scki-ai-supplement":{"behavior":"domain","file":"scki-ai-supplement.mrs"},"scki-cnmedia-guard":{"behavior":"domain","file":"scki-cnmedia-guard.mrs"},"scki-cnsite-guard":{"behavior":"domain","file":"scki-cnsite-guard.mrs"},"scki-download-guard":{"behavior":"domain","file":"scki-download-guard.mrs"},"scki-gfw-guard":{"behavior":"domain","file":"scki-gfw-guard.mrs"},"scki-github-api-tools":{"behavior":"domain","file":"scki-github-api-tools.mrs"},"scki-google-mail-intl":{"behavior":"domain","file":"scki-google-mail-intl.mrs"},"scki-google-work":{"behavior":"domain","file":"scki-google-work.mrs"},"scki-work-guard":{"behavior":"domain","file":"scki-work-guard.mrs"},"scki-youtube-guard":{"behavior":"domain","file":"scki-youtube-guard.mrs"},"sectigo":{"behavior":"domain","file":"sectigo.mrs"},"siri":{"behavior":"domain","file":"siri.mrs"},"slack":{"behavior":"domain","file":"slack.mrs"},"sling":{"behavior":"domain","file":"sling.mrs"},"smg":{"behavior":"domain","file":"smg.mrs"},"sohu":{"behavior":"domain","file":"sohu.mrs"},"sony":{"behavior":"domain","file":"sony.mrs"},"soundcloud":{"behavior":"domain","file":"soundcloud.mrs"},"spark":{"behavior":"domain","file":"spark.mrs"},"steamcn":{"behavior":"domain","file":"steamcn.mrs"},"sublimetext":{"behavior":"domain","file":"sublimetext.mrs"},"sukka-phishing":{"behavior":"domain","file":"sukka-phishing.mrs"},"systemota":{"behavior":"domain","file":"systemota.mrs"},"szkane-netflixip":{"behavior":"ipcidr","file":"szkane-netflixip.mrs"},"taihemusic":{"behavior":"domain","file":"taihemusic.mrs"},"taiwangood":{"behavior":"domain","file":"taiwangood.mrs"},"teams":{"behavior":"domain","file":"teams.mrs"},"telegramnl":{"behavior":"ipcidr","file":"telegramnl.mrs"},"telegramsg":{"behavior":"ipcidr","file":"telegramsg.mrs"},"telegramus":{"behavior":"ipcidr","file":"telegramus.mrs"},"tesla":{"behavior":"domain","file":"tesla.mrs"},"tiantiankankan":{"behavior":"domain","file":"tiantiankankan.mrs"},"tidal":{"behavior":"domain","file":"tidal.mrs"},"tigerfintech":{"behavior":"domain","file":"tigerfintech.mrs"},"truthsocial":{"behavior":"domain","file":"truthsocial.mrs"},"tumblr":{"behavior":"domain","file":"tumblr.mrs"},"tvb":{"behavior":"domain","file":"tvb.mrs"},"tver":{"behavior":"domain","file":"tver.mrs"},"ubi":{"behavior":"domain","file":"ubi.mrs"},"ubuntu":{"behavior":"domain","file":"ubuntu.mrs"},"vidoltv":{"behavior":"domain","file":"vidoltv.mrs"},"viki":{"behavior":"domain","file":"viki.mrs"},"vimeo":{"behavior":"domain","file":"vimeo.mrs"},"visa":{"behavior":"domain","file":"visa.mrs"},"vk":{"behavior":"domain","file":"vk.mrs"},"wankahuanju":{"behavior":"domain","file":"wankahuanju.mrs"},"wanmeishijie":{"behavior":"domain","file":"wanmeishijie.mrs"},"wikipedia":{"behavior":"domain","file":"wikipedia.mrs"},"wix":{"behavior":"domain","file":"wix.mrs"},"wordpress":{"behavior":"domain","file":"wordpress.mrs"},"xbox":{"behavior":"domain","file":"xbox.mrs"},"xiaohongshu":{"behavior":"domain","file":"xiaohongshu.mrs"},"yizhibo":{"behavior":"domain","file":"yizhibo.mrs"},"youmengchuangxiang":{"behavior":"domain","file":"youmengchuangxiang.mrs"},"yyets":{"behavior":"domain","file":"yyets.mrs"},"zalo":{"behavior":"domain","file":"zalo.mrs"},"zee":{"behavior":"domain","file":"zee.mrs"},"zendesk":{"behavior":"domain","file":"zendesk.mrs"},"zoho":{"behavior":"domain","file":"zoho.mrs"},"zoom":{"behavior":"domain","file":"zoom.mrs"}}
const MIHOMO_MRS_SPLIT_PROVIDER_MAP = {"acc-fl-bilibili":{"domain":"acc-fl-bilibili-domain.mrs","ipcidr":"acc-fl-bilibili-ipcidr.mrs"},"acc-fl-douban":{"domain":"acc-fl-douban-domain.mrs","ipcidr":"acc-fl-douban-ipcidr.mrs"},"acc-fl-tieba":{"domain":"acc-fl-tieba-domain.mrs","ipcidr":"acc-fl-tieba-ipcidr.mrs"},"acc-waybackmachine":{"domain":"acc-waybackmachine-domain.mrs","ipcidr":"acc-waybackmachine-ipcidr.mrs"},"acc-weiyun":{"domain":"acc-weiyun-domain.mrs","ipcidr":"acc-weiyun-ipcidr.mrs"},"adobeactivation":{"domain":"adobeactivation-domain.mrs","ipcidr":"adobeactivation-ipcidr.mrs"},"blizzard":{"domain":"blizzard-domain.mrs","ipcidr":"blizzard-ipcidr.mrs"},"blockhttpdns":{"domain":"blockhttpdns-domain.mrs","ipcidr":"blockhttpdns-ipcidr.mrs"},"cloudflare":{"domain":"cloudflare-domain.mrs","ipcidr":"cloudflare-ipcidr.mrs"},"clubhouseip":{"domain":"clubhouseip-domain.mrs","ipcidr":"clubhouseip-ipcidr.mrs"},"dmm":{"domain":"dmm-domain.mrs","ipcidr":"dmm-ipcidr.mrs"},"ehgallery":{"domain":"ehgallery-domain.mrs","ipcidr":"ehgallery-ipcidr.mrs"},"googlefcm":{"domain":"googlefcm-domain.mrs","ipcidr":"googlefcm-ipcidr.mrs"},"hijacking":{"domain":"hijacking-domain.mrs","ipcidr":"hijacking-ipcidr.mrs"},"kakaotalk":{"domain":"kakaotalk-domain.mrs","ipcidr":"kakaotalk-ipcidr.mrs"},"kugoukuwo":{"domain":"kugoukuwo-domain.mrs","ipcidr":"kugoukuwo-ipcidr.mrs"},"lg":{"domain":"lg-domain.mrs","ipcidr":"lg-ipcidr.mrs"},"line":{"domain":"line-domain.mrs","ipcidr":"line-ipcidr.mrs"},"neteasemusic":{"domain":"neteasemusic-domain.mrs","ipcidr":"neteasemusic-ipcidr.mrs"},"nintendo":{"domain":"nintendo-domain.mrs","ipcidr":"nintendo-ipcidr.mrs"},"qobuz":{"domain":"qobuz-domain.mrs","ipcidr":"qobuz-ipcidr.mrs"},"scki-local-direct":{"domain":"scki-local-direct-domain.mrs","ipcidr":"scki-local-direct-ipcidr.mrs"},"supercell":{"domain":"supercell-domain.mrs","ipcidr":"supercell-ipcidr.mrs"},"szkane-bilihmt":{"domain":"szkane-bilihmt-domain.mrs","ipcidr":"szkane-bilihmt-ipcidr.mrs"},"teamviewer":{"domain":"teamviewer-domain.mrs","ipcidr":"teamviewer-ipcidr.mrs"},"tencentvideo":{"domain":"tencentvideo-domain.mrs","ipcidr":"tencentvideo-ipcidr.mrs"},"yandex":{"domain":"yandex-domain.mrs","ipcidr":"yandex-ipcidr.mrs"},"youku":{"domain":"youku-domain.mrs","ipcidr":"youku-ipcidr.mrs"}}
const MIHOMO_MRS_PARTIAL_PROVIDER_MAP = {"acc-apple":{"domain":"acc-apple-domain.mrs","ipcidr":"acc-apple-ipcidr.mrs","residual":"acc-apple-classical.yaml"},"acc-aqara-cn":{"domain":"acc-aqara-cn-domain.mrs","residual":"acc-aqara-cn-classical.yaml"},"acc-aqara-global":{"domain":"acc-aqara-global-domain.mrs","ipcidr":"acc-aqara-global-ipcidr.mrs","residual":"acc-aqara-global-classical.yaml"},"acc-bank-us":{"domain":"acc-bank-us-domain.mrs","residual":"acc-bank-us-classical.yaml"},"acc-fl-weibo":{"domain":"acc-fl-weibo-domain.mrs","residual":"acc-fl-weibo-classical.yaml"},"acc-fl-xianyu":{"domain":"acc-fl-xianyu-domain.mrs","ipcidr":"acc-fl-xianyu-ipcidr.mrs","residual":"acc-fl-xianyu-classical.yaml"},"acc-fl-zhihu":{"domain":"acc-fl-zhihu-domain.mrs","ipcidr":"acc-fl-zhihu-ipcidr.mrs","residual":"acc-fl-zhihu-classical.yaml"},"acc-hijackingplus":{"domain":"acc-hijackingplus-domain.mrs","ipcidr":"acc-hijackingplus-ipcidr.mrs","residual":"acc-hijackingplus-classical.yaml"},"acc-homeip-us":{"domain":"acc-homeip-us-domain.mrs","residual":"acc-homeip-us-classical.yaml"},"acc-microsoftapps":{"domain":"acc-microsoftapps-domain.mrs","residual":"acc-microsoftapps-classical.yaml"},"acc-pornhub":{"domain":"acc-pornhub-domain.mrs","residual":"acc-pornhub-classical.yaml"},"acc-prerepaireasyprivacy":{"domain":"acc-prerepaireasyprivacy-domain.mrs","residual":"acc-prerepaireasyprivacy-classical.yaml"},"acc-vf-monzo":{"domain":"acc-vf-monzo-domain.mrs","residual":"acc-vf-monzo-classical.yaml"},"acc-vf-revolut":{"domain":"acc-vf-revolut-domain.mrs","residual":"acc-vf-revolut-classical.yaml"},"acc-vf-wise":{"domain":"acc-vf-wise-domain.mrs","residual":"acc-vf-wise-classical.yaml"},"adobe":{"domain":"adobe-domain.mrs","residual":"adobe-classical.yaml"},"advertising":{"ipcidr":"advertising-ipcidr.mrs","residual":"advertising-classical.yaml"},"amazon":{"domain":"amazon-domain.mrs","ipcidr":"amazon-ipcidr.mrs","residual":"amazon-classical.yaml"},"applefirmware":{"domain":"applefirmware-domain.mrs","residual":"applefirmware-classical.yaml"},"applemusic":{"domain":"applemusic-domain.mrs","residual":"applemusic-classical.yaml"},"appleproxy":{"domain":"appleproxy-domain.mrs","residual":"appleproxy-classical.yaml"},"appletv":{"domain":"appletv-domain.mrs","residual":"appletv-classical.yaml"},"asianmedia":{"domain":"asianmedia-domain.mrs","ipcidr":"asianmedia-ipcidr.mrs","residual":"asianmedia-classical.yaml"},"bytedance":{"domain":"bytedance-domain.mrs","ipcidr":"bytedance-ipcidr.mrs","residual":"bytedance-classical.yaml"},"cbs":{"domain":"cbs-domain.mrs","residual":"cbs-classical.yaml"},"copilot":{"domain":"copilot-domain.mrs","ipcidr":"copilot-ipcidr.mrs","residual":"copilot-classical.yaml"},"dazn":{"domain":"dazn-domain.mrs","residual":"dazn-classical.yaml"},"discoveryplus":{"domain":"discoveryplus-domain.mrs","residual":"discoveryplus-classical.yaml"},"disney":{"domain":"disney-domain.mrs","residual":"disney-classical.yaml"},"download":{"domain":"download-domain.mrs","residual":"download-classical.yaml"},"emby":{"domain":"emby-domain.mrs","residual":"emby-classical.yaml"},"facebook":{"domain":"facebook-domain.mrs","ipcidr":"facebook-ipcidr.mrs","residual":"facebook-classical.yaml"},"gemini":{"domain":"gemini-domain.mrs","residual":"gemini-classical.yaml"},"hamivideo":{"domain":"hamivideo-domain.mrs","residual":"hamivideo-classical.yaml"},"hbo":{"domain":"hbo-domain.mrs","residual":"hbo-classical.yaml"},"hulu":{"domain":"hulu-domain.mrs","residual":"hulu-classical.yaml"},"instagram":{"domain":"instagram-domain.mrs","residual":"instagram-classical.yaml"},"iqiyi":{"domain":"iqiyi-domain.mrs","ipcidr":"iqiyi-ipcidr.mrs","residual":"iqiyi-classical.yaml"},"iqiyiintl":{"domain":"iqiyiintl-domain.mrs","ipcidr":"iqiyiintl-ipcidr.mrs","residual":"iqiyiintl-classical.yaml"},"italkbb":{"domain":"italkbb-domain.mrs","residual":"italkbb-classical.yaml"},"japonx":{"domain":"japonx-domain.mrs","residual":"japonx-classical.yaml"},"joox":{"domain":"joox-domain.mrs","ipcidr":"joox-ipcidr.mrs","residual":"joox-classical.yaml"},"linetv":{"domain":"linetv-domain.mrs","residual":"linetv-classical.yaml"},"mega":{"domain":"mega-domain.mrs","ipcidr":"mega-ipcidr.mrs","residual":"mega-classical.yaml"},"mytvsuper":{"domain":"mytvsuper-domain.mrs","residual":"mytvsuper-classical.yaml"},"naver":{"domain":"naver-domain.mrs","ipcidr":"naver-ipcidr.mrs","residual":"naver-classical.yaml"},"nivodtv":{"domain":"nivodtv-domain.mrs","residual":"nivodtv-classical.yaml"},"olevod":{"domain":"olevod-domain.mrs","residual":"olevod-classical.yaml"},"paypal":{"domain":"paypal-domain.mrs","residual":"paypal-classical.yaml"},"primevideo":{"domain":"primevideo-domain.mrs","residual":"primevideo-classical.yaml"},"privacy":{"ipcidr":"privacy-ipcidr.mrs","residual":"privacy-classical.yaml"},"privatetracker":{"domain":"privatetracker-domain.mrs","ipcidr":"privatetracker-ipcidr.mrs","residual":"privatetracker-classical.yaml"},"skygo":{"domain":"skygo-domain.mrs","residual":"skygo-classical.yaml"},"steam":{"domain":"steam-domain.mrs","residual":"steam-classical.yaml"},"szkane-ai":{"domain":"szkane-ai-domain.mrs","ipcidr":"szkane-ai-ipcidr.mrs","residual":"szkane-ai-classical.yaml"},"szkane-ciciai":{"domain":"szkane-ciciai-domain.mrs","ipcidr":"szkane-ciciai-ipcidr.mrs","residual":"szkane-ciciai-classical.yaml"},"szkane-developer":{"domain":"szkane-developer-domain.mrs","residual":"szkane-developer-classical.yaml"},"szkane-edutools":{"domain":"szkane-edutools-domain.mrs","residual":"szkane-edutools-classical.yaml"},"szkane-khan":{"domain":"szkane-khan-domain.mrs","residual":"szkane-khan-classical.yaml"},"szkane-proxygfw":{"domain":"szkane-proxygfw-domain.mrs","ipcidr":"szkane-proxygfw-ipcidr.mrs","residual":"szkane-proxygfw-classical.yaml"},"szkane-uk":{"domain":"szkane-uk-domain.mrs","residual":"szkane-uk-classical.yaml"},"szkane-web3":{"domain":"szkane-web3-domain.mrs","residual":"szkane-web3-classical.yaml"},"testflight":{"domain":"testflight-domain.mrs","residual":"testflight-classical.yaml"},"twitch":{"domain":"twitch-domain.mrs","ipcidr":"twitch-ipcidr.mrs","residual":"twitch-classical.yaml"},"unity":{"domain":"unity-domain.mrs","residual":"unity-classical.yaml"},"viu":{"domain":"viu-domain.mrs","residual":"viu-classical.yaml"},"vpsdance-ai-coding":{"domain":"vpsdance-ai-coding-domain.mrs","ipcidr":"vpsdance-ai-coding-ipcidr.mrs","residual":"vpsdance-ai-coding-classical.yaml"},"weibo":{"domain":"weibo-domain.mrs","residual":"weibo-classical.yaml"},"wetv":{"domain":"wetv-domain.mrs","ipcidr":"wetv-ipcidr.mrs","residual":"wetv-classical.yaml"},"whatsapp":{"domain":"whatsapp-domain.mrs","ipcidr":"whatsapp-ipcidr.mrs","residual":"whatsapp-classical.yaml"}}

function applyMihomoMrsRuleProviderOverrides(config) {
  if (typeof SCKI_DISABLE_MIHOMO_MRS_OVERRIDES !== 'undefined' && SCKI_DISABLE_MIHOMO_MRS_OVERRIDES) return
  var providers = config['rule-providers'] || {}
  Object.keys(MIHOMO_MRS_PROVIDER_MAP).forEach(function(id) {
    var current = providers[id]
    if (!current) return
    var spec = MIHOMO_MRS_PROVIDER_MAP[id]
    providers[id] = {
      type: 'http',
      behavior: spec.behavior,
      format: 'mrs',
      url: MIHOMO_MRS_RULESET_BASE + '/' + spec.file,
      path: './ruleset/scki-mrs-' + spec.file,
      interval: current.interval,
      proxy: current.proxy,
    }
  })
  Object.keys(MIHOMO_MRS_SPLIT_PROVIDER_MAP).forEach(function(id) {
    var current = providers[id]
    if (!current) return
    var spec = MIHOMO_MRS_SPLIT_PROVIDER_MAP[id]
    delete providers[id]
    if (spec.domain) providers[id + '-domain'] = { type: 'http', behavior: 'domain', format: 'mrs', url: MIHOMO_MRS_RULESET_BASE + '/' + spec.domain, path: './ruleset/scki-mrs-' + spec.domain, interval: current.interval, proxy: current.proxy }
    if (spec.ipcidr) providers[id + '-ipcidr'] = { type: 'http', behavior: 'ipcidr', format: 'mrs', url: MIHOMO_MRS_RULESET_BASE + '/' + spec.ipcidr, path: './ruleset/scki-mrs-' + spec.ipcidr, interval: current.interval, proxy: current.proxy }
  })
  Object.keys(MIHOMO_MRS_PARTIAL_PROVIDER_MAP).forEach(function(id) {
    var current = providers[id]
    if (!current) return
    var spec = MIHOMO_MRS_PARTIAL_PROVIDER_MAP[id]
    delete providers[id]
    if (spec.domain) providers[id + '-domain'] = { type: 'http', behavior: 'domain', format: 'mrs', url: MIHOMO_MRS_RULESET_BASE + '/' + spec.domain, path: './ruleset/scki-mrs-' + spec.domain, interval: current.interval, proxy: current.proxy }
    if (spec.ipcidr) providers[id + '-ipcidr'] = { type: 'http', behavior: 'ipcidr', format: 'mrs', url: MIHOMO_MRS_RULESET_BASE + '/' + spec.ipcidr, path: './ruleset/scki-mrs-' + spec.ipcidr, interval: current.interval, proxy: current.proxy }
    if (spec.residual) providers[id + '-classical'] = { type: 'http', behavior: 'classical', format: 'yaml', url: MIHOMO_MRS_RULESET_BASE + '/' + spec.residual, path: './ruleset/scki-mrs-' + spec.residual, interval: current.interval, proxy: current.proxy }
  })
}

function expandMihomoMrsSplitRules(rules) {
  if (typeof SCKI_DISABLE_MIHOMO_MRS_OVERRIDES !== 'undefined' && SCKI_DISABLE_MIHOMO_MRS_OVERRIDES) return rules
  var expanded = []
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i]
    var match = /^RULE-SET,([^,]+),(.+)$/.exec(rule)
    if (!match || (!MIHOMO_MRS_SPLIT_PROVIDER_MAP[match[1]] && !MIHOMO_MRS_PARTIAL_PROVIDER_MAP[match[1]])) { expanded.push(rule); continue }
    var id = match[1]
    var tail = match[2]
    var domainTail = tail.replace(/,no-resolve$/, '')
    var spec = MIHOMO_MRS_SPLIT_PROVIDER_MAP[id] || MIHOMO_MRS_PARTIAL_PROVIDER_MAP[id]
    if (spec.domain) expanded.push('RULE-SET,' + id + '-domain,' + domainTail)
    if (spec.ipcidr) expanded.push('RULE-SET,' + id + '-ipcidr,' + tail)
    if (spec.residual) expanded.push('RULE-SET,' + id + '-classical,' + domainTail)
  }
  rules.splice.apply(rules, [0, rules.length].concat(expanded))
  return rules
}
// END AUTO-GENERATED MIHOMO MRS OVERRIDES








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
const GEO_REGIONS_INTL_D_RULES = GEO_REGIONS_INTL.map(function(r) { return 'RULE-SET,acc-geo-d-' + r.toLowerCase().replace(/_/g,'-') + ',' + BIZ.INTL_SITE })
const GEO_REGIONS_INTL_IP_RULES = GEO_REGIONS_INTL.map(function(r) { return 'RULE-SET,acc-geo-ip-' + r.toLowerCase().replace(/_/g,'-') + ',' + BIZ.INTL_SITE + ',no-resolve' })



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

  // ============ #70 高德地图国内站点 ============
  metaDomain('amap', 'amap')

  // ============ #71~73 国内/国外兜底 ============
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
    bm7('sony', 'Sony')
    bm7('yandex', 'Yandex')
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
    // HaGeZi Ultimate：保留历史 provider id `hagezi-tif`，但实际资产是
    // MiHomoer HageziUltimate.mrs。融合编译器必须映射到同源
    // wildcard/ultimate-onlydomains.txt，禁止替换成体量和语义不同的完整 TIF。
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
    config['rule-providers']['vpsdance-ai-coding'] = { type: 'http', behavior: 'classical', url: 'https://fastly.jsdelivr.net/gh/VPSDance/ai-proxy-rules@main/rules/clash/coding.yaml', path: './ruleset/vpsdance-ai-coding.yaml', interval: nextInterval(), proxy: RP_PROXY }

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
    // ── 金融服务：VirtualFinance × 3（原 acc-virtualfinance 404 → 拆分；PayPal 被 paypal 主规则覆盖）──
    for (const svc of ['Wise', 'Monzo', 'Revolut']) {
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
    // v5.1.1: FakeLocation × 8 平台（原 acc-fakelocation 404 → 拆分；DouYin / XiaoHongShu 被主规则覆盖）
    for (const app of [
      'BiliBili', 'KuaiShou', 'XiGua',
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
    // 区域路由规则变化极慢，interval 用 7 天（604800s）减少 34 providers 的并发刷新频率
    const GEO_INTERVAL = 604800
    for (const region of GEO_REGIONS_ALL) {
      const slug = region.toLowerCase().replace(/_/g, '-')
      config['rule-providers'][`acc-geo-d-${slug}`] = {
        type: 'http', behavior: 'domain',
        url: `${ACC}/GeoRouting_For_Domain/GeoRouting_${region}_ccTLD_Domain.yaml`,
        path: `./ruleset/acc-GeoD-${region}.yaml`,
        interval: GEO_INTERVAL,
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
        interval: GEO_INTERVAL,
        proxy: RP_PROXY
      }
    }

  for (const item of SCKI_SUPPLEMENTAL_RULE_SETS) {
    const id = item[0]
    const file = item[1]
    config['rule-providers'][id] = {
      type: 'http',
      behavior: 'classical',
      format: 'text',
      url: `${SCKI_SUPPLEMENTAL_BASE}/${file}`,
      path: `./ruleset/${id}.list`,
      interval: 604800,
      proxy: RP_PROXY
    }
  }

  applyMihomoMrsRuleProviderOverrides(config)

  const count = Object.keys(config['rule-providers']).length
  sourceGraphLog(`[${VERSION}] Injected ${count} rule-providers (base=${RP_BASE}s step=${RP_STEP}s spread=${_rpIdx * RP_STEP}s/${(_rpIdx * RP_STEP / 60).toFixed(1)}min)`)
}



// ================================================================
//  模块 H：规则注入
// ================================================================

function injectRules(config) {
  config.rules = [
    // Repository-owned supplemental guards stay before all ad/phishing/TIF providers.
    `RULE-SET,${SCKI.ADFP_DIRECT},DIRECT`,
    `RULE-SET,${SCKI.ADFP_INTL_SITE},${BIZ.INTL_SITE}`,
    `RULE-SET,${SCKI.ADFP_PAYMENTS},${BIZ.PAYMENTS}`,
    // ChatGPT telemetry overlaps broad ad/privacy lists (Sentry/DataDog); retain AI routing.
    `RULE-SET,${SCKI.ADFP_AI},${BIZ.AI}`,
    `RULE-SET,${SCKI.CNMEDIA_GUARD},${BIZ.CNMEDIA}`,
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
    `RULE-SET,miuiprivacy,${BIZ.AD}`,
    `RULE-SET,privacy,${BIZ.AD}`,
    `RULE-SET,youmengchuangxiang,${BIZ.AD}`,
    // v5.4.34 FIX#169-AMAP: webapi.amap.com 属高德地图国内 API。专用 amap 规则放在广告/威胁规则之后、
    //   TikTok/GFW/geolocation-!cn 宽规则之前，避免依赖尾部 RULE-SET,cn 才直连。
    `RULE-SET,amap,${BIZ.CN_SITE}`,
    // v5.4.22 #1 借鉴 Proxy-override：QUIC 精细化——YouTube/Google/MS/Apple 白名单豁免（QUIC 走对应业务组），其余海外 QUIC REJECT 强制回退 HTTP/2
    `AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,youtube)),${BIZ.YT}`,
    `AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,google)),${BIZ.GOOGLE}`,
    `AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,microsoft)),${BIZ.MS}`,
    `AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,apple)),${BIZ.APPLE}`,
    `AND,((DST-PORT,443),(NETWORK,UDP),(NOT,((GEOSITE,cn)))),REJECT`,
    // v5.2.1 FIX#19: DST-PORT,7680 必须在 GEOIP,private 之前，否则私有 IP 先匹配走 DIRECT
    'DST-PORT,7680,REJECT',
    'GEOSITE,private,DIRECT',
    'GEOIP,private,DIRECT,no-resolve',
    `RULE-SET,${SCKI.LOCAL_DIRECT},DIRECT`,
    `RULE-SET,${SCKI.LOCAL_PROCESS_DIRECT},DIRECT`,
    // v5.4.11 FIX#RD-PROC: RustDesk public relay/API must not be forced DIRECT;
    // private/LAN destinations already hit GEOSITE/GEOIP private above.
    `RULE-SET,${SCKI.WORK_PROCESS},${BIZ.WORK}`,
    'DST-PORT,26880,DIRECT',
    'DST-PORT,6540,DIRECT',
    'DST-PORT,33068,DIRECT',
    'DST-PORT,123,DIRECT',
    // v5.4.13 FIX#STUN-REALIP: keep standard STUN/TURN discovery on DIRECT.
    // UDP/443 TURN remains governed by the QUIC policy above.
    'DST-PORT,3478,DIRECT',
    'DST-PORT,3479,DIRECT',
    'DST-PORT,5349,DIRECT',
    'DST-PORT,19302,DIRECT',
    'DST-PORT,19305,DIRECT',
    'DST-PORT,19307,DIRECT',
    // v5.2.0 CLEAN#2: Binance 精确 DOMAIN 规则已清理（全部被同组 DOMAIN-SUFFIX 覆盖）
    // 保留 fake-ip-filter 中的精确域名（DNS 层独立于规则层，不受影响）
    `DOMAIN-SUFFIX,binance.vision,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,binance.info,${BIZ.CRYPTO}`,
    `DOMAIN-SUFFIX,binance.org,${BIZ.CRYPTO}`,
    // Google / YouTube / 国内 AI 防吞盾：零散域名沉淀到 rulesets/supplemental。
    `RULE-SET,${SCKI.GFW_GUARD},${BIZ.GFW}`,
    `RULE-SET,${SCKI.YOUTUBE_GUARD},${BIZ.YT}`,
    `RULE-SET,${SCKI.CNSITE_GUARD},${BIZ.CN_SITE}`,
    `RULE-SET,openai,${BIZ.AI}`,
    `RULE-SET,claude,${BIZ.AI}`,
    `RULE-SET,gemini,${BIZ.GOOGLE}`,
    // v5.4.10 FIX#RD-COPILOT: RustDesk relay/API before broad Copilot ASN rules.
    `RULE-SET,${SCKI.WORK_GUARD},${BIZ.WORK}`,
    `RULE-SET,copilot,${BIZ.AI}`,
    `RULE-SET,${SCKI.AI_SUPPLEMENT},${BIZ.AI}`,
    `RULE-SET,civitai,${BIZ.AI}`,
    // ════════════════════════════════════════════════════════════════
    //  v5.1.8 FIX#14-P0：Google 子服务防吞盾
    //  szkane AiDomain.list 含 Google 宽域名（因 Gemini/Bard），导致 Google 全系误走 AI 代理
    //  解法：在 RULE-SET,szkane-ai 之前前置所有 Google 非 AI 子服务精准规则
    //  已安全（在此之前已匹配）：Gemini(RULE-SET) / NotebookLM / YouTube / dns.google
    //  ▼ 以下规则从各业务区块提升至此，原位置 dead rules 已在 v5.1.9 清除
    // ════════════════════════════════════════════════════════════════
    // ── Google 邮件 ──
    `RULE-SET,${SCKI.GOOGLE_MAIL_INTL},${BIZ.INTL_SITE}`,
    // ── Google 即时通讯 ──
    `RULE-SET,googlevoice,${BIZ.IM}`,
    // ── Google 会议协作 ──
    `RULE-SET,${SCKI.GOOGLE_WORK},${BIZ.WORK}`,
    // ── Google / Microsoft 下载更新防吞 ──
    `RULE-SET,${SCKI.DOWNLOAD_GUARD},${BIZ.DOWNLOAD}`,
    `RULE-SET,googlefcm,${BIZ.DOWNLOAD}`,
    // ── Google 基础服务（兜底：MetaCubeX geosite:google 覆盖 google.com/co.*/com.*）──
    `RULE-SET,google,${BIZ.GOOGLE}`,
    `RULE-SET,google-ip,${BIZ.GOOGLE},no-resolve`,
    // api.github.com is shared by ordinary GitHub API traffic and VS Code Copilot.
    // Keep the AI route process-scoped; every other client falls through to Tools.
    `AND,((PROCESS-NAME,Code Helper),(DOMAIN,api.github.com)),${BIZ.AI}`,
    `AND,((PROCESS-NAME,Code Helper (Plugin)),(DOMAIN,api.github.com)),${BIZ.AI}`,
    `RULE-SET,${SCKI.GITHUB_API_TOOLS},${BIZ.TOOLS}`,
    // ════════════════════════════════════════════════════════════════
    // v5.1: szkane AI 综合 + Accademia AI 补充
    `RULE-SET,szkane-ai,${BIZ.AI}`,
    `RULE-SET,szkane-ciciai,${BIZ.AI}`,
    `RULE-SET,acc-appleai,${BIZ.AI}`,
    `RULE-SET,acc-grok,${BIZ.AI}`,
    `RULE-SET,acc-gemini,${BIZ.GOOGLE}`,
    `RULE-SET,acc-copilot,${BIZ.AI}`,
    `RULE-SET,vpsdance-ai-coding,${BIZ.AI}`,
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
    `DOMAIN-SUFFIX,wise.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,transferwise.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,revolut.com,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,revolut.me,${BIZ.PAYMENTS}`,
    `DOMAIN-SUFFIX,braintree-api.com,${BIZ.PAYMENTS}`,
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
    // v5.1.1: Accademia 银行 × 10国 + 虚拟金融 × 3
    ...ACC_BANK_RULES,
    ...ACC_VF_RULES,
    `DOMAIN,login.live.com,${BIZ.MS}`,
    `DOMAIN,g.live.com,${BIZ.MS}`,
    `DOMAIN-SUFFIX,officeapps.live.com,${BIZ.MS}`,
    // v5.1.9 CLEAN#1: gmail.com/googlemail.com/mail.google.com/inbox.google.com 已提升至防吞盾（FIX#14），dead rules 已清除
    `DOMAIN-SUFFIX,outlook.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,outlook.live.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,hotmail.com,${BIZ.INTL_SITE}`,
    `DOMAIN,mail.live.com,${BIZ.INTL_SITE}`,
    `DOMAIN,outlook.office.com,${BIZ.INTL_SITE}`,
    `DOMAIN,mail.yahoo.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,ymail.com,${BIZ.INTL_SITE}`,
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
    `DOMAIN-SUFFIX,kakaotalk.com,${BIZ.IM}`,
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
    `DOMAIN-SUFFIX,quora.com,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,medium.com,${BIZ.SOCIAL}`,
    `DOMAIN-SUFFIX,flickr.com,${BIZ.SOCIAL}`,
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
    `DOMAIN-SUFFIX,figma.com,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,linear.app,${BIZ.WORK}`,
    `DOMAIN-SUFFIX,jira.com,${BIZ.WORK}`,
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

    // v5.1.2 FIX#2: 港澳台哔哩哔哩需港区代理解锁（v5.1.1 误归入 CNMEDIA/DIRECT 导致 412）
    // ============ 🎵 TikTok ============
    `RULE-SET,tiktok,${BIZ.TOK}`,

    // ============ 平台流媒体 ============
    // ── YouTube ──
    `RULE-SET,youtube,${BIZ.YT}`,
    // ── Netflix ──
    `RULE-SET,netflix,${BIZ.NFLX}`,
    `RULE-SET,netflix-ip,${BIZ.NFLX},no-resolve`,
    `RULE-SET,szkane-netflixip,${BIZ.NFLX},no-resolve`,
    // ── Disney+/HBO/Hulu/Prime Video ──
    `RULE-SET,disney,${BIZ.DSNP}`,
    `RULE-SET,hbo,${BIZ.HBO}`,
    `RULE-SET,hulu,${BIZ.HULU}`,
    `RULE-SET,primevideo,${BIZ.PRIME}`,
    `RULE-SET,amazon,${BIZ.PRIME}`,
    // ── 音乐流媒体 ──
    `RULE-SET,spotify,${BIZ.MUSIC}`,
    `RULE-SET,soundcloud,${BIZ.MUSIC}`,
    `RULE-SET,pandora,${BIZ.MUSIC}`,
    `RULE-SET,pandoratv,${BIZ.MUSIC}`,
    `RULE-SET,tidal,${BIZ.MUSIC}`,
    `RULE-SET,deezer,${BIZ.MUSIC}`,
    `RULE-SET,overcast,${BIZ.MUSIC}`,
    `RULE-SET,lastfm,${BIZ.MUSIC}`,
    `RULE-SET,qobuz,${BIZ.MUSIC}`,

    // ============ 🇭🇰 香港流媒体 ============
    // v5.4.27 CLEAN#165: mytvsuper.com/nowe.com/rthk.hk/cabletv.com.hk 已被同策略 RULE-SET 覆盖，移除直写
    `RULE-SET,szkane-bilihmt,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,mytv.com.hk,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,viu.com,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,viu.tv,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,hktv.com.hk,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,hktvmall.com,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,nowtv.com,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,icable.com,${BIZ.STREAM_HK}`,
    `DOMAIN-SUFFIX,hmvod.com.hk,${BIZ.STREAM_HK}`,
    `RULE-SET,mytvsuper,${BIZ.STREAM_HK}`,
    `RULE-SET,tvb,${BIZ.STREAM_HK}`,
    `RULE-SET,nowe,${BIZ.STREAM_HK}`,
    `RULE-SET,rthk,${BIZ.STREAM_HK}`,
    `RULE-SET,cabletv,${BIZ.STREAM_HK}`,
    `RULE-SET,moov,${BIZ.STREAM_HK}`,

    // ============ 🇹🇼 台湾流媒体 ============
    `RULE-SET,bahamut,${BIZ.STREAM_TW}`,
    `RULE-SET,kktv,${BIZ.STREAM_TW}`,
    // CLEAN#165: litv.tv/friday.tw/linetv.tw/hamivideo.hinet.net 已被同策略 RULE-SET 覆盖
    `DOMAIN-SUFFIX,elta.tv,${BIZ.STREAM_TW}`,
    `DOMAIN-SUFFIX,mod.cht.com.tw,${BIZ.STREAM_TW}`,
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

    // ============ 🇯🇵 日韩流媒体 ============
    // CLEAN#165: tver.jp/dmm.com/dmm.co.jp/nicovideo.jp/nicovideo.me/dmc.nico 已被同策略 RULE-SET 覆盖
    `RULE-SET,abema,${BIZ.STREAM_JP}`,
    `RULE-SET,dazn,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,unext.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,nhk.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,nhk.or.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,dtv.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,paravi.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,videomarket.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,fod.fujitv.co.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,gyao.yahoo.co.jp,${BIZ.STREAM_JP}`,
    `DOMAIN-SUFFIX,music.jp,${BIZ.STREAM_JP}`,
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

    // ══════════════════════════════════════════════════════════
    //  v5.4.8: 中后段业务规则按匹配优先级重排
    // ══════════════════════════════════════════════════════════

    // ============ 🇪🇺 欧洲流媒体 ============
    // CLEAN#165: itv.com/itvstatic.com/britbox.com 已被同策略 RULE-SET 覆盖
    `RULE-SET,bbc,${BIZ.STREAM_EU}`,
    `DOMAIN-SUFFIX,nowtv.co.uk,${BIZ.STREAM_EU}`,
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
    `RULE-SET,szkane-uk,${BIZ.STREAM_EU}`,

    // ============ 🌐 其他国外流媒体 ============
    // CLEAN#165: wetv.vip/wetvinfo.com/viki.com/viki.io/mewatch.sg/discoveryplus.com 已被同策略 RULE-SET 覆盖
    `RULE-SET,viu,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,iq.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,vidio.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,vidio.static6.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,rctiplus.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,visionplus.id,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,genflix.co.id,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,goplay.co.id,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,maxstream.tv,${BIZ.STREAM_OTHER}`,
    `RULE-SET,biliintl,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,iflix.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,catchplay.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,trueid.net,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,dimsum.my,${BIZ.STREAM_OTHER}`,
    `RULE-SET,asianmedia,${BIZ.STREAM_OTHER}`,
    `RULE-SET,iqiyiintl,${BIZ.STREAM_OTHER}`,
    `RULE-SET,joox,${BIZ.STREAM_OTHER}`,
    `RULE-SET,mewatch,${BIZ.STREAM_OTHER}`,
    `RULE-SET,viki,${BIZ.STREAM_OTHER}`,
    `RULE-SET,wetv,${BIZ.STREAM_OTHER}`,
    `RULE-SET,zee,${BIZ.STREAM_OTHER}`,
    `RULE-SET,acc-kwai,${BIZ.STREAM_OTHER}`,
    `RULE-SET,paramount,${BIZ.STREAM_OTHER}`,
    `RULE-SET,peacock,${BIZ.STREAM_OTHER}`,
    `RULE-SET,twitch,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,crunchyroll.com,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,vrv.co,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,pluto.tv,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,tubi.tv,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,fubo.tv,${BIZ.STREAM_OTHER}`,
    `DOMAIN-SUFFIX,appletv.com,${BIZ.STREAM_OTHER}`,
    `RULE-SET,cbs,${BIZ.STREAM_OTHER}`,
    `RULE-SET,nbc,${BIZ.STREAM_OTHER}`,
    `RULE-SET,pbs,${BIZ.STREAM_OTHER}`,
    `RULE-SET,attwatchtv,${BIZ.STREAM_OTHER}`,
    `RULE-SET,fox,${BIZ.STREAM_OTHER}`,
    `RULE-SET,fubotv,${BIZ.STREAM_OTHER}`,
    `RULE-SET,sling,${BIZ.STREAM_OTHER}`,
    `RULE-SET,vimeo,${BIZ.STREAM_OTHER}`,
    `RULE-SET,dailymotion,${BIZ.STREAM_OTHER}`,
    `RULE-SET,discoveryplus,${BIZ.STREAM_OTHER}`,
    `RULE-SET,americasvoice,${BIZ.STREAM_OTHER}`,
    `RULE-SET,cake,${BIZ.STREAM_OTHER}`,
    `RULE-SET,dood,${BIZ.STREAM_OTHER}`,
    `RULE-SET,emby,${BIZ.STREAM_OTHER}`,

    // ============ 🔧 工具与服务 ============
    `DOMAIN-SUFFIX,aws.amazon.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,elasticbeanstalk.com,${BIZ.TOOLS}`,
    `RULE-SET,bing,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,yahoo.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,yahoo.co.jp,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,duckduckgo.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,ddg.co,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,brave.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,ecosia.org,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,startpage.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,you.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,search.naver.com,${BIZ.TOOLS}`,
    `RULE-SET,scholar,${BIZ.GOOGLE}`,
    `RULE-SET,yandex,${BIZ.TOOLS}`,
    `RULE-SET,github,${BIZ.TOOLS}`,
    `RULE-SET,docker,${BIZ.TOOLS}`,
    `RULE-SET,gitlab,${BIZ.TOOLS}`,
    `GEOSITE,category-dev,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,npmjs.com,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,npmjs.org,${BIZ.TOOLS}`,
    `DOMAIN-SUFFIX,yarnpkg.com,${BIZ.TOOLS}`,
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
    `RULE-SET,szkane-developer,${BIZ.TOOLS}`,

    // ============ Ⓜ️ 微软服务 ============
    `RULE-SET,onedrive,${BIZ.MS}`,
    `RULE-SET,microsoft,${BIZ.MS}`,
    `RULE-SET,microsoftedge,${BIZ.MS}`,
    `RULE-SET,acc-microsoftapps,${BIZ.MS}`,

    // ============ 🍎 苹果服务 ============
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
    `RULE-SET,acc-applenews,${BIZ.APPLE}`,
    `RULE-SET,acc-apple,${BIZ.APPLE}`,

    // ============ 📥 下载更新 ============
    `RULE-SET,systemota,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,windowsupdate.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,update.microsoft.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,download.microsoft.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,delivery.mp.microsoft.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,officecdn.microsoft.com,${BIZ.DOWNLOAD}`,
    `DOMAIN-SUFFIX,officecdn.microsoft.com.edgesuite.net,${BIZ.DOWNLOAD}`,
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
    `RULE-SET,intel,${BIZ.DOWNLOAD}`,
    `RULE-SET,nvidia,${BIZ.DOWNLOAD}`,
    `RULE-SET,dell,${BIZ.DOWNLOAD}`,
    `RULE-SET,hp,${BIZ.DOWNLOAD}`,
    `RULE-SET,canon,${BIZ.DOWNLOAD}`,
    `RULE-SET,lg,${BIZ.DOWNLOAD}`,
    `RULE-SET,acc-macappupgrade,${BIZ.DOWNLOAD}`,

    // ============ 🛰️ BT/PT Tracker ============
    `GEOSITE,tracker,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,tracker.opentrackr.org,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,open.stealth.si,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,tracker.torrent.eu.org,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,exodus.desync.com,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,tracker.openbittorrent.com,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,tracker.publicbt.com,${BIZ.TRACKER}`,
    `DOMAIN-SUFFIX,tracker.dler.org,${BIZ.TRACKER}`,
    `RULE-SET,privatetracker,${BIZ.TRACKER}`,
    `RULE-SET,acc-emuleserver,${BIZ.TRACKER}`,

    // ============ 🚫 受限网站 ============
    `DOMAIN-SUFFIX,jsdelivr.net,${BIZ.GFW}`,
    `DOMAIN-SUFFIX,cloudflare-dns.com,${BIZ.GFW}`,
    `GEOSITE,gfw,${BIZ.GFW}`,
    `RULE-SET,loyalsoldier-gfw,${BIZ.GFW}`,
    `RULE-SET,loyalsoldier-greatfire,${BIZ.GFW}`,
    `RULE-SET,szkane-proxygfw,${BIZ.GFW}`,

    // ============ 🕹️ 国内游戏 ============
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
    `DOMAIN-SUFFIX,battlenet.com.cn,${BIZ.GAME_CN}`,
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

    // ============ 🎮 国外游戏 ============
    `RULE-SET,steam,${BIZ.GAME_INTL}`,
    `RULE-SET,epic,${BIZ.GAME_INTL}`,
    `RULE-SET,playstation,${BIZ.GAME_INTL}`,
    `RULE-SET,nintendo,${BIZ.GAME_INTL}`,
    `RULE-SET,xbox,${BIZ.GAME_INTL}`,
    `RULE-SET,ea,${BIZ.GAME_INTL}`,
    `RULE-SET,blizzard,${BIZ.GAME_INTL}`,
    `GEOSITE,category-games,${BIZ.GAME_INTL}`,
    // CLEAN#165: 下列直写域名已被同策略 RULE-SET 覆盖（ubi/riot/rockstar/gog/supercell/garena/hoyoverse）
    `RULE-SET,rockstar,${BIZ.GAME_INTL}`,
    `RULE-SET,riot,${BIZ.GAME_INTL}`,
    `RULE-SET,gog,${BIZ.GAME_INTL}`,
    `RULE-SET,supercell,${BIZ.GAME_INTL}`,
    `RULE-SET,garena,${BIZ.GAME_INTL}`,
    `RULE-SET,hoyoverse,${BIZ.GAME_INTL}`,
    `RULE-SET,ubi,${BIZ.GAME_INTL}`,
    `RULE-SET,sony,${BIZ.GAME_INTL}`,

    // ============ 🌐 国外网站 ============
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
    `RULE-SET,acc-homeip-us,${BIZ.INTL_SITE},no-resolve`,
    `RULE-SET,acc-homeip-jp,${BIZ.INTL_SITE},no-resolve`,
    `RULE-SET,acc-aqara-global,${BIZ.INTL_SITE}`,
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
    `RULE-SET,acc-waybackmachine,${BIZ.INTL_SITE}`,
    `RULE-SET,acc-pornhub,${BIZ.INTL_SITE}`,
    `RULE-SET,szkane-khan,${BIZ.INTL_SITE}`,
    `RULE-SET,szkane-edutools,${BIZ.INTL_SITE}`,
    `RULE-SET,naver,${BIZ.INTL_SITE}`,
    `RULE-SET,ehgallery,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,archive.org,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,udemy.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,udemycdn.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,grammarly.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,grammarly.io,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,jetbrains.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,theguardian.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,guardianapis.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,box.com,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,boxcdn.net,${BIZ.INTL_SITE}`,
    `DOMAIN-SUFFIX,noip.com,${BIZ.INTL_SITE}`,
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

    // ============ 📺 国内流媒体 ============
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
    `RULE-SET,acc-alipan,${BIZ.CNMEDIA}`,
    `RULE-SET,acc-baidunetdisk,${BIZ.CNMEDIA}`,
    `RULE-SET,acc-weiyun,${BIZ.CNMEDIA}`,
    // v5.1.1: Accademia FakeLocation × 8 平台（国内APP IP归属地伪装）
    ...ACC_FAKE_LOCATION_RULES,

    // ============ 🏠 国内网站 ============
    `DOMAIN-SUFFIX,163.com,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,126.com,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,126.net,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,jianguoyun.com,${BIZ.CN_SITE}`,
    // v5.4.19 #2 借鉴 Proxy-override：国内前端 CDN 直连前置（纯静态库托管，无 tracker 冲突）。
    `DOMAIN-SUFFIX,baomitu.com,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,bootcss.com,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,staticfile.org,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,upaiyun.com,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,zhimg.com,${BIZ.CN_SITE}`,
    `RULE-SET,cn,${BIZ.CN_SITE}`,
    `RULE-SET,cn-ip,${BIZ.CN_SITE},no-resolve`,
    `DOMAIN-SUFFIX,alimama.com,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,zxtdjy.com,${BIZ.CN_SITE}`,
    `DOMAIN-SUFFIX,zhihu.co,${BIZ.CN_SITE}`,
    `RULE-SET,acc-chinamax,${BIZ.CN_SITE}`,
    // v5.4.4 FIX#144: bbys.app 视频播放走直连
    `DOMAIN-SUFFIX,bbys.app,DIRECT`,
    `RULE-SET,acc-aqara-cn,${BIZ.CN_SITE}`,
    `RULE-SET,acc-geo-d-asia-china,${BIZ.CN_SITE}`,
    `RULE-SET,acc-geo-ip-asia-china,${BIZ.CN_SITE},no-resolve`,

    // ============ 🌐 国际网络与地域兜底 ============
    // v6.0.8 FIX#176: all shared edge/CDN, geolocation-!cn, IP and region
    // fallbacks stay after domestic authority so first-match routing is stable.
    ...GENERIC_INTL_EDGE_FALLBACK_RULES,
    ...GENERIC_INTL_NETWORK_FALLBACK_RULES,
    ...GEO_REGIONS_INTL_D_RULES,
    ...GEO_REGIONS_INTL_IP_RULES,

    // ============ GEOIP 标签路由 ============
    GENERIC_INTL_GEOIP_FALLBACK_RULE,
    `GEOIP,telegram,${BIZ.IM},no-resolve`,
    `GEOIP,netflix,${BIZ.NFLX},no-resolve`,
    `GEOIP,facebook,${BIZ.SOCIAL},no-resolve`,
    `GEOIP,twitter,${BIZ.SOCIAL},no-resolve`,
    `GEOIP,google,${BIZ.GOOGLE},no-resolve`,
    `GEOIP,CN,${BIZ.CN_SITE},no-resolve`,

    `MATCH,${BIZ.FINAL}`,
  ]
  config.rules = expandMihomoMrsSplitRules(config.rules)
  sourceGraphLog(`[${VERSION}] Injected ${config.rules.length} rules`)
}



function buildMihomoRoutingGraph(options) {
  const opts = options || {};
  const previousDisableMrs = SCKI_DISABLE_MIHOMO_MRS_OVERRIDES;
  SCKI_DISABLE_MIHOMO_MRS_OVERRIDES = opts.applyMihomoMrsOverrides === false;
  try {
    const config = { 'rule-providers': {}, rules: [] };
    injectRuleProviders(config);
    injectRules(config);
    return {
      authority: SOURCE_GRAPH_ID,
      version: SOURCE_GRAPH_VERSION,
      mihomoMrsNormalized: !SCKI_DISABLE_MIHOMO_MRS_OVERRIDES,
      'rule-providers': cloneJson(config['rule-providers'] || {}),
      rules: (config.rules || []).slice(),
    };
  } finally {
    SCKI_DISABLE_MIHOMO_MRS_OVERRIDES = previousDisableMrs;
  }
}

function getRawRoutingGraph() {
  return buildMihomoRoutingGraph({ applyMihomoMrsOverrides: false });
}

function getMihomoNormalizedRoutingGraph() {
  return buildMihomoRoutingGraph({ applyMihomoMrsOverrides: true });
}

module.exports = {
  SOURCE_GRAPH_ID,
  SOURCE_GRAPH_VERSION,
  BIZ,
  DOMESTIC_AUTHORITY_ANCHOR_RULE,
  GENERIC_INTL_FALLBACK_RULES,
  buildMihomoRoutingGraph,
  getRawRoutingGraph,
  getMihomoNormalizedRoutingGraph,
};
