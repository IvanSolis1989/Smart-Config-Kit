# AEROVE Lite 接入 Meow 通用分流

此页记录 AEROVE Lite 的宿主接口与联调；分流实现由通用产物统一生成。

[Meow 通用入口](../README.md) · [支持队列](../../../docs/support-queue.md#aerove-lite-meow)

1. Lite 导入节点订阅，确认得到已展开的 proxies。
2. 在覆写管理添加 [Meow(meow).js](../Meow%28meow%29.js)，关联订阅并刷新；UI 以验收 APK 为准。
3. OverridePipeline 将 YAML 转 JSON，调用 main(config)，再转回 YAML；使用真实 QuickJS，不为官方 App 假设同一接口。
4. 通过 Meow 配置准入、资源准备和运行装配检查最终 YAML，再完成 Android VPN/路由验收。

JS 保留输入 DNS、hosts、TUN、端口、嗅探、模式及控制器。这些设置应已兼容 Lite；纯远程 provider 先展平，DNS 的订阅 rule-set 依赖会明确拒绝。失败保持原输入不变。

## 已交接待办

导入、资源准备和运行路径接好 Meow 校验器；补齐直接逻辑规则准入；真实 APK 执行通用 JS 并读回最终 YAML；完成 MRS/residual 更新、广告、直连、国外和业务出口验收。标准版 AEROVE 使用 Mihomo，本页不改变它的接入。

## 接口核查快照

2026-10-24 只读核对 IvanSolis1989/Aerove 开发工作树，HEAD b60c272c5e24e9601ea489dd187009e70eda14f6；当时存在开发中改动，HEAD 不能替代实际读取内容。仓库内位置：

- apps/aerove-lite/app/src/main/java/dev/aerove/lite/overrides/OverridePipeline.kt:32-38：YAML → JSON → JS → YAML。
- apps/aerove-lite/meow-native/src/script_engine.rs:3-71：main 对象入出；无宿主网络/文件/定时器；脚本 4 MiB、输入 16 MiB、内存 256 MiB、10 秒，支持已完成 Promise。
- apps/aerove-lite/app/src/main/java/dev/aerove/lite/LiteApplication.kt:88-98：核查时生产入口仍实例化旧 CompatibilityValidator，新校验器的存在不能证明生产路径接好。
- 同目录 data/MeowCompatibilityValidator.kt:103-117：新组类型及规则准入；当时未准入直接 AND/OR/NOT。
- 同目录 data/MeowRuntimeConfigComposer.kt:95-111,154-176：宿主处理 TUN、监听、控制器与资源路径。

实际读取 SHA-256：

```text
MeowCompatibilityValidator.kt e0a6b932326a2266502484ecc471b7879096d189d8d2fbd0a90355ac06927aec
MeowEngineSchema.kt 80185e6a643e4872caf77f3c1569264ca224066a8952e5581286520b390328e2
meow-native/src/script_engine.rs 8f4588c75767df0fe57b663d23630766d4bd14cade7dc151b15199a581db9866
```

以上为接口来源记录；后续接线和 App 验收以 AEROVE 开发会话的新源码、最终配置、APK 和日志为准。
