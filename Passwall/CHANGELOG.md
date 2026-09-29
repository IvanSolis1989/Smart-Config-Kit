# Passwall — 变更日志

> `Passwall/` 目录的变更日志（Passwall 全功能版专属参考；四列表 + shunt_rules + ACL 三层架构）。
> 与 `Passwall2/` 目录（精简分流版参考）内容互通——两者共用 `shunt_rules.lua` 解析器，同一份 `.list` 互通。
> 本目录提供从 `rulesets/generated/fused/sing-box/*.srs` 生成的 69 条非空原生 fused shunt rule 降级参考。
> 主版本号跟随 Clash Party 主线；尾段 `-pw.N` 独立递增。

---

## v6.0.14-pw.5 (2026-09-29)

- SYNC：第 001 fused SRS shunt rule 加入微信 HTTPDNS 两个精确域名并保持 direct 国内语义。
- VERIFY：继续发布 69 条非空 shunt rule，远程资产缓存键升级为 `v6.0.14`。

## v6.0.13-pw.4 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：第 013 fused SRS shunt rule 增加 `linuxdo.org` 后缀并保持 direct 国内语义；`linux.do` 保持第 059 proxy 语义。
- SYNC：继续发布 69 条非空 shunt rule，发布缓存键升级为 `v6.0.13`。

## v6.0.12-pw.3 (2026-09-01)

- FIX#181-PC：重建首段 fused SRS shunt rule，`login.nvidia.cn` 由 `direct` 优先处理；其余 NVIDIA 域名保持下载组语义。
- SYNC：继续发布 69 条非空 shunt rule，发布缓存键升级为 `v6.0.12`。

## v6.0.11-pw.2 (2026-08-22)

- 69 条 fused SRS shunt rule 从最终 manifest 重建；Gemini 与 Accademia Gemini 段改走 Google 语义，szkane AI 段及顺序保持不变。

## v6.0.10-pw.2 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：重建首段 fused SRS shunt rule；两个网易游戏服务主机在国内游戏 shunt rule 前固定由 `direct` 处理。

## v6.0.9-pw.1 (2026-07-19)

- 重建 66 条 fused shunt rule；路由器端无桌面进程身份，`api.github.com` 通过前置通用工具组段处理。

## v6.0.8-pw.1 (2026-07-15)

- 65 条 fused shunt rule 同步国内权威优先级，并为远程 `.srs` 使用发布版本缓存键。

## v6.0.7-pw.1 (2026-07-14)

- FIX#176：65 条 fused SRS shunt rule 重生成；国内域名段在通用国际 CDN / GeoIP fallback 之前，路由器端保持与源图相同的首匹配顺序。

## v6.0.6-pw.1 (2026-07-14)

- SYNC：fused SRS shunt rule 已随 v6.0.6 重建；Passwall 路由器端无法看到 LAN 客户端的 `WorkPro.exe` / `WorkProWebProcess.exe`，不承诺进程级命中。

## v6.0.5-pw.1 (2026-07-14)

- PLATFORM：fused SRS shunt rule 已重建；Passwall 路由器端无法看到 LAN 客户端 WorkPro.exe，不承诺进程级命中。

## v6.0.4-pw.1 (2026-07-13)

- DIRECT-ITWDB：从 `scki-fused-008-direct.srs` 重建默认直连 shunt rule；`itwdb.com` 与 WorkPro 子域名不再需要 Passwall 手写域名列表。

## v6.0.3-pw.1 (2026-07-12)

- SYNC：从 v6.0.3 fused sing-box 目标重新生成 65 条非空 `rule-set:remote` shunt rule、apply 脚本和参考配置。
- AI-PRECEDENCE：新增的 AI telemetry guard 在广告和国外网站 fallback 前保持顺序生效，所有 shunt URL 只引用仓库 fused `.srs`。

## v6.0.2-pw.1 (2026-07-10)

- SYNC：从 v6.0.2 fused sing-box 目标重新生成 64 条非空 `rule-set:remote` shunt rule、apply 脚本和参考配置。
- PERF：64 个 `.srs` 聚合约 4.06 MiB，继承 GEOIP/ASN 目标物化和全局精确去重；按最终 SRS 的 IP 内容设置 Domain/IP 双列表标志，不直接调用任何上游规则集。

