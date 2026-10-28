<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-v2rayn-mobile.svg">
  <img src="../../docs/assets/readme/page-v2rayn.svg" alt="v2rayN 导入指南" width="100%">
</picture>

# v2rayN 导入指南

<a id="v2rayn-使用教程对齐-clash-party-v6020"></a>



先选核心，再导入对应文件。mihomo / sing-box 使用完整配置，Xray 使用三出站路由规则数组。

[![下载入口](../../docs/assets/readme/nav-downloads.svg)](../../docs/guide/downloads.md) [![文档导航](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [![导入验收](../../docs/assets/readme/nav-verify.svg)](#verification)

[选择核心与文件](#before-start) · [下载](#download) · [路径 A：mihomo](#2-路径-amihomo-核心) · [路径 B：sing-box](#3-路径-bsing-box-核心) · [路径 C：Xray](#4-路径-cxray-核心-fallback) · [常见问题](#faq) · [进阶参考](#advanced)

> Xray 路由版本：`v6.0.21-v2n.11` · Build：2026-10-28 · 基线：Clash Party v6.0.21。历史见 [CHANGELOG](CHANGELOG.md)。

<a id="before-start"></a>
<a id="1-先选核心"></a>

## 开始前：选择核心与文件

v2rayN 是多核心调度器；同一个文件不能通用于所有核心。准备可用节点或订阅，并在 App 中核对当前使用的核心和实际核心版本。

| 核心路径 | 使用文件 | 导入边界 |
| --- | --- | --- |
| A · mihomo | CMFA YAML | 静态规则模板；补入真实节点或订阅 provider，保留 22 区域组和 33 业务组 |
| B · sing-box | Full / 1.13 兼容 JSON | 替换示例节点，通过自定义配置服务器加载；按实际内核版本选文件 |
| C · Xray | 本目录 Xray 路由 JSON | 仅路由规则数组，出站只有 `proxy` / `direct` / `block`；节点继续由 App 管理 |

v2rayN 不能执行 Clash Party JS。需要 Smart / LightGBM 时，应使用支持覆写的客户端及 vernesong Smart 内核；普通 Mihomo / Alpha 不等同于 Smart。

<a id="download"></a>
<a id="-规则下载链接"></a>

## 下载对应文件

[![下载 mihomo YAML](../../docs/assets/readme/button-mihomo-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)
[![下载 sing-box JSON](../../docs/assets/readme/button-sing-box-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json)
[![下载 Xray 路由 JSON](../../docs/assets/readme/button-xray-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/v2rayN%28xray%29.json)

按钮打开 Raw 文件，可复制链接或另存为。

**mihomo YAML 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml
```

**sing-box JSON 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json
```

**Xray 路由 JSON 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/v2rayN%28xray%29.json
```

规则下载需能访问 GitHub Raw 的网络或可用代理；故障排查见[规则下载说明](../../docs/rule-asset-delivery.md)。

<a id="2-路径-amihomo-核心"></a>

## 路径 A：mihomo 完整配置

1. 使用 mihomo 核心的自定义配置入口加载 `Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml`。
2. 先补入真实节点或订阅 provider，再检查最终配置的 22 个区域组、33 个业务组与节点引用。静态规则模板本身不含机场节点，不能作为节点订阅直接连接。

这条路径最接近仓库主线，但 CMFA 是静态 YAML，不执行 Clash Party JS，所以没有 LightGBM Smart 组。

<a id="3-路径-bsing-box-核心"></a>

## 路径 B：sing-box 完整配置

1. 确认核心版本，通过**自定义配置服务器**加载 [SingBox 对应版本 JSON](../../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/README.md)。Full 要求 1.14.3+，另有 1.13 兼容文件。
2. 替换示例节点并核对组引用，按 SingBox 教程检查最终配置。

SingBox Full 使用 `rulesets/generated/fused/sing-box/*.srs`，是本仓库 fused 规则集的原生消费路径。

<a id="4-路径-cxray-核心-fallback"></a>

## 路径 C：Xray 路由

`Xray内核系/v2rayN/v2rayN(xray).json` 是给 Xray 核心准备的降级路由规则数组。当前文件由 `tools/generate-fused-fallback-artifacts.js` 从 `rulesets/generated/fused/sing-box/*.json` 展平成原生 Xray RuleObject：

共 98 项：78 个非空融合段、19 条可表达内联规则和 1 条禁用元数据规则，保持首匹配顺序；出站仅有 `proxy`、`direct`、`block`。

Xray 无 sing-box `.srs` 远程规则字段，须展开为原生 RuleObject，文件因此较大。

本机 Windows / Linux 的进程规则会随 fused direct 段导入；`WorkPro.exe` 与 `WorkProWebProcess.exe` 由 `local-process-direct` 的永久回归契约保持为 `direct`。这类规则只对运行 Xray 的本机有效。

### 导入步骤

1. 保持 v2rayN 使用 Xray 核心。
2. 进入路由设置，导入 `Xray内核系/v2rayN/v2rayN(xray).json`。
3. 确认主配置里存在 `proxy`、`direct`、`block` 三个出站标签。
4. 节点仍然通过 v2rayN 常规订阅管理；本文件只负责路由规则。

### 能力边界

- 三出站模型不保留区域/业务策略组。没有 URLTest、Smart、LightGBM、节点过滤和订阅组重建。
- 端口/逻辑规则只覆盖 Xray 可表达的部分，例外由生成器和验证器记录。

<a id="verification"></a>

## 导入验收

- **路径 A：** 真实节点或 provider 已加入，55 个区域 / 业务组与节点引用完整，规则下载成功。
- **路径 B：** 核心版本匹配 JSON；完整配置保留 `route`、`dns`、`rule_set` 和组引用，示例节点已替换；按 [SingBox 验收](../../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/README.md#verification)继续检查。
- **路径 C：** 已启用导入的路由，规则顺序完整，主配置存在 `proxy`、`direct`、`block`，实际业务命中预期出口。

三条路径均需用真实连接检查最终配置和日志，继续参考[运行验证清单](../../docs/guide/dns-and-verification.md#verification)。现有官方源码与配置检查不等同于 v2rayN App 实际导入或连接验收。

<a id="faq"></a>

## 常见问题

**下载 JSON 后为什么没有节点？** 路径 C 只包含路由；路径 A 是静态模板，路径 B 带待替换示例。按对应路径接入真实订阅或节点，再检查出站引用。

**能将 Xray 文件作为完整配置加载吗？** 该文件是 v2rayN 自定义路由规则数组，应在路由设置中导入。完整配置入口用于 mihomo / sing-box 对应文件。

**Xray 能使用本仓库的 SRS 吗？** 不能。Xray 路径将融合 source JSON 展平成原生 RuleObject，也不保留嵌套区域与业务组。

<a id="advanced"></a>

## 进阶参考

<a id="5-happ-用户"></a>

### Happ 用户

Happ 使用 Xray-core，但其原生路由 Profile、完整 Xray JSON 与 v2rayN 的 RuleObject 数组是不同格式。**不能将本目录 JSON 直接导入 Happ 并视为同等策略。** Happ 的官方 Profile 由 `happ://routing/...` 传递，JSON 订阅又有独立的路由绑定限制；详见[官方导入文档](https://www.happ.su/main/dev-docs/routing)和[本次核对](../../docs/upstream/2026-10-19/consumers/report.md)。本仓库尚未提供经过验收的 Happ 原生产物或转换器。

<details>

<summary>维护者入口与官方格式</summary>

<a id="6-维护者入口"></a>

### 维护者入口

不要手工编辑 `Xray内核系/v2rayN/v2rayN(xray).json`。规则源来自 `rulesets/source/routing-graph.js`，fallback 产物由下面命令生成：

```bash
node tools/build-fused-rule-sets.js
node tools/generate-fused-fallback-artifacts.js
node tools/validate-artifact-contracts.js --strict-ruby
```

官方语法参考：

- v2rayN 自定义路由规则：https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules
- Xray routing RuleObject：https://xtls.github.io/config/routing.html

补充说明：[Claude 服务依赖](../../docs/claude-service-dependencies.md) · [测速与 QUIC](../../docs/traffic-options.md) · [微信连接排障](../../docs/research/2026-10-16-wechat-issue-187.md)。

</details>
