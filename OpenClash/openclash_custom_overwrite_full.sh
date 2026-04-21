#!/bin/bash
. /usr/share/openclash/log.sh

# ============================================================================
# Clash Smart v5.2.5-oc-full.1 — OpenClash 覆写脚本（与 Clash Party 主线同等规则量）
# ============================================================================
# 定位：对齐 Clash Party v5.2.4 JS 主线的 OpenClash 全量版本。
#       与同目录 openclash_custom_overwrite.sh（slim, 136 providers）互补：
#         - slim  面向 1–4GB 路由器 / 低 OOM 风险
#         - full  面向 4GB+ 路由器 / 需要与 Clash Party 桌面端一致的细粒度分流
# 架构：
#   • 9 Smart 区域组（uselightgbm: true + include-all-proxies: true）
#   • 28 业务策略组
#   • 387 rule-providers（全部 proxy: "🚫 受限网站"，对齐 Clash Party FIX#17-P0）
#   • ~977 条 rules
#   • DNS fake-ip + 嗅探（HTTP/TLS/QUIC）+ nameserver-policy 救援
#   • Ruby 阶段做：节点过滤 / 区域分类 / Smart 组生成 / TLS 指纹注入
# 基线：Clash Party v5.2.4（唯一主线）── 任何规则/组/DNS 改动必须先改 Clash Party JS，
#       再同步到此文件。参见仓库根目录 CLAUDE.md / AGENTS.md。
# 变更历史：见 `OpenClash/CHANGELOG.md`（Full 部分）。
# ============================================================================



VERSION_TAG="v5.2.5-oc-full.1"
CONFIG_FILE="$1"
LOG_FILE="/tmp/openclash.log"

LOG_OUT "Info" "[Clash-Smart] $VERSION_TAG overwrite starting..."
LOG_OUT "Info" "[Clash-Smart] Processing: $CONFIG_FILE"
LOG_OUT "Info" "[Clash-Smart] Full-rule build (Clash Party parity)"

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

