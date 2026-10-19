# sing-box / Xray 客户端组官方核验（2026-10-19）

原 sing-box JSON 存在可复现的解码失败，现已由同一生成器输出 1.14 Full 与 1.13 兼容变体，分别通过官方核心检查。另确认 Passwall / Passwall2 的 fused `.srs` 只适用于 sing-box 后端；Xray 不会加载这些引用，Passwall2 还可能产生宽匹配，安装门禁修复由主线程负责。

## 来源、缓存与时效

- 截止用户指定日期 2026-10-19。仅使用官方站点、官方 GitHub 发布元数据与源码；按 `prerelease` 标记分类，不按版本数字猜测稳定性。
- [sources.json](sources.json) 列出 105 个来源，[manifest.json](manifest.json) 保存抓取时间、有效 URL、固定 commit、HTTP 头和 SHA256；`bodies/` 为精确原始字节的 gzip，正文不是摘要重构。主线程独立复核后补存 6 份新旧嗅探动作的固定源码及 1.13.14 发布资产元数据。
- 当前 105 项全部获取成功。早期 403 / 网络失败记录仍保留在 `manifests/` 旧清单；随后使用已认证 `gh` 补全，未读取或输出 token。
- 固定版本源码使用 40 位 commit URL；浮动源码由缓存工具解析并记录固定 commit。官网无明确页面发布日期时，只记录获取时间，不假称文档发布或更新时间。
- 读回：`node tools/cache-official-docs.js --group docs/upstream/2026-10-19/singbox --verify`；原文：同命令改用 `--read SOURCE_ID`。

## 版本与发布时间

以下时间为官方 API UTC。最近列表未见预发布，只代表本次返回范围。应用版本、独立核心版本与安装包实际携带版本分别核对。

