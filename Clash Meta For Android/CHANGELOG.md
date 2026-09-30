# Clash Meta For Android (CMFA) — 变更日志

> `Clash Meta For Android/CMFA(mihomo).yaml` 的变更日志。
> 主版本号跟随 Clash Party 主线。

---

## v6.0.14-cmfa.7 (2026-09-30)

- CANDIDATES：22 个原生地区/全球/家宽 url-test 组使用 `exclude-type: direct|reject`，保留 provider 的具名支持出站和链路依赖，但不把它们当作远端测速候选。
- EMPTY：各测速组配置 `empty-fallback: REJECT`，排除支持出站后不再默认直连。
- VERIFY：Mihomo v1.19.29 本机 controller 验证 use-provider 的实际成员与空池回退，v1.19.31 官方源码交叉核对；详见 [后续研究](../docs/research/2026-09-30-routing-runtime-followup.md)。55 组名称、规则和 DNS 不变。

## v6.0.14-cmfa.6 (2026-09-29)

- FIX：同步首段 DIRECT 融合资产，微信 HTTPDNS 两个精确域名先于 BlockHttpDNS 拦截规则直连。
- SYNC：跟随 Clash Party v6.0.14；保持 132 个融合 provider / 151 条主规则。

## v6.0.13-cmfa.5 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：同步第 013 融合域名资产，`linuxdo.org` 及子域进入 `🏠 国内网站`；`linux.do` 保持受限网站。
- SYNC：保持 132 个融合 provider / 151 条主规则，仅升级发布缓存键并接受目标资产的单域名增量。

## v6.0.12-cmfa.4 (2026-09-01)

- FIX#181-PC：同步首段精确直连资产，`login.nvidia.cn` 优先于 NVIDIA 下载规则；其余 NVIDIA 下载/开发域名不变。
- SYNC：保持 132 个融合 provider / 151 条主规则，仅升级发布缓存键并重放授权差异。

## v6.0.11-cmfa.3 (2026-08-22)

- ROUTING：同步 Gemini 与 Accademia Gemini 的融合引用至 `🔍 Google 服务`；不移动或改写 `szkane-ai`。
- SYNC：规则缓存路径升级至 `v6.0.11`，对应 132 个融合 provider / 151 条主规则。

## v6.0.10-cmfa.3 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：同步首段融合直连资产；两个报告的网易游戏服务主机在 anti-AD 与国内游戏宽规则之前命中 `DIRECT`。

## v6.0.9-cmfa.2 (2026-08-08)

- FIX-APAC-HOME-REGEX：`🏡 亚太家宽` 的 `filter` 末尾多余一个右括号，导致 Mihomo 无法编译该策略组正则；现已修复，CN / 港台日韩新马与其它亚太家宽节点恢复可筛选。
- GUARD：合同验证会逐一编译所有 CMFA 策略组 `filter`，并拒绝 Go RE2 不支持的 lookaround / backreference，而非仅覆盖固定地区样例。

## v6.0.9-cmfa.1 (2026-07-19)

- 同步 `api.github.com` 的通用工具组融合段并置于广义 AI 规则前；桌面进程例外保留在 Mihomo 规则顺序中。

## v6.0.8-cmfa.1 (2026-07-15)

- 全量同步国内权威优先级，并为全部融合 rule-provider 写入版本化 URL 与本地缓存路径。

## v6.0.7-cmfa.1 (2026-07-14)

- FIX#176：CMFA 规则顺序同步国内域名权威段优先于通用国际 CDN / GeoIP fallback；中国站点落在境外 CDN IP 时继续命中 `🏠 国内网站`。

## v6.0.6-cmfa.1 (2026-07-14)

- DIRECT-WORKPRO-WEB：`scki-local-process-direct` 的 fused direct residual 同时包含 `WorkPro.exe` 和 `WorkProWebProcess.exe`；支持进程匹配的桌面 Mihomo 消费端固定路由至 `DIRECT`。

## v6.0.5-cmfa.1 (2026-07-14)

- DIRECT-WORKPRO：WorkPro.exe 随 scki-local-process-direct 保留在默认 direct 融合 residual；回归清单要求桌面 Mihomo 消费端始终命中 DIRECT。

## v6.0.4-cmfa.1 (2026-07-13)

- DIRECT-ITWDB：`itwdb.com` 随 `scki-local-direct` 编译为 Mihomo domain MRS 的 `+.itwdb.com` payload，固定命中默认 `DIRECT`，覆盖 WorkPro 子域名。
- SYNC：由 source graph v6.0.4 重新生成融合 provider 与规则顺序，`unresolved=0`。

## v6.0.3-cmfa.1 (2026-07-12)

- FIX#FUSED-DOMAIN-PAYLOAD：融合 `behavior: domain` provider 现仅含 Mihomo 原生精确 / wildcard payload；keyword / regex 留在 classical residual，避免静默漏匹配或语义扩大。
- AI-PRECEDENCE：OpenAI / ChatGPT 域名及其必要的 telemetry / Cloudflare 关联域名在广告与国外网站段之前命中 `🤖 AI 服务`。
- SYNC：由 source graph v6.0.3 生成 124 个融合 rule-provider / 141 条规则，`unresolved=0`。

