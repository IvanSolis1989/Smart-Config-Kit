# SingBox Full 配置

同源生成 sing-box 1.14 / 1.13 配置，包含 20 个区域组、33 个业务组和 1 个节点选择组；使用前替换示例节点。

> 版本：`v6.0.20-sing.10` · Build：2026-10-19 · 规则基线：`rulesets/source/routing-graph.js` v6.0.20。
> 变更历史见 [CHANGELOG.md](CHANGELOG.md)。官方字段、内核版本及客户端限制见 [2026-10-19 核验报告](../docs/upstream/2026-10-19/singbox/report.md)。

## 📥 规则下载链接

| 使用环境 | 配置文件 | 内核要求 |
| --- | --- | --- |
| 当前稳定版、v2rayN 自定义 sing-box 配置 | [下载 Full JSON](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/SingBox/SingBox%28sing-box%29-full.json) | sing-box **1.14.3+**；本次验收 1.14.3 |
| Hiddify 4.1.1 的 1.13 系列内核、仍使用 1.13 的客户端 | [下载 1.13 兼容 JSON](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/SingBox/SingBox%28sing-box%29-1.13.json) | 官方 sing-box **1.13.14** 已通过检查；Hiddify 自家内核需单独核对 |

[![下载规则：sing-box Full JSON](https://img.shields.io/badge/下载规则-sing--box%20Full-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/SingBox/SingBox%28sing-box%29-full.json)
[![下载规则：sing-box 1.13 JSON](https://img.shields.io/badge/下载规则-sing--box%201.13-2874a6?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/SingBox/SingBox%28sing-box%29-1.13.json)

可复制的 Raw 地址：

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/SingBox/SingBox%28sing-box%29-full.json
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/SingBox/SingBox%28sing-box%29-1.13.json
```

规则更新需要能访问 GitHub Raw 的网络或可用代理，排查见[规则下载说明](../docs/rule-asset-delivery.md)。

## 选择配置与接入节点

1. 在客户端的内核信息里确认实际 sing-box 版本，再选择上表文件。应用版本与内核版本分别核对。
2. 编辑 JSON，把 `outbounds` 中 `proxy-hk-1`、`proxy-us-1` 等 `trojan` 示例出站替换为真实节点。节点标签需与区域组引用一致；增加节点时同时修改相应区域组的 `outbounds`。
3. 通过客户端明确支持的完整自定义配置入口加载。原生 sing-box 可先运行 `sing-box check -c 配置文件.json` 检查。
4. 启用后核对最终配置保留 54 个 selector/urltest、85 个 remote rule-set，并确认规则下载成功。示例节点本身不能连接。

两个变体共用相同出站拓扑、98 条路由规则（含 1 条非终结嗅探动作）及规则集 URL。业务规则按源规则顺序匹配，最终兜底为 `🐟 漏网之鱼`。

节点不会自动按名称填入区域组；转换订阅后仍需核对标签和引用。

## DNS、规则下载与嗅探

两份配置都使用 typed DNS server：`type: https`、`server`、`path` 和 `domain_resolver`。IP 自举 DoH 保留证书 SNI；国内解析经 `DIRECT`，代理解析经 `🚀 节点选择`。`dns_direct2` / `dns_proxy2` 是预留服务器，存在备用项不代表内核会自动故障切换。

Full 使用 1.14 的命名 `http_clients` 下载规则集，通过 `evaluate` / `match_response` / `respond` 显式处理 CN IP 解析结果。1.13 兼容文件使用该稳定系列支持的 `download_detour` 与 DNS GeoIP 接受过滤。两者均将规则下载交给 `🌍 全球节点`。

TUN 使用 `172.19.0.1/30`、`auto_route` 和 `strict_route`。嗅探通过非终结 `action: sniff` 执行。客户端托管 TUN 时，应按其完整配置模式的规则调整入站并核对最终配置。

嗅探可辅助 SNI/Host 匹配，但不能恢复旧 `sniff_override_destination=true` 的动态目的地址重写：IP 目的仍拨原 IP。`route-options.override_address` 只支持固定地址。源码与影响见[迁移边界](../docs/upstream/2026-10-19/singbox/report.md#嗅探迁移的行为边界)。

官方依据：[DNS HTTPS server](https://sing-box.sagernet.org/configuration/dns/server/https/)、[rule-set](https://sing-box.sagernet.org/configuration/rule-set/)、[迁移说明](https://sing-box.sagernet.org/migration/)。

## Hiddify

[Hiddify app 4.1.1](https://github.com/hiddify/hiddify-app/releases/tag/v4.1.1) 构建文件固定 `core.version=4.1.0`，对应源码使用 1.13 系列派生内核，因此优先选择 **1.13 兼容 JSON**。独立 hiddify-core 的新版本不能证明已安装 App 同步升级了内核。

Hiddify 仅在完整配置模式下保留全部输入，普通路径可能只提取节点。导入后核对 `route`、`dns`、`rule_set` 和组引用；依据见[核验报告](../docs/upstream/2026-10-19/singbox/report.md#hiddify)。

本次通过的是官方 sing-box 1.13.14 的配置检查，尚未在 Hiddify 4.1.1 App 内进行完整配置导入和连接验收。

## v2rayN

使用**自定义配置服务器**加载对应 JSON，并核对所用 sing-box 核心版本。v2rayN 7.25.6 声明支持并限制在 sing-box 1.14 系列；1.15 alpha 不在该版本支持范围。[官方发布说明](https://github.com/2dust/v2rayN/releases/tag/7.25.6)

选择 Xray 核心时使用本仓库 [v2rayN Xray 路由](../v2rayN/README.md)。Xray 原生路由不能直接消费 sing-box `.srs`。

## HomeProxy

[HomeProxy](https://github.com/immortalwrt/homeproxy) 从节点订阅和 UCI 重建配置，不能据此保证导入 Full JSON 后保留全部规则和组。

尚无经验证的 Full JSON → HomeProxy UCI 转换器。请通过其 UI 配置节点、DNS、分流与 rule-set，再检查生成结果；直接运行原生 JSON 则需自行管理服务与防火墙。

Passwall / Passwall2 都支持 sing-box 与 Xray 后端，使用各自目录的受控脚本；本仓库 fused `.srs` 路径要求实际分流后端为 sing-box。

## 其他客户端与验证边界

SagerNet 的 1.14.3 官方发布资产包含同版本 SFA APK、SFM 安装包及越狱版 SFI deb；独立 Android/Apple 源码仓库没有自己的 release。官网门槛为 Android 5.0+（低版本需对应 legacy 构建）、iOS 15+ / macOS 13+ / tvOS 17+。Play Store / App Store / TestFlight 的实际版本仍需在所用渠道核对，不能由 GitHub 核心版本直接推定。[Android 官方说明](https://sing-box.sagernet.org/clients/android/)、[Apple 官方说明](https://sing-box.sagernet.org/clients/apple/)

完整配置仍需满足实际内核版本与导入条件。Karing、NekoBox 等应用的转换、覆盖和 UI 行为未在本次验证，不能仅凭采用 sing-box 内核认定完整 JSON 可原样导入。

本次验收包括官方 1.14.3 / 1.13.14 `check`、两变体结构与 URL 对比，以及生成器回归。未使用真实机场节点启动 VPN，未替用户更改设备网络设置。

## 维护与生成

```bash
node "SingBox/SingBox(sing-box)-generator.js"
node --test tools/tests/singbox-current-schema.test.js
```

禁止手工修改两个生成 JSON。规则仍从 `rulesets/source/routing-graph.js` 经融合链路进入生成器；完整维护契约见根 [AGENTS.md](../AGENTS.md)。

Claude Desktop 网络依赖见[依赖台账](../docs/claude-service-dependencies.md)，微信精确域名处理见[连接排障](../docs/research/2026-10-16-wechat-issue-187.md)。

<sub>💖 [支持本项目](../docs/donate.md) · ⭐ [Star](https://github.com/IvanSolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/IvanSolis1989/Smart-Config-Kit/issues)</sub>
