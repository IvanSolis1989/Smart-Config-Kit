# v2rayN — 变更日志

> `v2rayN/v2rayN(xray).json` 的变更日志。
> 主版本号跟随 Clash Party 主线；尾段 `-v2n.N` 独立递增。
>
> v2rayN 本身是多核调度器，路径 A（mihomo 核）和路径 B（sing-box 核）直接复用 CMFA / SingBox 产物，不在此记录；本文件仅针对**路径 C（Xray 核）** 的 `v2rayN(xray).json`。

---

## v6.0.14-v2n.5 (2026-09-29)

- SYNC：Xray fallback 第 001 RuleObject 加入微信 HTTPDNS 两个精确域名并保持 direct 出站。
- VERIFY：产物继续保持 69 个非空融合段 + 19 条可表达内联规则 + 1 条元数据，共 89 条 RuleObject。

## v6.0.13-v2n.4 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：Xray fallback 的第 013 RuleObject 增加 `domain:linuxdo.org` 并保持 direct 国内语义；`linux.do` 仍在第 059 proxy 规则。
- SYNC：产物保持 69 个非空融合段 + 19 条可表达内联规则 + 1 条元数据，共 89 条 RuleObject。

## v6.0.12-v2n.3 (2026-09-01)

- FIX#181-PC：Xray fallback 从首段 fused JSON 重建，`login.nvidia.cn` 在 NVIDIA 下载段之前命中 `direct`。
- SYNC：当前产物为 69 个非空融合段 + 19 条可表达内联规则 + 1 条元数据，共 89 条 RuleObject。

## v6.0.11-v2n.2 (2026-08-22)

- Xray fallback 从最终 69 个 fused sing-box 段展平为 89 条 RuleObject；Gemini 与 Accademia Gemini 段改为 proxy Google 语义，未移动 szkane AI 段。

## v6.0.10-v2n.2 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：Xray fallback 从首段 fused sing-box JSON 重建；两个网易游戏服务主机在国内游戏段之前以 `direct` 出站匹配。

## v6.0.9-v2n.1 (2026-07-19)

- Xray fallback 增加两条可表达的 `process + domain` RuleObject：仅 `Code Helper` / `Code Helper (Plugin)` 访问 `api.github.com` 时保持 proxy AI 语义；通用 GitHub API 段先于上游广义 AI 段。
- SYNC：重建为 86 条 RuleObject（1 meta + 66 fused + 19 inline）。

## v6.0.8-v2n.1 (2026-07-15)

- 从更新后的融合 sing-box 源重新展平，保持国内权威段先于通用国际兜底的等价顺序。

## v6.0.7-v2n.1 (2026-07-14)

- FIX#176：Xray fallback 从后置国际 SRS 段重生成，国内域名 RuleObject 在共享 CDN / GeoIP 的 proxy fallback 前命中 direct。

## v6.0.6-v2n.1 (2026-07-14)

- DIRECT-WORKPRO-WEB：Xray fallback 重新生成，默认 direct RuleObject 的 `process` 同时包含 `WorkPro.exe` 和 `WorkProWebProcess.exe`；仅在本机 Windows / Linux 的进程匹配路径生效。

## v6.0.5-v2n.1 (2026-07-14)

- DIRECT-WORKPRO：Xray fallback 重建为 process 包含 WorkPro.exe 且 outboundTag 为 direct；仅在本机 Windows / Linux 的 Xray 进程匹配路径生效。

## v6.0.4-v2n.1 (2026-07-13)

- DIRECT-ITWDB：Xray fallback 由 fused sing-box JSON 重建，默认 direct RuleObject 包含 `domain:itwdb.com`，覆盖 WorkPro 子域名。

## v6.0.3-v2n.1 (2026-07-12)

- SYNC：从 65 个非空 fused sing-box JSON 重新展平为 83 条 Xray RuleObject（1 meta + 65 fused + 17 inline），保持 `proxy/direct/block` 三出站与首匹配顺序。
- AI-PRECEDENCE：新增的 AI telemetry guard 在广告与国外网站 fallback 之前生效；Xray 路径不直接下载或调用任何上游规则集。

## v6.0.2-v2n.1 (2026-07-10)

