#!/bin/bash
. /usr/share/openclash/log.sh

# ============================================================================
# Clash Smart v5.3.5-oc-slim — OpenClash 覆写脚本（R4S 4GB 内存优化版）
# ============================================================================
# 定位：Slim（轻量版），面向 1–4GB 路由器 / 低 OOM 风险。
#       136 rule-providers（由 387 精简），9 Smart 组 + 28 业务组保持不变。
# 架构：fake-ip + 嗅探（HTTP/TLS/QUIC）+ DNS 多层 + nameserver-policy 救援 +
#       TLS 指纹注入 + 动态节点分类（HK/TW/JP/KR/SG/US/EU/AM/AF/APAC_OTHER）
# 基线：跟随 Clash Party v5.2.4 主线。
# 变更历史：见 `OpenClash/CHANGELOG.md`（Slim 部分）。
# ============================================================================

VERSION_TAG="v5.3.5-dedup-acc-china"
CONFIG_FILE="$1"
LOG_FILE="/tmp/openclash.log"

LOG_OUT "Info" "[Clash-Smart] $VERSION_TAG overwrite starting..."
LOG_OUT "Info" "[Clash-Smart] Processing: $CONFIG_FILE"
LOG_OUT "Info" "[Clash-Smart] Memory-optimized build for NanoPi R4S 4GB"

# ============================================================================
# OVERRIDE YAML
# ============================================================================
OVERRIDE_YAML="/tmp/clash_smart_override.yaml"
cat > "$OVERRIDE_YAML" << 'OVERRIDE_EOF'
hosts:
  one.one.one.one:
  - 1.1.1.1
  - 1.0.0.1
  cloudflare-dns.com:
  - 1.1.1.1
  - 1.0.0.1
  dns.google:
  - 8.8.8.8
  - 8.8.4.4
  dns.quad9.net: 9.9.9.9
dns:
  enable: true
  listen: 0.0.0.0:7874
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
  - +.lan
  - +.local
  - time.*.com
  - ntp.*.com
  - +.market.xiaomi.com
  - +.localdomain
  - +.home.arpa
  - +.stun.*.*
  - +.stun.*.*.*
  - +.ntp.org
  - +.pool.ntp.org
  - +.binance.com
  - +.binancefuture.com
  - +.binance.vision
  - +.n.n.srv.nintendo.net
  - +.stun.playstation.net
  - +.xboxlive.com
  - stun.l.google.com
  cache-algorithm: arc
  # 对齐 Clash Party 基线（使用方法.md 第 99-132 行）
  use-hosts: false
  use-system-hosts: false
  respect-rules: true
  prefer-h3: false
  default-nameserver:
  - 223.5.5.5
  - 119.29.29.29
  - 1.1.1.1
  - 8.8.8.8
  nameserver-policy:
    '+.jsdelivr.net':
    - https://1.1.1.1/dns-query
    - https://8.8.8.8/dns-query
    '+.github.com':
    - https://1.1.1.1/dns-query
    - https://8.8.8.8/dns-query
    '+.githubusercontent.com':
    - https://1.1.1.1/dns-query
    - https://8.8.8.8/dns-query
    '+.githubassets.com':
    - https://1.1.1.1/dns-query
    - https://8.8.8.8/dns-query
    '+.fastly.net':
    - https://1.1.1.1/dns-query
    - https://8.8.8.8/dns-query
  nameserver:
  - https://223.5.5.5/dns-query
  - https://doh.pub/dns-query
  proxy-server-nameserver:
  - https://1.1.1.1/dns-query
  - https://8.8.8.8/dns-query
  - https://223.5.5.5/dns-query
  - https://doh.pub/dns-query
  direct-nameserver:
  - https://223.5.5.5/dns-query
  - https://doh.pub/dns-query
  fallback:
  - https://1.1.1.1/dns-query
  - https://8.8.8.8/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
    - 240.0.0.0/4
    - 0.0.0.0/32
    - 127.0.0.0/8
    - 10.0.0.0/8
    - 192.168.0.0/16
    domain: []
find-process-mode: 'off'
sniffer:
  enable: true
  parse-pure-ip: true
  force-dns-mapping: true
  override-destination: true
  sniff:
    HTTP:
      ports:
      - '80'
      - 8080-8880
      override-destination: true
    TLS:
      ports:
      - '443'
      - '8443'
    QUIC:
      ports:
      - '443'
      - '8443'
      - '4433'
  skip-domain:
  - +.push.apple.com
  - +.binance.com
  - Mijia Cloud
  - +.binancefuture.com
  - +.binance.vision
  skip-dst-address:
  - 91.105.192.0/23
  - 91.108.4.0/22
  - 91.108.8.0/21
  - 91.108.16.0/21
  - 91.108.56.0/22
  - 95.161.64.0/20
  - 149.154.160.0/20
  - 185.76.151.0/24
  - 2001:67c:4e8::/48
  - 2001:b28:f23c::/47
  - 2001:b28:f23f::/48
  - 2a0a:f280:203::/48
  force-domain: []
  skip-src-address: []
unified-delay: true
tcp-concurrent: true
keep-alive-idle: 30
keep-alive-interval: 15
geodata-mode: true
# ★★ 优化 #1 ★★ standard → memconservative，节省 400-600MB
# memconservative 用 mmap 按需读 geosite/geoip 文件，代替 standard
# 一次性解压全部数据到内存构建 trie 的旧做法
geodata-loader: memconservative
geo-auto-update: true
geox-url:
  geoip: https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/geoip.dat
  mmdb: https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb
  asn: https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb
  geosite: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat
profile:
  store-selected: true
  store-fake-ip: true
proxy-groups:
- name: 🤖 AI 服务
  type: select
  proxies: &id001
  - 🌍 全球节点
  - 🇭🇰 香港节点
  - 🇹🇼 台湾节点
  - 🇯🇵 日韩节点
  - 🌏 亚太节点
  - 🇺🇸 美国节点
  - 🇪🇺 欧洲节点
  - 🌎 美洲节点
  - 🌍 非洲节点
  - DIRECT
- name: 💰 加密货币
  type: select
  proxies: *id001
- name: 🏦 金融支付
  type: select
  proxies: *id001
- name: 📧 邮件服务
  type: select
  proxies: *id001
- name: 💬 即时通讯
  type: select
  proxies: *id001
- name: 📱 社交媒体
  type: select
  proxies: *id001
- name: 🧑‍💼 会议协作
  type: select
  proxies: *id001
- name: 📺 国内流媒体
  type: select
  proxies: &id002
  - DIRECT
  - 🌍 全球节点
  - 🇭🇰 香港节点
  - 🇹🇼 台湾节点
  - 🇯🇵 日韩节点
  - 🌏 亚太节点
  - 🇺🇸 美国节点
  - 🇪🇺 欧洲节点
  - 🌎 美洲节点
  - 🌍 非洲节点
- name: 📺 东南亚流媒体
  type: select
  proxies:
  - 🌏 亚太节点
  - 🌍 全球节点
  - 🇭🇰 香港节点
  - 🇯🇵 日韩节点
  - 🇺🇸 美国节点
  - DIRECT
- name: 🇺🇸 美国流媒体
  type: select
  proxies: *id001
- name: 🇭🇰 香港流媒体
  type: select
  proxies: *id001
- name: 🇹🇼 台湾流媒体
  type: select
  proxies: *id001
- name: 🇯🇵 日韩流媒体
  type: select
  proxies: *id001
- name: 🇪🇺 欧洲流媒体
  type: select
  proxies: *id001
- name: 🕹️ 国内游戏
  type: select
  proxies: *id002
- name: 🎮 国外游戏
  type: select
  proxies: *id001
- name: 🔍 搜索引擎
  type: select
  proxies: *id001
- name: 📟 开发者服务
  type: select
  proxies: *id001
- name: Ⓜ️ 微软服务
  type: select
  proxies: *id001
- name: 🍎 苹果服务
  type: select
  proxies: *id002
- name: 📥 下载更新
  type: select
  proxies: *id002
- name: ☁️ 云与CDN
  type: select
  proxies: *id001
- name: 🛰️ BT/PT Tracker
  type: select
  proxies:
  - REJECT
  - DIRECT
  - 🌍 全球节点
  - 🇭🇰 香港节点
  - 🌏 亚太节点
- name: 🏠 国内网站
  type: select
  proxies: *id002
- name: 🚫 受限网站
  type: select
  proxies: *id001
- name: 🌐 国外网站
  type: select
  proxies: *id001
- name: 🐟 漏网之鱼
  type: select
  proxies: *id001
- name: 🛑 广告拦截
  type: select
  proxies:
  - REJECT
  - DIRECT
OVERRIDE_EOF

# 继续写 rule-providers (由后续脚本片段追加)

