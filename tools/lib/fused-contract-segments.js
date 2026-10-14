'use strict';
const fs = require('node:fs');
const path = require('node:path');
// Stable source-rule identities from existing contract roles. Generated numeric IDs
// are looked up in the current compiler manifest, never assumed to remain fixed.
const ANCHORS = {
  "scki-fused-014-ai": {
    "policy": "🤖 AI 服务",
    "source_rules": [
      "RULE-SET,openai,🤖 AI 服务",
      "RULE-SET,claude,🤖 AI 服务"
    ]
  },
  "scki-fused-024-ai": {
    "policy": "🤖 AI 服务",
    "source_rules": [
      "RULE-SET,szkane-ai-domain,🤖 AI 服务",
      "RULE-SET,szkane-ai-ipcidr,🤖 AI 服务",
      "RULE-SET,szkane-ai-classical,🤖 AI 服务",
      "RULE-SET,szkane-ciciai-domain,🤖 AI 服务",
      "RULE-SET,szkane-ciciai-ipcidr,🤖 AI 服务",
      "RULE-SET,szkane-ciciai-classical,🤖 AI 服务",
      "RULE-SET,acc-appleai,🤖 AI 服务",
      "RULE-SET,acc-grok,🤖 AI 服务"
    ]
  },
  "scki-fused-062-intl-site": {
    "policy": "🌐 国外网站",
    "source_rules": [
      "DOMAIN-SUFFIX,tokopedia.com,🌐 国外网站",
      "DOMAIN-SUFFIX,tokopedia.net,🌐 国外网站",
      "DOMAIN-SUFFIX,shopee.co.id,🌐 国外网站",
      "DOMAIN-SUFFIX,bukalapak.com,🌐 国外网站",
      "DOMAIN-SUFFIX,blibli.com,🌐 国外网站",
      "DOMAIN-SUFFIX,lazada.co.id,🌐 国外网站",
      "DOMAIN-SUFFIX,grab.com,🌐 国外网站",
      "DOMAIN-SUFFIX,gojek.com,🌐 国外网站",
      "DOMAIN-SUFFIX,gojek.co.id,🌐 国外网站",
      "DOMAIN-SUFFIX,traveloka.com,🌐 国外网站",
      "DOMAIN-SUFFIX,tiket.com,🌐 国外网站",
      "DOMAIN-SUFFIX,telkomsel.com,🌐 国外网站",
      "DOMAIN-SUFFIX,telkom.co.id,🌐 国外网站",
      "DOMAIN-SUFFIX,indosatooredoo.com,🌐 国外网站",
      "DOMAIN-SUFFIX,im3.co.id,🌐 国外网站",
      "DOMAIN-SUFFIX,xl.co.id,🌐 国外网站",
      "DOMAIN-SUFFIX,smartfren.com,🌐 国外网站",
      "DOMAIN-SUFFIX,tri.co.id,🌐 国外网站",
      "DOMAIN-SUFFIX,by.u.id,🌐 国外网站",
      "DOMAIN-SUFFIX,myrepublic.co.id,🌐 国外网站",
      "DOMAIN-SUFFIX,firstmedia.com,🌐 国外网站",
      "DOMAIN-SUFFIX,biznet.id,🌐 国外网站",
      "DOMAIN-SUFFIX,go.id,🌐 国外网站",
      "DOMAIN-SUFFIX,or.id,🌐 国外网站",
      "DOMAIN-SUFFIX,kompas.com,🌐 国外网站",
      "DOMAIN-SUFFIX,detik.com,🌐 国外网站",
      "DOMAIN-SUFFIX,tempo.co,🌐 国外网站",
      "DOMAIN-SUFFIX,cnnindonesia.com,🌐 国外网站",
      "DOMAIN-SUFFIX,cnbcindonesia.com,🌐 国外网站",
      "DOMAIN-SUFFIX,liputan6.com,🌐 国外网站",
      "DOMAIN-SUFFIX,tribunnews.com,🌐 国外网站",
      "DOMAIN-SUFFIX,kumparan.com,🌐 国外网站",
      "DOMAIN-SUFFIX,idntimes.com,🌐 国外网站",
      "DOMAIN-SUFFIX,gofood.co.id,🌐 国外网站",
      "DOMAIN-SUFFIX,grabfood.com,🌐 国外网站",
      "DOMAIN-SUFFIX,66tutup.com,🌐 国外网站",
      "RULE-SET,acc-homeip-us-domain,🌐 国外网站",
      "RULE-SET,acc-homeip-us-classical,🌐 国外网站",
      "RULE-SET,acc-homeip-jp,🌐 国外网站,no-resolve",
      "RULE-SET,acc-aqara-global-domain,🌐 国外网站",
      "RULE-SET,acc-aqara-global-ipcidr,🌐 国外网站",
      "RULE-SET,acc-aqara-global-classical,🌐 国外网站",
      "RULE-SET,cnn,🌐 国外网站",
      "RULE-SET,nytimes,🌐 国外网站",
      "RULE-SET,bloomberg,🌐 国外网站",
      "RULE-SET,ebay,🌐 国外网站",
      "RULE-SET,nike,🌐 国外网站",
      "RULE-SET,adobe-domain,🌐 国外网站",
      "RULE-SET,adobe-classical,🌐 国外网站",
      "RULE-SET,samsung,🌐 国外网站",
      "RULE-SET,tesla,🌐 国外网站",
      "RULE-SET,dropbox,🌐 国外网站",
      "RULE-SET,mega-domain,🌐 国外网站",
      "RULE-SET,mega-ipcidr,🌐 国外网站",
      "RULE-SET,mega-classical,🌐 国外网站",
      "RULE-SET,wikipedia,🌐 国外网站",
      "RULE-SET,duolingo,🌐 国外网站",
      "RULE-SET,acc-waybackmachine-domain,🌐 国外网站",
      "RULE-SET,acc-waybackmachine-ipcidr,🌐 国外网站",
      "RULE-SET,acc-pornhub-domain,🌐 国外网站",
      "RULE-SET,acc-pornhub-classical,🌐 国外网站",
      "RULE-SET,szkane-khan-domain,🌐 国外网站",
      "RULE-SET,szkane-khan-classical,🌐 国外网站",
      "RULE-SET,szkane-edutools-domain,🌐 国外网站",
      "RULE-SET,szkane-edutools-classical,🌐 国外网站",
      "RULE-SET,naver-domain,🌐 国外网站",
      "RULE-SET,naver-ipcidr,🌐 国外网站",
      "RULE-SET,naver-classical,🌐 国外网站",
      "RULE-SET,ehgallery-domain,🌐 国外网站",
      "RULE-SET,ehgallery-ipcidr,🌐 国外网站",
      "DOMAIN-SUFFIX,archive.org,🌐 国外网站",
      "DOMAIN-SUFFIX,udemy.com,🌐 国外网站",
      "DOMAIN-SUFFIX,udemycdn.com,🌐 国外网站",
      "DOMAIN-SUFFIX,grammarly.com,🌐 国外网站",
      "DOMAIN-SUFFIX,grammarly.io,🌐 国外网站",
      "DOMAIN-SUFFIX,jetbrains.net,🌐 国外网站",
      "DOMAIN-SUFFIX,theguardian.com,🌐 国外网站",
      "DOMAIN-SUFFIX,guardianapis.com,🌐 国外网站",
      "DOMAIN-SUFFIX,box.com,🌐 国外网站",
      "DOMAIN-SUFFIX,boxcdn.net,🌐 国外网站",
      "DOMAIN-SUFFIX,noip.com,🌐 国外网站"
    ]
  },
  "scki-fused-073-cn-site": {
    "policy": "🏠 国内网站",
    "source_rules": [
      "GEOIP,CN,🏠 国内网站,no-resolve"
    ]
  },
  "scki-fused-006-ad": {
    "policy": "🛑 广告拦截",
    "source_rules": [
      "RULE-SET,anti-ad,🛑 广告拦截",
      "RULE-SET,sukka-phishing,🛑 广告拦截",
      "RULE-SET,hagezi-tif,🛑 广告拦截",
      "RULE-SET,acc-hijackingplus-domain,🛑 广告拦截",
      "RULE-SET,acc-hijackingplus-ipcidr,🛑 广告拦截",
      "RULE-SET,acc-hijackingplus-classical,🛑 广告拦截",
      "RULE-SET,acc-blockhttpdnsplus,🛑 广告拦截",
      "RULE-SET,acc-prerepaireasyprivacy-domain,🛑 广告拦截",
      "RULE-SET,acc-prerepaireasyprivacy-classical,🛑 广告拦截",
      "RULE-SET,acc-unsupportvpn,🛑 广告拦截",
      "GEOSITE,category-ads-all,🛑 广告拦截",
      "RULE-SET,advertising-ipcidr,🛑 广告拦截",
      "RULE-SET,advertising-classical,🛑 广告拦截",
      "RULE-SET,advertisingmitv,🛑 广告拦截",
      "RULE-SET,adobeactivation-domain,🛑 广告拦截",
      "RULE-SET,adobeactivation-ipcidr,🛑 广告拦截",
      "RULE-SET,blockhttpdns-domain,🛑 广告拦截",
      "RULE-SET,blockhttpdns-ipcidr,🛑 广告拦截",
      "RULE-SET,domob,🛑 广告拦截",
      "RULE-SET,hijacking-domain,🛑 广告拦截",
      "RULE-SET,hijacking-ipcidr,🛑 广告拦截",
      "RULE-SET,jiguangtuisong,🛑 广告拦截",
      "RULE-SET,miuiprivacy,🛑 广告拦截",
      "RULE-SET,privacy-ipcidr,🛑 广告拦截",
      "RULE-SET,privacy-classical,🛑 广告拦截",
      "RULE-SET,youmengchuangxiang,🛑 广告拦截"
    ]
  },
  "scki-fused-008-direct": {
    "policy": "DIRECT",
    "source_rules": [
      "GEOSITE,private,DIRECT",
      "GEOIP,private,DIRECT,no-resolve",
      "RULE-SET,scki-local-direct-domain,DIRECT",
      "RULE-SET,scki-local-direct-ipcidr,DIRECT",
      "RULE-SET,scki-local-process-direct,DIRECT"
    ]
  },
  "scki-fused-009-work": {
    "policy": "🧑‍💼 会议协作",
    "source_rules": [
      "RULE-SET,scki-work-process,🧑‍💼 会议协作"
    ]
  },
  "scki-fused-022-google": {
    "policy": "🔍 Google 服务",
    "source_rules": [
      "RULE-SET,google,🔍 Google 服务",
      "RULE-SET,google-ip,🔍 Google 服务,no-resolve"
    ]
  },
  "scki-fused-036-work": {
    "policy": "🧑‍💼 会议协作",
    "source_rules": [
      "RULE-SET,zoom,🧑‍💼 会议协作",
      "RULE-SET,slack,🧑‍💼 会议协作",
      "RULE-SET,teams,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,webex.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,wbx2.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,ciscospark.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,figma.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,linear.app,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,jira.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,asana.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,monday.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,clickup.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,basecamp.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,airtable.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,miro.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,canva.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,coda.io,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,loom.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,larksuite.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,larkoffice.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,gotomeeting.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,logmein.com,🧑‍💼 会议协作",
      "DOMAIN-SUFFIX,goto.com,🧑‍💼 会议协作",
      "RULE-SET,atlassian,🧑‍💼 会议协作",
      "RULE-SET,notion,🧑‍💼 会议协作",
      "RULE-SET,teamviewer-domain,🧑‍💼 会议协作",
      "RULE-SET,teamviewer-ipcidr,🧑‍💼 会议协作",
      "RULE-SET,zoho,🧑‍💼 会议协作",
      "RULE-SET,salesforce,🧑‍💼 会议协作",
      "RULE-SET,zendesk,🧑‍💼 会议协作",
      "RULE-SET,intercom,🧑‍💼 会议协作",
      "RULE-SET,remotedesktop,🧑‍💼 会议协作",
      "RULE-SET,acc-rustdesk,🧑‍💼 会议协作",
      "RULE-SET,acc-parsec,🧑‍💼 会议协作"
    ]
  },
  "scki-fused-039-tiktok": {
    "policy": "🎵 TikTok",
    "source_rules": [
      "RULE-SET,tiktok,🎵 TikTok"
    ]
  },
  "scki-fused-059-gfw": {
    "policy": "🚫 受限网站",
    "source_rules": [
      "DOMAIN-SUFFIX,jsdelivr.net,🚫 受限网站",
      "DOMAIN-SUFFIX,cloudflare-dns.com,🚫 受限网站",
      "GEOSITE,gfw,🚫 受限网站",
      "RULE-SET,loyalsoldier-gfw,🚫 受限网站",
      "RULE-SET,loyalsoldier-greatfire,🚫 受限网站",
      "RULE-SET,szkane-proxygfw-domain,🚫 受限网站",
      "RULE-SET,szkane-proxygfw-ipcidr,🚫 受限网站",
      "RULE-SET,szkane-proxygfw-classical,🚫 受限网站"
    ]
  },
  "scki-fused-060-game-cn": {
    "policy": "🕹️ 国内游戏",
    "source_rules": [
      "DOMAIN-SUFFIX,mihoyo.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,miyoushe.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,yuanshen.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,bhsr.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,zenlesszonezero.com,🕹️ 国内游戏",
      "DOMAIN,game.163.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,gm.163.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,ds.163.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,nie.163.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,nie.netease.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,update.netease.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,netease.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,wegame.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,wegame.com.cn,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,perfect-world.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,wanmei.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,battlenet.com.cn,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,xd.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,taptap.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,taptap.io,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,papegames.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,hypergryph.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,gryphline.com,🕹️ 国内游戏",
      "DOMAIN-SUFFIX,lilith.com,🕹️ 国内游戏",
      "RULE-SET,steamcn,🕹️ 国内游戏",
      "RULE-SET,wanmeishijie,🕹️ 国内游戏",
      "RULE-SET,wankahuanju,🕹️ 国内游戏",
      "RULE-SET,majsoul,🕹️ 国内游戏"
    ]
  },
  "scki-fused-061-game-intl": {
    "policy": "🎮 国外游戏",
    "source_rules": [
      "RULE-SET,steam-domain,🎮 国外游戏",
      "RULE-SET,steam-classical,🎮 国外游戏",
      "RULE-SET,epic,🎮 国外游戏",
      "RULE-SET,playstation,🎮 国外游戏",
      "RULE-SET,nintendo-domain,🎮 国外游戏",
      "RULE-SET,nintendo-ipcidr,🎮 国外游戏",
      "RULE-SET,xbox,🎮 国外游戏",
      "RULE-SET,ea,🎮 国外游戏",
      "RULE-SET,blizzard-domain,🎮 国外游戏",
      "RULE-SET,blizzard-ipcidr,🎮 国外游戏",
      "GEOSITE,category-games,🎮 国外游戏",
      "RULE-SET,rockstar,🎮 国外游戏",
      "RULE-SET,riot,🎮 国外游戏",
      "RULE-SET,gog,🎮 国外游戏",
      "RULE-SET,supercell-domain,🎮 国外游戏",
      "RULE-SET,supercell-ipcidr,🎮 国外游戏",
      "RULE-SET,garena,🎮 国外游戏",
      "RULE-SET,hoyoverse,🎮 国外游戏",
      "RULE-SET,ubi,🎮 国外游戏",
      "RULE-SET,sony,🎮 国外游戏"
    ]
  },
  "scki-fused-002-intl-site": {
    "policy": "🌐 国外网站",
    "source_rules": [
      "RULE-SET,scki-adfp-intl-site,🌐 国外网站"
    ]
  },
  "scki-fused-005-cnmedia": {
    "policy": "📺 国内流媒体",
    "source_rules": [
      "RULE-SET,scki-cnmedia-guard,📺 国内流媒体"
    ]
  },
  "scki-fused-007-cn-site": {
    "policy": "🏠 国内网站",
    "source_rules": [
      "RULE-SET,amap,🏠 国内网站"
    ]
  },
  "scki-fused-053-google": {
    "policy": "🔍 Google 服务",
    "source_rules": [
      "RULE-SET,scholar,🔍 Google 服务"
    ]
  },
  "scki-fused-019-im": {
    "policy": "💬 即时通讯",
    "source_rules": [
      "RULE-SET,googlevoice,💬 即时通讯"
    ]
  },
  "scki-fused-032-im": {
    "policy": "💬 即时通讯",
    "source_rules": [
      "RULE-SET,telegram,💬 即时通讯",
      "RULE-SET,telegram-ip,💬 即时通讯,no-resolve",
      "RULE-SET,discord,💬 即时通讯",
      "RULE-SET,whatsapp-domain,💬 即时通讯",
      "RULE-SET,whatsapp-ipcidr,💬 即时通讯",
      "RULE-SET,whatsapp-classical,💬 即时通讯",
      "RULE-SET,line-domain,💬 即时通讯",
      "RULE-SET,line-ipcidr,💬 即时通讯",
      "RULE-SET,kakaotalk-domain,💬 即时通讯",
      "RULE-SET,kakaotalk-ipcidr,💬 即时通讯",
      "DOMAIN-SUFFIX,kakaotalk.com,💬 即时通讯",
      "DOMAIN-SUFFIX,skype.com,💬 即时通讯",
      "DOMAIN-SUFFIX,skypeecs.net,💬 即时通讯",
      "DOMAIN-SUFFIX,skypeforbusiness.com,💬 即时通讯",
      "DOMAIN-SUFFIX,sfbassets.com,💬 即时通讯",
      "DOMAIN-SUFFIX,lync.com,💬 即时通讯",
      "DOMAIN-SUFFIX,signal.org,💬 即时通讯",
      "DOMAIN-SUFFIX,whispersystems.org,💬 即时通讯",
      "DOMAIN-SUFFIX,signal.art,💬 即时通讯",
      "DOMAIN-SUFFIX,viber.com,💬 即时通讯",
      "DOMAIN-SUFFIX,viber.io,💬 即时通讯",
      "DOMAIN-SUFFIX,element.io,💬 即时通讯",
      "DOMAIN-SUFFIX,matrix.org,💬 即时通讯",
      "DOMAIN-SUFFIX,zalo.me,💬 即时通讯",
      "DOMAIN-SUFFIX,zalopay.vn,💬 即时通讯",
      "DOMAIN-SUFFIX,wire.com,💬 即时通讯",
      "DOMAIN-SUFFIX,threema.ch,💬 即时通讯",
      "RULE-SET,telegramnl,💬 即时通讯,no-resolve",
      "RULE-SET,telegramsg,💬 即时通讯,no-resolve",
      "RULE-SET,telegramus,💬 即时通讯,no-resolve",
      "RULE-SET,zalo,💬 即时通讯",
      "RULE-SET,italkbb-domain,💬 即时通讯",
      "RULE-SET,italkbb-classical,💬 即时通讯",
      "RULE-SET,acc-signal,💬 即时通讯",
      "DOMAIN-SUFFIX,icq.com,💬 即时通讯"
    ]
  },
  "scki-fused-013-cn-site": {
    "policy": "🏠 国内网站",
    "source_rules": [
      "RULE-SET,scki-cnsite-guard,🏠 国内网站"
    ]
  },
  "scki-fused-068-intl-site": {
    "policy": "🌐 国外网站",
    "source_rules": [
      "DOMAIN-SUFFIX,amazonaws.com,🌐 国外网站",
      "DOMAIN-SUFFIX,awsstatic.com,🌐 国外网站",
      "DOMAIN-SUFFIX,akamai.net,🌐 国外网站",
      "DOMAIN-SUFFIX,akamaized.net,🌐 国外网站",
      "DOMAIN-SUFFIX,akamaihd.net,🌐 国外网站",
      "DOMAIN-SUFFIX,akamaiedge.net,🌐 国外网站",
      "DOMAIN-SUFFIX,akamaitechnologies.com,🌐 国外网站",
      "DOMAIN-SUFFIX,edgekey.net,🌐 国外网站",
      "DOMAIN-SUFFIX,edgesuite.net,🌐 国外网站",
      "DOMAIN-SUFFIX,cloudfront.net,🌐 国外网站",
      "DOMAIN-SUFFIX,fastly.net,🌐 国外网站",
      "DOMAIN-SUFFIX,fastlylb.net,🌐 国外网站",
      "DOMAIN-SUFFIX,kxcdn.com,🌐 国外网站",
      "DOMAIN-SUFFIX,stackpathdns.com,🌐 国外网站",
      "DOMAIN-SUFFIX,stackpathcdn.com,🌐 国外网站",
      "DOMAIN-SUFFIX,b-cdn.net,🌐 国外网站",
      "DOMAIN-SUFFIX,bunny.net,🌐 国外网站",
      "DOMAIN-SUFFIX,bunnycdn.com,🌐 国外网站",
      "DOMAIN-SUFFIX,cdn77.org,🌐 国外网站",
      "DOMAIN-SUFFIX,azureedge.net,🌐 国外网站",
      "DOMAIN-SUFFIX,azurefd.net,🌐 国外网站",
      "DOMAIN-SUFFIX,msecnd.net,🌐 国外网站",
      "DOMAIN-SUFFIX,unpkg.com,🌐 国外网站",
      "DOMAIN-SUFFIX,r2.dev,🌐 国外网站",
      "DOMAIN-SUFFIX,ziffstatic.com,🌐 国外网站",
      "DOMAIN-SUFFIX,ucoz.ru,🌐 国外网站",
      "DOMAIN-SUFFIX,ucoz.net,🌐 国外网站",
      "RULE-SET,akamai,🌐 国外网站",
      "RULE-SET,digicert,🌐 国外网站",
      "RULE-SET,globalsign,🌐 国外网站",
      "RULE-SET,sectigo,🌐 国外网站",
      "RULE-SET,brightcove,🌐 国外网站",
      "RULE-SET,jwplayer,🌐 国外网站",
      "DOMAIN-SUFFIX,letsencrypt.org,🌐 国外网站",
      "DOMAIN-SUFFIX,lencr.org,🌐 国外网站",
      "RULE-SET,proxy,🌐 国外网站",
      "RULE-SET,cloudflare-ip,🌐 国外网站,no-resolve",
      "RULE-SET,cloudfront-ip,🌐 国外网站,no-resolve",
      "RULE-SET,fastly-ip,🌐 国外网站,no-resolve",
      "RULE-SET,cloudflare-domain,🌐 国外网站",
      "RULE-SET,cloudflare-ipcidr,🌐 国外网站",
      "RULE-SET,acc-fastly,🌐 国外网站",
      "GEOIP,ID,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-d-asia-east,🌐 国外网站",
      "RULE-SET,acc-geo-d-asia-eastsouth,🌐 国外网站",
      "RULE-SET,acc-geo-d-asia-south,🌐 国外网站",
      "RULE-SET,acc-geo-d-asia-central,🌐 国外网站",
      "RULE-SET,acc-geo-d-asia-west,🌐 国外网站",
      "RULE-SET,acc-geo-d-america-north,🌐 国外网站",
      "RULE-SET,acc-geo-d-america-south,🌐 国外网站",
      "RULE-SET,acc-geo-d-europe-west,🌐 国外网站",
      "RULE-SET,acc-geo-d-europe-east,🌐 国外网站",
      "RULE-SET,acc-geo-d-oceania,🌐 国外网站",
      "RULE-SET,acc-geo-d-antarctica,🌐 国外网站",
      "RULE-SET,acc-geo-d-africa-north,🌐 国外网站",
      "RULE-SET,acc-geo-d-africa-south,🌐 国外网站",
      "RULE-SET,acc-geo-d-africa-west,🌐 国外网站",
      "RULE-SET,acc-geo-d-africa-east,🌐 国外网站",
      "RULE-SET,acc-geo-d-africa-central,🌐 国外网站",
      "RULE-SET,acc-geo-ip-asia-east,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-asia-eastsouth,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-asia-south,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-asia-central,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-asia-west,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-america-north,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-america-south,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-europe-west,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-europe-east,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-oceania,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-antarctica,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-africa-north,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-africa-south,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-africa-west,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-africa-east,🌐 国外网站,no-resolve",
      "RULE-SET,acc-geo-ip-africa-central,🌐 国外网站,no-resolve",
      "GEOIP,cloudflare,🌐 国外网站,no-resolve"
    ]
  },
  "scki-fused-001-direct": {
    "policy": "DIRECT",
    "source_rules": [
      "RULE-SET,scki-adfp-direct,DIRECT"
    ]
  }
};
function resolveContractSegments(root = path.resolve(__dirname, '../..')) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'rulesets/generated/fused/manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.source_segments)) throw new Error('Compiler source segment catalog missing');
  const result = {};
  for (const [role, anchor] of Object.entries(ANCHORS)) {
    const ranked = manifest.source_segments.filter(row => row.policy === anchor.policy).map(row => ({ row, overlap: row.source_rules.filter(rule => anchor.source_rules.includes(rule)).length })).filter(item => item.overlap).sort((a, b) => b.overlap - a.overlap);
    if (!ranked.length || (ranked[1] && ranked[1].overlap === ranked[0].overlap)) throw new Error('Ambiguous source segment contract role: ' + role);
    result[role] = ranked[0].row.id;
  }
  return result;
}
module.exports = { resolveContractSegments };
