# Quantumult X — 变更日志

> `Quantumult X/QuantumultX.conf` 的变更日志。主版本号跟随 Clash Party 主线；尾段 `-QX.N` 独立递增。
>
> 当前仓库无 `tools/srk_to_qx.py`；本产物独立手工维护，并由 `tools/validate-artifact-contracts.js` 做结构和基线验证。

---

## v6.0.14-QX.6 (2026-09-29)

- FIX：第 001 remote filter 加入微信 HTTPDNS 两个精确主机并设为 DIRECT，先于 BlockHttpDNS 拒绝规则。

## v6.0.13-QX.5 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：第 013 remote filter 增加 `host-suffix, linuxdo.org` 并绑定 `🏠 国内网站`；`linux.do` 保持第 059 受限网站 filter。

## v6.0.12-QX.4 (2026-09-01)

- FIX#181-PC：第一个 remote URL filter 增加 `host, login.nvidia.cn` 并绑定 `direct`，其余 NVIDIA 域名继续使用下载组 filter。

## v6.0.11-QX.3 (2026-08-22)

- ROUTING：69 个 remote URL filter 按融合顺序更新；Gemini 与 Accademia Gemini 改走 `🔍 Google 服务`，广告规则仍优先。

## v6.0.10-QX.3 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：同步首段精确直连融合 URL；两个网易游戏服务主机在 anti-AD 和国内游戏宽规则之前命中 `direct`。

## v6.0.9-QX.2 (2026-08-02)

- FIX-NODE-ISO-LOWERCASE：server-tag-regex 在原有大写匹配旁新增“小写 ISO 两位码紧接编号”分支；当订阅解析器把节点名写入 tag 时，yun hk01、yun us01、yun jp01、yun sg01、yun tw01 会进入预期区域。
- GUARD/VERIFY：普通小写短词不扩宽为地区码；跨客户端合同回归 12 个原始 tag 样例，并确认主组、聚合组、家宽组及无编号短词保护。

## v6.0.9-QX.1 (2026-07-19)

- `filter_remote` 加入并前置通用 GitHub API 工具组融合资产；iOS 无桌面进程识别时使用此通用回退。

## v6.0.8-QX.1 (2026-07-15)

- remote filter 同步国内权威优先级，并以发布版本缓存键引用自托管资产。

## v6.0.7-QX.1 (2026-07-14)

- FIX#176：`filter_remote` 顺序同步国内域名优先于通用国际 CDN / GeoIP fallback，新增后置 fallback filter 并保持首匹配语义。

## v6.0.6-QX.1 (2026-07-14)

- PLATFORM：Windows 的 `WorkPro.exe` / `WorkProWebProcess.exe` 进程直连由桌面产物承载；Quantumult X iOS 不新增主动进程规则，继续消费同步后的融合 remote filter。

## v6.0.5-QX.1 (2026-07-14)

- PLATFORM：WorkPro.exe 的 Windows 桌面直连由支持进程匹配的产物承载；Quantumult X iOS 配置不新增主动进程规则。

## v6.0.4-QX.1 (2026-07-13)

- DIRECT-ITWDB：`filter_remote` 的默认 direct 融合资产新增 `host-suffix, itwdb.com`，覆盖 WorkPro 子域名。

## v6.0.3-QX.1 (2026-07-12)

- SYNC：升级到 Clash Party v6.0.3，`filter_remote` 为 64 个非空融合资产，继续保留 QX 原生 GEOIP / IP-ASN 表达。
- AI-PRECEDENCE：ChatGPT/OpenAI 与经验证的 Sentry/DataDog/Cloudflare 关联 host 在广告和国外网站前进入 `🤖 AI 服务`。

## v6.0.2-QX.1 (2026-07-10)

