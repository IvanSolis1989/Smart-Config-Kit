# Loon — 变更日志

> `Loon/loon-smart.conf` 的变更日志。主版本号跟随 Clash Party 主线；尾段 `-Loon.N` 独立递增。

---

## v5.2.4-Loon.2 (2026-04-22) — Loon 原生语法兼容性大修

用户反馈"Loon 用不了好像 好多和配置文件冲突" — 复核后确认 v5.2.3-Loon.1 把
多处 Surge 语法直接搬进了 Loon（Loon 不识别 → 段/规则大面积沉默失效）。本版
以 YueChan/Loon、Loon0x00/LoonExampleConfig、fmz200/wool_scripts 三份权威
Loon 配置为对照，逐项对齐 Loon 官方字段。

### [General] 段字段对齐（P0）

- ★ FIX#Loon-01-P0：`tun-excluded-routes = ...` → **`bypass-tun = ...`**（Loon 官方字段）
- ★ FIX#Loon-02-P0：`dns-server` 剥离 DoH URL — DoH 必须放 `doh-server`，`dns-server`
  仅接受 `system` 与纯 IP（v5.2.3 把 `https://doh.pub/dns-query` 混进 dns-server 会被 Loon 丢弃）
- ★ FIX#Loon-03-P0：`ipv6-enabled = true` → **`ipv6 = true`**（Loon 原生字段名无 `-enabled` 后缀）
- ★ FIX#Loon-04-P0：`udp-policy-not-supported-behaviour = REJECT` → **`udp-fallback-mode = REJECT`**
- ★ FIX#Loon-05-P0：删除 `bypass-system = true`（Loon 无此字段，Surge 专属）
- ★ FIX#Loon-06-P0：删除 `hijack-dns = 8.8.8.8:53, 8.8.4.4:53`（Loon 无此字段）
- ★ FIX#Loon-07-P1：新增 `geoip-url = https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb`
  —— Loon 支持 `geoip-url`，v5.2.3 头部注释误称"Loon 不支持在配置里指定 MMDB"，现已纠正
  并自动化 MMDB 下载；不再需要 UI 手动操作

### [Remote Filter] + [Proxy Group] 结构性重构（P0）

- ★ FIX#Loon-08-P0：**新增 `[Remote Filter]` 段**，用 Loon 原生 `NameRegex + FilterKey`
  定义 9 个区域 Filter（GLOBAL / HK / TW / JPKR / APAC / US / EU / AM / AF），
  替代 Surge 的 url-test 内联 `policy-regex-filter=`（Loon 不识别该参数）
- ★ FIX#Loon-09-P0：9 个 url-test 组改为引用 Filter 名字（`= url-test,<Filter>,url=...,interval=600,tolerance=50`），
  同时删除 Loon 不支持的 `timeout=` 与 `select=0` 参数（此前整列区域组都被解析异常 → 区域聚合失效）

### [Rule] 段格式对齐（P0）

- ★ FIX#Loon-10-P0：**删除 72 条 Clash classical `.yaml` RULE-SET**（71 条 Accademia + 1 条 ACL4SSR Zoom.yaml）
  —— Loon 的 RULE-SET 仅解析 Surge/Loon `.list` 与 `.conf` 纯文本，YAML 直接报错或静默丢弃
- ★ FIX#Loon-11-P0：`IP-CIDR6,::1/128,...` × 3 → `IP-CIDR,::1/128,...`（Loon 只有 `IP-CIDR`，自动识别 IPv4/IPv6）
- ★ FIX#Loon-12-P0：`FINAL,🐟 漏网之鱼,dns-failed` → `FINAL,🐟 漏网之鱼`（Loon 不接 `dns-failed` 后缀，那是 Surge 专属）
- ★ FIX#Loon-13-P0：`ruleset.skk.moe/List/domainset/reject_phishing.conf`
  → `ruleset.skk.moe/List/non_ip/reject_phishing.conf`（Sukka `domainset/` 是 Surge 专属二级格式；
  `non_ip/` 是 Surge/Loon 通用 `.conf` 明文 RULE 列表）

### [Rule] 段兜底补丁（P1，最小化功能回归）

删除 72 条 Accademia YAML 后，大部分覆盖由 bm7 / szkane / sukka 吸收；少量 Accademia
专属业务补 DOMAIN-SUFFIX 兜底，避免关键域名掉到 FINAL：

