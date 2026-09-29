# SingBox — 变更日志

> `SingBox/SingBox(sing-box)-full.json`（完整配置，由脚本生成）的变更日志。
> 本目录只发布 Full 配置。

---

## v6.0.14-sing.5 (2026-09-29)

- SYNC：第 001 fused SRS 加入微信 HTTPDNS 两个精确域名并绑定 DIRECT 出站，优先于 BlockHttpDNS 拦截。
- VERIFY：Full JSON 继续使用 69 个 fused SRS、76 个 remote rule_set 与 88 条路由规则。

## v6.0.13-sing.4 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：第 013 fused SRS 增加 `linuxdo.org` domain_suffix 并绑定国内网站出站；`linux.do` 保持 GFW 出站。
- SYNC：Full JSON 继续使用 69 个 fused SRS、76 个 remote rule_set 与 88 条路由规则。

## v6.0.12-sing.3 (2026-09-01)

- FIX#181-PC：首段 fused SRS 增加 `login.nvidia.cn` 精确域名并绑定 `DIRECT`；其余 NVIDIA 域名仍由下载出站处理。
- SYNC：Full JSON 保持 69 个 fused SRS、76 个 remote rule_set 与 88 条路由规则。

## v6.0.11-sing.2 (2026-08-22)

- Full JSON 由最终 fused SRS 重生成：Gemini 与 Accademia Gemini 的首命中由 AI 改为 Google，其他 AI 规则保持原有策略和顺序。

## v6.0.10-sing.2 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：Full JSON 与首段 fused SRS 重新生成；两个网易游戏服务主机固定走 `DIRECT`，不继承国内游戏出站选择。

## v6.0.9-sing.1 (2026-07-19)

- Full JSON 重新生成：`api.github.com` 默认进入工具组，原生 `process_name + domain` 规则仅为 `Code Helper` / `Code Helper (Plugin)` 保留 AI 路由。

## v6.0.8-sing.1 (2026-07-15)

- 全量同步国内权威优先级；65 个融合 `.srs` 远程资产使用发布版本缓存键。

## v6.0.7-sing.1 (2026-07-14)

- FIX#176：Full JSON 重新生成，国内域名 SRS 路由在共享 CDN / GeoIP 的国际 SRS fallback 前匹配；通用国际 fallback 独立为后置语义段。

## v6.0.6-sing.1 (2026-07-14)

- DIRECT-WORKPRO-WEB：Full JSON 重新生成，`scki-fused-008-direct` 的原生 SRS 源同时包含 `process_name: WorkPro.exe` 与 `WorkProWebProcess.exe`，Windows / Linux / macOS 进程匹配路径均路由至 direct outbound。

## v6.0.5-sing.1 (2026-07-14)

- DIRECT-WORKPRO：Full JSON 重新生成，scki-fused-008-direct 的原生 SRS 源包含 process_name WorkPro.exe 并路由至 DIRECT；官方字段仅用于 Linux / Windows / macOS。

## v6.0.4-sing.1 (2026-07-13)

- DIRECT-ITWDB：Full JSON 由融合结果重新生成，`scki-fused-008-direct` 的 `.srs` / route 语义包含 `itwdb.com`，覆盖其全部子域名并落到 direct outbound。

## v6.0.3-sing.1 (2026-07-12)

- SYNC：Full JSON 由融合 manifest 重新生成，65 个唯一非空 `.srs`、72 个 remote rule_set（65 fused + 7 runtime GEO）和 82 条 route rule。
- AI-PRECEDENCE：新增早期 AI guard SRS，ChatGPT 的 Sentry/DataDog telemetry 不会被后续广告规则抢占；OpenAI / oaistatic / Cloudflare 关联域名保持在 AI 路径。
- BUILD：生成器不再硬编码广告 fused segment ID，按 manifest 的广告策略动态定位，避免插入前置语义段时发生路由引用漂移。

