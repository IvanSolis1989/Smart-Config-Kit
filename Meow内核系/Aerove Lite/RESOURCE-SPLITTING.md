[**English**](RESOURCE-SPLITTING.md) | [中文](RESOURCE-SPLITTING.zh-CN.md)

<a id="aerove-lite-规则资源拆分依据"></a>

# AEROVE Lite rule-resource splitting evidence

This change preserves shared fused assets and derives four ad and two China-site MRS shards specifically for AEROVE Lite. Local checks using the pinned Rust reader and the application's unchanged header/entry budgets passed. This remains a configuration candidate: full native application preflight, JNI, Android, real HTTP downloads and VPN routing acceptance remain pending.

[Usage](README.md) · [Integration validation](VALIDATION.md) · [Resources and SHA manifest](rule-assets/manifest.json) · [Adapter manifest](../adapter-manifest.json)

<a id="实际阻断与选择"></a>

## Observed blockers and chosen approach

Attempt 1 of [run 40420651068](https://github.com/IvanSolis1989/Aerove/actions/runs/40420651068), pinned beta18 source [`457fab8455ac8713fc9828e129d2050b11bf1beb`](https://github.com/IvanSolis1989/Aerove/commit/457fab8455ac8713fc9828e129d2050b11bf1beb), executed the full Smart case. Old `v6.0.20-meow.4` ad `part-001` failed with `rule-provider trie exceeds 500000 nodes`. The failure came from accumulated dot-separated labels in natively expanded entries; the limit was not increased.

The following beta16 failure is historical:

Pinned application source was [`d52726dc24756847b2b268d307a611cc37f994a3`](https://github.com/IvanSolis1989/Aerove/commit/d52726dc24756847b2b268d307a611cc37f994a3), with core `727ddcd06f592e2f12c5222c4de6cce328df808c`. In [Actions 40335340043](https://github.com/IvanSolis1989/Aerove/actions/runs/40335340043), `SmartConfigMeowScriptAndroidTest.realQuickJsRepositoryComposerAndAllPinnedRulePayloadsReachNativeValidation` executed and failed on shard 2, JUnit status `-2`. Development evidence `lite125-remaining-readback/FAILURES.json` retains this Smart-specific case; original `job-2.log:6533` reports:

```text
$.rule-providers.scki-fused-010-ad-domain
rule_set_invalid: $.payload.mrs.count:
official MRS header declares 411634 entries, over 250000
```

The original asset was `scki-fused-010-ad-domain.mrs`, 3,350,568 bytes, SHA-256 `e67273b13675c7ab758f32a4bc697b9d845a6f750e1688fba149e82fa7b9b848`. That fixture pinned this repository to `89abb221a157acc98d6b52c85583e6b5a5b2742b`. Application `ResourceBundleManager.kt:873` constructs the exception; lines 465–472 invoke and wrap rule preflight. The actual rejection originated in Rust's MRS header-count check.

| Approach | Impact and decision |
| --- | --- |
| Split shared fused assets for every client | Changes references and generation contracts for all consumers, broadening the Lite capacity adaptation. Not adopted. |
| Derive Lite-specific assets | Generate from the same routing authority/shared assets, preserving order, target groups and complete match sets; project only Lite provider/rule references. Adopted. |

This change neither modifies application safety limits nor removes rules nor changes shared fused assets. Official meow YAML retains original `v6.0.20-meow.3` bytes; the local Lite JS candidate is `v6.0.20-meow.5`. Future upstream refreshes must regenerate and check every asset; shard counts are not permanent constants. Cross-platform source fingerprints use canonical LF, while MRS uses raw binary SHA. LF/CRLF regression and damaged-asset rejection are tested.

<a id="固定-app-预算与计数语义"></a>

## Pinned application budgets and count semantics

Budget evidence: pinned application [`config_validation.rs`](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/meow-native/src/config_validation.rs#L17-L35), lines 219–267, and [`ResourceBundleManager.kt`](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/ResourceBundleManager.kt#L863-L865).

| Boundary | Per-rule-resource requirement |
| --- | --- |
| MRS header and actual expanded entry counts | Each ≤250,000. Successful domain/IPCIDR insertion counts may exceed deduplicated/merged dump counts; check both. |
| Single entry length | After `trim`, ≤2,048 UTF-8 bytes. |
| Individual and cumulative labels | `entry.split('.').count()` ≤128 per entry, summed ≤500,000; retain original match prefixes. |
| Expanded text | `Σ(UTF8(trim(entry)).length + 1)` ≤64 MiB, including each newline. |
| Input and MRS decompression | Input ≤64 MiB; decompressed MRS ≤256 MiB. |

<a id="domain-重复重叠输入证明2026-11-09"></a>

### Domain duplicate/overlapping-input proof (2026-11-09)

Official Mihomo v1.19.32 [domain_strategy.go](https://github.com/MetaCubeX/mihomo/blob/v1.19.32/rules/provider/domain_strategy.go) increments header count after each successful `Insert`. [DomainSetBuilder](https://github.com/MetaCubeX/mihomo/blob/v1.19.32/component/trie/domain_set.go) deduplicates when building the set; `DumpMrs` combines bare-domain and suffix-only predicates into `+.domain`. Thus inserting `example.test` and `+.example.test` legitimately gives header=2, dump=1, encoded leaves=2. Header/dump equality is not a valid universal corruption test.

For domain MRS with source YAML, prove all inputs are valid insertions, header count equals insertion count, normalized source/native-dump exact/suffix predicate sets match, unique predicate count equals encoded leaves, and compact dump counts agree. Record source hashes and `domain_proof`, then read back the manifest. Without source text, do not relax original count checks. Keep header, native expanded-entry/label, text-byte and shard-union budgets. Do not “repair” by deleting predicates or forging headers. This proof does not replace Rust-reader or real-application acceptance.

The 500,000 limit counts dot-separated labels across fully expanded entries. It is neither the byte length of the MRS binary `labels` array nor a bundle-wide label cap. The application separately enforces **256 resources / 256 MiB per bundle**; general YAML-value budgets also constrain parsing. Per-shard checks alone are insufficient.

In pinned [`full-runtime.patch`](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/meow-native/patches/full-runtime.patch), `DomainSetIndex::new_controlled` uses `index_slots=500000` to choose sparse sampling stride and control rank/select index memory. It is **not an additional 500k rejection limit**. Binary validation separately checks bitmap set bits ≤`labels.len()+1`; full native decoding remains necessary.

<a id="已保存的派生资产"></a>

## Saved derived assets

The original ad canonical set contains 411,634 unique predicates and 1,260,199 dot-separated labels. Mihomo `DumpMrs` folds two encoded leaves for `+.domain` and bare-domain matching, while the pinned Rust reader enumerates both. Canonical counts therefore cannot replace native-budget counts. Old ad `part-001`: canonical 146,916 entries / 499,998 labels, Rust-expanded 293,832 / 853,080. `part-002`: canonical 169,023 / 499,997, Rust-expanded 263,286 / 722,695. Both were rejected; `part-003` passed. Shared `075-cn-site-domain` expands to 231,701 entries / 580,034 labels and also exceeds the limit.

The candidate splits ads into four resources and China-site rules into two, reusing 147 other sources. Projection totals: **153 providers, 172 rules, 55 fixture policy groups, 4,496,629 bytes of rule resources**. Both canonical and actual Rust-leaf sets were independently compared with `missing=0 / added=0`. Ads retain 411,634 unique predicates / 1,260,199 canonical labels, corresponding to 652,813 unique native leaves / 1,835,979 labels. See the [resource manifest](rule-assets/manifest.json) for per-shard canonical/native metrics, SHA and bytes, and [adapter manifest](../adapter-manifest.json) for script identity.

<a id="验证范围与接取条件"></a>

## Verification scope and integration acceptance

- The isolated rebuild of the pinned real Rust `mrs_parser` has SHA-256 `6ccf928c318e5524669775c35767cfa12dd21f349abe0bba430fb15507f34eb3`. All 111 projected MRS assets passed this reader and unchanged application header/entry budgets; `native_metrics` match Rust `foreach`. Sources, SHA, bytes and results: [native-budget-evidence.json](native-budget-evidence.json), [resource-split-evidence.json](resource-split-evidence.json).
- All 23 local component tests passed without skips. Official Meow `-t` passed native YAML `149/168/55` and Lite projection `153/172/55`, using local resources and synthetic nodes. Existing 25 release-batch contract inputs were unchanged, so their saved results were reused.
- These checks do not execute full application checked matcher / native preflight, JNI, APK, HTTP or VPN. Neither local harness nor official CLI replaces full integration. Release CI and external byte readback are recorded separately in delivery receipts.
- Official Meow native YAML v3 and shared fused routing-graph bytes are unchanged. This is a Lite-specific projection, not a cross-platform regeneration.

After integrating same-release scripts/resources, AEROVE still must verify downloaded bytes/SHA, final YAML, provider paths and total bundle budgets, execute per-resource preflight and complete `validatePrepared`, then test VPN, ad matching, China/international destinations and service exits. Application-owned Geo, subscription and derived resources count toward the final 256-resource / 256-MiB limit. Keep failure, cancellation, recovery and update results. Do not delete rules or relax admission.

<a id="来源与许可证边界"></a>

## Provenance and licensing boundaries

Earlier root README and acknowledgement text described MIT, while noting separate third-party licenses. No tracked root `LICENSE` text substantiated a repository-wide grant. The current [README](../../README.md) and [disclaimer](../../docs/disclaimer.md) correct that ambiguity: do not infer blanket MIT permission. This clarification does not change the historical technical results above.

The ad segment's ten source rules are recorded in the [fused manifest](../../rulesets/generated/fused/manifest.json) `source_segments`, segment `scki-fused-010-ad`. [upstream-sources.json](../../rulesets/source/upstream-sources.json) is the authoritative source-identity/licensing-evidence registry; capture/output relationships appear in [source-ledger.json](../../rulesets/generated/source-ledger.json):

- The recorded `anti-ad` capture comes from DustinWin with declared `GPL-3.0`; Sukka services declare `AGPL-3.0`. Both are `declared` and `component-review-required`. The registry retains declaration URLs, commits and LICENSE SHA. Code-repository declarations do not establish full licensing review of all aggregated data.
- MiHomoer and Accademia remain `unknown`; licensing clearance cannot be inferred.
- Shards retain source attribution; derived rules are not relabeled uniformly as MIT. Mihomo `v1.19.32` is a local converter, with no binary included in this delivery. Pinned application core `727ddcd…` retains its existing MIT source evidence, which does not cover third-party rule data.

Keep provenance/licensing uncertainties explicit. Passing technical checks does not complete licensing review.
