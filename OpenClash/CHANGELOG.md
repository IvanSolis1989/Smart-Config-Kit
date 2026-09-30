# OpenClash — 变更日志

> 覆盖 `OpenClash/OpenClash(mihomo).sh`（Normal）+
> `OpenClash/OpenClash(mihomo-smart).sh`（Full，完整版）。
>
> 两份脚本版本号各自独立递增，但主版本号跟随 Clash Party 主线。

---

## v6.0.14-oc-normal.10 / v6.0.14-oc-smart.10 (2026-09-30)

- INLINE：两份 Ruby 处理器只展平仅含 type/payload 的 inline provider；显式与 payload 节点统一校验，payload 深拷贝。失败不写源文件，成功后移除已展平 provider。
- CANDIDATES：具名 direct/reject 保留供链式拨号，只将远端代理计入全球/地区/家宽候选与节点域名采集；混合输入的全球组显式列出远端节点，避免 include-all-proxies 重新收录支持出站。仅有支持出站时全球 REJECT。
- GUARD：PASS-RULE 作为保留名称；两个实际 heredoc 与 JS/Ruby 行为对照回归通过。规则、业务选择与全局 DNS 基线保持不变，见 [后续研究](../docs/research/2026-09-30-routing-runtime-followup.md)。

## v6.0.14-oc-normal.9 / v6.0.14-oc-smart.9 (2026-09-30)

- FIX：信息过滤与三个 JS 对齐，保留合法 IPLC、DNS、中转、Telegram 等线路标签；英文公告词使用边界匹配。
- PREFLIGHT：在写源 YAML 前检查节点字段、重名与名称/链式依赖冲突。provider 输入要求先聚合展平，不再清除 provider 后只生成部分节点池。
- FILTER：本地 `SCKI_MAX_NODE_MULTIPLIER` 默认空值关闭；只筛除明确超过正数阈值的节点，未知/歧义倍率保留。无节点时全球组显式 `REJECT`，避免 `COMPATIBLE` 回退。
- SCOPE：共享 Ruby 运行时同步两版并通过实际 heredoc 执行与 YAML 读回验收；源图与融合资产仍为 v6.0.14。其余静态产物无同构订阅处理入口，见 [研究矩阵](../docs/research/2026-09-30-routing-script-research.md)。
- REFERENCE：复核 OpenClash v0.47.156 官方覆写模板和 Mihomo 代理组字段，更新参考、参数教程与 CI 检查。

## v6.0.14-oc-normal.8 / v6.0.14-oc-smart.8 (2026-09-29)

- FIX：同步首段 DIRECT 融合资产，为微信 HTTPDNS 两个精确域名提供前置直连例外。
- SYNC：Normal / Smart 跟随 source graph v6.0.14；其他 BlockHttpDNS 条目仍维持原拦截策略。

## v6.0.13-oc-normal.7 / v6.0.13-oc-smart.7 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：Normal 与 Smart 同步第 013 融合域名资产，`linuxdo.org` 及子域进入 `🏠 国内网站`。
- GUARD：主站 `linux.do` 继续由第 059 GFW 段接管；其余融合段沿用 v6.0.12 固定载荷。

## v6.0.12-oc-normal.6 / v6.0.12-oc-smart.6 (2026-09-01)

- FIX#181-PC：Normal 与 Smart 同步 `login.nvidia.cn` 的首段精确直连资产，优先于 NVIDIA 下载宽规则。
- SCOPE：只处理中国账号登录主机，不改变其他 NVIDIA 域名的下载组策略。

## v6.0.11-oc-normal.5 / v6.0.11-oc-smart.5 (2026-08-22)

- ROUTING：Normal 与 Smart 同步 Gemini / Accademia Gemini 的 Google 融合段；`szkane-ai` 仍按原顺序走 AI。
- SYNC：升级为 132 个融合 provider / 151 条规则，发布缓存键为 `v6.0.11`。

## v6.0.10-oc-normal.5 / v6.0.10-oc-smart.5 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：Normal 与 Smart 同步首段融合直连资产；两个网易游戏服务主机在 anti-AD 和 `netease.com` 国内游戏宽规则之前固定直连。

## v6.0.9-oc-normal.4 / v6.0.9-oc-smart.4 (2026-08-02)

- FIX-NODE-ISO-LOWERCASE：Ruby 分类器在字母与数字交界处做受限规范化，解决 Ruby 单词边界把数字视为单词字符、导致 hk01 不命中的问题；用户提供的 12 个小写 ISO 编号节点均进入预期区域。
- GUARD/VERIFY：保留原 REGIONS 国家正则及其大小写无关语义；合同从两份真实 heredoc 提取分类器，以 Ruby 执行样例回归。

## v6.0.9-oc-normal.3 / v6.0.9-oc-smart.3 (2026-07-25)

- PROFILE：shell 只从受信任本地环境读取并白名单化 `off / policy / adaptive`，再传入 Ruby Adapter；profile 从不读取机场 YAML，且不改变规则、策略组或路由器全局 DNS 基线。
- ADAPTER-HARDENING：Ruby Module 改为 capture/apply seam，profile mismatch / 缺 PSS baseline 零写入；有界保留后置、大小写不同的活动节点精确 policy，resolver path/query 冲突 fail-closed，并保证接受 policy 所需 bootstrap hosts 一并保留。
- VERIFY/DOCS：真实 heredoc 合同覆盖三档 profile、大小写精确 key、13 个独立 resolver bootstrap、profile-mismatch 与零写入；复核 OpenClash v0.47.133（2026-07-18），未见覆写入口或 UCI 键 breaking change。

## v6.0.9-oc-normal.2 / v6.0.9-oc-smart.2 (2026-07-25)

- NODE-DNS：两份 Ruby 覆写均在读取订阅、写入固定 DNS 基线后，仅投影活动节点 FQDN 的私有 resolver policy 与 bootstrap hosts；源 PSS 不再成为全局默认节点 DNS。
- HARDENING：保留 Mihomo scalar hosts redirect，支持 IPv4 / IPv6 / IPv4-mapped IPv6，`*.` 优先于 `+.` / `.`，并在 64 条 hosts 上限前保留 resolver bootstrap。
- VERIFY：新增真实 heredoc Ruby 合同，覆盖 policy 作用域、通配符、私有 resolver、输出上限、幂等性和日志脱敏。

## 文档维护 (2026-07-16)

- MAINT#AGENTS-SINGLE-SOURCE：Normal / Smart 文件头统一指向根目录唯一维护契约 `AGENTS.md`，并明确源规则图优先；仅修改注释，不改变脚本运行时、规则内容或版本号。

## v6.0.9-oc-normal.1 / v6.0.9-oc-smart.1 (2026-07-19)

- 同步 `api.github.com` 的通用工具组融合段；路由器环境无桌面进程身份，因此不伪造 Copilot 进程例外。

