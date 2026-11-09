[**English**](README.md) | [中文](README.zh-CN.md)

# Official versions, capability research and documentation cache (2026-10-19)

This historical research began from clean `main` baseline `079b5463c206271ade7b563661f49832f18e25c4`, covering all 14 client categories and related cores/GUI applications. Initial caching captured 240 of 241 entries. A second review added seven Passwall ordinary-node source files, bringing the current snapshot to **247 successful entries out of 248**. Only the Shadowrocket help site remained unresolved.

Scope includes stable/prerelease channels, rule/DNS documentation, generation/import source and core bindings. The cache covers explicit source inventories, **not complete website mirrors**. Version records do not imply installed-device versions. Reports retain UTC publication times; the research task date uses Asia/Tokyo. All statements below describe this dated review, not current release claims. Linked evidence reports retain their original language, primarily Chinese.

## Research and original-source entry points

| Scope | Original sources | Successful / unavailable | Report (Chinese source) |
| --- | --- | --- | --- |
| Mihomo, Smart, Clash Party, CMFA, OpenClash, FlClash, ClashMi, ShellCrash, Clash Verge Rev | [Inventory](mihomo/sources.json) / [Receipt](mihomo/manifest.json) | 57 / 0 | [Versions, runtimes and adoption decisions](mihomo/report.md) |
| sing-box, native SFA/SFI/SFM, Xray, v2rayN, Passwall/PW2, Hiddify, HomeProxy | [Inventory](singbox/sources.json) / [Receipt](singbox/manifest.json) | 105 / 0 | [Schemas, backends and import boundaries](singbox/report.md) |
| Surge, Stash, Egern, Loon, Quantumult X, Shadowrocket | [Inventory](apple/sources.json) / [Receipt](apple/manifest.json) | 56 / 1 | [Apple-client capabilities](apple/report.md) |
| Karing, Happ (Desktop/Android/iOS checked separately) | [Inventory](consumers/sources.json) / [Receipt](consumers/manifest.json) | 15 / 0 | [Additional consumers and formats](consumers/report.md) |
| Sub-Store backend and frontend | [Inventory](substore/sources.json) / [Receipt](substore/manifest.json) | 7 / 0 | [Subscription-management boundaries](substore/report.md) |

The table preserves initial counts. After the second capture, the singbox group is **112 / 0**, total **247 / 1**; current manifests are authoritative.

Original bodies are stored in `bodies/<SHA256>.gz`. Receipts bind URLs, times, HTTP metadata and original/gzip hashes. GitHub raw sources are commit-pinned. Inventory hashes use LF; remote bodies preserve original bytes. Historical receipts are in `manifests/`.

All 14 original REFERENCE documents retain historical text with this review's scope appended. Not every old-summary field is claimed as current fact. [baseline.json](baseline.json) records original Git blobs and body hashes. A pre-review reference ZIP was stored locally at `.cache/official-docs-20261019/references-before.zip`; originals can also be recovered from the baseline commit above.

## Stable versions and channel distinctions at review time

| Product | Stable / public Latest recorded | Separate considerations |
| --- | --- | --- |
| Mihomo | 1.19.32 | MetaCubeX Alpha and vernesong Smart are separate branches; Smart has no non-prerelease stable |
| Clash Party / CMFA | 2.0.4 / 2.11.35 | Application versions do not replace bundled core revisions |
| OpenClash / FlClash | 0.48.002 / 0.9.1 | OpenClash can select cores independently; FlClash binds its core fork |
| ClashMi / Clash Verge Rev / ShellCrash | 1.0.31.1703 / 2.5.8 / 1.9.4 | ClashMi 1.0.32.1800 and Verge autobuild are prereleases |
| sing-box | 1.14.3 | 1.15.0-alpha.12 is prerelease; verify each GUI's actual core |
| Xray | 26.3.27 | Official 26.10.17 is marked prerelease; larger numbers do not imply stable |
| v2rayN / Passwall / Passwall2 | 7.25.6 / 26.10.16-2 / 26.10.1-2 | Two plugin backends do not mean both support SRS |
| Hiddify app / standalone hiddify-core | 4.1.1 / 5.0.3 | Stable application still pins core dependency 4.1.0 and the 1.13 branch; do not combine two independent latest versions |
| HomeProxy | No public GitHub release | Record pinned source commits; do not invent version numbers |
| Surge iOS / Mac | 5.23.0 / 6.10.0 | Mac beta 6.11.0 listed separately; feed-title/enclosure discrepancy retained |
| Stash iOS / Mac | 3.6.4 / 4.3.3 | Mac beta 4.4.0; Wiki update page trails App Store/feed |
| Egern / Loon / QX / Shadowrocket | 2.20.0 / 3.5.2 / 1.8.1 / 2.2.92 | Missing official prerelease evidence remains pending, not inferred from community claims |
| Karing | 1.2.25.2802 | 1.2.26.2908 is prerelease |
| Happ Desktop / Android / iOS US | 4.5.4 / 4.7.1 / 6.1.0 | Platforms release independently |
| Sub-Store backend / frontend | 2.42.6 / 2.34.1 | Conversion capability does not prove target-client protocol support |

Group reports contain official URLs, exact publication times, pinned source and adoption decisions. This table does not duplicate complete release notes.

## Compatibility fixes adopted in this review

