#!/bin/sh
# ═══════════════════════════════════════════════════════════════════════════
# Smart-Config-Kit for Passwall — fused UCI batch helper
# Version: v6.0.21-pw.12 | Build 2026-10-28 | Baseline: Clash Party v6.0.21
#
# 用途：一次性在 Passwall 中创建 78 条 fused shunt rule。
#       每条规则只引用 rulesets/generated/fused/sing-box/*.srs，不再维护手写域名/IP 展平列表。
#       仅适用于 type=sing-box 的分流节点；Xray 后端不解析 rule-set 引用。
#       目标节点留空，用户之后到 LuCI 里给每条 rule 选择节点/负载均衡组。
#
# 生成：node tools/generate-fused-fallback-artifacts.js
# 变更历史：见 Passwall/CHANGELOG.md
# ═══════════════════════════════════════════════════════════════════════════

set -e

CONFIG_NAME="passwall"
VERSION_TAG="v6.0.21-pw.12"
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
  # 在 type=sing-box、protocol=_shunt 的节点中选择本规则的业务目标。
}

if ! command -v uci >/dev/null 2>&1; then
  echo "ERROR: uci 命令不存在，本脚本只能在 OpenWrt 路由器上运行" >&2
  exit 1
fi

if [ ! -f "/etc/config/${CONFIG_NAME}" ]; then
  echo "ERROR: /etc/config/${CONFIG_NAME} 不存在，请先安装 Passwall" >&2
  exit 1
fi

# Rule sections are shared by all shunt nodes. Validate every consumer before
# cleanup/add/commit: Xray can discard an SRS predicate or turn it into a broad
# network-only rule. Installing a sing-box executable is not a backend check.
require_sing_box_shunts() {
  if ! snapshot="$(uci show "${CONFIG_NAME}")"; then
    echo "ERROR: 无法读取 ${CONFIG_NAME}，未修改任何规则" >&2
    return 1
  fi
  shunts=0
  sections="$(printf '%s\n' "${snapshot}" | sed -n "s/^${CONFIG_NAME}\.\([^.=]*\)=nodes$/\1/p")"
  for section in ${sections}; do
    if ! backend="$(uci -q get "${CONFIG_NAME}.${section}.type")"; then
      echo "ERROR: 无法读取节点 ${section} 的 type；SRS 规则仅支持 sing-box，未修改任何规则" >&2
      return 1
    fi
    case "${backend}" in
      sing-box|Xray) ;;
      Socks|SS-Rust|SSR|Hysteria2|Naiveproxy) continue ;;
      *)
        echo "ERROR: 节点 ${section} 类型 ${backend:-未知} 无法核验；SRS 规则仅支持 sing-box，未修改任何规则" >&2
        return 1
        ;;
    esac
    if ! protocol="$(uci -q get "${CONFIG_NAME}.${section}.protocol")"; then
      echo "ERROR: 无法读取节点 ${section} 的 protocol，未修改任何规则" >&2
      return 1
    fi
    [ "${protocol}" = "_shunt" ] || continue
    if [ "${backend}" != "sing-box" ]; then
      echo "ERROR: 分流节点 ${section} 使用 ${backend:-未知}；SRS 规则仅支持 sing-box，未修改任何规则" >&2
      return 1
    fi
    shunts=$((shunts + 1))
  done
  if [ "${shunts}" -eq 0 ]; then
    echo "ERROR: 请先在 LuCI 创建 type=sing-box、protocol=_shunt 的分流节点，再导入 SRS 规则" >&2
    return 1
  fi
}

require_sing_box_shunts

echo "建议先备份: cp /etc/config/${CONFIG_NAME} /etc/config/${CONFIG_NAME}.$(date +%s).bak"
echo "运行模式: ${MODE}（--replace 会删除旧 Smart-Config-Kit 规则；--append 会追加）"
if [ -t 0 ]; then
  echo "按 Ctrl+C 取消，回车继续..."
  read _
fi

if [ "${MODE}" = "--replace" ]; then
  cleanup_existing_scki_rules
fi

echo "开始创建 78 条 fused shunt rule..."

# [001] scki-fused-001-direct | DIRECT
add_fused_shunt_rule 'scki-fused-001-direct | DIRECT' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-001-direct.srs?scki=v6.0.21' '0'

