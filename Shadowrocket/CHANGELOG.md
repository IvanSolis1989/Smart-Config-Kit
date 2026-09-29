# Shadowrocket — 变更日志

> `Shadowrocket/Shadowrocket.conf` 的变更日志。
> 主版本号跟随 Clash Party 主线；尾段（`-SR.N`）独立递增。

---

## v6.0.14-SR.6 (2026-09-29)

- FIX：第 001 远程 DIRECT RULE-SET 加入微信 HTTPDNS 两个精确主机；规则优先于 BlockHttpDNS 拒绝规则。

## v6.0.13-SR.5 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：第 013 远程 RULE-SET 增加 `linuxdo.org` 后缀并绑定 `🏠 国内网站`；`linux.do` 保持第 059 受限网站路由。

## v6.0.12-SR.4 (2026-09-01)

- FIX#181-PC：第一个融合 `DIRECT` RULE-SET 增加 `login.nvidia.cn` 精确主机，先于 NVIDIA 下载规则生效；其余 NVIDIA 域名保持原策略。

## v6.0.11-SR.3 (2026-08-22)

- ROUTING：69 个远程融合 RULE-SET 重放后，Gemini 与 Accademia Gemini 进入 `🔍 Google 服务`；其余 AI 段及 szkane 顺序不变。

## v6.0.10-SR.3 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：`drpf-g10.proxima.nie.netease.com` 与 `sigma-performance-g10.proxima.nie.netease.com` 位于第一个融合 `DIRECT` RULE-SET，不再落入用户可改为代理的“国内游戏”策略组。
- GUARD：仅精确主机直连，保留 `proxima.nie.netease.com` 父域既有的 anti-AD 处理。

## v6.0.9-SR.2 (2026-08-02)

- FIX-NODE-ISO-LOWERCASE：11 个地区及家宽 policy-regex-filter 在原有大写匹配旁新增“小写 ISO 两位码紧接编号”分支；yun hk01、yun us01、yun jp01、yun sg01、yun tw01 及其家宽变体可进入对应组。
- GUARD/VERIFY：普通小写短词不扩宽为地区码；跨客户端合同逐一验证 12 个命名样例的主组、聚合组、家宽组及无编号短词保护。

## v6.0.9-SR.1 (2026-07-19)

- 新增通用 GitHub API 工具组融合段，位于上游广义 AI 规则之前；iOS 无 Windows 进程匹配，使用通用回退。

## v6.0.8-SR.1 (2026-07-15)

- 65 个融合 RULE-SET 同步国内权威优先级，并以发布版本缓存键加载自托管资产。

## v6.0.7-SR.1 (2026-07-14)

- FIX#176：iOS 融合文本引用顺序更新，国内域名段位于通用国际 CDN / GeoIP fallback 之前；新增后置 fallback 文本资产后总数为 65。

## v6.0.6-SR.1 (2026-07-14)

- PLATFORM：Windows 的 `WorkPro.exe` / `WorkProWebProcess.exe` 进程直连由桌面 Mihomo、sing-box 与 Xray 产物承载；Shadowrocket iOS 不伪造不支持的 `PROCESS-NAME` 规则，继续消费同步后的融合文本资产。

## v6.0.5-SR.1 (2026-07-14)

- PLATFORM：WorkPro.exe 的 Windows 桌面直连由源图回归契约保护；Shadowrocket iOS 路径不伪造 PROCESS-NAME 规则。

## v6.0.4-SR.1 (2026-07-13)

- DIRECT-ITWDB：默认 `DIRECT` 融合文本段新增 `DOMAIN-SUFFIX,itwdb.com`，Shadowrocket 同步覆盖 WorkPro 及全部子域名。

## v6.0.3-SR.1 (2026-07-12)

- SYNC：移动端文本目标同步为 64 个非空融合 RULE-SET；所有 URL 仍只指向仓库生成资产，不直接调用上游规则集。
- AI-PRECEDENCE：ChatGPT/OpenAI 主域、oaistatic、Cloudflare NEL 与必要 Sentry/DataDog telemetry 在广告和国外网站段之前进入 `🤖 AI 服务`。
- SEMANTICS：文本规则沿源图顺序保留；Mihomo MRS grammar 修复不把 keyword/regex 错误扩展为 wildcard。

