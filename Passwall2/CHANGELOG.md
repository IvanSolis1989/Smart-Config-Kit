# Passwall / Passwall2 — 变更日志

> `Passwall2/` 目录的变更日志（目录名保留历史命名，实际产物同时适用 Passwall 全功能版 + Passwall2 精简分流版——两者共用 `shunt_rules.lua` 解析器，同一份 `.list` 互通）。
> 本目录提供从 `rulesets/generated/fused/sing-box/*.srs` 生成的 69 条非空原生 fused shunt rule 降级参考。
> 主版本号跟随 Clash Party 主线；尾段 `-pw2.N` 独立递增。

---

## v6.0.14-pw2.5 (2026-09-29)

- SYNC：第 001 fused SRS shunt rule 加入微信 HTTPDNS 两个精确域名并保持 direct 国内语义。
- VERIFY：继续发布 69 条非空 shunt rule，远程资产缓存键升级为 `v6.0.14`。

## v6.0.13-pw2.4 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：第 013 fused SRS shunt rule 增加 `linuxdo.org` 后缀并保持 direct 国内语义；`linux.do` 保持第 059 proxy 语义。
- SYNC：继续发布 69 条非空 shunt rule，发布缓存键升级为 `v6.0.13`。

## v6.0.12-pw2.3 (2026-09-01)

- FIX#181-PC：重建首段 fused SRS shunt rule，`login.nvidia.cn` 由 `direct` 优先处理；其余 NVIDIA 域名保持下载组语义。
- SYNC：继续发布 69 条非空 shunt rule，发布缓存键升级为 `v6.0.12`。

## v6.0.11-pw2.2 (2026-08-22)

- 69 条 fused SRS shunt rule 从最终 manifest 重建；Gemini 与 Accademia Gemini 段改走 Google 语义，szkane AI 段及顺序保持不变。

## v6.0.10-pw2.2 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：重建首段 fused SRS shunt rule；两个网易游戏服务主机在国内游戏 shunt rule 前固定由 `direct` 处理。

## v6.0.9-pw2.1 (2026-07-19)

- 重建 66 条 fused shunt rule；与 Passwall 一致以通用 GitHub API 工具组段处理无进程身份的路由器请求。

## v6.0.8-pw2.1 (2026-07-15)

- 65 条 fused shunt rule 同步国内权威优先级，并为远程 `.srs` 使用发布版本缓存键。

## v6.0.7-pw2.1 (2026-07-14)

- FIX#176：65 条 fused SRS shunt rule 重生成；Passwall2 与 Passwall 共同保持国内域名优先于通用国际 CDN / GeoIP fallback。

## v6.0.6-pw2.1 (2026-07-14)

- SYNC：fused SRS shunt rule 已随 v6.0.6 重建；Passwall2 路由器端无法看到 LAN 客户端的 `WorkPro.exe` / `WorkProWebProcess.exe`，不承诺进程级命中。

## v6.0.5-pw2.1 (2026-07-14)

- PLATFORM：fused SRS shunt rule 已重建；Passwall2 路由器端无法看到 LAN 客户端 WorkPro.exe，不承诺进程级命中。

## v6.0.4-pw2.1 (2026-07-13)

- DIRECT-ITWDB：从 `scki-fused-008-direct.srs` 重建默认直连 shunt rule；`itwdb.com` 与 WorkPro 子域名保持 Passwall2 原生规则语义。

## v6.0.3-pw2.1 (2026-07-12)

- SYNC：从 v6.0.3 fused sing-box 目标重新生成 65 条非空 `rule-set:remote` shunt rule、apply 脚本和参考配置。
- AI-PRECEDENCE：新增的 AI telemetry guard 在广告和国外网站 fallback 前保持顺序生效，所有 shunt URL 只引用仓库 fused `.srs`。

## v6.0.2-pw2.1 (2026-07-10)

- SYNC：从 v6.0.2 fused sing-box 目标重新生成 64 条非空 `rule-set:remote` shunt rule、apply 脚本和参考配置。
- PERF：64 个 `.srs` 聚合约 4.06 MiB，继承 GEOIP/ASN 目标物化和全局精确去重；按最终 SRS 的 IP 内容设置 Domain/IP 双列表标志，不直接调用任何上游规则集。

