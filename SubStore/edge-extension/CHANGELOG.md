<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Automatic subscription synchronization helper changelog" width="100%">
</picture>

<a id="自动订阅同步助手--变更日志"></a>

# Automatic subscription synchronization helper — Changelog

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Project home](../../README.md) · [Repository documentation](../../docs/README.md)

## v1.8.1 (2026-10-23)

- Local-content synchronization rechecks complete configuration before returning unchanged/dry_run, and again after writing backups but before sending updates/restores. It rejects manual changes during preview/backup waits. The local API has no atomic conditional PATCH; a narrow final read/write race remains.
- Added concurrent negative controls, backup failures, inconsistent-readback regressions and synthetic integration across extension client/cloud transport/dedicated Worker route/snapshot operation. All 464 Node tests passed; the original v1.8.0 module failed both new concurrency regression groups.
- Updated expected read-only sequences in isolated browser tests. No browser binary was available locally for this patch; corresponding CI determines browser acceptance. Distinguished old six-site receipts, v1.8.0 same-tree CI and patch Node evidence; added [complete live-chain acceptance steps](../../docs/research/2026-10-23-substore-v1.8-validation.md). No real subscriptions, cloud accounts, Gist publisher or phone were accessed; complete new-version acceptance was not claimed.

## v1.8.0 (2026-10-18)

- Added persistent local-content snapshot synchronization restricted by explicit site/name policies, addressing local entries with empty URLs excluded from normal remote matching. Trusted site, unique exact name and minimum node count must all match; this does not permit arbitrary local-entry overwrites.
- A one-time URL is fetched once through a temporary local remote preview. Raw nodes are shared in task memory with both targets; each validates using its own saved local processors. Only `content` is updated and independently read back, preserving local type, empty URL, processors and collection relationships. The one-time URL is not saved as a remote source.
- Old `content` is saved as a target-isolated sensitive recovery backup. Local configuration comparison and complete revision constraints on the dedicated Cloudflare route prevent overwriting changed state. Saved local content remains available while the local machine is off; refreshing new content still requires it. Existing remote 24-hour snapshots and Gist/Fusion/phone publication paths are unchanged.

## v1.7.0 (2026-10-18)

- Added local strict `noCache`, single-subscription `original` raw-node snapshot upload for server-allowlisted sources confirmed blocked by a Cloudflare HTTP 403 challenge. Processed Fusion is not uploaded, nor are raw nodes written to persistent extension storage. Healthy cloud sources continue downloading independently.
- Single-source raw previews remove only non-real-node plan metadata with the exact prefixes `剩余流量[:：]` or `套餐到期[:：]`, retaining all real `original` nodes. Other invalid/device-limit errors remain rejected without reducing minimum node counts; the server accepts real nodes only.
- Cloudflare stores snapshots for 24 hours subject to per-source minimum counts, exact URLs and configuration bindings. Candidates differing from persistent URLs get only a 120-second post-upload preview window. Fallback requires a confirmed direct 403 challenge, or one confirmed after gateway-530 recovery to direct. Gateway-200 wrappers of upstream 403 are not covered. Other failures, expiry, missing data and error placeholders remain fail-closed.
- Cloud processing still uses that source's original saved `process`. Refreshing blocked sources requires one local run and no VPS, but this does not fix the origin's Cloudflare restriction or provide fully independent refresh. Snapshot upload does not change original Gist/Fusion publishers, published client copies or routing artifacts.
- Runtime packaging includes single-source snapshot preparation, totaling 16 files. CI includes extension-preparation and Worker-snapshot regressions. Isolated tests/local previews do not replace real cloud seeding and final publication acceptance.

## v1.6.0 (2026-10-18)

- Replaced visible relay tabs with one offscreen hidden document and localhost iframe. Added `offscreen` permission, frame CSP restricted to `127.0.0.1`, and Port identity/random-token binding. Retained natural frontend Origin, API allowlist, node previews, conditional backups, URL-only PATCH and final permission/candidate checks.
- Background restart restores the existing hidden document; disconnection clears old requests and rebinds. Old PATCH requests are never automatically resent, and initialization-failure cleanup does not remove in-flight requests. Chrome 111–115 uses `clients.matchAll`; newer versions prefer `runtime.getContexts`.
- Packaging recursively includes offscreen static entry points and HTML script dependencies: minimum installation is 15 files. Older refs retain their own dependency closures.
- All 308 Node checks and 33 isolated Edge end-to-end flows passed. Every flow verified absence of visible local relay tabs; all three hidden initialization attempts were cleaned up when frontend was offline. Seven production-file Edge probes additionally covered real worker stop/start, forced `clients.matchAll` and recovery after hidden-document closure. Edge compatibility branches were not presented as real Chrome 111 binary acceptance; the user's browser still needed reloading and testing this version.

