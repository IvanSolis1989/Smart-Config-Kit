# FlClash — 变更日志

> FlClash 覆写脚本 `FlClash(mihomo).js`，使用标准 Mihomo 内核的 url-test 区域组。
> 规则权威源：`rulesets/source/routing-graph.js`；FlClash 消费最终融合规则集，区域组与 Clash Party Normal 对齐。

---

## v6.0.14-flclash.12 (2026-09-30)

- FILTER：同步 Clash Party 的共享节点预检和默认关闭的倍率上限，保守解析显式标签，未知/歧义倍率保留；修复公告英文词对子串节点名的误匹配。
- GUARD：异常字段、重名歧义、名称冲突、provider 输入与筛选产生的链式依赖断裂在写入前拒绝；无可用节点时显式 `REJECT`。原地更新数组，保留 FlClash 桥接引用。
- SCOPE：源图、融合规则、组名和全局 DNS 保持 v6.0.14。静态端无同构 JS 输入处理，完整理由见 [逐端研究矩阵](../docs/research/2026-09-30-routing-script-research.md)。
- REFERENCE：复核官方 v0.8.98 的脚本后 App patch 顺序，更新参考与参数教程；新增 VM 回归和嵌入运行时一致性检查。

## v6.0.14-flclash.11 (2026-09-29)

- FIX：微信 HTTPDNS 两个精确域名命中首段 DIRECT 规则，避免 BlockHttpDNS 拦截微信图片模块的解析请求。
- SCOPE：仅豁免 `dns.weixin.qq.com`、`dns.weixin.qq.com.cn`；其他 BlockHttpDNS 域名及 FlClash DNS 基线不变。
- VERIFY：新增路由回归用例，检查最终融合域名资产的首命中策略为 DIRECT。

## v6.0.13-flclash.10 (2026-09-21)

- ★ FIX#182：同步修复 `dns.fake-ip-filter` 继承客户端旧 rule 模式和 `rule-set:cn domain` 悬空引用的问题。
  - 显式输出 `fake-ip-filter-mode: blacklist`。
  - 丢弃会随订阅 provider 清理而失效的 `rule-set:*` / `RULE-SET,...` 项，保留合法域名通配与内置 `geosite:*`。
- VERIFY：与 Clash Party Smart / Normal 共用同一 Issue #182 回归夹具，保持 QuickJS/Dart 原地数组契约、55 个策略组、151 条规则和 132 个 provider 不变。
- CONTRACT：见 `AGENTS.md` §3.5.1 / §8.4；官方 Mihomo DNS 语法以 `fake-ip-filter-mode` 与单 token `rule-set:xxx` / `geosite:xxx` 为准。

## v6.0.13-flclash.9 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：与 Clash Party Normal 同步第 013 国内网站资产；`linuxdo.org` 及子域不再落入国外网站，`linux.do` 保持受限网站。
- SCOPE：保留 v6.0.11-flclash.7 的应用层 DNS / Android VPN 修正，不改变 TUN、系统代理或应用排除配置。

## v6.0.12-flclash.8 (2026-09-01)

- FIX#181-PC：与 Clash Party Normal 同步首段精确直连资产；`login.nvidia.cn` 优先于 NVIDIA 下载宽规则，其余 NVIDIA 域名不变。
- SCOPE：保留 v6.0.11-flclash.7 的应用层 DNS / Android VPN 修正，不重新引入 UI DNS 覆盖或系统代理要求。

## v6.0.11-flclash.7 (2026-08-31)

