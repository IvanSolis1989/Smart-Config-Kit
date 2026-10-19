# v2rayN 使用教程（对齐 Clash Party v6.0.20）

## 📥 规则下载链接

[![下载规则：mihomo YAML](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-mihomo%20YAML-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)
[![下载规则：sing-box JSON](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-sing--box%20JSON-0969da?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/SingBox/SingBox%28sing-box%29-full.json)
[![下载规则：Xray 路由 JSON](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Xray%20%E8%B7%AF%E7%94%B1%20JSON-0969da?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/v2rayN/v2rayN%28xray%29.json)

按钮打开 Raw 文件，可复制链接或另存为。

**mihomo YAML 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml
```

**sing-box JSON 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/SingBox/SingBox%28sing-box%29-full.json
```

**Xray 路由 JSON 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/v2rayN/v2rayN%28xray%29.json
```

按当前核心选择：mihomo / sing-box 使用对应配置，Xray JSON 用于路由设置导入；具体步骤见下文三条路径。

---

规则更新依赖可访问 GitHub raw 的网络或可用代理；导入与下载故障排查见[规则下载说明](../docs/rule-asset-delivery.md)。


> 路径 C（Xray 核）产物：`v2rayN/v2rayN(xray).json` v6.0.20-v2n.9（Build 2026-10-16；基线：Clash Party v6.0.20；源 525 providers / 984 rules，融合 149 providers / 168 rules）。

---

## 1. 先选核心

v2rayN 是多核心调度器，不是单一代理内核。Smart-Config-Kit 在 v2rayN 里有三条路径：

| 路径 | 核心 | 使用文件 | 保真度 | 适用场景 |
| --- | --- | --- | --- | --- |
| A | mihomo | `Clash Meta For Android/CMFA(mihomo).yaml` | 高 | 推荐路径；保留 22 区域组 + 33 业务组 |
| B | sing-box | `SingBox/SingBox(sing-box)-full.json` | 中高 | 想用 sing-box selector/urltest |
| C | Xray | `v2rayN/v2rayN(xray).json` | 降级 | 已有 Xray 节点配置、不想换核心 |

v2rayN 不能执行 Clash Party JS；需要 Smart/LightGBM 时使用支持覆写的客户端并安装 vernesong Smart 内核，普通 Mihomo/Alpha 不等同于 Smart。

---

## 2. 路径 A：mihomo 核心

1. 使用 mihomo 核心的自定义配置入口加载 `Clash Meta For Android/CMFA(mihomo).yaml`。
2. 先补入真实节点或订阅 provider，再检查最终配置的 22 个区域组、33 个业务组与节点引用。静态规则模板本身不含机场节点，不能作为节点订阅直接连接。

这条路径最接近仓库主线，但 CMFA 是静态 YAML，不执行 Clash Party JS，所以没有 LightGBM Smart 组。

---

## 3. 路径 B：sing-box 核心

1. 确认核心版本，通过**自定义配置服务器**加载 [SingBox 对应版本 JSON](../SingBox/README.md)。Full 要求 1.14.3+，另有 1.13 兼容文件。
2. 替换示例节点并核对组引用，按 SingBox 教程检查最终配置。

SingBox Full 使用 `rulesets/generated/fused/sing-box/*.srs`，是本仓库 fused 规则集的原生消费路径。

---

## 4. 路径 C：Xray 核心 fallback

`v2rayN/v2rayN(xray).json` 是给 Xray 核心准备的降级路由规则数组。当前文件由 `tools/generate-fused-fallback-artifacts.js` 从 `rulesets/generated/fused/sing-box/*.json` 展平成原生 Xray RuleObject：

共 98 项：78 个非空融合段、19 条可表达内联规则和 1 条禁用元数据规则，保持首匹配顺序；出站仅有 `proxy`、`direct`、`block`。

Xray 无 sing-box `.srs` 远程规则字段，须展开为原生 RuleObject，文件因此较大。

本机 Windows / Linux 的进程规则会随 fused direct 段导入；`WorkPro.exe` 与 `WorkProWebProcess.exe` 由 `local-process-direct` 的永久回归契约保持为 `direct`。这类规则只对运行 Xray 的本机有效。

导入步骤：

1. 保持 v2rayN 使用 Xray 核心。
2. 进入路由设置，导入 `v2rayN/v2rayN(xray).json`。
3. 确认主配置里存在 `proxy`、`direct`、`block` 三个出站标签。
4. 节点仍然通过 v2rayN 常规订阅管理；本文件只负责路由规则。

路径 C 的限制：

- 三出站模型不保留区域/业务策略组。没有 URLTest、Smart、LightGBM、节点过滤和订阅组重建。
- 端口/逻辑规则只覆盖 Xray 可表达的部分，例外由生成器和验证器记录。

---

## 5. Happ 用户

Happ 使用 Xray-core，但其原生路由 Profile、完整 Xray JSON 与 v2rayN 的 RuleObject 数组是不同格式。**不能将本目录 JSON 直接导入 Happ 并视为同等策略。** Happ 的官方 Profile 由 `happ://routing/...` 传递，JSON 订阅又有独立的路由绑定限制；详见[官方导入文档](https://www.happ.su/main/dev-docs/routing)和[本次核对](../docs/upstream/2026-10-19/consumers/report.md)。本仓库尚未提供经过验收的 Happ 原生产物或转换器。

---

## 6. 维护者入口

不要手工编辑 `v2rayN/v2rayN(xray).json`。规则源来自 `rulesets/source/routing-graph.js`，fallback 产物由下面命令生成：

```bash
node tools/build-fused-rule-sets.js
node tools/generate-fused-fallback-artifacts.js
node tools/validate-artifact-contracts.js --strict-ruby
```

官方语法参考：

- v2rayN 自定义路由规则：https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules
- Xray routing RuleObject：https://xtls.github.io/config/routing.html

补充说明：[Claude 服务依赖](../docs/claude-service-dependencies.md) · [测速与 QUIC](../docs/traffic-options.md) · [微信连接排障](../docs/research/2026-10-16-wechat-issue-187.md)。
