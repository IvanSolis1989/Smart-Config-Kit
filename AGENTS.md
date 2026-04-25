# AGENTS.md — 多代理协作契约

> 本文件与 `CLAUDE.md` 是**同一套规则的孪生副本**，面向所有 AI 代理（Claude Code / Codex / Copilot / Gemini / Cursor / 其他自动化工具）。
> **任何在本仓库执行修改的代理，无论身份，开始工作前必须先完整读取 `CLAUDE.md` 与本文件。**
> 若两份文件描述冲突（例如未来分支修改），以 `CLAUDE.md` 为准。

---

## 1. 为什么需要这份文件

Smart-Config-Kit 同时发布 **11 种客户端形态的等价产物**（分属 12 个产物目录）。它们必须在语义上一致，但语法完全不同：

- Mihomo JS 覆写（Clash Party，**基线**）
- Mihomo YAML（CMFA）
- OpenClash heredoc shell（Normal / Smart）
- Shadowrocket `.conf`（iOS SR 私有格式）
- sing-box JSON（Full）
- v2rayN Xray 路由 JSON（Windows 桌面，仅 Xray 核心兜底；mihomo/sing-box 核心直接复用上面 CMFA/SingBox 产物，不是独立产物）
- Surge `.conf`（iOS / macOS 付费正版；与 SR 语法 ~90% 兼容）
- Loon `.conf`（iOS 付费正版；兼容 Surge 风格但 [General] 字段不同）
- Quantumult X `.conf`（iOS 付费正版；自家 `[policy]` / `[filter_remote]` / `[filter_local]` 结构）
- Passwall（OpenWrt 全功能 LuCI；四列表 + shunt_rules + ACL 三层）
- Passwall2（OpenWrt 精简分流 LuCI；仅 shunt_rules；与 Passwall 规则语法同源、`.list` 互通）

另有间接覆盖的客户端不单独出产物：
- **Hiddify**：内核即 sing-box，消费 `SingBox/SingBox(sing-box)-full.json`；见 `SingBox/README.md §2a`
- **HomeProxy**（OpenWrt 官方 sing-box LuCI）：消费 `SingBox/SingBox(sing-box)-full.json`；见 `SingBox/README.md §2b`
- **ShellClash / ShellCrash**（OpenWrt 下的 mihomo 部署脚本）：复用 `Clash Meta For Android/CMFA(mihomo).yaml` 或 `OpenClash/OpenClash(mihomo).sh` 的 heredoc YAML
- **v2rayN（mihomo/sing-box 模式）**：直接消费 CMFA YAML 或 SingBox Full JSON

有 **降级产物** 的客户端（功能受限但可用）：
- **Passwall / Passwall2**：底层走 xray/sing-box，支持 geosite/geoip/rule_set 规则匹配，但没有 mihomo 的 proxy-groups 嵌套选择器。本仓库提供两个独立参考目录：`Passwall/`（全功能版）和 `Passwall2/`（精简分流版），各自含 28 条展平 shunt rule。两者规则语法完全相同（共用 `shunt_rules.lua` 解析器），`.list` 文件互通。想要完整体验的用户应迁移到 OpenClash。

显式不支持的客户端：
- **SSR Plus+**：架构老旧 + 已停止维护，没有 geosite/rule_set 层能力；建议用户迁移到 OpenClash

任何一份被改动而其余不同步，都会造成：
- 用户同一账户在不同设备看到不一致的分流结果；
- 规则源升级后某端因未同步而持续 404；
- PR 合入后线上用户回退痛苦。

因此本仓库 **不允许** 任何代理只改其中一份产物就提交。

---

## 2. 每次改动的两条硬约束

### 约束 A：所有版本联动

对「规则、策略组、DNS、嗅探、GeoX、LightGBM、rule-provider」的任何修改，代理必须：