- FIX#181-DOC：关联脚本后关闭应用层「DNS 覆写」及独立的「追加系统 DNS」，移除要求重复粘贴 UI DNS YAML 的教程与脚本头部错误提示；说明 UI 整体替换 DNS、丢失未知字段、最终配置验证和 IPv6 的应用层边界。
- ANDROID：校正 VPN「系统代理」的 UI 名称，说明它附加 HTTP 代理但不关闭 TUN，以及与应用访问控制/分流 VPN 混用的风险；提供保留国内 APP 排除名单的排障步骤。
- DNS/GEOX：区分国内 DoH、随机未分类 DNS 查询、节点 bootstrap 与真实泄漏；GeoX 默认 URL 优先，不再承诺 CDN 国内更快或要求强制替换。
- REFERENCE：按 FlClash v0.8.96 官方源码、Mihomo DNS 文档和 Android VpnService API 校正参考说明。
- SCOPE：本次只修正 FlClash 使用契约与版本元信息；DNS 算法、源规则图、55 组定义、132 个 provider、151 条规则及其他客户端配置均不改，不刷新上游规则资产。

## v6.0.11-flclash.6 (2026-08-22)

- ROUTING：与 Clash Party Normal 同步 132 个融合 provider / 151 条规则；Gemini 与 Accademia Gemini 改走 `🔍 Google 服务`，szkane AI 规则保持原位。

## v6.0.10-flclash.6 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：与 Clash Party Normal 同步首段精确直连融合规则；两个网易游戏服务主机优先于 anti-AD 与国内游戏宽规则。

## v6.0.9-flclash.5 (2026-08-02)

- FIX-NODE-ISO-LOWERCASE：与 Clash Party Normal 同构升级，支持 yun hk01 / yun us01 / yun jp01 / yun sg01 / yun tw01 等小写 ISO 两位码加编号的订阅节点。
- GUARD/VERIFY：仅对带编号的两位 ISO 码做不区分大小写匹配；共享 JS 合同验证 12 个原始样例的分类桶、区域主组和聚合组。

## v6.0.9-flclash.4 (2026-07-25)

- PROFILE：FlClash 覆写同步 `off / policy / adaptive` 的受信任 Node-DNS profile，默认 `adaptive`；三档不会改变 QuickJS/Dart bridge 的原地数组契约、55 组、规则或全局 DNS。
- ADAPTER-HARDENING：使用同一 capture/apply Module seam，拒绝 profile-mismatch、无 PSS baseline、冲突 resolver path 及超限的半条 policy；后置、大小写不同的活动节点精确 policy 有界优先。
- VERIFY/DOCS：共享 JS 合同新增 profile、bootstrap 原子容量与精确 key 回归；复核 FlClash v0.8.94（2026-07-11），未见覆写 API / DNS 对象 breaking change。

## v6.0.9-flclash.3 (2026-07-25)

- NODE-DNS：与 Clash Party Normal 同步受限私有节点 DNS Adapter。只为活动节点 FQDN 生成精确 node policy 与必要 hosts，不让订阅替换 FlClash 的全局 DNS 基线。
- VERIFY：共享 JS 合同验证 scalar hosts、IPv4/IPv6 bootstrap、通配符优先级、容量限制和幂等性；FlClash QuickJS 原地更新约束保持不变。

## v6.0.9-flclash.2 (2026-07-24)

- FIX#FLCLASH-IPV6：覆写脚本新增顶层 `ipv6: false`。此前只关闭 `dns.ipv6`，无法阻止内核继续接受 IPv6 流量；现在与 DNS AAAA 禁用策略保持一致。
- DOC#ANDROID-NETWORK：补充 Android VPN、系统代理、VPN 绕过、DNS 劫持和 PreferH3 的正确组合；明确脚本不能代替 FlClash 应用层 VPN 开关。
- REGRESSION：`validate-js-overwrites.js --target flclash` 固定校验顶层 IPv6 必须关闭。

## v6.0.9-flclash.1 (2026-07-19)

- 与 Clash Party Normal 同步：普通 `api.github.com` 先归工具组，仅指定 Code Helper 进程组合保留 AI 路由。

## v6.0.8-flclash.1 (2026-07-15)

- 同步国内权威优先级和 Mihomo 版本化融合规则缓存，保持与 Clash Party Normal 的路由语义一致。

## v6.0.7-flclash.1 (2026-07-14)

- FIX#176：标准 Mihomo 覆写同步 CN 域名权威段优先于共享 CDN / 国家 / 非中国地域 fallback 的融合顺序。

