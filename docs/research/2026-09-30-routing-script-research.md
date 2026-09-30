# Mihomo 分流脚本生态研究：节点输入、分类与失败关闭

**研究快照：2026-09-30（UTC）**

**补充横向研究：** [GitHub 按 star 排序搜索及九个直接脚本的比较](2026-09-30-github-routing-script-comparison.md)，附 [八组查询的完整分页证据](2026-09-30-github-search-evidence.json)。补充报告单独区分运行脚本、规则数据、模板和管理器，新增 Repcz、Perfect-Rules、selfproxy、HotKids 的源码及 VM 输入比较；本报告保留首轮实施依据与验收记录。

**范围：** 高星规则仓库、Mihomo 覆写脚本、OpenClash 配置及订阅管理工具；目标是为本仓库现有节点处理逻辑提供有边界的改进依据。

**本地基线：** `rulesets/source/routing-graph.js` v6.0.14；改动以 `main` 提交 `928eb7028d31883000921b2904ed952d22b30b07` 为基线，实施于本地 `codex/research-routing-overwrites` 分支。

## 结论

值得采纳的是输入边界和失败行为：运行前确认 `config.proxies` 是可处理数组；完全等价的重复节点保留首次出现项，同名异配置的歧义节点拒绝处理；远程 `proxy-providers` 输入明确拒绝并提示先由 SubStore 展平。本地倍率筛选默认关闭，显式开启才按数值解析和筛选。无原始显式节点时，JS 保持原始配置返回；如本地筛选最终排除全部节点，则全球选择组明确指向 `REJECT`。保留未筛除节点的原名及被其引用的代理链，不能靠改名或误删线路标签来消除问题。

本次实施覆盖 3 个 JS 覆写脚本及 2 个 OpenClash 脚本。固定的是 55 组可选组体系及其名称/路由语义；没有候选节点的地区组可按现有运行逻辑不生成。源规则图与 fused 规则语义保持 v6.0.14。现已完成节点预检、保守倍率解析、误删修复、链式引用及循环校验、空全球组 `REJECT`；源码与完整验收结果见文末。其他项目的 DNS/TUN 全套配置、整套策略和上游规则没有移植。

## API 快照与代表仓库

元数据来自 2026-09-30 UTC GitHub repository/commit API 快照；星数、`pushed_at` 和 License 按当日 API/仓库证据记录。深入分析的源码使用固定 SHA permalink；若分析提交和当日默认分支最新提交不同，表中分别注明。星数会持续变化，只表示快照时接口返回值。更新时间列是 GitHub `pushed_at`，不是仓库页面访问时间。