- SYNC：从 64 个 v6.0.2 非空 fused sing-box JSON 重新展平为 82 条 Xray RuleObject（1 meta + 64 fused + 17 inline），保持 `proxy/direct/block` 三出站。
- PERF：Xray fallback 继承编译目标内的 GEOIP/ASN CIDR 物化和同策略去重，不加载任何原始上游 rule-provider。

## v6.0.1-v2n.1 (2026-07-10)

- SYNC：Xray fallback 由最新 fused sing-box JSON 重新展平，保留 86 条原生 Xray RuleObject、`proxy/direct/block` 三出站和既有优先级。
- DELIVERY：Xray JSON 不远程加载 Issue #174 所涉的文本规则集；其版本同步用于保证 fallback 与 source graph v6.0.1 一致。

## v6.0.0-v2n.2 (2026-07-09)

- FUSED-XRAY：`v2rayN(xray).json` 改由 `tools/generate-fused-fallback-artifacts.js` 从 `rulesets/generated/fused/sing-box/*.json` 展平成原生 Xray RuleObject。
- SCOPE：Xray 没有远程 `.srs` rule-set 路由字段，不能像 sing-box/Passwall 一样引用远程 fused `.srs`；本产物保留 `proxy/direct/block` 三出站，输出 1 条 meta、68 条 fused 段和 17 条端口/逻辑/MATCH 内联规则。

## v6.0.0-v2n.1 (2026-07-09)

- META：跟随 Clash Party v6.0.0 更新版本元数据。
- SCOPE：Xray 路由 JSON 仍是 proxy/direct/block 三出站降级展平参考，不承载融合 rule-set，不反向影响 Clash Party 基准。

## v5.4.39-v2n.1 (2026-07-09)

- META：跟随 Clash Party v5.4.39 更新版本元数据。
- N/A：Xray 路由 JSON 不消费 Mihomo `.mrs` rule-provider；mihomo / sing-box 路径分别复用 CMFA / SingBox 产物。

## v5.4.38-v2n.1 (2026-07-09)

- META：跟随 Clash Party v5.4.38 更新版本元数据。
- SCOPE：Xray JSON 继续使用展平规则，不直接引用 `rulesets/supplemental` URL。

## v5.4.37-v2n.1 (2026-06-29)

- META#170-DNS-POLICY：跟随 Clash Party v5.4.37 更新版本元数据。
- N/A：Xray 路由 JSON 不承载 DNS 解析策略；mihomo / sing-box 路径分别复用 CMFA / SingBox 产物，本文件规则语义不变。

## v5.4.36-v2n.1 (2026-06-29)

- META#171-DIRECT：跟随 Clash Party v5.4.36 更新版本元数据。
- Xray 产物不承载这 22 条 mihomo 直写规则，本产物规则语义不变。

## v5.4.35-v2n.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM：跟随 Clash Party v5.4.35 基线更新版本元数据。
- N/A：Xray 路由 JSON 不消费 Mihomo rule-provider；本次清理不改变 40 条启用规则。

## v5.4.34-v2n.1 (2026-06-28)

- ★ FIX#169-AMAP：新增 `scki-000e-amap-direct`，显式直连 `a-map.cn` / `amap.com` / `autonavi.com` / `gaode.com` 等高德地图 / AMap 核心域名。
- 说明：v2rayN Xray 路由 JSON 不消费 Mihomo `rule-provider`，因此使用域名兜底与主线 `amap` provider 保持语义等价。

## v5.4.33-v2n.1 (2026-06-27)

- ★ FEAT#169-AI-CODING：Xray 降级参考在 `scki-010-ai` 补充 AI 编程工具域名兜底，覆盖 Augment / Amazon Q / Bolt / Continue / Devin / Kiro / Lovable / Replit / Sourcegraph / Tabnine / Windsurf / Zed 等。

## v5.4.32-v2n.1 (2026-06-25)

- ★ FIX#168-CN-GAME：Xray 路由中的 `scki-025-cn-game` 补齐米哈游、网易、WeGame、完美世界、TapTap、鹰角、莉莉丝等国内游戏域名，并保持在国外游戏规则之前。
- 元数据对齐 Clash Party v5.4.32；mihomo / sing-box 路径继续复用对应主产物。