## v6.0.2-sing.1 (2026-07-10)

- SYNC：Full JSON 升级到 Clash Party v6.0.2；113 个 Mihomo bucket provider 按 manifest 合并为 64 个非空、唯一 `.srs`，不再为同一 SRS 建立多个 tag 和重复路由。
- TARGET-MATERIALIZATION：sing-box headless rule-set 不支持 GEOIP / IP-ASN 字段，因此仅在 sing-box 目标中将这些规则解析为 CIDR；下载失败或空结果直接中止构建。
- PERF：64 个 `.srs` 聚合约 4.06 MiB；Full JSON 为 71 个 remote rule_set（64 fused + 7 runtime GEO）和 81 条 route rule。

## v6.0.1-sing.1 (2026-07-10)

- SYNC：Full JSON 由生成器重新生成并升级至 Clash Party v6.0.1 基线。
- DELIVERY：sing-box 继续使用 68 个 `.srs` 融合规则集；Issue #174 的文本规则分片不改变 `.srs` 路径、route 语义或 GEO runtime rule_set。

## v6.0.0-sing.1 (2026-07-09)

- FUSED-RULESETS：生成器基线更新到 Clash Party v6.0.0，将融合 provider 映射到 `rulesets/generated/fused/sing-box/*.srs`。
- SCALE：Full JSON 当前包含 120 个 route rule_set（113 个融合规则集 + 7 个 GEO runtime rule_set）与 130 条 route rules。

## v5.4.39-sing.1 (2026-07-09)

- SYNC：生成器基线更新到 Clash Party v5.4.39，并重新生成 Full JSON。
- SCKI-MRS-BRIDGE：SingBox 不消费 Mihomo `.mrs`；生成器改为读取 `rulesets/generated/mihomo-mrs/manifest.json`，把已迁移为 `.mrs` 的 `scki-*` 补充规则回溯到原始 `.list` 并展开为原生 route rules。
- VERIFY：Full JSON 当前 40 个 remote rule_set、660 条 route rules；Cloudflare R2 与 Douyin / `zjcdn.com` 前置守卫继续位于广告、TikTok 和国外兜底之前。

## v5.4.38-sing.1 (2026-07-09)

- SCKI-SUPPLEMENTAL：生成器会读取 `rulesets/supplemental/clash/*.list` 并展开为 sing-box route rules。
- SYNC：Full JSON 重新生成，基线更新到 Clash Party v5.4.38。

## v5.4.37-sing.1 (2026-06-29)

- META#170-DNS-POLICY：`SingBox(sing-box)-generator.js` 跟随 Clash Party v5.4.37 更新版本元数据并重新生成 Full JSON。
- N/A：sing-box 使用原生 `dns.rules` / `dns.servers`，没有 Mihomo `nameserver-policy` 同字段面；现有 `geosite-cn` / `cn-ip` 走 `dns_direct`、最终走 `dns_proxy` 的 DNS 语义不变。

## v5.4.36-sing.1 (2026-06-29)

- CLEAN#171-DIRECT：`SingBox(sing-box)-generator.js` 对齐 Clash Party v5.4.36 并重新生成 Full JSON。
- route rules 删除 22 条经逐条确认的冗余 domain / domain_suffix 规则，remote rule_set 保持不变。

## v5.4.35-sing.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM：`SingBox(sing-box)-generator.js` 跟随 Clash Party v5.4.35 基线重新生成 Full JSON。
- 说明：被删 8 个上游 provider 均不属于 SingBox remote rule_set 映射输出；后置 Douyin 重复直写规则清理后，route rules 687 → 684。

## v5.4.34-sing.1 (2026-06-28)

- ★ FIX#169-AMAP：`SingBox(sing-box)-generator.js` 跟随 Clash Party v5.4.34，将 MetaCubeX `amap` 映射为 sing-box `amap.srs` rule_set。
- `SingBox(sing-box)-full.json` 已由 generator 重新生成，`amap` route 位于国外网站 `proxy` 宽兜底之前并输出到 `🏠 国内网站`。