# ============================================================================
# OVERRIDE YAML (续) — Rule-Providers：387 项，对齐 Clash Party v5.2.2 主线
# 策略：
#   ✓ 与 Clash Party 主线（BIZ.GFW = '🚫 受限网站'）一致：所有 provider 都走 GFW 组
#     下载，在中国走代理、在印尼走 DIRECT，规避 jsdelivr/GitHub 冷启动死锁。
#   ✓ 9 Smart 区域组 + 28 业务组 + 387 rule-providers + ~977 条规则
#   ✓ Smart 组统一 uselightgbm: true + include-all-proxies: true
#   ✓ TLS 指纹注入（Ruby 阶段 _simple_hash 分配）
# ============================================================================
cat >> "$OVERRIDE_YAML" << 'OVERRIDE_EOF'
rule-providers:
  '56':
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/56/56.yaml
    path: "./ruleset/bm7-56.yaml"
    interval: 87883
    proxy: "\U0001F6AB 受限网站"
  anti-ad:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@mihomo-ruleset/ads.mrs
    path: "./ruleset/anti-ad.mrs"
    interval: 85541
    proxy: "\U0001F6AB 受限网站"
  openai:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/openai.mrs
    path: "./ruleset/meta-openai.mrs"
    interval: 85525
    proxy: "\U0001F6AB 受限网站"
  claude:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Claude/Claude.yaml
    path: "./ruleset/bm7-Claude.yaml"
    interval: 85554
    proxy: "\U0001F6AB 受限网站"
  gemini:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Gemini/Gemini.yaml
    path: "./ruleset/bm7-Gemini.yaml"
    interval: 85567
    proxy: "\U0001F6AB 受限网站"
  copilot:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Copilot/Copilot.yaml
    path: "./ruleset/bm7-Copilot.yaml"
    interval: 85577
    proxy: "\U0001F6AB 受限网站"
  cryptocurrency:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Cryptocurrency/Cryptocurrency.yaml
    path: "./ruleset/bm7-Cryptocurrency.yaml"
    interval: 85599
    proxy: "\U0001F6AB 受限网站"
  telegram:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/telegram.mrs
    path: "./ruleset/meta-telegram.mrs"
    interval: 85629
    proxy: "\U0001F6AB 受限网站"
  telegram-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/telegram.mrs
    path: "./ruleset/meta-ip-telegram.mrs"
    interval: 85650
    proxy: "\U0001F6AB 受限网站"
  discord:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Discord/Discord.yaml
    path: "./ruleset/bm7-Discord.yaml"
    interval: 85639
    proxy: "\U0001F6AB 受限网站"
  line:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Line/Line.yaml
    path: "./ruleset/bm7-Line.yaml"
    interval: 85646
    proxy: "\U0001F6AB 受限网站"
  whatsapp:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Whatsapp/Whatsapp.yaml
    path: "./ruleset/bm7-Whatsapp.yaml"
    interval: 85694
    proxy: "\U0001F6AB 受限网站"
  kakaotalk:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/KakaoTalk/KakaoTalk.yaml
    path: "./ruleset/bm7-KakaoTalk.yaml"
    interval: 85670
    proxy: "\U0001F6AB 受限网站"
  twitter:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/twitter.mrs
    path: "./ruleset/meta-twitter.mrs"
    interval: 85737
    proxy: "\U0001F6AB 受限网站"
  twitter-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/twitter.mrs
    path: "./ruleset/meta-ip-twitter.mrs"
    interval: 85729
    proxy: "\U0001F6AB 受限网站"
  tiktok:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/tiktok.mrs
    path: "./ruleset/meta-tiktok.mrs"
    interval: 85713
    proxy: "\U0001F6AB 受限网站"
  reddit:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Reddit/Reddit.yaml
    path: "./ruleset/bm7-Reddit.yaml"
    interval: 85767
    proxy: "\U0001F6AB 受限网站"
  facebook:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Facebook/Facebook.yaml
    path: "./ruleset/bm7-Facebook.yaml"
    interval: 85762
    proxy: "\U0001F6AB 受限网站"
  instagram:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Instagram/Instagram.yaml
    path: "./ruleset/bm7-Instagram.yaml"
    interval: 85796
    proxy: "\U0001F6AB 受限网站"
  snapchat:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/snap.mrs
    path: "./ruleset/meta-snap.mrs"
    interval: 85783
    proxy: "\U0001F6AB 受限网站"
  pinterest:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Pinterest/Pinterest.yaml
    path: "./ruleset/bm7-Pinterest.yaml"
    interval: 85816
    proxy: "\U0001F6AB 受限网站"
  linkedin:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/LinkedIn/LinkedIn.yaml
    path: "./ruleset/bm7-LinkedIn.yaml"
    interval: 85807
    proxy: "\U0001F6AB 受限网站"
  facebook-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/facebook.mrs
    path: "./ruleset/meta-ip-facebook.mrs"
    interval: 85839
    proxy: "\U0001F6AB 受限网站"
  slack:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Slack/Slack.yaml
    path: "./ruleset/bm7-Slack.yaml"
    interval: 85885
    proxy: "\U0001F6AB 受限网站"
  zoom:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/Providers/Ruleset/Zoom.yaml
    path: "./ruleset/acl4ssr-Zoom.yaml"
    interval: 85891
    proxy: "\U0001F6AB 受限网站"
  teams:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Teams/Teams.yaml
    path: "./ruleset/bm7-Teams.yaml"
    interval: 85902
    proxy: "\U0001F6AB 受限网站"
  google:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/google.mrs
    path: "./ruleset/meta-google.mrs"
    interval: 85892
    proxy: "\U0001F6AB 受限网站"
  google-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/google.mrs
    path: "./ruleset/meta-ip-google.mrs"
    interval: 85946
    proxy: "\U0001F6AB 受限网站"
  bing:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Bing/Bing.yaml
    path: "./ruleset/bm7-Bing.yaml"
    interval: 85933
    proxy: "\U0001F6AB 受限网站"
  googlesearch:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GoogleSearch/GoogleSearch.yaml
    path: "./ruleset/bm7-GoogleSearch.yaml"
    interval: 85953
    proxy: "\U0001F6AB 受限网站"
  youtube:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/youtube.mrs
    path: "./ruleset/meta-youtube.mrs"
    interval: 85983
    proxy: "\U0001F6AB 受限网站"
  netflix:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/netflix.mrs
    path: "./ruleset/meta-netflix.mrs"
    interval: 85965
    proxy: "\U0001F6AB 受限网站"
  netflix-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/netflix.mrs
    path: "./ruleset/meta-ip-netflix.mrs"
    interval: 86006
    proxy: "\U0001F6AB 受限网站"
  spotify:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/spotify.mrs
    path: "./ruleset/meta-spotify.mrs"
    interval: 86035
    proxy: "\U0001F6AB 受限网站"
  disney:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Disney/Disney.yaml
    path: "./ruleset/bm7-Disney.yaml"
    interval: 86021
    proxy: "\U0001F6AB 受限网站"
  hbo:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/HBO/HBO.yaml
    path: "./ruleset/bm7-HBO.yaml"
    interval: 86044
    proxy: "\U0001F6AB 受限网站"
  primevideo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/PrimeVideo/PrimeVideo.yaml
    path: "./ruleset/bm7-PrimeVideo.yaml"
    interval: 86080
    proxy: "\U0001F6AB 受限网站"
  hulu:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Hulu/Hulu.yaml
    path: "./ruleset/bm7-Hulu.yaml"
    interval: 86063
    proxy: "\U0001F6AB 受限网站"
  paramount:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/ParamountPlus/ParamountPlus.yaml
    path: "./ruleset/bm7-ParamountPlus.yaml"
    interval: 86100
    proxy: "\U0001F6AB 受限网站"
  amazon:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Amazon/Amazon.yaml
    path: "./ruleset/bm7-Amazon.yaml"
    interval: 86084
    proxy: "\U0001F6AB 受限网站"
  peacock:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Peacock/Peacock.yaml
    path: "./ruleset/bm7-Peacock.yaml"
    interval: 86095
    proxy: "\U0001F6AB 受限网站"
  twitch:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Twitch/Twitch.yaml
    path: "./ruleset/bm7-Twitch.yaml"
    interval: 86159
    proxy: "\U0001F6AB 受限网站"
  bahamut:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/bahamut.mrs
    path: "./ruleset/meta-bahamut.mrs"
    interval: 86129
    proxy: "\U0001F6AB 受限网站"
  kktv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/KKTV/KKTV.yaml
    path: "./ruleset/bm7-KKTV.yaml"
    interval: 86166
    proxy: "\U0001F6AB 受限网站"
  abema:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/abema.mrs
    path: "./ruleset/meta-abema.mrs"
    interval: 86199
    proxy: "\U0001F6AB 受限网站"
  dazn:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/DAZN/DAZN.yaml
    path: "./ruleset/bm7-DAZN.yaml"
    interval: 86160
    proxy: "\U0001F6AB 受限网站"
  bbc:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/bbc.mrs
    path: "./ruleset/meta-bbc.mrs"
    interval: 86209
    proxy: "\U0001F6AB 受限网站"
  steam:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Steam/Steam.yaml
    path: "./ruleset/bm7-Steam.yaml"
    interval: 86210
    proxy: "\U0001F6AB 受限网站"
  epic:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Epic/Epic.yaml
    path: "./ruleset/bm7-Epic.yaml"
    interval: 86251
    proxy: "\U0001F6AB 受限网站"
  playstation:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/PlayStation/PlayStation.yaml
    path: "./ruleset/bm7-PlayStation.yaml"
    interval: 86220
    proxy: "\U0001F6AB 受限网站"
  nintendo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Nintendo/Nintendo.yaml
    path: "./ruleset/bm7-Nintendo.yaml"
    interval: 86285
    proxy: "\U0001F6AB 受限网站"
  xbox:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Xbox/Xbox.yaml
    path: "./ruleset/bm7-Xbox.yaml"
    interval: 86280
    proxy: "\U0001F6AB 受限网站"
  ea:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/EA/EA.yaml
    path: "./ruleset/bm7-EA.yaml"
    interval: 86272
    proxy: "\U0001F6AB 受限网站"
  blizzard:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Blizzard/Blizzard.yaml
    path: "./ruleset/bm7-Blizzard.yaml"
    interval: 86301
    proxy: "\U0001F6AB 受限网站"
  microsoft:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/microsoft.mrs
    path: "./ruleset/meta-microsoft.mrs"
    interval: 86345
    proxy: "\U0001F6AB 受限网站"
  onedrive:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/onedrive.mrs
    path: "./ruleset/meta-onedrive.mrs"
    interval: 86350
    proxy: "\U0001F6AB 受限网站"
  apple:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/apple.mrs
    path: "./ruleset/meta-apple.mrs"
    interval: 86335
    proxy: "\U0001F6AB 受限网站"
  icloud:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/icloud.mrs
    path: "./ruleset/meta-icloud.mrs"
    interval: 86358
    proxy: "\U0001F6AB 受限网站"
  applemusic:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AppleMusic/AppleMusic.yaml
    path: "./ruleset/bm7-AppleMusic.yaml"
    interval: 86391
    proxy: "\U0001F6AB 受限网站"
  github:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/github.mrs
    path: "./ruleset/meta-github.mrs"
    interval: 86407
    proxy: "\U0001F6AB 受限网站"
  docker:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Docker/Docker.yaml
    path: "./ruleset/bm7-Docker.yaml"
    interval: 86426
    proxy: "\U0001F6AB 受限网站"
  gitlab:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GitLab/GitLab.yaml
    path: "./ruleset/bm7-GitLab.yaml"
    interval: 86450
    proxy: "\U0001F6AB 受限网站"
  paypal:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/PayPal/PayPal.yaml
    path: "./ruleset/bm7-PayPal.yaml"
    interval: 86454
    proxy: "\U0001F6AB 受限网站"
  cloudflare-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/cloudflare.mrs
    path: "./ruleset/meta-ip-cloudflare.mrs"
    interval: 86468
    proxy: "\U0001F6AB 受限网站"
  cloudfront-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/cloudfront.mrs
    path: "./ruleset/meta-ip-cloudfront.mrs"
    interval: 86501
    proxy: "\U0001F6AB 受限网站"
  fastly-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/fastly.mrs
    path: "./ruleset/meta-ip-fastly.mrs"
    interval: 86471
    proxy: "\U0001F6AB 受限网站"
  systemota:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/SystemOTA/SystemOTA.yaml
    path: "./ruleset/bm7-SystemOTA.yaml"
    interval: 86498
    proxy: "\U0001F6AB 受限网站"
  viu:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/ViuTV/ViuTV.yaml
    path: "./ruleset/bm7-ViuTV.yaml"
    interval: 86503
    proxy: "\U0001F6AB 受限网站"
  bilibili:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/bilibili.mrs
    path: "./ruleset/meta-bilibili.mrs"
    interval: 86540
    proxy: "\U0001F6AB 受限网站"
  biliintl:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/biliintl.mrs
    path: "./ruleset/meta-biliintl.mrs"
    interval: 86565
    proxy: "\U0001F6AB 受限网站"
  cn:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/cn.mrs
    path: "./ruleset/meta-cn.mrs"
    interval: 86553
    proxy: "\U0001F6AB 受限网站"
  cn-ip:
    type: http
    behavior: ipcidr
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/cn.mrs
    path: "./ruleset/meta-ip-cn.mrs"
    interval: 86573
    proxy: "\U0001F6AB 受限网站"
  proxy:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/geolocation-!cn.mrs
    path: "./ruleset/meta-geolocation-!cn.mrs"
    interval: 86624
    proxy: "\U0001F6AB 受限网站"
  advertising:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Advertising/Advertising.yaml
    path: "./ruleset/bm7-Advertising.yaml"
    interval: 86609
    proxy: "\U0001F6AB 受限网站"
  advertisingmitv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AdvertisingMiTV/AdvertisingMiTV.yaml
    path: "./ruleset/bm7-AdvertisingMiTV.yaml"
    interval: 86596
    proxy: "\U0001F6AB 受限网站"
  adobeactivation:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AdobeActivation/AdobeActivation.yaml
    path: "./ruleset/bm7-AdobeActivation.yaml"
    interval: 86648
    proxy: "\U0001F6AB 受限网站"
  blockhttpdns:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/BlockHttpDNS/BlockHttpDNS.yaml
    path: "./ruleset/bm7-BlockHttpDNS.yaml"
    interval: 86641
    proxy: "\U0001F6AB 受限网站"
  domob:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Domob/Domob.yaml
    path: "./ruleset/bm7-Domob.yaml"
    interval: 86662
    proxy: "\U0001F6AB 受限网站"
  hijacking:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Hijacking/Hijacking.yaml
    path: "./ruleset/bm7-Hijacking.yaml"
    interval: 86685
    proxy: "\U0001F6AB 受限网站"
  jiguangtuisong:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/JiGuangTuiSong/JiGuangTuiSong.yaml
    path: "./ruleset/bm7-JiGuangTuiSong.yaml"
    interval: 86712
    proxy: "\U0001F6AB 受限网站"
  marketing:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Marketing/Marketing.yaml
    path: "./ruleset/bm7-Marketing.yaml"
    interval: 86688
    proxy: "\U0001F6AB 受限网站"
  miuiprivacy:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/MIUIPrivacy/MIUIPrivacy.yaml
    path: "./ruleset/bm7-MIUIPrivacy.yaml"
    interval: 86754
    proxy: "\U0001F6AB 受限网站"
  privacy:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Privacy/Privacy.yaml
    path: "./ruleset/bm7-Privacy.yaml"
    interval: 86764
    proxy: "\U0001F6AB 受限网站"
  youmengchuangxiang:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/YouMengChuangXiang/YouMengChuangXiang.yaml
    path: "./ruleset/bm7-YouMengChuangXiang.yaml"
    interval: 86765
    proxy: "\U0001F6AB 受限网站"
  civitai:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Civitai/Civitai.yaml
    path: "./ruleset/bm7-Civitai.yaml"
    interval: 86763
    proxy: "\U0001F6AB 受限网站"
  binance:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Binance/Binance.yaml
    path: "./ruleset/bm7-Binance.yaml"
    interval: 86814
    proxy: "\U0001F6AB 受限网站"
  stripe:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Stripe/Stripe.yaml
    path: "./ruleset/bm7-Stripe.yaml"
    interval: 86820
    proxy: "\U0001F6AB 受限网站"
  visa:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/VISA/VISA.yaml
    path: "./ruleset/bm7-VISA.yaml"
    interval: 86847
    proxy: "\U0001F6AB 受限网站"
  tigerfintech:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TigerFintech/TigerFintech.yaml
    path: "./ruleset/bm7-TigerFintech.yaml"
    interval: 86851
    proxy: "\U0001F6AB 受限网站"
  mail:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Mail/Mail.yaml
    path: "./ruleset/bm7-Mail.yaml"
    interval: 86856
    proxy: "\U0001F6AB 受限网站"
  mailru:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Mailru/Mailru.yaml
    path: "./ruleset/bm7-Mailru.yaml"
    interval: 86885
    proxy: "\U0001F6AB 受限网站"
  protonmail:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Protonmail/Protonmail.yaml
    path: "./ruleset/bm7-Protonmail.yaml"
    interval: 86885
    proxy: "\U0001F6AB 受限网站"
  spark:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Spark/Spark.yaml
    path: "./ruleset/bm7-Spark.yaml"
    interval: 86900
    proxy: "\U0001F6AB 受限网站"
  telegramnl:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TelegramNL/TelegramNL.yaml
    path: "./ruleset/bm7-TelegramNL.yaml"
    interval: 86881
    proxy: "\U0001F6AB 受限网站"
  telegramsg:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TelegramSG/TelegramSG.yaml
    path: "./ruleset/bm7-TelegramSG.yaml"
    interval: 86921
    proxy: "\U0001F6AB 受限网站"
  telegramus:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TelegramUS/TelegramUS.yaml
    path: "./ruleset/bm7-TelegramUS.yaml"
    interval: 86927
    proxy: "\U0001F6AB 受限网站"
  zalo:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Zalo/Zalo.yaml
    path: "./ruleset/bm7-Zalo.yaml"
    interval: 86962
    proxy: "\U0001F6AB 受限网站"
  googlevoice:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GoogleVoice/GoogleVoice.yaml
    path: "./ruleset/bm7-GoogleVoice.yaml"
    interval: 86945
    proxy: "\U0001F6AB 受限网站"
  italkbb:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/iTalkBB/iTalkBB.yaml
    path: "./ruleset/bm7-iTalkBB.yaml"
    interval: 86968
    proxy: "\U0001F6AB 受限网站"
  tumblr:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Tumblr/Tumblr.yaml
    path: "./ruleset/bm7-Tumblr.yaml"
    interval: 86988
    proxy: "\U0001F6AB 受限网站"
  clubhouse:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Clubhouse/Clubhouse.yaml
    path: "./ruleset/bm7-Clubhouse.yaml"
    interval: 87026
    proxy: "\U0001F6AB 受限网站"
  clubhouseip:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/ClubhouseIP/ClubhouseIP.yaml
    path: "./ruleset/bm7-ClubhouseIP.yaml"
    interval: 87024
    proxy: "\U0001F6AB 受限网站"
  pixiv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Pixiv/Pixiv.yaml
    path: "./ruleset/bm7-Pixiv.yaml"
    interval: 87052
    proxy: "\U0001F6AB 受限网站"
  truthsocial:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TruthSocial/TruthSocial.yaml
    path: "./ruleset/bm7-TruthSocial.yaml"
    interval: 87054
    proxy: "\U0001F6AB 受限网站"
  vk:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/VK/VK.yaml
    path: "./ruleset/bm7-VK.yaml"
    interval: 87091
    proxy: "\U0001F6AB 受限网站"
  blued:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Blued/Blued.yaml
    path: "./ruleset/bm7-Blued.yaml"
    interval: 87077
    proxy: "\U0001F6AB 受限网站"
  disqus:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Disqus/Disqus.yaml
    path: "./ruleset/bm7-Disqus.yaml"
    interval: 87078
    proxy: "\U0001F6AB 受限网站"
  imgur:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Imgur/Imgur.yaml
    path: "./ruleset/bm7-Imgur.yaml"
    interval: 87115
    proxy: "\U0001F6AB 受限网站"
  pixnet:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Pixnet/Pixnet.yaml
    path: "./ruleset/bm7-Pixnet.yaml"
    interval: 87111
    proxy: "\U0001F6AB 受限网站"
  atlassian:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Atlassian/Atlassian.yaml
    path: "./ruleset/bm7-Atlassian.yaml"
    interval: 87174
    proxy: "\U0001F6AB 受限网站"
  notion:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Notion/Notion.yaml
    path: "./ruleset/bm7-Notion.yaml"
    interval: 87150
    proxy: "\U0001F6AB 受限网站"
  teamviewer:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TeamViewer/TeamViewer.yaml
    path: "./ruleset/bm7-TeamViewer.yaml"
    interval: 87191
    proxy: "\U0001F6AB 受限网站"
  zoho:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Zoho/Zoho.yaml
    path: "./ruleset/bm7-Zoho.yaml"
    interval: 87223
    proxy: "\U0001F6AB 受限网站"
  salesforce:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Salesforce/Salesforce.yaml
    path: "./ruleset/bm7-Salesforce.yaml"
    interval: 87231
    proxy: "\U0001F6AB 受限网站"
  zendesk:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Zendesk/Zendesk.yaml
    path: "./ruleset/bm7-Zendesk.yaml"
    interval: 87221
    proxy: "\U0001F6AB 受限网站"
  intercom:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Intercom/Intercom.yaml
    path: "./ruleset/bm7-Intercom.yaml"
    interval: 87218
    proxy: "\U0001F6AB 受限网站"
  remotedesktop:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/RemoteDesktop/RemoteDesktop.yaml
    path: "./ruleset/bm7-RemoteDesktop.yaml"
    interval: 87253
    proxy: "\U0001F6AB 受限网站"
  iqiyi:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/iQIYI/iQIYI.yaml
    path: "./ruleset/bm7-iQIYI.yaml"
    interval: 87261
    proxy: "\U0001F6AB 受限网站"
  youku:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Youku/Youku.yaml
    path: "./ruleset/bm7-Youku.yaml"
    interval: 87268
    proxy: "\U0001F6AB 受限网站"
  tencentvideo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TencentVideo/TencentVideo.yaml
    path: "./ruleset/bm7-TencentVideo.yaml"
    interval: 87270
    proxy: "\U0001F6AB 受限网站"
  douyin:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/DouYin/DouYin.yaml
    path: "./ruleset/bm7-DouYin.yaml"
    interval: 87313
    proxy: "\U0001F6AB 受限网站"
  bytedance:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/ByteDance/ByteDance.yaml
    path: "./ruleset/bm7-ByteDance.yaml"
    interval: 87336
    proxy: "\U0001F6AB 受限网站"
  kuaishou:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/KuaiShou/KuaiShou.yaml
    path: "./ruleset/bm7-KuaiShou.yaml"
    interval: 87339
    proxy: "\U0001F6AB 受限网站"
  weibo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Weibo/Weibo.yaml
    path: "./ruleset/bm7-Weibo.yaml"
    interval: 87384
    proxy: "\U0001F6AB 受限网站"
  xiaohongshu:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/XiaoHongShu/XiaoHongShu.yaml
    path: "./ruleset/bm7-XiaoHongShu.yaml"
    interval: 87357
    proxy: "\U0001F6AB 受限网站"
  neteasemusic:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/NetEaseMusic/NetEaseMusic.yaml
    path: "./ruleset/bm7-NetEaseMusic.yaml"
    interval: 87376
    proxy: "\U0001F6AB 受限网站"
  kugoukuwo:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/KugouKuwo/KugouKuwo.yaml
    path: "./ruleset/bm7-KugouKuwo.yaml"
    interval: 87413
    proxy: "\U0001F6AB 受限网站"
  sohu:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Sohu/Sohu.yaml
    path: "./ruleset/bm7-Sohu.yaml"
    interval: 87402
    proxy: "\U0001F6AB 受限网站"
  acfun:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AcFun/AcFun.yaml
    path: "./ruleset/bm7-AcFun.yaml"
    interval: 87455
    proxy: "\U0001F6AB 受限网站"
  douyu:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Douyu/Douyu.yaml
    path: "./ruleset/bm7-Douyu.yaml"
    interval: 87422
    proxy: "\U0001F6AB 受限网站"
  huya:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/HuYa/HuYa.yaml
    path: "./ruleset/bm7-HuYa.yaml"
    interval: 87436
    proxy: "\U0001F6AB 受限网站"
  himalaya:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Himalaya/Himalaya.yaml
    path: "./ruleset/bm7-Himalaya.yaml"
    interval: 87453
    proxy: "\U0001F6AB 受限网站"
  cctv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/CCTV/CCTV.yaml
    path: "./ruleset/bm7-CCTV.yaml"
    interval: 87522
    proxy: "\U0001F6AB 受限网站"
  hunantv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/HunanTV/HunanTV.yaml
    path: "./ruleset/bm7-HunanTV.yaml"
    interval: 87509
    proxy: "\U0001F6AB 受限网站"
  pptv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/PPTV/PPTV.yaml
    path: "./ruleset/bm7-PPTV.yaml"
    interval: 87512
    proxy: "\U0001F6AB 受限网站"
  funshion:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Funshion/Funshion.yaml
    path: "./ruleset/bm7-Funshion.yaml"
    interval: 87568
    proxy: "\U0001F6AB 受限网站"
  letv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/LeTV/LeTV.yaml
    path: "./ruleset/bm7-LeTV.yaml"
    interval: 87574
    proxy: "\U0001F6AB 受限网站"
  taihemusic:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TaiheMusic/TaiheMusic.yaml
    path: "./ruleset/bm7-TaiheMusic.yaml"
    interval: 87581
    proxy: "\U0001F6AB 受限网站"
  kukemusic:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/KuKeMusic/KuKeMusic.yaml
    path: "./ruleset/bm7-KuKeMusic.yaml"
    interval: 87556
    proxy: "\U0001F6AB 受限网站"
  hibymusic:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/HibyMusic/HibyMusic.yaml
    path: "./ruleset/bm7-HibyMusic.yaml"
    interval: 87601
    proxy: "\U0001F6AB 受限网站"
  miwu:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/MiWu/MiWu.yaml
    path: "./ruleset/bm7-MiWu.yaml"
    interval: 87644
    proxy: "\U0001F6AB 受限网站"
  migu:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Migu/Migu.yaml
    path: "./ruleset/bm7-Migu.yaml"
    interval: 87633
    proxy: "\U0001F6AB 受限网站"
  iptvmainland:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/IPTVMainland/IPTVMainland.yaml
    path: "./ruleset/bm7-IPTVMainland.yaml"
    interval: 87649
    proxy: "\U0001F6AB 受限网站"
  iptvother:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/IPTVOther/IPTVOther.yaml
    path: "./ruleset/bm7-IPTVOther.yaml"
    interval: 87654
    proxy: "\U0001F6AB 受限网站"
  cibn:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/CIBN/CIBN.yaml
    path: "./ruleset/bm7-CIBN.yaml"
    interval: 87672
    proxy: "\U0001F6AB 受限网站"
  bestv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/BesTV/BesTV.yaml
    path: "./ruleset/bm7-BesTV.yaml"
    interval: 87674
    proxy: "\U0001F6AB 受限网站"
  huashutv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/HuaShuTV/HuaShuTV.yaml
    path: "./ruleset/bm7-HuaShuTV.yaml"
    interval: 87677
    proxy: "\U0001F6AB 受限网站"
  smg:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/SMG/SMG.yaml
    path: "./ruleset/bm7-SMG.yaml"
    interval: 87720
    proxy: "\U0001F6AB 受限网站"
  hwtv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/HWTV/HWTV.yaml
    path: "./ruleset/bm7-HWTV.yaml"
    interval: 87718
    proxy: "\U0001F6AB 受限网站"
  nivodtv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/NivodTV/NivodTV.yaml
    path: "./ruleset/bm7-NivodTV.yaml"
    interval: 87752
    proxy: "\U0001F6AB 受限网站"
  olevod:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Olevod/Olevod.yaml
    path: "./ruleset/bm7-Olevod.yaml"
    interval: 87761
    proxy: "\U0001F6AB 受限网站"
  dandanzan:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/DanDanZan/DanDanZan.yaml
    path: "./ruleset/bm7-DanDanZan.yaml"
    interval: 87769
    proxy: "\U0001F6AB 受限网站"
  dandanplay:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Dandanplay/Dandanplay.yaml
    path: "./ruleset/bm7-Dandanplay.yaml"
    interval: 87821
    proxy: "\U0001F6AB 受限网站"
  tiantiankankan:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TianTianKanKan/TianTianKanKan.yaml
    path: "./ruleset/bm7-TianTianKanKan.yaml"
    interval: 87835
    proxy: "\U0001F6AB 受限网站"
  yizhibo:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/YiZhiBo/YiZhiBo.yaml
    path: "./ruleset/bm7-YiZhiBo.yaml"
    interval: 87800
    proxy: "\U0001F6AB 受限网站"
  ku6:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Ku6/Ku6.yaml
    path: "./ruleset/bm7-Ku6.yaml"
    interval: 87828
    proxy: "\U0001F6AB 受限网站"
  cetv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/CETV/CETV.yaml
    path: "./ruleset/bm7-CETV.yaml"
    interval: 87865
    proxy: "\U0001F6AB 受限网站"
  yyets:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/YYeTs/YYeTs.yaml
    path: "./ruleset/bm7-YYeTs.yaml"
    interval: 87909
    proxy: "\U0001F6AB 受限网站"
  asianmedia:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AsianMedia/AsianMedia.yaml
    path: "./ruleset/bm7-AsianMedia.yaml"
    interval: 87888
    proxy: "\U0001F6AB 受限网站"
  iqiyiintl:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/iQIYIIntl/iQIYIIntl.yaml
    path: "./ruleset/bm7-iQIYIIntl.yaml"
    interval: 87910
    proxy: "\U0001F6AB 受限网站"
  joox:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/JOOX/JOOX.yaml
    path: "./ruleset/bm7-JOOX.yaml"
    interval: 87939
    proxy: "\U0001F6AB 受限网站"
  mewatch:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/MeWatch/MeWatch.yaml
    path: "./ruleset/bm7-MeWatch.yaml"
    interval: 87930
    proxy: "\U0001F6AB 受限网站"
  viki:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Viki/Viki.yaml
    path: "./ruleset/bm7-Viki.yaml"
    interval: 87961
    proxy: "\U0001F6AB 受限网站"
  wetv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/WeTV/WeTV.yaml
    path: "./ruleset/bm7-WeTV.yaml"
    interval: 87968
    proxy: "\U0001F6AB 受限网站"
  zee:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Zee/Zee.yaml
    path: "./ruleset/bm7-Zee.yaml"
    interval: 88013
    proxy: "\U0001F6AB 受限网站"
  cbs:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/CBS/CBS.yaml
    path: "./ruleset/bm7-CBS.yaml"
    interval: 87975
    proxy: "\U0001F6AB 受限网站"
  nbc:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/NBC/NBC.yaml
    path: "./ruleset/bm7-NBC.yaml"
    interval: 87990
    proxy: "\U0001F6AB 受限网站"
  pbs:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/PBS/PBS.yaml
    path: "./ruleset/bm7-PBS.yaml"
    interval: 88022
    proxy: "\U0001F6AB 受限网站"
  attwatchtv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/ATTWatchTV/ATTWatchTV.yaml
    path: "./ruleset/bm7-ATTWatchTV.yaml"
    interval: 88074
    proxy: "\U0001F6AB 受限网站"
  fox:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Fox/Fox.yaml
    path: "./ruleset/bm7-Fox.yaml"
    interval: 88081
    proxy: "\U0001F6AB 受限网站"
  fubotv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/FuboTV/FuboTV.yaml
    path: "./ruleset/bm7-FuboTV.yaml"
    interval: 88100
    proxy: "\U0001F6AB 受限网站"
  sling:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Sling/Sling.yaml
    path: "./ruleset/bm7-Sling.yaml"
    interval: 88103
    proxy: "\U0001F6AB 受限网站"
  soundcloud:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/SoundCloud/SoundCloud.yaml
    path: "./ruleset/bm7-SoundCloud.yaml"
    interval: 88085
    proxy: "\U0001F6AB 受限网站"
  pandora:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Pandora/Pandora.yaml
    path: "./ruleset/bm7-Pandora.yaml"
    interval: 88131
    proxy: "\U0001F6AB 受限网站"
  pandoratv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/PandoraTV/PandoraTV.yaml
    path: "./ruleset/bm7-PandoraTV.yaml"
    interval: 88163
    proxy: "\U0001F6AB 受限网站"
  tidal:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TIDAL/TIDAL.yaml
    path: "./ruleset/bm7-TIDAL.yaml"
    interval: 88128
    proxy: "\U0001F6AB 受限网站"
  vimeo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Vimeo/Vimeo.yaml
    path: "./ruleset/bm7-Vimeo.yaml"
    interval: 88156
    proxy: "\U0001F6AB 受限网站"
  dailymotion:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Dailymotion/Dailymotion.yaml
    path: "./ruleset/bm7-Dailymotion.yaml"
    interval: 88176
    proxy: "\U0001F6AB 受限网站"
  deezer:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Deezer/Deezer.yaml
    path: "./ruleset/bm7-Deezer.yaml"
    interval: 88197
    proxy: "\U0001F6AB 受限网站"
  discoveryplus:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/DiscoveryPlus/DiscoveryPlus.yaml
    path: "./ruleset/bm7-DiscoveryPlus.yaml"
    interval: 88188
    proxy: "\U0001F6AB 受限网站"
  overcast:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Overcast/Overcast.yaml
    path: "./ruleset/bm7-Overcast.yaml"
    interval: 88212
    proxy: "\U0001F6AB 受限网站"
  americasvoice:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Americasvoice/Americasvoice.yaml
    path: "./ruleset/bm7-Americasvoice.yaml"
    interval: 88217
    proxy: "\U0001F6AB 受限网站"
  cake:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Cake/Cake.yaml
    path: "./ruleset/bm7-Cake.yaml"
    interval: 88236
    proxy: "\U0001F6AB 受限网站"
  dood:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Dood/Dood.yaml
    path: "./ruleset/bm7-Dood.yaml"
    interval: 88257
    proxy: "\U0001F6AB 受限网站"
  ehgallery:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/EHGallery/EHGallery.yaml
    path: "./ruleset/bm7-EHGallery.yaml"
    interval: 88314
    proxy: "\U0001F6AB 受限网站"
  lastfm:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/LastFM/LastFM.yaml
    path: "./ruleset/bm7-LastFM.yaml"
    interval: 88285
    proxy: "\U0001F6AB 受限网站"
  emby:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Emby/Emby.yaml
    path: "./ruleset/bm7-Emby.yaml"
    interval: 88334
    proxy: "\U0001F6AB 受限网站"
  mytvsuper:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/myTVSUPER/myTVSUPER.yaml
    path: "./ruleset/bm7-myTVSUPER.yaml"
    interval: 88346
    proxy: "\U0001F6AB 受限网站"
  tvb:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TVB/TVB.yaml
    path: "./ruleset/bm7-TVB.yaml"
    interval: 88367
    proxy: "\U0001F6AB 受限网站"
  encoretvb:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/EncoreTVB/EncoreTVB.yaml
    path: "./ruleset/bm7-EncoreTVB.yaml"
    interval: 88375
    proxy: "\U0001F6AB 受限网站"
  nowe:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/NowE/NowE.yaml
    path: "./ruleset/bm7-NowE.yaml"
    interval: 88386
    proxy: "\U0001F6AB 受限网站"
  rthk:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/RTHK/RTHK.yaml
    path: "./ruleset/bm7-RTHK.yaml"
    interval: 88373
    proxy: "\U0001F6AB 受限网站"
  cabletv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/CableTV/CableTV.yaml
    path: "./ruleset/bm7-CableTV.yaml"
    interval: 88410
    proxy: "\U0001F6AB 受限网站"
  moov:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/MOOV/MOOV.yaml
    path: "./ruleset/bm7-MOOV.yaml"
    interval: 88396
    proxy: "\U0001F6AB 受限网站"
  litv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/LiTV/LiTV.yaml
    path: "./ruleset/bm7-LiTV.yaml"
    interval: 88434
    proxy: "\U0001F6AB 受限网站"
  friday:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/friDay/friDay.yaml
    path: "./ruleset/bm7-friDay.yaml"
    interval: 88475
    proxy: "\U0001F6AB 受限网站"
  hamivideo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/HamiVideo/HamiVideo.yaml
    path: "./ruleset/bm7-HamiVideo.yaml"
    interval: 88451
    proxy: "\U0001F6AB 受限网站"
  linetv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/LineTV/LineTV.yaml
    path: "./ruleset/bm7-LineTV.yaml"
    interval: 88499
    proxy: "\U0001F6AB 受限网站"
  vidoltv:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/VidolTV/VidolTV.yaml
    path: "./ruleset/bm7-VidolTV.yaml"
    interval: 88474
    proxy: "\U0001F6AB 受限网站"
  taiwangood:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TaiWanGood/TaiWanGood.yaml
    path: "./ruleset/bm7-TaiWanGood.yaml"
    interval: 88525
    proxy: "\U0001F6AB 受限网站"
  cht:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/CHT/CHT.yaml
    path: "./ruleset/bm7-CHT.yaml"
    interval: 88543
    proxy: "\U0001F6AB 受限网站"
  dmm:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/DMM/DMM.yaml
    path: "./ruleset/bm7-DMM.yaml"
    interval: 88559
    proxy: "\U0001F6AB 受限网站"
  tver:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TVer/TVer.yaml
    path: "./ruleset/bm7-TVer.yaml"
    interval: 88571
    proxy: "\U0001F6AB 受限网站"
  niconico:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Niconico/Niconico.yaml
    path: "./ruleset/bm7-Niconico.yaml"
    interval: 88586
    proxy: "\U0001F6AB 受限网站"
  rakuten:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Rakuten/Rakuten.yaml
    path: "./ruleset/bm7-Rakuten.yaml"
    interval: 88563
    proxy: "\U0001F6AB 受限网站"
  japonx:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Japonx/Japonx.yaml
    path: "./ruleset/bm7-Japonx.yaml"
    interval: 88595
    proxy: "\U0001F6AB 受限网站"
  nikkei:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Nikkei/Nikkei.yaml
    path: "./ruleset/bm7-Nikkei.yaml"
    interval: 88645
    proxy: "\U0001F6AB 受限网站"
  itv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/ITV/ITV.yaml
    path: "./ruleset/bm7-ITV.yaml"
    interval: 88608
    proxy: "\U0001F6AB 受限网站"
  all4:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/All4/All4.yaml
    path: "./ruleset/bm7-All4.yaml"
    interval: 88656
    proxy: "\U0001F6AB 受限网站"
  my5:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/My5/My5.yaml
    path: "./ruleset/bm7-My5.yaml"
    interval: 88658
    proxy: "\U0001F6AB 受限网站"
  skygo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/SkyGO/SkyGO.yaml
    path: "./ruleset/bm7-SkyGO.yaml"
    interval: 88664
    proxy: "\U0001F6AB 受限网站"
  britboxuk:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/BritboxUK/BritboxUK.yaml
    path: "./ruleset/bm7-BritboxUK.yaml"
    interval: 88668
    proxy: "\U0001F6AB 受限网站"
  londonreal:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/LondonReal/LondonReal.yaml
    path: "./ruleset/bm7-LondonReal.yaml"
    interval: 88703
    proxy: "\U0001F6AB 受限网站"
  qobuz:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Qobuz/Qobuz.yaml
    path: "./ruleset/bm7-Qobuz.yaml"
    interval: 88695
    proxy: "\U0001F6AB 受限网站"
  steamcn:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/SteamCN/SteamCN.yaml
    path: "./ruleset/bm7-SteamCN.yaml"
    interval: 88721
    proxy: "\U0001F6AB 受限网站"
  wanmeishijie:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/WanMeiShiJie/WanMeiShiJie.yaml
    path: "./ruleset/bm7-WanMeiShiJie.yaml"
    interval: 88729
    proxy: "\U0001F6AB 受限网站"
  wankahuanju:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/WanKaHuanJu/WanKaHuanJu.yaml
    path: "./ruleset/bm7-WanKaHuanJu.yaml"
    interval: 88754
    proxy: "\U0001F6AB 受限网站"
  majsoul:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Majsoul/Majsoul.yaml
    path: "./ruleset/bm7-Majsoul.yaml"
    interval: 88774
    proxy: "\U0001F6AB 受限网站"
  rockstar:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Rockstar/Rockstar.yaml
    path: "./ruleset/bm7-Rockstar.yaml"
    interval: 88822
    proxy: "\U0001F6AB 受限网站"
  riot:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Riot/Riot.yaml
    path: "./ruleset/bm7-Riot.yaml"
    interval: 88824
    proxy: "\U0001F6AB 受限网站"
  gog:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Gog/Gog.yaml
    path: "./ruleset/bm7-Gog.yaml"
    interval: 88829
    proxy: "\U0001F6AB 受限网站"
  supercell:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Supercell/Supercell.yaml
    path: "./ruleset/bm7-Supercell.yaml"
    interval: 88873
    proxy: "\U0001F6AB 受限网站"
  garena:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Garena/Garena.yaml
    path: "./ruleset/bm7-Garena.yaml"
    interval: 88833
    proxy: "\U0001F6AB 受限网站"
  hoyoverse:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/HoYoverse/HoYoverse.yaml
    path: "./ruleset/bm7-HoYoverse.yaml"
    interval: 88903
    proxy: "\U0001F6AB 受限网站"
  ubi:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/UBI/UBI.yaml
    path: "./ruleset/bm7-UBI.yaml"
    interval: 88883
    proxy: "\U0001F6AB 受限网站"
  wildrift:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/WildRift/WildRift.yaml
    path: "./ruleset/bm7-WildRift.yaml"
    interval: 88900
    proxy: "\U0001F6AB 受限网站"
  sony:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Sony/Sony.yaml
    path: "./ruleset/bm7-Sony.yaml"
    interval: 88901
    proxy: "\U0001F6AB 受限网站"
  yandex:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Yandex/Yandex.yaml
    path: "./ruleset/bm7-Yandex.yaml"
    interval: 88922
    proxy: "\U0001F6AB 受限网站"
  googledrive:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GoogleDrive/GoogleDrive.yaml
    path: "./ruleset/bm7-GoogleDrive.yaml"
    interval: 88966
    proxy: "\U0001F6AB 受限网站"
  googleearth:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GoogleEarth/GoogleEarth.yaml
    path: "./ruleset/bm7-GoogleEarth.yaml"
    interval: 88989
    proxy: "\U0001F6AB 受限网站"
  naver:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Naver/Naver.yaml
    path: "./ruleset/bm7-Naver.yaml"
    interval: 88997
    proxy: "\U0001F6AB 受限网站"
  scholar:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Scholar/Scholar.yaml
    path: "./ruleset/bm7-Scholar.yaml"
    interval: 89020
    proxy: "\U0001F6AB 受限网站"
  developer:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Developer/Developer.yaml
    path: "./ruleset/bm7-Developer.yaml"
    interval: 89033
    proxy: "\U0001F6AB 受限网站"
  python:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Python/Python.yaml
    path: "./ruleset/bm7-Python.yaml"
    interval: 89030
    proxy: "\U0001F6AB 受限网站"
  gitbook:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GitBook/GitBook.yaml
    path: "./ruleset/bm7-GitBook.yaml"
    interval: 89022
    proxy: "\U0001F6AB 受限网站"
  jfrog:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Jfrog/Jfrog.yaml
    path: "./ruleset/bm7-Jfrog.yaml"
    interval: 89033
    proxy: "\U0001F6AB 受限网站"
  sublimetext:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/SublimeText/SublimeText.yaml
    path: "./ruleset/bm7-SublimeText.yaml"
    interval: 89048
    proxy: "\U0001F6AB 受限网站"
  wordpress:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Wordpress/Wordpress.yaml
    path: "./ruleset/bm7-Wordpress.yaml"
    interval: 89099
    proxy: "\U0001F6AB 受限网站"
  wix:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/WIX/WIX.yaml
    path: "./ruleset/bm7-WIX.yaml"
    interval: 89124
    proxy: "\U0001F6AB 受限网站"
  cisco:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Cisco/Cisco.yaml
    path: "./ruleset/bm7-Cisco.yaml"
    interval: 89107
    proxy: "\U0001F6AB 受限网站"
  ibm:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/IBM/IBM.yaml
    path: "./ruleset/bm7-IBM.yaml"
    interval: 89102
    proxy: "\U0001F6AB 受限网站"
  oracle:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Oracle/Oracle.yaml
    path: "./ruleset/bm7-Oracle.yaml"
    interval: 89126
    proxy: "\U0001F6AB 受限网站"
  unity:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Unity/Unity.yaml
    path: "./ruleset/bm7-Unity.yaml"
    interval: 89152
    proxy: "\U0001F6AB 受限网站"
  microsoftedge:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/MicrosoftEdge/MicrosoftEdge.yaml
    path: "./ruleset/bm7-MicrosoftEdge.yaml"
    interval: 89172
    proxy: "\U0001F6AB 受限网站"
  appstore:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AppStore/AppStore.yaml
    path: "./ruleset/bm7-AppStore.yaml"
    interval: 89193
    proxy: "\U0001F6AB 受限网站"
  appletv:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AppleTV/AppleTV.yaml
    path: "./ruleset/bm7-AppleTV.yaml"
    interval: 89194
    proxy: "\U0001F6AB 受限网站"
  applenews:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AppleNews/AppleNews.yaml
    path: "./ruleset/bm7-AppleNews.yaml"
    interval: 89200
    proxy: "\U0001F6AB 受限网站"
  appledev:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AppleDev/AppleDev.yaml
    path: "./ruleset/bm7-AppleDev.yaml"
    interval: 89260
    proxy: "\U0001F6AB 受限网站"
  appleproxy:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AppleProxy/AppleProxy.yaml
    path: "./ruleset/bm7-AppleProxy.yaml"
    interval: 89254
    proxy: "\U0001F6AB 受限网站"
  siri:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Siri/Siri.yaml
    path: "./ruleset/bm7-Siri.yaml"
    interval: 89265
    proxy: "\U0001F6AB 受限网站"
  testflight:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TestFlight/TestFlight.yaml
    path: "./ruleset/bm7-TestFlight.yaml"
    interval: 89282
    proxy: "\U0001F6AB 受限网站"
  applefirmware:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AppleFirmware/AppleFirmware.yaml
    path: "./ruleset/bm7-AppleFirmware.yaml"
    interval: 89305
    proxy: "\U0001F6AB 受限网站"
  findmy:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/FindMy/FindMy.yaml
    path: "./ruleset/bm7-FindMy.yaml"
    interval: 89291
    proxy: "\U0001F6AB 受限网站"
  download:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Download/Download.yaml
    path: "./ruleset/bm7-Download.yaml"
    interval: 89335
    proxy: "\U0001F6AB 受限网站"
  ubuntu:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Ubuntu/Ubuntu.yaml
    path: "./ruleset/bm7-Ubuntu.yaml"
    interval: 89345
    proxy: "\U0001F6AB 受限网站"
  mozilla:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Mozilla/Mozilla.yaml
    path: "./ruleset/bm7-Mozilla.yaml"
    interval: 89368
    proxy: "\U0001F6AB 受限网站"
  apkpure:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Apkpure/Apkpure.yaml
    path: "./ruleset/bm7-Apkpure.yaml"
    interval: 89352
    proxy: "\U0001F6AB 受限网站"
  android:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Android/Android.yaml
    path: "./ruleset/bm7-Android.yaml"
    interval: 89411
    proxy: "\U0001F6AB 受限网站"
  googlefcm:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GoogleFCM/GoogleFCM.yaml
    path: "./ruleset/bm7-GoogleFCM.yaml"
    interval: 89382
    proxy: "\U0001F6AB 受限网站"
  intel:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Intel/Intel.yaml
    path: "./ruleset/bm7-Intel.yaml"
    interval: 89435
    proxy: "\U0001F6AB 受限网站"
  nvidia:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Nvidia/Nvidia.yaml
    path: "./ruleset/bm7-Nvidia.yaml"
    interval: 89446
    proxy: "\U0001F6AB 受限网站"
  dell:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Dell/Dell.yaml
    path: "./ruleset/bm7-Dell.yaml"
    interval: 89456
    proxy: "\U0001F6AB 受限网站"
  hp:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/HP/HP.yaml
    path: "./ruleset/bm7-HP.yaml"
    interval: 89477
    proxy: "\U0001F6AB 受限网站"
  canon:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Canon/Canon.yaml
    path: "./ruleset/bm7-Canon.yaml"
    interval: 89485
    proxy: "\U0001F6AB 受限网站"
  lg:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/LG/LG.yaml
    path: "./ruleset/bm7-LG.yaml"
    interval: 89499
    proxy: "\U0001F6AB 受限网站"
  cloudflare:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Cloudflare/Cloudflare.yaml
    path: "./ruleset/bm7-Cloudflare.yaml"
    interval: 89494
    proxy: "\U0001F6AB 受限网站"
  akamai:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Akamai/Akamai.yaml
    path: "./ruleset/bm7-Akamai.yaml"
    interval: 89513
    proxy: "\U0001F6AB 受限网站"
  digicert:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/DigiCert/DigiCert.yaml
    path: "./ruleset/bm7-DigiCert.yaml"
    interval: 89535
    proxy: "\U0001F6AB 受限网站"
  globalsign:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GlobalSign/GlobalSign.yaml
    path: "./ruleset/bm7-GlobalSign.yaml"
    interval: 89547
    proxy: "\U0001F6AB 受限网站"
  sectigo:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Sectigo/Sectigo.yaml
    path: "./ruleset/bm7-Sectigo.yaml"
    interval: 89550
    proxy: "\U0001F6AB 受限网站"
  brightcove:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/BrightCove/BrightCove.yaml
    path: "./ruleset/bm7-BrightCove.yaml"
    interval: 89551
    proxy: "\U0001F6AB 受限网站"
  jwplayer:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Jwplayer/Jwplayer.yaml
    path: "./ruleset/bm7-Jwplayer.yaml"
    interval: 89618
    proxy: "\U0001F6AB 受限网站"
  privatetracker:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/PrivateTracker/PrivateTracker.yaml
    path: "./ruleset/bm7-PrivateTracker.yaml"
    interval: 89594
    proxy: "\U0001F6AB 受限网站"
  cnn:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/CNN/CNN.yaml
    path: "./ruleset/bm7-CNN.yaml"
    interval: 89641
    proxy: "\U0001F6AB 受限网站"
  nytimes:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/NYTimes/NYTimes.yaml
    path: "./ruleset/bm7-NYTimes.yaml"
    interval: 89655
    proxy: "\U0001F6AB 受限网站"
  bloomberg:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Bloomberg/Bloomberg.yaml
    path: "./ruleset/bm7-Bloomberg.yaml"
    interval: 89666
    proxy: "\U0001F6AB 受限网站"
  ebay:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/eBay/eBay.yaml
    path: "./ruleset/bm7-eBay.yaml"
    interval: 89673
    proxy: "\U0001F6AB 受限网站"
  nike:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Nike/Nike.yaml
    path: "./ruleset/bm7-Nike.yaml"
    interval: 89699
    proxy: "\U0001F6AB 受限网站"
  adobe:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Adobe/Adobe.yaml
    path: "./ruleset/bm7-Adobe.yaml"
    interval: 89678
    proxy: "\U0001F6AB 受限网站"
  samsung:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Samsung/Samsung.yaml
    path: "./ruleset/bm7-Samsung.yaml"
    interval: 89696
    proxy: "\U0001F6AB 受限网站"
  tesla:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Tesla/Tesla.yaml
    path: "./ruleset/bm7-Tesla.yaml"
    interval: 89702
    proxy: "\U0001F6AB 受限网站"
  dropbox:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Dropbox/Dropbox.yaml
    path: "./ruleset/bm7-Dropbox.yaml"
    interval: 89762
    proxy: "\U0001F6AB 受限网站"
  mega:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/MEGA/MEGA.yaml
    path: "./ruleset/bm7-MEGA.yaml"
    interval: 89762
    proxy: "\U0001F6AB 受限网站"
  wikipedia:
    type: http
    behavior: classical
    url: https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Wikipedia/Wikipedia.yaml
    path: "./ruleset/bm7-Wikipedia.yaml"
    interval: 89758
    proxy: "\U0001F6AB 受限网站"
  duolingo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Duolingo/Duolingo.yaml
    path: "./ruleset/bm7-Duolingo.yaml"
    interval: 89784
    proxy: "\U0001F6AB 受限网站"
  sukka-phishing:
    type: http
    behavior: domain
    format: text
    url: https://ruleset.skk.moe/Clash/domainset/reject_phishing.txt
    path: "./ruleset/sukka-reject-phishing.txt"
    interval: 89786
    proxy: "\U0001F6AB 受限网站"
  hagezi-tif:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MiHomoer/MiHomo-Hagezi@release/HageziUltimate.mrs
    path: "./ruleset/hagezi-tif.mrs"
    interval: 89809
    proxy: "\U0001F6AB 受限网站"
  szkane-ai:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/AiDomain.list
    path: "./ruleset/szkane-AiDomain.list"
    interval: 89808
    proxy: "\U0001F6AB 受限网站"
  szkane-ciciai:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/CiciAi.list
    path: "./ruleset/szkane-CiciAi.list"
    interval: 89844
    proxy: "\U0001F6AB 受限网站"
  szkane-web3:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Web3.list
    path: "./ruleset/szkane-Web3.list"
    interval: 89850
    proxy: "\U0001F6AB 受限网站"
  szkane-developer:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/Developer.list
    path: "./ruleset/szkane-Developer.list"
    interval: 89873
    proxy: "\U0001F6AB 受限网站"
  szkane-khan:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/Khan.list
    path: "./ruleset/szkane-Khan.list"
    interval: 89873
    proxy: "\U0001F6AB 受限网站"
  szkane-edutools:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/Edutools.list
    path: "./ruleset/szkane-Edutools.list"
    interval: 89927
    proxy: "\U0001F6AB 受限网站"
  szkane-uk:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/UK.list
    path: "./ruleset/szkane-UK.list"
    interval: 89896
    proxy: "\U0001F6AB 受限网站"
  szkane-bilihmt:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/BilibiliHMT.list
    path: "./ruleset/szkane-BilibiliHMT.list"
    interval: 89933
    proxy: "\U0001F6AB 受限网站"
  szkane-netflixip:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/Ruleset/NetflixIP.list
    path: "./ruleset/szkane-NetflixIP.list"
    interval: 89941
    proxy: "\U0001F6AB 受限网站"
  szkane-proxygfw:
    type: http
    behavior: classical
    format: text
    url: https://fastly.jsdelivr.net/gh/szkane/ClashRuleSet@main/Clash/ProxyGFWlist.list
    path: "./ruleset/szkane-ProxyGFWlist.list"
    interval: 89998
    proxy: "\U0001F6AB 受限网站"
  loyalsoldier-gfw:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/gfw.mrs
    path: "./ruleset/meta-gfw.mrs"
    interval: 89981
    proxy: "\U0001F6AB 受限网站"
  loyalsoldier-greatfire:
    type: http
    behavior: domain
    format: mrs
    url: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/greatfire.mrs
    path: "./ruleset/meta-greatfire.mrs"
    interval: 90000
    proxy: "\U0001F6AB 受限网站"
  acc-appleai:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/AppleAI/AppleAI.yaml
    path: "./ruleset/acc-AppleAI.yaml"
    interval: 90028
    proxy: "\U0001F6AB 受限网站"
  acc-grok:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Grok/Grok.yaml
    path: "./ruleset/acc-Grok.yaml"
    interval: 90049
    proxy: "\U0001F6AB 受限网站"
  acc-gemini:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Gemini/Gemini.yaml
    path: "./ruleset/acc-Gemini.yaml"
    interval: 90072
    proxy: "\U0001F6AB 受限网站"
  acc-copilot:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Copilot/Copilot.yaml
    path: "./ruleset/acc-Copilot.yaml"
    interval: 90038
    proxy: "\U0001F6AB 受限网站"
  acc-bank-us:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankUS.yaml
    path: "./ruleset/acc-BankUS.yaml"
    interval: 90071
    proxy: "\U0001F6AB 受限网站"
  acc-bank-uk:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankUK.yaml
    path: "./ruleset/acc-BankUK.yaml"
    interval: 90079
    proxy: "\U0001F6AB 受限网站"
  acc-bank-hk:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankHK.yaml
    path: "./ruleset/acc-BankHK.yaml"
    interval: 90075
    proxy: "\U0001F6AB 受限网站"
  acc-bank-sg:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankSG.yaml
    path: "./ruleset/acc-BankSG.yaml"
    interval: 90134
    proxy: "\U0001F6AB 受限网站"
  acc-bank-jp:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankJP.yaml
    path: "./ruleset/acc-BankJP.yaml"
    interval: 90138
    proxy: "\U0001F6AB 受限网站"
  acc-bank-au:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankAU.yaml
    path: "./ruleset/acc-BankAU.yaml"
    interval: 90146
    proxy: "\U0001F6AB 受限网站"
  acc-bank-ca:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankCA.yaml
    path: "./ruleset/acc-BankCA.yaml"
    interval: 90154
    proxy: "\U0001F6AB 受限网站"
  acc-bank-de:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankDE.yaml
    path: "./ruleset/acc-BankDE.yaml"
    interval: 90205
    proxy: "\U0001F6AB 受限网站"
  acc-bank-nl:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankNL.yaml
    path: "./ruleset/acc-BankNL.yaml"
    interval: 90223
    proxy: "\U0001F6AB 受限网站"
  acc-bank-fr:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Bank/BankFR.yaml
    path: "./ruleset/acc-BankFR.yaml"
    interval: 90205
    proxy: "\U0001F6AB 受限网站"
  acc-vf-paypal:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/VirtualFinance/Paypal.yaml
    path: "./ruleset/acc-Paypal.yaml"
    interval: 90220
    proxy: "\U0001F6AB 受限网站"
  acc-vf-wise:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/VirtualFinance/Wise.yaml
    path: "./ruleset/acc-Wise.yaml"
    interval: 90254
    proxy: "\U0001F6AB 受限网站"
  acc-vf-monzo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/VirtualFinance/Monzo.yaml
    path: "./ruleset/acc-Monzo.yaml"
    interval: 90231
    proxy: "\U0001F6AB 受限网站"
  acc-vf-revolut:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/VirtualFinance/Revolut.yaml
    path: "./ruleset/acc-Revolut.yaml"
    interval: 90296
    proxy: "\U0001F6AB 受限网站"
  acc-applenews:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/AppleNews/AppleNews.yaml
    path: "./ruleset/acc-AppleNews.yaml"
    interval: 90270
    proxy: "\U0001F6AB 受限网站"
  acc-apple:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Apple/Apple.yaml
    path: "./ruleset/acc-Apple.yaml"
    interval: 90321
    proxy: "\U0001F6AB 受限网站"
  acc-microsoftapps:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/MicrosoftAPPs/MicrosoftAPPs.yaml
    path: "./ruleset/acc-MicrosoftAPPs.yaml"
    interval: 90323
    proxy: "\U0001F6AB 受限网站"
  acc-signal:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Signal/Signal.yaml
    path: "./ruleset/acc-Signal.yaml"
    interval: 90316
    proxy: "\U0001F6AB 受限网站"
  acc-rustdesk:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/RustDesk/RustDesk.yaml
    path: "./ruleset/acc-RustDesk.yaml"
    interval: 90359
    proxy: "\U0001F6AB 受限网站"
  acc-parsec:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Parsec/Parsec.yaml
    path: "./ruleset/acc-Parsec.yaml"
    interval: 90379
    proxy: "\U0001F6AB 受限网站"
  acc-alipan:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Alipan/Alipan.yaml
    path: "./ruleset/acc-Alipan.yaml"
    interval: 90376
    proxy: "\U0001F6AB 受限网站"
  acc-baidunetdisk:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/BaiduNetDisk/BaiduNetDisk.yaml
    path: "./ruleset/acc-BaiduNetDisk.yaml"
    interval: 90370
    proxy: "\U0001F6AB 受限网站"
  acc-weiyun:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/WeiYun/WeiYun.yaml
    path: "./ruleset/acc-WeiYun.yaml"
    interval: 90425
    proxy: "\U0001F6AB 受限网站"
  acc-kwai:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Kwai/Kwai.yaml
    path: "./ruleset/acc-Kwai.yaml"
    interval: 90404
    proxy: "\U0001F6AB 受限网站"
  acc-fl-bilibili:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/FakeLocation/FakeLocationBiliBili.yaml
    path: "./ruleset/acc-FakeLocationBiliBili.yaml"
    interval: 90405
    proxy: "\U0001F6AB 受限网站"
  acc-fl-douyin:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/FakeLocation/FakeLocationDouYin.yaml
    path: "./ruleset/acc-FakeLocationDouYin.yaml"
    interval: 90450
    proxy: "\U0001F6AB 受限网站"
  acc-fl-kuaishou:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/FakeLocation/FakeLocationKuaiShou.yaml
    path: "./ruleset/acc-FakeLocationKuaiShou.yaml"
    interval: 90489
    proxy: "\U0001F6AB 受限网站"
  acc-fl-xiaohongshu:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/FakeLocation/FakeLocationXiaoHongShu.yaml
    path: "./ruleset/acc-FakeLocationXiaoHongShu.yaml"
    interval: 90482
    proxy: "\U0001F6AB 受限网站"
  acc-fl-xigua:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/FakeLocation/FakeLocationXiGua.yaml
    path: "./ruleset/acc-FakeLocationXiGua.yaml"
    interval: 90489
    proxy: "\U0001F6AB 受限网站"
  acc-fl-weibo:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/FakeLocation/FakeLocationWeiBo.yaml
    path: "./ruleset/acc-FakeLocationWeiBo.yaml"
    interval: 90488
    proxy: "\U0001F6AB 受限网站"
  acc-fl-zhihu:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/FakeLocation/FakeLocationZhiHu.yaml
    path: "./ruleset/acc-FakeLocationZhiHu.yaml"
    interval: 90505
    proxy: "\U0001F6AB 受限网站"
  acc-fl-tieba:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/FakeLocation/FakeLocationTieBa.yaml
    path: "./ruleset/acc-FakeLocationTieBa.yaml"
    interval: 90528
    proxy: "\U0001F6AB 受限网站"
  acc-fl-douban:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/FakeLocation/FakeLocationDouBan.yaml
    path: "./ruleset/acc-FakeLocationDouBan.yaml"
    interval: 90560
    proxy: "\U0001F6AB 受限网站"
  acc-fl-xianyu:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/FakeLocation/FakeLocationXianYu.yaml
    path: "./ruleset/acc-FakeLocationXianYu.yaml"
    interval: 90540
    proxy: "\U0001F6AB 受限网站"
  acc-hijackingplus:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/HijackingPlus/HijackingPlus.yaml
    path: "./ruleset/acc-HijackingPlus.yaml"
    interval: 90594
    proxy: "\U0001F6AB 受限网站"
  acc-blockhttpdnsplus:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/BlockHttpDNSPlus/BlockHttpDNSPlus.yaml
    path: "./ruleset/acc-BlockHttpDNSPlus.yaml"
    interval: 90613
    proxy: "\U0001F6AB 受限网站"
  acc-prerepaireasyprivacy:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/PreRepairEasyPrivacy/PreRepairEasyPrivacy.yaml
    path: "./ruleset/acc-PreRepairEasyPrivacy.yaml"
    interval: 90585
    proxy: "\U0001F6AB 受限网站"
  acc-unsupportvpn:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/UnsupportVPN/UnsupportVPN.yaml
    path: "./ruleset/acc-UnsupportVPN.yaml"
    interval: 90635
    proxy: "\U0001F6AB 受限网站"
  acc-macappupgrade:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/MacAppUpgrade/MacAppUpgrade.yaml
    path: "./ruleset/acc-MacAppUpgrade.yaml"
    interval: 90615
    proxy: "\U0001F6AB 受限网站"
  acc-fastly:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Fastly/Fastly.yaml
    path: "./ruleset/acc-Fastly.yaml"
    interval: 90669
    proxy: "\U0001F6AB 受限网站"
  # v5.2.5 FIX#23-P1: acc-geositecn / acc-china 删除（与 geosite:cn 纯重复）
  acc-chinamax:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/ChinaMax/ChinaMax.yaml
    path: "./ruleset/acc-ChinaMax.yaml"
    interval: 90693
    proxy: "\U0001F6AB 受限网站"
  acc-homeip-us:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/HomeIP/HomeIPUS.yaml
    path: "./ruleset/acc-HomeIPUS.yaml"
    interval: 90703
    proxy: "\U0001F6AB 受限网站"
  acc-homeip-jp:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/HomeIP/HomeIPJP.yaml
    path: "./ruleset/acc-HomeIPJP.yaml"
    interval: 90762
    proxy: "\U0001F6AB 受限网站"
  acc-waybackmachine:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/WaybackMachine/WaybackMachine.yaml
    path: "./ruleset/acc-WaybackMachine.yaml"
    interval: 90730
    proxy: "\U0001F6AB 受限网站"
  acc-pornhub:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Pornhub/Pornhub.yaml
    path: "./ruleset/acc-Pornhub.yaml"
    interval: 90755
    proxy: "\U0001F6AB 受限网站"
  acc-aqara-cn:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Aqara/AqaraCN.yaml
    path: "./ruleset/acc-AqaraCN.yaml"
    interval: 90756
    proxy: "\U0001F6AB 受限网站"
  acc-aqara-global:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/Aqara/AqaraGlobal.yaml
    path: "./ruleset/acc-AqaraGlobal.yaml"
    interval: 90781
    proxy: "\U0001F6AB 受限网站"
  acc-emuleserver:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/eMuleServer/eMuleServer.yaml
    path: "./ruleset/acc-eMuleServer.yaml"
    interval: 90803
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-asia-east:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Asia_East_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Asia_East.yaml"
    interval: 90816
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-asia-eastsouth:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Asia_EastSouth_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Asia_EastSouth.yaml"
    interval: 90841
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-asia-south:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Asia_South_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Asia_South.yaml"
    interval: 90866
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-asia-central:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Asia_Central_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Asia_Central.yaml"
    interval: 90865
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-asia-west:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Asia_West_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Asia_West.yaml"
    interval: 90869
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-asia-china:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Asia_China_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Asia_China.yaml"
    interval: 90928
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-america-north:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_America_North_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-America_North.yaml"
    interval: 90902
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-america-south:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_America_South_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-America_South.yaml"
    interval: 90932
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-europe-west:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Europe_West_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Europe_West.yaml"
    interval: 90960
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-europe-east:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Europe_East_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Europe_East.yaml"
    interval: 90954
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-oceania:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Oceania_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Oceania.yaml"
    interval: 90980
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-antarctica:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Antarctica_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Antarctica.yaml"
    interval: 91002
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-africa-north:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Africa_North_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Africa_North.yaml"
    interval: 91012
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-africa-south:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Africa_South_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Africa_South.yaml"
    interval: 91047
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-africa-west:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Africa_West_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Africa_West.yaml"
    interval: 91043
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-africa-east:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Africa_East_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Africa_East.yaml"
    interval: 91029
    proxy: "\U0001F6AB 受限网站"
  acc-geo-d-africa-central:
    type: http
    behavior: domain
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_Domain/GeoRouting_Africa_Central_ccTLD_Domain.yaml
    path: "./ruleset/acc-GeoD-Africa_Central.yaml"
    interval: 91084
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-asia-east:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Asia_East_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Asia_East.yaml"
    interval: 91073
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-asia-eastsouth:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Asia_EastSouth_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Asia_EastSouth.yaml"
    interval: 91095
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-asia-south:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Asia_South_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Asia_South.yaml"
    interval: 91131
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-asia-central:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Asia_Central_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Asia_Central.yaml"
    interval: 91146
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-asia-west:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Asia_West_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Asia_West.yaml"
    interval: 91127
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-asia-china:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Asia_China_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Asia_China.yaml"
    interval: 91125
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-america-north:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_America_North_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-America_North.yaml"
    interval: 91175
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-america-south:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_America_South_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-America_South.yaml"
    interval: 91175
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-europe-west:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Europe_West_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Europe_West.yaml"
    interval: 91171
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-europe-east:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Europe_East_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Europe_East.yaml"
    interval: 91201
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-oceania:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Oceania_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Oceania.yaml"
    interval: 91224
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-antarctica:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Antarctica_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Antarctica.yaml"
    interval: 91227
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-africa-north:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Africa_North_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Africa_North.yaml"
    interval: 91248
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-africa-south:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Africa_South_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Africa_South.yaml"
    interval: 91267
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-africa-west:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Africa_West_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Africa_West.yaml"
    interval: 91272
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-africa-east:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Africa_East_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Africa_East.yaml"
    interval: 91308
    proxy: "\U0001F6AB 受限网站"
  acc-geo-ip-africa-central:
    type: http
    behavior: classical
    url: https://fastly.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@main/GeoRouting_For_IP/GeoRouting_Africa_Central_GeoIP.yaml
    path: "./ruleset/acc-GeoIP-Africa_Central.yaml"
    interval: 91307
    proxy: "\U0001F6AB 受限网站"
