<a id="运行时节点类型与-provider-展平补充研究"></a>
# Follow-up research on runtime node types and provider flattening

**English** | [简体中文](2026-09-30-routing-runtime-followup.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

Date: 2026-09-30 UTC. This supplements the implementation conclusions in the [GitHub routing-script comparison](2026-09-30-github-routing-script-comparison.md). The previous stage ended too early with “no new optimization”: new input-shape evidence expanded local runtime support to **retain direct/reject objects needed for interface/chain references while offering only selectable remote proxies to regional, residential and latency-test groups**; safely flatten narrowly specified inline providers; and strengthen structural preflight before overrides. Code was reimplemented against local contracts, not copied from upstream. GitHub stars remain the original research's 2026-09-30 snapshot.

<a id="新增证据与决策"></a>
## Additional evidence and decisions

HotKids Script.js provides a useful reference for recognizing valid proxy sources/object shapes: [pinned source](https://github.com/HotKids/Rules/blob/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script/Script.js#L39-L48). Repcz consumes providers through native Mihomo include-all/filter; echs-top demonstrates building inline providers from explicit nodes. These differences show that “configuration contains providers”, “nodes are expanded” and “objects actually included in groups” are separate layers. Research and VM boundaries for the first two appear in the [comparison report](2026-09-30-github-routing-script-comparison.md#直接运行的-mihomoclash-覆写脚本) and [31 upstream VM probes](2026-09-30-routing-script-probes.json). Locally, only fully verifiable static inline payload is accepted. Remote providers and live filter/override/health-check semantics remain rejected before override; users must flatten them in SubStore first.

Another addition separates node “definitions” from “automatically selectable remote nodes”. Named `type: direct` / `type: reject` outbounds may be referenced by other configuration fields or proxy chains. They cannot be deleted merely because they are not remote connections, but should not enter ALL, regional, residential or DNS-server candidates. HotKids' input recognition inspired this split. Mihomo v1.19.31's [adapter parser](https://github.com/MetaCubeX/mihomo/blob/v1.19.31/adapter/parser.go) supports direct/reject adapters; [groupbase](https://github.com/MetaCubeX/mihomo/blob/v1.19.31/adapter/outboundgroup/groupbase.go) applies `exclude-type` before empty-group fallback. Official documentation also defines `exclude-type` as type-based filtering of included outbounds and `empty-fallback` as the empty-group fallback: [Mihomo proxy-group fields](https://wiki.metacubex.one/config/proxy-groups/). Source establishes field behavior; client loading capability is assessed separately in the matrix below.

<a id="本地输入和输出合同"></a>
## Local input/output contract

Three JavaScript entries and two OpenClash Ruby heredocs share filtering semantics. Implementations in tools/runtime/subscription-node-filter.js and tools/runtime/subscription-node-filter.rb are embedded and called by artifacts. Their contract:

- **Retain definitions; restrict candidates.** direct/reject nodes that pass object/name/type preflight stay in the configuration to satisfy interface and dialer-proxy relationships. Selectable lists contain only remote types. With no remote candidates, the global group explicitly targets REJECT. PASS-RULE joins reserved-name validation to avoid ambiguity with a Mihomo built-in outbound.
- **Accept only static inline provider collections with exactly `type` / `payload` fields.** Each provider must have exactly `type: inline` and an array `payload`. Read original `proxies` first, then append provider payloads in JavaScript/Ruby object-key order. The complete list undergoes object-shape, reserved-name, duplicate-name, optional-multiplier and dialer dependency/cycle checks, including cross-source collisions. Equivalent duplicates keep only the first; conflicting duplicates are rejected. Multiplier filtering defaults off; when enabled it compares full numeric values for both explicit nodes and inline payload, then rechecks dialer references/cycles. Validated payload is independently deep-copied to avoid alias side effects when fields are written. Any HTTP/file/unknown provider, or any extra key, even `null` (including `filter`, `override`, `health-check`), rejects the whole override without changing the input. It never silently processes explicit nodes while omitting remote nodes.
- **Retain valid private-node DNS targets.** DNS server/proxy fields are projected from retained node definitions. direct/reject are not remote DNS candidates but can remain reference targets. Projection covers only the valid node set; illegal/ambiguous inputs are rejected as a whole before writing configuration.
- **Validate container shapes before writing.** Both Clash Party JS entries preflight the `listeners` / `tun` types, appendable arrays and excluded-process fields they consume, avoiding partial output on invalid input. This check does not apply to FlClash's App-managed fields. Existing `rule-providers` that are not usable objects are normalized to dictionaries before merging required fused providers, preventing array/scalar merges from breaking serialization or losing fused providers.

This expands the former SubStore-flatten-only contract solely for inline collections with exactly `type` / `payload` fields. It does not implement general subscription downloads or provider-filter compatibility. Native Mihomo include-all remains an independent configuration capability of other clients, not remote-fetching support in these five override scripts.

<a id="cmfa-原生类型过滤与控制器验证"></a>
## CMFA native type filtering and controller validation

All 22 CMFA url-test regional groups now use exclude-type: 'direct|reject' and empty-fallback: REJECT. The key is **group-side exclusion, not deletion at the proxy-provider source**: direct/reject remain in the provider so the tested SS can reference dialer-proxy: direct. Groups do not automatically select these two types; groups with only direct/reject candidates return REJECT.

Code evidence is pinned to Mihomo v1.19.31 and the current CMFA YAML. The actual configuration matrix was checked using a localhost controller fixture started with the locally cached v1.19.29 core. Four scenarios read back /proxies and /providers/proxies: with direct/reject/SS, the provider still has three entries while the group includes only SS; with only direct/reject, the regional group falls back to REJECT; SS with a direct dialer still references that definition. DNS is disabled and the test address is 127.0.0.1:9. This checks parsing, loading, group membership and references, not real dialing/network behavior. Original receipts: [CMFA native-type probe](2026-09-30-native-cmfa-type-probe.json). This is not mobile App device acceptance.

<a id="14-个产物目录适用性矩阵"></a>
## Applicability across 14 artifact directories

The matrix counts the repository's 14 client directories, with the two Clash Party scripts and two OpenClash scripts each sharing one row. It distinguishes implementable equivalent mechanisms at code level, does not copy Mihomo YAML keys into other clients, and does not call unknown client behavior supported or fixed.

| Directory | Local runtime location/mechanism | Conclusion |
|---|---|---|
| Clash Party | Smart/Normal JS main(config), shared SckiSubscriptionNodeFilter, ALL/regional group generation | **Applicable and implemented**: retain direct/reject definitions, select only remote nodes; preflight/flatten static inline providers, return unchanged for invalid shapes. Smart and Normal share the node contract. |
| Clash Meta For Android | proxy-providers and 22 url-test regional groups in CMFA(mihomo).yaml | **Applicable and implemented**: group-side exclude-type + empty-fallback; provider sources remain intact. v1.19.31 source and the v1.19.29 controller fixture verify the mechanism and configuration readback respectively. |
| OpenClash | Ruby SckiSubscriptionNodeFilter.validate_and_filter embedded in Normal/Smart shell, followed by selectable_proxies filtering/group generation | **Applicable and implemented**: both Ruby implementations follow the same rules as JS, retaining chain-reference targets and offering only remote nodes to automatic groups. |
| Shadowrocket | [Proxy] / [Proxy Group] in .conf | **Do not apply Mihomo type fields**: proxy descriptions/groups use proprietary syntax; there is no evidence that Mihomo type: direct/reject maps to valid Proxy records. Existing static policies remain. |
| SingBox | Static outbounds and selector/urltest in SingBox(sing-box)-full.json | **Dynamic preflight not applicable**: proxies/policies are projected to static outbounds during generation; there is no runtime classification of subscription nodes received by these scripts. |
| v2rayN | Flat Xray RuleObject / outboundTag in v2rayN(xray).json | **Not applicable**: a routing-rule artifact, without dynamic proxy subscriptions or latency-test grouping. |
| Surge | [Proxy] / [Proxy Group] in Surge.conf | **Not claimed fixed**: [Proxy] is currently empty with no remote-node policy path to change. Surge has a built-in DIRECT alias, but no device evidence establishes whether the current include-all path includes it; no existing fault/fix is inferred. |
| Loon | [Proxy], [Proxy Group] / Remote Filter in Loon.conf | **Do not apply Mihomo type fields**: current proxy/server definitions are empty; type: direct/reject validity in Loon server syntax is unverified. Name filtering retains its own semantics. |
| Quantumult X | [server] / [policy] / server-tag-regex in QuantumultX.conf | **Do not apply Mihomo type fields**: server definitions are empty, with no equivalent JS input sanitizer or proof that Mihomo's named types are valid QX servers. |
| Passwall | Passwall(xray+sing-box)-apply.sh installs UCI shunt_rules | **Not applicable**: manages fused routing rules, not node-name classification/provider proxy-group filtering. |
| Passwall2 | Passwall2(xray+sing-box)-apply.sh installs UCI shunt_rules | **Not applicable**: like Passwall, installs static shunt rules without subscription-node objects. |
| FlClash | JS main(config) and NodeFilter in FlClash(mihomo).js | **Applicable and implemented**: shares Clash Party Normal's input contract while retaining FlClash-specific field boundaries. |
| Stash | Stash.yaml generated from CMFA, with Subscribe provider and static filter groups | **Explicit limitation, not equivalent to the CMFA fix**: Stash documents named direct outbounds, but no dependable exclude-type / empty-fallback contract was found. The generator still removes these Mihomo keys; it does not claim Stash groups exclude such outbounds. Instructions place named direct in a separate top-level proxy definition, keep latency-test providers remote-only, and require the subscription aggregation layer to check dialer-proxy references. |
| Egern | Native proxy/policy/filter schema in Egern.yaml, generated from CMFA | **Type mechanism not copied**: the official proxies schema lacks Mihomo's named direct type; name filtering is a separate mechanism. Only manifest/hash/version were refreshed from final CMFA; native policy semantics are unchanged. |

“Applicable” means the same runtime script or native Mihomo group fields. “Not applicable/unverified” marks format/loading evidence boundaries, not a claim that these clients lack all built-in DIRECT/REJECT policies.

<a id="派生文件规则基线和版本"></a>
## Derived files, rule baseline and versions

SOURCE_GRAPH_VERSION remains v6.0.14. Source 514 providers / 973 rules, fused 132 providers / 151 rules, rule order, DNS baseline, and 55 group names/service defaults were not rebuilt or redefined. Inline runtime filtering changes input proxy membership, not routing-graph facts. No upstream provider contents changed, so remote MRS synchronization/full-rule generation were not run, avoiding unrelated upstream payload drift.

Artifact versions increased to: Clash Party Smart v6.0.14-dns.11, Normal v6.0.14-normal.12, FlClash v6.0.14-flclash.13, OpenClash Normal/Smart v6.0.14-oc-normal.10 / v6.0.14-oc-smart.10, CMFA v6.0.14-cmfa.7, Stash v6.0.14-stash.7, Egern v6.0.14-egern.6. Stash remains generated from CMFA; its generator now recognizes unindented top-level rules:, correctly reporting 151 rules in the header instead of 0. Egern regenerated only manifest, hash and version metadata from final CMFA; its 125 native assets and rule semantics are unchanged.

<a id="实际验证和未覆盖项"></a>
## Actual validation and exclusions

Recorded local checks: JS node-filter regressions 73/73; all three JS override targets passed; strict Ruby artifact contract 2,276 checks / 19 artifacts; OpenClash node-filter and Node-DNS tests each 2/2; PROCESS-NAME checks passed; CMFA additionally has the controller configuration/type-matrix receipt above. These respectively verify pure JS, Ruby runtime, static artifact contracts and Mihomo controller loading; they are not interchangeable. No real mobile UI, subscription downloading, public DNS queries or proxy dialing were tested.

This follow-up governs this round's product behavior, configuration scope and applicable clients. The previous comparison's 31 VM probes still describe only upstream JS synthetic transformations, not local implementation/client acceptance. Local source/asset state is available in tools/runtime/subscription-node-filter.js, tools/runtime/subscription-node-filter.rb, Clash Meta For Android/CMFA(mihomo).yaml and artifact headers/CHANGELOGs.
