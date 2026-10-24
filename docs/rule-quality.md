<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-rule-quality-mobile.svg">
  <img src="assets/readme/page-rule-quality.svg" width="100%" alt="技术指南">
</picture>

# 规则质量台账

维护来源收据、有序规则差分与误伤例外。按实际变更类型选择检查入口，并在自动发布前核对对应门禁。

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="下载配置"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="文档目录"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="检查与排障"></a>
</p>

[下载配置](guide/downloads.md) · [文档目录](README.md) · [检查与排障](guide/dns-and-verification.md)

## 使用入口

1. 补充域名增量先走受限补丁计划；完整上游刷新使用来源同步链路。
2. 用有序语义差分和 ADFP 校验复核目标、顺序与范围。
3. 按自动同步门禁和 [发布批次检查](release-batch.md) 读回收据。

规则权威源仍是 [`routing-graph.js`](../rulesets/source/routing-graph.js)。本页说明来源收据、有序语义差分、ADFP 例外校验和自动同步的审批边界。文件级发布核验见 [release-batch.md](release-batch.md)，服务角色及证据见 [claude-service-dependencies.md](claude-service-dependencies.md)。

## 补充规则增量同步

对已冻结的本地补充规则，`tools/apply-supplemental-to-snapshot.js` 默认只读计划；显式指定 Git 基线、provider、文件和精确 DOMAIN 增量，再用 `--write` 调用已核验的原生转换器。

工具拒绝其他 provider、规则顺序、隐含新增或补丁外载荷变化；删除不能恢复历史隐藏的后续 owner，故拒绝此操作。它只优化目标段并执行全局精确去重，不重做旧资产全量优化。之后由既有生成器同步 14 客户端。Egern 使用显式增量收据验证原快照与目标变化，其余资产冻结。

`rulesets/generated/supplemental-patch.json` 记录本次实际消费的本地输入、旧 Git 基线和稳定载荷的前后哈希；manifest 的阶段哈希单列，不能冒充后续生成的终态。质量台账仅在当前载荷、本地输入和输出仍匹配时标记 `current-payload-bound`，否则作为历史阶段收据。

未读取的旧上游保持 `legacy-unknown`。新增两个 Claude Desktop 精确主机依据官方网络清单登记，不扩展到 Anthropic 根域或供应商后缀；未进行真机流量测量。

## 来源、版本与生成收据

```sh
node tools/sync-mihomo-mrs-rule-providers.js --keep-cache
node tools/refresh-rule-quality.js
node tools/refresh-rule-quality.js --check
```

在线同步记录实际请求 URL、最终来源 URL、读取字节的 SHA-256、来源身份和可验证版本。只有最终消费的 URL 已固定到 commit SHA，且仓库和文件路径与请求来源一致时，才记录 `resolved_commit`；可变分支、镜像名或本地缓存不能推定 commit。

`--offline` 只使用已有且哈希匹配的缓存，缺失或不匹配即失败，不会联网替代。`--legacy-snapshot` 为旧资产生成带缺口标记的收据。

台账输出为 `rulesets/generated/source-ledger.json` 和 `rulesets/generated/adfp-exceptions.json`，并在 fused manifest 中记录台账、异常登记表和融合 payload 指纹。

本地文本输入与生成文件先将换行统一为 LF，再计算实际消费内容的哈希，避免 Windows 与 Unix 检出差异；远端输入按实际获取字节计算哈希，`.mrs` / `.srs` 二进制资产按原始字节计算，不做换行或内容规范化。

收据应对应工具实际消费的字节。

已发布的 MRS/fused 资产没有原始远端输入收据。当前哈希只证明仓库现存字节，不能反推当时下载的 URL 内容、版本或 commit。本次复用这些 legacy payload，没有伪造历史来源。今后的完整构建会把实际消费的输入与已有 MRS 收据绑定并核对字节；复用已有资产时只验证已有绑定，不能补回缺失的历史输入。

上游许可依据保存在 `rulesets/source/upstream-sources.json`。没有核实的许可保持 `unknown`；来源仓库名称或内容哈希都不构成再分发授权。

## 有序规则语义差分

```sh
node tools/validate-ordered-rule-semantics.js --baseline-ref <SHA> --mode domain-projection --check --output rulesets/generated/semantic-diff.json
```

`domain-projection` 对有限域名探针比较规则类型、条目和顺序、目标策略、遮蔽及跨策略重叠；每个结果保留 `match`、`no-match`、`unknown` 三态。有限 witness 是具体样例，不证明所有域名或流量等价。

此投影不模拟 IP、进程、端口、DNS 结果、客户端解析器或实时网络；无法判断的规则和输入保持 `unknown`。

若 baseline 与当前输入有变化，`--check` 需要 `--expected-changes <JSON>` 审核记录，至少绑定 `beforeIdentity`、`afterIdentity`、`reviewedChangeDigest`。

存在 unknown 或截断证据时，还需 `reviewedEvidenceDigest`；unknown 需 `acknowledgedUndecidableDigest` 与报告一致，截断需 `acknowledgeTruncation: true`。

身份和摘要须从本次报告原样填写，不接受通配或编造值；确认记录只表示审核了该有限证据，不会把 unknown 改成匹配结论。

PR 与 main 的验证 workflow 会读取可选的 `rulesets/source/semantic-approval.json`。语义变化需要先生成报告、人工审核并填写此文件，再运行检查；无变化时无需审批文件。旧文件只有在基线、当前身份和摘要都吻合时才有效。

