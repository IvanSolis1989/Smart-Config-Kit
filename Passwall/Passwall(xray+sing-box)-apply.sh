#!/bin/sh
# ═══════════════════════════════════════════════════════════════════════════
# Smart-Config-Kit for Passwall — fused UCI batch helper
# Version: v6.0.14-pw.5 | Build 2026-09-29 | Baseline: Clash Party v6.0.14
#
# 用途：一次性在 Passwall 中创建 69 条 fused shunt rule。
#       每条规则只引用 rulesets/generated/fused/sing-box/*.srs，不再维护手写域名/IP 展平列表。
#       目标节点留空，用户之后到 LuCI 里给每条 rule 选择节点/负载均衡组。
#
# 生成：node tools/generate-fused-fallback-artifacts.js
# 变更历史：见 Passwall/CHANGELOG.md
# ═══════════════════════════════════════════════════════════════════════════

set -e

CONFIG_NAME="passwall"
VERSION_TAG="v6.0.14-pw.5"
MODE="${1:---replace}"

case "${MODE}" in
  --replace|'')
    MODE="--replace"
    ;;
  --append)
    ;;
  *)
    echo "Usage: $0 [--replace|--append]" >&2
    exit 2
    ;;
esac

is_scki_remark() {
  case "$1" in
    scki-fused-*) return 0 ;;
  esac
  printf '%s\n' \
    "🛑 广告拦截" \
    "🤖 AI 服务" \
    "💰 加密货币" \
    "🏦 金融支付" \
    "💬 即时通讯" \
    "📱 社交媒体" \
    "🎵 TikTok" \
    "🧑‍💼 会议协作" \
    "📺 国内流媒体" \
    "🎥 Netflix" \
    "🎬 Disney+" \
    "📡 HBO/Max" \
    "📺 Hulu" \
    "🎬 Prime Video" \
    "📹 YouTube" \
    "🎵 音乐流媒体" \
    "🌐 其他国外流媒体" \
    "🇭🇰 香港流媒体" \
    "🇹🇼 台湾流媒体" \
    "🇯🇵 日韩流媒体" \
    "🇪🇺 欧洲流媒体" \
    "🕹️ 国内游戏" \
    "🎮 国外游戏" \
    "Ⓜ️ 微软服务" \
    "🍎 苹果服务" \
    "📥 下载更新" \
    "🛰️ BT/PT Tracker" \
    "🏠 国内网站" \
    "🚫 受限网站" \
    "🌐 国外网站" \
    "🔍 Google 服务" \
    "🔧 工具与服务" \
    "🐟 漏网之鱼" \
    | grep -Fqx "$1"
}

cleanup_existing_scki_rules() {
  removed=0
  for section in $(uci show "${CONFIG_NAME}" | sed -n "s/^${CONFIG_NAME}\.\([^.=]*\)=shunt_rules$/\1/p"); do
    remarks="$(uci -q get "${CONFIG_NAME}.${section}.remarks" || true)"
    if is_scki_remark "${remarks}"; then
      uci delete "${CONFIG_NAME}.${section}"
      removed=$((removed + 1))
    fi
  done
  if [ "${removed}" -gt 0 ]; then
    echo "已删除旧 Smart-Config-Kit shunt rules: ${removed}"
  fi
}

add_fused_shunt_rule() {
  remarks="$1"
  url="$2"
  has_ip="$3"
  SEC="$(uci add "${CONFIG_NAME}" shunt_rules)"
  uci set "${CONFIG_NAME}".${SEC}.remarks="${remarks}"
  uci add_list "${CONFIG_NAME}".${SEC}.domain_list="rule-set:remote:${url}"
  if [ "${has_ip}" = "1" ]; then
    uci add_list "${CONFIG_NAME}".${SEC}.ip_list="rule-set:remote:${url}"
  fi
  uci set "${CONFIG_NAME}".${SEC}.network='tcp,udp'
  # Passwall 全功能版可在 LuCI 中分别设置 tcp_node / udp_node。
}