## v5.4.31-v2n.1 (2026-06-20)

- ★ FIX#167-DOUYIN：Xray 降级参考新增 `scki-000d-douyin-web-cnmedia`，将抖音 Web / `zjcdn.com` 视频 CDN 明确前置直连。
- 元数据对齐 Clash Party v5.4.31；mihomo / sing-box 路径继续复用对应主产物。

## v5.4.30-v2n.1 (2026-06-17)

- ★ FEAT#166-GOOGLE：Xray 降级参考新增 `scki-027-google`，承载 `geosite:google` / `geoip:google` / `domain:scholar.google.com`。
- 原搜索引擎参考拆为 `scki-027b-search`，仅保留 Bing / DuckDuckGo / Yandex 等非 Google 搜索。

## v5.4.29-v2n.1 (2026-06-10)

- N/A#165-LATENCY：v2rayN Xray 路由 JSON 不承载区域自动测速/健康检查字段；本轮仅元数据与 README 对齐 Clash Party v5.4.29。

## v5.4.27-v2n.1 (2026-06-07)

- 对齐基线 v5.4.27（CLEAN#165）。Xray 路由使用 `geosite:anthropic` / `geosite:paypal` / `geosite:hbo` / `geosite:hulu` / `geosite:xbox` 聚合项，未包含本轮可删除的直写域名；仅更新元数据版本。

## v5.4.26-v2n.1 (2026-06-07)

- 对齐基线 v5.4.26（FIX#164）。本产物**不受** `copilot.tencent.com` 误吞影响：Xray 路由 AI 类用 `geosite:copilot`（仅含微软/GitHub Copilot 精确域名，无 copilot 子串关键词），`copilot.tencent.com` 顺流到 `geosite:cn`（含 `tencent.com`）→ direct，无需规则改动。仅 bump 元数据版本。

## v5.4.25-v2n.1 (2026-06-04)

- ★ SYNC：Xray 路由 JSON 元数据对齐 Clash Party v5.4.25；业务/规则类别未变化，路由语义延续 v5.4.23-v2n.1。

## v5.4.23-v2n.1 (2026-06-02)

- ★ FIX#161：`domain:zhimg.com` + `domain:zhihu.co` 加入 direct 路由规则（知乎图片 CDN + 短链，同步基线）。

## v5.4.22-v2n.1 (2026-05-31)

- ★ GeTui(个推)推送 SDK `getui.com` / `getui.net` / `gepush.com` 加入 `scki-000c` direct 路由规则（review 后补；延续 #2，前置于 ads；owner 选放行保 App 推送如米家）。

- N/A#1 QUIC 精细化：v2rayN Xray 路由 JSON 不承载 QUIC 阻断，#1 不适用；版本跟随基线对齐。

## v5.4.21-v2n.1 (2026-05-31)

- N/A#4 DoH-over-IP bootstrap：v2rayN Xray 路由 JSON 不承载 DNS resolver（只有 route/proxy/direct/block），#4 不适用；版本跟随基线对齐。

## v5.4.20-v2n.1 (2026-05-30)

- N/A#6 节点过滤关键词补充（批 B）：Xray 路由 JSON 无运行时节点分类 / junk 过滤器，#6 不适用；版本跟随 Clash Party v5.4.20 基线对齐。

## v5.4.19-v2n.1 (2026-05-30)

借鉴 Proxy-override 批 A · #2 国内 SDK/CDN 直连前置（跟随 Clash Party v5.4.19；spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- 新增 `scki-000c-cn-sdk-cdn-direct` 路由规则（`outboundTag: direct`），前置于 `scki-001-ads`：`jpush.cn` / `jpush.io` + `full:msg.umeng.com`（避免被 `geosite:category-ads-all` 误拦）+ `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` CDN
- 不适用 #3 fake-ip-filter / #5 direct-nameserver-follow-policy（Xray 路由 JSON 不承载 fake-ip / mihomo DNS 字段）
- 🔢 版本：v5.4.17-v2n.1 → v5.4.19-v2n.1（全产物跳过烧毁的 .18 统一到 v5.4.19）

## v5.4.17-v2n.1 (2026-05-26)

