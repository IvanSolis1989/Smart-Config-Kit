# Passwall2 — 变更日志

> `Passwall2/README.md` 的变更日志。
> 本目录提供 Passwall2 的**降级版** shunt rule 参考（28 条展平，功能约 OpenClash slim 的 70%）。
> 主版本号跟随 Clash Party 主线；尾段 `-pw2.N` 独立递增。

---

## v5.2.5-pw2.1 (2026-04-20) — 初版

- ★ 初版：从 Clash Party v5.2.5 基线手工展平为 Passwall2 shunt rule 格式
- ★ 28 条 shunt rule 覆盖 28 业务分类，每条包含：
  - 推荐节点区域（对应 Clash Party 9 区域组，用户在 Passwall2 里创建负载均衡组时参照）
  - 域名列表（`geosite:xxx` 为主 + `domain-suffix:xxx` 补充）
  - IP 列表（`geoip:xxx` 按需）
- ★ 关键规则顺序约束：
  - 广告拦截作为最高优先级（Passwall2 独立开关或 shunt rule 目标 = block）
  - 国内网站（`geosite:cn` + `geoip:cn`）放倒数第 5
  - 受限网站（`geosite:gfw`）放倒数第 4
  - 国外网站（`geosite:geolocation-!cn`）放倒数第 3
  - FINAL 兜底放倒数第 2
- ★ 协议支持说明：跟随 Passwall2 用户选的核（xray / sing-box），**不是独立产物**——用户需自行下载 geosite.dat / geoip.dat

### 与 Clash Party 主线的差异（Passwall 引擎限制）

- ❌ **无 proxy-groups 嵌套**：Clash 的"业务组 → 区域组 → url-test 节点"两级结构在 Passwall 里手工展平为 28 条 shunt rule，每条直接指向一个节点或负载均衡组
- ❌ **无 LightGBM 自动择优**：Passwall 的"负载均衡"组基于 xray/sing-box 的 `balancer`，只支持简单 `round-robin` / `random` / `leastLoad`，不含机器学习
- ❌ **无机场换节点自动分类**：Passwall 的节点标签靠手工维护；机场换节点时需要重新把节点拖入各地区负载均衡组
- ❌ **无 JS 覆写**：订阅更新时没有预处理机会
- ❌ **无 Clash 原生 rule-provider 格式**：Passwall2 支持 sing-box 的 `rule_set` remote URL（可按需加），但和 Clash 的格式不同
- ⚠️ **广告拦截降级**：只能用 1-2 个 list（如 `geosite:category-ads-all`），不像 OpenClash 可以并集 20+ 源（DustinWin + SukkaW + Hagezi + Accademia + bm7 各广告集）

### 推荐使用场景

- ✅ 已经装了 Passwall2 且不想换 OpenClash 的用户
- ✅ 只要基础分流能力，不在乎 LightGBM / 自动归位
- ✅ 路由器内存紧张但不愿装 OpenClash slim

### 不推荐的场景（请换 OpenClash）

- ❌ 想要 Smart + LightGBM 自动择优
- ❌ 经常换机场、希望节点自动归位到区域组
- ❌ 需要广告拦截深度防护（钓鱼 / 威胁情报 / DNS 劫持 / 隐私追踪等多源并集）
- ❌ 追求和 Clash Party 桌面端的精确一致性

### 维护同步策略

当 Clash Party 主线有规则/组/业务调整（典型场景：新增/删除业务组、rule-provider 变动）时，本 `Passwall2/README.md` 的 28 条 shunt rule 需要**手工同步**：

1. 新增业务组 → 在 README 里加一节 shunt rule，带推荐节点 + 域名/IP 列表
2. 删除业务组 → 删除对应 shunt rule 节，并在本 CHANGELOG 标注
3. 业务组内新增域名 → 更新对应 shunt rule 的"域名列表"字段

**豁免**：Clash Party 的纯 region/LightGBM 调整（如 `uselightgbm` 参数微调、Smart 组 url-test interval 变化）**不需要**同步——这些 Passwall 架构无法表达，见 CLAUDE.md §1.4「允许的不同步例外」。
