# Surge — 变更日志

> `Surge/surge-smart.conf` 的变更日志。主版本号跟随 Clash Party 主线；尾段 `-Surge.N` 独立递增。

---

## v5.2.5-Surge.2 (2026-04-22) — 移除 72 条 Clash YAML + anti-AD CDN + 版本对齐

与 Loon v5.2.4-Loon.2 / .3 同批"Clash Party v5.2.4 基线遗毒"。Surge manual 明确 RULE-SET
期望 **"text file, each line containing a rule declaration"**（[manual.nssurge.com/rule/ruleset.html](https://manual.nssurge.com/rule/ruleset.html)），
Clash classical YAML 的 `payload: \n - DOMAIN-SUFFIX,x` 格式不符合该定义，**Surge 会沉默加载为空**。

### 改动

- ★ FIX#Surge-01-P1：**删除 72 条 Clash classical `.yaml` RULE-SET**（71 Accademia + 1 ACL4SSR Zoom.yaml）
  - Surge `RULE-SET` 期望纯文本每行一条规则；YAML `payload:` 前缀格式不识别，整个规则集静默失效
- ★ FIX#Surge-02-P1：`anti-ad.net/surge.txt` → `fastly.jsdelivr.net/gh/privacy-protection-tools/anti-AD@master/anti-ad-surge.txt`
  - Loon v5.2.4-Loon.3 已实锤：anti-ad.net 无 CDN，国内 ISP DNS 劫持返回 HTML，Surge 同样会把 HTML 当规则解析失败
- ★ FIX#Surge-03-P1：72 条 yaml 删除后的关键域名补 DOMAIN-SUFFIX 兜底：
  - 🏦 金融支付：Monzo / N26 / Chime + 24 国际银行（Chase / BofA / HSBC / Barclays / DBS / MUFG / RBC / ANZ 等）
  - 🧑‍💼 会议协作：Zoom × 5 / RustDesk / Parsec × 3
  - 🌐 国外网站：Wayback Machine / Pornhub × 3
- ★ FIX#Surge-04-P2：清理 15 行孤立的 `# Accademia xxx` section 注释（原 yaml 段已删）
- ★ FIX#Surge-05-P2：**主版本号对齐** `v5.2.3-Surge.1` → **`v5.2.5-Surge.2`**（Clash Party JS `VERSION='v5.2.5'`）
- ★ Build `2026-04-20` → `2026-04-22`；头部架构 `250+ RULE-SET` → `~290 RULE-SET`

### 保留项（Surge 官方支持，与 Loon 不同）

深度审查发现有 agent 误把下列 Surge 原生字段当成 Loon 专属。经官方文档核实**全部保留**：

- `FINAL,🐟 漏网之鱼,dns-failed` ✓（[Surge manual rules](https://manual.nssurge.com/rule/summary.html)：DNS 失败时的兜底，Surge 独有特性）
- `bypass-system`、`tun-excluded-routes`、`hijack-dns`、`udp-policy-not-supported-behaviour` ✓（[misc-options](https://manual.nssurge.com/others/misc-options.html) 原生字段）
- Sukka `List/domainset/reject_phishing.conf` ✓（Surge 原生支持 DOMAIN-SET 格式；Loon/QX 要换 `non_ip/`，但 Surge 不用改）
- `encrypted-dns-server` / `geoip-maxmind-url` / `read-etc-hosts` / `exclude-simple-hostnames` ✓（Surge 独有字段）

### 自检

- 代理组 37 个 ✓
- `.yaml,` RULE-SET 残留：0 条 ✓
- `anti-ad.net` 残留：0 次 ✓
- `FINAL,...,dns-failed` 保留：1 次 ✓（Surge 原生支持）
- 行数：1391 → 1348（净 -43；删除 72 yaml + 15 孤立注释，补入 ~40 条 DOMAIN-SUFFIX 兜底）

### 已接受的回归损失

与 Loon / SR / QX 一致：Accademia `Bank × 10 国家级` / `FakeLocation × 10` / `GeoRouting × 17 区域` / `eMuleServer` / `HomeIP` 没有 `.list` 等价源；关键域名已补兜底。完整覆盖请换 CMFA / OpenClash / SingBox。

### 官方文档证据

- [Surge Ruleset manual](https://manual.nssurge.com/rule/ruleset.html)：ruleset file = "text file, each line containing a rule declaration"（不是 YAML）
- [Surge misc-options](https://manual.nssurge.com/others/misc-options.html)：`bypass-system` / `tun-excluded-routes` / `hijack-dns` / `udp-policy-not-supported-behaviour` 原生支持
- [Surge DNS kb](https://kb.nssurge.com/surge-knowledge-base/technotes/dns)：`FINAL, policy, dns-failed` 原生支持

---

## v5.2.3-Surge.1 (2026-04-20) — 初版

- ★ 从 Shadowrocket v5.2.2-SR.2 迁移，保留 9 区域 url-test 组 + 28 业务 select 组 + ~930 条规则
- ★ 适配 Surge `[General]` 原生字段：
  - `encrypted-dns-server`（DoH 专用）
  - `geoip-maxmind-url`（配置文件里直接指定 MMDB，无需 UI 手动下载）
  - `disable-geoip-db-auto-update`
  - `read-etc-hosts`（读取系统 hosts）
- ★ 删除 SR 专有 / 无效字段：
  - `private-ip-answer`
  - `dns-direct-fallback-proxy`
  - `proxy-dns-server`
  - `fallback-dns-server`（Surge 用 `encrypted-dns-server` + `dns-server` 统一管理）
- ★ `FINAL,🐟 漏网之鱼,dns-failed`（Surge 风格 FINAL，带 `dns-failed` 兜底）

### 与 Clash Party 主线的差异（Surge 引擎限制）

- 无 PROCESS-NAME（Surge Mac 支持，iOS 不支持 → 已统一删除以保持跨平台）
- 无 Smart 组 + LightGBM（Surge 核心不是 Mihomo）
- 无 TLS 指纹注入 fpByPurpose（Surge 不暴露 uTLS 控制）
- 无 GEOSITE（Surge 用 RULE-SET + 内置 MMDB；GEOIP 精准标签依赖 MMDB 替换）
- 无 rule-provider 独立调度（Surge 依赖 RULE-SET URL + 统一订阅自动更新）
