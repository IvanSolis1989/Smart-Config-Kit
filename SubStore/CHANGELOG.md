<picture>
  <source media="(max-width: 600px)" srcset="../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../docs/assets/readme/page-changelog.svg" alt="SubStore changelog" width="100%">
</picture>

<a id="substore-变更日志"></a>

# SubStore — Changelog

> SubStore is an auxiliary-script directory, outside generation of the 14 formal client-routing product categories recorded here.

[![Documentation](../docs/assets/readme/nav-docs.svg)](../docs/README.md) [Project home](../README.md) · [Repository documentation](../docs/README.md)

<a id="浏览器扩展-v181--证据复核与并发失败保护-2026-10-23"></a>

## Browser extension v1.8.1 / evidence review and concurrent-failure protection (2026-10-23)

- Local snapshots reread/compare configuration before returning read-only results and after backups before writing, preventing changes made during waits from being overwritten. Added synthetic integration from the client to the actual Worker snapshot module plus concurrency/failure regressions. See [extension history](./edge-extension/CHANGELOG.md) and [staged acceptance records/criteria](../docs/research/2026-10-23-substore-v1.8-validation.md). Real services/phone delivery still required user-environment acceptance; Worker APIs, routing graph and publisher were unchanged.

<a id="文档精简-2026-10-19"></a>

## Documentation streamlined (2026-10-19)

- Streamlined aggregation, script and extension guides while retaining diagrams, commands, authorization and privacy boundaries. Auxiliary modules/installation artifacts were unchanged.

<a id="浏览器扩展-v180--受控持久-local-内容快照-2026-10-18"></a>

## Browser extension v1.8.0 / controlled persistent local-content snapshots (2026-10-18)

- Added one-time fetching, independent local previews at both targets, content-only write/readback and conditional recovery for explicitly allowed local entries with empty URLs. One-time links are not persisted as remote sources. Dedicated Cloudflare policies/revision limits are separate from existing expiring remote snapshots.
- Companion `local-snapshot.mjs` / `patch-local-snapshot-worker.mjs` v1.0.0 restrict access using `SUB_STORE_LOCAL_SNAPSHOT_POLICIES` and dedicated `/api/local-snapshot/:name` GET/POST. Complete revision checking, native preview and content-only commit run in one serialized DO operation, without granting general content-management authority.
- Old-content backups are sensitive local data. Turning off the local machine does not stop cloud output of saved local content; fetching the next one-time source still requires it. Original publishers, Gist and phone copies do not automatically switch. See [extension history](edge-extension/CHANGELOG.md). This affects auxiliary subscription management only, not routing artifacts.

<a id="浏览器扩展-v170--受阻源原始快照-2026-10-18"></a>

## Browser extension v1.7.0 / blocked-source raw snapshots (2026-10-18)

- Added policy-restricted single-source raw snapshots. Local strict `noCache` `original` nodes upload through a private entry; Cloudflare validates source, minimum count, exact URL and configuration binding, stores temporarily and applies its original processors. The 24-hour validity is separate from the 120-second candidate-preview window. Fallback applies only to confirmed direct 403 challenges, or confirmed direct 403 challenges after gateway-530 recovery, not gateway-200 wrappers of upstream 403.
- Preparation removes only exact plan metadata, retaining every real raw node. The server accepts real nodes only; other invalid/over-limit placeholders and insufficient counts remain rejected. CI adds extension preparation/Worker-module regressions. Real seed/publication paths still need separate acceptance.
- Raw nodes never enter permanent extension storage, and processed local Fusion is not uploaded. Blocked-source refresh still requires one local run; healthy sources do not and no VPS is needed. Gist/Fusion publishers, published client copies and routing artifacts are unchanged. See [extension history](edge-extension/CHANGELOG.md).

<a id="浏览器扩展-v160-2026-10-18"></a>

## Browser extension v1.6.0 (2026-10-18)

- Moved local relay communication to an offscreen hidden iframe, preserving natural frontend Origin and write protections without visible tabs. Updated background recovery, disconnect rebinding and the 15-file package dependency closure. See [extension history](edge-extension/CHANGELOG.md).
- Passed 308 Node tests and 33 isolated Edge flows, plus seven probes including actual worker restart. Only auxiliary subscription-management tools changed, not routing artifacts or the Gist publisher.

