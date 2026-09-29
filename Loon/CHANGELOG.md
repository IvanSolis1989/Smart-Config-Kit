# Loon — 变更日志

> `Loon/Loon.conf` 的变更日志。主版本号跟随 Clash Party 主线；尾段 `-Loon.N` 独立递增。

---

## v6.0.14-Loon.5 (2026-09-29)

- FIX：第 001 远程 DIRECT Rule 加入微信 HTTPDNS 两个精确主机；规则优先于 BlockHttpDNS 拒绝规则。

## v6.0.13-Loon.4 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：第 013 Remote Rule 增加 `linuxdo.org` 后缀并绑定 `🏠 国内网站`；`linux.do` 保持受限网站。

## v6.0.12-Loon.3 (2026-09-01)

- FIX#181-PC：首个融合 Remote Rule 增加 `login.nvidia.cn` 精确直连，优先于 NVIDIA 下载宽规则；其他 NVIDIA 域名不变。

## v6.0.11-Loon.2 (2026-08-22)

- ROUTING：同步 69 个融合 Remote Rule；Gemini 与 Accademia Gemini 改走 `🔍 Google 服务`，szkane AI 段保持原位。

## v6.0.10-Loon.2 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：同步首段精确直连融合规则；两个网易游戏服务主机在 anti-AD 和国内游戏宽规则之前命中 `DIRECT`。

## v6.0.9-Loon.1 (2026-07-19)

- Remote Rule 顺序加入通用 GitHub API 工具组段，避免普通请求被广义 AI 规则提前匹配。

## v6.0.8-Loon.1 (2026-07-15)

- Remote Rule 同步国内权威优先级，并以发布版本缓存键引用自托管资产。

## v6.0.7-Loon.1 (2026-07-14)

- FIX#176：`[Remote Rule]` 的融合资产顺序同步国内域名优先于通用国际 CDN / GeoIP fallback。

## v6.0.6-Loon.1 (2026-07-14)

- PLATFORM：Windows 的 `WorkPro.exe` / `WorkProWebProcess.exe` 进程直连由桌面产物承载；Loon iOS 不新增主动进程规则，继续消费同步后的融合远程规则集。

## v6.0.5-Loon.1 (2026-07-14)

- PLATFORM：WorkPro.exe 的 Windows 桌面直连由支持进程匹配的产物承载；Loon iOS 配置不新增主动进程规则。

## v6.0.4-Loon.1 (2026-07-13)

- DIRECT-ITWDB：`[Remote Rule]` 消费的默认 `DIRECT` 融合规则集新增 `itwdb.com`，覆盖 WorkPro 子域名。

## v6.0.3-Loon.1 (2026-07-12)

- SYNC：升级到 Clash Party v6.0.3，`[Remote Rule]` 为 64 个非空融合资产。
- AI-PRECEDENCE：按 source graph 的前置顺序将 ChatGPT/OpenAI 及必要关联 host 分配给 `🤖 AI 服务`，不落入广告或国外网站兜底。

## v6.0.2-Loon.1 (2026-07-10)

- FIX#175：`[Remote Rule]` 从 71 个放大分片收敛为 63 个非空融合段，聚合文本约 16.06 MiB / 575,499 条。
- GEOIP：国家码保留为 Loon 原生 GEOIP，服务型标签才转换为 CIDR；不再把区域 GeoRouting 规则展开为数十万网段。
- BUDGET：配置纳入 iOS 32 MiB / 100 万条聚合门禁和 18 MiB 单文件门禁。

## v6.0.1-Loon.1 (2026-07-10)

- FIX#174：超出 CDN 单文件预算的广告融合段拆为 3 个 `[Remote Rule]`，国外网站尾段拆为 2 个；每个远程文本分片不超过 18 MiB。
- SEMANTICS：分片保留原 tag 对应策略和顺序，不改变 Loon 的最终分流优先级。

## v6.0.0-Loon.1 (2026-07-09)

- FUSED-RULESETS：迁移到 68 个融合 `[Remote Rule]`，保留必要本地端口/兜底规则。
- META：跟随 Clash Party v6.0.0 更新版本元数据；策略组保持不变。

