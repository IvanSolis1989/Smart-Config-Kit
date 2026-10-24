# Karing 官方兼容性依据

> 获取日期：2026-10-24。Karing 当前 main：`60cfb75daaabd179305a1e6c5201c35c91a63cf2`（2026-10-23）；源码版本 `1.2.26+2911`。当时最新稳定 Release 为 `v1.2.25.2802`（2026-09-10）。
> 本适配不是对上述版本的实机认证。Karing 与同团队的 Mihomo 客户端 Clash Mi 是两个 App。

## 当前官方文档

- [添加配置](https://karing.app/app-manual/add-profiles)：接受 Clash、sing-box 等订阅/配置输入。
- [Clash 兼容列表](https://karing.app/clash)：DNS 由 App 设置，不支持由订阅链接配置；高级策略功能有能力差异。
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

[Route Rule 默认匹配语义](https://sing-box.sagernet.org/configuration/route/rule/#default-fields)说明：单条、未 invert 的 default rule-set 字段可能合并入外层匹配。当前 QUIC 规则的源域名与外层 port/network 没有字段组重叠，AND 展开等价；未来若内外域名/IP、端口等匹配组重叠，生成器明确失败，避免将原 OR 合并误改为 AND。

普通纯 rule_set 保留原 URL；复杂条件资产由生成器写入 `rulesets/generated/karing/`。no-resolve/先解析差异、App 实际下载路径及优先级需要客户端读回，不由 schema 编译结果代替。
