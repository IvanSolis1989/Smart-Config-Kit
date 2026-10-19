# Mihomo 生态官方版本与适配核对（2026-10-19）

本次发现并修复两类确定失配：Smart 产物继续输出已移除的 `strategy: sticky-sessions`，以及 OpenClash 文档把完整 Shell 脚本当成普通 INI 覆写模块部署。另纠正了把 MetaCubeX Alpha 当成 Smart 内核、把模型地址写成 `lgbm-custom-url` 的使用说明。没有证据支持为追逐新版本改变全局 DNS、TUN 默认值、策略组或规则源。

研究基线：仓库 `079b546`；规则权威 `rulesets/source/routing-graph.js` v6.0.20。原始材料抓取日期为 2026-10-19，精确时间见 [manifest.json](manifest.json)。本地命令遵循 powershell-local-guard；没有安装客户端、更新用户设备或下载内核二进制。

## 证据与版本口径

57 项官方原始响应保存在 `bodies/<SHA256>.gz`，包括完整 GitHub release JSON（每库最多最近 30 条）、官方配置页 HTML、带 commit 的源码与核心版本文本。压缩前字节、压缩体、URL、抓取时间、HTTP 状态及头部均由 manifest 记录；这是原文缓存，不是把本报告当成原文。复核结果为 [57/57](cache-verification.txt)。

```text
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --verify
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --read smart-group-source
```

`sources.json` 的 `id` 对应 manifest 的原始正文。发布的 `prerelease` 标志与稳定版分开记录；滚动 release 的创建/发布时间可能多年未变，不能把它当成当前构建时间。下表日期均为 UTC；“最新”限本次官方公开 release 和滚动资产快照，不代表商店各地区分发或任意设备已安装版本。