# [002] scki-fused-002-intl-site | 🌐 国外网站
add_fused_shunt_rule 'scki-fused-002-intl-site | 🌐 国外网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-002-intl-site.srs?scki=v6.0.21' '0'

# [003] scki-fused-003-payments | 🏦 金融支付
add_fused_shunt_rule 'scki-fused-003-payments | 🏦 金融支付' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-003-payments.srs?scki=v6.0.21' '0'

# [004] scki-fused-004-ai | 🤖 AI 服务
add_fused_shunt_rule 'scki-fused-004-ai | 🤖 AI 服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-004-ai.srs?scki=v6.0.21' '0'

# [005] scki-fused-005-cnmedia | 📺 国内流媒体
add_fused_shunt_rule 'scki-fused-005-cnmedia | 📺 国内流媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-005-cnmedia.srs?scki=v6.0.21' '0'

# [006] scki-fused-006-cn-site | 🏠 国内网站
add_fused_shunt_rule 'scki-fused-006-cn-site | 🏠 国内网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-006-cn-site.srs?scki=v6.0.21' '0'

# [007] scki-fused-007-stream-jpkr | 🇯🇵 日韩流媒体
add_fused_shunt_rule 'scki-fused-007-stream-jpkr | 🇯🇵 日韩流媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-007-stream-jpkr.srs?scki=v6.0.21' '0'

# [008] scki-fused-008-social | 📱 社交媒体
add_fused_shunt_rule 'scki-fused-008-social | 📱 社交媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-008-social.srs?scki=v6.0.21' '0'

# [009] scki-fused-009-tiktok | 🎵 TikTok
add_fused_shunt_rule 'scki-fused-009-tiktok | 🎵 TikTok' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-009-tiktok.srs?scki=v6.0.21' '0'

# [010] scki-fused-010-ad | 🛑 广告拦截
add_fused_shunt_rule 'scki-fused-010-ad | 🛑 广告拦截' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-010-ad.srs?scki=v6.0.21' '1'

# [011] scki-fused-011-tools | 🔧 工具与服务
add_fused_shunt_rule 'scki-fused-011-tools | 🔧 工具与服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-011-tools.srs?scki=v6.0.21' '0'

# [012] scki-fused-012-intl-site | 🌐 国外网站
add_fused_shunt_rule 'scki-fused-012-intl-site | 🌐 国外网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-012-intl-site.srs?scki=v6.0.21' '0'

# [013] scki-fused-013-ai | 🤖 AI 服务
add_fused_shunt_rule 'scki-fused-013-ai | 🤖 AI 服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-013-ai.srs?scki=v6.0.21' '0'

# [014] scki-fused-014-game-cn | 🕹️ 国内游戏
add_fused_shunt_rule 'scki-fused-014-game-cn | 🕹️ 国内游戏' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-014-game-cn.srs?scki=v6.0.21' '0'

# [015] scki-fused-015-microsoft | Ⓜ️ 微软服务
add_fused_shunt_rule 'scki-fused-015-microsoft | Ⓜ️ 微软服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-015-microsoft.srs?scki=v6.0.21' '0'

# [016] scki-fused-016-ad | 🛑 广告拦截
add_fused_shunt_rule 'scki-fused-016-ad | 🛑 广告拦截' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-016-ad.srs?scki=v6.0.21' '1'

# [017] scki-fused-017-cn-site | 🏠 国内网站
add_fused_shunt_rule 'scki-fused-017-cn-site | 🏠 国内网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-017-cn-site.srs?scki=v6.0.21' '0'

# [018] scki-fused-018-direct | DIRECT
add_fused_shunt_rule 'scki-fused-018-direct | DIRECT' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-018-direct.srs?scki=v6.0.21' '1'

# [019] scki-fused-019-work | 🧑‍💼 会议协作
add_fused_shunt_rule 'scki-fused-019-work | 🧑‍💼 会议协作' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-019-work.srs?scki=v6.0.21' '0'

# [020] scki-fused-020-crypto | 💰 加密货币
add_fused_shunt_rule 'scki-fused-020-crypto | 💰 加密货币' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-020-crypto.srs?scki=v6.0.21' '0'

