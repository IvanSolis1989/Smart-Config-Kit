<a id="全端离线配置下载实施计划"></a>
# All-client offline configuration download implementation plan

**English** | [简体中文](2026-10-29-offline-all-clients.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

> **For agentic workers:** Use the scoped ownership below; do not edit another owner's files.

**Goal:** download native service profiles and supported parameters for 20 entry points from one offline HTML file.

**Architecture:** read trusted repository configuration/source graph at build time; reuse pure platform projections and typed parameter templates in-browser. Export single files directly; use bundled fflate ZIP for multi-file outputs.

**Tech Stack:** Node.js, existing Ruby YAML build parsing, native browser Blob, fflate 0.8.3.

**Spec:** [Design and acceptance](../specs/2026-10-29-offline-all-clients-design.md)

<a id="全局约束与审查重点"></a>
## Global constraints and review focus

- Default rules, published artifacts, shared fused/MRS and security assets remain unchanged; no upstream downloads/refresh.
- Do not execute input/downloaded scripts, use runtime networking/dynamic code, or describe generation as App acceptance.
- ZIP paths use only trusted allowlists; read back file count, binary bytes and companion-asset closure.
- No cross-client parameter leakage; reject unknown/unsupported values; distinguish empty multipliers from invalid numbers.
- QUIC handles existing managed rules only, retaining client capability differences and explicit Egern/QX limits.
- Run tests/batches hidden at Idle priority; stage only confirmed scope and push main normally.

<a id="责任与步骤"></a>
## Ownership and steps

- [x] **Shared export core (business_profiles)**: failing regressions first, then pure platform projections, trusted 20-entry bundle and native files/companion closure. Compare CLI; do not change defaults.
- [x] **Capability parameters (offline_native_parameters)**: validate support matrix/invalid-input failure first, then build-time trusted slots/structured-field projections integrated into shared browser renderer.
- [x] **ZIP dependency (offline_export_prior_art)**: research/pin official npm fflate 0.8.3, verify SRI, retain MIT/source, validate zip/unzip roundtrips.
- [x] **Form (configuration_form)**: failing UI regressions first, then client selection, per-client parameters/import help and single-file/ZIP downloads; preserve badInput rejection, version 1.3.0.
- [x] **Documentation and CI (root coordinator)**: update unified-entry/outdated scope docs, tool log and trigger paths; record platform exceptions/reasons unaffected artifacts remain unchanged.
- [x] **Overall acceptance (root)**: freeze old reference, check generation/ZIP/actual browser downloads/no requests, light/dark/390px, relevant contracts and independent stable-patch review.
**Publication procedure (root):** after confirming scope, commit/push main; read back remote SHA, worktree and final CI; stop temporary local services. Dynamic publication receipt: `.cache/offline-all-clients/publication.json`.