| Artifact | Change and evidence | Version / verification |
| --- | --- | --- |
| Clash Party Smart / OpenClash Smart | Removed two sticky-sessions settings because current SmartOption no longer has `strategy`; corrected Smart/Alpha identification, model fields and OpenClash's fixed custom-script deployment entry | `v6.0.20-dns.20` / `v6.0.20-oc-smart.15`; JS/Ruby contracts |
| sing-box | Removed nonstandard `_meta`; migrated to typed DNS, route sniffing and named HTTP clients; one generator emits [Full](../../../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json) and [1.13-compatible](../../../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-1.13.json) | `v6.0.20-sing.10`; real official 1.14.3 / 1.13.14 check, zero skips |
| Surge | Removed unrecognized `[DNS]` and two invalid keys; preserved actual values for four encrypted DNS endpoints, plain DNS and outbound options | `v6.0.20-Surge.11`; independent active-section comparison |
| Quantumult X | Put four DoH endpoints on one line following the official sample, preserving addresses/order; did not claim to reproduce multiline last-wins behavior | `v6.0.20-QX.11`; independent list/rule-section comparison |
| Passwall / Passwall2 | Check all `_shunt` nodes before any UCI write and accept only sing-box; stop for Xray, unknown/missing backend, no shunt, overall or per-node read failure | `v6.0.20-pw.10` / `v6.0.20-pw2.10`; 18 real POSIX-shell fixtures |

The second review separated backend preflight by node type/protocol: valid ordinary Socks-like nodes may omit `protocol`, but potential shunt backends still require strict reads; unknown types and Xray shunts remain rejected. Shell regression adds ordinary-node and mixed-backend cases. See verification receipts for results.

Protocol/import boundaries were corrected from official evidence: QX REALITY and Vision assessed separately; Happ profiles are not v2rayN arrays; HomeProxy rebuilds from UCI; Hiddify requires full-mode/core-binding checks. Both sing-box configurations were added to the capability matrix.

One upstream migration limitation remains: new sniffing assists SNI/Host matching but cannot preserve old dynamic destination rewriting; IP destinations still dial the original IP. Old/new pinned source was captured and the [migration boundary](singbox/report.md#嗅探迁移的行为边界) explains it. Passing schema checks does not restore the old behavior.

## Artifact impact and features not adopted

The routing graph remained **v6.0.20**, with service providers, targets, order and fused payloads unchanged. Only generator source hashes and referencing receipts were updated, plus the 1.13 JSON in automatic-refresh outputs. Remote rules were not refreshed.

| Directory | Scope / why runtime payload was not changed |
| --- | --- |
| Clash Party | Smart schema/docs only; Normal uses url-test with no invalid Smart parameter |
| CMFA | References/changelog; native Mihomo YAML has none of these Smart/other-platform mismatches |
| OpenClash | Smart settings/deployment docs; Normal lacks the affected Smart fields |
| FlClash | References/changelog; application patch boundaries recorded, no evidence requiring current url-test script changes |
| Stash | References/changelog; conservative generated output remains valid; newer DNS/inline features have higher version requirements, and tolerance minimum-version evidence is insufficient |
| Shadowrocket | References/protocol comparison/changelog; help-site official status/body pending, no guessed DNS fields |
| Surge | Official syntax fixes/docs/version; regional algorithm not changed to Surge Smart |
| Loon | References/protocol comparison/changelog; native rule structure retained |
| Quantumult X | DoH syntax/docs/version; policy/rule structure retained |
| Egern | References/changelog; native YAML rule_set retained, no assumed Mihomo MRS support |
| SingBox | Two same-source schemas; original 97 service-route order retained plus one nonterminal sniff action: 98 rules, 54 groups |
| v2rayN | References/Happ format boundary/changelog; native Xray array unchanged |
| Passwall / Passwall2 | Backend installation gates/docs; 78 SRS URLs, lists and relative order retained |

Latency algorithms, TUN stacks, Surge Smart, newer Stash DNS/inline, sing-box optimistic/race and Alpha protocols lacked explicit requirements or runtime measurements. This review records requirements and tradeoffs without enabling them by default. Application UI, subscription, cache and recovery improvements usually do not require service-routing changes.

## Verification and later readback

[validation/](validation/) stores command logs; [verification.json](verification.json) summarizes final checks. Initial 82 Node regressions and three capability-matrix tests passed. The second review added ordinary-node, refresh-inventory, wrong-core-path and full-CI checks, fixing findings before publication. Strict cross-client contracts passed **2,493 checks / 20 artifacts**, plus three JS entry points, process-direct rules, asset budgets and both official-core checks. Rule-semantic comparison found zero changes and zero unresolved cases. Old-format failures remain in the [sing-box receipt](singbox/verification.json).

The review checked 25 READMEs and streamlined 20, retaining tables, diagrams, images and badges. Only evidenced obsolete/redundant examples were corrected or removed; necessary installation and acceptance steps remained. Before/after hashes, scope and review results are in the verification directory.

```bash
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --verify
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --read smart-group-source
```

Run `--verify` for each of the five groups to decompress offline and verify hashes/URL bindings. Use a new dated directory for future versions. Only `--refresh` redownloads; ordinary reruns preserve original retrieval times. `--github-cli` uses existing local gh authentication for public API reads; receipts store no credentials.

Device acceptance remained pending for Apple/Android GUIs, full Hiddify import, HomeProxy UCI conversion, OpenWrt traffic, DNS failover, TUN and performance. Static/core checks do not replace those results, and the Shadowrocket help-site gap remains. This dated review was authorized to verify, streamline READMEs and publish main; publication status must be established from remote commit and CI readback.
