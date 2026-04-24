#!/bin/sh
# ═══════════════════════════════════════════════════════════════════════════
# Smart-Config-Kit for Passwall — UCI batch helper
# Version: v5.2.6-pw.2 | Build 2026-04-24
#
# 用途：一次性在 Passwall（全功能版）中创建 28 条 shunt rule（含域名列表 + IP 列表），
#       每条目标节点留空（NEED_CONFIG），用户之后到 LuCI 里手工选节点。
#
# 备注：Passwall 和 Passwall2 是 Openwrt-Passwall 组织（原 xiaorouji 个人仓库迁入）
#       并行维护的两款插件，UCI key 不同（passwall vs passwall2）。
#       本脚本操作 Passwall 全功能版；若你用 Passwall2，
#       把 CONFIG_NAME 从 "passwall" 改为 "passwall2" 即可——规则语法完全相同。
#
#       Passwall 全功能版相比 Passwall2 的额外能力：
#       • 四列表（直连/屏蔽/GFW/代理）— 可替代或补充 shunt rule
#       • TCP/UDP 节点分选（tcp_node / udp_node）
#       • ACL 规则（按客户端 IP/MAC 指定策略）
#       • trojan-plus 节点类型
#
# 用法（路径里的 ( ) 是 shell 语法 token，必须加引号）：
#   1. scp 'Passwall(xray+sing-box)-apply.sh' root@192.168.1.1:/tmp/
#   2. ssh root@192.168.1.1
#   3. sh '/tmp/Passwall(xray+sing-box)-apply.sh'
#   4. 配置节点：
#      a) LuCI → Passwall → 节点列表 → 创建 TCP 节点 + TCP 负载均衡组（按区域）
#      b) LuCI → Passwall → 分流控制 → 逐条给每个 shunt rule 指定目标 TCP 节点
#   5. 回到基本设置，确认 tcp_node 和 udp_node 设置
#
# ⚠️  警告：
#   • 本脚本在 ImmortalWrt / OpenWrt 官方源的 Passwall 上测过
#   • 运行前建议备份: cp /etc/config/passwall /etc/config/passwall.bak
#   • 运行会 append 28 条新规则，不会删除既有的（重复运行会产生副本）
# ═══════════════════════════════════════════════════════════════════════════

set -e

CONFIG_NAME="passwall"

if ! command -v uci >/dev/null 2>&1; then
  echo "ERROR: uci 命令不存在，本脚本只能在 OpenWrt 路由器上运行" >&2
  exit 1
fi

if [ ! -f "/etc/config/${CONFIG_NAME}" ]; then
  echo "ERROR: /etc/config/${CONFIG_NAME} 不存在，请先安装 Passwall" >&2
  exit 1
fi

echo "建议先备份: cp /etc/config/${CONFIG_NAME} /etc/config/${CONFIG_NAME}.$(date +%s).bak"
echo "按 Ctrl+C 取消，回车继续..."
read _

echo "开始创建 28 条 shunt rule..."

