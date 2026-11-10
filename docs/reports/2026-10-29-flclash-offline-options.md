<a id="flclash-离线业务与本地参数合并验收"></a>
# FlClash combined offline service and local-parameter acceptance

**English** | [简体中文](2026-10-29-flclash-offline-options.zh-CN.md)


Form v1.2.1 combines Full / Lite / Custom with the existing five local parameters into one FlClash JS file, without requiring a CLI. The released default script remains `v6.0.21-flclash.25`; rules, shared assets, and other clients’ default artifacts are unchanged.

<a id="实现范围"></a>
## Implementation scope

`flclash-browser-local-options.js` derives parameters from the shared schema. At build time it reuses the existing CLI parser to compile, but not execute, trusted source, verifies the five top-level const declarations, defaults, and four Node-DNS capability modes, then extracts exact literal slots. The browser fills trusted slots only with valid enums, booleans, null, or finite positive numbers. It neither parses nor executes user scripts and makes no network requests.

Both tabs share service and parameter state. The primary button on either tab downloads the combined JS; advanced JSON exports the current tab’s separate schema. Page instructions do not describe JSON as an archive of both tabs’ combined state.

This extends offline delivery of existing local choices. It grants no additional subscription-DNS authority, changes no server/SNI/Host, removes no proxy chains, and does not alter CLI backups, atomic replacement, or concurrency protection. Original runtime checks still validate node chains, DNS snapshots, multiplier dependencies, and reference identity.

<a id="证据"></a>
## Evidence

- Related regressions passed 28/28 without skips. A subsequent const-slot regression for adjacent inline comments brought the latest module result to 11/11. Results were reused only for unchanged checks; the final generator `--check` passed.
- Actual browser testing found that entering `e` produces `value=""` and native `badInput=true`, which the old form misread as null. A failing regression was added, then invalid input was rejected. Final form tests passed 5/5. Actual v1.2.1 browser checks showed errors for both JS and local JSON; changing the input to 2.5 allowed a download identical to generator source. A genuinely empty input remains null.
- All existing parameter enums and representative service combinations matched CLI parameter writing and service projection exactly. Invalid types, unknown keys, nonfinite/nonpositive multipliers, getters, prototype control, duplicate services, and sparse service arrays were rejected; getter execution count was zero.
- Against previous revision `32dc4001d882ecbda7a9a51b10899418bb1d72f8`, four service profiles were tested with absent parameters, an empty object, and explicit all-default parameters. All twelve downloaded sources matched; default client files and `rulesets/` had no Git changes.
- In a real browser, all five parameters were first set on the local tab, then Lite was downloaded. Custom (AI + YouTube) was then selected, the multiplier adjusted on the local tab, and another download made. All five values matched the UI, CLI, and shared generator.
- Three actual downloads (default Full, nondefault Lite, and nondefault Custom) each passed seven Node/real-QuickJS scenarios: twenty-one full-output and reference-identity comparisons, including rejection of broken chains, cycles, and unsupported providers.
- Focused real-QuickJS checks also verified the 900-second power-saving interval, QUIC follow-rules, exact active-node hosts-only behavior, multiplier dependency rejection, and ZeroTier rules. Default Full remained the original released LF text.
- CDP network-request events remained zero during actual selections, tab changes, and downloads. Form source and renderer contain no network or dynamic-code execution entry points. Offline refers only to form generation; clients still download rule assets as configured.
- Strict artifact contracts passed 2500 checks / 22 artifacts, alongside JS overrides, the PROCESS-NAME allowlist, Karing, and README visual-asset synchronization. The older secondary OpenClash conf version notice remains.
- Form summaries and download areas passed desktop light/dark and 390px checks. Four entry documents passed twelve light/dark/narrow renders without page-level horizontal overflow. The coverage matrix became a narrow-screen-readable two-column table. Existing remote attachments were not added to the local preview allowlist.
- Independent read-only review found no blocker. Batch tests and generation used hidden Windows windows at Idle priority.

Detailed local records are in ignored directories `.cache/flclash-offline-options/`, `.cache/flclash-local-browser-20261029/`, and `.cache/myclash-adoption/offline-options-qa-*`; local downloads and user configurations are not committed.

<a id="跨-app-范围"></a>
## Cross-app scope

Full/Lite/Custom service profiles covered twenty maintained entries; other platforms could generate their configurations with the CLI. hosts-only covered only the three Mihomo JS and two OpenClash implementations with suitable runtimes. Real QuickJS checks establish JS correctness; direct offline downloads with combined parameters were limited to FlClash at this revision. See the [unified guide](../configuration.md) for platform capability differences, Meow/AEROVE device acceptance, and performance-baseline boundaries. This does not claim identical features or performance gains for every app.

The post-release main pointer, worktree, and CI status require delivery readback.