## v6.0.8-oc-normal.1 / v6.0.8-oc-smart.1 (2026-07-15)

- Normal / Smart 同步国内权威优先级，并使用版本化融合 provider URL 与本地缓存路径。

## v6.0.7-oc-normal.1 / v6.0.7-oc-smart.1 (2026-07-14)

- FIX#176：Normal / Smart heredoc YAML 同步使用国内域名优先、通用国际 CDN / GeoIP 后置的融合顺序；路由器端不依赖 DNS 归属猜测，直接遵守源图首匹配优先级。

## v6.0.6-oc-normal.1 / v6.0.6-oc-smart.1 (2026-07-14)

- SYNC：Normal / Smart heredoc YAML 已按同一融合链重建。`PROCESS-NAME` 补丁仍是 Windows 桌面能力，路由器无法看到 LAN 客户端的 WorkPro 父进程或 Web 子进程，保持明确平台豁免。

## v6.0.5-oc-normal.1 / v6.0.5-oc-smart.1 (2026-07-14)

- DIRECT-WORKPRO：两份 heredoc YAML 跟随 source graph 的永久直连契约消费同一 fused direct residual；路由器端不能识别局域网客户端进程名，保持平台例外。

## v6.0.4-oc-normal.1 / v6.0.4-oc-smart.1 (2026-07-13)

- DIRECT-ITWDB：Normal / Smart heredoc YAML 同步默认 `DIRECT` 融合 MRS，`itwdb.com` 与 `workpro.itwdb.com` 不再依赖零散内联规则。

## v6.0.3-oc-normal.1 / v6.0.3-oc-smart.1 (2026-07-12)

- SYNC：Normal / Smart 统一升级到 Clash Party v6.0.3，消费 124 个融合 provider 与 141 条规则。
- FIX#FUSED-DOMAIN-PAYLOAD：两份 heredoc YAML 同步正确的 MRS domain wildcard 与 classical residual 分层，ChatGPT/OpenAI 不再落入国外网站尾段。

## v6.0.2-oc-normal.1 / v6.0.2-oc-smart.1 (2026-07-10)

- SYNC：Normal / Smart 同步到 Clash Party v6.0.2，使用 113 个融合 provider、130 条规则和 55 个策略组。
- PERF：`.mrs` 只承载规范化后的域名/IP，GEOIP 留在 residual YAML 原生查询；删除同策略重复和可证明被覆盖的规则。
- FAIL-CLOSED：生成链对错误上游替换、未解析嵌套源和非法残余语法直接失败，OpenClash 不再接收部分构建产物。

## v6.0.1-oc-normal.1 / v6.0.1-oc-smart.1 (2026-07-10)

- SYNC：Normal / Smart heredoc 同步到 Clash Party v6.0.1，继续引用融合 `.mrs` / residual YAML，113 个 provider、130 条规则和 55 个策略组不变。
- DELIVERY：OpenClash 不消费 Issue #174 所涉的移动端文本规则格式；仍由融合编译器和 manifest 保证全端规则顺序一致。

## v6.0.0-oc-normal.1 / v6.0.0-oc-smart.1 (2026-07-09)

- FUSED-RULESETS：Normal / Smart heredoc 同步到 Clash Party v6.0.0 融合规则集，直接使用融合 `.mrs` / residual YAML。
- SCALE：规则规模从 `474 providers / 931 rules` 压缩为 `113` 个融合 provider 与 `130` 条规则。
- META：`VERSION_TAG` 与内嵌 Ruby `VERSION` 同步到 v6.0.0。

## v5.4.39-oc-normal.1 / v5.4.39-oc-smart.1 (2026-07-09)

- MRS-PARTIAL：Normal / Smart heredoc 全量同步剩余可迁移规则源，当前为 474 providers、929 条规则。
- MIHOMO-MRS：424 个 provider 使用 `.mrs`，30 个 provider 使用残余 classical YAML，20 个 provider 因不支持 `.mrs` 类型保留原格式。
- SCKI-SUPPLEMENTAL：补充规则集 domain/ipcidr 部分改为 `.mrs`；进程规则保持 classical 文本，路由器端可导入但仅 Mihomo 能识别对应语义。
- META：`VERSION_TAG` 与内嵌 Ruby `VERSION` 同步到 v5.4.39。

## v5.4.38-oc-normal.1 / v5.4.38-oc-smart.1 (2026-07-09)

- SCKI-SUPPLEMENTAL：Normal / Smart heredoc 同步 15 个 `scki-*` rule-provider。
- MIHOMO-MRS：Normal / Smart heredoc 同步 429 providers、884 条规则，其中 366 个 provider 使用 `.mrs`，38 个混合 classical provider 拆分为 domain/ipcidr 双 `.mrs`。
- META：`VERSION_TAG` 与内嵌 Ruby `VERSION` 同步到 v5.4.38。

## v5.4.37-oc-normal.1 / v5.4.37-oc-smart.1 (2026-06-29)

- ★ DNS-POLICY#170：Normal / Smart heredoc YAML 的 `dns.nameserver-policy` 同步新增：
  - `geosite:cn` → AliDNS / DNSPod DoH。
  - `geosite:geolocation-!cn` → Cloudflare / Google DoH。
- 两份 `.sh` 的 `VERSION_TAG` 与内嵌 Ruby `VERSION` 同步到 v5.4.37；`OpenClash(mihomo).conf` 参考快照元数据同步到 v5.4.37。
- `direct-nameserver-follow-policy: true` 保持启用，说明文字同步为 CDN + geosite policy。

## v5.4.36-oc-normal.1 / v5.4.36-oc-smart.1 (2026-06-29)

- CLEAN#171-DIRECT：Normal / Smart 同步删除 22 条经逐条确认的冗余直写规则，provider 保持 376，规则语义与 Clash Party v5.4.36 对齐。
- `OpenClash(mihomo).conf` 参考快照同步到 v5.4.36；AI / Binance / Microsoft login 候选因不同策略 `.mrs` 前置阻断，继续保留。

## v5.4.35-oc-normal.1 / v5.4.35-oc-smart.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM：Normal / Smart 同步删除 8 个冗余 rule-provider 及对应 `RULE-SET` 行：`marketing`、`acc-vf-paypal`、`encoretvb`、`findmy`、`wildrift`、`acfun`、`acc-fl-douyin`、`acc-fl-xiaohongshu`。
- CLEAN#170-DIRECT：删除 3 条已被前置 Douyin 国内流媒体守卫同目标覆盖的后置直写规则：`douyin.com`、`douyinpic.com`、`douyinvod.com`。
- Provider 数 384 → 376；两份 `.sh` 的规则顺序保持与 Clash Party v5.4.35 对齐。
- `OpenClash(mihomo).conf` 参考快照元数据对齐 v5.4.35。

## v5.4.34-oc-normal.1 / v5.4.34-oc-smart.1 (2026-06-28)

