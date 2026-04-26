# Surge — 变更日志

> `Surge/Surge.conf` 的变更日志。主版本号跟随 Clash Party 主线；尾段 `-Surge.N` 独立递增。

---


## v5.3.0-Surge.2 (2026-04-26)

- ★ FIX：bm7 规则源 URL 注释修正（`rule/Shadowrocket` → `rule/Surge`，复制粘贴错误）

## v5.3.0-Surge.1 (2026-04-26)

- ★ REFACTOR#2：流媒体分组架构重构——按区域 → 按平台（7→13 流媒体组）
  - 拆出 5 个主流平台独立组：🎥 Netflix / 🎬 Disney+ / 📡 HBO/Max / 📺 Hulu / 🎬 Prime Video
  - 拆出 2 个全球平台独立组：📹 YouTube / 🎵 音乐流媒体
  - 保留 4 个区域锁区组：🇭🇰 香港流媒体 / 🇹🇼 台湾流媒体 / 🇯🇵 日韩流媒体 / 🇪🇺 欧洲流媒体
  - 新增 🌐 其他国外流媒体 兜底（接收长尾平台 + 原东南亚流媒体）
  - 业务组 25→31，总组 43→49
## v5.2.11-Surge.1 (2026-04-26) — 业务组合并精简 28→25（降低用户认知负担）

- ★ **REFACTOR#1**：跟随 Clash Party v5.2.11 基线，业务组合并精简
  - 合并 🔍搜索引擎 + 📟开发者服务 → 新增 🔧工具与服务
  - 合并 📧邮件服务 → 🌐国外网站
  - 合并 ☁️云与CDN → 🌐国外网站
  - 📥下载更新 策略从 DIRECT 优先改为代理优先
  - 🛰️BT/PT Tracker 保留独立
- Bump: `v5.2.10-Surge.1` → `v5.2.11-Surge.1`

## v5.2.10-Surge.1 (2026-04-25) — 境外 DoH 端点改路由到 🚫 受限网站

- ★ **FIX#39**（同构联动）：跟随 Clash Party v5.2.10 基线
  - `DOMAIN,dns.google,☁️ 云与CDN` → `🚫 受限网站`
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `🚫 受限网站`
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `🚫 受限网站`
  - `[General] encrypted-dns-server` 保留 cloudflare/google DoH 不动（Surge App 自身上游 DoH 配置）
- Bump: `v5.2.9-Surge.2` → `v5.2.10-Surge.1`（主版本追平到 v5.2.10）

## v5.2.9-Surge.2 (2026-04-25) — 移除 url-test 组非法参数 `select=0`

- ★ **FIX-Surge-07-P1**：18 个 url-test 区域组包含不支持的 `select=0` 参数
  - Surge 官方文档中 url-test 类型组不支持 `select` 参数（仅 select 类型组支持），
    该参数会被 Surge 忽略或导致组行为异常
  - 影响范围：全部 18 个区域组（9 全部 + 9 家宽）
  - 修复：移除 `select=0,` 参数
- ★ 同步修复头部注释 `select=0` 描述
- 版本号 `v5.2.9-Surge.1` → `v5.2.9-Surge.2`

### 官方文档证据

- Surge url-test 组语法仅支持 `url` / `interval` / `timeout` / `tolerance` / `include-all-proxies` / `policy-regex-filter`，不支持 `select` 参数

---

## v5.2.8-Surge.6 (2026-04-25) — 欧洲节点 filter 补全 GR/RO/HU/CZ 及多国关键词扩充

- ★ **FIX#29-P2**（同构 bug）：🇪🇺 欧洲节点 + 🏡 欧洲家宽 group filter 补全缺失欧洲国家
  - 上轮 OpenClash 补齐了 15 个欧洲国家 REGIONS，但 iOS 产物 EU filter 未同步
  - 修复：SR/Surge/Loon/QX 的 EU node + EU home filter 新增 GR/RO/HU/CZ 代码 + 全量关键词
    （Greece/Athens/Romania/Bucharest/Hungary/Budapest/Czech/Prague + 中文 + 旗帜 emoji）
  - 同时扩充 PT/BE/IE/DK/NO 的关键词（城市名 + 中文名 + 🇵🇹/🇧🇪/🇮🇪/🇩🇰/🇳🇴）
  - 同构审计：Clash Party JS / OpenClash 已覆盖；CMFA 用 include-all-proxies 兜底全球组（N/A）；SingBox/v2rayN 无运行时节点分类（N/A）
- 版本号 `v5.2.8-Surge.5` → `v5.2.8-Surge.6`


## v5.2.8-Surge.5 (2026-04-24) — DNSPod DoH 端点切换为纯 IP 形式

- ★ `encrypted-dns-server` 里的 `https://doh.pub/dns-query` 替换为
  `https://1.12.12.12/dns-query`
  - DNSPod 纯 IP 形式 DoH 端点，**无需 bootstrap 解析 `doh.pub` 域名**，冷启动更稳
- 版本号 `v5.2.8-Surge.4` → `v5.2.8-Surge.5`

## v5.2.8-Surge.4 (2026-04-23) — 基线对齐 Clash Party v5.2.8（无代码改动）

- 跟随基线 bump：`v5.2.6-Surge.3` → `v5.2.8-Surge.4`
- v5.2.7（mirror URL 切换）：Surge 直接拉上游 URL，不走 mirror，无需改动
- v5.2.8（CMFA/OpenClash 亚太 filter 同构修复）：Surge `policy-regex-filter` 已有 HK/TW/JP/KR 完整覆盖，无需改动

## v5.2.6-Surge.3 (2026-04-23) — 修复区域 url-test 组候选池为空

P0 审查发现 9 个区域 `url-test` 组只有 `policy-regex-filter`，没有候选节点来源；Surge 官方说明正则过滤需要配合 `include-all-proxies` / `include-other-group` / `policy-path` 使用，否则组内可能为空。

### 改动

- ★ **FIX#Surge-06-P0**：9 个区域组全部补 `include-all-proxies=true`
  - `🌍 全球节点`
  - `🇭🇰 香港节点`
  - `🇹🇼 台湾节点`
  - `🇯🇵 日韩节点`
  - `🌏 亚太节点`
  - `🇺🇸 美国节点`
  - `🇪🇺 欧洲节点`
  - `🌎 美洲节点`
  - `🌍 非洲节点`
- ★ 头部版本号 `v5.2.5-Surge.2` → `v5.2.6-Surge.3`，Build `2026-04-23`，基线对齐 Clash Party v5.2.6。

### 自检

- 代理组 37 个 ✓
- 区域 `url-test` 组 9 个，且每个均包含 `include-all-proxies=true` ✓
- `policy-regex-filter` 保留，地区节点名过滤语义不变 ✓

### 官方文档证据

- [Surge Policy Including](https://manual.nssurge.com/policy-group/policy-including.html)：`include-all-proxies=true` 会包含 `[Proxy]` 中所有代理，并可与 `policy-regex-filter` 联用过滤。

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
