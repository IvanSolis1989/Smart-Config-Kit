# AEROVE Lite 规则资源拆分依据

本轮保留共享 fused 规则资产，为 AEROVE Lite 单独派生四个广告及两个国内站点 MRS 分片。固定 Rust reader 与 App 原样头部/条目预算的本地检查已通过；当前仍是配置候选，完整 App 原生预检、JNI、Android、真实 HTTP 下载及 VPN 分流待验收。

[使用说明](README.md) · [联调核查](VALIDATION.md) · [资源及 SHA 清单](rule-assets/manifest.json) · [适配总清单](../adapter-manifest.json)

## 实际阻断与选择

固定 beta18 源码 [`457fab8455ac8713fc9828e129d2050b11bf1beb`](https://github.com/IvanSolis1989/Aerove/commit/457fab8455ac8713fc9828e129d2050b11bf1beb) 的 [run 40420651068](https://github.com/IvanSolis1989/Aerove/actions/runs/40420651068)，attempt 1 实际执行全 Smart 用例，旧 `v6.0.20-meow.4` 的广告 `part-001` 报 `rule-provider trie exceeds 500000 nodes`。该失败来自原生展开条目的点分标签累计，门槛没有提高。

以下 beta16 是历史阻断：

固定 App 源码为 [`d52726dc24756847b2b268d307a611cc37f994a3`](https://github.com/IvanSolis1989/Aerove/commit/d52726dc24756847b2b268d307a611cc37f994a3)，固定核心为 `727ddcd06f592e2f12c5222c4de6cce328df808c`。[Actions 40335340043](https://github.com/IvanSolis1989/Aerove/actions/runs/40335340043) 中，`SmartConfigMeowScriptAndroidTest.realQuickJsRepositoryComposerAndAllPinnedRulePayloadsReachNativeValidation` 实际执行后失败，shard 2、JUnit 状态 `-2`。开发留存的 `lite125-remaining-readback/FAILURES.json` 保存该 Smart 特定案例，原 `job-2.log:6533` 的错误为：

```text
$.rule-providers.scki-fused-010-ad-domain
rule_set_invalid: $.payload.mrs.count:
official MRS header declares 411634 entries, over 250000
```

原资源为 `scki-fused-010-ad-domain.mrs`，3,350,568 字节，SHA-256 `e67273b13675c7ab758f32a4bc697b9d845a6f750e1688fba149e82fa7b9b848`；该次夹具固定本仓库 `89abb221a157acc98d6b52c85583e6b5a5b2742b`。App `ResourceBundleManager.kt:873` 是异常构造，`:465–472` 调用并包装规则预检，实际拒绝来自 Rust 的 MRS 头部计数检查。

| 方案 | 影响与本轮决定 |
| --- | --- |
| 共享 fused 资产统一拆分 | 会改变所有消费客户端的资源引用与生成合同，扩大本次 Lite 容量适配的影响范围。未采用。 |
| Lite 专版派生 | 从同一规则权威源及共享资产生成，保持策略顺序、目标组和完整匹配集合，仅投影 Lite 的 provider 与规则引用。采用。 |

本轮不修改 App 安全门槛，不删除规则，不改共享 fused 资产。官方 meow YAML 保持 `v6.0.20-meow.3` 原字节；本地 Lite JS 候选为 `v6.0.20-meow.5`。后续上游刷新必须重新生成并检查全部资源，不能将本次分片数量视为永久常量。跨平台源文本指纹使用 canonical LF，MRS 本身使用原始二进制 SHA；LF/CRLF 回归与资产损坏拒绝均有测试。

## 固定 App 预算与计数语义

预算事实见固定 App 的 [`config_validation.rs`](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/meow-native/src/config_validation.rs#L17-L35)、`:219–267` 和 [`ResourceBundleManager.kt`](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/ResourceBundleManager.kt#L863-L865)。

| 边界 | 每个规则资源的要求 |
| --- | --- |
| MRS 头部与实际展开条数 | 均不超过 250,000；IPCIDR 的头部插入计数可能大于合并后转储条数，两者都必须检查。 |
| 单条长度 | `trim` 后不超过 2,048 个 UTF-8 字节。 |
| 单条及累计标签 | `entry.split('.').count()` 每条不超过 128，逐条累加不超过 500,000；保留原始匹配前缀。 |
| 展开文本 | `Σ(UTF8(trim(entry)).length + 1)` 不超过 64 MiB，包含每条换行。 |
| 输入与 MRS 解压 | 输入不超过 64 MiB，MRS 解压不超过 256 MiB。 |

这里的 500,000 是完整展开条目的点分标签累计值，不是 MRS 二进制 `labels` 数组字节数，也不是整个 bundle 的标签上限。App 另有 **256 个资源、256 MiB bundle** 的聚合预算；配置解析还受通用 YAML 值预算约束，不能只验证各片。

固定 App 的 [`full-runtime.patch`](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/meow-native/patches/full-runtime.patch) 中，`DomainSetIndex::new_controlled` 使用 `index_slots=500000` 计算稀疏采样步长，控制 rank/select 索引内存，**不是额外的 500k 拒绝门槛**。二进制结构另检查 bitmap 的 set-bit 总数不超过 `labels.len()+1`；完整原生解码仍是必要条件。

## 已保存的派生资产

原广告资源的 canonical 集合包含 411,634 个唯一 predicate、1,260,199 个点分标签。Mihomo `DumpMrs` 将 `+.domain` 和裸域两个编码 leaf 折叠，固定 Rust reader 会枚举两条，因此 canonical 计数不能代替原生预算计数。旧广告 `part-001` 为 canonical 146,916 条 / 499,998 标签，Rust 实际展开 293,832 条 / 853,080 标签；`part-002` 为 169,023 / 499,997，Rust 展开 263,286 / 722,695，均被拒绝；`part-003` 通过。共享 `075-cn-site-domain` 的原生展开为 231,701 条 / 580,034 标签，同样超限。

当前候选将广告拆为四片、国内站点拆为两片，其他 147 个规则源复用；投影为 **153 个 provider、172 条规则、55 个 fixture 策略组，规则资源 4,496,629 字节**。两组 canonical 与实际 Rust leaf 集合均已独立核对，`missing=0 / added=0`；广告保留 411,634 个唯一 predicate / 1,260,199 个 canonical 标签，对应原生 652,813 个唯一 leaf / 1,835,979 个标签。每片 canonical 与 native 指标、SHA 和字节数见 [资源清单](rule-assets/manifest.json)，脚本身份见[适配清单](../adapter-manifest.json)。

## 验证范围与接取条件

- 隔离重建的固定真实 Rust `mrs_parser` SHA-256 为 `6ccf928c318e5524669775c35767cfa12dd21f349abe0bba430fb15507f34eb3`；全部 111 个投影 MRS 已通过该 reader 及 App 原样头部/条目预算，`native_metrics` 与 Rust `foreach` 一致。固定来源、SHA、字节与结果见 [native-budget-evidence.json](native-budget-evidence.json) 和 [resource-split-evidence.json](resource-split-evidence.json)。
- 23 项本地组件测试全部通过，无跳过；官方 Meow `-t` 通过原生 YAML 的 `149/168/55` 与 Lite 投影的 `153/172/55`，使用本地资源和合成节点。既有 25 项发布批次合同测试的输入未变，复用其已保存结果。
- 以上不执行完整 App checked matcher / native preflight、JNI、APK、HTTP 或 VPN；本地 harness 与官方 CLI 均不能代替完整 App 联调。发布 CI 和外部字节读回另记交付收据。
- 官方 Meow 原生 YAML v3 与共享 fused 规则图字节不变；这是 Lite 平台专属投影，不触发全平台重新生成。

AEROVE 接取同批脚本及资源后，仍需核对实际下载字节和 SHA、最终 YAML、provider 路径及 bundle 总预算，执行逐资源预检、完整 `validatePrepared`，再验 VPN、广告匹配、国内外与业务出口。App 自有 Geo、订阅及派生资源须计入 256 个资源 / 256 MiB 的最终预算。保留失败、取消、恢复和更新结果，不删规则或放宽准入。

## 来源与许可证边界

根 [README](../../README.md) 和 [许可说明](../../docs/guide/acknowledgements.md#license) 声明仓库采用 MIT、第三方规则与数据遵循各自许可证；当前没有 tracked `LICENSE` 正文文件，不能声称已随仓库保存该正文。

广告段的 10 条源规则记录在 [fused manifest](../../rulesets/generated/fused/manifest.json) 的 `source_segments` 中，段 ID 为 `scki-fused-010-ad`。来源身份与许可证明细唯一入口为 [upstream-sources.json](../../rulesets/source/upstream-sources.json)，本次捕获与输出关联见 [source-ledger.json](../../rulesets/generated/source-ledger.json)：

- `anti-ad` 当前捕获来源为 DustinWin，声明 `GPL-3.0`；Sukka 服务声明 `AGPL-3.0`。两者均为 `declared` 且 `component-review-required`，固定声明 URL、提交及 LICENSE SHA 见 registry；代码仓库声明不等于全部聚合数据许可已核完。
- MiHomoer 与 Accademia 当前为 `unknown`，不能推断许可已清。
- 拆片保留原来源，不将派生规则统一标为 MIT。Mihomo `v1.19.32` 仅作为本地转换工具，本交付不附带其二进制；固定 App 核心 `727ddcd…` 的 MIT 身份沿用既有源码证据，也不覆盖第三方规则数据。

来源及许可未决项须继续保留，技术校验通过不代表许可审查完成。