<a id="独立网页管理别名模块-v100-2026-10-18"></a>

## Independent web-management alias module v1.0.0 (2026-10-18)

- Added independent full-management prefix selection and an exact Worker patch. Retained old/restricted-extension entry points without changing the original environment. Deployment owners separately authorize the new secret; extension URL-only permission is not reused.
- Added official evidence for frontend `api` deep-link parameters, private-address delivery boundaries and old/new entry coexistence regressions. Routing graph, client artifacts and publishers were unchanged.

<a id="下载网关-530-恢复模块-v100-2026-10-18"></a>

## Download-gateway 530 recovery module v1.0.0 (2026-10-18)

- Added an independent recovery module/exact Worker-source patch. When the existing gateway returns HTTP 530, GET/HEAD alone may try direct once with the original destination, upstream headers and cancellation signal. Redirects/non-success responses are rejected; other statuses/errors continue failing.
- Retained gateway secrets/source allowlist without changing subscription writes, processors, publishers or routing artifacts. Added failure-branch regressions/CI. Actual sources still require separate preview/completeness acceptance.

<a id="浏览器扩展-v151--受限同步入口-v101-2026-10-18"></a>

## Browser extension v1.5.1 / restricted synchronization route v1.0.1 (2026-10-18)

- Fixed runtime incompatibilities exposed by real cloud requests: bodyless GET omits JSON Content-Type; Worker internal forwarding/preview-entry queries use `redirect: manual`, retaining 3xx non-success checks. Added regression rejecting `redirect: error`, based on [Cloudflare workerd Request implementation](https://github.com/cloudflare/workerd/blob/main/src/workerd/api/http.c%2B%2B) and actual Worker logs.
- Only auxiliary subscription-management communication changed; routing graph, DNS, client-routing artifacts and Gist publisher were unchanged.

<a id="扩展受限同步入口模块-v100-2026-10-18"></a>

## Restricted extension synchronization route module v1.0.0 (2026-10-18)

- Added `extension-sync-route.mjs` / `patch-extension-sync-worker.mjs` for reviewed Worker wrappers. Independent secret prefix `SUB_STORE_EXTENSION_BACKEND_PATH` permits only subscription-directory/single-entry GET, JSON preview and URL-only single-entry PATCH, retaining old routes. Other business APIs/parameters under the prefix are rejected.
- Preview must read the persistent entry from the same server. Processors, content and all other fields must match completely; only URL/fixed refresh flags may change. Reject when server queries fail, preventing arbitrary processor-script execution through a preview bypass.
- The patcher performs matched source transformation only, without generating/reading deployment secrets or deploying itself. Private connection JSON is delivered separately, never in Git/public packages. Scope is auxiliary subscription management, not routing graph/client artifacts.

<a id="浏览器扩展-v150-2026-10-18"></a>

## Browser extension v1.5.0 (2026-10-18)

- Added a default-off independent Cloudflare Sub-Store target, private backend connection settings and JSON import. Targets validate, update and recover independently; partial success is supported without automatically retrying sent PATCH. See [extension history](edge-extension/CHANGELOG.md). Only auxiliary subscription tools changed.
- Fixed permission-query errors permanently deleting approved-site records. Errors pause access but retain permission; same-origin new documents/background restarts need no new approval.
- Added a packaging CLI/read-only check generating a 13-file installation from committed Git refs. Passed 33 isolated Edge flows including dual-target/partial success. Real accounts and permission dialogs still required separate acceptance.

<a id="fusion-发布完整性模块-v100-2026-10-18"></a>

## Fusion publication-integrity module v1.0.0 (2026-10-18)

- Added `fusion-publication-guard.mjs` with independent `validateFusionContract`. A private contract verifies minimum nodes, required logical-source prefixes and five confirmed HTTP-200 error-placeholder patterns. Errors expose categories/counts only, never nodes or credentials.
- Added a pure source patcher accepting only an exactly reviewed Worker wrapper. The generated wrapper validates strict KV contract `static:fusion:contract:v1` before requesting Gist; missing/invalid contracts return 503. New Gist content enters cache only after strict validation. Optional `static:fusion:recovery-contract:v1` applies solely to saved-copy fallback. Missing/read-failed recovery contracts fall back to strict requirements; explicitly invalid contracts reject cache. Recovery requirements need separate acceptance and do not weaken new-publication standards. The patcher neither deploys nor changes external state.
- Documented strict failure mode for every participating local single/collection subscription, persistent download proxy, final ScriptOperator integration and the distinction between recovery data/new complete-publication acceptance. Public examples contain no private source contracts.
- CI added ESM paths, triggers for two regression suites, syntax checks and integrity tests while retaining existing extension build/Node/Windows Edge end-to-end checks. This independently versioned module changes no routing/client artifacts and requires no all-client regeneration.

<a id="浏览器扩展-v141-2026-10-18"></a>

## Browser extension v1.4.1 (2026-10-18)

- Removed DOM controls invalidate candidates/clear pending work. Prerender activation re-handshakes; normal recovery needs no refresh. See [extension history](edge-extension/CHANGELOG.md) for actual backend verification and scope of the cache-encoding review item.

<a id="浏览器扩展-v140-2026-10-18"></a>

## Browser extension v1.4.0 (2026-10-18)

- Addressed PR #189 second review: separated site trust/browser access; retained automatic extraction/matching/writeback after first approval. Fixed cross-response ambiguity, document invalidation on unobserved target pages and leaked failed relay pages. See [extension history](edge-extension/CHANGELOG.md).

<a id="浏览器扩展-v132-2026-10-18"></a>

## Browser extension v1.3.2 (2026-10-18)

- Addressed four PR #189 Codex Review findings: late ambiguity cancels unsent writes, account-query fidelity, relative anchors and complete loopback detection. See [extension history](edge-extension/CHANGELOG.md) for implementation/regressions.

<a id="浏览器扩展-v131-2026-10-18"></a>

## Browser extension v1.3.1 (2026-10-18)

- Added `edge-extension/`: generic subscription/brand extraction on authorized domains/IPs, automatically matching existing local Sub-Store names. Validate raw/processed nodes, PATCH only the matching URL, back up and independently read other fields. Not limited to six presets; normal flow requires no manual button.
- Communicates using the local Sub-Store frontend tab's natural Origin, compatible with built-in backend CORS. Six actual accounts completed automatic-flow acceptance with processors/other fields unchanged.
- Added Node extraction/message/routing/permission/communication/writeback regressions and CI. See [extension CHANGELOG](edge-extension/CHANGELOG.md). Cancelled password/API-login scripts and private configuration are not included.
- Results bind to the current version and show page stage; old success after upgrade is not current acceptance. After real Edge reproduced cross-world file-URL deduplication, generated two separate entry points from one source and added real no-account browser automatic regressions. Each site required real passes before commit/push.
- Six real automatic flows have success receipts with processors/non-URL fields preserved; 158 Node regressions and 15 independent real Edge flows passed. [Acceptance scope](../docs/research/2026-10-18-substore-auto-sync-acceptance.md) identifies reused records and untested Chrome boundaries.

## v6.0.2-substore.2 (2026-07-11)

- Fixed real CDN-mirror counter drift. Mirrors of one account can differ by several KB in cached `upload`/`download`; byte-identical values across all four traffic-header fields are not required for automatic deduplication.
- Automatic identity became host-independent subscription path/query plus matching `total`/`expire`; each mirror group still takes the maximum of each counter. Distinct accounts still require identical path/query identity. Mirrors with different path/plan metadata continue using explicit `flowDedup` grouping.
- Fixed logger receiver handling in Clash Party's embedded Sub-Store: call `$substore.info` with `$substore` as receiver. Previously the final status log threw and rolled back the script transaction, leaving old traffic headers instead of the new aggregate.

## v6.0.2-substore.1 (2026-07-11)

- Added mirror traffic deduplication to `merge-subscription-userinfo.js`: complete identical traffic snapshots with the same source path/query merge automatically; distinct mirror URLs may group explicitly using subscription-URL `flowDedup`.
- Explicit groups take the latest traffic counts/expiry to prevent CDN cache lag double-counting one account or showing premature expiry. `flowDedup=off` preserves independent subscriptions with identical traffic headers.
- Added Node regressions for automatic deduplication, independent-subscription protection, explicit groups, disabled deduplication and SubStore runtime persistence.