# ============================================================================
# OVERRIDE YAML (续) — Rule-Providers：387 → 136
# 精简策略：
#   ✂ 合并 Google 家族（GoogleSearch/Drive/Earth/FCM/Voice 等 5 项 → google 单项）
#   ✂ 合并 Apple 细分（AppleTV/News/Dev/Proxy/Siri/TestFlight/Firmware/FindMy 8 项 → apple + icloud）
#   ✂ 删 Telegram 区域分片（NL/SG/US 3 项，telegram 已全球覆盖）
#   ✂ 删冷门通讯（KakaoTalk/Zalo/GoogleVoice/iTalkBB 4 项，用户在印尼/中国不用）
#   ✂ 删大陆长尾流媒体（Youku/Sohu/AcFun/Douyu/HuYa/CCTV/HunanTV/PPTV/LeTV 等 30+ 项）
#   ✂ 删欧洲/日韩细分流媒体（20+ 项）
#   ✂ 删非核心 GeoRouting（仅保留 Asia_East/EastSouth/China 6 项，删 20 项）
#   ✂ 删冗余广告拦截（10+ 项 blackmatrix7 广告集功能重叠）
#   ✂ 删区域银行（UK/JP/AU/CA/DE/NL/FR 7 项，用户在印尼/中国）
#   ✂ 删 FakeLocation 伪装定位（10 项，非核心需求）
# 保留策略：
#   ✓ 用户核心业务（加密货币 3 项全保）
#   ✓ AI 服务（9 项，包含 szkane + acc 补充）
#   ✓ 中国+印尼双环境所需（国内流媒体头部 8 项 + cn + chinamax + china）
#   ✓ 核心平台（苹果/微软/Google/CloudFlare/GitHub）
# ============================================================================
cat >> "$OVERRIDE_YAML" << 'OVERRIDE_EOF'
rule-providers:
  # ---------- 广告拦截 / 安全 (7) ----------
  anti-ad:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@mihomo-ruleset/ads.mrs
    path: ./ruleset/anti-ad.mrs
    interval: 85527
    proxy: 🚫 受限网站
  sukka-phishing:
    type: http
    behavior: domain
    format: text
    url: https://ruleset.skk.moe/Clash/domainset/reject_phishing.txt
    path: ./ruleset/sukka-reject-phishing.txt
    interval: 89805
    proxy: 🚫 受限网站
  hagezi-tif:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MiHomoer/MiHomo-Hagezi@release/HageziUltimate.mrs
    path: ./ruleset/hagezi-tif.mrs
    interval: 89837
    proxy: 🚫 受限网站
  advertising:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Advertising/Advertising.yaml
    path: ./ruleset/bm7-Advertising.yaml
    interval: 86613
    proxy: 🚫 受限网站
  acc-hijackingplus:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/HijackingPlus/HijackingPlus.yaml
    path: ./ruleset/acc-hijackingplus.yaml
    interval: 90219
    proxy: 🚫 受限网站
  acc-blockhttpdnsplus:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/BlockHttpDNSPlus/BlockHttpDNSPlus.yaml
    path: ./ruleset/acc-blockhttpdnsplus.yaml
    interval: 90221
    proxy: 🚫 受限网站
  acc-prerepaireasyprivacy:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/PreRepairEasyPrivacy/PreRepairEasyPrivacy.yaml
    path: ./ruleset/acc-prerepaireasyprivacy.yaml
    interval: 90279
    proxy: 🚫 受限网站

  # ---------- AI 服务 (9) ----------
  openai:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/openai.mrs
    path: ./ruleset/meta-openai.mrs
    interval: 85534
    proxy: 🚫 受限网站
  claude:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Claude/Claude.yaml
    path: ./ruleset/bm7-Claude.yaml
    interval: 85548
    proxy: 🚫 受限网站
  gemini:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Gemini/Gemini.yaml
    path: ./ruleset/bm7-Gemini.yaml
    interval: 85582
    proxy: 🚫 受限网站
  copilot:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Copilot/Copilot.yaml
    path: ./ruleset/bm7-Copilot.yaml
    interval: 85608
    proxy: 🚫 受限网站
  szkane-ai:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/AiDomain.list
    path: ./ruleset/szkane-ai.list
    interval: 89853
    proxy: 🚫 受限网站
  szkane-ciciai:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/CiciAi.list
    path: ./ruleset/szkane-ciciai.list
    interval: 89847
    proxy: 🚫 受限网站
  acc-appleai:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/AppleAI/AppleAI.yaml
    path: ./ruleset/acc-appleai.yaml
    interval: 89997
    proxy: 🚫 受限网站
  acc-grok:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Grok/Grok.yaml
    path: ./ruleset/acc-grok.yaml
    interval: 90000
    proxy: 🚫 受限网站
  civitai:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Civitai/Civitai.yaml
    path: ./ruleset/bm7-Civitai.yaml
    interval: 86768
    proxy: 🚫 受限网站

  # ---------- 加密货币 (3) ★ 用户核心业务 ★ ----------
  cryptocurrency:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Cryptocurrency/Cryptocurrency.yaml
    path: ./ruleset/bm7-Cryptocurrency.yaml
    interval: 85615
    proxy: 🚫 受限网站
  binance:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Binance/Binance.yaml
    path: ./ruleset/bm7-Binance.yaml
    interval: 86777
    proxy: 🚫 受限网站
  szkane-web3:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Web3.list
    path: ./ruleset/szkane-web3.list
    interval: 89867
    proxy: 🚫 受限网站

  # ---------- 金融支付 (8, 从 18 精简) ----------
  paypal:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/PayPal/PayPal.yaml
    path: ./ruleset/bm7-PayPal.yaml
    interval: 86424
    proxy: 🚫 受限网站
  stripe:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Stripe/Stripe.yaml
    path: ./ruleset/bm7-Stripe.yaml
    interval: 86776
    proxy: 🚫 受限网站
  visa:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/VISA/VISA.yaml
    path: ./ruleset/bm7-VISA.yaml
    interval: 86839
    proxy: 🚫 受限网站
  tigerfintech:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TigerFintech/TigerFintech.yaml
    path: ./ruleset/bm7-TigerFintech.yaml
    interval: 86817
    proxy: 🚫 受限网站
  acc-bank-us:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankUS.yaml
    path: ./ruleset/acc-BankUS.yaml
    interval: 90425
    proxy: 🚫 受限网站
  acc-bank-hk:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankHK.yaml
    path: ./ruleset/acc-BankHK.yaml
    interval: 90460
    proxy: 🚫 受限网站
  acc-bank-sg:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankSG.yaml
    path: ./ruleset/acc-BankSG.yaml
    interval: 90442
    proxy: 🚫 受限网站
  acc-vf-paypal:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/VirtualFinance/Paypal.yaml
    path: ./ruleset/acc-Paypal.yaml
    interval: 90560
    proxy: 🚫 受限网站

  # ---------- 邮件服务 (3) ----------
  mail:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Mail/Mail.yaml
    path: ./ruleset/bm7-Mail.yaml
    interval: 86823
    proxy: 🚫 受限网站
  protonmail:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Protonmail/Protonmail.yaml
    path: ./ruleset/bm7-Protonmail.yaml
    interval: 86900
    proxy: 🚫 受限网站
  spark:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Spark/Spark.yaml
    path: ./ruleset/bm7-Spark.yaml
    interval: 86922
    proxy: 🚫 受限网站

  # ---------- 即时通讯 (6) ----------
  telegram:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/telegram.mrs
    path: ./ruleset/meta-telegram.mrs
    interval: 85645
    proxy: 🚫 受限网站
  telegram-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/telegram.mrs
    path: ./ruleset/meta-ip-telegram.mrs
    interval: 85653
    proxy: 🚫 受限网站
  discord:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Discord/Discord.yaml
    path: ./ruleset/bm7-Discord.yaml
    interval: 85629
    proxy: 🚫 受限网站
  whatsapp:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Whatsapp/Whatsapp.yaml
    path: ./ruleset/bm7-Whatsapp.yaml
    interval: 85703
    proxy: 🚫 受限网站
  line:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Line/Line.yaml
    path: ./ruleset/bm7-Line.yaml
    interval: 85637
    proxy: 🚫 受限网站
  acc-signal:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Signal/Signal.yaml
    path: ./ruleset/acc-signal.yaml
    interval: 90105
    proxy: 🚫 受限网站

  # ---------- 社交媒体 (10) ----------
  twitter:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/twitter.mrs
    path: ./ruleset/meta-twitter.mrs
    interval: 85717
    proxy: 🚫 受限网站
  twitter-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/twitter.mrs
    path: ./ruleset/meta-ip-twitter.mrs
    interval: 85702
    proxy: 🚫 受限网站
  tiktok:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/tiktok.mrs
    path: ./ruleset/meta-tiktok.mrs
    interval: 85719
    proxy: 🚫 受限网站
  reddit:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Reddit/Reddit.yaml
    path: ./ruleset/bm7-Reddit.yaml
    interval: 85764
    proxy: 🚫 受限网站
  facebook:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Facebook/Facebook.yaml
    path: ./ruleset/bm7-Facebook.yaml
    interval: 85781
    proxy: 🚫 受限网站
  facebook-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/facebook.mrs
    path: ./ruleset/meta-ip-facebook.mrs
    interval: 85821
    proxy: 🚫 受限网站
  instagram:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Instagram/Instagram.yaml
    path: ./ruleset/bm7-Instagram.yaml
    interval: 85758
    proxy: 🚫 受限网站
  pinterest:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Pinterest/Pinterest.yaml
    path: ./ruleset/bm7-Pinterest.yaml
    interval: 85841
    proxy: 🚫 受限网站
  linkedin:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/LinkedIn/LinkedIn.yaml
    path: ./ruleset/bm7-LinkedIn.yaml
    interval: 85810
    proxy: 🚫 受限网站
  pixiv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Pixiv/Pixiv.yaml
    path: ./ruleset/bm7-Pixiv.yaml
    interval: 87046
    proxy: 🚫 受限网站

  # ---------- 会议协作 (7) ----------
  zoom:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/Providers/Ruleset/Zoom.yaml
    path: ./ruleset/acl4ssr-Zoom.yaml
    interval: 85865
    proxy: 🚫 受限网站
  slack:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Slack/Slack.yaml
    path: ./ruleset/bm7-Slack.yaml
    interval: 85862
    proxy: 🚫 受限网站
  teams:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Teams/Teams.yaml
    path: ./ruleset/bm7-Teams.yaml
    interval: 85909
    proxy: 🚫 受限网站
  atlassian:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Atlassian/Atlassian.yaml
    path: ./ruleset/bm7-Atlassian.yaml
    interval: 87170
    proxy: 🚫 受限网站
  notion:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Notion/Notion.yaml
    path: ./ruleset/bm7-Notion.yaml
    interval: 87139
    proxy: 🚫 受限网站
  remotedesktop:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/RemoteDesktop/RemoteDesktop.yaml
    path: ./ruleset/bm7-RemoteDesktop.yaml
    interval: 87272
    proxy: 🚫 受限网站
  acc-rustdesk:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/RustDesk/RustDesk.yaml
    path: ./ruleset/acc-rustdesk.yaml
    interval: 90149
    proxy: 🚫 受限网站

  # ---------- 搜索 + Google 家族 (3, 合并 5 项) ----------
  google:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/google.mrs
    path: ./ruleset/meta-google.mrs
    interval: 85910
    proxy: 🚫 受限网站
  google-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/google.mrs
    path: ./ruleset/meta-ip-google.mrs
    interval: 85890
    proxy: 🚫 受限网站
  bing:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Bing/Bing.yaml
    path: ./ruleset/bm7-Bing.yaml
    interval: 85928
    proxy: 🚫 受限网站

  # ---------- 开发者服务 (4) ----------
  github:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/github.mrs
    path: ./ruleset/meta-github.mrs
    interval: 86388
    proxy: 🚫 受限网站
  docker:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Docker/Docker.yaml
    path: ./ruleset/bm7-Docker.yaml
    interval: 86390
    proxy: 🚫 受限网站
  developer:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Developer/Developer.yaml
    path: ./ruleset/bm7-Developer.yaml
    interval: 89027
    proxy: 🚫 受限网站
  szkane-developer:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/Developer.list
    path: ./ruleset/szkane-developer.list
    interval: 89876
    proxy: 🚫 受限网站

  # ---------- 微软 (3) ----------
  microsoft:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/microsoft.mrs
    path: ./ruleset/meta-microsoft.mrs
    interval: 86330
    proxy: 🚫 受限网站
  onedrive:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/onedrive.mrs
    path: ./ruleset/meta-onedrive.mrs
    interval: 86323
    proxy: 🚫 受限网站
  acc-microsoftapps:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/MicrosoftAPPs/MicrosoftAPPs.yaml
    path: ./ruleset/acc-microsoftapps.yaml
    interval: 90083
    proxy: 🚫 受限网站

  # ---------- 苹果 (5, 从 14 合并) ----------
  apple:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/apple.mrs
    path: ./ruleset/meta-apple.mrs
    interval: 86384
    proxy: 🚫 受限网站
  icloud:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/icloud.mrs
    path: ./ruleset/meta-icloud.mrs
    interval: 86390
    proxy: 🚫 受限网站
  applemusic:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AppleMusic/AppleMusic.yaml
    path: ./ruleset/bm7-AppleMusic.yaml
    interval: 86380
    proxy: 🚫 受限网站
  appstore:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AppStore/AppStore.yaml
    path: ./ruleset/bm7-AppStore.yaml
    interval: 89218
    proxy: 🚫 受限网站
  acc-apple:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Apple/Apple.yaml
    path: ./ruleset/acc-apple.yaml
    interval: 90086
    proxy: 🚫 受限网站

  # ---------- 下载更新 (3, 从 12 精简) ----------
  systemota:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/SystemOTA/SystemOTA.yaml
    path: ./ruleset/bm7-SystemOTA.yaml
    interval: 86505
    proxy: 🚫 受限网站
  download:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Download/Download.yaml
    path: ./ruleset/bm7-Download.yaml
    interval: 89336
    proxy: 🚫 受限网站
  acc-macappupgrade:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/MacAppUpgrade/MacAppUpgrade.yaml
    path: ./ruleset/acc-macappupgrade.yaml
    interval: 90283
    proxy: 🚫 受限网站

  # ---------- 云与 CDN (6) ----------
  cloudflare-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/cloudflare.mrs
    path: ./ruleset/meta-ip-cloudflare.mrs
    interval: 86448
    proxy: 🚫 受限网站
  cloudfront-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/cloudfront.mrs
    path: ./ruleset/meta-ip-cloudfront.mrs
    interval: 86460
    proxy: 🚫 受限网站
  fastly-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/fastly.mrs
    path: ./ruleset/meta-ip-fastly.mrs
    interval: 86488
    proxy: 🚫 受限网站
  cloudflare:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Cloudflare/Cloudflare.yaml
    path: ./ruleset/bm7-Cloudflare.yaml
    interval: 89493
    proxy: 🚫 受限网站
  akamai:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Akamai/Akamai.yaml
    path: ./ruleset/bm7-Akamai.yaml
    interval: 89500
    proxy: 🚫 受限网站
  acc-fastly:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Fastly/Fastly.yaml
    path: ./ruleset/acc-fastly.yaml
    interval: 90278
    proxy: 🚫 受限网站

  # ---------- BT/PT Tracker (1) ----------
  privatetracker:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/PrivateTracker/PrivateTracker.yaml
    path: ./ruleset/bm7-PrivateTracker.yaml
    interval: 89599
    proxy: 🚫 受限网站

  # ---------- 国内网站+流媒体 (12, 从 ~50 精简) ----------
  bilibili:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/bilibili.mrs
    path: ./ruleset/meta-bilibili.mrs
    interval: 86523
    proxy: 🚫 受限网站
  iqiyi:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/iQIYI/iQIYI.yaml
    path: ./ruleset/bm7-iQIYI.yaml
    interval: 87249
    proxy: 🚫 受限网站
  tencentvideo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TencentVideo/TencentVideo.yaml
    path: ./ruleset/bm7-TencentVideo.yaml
    interval: 87293
    proxy: 🚫 受限网站
  douyin:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/DouYin/DouYin.yaml
    path: ./ruleset/bm7-DouYin.yaml
    interval: 87311
    proxy: 🚫 受限网站
  bytedance:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/ByteDance/ByteDance.yaml
    path: ./ruleset/bm7-ByteDance.yaml
    interval: 87331
    proxy: 🚫 受限网站
  xiaohongshu:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/XiaoHongShu/XiaoHongShu.yaml
    path: ./ruleset/bm7-XiaoHongShu.yaml
    interval: 87359
    proxy: 🚫 受限网站
  weibo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Weibo/Weibo.yaml
    path: ./ruleset/bm7-Weibo.yaml
    interval: 87360
    proxy: 🚫 受限网站
  neteasemusic:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/NetEaseMusic/NetEaseMusic.yaml
    path: ./ruleset/bm7-NetEaseMusic.yaml
    interval: 87397
    proxy: 🚫 受限网站
  cn:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/cn.mrs
    path: ./ruleset/meta-cn.mrs
    interval: 86580
    proxy: 🚫 受限网站
  cn-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/cn.mrs
    path: ./ruleset/meta-ip-cn.mrs
    interval: 86582
    proxy: 🚫 受限网站
  # v5.2.5 FIX#23-P1: acc-china 删除（与 geosite:cn 纯重复；OC slim 从 v5.3.4 起不含 acc-geositecn）
  acc-chinamax:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/ChinaMax/ChinaMax.yaml
    path: ./ruleset/acc-chinamax.yaml
    interval: 90356
    proxy: 🚫 受限网站

  # ---------- 东南亚流媒体 (4) ----------
  viu:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/ViuTV/ViuTV.yaml
    path: ./ruleset/bm7-ViuTV.yaml
    interval: 86499
    proxy: 🚫 受限网站
  wetv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/WeTV/WeTV.yaml
    path: ./ruleset/bm7-WeTV.yaml
    interval: 87970
    proxy: 🚫 受限网站
  biliintl:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/biliintl.mrs
    path: ./ruleset/meta-biliintl.mrs
    interval: 86528
    proxy: 🚫 受限网站
  joox:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/JOOX/JOOX.yaml
    path: ./ruleset/bm7-JOOX.yaml
    interval: 87938
    proxy: 🚫 受限网站

  # ---------- 美国流媒体 (11, 从 33 精简) ----------
  youtube:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/youtube.mrs
    path: ./ruleset/meta-youtube.mrs
    interval: 85944
    proxy: 🚫 受限网站
  netflix:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/netflix.mrs
    path: ./ruleset/meta-netflix.mrs
    interval: 86007
    proxy: 🚫 受限网站
  netflix-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/netflix.mrs
    path: ./ruleset/meta-ip-netflix.mrs
    interval: 85988
    proxy: 🚫 受限网站
  spotify:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/spotify.mrs
    path: ./ruleset/meta-spotify.mrs
    interval: 85987
    proxy: 🚫 受限网站
  disney:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Disney/Disney.yaml
    path: ./ruleset/bm7-Disney.yaml
    interval: 86026
    proxy: 🚫 受限网站
  hbo:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/HBO/HBO.yaml
    path: ./ruleset/bm7-HBO.yaml
    interval: 86018
    proxy: 🚫 受限网站
  primevideo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/PrimeVideo/PrimeVideo.yaml
    path: ./ruleset/bm7-PrimeVideo.yaml
    interval: 86082
    proxy: 🚫 受限网站
  hulu:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Hulu/Hulu.yaml
    path: ./ruleset/bm7-Hulu.yaml
    interval: 86042
    proxy: 🚫 受限网站
  amazon:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Amazon/Amazon.yaml
    path: ./ruleset/bm7-Amazon.yaml
    interval: 86104
    proxy: 🚫 受限网站
  twitch:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Twitch/Twitch.yaml
    path: ./ruleset/bm7-Twitch.yaml
    interval: 86120
    proxy: 🚫 受限网站
  szkane-netflixip:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/NetflixIP.list
    path: ./ruleset/szkane-netflixip.list
    interval: 89943
    proxy: 🚫 受限网站

  # ---------- 香港流媒体 (2, 从 10 精简) ----------
  mytvsuper:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/myTVSUPER/myTVSUPER.yaml
    path: ./ruleset/bm7-myTVSUPER.yaml
    interval: 88305
    proxy: 🚫 受限网站
  tvb:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TVB/TVB.yaml
    path: ./ruleset/bm7-TVB.yaml
    interval: 88347
    proxy: 🚫 受限网站

  # ---------- 台湾流媒体 (4, 从 10 精简) ----------
  bahamut:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/bahamut.mrs
    path: ./ruleset/meta-bahamut.mrs
    interval: 86163
    proxy: 🚫 受限网站
  kktv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/KKTV/KKTV.yaml
    path: ./ruleset/bm7-KKTV.yaml
    interval: 86133
    proxy: 🚫 受限网站
  litv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/LiTV/LiTV.yaml
    path: ./ruleset/bm7-LiTV.yaml
    interval: 88415
    proxy: 🚫 受限网站
  szkane-bilihmt:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/BilibiliHMT.list
    path: ./ruleset/szkane-bilihmt.list
    interval: 89966
    proxy: 🚫 受限网站

  # ---------- 日韩流媒体 (3) ----------
  abema:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/abema.mrs
    path: ./ruleset/meta-abema.mrs
    interval: 86154
    proxy: 🚫 受限网站
  dazn:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/DAZN/DAZN.yaml
    path: ./ruleset/bm7-DAZN.yaml
    interval: 86194
    proxy: 🚫 受限网站
  niconico:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Niconico/Niconico.yaml
    path: ./ruleset/bm7-Niconico.yaml
    interval: 88547
    proxy: 🚫 受限网站

  # ---------- 欧洲流媒体 (2) ----------
  bbc:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/BBC/BBC.yaml
    path: ./ruleset/bm7-BBC.yaml
    interval: 86203
    proxy: 🚫 受限网站
  szkane-uk:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/UK.list
    path: ./ruleset/szkane-uk.list
    interval: 89935
    proxy: 🚫 受限网站

  # ---------- 游戏 (7, 从 19 精简) ----------
  steam:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Steam/Steam.yaml
    path: ./ruleset/bm7-Steam.yaml
    interval: 86210
    proxy: 🚫 受限网站
  epic:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Epic/Epic.yaml
    path: ./ruleset/bm7-Epic.yaml
    interval: 86215
    proxy: 🚫 受限网站
  playstation:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/PlayStation/PlayStation.yaml
    path: ./ruleset/bm7-PlayStation.yaml
    interval: 86225
    proxy: 🚫 受限网站
  nintendo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Nintendo/Nintendo.yaml
    path: ./ruleset/bm7-Nintendo.yaml
    interval: 86275
    proxy: 🚫 受限网站
  xbox:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Xbox/Xbox.yaml
    path: ./ruleset/bm7-Xbox.yaml
    interval: 86278
    proxy: 🚫 受限网站
  blizzard:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Blizzard/Blizzard.yaml
    path: ./ruleset/bm7-Blizzard.yaml
    interval: 86284
    proxy: 🚫 受限网站
  hoyoverse:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/HoYoverse/HoYoverse.yaml
    path: ./ruleset/bm7-HoYoverse.yaml
    interval: 88854
    proxy: 🚫 受限网站

  # ---------- GFW / 代理 (3) ----------
  loyalsoldier-gfw:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/gfw.mrs
    path: ./ruleset/meta-gfw.mrs
    interval: 89984
    proxy: 🚫 受限网站
  szkane-proxygfw:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/ProxyGFWlist.list
    path: ./ruleset/szkane-proxygfw.list
    interval: 89991
    proxy: 🚫 受限网站
  proxy:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/geolocation-!cn.mrs
    path: ./ruleset/meta-geolocation-!cn.mrs
    interval: 86594
    proxy: 🚫 受限网站

  # ---------- 国外网站 (4) ----------
  wikipedia:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Wikipedia/Wikipedia.yaml
    path: ./ruleset/bm7-Wikipedia.yaml
    interval: 89747
    proxy: 🚫 受限网站
  acc-waybackmachine:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/WaybackMachine/WaybackMachine.yaml
    path: ./ruleset/acc-waybackmachine.yaml
    interval: 90342
    proxy: 🚫 受限网站
  naver:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Naver/Naver.yaml
    path: ./ruleset/bm7-Naver.yaml
    interval: 88985
    proxy: 🚫 受限网站
  ehgallery:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/EHGallery/EHGallery.yaml
    path: ./ruleset/bm7-EHGallery.yaml
    interval: 88301
    proxy: 🚫 受限网站

  # ---------- GeoRouting (6, 从 26 精简 - 只保留用户环境相关) ----------
  acc-geo-d-asia-east:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Asia_East_ccTLD_Domain.yaml
    path: ./ruleset/acc-GeoD-Asia_East.yaml
    interval: 90839
    proxy: 🚫 受限网站
  acc-geo-ip-asia-east:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Asia_East_GeoIP.yaml
    path: ./ruleset/acc-GeoIP-Asia_East.yaml
    interval: 90828
    proxy: 🚫 受限网站
  acc-geo-d-asia-eastsouth:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Asia_EastSouth_ccTLD_Domain.yaml
    path: ./ruleset/acc-GeoD-Asia_EastSouth.yaml
    interval: 90838
    proxy: 🚫 受限网站
  acc-geo-ip-asia-eastsouth:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Asia_EastSouth_GeoIP.yaml
    path: ./ruleset/acc-GeoIP-Asia_EastSouth.yaml
    interval: 90884
    proxy: 🚫 受限网站
  acc-geo-d-asia-china:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Asia_China_ccTLD_Domain.yaml
    path: ./ruleset/acc-GeoD-Asia_China.yaml
    interval: 90977
    proxy: 🚫 受限网站
  acc-geo-ip-asia-china:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Asia_China_GeoIP.yaml
    path: ./ruleset/acc-GeoIP-Asia_China.yaml
    interval: 91011
    proxy: 🚫 受限网站