- ★ FIX#169-AMAP：Normal / Smart 同步新增 MetaCubeX `amap.mrs` provider，下载代理保持 `🚫 受限网站`。
- 规则顺序：`RULE-SET,amap,🏠 国内网站` 位于广告/威胁规则之后、`proxy` / `geolocation-!cn` 国外兜底之前，避免 `webapi.amap.com` 依赖尾部 CN 兜底。
- `OpenClash(mihomo).conf` 参考快照元数据对齐 v5.4.34。

## v5.4.33-oc-normal.1 / v5.4.33-oc-smart.1 (2026-06-27)

- ★ FEAT#169-AI-CODING：Normal / Smart 同步新增 `vpsdance-ai-coding` provider 与 AI 服务规则命中。
- 保留 v5.4.32 国内游戏优先级修复。

## v5.4.32-oc-normal.1 / v5.4.32-oc-smart.1 (2026-06-25)

- ★ FIX#168-CN-GAME：Normal / Smart heredoc YAML 同步将国内游戏块前置到国外游戏块之前，防止 HoYoverse / Game / category-games 先命中代理。
- `OpenClash(mihomo).conf` 参考快照元数据对齐 v5.4.32。

## v5.4.31-oc-normal.1 / v5.4.31-oc-smart.1 (2026-06-20)

- ★ FIX#167-DOUYIN：Normal 与 Smart 同步在广告/TikTok/国外尾部规则前增加抖音 Web 国内流媒体守卫，覆盖 `douyin.com` 与 `zjcdn.com` 等视频 CDN 域名。
- `OpenClash(mihomo).conf` 参考快照元数据对齐 v5.4.31。

## v5.4.30-oc-normal.1 / v5.4.30-oc-smart.1 (2026-06-17)

- ★ FEAT#166-GOOGLE：Normal 与 Smart 同步新增 `🔍 Google 服务` 业务组，位置在 `🔧 工具与服务` 之前。
- Scholar、Google 基础服务、Google IP 与 Google QUIC 规则改投新组；Ruby/静态片段的业务组计数同步为 33。

## v5.4.29-oc-normal.1 / v5.4.29-oc-smart.1 (2026-06-10)

- ★ PERF#165-LATENCY：OpenClash Normal / Smart 两份 Ruby 覆写生成逻辑统一把区域自动测速 `interval` 设为 300s。
- 保持 rule-provider 下载代理为 `🚫 受限网站`；本轮不改变 FINAL 兜底语义。
- `OpenClash(mihomo).conf` 参考快照元数据对齐 v5.4.29。

## v5.4.27-oc-normal.1 / v5.4.27-oc-smart.1 (2026-06-07)

- ★ CLEAN#165：两份覆写脚本同步基线清理 Claude / PayPal / HBO / Hulu / Xbox 上游 rule-provider 已覆盖的直写域名。
- 额外修正：删除此前 OpenClash 中位于 `RULE-SET,hulu` 之后、实际不可达的 `hulu.jp` / `happyon.jp` 日韩流媒体兜底；删除后首个命中仍为 `RULE-SET,hulu → 📺 Hulu`。

## v5.4.26-oc-normal.1 / v5.4.26-oc-smart.1 (2026-06-07)

- ★ FIX#164：腾讯 WorkBuddy `copilot.tencent.com` 国内直连防吞——szkane `AiDomain.list` 的 `DOMAIN-KEYWORD,copilot` 子串会把它误吞到 `🤖 AI 服务`（国外代理）导致对话报错；两份覆写脚本均在 `RULE-SET,openai` 等 AI rule-set 之前前置 `DOMAIN-SUFFIX,copilot.tencent.com,\U0001F3E0 国内网站`。基线 Clash Party v5.4.26。

## v5.4.25-oc-normal.2 / v5.4.25-oc-smart.2 (2026-06-05)

- ★ SECURITY#OC-TMP：两份覆写脚本改用 `mktemp` 私有临时文件 + `trap` 清理，避免固定 `/tmp/clash_*` 在并发运行时互相覆盖或被符号链接预置。
- ★ SYNC#FAKE-IP-FILTER：补齐 `+.pub.3gppnetwork.org` / `+.bing.com` / `+.miwifi.com` 以及 Apple Push / 小米 / 个推真实 IP 条目，与 JS 三端 fake-ip-filter 保持 57 条一致。
- ★ VERIFY：合同验证新增 OpenClash fake-ip-filter 必需条目校验。

## v5.4.25-oc-normal.1 / v5.4.25-oc-smart.1 (2026-06-04)

- ★ 审查修复：GEOIP 重复规则去重（`GEOIP,netflix` / `GEOIP,google` 各出现 2 次 → 保留 GEOIP 标签路由集中区块）
- ★ SYNC：`OpenClash(mihomo).conf` 参考快照头部 metadata 对齐 Clash Party v5.4.25；权威运行产物仍为 Normal/Smart 两份 `.sh`。

## v5.4.23-oc-normal.1 / v5.4.23-oc-smart.1 (2026-06-02)

- ★ FIX#161：`DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` → 🏠 国内网站 直连（知乎图片 CDN + 短链，同步基线）。

## v5.4.22-oc-normal.1 / v5.4.22-oc-smart.1 (2026-05-31)

- ★ GeTui(个推)推送 SDK `getui.com` / `getui.net` / `gepush.com` 加直连白名单（review 后补；延续 #2，被通用广告/隐私表当 tracker 拦截但承载 App 推送如米家；owner 选放行）。

#1 借鉴 Proxy-override：QUIC 精细化——AND 规则白名单豁免（YouTube/Google/MS/Apple）；其余非 CN QUIC REJECT。首次补齐 OpenClash 的 QUIC AND 规则（此前缺失）。

- ★ FIX#HOSTS-DEDUP（review 修复）：删除 v5.4.21(#4) 误引入的重复 `use-hosts: false`——它在 YAML last-wins 下静默回退了 v5.4.17 FIX#HOSTS-ALIGN 的 `use-hosts: true`（两份 .sh 在同一 dns YAML 块内出现重复键）。修复后 hosts 预解析恢复，消除 fake-ip 冷启动循环依赖。
- 兜底判据 `GEOIP,CN` → `GEOSITE,cn`（同主线，fake-ip 下更可靠）。

## v5.4.21-oc-normal.1 / v5.4.21-oc-smart.1 (2026-05-31)

#4 借鉴 Proxy-override：`default-nameserver` 从纯明文 IP 升级为 DoH-over-IP + 1 明文兜底（阿里×2 + Google + CF）；消除 bootstrap 阶段 DNS 泄漏。

## v5.4.20-oc-normal.1 / v5.4.20-oc-smart.1 (2026-05-30)