## v6.0.2-SR.1 (2026-07-10)

- FIX#175：远程规则从 71 个放大分片收敛为 63 个移动端非空融合段；聚合体积由约 75.44 MiB 降至 16.06 MiB，文本规则由约 310 万条降至 575,499 条。
- ROOT-CAUSE：修复 HaGeZi Ultimate 被错误替换为完整 TIF，以及 249 条国家 GEOIP 被展开成 76 万以上 CIDR 的双重放大；国家 GEOIP 现在保留为 SR 原生规则，服务型 GEOIP 才转换为 CIDR。
- DEDUP：每个同策略段删除精确重复、被 DOMAIN-SUFFIX / DOMAIN-KEYWORD 覆盖的域名和被父网段覆盖的 CIDR；最终 Clash 文本二次优化删除数为 0。
- BUDGET：新增 32 MiB / 100 万条客户端聚合门禁，并继续保留 18 MiB 单资产门禁，防止以后通过增加分片数掩盖总量回归。

## v6.0.1-SR.1 (2026-07-10)

- FIX#174：`scki-fused-005-ad` 从单个 51.10 MiB RULE-SET 拆为 3 个同策略、有序分片；`scki-fused-057-intl-site` 从 20.15 MiB 拆为 2 个同策略、有序分片，避免 CDN / Shadowrocket 对超限单文件返回 `403/forbidden`。
- SEMANTICS：5 个分片仍按原分流位置连续匹配，策略目标分别保持 `🛑 广告拦截` 和 `🌐 国外网站`；规则内容、策略组和最终匹配优先级不变。
- VERIFY：生成时每个远程文本资产限制为 18 MiB，且合同校验会扫描本配置实际引用 URL 的文件存在性和字节数。

## v6.0.0-SR.1 (2026-07-09)

- FUSED-RULESETS：迁移到 68 个融合远程 RULE-SET。
- META：跟随 Clash Party v6.0.0 更新版本元数据；策略组保持不变。

## v5.4.39-SR.1 (2026-07-09)

- META：跟随 Clash Party v5.4.39 更新版本元数据。
- N/A：Shadowrocket 不支持 Mihomo `.mrs` rule-provider；规则语义延续 v5.4.38-SR.1。

## v5.4.38-SR.1 (2026-07-09)

- SCKI-SUPPLEMENTAL：删除零星本地白名单直写，改为 13 个仓库维护的 supplemental `RULE-SET`。
- SYNC：版本元数据同步 Clash Party v5.4.38。

## v5.4.37-SR.1 (2026-06-29)

- META#170-DNS-POLICY：跟随 Clash Party v5.4.37 更新版本元数据。
- N/A：Shadowrocket `.conf` 不支持 Mihomo `nameserver-policy` / `geosite:*` DNS policy 字段；现有 `dns-server` / `fallback-dns-server` 语义不变。

## v5.4.36-SR.1 (2026-06-29)

- CLEAN#171-DIRECT：同步删除 22 条经逐条确认的冗余 `DOMAIN` / `DOMAIN-SUFFIX` 规则，远程规则集保持不变。
- AI / Binance / Microsoft login 候选因不同策略 `.mrs` 前置阻断，继续保留。

## v5.4.35-SR.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM：删除 5 个已被前序同目标规则覆盖的远程 RULE-SET：Marketing、EncoreTVB、FindMy、WildRift、AcFun。
- CLEAN#170-DIRECT：删除 3 条已被前置 Douyin 国内流媒体守卫同目标覆盖的后置直写规则：`douyin.com`、`douyinpic.com`、`douyinvod.com`。
- 远程 RULE-SET 实测数 288 → 283；匹配顺序不变。

## v5.4.34-SR.1 (2026-06-28)

