[English](README.md) | **中文**

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/zh-CN/page-sing-box-mobile.svg">
  <img src="../../docs/assets/readme/zh-CN/page-sing-box.svg" alt="SingBox 导入指南" width="100%">
</picture>

# SingBox Full 导入指南

<a id="singbox-full-配置"></a>



同源生成的完整 sing-box 配置，包含 20 个区域组、33 个业务组和 1 个节点选择组。先核对内核版本，再替换示例节点并导入。

[![下载入口](../../docs/assets/readme/zh-CN/nav-downloads.svg)](../../docs/guide/downloads.md) [![文档导航](../../docs/assets/readme/zh-CN/nav-docs.svg)](../../docs/README.md) [![导入验收](../../docs/assets/readme/zh-CN/nav-verify.svg)](#verification)

[开始前](#before-start) · [分步导入](#import) · [Hiddify](#hiddify) · [v2rayN](#v2rayn) · [HomeProxy](#homeproxy) · [常见问题](#faq) · [进阶参考](#advanced)

> 配置版本：`v6.0.24-sing.15` · Build：2026-11-28 · 规则基线：`rulesets/source/routing-graph.js` v6.0.24。历史见 [CHANGELOG](CHANGELOG.md)。

私有域名继续使用直连 DNS。主广告规则在普通 DNS 查询前拒绝匹配项，并沿用分流规则中优先匹配的业务例外。

<a id="before-start"></a>
<a id="-规则下载链接"></a>


[可选业务方案与本地参数](../../docs/configuration.zh-CN.md)：完整配置继续作为默认；可选投影输出到独立目录，运行时参数支持范围见统一指南。

## 开始前：选择文件

| 使用环境 | 配置文件 | 内核要求 |
| --- | --- | --- |
| 当前稳定版、v2rayN 自定义 sing-box 配置 | [下载 Full JSON](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json) | sing-box **1.14.x（从 1.14.3 起）** |
| 实际使用 sing-box 1.13 内核的客户端 | [下载 1.13 兼容 JSON](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-1.13.json) | 官方 sing-box **1.13.14** 已通过检查 |

[![下载 sing-box Full JSON](../../docs/assets/readme/zh-CN/button-sing-box-full.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json)
[![下载 sing-box 1.13 JSON](../../docs/assets/readme/zh-CN/button-sing-box-113.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-1.13.json)

按钮打开 Raw 文件，可复制链接或另存为。两份地址依次为 Full、1.13 兼容版：

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-1.13.json
```

规则更新需要能访问 GitHub Raw 的网络或可用代理，排查见[规则下载说明](../../docs/rule-asset-delivery.zh-CN.md)。

### 在线选择与本地导入

打开[在线配置页面](https://ivansolis1989.github.io/Smart-Config-Kit/)，按实际内核选择 **sing-box 1.14**（Full JSON 面向 1.14.3 起的 1.14 系列）或 **sing-box 1.13**，再选择 Full、Lite 或 Custom 业务方案及测速、QUIC 参数，下载 JSON。按照下方步骤替换示例节点、检查配置，并从客户端支持的完整自定义配置入口加载。Hiddify 和 HomeProxy 的完整 JSON 保留能力及验收边界见各自章节。

更新时刷新页面，重新选择版本、业务和参数并下载；备份原配置及节点设置后替换同类本地配置，重新核对节点引用和实际加载结果。不要用官方完整配置的远程 URL 覆盖定制文件。选择和生成在浏览器本地完成，不读取或上传订阅及个人配置。

<a id="import"></a>
<a id="选择配置与接入节点"></a>

## 分步导入

1. **确认版本。** 在客户端内核信息中查实际 sing-box 版本，选择上表对应文件并保存到本地。应用版本与内核版本分别核对。
2. **替换节点。** 编辑 JSON 的 `outbounds`，将 `proxy-hk-1`、`proxy-us-1` 等 `trojan` 示例出站替换为真实节点。节点标签须与区域组引用一致；增加或更名节点时，同步修改相应组的 `outbounds`。示例节点本身不能连接。
3. **检查配置。** 使用匹配版本的原生核心运行：

   ```sh
   sing-box check -c 配置文件.json
   ```

4. **加载完整配置。** 通过客户端明确支持的完整自定义配置入口加载。Hiddify、v2rayN 和 HomeProxy 的导入差异见下文；普通订阅转换可能只提取节点。
5. **选择出口并启用。** 确认区域组中有真实节点，业务组指向预期出口，再启动连接。客户端托管 TUN 时，按其完整配置模式调整入站并检查最终配置。

节点不会自动按名称填入区域组；转换订阅后仍需核对标签和引用。

<a id="verification"></a>

## 导入验收

- 最终配置保留 **54 个 selector/urltest、85 个 remote rule-set**。两变体共用相同出站拓扑、98 条路由规则（含 1 条非终结嗅探动作）及规则集 URL。
- 日志中规则集下载成功，真实节点能够连接；业务规则按源规则顺序匹配，最终兜底为 `🐟 漏网之鱼`。
- 核对客户端最终生效的 `route`、`dns`、`rule_set`、组引用和 TUN 设置，再按[运行验证清单](../../docs/guide/dns-and-verification.zh-CN.md#verification)检查实际分流。

仓库检查两份 JSON 的配置结构、规则 URL 和官方内核兼容性。GUI 导入及实际连接另行验收。[版本与验证依据](REFERENCE-sing-box.zh-CN.md#compatibility-review-2026-11-28)

## Hiddify

[Hiddify 5.9.15](https://github.com/hiddify/hiddify-app/releases/tag/v5.9.15) 可以读取 sing-box 语法。常规订阅配置构建器会替换本仓库 1.14 与 1.13 两份配置的路由和选择组，官方 Windows Core 在启用完整配置选项时也复现了这一行为。

要保留源分流，可用支持完整 JSON 的官方 sing-box 客户端。独立 Hiddify Core 的 `srun` 入口按官方文档直接读取原始 sing-box JSON。若选用原始配置入口，先核对生效的 `route`、`dns`、规则下载路径和组引用，再连接。[构建器验证](REFERENCE-sing-box.zh-CN.md#hiddify-profile-builder) · [Hiddify Core 官方说明](https://hiddify.com/core/#run-run-or-srun)

## v2rayN

使用**自定义配置服务器**加载对应 JSON，并核对所用 sing-box 核心版本。v2rayN 7.25.6 声明支持并限制在 sing-box 1.14 系列；1.15 alpha 不在该版本支持范围。[官方发布说明](https://github.com/2dust/v2rayN/releases/tag/7.25.6)

选择 Xray 核心时使用本仓库 [v2rayN Xray 路由](../../Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/README.zh-CN.md)。Xray 原生路由不能直接消费 sing-box `.srs`。

## HomeProxy

[HomeProxy](https://github.com/immortalwrt/homeproxy) 从节点订阅和 UCI 生成配置。先核对路由器上实际安装的 sing-box 版本，再通过 LuCI 配置节点、DNS、分流与 rule-set。用本机内核对生成文件运行 `sing-box check`，并验证启动及规则下载。内核由 ImmortalWrt 软件源单独提供，稳定分支和 master 的版本可能不同。[软件源与兼容性依据](REFERENCE-sing-box.zh-CN.md#homeproxy-package-and-uci)

Passwall / Passwall2 都支持 sing-box 与 Xray 后端，使用各自目录的受控脚本；本仓库 fused `.srs` 路径要求实际分流后端为 sing-box。

<a id="faq"></a>

## 常见问题

**导入后为什么只有节点？** 该入口可能将完整配置转成订阅模型。先确认完整配置模式，再读回路由、DNS 和组引用。Karing 请使用[原生分流适配教程](../Karing/README.zh-CN.md)。

**有备用 DNS 就会自动切换吗？** `dns_direct2` / `dns_proxy2` 是预留服务器，存在备用项不代表内核自动故障切换，详见下方 DNS 说明。

**规则下载失败怎么办？** 先确认真实节点可用、规则下载出口可连接，再检查[规则下载说明](../../docs/rule-asset-delivery.zh-CN.md)；保存下载错误和最终配置有助于定位问题。

<a id="advanced"></a>

## 进阶参考

<details>

<summary>DNS、规则下载与嗅探</summary>

### DNS、规则下载与嗅探

两份配置都使用 typed DNS server：`type: https`、`server`、`path` 和 `domain_resolver`。IP 自举 DoH 保留证书 SNI；国内解析经 `DIRECT`，代理解析经 `🚀 节点选择`。`dns_direct2` / `dns_proxy2` 是预留服务器，存在备用项不代表内核会自动故障切换。

Full 使用 1.14 的命名 `http_clients` 下载规则集，通过 `evaluate` / `match_response` / `respond` 显式处理 CN IP 解析结果。1.13 兼容文件使用该稳定系列支持的 `download_detour` 与 DNS GeoIP 接受过滤。两者均将规则下载交给 `🌍 全球节点`。

TUN 使用 `172.19.0.1/30`、`auto_route`、`strict_route` 和 `stack: mixed`。现有两份配置分别面向 1.14 和 1.13 系列。使用官方 1.15 预发布构建前，应单独核对 [TUN 协议栈迁移](https://sing-box.sagernet.org/migration/#migrate-tun-stack)。嗅探使用非终止 `action: sniff`。若客户端托管 TUN，检查最终生效的入站配置。

嗅探可辅助 SNI/Host 匹配，但不能恢复旧 `sniff_override_destination=true` 的动态目的地址重写：IP 目的仍拨原 IP。`route-options.override_address` 只支持固定地址。源码与影响见[迁移边界](../../docs/upstream/2026-10-19/singbox/report.zh-CN.md#嗅探迁移的行为边界)。

官方依据：[DNS HTTPS server](https://sing-box.sagernet.org/configuration/dns/server/https/)、[rule-set](https://sing-box.sagernet.org/configuration/rule-set/)、[迁移说明](https://sing-box.sagernet.org/migration/)。

</details>

<details>

<summary>其他客户端与验证边界</summary>

### 其他客户端与验证边界

[官方 1.14.6 发布页](https://github.com/SagerNet/sing-box/releases/tag/v1.14.6) 提供 Android APK、macOS 安装包、越狱版 iOS 安装包，以及 Windows/Linux 桌面客户端。Apple 商店当前产品为 **sing-box MT**。从旧 App 或使用旧开发者账号的 macOS 独立版迁移前，先导出现有配置。Linux 桌面安装包现名为 `sfl`，与 CLI 分开安装。App Store、Play Store 和 F-Droid 的版本各按实际渠道核对。[Android](https://sing-box.sagernet.org/clients/android/) · [Apple](https://sing-box.sagernet.org/clients/apple/) · [桌面客户端](https://sing-box.sagernet.org/clients/desktop/) · [macOS 迁移](https://sing-box.sagernet.org/migration/#migrate-the-macos-standalone-client-data)

完整配置仍需满足实际内核版本与导入条件。Karing、NekoBox 等应用的转换、覆盖和 UI 行为未在本次验证，不能仅凭采用 sing-box 内核认定完整 JSON 可原样导入。

</details>

<details>

<summary>维护与生成</summary>

### 维护与生成

```bash
node "Sing-box内核系/SingBox/SingBox(sing-box)-generator.js"
node --test tools/tests/singbox-current-schema.test.js
```

禁止手工修改两个生成 JSON。规则仍从 `rulesets/source/routing-graph.js` 经融合链路进入生成器；完整维护契约见根 [AGENTS.md](../../AGENTS.md)。

Claude Desktop 网络依赖见[依赖台账](../../docs/claude-service-dependencies.zh-CN.md)，微信精确域名处理见[连接排障](../../docs/research/2026-10-16-wechat-issue-187.zh-CN.md)。



</details>

<sub>💖 [支持本项目](../../docs/donate.zh-CN.md) · ⭐ [Star](https://github.com/IvanSolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/IvanSolis1989/Smart-Config-Kit/issues)</sub>