## v5.4.33-sing.1 (2026-06-27)

- ★ FEAT#169-AI-CODING：`SingBox(sing-box)-generator.js` 将 `vpsdance-ai-coding` 映射到 VPSDance `rules/sing-box/coding.json`。
- Full JSON 已由 generator 重新生成，新增 1 个 source JSON remote rule_set。

## v5.4.32-sing.1 (2026-06-25)

- ★ FIX#168-CN-GAME：`SingBox(sing-box)-generator.js` 跟随 Clash Party v5.4.32 生成国内游戏 route 早于 HoYoverse / Game / category-games 宽规则的 Full JSON。
- Full JSON 由 generator 重新生成，保持 meta version/build/baseline 一致。

## v5.4.31-sing.1 (2026-06-20)

- ★ FIX#167-DOUYIN：`SingBox(sing-box)-generator.js` 跟随 Clash Party v5.4.31 生成抖音 Web 国内流媒体前置 route，`zjcdn.com` 等域名在 TikTok / 国外尾部前命中 `📺 国内流媒体`。
- `SingBox(sing-box)-full.json` 已由 generator 重新生成。

## v5.4.30-sing.1 (2026-06-17)

- ★ FEAT#166-GOOGLE：`SingBox(sing-box)-generator.js` 新增 `🔍 Google 服务` selector，位置在 `🔧 工具与服务` 之前。
- Scholar、Google 基础服务、Google IP 与 Google QUIC route 改投新组；`SingBox(sing-box)-full.json` 已由 generator 重新生成。

## v5.4.29-sing.1 (2026-06-10)

- ★ PERF#165-LATENCY：`SingBox(sing-box)-generator.js` 将所有 `urltest` 出站组（当前 2 个聚合组）`interval` 从官方默认/既有 `3m` 调整为 `5m`，对应 300s 全端统一。
- `SingBox(sing-box)-full.json` 由 generator 重新生成，元数据对齐 Clash Party v5.4.29。

## v5.4.27-sing.1 (2026-06-07)

- ★ CLEAN#165：由 `SingBox(sing-box)-generator.js` 重新生成 Full JSON，同步基线去掉 Claude / PayPal / HBO / Hulu / Xbox 上游规则集已覆盖的直写域名 route rules。

## v5.4.26-sing.1 (2026-06-07)

- ★ FIX#164：腾讯 WorkBuddy `copilot.tencent.com` 国内直连防吞。SingBox Full 由 `SingBox(sing-box)-generator.js` 执行基线 Clash Party JS 自动生成——基线在所有 AI rule-set 之前新增的 `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站` 已随重新生成自动转译进 `route.rules`（`domain_suffix:["copilot.tencent.com"] → outbound:"🏠 国内网站"`，位于 `geosite:openai` rule_set 之前）。基线 Clash Party v5.4.26。

## v5.4.25-sing.2 (2026-06-05)

- ★ FIX#SING-QUIC-P0：generator 不再把 Clash `MATCH` 转成无条件 route rule；兜底由 `route.final` 承载，避免遮蔽后续 QUIC 精细化规则。
- ★ FIX#SING-QUIC-ORDER：6 条 sing-box QUIC 规则插入到主线 5 条 AND/QUIC 规则位置，而不是追加到末尾。
- ★ SYNC#GROUP-ORDER：业务组顺序调整为与 Clash Party 基线一致（香港/台湾/日韩/欧洲流媒体位于其他国外流媒体之前）。
- ★ VERIFY：合同验证新增 SingBox 业务组顺序与无条件 FINAL route rule 检查；`SingBox(sing-box)-full.json` 已重新生成。

## v5.4.25-sing.1 (2026-06-04)