OVERRIDE_EOF

# ============================================================================
# Rules — 同步精简（与 rule-providers 136 项保持一致）
# 原 963 条 → ~520 条：
#   - 删除引用已移除 rule-providers 的 RULE-SET 行
#   - 保留所有 GEOSITE/GEOIP/DOMAIN-*/IP-CIDR（零额外内存开销）
#   - 保留用户核心业务规则（加密货币全系、Freqtrade/TradingView 直连等）
# ============================================================================
cat >> "$OVERRIDE_YAML" << 'OVERRIDE_EOF'
rules:
# ---- 广告拦截 (前置，截流优先) ----
- RULE-SET,anti-ad,🛑 广告拦截
- RULE-SET,sukka-phishing,🛑 广告拦截
- RULE-SET,hagezi-tif,🛑 广告拦截
- RULE-SET,acc-hijackingplus,🛑 广告拦截
- RULE-SET,acc-blockhttpdnsplus,🛑 广告拦截
- RULE-SET,acc-prerepaireasyprivacy,🛑 广告拦截
- GEOSITE,category-ads-all,🛑 广告拦截
- RULE-SET,advertising,🛑 广告拦截
- DST-PORT,7680,REJECT

# ---- 直连优先（局域网/系统服务） ----
- GEOSITE,private,DIRECT
- GEOIP,private,DIRECT,no-resolve
- IP-CIDR,172.90.1.130/32,DIRECT,no-resolve
- DST-PORT,26880,DIRECT
- DST-PORT,6540,DIRECT
- DST-PORT,33068,DIRECT
- DST-PORT,123,DIRECT
- DST-PORT,3478,DIRECT
- DST-PORT,3479,DIRECT
- DOMAIN-SUFFIX,chiphell.com,DIRECT
- DOMAIN-SUFFIX,iwipwedabay.com,DIRECT