if ! command -v uci >/dev/null 2>&1; then
  echo "ERROR: uci 命令不存在，本脚本只能在 OpenWrt 路由器上运行" >&2
  exit 1
fi

if [ ! -f "/etc/config/${CONFIG_NAME}" ]; then
  echo "ERROR: /etc/config/${CONFIG_NAME} 不存在，请先安装 Passwall" >&2
  exit 1
fi

echo "建议先备份: cp /etc/config/${CONFIG_NAME} /etc/config/${CONFIG_NAME}.$(date +%s).bak"
echo "运行模式: ${MODE}（--replace 会删除旧 Smart-Config-Kit 规则；--append 会追加）"
if [ -t 0 ]; then
  echo "按 Ctrl+C 取消，回车继续..."
  read _
fi

if [ "${MODE}" = "--replace" ]; then
  cleanup_existing_scki_rules
fi

echo "开始创建 69 条 fused shunt rule..."

# [001] scki-fused-001-direct | DIRECT
add_fused_shunt_rule 'scki-fused-001-direct | DIRECT' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-001-direct.srs?scki=v6.0.14' '0'

# [002] scki-fused-002-intl-site | 🌐 国外网站
add_fused_shunt_rule 'scki-fused-002-intl-site | 🌐 国外网站' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-002-intl-site.srs?scki=v6.0.14' '0'

# [003] scki-fused-003-payments | 🏦 金融支付
add_fused_shunt_rule 'scki-fused-003-payments | 🏦 金融支付' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-003-payments.srs?scki=v6.0.14' '0'

# [004] scki-fused-004-ai | 🤖 AI 服务
add_fused_shunt_rule 'scki-fused-004-ai | 🤖 AI 服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-004-ai.srs?scki=v6.0.14' '0'

# [005] scki-fused-005-cnmedia | 📺 国内流媒体
add_fused_shunt_rule 'scki-fused-005-cnmedia | 📺 国内流媒体' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-005-cnmedia.srs?scki=v6.0.14' '0'

# [006] scki-fused-006-ad | 🛑 广告拦截
add_fused_shunt_rule 'scki-fused-006-ad | 🛑 广告拦截' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-006-ad.srs?scki=v6.0.14' '1'

# [007] scki-fused-007-cn-site | 🏠 国内网站
add_fused_shunt_rule 'scki-fused-007-cn-site | 🏠 国内网站' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-007-cn-site.srs?scki=v6.0.14' '0'

# [008] scki-fused-008-direct | DIRECT
add_fused_shunt_rule 'scki-fused-008-direct | DIRECT' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-008-direct.srs?scki=v6.0.14' '1'

# [009] scki-fused-009-work | 🧑‍💼 会议协作
add_fused_shunt_rule 'scki-fused-009-work | 🧑‍💼 会议协作' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-009-work.srs?scki=v6.0.14' '0'

# [010] scki-fused-010-crypto | 💰 加密货币
add_fused_shunt_rule 'scki-fused-010-crypto | 💰 加密货币' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-010-crypto.srs?scki=v6.0.14' '0'

# [011] scki-fused-011-gfw | 🚫 受限网站
add_fused_shunt_rule 'scki-fused-011-gfw | 🚫 受限网站' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-011-gfw.srs?scki=v6.0.14' '0'

# [012] scki-fused-012-youtube | 📹 YouTube
add_fused_shunt_rule 'scki-fused-012-youtube | 📹 YouTube' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-012-youtube.srs?scki=v6.0.14' '0'

# [013] scki-fused-013-cn-site | 🏠 国内网站
add_fused_shunt_rule 'scki-fused-013-cn-site | 🏠 国内网站' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-013-cn-site.srs?scki=v6.0.14' '0'

# [014] scki-fused-014-ai | 🤖 AI 服务
add_fused_shunt_rule 'scki-fused-014-ai | 🤖 AI 服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-014-ai.srs?scki=v6.0.14' '0'

# [015] scki-fused-015-google | 🔍 Google 服务
add_fused_shunt_rule 'scki-fused-015-google | 🔍 Google 服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-015-google.srs?scki=v6.0.14' '0'