- ★ SYNC：`SingBox(sing-box)-full.json` 重新生成并对齐 Clash Party v5.4.25 元数据。
- ★ CLEAN：同步基线去重，删除已由 route rule 集中区块覆盖的 `geoip:netflix` / `geoip:google` 重复路由。
- ★ FIX#SING-GEN-P2：generator 不再读取旧的 `SingBox(sing-box)-full.json` 作为 base，改用干净内置 baseConfig，避免历史生成产物污染后续生成。

## v5.4.23-sing.1 (2026-06-02)

- ★ FIX#161：generator 自动从主线派生 `domain_suffix: zhimg.com / zhihu.co` → 🏠 国内网站 route rule（知乎图片 CDN + 短链，重新生成 JSON）。

## v5.4.22-sing.1 (2026-05-31)

- ★ GeTui(个推)推送 SDK `getui.com` / `getui.net` / `gepush.com` 直连（review 后补；由主线 allowlist 自动派生后重新生成 route.rules）。

- #1 借鉴 Proxy-override：QUIC 精细化——generator.js 扩展硬编码 6 条 route rule（白名单 4 + CN 放行 + 其余 REJECT）；AND 复合规则不入 toSingRule()。

## v5.4.21-sing.1 (2026-05-31)

#4 借鉴 Proxy-override：bootstrap 从 `udp://IP:53` 升级为 `https://IP/dns-query` + TLS SNI 覆盖（dns.alidns.com / cloudflare-dns.com / dns.google）；消除 bootstrap 阶段 DNS 泄漏。generator.js bump 后重新生成。

## v5.4.20-sing.1 (2026-05-30)

- N/A#6 节点过滤关键词补充（批 B）：sing-box 为静态 outbound 列表（用户自接入节点，无订阅 junk 过滤），#6 不适用。generator.js 版本/基线 bump 后重新生成，route.rules 不变（1077→725 转换）；版本跟随 Clash Party v5.4.20 基线对齐。

## v5.4.19-sing.1 (2026-05-30)

借鉴 Proxy-override 批 A · #2 国内 SDK/CDN 直连前置（由主线 Smart JS 规则自动派生后重新生成；spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- 重新生成后 `route.rules` 自动纳入主线新增的 #2 规则：`jpush.cn` / `jpush.io` / `msg.umeng.com` → DIRECT；`baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` → 🏠 国内网站
- #3 fake-ip-filter 不适用（sing-box 不使用 fake-ip 增强模式）；#5 `direct-nameserver-follow-policy` 不适用（sing-box DNS 结构由 generator 独立构建，非 mihomo 字段）
- 🔢 版本：v5.4.18-sing.1 → v5.4.19-sing.1（generator VERSION / BUILD / BASELINE 同步；全产物统一对齐 v5.4.19）

## v5.4.18-sing.1 (2026-05-27)

- ✅ FIX#SING-DNS-REDUNDANCY：DNS server 各路径补齐冗余，消除单点故障
  - `dns_bootstrap` 加 `dns_bootstrap2` / `dns_bootstrap3` / `dns_bootstrap4`（119.29.29.29 / 1.1.1.1 / 8.8.8.8）
  - `dns_direct` 加 `dns_direct2`（doh.pub DoH），`dns_proxy` 加 `dns_proxy2`（dns.google DoH）
  - 对齐 Clash Party 基线 `default-nameserver` 4 IP + `nameserver` 2 DoH + `proxy-server-nameserver` 4 DoH
- ✅ FIX#SING-RULESET-DEDUP：消除 route.rule_set 中的重复 .srs 下载
  - 移除 `geosite-cn` / `geoip-cn`（与 provider 派生的 `cn` / `cn-ip` URL 完全重复）
  - DNS rules 改为引用已有 tag `cn` / `cn-ip`，减少 ~2-5 MB 冗余下载

## v5.4.17-sing.2 (2026-05-26)