| 产品 | 当前稳定发布 | 预发布/滚动渠道 | 来源与关键边界 |
|---|---|---|---|
| MetaCubeX/mihomo | [v1.19.32](https://github.com/MetaCubeX/mihomo/releases/tag/v1.19.32)，2026-09-30 17:09:36 | [Prerelease-Alpha](https://github.com/MetaCubeX/mihomo/releases/tag/Prerelease-Alpha)，版本文本 `alpha-94b13ae`；资产最新更新 2026-10-13 14:27:14 | `mihomo-releases` / `mihomo-alpha-version`；滚动发布时间 2024-08-12 是旧 release 创建时间 |
| vernesong/mihomo Smart | 官方公开列表没有非 prerelease 的稳定版 | [Prerelease-Alpha](https://github.com/vernesong/mihomo/releases/tag/Prerelease-Alpha)，`alpha-smart-83e67d0`，资产更新 2026-10-14 00:28:36；[模型](https://github.com/vernesong/mihomo/releases/tag/LightGBM-Model)资产更新 2026-08-26 11:41:19 | `smart-releases` / `smart-alpha-version`；Smart 核心与模型都不是 MetaCubeX stable |
| Clash Party | [v2.0.4](https://github.com/mihomo-party-org/clash-party/releases/tag/v2.0.4)，2026-10-18 12:17:04 | [dev](https://github.com/mihomo-party-org/clash-party/releases/tag/dev)是旧 2.0.3 开发构建，资产更新 2026-09-22；比当前 stable 更旧 | `party-releases`；旧 `mihomo-party-org/mihomo-party` API 已重定向至 `mihomo-party-org/clash-party` |
| CMFA | [v2.11.35](https://github.com/MetaCubeX/ClashMetaForAndroid/releases/tag/v2.11.35)，2026-09-30 16:59:35 | [Prerelease-alpha](https://github.com/MetaCubeX/ClashMetaForAndroid/releases/tag/Prerelease-alpha)，2026-10-11 05:29:38 | `cmfa-releases`；稳定 App gitlink 是 Mihomo `88dcbf7f1614a67c3b36b848ee3592dfa92ada36`，与本次 v1.19.32 源码解析到同一 commit |
| OpenClash | [v0.48.002](https://github.com/vernesong/OpenClash/releases/tag/v0.48.002)，2026-10-12 03:40:07 | 近 30 条有历史 v0.47.071 prerelease（2026-03-13），不是比当前 stable 更新的候选 | `openclash-releases`；插件号不等于用户选中的 `clash_meta` 内核号 |
| FlClash | [v0.9.1](https://github.com/chen08209/FlClash/releases/tag/v0.9.1)，2026-10-17 10:24:48 | 最近 30 条公开 release 没有 prerelease，未据此声称全历史不存在预发布 | `flclash-releases`；核心 gitlink 为 `chen08209/Clash.Meta` 的 `8380d0e7462f061a964323e9bf3129a236fcc5d5` |
| ClashMi | [v1.0.31.1703](https://github.com/KaringX/clashmi/releases/tag/v1.0.31.1703)，2026-10-09 04:51:17 | [v1.0.32.1800](https://github.com/KaringX/clashmi/releases/tag/v1.0.32.1800)，2026-10-19 05:26:29 | `clashmi-releases`；不能将该 App 号认作内置 Mihomo 号，iOS 商店版本未单独验证 |
| ShellCrash（原 ShellClash） | [1.9.4](https://github.com/juewuy/ShellCrash/releases/tag/1.9.4)，2026-02-15 11:33:00 | 公开 release 中标为 prerelease 的 `clash.premium.latest` 是历史内核压缩资产，不是当前脚本的新版候选 | `shellcrash-releases`；核心可以独立选仓库、分支和构建标签，脚本 release 不证明 core 版本 |
| Clash Verge Rev | [v2.5.8](https://github.com/clash-verge-rev/clash-verge-rev/releases/tag/v2.5.8)，2026-10-09 02:43:45 | [autobuild](https://github.com/clash-verge-rev/clash-verge-rev/releases/tag/autobuild)正文为 2.5.9，资产名含 `autobuild.1018.7965711`，最新资产更新 2026-10-17 22:39:44；最新编号 RC 为 v2.5.4-rc.2（2026-09-20） | `verge-releases-api`；`updater-alpha` 是更新元数据资产，不能当内核/客户端新版 |

## 逐项适配决定

### MetaCubeX/mihomo

v1.19.32 新增 load-balance 的入站用户 `hash-key`，默认 IP 栈调整为 `mips`，并支持 TUN `congestion-controller`；同时修复 TCP MSS、AnyTLS、OpenVPN、EasyTier 等问题。Alpha 另含 DoH 拨号约束、重载保留 fake-ip 分配状态、亚毫秒 URL 测速和 dialer-proxy 循环检查修复。这些 Alpha 修复已列在官方滚动发布正文，尚不能宣传为 v1.19.32 已发布功能。[稳定记录](https://github.com/MetaCubeX/mihomo/releases/tag/v1.19.32)、[Alpha 记录](https://github.com/MetaCubeX/mihomo/releases/tag/Prerelease-Alpha)。

本仓库 Mihomo 普通版与 CMFA 采用 `url-test` / `select`，没有新增 load-balance 的业务需要；本次不增加 `hash-key`。CMFA YAML 没有顶层 `tun:`；Clash Party 的 TUN 仍由 GUI 合并，FlClash 脚本不写 TUN。默认栈变化不构成跨设备强制 `mips` 或启用 GSO 的依据。没有设备吞吐/延迟对照，本次不作性能收益结论。

已缓存 [DNS](https://wiki.metacubex.one/config/dns/)、[组](https://wiki.metacubex.one/config/proxy-groups/)、[规则集](https://wiki.metacubex.one/config/rule-providers/)、[代理集合](https://wiki.metacubex.one/config/proxy-providers/)、[路由规则](https://wiki.metacubex.one/config/rules/)、[TUN](https://wiki.metacubex.one/config/inbound/tun/)与[嗅探](https://wiki.metacubex.one/config/sniff/)完整原文，分别为 `mihomo-dns/groups/rule-providers/proxy-providers/rules/tun/sniffer`。DNS 页面标注 2026-07-18；本次抓取不证明该日后又修订过。

字段对照：CMFA 的 `dns.respect-rules: true` 配有非空 `proxy-server-nameserver`；JS/Ruby 的私有节点 policy 只写活动节点域名，满足 `proxy-server-nameserver-policy` 依赖非空节点解析器的条件；JS 保持 `fake-ip-filter-mode: blacklist` 并清洗继承项。分组 `use`、`include-all-proxies`、`filter`、`exclude-type` / `empty-fallback` 与稳定源码 `mihomo-stable-groupbase` 对照，不改既有筛选边界。MRS 继续仅承载 domain/ipcidr，classical 残余保留生成链路。

### vernesong Smart

已用版本文本与固定 commit [SmartOption](https://github.com/vernesong/mihomo/blob/83e67d0c4415b1114f9e01d8e9a00133caf89f6c/adapter/outboundgroup/smart.go#L89-L96)核对：支持 `policy-priority`、`uselightgbm`、`collectdata`、`sample-rate`、`prefer-asn`、`tolerance`，没有 `strategy`。[官方指南](https://github.com/vernesong/OpenClash/releases/tag/mihomo)的 2025-11-12 记录也明确移除该选项。该旧指南的训练库版本说明早于 2026-08-26 模型发布；模型 release 已说明支持 LightGBM v4.x，本次没有训练或改模型。

修复 `Clash Party/ClashParty(mihomo-smart).js` 的 `upsertSmartGroup` 和 `OpenClash/OpenClash(mihomo-smart).sh` 的 Ruby 组构造，删除遗留 `sticky-sessions` 字段。保留 `uselightgbm: true`、`collectdata: false`、`tolerance: 30`，不虚构会话固定保证。JS 升到 v6.0.20-dns.20，OpenClash Smart 升到 v6.0.20-oc-smart.15；源图没有该字段，主版本 v6.0.20 保持。

同构范围检查覆盖 Clash Party Smart/Normal、CMFA、Stash、OpenClash Normal/Smart、FlClash、Shadowrocket、Surge、Loon、QX、Egern、SingBox、v2rayN、Passwall/Passwall2：只有前述两份产物构造 Smart 组；其他运行时筛选器使用 url-test/平台正则或静态出站，没有这个 Smart 参数。普通 load-balance 的 `strategy` 仍是另一种合法字段，未做全库删除。

### Clash Party

2.0.4 增加简易模式、DNS 保护开关和仅关闭当前组连接的选项；修复唤醒后的 TUN 配置、启动等待代理集合和配置模式同步。[发布说明](https://github.com/mihomo-party-org/clash-party/releases/tag/v2.0.4)。这些是 App 行为，不是新的 routing-graph 规则。

固定 tag 的 `party-factory` 显示：原始订阅 DNS guard → 普通覆写 → 规则覆写 → Smart 覆写 → 合并受控配置；`disableDnsOverrideGuard` 默认 false，但用户可以关闭保护。`party-dns-guard` 检查原始订阅三个 DNS policy 字段；关闭 App DNS 覆写后，仓库 JS 自身仍可生成 DNS。采用决定：保留本仓库现有 DNS 边界诊断，不把 guard 提示当成 JS 失败，也不默认关闭新保护。用户最终选择的 `controlDns`、DNS 保护开关、TUN 路由需在实际 App 配置读回核实。

`party-core-prepare` 分别下载 MetaCubeX stable、MetaCubeX Alpha 与 vernesong Smart，App v2.0.4 不代表三种核心都是同版。文档已纠正仓库重命名、Smart 选择和当前 `lgbm-url` 字段。本次没有运行 2.0.4 的完整 GUI 导入或唤醒测试。

### CMFA

稳定版 release 的可见变化是 Android TV 焦点修复与依赖更新；预发布新增 URL 配置二维码分享。`cmfa-tree` 和 `.gitmodules` 保存了真正的核心 gitlink，避免根据 go.mod 的历史 require 版本误判（该模块实际被 replace 到子模块）。[官方仓库](https://github.com/MetaCubeX/ClashMetaForAndroid)。

本地 `Clash Meta For Android/CMFA(mihomo).yaml` 继续消费融合 MRS、已有 DNS 与 `url-test` 区域组；不加入 Smart/LightGBM 或 App 分享字段。TUN 继续交给 Android VPN，未把桌面栈默认变化搬进 YAML。对规则/DNS 兼容性的证据是文档与稳定内核源码，未用 Android 设备证明本次 App 导入、内存峰值或 VPN 接管。

### OpenClash

0.48.002 增加插件/内核 SHA 校验、Ruby 加载优化、覆写模块安全限制及 TUN GSO/MIPS 默认值，并带 Google Play、Tailscale、WiFi Calling 内置模块。[发布说明](https://github.com/vernesong/OpenClash/releases/tag/v0.48.002)。本仓库没有直接采用新的 TUN 默认或这些额外规则模块，以免改变源规则语义。

`openclash-overwrite-guide` 说明普通模块必须有 INI 段头，[YAML] 合并与 [Overwrite] 的 `ruby_*` 调用受新解析/AST 限制。仓库两份 `.sh` 是完整 Shell/Ruby 脚本，没有这些段头；旧 README 推荐把它们注册为普通模块，存在被忽略的确定路径。`openclash-init` [3849–3855 行](https://github.com/vernesong/OpenClash/blob/e553e82e01c697aefbe1555261a503f425e00ccd/luci-app-openclash/root/etc/init.d/openclash#L3849-L3855)仍直接执行固定 `/etc/openclash/custom/openclash_custom_overwrite.sh` 并传配置路径。

采用决定：修正 README 为先备份再上传到固定入口、赋执行权限并重启插件；删除普通模块的错误 UCI 注册步骤。现有直接运行 Ruby 临时脚本的结构不需要为了模块白名单重写。Smart 参数清理与上述入口修正分别有独立证据。实际路由器的 OpenWrt/bash/Ruby、重启日志及最终配置未在本次设备验收。

### FlClash

0.9.0 的 DNS/NTP 按键覆写延续到 0.9.1；0.9.1 将桌面 TUN 改成仅覆盖用户选中的键，未选键遵循 profile，并修复大配置崩溃、核心下载 CA 和系统代理问题。[0.9.1](https://github.com/chen08209/FlClash/releases/tag/v0.9.1)、[0.9.0](https://github.com/chen08209/FlClash/releases/tag/v0.9.0)。

`flclash-setup` 的 getProfile 先执行 `handleEvaluate`，随后 `flclash-task` 合并 TUN、DNS、NTP 与 App patch：TUN 组合原配置、默认 dns-hijack、选中覆盖键和运行时 coreJson；DNS 合并选中键后仍可能追加系统 DNS。因此用户选择的覆盖键可能改变脚本输出，脚本单独成功不等于最终配置一致。

本地 `FlClash/FlClash(mihomo).js` 保持端口/TUN 由 App 管理、DNS/Sniffer 基线由脚本生成；不添加 Smart 字段、不强制为所有设备改 TUN 栈。参考头已记录当前核心实际是 chen08209 的 FlClash 分支 gitlink，不能笼统等同于最新 MetaCubeX stable。需要在 0.9.1 各平台读回最终选中键和 DNS，尚无本次设备证据。

### ClashMi

稳定版更新 Flutter/依赖并修复拖拽排序，预发布新增 TrayManager 适配和 Android 通知权限提示；这些没有产生新的路由字段要求。[官方 release](https://github.com/KaringX/clashmi/releases)。

本次缓存的[官方 FAQ](https://clashmi.app/guide/faq)明确：内置核心会转换 geosite/geoip 为 geo ruleset，iOS 不支持 IP-ASN 数据库，不能从面板独立更新核心；覆写顺序是自定义覆写叠订阅后再叠内置覆写。TUN 可由界面覆写，也可关闭覆写后使用订阅配置。因此“所有 TUN 永远只能由 App 托管”过于绝对，本仓库无 `tun:` 时才依赖 App 提供 VPN 配置。

采用决定：继续复用 CMFA YAML 和 MRS；本仓库没有 GEOIP/GEOSITE/IP-ASN 规则，不需要为了该核心差异另建客户端产物。内置 DNS/TUN 覆写、iOS 50 MB VPN 扩展内存和具体核心版本需要设备读回，App release/README 不足以确认。FAQ 无可读修订日期，本次仅确认抓取时的内容。

### ShellCrash

1.9.4 新增核心分支选择、单独 DNS 劫持端口、ECS 和自启检测，并重写启动/守护与流量过滤。[官方发布](https://github.com/juewuy/ShellCrash/releases/tag/1.9.4)。`shellcrash-core-update` 允许构建时选择核心仓库/分支/标签，故不能把脚本版号等同内置 Mihomo 版号，也不能把历史 `clash.premium.latest` 当成当前推荐核心。

`shellcrash-modify` 会重建 TUN/DNS、拼接自定义规则与覆盖 YAML；其 mix/route 模式还会写 CN provider/policy。直接下载 CMFA YAML 不代表这些字段在启动后保持不变。采用决定：仅复用 CMFA 作为 Mihomo 输入，在 ShellCrash 配置选择、覆写层和最终 `$TMPDIR/config.yaml` 对照后才能证明同策略；没有新增独立产物，也不把 OpenClash Shell hook 直接当成 ShellCrash hook。singbox 核心分支应使用 SingBox 产物。脚本渠道与设备实际 core 没有本次运行验收。

### Clash Verge Rev

2.5.8 修复多个 provider 的同名节点选择/测速、端口保存与运行值、macOS TUN 退出后 DNS 恢复等问题；autobuild 的 2.5.9 变动仍属预发布，包含导入非当前订阅触发重载等修复，不据此默认升级用户设备。[stable](https://github.com/clash-verge-rev/clash-verge-rev/releases/tag/v2.5.8)、[autobuild](https://github.com/clash-verge-rev/clash-verge-rev/releases/tag/autobuild)。

`verge-core-prepare` 在 stable tag 只显示 MetaCubeX stable / Alpha 下载来源，没有 vernesong Smart。README 已改成官方发行版本默认使用本仓库 Normal JS，不能靠切换 Alpha 获得 Smart。`verge-dns-source` 针对原始 profile 的 DNS policy 做指纹确认；`verge-enhance-source` 还会保护 GUI 管理的 TUN/DNS 字段。采用决定：保留现有正常 JS `main(config)` 入口，按[官方脚本指南](https://www.clashverge.dev/guide/script.html)导入，最终输出受 GUI 合并影响。无当前设备导入/内核版本读回；不宣称所有脚本键都能覆盖 GUI。

## 本次交付与验证

- 运行时仅修改两份 Smart 产物的无效参数与版本元数据；Normal/FlClash、规则源、生成资产和业务 DNS 未改。
- 使用说明修正 Smart 分支识别、模型字段及 OpenClash 部署入口；Clash Party/OpenClash CHANGELOG 同步，四份 REFERENCE 只追加本次核对范围与报告链接，保留历史摘要的日期边界。
- [Smart JS 验证](smart-validation.txt)：`groups=55 rules=168 providers=149`；官方缓存独立解压/哈希/URL 读回 [57/57](cache-verification.txt)；本组代码/文档 `git diff --check` 通过。
- 完整跨端验证由主线程整合后记录在总报告；本报告的官方 schema 核对与 JS 配置验证不替代实际 Smart 核心拨号、各 GUI 最终配置读回、OpenWrt 重启或移动端 VPN 验收。