# ---- 币安硬编码（避开 sniffer） ----
- DOMAIN-SUFFIX,binance.vision,💰 加密货币
- DOMAIN-SUFFIX,binance.com,💰 加密货币
- DOMAIN-SUFFIX,binance.info,💰 加密货币
- DOMAIN-SUFFIX,binance.cloud,💰 加密货币
- DOMAIN-SUFFIX,binance.me,💰 加密货币
- DOMAIN-SUFFIX,binance.org,💰 加密货币
- DOMAIN-SUFFIX,binancefuture.com,💰 加密货币

# ---- DNS-over-HTTPS 节点（分流到 CDN 组） ----
- DOMAIN,dns.google,☁️ 云与CDN
- DOMAIN,dns.google.com,☁️ 云与CDN

# ---- YouTube（在 google 规则前截留到美区） ----
- DOMAIN-SUFFIX,youtube.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,youtu.be,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,googlevideo.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,ytimg.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,ggpht.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,youtube-nocookie.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,youtubekids.com,🇺🇸 美国流媒体

# ---- AI 服务 ----
- RULE-SET,openai,🤖 AI 服务
- RULE-SET,claude,🤖 AI 服务
- RULE-SET,gemini,🤖 AI 服务
- RULE-SET,copilot,🤖 AI 服务
- DOMAIN-SUFFIX,perplexity.ai,🤖 AI 服务
- DOMAIN-SUFFIX,mistral.ai,🤖 AI 服务
- DOMAIN-SUFFIX,x.ai,🤖 AI 服务
- DOMAIN-SUFFIX,grok.com,🤖 AI 服务
- DOMAIN-SUFFIX,huggingface.co,🤖 AI 服务
- DOMAIN-SUFFIX,replicate.com,🤖 AI 服务
- DOMAIN-SUFFIX,together.ai,🤖 AI 服务
- DOMAIN-SUFFIX,cohere.ai,🤖 AI 服务
- DOMAIN-SUFFIX,cohere.com,🤖 AI 服务
- DOMAIN-SUFFIX,midjourney.com,🤖 AI 服务
- DOMAIN-SUFFIX,stability.ai,🤖 AI 服务
- DOMAIN-SUFFIX,anthropic.com,🤖 AI 服务
- DOMAIN-SUFFIX,cursor.com,🤖 AI 服务
- DOMAIN-SUFFIX,cursor.sh,🤖 AI 服务
- DOMAIN-SUFFIX,v0.dev,🤖 AI 服务
- DOMAIN-SUFFIX,vercel.ai,🤖 AI 服务
- DOMAIN-SUFFIX,notebooklm.google,🤖 AI 服务
- DOMAIN-SUFFIX,poe.com,🤖 AI 服务
- DOMAIN-SUFFIX,character.ai,🤖 AI 服务
- DOMAIN-SUFFIX,inflection.ai,🤖 AI 服务
- DOMAIN-SUFFIX,pi.ai,🤖 AI 服务
- DOMAIN-SUFFIX,suno.ai,🤖 AI 服务
- DOMAIN-SUFFIX,suno.com,🤖 AI 服务
- DOMAIN-SUFFIX,runway.ml,🤖 AI 服务
- DOMAIN-SUFFIX,runwayml.com,🤖 AI 服务
- DOMAIN-SUFFIX,openrouter.ai,🤖 AI 服务
- DOMAIN-SUFFIX,fireworks.ai,🤖 AI 服务
- DOMAIN-SUFFIX,modal.com,🤖 AI 服务
- DOMAIN-SUFFIX,modal.run,🤖 AI 服务
- DOMAIN-SUFFIX,runpod.io,🤖 AI 服务
- DOMAIN-SUFFIX,deepseek.com,🏠 国内网站
- RULE-SET,civitai,🤖 AI 服务
- RULE-SET,szkane-ai,🤖 AI 服务
- RULE-SET,szkane-ciciai,🤖 AI 服务
- RULE-SET,acc-appleai,🤖 AI 服务
- RULE-SET,acc-grok,🤖 AI 服务

# ---- Gmail/邮件 (在 google 前截留) ----
- DOMAIN-SUFFIX,gmail.com,📧 邮件服务
- DOMAIN-SUFFIX,googlemail.com,📧 邮件服务
- DOMAIN,mail.google.com,📧 邮件服务
- DOMAIN,inbox.google.com,📧 邮件服务

# ---- Google Meet/下载（在 google 规则集前截留到对应组） ----
- DOMAIN-SUFFIX,meet.google.com,🧑‍💼 会议协作
- DOMAIN,meet.googleapis.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,dl.google.com,📥 下载更新
- DOMAIN-SUFFIX,play.googleapis.com,📥 下载更新
- DOMAIN-SUFFIX,android.clients.google.com,📥 下载更新

# ---- 搜索 / Google 家族 ----
- RULE-SET,google,🔍 搜索引擎
- RULE-SET,google-ip,🔍 搜索引擎,no-resolve

# ---- 加密货币 ★ 用户核心业务 ★ ----
- DOMAIN-SUFFIX,tradingview.com,💰 加密货币
- DOMAIN-SUFFIX,tvcdn.com,💰 加密货币
- DOMAIN-SUFFIX,coinglass.com,💰 加密货币
- DOMAIN-SUFFIX,hyperliquid.xyz,💰 加密货币
- DOMAIN-SUFFIX,hyperliquid-testnet.xyz,💰 加密货币
- RULE-SET,cryptocurrency,💰 加密货币
- DOMAIN-SUFFIX,eth.limo,💰 加密货币
- DOMAIN-SUFFIX,glitternode.ru,💰 加密货币
- RULE-SET,binance,💰 加密货币
- RULE-SET,szkane-web3,💰 加密货币

# ---- 金融支付 ----
- RULE-SET,paypal,🏦 金融支付
- DOMAIN-SUFFIX,stripe.com,🏦 金融支付
- DOMAIN-SUFFIX,stripe.network,🏦 金融支付
- DOMAIN-SUFFIX,stripecdn.com,🏦 金融支付
- DOMAIN-SUFFIX,stripe.dev,🏦 金融支付
- DOMAIN-SUFFIX,wise.com,🏦 金融支付
- DOMAIN-SUFFIX,transferwise.com,🏦 金融支付
- DOMAIN-SUFFIX,revolut.com,🏦 金融支付
- DOMAIN-SUFFIX,revolut.me,🏦 金融支付
- DOMAIN-SUFFIX,braintreegateway.com,🏦 金融支付
- DOMAIN-SUFFIX,braintree-api.com,🏦 金融支付
- DOMAIN-SUFFIX,venmo.com,🏦 金融支付
- DOMAIN-SUFFIX,cash.app,🏦 金融支付
- DOMAIN-SUFFIX,squareup.com,🏦 金融支付
- DOMAIN-SUFFIX,square.com,🏦 金融支付
- DOMAIN-SUFFIX,adyen.com,🏦 金融支付
- DOMAIN-SUFFIX,checkout.com,🏦 金融支付
- DOMAIN-SUFFIX,klarna.com,🏦 金融支付
- DOMAIN-SUFFIX,afterpay.com,🏦 金融支付
- DOMAIN-SUFFIX,plaid.com,🏦 金融支付
- DOMAIN-SUFFIX,midtrans.com,🏦 金融支付
- DOMAIN-SUFFIX,gopay.co.id,🏦 金融支付
- DOMAIN-SUFFIX,ovo.id,🏦 金融支付
- DOMAIN-SUFFIX,dana.id,🏦 金融支付
- DOMAIN-SUFFIX,shopeepay.co.id,🏦 金融支付
- DOMAIN-SUFFIX,xendit.co,🏦 金融支付
- DOMAIN-SUFFIX,doku.com,🏦 金融支付
- RULE-SET,stripe,🏦 金融支付
- RULE-SET,visa,🏦 金融支付
- RULE-SET,tigerfintech,🏦 金融支付
- RULE-SET,acc-bank-us,🏦 金融支付
- RULE-SET,acc-bank-hk,🏦 金融支付
- RULE-SET,acc-bank-sg,🏦 金融支付
- RULE-SET,acc-vf-paypal,🏦 金融支付

# ---- 微软服务 ----
- DOMAIN,login.live.com,Ⓜ️ 微软服务
- DOMAIN,g.live.com,Ⓜ️ 微软服务
- DOMAIN-SUFFIX,officeapps.live.com,Ⓜ️ 微软服务
- DOMAIN-SUFFIX,do.dsp.mp.microsoft.com,📥 下载更新

# ---- Outlook / 邮箱 ----
- DOMAIN-SUFFIX,outlook.com,📧 邮件服务
- DOMAIN-SUFFIX,outlook.live.com,📧 邮件服务
- DOMAIN-SUFFIX,hotmail.com,📧 邮件服务
- DOMAIN,mail.live.com,📧 邮件服务
- DOMAIN,outlook.office365.com,📧 邮件服务
- DOMAIN,outlook.office.com,📧 邮件服务
- DOMAIN,mail.yahoo.com,📧 邮件服务
- DOMAIN-SUFFIX,ymail.com,📧 邮件服务
- DOMAIN-SUFFIX,protonmail.com,📧 邮件服务
- DOMAIN-SUFFIX,proton.me,📧 邮件服务
- DOMAIN-SUFFIX,pm.me,📧 邮件服务
- DOMAIN-SUFFIX,tutanota.com,📧 邮件服务
- DOMAIN-SUFFIX,tuta.com,📧 邮件服务
- DOMAIN,mail.zoho.com,📧 邮件服务
- DOMAIN,mail.me.com,📧 邮件服务
- DOMAIN-SUFFIX,fastmail.com,📧 邮件服务
- DOMAIN-SUFFIX,fastmail.fm,📧 邮件服务
- RULE-SET,mail,📧 邮件服务
- RULE-SET,protonmail,📧 邮件服务
- RULE-SET,spark,📧 邮件服务
- DOMAIN-SUFFIX,mail.qq.com,DIRECT
- DOMAIN-SUFFIX,mail.163.com,DIRECT
- DOMAIN-SUFFIX,mail.126.com,DIRECT
- DOMAIN-SUFFIX,mail.sina.com.cn,DIRECT
- DOMAIN-SUFFIX,mail.aliyun.com,DIRECT