- ✅ FIX#DNS-SINGBOX-SELECTOR：`dns_proxy.detour` 改回 `🚀 节点选择`
  - 避免默认国外 DNS 直接绕过用户主选择器进入 `🌍 全球节点` urltest 链
  - 保留 Cloudflare DoH + `dns_bootstrap` 自举结构不变

## v5.4.17-sing.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP：由生成器重建 Full JSON，同步 v5.4.17 DNS split-bootstrap 语义
  - `dns_bootstrap` 保留纯 IP 自举；`dns_direct` 改为 AliDNS DoH，`dns_proxy` 改为 Cloudflare DoH
  - 新增 `geosite-private` / `geosite-cn` / `geoip-cn` DNS rule-set，国内与私有域名显式走 `dns_direct`
  - `dns.final` 保持 `dns_proxy`

## v5.4.16-sing.2 (2026-05-22)

- ✅ FEAT#GAME-ACCEL：由生成器重建 Full JSON，新增游戏加速器 `process_name -> DIRECT` 规则
  - 新增 16 条 process_name 规则（UU / 小黑 / 迅游 / 雷神 / NNer 加速器）
  - 生成器自动从 Clash Party JS 规则转换

## v5.4.16-sing.1 (2026-05-20)

- ✅ FIX#149-P0：由生成器重建 Full JSON，前置 `paddle.com -> 🏦 金融支付`
  - `route.rules` 中 Paddle 规则位于 `anti-ad` / `category-ads-all` reject 规则之前
  - `_meta` 同步 Clash Party v5.4.16

## v5.4.15-sing.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER：同步 Clash Party v5.4.15 元数据，生成器基线更新到 Clash Party v5.4.15。
- ♻️ REFACTOR#AD-FP-MODULE：由生成器重建 Full JSON；route.rules 顶部保持广告误伤白名单同序前置。

## v5.4.14-sing.1 (2026-05-20)

- ✅ FIX#CF-R2-P0：由生成器重建 Full JSON，前置 `cloudflarestorage.com -> 🌐 国外网站`
  - 生成后的 `route.rules` 中 Cloudflare R2 存储域位于 `anti-ad` / `category-ads-all` reject 规则之前
  - `_meta` 同步 Clash Party v5.4.14

## v5.4.13-sing.1 (2026-05-19)

- ✅ FIX#STUN-PORTS：由生成器重建 Full JSON，补齐 STUN/TURN 标准端口直连规则
  - route rules 新增 `5349 / 19302 / 19305 / 19307 -> DIRECT`，并保留 `3478 / 3479`
- N/A#FAKE-IP：sing-box 静态产物无 Mihomo `fake-ip-filter` 等价字段

## v5.4.12-sing.1 (2026-05-12)

- META#RD-REALIP: Regenerated Full JSON against Clash Party v5.4.12 after the Mihomo RustDesk real-IP DNS fix.
- N/A#FAKE-IP: sing-box has no Mihomo fake-ip-filter equivalent in this static artifact; RustDesk route semantics are unchanged.

## v5.4.11-sing.1 (2026-05-12)

- ✅ FIX#RD-PROC：生成器将 RustDesk `process_name` 输出到 `🧑‍💼 会议协作`，不再输出到 `DIRECT`
- ✅ FIX#RD-DOMAIN：`domain_suffix: rustdesk.com` 保持会议协作兜底
- ✅ FIX#DNS-BOOTSTRAP：`dns_direct` 改为 `udp://223.5.5.5:53`，Full JSON 已由生成器重新生成（39 rule_set / 697 route rules）

## v5.4.9-sing.1 (2026-05-11)

- ✅ FEAT#LOCAL-TOOLS：由生成器同步 Clash Party v5.4.9 的桌面本地工具直连白名单
  - `PROCESS-NAME` 自动转换为 sing-box `route.rules[].process_name -> DIRECT`
  - 按 sing-box 官方能力，仅 Linux / Windows / macOS 支持 `process_name` 命中；移动端不依赖该清单


