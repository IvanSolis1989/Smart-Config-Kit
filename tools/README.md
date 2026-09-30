# Maintenance tools

> 目录简介：这里存放仓库维护脚本和一致性校验工具，用于验证覆写脚本与跨客户端产物契约。

This directory contains repository-maintainer generators and checks. Generator
commands rewrite published client artifacts; validator commands are read-only.

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

The regressions execute the published JS `main()` and extracted Ruby heredocs,
including malformed fields, name ambiguity, provider-only input, dialer
dependencies, empty pools and conservative multiplier parsing. These filters
do not change the source routing graph or rebuild remote rule assets. User
parameters and input boundaries are documented in the
[node filter guide](../docs/subscription-node-filter.md).

## Generated client artifacts

Run:

```bash
node tools/generate-stash-from-cmfa.js
node tools/generate-egern-supplemental.js
node tools/generate-egern-from-cmfa.js
node tools/sync-mihomo-mrs-rule-providers.js
node tools/apply-mihomo-mrs-overrides.js
node tools/build-fused-rule-sets.js
node tools/generate-fused-fallback-artifacts.js
```

Scope:

- reads `Clash Meta For Android/CMFA(mihomo).yaml` as the Stash source;
- writes `Stash/Stash.yaml`;
- preserves the shared 22 region groups, 33 business groups, rule-providers,
  and rules;
- removes Stash-unverified Mihomo-only fields such as GeoX auto-update,
  sniffer, provider health-check / exclude-filter, provider download `proxy`,
  and Mihomo-specific DNS fallback keys.
- reads `rulesets/supplemental/clash/*.list` as the Egern supplemental source;
- writes `rulesets/supplemental/egern/*.yaml` with Egern-native
  `domain_suffix_set` / `domain_set` / `ip_cidr_set` fields;
- skips process rule sets because Egern does not expose Clash-style
  `PROCESS-NAME` matching.
- reads `Clash Meta For Android/CMFA(mihomo).yaml` as the formal Egern source;
- writes `Egern/Egern.yaml` with 22 smart region groups, 33 business groups,
  CMFA rule order, and Egern-compatible YAML / text `rule_set` URLs;
- keeps Mihomo `.mrs` in Clash Party / CMFA, but does not emit `.mrs` URLs into
  Egern because Egern official docs do not document `.mrs` rule-set support.
- writes `rulesets/generated/mihomo-mrs/*.mrs` and
  `rulesets/generated/mihomo-mrs/manifest.json` for Mihomo-compatible
  products; mixed classical providers are split into `-domain` and `-ipcidr`
  rule providers.
- reads `rulesets/source/routing-graph.js` as the fused compiler input and
  writes `rulesets/generated/fused/**`; this is the authority for client
  fused rule-set consumption.
- uses `tools/lib/fused-rule-optimizer.js` to canonicalize rules, preserve exact
  opaque-MRS source identity, and remove only same-policy exact/subsumed domain
  and CIDR rules; optimization counts are persisted in the fused manifest.
- keeps ISO country GEOIP rules native for capable clients. Service GEOIP and
  ASN rules are materialized only for targets such as sing-box headless rule
  sets that cannot represent them directly; resolution failures are fatal.
- writes fallback-native fused artifacts for clients that cannot consume
  Mihomo `.mrs`: v2rayN Xray is flattened into native RuleObject JSON, while
  Passwall / Passwall2 receive generated `rule-set:remote` `.srs` shunt rules.

## JS overwrite smoke contract

Run:

```bash
node tools/validate-js-overwrites.js
```

Scope:

- loads `Clash Party/ClashParty(mihomo-smart).js`,
  `Clash Party/ClashParty(mihomo).js`, and `FlClash/FlClash(mihomo).js`
  through their real `main(config)` entrypoint;
- validates alpha-3 node classification, info-node exclusion, home-node
  classification, empty-region non-fallback behavior, group order and group
  references;
- verifies subscription-native groups/rules/providers are removed;
- checks rule-provider download proxy, rule-provider references, final `MATCH`,
  TikTok target isolation, DNS fallback, TLS fingerprint handling, and the
  FlClash in-place mutation contract;
- verifies the Node-DNS runtime Module embedded in all three JS adapters and
  exercises exact node-policy projection, wildcard specificity, IPv6 bootstrap
  hosts, scalar hosts redirects, capacity limits and idempotence.

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

The contracts guarantee that subscription DNS is projected only to exact active
node FQDN policies; it never replaces the repository global
`proxy-server-nameserver`, `nameserver`, fallback or fake-ip baseline. They
exercise all three profiles, profile-mismatch and missing-baseline zero-write
behavior, scalar domain `hosts` redirects, IPv4/IPv6 bootstrap addresses,
case-insensitive late exact keys, case-sensitive resolver paths, and atomic
resolver-host capacity handling.

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

Scope:

- compiles the JS overwrite artifacts and checks that Normal / FlClash follow
  the Clash Party Smart baseline version;
- checks static group counts for CMFA, Stash, Shadowrocket, Surge, Loon, and
  Quantumult X;
- verifies Stash YAML is a generated CMFA derivative and does not carry
  unverified Mihomo-only keys;
- validates Mihomo `.mrs` conversion counts and generated file presence;
- validates formal Egern metadata, 22 region smart groups, 33 business groups,
  111 generated rules, 94 top-level rule-set references, 99 non-empty native
  YAML assets, and the absence of
  `.mrs` / process rule-set files in Egern;
- validates SingBox and v2rayN JSON structure, baseline metadata, and fused
  source mapping;
- extracts OpenClash heredoc YAML and, when Ruby is available, parses it through
  Ruby/Psych to catch duplicate top-level `rule-providers` / `rules` keys;
- checks Passwall / Passwall2 fused shunt-rule counts, generated `.srs` URLs,
  and rejects Clash-style rule prefixes inside `.list` files;
- validates the subscription-adapter profile schema plus the 14-product,
  four-column client capability matrix, including every evidence file/marker
  and generated Markdown drift;
- includes legacy reference `.conf` files in the sha256 manifest and warns when
  they drift from the authoritative `.sh` / shunt-rule artifacts;
- can emit a sha256 manifest for release review without changing any published
  artifact.

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
