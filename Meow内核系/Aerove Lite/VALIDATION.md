# AEROVE Lite / Meow 配置联调核查

记录已通过的候选检查、尚未接通的生产入口和实际设备验收，供支持队列引用。

[使用说明](README.md) · [支持队列](../../docs/support-queue.md#aerove-lite-meow) · [接口历史快照](REFERENCE-AEROVE-Lite.md)

## 核查基线

### 2026-10-27：真实资源拒绝与专版候选

本次已重新读取开发会话，并核对固定 beta16 的生产源码和 Android execution 记录。[run 40335340043](https://github.com/IvanSolis1989/Aerove/actions/runs/40335340043) 已结束，终态为 failure；以下完成项不代表整轮验收通过。

| 已完成项目 | 固定源码或实际运行证据 |
| --- | --- |
| Meow 生产校验器接线 | [LiteApplication.kt:122](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/app/src/main/java/dev/aerove/lite/LiteApplication.kt#L122) 已使用 `CompatibilityValidator.forMeow`，注入普通 native、prepared native、规则 preflight 与 verified features。旧文档中的 factory 未迁移项已解决。 |
| 三阶段与 prepared JNI 链路 | [ResourceBundleManager.kt:139](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/ResourceBundleManager.kt#L139) 已接通 source → 资源 preflight → prepared；[MeowProfileValidator.kt:102](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/MeowProfileValidator.kt#L102) 在资源封存后调用真实 prepared native。源码链已接通，本次 Smart 用例在到达完整 prepared 前失败。 |
| 逻辑规则、proxy/header 与容量接线 | [MeowCompatibilityValidator.kt:116](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/MeowCompatibilityValidator.kt#L116) 已准入逻辑及 Android 元数据规则；资源管理把 provider proxy/header 传入真实 JNI 下载器；资源容量已统一为 256，bundle 仍限 256 MiB。完整逻辑转换、自定义 header 实传和容量边界全流程仍须运行验收。 |
| QuickJS 失败原子性 | `realQuickJsPreservesInputAndScriptFailuresCannotCommitPartialOverrides` 在真实 Android execution 中返回 0，保留输入、拒绝部分覆写的用例已通过。 |
| 真实 JNI 命名 HTTP 代理与取消 | `realJniNamedHttpProxyAndCancellationKeepWritersOwned` 的 execution 返回 0，覆盖 CONNECT、源站不直连、未知代理失败与取消后停止写入；测试请求使用空 headers，未证明自定义 header 实际传输。 |
| 原生文件规则解析 | `RuleFileNativeTest` 的四项真实 JNI 文件解析及损坏拒绝用例 execution 均返回 0。 |

实际运行依据位于开发环境 `lite125-remaining-readback/`：QuickJS 与命名代理用例分别见 `job-0.log:6422–6428`、`:6436–6442`；文件解析见 `job-0.log:6355,6369`、`job-1.log:6463`、`job-3.log:6398`。`STATUS-RECORDS.json` 按 `phase=execution` 核对，discovery 的返回 0 只表示发现用例。

固定 beta16 `d52726dc24756847b2b268d307a611cc37f994a3` 的 [run 40335340043](https://github.com/IvanSolis1989/Aerove/actions/runs/40335340043) 实际执行 Smart 测试后，被广告资源 411,634 条记录超过单资源 250,000 条的准入拒绝；不能把 discovery 或部分测试通过视为该用例通过。

本仓库已生成无损三片候选，同时保留 500,000 点分标签等全部单资源预算；规则仍在原优先级位置命中同一策略组，共享 fused 及官方 Meow YAML 字节保持。完整 SHA、来源、许可状态、原生检查与 App 剩余验收见 [RESOURCE-SPLITTING](RESOURCE-SPLITTING.md)及 [rule-assets/manifest.json](rule-assets/manifest.json)。这项候选尚未取得固定 App/JNI/Android 的通过结果。

当前待验是：固定 App 接取同批脚本与资源，完整跑通全部资源 preflight、可信 Geo 上下文及 prepared 转换，读回最终 YAML；补齐自定义 header 实传、资源更新/恢复及最终 bundle 预算边界，最后完成 VPN、广告与国内/国外及业务出口验收。源码接线完成不再列作未实施项。

以下保留早期固定提交的历史核查，不将其中旧生产状态推广为 beta16 当前状态。

### 2026-10-24：早期准入候选

核对时间：2026-10-24 11:06 UTC。AEROVE 开发会话仍在运行；App 工作树已提交且干净，固定为 [5d2c2bb550ab54ae485837c1dec55e961e273dab](https://github.com/IvanSolis1989/Aerove/commit/5d2c2bb550ab54ae485837c1dec55e961e273dab)。本页是该时点的核查记录，候选包不等于此提交已整合的代码。

候选来源为开发环境保留的 `smart-config-meow-integration/`。AndroidTest fixture 固定本仓库 `764d275d66123e8ee6aaca393b29dbebe06a91e2`，不是现行文件身份的完整 APK 验收。

## 2026-10-24 历史候选检查

| 项目 | 实际证据与适用范围 |
| --- | --- |
| Kotlin 准入候选 | `kotlin-validator-01/tests.log`：JUnit 4.13.2，`OK (74 tests)`，6.333 秒。覆盖三阶段准入、prepared 资源根接口、proxy/header 传输合同及逻辑规则；使用注入实现，未执行真实原生转换。 |
| AndroidTest 候选编译 | `script-android-01/verification.json`：SDK 36 AndroidTest 编译返回 0；编译日志保留两条既有 no-cast 警告。未运行 Android 或 QuickJS JNI。 |
| 规则 fixture 保存读回 | 同一收据记录 149 个真实 provider payload 读回；脚本及 payload 共 4,387,986 字节。尚未由原生 payload 解析器执行。 |
| 原生回归源码 | `native-schema-01/verification.json`：新增 4 个真实转换/资源/逻辑规则回归源码，严格补丁回放通过；`RustExecuted=false`，因此只记录源码准备完成。 |

这些检查可复用为后续整合依据，不能推导生产接线或实际路由已通过。

## 2026-10-24 历史生产接线与阻断

| 项目 | 固定 App 源码或阻断 | 验收条件 |
| --- | --- | --- |
| 导入与资源准备的校验器 | [LiteApplication.kt:88,96](https://github.com/IvanSolis1989/Aerove/blob/5d2c2bb550ab54ae485837c1dec55e961e273dab/apps/aerove-lite/app/src/main/java/dev/aerove/lite/LiteApplication.kt#L88) 仍创建并传入旧 `CompatibilityValidator`；旧 provider 字段表未准入 proxy/header。 | 接好 `MeowProfileValidator` 等候选的生产 factory，覆盖导入、准备和启动全链路。 |
| 直接逻辑规则 | 生产 [MeowCompatibilityValidator.kt:116](https://github.com/IvanSolis1989/Aerove/blob/5d2c2bb550ab54ae485837c1dec55e961e273dab/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/MeowCompatibilityValidator.kt#L116) 未准入 AND/OR/NOT；新候选已补。 | 整合候选并使用实际最终配置通过完整原生转换。 |
| 可信 Geo 资源上下文 | `OPEN-BLOCKER.json`：string-only 原生 validate 遇到 5 条含 GEOSITE 的逻辑规则时，报 `offline_geodata_resource_context_required`。 | 校验必须接收真实且不可变的 prepared bundle 目录，并沿用资源租约；不能删除规则或降为仅语法校验。 |
| 命名代理与 header 下载 | 生产 [ResourceDownloader.kt:26](https://github.com/IvanSolis1989/Aerove/blob/5d2c2bb550ab54ae485837c1dec55e961e273dab/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/ResourceDownloader.kt#L26) 固定 `Proxy.NO_PROXY`，资源管理调用未传入 provider proxy/header。 | 接通真实代理图的下载路径，实际验证代理选择、请求头、失败报告及规则更新。 |
| 资源数量上限 | [ResourceBundleManager.kt:654](https://github.com/IvanSolis1989/Aerove/blob/5d2c2bb550ab54ae485837c1dec55e961e273dab/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/ResourceBundleManager.kt#L654) 的 `MAX_RESOURCES=128`，小于脚本的 149 个规则源；备份恢复另有 128 条限制。 | 统一有界资源容量，覆盖导入、准备及备份恢复，保留字节预算和超限拒绝；开发会话正在处理，尚无整合验收结果。 |
| 运行装配 | Runtime composer 已使用 Meow schema，不能替代导入/准备入口的迁移。 | 读回宿主最终 YAML，核对规则顺序、资源路径和字段所有权。 |
| QuickJS / JNI / Android | 本轮脚本候选收据明确 `androidNotRun=true`、`nativeQuickJsNotExecutedLocally=true`。 | 在目标 APK 执行当前脚本，读回最终 YAML，经完整原生校验后完成 VPN、广告、国内/国外及业务出口测试；分别记录模拟器和真机。 |

对应旧接口快照见 [REFERENCE](REFERENCE-AEROVE-Lite.md)。

## 既有测试与 APK 的边界

原生 [run 40080923015](https://github.com/IvanSolis1989/Aerove/actions/runs/40080923015) 的源码为 `2bfd4f0…`：267 项主测试、2 项 child、17 项 cfg-off 通过，但 Core 第 4 条命令因 E0277 编译失败，后续 22 条命令和 API/listener gate 未进入，Android 跳过，运行终态为 failure。

旧 beta.9 APK 的源码为 `8d4bc572aa6b1984bd084e0d72d48b7c6b9f7e8e`，属于更早候选。QA83 只有 2/12 外观组合、4 张 PNG，功能测试有失败和取消；这些结果不能用于宣布本轮配置接线、真机 VPN 或分流验收完成。

本仓库官方 meow-rs v0.26.1 的配置校验已另行通过，范围见[官方核心依据](../Meow/REFERENCE-meow-rs.md)；它不替代 Lite 的宿主与实际连接检查。

## 保存证据指纹

以下相对路径均位于开发环境的 `smart-config-meow-integration/`，SHA-256 来自本轮实际读取。后续产物变化需重新核查其适用范围。

```text
kotlin-validator-01/tests.log
f101719b6caa58409c5ed15b7ddfd04ea963172f1a77d6b3fef14c82ce79f870

native-schema-01/verification.json
b51ff023e3d69a8221f3e4928e76a45cb66ba5a87a7ace6e9dda9133c2b57251

script-android-01/verification.json
c452eaf4fe6f3a5e3a66d3ba3727e95098eff93c738a2cddd7b0eb3d18e2dd14

script-android-01/OPEN-BLOCKER.json
2c37670f51ad1ffe5ab270f800eec7afb2be21ed6e00993428f80ca6781ac1d9
```