1. **先改 Clash Party 主线** `Clash Party/ClashParty(mihomo-smart).js`
2. **再同步到其余 11 份产物**：
   - `Clash Meta For Android/CMFA(mihomo).yaml`
   - `OpenClash/OpenClash(mihomo).sh`（Normal）
   - `OpenClash/OpenClash(mihomo-smart).sh`（Smart）
   - `Shadowrocket/Shadowrocket.conf`
   - `SingBox/SingBox(sing-box)-full.json`（通过 `node SingBox/SingBox(sing-box)-generator.js` **重新生成**，禁止手工改）
   - `v2rayN/v2rayN(xray).json`（仅当业务组/规则类别变化时才需动；纯区域选优/LightGBM 调整可豁免，但需在 PR 里明确说明豁免原因）
   - `Surge/Surge.conf`（跟随 Shadowrocket 的规则变化；DNS/MMDB 字段独立维护）
   - `Loon/Loon.conf`（跟随 Surge；[General] 字段对齐 Loon 原生）
   - `Quantumult X/QuantumultX.conf`（可由等价脚本 `srk_to_qx.py` 从 Shadowrocket 重新生成）
   - `Passwall/Passwall(xray+sing-box)-apply.sh` + `Passwall/shunt-rules/*.list`（展平降级参考；仅当业务组/规则类别变化时需同步；与 Passwall2 联动）
   - `Passwall2/Passwall2(xray+sing-box)-apply.sh` + `Passwall2/shunt-rules/*.list`（同上；与 Passwall 联动）
3. **bump 产物文件头部版本号**（仅版本号 + Build 日期 + 一行摘要，保持轻量）。
4. **在对应 `<子目录>/CHANGELOG.md` 顶部追加一节**（详见 `CLAUDE.md §1.3`）——变更详情写这里，不再塞回产物文件头部。版本号必须与 Clash Party 主线对齐。
5. **同步更新** 根 `README.md` + 对应子目录 `README.md`（子目录教程文件已统一命名为 `README.md`，GitHub 会自动渲染在文件列表下方）
6. **跑完 `CLAUDE.md` §5 自检命令**，结果附在 PR 描述里

若某一产物确实不适用，**必须在 PR 描述中逐项说明为什么不同步**；不允许沉默跳过。

#### 约束 A 补丁 — 同构 bug 全产物审计（自 v5.2.6 起强制）

只要修复命中以下任一**运行时逻辑点**，即使本次 bug 只在一份产物里显式报告，也**必须**对全部 12 份产物做同构审计：

1. **节点名 → 区域分类**（`REGION_DB` / `REGIONS` / mihomo `filter:` / SR `policy-regex-filter` / Loon `NameRegex FilterKey` / QX `server-tag-regex`）
2. **区域组 fallback 链**（空区域回落到 `apacNodes` / `c.ALL` / 全局组）
3. **订阅原生 proxy-groups 合并 / 清理**（JS `cleanupSubscription` / Ruby `config["proxy-groups"] = ...` 重建）
4. **节点过滤 / `exclude-filter` / `INFO_PATTERNS`**

审计最小步骤（每条 bug 一次，**不得跳过**）：

1. 列出当前触发 bug 的**样例输入**（如 "TWN 01 AnyRoute IEPL x2.5"）。
2. 逐个打开 12 份产物的对应位置，对样例输入**做一次心算或小脚本回归**。
3. 任何一份命中同构漏洞 → 本 PR 必须同步修复。
4. 任何一份**结构上**不存在该逻辑点（如 SingBox 静态 outbound）→ 在 CHANGELOG + PR 描述里写清楚"不适用"理由。
5. 在 PR 描述里放一张 12×1 审计矩阵表（产物 × 是否受影响 / 是否已修）。

⚠️ **关键陷阱：正则语义差异**。同一个字符串，不同产物判定结果可能不同：
- **JS (Clash Party)**: word-boundary regex `(^|[^a-zA-Z])TW([^a-zA-Z]|$)` → `TW` **不**匹配 `TWN`
- **mihomo / Go RE2 (CMFA / OpenClash YAML)**: 子串匹配 → `TW` 匹配 `TWN`，但 `KR` **不**匹配 `KOR`
- **Ruby (OpenClash 脚本)**: 子串匹配，同 mihomo
- **Shadowrocket / Surge / Loon / QX**: 罗列字面量，必须显式列出每个 alpha-3

**禁止**：凭"运行时逻辑只在 JS 里有"/"静态配置文件不可能有此 bug"等直觉跳过审计。历史教训：v5.2.5 FIX#24~#26 曾被误判为 Clash Party JS 专属，实际波及 4 份产物（见 v5.2.6 补丁）。

