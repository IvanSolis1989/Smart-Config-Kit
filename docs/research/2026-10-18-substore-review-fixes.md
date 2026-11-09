<a id="sub-store-v132-review-修复验证"></a>
# Sub-Store v1.3.2 review-fix validation

**English** | [简体中文](2026-10-18-substore-review-fixes.zh-CN.md)


Date: 2026-10-18. Scope: four Codex Review findings on PR #189 at `8d38381`.

| Finding | Cause and fix | Regression trigger |
|---|---|---|
| [Account query identity](https://github.com/IvanSolis1989/Smart-Config-Kit/pull/189#discussion_r4305908395) | Form decoding merged literal plus signs with encoded spaces. Raw-query parsing now preserves plus signs, presence of equals signs, and duplicate ordering. | Accounts with `+` versus `%20` remain ambiguous; `%2B` and plus represent the same literal value; format parameters can still be normalized. |
| [Loopback placeholder nodes](https://github.com/IvanSolis1989/Smart-Config-Kit/pull/189#discussion_r4305908397) | Text regexes missed expanded and mapped IPs. Browser URL host normalization now precedes loopback, zero-address, and localhost checks. | Expanded IPv6, IPv4-mapped IPv6, and trailing-dot localhost do not count as valid nodes; public and LAN nodes remain. |
| [Late-arriving ambiguity](https://github.com/IvanSolis1989/Smart-Config-Kit/pull/189#discussion_r4305908399) | Ambiguity was queued behind the entire synchronization queue. Authorization messages now advance candidate versions independently; preview, backup, and actual transport sending check that the candidate is still current. | Pause catalog, preview, backup, or transport preparation; introduce ambiguity, then resume. Old tasks must not PATCH or restore stale pending/success states. |
| [Relative subscription anchors](https://github.com/IvanSolis1989/Smart-Config-Kit/pull/189#discussion_r4305908400) | Raw href lacked a base address. It is now resolved against `document.baseURI`, then checked using existing subscription semantics and address validation. | Root-relative, directory-relative, protocol-relative links and base tags; dangerous schemes, credentials, and missing valid bases remain rejected. |

<a id="确定性验证"></a>
## Deterministic validation

Final frozen source passed 192 Node tests and nineteen actual isolated Edge browser flows. JS overrides, PROCESS-NAME, and 2483 cross-client artifact checks passed. Generated build entries match the single source.

Node regressions reproduced failures in the old implementation before verifying fixes. Actual Edge coverage added four automatic flows: relative anchors, plus/space ambiguity, mapped/expanded loopback, and late ambiguity.

Independent review also reproduced recovery of the same URL being swallowed by unfinished-pending deduplication: pause A’s preview, receive ambiguity followed by the latest valid A, then release the old preview. Deduplication now applies only to candidates from the same document and generation with a completion time. Pending state left by obsolete tasks no longer blocks automatic recovery.

After the fix, the same independent reproduction confirmed exactly one PATCH, an updated source, final status updated, and a completion time on the latest pending record.

The concurrent-browser flow first suspends the fake backend preview, adds a second page link, confirms that the background received ambiguity, then releases the preview. It waits for all received authorization and serialized work to finish before checking the complete request log and stored values, requiring zero PATCH. The test uses a read-only completion probe in a private extension copy; production gained no global probe or runtime-message interface.

The negative control replaced only the background with the old `8d38381` implementation in an isolated temporary extension copy while retaining the same completion barrier. The first eighteen cases passed; the final case explicitly failed with `late_ambiguity_wrote_subscription`. This proves the test does not close the browser after an early ambiguity display, truncate a late write, and falsely report success.

Actual browser testing also revealed that a `tabs.onUpdated` loading event can arrive after new-document initialization. Because it has no bindable documentId, it no longer invalidates the current document. Document replacement uses a newly authorized documentId; closure uses onRemoved.

<a id="范围"></a>
## Scope

This round used an isolated account-free Edge profile, fictional panels, and a fake Sub-Store with external networking blocked. The previous six real-account acceptances remain in the [original record](2026-10-18-substore-auto-sync-acceptance.md); this does not claim those accounts reloaded v1.3.2. Chrome account environments remained untested.

Outside the SubStore auxiliary tool, only related logs were updated. Rule sources, DNS, policy groups, and client routing configurations were unchanged.