## v6.0.2-cmfa.1 (2026-07-10)

- SYNC：跟随 source graph / Clash Party v6.0.2，更新为 113 个融合 rule-provider、130 条主规则和 55 个策略组。
- PERF：域名/IP `.mrs` 已在同策略段内完成规范化与语义去重；国家/服务 GEOIP 保留为少量 residual YAML，避免将运行时数据库查询放大为 CIDR 列表。
- FAIL-CLOSED：融合 manifest 出现 unresolved source、非法残余规则或聚合预算超限时不再生成本产物。

## v6.0.1-cmfa.1 (2026-07-10)

- SYNC：跟随 Clash Party v6.0.1 和 source graph v6.0.1 重新同步；CMFA 保持融合 `.mrs` / residual YAML 消费方式、113 个 rule-provider 与 130 条主规则。
- DELIVERY：本端不消费大文本规则集，因此不改变规则语义；远程文本分片修复由同一融合链路供 Shadowrocket / Surge / Loon / Quantumult X 使用。

## v6.0.0-cmfa.1 (2026-07-09)

- FUSED-RULESETS：跟随 Clash Party v6.0.0 融合规则集架构，CMFA 直接引用融合后的 `.mrs` / residual YAML。
- SCALE：规则区从 `474 providers / 931 rules` 压缩为 `113` 个融合 provider 与 `130` 条规则。
- BASELINE：CMFA 继续是派生产物，不能作为上游权威源；权威输入固定为 Clash Party Smart 运行时输出。

## v5.4.39-cmfa.1 (2026-07-09)

- MRS-PARTIAL：全量复查并迁移剩余可转 `YamlRule` / `TextRule`，CMFA 当前为 474 providers、929 条规则。
- MIHOMO-MRS：424 个 provider 使用 `.mrs`，30 个 provider 使用 `rulesets/generated/mihomo-mrs/*-classical.yaml` 承载不支持 `.mrs` 的残余规则，20 个 provider 因全量不可转继续保留。
- SCKI-SUPPLEMENTAL：domain/ipcidr 补充规则集改为引用本仓库生成 `.mrs`；`scki-local-process-direct` / `scki-work-process` 保持 Clash classical 文本规则集。
- VERIFY：合同校验新增 partial / residual 计数与 `scki-*` `.mrs` 引用检查。

## v5.4.38-cmfa.1 (2026-07-09)

- SCKI-SUPPLEMENTAL：同步 Clash Party v5.4.38 的 15 个 `scki-*` rule-provider。
- MIHOMO-MRS：上游规则源同步迁移到 429 providers、884 条规则，其中 366 个 provider 使用 `.mrs`，38 个混合 classical provider 拆分为 domain/ipcidr 双 `.mrs`。
- VERIFY：合同校验改为检查补充规则集引用，不再要求主规则散写单条白名单。

## v5.4.37-cmfa.1 (2026-06-29)

- ★ DNS-POLICY#170：`dns.nameserver-policy` 新增 `geosite:cn` → AliDNS / DNSPod DoH、`geosite:geolocation-!cn` → Cloudflare / Google DoH。
- 与 Clash Party v5.4.37 的 DNS 行为对齐；`direct-nameserver-follow-policy: true` 保持启用，说明文字同步为 CDN + geosite policy。

## v5.4.36-cmfa.1 (2026-06-29)

- CLEAN#171-DIRECT：同步删除 22 条经逐条确认的冗余直写规则，provider 保持 376，规则语义与 Clash Party v5.4.36 对齐。
- AI / Binance / Microsoft login 候选因不同策略 `.mrs` 前置阻断，继续保留。

## v5.4.35-cmfa.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM：同步删除 8 个冗余 rule-provider 及对应 `RULE-SET` 行：`marketing`、`acc-vf-paypal`、`encoretvb`、`findmy`、`wildrift`、`acfun`、`acc-fl-douyin`、`acc-fl-xiaohongshu`。
- CLEAN#170-DIRECT：删除 3 条已被前置 Douyin 国内流媒体守卫同目标覆盖的后置直写规则：`douyin.com`、`douyinpic.com`、`douyinvod.com`。
- Provider / RULE-SET 实测数：384 → 376；所有剩余 provider 下载代理继续保持 `🚫 受限网站`。
- `privacy` 保留，因 `IP-CIDR,0.0.0.1/32` 未被前序规则覆盖。

## v5.4.34-cmfa.1 (2026-06-28)

- ★ FIX#169-AMAP：新增 MetaCubeX `amap.mrs` provider，下载代理保持 `🚫 受限网站`。
- 将 `RULE-SET,amap,🏠 国内网站` 放在广告/威胁规则之后、`proxy` / `geolocation-!cn` 国外兜底之前，修复 `webapi.amap.com` 误走国外的首匹配风险。

## v5.4.33-cmfa.1 (2026-06-27)

- ★ FEAT#169-AI-CODING：新增 `vpsdance-ai-coding` rule-provider，来源为 VPSDance `rules/clash/coding.yaml`。
- 保留国内游戏优先级修复，AI 编程工具仍归入 `🤖 AI 服务`。