## v6.0.6-flclash.1 (2026-07-14)

- DIRECT-WORKPRO-WEB：标准 Mihomo 覆写同步 fused direct residual，父进程与 Web 子进程均以精确 `PROCESS-NAME` 命中 `DIRECT`；不使用 TUN 排除绕过。

## v6.0.5-flclash.1 (2026-07-14)

- DIRECT-WORKPRO：标准 Mihomo 覆写跟随 scki-local-process-direct 的永久回归清单，WorkPro.exe 固定进入 fused direct residual。

## v6.0.4-flclash.1 (2026-07-13)

- DIRECT-ITWDB：标准 Mihomo 覆写消费的默认 `DIRECT` 融合 MRS 纳入 `itwdb.com`，覆盖 WorkPro 子域名且不新增单条主规则。

## v6.0.3-flclash.1 (2026-07-12)

- SYNC：跟随 source graph v6.0.3，消费 124 个融合 `.mrs` / residual provider 与 141 条主规则。
- FIX#FUSED-DOMAIN-PAYLOAD：与 Clash Party Normal 使用同一正确 domain payload，OpenAI/ChatGPT 域名不再因 MRS 语法失配落入国外网站兜底。

## v6.0.2-flclash.2 (2026-07-12)

- FIX#REGION-CARRIER-PRIORITY：与 Clash Party Smart / Normal 同步修复运营商营销词抢占真实落地地区的分类缺陷。`🇯🇵AWS日本01 | 电信移动联通推荐` 现归类为 `JP`，同时进入 `🇯🇵 日韩节点` 和 `🌏 亚太节点`。
- REGRESSION：共享 JS 覆写回归验证覆盖日本 AWS + 中文运营商标签（含 `中国电信`）、美国 AWS + `China Telecom` 标签，以及无地区信息的纯运营商标签兜底为 `CN`。
- SCOPE：融合规则集、source graph 和 FlClash 业务分流规则均未改变；本次只修复运行时节点区域归类。

## v6.0.2-flclash.1 (2026-07-10)

- SYNC：跟随 source graph v6.0.2，消费 113 个融合 `.mrs` / residual provider 与 130 条主规则。
- PERF：继承编译器同策略语义去重和原生 GEOIP residual，不再加载错误放大的 HaGeZi / 国家 CIDR 内容。

## v6.0.1-flclash.1 (2026-07-10)

- SYNC：FlClash 继续只消费 source graph 编译出的融合 Mihomo `.mrs` / residual 规则集，113 个 provider 与 130 条主规则不变。
- DELIVERY：Issue #174 的文本规则集分片由统一融合编译器处理；FlClash 不引入上游 provider 直连或第二套规则框架。

## Unreleased (2026-07-09)

- SOURCE-GRAPH：移除 raw provider / raw rules / MRS 映射表，改为只消费 `tools/build-fused-rule-sets.js` 生成的最终融合规则集。
- RULES：最终输出为 `113` 个融合 provider 与 `130` 条规则；规则语义不变。

## v6.0.0-flclash.1 (2026-07-09)

- FUSED-RULESETS：同步 Clash Party Normal v6.0.0，标准 Mihomo 内核版本使用融合 `.mrs` / residual YAML。
- SCALE：规则规模压缩为 `113` 个融合 provider 与 `130` 条规则，保持 55 个代理组不变。

## v5.4.39-flclash.1 (2026-07-09)

- SYNC：同步 Clash Party Normal v5.4.39，规则规模更新为 474 providers、929 条规则。
- MIHOMO-MRS：424 个 provider 使用 `.mrs`；30 个 partial provider 追加残余 YAML；20 个全量不可转 provider 保留原格式。
- SOURCE-SIZE：继承压缩 `.mrs` 映射表，避免 QuickJS 覆写源码因多行兼容表继续膨胀。

## v5.4.38-flclash.1 (2026-07-09)