- ★ FIX#169-AMAP：新增 blackmatrix7 Shadowrocket `GaoDe.list`，归入 `🏠 国内网站`。
- 顺序保持在广告/威胁规则之后、国外网站兜底之前，修复 `webapi.amap.com` 高德 API 误走国外的风险。

## v5.4.33-SR.1 (2026-06-27)

- ★ FEAT#169-AI-CODING：新增 VPSDance Shadowrocket `coding.list`，归入 `🤖 AI 服务`。

## v5.4.32-SR.1 (2026-06-25)

- ★ FIX#168-CN-GAME：将国内游戏内联规则和 SteamCN 等规则集整体前置到国外游戏 RULE-SET 之前，避免 HoYoverse/Game 宽规则抢先代理。
- 文件头与 README 对齐 Clash Party v5.4.32。

## v5.4.31-SR.1 (2026-06-20)

- ★ FIX#167-DOUYIN：新增抖音 Web 国内流媒体前置规则，`douyin.com` / `zjcdn.com` 等域名先于 TikTok 和国外规则集命中 `📺 国内流媒体`。
- 文件头与 README 对齐 Clash Party v5.4.31。

## v5.4.30-SR.1 (2026-06-17)

- ★ FEAT#166-GOOGLE：新增 `🔍 Google 服务` 策略组，位于 `🔧 工具与服务` 之前。
- `GoogleSearch` / `GoogleDrive` / `GoogleEarth` / `Google` / `Scholar` 规则集改投新组；工具组保留非 Google 搜索和开发者服务。

## v5.4.29-SR.1 (2026-06-10)

- ★ PERF#165-LATENCY：22 个区域 `url-test` 组 `interval=180 -> interval=300`，降低订阅节点测速频率。
- 规则与策略组语义不变；FINAL 仍走 `🐟 漏网之鱼`。
- README 与文件头对齐 Clash Party v5.4.29。

## v5.4.27-SR.1 (2026-06-07)

- ★ CLEAN#165：同步清理 7 条已由前置远程规则集覆盖的本地直写域名（Claude / PayPal / HBO / Hulu / Xbox）；删除后仍命中同策略组。

## v5.4.26-SR.1 (2026-06-07)

- ★ FIX#164：腾讯 WorkBuddy `copilot.tencent.com` 国内直连防吞——szkane `AiDomain.list` 的 `DOMAIN-KEYWORD,copilot` 子串会把它误吞到 `🤖 AI 服务`（国外代理）导致对话报错；在 szkane AiDomain RULE-SET 之前前置 `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站`（与既有 RustDesk 防吞守卫并置）。基线 Clash Party v5.4.26。

## v5.4.25-SR.1 (2026-06-04)

- ★ SYNC：产物头部版本和基线声明对齐 Clash Party v5.4.25；规则语义延续 v5.4.23-SR.2，无新增 SR 专属规则变更。

## v5.4.23-SR.2 (2026-06-02)

- ★ FIX#162：修复 Shadowrocket 远程规则列表加载 `Invalid status`：
  - `ruleset.skk.moe/List/non_ip/reject_phishing.conf` 已 404，SR 不支持 `domainset`，改用同为 non_ip 通用格式的 `reject.conf`。
  - 移除已失效的 HaGeZi `share/surge-tif-medium.txt`（jsDelivr 403；当前 HaGeZi 无 SR RULE-SET 等价格式）。
  - 移除上游已不存在的 `Shadowrocket/RemoteDesktop/RemoteDesktop.list`（仅 Clash 端仍有进程名规则，SR 不适用）。
  - `BiliIntl/BiliIntl.list` 路径改为当前上游 `BiliBiliIntl/BiliBiliIntl.list`。

## v5.4.23-SR.1 (2026-06-02)

- ★ FIX#161：`DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` → 🏠 国内网站 直连（知乎图片 CDN + 短链，同步基线）。

## v5.4.22-SR.1 (2026-05-31)

- ★ GeTui(个推)推送 SDK `getui.com` / `getui.net` / `gepush.com` 加直连白名单（review 后补；延续 #2，被通用广告/隐私表当 tracker 拦截但承载 App 推送如米家；owner 选放行）。