## v6.0.1-pw2.1 (2026-07-10)

- SYNC：从 fused sing-box JSON 重新生成 apply 脚本、参考配置和 68 条 shunt rule，基线升级到 Clash Party v6.0.1。
- DELIVERY：Passwall2 保持 `rule-set:remote` `.srs` 原生 fallback；Issue #174 的移动端文本分片不改变其 68 条 shunt 映射或策略语义。

## v6.0.0-pw2.2 (2026-07-09)

- FUSED-PASSWALL2：`Passwall2(xray+sing-box)-apply.sh`、参考 `.conf` 与 `shunt-rules/*.list` 改由 `tools/generate-fused-fallback-artifacts.js` 生成。
- SCOPE：每条 shunt rule 只引用对应的 `rulesets/generated/fused/sing-box/*.srs` 远程规则集；旧 33 条手写域名/IP 展平列表全部移除，并与 Passwall 保持 `.list` 同源互通。

## v6.0.0-pw2.1 (2026-07-09)

- META：跟随 Clash Party v6.0.0 更新版本元数据。
- SCOPE：Passwall2 继续作为 shunt_rules 展平降级参考；融合规则集主线不从 Passwall2 反向生成。

## v5.4.39-pw2.1 (2026-07-09)

- META：跟随 Clash Party v5.4.39 更新版本元数据。
- N/A：Passwall2 展平 shunt rules 不消费 Mihomo `.mrs` rule-provider；`.list` 规则语义延续 v5.4.38-pw2.1。

## v5.4.38-pw2.1 (2026-07-09)

- META：跟随 Clash Party v5.4.38 更新版本元数据。
- SCOPE：Passwall2 展平 shunt rules 继续保持本地 `.list` 结构，不直接引用公共 supplemental URL。

## v5.4.37-pw2.1 (2026-06-29)

- META#170-DNS-POLICY：跟随 Clash Party v5.4.37 更新版本元数据。
- N/A：Passwall2 展平 shunt rule 不承载 Mihomo `nameserver-policy` DNS 字段；`.list` 规则语义不变。

## v5.4.36-pw2.1 (2026-06-29)

- CLEAN#171-DIRECT：跟随 Clash Party v5.4.36 清理结果，删除展平规则 `channel4.com` / `sky.com`，其余候选不适用于 Passwall2 展平层或需继续保留。
- 版本元数据同步；shunt 规则数量相应减少。

## v5.4.35-pw2.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM：跟随 Clash Party v5.4.35 基线更新版本元数据。
- N/A：Passwall2 展平降级参考不消费 Mihomo rule-provider；`domain:encoretvb.com` 仍作为香港流媒体静态覆盖保留，33 条 shunt rule 语义不变。

## v5.4.34-pw2.1 (2026-06-28)

- ★ FIX#169-AMAP：`27-cn-site.list`、apply 脚本与参考 `.conf` 补充高德地图 / AMap 核心域名直连兜底。
- 覆盖 `a-map.cn` / `amap.com` / `amapauto.com` / `anav.com` / `autonavi.com` / `gaode.com` 等，避免 `webapi.amap.com` 依赖宽泛 CN 分类。

## v5.4.33-pw2.1 (2026-06-27)

- ★ FEAT#169-AI-CODING：`02-ai-service.list`、apply 脚本与参考 `.conf` 补充 AI 编程工具域名兜底。
- N/A：VPSDance 暂无 sing-box `.srs` 输出，Passwall2 降级参考不直接使用 `rule-set:remote`。

## v5.4.32-pw2.1 (2026-06-25)

- ★ FIX#168-CN-GAME：Passwall2 shunt rule 创建顺序调整为国内游戏早于国外游戏/国外网站，并补齐米哈游、网易、WeGame、完美世界、TapTap 等国内游戏域名。
- `shunt-rules/21-cn-game.list` / `22-intl-game.list` 与 Passwall 保持同源；`domain:mihoyo.com` 从国外游戏移入国内游戏。

## v5.4.31-pw2.1 (2026-06-20)