- SCKI-SUPPLEMENTAL：同步 Clash Party Normal v5.4.38，主 rules 改为引用补充规则集。
- MIHOMO-MRS：同步 429 providers、884 条规则，其中 366 个 provider 使用 `.mrs`；保持 QuickJS/Dart bridge 的数组/对象原地更新契约。
- FIX：保持 FlClash 原数组引用，避免覆写后规则数组身份变化。

## v5.4.37-flclash.1 (2026-06-29)

- ★ DNS-POLICY#170：同步 Clash Party Normal v5.4.37，`overwriteGeneral()` 为 Mihomo `nameserver-policy` 新增 `geosite:cn` 与 `geosite:geolocation-!cn` 解析器分流。
- 手动 DNS 示例同步 DoH-over-IP bootstrap、hosts 预解析、geosite policy 与 `direct-nameserver-follow-policy: true`，避免 FlClash UI 进阶配置覆盖掉脚本 DNS 合同。

## v5.4.36-flclash.1 (2026-06-29)

- CLEAN#171-DIRECT：同步删除 22 条经逐条确认的冗余直写规则。
- 与 Clash Party Normal 保持 100% 规则等价；AI / Binance / Microsoft login 候选因不同策略 `.mrs` 前置阻断，继续保留。

## v5.4.35-flclash.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM：同步 Clash Party v5.4.35，删除 8 个已被前序同目标规则覆盖的冗余上游规则集。
- CLEAN#170-DIRECT：删除 3 条已被前置 Douyin 国内流媒体守卫同目标覆盖的后置直写规则：`douyin.com`、`douyinpic.com`、`douyinvod.com`。
- Provider 生成同步缩减到 376；匹配顺序不变，FlClash 仍使用标准 Mihomo `url-test` 区域组。

## v5.4.34-flclash.1 (2026-06-28)

- ★ FIX#169-AMAP：同步 Clash Party v5.4.34，新增 MetaCubeX `amap` rule-provider 与 `RULE-SET,amap,🏠 国内网站`。
- 规则放在广告/威胁规则之后、TikTok/GFW/geolocation-!cn 宽规则之前，修复 `webapi.amap.com` 误走国外的首匹配风险。

## v5.4.33-flclash.1 (2026-06-27)

- ★ FEAT#169-AI-CODING：新增 `vpsdance-ai-coding` rule-provider，来源为 VPSDance `rules/clash/coding.yaml`，归入 `🤖 AI 服务`。

## v5.4.32-flclash.1 (2026-06-25)

- ★ FIX#168-CN-GAME：同步 Clash Party Normal v5.4.32，将国内游戏块前置到国外游戏宽规则之前，避免 HoYoverse / Game / category-games 抢先代理国内游戏域名。
- 新增 JS 覆写回归断言覆盖国内游戏优先级。

## v5.4.31-flclash.1 (2026-06-20)

- ★ FIX#167-DOUYIN：同步 Clash Party Normal v5.4.31，新增抖音 Web 国内流媒体前置守卫，`douyin.com` / `zjcdn.com` 等域名先于 TikTok 和国外兜底规则命中 `📺 国内流媒体`。
- 新增 JS 覆写回归断言，防止前置顺序回退。

## v5.4.30-flclash.1 (2026-06-17)

- ★ FEAT#166-GOOGLE：同步 Clash Party v5.4.30，新增 `🔍 Google 服务` 业务组并置于 `🔧 工具与服务` 之前。
- Google 基础服务、Scholar、Google IP 与 Google QUIC 规则从工具组拆出；业务组数量调整为 33。

## v5.4.29-flclash.1 (2026-06-10)

- ★ PERF#165-LATENCY：22 个区域 `url-test` 组 `interval: 180 -> 300`，与 Clash Party Normal / CMFA 对齐。
- 规则、DNS、节点过滤与业务策略组语义不变。

## v5.4.27-flclash.1 (2026-06-07)

- ★ CLEAN#165：同步 Clash Party Normal 清理 7 条已由 `claude` / `paypal` / `hbo` / `hulu` / `xbox` rule-provider 先行覆盖的直写域名，规则命中策略不变。