## v6.0.1-pw.1 (2026-07-10)

- SYNC：从 fused sing-box JSON 重新生成 apply 脚本、参考配置和 68 条 shunt rule，基线升级到 Clash Party v6.0.1。
- DELIVERY：Passwall 保持 `rule-set:remote` `.srs` 原生 fallback；Issue #174 的移动端文本分片不改变其 68 条 shunt 映射或策略语义。

## v6.0.0-pw.2 (2026-07-09)

- FUSED-PASSWALL：`Passwall(xray+sing-box)-apply.sh`、参考 `.conf` 与 `shunt-rules/*.list` 改由 `tools/generate-fused-fallback-artifacts.js` 生成。
- SCOPE：每条 shunt rule 只引用对应的 `rulesets/generated/fused/sing-box/*.srs` 远程规则集；旧 33 条手写域名/IP 展平列表全部移除，Passwall 不再作为规则内容维护面。

## v6.0.0-pw.1 (2026-07-09)

- META：跟随 Clash Party v6.0.0 更新版本元数据。
- SCOPE：Passwall 继续作为 shunt_rules 展平降级参考；融合规则集主线不从 Passwall 反向生成。

## v5.4.39-pw.1 (2026-07-09)

- META：跟随 Clash Party v5.4.39 更新版本元数据。
- N/A：Passwall 展平 shunt rules 不消费 Mihomo `.mrs` rule-provider；`.list` 规则语义延续 v5.4.38-pw.1。

## v5.4.38-pw.1 (2026-07-09)

- META：跟随 Clash Party v5.4.38 更新版本元数据。
- SCOPE：Passwall 展平 shunt rules 继续保持本地 `.list` 结构，不直接引用公共 supplemental URL。

## v5.4.37-pw.1 (2026-06-29)

- META#170-DNS-POLICY：跟随 Clash Party v5.4.37 更新版本元数据。
- N/A：Passwall 展平 shunt rule 不承载 Mihomo `nameserver-policy` DNS 字段；`.list` 规则语义不变。

## v5.4.36-pw.1 (2026-06-29)

- CLEAN#171-DIRECT：跟随 Clash Party v5.4.36 清理结果，删除展平规则 `channel4.com` / `sky.com`，其余候选不适用于 Passwall 展平层或需继续保留。
- 版本元数据同步；shunt 规则数量相应减少。

## v5.4.35-pw.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM：跟随 Clash Party v5.4.35 基线更新版本元数据。
- N/A：Passwall 展平降级参考不消费 Mihomo rule-provider；`domain:encoretvb.com` 仍作为香港流媒体静态覆盖保留，33 条 shunt rule 语义不变。

## v5.4.34-pw.1 (2026-06-28)

- ★ FIX#169-AMAP：`27-cn-site.list`、apply 脚本与参考 `.conf` 补充高德地图 / AMap 核心域名直连兜底。
- 覆盖 `a-map.cn` / `amap.com` / `amapauto.com` / `anav.com` / `autonavi.com` / `gaode.com` 等，避免 `webapi.amap.com` 依赖宽泛 CN 分类。

## v5.4.33-pw.1 (2026-06-27)

- ★ FEAT#169-AI-CODING：`02-ai-service.list`、apply 脚本与参考 `.conf` 补充 AI 编程工具域名兜底。
- N/A：VPSDance 暂无 sing-box `.srs` 输出，Passwall 降级参考不直接使用 `rule-set:remote`。

## v5.4.32-pw.1 (2026-06-25)

- ★ FIX#168-CN-GAME：Passwall shunt rule 创建顺序调整为国内游戏早于国外游戏/国外网站，并补齐米哈游、网易、WeGame、完美世界、TapTap 等国内游戏域名。
- `shunt-rules/21-cn-game.list` / `22-intl-game.list` 与 Passwall2 保持同源；`domain:mihoyo.com` 从国外游戏移入国内游戏。

## v5.4.31-pw.1 (2026-06-20)

- ★ FIX#167-DOUYIN：`08-cn-media.list`、apply 脚本与参考 `.conf` 补齐抖音 Web / `zjcdn.com` 视频 CDN 明确 `domain:` 兜底。
- Passwall 降级参考继续使用展平 shunt rules，不承载客户端规则顺序；本轮只补国内流媒体域名覆盖。

