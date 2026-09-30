#!/bin/bash
. /usr/share/openclash/log.sh

# ============================================================================
# Clash Smart v6.0.14-oc-normal.9 — OpenClash 覆写脚本（非 Smart 内核 / url-test 区域组）
# Build: 2026-09-30
# ============================================================================
# 定位：与同目录 OpenClash(mihomo-smart).sh 规则 100% 等价的「非 Smart 内核」版本。
#       两者唯一区别：22 个区域组（11 全部 + 11 家宽）从 type: smart（uselightgbm）换成 type: url-test。
#       对齐 Clash Party v6.0.14 JS 基线。
#       适用场景：
#         - OpenClash 内核选的是 Meta(mihomo 稳定版) 而非 Meta Alpha，不支持 smart + LightGBM
#         - 或者明确想关闭 LightGBM ML 评估、只靠经典 url-test 延迟选路
#       需要 LightGBM 智能评估请改用 OpenClash(mihomo-smart).sh（Smart 版）。
# 架构：
#   • 22 url-test 区域组（11 全部 + 11 家宽；interval 600s / tolerance 150ms / lazy：与 Smart 版同步延迟参数）
#   • 33 业务策略组（流媒体按平台拆分：TikTok / Netflix / Disney+ / HBO/Max / Hulu / Prime Video / YouTube / 音乐流媒体 / 其他国外流媒体）
#   • 132 融合 rule-providers（源 514 providers，全部 proxy: "🚫 受限网站"）
#   • 151 条 rules（源 973 rules；仅保留 19 条必要内联规则）
#   • DNS fake-ip + 嗅探（HTTP/TLS/QUIC）+ nameserver-policy 救援
#   • Ruby 阶段做：节点过滤 / 区域分类 / url-test 组生成 / TLS 指纹注入
# 规则源：rulesets/source/routing-graph.js v6.0.14。任何规则/组/DNS 改动必须先改源规则图，
#       再按生成链同步到此文件。参见仓库根目录 AGENTS.md。
# 变更历史：见 `OpenClash/CHANGELOG.md`（Normal 部分）。
# ============================================================================



VERSION_TAG="v6.0.14-oc-normal.9"
CONFIG_FILE="$1"
LOG_FILE="/tmp/openclash.log"
SCKI_SUBSCRIPTION_ADAPTER_PROFILE="${SCKI_SUBSCRIPTION_ADAPTER_PROFILE:-adaptive}"
SCKI_MAX_NODE_MULTIPLIER="${SCKI_MAX_NODE_MULTIPLIER:-}"
case "$SCKI_SUBSCRIPTION_ADAPTER_PROFILE" in
  off|policy|adaptive) ;;
  *) SCKI_SUBSCRIPTION_ADAPTER_PROFILE="adaptive" ;;
esac

umask 077
TMP_DIR="${TMPDIR:-/tmp}"
make_temp_file() {
  local prefix="$1"
  local temp_file=""
  temp_file="$(mktemp "$TMP_DIR/${prefix}.XXXXXX" 2>/dev/null)" && {
    printf '%s\n' "$temp_file"
    return 0
  }
  temp_file="$TMP_DIR/${prefix}.$$"
  ( set -C; : > "$temp_file" ) || exit 1
  printf '%s\n' "$temp_file"
}

OVERRIDE_YAML="$(make_temp_file clash_normal_override)"
RUBY_SCRIPT="$(make_temp_file clash_normal_ruby)"
STATUS_LOG="$(make_temp_file clash_normal_status)"
cleanup_temp_files() {
  rm -f "$OVERRIDE_YAML" "$RUBY_SCRIPT" "$STATUS_LOG"
}
trap cleanup_temp_files EXIT INT TERM

LOG_OUT "Info" "[Clash-Normal] $VERSION_TAG overwrite starting..."
LOG_OUT "Info" "[Clash-Normal] Processing: $CONFIG_FILE"
LOG_OUT "Info" "[Clash-Normal] Fused-rule build (v6.0.9, 33 business groups, non-Smart kernel)"

# ============================================================================
# OVERRIDE YAML
# ============================================================================
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
  dns.alidns.com:
  - 223.5.5.5
  - 223.6.6.6
  doh.pub:
  - 119.29.29.29
dns:
  enable: true
  listen: 0.0.0.0:7874
  ipv6: false
  prefer-h3: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
  - +.lan
  - +.local
  - +.localdomain
  - +.home.arpa
  - +.msftconnecttest.com
  - +.msftncsi.com
  - localhost.ptlogin2.qq.com
  - localhost.sec.qq.com
  - localhost.work.weixin.qq.com
  - +.in-addr.arpa
  - +.ip6.arpa
  - time.*.com
  - time.*.gov
  - ntp.*.com
  - pool.ntp.org
  - +.ntp.org
  - +.pool.ntp.org
  - +.market.xiaomi.com
  - +.stun.*.*
  - +.stun.*.*.*
  - +.turn.*.*
  - +.turn.*.*.*
  - +.n.n.srv.nintendo.net
  - +.stun.playstation.net
  - +.xboxlive.com
  - stun.l.google.com
  - stun1.l.google.com
  - stun2.l.google.com
  - stun3.l.google.com
  - stun4.l.google.com
  - global.turn.twilio.com
  - +.rustdesk.com
  # v5.4.19 #3 借鉴 Proxy-override：远控/游戏/P2P 需真实 IP 才能打洞/直连（同 RustDesk 语义）
  - +.todesk.com
  - +.oray.com
  - +.sunlogin.com
  - +.teamviewer.com
  - +.anydesk.com
  - +.battlenet.com.cn
  - +.wotgame.cn
  - +.wggames.cn
  - +.wowsgame.cn
  - +.mcdn.bilivideo.cn
  - +.pub.3gppnetwork.org
  - +.bing.com
  - +.miwifi.com
  - +.courier.push.apple.com
  - +.miui.com
  - +.xiaomi.com
  - +.xiaomi.net
  - +.mijia.tech
  - +.gotui.com
  cache-algorithm: arc
  # 对齐 Clash Party v5.4.17 基线：default-nameserver 纯 IP，其它 resolver 固定 DoH
  # FIX#HOSTS-ALIGN: use-hosts 改 true（对齐主线启用 hosts 预解析，消除 fake-ip 冷启动循环依赖）
  use-hosts: true
  use-system-hosts: false
  respect-rules: true
  # v5.4.21 #4 借鉴 Proxy-override：default-nameserver DoH-over-IP + 1 明文兜底
  default-nameserver:
  - 'https://223.5.5.5/dns-query'
  - 'https://223.6.6.6/dns-query'
  - 'https://8.8.8.8/dns-query'
  - 'https://1.1.1.1/dns-query'
  - '223.5.5.5'
  nameserver-policy:
    geosite:cn:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
    geosite:geolocation-!cn:
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
    '+.jsdelivr.net':
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
    '+.github.com':
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
    '+.githubusercontent.com':
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
    '+.githubassets.com':
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
    '+.fastly.net':
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
  nameserver:
  - https://dns.alidns.com/dns-query
  - https://doh.pub/dns-query
  proxy-server-nameserver:
  - https://cloudflare-dns.com/dns-query
  - https://dns.google/dns-query
  - https://dns.alidns.com/dns-query
  - https://doh.pub/dns-query
  direct-nameserver:
  - https://dns.alidns.com/dns-query
  - https://doh.pub/dns-query
  # v5.4.19 #5 借鉴 Proxy-override：让 direct-nameserver 也遵循 nameserver-policy（默认 false）。policy 覆盖境外 CDN 与 geosite 级分流。
  direct-nameserver-follow-policy: true
  fallback:
  - https://cloudflare-dns.com/dns-query
  - https://dns.google/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN
    geosite:
    - gfw
    - geolocation-!cn
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
    - 🏡 全球家宽
    - 🏡 香港家宽
    - 🏡 台湾家宽
    - 🏡 狮城家宽
    - 🏡 日韩家宽
    - 🏡 亚太家宽
    - 🏡 美国家宽
    - 🏡 欧洲家宽
    - 🏡 美洲家宽
    - 🏡 非洲家宽
    - 🌍 全球节点
    - 🇭🇰 香港节点
    - 🇹🇼 台湾节点
    - 🇸🇬 狮城节点
    - 🇯🇵 日韩节点
    - 🌏 亚太节点
    - 🇺🇸 美国节点
    - 🇪🇺 欧洲节点
    - 🌎 美洲节点
    - 🌍 非洲节点
    - DIRECT
- name: 💰 加密货币
  type: select
  proxies: &id002
    - 🌍 全球节点
    - 🏡 全球家宽
    - 🇭🇰 香港节点
    - 🏡 香港家宽
    - 🇹🇼 台湾节点
    - 🏡 台湾家宽
    - 🇸🇬 狮城节点
    - 🏡 狮城家宽
    - 🇯🇵 日韩节点
    - 🏡 日韩家宽
    - 🌏 亚太节点
    - 🏡 亚太家宽
    - 🇺🇸 美国节点
    - 🏡 美国家宽
    - 🇪🇺 欧洲节点
    - 🏡 欧洲家宽
    - 🌎 美洲节点
    - 🏡 美洲家宽
    - 🌍 非洲节点
    - 🏡 非洲家宽
    - DIRECT
- name: 🏦 金融支付
  type: select
  proxies: *id002
- name: 💬 即时通讯
  type: select
  proxies: *id002
- name: 📱 社交媒体
  type: select
  proxies: *id002
- name: 🧑‍💼 会议协作
  type: select
  proxies: *id002
- name: 📺 国内流媒体
  type: select
  proxies: &id003
  - DIRECT
  - 🌍 全球节点
  - 🏡 全球家宽
  - 🇭🇰 香港节点
  - 🏡 香港家宽
  - 🇹🇼 台湾节点
  - 🏡 台湾家宽
  - 🇸🇬 狮城节点
  - 🏡 狮城家宽
  - 🇯🇵 日韩节点
  - 🏡 日韩家宽
  - 🌏 亚太节点
  - 🏡 亚太家宽
  - 🇺🇸 美国节点
  - 🏡 美国家宽
  - 🇪🇺 欧洲节点
  - 🏡 欧洲家宽
  - 🌎 美洲节点
  - 🏡 美洲家宽
  - 🌍 非洲节点
  - 🏡 非洲家宽
- name: 🎵 TikTok
  type: select
  proxies: *id002
- name: 🎥 Netflix
  type: select
  proxies: *id002
- name: 🎬 Disney+
  type: select
  proxies: *id002
