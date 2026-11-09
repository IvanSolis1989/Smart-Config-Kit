<a id="mihomo-分流脚本生态研究节点输入分类与失败关闭"></a>
# Mihomo routing-script ecosystem: node inputs, classification and fail-closed behavior

**English** | [简体中文](2026-09-30-routing-script-research.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

**Research snapshot: 2026-09-30 (UTC)**

**Supplementary comparison:** [GitHub star-ordered search and comparison of nine direct scripts](2026-09-30-github-routing-script-comparison.md), with [complete pagination evidence for eight queries](2026-09-30-github-search-evidence.json). The supplement separates runtime scripts, rule data, templates and managers, adding source/VM-input comparisons for Repcz, Perfect-Rules, selfproxy and HotKids. This report retains the initial implementation rationale and acceptance record.

**Scope:** high-star rule repositories, Mihomo override scripts, OpenClash configurations and subscription managers, seeking bounded improvements to this repository's existing node processing.

**Local baseline:** `rulesets/source/routing-graph.js` v6.0.14; changes based on `main` commit `928eb7028d31883000921b2904ed952d22b30b07`, implemented on local branch `codex/research-routing-overwrites`.

<a id="结论"></a>
## Conclusion

Useful lessons concern input boundaries and failure behavior: verify that `config.proxies` is a processable array before execution; retain the first of fully equivalent duplicate nodes and reject ambiguous same-name/different-configuration nodes; explicitly reject remote `proxy-providers` input and request SubStore flattening first. Local multiplier filtering defaults off, with numeric parsing/filtering only when explicitly enabled. With no original explicit nodes, JS returns the original configuration. If local filtering removes all candidates, the global selector explicitly targets `REJECT`. Retain surviving nodes' original names and referenced chains rather than masking issues through renaming or incorrectly deleting connection labels.

Implementation covers 3 JS override scripts and 2 OpenClash scripts. The 55-group optional-group system, names and routing semantics stay fixed; regional groups without candidates may remain ungenerated under existing runtime behavior. Source graph and fused semantics remain v6.0.14. Node preflight, conservative multiplier parsing, erroneous-removal fixes, chain/cycle validation and empty-global `REJECT` are complete; source and full acceptance appear below. Other projects' complete DNS/TUN configurations, policy suites and upstream rules were not transplanted.

<a id="api-快照与代表仓库"></a>
## API snapshot and representative repositories

Metadata comes from the 2026-09-30 UTC GitHub repository/commit API snapshot. Stars, `pushed_at` and licenses follow that day's API/repository evidence. Closely analyzed source uses fixed-SHA permalinks; where analysis and latest default-branch commits differ, both are listed. Stars continuously change and represent only API values at retrieval. Update times mean GitHub `pushed_at`, not page access times.

| Project | Category | Stars | `pushed_at` (UTC) | Snapshot commit | License (API/repository files) | Main trade-offs |
|---|---|---:|---|---|---|---|
| [ACL4SSR/ACL4SSR](https://github.com/ACL4SSR/ACL4SSR) | Rule data, templates | 6,750 | 2026-09-27 03:03 | `bd00af4d515306cb24b951d51c4a7984f3fbe321` | CC-BY-SA-4.0 | Multi-format rule assets and reusable provisioning, not validation of this repository's input objects. Representative: [AI Provider](https://github.com/ACL4SSR/ACL4SSR/blob/bd00af4d515306cb24b951d51c4a7984f3fbe321/Clash/Providers/Ruleset/AI.yaml#L1-L16). |
| [Aethersailor/Custom_OpenClash_Rules](https://github.com/Aethersailor/Custom_OpenClash_Rules) | OpenClash configurations, templates, override modules, rules | 6,566 | 2026-09-29 19:44 | `53bcb7f66e027035dc87aec685b5df31e64f884a` | CC-BY-SA-4.0 | Clearly separates subscription conversion, remote YAML overrides and manual import. Broad node filters still contain boundaryless English terms such as `Panel`. Representatives: [providers and filtering](https://github.com/Aethersailor/Custom_OpenClash_Rules/blob/53bcb7f66e027035dc87aec685b5df31e64f884a/cfg/yaml/Custom_Clash.yaml#L11-L19), [regional filtering](https://github.com/Aethersailor/Custom_OpenClash_Rules/blob/53bcb7f66e027035dc87aec685b5df31e64f884a/cfg/yaml/Custom_Clash.yaml#L475-L520), [override module writing subscriptions](https://github.com/Aethersailor/Custom_OpenClash_Rules/blob/53bcb7f66e027035dc87aec685b5df31e64f884a/overwrite/yaml/Custom_Clash.conf#L5-L13). |
| [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) | Multi-client rules, rewrites and script directories | 28,084 | 2026-09-29 21:50 | `c9b2158695596a1ba866adcf74def8d5ab348e25` | GPL-2.0 | Strong service/application coverage and multi-client formatting; a mixed repository does not make all scripts general Mihomo overrides. Representative: [Anthropic YAML rules](https://github.com/blackmatrix7/ios_rule_script/blob/c9b2158695596a1ba866adcf74def8d5ab348e25/rule/Clash/Anthropic/Anthropic.yaml#L1-L9). |
| [echs-top/proxy](https://github.com/echs-top/proxy) | Mihomo / mihomo_smart templates, overrides, rules | 184 | 2026-09-29 22:36 | `e5e53ad5591b07d1324f802b0658d314cea91dc4` | No license declared by API | Converts `config.proxies` into an inline provider with direct Smart/empty-group `REJECT` expressions. Its bundled DNS, TUN, global and multi-provider behavior must not be transplanted wholesale. Representatives: [Smart/DNS/empty-group anchors](https://github.com/echs-top/proxy/blob/e5e53ad5591b07d1324f802b0658d314cea91dc4/mihomo_smart.js#L5-L24), [provider keyword filtering](https://github.com/echs-top/proxy/blob/e5e53ad5591b07d1324f802b0658d314cea91dc4/mihomo_smart.js#L37-L40). |
| [Loyalsoldier/clash-rules](https://github.com/Loyalsoldier/clash-rules) | Rule data and scheduled generation | 28,624 | 2026-09-29 22:39 | `ab21f1c70d263c683990a0aed446ad3bf09a2961` (master SHA verified that day; commit date 2026-07-28) | GPL-3.0 | Explicit upstream sources/Premium boundaries, suitable for source/asset assessment, but no subscription-object cleanup entry for this fix. Representatives: [project scope/upstream sources](https://github.com/Loyalsoldier/clash-rules/blob/ab21f1c70d263c683990a0aed446ad3bf09a2961/README.md#L1-L9), [Rule Provider usage](https://github.com/Loyalsoldier/clash-rules/blob/ab21f1c70d263c683990a0aed446ad3bf09a2961/README.md#L31-L80). |
| [qichiyuhub/rule](https://github.com/qichiyuhub/rule) | Mihomo/Smart and sing-box configurations, training code, rules | 1,637 | 2026-09-28 01:19 | `a91ff49f216df0da6952f5607430af55647a729c` | No license declared by API | Shows include-all/regional filter/fallback/Smart combinations; DNS/sniffing/TUN are part of whole examples. YAML substring filtering is not JS input-object validation. Representatives: [subscription input/global fields](https://github.com/qichiyuhub/rule/blob/a91ff49f216df0da6952f5607430af55647a729c/config/mihomo/smart/smart.yaml#L1-L45), [regional and Smart groups](https://github.com/qichiyuhub/rule/blob/a91ff49f216df0da6952f5607430af55647a729c/config/mihomo/smart/smart.yaml#L82-L109). |
| [AIsouler/MyClash](https://github.com/AIsouler/MyClash) | Mihomo JavaScript overrides | 897 | 2026-09-29 14:58 | `be777c8aaa563f0b5f83623c94f651f311559e57` | MIT | Useful toggles, duplicate handling, dialer-reference repair and empty-input rejection; multiplier classification is regex-based and `proxy-providers` input is rejected. Source sets DNS/hosts, while README DNS-safety claims depend on client strict-routing conditions. Representatives: [configuration toggles](https://github.com/AIsouler/MyClash/blob/be777c8aaa563f0b5f83623c94f651f311559e57/Script/mihomoScript.js#L19-L59), [multiplier regex](https://github.com/AIsouler/MyClash/blob/be777c8aaa563f0b5f83623c94f651f311559e57/Script/mihomoScript.js#L182-L202), [filtering, duplicates and dialers](https://github.com/AIsouler/MyClash/blob/be777c8aaa563f0b5f83623c94f651f311559e57/Script/mihomoScript.js#L839-L898), [provider rejection](https://github.com/AIsouler/MyClash/blob/be777c8aaa563f0b5f83623c94f651f311559e57/Script/mihomoScript.js#L1576-L1594). |
| [SukkaW/Surge](https://github.com/SukkaW/Surge) | Surge rule compilation/source-data optimization | 4,508 | 2026-09-30 06:19 | That day's master `38ac44a1ae08ae3038c523beaec0d7390af4dc6b`; analyzed source `79b7fa2db24a09694d85d116f940239b78101bf8` | AGPL-3.0 | Trie/allowlist deduplication/building of large domain sets is useful for performance comparison. Local fused optimizer already handles suffix coverage, exact/cross-segment deduplication and total client budgets; no evidence yet warrants switching to a trie. Representatives: [rule trie/allowlist/export](https://github.com/SukkaW/Surge/blob/79b7fa2db24a09694d85d116f940239b78101bf8/Build/lib/rules/base.ts#L25-L63), [batch-write thresholds](https://github.com/SukkaW/Surge/blob/79b7fa2db24a09694d85d116f940239b78101bf8/Build/lib/rules/base.ts#L503-L529). |
| [powerfullz/override-rules](https://github.com/powerfullz/override-rules) | TypeScript Mihomo overrides/rule classification | 589 | 2026-09-16 15:34 | `f41f44b5b6ce54679dad0f981c82159b4f08f2e5` | MIT | Explicit `proxies` array checks and country/low-cost classification, but new-object projection retains only fields such as `proxies`/`hosts` and loses `proxy-providers`; mixed-input compatibility cannot be assumed. Reuse pre-failure validation, not object rebuilding. Representatives: [array validation/field reading](https://github.com/powerfullz/override-rules/blob/f41f44b5b6ce54679dad0f981c82159b4f08f2e5/src/main.ts#L69-L79), [output objects](https://github.com/powerfullz/override-rules/blob/f41f44b5b6ce54679dad0f981c82159b4f08f2e5/src/main.ts#L124-L151), [node-classification thresholds](https://github.com/powerfullz/override-rules/blob/f41f44b5b6ce54679dad0f981c82159b4f08f2e5/src/node_parser.ts#L69-L108). |
| [xiaolin-007/clash-verge-script](https://github.com/xiaolin-007/clash-verge-script) | Clash Verge Rev/Mihomo JS helpers | 819 | 2026-08-22 04:38 | `66d3ae9937442f6e8ba97d3cf913f8da6b97966f` | No license declared by API | Provider-existence checks/node postprocessing illuminate subscription boundaries, but source directly replaces DNS and must not be copied wholesale. Representatives: [provider checks and DNS](https://github.com/xiaolin-007/clash-verge-script/blob/66d3ae9937442f6e8ba97d3cf913f8da6b97966f/%E6%89%A9%E5%B1%95%E8%84%9A%E6%9C%AC-%E4%BC%98%E5%8C%96%E7%89%88.js#L235-L253), [node postprocessing](https://github.com/xiaolin-007/clash-verge-script/blob/66d3ae9937442f6e8ba97d3cf913f8da6b97966f/%E6%89%A9%E5%B1%95%E8%84%9A%E6%9C%AC-%E4%BC%98%E5%8C%96%E7%89%88.js#L391-L399). |

**Initial search and screening:** GitHub repository queries included `mihomo script stars:>100 fork:false`, `mihomo 覆写 stars:>100 fork:false`, `clash-script stars:>50 fork:false`, `surge rules stars:>1000 fork:false`. Ten main and five supplementary samples were closely read by relevance, without complete star ordering/pagination evidence. Only five of the fifteen directly process configuration objects; others are rules/templates/managers/generators. The supplement corrects that coverage gap, retaining requests/itemwise results and reading four more direct scripts plus other templates/tools, without claiming exhaustive GitHub rankings. YaNet was initially 671★ and later 670★; the table uses the rechecked value. Stars do not guarantee quality or compatibility.

**License boundary:** local changes reimplement general validation/filtering design, without copying implementation code from GPL-2.0, GPL-3.0, AGPL-3.0 or CC-BY-SA projects. No MIT/BSD sample code was transplanted either. No third-party rule entries entered the source graph in this round.

<a id="样本分析及可移植性"></a>
## Sample analysis and portability

<a id="管理器生成器与补充样本"></a>
### Managers, generators and supplementary samples

| Project | Stars / License | Same-day status and analyzed commit | Strengths, boundaries and local decision |
|---|---|---|---|
| [DustinWin/ruleset_geodata](https://github.com/DustinWin/ruleset_geodata) | 1,416 / GPL-3.0 | pushed 2026-09-29 22:56 UTC; main `ca831ae82b6a0fbc4c757ed45fcda573bba0610d` | Clear native Mihomo/sing-box formats and fake-IP sources. A rule-asset generator already consumed locally; see [sources and formats](https://github.com/DustinWin/ruleset_geodata/blob/ca831ae82b6a0fbc4c757ed45fcda573bba0610d/README.md#L1-L13). Existing asset pipeline is not replaced. |
| [juewuy/ShellCrash](https://github.com/juewuy/ShellCrash) | 13,321 / GPL-3.0 | pushed 2026-09-29 18:19 UTC; analyzed `de1d9e20f71a77e794519d1c42d713253714f2e5` | [provider management](https://github.com/juewuy/ShellCrash/blob/de1d9e20f71a77e794519d1c42d713253714f2e5/scripts/menus/providers_clash.sh#L84-L126) generates filter/exclude-filter; [static multiplier groups](https://github.com/juewuy/ShellCrash/blob/de1d9e20f71a77e794519d1c42d713253714f2e5/rules/clash_providers/ShellCrash_RS_Full_BanAds.yaml#L13-L15) aids connection inspection. Costs extra groups and still uses multiplier-band regex. Reuse explicit parameters, not new groups/manager responsibilities. |
| [dahaha-365/YaNet](https://github.com/dahaha-365/YaNet) | 670 / BSD-3-Clause (rechecked) | pushed 2026-09-30 01:46 UTC; main `0b6a25b65730732b37487e7dc3bf5b58461942c2` | Clear runtime classification/multiplier limit. [multiplier branch](https://github.com/dahaha-365/YaNet/blob/0b6a25b65730732b37487e7dc3bf5b58461942c2/Mihomo/global_script.js#L699-L709) skips regional classification without deleting original nodes. Numeric thresholds are useful, but not equivalent to actual local node filtering. |
| [mihomo-party-org/override-hub](https://github.com/mihomo-party-org/override-hub) | 572 / not declared by API | pushed 2026-01-28 09:21 UTC; `1c7c45c3512a22b5b3425eb2e6c101d4d45691ce` | [example collection](https://github.com/mihomo-party-org/override-hub/blob/1c7c45c3512a22b5b3425eb2e6c101d4d45691ce/README.md#L1-L24) explains override entries; [DNS example](https://github.com/mihomo-party-org/override-hub/blob/1c7c45c3512a22b5b3425eb2e6c101d4d45691ce/javascript/%E9%98%B2%E6%AD%A2dns%E6%B3%84%E9%9C%B2(%E9%9B%BE).js#L1-L32) appends rules and modifies fake-ip, not evidence of preventing OS DNS leaks. Retain local layered-DNS/client-boundary documentation. |
| [surgioproject/surgio](https://github.com/surgioproject/surgio) | 1,826 / MIT | pushed 2026-09-26 20:01 UTC; `837db867b93fe19f672417bbf47511f6f84a9e88` | [node-field mapping by target core](https://github.com/surgioproject/surgio/blob/837db867b93fe19f672417bbf47511f6f84a9e88/src/utils/clash.ts#L24-L86) suits subscription generators; [template rule filtering](https://github.com/surgioproject/surgio/blob/837db867b93fe19f672417bbf47511f6f84a9e88/src/generator/template-filters.ts#L16-L49) deletes unsupported types. Local target generators already require explicit unsupported-item errors; silent deletion is not adopted. |

These five supplement the ten main samples, totaling fifteen projects whose representative source was actually read. Depth follows relevance to local problems, not full-file audits of every repository. YaNet's 671★ initial versus 670★ recheck is API snapshot movement during research.

<a id="规则数据库与运行时脚本不是同一类项目"></a>
### Rule databases and runtime scripts are different project categories

ACL4SSR, blackmatrix7, Loyalsoldier, DustinWin and SukkaW/Surge primarily contribute rule lists, upstream data and format generation/publication. They affect `rule-providers` content/updates, not runtime completeness of `main(config)` inputs, unique names or provider-only inputs without actual nodes. blackmatrix7's README/tree also includes client rewrites/scripts; assess each file/client capability rather than labeling the whole repository a “mihomo override script library”.

Aethersailor combines rules, configurations and OpenClash modules. Its documentation describes YAML modules downloading configuration, writing provider URLs and switching the running configuration, unlike JS rewriting the current subscription object. ShellCrash `providers_clash.sh` is likewise a manager workflow generating provider filters through shell. qichiyuhub/echs-top supply complete templates/Mihomo Smart examples. MyClash, powerfullz/override-rules and xiaolin-007/clash-verge-script are more directly useful for JS-object comparisons: MyClash offers empty-input/dialer/duplicate handling; powerfullz checks arrays but loses providers in output projection; xiaolin checks providers but replaces DNS. Adopt only evidenced design lessons, not complete behavior.

<a id="样本发现的有效点及边界"></a>
### Useful findings and their limits

| Technical point | Sample evidence | Useful lesson | Why not transplant directly |
|---|---|---|---|
| Explicit input types/data paths | echs-top constructs inline providers from `config.proxies` (JS L5-L8); MyClash explicitly rejects providers (L1576-L1594) | Define supported runtime shapes; understandable remote-provider-only rejection requesting SubStore flattening | Different entry points. Local code cannot assume `proxy-providers` are downloaded or disguise remote nodes as local `proxies`. |
| Fail closed on empty results | echs-top anchor uses `empty-fallback: REJECT` (L11-L15); MyClash rejects its empty-input cases | Return original config for originally empty `proxies`; if filtering empties valid input, still build a safe global group targeting `REJECT` | `empty-fallback` alone does not validate upstream objects; originally empty input differs from user-filtered-to-empty valid input. |
| Duplicate names/chain references | MyClash L839-L898 cleans/normalizes duplicates/dialers; powerfullz rebuilds objects | Keep first equivalent duplicate, reject conflicting names, preserve referenced chains/original names | Renaming changes targets; rejecting identical duplicates indiscriminately creates needless blockers. |
| Multiplier filtering | MyClash exposes a choice; ShellCrash/Sub-Store rename scripts provide label/regex strategies | Explicit local toggle, off by default; parse complete tokens and compare numerically when enabled | Tested `0.59x` matches MyClash low prefix `0.[0-5]`, a decimal-boundary issue. Its high band starts at 2, so `1.5x` outside high reflects the defined band; `倍率2` is unsupported label syntax. None replaces arbitrary positive numeric limits locally. |
| Name classification | Aethersailor YAML includes boundaryless `Panel` within a broader filter | Define English word boundaries to avoid matching non-panel labels by substring | YAML Mihomo uses RE2 substring semantics; JS uses its own regex/object processing. Do not infer one platform from another. |
| Smart/regional group structure | qichiyuhub/echs-top illustrate Smart, include-all and empty-group policies | Syntax/layout reference, separately validated against official core docs/current generator contract | Local 55-group Smart structure is established; no evidence warrants adding/removing groups or replacing default policies. |
| Multi-format rule publication | ACL4SSR, Loyalsoldier, DustinWin, blackmatrix7/Aethersailor | Assess specific providers by source license, format, behavior and fusion pipeline | The goal is input robustness; replacing/copying sources affects source graph, MRS, fused and 14 directories, beyond implementation scope. |

<a id="本地已实现能力避免重复建设"></a>
### Existing local capabilities: avoid duplication

The pipeline is already `routing-graph.js` v6.0.14 → MRS normalization → fused compilation → client artifacts. Source graph already generates rule-sets by provider URL, format and policy segment. Counts are source 514 providers / 973 rules → fused 132 providers / 151 rules; manifest `unresolved_providers`, `unresolved_sources` and `passthrough_providers` are empty. ACL4SSR Zoom rules and DustinWin ads MRS URLs are already declared (for example current HEAD `rulesets/source/routing-graph.js` L284, L321). These findings do not justify importing entire third-party suites or changing routing semantics.

Reuse full-rule generation, provider mappings, client fallbacks and rule-contract checks. This round concerns runtime preflight, unique names/effective counts, optional local multiplier filtering and boundaries for broad OpenClash junk-label terms. Subscription flattening is an input prerequisite, not permission to hide remote-provider fetching inside JS.

<a id="14-个产物目录适用性矩阵"></a>
## Applicability across 14 artifact directories

“14” follows `AGENTS.md`'s client artifact directories. OpenClash Normal/Smart share one row with separate implementation locations. Locations/lines were pinned by read-only local audit to stable HEAD `928eb7028d31883000921b2904ed952d22b30b07`. Five target files have since changed; baseline lines remain to trace original defects. Current implementation/acceptance follows below.

| Directory/artifact | Local runtime location | Applicability and action |
|---|---|---|
| Clash Party | Smart `Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js:22,135,277,1182,1207,1261`; Normal `Mihomo内核系/Clash Party/ClashParty(mihomo).js:23,134,288,1110,1132,1185` | FlClash-like `config.proxies` classification/cleanup/group construction: **applicable**. Both are among the 3 JS changes; keep Smart/Normal logic aligned. |
| Clash Meta For Android | `Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml:215-236,645-662` | Static YAML Subscribe/use/regional filter, not the same JS cleanup: **JS preflight not applicable**. Related name classification exists, but evidence did not reveal OpenClash Ruby's IPLC/transit/TG erroneous-removal conditions. |
| OpenClash | Normal `Mihomo内核系/OpenClash/OpenClash(mihomo).sh:2336-2345,2358,2512,2531,2563,2591`; Smart `Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh:2333-2342,2356,2506,2528,2560,2588` | `INFO_PATTERNS`, filtering, group fallback and `config.proxies` replacement: **applicable**, both Shell/Ruby implementations in scope. Broad rules incorrectly removed `HK IPLC 03 x3`, `HK 中转 01`, `HK Telegram 01` in actual samples. |
| Shadowrocket | `独立内核系/Shadowrocket/Shadowrocket.conf:122` and regional `policy-regex-filter` | Static name regex without subscription-object cleanup: **not applicable**. No corresponding IPLC/transit/TG negative-removal expression observed. |
| SingBox | `Sing-box内核系/SingBox/SingBox(sing-box)-generator.js:255-271` | Generates static selector/urltest; users connect nodes by tag, not the target runtime classification: **not applicable**. |
| v2rayN | `Xray内核系/v2rayN/v2rayN(xray).json:3-6,18` | Flat Xray RuleObject/outboundTag, no Mihomo subscription JS/dynamic classification: **not applicable**. |
| Surge | `独立内核系/Surge/Surge.conf:114` and regional `include-all-proxies`/regex | Static classification without equivalent JS/object-deletion path: **not applicable**. |
| Loon | `独立内核系/Loon/Loon.conf:68-80` | NameRegex Remote Filter, not this proxy-object cleanup: **not applicable**. |
| Quantumult X | `独立内核系/Quantumult X/QuantumultX.conf:46,80-85` | server-tag-regex classification without Mihomo JS objects: **not applicable**. |
| Passwall | `双内核系/Passwall/Passwall(xray+sing-box)-apply.sh:87-95` | Installs fused shunt rules, no node/provider classification: **not applicable**. |
| Passwall2 | `双内核系/Passwall2/Passwall2(xray+sing-box)-apply.sh:87-95` | Same shunt-rule installation role as Passwall: **not applicable**. |
| FlClash | `Mihomo内核系/FlClash/FlClash(mihomo).js:53,163,317,1171,1196,1257` | Equivalent JS classification/array cleanup to Party Normal: **applicable**, one of the 3 JS targets. |
| Stash | `独立内核系/Stash/Stash.yaml:125-136,545-558` | Static YAML provider/use/filter; generator deliberately omits Mihomo exclude-filter/health-check: **JS preflight not applicable**; do not mechanically copy Mihomo fields. |
| Egern | `独立内核系/Egern/Egern.yaml:89-95,98-127` | Static Subscribe, Smart policies/flatten and name filter: **JS flow/cleanup not applicable**. Record separately implemented classification semantics; outside this change. |

Mihomo defines `use` as references to `proxy-providers`, while `include-all-proxies` refers to explicitly defined configuration proxies. Official docs also say `url` tests do not check provider nodes introduced through `use`. Provider entries therefore differ by client; “all groups contain nodes” does not imply scripts receive the same data. See [official Mihomo proxy-group documentation](https://wiki.metacubex.one/en/config/proxy-groups/).

<a id="本地探针证据与实施建议"></a>
## Local probe evidence and implementation recommendations

On 2026-09-30 the coordinating thread ran read-only input probes against the stable baseline without repository writes. Review material: `%TEMP%\smart-config-research-20260930\audit\probe.js`, `probe-output.jsonl`, `openclash_filter.rb`, `openclash-filter-output.jsonl`. Baseline behavior varies: originally empty `proxies` returns original config; all three JS scripts also return Provider-only unchanged; mixed input retains provider definitions but dynamic regional groups omit remote nodes. Conflicting names/`null` were not consistently rejected. After cleanup removed all candidates, partial output still contained 34 groups/151 rules; `flow: 1` also produced 0 groups/0 rules with DNS already written. Actual OpenClash regex samples removed IPLC, transit and Telegram nodes. This supports preflight, atomic failure and narrower filters, not rule-source/global-policy changes.

MyClash multiplier probes add detail: `JP 0.59x` matched the low regex's `0.[0-5]` prefix, a measured decimal-boundary problem. High begins at 2, so `JP 1.5x` not matching high is intentional banding; `JP 倍率2` is unsupported label syntax. `JP x2`, `JP 2x`, `JP 2.5x` match high. Adopt only user-selectable filtering intent/explicit toggles; local max multiplier must parse complete tokens numerically rather than copy regex/bands.

Recommended controlled behavior:

1. Check `config`/`proxies` structure before mutation. The target mode classifies only flattened `proxies` arrays. Explicitly reject nonempty remote `proxy-providers` with SubStore-flatten guidance; mixed inputs must not silently omit provider nodes. Keep first equivalent duplicates, reject conflicting names, invalid types and chains/`dialer-proxy` relationships that cannot be preserved safely.
2. Originally empty `proxies` returns original configuration without partial rules. If enabled filtering empties nonempty input, still build global select targeting `REJECT`. Errors must return original configuration or fail explicitly before mutation, never half-modified output.
3. Make multiplier filtering a local, default-off toggle. Apply thresholds only to clearly parsed fields/tokens. Unparseable nodes follow an explicit visible policy and are not mistakenly deleted by default. Keep original names/referenced objects.
4. Share sample-validated narrow filters across OpenClash Normal/Smart; remove proven overbroad terms. Apply English token boundaries to JS `Panel`, checked with JS samples rather than assuming YAML/RE2 results apply.
5. Preserve `SOURCE_GRAPH_VERSION = v6.0.14`, fused assets, rule priority, the 55-group system, DNS/Smart defaults and other directories. Source remains 514 providers / 973 rules, fused 132 providers / 151 rules. With no source/upstream/provider/rule/DNS content changes, do not run upstream download/full generation and introduce unrelated drift. Update five runtime-script version suffixes under project rules; audit equivalent applicability and exceptions in the other eleven artifact directories, not rebuild all rules. Static-client “not applicable” claims require the locations/reasons above.

<a id="验证覆盖"></a>
## Validation coverage

User-facing behavior/multiplier parameters: [subscription-node preflight and multiplier-filtering guide](../subscription-node-filter.md).

- Test each of 3 JS scripts with normal multiple nodes, original empty array, `null`, missing `proxies`, Provider-only, mixed local/provider, equivalent/conflicting duplicates, non-JSON values, `flow: 1`, common `dialer-proxy` chains, valid low/high/decimal multipliers, absent multipliers and names containing non-token `Panel`. Record success/unchanged/rejection/errors. Ensure empty arrays preserve config, conflicts avoid partial mutation and filtered-to-empty global targets `REJECT`.
- Extract actual `INFO_PATTERNS` from both OpenClash scripts; regress `HK IPLC 03 x3`, `HK 中转 01`, `HK Telegram 01`, plan/expiration-notice nodes and normal regional nodes. Narrow filters must still remove informational junk, without removing dedicated-line/transit/service nodes.
- Run required JS/cross-client contracts for relevant Normal/Smart/FlClash targets, plus OpenClash YAML/Ruby parsing and duplicate top-level-key checks. Confirm 55 groups, rule/provider references and fused manifest are unchanged.
- Save/compare source/fused versions and semantic hashes; run `git diff --check` and inspect diff scope. Distinguish “probe passed” from “CI/static validation passed” when reporting.
- Limits: script I/O evidence only; no Mihomo, OpenClash, Stash or Egern client started. Empty-group loading, actual duplicate-name loading and live remote-provider expansion still need real core/client validation. Local probes are not device acceptance.

<a id="最终实现与验收2026-09-30"></a>
## Final implementation and acceptance (2026-09-30)

`git pull --ff-only origin main` returned Already up to date; preimplementation `HEAD` and `origin/main` were both `928eb7028d31883000921b2904ed952d22b30b07`. Changes passed acceptance on `codex/research-routing-overwrites`; the user subsequently authorized committing/pushing `main`. Remote Git commits determine publication status. Local validation used Windows, Node.js v24.14.0 and Ruby 3.3.11; repository CI uses Node.js 22 / Ruby 3.3.

| Artifact | New version | Implemented behavior |
|---|---|---|
| Clash Party Smart | v6.0.14-dns.10 | Preflight, equivalent deduplication, optional multipliers, chain/cycle validation, empty-global REJECT |
| Clash Party Normal | v6.0.14-normal.11 | Same node semantics as Smart, retaining url-test regional groups |
| FlClash | v6.0.14-flclash.12 | Same as Normal, preserving array identity/client-managed fields |
| OpenClash Normal / Smart | v6.0.14-oc-normal.9 / v6.0.14-oc-smart.9 | Preflight before YAML writes; fix IPLC/transit/DNS/Telegram removal; align multiplier/dependency/cycle checks with JS |

Shared [JS runtime](../../tools/runtime/subscription-node-filter.js) and [Ruby runtime](../../tools/runtime/subscription-node-filter.rb) were added, with embedded-copy synchronization checks to prevent five artifacts drifting. Multipliers default off; when enabled, only definitely over-limit nodes are removed. Unknown, zero or conflicting labels stay. `0.59x`, `1.5x`, `1.50x` use full numeric values; `2×` and `?×` have regressions. Informational English labels use ASCII word boundaries, including Chinese-adjacent `Panel香港` and nonfiltered `Panelist`.

| Check actually run | Result |
|---|---|
| `node --test tools/tests/*.test.js` | **89/89**, including 40 new JS node-filter and 49 existing regressions |
| `node tools/validate-js-overwrites.js` | Three targets passed; complete fixtures each 55 groups / 151 rules / 132 providers |
| `node tools/validate-artifact-contracts.js --strict-ruby` | **2272 checks / 19 artifacts passed**; existing old-version `.conf` notices remain nonblocking |
| `node tools/test-openclash-node-filter.js` | Both actual Ruby heredocs executed and saved YAML readback passed; 36 JS/Ruby name samples agree |
| `node tools/test-openclash-node-dns-hints.js` | Normal/Smart passed |
| Both node-filter synchronizers and Node-DNS synchronizer `--check` | Passed; temporary CRLF copies also verified read-only drift detection, repair synchronization and unchanged repeated-sync hashes |
| `node tools/test-info-node-filter.js` / `node tools/test-kr-boundary.js` | English boundaries passed across six artifacts; 35 regional-boundary samples passed |
| `node tools/validate-process-name-direct.js` | Passed: 53 direct desktop / 4 RustDesk work / 25 Surge direct |
| `node tools/validate-generated-remote-asset-size.js` | Individual budgets for 533 referenced assets and aggregate budgets for 13 clients passed |
| Ruby YAML parsing of three changed workflows / `git diff --check` | Passed |

Independent read-only review also ran self-cycles, two-node cycles, valid multihop chains, `__proto__`/`constructor` names and 10,000-node input. Preflight rejection did not mutate originals; five artifact SHA-256 hashes remained unchanged before/after read-only sync checks. This small sample supports no latency/throughput/memory improvement claims. New checks are wired into CI for remote Actions after publication; the table records local acceptance.

Rule-asset Git blobs exactly match the baseline:

| File | Identical baseline/current Git blob |
|---|---|
| `rulesets/source/routing-graph.js` | `c6ed0327ef7511461efecfa0f71c78187520864f` |
| `rulesets/generated/fused/manifest.json` | `8d50f08bb16bafbcb799cad0f0fa4770986b77dd` |
| `rulesets/generated/mihomo-mrs/manifest.json` | `05d2e755d05c0ff0600f03ed929e40ab8ca4126e` |

MRS counts remain converted=237, split=28, partial=70, existing_mrs=35, retained=23, failed=0. Fused unresolved_providers / unresolved_sources / passthrough_providers remain empty. `git diff --name-only -- rulesets/source rulesets/generated` produced no output.

Device boundary: local Node VM and actual Ruby processor acceptance, without client startup/real connections. No bash was available locally, so `bash -n` was not separately run. Existing Node-DNS adds a default-DoH-equivalent node policy on a second pass with no source DNS; all three baseline JS scripts reproduce it, without observed resolver-source changes. This round did not expand scope.

<a id="来源完整性与客户端验证边界"></a>
## Source completeness and client-validation boundaries

- The coordinating thread's GitHub repository/commit connector filled initial cache gaps: DustinWin 1,416★ / GPL-3.0, and that day's Loyalsoldier master `ab21f1c…`; this report incorporates that evidence. SukkaW metadata points to newer same-day master `38ac44a…`, while analysis pins `79b7fa2…`; they must not be described as the same commit.
- Aethersailor configuration/override documentation explains acquisition/YAML filters, not official OpenClash module specifications. Extending core-field compatibility still requires official evidence under repository `AGENTS.md §2`.
- MyClash README notes Windows routing/multihomed resolution affects DNS-leak conclusions; source configures DNS/hosts. Promotional README wording does not establish that local changes “prevent DNS leaks”; its DNS baseline is not adopted.
- This round validates local scripts/generation contracts, not client devices. Device compatibility is not inferred from local probes.