- FIX#175：`filter_remote` 收敛为 63 个非空融合段，聚合文本约 15.56 MiB / 575,498 条。
- NATIVE：国家 GEOIP 输出为 QX 原生 `geoip`，IP-ASN 输出为 `ip-asn`，并保留 `no-resolve`；仅服务型 GEOIP 展开 CIDR。
- DEDUP/BUDGET：继承同策略安全去重并加入 32 MiB / 100 万条聚合门禁。

## v6.0.1-QX.1 (2026-07-10)

- FIX#174：广告融合段和国外网站尾段的超限 remote filter 按 18 MiB 上限拆分为同策略、有序分片。
- SEMANTICS：每个新增 `filter_remote` 保持原 `force-policy`，分流内容与匹配优先级不变。

## v6.0.0-QX.1 (2026-07-09)

- FUSED-RULESETS：迁移到 68 个融合 remote URL filter，保留 QX 必要本地端口/兜底规则。
- META：跟随 Clash Party v6.0.0 更新版本元数据；策略组保持不变。

## v5.4.39-QX.1 (2026-07-09)

- META：跟随 Clash Party v5.4.39 更新版本元数据。
- N/A：Quantumult X 不支持 Mihomo `.mrs` rule-provider；规则语义延续 v5.4.38-QX.1。

## v5.4.38-QX.1 (2026-07-09)

- SCKI-SUPPLEMENTAL：`[filter_remote]` 新增 13 个 Quantumult X 原生 supplemental 规则集，替代 `filter_local` 零星白名单。
- SYNC：版本元数据同步 Clash Party v5.4.38。

## v5.4.37-QX.1 (2026-06-29)

- META#170-DNS-POLICY：跟随 Clash Party v5.4.37 更新版本元数据。
- N/A：Quantumult X 使用 `[dns]` / `[filter_remote]` / `[filter_local]` 私有语法，没有 Mihomo `nameserver-policy` 同字段面；规则与 DNS 语义不变。

## v5.4.36-QX.1 (2026-06-29)

- CLEAN#171-DIRECT：同步删除 22 条经逐条确认的冗余 `host` / `host-suffix` 规则，`filter_remote` 保持不变。
- AI / Binance / Microsoft login 候选因不同策略 `.mrs` 前置阻断，继续保留。

## v5.4.35-QX.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM：删除 5 个已被前序同目标规则覆盖的 `filter_remote`：Marketing、EncoreTVB、FindMy、WildRift、AcFun。
- CLEAN#170-DIRECT：删除 3 条已被前置 Douyin 国内流媒体守卫同目标覆盖的后置 `filter_local`：`douyin.com`、`douyinpic.com`、`douyinvod.com`。
- `filter_remote` 实测数 285 → 280；`filter_local` 556 → 553，QX 本地规则仍只放在 `[filter_local]`。

## v5.4.34-QX.1 (2026-06-28)

- ★ FIX#169-AMAP：新增 blackmatrix7 Quantumult X `GaoDe.list` filter_remote，归入 `🏠 国内网站`。
- 顺序保持在广告/威胁规则之后、国外网站兜底之前，修复 `webapi.amap.com` 高德 API 误走国外的风险。

## v5.4.33-QX.1 (2026-06-27)

- ★ FEAT#169-AI-CODING：新增 VPSDance Quantumult X `coding.list` filter_remote，归入 `🤖 AI 服务`。

## v5.4.32-QX.1 (2026-06-25)

- ★ FIX#168-CN-GAME：`filter_local` 国内游戏段前置到国外游戏段之前；`filter_remote` 保持国内游戏规则集先于国外游戏规则集。
- 文件头与 README 对齐 Clash Party v5.4.32。

## v5.4.31-QX.1 (2026-06-20)

- ★ FIX#167-DOUYIN：在 `[filter_local]` 首段增加抖音 Web 国内流媒体守卫，`douyin.com` / `zjcdn.com` 等域名命中 `📺 国内流媒体`。
- `filter_local` 计数随新增 10 条前置规则更新，文件头与 README 对齐 Clash Party v5.4.31。