- N/A#1 QUIC 精细化：SR block-quic 是引擎级开关，不支持 AND/NOT 白名单豁免。引擎标注见文件内注释。

## v5.4.21-SR.1 (2026-05-31)

#4 借鉴 Proxy-override：全部 DoH URL（dns-server / proxy-dns-server / fallback-dns-server）从域名改为 IP-host DoH，消除 bootstrap 阶段 DNS 泄漏；SR 无独立 bootstrap 字段，直接用 IP DoH 即免自举。

## v5.4.20-SR.1 (2026-05-30)

- N/A#6 节点过滤关键词补充（批 B）：Shadowrocket 不处理订阅去 junk（无 isInfoNode / exclude-filter 等运行时 junk 过滤器），#6 不适用；版本跟随 Clash Party v5.4.20 基线对齐。

## v5.4.19-SR.1 (2026-05-30)

借鉴 Proxy-override 批 A · #2 国内 SDK/CDN 直连前置（跟随 Clash Party v5.4.19；spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- jpush / `msg.umeng.com` 前置到广告拦截 RULE-SET 之前强制 DIRECT（承载合法 App 推送/消息；与 mihomo 家族行为对齐，避免跨端不一致）
- `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` 加入 🏠 国内网站段
- 不适用 #3 fake-ip-filter（iOS Shadowrocket 无该字段）/ #5 direct-nameserver-follow-policy（非 mihomo 内核）
- 🔢 版本：v5.4.17-SR.1 → v5.4.19-SR.1（全产物跳过烧毁的 .18 统一到 v5.4.19）
## v5.4.17-SR.2 (2026-05-30)

- ★ FIX#KR-WB：日韩 / 亚太 `policy-regex-filter` 裸 `KR` 补词边界 `(?<![a-zA-Z])KR(?![a-zA-Z])`（与本文件 US/SG 写法一致）
  - 大小写敏感下仅大写 `KR` 子串误伤（KRAKEN / DARKROOM → 🇯🇵 日韩节点），加边界后消除
  - 覆盖日韩节点 / 日韩家宽 / 亚太节点 / 亚太家宽 4 行；KOR/Korea/Seoul/🇰🇷 完整词不受影响
  - §1.5 同构审计：主线 Clash Party×3 JS + CMFA 本就带边界未改；OpenClash/Loon/Surge/QX 同步修复
  - 回归测试见 `tools/test-kr-boundary.js`

## v5.4.17-SR.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP：Shadowrocket DNS 同步 v5.4.17 split-bootstrap 语义
  - `dns-server` 只保留国内 DoH；`proxy-dns-server` 固定境外 DoH + 国内 DoH 兜底
  - `fallback-dns-server` 固定 Cloudflare + Google DoH
  - Shadowrocket 无独立 `default-nameserver` 字段，DoH 域名自举由客户端实现

## v5.4.16-SR.1 (2026-05-20)

- ✅ FIX#149-P0：前置 `DOMAIN-SUFFIX,paddle.com,🏦 金融支付`
  - issue #149 反馈 Antigravity 登录 Google 后回跳失败，日志中 `analytics.paddle.com` 频繁命中拦截
  - 当前 anti-AD/DustinWin 源包含 `analytics.paddle.com`；Shadowrocket 本地规则需放在 anti-AD 远程规则之前

## v5.4.15-SR.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER：同步 Clash Party v5.4.15 元数据，新增 GEOSITE 覆盖台账引用。
- ♻️ REFACTOR#AD-FP-MODULE：阶段 1 顶部显式标记 Anti-ad false-positive allowlist，并将小米误伤白名单与 Cloudflare R2 白名单统一放到广告/钓鱼/TIF 规则之前。

## v5.4.14-SR.1 (2026-05-20)

- ✅ FIX#CF-R2-P0：`cloudflarestorage.com` 规则前置到阶段 1 顶部
  - 避免 Sukka phishing 远程规则源把 Cloudflare R2 对象存储域误导向 `🛑 广告拦截`
  - 后段 `🌐 国外网站` 重复条目已移除

