# AEROVE Lite / Meow 配置联调核查

记录已通过的候选检查、尚未接通的生产入口和实际设备验收，供支持队列引用。

[使用说明](README.md) · [支持队列](../../docs/support-queue.md#aerove-lite-meow) · [接口历史快照](REFERENCE-AEROVE-Lite.md)

## 核查基线

核对时间：2026-10-24 11:06 UTC。AEROVE 开发会话仍在运行；App 工作树已提交且干净，固定为 [5d2c2bb550ab54ae485837c1dec55e961e273dab](https://github.com/IvanSolis1989/Aerove/commit/5d2c2bb550ab54ae485837c1dec55e961e273dab)。本页是该时点的核查记录，候选包不等于此提交已整合的代码。

候选来源为开发环境保留的 `smart-config-meow-integration/`。AndroidTest fixture 固定本仓库 `764d275d66123e8ee6aaca393b29dbebe06a91e2`，不是现行文件身份的完整 APK 验收。

## 已完成的候选检查

| 项目 | 实际证据与适用范围 |
| --- | --- |
| Kotlin 准入候选 | `kotlin-validator-01/tests.log`：JUnit 4.13.2，`OK (74 tests)`，6.333 秒。覆盖三阶段准入、prepared 资源根接口、proxy/header 传输合同及逻辑规则；使用注入实现，未执行真实原生转换。 |
| AndroidTest 候选编译 | `script-android-01/verification.json`：SDK 36 AndroidTest 编译返回 0；编译日志保留两条既有 no-cast 警告。未运行 Android 或 QuickJS JNI。 |
| 规则 fixture 保存读回 | 同一收据记录 149 个真实 provider payload 读回；脚本及 payload 共 4,387,986 字节。尚未由原生 payload 解析器执行。 |
| 原生回归源码 | `native-schema-01/verification.json`：新增 4 个真实转换/资源/逻辑规则回归源码，严格补丁回放通过；`RustExecuted=false`，因此只记录源码准备完成。 |

这些检查可复用为后续整合依据，不能推导生产接线或实际路由已通过。

## 生产接线与联调剩余项

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