# [021] scki-fused-021-gfw | 🚫 受限网站
add_fused_shunt_rule 'scki-fused-021-gfw | 🚫 受限网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-021-gfw.srs?scki=v6.0.21' '0'

# [022] scki-fused-022-youtube | 📹 YouTube
add_fused_shunt_rule 'scki-fused-022-youtube | 📹 YouTube' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-022-youtube.srs?scki=v6.0.21' '0'

# [023] scki-fused-023-ai | 🤖 AI 服务
add_fused_shunt_rule 'scki-fused-023-ai | 🤖 AI 服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-023-ai.srs?scki=v6.0.21' '0'

# [024] scki-fused-024-google | 🔍 Google 服务
add_fused_shunt_rule 'scki-fused-024-google | 🔍 Google 服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-024-google.srs?scki=v6.0.21' '0'

# [025] scki-fused-025-work | 🧑‍💼 会议协作
add_fused_shunt_rule 'scki-fused-025-work | 🧑‍💼 会议协作' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-025-work.srs?scki=v6.0.21' '0'

# [026] scki-fused-026-ai | 🤖 AI 服务
add_fused_shunt_rule 'scki-fused-026-ai | 🤖 AI 服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-026-ai.srs?scki=v6.0.21' '1'

# [027] scki-fused-027-intl-site | 🌐 国外网站
add_fused_shunt_rule 'scki-fused-027-intl-site | 🌐 国外网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-027-intl-site.srs?scki=v6.0.21' '0'

# [028] scki-fused-028-im | 💬 即时通讯
add_fused_shunt_rule 'scki-fused-028-im | 💬 即时通讯' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-028-im.srs?scki=v6.0.21' '0'

# [029] scki-fused-029-work | 🧑‍💼 会议协作
add_fused_shunt_rule 'scki-fused-029-work | 🧑‍💼 会议协作' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-029-work.srs?scki=v6.0.21' '0'

# [030] scki-fused-030-download | 📥 下载更新
add_fused_shunt_rule 'scki-fused-030-download | 📥 下载更新' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-030-download.srs?scki=v6.0.21' '0'

# [031] scki-fused-031-google | 🔍 Google 服务
add_fused_shunt_rule 'scki-fused-031-google | 🔍 Google 服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-031-google.srs?scki=v6.0.21' '1'

# [032] scki-fused-032-tools | 🔧 工具与服务
add_fused_shunt_rule 'scki-fused-032-tools | 🔧 工具与服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-032-tools.srs?scki=v6.0.21' '0'

# [033] scki-fused-033-ai | 🤖 AI 服务
add_fused_shunt_rule 'scki-fused-033-ai | 🤖 AI 服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-033-ai.srs?scki=v6.0.21' '1'

# [034] scki-fused-034-google | 🔍 Google 服务
add_fused_shunt_rule 'scki-fused-034-google | 🔍 Google 服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-034-google.srs?scki=v6.0.21' '0'

# [035] scki-fused-035-ai | 🤖 AI 服务
add_fused_shunt_rule 'scki-fused-035-ai | 🤖 AI 服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-035-ai.srs?scki=v6.0.21' '1'

# [036] scki-fused-036-crypto | 💰 加密货币
add_fused_shunt_rule 'scki-fused-036-crypto | 💰 加密货币' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-036-crypto.srs?scki=v6.0.21' '0'

# [037] scki-fused-037-payments | 🏦 金融支付
add_fused_shunt_rule 'scki-fused-037-payments | 🏦 金融支付' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-037-payments.srs?scki=v6.0.21' '0'

# [038] scki-fused-039-intl-site | 🌐 国外网站
add_fused_shunt_rule 'scki-fused-039-intl-site | 🌐 国外网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-039-intl-site.srs?scki=v6.0.21' '0'

# [039] scki-fused-040-direct | DIRECT
add_fused_shunt_rule 'scki-fused-040-direct | DIRECT' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-040-direct.srs?scki=v6.0.21' '0'

# [040] scki-fused-041-im | 💬 即时通讯
add_fused_shunt_rule 'scki-fused-041-im | 💬 即时通讯' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-041-im.srs?scki=v6.0.21' '1'

# [041] scki-fused-042-social | 📱 社交媒体
add_fused_shunt_rule 'scki-fused-042-social | 📱 社交媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-042-social.srs?scki=v6.0.21' '1'