借鉴 Proxy-override 批 B · #6 节点过滤关键词补充（Normal / Smart 同步；spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- Ruby `INFO_PATTERNS` reject 数组新增：中文 `/免费/` `/试用/` `/应急/`；英文 `/\bSign\b/i` `/\bLogin\b/i` `/\bRegister\b/i` `/\bHelp\b/i` `/\bFAQ\b/i`（`\b` 词边界防误伤 Signal；`/注册/` Register 中文已存在）
- 不加「更新」「地址」（误伤风险高，owner spec 排除）
- 一致性回归：`tools/test-info-node-filter.js` 覆盖两份 .sh 的 Ruby INFO_PATTERNS
- 🔢 版本：v5.4.19-oc-* → v5.4.20-oc-*

## v5.4.19-oc-normal.1 / v5.4.19-oc-smart.1 (2026-05-30)

借鉴 Proxy-override 批 A（Normal / Smart 同步；跟随 Clash Party v5.4.19；spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- ✅ #2 国内 SDK/CDN 直连前置
  - jpush / `msg.umeng.com` 前置到 `RULE-SET,jiguangtuisong` / `youmengchuangxiang` 广告拦截规则之前强制 DIRECT（沿用 paddle / 小米误杀前置白名单段）
  - `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` 前置到 🏠 国内网站段 `RULE-SET,cn` 之前
- ✅ #3 fake-ip-filter 补全 10 条（远控 todesk/oray/sunlogin/teamviewer/anydesk · 游戏 battlenet.com.cn/wotgame.cn/wggames.cn/wowsgame.cn · B站 P2P mcdn.bilivideo.cn）
- ✅ #5 `direct-nameserver-follow-policy: true`（direct 出口域名解析遵循 nameserver-policy；本仓库 policy 仅含境外 CDN，零国内误伤）
- 🔢 版本：v5.4.17-oc-* → v5.4.19-oc-*（全产物跳过烧毁的 .18 统一到 v5.4.19；含 VERSION_TAG + 内嵌 Ruby VERSION 双处）
## v5.4.17-oc-normal.2 / v5.4.17-oc-smart.2 (2026-05-30)

- ★ FIX#KR-WB：Ruby `REGIONS` 裸 `KR` 补词边界 `\bKR\b`（与同文件 HK/TW/JP/SG/US 一致）
  - 原 `/KR/i` 子串匹配，误把 Ukraine / Krakow / Kraken 等含 kr 串节点分到 🇯🇵 日韩节点
  - `\b` 把数字视为词字符，"KR01" 数字紧邻不命中（与 HK01/TW01 同；conf 产物用 lookbehind 允许数字边界，KR01 命中——各端既有风格差异，已记录）
  - §1.5 审计：Normal 与 Full 同构，同步修复；主线 Clash Party×3 JS + CMFA 本就带边界，未改
- ★ FIX#DEDUP：删除 rules 末尾重复死规则 noip.com / GEOIP,cloudflare / GEOIP,CN（各 1 处）
  - 与前段同条目字面重复，因规则顺序短路永不执行、目标组相同；删除零分流影响
- ★ FIX#HOSTS-ALIGN：`use-hosts: false` → `true`，并补全 hosts 缺失的 `dns.alidns.com` / `doh.pub`
  - 对齐主线：hosts 固定全部自用 DoH 域名 IP（alidns/doh.pub/google/cloudflare），消除 fake-ip 冷启动循环依赖
  - 此前 `use-hosts:false` 让 hosts 块失效（报告误判为"应删 hosts"，实为应启用）；§1 DNS 联动 CMFA 同步
- 回归测试见 `tools/test-kr-boundary.js`

## v5.4.17-oc-normal.1 / v5.4.17-oc-smart.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP：Normal / Smart 同步 Clash Party v5.4.17 DNS 合同
  - `default-nameserver` 纯 IP；`nameserver` / `direct-nameserver` 固定国内 DoH
  - `proxy-server-nameserver` 固定 Cloudflare + Google DoH，AliDNS + DNSPod DoH 兜底
  - `fallback` 固定 Cloudflare + Google DoH，关闭 `prefer-h3`、开启 `respect-rules: true` 并补齐 `fallback-filter.geosite`

## v5.4.16-oc-normal.2 / v5.4.16-oc-smart.2 (2026-05-22)

- ✅ FEAT#GAME-ACCEL：新增游戏加速器 `PROCESS-NAME -> DIRECT` 白名单
  - 新增 16 条 PROCESS-NAME 规则（UU / 小黑 / 迅游 / 雷神 / NNer 加速器）
  - Normal + Smart 同步

## v5.4.16-oc-normal.1 / v5.4.16-oc-smart.1 (2026-05-20)

- ✅ FIX#149-P0：Normal / Smart 同步前置 `paddle.com -> 🏦 金融支付`
  - 覆盖 anti-AD/DustinWin 对 `analytics.paddle.com` 的误拦截
  - heredoc YAML 中该规则位于所有广告/钓鱼/威胁情报 `RULE-SET` 之前，避免 Antigravity 账号设置回跳失败

## v5.4.15-oc-normal.1 / v5.4.15-oc-smart.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER：Normal / Smart 同步 Clash Party v5.4.15 元数据与台账引用。
- ♻️ REFACTOR#AD-FP-MODULE：heredoc YAML 的 rules 顶部显式标记 Anti-ad false-positive allowlist；白名单仍前置于广告/钓鱼/威胁情报规则。

## v5.4.14-oc-normal.1 / v5.4.14-oc-smart.1 (2026-05-20)

- ✅ FIX#CF-R2-P0：Normal / Smart 同步前置 `cloudflarestorage.com -> 🌐 国外网站`
  - 当前 Sukka phishing 源包含 Cloudflare R2 存储域，原后段国外网站规则会被广告段首匹配覆盖
  - heredoc YAML 在广告/钓鱼/威胁情报规则之前增加白名单，并删除后段重复条目

## v5.4.13-oc-normal.1 / v5.4.13-oc-smart.1 (2026-05-19)

- ✅ FIX#STUN-REALIP：OpenClash Normal / Smart 同步 STUN/TURN 真实 IP 与端口直连
  - heredoc DNS `fake-ip-filter` 补充 STUN/TURN 通配、`stun1-4.l.google.com` 与 `global.turn.twilio.com`
  - 规则尾段补齐 `DST-PORT 5349 / 19302 / 19305 / 19307 -> DIRECT`
  - UDP/443 仍保持 QUIC 屏蔽策略，不作为默认 STUN/TURN 例外

## v5.4.12-oc-normal.1 / v5.4.12-oc-smart.1 (2026-05-12)

- ✅ FIX#RD-REALIP：OpenClash Normal / Smart heredoc DNS `fake-ip-filter` 补充 `+.rustdesk.com`
  - RustDesk relay/API 仍走 `🧑‍💼 会议协作`，但域名解析返回真实 IP，避免 fake-ip 影响会合与中继阶段

