[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-substore-mobile.svg">
  <img src="../../docs/assets/readme/page-substore.svg" alt="Sub-Store Edge / Chrome subscription sync assistant" width="100%">
</picture>

# Sub-Store Edge / Chrome sync assistant

After explicitly allowing a provider website, open its logged-in dashboard to match and validate existing subscriptions automatically.

<p>
  <a href="../../docs/guide/downloads.md"><img src="../../docs/assets/readme/nav-downloads.svg" alt="Downloads" width="145" height="38"></a>
  <a href="../../docs/README.md"><img src="../../docs/assets/readme/nav-docs.svg" alt="Documentation" width="145" height="38"></a>
</p>

[Install and grant permission](#使用) · [Connect Cloudflare](#同时连接独立-cloudflare-sub-store) · [Writes and privacy](#写入及隐私) · [Development](#开发与验证) · [Aggregation guide](../README.md)

**Once a site is explicitly allowed, opening its logged-in dashboard extracts, matches and validates subscriptions, updating existing entries locally and optionally in Cloudflare.**

Supports explicitly authorized HTTP/HTTPS domains, IPv4, IPv6 and self-hosted panels, not only the six real-account test examples. Both browser access permission and extension-level site trust must be valid. Current version: `manifest.json`; history: [CHANGELOG.md](CHANGELOG.md).

<a id="使用"></a>

## Usage

Install and grant initial site permission first. Daily usage then requires only opening the logged-in panel normally.

1. Start Clash Party and ensure a corresponding individual remote subscription exists. One-time-link sources use only the explicitly allowed local-content entries described below.
2. Extract the extension package. Enable Developer mode at `edge://extensions` / `chrome://extensions` and load the folder containing `manifest.json`.
3. Open the provider dashboard and sign in manually. On first use, open the extension popup and choose the control allowing automatic sync for this site, then approve browser access. The background refreshes the current page to start observing. Future normally loaded tabs trigger automatically without F5. Unapproved sites still need this initial permission; upgrades reloaded from the same directory retain it.
4. The extension detects candidates, independently matches existing entries in each enabled target, and validates original/processed nodes. Ordinary remote entries update their URL. Controlled local-snapshot entries update only `content`, never save a one-time URL as remote. Allowed cloud-blocked sources use time-limited raw snapshots; other cloud sources download normally. The popup reports local and Cloudflare results separately. Preserve successful targets after partial success; inspect the other target before deciding on a manual retry.

The popup shows automatic progress. Ports and manual diagnostics are in collapsed advanced options, not daily steps. Defaults are backend `http://127.0.0.1:38324` and frontend `http://127.0.0.1:14122`; change only if your local ports differ. UI labels may vary with extension language/version.

Initial approval applies only to the current tab's complete origin (scheme, host, port). Even preexisting browser “all sites” permission does not authorize other websites, history dropdown entries or other ports on the same host to write. Advanced options can revoke site trust. Revoking browser access also stops synchronization; regranting browser access does not restore deleted extension trust automatically.

Full-origin trust persists locally across page/background restarts. Permission-query errors suspend that access attempt. New domains or reinstallation require fresh approval. Upgrade by reloading from the same directory to preserve settings.

<a id="同时连接独立-cloudflare-sub-store"></a>

## Also connect an independent Cloudflare Sub-Store

Only local access is enabled by default; Cloudflare is off with an empty address. The global automatic-sync switch controls both. Once enabled, each target reads its own catalog and matches existing entries. Local configuration is not copied wholesale to Cloudflare, and missing entries are not created. The cloud backend must support original Sub-Store catalog, individual subscription, original/processed preview and PATCH APIs; not every similarly named Workers project does.

1. In advanced settings/diagnostics, enable simultaneous synchronization with independent Cloudflare Sub-Store.
2. Enter the full HTTPS backend URL including its private prefix, for example `https://substore.example.invalid/private-prefix`. Do not use a client download URL or append query/fragment. No cloud frontend address is needed.
3. Save global settings and allow browser access to that backend host. This permission is for backend requests only: it does not trust that host as a provider site or start observing its pages. Provider websites require separate approval.
4. Open an allowed provider dashboard normally. Check each target's matched name, node counts and result. A mismatch, offline target or validation failure does not undo success elsewhere. Once PATCH has been sent or its result is uncertain, that target is not retried automatically; inspect actual configuration first.

Alternatively, import a local connection JSON containing only these two fields, with `cloudEnabled` strictly `true`:

```json
{
  "cloudEnabled": true,
  "cloudBackendUrl": "https://substore.example.invalid/private-prefix"
}
```

Import fills a draft only. Save settings and grant backend permission afterward. JSON must not contain other settings, subscriptions or accounts. The address is stored locally; masking is not encryption. Keep private connection files outside the install directory and never commit, package or publish them.

**Source updates, publication and phone refresh need separate acceptance.** The extension updates existing URLs or `content` only. The backend must still generate a collection, validate and publish Gist / Artifact, then the phone retrieves it. Advanced options support conditional recovery per target; recovery of one does not roll back the other.

See the [acceptance matrix](../../docs/research/2026-10-23-substore-v1.8-validation.md) for code/test evidence, historical-receipt boundaries and real-account, Cloudflare, publication and phone steps/pass criteria. Isolated tests do not prove end-to-end acceptance.

<a id="一次性链接的受控本地内容快照"></a>

### Controlled local-content snapshots for one-time links

One-time entries retain `source: "local"`, `url: ""` and `content`. They do not enter ordinary remote-URL matching, and temporary links are not saved as remote URLs.

Only explicitly allowlisted sites/subscription identities in the implementation qualify. The provider site still needs browser permission and trust. Page branding must exactly match one unique internal name. The target must remain local with an empty URL, valid old content and the per-source minimum node count. Arbitrary local entries cannot be bulk-overwritten; fuzzy matching and local/remote conversion are not supported. Duplicate names, incorrect source types and policy mismatches stop processing.

```text
One-time link from an allowed website
  → Temporary local remote preview: strict noCache / noFlow, no persistent URL write
  → Fetch once per run; share real original nodes in memory
  → Each local / Cloudflare target previews and validates using its original local process
  → Each target independently backs up old content, updates only content and reads back all other fields
```

The local target compares latest configuration, then sends only `PATCH {content}`. Cloudflare uses the dedicated restricted endpoint below: serial processing validates the full configuration revision, previews, updates only `content` and reads back. Both preserve `source`, empty `url`, processors and collection relationships. This is not a cross-backend atomic transaction. Partial success is reported separately; sent/uncertain writes are not retried automatically.

The one-time URL is a temporary fetch input, not a saved remote URL. Existing pending work may retain it in session storage for up to 30 minutes. Newly fetched original nodes are shared only in current-task memory, not cached as raw nodes in extension session storage. For conditional recovery, **complete old `content` backups live in local `storage.local.backups`**, sensitive like old URL backups. Keep at most three per subscription/target address, with 64 records total. Backup failure blocks later writes. Do not export or publish node backups.

Local/Cloudflare recovery buttons restore the corresponding old `content` only if current content and all other fields still match that target's last write. Changed configuration refuses overwrite. Normal status distinguishes updated versus already-equal content; recovery reports restored old content. Cloudflare's saved local content does not use the remote-snapshot 24-hour TTL and can remain available after the local service closes. Obtaining another one-time link and refreshing content still requires local service; this is not independent cloud retrieval of a one-time source.

The existing blocked **remote** source snapshot's 24-hour TTL and 120-second candidate window remain separate. Local-content updates do not automatically change Gist / Fusion publishers or phone-published copies. Validate source content, cloud processing, collection generation and actual publication independently.

<a id="cloudflare-下载受阻源的原始快照"></a>

### Raw snapshots for sources blocked from Cloudflare

Some providers return HTTP 403 with challenge markers to Cloudflare egress, and a download gateway may also fail. If local fetching works, the deployer can enable raw snapshots solely for confirmed blocked sources, without a VPS. This does not remove the provider's Cloudflare restriction or make blocked-source refresh fully cloud-independent.

```text
Original raw nodes from a strict local noCache single-source preview
  → Upload that source snapshot through a private restricted endpoint
  → Cloudflare checks original URL / configuration and stores it with an expiry
  → Use the source originals only for a confirmed 403 challenge
  → Apply the cloud target's own saved process before collection generation
```

- Server policy controls source allowlists and minimum counts. Unauthorized sources cannot upload or use this fallback. Upload single-source unprocessed `original` nodes, never local `processed` results or final Fusion output.
- If `original` mixes quota notices with nodes, remove only non-node records beginning exactly with `剩余流量:` / `剩余流量：` or `套餐到期:` / `套餐到期：`. Preserve all real originals. Other invalid records, device-limit notices and subscription-error placeholders still fail. Server minima are unchanged; accepted `original` must consist entirely of real nodes.
- During sync from the currently allowed site, the extension obtains strict `noCache` originals from running local Sub-Store, validates and uploads them. Raw nodes are used only during transmission, not stored in permanent extension `storage.local` or browser cloud sync.
- A snapshot binds exact URL and configuration and lasts **24 hours**. A candidate URL not yet persisted in Cloudflare can use it only within **120 seconds** after upload. Never validate one candidate using another URL's data or bypass preview, PATCH or readback.
- Fallback occurs only after **confirmed direct HTTP 403 challenge**, or **gateway HTTP 530 followed by one direct attempt yielding confirmed 403 challenge**. HTTP-200 wrappers around upstream 403 are unsupported. Ordinary 403, other gateway/HTTP errors and parsing failures do not become successes. Missing, expired, misbound, undersized or error-placeholder snapshots fail closed, without filling gaps from incomplete results.
- Cloudflare stores/processes snapshots independently and does not contact the local service on every consumption. Refreshing blocked data still requires repeating this process with local service running. Healthy unblocked sources continue independent cloud downloads.

Before enabling, verify local originals, cloud saved single-source processing and expiry rejection. Gist / Fusion publishers and client-published copies are separate: upload success does not update publishers or force immediate phone refresh. Never place private endpoints, source policies or node content in public repositories, install packages or diagnostic screenshots.

## Automatic detection and name matching

- Recognizes `subscribe_url` / `subscription_url` / `sub_url` in explicit subscription responses. Supports paths such as V2Board/XBoard v1 and Kitty v3, but does not actively call provider APIs.
- Extracts candidates from subscription-copy controls, subscription-labelled inputs and Clash / sing-box / Hiddify / Surge / Loon import links. Supports limited open shadow DOM. Visible controls are checked every three seconds for delayed values; polling stops after an explicit response candidate.
- Resolves relative anchors against the document base URI, then checks subscription semantics and HTTP(S) URLs. Account comparisons preserve literal plus signs, spaces and duplicate-parameter differences rather than merging distinct accounts silently.
- Detects provider branding from brand meta, title and limited controls, filtering emails, URLs, long tokens and sensitive account content.
- Each target independently fetches its catalog using read-only `GET /api/subs`. Match account URL parameters first, ignoring fragments and explicit client-format parameters, then identical origin/path. If paths changed, require the same origin and a unique name match.
- For shared URLs or copies, match page branding exactly after normalization against internal/display names. Preserve account-distinguishing suffixes such as `copy`, personal and work. Do not guess fuzzily. Missing or ambiguous matches stop writes and explain why.
- If a provider changes its subscription CDN domain and URL matching yields no candidate, an explicitly allowed site can use one exact unique brand/catalog-name match. Reread the source and ensure its URL still matches the catalog snapshot before original/processed validation. Multiple same-name accounts still stop.
- Controlled local empty-URL entries use explicit site/name policies and unique exact matching, then the content-snapshot flow. This exception does not add other local entries to ordinary remote matching.

Newly approved domains/IPs need no per-provider preset. Encrypted responses, closed shadow DOM or nonstandard controls may still need adaptation. Six real-account checks and simulated new-domain/IP tests are separate evidence; simulation is not logged-in acceptance.

<a id="写入及隐私"></a>

## Writes and privacy

Local communication uses a localhost iframe in an offscreen extension document, allowing the browser to supply the frontend Origin naturally. Sync creates no visible Sub-Store tab. Clash Party's local frontend/backend services must remain running, but the visible `http://127.0.0.1:14122/` page may close. The hidden document is reused and rebound after background restart/connection loss. Sent PATCH requests with uncertain results are not automatically resent. Cloudflare requests use HTTPS directly from the extension service worker with host permission; no cloud frontend tab is needed.

Hidden transport uses [`offscreen` / `IFRAME_SCRIPTING`](https://developer.chrome.com/docs/extensions/reference/api/offscreen) and runtime Port. The added permission enables a packaged hidden document; the iframe is limited to `127.0.0.1`. Frame identity plus a per-run random value bind the connection. Local frontend/backend and configured cloud-host pages are never treated as provider pages. Use Chrome 111+. Recovery prefers `runtime.getContexts`; earlier supported versions use the official `clients.matchAll` branch.

Ordinary remote updates change only one existing HTTP(S) URL. Blocked-source originals use a separate policy-restricted upload. Controlled local snapshots change only `content`, not type, empty URL or processors. Remote matching still requires same-origin URL evidence or a unique brand match. Nonempty local merges, multiple sources, fragment conflicts, empty nodes and device-limit loop-warning nodes stop processing. Temporary remote preview removes only `cacheKey` and forces a fresh download. Controlled one-time fetching uses a nonpersistent temporary remote input; each target still applies its saved local configuration.

Before remote writes, compare configuration again, send only `PATCH {url}`, then independently GET and check URL plus all other fields. Local content follows the controlled update/recovery flow above. Each target saves old URL/content backups; undo requires the target still match the last write. Native local Sub-Store has no atomic conditional-update API, leaving a narrow compare/PATCH race. Avoid concurrent editing of the same subscription. Cloudflare's dedicated local endpoint additionally serializes revision checks.

### Candidate invalidation and page lifecycle

Candidates from separate fetch / XHR responses within one document accumulate. Different accounts create persistent ambiguity; only a new document resets it. New candidates/ambiguity during validation invalidate the old validation. Recheck immediately before sending; ambiguity is not queued behind an old write. Already-sent requests cannot be recalled by later candidates or page changes.

If DOM controls are the only source, removal of all subscription controls cancels unsent writes and clears retry work. Reappearance of the same URL still requires fresh validation. On activation, prerendered pages recheck permission and replay observed candidates without manual refresh.

### Private data and recovery

The extension does not read provider passwords, cookies, login tokens, saved browser accounts, clipboard or whole-page scripts. Existing catalogs are used only in internal memory for matching. Pending URLs and unconfirmed page observations use session storage. Success/failure diagnostics retain safe names, origins, times and counts, not private cloud paths or raw exceptions. Local backups may contain complete private old URLs or node content: do not export/publish them. Browser cloud sync is not used. Subscription data goes only to enabled Sub-Store backends.

It does not log in, reset subscriptions, remove provider limits or increase device allowances. It does not patrol provider sites after pages close. With a live page and offline backend, pending candidates last at most 30 minutes. Local communication initialization failures before catalog reading receive bounded automatic retries; potentially executed PATCH requests do not.

Closing/replacing a document invalidates its unsent candidates, including navigation to browser-internal pages, local Sub-Store or other unobserved pages. Check actual current document and permissions before sending. A normally reopened dashboard captures fresh candidates. If page changes after a write is sent, retain conditional backups and prevent old results overwriting new page state. Initialization failures clean up newly created hidden documents only when no request was sent. In-flight requests retain their context; read back after connection failure to establish outcome.

<a id="已审查-worker-的专用受限入口"></a>

## Dedicated restricted entry point for the reviewed Worker

For the repository-reviewed wrapper, [`extension-sync-route.mjs`](../scripts/extension-sync-route.mjs) and source-only [`patch-extension-sync-worker.mjs`](../scripts/patch-extension-sync-worker.mjs) add a separate extension connection. Set secret `SUB_STORE_EXTENSION_BACKEND_PATH` to `/ext-` followed by 64 random lowercase hexadecimal characters. Imported `cloudBackendUrl` uses the Worker's HTTPS origin plus that prefix, never the client download URL. If the old management prefix cannot be read through existing APIs, do not guess or expose it.

Only the following endpoints and necessary OPTIONS preflights are allowed under the prefix.

### Read catalog

```http
GET /api/subs
```

Reads existing subscriptions.

### Read an individual subscription

```http
GET /api/sub/:name
```

Reads an entry, including post-write verification.

### Preview a remote subscription

```http
POST /api/preview/sub?target=JSON
```

Previews original/processed nodes. JSON must contain a valid name and subscription URL.

### Update a remote URL

```http
PATCH /api/sub/:name
```

The body may contain only `url`, not processors or other fields.

### Query a remote snapshot

```http
GET /api/source-snapshot/:name
```

Available only with the snapshot module. Returns source policy, availability, counts and expiry, not raw nodes or private subscription URL.

### Upload a remote snapshot

```http
POST /api/source-snapshot/:name
```

Body fields are only `url`, `expectedUrl`, `original`. Server source policy validates real single-source originals, URL/configuration binding, count and validity. Subscription processors are unchanged.

### Query a local snapshot

```http
GET /api/local-snapshot/:name
```

Available only with controlled local snapshots. Strict native preview of current content returns permission, name, minimum count, `originalNodes` / `processedNodes` and full current configuration revision.

### Update, restore or validate a local snapshot

```http
POST /api/local-snapshot/:name
```

Exactly three independent shapes are accepted: write `{expectedRevision, original}`; restore `{expectedRevision, restoreContent}`; validate-only `{expectedRevision, original, dryRun: true}`. The server performs local preview; validate-only commits neither content nor backups.

Other paths, methods and queries under this prefix are rejected. It cannot delete, change settings/collections or publish Gists. Existing Worker entry points retain their routing. The route module validates boundaries before forwarding to the original backend. The patcher changes only reviewed source matches; it does not generate secrets, deploy or write configuration. Deployers prepare deployment/connection configuration separately. These are not universal installers for third-party Workers.

Controlled local snapshots additionally use server `SUB_STORE_LOCAL_SNAPSHOT_POLICIES` for allowed names and minimum counts, permitting only existing local empty-URL entries. Revisions bind the complete persistent configuration including old `content`; mismatches before writing return conflict. Clients cannot supply `source`, candidate URL or processors, and the endpoint does not grant generic `PATCH {content}` administration. Current-content review and validate-only use this dedicated route; generic remote preview still rejects local entries. Recovery must pass the same policy, revision and node checks.

<a id="开发与验证"></a>

## Development and verification

Node.js 22:

```bash
node SubStore/edge-extension/build.mjs
node SubStore/edge-extension/build.mjs --check
node --test SubStore/edge-extension/*.test.mjs SubStore/edge-extension/*.test.cjs
```

Edit extractor source `extractors.js`, then build MAIN / ISOLATED entry points. Do not edit bundles manually.

### Generate an installable directory

[`package.mjs`](package.mjs) gathers manifest, imported dependencies and dynamic bundles from a committed Git revision, producing a runtime-only install directory. `--out` must be absolute. `--ref` defaults to `HEAD` and does not publish uncommitted working-tree files. For another reviewed commit, specify `--ref <commit>`. Windows example:

```powershell
node SubStore/edge-extension/package.mjs --out "C:\Extensions\SubStore-AutoSync"
node SubStore/edge-extension/package.mjs --out "C:\Extensions\SubStore-AutoSync" --check
```

The directory contains 17 runtime files, without Node, tests or private connection JSON. `--check` validates manifest, dependencies and file set, not byte-for-byte equality with the commit. Upgrades back up and replace files. Use a fixed directory, inspect, then manually Reload and refresh provider pages if needed. Packaging does not install or modify browser profiles automatically.

### Isolated browser verification

Real-browser tests need Playwright and installed Chromium/Edge:

```bash
npm install --ignore-scripts --no-save --no-package-lock playwright@1.62.1
node SubStore/edge-extension/browser-e2e.mjs
```

Set `PLAYWRIGHT_MODULE_PATH` for the Playwright module and `BROWSER_EXECUTABLE` for the browser. Tests create an isolated account-free profile, random-port mock frontends/backends and fictional panels; external network is blocked. They do not connect to existing browsers or real Sub-Store. After initial site approval, they test extraction, matching, natural-Origin communication, URL-only writes/readback without opening the popup, F5 or extra clicks. Untrusted pages, ambiguity and invalid nodes must stop. Isolated test copies pregrant fictional-domain permission and explicitly set trusted sites. Those settings are not shipped, and simulated permission requests do not replace real-account acceptance.

This is an independent helper, not a change to routing sources, DNS or client artifact versions.

## Official interface references

[Content-script worlds](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts), [page/content-script communication](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts), [site permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions), [Edge compatibility](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension).

[MessageSender.documentId](https://developer.chrome.com/docs/extensions/reference/api/runtime#type-MessageSender) distinguishes documents; [tabs.onRemoved](https://developer.chrome.com/docs/extensions/reference/api/tabs#event-onRemoved) invalidates closed-page candidates. [Form URL decoding](https://url.spec.whatwg.org/#urlencoded-parsing) turns literal `+` into space, so account comparisons use parsing that preserves this distinction. [Document base URLs](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#document-base-url) resolve relative anchors.

[permissions.request / contains / onRemoved](https://developer.chrome.com/docs/extensions/reference/api/permissions) handle click-time requests, pre-send checks and revocation. [scripting.registerContentScripts](https://developer.chrome.com/docs/extensions/reference/api/scripting#method-registerContentScripts) registers observers only for explicitly allowed sites. [Chrome match-pattern](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns) host permissions are checked separately from full-origin extension trust.

[Cross-origin extension requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests) explain service-worker access through host permissions; backend access is not provider-page trust. [Edge sideloading and Reload](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/extension-sideloading) cover manual installation and same-directory upgrades.

[Extension storage](https://developer.chrome.com/docs/extensions/reference/api/storage) distinguishes local persistent settings from session data. Raw remote snapshots are not permanent extension settings. [Cloudflare KV expiration](https://developers.cloudflare.com/kv/api/write-key-value-pairs/#expiring-keys) provides bounded server retention, but the application must still validate snapshot time/bindings; a key's continued presence is not proof of freshness.

[Prerender activation](https://developer.chrome.com/docs/web-platform/prerender-pages#detect-prerender-in-javascript) uses `prerenderingchange`; the background still accepts only active top-level documents.

[Sub-Store individual PATCH](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/restful/subscriptions.js#L296-L349), [original / processed preview](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/restful/preview.js#L79-L174), [fragments and caching](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/utils/download.js#L133-L289).

[Subscription overview](https://sub-store-org.github.io/doc/subscription/overview) and [local content](https://sub-store-org.github.io/doc/subscription/local) distinguish remote URLs from persistent node content. [Link parameters](https://sub-store-org.github.io/doc/reference/link-params) explain `url` / `content` inputs. A temporary preview does not save a sustainably refreshable remote subscription.