## v5.4.39-Loon.1 (2026-07-09)

- META：跟随 Clash Party v5.4.39 更新版本元数据。
- N/A：Loon 不支持 Mihomo `.mrs` rule-provider；规则语义延续 v5.4.38-Loon.1。

## v5.4.38-Loon.1 (2026-07-09)

- SCKI-SUPPLEMENTAL：`[Remote Rule]` 新增 13 个仓库维护的 supplemental 规则集，替代主规则零星直写。
- SYNC：版本元数据同步 Clash Party v5.4.38。

## v5.4.37-Loon.1 (2026-06-29)

- META#170-DNS-POLICY：跟随 Clash Party v5.4.37 更新版本元数据。
- N/A：Loon 使用 `dns-server` / `doh-server` / `[Host]` 语法，没有 Mihomo `nameserver-policy` 同字段面；规则与 DNS 语义不变。

## v5.4.36-Loon.1 (2026-06-29)

- CLEAN#171-DIRECT：同步删除 22 条经逐条确认的冗余 `DOMAIN` / `DOMAIN-SUFFIX` 规则，远程规则集保持不变。
- AI / Binance / Microsoft login 候选因不同策略 `.mrs` 前置阻断，继续保留。

## v5.4.35-Loon.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM：删除 5 个已被前序同目标规则覆盖的 Remote Rule：Marketing、EncoreTVB、FindMy、WildRift、AcFun。
- CLEAN#170-DIRECT：删除 3 条已被前置 Douyin 国内流媒体守卫同目标覆盖的后置直写规则：`douyin.com`、`douyinpic.com`、`douyinvod.com`。
- `[Remote Rule]` 实测数 288 → 283；Loon 专属 `DEST-PORT` / 分段规则语义不变。

## v5.4.34-Loon.1 (2026-06-28)

- ★ FIX#169-AMAP：新增 blackmatrix7 Loon `GaoDe.list` Remote Rule，归入 `🏠 国内网站`。
- 顺序保持在广告/威胁规则之后、国外网站兜底之前，修复 `webapi.amap.com` 高德 API 误走国外的风险。

## v5.4.33-Loon.1 (2026-06-27)

- ★ FEAT#169-AI-CODING：新增 VPSDance Loon `coding.list` Remote Rule，归入 `🤖 AI 服务`。

## v5.4.32-Loon.1 (2026-06-25)

- ★ FIX#168-CN-GAME：`[Remote Rule]` 与 `[Rule]` 两处国内游戏段均前置到国外游戏段之前，保持 Loon 私有语法下的首匹配优先级。
- 文件头与 README 对齐 Clash Party v5.4.32。

## v5.4.31-Loon.1 (2026-06-20)

- ★ FIX#167-DOUYIN：新增抖音 Web 国内流媒体前置规则，`douyin.com` / `zjcdn.com` 等域名先于 TikTok 和国外规则集命中 `📺 国内流媒体`。
- 文件头与 README 对齐 Clash Party v5.4.31。

## v5.4.30-Loon.1 (2026-06-17)

- ★ FEAT#166-GOOGLE：新增 `🔍 Google 服务` 策略组，插入在 `🔧 工具与服务` 之前。
- Google Search / Drive / Earth / Google / Scholar 规则集改投新组；工具组保留非 Google 搜索和开发者服务。

## v5.4.29-Loon.1 (2026-06-10)

- ★ PERF#165-LATENCY：22 个区域 `url-test` 组 `interval=180 -> interval=300`。
- README 的 Loon 区域组示例同步改为 `interval=300,tolerance=50`。
- 规则、Remote Filter 与业务组候选不变。

## v5.4.27-Loon.1 (2026-06-07)

- ★ CLEAN#165：同步清理 7 条已由 `[Remote Rule]` 覆盖的本地直写域名（Claude / PayPal / HBO / Hulu / Xbox）；删除后仍命中同策略组。

## v5.4.26-Loon.1 (2026-06-07)