# ---- 即时通讯 ----
- RULE-SET,telegram,💬 即时通讯
- RULE-SET,telegram-ip,💬 即时通讯,no-resolve
- RULE-SET,discord,💬 即时通讯
- RULE-SET,whatsapp,💬 即时通讯
- RULE-SET,line,💬 即时通讯
- DOMAIN-SUFFIX,skype.com,💬 即时通讯
- DOMAIN-SUFFIX,skypeecs.net,💬 即时通讯
- DOMAIN-SUFFIX,skypeforbusiness.com,💬 即时通讯
- DOMAIN-SUFFIX,sfbassets.com,💬 即时通讯
- DOMAIN-SUFFIX,lync.com,💬 即时通讯
- DOMAIN-SUFFIX,signal.org,💬 即时通讯
- DOMAIN-SUFFIX,whispersystems.org,💬 即时通讯
- DOMAIN-SUFFIX,signal.art,💬 即时通讯
- DOMAIN-SUFFIX,viber.com,💬 即时通讯
- DOMAIN-SUFFIX,viber.io,💬 即时通讯
- DOMAIN-SUFFIX,element.io,💬 即时通讯
- DOMAIN-SUFFIX,matrix.org,💬 即时通讯
- DOMAIN-SUFFIX,wire.com,💬 即时通讯
- DOMAIN-SUFFIX,threema.ch,💬 即时通讯
- RULE-SET,acc-signal,💬 即时通讯

# ---- 社交媒体 ----
- RULE-SET,twitter,📱 社交媒体
- RULE-SET,twitter-ip,📱 社交媒体,no-resolve
- RULE-SET,tiktok,📱 社交媒体
- RULE-SET,reddit,📱 社交媒体
- RULE-SET,facebook,📱 社交媒体
- RULE-SET,facebook-ip,📱 社交媒体,no-resolve
- RULE-SET,instagram,📱 社交媒体
- RULE-SET,pinterest,📱 社交媒体
- RULE-SET,linkedin,📱 社交媒体
- DOMAIN-SUFFIX,mastodon.social,📱 社交媒体
- DOMAIN-SUFFIX,joinmastodon.org,📱 社交媒体
- DOMAIN-SUFFIX,threads.net,📱 社交媒体
- DOMAIN-SUFFIX,bsky.app,📱 社交媒体
- DOMAIN-SUFFIX,bsky.social,📱 社交媒体
- DOMAIN-SUFFIX,tumblr.com,📱 社交媒体
- DOMAIN-SUFFIX,quora.com,📱 社交媒体
- DOMAIN-SUFFIX,medium.com,📱 社交媒体
- DOMAIN-SUFFIX,flickr.com,📱 社交媒体
- DOMAIN-SUFFIX,lemon8-app.com,📱 社交媒体
- RULE-SET,pixiv,📱 社交媒体

# ---- 会议协作 ----
- RULE-SET,zoom,🧑‍💼 会议协作
- RULE-SET,slack,🧑‍💼 会议协作
- RULE-SET,teams,🧑‍💼 会议协作
- DOMAIN-SUFFIX,webex.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,wbx2.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,ciscospark.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,notion.so,🧑‍💼 会议协作
- DOMAIN-SUFFIX,notion.site,🧑‍💼 会议协作
- DOMAIN-SUFFIX,figma.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,linear.app,🧑‍💼 会议协作
- DOMAIN-SUFFIX,atlassian.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,jira.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,trello.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,bitbucket.org,🧑‍💼 会议协作
- DOMAIN-SUFFIX,asana.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,monday.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,clickup.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,basecamp.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,airtable.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,miro.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,canva.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,coda.io,🧑‍💼 会议协作
- DOMAIN-SUFFIX,loom.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,larksuite.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,larkoffice.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,gotomeeting.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,logmein.com,🧑‍💼 会议协作
- DOMAIN-SUFFIX,goto.com,🧑‍💼 会议协作
- RULE-SET,atlassian,🧑‍💼 会议协作
- RULE-SET,notion,🧑‍💼 会议协作
- RULE-SET,remotedesktop,🧑‍💼 会议协作
- RULE-SET,acc-rustdesk,🧑‍💼 会议协作
- DOMAIN-SUFFIX,feishu.cn,DIRECT
- DOMAIN-SUFFIX,dingtalk.com,DIRECT
- DOMAIN-SUFFIX,welink.huaweicloud.com,DIRECT

# ---- 国内流媒体 ----
- RULE-SET,bilibili,📺 国内流媒体
- DOMAIN-SUFFIX,iqiyi.com,📺 国内流媒体
- DOMAIN-SUFFIX,iqiyipic.com,📺 国内流媒体
- DOMAIN-SUFFIX,71.am,📺 国内流媒体
- DOMAIN-SUFFIX,youku.com,📺 国内流媒体
- DOMAIN-SUFFIX,ykimg.com,📺 国内流媒体
- DOMAIN-SUFFIX,soku.com,📺 国内流媒体
- DOMAIN-SUFFIX,v.qq.com,📺 国内流媒体
- DOMAIN-SUFFIX,video.qq.com,📺 国内流媒体
- DOMAIN-KEYWORD,tencentvideo,📺 国内流媒体
- DOMAIN-SUFFIX,mgtv.com,📺 国内流媒体
- DOMAIN-SUFFIX,hitv.com,📺 国内流媒体
- DOMAIN-SUFFIX,hunantv.com,📺 国内流媒体
- DOMAIN-SUFFIX,douyin.com,📺 国内流媒体
- DOMAIN-SUFFIX,douyinpic.com,📺 国内流媒体
- DOMAIN-SUFFIX,douyinvod.com,📺 国内流媒体
- DOMAIN-SUFFIX,ixigua.com,📺 国内流媒体
- DOMAIN-SUFFIX,pstatp.com,📺 国内流媒体
- DOMAIN-SUFFIX,snssdk.com,📺 国内流媒体
- DOMAIN-SUFFIX,sohu.com,📺 国内流媒体
- DOMAIN-SUFFIX,music.163.com,📺 国内流媒体
- DOMAIN-SUFFIX,ntes53.netease.com,📺 国内流媒体
- DOMAIN-SUFFIX,y.qq.com,📺 国内流媒体
- DOMAIN-SUFFIX,music.qq.com,📺 国内流媒体
- DOMAIN-SUFFIX,kugou.com,📺 国内流媒体
- DOMAIN-SUFFIX,kuwo.cn,📺 国内流媒体
- DOMAIN-SUFFIX,xiaohongshu.com,📺 国内流媒体
- DOMAIN-SUFFIX,xhscdn.com,📺 国内流媒体
- DOMAIN-SUFFIX,kuaishou.com,📺 国内流媒体
- DOMAIN-SUFFIX,gifshow.com,📺 国内流媒体
- DOMAIN-SUFFIX,weibo.com,📺 国内流媒体
- DOMAIN-SUFFIX,weibo.cn,📺 国内流媒体
- DOMAIN-SUFFIX,sinaimg.cn,📺 国内流媒体
- RULE-SET,iqiyi,📺 国内流媒体
- RULE-SET,tencentvideo,📺 国内流媒体
- RULE-SET,douyin,📺 国内流媒体
- RULE-SET,bytedance,📺 国内流媒体
- RULE-SET,weibo,📺 国内流媒体
- RULE-SET,xiaohongshu,📺 国内流媒体
- RULE-SET,neteasemusic,📺 国内流媒体
- RULE-SET,szkane-bilihmt,🇭🇰 香港流媒体

# ---- 东南亚流媒体 ----
- RULE-SET,viu,📺 东南亚流媒体
- DOMAIN-SUFFIX,wetv.vip,📺 东南亚流媒体
- DOMAIN-SUFFIX,wetvinfo.com,📺 东南亚流媒体
- DOMAIN-SUFFIX,iq.com,📺 东南亚流媒体
- DOMAIN-SUFFIX,vidio.com,📺 东南亚流媒体
- DOMAIN-SUFFIX,vidio.static6.com,📺 东南亚流媒体
- DOMAIN-SUFFIX,rctiplus.com,📺 东南亚流媒体
- DOMAIN-SUFFIX,visionplus.id,📺 东南亚流媒体
- DOMAIN-SUFFIX,genflix.co.id,📺 东南亚流媒体
- DOMAIN-SUFFIX,goplay.co.id,📺 东南亚流媒体
- DOMAIN-SUFFIX,maxstream.tv,📺 东南亚流媒体
- RULE-SET,biliintl,📺 东南亚流媒体
- DOMAIN-SUFFIX,viki.com,📺 东南亚流媒体
- DOMAIN-SUFFIX,viki.io,📺 东南亚流媒体
- DOMAIN-SUFFIX,iflix.com,📺 东南亚流媒体
- DOMAIN-SUFFIX,catchplay.com,📺 东南亚流媒体
- DOMAIN-SUFFIX,mewatch.sg,📺 东南亚流媒体
- DOMAIN-SUFFIX,trueid.net,📺 东南亚流媒体
- DOMAIN-SUFFIX,dimsum.my,📺 东南亚流媒体
- RULE-SET,wetv,📺 东南亚流媒体
- RULE-SET,joox,📺 东南亚流媒体

# ---- 美国流媒体 ----
- RULE-SET,youtube,🇺🇸 美国流媒体
- RULE-SET,netflix,🇺🇸 美国流媒体
- RULE-SET,netflix-ip,🇺🇸 美国流媒体,no-resolve
- RULE-SET,spotify,🇺🇸 美国流媒体
- RULE-SET,disney,🇺🇸 美国流媒体
- RULE-SET,hbo,🇺🇸 美国流媒体
- RULE-SET,primevideo,🇺🇸 美国流媒体
- RULE-SET,hulu,🇺🇸 美国流媒体
- RULE-SET,twitch,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,amazonaws.com,☁️ 云与CDN
- DOMAIN-SUFFIX,awsstatic.com,☁️ 云与CDN
- DOMAIN-SUFFIX,aws.amazon.com,📟 开发者服务
- DOMAIN-SUFFIX,elasticbeanstalk.com,📟 开发者服务
- RULE-SET,amazon,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,crunchyroll.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,vrv.co,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,soundcloud.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,sndcdn.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,pandora.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,pluto.tv,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,tubi.tv,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,fubo.tv,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,discoveryplus.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,max.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,appletv.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,deezer.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,tidal.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,vimeo.com,🇺🇸 美国流媒体
- DOMAIN-SUFFIX,dailymotion.com,🇺🇸 美国流媒体
- RULE-SET,szkane-netflixip,🇺🇸 美国流媒体,no-resolve

