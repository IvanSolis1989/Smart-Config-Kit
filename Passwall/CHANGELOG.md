# Passwall — 变更日志

> `Passwall/` 目录的变更日志（Passwall 全功能版专属参考；四列表 + shunt_rules + ACL 三层架构）。
> 与 `Passwall2/` 目录（精简分流版参考）内容互通——两者共用 `shunt_rules.lua` 解析器，同一份 `.list` 互通。
> 本目录提供把 Clash Party 两层结构（业务组 → 区域组）**手工展平**为 28 条 shunt rule 的降级参考。
> 主版本号跟随 Clash Party 主线；尾段 `-pw.N` 独立递增。

---

## v5.2.8-pw.4 (2026-04-24) — ★ 广告拦截规则置顶 + `apply.sh` 路径加引号

审查 Codex 针对 `Passwall/` 的两条建议，两条均确认为真实问题，本次一并修复：

- ★ **FIX#CODEX-1（P1，命中 CLAUDE.md §3.4 契约违反）**：把 🛑 广告拦截从规则链末尾（`#28`）前移到规则链首位（`#01`），其余 27 条规则顺序整体下移一位。
  - 背景：CLAUDE.md §3.4 明确约束"第一条规则必须是广告拦截前置"；本目录先前的 `[01] 🤖 AI 服务 … [28] 🛑 广告拦截` 顺序与该契约直接冲突。
  - 运行时影响：Passwall shunt_rules 解析器（`shunt_rules.lua`）按 UCI list 顺序自上而下匹配；在 `🐟 漏网之鱼 FINAL`（本目录实现为 `domain_list` 留空 + 网络 tcp/udp）之前先命中其他任意规则才会走到 `广告拦截`。虽然本目录的 FINAL 块没有 domain_list（严格说不会 catch-all），但为对齐 CLAUDE.md §3.4 + 避免任何未来 FINAL 实现形式的歧义，把广告拦截置顶。
  - 同步修复的文件：
    - `Passwall(xray+sing-box)-apply.sh` — 28 个 `# [NN]` 块整体重编号，`uci commit` 之前的 echo 提示从"#24-#28 保持末尾"改为"#01 广告拦截在最前；#25-#28（国内/受限/国外/FINAL）保持末尾"
    - `Passwall(xray+sing-box).conf` — 28 个 banner 块重编号，`slug    : NN-xxx` 字段同步更新
    - `shunt-rules/*.list` — 28 个 `.list` 文件名整体重编号（`28-ads.list` → `01-ads.list`，`01-ai-service.list` → `02-ai-service.list`，…，`27-final.list` → `28-final.list`）
    - `README.md` — `### 1️⃣ … 2️⃣8️⃣` 的 28 个小节表头同步重编号；参考文件名示例从 `01-ai-service.list / 06-social.list` 改为 `02-ai-service.list / 07-social.list`；开篇的"第 24-28 条顺序很关键"改写为"第 1 条必须是 🛑 广告拦截，否则会被后续规则吞掉；第 25-28 条保持末尾"
- ★ **FIX#CODEX-2（P2，shell 元字符逃逸）**：`README.md` 中 `sh Passwall(xray+sing-box)-apply.sh` 的调用示例全部改为 `sh 'Passwall(xray+sing-box)-apply.sh'`（加单引号）。`(` 和 `)` 是 shell 保留字符，原写法用户复制粘贴后会报 `syntax error near unexpected token '('` 无法执行。脚本头部 20-23 行的使用说明早已是正确的加引号写法，本次只是把 README 的快速上手段落对齐到同一形式。

### 同构审计（按 CLAUDE.md §1.5）

本次修复涉及的运行时逻辑类型：**规则优先级 / 规则顺序**（不在 §1.5 列出的 5 类节点分类 / fallback / 订阅合并之内），但仍按触发条件 2「修改**规则条目的目标组**」+ 触发条件 3「修改**规则顺序**中影响命中优先级的段（特别是广告拦截、GFW、FINAL 前置关系）」联动审查：

| 产物 | 广告拦截规则位置 | 是否需要本次联动同步？ |
|------|------------------|--------------------------|
| Clash Party JS（基线） | `rules:` 段最前置（`RULE-SET, … , 🛑 广告拦截` 在第 3315 行附近，所有业务规则之前） | ✅ 已满足（基线正确） |
| CMFA YAML | 同上（与 JS 基线对齐） | ✅ 已满足 |
| OpenClash Normal / Smart | 同上（Ruby 生成的 rules 数组首段为 ad-block） | ✅ 已满足 |
| Shadowrocket / Surge / Loon / Quantumult X | `[Rule]` 段首条为 `RULE-SET, … , 🛑 广告拦截 / REJECT` | ✅ 已满足 |
| SingBox Full | `route.rules` 首条 `rule_set: [advertising, …]` | ✅ 已满足 |
| v2rayN Xray | `routing.rules` 首条指向 `block` outbound | ✅ 已满足 |
| **Passwall（本目录）** | 原 `#28`（末尾）— **违反 §3.4** | ✅ **本次修复 → `#01`** |
| **Passwall2** | 原 `#28`（末尾）— **同构漏洞** | ✅ **同步修复 → `#01`**（见 `Passwall2/CHANGELOG.md`） |

结论：这是 Passwall + Passwall2 的同构漏洞（§1.5 第 5 类 — 节点过滤/规则顺序），两者本 PR 同时修复。

### 主动放弃的 Codex 建议