## v5.4.13-SR.1 (2026-05-19)

- ✅ FIX#STUN-PORTS：补齐 STUN/TURN 标准端口 `5349 / 19302 / 19305 / 19307 -> DIRECT`
- N/A#FAKE-IP：Shadowrocket 无 Mihomo `fake-ip-filter`；QUIC 仍由 `block-quic = all-proxy` 控制

## v5.4.12-SR.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 documentation for the RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Shadowrocket has no Mihomo fake-ip-filter field; existing rustdesk.com meeting-collaboration routing is unchanged.

## v5.4.11-SR.1 (2026-05-12)

- ✅ FIX#RD-DOMAIN：`rustdesk.com` 继续归入 `🧑‍💼 会议协作`，用于补齐 iOS 无进程匹配能力时的 RustDesk 域名兜底
- ✅ FIX#DNS-BOOTSTRAP：`dns-server` / `proxy-dns-server` 调整为 IP-first + DoH 兜底，降低首次解析失败概率

## v5.4.9-SR.1 (2026-05-11)

- ★ META#LOCAL-TOOLS：跟随 Clash Party v5.4.9 基线；本端不启用新增 PROCESS-NAME 直连清单，避免 Shadowrocket iOS / macOS 通用配置里出现不等价或被忽略的进程匹配。
- 直连工具清单已进入 `docs/process-name-compatibility.md` 与测试夹具，桌面端由 mihomo / sing-box / Surge Mac 承接。

## v5.4.8-SR.2 (2026-05-11)

- ★ FIX#SR-AF-P1：补回被业务组引用但未定义的 `🌍 非洲节点` url-test 组
  - 将 `🌍 非洲节点` / `🏡 非洲家宽` 放回区域组段，避免非洲候选引用落到不存在的策略组
  - 同构审计：Surge / Loon / QX / CMFA 均已定义非洲节点组；Shadowrocket 为单端漏同步

## v5.4.8-SR.1 (2026-05-09)

- ★ ORDER#RULE-TAIL：同步 Clash Party v5.4.8 规则尾段匹配顺序
  - `[Proxy Group]` UI 顺序不变；仅调整 `[Rule]` 顺序
  - `🎵 TikTok` 保持前置，避免 ByteDance 共用域被国内流媒体抢先命中

## v5.4.7-SR.1 (2026-05-09)

- ★ FEAT#TikTok：新增独立 `🎵 TikTok` 业务组（32 业务组），置于 `📺 国内流媒体` 与 `🎥 Netflix` 之间
  - TikTok 从 `📱 社交媒体` 独立为专属 select 组，使用标准全球代理链路
  - `RULE-SET,TikTok.list` 规则目标从 `📱 社交媒体` 改为 `🎵 TikTok`，前置于 Netflix 规则块
- ★ FIX#HK：香港节点 `policy-regex-filter` 追加 `|广港`，补全 IEPL/IPLC 跨境专线节点分类

## v5.4.6-SR.1 (2026-05-08)

- ★ FEAT#145：WeChat CDN 直连 — 新增 `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT`
  - 于阶段 7（国内邮箱直连）`mail.qq.com` 后新增，WeChat CDN 域名直连
  - 跟随 Clash Party v5.4.6 基线

## v5.4.5-SR.1 (2026-05-07)

- ★ 全球节点置顶 + 全产品组顺序同步（跟随基线 v5.4.5）

## v5.4.4-SR.1 (2026-05-07)

- ★ FIX#144：新增 bbys.app 直连规则（国内可访问视频站点 CDN 域名直连）
  - 于阶段 28（国内网站兜底）末尾新增 `DOMAIN-SUFFIX,bbys.app,DIRECT`
  - 跟随 Clash Party v5.4.4 基线
- ★ FEAT#143：家宽 policy-regex-filter 新增 IEPL/IPLC/专线识别
  - 所有 10 个家宽区域组的 `policy-regex-filter` 中 residential 子模式追加 `[Ii][Pp][Ll][Cc]|[Ii][Ee][Pp][Ll]|专线`
  - 匹配含 IPLC/IEPL/专线标识的家宽类型节点
