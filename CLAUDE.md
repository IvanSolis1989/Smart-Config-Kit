# CLAUDE.md — 仓库维护契约（AI 必读）

> 本文件是 Smart-Config-Kit 仓库的**强约束维护契约**，所有自动化代理（Claude Code、Codex、Copilot 等）在修改本仓库前**必须完整阅读并遵守**。
> 违反以下任何一条，PR 必须退回重做。

---

## 0. 仓库定位

本仓库维护「**同一套 Mihomo Smart 分流策略**」在 11 个客户端形态下的等价实现：

| # | 形态 | 文件 | 角色 |
|---|------|------|------|
| 0 | **Clash Party**（JS 覆写脚本） | `Clash Party/ClashParty(mihomo-smart).js` | **唯一主线 / 事实基线** |
| 1 | Clash Meta For Android（原生 YAML） | `Clash Meta For Android/CMFA(mihomo).yaml` | 从属 |
| 2 | OpenClash 轻量版（shell + heredoc YAML） | `OpenClash/OpenClash(mihomo).sh` | 从属（低内存裁剪） |
| 3 | OpenClash 完整版（shell + heredoc YAML） | `OpenClash/OpenClash(mihomo-smart).sh` | 从属（全量） |
| 4 | Shadowrocket（iOS SR 私有 conf） | `Shadowrocket/Shadowrocket.conf` | 从属 |
| 5 | SingBox Full（JSON，由脚本生成） | `SingBox/SingBox(sing-box)-full.json` + `SingBox/SingBox(sing-box)-generator.js` | 从属（生成产物） |
| 6 | v2rayN Xray 路由 JSON | `v2rayN/v2rayN(xray).json` | 从属（仅 Xray 核心兜底；v2rayN 推荐用 mihomo/sing-box 核心直接加载 #1 或 #5） |
| 7 | Surge（iOS / macOS 付费正版 `.conf`） | `Surge/Surge.conf` | 从属（独立引擎） |
| 8 | Loon（iOS 付费正版 `.conf`） | `Loon/Loon.conf` | 从属（独立引擎） |
| 9 | Quantumult X（iOS 付费正版 `.conf`） | `Quantumult X/QuantumultX.conf` | 从属（独立引擎） |
| 10 | Passwall（OpenWrt 全功能 LuCI） | `Passwall/Passwall(xray+sing-box)-apply.sh` + `Passwall/shunt-rules/*.list` | 从属（展平降级） |
| 10B | Passwall2（OpenWrt 精简分流 LuCI） | `Passwall2/Passwall2(xray+sing-box)-apply.sh` + `Passwall2/shunt-rules/*.list` | 从属（展平降级；与 #10 共享规则语法） |

**基线原则：** Clash Party JS 脚本是唯一的「**策略权威源**」。其他产物必须在语义上与其一致；仅在平台能力受限处允许差异（见 §3）。