# [016] scki-fused-016-work | 🧑‍💼 会议协作
add_fused_shunt_rule 'scki-fused-016-work | 🧑‍💼 会议协作' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-016-work.srs?scki=v6.0.14' '0'

# [017] scki-fused-017-ai | 🤖 AI 服务
add_fused_shunt_rule 'scki-fused-017-ai | 🤖 AI 服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-017-ai.srs?scki=v6.0.14' '1'

# [018] scki-fused-018-intl-site | 🌐 国外网站
add_fused_shunt_rule 'scki-fused-018-intl-site | 🌐 国外网站' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-018-intl-site.srs?scki=v6.0.14' '0'

# [019] scki-fused-019-im | 💬 即时通讯
add_fused_shunt_rule 'scki-fused-019-im | 💬 即时通讯' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-019-im.srs?scki=v6.0.14' '0'

# [020] scki-fused-020-work | 🧑‍💼 会议协作
add_fused_shunt_rule 'scki-fused-020-work | 🧑‍💼 会议协作' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-020-work.srs?scki=v6.0.14' '0'

# [021] scki-fused-021-download | 📥 下载更新
add_fused_shunt_rule 'scki-fused-021-download | 📥 下载更新' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-021-download.srs?scki=v6.0.14' '1'

# [022] scki-fused-022-google | 🔍 Google 服务
add_fused_shunt_rule 'scki-fused-022-google | 🔍 Google 服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-022-google.srs?scki=v6.0.14' '1'

# [023] scki-fused-023-tools | 🔧 工具与服务
add_fused_shunt_rule 'scki-fused-023-tools | 🔧 工具与服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-023-tools.srs?scki=v6.0.14' '0'

# [024] scki-fused-024-ai | 🤖 AI 服务
add_fused_shunt_rule 'scki-fused-024-ai | 🤖 AI 服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-024-ai.srs?scki=v6.0.14' '1'

# [025] scki-fused-025-google | 🔍 Google 服务
add_fused_shunt_rule 'scki-fused-025-google | 🔍 Google 服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-025-google.srs?scki=v6.0.14' '0'

# [026] scki-fused-026-ai | 🤖 AI 服务
add_fused_shunt_rule 'scki-fused-026-ai | 🤖 AI 服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-026-ai.srs?scki=v6.0.14' '1'

# [027] scki-fused-027-crypto | 💰 加密货币
add_fused_shunt_rule 'scki-fused-027-crypto | 💰 加密货币' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-027-crypto.srs?scki=v6.0.14' '0'

# [028] scki-fused-028-payments | 🏦 金融支付
add_fused_shunt_rule 'scki-fused-028-payments | 🏦 金融支付' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-028-payments.srs?scki=v6.0.14' '0'

# [029] scki-fused-029-microsoft | Ⓜ️ 微软服务
add_fused_shunt_rule 'scki-fused-029-microsoft | Ⓜ️ 微软服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-029-microsoft.srs?scki=v6.0.14' '0'

# [030] scki-fused-030-intl-site | 🌐 国外网站
add_fused_shunt_rule 'scki-fused-030-intl-site | 🌐 国外网站' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-030-intl-site.srs?scki=v6.0.14' '0'

# [031] scki-fused-031-direct | DIRECT
add_fused_shunt_rule 'scki-fused-031-direct | DIRECT' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-031-direct.srs?scki=v6.0.14' '0'

# [032] scki-fused-032-im | 💬 即时通讯
add_fused_shunt_rule 'scki-fused-032-im | 💬 即时通讯' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-032-im.srs?scki=v6.0.14' '1'

# [033] scki-fused-033-social | 📱 社交媒体
add_fused_shunt_rule 'scki-fused-033-social | 📱 社交媒体' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-033-social.srs?scki=v6.0.14' '1'

# [034] scki-fused-034-cn-site | 🏠 国内网站
add_fused_shunt_rule 'scki-fused-034-cn-site | 🏠 国内网站' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-034-cn-site.srs?scki=v6.0.14' '0'

