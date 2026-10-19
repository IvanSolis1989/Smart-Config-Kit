# 苹果客户端官方能力复核（2026-10-19）

复核对象为当前仓库配置；版本表示本次可读取的官方发布状态，不表示已在对应 App 完成导入或流量验收。所有时间以 UTC 为准；API 原始时间和时区保留在缓存。

## 已完成与证据位置

- 已修正 Surge 无效 DNS 节，以及 Quantumult X 多 DoH 写法；两者规则、策略组和服务器顺序未改。
- 已更新六份 REFERENCE 的时效声明，以及存在明确事实错误的 Surge / Loon / Quantumult X / Shadowrocket README 协议说明。
- [sources.json](sources.json)列明 57 个官方来源；[manifest.json](manifest.json)记录下载状态、实际 URL、时间、内容 SHA-256、gzip SHA-256 和收据。56 个成功，1 个可选失败。正文保存在 `bodies/<content-sha256>.gz`；原有 REFERENCE 历史摘要和前次 manifest 均保留。
- 用 `node tools/cache-official-docs.js --group docs/upstream/2026-10-19/apple --read <id>` 解压读取正文；`--verify` 独立校验清单与两层哈希。GitHub raw 来源均通过收据固定到实际 commit。
- `help.shadowrocket.net` 本次无法读取，且未能从当前开发者页面证明归属，标记 optional/pending；没有以社区手册替代官方正文。当前 App Store 链接的开发者网站是 [shadowlaunch.com](https://shadowlaunch.com/)。

## 最新版本与地区

六款 iOS App 通过 [Apple US lookup](https://itunes.apple.com/lookup?id=1442620678,1596063349,1616105820,1373567447,1443988620,932747118&country=us) 与 [JP lookup](https://itunes.apple.com/lookup?id=1442620678,1596063349,1616105820,1373567447,1443988620,932747118&country=jp)逐项比对，版本和发布时间一致；[CN lookup](https://itunes.apple.com/lookup?id=1442620678,1596063349,1616105820,1373567447,1443988620,932747118&country=cn)返回 `resultCount=0`。这仅证明此次查询没有中国区可见条目，不外推其他地区或购买状态。缓存 ID 为 `apple-lookup-us/jp/cn`。

| 产品/平台 | 稳定版本 | 官方发布时间 UTC | 预发布与注意事项 |
|---|---|---|---|
| Surge iOS | 5.23.0 | 2026-10-12 23:54:04 | 公开可确认版本/日期的 iOS TestFlight 元数据未取得，pending |
| Surge Mac | 6.10.0 / 12500 | 2026-10-12 15:24:34 | beta feed：6.11.0 / 12560，2026-10-16 16:34:32 |
| Stash iOS/tvOS | 3.6.4 | 2026-10-19 06:27:11 | 官方 TestFlight 页未提供可确认的当前 build；pending |
| Stash Mac | 4.3.3 / 564 | 2026-10-14 03:48:16 | 同一 feed 明确 beta channel：4.4.0 / 569，2026-10-16 21:22:08 |
| Egern | 2.20.0 | 2026-07-23 17:04:21 | 未取得可确认版本/日期的官方预发布元数据，pending |
| Loon | 3.5.2 | 2026-10-01 18:11:07 | 同上；Mac 为 Apple Silicon 可运行的商店 App，未另造独立 Mac 版本 |
| Quantumult X | 1.8.1 | 2026-10-07 11:43:14 | 未取得可确认版本/日期的官方预发布元数据，pending |
| Shadowrocket | 2.2.92 | 2026-09-07 04:14:10 | 同上；未把社区 build 号作为官方预发布 |

最新 App 的系统要求（Apple lookup 的 `minimumOsVersion`）为：Surge iOS17、Stash iOS16、Egern iOS16、Loon iOS15、Quantumult X iOS15、Shadowrocket iOS13。Mac feed 的 `minimumSystemVersion` 分别是 Surge macOS12.0、Stash macOS12.4。这是当前 App 的系统要求，不是新字段最初引入版本，也不自动抬高仓库配置最低基线；各 README 已按当前渠道证据更新准备条件。

Surge Mac 来源是[稳定 Sparkle feed](https://nssurge.com/mac/latest/appcast-signed.xml)与[beta feed](https://nssurge.com/mac/latest/appcast-signed-beta.xml)，缓存 `surge-mac-stable/beta`。beta 首项 title 仍为“Version 6.10.0”，但 enclosure 的 `sparkle:shortVersionString=6.11.0`、build=12560；按实际 enclosure 报版本并保留冲突，未静默更改原文。官网发布页是 JS 容器，其[官方前端](https://nssurge.com/static/js/main.367b5fb6.js)直接读取上述 feed，缓存并非空容器摘要。

Stash Mac 来源是[官方更新 feed](https://releases.stash.ws/appcast.xml)，缓存 `stash-mac-appcast`；稳定与 beta 按 `sparkle:channel` 区分。iOS Wiki 发布页仅列到 3.4.0，Mac Wiki 仅到 4.2.0；[旧版本下载页](https://stash.ws/macos/previous-versions)也只列至 4.2.1，均不能取代实际更新 feed / Apple metadata。未下载客户端二进制。

## Surge iOS / Mac

**当前适配**：`Surge/Surge.conf` 使用 22 个 `url-test` 区域组、33 个 `select` 业务组、`include-all-proxies`、`policy-regex-filter` 和远程文本 `RULE-SET`。保留原生格式；[RULE-SET 官方说明](https://manual.nssurge.com/rules/ruleset.html)明确其索引优化与远程缓存，不能仅凭新版本宣称改成另一格式会更快。

**必要修正已实施**：旧配置 `[DNS]` 下 `fallback-dns-server` / `dns-direct-fallback-proxy` 没有官方语法依据。[Profile Format](https://manual.nssurge.com/profile/format.html)列举所有识别节，未知节只保存原文而无错误；[General](https://manual.nssurge.com/profile/general.html)列出可配置 DNS 键。因此“能导入”无法证明旧节生效。已删除该节及误导说明，版本为 **v6.0.20-Surge.11**，Build 2026-10-19。

[加密 DNS 官方说明](https://manual.nssurge.com/dns/encrypted-dns.html)规定并发首答；加密 DNS 启用时普通 DNS 仅用于连通性检测及加密 DNS 域名自举。原四个 DoH（223.5.5.5、223.6.6.6、8.8.8.8、1.1.1.1）全部保留；原普通 DNS 列表与 `encrypted-dns-follow-outbound-mode=false` 保留。旧 fallback 的两个 DoH 已在该四项内，无需增加重复项。官方没有“直连 DNS 失败才转代理”的等价开关；改为 true 会整体按规则出站并存在代理域名解析循环，不能冒充同义修复。

**新能力及取舍**：[category](https://manual.nssurge.com/policy-groups/parameters.html) 和 HTTPS 测速要求 iOS 5.23.0+ / Mac 6.10.0+；类别只影响显示，可选推迟。组级 `underlying-proxy` 要求 5.22.0+ / 6.9.0+，本仓库没有明确链式代理需求，不默认开启。[Surge smart](https://manual.nssurge.com/policy-groups/smart.html)要求 iOS 5.11.0+ / Mac 5.7.0+，有真实连接质量与站点记忆，不能写成“Surge 没有 Smart”；它也不等于 Mihomo LightGBM，改区域选择算法需另行行为验证。beta 的 `block-quic=adaptive`、入站 Tailscale/WireGuard 不下放稳定配置。

**协议事实更正**：[TUIC](https://manual.nssurge.com/policies/tuic.html)原生支持 `tuic-v5`，该页未给最初引入版本；[Hysteria 2](https://manual.nssurge.com/policies/hysteria2.html)为 iOS 5.8.0+ / Mac 5.4.0+；[AnyTLS v2](https://manual.nssurge.com/policies/anytls.html)为 iOS 5.17.0+ / Mac 6.4.3+。[Snell v6](https://manual.nssurge.com/policies/snell.html)客户端要求 iOS 5.20.0+ / Mac 6.7.0+，官方仍标注协议 beta。[external](https://manual.nssurge.com/policies/external.html)仅 Mac，iOS 按 REJECT 处理。无需为节点协议升级修改本仓库规则。

**验证缺口**：无 Surge iOS/Mac 真机解析及 DNS 故障注入；未测量升级后的吞吐/内存。官方当前 [url-test](https://manual.nssurge.com/policy-groups/url-test.html)说明组内旧 `url=` 被忽略，当前同值全局 `proxy-test-url` 仍提供测试地址；这是后续注释清理候选，不声称已产生实测故障。`timeout` 是候选延迟过滤阈值而非测试连接超时，旧说明不能混用。

## Stash

**当前适配**：`Stash/Stash.yaml` 由受保护生成器从 CMFA 裁剪，使用 `url-test`、`lazy: true`、`interval: 300` 与 MRS/domain/ipcidr + YAML/classical。[Stash 原生 rule-set 文档](https://stash.wiki/en/rules/rule-set)独立确认 MRS 仅 domain/ipcidr；本结论不从 Mihomo 推断。无需把大集合改成 inline；后者明确限 iOS/tvOS 3.6+ / Mac 4.3+，主要用于少量自定义规则。

**新能力及取舍**：[DNS 文档](https://stash.wiki/en/features/dns-server)现明确 iOS/tvOS 3.6+ / Mac 4.3+ 支持加密 `default-nameserver`（除 system 外使用 IP 地址）、独立直连的 `proxy-server-nameserver`，以及 `nameserver-policy` / `fake-ip-filter` 引用 `rule-set:`。旧参考“default 只能明文IP、不能proxy-server”的结论已经历史化。现有保守配置仍可使用；本次不放宽生成器白名单、不抬最低版本。若采用，须同步最低版本、来源语义、循环解析回归和 App 导入。

[策略组文档](https://stash.wiki/en/proxy-protocols/proxy-groups)明确 `tolerance` 为毫秒并控制切换差值；CMFA 当前值为 10ms，单位一致，但 Stash 生成器仍剔除该字段。官方页没有最初引入版本，发布日期不能代替最低版本证据；列为可选优化，暂不修改。空组仍按 DIRECT；没有据新文档声称已支持 Mihomo `empty-fallback` / `exclude-type` / Smart LightGBM。

**发布变化**：[商店版本历史](https://apps.apple.com/us/app/stash-rule-based-proxy/id1596063349)的 3.6.0 新增规则集 DNS 引用、MASQUE、XHTTP、更多 REALITY 组合，随后改进 VLESS Vision、缓存和内存；这些主要由实际订阅节点决定。当前版本的协议清单在[原生协议页](https://stash.wiki/en/proxy-protocols/proxy-types)。Mac 4.4.0 beta 的 gun/splithttp 等不作为稳定配置前提。发布者性能宣称未在此仓库复测。

**验证缺口**：无 Stash App 导入；`tolerance` 最低引入版本 pending；若启用新 DNS 能力需实测代理域名自举与规则命中。

## Egern

**当前适配**：`Egern/Egern.yaml` 使用 `external` 订阅、22 个 `smart` 区域组、`flatten/filter`、`select` 业务组、`dns.bootstrap/upstreams/proxy_nameservers/forward`，引用本仓库生成的原生 YAML `rule_set`。以 [Egern policy groups](https://egernapp.com/docs/configuration/policy_groups/)、[DNS](https://egernapp.com/docs/configuration/dns/)与[rules](https://egernapp.com/docs/configuration/rules/)核对；未发现可据官方证据直接替换为 MRS 的理由。

**新能力及取舍**：2.20.0 的发布 metadata 明确所有基本组可直接附 `urls`，混合静态与订阅节点，原 `external` 仍为兼容写法，故不为新语法增加重复订阅或改现有组结构。Smart 已记入真实连接失败；现有原生 smart 会得到客户端改进，不映射成 Mihomo 参数。新增本地监听端口规则、DNS `tcp://`、Snell v1–v5、SSH、SOCKS5-TLS、更多 REALITY / gRPC 属于可选能力，当前配置没有对应新需求。原生 smart 的优先系数规则以 Egern 定义为准。

**验证缺口**：官方 rules 未暴露本仓库 Clash 风格 PROCESS-NAME，继续遗漏相关条件整条逻辑规则；没有用 iOS 能力猜测桌面支持。无 App 导入及真实订阅展开验收；本次未迁移现有原生 YAML 资产。

## Loon

**当前适配**：`Loon/Loon.conf` 使用 `[Remote Filter]` NameRegex、22 个 url-test、33 select、`[Remote Rule]` 原生文本列表、`[General] dns-server/doh-server/ip-mode`。[当前官方站](https://nsloon.app/docs/intro/)由 App Store 产品描述与开发者链接确认，取代只能得到旧 GitHub 摘要的来源缺口。[策略组](https://nsloon.app/docs/Policy/policygroup/)确认 interval 为秒、tolerance 为毫秒；[远程规则](https://nsloon.app/docs/Rule/sub_rule/)要求原生 Loon 语法，不直接支持本仓库 MRS 形式。

**发布变化及取舍**：[商店历史](https://apps.apple.com/us/app/loon/id1373567447)记录 3.5.0 重做 UDP/QUIC、Hysteria2 跳端口/代理链、更多 REALITY 组合；3.5.1 新 Rewrite/Script 语法保留旧配置兼容，3.5.2 为平台稳定修复。现有配置不启用新重写/脚本，无需借此改变分流。AnyTLS 自 3.3.9（2026-03-31）明确支持，ShadowTLS 为 3.2.6（2025-02-03），README 的未确认项已更正。

**DNS与限制**：[DNS](https://nsloon.app/docs/DNS/)说明加密解析失败默认回落普通 DNS，可在 App DNS 页面关闭；这不是 Surge 的行为。[General](https://nsloon.app/docs/General/)明确 `ip-mode` 从 3.2.3(754)、`hijack-dns` 从 3.2.5(789)，旧参考“3.2.0+”不可当最低版本依据。该页还列出 Build1007+ 的 include-tun 等；未确认当前稳定版本 build 与此门槛关系，暂不采用。[进程规则](https://nsloon.app/docs/Rule/process_rule/)明确仅 Mac 生效，iOS/tvOS 忽略进程条件的整条逻辑规则。

**验证缺口**：无 App 导入；本地/插件/订阅规则的优先级必须由真实客户端验收，不能把文件展示顺序当作全局匹配顺序。暂无必须修改路由的已复现实例。

## Quantumult X

**当前适配及已修正**：官方 [sample.conf](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)明确多个并发 DoH 需同一行以逗号分隔；已把四行合为一行，保留四 URL 与次序，版本 **v6.0.20-QX.11**，Build 2026-10-19。该官方样例缓存固定 commit `af6fb594233ec4a3ec6d4ccb3601e9c36b75ea2d`，证据 ID `qx-sample-conf`。结论为符合官方写法，没有证明旧重复键一定 last-wins。

`[filter_remote]` 与 `url-latency-benchmark` / `server-tag-regex` 保持 QX 原生结构。官方样例同时保留“regex只用于三种策略”的旧注释与使用 url-latency-benchmark 的示例，两者有冲突；采用具体示例不等于完成 App 实机证明。未新增解析器或替换规则格式。

**协议与发布**：[官方版本历史](https://apps.apple.com/us/app/quantumult-x/id1443988620)记录 VLESS 自 1.5.0、REALITY 自 1.5.5（2026-01-14）、AnyTLS 自 1.6.0（2026-05-21）；REALITY 不足以证明 XTLS-Vision，后者 pending。1.8.0 起最低 iOS15，1.8.1 为设备 UI 适配。当前官方 `server-complete.snippet` 已缓存，未根据社区清单扩写不确定协议支持。

**验证缺口**：无 QX App 并发 DNS、导入、命中和电量验证；不声称四服务器都在真实客户端被查询。新版本不是吞吐收益证据。

## Shadowrocket

**当前适配**：`Shadowrocket/Shadowrocket.conf` 的 `[Proxy Group]`、`policy-regex-filter`、URL式 RULE-SET、`dns-server/fallback-dns-server` 保留。当前官方开发者首页没有语法正文，旧参考中借社区文档得出的字段结论不升级为本次官方已确认。

**发布变化及取舍**：[官方商店历史](https://apps.apple.com/us/app/shadowrocket/id932747118)的 2.2.92 提及 Sudoku、独立直连域名 DNS、TCP/DNSCrypt、Tailscale 子网/出口节点、策略组 ping 排序、远程规则刷新和内存分配修复。它们说明客户端能力变化，但没有给本仓库需添加的新键语法及最低门槛，因此不猜测字段或新增配置。README 中引用 Surge/QX 的过期比较已用两者官方文档更正。

**验证缺口**：Shadowrocket help 来源正文及官方归属 pending；无真机导入、规则集更新或 OOM 测量。既有配置通过静态合同不能弥补这一证据缺口。

## 采用决策与检查

| 项目 | 本次状态 | 后续前提 |
|---|---|---|
| Surge 无效 DNS 节 | 已删除，服务器/顺序/出站值保持 | 真机 DNS 断网/失败行为验证 |
| QX 多 DoH | 已按官方同一行写法更正 | 真机并发查询验证 |
| 已证实协议说明错误 | 已更新相关 README / REFERENCE | 无需为文档更正修改路由 |
| Stash tolerance 10ms | 推迟，生成器不改 | 最低版本证据或明确新版本基线、维护者授权、导入/切换验证 |
| Stash 新 DNS/inline | 推迟 | iOS3.6+/Mac4.3+版本门槛、生成器方案及语义回归 |
| Surge Smart/category/新链式代理 | 可选，未启用 | 用户使用需求、版本门槛和行为验收 |
| Surge/Stash beta 功能 | 仅记录 | 稳定发布证据或明确采用预发布的授权 |
| Egern URLs 统一语法 | 保留兼容 external | 无必要迁移，不增加重复下载 |
| Shadowrocket 新 DNS 参数 | pending | 官方字段正文与版本证据 |

保存后已执行官方缓存清单/哈希读回；两项配置改动的局部比较证明仅改授权字段与元信息，规则与策略段一致。仓库综合合同回归由主线程统一执行，避免同一稳定输入重复全量检查；真实苹果客户端验收仍未完成。