## v5.4.11-oc-normal.1 / v5.4.11-oc-smart.1 (2026-05-12)

- ✅ FIX#RD-PROC：RustDesk 进程规则从 `DIRECT` 改为 `🧑‍💼 会议协作`，`rustdesk.com` 域名保护继续前置于 Copilot 规则
- ✅ FIX#DNS-BOOTSTRAP：heredoc YAML 的 DNS 服务器改为 IP-first，避免路由器冷启动时 DoH 自举失败

## v5.4.9-oc-normal.1 / v5.4.9-oc-smart.1 (2026-05-11)

- ✅ FEAT#LOCAL-TOOLS：语法同步 Clash Party v5.4.9 的桌面本地工具 `PROCESS-NAME -> DIRECT` 白名单
  - OpenClash 路由器端通常无法看到局域网客户端进程名，因此该清单主要用于保持 mihomo 规则形态一致
  - 不改变 proxy-groups / rule-providers / DNS 语义

## v5.4.8-oc-normal.2 / v5.4.8-oc-smart.2 (2026-05-11)

- ★ META#VERSION：同步脚本头部、`VERSION_TAG` 与内嵌 Ruby `VERSION`
  - Normal / Smart 均明确对齐 Clash Party v5.4.8
  - 不改变 proxy-groups / rule-providers / rules 语义

## v5.4.8-oc-normal.1 / v5.4.8-oc-smart.1 (2026-05-09)

- ★ ORDER#RULE-TAIL：同步 Clash Party v5.4.8 规则尾段匹配顺序
  - Normal 与 Smart heredoc YAML 同步
  - 仅调整 `rules:` 顺序，不调整 proxy-groups / Ruby 区域分类

## v5.4.7-oc-normal.1 / v5.4.7-oc-smart.1 (2026-05-09)

- ★ FEAT#TikTok：新增独立 `🎵 TikTok` 业务组（32 业务组），置于 `📺 国内流媒体` 与 `🎥 Netflix` 之间
  - heredoc YAML proxy-groups / rules 同步；Smart 版 Ruby `REGIONS` 同步
- ★ FIX#HK：Ruby `REGIONS["HK"]` 正则加 `|港`，补全广港/深港等 IEPL/IPLC 跨境专线节点分类

## v5.4.6-oc-normal.1 / v5.4.6-oc-smart.1 (2026-05-08)

- ★ FEAT#145：WeChat CDN 直连
  - 两份 shell 脚本 rules 段新增 `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT`（置于 iwipwedabay.com 后、binance 前）
  - 跟随 Clash Party v5.4.6 基线

## v5.4.5-oc-normal.1 / v5.4.5-oc-smart.1 (2026-05-07)

- ★ 全球节点置顶 + 全产品组顺序同步（跟随基线 v5.4.5）

## v5.4.4-oc-normal.1 / v5.4.4-oc-smart.1 (2026-05-07)

- ★ FIX#144：bbys.app DIRECT 规则
  - 两份 shell 脚本 rules 段新增 `DOMAIN-SUFFIX,bbys.app,DIRECT`（置于 acc-chinamax 后、GFW 前），bbys.app 视频域名直连
- ★ FEAT#143：家宽 Ruby RESIDENTIAL_PATTERNS 新增 IPLC/IEPL/专线识别
  - 两份 shell 脚本的 `RESIDENTIAL_PATTERNS` 数组追加 `/\biplc\b/i`、`/\biepl\b/i` 以及 `专线` 关键词，匹配含 IPLC/IEPL/专线标识的家宽类型节点
- ★ FIX#142（DNS 冷启动）为 Clash Party JS 专属修复，静态配置豁免（无同构改动）
- Bump: `v5.4.3-oc-normal.1` → `v5.4.4-oc-normal.1` / `v5.4.3-oc-smart.1` → `v5.4.4-oc-smart.1`

## v5.4.3-oc-normal.1 / v5.4.3-oc-smart.1 (2026-05-06)

- ★ FEAT：家宽 Ruby RESIDENTIAL_PATTERNS 添加 `\bhome\b` 关键词（跟随 Clash Party v5.4.3 基线）
  - 两份 shell 脚本的 `RESIDENTIAL_PATTERNS` 数组追加 `/\bhome\b/i`，匹配仅含 Home 的节点名

## v5.4.2-oc-normal.1 / v5.4.2-oc-smart.1 (2026-05-05)

- ★ FIX#41-P0：小米核心服务 DIRECT 白名单（跟随 Clash Party v5.4.2 基线）
  - 新增 11 条 DIRECT 规则前置广告拦截段，修复 miuiprivacy/advertisingmitv 误杀认证安全域名
  - Normal + Smart 两份 shell 同步修改

## v5.4.0 (2026-05-05) — 新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立区域组

- ★ FEAT#SG：跟随 Clash Party v5.4.0 基线，新增狮城节点组
  - 新加坡从 🌏 亚太节点 中拆分为独立区域
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51

## v5.3.0 (2026-04-26) — 流媒体分组架构重构

- ★ REFACTOR#2：跟随 Clash Party v5.3.0 基线，流媒体 7→13 组（按平台拆分）
  - 拆出：🎥 Netflix / 🎬 Disney+ / 📡 HBO/Max / 📺 Hulu / 🎬 Prime Video / 📹 YouTube / 🎵 音乐流媒体
  - 新增 🌐 其他国外流媒体 兜底
  - 业务组 25→31，总组 43→49

## Normal（`OpenClash(mihomo).sh`，非 Smart 内核 / url-test 版）

### v5.4.0-oc-normal.1 (2026-05-05)

- ★ FEAT#SG：新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立 url-test 区域组
  - 新加坡从 🌏 亚太节点 中拆分为独立区域
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51
  - 跟随基线 Clash Party v5.4.0

### v5.3.0-oc-normal.2 (2026-04-26) — FIX: fake-ip-filter 清理 + sniffer skip-domain 无效条目

- ★ FIX：清理 3 条币安域名在 `fake-ip-filter` 中的残留（Smart/CMFA 均无此条目，不一致）
  - 移除 `+.binance.com` / `+.binancefuture.com` / `+.binance.vision`
  - 币安路由已由 sniffer SNI 识别 + `DOMAIN-SUFFIX` 规则正确处理，fake-ip-filter 豁免为冗余
- ★ FIX：`sniffer.skip-domain` 移除无效条目 `Mijia Cloud`（含空格，非合法域名，永不匹配任何 SNI hostname）
- 版本号 `v5.3.0-oc-normal.1` → `v5.3.0-oc-normal.2`

### v5.3.0-oc-normal.1 (2026-04-26) — 同上

### v5.2.11-oc-normal.1 (2026-04-26) — 业务组合并：4 个冗余组 → 保留组 + 新增「🔧 工具与服务」