- ★ FIX#167-DOUYIN：`08-cn-media.list`、apply 脚本与参考 `.conf` 补齐抖音 Web / `zjcdn.com` 视频 CDN 明确 `domain:` 兜底。
- 与 Passwall 继续保持 `.list` 文件规则内容互通。

## v5.4.30-pw2.1 (2026-06-17)

- ★ FEAT#166-GOOGLE：新增 `30-google.list` 与第 20 条 `🔍 Google 服务` shunt rule，承载 `geosite:google` / `geoip:google` / `domain:scholar.google.com`。
- 工具组重命名为 `31-tools.list`，仅保留非 Google 搜索和开发者服务；兜底列表顺延为 `32-final.list`，展平 shunt rules 总数调整为 33。

## v5.4.29-pw2.1 (2026-06-10)

- N/A#165-LATENCY：Passwall2 降级参考使用展平 shunt rules，不承载区域自动测速/健康检查字段；本轮仅元数据与 README 对齐 Clash Party v5.4.29。

## v5.4.27-pw2.1 (2026-06-07)

- ★ CLEAN#165：`11-hbo-max.list` / apply 脚本删除已被 `geosite:hbo` 覆盖的 `domain:max.com` 与 `domain:hbomax.com` 本地兜底；与 Passwall 继续保持 `.list` 互通。

## v5.4.26-pw2.1 (2026-06-07)

- 对齐基线 v5.4.26（FIX#164）。本产物**不受** `copilot.tencent.com` 误吞影响：Passwall2 AI 分流用 `geosite:copilot`（无 copilot 子串关键词），且不消费 szkane `AiDomain.list`；`copilot.tencent.com` 顺流到国内直连规则，无需 `.list`/`.sh` 改动。仅 bump 版本。

## v5.4.25-pw2.2 (2026-06-05)

- ★ MAINT#HEADER-LITE：apply 脚本头部移除多版本变更历史，仅保留轻量元信息并指向 `Passwall2/CHANGELOG.md`，对齐仓库 CLAUDE.md §1.3 维护契约。

## v5.4.25-pw2.1 (2026-06-04)

- ★ FIX#PW2-IDEMPOTENT-P3：apply 脚本默认 `--replace`，运行前删除同名 Smart-Config-Kit shunt rules，避免重复运行追加 32 条副本；保留 `--append` 作为显式追加模式。
- ★ SYNC：版本头和参考 `.conf` 对齐 Clash Party v5.4.25；与 Passwall 继续保持 `.list` 规则同源。

## v5.4.23-pw2.1 (2026-06-02)

- ★ FIX#161：`27-cn-site.list` 增 `domain:zhimg.com` + `domain:zhihu.co` → direct shunt（知乎图片 CDN + 短链，同步基线）。

## v5.4.22-pw2.1 (2026-05-31)

- ★ GeTui(个推)推送 SDK `getui.com` / `getui.net` / `gepush.com` 加入 `27-cn-site.list`（review 后补；延续 #2，归 direct shunt；owner 选放行保 App 推送如米家）。

- N/A#1 QUIC 精细化：Passwall2 不承载 QUIC 阻断，#1 不适用；版本跟随基线对齐。

## v5.4.21-pw2.1 (2026-05-31)

- N/A#4 DoH-over-IP bootstrap：Passwall2 shunt_rules 不承载 DNS resolver，#4 不适用；版本跟随基线对齐。

## v5.4.20-pw2.1 (2026-05-30)

- N/A#6 节点过滤关键词补充（批 B）：Passwall2 无运行时节点分类 / junk 过滤器（静态 shunt_rules），#6 不适用；版本跟随 Clash Party v5.4.20 基线对齐。

## v5.4.19-pw2.1 (2026-05-30)

借鉴 Proxy-override 批 A · #2 国内 SDK/CDN 直连前置（跟随 Clash Party v5.4.19；spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- `27-cn-site.list` [Domain List] 增加：`full:msg.umeng.com` + `domain:jpush.cn` / `jpush.io`（承载合法 App 推送；Passwall2 无 jiguang/youmeng 拦截源，零冲突）+ `domain:baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com`（前端 CDN）→ 均归 direct shunt
- 不适用 #3 fake-ip-filter / #5 direct-nameserver-follow-policy（Passwall2 shunt_rules 不承载 fake-ip / mihomo DNS 字段）
- 🔢 版本：v5.4.17-pw2.1 → v5.4.19-pw2.1（全产物跳过烧毁的 .18 统一到 v5.4.19）