## 现有 ADFP 例外登记

`rulesets/source/adfp-exceptions.json` 登记四个 provider：`scki-adfp-direct`、`scki-adfp-ai`、`scki-adfp-intl-site`、`scki-adfp-payments`。

记录包含稳定 ID、规则、`reason`、`evidence` 及其 `level`、`match_scope`、`target_policy`，并为每项提供正例、反例和预期匹配关系。例外变化必须同时更新补充载荷与登记表，并给出来源证据及精确范围。

```sh
node tools/validate-adfp-exceptions.js
```

校验器检查 registry 与 payload 双向覆盖，验证 source graph 中四个 provider 的目标及其在 anti-ad 前的顺序，并核对正反例的声明范围。样例只检查记录的域名范围，不代表服务可用性。

## 自动同步与发布门禁

[`sync-mihomo-mrs-rule-providers.yml`](../.github/workflows/sync-mihomo-mrs-rule-providers.yml) 每周运行一次全量上游同步、MRS/fused 构建和 14 客户端派生，再执行有序语义、质量收据、Claude 有限覆盖及完整文件批次检查。

只有门禁通过才会进入提交和 push；文件按收据精确暂存，暂存后与提交后再次验哈希。远端 main 若移动就中止，须对新基线重新构建验证。无论成功或失败，workflow 都尝试上传可生成的来源、例外、Claude、语义及发布批次收据。

手动 `workflow_dispatch` 可传 `semantic_approval_path`，仅接受仓库内 `rulesets/source/*.json` 文件，且禁止 `..` 路径段。审核文件中的身份、变更/证据摘要须来自该次报告；unknown 和截断按上节明确确认。

未提供有效审核时，变化会阻止自动 push，workflow 仍保留证据供复核。定时任务没有审批输入，因此不会无条件把上游变化推到 main。

## 客户端原生格式依据

<details>
<summary>展开逐客户端的格式来源与证据边界</summary>

源图统一提供规则身份、顺序和目标意图；既有生成器继续输出各端原生格式。本次没有引入新的客户端字段或改变其匹配方式。

### Clash Party、CMFA、FlClash、OpenClash

- **仓库格式**：Mihomo JS/YAML、MRS
- **官方格式依据或本次证据边界**：[Mihomo rule providers](https://wiki.metacubex.one/en/config/rule-providers/)、[routing rules](https://wiki.metacubex.one/en/config/rules/)；[CMFA](https://github.com/MetaCubeX/ClashMetaForAndroid)、[OpenClash](https://github.com/vernesong/OpenClash/wiki)

### Shadowrocket

- **仓库格式**：原生 `.conf`、远程文本规则集
- **官方格式依据或本次证据边界**：本仓库[配置样例](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/Shadowrocket.conf)与 [AGENTS.md 能力合同](../AGENTS.md)是本次可核证依据。未找到已验证的官方规则语言规范；本次不据第三方指南推断兼容性，也未新增运行时字段。

### Stash

- **仓库格式**：生成 YAML、rule-provider、MRS
- **官方格式依据或本次证据边界**：[Rule Sets](https://stash.wiki/en/rules/rule-set)：MRS 适用于 `domain` / `ipcidr`；本次不新增字段。

### Egern

- **仓库格式**：YAML profile、Egern 原生 rule-set
- **官方格式依据或本次证据边界**：[Egern Rules](https://egernapp.com/docs/configuration/rules/)：规则按列出顺序匹配，`rule_set` 引用本地或远程文件。

### sing-box

- **仓库格式**：JSON、二进制 `.srs`
- **官方格式依据或本次证据边界**：[sing-box rule-set](https://sing-box.sagernet.org/configuration/rule-set/)：`source` / `binary` 与本地 / 远程 rule-set 结构。

### v2rayN（Xray core）

- **仓库格式**：Xray routing JSON fallback
- **官方格式依据或本次证据边界**：[v2rayN 官方自定义路由说明](https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules)规定规则对象数组，并引用 [Xray RuleObject](https://xtls.github.io/config/routing.html#ruleobject)。

### Surge

- **仓库格式**：`.conf`、远程 `RULE-SET`
- **官方格式依据或本次证据边界**：[Rules overview](https://manual.nssurge.com/rules/overview.html)、[Rule Sets](https://manual.nssurge.com/rules/ruleset.html)：按序检查，规则集整体关联一个策略。

### Loon

- **仓库格式**：`.conf`、规则订阅
- **官方格式依据或本次证据边界**：[Loon Rules](https://nsloon.app/en/docs/category/%E8%A7%84%E5%88%99/)：规则类型及远程规则订阅。

### Quantumult X

- **仓库格式**：`[filter_remote]` / `[filter_local]`
- **官方格式依据或本次证据边界**：[官方示例配置](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)与[官方仓库](https://github.com/crossutility/Quantumult-X)。

### Passwall

- **仓库格式**：shunt rule，`.srs` 资产
- **官方格式依据或本次证据边界**：[上游 shunt rule editor](https://github.com/Openwrt-Passwall/openwrt-passwall/blob/main/luci-app-passwall/luasrc/model/cbi/passwall/client/shunt_rules.lua)。

### Passwall2

- **仓库格式**：shunt rule，`.srs` 资产
- **官方格式依据或本次证据边界**：[上游 shunt rule editor](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua)。

这些链接仅支持表中所述的格式和字段依据，不替代逐版本、逐设备的运行验证。Shadowrocket 的官方规则语言证据缺口在本页明确保留。

</details>