- ★ **合并业务策略组（28 → 25）：** 跟随 Clash Party v5.2.11 基线清理
  - 删除 `📧 邮件服务`：规则全部改路由到 `🌐 国外网站`
  - 删除 `🔍 搜索引擎` + `📟 开发者服务`：合并为 `🔧 工具与服务`
  - 删除 `☁️ 云与CDN`：规则全部改路由到 `🌐 国外网站`
  - `📥 下载更新`：`*id003` → `*id002`（默认代理优先级提高）
- Bump: `v5.2.10-oc-normal.2` → `v5.2.11-oc-normal.1`
- 同步 OpenClash Full（相同改动）

### v5.2.10-oc-normal.2 (2026-04-25) — FIX: sniffer.skip-domain 误含币安域名导致 TLS 流量按 IP 路由

- ★ **FIX：OpenClash sniffer.skip-domain 误含 3 条币安域名，导致 TLS SNI 改写被跳过**
  - 现象：freqtrade/量化交易容器访问 `data.binance.vision`、`fapi.binance.com` 等时出现
    `ContentLengthError` / `Cannot connect` / `TimeoutError`
  - 根因：`sniffer.skip-domain` 含 `+.binance.com` / `+.binancefuture.com` / `+.binance.vision`，
    sniffer 嗅出 SNI 后跳过域名改写，导致流量按原始 IP 路由 → 不命中
    `DOMAIN-SUFFIX,binance.*,💰 加密货币` → `MATCH` → 🐟 漏网之鱼 → 代理节点拒接或无 SNI 流量超时
  - 修复：删除 `skip-domain` 中 3 条币安条目，保留 `+.push.apple.com` 和 `Mijia Cloud`。
    fake-ip 层仍正常给币安分配真实 IP，sniffer 嗅出 SNI 后按 `DOMAIN-SUFFIX` 规则正确分流到 💰 加密货币组
  - 版本号 `v5.2.10-oc-normal.1` → `v5.2.10-oc-normal.2`

### v5.2.10-oc-normal.1 (2026-04-25) — 境外 DoH 端点改路由到 🚫 受限网站

- ★ **FIX#39**（同构联动）：跟随 Clash Party v5.2.10 基线
  - `DOMAIN,dns.google,☁️ 云与CDN` → `"DOMAIN,dns.google,\U0001F6AB 受限网站"`
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `"DOMAIN,dns.google.com,\U0001F6AB 受限网站"`
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `"DOMAIN-SUFFIX,cloudflare-dns.com,\U0001F6AB 受限网站"`
  - 用 `\U0001F6AB` 转义形式与本文件中其他 `🚫 受限网站` 规则保持一致
- ★ 同步 Ruby 脚本 `VERSION` 常量 + heredoc 头部 `VERSION_TAG`
- Bump: `v5.2.9-oc-normal.5` → `v5.2.10-oc-normal.1`（主版本追平到 v5.2.10）

### v5.2.9-oc-normal.5 (2026-04-25) — 兼容性审计修复

- ★ FIX-OC-01：REGIONS 正则补齐 HK/TW/JP/SG/US 的 `\b` word boundary
  - `HK` → `\bHK\b`（防命中 HKG/HKUST）、`TW` → `\bTW\b`（防命中 TWN/TWICE）
  - `JP` → `\bJP\b`（防命中 JPG/JPMorgan）、`SG` → `\bSG\b`（防命中 SGP）
  - `US\b` → `\bUS\b`（补起始 boundary，防 FOCUS 等内含 US 的词误匹配）
  - 同步 OpenClash Full
- ★ FIX-OC-01α：显式补齐 alpha-3 码 `HKG`/`TWN`/`JPN`/`SGP`（`\b` 丢失子串匹配能力后需显式声明，与 FIX#24 的 `KOR` 做法一致）
- Bump: `v5.2.8-oc-normal.4` → `v5.2.9-oc-normal.5`

### v5.2.8-oc-normal.4 (2026-04-24) — DNSPod DoH 端点切换为纯 IP 形式

- ★ `nameserver` / `proxy-server-nameserver` / `direct-nameserver` 三段里的
  `https://doh.pub/dns-query` 全部替换为 `https://1.12.12.12/dns-query`
  - DNSPod 纯 IP 形式 DoH 端点，**无需 bootstrap 解析 `doh.pub` 域名**，消除冷启动时
    DoH 自依赖的潜在死锁
- 版本号 `v5.2.8-oc-normal.3` → `v5.2.8-oc-normal.4`

### v5.2.8-oc-normal.3 (2026-04-23)

- ★ **FIX#28-P0**（节点分类多归属）：🌏 亚太节点组缺 HK/TW/JP/KR、🌎 美洲节点组缺 US
  - 现象（用户报告）：OpenClash 亚太组里看不到香港/台湾/日韩节点；美洲组里看不到美国节点。
  - 根因：Ruby 分类循环用 `GROUP_MAP.each { ... break }`，每个节点的 region code 只会命中 `GROUP_MAP` 里第一个包含它的条目 → HK 永远停在 `"HK" => ["HK"]`、US 永远停在 `"US" => ["US"]`，永远走不到 `"APAC"` / `"AM"` 条目。而 Clash Party JS 主线语义是 `apacNodes = c.HK.concat(c.TW, c.CN, c.JP, c.KR, c.SG, c.APAC_OTHER)` / `americasNodes = c.US.concat(c.AM)`，子区域与所属大洲**同时归属**。
  - 修复（L4275 ~ L4332）：
    - `GROUP_MAP["APAC"]` 扩充为 `["HK", "TW", "JP", "KR", "SG", "IN", "TH", "VN", "MY", "ID", "PH", "AU", "NZ", "TR", "AE"]`
    - `GROUP_MAP["AM"]` 扩充为 `["US", "CA", "MX", "BR", "AR"]`
    - 分类循环去掉 `break` —— 同一节点可同时进入子区域组（香港/台湾/日韩/美国）与所属大洲组（亚太/美洲）
  - 同构 bug 审计（CLAUDE.md §1.5 强制）：Ruby 双脚本 + CMFA YAML 均命中同构 bug，本 PR 一并修复（OpenClash Normal / OpenClash Full / CMFA）。Clash Party JS / Clash Party Normal JS / Shadowrocket / Surge / Loon / QX 经核对均已有正确覆盖，无需改动；SingBox / v2rayN 无运行时节点分类（N/A）。

### v5.2.7-oc-normal.1 (2026-04-23)