## v5.4.17-pw2.1 (2026-05-26)

- N/A#DNS-SPLIT-BOOTSTRAP：Passwall2 shunt_rules 只承载分流规则，不承载 DNS resolver 配置
  - apply 脚本与参考 `.conf` 元数据同步 Clash Party v5.4.17
  - DNS split-bootstrap 由用户在 Passwall2 节点/全局 DNS 页面按本机环境配置

## v5.4.16-pw2.1 (2026-05-20)

- ✅ FIX#149-P0：金融支付 shunt rule 补充 `domain:paddle.com`
  - Passwall2 不消费 anti-AD/DustinWin 远程源；作为降级参考，将 Paddle 许可/支付链路归入 `🏦 金融支付`

## v5.4.15-pw2.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER：同步 Clash Party v5.4.15 元数据，新增 GEOSITE 覆盖台账引用。
- N/A#AD-FP-MODULE：Passwall2 shunt_rules 为降级参考，不消费 Sukka phishing / blackmatrix7 MIUI 远程源；规则列表保持 v5.4.14 语义。

## v5.4.14-pw2.1 (2026-05-20)

- ✅ FIX#CF-R2-P0：`29-intl-site.list` 显式补齐 `domain:cloudflarestorage.com`
  - Passwall2 shunt_rules 不消费 Sukka phishing 源，当前 `geosite:category-ads-all` 也未命中该域；记录为同构同步
  - `Passwall2(xray+sing-box)-apply.sh` 版本与基线同步到 Clash Party v5.4.14

## v5.4.13-pw2.1 (2026-05-19)

- N/A#STUN-PORTS：Passwall2 shunt_rules 是域名/IP 列表模型，没有本仓库可安全写入的端口分流字段
- META#BASELINE：元数据跟随 Clash Party v5.4.13；域名/IP 展平列表不变

## v5.4.12-pw2.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 baseline metadata after the Mihomo RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Passwall2 uses router-side shunt rules and LuCI DNS; no Mihomo fake-ip-filter rule is applicable.

## v5.4.11-pw2.1 (2026-05-12)

- ✅ FIX#RD-DOMAIN：会议协作 shunt rule 补充 `domain:rustdesk.com`
- ℹ️ PROCESS-NAME / DNS 自举不适用：Passwall2 运行在 OpenWrt 路由器端，看不到局域网客户端进程名；DNS 由 LuCI 全局方案托管

## v5.4.9-pw2.1 (2026-05-11)

- ★ META#LOCAL-TOOLS：跟随 Clash Party v5.4.9 基线；Passwall2 运行在路由器侧，无法观察 LAN 客户端进程名，本轮不把 PROCESS-NAME 清单展平进 shunt rules。
- `shunt-rules/*.list` 无业务语义变化；直连工具清单仅作为 PC 客户端兼容测试集维护。

## v5.4.8-pw2.1 (2026-05-09)

- ★ ORDER#RULE-TAIL：同步 Clash Party v5.4.8 shunt rule 创建顺序
  - LuCI 分流规则顺序按新的中后段业务顺序排列

## v5.4.7-pw2.1 (2026-05-09)

- ★ FEAT#TikTok：`geosite:tiktok` 从 `06-social.list` 移除，新建 `06b-tiktok.list` 独立分流
- ★ FIX#HK：Passwall2 无运行时节点分类，豁免（§1.4）

## v5.4.6-pw2.1 (2026-05-08)

- ★ FEAT#145：WeChat CDN 直连
  - `shunt-rules/27-cn-site.list` 新增 `domain:cdn.weixin.qq.com`（置于 bbys.app 之后、geosite:cn 之前）
  - 跟随 Clash Party v5.4.6 基线

## v5.4.5-pw2.1 (2026-05-07)