# [035] scki-fused-035-social | 📱 社交媒体
add_fused_shunt_rule 'scki-fused-035-social | 📱 社交媒体' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-035-social.srs?scki=v6.0.14' '0'

# [036] scki-fused-036-work | 🧑‍💼 会议协作
add_fused_shunt_rule 'scki-fused-036-work | 🧑‍💼 会议协作' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-036-work.srs?scki=v6.0.14' '1'

# [037] scki-fused-037-direct | DIRECT
add_fused_shunt_rule 'scki-fused-037-direct | DIRECT' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-037-direct.srs?scki=v6.0.14' '0'

# [038] scki-fused-038-cnmedia | 📺 国内流媒体
add_fused_shunt_rule 'scki-fused-038-cnmedia | 📺 国内流媒体' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-038-cnmedia.srs?scki=v6.0.14' '0'

# [039] scki-fused-039-tiktok | 🎵 TikTok
add_fused_shunt_rule 'scki-fused-039-tiktok | 🎵 TikTok' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-039-tiktok.srs?scki=v6.0.14' '0'

# [040] scki-fused-040-youtube | 📹 YouTube
add_fused_shunt_rule 'scki-fused-040-youtube | 📹 YouTube' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-040-youtube.srs?scki=v6.0.14' '0'

# [041] scki-fused-041-netflix | 🎥 Netflix
add_fused_shunt_rule 'scki-fused-041-netflix | 🎥 Netflix' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-041-netflix.srs?scki=v6.0.14' '1'

# [042] scki-fused-042-disney | 🎬 Disney+
add_fused_shunt_rule 'scki-fused-042-disney | 🎬 Disney+' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-042-disney.srs?scki=v6.0.14' '0'

# [043] scki-fused-043-hbo-max | 📡 HBO/Max
add_fused_shunt_rule 'scki-fused-043-hbo-max | 📡 HBO/Max' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-043-hbo-max.srs?scki=v6.0.14' '0'

# [044] scki-fused-044-hulu | 📺 Hulu
add_fused_shunt_rule 'scki-fused-044-hulu | 📺 Hulu' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-044-hulu.srs?scki=v6.0.14' '0'

# [045] scki-fused-045-prime-video | 🎬 Prime Video
add_fused_shunt_rule 'scki-fused-045-prime-video | 🎬 Prime Video' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-045-prime-video.srs?scki=v6.0.14' '1'

# [046] scki-fused-046-music | 🎵 音乐流媒体
add_fused_shunt_rule 'scki-fused-046-music | 🎵 音乐流媒体' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-046-music.srs?scki=v6.0.14' '1'

# [047] scki-fused-047-stream-hk | 🇭🇰 香港流媒体
add_fused_shunt_rule 'scki-fused-047-stream-hk | 🇭🇰 香港流媒体' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-047-stream-hk.srs?scki=v6.0.14' '1'

# [048] scki-fused-048-stream-tw | 🇹🇼 台湾流媒体
add_fused_shunt_rule 'scki-fused-048-stream-tw | 🇹🇼 台湾流媒体' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-048-stream-tw.srs?scki=v6.0.14' '0'

# [049] scki-fused-049-stream-jpkr | 🇯🇵 日韩流媒体
add_fused_shunt_rule 'scki-fused-049-stream-jpkr | 🇯🇵 日韩流媒体' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-049-stream-jpkr.srs?scki=v6.0.14' '1'

# [050] scki-fused-050-stream-eu | 🇪🇺 欧洲流媒体
add_fused_shunt_rule 'scki-fused-050-stream-eu | 🇪🇺 欧洲流媒体' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-050-stream-eu.srs?scki=v6.0.14' '0'

# [051] scki-fused-051-stream-other | 🌐 其他国外流媒体
add_fused_shunt_rule 'scki-fused-051-stream-other | 🌐 其他国外流媒体' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-051-stream-other.srs?scki=v6.0.14' '1'

# [052] scki-fused-052-tools | 🔧 工具与服务
add_fused_shunt_rule 'scki-fused-052-tools | 🔧 工具与服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-052-tools.srs?scki=v6.0.14' '0'