## v5.4.32-cmfa.1 (2026-06-25)

- ★ FIX#168-CN-GAME：`🕹️ 国内游戏` 规则块前置到 `🎮 国外游戏` 之前；早期散落的 `GEOSITE,category-games` 归回国外游戏块，避免抢先吞掉国内游戏域名。
- 新增合同断言覆盖 `yuanshen.com` / `mihoyo.com` 早于 HoYoverse/Game/category-games 宽规则。

## v5.4.31-cmfa.1 (2026-06-20)

- ★ FIX#167-DOUYIN：在广告/TikTok/国外尾部规则前增加抖音 Web 国内流媒体守卫，覆盖 `douyin.com` 与 `zjcdn.com` 等视频 CDN 域名。
- 版本头与 README 对齐 Clash Party v5.4.31，并补跨端合同断言。

## v5.4.30-cmfa.1 (2026-06-17)

- ★ FEAT#166-GOOGLE：新增 `🔍 Google 服务` 业务组，插入在 `🔧 工具与服务` 之前。
- `scholar` / `google` / `google-ip` 规则与 Google QUIC 规则改投新组；`🔧 工具与服务` 仅保留非 Google 搜索和开发者服务。

## v5.4.29-cmfa.1 (2026-06-10)

- ★ PERF#165-LATENCY：22 个区域 `url-test` 组统一使用 `interval: 300`，替代原 `180`。
- 订阅 `proxy-providers.Subscribe.health-check.interval` 确认维持 `300`，避免 provider 与区域组出现不同测速节奏。
- 版本头与 README 对齐 Clash Party v5.4.29。

## v5.4.28-cmfa.1 (2026-06-07)

- ★ CLEAN#165 P2：清理 6 个流媒体/游戏段中已被同策略 RULE-SET 覆盖的 38 条直写 `DOMAIN-SUFFIX` 规则。
  - 覆盖段：🇭🇰 香港流媒体（-4）、🇹🇼 台湾流媒体（-5）、🇯🇵 日韩流媒体（-6）、🇪🇺 欧洲流媒体（-3）、🌐 其他国外流媒体（-6）、🎮 国外游戏（-12）、剩余 2 条为 v5.4.27 已清理的补记。
  - 每段上方添加 `# CLEAN#165:` 注释标注被移除的域名列表及对应 RULE-SET。

## v5.4.27-cmfa.1 (2026-06-07)

- ★ CLEAN#165：同步基线清理 7 条已由 `claude` / `paypal` / `hbo` / `hulu` / `xbox` rule-provider 先行覆盖的直写域名，规则命中策略不变。

## v5.4.26-cmfa.1 (2026-06-07)

- ★ FIX#164：腾讯 WorkBuddy `copilot.tencent.com` 国内直连防吞——szkane `AiDomain.list` 的 `DOMAIN-KEYWORD,copilot` 子串会把它误吞到 `🤖 AI 服务`（国外代理）导致对话报错；在 `RULE-SET,openai` 等所有 AI rule-set 之前前置 `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站`。基线 Clash Party v5.4.26。

## v5.4.25-cmfa.3 (2026-06-05)

- ★ SYNC#FAKE-IP-FILTER：补齐 `+.courier.push.apple.com` / `+.miui.com` / `+.xiaomi.com` / `+.xiaomi.net` / `+.mijia.tech` / `+.gotui.com`，与 Clash Party Smart/Normal/FlClash 的 57 条 fake-ip-filter 完全对齐。
- ★ VERIFY：`tools/validate-artifact-contracts.js` 新增 fake-ip-filter 必需条目校验，防止 mihomo 家族再次漏同步。

## v5.4.25-cmfa.2 (2026-06-04)

- ★ FIX#CMFA-YAML-P0：修复 `proxy-groups:` 下首个 `url-test` 组缺少列表项缩进导致的 YAML 解析失败。
- ★ 验证补强：`tools/validate-artifact-contracts.js --strict-ruby` 现在会实际解析 CMFA YAML，并校验 54 组 / 382+ providers / 900+ rules。

## v5.4.25-cmfa.1 (2026-06-03)

- ★ 审查修复：`GEOIP,CN` 重复规则去重（规则区块末尾出现 2 次 → 保留 1 条）

## v5.4.23-cmfa.1 (2026-06-02)

- ★ FIX#161：`DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` → 🏠 国内网站 直连（知乎图片 CDN + 短链，同步基线）。

## v5.4.22-cmfa.1 (2026-05-31)

- ★ GeTui(个推)推送 SDK `getui.com` / `getui.net` / `gepush.com` 加直连白名单（review 后补；延续 #2，被通用广告/隐私表当 tracker 拦截但承载 App 推送如米家；owner 选放行）。

#1 借鉴 Proxy-override：QUIC 精细化——AND 规则白名单豁免（YouTube/Google/MS/Apple 的 QUIC 走对应业务组）；其余非 CN QUIC REJECT。首次补齐 CMFA 的 QUIC AND 规则（此前缺失）。