- ★ 全球节点置顶 + 全产品组顺序同步（跟随基线 v5.4.5）

## v5.4.4-pw2.1 (2026-05-07)

- ★ FIX#144：bbys.app 视频播放走直连
  - `shunt-rules/27-cn-site.list` 新增 `domain:bbys.app`（置于 geosite:cn 之前优先匹配）
- ★ FEAT#143（IEPL/IPLC 家宽识别）和 FIX#142（DNS 冷启动）均为 Clash Party JS 运行时逻辑，Passwall2 静态规则豁免
- Bump: `v5.4.0-pw2.1` → `v5.4.4-pw2.1`

## v5.4.0-pw2.1 (2026-05-05)

- ★ FEAT#SG：新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立区域组
  - 新加坡从 🌏 亚太节点 中拆分为独立区域
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51
  - 跟随基线 Clash Party v5.4.0
  - 注：SG 狮城节点豁免——无节点名称匹配，使用 geosite 路由

## v5.3.0-pw2.4 (2026-04-26)

- ★ FIX：8 个流媒体 .list 文件（09~16）第 5 行注释从 "Passwall LuCI" 修正为 "Passwall2 LuCI"
  - 影响文件：09-netflix / 10-disney-plus / 11-hbo-max / 12-hulu / 13-prime-video / 14-youtube / 15-music-streaming / 16-other-streaming

## v5.3.0-pw2.3 (2026-04-26)

- ★ REFACTOR#2：流媒体分组架构重构——按区域 → 按平台（7→13 流媒体组）
  - 拆出 5 个主流平台独立组：🎥 Netflix / 🎬 Disney+ / 📡 HBO/Max / 📺 Hulu / 🎬 Prime Video
  - 拆出 2 个全球平台独立组：📹 YouTube / 🎵 音乐流媒体
  - 保留 4 个区域锁区组：🇭🇰 香港流媒体 / 🇹🇼 台湾流媒体 / 🇯🇵 日韩流媒体 / 🇪🇺 欧洲流媒体
  - 新增 🌐 其他国外流媒体 兜底（接收长尾平台 + 原东南亚流媒体）
  - 业务组 25→31，总组 43→49
## v5.2.10-pw2.2 (2026-04-26) — ★ 跟随基线合并 4 组为 2 组

- ★ **代理组合并（基线同步）**：与 `Passwall/v5.2.10-pw.2` 对等的同构变更。28 条 shunt rule 精简为 25 条
  - `📧 邮件服务` + `☁️ 云与CDN` → 合并到 `🌐 国外网站`（域名字段并入 `23-intl-site.list`）
  - `🔍 搜索引擎` + `📟 开发者服务` → 合并为 `🔧 工具与服务`（新设 `24-tools.list`）
  - `📥 下载更新`：推荐策略从 `direct` 调整为 `proxy`
- 文件变更：
  - `Passwall2(xray+sing-box)-apply.sh`：移除 4 个旧组块，新增 1 个组，重新编号 28→25，版本 `v5.2.10-pw2.2`
  - `Passwall2(xray+sing-box).conf`：移除旧组节，新增 `[24] 工具与服务`，全部重编号
  - `shunt-rules/*.list`：删除 `05-email.list` / `18-search.list` / `19-dev.list` / `23-cloud-cdn.list`；剩余 20 个文件按新编号重命名；`27-intl-site.list` → `23-intl-site.list`（合并内容）；`22-download.list` → `19-download.list`（策略更新）；新建 `24-tools.list`
- README.md 已同步更新
- CHANGELOG 更新（本条）

## v5.2.10-pw2.1 (2026-04-25) — 主版本追平（FIX#39 平台例外）

- ★ **FIX#39 同构审计 — 平台例外（CLAUDE.md §1.4）**：与 `Passwall/v5.2.10-pw.1` 同因。
  Passwall2 的 shunt-rules 与 Passwall 共用同一份 `.list`，同样没有 `dns.google` /
  `cloudflare-dns.com` 的特化条目（由 `geosite:google` / `geosite:cloudflare` 覆盖）。
  按 §1.4 标记为不同步，仅 bump 版本号追平基线。详见 `Passwall/CHANGELOG.md` 同版本节。