## v5.4.8-sing.1 (2026-05-09)

- ★ ORDER#RULE-TAIL：同步 Clash Party v5.4.8 route.rules 尾段匹配顺序
  - outbounds/UI 顺序不变；仅调整 route.rules 顺序

## v5.4.7-sing.1 (2026-05-09)

- ★ FEAT#TikTok：新增独立 `🎵 TikTok` 业务组（32 业务组），置于 `📺 国内流媒体` 与 `🎥 Netflix` 之间
  - BIZ 加 `TOK: '🎵 TikTok'`，businessOutbounds 加对应 selector；运行 generator 重新生成 full JSON
- ★ FIX#HK：SingBox 使用静态 outbound 列表（无运行时节点分类），豁免（§1.4）

## v5.4.6-sing.1 (2026-05-08)

- ★ FEAT#145：WeChat CDN 直连 — 新增 `domain_suffix: cdn.weixin.qq.com` → `outbound: DIRECT`
  - 置于 iwipwedabay.com 后、binance 前
  - 跟随 Clash Party v5.4.6 基线

## v5.4.5-sing.1 (2026-05-07)

- ★ 全球节点置顶 + 全产品组顺序同步（跟随基线 v5.4.5）

## v5.4.4-sing.1 (2026-05-07)

- ★ FIX#144：bbys.app 视频播放走直连——新增 `domain_suffix: bbys.app` → `outbound: DIRECT`
  - 该域名未被现有 rule-provider 覆盖，视频 CDN 子域可能解析到非 CN IP 走代理导致黑屏
  - 由生成器自动从 Clash Party v5.4.4 基线重新生成
- ★ FIX#142（DNS nameserver 兜底）：SingBox 无运行时 DNS 创建逻辑，豁免
- ★ FEAT#143（IEPL/IPLC 家宽识别）：SingBox 按静态 outbound 列表，不涉及节点分类运行时逻辑，豁免
- Bump: `v5.4.0-sing.1` → `v5.4.4-sing.1`

## v5.4.0-sing.1 (2026-05-05)

- ★ FEAT#SG：新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立区域组
  - 新加坡从 🌏 亚太节点 中拆分为独立区域
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51
  - 跟随基线 Clash Party v5.4.0

## v5.3.2-sing.1 (2026-04-28)

- ★ **微信/QQ 全系列进程强制 DIRECT**（跟随 Clash Party v5.3.2 基线，由生成器自动重生成）
  - `route.rules[].outbound`：新增 WeChatAppEx.exe / QQ.exe / WeChat.exe → `DIRECT`
  - 版本号 `v5.3.1-sing.1` → `v5.3.2-sing.1`

## v5.3.1-sing.1 (2026-04-28)

- ★ **Weixin.exe 进程强制 DIRECT**（跟随 Clash Party v5.3.1 基线，由生成器自动重生成）
  - `route.rules[].outbound`：Weixin.exe → `DIRECT`（原 `🏠 国内网站`）
  - 版本号 `v5.3.0-sing.1` → `v5.3.1-sing.1`

## v5.3.0-sing.1 (2026-04-26)

- ★ REFACTOR#2：流媒体分组架构重构——按区域 → 按平台（7→13 流媒体组）
  - 拆出 5 个主流平台独立组：🎥 Netflix / 🎬 Disney+ / 📡 HBO/Max / 📺 Hulu / 🎬 Prime Video
  - 拆出 2 个全球平台独立组：📹 YouTube / 🎵 音乐流媒体
  - 保留 4 个区域锁区组：🇭🇰 香港流媒体 / 🇹🇼 台湾流媒体 / 🇯🇵 日韩流媒体 / 🇪🇺 欧洲流媒体
  - 新增 🌐 其他国外流媒体 兜底（接收长尾平台 + 原东南亚流媒体）
  - 业务组 25→31，总组 43→49
