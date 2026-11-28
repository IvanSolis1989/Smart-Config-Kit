# Karing 官方兼容性依据

[English](REFERENCE-Karing.md) | **简体中文**


> 更新于 2026-11-28（上次复核 2026-11-09）。GitHub 稳定版为 11 月 19 日发布的 [1.2.26.2934](https://github.com/KaringX/karing/releases/tag/v1.2.26.2934)，[美国 App Store](https://apps.apple.com/us/app/karing/id6472431552) 于 11 月 25 日上架同一版本。GitHub [1.2.27.3001](https://github.com/KaringX/karing/releases/tag/v1.2.27.3001) 是预发布，涉及 iOS TUN 重连及 ECH 解析修复。官方指向 [Karing sing-box fork](https://github.com/KaringX/sing-box)，公开发布页未给出各安装包所用的内核提交。

> 更新于 2026-11-09：为 Issue #196 复核官方 main `accbdfc05a999eaa3526aadb0aea994b3eafb7f5`（2026-11-05，源码 1.2.26+2922）及最后公开的自定义导入实现。当前导入实现仍未公开，不能声称 1.2.25.2802 已由 JSON 修复。

> 核对于 2026-10-28：本次仅将 GoogleFCM 由下载更新归入 Google 服务；复核 [Karing 分流](https://karing.app/app-manual/diversion)，保持 App 托管选择与域名探测的能力边界，不把业务目标标签当作已导入 selector。不改变 DNS、fake-IP、嗅探、其他推送或节点组；未新增字段、最低版本或真机通过声明。

> 获取日期：2026-10-24。Karing 当前 main：`60cfb75daaabd179305a1e6c5201c35c91a63cf2`（2026-10-23）；源码版本 `1.2.26+2911`。当时最新稳定 Release 为 `v1.2.25.2802`（2026-09-10）。
> 本适配不是对上述版本的实机认证。Karing 与同团队的 Mihomo 客户端 Clash Mi 是两个 App。

## 当前官方文档

- [添加配置](https://karing.app/app-manual/add-profiles)：接受 Clash、sing-box 等订阅/配置输入。
- DNS 由 App 管理。[1.2.26.2925](https://github.com/KaringX/karing/releases/tag/v1.2.26.2925) 支持在 HTTPS 订阅 URL 中选填 `outbound-dns`。[1.2.26.2926](https://github.com/KaringX/karing/releases/tag/v1.2.26.2926) 修复私有 DNS 更新，并将 Clash `dns.proxy-server-nameserver` 设为最高优先级。这些字段属于订阅入口，自定义分流 JSON 使用独立的导入格式。[官方服务商说明](https://karing.app/en/provider-faq) · [App DNS 手册](https://karing.app/en/app-manual/dns)
- [自定义分流](https://karing.app/tutorial/custom-diversion)：远程 Rule Set 使用 `.srs` / `.json`。
- [自定义分流组编辑](https://karing.app/app-manual/diversion-rule-edit)：各分项单层 OR/AND；端口、域名、进程、Android 包名等平台能力。

## 当前源码可证实的入口

固定提交的仓库路径和入口：

- [`lib/screens/diversion_group_custom_screen.dart` L296](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/lib/screens/diversion_group_custom_screen.dart#L296)：独立选择 JSON，调用 `DiversionCustomRules.getFromFile()` 并进入导入确认；L367 起 `exportRules()` 导出 `diversion_rules_custom.json`。
- [`lib/screens/diversion_rules_custom_set_screen.dart` L207](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/lib/screens/diversion_rules_custom_set_screen.dart#L207)：仅接受 direct/block/urltest/currentSelected 常量，其他动作会在确认页被置为 `kNone`。L247 调用 `importRules()`。因此生成动作中不能填业务节点组名。
- [`lib/screens/diversion_group_custom_edit_screen.dart` L1178](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/lib/screens/diversion_group_custom_edit_screen.dart#L1178)：自定义 Rule Set 编辑入口硬校验 HTTPS 与 `.srs`/`.json`；L1252 起按扩展名记录 binary/source。这不能证明未公开的订阅解析器是否另有 MRS 转换能力。
- [`lib/screens/urltest_group_custom_screen.dart` L281](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/lib/screens/urltest_group_custom_screen.dart#L281)：另行管理节点组、节点 tags 和正则。原生分流 JSON 不提供该模型的一并导入。
- [`lib/app/modules/server_manager.dart` L1717](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/lib/app/modules/server_manager.dart#L1717)：节点配置导入通过 `AutoConfUtils.tryConvert()` 转成内部模型，分流由开关控制；L1786 起初始化分流动作时 DIRECT/BLOCK 单独映射，其他默认当前选择。这不是完整 sing-box 配置原样运行的证据。
- 当前 [`assets/datas/preset/cn.json`](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/assets/datas/preset/cn.json) 和 [`default.json`](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/assets/datas/preset/default.json) 展示顶层 `rules`、`name`、`switch`、`outbound` 及简单匹配字段。最小节选另存 `tools/fixtures/karing/official-preset-excerpt.json`，来源在同目录说明。

## 未公开代码与采用的保守 schema

当前 main 不含被调用的 `lib/app/utils/diversion_custom_utils.dart`、`auto_conf_utils.dart`、`singbox_config_builder.dart`。因此不宣称已审明当前完整订阅转换器，不宣称完整配置或嵌套节点组无损兼容。

最后可读的 [`diversion_custom_utils.dart`（2025-05-07）L32](https://github.com/KaringX/karing/blob/e3c19f1eb1225dbd48a4862f0983b82d0af8de69/lib/app/utils/diversion_custom_utils.dart#L32) 明确解析 `name/outbound/switch/or/rule_set` 等字段；L118 起读顶层 rules，L188 导入，L317 导出。字段依据包含历史代码，可能存在后续差异，最终以 App 导入读回为准。当前生成只使用该已知最小模型，不采用仅在新 UI 出现但未确认导入 schema 的 network/port_range 等字段。

## 复杂匹配的标准资产

复杂条件放在 sing-box [Headless Rule](https://sing-box.sagernet.org/configuration/rule-set/headless-rule/) 中，通过标准 [Source Format](https://sing-box.sagernet.org/configuration/rule-set/source-format/) version 3 提供。此标准支持逻辑 `type: logical`、`mode: and/or`、`invert`、端口、network 和进程条件；不允许嵌套 `rule_set` 引用，所以必须精确展开依赖 source。

5 个外部 QUIC support SRS 的 URL、取回时间、原二进制和解码/压缩哈希见 `rulesets/source/karing-support/manifest.json`。这些快照来自对应 URL 的实际 SRS，用已有标准核心解码，未用相似业务 fused 内容替代。未能表达为 headless 的匹配会终止生成，不静默丢弃。

规则集各行互为 OR 候选，复合规则保留多行结构及其在 NOT 中的语义。同一默认行可按域名或 IP 匹配目标，独立进程行是另一项候选。纯远程引用保留原 URL，由内核直接读取。

输入配置面向 sing-box 1.13。该版本会把外层已匹配的地址和端口字段组传入规则集的未反转分支。1.14 新版官方文档则说明，只有单条未反转的默认规则会与外层匹配合并。生成器遇到重叠字段组就拒绝转换，因为改成独立的 AND 子条件会丢失继承状态。目前 QUIC 的域名候选与外层端口、网络使用不同字段组。[1.13 匹配源码](https://github.com/SagerNet/sing-box/blob/v1.13.14/route/rule/rule_abstract.go#L74-L157) · [1.14 路由字段组](https://sing-box.sagernet.org/configuration/route/rule/#default-fields)

`no-resolve` 与先解析行为、资产下载及优先级仍需在 Karing 实际读回。生成的复合资产位于 `rulesets/generated/karing/`。


## Issue #196：自定义组可见，但远程资产未登记

1.2.26.2934 与 1.2.27.3001 的公开确认页都仍调用 `DiversionCustomRules.importRules()`，两个公开标签均缺少该实现。公开编辑保存路径仍会登记远程资产。用干净的 App 配置导入后，先检查一份 SRS 和一份 JSON 是否登记并下载，再检查重启及重复导入。如果缺失，可用不改内容直接保存作对照。[稳定版导入调用](https://github.com/KaringX/karing/blob/v1.2.26.2934/lib/screens/diversion_rules_custom_set_screen.dart#L244-L250) · [预发布版编辑保存路径](https://github.com/KaringX/karing/blob/v1.2.27.3001/lib/screens/diversion_group_custom_edit_screen.dart#L1253-L1265)

上一轮复核的 [编辑保存路径 L1252–1264](https://github.com/KaringX/karing/blob/accbdfc05a999eaa3526aadb0aea994b3eafb7f5/lib/screens/diversion_group_custom_edit_screen.dart#L1252-L1264) 会为每个 URL 建立 `type=remote`、`tag=URL`、`format=binary/source`、`url=URL` 项并登记到 `ruleSetItems`。因此“打开每组后直接保存才有下载”的反馈与此注册动作吻合。

最后公开的 [importRules L188–314](https://github.com/KaringX/karing/blob/e3c19f1eb1225dbd48a4862f0983b82d0af8de69/lib/app/utils/diversion_custom_utils.dart#L188-L314) 将 URL 复制到组，但没有相应注册。它的顶层解析器仅消费 `rules`；内部 [DiversionGroupConfig L198–258](https://github.com/KaringX/karing/blob/accbdfc05a999eaa3526aadb0aea994b3eafb7f5/lib/app/modules/server_manager.dart#L198-L258) 的 `rule_set_items` 属于另一模型，不能直接塞进自定义导入 JSON 就称为修复。当前完整配置转换器同样未公开，未找到已验证的批量替代入口。

仓库保持 URL、顺序和动作不变，明确标记需要客户端注册的边界；受影响客户端目前按 README 逐组保存激活。更换镜像、重编 SRS、静默展开规则或恢复整个 App 备份都不是这个注册缺口的已验证修法。永久修复应由 Karing 导入器在导入事务中登记远程资产并保存，再以真实 App 导入、下载、重启和重复导入验证。

`tools/audit-karing-registration.js` 只对已有内部配置**副本**核对注册四字段，不写配置、不下载规则。其成功仅说明注册表有对应项，不证明下载或命中成功；普通自定义导出不包含注册表，工具会拒绝将其当作证据。
