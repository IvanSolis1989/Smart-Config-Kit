<a id="离线表单直接下载-flclash-js"></a>
# Download FlClash JS directly from the offline form

**English** | [简体中文](2026-10-29-flclash-offline-download.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

Goal: users select Full / Lite / Custom in the existing offline form and download an associable FlClash JS file without CLI. Other clients retain JSON + CLI entry points; local parameters retain their existing safe update mechanism.

<a id="实现与责任"></a>
## Implementation and ownership

- Reuse the business-profiles source-graph service catalog, safety closure and existing projectScript, extracting shared pure script templates. Node validates sources/templates at build time; the browser validates choices and assembles trusted text, without executing main, reading user code or networking.
- The business-module owner maintains flclash-browser-export.js, shared templates and isolated regressions; the form owner maintains generator, HTML and event tests; the coordinating thread owns CI, documentation, changelogs, actual browser acceptance and publication. One writer per file.
- Full downloads retain published source content; Lite/Custom match the same CLI profile. Preserve rejection of invalid input and the DNS, proxy-chain, QUIC, base-service and FlClash in-place-reference contracts.
- The form uses independent tool version 1.1.0. Default client artifacts and shared MRS/fused files remain unchanged, without triggering all-client rule/runtime regeneration. Template extraction requires unchanged byte/semantic verification.

<a id="验收与收口"></a>
## Acceptance and completion

1. Start with failing tests, then compare all three profiles and empty/single/mixed/all-service choices against CLI; actual QuickJS covers successful identity and unchanged rejection.
2. Select Lite/Custom and download in a real browser. Read back filename, content and full runtime output. Confirm no page network requests, dynamic code execution or user-script input.
3. Review desktop light/dark and narrow layouts; update FlClash/unified guides and root/relevant CHANGELOGs; add generated-artifact checks/CI.
4. Compare unchanged default artifacts against pre-change `482627dfeb8336569194540dd32011391baf02f4`, run directly relevant regressions, commit/push main and read back remote pointers/triggered CI.

Reuse rationale: trusted service projection and Blob JSON downloads already exist locally; no new dependency/third-party rule implementation is needed. MyClash's on-demand service design is a reference in existing research, but its node transformations/subscription trust handling do not fit this safety boundary. Continue using local implementations.

Implementation, independent review and local acceptance are complete; see the [validation record](../../reports/2026-10-29-flclash-offline-download.md). Final commit, push and CI outcomes are confirmed by delivery-time readback.