## v5.4.30-pw.1 (2026-06-17)

- ★ FEAT#166-GOOGLE：新增 `30-google.list` 与第 20 条 `🔍 Google 服务` shunt rule，承载 `geosite:google` / `geoip:google` / `domain:scholar.google.com`。
- 工具组重命名为 `31-tools.list`，仅保留非 Google 搜索和开发者服务；兜底列表顺延为 `32-final.list`，展平 shunt rules 总数调整为 33。

## v5.4.29-pw.1 (2026-06-10)

- N/A#165-LATENCY：Passwall 降级参考使用展平 shunt rules，不承载区域自动测速/健康检查字段；本轮仅元数据与 README 对齐 Clash Party v5.4.29。

## v5.4.27-pw.1 (2026-06-07)

- ★ CLEAN#165：`11-hbo-max.list` / apply 脚本删除已被 `geosite:hbo` 覆盖的 `domain:max.com` 与 `domain:hbomax.com` 本地兜底；v2fly domain-list-community 与 MetaCubeX geosite hbo 当前均包含这两个域名。

## v5.4.26-pw.1 (2026-06-07)

- 对齐基线 v5.4.26（FIX#164）。本产物**不受** `copilot.tencent.com` 误吞影响：Passwall AI 分流用 `geosite:copilot`（无 copilot 子串关键词，不会命中 `copilot.tencent.com`），且不消费 szkane `AiDomain.list`；`copilot.tencent.com` 顺流到国内直连规则，无需 `.list`/`.sh` 改动。仅 bump 版本。

## v5.4.25-pw.2 (2026-06-05)

- ★ MAINT#HEADER-LITE：apply 脚本头部移除多版本变更历史，仅保留轻量元信息并指向 `Passwall/CHANGELOG.md`，对齐仓库 CLAUDE.md §1.3 维护契约。

## v5.4.25-pw.1 (2026-06-04)

- ★ FIX#PW-KAKAO-P1：将 active Passwall 规则中的无效 `geosite:kakaotalk` 改为 `geosite:kakao`，并补 `domain:kakao.com` / `domain:kakaocorp.com` / `domain:kakaotalk.com` 兜底。
- ★ FIX#PW-IDEMPOTENT-P3：apply 脚本默认 `--replace`，运行前删除同名 Smart-Config-Kit shunt rules，避免重复运行追加 32 条副本；保留 `--append` 作为显式追加模式。
- ★ SYNC：版本头和参考 `.conf` 对齐 Clash Party v5.4.25。

## v5.4.23-pw.1 (2026-06-02)

- ★ FIX#161：`27-cn-site.list` 增 `domain:zhimg.com` + `domain:zhihu.co` → direct shunt（知乎图片 CDN + 短链，同步基线）。

## v5.4.22-pw.1 (2026-05-31)

- ★ GeTui(个推)推送 SDK `getui.com` / `getui.net` / `gepush.com` 加入 `27-cn-site.list`（review 后补；延续 #2，归 direct shunt；owner 选放行保 App 推送如米家）。

- N/A#1 QUIC 精细化：Passwall 不承载 QUIC 阻断，#1 不适用；版本跟随基线对齐。

## v5.4.21-pw.1 (2026-05-31)

- N/A#4 DoH-over-IP bootstrap：Passwall shunt_rules 不承载 DNS resolver，#4 不适用；版本跟随基线对齐。

## v5.4.20-pw.1 (2026-05-30)

- N/A#6 节点过滤关键词补充（批 B）：Passwall 无运行时节点分类 / junk 过滤器（静态 shunt_rules），#6 不适用；版本跟随 Clash Party v5.4.20 基线对齐。

## v5.4.19-pw.1 (2026-05-30)

借鉴 Proxy-override 批 A · #2 国内 SDK/CDN 直连前置（跟随 Clash Party v5.4.19；spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- `27-cn-site.list` [Domain List] 增加：`full:msg.umeng.com` + `domain:jpush.cn` / `jpush.io`（承载合法 App 推送；Passwall 无 jiguang/youmeng 拦截源，零冲突）+ `domain:baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com`（前端 CDN）→ 均归 direct shunt
- 不适用 #3 fake-ip-filter / #5 direct-nameserver-follow-policy（Passwall shunt_rules 不承载 fake-ip / mihomo DNS 字段）
- 🔢 版本：v5.4.17-pw.1 → v5.4.19-pw.1（全产物跳过烧毁的 .18 统一到 v5.4.19）