- N/A#DNS-SPLIT-BOOTSTRAP：路径 C（Xray 核）只发布路由规则 JSON，不承载 DNS resolver 配置
  - 元数据同步 Clash Party v5.4.17
  - v2rayN 的 mihomo / sing-box 路径继续直接复用 CMFA / SingBox 产物

## v5.4.16-v2n.1 (2026-05-20)

- ✅ FIX#149-P0：路径 C（Xray 核）新增 `paddle.com -> proxy` 前置规则
  - v2rayN Xray 不消费 anti-AD 远程源，但保留 Paddle 许可/支付链路优先级；mihomo / sing-box 路径复用对应产物

## v5.4.15-v2n.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER：同步 Clash Party v5.4.15 元数据，新增 GEOSITE 覆盖台账引用。
- N/A#AD-FP-MODULE：路径 C 的 Xray 路由 JSON 不消费 Sukka phishing / blackmatrix7 MIUI 远程源；保留既有 Cloudflare R2 前置规则，mihomo / sing-box 路径复用对应产物。

## v5.4.14-v2n.1 (2026-05-20)

- ✅ FIX#CF-R2-P0：Xray 路由 JSON 增加 `cloudflarestorage.com -> proxy` 前置规则
  - 路径 C 不消费 Sukka phishing 远程源，但同步保留 Cloudflare R2 存储域的正向优先级
  - 元数据同步 Clash Party v5.4.14

## v5.4.13-v2n.1 (2026-05-19)

- ✅ FIX#STUN-PORTS：Xray 路由 JSON 新增 `STUN/TURN NAT 探测端口 -> direct`
  - 覆盖 `3478 / 3479 / 5349 / 19302 / 19305 / 19307`
- N/A#FAKE-IP：Xray 路由 JSON 无 Mihomo `fake-ip-filter`

## v5.4.12-v2n.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 baseline metadata after the Mihomo RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Xray routing JSON has no Mihomo fake-ip-filter or process matching fields here; route semantics are unchanged.

## v5.4.11-v2n.1 (2026-05-12)

- ✅ FIX#RD-DOMAIN：Xray 路由 JSON 的会议协作规则补充 `domain:rustdesk.com`，避免 RustDesk relay/API 落入 AI/Copilot 或 FINAL
- ℹ️ PROCESS-NAME 不适用：v2rayN Xray 路由导入文件仍只维护域名/IP/端口规则

## v5.4.9-v2n.1 (2026-05-11)

- ★ META#LOCAL-TOOLS：跟随 Clash Party v5.4.9 基线；Xray routing JSON 没有与 mihomo PROCESS-NAME 等价的通用进程规则字段，本轮仅更新 `_meta.remarks`。
- v2rayN 用户如需本地工具直连白名单，优先使用 mihomo 核（CMFA 产物）或 sing-box 核（SingBox Full 产物）。

## v5.4.8-v2n.1 (2026-05-09)

- ★ ORDER#RULE-TAIL：同步 Clash Party v5.4.8 路由规则顺序语义
  - Xray 仅 proxy/direct/block 三出站，无新增出站

## v5.4.7-v2n.1 (2026-05-09)

- ★ FEAT#TikTok：Xray 路由仅 proxy/direct/block 三出站，`geosite:tiktok` 已在 proxy，功能无变化；仅 `_meta.version` bump
- ★ FIX#HK：Xray 路由无运行时节点分类，豁免

## v5.4.6-v2n.1 (2026-05-08)

- ★ FEAT#145：WeChat CDN 直连 — 新增 `scki-052-cdn-weixin` 规则，`domain:cdn.weixin.qq.com` → `direct`
  - 排在 `scki-051-bbys-app` 之后、`scki-099-final` 之前
  - 跟随 Clash Party v5.4.6 基线

## v5.4.5-v2n.1 (2026-05-07)

- ★ 全球节点置顶 + 全产品组顺序同步（跟随基线 v5.4.5）

## v5.4.4-v2n.1 (2026-05-07)

- ★ FIX#144：bbys.app 视频播放走直连——新增 `scki-051-bbys-app` 规则，`domain:bbys.app` → `direct`
  - 该域名未被现有 geosite 规则覆盖，Xray 路由新增一条 domain 匹配规则
  - 排在 `scki-050-cn-site` 之后、`scki-099-final` 之前
