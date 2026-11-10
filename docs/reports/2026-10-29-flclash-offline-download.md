<a id="flclash-离线直接下载验证记录"></a>
# FlClash offline direct-download validation record

**English** | [简体中文](2026-10-29-flclash-offline-download.zh-CN.md)


Offline configuration form v1.1.0 supports direct JS downloads for Full / Lite / Custom; the released script remains `v6.0.21-flclash.25`. This change does not modify default rules, node/DNS runtime, shared assets, or other client entries.

<a id="实现边界"></a>
## Implementation boundaries

- At build time, the source-graph catalog, existing safety closure, and released FlClash source produce a trusted bundle. CLI and browser share the same script emitter in `business-profile-script.js`; no new dependency was added.
- The browser only validates service selections and assembles text. It does not execute the embedded main, read user scripts, access the network, or use eval/Function. Embedded JSON escapes `<`, U+2028, and U+2029; label descriptions use textContent.
- Full downloads contain standard LF text from the released Git source, not the raw bytes of a Windows CRLF checkout. The CLI Full raw-copy contract is retained. Lite/Custom are identical to the corresponding CLI outputs after LF normalization.
- Direct downloads use service selections only; local parameters retain release defaults. The local-JS-parameter and other-client JSON + CLI paths remain available.

<a id="验证结果"></a>
## Validation results

- Focused and related regressions passed 44/44, with no skips: browser export 6, form events 3, cross-client service projection 19, and actual service-profile QuickJS 16. After a later summary-display adjustment, form tests passed again 3/3 and the generator passed `--check`.
- Thirty Full/Lite/Custom selections matched CLI output, including all 24 individual services and empty/mixed/all-selected custom profiles. Invalid, duplicate, non-string, and sparse arrays were rejected.
- Before and after extracting the shared emitter, Smart / Normal / FlClash / AEROVE outputs matched for three profiles each, twelve outputs total, after LF normalization. Default client files and `rulesets/` had no Git changes.
- A real browser downloaded Full, Lite, and Custom (AI + YouTube); filenames and full content matched the generator after readback. Seven scenarios per downloaded file passed full-output, reference-identity, and unchanged-on-rejection comparisons between Node and real QuickJS, twenty-one cases total.
- CDP recorded zero `Network.requestWillBeSent` events during browser downloads. Page-source checks found no external assets or network/dynamic-execution entry points. Offline behavior applies to form generation; remote rule downloads after client import still require a network.
- Strict artifact contracts passed 2500 checks / 22 artifacts, along with JS overrides, the direct-routing process allowlist, Karing, and README visual-asset synchronization. The old secondary `OpenClash(mihomo).conf` version notice remains.
- The form passed desktop light/dark, 390px narrow-screen, Custom selection, and download-area checks. Five usage guides passed fifteen light/dark/narrow renders without page-level horizontal overflow; 103 local links were valid. Existing remote attachment images were outside the local static-preview allowlist.
- Independent read-only review found no blocker. Tests and generation ran in hidden Windows windows at Idle priority.

Detailed local logs and readback hashes are in ignored directories `.cache/flclash-direct-download/` and `.cache/myclash-adoption/direct-download-qa-*`; local downloads are not committed. Device import and real service connections require acceptance after associating a subscription in FlClash. Generation or QuickJS success is not evidence of recovery on a physical device.

See the [configuration guide](../configuration.md). The final main pointer and CI status require readback after this release.