# ---- 香港流媒体 ----
- DOMAIN-SUFFIX,mytvsuper.com,🇭🇰 香港流媒体
- DOMAIN-SUFFIX,mytv.com.hk,🇭🇰 香港流媒体
- DOMAIN-SUFFIX,viu.com,🇭🇰 香港流媒体
- DOMAIN-SUFFIX,viu.tv,🇭🇰 香港流媒体
- DOMAIN-SUFFIX,hktv.com.hk,🇭🇰 香港流媒体
- DOMAIN-SUFFIX,hktvmall.com,🇭🇰 香港流媒体
- DOMAIN-SUFFIX,nowtv.com,🇭🇰 香港流媒体
- DOMAIN-SUFFIX,nowe.com,🇭🇰 香港流媒体
- DOMAIN-SUFFIX,rthk.hk,🇭🇰 香港流媒体
- DOMAIN-SUFFIX,icable.com,🇭🇰 香港流媒体
- DOMAIN-SUFFIX,cabletv.com.hk,🇭🇰 香港流媒体
- DOMAIN-SUFFIX,hmvod.com.hk,🇭🇰 香港流媒体
- RULE-SET,mytvsuper,🇭🇰 香港流媒体
- RULE-SET,tvb,🇭🇰 香港流媒体

# ---- 台湾流媒体 ----
- RULE-SET,bahamut,🇹🇼 台湾流媒体
- RULE-SET,kktv,🇹🇼 台湾流媒体
- DOMAIN-SUFFIX,litv.tv,🇹🇼 台湾流媒体
- DOMAIN-SUFFIX,video.friday.tw,🇹🇼 台湾流媒体
- DOMAIN-SUFFIX,friday.tw,🇹🇼 台湾流媒体
- DOMAIN-SUFFIX,linetv.tw,🇹🇼 台湾流媒体
- DOMAIN-SUFFIX,elta.tv,🇹🇼 台湾流媒体
- DOMAIN-SUFFIX,mod.cht.com.tw,🇹🇼 台湾流媒体
- DOMAIN-SUFFIX,hamivideo.hinet.net,🇹🇼 台湾流媒体
- DOMAIN-SUFFIX,ofiii.com,🇹🇼 台湾流媒体
- DOMAIN-SUFFIX,pts.org.tw,🇹🇼 台湾流媒体
- DOMAIN-SUFFIX,4gtv.tv,🇹🇼 台湾流媒体
- RULE-SET,litv,🇹🇼 台湾流媒体

# ---- 日韩流媒体 ----
- RULE-SET,abema,🇯🇵 日韩流媒体
- RULE-SET,dazn,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,tver.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,unext.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,nhk.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,nhk.or.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,dmm.com,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,dmm.co.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,paravi.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,videomarket.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,fod.fujitv.co.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,hulu.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,happyon.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,music.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,nicovideo.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,radiko.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,lemino.docomo.ne.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,wowow.co.jp,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,wavve.com,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,tving.com,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,watcha.com,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,coupangplay.com,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,sbs.co.kr,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,kbs.co.kr,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,mbc.co.kr,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,jtbc.co.kr,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,tvn.cjenm.com,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,afreecatv.com,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,tv.naver.com,🇯🇵 日韩流媒体
- DOMAIN-SUFFIX,kakaotv.daum.net,🇯🇵 日韩流媒体
- RULE-SET,niconico,🇯🇵 日韩流媒体

# ---- 欧洲流媒体 ----
- RULE-SET,bbc,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,itv.com,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,channel4.com,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,channel5.com,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,sky.com,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,nowtv.com.uk,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,britbox.com,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,canalplus.com,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,mycanal.fr,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,france.tv,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,arte.tv,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,zdf.de,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,ard.de,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,raiplay.it,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,rtve.es,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,svtplay.se,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,nrk.no,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,ivi.ru,🇪🇺 欧洲流媒体
- DOMAIN-SUFFIX,kinopoisk.ru,🇪🇺 欧洲流媒体
- RULE-SET,szkane-uk,🇪🇺 欧洲流媒体

# ---- 国内游戏 ----
- DOMAIN-SUFFIX,mihoyo.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,miyoushe.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,yuanshen.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,bhsr.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,zenlesszonezero.com,🕹️ 国内游戏
- DOMAIN,game.163.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,gm.163.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,ds.163.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,nie.163.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,nie.netease.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,update.netease.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,wegame.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,wegame.com.cn,🕹️ 国内游戏
- DOMAIN-SUFFIX,perfect-world.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,wanmei.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,xd.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,taptap.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,taptap.io,🕹️ 国内游戏
- DOMAIN-SUFFIX,papegames.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,hypergryph.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,gryphline.com,🕹️ 国内游戏
- DOMAIN-SUFFIX,lilith.com,🕹️ 国内游戏

# ---- 国外游戏 ----
- RULE-SET,steam,🎮 国外游戏
- RULE-SET,epic,🎮 国外游戏
- RULE-SET,playstation,🎮 国外游戏
- RULE-SET,nintendo,🎮 国外游戏
- RULE-SET,xbox,🎮 国外游戏
- RULE-SET,blizzard,🎮 国外游戏
- GEOSITE,category-games,🎮 国外游戏
- DOMAIN-SUFFIX,ubisoft.com,🎮 国外游戏
- DOMAIN-SUFFIX,ubi.com,🎮 国外游戏
- DOMAIN-SUFFIX,riotgames.com,🎮 国外游戏
- DOMAIN-SUFFIX,leagueoflegends.com,🎮 国外游戏
- DOMAIN-SUFFIX,valorant.com,🎮 国外游戏
- DOMAIN-SUFFIX,rockstargames.com,🎮 国外游戏
- DOMAIN-SUFFIX,gog.com,🎮 国外游戏
- DOMAIN-SUFFIX,bethesda.net,🎮 国外游戏
- DOMAIN-SUFFIX,supercell.com,🎮 国外游戏
- DOMAIN-SUFFIX,garena.com,🎮 国外游戏
- DOMAIN-SUFFIX,hoyoverse.com,🎮 国外游戏
- DOMAIN-SUFFIX,hoyolab.com,🎮 国外游戏
- RULE-SET,hoyoverse,🎮 国外游戏

# ---- 搜索引擎 ----
- RULE-SET,bing,🔍 搜索引擎
- DOMAIN-SUFFIX,yahoo.com,🔍 搜索引擎
- DOMAIN-SUFFIX,yahoo.co.jp,🔍 搜索引擎
- DOMAIN-SUFFIX,duckduckgo.com,🔍 搜索引擎
- DOMAIN-SUFFIX,ddg.co,🔍 搜索引擎
- DOMAIN-SUFFIX,brave.com,🔍 搜索引擎
- DOMAIN-SUFFIX,yandex.com,🔍 搜索引擎
- DOMAIN-SUFFIX,yandex.ru,🔍 搜索引擎
- DOMAIN-SUFFIX,ecosia.org,🔍 搜索引擎
- DOMAIN-SUFFIX,startpage.com,🔍 搜索引擎
- DOMAIN-SUFFIX,you.com,🔍 搜索引擎
- DOMAIN-SUFFIX,search.naver.com,🔍 搜索引擎

# ---- 微软服务 ----
- RULE-SET,onedrive,Ⓜ️ 微软服务
- RULE-SET,microsoft,Ⓜ️ 微软服务
- RULE-SET,acc-microsoftapps,Ⓜ️ 微软服务

# ---- 苹果服务 ----
- RULE-SET,applemusic,🍎 苹果服务
- RULE-SET,icloud,🍎 苹果服务
- RULE-SET,apple,🍎 苹果服务
- RULE-SET,appstore,🍎 苹果服务
- RULE-SET,acc-apple,🍎 苹果服务

# ---- 开发者服务 ----
- RULE-SET,github,📟 开发者服务
- RULE-SET,docker,📟 开发者服务
- GEOSITE,category-dev,📟 开发者服务
- DOMAIN-SUFFIX,npmjs.com,📟 开发者服务
- DOMAIN-SUFFIX,npmjs.org,📟 开发者服务
- DOMAIN-SUFFIX,yarnpkg.com,📟 开发者服务
- DOMAIN-SUFFIX,pypi.org,📟 开发者服务
- DOMAIN-SUFFIX,pythonhosted.org,📟 开发者服务
- DOMAIN-SUFFIX,crates.io,📟 开发者服务
- DOMAIN-SUFFIX,rubygems.org,📟 开发者服务
- DOMAIN-SUFFIX,packagist.org,📟 开发者服务
- DOMAIN-SUFFIX,maven.org,📟 开发者服务
- DOMAIN-SUFFIX,nuget.org,📟 开发者服务
- DOMAIN-SUFFIX,cocoapods.org,📟 开发者服务
- DOMAIN-SUFFIX,stackoverflow.com,📟 开发者服务
- DOMAIN-SUFFIX,stackexchange.com,📟 开发者服务
- DOMAIN-SUFFIX,sstatic.net,📟 开发者服务
- DOMAIN-SUFFIX,vercel.com,📟 开发者服务
- DOMAIN-SUFFIX,vercel.app,📟 开发者服务
- DOMAIN-SUFFIX,netlify.app,📟 开发者服务
- DOMAIN-SUFFIX,netlify.com,📟 开发者服务
- DOMAIN-SUFFIX,pages.dev,📟 开发者服务
- DOMAIN-SUFFIX,workers.dev,📟 开发者服务
- DOMAIN,dash.cloudflare.com,📟 开发者服务
- DOMAIN,api.cloudflare.com,📟 开发者服务
- DOMAIN,developers.cloudflare.com,📟 开发者服务
- DOMAIN,www.cloudflare.com,📟 开发者服务
- DOMAIN-SUFFIX,heroku.com,📟 开发者服务
- DOMAIN-SUFFIX,herokuapp.com,📟 开发者服务
- DOMAIN-SUFFIX,fly.io,📟 开发者服务
- DOMAIN-SUFFIX,railway.app,📟 开发者服务
- DOMAIN-SUFFIX,render.com,📟 开发者服务
- DOMAIN-SUFFIX,supabase.com,📟 开发者服务
- DOMAIN-SUFFIX,supabase.co,📟 开发者服务
- DOMAIN-SUFFIX,planetscale.com,📟 开发者服务
- DOMAIN-SUFFIX,neon.tech,📟 开发者服务
- DOMAIN-SUFFIX,digitalocean.com,📟 开发者服务
- DOMAIN-SUFFIX,vultr.com,📟 开发者服务
- DOMAIN-SUFFIX,linode.com,📟 开发者服务
- DOMAIN-SUFFIX,sentry.io,📟 开发者服务
- DOMAIN-SUFFIX,datadog.com,📟 开发者服务
- DOMAIN-SUFFIX,grafana.com,📟 开发者服务
- DOMAIN-SUFFIX,postman.com,📟 开发者服务
- DOMAIN-SUFFIX,jetbrains.com,📟 开发者服务
- DOMAIN-SUFFIX,hashicorp.com,📟 开发者服务
- DOMAIN-SUFFIX,terraform.io,📟 开发者服务
- RULE-SET,developer,📟 开发者服务
- RULE-SET,szkane-developer,📟 开发者服务

