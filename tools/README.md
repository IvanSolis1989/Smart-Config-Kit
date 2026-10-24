<picture>
  <source media="(max-width: 600px)" srcset="../docs/assets/readme/page-tools-mobile.svg">
  <img src="../docs/assets/readme/page-tools.svg" alt="维护工具：按任务查找生成器、只读验证器与来源归档命令" width="100%">
</picture>

# 维护工具 · 生成、验证与来源归档

按任务查找仓库维护命令。以下命令均在仓库根目录执行；Node.js ≥ 18，推荐 22。严格 YAML 检查另需 Ruby ≥ 3.0。

<p>
  <a href="../docs/guide/downloads.md"><img src="../docs/assets/readme/nav-downloads.svg" alt="配置下载" width="145" height="38"></a>
  <a href="../docs/README.md"><img src="../docs/assets/readme/nav-docs.svg" alt="文档中心" width="145" height="38"></a>
</p>

[相关验证](#先运行相关验证) · [产物生成](#生成客户端与能力矩阵) · [运行时同步](#同步运行时模块) · [来源归档](#保存官方依据与恢复来源) · [仓库维护契约](../AGENTS.md)

---

## 先运行相关验证

Meow 通用 JS / 原生 YAML 使用 `node tools/generate-meow.js` 生成，`--check` 只读核对；生成阶段另需 Ruby ≥ 3.0。相关测试为 `node --test tools/tests/meow-generation.test.js tools/tests/meow-native-profile.test.js`，实际核心校验需设置 `MEOW_BIN`、`MEOW_GEOSITE_FILE`、`MEOW_MMDB_FILE`。客户端运行不需要 Ruby；入口与各 App 边界见 [Meow 说明](../Meow内核系/Meow/README.md)。

验证器默认只读；生成器会改写已发布产物。请从本次改动直接相关的检查开始；完整验收要求以 [AGENTS.md](../AGENTS.md) 为准。

<a id="js-overwrite-smoke-contract"></a>

### JS 覆写行为检查

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

<a id="cross-client-artifact-contract"></a>

### 跨客户端产物合同

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

<a id="fused-optimization-and-remote-budgets"></a>

### 融合去重与远程资产预算

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

<a id="process-name-direct-whitelist"></a>

### PROCESS-NAME 直连白名单

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

## 生成客户端与能力矩阵

完整重建须先同步和应用 MRS，再编译 fused，最后生成客户端。规则权威源与执行顺序见 [AGENTS.md](../AGENTS.md)。

<a id="generated-client-artifacts"></a>

### 客户端生成链路

For a Passwall backend-only helper change, `node tools/generate-fused-fallback-artifacts.js --passwall-only` regenerates the two helpers and reference conf files from existing SRS metadata without rewriting Xray or refreshing source assets. The generated helpers require every configured `_shunt` node to use `type=sing-box` before any UCI mutation. This does not monitor later backend changes. Shell fixture tests execute both published helpers in replace/append modes: `node --test tools/tests/passwall-backend-guard.test.js`.

Individual generator commands follow; for a full rebuild, first sync/apply MRS, then compile fused rules, then generate clients in the order defined in AGENTS.md.

```bash
node tools/sync-mihomo-mrs-rule-providers.js
node tools/apply-mihomo-mrs-overrides.js
node tools/build-fused-rule-sets.js
node tools/generate-stash-from-cmfa.js
node tools/generate-egern-supplemental.js
node tools/generate-egern-from-cmfa.js
node "Sing-box内核系/SingBox/SingBox(sing-box)-generator.js"
node tools/generate-karing.js
node tools/generate-fused-fallback-artifacts.js
```

- Stash derives from CMFA, preserving groups/rules while removing unverified Mihomo fields.
- Egern derives from CMFA and supplemental lists, emits native YAML/text rule sets, and excludes unsupported `.mrs` and process rules.
- MRS normalization splits mixed providers; the fused compiler consumes `rulesets/source/routing-graph.js`, preserves opaque source identity and only removes proven same-policy redundancy.
- GEOIP/ASN materialization fails on unresolved sources. Fallback generation emits Xray RuleObject JSON and sing-box-only Passwall SRS shunt rules. Manifests record inventories and optimization counts.

<a id="karing-adapter"></a>

### Karing 分流适配

Karing uses a dedicated sing-box routing adapter maintained in `Sing-box内核系/Karing/`. Node groups, the default fallback and DNS remain managed in the Karing App. The adapter imports native diversion rules and does not claim lossless import of the complete SingBox JSON.

```bash
# Regenerate the Karing adapter from the routing/fused sources.
node tools/generate-karing.js

# Read-only contract and generated-output check.
node tools/generate-karing.js --check
```

<a id="cross-client-capability-matrix"></a>

### 跨客户端能力矩阵

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

## 同步运行时模块

修改权威 runtime 后同步客户端副本；带 `--check` 的命令用于只读漂移检查。

<a id="subscription-node-filters"></a>

### 订阅节点过滤器

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

<a id="node-dns-runtime-adapter"></a>

### 节点 DNS 运行时适配

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

## 保存官方依据与恢复来源

归档收据用于追踪来源和字节证据；恢复路径不会虚构缺失的上游血缘。

<a id="official-documentation-snapshots"></a>

### 官方文档快照

`cache-official-docs.js` v1.0.1 saves exact official response bodies as content-addressed gzip files. Inventories are explicit; this is a reviewed set of routing/configuration manuals, release metadata and source files, not a full website mirror. Snapshot coverage and decisions are indexed in [the dated report](../docs/upstream/2026-10-19/README.md). Verification also checks historical manifest hashes, allowing Git line-ending conversion while rejecting edits to archived evidence.

```bash
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --github-cli
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --verify
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --read smart-group-source
```

Each manifest binds the inventory, requested/effective URLs, HTTP metadata, acquisition time, original SHA-256 and compressed SHA-256. Raw GitHub branches are resolved to commits before acquisition. Optional `--github-cli` uses the existing GitHub CLI login for public API requests without reading or saving credentials. A failed fetch remains a failure; optional failures are listed during verification. Normal reruns reuse independently verified bytes without changing their fetch time; `--refresh` fetches all entries again and archives the previous manifest. Prefer a new dated directory for a new research snapshot. Regression coverage: `node --test tools/tests/official-docs-cache.test.js`.

Generators rewrite published artifacts; validators are read-only. Routing authority and execution order are defined in [AGENTS.md](../AGENTS.md).

<a id="frozen-mrs-source-snapshots"></a>

### 冻结 MRS 来源恢复

Normal full synchronization still fetches current upstream inputs through `node tools/sync-mihomo-mrs-rule-providers.js`. For explicitly requested recovery from a published Git baseline, the same tool accepts `--source-snapshot <manifest>` plus the verified Mihomo binary; it binds provider ID and URL to the baseline MRS manifest, checks current behavior/format, verifies the complete published origin-file inventory and Git blob hashes, decodes the native MRS and residual YAML, and compares the full predicate set, including wildcard boundaries. The resulting source receipt records `legacy-snapshot` and `original_upstream_provenance: unknown`; it does not invent an upstream timestamp or URL lineage.

Optional `--ids <id1,id2,...>` selects provider IDs for the current invocation. Selected outputs are staged before publication; unrelated providers remain untouched, and failed conversion does not replace published outputs or receipts. Snapshot inputs do not replace the normal all-provider upstream sync path.