## v5.4.30-QX.1 (2026-06-17)

- ★ FEAT#166-GOOGLE：新增 `static=🔍 Google 服务`，插入在 `🔧 工具与服务` 之前。
- Google / Scholar 远程规则改投新组；工具组保留 Bing / Yandex / GitHub / Docker / GitLab / Python / developer 等非 Google 规则。

## v5.4.29-QX.1 (2026-06-10)

- ★ PERF#165-LATENCY：22 个区域 `url-latency-benchmark` 组 `check-interval=180 -> check-interval=300`。
- README 的测速说明同步改为 300s / 5 分钟；`filter_remote` / `filter_local` 规则内容不变。
- 文件头对齐 Clash Party v5.4.29。

## v5.4.28-QX.1 (2026-06-07)

- ★ CLEAN#165（续）：`[filter_local]` 移除 35 行已被同策略 `[filter_remote]` 规则集覆盖的直写域名
  - 🇭🇰 香港流媒体：mytvsuper.com, nowe.com, rthk.hk, cabletv.com.hk（覆盖：myTVSUPER/NowE/RTHK/CableTV）
  - 🇹🇼 台湾流媒体：litv.tv, video.friday.tw, friday.tw, linetv.tw, hamivideo.hinet.net（覆盖：LiTV/friDay/LineTV/HamiVideo）
  - 🇯🇵 日韩流媒体：tver.jp, dmm.com, dmm.co.jp, nicovideo.jp, nicovideo.me（覆盖：TVer/DMM/Niconico）
  - 🇪🇺 欧洲流媒体：itv.com, itvstatic.com, britbox.com（覆盖：ITV/BritboxUK）
  - 🌐 其他国外流媒体：discoveryplus.com, wetv.vip, wetvinfo.com, viki.com, viki.io, mewatch.sg（覆盖：DiscoveryPlus/WeTV/Viki/MeWatch）
  - 🎮 国外游戏：ubisoft.com, ubi.com, riotgames.com, leagueoflegends.com, valorant.com, rockstargames.com, gog.com, gogalaxy.com, supercell.com, garena.com, hoyoverse.com, hoyolab.com（覆盖：UBI/Riot/Rockstar/Gog/Supercell/Garena/HoYoverse）
  - 每处移除位置保留 `# CLEAN#165:` 注释标注覆盖来源

## v5.4.27-QX.1 (2026-06-07)

- ★ CLEAN#165（第 1 批）：同步清理 7 条已由 `[filter_remote]` 覆盖的 `[filter_local]` 直写域名（Claude / PayPal / HBO / Hulu / Xbox）；删除后仍命中同策略组。第 2 批见 v5.4.28-QX.1。

## v5.4.26-QX.1 (2026-06-07)

- ★ FIX#164：腾讯 WorkBuddy `copilot.tencent.com` 国内直连防吞——szkane `AiDomain.list`（`[filter_remote]` tag=aidomain，force-policy=🤖 AI 服务）含 `DOMAIN-KEYWORD,copilot` 子串会把它误吞到国外代理导致对话报错；在 `[filter_local]` 前置 `host-suffix, copilot.tencent.com, 🏠 国内网站`（与既有 RustDesk 防吞守卫并置，本地规则优先于远程资源匹配）。基线 Clash Party v5.4.26。

## v5.4.25-QX.2 (2026-06-05)

- ★ FIX#QX-FILTER-SECTION：将小米 / Cloudflare R2 / Paddle / 推送 SDK / RustDesk 本地白名单从 `[filter_remote]` 移到 `[filter_local]`，避免 QX 把本地 `host/host-suffix` 规则当作远程资源声明处理。
- ★ VERIFY：合同验证新增 `[filter_remote]` 不得包含本地规则、关键白名单必须位于 `[filter_local]` 的检查。

## v5.4.25-QX.1 (2026-06-04)