- ★ 主版本号 v5.4.3 → v5.4.4，Build 2026-05-06 → 2026-05-07
- FIX#142（DNS 冷启动）为 Clash Party JS 专属修复，静态配置文件豁免

## v5.4.3-SR.1 (2026-05-06)

- ★ FEAT：家宽 policy-regex-filter 添加 `|[Hh]ome` 关键词（跟随 Clash Party v5.4.3 基线）
  - 所有 9 个家宽区域组的 policy-regex-filter 追加 `|[Hh]ome`，匹配仅含 Home 的节点名

## v5.4.2-SR.1 (2026-05-05)

- ★ FIX#41-P0：小米核心服务 DIRECT 白名单（跟随 Clash Party v5.4.2 基线）
  - 新增 11 条 DOMAIN/DOMAIN-SUFFIX DIRECT 规则前置广告拦截段

## v5.4.0-SR.1 (2026-05-05)

- ★ FEAT#SG：新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立区域组
  - 新加坡从 🌏 亚太节点 中拆分为独立区域
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51
  - 跟随基线 Clash Party v5.4.0

## v5.3.0-SR.1 (2026-04-26)

- ★ REFACTOR#2：流媒体分组架构重构——按区域 → 按平台（7→13 流媒体组）
  - 拆出 5 个主流平台独立组：🎥 Netflix / 🎬 Disney+ / 📡 HBO/Max / 📺 Hulu / 🎬 Prime Video
  - 拆出 2 个全球平台独立组：📹 YouTube / 🎵 音乐流媒体
  - 保留 4 个区域锁区组：🇭🇰 香港流媒体 / 🇹🇼 台湾流媒体 / 🇯🇵 日韩流媒体 / 🇪🇺 欧洲流媒体
  - 新增 🌐 其他国外流媒体 兜底（接收长尾平台 + 原东南亚流媒体）
  - 业务组 25→31，总组 43→49
## v5.2.11-SR.1 (2026-04-26) — 业务组合并精简 28→25（降低用户认知负担）

- ★ **REFACTOR#1**：跟随 Clash Party v5.2.11 基线，业务组合并精简
  - 合并 🔍搜索引擎 + 📟开发者服务 → 新增 🔧工具与服务
  - 合并 📧邮件服务 → 🌐国外网站
  - 合并 ☁️云与CDN → 🌐国外网站
  - 📥下载更新 策略从 DIRECT 优先改为代理优先
  - 🛰️BT/PT Tracker 保留独立
- Bump: `v5.2.10-SR.1` → `v5.2.11-SR.1`

## v5.2.10-SR.1 (2026-04-25) — 境外 DoH 端点改路由到 🚫 受限网站

- ★ **FIX#39**（同构联动）：跟随 Clash Party v5.2.10 基线
  - `DOMAIN,dns.google,☁️ 云与CDN` → `🚫 受限网站`
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `🚫 受限网站`
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `🚫 受限网站`
  - 注：`[General] proxy-dns-server` / `fallback-dns-server` 仍保留 cloudflare/google DoH URL 不动
    （这些是 SR App 自身上游 DoH 配置，与策略组路由无关）
- Bump: `v5.2.8-SR.7` → `v5.2.10-SR.1`（主版本追平到 v5.2.10）

## v5.2.8-SR.7 (2026-04-25) — 欧洲节点 filter 补全 GR/RO/HU/CZ 及多国关键词扩充