# ---- 下载更新 ----
- RULE-SET,systemota,📥 下载更新
- DOMAIN-SUFFIX,windowsupdate.com,📥 下载更新
- DOMAIN-SUFFIX,update.microsoft.com,📥 下载更新
- DOMAIN-SUFFIX,download.microsoft.com,📥 下载更新
- DOMAIN-SUFFIX,delivery.mp.microsoft.com,📥 下载更新
- DOMAIN-SUFFIX,dl.delivery.mp.microsoft.com,📥 下载更新
- DOMAIN-SUFFIX,officecdn.microsoft.com,📥 下载更新
- DOMAIN-SUFFIX,officecdn.microsoft.com.edgesuite.net,📥 下载更新
- DOMAIN-SUFFIX,download.mozilla.org,📥 下载更新
- DOMAIN-SUFFIX,archive.mozilla.org,📥 下载更新
- DOMAIN-SUFFIX,releases.ubuntu.com,📥 下载更新
- DOMAIN-SUFFIX,archive.ubuntu.com,📥 下载更新
- DOMAIN-SUFFIX,security.ubuntu.com,📥 下载更新
- DOMAIN-SUFFIX,mirrors.kernel.org,📥 下载更新
- DOMAIN-SUFFIX,dl.fedoraproject.org,📥 下载更新
- DOMAIN-SUFFIX,repo.anaconda.com,📥 下载更新
- DOMAIN-SUFFIX,conda.anaconda.org,📥 下载更新
- DOMAIN-SUFFIX,repo.continuum.io,📥 下载更新
- DOMAIN-SUFFIX,sourceforge.net,📥 下载更新
- DOMAIN-SUFFIX,fosshub.com,📥 下载更新
- DOMAIN-SUFFIX,filehippo.com,📥 下载更新
- DOMAIN-SUFFIX,gcr.io,📥 下载更新
- DOMAIN-SUFFIX,ghcr.io,📥 下载更新
- DOMAIN-SUFFIX,quay.io,📥 下载更新
- DOMAIN-SUFFIX,registry.k8s.io,📥 下载更新
- RULE-SET,download,📥 下载更新
- RULE-SET,acc-macappupgrade,📥 下载更新

# ---- 云与 CDN ----
- RULE-SET,cloudflare-ip,☁️ 云与CDN,no-resolve
- RULE-SET,cloudfront-ip,☁️ 云与CDN,no-resolve
- RULE-SET,fastly-ip,☁️ 云与CDN,no-resolve
- DOMAIN-SUFFIX,akamai.net,☁️ 云与CDN
- DOMAIN-SUFFIX,akamaized.net,☁️ 云与CDN
- DOMAIN-SUFFIX,akamaihd.net,☁️ 云与CDN
- DOMAIN-SUFFIX,akamaiedge.net,☁️ 云与CDN
- DOMAIN-SUFFIX,akamaitechnologies.com,☁️ 云与CDN
- DOMAIN-SUFFIX,edgekey.net,☁️ 云与CDN
- DOMAIN-SUFFIX,edgesuite.net,☁️ 云与CDN
- DOMAIN-SUFFIX,cloudfront.net,☁️ 云与CDN
- DOMAIN-SUFFIX,fastly.net,☁️ 云与CDN
- DOMAIN-SUFFIX,fastlylb.net,☁️ 云与CDN
- DOMAIN-SUFFIX,kxcdn.com,☁️ 云与CDN
- DOMAIN-SUFFIX,b-cdn.net,☁️ 云与CDN
- DOMAIN-SUFFIX,bunny.net,☁️ 云与CDN
- DOMAIN-SUFFIX,bunnycdn.com,☁️ 云与CDN
- DOMAIN-SUFFIX,azureedge.net,☁️ 云与CDN
- DOMAIN-SUFFIX,azurefd.net,☁️ 云与CDN
- DOMAIN-SUFFIX,msecnd.net,☁️ 云与CDN
- DOMAIN-SUFFIX,jsdelivr.net,🚫 受限网站
- DOMAIN-SUFFIX,unpkg.com,☁️ 云与CDN
- DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN
- DOMAIN-SUFFIX,cloudflarestorage.com,☁️ 云与CDN
- DOMAIN-SUFFIX,r2.dev,☁️ 云与CDN
- DOMAIN-SUFFIX,ziffstatic.com,☁️ 云与CDN
- RULE-SET,cloudflare,☁️ 云与CDN
- RULE-SET,akamai,☁️ 云与CDN
- RULE-SET,acc-fastly,☁️ 云与CDN
- DOMAIN-SUFFIX,letsencrypt.org,☁️ 云与CDN
- DOMAIN-SUFFIX,lencr.org,☁️ 云与CDN

# ---- BT/PT Tracker ----
- GEOSITE,tracker,🛰️ BT/PT Tracker
- DOMAIN-SUFFIX,tracker.opentrackr.org,🛰️ BT/PT Tracker
- DOMAIN-SUFFIX,open.stealth.si,🛰️ BT/PT Tracker
- DOMAIN-SUFFIX,tracker.torrent.eu.org,🛰️ BT/PT Tracker
- DOMAIN-SUFFIX,exodus.desync.com,🛰️ BT/PT Tracker
- DOMAIN-SUFFIX,tracker.openbittorrent.com,🛰️ BT/PT Tracker
- DOMAIN-SUFFIX,tracker.publicbt.com,🛰️ BT/PT Tracker
- DOMAIN-SUFFIX,tracker.dler.org,🛰️ BT/PT Tracker
- RULE-SET,privatetracker,🛰️ BT/PT Tracker

# ---- 印尼本地（用户环境）----
- DOMAIN-SUFFIX,bca.co.id,🏦 金融支付
- DOMAIN-SUFFIX,klikbca.com,🏦 金融支付
- DOMAIN-SUFFIX,bni.co.id,🏦 金融支付
- DOMAIN-SUFFIX,bri.co.id,🏦 金融支付
- DOMAIN-SUFFIX,bankmandiri.co.id,🏦 金融支付
- DOMAIN-SUFFIX,danamon.co.id,🏦 金融支付
- DOMAIN-SUFFIX,permatabank.com,🏦 金融支付
- DOMAIN-SUFFIX,cimbniaga.co.id,🏦 金融支付
- DOMAIN-SUFFIX,btn.co.id,🏦 金融支付
- DOMAIN-SUFFIX,ocbcnisp.com,🏦 金融支付
- DOMAIN-SUFFIX,banksinarmas.com,🏦 金融支付
- DOMAIN-SUFFIX,idx.co.id,🏦 金融支付
- DOMAIN-SUFFIX,ksei.co.id,🏦 金融支付
- DOMAIN-SUFFIX,tokopedia.com,🌐 国外网站
- DOMAIN-SUFFIX,tokopedia.net,🌐 国外网站
- DOMAIN-SUFFIX,shopee.co.id,🌐 国外网站
- DOMAIN-SUFFIX,bukalapak.com,🌐 国外网站
- DOMAIN-SUFFIX,blibli.com,🌐 国外网站
- DOMAIN-SUFFIX,lazada.co.id,🌐 国外网站
- DOMAIN-SUFFIX,grab.com,🌐 国外网站
- DOMAIN-SUFFIX,gojek.com,🌐 国外网站
- DOMAIN-SUFFIX,gojek.co.id,🌐 国外网站
- DOMAIN-SUFFIX,traveloka.com,🌐 国外网站
- DOMAIN-SUFFIX,tiket.com,🌐 国外网站
- DOMAIN-SUFFIX,telkomsel.com,🌐 国外网站
- DOMAIN-SUFFIX,telkom.co.id,🌐 国外网站
- DOMAIN-SUFFIX,indosatooredoo.com,🌐 国外网站
- DOMAIN-SUFFIX,im3.co.id,🌐 国外网站
- DOMAIN-SUFFIX,xl.co.id,🌐 国外网站
- DOMAIN-SUFFIX,smartfren.com,🌐 国外网站
- DOMAIN-SUFFIX,tri.co.id,🌐 国外网站
- DOMAIN-SUFFIX,by.u.id,🌐 国外网站
- DOMAIN-SUFFIX,myrepublic.co.id,🌐 国外网站
- DOMAIN-SUFFIX,firstmedia.com,🌐 国外网站
- DOMAIN-SUFFIX,biznet.id,🌐 国外网站
- DOMAIN-SUFFIX,go.id,🌐 国外网站
- DOMAIN-SUFFIX,or.id,🌐 国外网站
- DOMAIN-SUFFIX,kompas.com,🌐 国外网站
- DOMAIN-SUFFIX,detik.com,🌐 国外网站
- DOMAIN-SUFFIX,tempo.co,🌐 国外网站
- DOMAIN-SUFFIX,cnnindonesia.com,🌐 国外网站
- DOMAIN-SUFFIX,cnbcindonesia.com,🌐 国外网站
- DOMAIN-SUFFIX,liputan6.com,🌐 国外网站
- DOMAIN-SUFFIX,tribunnews.com,🌐 国外网站
- DOMAIN-SUFFIX,kumparan.com,🌐 国外网站
- DOMAIN-SUFFIX,idntimes.com,🌐 国外网站
- DOMAIN-SUFFIX,gofood.co.id,🌐 国外网站
- DOMAIN-SUFFIX,grabfood.com,🌐 国外网站
- DOMAIN-SUFFIX,66tutup.com,🌐 国外网站
- GEOIP,ID,🌐 国外网站,no-resolve

# ---- 国内网站（放在 GFW 规则前，避免误判） ----
- DOMAIN-SUFFIX,163.com,🏠 国内网站
- DOMAIN-SUFFIX,126.com,🏠 国内网站
- DOMAIN-SUFFIX,126.net,🏠 国内网站
- DOMAIN-SUFFIX,jianguoyun.com,🏠 国内网站
- RULE-SET,cn,🏠 国内网站
- RULE-SET,cn-ip,🏠 国内网站,no-resolve
- DOMAIN-SUFFIX,alimama.com,🏠 国内网站
- DOMAIN-SUFFIX,zxtdjy.com,🏠 国内网站
- RULE-SET,acc-chinamax,🏠 国内网站
- RULE-SET,acc-geo-d-asia-china,🏠 国内网站
- RULE-SET,acc-geo-ip-asia-china,🏠 国内网站,no-resolve

# ---- 受限网站（GFW）----
- GEOSITE,gfw,🚫 受限网站
- RULE-SET,loyalsoldier-gfw,🚫 受限网站
- RULE-SET,szkane-proxygfw,🚫 受限网站

# ---- 国外网站（通用） ----
- RULE-SET,wikipedia,🌐 国外网站
- RULE-SET,acc-waybackmachine,🌐 国外网站
- RULE-SET,naver,🌐 国外网站
- RULE-SET,ehgallery,🌐 国外网站
- RULE-SET,proxy,🌐 国外网站
- RULE-SET,acc-geo-d-asia-east,🌐 国外网站
- RULE-SET,acc-geo-d-asia-eastsouth,🌐 国外网站
- RULE-SET,acc-geo-ip-asia-east,🌐 国外网站,no-resolve
- RULE-SET,acc-geo-ip-asia-eastsouth,🌐 国外网站,no-resolve
- DOMAIN-SUFFIX,archive.org,🌐 国外网站
- DOMAIN-SUFFIX,udemy.com,🌐 国外网站
- DOMAIN-SUFFIX,udemycdn.com,🌐 国外网站
- DOMAIN-SUFFIX,grammarly.com,🌐 国外网站
- DOMAIN-SUFFIX,grammarly.io,🌐 国外网站
- DOMAIN-SUFFIX,jetbrains.net,🌐 国外网站
- DOMAIN-SUFFIX,theguardian.com,🌐 国外网站
- DOMAIN-SUFFIX,guardianapis.com,🌐 国外网站
- DOMAIN-SUFFIX,box.com,🌐 国外网站
- DOMAIN-SUFFIX,boxcdn.net,🌐 国外网站
- DOMAIN-SUFFIX,noip.com,🌐 国外网站
- DOMAIN-SUFFIX,dropbox.com,🌐 国外网站
- DOMAIN-SUFFIX,mega.nz,🌐 国外网站
- DOMAIN-SUFFIX,mega.io,🌐 国外网站

# ---- GEOIP 兜底分流 ----
- GEOIP,cloudflare,☁️ 云与CDN,no-resolve
- GEOIP,telegram,💬 即时通讯,no-resolve
- GEOIP,netflix,🇺🇸 美国流媒体,no-resolve
- GEOIP,facebook,📱 社交媒体,no-resolve
- GEOIP,twitter,📱 社交媒体,no-resolve
- GEOIP,google,🔍 搜索引擎,no-resolve
- GEOIP,CN,🏠 国内网站,no-resolve
- MATCH,🐟 漏网之鱼
OVERRIDE_EOF


