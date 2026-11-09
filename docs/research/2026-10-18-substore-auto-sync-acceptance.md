<a id="sub-store-自动订阅同步验收记录"></a>
# Sub-Store automatic subscription synchronization acceptance record

**English** | [简体中文](2026-10-18-substore-auto-sync-acceptance.zh-CN.md)

> Privacy: local directories, random run/session identifiers and real subscription-source identities are redacted in this public record. Versions, test results, technical limitations and public CI links are retained.


Date: 2026-10-18. Delivered extension v1.3.1; Edge 155.0.4283.45; local Clash Party 2.0.3 / Sub-Store 2.42.2.

<a id="自动流程"></a>
## Automatic flow

The user manually signed in through the browser and opened the dashboard normally, without clicking sync, save, or selecting a Sub-Store name. The extension automatically extracted subscriptions, identified brands, read the local catalog, matched names, previewed, backed up, updated only the URL, and independently read it back.

Scope is determined by browser-granted HTTP(S) site permissions, including domain names and IP addresses. The six sites below are acceptance samples, not an allowlist or support boundary. Unknown domains/IPs received separate isolated-browser regressions.

| Real sample | Matched entry | Valid nodes before / after processing | Automatic result | Latest actual capture version |
|---|---|---:|---|---|
| Source A | Source A | 134 / 134 | Original URL identical; neither of two copies modified incorrectly | 1.3.0 |
| Source B | Source B | 53 / 53 | Original URL identical | 1.3.1 |
| Source C | Source C | 68 / 68 | Original URL identical | 1.3.1 |
| Source D (new panel domain) | Source D | 30 / 30 | Subscription CDN URL automatically replaced | 1.3.1 |
| Source E | Source E | 25 / 25 | Original URL identical | 1.3.1 |
| Source F | Source F | 18 / 18 | Reset URL automatically replaced | 1.3.1 |

Provider and entry identities use stable Source A–F aliases. Independent reads of all six actual sources confirmed that canonical hashes of every non-URL field matched pre-test baselines. Processing-step counts remained 2 / 3 / 2 / 2 / 2 / 2. Replaced URLs also matched expected-write hashes saved before writing. Receipts do not publish personal subscription URLs, tokens, node passwords, source configurations, or hashes of those private values.

The real Source A capture receipt reuses v1.3.0. Both MAIN / ISOLATED extraction entries in v1.3.1 are byte-identical to it; this round additionally ran a v1.3.1 browser regression for Source A-copy disambiguation. Old successful states are not presented as new captures after upgrading; the popup explicitly distinguishes the previous result.

<a id="回归与故障复现"></a>
## Regressions and failure reproduction

- All 158 Node tests passed: extraction/redaction, asynchronous authorization, name/account identity matching, domains/IPs, source snapshots, valid nodes, fragments, URL-only writing, concurrency checks, backup/undo, natural Origin communication, automatic recovery from transient initialization failures, generated-artifact drift, and popup boundaries.
- An isolated staged checkout reproduced generated-entry byte-check failures caused by Windows `core.autocrlf=true`. After fixing LF for the extension directory, the isolated checkout’s build check and all 158 Node tests passed again.
- All fifteen actual Edge automated-browser flows passed. They used an isolated account-free profile, a fake Sub-Store on a random local port, and fictional panels, with external networking blocked. They did not connect to existing browsers/real services, open popups, refresh, or click buttons. Coverage included six original domain samples, unknown HTTPS, HTTP/IP, Source D/Source C CDN changes, catalog ambiguity, page ambiguity, brandless cross-origin cases, unmatched entries, and stopping on warning nodes.
- The original cross-world issue reproduced consistently in actual Edge: sharing one helper file between both entries loaded it only in the first world. Additional host permissions did not help; reversing order broke the other side; separate file URLs restored both. One helper source now generates two distinct entries, with build checks preventing drift.
- Limited transient communication retries are allowed only during catalog GET, never for PATCH that may already have executed. Cross-origin updates require unique exact brand evidence, a pre-write URL still matching the matched catalog snapshot, and successful original/processed-node previews.

<a id="发布范围与限制"></a>
## Release scope and limitations

The commit covers extension source, generated entries, tests, documentation, and CI. It excludes the canceled account/password/API-login tool and all personal configuration. SubStore is an auxiliary directory; routing sources, rule sets, DNS, policy groups, and client artifacts were not modified, so full-client regeneration was unnecessary.

Actual browser acceptance used Edge. Chrome uses the same official Chromium extension APIs, but no Chrome account-environment test is claimed. Sites with nonstandard encrypted responses, closed shadow DOM, or no readable subscription controls may require adaptation. Processing stops when multiple same-name accounts cannot be uniquely matched; guessing is not reported as success.