## v5.4.26-flclash.1 (2026-06-07)

- ★ FIX#164：腾讯 WorkBuddy `copilot.tencent.com` 国内直连防吞——szkane `AiDomain.list` 的 `DOMAIN-KEYWORD,copilot` 子串会把它误吞到 `🤖 AI 服务`（国外代理）导致对话报错；在所有 AI rule-set 之前前置 `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站`。基线 Clash Party v5.4.26。

## v5.4.25-flclash.1 (2026-06-03)

- ★ 审查修复：GEOIP 重复规则去重（`GEOIP,netflix` / `GEOIP,google` / `GEOIP,ID` 各出现 2 次 → 保留 GEOIP 标签路由集中区块）

## v5.4.24-flclash.1 (2026-06-03)

- ★ CLEAN：清除 18 条冗余规则 + 3 个未引用 provider（同步基线 v5.4.24，下载上游文件逐条验证）。
  - 删除 4 条 Binance DOMAIN-SUFFIX（binance.com/cloud/me/future.com，RULE-SET 已含）
  - 删除 3 个 Google 子 RULE-SET 引用 + provider（googlesearch/googledrive/googleearth，Google 元集已覆盖）
  - 删除 3 条 ProtonMail DOMAIN-SUFFIX（protonmail.com/proton.me/pm.me，RULE-SET 已含）
  - 删除 5 条音乐流媒体 DOMAIN-SUFFIX（soundcloud/sndcdn/pandora/deezer/tidal，各自 RULE-SET 已含）
  - 删除 2 条社交媒体 DOMAIN-SUFFIX（tumblr/clubhouse，各自 RULE-SET 已含）
  - 删除 2 条流媒体 DOMAIN-SUFFIX（vimeo/dailymotion，各自 RULE-SET 已含）

## v5.4.23-flclash.1 (2026-06-02)

- ★ FIX#161：`DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` → 🏠 国内网站 直连（知乎图片 CDN + 短链，同步基线）。

## v5.4.22-flclash.1 (2026-05-31)

- ★ GeTui(个推)推送 SDK `getui.com` / `getui.net` / `gepush.com` 加直连白名单（review 后补；延续 #2，被通用广告/隐私表当 tracker 拦截但承载 App 推送如米家；owner 选放行）。

#1 借鉴 Proxy-override：QUIC 精细化——AND 规则白名单豁免（YouTube/Google/MS/Apple 的 QUIC 走对应业务组）；其余非 CN QUIC REJECT。

- 配套新增 `config.sniffer`（QUIC/443 SNI 嗅探 + `force-dns-mapping`，对齐 CMFA/OpenClash）——使真 IP QUIC（fake-ip-filter 域名）也能 GEOSITE 匹配，避免误 REJECT（review 修复）。
- 兜底判据 `GEOIP,CN` → `GEOSITE,cn`（fake-ip 下更可靠）。

## v5.4.21-flclash.1 (2026-05-31)

#4 借鉴 Proxy-override：`default-nameserver` 从纯明文 IP 升级为 DoH-over-IP + 1 明文兜底；消除 bootstrap 阶段 DNS 泄漏。

## v5.4.20-flclash.1 (2026-05-30)

借鉴 Proxy-override 批 B · #6 节点过滤关键词补充（跟随 Clash Party v5.4.20）：

- junk 节点过滤器 `isInfoNode` 新增：中文 `免费` / `试用` / `应急`；英文（`\b` 词边界）`Sign` / `Login` / `Register` / `Help` / `FAQ`
- 不加「更新」「地址」（误伤风险高）
- 回归：`tools/validate-js-overwrites.js` flclash target fixture（junk 过滤 + Signal 守卫）+ `tools/test-info-node-filter.js` 一致性
- 🔢 版本：v5.4.19-flclash.1 → v5.4.20-flclash.1

## v5.4.19-flclash.1 (2026-05-30)

借鉴 Proxy-override 批 A（跟随 Clash Party v5.4.19；spec：`docs/2026-05-30-proxy-override-借鉴设计.md`）：