- 兜底判据 `GEOIP,CN` → `GEOSITE,cn`（**有意的语义变更**，fake-ip 下更可靠）；CMFA 既有 `sniffer`（force-dns-mapping）保障真 IP QUIC 的 GEOSITE 匹配。

## v5.4.21-cmfa.1 (2026-05-31)

#4 借鉴 Proxy-override：`default-nameserver` 从纯明文 IP 升级为 DoH-over-IP + 1 明文兜底；消除 bootstrap 阶段 DNS 泄漏。

## v5.4.20-cmfa.1 (2026-05-30)

借鉴 Proxy-override 批 B · #6 节点过滤关键词补充（spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- proxy-providers `exclude-filter` 正则新增：中文 `免费` / `试用` / `应急`；英文 `\bSign\b` / `\bLogin\b` / `\bRegister\b` / `\bHelp\b` / `\bFAQ\b`（Go RE2 子串引擎下用 `\b` 词边界，避免误伤 Signal 等）
- 不加「更新」「地址」（误伤风险高，owner spec 排除）
- 一致性回归：`tools/test-info-node-filter.js` 覆盖本产物 exclude-filter
- 🔢 版本：v5.4.19-cmfa.1 → v5.4.20-cmfa.1

## v5.4.19-cmfa.1 (2026-05-30)

借鉴 Proxy-override 批 A（跟随 Clash Party v5.4.19；spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- ✅ #2 国内 SDK/CDN 直连前置
  - jpush / `msg.umeng.com` 前置到 `RULE-SET,jiguangtuisong` / `youmengchuangxiang` 广告拦截规则之前强制 DIRECT（沿用 paddle / 小米误杀前置白名单机制）
  - `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` 前置到 🏠 国内网站段 `RULE-SET,cn` 之前
- ✅ #3 fake-ip-filter 补全 10 条（远控 todesk/oray/sunlogin/teamviewer/anydesk · 游戏 battlenet.com.cn/wotgame.cn/wggames.cn/wowsgame.cn · B站 P2P mcdn.bilivideo.cn）
- ✅ #5 `direct-nameserver-follow-policy: true`（direct 出口域名解析遵循 nameserver-policy；本仓库 policy 仅含境外 CDN，零国内误伤）
- 🔢 版本：v5.4.17-cmfa.1 → v5.4.19-cmfa.1（全产物跳过烧毁的 .18 统一到 v5.4.19）
## v5.4.17-cmfa.2 (2026-05-30)

- ★ FIX#HOSTS-ALIGN：`use-hosts: false` → `true`，对齐主线启用 hosts 预解析
  - 主线（Clash Party Smart JS）`use-hosts` 默认 true 且 hosts 固定全部 DoH 域名 IP，用于消除 fake-ip 冷启动循环依赖 + 防 DoH 域名被污染
  - CMFA 此前显式 `use-hosts: false` 关掉了已对齐主线的 hosts 块（dns.alidns.com / doh.pub / dns.google / cloudflare-dns.com）；改 true 后生效
  - §1 DNS 跨产物联动：OpenClash Normal/Full 同步（并补全各自 hosts 缺失的 alidns/doh.pub）

## v5.4.17-cmfa.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP：同步 Clash Party v5.4.17 DNS 合同
  - `default-nameserver` 只保留 `223.5.5.5 / 119.29.29.29 / 1.1.1.1 / 8.8.8.8`
  - `nameserver` / `direct-nameserver` 全部使用国内 DoH；`proxy-server-nameserver` / `fallback` 使用境外 DoH
  - 关闭 `prefer-h3`，开启 `respect-rules: true`，补齐 `nameserver-policy` 与 `fallback-filter.geosite`

## v5.4.16-cmfa.2 (2026-05-22)

- ✅ FEAT#GAME-ACCEL：新增游戏加速器 `PROCESS-NAME -> DIRECT` 白名单
  - 新增 16 条 PROCESS-NAME 规则（UU / 小黑 / 迅游 / 雷神 / NNer 加速器）
  - 同步 Clash Party v5.4.16 基线

## v5.4.16-cmfa.1 (2026-05-20)

- ✅ FIX#149-P0：rules 顶部前置 `DOMAIN-SUFFIX,paddle.com,🏦 金融支付`
  - 当前 anti-AD/DustinWin 源包含 `analytics.paddle.com`，该白名单必须位于 `RULE-SET,anti-ad` 之前
  - 修复 Antigravity 登录/账号设置中 Paddle 许可支付链路被广告规则误拦截的问题

## v5.4.15-cmfa.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER：同步 Clash Party v5.4.15 元数据，新增 GEOSITE 覆盖台账引用。
- ♻️ REFACTOR#AD-FP-MODULE：rules 顶部显式标记 Anti-ad false-positive allowlist；规则顺序与 v5.4.14 保持等价。

## v5.4.14-cmfa.1 (2026-05-20)

- ✅ FIX#CF-R2-P0：前置 `DOMAIN-SUFFIX,cloudflarestorage.com,🌐 国外网站`
  - 覆盖 Sukka `reject_phishing` 对 Cloudflare R2 存储域的误拦截
  - 后段 CDN/国外网站重复条目已移除，规则首匹配稳定落到 `🌐 国外网站`

