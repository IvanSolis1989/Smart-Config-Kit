# Quantumult X — 变更日志

> `Quantumult X/QuantumultX.conf` 的变更日志。主版本号跟随 Clash Party 主线；尾段 `-QX.N` 独立递增。
>
> 本文件**由 `tools/srk_to_qx.py`（或等价脚本）从 Shadowrocket 自动转换**生成。重新同步时请运行该脚本而不是手工改 `.conf`。

---

## v5.2.10-QX.3 (2026-04-25) — Bugfix: [dns] DoH 字段名错误导致 line 22 语法错误

- ★ **FIX#QX-08-P0**：`[dns] server=https://...` → `doh-server=https://...`
  - QX `[dns]` 的 `server=` 字段只接受 IP / `IP:port` / `/域名/IP` 三种形式，DoH URL 必须用独立的 `doh-server=` 字段。
    `server=https://doh.pub/dns-query` 是非法语法，导入时报「line 22 配置文件语法错误」。
  - 受影响 4 行：`doh.pub` / `dns.alidns.com` / `cloudflare-dns.com` / `dns.google`，全部改为 `doh-server=`。
  - 上一版（QX.2）CHANGELOG 把此 bug 误判为 line 13 `running_mode_trigger` 报错的"级联效应、无需修改"，
    实测仍独立报错；本版彻底修复并更正判断。
  - 同步 `README.md §五` 文档（DoH 字段说明 + 链接到 crossutility 官方 sample.conf）。
- 权威来源：QX 作者 [crossutility/Quantumult-X sample.conf](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf) `[dns]` 段。
- §1.5 同构审计：仅 QX 受影响——Clash 家族用 YAML `dns.nameserver: [https://...]`、
  SR/Surge/Loon 的 `dns-server=` 接受 URL、sing-box 用 JSON `dns.servers[].address`；
  这些产物的 DoH URL 写法与 QX 不同源，无同构 bug。
- Bump: `v5.2.10-QX.2` → `v5.2.10-QX.3`

## v5.2.10-QX.2 (2026-04-25) — Bugfix: running_mode_trigger 语法错误

- ★ **FIX#QX-07-P0**（#114）：`running_mode_trigger=filter, filter, auto` → `auto, auto, auto`
  - `filter` 不是 QX `running_mode_trigger` 的有效值（合法值：`direct`/`proxy`/`auto`/`follower`/`none`），导致导入时 line 13 语法错误。line 22 的 DNS 报错是此错误的级联效应，无需修改。
- Bump: `v5.2.10-QX.1` → `v5.2.10-QX.2`

## v5.2.10-QX.1 (2026-04-25) — 境外 DoH 端点改路由到 🚫 受限网站

- ★ **FIX#39**（同构联动）：跟随 Clash Party v5.2.10 基线
  - `host, dns.google, ☁️ 云与CDN` → `🚫 受限网站`
  - `host, dns.google.com, ☁️ 云与CDN` → `🚫 受限网站`
  - `host-suffix, cloudflare-dns.com, ☁️ 云与CDN` → `🚫 受限网站`
  - `[dns] server=https://cloudflare-dns.com/dns-query` / `https://dns.google/dns-query`
    保留不动（QX App 自身上游 DoH 配置）
- Bump: `v5.2.8-QX.5` → `v5.2.10-QX.1`（主版本追平到 v5.2.10）

## v5.2.8-QX.5 (2026-04-25) — 欧洲节点 filter 补全 GR/RO/HU/CZ 及多国关键词扩充

- ★ **FIX#29-P2**（同构 bug）：🇪🇺 欧洲节点 + 🏡 欧洲家宽 group filter 补全缺失欧洲国家
  - 上轮 OpenClash 补齐了 15 个欧洲国家 REGIONS，但 iOS 产物 EU filter 未同步
  - 修复：SR/Surge/Loon/QX 的 EU node + EU home filter 新增 GR/RO/HU/CZ 代码 + 全量关键词
    （Greece/Athens/Romania/Bucharest/Hungary/Budapest/Czech/Prague + 中文 + 旗帜 emoji）
  - 同时扩充 PT/BE/IE/DK/NO 的关键词（城市名 + 中文名 + 🇵🇹/🇧🇪/🇮🇪/🇩🇰/🇳🇴）
  - 同构审计：Clash Party JS / OpenClash 已覆盖；CMFA 用 include-all-proxies 兜底全球组（N/A）；SingBox/v2rayN 无运行时节点分类（N/A）
