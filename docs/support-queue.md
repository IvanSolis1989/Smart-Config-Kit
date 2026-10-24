# 客户端支持队列

记录通用适配与各客户端验收进展。源码支持、核心校验、App 导入和真实连接分别记录。

[文档中心](README.md) · [客户端选择](guide/client-support.md) · [Meow 使用说明](../Meow内核系/Meow/README.md)

| 对象 | 入口 | 当前阶段 |
| --- | --- | --- |
| [官方 meow-rs 核心](#meow) | 原生 YAML / WebUI | v0.26.1 真实 -t 通过；生产订阅/HTTP 下载与路由待验 |
| [官方 meow-android / meow-ios](#meow-official-apps) | 原生 YAML | 导入接口及旧核心关键能力已核源码；完整 App 导入与连接待验 |
| [AEROVE Lite](#aerove-lite-meow) | 通用 JS | 已交接开发会话；配置准入接线与 Android 联调待验 |

## <a id="meow"></a>Meow / meow-rs 通用适配

核对日期：2026-10-24。[Meow(meow).yaml](../Meow内核系/Meow/Meow%28meow%29.yaml) 面向官方核心/官方 App；[Meow(meow).js](../Meow内核系/Meow/Meow%28meow%29.js) 面向提供 main(config) 的宿主。AEROVE Lite 是其中一个消费者。

已完成同源融合规则、33 业务组、22 个原生地区/家宽组、通用 JS、原生 YAML、输入/输出哈希、失败原子性、空池拒绝，以及自动刷新/CI。官方 v0.26.1 核心真实 -t 已加载 149 个本地规则资产、168 条规则、55 个组及实际 Geo 数据，没有 WARN/ERROR。节点为合成样例，未启动代理流量。依据见 [REFERENCE](../Meow内核系/Meow/REFERENCE-meow-rs.md)。

共同待验：

1. 用有效订阅替换占位 URL，验证生产 HTTP 下载、provider 下载代理与规则更新。
2. 验证首轮健康检查、空池/全故障拒绝、广告拦截、国内直连、国外及业务出口；不能以 -t 代替实际连接。
3. 各 App 导出最终配置并读回，核对宿主装配后的 DNS、VPN、端口、进程元数据与资源路径。

## <a id="meow-official-apps"></a>官方 Android / iOS

meow-android 稳定 v1.0.8 固定核心 v0.20.2；meow-ios 稳定 v2.0.0 固定核心 a663364469b3b7dc2b46d2e0f4530e50a54108ee。两者的 MRS、provider.proxy、AND/OR/NOT 与 geodata 均有实际源码消费者；不能仅据版本号不同推断缺失。

剩余：在目标 APK/IPA 分别导入原生 YAML，完成资源加载、订阅刷新、最终配置读回及真实连接。Android 管理监听/DNS/VPN，iOS 重写源 DNS/subscriptions；须核对宿主行为。本轮未发现官方 App 提供 AEROVE 式 JS 宿主，不要求用户向官方 App 导入 JS。

## <a id="aerove-lite-meow"></a>AEROVE Lite

目标为 Android 13+ 原生 Lite；标准版仍使用 Mihomo。专属接口见 [AEROVE Lite 接入](../Meow内核系/Meow/clients/aerove-lite.md)。已发送给 AEROVE 开发会话推进，取得真实证据前以下状态保持待验：

1. 导入、资源准备和运行路径统一使用 Meow 配置准入，避免旧 CompatibilityValidator 拒绝 provider.proxy/header 等字段。
2. App 的 AND/OR/NOT 准入与固定内核一致，保留 QUIC 等有序规则。
3. 在目标 APK 的真实 QuickJS 执行通用 JS，读回最终 YAML，核对组/provider/规则顺序和字段所有权。
4. 完成固定内核校验、资源更新、Android VPN 与真实路由验收，区分模拟器和真机。

## 维护

```bash
node tools/generate-meow.js
node tools/generate-meow.js --check
node --test tools/tests/meow-generation.test.js tools/tests/meow-native-profile.test.js
```

两种生成物已进入上游刷新链和发布批次清单。自动同步或核心通过不会自动把各 App 待验项标为通过。Ruby 用于生成阶段的 YAML 解析，不是客户端依赖。