- ✅ #2 国内 SDK/CDN 直连前置：jpush / `msg.umeng.com` 加 `AD_FALSE_POSITIVE_ALLOWLIST` 强制 DIRECT（绕过 `jiguangtuisong` / `youmengchuangxiang` 拦截）；`baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` 前置到 🏠 国内网站段
- ✅ #3 fake-ip-filter 补全 10 条（远控 todesk/oray/sunlogin/teamviewer/anydesk · 游戏 battlenet.com.cn/wotgame.cn/wggames.cn/wowsgame.cn · B站 P2P mcdn.bilivideo.cn）
- ✅ #5 `direct-nameserver-follow-policy: true`（direct 出口域名解析遵循 nameserver-policy；本仓库 policy 仅含境外 CDN，零国内误伤）
- 🔢 版本对齐：v5.4.18-flclash.2 → v5.4.19-flclash.1（全产物跳过烧毁的 .18 统一到 v5.4.19）

## v5.4.18-flclash.2 (2026-05-30)
## v5.4.17-flclash.2 (2026-05-30)

- ★ FIX#VERSION-PREFIX：主版本前缀由误写的 v5.4.18 修正为 v5.4.17，对齐 baseline（主线 Smart JS）与其余 9 产物（CLAUDE.md §4；修复 validate-artifact-contracts 的 `js.flclash.version-prefix` 检查。内容（url-test/DNS 调优）不变，仅版本号前缀修正）
- ⚡ PERF#URLTEST-LATENCY：url-test 组参数全面调优，解决卡顿/高延迟/无法联网
  - `lazy: false`（全组节点主动测速，不再只测当前节点，避免"卡在劣化节点上"）
  - `interval: 120 → 180`（lazy=false 下合理拉长间隔，减少全组测速风暴）
  - `tolerance: 30 → 10`（切换阈值从 30ms 降至 10ms，节点劣化时更快切换）
- ⚡ PERF#DNS-RESILIENCE：DNS 引导与代理层优化
  - `default-nameserver` 移除境外 `1.1.1.1` / `8.8.8.8`，改用 `223.5.5.5` / `119.29.29.29` / `180.76.76.76`（全量国内自举，打破 fake-ip 循环依赖）
  - `proxy-server-nameserver` 不再混入国内 DoH（代理链路 DNS 纯走境外 Cloudflare/Google DoH）

## v5.4.17-flclash.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP：同步 Clash Party Normal v5.4.17 DNS 合同
  - `default-nameserver` 纯 IP，自举以外的 resolver 全部 DoH
  - 关闭 `prefer-h3`，开启 `respect-rules: true`，并补齐 `nameserver-policy` / `fallback-filter.geosite`

## v5.4.16-flclash.2 (2026-05-22)

- ✅ FEAT#GAME-ACCEL：新增游戏加速器 `PROCESS-NAME -> DIRECT` 白名单
  - 新增 16 条进程名（UU / 小黑 / 迅游 / 雷神 / NNer 加速器），同步 Clash Party Normal 基线

## v5.4.16-flclash.1 (2026-05-20)

- ✅ FIX#149-P0：同步 Clash Party Normal v5.4.16，前置 `paddle.com -> 🏦 金融支付`
  - 覆盖 anti-AD/DustinWin 对 `analytics.paddle.com` 的误拦截，避免 Antigravity 账号设置/许可链路被广告规则抢先命中

## v5.4.15-flclash.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER：同步 Clash Party Normal v5.4.15，新增 GEOSITE 覆盖台账引用。
- ♻️ REFACTOR#AD-FP-MODULE：将广告误伤白名单提升为 AD_FALSE_POSITIVE_ALLOWLIST，并在 injectRules() 顶部统一注入。

## v5.4.14-flclash.1 (2026-05-20)

- ✅ FIX#CF-R2-P0：同步 Clash Party Normal v5.4.14，前置 `cloudflarestorage.com -> 🌐 国外网站`
  - 覆盖 Sukka phishing 对 Cloudflare R2 存储域的误拦截
  - 后段 `🌐 国外网站` 重复条目已移除

