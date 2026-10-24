# AEROVE Lite / meow-rs 适配依据

> 核对日期：2026-10-24。对象：开发中 App 与固定 meow-rs v0.26.1；这是候选边界记录，不是目标 APK 验收报告。

## 官方依据

- [配置总览](https://meow-rs.github.io/meow-rs/guide/guide/configuration)：Clash 风格 YAML，`meow -f config.yaml -t` 校验；未知或错误项可能 warn-and-skip，不能只看进程存活。
- [Proxy groups](https://meow-rs.github.io/meow-rs/guide/guide/proxy-groups)：`select`、`url-test` 及组引用；不使用 Mihomo Smart/LightGBM。
- [Providers](https://meow-rs.github.io/meow-rs/guide/guide/providers)：`domain` / `ipcidr` / `classical`，`yaml` / `text` / `mrs`，HTTP provider 的 `proxy` 下载出站。
- [规则](https://meow-rs.github.io/meow-rs/guide/guide/rules)：有序首命中、`RULE-SET`、`MATCH`、`no-resolve` 及逻辑规则。
- [固定核心源码](https://github.com/meow-rs/meow-rs/tree/727ddcd06f592e2f12c5222c4de6cce328df808c)：App 迁移文档使用 v0.26.1；实际支持以此固定核心和 App 构建为准，网站当前文档可能继续变化。

本次已读取官方在线文档；现有仓库中没有更早的 Meow REFERENCE 文件。

## 开发 App 的源码快照

仓库：[IvanSolis1989/Aerove](https://github.com/IvanSolis1989/Aerove)。只读工作树 `D:/GitHub/worktrees/aerove-lite-meow-app/FLClash`，核对时 HEAD 为 `b60c272c5e24e9601ea489dd187009e70eda14f6`。工作树存在开发中改动，下面的内容哈希标识实际读取的文件；HEAD 本身不能替代这些文件快照。

以下路径相对此工作树：

| 证据 | 位置与结论 |
| --- | --- |
| 产品边界 | `AGENTS.md:14`：标准版 Flutter + Mihomo，Lite 为 Android 13+ + meow-rs。 |
| 固定核心 | `docs/aerove-lite/core/meow-migration.md:8`：v0.26.1 / `727ddcd06f592e2f12c5222c4de6cce328df808c`。 |
| JS 输入输出 | `apps/aerove-lite/app/src/main/java/dev/aerove/lite/overrides/OverridePipeline.kt:32-38`：YAML → JSON 对象 → JS → YAML。 |
| 入口与资源限制 | `apps/aerove-lite/meow-native/src/script_engine.rs:3-71`：全局 `main(config)`，无宿主网络/FS/timer，脚本 4 MiB、配置 16 MiB、内存 256 MiB、10 秒；支持已完成 Promise。 |
| 新 Meow 准入 | `apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/MeowCompatibilityValidator.kt:11-14,81-117`：不接受 `profile` / `geox-url` 等根字段；DNS 不接受部分 Mihomo 扩展；组支持 select/url-test，不接受 smart；直接逻辑规则尚未准入。 |
| Provider 与嗅探 | 同目录 `MeowEngineSchema.kt:26-90`：MRS、provider.proxy/header 可准入；sniff 只准 TLS/HTTP，QUIC 和 Mihomo 其他字段未准入。 |
| 生产入口缺口 | `apps/aerove-lite/app/src/main/java/dev/aerove/lite/LiteApplication.kt:88-98`：仍实例化旧 `CompatibilityValidator`；旧字段表会拒绝新 Meow 能力。不能据新校验器测试宣布当前 App 可导入。 |
| 宿主所有权 | `apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/MeowRuntimeConfigComposer.kt:95-111,154-176`：App 处理 TUN、监听、控制器和资源路径；不由分流脚本接管 Android Builder。 |

实际文件 SHA-256：

```text
MeowCompatibilityValidator.kt e0a6b932326a2266502484ecc471b7879096d189d8d2fbd0a90355ac06927aec
MeowEngineSchema.kt          80185e6a643e4872caf77f3c1569264ca224066a8952e5581286520b390328e2
meow-native/src/script_engine.rs 8f4588c75767df0fe57b663d23630766d4bd14cade7dc151b15199a581db9866
```

## 此次采用的兼容策略

只复用共享 JS 的节点过滤、地区/家宽分类、组拓扑和融合规则；不执行 FlClash 的全局设置、Node-DNS 及 TLS 指纹注入。DNS 等非分流字段保留输入。由于原 provider 会重建，含 `rule-set:` 依赖的 DNS 会先报错，保持输入不变。

这项平台适配没有改变共享规则图、业务组名字、规则顺序或现有客户端行为，因此不触发其他正式产物的语义修改。候选另设 `--check` 与 Node VM 回归；Android QuickJS、App 最终 YAML、原生内核及实际连接均待验。

本机未发现可用 meow CLI；没有下载依赖或运行开发 App。开发工作树中的既有 CI/历史日志只用于定位接口，不作为此脚本的通过证据。完整剩余条件见[支持队列](../../docs/support-queue.md#aerove-lite-meow)。