- ★ **FIX#29-P2**（同构 bug）：🇪🇺 欧洲节点 + 🏡 欧洲家宽 group filter 补全缺失欧洲国家
  - 上轮 OpenClash 补齐了 15 个欧洲国家 REGIONS，但 iOS 产物 EU filter 未同步
  - 修复：SR/Surge/Loon/QX 的 EU node + EU home filter 新增 GR/RO/HU/CZ 代码 + 全量关键词
    （Greece/Athens/Romania/Bucharest/Hungary/Budapest/Czech/Prague + 中文 + 旗帜 emoji）
  - 同时扩充 PT/BE/IE/DK/NO 的关键词（城市名 + 中文名 + 🇵🇹/🇧🇪/🇮🇪/🇩🇰/🇳🇴）
  - 同构审计：Clash Party JS / OpenClash 已覆盖；CMFA 用 include-all-proxies 兜底全球组（N/A）；SingBox/v2rayN 无运行时节点分类（N/A）
- 版本号 `v5.2.8-SR.6` → `v5.2.8-SR.7` 



## v5.2.8-SR.6 (2026-04-24) — DNSPod DoH 端点切换为纯 IP 形式

- ★ `dns-server` / `proxy-dns-server` 里的 `https://doh.pub/dns-query` 全部替换为
  `https://1.12.12.12/dns-query`
  - DNSPod 纯 IP 形式 DoH 端点，**无需 bootstrap 解析 `doh.pub` 域名**，iOS 冷启动
    或低信号环境下更稳
- 版本号 `v5.2.8-SR.5` → `v5.2.8-SR.6`

## v5.2.8-SR.5 (2026-04-23) — 基线对齐 Clash Party v5.2.8（无代码改动）

- 跟随基线 bump：`v5.2.6-SR.4` → `v5.2.8-SR.5`
- v5.2.7（mirror URL 切换）：SR 直接拉上游 URL，不走 mirror，无需改动
- v5.2.8（CMFA/OpenClash 亚太 filter 同构修复）：SR `policy-regex-filter` 已有 HK/TW/JP/KR 完整覆盖，无需改动

## v5.2.6-SR.4 (2026-04-23) — FINAL 兜底补 `dns-failed` 标志

跨产物审计（PR #65）发现 CLAUDE.md §3.3 硬约束违反：

- ★ **FIX#SR-03-P1**：`FINAL,🐟 漏网之鱼` → `FINAL,🐟 漏网之鱼,dns-failed`
  - 文件：`Shadowrocket/Shadowrocket.conf:1340`
  - 原因：Shadowrocket 的 FINAL 规则默认只在**规则表走完**后兜底；DNS 超时/解析失败**不会**自动落入 FINAL，会直接报错。带上 `dns-failed` 标志后 DNS 失败也会走兜底节点。
  - 权威：CLAUDE.md §3.3 明文规定 `FINAL,🐟 漏网之鱼,dns-failed`；同仓库 `Surge/Surge.conf:1321` 已对齐。
  - 同期审计确认：Loon / Quantumult X 官方文档**未记载** `dns-failed` 标志——Loon `final_rule` 页无说明、QX `sample.conf` 只有 `final, <policy>` 形态，按 CLAUDE.md §2.3 保守原则**不添加**。

头部版本号 v5.2.5-SR.3 → v5.2.6-SR.4（对齐主线 v5.2.6）。

## v5.2.5-SR.3 (2026-04-22) — 移除 72 条 Clash YAML 规则集 + anti-AD/Sukka 兼容修复

深度审查发现仓库 iOS 三兄弟（Loon / Shadowrocket / Quantumult X）共享同一批"Clash Party v5.2.4 基线遗毒"：
- 72 条 Accademia Clash classical `.yaml` RULE-SET（SR 的"auto-detect yaml"只有非官方文档声称，保守视作 Loon 已验证失效同款）
- `anti-ad.net/surge.txt` 裸域名（Loon v5.2.4-Loon.3 已确认部分国内 ISP 会劫持返回 HTML）
- Sukka `List/domainset/*.conf`（Surge 专属二级路径，Loon 不认，SR 官方同样没保证）

本次按 Loon v5.2.4-Loon.2 / .3 已验证的修复模板同步应用：

### 改动