## v5.4.13-cmfa.1 (2026-05-19)

- ✅ FIX#STUN-REALIP：STUN/TURN 域名不再拿 fake-ip，标准探测端口直连
  - `fake-ip-filter-mode` 改回 `blacklist`，移除不存在的 `RULE-SET,Google` / `RULE-SET,AI` 等引用
  - 补齐 `stun1-4.l.google.com`、STUN/TURN 通配与 `DST-PORT 5349 / 19302 / 19305 / 19307`

## v5.4.12-cmfa.1 (2026-05-12)

- ✅ FIX#RD-REALIP：`DOMAIN-SUFFIX,rustdesk.com,real-ip` 加入 `fake-ip-filter-mode: rule`
  - RustDesk 域名仍由会议协作规则走代理，但 DNS 返回真实 IP，避免 rendezvous/relay 拿到 198.18.x fake-ip

## v5.4.11-cmfa.1 (2026-05-12)

- ✅ FIX#RD-PROC：RustDesk 进程规则从 `DIRECT` 改为 `🧑‍💼 会议协作`，并保留 `DOMAIN-SUFFIX,rustdesk.com` 前置保护
- ✅ FIX#DNS-BOOTSTRAP：DNS `nameserver` / `direct-nameserver` / `proxy-server-nameserver` 改为 IP-first，避免 DoH 自举死锁

## v5.4.9-cmfa.1 (2026-05-11)

- ✅ FEAT#LOCAL-TOOLS：同步 Clash Party v5.4.9 的桌面本地工具 `PROCESS-NAME -> DIRECT` 白名单
  - 面向 ClashMi Windows/macOS/Linux 与其他桌面 Mihomo YAML 消费端；Android 导入不报错但不以桌面进程名为主要命中路径
  - 仅使用精确进程名，不使用宽泛 `PROCESS-NAME-REGEX`


## v5.4.8-cmfa.2 (2026-05-11)

- ★ META#BASELINE：同步文件头基线为 Clash Party v5.4.8
  - 不改变 proxy-groups / rule-providers / rules 语义

## v5.4.8-cmfa.1 (2026-05-09)

- ★ ORDER#RULE-TAIL：同步 Clash Party v5.4.8 规则尾段匹配顺序

## v5.4.7-cmfa.1 (2026-05-09)

- ★ FEAT#TikTok：新增独立 `🎵 TikTok` 业务组（32 业务组），置于 `📺 国内流媒体` 与 `🎥 Netflix` 之间
  - proxy-groups 插入 `🎵 TikTok` select 组（引用 `*id002`）；rules 从 `📱 社交媒体` 独立并前置
- ★ FIX#HK：香港节点/家宽 `filter:` 追加 `|港`，补全广港/深港等 IEPL/IPLC 跨境专线节点分类

## v5.4.6-cmfa.1 (2026-05-08)

- ★ FEAT#145：WeChat CDN 直连
  - 新增 `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT`（置于 iwipwedabay.com 后、binance 前）
  - 跟随 Clash Party v5.4.6 基线

## v5.4.5-cmfa.1 (2026-05-07)

- ★ 全球节点置顶 + 全产品组顺序同步（跟随基线 v5.4.5）

## v5.4.4-cmfa.1 (2026-05-07)

- ★ FIX#144：bbys.app DIRECT 规则
  - 新增 `DOMAIN-SUFFIX,bbys.app,DIRECT` 规则（置于 acc-chinamax 后、GFW 前），bbys.app 视频域名直连
- ★ FEAT#143：家宽 filter 新增 IEPL/IPLC/专线识别
  - 所有家宽区域组的 `filter:` 正则中追加 `iplc|iepl|专线`，匹配含 IPLC/IEPL/专线标识的家宽类型节点
- ★ FIX#142（DNS 冷启动）为 Clash Party JS 专属修复，静态配置豁免（无同构改动）
- Bump: `v5.4.3-cmfa.1` → `v5.4.4-cmfa.1`

## v5.4.3-cmfa.1 (2026-05-06)

- ★ FEAT：家宽 filter 添加 `|home` 关键词（跟随 Clash Party v5.4.3 基线）
  - 所有 11 个家宽区域组的 `filter:` 内 `resi(dential)?|...|broadband|isp` 追加 `|home`，匹配仅含 Home 的节点名

## v5.4.2-cmfa.1 (2026-05-05)

- ★ FIX#41-P0：小米核心服务 DIRECT 白名单（跟随 Clash Party v5.4.2 基线）
  - 新增 11 条 DIRECT 规则前置广告拦截段，修复 miuiprivacy/advertisingmitv 误杀认证安全域名

## v5.4.0-cmfa.1 (2026-05-05)

- ★ FEAT#SG：新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立 url-test 区域组
  - 新加坡从 🌏 亚太节点 filter 中移除，独立成组
  - 所有 31 业务组 proxy 列表增加狮城选择
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51
  - 跟随基线 Clash Party v5.4.0

## v5.3.0-cmfa.1 (2026-04-26)

