# Quantumult X — 变更日志

> `Quantumult X/qx-smart.conf` 的变更日志。主版本号跟随 Clash Party 主线；尾段 `-QX.N` 独立递增。
>
> 本文件**由 `tools/srk_to_qx.py`（或等价脚本）从 Shadowrocket 自动转换**生成。重新同步时请运行该脚本而不是手工改 `.conf`。

---

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
