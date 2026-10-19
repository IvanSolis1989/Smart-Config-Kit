# Egern 使用教程

## 📥 规则下载链接

[![下载规则：Egern YAML](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Egern%20YAML-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Egern/Egern.yaml)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**Egern YAML 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Egern/Egern.yaml
```

下载 Egern Profile，按下文导入并接入节点订阅。

---

规则下载需能访问 GitHub Raw；见[下载排错](../docs/rule-asset-delivery.md)。可选[测速与 QUIC 策略](../docs/traffic-options.md)、[微信连接排错](../docs/research/2026-10-16-wechat-issue-187.md)与[Claude Desktop 网络依赖](../docs/claude-service-dependencies.md)另有说明。

> 配置：`Egern.yaml` · **v6.0.20-egern.10**（Build 2026-10-16）
> 22 原生 smart 区域组 + 33 业务组；跟随 Clash Party v6.0.20 分流基线。

## 定位

`Egern.yaml` 是可导入的 Egern Profile，包含 22 个原生 `smart` 区域组、33 个业务组及本仓库原生 YAML 规则集。

Egern 不能据 Mihomo 兼容性推断支持 `.mrs`；本配置使用 Egern 原生 `rule_set`。字段与生成依据见 [REFERENCE-Egern.md](./REFERENCE-Egern.md)。

## 快速导入

1. 下载 `Egern.yaml`。
2. 在本地副本把 `policy_groups -> Subscribe -> urls` 中的示例订阅替换为机场订阅。
3. 导入 Egern，检查订阅节点与远程 `rule_set` 下载完成。
4. 确认区域组实际成员，选择业务组上游后测试请求出口；GitHub Raw 不可达时，先使用可用代理下载。

截至 2026-10-19，官方稳定版 2.20.0 要求 iOS 16+；其他设备兼容性以[官方商店](https://apps.apple.com/app/egern/id1616105820)为准。

## 平台边界

- Egern `smart` 使用原生自适应逻辑，不是 Mihomo Smart / LightGBM。
- 当前订阅保留兼容的 `external` 写法；2.20.0 支持基本组直接附 `urls`，本配置暂无迁移需要。
- 进程规则缺少对应的官方字段证据，相关逻辑是平台例外；不把 iOS 限制推断为所有桌面平台能力。
- 本轮未完成 App 导入与真实订阅展开验收，见[复核报告](../docs/upstream/2026-10-19/apple/report.md)。

## 官方依据

[策略组](https://egernapp.com/docs/configuration/policy_groups/) · [规则](https://egernapp.com/docs/configuration/rules/) · [DNS](https://egernapp.com/docs/configuration/dns/)。

仓库维护通过 `tools/generate-egern-from-cmfa.js` 生成 Profile 与规则资产；不要手工修改仓库生成结果。官方正文缓存、版本证据与待核项见[复核报告](../docs/upstream/2026-10-19/apple/report.md)。