| 项目 | 类别 | Stars | `pushed_at`（UTC） | 快照提交 | License（API/仓库文件） | 主要取舍 |
|---|---|---:|---|---|---|---|
| [ACL4SSR/ACL4SSR](https://github.com/ACL4SSR/ACL4SSR) | 规则数据、模板 | 6,750 | 2026-09-27 03:03 | `bd00af4d515306cb24b951d51c4a7984f3fbe321` | CC-BY-SA-4.0 | 多格式规则资产、可复用规则供应方式；不是面向本仓库输入对象的校验脚本。代表文件：[AI Provider](https://github.com/ACL4SSR/ACL4SSR/blob/bd00af4d515306cb24b951d51c4a7984f3fbe321/Clash/Providers/Ruleset/AI.yaml#L1-L16)。 |
| [Aethersailor/Custom_OpenClash_Rules](https://github.com/Aethersailor/Custom_OpenClash_Rules) | OpenClash 配置、模板、覆写模块、规则 | 6,566 | 2026-09-29 19:44 | `53bcb7f66e027035dc87aec685b5df31e64f884a` | CC-BY-SA-4.0 | 明确区分订阅转换、远程 YAML 覆写和手动导入；节点过滤词覆盖较广，仍有 `Panel` 等无边界英文词。代表：[provider 与过滤](https://github.com/Aethersailor/Custom_OpenClash_Rules/blob/53bcb7f66e027035dc87aec685b5df31e64f884a/cfg/yaml/Custom_Clash.yaml#L11-L19)、[地区筛选](https://github.com/Aethersailor/Custom_OpenClash_Rules/blob/53bcb7f66e027035dc87aec685b5df31e64f884a/cfg/yaml/Custom_Clash.yaml#L475-L520)、[覆写模块写入订阅](https://github.com/Aethersailor/Custom_OpenClash_Rules/blob/53bcb7f66e027035dc87aec685b5df31e64f884a/overwrite/yaml/Custom_Clash.conf#L5-L13)。 |
| [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) | 多客户端规则、重写和脚本目录 | 28,084 | 2026-09-29 21:50 | `c9b2158695596a1ba866adcf74def8d5ab348e25` | GPL-2.0 | 服务/应用规则覆盖和多客户端格式整理能力强；混合仓库不能据此把所有脚本当作通用 Mihomo 覆写。代表：[Anthropic YAML 规则](https://github.com/blackmatrix7/ios_rule_script/blob/c9b2158695596a1ba866adcf74def8d5ab348e25/rule/Clash/Anthropic/Anthropic.yaml#L1-L9)。 |
| [echs-top/proxy](https://github.com/echs-top/proxy) | Mihomo / mihomo_smart 模板、覆写脚本、规则 | 184 | 2026-09-29 22:36 | `e5e53ad5591b07d1324f802b0658d314cea91dc4` | API 未声明 License | 脚本取 `config.proxies` 转 inline provider，Smart 及空组 `REJECT` 写得直接；样例还自带 DNS、TUN、全局配置和多 provider 行为，不能把这些一并移植。代表：[Smart/DNS/空组锚点](https://github.com/echs-top/proxy/blob/e5e53ad5591b07d1324f802b0658d314cea91dc4/mihomo_smart.js#L5-L24)、[provider 的关键词过滤](https://github.com/echs-top/proxy/blob/e5e53ad5591b07d1324f802b0658d314cea91dc4/mihomo_smart.js#L37-L40)。 |
| [Loyalsoldier/clash-rules](https://github.com/Loyalsoldier/clash-rules) | 规则数据与定时生成 | 28,624 | 2026-09-29 22:39 | `ab21f1c70d263c683990a0aed446ad3bf09a2961`（当日验证的 master SHA；提交日期 2026-07-28） | GPL-3.0 | 项目明确列出上游规则来源和 Premium 兼容边界，适合按数据源和规则资产评估；不包含本次要修的订阅对象清理入口。代表：[项目定位/上游来源](https://github.com/Loyalsoldier/clash-rules/blob/ab21f1c70d263c683990a0aed446ad3bf09a2961/README.md#L1-L9)、[Rule Provider 用法](https://github.com/Loyalsoldier/clash-rules/blob/ab21f1c70d263c683990a0aed446ad3bf09a2961/README.md#L31-L80)。 |
| [qichiyuhub/rule](https://github.com/qichiyuhub/rule) | Mihomo/Smart 与 sing-box 配置、训练代码、规则 | 1,637 | 2026-09-28 01:19 | `a91ff49f216df0da6952f5607430af55647a729c` | API 未声明 License | 展示 `include-all`、地区 filter、fallback、Smart 的组合方式；DNS、嗅探、TUN 等为整份示例配置的一部分。filter 是 YAML 子串正则，不等于 JS 对输入对象执行校验。代表：[订阅输入与全局字段](https://github.com/qichiyuhub/rule/blob/a91ff49f216df0da6952f5607430af55647a729c/config/mihomo/smart/smart.yaml#L1-L45)、[地区及 Smart 组](https://github.com/qichiyuhub/rule/blob/a91ff49f216df0da6952f5607430af55647a729c/config/mihomo/smart/smart.yaml#L82-L109)。 |
| [AIsouler/MyClash](https://github.com/AIsouler/MyClash) | Mihomo JavaScript 覆写 | 897 | 2026-09-29 14:58 | `be777c8aaa563f0b5f83623c94f651f311559e57` | MIT | 可借鉴显式开关、重复名处理、dialer 引用修复与空输入拒绝；但倍率由正则分类实现，且拒绝 `proxy-providers` 输入。源码也会设置 DNS/hosts，README 的 DNS 安全描述受客户端严格路由条件限制。代表：[配置开关](https://github.com/AIsouler/MyClash/blob/be777c8aaa563f0b5f83623c94f651f311559e57/Script/mihomoScript.js#L19-L59)、[倍率正则](https://github.com/AIsouler/MyClash/blob/be777c8aaa563f0b5f83623c94f651f311559e57/Script/mihomoScript.js#L182-L202)、[筛选、重名和 dialer 处理](https://github.com/AIsouler/MyClash/blob/be777c8aaa563f0b5f83623c94f651f311559e57/Script/mihomoScript.js#L839-L898)、[provider 拒绝](https://github.com/AIsouler/MyClash/blob/be777c8aaa563f0b5f83623c94f651f311559e57/Script/mihomoScript.js#L1576-L1594)。 |
| [SukkaW/Surge](https://github.com/SukkaW/Surge) | Surge 规则编译与源数据优化 | 4,508 | 2026-09-30 06:19 | 当日 master `38ac44a1ae08ae3038c523beaec0d7390af4dc6b`；分析源码固定 `79b7fa2db24a09694d85d116f940239b78101bf8` | AGPL-3.0 | 使用 trie/白名单做大型域名规则去重与构建，可作性能比较；本地 fused optimizer 已处理后缀覆盖、精确去重、跨段去重和客户端总预算，暂无证据表明需要换 trie。代表：[规则 trie/白名单与导出](https://github.com/SukkaW/Surge/blob/79b7fa2db24a09694d85d116f940239b78101bf8/Build/lib/rules/base.ts#L25-L63)、[批量写入阈值](https://github.com/SukkaW/Surge/blob/79b7fa2db24a09694d85d116f940239b78101bf8/Build/lib/rules/base.ts#L503-L529)。 |
| [powerfullz/override-rules](https://github.com/powerfullz/override-rules) | TypeScript Mihomo 覆写/规则分类 | 589 | 2026-09-16 15:34 | `f41f44b5b6ce54679dad0f981c82159b4f08f2e5` | MIT | 有显式 `proxies` 数组检查和国家/低成本分类；但新对象投影只保留 `proxies`/`hosts` 等，会丢掉 `proxy-providers`，对 mixed 输入的兼容不可直接假设。可借鉴失败前校验，不移植对象重建。代表：[数组校验和字段读取](https://github.com/powerfullz/override-rules/blob/f41f44b5b6ce54679dad0f981c82159b4f08f2e5/src/main.ts#L69-L79)、[对象输出](https://github.com/powerfullz/override-rules/blob/f41f44b5b6ce54679dad0f981c82159b4f08f2e5/src/main.ts#L124-L151)、[节点分类阈值](https://github.com/powerfullz/override-rules/blob/f41f44b5b6ce54679dad0f981c82159b4f08f2e5/src/node_parser.ts#L69-L108)。 |
| [xiaolin-007/clash-verge-script](https://github.com/xiaolin-007/clash-verge-script) | Clash Verge Rev/Mihomo JS 辅助脚本 | 819 | 2026-08-22 04:38 | `66d3ae9937442f6e8ba97d3cf913f8da6b97966f` | API 未声明 License | 有 Provider 存在性检查及节点后处理，可对照订阅对象边界；相关源码会直接覆盖 DNS，不能整段复制。代表：[Provider 检查及 DNS](https://github.com/xiaolin-007/clash-verge-script/blob/66d3ae9937442f6e8ba97d3cf913f8da6b97966f/%E6%89%A9%E5%B1%95%E8%84%9A%E6%9C%AC-%E4%BC%98%E5%8C%96%E7%89%88.js#L235-L253)、[节点后处理](https://github.com/xiaolin-007/clash-verge-script/blob/66d3ae9937442f6e8ba97d3cf913f8da6b97966f/%E6%89%A9%E5%B1%95%E8%84%9A%E6%9C%AC-%E4%BC%98%E5%8C%96%E7%89%88.js#L391-L399)。 |

**首轮搜索与候选筛选：** 使用过 GitHub repository 查询 `mihomo script stars:>100 fork:false`、`mihomo 覆写 stars:>100 fork:false`、`clash-script stars:>50 fork:false`、`surge rules stars:>1000 fork:false`；当时按关联性精读十个主样本和五个补充样本，未提供完整 star 排序及分页证据。十五个项目中只有五个直接配置对象脚本，其他属于规则、模板或管理/生成器；该覆盖不足已由上方补充报告纠正。补充报告保留检索请求与逐条结果，另读四个直接脚本及其他模板/工具，不宣称全 GitHub 无遗漏排名。YaNet 在首轮初次取数为 671★、后续复核为 670★，表中采用复核值；星数不代表脚本质量或兼容保证。

**许可边界：** 本地改动仅重新实现通用校验和节点筛选设计，不复制 GPL-2.0、GPL-3.0、AGPL-3.0 或 CC-BY-SA 项目的实现代码；MIT/BSD 样本同样没有代码移植。本次不把第三方规则条目纳入 source graph。

## 样本分析及可移植性

### 管理器、生成器与补充样本

| 项目 | Stars / License | 当日状态与分析提交 | 优点、边界和本地取舍 |
|---|---|---|---|
| [DustinWin/ruleset_geodata](https://github.com/DustinWin/ruleset_geodata) | 1,416 / GPL-3.0 | pushed 2026-09-29 22:56 UTC；main `ca831ae82b6a0fbc4c757ed45fcda573bba0610d` | 多种 Mihomo/sing-box 原生格式和 fake-IP 数据来源清楚；它是规则资产生成库，本仓库已消费其数据。参考[来源与格式](https://github.com/DustinWin/ruleset_geodata/blob/ca831ae82b6a0fbc4c757ed45fcda573bba0610d/README.md#L1-L13)，本轮不替换现有资产链。 |
| [juewuy/ShellCrash](https://github.com/juewuy/ShellCrash) | 13,321 / GPL-3.0 | pushed 2026-09-29 18:19 UTC；分析 `de1d9e20f71a77e794519d1c42d713253714f2e5` | [Provider 管理](https://github.com/juewuy/ShellCrash/blob/de1d9e20f71a77e794519d1c42d713253714f2e5/scripts/menus/providers_clash.sh#L84-L126)能生成 filter/exclude-filter；[静态倍率组](https://github.com/juewuy/ShellCrash/blob/de1d9e20f71a77e794519d1c42d713253714f2e5/rules/clash_providers/ShellCrash_RS_Full_BanAds.yaml#L13-L15)便于观察线路。代价是增加策略组，倍率仍是分档正则；本轮借鉴参数明确性，不加入新组或管理器职责。 |
| [dahaha-365/YaNet](https://github.com/dahaha-365/YaNet) | 670 / BSD-3-Clause（复核时） | pushed 2026-09-30 01:46 UTC；main `0b6a25b65730732b37487e7dc3bf5b58461942c2` | 运行时分类和倍率上限容易理解；[倍率分支](https://github.com/dahaha-365/YaNet/blob/0b6a25b65730732b37487e7dc3bf5b58461942c2/Mihomo/global_script.js#L699-L709)跳过地区分类，没有从原始节点池删除。可借鉴数值阈值，但不等同本仓库的实际节点筛选。 |
| [mihomo-party-org/override-hub](https://github.com/mihomo-party-org/override-hub) | 572 / API 未声明 | pushed 2026-01-28 09:21 UTC；`1c7c45c3512a22b5b3425eb2e6c101d4d45691ce` | [示例集合](https://github.com/mihomo-party-org/override-hub/blob/1c7c45c3512a22b5b3425eb2e6c101d4d45691ce/README.md#L1-L24)有利于理解覆写入口；[DNS 示例](https://github.com/mihomo-party-org/override-hub/blob/1c7c45c3512a22b5b3425eb2e6c101d4d45691ce/javascript/%E9%98%B2%E6%AD%A2dns%E6%B3%84%E9%9C%B2(%E9%9B%BE).js#L1-L32)追加规则并修改 fake-ip，不能作为操作系统 DNS 泄露已被阻止的证据。保留本地分层 DNS 和客户端边界说明。 |
| [surgioproject/surgio](https://github.com/surgioproject/surgio) | 1,826 / MIT | pushed 2026-09-26 20:01 UTC；`837db867b93fe19f672417bbf47511f6f84a9e88` | [按目标内核映射节点字段](https://github.com/surgioproject/surgio/blob/837db867b93fe19f672417bbf47511f6f84a9e88/src/utils/clash.ts#L24-L86)适合订阅生成工具；[模板规则过滤](https://github.com/surgioproject/surgio/blob/837db867b93fe19f672417bbf47511f6f84a9e88/src/generator/template-filters.ts#L16-L49)会删去不支持类型。本仓库已有目标生成器并要求不支持项明确报错，本轮不采用静默删除。 |

上表补齐另外五个实际读过代表源码的样本。前文十个主样本加这里五个样本，共十五个项目；研究深度按与本地问题的关联决定，并非逐仓库审计全部文件。YaNet 初轮为 671★、复核为 670★，属于研究期间的接口快照变化。

### 规则数据库与运行时脚本不是同一类项目

ACL4SSR、blackmatrix7、Loyalsoldier、DustinWin 和 SukkaW/Surge 的主要研究价值是规则清单、上游数据和格式生成/发布。它们影响 `rule-providers` 的内容和更新方式，但不能解决 `main(config)` 收到的值是否完整、节点名是否唯一、是否只有 Provider 而没有实际节点这些运行时问题。blackmatrix7 的 README/规则树同时有客户端重写和脚本资源；应按单文件、单客户端能力阅读，不能把仓库整体贴成“mihomo 覆写脚本库”。

Aethersailor 同时有规则、配置和 OpenClash 覆写模块，其文档说明 YAML 模块下载配置、写 Provider URL 后会切换运行配置；这和改写当前订阅对象的 JS 覆写是不同的入口。ShellCrash 的 `providers_clash.sh` 同样是管理器流程，通过 shell 生成 Provider 过滤设置。qichiyuhub/echs-top 则提供完整模板和 Mihomo Smart 运行样例。MyClash、powerfullz/override-rules 与 xiaolin-007/clash-verge-script 是直接比较 JS 对象处理更有价值的样本：MyClash 的空输入和 dialer/重名处理有借鉴；powerfullz 显式检查数组却投影输出丢失 provider；xiaolin 检查 provider 但同时覆盖 DNS。均只借鉴经证据支持的设计，不复制其完整行为。

### 样本发现的有效点及边界

| 技术点 | 样本证据 | 可以借鉴 | 不直接移植的原因 |
|---|---|---|---|
| 明确输入类型/数据路径 | echs-top 以 `config.proxies` 建 inline provider（JS L5-L8）；MyClash 明确检测并拒绝 provider 输入（L1576-L1594） | 明确运行时支持的数据形态；remote provider-only 时输出可理解的拒绝原因，提示先用 SubStore flatten | 两种仓库的配置入口不同。本仓库不能假定 `proxy-providers` 已被下载，也不能把远程 provider 节点伪装成本地 `proxies`。 |
| 空结果失败关闭 | echs-top 的锚点用 `empty-fallback: REJECT`（L11-L15）；MyClash 对其空输入场景拒绝 | 原始空 `proxies` 保留原始 config；筛选导致全部节点消失时继续构建安全全球组并指定 `REJECT` | 单有 `empty-fallback` 并不验证上游对象；必须区分原始空输入与有效输入被用户筛选至空两种路径。 |
| 重名与链引用 | MyClash L839-L898 清理/标准化并处理同名、dialer 引用；powerfullz 重建对象 | 等价同名只保留第一项；同名异配置拒绝；保留被引用的节点链及原名 | 直接重命名会改变引用目标；笼统拒绝完全相同的重复项也会制造不必要阻塞。 |
| 倍率筛选 | MyClash 显示单选项；ShellCrash 与 Sub-Store rename 脚本提供标签/正则策略 | 将筛选做成本地显式开关，缺省关闭；开启时解析完整倍率 token 并做数值比较 | MyClash 的 `0.59x` 实测被 low 正则前缀 `0.[0-5]` 命中，是小数边界问题；其 high 分类从 2 起，故 `1.5x` 不命中 high 属于该脚本的分档范围，`倍率2` 是未覆盖的标签语法。均不能替代本仓库任意正数上限的数值解析。 |
| 名称分类 | Aethersailor YAML 的 `Panel` 词在一个更宽过滤式中无英文边界 | 英文单词过滤须定义边界，避免 `Panel` 子串误伤非面板节点标签 | YAML Mihomo filter 使用 RE2 子串语义，JS 使用自己的 regex/对象处理；不应拿一个平台的正则语义推断另一个平台行为。 |
| Smart/区域组结构 | qichiyuhub 和 echs-top 都示例 Smart、`include-all` 与空组策略 | 作为语法/排列参考，另按内核官方文档和当前生成器合同验证 | 本仓库已经有 55 组和成熟的 Smart 结构；本次没有证据支持加组、删组或替换默认策略。 |
| 规则多格式发布 | ACL4SSR、Loyalsoldier、DustinWin、blackmatrix7/Aethersailor | 只按来源许可、格式、行为和融合链路评估具体 provider | 本次目标是节点输入健壮性；更换/复制来源会触发 source graph、MRS、fused 和 14 个目录联动，超出实施范围。 |

### 本地已实现能力：避免重复建设

仓库当前规则链已是 `routing-graph.js` v6.0.14 → MRS 规范化 → fused 编译 → 客户端产物。源图已有按 provider URL、格式和策略段生成规则集的职责；当前统计为 source 514 providers / 973 rules → fused 132 providers / 151 rules，manifest 的 `unresolved_providers`、`unresolved_sources` 和 `passthrough_providers` 均为空。Source Graph 中已声明来自 ACL4SSR 的 Zoom 规则及 DustinWin ads MRS 地址（例如 `rulesets/source/routing-graph.js` 当前 HEAD L284、L321）。因此研究发现不能构成把第三方整套规则搬进本地或改写路由语义的理由。

已存在的全规则生成、provider 映射、客户端 fallback 和规则合同检查继续复用。此次只围绕运行时输入对象预检、名字唯一性与有效节点数、可选本地倍率过滤和 OpenClash 宽泛垃圾词边界处理。订阅 flatten 是输入预处理要求，不是把远程 Provider 拉取职责偷偷塞入 JS 的理由。

## 14 个产物目录适用性矩阵

这里的“14”按 `AGENTS.md` 的 14 个客户端产物目录计数；OpenClash Normal/Smart 两种脚本归在同一个目录行，保留各自实际位置。括号是本地只读审计锁定的源文件和行号（稳定基线 HEAD `928eb7028d31883000921b2904ed952d22b30b07`）；五个目标文件已完成修改；这里保留基线行号用于追溯原缺陷，当前实现及验收见文末。

| 目录/产物 | 本地运行时点 | 对本次缺陷的适用性及处理结论 |
|---|---|---|
| Clash Party | Smart `Clash Party/ClashParty(mihomo-smart).js:22,135,277,1182,1207,1261`；Normal `Clash Party/ClashParty(mihomo).js:23,134,288,1110,1132,1185` | 与 FlClash 类似的 `config.proxies` 分类、清理、组构造流程，**适用**；两个脚本都是本次 3 JS 改动范围。Smart/Normal 逻辑需一起保持。 |
| Clash Meta For Android | `Clash Meta For Android/CMFA(mihomo).yaml:215-236,645-662` | YAML 静态 `Subscribe` provider、`use` 与地区 `filter`，无同一 JS 对象清理流程；**不适用 JS 预检**。仍有名称分类同构点，证据里未发现 OpenClash Ruby 的 IPLC/中转/TG 误删条件。 |
| OpenClash | Normal `OpenClash/OpenClash(mihomo).sh:2336-2345,2358,2512,2531,2563,2591`；Smart `OpenClash/OpenClash(mihomo-smart).sh:2333-2342,2356,2506,2528,2560,2588` | `INFO_PATTERNS`、代理筛选、组 fallback 与覆盖 `config.proxies`，**适用**；两份 Shell/Ruby 实现是本次实施范围。现有宽泛规则在实际样例中误删 `HK IPLC 03 x3`、`HK 中转 01`、`HK Telegram 01`。 |
| Shadowrocket | `Shadowrocket/Shadowrocket.conf:122` 及区域组 `policy-regex-filter` | 静态名称分类 regex，无订阅对象预检/清理；**不适用本次修改**。当前未观察到上述 IPLC/中转/TG 负向误删表达式。 |
| SingBox | `SingBox/SingBox(sing-box)-generator.js:255-271` | 生成静态 selector/urltest；节点由用户按 tag 接入，无目标运行时分类流程；**不适用**。 |
| v2rayN | `v2rayN/v2rayN(xray).json:3-6,18` | 展平后的 Xray RuleObject/outboundTag，没有 Mihomo 订阅 JS 或动态分类；**不适用**。 |
| Surge | `Surge/Surge.conf:114` 及区域组 `include-all-proxies`/regex | 有静态名称分类，未见同样的 JS flow/对象删除路径；**不适用**本次修改。 |
| Loon | `Loon/Loon.conf:68-80` | `NameRegex` Remote Filter 分类，不运行本次的代理对象清理；**不适用**。 |
| Quantumult X | `Quantumult X/QuantumultX.conf:46,80-85` | `server-tag-regex` 分类配置，无 Mihomo JS 对象输入；**不适用**。 |
| Passwall | `Passwall/Passwall(xray+sing-box)-apply.sh:87-95` | 安装 fused shunt rule，没有节点分类/provider 过滤；**不适用**。 |
| Passwall2 | `Passwall2/Passwall2(xray+sing-box)-apply.sh:87-95` | 同 Passwall 的 shunt-rule 安装点；**不适用**。 |
| FlClash | `FlClash/FlClash(mihomo).js:53,163,317,1171,1196,1257` | 与 Party Normal 同构 JS 分类及数组清理流程，**适用**，是本次 3 JS 修改范围之一。 |
| Stash | `Stash/Stash.yaml:125-136,545-558` | YAML 静态 provider/use 与 filter；生成器刻意不带 Mihomo `exclude-filter`/health-check；**不适用 JS 预检**，也不能机械复制 Mihomo 字段。 |
| Egern | `Egern/Egern.yaml:89-95,98-127` | 静态 Subscribe、Smart `policies`/`flatten` 和 `filter` 名称分类；**不适用 JS flow/清理**。只需记录其分类语义单独实现，不在本次改动范围。 |

Mihomo 文档把 `use` 定义为引用 `proxy-providers`，而 `include-all-proxies` 指向配置中显式定义的代理；官方文档还指出 `url` 检测不检查 `use` 引入的 provider 节点。因此各端 provider 入口并不等价，不能凭“所有组都包含节点”推断脚本拿到同一类数据。参考 [Mihomo proxy groups 官方说明](https://wiki.metacubex.one/en/config/proxy-groups/)。

## 本地探针证据与实施建议

主线程本地审计在 2026-09-30 对稳定基线运行了只读输入探针（没有写入仓库）。复核材料位于 `%TEMP%\smart-config-research-20260930\audit\probe.js`、`probe-output.jsonl`、`openclash_filter.rb`、`openclash-filter-output.jsonl`。基线行为需分场景表述：原始空 `proxies` 时 JS 返回原始 config；Provider-only 时三个 JS 也原样返回，混合输入保留 provider 定义但动态地区组未包含远程节点；冲突重名、`null` 等输入没有稳定拒绝；全部候选被清理后仍有 34 个组和 151 条规则的半成品，`flow: 1` 样例还出现 0 组/0 规则但 DNS 已写入的部分返回。OpenClash 正则样例实际移除了 IPLC、中转和 Telegram 节点。这些证据支持输入预检、原子失败及过滤器精确化，不支持改动规则源或全局策略。

MyClash 的倍率实际探针补充说明：样例 `JP 0.59x` 被 low 正则的 `0.[0-5]` 前缀命中，这是实测小数边界；该脚本 high 规则从 2 起，因此 `JP 1.5x` 不命中 high 是其既定分档，而 `JP 倍率2` 是正则不支持的标签写法。`JP x2`、`JP 2x`、`JP 2.5x` 命中 high。由此只借鉴“用户可选择的筛选意图”与显式开关；本地 max multiplier 必须识别完整倍率 token、转为数值比较，不能复制正则或其固定分档。

建议的受控行为如下：

1. 在任何 mutation 前检查 `config`、`proxies` 的结构；当前目标运行模式只分类已 flatten 的 `proxies` 数组。非空远程 `proxy-providers` 节点入口明确拒绝并说明先在 SubStore flatten；混合输入不可只分类显式节点、静默漏掉 provider 节点。完全等价重复项只保留首项；同名异配置、非法类型或不能安全保留的代理链/`dialer-proxy` 关系显式拒绝。
2. 原始 `proxies` 为空时 JS 保持原始配置返回，不额外拼装半成品规则；对非空输入筛选后，若所有候选都被用户启用的筛选排除，则继续构建全球 select 并令其代理目标为 `REJECT`。错误/异常必须在配置 mutation 前返回原始配置或显式失败，不能返回一份只改了一半的配置。
3. 倍率过滤作为本地配置开关，默认关闭；开启时只按明确解析出的倍率字段/token 应用阈值。无法解析的节点按显式策略处理并保持可见，默认不误删。节点原名和被引用对象均保留。
4. OpenClash Normal/Smart 共用经过样例验证的窄过滤规则，移除已证实会误杀的宽泛词；JS 英文 `Panel` 做英文 token 边界处理，并按 JavaScript 样例复核，不把 YAML/RE2 结果当成 JS 结果。
5. 保持 `SOURCE_GRAPH_VERSION = v6.0.14`、fused 资产、规则优先级、55 组可选组体系、DNS/Smart 默认行为和其他产物目录不变。当前源为 514 providers / 973 rules，fused 产物为 132 providers / 151 rules；本次没有 source、upstream、provider、rule 或 DNS 内容变更，不运行上游下载/全规则生成链，避免无关负载漂移。五个运行时脚本的版本尾段按项目规则更新，其余十一个产物目录做同构适用性审计并记录例外；这不等于重建全规则产物。静态端“不适用”必须由上表位置及理由支撑。

## 验证覆盖

用户侧功能和倍率参数说明见[订阅节点预检与倍率筛选指南](../subscription-node-filter.md)。

- 对 3 JS 分别输入：正常多节点、原始空数组、`null`、缺失 `proxies`、仅 `proxy-providers`、混合本地/Provider、等价及冲突重名、无法 JSON 化的值、`flow: 1`、常见 `dialer-proxy` 链、合法低/高/小数倍率、无倍率节点、名称包含 `Panel` 但不是英文独立 token。记录成功/原样返回/拒绝及错误信息；确认空数组保留原始 config、冲突输入无部分 mutation、筛除完毕时 global 指向 `REJECT`。
- 对 2 OpenClash 脚本提取真实 `INFO_PATTERNS`，用 `HK IPLC 03 x3`、`HK 中转 01`、`HK Telegram 01`、套餐/过期通知节点及正常地区节点回归；确认窄化后垃圾说明节点仍可清理，专线/转发/服务用途节点不被误删。
- 跑仓库要求的 JS 覆写合同与跨端合同验证；按实际改动范围运行对应 Normal、Smart、FlClash targets，以及 OpenClash YAML/Ruby 解析和重复顶层键检查。确认 55 组、规则/provider 引用和 fused manifest 均未变化。
- 保存并比较 source/fused 的版本和语义哈希；对实现后文件跑 `git diff --check`、工作区 diff 范围核对。提交给主线程的测试状态应区分“探针通过”和“CI/静态验证通过”。
- 限制：当前证据只覆盖脚本层输入输出，没有启动 Mihomo、OpenClash、Stash 或 Egern 客户端。空组客户端加载、重名实际加载行为、远程 Provider 实时展开行为仍待真实内核/客户端验证；不得把本地探针描述为真机验收。

## 最终实现与验收（2026-09-30）

已执行 `git pull --ff-only origin main`，结果为 Already up to date；实施前 `HEAD` 与 `origin/main` 均为 `928eb7028d31883000921b2904ed952d22b30b07`。改动在 `codex/research-routing-overwrites` 分支完成验收，用户随后授权提交并推送 `main`；发布结果以 Git 远端提交为准。本地验证环境为 Windows、Node.js v24.14.0、Ruby 3.3.11；仓库 CI 配置为 Node.js 22 / Ruby 3.3。

| 产物 | 新版本 | 已实施行为 |
|---|---|---|
| Clash Party Smart | v6.0.14-dns.10 | 节点预检、等价去重、可选倍率筛选、链引用和环校验、全空全球组 REJECT |
| Clash Party Normal | v6.0.14-normal.11 | 同 Smart 的节点输入语义，保留原有 url-test 地区组 |
| FlClash | v6.0.14-flclash.12 | 同 Normal，保留其数组引用及客户端托管字段边界 |
| OpenClash Normal / Smart | v6.0.14-oc-normal.9 / v6.0.14-oc-smart.9 | 写 YAML 前预检；修复 IPLC/中转/DNS/Telegram 误删；倍率、链式依赖和环校验与 JS 对齐 |

新增共享 [JS 运行时](../../tools/runtime/subscription-node-filter.js)和 [Ruby 运行时](../../tools/runtime/subscription-node-filter.rb)，同步工具检查嵌入副本，避免五份产物各自漂移。倍率默认关闭，开启后只删除明确超过阈值的节点；未知、零值或冲突标签保留。`0.59x`、`1.5x`、`1.50x` 使用完整数值，`2×` 与 `?×` 也有回归。英文信息标签按 ASCII 单词边界对齐，覆盖中文相邻的 `Panel香港` 与不应过滤的 `Panelist`。

| 实际执行的检查 | 结果 |
|---|---|
| `node --test tools/tests/*.test.js` | **89/89**；包括新增 40 项 JS 节点筛选回归及原有 49 项回归 |
| `node tools/validate-js-overwrites.js` | 三目标通过；完整 fixture 均为 55 组 / 151 rules / 132 providers |
| `node tools/validate-artifact-contracts.js --strict-ruby` | **2272 checks / 19 artifacts 通过**；已有 `.conf` 旧版本提示仍为非阻断警告 |
| `node tools/test-openclash-node-filter.js` | 两个真实 Ruby heredoc 执行、保存后 YAML 读回通过；36 个 JS/Ruby 名称样例一致 |
| `node tools/test-openclash-node-dns-hints.js` | Normal/Smart 两端通过 |
| 两个节点筛选同步器与 Node-DNS 同步器 `--check` | 通过；另在临时 CRLF 副本验证只读漂移检测、修复同步和重复同步哈希不变 |
| `node tools/test-info-node-filter.js` / `node tools/test-kr-boundary.js` | 六产物英文边界检查通过；地区边界 35 样例通过 |
| `node tools/validate-process-name-direct.js` | 通过：53 direct desktop / 4 RustDesk work / 25 Surge direct |
| `node tools/validate-generated-remote-asset-size.js` | 533 引用资产单体预算、13 客户端总预算通过 |
| 三个改动 workflow 的 Ruby YAML 解析 / `git diff --check` | 通过 |

独立只读复核另实跑自环、双节点环、正常多跳链、`__proto__`/`constructor` 名称和一万节点输入。预检拒绝不改原对象，五份产物在只读同步检查前后 SHA-256 不变。此次没有基于该小样本宣称客户端延迟、吞吐或内存提升。CI 已接入新检查，发布后由远端 Actions 执行；本表记录本地验收结果。

规则资产的 Git blob 与基线完全一致：

| 文件 | 基线与当前相同的 Git blob |
|---|---|
| `rulesets/source/routing-graph.js` | `c6ed0327ef7511461efecfa0f71c78187520864f` |
| `rulesets/generated/fused/manifest.json` | `8d50f08bb16bafbcb799cad0f0fa4770986b77dd` |
| `rulesets/generated/mihomo-mrs/manifest.json` | `05d2e755d05c0ff0600f03ed929e40ab8ca4126e` |

MRS 统计保持 converted=237、split=28、partial=70、existing_mrs=35、retained=23、failed=0；fused 的 unresolved_providers / unresolved_sources / passthrough_providers 仍为空。`git diff --name-only -- rulesets/source rulesets/generated` 无输出。

设备边界：本机完成 Node VM 与真实 Ruby 处理器验收，没有启动客户端或真实连接测试；本机无 bash，未另执行 `bash -n`。既有 Node-DNS 在无源 DNS 输入的第二轮会新增同默认 DoH 的节点策略；基线三 JS 同样复现，未见解析器来源改变，本轮没有扩大改动。

## 来源完整性与客户端验证边界

- GitHub repository/commit API 由主线程连接器补齐了首轮缓存缺失项：DustinWin 为 1,416★ / GPL-3.0，Loyalsoldier 当日 master 为 `ab21f1c…`；本报告已采用这些证据。SukkaW 的 metadata 指向当日较新 master `38ac44a…`，源码分析固定在 `79b7fa2…`，不得将两者混称同一提交。
- Aethersailor 的配置和覆写文档可以说明其获取路径和 YAML 过滤写法，但不能代替 OpenClash 官方模块规范。内核字段兼容性如需扩展，仍应按仓库 `AGENTS.md §2` 提供官方文档证据。
- MyClash README 指出 Windows 路由/多宿主解析设置对 DNS 泄露结论有影响；源码使用 DNS/hosts 配置。因此不能据 README 宣传语推导本地改动会“避免 DNS 泄露”，本次不采用其 DNS 基线。
- 本轮完成的是本地脚本及生成合同验收，没有客户端设备实测；设备兼容性不从本地探针推断。