- name: 📡 HBO/Max
  type: select
  proxies: *id002
- name: 📺 Hulu
  type: select
  proxies: *id002
- name: 🎬 Prime Video
  type: select
  proxies: *id002
- name: 📹 YouTube
  type: select
  proxies: *id002
- name: 🎵 音乐流媒体
  type: select
  proxies: *id002
- name: 🇭🇰 香港流媒体
  type: select
  proxies:
    - 🇭🇰 香港节点
    - 🏡 香港家宽
    - 🌍 全球节点
    - 🏡 全球家宽
    - 🇹🇼 台湾节点
    - 🏡 台湾家宽
    - 🇯🇵 日韩节点
    - 🏡 日韩家宽
    - 🌏 亚太节点
    - 🏡 亚太家宽
    - 🇺🇸 美国节点
    - 🏡 美国家宽
    - 🇪🇺 欧洲节点
    - 🏡 欧洲家宽
    - 🌎 美洲节点
    - 🏡 美洲家宽
    - 🌍 非洲节点
    - 🏡 非洲家宽
    - DIRECT
- name: 🇹🇼 台湾流媒体
  type: select
  proxies:
    - 🇹🇼 台湾节点
    - 🏡 台湾家宽
    - 🌍 全球节点
    - 🏡 全球家宽
    - 🇭🇰 香港节点
    - 🏡 香港家宽
    - 🇯🇵 日韩节点
    - 🏡 日韩家宽
    - 🌏 亚太节点
    - 🏡 亚太家宽
    - 🇺🇸 美国节点
    - 🏡 美国家宽
    - 🇪🇺 欧洲节点
    - 🏡 欧洲家宽
    - 🌎 美洲节点
    - 🏡 美洲家宽
    - 🌍 非洲节点
    - 🏡 非洲家宽
    - DIRECT
- name: 🇯🇵 日韩流媒体
  type: select
  proxies:
    - 🇯🇵 日韩节点
    - 🏡 日韩家宽
    - 🌍 全球节点
    - 🏡 全球家宽
    - 🇭🇰 香港节点
    - 🏡 香港家宽
    - 🇹🇼 台湾节点
    - 🏡 台湾家宽
    - 🌏 亚太节点
    - 🏡 亚太家宽
    - 🇺🇸 美国节点
    - 🏡 美国家宽
    - 🇪🇺 欧洲节点
    - 🏡 欧洲家宽
    - 🌎 美洲节点
    - 🏡 美洲家宽
    - 🌍 非洲节点
    - 🏡 非洲家宽
    - DIRECT
- name: 🇪🇺 欧洲流媒体
  type: select
  proxies:
    - 🇪🇺 欧洲节点
    - 🏡 欧洲家宽
    - 🌍 全球节点
    - 🏡 全球家宽
    - 🇭🇰 香港节点
    - 🏡 香港家宽
    - 🇹🇼 台湾节点
    - 🏡 台湾家宽
    - 🇯🇵 日韩节点
    - 🏡 日韩家宽
    - 🌏 亚太节点
    - 🏡 亚太家宽
    - 🇺🇸 美国节点
    - 🏡 美国家宽
    - 🌎 美洲节点
    - 🏡 美洲家宽
    - 🌍 非洲节点
    - 🏡 非洲家宽
    - DIRECT
- name: 🌐 其他国外流媒体
  type: select
  proxies: *id002
- name: 🕹️ 国内游戏
  type: select
  proxies: *id003
- name: 🎮 国外游戏
  type: select
  proxies: *id002
- name: 🔍 Google 服务
  type: select
  proxies: *id002
- name: 🔧 工具与服务
  type: select
  proxies: *id002
- name: Ⓜ️ 微软服务
  type: select
  proxies: *id002
- name: 🍎 苹果服务
  type: select
  proxies: *id003
- name: 📥 下载更新
  type: select
  proxies: *id002
- name: 🛰️ BT/PT Tracker
  type: select
  proxies:
  - REJECT
  - DIRECT
  - 🌍 全球节点
  - 🏡 全球家宽
  - 🇭🇰 香港节点
  - 🏡 香港家宽
  - 🌏 亚太节点
  - 🏡 亚太家宽
- name: 🏠 国内网站
  type: select
  proxies: *id003
- name: 🚫 受限网站
  type: select
  proxies: *id002
- name: 🌐 国外网站
  type: select
  proxies: *id002
- name: 🐟 漏网之鱼
  type: select
  proxies: *id002
- name: 🛑 广告拦截
  type: select
  proxies:
  - REJECT
  - DIRECT
OVERRIDE_EOF

# ============================================================================
# OVERRIDE YAML (续) — Fused Rule-Providers：127 项，对齐 Clash Party v6.0.9 主线
# 策略：
#   ✓ 与 Clash Party 主线（BIZ.GFW = '🚫 受限网站'）一致：所有 provider 都走 GFW 组
#     下载，在中国走代理、在印尼走 DIRECT，规避 jsdelivr/GitHub 冷启动死锁。
#   ✓ 22 url-test 区域组 + 33 业务组 + 132 融合 rule-providers + 151 条规则
#   ✓ 区域组统一 type: url-test + include-all-proxies / explicit proxies 分流
#   ✓ TLS 指纹注入（Ruby 阶段 _simple_hash 分配）
# ============================================================================
cat >> "$OVERRIDE_YAML" << 'OVERRIDE_EOF'
rule-providers:
  scki-fused-001-direct-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-001-direct-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-001-direct-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-002-intl-site-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-002-intl-site-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-002-intl-site-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-003-payments-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-003-payments-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-003-payments-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-004-ai-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-004-ai-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-004-ai-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-005-cnmedia-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-005-cnmedia-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-005-cnmedia-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-006-ad-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-006-ad-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-006-ad-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-006-ad-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-006-ad-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-006-ad-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-006-ad-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-006-ad-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-006-ad-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-007-cn-site-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-007-cn-site-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-007-cn-site-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-008-direct-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-008-direct-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-008-direct-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-008-direct-ipcidr-no-resolve:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-008-direct-ipcidr-no-resolve.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-008-direct-ipcidr-no-resolve.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-008-direct-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-008-direct-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-008-direct-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-009-work-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-009-work-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-009-work-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-010-crypto-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-010-crypto-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-010-crypto-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-011-gfw-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-011-gfw-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-011-gfw-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-012-youtube-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-012-youtube-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-012-youtube-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-013-cn-site-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-013-cn-site-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-013-cn-site-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-014-ai-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-014-ai-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-014-ai-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-015-google-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-015-google-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-015-google-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-015-google-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-015-google-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-015-google-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-016-work-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-016-work-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-016-work-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-017-ai-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-017-ai-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-017-ai-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-017-ai-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-017-ai-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-017-ai-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-017-ai-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-017-ai-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-017-ai-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-018-intl-site-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-018-intl-site-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-018-intl-site-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-019-im-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-019-im-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-019-im-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-020-work-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-020-work-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-020-work-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-021-download-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-021-download-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-021-download-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-021-download-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-021-download-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-021-download-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-022-google-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-022-google-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-022-google-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-022-google-ipcidr-no-resolve:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-022-google-ipcidr-no-resolve.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-022-google-ipcidr-no-resolve.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-023-tools-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-023-tools-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-023-tools-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-024-ai-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-024-ai-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-024-ai-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-024-ai-ipcidr-no-resolve:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-024-ai-ipcidr-no-resolve.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-024-ai-ipcidr-no-resolve.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-024-ai-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-024-ai-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-024-ai-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-025-google-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-025-google-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-025-google-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-026-ai-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-026-ai-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-026-ai-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-026-ai-ipcidr-no-resolve:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-026-ai-ipcidr-no-resolve.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-026-ai-ipcidr-no-resolve.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-026-ai-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-026-ai-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-026-ai-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-027-crypto-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-027-crypto-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-027-crypto-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-027-crypto-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-027-crypto-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-027-crypto-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-028-payments-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-028-payments-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-028-payments-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-028-payments-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-028-payments-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-028-payments-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-029-microsoft-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-029-microsoft-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-029-microsoft-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-030-intl-site-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-030-intl-site-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-030-intl-site-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-031-direct-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-031-direct-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-031-direct-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-032-im-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-032-im-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-032-im-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-032-im-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-032-im-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-032-im-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-032-im-ipcidr-no-resolve:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-032-im-ipcidr-no-resolve.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-032-im-ipcidr-no-resolve.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-032-im-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-032-im-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-032-im-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-033-social-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-033-social-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-033-social-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-033-social-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-033-social-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-033-social-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-033-social-ipcidr-no-resolve:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-033-social-ipcidr-no-resolve.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-033-social-ipcidr-no-resolve.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-033-social-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-033-social-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-033-social-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-034-cn-site-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-034-cn-site-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-034-cn-site-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-035-social-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-035-social-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-035-social-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-036-work-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-036-work-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-036-work-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-036-work-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-036-work-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-036-work-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-036-work-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-036-work-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-036-work-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-037-direct-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-037-direct-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-037-direct-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-038-cnmedia-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-038-cnmedia-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-038-cnmedia-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-039-tiktok-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-039-tiktok-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-039-tiktok-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-040-youtube-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-040-youtube-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-040-youtube-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-041-netflix-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-041-netflix-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-041-netflix-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-041-netflix-ipcidr-no-resolve:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-041-netflix-ipcidr-no-resolve.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-041-netflix-ipcidr-no-resolve.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-042-disney-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-042-disney-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-042-disney-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-042-disney-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-042-disney-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-042-disney-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-043-hbo-max-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-043-hbo-max-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-043-hbo-max-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-043-hbo-max-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-043-hbo-max-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-043-hbo-max-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-044-hulu-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-044-hulu-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-044-hulu-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-044-hulu-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-044-hulu-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-044-hulu-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-045-prime-video-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-045-prime-video-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-045-prime-video-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-045-prime-video-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-045-prime-video-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-045-prime-video-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-045-prime-video-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-045-prime-video-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-045-prime-video-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-046-music-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-046-music-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-046-music-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-046-music-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-046-music-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-046-music-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-047-stream-hk-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-047-stream-hk-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-047-stream-hk-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-047-stream-hk-ipcidr-no-resolve:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-047-stream-hk-ipcidr-no-resolve.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-047-stream-hk-ipcidr-no-resolve.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-047-stream-hk-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-047-stream-hk-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-047-stream-hk-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-048-stream-tw-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-048-stream-tw-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-048-stream-tw-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-048-stream-tw-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-048-stream-tw-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-048-stream-tw-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-049-stream-jpkr-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-049-stream-jpkr-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-049-stream-jpkr-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-049-stream-jpkr-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-049-stream-jpkr-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-049-stream-jpkr-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-049-stream-jpkr-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-049-stream-jpkr-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-049-stream-jpkr-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-050-stream-eu-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-050-stream-eu-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-050-stream-eu-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-050-stream-eu-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-050-stream-eu-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-050-stream-eu-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-051-stream-other-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-051-stream-other-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-051-stream-other-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-051-stream-other-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-051-stream-other-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-051-stream-other-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-051-stream-other-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-051-stream-other-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-051-stream-other-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-052-tools-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-052-tools-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-052-tools-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-053-google-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-053-google-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-053-google-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-054-tools-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-054-tools-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-054-tools-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-054-tools-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-054-tools-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-054-tools-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-054-tools-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-054-tools-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-054-tools-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-055-microsoft-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-055-microsoft-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-055-microsoft-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-055-microsoft-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-055-microsoft-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-055-microsoft-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-056-apple-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-056-apple-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-056-apple-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-056-apple-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-056-apple-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-056-apple-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-056-apple-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-056-apple-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-056-apple-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-057-download-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-057-download-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-057-download-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-057-download-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-057-download-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-057-download-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-057-download-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-057-download-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-057-download-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-058-tracker-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-058-tracker-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-058-tracker-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-058-tracker-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-058-tracker-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-058-tracker-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-058-tracker-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-058-tracker-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-058-tracker-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-059-gfw-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-059-gfw-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-059-gfw-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-059-gfw-ipcidr-no-resolve:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-059-gfw-ipcidr-no-resolve.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-059-gfw-ipcidr-no-resolve.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-059-gfw-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-059-gfw-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-059-gfw-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-060-game-cn-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-060-game-cn-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-060-game-cn-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-061-game-intl-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-061-game-intl-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-061-game-intl-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-061-game-intl-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-061-game-intl-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-061-game-intl-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-061-game-intl-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-061-game-intl-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-061-game-intl-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-062-intl-site-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-062-intl-site-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-062-intl-site-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-062-intl-site-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-062-intl-site-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-062-intl-site-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-062-intl-site-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-062-intl-site-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-062-intl-site-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-063-payments-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-063-payments-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-063-payments-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-064-cnmedia-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-064-cnmedia-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-064-cnmedia-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-064-cnmedia-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-064-cnmedia-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-064-cnmedia-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-064-cnmedia-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-064-cnmedia-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-064-cnmedia-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-065-cn-site-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-065-cn-site-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-065-cn-site-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-065-cn-site-ipcidr-no-resolve:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-065-cn-site-ipcidr-no-resolve.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-065-cn-site-ipcidr-no-resolve.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-066-direct-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-066-direct-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-066-direct-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-067-cn-site-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-067-cn-site-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-067-cn-site-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-067-cn-site-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-067-cn-site-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-067-cn-site-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-068-intl-site-domain:
    type: http
    behavior: domain
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-068-intl-site-domain.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-068-intl-site-domain.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-068-intl-site-ipcidr:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-068-intl-site-ipcidr.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-068-intl-site-ipcidr.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-068-intl-site-ipcidr-no-resolve:
    type: http
    behavior: ipcidr
    format: mrs
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-068-intl-site-ipcidr-no-resolve.mrs?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-068-intl-site-ipcidr-no-resolve.mrs"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-068-intl-site-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-068-intl-site-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-068-intl-site-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-069-im-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-069-im-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-069-im-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-070-netflix-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-070-netflix-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-070-netflix-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-071-social-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-071-social-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-071-social-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
  scki-fused-072-google-residual:
    type: http
    behavior: classical
    format: yaml
    url: "https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/mihomo/scki-fused-072-google-residual.yaml?scki=v6.0.14"
    path: "./ruleset/v6.0.14/scki-fused-072-google-residual.yaml"
    interval: 86400
    proxy: "🚫 受限网站"