### 约束 B：严格审查对应 APP 官方文档

禁止凭记忆或训练数据判断字段兼容性。每次改动涉及新字段时，代理必须：

1. 打开并引用对应 APP 的官方文档链接（最小集合见 `CLAUDE.md` §2.1）
2. 核对字段存在性 / 最低支持版本 / 取值范围 / 当前是否 deprecated
3. **在 PR 描述中引用文档锚点**（URL + 字段名），便于审阅者一键验证

任何「我认为 sing-box 支持这个字段」「Shadowrocket 应该兼容」都是**不可接受**的表述，必须改为文档出处的引用。

---

## 3. 跨代理协作约定

### 3.1 代理身份识别

- Claude Code 会在提交中带 `https://claude.ai/code/...` trailer。
- Codex / Copilot 等若无类似 trailer，请在 commit message 里自行标注 `[agent: <name>]`。
- Human 手工修改无需标注，但触发 §2 全版本联动时仍需遵守。

### 3.2 冲突处理

- 若另一个代理已在并行 PR 中修改同一区域，**不得**强行 force-push 覆盖；请：
  1. 在 PR 中评论声明意图；
  2. 拉取对方分支 rebase；
  3. 无法合并时由 maintainer 仲裁。

### 3.3 可变与不可变文件

**不可变（改动前必须征得 maintainer 同意）：**
- `Clash Party/ClashParty(mihomo-smart).js` 中 `SMART` / `BIZ` 常量定义（§4.1 的 46 组命名：18 区域 + 28 业务）
- `SingBox/SingBox(sing-box)-generator.js` 的生成策略
- `CLAUDE.md` / `AGENTS.md`

**可变（在约束 A/B 下可自由修改）：**
- rule-providers 列表增删
- 规则条目顺序调优
- 各子目录 `README.md` 文档优化
- 版本号递增

---

## 4. 与 `CLAUDE.md` 的协同

- `CLAUDE.md` 是**详细版本**：包含组名清单、官方文档链接、自检命令、提交前检查单、**§3.5 平台特有语法陷阱速查表**。
- `AGENTS.md` 是**摘要版本**：面向首次接触本仓库的代理，强调两条硬约束与协作规范。
- **两份都必须读**。代理在首次工作前必须：
  1. 读 `CLAUDE.md` 全文（特别注意 **§3.5 单平台语法陷阱**——每条都对应过真实导入失败）
  2. 读 `AGENTS.md` 全文
  3. 必要时读对应平台子目录的 `README.md`（了解用户侧语义）

> **强制反射动作**：当本次改动是「跨产物联动同一字段」（如 DNS、规则前缀、节点过滤正则）时，
> **先打开 `CLAUDE.md §3.5` 对应小节核对**该字段在每个产物上的合法写法，再动手改。
> 凭"应该是一样的"复制粘贴是本仓库导入失败的最大单一来源。

---

## 5. 验收门（PR 必须同时满足）

- [ ] Clash Party JS 主线已改 / 明确说明本次无需改
- [ ] 全部 12 份产物同步 / 明确说明某产物为何不需改
- [ ] **每个被动过的产物文件头已 bump 版本号 + Build 日期**（保持轻量：只改版本行，不加大段变更历史）
- [ ] **对应 `<子目录>/CHANGELOG.md` 顶部已追加一节**（至少 1 行摘要 + 必要时细节子条目；禁止把详细变更塞回产物文件头）
- [ ] 根 `README.md` + 对应子目录 `README.md` 已更新
- [ ] `CLAUDE.md §5` 自检命令全部通过（输出贴在 PR 描述）
- [ ] PR 描述引用了所有涉及 APP 的**官方文档锚点**
- [ ] 代理组数仍为 46（18 区域〔9 全部 + 9 家宽〕 + 28 业务），未新增/删除/改名
- [ ] 规则-provider 下载代理仍为 `🚫 受限网站`（Shadowrocket / sing-box 例外）
- [ ] sing-box full 产物是通过 `node SingBox/SingBox(sing-box)-generator.js` **重新生成**的

未全部打勾 → 不得合入。