- ★ SYNC：产物头部版本和基线声明对齐 Clash Party v5.4.25；规则语义延续 v5.4.23-QX.2。
- ★ DOC#QX-P2：移除不存在的 `tools/srk_to_qx.py` 自动转换声明；恢复自动转换前必须先提交脚本并纳入验证。

## v5.4.23-QX.2 (2026-06-02)

- ★ FIX#162：修复 QX `[filter_remote]` 远程规则列表加载失败风险：
  - `ruleset.skk.moe/List/non_ip/reject_phishing.conf` 已 404，QX 继续避开 Surge `domainset`，改用同为 non_ip 通用格式的 `reject.conf`。
  - 移除已失效的 HaGeZi `share/surge-tif-medium.txt`（jsDelivr 403；当前 HaGeZi 无 QX filter_remote 等价格式）。
  - 移除上游已不存在的 `QuantumultX/RemoteDesktop/RemoteDesktop.list`（仅 Clash 端仍有进程名规则，QX 不适用）。
  - `BiliIntl/BiliIntl.list` 路径改为当前上游 `BiliBiliIntl/BiliBiliIntl.list`。

## v5.4.23-QX.1 (2026-06-02)

- ★ FIX#161：`host-suffix, zhimg.com` + `host-suffix, zhihu.co` → 🏠 国内网站 直连（知乎图片 CDN + 短链，同步基线）。

## v5.4.22-QX.1 (2026-05-31)

- ★ GeTui(个推)推送 SDK `getui.com` / `getui.net` / `gepush.com` 加 `[filter_remote]` 直连白名单（review 后补；延续 #2，前置于广告 URL；owner 选放行保 App 推送如米家）。

- N/A#1 QUIC 精细化：QX fallback_udp_policy 不支持 AND/NOT 白名单豁免。引擎标注见文件内注释。

## v5.4.21-QX.1 (2026-05-31)

#4 借鉴 Proxy-override：`doh-server` 从域名 DoH 改为 IP-host DoH（阿里×2 + Google + CF DoH-over-IP），消除 bootstrap 阶段 DNS 泄漏；`server=` 明文 IP 保留兜底。

## v5.4.20-QX.1 (2026-05-30)

- N/A#6 节点过滤关键词补充（批 B）：Quantumult X 不处理订阅去 junk（区域分类用 server-tag-regex，无 junk 排除器），#6 不适用；版本跟随 Clash Party v5.4.20 基线对齐。

## v5.4.19-QX.1 (2026-05-30)

借鉴 Proxy-override 批 A · #2 国内 SDK/CDN 直连前置（跟随 Clash Party v5.4.19；spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- jpush / `msg.umeng.com` 在 `[filter_remote]` 中前置到 `jiguangtuisong` / `youmengchuangxiang` 远程拦截规则之前强制 `direct`（QX 按文件顺序首命中——本产物是除 mihomo 家族外唯一存在该 tracker 拦截冲突的）
- `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` 加入 `[filter_local]` 国内网站兜底段
- 与 Shadowrocket 同步手改（与 `srk_to_qx` 转换风格一致）；不适用 #3 fake-ip-filter / #5 direct-nameserver-follow-policy（非 mihomo 内核）
- 🔢 版本：v5.4.17-QX.1 → v5.4.19-QX.1（全产物跳过烧毁的 .18 统一到 v5.4.19）
## v5.4.17-QX.2 (2026-05-30)

- ★ FIX#KR-WB：日韩 / 亚太 `server-tag-regex` 裸 `KR` 补词边界 `(?<![a-zA-Z])KR(?![a-zA-Z])`（与本文件 US/SG 写法一致）
  - 大小写敏感下仅大写 `KR` 子串误伤（KRAKEN / DARKROOM → 🇯🇵 日韩节点），加边界后消除
  - 覆盖日韩 / 日韩家宽 / 亚太 / 亚太家宽 4 行；KOR/Korea/Seoul/🇰🇷 完整词不受影响
  - §1.5 同构审计：主线 JS + CMFA 本就带边界未改（QX 由 Shadowrocket 转换，已同步等价修改）
  - 回归测试见 `tools/test-kr-boundary.js`