rules:
- "RULE-SET,scki-fused-001-direct-domain,DIRECT"
- "RULE-SET,scki-fused-002-intl-site-domain,🌐 国外网站"
- "RULE-SET,scki-fused-003-payments-domain,🏦 金融支付"
- "RULE-SET,scki-fused-004-ai-domain,🤖 AI 服务"
- "RULE-SET,scki-fused-005-cnmedia-domain,📺 国内流媒体"
- "RULE-SET,scki-fused-006-ad-domain,🛑 广告拦截"
- "RULE-SET,scki-fused-006-ad-ipcidr,🛑 广告拦截"
- "RULE-SET,scki-fused-006-ad-residual,🛑 广告拦截"
- "RULE-SET,scki-fused-007-cn-site-domain,🏠 国内网站"
- "AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,youtube)),📹 YouTube"
- "AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,google)),🔍 Google 服务"
- "AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,microsoft)),Ⓜ️ 微软服务"
- "AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,apple)),🍎 苹果服务"
- "AND,((DST-PORT,443),(NETWORK,UDP),(NOT,((GEOSITE,cn)))),REJECT"
- "DST-PORT,7680,REJECT"
- "RULE-SET,scki-fused-008-direct-domain,DIRECT"
- "RULE-SET,scki-fused-008-direct-ipcidr-no-resolve,DIRECT,no-resolve"
- "RULE-SET,scki-fused-008-direct-residual,DIRECT"
- "RULE-SET,scki-fused-009-work-residual,🧑‍💼 会议协作"
- "DST-PORT,26880,DIRECT"
- "DST-PORT,6540,DIRECT"
- "DST-PORT,33068,DIRECT"
- "DST-PORT,123,DIRECT"
- "DST-PORT,3478,DIRECT"
- "DST-PORT,3479,DIRECT"
- "DST-PORT,5349,DIRECT"
- "DST-PORT,19302,DIRECT"
- "DST-PORT,19305,DIRECT"
- "DST-PORT,19307,DIRECT"
- "RULE-SET,scki-fused-010-crypto-domain,💰 加密货币"
- "RULE-SET,scki-fused-011-gfw-domain,🚫 受限网站"
- "RULE-SET,scki-fused-012-youtube-domain,📹 YouTube"
- "RULE-SET,scki-fused-013-cn-site-domain,🏠 国内网站"
- "RULE-SET,scki-fused-014-ai-domain,🤖 AI 服务"
- "RULE-SET,scki-fused-015-google-domain,🔍 Google 服务"
- "RULE-SET,scki-fused-015-google-residual,🔍 Google 服务"
- "RULE-SET,scki-fused-016-work-domain,🧑‍💼 会议协作"
- "RULE-SET,scki-fused-017-ai-domain,🤖 AI 服务"
- "RULE-SET,scki-fused-017-ai-ipcidr,🤖 AI 服务"
- "RULE-SET,scki-fused-017-ai-residual,🤖 AI 服务"
- "RULE-SET,scki-fused-018-intl-site-domain,🌐 国外网站"
- "RULE-SET,scki-fused-019-im-domain,💬 即时通讯"
- "RULE-SET,scki-fused-020-work-domain,🧑‍💼 会议协作"
- "RULE-SET,scki-fused-021-download-domain,📥 下载更新"
- "RULE-SET,scki-fused-021-download-ipcidr,📥 下载更新"
- "RULE-SET,scki-fused-022-google-domain,🔍 Google 服务"
- "RULE-SET,scki-fused-022-google-ipcidr-no-resolve,🔍 Google 服务,no-resolve"
- "AND,((PROCESS-NAME,Code Helper),(DOMAIN,api.github.com)),🤖 AI 服务"
- "AND,((PROCESS-NAME,Code Helper (Plugin)),(DOMAIN,api.github.com)),🤖 AI 服务"
- "RULE-SET,scki-fused-023-tools-domain,🔧 工具与服务"
- "RULE-SET,scki-fused-024-ai-domain,🤖 AI 服务"
- "RULE-SET,scki-fused-024-ai-ipcidr-no-resolve,🤖 AI 服务,no-resolve"
- "RULE-SET,scki-fused-024-ai-residual,🤖 AI 服务"
- "RULE-SET,scki-fused-025-google-domain,🔍 Google 服务"
- "RULE-SET,scki-fused-026-ai-domain,🤖 AI 服务"
- "RULE-SET,scki-fused-026-ai-ipcidr-no-resolve,🤖 AI 服务,no-resolve"
- "RULE-SET,scki-fused-026-ai-residual,🤖 AI 服务"
- "RULE-SET,scki-fused-027-crypto-domain,💰 加密货币"
- "RULE-SET,scki-fused-027-crypto-residual,💰 加密货币"
- "RULE-SET,scki-fused-028-payments-domain,🏦 金融支付"
- "RULE-SET,scki-fused-028-payments-residual,🏦 金融支付"
- "RULE-SET,scki-fused-029-microsoft-domain,Ⓜ️ 微软服务"
- "RULE-SET,scki-fused-030-intl-site-domain,🌐 国外网站"
- "RULE-SET,scki-fused-031-direct-domain,DIRECT"
- "RULE-SET,scki-fused-032-im-domain,💬 即时通讯"
- "RULE-SET,scki-fused-032-im-ipcidr,💬 即时通讯"
- "RULE-SET,scki-fused-032-im-ipcidr-no-resolve,💬 即时通讯,no-resolve"
- "RULE-SET,scki-fused-032-im-residual,💬 即时通讯"
- "RULE-SET,scki-fused-033-social-domain,📱 社交媒体"
- "RULE-SET,scki-fused-033-social-ipcidr,📱 社交媒体"
- "RULE-SET,scki-fused-033-social-ipcidr-no-resolve,📱 社交媒体,no-resolve"
- "RULE-SET,scki-fused-033-social-residual,📱 社交媒体"
- "RULE-SET,scki-fused-034-cn-site-domain,🏠 国内网站"
- "RULE-SET,scki-fused-035-social-domain,📱 社交媒体"
- "RULE-SET,scki-fused-036-work-domain,🧑‍💼 会议协作"
- "RULE-SET,scki-fused-036-work-ipcidr,🧑‍💼 会议协作"
- "RULE-SET,scki-fused-036-work-residual,🧑‍💼 会议协作"
- "RULE-SET,scki-fused-037-direct-domain,DIRECT"
- "RULE-SET,scki-fused-038-cnmedia-domain,📺 国内流媒体"
- "RULE-SET,scki-fused-039-tiktok-domain,🎵 TikTok"
- "RULE-SET,scki-fused-040-youtube-domain,📹 YouTube"
- "RULE-SET,scki-fused-041-netflix-domain,🎥 Netflix"
- "RULE-SET,scki-fused-041-netflix-ipcidr-no-resolve,🎥 Netflix,no-resolve"
- "RULE-SET,scki-fused-042-disney-domain,🎬 Disney+"
- "RULE-SET,scki-fused-042-disney-residual,🎬 Disney+"
- "RULE-SET,scki-fused-043-hbo-max-domain,📡 HBO/Max"
- "RULE-SET,scki-fused-043-hbo-max-residual,📡 HBO/Max"
- "RULE-SET,scki-fused-044-hulu-domain,📺 Hulu"
- "RULE-SET,scki-fused-044-hulu-residual,📺 Hulu"
- "RULE-SET,scki-fused-045-prime-video-domain,🎬 Prime Video"
- "RULE-SET,scki-fused-045-prime-video-ipcidr,🎬 Prime Video"
- "RULE-SET,scki-fused-045-prime-video-residual,🎬 Prime Video"
- "RULE-SET,scki-fused-046-music-domain,🎵 音乐流媒体"
- "RULE-SET,scki-fused-046-music-ipcidr,🎵 音乐流媒体"
- "RULE-SET,scki-fused-047-stream-hk-domain,🇭🇰 香港流媒体"
- "RULE-SET,scki-fused-047-stream-hk-ipcidr-no-resolve,🇭🇰 香港流媒体,no-resolve"
- "RULE-SET,scki-fused-047-stream-hk-residual,🇭🇰 香港流媒体"
- "RULE-SET,scki-fused-048-stream-tw-domain,🇹🇼 台湾流媒体"
- "RULE-SET,scki-fused-048-stream-tw-residual,🇹🇼 台湾流媒体"
- "RULE-SET,scki-fused-049-stream-jpkr-domain,🇯🇵 日韩流媒体"
- "RULE-SET,scki-fused-049-stream-jpkr-ipcidr,🇯🇵 日韩流媒体"
- "RULE-SET,scki-fused-049-stream-jpkr-residual,🇯🇵 日韩流媒体"
- "RULE-SET,scki-fused-050-stream-eu-domain,🇪🇺 欧洲流媒体"
- "RULE-SET,scki-fused-050-stream-eu-residual,🇪🇺 欧洲流媒体"
- "RULE-SET,scki-fused-051-stream-other-domain,🌐 其他国外流媒体"
- "RULE-SET,scki-fused-051-stream-other-ipcidr,🌐 其他国外流媒体"
- "RULE-SET,scki-fused-051-stream-other-residual,🌐 其他国外流媒体"
- "RULE-SET,scki-fused-052-tools-domain,🔧 工具与服务"
- "RULE-SET,scki-fused-053-google-domain,🔍 Google 服务"
- "RULE-SET,scki-fused-054-tools-domain,🔧 工具与服务"
- "RULE-SET,scki-fused-054-tools-ipcidr,🔧 工具与服务"
- "RULE-SET,scki-fused-054-tools-residual,🔧 工具与服务"
- "RULE-SET,scki-fused-055-microsoft-domain,Ⓜ️ 微软服务"
- "RULE-SET,scki-fused-055-microsoft-residual,Ⓜ️ 微软服务"
- "RULE-SET,scki-fused-056-apple-domain,🍎 苹果服务"
- "RULE-SET,scki-fused-056-apple-ipcidr,🍎 苹果服务"
- "RULE-SET,scki-fused-056-apple-residual,🍎 苹果服务"
- "RULE-SET,scki-fused-057-download-domain,📥 下载更新"
- "RULE-SET,scki-fused-057-download-ipcidr,📥 下载更新"
- "RULE-SET,scki-fused-057-download-residual,📥 下载更新"
- "RULE-SET,scki-fused-058-tracker-domain,🛰️ BT/PT Tracker"
- "RULE-SET,scki-fused-058-tracker-ipcidr,🛰️ BT/PT Tracker"
- "RULE-SET,scki-fused-058-tracker-residual,🛰️ BT/PT Tracker"
- "RULE-SET,scki-fused-059-gfw-domain,🚫 受限网站"
- "RULE-SET,scki-fused-059-gfw-ipcidr-no-resolve,🚫 受限网站,no-resolve"
- "RULE-SET,scki-fused-059-gfw-residual,🚫 受限网站"
- "RULE-SET,scki-fused-060-game-cn-domain,🕹️ 国内游戏"
- "RULE-SET,scki-fused-061-game-intl-domain,🎮 国外游戏"
- "RULE-SET,scki-fused-061-game-intl-ipcidr,🎮 国外游戏"
- "RULE-SET,scki-fused-061-game-intl-residual,🎮 国外游戏"
- "RULE-SET,scki-fused-062-intl-site-domain,🌐 国外网站"
- "RULE-SET,scki-fused-062-intl-site-ipcidr,🌐 国外网站"
- "RULE-SET,scki-fused-062-intl-site-residual,🌐 国外网站"
- "RULE-SET,scki-fused-063-payments-domain,🏦 金融支付"
- "RULE-SET,scki-fused-064-cnmedia-domain,📺 国内流媒体"
- "RULE-SET,scki-fused-064-cnmedia-ipcidr,📺 国内流媒体"
- "RULE-SET,scki-fused-064-cnmedia-residual,📺 国内流媒体"
- "RULE-SET,scki-fused-065-cn-site-domain,🏠 国内网站"
- "RULE-SET,scki-fused-065-cn-site-ipcidr-no-resolve,🏠 国内网站,no-resolve"
- "RULE-SET,scki-fused-066-direct-domain,DIRECT"
- "RULE-SET,scki-fused-067-cn-site-domain,🏠 国内网站"
- "RULE-SET,scki-fused-067-cn-site-residual,🏠 国内网站"
- "RULE-SET,scki-fused-068-intl-site-domain,🌐 国外网站"
- "RULE-SET,scki-fused-068-intl-site-ipcidr,🌐 国外网站"
- "RULE-SET,scki-fused-068-intl-site-ipcidr-no-resolve,🌐 国外网站,no-resolve"
- "RULE-SET,scki-fused-068-intl-site-residual,🌐 国外网站"
- "RULE-SET,scki-fused-069-im-residual,💬 即时通讯"
- "RULE-SET,scki-fused-070-netflix-residual,🎥 Netflix"
- "RULE-SET,scki-fused-071-social-residual,📱 社交媒体"
- "RULE-SET,scki-fused-072-google-residual,🔍 Google 服务"
- "MATCH,🐟 漏网之鱼"