- ★ FIX#SR-01-P1：**删除 72 条 Clash classical `.yaml` RULE-SET**（71 Accademia + 1 ACL4SSR Zoom.yaml），SR 可能沉默加载为 0 条
- ★ FIX#SR-02-P0：`anti-ad.net/surge.txt` → `fastly.jsdelivr.net/gh/privacy-protection-tools/anti-AD@master/anti-ad-surge.txt`
- ★ FIX#SR-03-P0：Sukka `List/domainset/reject_phishing.conf` → `List/non_ip/reject_phishing.conf`
- ★ FIX#SR-04-P1：72 条 yaml 删除后的关键域名补 DOMAIN-SUFFIX 兜底：
  - 🏦 金融支付：Monzo / N26 / Chime + 24 国际银行（Chase / BofA / HSBC / Barclays / DBS / MUFG / RBC / ANZ 等）
  - 🧑‍💼 会议协作：Zoom × 5 / RustDesk / Parsec × 3
  - 🌐 国外网站：Wayback Machine / Pornhub × 3

### 元信息

- 版本：`v5.2.2-SR.2` → **`v5.2.5-SR.3`**（主版本对齐 Clash Party JS `VERSION = 'v5.2.5'`）
- Build：2026-04-20 → 2026-04-22
- 架构一句话：`250+ RULE-SET` → `~290 RULE-SET`
- 清理 15 行孤立的 `# Accademia xxx` 注释头（原 yaml 段已删）

### 已接受的回归损失（与 Loon 一致）

Accademia `FakeLocation × 10`（国内 APP IP 伪装）、`GeoRouting × 17 区域`、`eMuleServer`、`HomeIP`、各国银行细粒度 YAML —— 没有 `.list` 等价源；关键域名已补 DOMAIN-SUFFIX 兜底。完整覆盖请换 CMFA / OpenClash / SingBox。

### 自检

- 代理组 37 个 ✓
- `.yaml,` RULE-SET 残留：0 条 ✓
- `anti-ad.net` 残留：0 次 ✓
- `skk.moe/List/domainset/`：0 次；`List/non_ip/`：1 次 ✓

---

## v5.2.2-SR.2 (2026-04-20)

与 Clash Party 业务组严格对齐：

- ★ 移除多余的 `🎵 TikTok` 业务组（基线共 28 组），TikTok / lemon8 规则并入 `📱 社交媒体`
- ★ 修复 `💬 即时通讯` 引用的区域组 emoji 错误（`🇸🇬 亚太节点` → `🌏 亚太节点`，原引用不存在）

## v5.2.2-SR.1 (2026-04-16)

DNS 段重构，映射用户 Clash DNS 配置：

- ★ 新增 `proxy-dns-server`（隐藏参数，对应 Clash `proxy-server-nameserver`）
- ★ `fallback-dns-server` 从 system 改为国外 DoH（对应 Clash `fallback`）
- ★ `dns-server` 精简为国内 DoH（对应 Clash `nameserver + direct-nameserver`）
- ★ 标注 4 项 Clash DNS / 数据库功能无法迁移（bootstrap / respect-rules / fallback-filter / dat 格式）

## 初版 (从 Clash Party v5.2.2 迁移重构)

- 9 区域 url-test 组（`policy-regex-filter` 自动按地区聚合节点）
- 28 业务策略组（与原版 1:1 对应）
- 规则源：`blackmatrix7/ios_rule_script/rule/Shadowrocket/` + szkane + 原生 GEOIP

### 与 Clash Party 主线的差异（iOS 平台 + SR 引擎限制）

- 删除 PROCESS-NAME 规则（iOS 无进程识别 API）
- 删除 TUN `exclude-process`（SR 无该机制）
- 删除 Smart fingerprint 注入（SR 不暴露 TLS 指纹控制）
- GEOSITE 全部替换为 RULE-SET（SR 不原生支持 GEOSITE）
- Meta `.mrs` 二进制格式全部替换为 blackmatrix7 Shadowrocket `.list`
- Accademia 部分 YAML classical 保留（SR 按内容识别，可解析）— v5.2.5-SR.3 起全部删除，改用 `.list` 等价源 + DOMAIN-SUFFIX 兜底
- rule-provider 的周期刷新改由 SR 的「自动更新配置」统一管理
