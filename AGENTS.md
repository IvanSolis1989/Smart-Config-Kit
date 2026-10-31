<picture>
  <source media="(max-width: 600px)" srcset="docs/assets/readme/page-contract-mobile.svg">
  <img src="docs/assets/readme/page-contract.svg" alt="Smart-Config-Kit 维护契约" width="100%">
</picture>

# AGENTS.md — 仓库维护与多代理协作契约

> 目录简介：这里是 Smart-Config-Kit 的唯一维护手册，定义仓库定位、产物同步规则、平台陷阱、自检命令和多代理协作约定。

## 仓库维护契约（AI 必读）

> 本文件是 Smart-Config-Kit 仓库的**唯一强约束维护契约**，所有自动化代理（Codex、Copilot、Gemini、Cursor 及其他工具）在修改本仓库前**必须完整阅读并遵守**。
> 违反以下任何一条，PR 必须退回重做。
> `CLAUDE.md` 已废止；禁止恢复双文件维护或在其他代理专属文件中复制本契约，以免规则漂移。

---

## Quick Start / 常用命令

> ⚠️ **开发前必读**：完整阅读本 `AGENTS.md` 后再动手修改任何产物。

### 开发环境要求

- **Node.js**: ≥ 18（推荐 22，与 CI 一致）
- **Ruby**: ≥ 3.0（可选，用于 OpenClash YAML 严格解析）
- **Git**: 最新版

### 验证命令（提交前必跑）

```bash
# 验证 JS 覆写脚本（节点分类 / 组顺序 / 规则引用等）
node tools/validate-js-overwrites.js
node tools/validate-js-overwrites.js --target smart    # 仅验证 Smart 版
node tools/validate-js-overwrites.js --target normal   # 仅验证 Normal 版
node tools/validate-js-overwrites.js --target flclash  # 仅验证 FlClash 版

# 验证跨客户端产物一致性（组计数 / JSON 合法性 / YAML 重复键 / Passwall fused URL）
node tools/validate-artifact-contracts.js
node tools/validate-artifact-contracts.js --strict-ruby  # 含 Ruby YAML 解析

# 验证 PROCESS-NAME 直连白名单
node tools/validate-process-name-direct.js

node tools/generate-karing.js --check    # Karing 适配源/生成物合同

# §5 自检脚本（完整版见下方 §5 节）
```

### 产物重新生成

```bash
# 同步/转换 Mihomo .mrs 规则集（支持 .mrs 的 Mihomo 产物必须先走这两步）
node tools/sync-mihomo-mrs-rule-providers.js
node tools/apply-mihomo-mrs-overrides.js

# 编译最终 fused 规则集，并联动生成 v2rayN / Passwall / Passwall2 fallback
node tools/build-fused-rule-sets.js
node tools/generate-fused-fallback-artifacts.js

# 重新生成 SingBox Full JSON（禁止手工改）
node "Sing-box内核系/SingBox/SingBox(sing-box)-generator.js"

# 重新生成 Stash YAML（禁止手工改 独立内核系/Stash/Stash.yaml）
node tools/generate-stash-from-cmfa.js

# 重新生成 Egern YAML（禁止手工改 独立内核系/Egern/Egern.yaml）
node tools/generate-egern-supplemental.js
node tools/generate-egern-from-cmfa.js
```

---

## 0. 仓库定位

本仓库维护「**同一套 Mihomo Smart 分流策略**」在 14 个既有客户端配置产物中的等价实现，并新增 Karing 原生分流适配入口（语义与完整 SingBox JSON 导入边界单独说明）：

| # | 形态 | 文件 | 角色 |
|---|------|------|------|
| 0 | **源规则图** | `rulesets/source/routing-graph.js` | **规则权威源 / 编译器输入** |
| 0A | **Clash Party**（JS 覆写脚本） | `Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js` | 客户端产物（Smart 内核，消费融合规则集） |
| 1 | Clash Meta For Android（原生 YAML） | `Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml` | 从属 |
| 2 | OpenClash 轻量版（shell + heredoc YAML） | `Mihomo内核系/OpenClash/OpenClash(mihomo).sh` | 从属（低内存裁剪） |
| 3 | OpenClash 完整版（shell + heredoc YAML） | `Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh` | 从属（全量） |
| 4 | Shadowrocket（iOS SR 私有 conf） | `独立内核系/Shadowrocket/Shadowrocket.conf` | 从属 |
| 5 | SingBox Full（JSON，由脚本生成） | `Sing-box内核系/SingBox/SingBox(sing-box)-full.json` + `Sing-box内核系/SingBox/SingBox(sing-box)-generator.js` | 从属（生成产物） |
| 6 | v2rayN Xray 路由 JSON | `Xray内核系/v2rayN/v2rayN(xray).json` | 从属（由 fused sing-box JSON 展平成 Xray RuleObject；v2rayN 推荐用 mihomo/sing-box 核心直接加载 #1 或 #5） |
| 7 | Surge（iOS / macOS 付费正版 `.conf`） | `独立内核系/Surge/Surge.conf` | 从属（独立引擎） |
| 8 | Loon（iOS 付费正版 `.conf`） | `独立内核系/Loon/Loon.conf` | 从属（独立引擎） |
| 9 | Quantumult X（iOS 付费正版 `.conf`） | `独立内核系/Quantumult X/QuantumultX.conf` | 从属（独立引擎） |
| 10 | Passwall（OpenWrt 全功能 LuCI） | `双内核系/Passwall/Passwall(xray+sing-box)-apply.sh` + `双内核系/Passwall/shunt-rules/*.list` | 从属（fused `.srs` shunt rule 降级） |
| 10B | Passwall2（OpenWrt 精简分流 LuCI） | `双内核系/Passwall2/Passwall2(xray+sing-box)-apply.sh` + `双内核系/Passwall2/shunt-rules/*.list` | 从属（fused `.srs` shunt rule 降级；与 #10 共享规则语法） |
| 11 | FlClash（JS 覆写脚本） | `Mihomo内核系/FlClash/FlClash(mihomo).js` | 从属（Clash Party Normal JS 的 FlClash 移植版；url-test 区域组，无 Smart+LightGBM） |
| 12 | Stash（Clash Premium 兼容 YAML） | `独立内核系/Stash/Stash.yaml` + `tools/generate-stash-from-cmfa.js` | 从属（由 CMFA 自动裁剪生成；无 Smart+LightGBM） |
| 13 | Egern（iOS / macOS YAML） | `独立内核系/Egern/Egern.yaml` + `tools/generate-egern-from-cmfa.js` | 从属（由 CMFA 生成；`.mrs` 映射为 Egern 兼容 YAML / 文本规则源） |
| 14 | Karing（sing-box 分流适配 JSON） | `Sing-box内核系/Karing/diversion_rules_custom.json` + `tools/generate-karing.js` | 原生分流规则入口；节点组、DNS 与最终默认动作由 Karing App 设置，不代表完整 SingBox JSON 无损导入 |

**基线原则：** `rulesets/source/routing-graph.js` 是唯一的「**规则权威源**」。Clash Party / CMFA / Stash / Egern / SingBox / v2rayN / Passwall 等都是派生或消费产物；仅在平台能力受限处允许差异（见 §3）。