## v5.2.11-sing.1 (2026-04-26) — 业务组合并精简 28→25（降低用户认知负担）

- ★ **REFACTOR#1**：跟随 Clash Party v5.2.11 基线，业务组合并精简
  - 合并 🔍搜索引擎 + 📟开发者服务 → 新增 🔧工具与服务
  - 合并 📧邮件服务 → 🌐国外网站
  - 合并 ☁️云与CDN → 🌐国外网站
  - 📥下载更新 策略从 DIRECT 优先改为代理优先
  - 🛰️BT/PT Tracker 保留独立
- Bump: `v5.2.10-sing.1` → `v5.2.11-sing.1`

## v5.2.10-sing.1 (2026-04-25) — 境外 DoH 端点改路由到 🚫 受限网站

- ★ **FIX#39**（同构联动）：跟随 Clash Party v5.2.10 基线，由生成器自动重生成
  - `route.rules[].outbound`：
    - `dns.google` / `dns.google.com`：`☁️ 云与CDN` → `🚫 受限网站`
    - `cloudflare-dns.com`（domain_suffix）：`☁️ 云与CDN` → `🚫 受限网站`
  - `dns.servers[].server: cloudflare-dns.com` 保留不动（这是 DoH 上游服务器定义，不是路由规则）
- ★ 同步 `SingBox(sing-box)-generator.js` 顶部 `VERSION` / `BASELINE` 常量
- Bump: `v5.2.9-sing.3` → `v5.2.10-sing.1`（主版本追平到 v5.2.10）

---

## v5.2.9-sing.3 (2026-04-25) — 兼容性审计修复

- ★ FIX-Sing-01：DNS 服务器添加 `domain_resolver` 避免域名解析循环依赖
  - 新增 `dns_bootstrap`（UDP 53 → 223.5.5.5）作为 bootstrap
  - `dns_direct` / `dns_proxy` 添加 `domain_resolver: "dns_bootstrap"`
  - 官方文档要求：HTTPS DNS 使用域名时必须设置 `domain_resolver`
- ★ FIX-Sing-02：`download_detour` → `http_client` 迁移（sing-box v1.14.0+ 弃用）
  - 全部 ~50+ rule_set 条目替换为 `http_client: { detour: "🌍 全球节点" }`
  - 同步更新生成器 `SingBox(sing-box)-generator.js`
- ★ FIX-Sing-03：移除已弃用的 `cache_file.store_rdrc`（v1.14.0 弃用，v1.16.0 移除）
- Bump: `v5.2.8-sing.2` → `v5.2.9-sing.3`, build 2026-04-25

## v5.2.8-sing.2 (2026-04-23) — 修复港澳台 B 站（szkane-bilihmt）缺失

- ★ FIX：Full 配置之前**静默丢失**了 `szkane-bilihmt`（港澳台哔哩哔哩）。
  - 根因：`SingBox(sing-box)-generator.js` 的 `toSrsUrl()` 只识别 MetaCubeX `meta-rules-dat@meta/*.mrs` 和 DustinWin ads 两种 URL；szkane 的 `ClashRuleSet@main/Clash/Ruleset/BilibiliHMT.list` 不匹配 → provider 被 `filter(Boolean)` 丢弃 → `RULE-SET,szkane-bilihmt,🇭🇰 香港流媒体` 规则也被 `availableRuleSets` 过滤成 `null`。
  - 结果：用户在 sing-box 上访问港澳台番剧域名（如 `p.bstarstatic.com` / `upos-bstar-*.akamaized.net`）会落到后续规则或 FINAL，不会路由到 🇭🇰 香港流媒体，可能触发港澳台 B 站 412 校验。
