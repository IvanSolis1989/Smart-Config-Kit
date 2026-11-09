<a id="github-分流脚本搜索与横向比较"></a>
# GitHub routing-script search and comparison

**English** | [简体中文](2026-09-30-github-routing-script-comparison.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

Snapshot: 2026-09-30 UTC. This report expands the first study's search coverage and direct-script comparison; the local implementation baseline is the pushed `f0966c5309e4babdf9c070ff6faf7dba7ed0c67b`. The initial report mixed rule data, configuration templates, managers and override scripts, so its total project count cannot establish direct-script coverage. Subsequent direct/reject preservation, constrained static inline-provider flattening and native CMFA type filtering are described in [runtime follow-up](2026-09-30-routing-runtime-followup.md).

<a id="搜索方法与可核对证据"></a>
## Search method and verifiable evidence

Candidates were discovered through GitHub repository/web searches, then GitHub REST `GET /search/repositories` with explicit `sort=stars&order=desc&per_page=100` and complete pagination. The eight queries below returned **482 hits, or 377 repositories after deduplication**: search candidates, **not repositories whose source was closely read**. Every returned page had `incomplete_results=false`; each query's fetched count matched `total_count`.

Queries, request URLs, fetch times, page counts and each result's rank/repository/stars are stored in [GitHub search evidence JSON](2026-09-30-github-search-evidence.json). Rankings apply only to recorded queries, not an exhaustive GitHub-wide leaderboard. Multiple keywords use intersection and README matches introduce irrelevant projects; broad searches were therefore supplemented with Chinese override/routing terms, language and repository-name searches, followed by reading candidate source/trees.

| Query ID | GitHub query | Hits | Pages fetched |
|---|---|---:|---:|
| 0 | `clash script in:name,description stars:>=100 fork:false` | 8 | 1 |
| 1 | `mihomo script in:name,description,readme stars:>=100 fork:false archived:false` | 137 | 2 |
| 2 | `clash 覆写 in:name,description,readme stars:>=100 fork:false archived:false` | 33 | 1 |
| 3 | `clash 分流 in:name,description stars:>=300 fork:false archived:false` | 17 | 1 |
| 4 | `clash-verge-script in:name,description stars:>=50 fork:false archived:false` | 2 | 1 |
| 5 | `mihomo override in:name,description,readme stars:>=100 fork:false archived:false` | 35 | 1 |
| 6 | `clash in:name,description,readme language:JavaScript stars:>=100 fork:false archived:false` | 210 | 3 |
| 7 | `mihomo in:name,description,readme language:JavaScript stars:>=100 fork:false archived:false` | 40 | 1 |

The main runtime-script threshold was 100★, with supplementary reading of 50–99★ projects and lower-star web discoveries. It is only this study's screening threshold. Rule-data/generator repositories with thousands or tens of thousands of stars were compared separately, not ranked as Mihomo override scripts. GitHub's JavaScript primary-language label does not establish a routing entry point.

<a id="直接运行的-mihomoclash-覆写脚本"></a>
## Directly executed Mihomo/Clash override scripts

Source directly processing configuration objects was read in all **9 repositories** below, ordered by that day's stars. Five were initial samples; four were new: Repcz, Perfect-Rules, selfproxy and HotKids. Links pin corresponding default-branch snapshot commits. This is a selected comparison sample, not a full source audit of 377 candidates. powerfullz maintains TypeScript source; [the imported artifact is compiled convert.min.js](https://github.com/powerfullz/override-rules/blob/f41f44b5b6ce54679dad0f981c82159b4f08f2e5/README.md#L33-L40), so the table's TS files are analysis entry points.

| Rank | Repository | Stars | Branch / pinned source entry | Reading scope | License (API SPDX) |
|---|---|---:|---|---|---|
| 1 | [Repcz/Tool](https://github.com/Repcz/Tool) | 1,166 | X / [Override.js](https://github.com/Repcz/Tool/blob/835041891c7cad2ee7edd22ede12197b77620fba/mihomo/Client/Override/Override.js) | Direct JS; mixed repository assessed through this file | MIT |
| 2 | [n0de-sudo/Perfect-Rules](https://github.com/n0de-sudo/Perfect-Rules) | 953 | main / [Clash_mi.js](https://github.com/n0de-sudo/Perfect-Rules/blob/0a31165c1f70f2d548b49be5d1bb83a45ee06205/Clash/Clash_mi.js), [FlClash.js](https://github.com/n0de-sudo/Perfect-Rules/blob/0a31165c1f70f2d548b49be5d1bb83a45ee06205/Clash/FlClash.js) | Both actual entries and subscription-provider group preservation | Not identified by API |
| 3 | [AIsouler/MyClash](https://github.com/AIsouler/MyClash) | 897 | main / [mihomoScript.js](https://github.com/AIsouler/MyClash/blob/be777c8aaa563f0b5f83623c94f651f311559e57/Script/mihomoScript.js) | Toggles, input, multipliers, duplicate names, dialer | MIT |
| 4 | [xiaolin-007/clash-verge-script](https://github.com/xiaolin-007/clash-verge-script) | 819 | main / [optimized extension script](https://github.com/xiaolin-007/clash-verge-script/blob/66d3ae9937442f6e8ba97d3cf913f8da6b97966f/%E6%89%A9%E5%B1%95%E8%84%9A%E6%9C%AC-%E4%BC%98%E5%8C%96%E7%89%88.js) | Provider checks, node postprocessing, DNS | Not identified by API |
| 5 | [dahaha-365/YaNet](https://github.com/dahaha-365/YaNet) | 670 | main / [global_script.js](https://github.com/dahaha-365/YaNet/blob/0b6a25b65730732b37487e7dc3bf5b58461942c2/Mihomo/global_script.js) | Regional classification, multiplier threshold | BSD-3-Clause |
| 6 | [powerfullz/override-rules](https://github.com/powerfullz/override-rules) | 589 | main / [main.ts](https://github.com/powerfullz/override-rules/blob/f41f44b5b6ce54679dad0f981c82159b4f08f2e5/src/main.ts), [node_parser.ts](https://github.com/powerfullz/override-rules/blob/f41f44b5b6ce54679dad0f981c82159b4f08f2e5/src/node_parser.ts) | Array validation, node classification, output-object projection | MIT |
| 7 | [yyhhyyyyyy/selfproxy](https://github.com/yyhhyyyyyy/selfproxy) | 545 | main / [script.js](https://github.com/yyhhyyyyyy/selfproxy/blob/06a98015e9803206fd72ee2b4f457f338bce4483/Mihomo/Extension_Script/script.js) | All 714 lines; six VM inputs | Not identified by API |
| 8 | [HotKids/Rules](https://github.com/HotKids/Rules) | 474 | master / [Clash/Script](https://github.com/HotKids/Rules/tree/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script) | Four actual JS variants; representative-entry input comparison | Not identified by API |
| 9 | [echs-top/proxy](https://github.com/echs-top/proxy) | 184 | main / [mihomo_smart.js](https://github.com/echs-top/proxy/blob/e5e53ad5591b07d1324f802b0658d314cea91dc4/mihomo_smart.js) | Inline provider, Smart, empty-group anchors | Not identified by API |

YaNet was found through projects related to the first round, not these eight queries; no query rank is invented. Its stars/default branch were rechecked with repository/commit APIs in the supplement, as were the other first-round scripts' metadata.

The license column records that day's API `license.spdx_id`; unidentified values do not imply copying permission. Per-repository metadata is in the search evidence JSON. Stars retain the search snapshot: later license review found Perfect-Rules at 954★ and xiaolin at 820★ versus the table's 953★/819★, reflecting different retrieval times with unchanged ordering.

<a id="源码取舍与本地适用性"></a>
## Source trade-offs and local applicability

<a id="repcz原生-provider-路径简洁完整-dns-覆盖存在取舍"></a>
### Repcz: concise native-provider path, with whole-DNS replacement trade-offs

The entry counts explicit nodes/providers and throws if both are empty: [input gate](https://github.com/Repcz/Tool/blob/835041891c7cad2ee7edd22ede12197b77620fba/mihomo/Client/Override/Override.js#L18-L25). Regional groups use `include-all: true` and `filter` so Mihomo collects nodes, allowing Provider-only configuration without JS downloading remote nodes first: [native grouping](https://github.com/Repcz/Tool/blob/835041891c7cad2ee7edd22ede12197b77620fba/mihomo/Client/Override/Override.js#L187-L232). This suits native remote providers. The local classifier processes actual nodes, duplicate names, multipliers and dialers and requires flattened input; adding `include-all` alone does not make the paths equivalent.

The cost is replacing whole DNS/hosts blocks, losing private subscription-provider resolution in the sample: [replacement code](https://github.com/Repcz/Tool/blob/835041891c7cad2ee7edd22ede12197b77620fba/mihomo/Client/Override/Override.js#L41-L59). Hong Kong and Provider-only VM inputs each generated 17 groups without dangling static group references. Entirely empty input threw without mutation; duplicate names remained as two entries and missing dialers were retained. Empty regions have no explicit `empty-fallback` and use core defaults. This is a valid native configuration-generation path, but does not undertake this repository's added node-ambiguity/chain validation.

<a id="hotkids私有节点解析值得保留主版与私人版须分别评估"></a>
### HotKids: preserve private-node resolution; assess main and personal variants separately

Main `Script.js` first recognizes valid explicit nodes/providers and throws early on empty input: [input](https://github.com/HotKids/Rules/blob/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script/Script.js#L39-L48). Regional groups use `include-all-providers: true`; with providers but no explicit nodes, `proxies` is removed so the core collects them; absent sources use `COMPATIBLE`: [grouping and fallback](https://github.com/HotKids/Rules/blob/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script/Script.js#L189-L235). Three personal variants instead require explicit nodes, for example [MyScript.js](https://github.com/HotKids/Rules/blob/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script/MyScript.js#L41-L47); the main variant's capabilities must not be attributed to every file.

A useful feature captures private DNS and current-node hosts before replacement, then restores them: [capture](https://github.com/HotKids/Rules/blob/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script/Script.js#L50-L69), [restore](https://github.com/HotKids/Rules/blob/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script/Script.js#L139-L146). Its policies are identified through public-DNS name/IP denylists, not limited to actual node domains. The local `SckiSubscriptionAdapter.captureNodeDns/applyNodeDns` already projects active-node domains, validates values and reports with redaction, covered by JS/Ruby regressions; that clearer local boundary is reused.

Main-variant Hong Kong/Provider-only VM inputs each generated 23 groups with no dangling static group references. Duplicate names remained in the node pool/regional groups; missing dialers remained; private DNS/hosts restoration succeeded. Five additional `MyScript.js` inputs showed early rejection of Provider-only and 29 groups for valid Hong Kong input. The other two personal variants were source-read only, not claimed VM-tested. The main native-provider path likewise lacks real-core download/dialing validation.

<a id="perfect-rules保留机场组有明确场景输入预检仍需要独立处理"></a>
### Perfect-Rules: provider-group preservation has a use case; preflight remains separate

It identifies subscription providers' base groups by name and actual node membership, deep-copies them and removes `hidden`, retaining original selectors. Its `ratio` means the proportion of group members that are actual nodes, not a traffic billing multiplier: [provider-group recognition](https://github.com/n0de-sudo/Perfect-Rules/blob/0a31165c1f70f2d548b49be5d1bb83a45ee06205/Clash/Clash_mi.js#L775-L903). This suits users needing original provider groups. The local fixed-group system deliberately clears subscription groups and has no such requirement, so no additional retention heuristic is added.

Both scripts collect names from `config.proxies` and modify DNS before classification: [ClashMi entry](https://github.com/n0de-sudo/Perfect-Rules/blob/0a31165c1f70f2d548b49be5d1bb83a45ee06205/Clash/Clash_mi.js#L1-L74), [node collection](https://github.com/n0de-sudo/Perfect-Rules/blob/0a31165c1f70f2d548b49be5d1bb83a45ee06205/Clash/Clash_mi.js#L330-L345). Each entry was tested with five inputs: one Hong Kong node, empty array, Provider-only, duplicate names and missing dialer. Hong Kong produced 15 groups; empty/Provider-only produced 14, with only China-direct in the one-click proxy group and empty `use` in every group. Duplicate names remained in the Hong Kong group and missing dialers remained. This establishes different preflight boundaries, not an upstream promise of Provider-only support.

<a id="selfproxydns-数据生成清晰空组回退和输入原子性需区分"></a>
### selfproxy: clear DNS-data generation; distinguish empty fallback from input atomicity

Generated fake-IP, nameserver-policy, hosts and rule-provider blocks are clearly marked and maintained by workflow for source traceability: [generated fields](https://github.com/yyhhyyyyyy/selfproxy/blob/06a98015e9803206fd72ee2b4f457f338bce4483/Mihomo/Extension_Script/script.js#L16-L159). The local source graph → MRS → fused → client pipeline already exists. Its boundary documentation is useful without introducing another rule authority.

The entry checks only whether `proxies` exists, then modifies basic settings, DNS, hosts and TUN before groups: [entry](https://github.com/yyhhyyyyyy/selfproxy/blob/06a98015e9803206fd72ee2b4f457f338bce4483/Mihomo/Extension_Script/script.js#L1-L14). No regional match returns `["COMPATIBLE"]`, so subsequent nonempty filtering retains those groups: [group filtering](https://github.com/yyhhyyyyyy/selfproxy/blob/06a98015e9803206fd72ee2b4f457f338bce4483/Mihomo/Extension_Script/script.js#L289-L301), [fallback function](https://github.com/yyhhyyyyyy/selfproxy/blob/06a98015e9803206fd72ee2b4f457f338bce4483/Mihomo/Extension_Script/script.js#L705-L712). With only a Hong Kong node, testing still generated 28 groups, including 18 regional automatic/manual groups containing `COMPATIBLE`. An empty array left ALL's node list empty; `proxies={}` threw after modifying DNS; duplicate names entered ALL; missing dialers remained; Provider-only without `proxies` returned unchanged.

`COMPATIBLE` itself is not called a syntax error. Official Mihomo documentation explicitly states [empty-fallback defaults to COMPATIBLE](https://wiki.metacubex.one/config/proxy-groups/#empty-fallback). Using `REJECT` after local filtering empties the candidates is this repository's failure contract, not something to change by copying another fallback value.

<a id="首轮直接脚本的横向结论"></a>
### Comparison conclusions for the initial direct scripts

| Project | Useful design | Cost/boundary | Local decision |
|---|---|---|---|
| MyClash | Toggles, duplicate/dialer handling, explicit provider-input boundary | Multiplier-band regex is not an arbitrary numeric threshold; `0.59x` can match the low prefix incorrectly; DNS/hosts are rewritten | Reimplement conservative numeric parsing, equivalent deduplication, conflict rejection and chain validation; multiplier filtering defaults off |
| xiaolin | Checks both explicit nodes and providers; postprocesses node parameters | A provider field does not mean remote nodes were downloaded in JS; replaces whole DNS | Retain actual input-shape validation, not the whole configuration |
| YaNet | Clear numeric threshold and single-pass classification | Above-limit branch skips regional classification but leaves original nodes globally; not node deletion | Filter the effective node pool, then validate dialer dependencies |
| powerfullz | Array checks, modular region/cost classification | Rebuilt output projects fields rather than preserving all input; provider compatibility cannot be inferred from entry alone | Validate before writing, retain unknown protocol fields and original names |
| echs-top | Concise inline-provider, Smart and `empty-fallback: REJECT` representation | Also rewrites global configuration/DNS; entry semantics differ | Supporting evidence for empty-group design; retain existing local implementation |

Pinned line-level evidence for these five, MyClash multiplier probes, the local 14-directory audit and implementation acceptance appear in [initial research report](2026-09-30-routing-script-research.md). In particular, MyClash's high band begins at 2: `1.5x` not matching high is its band definition, not a parser error.

<a id="高星模板规则数据与管理器"></a>
## High-star templates, rule data and managers

| Repository | Stars | Category/evidence | Useful points and boundaries |
|---|---:|---|---|
| [Lanlan13-14/Rules](https://github.com/Lanlan13-14/Rules) | 575 | main `36ac1b34ecb25e0be6b0c3d2b697d8fb003020be`; [configuration positioning](https://github.com/Lanlan13-14/Rules/blob/36ac1b34ecb25e0be6b0c3d2b697d8fb003020be/README.md#L46-L65), [Substore snippet](https://github.com/Lanlan13-14/Rules/blob/36ac1b34ecb25e0be6b0c3d2b697d8fb003020be/Others/Substore.md#L56-L82) | No standalone `.js/.mjs/.ts/.sh` runtime entry in the 1,441-entry recursive tree; copyable documentation snippets are not direct JS samples |
| [mihomo-party-org/override-hub](https://github.com/mihomo-party-org/override-hub) | 572 | [override examples](https://github.com/mihomo-party-org/override-hub/blob/1c7c45c3512a22b5b3425eb2e6c101d4d45691ce/README.md#L1-L24) | Useful fields/entries, not a unified robust subscription processor; DNS example names are not system DNS-leak test evidence |
| [wangrongding/clash-kit](https://github.com/wangrongding/clash-kit) | 330 | [Node CLI manager](https://github.com/wangrongding/clash-kit/blob/9713cfa7662224d403ea429f5c643d967f5f6d34/README.md) | Manages core, subscriptions, latency tests and system proxy; do not place manager duties in override functions |
| [dishao123/rules_script](https://github.com/dishao123/rules_script) | 328 | [configuration-link directory](https://github.com/dishao123/rules_script/blob/262a2987cfa8f32b5c9da31765ee4c92a67829fd/README.md) | Despite “script” in the name, this snapshot supplies QX/Loon configurations, not Mihomo scripts by naming alone |
| [Accademia/Additional_Rule_For_Clash](https://github.com/Accademia/Additional_Rule_For_Clash) | 324 | [supplemental service rules](https://github.com/Accademia/Additional_Rule_For_Clash/blob/0dff7831cdebc155ef57998fcd88ed20d977f788/README.md) | Corresponding rule sources already exist locally; evaluate specific providers/order, not promotional “zero-leak” conclusions |
| [Seven1echo/Yaml](https://github.com/Seven1echo/Yaml) | 277 | [declarative ClashMi override](https://github.com/Seven1echo/Yaml/blob/08996f9236766ad7cb11ba1aace135f3e3503b1e/Seven1_fallback_Rule-Set_Clashmi_Overwrite.yaml#L1-L33); [Sub-Store rename.js](https://github.com/Seven1echo/Yaml/blob/08996f9236766ad7cb11ba1aace135f3e3503b1e/sub-store/rename.js#L230-L249) | `empty-fallback: REJECT` is useful; rename extracts/retains multiplier labels as subscription preprocessing. `ratio` naming/label processing is not actual multiplier filtering; do not transplant regional lookaround regex into other cores |
| [Giveupmoon/OpenClash_Overwrite](https://github.com/Giveupmoon/OpenClash_Overwrite) | 233 | [OpenClash Smart module](https://github.com/Giveupmoon/OpenClash_Overwrite/blob/3ab3c170bd3303dc5f063679ca1df3383957936c/Overwrite/Overwrite-smart.conf#L1-L30), [EN_KEY injection](https://github.com/Giveupmoon/OpenClash_Overwrite/blob/3ab3c170bd3303dc5f063679ca1df3383957936c/Overwrite/Overwrite-smart.conf#L157-L172) | Useful individual toggles, but depends on OpenClash loading/environment variables; not directly executable JS for Clash Party/FlClash under `Mihomo内核系` |
| [chinnsenn/ClashCustomRule](https://github.com/chinnsenn/ClashCustomRule) | 158 | [rule library and subscription publishing](https://github.com/chinnsenn/ClashCustomRule/blob/e0404bbb36258b4954b1527730413363936b22f9/README.md) | A converter aggregates subscriptions and Actions validates/publishes; a separate generation/publication workflow |

Representative source was also read in first-round Loyalsoldier (28,624★), blackmatrix7 (28,084★), ShellCrash (13,321★), ACL4SSR (6,750★), Aethersailor (6,566★), SukkaW/Surge (4,508★), surgio (1,826★) and DustinWin (1,416★). These are same-day first-round snapshots; categories, licenses, strengths/weaknesses and pinned SHAs remain in the initial report. They must not be added to a leaderboard of the nine direct scripts.

<a id="低于筛选门槛的补充审读"></a>
## Supplementary reading below the threshold

All four projects' source was read. They are outside the 100★ direct-script set and cannot inflate the “high-star repository” count.

| Repository / Stars | Pinned commit/source evidence | Features, costs and decision |
|---|---|---|
| [mwmi/ClashVergeGlobalScript](https://github.com/mwmi/ClashVergeGlobalScript) / 98 | `ec76f1ab79d0d5fabf49a43d948e521e4fa07a1c`; license not identified by API; [two input paths](https://github.com/mwmi/ClashVergeGlobalScript/blob/ec76f1ab79d0d5fabf49a43d948e521e4fa07a1c/GlobalScript.js#L715-L851) | Provider `use+filter` path only when `proxies` is missing/falsy. `proxies: []` plus providers takes the explicit path and returns on empty names without regional groups. Substring classification and whole-DNS/rule overrides have costs; local input requires SubStore flattening, so this path is not added |
| [Adsryen/clash-override](https://github.com/Adsryen/clash-override) / 57 | `b51956c511b5333282c38f68b0db0d5d7107f65b`; MIT; [toggles](https://github.com/Adsryen/clash-override/blob/b51956c511b5333282c38f68b0db0d5d7107f65b/global_script.js#L31-L78), [entry](https://github.com/Adsryen/clash-override/blob/b51956c511b5333282c38f68b0db0d5d7107f65b/global_script.js#L607-L630) | DNS override defaults off, multiplier filtering on; clear regional thresholds, but calls `config.proxies.map` directly after checking providers. Static observation only, not a claimed Provider-only probe execution |
| [wchiway/mihomo-proxy](https://github.com/wchiway/mihomo-proxy) / 7 | `6d98bf76b04155e2194c9a07e42938e05d748197`; MIT; [FlClash input checks](https://github.com/wchiway/mihomo-proxy/blob/6d98bf76b04155e2194c9a07e42938e05d748197/src/flclash-main.ts#L97-L150), [actual include-all grouping](https://github.com/wchiway/mihomo-proxy/blob/6d98bf76b04155e2194c9a07e42938e05d748197/src/flclash-main.ts#L160-L202), [duplicate-name handling](https://github.com/wchiway/mihomo-proxy/blob/6d98bf76b04155e2194c9a07e42938e05d748197/src/proxies.ts#L18-L65) | Client-specific variants; mobile entry supports both sources through provider keys/include-all, falls back to DIRECT on no sources, suffixes duplicate names and sorts by multiplier. Do not extrapolate mobile support to desktop; renaming/all-empty DIRECT are not adopted |
| [mowangmowang/clash-rule-scripts](https://github.com/mowangmowang/clash-rule-scripts) / 2 | `db5502aef1c2e4479fe0a64cabb19933298f9425`; MIT; [entry and grouping](https://github.com/mowangmowang/clash-rule-scripts/blob/db5502aef1c2e4479fe0a64cabb19933298f9425/Clash_script_v1.js#L690-L770) | Readable variant/toggle comments; checks provider keys but later groups still depend on explicit proxies and DNS is rewritten. Reuse documentation organization, not the configuration suite |

<a id="对本仓库的决定与验证边界"></a>
## Local decisions and validation boundaries

Subsequent implementation goes beyond this report's initial conclusions: five JS/Ruby entries retain direct/reject chain-reference definitions, project only remote nodes into automatic-selection groups, and support exact-field static inline collections. Remote providers or those carrying additional semantics remain explicitly rejected. Native CMFA groups use exclude-type/empty-fallback with Mihomo controller fixture receipts. Full contracts, 14-directory applicability and acceptance boundaries: [runtime follow-up](2026-09-30-routing-runtime-followup.md). Multiplier filtering still defaults off; provider-group retention, multiplier sorting, general provider `use/filter` and load balancing were not adopted.

Mihomo [use / include-all / filter](https://wiki.metacubex.one/config/proxy-groups/), [DNS fields](https://wiki.metacubex.one/config/dns/) and Clash Verge Rev [main(config) script entry](https://www.clashverge.dev/guide/script.html) were consulted again that day. Provider existence, expanded nodes and runtime group-reference coverage require separate validation.

The four new direct-script repositories and six actual files have **31 VM probe results** in [configuration-transform probe evidence](2026-09-30-routing-script-probes.json), recorded by repository/pinned SHA/file/input. VM checks only JS transformations using synthetic inputs, without provider downloads, real DNS/network calls or dependency installation. It cannot establish core startup or absence of real DNS leaks. Inputs not promised by upstream compare processing boundaries; differences are not indiscriminately reported as bugs. No third-party source, rule entries or entire policy suites were transplanted. Unidentified API licenses do not imply unrestricted copying.

The follow-up updates local results: node-filter regressions 73/73, three JS override targets, strict Ruby contract 2,276 checks / 19 artifacts, PROCESS-NAME, and OpenClash node/Node-DNS tests each 2/2 passed. CMFA has a separate controller configuration matrix receipt. Search-evidence pagination/totals/deduplication/itemwise star-order readback passed. Rule authority and fused baseline remain v6.0.14. No source/upstream/provider/rule/DNS contents changed, so remote rule sync/full generation were not run. Device UI, real subscription downloading and actual dialing are excluded; see [runtime follow-up](2026-09-30-routing-runtime-followup.md).