## v5.4.17-pw.1 (2026-05-26)

- N/A#DNS-SPLIT-BOOTSTRAP：Passwall shunt_rules 只承载分流规则，不承载 DNS resolver 配置
  - apply 脚本与参考 `.conf` 元数据同步 Clash Party v5.4.17
  - DNS split-bootstrap 由用户在 Passwall 节点/全局 DNS 页面按本机环境配置

## v5.4.16-pw.1 (2026-05-20)

- ✅ FIX#149-P0：金融支付 shunt rule 补充 `domain:paddle.com`
  - Passwall 不消费 anti-AD/DustinWin 远程源；作为降级参考，将 Paddle 许可/支付链路归入 `🏦 金融支付`

## v5.4.15-pw.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER：同步 Clash Party v5.4.15 元数据，新增 GEOSITE 覆盖台账引用。
- N/A#AD-FP-MODULE：Passwall shunt_rules 为降级参考，不消费 Sukka phishing / blackmatrix7 MIUI 远程源；规则列表保持 v5.4.14 语义。

## v5.4.14-pw.1 (2026-05-20)

- ✅ FIX#CF-R2-P0：`29-intl-site.list` 显式补齐 `domain:cloudflarestorage.com`
  - Passwall shunt_rules 不消费 Sukka phishing 源，当前 `geosite:category-ads-all` 也未命中该域；记录为同构同步
  - `Passwall(xray+sing-box)-apply.sh` 版本与基线同步到 Clash Party v5.4.14

## v5.4.13-pw.1 (2026-05-19)

- N/A#STUN-PORTS：Passwall shunt_rules 是域名/IP 列表模型，没有本仓库可安全写入的端口分流字段
- META#BASELINE：元数据跟随 Clash Party v5.4.13；域名/IP 展平列表不变

## v5.4.12-pw.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 baseline metadata after the Mihomo RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Passwall uses router-side shunt rules and LuCI DNS; no Mihomo fake-ip-filter rule is applicable.

## v5.4.11-pw.1 (2026-05-12)

- ✅ FIX#RD-DOMAIN：会议协作 shunt rule 补充 `domain:rustdesk.com`
- ℹ️ PROCESS-NAME / DNS 自举不适用：Passwall 运行在 OpenWrt 路由器端，看不到局域网客户端进程名；DNS 由 LuCI 全局方案托管

## v5.4.9-pw.1 (2026-05-11)

- ★ META#LOCAL-TOOLS：跟随 Clash Party v5.4.9 基线；Passwall 运行在路由器侧，无法观察 LAN 客户端进程名，本轮不把 PROCESS-NAME 清单展平进 shunt rules。
- `shunt-rules/*.list` 无业务语义变化；直连工具清单仅作为 PC 客户端兼容测试集维护。

## v5.4.8-pw.1 (2026-05-09)

- ★ ORDER#RULE-TAIL：同步 Clash Party v5.4.8 shunt rule 创建顺序
  - LuCI 分流规则顺序按新的中后段业务顺序排列

## v5.4.7-pw.1 (2026-05-09)

- ★ FEAT#TikTok：`geosite:tiktok` 从 `06-social.list` 移除，新建 `06b-tiktok.list` 独立分流
- ★ FIX#HK：Passwall 无运行时节点分类，豁免（§1.4）

## v5.4.6-pw.1 (2026-05-08)

- ★ FEAT#145：WeChat CDN 直连
  - `shunt-rules/27-cn-site.list` 新增 `domain:cdn.weixin.qq.com`（置于 bbys.app 之后、geosite:cn 之前）
  - 跟随 Clash Party v5.4.6 基线

## v5.4.5-pw.1 (2026-05-07)

- ★ 全球节点置顶 + 全产品组顺序同步（跟随基线 v5.4.5）

## v5.4.4-pw.1 (2026-05-07)

- ★ FIX#144：bbys.app 视频播放走直连
  - `shunt-rules/27-cn-site.list` 新增 `domain:bbys.app`（置于 geosite:cn 之前优先匹配）
