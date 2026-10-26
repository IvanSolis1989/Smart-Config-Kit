# 客户端支持队列

记录通用适配与各客户端验收进展。源码支持、核心校验、App 导入和真实连接分别记录。

[文档中心](README.md) · [客户端选择](guide/client-support.md) · [Meow 内核系](../Meow内核系/README.md)

| 对象 | 入口 | 当前阶段 |
| --- | --- | --- |
| [官方 meow-rs 核心](#meow) | 原生 YAML / WebUI | v0.26.1 真实 -t 通过；生产订阅/HTTP 下载与路由待验 |
| [官方 meow-android / meow-ios](#meow-official-apps) | 原生 YAML | 导入接口及旧核心关键能力已核源码；完整 App 导入与连接待验 |
| [AEROVE Lite](#aerove-lite-meow) | JS 覆写及专用 MRS 分片 | 生产校验链已接通，QuickJS 原子性及命名 HTTP 代理用例已通过；无损三片候选待 App 全资源重验及真实路由验收 |

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

目标为 Android 13+ 原生 Lite；标准版仍使用 Mihomo。操作步骤见 [AEROVE Lite README](../Meow内核系/Aerove%20Lite/README.md)。最新固定 beta16 `d52726d…`、run 40335340043 的 Smart 用例实际执行后，被广告 MRS 的 411,634 条记录超过 250,000 条上限拒绝。

已完成并核对的接线与单项验收：

- 生产 factory 已切换 `forMeow`，source、资源 preflight、prepared 与真实 JNI 校验链已接通；逻辑规则及 provider proxy/header 已准入并传入原生下载器。资源容量已从早期 128 提升为 256，保留 256 MiB bundle 预算。
- 真实 Android execution 已通过 QuickJS 输入保持/失败原子性、JNI 命名 HTTP 代理及取消所有权，以及四项 JNI 文件规则解析/损坏拒绝用例。
- 自定义 header 实传、完整逻辑与 Geo/prepared 转换、256 资源边界全流程尚未取得本轮通过结果。固定源码和 execution 行号见[最新联调核查](../Meow内核系/Aerove%20Lite/VALIDATION.md)。

已完成的本地候选检查：

- 保留 250,000 条、500,000 点分标签及其他安全预算，将唯一超限资源派生为 3 个 MRS；原生重新解码后的完整字符串并集等于原 411,634 条。
- 其他 148 个规则源复用，投影为 151 个规则资源、170 条主规则；引用在原优先级位置连续展开，目标、no-resolve、下载代理和 header 保持。
- 原生转换、完整资源预算和官方核心 `-t` 均通过；共享 fused、规则权威源和官方 Meow YAML 字节不变。详细 SHA、许可未决项及准确范围见[分片依据](../Meow内核系/Aerove%20Lite/RESOURCE-SPLITTING.md)。

剩余生产与设备验收：

1. AEROVE 接取同批脚本、分片和 SHA，更新内置内容、URL 与唯一来源清单，在固定目标 APK 重新运行实际 Smart 用例。
2. 实际下载所有资源，沿用逐资源预检、不可变保存和字节校验、完整 prepared 校验；把 Geo、订阅和派生记录一并纳入 256 资源/256 MiB 的最终 bundle 预算。
3. 读回最终 YAML，核对命名代理/header 下载、可信 Geo 上下文、规则顺序、更新及恢复，再验收 Android VPN、广告、国内/国外与业务出口，区分模拟器和真机。

早期 74 项 JVM、AndroidTest 编译及旧 128 资源限制保存在[历史联调核查](../Meow内核系/Aerove%20Lite/VALIDATION.md)；当前接线与单项执行结果以该页最新核查为准，不代替本候选的完整 App 验收。

## 维护

```bash
node tools/generate-aerove-rule-assets.js
node tools/generate-meow.js
node tools/generate-aerove-rule-assets.js --check
node tools/generate-meow.js --check
node --test tools/tests/aerove-rule-assets.test.js tools/tests/aerove-rule-projection.test.js tools/tests/meow-generation.test.js tools/tests/meow-native-profile.test.js
```

两种生成物已进入上游刷新链和发布批次清单。自动同步或核心通过不会自动把各 App 待验项标为通过。Ruby 用于生成阶段的 YAML 解析，不是客户端依赖。