- 版本号 `v5.2.8-QX.4` → `v5.2.8-QX.5` 



## v5.2.8-QX.4 (2026-04-24) — DNSPod DoH 端点切换为纯 IP 形式

- ★ `[dns]` 段里的 `server=https://doh.pub/dns-query` 替换为
  `server=https://1.12.12.12/dns-query`
  - DNSPod 纯 IP 形式 DoH 端点，**无需 bootstrap 解析 `doh.pub` 域名**，iOS 冷启动更稳
- 版本号 `v5.2.8-QX.3` → `v5.2.8-QX.4`

## v5.2.8-QX.3 (2026-04-23) — 基线对齐 Clash Party v5.2.8（无代码改动）

- 跟随基线 bump：`v5.2.5-QX.2` → `v5.2.8-QX.3`
- v5.2.6（alpha-3 / fallback / cleanupSubscription 同构修复）：QX `server-tag-regex` 已有 TWN/JPN/KOR/SGP 完整覆盖，无需改动
- v5.2.7（mirror URL 切换）：QX 直接拉上游 URL，不走 mirror，无需改动
- v5.2.8（CMFA/OpenClash 亚太 filter 同构修复）：QX `server-tag-regex` 已有 HK/TW/JP/KR 完整覆盖，无需改动

## v5.2.5-QX.2 (2026-04-22) — 移除 72 条 Clash YAML + anti-AD/Sukka 兼容修复 + 版本对齐

与 Loon v5.2.4-Loon.2/.3 与 Shadowrocket v5.2.5-SR.3 同批 "Clash Party 基线遗毒"：

### 改动

- ★ FIX#QX-01-P0：**删除 72 条 Clash classical `.yaml` `[filter_remote]` 条目**（71 Accademia + 1 ACL4SSR Zoom.yaml）
  - QX 的 `[filter_remote]` + `opt-parser=true` 只解析 Surge/QX 纯文本格式；YAML `payload:` classical 不吃，订阅后规则集显示 0 条命中
- ★ FIX#QX-02-P0：`anti-ad.net/surge.txt` → `fastly.jsdelivr.net/gh/privacy-protection-tools/anti-AD@master/anti-ad-surge.txt`
  - Loon v5.2.4-Loon.3 已实锤：anti-ad.net 无 CDN，国内 ISP 会劫持返回 HTML → QX 解析也同样会失败
- ★ FIX#QX-03-P0：Sukka `List/domainset/reject_phishing.conf` → `List/non_ip/reject_phishing.conf`
  - `domainset/` 是 Surge 专属二级格式（无 RULE 前缀的纯 domain 列表），QX `opt-parser=true` 应可识别但官方无保证；`non_ip/` 是带 `DOMAIN-SUFFIX,...` 的通用 Surge/QX 格式
- ★ FIX#QX-04-P1：**主版本号对齐** `v5.2.3-QX.1` → **`v5.2.5-QX.2`**（Clash Party JS `VERSION='v5.2.5'`；之前落后 2 个小版本）
- ★ FIX#QX-05-P2：Build `2026-04-20` → `2026-04-22`；架构一句话 `360 filter_remote` → `~290 filter_remote`
- ★ FIX#QX-06-P2：**移除头部"⚠️ 本文件由 tools/srk_to_qx.py 自动转换"警告**
  - 核实 `tools/srk_to_qx.py` 在仓库中不存在（从未提交过）；该警告长期是"幻影警告"误导用户
  - 暂时允许手工编辑（本 PR 即是）；未来如果真要恢复自动转换，补脚本再改回警告

### 结构性核查（之前 audit agent 漏查，这次独立核对）