- 唯一改动：脚本头部 `Version` 注释 `v5.2.9-pw2.1` → `v5.2.10-pw2.1`

## v5.2.8-pw2.4 (2026-04-24) — ★ 广告拦截规则置顶 + `apply.sh` 路径加引号

与 `Passwall/v5.2.8-pw.4` 对等的同构 bug 修复（CLAUDE.md §1.5 触发 → 两份产物同步）。详细说明见 `Passwall/CHANGELOG.md` 同版本节；本节仅列具体改动文件。

- ★ **FIX#CODEX-1（P1，CLAUDE.md §3.4 契约违反）**：🛑 广告拦截从 `#28`（末尾）前移至 `#01`（首位），其余 27 条规则依次下移一位。
  - `Passwall2(xray+sing-box)-apply.sh` — 28 个 `# [NN]` 块整体重编号；echo 提示更新
  - `Passwall2(xray+sing-box).conf` — 28 个 banner 块重编号，`slug    : NN-xxx` 字段同步更新
  - `shunt-rules/*.list` — 文件名整体重编号（`28-ads.list` → `01-ads.list`，`01-ai-service.list` → `02-ai-service.list`，…，`27-final.list` → `28-final.list`）
  - `README.md` — 28 个 `### <keycap>` 表头同步重编号；参考文件名示例从 `01-ai-service.list / 06-social.list` 改为 `02-ai-service.list / 07-social.list`；规则顺序说明改为"第 1 条必须是 🛑 广告拦截；第 25-28 条（国内/受限/国外/FINAL）保持末尾"
- ★ **FIX#CODEX-2（P2，shell 元字符逃逸）**：`README.md` 中 `sh Passwall2(xray+sing-box)-apply.sh` 加单引号为 `sh 'Passwall2(xray+sing-box)-apply.sh'`。脚本头部 20-23 行使用说明原本就是正确形式，此次对齐。

### 同构审计结论（按 CLAUDE.md §1.5）

此修复属于"规则条目目标组 / 规则顺序影响命中优先级（广告拦截 / FINAL 前置关系）"类型；审计矩阵见 `Passwall/CHANGELOG.md` 同版本节。结论：**其他 9 份产物的广告拦截本身已正确放首段**，仅 Passwall + Passwall2 为同构漏洞，本 PR 同时修复。

### 放弃 Codex DNS 建议

Codex 另一条 P1（`CMFA(mihomo).yaml` 将 `1.12.12.12` 回退到 `doh.pub`）**未采纳**。原因：`1.12.12.12` 是全仓库 7 个产物（CMFA / OC Normal / OC Smart / SR / Surge / Loon / QX）的一致 DNS 基线，单独改 CMFA 会破坏 §1 多产物一致性；如确需全量迁回 `doh.pub`，应开独立 PR 整仓库同步。

## v5.2.8-pw2.3 (2026-04-24) — ★ 版本号对齐 v5.2.8 基线

跟随 Clash Party v5.2.8 基线版本号对齐。本产物无功能性变更（同构审计 N/A 理由同 Passwall `v5.2.8-pw.3`）。

## v5.2.6-pw2.2 (2026-04-23) — ★ 致命 bug 修复 + 定位纠正

本次 PR 源自用户指出的两个错误，经深度调研 Passwall / Passwall2 官方仓库（`Openwrt-Passwall` org）+ `shunt_rules.lua` 源码后修复。

### FIX#P2-01（致命）：分流规则语法完全错误

- **问题**：初版使用 `domain-suffix:xxx` 前缀（**Clash/Shadowrocket 语法**），Passwall / Passwall2 的 `shunt_rules.lua` 解析器**不识别**这个前缀 → 粘进 LuCI 后整串 `domain-suffix:v0.dev` 被当成**纯字符串子串匹配的字面量** → **100% 不命中**任何实际域名。
- **修复**：全局 `domain-suffix:` → `domain:`（子域名匹配，等价 Clash `DOMAIN-SUFFIX` 语义）：
  - 28 个 `shunt-rules/*.list`：~94 行
  - `README.md`：96 处
  - `Passwall2(xray+sing-box).conf`：94 处
  - `Passwall2(xray+sing-box)-apply.sh`：94 处
  - **合计 ~378 处**
