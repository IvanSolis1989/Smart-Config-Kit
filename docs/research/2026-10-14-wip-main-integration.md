<a id="wip-与最新-main-规则整合证据"></a>
# Evidence for integrating WIP rules with the latest main

**English** | [简体中文](2026-10-14-wip-main-integration.zh-CN.md)


The integration baseline was `9d09baf5abe83c4a7080fe16b451594446bca108`; the recovered older worktree was `df2bd395cf3884cf864dbb665f7efa428e75fe4d`. Only actual source differences and service intent were migrated. Old clients or generated artifacts did not wholesale overwrite main. The integration retained two exact Claude Desktop AI hosts, testing/QUIC options, the default-off ZeroTier switch, and provenance/quality/release governance.

Source graph v6.0.18 had 525 normalized providers / 984 rules, producing 149 fused Mihomo providers / 168 rules, 81 policy segments, 78 nonempty SRS, 107 MRS, and 19 inline rules, with unresolved=0. Egern had 152 profile rules / 135 references / 140 native assets; Sing-box had 97 routes; Xray had 98 entries including one disabled metadata entry; Passwall and Passwall2 each had 78 shunts.

<a id="输入与转换边界"></a>
## Input and transformation boundaries

Frozen inputs were decoded from released main MRS and residual YAML using their original Git blob identities and verified Mihomo v1.19.32 and sing-box v1.14.3. Exact decoded entry sets for 355 unnormalized MRS files, and complete predicate sets for 62 unchanged residuals, were equal after round trips. Binary encoding differences are not thereby called entry changes. Original download bytes and upstream commits remain unknown; receipts retain legacy-output-only and the actual original blob inventory. Old WIP URL caches were not used to overwrite newer main inputs.

Only actual sources that could not be reconstructed from independently released inputs were fetched using existing provenance and given byte receipts. Fusion and Egern subsequently reused the same hashes. Decoding cannot retroactively establish a “verified upstream version” for released inputs lacking historical remote receipts. Normal validation and quality readback use saved artifacts, code, registry, and receipts. Full offline regeneration requires the original bound cache and converters; clean clones require normal sync to obtain new actual sources and cannot infer the original remote content.

`--source-snapshot` explicitly checks baseline-manifest provider IDs/URLs, current behavior/format, native-asset behavior, and the complete inventory. It then decodes bound origins again with explicit official converters and checks predicate sets, including complete residuals. Self-reported hashes are not transformation proof. Wrong providers, correct origins paired with wrong decoded content, omitted residuals, and behavior/format mismatches are rejected. `--ids` uses staged outputs, publishes nothing on failure, and preserves unchanged provider and asset receipts.

<a id="业务范围与有限语义审阅"></a>
## Service scope and bounded semantic review

Historical source evidence and unconfirmed candidates remain in the [2026-10-04 audit](2026-10-04-routing-priority-audit.md). Crisp relay protection is an inferred exact-host safeguard against static ASN overlap, not a claim of observed real-world misrouting. The current upstream TikTok set no longer covers the shared byteoversea suffix, so an exact TikTok rule was added only for the previously reviewed WIP case `api.byteoversea.com`; `vcs-sg.byteoversea.com` remains AI, without expanding coverage to the entire shared suffix.

The service-probe review evaluated 512 bounded probes, discarded 4,633,555 candidates because of its budget, and included 138 results involving unknown. Entry evidence was capped at 96 and truncated. Twenty-three probe differences corresponded to fixes for WeGame, Microsoft/OneDrive, certificate status, downloads, ByteDance apps, AWS/Crisp, China CDNs, and NetEase media. Twenty-three is not the total number of real routing changes. `foo.azureedge.net` remains unknown and cannot be declared deterministically routed. Unknown results were not converted to matches, and no all-domain or all-IP equivalence is claimed.

The report’s 1,159,347 entry changes include segment renumbering, regrouping, payload deduplication, additions, and deletions; they cannot be interpreted as 1,159,347 service fixes. The 355+62 round-trip checks concern independent, unnormalized released inputs; the ordered semantic report concerns the final recompiled bounded projection. Their subjects and boundaries differ. CI additionally generates an identity-bound review report and approval summary using default parameters, retaining exact budgets, unknowns, and truncation evidence rather than granting unconditional approval.

<a id="原生格式依据"></a>
## Native-format evidence

Existing client syntax was retained; no runtime fields were added. On 2026-10-14 the review checked [Mihomo priority and domain boundaries](https://wiki.metacubex.one/en/config/rules/), [Stash rule sets](https://stash.wiki/en/rules/rule-set) and [lazy testing](https://stash.wiki/en/proxy-protocols/proxy-groups), [Egern rules](https://egernapp.com/docs/configuration/rules/), [sing-box rule-set](https://sing-box.sagernet.org/configuration/rule-set/), [Xray RuleObject](https://xtls.github.io/config/routing.html#ruleobject), [Loon rules](https://nsloon.app/en/docs/category/%E8%A7%84%E5%88%99/), [the official QX sample](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf), and official shunt editors for both Passwall versions. CMFA, OpenClash, and FlClash were checked against their official repositories. Online Surge and Shadowrocket rule pages could not be fetched; existing formats and gaps in official specification evidence were retained without adding fields or claiming device compatibility acceptance.

Static contracts and actual native-converter checks do not replace physical-device, complete connection-metadata, DNS, RE2, or live-traffic acceptance. Repository integration and static cloud-subscription projection do not change these limitations.
