# Meow 官方核心与客户端适配依据

[English](REFERENCE-meow-rs.md) | **简体中文**


> 更新于 2026-11-28（上次核对 2026-10-28）：复核 Android v1.0.11、iOS/tvOS v2.0.0 的实际隧道装配和上游 v0.30.0，生成 YAML 继续使用现有兼容基线。

> 核对于 2026-10-28：本次仅将 GoogleFCM 由下载更新归入 Google 服务；复核 [官方 meow-rs README](https://github.com/meow-rs/meow-rs)，沿用既有 Clash 风格路由投影，不扩大 App/core 兼容或真机验收声明。不改变 DNS、fake-IP、嗅探、其他推送或节点组；未新增字段、最低版本或真机通过声明。

> 更新于 2026-10-24：从 AEROVE 专属候选改为通用原生 YAML 与可选 JS。核心校验、App 接口源码和 App 运行验收分别记录。

## 官方入口和版本

[官方核心](https://github.com/meow-rs/meow-rs) Apps 段列出 [meow-android](https://github.com/meow-rs/meow-android) 和 [meow-ios](https://github.com/meow-rs/meow-ios)。桌面官方核心提供 WebUI /ui、REST 和 CLI；未发现同组织独立桌面 GUI。统一基础输入为 [Clash 风格 YAML](https://meow-rs.github.io/meow-rs/guide/guide/configuration)。

| 对象 | 核对版本 | 输入与固定来源 |
| --- | --- | --- |
| 官方核心 | v0.26.1 兼容基线，v0.30.0 诊断目标 | 原生 YAML，`meow -f config.yaml -t`。[基线版本](https://github.com/meow-rs/meow-rs/releases/tag/v0.26.1) · [当前版本](https://github.com/meow-rs/meow-rs/releases/tag/v0.30.0)。 |
| 官方 Android | GitHub v1.0.11，App `dc4fc20a7778bfbd69f78f5d6f0a7089e8d0a292`，核心 v0.29.0 | [版本与签名变更](https://github.com/meow-rs/meow-android/releases/tag/v1.0.11) · [本地导入与校验](https://github.com/meow-rs/meow-android/blob/dc4fc20a7778bfbd69f78f5d6f0a7089e8d0a292/core/src/main/java/io/github/madeye/meow/repo/ProfileRepository.kt) · [核心依赖](https://github.com/meow-rs/meow-android/blob/v1.0.11/core/src/main/rust/meow-android-ffi/Cargo.toml)。 |
| 官方 iOS / tvOS | App Store 2.0，GitHub v2.0.0，App `fe288b1eea60fb9a2da18a0749cce1ca0bd538f7`，核心 v0.21.2 固定于 `a663364469b3b7dc2b46d2e0f4530e50a54108ee` | [App Store 渠道](https://apps.apple.com/us/app/meow-smart-vpn/id6778303404) · [URL/本地 YAML](https://github.com/meow-rs/meow-ios/blob/fe288b1eea60fb9a2da18a0749cce1ca0bd538f7/App/Sources/Services/SubscriptionService.swift) · [核心依赖](https://github.com/meow-rs/meow-ios/blob/fe288b1eea60fb9a2da18a0749cce1ca0bd538f7/core/rust/meow-ios-ffi/Cargo.toml)。 |

官方 App 本轮未发现 AEROVE 式 main(config) JS 覆写入口。JS 只供具有对应宿主的客户端，AEROVE 证据见[单独接入页](../Aerove%20Lite/REFERENCE-AEROVE-Lite.md)。

官方应用显示名为 Android 的 [Meow](https://github.com/meow-rs/meow-android/blob/4740012bf0efdb8bae8fbeeefaf4937dfa309f26/mobile/src/main/res/values/strings.xml#L13) 和 iOS 的 [meow](https://github.com/meow-rs/meow-ios/blob/a32df0ba845d706659cb531aa9250e769011f651/App/Info.plist#L7)，本仓库共用 Meow 客户端目录。

## 字段与语义

- [Providers](https://meow-rs.github.io/meow-rs/guide/guide/providers)：domain/ipcidr/classical、yaml/text/mrs 与 HTTP provider.proxy。provider health-check 为手动接口默认参数，周期测速由使用它的组承担。
- [规则](https://meow-rs.github.io/meow-rs/guide/guide/rules)：首命中、RULE-SET、MATCH、no-resolve 与 AND/OR/NOT。
- [分组](https://meow-rs.github.io/meow-rs/guide/guide/proxy-groups)：select/url-test/fallback/load-balance/relay。固定 v0.26.1 [proxy_parser.rs](https://github.com/meow-rs/meow-rs/blob/727ddcd06f592e2f12c5222c4de6cce328df808c/crates/meow-config/src/proxy_parser.rs) 3097-3104：filter/exclude-filter/exclude-type 只筛 provider，静态 proxies 绕过。地区采用 use+filter，静态 REJECT 哨兵不被筛掉；空池、全故障及首轮健康检查前可能拒绝。
- 使用 Rust [regex](https://docs.rs/regex/latest/regex/)，无 JS 环视/反向引用。原生筛选来自 CMFA 的无环视表达式，已交真实核心解析；静态“其他”组与 JS 未分类组的差异单列。
- [DNS](https://meow-rs.github.io/meow-rs/guide/guide/dns)和[geodata](https://meow-rs.github.io/meow-rs/guide/guide/geodata)：以固定 raw.rs 为准，v0.26.1 RawDns 没有嵌套 ipv6，RawFallbackFilter 没有 geosite；保留顶层 ipv6，省略 respect-rules/direct-nameserver/profile 等 Mihomo 扩展。geosite.dat 有实际 protobuf 解析器。
- iOS/tvOS v2.0.0 的 PacketTunnel 调用 Rust `meow_patch_config`，保留源 DNS 映射中内核支持的上游、fallback、fake-IP 排除及 nameserver policy，再固定监听、fake-IP 模式、持久化及 `28.0.0.0/8` 地址池。它还迁移对原监听地址的引用、过滤 `dhcp://`，并在主 nameserver 列表追加内置解析器。[PacketTunnel 调用](https://github.com/meow-rs/meow-ios/blob/fe288b1eea60fb9a2da18a0749cce1ca0bd538f7/PacketTunnel/Sources/MWTunnelEngine.m#L374-L409) · [Rust DNS 装配](https://github.com/meow-rs/meow-ios/blob/fe288b1eea60fb9a2da18a0749cce1ca0bd538f7/core/rust/meow-ios-ffi/src/lib.rs#L1042-L1103)。
- Android v1.0.11 可使用配置上游或宿主的内置 DNS 开关，核验时一起读回。GitHub v1.0.11 与 GitHub v1.0.8 的签名不同，切换渠道或重装前备份配置。[美国 Google Play 页面](https://play.google.com/store/apps/details?gl=us&hl=en&id=io.github.madeye.meow)展示较早的更新说明，需以实际安装版为准。[Android 版本说明](https://github.com/meow-rs/meow-android/releases/tag/v1.0.11)。
- 核心 v0.30.0 增加 IPv6 fake-IP 池、节点域名 DNS 策略、条件式 `SUB-RULE`，并在相应构建中提供 WireGuard。已存在的 fake-IP 映射可优先于冲突的嗅探域名。各 App 内嵌的核心版本不同，共用 YAML 延续较早的兼容基线。[版本变更](https://github.com/meow-rs/meow-rs/releases/tag/v0.30.0) · [节点 DNS 策略](https://github.com/meow-rs/meow-rs/blob/8e4e948464656380f46f3a98cb168fc35d7708db/docs/specs/proxy-server-dns-policy.md)。

另保留早期 Android GitHub v1.0.8 与现行 iOS v2.0.0 的内嵌核心源码证据：Android v0.20.2 与 iOS 固定 a663364… 的 raw.rs/rule_provider.rs/meow-rules/parser.rs 均实际消费 provider.proxy、MRS、逻辑规则和 geodata。[Android provider](https://github.com/meow-rs/meow-rs/blob/v0.20.2/crates/meow-config/src/rule_provider.rs#L146)、[iOS provider](https://github.com/meow-rs/meow-rs/blob/a663364469b3b7dc2b46d2e0f4530e50a54108ee/crates/meow-config/src/rule_provider.rs#L146)、[Android逻辑解析](https://github.com/meow-rs/meow-rs/blob/v0.20.2/crates/meow-rules/src/parser.rs#L81)。不因版本不同臆定缺失或要求升级；源码支持不替代完整 App 验收。

## 实际核心验证

下载[官方 v0.26.1 Windows x86_64 归档](https://github.com/meow-rs/meow-rs/releases/tag/v0.26.1)并按官方 .sha256 核对：

```text
c212a27184973bd1eb1c8c713d919da0eaa2daaf2695afb7b73ca61705ea97a9
```

实际 meow -d 隔离目录 -f 配置绝对路径 -t 返回 Configuration test passed。测试将订阅替换为合成节点，将149个provider映射至隔离目录中的真实仓库MRS/residual资产，加载真实Country.mmdb/geosite.dat；168条规则、55组全部解析，无WARN/ERROR。没有启动代理流量，也没有以file provider证明生产HTTP下载出站。

2026-11-28 使用 Windows x86_64 官方 v0.26.1 和 v0.30.0 运行 `tools/tests/meow-generation.test.js` 的同一真实核心用例，两版均通过。原生 YAML 加载 149 个 provider、168 条规则、56 组，Lite JS 投影加载 153 个 provider、172 条规则、56 组。两轮使用同一批冻结本地资产和 Geo 数据、合成节点及 `-t`。CI 保留 v0.26.1 门禁，并以固定 v0.30.0 做非阻断诊断。Windows v0.30.0 归档 SHA-256 为 `c65d769bc27fabf8977a5fe901e5e4daa83dd2fce3cf6e27ac7271877eb46181`。

官方 Android/iOS、AEROVE Lite 的完整导入、资源更新、最终配置、VPN及真实路由仍见[支持队列](../../docs/support-queue.md#meow)。
