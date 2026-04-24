# Passwall — 变更日志

> `Passwall/` 目录的变更日志（Passwall 全功能版专属参考；四列表 + shunt_rules + ACL 三层架构）。
> 与 `Passwall2/` 目录（精简分流版参考）内容互通——两者共用 `shunt_rules.lua` 解析器，同一份 `.list` 互通。
> 本目录提供把 Clash Party 两层结构（业务组 → 区域组）**手工展平**为 28 条 shunt rule 的降级参考。
> 主版本号跟随 Clash Party 主线；尾段 `-pw.N` 独立递增。

---

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
