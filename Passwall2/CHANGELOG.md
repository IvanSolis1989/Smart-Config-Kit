# Passwall / Passwall2 — 变更日志

> `Passwall2/` 目录的变更日志（目录名保留历史命名，实际产物同时适用 Passwall 全功能版 + Passwall2 精简分流版——两者共用 `shunt_rules.lua` 解析器，同一份 `.list` 互通）。
> 本目录提供把 Clash Party 两层结构（业务组 → 区域组）**手工展平**为 28 条 shunt rule 的降级参考。
> 主版本号跟随 Clash Party 主线；尾段 `-pw2.N` 独立递增。

---

## v5.2.6-pw2.2 (2026-04-23) — ★ 致命 bug 修复 + 定位纠正

本次 PR 源自用户指出的两个错误，经深度调研 Passwall / Passwall2 官方仓库（`Openwrt-Passwall` org）+ `shunt_rules.lua` 源码后修复。

### FIX#P2-01（致命）：分流规则语法完全错误

- **问题**：初版使用 `domain-suffix:xxx` 前缀（**Clash/Shadowrocket 语法**），Passwall / Passwall2 的 `shunt_rules.lua` 解析器**不识别**这个前缀 → 粘进 LuCI 后整串 `domain-suffix:v0.dev` 被当成**纯字符串子串匹配的字面量** → **100% 不命中**任何实际域名。
- **修复**：全局 `domain-suffix:` → `domain:`（子域名匹配，等价 Clash `DOMAIN-SUFFIX` 语义）：
  - 28 个 `shunt-rules/*.list`：~94 行
  - `README.md`：96 处
  - `passwall2-smart-shunt.conf`：94 处
  - `apply-shunt-rules.sh`：94 处
  - **合计 ~378 处**
- **README 新增完整语法表**（8 种前缀），并加 ⚠️ 警告"不要用 Clash 的 `DOMAIN-SUFFIX,` / `DOMAIN-KEYWORD,` / `DOMAIN,` / `IP-CIDR,` 前缀"。
- **权威源**：https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua

### FIX#P2-02：定位关系说反

- **问题**：初版 README 称 Passwall 为"旧版"、Passwall2 为"新版/降级版"，暗示线性继承。错。
- **官方事实**（均为 2025-2026 年持续发版）：Passwall 与 Passwall2 是作者 `xiaorouji`（现 `Openwrt-Passwall` org）**并行维护**的两款独立插件。Passwall 最新 `26.4.15-1`（2026-04-15）、Passwall2 最新 `26.4.20-1`（2026-04-19），相差 4 天。社区解读（[Discussion #555](https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555)）：**Passwall2 像是 Xray/Sing-box 的 UI，抛弃了直连/屏蔽/GFW 列表，只保留 keyword/domain/geosite/geoip 分流**。
- **修复**：
  - README 头部目标行重写为"Passwall（全功能）+ Passwall2（精简分流），并行维护，规则语法同源"
  - 踩坑段"Passwall 旧版语法稍不同"重写为"混淆 Passwall / Passwall2"
  - 末尾"降级版"措辞去掉，改为说明两者的架构差异（都无嵌套组、都无 mihomo）
  - 参考段链接更新为 `Openwrt-Passwall` org、加 `shunt_rules.lua` 源码链接、加 Discussion #555 解读

### 附带修正

- 注释"iceeeder / xiaorouter 等社区分支"措辞去掉（`xiaorouji` 本人已迁 `Openwrt-Passwall` org 维护，官方即主流）
- `apply-shunt-rules.sh` 加注释：Passwall 用户把 `CONFIG_NAME` 改为 `passwall` 即可复用
- 头部版本号：`v5.2.5-pw2.1` → `v5.2.6-pw2.2`（对齐 Clash Party 主线 v5.2.6）

### 对其他产物的联动评估（按 CLAUDE.md §1.5 同构审计）

本次修复只动 Passwall/Passwall2 的 shunt rule 语法，**与 §1.5 5 个运行时逻辑点都不相关**（Passwall 系本来就是静态 shunt rule，无节点名分类 / fallback 链 / 订阅合并 / proxy-providers filter / 节点过滤）。其他 9 份产物（Clash Party / CMFA / OpenClash / Shadowrocket / Surge / Loon / QX / SingBox / v2rayN）不受影响。

### 根 README + CLAUDE.md 同步

- `CLAUDE.md` §0 「关于 Passwall / Passwall2」段重写：删除"Passwall2 是精简版"暗示，改为"两者并行维护，规则语法同源"。
- 根 `README.md` L386 / L389 Passwall 系描述同步。

---

## v5.2.5-pw2.1 (2026-04-20) — 初版

- ★ 初版：从 Clash Party v5.2.5 基线手工展平为 Passwall2 shunt rule 格式
- ★ **三种格式交付**（按用户需求选一种）：
  - `shunt-rules/01-ai-service.list` ~ `28-ads.list`（28 个独立文件，每个含域名列表 + IP 列表注释；方便 LuCI UI 单条复制粘贴）
  - `passwall2-smart-shunt.conf`（单文件合并版，28 条规则全貌参考）
  - `apply-shunt-rules.sh`（UCI 批量脚本；`scp` 到路由器 + `sh apply-shunt-rules.sh` 一次性创建 28 条空节点规则，再到 LuCI 逐条指定目标节点）
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