OVERRIDE_EOF


# ============================================================================
# Ruby Script — 节点过滤、区域分类、url-test 组生成、TLS 指纹注入
# ★ 核心架构：22 个区域组（11 全部 + 11 家宽）type: url-test + include-all-proxies/explicit proxies ★
# ============================================================================
cat > "$RUBY_SCRIPT" << 'RUBY_EOF'
#!/usr/bin/env ruby
# encoding: utf-8
require 'yaml'
require 'digest'

VERSION = "v6.0.14-oc-normal.9"

STATUS_LOG = ARGV[2]
def status(msg); File.open(STATUS_LOG, 'a') { |f| f.puts(msg) }; end

config_path   = ARGV[0]
override_path = ARGV[1]

config   = YAML.load_file(config_path, permitted_classes: [Symbol], aliases: true)
override = YAML.load_file(override_path, permitted_classes: [Symbol], aliases: true)

# >>> SCKI NODE DNS HINTS: BEGIN — generated from tools/runtime/subscription-adapter-profiles.json + tools/runtime/node-dns-hints.rb; edit the runtime Module, then run this synchronizer.
# Generated from tools/runtime/subscription-adapter-profiles.json; do not edit in adapters.
module SckiSubscriptionAdapterProfiles
  DEFAULT = "adaptive".freeze
  MODES = {
    "off" => { "id" => "off".freeze, "node_dns_projection" => "off".freeze }.freeze,
    "policy" => { "id" => "policy".freeze, "node_dns_projection" => "policy".freeze }.freeze,
    "adaptive" => { "id" => "adaptive".freeze, "node_dns_projection" => "adaptive".freeze }.freeze
  }.freeze

  module_function

  def resolve(requested_profile)
    requested = requested_profile.is_a?(String) ? requested_profile : ""
    selected = MODES.fetch(requested, MODES.fetch(DEFAULT))
    { "id" => selected.fetch("id"), "node_dns_projection" => selected.fetch("node_dns_projection") }.freeze
  end
end

# Subscription Adapter Module — embedded verbatim into OpenClash Ruby adapters.
#
# Interface:
#   SckiSubscriptionAdapter.capture_node_dns(source, active_servers, profile)
#   SckiSubscriptionAdapter.apply_node_dns(repository, snapshot, profile)
#
# The generated profile fragment supplies SckiSubscriptionAdapterProfiles.