# [01] 🤖 AI 服务
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🤖 AI 服务'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:openai'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:anthropic'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:gemini'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:copilot'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:bard'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:perplexity'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:huggingface'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:cursor.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:v0.dev'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:character.ai'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:mistral.ai'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:cohere.ai'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:cohere.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:replicate.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:together.ai'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:runpod.io'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:openrouter.ai'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:suno.ai'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:suno.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:midjourney.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:pi.ai'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:inflection.ai'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [02] 💰 加密货币
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='💰 加密货币'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:cryptocurrency'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:binance'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:tradingview.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:coinglass.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:coinmarketcap.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:coingecko.com'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [03] 🏦 金融支付
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🏦 金融支付'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:paypal'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:stripe'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:wise.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:revolut.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:visa.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:mastercard.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:amex.com'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [04] 📧 邮件服务
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='📧 邮件服务'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:gmail'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:outlook'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:protonmail'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:fastmail.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:tuta.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:mail.ru'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [05] 💬 即时通讯
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='💬 即时通讯'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:telegram'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:discord'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:whatsapp'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:line'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:signal'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:kakaotalk'
uci add_list ${CONFIG_NAME}.${SEC}.ip_list='geoip:telegram'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [06] 📱 社交媒体
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='📱 社交媒体'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:twitter'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:facebook'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:instagram'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:tiktok'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:reddit'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:pinterest'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:linkedin'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:snap'
uci add_list ${CONFIG_NAME}.${SEC}.ip_list='geoip:twitter'
uci add_list ${CONFIG_NAME}.${SEC}.ip_list='geoip:facebook'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [07] 🧑‍💼 会议协作
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🧑‍💼 会议协作'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:zoom'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:teams'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:slack'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:notion'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:atlassian'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:meet.google.com'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [08] 📺 国内流媒体
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='📺 国内流媒体'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:bilibili'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:iqiyi'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:youku'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:tencentvideo'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:mgtv'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:douyin'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:netease-music'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:qqmusic'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [09] 📺 东南亚流媒体
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='📺 东南亚流媒体'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:viu'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:iq.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:wetv.vip'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:vidio.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:iqiyiintl.com'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [10] 🇺🇸 美国流媒体
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🇺🇸 美国流媒体'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:youtube'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:netflix'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:disney'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:hbo'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:hulu'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:spotify'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:primevideo'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:paramountplus.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:peacocktv.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:twitch.tv'
uci add_list ${CONFIG_NAME}.${SEC}.ip_list='geoip:netflix'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [11] 🇭🇰 香港流媒体
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🇭🇰 香港流媒体'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:mytvsuper'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:mytvsuper.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:now.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:viu.tv'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:encoretvb.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:rthk.hk'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [12] 🇹🇼 台湾流媒体
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🇹🇼 台湾流媒体'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:bahamut'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:bahamut.com.tw'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:hinet.net'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:kktv.me'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:litv.tv'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:hamivideo.hinet.net'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:friday.tw'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [13] 🇯🇵 日韩流媒体
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🇯🇵 日韩流媒体'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:abema'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:niconico'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:dazn.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:dmm.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:tv-tokyo.co.jp'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:tver.jp'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:rakuten.tv'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [14] 🇪🇺 欧洲流媒体
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🇪🇺 欧洲流媒体'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:bbc'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:itv.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:channel4.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:my5.tv'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:sky.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:skygo.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:britbox.co.uk'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [15] 🕹️ 国内游戏
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🕹️ 国内游戏'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:steamcn'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:wanmei.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:majsoul.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:battlenet.com.cn'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [16] 🎮 国外游戏
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🎮 国外游戏'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:steam'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:epicgames'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:playstation'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:xbox'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:nintendo'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:riotgames.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:ea.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:blizzard.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:hoyoverse.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:mihoyo.com'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [17] 🔍 搜索引擎
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🔍 搜索引擎'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:google'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:bing'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:duckduckgo'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:yandex'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:scholar.google.com'
uci add_list ${CONFIG_NAME}.${SEC}.ip_list='geoip:google'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [18] 📟 开发者服务
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='📟 开发者服务'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:github'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:gitlab'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:docker'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:npmjs'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:pypi'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:python'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:jetbrains.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:stackoverflow.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:stackexchange.com'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [19] Ⓜ️ 微软服务
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='Ⓜ️ 微软服务'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:microsoft'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:onedrive'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:office.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:live.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:microsoftedge.com'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [20] 🍎 苹果服务
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🍎 苹果服务'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:apple'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:icloud'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:appstore.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:mzstatic.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:itunes.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:applemusic.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:apple-dns.net'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [21] 📥 下载更新
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='📥 下载更新'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:dl.google.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:play.googleapis.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:msftconnecttest.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:windowsupdate.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:cdn-apple.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:ubuntu.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:mozilla.org'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:apkpure.com'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [22] ☁️ 云与CDN
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='☁️ 云与CDN'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:cloudflare'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:fastly'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:akamai'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:jsdelivr.net'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:cloudfront.net'
uci add_list ${CONFIG_NAME}.${SEC}.ip_list='geoip:cloudflare'
uci add_list ${CONFIG_NAME}.${SEC}.ip_list='geoip:fastly'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [23] 🛰️ BT/PT Tracker
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🛰️ BT/PT Tracker'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:private-tracker'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:opentrackr.org'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:openbittorrent.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:nyaa.si'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [24] 🏠 国内网站
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🏠 国内网站'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:cn'
uci add_list ${CONFIG_NAME}.${SEC}.ip_list='geoip:cn'
uci add_list ${CONFIG_NAME}.${SEC}.ip_list='geoip:private'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [25] 🚫 受限网站
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🚫 受限网站'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:gfw'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:greatfire'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [26] 🌐 国外网站
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🌐 国外网站'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:geolocation-!cn'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:cnn.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:nytimes.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:bloomberg.com'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='domain:wikipedia.org'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [27] 🐟 漏网之鱼 FINAL
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🐟 漏网之鱼 FINAL'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

# [28] 🛑 广告拦截
SEC="$(uci add ${CONFIG_NAME} shunt_rules)"
uci set ${CONFIG_NAME}.${SEC}.remarks='🛑 广告拦截'
uci add_list ${CONFIG_NAME}.${SEC}.domain_list='geosite:category-ads-all'
uci set ${CONFIG_NAME}.${SEC}.network='tcp,udp'
# uci set ${CONFIG_NAME}.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'

uci commit ${CONFIG_NAME}

echo "✓ 28 条 shunt rule 创建完成。"
echo "下一步："
echo "  1. LuCI → Passwall → 节点列表 → 按区域创建 TCP 节点 + 负载均衡组"
echo "  2. LuCI → Passwall → 分流控制 → 逐条为每个 rule 指定 tcp_node"
echo "  3. LuCI → Passwall → 基本设置 → 确认 tcp_node / udp_node 指向正确"
echo "  4. 确认规则顺序：#24-#28（国内/受限/国外/FINAL/广告）保持在末尾"
echo "  5. 重启 Passwall: /etc/init.d/passwall restart"
echo ""
echo "======== 配置提示 ========"
echo "Passwall 全功能版比 Passwall2 多以下能力，可按需启用："
echo "  • 四列表（直连/屏蔽/GFW/代理）：在「代理」标签页开启 use_direct_list /"
echo "    use_proxy_list / use_block_list / use_gfw_list，可替代或补充 shunt rule"
echo "  • TCP/UDP 节点分选：tcp_node 走代理，udp_node 可走直连（国内游戏、BT 场景）"
echo "  • ACL 规则：按客户端 IP/MAC 指定不同分流策略"
echo "=========================="