rules:
- "RULE-SET,anti-ad,\U0001F6D1 广告拦截"
- "RULE-SET,sukka-phishing,\U0001F6D1 广告拦截"
- "RULE-SET,hagezi-tif,\U0001F6D1 广告拦截"
- "RULE-SET,acc-hijackingplus,\U0001F6D1 广告拦截"
- "RULE-SET,acc-blockhttpdnsplus,\U0001F6D1 广告拦截"
- "RULE-SET,acc-prerepaireasyprivacy,\U0001F6D1 广告拦截"
- "RULE-SET,acc-unsupportvpn,\U0001F6D1 广告拦截"
- "GEOSITE,category-ads-all,\U0001F6D1 广告拦截"
- "RULE-SET,advertising,\U0001F6D1 广告拦截"
- "RULE-SET,advertisingmitv,\U0001F6D1 广告拦截"
- "RULE-SET,adobeactivation,\U0001F6D1 广告拦截"
- "RULE-SET,blockhttpdns,\U0001F6D1 广告拦截"
- "RULE-SET,domob,\U0001F6D1 广告拦截"
- "RULE-SET,hijacking,\U0001F6D1 广告拦截"
- "RULE-SET,jiguangtuisong,\U0001F6D1 广告拦截"
- "RULE-SET,marketing,\U0001F6D1 广告拦截"
- "RULE-SET,miuiprivacy,\U0001F6D1 广告拦截"
- "RULE-SET,privacy,\U0001F6D1 广告拦截"
- "RULE-SET,youmengchuangxiang,\U0001F6D1 广告拦截"
- DST-PORT,7680,REJECT
- GEOSITE,private,DIRECT
- GEOIP,private,DIRECT,no-resolve
- IP-CIDR,172.90.1.130/32,DIRECT,no-resolve
- PROCESS-NAME,WorkPro.exe,DIRECT
- PROCESS-NAME,GCUService.exe,DIRECT
- PROCESS-NAME,GCUBridge.exe,DIRECT
- PROCESS-NAME,CCUWinUI.exe,DIRECT
- PROCESS-NAME,HipsDaemon.exe,DIRECT
- PROCESS-NAME,gdphost.exe,DIRECT
- PROCESS-NAME,gehsender.exe,DIRECT
- PROCESS-NAME,GSCService.exe,DIRECT
- DOMAIN,ip.cip.cc,DIRECT
- PROCESS-NAME,gsupservice.exe,DIRECT
- PROCESS-NAME,gchsvc.exe,DIRECT
- DST-PORT,26880,DIRECT
- DST-PORT,6540,DIRECT
- DST-PORT,33068,DIRECT
- DST-PORT,123,DIRECT
- DST-PORT,3478,DIRECT
- DST-PORT,3479,DIRECT
- "PROCESS-NAME,QQ.exe,\U0001F3E0 国内网站"
- "PROCESS-NAME,Weixin.exe,\U0001F3E0 国内网站"
- "PROCESS-NAME,WeChat.exe,\U0001F3E0 国内网站"
- DOMAIN-SUFFIX,chiphell.com,DIRECT
- DOMAIN-SUFFIX,iwipwedabay.com,DIRECT
- "DOMAIN-SUFFIX,binance.vision,\U0001F4B0 加密货币"
- "DOMAIN-SUFFIX,binance.com,\U0001F4B0 加密货币"
- "DOMAIN-SUFFIX,binance.info,\U0001F4B0 加密货币"
- "DOMAIN-SUFFIX,binance.cloud,\U0001F4B0 加密货币"
- "DOMAIN-SUFFIX,binance.me,\U0001F4B0 加密货币"
- "DOMAIN-SUFFIX,binance.org,\U0001F4B0 加密货币"
- "DOMAIN-SUFFIX,binancefuture.com,\U0001F4B0 加密货币"
- DOMAIN,dns.google,☁️ 云与CDN
- DOMAIN,dns.google.com,☁️ 云与CDN
- "DOMAIN-SUFFIX,youtube.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,youtu.be,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,googlevideo.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,ytimg.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,ggpht.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,youtube-nocookie.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,youtubekids.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,openai,\U0001F916 AI 服务"
- "RULE-SET,claude,\U0001F916 AI 服务"
- "RULE-SET,gemini,\U0001F916 AI 服务"
- "RULE-SET,copilot,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,perplexity.ai,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,mistral.ai,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,x.ai,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,grok.com,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,deepseek.com,\U0001F3E0 国内网站"
- "DOMAIN-SUFFIX,huggingface.co,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,replicate.com,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,together.ai,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,cohere.ai,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,cohere.com,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,midjourney.com,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,stability.ai,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,anthropic.com,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,cursor.com,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,cursor.sh,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,v0.dev,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,vercel.ai,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,notebooklm.google,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,poe.com,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,character.ai,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,inflection.ai,\U0001F6AB 受限网站"
- "DOMAIN-SUFFIX,pi.ai,\U0001F6AB 受限网站"
- "DOMAIN-SUFFIX,suno.ai,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,suno.com,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,runway.ml,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,runwayml.com,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,openrouter.ai,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,fireworks.ai,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,modal.com,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,modal.run,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,runpod.io,\U0001F916 AI 服务"
- "RULE-SET,civitai,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,gmail.com,\U0001F4E7 邮件服务"
- "DOMAIN-SUFFIX,googlemail.com,\U0001F4E7 邮件服务"
- "DOMAIN,mail.google.com,\U0001F4E7 邮件服务"
- "DOMAIN,inbox.google.com,\U0001F4E7 邮件服务"
- "RULE-SET,googlevoice,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,meet.google.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN,meet.googleapis.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,dl.google.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,play.googleapis.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,android.clients.google.com,\U0001F4E5 下载更新"
- "RULE-SET,googlefcm,\U0001F4E5 下载更新"
- "RULE-SET,googlesearch,\U0001F50D 搜索引擎"
- "RULE-SET,googledrive,\U0001F50D 搜索引擎"
- "RULE-SET,googleearth,\U0001F50D 搜索引擎"
- "RULE-SET,google,\U0001F50D 搜索引擎"
- "RULE-SET,google-ip,\U0001F50D 搜索引擎,no-resolve"
- "RULE-SET,szkane-ai,\U0001F916 AI 服务"
- "RULE-SET,szkane-ciciai,\U0001F916 AI 服务"
- "RULE-SET,acc-appleai,\U0001F916 AI 服务"
- "RULE-SET,acc-grok,\U0001F916 AI 服务"
- "RULE-SET,acc-gemini,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,do.dsp.mp.microsoft.com,\U0001F4E5 下载更新"
- "RULE-SET,acc-copilot,\U0001F916 AI 服务"
- "DOMAIN-SUFFIX,tradingview.com,\U0001F4B0 加密货币"
- "DOMAIN-SUFFIX,tvcdn.com,\U0001F4B0 加密货币"
- "DOMAIN-SUFFIX,coinglass.com,\U0001F4B0 加密货币"
- "DOMAIN-SUFFIX,hyperliquid.xyz,\U0001F4B0 加密货币"
- "DOMAIN-SUFFIX,hyperliquid-testnet.xyz,\U0001F4B0 加密货币"
- "RULE-SET,cryptocurrency,\U0001F4B0 加密货币"
- "DOMAIN-SUFFIX,eth.limo,\U0001F4B0 加密货币"
- "DOMAIN-SUFFIX,glitternode.ru,\U0001F4B0 加密货币"
- "RULE-SET,binance,\U0001F4B0 加密货币"
- "RULE-SET,szkane-web3,\U0001F4B0 加密货币"
- "RULE-SET,paypal,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,stripe.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,stripe.network,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,stripecdn.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,stripe.dev,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,wise.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,transferwise.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,revolut.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,revolut.me,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,braintreegateway.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,braintree-api.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,venmo.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,cash.app,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,squareup.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,square.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,adyen.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,checkout.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,klarna.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,afterpay.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,plaid.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,midtrans.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,gopay.co.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,ovo.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,dana.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,shopeepay.co.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,xendit.co,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,doku.com,\U0001F3E6 金融支付"
- "RULE-SET,stripe,\U0001F3E6 金融支付"
- "RULE-SET,visa,\U0001F3E6 金融支付"
- "RULE-SET,tigerfintech,\U0001F3E6 金融支付"
- "RULE-SET,acc-bank-us,\U0001F3E6 金融支付"
- "RULE-SET,acc-bank-uk,\U0001F3E6 金融支付"
- "RULE-SET,acc-bank-hk,\U0001F3E6 金融支付"
- "RULE-SET,acc-bank-sg,\U0001F3E6 金融支付"
- "RULE-SET,acc-bank-jp,\U0001F3E6 金融支付"
- "RULE-SET,acc-bank-au,\U0001F3E6 金融支付"
- "RULE-SET,acc-bank-ca,\U0001F3E6 金融支付"
- "RULE-SET,acc-bank-de,\U0001F3E6 金融支付"
- "RULE-SET,acc-bank-nl,\U0001F3E6 金融支付"
- "RULE-SET,acc-bank-fr,\U0001F3E6 金融支付"
- "RULE-SET,acc-vf-paypal,\U0001F3E6 金融支付"
- "RULE-SET,acc-vf-wise,\U0001F3E6 金融支付"
- "RULE-SET,acc-vf-monzo,\U0001F3E6 金融支付"
- "RULE-SET,acc-vf-revolut,\U0001F3E6 金融支付"
- DOMAIN,login.live.com,Ⓜ️ 微软服务
- DOMAIN,g.live.com,Ⓜ️ 微软服务
- DOMAIN-SUFFIX,officeapps.live.com,Ⓜ️ 微软服务
- "DOMAIN-SUFFIX,outlook.com,\U0001F4E7 邮件服务"
- "DOMAIN-SUFFIX,outlook.live.com,\U0001F4E7 邮件服务"
- "DOMAIN-SUFFIX,hotmail.com,\U0001F4E7 邮件服务"
- "DOMAIN,mail.live.com,\U0001F4E7 邮件服务"
- "DOMAIN,outlook.office365.com,\U0001F4E7 邮件服务"
- "DOMAIN,outlook.office.com,\U0001F4E7 邮件服务"
- "DOMAIN,mail.yahoo.com,\U0001F4E7 邮件服务"
- "DOMAIN-SUFFIX,ymail.com,\U0001F4E7 邮件服务"
- "DOMAIN-SUFFIX,protonmail.com,\U0001F4E7 邮件服务"
- "DOMAIN-SUFFIX,proton.me,\U0001F4E7 邮件服务"
- "DOMAIN-SUFFIX,pm.me,\U0001F4E7 邮件服务"
- "DOMAIN-SUFFIX,tutanota.com,\U0001F4E7 邮件服务"
- "DOMAIN-SUFFIX,tuta.com,\U0001F4E7 邮件服务"
- "DOMAIN,mail.zoho.com,\U0001F4E7 邮件服务"
- "DOMAIN,mail.zoho.eu,\U0001F4E7 邮件服务"
- "DOMAIN,mail.zoho.in,\U0001F4E7 邮件服务"
- "DOMAIN,mail.zoho.com.au,\U0001F4E7 邮件服务"
- "DOMAIN,mail.zoho.jp,\U0001F4E7 邮件服务"
- "DOMAIN,mail.me.com,\U0001F4E7 邮件服务"
- "DOMAIN-SUFFIX,fastmail.com,\U0001F4E7 邮件服务"
- "DOMAIN-SUFFIX,fastmail.fm,\U0001F4E7 邮件服务"
- "RULE-SET,mail,\U0001F4E7 邮件服务"
- "RULE-SET,mailru,\U0001F4E7 邮件服务"
- "RULE-SET,protonmail,\U0001F4E7 邮件服务"
- "RULE-SET,spark,\U0001F4E7 邮件服务"
- DOMAIN-SUFFIX,mail.qq.com,DIRECT
- DOMAIN-SUFFIX,mail.163.com,DIRECT
- DOMAIN-SUFFIX,mail.126.com,DIRECT
- DOMAIN-SUFFIX,mail.sina.com.cn,DIRECT
- DOMAIN-SUFFIX,mail.aliyun.com,DIRECT
- "RULE-SET,telegram,\U0001F4AC 即时通讯"
- "RULE-SET,telegram-ip,\U0001F4AC 即时通讯,no-resolve"
- "RULE-SET,discord,\U0001F4AC 即时通讯"
- "RULE-SET,whatsapp,\U0001F4AC 即时通讯"
- "RULE-SET,line,\U0001F4AC 即时通讯"
- "RULE-SET,kakaotalk,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,skype.com,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,skypeecs.net,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,skypeforbusiness.com,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,sfbassets.com,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,lync.com,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,signal.org,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,whispersystems.org,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,signal.art,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,viber.com,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,viber.io,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,element.io,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,matrix.org,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,zalo.me,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,zalopay.vn,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,wire.com,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,threema.ch,\U0001F4AC 即时通讯"
- "RULE-SET,telegramnl,\U0001F4AC 即时通讯,no-resolve"
- "RULE-SET,telegramsg,\U0001F4AC 即时通讯,no-resolve"
- "RULE-SET,telegramus,\U0001F4AC 即时通讯,no-resolve"
- "RULE-SET,zalo,\U0001F4AC 即时通讯"
- "RULE-SET,italkbb,\U0001F4AC 即时通讯"
- "RULE-SET,acc-signal,\U0001F4AC 即时通讯"
- "DOMAIN-SUFFIX,icq.com,\U0001F4AC 即时通讯"
- "RULE-SET,twitter,\U0001F4F1 社交媒体"
- "RULE-SET,twitter-ip,\U0001F4F1 社交媒体,no-resolve"
- "RULE-SET,tiktok,\U0001F4F1 社交媒体"
- "RULE-SET,reddit,\U0001F4F1 社交媒体"
- "RULE-SET,facebook,\U0001F4F1 社交媒体"
- "RULE-SET,facebook-ip,\U0001F4F1 社交媒体,no-resolve"
- "RULE-SET,instagram,\U0001F4F1 社交媒体"
- "RULE-SET,snapchat,\U0001F4F1 社交媒体"
- "RULE-SET,pinterest,\U0001F4F1 社交媒体"
- "RULE-SET,linkedin,\U0001F4F1 社交媒体"
- "DOMAIN-SUFFIX,mastodon.social,\U0001F4F1 社交媒体"
- "DOMAIN-SUFFIX,joinmastodon.org,\U0001F4F1 社交媒体"
- "DOMAIN-SUFFIX,threads.net,\U0001F4F1 社交媒体"
- "DOMAIN-SUFFIX,bsky.app,\U0001F4F1 社交媒体"
- "DOMAIN-SUFFIX,bsky.social,\U0001F4F1 社交媒体"
- "DOMAIN-SUFFIX,tumblr.com,\U0001F4F1 社交媒体"
- "DOMAIN-SUFFIX,quora.com,\U0001F4F1 社交媒体"
- "DOMAIN-SUFFIX,medium.com,\U0001F4F1 社交媒体"
- "DOMAIN-SUFFIX,flickr.com,\U0001F4F1 社交媒体"
- "DOMAIN-SUFFIX,clubhouse.com,\U0001F4F1 社交媒体"
- "DOMAIN-SUFFIX,lemon8-app.com,\U0001F4F1 社交媒体"
- "RULE-SET,tumblr,\U0001F4F1 社交媒体"
- "RULE-SET,clubhouse,\U0001F4F1 社交媒体"
- "RULE-SET,clubhouseip,\U0001F4F1 社交媒体,no-resolve"
- "RULE-SET,pixiv,\U0001F4F1 社交媒体"
- "RULE-SET,truthsocial,\U0001F4F1 社交媒体"
- "RULE-SET,vk,\U0001F4F1 社交媒体"
- "RULE-SET,blued,\U0001F3E0 国内网站"
- "RULE-SET,disqus,\U0001F4F1 社交媒体"
- "RULE-SET,imgur,\U0001F4F1 社交媒体"
- "RULE-SET,pixnet,\U0001F4F1 社交媒体"
- "RULE-SET,zoom,\U0001F9D1‍\U0001F4BC 会议协作"
- "RULE-SET,slack,\U0001F9D1‍\U0001F4BC 会议协作"
- "RULE-SET,teams,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,webex.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,wbx2.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,ciscospark.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,notion.so,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,notion.site,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,figma.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,linear.app,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,atlassian.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,jira.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,trello.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,bitbucket.org,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,asana.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,monday.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,clickup.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,basecamp.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,airtable.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,miro.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,canva.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,coda.io,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,loom.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,larksuite.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,larkoffice.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,gotomeeting.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,logmein.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "DOMAIN-SUFFIX,goto.com,\U0001F9D1‍\U0001F4BC 会议协作"
- "RULE-SET,atlassian,\U0001F9D1‍\U0001F4BC 会议协作"
- "RULE-SET,notion,\U0001F9D1‍\U0001F4BC 会议协作"
- "RULE-SET,teamviewer,\U0001F9D1‍\U0001F4BC 会议协作"
- "RULE-SET,zoho,\U0001F9D1‍\U0001F4BC 会议协作"
- "RULE-SET,salesforce,\U0001F9D1‍\U0001F4BC 会议协作"
- "RULE-SET,zendesk,\U0001F9D1‍\U0001F4BC 会议协作"
- "RULE-SET,intercom,\U0001F9D1‍\U0001F4BC 会议协作"
- "RULE-SET,remotedesktop,\U0001F9D1‍\U0001F4BC 会议协作"
- "RULE-SET,acc-rustdesk,\U0001F9D1‍\U0001F4BC 会议协作"
- "RULE-SET,acc-parsec,\U0001F9D1‍\U0001F4BC 会议协作"
- DOMAIN-SUFFIX,feishu.cn,DIRECT
- DOMAIN-SUFFIX,dingtalk.com,DIRECT
- DOMAIN-SUFFIX,welink.huaweicloud.com,DIRECT
- "RULE-SET,bilibili,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,iqiyi.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,iqiyipic.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,71.am,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,youku.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,ykimg.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,soku.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,v.qq.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,video.qq.com,\U0001F4FA 国内流媒体"
- "DOMAIN-KEYWORD,tencentvideo,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,mgtv.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,hitv.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,hunantv.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,douyin.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,douyinpic.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,douyinvod.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,ixigua.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,pstatp.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,snssdk.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,sohu.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,music.163.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,ntes53.netease.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,y.qq.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,music.qq.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,kugou.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,kuwo.cn,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,xiaohongshu.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,xhscdn.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,kuaishou.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,gifshow.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,weibo.com,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,weibo.cn,\U0001F4FA 国内流媒体"
- "DOMAIN-SUFFIX,sinaimg.cn,\U0001F4FA 国内流媒体"
- "RULE-SET,iqiyi,\U0001F4FA 国内流媒体"
- "RULE-SET,youku,\U0001F4FA 国内流媒体"
- "RULE-SET,tencentvideo,\U0001F4FA 国内流媒体"
- "RULE-SET,douyin,\U0001F4FA 国内流媒体"
- "RULE-SET,bytedance,\U0001F4FA 国内流媒体"
- "RULE-SET,kuaishou,\U0001F4FA 国内流媒体"
- "RULE-SET,weibo,\U0001F4FA 国内流媒体"
- "RULE-SET,xiaohongshu,\U0001F4FA 国内流媒体"
- "RULE-SET,neteasemusic,\U0001F4FA 国内流媒体"
- "RULE-SET,kugoukuwo,\U0001F4FA 国内流媒体"
- "RULE-SET,sohu,\U0001F4FA 国内流媒体"
- "RULE-SET,acfun,\U0001F4FA 国内流媒体"
- "RULE-SET,douyu,\U0001F4FA 国内流媒体"
- "RULE-SET,huya,\U0001F4FA 国内流媒体"
- "RULE-SET,himalaya,\U0001F4FA 国内流媒体"
- "RULE-SET,cctv,\U0001F4FA 国内流媒体"
- "RULE-SET,hunantv,\U0001F4FA 国内流媒体"
- "RULE-SET,pptv,\U0001F4FA 国内流媒体"
- "RULE-SET,funshion,\U0001F4FA 国内流媒体"
- "RULE-SET,letv,\U0001F4FA 国内流媒体"
- "RULE-SET,taihemusic,\U0001F4FA 国内流媒体"
- "RULE-SET,kukemusic,\U0001F4FA 国内流媒体"
- "RULE-SET,hibymusic,\U0001F4FA 国内流媒体"
- "RULE-SET,miwu,\U0001F4FA 国内流媒体"
- "RULE-SET,migu,\U0001F4FA 国内流媒体"
- "RULE-SET,iptvmainland,\U0001F4FA 国内流媒体"
- "RULE-SET,iptvother,\U0001F4FA 国内流媒体"
- "RULE-SET,cibn,\U0001F4FA 国内流媒体"
- "RULE-SET,bestv,\U0001F4FA 国内流媒体"
- "RULE-SET,huashutv,\U0001F4FA 国内流媒体"
- "RULE-SET,smg,\U0001F4FA 国内流媒体"
- "RULE-SET,hwtv,\U0001F4FA 国内流媒体"
- "RULE-SET,nivodtv,\U0001F4FA 国内流媒体"
- "RULE-SET,olevod,\U0001F4FA 国内流媒体"
- "RULE-SET,dandanzan,\U0001F4FA 国内流媒体"
- "RULE-SET,dandanplay,\U0001F4FA 国内流媒体"
- "RULE-SET,tiantiankankan,\U0001F4FA 国内流媒体"
- "RULE-SET,yizhibo,\U0001F4FA 国内流媒体"
- "RULE-SET,ku6,\U0001F4FA 国内流媒体"
- "RULE-SET,56,\U0001F4FA 国内流媒体"
- "RULE-SET,cetv,\U0001F4FA 国内流媒体"
- "RULE-SET,yyets,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-alipan,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-baidunetdisk,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-weiyun,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-fl-bilibili,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-fl-douyin,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-fl-kuaishou,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-fl-xiaohongshu,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-fl-xigua,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-fl-weibo,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-fl-zhihu,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-fl-tieba,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-fl-douban,\U0001F4FA 国内流媒体"
- "RULE-SET,acc-fl-xianyu,\U0001F4FA 国内流媒体"
- "RULE-SET,szkane-bilihmt,\U0001F1ED\U0001F1F0 香港流媒体"
- "RULE-SET,viu,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,wetv.vip,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,wetvinfo.com,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,iq.com,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,vidio.com,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,vidio.static6.com,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,rctiplus.com,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,visionplus.id,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,genflix.co.id,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,goplay.co.id,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,maxstream.tv,\U0001F4FA 东南亚流媒体"
- "RULE-SET,biliintl,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,viki.com,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,viki.io,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,iflix.com,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,catchplay.com,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,mewatch.sg,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,trueid.net,\U0001F4FA 东南亚流媒体"
- "DOMAIN-SUFFIX,dimsum.my,\U0001F4FA 东南亚流媒体"
- "RULE-SET,asianmedia,\U0001F4FA 东南亚流媒体"
- "RULE-SET,iqiyiintl,\U0001F4FA 东南亚流媒体"
- "RULE-SET,joox,\U0001F4FA 东南亚流媒体"
- "RULE-SET,mewatch,\U0001F4FA 东南亚流媒体"
- "RULE-SET,viki,\U0001F4FA 东南亚流媒体"
- "RULE-SET,wetv,\U0001F4FA 东南亚流媒体"
- "RULE-SET,zee,\U0001F4FA 东南亚流媒体"
- "RULE-SET,acc-kwai,\U0001F4FA 东南亚流媒体"
- "RULE-SET,youtube,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,netflix,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,netflix-ip,\U0001F1FA\U0001F1F8 美国流媒体,no-resolve"
- "RULE-SET,spotify,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,disney,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,hbo,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,primevideo,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,hulu,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,paramount,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,peacock,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,twitch,\U0001F1FA\U0001F1F8 美国流媒体"
- DOMAIN-SUFFIX,amazonaws.com,☁️ 云与CDN
- DOMAIN-SUFFIX,awsstatic.com,☁️ 云与CDN
- "DOMAIN-SUFFIX,aws.amazon.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,elasticbeanstalk.com,\U0001F4DF 开发者服务"
- "RULE-SET,amazon,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,crunchyroll.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,vrv.co,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,soundcloud.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,sndcdn.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,pandora.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,pluto.tv,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,tubi.tv,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,fubo.tv,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,discoveryplus.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,max.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,appletv.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,deezer.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,tidal.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,vimeo.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "DOMAIN-SUFFIX,dailymotion.com,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,cbs,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,nbc,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,pbs,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,attwatchtv,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,fox,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,fubotv,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,sling,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,soundcloud,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,pandora,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,pandoratv,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,tidal,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,vimeo,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,dailymotion,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,deezer,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,discoveryplus,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,overcast,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,americasvoice,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,cake,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,dood,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,lastfm,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,emby,\U0001F1FA\U0001F1F8 美国流媒体"
- "RULE-SET,szkane-netflixip,\U0001F1FA\U0001F1F8 美国流媒体,no-resolve"
- "DOMAIN-SUFFIX,mytvsuper.com,\U0001F1ED\U0001F1F0 香港流媒体"
- "DOMAIN-SUFFIX,mytv.com.hk,\U0001F1ED\U0001F1F0 香港流媒体"
- "DOMAIN-SUFFIX,viu.com,\U0001F1ED\U0001F1F0 香港流媒体"
- "DOMAIN-SUFFIX,viu.tv,\U0001F1ED\U0001F1F0 香港流媒体"
- "DOMAIN-SUFFIX,hktv.com.hk,\U0001F1ED\U0001F1F0 香港流媒体"
- "DOMAIN-SUFFIX,hktvmall.com,\U0001F1ED\U0001F1F0 香港流媒体"
- "DOMAIN-SUFFIX,nowtv.com,\U0001F1ED\U0001F1F0 香港流媒体"
- "DOMAIN-SUFFIX,nowe.com,\U0001F1ED\U0001F1F0 香港流媒体"
- "DOMAIN-SUFFIX,rthk.hk,\U0001F1ED\U0001F1F0 香港流媒体"
- "DOMAIN-SUFFIX,icable.com,\U0001F1ED\U0001F1F0 香港流媒体"
- "DOMAIN-SUFFIX,cabletv.com.hk,\U0001F1ED\U0001F1F0 香港流媒体"
- "DOMAIN-SUFFIX,hmvod.com.hk,\U0001F1ED\U0001F1F0 香港流媒体"
- "RULE-SET,mytvsuper,\U0001F1ED\U0001F1F0 香港流媒体"
- "RULE-SET,tvb,\U0001F1ED\U0001F1F0 香港流媒体"
- "RULE-SET,encoretvb,\U0001F1ED\U0001F1F0 香港流媒体"
- "RULE-SET,nowe,\U0001F1ED\U0001F1F0 香港流媒体"
- "RULE-SET,rthk,\U0001F1ED\U0001F1F0 香港流媒体"
- "RULE-SET,cabletv,\U0001F1ED\U0001F1F0 香港流媒体"
- "RULE-SET,moov,\U0001F1ED\U0001F1F0 香港流媒体"
- "RULE-SET,bahamut,\U0001F1F9\U0001F1FC 台湾流媒体"
- "RULE-SET,kktv,\U0001F1F9\U0001F1FC 台湾流媒体"
- "DOMAIN-SUFFIX,litv.tv,\U0001F1F9\U0001F1FC 台湾流媒体"
- "DOMAIN-SUFFIX,video.friday.tw,\U0001F1F9\U0001F1FC 台湾流媒体"
- "DOMAIN-SUFFIX,friday.tw,\U0001F1F9\U0001F1FC 台湾流媒体"
- "DOMAIN-SUFFIX,linetv.tw,\U0001F1F9\U0001F1FC 台湾流媒体"
- "DOMAIN-SUFFIX,elta.tv,\U0001F1F9\U0001F1FC 台湾流媒体"
- "DOMAIN-SUFFIX,mod.cht.com.tw,\U0001F1F9\U0001F1FC 台湾流媒体"
- "DOMAIN-SUFFIX,hamivideo.hinet.net,\U0001F1F9\U0001F1FC 台湾流媒体"
- "DOMAIN-SUFFIX,ofiii.com,\U0001F1F9\U0001F1FC 台湾流媒体"
- "DOMAIN-SUFFIX,pts.org.tw,\U0001F1F9\U0001F1FC 台湾流媒体"
- "DOMAIN-SUFFIX,4gtv.tv,\U0001F1F9\U0001F1FC 台湾流媒体"
- "RULE-SET,litv,\U0001F1F9\U0001F1FC 台湾流媒体"
- "RULE-SET,friday,\U0001F1F9\U0001F1FC 台湾流媒体"
- "RULE-SET,hamivideo,\U0001F1F9\U0001F1FC 台湾流媒体"
- "RULE-SET,linetv,\U0001F1F9\U0001F1FC 台湾流媒体"
- "RULE-SET,vidoltv,\U0001F1F9\U0001F1FC 台湾流媒体"
- "RULE-SET,taiwangood,\U0001F1F9\U0001F1FC 台湾流媒体"
- "RULE-SET,cht,\U0001F1F9\U0001F1FC 台湾流媒体"
- "RULE-SET,abema,\U0001F1EF\U0001F1F5 日韩流媒体"
- "RULE-SET,dazn,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,tver.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,unext.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,video.unext.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,nhk.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,nhk.or.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,dmm.com,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,dmm.co.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,dtv.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,paravi.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,videomarket.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,fod.fujitv.co.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,hulu.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,happyon.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,gyao.yahoo.co.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,music.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,nicovideo.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,nicovideo.me,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,dmc.nico,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,radiko.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,lemino.docomo.ne.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,wowow.co.jp,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,wavve.com,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,tving.com,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,watcha.com,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,coupangplay.com,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,sbs.co.kr,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,kbs.co.kr,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,mbc.co.kr,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,jtbc.co.kr,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,tvn.cjenm.com,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,afreecatv.com,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,tv.naver.com,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,now.naver.com,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,vod.naver.com,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,navertv.naver.com,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,kakaotv.daum.net,\U0001F1EF\U0001F1F5 日韩流媒体"
- "DOMAIN-SUFFIX,navercorp.com,\U0001F1EF\U0001F1F5 日韩流媒体"
- "RULE-SET,dmm,\U0001F1EF\U0001F1F5 日韩流媒体"
- "RULE-SET,tver,\U0001F1EF\U0001F1F5 日韩流媒体"
- "RULE-SET,niconico,\U0001F1EF\U0001F1F5 日韩流媒体"
- "RULE-SET,rakuten,\U0001F1EF\U0001F1F5 日韩流媒体"
- "RULE-SET,japonx,\U0001F1EF\U0001F1F5 日韩流媒体"
- "RULE-SET,nikkei,\U0001F1EF\U0001F1F5 日韩流媒体"
- "RULE-SET,bbc,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,itv.com,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,itvstatic.com,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,channel4.com,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,channel5.com,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,sky.com,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,nowtv.com.uk,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,britbox.com,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,canalplus.com,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,mycanal.fr,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,france.tv,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,tf1.fr,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,molotov.tv,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,arte.tv,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,joyn.de,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,zdf.de,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,ard.de,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,ardmediathek.de,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,rtlplus.com,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,raiplay.it,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,rtve.es,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,videoland.com,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,ruutu.fi,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,tv2.dk,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,svtplay.se,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,nrk.no,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,ivi.ru,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,kinopoisk.ru,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,okko.tv,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,more.tv,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "RULE-SET,itv,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "RULE-SET,all4,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "RULE-SET,my5,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "RULE-SET,skygo,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "RULE-SET,britboxuk,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "RULE-SET,londonreal,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "RULE-SET,qobuz,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "RULE-SET,szkane-uk,\U0001F1EA\U0001F1FA 欧洲流媒体"
- "DOMAIN-SUFFIX,mihoyo.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,miyoushe.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,yuanshen.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,bhsr.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,zenlesszonezero.com,\U0001F579️ 国内游戏"
- "DOMAIN,game.163.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,gm.163.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,ds.163.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,nie.163.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,nie.netease.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,update.netease.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,netease.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,wegame.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,wegame.com.cn,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,perfect-world.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,wanmei.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,xd.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,taptap.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,taptap.io,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,papegames.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,hypergryph.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,gryphline.com,\U0001F579️ 国内游戏"
- "DOMAIN-SUFFIX,lilith.com,\U0001F579️ 国内游戏"
- "RULE-SET,steamcn,\U0001F579️ 国内游戏"
- "RULE-SET,wanmeishijie,\U0001F579️ 国内游戏"
- "RULE-SET,wankahuanju,\U0001F579️ 国内游戏"
- "RULE-SET,majsoul,\U0001F579️ 国内游戏"
- "RULE-SET,steam,\U0001F3AE 国外游戏"
- "RULE-SET,epic,\U0001F3AE 国外游戏"
- "RULE-SET,playstation,\U0001F3AE 国外游戏"
- "RULE-SET,nintendo,\U0001F3AE 国外游戏"
- "RULE-SET,xbox,\U0001F3AE 国外游戏"
- "RULE-SET,ea,\U0001F3AE 国外游戏"
- "RULE-SET,blizzard,\U0001F3AE 国外游戏"
- "GEOSITE,category-games,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,ubisoft.com,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,ubi.com,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,riotgames.com,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,leagueoflegends.com,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,valorant.com,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,rockstargames.com,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,gog.com,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,gogalaxy.com,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,bethesda.net,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,supercell.com,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,garena.com,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,hoyoverse.com,\U0001F3AE 国外游戏"
- "DOMAIN-SUFFIX,hoyolab.com,\U0001F3AE 国外游戏"
- "RULE-SET,rockstar,\U0001F3AE 国外游戏"
- "RULE-SET,riot,\U0001F3AE 国外游戏"
- "RULE-SET,gog,\U0001F3AE 国外游戏"
- "RULE-SET,supercell,\U0001F3AE 国外游戏"
- "RULE-SET,garena,\U0001F3AE 国外游戏"
- "RULE-SET,hoyoverse,\U0001F3AE 国外游戏"
- "RULE-SET,ubi,\U0001F3AE 国外游戏"
- "RULE-SET,wildrift,\U0001F3AE 国外游戏"
- "RULE-SET,sony,\U0001F3AE 国外游戏"
- "RULE-SET,bing,\U0001F50D 搜索引擎"
- "DOMAIN-SUFFIX,yahoo.com,\U0001F50D 搜索引擎"
- "DOMAIN-SUFFIX,yahoo.co.jp,\U0001F50D 搜索引擎"
- "DOMAIN-SUFFIX,duckduckgo.com,\U0001F50D 搜索引擎"
- "DOMAIN-SUFFIX,ddg.co,\U0001F50D 搜索引擎"
- "DOMAIN-SUFFIX,brave.com,\U0001F50D 搜索引擎"
- "DOMAIN-SUFFIX,yandex.com,\U0001F50D 搜索引擎"
- "DOMAIN-SUFFIX,yandex.ru,\U0001F50D 搜索引擎"
- "DOMAIN-SUFFIX,ecosia.org,\U0001F50D 搜索引擎"
- "DOMAIN-SUFFIX,startpage.com,\U0001F50D 搜索引擎"
- "DOMAIN-SUFFIX,you.com,\U0001F50D 搜索引擎"
- "DOMAIN-SUFFIX,search.naver.com,\U0001F50D 搜索引擎"
- "RULE-SET,scholar,\U0001F50D 搜索引擎"
- "RULE-SET,yandex,\U0001F50D 搜索引擎"
- "RULE-SET,github,\U0001F4DF 开发者服务"
- RULE-SET,onedrive,Ⓜ️ 微软服务
- RULE-SET,microsoft,Ⓜ️ 微软服务
- RULE-SET,microsoftedge,Ⓜ️ 微软服务
- RULE-SET,acc-microsoftapps,Ⓜ️ 微软服务
- "RULE-SET,applemusic,\U0001F34E 苹果服务"
- "RULE-SET,icloud,\U0001F34E 苹果服务"
- "RULE-SET,apple,\U0001F34E 苹果服务"
- "RULE-SET,appstore,\U0001F34E 苹果服务"
- "RULE-SET,appletv,\U0001F34E 苹果服务"
- "RULE-SET,applenews,\U0001F34E 苹果服务"
- "RULE-SET,appledev,\U0001F34E 苹果服务"
- "RULE-SET,appleproxy,\U0001F34E 苹果服务"
- "RULE-SET,siri,\U0001F34E 苹果服务"
- "RULE-SET,testflight,\U0001F34E 苹果服务"
- "RULE-SET,applefirmware,\U0001F34E 苹果服务"
- "RULE-SET,findmy,\U0001F34E 苹果服务"
- "RULE-SET,acc-applenews,\U0001F34E 苹果服务"
- "RULE-SET,acc-apple,\U0001F34E 苹果服务"
- "RULE-SET,docker,\U0001F4DF 开发者服务"
- "RULE-SET,gitlab,\U0001F4DF 开发者服务"
- "GEOSITE,category-dev,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,npmjs.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,npmjs.org,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,yarnpkg.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,pypi.org,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,pythonhosted.org,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,crates.io,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,rubygems.org,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,packagist.org,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,maven.org,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,nuget.org,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,cocoapods.org,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,stackoverflow.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,stackexchange.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,sstatic.net,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,vercel.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,vercel.app,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,netlify.app,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,netlify.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,pages.dev,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,workers.dev,\U0001F4DF 开发者服务"
- "DOMAIN,dash.cloudflare.com,\U0001F4DF 开发者服务"
- "DOMAIN,api.cloudflare.com,\U0001F4DF 开发者服务"
- "DOMAIN,developers.cloudflare.com,\U0001F4DF 开发者服务"
- "DOMAIN,www.cloudflare.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,heroku.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,herokuapp.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,fly.io,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,railway.app,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,render.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,supabase.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,supabase.co,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,planetscale.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,neon.tech,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,digitalocean.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,vultr.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,linode.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,sentry.io,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,datadog.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,grafana.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,postman.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,jetbrains.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,hashicorp.com,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,terraform.io,\U0001F4DF 开发者服务"
- "DOMAIN-SUFFIX,vagrantup.com,\U0001F4DF 开发者服务"
- "RULE-SET,developer,\U0001F4DF 开发者服务"
- "RULE-SET,python,\U0001F4DF 开发者服务"
- "RULE-SET,gitbook,\U0001F4DF 开发者服务"
- "RULE-SET,jfrog,\U0001F4DF 开发者服务"
- "RULE-SET,sublimetext,\U0001F4DF 开发者服务"
- "RULE-SET,wordpress,\U0001F4DF 开发者服务"
- "RULE-SET,wix,\U0001F4DF 开发者服务"
- "RULE-SET,cisco,\U0001F4DF 开发者服务"
- "RULE-SET,ibm,\U0001F4DF 开发者服务"
- "RULE-SET,oracle,\U0001F4DF 开发者服务"
- "RULE-SET,unity,\U0001F4DF 开发者服务"
- "RULE-SET,szkane-developer,\U0001F4DF 开发者服务"
- "RULE-SET,systemota,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,windowsupdate.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,update.microsoft.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,download.microsoft.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,delivery.mp.microsoft.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,dl.delivery.mp.microsoft.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,officecdn.microsoft.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,officecdn.microsoft.com.edgesuite.net,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,download.mozilla.org,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,archive.mozilla.org,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,releases.ubuntu.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,archive.ubuntu.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,security.ubuntu.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,mirrors.kernel.org,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,dl.fedoraproject.org,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,repo.anaconda.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,conda.anaconda.org,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,repo.continuum.io,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,sourceforge.net,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,fosshub.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,filehippo.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,softonic.com,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,gcr.io,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,ghcr.io,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,quay.io,\U0001F4E5 下载更新"
- "DOMAIN-SUFFIX,registry.k8s.io,\U0001F4E5 下载更新"
- "RULE-SET,download,\U0001F4E5 下载更新"
- "RULE-SET,ubuntu,\U0001F4E5 下载更新"
- "RULE-SET,mozilla,\U0001F4E5 下载更新"
- "RULE-SET,apkpure,\U0001F4E5 下载更新"
- "RULE-SET,android,\U0001F4E5 下载更新"
- "RULE-SET,intel,\U0001F4E5 下载更新"
- "RULE-SET,nvidia,\U0001F4E5 下载更新"
- "RULE-SET,dell,\U0001F4E5 下载更新"
- "RULE-SET,hp,\U0001F4E5 下载更新"
- "RULE-SET,canon,\U0001F4E5 下载更新"
- "RULE-SET,lg,\U0001F4E5 下载更新"
- "RULE-SET,acc-macappupgrade,\U0001F4E5 下载更新"
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
- DOMAIN-SUFFIX,stackpathdns.com,☁️ 云与CDN
- DOMAIN-SUFFIX,stackpathcdn.com,☁️ 云与CDN
- DOMAIN-SUFFIX,b-cdn.net,☁️ 云与CDN
- DOMAIN-SUFFIX,bunny.net,☁️ 云与CDN
- DOMAIN-SUFFIX,bunnycdn.com,☁️ 云与CDN
- DOMAIN-SUFFIX,cdn77.org,☁️ 云与CDN
- DOMAIN-SUFFIX,azureedge.net,☁️ 云与CDN
- DOMAIN-SUFFIX,azurefd.net,☁️ 云与CDN
- DOMAIN-SUFFIX,msecnd.net,☁️ 云与CDN
- "DOMAIN-SUFFIX,jsdelivr.net,\U0001F6AB 受限网站"
- DOMAIN-SUFFIX,unpkg.com,☁️ 云与CDN
- DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN
- DOMAIN-SUFFIX,cloudflarestorage.com,☁️ 云与CDN
- DOMAIN-SUFFIX,r2.dev,☁️ 云与CDN
- DOMAIN-SUFFIX,ziffstatic.com,☁️ 云与CDN
- DOMAIN-SUFFIX,ucoz.ru,☁️ 云与CDN
- DOMAIN-SUFFIX,ucoz.net,☁️ 云与CDN
- RULE-SET,cloudflare,☁️ 云与CDN
- RULE-SET,akamai,☁️ 云与CDN
- RULE-SET,digicert,☁️ 云与CDN
- RULE-SET,globalsign,☁️ 云与CDN
- RULE-SET,sectigo,☁️ 云与CDN
- RULE-SET,brightcove,☁️ 云与CDN
- RULE-SET,jwplayer,☁️ 云与CDN
- RULE-SET,acc-fastly,☁️ 云与CDN
- DOMAIN-SUFFIX,letsencrypt.org,☁️ 云与CDN
- DOMAIN-SUFFIX,lencr.org,☁️ 云与CDN
- "GEOSITE,tracker,\U0001F6F0️ BT/PT Tracker"
- "DOMAIN-SUFFIX,tracker.opentrackr.org,\U0001F6F0️ BT/PT Tracker"
- "DOMAIN-SUFFIX,open.stealth.si,\U0001F6F0️ BT/PT Tracker"
- "DOMAIN-SUFFIX,tracker.torrent.eu.org,\U0001F6F0️ BT/PT Tracker"
- "DOMAIN-SUFFIX,exodus.desync.com,\U0001F6F0️ BT/PT Tracker"
- "DOMAIN-SUFFIX,tracker.openbittorrent.com,\U0001F6F0️ BT/PT Tracker"
- "DOMAIN-SUFFIX,tracker.publicbt.com,\U0001F6F0️ BT/PT Tracker"
- "DOMAIN-SUFFIX,tracker.dler.org,\U0001F6F0️ BT/PT Tracker"
- "RULE-SET,privatetracker,\U0001F6F0️ BT/PT Tracker"
- "RULE-SET,acc-emuleserver,\U0001F6F0️ BT/PT Tracker"
- "DOMAIN-SUFFIX,bca.co.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,klikbca.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,bni.co.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,bri.co.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,bankmandiri.co.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,danamon.co.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,permatabank.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,cimbniaga.co.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,btn.co.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,ocbcnisp.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,banksinarmas.com,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,idx.co.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,ksei.co.id,\U0001F3E6 金融支付"
- "DOMAIN-SUFFIX,tokopedia.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,tokopedia.net,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,shopee.co.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,bukalapak.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,blibli.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,lazada.co.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,grab.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,gojek.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,gojek.co.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,traveloka.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,tiket.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,telkomsel.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,telkom.co.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,indosatooredoo.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,im3.co.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,xl.co.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,smartfren.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,tri.co.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,by.u.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,myrepublic.co.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,firstmedia.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,biznet.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,go.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,or.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,kompas.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,detik.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,tempo.co,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,cnnindonesia.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,cnbcindonesia.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,liputan6.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,tribunnews.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,kumparan.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,idntimes.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,gofood.co.id,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,grabfood.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,66tutup.com,\U0001F310 国外网站"
- "GEOIP,ID,\U0001F310 国外网站,no-resolve"
- "DOMAIN-SUFFIX,163.com,\U0001F3E0 国内网站"
- "DOMAIN-SUFFIX,126.com,\U0001F3E0 国内网站"
- "DOMAIN-SUFFIX,126.net,\U0001F3E0 国内网站"
- "DOMAIN-SUFFIX,jianguoyun.com,\U0001F3E0 国内网站"
- "RULE-SET,cn,\U0001F3E0 国内网站"
- "RULE-SET,cn-ip,\U0001F3E0 国内网站,no-resolve"
- "DOMAIN-SUFFIX,alimama.com,\U0001F3E0 国内网站"
- "DOMAIN-SUFFIX,zxtdjy.com,\U0001F3E0 国内网站"
- "RULE-SET,acc-chinamax,\U0001F3E0 国内网站"
- "RULE-SET,acc-homeip-us,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-homeip-jp,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-aqara-cn,\U0001F3E0 国内网站"
- "RULE-SET,acc-aqara-global,\U0001F310 国外网站"
- "GEOSITE,gfw,\U0001F6AB 受限网站"
- "RULE-SET,loyalsoldier-gfw,\U0001F6AB 受限网站"
- "RULE-SET,loyalsoldier-greatfire,\U0001F6AB 受限网站"
- "RULE-SET,szkane-proxygfw,\U0001F6AB 受限网站"
- "RULE-SET,cnn,\U0001F310 国外网站"
- "RULE-SET,nytimes,\U0001F310 国外网站"
- "RULE-SET,bloomberg,\U0001F310 国外网站"
- "RULE-SET,ebay,\U0001F310 国外网站"
- "RULE-SET,nike,\U0001F310 国外网站"
- "RULE-SET,adobe,\U0001F310 国外网站"
- "RULE-SET,samsung,\U0001F310 国外网站"
- "RULE-SET,tesla,\U0001F310 国外网站"
- "RULE-SET,dropbox,\U0001F310 国外网站"
- "RULE-SET,mega,\U0001F310 国外网站"
- "RULE-SET,wikipedia,\U0001F310 国外网站"
- "RULE-SET,duolingo,\U0001F310 国外网站"
- "RULE-SET,proxy,\U0001F310 国外网站"
- "RULE-SET,acc-waybackmachine,\U0001F310 国外网站"
- "RULE-SET,acc-pornhub,\U0001F310 国外网站"
- "RULE-SET,szkane-khan,\U0001F310 国外网站"
- "RULE-SET,szkane-edutools,\U0001F310 国外网站"
- "RULE-SET,naver,\U0001F310 国外网站"
- "RULE-SET,ehgallery,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-asia-east,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-asia-eastsouth,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-asia-south,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-asia-central,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-asia-west,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-america-north,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-america-south,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-europe-west,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-europe-east,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-oceania,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-antarctica,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-africa-north,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-africa-south,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-africa-west,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-africa-east,\U0001F310 国外网站"
- "RULE-SET,acc-geo-d-africa-central,\U0001F310 国外网站"
- "RULE-SET,acc-geo-ip-asia-east,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-asia-eastsouth,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-asia-south,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-asia-central,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-asia-west,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-america-north,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-america-south,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-europe-west,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-europe-east,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-oceania,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-antarctica,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-africa-north,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-africa-south,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-africa-west,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-africa-east,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-ip-africa-central,\U0001F310 国外网站,no-resolve"
- "RULE-SET,acc-geo-d-asia-china,\U0001F3E0 国内网站"
- "RULE-SET,acc-geo-ip-asia-china,\U0001F3E0 国内网站,no-resolve"
- "DOMAIN-SUFFIX,archive.org,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,udemy.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,udemycdn.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,grammarly.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,grammarly.io,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,jetbrains.net,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,theguardian.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,guardianapis.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,box.com,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,boxcdn.net,\U0001F310 国外网站"
- "DOMAIN-SUFFIX,noip.com,\U0001F310 国外网站"
- GEOIP,cloudflare,☁️ 云与CDN,no-resolve
- "GEOIP,telegram,\U0001F4AC 即时通讯,no-resolve"
- "GEOIP,netflix,\U0001F1FA\U0001F1F8 美国流媒体,no-resolve"
- "GEOIP,facebook,\U0001F4F1 社交媒体,no-resolve"
- "GEOIP,twitter,\U0001F4F1 社交媒体,no-resolve"
- "GEOIP,google,\U0001F50D 搜索引擎,no-resolve"
- "GEOIP,CN,\U0001F3E0 国内网站,no-resolve"
- "MATCH,\U0001F41F 漏网之鱼"
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

VERSION = "v5.2.5-oc-full.1"

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