> **关于 v2rayN：** v2rayN 是多核调度器，不是独立内核。推荐使用路径是在 v2rayN 里切到 mihomo 或 sing-box 核心，然后加载 #1 / #5；这种情况下 v2rayN 本身不是独立产物，无需单独同步。仅当 v2rayN 用户坚持走 Xray 核心时才用到 `v2rayN/v2rayN(xray).json`（功能裁剪版，只有 proxy/direct/block 三出站），此文件是独立产物，受本文约束。
>
> **关于 Hiddify：** Hiddify 内核即 sing-box（修改版 `hiddify-sing-box`），直接消费 `SingBox/SingBox(sing-box)-full.json`，**不需要**独立产物；`SingBox/README.md §2a` 提供 Hiddify 专用导入说明。
>
> **关于 ClashMi（`KaringX/clashmi`，KaringX 跨平台 Flutter GUI，覆盖 iOS/macOS/Android/Windows/Linux）：** bundle 的是 **MetaCubeX mihomo mainline**（**非** `vernesong/mihomo` Smart fork），与 CMFA 内核同源，直接消费 `Clash Meta For Android/CMFA(mihomo).yaml`，**不需要**独立产物；`Clash Meta For Android/README.md §九` 提供 ClashMi 专用导入说明。注意 ClashMi 的内核定制会把 `GEOIP,*` / `GEOSITE,*` 规则**强制转换**为对应 rule-set、iOS 端不支持 IP-ASN 数据库、`tun:` 由 App UI 托管不在 YAML 手写（官方 [FAQ](https://clashmi.app/guide/faq)）——这三点对本仓库 YAML **零影响**（0 条 GEOIP、0 条 GEOSITE、0 条 ASN、无 `tun:` 块）。与 Hiddify 对称：Hiddify 是 sing-box 的跨平台 GUI / ClashMi 是 mihomo 的跨平台 GUI。
>
> **关于 ShellClash（`juewuy/ShellCrash`）：** 内核是 mihomo，直接复用 `Clash Meta For Android/CMFA(mihomo).yaml` 或 `OpenClash/OpenClash(mihomo).sh` 里的 heredoc YAML 块，**不需要**独立产物。
>
> **关于 HomeProxy（OpenWrt 官方 sing-box LuCI 插件）：** 内核就是 sing-box，直接导入 `SingBox/SingBox(sing-box)-full.json`，**不需要**独立产物；`SingBox/README.md §2b` 提供 HomeProxy 专用导入说明。
>
> **关于 Passwall / Passwall2：** 这两款是 [`Openwrt-Passwall`](https://github.com/Openwrt-Passwall) 组织（原 `xiaorouji` 个人仓库已于 2025 年前后迁入该组织，访问旧 URL 会 301 跳转）**并行维护**的两款独立 OpenWrt 插件（**不是**新旧关系；2026-04 两者发版仅差 4 天）。**Passwall** = 全功能（直连/屏蔽/GFW/代理 4 列表 + 分流 + ACL + `trojan-plus` 节点 + TCP/UDP 节点分选）；**Passwall2** = 精简分流（砍掉四列表 + ACL，只保留 keyword/domain/geosite/geoip 匹配 + 统一节点选择）。两者底层都是 **xray-core + sing-box 双栈**（都**不打包** mihomo），都**没有** mihomo 的 proxy-groups 嵌套选择器（两级 `select`/`url-test` + Smart + LightGBM）——Lua CBI 表单式 UI 没有 YAML 嵌套组语义。**规则语法两者完全相同**（共用 [`shunt_rules.lua`](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua)：纯字符串 / `domain:` / `full:` / `regexp:` / `geosite:` / `rule-set:remote|local:` / `geoip:` + CIDR；**不支持** Clash 的 `DOMAIN-SUFFIX,` / `DOMAIN-KEYWORD,` / `IP-CIDR,` 前缀）。**本仓库提供两个独立目录**：
>
> - **`Passwall/`** — Passwall 全功能版参考（`CONFIG_NAME="passwall"`；含四列表/ACL/TCP-UDP 分选说明）
> - **`Passwall2/`** — Passwall2 精简版参考（`CONFIG_NAME="passwall2"`）
>
> 两者 `.list` 文件内容互通、规则语法同源。想要 mihomo 完整体验（嵌套组 + Smart + LightGBM）请迁移到 **OpenClash**（本仓库 `OpenClash/`）。
>
> **关于 SSR Plus+：** 架构老旧 + 已停止维护，没有 geosite/rule_set 层能力。**不提供产物**，建议直接换 OpenClash。
>
> **关于 Surge / Loon / Quantumult X：** 这三款 iOS/macOS 付费客户端各自使用私有 `.conf` 语法，与 Shadowrocket 部分兼容但不完全一致，因此每个都是独立产物。其中：
> - Surge 与 Shadowrocket 语法最接近（~90% 兼容），从 Shadowrocket 迁移改动最小
> - Loon 兼容 Surge 的 `[Rule] RULE-SET` 语法，但 [General] DNS 字段和 MMDB 配置方式不同
> - Quantumult X 使用完全独立的 `[policy]` / `[filter_remote]` / `[filter_local]` 结构，由 `tools/srk_to_qx.py` 或等价脚本从 Shadowrocket 自动转换生成

---

## 1. 每次修改「规则 / 策略组 / DNS」都必须全版本联动 ⚠️

> 这是本仓库最**核心且不可违反**的规则。

### 1.1 触发条件（任一满足即必须全版本联动）

- 新增/删除/重命名**任何代理组**（含 18 个区域组〔9 全部 + 9 家宽〕与 28 个业务组）
- 新增/删除/修改**任何 rule-provider**（含 URL、behavior、format、interval、proxy 字段）
- 修改**规则条目的目标组**（例如把 `RULE-SET,tiktok` 从 `📱 社交媒体` 改到其他组）
- 修改**规则顺序**中影响命中优先级的段（特别是广告拦截、GFW、FINAL 前置关系）
- 修改 **DNS / Sniffer / fake-ip / GeoX URL / LightGBM URL** 等全局行为
- 修改 **规则源仓库**（MetaCubeX / blackmatrix7 / Loyalsoldier / szkane / Accademia 等)
- **修复「节点名分类 / 订阅合并 / 区域组 fallback」等运行时逻辑 bug**（自 v5.2.6 起强制加入触发条件 —— 参见 §1.5 同构 bug 审计）

### 1.2 强制动作清单（Per-PR Checklist）

若本次改动命中上述任一触发条件，PR 必须：

1. **先改 Clash Party JS 主线**（`Clash Party/ClashParty(mihomo-smart).js`），作为唯一权威源。
2. **同步修改全部 11 个目录产物**（或明确在 PR 说明里标注为何某个产物不受影响）：
   - `Clash Meta For Android/CMFA(mihomo).yaml`
   - `OpenClash/OpenClash(mihomo).sh`
   - `OpenClash/OpenClash(mihomo-smart).sh`
   - `Shadowrocket/Shadowrocket.conf`
   - `SingBox/SingBox(sing-box)-full.json`（通过 `node SingBox/SingBox(sing-box)-generator.js` 重新生成，不允许手工改）
   - `v2rayN/v2rayN(xray).json`（仅当业务组/规则类别发生变化时需同步；Xray 只有 proxy/direct/block 三出站，单纯区域选择/LightGBM 调整可豁免）
   - `Surge/Surge.conf`（与 Shadowrocket 保持 ~1:1 规则行；仅 [General] DNS/MMDB 不同）
   - `Loon/Loon.conf`（从 Surge 迁移；头部 + [General] 不同，[Rule] 段基本同 Surge）
   - `Quantumult X/QuantumultX.conf`（Shadowrocket → QX 转换；policy / filter_remote / filter_local 三段结构；可由等价脚本重新生成）
   - `Passwall/Passwall(xray+sing-box)-apply.sh` + `Passwall/shunt-rules/*.list`（展平降级参考；仅当业务组/规则类别变化时需同步）
   - `Passwall2/Passwall2(xray+sing-box)-apply.sh` + `Passwall2/shunt-rules/*.list`（同上；与 Passwall 同步联动）
3. **同步更新每个产物头部的「介绍 / 更新日志 / 版本号」注释块**（见 §1.3 强制注释字段）。
4. **同步更新文档**：根 `README.md` + 对应子目录的 `README.md`（原 `使用方法.md` / `使用教程.md` 已统一重命名为 `README.md`，GitHub 子目录视图会自动渲染），必要时 `CHANGELOG`。
5. **自检命令必须通过**（§2）。
6. **提交前在 PR 描述里列出「影响面」**：
   - 改动的代理组 / rule-provider / 规则行数
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

1. 产物名称 + 版本号（与 Clash Party 主版本对齐，加平台后缀）
2. Build 日期（YYYY-MM-DD）
3. 架构一句话（例如「18 区域〔9 全部 + 9 家宽〕 + 28 业务 + 250+ RULE-SET」）
4. 基线声明（「基线：Clash Party vX.Y.Z（唯一主线）」）
5. 指向 CHANGELOG：「变更历史：见 `<子目录>/CHANGELOG.md`」
6. 若有风险或代价，一行标注（OOM / 首次延迟 / iOS 限制）

**对应到各产物文件：**

| 文件 | 头部位置 | 版本变量/字段 | CHANGELOG.md |
|------|----------|---------------|--------------|
| `Clash Party/ClashParty(mihomo-smart).js` | 顶部 `//` 注释 | JS 内 `const VERSION` | `Clash Party/CHANGELOG.md` |
| `Clash Meta For Android/CMFA(mihomo).yaml` | 顶部 `#` 注释块 | 第一行 `# Clash Smart vX.Y.Z - CMFA` | `Clash Meta For Android/CHANGELOG.md` |
| `OpenClash/OpenClash(mihomo).sh` | `#!/bin/bash` 下方 `# ==` 块 | `VERSION_TAG="vX.Y.Z-oc-normal"` | `OpenClash/CHANGELOG.md` (Normal 段) |
| `OpenClash/OpenClash(mihomo-smart).sh` | `#!/bin/bash` 下方 `# ==` 块 | `VERSION_TAG="vX.Y.Z-oc-smart"` + Ruby 脚本里 `VERSION` | `OpenClash/CHANGELOG.md` (Smart 段) |
| `Shadowrocket/Shadowrocket.conf` | 顶部 `# ══…` 双线框 | 第 2 行 `# Shadowrocket Smart vX.Y.Z-SR.N` | `Shadowrocket/CHANGELOG.md` |
| `SingBox/SingBox(sing-box)-full.json` | 由 `SingBox/SingBox(sing-box)-generator.js` 自动注入 `_meta.version` | 生成脚本版本 | `SingBox/CHANGELOG.md` |
| `v2rayN/v2rayN(xray).json` | 顶层 `_meta`（`version` / `build` / `baseline` / `changelog:"见 CHANGELOG.md"`）| `_meta.version` | `v2rayN/CHANGELOG.md` |
| `Surge/Surge.conf` | 顶部 `# ══…` 双线框 | 第 2 行 `# Surge Smart vX.Y.Z-Surge.N` | `Surge/CHANGELOG.md` |
| `Loon/Loon.conf` | 顶部 `# ══…` 双线框 | 第 2 行 `# Loon Smart vX.Y.Z-Loon.N` | `Loon/CHANGELOG.md` |
| `Quantumult X/QuantumultX.conf` | 顶部 `# ══…` 双线框 | 第 2 行 `# Quantumult X Smart vX.Y.Z-QX.N` | `Quantumult X/CHANGELOG.md` |
| `Passwall/Passwall(xray+sing-box)-apply.sh` | `#!/bin/sh` 下方 `# ══…` 块 | `VERSION_TAG="vX.Y.Z-pw.N"` | `Passwall/CHANGELOG.md` |
| `Passwall2/Passwall2(xray+sing-box)-apply.sh` | `#!/bin/sh` 下方 `# ══…` 块 | `VERSION_TAG="vX.Y.Z-pw2.N"` | `Passwall2/CHANGELOG.md` |

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

**触发条件**：只要本次修复命中以下任一运行时逻辑点，**必须对全部 10 份产物做同构审计**：

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
| OpenClash normal / full | Ruby `REGIONS` 哈希（子串匹配） + `make_smart_group` fallback + `config["proxy-groups"] = ...` 重建 |
| Shadowrocket | `[Proxy Group] ... policy-regex-filter=...` 正则 |
| Surge | 同上 |
| Loon | `[Remote Filter] ..._Filter = NameRegex, FilterKey = "(?i)..."` |
| Quantumult X | `[policy] url-latency-benchmark=..., server-tag-regex=...` |
| SingBox Full | 静态 outbound 列表（无运行时分类，用户按 tag 接入节点） |
| v2rayN Xray routing | 路由规则（无节点分类） |
| Passwall / Passwall2 | 静态 shunt_rules（无运行时节点分类；按 UCI list 顺序匹配） |

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



---

## 2. 每次修改都必须严格审查并学习对应 APP 的官方文档 ⚠️

> 口头说「已兼容」无效。必须**提供链接或官方字段名引用**作为兼容性证据。

### 2.1 强制审查的官方文档清单

| 产物 | 必读官方文档 |
|------|--------------|
| Clash Party JS | https://wiki.metacubex.one/ · https://wiki.metacubex.one/config/ · Mihomo Smart 内核（`lgbm-custom-url` 字段、`uselightgbm`、`include-all-proxies`） |
| CMFA YAML | https://wiki.metacubex.one/config/proxy-groups · https://wiki.metacubex.one/config/dns · CMFA README（GitHub `MetaCubeX/ClashMetaForAndroid`） |
| OpenClash（Normal + Smart）| https://github.com/vernesong/OpenClash/wiki · OpenClash 覆写脚本官方模板 · UCI 配置键 |
| Shadowrocket | https://help.shadowrocket.net/ · `policy-regex-filter` / `RULE-SET` / `fallback-dns-server` 的官方文档或社区权威说明 |
| SingBox（Full）| https://sing-box.sagernet.org/configuration/ · 特别是 `route.rule_set`、`outbounds/selector`、`outbounds/urltest`、`dns`、`inbounds.tun`、`experimental.cache_file` |
| Passwall / Passwall2 | https://github.com/Openwrt-Passwall/openwrt-passwall · https://github.com/Openwrt-Passwall/openwrt-passwall2 · 特别要读 `luci-app-passwall*/luasrc/model/cbi/passwall*/client/shunt_rules.lua`（分流规则解析器源码） · [Discussion #555](https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555)（定位差异） |

### 2.2 必做的兼容性核对步骤

改动涉及新字段或跨版本字段时，**必须**：

1. **字段存在性核对**：在目标 APP 的官方文档里定位该字段，确认拼写、层级、取值范围。
2. **版本兼容性核对**：确认该字段在目标 APP 的**最低支持版本**，并与子目录 `README.md` 中声明的最低版本一致。
   - 例：sing-box 1.11+ 已用 `action` + `outbound` 替代旧 `outbound` 直接绑定；改动必须符合当前目标内核。
   - 例：mihomo Smart 内核的 `uselightgbm` 属于 Alpha 分支能力，不能下放到稳定分支的 Clash 核心。
3. **格式核对**：
   - Clash YAML：`rule-providers` 的 `behavior` ∈ {`domain`, `ipcidr`, `classical`}；`format` ∈ {`yaml`, `text`, `mrs`}。
   - Shadowrocket：`RULE-SET,<url>,<policy>` 不支持 `rule-provider` 节。策略名里的 emoji **必须与组定义完全一致**（含 ZWJ `\u200D`）。
   - sing-box：`rule_set` 的 `format` ∈ {`binary`, `source`}；`.srs` 必须配 `binary`。
4. **PR 描述里粘贴官方文档锚点**（URL + 字段名），审阅者可一键验证。

### 2.3 禁止事项

- ❌ 禁止凭记忆、训练数据或"经验"判定字段兼容性。
- ❌ 禁止把一份 APP 的语法（例如 Clash classical）直接复制到另一份（例如 sing-box）。
- ❌ 禁止使用已被官方标记 deprecated 的字段，除非有对应客户端版本兜底说明。
- ❌ 禁止在没有核对的情况下更改规则源（geosite.dat/geoip.dat）的 URL 或 release 分支。

---

## 3. 跨平台一致性矩阵（强制对齐项）

### 3.1 代理组命名（18 区域〔9 全部 + 9 家宽〕 + 28 业务，共 46 组）

区域组名称（emoji 必须逐字节一致，包含 RGI 旗帜序列）：

```
🌍 全球节点 · 🏡 全球家宽 · 🇭🇰 香港节点 · 🏡 香港家宽 · 🇹🇼 台湾节点 · 🏡 台湾家宽
🇯🇵 日韩节点 · 🏡 日韩家宽 · 🌏 亚太节点 · 🏡 亚太家宽 · 🇺🇸 美国节点 · 🏡 美国家宽
🇪🇺 欧洲节点 · 🏡 欧洲家宽 · 🌎 美洲节点 · 🏡 美洲家宽 · 🌍 非洲节点 · 🏡 非洲家宽
```

业务组名称（顺序即 README 展示顺序）：

```
🤖 AI 服务 · 💰 加密货币 · 🏦 金融支付 · 📧 邮件服务 · 💬 即时通讯 · 📱 社交媒体
🧑‍💼 会议协作 · 📺 国内流媒体 · 📺 东南亚流媒体 · 🇺🇸 美国流媒体 · 🇭🇰 香港流媒体
🇹🇼 台湾流媒体 · 🇯🇵 日韩流媒体 · 🇪🇺 欧洲流媒体 · 🕹️ 国内游戏 · 🎮 国外游戏
🔍 搜索引擎 · 📟 开发者服务 · Ⓜ️ 微软服务 · 🍎 苹果服务 · 📥 下载更新
☁️ 云与CDN · 🛰️ BT/PT Tracker · 🏠 国内网站 · 🚫 受限网站 · 🌐 国外网站
🐟 漏网之鱼 · 🛑 广告拦截
```

**禁止**新增/删除/改名这 46 个组；若业务确有需要，必须先在 PR 描述里说明并先改 Clash Party 基线。

### 3.2 Rule-provider 下载代理（`RP_PROXY`）

- 基线（Clash Party v5.2.2 起）：`RP_PROXY = BIZ.GFW = '🚫 受限网站'`
- Clash 家族（CMFA / OpenClash Normal / OpenClash Smart）必须全部使用 `proxy: '🚫 受限网站'`。
- Shadowrocket 不走 rule-provider，自动由 App 更新，豁免。
- sing-box 通过 `route.rule_set` 远程拉取，其走的是全局默认出站，豁免。

> 历史债务：OpenClash Normal 之前用 `DIRECT`、CMFA 之前用 `☁️ 云与CDN`，已在本次对齐修复；任何未来改动**禁止回退**。

### 3.3 最终兜底（FINAL）

- Clash 家族：`MATCH,🐟 漏网之鱼`
- Shadowrocket：`FINAL,🐟 漏网之鱼,dns-failed`
- sing-box：`route.final: "🐟 漏网之鱼"`

### 3.4 广告拦截

所有版本的 `🛑 广告拦截` 组必须默认指向 `REJECT` / `block` / `action: reject`；第一条规则必须是广告拦截前置。

---

## 4. 发版与版本号规则

- Clash Party JS 顶部 VERSION 注释是**唯一主版本号**（目前 `v5.2.2`）。
- 其他 5 份产物使用同主版本号 + 平台后缀：
  - `v5.2.2-cmfa.X`、`v5.3.X-oc-normal`、`v5.2.2-oc-smart`、`v5.2.2-SR.X`、`v5.2.2-sing.X`
- 平台后缀内部可独立递增，但主版本号必须与 Clash Party 对齐；若不对齐，必须在对应子目录 `README.md` 开头标明原因。

---

## 5. 自检脚本（提交前必须本地跑一遍）

```bash
# 1) 数代理组数（必须为 28 业务组 + 18 区域组；sing-box 另加 1 个顶层节点选择）
#    CMFA：业务组用 "- name:"、区域组用 "- type: url-test" + 缩进 "  name:"，需两种模式
grep -cE "^- name: |^  name: " "Clash Meta For Android/CMFA(mihomo).yaml"  # 期望 46
#    OpenClash：28 业务组是静态 "- name:"；18 区域组由 Ruby make_smart_group() 动态生成，静态 grep 只能数到 28
grep -cE "^- name: " "OpenClash/OpenClash(mihomo).sh"                  # 期望 28（静态业务组）
grep -cE "^- name: " "OpenClash/OpenClash(mihomo-smart).sh"             # 期望 28（静态业务组）
grep -cE " = select,|= url-test," "Shadowrocket/Shadowrocket.conf"        # 期望 46
grep -cE " = select,|= url-test," "Surge/Surge.conf"                      # 期望 46
grep -cE " = select,|= url-test," "Loon/Loon.conf"                        # 期望 46
grep -cE "^(url-latency-benchmark|static)=" "Quantumult X/QuantumultX.conf"        # 期望 46
node -e "const d=JSON.parse(require('fs').readFileSync('SingBox/SingBox(sing-box)-full.json','utf8'));const n=d.outbounds.filter(o=>o.type==='selector'||o.type==='urltest').length;console.log(n);process.exit(n===47?0:1)"  # 期望 47

# 2) RP 代理字段
grep -c "proxy: DIRECT" "OpenClash/OpenClash(mihomo).sh"                    # 期望 0
grep -c "proxy: '☁️ 云与CDN'" "Clash Meta For Android/CMFA(mihomo).yaml"         # 期望 0
grep -c "proxy: '🚫 受限网站'" "Clash Meta For Android/CMFA(mihomo).yaml"        # 期望 ≥ 300
grep -c "proxy: 🚫 受限网站" "OpenClash/OpenClash(mihomo).sh"               # 期望 ≥ 130
grep -c "proxy: \"\\\\U0001F6AB 受限网站\"" "OpenClash/OpenClash(mihomo-smart).sh"  # 期望 ≥ 380

# 3) 禁止死引用（旗帜 emoji 与组名 emoji 必须匹配；忽略注释行）
grep -nE "^[^#].*🇸🇬 亚太节点" "Shadowrocket/Shadowrocket.conf"                  # 必须无输出
grep -nE "^[^#].*🎵 TikTok"   "Shadowrocket/Shadowrocket.conf"                  # 必须无输出

# 4) JSON 合法性（sing-box + v2rayN 路由；优先 node，备选 python3）
node -e "JSON.parse(require('fs').readFileSync('SingBox/SingBox(sing-box)-full.json','utf8'));console.log('SingBox JSON: VALID')"
node -e "const a=JSON.parse(require('fs').readFileSync('v2rayN/v2rayN(xray).json','utf8'));const m=a[0];console.log('v2rayN JSON: VALID, items:',a.length,'version:',m.remarks?.match(/v5\\.[0-9.]+/)?.[0])"

# 4b) OpenClash full 生成的 override YAML：必须只有 1 个 rule-providers + 1 个 rules 顶层键
#     （Ruby Psych 对重复顶层键 last-wins，会静默丢掉前面的全量内容——本仓库曾在此犯错）
awk '
  /^cat > "\$OVERRIDE_YAML" << .OVERRIDE_EOF./ { inblock=1; next }
  /^cat >> "\$OVERRIDE_YAML" << .OVERRIDE_EOF./ { inblock=1; next }
  /^OVERRIDE_EOF$/ { inblock=0; next }
  inblock { print }
' "OpenClash/OpenClash(mihomo-smart).sh" > /tmp/oc_full_override_probe.yaml
grep -cE "^rule-providers:$" /tmp/oc_full_override_probe.yaml   # 期望 1
grep -cE "^rules:$" /tmp/oc_full_override_probe.yaml             # 期望 1
ruby -ryaml -e '
  d = YAML.load_file("/tmp/oc_full_override_probe.yaml", permitted_classes: [Symbol], aliases: true)
  raise "providers < 380" if (d["rule-providers"] || {}).size < 380   # full 期望 ≈384
  raise "rules    < 900" if (d["rules"]         || []).size < 900     # full 期望 ≈975
  puts "OC full override yaml: providers=#{d["rule-providers"].size} rules=#{d["rules"].size}"
'

# 5) YAML 合法性（可选，需 pyyaml 或 node）
node -e "const yaml=require('yaml'||'js-yaml');console.log('YAML parse: OK')" 2>/dev/null || echo "跳过 YAML 校验（无 yaml 模块）"
```

若任一检查失败，PR 不得合入。

---

## 6. 修改流程（推荐）

```
① 读 Clash Party JS（基线）→ 搞清楚要改什么
② 读目标 APP 官方文档 → 确认新字段/新组在每个产物上的等价写法
③ 改 Clash Party JS → 主线先落地
④ 同步 CMFA → OpenClash(Normal+Smart) → Shadowrocket → SingBox Full
⑤ 跑 §5 自检命令
⑥ 更新根 README.md + 各子目录 README.md
⑦ PR 描述里写：改动摘要 / 影响矩阵 / 官方文档链接 / 自检输出
```

---

## 7. 底线

- 不同步 = 违规。
- 不核对官方文档 = 违规。
- 删除/改名 46 个代理组之一而未在 PR 说明里论证 = 违规。
- 伪造「已兼容」结论（没有引用官方文档就下结论）= 违规。

> 这些约束是仓库长期可维护性的前提，优先级高于任何「小修快改」的便利。