- ★ **FIX#27-P1**（与 Clash Party v5.2.7 同步）：消除 mihomo 加载 3 个 classical rule-provider 的 parse warning
  - 现象：OpenClash → mihomo 启动 / reload 日志反复打印
    - `parse classical rule [USER-AGENT,TikTok*] error: unsupported rule type: USER-AGENT`
    - `parse classical rule [USER-AGENT,BBCiPlayer*] error: unsupported rule type: USER-AGENT`
    - `parse classical rule [IP-CIDR , 17.253.4.125] error: payloadRule error`
  - 根因：upstream `szkane/ClashRuleSet` 的 `CiciAi.list` / `UK.list` 各有 1 行 USER-AGENT（mihomo 不识别）；upstream `Accademia/...` 的 `Grok.yaml` 有 1 行 `IP-CIDR         , 17.253.4.125`（多余空格 + 缺 mask）
  - 修复：把 `szkane-ciciai` / `szkane-uk` / `acc-grok` 的 URL 切到本仓库 `mirrors/` 子目录的清洗副本（仅删问题行，剩余规则字节级一致）
  - 跟随基线：Clash Party v5.2.7 → Normal bump 到 `v5.2.7-oc-normal.1`

### v5.2.6-oc-normal.1 (2026-04-22)

- ★ **FIX#24-P0**（同构 bug 补齐）：Ruby `REGIONS` 哈希补 `KOR` 字面量
  - 现象：`KR  => /韩国|韓國|KR|Korea|Korean|🇰🇷|Seoul/i`。Ruby 正则对 `"KOR 01"` 做子串匹配时，
    `KR` 不是 `KOR` 的子串（字母序 K-O-R，无连续 K-R），`Korea` 也不是 `KOR` 的子串 → `KOR` 节点
    被归为 `nil`（UNCLASSIFIED），从而不进入 🇯🇵 日韩节点组
  - 修复：L4086 追加 `KOR` 字面量 → `KR  => /韩国|韓國|KR|KOR|Korea|Korean|🇰🇷|Seoul/i`
  - 附注：`TW` 已通过 `/TW/i` 子串命中 `TWN`、`JP` 已通过 `/JP/i` 子串命中 `JPN`、`SG` 已通过
    `/SG/i` 子串命中 `SGP`，这三个本次无需改（Ruby 正则无 word boundary，与 JS 行为不同）
  - 同步 Clash Party v5.2.6 FIX#24

## Normal（`OpenClash(mihomo).sh`）

### v5.3.5-dedup-acc-china (2026-04-20)

- ★ 同步 Clash Party v5.2.5 FIX#23-P1：删除 `acc-china`（与 `geosite:cn` 纯重复；Normal 从 v5.3.4 起已不含 `acc-geositecn`，本次只删 `acc-china`）
- 收益：Normal provider 数 136 → 135；省 ~2 MB 内存 + 1 次冷启动 HTTP 拉取

### v5.3.4-align-dns-baseline (2026-04-20)

- ★ 对齐 Clash Party 基线 DNS（`Clash Party/README.md` 第 99-132 行）：
  - `use-hosts: true` → `false`
  - `default-nameserver` 从纯海外（1.1.1.1 / 8.8.8.8 / 9.9.9.9 …）改为基线顺序：`223.5.5.5 / 119.29.29.29 / 1.1.1.1 / 8.8.8.8`
  - `nameserver`: `223.5.5.5` DoH + `doh.pub` DoH（国内域名走国内解析）
  - `direct-nameserver`: 同 `nameserver`（走国内 DoH）
  - `proxy-server-nameserver`: `1.1.1.1` + `8.8.8.8` + `223.5.5.5` + `doh.pub`（4 项）
  - `fallback`: 仅 `1.1.1.1` + `8.8.8.8`（基线只列两个）
  - 删除非基线的 `direct-nameserver-follow-policy: false`
  - 移除"救援模式"注释（原救援模式已由 `nameserver-policy` 的 jsdelivr/github 直连策略覆盖）

### v5.3.3-align-rp-proxy-gfw (2026-04-20)

- ★ rule-providers `proxy: DIRECT` → `proxy: 🚫 受限网站`（136 处），对齐 Clash Party FIX#17-P0

### v5.3.2-dns-rescue-no-rules (之前)

- ★ 基础版本，含 DNS 冷启动救援 + 内存优化

### v5.3.1 性能基线（历史）

基于 `v5.2.4-oc` 针对 OOM 问题重构：

- **优化 #1** `geodata-loader: standard → memconservative`：节省 ~400–600 MB。`geosite.dat` / `geoip.dat` 改为 mmap 按需读取；代价：首次规则命中延迟 +几 ms（路由器场景无感）。
- **优化 #2** `rule-providers` 387 → 136（砍 65%）：节省 ~800–1,100 MB。
  - 合并 Google 家族（GoogleSearch / Drive / Earth / FCM / Voice → google 单项）
  - 合并 Apple 细分（AppleTV / News / Dev / Proxy / Siri / TestFlight / Firmware / FindMy → apple + icloud）
  - 删除区域化通讯分片（TelegramNL / SG / US、KakaoTalk、Zalo、GoogleVoice、iTalkBB）
  - 删除低频冷门（大陆长尾流媒体、欧洲 / 日本分区、非洲 / 南美 GeoRouting）
  - 删除冗余广告拦截（10+ 个功能重叠的 blackmatrix7 广告集）

保留不变：9 个 Smart 组（`uselightgbm: true + include-all-proxies: true`）、动态节点分类、DNS 多层架构、sniffer 配置、TLS 指纹注入、节点过滤、TCP 并发。

---

## Full（`OpenClash(mihomo-smart).sh`）

### v5.4.0-oc-smart.1 (2026-05-05)

- ★ FEAT#SG：新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立 Smart 区域组
  - 新加坡从 🌏 亚太节点 中拆分为独立区域
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51
  - 跟随基线 Clash Party v5.4.0

### v5.3.0-oc-full.2 (2026-04-26) — FIX: sniffer skip-domain 无效条目

- ★ FIX：`sniffer.skip-domain` 移除无效条目 `Mijia Cloud`（含空格，非合法域名，永不匹配任何 SNI hostname；与 CMFA 对齐）
- 版本号 `v5.3.0-oc-full.1` → `v5.3.0-oc-full.2`

### v5.3.0-oc-full.1 (2026-04-26) — 同上

### v5.2.11-oc-full.1 (2026-04-26) — 业务组合并：28 → 25（与 Normal 同步）

- ★ **业务组合并（28 → 25）：** 与 Normal 同步
  - 删除 `📧 邮件服务`（规则路由到 `🌐 国外网站`）
  - 删除 `🔍 搜索引擎` + `📟 开发者服务`（合并为 `🔧 工具与服务`）
  - 删除 `☁️ 云与CDN`（规则路由到 `🌐 国外网站`）
  - `📥 下载更新` 默认代理从 DIRECT 优先改为代理优先
- Bump: `v5.2.10-oc-full.2` → `v5.2.11-oc-full.1`

### v5.2.10-oc-full.2 (2026-04-25) — FIX: sniffer.skip-domain 误含币安域名导致 TLS 流量按 IP 路由

- ★ sniffer.skip-domain 删除 3 条币安域名（与 Normal 同步）
  - 根因 / 修复 / 影响同 Normal `v5.2.10-oc-normal.2`
  - 版本号 `v5.2.10-oc-full.1` → `v5.2.10-oc-full.2`