- ★ FIX#142（DNS nameserver 兜底）：v2rayN Xray 无运行时 DNS 创建逻辑，豁免
- ★ FEAT#143（IEPL/IPLC 家宽识别）：v2rayN Xray 仅路由规则（无节点分类），豁免
- Bump: `v5.4.0-v2n.1` → `v5.4.4-v2n.1`

## v5.4.0-v2n.1 (2026-05-05)

- ★ FEAT#SG：新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立区域组
  - 新加坡从 🌏 亚太节点 中拆分为独立区域
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51
  - 跟随基线 Clash Party v5.4.0
  - 注：SG 狮城节点豁免——无节点名称匹配，使用 geosite 路由

## v5.3.0-v2n.1 (2026-04-26)

- ★ REFACTOR#2：流媒体分组架构重构——按区域 → 按平台（7→13 流媒体组）
  - 拆出 5 个主流平台独立组：🎥 Netflix / 🎬 Disney+ / 📡 HBO/Max / 📺 Hulu / 🎬 Prime Video
  - 拆出 2 个全球平台独立组：📹 YouTube / 🎵 音乐流媒体
  - 保留 4 个区域锁区组：🇭🇰 香港流媒体 / 🇹🇼 台湾流媒体 / 🇯🇵 日韩流媒体 / 🇪🇺 欧洲流媒体
  - 新增 🌐 其他国外流媒体 兜底（接收长尾平台 + 原东南亚流媒体）
  - 业务组 25→31，总组 43→49
## v5.2.11-v2n.1 (2026-04-26) — 业务组合并精简 28→25（基线同步）

- ★ **REFACTOR#1（基线同步）**：跟随 Clash Party v5.2.11 基线，业务组从 28 精简至 25
  - 合并 🔍搜索引擎 + 📟开发者服务 → 新增 🔧工具与服务
  - 合并 📧邮件服务 → 🌐国外网站
  - 合并 ☁️云与CDN → 🌐国外网站
  - 📥下载更新 策略从 DIRECT 优先改为代理优先
  - 注：v2rayN Xray 路径仅 proxy/direct/block 三出站，组合并不产生路由规则 diff；
    仅同步版本号以保持基线标识。
- Bump: `v5.2.10-v2n.1` → `v5.2.11-v2n.1`

## v5.2.10-v2n.1 (2026-04-25) — 主版本追平（无规则改动）

- ★ **FIX#39 同构审计 — 不适用**：本轮主线把 `dns.google` / `cloudflare-dns.com`
  从 `☁️ 云与CDN` 移到 `🚫 受限网站`，但 v2rayN 的 Xray 路由只有
  `proxy` / `direct` / `block` 三个 outbound——无论这两个域名挂在哪个"业务组"语义下，
  在 v2rayN 里都映射为 `proxy`，**没有规则 diff**。
- 唯一改动：`_meta.remarks` 主版本号 `v5.2.9` → `v5.2.10` 追平基线
- Bump: `v5.2.9-v2n.1` → `v5.2.10-v2n.1`

## v5.2.8-v2n.1 (2026-04-23) — 补齐港澳台 / 国际版 B 站分流，主线对齐 v5.2.8

本轮补齐与 Clash Party v5.2.7 / v5.2.8 的主线同步欠账，以及港澳台 / 国际版 B 站在 Xray 路径的规则缺失。

### 改动

- ★ **FIX#v2n-07**：新增 `scki-019-hmt-media`（港澳台 B 站 → 代理）
  - 基线 `Clash Party/ClashParty(mihomo-smart).js:1555` 将 `RULE-SET,szkane-bilihmt` 归入 `🇭🇰 香港流媒体`；Xray 三出站模型下降级为 `proxy`。
  - szkane 的 `ClashRuleSet@main/Clash/Ruleset/BilibiliHMT.list` 是 Clash 私有 `.list`，xray 的 `geosite.dat` 不含对应分类，因此**内联**上游 21 条（5 DOMAIN / 3 DOMAIN-SUFFIX / 13 IP-CIDR）。
  - **放置在 `scki-018-cn-media` 之前**：xray 与 mihomo 一样按数组顺序评估，`geosite:bilibili` 里包含 `bilibili.com` 后缀，若 HMT 排在 018 之后会先被 018 捕获命中直连 → 港澳台番剧 412。