- ★ REFACTOR#2：流媒体分组架构重构——按区域 → 按平台（7→13 流媒体组）
  - 拆出 5 个主流平台独立组：🎥 Netflix / 🎬 Disney+ / 📡 HBO/Max / 📺 Hulu / 🎬 Prime Video
  - 拆出 2 个全球平台独立组：📹 YouTube / 🎵 音乐流媒体
  - 保留 4 个区域锁区组：🇭🇰 香港流媒体 / 🇹🇼 台湾流媒体 / 🇯🇵 日韩流媒体 / 🇪🇺 欧洲流媒体
  - 新增 🌐 其他国外流媒体 兜底（接收长尾平台 + 原东南亚流媒体）
  - 业务组 25→31，总组 43→49
## v5.2.11-cmfa.1 (2026-04-26) — 业务组合并精简 28→25（降低用户认知负担）

- ★ **REFACTOR#1**：跟随 Clash Party v5.2.11 基线，业务组合并精简
  - 合并 🔍搜索引擎 + 📟开发者服务 → 新增 🔧工具与服务
  - 合并 📧邮件服务 → 🌐国外网站
  - 合并 ☁️云与CDN → 🌐国外网站
  - 📥下载更新 策略从 DIRECT 优先改为代理优先
  - 🛰️BT/PT Tracker 保留独立
- Bump: `v5.2.10-cmfa.1` → `v5.2.11-cmfa.1`

## v5.2.10-cmfa.1 (2026-04-25) — 境外 DoH 端点改路由到 🚫 受限网站

- ★ **FIX#39**（同构联动）：跟随 Clash Party v5.2.10 基线
  - `DOMAIN,dns.google,☁️ 云与CDN` → `🚫 受限网站`
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `🚫 受限网站`
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `🚫 受限网站`
  - 原因：dns.google / cloudflare-dns.com 在境内被 GFW 阻断，语义上属"受限网站"而非"CDN"；
    放在 `🚫 受限网站` 后即使 `☁️ 云与CDN` 被用户改成直连，DoH 仍能走代理。
  - 国内 DoH 端点（doh.pub / dns.alidns.com）保留 `nameserver` / `direct-nameserver` 配置不变。
- Bump: `v5.2.8-cmfa.6` → `v5.2.10-cmfa.1`（主版本追平到 v5.2.10）

## v5.2.8-cmfa.6 (2026-04-25) — 补齐 18 区域 filter 中缺失的裸 ISO alpha-2 代码

- ★ **FIX#29-P2**：CMFA 区域 filter 缺少裸 ISO alpha-2 代码（`HK`/`TW`/`JP`/`KR`/`SG`/`US`/`CA`/`EU`/`AF`）
  - 现象：节点命名为 `HK-01` / `JP-01` / `US-01`（无旗帜 emoji 且无 alpha-3 代码）时，
    CMFA `filter:` 因缺少裸 2 字母代码而无法分类 → 节点落入默认全局组。
    其他产物（Clash Party JS word-boundary regex、OpenClash Ruby 子串、SR/Surge/Loon/QX 显式罗列）
    均能正确分类此类命名。
  - 根因：CMFA filter 使用 Go RE2 子串匹配，裸 `US` 会误命中 `MUSIC`/`FOCUS`/`JUST` 等
    含 `US` 子串的单词。早期版本为规避此问题故意省略了裸代码。
  - 修复：对 18 个区域 filter（9 全部 + 9 家宽）添加 `(^|[^a-zA-Z])CODE([^a-zA-Z]|$)` 字边界模拟模式。
    该模式在 Go RE2 中正常工作（标准捕获组 + 锚点 + 字符类组合，不依赖 `\b`/lookahead 等 RE2 不支持的语法）。
    - `(^|[^a-zA-Z])` 匹配字符串开头或非字母字符
    - `CODE` 为具体的 2 字母 ISO 代码
    - `([^a-zA-Z]|$)` 匹配非字母字符或字符串结尾
    - 效果：`HK-01` ✅ / `NODE_US` ✅ / `JP01` ✅ / `MUSIC` ❌ / `FOCUS` ❌ / `TWD` ❌
  - 影响区域：🇭🇰 香港 / 🇹🇼 台湾 / 🇯🇵 日韩 / 🌏 亚太 / 🇺🇸 美国 / 🇪🇺 欧洲 / 🌎 美洲 / 🌍 非洲
    （9 全部 + 9 家宽 = 18 处 filter，含 2 组 AND 复合 home filter 各两侧同时补齐）
  - 全量审计跳过：OpenClash Ruby 已含裸代码（子串匹配）；JS baseline 已有 word-boundary；
    SR/Surge/Loon/QX 已有显式罗列；SingBox/v2rayN 无运行时分类（N/A）。
  - 版本号 `v5.2.8-cmfa.5` → `v5.2.8-cmfa.6`

## v5.2.8-cmfa.5 (2026-04-24) — DNSPod DoH 端点切换为纯 IP 形式

