<a id="离线-flclash-下载合并本地参数"></a>
# Merge local parameters into offline FlClash downloads

**English** | [简体中文](2026-10-29-flclash-offline-options.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

Goal: select Full / Lite / Custom plus existing local options such as latency tests, QUIC, node DNS and multipliers in one offline form, downloading a single FlClash JS file. Defaults, routing and rejection boundaries stay unchanged; push main after validation.

- The business-module owner extends `generateFlClashScript(bundle, { profile, enable?, localOptions? })`, reusing shared schema, build-time trusted-constant parsing and the business emitter. Effective parameters enter the summary. The browser replaces only build-validated literal slots; it does not parse/read/execute user code or access the network.
- The form owner retains two tabs with shared selection state; both primary buttons generate the same merged script. Original JSON downloads remain tab-specific rather than creating a mixed schema the CLI cannot consume. Final form version 1.2.1 includes native browser invalid-number rejection.
- The coordinating thread owns documentation, coverage matrix, CI, actual browser downloads and publication. The existing five parameters include default-off ZeroTier; existing controls must not be silently ignored.
- Omitted parameters and explicitly all-default parameters produce the previous output. Full defaults retain published LF source text. Lite/Custom combinations match existing CLI parameter writes and service projections.

Acceptance: RED before GREEN; reject illegal types/values/keys/accessors/prototype control; compare representative combinations and every value against CLI; read back real browser downloads and validate with actual QuickJS; preserve chain/DNS/multiplier dependencies and reference identity; review light/dark/narrow layouts, existing generation contracts and unchanged defaults. Describe all-client service capabilities separately from FlClash's one-click entry, retaining static-client and Meow/AEROVE capability/device-acceptance limits.

Reuse existing parameter writer, shared schema and service templates, without new dependencies or another node/rule implementation. This connects already supported local choices to offline delivery, not upstream rule refresh or default client artifact changes.

Implementation, independent review and local acceptance are complete; see the [validation record](../../reports/2026-10-29-flclash-offline-options.md). Final commit, remote pointer and CI are resolved through this publication's readback.
