[English](2026-11-28-blackmatrix7-source-resilience.md) | **简体中文**

# Blackmatrix7 规则来源韧性复查

2026-11-28 核对基线 `485453aa06f94db8453209a125f204c9fd0553a1`。GitHub 标记原始仓库已归档，最后默认分支提交为 `0b6897dc`。当前版本继续使用已经验收的融合资产。后续按业务逐项迁移，优先固定新输入及其来源证据。 [原仓库](https://github.com/blackmatrix7/ios_rule_script) · [归档源快照](https://github.com/blackmatrix7/ios_rule_script/tree/0b6897dc17e0c513d25449c935a9694818e32f0c)

## 使用范围

401 个原始 provider 中有 245 个指向 Blackmatrix7，转换后的 525 项中有 326 项归属这些原始 provider。245 项均能连接到融合分段的直接规则引用，涉及 28 个策略。历史记录中的 243 项只证明已有生成输出，2 项记录内容哈希。245 项的历史输入都没有已绑定的上游 commit。最终资产纳入的谓词还受去重和优先级影响。 [来源台账](../../rulesets/generated/source-ledger.json) · [融合清单](../../rulesets/generated/fused/manifest.json)

| 先核对的业务 | 原始 provider 数 | 迁移时保留的证据 |
| --- | ---: | --- |
| 广告拦截 | 10 | 合法服务误拦刚好与拦截命中都要有见证 |
| 金融支付 | 4 | 支付、认证及共享 CDN 的先后顺序和范围 |
| AI 服务 | 3 | 登录、API、预览、内容及遥测的独立证据 |
| Apple、Google、Microsoft | 9、3、1 | 账号、更新、推送和业务端点的区分 |
| 下载更新、工具与服务 | 12、15 | 分开核对分发、应用登录和共享托管 |
| 国内流媒体 | 41 | 先核验国内 CDN 与国际版对照，再核验长尾服务 |

MetaCubeX 固定构建工作流含 26 处 Blackmatrix7 原始地址引用。其中可见 Google、GitHub、Apple、Microsoft、OpenAI、Netflix 等的 lite 文件，以及中国域名变量和部分全量数据预处理。备用传输地址有助可用性，这些同源类别的更新仍依赖同一归档仓库。映射来自工作流文字，实际生成字节由各构建收据证明。 [MetaCubeX 工作流](https://github.com/MetaCubeX/meta-rules-dat/blob/4178770badecb1b349fbcd62c737e0d7a2079729/.github/workflows/run.yml)

## Claude 来源试点

用同一组 18 个官方证据要求走 AI 的有限域名见证核对。原始列表列反映域名谓词覆盖，现有融合资产列反映静态首命中。范围包括登录、API、下载、预览、内容和 MCP，另加遥测、共享服务和合成反例。 [本项目服务台账](../../rulesets/source/claude-service-dependencies.json) · [Claude Code 网络指南](https://code.claude.com/docs/en/network-config#network-access-requirements) · [Claude Desktop 网络指南](https://code.claude.com/docs/en/desktop#network-access-requirements)

| 输入 | 18 项中的命中 | 证据和适用范围 |
| --- | ---: | --- |
| 当前 Smart-Config-Kit | 18 | 静态首命中为 AI。共享 `storage.googleapis.com` 仍走 Google 服务。 |
| Blackmatrix7 Claude | 11 | 固定文件含 3 条域名谓词。匹配未证实的 Fathom 主机，当前融合产物该主机先由广告拦截命中。 [固定文件](https://github.com/blackmatrix7/ios_rule_script/blob/0b6897dc17e0c513d25449c935a9694818e32f0c/rule/Clash/Claude/Claude.yaml) |
| v2fly Anthropic | 18 | MIT 仓库，固定列表可作服务差分。整个 `claude.app` 还匹配合成的非预览子域，并纳入第三方遥测端点。 [固定文件](https://github.com/v2fly/domain-list-community/blob/f68dab92e2ce656bbd81a4ae424de79b179f0f77/data/anthropic) |
| ma-wenqian Claude | 17 | MIT 仓库，缺少 `*.livepreview.claude.app` 见证，包含 Segment 的共享后缀及更宽的 IP 条目。IP 条目超出本次域名投影。 [固定文件](https://github.com/ma-wenqian/ai-proxy-rules/blob/b8054cd055813f9a1b04f5113eef3f0ca13022f2/rules/claude.list) |

VPSDance 的 Anthropic 来源明确导入 v2fly，二者的相同谓词不能作为两份独立证据。迁移试点可使用本项目已核验的精确主机和官方限定后缀，先在单个 provider 的冻结输入差分中证明既有必要首命中、共享服务和遥测仍符合预期，再核验客户端导入及实际功能。当前 `unrelated.claude.app` 的合成见证也走 AI，首命中为 `DOMAIN-KEYWORD,claude`，现有宽关键词也需要边界回归。本次试点保留原有生产规则。 [VPSDance 来源声明](https://github.com/VPSDance/ai-proxy-rules/blob/8e4fadcb035738b0f80f1379b501723ee39490f8/data/sources/anthropic.yaml)

## 复核

从基线运行 `node tools/audit-blackmatrix7-exposure.js` 可读回每个来源、哈希状态、归一化条目、策略及融合分段。可选参数接受已保存的 MetaCubeX 工作流，输出其中的文字引用和目的路径。工具将 JSON 写至标准输出。

Accademia、szkane、MiHomo-Hagezi 的仓库 LICENSE 已用固定文件、字节数、SHA-256 和许可名称登记。聚合规则的组成来源仍按各自条款核对。 [许可登记](../../rulesets/source/upstream-sources.json)
