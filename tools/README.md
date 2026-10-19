# Maintenance tools

## Official documentation snapshots

`cache-official-docs.js` v1.0.0 saves exact official response bodies as content-addressed gzip files. Inventories are explicit; this is a reviewed set of routing/configuration manuals, release metadata and source files, not a full website mirror. Snapshot coverage and decisions are indexed in [the dated report](../docs/upstream/2026-10-19/README.md).

```bash
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --github-cli
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --verify
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --read smart-group-source
```

Each manifest binds the inventory, requested/effective URLs, HTTP metadata, acquisition time, original SHA-256 and compressed SHA-256. Raw GitHub branches are resolved to commits before acquisition. Optional `--github-cli` uses the existing GitHub CLI login for public API requests without reading or saving credentials. A failed fetch remains a failure; optional failures are listed during verification. Normal reruns reuse independently verified bytes without changing their fetch time; `--refresh` fetches all entries again and archives the previous manifest. Prefer a new dated directory for a new research snapshot. Regression coverage: `node --test tools/tests/official-docs-cache.test.js`.

For a Passwall backend-only helper change, `node tools/generate-fused-fallback-artifacts.js --passwall-only` regenerates the two helpers and reference conf files from existing SRS metadata without rewriting Xray or refreshing source assets. The generated helpers require every configured `_shunt` node to use `type=sing-box` before any UCI mutation. This does not monitor later backend changes. Shell fixture tests execute both published helpers in replace/append modes: `node --test tools/tests/passwall-backend-guard.test.js`.

Generators rewrite published artifacts; validators are read-only. Routing authority and execution order are defined in [AGENTS.md](../AGENTS.md).

## Subscription node filters

The three JS overwrites and two OpenClash Ruby processors embed the canonical
`tools/runtime/subscription-node-filter.js` / `.rb` runtimes. After editing a
runtime, synchronize its client copies; use `--check` for a read-only check:

```bash
node tools/sync-subscription-node-filter.js
node tools/sync-openclash-node-filter.js
node tools/sync-subscription-node-filter.js --check
node tools/sync-openclash-node-filter.js --check
node --test tools/tests/subscription-node-filter.test.js
node tools/test-openclash-node-filter.js
```

Regressions execute published JS `main()` and extracted Ruby heredocs for malformed inputs, ambiguous names, provider-only input, dialer dependencies and empty pools. Filters do not rebuild routing assets. Parameters: [node filter guide](../docs/subscription-node-filter.md).

## Generated client artifacts

Individual generator commands follow; for a full rebuild, first sync/apply MRS, then compile fused rules, then generate clients in the order defined in AGENTS.md.

```bash
node tools/generate-stash-from-cmfa.js
node tools/generate-egern-supplemental.js
node tools/generate-egern-from-cmfa.js
node tools/sync-mihomo-mrs-rule-providers.js
node tools/apply-mihomo-mrs-overrides.js
node tools/build-fused-rule-sets.js
node tools/generate-fused-fallback-artifacts.js
```

- Stash derives from CMFA, preserving groups/rules while removing unverified Mihomo fields.
- Egern derives from CMFA and supplemental lists, emits native YAML/text rule sets, and excludes unsupported `.mrs` and process rules.
- MRS normalization splits mixed providers; the fused compiler consumes `rulesets/source/routing-graph.js`, preserves opaque source identity and only removes proven same-policy redundancy.
- GEOIP/ASN materialization fails on unresolved sources. Fallback generation emits Xray RuleObject JSON and sing-box-only Passwall SRS shunt rules. Manifests record inventories and optimization counts.

## JS overwrite smoke contract

Run:

```bash
node tools/validate-js-overwrites.js
```

Executes all three published `main(config)` entrypoints. Checks node classification/filtering, empty regions, group references, subscription cleanup, provider routing, DNS/TLS behavior, FlClash mutation and embedded Node-DNS projection.

Useful options:

```bash
node tools/validate-js-overwrites.js --target smart
node tools/validate-js-overwrites.js --target normal
node tools/validate-js-overwrites.js --target flclash
node tools/validate-js-overwrites.js --json
node tools/validate-js-overwrites.js --verbose
```

## Node-DNS runtime adapter

The canonical runtime Modules are `tools/runtime/node-dns-hints.js` and
`tools/runtime/node-dns-hints.rb`. They are embedded verbatim into three JS
subscription adapters and two OpenClash Ruby adapters.

