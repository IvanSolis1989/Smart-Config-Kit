# v2rayN 使用教程（对齐 Clash Party v6.0.14）

> 目录简介：这里提供 v2rayN 多核心导入教程和 Xray 路由 JSON fallback 产物说明。
>
> 路径 C（Xray 核）产物：`v2rayN/v2rayN(xray).json` v6.0.14-v2n.5（Build 2026-09-29；基线：Clash Party v6.0.14；变更历史见 `v2rayN/CHANGELOG.md`）。

---

## 1. 先选核心

v2rayN 是多核心调度器，不是单一代理内核。Smart-Config-Kit 在 v2rayN 里有三条路径：

| 路径 | 核心 | 使用文件 | 保真度 | 适用场景 |
| --- | --- | --- | --- | --- |
| A | mihomo | `Clash Meta For Android/CMFA(mihomo).yaml` | 高 | 推荐路径；保留 22 区域组 + 33 业务组 |
| B | sing-box | `SingBox/SingBox(sing-box)-full.json` | 中高 | 想用 sing-box selector/urltest |
| C | Xray | `v2rayN/v2rayN(xray).json` | 降级 | 已有 Xray 节点配置、不想换核心 |

想要 Clash Party JS 覆写、Smart 内核和 LightGBM 自动择优，请使用 Clash Party / Mihomo Party / Clash Verge Rev。v2rayN 不能执行 `ClashParty(mihomo-smart).js`。

---

## 2. 路径 A：mihomo 核心

1. 打开 v2rayN。
2. 进入设置里的核心基础设置，切到 mihomo。
3. 新增 Clash 订阅，URL 填本仓库 `Clash Meta For Android/CMFA(mihomo).yaml`。
4. 启动后应能看到 22 个区域组和 33 个业务组。

这条路径最接近仓库主线，但 CMFA 是静态 YAML，不执行 Clash Party JS，所以没有 LightGBM Smart 组。

---

## 3. 路径 B：sing-box 核心

1. 在 v2rayN 里切到 sing-box 核心。
2. 导入 `SingBox/SingBox(sing-box)-full.json`。
3. 按你的机场订阅替换或合并节点。

SingBox Full 使用 `rulesets/generated/fused/sing-box/*.srs`，是本仓库 fused 规则集的原生消费路径。

---

## 4. 路径 C：Xray 核心 fallback

`v2rayN/v2rayN(xray).json` 是给 Xray 核心准备的降级路由规则数组。当前文件由 `tools/generate-fused-fallback-artifacts.js` 从 `rulesets/generated/fused/sing-box/*.json` 展平成原生 Xray RuleObject：

- 1 条禁用 meta 规则。
- 69 条非空 fused 顺序段 + 19 条可表达内联规则 + 1 条元数据，共 89 条 Xray RuleObject，保持源规则图的首匹配顺序。
- 19 条端口、进程加域名逻辑组合和 `MATCH` 等必要内联规则。
- 出站只使用 `proxy`、`direct`、`block` 三个标签。

Xray routing 支持 `domain`、`ip`、`port`、`process`、`outboundTag` 等 RuleObject 字段，但没有 sing-box `.srs` 远程 rule-set 字段。因此路径 C 不能像 sing-box 一样引用远程 `.srs`，只能把 fused JSON 展开为 Xray 原生数组。广告段很大，所以 JSON 文件体积明显大于旧手写版。

本机 Windows / Linux 的进程规则会随 fused direct 段导入；`WorkPro.exe` 与 `WorkProWebProcess.exe` 由 `local-process-direct` 的永久回归契约保持为 `direct`。这类规则只对运行 Xray 的本机有效。

导入步骤：

1. 保持 v2rayN 使用 Xray 核心。
2. 进入路由设置，导入 `v2rayN/v2rayN(xray).json`。
3. 确认主配置里存在 `proxy`、`direct`、`block` 三个出站标签。
4. 节点仍然通过 v2rayN 常规订阅管理；本文件只负责路由规则。

路径 C 的限制：

- 没有 33 个业务策略组和 22 个区域组。
- 没有 URLTest、Smart、LightGBM、节点过滤和订阅组重建。
- 大量规则被压到三出站模型：国内直连、广告屏蔽、其他代理。
- 端口/逻辑规则只覆盖 Xray 可表达的部分；无法表达的平台能力由生成器和验证器记录为例外。

---

## 5. Happ 用户

Happ 使用 Xray-core。若使用原始 JSON 导入模式，可复用 `v2rayN/v2rayN(xray).json` 获得同样的 `proxy/direct/block` 三级分流。若更偏好 Happ 原生路由 Profile，请用 Happ 自身工具生成等价路由。

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