# [042] scki-fused-043-cn-site | 🏠 国内网站
add_fused_shunt_rule 'scki-fused-043-cn-site | 🏠 国内网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-043-cn-site.srs?scki=v6.0.21' '0'

# [043] scki-fused-044-social | 📱 社交媒体
add_fused_shunt_rule 'scki-fused-044-social | 📱 社交媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-044-social.srs?scki=v6.0.21' '0'

# [044] scki-fused-045-work | 🧑‍💼 会议协作
add_fused_shunt_rule 'scki-fused-045-work | 🧑‍💼 会议协作' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-045-work.srs?scki=v6.0.21' '1'

# [045] scki-fused-046-direct | DIRECT
add_fused_shunt_rule 'scki-fused-046-direct | DIRECT' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-046-direct.srs?scki=v6.0.21' '0'

# [046] scki-fused-047-cnmedia | 📺 国内流媒体
add_fused_shunt_rule 'scki-fused-047-cnmedia | 📺 国内流媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-047-cnmedia.srs?scki=v6.0.21' '0'

# [047] scki-fused-048-tiktok | 🎵 TikTok
add_fused_shunt_rule 'scki-fused-048-tiktok | 🎵 TikTok' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-048-tiktok.srs?scki=v6.0.21' '0'

# [048] scki-fused-049-youtube | 📹 YouTube
add_fused_shunt_rule 'scki-fused-049-youtube | 📹 YouTube' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-049-youtube.srs?scki=v6.0.21' '0'

# [049] scki-fused-050-netflix | 🎥 Netflix
add_fused_shunt_rule 'scki-fused-050-netflix | 🎥 Netflix' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-050-netflix.srs?scki=v6.0.21' '1'

# [050] scki-fused-051-disney | 🎬 Disney+
add_fused_shunt_rule 'scki-fused-051-disney | 🎬 Disney+' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-051-disney.srs?scki=v6.0.21' '0'

# [051] scki-fused-052-hbo-max | 📡 HBO/Max
add_fused_shunt_rule 'scki-fused-052-hbo-max | 📡 HBO/Max' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-052-hbo-max.srs?scki=v6.0.21' '0'

# [052] scki-fused-053-hulu | 📺 Hulu
add_fused_shunt_rule 'scki-fused-053-hulu | 📺 Hulu' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-053-hulu.srs?scki=v6.0.21' '0'

# [053] scki-fused-054-prime-video | 🎬 Prime Video
add_fused_shunt_rule 'scki-fused-054-prime-video | 🎬 Prime Video' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-054-prime-video.srs?scki=v6.0.21' '0'

# [054] scki-fused-055-intl-site | 🌐 国外网站
add_fused_shunt_rule 'scki-fused-055-intl-site | 🌐 国外网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-055-intl-site.srs?scki=v6.0.21' '1'

# [055] scki-fused-056-music | 🎵 音乐流媒体
add_fused_shunt_rule 'scki-fused-056-music | 🎵 音乐流媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-056-music.srs?scki=v6.0.21' '1'

# [056] scki-fused-057-stream-hk | 🇭🇰 香港流媒体
add_fused_shunt_rule 'scki-fused-057-stream-hk | 🇭🇰 香港流媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-057-stream-hk.srs?scki=v6.0.21' '1'

# [057] scki-fused-058-stream-tw | 🇹🇼 台湾流媒体
add_fused_shunt_rule 'scki-fused-058-stream-tw | 🇹🇼 台湾流媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-058-stream-tw.srs?scki=v6.0.21' '0'

# [058] scki-fused-059-stream-jpkr | 🇯🇵 日韩流媒体
add_fused_shunt_rule 'scki-fused-059-stream-jpkr | 🇯🇵 日韩流媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-059-stream-jpkr.srs?scki=v6.0.21' '1'

# [059] scki-fused-060-stream-eu | 🇪🇺 欧洲流媒体
add_fused_shunt_rule 'scki-fused-060-stream-eu | 🇪🇺 欧洲流媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-060-stream-eu.srs?scki=v6.0.21' '0'

# [060] scki-fused-061-stream-other | 🌐 其他国外流媒体
add_fused_shunt_rule 'scki-fused-061-stream-other | 🌐 其他国外流媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-061-stream-other.srs?scki=v6.0.21' '1'