The trusted local profile contract is
`tools/runtime/subscription-adapter-profiles.json`; it owns only the depth of
the Node-DNS projection (`off` / `policy` / `adaptive`) and cannot be selected
by an airport subscription.

```bash
# Write synchronized runtime Modules into the five adapters (intentional write).
node tools/sync-node-dns-hints-adapters.js

# Read-only drift check for CI and review.
node tools/sync-node-dns-hints-adapters.js --check

# Execute the two real OpenClash Ruby heredocs with safe temporary fixtures.
node tools/test-openclash-node-dns-hints.js
```

Subscription DNS only projects exact active-node FQDN policies and preserves the global DNS/fake-ip baseline. Tests cover all profiles, zero-write failures, hosts redirects, IPv4/IPv6 bootstrap, key/path case handling and atomic capacity limits.

## Cross-client capability matrix

`docs/client-capability-matrix.json` is the evidence-backed source for the 14
semantic products. It distinguishes repository-owned runtime hooks from client
subscription import, documented manual overlays, and routing-only fallbacks.

```bash
# Regenerate the checked-in Markdown matrix after changing the source.
node tools/generate-client-capability-matrix.js

# Read-only CI/review checks.
node tools/generate-client-capability-matrix.js --check
node --test tools/tests/client-capability-matrix.test.js
node --test tools/tests/subscription-adapter-profiles.test.js
```

The generated result is [docs/client-capability-matrix.md](../docs/client-capability-matrix.md).

## Cross-client artifact contract

Run:

```bash
node tools/validate-artifact-contracts.js
```

Checks versions, groups, generated-source parity, MRS/Egern inventories, both sing-box schemas, Xray mappings, Passwall SRS/backend guards and capability evidence. Ruby/Psych parses OpenClash heredocs for duplicate YAML keys; `--strict-ruby` requires Ruby. Manifest output records artifact SHA-256, including legacy reference conf files. Current counts come from generated manifests rather than this guide.

Useful options:

```bash
node tools/validate-artifact-contracts.js --json
node tools/validate-artifact-contracts.js --strict-ruby
node tools/validate-artifact-contracts.js --write-manifest docs/runtime/artifact-manifest.json
```

## Fused optimization and remote budgets

Run:

```bash
node --test tools/tests/fused-rule-optimizer.test.js tools/tests/fused-artifact-performance.test.js
node tools/validate-generated-remote-asset-size.js
```

Scope:

- verifies HaGeZi Ultimate is never substituted with the full TIF source;
- checks canonical GEOIP/CIDR syntax and same-policy semantic deduplication;
- re-optimizes generated Clash / Surge lists and requires zero removable rules;
- enforces the 18 MiB per-asset CDN limit plus per-client aggregate byte and
  text-rule budgets (32 MiB / 1,000,000 rules for iOS Network Extension clients);
- rejects missing generated assets and Egern GEOIP conversion loss.

## PROCESS-NAME direct whitelist

Run:

```bash
node tools/validate-process-name-direct.js
```

Scope:

- validates the desktop local-tool direct whitelist from
  `tools/fixtures/process-name-direct-tools.json`;
- checks Clash Party, FlClash, CMFA, OpenClash Normal/Smart, Surge Mac, and
  generated SingBox Full output;
- rejects accidental active process rules in unsupported mobile/router artifacts.

## Frozen MRS source snapshots

Normal full synchronization still fetches current upstream inputs through `node tools/sync-mihomo-mrs-rule-providers.js`. For explicitly requested recovery from a published Git baseline, the same tool accepts `--source-snapshot <manifest>` plus the verified Mihomo binary; it binds provider ID and URL to the baseline MRS manifest, checks current behavior/format, verifies the complete published origin-file inventory and Git blob hashes, decodes the native MRS and residual YAML, and compares the full predicate set, including wildcard boundaries. The resulting source receipt records `legacy-snapshot` and `original_upstream_provenance: unknown`; it does not invent an upstream timestamp or URL lineage.

Optional `--ids <id1,id2,...>` selects provider IDs for the current invocation. Selected outputs are staged before publication; unrelated providers remain untouched, and failed conversion does not replace published outputs or receipts. Snapshot inputs do not replace the normal all-provider upstream sync path.