| 产品 | 最新稳定 / Latest | 最新标记预发布 | 官方来源 / 缓存 ID |
| --- | --- | --- | --- |
| sing-box | 1.14.3；2026-10-09 05:35:00Z | 1.15.0-alpha.12；2026-10-11 06:13:25Z | [发布](https://github.com/SagerNet/sing-box/releases)，`singbox-releases-api` |
| Xray-core | v26.3.27；2026-03-27 17:51:11Z | v26.10.17；2026-10-17 15:32:34Z | [Latest](https://github.com/XTLS/Xray-core/releases/latest)、[预发布](https://github.com/XTLS/Xray-core/releases/tag/v26.10.17)，`xray-releases-api` |
| v2rayN | 7.25.6；2026-10-11 05:59:58Z | 7.25.5；2026-10-05 08:55:29Z，早于稳定版 | [发布](https://github.com/2dust/v2rayN/releases)，`v2rayn-releases-api` |
| Passwall | 26.10.16-2；2026-10-16 13:53:39Z | 最近 30 条未见 | [发布](https://github.com/Openwrt-Passwall/openwrt-passwall/releases)，`passwall-releases-api` |
| Passwall2 | 26.10.1-2；2026-10-02 07:37:18Z | 26.9.9-2；2026-09-09 05:44:31Z，早于稳定版 | [发布](https://github.com/Openwrt-Passwall/openwrt-passwall2/releases)，`passwall2-releases-api` |
| Hiddify app | v4.1.1；2026-03-05 17:22:57Z | 已发布的 `draft` prerelease；2026-10-04 22:55:29Z | [发布](https://github.com/hiddify/hiddify-app/releases)，`hiddify-app-releases-api` |
| hiddify-core | v5.0.3；2026-10-18 14:30:46Z | 最近 30 条未见 | [发布](https://github.com/hiddify/hiddify-core/releases)，`hiddify-core-releases-api` |
| HomeProxy | 官方 releases API 为空，不能命名 stable/prerelease；源码快照 fadaa676104f59ff6ace480a780a258d846d0aec，提交于 2026-10-02 07:58:18Z | 同左 | [官方仓库](https://github.com/immortalwrt/homeproxy)，`homeproxy-releases-api` / `homeproxy-commit` |

没有安装用户 App 或读取其设备核心，以上不是设备现状。

## sing-box

### 官方边界与原错误

1.14.3 的固定 commit 为 `7054cac5124465ffdb145870d7c01885566711b1`；1.13.14 为 `25a600db24f7680ad9806ce5427bd0ab8afe1114`。固定源码缓存包括 `singbox-option-dns`、`singbox-option-inbound`、`singbox-option-rule-set`、`singbox-113-rule-set`。

| 原字段 / 旧说法 | 当前官方证据 | 本地处理 |
| --- | --- | --- |
| 非标准顶层 `_meta` | 1.14.3 实际 check 报 unknown field | 元信息移到生成器常量、README、CHANGELOG |
| legacy DNS `address` / `address_resolver` | [typed HTTPS server](https://sing-box.sagernet.org/configuration/dns/server/https/) 自 1.12 引入；1.14 源码明确移除旧格式 | 两变体共用 `type: https`、`server`、`path`、`domain_resolver` |
| inbound `sniff` / `sniff_override_destination` | [迁移](https://sing-box.sagernet.org/migration/#migrate-legacy-inbound-fields-to-rule-actions) 与源码明确 1.13 移除 | 前置非终结 `action: sniff`，保留业务路由次序 |
| 迁到 `http_client` 后兼容 1.11–1.13 | [rule-set](https://sing-box.sagernet.org/configuration/rule-set/#http_client) 明确该字段自 1.14 引入；1.13 实际报 unknown field | 原说明错误；Full 用命名 HTTP client，1.13 变体用 `download_detour` |
| 废弃 `download_detour` 意味旧核心也不能用 | 同页明确 1.14 废弃、计划 1.16 移除 | 仅在版本明确的 1.13 兼容产物保留 |
| Block outbound 已移除 | 当前 [Block](https://sing-box.sagernet.org/configuration/outbound/block/) 无废弃标记；1.14.3 最小配置与最终配置 check 均成功 | 保留 `REJECT` 组成员功能，不照搬旧摘要 |
| DNS GeoIP 接受过滤 | [1.14 响应匹配迁移](https://sing-box.sagernet.org/migration/#migrate-address-filter-fields-to-response-matching) | Full 用 evaluate → match_response → respond；1.13 保持该系列合法表达 |

原始失败见 [baseline-1.14.3-check.txt](baseline-1.14.3-check.txt) 与 [baseline-1.13.14-check.txt](baseline-1.13.14-check.txt)。[verification.json](verification.json) 保存逐层隔离结果：去 `_meta` 后暴露旧 DNS；迁 DNS 后暴露旧 inbound；1.13 两者迁完后暴露 `http_client`。未启用任何废弃兼容环境变量。

### 采用、推迟与本地字段

- [Full](../../../../SingBox/SingBox(sing-box)-full.json) 最低目标 1.14.3：顶层命名 `http_clients`，全部远程规则引用 `rules-download`，出口仍为 `🌍 全球节点`；`route.default_domain_resolver` 显式指向直连 DNS，避免占位节点域名解析依赖隐式规则。
- [1.13 兼容 JSON](../../../../SingBox/SingBox(sing-box)-1.13.json) 以官方 1.13.14 验收：没有 1.14 专属 HTTP client / DNS response 字段，规则下载使用合法 `download_detour`。
- 同一 [生成器](../../../../SingBox/SingBox(sing-box)-generator.js) 按明确 schema 分支输出，版本 `v6.0.20-sing.10`。旧 97 条业务规则内容和相对次序不变，增加前置非终结嗅探后共 98 条。
- Full 先对原直连解析结果执行 `evaluate`，仅 CN IP 用 `match_response` / `respond` 返回，否则继续旧广告判断及代理兜底。1.13 保持旧 GeoIP 接受过滤；两个变体 DNS server 完全一致。
- 1.14 稳定文档的 `optimistic`、DNS `race` / `speculative` 可能改变查询量、延迟和缓存新鲜度，当前缺业务需求与测量，暂不启用。
- 1.15 新 TUN stack 与 `stack` 废弃来自预发布/实时文档，保留 stable 1.14 的 `stack: mixed`，不把 alpha 要求施加到稳定配置。
- 1.14.3 / alpha.12 的短 release notes 仅说明 fixes/improvements，不编造具体新增协议；字段引入版本依固定 stable 文档及源码。

### 嗅探迁移的行为边界

独立复核确认：1.14.3 的 `option/rule_action.go` 中新 RouteActionSniff 只允许 sniffer/timeout，`route/rule/rule_action.go` 构造动作时不设置旧 OverrideDestination；`route/route.go` 只有该内部值为 true 才改写目的地址。1.13.14 同样如此。因此新动作保留 SNI/HTTP Host 供规则匹配，但目的为 IP 的连接仍拨原 IP，不能再声称旧 `sniff_override_destination=true` 的代理端重新解析效果完整保留。旧/污染 IP 的实际影响需要目标网络验证。

`route-options.override_address` 是固定地址字符串，经 ParseSocksaddrHostPort 解析后直接代入，不提供动态引用嗅探域名的模板；`resolve` 也不能冒充这种目的重写。本次采用上游支持的 sniff，不添加未知配置或伪造兼容开关。该差异是上游移除旧字段后的迁移限制，已写入 README/REFERENCE。

证据：[1.14.3 options](https://github.com/SagerNet/sing-box/blob/7054cac5124465ffdb145870d7c01885566711b1/option/rule_action.go)、[动作构造](https://github.com/SagerNet/sing-box/blob/7054cac5124465ffdb145870d7c01885566711b1/route/rule/rule_action.go)、[路由执行](https://github.com/SagerNet/sing-box/blob/7054cac5124465ffdb145870d7c01885566711b1/route/route.go)，以及对应 1.13.14 固定 commit `25a600db24f7680ad9806ce5427bd0ab8afe1114`；缓存 ID 为 `singbox-114/113-sniff-options/construction/routing`。

### 实际验证

[verification.json](verification.json) 保存核心版本、可执行文件 SHA、产物 SHA、退出码及对比结果。

- 官方 1.14.3 amd64 ZIP SHA256：`d8b86ef58936dba9230ec6a57ffa4243933f3c14ef4809828b6c553440ed1518`，等于官方 asset digest（`singbox-stable-api`）。
- 1.13.14 缓存 ZIP SHA256：`f580782c6dd10f7691c66cea1d7c421813c5fbf7e305d1ee7ce0c3a40d196341`，与 `singbox-113-release-api` 的官方 asset digest 一致；独立比较 ZIP 内唯一 exe 与实际测试 exe 的 SHA256 完全相同。
- Full → 官方 1.14.3 check、兼容版 → 官方 1.13.14 check 均退出 0；专属 [schema 测试](../../../../tools/tests/singbox-current-schema.test.js) 4 项通过、0 跳过。
- 原出站拓扑逐项不变；原 97 条业务路由逐项等于新 Full 去除 sniff 后的序列。
- 两变体出站、路由、85 个规则集的 URL/标签/格式/间隔、8 个 DNS server 均相同，仅明确 schema 与 DNS 响应表达不同；54 个 selector/urltest 保留。
- check 证明解析和构造，不证明节点连接、远程下载、TUN 启动或 DNS 成功/失败路径实测。未启动 VPN 或修改设备网络。

## Xray 与 v2rayN

[Xray 稳定 v26.3.27](https://github.com/XTLS/Xray-core/releases/tag/v26.3.27) 含 Hysteria2 入站/传输、Finalmask、ECH 行为与路由 webhook 等。它们属于核心协议或可选行为；本仓库是原生路由数组，没有相应节点/传输/webhook需求，故不添加这些字段。最新 v26.10.17 标记预发布，正文没有支持本仓库新路由能力的具体条目，不推断增加远程 SRS。

[官方 RuleObject](https://xtls.github.io/config/routing.html#ruleobject) 使用 `domain` / `ip` / `process` / `outboundTag` 等字段，不定义 sing-box remote `.srs`。本地 [v2rayN(xray).json](../../../../v2rayN/v2rayN(xray).json) 继续从融合 source JSON 展平成原生字段，未改变内容或目标。

[v2rayN 7.25.6](https://github.com/2dust/v2rayN/releases/tag/7.25.6) 明确支持并限制 sing-box 1.14，另有 App 侧 Mux、订阅自定义 HTTP 头、MASQUE 与 Xray 格式更新。采用其支持的原生自定义配置路径，不把 App UI 字段混入路由数组。发布说明引用 Xray v26.10.10，不能证明每个平台每个包都携带相同核心；`v2rayn-core-info` 原文显示核心分别管理下载和启动。

本次未运行 v2rayN UI 导入、Xray 流量或巨大原生列表性能测试。稳定/预发布与格式边界已写入 [REFERENCE-xray.md](../../../../v2rayN/REFERENCE-xray.md)。

## Passwall / Passwall2

### 官方固定源码

Passwall 26.10.16-2 固定 `d8ec3c81988d775ba16ade9059cd972d5d5b8bc0`；Passwall2 26.10.1-2 固定 `5901e5fea7e19dfd4219cc72513957c266587680`。缓存分别含 UI、sing-box/Xray 后端生成器、节点类型表单、Makefile、app.sh与init源码。

| 路径 | 实际行为 | 本仓库 SRS 影响 |
| --- | --- | --- |
| UI shunt_rules.lua | 接受 rule-set:remote/local，说明文字限定 sing-box | UI 保存成功不能证明 Xray 消费成功 |
| sing-box util_sing-box.lua | 按 .srs/.json 生成 route.rule_set 并引用标签 | 支持；仍需版本、资产可达性和设备验收 |
| Passwall util_xray.lua | 域/IP列表显式跳过 rule-set:/rs:；只剩 network 且无 protocols 时不生成预期规则 | 分流失效 |
| Passwall2 util_xray.lua | 同样跳过，空列表归 nil 后仍有插入无域/IP条件规则的分支 | 配合本地 network=tcp,udp 可能成为宽匹配 |

官方链接：[Passwall sing-box](https://github.com/Openwrt-Passwall/openwrt-passwall/blob/26.10.16-2/luci-app-passwall/luasrc/passwall/util_sing-box.lua)、[Passwall Xray](https://github.com/Openwrt-Passwall/openwrt-passwall/blob/26.10.16-2/luci-app-passwall/luasrc/passwall/util_xray.lua)、[Passwall2 Xray](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/26.10.1-2/luci-app-passwall2/luasrc/passwall2/util_xray.lua)。可用缓存 ID `passwall-singbox` / `passwall-xray` / `passwall2-xray` 独立读回。

### 核心约束与采用决策

真实分流节点为 UCI nodes section，`protocol='_shunt'`，`type='sing-box'` 或 `type='Xray'`。两者当前 app.sh从 `@global[0].node` 读取全局节点；Passwall还有ACL独立node入口。仅检查二进制已安装或旧tcp_node/udp_node不足以证明当前后端。

官方 Makefile选择软件包而未固定单一内核版本。Passwall新生成器按实际核心版本选择HTTP clients；Passwall2稳定SRS路径仍可使用implicit下载client。LuCI release号不能代替已安装核心能力。

本地 `tools/generate-fused-fallback-artifacts.js` 和两个apply.sh写入SRS引用，并未展平为Xray列表。必要适配为任何UCI写入前核验实际分流节点并拒绝Xray。根因已交主线程，脚本与测试由主线程负责，本报告不替其宣称OpenWrt设备已验收。

不因上游发版无需求扩出巨大Xray shunt列表；需要Xray应使用对应原生规则路径，或另外明确实现并验收转换。两份REFERENCE已更正后端边界，保留的旧摘要标明未整篇当前化。

## SFA / SFI / SFM 官方客户端

两份官方 App 源码仓库的 releases API 均为空（缓存 `sfa-releases-api` / `apple-releases-api`），README 指向 SagerNet 的客户端文档。版本发布资产实际集中于主 sing-box release：缓存 `singbox-stable-api` 中包含 `SFA-1.14.3-*.apk`、`SFM-1.14.3-*.pkg` 与越狱版 `SFI-1.14.3-iphoneos-*.deb`。这些明确命名的 GitHub 资产与主 1.14.3 同版，不能因此推定所有商店已安装版本同版。

[Android 官方文档](https://sing-box.sagernet.org/clients/android/) 声明 Android 5.0+，主 release 另有 legacy-android-5 构建；[Apple 文档](https://sing-box.sagernet.org/clients/apple/) 声明 iOS 15+ / macOS 13+ / tvOS 17+，并分别列 App Store、TestFlight、越狱包和 macOS standalone 渠道。SFA 可管理本地/远程配置，Apple 客户端也提供该入口；是否满足本仓库 1.14.3 字段门槛仍看实际核心。

采用现有原生 JSON 路径，补明 OS 与核心两个门槛；未查询区域商店实时版本、TestFlight 内部构建或设备安装状态，不将源码仓库空 releases 填成不存在的独立最新版。对应官网与 README 原文已缓存 `sfa-client-doc` / `apple-client-doc` / `sfa-readme` / `apple-readme`。App UI 与 TUN 实际运行仍待设备验收。

## Hiddify

### App与核心分别固定

Hiddify app4.1.1固定源码 `abbd671bf6bf05195acd4158c714bff267cada8f` 的 `dependencies.properties` 为 `core.version=4.1.0`；Makefile在prod下载该版本，在dev下载可变draft（缓存 `hiddify-app-dependencies` / `hiddify-app-makefile`）。旧hiddify-next-core仓库名会重定向，不能另造一个核心产品。

App gitlink固定hiddify-core `c9d6f0f00b2eda34e4fb71863e4e0a62b3e931a0`，核心再固定fork `0a02b7729f6a211436bb8bdcd8696c283eb27767`。go.mod请求sing-box1.13.0且本地replace；fork规则集选项只有download_detour。故按1.13派生schema提供兼容变体，不把require行当成未修改上游二进制版本。

独立hiddify-core5.0.3固定 `00a84b00faaed68146ce6a32bf968c5cf7089447`，fork gitlink为 `5e94a4e6acf7907755f3a8588ce619d2c29b3f06`，源码已具备新HTTP client与1.14旧DNS移除逻辑（`hiddify-new-rule-set` / `hiddify-new-dns`）。发布正文无详细特性清单，constant/version.go为编译期填充的unknown，不能据此虚构精确上游版本或称App4.1.1已同步升级。

App draft是已发布prerelease，其dev核心下载可变。未分析各平台App artifact，不能仅据dependencies文件证明实际携带核心，不推荐用此推断覆盖stable配置。

### 完整配置导入限制

固定stable核心parser.go只有完整配置条件满足时保留全输入，否则仅提取outbounds/endpoints。成功解析不保证route/dns保留，App最终入口和覆盖仍需实际验证（缓存 `hiddify-core-parser` / `hiddify-core-builder`）。

因此README指向1.13兼容JSON并要求核对完整模式及最终配置。官方1.13.14 check是schema证据，不冒充Hiddify App端到端成功；旧说明中自动保留所有组、TUN留删均可、订阅自动填充等无充分依据的承诺已撤除。

官方来源：[稳定App](https://github.com/hiddify/hiddify-app/releases/tag/v4.1.1)、[独立核心](https://github.com/hiddify/hiddify-core/releases/tag/v5.0.3)、[App依赖](https://github.com/hiddify/hiddify-app/blob/v4.1.1/dependencies.properties)、[固定解析器](https://github.com/hiddify/hiddify-core/blob/c9d6f0f00b2eda34e4fb71863e4e0a62b3e931a0/v2/config/parser.go)。

## HomeProxy

官方无GitHub release。HomeProxy Makefile只依赖+sing-box，未锁核心版本；另缓存的ImmortalWrt packages配方在本次快照指定1.14.3，这证明配方状态，不能证明所有固件分支或设备已更新。

固定源码generate_client.uc从UCI node/routing_node/routing_rule/dns_server/dns_rule构造配置；update_subscriptions.uc解析URI/SIP008节点，不能证明任意Full JSON订阅会保留整个route/dns。因此撤除旧README一键导入全部组的承诺。

采用：明确HomeProxy为ImmortalWrt维护的LuCI插件，配置需按UCI路径迁移并检查最终输出；不新增未验证转换器。原生sing-box独立运行JSON的服务/防火墙管理属于另一条路径。未做OpenWrt设备UI、firewall或transport验收。

官方来源：[仓库](https://github.com/immortalwrt/homeproxy)、[客户端生成器](https://github.com/immortalwrt/homeproxy/blob/fadaa676104f59ff6ace480a780a258d846d0aec/root/etc/homeproxy/scripts/generate_client.uc)、[订阅解析器](https://github.com/immortalwrt/homeproxy/blob/fadaa676104f59ff6ace480a780a258d846d0aec/root/etc/homeproxy/scripts/update_subscriptions.uc)。

## 交付与缺口

### 二次核验：普通节点类型与测试接线

Passwall 的合法普通节点不一定保存 `protocol`：Socks 类型源码明确删除该字段，运行生成器再按类型补协议。因此安装预检先严格读取 `type`；仅对 sing-box/Xray 检查其 `protocol` 是否为 `_shunt`，已确认的普通类型不要求该字段。未知类型、读取失败、没有分流节点或含 Xray 分流均在任何写入前拒绝。固定源码补存为 `passwall-type-0-socks`、`passwall-type-3-ss-rust`、`passwall-type-4-ssr`、`passwall-type-5-hysteria2`、`passwall-type-6-naive`、`passwall2-type-3-ss-rust`、`passwall2-type-4-ssr`；依据：[Passwall Socks](https://github.com/Openwrt-Passwall/openwrt-passwall/blob/d8ec3c81988d775ba16ade9059cd972d5d5b8bc0/luci-app-passwall/luasrc/model/cbi/passwall/client/type/0_socks.lua)、[Passwall2 SS-Rust](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/5901e5fea7e19dfd4219cc72513957c266587680/luci-app-passwall2/luasrc/model/cbi/passwall2/client/type/3_ss-rust.lua)。

两版 JSON 均纳入自动刷新合同。CI 校验官方文档缓存，并下载、核对官方 SHA-256 后用 1.14.3 / 1.13.14 实际执行 schema 检查；显式设置错误核心路径必须失败，不能静默跳过。真实 shell 测试覆盖合法普通节点、混合 Xray 分流及零写入失败场景。

本组修改SingBox生成器、两个JSON、README、CHANGELOG、四份REFERENCE、专属schema回归及本目录证据；未改规则源、业务目标和融合内容，未操作git index或提交推送。主线程负责共享验证与Passwall安装门禁。

已完成：原文缓存和hash读回、版本/核心边界核验、错误逐层复现、双schema修复与官方check、原出站/路由序列比较。待设备验收：真实节点、首次远程下载、DNS成功/失败路径、TUN；Hiddify/v2rayN最终配置与连接；Passwall/PW2实机流量；HomeProxy UCI转换。