# [061] scki-fused-062-tools | 🔧 工具与服务
add_fused_shunt_rule 'scki-fused-062-tools | 🔧 工具与服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-062-tools.srs?scki=v6.0.21' '0'

# [062] scki-fused-063-google | 🔍 Google 服务
add_fused_shunt_rule 'scki-fused-063-google | 🔍 Google 服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-063-google.srs?scki=v6.0.21' '0'

# [063] scki-fused-064-tools | 🔧 工具与服务
add_fused_shunt_rule 'scki-fused-064-tools | 🔧 工具与服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-064-tools.srs?scki=v6.0.21' '1'

# [064] scki-fused-065-microsoft | Ⓜ️ 微软服务
add_fused_shunt_rule 'scki-fused-065-microsoft | Ⓜ️ 微软服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-065-microsoft.srs?scki=v6.0.21' '0'

# [065] scki-fused-066-apple | 🍎 苹果服务
add_fused_shunt_rule 'scki-fused-066-apple | 🍎 苹果服务' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-066-apple.srs?scki=v6.0.21' '1'

# [066] scki-fused-067-download | 📥 下载更新
add_fused_shunt_rule 'scki-fused-067-download | 📥 下载更新' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-067-download.srs?scki=v6.0.21' '1'

# [067] scki-fused-068-tracker | 🛰️ BT/PT Tracker
add_fused_shunt_rule 'scki-fused-068-tracker | 🛰️ BT/PT Tracker' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-068-tracker.srs?scki=v6.0.21' '1'

# [068] scki-fused-069-gfw | 🚫 受限网站
add_fused_shunt_rule 'scki-fused-069-gfw | 🚫 受限网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-069-gfw.srs?scki=v6.0.21' '1'

# [069] scki-fused-070-game-cn | 🕹️ 国内游戏
add_fused_shunt_rule 'scki-fused-070-game-cn | 🕹️ 国内游戏' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-070-game-cn.srs?scki=v6.0.21' '0'

# [070] scki-fused-071-game-intl | 🎮 国外游戏
add_fused_shunt_rule 'scki-fused-071-game-intl | 🎮 国外游戏' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-071-game-intl.srs?scki=v6.0.21' '1'

# [071] scki-fused-072-intl-site | 🌐 国外网站
add_fused_shunt_rule 'scki-fused-072-intl-site | 🌐 国外网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-072-intl-site.srs?scki=v6.0.21' '1'

# [072] scki-fused-073-payments | 🏦 金融支付
add_fused_shunt_rule 'scki-fused-073-payments | 🏦 金融支付' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-073-payments.srs?scki=v6.0.21' '0'

# [073] scki-fused-074-cnmedia | 📺 国内流媒体
add_fused_shunt_rule 'scki-fused-074-cnmedia | 📺 国内流媒体' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-074-cnmedia.srs?scki=v6.0.21' '1'

# [074] scki-fused-075-cn-site | 🏠 国内网站
add_fused_shunt_rule 'scki-fused-075-cn-site | 🏠 国内网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-075-cn-site.srs?scki=v6.0.21' '1'

# [075] scki-fused-076-direct | DIRECT
add_fused_shunt_rule 'scki-fused-076-direct | DIRECT' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-076-direct.srs?scki=v6.0.21' '0'

# [076] scki-fused-077-cn-site | 🏠 国内网站
add_fused_shunt_rule 'scki-fused-077-cn-site | 🏠 国内网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-077-cn-site.srs?scki=v6.0.21' '0'

# [077] scki-fused-078-intl-site | 🌐 国外网站
add_fused_shunt_rule 'scki-fused-078-intl-site | 🌐 国外网站' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-078-intl-site.srs?scki=v6.0.21' '1'

# [078] scki-fused-080-netflix | 🎥 Netflix
add_fused_shunt_rule 'scki-fused-080-netflix | 🎥 Netflix' 'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/scki-fused-080-netflix.srs?scki=v6.0.21' '1'

uci commit "${CONFIG_NAME}"
echo "完成：已写入 78 条 Smart-Config-Kit fused shunt rule。请在 sing-box 分流节点中选择各规则的目标节点；以后改为 Xray 前必须先移除这些 SRS 规则。"