- ★ **FIX#v2n-08**：新增 `scki-019a-sea-media`（国际版 B 站 → 代理）
  - 基线将 `RULE-SET,biliintl` 归入 `📺 东南亚流媒体`；v2rayN Xray 三出站下降级为 `proxy`。
  - 用 `geosite:biliintl`（v2fly `geosite.dat` 标准分类）；若用户 geosite 不含该分类，会自然回落到 `scki-040-gfw` → proxy，语义不变。
- ★ 主线对齐：`scki-000-meta` remarks 由 `v5.2.6-v2n.3` / `Baseline Clash Party v5.2.6` bump 到 `v5.2.8-v2n.1` / `Baseline Clash Party v5.2.8`（前两次 v5.2.7 / v5.2.8 主线 bump 未同步 v2rayN，一并补上）。

### 官方文档证据

- [v2rayN Wiki — 自定义路由规则](https://github.com/2dust/v2rayN/wiki/%E9%85%8D%E7%BD%AE%E6%95%99%E7%A8%8B-%E8%B7%AF%E7%94%B1)：自定义路由规则为数组，每项是一条 Xray 路由规则对象（顶层仍为数组保持不变）。
- [Xray Routing — domain prefix](https://xtls.github.io/config/routing.html)：`geosite:*` / `domain:*` / 纯域名 / IP-CIDR 的匹配语义；路由按规则数组**顺序**评估，首条命中立即出站。

### 自检

- JSON 合法 ✓
- 对象总数 32（启用 31 + 禁用 metadata 1）✓
- `outboundTag` 集合仍为 `{proxy, direct, block}` ✓
- 规则顺序：`scki-019-hmt-media` < `scki-018-cn-media` < `scki-019a-sea-media` ✓（python 断言通过）

---

## v5.2.6-v2n.3 (2026-04-23) — 改为官方规则数组 + 移除悬空 dns-out

本轮处理 P0 兼容性审查中 v2rayN Xray 路径的导入格式与 outboundTag 问题。

### 改动

- ★ **FIX#v2n-05-P0**：`v2rayN(xray).json` 顶层从对象改为官方“规则数组”
  - v2rayN 官方 Wiki 明确：自定义路由规则是“一个数组，数组中每一项是一个规则”。
  - 保留 29 条启用规则；额外增加 1 条 `enabled:false` 的 `scki-000-meta` 版本标记，避免 JSON 数组格式下完全丢失产物版本信息。
- ★ **FIX#v2n-06-P0**：DNS 53 规则 `outboundTag` `dns-out` → `direct`
  - 本仓库路径 C 只承诺使用 v2rayN/Xray 的 `proxy` / `direct` / `block` 三个出站。
  - `v2rayN(xray).json` 是路由规则导入文件，不定义 Xray outbounds；继续指向 `dns-out` 会形成悬空引用。
- ★ 版本标记更新为 `v5.2.6-v2n.3`，Build `2026-04-23`，基线对齐 Clash Party v5.2.6。

### 自检

- JSON 顶层为数组 ✓
- 对象总数 30，其中启用规则 29、禁用 metadata 1 ✓
- outboundTag 集合只剩 `proxy` / `direct` / `block` ✓
- `dns-out` 残留 0 ✓

### 官方文档证据

- [v2rayN Wiki: Description of custom routing rules](https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules)：官方示例为 JSON 数组。
- [Xray / V2Ray Routing RuleObject](https://xtls.github.io/config/routing.html#ruleobject)：路由规则通过 `outboundTag` 指向已存在出站。

## v5.2.5-v2n.2 (2026-04-22) — geosite 类别兼容修复 + 版本对齐

深度审查发现 `即时通讯` 规则里 `geosite:kakaotalk` 在 **v2fly/domain-list-community 里不存在**
（仓库只有 `kakao` 类别，不带 `talk` 后缀；Loyalsoldier 扩展集同样没有）。规则加载后
silent match 0 domains，KakaoTalk 流量会下沉到 geoip / FINAL，分流不符预期。

### 改动

- ★ FIX#v2n-01-P1：**`geosite:kakaotalk` → `geosite:kakao`**（v2fly 官方类别）+ 补三个显式 domain 兜底
  - `domain:kakao.com` / `domain:kakaocorp.com` / `domain:kakaotalk.com`
  - 其他 geosite 类别（`huggingface` / `anthropic` / `perplexity` / `copilot` / `gemini` / `bard` / `openai` 等 AI 新类别）
    已逐一核对上游存在（v2fly 有 `huggingface.co/hf.co/hf.space` 等），保留
- ★ FIX#v2n-02-P2：`_meta.version` `v5.2.3-v2n.1` → **`v5.2.5-v2n.2`**（主版本对齐 Clash Party JS `VERSION='v5.2.5'`）
- ★ FIX#v2n-03-P2：`_meta.build` `2026-04-20` → `2026-04-22`；`_meta.baseline` `v5.2.4` → `v5.2.5`
- ★ FIX#v2n-04-P2：`remarks` 顶层字段 `v5.2.3` → `v5.2.5`

### 复核其他 audit 发现（保留，不改）

- **`_meta` 顶层键**：v2rayN 保存时需要 `_meta` 做 UI 展示；Xray-core 的 JSON 解析器默认 `DisallowUnknownFields=false`，`_meta` 会被忽略。保留。
- **`dns-out` outboundTag**：由 v2rayN 主配置补 outbound 定义（参考 `v2rayN/README.md`），本 routing 片段不包含 outbound 定义符合设计。保留。
- **其他 98 个 geosite 类别**：已随机抽样确认 v2fly / Loyalsoldier 覆盖，未发现其他缺失。

### 自检

```
python3 -c 'import json; d=json.load(open("v2rayN/v2rayN(xray).json")); print(d["_meta"]["version"])'
→ v5.2.5-v2n.2 ✓
rules 数量:                 29（不变）
kakaotalk → kakao + domain: 已修 ✓
_meta.version 以 v5. 开头:  ✓（CLAUDE.md §5 期望）
```

### 官方文档证据

- [v2fly/domain-list-community data/kakao](https://github.com/v2fly/domain-list-community/tree/master/data)（存在）vs `data/kakaotalk`（404）
- [v2fly/domain-list-community data/huggingface](https://raw.githubusercontent.com/v2fly/domain-list-community/master/data/huggingface) 存在（hf.co / hf.space / huggingface.co）

---

## v5.2.3-v2n.1 (2026-04-20) — 初版

- ★ 基于 Clash Party v5.2.3 提取关键业务域名，生成 Xray routing rule
- ★ 29 条路由规则，分发：
  - `proxy` × 20（AI / 加密货币 / 流媒体 / 社交 / 开发者 / GFW 等业务组折叠到 proxy 出站）
  - `direct` × 6（私有网段 / 国内网站 / 国内流媒体 / 国内游戏 / 苹果服务默认 / BT tracker）
  - `block` × 2（广告拦截 / Windows Delivery Optimization 端口 7680）
  - `dns-out` × 1（DNS 劫持）
- ★ 使用 geosite + geoip 关键字组合：`geosite:openai` / `geosite:netflix` / `geoip:cn` 等
- ★ 包含 `_meta` 元数据块（`name` / `version` / `build` / `baseline` / `note` / `changelog`），方便 v2rayN UI 展示

### 已知限制（Xray 核的设计约束，非 bug）

- ❌ 无 28 业务组 → 9 区域组的两层结构（Xray routing 只有 proxy / direct / block 三出站）
- ❌ 无 LightGBM 自动择优
- ❌ 无 Smart 组 `uselightgbm: true`
- ❌ 无 373+ rule-provider 自动更新（Xray 依赖 `geosite.dat` / `geoip.dat` 数据库，不是 rule-provider 机制）
- ⚠️ `geosite:snapchat` 等关键字依赖 v2rayN 集成的 geosite 数据库；少量在 Clash 里使用的分类名在 v2fly 的 geosite 里可能不存在

要完整体验请改用路径 A（mihomo 核）或路径 B（sing-box 核），详见 `v2rayN/README.md`。