# [053] scki-fused-053-google | 🔍 Google 服务
add_fused_shunt_rule 'scki-fused-053-google | 🔍 Google 服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-053-google.srs?scki=v6.0.14' '0'

# [054] scki-fused-054-tools | 🔧 工具与服务
add_fused_shunt_rule 'scki-fused-054-tools | 🔧 工具与服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-054-tools.srs?scki=v6.0.14' '1'

# [055] scki-fused-055-microsoft | Ⓜ️ 微软服务
add_fused_shunt_rule 'scki-fused-055-microsoft | Ⓜ️ 微软服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-055-microsoft.srs?scki=v6.0.14' '0'

# [056] scki-fused-056-apple | 🍎 苹果服务
add_fused_shunt_rule 'scki-fused-056-apple | 🍎 苹果服务' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-056-apple.srs?scki=v6.0.14' '1'

# [057] scki-fused-057-download | 📥 下载更新
add_fused_shunt_rule 'scki-fused-057-download | 📥 下载更新' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-057-download.srs?scki=v6.0.14' '1'

# [058] scki-fused-058-tracker | 🛰️ BT/PT Tracker
add_fused_shunt_rule 'scki-fused-058-tracker | 🛰️ BT/PT Tracker' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-058-tracker.srs?scki=v6.0.14' '1'

# [059] scki-fused-059-gfw | 🚫 受限网站
add_fused_shunt_rule 'scki-fused-059-gfw | 🚫 受限网站' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-059-gfw.srs?scki=v6.0.14' '1'

# [060] scki-fused-060-game-cn | 🕹️ 国内游戏
add_fused_shunt_rule 'scki-fused-060-game-cn | 🕹️ 国内游戏' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-060-game-cn.srs?scki=v6.0.14' '0'

# [061] scki-fused-061-game-intl | 🎮 国外游戏
add_fused_shunt_rule 'scki-fused-061-game-intl | 🎮 国外游戏' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-061-game-intl.srs?scki=v6.0.14' '1'

# [062] scki-fused-062-intl-site | 🌐 国外网站
add_fused_shunt_rule 'scki-fused-062-intl-site | 🌐 国外网站' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-062-intl-site.srs?scki=v6.0.14' '1'

# [063] scki-fused-063-payments | 🏦 金融支付
add_fused_shunt_rule 'scki-fused-063-payments | 🏦 金融支付' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-063-payments.srs?scki=v6.0.14' '0'

# [064] scki-fused-064-cnmedia | 📺 国内流媒体
add_fused_shunt_rule 'scki-fused-064-cnmedia | 📺 国内流媒体' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-064-cnmedia.srs?scki=v6.0.14' '1'

# [065] scki-fused-065-cn-site | 🏠 国内网站
add_fused_shunt_rule 'scki-fused-065-cn-site | 🏠 国内网站' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-065-cn-site.srs?scki=v6.0.14' '1'

# [066] scki-fused-066-direct | DIRECT
add_fused_shunt_rule 'scki-fused-066-direct | DIRECT' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-066-direct.srs?scki=v6.0.14' '0'

# [067] scki-fused-067-cn-site | 🏠 国内网站
add_fused_shunt_rule 'scki-fused-067-cn-site | 🏠 国内网站' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-067-cn-site.srs?scki=v6.0.14' '0'

# [068] scki-fused-068-intl-site | 🌐 国外网站
add_fused_shunt_rule 'scki-fused-068-intl-site | 🌐 国外网站' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-068-intl-site.srs?scki=v6.0.14' '1'

# [069] scki-fused-070-netflix | 🎥 Netflix
add_fused_shunt_rule 'scki-fused-070-netflix | 🎥 Netflix' 'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/scki-fused-070-netflix.srs?scki=v6.0.14' '1'

uci commit "${CONFIG_NAME}"
echo "完成：已写入 69 条 Smart-Config-Kit fused shunt rule。请到 LuCI 分流控制中为各规则选择目标节点。"