## v5.4.17-QX.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP：Quantumult X DNS 同步 v5.4.17 平台等价写法
  - `server=` 只保留纯 IP bootstrap 列表，DoH URL 继续使用 `doh-server=`
  - QX 无 Mihomo 的四段 DNS 模型，且多条 `doh-server` 的故障转移能力受客户端实现限制

## v5.4.16-QX.1 (2026-05-20)

- ✅ FIX#149-P0：前置 `host-suffix, paddle.com, 🏦 金融支付`
  - 覆盖 anti-AD/DustinWin 对 `analytics.paddle.com` 的误拦截
  - 规则放在 `[filter_remote]` 顶部，先于 anti-AD / phishing / TIF 远程规则

## v5.4.15-QX.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER：同步 Clash Party v5.4.15 元数据，新增 GEOSITE 覆盖台账引用。
- ♻️ REFACTOR#AD-FP-MODULE：[filter_remote] 顶部显式标记 Anti-ad false-positive allowlist；本地 host/host-suffix 白名单仍前置于远程广告过滤器。

## v5.4.14-QX.1 (2026-05-20)

- ✅ FIX#CF-R2-P0：`host-suffix, cloudflarestorage.com, 🌐 国外网站` 前置到广告远程规则之前
  - 覆盖 Sukka phishing 对 Cloudflare R2 存储域的误拦截
  - 后段 `🌐 国外网站` 重复条目已移除

## v5.4.13-QX.1 (2026-05-19)

- ✅ FIX#STUN-PORTS：用 QX 原生 `dst-port` 补齐 STUN/TURN 标准端口 `5349 / 19302 / 19305 / 19307 -> DIRECT`
- N/A#FAKE-IP：Quantumult X 无 Mihomo `fake-ip-filter`；UDP fallback 策略保持不变

## v5.4.12-QX.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 documentation for the RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Quantumult X has no Mihomo fake-ip-filter field; existing rustdesk.com meeting-collaboration routing is unchanged.

## v5.4.11-QX.1 (2026-05-12)

- ✅ FIX#RD-DOMAIN：保留 `rustdesk.com` 会议协作域名兜底，移动端无进程匹配时仍避免 Copilot 宽规则误吞
- ✅ FIX#DNS-BOOTSTRAP：普通 DNS 继续使用 IP 字段，DoH 顺序调整为 AliDNS 优先；内联规则数更新为 568

## v5.4.9-QX.1 (2026-05-11)

- ★ META#LOCAL-TOOLS：跟随 Clash Party v5.4.9 基线；Quantumult X 为 iOS 端产物，本轮不写入 PROCESS-NAME 规则，避免引入不被其配置结构消费的桌面进程名。
- 直连工具清单已进入 `docs/process-name-compatibility.md` 与测试夹具，桌面端由 mihomo / sing-box / Surge Mac 承接。

## v5.4.8-QX.2 (2026-05-11)

- ★ META#GROUP-COUNT：同步文件头与 README 的区域组数量说明为 22 组（11 全部 + 11 家宽）
  - 不改变 `[policy]` / `[filter_remote]` / `[filter_local]` 语义

## v5.4.8-QX.1 (2026-05-09)

- ★ ORDER#RULE-TAIL：同步 Clash Party v5.4.8 规则尾段匹配顺序
  - `[policy]` UI 顺序不变；仅调整 `[filter_remote]` / `[filter_local]` 顺序

## v5.4.7-QX.1 (2026-05-09)

- ★ FEAT#TikTok：新增独立 `🎵 TikTok` 业务组（32 业务组），置于 `📺 国内流媒体` 与 `🎥 Netflix` 之间
  - `[policy]` 加 `static=🎵 TikTok,...`；`[filter_remote]` TikTok filter `force-policy` 改为 `🎵 TikTok`
