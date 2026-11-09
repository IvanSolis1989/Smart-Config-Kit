<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-rule-quality-mobile.svg">
  <img src="assets/readme/page-rule-quality.svg" width="100%" alt="Technical guide">
</picture>

<a id="规则质量台账"></a>
# Rule-quality ledger

**English** | [简体中文](rule-quality.zh-CN.md)

Maintain source receipts, ordered-rule differences, and false-positive exceptions. Choose checks for the actual change type and inspect the corresponding gates before automatic publication.

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="Downloads"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="Documentation"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="Checks and troubleshooting"></a>
</p>

[Downloads](guide/downloads.md) · [Documentation](README.md) · [Checks and troubleshooting](guide/dns-and-verification.md)

<a id="使用入口"></a>
## Entry points

1. Use the restricted patch plan for supplemental-domain additions; use source synchronization for a full upstream refresh.
2. Review targets, order, and scope through ordered semantic differences and ADFP validation.
3. Read back receipts through automatic-sync gates and [release-batch checks](release-batch.md).

[`routing-graph.js`](../rulesets/source/routing-graph.js) remains the rule authority. This page explains source receipts, ordered semantic differences, ADFP exception validation, and approval boundaries for automatic synchronization. See [release-batch.md](release-batch.md) for file-level release checks and [claude-service-dependencies.md](claude-service-dependencies.md) for service roles/evidence.

<a id="补充规则增量同步"></a>
## Incremental supplemental-rule synchronization

For frozen local supplemental rules, `tools/apply-supplemental-to-snapshot.js` defaults to a read-only plan. Explicitly specify the Git baseline, provider, file, and exact DOMAIN additions, then use `--write` to invoke the verified native converter.

The tool rejects other providers, rule-order changes, implicit additions, and payload changes outside the patch. Deletion cannot restore historically hidden later owners, so it is rejected. Only target segments are optimized, followed by global exact deduplication; old assets are not fully reoptimized. Existing generators then synchronize 14 clients. Egern verifies original snapshots and target changes through explicit incremental receipts; other assets remain frozen.

`rulesets/generated/supplemental-patch.json` records actually consumed local inputs, the old Git baseline, and before/after hashes of stable payloads. Manifest phase hashes are listed separately and cannot pose as later generated final state. The quality ledger labels a receipt `current-payload-bound` only while current payloads, local inputs, and outputs still match; otherwise it remains a historical phase receipt.

Unread old upstream inputs remain `legacy-unknown`. Two added exact Claude Desktop hosts are registered from official network requirements without expanding to Anthropic apex domains or vendor suffixes. No real-device traffic measurement was performed.

<a id="来源版本与生成收据"></a>
## Source, version, and generation receipts

```sh
node tools/sync-mihomo-mrs-rule-providers.js --keep-cache
node tools/refresh-rule-quality.js
node tools/refresh-rule-quality.js --check
```

Online synchronization records the requested URL, final source URL, SHA-256 of bytes read, source identity, and verifiable version. `resolved_commit` is recorded only when the final consumed URL is pinned to a commit SHA and its repository/path match the requested source. Mutable branches, mirror names, and local caches do not establish a commit.

`--offline` uses existing hash-matching caches only; missing/mismatched entries fail without network substitution. `--legacy-snapshot` creates explicitly gap-marked receipts for old assets.

Ledger outputs are `rulesets/generated/source-ledger.json` and `rulesets/generated/adfp-exceptions.json`. The fused manifest records fingerprints for the ledger, exception registry, and fused payloads.

Local text inputs/generated files are LF-normalized before hashing consumed content, avoiding Windows/Unix checkout differences. Remote inputs are hashed as fetched; `.mrs` / `.srs` binaries use raw bytes without newline/content normalization.

Receipts must describe the bytes actually consumed by tools.

Previously published MRS/fused assets lack original remote-input receipts. Current hashes prove only bytes now in the repository, not historical URL contents, versions, or commits. These legacy payloads are reused without fabricated provenance. Future full builds bind and compare actual inputs against existing MRS receipts; reusing assets verifies existing bindings only and cannot reconstruct missing historical inputs.

Upstream license evidence is in `rulesets/source/upstream-sources.json`. Unverified licenses remain `unknown`; repository names and content hashes are not redistribution permission.

<a id="有序规则语义差分"></a>
## Ordered-rule semantic differences

```sh
node tools/validate-ordered-rule-semantics.js --baseline-ref <SHA> --mode domain-projection --check --output rulesets/generated/semantic-diff.json
```

`domain-projection` compares rule types, entries/order, target policies, shadowing, and cross-policy overlap over finite domain probes. Each result retains `match`, `no-match`, and `unknown` states. Finite witnesses are specific examples, not proof of equivalence for every domain or flow.

The projection does not simulate IPs, processes, ports, DNS results, client parsers, or live networks. Undecidable rules/inputs remain `unknown`.

If baseline and current inputs differ, `--check` requires an approval record via `--expected-changes <JSON>`, binding at least `beforeIdentity`, `afterIdentity`, and `reviewedChangeDigest`.

Unknown or truncated evidence additionally requires `reviewedEvidenceDigest`. Unknowns require `acknowledgedUndecidableDigest` matching the report; truncation requires `acknowledgeTruncation: true`.

Copy identities/digests exactly from this report; wildcards and invented values are rejected. Approval means reviewing that finite evidence, not converting unknowns into match conclusions.

PR and main validation workflows read optional `rulesets/source/semantic-approval.json`. Semantic changes require generating a report, human review, and completing this file before rerunning checks. Unchanged inputs need no approval file. An old file is valid only when baseline, current identity, and digests all match.