- ★ `nameserver` / `proxy-server-nameserver` / `direct-nameserver` 三段里的
  `https://doh.pub/dns-query` 全部替换为 `https://1.12.12.12/dns-query`
  - DNSPod 同时提供 `doh.pub` 域名形式与 `1.12.12.12` 纯 IP 形式两种 DoH 端点
  - 纯 IP 形式**无需 bootstrap DNS 解析 `doh.pub`**，消除"冷启动时 DoH 自依赖"的
    潜在死锁（bootstrap 阶段 `default-nameserver` 只需解析 `dns.alidns.com` 和
    `dns.cloudflare.com`，不再需要解析 `doh.pub`）
- 版本号 `v5.2.8-cmfa.4` → `v5.2.8-cmfa.5`

## v5.2.8-cmfa.4 (2026-04-24)

- ★ **删除 2 个离线 rule-provider**（与 Clash Party v5.2.1 对齐）
  - `ckrvxr-antifraud`（`Ckrvxr/MihomoRules/.../AntiAntiFraud.yaml`）—— 源仓库持续 404，Clash Party JS 在 v5.2.1 已删除并注释 `v5.2.1 REMOVED`
  - `ckrvxr-antipcdn`（`Ckrvxr/MihomoRules/.../AntiPCDN.yaml`）—— 同上
  - 同时删除 `rules:` 段中对应的 2 条 `RULE-SET,ckrvxr-antifraud,🛑 广告拦截` / `RULE-SET,ckrvxr-antipcdn,🛑 广告拦截`
  - rule-providers 数量 386 → 384（与 OpenClash 对齐）
- ★ **修正 3 条规则目标组归属**（对齐 Clash Party JS 基线）：
  - `deepseek.com`：`🤖 AI 服务` → `🏠 国内网站`（基线 `BIZ.CN_SITE`）
  - `inflection.ai`：`🤖 AI 服务` → `🚫 受限网站`（基线 `BIZ.GFW`）
  - `pi.ai`：`🤖 AI 服务` → `🚫 受限网站`（基线 `BIZ.GFW`）
- 版本号 `v5.2.8-cmfa.3` → `v5.2.8-cmfa.4`

## v5.2.8-cmfa.3 (2026-04-23)

- ★ **FIX#28-P0**（节点分类同构 bug 补齐）：🌏 亚太节点 filter 补 HK/TW/JP/KR 子串
  - 现象：CMFA 侧用户订阅的香港/台湾/日韩节点进不了 🌏 亚太节点组。
  - 根因：L486 亚太 filter 只匹配 `新加坡|Singapore|SGP|马来西亚|...|🇸🇬|🇲🇾|...`，未包含 HK/TW/JP/KR 任何标识 → mihomo 按 Go RE2 子串匹配时，港台日韩节点全部落空。与 Clash Party JS 主线语义不一致（`apacNodes = c.HK.concat(c.TW, c.CN, c.JP, c.KR, c.SG, c.APAC_OTHER)`）。
  - 修复：
    - L486 🌏 亚太节点 filter 头部补 `香港|HongKong|Hong\s*Kong|HKG|🇭🇰|台湾|台灣|Taiwan|Taipei|TPE|TWN|🇹🇼|日本|东京|大阪|Japan|Tokyo|Osaka|NRT|KIX|JPN|🇯🇵|韩国|首尔|Korea|Seoul|ICN|KOR|🇰🇷`（与香港/台湾/日韩节点 filter 关键词一致，避免裸 `HK`/`TW`/`JP`/`KR` 误命中 HKD / TWD 等非节点字符串）
    - L495 🏡 亚太家宽 filter 同步扩展（两侧 lookahead/lookbehind 的子区域关键词都加）
  - 💡 美洲节点（L540）已包含 `美国|United\s*States|USA|LAX|...|🇺🇸`，不需要改；欧洲/非洲亦已正确覆盖所属国家。
  - 同构 bug 审计（CLAUDE.md §1.5 强制）：OpenClash Ruby Normal / Full 命中同构 bug，本 PR 一并修复（见 `OpenClash/CHANGELOG.md` v5.2.8-oc-normal.3 / v5.2.8-oc-full.3）。Clash Party JS / Normal JS / Shadowrocket / Surge / Loon / QX 核对均已有正确覆盖；SingBox / v2rayN 无运行时分类（N/A）。
  - 跟随基线：Clash Party v5.2.8 → CMFA bump 到 `v5.2.8-cmfa.3`。

## v5.2.7-cmfa.1 (2026-04-23)

- ★ **FIX#27-P1**：消除 mihomo 加载 3 个 classical rule-provider 的 parse warning（与 Clash Party v5.2.7 同步）
  - 现象（用户报告）：CMFA 启动 / reload 日志反复打印
    - `parse classical rule [USER-AGENT,TikTok*] error: unsupported rule type: USER-AGENT`
    - `parse classical rule [USER-AGENT,BBCiPlayer*] error: unsupported rule type: USER-AGENT`
    - `parse classical rule [IP-CIDR , 17.253.4.125] error: payloadRule error`
  - 根因：upstream `szkane/ClashRuleSet` 的 `CiciAi.list` / `UK.list` 各含 1 行 USER-AGENT（mihomo `classical` provider 不识别，是 Surge / iOS 遗留语法）；upstream `Accademia/Additional_Rule_For_Clash` 的 `Grok.yaml` 含 1 行 `IP-CIDR         , 17.253.4.125`（多余空格 + 缺 CIDR 掩码）。
  - 修复：把 `szkane-ciciai` / `szkane-uk` / `acc-grok` 的 URL 切到本仓库根目录新增的 `mirrors/` 子目录的清洗副本（仅删问题行，剩余规则字节级一致）。TikTok / BBC 域名分别已由 `geosite:tiktok` / `geosite:bbc` 提供 100% 覆盖；17.253.4.125 是 Apple `time.apple.com` anycast，与 Grok 路由无关。
  - 跟随基线：Clash Party v5.2.7 → CMFA bump 到 `v5.2.7-cmfa.1`。