- ★ FIX#HK：香港节点 `server-tag-regex` 追加 `|广港`

## v5.4.6-QX.1 (2026-05-08)

- ★ FEAT#145：WeChat CDN 直连 — 新增 `host-suffix, cdn.weixin.qq.com, DIRECT`
  - 于阶段 28（Chiphell 论坛直连）`iwipwedabay.com` 后新增，WeChat CDN 域名直连
  - 跟随 Clash Party v5.4.6 基线

## v5.4.5-QX.1 (2026-05-07)

- ★ 全球节点置顶 + 全产品组顺序同步（跟随基线 v5.4.5）

## v5.4.4-QX.1 (2026-05-07)

- ★ FIX#144：新增 bbys.app 直连规则（国内可访问视频站点 CDN 域名直连）
  - 于阶段 28（国内网站兜底）末尾新增 `host-suffix, bbys.app, DIRECT`
  - 跟随 Clash Party v5.4.4 基线
- ★ FEAT#143：家宽 server-tag-regex 新增 IEPL/IPLC/专线识别
  - 所有 10 个家宽区域组的 `server-tag-regex` 中 residential 子模式追加 `[Ii][Pp][Ll][Cc]|[Ii][Ee][Pp][Ll]|专线`
  - 匹配含 IPLC/IEPL/专线标识的家宽类型节点
- ★ 主版本号 v5.4.3 → v5.4.4，Build 2026-05-06 → 2026-05-07
- FIX#142（DNS 冷启动）为 Clash Party JS 专属修复，静态配置文件豁免

## v5.4.3-QX.1 (2026-05-06)

- ★ FEAT：家宽 server-tag-regex 添加 `|[Hh]ome` 关键词（跟随 Clash Party v5.4.3 基线）
  - 所有 9 个家宽区域组的 server-tag-regex 追加 `|[Hh]ome`，匹配仅含 Home 的节点名

## v5.4.2-QX.1 (2026-05-05)

- ★ FIX#41-P0：小米核心服务 DIRECT 白名单（跟随 Clash Party v5.4.2 基线）
  - 新增 11 条 host/host-suffix direct 规则置于 [filter_remote] 段之前

## v5.4.0-QX.1 (2026-05-05)

- ★ FEAT#SG：新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立区域组
  - 新加坡从 🌏 亚太节点 中拆分为独立区域
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51
  - 跟随基线 Clash Party v5.4.0

## v5.3.0-QX.1 (2026-04-26)

- ★ REFACTOR#2：流媒体分组架构重构——按区域 → 按平台（7→13 流媒体组）
  - 拆出 5 个主流平台独立组：🎥 Netflix / 🎬 Disney+ / 📡 HBO/Max / 📺 Hulu / 🎬 Prime Video
  - 拆出 2 个全球平台独立组：📹 YouTube / 🎵 音乐流媒体
  - 保留 4 个区域锁区组：🇭🇰 香港流媒体 / 🇹🇼 台湾流媒体 / 🇯🇵 日韩流媒体 / 🇪🇺 欧洲流媒体
  - 新增 🌐 其他国外流媒体 兜底（接收长尾平台 + 原东南亚流媒体）
  - 业务组 25→31，总组 43→49
## v5.2.11-QX.1 (2026-04-26) — 业务组合并精简 28→25（降低用户认知负担）

- ★ **REFACTOR#1**：跟随 Clash Party v5.2.11 基线，业务组合并精简
  - 合并 🔍搜索引擎 + 📟开发者服务 → 新增 🔧工具与服务
  - 合并 📧邮件服务 → 🌐国外网站
  - 合并 ☁️云与CDN → 🌐国外网站
  - 📥下载更新 策略从 DIRECT 优先改为代理优先
  - 🛰️BT/PT Tracker 保留独立
- Bump: `v5.2.10-QX.3` → `v5.2.11-QX.1`

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