- ★ FIX#164：腾讯 WorkBuddy `copilot.tencent.com` 国内直连防吞——szkane `AiDomain.list` 的 `DOMAIN-KEYWORD,copilot` 子串会把它误吞到 `🤖 AI 服务`（国外代理）导致对话报错；在 [Rule] 段 szkane AiDomain 规则集之前前置 `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站`（与既有 RustDesk 防吞守卫并置）。基线 Clash Party v5.4.26。

## v5.4.25-Loon.1 (2026-06-04)

- ★ SYNC：产物头部版本和基线声明对齐 Clash Party v5.4.25；规则语义延续 v5.4.23-Loon.2，无新增 Loon 专属规则变更。

## v5.4.23-Loon.2 (2026-06-02)

- ★ FIX#162：修复 Loon 远程规则列表加载失败风险：
  - `ruleset.skk.moe/List/non_ip/reject_phishing.conf` 已 404，Loon 继续避开 Surge `domainset`，改用同为 non_ip 通用格式的 `reject.conf`。
  - 移除已失效的 HaGeZi `share/surge-tif-medium.txt`（jsDelivr 403；当前 HaGeZi 无 Loon RULE-SET 等价格式）。
  - 移除上游已不存在的 `Loon/RemoteDesktop/RemoteDesktop.list`（仅 Clash 端仍有进程名规则，Loon 不适用）。
  - `BiliIntl/BiliIntl.list` 路径改为当前上游 `BiliBiliIntl/BiliBiliIntl.list`。

## v5.4.23-Loon.1 (2026-06-02)

- ★ FIX#161：`DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` → 🏠 国内网站 直连（知乎图片 CDN + 短链，同步基线）。

## v5.4.22-Loon.1 (2026-05-31)

- ★ GeTui(个推)推送 SDK `getui.com` / `getui.net` / `gepush.com` 加直连白名单（review 后补；延续 #2，被通用广告/隐私表当 tracker 拦截但承载 App 推送如米家；owner 选放行）。

- N/A#1 QUIC 精细化：Loon disable-udp-ports 不支持 AND/NOT 白名单豁免。引擎标注见文件内注释。

## v5.4.21-Loon.1 (2026-05-31)

#4 借鉴 Proxy-override：`doh-server` 从域名 DoH 改为 IP-host DoH，消除 bootstrap 阶段 DNS 泄漏；`dns-server` 明文 IP 保留兜底（Loon 不支持 DoH URL 放 dns-server）。

## v5.4.20-Loon.1 (2026-05-30)

- N/A#6 节点过滤关键词补充（批 B）：Loon 不处理订阅去 junk（无运行时 junk 过滤器），#6 不适用；版本跟随 Clash Party v5.4.20 基线对齐。

## v5.4.19-Loon.1 (2026-05-30)

借鉴 Proxy-override 批 A · #2 国内 SDK/CDN 直连前置（跟随 Clash Party v5.4.19；spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- jpush / `msg.umeng.com` 前置到广告拦截 RULE-SET 之前强制 DIRECT（承载合法 App 推送/消息；与 mihomo 家族行为对齐）
- `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` 加入 🏠 国内网站段
- 不适用 #3 fake-ip-filter（Loon 无该字段）/ #5 direct-nameserver-follow-policy（非 mihomo 内核）
- 🔢 版本：v5.4.17-Loon.1 → v5.4.19-Loon.1（全产物跳过烧毁的 .18 统一到 v5.4.19）
## v5.4.17-Loon.2 (2026-05-30)

- ★ FIX#KR-WB：`JPKR_Filter` / `APAC_Filter`（及对应家宽）裸 `KR` 补词边界 `(?<![a-zA-Z])KR(?![a-zA-Z])`（与本文件 US/SG 写法一致）
  - Loon `NameRegex` 带 `(?i)`，原裸 `KR` 连小写 `kr` 也误伤（Ukraine / Krakow / Kraken → 🇯🇵 日韩节点），加边界后消除
  - 覆盖 JPKR_Filter / JPKR_HOME_Filter / APAC_Filter / APAC_HOME_Filter 4 处；KOR/Korea/Seoul/🇰🇷 完整词不受影响
  - §1.5 同构审计：主线 JS + CMFA 本就带边界未改
  - 回归测试见 `tools/test-kr-boundary.js`