## v5.4.13-flclash.1 (2026-05-19)

- ✅ FIX#STUN-REALIP：同步 Clash Party Normal v5.4.13，补齐 STUN/TURN fake-ip 排除与标准端口直连
  - 覆写脚本会把 STUN/TURN 通配、`stun1-4.l.google.com`、`global.turn.twilio.com` 合并进 `fake-ip-filter`
  - `DST-PORT 5349 / 19302 / 19305 / 19307` 走 `DIRECT`

## v5.4.12-flclash.2 (2026-05-12)

- 📝 DOC#IMPORT-HTML：FlClash 导入 URL 改为 `%28mihomo%29` 编码写法，并补充 `unexpected token '<'` 排障说明
  - 该错误表示客户端拿到 GitHub/错误页 HTML，而不是 JS 脚本；规则与 DNS 逻辑不变

## v5.4.12-flclash.1 (2026-05-12)

- ✅ FIX#RD-REALIP：覆写脚本在 DNS `fake-ip-filter` 中保留 `+.rustdesk.com`
  - 与 Clash Party Normal v5.4.12 对齐，RustDesk 仍走会议协作代理链路但 DNS 使用真实 IP

## v5.4.11-flclash.1 (2026-05-12)

- ✅ FIX#RD-PROC：RustDesk 进程规则从本地工具 `DIRECT` 白名单移出，改走 `🧑‍💼 会议协作`
- ✅ FIX#DNS-BOOTSTRAP：内置 DNS 示例与脚本输出均改为 IP-first，降低 DoH 域名解析死锁概率

## v5.4.9-flclash.1 (2026-05-11)

- ✅ FEAT#LOCAL-TOOLS：跟随 Clash Party v5.4.9 新增桌面本地工具 `PROCESS-NAME -> DIRECT` 白名单
  - Windows/macOS/Linux 可命中；Android 端不依赖该清单
  - 清单由 `tools/fixtures/process-name-direct-tools.json` 与 `tools/validate-process-name-direct.js` 校验

## v5.4.8-flclash.1 (2026-05-09)

- ★ ORDER#RULE-TAIL：跟随 Clash Party Normal v5.4.8-normal.1 重排规则尾段匹配顺序

## v5.4.7-flclash.1 (2026-05-09)

- ★ FEAT#TikTok：新增独立 `🎵 TikTok` 业务组（32 业务组），置于 `📺 国内流媒体` 与 `🎥 Netflix` 之间
  - 跟随 Clash Party Normal v5.4.7-normal.1 基线；BIZ + groups + rules + FP 同步
- ★ FIX#HK：`REGION_DB` HK kw 加 `'港'`，补全广港/深港等 IEPL/IPLC 跨境专线节点分类

## v5.4.6-flclash.1 (2026-05-08)

- ★ FEAT#145：WeChat CDN 直连 — 新增 `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT`
  - 置于 iwipwedabay.com 后、binance 前
  - 跟随 Clash Party Normal v5.4.6-normal.1 基线

## v5.4.5-flclash.1 (2026-05-07)

- ★ 全球节点置顶 + 全产品组顺序同步（跟随基线 v5.4.5）

## v5.4.4-flclash.1 (2026-05-07)

- ★ FIX#142-CRITICAL：DNS 安全兜底 nameserver 注入 — 避免空 DNS 导致 DIRECT 超时
  - overwriteGeneral 新增 DNS 保护代码，在 App UI 未配置 DNS 时自动注入 `223.5.5.5` / `119.29.29.29`
  - 设置 `enhanced-mode: fake-ip` 确保 DNS 解析模式不会因外部配置缺失而失效
- ★ FIX#144-P1：bbys.app DIRECT 直连规则
  - injectRules 中 acc-chinamax 规则后新增 `DOMAIN-SUFFIX,bbys.app,DIRECT`
- ★ FEAT#143：IEPL/IPLC 家宽识别关键词扩展
  - RESIDENTIAL_PATTERNS 新增 `/\biplc\b/i`、`/\biepl\b/i`、`/专线/` 三条规则