- ★ 修法：在 `toSingRule()` 的 `RULE-SET` 分支里特判 `szkane-bilihmt`，用内联默认规则（`domain` × 5 / `domain_suffix` × 3 / `ip_cidr` × 13，共 21 条，与 szkane 上游一致）替代 remote rule_set 引用。
  - sing-box 同一默认规则内 `domain` / `domain_suffix` / `ip_cidr` 默认 OR 组合（见 [sing-box Route Rule](https://sing-box.sagernet.org/configuration/route/rule/)）。
- ★ Full 产物 `_meta.version` bump 到 `v5.2.8-sing.2`。

### 自检摘要

- `node SingBox/SingBox(sing-box)-generator.js` 重新生成后：
  - `route.rules` = 624（比 sing.1 的 623 多 1 条，即恢复的 HMT 规则）
  - 其中含有 `outbound: "🇭🇰 香港流媒体"` 且 `domain_suffix` 包含 `bilibili.com`/`bilibili.tv`/`acgvideo.com` 的 1 条内联规则
  - `outbounds` selector/urltest 数仍为 47
- JSON 合法性：`python3 -c 'import json;json.load(open("SingBox/SingBox(sing-box)-full.json"))'` 通过。

### 官方文档证据

- [sing-box Route Rule](https://sing-box.sagernet.org/configuration/route/rule/)：默认规则同类字段（`domain` / `domain_suffix` / `domain_keyword` / `ip_cidr` / `ip_is_private` 等）以 `||` 组合，跨类以 `&&` 组合——单条 inline 规则里混用 domain/ip_cidr 的 OR 语义正确。

---

## v5.2.6-sing.5 (2026-04-23) — 删除 SingBox 非 Full 产物

- ★ 删除旧的非 Full SingBox JSON 产物，本目录只保留 Full 配置。
- ★ `SingBox/SingBox(sing-box)-generator.js` 改为读取并重写 `SingBox/SingBox(sing-box)-full.json`，Full 产物同时作为布局模板，避免保留第二份用户可导入配置。
- ★ 清理 SingBox README、根 README、项目契约、Issue 模板和 workflow 中对已删除 SingBox 文件的引用。
- ★ Full 产物 `_meta.version` bump 到 `v5.2.6-sing.5`。

### 自检摘要

- `node SingBox/SingBox(sing-box)-generator.js` 可重新生成 Full。
- `SingBox/SingBox(sing-box)-full.json` JSON 解析通过。
- Full 仍为 38 个 selector/urltest 出站组、39 个 remote rule_set、623 条路由规则。

---

## v5.2.6-sing.4 (2026-04-23) — 修复 DNS rule_set 引用 + Full 规则集 URL 兼容

- ★ `dns.rules[*].rule_set` 与 Full 的 `route.rule_set` tag 对齐，避免引用未定义规则集。
- ★ Full 生成器停止把 Clash/Mihomo 规则源机械改成 `.srs`。
  - MetaCubeX `meta-rules-dat@meta/*.mrs` 正确映射到 `meta-rules-dat@sing/*.srs`。
  - DustinWin `anti-ad` 改用其 `sing-box-ruleset/ads.srs`。
  - blackmatrix7 / ACL4SSR / Accademia 等 Clash YAML/list 规则源不再伪装成 `.srs`。
- ★ 广告路由生成时统一转成 `action: "reject"`，不再导向只有 `DIRECT` 的广告 selector。

### 官方文档证据

- [sing-box Rule Set](https://sing-box.sagernet.org/configuration/rule-set/)：remote rule-set 需要 `tag` / `format` / `url`，`format` 为 `source` 或 `binary`。
- [sing-box Source Format](https://sing-box.sagernet.org/configuration/rule-set/source-format/)：`source` 是 sing-box JSON `{version,rules}`，不是 Clash YAML。
- [sing-box DNS Rule](https://sing-box.sagernet.org/configuration/dns/rule/)：DNS rule 可通过 `rule_set` 匹配已定义的 rule-set。
- [sing-box Route Rule Action](https://sing-box.sagernet.org/configuration/route/rule_action/)：`reject` 是原生 action。