<a id="现有-adfp-例外登记"></a>
## Existing ADFP exception registry

`rulesets/source/adfp-exceptions.json` registers four providers: `scki-adfp-direct`, `scki-adfp-ai`, `scki-adfp-intl-site`, and `scki-adfp-payments`.

Entries include stable IDs, rules, `reason`, `evidence` and its `level`, `match_scope`, and `target_policy`, with positive/negative examples and expected matches. Exception changes must update both supplemental payloads and registry, supplying source evidence and exact scope.

```sh
node tools/validate-adfp-exceptions.js
```

The validator checks bidirectional registry/payload coverage, the four providers’ source-graph targets and placement before anti-ad, and declared positive/negative example scope. Examples check recorded domain scope only, not service availability.

<a id="自动同步与发布门禁"></a>
## Automatic synchronization and release gates

[`sync-mihomo-mrs-rule-providers.yml`](../.github/workflows/sync-mihomo-mrs-rule-providers.yml) runs a weekly full upstream sync, MRS/fused build, and 14-client derivation, followed by ordered semantics, quality receipts, finite Claude coverage, and complete file-batch checks.

Commit/push occurs only after gates pass. Files are staged exactly from the receipt and hashes checked again after staging and committing. If remote main moves, the run aborts and must rebuild/validate from the new baseline. On success or failure, the workflow attempts to upload all available source, exception, Claude, semantic, and release-batch receipts.

Manual `workflow_dispatch` accepts `semantic_approval_path` only under repository `rulesets/source/*.json`, with `..` path segments forbidden. Approval identities and change/evidence digests must come from that run’s report; unknowns/truncation require the explicit acknowledgments above.

Without valid approval, changes block automatic push while retaining evidence for review. Scheduled runs have no approval input and therefore do not unconditionally push upstream changes to main.

<a id="客户端原生格式依据"></a>
## Client-native format references

<details>
<summary>Per-client format sources and evidence boundaries</summary>

The source graph supplies common rule identity, order, and target intent. Existing generators continue emitting native client formats. These changes introduce no new client fields or matching behavior.

<a id="clash-partycmfaflclashopenclash"></a>
### Clash Party, CMFA, FlClash, OpenClash

- **Repository format**: Mihomo JS/YAML, MRS.
- **Official reference or evidence boundary**: [Mihomo rule providers](https://wiki.metacubex.one/en/config/rule-providers/), [routing rules](https://wiki.metacubex.one/en/config/rules/), [CMFA](https://github.com/MetaCubeX/ClashMetaForAndroid), and [OpenClash](https://github.com/vernesong/OpenClash/wiki).

<a id="shadowrocket"></a>
### Shadowrocket

- **Repository format**: native `.conf` and remote text rule sets.
- **Official reference or evidence boundary**: the repository’s [sample configuration](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/Shadowrocket.conf) and [AGENTS.md capability contract](../AGENTS.md) are the verifiable evidence here. No verified official rule-language specification was found. Compatibility is not inferred from third-party guides, and no runtime fields were added.

<a id="stash"></a>
### Stash

- **Repository format**: generated YAML, rule providers, MRS.
- **Official reference or evidence boundary**: [Rule Sets](https://stash.wiki/en/rules/rule-set) supports MRS for `domain` / `ipcidr`; no fields were added.

<a id="egern"></a>
### Egern

- **Repository format**: YAML profile and native Egern rule sets.
- **Official reference or evidence boundary**: [Egern Rules](https://egernapp.com/docs/configuration/rules/) specifies matching in listed order and local/remote files for `rule_set`.

<a id="sing-box"></a>
### sing-box

- **Repository format**: JSON and binary `.srs`.
- **Official reference or evidence boundary**: [sing-box rule-set](https://sing-box.sagernet.org/configuration/rule-set/) describes `source` / `binary` and local/remote structures.

<a id="v2raynxray-core"></a>
### v2rayN (Xray core)

- **Repository format**: Xray routing JSON fallback.
- **Official reference or evidence boundary**: [v2rayN custom routing documentation](https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules) specifies a rule-object array and references [Xray RuleObject](https://xtls.github.io/config/routing.html#ruleobject).

<a id="surge"></a>
### Surge

- **Repository format**: `.conf`, remote `RULE-SET`.
- **Official reference or evidence boundary**: [Rules overview](https://manual.nssurge.com/rules/overview.html) and [Rule Sets](https://manual.nssurge.com/rules/ruleset.html) describe ordered checks and one policy associated with a complete rule set.

<a id="loon"></a>
### Loon

- **Repository format**: `.conf`, rule subscriptions.
- **Official reference or evidence boundary**: [Loon Rules](https://nsloon.app/en/docs/category/%E8%A7%84%E5%88%99/) describes rule types and remote subscriptions.

<a id="quantumult-x"></a>
### Quantumult X

- **Repository format**: `[filter_remote]` / `[filter_local]`.
- **Official reference or evidence boundary**: [official sample configuration](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf) and [official repository](https://github.com/crossutility/Quantumult-X).

<a id="passwall"></a>
### Passwall

- **Repository format**: shunt rules and `.srs` assets.
- **Official reference or evidence boundary**: [upstream shunt-rule editor](https://github.com/Openwrt-Passwall/openwrt-passwall/blob/main/luci-app-passwall/luasrc/model/cbi/passwall/client/shunt_rules.lua).

<a id="passwall2"></a>
### Passwall2

- **Repository format**: shunt rules and `.srs` assets.
- **Official reference or evidence boundary**: [upstream shunt-rule editor](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua).

These links support only the stated formats/fields, not per-version or per-device runtime acceptance. The gap in official Shadowrocket rule-language evidence remains explicit.

</details>
