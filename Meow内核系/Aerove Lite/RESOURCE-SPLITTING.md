# AEROVE Lite 规则资源拆分依据

本轮保留共享 fused 规则资产，为 AEROVE Lite 单独派生三个广告 MRS 分片，以满足固定 App 的资源准入预算。当前交付是配置候选：本地原生转换与官方 meow 校验已通过，固定 App、JNI、Android、真实 HTTP 下载及 VPN 分流仍待验收。

[使用说明](README.md) · [联调核查](VALIDATION.md) · [资源及 SHA 清单](rule-assets/manifest.json) · [适配总清单](../adapter-manifest.json)

## 实际阻断与选择

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

本轮不修改 App 安全门槛，不删除规则，不改共享 fused 资产。官方 meow YAML 保持 `v6.0.20-meow.3` 原字节；Lite JS 为 `v6.0.20-meow.4`。后续上游刷新必须重新生成并检查全部资源，不能将本次三片数量视为永久常量。跨平台源文本指纹使用 canonical LF，MRS 本身使用原始二进制 SHA；LF/CRLF 回归与资产损坏拒绝均有测试。

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

原广告资源有 411,634 条、1,260,199 个点分标签，因此至少需要三片。只有该资源超限，其他 148 个规则源复用。

| 分片 | 原生重解码条数 | 点分标签 | MRS 字节 |
| --- | ---: | ---: | ---: |
| `part-001` | 146,916 | 499,998 | 1,384,469 |
| `part-002` | 169,023 | 499,997 | 1,436,069 |
| `part-003` | 95,695 | 260,204 | 686,621 |

三片均经官方 Mihomo `v1.19.32` 原生重新解码，匹配字符串集合及并集与原 411,634 条一致，未用仅 YAML 计数代替 MRS 结果。投影后为 **151 个规则 provider、170 条主规则、55 个策略组**，规则资源合计 **4,432,545 字节**。输入身份、每片完整 SHA、字节数及逐项预算以 [rule-assets/manifest.json](rule-assets/manifest.json) 为准；脚本及投影身份以 [adapter-manifest.json](../adapter-manifest.json) 为准。

## 验证范围与接取条件

- 相关 22 项测试通过，覆盖 MRS 原生往返、Lite 投影、共享产物不变性与官方核心校验。
- 官方 meow `0.26.1 -t` 分别通过官方 YAML 的 `149 provider / 168 rules / 55 groups` 和 Lite JS 投影的 `151 / 170 / 55`。使用本地 `file` 资产及合成节点，只证明这些输入的本地配置转换，不能替代固定 App/JNI/Android 或 HTTP 下载验收。
- 25 项发布批次合同测试通过，覆盖分片目录闭合、资产二进制 SHA 绑定、孤儿文件与损坏拒绝。专版资产进入独立清单后，由同一批次治理，未修改共享 fused 文件命名合同。
- 固定脚本与资源 SHA、来源声明、许可证事实及核查终态见[机器可读收据](resource-split-evidence.json)。App 验收仍为待完成；发布指针与 CI 另在交付记录保存，不由本地测试推定。

AEROVE Root 接取后，仍需在固定 App 与核心执行当前脚本及全部实际资源，核对下载响应字节和 SHA、最终 YAML、provider 路径及 bundle 总预算。沿用生产不可变保存路径：逐资源预检 → 字节及 manifest 校验 → 完整 `validatePrepared` → 再次字节校验；重新载入时再次核对来源、配置与资产 SHA。成功后再验 VPN、广告匹配、国内外与业务出口，并记录失败、取消、恢复和资源更新结果。任何门槛失败应保留原错误，不删规则或放宽准入。

## 来源与许可证边界

根 [README](../../README.md) 和 [许可说明](../../docs/guide/acknowledgements.md#license) 声明仓库采用 MIT、第三方规则与数据遵循各自许可证；当前没有 tracked `LICENSE` 正文文件，不能声称已随仓库保存该正文。

广告段的 10 条源规则记录在 [fused manifest](../../rulesets/generated/fused/manifest.json) 的 `source_segments` 中，段 ID 为 `scki-fused-010-ad`。来源身份与许可证明细唯一入口为 [upstream-sources.json](../../rulesets/source/upstream-sources.json)，本次捕获与输出关联见 [source-ledger.json](../../rulesets/generated/source-ledger.json)：

- `anti-ad` 当前捕获来源为 DustinWin，声明 `GPL-3.0`；Sukka 服务声明 `AGPL-3.0`。两者均为 `declared` 且 `component-review-required`，固定声明 URL、提交及 LICENSE SHA 见 registry；代码仓库声明不等于全部聚合数据许可已核完。
- MiHomoer 与 Accademia 当前为 `unknown`，不能推断许可已清。
- 拆片保留原来源，不将派生规则统一标为 MIT。Mihomo `v1.19.32` 仅作为本地转换工具，本交付不附带其二进制；固定 App 核心 `727ddcd…` 的 MIT 身份沿用既有源码证据，也不覆盖第三方规则数据。

来源及许可未决项须继续保留，技术校验通过不代表许可审查完成。