- 🏦 金融支付：Monzo / N26 / Chime；主要国际银行 24 域名（Chase / BofA / WellsFargo /
  Citi / HSBC / Barclays / Lloyds / Santander / DB / ING / BNP / SG / OCBC / UOB /
  DBS / MUFG / SMBC / Mizuho / RBC / TD / Scotia / CBA / ANZ / Westpac）
- 🧑‍💼 会议协作：Zoom（5 域名）、RustDesk、Parsec（3 域名）
- 🌐 国外网站：Wayback Machine、Pornhub（3 域名）
- 已接受的回归损失：Accademia `FakeLocation × 10`（国内 APP IP 归属地伪装）、
  `GeoRouting × 17 区域`（国家/地区 ccTLD 细分）、`eMuleServer`、`HomeIP`
  —— 这些是 Clash classical 专属规则集，没有 Loon `.list` 等价源；
  如需完整覆盖请使用 CMFA / OpenClash / SingBox

### 头部 + 元信息

- ★ 版本号：`v5.2.3-Loon.1` → `v5.2.4-Loon.2`；主版本对齐 Clash Party v5.2.4
- ★ Build：2026-04-20 → 2026-04-22
- ★ 架构一句话：`9 区域 url-test 组（policy-regex-filter）` → `9 区域 url-test 组（[Remote Filter] NameRegex）`
- ★ 删除头部的"Loon 不支持配置文件指定 MMDB" 误导性警告；改为在 [General] 用 `geoip-url` 自动配置
- ★ 规则源说明：删除 `acc = Accademia/Additional_Rule_For_Clash`（已整体移除）

### 自检结果

- 代理组总数 37（9 url-test + 28 select）✓
- [Remote Filter] 定义 9 个 filter，与 9 个 url-test 引用一一匹配 ✓
- `.yaml` RULE-SET 残留 0 条 ✓
- `IP-CIDR6,` / `FINAL,...,dns-failed` / `policy-regex-filter=` / `bypass-system` /
  `tun-excluded-routes` / `ipv6-enabled` / `hijack-dns` / `udp-policy-not-supported-behaviour`
  均为 0 次出现 ✓
- `bypass-tun` / `ipv6 =` / `udp-fallback-mode` / `geoip-url` 各 1 次 ✓
- 总行数 1346（v5.2.3: 1383；删除 72 条 yaml + 加 ~40 条兜底 DOMAIN-SUFFIX，净减 37 行）

### 官方文档证据

- Loon 官方示例 Loon0x00/LoonExampleConfig `example.conf`（`bypass-tun` / `doh-server` / `dns-server = system,IP`）
- YueChan/Loon `Default.Conf`（`ipv6` / `udp-fallback-mode` / `geoip-url` / `ipasn-url`）
- fmz200/wool_scripts `Loon.conf`（`[Remote Filter]` NameRegex 8 区域定义；`FINAL` 无 dns-failed 后缀）
- TiyNa/LoonManual + chiupam/tutorial（`NameRegex, FilterKey = "regex"` 语法）

---

## v5.2.3-Loon.1 (2026-04-20) — 初版

- ★ 从 Surge v5.2.3-Surge.1 迁移，保留 9 区域 url-test 组 + 28 业务 select 组 + ~930 条规则
- ★ RULE-SET 仍放在 `[Rule]` 段内（Surge 兼容语法，Loon 原生支持）；未拆分到 `[Remote Rule]` 以最小化 diff 并保留和 Surge 版的可 diff 性
- ★ Loon `[General]` 原生字段：
  - `dns-server`（并发 DoH / 系统 DNS）+ `doh-server`（DoH 专用）
  - `skip-proxy`（私有网段 + 银行支付，避免 TUN 劫持）
  - `ipv6-enabled = true`
- ★ 删除 Surge 独有字段：
  - `geoip-maxmind-url`（Loon 需 UI 手动下载 MMDB，不支持配置文件指定）
  - `read-etc-hosts` / `exclude-simple-hostnames`（Surge Mac 专属）
  - `encrypted-dns-follow-outbound-mode`（Loon 无该开关）
  - `block-quic = all-proxy`（Loon 用 `disable-udp-ports` 替代）

### 与 Clash Party 主线的差异（Loon 引擎限制）

- 无 PROCESS-NAME（iOS 无进程 API）
- 无 Smart 组 + LightGBM（Loon 核心不是 Mihomo）
- 无 TLS 指纹注入 fpByPurpose（Loon 不暴露 uTLS 控制）
- 无 GEOSITE（Loon 用 RULE-SET + 内置 MMDB；GEOIP 精准标签依赖 MMDB 替换）