## v1.5.1 (2026-10-18)

- Bodyless GET no longer declares JSON Content-Type, preventing native cloud Sub-Store from parsing an empty body as JSON. POST/PATCH still carry JSON; URL-only writes and independent readback are unchanged.
- The companion restricted Worker route uses platform-supported `manual` redirect mode; see [SubStore history](../CHANGELOG.md). Browser-side backend redirects remain rejected.
- Passed 313 extension Node tests, 33 isolated Edge flows and 66 Worker/publication-helper checks. Real cloud upstream availability still needed separate verification; isolated tests were not a substitute.

## v1.5.0 (2026-10-18)

- Fixed permission-query exceptions being misclassified as revocation and permanently deleting site trust. Exceptions pause access for that run while retaining permission records. Added same-origin new-tab, background-restart and exception-recovery regressions without widening cross-origin access.
- Added an optional independent Cloudflare Sub-Store target while preserving natural-Origin local communication. The service worker requests cloud access directly after host permission. Each target independently matches, previews, PATCHes and reads back, with separate results/conditional recovery backups. Partial success retains completed targets; already-sent or uncertain PATCHes are not automatically retried.
- Advanced settings gained a default-off cloud switch, password-style HTTPS backend URL and local connection-JSON import. Import accepts only two cloud fields into a draft; saving then requests permission. Cloud hosts do not become provider-site trust, static host permissions are not widened, and public packages contain no private configuration.
- Popup displays each target and partial success, with target-specific recovery. Old-page/version results are historical. Documentation distinguishes backend-source URL changes, collection/Gist publication and phone retrieval. Added dual-target configuration, permission, import and UI regressions.
- Added `package.mjs`: gathers runtime dependencies from a committed Git ref (default HEAD), writes an absolute installation directory and supports read-only `--check`. Minimum package: 13 files. In-place upgrade keeps backups, excludes private connection JSON and does not install the extension automatically.
- Integrates with the separate restricted Worker route: its secret prefix permits only directory/single-subscription reads, JSON preview and URL-only PATCH; old routes remain. See [SubStore history](../CHANGELOG.md) for module scope.
- All 33 isolated Edge end-to-end flows passed: retained 31 and added independent success with different internal names plus local success preserved after cloud-preview failure. Fictional panels/isolated profiles do not establish real-account or native permission-dialog acceptance.

## v1.4.1 (2026-10-18)

- When DOM-only panels remove subscription controls, publish and retain removal across worlds, invalidate background candidates immediately and clear retry work. Reappearing identical URLs are revalidated; network-candidate precedence is preserved.
- On prerender activation, rerun site-authorization handshake and replay observation cache. Non-active documents remain rejected, retaining BFCache recovery.
- Independently tested the encoded-cacheKey review concern against pure parsing fragments from pinned official and locally packaged backends: parameter keys are not decoded, so reported encoded aliases cannot enable custom caches. Existing valid-parameter/JSON cacheKey removal remained unchanged.
- Passed 278 Node tests, 31 isolated Edge flows and a separate Windows automatic-line-ending checkout. Covered same-page removal, identical-link reappearance, candidate identity during worker recreation and old probes not cancelling new candidates. Lifecycle tests cover prerender transitions, but isolated tests obtained no native prerender activation evidence; this was not counted as native E2E.

## v1.4.0 (2026-10-18)