---

## 6. 常见错误模式（禁止复现）

| 错误 | 历史出处 | 为什么错 | 正确做法 |
|------|---------|---------|---------|
| OpenClash Normal 的 `rule-providers.proxy: DIRECT` | v5.3.1-oc-normal 之前 | 墙内无法直连 jsdelivr / GitHub，规则下载失败 | 全部改 `proxy: 🚫 受限网站` |
| CMFA 的 `rule-providers.proxy: '☁️ 云与CDN'` | v5.2.0-cmfa 之前 | 与 Clash Party FIX#17-P0 不一致，墙内同样失败 | 改 `proxy: '🚫 受限网站'` |
| Shadowrocket 多出 `🎵 TikTok` 组 | v5.2.2-SR.1 | 基线只有 28 业务组，TikTok 应归 `📱 社交媒体` | 删组，规则目标改 `📱 社交媒体` |
| Shadowrocket 引用 `🇸🇬 亚太节点` | v5.2.2-SR.1 | 实际组名是 `🌏 亚太节点`，引用不存在，SR 会静默忽略该候选 | 统一使用 `🌏 亚太节点` |
| 改代码但忘了 bump 版本号或加 CHANGELOG 条目 | 多次 | 历史追溯失效，后续代理无法判断当前主线是哪个版本 | 每次修改必须 bump 尾段版本 + 在对应 `<子目录>/CHANGELOG.md` 顶部追加一节 |
| 把详细变更日志塞回产物文件头 | 历史版本 v5.2.3 及之前 | 配置文件头被大段注释淹没；README + CHANGELOG + 代码三处不同步 | 自 v5.2.4 起：变更详情只写 `<子目录>/CHANGELOG.md`，配置文件头只保留版本号 + 一行架构声明 + 指向 CHANGELOG 的引用 |
| 单边改 Clash Party JS 不同步其他产物 | 多次 | 用户同一账号跨设备策略不一致 | 全端联动 |
| 凭训练数据说「sing-box 支持某字段」 | 潜在 | 版本字段频繁变更（1.11 重构 route action） | 必须引用 sing-box.sagernet.org 官方文档 |
| QX `[dns] server=https://doh.pub/dns-query` | v5.2.10-QX.2 | QX `server=` 仅接受 IP / IP:port / `/域名/IP`，DoH URL 必须用独立 `doh-server=` 字段，否则导入报"line N 配置文件语法错误" | 改 `doh-server=https://...`；详见 `CLAUDE.md §3.5.1` |
| QX `running_mode_trigger=filter, filter, auto` | v5.2.10-QX.1 | `filter` 不是合法值；合法值仅 `direct`/`proxy`/`auto`/`follower`/`none` | 改 `auto, auto, auto`；详见 `CLAUDE.md §3.5.4` |
| Loon `[Rule] DST-PORT,...` | v5.2.10-Loon.1 | Loon 是端口规则前缀的唯一异类（其他全用 `DST-PORT`），其解析器对 `DST-` 报错 | 改 `DEST-PORT,...`；详见 `CLAUDE.md §3.5.2` |
| 把 Surge `encrypted-dns-server=` 直接复制到 Loon / SR | 潜在 | Loon/QX 用 `doh-server=`、SR 用同一 `dns-server=`，三家字段不同 | 查 `CLAUDE.md §3.5.1` 表对应字段名 |
| 把 Clash `DOMAIN-SUFFIX,` 复制到 Passwall `.list` | 潜在 | Passwall shunt_rules.lua 不识别 Clash 前缀 | 改 `domain:` / `full:` / `regexp:` / `geosite:` 等；详见 `CLAUDE.md §3.5.2` |
| 假设单平台 bug 修复无需联动 | v5.2.5 FIX#24~#26 | 误判为 JS 专属，实际波及 4 份产物（CMFA/OC Normal/OC Smart/JS） | 任何运行时逻辑 bug 必须按 §1.5 同构审计 12 份产物 |

---

## 7. 底线重申

**不同步 = 违规。**
**不核对官方文档 = 违规。**
**改 46 个代理组命名但未在 PR 中论证 = 违规。**

> 本仓库的长期可维护性依赖这份契约被所有代理严格遵守。
