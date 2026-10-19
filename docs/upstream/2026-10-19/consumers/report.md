# Karing 与 Happ：版本、导入格式与适用边界

核对日期为 2026-10-19。它们出现在根 README 的客户端别名中，故纳入核对；本次没有为它们新增独立规则权威或声称已有完整客户端验收。15 项原文、URL、commit、时间与哈希见 [sources.json](sources.json) 和 [manifest.json](manifest.json)。

| 产品/渠道 | 当前可核实版本 | 发布时间 UTC | 官方依据 |
| --- | --- | --- | --- |
| Karing GitHub 稳定 | v1.2.25.2802 | 2026-09-10 02:20:39 | [稳定 release](https://github.com/KaringX/karing/releases/tag/v1.2.25.2802) |
| Karing iOS 商店 | 1.2.25.2802 | 2026-09-11 07:32:05 | [Apple lookup](https://itunes.apple.com/lookup?id=6472431552&country=us) |
| Karing GitHub 预发布 | v1.2.26.2908 | 2026-10-12 05:53:51 | [预发布](https://github.com/KaringX/karing/releases/tag/v1.2.26.2908) |
| Happ Desktop 稳定 | 4.5.4 | 2026-10-14 13:09:51 | [release](https://github.com/Happ-proxy/happ-desktop/releases/tag/4.5.4) |
| Happ Android 稳定 | 4.7.1 | 2026-10-05 14:49:13 | [release](https://github.com/Happ-proxy/happ-android/releases/tag/4.7.1) |
| Happ iOS US 商店 | 6.1.0 | 2026-10-14 03:05:53 | [Apple lookup](https://itunes.apple.com/lookup?id=6504287215&country=us) |

Karing 的 GitHub tag 已固定到 `0c320dc182d095ec0d483f852169421e749c2bac`。该 tag 的 pubspec 仍写 `1.2.25+2801`，不能用此单个源码字段替代 release 和商店分发版本；冲突原样保存在缓存。本次没有确认稳定版内置核心的确切 revision，不能据此推断已兼容官方 sing-box 1.14.3。

## Karing

稳定版修复 VLESS 配置导致的连接问题；预发布继续调整 WireGuard endpoint、Tailscale/OpenVPN 导入、DNS 检测和 Vision UDP443 等。预发布能力不被写成当前稳定版能力，也不据此替用户升级应用。[官方 release 列表](https://github.com/KaringX/karing/releases)。

[官方快速开始](https://karing.app/en/quickstart)明确支持 Clash、sing-box 等配置链接导入，但这不足以证明整个自定义 DNS、策略组和路由会原样保留。仓库现有静态 JSON 有示例节点，普通订阅导入或 UI 重建可能采用不同数据流。已缓存固定 tag 的 README、pubspec 和配置管理源码供后续追踪；这些材料没有完成实际导入和最终运行配置验收。

采用决定：保留共享生成源与 1.13/1.14 两种 schema 作为研究输入；不向 Karing 专门塞入未经确认的新字段。使用前核实内核版本、完整自定义配置入口、最终 54 组和业务路由，尚不能承诺通用文件导入等价。

## Happ

Desktop 4.5.4 涉及按应用代理与 TUN 模式的一致性，并修复部分订阅在显示已连接时实际绕过 VPN 的问题。Android 4.7.1 的公开说明仅为体验修复，不据此创造具体路由特性。官方 README 确认 Xray 内核与不同平台独立发布。[Desktop 发布记录](https://github.com/Happ-proxy/happ-desktop/releases)、[官方 README](https://github.com/Happ-proxy/happ-desktop)。

[官方路由文档](https://www.happ.su/main/dev-docs/routing)使用 `happ://routing/add/...` / `onadd/...` 传递有 Name、DirectSites、ProxySites 等字段的 Profile；它不是本仓库 v2rayN 的 RuleObject 数组。文档还说明 JSON 订阅的 Profile 绑定限制、重新连接后生效，以及 geofile 更新与切换过程。[JSON 导入说明](https://github.com/HappDev/happ_su/blob/main/dev-docs/examples-of-links-and-parameters.md)另区分直接完整 JSON 的行为。

采用决定：纠正根 README 和 `v2rayN/README.md` 的直接复用承诺。现有 `v2rayN/v2rayN(xray).json` 仍供 v2rayN 路由设置使用；不能因同为 Xray 就把数组当作 Happ 完整配置。没有新增未经验收的 Happ 转换器，也没有改变 Xray 路由内容。Happ 的实际 Profile/完整 JSON 导入、按应用行为和流量命中尚未进行设备验收。
