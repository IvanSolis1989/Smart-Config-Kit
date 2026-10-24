# Surge — 变更日志

> `独立内核系/Surge/Surge.conf` 的变更日志。主版本号跟随 Clash Party 主线；尾段 `-Surge.N` 独立递增。

---

## v6.0.20-Surge.13 (2026-10-24)

- 将客户端目录归入内核系列分类，原有配置文件与说明保留在客户端子目录；规则语义和配置字段不变。旧 Raw 配置链接因路径迁移而变化，现有用户需重新导入对应配置；共享 `rulesets/` 资产地址保持不变。

## v6.0.20-Surge.12 (2026-10-20)

- FIX#190：从 `[General].tun-excluded-routes` 移除 `198.18.0.0/15`，避免 Surge 自身 Fake IP 和 DNS 响应器被排除在 VIF 外；保留其他旁路路由、DNS 服务器与业务规则。
- 新增完整 Fake IP 池与两种流量选项渲染的回归检查；合同验证禁止与该池重叠的排除路由（包含超网和子网），并接入 CI。
- 已复查 [Advanced DNS](https://manual.nssurge.com/dns/advanced.html) 与 [General](https://manual.nssurge.com/profile/general.html#tun-excluded-routes)；跨端静态审计及 独立内核系/Loon/Shadowrocket 保留原因见 [REFERENCE](REFERENCE-surge-manual.md#vif-与-fake-ip-接管约束)。这是 Surge 原生 VIF 配置修复，不修改源规则图或融合资产，无需其他产物重生成。未执行 App 真机验收，恢复结果需在报告者设备复测。

## v6.0.20-Surge.11 (2026-10-19)

- 删除未被 Surge 识别的 `[DNS]` 节及其中两个无效键；保留 `[General]` 的 DNS 服务器、次序和出站模式。多个加密 DNS 并发首答，普通 DNS 不承担普通域名的超时兜底，也不提供失败后自动转代理。
- 官方协议文档更正 TUIC v5、Hysteria 2、AnyTLS 与 Mac 专用 External 支持说明；保存官方正文、稳定版及预发布元数据，详见[苹果客户端复核](../../docs/upstream/2026-10-19/apple/report.md)。
- 本次仅修正 Surge 原生配置与文档；其他客户端没有该 `[DNS]` 节。静态验证不能替代 Surge App 内 DNS 故障与流量验证。

## v6.0.20-Surge.10 (2026-10-16)

- Issue #187：在既有 `scki-adfp-direct` 中为 `szlong.weixin.qq.com`、`hklong.weixin.qq.com`、`hkshort.weixin.qq.com` 增加精确 DIRECT 例外，防止微信连接端点先命中广告集合。
- 不扩大到父域或子域，`ad.weixin.qq.com`、`log.weixin.qq.com` 保持广告拒绝；不改变其他策略或规则顺序。
- 依据与有限静态验收范围见[微信连接复查](../../docs/research/2026-10-16-wechat-issue-187.md)；报告者设备是否恢复仍待实际复测。

## v6.0.19-Surge.9 (2026-10-15)

- FIX#186：自有远程规则资产统一使用 GitHub raw HTTPS，避开 jsDelivr 仓库大小门槛；保留版本查询参数与原生格式。
- 复用已验证的融合载荷，规则内容、顺序和策略不变；补充 raw/CDN 引用识别回归。原因、下载前提与官方字段依据见[规则下载说明](../../docs/rule-asset-delivery.md)。

## v6.0.18-Surge.8 (2026-10-14)

- 修复跨服务首匹配误归类；规范 Apple/Microsoft 过宽关键词和共享 AWS/Azure/CDN 后缀，加入 game-cn、microsoft-live、microsoft-ai、intl-site、stream-jpkr、tools、social、bytedance-app 八类 guard。证书吊销/状态查询的 CA 精确主机直连与微软邮件精确国际策略新增 6 条 ADFP 记录，总数 35。`api.byteoversea.com` 作为精确 TikTok 规则，不扩共享后缀。保留现有 Claude Desktop `a-api`/`a-cdn` 精确例外、QUIC/测速选项和默认关闭的 ZeroTier 代理开关。Crisp relay 仅为静态 ASN 覆盖风险推断，并非实测事故。
- 源规则图 v6.0.18：525 providers / 984 source rules；生成 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 non-empty SRS across 81 segments。

## v6.0.17-Surge.7 (2026-10-13)

- 在现有 `scki-adfp-ai` 精确加入 `a-api.anthropic.com` 与 `a-cdn.anthropic.com`，供 Claude Desktop 应用代码和用户内容加载所需主机走 AI 服务策略。依据 [官方 Desktop 网络要求](https://code.claude.com/docs/en/desktop#network-access-requirements)；不推断 `a-api` 的具体路径。
- 本端规则集与原生语法沿用现有实现；来源语义 gate、29 条 ADFP 例外校验、Claude 服务阶段清单及文件级发布批次检查接入同一发布链。详见 [Claude 服务依赖台账](../../docs/claude-service-dependencies.md) 与 [发布批次检查](../../docs/release-batch.md)。未进行真机故障复现或测量。

## v6.0.16-Surge.7 (2026-10-12)

- 本端随 v6.0.16 主线登记来源/版本收据、有序 domain-projection 差分及现有 ADFP 例外双向校验；客户端转换格式、规则顺序和目标策略沿用既有实现，未新增运行时规则。详见[规则质量台账](../../docs/rule-quality.md)。
- 复用当前 fused 载荷，只记录当前可观察字节及转换收据；旧资产的原始远端输入 SHA 无法从输出反推，因此不宣称完整历史来源追溯，也未进行真机流量测量。

## v6.0.15-Surge.7 (2026-10-07)

- 受管配置支持 900 秒结果有效期与海外 UDP/443 策略选择；自动组按 Surge 原生机制在使用时复测。
- 切换命令、平台能力及验证方法见 [测速与 QUIC 策略选项](../../docs/traffic-options.md)。

## v6.0.14-Surge.6 (2026-09-29)

- FIX：第 001 远程 DIRECT RULE-SET 加入微信 HTTPDNS 两个精确主机；规则优先于 BlockHttpDNS 拒绝规则。

## v6.0.13-Surge.5 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：第 013 远程 RULE-SET 增加 `DOMAIN-SUFFIX,linuxdo.org` 并绑定 `🏠 国内网站`；`linux.do` 保持受限网站。

## v6.0.12-Surge.4 (2026-09-01)

- FIX#181-PC：首个融合远程 RULE-SET 增加 `login.nvidia.cn` 精确直连，优先于 NVIDIA 下载宽规则；其他 NVIDIA 域名不变。

## v6.0.11-Surge.3 (2026-08-22)

- ROUTING：同步 69 个融合远程 RULE-SET；Gemini 与 Accademia Gemini 首命中改走 `🔍 Google 服务`，其余 AI 策略不变。

## v6.0.10-Surge.3 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：同步首段精确直连融合规则；两个网易游戏服务主机在 anti-AD 和国内游戏宽规则之前命中 `DIRECT`。

## v6.0.9-Surge.2 (2026-08-02)

- FIX-NODE-ISO-LOWERCASE：11 个地区及家宽 policy-regex-filter 在原有大写匹配旁新增“小写 ISO 两位码紧接编号”分支；带编号的 yun hk01、yun us01、yun jp01、yun sg01、yun tw01 现会归入相应地区策略组。
- GUARD/VERIFY：普通小写短词不扩宽为地区码；跨客户端合同固定执行 12 个真实命名样例，覆盖主组、聚合组、家宽筛选及无编号短词保护。

## v6.0.9-Surge.1 (2026-07-19)

- 新增通用 GitHub API 工具组融合段，位于上游广义 AI 规则之前；macOS/iOS 无 Windows 进程规则时使用通用回退。

## v6.0.8-Surge.1 (2026-07-15)

- 融合 RULE-SET 同步国内权威优先级，并以发布版本缓存键引用自托管资产。

## v6.0.7-Surge.1 (2026-07-14)

- FIX#176：融合远程 RULE-SET 顺序同步国内域名优先于通用国际 CDN / GeoIP fallback；后置 fallback 使非中国 IP 不再抢占中国域名。

## v6.0.6-Surge.1 (2026-07-14)

- PLATFORM：Windows 的 `WorkPro.exe` / `WorkProWebProcess.exe` 进程直连由桌面产物承载；Surge 不写 Windows 进程规则，继续消费同步后的融合文本资产。

## v6.0.5-Surge.1 (2026-07-14)

- PLATFORM：WorkPro.exe 是 Windows 桌面直连条目，不加入 Surge Mac 专用进程规则集；Windows Mihomo、sing-box 与 Xray 产物负责实际命中。

## v6.0.4-Surge.1 (2026-07-13)

- DIRECT-ITWDB：默认 `DIRECT` 融合文本段新增 `DOMAIN-SUFFIX,itwdb.com`，保持源图首匹配顺序并覆盖 WorkPro 子域名。

## v6.0.3-Surge.1 (2026-07-12)

- SYNC：升级到 Clash Party v6.0.3，消费 64 个非空融合 RULE-SET，保持源图首匹配顺序。
- AI-PRECEDENCE：OpenAI / ChatGPT、oaistatic、Cloudflare NEL 和必要 telemetry 在通用广告段、国外网站段之前进入 `🤖 AI 服务`。

## v6.0.2-Surge.1 (2026-07-10)

- FIX#175：从 71 个放大分片收敛为 63 个非空融合 RULE-SET，聚合文本约 16.07 MiB / 575,673 条，满足 iOS 聚合预算。
- GEOIP/ASN：国家 GEOIP 与 IP-ASN 使用 Surge 原生规则；服务型 GEOIP 按平台能力转换，`no-resolve` 修饰符不再丢失。
- DEDUP：最终 Surge 文本逐文件复验，精确重复、域名覆盖和 CIDR 包含关系的二次可删除数均为 0。

## v6.0.1-Surge.1 (2026-07-10)

- FIX#174：超出 CDN 单文件预算的广告融合段拆为 3 个 RULE-SET，国外网站尾段拆为 2 个 RULE-SET；每个分片不超过 18 MiB。
- SEMANTICS：所有新增 RULE-SET 沿用原策略和原始顺序，未改变广告拦截、国外网站或任一其他业务组的匹配优先级。

## v6.0.0-Surge.1 (2026-07-09)

- FUSED-RULESETS：迁移到 68 个融合远程 RULE-SET，保留必要本地端口/兜底规则。
- META：跟随 Clash Party v6.0.0 更新版本元数据；策略组保持不变。

## v5.4.39-Surge.1 (2026-07-09)

- META：跟随 Clash Party v5.4.39 更新版本元数据。
- N/A：Surge 不支持 Mihomo `.mrs` rule-provider；规则语义延续 v5.4.38-Surge.1。

## v5.4.38-Surge.1 (2026-07-09)

- SCKI-SUPPLEMENTAL：删除零星本地白名单直写，改为 13 个 Clash supplemental `RULE-SET` + 2 个 Surge process supplemental `RULE-SET`。
- SYNC：版本元数据同步 Clash Party v5.4.38。

## v5.4.37-Surge.1 (2026-06-29)

- META#170-DNS-POLICY：跟随 Clash Party v5.4.37 更新版本元数据。
- N/A：Surge 使用 `dns-server` / `encrypted-dns-server` / `fallback-dns-server`，没有 Mihomo `nameserver-policy` 同字段面；规则与 DNS 语义不变。

## v5.4.36-Surge.1 (2026-06-29)

- CLEAN#171-DIRECT：同步删除 22 条经逐条确认的冗余 `DOMAIN` / `DOMAIN-SUFFIX` 规则，远程规则集保持不变。
- AI / Binance / Microsoft login 候选因不同策略 `.mrs` 前置阻断，继续保留。

## v5.4.35-Surge.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM：删除 5 个已被前序同目标规则覆盖的远程 RULE-SET：Marketing、EncoreTVB、FindMy、WildRift、AcFun。
- CLEAN#170-DIRECT：删除 3 条已被前置 Douyin 国内流媒体守卫同目标覆盖的后置直写规则：`douyin.com`、`douyinpic.com`、`douyinvod.com`。
- 远程 RULE-SET 实测数 288 → 283；匹配顺序不变。

## v5.4.34-Surge.1 (2026-06-28)

- ★ FIX#169-AMAP：新增 blackmatrix7 Surge `GaoDe.list`，归入 `🏠 国内网站`。
- 顺序保持在广告/威胁规则之后、国外网站兜底之前，修复 `webapi.amap.com` 高德 API 误走国外的风险。

## v5.4.33-Surge.1 (2026-06-27)

- ★ FEAT#169-AI-CODING：新增 VPSDance Surge `coding.list`，归入 `🤖 AI 服务`。

## v5.4.32-Surge.1 (2026-06-25)

- ★ FIX#168-CN-GAME：国内游戏内联规则和 SteamCN 等 RULE-SET 早于国外游戏 RULE-SET，防止 HoYoverse/Game 宽规则抢先命中。
- 文件头与 README 对齐 Clash Party v5.4.32。

## v5.4.31-Surge.1 (2026-06-20)

- ★ FIX#167-DOUYIN：新增抖音 Web 国内流媒体前置规则，`douyin.com` / `zjcdn.com` 等域名先于 TikTok 和国外规则集命中 `📺 国内流媒体`。
- 文件头与 README 对齐 Clash Party v5.4.31。

## v5.4.30-Surge.1 (2026-06-17)

- ★ FEAT#166-GOOGLE：新增 `🔍 Google 服务` 策略组，位置在 `🔧 工具与服务` 之前。
- Google Search / Drive / Earth / Google / Scholar 规则集改投新组；工具组只承载非 Google 搜索和开发者服务。

## v5.4.29-Surge.1 (2026-06-10)

- ★ PERF#165-LATENCY：22 个区域 `url-test` 组 `interval=180 -> interval=300`。
- README 的区域组说明同步改为 300s / 5 分钟；业务策略、DNS 与 RULE-SET 不变。
- 文件头对齐 Clash Party v5.4.29。

## v5.4.27-Surge.1 (2026-06-07)

- ★ CLEAN#165：同步清理 7 条已由前置远程规则集覆盖的本地直写域名（Claude / PayPal / HBO / Hulu / Xbox）；删除后仍命中同策略组。

## v5.4.26-Surge.1 (2026-06-07)

- ★ FIX#164：腾讯 WorkBuddy `copilot.tencent.com` 国内直连防吞——szkane `AiDomain.list` 的 `DOMAIN-KEYWORD,copilot` 子串会把它误吞到 `🤖 AI 服务`（国外代理）导致对话报错；在 szkane AiDomain RULE-SET 之前前置 `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站`（与既有 RustDesk 防吞守卫并置）。基线 Clash Party v5.4.26。

## v5.4.25-Surge.1 (2026-06-04)

- ★ SYNC：产物头部版本和基线声明对齐 Clash Party v5.4.25；规则语义延续 v5.4.23-Surge.2，无新增 Surge 专属规则变更。

## v5.4.23-Surge.2 (2026-06-02)

- ★ FIX#162：修复远程规则列表加载失败风险：
  - 移除已失效的 HaGeZi `share/surge-tif-medium.txt`（jsDelivr 403；当前 HaGeZi 无 Surge RULE-SET 等价格式）。
  - 移除上游已不存在的 `独立内核系/Surge/RemoteDesktop/RemoteDesktop.list`（仅 Clash 端仍有进程名规则，Surge iOS/macOS 规则集不适用）。
  - `BiliIntl/BiliIntl.list` 路径改为当前上游 `BiliBiliIntl/BiliBiliIntl.list`。
  - Sukka phishing 继续使用 Surge 原生可加载的 `List/domainset/reject_phishing.conf`。

## v5.4.23-Surge.1 (2026-06-02)

- ★ FIX#161：`DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` → 🏠 国内网站 直连（知乎图片 CDN + 短链，同步基线）。

## v5.4.22-Surge.1 (2026-05-31)

- ★ GeTui(个推)推送 SDK `getui.com` / `getui.net` / `gepush.com` 加直连白名单（review 后补；延续 #2，被通用广告/隐私表当 tracker 拦截但承载 App 推送如米家；owner 选放行）。

- N/A#1 QUIC 精细化：Surge block-quic 是引擎级开关，不支持 AND/NOT 白名单豁免。QUIC 精细化由 mihomo 产物承载。

## v5.4.21-Surge.1 (2026-05-31)

#4 借鉴 Proxy-override：`encrypted-dns-server` / `fallback-dns-server` 从域名 DoH 改为 IP-host DoH，消除 bootstrap 阶段 DNS 泄漏；`dns-server` 明文 IP 保留兜底。

## v5.4.20-Surge.1 (2026-05-30)

- N/A#6 节点过滤关键词补充（批 B）：Surge 不处理订阅去 junk（无运行时 junk 过滤器），#6 不适用；版本跟随 Clash Party v5.4.20 基线对齐。

## v5.4.19-Surge.1 (2026-05-30)

借鉴 Proxy-override 批 A · #2 国内 SDK/CDN 直连前置（跟随 Clash Party v5.4.19；spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- jpush / `msg.umeng.com` 前置到广告拦截 RULE-SET 之前强制 DIRECT（承载合法 App 推送/消息；与 mihomo 家族行为对齐）
- `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` 加入 🏠 国内网站段
- 不适用 #3 fake-ip-filter（Surge 无该字段）/ #5 direct-nameserver-follow-policy（非 mihomo 内核）
- 🔢 版本：v5.4.17-Surge.1 → v5.4.19-Surge.1（全产物跳过烧毁的 .18 统一到 v5.4.19）
## v5.4.17-Surge.2 (2026-05-30)

- ★ FIX#KR-WB：日韩 / 亚太 `policy-regex-filter` 裸 `KR` 补词边界 `(?<![a-zA-Z])KR(?![a-zA-Z])`（与本文件 US/SG 写法一致）
  - 大小写敏感下仅大写 `KR` 子串误伤（KRAKEN / DARKROOM → 🇯🇵 日韩节点），加边界后消除
  - 覆盖日韩节点 / 日韩家宽 / 亚太节点 / 亚太家宽 4 行；KOR/Korea/Seoul/🇰🇷 完整词不受影响
  - §1.5 同构审计：主线 JS + CMFA 本就带边界未改
  - 回归测试见 `tools/test-kr-boundary.js`

## v5.4.17-Surge.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP：Surge DNS 同步 v5.4.17 平台等价写法
  - `dns-server` 只保留纯 IP bootstrap 列表
  - `encrypted-dns-server` 承载国内 / 境外 DoH；`fallback-dns-server` 固定 Cloudflare + Google DoH
  - Surge 无 Mihomo 的 `direct-nameserver` / `proxy-server-nameserver` 四段分离，按原生字段做 best-effort 映射

## v5.4.16-Surge.3 (2026-05-26)

- ✅ FIX#SURGE-PORT-RULE：Surge 端口规则统一改为官方 `DEST-PORT`
  - 修复导入时报「第 331 行存在无效配置：`DST-PORT,7680,REJECT`」的问题
  - 依据 [Surge Manual `Misc Rule / DEST-PORT`](https://manual.nssurge.com/rule/misc-rule.html#dest-port)；Shadowrocket / Mihomo / OpenClash 的 `DST-PORT` 语法不受影响

## v5.4.16-Surge.2 (2026-05-22)

- ✅ FEAT#GAME-ACCEL：新增游戏加速器 `PROCESS-NAME -> DIRECT` 白名单
  - 新增 13 条 PROCESS-NAME 规则（UU / 小黑 / 迅游 / 雷神 / NNer 加速器；仅 .exe 无后缀版本，适配 macOS + iOS）

## v5.4.16-Surge.1 (2026-05-20)

- ✅ FIX#149-P0：前置 `DOMAIN-SUFFIX,paddle.com,🏦 金融支付`
  - 覆盖 anti-AD/DustinWin 对 `analytics.paddle.com` 的误拦截
  - 与 Shadowrocket 同序，位于 anti-AD / phishing / TIF 远程规则之前

## v5.4.15-Surge.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER：同步 Clash Party v5.4.15 元数据，新增 GEOSITE 覆盖台账引用。
- ♻️ REFACTOR#AD-FP-MODULE：阶段 1 顶部显式标记 Anti-ad false-positive allowlist，并将小米误伤白名单与 Cloudflare R2 白名单统一放到广告/钓鱼/TIF 规则之前。

## v5.4.14-Surge.1 (2026-05-20)

- ✅ FIX#CF-R2-P0：`cloudflarestorage.com` 规则前置到阶段 1 顶部
  - 避免 Sukka phishing 远程规则源把 Cloudflare R2 对象存储域误导向 `🛑 广告拦截`
  - 后段 `🌐 国外网站` 重复条目已移除

## v5.4.13-Surge.1 (2026-05-19)

- ✅ FIX#STUN-PORTS：补齐 STUN/TURN 标准端口 `5349 / 19302 / 19305 / 19307 -> DIRECT`
- N/A#FAKE-IP：Surge 无 Mihomo `fake-ip-filter`；QUIC 仍由 `block-quic = all-proxy` 控制

## v5.4.12-Surge.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 documentation for the RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Surge has no Mihomo fake-ip-filter field; no new RustDesk DIRECT bypass was added.

## v5.4.11-Surge.1 (2026-05-12)

- ✅ FIX#RD-PROC：Surge Mac 的 RustDesk `PROCESS-NAME` 规则改走 `🧑‍💼 会议协作`，不再强制 DIRECT
- ✅ FIX#RD-DOMAIN：`rustdesk.com` 域名规则保持在 Copilot 前，避免宽 ASN 规则误吞 RustDesk relay
- ✅ FIX#DNS-BOOTSTRAP：国内 DoH 顺序调整为 AliDNS 优先，与 IP-first 平台的自举语义保持一致

## v5.4.9-Surge.1 (2026-05-11)

- ✅ FEAT#LOCAL-TOOLS：新增 Surge Mac 本地工具 `PROCESS-NAME -> DIRECT` 白名单
  - 覆盖 Oray / Sunlogin / AweSun / AnyDesk / ToDesk / RustDesk / TeamViewer / ZeroTier / Tailscale / frpc / frps / ngrok / natapp / cloudflared / Navicat 等常见桌面工具
  - Surge 官方说明 `PROCESS-NAME` 仅 Surge Mac 可用，Surge iOS 会忽略该规则，因此同一配置不会导致 iOS 导入失败


## v5.4.8-Surge.2 (2026-05-11)

- ★ META#GROUP-COUNT：同步文件头与 README 的区域组数量说明为 22 组（11 全部 + 11 家宽）
  - 不改变 `[Proxy Group]` / `[Rule]` 语义

## v5.4.8-Surge.1 (2026-05-09)

- ★ ORDER#RULE-TAIL：同步 Clash Party v5.4.8 规则尾段匹配顺序
  - `[Proxy Group]` UI 顺序不变；仅调整 `[Rule]` 顺序

## v5.4.7-Surge.1 (2026-05-09)

- ★ FEAT#TikTok：新增独立 `🎵 TikTok` 业务组（32 业务组），置于 `📺 国内流媒体` 与 `🎥 Netflix` 之间
- ★ FIX#HK：香港节点 `policy-regex-filter` 追加 `|广港`

## v5.4.6-Surge.1 (2026-05-08)

- ★ FEAT#145：WeChat CDN 直连 — 新增 `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT`
  - 于阶段 7（国内邮箱直连）`mail.qq.com` 后新增，WeChat CDN 域名直连
  - 跟随 Clash Party v5.4.6 基线

## v5.4.5-Surge.1 (2026-05-07)

- ★ 全球节点置顶 + 全产品组顺序同步（跟随基线 v5.4.5）

## v5.4.4-Surge.1 (2026-05-07)

- ★ FIX#144：新增 bbys.app 直连规则（国内可访问视频站点 CDN 域名直连）
  - 于阶段 28（国内网站兜底）末尾新增 `DOMAIN-SUFFIX,bbys.app,DIRECT`
  - 跟随 Clash Party v5.4.4 基线
- ★ FEAT#143：家宽 policy-regex-filter 新增 IEPL/IPLC/专线识别
  - 所有 10 个家宽区域组的 `policy-regex-filter` 中 residential 子模式追加 `[Ii][Pp][Ll][Cc]|[Ii][Ee][Pp][Ll]|专线`
  - 匹配含 IPLC/IEPL/专线标识的家宽类型节点
- ★ 主版本号 v5.4.3 → v5.4.4，Build 2026-05-06 → 2026-05-07
- FIX#142（DNS 冷启动）为 Clash Party JS 专属修复，静态配置文件豁免

## v5.4.3-Surge.1 (2026-05-06)

- ★ FEAT：家宽 policy-regex-filter 添加 `|[Hh]ome` 关键词（跟随 Clash Party v5.4.3 基线）
  - 所有 9 个家宽区域组的 policy-regex-filter 追加 `|[Hh]ome`，匹配仅含 Home 的节点名

## v5.4.2-Surge.1 (2026-05-05)

- ★ FIX#41-P0：小米核心服务 DIRECT 白名单（跟随 Clash Party v5.4.2 基线）
  - 新增 11 条 DOMAIN/DOMAIN-SUFFIX DIRECT 规则前置广告拦截段

## v5.4.0-Surge.1 (2026-05-05)

- ★ FEAT#SG：新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立区域组
  - 新加坡从 🌏 亚太节点 中拆分为独立区域
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51
  - 跟随基线 Clash Party v5.4.0

## v5.3.0-Surge.2 (2026-04-26)

- ★ FIX：bm7 规则源 URL 注释修正（`rule/Shadowrocket` → `rule/Surge`，复制粘贴错误）

## v5.3.0-Surge.1 (2026-04-26)

- ★ REFACTOR#2：流媒体分组架构重构——按区域 → 按平台（7→13 流媒体组）
  - 拆出 5 个主流平台独立组：🎥 Netflix / 🎬 Disney+ / 📡 HBO/Max / 📺 Hulu / 🎬 Prime Video
  - 拆出 2 个全球平台独立组：📹 YouTube / 🎵 音乐流媒体
  - 保留 4 个区域锁区组：🇭🇰 香港流媒体 / 🇹🇼 台湾流媒体 / 🇯🇵 日韩流媒体 / 🇪🇺 欧洲流媒体
  - 新增 🌐 其他国外流媒体 兜底（接收长尾平台 + 原东南亚流媒体）
  - 业务组 25→31，总组 43→49
## v5.2.11-Surge.1 (2026-04-26) — 业务组合并精简 28→25（降低用户认知负担）

- ★ **REFACTOR#1**：跟随 Clash Party v5.2.11 基线，业务组合并精简
  - 合并 🔍搜索引擎 + 📟开发者服务 → 新增 🔧工具与服务
  - 合并 📧邮件服务 → 🌐国外网站
  - 合并 ☁️云与CDN → 🌐国外网站
  - 📥下载更新 策略从 DIRECT 优先改为代理优先
  - 🛰️BT/PT Tracker 保留独立
- Bump: `v5.2.10-Surge.1` → `v5.2.11-Surge.1`

## v5.2.10-Surge.1 (2026-04-25) — 境外 DoH 端点改路由到 🚫 受限网站

- ★ **FIX#39**（同构联动）：跟随 Clash Party v5.2.10 基线
  - `DOMAIN,dns.google,☁️ 云与CDN` → `🚫 受限网站`
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `🚫 受限网站`
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `🚫 受限网站`
  - `[General] encrypted-dns-server` 保留 cloudflare/google DoH 不动（Surge App 自身上游 DoH 配置）
- Bump: `v5.2.9-Surge.2` → `v5.2.10-Surge.1`（主版本追平到 v5.2.10）

## v5.2.9-Surge.2 (2026-04-25) — 移除 url-test 组非法参数 `select=0`

- ★ **FIX-Surge-07-P1**：18 个 url-test 区域组包含不支持的 `select=0` 参数
  - Surge 官方文档中 url-test 类型组不支持 `select` 参数（仅 select 类型组支持），
    该参数会被 Surge 忽略或导致组行为异常
  - 影响范围：全部 18 个区域组（9 全部 + 9 家宽）
  - 修复：移除 `select=0,` 参数
- ★ 同步修复头部注释 `select=0` 描述
- 版本号 `v5.2.9-Surge.1` → `v5.2.9-Surge.2`

### 官方文档证据

- Surge url-test 组语法仅支持 `url` / `interval` / `timeout` / `tolerance` / `include-all-proxies` / `policy-regex-filter`，不支持 `select` 参数

---

## v5.2.8-Surge.6 (2026-04-25) — 欧洲节点 filter 补全 GR/RO/HU/CZ 及多国关键词扩充

- ★ **FIX#29-P2**（同构 bug）：🇪🇺 欧洲节点 + 🏡 欧洲家宽 group filter 补全缺失欧洲国家
  - 上轮 OpenClash 补齐了 15 个欧洲国家 REGIONS，但 iOS 产物 EU filter 未同步
  - 修复：SR/独立内核系/Surge/独立内核系/Loon/QX 的 EU node + EU home filter 新增 GR/RO/HU/CZ 代码 + 全量关键词
    （Greece/Athens/Romania/Bucharest/Hungary/Budapest/Czech/Prague + 中文 + 旗帜 emoji）
  - 同时扩充 PT/BE/IE/DK/NO 的关键词（城市名 + 中文名 + 🇵🇹/🇧🇪/🇮🇪/🇩🇰/🇳🇴）
  - 同构审计：Clash Party JS / OpenClash 已覆盖；CMFA 用 include-all-proxies 兜底全球组（N/A）；SingBox/v2rayN 无运行时节点分类（N/A）
- 版本号 `v5.2.8-Surge.5` → `v5.2.8-Surge.6`


## v5.2.8-Surge.5 (2026-04-24) — DNSPod DoH 端点切换为纯 IP 形式

- ★ `encrypted-dns-server` 里的 `https://doh.pub/dns-query` 替换为
  `https://1.12.12.12/dns-query`
  - DNSPod 纯 IP 形式 DoH 端点，**无需 bootstrap 解析 `doh.pub` 域名**，冷启动更稳
- 版本号 `v5.2.8-Surge.4` → `v5.2.8-Surge.5`

## v5.2.8-Surge.4 (2026-04-23) — 基线对齐 Clash Party v5.2.8（无代码改动）

- 跟随基线 bump：`v5.2.6-Surge.3` → `v5.2.8-Surge.4`
- v5.2.7（mirror URL 切换）：Surge 直接拉上游 URL，不走 mirror，无需改动
- v5.2.8（CMFA/OpenClash 亚太 filter 同构修复）：Surge `policy-regex-filter` 已有 HK/TW/JP/KR 完整覆盖，无需改动

## v5.2.6-Surge.3 (2026-04-23) — 修复区域 url-test 组候选池为空

P0 审查发现 9 个区域 `url-test` 组只有 `policy-regex-filter`，没有候选节点来源；Surge 官方说明正则过滤需要配合 `include-all-proxies` / `include-other-group` / `policy-path` 使用，否则组内可能为空。

### 改动

- ★ **FIX#Surge-06-P0**：9 个区域组全部补 `include-all-proxies=true`
  - `🌍 全球节点`
  - `🇭🇰 香港节点`
  - `🇹🇼 台湾节点`
  - `🇯🇵 日韩节点`
  - `🌏 亚太节点`
  - `🇺🇸 美国节点`
  - `🇪🇺 欧洲节点`
  - `🌎 美洲节点`
  - `🌍 非洲节点`
- ★ 头部版本号 `v5.2.5-Surge.2` → `v5.2.6-Surge.3`，Build `2026-04-23`，基线对齐 Clash Party v5.2.6。

### 自检

- 代理组 37 个 ✓
- 区域 `url-test` 组 9 个，且每个均包含 `include-all-proxies=true` ✓
- `policy-regex-filter` 保留，地区节点名过滤语义不变 ✓

### 官方文档证据

- [Surge Policy Including](https://manual.nssurge.com/policy-group/policy-including.html)：`include-all-proxies=true` 会包含 `[Proxy]` 中所有代理，并可与 `policy-regex-filter` 联用过滤。

## v5.2.5-Surge.2 (2026-04-22) — 移除 72 条 Clash YAML + anti-AD CDN + 版本对齐

与 Loon v5.2.4-Loon.2 / .3 同批"Clash Party v5.2.4 基线遗毒"。Surge manual 明确 RULE-SET
期望 **"text file, each line containing a rule declaration"**（[manual.nssurge.com/rule/ruleset.html](https://manual.nssurge.com/rule/ruleset.html)），
Clash classical YAML 的 `payload: \n - DOMAIN-SUFFIX,x` 格式不符合该定义，**Surge 会沉默加载为空**。

### 改动

- ★ FIX#Surge-01-P1：**删除 72 条 Clash classical `.yaml` RULE-SET**（71 Accademia + 1 ACL4SSR Zoom.yaml）
  - Surge `RULE-SET` 期望纯文本每行一条规则；YAML `payload:` 前缀格式不识别，整个规则集静默失效
- ★ FIX#Surge-02-P1：`anti-ad.net/surge.txt` → `fastly.jsdelivr.net/gh/privacy-protection-tools/anti-AD@master/anti-ad-surge.txt`
  - Loon v5.2.4-Loon.3 已实锤：anti-ad.net 无 CDN，国内 ISP DNS 劫持返回 HTML，Surge 同样会把 HTML 当规则解析失败
- ★ FIX#Surge-03-P1：72 条 yaml 删除后的关键域名补 DOMAIN-SUFFIX 兜底：
  - 🏦 金融支付：Monzo / N26 / Chime + 24 国际银行（Chase / BofA / HSBC / Barclays / DBS / MUFG / RBC / ANZ 等）
  - 🧑‍💼 会议协作：Zoom × 5 / RustDesk / Parsec × 3
  - 🌐 国外网站：Wayback Machine / Pornhub × 3
- ★ FIX#Surge-04-P2：清理 15 行孤立的 `# Accademia xxx` section 注释（原 yaml 段已删）
- ★ FIX#Surge-05-P2：**主版本号对齐** `v5.2.3-Surge.1` → **`v5.2.5-Surge.2`**（Clash Party JS `VERSION='v5.2.5'`）
- ★ Build `2026-04-20` → `2026-04-22`；头部架构 `250+ RULE-SET` → `~290 RULE-SET`

### 保留项（Surge 官方支持，与 Loon 不同）

深度审查发现有 agent 误把下列 Surge 原生字段当成 Loon 专属。经官方文档核实**全部保留**：

- `FINAL,🐟 漏网之鱼,dns-failed` ✓（[Surge manual rules](https://manual.nssurge.com/rule/summary.html)：DNS 失败时的兜底，Surge 独有特性）
- `bypass-system`、`tun-excluded-routes`、`hijack-dns`、`udp-policy-not-supported-behaviour` ✓（[misc-options](https://manual.nssurge.com/others/misc-options.html) 原生字段）
- Sukka `List/domainset/reject_phishing.conf` ✓（Surge 原生支持 DOMAIN-SET 格式；Loon/QX 要换 `non_ip/`，但 Surge 不用改）
- `encrypted-dns-server` / `geoip-maxmind-url` / `read-etc-hosts` / `exclude-simple-hostnames` ✓（Surge 独有字段）

### 自检

- 代理组 37 个 ✓
- `.yaml,` RULE-SET 残留：0 条 ✓
- `anti-ad.net` 残留：0 次 ✓
- `FINAL,...,dns-failed` 保留：1 次 ✓（Surge 原生支持）
- 行数：1391 → 1348（净 -43；删除 72 yaml + 15 孤立注释，补入 ~40 条 DOMAIN-SUFFIX 兜底）

### 已接受的回归损失

与 Loon / SR / QX 一致：Accademia `Bank × 10 国家级` / `FakeLocation × 10` / `GeoRouting × 17 区域` / `eMuleServer` / `HomeIP` 没有 `.list` 等价源；关键域名已补兜底。完整覆盖请换 CMFA / OpenClash / SingBox。

### 官方文档证据

- [Surge Ruleset manual](https://manual.nssurge.com/rule/ruleset.html)：ruleset file = "text file, each line containing a rule declaration"（不是 YAML）
- [Surge misc-options](https://manual.nssurge.com/others/misc-options.html)：`bypass-system` / `tun-excluded-routes` / `hijack-dns` / `udp-policy-not-supported-behaviour` 原生支持
- [Surge DNS kb](https://kb.nssurge.com/surge-knowledge-base/technotes/dns)：`FINAL, policy, dns-failed` 原生支持

---

## v5.2.3-Surge.1 (2026-04-20) — 初版

- ★ 从 Shadowrocket v5.2.2-SR.2 迁移，保留 9 区域 url-test 组 + 28 业务 select 组 + ~930 条规则
- ★ 适配 Surge `[General]` 原生字段：
  - `encrypted-dns-server`（DoH 专用）
  - `geoip-maxmind-url`（配置文件里直接指定 MMDB，无需 UI 手动下载）
  - `disable-geoip-db-auto-update`
  - `read-etc-hosts`（读取系统 hosts）
- ★ 删除 SR 专有 / 无效字段：
  - `private-ip-answer`
  - `dns-direct-fallback-proxy`
  - `proxy-dns-server`
  - `fallback-dns-server`（Surge 用 `encrypted-dns-server` + `dns-server` 统一管理）
- ★ `FINAL,🐟 漏网之鱼,dns-failed`（Surge 风格 FINAL，带 `dns-failed` 兜底）

### 与 Clash Party 主线的差异（Surge 引擎限制）

- 无 PROCESS-NAME（Surge Mac 支持，iOS 不支持 → 已统一删除以保持跨平台）
- 无 Smart 组 + LightGBM（Surge 核心不是 Mihomo）
- 无 TLS 指纹注入 fpByPurpose（Surge 不暴露 uTLS 控制）
- 无 GEOSITE（Surge 用 RULE-SET + 内置 MMDB；GEOIP 精准标签依赖 MMDB 替换）
- 无 rule-provider 独立调度（Surge 依赖 RULE-SET URL + 统一订阅自动更新）