- **README 新增完整语法表**（8 种前缀），并加 ⚠️ 警告"不要用 Clash 的 `DOMAIN-SUFFIX,` / `DOMAIN-KEYWORD,` / `DOMAIN,` / `IP-CIDR,` 前缀"。
- **权威源**：https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua

### FIX#P2-02：定位关系说反

- **问题**：初版 README 称 Passwall 为"旧版"、Passwall2 为"新版/降级版"，暗示线性继承。错。
- **官方事实**（均为 2025-2026 年持续发版）：Passwall 与 Passwall2 现在由 [`Openwrt-Passwall`](https://github.com/Openwrt-Passwall) 组织**并行维护**（原 `xiaorouji` 个人仓库已于 2025 年前后迁入该组织，旧 URL `github.com/xiaorouji/openwrt-passwall*` 会自动 301 跳转到新地址）。Passwall 最新 `26.4.15-1`（2026-04-15）、Passwall2 最新 `26.4.20-1`（2026-04-19），相差 4 天。社区解读（[Discussion #555](https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555)）：**Passwall2 像是 Xray/Sing-box 的 UI，抛弃了直连/屏蔽/GFW 列表，只保留 keyword/domain/geosite/geoip 分流**。
- **修复**：
  - README 头部目标行重写为"Passwall（全功能）+ Passwall2（精简分流），并行维护，规则语法同源"
  - 踩坑段"Passwall 旧版语法稍不同"重写为"混淆 Passwall / Passwall2"
  - 末尾"降级版"措辞去掉，改为说明两者的架构差异（都无嵌套组、都无 mihomo）
  - 参考段链接更新为 `Openwrt-Passwall` org、加 `shunt_rules.lua` 源码链接、加 Discussion #555 解读

### 附带修正

- **所有权澄清**（用户二次指出）：Passwall/Passwall2 早已从 `xiaorouji` 个人账号迁入 [`Openwrt-Passwall`](https://github.com/Openwrt-Passwall) 组织名下（访问旧 URL 会 301）。本次补全了两处遗漏：
  - 根 `README.md:407` 致谢段的 `github.com/xiaorouji/openwrt-passwall2` 链接 → `github.com/Openwrt-Passwall/openwrt-passwall2`
  - README / CHANGELOG / CLAUDE.md / Passwall2(xray+sing-box)-apply.sh 里"xiaorouji 维护"的措辞统一改为"`Openwrt-Passwall` 组织维护（原 `xiaorouji` 个人仓库迁入）"
- 注释"iceeeder / xiaorouter 等社区分支"措辞去掉（项目已由 `Openwrt-Passwall` 组织接管维护，个人分叉早已非主流）
- `Passwall2(xray+sing-box)-apply.sh` 加注释：Passwall 用户把 `CONFIG_NAME` 改为 `passwall` 即可复用
- 头部版本号：`v5.2.5-pw2.1` → `v5.2.6-pw2.2`（对齐 Clash Party 主线 v5.2.6）

### 对其他产物的联动评估（按 CLAUDE.md §1.5 同构审计）

本次修复只动 Passwall/Passwall2 的 shunt rule 语法，**与 §1.5 5 个运行时逻辑点都不相关**（Passwall 系本来就是静态 shunt rule，无节点名分类 / fallback 链 / 订阅合并 / proxy-providers filter / 节点过滤）。其他 9 份产物（Clash Party / CMFA / OpenClash / Shadowrocket / Surge / Loon / QX / SingBox / v2rayN）不受影响。

### 根 README + CLAUDE.md 同步

- `CLAUDE.md` §0 「关于 Passwall / Passwall2」段重写：删除"Passwall2 是精简版"暗示，改为"两者并行维护，规则语法同源"。
- 根 `README.md` L386 / L389 Passwall 系描述同步。

---

## v5.2.5-pw2.1 (2026-04-20) — 初版

- ★ 初版：从 Clash Party v5.2.5 基线手工展平为 Passwall2 shunt rule 格式
- ★ **三种格式交付**（按用户需求选一种）：
  - `shunt-rules/01-ai-service.list` ~ `28-ads.list`（28 个独立文件，每个含域名列表 + IP 列表注释；方便 LuCI UI 单条复制粘贴）
  - `Passwall2(xray+sing-box).conf`（单文件合并版，28 条规则全貌参考）
  - `Passwall2(xray+sing-box)-apply.sh`（UCI 批量脚本；`scp` 到路由器 + `sh Passwall2(xray+sing-box)-apply.sh` 一次性创建 28 条空节点规则，再到 LuCI 逐条指定目标节点）
- ★ 28 条 shunt rule 覆盖 28 业务分类，每条包含：
  - 推荐节点区域（对应 Clash Party 9 区域组，用户在 Passwall2 里创建负载均衡组时参照）
  - 域名列表（`geosite:xxx` 为主 + `domain-suffix:xxx` 补充）
  - IP 列表（`geoip:xxx` 按需）
- ★ 关键规则顺序约束：
  - 广告拦截作为最高优先级（Passwall2 独立开关或 shunt rule 目标 = block）
  - 国内网站（`geosite:cn` + `geoip:cn`）放倒数第 5
  - 受限网站（`geosite:gfw`）放倒数第 4
  - 国外网站（`geosite:geolocation-!cn`）放倒数第 3
  - FINAL 兜底放倒数第 2
- ★ 协议支持说明：跟随 Passwall2 用户选的核（xray / sing-box），**不是独立产物**——用户需自行下载 geosite.dat / geoip.dat

### 与 Clash Party 主线的差异（Passwall 引擎限制）

- ❌ **无 proxy-groups 嵌套**：Clash 的"业务组 → 区域组 → url-test 节点"两级结构在 Passwall 里手工展平为 28 条 shunt rule，每条直接指向一个节点或负载均衡组
- ❌ **无 LightGBM 自动择优**：Passwall 的"负载均衡"组基于 xray/sing-box 的 `balancer`，只支持简单 `round-robin` / `random` / `leastLoad`，不含机器学习
- ❌ **无机场换节点自动分类**：Passwall 的节点标签靠手工维护；机场换节点时需要重新把节点拖入各地区负载均衡组
- ❌ **无 JS 覆写**：订阅更新时没有预处理机会
- ❌ **无 Clash 原生 rule-provider 格式**：Passwall2 支持 sing-box 的 `rule_set` remote URL（可按需加），但和 Clash 的格式不同
- ⚠️ **广告拦截降级**：只能用 1-2 个 list（如 `geosite:category-ads-all`），不像 OpenClash 可以并集 20+ 源（DustinWin + SukkaW + Hagezi + Accademia + bm7 各广告集）

### 推荐使用场景

- ✅ 已经装了 Passwall2 且不想换 OpenClash 的用户
- ✅ 只要基础分流能力，不在乎 LightGBM / 自动归位
- ✅ 路由器内存紧张但不愿装 OpenClash

### 不推荐的场景（请换 OpenClash）

- ❌ 想要 Smart + LightGBM 自动择优
- ❌ 经常换机场、希望节点自动归位到区域组
- ❌ 需要广告拦截深度防护（钓鱼 / 威胁情报 / DNS 劫持 / 隐私追踪等多源并集）
- ❌ 追求和 Clash Party 桌面端的精确一致性

### 维护同步策略

当 Clash Party 主线有规则/组/业务调整（典型场景：新增/删除业务组、rule-provider 变动）时，本 `Passwall2/README.md` 的 28 条 shunt rule 需要**手工同步**：

1. 新增业务组 → 在 README 里加一节 shunt rule，带推荐节点 + 域名/IP 列表
2. 删除业务组 → 删除对应 shunt rule 节，并在本 CHANGELOG 标注
3. 业务组内新增域名 → 更新对应 shunt rule 的"域名列表"字段

**豁免**：Clash Party 的纯 region/LightGBM 调整（如 `uselightgbm` 参数微调、Smart 组 url-test interval 变化）**不需要**同步——这些 Passwall 架构无法表达，见 CLAUDE.md §1.4「允许的不同步例外」。