## v5.4.17-Loon.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP：Loon DNS 同步 v5.4.17 平台等价写法
  - `dns-server` 只保留纯 IP bootstrap 列表，DoH URL 仅放 `doh-server`
  - Loon 无 Mihomo 的 `direct-nameserver` / `proxy-server-nameserver` 四段分离，按原生字段做 best-effort 映射

## v5.4.16-Loon.1 (2026-05-20)

- ✅ FIX#149-P0：本地 `[Rule]` 前置 `DOMAIN-SUFFIX,paddle.com,🏦 金融支付`
  - Loon 本地规则优先于远程规则，用于覆盖 anti-AD/DustinWin 对 `analytics.paddle.com` 的误拦截

## v5.4.15-Loon.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER：同步 Clash Party v5.4.15 元数据，新增 GEOSITE 覆盖台账引用。
- ♻️ REFACTOR#AD-FP-MODULE：本地 [Rule] 顶部显式标记 Anti-ad false-positive allowlist；Loon 本地规则仍优先于远程规则。

## v5.4.14-Loon.1 (2026-05-20)

- ✅ FIX#CF-R2-P0：本地 `[Rule]` 前置 `DOMAIN-SUFFIX,cloudflarestorage.com,🌐 国外网站`
  - Loon 本地规则优先于订阅规则，用于覆盖 Sukka phishing 对 Cloudflare R2 存储域的误拦截
  - 后段 `🌐 国外网站` 重复条目已移除

## v5.4.13-Loon.1 (2026-05-19)

- ✅ FIX#STUN-PORTS：用 Loon 原生 `DEST-PORT` 补齐 STUN/TURN 标准端口 `5349 / 19302 / 19305 / 19307 -> DIRECT`
- N/A#FAKE-IP：Loon 无 Mihomo `fake-ip-filter`；`disable-udp-ports = 443` 仍表示 UDP/443 不作为默认 TURN 例外

## v5.4.12-Loon.2 (2026-05-16)

- ✅ FIX#LOON-REMOTE-RULE：将 288 条远程规则集 URL 统一恢复到 `[Remote Rule]` 段，避免 Loon 在 `[Rule]` 段把 `https://...` 判为语法错误。
- ✅ FIX#LOON-LOCAL-RULE：小米 DIRECT 白名单与 `DOMAIN` / `GEOIP` / `FINAL` 本地规则保留在 `[Rule]` 段；策略组、规则源与业务语义不变。

## v5.4.12-Loon.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 documentation for the RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Loon has no Mihomo fake-ip-filter field; existing rustdesk.com meeting-collaboration routing is unchanged.

## v5.4.11-Loon.1 (2026-05-12)

- ✅ FIX#RD-DOMAIN：保留 `rustdesk.com` 会议协作域名兜底，移动端无进程匹配时仍避免 Copilot 宽规则误吞
- ✅ FIX#DNS-BOOTSTRAP：`doh-server` 顺序调整为 AliDNS 优先，与本轮 DNS 自举修复保持一致

## v5.4.9-Loon.1 (2026-05-11)

- ★ META#LOCAL-TOOLS：跟随 Clash Party v5.4.9 基线；Loon 为 iOS 端产物，本轮不写入 PROCESS-NAME 规则，避免把桌面进程名误同步到移动端配置。
- 直连工具清单已进入 `docs/process-name-compatibility.md` 与测试夹具，桌面端由 mihomo / sing-box / Surge Mac 承接。

## v5.4.8-Loon.2 (2026-05-11)

- ★ META#GROUP-COUNT：同步文件头与 README 的区域组数量说明为 22 组（11 全部 + 11 家宽）
  - 不改变 `[Proxy Group]` / `[Remote Rule]` / `[Rule]` 语义

## v5.4.8-Loon.1 (2026-05-09)

- ★ ORDER#RULE-TAIL：同步 Clash Party v5.4.8 规则尾段匹配顺序
  - 策略组 UI 顺序不变；仅调整规则匹配顺序