module SckiSubscriptionAdapter
  module_function

  NODE_DNS_HINT_LIMITS = {
    active_node_servers: 512,
    domains: 128,
    resolvers: 64,
    policies: 64,
    hosts: 64,
    values: 8,
    source_entries: 256,
    source_exact_entries: 4096,
    string_length: 512,
  }.freeze

  def plain_hash?(value)
    value.is_a?(Hash)
  end

  def record_reject(snapshot, count = 1)
    snapshot.fetch("stats")["rejected"] += count
  end

  def push_unique(list, value)
    return false if list.any? { |entry| yield(entry) == yield(value) }

    list << value
    true
  end

  def ipv4?(value)
    parts = value.to_s.split(".")
    return false unless parts.length == 4

    parts.all? { |part| part.match?(/\A\d{1,3}\z/) && part.to_i.between?(0, 255) }
  end

  def ipv6?(value)
    text = value.to_s
    match = text.match(/\A\[([0-9a-fA-F:.]+)\]\z/)
    text = match[1] if match
    return false if text.empty? || !text.match?(/\A[0-9a-fA-F:.]+\z/) || !text.include?(":") || text.include?(":::")

    last_colon = text.rindex(":")
    ipv4_tail = last_colon ? text[(last_colon + 1)..] : ""
    if ipv4_tail.include?(".")
      return false unless ipv4?(ipv4_tail)

      text = "#{text[0..last_colon]}0:0"
    end

    compressed_at = text.index("::")
    return false if compressed_at && text.index("::", compressed_at + 2)

    groups = text.split(":").reject(&:empty?)
    return false unless groups.all? { |group| group.match?(/\A[0-9a-fA-F]{1,4}\z/) }

    compressed_at ? groups.length < 8 : groups.length == 8
  end

  def unbracket_ipv6(value)
    text = value.to_s
    text.start_with?("[") && text.end_with?("]") ? text[1..-2] : text
  end

  def normalize_domain(value)
    return "" unless value.is_a?(String)
    return "" if value.length > NODE_DNS_HINT_LIMITS[:string_length]

    domain = value.strip.downcase.sub(/\.+\z/, "")
    return "" if domain.empty? || domain.length > NODE_DNS_HINT_LIMITS[:string_length] || domain.length > 253 || domain.match?(/[\x00-\x20\\\/@:?#\[\]]/)
    return "" if domain == "localhost" || domain.match?(/\A\d+(?:\.\d+){3}\z/)

    labels = domain.split(".")
    return "" unless labels.all? { |label| label.match?(/\A[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\z/) }

    domain
  end

  def normalize_resolver(value)
    return "" unless value.is_a?(String)
    return "" if value.length > NODE_DNS_HINT_LIMITS[:string_length]

    resolver = value.strip
    return "" if resolver.empty? || resolver.length > NODE_DNS_HINT_LIMITS[:string_length] || resolver.match?(/[\x00-\x20]/)
    return "" if resolver.include?("#") || resolver.match?(/\A(?:system|dhcp)\z/i) || resolver.match?(/\Arcode:/i)
    return "" if resolver.match?(/[?&](?:skip-cert-verify|ecs|h3)=/i)
    return resolver.downcase if ipv4?(resolver)
    return unbracket_ipv6(resolver).downcase if ipv6?(resolver)

    raw_domain = normalize_domain(resolver)
    return raw_domain unless raw_domain.empty?

    match = resolver.match(/\A(udp|tcp|tls|https|quic):\/\/(\[[0-9a-fA-F:.]+\]|[A-Za-z0-9.-]+)(?::(\d{1,5}))?(\/[^\s]*)?\z/i)
    return "" unless match

    port = match[3]&.to_i
    return "" if port && !port.between?(1, 65_535)

    host = match[2]
    host = unbracket_ipv6(host).downcase if ipv6?(host)
    unless ipv6?(host) || ipv4?(host)
      host = normalize_domain(host)
      return "" if host.empty?
    end
    "#{match[1].downcase}://#{host}#{match[3] ? ":#{match[3]}" : ""}#{match[4] || ""}"
  end

  def resolver_host(value)
    resolver = value.to_s
    return "" if ipv4?(resolver) || ipv6?(resolver)

    raw_domain = normalize_domain(resolver)
    return raw_domain unless raw_domain.empty?

    match = resolver.match(/\A(?:udp|tcp|tls|https|quic):\/\/(\[[0-9a-fA-F:.]+\]|[A-Za-z0-9.-]+)(?::\d{1,5})?(?:\/[^\s]*)?\z/i)
    return "" unless match
    return "" if ipv4?(match[1]) || ipv6?(match[1])

    normalize_domain(match[1])
  end

  def normalize_resolver_list(value, snapshot)
    raw_values = value.is_a?(Array) ? value : (value.is_a?(String) ? [value] : [])
    unless value.is_a?(Array) || value.is_a?(String)
      record_reject(snapshot)
      return []
    end

    output = []
    raw_values.take(NODE_DNS_HINT_LIMITS[:values]).each do |entry|
      resolver = normalize_resolver(entry)
      if resolver.empty?
        record_reject(snapshot)
        next
      end
      # normalize_resolver lower-cases only scheme and hostname. Keep URL
      # path/query exact because they can be case-sensitive.
      push_unique(output, resolver) { |item| item }
    end
    record_reject(snapshot, raw_values.length - NODE_DNS_HINT_LIMITS[:values]) if raw_values.length > NODE_DNS_HINT_LIMITS[:values]
    output
  end

  def normalize_host_values(value, snapshot)
    raw_values = value.is_a?(Array) ? value : (value.is_a?(String) ? [value] : [])
    unless value.is_a?(Array) || value.is_a?(String)
      record_reject(snapshot)
      return nil
    end

    ip_values = []
    redirects = []
    raw_values.take(NODE_DNS_HINT_LIMITS[:values]).each do |entry|
      unless entry.is_a?(String)
        record_reject(snapshot)
        next
      end
      if entry.length > NODE_DNS_HINT_LIMITS[:string_length]
        record_reject(snapshot)
        next
      end
      host = entry.strip
      ipv6_literal = ipv6?(host)
      # IPv6 literals may be bracketed. Other URL/control syntax is rejected.
      if host.empty? || host.length > NODE_DNS_HINT_LIMITS[:string_length] || (!ipv6_literal && host.match?(/[\x00-\x20\\\/@?#\[\]]/))
        record_reject(snapshot)
        next
      end
      if ipv6_literal
        host = unbracket_ipv6(host).downcase
        push_unique(ip_values, host) { |item| item.downcase }
      elsif ipv4?(host)
        push_unique(ip_values, host) { |item| item.downcase }
      else
        host = normalize_domain(host)
        if host.empty?
          record_reject(snapshot)
          next
        end
        push_unique(redirects, host) { |item| item.downcase }
      end
    end
    record_reject(snapshot, raw_values.length - NODE_DNS_HINT_LIMITS[:values]) if raw_values.length > NODE_DNS_HINT_LIMITS[:values]
    if redirects.any?
      return redirects.first if redirects.length == 1 && ip_values.empty?

      record_reject(snapshot)
      return nil
    end
    ip_values.any? ? ip_values : nil
  end

  def normalize_pattern(value)
    return "" unless value.is_a?(String)
    return "" if value.length > NODE_DNS_HINT_LIMITS[:string_length]

    pattern = value.strip.downcase.sub(/\.+\z/, "")
    return "" if pattern.empty? || pattern.length > 253 || pattern.match?(/[\x00-\x20\\\/@:?#\[\]]/) || pattern == "*"
    return normalize_domain(pattern[2..]).empty? ? "" : pattern if pattern.start_with?("+.")
    return normalize_domain(pattern[1..]).empty? ? "" : pattern if pattern.start_with?(".")

    if pattern.include?("*")
      labels = pattern.split(".")
      return "" if labels.length < 2
      return "" unless labels.all? { |label| label == "*" || label.match?(/\A[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\z/) }

      return pattern
    end
    normalize_domain(pattern)
  end

  def pattern_matches?(pattern, domain)
    if pattern.start_with?("+.")
      base = pattern[2..]
      return domain == base || domain.end_with?(".#{base}")
    end
    if pattern.start_with?(".")
      base = pattern[1..]
      return domain != base && domain.end_with?(".#{base}")
    end
    if pattern.include?("*")
      pattern_labels = pattern.split(".")
      domain_labels = domain.split(".")
      return false unless pattern_labels.length == domain_labels.length

      return pattern_labels.zip(domain_labels).all? { |expected, actual| expected == "*" || expected == actual }
    end
    pattern == domain
  end

  def pattern_score(pattern)
    return 3_000 + (pattern.split(".").length * 10) + pattern.delete("*").length if pattern.include?("*")
    return 2_000 + pattern.length if pattern.start_with?("+.") || pattern.start_with?(".")

    10_000 + pattern.length
  end

  def same_values?(left, right)
    if left.is_a?(Array) || right.is_a?(Array)
      return false unless left.is_a?(Array) && right.is_a?(Array) && left.length == right.length

      return left.zip(right).all? { |a, b| a.to_s == b.to_s }
    end
    left.is_a?(String) && right.is_a?(String) && left == right
  end

  def has_values?(value)
    value.is_a?(Array) ? value.any? : (value.is_a?(String) && !value.empty?)
  end

  def copy_value(value)
    value.is_a?(Array) ? value.dup : value
  end

  def exact_pattern?(pattern)
    !pattern.include?("*") && !pattern.start_with?("+.") && !pattern.start_with?(".")
  end

  def build_source_view(source, active_domains, snapshot)
    return {} unless plain_hash?(source)

    view = {}
    active = {}
    active_domains.each do |domain|
      active[domain] = true
      view[domain] = source[domain] if source.key?(domain)
      dotted = "#{domain}."
      view[dotted] = source[dotted] if source.key?(dotted) && !view.key?(dotted)
    end
    # Avoid source.keys: it allocates the whole untrusted map before a cap can
    # take effect. The wider bounded pass preserves case-insensitive exact
    # active-node keys; wildcard matching remains on the tighter cap.
    scanned_entries = 0
    wildcard_entries = 0
    source.each_pair do |raw_pattern, raw_value|
      scanned_entries += 1
      if scanned_entries > NODE_DNS_HINT_LIMITS[:source_exact_entries]
        record_reject(snapshot)
        break
      end
      pattern = normalize_pattern(raw_pattern)
      if pattern.empty?
        record_reject(snapshot)
        next
      end
      if exact_pattern?(pattern)
        view[raw_pattern] = raw_value if active[pattern]
        next
      end
      if wildcard_entries >= NODE_DNS_HINT_LIMITS[:source_entries]
        record_reject(snapshot)
        next
      end
      wildcard_entries += 1

      view[raw_pattern] = raw_value
    end
    view
  end

  def select_for_domain(source, domain, snapshot)
    return { "matched" => false, "value" => nil } unless plain_hash?(source)

    best = nil
    best_score = -1
    conflict = false
    matched = false
    source.each do |raw_pattern, raw_value|
      pattern = normalize_pattern(raw_pattern)
      next if pattern.empty? || !pattern_matches?(pattern, domain)

      matched = true
      values = yield(raw_value, snapshot)
      next unless has_values?(values)

      score = pattern_score(pattern)
      if score > best_score
        best = copy_value(values)
        best_score = score
        conflict = false
      elsif score == best_score && !same_values?(best, values)
        conflict = true
      end
    end
    if conflict
      record_reject(snapshot)
      return { "matched" => true, "value" => nil }
    end
    { "matched" => matched, "value" => best }
  end

  def resolve_profile(runtime_profile)
    requested = if runtime_profile.is_a?(String)
                  runtime_profile
                elsif plain_hash?(runtime_profile) && runtime_profile["id"].is_a?(String)
                  runtime_profile["id"]
                else
                  ""
                end
    SckiSubscriptionAdapterProfiles.resolve(requested)
  end

  def create_snapshot(profile)
    {
      "profile" => profile.fetch("id"),
      "domains" => [],
      "resolvers" => [],
      "policy" => {},
      "hosts" => {},
      "stats" => { "domains" => 0, "resolvers" => 0, "policies" => 0, "hosts" => 0, "rejected" => 0 },
    }
  end

  def add_policy(snapshot, domain, values)
    new_resolvers = []
    values.each do |resolver|
      known = snapshot.fetch("resolvers").any? { |entry| entry == resolver } || new_resolvers.any? { |entry| entry == resolver }
      new_resolvers << resolver unless known
    end
    if snapshot.fetch("resolvers").length + new_resolvers.length > NODE_DNS_HINT_LIMITS[:resolvers]
      record_reject(snapshot, values.length)
      return false
    end
    snapshot.fetch("policy")[domain] = values.dup
    snapshot.fetch("resolvers").concat(new_resolvers)
    true
  end

  def capture_node_dns(source_config, active_node_servers, runtime_profile)
    profile = resolve_profile(runtime_profile)
    snapshot = create_snapshot(profile)
    return snapshot if profile.fetch("node_dns_projection") == "off"
    return snapshot unless source_config.is_a?(Hash) && active_node_servers.is_a?(Array)

    servers = active_node_servers.take(NODE_DNS_HINT_LIMITS[:active_node_servers])
    record_reject(snapshot, active_node_servers.length - NODE_DNS_HINT_LIMITS[:active_node_servers]) if active_node_servers.length > NODE_DNS_HINT_LIMITS[:active_node_servers]
    servers.each do |server|
      domain = normalize_domain(server)
      next if domain.empty?
      if snapshot.fetch("domains").length >= NODE_DNS_HINT_LIMITS[:domains]
        record_reject(snapshot)
        next
      end
      push_unique(snapshot.fetch("domains"), domain) { |item| item }
    end
    snapshot.fetch("stats")["domains"] = snapshot.fetch("domains").length
    return snapshot if snapshot.fetch("domains").empty?

    source_dns = plain_hash?(source_config["dns"]) ? source_config["dns"] : {}
    source_proxy_resolvers = profile.fetch("node_dns_projection") == "adaptive" && source_dns.key?("proxy-server-nameserver") ? normalize_resolver_list(source_dns["proxy-server-nameserver"], snapshot) : []
    source_node_policy = build_source_view(source_dns["proxy-server-nameserver-policy"], snapshot.fetch("domains"), snapshot)
    source_global_policy = build_source_view(source_dns["nameserver-policy"], snapshot.fetch("domains"), snapshot)

    snapshot.fetch("domains").each do |domain|
      if snapshot.fetch("policy").length >= NODE_DNS_HINT_LIMITS[:policies]
        record_reject(snapshot)
        next
      end
      selection = select_for_domain(source_node_policy, domain, snapshot) { |value, state| normalize_resolver_list(value, state) }
      selection = select_for_domain(source_global_policy, domain, snapshot) { |value, state| normalize_resolver_list(value, state) } unless selection.fetch("matched")
      if !selection.fetch("matched") && profile.fetch("node_dns_projection") == "adaptive" && source_proxy_resolvers.any?
        selection = { "matched" => true, "value" => source_proxy_resolvers.dup }
      end
      next unless has_values?(selection.fetch("value"))

      add_policy(snapshot, domain, selection.fetch("value"))
    end

    host_targets = []
    snapshot.fetch("resolvers").each do |resolver|
      host = resolver_host(resolver)
      push_unique(host_targets, host) { |item| item } unless host.empty?
    end
    snapshot.fetch("policy").keys.each { |domain| push_unique(host_targets, domain) { |item| item } }
    source_hosts = build_source_view(source_config["hosts"], host_targets, snapshot)
    host_targets.each do |domain|
      if snapshot.fetch("hosts").length >= NODE_DNS_HINT_LIMITS[:hosts]
        record_reject(snapshot)
        next
      end
      selection = select_for_domain(source_hosts, domain, snapshot) { |value, state| normalize_host_values(value, state) }
      snapshot.fetch("hosts")[domain] = copy_value(selection.fetch("value")) if has_values?(selection.fetch("value"))
    end

    snapshot.fetch("stats")["resolvers"] = snapshot.fetch("resolvers").length
    snapshot.fetch("stats")["policies"] = snapshot.fetch("policy").length
    snapshot.fetch("stats")["hosts"] = snapshot.fetch("hosts").length
    snapshot
  end

  def repository_pss_baseline?(dns)
    values = dns && dns["proxy-server-nameserver"]
    return values.strip.length.positive? if values.is_a?(String)

    values.is_a?(Array) && values.any? { |value| value.is_a?(String) && value.strip.length.positive? }
  end

  def build_report(profile, snapshot, applied, reason)
    stats = snapshot.is_a?(Hash) && plain_hash?(snapshot["stats"]) ? snapshot["stats"] : {}
    {
      "profile" => profile.fetch("id"),
      "mode" => profile.fetch("node_dns_projection"),
      "applied" => !!applied,
      "reason" => reason,
      "domains" => stats.fetch("domains", 0).to_i,
      "resolvers" => stats.fetch("resolvers", 0).to_i,
      "policies" => stats.fetch("policies", 0).to_i,
      "hosts" => stats.fetch("hosts", 0).to_i,
      "rejected" => stats.fetch("rejected", 0).to_i,
    }
  end

  # capture_node_dns produces an opaque snapshot, but apply_node_dns validates
  # its declared active-node domain closure before mutating repository-owned
  # DNS. This keeps the public seam fail-closed if a future Adapter passes a
  # stale or hand-built Hash.
  def canonical_resolver_values?(values)
    return false unless values.is_a?(Array) && values.any? && values.length <= NODE_DNS_HINT_LIMITS[:values]

    seen = {}
    values.each do |value|
      return false unless value.is_a?(String) && normalize_resolver(value) == value
      return false if seen[value]

      seen[value] = true
    end
    true
  end

  def canonical_host_value?(value)
    scratch = { "stats" => { "rejected" => 0 } }
    normalized = normalize_host_values(value, scratch)
    scratch.fetch("stats").fetch("rejected").zero? && has_values?(normalized) && same_values?(normalized, value)
  end

  def validate_snapshot(snapshot, profile)
    return { "ok" => false, "reason" => "invalid-snapshot" } unless plain_hash?(snapshot) && plain_hash?(snapshot["policy"]) && plain_hash?(snapshot["hosts"])
    return { "ok" => false, "reason" => "profile-mismatch" } unless snapshot["profile"] == profile.fetch("id")
    return { "ok" => false, "reason" => "invalid-snapshot" } unless snapshot["domains"].is_a?(Array) && snapshot.fetch("domains").length <= NODE_DNS_HINT_LIMITS[:domains]

    active_domains = {}
    snapshot.fetch("domains").each do |active_domain|
      return { "ok" => false, "reason" => "invalid-snapshot" } unless active_domain.is_a?(String) && normalize_domain(active_domain) == active_domain && !active_domains[active_domain]

      active_domains[active_domain] = true
    end

    policy_keys = []
    allowed_host_domains = {}
    snapshot.fetch("policy").each_pair do |domain, values|
      return { "ok" => false, "reason" => "invalid-snapshot" } if policy_keys.length >= NODE_DNS_HINT_LIMITS[:policies] || !active_domains[domain] || normalize_domain(domain) != domain || !canonical_resolver_values?(values)

      policy_keys << domain
      allowed_host_domains[domain] = true
      values.each do |resolver|
        resolver_domain = resolver_host(resolver)
        allowed_host_domains[resolver_domain] = true unless resolver_domain.empty?
      end
    end
    host_keys = []
    snapshot.fetch("hosts").each_pair do |domain, value|
      return { "ok" => false, "reason" => "invalid-snapshot" } if host_keys.length >= NODE_DNS_HINT_LIMITS[:hosts] || !allowed_host_domains[domain] || normalize_domain(domain) != domain || !canonical_host_value?(value)

      host_keys << domain
    end
    { "ok" => true, "policy_keys" => policy_keys, "host_keys" => host_keys }
  end

  def apply_node_dns(repository_config, snapshot, runtime_profile)
    profile = resolve_profile(runtime_profile)
    return build_report(profile, snapshot, false, "profile-off") if profile.fetch("node_dns_projection") == "off"
    return build_report(profile, snapshot, false, "invalid-repository-config") unless plain_hash?(repository_config) && plain_hash?(repository_config["dns"])
    return build_report(profile, snapshot, false, "missing-pss-baseline") unless repository_pss_baseline?(repository_config["dns"])
    validation = validate_snapshot(snapshot, profile)
    return build_report(profile, snapshot, false, validation.fetch("reason")) unless validation.fetch("ok")

    policy_keys = validation.fetch("policy_keys")
    host_keys = validation.fetch("host_keys")
    return build_report(profile, snapshot, false, "no-hints") if policy_keys.empty? && host_keys.empty?

    if policy_keys.any?
      repository_config.fetch("dns")["proxy-server-nameserver-policy"] = {}
      policy_keys.each { |domain| repository_config.fetch("dns")["proxy-server-nameserver-policy"][domain] = snapshot.fetch("policy").fetch(domain).dup }
    else
      repository_config.fetch("dns").delete("proxy-server-nameserver-policy")
    end
    repository_config["hosts"] = {} unless plain_hash?(repository_config["hosts"])
    host_keys.each do |domain|
      repository_config.fetch("hosts")[domain] = copy_value(snapshot.fetch("hosts").fetch(domain)) unless repository_config.fetch("hosts").key?(domain)
    end
    build_report(profile, snapshot, true, "applied")
  end

  private_class_method :plain_hash?, :record_reject, :push_unique, :ipv4?, :ipv6?, :unbracket_ipv6,
                       :normalize_domain, :normalize_resolver, :resolver_host, :normalize_resolver_list,
                       :normalize_host_values, :normalize_pattern, :pattern_matches?, :pattern_score,
                       :same_values?, :has_values?, :copy_value, :exact_pattern?, :build_source_view,
                       :select_for_domain, :create_snapshot, :add_policy, :repository_pss_baseline?, :build_report,
                       :canonical_resolver_values?, :canonical_host_value?, :validate_snapshot
end
# <<< SCKI NODE DNS HINTS: END

# ---------------------------------------------------------------
# Phase 1a: 过滤节点（仅去信息节点；保留倍率节点）+ 家宽识别
# ---------------------------------------------------------------
# >>> SCKI SUBSCRIPTION NODE FILTER: BEGIN
# Subscription node validation and conservative filtering for OpenClash.
# Embedded verbatim in both shell adapters by sync-openclash-node-filter.js.
module SckiSubscriptionNodeFilter
  INFO_CN = %w[导航网址 距离下次重置 剩余流量 套餐到期 网址导航 官网 订阅 到期 剩余 重置 免费 试用 应急 已用流量 到期时间 下次重置].freeze
  INFO_EN = /(?<![A-Za-z0-9_])(?:USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Sign|Login|Register|Help|FAQ)(?![A-Za-z0-9_])/i
  TOKEN_EDGE = '[[:space:]|/()\[\]{}【】（）,，;；:_·｜]'.freeze
  NUMBER = '(?:[0-9]+(?:\.[0-9]+)?)'.freeze
  EXPLICIT_MULTIPLIER = [
    Regexp.new("(?:\\A|#{TOKEN_EDGE})[xX×]\\s*(#{NUMBER})(?=\\z|#{TOKEN_EDGE})"),
    Regexp.new("(?:\\A|#{TOKEN_EDGE})(#{NUMBER})\\s*[xX×倍](?=\\z|#{TOKEN_EDGE})"),
    Regexp.new("(?:\\A|#{TOKEN_EDGE})倍率\\s*(#{NUMBER})(?=\\z|#{TOKEN_EDGE})")
  ].freeze
  UNCERTAIN_MULTIPLIER = Regexp.new("(?:\\A|#{TOKEN_EDGE})(?:[xX×]\\s*(?:\\?|未知|unknown|nan|∞)|\\?\\s*[xX×倍]|倍率\\s*(?:\\?|未知|unknown|nan|∞))(?=\\z|#{TOKEN_EDGE})", Regexp::IGNORECASE)
  BUILTIN_NAMES = %w[DIRECT REJECT REJECT-DROP PASS COMPATIBLE].freeze
  RESERVED_NAMES = (BUILTIN_NAMES + %w[GLOBAL]).freeze

  module_function

  def max_multiplier(value)
    return nil if value.nil? || value == ''
    raise ArgumentError, 'invalid SCKI_MAX_NODE_MULTIPLIER' unless value.is_a?(String) && value.match?(/\A(?:\d+(?:\.\d+)?|\.\d+)\z/)
    number = Float(value)
    raise ArgumentError, 'invalid SCKI_MAX_NODE_MULTIPLIER' unless number.finite? && number.positive?
    number
  end

  def info_node?(name)
    INFO_CN.any? { |keyword| name.include?(keyword) } || name.match?(INFO_EN)
  end

  def multiplier(name)
    return nil if name.match?(UNCERTAIN_MULTIPLIER)
    numbers = EXPLICIT_MULTIPLIER.flat_map do |pattern|
      name.scan(pattern).flatten.map { |text| Float(text) }
    end
    return nil if numbers.empty? || numbers.any? { |number| !number.finite? || !number.positive? }
    unique = numbers.uniq
    unique.length == 1 ? unique.first : nil
  end

  def fingerprint(value, parents = [], depth = 0)
    raise ArgumentError, 'invalid proxy structure' if depth > 32
    case value
    when Hash
      raise ArgumentError, 'invalid proxy structure' if parents.include?(value.object_id) || !value.keys.all? { |key| key.is_a?(String) }
      next_parents = parents + [value.object_id]
      ['hash', value.keys.sort.map { |key| [key, fingerprint(value.fetch(key), next_parents, depth + 1)] }]
    when Array
      raise ArgumentError, 'invalid proxy structure' if parents.include?(value.object_id)
      next_parents = parents + [value.object_id]
      ['array', value.map { |item| fingerprint(item, next_parents, depth + 1) }]
    when String, Integer, TrueClass, FalseClass, NilClass
      [value.class.name, value]
    when Float
      raise ArgumentError, 'invalid proxy structure' unless value.finite?
      ['Float', value]
    else
      raise ArgumentError, 'invalid proxy structure'
    end
  end

  def validate_and_filter(config, override, requested_limit, region_names)
    raise ArgumentError, 'invalid config' unless config.is_a?(Hash)
    raise ArgumentError, 'invalid override' unless override.is_a?(Hash)
    limit = max_multiplier(requested_limit)
    providers = config['proxy-providers']
    raise ArgumentError, 'provider subscription requires flattening' unless providers.nil? || providers == {}
    proxies = config['proxies']
    raise ArgumentError, 'invalid proxies list' unless proxies.is_a?(Array)
    source = proxies
    groups = override['proxy-groups']
    raise ArgumentError, 'invalid override groups' unless groups.is_a?(Array) && groups.all? { |group| group.is_a?(Hash) && group['name'].is_a?(String) && !group['name'].empty? }
    reserved = (groups.map { |group| group['name'] } + region_names + RESERVED_NAMES).uniq
    by_name = {}
    distinct = []
    source.each do |proxy|
      raise ArgumentError, 'invalid proxy entry' unless proxy.is_a?(Hash)
      name = proxy['name']
      type = proxy['type']
      raise ArgumentError, 'invalid proxy name or type' unless name.is_a?(String) && !name.strip.empty? && type.is_a?(String) && !type.strip.empty?
      raise ArgumentError, 'invalid proxy flow' if proxy.key?('flow') && !proxy['flow'].is_a?(String)
      raise ArgumentError, 'proxy name conflicts with group or builtin' if reserved.include?(name)
      signature = fingerprint(proxy)
      if by_name.key?(name)
        raise ArgumentError, 'ambiguous duplicate proxy name' unless by_name[name] == signature
      else
        by_name[name] = signature
        distinct << proxy
      end
    end
    kept = distinct.reject do |proxy|
      name = proxy.fetch('name')
      info_node?(name) || (limit && (factor = multiplier(name)) && factor > limit)
    end
    kept_by_name = kept.to_h { |proxy| [proxy.fetch('name'), proxy] }
    kept.each do |proxy|
      dependency = proxy['dialer-proxy']
      next unless proxy.key?('dialer-proxy')
      raise ArgumentError, 'invalid dialer-proxy' unless dependency.is_a?(String) && !dependency.empty?
      raise ArgumentError, 'dangling dialer-proxy after filtering' unless kept_by_name.key?(dependency) || BUILTIN_NAMES.include?(dependency)
    end
    # A valid reference can still create a cycle; walk each chain once without recursion.
    state = {}
    kept.each do |proxy|
      current = proxy.fetch('name')
      trail = []
      while kept_by_name.key?(current) && state[current] != :done
        raise ArgumentError, 'cyclic dialer-proxy dependency' if state[current] == :active
        state[current] = :active
        trail << current
        current = kept_by_name.fetch(current)['dialer-proxy']
      end
      trail.each { |name| state[name] = :done }
    end
    [kept, { 'source' => source.length, 'distinct' => distinct.length, 'removed' => distinct.length - kept.length, 'limit' => limit }]
  end
end
# <<< SCKI SUBSCRIPTION NODE FILTER: END
RESIDENTIAL_PATTERNS = [
  /家宽|家庭宽带|家庭住宅|住宅宽带|住宅|宽带|专线/,
  /\bresi(?:dential)?\b/i,
  /\bhome(?:\s|-|_)?ip\b/i,
  /\bhome(?:\s|-|_)?broadband\b/i,
  /\bhome\b/i,
  /\bbroadband\b/i,
  /\bisp\b/i,
  /\biplc\b/i,
  /\biepl\b/i,
]

is_residential = ->(name) { RESIDENTIAL_PATTERNS.any? { |pat| name.match?(pat) } }

# ---------------------------------------------------------------
# Phase 1b: 区域分类
# ---------------------------------------------------------------
REGIONS = {
  "HK"  => /香港|港|\bHK\b|HKG|Hong\s?Kong|🇭🇰/i,
  "TW"  => /台湾|台灣|\bTW\b|TWN|Taiwan|🇹🇼/i,
  # v5.4.26 FIX#CN-APAC: 加入 CN 区域（对齐 Clash Party JS 基线 c.CN → apacNodes）
  "CN"  => /中国|大陸|大陆|国内|回国|\bCN\b|CHN|China|mainland/i,
  "JP"  => /日本|\bJP\b|JPN|Japan|🇯🇵|Tokyo|Osaka/i,
  # v5.2.6-oc-normal.1 FIX#24-P0: 补 KOR（KOR 不是 KR 的子串，原始 /KR/ 无法匹配 "KOR 01"）
  #   HK/TW/JP/KR/SG 使用 \b 防误匹配，显式补充 alpha-3 码 HKG/TWN/JPN/KOR/SGP
  #   FIX#KR-WB: KR 补 \bKR\b（裸 /KR/ 在 /i 下误匹配 Ukraine/Krakow/Kraken 等含 kr 串）
  "KR"  => /韩国|韓國|\bKR\b|KOR|Korea|Korean|🇰🇷|Seoul/i,
  "SG"  => /新加坡|\bSG\b|SGP|Singapore|🇸🇬/i,
  "US"  => /美国|美國|\bUS\b|USA|United\s?States|America|🇺🇸|Los\s?Angeles|New\s?York|Seattle|Silicon|San\s?Jose/i,
  "UK"  => /英国|英國|UK\b|GB\b|Britain|London|🇬🇧/i,
  "DE"  => /德国|德國|DE\b|Germany|Frankfurt|🇩🇪/i,
  "FR"  => /法国|法國|FR\b|France|Paris|🇫🇷/i,
  "NL"  => /荷兰|荷蘭|NL\b|Netherlands|Amsterdam|🇳🇱/i,
  "CH"  => /瑞士|CH\b|Switzerland|🇨🇭/i,
  "IT"  => /意大利|義大利|IT\b|Italy|Milan|Rome|🇮🇹|FCO|MXP/i,
  "ES"  => /西班牙|ES\b|Spain|Madrid|Barcelona|🇪🇸|MAD|BCN/i,
  "PT"  => /葡萄牙|PT\b|Portugal|Lisbon|🇵🇹/i,
  "GR"  => /希腊|希臘|GR\b|Greece|Athens|🇬🇷/i,
  "AT"  => /奥地利|奧地利|AT\b|Austria|Vienna|🇦🇹|VIE/i,
  "BE"  => /比利时|比利時|BE\b|Belgium|Brussels|🇧🇪/i,
  "IE"  => /爱尔兰|愛爾蘭|IE\b|Ireland|Dublin|🇮🇪/i,
  "DK"  => /丹麦|丹麥|DK\b|Denmark|Copenhagen|🇩🇰/i,
  "SE"  => /瑞典|SE\b|Sweden|Stockholm|🇸🇪/i,
  "FI"  => /芬兰|芬蘭|FI\b|Finland|Helsinki|🇫🇮/i,
  "NO"  => /挪威|NO\b|Norway|Oslo|🇳🇴/i,
  "PL"  => /波兰|波蘭|PL\b|Poland|Warsaw|🇵🇱|WAW/i,
  "CZ"  => /捷克|CZ\b|Czech|Prague|🇨🇿/i,
  "RO"  => /罗马尼亚|羅馬尼亞|RO\b|Romania|Bucharest|🇷🇴/i,
  "HU"  => /匈牙利|HU\b|Hungary|Budapest|🇭🇺/i,
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

# v5.2.8-oc-normal.3 FIX#28-P0: GROUP_MAP 展平同源 bug
#   原实现每个 code 只落入 GROUP_MAP 的首个命中条目（下方 each/break），导致：
#     • HK/TW/JP/KR 只进香港/台湾/日韩子组，永远进不了 🌏 亚太节点
#     • US 只进美国子组，永远进不了 🌎 美洲节点
#   Clash Party JS 主线语义：区域大组 = 子区域并集（apacNodes = HK+TW+CN+JP+KR+SG+APAC_OTHER）；
#   americasNodes = US+AM）。修复：APAC 扩充至涵盖 HK+TW+CN+JP+KR+SG + 原 APAC_OTHER 集；AM 扩充至
#   包含 US；分类循环移除 break，同一节点可同时进入子区域组与所属大洲组。
#   v5.4.26 FIX#CN-APAC: APAC 加入 "CN"（对齐 Clash Party JS 基线 apacNodes 包含 c.CN）
GROUP_MAP = {
  "HK"     => ["HK"],
  "TW"     => ["TW"],
  "SG"     => ["SG"],
  "JP_KR"  => ["JP", "KR"],
  "US"     => ["US"],
  "EU"     => ["UK", "DE", "FR", "NL", "CH", "IT", "ES", "PT", "GR", "AT", "BE", "IE", "DK", "SE", "FI", "NO", "PL", "CZ", "RO", "HU", "RU"],
  "AM"     => ["US", "CA", "MX", "BR", "AR"],
  "AF"     => ["ZA", "EG", "NG"],
  "APAC"   => ["HK", "TW", "CN", "JP", "KR", "SG", "IN", "TH", "VN", "MY", "ID", "PH", "AU", "NZ", "TR", "AE"],
  "OTHER"  => ["OTHER"],
}
GROUP_NAMES = {
  "HK"    => "🇭🇰 香港节点",
  "TW"    => "🇹🇼 台湾节点",
  "SG"    => "🇸🇬 狮城节点",
  "JP_KR" => "🇯🇵 日韩节点",
  "US"    => "🇺🇸 美国节点",
  "EU"    => "🇪🇺 欧洲节点",
  "AM"    => "🌎 美洲节点",
  "AF"    => "🌍 非洲节点",
  "APAC"  => "🌏 亚太节点",
  "OTHER" => "🌏 其他节点",
}
HOME_GROUP_NAMES = {
  "HK"    => "🏡 香港家宽",
  "TW"    => "🏡 台湾家宽",
  "SG"    => "🏡 狮城家宽",
  "JP_KR" => "🏡 日韩家宽",
  "US"    => "🏡 美国家宽",
  "EU"    => "🏡 欧洲家宽",
  "AM"    => "🏡 美洲家宽",
  "AF"    => "🏡 非洲家宽",
  "APAC"  => "🏡 亚太家宽",
  "OTHER" => "🏡 其他家宽",
}

filtered_proxies, filter_report = SckiSubscriptionNodeFilter.validate_and_filter(
  config, override, ARGV[4], GROUP_NAMES.values + HOME_GROUP_NAMES.values + ["🌍 全球节点", "🏡 全球家宽"]
)
File.open(STATUS_LOG, 'w') { |f| f.puts "[#{VERSION}] start" }
status "[filter] raw=#{filter_report['source']} filtered=#{filtered_proxies.size} home=#{filtered_proxies.count { |p| is_residential.call(p['name']) }} removed=#{filter_report['removed']}"
runtime_profile = SckiSubscriptionAdapterProfiles.resolve(ARGV[3])
active_node_servers = filtered_proxies.map { |proxy| proxy["server"] }
node_dns_hints = SckiSubscriptionAdapter.capture_node_dns(config, active_node_servers, runtime_profile)

# Ruby 的 \b 把数字视为单词字符，故 hk01 不会命中 \bHK\b。只在
# 字母与数字的交界插入分类边界，使小写 ISO 两位码 + 编号与 HK 01
# 等传统写法等价，同时保持原有国家正则和抗误匹配规则。
normalize_region_name = ->(name) {
  name.to_s.gsub(/(?<=[A-Za-z])(?=\d)/, " ")
}

classify = ->(name) {
  normalized_name = normalize_region_name.call(name)
  REGIONS.each { |code, re| return code if normalized_name.match?(re) }
  "OTHER"
}

buckets = Hash.new { |h, k| h[k] = [] }
home_buckets = Hash.new { |h, k| h[k] = [] }
home_all_members = []
filtered_proxies.each do |p|
  name = p["name"].to_s
  is_home = is_residential.call(name)
  home_all_members << name if is_home

  code = classify.call(name)
  next if code.nil?

  # v5.2.8-oc-normal.3 FIX#28-P0: 去掉 break，单节点可并入多个区域组（子区域 + 所属大洲）
  GROUP_MAP.each do |gkey, codes|
    if codes.include?(code)
      buckets[gkey] << name
      home_buckets[gkey] << name if is_home
    end
  end
end

buckets.each do |k, v|
  status "[region] #{GROUP_NAMES[k]}: #{v.uniq.size} nodes / home=#{home_buckets[k].uniq.size}"
end
status "[region] 🏡 全球家宽: #{home_all_members.uniq.size} nodes"

# ---------------------------------------------------------------
# Phase 1c: 构建 18 个区域组（非 Smart 内核，使用 type: url-test）
# 与 full 版唯一区别：type/uselightgbm/strategy/collectdata 替换为经典 url-test 字段集
# 其余字段（url/interval/tolerance/lazy）完全保持一致，确保行为可比
# ---------------------------------------------------------------
def make_smart_group(name, proxies_filter_mode:, explicit_proxies: nil)
  g = {
    "name"               => name,
    "type"               => "url-test",
    "url"                => "https://cp.cloudflare.com/generate_204",
    "interval"           => 300,
    "tolerance"          => 10,
    "lazy"               => false,
  }
  if proxies_filter_mode == :include_all
    g["include-all-proxies"] = true
  elsif proxies_filter_mode == :explicit && explicit_proxies && !explicit_proxies.empty?
    g["proxies"] = explicit_proxies
  end
  g
end

smart_groups = []
# 🌍 全球节点：包含所有节点，url-test 自动选路
smart_groups << (filtered_proxies.empty? ? { "name" => "🌍 全球节点", "type" => "select", "proxies" => ["REJECT"] } : make_smart_group("🌍 全球节点", proxies_filter_mode: :include_all))
smart_groups << make_smart_group("🏡 全球家宽", proxies_filter_mode: :explicit, explicit_proxies: home_all_members.uniq) if home_all_members.any?

# 8 个区域组：仅该区域节点参与 url-test；家宽子组只在匹配到家宽节点时创建
%w[HK TW SG JP_KR US EU AM AF APAC OTHER].each do |gkey|
  gname = GROUP_NAMES[gkey]
  members = buckets[gkey].uniq
  smart_groups << make_smart_group(gname, proxies_filter_mode: :explicit, explicit_proxies: members) unless members.empty?

  home_name = HOME_GROUP_NAMES[gkey]
  home_members = home_buckets[gkey].uniq
  smart_groups << make_smart_group(home_name, proxies_filter_mode: :explicit, explicit_proxies: home_members) unless home_members.empty?
end

# ---------------------------------------------------------------
# Phase 2: TLS 指纹注入
# ---------------------------------------------------------------
FP_CANDIDATES = %w[chrome firefox safari edge ios android random]
filtered_proxies.each do |p|
  t = p["type"].to_s
  if %w[vless vmess trojan].include?(t)
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
node_dns_report = SckiSubscriptionAdapter.apply_node_dns(config, node_dns_hints, runtime_profile)
status "[node-dns] profile=#{node_dns_report['profile']} applied=#{node_dns_report['applied']} reason=#{node_dns_report['reason']} domains=#{node_dns_report['domains']} resolvers=#{node_dns_report['resolvers']} policies=#{node_dns_report['policies']} hosts=#{node_dns_report['hosts']} rejected=#{node_dns_report['rejected']}"

# 清空并重建 proxy-groups：🌍 全球节点 → 业务组 → 其余区域组
active_region_names = smart_groups.map { |g| g["name"] } + ["DIRECT", "REJECT"]
override_biz_groups = (override["proxy-groups"] || []).map do |group|
  next group unless group.is_a?(Hash) && group["proxies"].is_a?(Array)

  patched = group.dup
  patched["proxies"] = group["proxies"].select { |proxy| active_region_names.include?(proxy) }
  patched
end
# 🌍 全球节点移至最前，业务组居中，其余区域组兜底（smart_groups 首个元素即 🌍 全球节点）
config["proxy-groups"] = [smart_groups.shift] + override_biz_groups + smart_groups

# 清空并重建 rule-providers 和 rules
config["rule-providers"] = override["rule-providers"] if override["rule-providers"]
config["rules"]          = override["rules"] if override["rules"]

# Preflight rejects nonempty proxy-providers; remove only an empty declaration.
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
LOG_OUT "Info" "[Clash-Normal] Executing Ruby processor..."

# 清理状态日志，准备接收 Ruby 输出
: > "$STATUS_LOG"

# 执行 Ruby 处理脚本
ruby "$RUBY_SCRIPT" "$CONFIG_FILE" "$OVERRIDE_YAML" "$STATUS_LOG" "$SCKI_SUBSCRIPTION_ADAPTER_PROFILE" "$SCKI_MAX_NODE_MULTIPLIER" 2>> "$LOG_FILE"
RC=$?

# 将 Ruby 的状态日志逐行回显到 OpenClash 日志
if [ -f "$STATUS_LOG" ]; then
  while IFS= read -r line; do
    LOG_OUT "Info" "[Clash-Normal] $line"
  done < "$STATUS_LOG"
fi

if [ $RC -eq 0 ]; then
  LOG_OUT "Info" "[Clash-Normal] $VERSION_TAG overwrite completed successfully."
else
  LOG_OUT "Error" "[Clash-Normal] $VERSION_TAG overwrite FAILED with exit code $RC."
  LOG_OUT "Error" "[Clash-Normal] Check $LOG_FILE for Ruby traceback."
fi

exit $RC