## docs (2026-04-23) — 追加 ClashMi 兼容说明（纯文档，YAML 未改动）

- ★ **README §一 顶部"适用客户端"行**：追加 **[ClashMi](https://github.com/KaringX/clashmi)**（KaringX 跨平台 Flutter GUI，iOS/macOS/Android/Windows/Linux）。
- ★ **README 新增 §九〈兼容客户端：ClashMi（跨平台）〉**：导入方式 + 与 CMFA 行为一致点（37 代理组 / 387 RULE-SET / fake-ip DNS / 区域组 url-test）+ ClashMi 专属差异表 6 项。
- ★ **根 `README.md`**：
  - 顶部"覆盖客户端"列表补 `ClashMi`
  - 协议矩阵"客户端列名缩写对照"里 **CMFA** 条目扩展到包含 ClashMi，指向 CMFA §九
- ★ **`CLAUDE.md` §0 备注链**：新增一段〈关于 ClashMi〉（与〈关于 Hiddify〉对称，说明"mihomo 跨平台 GUI 版"的复用模式）。
- **关键兼容性论据**（均引自 ClashMi 官方 [FAQ](https://clashmi.app/guide/faq)）：
  - ClashMi bundle 的是 MetaCubeX mihomo **mainline**（非 vernesong Smart fork）—— 与 CMFA 同源。
  - ClashMi 内核定制会把 `GEOIP,*` / `GEOSITE,*` **强制转换**为 rule-set → 本 YAML 自检 **0 条 GEOIP / 0 条 GEOSITE / 387 条 RULE-SET**，转换零触发。
  - iOS VPN Extension 50 MB 内存硬顶 → 本 YAML 使用 `.mrs` 二进制 + 懒加载，不触发 OOM。
  - iOS 端 IP-ASN 不可用 → 本 YAML 未使用 ASN 规则。
  - `tun:` 由 App UI 托管 → 本 YAML 未写 `tun:` 段，天然兼容。
- **版本号策略**：本次仅改 `README.md` / `CHANGELOG.md` / 根 `README.md` / `CLAUDE.md`，**未触及** `CMFA(mihomo).yaml`，故不 bump YAML 版本号。

## v5.2.6 (2026-04-22)

- ★ **FIX#24-P0**（同构 bug 补齐）：`filter:` 正则补 ISO alpha-3 国家代码
  - 现象：机场节点命名为 `TWN 01 / JPN 01 / KOR 01 / SGP 01` 时，mihomo 按 `filter:` 正则做子串匹配。
    原 TW 组只有 `Taiwan|Taipei|TPE|🇹🇼`；JP/KR 组只有 `Japan|Korea|Tokyo|Osaka|Seoul|NRT|KIX|ICN|🇯🇵|🇰🇷`；
    APAC 组没有 `SG/Singapore/🇸🇬`。这些 alpha-3 命名节点一律漏过滤 → 台湾/日韩/亚太组少节点
  - 修复：
    - L521 🇹🇼 台湾节点 filter：补 `TWN`
    - L548 🌏 亚太节点 filter：补 `新加坡|Singapore|SGP|🇸🇬`
    - L557 🇯🇵 日韩节点 filter：补 `JPN|KOR`
  - 同步 Clash Party v5.2.6 FIX#24（JS REGION_DB + OpenClash Ruby REGIONS 同步修复）

## v5.2.5 (2026-04-20)

- ★ 同步 Clash Party v5.2.5 FIX#23-P1：删除 `acc-geositecn` + `acc-china` 两个 rule-provider（与 `geosite:cn` 纯重复）
- 头部版本号从 v5.2.2 同步到 v5.2.5

## v5.2.2 (2026-04-20)

对齐 Clash Party FIX#17-P0：

- ★ `rule-providers` 统一 `proxy: '🚫 受限网站'`（389 处，原值 `'☁️ 云与CDN'`）
- ★ 头部版本号从 v5.2.0 同步到 v5.2.2

## v5.2.0 (初版)

- 9 url-test 区域组 + 28 业务策略组 + 375+ rule-providers
- 所有 GEOSITE / GEOIP 高级标签已用等效 RULE-SET 替代，无需等 `.dat` 下载
- 区域组使用 `type: url-test`（静态 YAML 不支持 Mihomo Smart + LightGBM；LightGBM 仅在桌面端 Clash Party JS 运行时注入）