## v5.4.7-Loon.1 (2026-05-09)

- ★ FEAT#TikTok：新增独立 `🎵 TikTok` 业务组（32 业务组），置于 `📺 国内流媒体` 与 `🎥 Netflix` 之间
- ★ FIX#HK：`HK_Filter` / `HK_HOME_Filter` 追加 `|广港`，补全 IEPL/IPLC 跨境专线节点分类

## v5.4.6-Loon.1 (2026-05-08)

- ★ FEAT#145：WeChat CDN 直连 — 新增 `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT`
  - 于阶段 7（国内邮箱直连）`mail.qq.com` 后新增，WeChat CDN 域名直连
  - 跟随 Clash Party v5.4.6 基线

## v5.4.5-Loon.1 (2026-05-07)

- ★ 全球节点置顶 + 全产品组顺序同步（跟随基线 v5.4.5）

## v5.4.4-Loon.1 (2026-05-07)

- ★ FIX#144：新增 bbys.app 直连规则（国内可访问视频站点 CDN 域名直连）
  - 于阶段 28（国内网站兜底）末尾新增 `DOMAIN-SUFFIX,bbys.app,DIRECT`
  - 跟随 Clash Party v5.4.4 基线
- ★ FEAT#143：家宽 NameRegex FilterKey 新增 IEPL/IPLC/专线识别
  - 所有 10 个 `*_HOME_Filter` 的 FilterKey 中 residential 子模式追加 `iplc|iepl|专线`
  - 匹配含 IPLC/IEPL/专线标识的家宽类型节点
- ★ 主版本号 v5.4.3 → v5.4.4，Build 2026-05-06 → 2026-05-07
- FIX#142（DNS 冷启动）为 Clash Party JS 专属修复，静态配置文件豁免

## v5.4.3-Loon.1 (2026-05-06)

- ★ FEAT：家宽 FilterKey 添加 `|home` 关键词（跟随 Clash Party v5.4.3 基线）
  - 所有 9 个 `*_HOME_Filter` 的 FilterKey 追加 `|home`，匹配仅含 Home 的节点名

## v5.4.2-Loon.1 (2026-05-05)

- ★ FIX#41-P0：小米核心服务 DIRECT 白名单（跟随 Clash Party v5.4.2 基线）
  - 新增 11 条 DOMAIN/DOMAIN-SUFFIX DIRECT 规则置于 [Remote Rule] 段之前

## v5.4.0-Loon.1 (2026-05-05)

- ★ FEAT#SG：新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立区域组
  - 新加坡从 🌏 亚太节点 中拆分为独立区域
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51
  - 跟随基线 Clash Party v5.4.0

## v5.3.0-Loon.1 (2026-04-26)

- ★ REFACTOR#2：流媒体分组架构重构——按区域 → 按平台（7→13 流媒体组）
  - 拆出 5 个主流平台独立组：🎥 Netflix / 🎬 Disney+ / 📡 HBO/Max / 📺 Hulu / 🎬 Prime Video
  - 拆出 2 个全球平台独立组：📹 YouTube / 🎵 音乐流媒体
  - 保留 4 个区域锁区组：🇭🇰 香港流媒体 / 🇹🇼 台湾流媒体 / 🇯🇵 日韩流媒体 / 🇪🇺 欧洲流媒体
  - 新增 🌐 其他国外流媒体 兜底（接收长尾平台 + 原东南亚流媒体）
  - 业务组 25→31，总组 43→49
## v5.2.11-Loon.1 (2026-04-26) — 业务组合并精简 28→25（降低用户认知负担）

- ★ **REFACTOR#1**：跟随 Clash Party v5.2.11 基线，业务组合并精简
  - 合并 🔍搜索引擎 + 📟开发者服务 → 新增 🔧工具与服务
  - 合并 📧邮件服务 → 🌐国外网站
  - 合并 ☁️云与CDN → 🌐国外网站
  - 📥下载更新 策略从 DIRECT 优先改为代理优先
  - 🛰️BT/PT Tracker 保留独立
- Bump: `v5.2.10-Loon.2` → `v5.2.11-Loon.1`

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