- ★ FEAT#143（IEPL/IPLC 家宽识别）和 FIX#142（DNS 冷启动）均为 Clash Party JS 运行时逻辑，Passwall 静态规则豁免
- Bump: `v5.4.0-pw.1` → `v5.4.4-pw.1`

## v5.4.0-pw.1 (2026-05-05)

- ★ FEAT#SG：新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立区域组
  - 新加坡从 🌏 亚太节点 中拆分为独立区域
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51
  - 跟随基线 Clash Party v5.4.0
  - 注：SG 狮城节点豁免——无节点名称匹配，使用 geosite 路由

## v5.3.0-pw.3 (2026-04-26)

- ★ REFACTOR#2：流媒体分组架构重构——按区域 → 按平台（7→13 流媒体组）
  - 拆出 5 个主流平台独立组：🎥 Netflix / 🎬 Disney+ / 📡 HBO/Max / 📺 Hulu / 🎬 Prime Video
  - 拆出 2 个全球平台独立组：📹 YouTube / 🎵 音乐流媒体
  - 保留 4 个区域锁区组：🇭🇰 香港流媒体 / 🇹🇼 台湾流媒体 / 🇯🇵 日韩流媒体 / 🇪🇺 欧洲流媒体
  - 新增 🌐 其他国外流媒体 兜底（接收长尾平台 + 原东南亚流媒体）
  - 业务组 25→31，总组 43→49
## v5.2.10-pw.2 (2026-04-26) — ★ 跟随基线合并 4 组为 2 组

- ★ **代理组合并（基线同步）**：28 条 shunt rule 精简为 25 条
  - `📧 邮件服务` + `☁️ 云与CDN` → 合并到 `🌐 国外网站`（域名字段并入 `23-intl-site.list`）
  - `🔍 搜索引擎` + `📟 开发者服务` → 合并为 `🔧 工具与服务`（新设 `24-tools.list`）
  - `📥 下载更新`：推荐策略从 `direct` 调整为 `proxy`
- 文件变更：
  - `Passwall(xray+sing-box)-apply.sh`：移除 4 个旧组块，新增 1 个组，重新编号 28→25，版本 `v5.2.10-pw.2`
  - `Passwall(xray+sing-box).conf`：移除旧组节，新增 `[24] 工具与服务`，全部重编号
  - `shunt-rules/*.list`：删除 `05-email.list` / `18-search.list` / `19-dev.list` / `23-cloud-cdn.list`；剩余 20 个文件按新编号重命名；`27-intl-site.list` → `23-intl-site.list`（合并内容）；`22-download.list` → `19-download.list`（策略更新）；新建 `24-tools.list`
- README.md 已同步更新：移除 4 个旧组小节，新增 `🔧 工具与服务` 节，全部重编号，下载更新策略说明改为 proxy
- CHANGELOG 更新（本条）

## v5.2.10-pw.1 (2026-04-25) — 主版本追平（FIX#39 平台例外）

- ★ **FIX#39 同构审计 — 平台例外（CLAUDE.md §1.4）**：本轮主线把 `dns.google` /
  `cloudflare-dns.com` 从 `☁️ 云与CDN` 移到 `🚫 受限网站`，但 Passwall 的 shunt-rules
  里**没有这两个域名的特化条目**——它们由更上层的 `geosite:google`（`18-search.list`）
  和 `geosite:cloudflare`（`23-cloud-cdn.list`）覆盖。
  - 要把单个域名拆出来归到 `26-gfw.list`，必须在编号 < 18 的列表里前置一条特化匹配
    （Passwall 的 shunt-rules 按列表前缀数字顺序匹配，先命中先决策），
    这意味着要重排 18-search / 23-cloud-cdn 的覆盖范围，**超出本次最小修复的范围**。
  - 按 §1.4「平台专属字段 / 平台能力受限」标记为不同步，仅 bump 版本号追平基线。
- 唯一改动：脚本头部 `Version` 注释 `v5.2.8-pw.4` → `v5.2.10-pw.1`
- 后续如果用户对此有强需求，可单开 PR 重排 `shunt-rules/` 列表前缀（例如新增
  `19-gfw-priority.list` 在 google/cloudflare 命中前匹配）。

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
