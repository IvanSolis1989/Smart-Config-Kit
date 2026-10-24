# AEROVE Lite 宿主接口依据

> 记录日期：2026-10-24。以下保留当时读取的接口固定快照，属于历史证据，不代表后续接线或当前生产状态。

[使用说明](README.md) · [内核家族入口](../README.md) · [官方核心依据](../Meow/REFERENCE-meow-rs.md) · [支持队列](../../docs/support-queue.md#aerove-lite-meow)

最新核查见 [VALIDATION](VALIDATION.md)：包含固定 App 提交、候选检查实际结果、生产接线及 Geo/代理下载阻断。本页继续保留早期接口快照，不能用来覆盖较新的验收记录。

## 接口固定快照

2026-10-24 只读核对 `IvanSolis1989/Aerove` 开发工作树，HEAD 为 `b60c272c5e24e9601ea489dd187009e70eda14f6`；当时存在开发中改动，HEAD 不能替代实际读取内容。仓库内位置与当时观察如下：

- `apps/aerove-lite/app/src/main/java/dev/aerove/lite/overrides/OverridePipeline.kt:32-38`：YAML → JSON → JS → YAML。
- `apps/aerove-lite/meow-native/src/script_engine.rs:3-71`：`main` 对象入出；无宿主网络、文件或定时器；脚本 4 MiB、输入 16 MiB、内存 256 MiB、10 秒，支持已完成 Promise。
- `apps/aerove-lite/app/src/main/java/dev/aerove/lite/LiteApplication.kt:88-98`：核查时生产入口仍实例化旧 `CompatibilityValidator`，新校验器的存在不能证明生产路径接好。
- 同目录 `data/MeowCompatibilityValidator.kt:103-117`：新组类型及规则准入；当时未准入直接 AND/OR/NOT。
- 同目录 `data/MeowRuntimeConfigComposer.kt:95-111,154-176`：宿主处理 TUN、监听、控制器与资源路径。

实际读取 SHA-256：

```text
MeowCompatibilityValidator.kt e0a6b932326a2266502484ecc471b7879096d189d8d2fbd0a90355ac06927aec
MeowEngineSchema.kt 80185e6a643e4872caf77f3c1569264ca224066a8952e5581286520b390328e2
meow-native/src/script_engine.rs 8f4588c75767df0fe57b663d23630766d4bd14cade7dc151b15199a581db9866
```

## 接入与验收边界

[AeroveLite(meow).js](AeroveLite%28meow%29.js) 使用上述 `main(config)` 对象接口，由共享 `tools/generate-meow.js` 生成。JS 保留宿主输入的 DNS、hosts、TUN、端口、嗅探、模式及控制器；纯远程 provider 先展平，DNS 的订阅 rule-set 依赖会明确拒绝，失败保持原输入不变。

历史快照中的待办包括：导入、资源准备与运行路径接入 Meow 校验器；补齐直接逻辑规则准入；真实 APK 执行 JS 并读回最终 YAML；完成 MRS/residual 更新、广告、直连、国外及业务出口验收。后续完成状态须以 AEROVE 开发会话的新源码、最终配置、APK 和日志为准，不能由本快照推定。

标准版 AEROVE 使用 Mihomo。官方 meow-rs 核心、官方 Android/iOS 的原生 YAML 接口和核心验证另见[官方核心与客户端依据](../Meow/REFERENCE-meow-rs.md)，不将 AEROVE 的 QuickJS 接口推广为官方 App 能力。
