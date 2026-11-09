<a id="myclash-adoption-implementation-plan"></a>
# MyClash Adoption Implementation Plan

**English** | [简体中文](2026-10-29-myclash-adoption.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

> **For agentic workers:** Use the scoped parallel ownership assignments recorded below. Follow repository validation and preserve other writers.

**Goal:** adopt actual-engine validation, on-demand service configuration, a unified local entry and exact hosts compatibility; preserve defaults and publish main.

**Architecture:** source graph controls service selection; optional projections live in separate directories, while existing defaults remain complete. Trusted local parameters use existing backup/readback writes; the new Node-DNS mode is independently validated, with JS/Ruby synchronized from shared runtimes.

**Tech Stack:** Node.js 24 (CI 22), Ruby 3.3, pinned quickjs-emscripten, offline HTML.

**Spec:** [Design](../specs/2026-10-29-myclash-adoption-design.md)

<a id="global-constraints"></a>
## Global Constraints

- Default adaptive mode, complete service groups, DNS/rules/security precedence remain unchanged; no upstream refresh.
- Do not alter existing node server, SNI or Host, or silently detach proxy chains.
- Generators write derived artifacts, one writer per file; tests/batches use low CPU priority.
- full preserves original bytes; lite/custom use separate directories; subscriptions cannot select profiles.
- Incomplete device acceptance must not be reported as passed.

<a id="review-focus"></a>
## Review Focus

- Trimmed DNS, fake-ip and logical-rule references remain within dependency closure.
- Cross-client group pruning leaves no default candidates/static references dangling.
- Parameter updates neither execute target JS nor lose existing local choices.
- Tampered hosts-only snapshots produce zero writes; old modes are not relaxed.
- Output-directory conflicts, symlinks and write failures preserve existing files.

<a id="tasks"></a>
## Tasks

- [x] **1. Engine validation**: tools/validate-js-engines.js, tools/js-engine-tests/, dedicated fixtures/tests and JS CI; failing cases first, then complete output comparison of three script types.
- [x] **2. Service configuration**: rulesets/source/business-profiles.json, source-graph exports, tools/lib/business-profiles.js, tools/generate-business-profile.js and cross-client projection tests; interfaces resolveBusinessProfile/buildProfilePlan/generateBusinessProfile.
- [x] **3. Unified entry**: tools/configure.js, local-parameter schema extensions, offline form/tests; integrate task 2 and reuse atomic backup/readback.
- [x] **4. hosts-only**: JS/Ruby runtime, profile contracts/tests; after stabilization, coordinator synchronizes three JS and two OpenClash artifacts without changing defaults.
- [x] **5. Integration/publication preparation**: versions/CHANGELOG, official field evidence, usage docs and actual rendering; run affected contracts/all-client projections, independent review, confirm default differences, then commit/push main and check remote/CI.

Ownership: engine worker writes only engine tooling/JS CI; business worker only service module/source exports; hosts worker only Node-DNS sources/relevant tests; coordinator owns unified entry, adapter synchronization, versions, docs and publication. Run shared generators sequentially after modules stabilize.

Local integration/validation are complete; see the [validation record](../../reports/2026-10-29-myclash-adoption.md). Final main commit, push and remote CI status depend on this delivery's readback.
