# Loon — 变更日志

> `Loon/Loon.conf` 的变更日志。主版本号跟随 Clash Party 主线；尾段 `-Loon.N` 独立递增。

---

## v5.2.10-Loon.2 (2026-04-25) — 修复 Loon 弹窗"第 559 行语法错误：DST-PORT,7680,REJECT"

- ★ **FIX#40**（Loon 平台专属语法 bug）：Loon 端口规则名与 Surge/Shadowrocket/Clash 不一致
  - 现象：Loon iOS App 加载配置时弹窗 `第 559 行出现语法错误：DST-PORT,7680,REJECT`
  - 根因：Loon 官方端口规则名是 `DEST-PORT` / `SRC-PORT`（见 [nsloon.app/docs/Rule/port_rule/](https://nsloon.app/docs/Rule/port_rule/)），
    而仓库一直从 Surge/SR 直接迁移用 `DST-PORT`，被 Loon 解析器拒绝
  - 修复：4 条端口规则全部改为 `DEST-PORT`
    - `DST-PORT,7680,REJECT` → `DEST-PORT,7680,REJECT`（Windows Delivery Optimization）
    - `DST-PORT,123,DIRECT` → `DEST-PORT,123,DIRECT`（NTP）
    - `DST-PORT,3478,DIRECT` → `DEST-PORT,3478,DIRECT`（STUN）
    - `DST-PORT,3479,DIRECT` → `DEST-PORT,3479,DIRECT`（STUN-alt）
  - 防回归：在头部 `[Rule]` 段说明里加 ⚠️ 注释，明确写出 Loon 用 DEST-PORT 而非 DST-PORT
- 同构审计（CLAUDE.md §1.5）：
  - Surge / Shadowrocket：官方支持 `DST-PORT`，无需改动 ✓
  - Quantumult X：当前 conf 无 DST-PORT 规则（仅注释提及），无需改动 ✓
  - Clash 家族（CMFA / OpenClash normal+smart / Clash Party JS）：mihomo 内核支持 `DST-PORT`，无需改动 ✓
  - SingBox / v2rayN / Passwall*：用各自原生端口字段，与本 bug 无关 ✓
- Bump: `v5.2.10-Loon.1` → `v5.2.10-Loon.2`

## v5.2.10-Loon.1 (2026-04-25) — 境外 DoH 端点改路由到 🚫 受限网站

- ★ **FIX#39**（同构联动）：跟随 Clash Party v5.2.10 基线
  - `DOMAIN,dns.google,☁️ 云与CDN` → `🚫 受限网站`
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `🚫 受限网站`
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `🚫 受限网站`
  - `[General] doh-server` 保留 cloudflare/google DoH 不动（Loon App 自身上游 DoH 配置）
- Bump: `v5.2.8-Loon.7` → `v5.2.10-Loon.1`（主版本追平到 v5.2.10）

## v5.2.8-Loon.7 (2026-04-25) — 欧洲节点 filter 补全 GR/RO/HU/CZ 及多国关键词扩充

- ★ **FIX#29-P2**（同构 bug）：🇪🇺 欧洲节点 + 🏡 欧洲家宽 group filter 补全缺失欧洲国家
  - 上轮 OpenClash 补齐了 15 个欧洲国家 REGIONS，但 iOS 产物 EU filter 未同步
  - 修复：SR/Surge/Loon/QX 的 EU node + EU home filter 新增 GR/RO/HU/CZ 代码 + 全量关键词
    （Greece/Athens/Romania/Bucharest/Hungary/Budapest/Czech/Prague + 中文 + 旗帜 emoji）
  - 同时扩充 PT/BE/IE/DK/NO 的关键词（城市名 + 中文名 + 🇵🇹/🇧🇪/🇮🇪/🇩🇰/🇳🇴）
  - 同构审计：Clash Party JS / OpenClash 已覆盖；CMFA 用 include-all-proxies 兜底全球组（N/A）；SingBox/v2rayN 无运行时节点分类（N/A）
- 版本号 `v5.2.8-Loon.6` → `v5.2.8-Loon.7` 



## v5.2.8-Loon.6 (2026-04-24) — DNSPod DoH 端点切换为纯 IP 形式

- ★ `doh-server` 里的 `https://doh.pub/dns-query` 替换为 `https://1.12.12.12/dns-query`
  - DNSPod 纯 IP 形式 DoH 端点，**无需 bootstrap 解析 `doh.pub` 域名**，iOS 冷启动更稳
- 版本号 `v5.2.8-Loon.5` → `v5.2.8-Loon.6`

## v5.2.8-Loon.5 (2026-04-23) — 基线对齐 Clash Party v5.2.8（无代码改动）

- 跟随基线 bump：`v5.2.4-Loon.4` → `v5.2.8-Loon.5`
- v5.2.5（Accademia 裁剪）：Loon v5.2.4-Loon.2/.3 已独立完成同类裁剪，无需改动
- v5.2.6（alpha-3 / fallback / cleanupSubscription 同构修复）：Loon `NameRegex FilterKey` 已有 TWN/JPN/KOR/SGP 完整覆盖，无需改动
- v5.2.7（mirror URL 切换）：Loon 直接拉上游 URL，不走 mirror，无需改动
- v5.2.8（CMFA/OpenClash 亚太 filter 同构修复）：Loon `NameRegex FilterKey` 已有 HK/TW/JP/KR 完整覆盖，无需改动

## v5.2.4-Loon.4 (2026-04-22) — 根治"第 229 行语法错误"：288 条 RULE-SET 迁移到 [Remote Rule]

用户反馈 v5.2.4-Loon.3 仍然弹"第 229 行出现语法错误"（anti-ad-surge.txt）；同一天朋友指出 Loon
的订阅规则集正确写法是：

    URL, policy=<策略组>, tag=<显示名>, enabled=true

放在 `[Remote Rule]` 段，而不是 `[Rule]` 段里的 Surge 风格 `RULE-SET,URL,policy`。

复核 fmz200/wool_scripts Loon.conf（与 YueChan/Loon 权威示例）后确认：

- Loon 的 `[Rule]` 段只接受**内联规则**（`DOMAIN-SUFFIX,x,p` / `IP-CIDR,x,p` / `GEOIP,CN,p` / `FINAL,p`）
- **远程订阅 RULE-SET 必须放 `[Remote Rule]` 段**，用 URL 开头的 key=value 语法；写成 Surge 风格的
  `RULE-SET,URL,policy` Loon 会从第一行开始就报语法错

我们从 v5.2.3-Loon.1 初版起就用错了段，v5.2.4-Loon.2 大修时也没发现（官方文档在这一点上说得不清楚，
三份示例参考里也只有 YueChan 的 `[Rule]` 是干净的，fmz200 的 `[Remote Rule]` 才给出了完整语法）。

### 本次改动（一次性彻底修）

- ★ FIX#Loon-15-P0：**新增 `[Remote Rule]` 段**，位置在 `[Proxy Group]` 与 `[Rule]` 之间
- ★ FIX#Loon-16-P0：**288 条 RULE-SET 全量迁移**到 `[Remote Rule]`：
  - `RULE-SET,<URL>,<policy>` → `<URL>, policy=<policy>, tag=<file_basename>, enabled=true`
  - tag 自动取 URL 路径最后一段（例如 `Advertising.list` / `anti-ad-surge.txt`），Loon UI 里看规则源面板更直观
  - 288 条 tag 全部唯一，无重复（脚本 `uniq -c` 验证）
- ★ `[Rule]` 段现在只剩**内联规则**（DOMAIN / DOMAIN-SUFFIX / IP-CIDR / DST-PORT / HOST / GEOIP / FINAL），
  614 行，和 fmz200 / YueChan 的 Loon 配置结构一致
- ★ 头部架构一句话：`... + 250+ RULE-SET` → `... + 288 [Remote Rule] 订阅规则集`

### 迁移自动化

本次迁移用 Python 脚本 `tmp/migrate_loon.py` 批量完成（288 条手工 Edit 太易错）：

1. 正则扫描 `^RULE-SET,(https?://[^,]+),(.+)$` 提取 URL + policy
2. 从 URL 末段生成 `tag=` 值
3. 按阶段注释分组插入 `[Remote Rule]` 段，保留原有注释上下文
4. `[Rule]` 段只保留非 RULE-SET 行

### 自检

- 代理组 37 个 ✓
- 9 区域 Filter × 9 url-test 引用一一匹配 ✓
- `[Remote Rule]` 288 条 ✓
- `[Rule]` 段内残留 `RULE-SET,` 0 条 ✓
- `IP-CIDR6` / `FINAL,...,dns-failed` / `bypass-system` / `ipv6-enabled` / `tun-excluded-routes` /
  `hijack-dns` / `udp-policy-not-supported` 全部 0 次出现 ✓
- 288 条 tag 全部唯一 ✓

### 官方文档证据

- `[Remote Rule]` 语法：[fmz200/wool_scripts Loon.conf](https://raw.githubusercontent.com/fmz200/wool_scripts/main/Loon/config/Loon.conf)
- 用户朋友的原版示例：
  ```
  https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Duckduckgo/Duckduckgo.list, policy=美国节点-兔子, tag=Duckduckgo.list, enabled=true
  ```

---

## v5.2.4-Loon.3 (2026-04-22) — anti-AD 规则源改用 jsDelivr 镜像

- ★ FIX#Loon-14-P0：`RULE-SET,https://anti-ad.net/surge.txt,🛑 广告拦截`
  → `RULE-SET,https://fastly.jsdelivr.net/gh/privacy-protection-tools/anti-AD@master/anti-ad-surge.txt,🛑 广告拦截`
  - 现象：Loon 启用配置时弹窗 "第 229 行出现语法错误"（用户截图反馈）
  - 原因：`anti-ad.net` 是项目自建的裸域名（非 CDN），部分国内 ISP / DNS 劫持会返回 HTML
    captive 页或 403，Loon 把 HTML 当规则解析就报语法错；而仓库里其他 287 条 RULE-SET 全部
    走 `fastly.jsdelivr.net` 或 `ruleset.skk.moe` CDN，从未出现此类问题
  - 修复：改指 anti-AD 官方 GitHub 仓库 `privacy-protection-tools/anti-AD` 的
    `anti-ad-surge.txt`（与 `surge.txt` 语义一致，但走 jsDelivr CDN 镜像）
- ★ 附带扫描：除 anti-ad.net 外，[Rule] 段内所有 288 条 RULE-SET 全部走
  `fastly.jsdelivr.net` / `ruleset.skk.moe`，无同类隐患

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