- External sites moved to optional browser permissions. Only explicit first-time approval on the current tab saves full-origin trust and dynamically registers both-world listeners. Historical recognition, pending work and old broad permissions do not upgrade automatically to trust. Normal extraction/matching/writeback remains automatic afterward.
- Before sending real local requests, verify current document, site trust and browser permission. Revocation, global disable, navigation to unobserved targets and replayed old work cannot bypass checks. Backup recovery uses the same checks and binds to the backup's site.
- Accumulate account candidates from fetch/XHR responses within a document. Distinct accounts remain ambiguous; repeats or alternate formats of one account remain valid. Later page events cannot retract already-sent requests.
- Close extension-created relay pages whose preparation failed before any request was sent, clearing records by their own IDs. Keep user pages and pages possibly carrying in-flight requests. Failure diagnostics do not expose raw exceptions.
- Fixed HTTP/IP-panel document random-ID compatibility, conditional recovery after worker restart and startup-handshake races. Passed 266 Node tests, 29 isolated Edge flows and a separate Windows automatic-line-ending checkout. Three offline-frontend initialization attempts closed every extension-created tab. Trusted valid flows still write only URL and independently read back.
- Real accounts/native permission dialogs still needed user verification after loading this version. Isolated browsers used fictional panels and explicitly trusted sites, not real-account acceptance.

## v1.3.2 (2026-10-18)

- Addressed PR #189 Codex Review: changed candidates or late ambiguity invalidate unsent writes, preventing stale validation from committing. Deduplication applies only to completed candidates in the same document/generation; automatic work can resume when ambiguity clears.
- Preserve literal plus signs, encoded spaces, flags without equals signs and duplicate-parameter order in account queries so distinct accounts are not merged.
- Resolve relative subscription anchors against page base URI while retaining existing subscription semantics and dangerous-address checks.
- Normalize hosts/IPs before detecting loopback placeholder nodes, including expanded IPv6, IPv4-mapped IPv6 and trailing-dot domains.
- Added real Edge regressions for relative links, account parameters, loopback and in-flight ambiguity. Assert zero writes only after the original task ends; an old-background negative control catches late PATCH. See [repair verification](../../docs/research/2026-10-18-substore-review-fixes.md).
- Passed 192 Node tests and 19 independent Edge flows. Did not claim six real accounts reloaded the new version; Chrome account environments remained untested.

## v1.3.1 (2026-10-18)

- Six real-site automatic flows passed with 134 / 53 / 68 / 30 / 25 / 18 valid nodes. Source D and `Source F` switched URLs automatically while preserving processors/other fields. Source A reused a v1.3.0 receipt whose entry-point bytes were identical; the others used v1.3.1.
- Added unique brand-name matching for subscription-CDN domain changes; verified directory URL snapshots still matched the pre-write source. Stop without name evidence or with account ambiguity.
- Allow bounded automatic recovery of local-communication initialization during read-only directory access, never retrying potentially sent PATCH.
- Fixed extension files to LF, allowing byte-exact generated-entry checks after separate Windows automatic-line-ending checkouts.
- Passed 158 Node tests and 15 independent real Edge automatic flows. Chrome account environments remained untested.

<a id="v130-2026-10-18本地待验"></a>

## v1.3.0 (2026-10-18, local acceptance pending)

- Removed the fixed six-site scope/manual name mapping. Recognize subscription/brand on browser-authorized HTTP(S) domains/IPs, match existing local Sub-Store names, then automatically validate and update URL only after a unique match.
- Moved manual operations into advanced settings. Normal flow requires no popup, name selection, link copying or sync-button click.
- Independent real Edge 155 reproduction showed that one helper-file URL reused in both worlds loaded only the first copy. Added permission did not help; different file URLs loaded both. Changed to two generated entry points from one source, with drift prohibited by build checks.
- Added real browser regressions without accounts, non-preset domain/HTTP/IP samples and automatic-match ambiguity cases. No commit/push before six actual account captures and configuration readbacks passed.

<a id="v121--v120-2026-10-18本地开发版"></a>

## v1.2.1 / v1.2.0 (2026-10-18, local development versions)

- Added extractor, six-site presets and version/stage diagnostics. Independent readback showed old success did not prove new capture; five actual sites stopped at bridge_ready and did not pass publication acceptance.
- Fixed delayed assignment, stale DOM-candidate replay and large ambiguity-notification boundaries. Cross-world file loading was fixed in v1.3.0.

<a id="v110-2026-10-18本地验证版"></a>

## v1.1.0 (2026-10-18, local validation version)

- Communicated through an inactive local frontend tab using its normal Origin, resolving built-in Sub-Store rejection of extension-background Origin without modifying Origin or backend configuration.
- `Source B` completed real new-link capture, validation of 53 nodes, writeback and independent readback, preserving three processing steps/other fields.

<a id="v100-2026-10-18本地开发版"></a>

## v1.0.0 (2026-10-18, local development version)

- After manual login to `Source B`, observed subscription responses, validated real nodes, wrote URL only, retained backups and independently read back.
