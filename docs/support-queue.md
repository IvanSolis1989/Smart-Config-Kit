# 客户端支持队列

记录通用适配与各客户端验收进展。源码支持、核心校验、App 导入和真实连接分别记录。

[文档中心](README.md) · [客户端选择](guide/client-support.md) · [Meow 内核系](../Meow内核系/README.md)

| 对象 | 入口 | 当前阶段 |
| --- | --- | --- |
| [官方 meow-rs 核心](#meow) | 原生 YAML / WebUI | v0.26.1 真实 -t 通过；生产订阅/HTTP 下载与路由待验 |
| [官方 meow-android / meow-ios](#meow-official-apps) | 原生 YAML | 导入接口及旧核心关键能力已核源码；完整 App 导入与连接待验 |
| [AEROVE Lite](#aerove-lite-meow) | JS 覆写 | 准入候选 74 项 JVM、AndroidTest 编译与 149 资产读回通过；生产接线及 APK/真实路由待验 |

## <a id="meow"></a>Meow / meow-rs 通用适配

核对日期：2026-10-24。两个客户端目录并列：[官方 Meow](../Meow内核系/Meow/README.md)使用 [Meow(meow).yaml](../Meow内核系/Meow/Meow%28meow%29.yaml)，[AEROVE Lite](../Meow内核系/Aerove%20Lite/README.md)使用 [AeroveLite(meow).js](../Meow内核系/Aerove%20Lite/AeroveLite%28meow%29.js)；各自提供 README、参考文档和日志，共享生成器与规则基线。

已完成同源融合规则、33 业务组、22 个原生地区/家宽组、通用 JS、原生 YAML、输入/输出哈希、失败原子性、空池拒绝，以及自动刷新/CI。官方 v0.26.1 核心真实 -t 已加载 149 个本地规则资产、168 条规则、55 个组及实际 Geo 数据，没有 WARN/ERROR。节点为合成样例，未启动代理流量。依据见 [REFERENCE](../Meow内核系/Meow/REFERENCE-meow-rs.md)。

共同待验：

1. 用有效订阅替换占位 URL，验证生产 HTTP 下载、provider 下载代理与规则更新。
2. 验证首轮健康检查、空池/全故障拒绝、广告拦截、国内直连、国外及业务出口；不能以 -t 代替实际连接。
3. 各 App 导出最终配置并读回，核对宿主装配后的 DNS、VPN、端口、进程元数据与资源路径。

## <a id="meow-official-apps"></a>官方 Android / iOS

meow-android 稳定 v1.0.8 固定核心 v0.20.2；meow-ios 稳定 v2.0.0 固定核心 a663364469b3b7dc2b46d2e0f4530e50a54108ee。两者的 MRS、provider.proxy、AND/OR/NOT 与 geodata 均有实际源码消费者；不能仅据版本号不同推断缺失。

剩余：在目标 APK/IPA 分别导入原生 YAML，完成资源加载、订阅刷新、最终配置读回及真实连接。Android 管理监听/DNS/VPN，iOS 重写源 DNS/subscriptions；须核对宿主行为。本轮未发现官方 App 提供 AEROVE 式 JS 宿主，不要求用户向官方 App 导入 JS。

## <a id="aerove-lite-meow"></a>AEROVE Lite

目标为 Android 13+ 原生 Lite；标准版仍使用 Mihomo。操作步骤见 [AEROVE Lite README](../Meow内核系/Aerove%20Lite/README.md)，专属接口见 [接口依据](../Meow内核系/Aerove%20Lite/REFERENCE-AEROVE-Lite.md)。本轮已读取开发会话、固定 App 源码和保存产物，完整范围与指纹见[联调核查](../Meow内核系/Aerove%20Lite/VALIDATION.md)。

已通过的候选检查：

- Kotlin 准入候选 74 项 JVM 测试通过，覆盖三阶段准入、资源根接口和 proxy/header 合同；尚未执行真实原生转换或接入生产 factory。
- SDK 36 AndroidTest 候选编译通过，149 个 provider payload 保存读回完成；Android/QuickJS JNI/原生 payload 解析未执行。
- 新增 4 个原生回归源码并完成严格补丁回放；Rust 尚未执行，保留为“源码准备完成”。

剩余生产与设备验收：

1. 导入、资源准备和运行路径统一使用 Meow 配置准入；固定 App 提交 5d2c2bb… 仍在生产入口实例化旧 CompatibilityValidator。
2. 整合候选的 AND/OR/NOT 准入，并将完整校验接上可信 prepared Geo 资源根；5 条 GEOSITE 逻辑规则的 string-only 校验仍有明确阻断。
3. 接通 provider 命名代理与 header 下载；当前下载器仍强制直连。
4. 统一导入、资源准备与备份恢复的有界容量，容纳 149 个规则源；固定源码仍有 128 条限制，保留字节预算和超限拒绝。
5. 在目标 APK 的真实 QuickJS 执行当前 JS，读回最终 YAML，核对组/provider/规则顺序和字段所有权。
6. 完成固定内核校验、资源更新、Android VPN 与真实路由验收，区分模拟器和真机。旧 APK 或部分 Native 测试通过不代表本轮联调完成。

## 维护

```bash
node tools/generate-meow.js
node tools/generate-meow.js --check
node --test tools/tests/meow-generation.test.js tools/tests/meow-native-profile.test.js
```

两种生成物已进入上游刷新链和发布批次清单。自动同步或核心通过不会自动把各 App 待验项标为通过。Ruby 用于生成阶段的 YAML 解析，不是客户端依赖。