### v5.2.10-oc-full.1 (2026-04-25) — 境外 DoH 端点改路由到 🚫 受限网站

- ★ **FIX#39**（同构联动，与 Normal 完全一致）：跟随 Clash Party v5.2.10 基线
  - `DOMAIN,dns.google,☁️ 云与CDN` → `"DOMAIN,dns.google,\U0001F6AB 受限网站"`
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `"DOMAIN,dns.google.com,\U0001F6AB 受限网站"`
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `"DOMAIN-SUFFIX,cloudflare-dns.com,\U0001F6AB 受限网站"`
- Bump: `v5.2.9-oc-full.5` → `v5.2.10-oc-full.1`（主版本追平到 v5.2.10）

### v5.2.9-oc-full.5 (2026-04-25) — 兼容性审计修复

- ★ FIX-OC-01：REGIONS 正则补齐 HK/TW/JP/SG/US 的 `\b` word boundary（与 Normal 同步）
- ★ FIX-OC-01α：显式补齐 alpha-3 码 `HKG`/`TWN`/`JPN`/`SGP`（与 Normal 同步）
- Bump: `v5.2.8-oc-full.4` → `v5.2.9-oc-full.5`

### v5.2.8-oc-full.4 (2026-04-24) — DNSPod DoH 端点切换为纯 IP 形式

- ★ `nameserver` / `proxy-server-nameserver` / `direct-nameserver` 三段里的
  `https://doh.pub/dns-query` 全部替换为 `https://1.12.12.12/dns-query`（与 Normal 同步）
  - DNSPod 纯 IP 形式 DoH 端点，**无需 bootstrap 解析 `doh.pub` 域名**，消除冷启动时
    DoH 自依赖的潜在死锁
- 版本号 `v5.2.8-oc-full.3` → `v5.2.8-oc-full.4`（shell + Ruby 两处 VERSION 同步 bump）

### v5.2.8-oc-full.3 (2026-04-23)

- ★ **FIX#28-P0**（节点分类多归属，与 Normal 同步）：
  - 现象 / 根因 / 修复同 `v5.2.8-oc-normal.3`（L4273 ~ L4325 对应位置）。
  - `GROUP_MAP["APAC"]` 扩展到 HK+TW+JP+KR+SG+其它亚太国家，`GROUP_MAP["AM"]` 扩展到 US+CA+MX+BR+AR，循环移除 `break`。
  - 同构 bug 审计：见 Normal v5.2.8-oc-normal.3 条目。

### v5.2.7-oc-full.1 (2026-04-23)

- ★ **FIX#27-P1**（与 Clash Party v5.2.7 同步）：消除 mihomo 加载 3 个 classical rule-provider 的 parse warning
  - 现象 / 根因：同 Normal 版 v5.2.7-oc-normal.1 —— upstream `CiciAi.list` / `UK.list` 各 1 行 `USER-AGENT,*`、`Grok.yaml` 1 行 `IP-CIDR         , 17.253.4.125`（多余空格 + 缺 mask）
  - 修复：把 `szkane-ciciai` / `szkane-uk` / `acc-grok` 的 URL 切到本仓库 `mirrors/` 子目录的清洗副本
  - 跟随基线：Clash Party v5.2.7 → Full bump 到 `v5.2.7-oc-full.1`

### v5.2.6-oc-full.1 (2026-04-22)

- ★ **FIX#24-P0**（同构 bug 补齐）：Ruby `REGIONS` 哈希补 `KOR` 字面量
  - 同 Normal 版 v5.2.6-oc-normal.1：L4085 `KR` 正则追加 `KOR`
  - 同步 Clash Party v5.2.6 FIX#24

### v5.2.5-oc-full.1 (2026-04-20)

- ★ 同步 Clash Party v5.2.5 FIX#23-P1：删除 `acc-geositecn` + `acc-china`（与 `geosite:cn` 纯重复）
- 收益：full provider 数 387 → 385；省 ~5 MB 内存 + 2 次冷启动 HTTP 拉取
- Ruby Psych 解析验证：`providers=385 rules=975`（预期减 2 provider、减 2 rule line）

### v5.2.4-oc-full.1 (2026-04-20)

- ★ 同步 Clash Party v5.2.4 FIX#22-P0：snapchat rule-provider 拉取 403 修复
  - MetaCubeX meta-rules-dat 上游文件名是 `snap.mrs` 不是 `snapchat.mrs`
  - URL 改为 `.../geosite/snap.mrs`；path 改为 `./ruleset/meta-snap.mrs`
  - provider ID 保持 `snapchat`（`[Rule]` 段引用不变）

### v5.2.3-oc-full.2 (2026-04-20)

- ★ 对齐 Clash Party 基线 DNS（`Clash Party/README.md` 第 99-132 行）：
  - `use-hosts: true` → `false`
  - `default-nameserver`: `223.5.5.5 / 119.29.29.29 / 1.1.1.1 / 8.8.8.8`（基线顺序）
  - `nameserver / direct-nameserver`: `223.5.5.5` DoH + `doh.pub` DoH
  - `proxy-server-nameserver`: `1.1.1.1` + `8.8.8.8` + `223.5.5.5` + `doh.pub`
  - `fallback`: `1.1.1.1` + `8.8.8.8`
  - 删除非基线字段 `direct-nameserver-follow-policy`
  - 移除"救援模式"注释（功能仍在，靠 `nameserver-policy` 覆盖）

### v5.2.3-oc-full.1 (2026-04-20)

- ★ 同步 Clash Party v5.2.3 FIX#21-P1：BBC / Snapchat(Snap) 规则从 blackmatrix7 classical yaml 切换到 MetaCubeX meta-rules-dat 的 `.mrs` geosite（domain + mrs），消除 mihomo 对 `USER-AGENT,BBCiPlayer*` 与 `USER-AGENT,TikTok*` 的解析警告。
- ★ **CRITICAL FIX**：删除被意外追加在末尾的 Normal `rule-providers`(136) + `rules`(678) 块（原文件 6115 行 → 4285 行）。Ruby 的 Psych YAML 解析器对重复顶层键遵循 "last-wins" 规则，之前这两个追加块会静默覆盖前面的 Smart 块，导致 `OpenClash(mihomo-smart).sh` 实际运行时跑的是 Normal 内容，并且 Normal 块里 ad-block providers 还错用了 `proxy: DIRECT`。修复后 OC Smart 真正实现了与 Clash Party 主线的规则数量对齐。
- ★ 头部注释按 `CLAUDE.md §1.3` 扩展（介绍 / 架构 / 变更日志 / 基线对齐声明）。

### v5.2.2-oc-full (初版)

- ★ 从 Clash Party v5.2.2 JS 主线转换为 OpenClash heredoc YAML + Ruby 处理器。