手动核对 QX 文件结构发现**段头、规则 token、行格式全部正确**（不需要改）：

- 段头小写 `[general] [dns] [policy] [server_local] [server_remote] [filter_remote] [filter_local] [rewrite_local] [rewrite_remote] [task_local] [mitm]` ✓
- `[policy]` 用 QX 原生 `url-latency-benchmark=<Name>, server-tag-regex=..., check-interval=..., tolerance=..., alive-checker-enabled=true, img-url=...` ✓
- `[filter_remote]` 用 QX 原生 `URL, tag=..., force-policy=..., update-interval=..., opt-parser=true, enabled=true`（不是 Surge 风格的 `RULE-SET,URL,policy`）✓
- `[filter_local]` rule token 全部 QX 小写规范：`host-suffix, xxx, policy` / `host, xxx, policy` / `ip-cidr, xxx, policy` / `dst-port, xxx, policy` / `geoip, xx, policy` / `final, policy` ✓
- FINAL 无 `,dns-failed` 后缀 ✓

### 自检

- 代理组 37 个 (`url-latency-benchmark` × 9 + `static` × 28) ✓
- `[filter_remote]` yaml 残留：0 条 ✓
- `anti-ad.net` 残留：0 次 ✓
- `domainset/` 残留：0 次；`non_ip/` 使用：1 次 ✓
- `final, 🐟 漏网之鱼` 无后缀 ✓
- 文件行数 1197 → 1125（净 -72）

### 已接受的回归损失（与 Loon / SR 一致）

Accademia `Bank × 10 国家级` / `FakeLocation × 10` / `GeoRouting × 17 区域` / `eMuleServer` / `HomeIP` 没有 `.list` 等价源。完整覆盖请换 CMFA / OpenClash / SingBox。

---

## v5.2.3-QX.1 (2026-04-20) — 初版

- ★ 从 Shadowrocket v5.2.2-SR.2 + Surge v5.2.3-Surge.1 自动转换生成
- ★ `[Proxy Group]` 映射到 QX `[policy]`：
  - `url-test` → `url-latency-benchmark`（QX 专用延迟择优）
  - `select` → `static`（QX 专用手选）
- ★ `[Rule]` 段拆分为：
  - `[filter_local]`（inline 规则）
  - `[filter_remote]`（RULE-SET URL）
- ★ 规则类型转换：
  - `DOMAIN-SUFFIX` → `host-suffix`
  - `DOMAIN-KEYWORD` → `host-keyword`
  - `DOMAIN` → `host`
  - `IP-CIDR` → `ip-cidr`
  - `GEOIP` → `geoip`
  - `FINAL` → `final`
  - `REJECT` → `reject`、`DIRECT` → `direct`（QX 策略名小写约定）
- ★ rule-set URL 路径 `/rule/Shadowrocket/` 自动改写为 `/rule/QuantumultX/`（blackmatrix7 在该目录下提供 QX 专用 `.list` 格式，语法一致）

### 与 Clash Party 主线的差异（QX 引擎限制）

- 无 Mihomo Smart 组 / LightGBM（QX 核心不是 Mihomo）
- 无 TLS 指纹注入（QX 不暴露 uTLS 控制）
- 无 PROCESS-NAME（iOS 无进程 API；已在转换时跳过）
- 无 URL-REGEX（QX `filter_local` 不支持；已在转换时跳过）
- GEOSITE 全部替换为 `filter_remote` RULE-SET
- Meta `.mrs` 二进制 → blackmatrix7 QuantumultX `.list`

### 重要使用提示

- ⚠️ **订阅节点**：QX 不会自动解析 `[server_local]` / `[server_remote]` 段落里的节点；必须在 `[server_remote]` 填机场订阅 URL，或在 `[server_local]` 手动粘贴节点。
- `resource_parser_url` 已预置 KOP-XIAO 的通用解析器，可吃非标准订阅格式。
- `rewrite_local` / `rewrite_remote` / `task_local` / `mitm` 段默认留空，按需自行扩展。