# ============================================================================
# Ruby Script — 节点过滤、区域分类、Smart 组生成、TLS 指纹注入
# ★ 核心架构不变：9 个 Smart 组全部 uselightgbm: true + include-all-proxies: true ★
# ============================================================================
RUBY_SCRIPT="/tmp/clash_smart_ruby.rb"
cat > "$RUBY_SCRIPT" << 'RUBY_EOF'
#!/usr/bin/env ruby
# encoding: utf-8
require 'yaml'
require 'digest'

VERSION = "v5.3.0-oc-slim"

STATUS_LOG = "/tmp/clash_smart_status.log"
File.open(STATUS_LOG, 'w') { |f| f.puts "[#{VERSION}] start" }
def status(msg); File.open(STATUS_LOG, 'a') { |f| f.puts(msg) }; end

config_path   = ARGV[0]
override_path = ARGV[1]

config   = YAML.load_file(config_path, permitted_classes: [Symbol], aliases: true)
override = YAML.load_file(override_path, permitted_classes: [Symbol], aliases: true)

# ---------------------------------------------------------------
# Phase 1a: 过滤节点（去信息节点 + 去高倍率）
# ---------------------------------------------------------------
INFO_PATTERNS = [
  /官网/, /官方/, /网站/, /群组/, /TG|telegram/i,
  /到期/, /剩余/, /流量/, /重置/, /过期/, /recharge/i, /expire/i,
  /订阅/, /机场/, /客服/, /网址/, /邀请/, /注册/,
  /公告/, /通知/, /公众号/, /永久/, /套餐/, /续费/,
  /dns|DNS/, /IPLC|iplc/, /中转/,
  /^剩余|^到期|^流量|^官网/
]
SPEED_PATTERN = /(10x|20x|50x|100x|500x|1000x)/i

raw_proxies = (config["proxies"] || []).dup
filtered_proxies = raw_proxies.reject do |p|
  name = p["name"].to_s
  INFO_PATTERNS.any? { |pat| name.match?(pat) } || name.match?(SPEED_PATTERN)
end
status "[filter] raw=#{raw_proxies.size} filtered=#{filtered_proxies.size} removed=#{raw_proxies.size - filtered_proxies.size}"

# ---------------------------------------------------------------
# Phase 1b: 区域分类
# ---------------------------------------------------------------
REGIONS = {
  "HK"  => /香港|HK|Hong\s?Kong|🇭🇰/i,
  "TW"  => /台湾|台灣|TW|Taiwan|🇹🇼/i,
  "JP"  => /日本|JP|Japan|🇯🇵|Tokyo|Osaka/i,
  "KR"  => /韩国|韓國|KR|Korea|Korean|🇰🇷|Seoul/i,
  "SG"  => /新加坡|SG|Singapore|🇸🇬/i,
  "US"  => /美国|美國|US\b|USA|United\s?States|America|🇺🇸|Los\s?Angeles|New\s?York|Seattle|Silicon|San\s?Jose/i,
  "UK"  => /英国|英國|UK\b|GB\b|Britain|London|🇬🇧/i,
  "DE"  => /德国|德國|DE\b|Germany|Frankfurt|🇩🇪/i,
  "FR"  => /法国|法國|FR\b|France|Paris|🇫🇷/i,
  "NL"  => /荷兰|荷蘭|NL\b|Netherlands|Amsterdam|🇳🇱/i,
  "CH"  => /瑞士|CH\b|Switzerland|🇨🇭/i,
  "RU"  => /俄罗斯|俄羅斯|RU\b|Russia|Moscow|🇷🇺/i,
  "CA"  => /加拿大|CA\b|Canada|🇨🇦|Toronto|Vancouver/i,
  "MX"  => /墨西哥|MX\b|Mexico|🇲🇽/i,
  "BR"  => /巴西|BR\b|Brazil|🇧🇷|Sao\s?Paulo/i,
  "AR"  => /阿根廷|AR\b|Argentina|🇦🇷/i,
  "ZA"  => /南非|ZA\b|South\s?Africa|🇿🇦/i,
  "EG"  => /埃及|EG\b|Egypt|🇪🇬/i,
  "NG"  => /尼日利亚|NG\b|Nigeria|🇳🇬/i,
  "IN"  => /印度|IN\b|India|Mumbai|🇮🇳/i,
  "TH"  => /泰国|泰國|TH\b|Thailand|Bangkok|🇹🇭/i,
  "VN"  => /越南|VN\b|Vietnam|🇻🇳/i,
  "MY"  => /马来|馬來|MY\b|Malaysia|🇲🇾|Kuala/i,
  "ID"  => /印尼|印度尼西亚|ID\b|Indonesia|Jakarta|🇮🇩/i,
  "PH"  => /菲律宾|菲律賓|PH\b|Philippines|🇵🇭/i,
  "AU"  => /澳大利亚|澳洲|AU\b|Australia|Sydney|🇦🇺/i,
  "NZ"  => /新西兰|新西蘭|NZ\b|New\s?Zealand|🇳🇿/i,
  "TR"  => /土耳其|TR\b|Turkey|Istanbul|🇹🇷/i,
  "AE"  => /阿联酋|AE\b|UAE|Dubai|🇦🇪/i,
}

GROUP_MAP = {
  "HK"     => ["HK"],
  "TW"     => ["TW"],
  "JP_KR"  => ["JP", "KR"],
  "US"     => ["US"],
  "EU"     => ["UK", "DE", "FR", "NL", "CH", "RU"],
  "AM"     => ["CA", "MX", "BR", "AR"],
  "AF"     => ["ZA", "EG", "NG"],
  "APAC"   => ["SG", "IN", "TH", "VN", "MY", "ID", "PH", "AU", "NZ"],
}
GROUP_NAMES = {
  "HK"    => "🇭🇰 香港节点",
  "TW"    => "🇹🇼 台湾节点",
  "JP_KR" => "🇯🇵 日韩节点",
  "US"    => "🇺🇸 美国节点",
  "EU"    => "🇪🇺 欧洲节点",
  "AM"    => "🌎 美洲节点",
  "AF"    => "🌍 非洲节点",
  "APAC"  => "🌏 亚太节点",
}

classify = ->(name) {
  REGIONS.each { |code, re| return code if name.match?(re) }
  nil
}

buckets = Hash.new { |h, k| h[k] = [] }
filtered_proxies.each do |p|
  code = classify.call(p["name"].to_s)
  next if code.nil?
  GROUP_MAP.each do |gkey, codes|
    if codes.include?(code)
      buckets[gkey] << p["name"]
      break
    end
  end
end

buckets.each { |k, v| status "[region] #{GROUP_NAMES[k]}: #{v.size} nodes" }

# ---------------------------------------------------------------
# Phase 1c: 构建 9 个 Smart 组（全部 uselightgbm: true）
# ---------------------------------------------------------------
def make_smart_group(name, proxies_filter_mode:, explicit_proxies: nil)
  g = {
    "name"               => name,
    "type"               => "smart",
    "uselightgbm"        => true,
    "collectdata"        => false,
    "strategy"           => "sticky-sessions",
    "url"                => "https://cp.cloudflare.com/generate_204",
    "interval"           => 600,
    "tolerance"          => 150,
    "lazy"               => true,
  }
  if proxies_filter_mode == :include_all
    g["include-all-proxies"] = true
  elsif proxies_filter_mode == :explicit
    if explicit_proxies.nil? || explicit_proxies.empty?
      g["proxies"] = ["DIRECT"]
    else
      g["proxies"] = explicit_proxies
    end
  end
  g
end

smart_groups = []
# 🌍 全球节点：全部节点参与 LightGBM 评估
smart_groups << make_smart_group("🌍 全球节点", proxies_filter_mode: :include_all)

# 8 个区域组：仅该区域节点参与
%w[HK TW JP_KR US EU AM AF APAC].each do |gkey|
  gname = GROUP_NAMES[gkey]
  members = buckets[gkey].uniq
  smart_groups << make_smart_group(gname, proxies_filter_mode: :explicit, explicit_proxies: members)
end

# ---------------------------------------------------------------
# Phase 2: TLS 指纹注入
# ---------------------------------------------------------------
FP_CANDIDATES = %w[chrome firefox safari edge ios android random]
filtered_proxies.each do |p|
  t = p["type"].to_s
  if %w[vless vmess trojan hysteria hysteria2 tuic].include?(t)
    next if p["client-fingerprint"] && !p["client-fingerprint"].to_s.empty?
    digest = Digest::MD5.hexdigest(p["name"].to_s)
    idx = digest.to_i(16) % FP_CANDIDATES.size
    p["client-fingerprint"] = FP_CANDIDATES[idx]
  end
end

# ---------------------------------------------------------------
# Phase 3: 合并 override 到 config
# ---------------------------------------------------------------
# 替换节点数组（过滤后）
config["proxies"] = filtered_proxies

# 注入 hosts / DNS / sniffer / find-process-mode / 基础设置 / geodata-loader / geox-url / profile
%w[hosts dns sniffer find-process-mode unified-delay tcp-concurrent keep-alive-idle
   keep-alive-interval geodata-mode geodata-loader geo-auto-update
   geox-url profile].each do |key|
  config[key] = override[key] if override.key?(key)
end

# 清空并重建 proxy-groups：9 个 Smart 组在前，业务组在后
override_biz_groups = override["proxy-groups"] || []
config["proxy-groups"] = smart_groups + override_biz_groups

# 清空并重建 rule-providers 和 rules
config["rule-providers"] = override["rule-providers"] if override["rule-providers"]
config["rules"]          = override["rules"] if override["rules"]

# 清理机场自带的 proxy-providers（如果有）
config.delete("proxy-providers")

# ---------------------------------------------------------------
# 写回
# ---------------------------------------------------------------
File.open(config_path, 'w') { |f| f.write(config.to_yaml) }
status "[write] smart=#{smart_groups.size} biz=#{override_biz_groups.size} proxies=#{filtered_proxies.size} rules=#{config['rules'].size} providers=#{(config['rule-providers'] || {}).size}"
status "[#{VERSION}] done"
RUBY_EOF

# ============================================================================
# 执行 Ruby 脚本，读取状态日志，输出到 openclash 日志
# ============================================================================
LOG_OUT "Info" "[Clash-Smart] Executing Ruby processor..."

# 清理状态日志，准备接收 Ruby 输出
rm -f /tmp/clash_smart_status.log

# 执行 Ruby 处理脚本
ruby "$RUBY_SCRIPT" "$CONFIG_FILE" "$OVERRIDE_YAML" 2>> "$LOG_FILE"
RC=$?

# 将 Ruby 的状态日志逐行回显到 OpenClash 日志
if [ -f /tmp/clash_smart_status.log ]; then
  while IFS= read -r line; do
    LOG_OUT "Info" "[Clash-Smart] $line"
  done < /tmp/clash_smart_status.log
fi

if [ $RC -eq 0 ]; then
  LOG_OUT "Info" "[Clash-Smart] $VERSION_TAG overwrite completed successfully."
else
  LOG_OUT "Error" "[Clash-Smart] $VERSION_TAG overwrite FAILED with exit code $RC."
  LOG_OUT "Error" "[Clash-Smart] Check $LOG_FILE for Ruby traceback."
fi

# 清理临时文件
rm -f "$OVERRIDE_YAML" "$RUBY_SCRIPT" /tmp/clash_smart_status.log

exit $RC