- Codex 同时针对 `Clash Meta For Android/CMFA(mihomo).yaml` 提出"把 `https://1.12.12.12/dns-query` 改回 `https://doh.pub/dns-query`"的 P1 建议，本次**未采纳**。原因：
  - `1.12.12.12` 是全仓库 7 个产物（CMFA / OpenClash Normal / OpenClash Smart / Shadowrocket / Surge / Loon / Quantumult X）的一致 DNS 基线，不是 CMFA 单产物的回归
  - 单独修改 CMFA 会造成 7:1 不一致，违反 §1 全版本联动约束
  - 修改应在独立 PR 里整仓库同步讨论，不混入"修复 Passwall 广告拦截顺序"这一范畴内

## v5.2.8-pw.3 (2026-04-24) — ★ 版本号对齐 v5.2.8 基线

跟随 Clash Party v5.2.8 基线版本号对齐。本产物无功能性变更，因为：

| FIX# | 描述 | Passwall 影响 |
|------|------|--------------|
| #27 | 新建 `mirrors/` 目录，静默 classical provider 警告 | **N/A** — Passwall 无 rule-provider 概念（静态 shunt_rules 本地域名/IP 匹配） |
| #28 | APAC 区域分类扩展（HK/TW/JP/KR 并入 APAC；US 并入 AMERICAS） | **N/A** — Passwall 无运行时节点分类（用户的 geosite/geoip + UCI 节点列表，无自动归类） |
| #24-#26 | 节点名分类 / fallback / 订阅清理 | **N/A** — Passwall 无 proxy-groups 嵌套和订阅预处理 |

## v5.2.6-pw.2 (2026-04-24) — ★ Passwall 专属目录初版

本次 PR 新建 `Passwall/` 独立目录，提供面向 Passwall 全功能版的 28 条 shunt rule 参考，与已有的 `Passwall2/` 目录内容互通但各有侧重。

### 新建内容

- ★ **新建 `Passwall/` 目录**，包含以下文件：
  - `Passwall(xray+sing-box).conf` — 28 条规则单文件合并参考
  - `Passwall(xray+sing-box)-apply.sh` — UCI 批量脚本（`CONFIG_NAME="passwall"`）
  - `shunt-rules/01-ai-service.list` ~ `28-ads.list` — 28 个独立 `.list` 文件
  - `README.md` — Passwall 专属使用教程
  - `CHANGELOG.md` — 本文件

### Passwall 专有差异化

- ★ **选型指南**：新增 Passwall vs Passwall2 对比表，帮助用户决定用哪个插件
- ★ **四列表系统说明**：文档化 `use_direct_list` / `use_proxy_list` / `use_block_list` / `use_gfw_list` 四开关的用法，以及四列表 + shunt rule 组合使用的最佳实践
- ★ **TCP/UDP 节点分选**：说明 `tcp_node` / `udp_node` 分开选择的场景（国内游戏 UDP 直连、BT DHT 等）
- ★ **ACL 规则**：文档化按客户端 IP/MAC 的策略隔离能力
- ★ **trojan-plus 节点**：标注 Passwall 对 `trojan-plus` 类型的专属支持（Passwall2 不支持）
- ★ **apply.sh 注释**：标注 `tcp_node` 字段（Passwall 使用 `tcp_node`，Passwall2 使用统一 `node`）
- ★ **尾部提示**：脚本完成时输出 Passwall 专属配置提示（四列表 / TCP-UDP 分选 / ACL）

### 与 Passwall2 的关系

- `.list` 文件内容与 `Passwall2/shunt-rules/` 完全同源（规则语法相同，`shunt_rules.lua` 解析器共享）
- `.sh` 脚本的区别仅在于 `CONFIG_NAME` 和字段注释（`tcp_node` vs `node`）
- README 各有侧重：Passwall 版强调四列表/ACL/TCP-UDP 分选；Passwall2 版强调纯 shunt rule 简洁性

### 对其他产物的联动评估（按 CLAUDE.md §1.5 同构审计）

本次新建 `Passwall/` 目录为纯文件新增，不涉及任何运行时逻辑 / 代理组名 / rule-provider / DNS 改动。其他 10 份产物不受影响。`.list` 内容的任何未来改动将同时在 `Passwall/` 和 `Passwall2/` 两个目录同步。

### 设计原则

- 规则语法：严格遵循 `shunt_rules.lua` 官方源码（`geosite:` / `domain:` / `geoip:` 等前缀），拒绝 Clash 语法混入
- 与 Clash Party 基线对齐：28 条规则对应 28 个业务组，语义一致
- 顺序约束：#24（国内）→ #25（受限）→ #26（国外）→ #27（FINAL）→ #28（广告）保持末尾
- 三种交付形式适应不同用户水平（手工粘贴 / 单文件参考 / SSH 脚本批导）

### 根 README + CLAUDE.md 同步（后续 PR）

- `CLAUDE.md` §0 表格需新增 `Passwall` 条目行
- 根 `README.md` 目录说明需新增 `Passwall/` 引用

---

## 维护同步策略

当 Clash Party 主线有规则/组/业务调整（典型场景：新增/删除业务组、rule-provider 变动）时，`Passwall/` 和 `Passwall2/` 两个目录需**同时同步**：

1. 新增业务组 → 两个目录各加一节 shunt rule + 对应 `.list` 文件
2. 删除业务组 → 两个目录各删除对应节 + `.list` 文件
3. 业务组内新增域名 → 两个目录的对应 `.list` + `.conf` + `.sh` 同步更新

**豁免**：Clash Party 的纯 region/LightGBM 调整（如 `uselightgbm` 参数微调、Smart 组 url-test interval 变化）**不需要**同步——这些 Passwall 架构无法表达，见 CLAUDE.md §1.4「允许的不同步例外」。