> **关于 v2rayN：** v2rayN 是多核调度器，不是独立内核。推荐使用路径是在 v2rayN 里切到 mihomo 或 sing-box 核心，然后加载 #1 / #5；这种情况下 v2rayN 本身不是独立产物，无需单独同步。仅当 v2rayN 用户坚持走 Xray 核心时才用到 `Xray内核系/v2rayN/v2rayN(xray).json`（由 `tools/generate-fused-fallback-artifacts.js` 从 fused sing-box JSON 展平成 Xray RuleObject，只有 proxy/direct/block 三出站），此文件是独立产物，受本文约束。
>
> **关于 Hiddify：** Hiddify 内核即 sing-box（修改版 `hiddify-sing-box`），直接消费 `Sing-box内核系/SingBox/SingBox(sing-box)-full.json`，**不需要**独立产物；`Sing-box内核系/SingBox/README.md §2a` 提供 Hiddify 专用导入说明。
>
> **关于 ClashMi（`KaringX/clashmi`，KaringX 跨平台 Flutter GUI，覆盖 iOS/macOS/Android/Windows/Linux）：** bundle 的是 **MetaCubeX mihomo mainline**（**非** `vernesong/mihomo` Smart fork），与 CMFA 内核同源，直接消费 `Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml`，**不需要**独立产物；`Mihomo内核系/Clash Meta For Android/README.md §九` 提供 ClashMi 专用导入说明。注意 ClashMi 的内核定制会把 `GEOIP,*` / `GEOSITE,*` 规则**强制转换**为对应 rule-set、iOS 端不支持 IP-ASN 数据库、`tun:` 由 App UI 托管不在 YAML 手写（官方 [FAQ](https://clashmi.app/guide/faq)）——这三点对本仓库 YAML **零影响**（0 条 GEOIP、0 条 GEOSITE、0 条 ASN、无 `tun:` 块）。与 Hiddify 对称：Hiddify 是 sing-box 的跨平台 GUI / ClashMi 是 mihomo 的跨平台 GUI。
>
> **关于 ShellClash（`juewuy/ShellCrash`）：** 内核是 mihomo，直接复用 `Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml` 或 `Mihomo内核系/OpenClash/OpenClash(mihomo).sh` 里的 heredoc YAML 块，**不需要**独立产物。
>
> **关于 HomeProxy（OpenWrt 官方 sing-box LuCI 插件）：** 内核就是 sing-box，直接导入 `Sing-box内核系/SingBox/SingBox(sing-box)-full.json`，**不需要**独立产物；`Sing-box内核系/SingBox/README.md §2b` 提供 HomeProxy 专用导入说明。
>
> **关于 FlClash（`chen08209/FlClash`，跨平台 Flutter GUI，覆盖 Android/Windows/macOS/Linux）：** 内核是标准 Mihomo（**非** Smart fork），自 v0.8.85 起支持 JS 覆写脚本。本仓库提供两条路径：（1）**覆写脚本** `Mihomo内核系/FlClash/FlClash(mihomo).js`（推荐；动态节点分类 + 订阅垃圾清理 + 家宽识别）；（2）**静态 YAML** `Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml`（备选；直接导入无需脚本）。两者规则等价，仅区域组类型不同（url-test）。FlClash 覆写脚本与 Clash Party Normal JS 同构（同 REGION_DB + 同 rule-providers + 同 rules），差异仅在于 overwriteGeneral 裁剪（TUN/端口由 FlClash App UI 托管）和 console.log 条件包装（兼容 QuickJS）。
>
> **关于 Stash：** Stash 兼容 Clash Premium 配置，但不等于 Mihomo Smart，也不支持本仓库的 LightGBM Smart 择路。`独立内核系/Stash/Stash.yaml` 是从 CMFA 自动裁剪生成的独立 YAML 产物，必须通过 `node tools/generate-stash-from-cmfa.js` 重新生成，禁止手工改生成结果。裁剪规则见 `独立内核系/Stash/REFERENCE-Stash-wiki.md`：保留 `proxy-groups` / `rule-providers` / `rules` / `nameserver-policy`，删除 Stash Wiki 未确认的 Mihomo GeoX、sniffer、provider health-check / exclude-filter、rule-provider 下载 `proxy` 等字段。
>
> **关于 Egern：** Egern 是正式同步产物，`独立内核系/Egern/Egern.yaml` 必须通过 `node tools/generate-egern-from-cmfa.js` 从 CMFA 生成，禁止手工改生成结果。Mihomo `.mrs` 继续保留给 Clash Party / CMFA 使用；Egern 官方文档没有声明可消费 `.mrs`，生成器会映射为 Egern 可消费的 YAML / 文本 `rule_set` URL。Egern 官方规则类型不含 Clash 风格 `PROCESS-NAME`，因此两条桌面进程补充规则是明确的平台例外。
>
> **关于 Passwall / Passwall2：** 这两款是 [`Openwrt-Passwall`](https://github.com/Openwrt-Passwall) 组织（原 `xiaorouji` 个人仓库已于 2025 年前后迁入该组织，访问旧 URL 会 301 跳转）**并行维护**的两款独立 OpenWrt 插件（**不是**新旧关系；2026-04 两者发版仅差 4 天）。**Passwall** = 全功能（直连/屏蔽/GFW/代理 4 列表 + 分流 + ACL + `trojan-plus` 节点 + TCP/UDP 节点分选）；**Passwall2** = 精简分流（砍掉四列表 + ACL，只保留 keyword/domain/geosite/geoip 匹配 + 统一节点选择）。两者底层都是 **xray-core + sing-box 双栈**（都**不打包** mihomo），都**没有** mihomo 的 proxy-groups 嵌套选择器（两级 `select`/`url-test` + Smart + LightGBM）——Lua CBI 表单式 UI 没有 YAML 嵌套组语义。**规则语法两者完全相同**（共用 [`shunt_rules.lua`](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua)：纯字符串 / `domain:` / `full:` / `regexp:` / `geosite:` / `rule-set:remote|local:` / `geoip:` + CIDR；**不支持** Clash 的 `DOMAIN-SUFFIX,` / `DOMAIN-KEYWORD,` / `IP-CIDR,` 前缀）。本仓库不再维护手写域名/IP 展平列表，而是用 `tools/generate-fused-fallback-artifacts.js` 生成 64 条非空 fused `.srs` shunt rule。**本仓库提供两个独立目录**：
>
> - **`双内核系/Passwall/`** — Passwall 全功能版参考（`CONFIG_NAME="passwall"`；含四列表/ACL/TCP-UDP 分选说明）
> - **`双内核系/Passwall2/`** — Passwall2 精简版参考（`CONFIG_NAME="passwall2"`）
>
> 两者 `.list` 文件内容互通、规则语法同源。想要 mihomo 完整体验（嵌套组 + Smart + LightGBM）请迁移到 **OpenClash**（本仓库 `Mihomo内核系/OpenClash/`）。
>
> **关于 SSR Plus+：** 架构老旧 + 已停止维护，没有 geosite/rule_set 层能力。**不提供产物**，建议直接换 OpenClash。
>
> **关于 Surge / Loon / Quantumult X：** 这三款 iOS/macOS 付费客户端各自使用私有 `.conf` 语法，与 Shadowrocket 部分兼容但不完全一致，因此每个都是独立产物。其中：
> - Surge 与 Shadowrocket 语法最接近（~90% 兼容），从 Shadowrocket 迁移改动最小
> - Loon 兼容 Surge 的 `[Rule] RULE-SET` 语法，但 [General] DNS 字段和 MMDB 配置方式不同
> - Quantumult X 使用完全独立的 `[policy]` / `[filter_remote]` / `[filter_local]` 结构；当前作为独立产物手工维护，仓库无 `tools/srk_to_qx.py`，恢复自动转换前必须先提交并验证脚本

### 0A. 内核系列目录与 Karing 适配

14 个既有客户端目录按五类内核系列归档；各 APP 原有子目录和文件名保留。新增 Karing 是第 15 个语义产品入口，提供 sing-box 分流适配 JSON，仅导入分流规则；节点组、DNS 与最终默认动作由 Karing App 手工设置。它不是 JS 覆写脚本，也不承诺完整 sing-box JSON 无损导入。`SubStore/`、`rulesets/`、`tools/`、`docs/` 仍是仓库级共享目录，不归入客户端内核系列。

- 生成 Karing 适配：`node tools/generate-karing.js`
- 只读检查 Karing 适配合同：`node tools/generate-karing.js --check`

### 0B. AEROVE Lite 单资源预算投影

Meow 专属投影使用 `node tools/generate-aerove-rule-assets.js` → `node tools/generate-meow.js`；两条命令的 `--check` 为只读检查。AEROVE 大规则集分片位于客户端 `rule-assets/`，必须保持与共享 MRS 的精确谓词并集和原位同目标引用，保留 App 安全预算；不得为了 Lite 改共享 fused 资产。生成工具需 Node.js ≥ 22.15、Ruby ≥ 3.0 与固定 Mihomo v1.19.32；最终 App 验收不能由这些工具代替。

### 0.1 辅助目录（不影响产物同步）

| 目录 | 用途 | 是否影响产物 |
| --- | --- | --- |
| `SubStore/` | Sub-Store 脚本模板和使用说明（独立于主产物） | ❌ 不影响 |
| `docs/` | 捐款二维码、GEOSITE 覆盖台账、PROCESS-NAME 兼容性文档 | ❌ 不影响 |
| `mirrors/` | 规则镜像文件（CiciAi.list、Grok.yaml、UK.list，供 rule-provider 备用源） | ❌ 不影响 |
| `tools/` | 验证脚本（validate-js-overwrites.js、validate-artifact-contracts.js、validate-process-name-direct.js） | ❌ 不影响 |
| `.github/workflows/` | CI 验证（JS 覆写 + 跨客户端一致性）+ AI Issue 自动回复 | ❌ 不影响 |

这些目录的修改**不需要**触发 §1 全版本联动，但 `tools/` 和 `.github/workflows/` 的改动应在 PR 描述中说明。

### 0.2 规则生成链路架构（v6.0.0 起强制）

本仓库现在是单向编译链路，**`rulesets/source/routing-graph.js` 永远是规则事实基线**；Clash Party / CMFA / Stash / Egern / SingBox 等只能作为派生产物或生成器输入，不得反向成为权威源。

1. **Mihomo `.mrs` 归一化链路**：面向 Clash Party Smart/Normal、CMFA、OpenClash Normal/Smart、FlClash、Stash。
   - 权威输入：`rulesets/source/routing-graph.js` 的 raw provider graph，读取未融合、未改写前的上游 provider 语义。
   - 同步脚本：`node tools/sync-mihomo-mrs-rule-providers.js`。
   - 输出目录：`rulesets/generated/mihomo-mrs/` + `manifest.json`。
   - 应用脚本：`node tools/apply-mihomo-mrs-overrides.js`。
   - 规则：`domain` / `ipcidr` 才能转 `.mrs`；混合 classical 必须拆成 `-domain` / `-ipcidr`；若同一 provider 只有部分条目可转，必须生成可转 `.mrs` 并把剩余不支持条目写入 `-classical.yaml` 残余规则集；完全无法转换时才进入 manifest 的 `retained`，且必须写明原因。
   - MRS 映射层只允许存在于 `rulesets/source/routing-graph.js`；Clash Party / FlClash / CMFA / OpenClash / Stash 等客户端产物必须直接消费最终融合 `.mrs` / 残余 YAML 地址，不再携带上游 provider 映射表。
2. **融合规则集编译链路**：面向所有支持远程规则集或原生规则集的产物。
   - 权威输入：`rulesets/source/routing-graph.js` 的 Mihomo-normalized graph，因此读取的是已经过 `.mrs` 归一化但尚未融合的规则顺序。
   - 编译脚本：`node tools/build-fused-rule-sets.js`。
   - 输出目录：`rulesets/generated/fused/`；当前验收统计为源 `514 providers / 973 rules` → `72` 个策略顺序段（其中 `69` 个非空原生资产）→ `132` 个 Mihomo 融合 provider / `151` 条主规则 / `19` 条必要内联规则，移动端 `69` 个文本规则集，sing-box / Passwall `69` 个 SRS，`unresolved=0`。
   - 支持 `.mrs` 的 Mihomo 产物优先引用 `*-domain.mrs`、`*-ipcidr.mrs`、`*-ipcidr-no-resolve.mrs`；确实不能转 `.mrs` 的端口、进程、逻辑组合、GEOIP 等写入 `*-residual.yaml`。
   - 不支持 `.mrs` 的产物使用各自性能最好的原生格式：Shadowrocket / Surge / Loon / Quantumult X 使用平台文本规则集，Egern 使用原生 YAML rule_set，SingBox 使用 `.srs`，v2rayN Xray 展平成 RuleObject，Passwall / Passwall2 使用 `rule-set:remote` 引用 fused `.srs`。
3. **派生产物生成链路**：
   - `node tools/generate-stash-from-cmfa.js` 只裁剪 CMFA 的融合结果生成 Stash，不改变基线。
   - `node tools/generate-egern-from-cmfa.js` 只把 CMFA 的融合顺序映射为 Egern 原生 YAML，不直接消费 Mihomo `.mrs`。
   - `node Sing-box内核系/SingBox/SingBox(sing-box)-generator.js` 只把融合 rule-provider 映射到本仓库 `.srs`。
   - `node tools/generate-fused-fallback-artifacts.js` 只把 fused manifest 映射为 v2rayN Xray RuleObject 与 Passwall / Passwall2 `.srs` shunt rule。
   - Egern 官方规则类型不含 Clash 风格 `PROCESS-NAME`，相关补充规则是明确的平台例外。

**强制顺序**：改 rule-provider / 规则集后，先更新 `rulesets/source/routing-graph.js`，再运行 `.mrs` 同步与应用，然后运行融合规则集编译器，再生成 Stash、Egern、SingBox、Karing 与 fallback 产物，最后跑 §5 自检。禁止反向从 Clash Party / CMFA / Stash / Egern / SingBox / v2rayN / Passwall 手工改回源规则图。

---

## 1. 每次修改「规则 / 策略组 / DNS」都必须全版本联动 ⚠️

> 这是本仓库最**核心且不可违反**的规则。

### 1.1 触发条件（任一满足即必须全版本联动）

- 新增/删除/重命名**任何代理组**（含 22 个区域组〔11 全部 + 11 家宽〕与 33 个业务组）
- 新增/删除/修改**任何 rule-provider**（含 URL、behavior、format、interval、proxy 字段）
- 新增/删除/修改 `rulesets/generated/mihomo-mrs/manifest.json`、`rulesets/generated/mihomo-mrs/*.mrs`、`rulesets/generated/fused/**`、`rulesets/generated/egern/*.yaml` 的生成规则
- 修改**规则条目的目标组**（例如把 `RULE-SET,tiktok` 从 `📱 社交媒体` 改到其他组）
- 修改**规则顺序**中影响命中优先级的段（特别是广告拦截、GFW、FINAL 前置关系）
- 修改 **DNS / Sniffer / fake-ip / GeoX URL / LightGBM URL** 等全局行为
- 修改 **规则源仓库**（MetaCubeX / blackmatrix7 / Loyalsoldier / szkane / Accademia 等)
- **修复「节点名分类 / 订阅合并 / 区域组 fallback」等运行时逻辑 bug**（自 v5.2.6 起强制加入触发条件 —— 参见 §1.5 同构 bug 审计）

### 1.2 强制动作清单（Per-PR Checklist）

若本次改动命中上述任一触发条件，PR 必须：

1. **先改源规则图**（`rulesets/source/routing-graph.js`），作为唯一规则权威源。
2. **同步修改全部 14 个既有目录产物**；涉及 Karing 适配语义时一并运行 `node tools/generate-karing.js` 并检查生成结果（或在 PR 说明里标注不受影响的产物）：
   - `Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml`
   - `独立内核系/Stash/Stash.yaml`（通过 `node tools/generate-stash-from-cmfa.js` 从 CMFA 重新生成，不允许手工改）
   - `Mihomo内核系/OpenClash/OpenClash(mihomo).sh`
   - `Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh`
   - `独立内核系/Shadowrocket/Shadowrocket.conf`
   - `Sing-box内核系/SingBox/SingBox(sing-box)-full.json`（通过 `node Sing-box内核系/SingBox/SingBox(sing-box)-generator.js` 重新生成，不允许手工改）
   - `Xray内核系/v2rayN/v2rayN(xray).json`（通过 `node tools/generate-fused-fallback-artifacts.js` 从 fused sing-box JSON 展平成 Xray RuleObject；Xray 只有 proxy/direct/block 三出站）
   - `独立内核系/Surge/Surge.conf`（与 Shadowrocket 保持 ~1:1 规则行；仅 [General] DNS/MMDB 不同）
   - `独立内核系/Loon/Loon.conf`（从 Surge 迁移；头部 + [General] 不同，[Rule] 段基本同 Surge）
   - `独立内核系/Quantumult X/QuantumultX.conf`（独立 QX 产物；policy / filter_remote / filter_local 三段结构；当前手工维护并由合同验证覆盖）
   - `独立内核系/Egern/Egern.yaml`（通过 `node tools/generate-egern-from-cmfa.js` 从 CMFA 重新生成，不允许手工改）
   - `双内核系/Passwall/Passwall(xray+sing-box)-apply.sh` + `双内核系/Passwall/shunt-rules/*.list`（通过 `node tools/generate-fused-fallback-artifacts.js` 生成 fused `.srs` shunt rule）
   - `双内核系/Passwall2/Passwall2(xray+sing-box)-apply.sh` + `双内核系/Passwall2/shunt-rules/*.list`（同上；与 Passwall 同步联动）
   - `Mihomo内核系/FlClash/FlClash(mihomo).js`（Clash Party Normal JS 的 FlClash 移植版；规则/组/DNS 与主线对齐，overwriteGeneral 裁剪 TUN/端口）
3. **涉及上游 rule-provider 时必须执行生成链路**：
   - `node tools/sync-mihomo-mrs-rule-providers.js`
   - `node tools/apply-mihomo-mrs-overrides.js`
   - `node tools/build-fused-rule-sets.js`
   - `node tools/generate-stash-from-cmfa.js`
   - `node tools/generate-egern-supplemental.js`
   - `node tools/generate-egern-from-cmfa.js`
   - `node "Sing-box内核系/SingBox/SingBox(sing-box)-generator.js"`
   - `node tools/generate-fused-fallback-artifacts.js`
4. **同步更新每个产物头部的「介绍 / 更新日志 / 版本号」注释块**（见 §1.3 强制注释字段）。
5. **同步更新文档**：根 `README.md` + 对应子目录的 `README.md`（原 `使用方法.md` / `使用教程.md` 已统一重命名为 `README.md`，GitHub 子目录视图会自动渲染），必要时 `CHANGELOG`。
6. **自检命令必须通过**（§2）。
7. **提交前在 PR 描述里列出「影响面」**：
   - 改动的代理组 / rule-provider / 规则行数
   - `.mrs` manifest 统计（converted / split / partial / existing_mrs / retained / failed）
   - 每个产物的同步位置（行号或 commit diff 摘要）
   - 手动跳过同步的产物及原因

### 1.3 强制的「版本号 + 子目录 CHANGELOG」规范 ⚠️

**设计原则（自 v5.2.4 起）：**
- 产物文件**头部**只保留轻量元信息——名称 / 版本号 / Build 日期 / 架构一句话 / 基线声明 / **指向 CHANGELOG.md**。
- 详细变更历史**全部**集中在 `<子目录>/CHANGELOG.md` 里；不再埋在配置文件头部。
- 这样做的好处：
  1. 用户打开 GitHub 子目录时，README.md 自动渲染在下方（使用说明）；CHANGELOG.md 独立成文（历史），配置文件不被大段注释淹没。
  2. 工具改动时不用同时 diff 配置文件头 + 任何其它文件，只需在 CHANGELOG.md 顶部追加一节。

**每次改动必须同步的两处：**

1. **产物文件头**（简短）：bump 版本号尾段、更新 Build 日期
2. **`<子目录>/CHANGELOG.md`** 顶部：新增一节记录本次改动

**产物文件头的最小内容（按顺序）：**

1. 产物名称 + 版本号（与源规则图主版本对齐，加平台后缀）
2. Build 日期（YYYY-MM-DD）
3. 架构一句话（例如「22 区域〔11 全部 + 11 家宽〕 + 33 业务（含 14 流媒体平台组）+ 376+ RULE-SET」）
4. 规则源声明（「规则源：`rulesets/source/routing-graph.js` vX.Y.Z」；客户端可另注明对齐的 Clash Party / CMFA 产物版本）
5. 指向 CHANGELOG：「变更历史：见 `<子目录>/CHANGELOG.md`」
6. 若有风险或代价，一行标注（OOM / 首次延迟 / iOS 限制）

**对应到各产物文件：**

| 文件 | 头部位置 | 版本变量/字段 | CHANGELOG.md |
|------|----------|---------------|--------------|
| `Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js` | 顶部 `//` 注释 | JS 内 `const VERSION` | `Mihomo内核系/Clash Party/CHANGELOG.md` |
| `Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml` | 顶部 `#` 注释块 | 第一行 `# Clash Smart vX.Y.Z - CMFA` | `Mihomo内核系/Clash Meta For Android/CHANGELOG.md` |
| `独立内核系/Stash/Stash.yaml` | 顶部 `#` 注释块 | 第一行 `# Stash Smart vX.Y.Z-stash.N`（由生成器注入） | `独立内核系/Stash/CHANGELOG.md` |
| `Mihomo内核系/OpenClash/OpenClash(mihomo).sh` | `#!/bin/bash` 下方 `# ==` 块 | `VERSION_TAG="vX.Y.Z-oc-normal"` | `Mihomo内核系/OpenClash/CHANGELOG.md` (Normal 段) |
| `Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh` | `#!/bin/bash` 下方 `# ==` 块 | `VERSION_TAG="vX.Y.Z-oc-smart"` + Ruby 脚本里 `VERSION` | `Mihomo内核系/OpenClash/CHANGELOG.md` (Smart 段) |
| `独立内核系/Shadowrocket/Shadowrocket.conf` | 顶部 `# ══…` 双线框 | 第 2 行 `# Shadowrocket Smart vX.Y.Z-SR.N` | `独立内核系/Shadowrocket/CHANGELOG.md` |
| `Sing-box内核系/SingBox/SingBox(sing-box)-full.json` / `SingBox(sing-box)-1.13.json` | 严格内核 JSON 不写 `_meta`；元信息在生成器常量及 README | 生成器 `VERSION` / `BUILD` / `BASELINE` | `Sing-box内核系/SingBox/CHANGELOG.md` |
| `Xray内核系/v2rayN/v2rayN(xray).json` | 顶层禁用 meta 规则（`id:"scki-000-meta"` + `remarks` 版本信息）| meta `remarks` | `Xray内核系/v2rayN/CHANGELOG.md` |
| `独立内核系/Surge/Surge.conf` | 顶部 `# ══…` 双线框 | 第 2 行 `# Surge Smart vX.Y.Z-Surge.N` | `独立内核系/Surge/CHANGELOG.md` |
| `独立内核系/Loon/Loon.conf` | 顶部 `# ══…` 双线框 | 第 2 行 `# Loon Smart vX.Y.Z-Loon.N` | `独立内核系/Loon/CHANGELOG.md` |
| `独立内核系/Quantumult X/QuantumultX.conf` | 顶部 `# ══…` 双线框 | 第 2 行 `# Quantumult X Smart vX.Y.Z-QX.N` | `独立内核系/Quantumult X/CHANGELOG.md` |
| `双内核系/Passwall/Passwall(xray+sing-box)-apply.sh` | `#!/bin/sh` 下方 `# ══…` 块 | `VERSION_TAG="vX.Y.Z-pw.N"` | `双内核系/Passwall/CHANGELOG.md` |
| `双内核系/Passwall2/Passwall2(xray+sing-box)-apply.sh` | `#!/bin/sh` 下方 `# ══…` 块 | `VERSION_TAG="vX.Y.Z-pw2.N"` | `双内核系/Passwall2/CHANGELOG.md` |
| `Mihomo内核系/FlClash/FlClash(mihomo).js` | 顶部 `//` 注释块 | JS 内 `const VERSION` | `Mihomo内核系/FlClash/CHANGELOG.md` |

**CHANGELOG.md 的推荐格式：**

```markdown
# <工具名> — 变更日志

> <一行定位说明 + 跟随基线说明>

---

## vX.Y.Z-tag (YYYY-MM-DD)

- ★ FIX#NN-PN：<一行摘要>
  - <细节 1>
  - <细节 2>

## vX.Y.Z-前一版 (YYYY-MM-DD)

...
```

**触发更新的最小粒度：**

- 任何代码 / 规则改动 → bump 版本号尾段 + CHANGELOG 加一节（哪怕只有 1 行）
- Clash Party 主版本 bump → 所有产物主版本同步 bump，各自 CHANGELOG 都加节
- **禁止**：只改代码不动版本号和 CHANGELOG；只改 CHANGELOG 不动代码；把详细变更塞回配置文件头（会被退回重做）

**若发现配置文件头版本号与 CHANGELOG.md 不一致：** 当前 PR 必须顺手修正，不得留作 TODO。

**CHANGELOG 不得出现在 README 中 ⚠️：**

- `README.md`（根目录 + 各子目录）的定位是**项目介绍 / 使用指南 / 导入说明**。
- **严禁**在 README 中写版本变更历史（如「v5.4.X 修复了…」「近期 DNS 加固」等），这类内容只属于 `CHANGELOG.md`。
- 若在 README 中发现 changelog 内容，必须立即移到对应 `CHANGELOG.md` 并从 README 删除。
- **README 发布前视觉验收**：按 §10 执行；完成视觉检查后才可推送 GitHub。

**每次更新必须同步所有 CHANGELOG ⚠️：**

- 每次发版（任何版本号 bump）必须同时更新以下所有 CHANGELOG 文件：
  1. 根 `CHANGELOG.md`（仓库级摘要）
  2. `Mihomo内核系/Clash Party/CHANGELOG.md`（主线详细日志）
  3. 每个被改动的产物对应的 `<子目录>/CHANGELOG.md`
- 根 CHANGELOG.md 只记录仓库级摘要（一行说明 + 详见链接），不重复子目录 CHANGELOG 的全部细节。

---

### 1.4 允许的「不同步」例外

仅以下情况允许单一版本改动：

- **平台专属字段**（例如 CMFA 的 `find-process-mode: strict`，OpenClash 的 `CORE_TYPE`，SR 的 `skip-proxy`，sing-box 的 `inbounds.tun`）。
- **平台专属 bug 修复**（例如 CMFA 特定内存泄漏、SR iOS 进程限制）。
- **平台专属文档**（子目录 `README.md` 只改本目录对应的版本）。

但即便如此，PR 描述里必须写清楚「为什么其他版本无需同步」。

⚠️ **「平台专属 bug」不是逃避 §1.5 审计的挡箭牌。** 声明某个 bug 是平台专属前，**必须**先按 §1.5 走一遍同构审计——当且仅当其他产物不存在**同构的运行时逻辑点**时才适用本例外。v5.2.5 的
FIX#24~#26 曾被误判为 Clash Party JS 专属，实际 Clash Party Normal JS / CMFA YAML / OpenClash
Ruby 共 4 份产物都存在同构漏洞（见 v5.2.6 补丁），教训记在此处。

### 1.5 同构 bug 全产物审计（自 v5.2.6 起强制）⚠️

**触发条件**：只要本次修复命中以下任一运行时逻辑点，**必须对全部 14 份既有产物及 Karing 适配做同构审计（按运行时能力确认适用性）**：

1. **节点名 → 区域分类**：`REGION_DB` / `REGIONS` / `filter:` / `policy-regex-filter` / `server-tag-regex` / `NameRegex FilterKey`
2. **区域组 fallback 链**：区域为空时回落到 `apacNodes` / `c.ALL` / 全局组
3. **订阅原生 proxy-groups 合并 / 清理**：`cleanupSubscription` / Ruby `config["proxy-groups"] = ...`
4. **proxy-providers filter / `include-all-proxies` / `use` 筛选语义**
5. **节点过滤**：`isInfoNode` / `isBlockedSpeedTag` / `INFO_PATTERNS` / `exclude-filter`

**审计矩阵（快速参考）**：

| 产物 | 运行时分类器 / 过滤器位置 |
|------|--------------------------|
| Clash Party Smart JS | `REGION_DB` 常量 + `classifyAllNodes` + `cleanupSubscription` |
| Clash Party Normal JS | 同上（与 Smart 版几乎同构，差别仅 `type: smart` → `url-test`） |
| Clash Meta For Android YAML | 各 `proxy-groups[].filter:` mihomo 正则（子串匹配，无 word boundary） |
| Stash YAML | 由 CMFA 生成；各 `proxy-groups[].filter:` 继承 Clash/YAML 正则语义，必须重新生成并核对 |
| OpenClash normal / full | Ruby `REGIONS` 哈希（子串匹配） + `make_smart_group` fallback + `config["proxy-groups"] = ...` 重建 |
| Shadowrocket | `[Proxy Group] ... policy-regex-filter=...` 正则 |
| Surge | 同上 |
| Loon | `[Remote Filter] ..._Filter = NameRegex, FilterKey = "(?i)..."` |
| Quantumult X | `[policy] url-latency-benchmark=..., server-tag-regex=...` |
| SingBox Full | 静态 outbound 列表（无运行时分类，用户按 tag 接入节点） |
| v2rayN Xray routing | 路由规则（无节点分类） |
| Passwall / Passwall2 | 静态 shunt_rules（无运行时节点分类；按 UCI list 顺序匹配） |
| FlClash JS | 同 Clash Party Normal JS（`REGION_DB` + `classifyAllNodes` + `cleanupSubscription`；从 Clash Party Normal JS 直接移植） |

**审计流程（每条运行时逻辑 bug 必做）**：

1. 锁定 bug 所在的**运行时逻辑点类型**（对应上表行）。
2. 对其它产物逐个打开对应位置（上表列出），**用 grep / 目测 / 样例输入回归**一次：
   - 同一输入（本次 bug 的触发样例）能否在该产物中稳定分流？
   - 若分流路径不同（例如 mihomo 子串 vs JS word boundary vs SR 字面量罗列），**必须各自验证**，不能凭"应该是一样的"偷懒。
3. 任何一个产物命中同构漏洞，**本 PR 必须同步修复**，不得拆到后续 PR。
4. 若某产物结构上不存在该逻辑点（如 SingBox 用静态列表），在 PR 描述 + CHANGELOG 写清楚"不适用"及理由。
5. **产物间正则语义差异要点**（一定要记住）：
   - **JS**（Clash Party）使用 word-boundary regex `(^|[^a-zA-Z])<kw>([^a-zA-Z]|$)` → `TW` **不**命中 `TWN`
   - **mihomo `filter:`** 使用 Go RE2 子串匹配 → `TW` 命中 `TWN`，但 `KR` **不**命中 `KOR`
   - **Ruby OpenClash REGIONS** 使用 Ruby 正则子串匹配 → 同 mihomo，`KR` 不命中 `KOR`
   - **Shadowrocket `policy-regex-filter`** 使用罗列字面量，必须显式包含每个 alpha-3
   - **Loon `NameRegex FilterKey`** 同上
   - **QX `server-tag-regex`** 同上

**禁止事项**：

- ❌ 凭"运行时逻辑只在 JS 里有"就跳过其它产物的审计。许多产物（CMFA / OpenClash Ruby）也有等价运行时逻辑，只是语法不同。
- ❌ 用"静态配置文件不会有此 bug"作为不审计的理由——必须逐个开文件验证一遍。
- ❌ 把同构 bug 拆成多个 PR 分批合入（会导致用户在某段时间内部分端 OK / 部分端 broken）。

---

### 1.6 补充规则集优先（禁止无必要散写单条规则）⚠️

主分流规则必须保持清晰。除非存在 **100% 必要性**，不得在各产物主规则中继续新增零散单条规则。

默认处理规则：

1. `DOMAIN` / `DOMAIN-SUFFIX` / `DOMAIN-KEYWORD` / `IP-CIDR` / `PROCESS-NAME` 等零星补丁，优先加入 `rulesets/supplemental/` 下对应补充规则集。
2. 补充规则集会被 `tools/build-fused-rule-sets.js` 折叠进对应目标策略的融合规则集；各产物主规则只引用融合后的规则集，不再散写可折叠单条规则。
3. 同一补丁若目标策略不同，必须拆成多个规则集；不要把 DIRECT / 支付 / 国外网站等不同策略混进同一个 rule-set。
4. 只有端口规则、逻辑组合规则（`AND` / `OR` / `NOT`）、`MATCH` / `FINAL`、平台无法表达的字段，或已记录原因的平台专属例外，才允许继续保留为主规则内联。
5. 临时排障单条规则不得长期留在主规则；同一 PR 必须给出迁入补充规则集或删除的结论。

新增规则前的强制自问：**能否放进 `rulesets/supplemental/` 并由融合编译器折叠？** 只要答案不是明确不能，就不允许散写单条规则。

---



---

## 2. 每次修改都必须严格审查并学习对应 APP 的官方文档 ⚠️

> 口头说「已兼容」无效。必须**提供链接或官方字段名引用**作为兼容性证据。

### 2.1 强制审查的官方文档清单

| 产物 | 必读官方文档 |
|------|--------------|
| Clash Party JS | https://wiki.metacubex.one/ · https://wiki.metacubex.one/config/ · vernesong Smart 内核（当前 `lgbm-url`、`uselightgbm`；MetaCubeX Alpha 不等于 Smart） |
| CMFA YAML | https://wiki.metacubex.one/config/proxy-groups · https://wiki.metacubex.one/config/dns · CMFA README（GitHub `MetaCubeX/ClashMetaForAndroid`） |
| Stash YAML | https://stash.wiki/en/configuration/example-config · https://stash.wiki/en/proxy-protocols/proxy-groups · https://stash.wiki/en/rules/rule-set · https://stash.wiki/en/rules/rule-types · https://stash.wiki/en/configuration/override |
| OpenClash（Normal + Smart）| https://github.com/vernesong/OpenClash/wiki · OpenClash 覆写脚本官方模板 · UCI 配置键 |
| Shadowrocket | https://help.shadowrocket.net/ · `policy-regex-filter` / `RULE-SET` / `fallback-dns-server` 的官方文档或社区权威说明 |
| SingBox（Full）| https://sing-box.sagernet.org/configuration/ · 特别是 `route.rule_set`、`outbounds/selector`、`outbounds/urltest`、`dns`、`inbounds.tun`、`experimental.cache_file` |
| Passwall / Passwall2 | https://github.com/Openwrt-Passwall/openwrt-passwall · https://github.com/Openwrt-Passwall/openwrt-passwall2 · 特别要读 `luci-app-passwall*/luasrc/model/cbi/passwall*/client/shunt_rules.lua`（分流规则解析器源码） · [Discussion #555](https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555)（定位差异） |
| FlClash JS | https://github.com/chen08209/FlClash · https://deepwiki.com/chen08209/FlClash/6-build-and-deployment（覆写系统） · https://github.com/chen08209/FlClash/issues/1510（脚本 API 教程） |

### 2.2 必做的兼容性核对步骤

改动涉及新字段或跨版本字段时，**必须**：

1. **字段存在性核对**：在目标 APP 的官方文档里定位该字段，确认拼写、层级、取值范围。
2. **版本兼容性核对**：确认该字段在目标 APP 的**最低支持版本**，并与子目录 `README.md` 中声明的最低版本一致。
   - 例：sing-box 1.11+ 已用 `action` + `outbound` 替代旧 `outbound` 直接绑定；改动必须符合当前目标内核。
   - 例：mihomo Smart 内核的 `uselightgbm` 属于 Alpha 分支能力，不能下放到稳定分支的 Clash 核心。
3. **格式核对**：
   - Clash YAML：`rule-providers` 的 `behavior` ∈ {`domain`, `ipcidr`, `classical`}；`format` ∈ {`yaml`, `text`, `mrs`}。
   - Mihomo `.mrs`：仅用于支持 `rule-providers.format: mrs` 的 Mihomo 兼容产物；当前只承载 `domain` / `ipcidr`。上游无 `.mrs` 时，必须通过 `tools/sync-mihomo-mrs-rule-providers.js` 生成到 `rulesets/generated/mihomo-mrs/`，再用 `tools/apply-mihomo-mrs-overrides.js` 同步。混合 classical provider 拆分为 `-domain` / `-ipcidr`；部分可转 provider 必须拆出可转 `.mrs` 并保留 `-classical.yaml` 残余；只有全量不可转的 `GEOIP` / 端口 / 进程 / 逻辑组合等 provider 才保留原格式并说明原因。
   - Shadowrocket：`RULE-SET,<url>,<policy>` 不支持 `rule-provider` 节。策略名里的 emoji **必须与组定义完全一致**（含 ZWJ `\u200D`）。
   - sing-box：`rule_set` 的 `format` ∈ {`binary`, `source`}；`.srs` 必须配 `binary`。
4. **PR 描述里粘贴官方文档锚点**（URL + 字段名），审阅者可一键验证。

### 2.3 REFERENCE 参考文档时效检查 ⚠️

> 每次代码审查/修改前，**必须**检查对应 APP 官方文档是否有更新。

#### 2.3.1 本地 REFERENCE 文件清单

| 产物目录 | 本地参考文档 | 源 URL |
|----------|-------------|--------|
| `Mihomo内核系/Clash Party/` | `REFERENCE-mihomo-wiki.md` | https://wiki.metacubex.one/ |
| `Mihomo内核系/Clash Meta For Android/` | `REFERENCE-mihomo-wiki.md` | https://wiki.metacubex.one/ |
| `独立内核系/Stash/` | `REFERENCE-Stash-wiki.md` | https://stash.wiki/ |
| `Mihomo内核系/OpenClash/` | `REFERENCE-openclash.md` | https://github.com/vernesong/OpenClash/wiki |
| `独立内核系/Surge/` | `REFERENCE-surge-manual.md` | https://manual.nssurge.com/ |
| `独立内核系/Shadowrocket/` | `REFERENCE-shadowrocket.md` | https://help.shadowrocket.net/ |
| `独立内核系/Loon/` | `REFERENCE-loon-manual.md` | https://github.com/Loon0x00/LoonManual |
| `独立内核系/Quantumult X/` | `REFERENCE-quantumultx.md` | https://github.com/crossutility/Quantumult-X |
| `Sing-box内核系/SingBox/` | `REFERENCE-sing-box.md` | https://sing-box.sagernet.org/configuration/ |
| `Xray内核系/v2rayN/` | `REFERENCE-xray.md` | https://xtls.github.io/ |
| `双内核系/Passwall/` | `REFERENCE-passwall.md` | https://github.com/Openwrt-Passwall/openwrt-passwall |
| `双内核系/Passwall2/` | `REFERENCE-passwall2.md` | https://github.com/Openwrt-Passwall/openwrt-passwall2 |
| `Mihomo内核系/FlClash/` | `REFERENCE-flclash.md` | https://github.com/chen08209/FlClash |

#### 2.3.2 强制检查流程

**每次修改涉及的任何 APP，必须执行：**

1. **检查远程文档是否更新**：用 `WebFetch` 获取源 URL 的页面内容（或 GitHub 仓库的最新 release/commit 时间），与本地 `REFERENCE-*.md` 文件头部的「获取日期」对比。
2. **若远程有更新**（新版本发布 / 字段变更 / 语法废弃 / 新增能力）：
   - 重新 `WebFetch` 抓取最新文档内容
   - 更新对应 `REFERENCE-*.md`，在文件头部追加更新记录：
     ```markdown
     > 更新于 YYYY-MM-DD（上次获取 YYYY-MM-DD）：<简述变化>
     ```
   - 同步更新到该 APP 的 `CHANGELOG.md`
3. **若远程无更新**：在 PR 描述中注明「已检查 $APP 官方文档，截至 YYYY-MM-DD 无更新」。
4. **审核必须以最新文档为准**：发现本地 REFERENCE 过期而未更新的，必须先更新 REFERENCE 再审核，不得凭旧文档下结论。

#### 2.3.3 快速检查命令

```bash
# 检查所有 REFERENCE 文件的获取日期
for f in */REFERENCE-*.md; do
  echo "=== $f ==="
  head -6 "$f" | grep -E '(来源|获取日期|更新于|Source|Date)'
  echo ""
done
```

### 2.4 禁止事项

- ❌ 禁止凭记忆、训练数据或"经验"判定字段兼容性。
- ❌ 禁止把一份 APP 的语法（例如 Clash classical）直接复制到另一份（例如 sing-box）。
- ❌ 禁止使用已被官方标记 deprecated 的字段，除非有对应客户端版本兜底说明。
- ❌ 禁止在没有核对的情况下更改规则源（geosite.dat/geoip.dat）的 URL 或 release 分支。
- ❌ 禁止在 REFERENCE 文档过期的情况下执行审核——必须先更新再审核。

---

## 3. 跨平台一致性矩阵（强制对齐项）

### 3.1 代理组命名（22 区域〔11 全部 + 11 家宽〕 + 33 业务，共 55 组）

区域组名称（emoji 必须逐字节一致，包含 RGI 旗帜序列）：

```
🌍 全球节点 · 🏡 全球家宽 · 🇭🇰 香港节点 · 🏡 香港家宽 · 🇹🇼 台湾节点 · 🏡 台湾家宽
🇸🇬 狮城节点 · 🏡 狮城家宽 · 🇯🇵 日韩节点 · 🏡 日韩家宽 · 🌏 亚太节点 · 🏡 亚太家宽 · 🇺🇸 美国节点 · 🏡 美国家宽
🇪🇺 欧洲节点 · 🏡 欧洲家宽 · 🌎 美洲节点 · 🏡 美洲家宽 · 🌍 非洲节点 · 🏡 非洲家宽
🌏 其他节点 · 🏡 其他家宽
```

业务组名称（顺序即 README 展示顺序）：

```
🤖 AI 服务 · 💰 加密货币 · 🏦 金融支付 · 💬 即时通讯 · 📱 社交媒体
🧑‍💼 会议协作 · 📺 国内流媒体
🎵 TikTok
🎥 Netflix · 🎬 Disney+ · 📡 HBO/Max · 📺 Hulu · 🎬 Prime Video
📹 YouTube · 🎵 音乐流媒体
🇭🇰 香港流媒体 · 🇹🇼 台湾流媒体 · 🇯🇵 日韩流媒体 · 🇪🇺 欧洲流媒体
🌐 其他国外流媒体
🕹️ 国内游戏 · 🎮 国外游戏 · 🔍 Google 服务 · 🔧 工具与服务
Ⓜ️ 微软服务 · 🍎 苹果服务 · 📥 下载更新 · 🛰️ BT/PT Tracker
🏠 国内网站 · 🚫 受限网站 · 🌐 国外网站 · 🐟 漏网之鱼 · 🛑 广告拦截
```

**禁止**新增/删除/改名这 55 个组；若业务确有需要，必须先在 PR 描述里说明并先改源规则图。

### 3.2 Rule-provider 下载代理（`RP_PROXY`）

- 基线（Clash Party v5.2.2 起）：`RP_PROXY = BIZ.GFW = '🚫 受限网站'`
- Clash 家族（CMFA / OpenClash Normal / OpenClash Smart）必须全部使用 `proxy: '🚫 受限网站'`。
- Stash Wiki 未记录 rule-provider 下载代理字段；`独立内核系/Stash/Stash.yaml` 删除该字段并在 `独立内核系/Stash/REFERENCE-Stash-wiki.md` 说明风险，豁免。
- Shadowrocket 不走 rule-provider，自动由 App 更新，豁免。
- sing-box 通过 `route.rule_set` 远程拉取；1.14 产物引用命名 `http_clients`，1.13 兼容产物使用该版本合法的 `download_detour`，两者下载均经 `🌍 全球节点`，不复制 Mihomo `proxy` 字段。

> 历史债务：OpenClash Normal 之前用 `DIRECT`、CMFA 之前用 `☁️ 云与CDN`，已在本次对齐修复；任何未来改动**禁止回退**。

### 3.3 最终兜底（FINAL）

- Clash 家族：`MATCH,🐟 漏网之鱼`
- Shadowrocket：`FINAL,🐟 漏网之鱼,dns-failed`
- sing-box：`route.final: "🐟 漏网之鱼"`

### 3.4 广告拦截

所有版本的 `🛑 广告拦截` 组必须默认指向 `REJECT` / `block` / `action: reject`；第一条规则必须是广告拦截前置。

### 3.5 平台特有语法陷阱速查表（统一基线时务必单独保留）⚠️

> 「同一语义在不同产物里写法不同」的清单。每条都对应过一次真实的导入失败 / 用户报错。
> **禁止**在跨产物联动时机械复制粘贴；先查这张表，再写。新增条目时请保留历史出处（FIX 编号 / commit / Issue）。

#### 3.5.1 DNS / DoH 字段名

| 产物 | 普通 DNS（IP） | DoH（HTTPS URL） | 域名劫持 / 系统 DNS | 备注 |
|------|----------------|------------------|-----------------------|------|
| **Quantumult X** | `server=223.5.5.5` | `doh-server=https://doh.pub/dns-query`（**禁止** `server=https://...`，line N 报语法错误） | `server=/*.apple.com/system` | 官方 sample 要求多个 DoH URL 在同一行逗号分隔，以并发查询；`dns_exclusion_list` 写在 `[general]` 而非 `[dns]` |
| **Shadowrocket** | `dns-server=223.5.5.5,https://doh.pub/dns-query`（IP+URL 可逗号混排） | 同左（`dns-server=` 字段直接接受 URL，无独立 DoH 字段） | 走规则 / sgmodule | `fallback-dns-server=...` 用于解析失败回退；`hijack-dns=8.8.8.8:53` 用于劫持硬编码 DNS |
| **Surge** | `dns-server=223.5.5.5, system` | `encrypted-dns-server=https://doh.pub/dns-query`（**独立字段**，禁止混在 `dns-server=` 里） | `[Host]` 段 `*.apple.com = server:system` | DoH 字段与 SR 不同，与 Loon/QX 也不同——三家三种写法 |
| **Loon** | `dns-server=system, 223.5.5.5` | `doh-server=https://doh.pub/dns-query`（**独立字段**，同 QX） | `[Host]` 段 `*.apple.com = server:system` | DoH 字段名同 QX，但 [Host] 段语法跟 Surge |
| **Mihomo 客户端（Clash Party / CMFA / OpenClash / FlClash）** | YAML `dns.nameserver: [223.5.5.5, 119.29.29.29]` | YAML `dns.nameserver: [https://doh.pub/dns-query, ...]`（与 IP 同一数组） | `dns.fake-ip-filter` / `hosts:` | 还有 `direct-nameserver` / `proxy-server-nameserver` / `nameserver-policy` 等多层 |
| **Stash** | YAML `dns.default-nameserver` 只放 IP；`dns.nameserver` 可放 IP/DoH | DoH 放 `dns.nameserver` / `dns.nameserver-policy` | `dns.fake-ip-filter` / `hosts:` | 不复制 Mihomo `proxy-server-nameserver` / `direct-nameserver` / `fallback-filter`；见 `REFERENCE-Stash-wiki.md` |
| **sing-box** | typed server：`type: udp` / `server` | typed server：`type: https` / `server` / `path` | `dns.rules[]`；1.14 响应匹配用 `evaluate` / `match_response` | 1.12 引入 typed DNS；本仓库 Full 验收 1.14.3，兼容变体验收 1.13.14；不输出旧 `address` / `address_resolver` |

历史出处：
- **FIX#QX-08-P0**（PR #117）：QX `server=https://...` → `doh-server=https://...`
- **FIX#QX-07-P0**（PR #114）：QX `running_mode_trigger=filter,...` 误用（合法值仅 `direct`/`proxy`/`auto`/`follower`/`none`）
- 反面教材：上一版 PR #114 CHANGELOG 误判 line 22 DNS 报错为 line 13 报错的级联效应——**不同语法陷阱独立报错，不要"猜"**

| 运行时场景 | 订阅可能带入的错误输入 | 覆写后的正确处理 | 出处 |
|---|---|---|---|
| **Clash Party / FlClash JS `fake-ip-filter`** | `fake-ip-filter-mode: rule`、`rule-set:cn domain`、`RULE-SET,...` | 固定 `fake-ip-filter-mode: blacklist`；移除规则模式项和依赖订阅 `rule-providers` 的 `rule-set:*`，再合并合法域名/域集合项 | Issue #182 |

#### 3.5.2 规则前缀与目标段

| 产物 | 域名后缀 | IP CIDR | 端口 | 进程 | RULE-SET 引用 |
|------|----------|---------|------|------|----------------|
| **Clash 家族** | `DOMAIN-SUFFIX,example.com` | `IP-CIDR,1.2.3.0/24` | `DST-PORT,443` | `PROCESS-NAME,curl` | `RULE-SET,name` + 顶部 `rule-providers` |
| **Stash** | `DOMAIN-SUFFIX,example.com` | `IP-CIDR,1.2.3.0/24` | `DST-PORT,443` | `PROCESS-NAME,curl` | `RULE-SET,name` + 顶部 `rule-providers` |
| **Shadowrocket** | `DOMAIN-SUFFIX,example.com` | `IP-CIDR,1.2.3.0/24` | `DST-PORT,443` | （iOS 限制，不支持） | `RULE-SET,<url>,<policy>`（直接 URL，无 rule-providers 节） |
| **Surge** | `DOMAIN-SUFFIX,example.com` | `IP-CIDR,1.2.3.0/24` | **`DEST-PORT,443`**（禁止 `DST-PORT`） | `PROCESS-NAME,curl` | `RULE-SET,<url> <policy>` |
| **Loon** | `DOMAIN-SUFFIX,example.com` | `IP-CIDR,1.2.3.0/24` | **`DEST-PORT,443`**（同 Surge，禁止 `DST-PORT`） | `PROCESS-NAME,curl` | `RULE-SET,<url>,<policy>` |
| **Quantumult X** | `host-suffix, example.com, <policy>` | `ip-cidr, 1.2.3.0/24, <policy>` | （走 `[filter_local]` 单独段） | `process-name, curl, <policy>` | `[filter_remote]` URL 顶部声明 |
| **Passwall / Passwall2** | 纯字符串 / `domain:example.com` / `full:exact.com` / `regexp:^...$` | `1.2.3.0/24`（直写，无前缀） | （UI 单独配） | （不支持） | `geosite:cn` / `rule-set:remote:<url>` / `rule-set:local:/path` |
| **sing-box** | JSON `domain_suffix: ["example.com"]` | JSON `ip_cidr: ["1.2.3.0/24"]` | `port: [443]` | `process_name: ["curl"]` | `rule_set: ["geosite-cn"]` + 顶部 `route.rule_set` |

历史出处：
- **FIX#40**（v5.2.10-Loon.2）：Loon `DST-PORT` → `DEST-PORT`（与 Surge 一样必须用 `DEST-`）
- 反面教材：直接把 Surge `.conf` 复制成 Loon `.conf` 时，`DEST-PORT` 看似没错但 Loon 解析器对此前缀**特别**敏感

#### 3.5.3 节点过滤正则语义（区域分类核心陷阱）

| 产物 | 正则引擎 | 边界语义 | "TW" 是否匹配 "TWN" | "KR" 是否匹配 "KOR" |
|------|----------|----------|----------------------|----------------------|
| **Clash Party JS** | JS RegExp + word boundary `(^\|[^a-zA-Z])kw([^a-zA-Z]\|$)` | 严格 word boundary | ❌ 不匹配 | ❌ 不匹配 |
| **mihomo `filter:`** | Go RE2，子串 | 无 boundary | ✅ 匹配（误伤） | ❌ 不匹配 |
| **OpenClash Ruby `REGIONS`** | Ruby Regex，子串 | 无 boundary | ✅ 匹配（误伤） | ❌ 不匹配 |
| **Shadowrocket `policy-regex-filter`** | NSRegularExpression，需手动罗列 | 字面量罗列 | 必须显式写 `TW\|TWN` | 必须显式写 `KR\|KOR` |
| **Loon `NameRegex FilterKey`** | 同 SR | 同上 | 同上 | 同上 |
| **Quantumult X `server-tag-regex`** | 同 SR | 同上；可用 `(?<![a-zA-Z])US(?![a-zA-Z])` 强制 boundary | 同上 | 同上 |

历史出处：
- **FIX#24~#26**（v5.2.5）误判为 JS 专属，实际波及 4 份产物（v5.2.6 补丁）
- **FIX#29-P2**（v5.2.8-QX.5）：欧洲节点 filter 漏 GR/RO/HU/CZ；JS 主线补齐后 SR/Surge/Loon/QX 必须各自再补一次（罗列字面量）

#### 3.5.4 其他单平台语法限制

| 平台 | 字段 / 场景 | 合法值 | 出处 |
|------|------------|--------|------|
| **Quantumult X** | `running_mode_trigger=` | 仅 `direct` / `proxy` / `auto` / `follower` / `none`（**禁止** `filter`） | FIX#QX-07-P0 (#114) |
| **OpenClash** | `sniffer.skip-domain` | 不应包含币安等需要 SNI 改写的 TLS 域名 | PR #112 |
| **OpenClash full override YAML** | 顶层 `rule-providers:` / `rules:` | 各自**只能出现 1 次**（Ruby Psych last-wins 会静默丢内容） | §5 自检 4b |
| **Passwall / Passwall2 shunt_rules** | 不支持 Clash 前缀 | 必须用 `domain:` / `full:` / `regexp:` / `geosite:` / `rule-set:remote\|local:` / 裸 CIDR；**禁止** `DOMAIN-SUFFIX,` | shunt_rules.lua |
| **sing-box rule_set** | `format` 字段 | `binary`（配 `.srs` 文件）或 `source`（配 JSON）；不能反着配 | sagernet.org 文档 |
| **Stash rule-providers** | provider 下载代理 / health-check / exclude-filter | Stash Wiki 未列出这些 Mihomo 字段；从 CMFA 生成时删除 | `独立内核系/Stash/REFERENCE-Stash-wiki.md` |
| **Shadowrocket** | rule-provider 节 | **不支持**；必须把 URL 直接写在 `RULE-SET,<url>,<policy>` 中 | §3.2 + §3.5.2 |
| **Surge / Loon / QX** | 进程匹配 | iOS 进程命名空间不支持 `PROCESS-NAME`；Surge/Loon iOS 14+ 部分支持，QX 不支持 | 各官方 wiki |
| **Mihomo `.mrs`** | 规则类型 | 只允许 `domain` / `ipcidr`；混合 classical 必须拆分；部分可转必须生成 `.mrs` + `-classical.yaml` 残余；全量不可转才保留原格式 | `tools/sync-mihomo-mrs-rule-providers.js` + MetaCubeX docs |
| **Egern** | Mihomo `.mrs` | 官方文档未声明支持，禁止把 `.mrs` URL 直接写进 Egern；必须经 `tools/generate-egern-from-cmfa.js` 输出 Egern 原生 YAML | `独立内核系/Egern/REFERENCE-Egern.md` |
| **Clash Party v2.0.3+** | 原始订阅 `dns` 中的 `proxy-server-nameserver` / `proxy-server-nameserver-policy` / `nameserver-policy` | 客户端会在 JS 覆写前保护性关闭内置 `controlDns`；不要把“自动关闭 DNS 覆写”误判为脚本未执行，仓库 JS 随后仍写入自身 DNS 基线 | Issue #183；Clash Party `dnsOverrideGuard.ts` / `factory.ts` |
| **vernesong Smart** | `strategy: sticky-sessions` | 当前 SmartOption 已移除此参数；不等同于普通 load-balance 的合法 `strategy` | [固定 Smart 源码](https://github.com/vernesong/mihomo/blob/83e67d0c4415b1114f9e01d8e9a00133caf89f6c/adapter/outboundgroup/smart.go) |
| **Surge** | `[DNS]`、`fallback-dns-server`、`dns-direct-fallback-proxy` | 不属于当前官方语法；加密 DNS 放在 `[General]`，多个服务并发首答，不能声称直连失败后转代理 | [官方格式](https://manual.nssurge.com/profile/format.html)、[加密 DNS](https://manual.nssurge.com/dns/encrypted-dns.html) |
| **Passwall / Passwall2** | fused `.srs` 的实际后端 | 仅 `type=sing-box`、`protocol=_shunt`；写前检查所有分流节点，任何读取失败即停止，Xray 不解析 SRS | [后端固定源码缓存与分析](docs/upstream/2026-10-19/singbox/report.md) |
| **sing-box** | `_meta` / `http_client` / inbound `sniff` | 严格 JSON 不接收 `_meta`；Full 使用命名 HTTP client 和路由 `action: sniff`，1.13 变体单独生成，禁止手改 | [官方迁移文档](https://sing-box.sagernet.org/migration/) |

#### 3.5.5 添加新条目的工作流

发现新陷阱（以"我从产物 A 复制到产物 B 后导入报错"为信号）后，**必须**：

1. 在本 §3.5 对应小节加一行/一列，注明 ❌ 错误 + ✅ 正确；
2. 在 PR 描述 + CHANGELOG 引用本节段落号（例："参见 AGENTS.md §3.5.1 DoH 行"）；
3. 同步在本文件 `§8.4 常见错误模式` 表格中追加一行；
4. 若可机械检测，在 `§5 自检脚本` 中加一条 grep。

**禁止**：把单平台陷阱的修复隐藏在 commit message 里却不更新本节——下一个代理做基线联动时几乎一定会再踩一次。

---

## 4. 发版与版本号规则

- `rulesets/source/routing-graph.js` 的 `SOURCE_GRAPH_VERSION` 是规则源主版本号；Clash Party JS 顶部 VERSION 是客户端产物版本号。
- 其他产物使用同主版本号 + 平台后缀：
  - `v5.4.37-cmfa.X`、`v5.4.37-stash.X`、`v5.4.37-oc-normal.X`、`v5.4.37-oc-smart.X`、`v5.4.37-SR.X`、`v5.4.37-Surge.X`、`v5.4.37-Loon.X`、`v5.4.37-QX.X`、`v5.4.37-sing.X`、`v5.4.37-v2n.X`、`v5.4.37-pw.X`、`v5.4.37-pw2.X`、`v5.4.37-flclash.X`
- 平台后缀内部可独立递增，但主版本号必须与源规则图对齐；若不对齐，必须在对应子目录 `README.md` 开头标明原因。

---

## 5. 自检脚本（提交前必须本地跑一遍）

```bash
# 0) Mihomo .mrs 与派生产物生成链路（改 rule-provider / 上游规则源时必跑）
node tools/sync-mihomo-mrs-rule-providers.js
node tools/apply-mihomo-mrs-overrides.js
node tools/build-fused-rule-sets.js
node tools/generate-stash-from-cmfa.js
node tools/generate-egern-supplemental.js
node tools/generate-egern-from-cmfa.js
node "Sing-box内核系/SingBox/SingBox(sing-box)-generator.js"
node tools/generate-fused-fallback-artifacts.js

# 1) 数代理组数（必须为 33 业务组 + 22 区域组；sing-box 另加 1 个顶层节点选择）
#    CMFA：业务组用 "- name:"、区域组用 "- type: url-test" + 缩进 "  name:"，需两种模式
grep -cE "^- name: |^  name: " "Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml"  # 期望 55
grep -cE "^- name: |^  name: " "独立内核系/Stash/Stash.yaml"                          # 期望 55
#    OpenClash：33 业务组是静态 "- name:"；22 区域组由 Ruby make_smart_group() 动态生成，静态 grep 只能数到 33
grep -cE "^- name: " "Mihomo内核系/OpenClash/OpenClash(mihomo).sh"                  # 期望 33（静态业务组）
grep -cE "^- name: " "Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh"             # 期望 33（静态业务组）
grep -cE " = select,|= url-test," "独立内核系/Shadowrocket/Shadowrocket.conf"        # 期望 55
grep -cE " = select,|= url-test," "独立内核系/Surge/Surge.conf"                      # 期望 55
grep -cE " = select,|= url-test," "独立内核系/Loon/Loon.conf"                        # 期望 55
grep -cE "^(url-latency-benchmark|static)=" "独立内核系/Quantumult X/QuantumultX.conf"        # 期望 55
node -e "const d=JSON.parse(require('fs').readFileSync('Sing-box内核系/SingBox/SingBox(sing-box)-full.json','utf8'));const n=d.outbounds.filter(o=>o.type==='selector'||o.type==='urltest').length;console.log(n);process.exit(n===54?0:1)"  # 期望 54（无「其他」区域组）

# 2) RP 代理字段
grep -c "proxy: DIRECT" "Mihomo内核系/OpenClash/OpenClash(mihomo).sh"                    # 期望 0
grep -c "proxy: '☁️ 云与CDN'" "Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml"         # 期望 0
grep -c "proxy: '🚫 受限网站'" "Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml"        # 期望 113（最终融合 provider）
grep -c "proxy: '🚫 受限网站'" "独立内核系/Stash/Stash.yaml"                              # 期望 0（Stash Wiki 未记录 provider proxy 字段）
grep -c "proxy: \"\\\\U0001F6AB 受限网站\"" "Mihomo内核系/OpenClash/OpenClash(mihomo).sh"               # 期望 ≥ 113
grep -c "proxy: \"\\\\U0001F6AB 受限网站\"" "Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh"  # 期望 ≥ 113

# 3) 禁止死引用（旗帜 emoji 与组名 emoji 必须匹配；忽略注释行）
grep -nE "^[^#].*🇸🇬 亚太节点" "独立内核系/Shadowrocket/Shadowrocket.conf"                  # 必须无输出
grep -cE "^🎵 TikTok = " "独立内核系/Shadowrocket/Shadowrocket.conf"                   # 期望 1（v5.4.7 新增独立组）

# 4) JSON 合法性（sing-box + v2rayN 路由；优先 node，备选 python3）
node -e "JSON.parse(require('fs').readFileSync('Sing-box内核系/SingBox/SingBox(sing-box)-full.json','utf8'));console.log('SingBox JSON: VALID')"
node -e "const a=JSON.parse(require('fs').readFileSync('Xray内核系/v2rayN/v2rayN(xray).json','utf8'));const m=a[0];console.log('v2rayN JSON: VALID, items:',a.length,'version:',m.remarks?.match(/v[0-9]+\\.[0-9.]+-v2n\\.[0-9]+/)?.[0])"

# 4b) OpenClash full 生成的 override YAML：必须只有 1 个 rule-providers + 1 个 rules 顶层键
#     （Ruby Psych 对重复顶层键 last-wins，会静默丢掉前面的全量内容——本仓库曾在此犯错）
awk '
  /^cat > "\$OVERRIDE_YAML" << .OVERRIDE_EOF./ { inblock=1; next }
  /^cat >> "\$OVERRIDE_YAML" << .OVERRIDE_EOF./ { inblock=1; next }
  /^OVERRIDE_EOF$/ { inblock=0; next }
  inblock { print }
' "Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh" > /tmp/oc_full_override_probe.yaml
grep -cE "^rule-providers:$" /tmp/oc_full_override_probe.yaml   # 期望 1
grep -cE "^rules:$" /tmp/oc_full_override_probe.yaml             # 期望 1
ruby -ryaml -e '
  d = YAML.load_file("/tmp/oc_full_override_probe.yaml", permitted_classes: [Symbol], aliases: true)
  raise "providers != 113" unless (d["rule-providers"] || {}).size == 113
  raise "rules    != 130" unless (d["rules"]         || []).size == 130
  puts "OC full override yaml: providers=#{d["rule-providers"].size} rules=#{d["rules"].size}"
'

# 5) 产物合同验证（--strict-ruby 会实际解析 CMFA、Stash、OpenClash、Egern YAML，并检查 .mrs manifest）
node tools/validate-artifact-contracts.js --strict-ruby

# 6) JS 覆写与 PROCESS-NAME 合同
# FIX#182：上述命令包含 fake-ip-filter 规则模式 / 悬空 rule-set 引用回归检查
# FIX#183：上述命令包含 Clash Party v2.0.3+ 原始订阅 DNS guard 边界与脱敏诊断回归检查
rg -n "sanitizeFakeIpFilterEntries|fake-ip-filter-mode.*blacklist" "Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js" "Mihomo内核系/Clash Party/ClashParty(mihomo).js" "Mihomo内核系/FlClash/FlClash(mihomo).js"
rg -n "logClashPartyDnsGuardBoundary|Clash Party v2\.0\.3\+ DNS guard" "Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js" "Mihomo内核系/Clash Party/ClashParty(mihomo).js"
node tools/validate-js-overwrites.js
node tools/validate-process-name-direct.js

# 7) 融合规则语义去重 + 客户端聚合预算（禁止靠分片绕过总量限制）
node --test tools/tests/apply-mihomo-mrs-overrides.test.js tools/tests/egern-generation-manifest.test.js tools/tests/fused-rule-optimizer.test.js tools/tests/fused-artifact-performance.test.js
node tools/validate-generated-remote-asset-size.js

# 8) 官方文档收据、版本 schema 与 SRS 后端门禁
node --test tools/tests/official-docs-cache.test.js tools/tests/singbox-current-schema.test.js tools/tests/passwall-backend-guard.test.js
# 真正的内核 schema 验收另设 SING_BOX_114_BIN / SING_BOX_113_BIN 指向官方内核。
# 未提供时测试必须明确显示跳过；静态测试通过不代表内核检查或 App 真机验收。
```

若任一检查失败，PR 不得合入。

---

## 6. 修改流程（推荐）

```
① 读 `rulesets/source/routing-graph.js`（规则权威源）→ 搞清楚要改什么
② 读目标 APP 官方文档 → 确认新字段/新组在每个产物上的等价写法
③ 改 source graph → `.mrs` 同步 → fused 编译
④ 同步 CMFA / OpenClash / FlClash 等 Mihomo 产物
⑤ 重新生成 Stash / Egern / SingBox / v2rayN / Passwall / Passwall2
⑥ 同步 Shadowrocket → Surge → Loon → QX（按适用性说明豁免）
⑦ 跑 §5 自检命令
⑧ 更新根 README.md + 各子目录 README.md + CHANGELOG
⑨ PR 描述里写：改动摘要 / 影响矩阵 / .mrs manifest 统计 / 官方文档链接 / 自检输出
```

---

## 7. 底线

- 不同步 = 违规。
- 不核对官方文档 = 违规。
- 删除/改名 55 个代理组之一而未在 PR 说明里论证 = 违规。
- 伪造「已兼容」结论（没有引用官方文档就下结论）= 违规。

> 这些约束是仓库长期可维护性的前提，优先级高于任何「小修快改」的便利。

---

## 8. 多代理协作与文件治理

### 8.1 代理身份识别

- 自动化代理提交时必须在 commit message 中标注 `[agent: <name>]`；平台已自动附加可追踪 trailer 时可不重复。
- Human 手工修改无需代理标识，但触发 §1 全版本联动时仍须遵守全部生成与验收约束。

### 8.2 并行修改与冲突处理

- 若另一个代理或维护者已在并行分支修改同一区域，不得 force-push 覆盖。
- 先声明本次修改意图，再拉取对方分支并 rebase；无法安全合并时交由 maintainer 仲裁。
- 工作区出现来源不明的改动时默认视为用户或其他代理的有效工作，不得擅自回退。

### 8.3 受保护文件

以下内容改动前必须获得 maintainer 明确同意：

- `Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js` 中 `SMART` / `BIZ` 常量定义（§3.1 的 55 组命名：22 区域 + 33 业务）
- `Sing-box内核系/SingBox/SingBox(sing-box)-generator.js` 的生成策略
- `tools/generate-stash-from-cmfa.js` 的生成策略
- 本 `AGENTS.md` 维护契约

以下内容可在 §1 / §2 约束下正常修改：rule-provider 列表、规则条目顺序、子目录 README 和版本号。

### 8.4 常见错误模式（禁止复现）

| 错误 | 历史出处 | 为什么错 | 正确做法 |
| --- | --- | --- | --- |
| OpenClash Normal 的 `rule-providers.proxy: DIRECT` | v5.3.1-oc-normal 之前 | 墙内无法直连 jsdelivr / GitHub，规则下载失败 | 全部改 `proxy: 🚫 受限网站` |
| 把 UI 代理组顺序当成规则匹配顺序 | v5.4.8 之前 | 会破坏广告前置或 `MATCH/FINAL` 兜底顺序 | UI 展示顺序与内部匹配顺序分离；广告必须最前，`MATCH/FINAL` 必须最后 |
| CMFA 的 `rule-providers.proxy: '☁️ 云与CDN'` | v5.2.0-cmfa 之前 | 与规则下载代理基线不一致，墙内可能失败 | 改为 `proxy: '🚫 受限网站'` |
| Shadowrocket 引用 `🇸🇬 亚太节点` | v5.2.2-SR.1 | 实际组名是 `🌏 亚太节点`，客户端会静默忽略不存在的候选 | 逐字节统一组名和 emoji |
| 改产物但忘记 bump 版本号或追加 CHANGELOG | 多次 | 历史追溯失效，无法判断线上基线 | 按 §1.3 同步版本、Build 日期和 CHANGELOG |
| 把详细变更日志塞回产物文件头 | v5.2.3 及之前 | 配置头被历史淹没，多处日志容易漂移 | 文件头只保留轻量元信息，详情只写 CHANGELOG |
| 单边修改 Clash Party JS 或任一派生产物 | 多次 | 跨设备策略语义不一致 | 从源规则图出发，按 §1 全端联动 |
| 凭训练数据判断 sing-box 或其他客户端字段 | 潜在 | 字段与版本持续变化 | 按 §2 引用最新官方文档和字段锚点 |
| 手工修改 `独立内核系/Stash/Stash.yaml` | Issue #173 | 未经裁剪的 Mihomo 字段可能导致 Stash 导入失败 | 只改 CMFA / 生成器，再运行 `generate-stash-from-cmfa.js` |
| 把 Mihomo `.mrs` 直接写进 Egern | v5.4.38-egern.2 | Egern 官方文档未声明支持 `.mrs` | 经 Egern 生成器转换为原生 YAML 规则集 |
| 增加上游 provider 后不跑 `.mrs` 同步 | v5.4.38-mrs | Mihomo 产物退回低效格式或各端漂移 | 依次执行 MRS 同步、映射、融合和完整生成链路 |
| QX `[dns] server=https://...` | v5.2.10-QX.2 | QX 的 DoH 必须使用独立 `doh-server=` 字段 | 按 §3.5.1 使用 `doh-server=https://...` |
| QX `running_mode_trigger=filter,...` | v5.2.10-QX.1 | `filter` 不是合法值 | 按 §3.5.4 使用 `direct` / `proxy` / `auto` / `follower` / `none` |
| Loon / Surge 使用 `DST-PORT` | v5.2.10-Loon.1 | 两端端口规则使用 `DEST-PORT` | 按 §3.5.2 使用 `DEST-PORT` |
| 把 Surge `encrypted-dns-server=` 复制到 Loon / Shadowrocket | 潜在 | 三个平台的 DoH 字段不同 | 按 §3.5.1 分平台维护 |
| 把 Clash `DOMAIN-SUFFIX,` 复制到 Passwall `.list` | 潜在 | Passwall 解析器不识别 Clash 前缀 | 使用 `domain:` / `full:` / `regexp:` / `geosite:` 等原生语法 |
| 订阅 `fake-ip-filter` 遗留 `rule-set:cn domain` 或 `RULE-SET,...` | Issue #182 | 覆写重建 `rule-providers` 后，旧规则模式项会变成非法或悬空引用 | 按 §3.5.1 固定 `blacklist` 并清理源规则引用 |
| 把 Clash Party v2.0.3+ 自动关闭 DNS 覆写当作 JS 失效 | Issue #183 | 客户端主进程在 JS 覆写前检查原始订阅 DNS 字段并关闭内置 `controlDns`；本仓库脚本随后仍会写入自己的 DNS | 保持客户端内置 DNS 覆写关闭，检查最终配置和脱敏诊断日志；若必须由客户端接管，先在原始订阅/聚合层移除受保护字段 |
| 假设单平台 bug 无需联动 | v5.2.5 FIX#24~#26 | 实际可能存在多个语法不同但逻辑同构的漏洞 | 按 §1.5 对全部产物做同构审计 |
| Smart 仍写 sticky-sessions、把 MetaCubeX Alpha 当 Smart | 2026-10-19 官方版本核对 | 当前 SmartOption 已移除 strategy；两个项目的 Alpha 是不同内核 | 核对 vernesong Smart 实际构建，删除失效字段，不承诺会话粘性 |
| Surge 未识别的 DNS 节、QX 多行 DoH | 2026-10-19 官方语法核对 | 可导入不等于字段生效 | Surge 仅用官方 General DNS 字段；QX 多 DoH 合成一行并保持顺序 |
| SRS 分流交给 Xray 或忽略节点读取失败 | 2026-10-19 Passwall 后端核对 | Xray 过滤 SRS，PW2 可能退化成宽匹配 | 所有分流节点先确认 sing-box，任何 protocol/type 读取异常须在 UCI 写入前停止 |
| sing-box 只验 JSON 语法、把 GUI 名当内核版本 | 2026-10-19 官方内核检查 | `_meta`、旧 DNS 与跨版 HTTP client 会被真实核心拒绝 | 两版生成、匹配内核真实 check；GUI 导入模式与最终配置另验 |

---

## 9. CI/CD 集成

### 9.1 自动验证（GitHub Actions）

PR 提交后会自动运行两个验证工作流：

1. **Validate JS Overwrites** — 验证 Clash Party / FlClash JS 覆写脚本
   - 触发条件：PR/push 修改 `Mihomo内核系/Clash Party/**/*.js`、`Mihomo内核系/FlClash/**/*.js`、`tools/validate-js-overwrites.js`
   - 验证内容：节点分类、组顺序、规则引用、订阅清理、TikTok 目标隔离等
2. **Validate Artifact Contracts** — 跨客户端产物一致性验证（含 Ruby YAML 解析）
   - 触发条件：PR/push 修改任何产物文件（JS/YAML/JSON/conf）
   - 验证内容：JS 覆写、CMFA、OpenClash、Shadowrocket、Surge、Loon、QX、SingBox、Karing、v2rayN、Passwall、Passwall2、Stash、Egern 的规则/组合同；Mihomo `.mrs` manifest、JSON 合法性与 YAML 重复键。Karing 的专属生成合同由 `node tools/generate-karing.js --check` 覆盖。
3. **Sync All Fused Rule Sets**（`.github/workflows/sync-mihomo-mrs-rule-providers.yml`）— 定时同步全部上游规则并发布最终融合产物
   - 触发条件：每周定时 + 手动 workflow_dispatch
   - 固定顺序：sync `.mrs` → apply overrides → build fused（含原生 fallback）→ regenerate Stash/Egern/SingBox/Karing/fallback → 完整合同/去重/预算验证 → 中文提交
   - Egern 生成清单对 CMFA、源规则图、Profile、每个原生 YAML 资产哈希和引用清单做双向校验；上游去重使规则数量发生正常变化时，不得再使用固定快照数字阻断同步。
   - 提交范围必须覆盖源规则图、`rulesets/generated/fused/`、MRS、Egern 规则集和14 类既有客户端产物与 Karing 适配；工作流级并发组禁止两个刷新任务同时写入 `main`。

任一工作流失败 → PR 不得合入。

### 9.2 AI Issue 自动回复

仓库配置了 Xiaomi MiMo AI 自动回复器（`.github/workflows/ai-responder.yml`）：

- **触发方式**：
  - Issue 打上 `question`/`bug`/`enhancement`/`documentation` 标签时自动触发
  - 评论区输入 `/ai-help` 可升级为深度分析（`mimo-v2.6-pro` 模型）
- **分层调用策略**：

| Issue 类别 | 首次触发 | /ai-help 追问 | 代码修改权限 |
| --- | --- | --- | --- |
| question/faq/help wanted | `mimo-v2.6-flash` 思考 | `mimo-v2.6-pro` 思考 | ❌ |
| bug | `mimo-v2.6-flash` 思考 | `mimo-v2.6-pro` 思考 | ✅ |
| enhancement | `mimo-v2.6-flash` 思考 | `mimo-v2.6-pro` 思考 | ✅ |
| documentation | `mimo-v2.6-flash` 思考 | `mimo-v2.6-pro` 思考 | ✅ (文档) |

- **代码修改模式**：AI 输出结构化响应（`<!-- AI_REPLY -->` + `<!-- AI_PATCH -->` + `<!-- AI_PR -->`），workflow 自动提取补丁、创建分支、提交并开 PR
- **所需 Secrets / Variables**：`MIMO_API_KEY`（必填）、`TAVILY_API_KEY`（可选，联网搜索）；可选 Actions Variable `MIMO_BASE_URL` 覆盖标准端点 `https://api.xiaomimimo.com/v1`。Token Plan 的 key 不能与标准套餐混用，`MIMO_BASE_URL` 应填写控制台提供的完整 base URL。

---

## 10. README 与文档编写契约

### 10.1 根 README 的职责与信息顺序

根 `README.md` 是项目首页和快速入口，优先帮助读者判断项目价值、开始使用并找到对应客户端。推荐按以下顺序组织：

1. 主视觉与项目价值：说明解决什么问题、适合谁，并使用 `tools/generate-readme-visuals.js` 生成的自包含现代玻璃风 SVG。
2. 三步入门：以简短步骤引导读者选客户端、导入配置并完成基本检查。
3. 按客户端家族排列的下载入口：提供清晰分类目录和按钮，覆盖仓库提供的全部产物。
4. 单张核心设计概览：解释同源规则如何按客户端落地，不重复专题页的详细图表。
5. 专题导航：链接到 `docs/guide/` 下的 downloads、client-support、routing-policy、dns-and-verification、acknowledgements 等指南。
6. 参与方式与 License。

根 README 不重复长目录路径、参数、维护命令、详细协议/规则来源、DNS 排障步骤或变更历史。将这些内容放在二级指南、客户端教程或相应单一事实源中；升级时同步修正文档链接，并核对文中可验证事实仍与源文件、生成物或官方资料一致。wiki 不作为本仓库需要另行维护的内容副本。

### 10.2 首页布局与媒体

- 根 README 表格建议不超过三列，每张表聚焦一种比较；长矩阵按客户端家族拆到对应二级文档。避免首列文字逐字竖排、极窄教程列、无必要的横向滚动，以及在表格单元格中嵌入长代码。
- 下载内容可按客户端家族使用分类目录和按钮；保证每个正式产物都能从入口发现，并明确区分 Raw 文件（直接获取配置/规则）与教程（说明选择、导入和设置）。
- 视觉应优先适配手机；至少在 390px 宽视口检查图表文字、按钮与导航可读。图片提供有意义的 alt 文本；关键信息须保留为可检索文本，不得只放在图片里，也不得用一张大图承载全部说明。
- 首页视觉使用 `tools/generate-readme-visuals.js` 生成的自包含 SVG。保持 SVG 自包含，不依赖 inline CSS/JavaScript 或 GitHub 不支持的功能；需要修改图形时更新生成器并重生成资源，不手工编辑生成结果。

### 10.3 渲染、链接与发布验收

每次修改 README 的布局、表格、SVG 或链接，在推送前必须完成实际 GitHub GFM 或等效渲染验收：检查桌面亮色、桌面暗色和 390px 窄屏；确认页面整体无溢出、图文无截断、按钮可读。核对本地文件链接与页内锚点，对新增或改变的下载 URL 检查实际响应；地址和内容未变的链接可复用已有完整下载与哈希校验结果。可将截图或验收报告保存在 `.cache/` 作为证据。

生成器的 `--check` 可用于发现生成文件漂移，但不能替代视觉验收。仅在本次授权包含发布时推送；发布后检查 GitHub 上的实际渲染效果，并核对对应提交的 CI 结果。纯文档与 SVG 表现层修改不触发 §1 的全客户端版本更新或规则再生成；若改动同时影响规则、DNS、运行时行为或生成产物，仍按 §1 执行。

### 10.4 客户端教程与现行文档统一

- 客户端 README、下载专题、文档中心、规则维护页和 CHANGELOG 使用同一套配色、响应式页头与导航；顶部按「页头 → 可检索 H1 → 一句用途 → 同行导航」排列。按钮在桌面并排，手机自然换行。
- 客户端教程按「开始前与文件选择 → 完整导入步骤 → 必要设置 → 验收 → 常见问题 → 进阶参考」组织。关键导入步骤直接展示；重复原理和低频维护细节可折叠，但不得省略命令、订阅接入、关联启用、版本条件或平台限制。
- 兼容旧锚点时把 ID 放在实际对应内容前，不能集中堆放在页尾；新增页面同步加入文档中心。
- CHANGELOG 统一展示与返回导航，历史版本条目原样保留。官方 REFERENCE 快照和历史审计档案保留原文，通过 `docs/archive/README.md` 统一入口；不为美化改写证据正文。