- 跟随基线 Clash Party v5.4.4

## v5.4.3-flclash.1 (2026-05-06)

- ★ FEAT：家宽节点识别新增 `\bhome\b` 关键词（跟随 Clash Party v5.4.3 基线）
  - `RESIDENTIAL_PATTERNS` 数组追加 `/\bhome\b/i`，匹配仅含 Home 的节点名

## v5.4.2-flclash.2 (2026-05-05)

- ★ FIX#41-P0-QuickJS：injectRules 重赋值 → 原地 splice+push（修复 QuickJS ↔ Dart FFI 桥接层丢失路由规则）
  - `config.rules = [...]` 在 FlClash QuickJS 环境中创建新数组，Dart 端持有旧引用 → 所有规则丢失
  - 改为 `_newRules` 临时数组 + `config.rules.splice(0)` + 逐个 `push` 原地写入
  - 此 bug 导致 FlClash 用户在 cleanupSubscription 清空规则后注入的 1000+ 条规则全部丢失

## v5.4.2-flclash.1 (2026-05-05)

- ★ FIX#41-P0：小米核心服务 DIRECT 白名单（跟随 Clash Party v5.4.2 基线）
  - 新增 11 条 DIRECT 规则前置广告拦截段，修复 miuiprivacy/advertisingmitv 误杀认证安全域名

## v5.4.1-flclash.2 (2026-05-05)

- ★ FIX#FlClash-Review-P0：恢复 FlClash 覆写脚本的有效 UTF-8 字符串字面量
  - 修复 `REGION_DB` / `SMART` / `BIZ` 被 mojibake 破坏后产生的 `SyntaxError`
  - 从 `ClashParty(mihomo).js` 重新同步干净规则逻辑，并保留 FlClash 的 QuickJS 日志包装与数组原地修改约束
- ★ FIX#FlClash-Review-P0：补回 `classifyAllNodes` 初始化 buckets
  - 样例 `TWN 01 AnyRoute IEPL x2.5` → 台湾，`SGP 01 AnyRoute IEPL x2.5` → 狮城，未知家宽节点 → 其他家宽
  - 同构审计：Clash Party Normal 同步修复；Smart 主线正常；其余静态/非 JS 产物无此初始化回归

## v5.4.0-flclash.1 (2026-05-05)

- ★ FEAT#SG：新增 🇸🇬 狮城节点 + 🏡 狮城家宽 独立区域组
  - 新加坡从 🌏 亚太节点 中拆分为独立区域
  - 区域组总数：18 → 20（10 全部 + 10 家宽），总组数：49 → 51
  - 跟随基线 Clash Party v5.4.0

## v5.3.2-flclash.1 (2026-05-03)

- 初始版本，基于 Clash Party Normal v5.3.2 完整移植
  - 18 url-test 区域组（9 全部 + 9 家宽）+ 31 业务策略组（含 13 流媒体平台组）
  - 371+ rule-providers，覆盖 AI/流媒体/游戏/金融/社交/开发等全部场景
  - word-boundary 正则节点分类（REGION_DB 同 Clash Party v5.3.2）
  - 家宽自动识别 + 信息节点过滤
  - 订阅垃圾 proxy-groups / rules / rule-providers 自动清理
  - TLS 指纹自动注入（client-fingerprint）
- 适配 FlClash 覆写脚本环境：
  - `console.log` → 条件包装（兼容 QuickJS 引擎）
  - 全局设置精简：移除 `geox-url`/`geodata-mode`/TUN/端口覆写（FlClash UI 托管）
  - 数组操作改用原地修改（splice/push），避免 QuickJS FFI 桥接层重赋值丢失
- **导入方式确认**：FlClash 覆写脚本需要两步操作——先在「覆写脚本」创建脚本，再在订阅「更多→覆写」关联
- 必改配置文档化：GeoX URL（外部资源）+ DNS（进阶配置）
- 与 CMFA YAML 并行提供
