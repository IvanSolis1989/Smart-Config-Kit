[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../docs/assets/readme/page-substore-mobile.svg">
  <img src="../docs/assets/readme/page-substore.svg" alt="Sub-Store multi-provider subscription aggregation" width="100%">
</picture>

# Sub-Store multi-provider subscription aggregation

Combine providers into one subscription, then let the client override classify nodes and apply routing.

<p>
  <a href="../docs/guide/downloads.md"><img src="../docs/assets/readme/nav-downloads.svg" alt="Downloads" width="145" height="38"></a>
  <a href="../docs/README.md"><img src="../docs/assets/readme/nav-docs.svg" alt="Documentation" width="145" height="38"></a>
</p>

[Choose deployment](#先判断是否需要聚合) · [Aggregate subscriptions](#聚合步骤从多条机场订阅到一条-mihomo-url) · [Sync extension](edge-extension/README.md) · [Scripts](scripts/README.md) · [Troubleshooting](#常见问题)

> This directory handles **subscriptions and nodes**, not routing rules. Smart-Config-Kit's rules, policy groups, DNS, sniffing, GeoX and rule-providers retain `rulesets/source/routing-graph.js` as their sole baseline.

Sub-Store combines providers into one subscription. The repository override then classifies combined nodes and applies routing.

```text
Provider-native subscriptions
  → Sub-Store: source labels, collection cleanup, deduplication, optional traffic-header merge
  → One Clash.Meta(mihomo) subscription URL
  → One FlClash / Clash Party profile + Smart-Config-Kit override
  → 22 regional + 33 service groups
```

<a id="先判断是否需要聚合"></a>

## Decide whether aggregation is needed

| Goal | Appropriate approach |
|---|---|
| Switch manually between two providers | Keep separate client profiles |
| Put nodes from multiple providers into the same regional / global / AI groups | Use a Sub-Store collection as described here |
| Make the override store URLs/tokens, fetch and merge nodes | Not recommended: it mixes subscription management, credential storage and refresh-failure handling into the override |

FlClash overrides process only the active profile's `proxies`. Independent profiles do not merge automatically.

## Security boundaries: read first

- Subscription URLs, tokens, UUIDs, passwords and complete node lists are private. Do not publish them in issues, chat logs, repositories or screenshots.
- Prefer trusted local or self-hosted Sub-Store. Do not expose an unprotected public backend.
- Official Sub-Store warns that module-related `sub.store` domains are not public domains it owns; incorrect routing can expose data. Read the official security notice before using modules. The Docker example here binds only to loopback.
- `sub-store.json` / `root.json` are personal configuration backups and must not be committed here.
- A Cloudflare Worker domain is public. Management tokens belong only in management UI/API access; client subscriptions need a separate download token. Do not publish management URLs/tokens, D1 exports or configuration screenshots.

## Method 1: built-in client Sub-Store

After a subscription link reset, the [Edge / Chrome sync extension](edge-extension/README.md) can extract, match, validate and update existing entries when you open a logged-in, explicitly allowed provider dashboard. It preserves processors and collection relationships. Local-only is the default, with optional independent Cloudflare support. Validate each target separately; partial success is not rolled back. Source updates, collection/Gist publication and phone refresh are separate checks.

If Clash Party / Mihomo Party already supplies Sub-Store, no extra deployment is required:

1. Add each provider as an individual subscription.
2. Add stable prefixes using the individual-subscription procedure below.
3. Create a collection and attach cleanup/deduplication scripts in order.
4. Select `Clash.Meta(mihomo)` output and copy its single generated URL.
5. Import only that URL into FlClash / Clash Party and associate the repository override.

<a id="聚合步骤从多条机场订阅到一条-mihomo-url"></a>

## Aggregation: multiple subscriptions to one Mihomo URL

The raw-script chain below is for built-in Sub-Store, official Docker, or a Worker adapter actually verified to provide the same script host. The Cloudflare-native implementation in [method 3](#方式三cloudflare-workers无服务器兼容版) uses its built-in operations instead.

### Step 1: add provider-native subscriptions separately

Create one entry per provider, preferably using its native URL. Avoid unknown online converters. Do not post URLs, tokens or node screenshots in public issues.

### Step 2: prefix each source

Attach [`flag-airport-rename.js`](scripts/local/flag-airport-rename.js) once per provider. Output is “flag + provider label + original node name”, preserving provenance and avoiding collisions without breaking regional detection.

Example script URL (replace `Airport-A` with a local label, not a real token):

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/SubStore/scripts/local/flag-airport-rename.js#name=Airport-A&separator=%20-%20&fallback=%F0%9F%8C%90
```

Use distinct `name` values for Airport-B / Airport-C. Fragment parameters after `#` are not sent to GitHub in the script request.

### Step 3: create a collection and process in order

Add all individual subscriptions to a collection, then attach these scripts. The first three provide routine cleanup. Normalize inconsistent names when needed, then handle duplicate names and optional traffic headers. For automatic Gist / Artifact publication, add the [final completeness check](#自动发布前的完整性保护).

| Order | Script | Purpose |
|---|---|---|
| 1 | [`drop-invalid-nodes.js`](scripts/local/drop-invalid-nodes.js) | Remove nodes missing server/port or using obsolete SS/SSR ciphers |
| 2 | [`cleanup-vless-vmess-fields.js`](scripts/local/cleanup-vless-vmess-fields.js) | Remove leftover VMess fields from VLESS nodes |
| 3 | [`drop-info-nodes.js`](scripts/common/drop-info-nodes.js) | Remove informational entries such as quota, expiry and website notices |
| 4, optional | [`normalize-node-names.js`](scripts/common/normalize-node-names.js) | Normalize common names; keep defaults unless extra rewriting is explicitly needed |
| 5, if duplicates remain | [`dedupe-node-names.js`](scripts/common/dedupe-node-names.js) | Add stable sequence numbers to remaining duplicates, avoiding client overwrite |
| 6, optional | [`merge-subscription-userinfo.js`](scripts/local/merge-subscription-userinfo.js) | Sum independent-provider traffic headers without double-counting mirrors |

Open each GitHub script and copy its **Raw** URL into Sub-Store. Do not edit repository scripts to insert private URLs or tokens.

### Step 4: output one URL

Select **`Clash.Meta(mihomo)`** as the collection target. Its generated download/subscription URL is the client entry point. Associating several original URLs with the same override does not automatically combine their pools.

### Step 5: import into FlClash / Clash Party

1. Create/update **one** remote profile using the collection output URL.
2. FlClash: follow the [client guide](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/README.md) to create and associate `FlClash(mihomo).js`.
3. Clash Party: import the collection and use the appropriate Smart / Normal override.
4. Refresh and inspect nodes. Prefixes should identify every provider, and regional groups should contain matching nodes across providers.

## Method 2: self-host Sub-Store with Docker

Follow the [official Docker instructions](https://hub.docker.com/r/xream/sub-store) on a trusted device. Bind only to loopback by default.

### 1. Prepare the environment

- Install/start Docker. Windows can use Docker Desktop + WSL; Linux / macOS / WSL can use a shell.
- Create a private directory outside this repository, not synchronized or publicly shared, for example `scki-substore/`. Container data lives in its `data/` subdirectory.
- Generate a random path using only letters, numbers and hyphens, for example `/scki-7gC2kY9mQ4pL`. This separates the backend path; **it is not authentication**. Do not reuse the example or rely on the path alone.
- Keep loopback-only listening. Do not expose publicly unless you can configure HTTPS, authentication, access control and a reverse proxy.

### 2. Create Compose configuration

Create `compose.yaml` in the private directory. Replace the example `SUB_STORE_FRONTEND_BACKEND_PATH` and use the same path in every URL below. The image tag is pinned for reproducibility; check [official tags](https://hub.docker.com/r/xream/sub-store/tags) before upgrading.

```yaml
services:
  sub-store:
    image: xream/sub-store:2.36.23
    container_name: scki-substore
    restart: always
    environment:
      # Generate your own: start with /; use only letters, numbers and hyphens.
      SUB_STORE_FRONTEND_BACKEND_PATH: /scki-7gC2kY9mQ4pL
      # Allow only local frontend origins.
      SUB_STORE_CORS_ALLOWED_ORIGINS: http://127.0.0.1:3001,http://localhost:3001
    ports:
      # Expose only the frontend on loopback; do not publish port 3000.
      - "127.0.0.1:3001:3001"
    volumes:
      # Private persistent data: do not commit, synchronize or publish.
      - ./data:/opt/app/data
```

### 3. Start and verify

Run in the directory containing `compose.yaml`:

```bash
docker compose up -d
docker compose ps
docker compose logs --tail=100 sub-store
```

The health check should return environment information (PowerShell can use `curl.exe`):

```bash
curl -fsS http://127.0.0.1:3001/scki-7gC2kY9mQ4pL/api/utils/env
```

On the same device, open:

```text
http://127.0.0.1:3001?api=http://127.0.0.1:3001/scki-7gC2kY9mQ4pL
```

Add subscriptions only after the page and health check work. For backend-unreachable errors, compare ports and exact paths in `SUB_STORE_FRONTEND_BACKEND_PATH` and browser URLs.

### 4. Maintain, upgrade and back up

```bash
# Inspect status and logs.
docker compose ps
docker compose logs --tail=100 sub-store

# Confirm the target tag before pulling/recreating. ./data is retained.
docker compose pull
docker compose up -d

# Stop while preserving private data.
docker compose stop
```

Privately back up `./data` before upgrades. Do not commit/publish it. Cross-device access needs HTTPS, authentication or VPN; a random path is not access control. Do not simply change to public listening.

<a id="方式三cloudflare-workers无服务器兼容版"></a>

## Method 3: Cloudflare Workers compatibility implementation

The community project [Sub-Store Cloudflare](https://github.com/realchendahuang/sub-store-cloudflare) deploys Sources, Collections and download URLs to your Worker, storing data in D1. It suits lightweight “multiple providers → one `mihomo` URL → one client profile” workflows, but is **not** an equivalent replacement for official Docker / Node Sub-Store. Prefer methods 1 or 2 by default.

### Choose according to script requirements

**Built-in or official Docker (methods 1 / 2):**

- Use repository raw scripts according to original-host capabilities.
- Suitable for full Script Operator, `$substore` / `flowUtils`, traffic-header merging, Gist / Artifact and local Node features.

**Cloudflare-native D1 project in this section:**

- Identity: `realchendahuang/sub-store-cloudflare`.
- Supports trusted **build-time static** Filters / Operators only.
- Suitable for aggregation, routine cleanup, renaming, deduplication, sorting and one subscription URL without maintaining a VPS.

**Historical Workers adapter:**

- Identity: `Yu9191/sub-store-workers`; its upstream is currently inaccessible.
- A previously reviewed version provided partial Script Operator compatibility through QuickJS WASM.
- No migration URL is confirmed. Reassess only after obtaining trusted source and reviewing compatibility; it is not a current downloadable deployment entry point.

### What “cannot run scripts” means here

The Cloudflare-native implementation supports built-in aggregation, filtering, renaming and deduplication, but does not dynamically execute JavaScript from a page, D1 or URL. Custom Filters / Operators must be trusted code built locally and redeployed. See its [compatibility matrix](https://github.com/realchendahuang/sub-store-cloudflare/blob/main/docs/upstream-compatibility.md).

This is not because Workers lack `fetch` or caching. Workers prohibit request-time `eval()` / `new Function()`, while original Sub-Store dynamic scripts also receive host APIs including `$substore`, `flowUtils`, `$httpClient`, `produceArtifact` and `require`. See [runtime constraints](https://developers.cloudflare.com/workers/runtime-apis/web-standards/) and [original script host](https://github.com/sub-store-org/Sub-Store/blob/30b9113d3e1d82b7af70cf8f66c79a08b54377bd/backend/src/core/proxy-utils/processors/index.js#L1748-L1832).

Do **not** paste repository Raw script URLs into this project. Use built-in operations, or choose methods 1 / 2 for original scripts.

> Do not generalize that all Workers versions cannot execute scripts. The historically reviewed `Yu9191/sub-store-workers` used QuickJS WASM for partial Script Operator / Filter support, but was not full Node: local MMDB, filesystem, `child_process` / shoutrrr and custom HTTP/SOCKS outbound proxies were limited. Its public upstream is inaccessible and migration unconfirmed. Historical review does not establish present download availability. For an existing or separately obtained trusted version, inspect `worker-status` capabilities and actual script results.

### Deploy and create the first collection

#### 1. Prepare two different tokens

Generate separate random values in a password manager for `SUB_STORE_ADMIN_TOKEN` and `SUB_STORE_PUBLIC_DOWNLOAD_TOKEN`, or run on a trusted local computer:

```bash
node -e "const{randomBytes:r}=require('node:crypto');console.log(r(32).toString('base64url'));console.log(r(32).toString('base64url'))"
```

Use the first only for administration, the second only for client downloads. They must differ. Never put them in this repository, screenshots, issues or chat logs.

#### 2. Deploy to your Cloudflare account

Open the [project](https://github.com/realchendahuang/sub-store-cloudflare) and choose **Deploy to Cloudflare**:

1. Import into your own GitHub / GitLab account, not an unknown third-party deployment.
2. Create a D1 database for a new deployment; select an existing database only when upgrading that instance.
3. Set the separate `SUB_STORE_ADMIN_TOKEN` and `SUB_STORE_PUBLIC_DOWNLOAD_TOKEN` secrets.
4. Confirm build command `pnpm run build` and deployment command `pnpm run deploy`, then deploy.

The project is designed around free-plan Workers limits, but your own Cloudflare dashboard governs quotas, availability and billing. For terminal deployment, follow its [quick start](https://github.com/realchendahuang/sub-store-cloudflare/blob/main/docs/quick-start.md) with Node.js 22+ / Corepack. Do not commit tokens in Git configuration or `.env` files.

#### 3. Use only the admin token for management

After deployment, first open:

```text
https://<your-worker>/?token=<SUB_STORE_ADMIN_TOKEN>
```

The admin token is for this interface and management APIs only. The frontend saves management state in the current browser. If data fails to load, confirm you used the admin token rather than the download token.

#### 4. Create Sources and a Collection

1. Create one remote Source per provider with nonsensitive IDs such as `airport-a`, `airport-b`.
2. Initially enable only informational-node cleanup. For source labels, use built-in regex renaming, not repository Raw JS.
3. Edit the preset `Daily` Collection. Enable endpoint deduplication and name sorting, then preview to confirm every provider is represented.
4. Do not initially enable regional include filters, which could discard other regions prematurely.
5. Select **`mihomo`** output and copy the Collection download URL.

#### 5. Import and verify

1. Create **one** remote profile in FlClash / Clash Party with the `mihomo` download URL.
2. The URL must use `SUB_STORE_PUBLIC_DOWNLOAD_TOKEN`, **never** the admin token.
3. In FlClash, associate `FlClash(mihomo).js` and refresh this profile.
4. Check that all providers share the pool, then verify regional/service groups. If source-prefix, invalid-node or script-based traffic-header requirements cannot be met, return to methods 1 / 2.
5. Export a configuration backup from Cloudflare management. Deploy Button repository copies do not automatically merge upstream changes; follow the [upgrade guide](https://github.com/realchendahuang/sub-store-cloudflare/blob/main/docs/upgrading.md).

### If scripts are required

- For repository Raw scripts, `flowDedup`, `merge-subscription-userinfo.js` or original dynamic host APIs, use method 1 or official Docker.
- For Workers / Pages experiments, historical reference `Yu9191/sub-store-workers` at `https://github.com/Yu9191/sub-store-workers` is inaccessible, with no confirmed migration. It differs from `realchendahuang/sub-store-cloudflare`; source, storage and APIs are not interchangeable. Read [reviewed restricted wrapper/source boundaries](edge-extension/README.md#已审查-worker-的专用受限入口), verify baseline, dependencies and permissions, and do not deploy that project without trusted source and confirmed provenance.
- Historical steps below are only for owners of trusted source: place original `Sub-Store` and the adapter under one parent directory, build locally and bind KV. After deployment, inspect `<worker>/<path-password>/api/utils/worker-status` for authentication, KV and script capabilities before importing production subscriptions. Check each step against your actual source/README. The repository's restricted wrapper is not a universal Workers installer.

Before using the [Raw script chain](#聚合步骤从多条机场订阅到一条-mihomo-url), confirm method 1, method 2 or an actually tested compatible script host. Cloudflare-native users should use built-in operations.

<a id="自动发布前的完整性保护"></a>

## Completeness protection before automatic publication

Check source completeness after generation and before Gist / Artifact upload. HTTP 200, valid YAML and nonzero node count do not rule out missing sources or error placeholders. On failure, preserve the last accepted publication.

### Local Sub-Store: strict downloads and a final guard

1. Explicitly persist `ignoreFailedRemoteSub: "disabled"` on every participating individual subscription and collection. Changing only the collection cannot stop children swallowing failures. `quiet` / `fallbackQuiet` are not strict failure handling; the latter may return empty data rather than reuse the last complete result.
2. Persist `proxy` for sources needing it, and verify it in the automatic-sync environment. Do not rely on preview-only `proxy` / `noCache` query parameters: the reviewed original artifact-sync endpoint does not pass these to the generator. Check other versions' implementations.
3. After source renaming, cleanup, deduplication and optional traffic-header processing, add a **final ScriptOperator** calling [`validateFusionPublication`](scripts/fusion-publication-guard.mjs). Adapt validation functions and a private contract into it, and confirm thrown errors stop artifact generation/upload. This ESM `.mjs` is not directly usable as a Raw-URL ScriptOperator. See [integration details](scripts/README.md#fusion-发布完整性模块).
4. Set both a meaningful minimum node count and stable prefixes for every required logical source. Mirrors may represent one logical source; several input records do not prove full coverage. Derive thresholds from an accepted baseline, not by lowering them to conceal missing sources.

Only these three contract fields are accepted. Values below are generic examples:

```json
{
  "schemaVersion": 1,
  "minimumNodes": 10,
  "requiredNamePrefixes": ["SOURCE-A-", "SOURCE-B-"]
}
```

Prefixes match literal, case-sensitive starts, not regex. Match the final processed names. The module also rejects names containing five confirmed HTTP-200 error placeholders, retained verbatim because they are match data: `在线设备数量超过套餐允许值`, `打开官网获取新订阅链接`, `请复制新订阅链接重新导入更新`, `使用的设备过多`, `请去官网获取新订阅链接`. Ordinary quota/expiry notices are not rejected merely for generic words by this particular check. If earlier cleanup removes error nodes, required-source coverage must still reveal missing sources. The guard neither proves connectivity nor recognizes every unknown error message.

**Validate recovery separately from new publication.** If a source still returns 403, retain its subscription record and assess recovery of verified older data. A temporarily usable recovery copy does not satisfy a complete contract still requiring that source. Strict new publication must cover every required logical source. Changing required sources is a separate explicit decision; retries must not automatically remove missing entries or weaken thresholds. Compare configuration counts, client in-memory nodes and published files independently; an old active configuration is not new-publication acceptance.

### Reviewed Gist → KV Worker wrapper

[`patch-fusion-worker.mjs`](scripts/patch-fusion-worker.mjs) performs source-only transformation of the reviewed, exactly matching `sckiValidFusion` / `sckiPublishedFusion` wrapper. It is not a universal installer and does not deploy, write KV or sync Gist. Changed source, duplicate matches or already-patched input are rejected. Do not apply it to standard Sub-Store or other Workers projects without review.

Provide adjacent `scki-fusion-publication-guard.mjs` and save the **strict publication contract** in `SUB_STORE_DATA` KV at `static:fusion:contract:v1`. The wrapper validates it first with `validateFusionContract`. Missing, unreadable or invalid contracts return 503 before requesting Gist, even when a recovery contract exists. Only new Gist content passing existing YAML/node-field validation and the strict contract may update `static:fusion:clashmeta`; bad upstream data cannot replace a good cache.

When upstream is unavailable or fails the strict contract, the wrapper tries a saved copy. Optional `static:fusion:recovery-contract:v1` validates only this cache. If absent/unreadable, strict criteria apply; an explicitly invalid recovery contract rejects the cache. Return cached data only after the relevant checks, otherwise 503. Review and validate recovery criteria separately against verified older data. They may equal strict criteria, or differ solely for reading old cache, never for admitting an incomplete new Gist, writing new cache or weakening publication standards. Validate both candidates and fallback data before strengthening a contract.

For source-coverage checks only, the Worker removes one leading national flag, white flag or globe symbol plus following whitespace. Output remains unchanged; arbitrary other emoji are not removed. This protects only the wrapper publication-read path. Local artifact uploads and native downloads bypassing it need independent validation. See [scripts](scripts/README.md#fusion-发布完整性模块).

A reviewed adapter with an independent download gateway can also use [HTTP 530 recovery](scripts/README.md#下载网关-530-恢复): only an explicit gateway 530 permits one direct GET/HEAD attempt to the same target. Diagnose other failures separately. This does not change subscription publishers or weaken previews/completeness.

## Verification checklist

- Exactly one client-import URL for the collection, targeting `Clash.Meta(mihomo)`.
- Prefixes such as Airport-A / Airport-B appear, with no quota/expiry/website fake nodes.
- FlClash's processed count equals the combined pool, not one provider alone.
- Regional/service groups appear. With the override, expect up to 22 regional and 33 service groups.
- Duplicate names are not silently overwritten; inspect `dedupe-node-names.js` logs if needed.
- Check traffic totals only when the optional script is used: independent providers add; mirrors count once.
- Required-source failures, missing coverage, too few nodes or error placeholders block new publication. A bad Worker upstream must not replace accepted cache.

<a id="镜像订阅流量去重"></a>

## Mirror-subscription traffic deduplication

[`merge-subscription-userinfo.js`](scripts/local/merge-subscription-userinfo.js) handles collection traffic headers only, not node deduplication.

1. Automatic: subscriptions with identical paths/query parameters after removing the domain, and equal `total` / `expire`, are treated as one mirrored account. Small CDN-cache differences in `upload` / `download` are allowed.
2. Explicit: when mirror paths or metadata differ, use the same `flowDedup` fragment key on each URL.

```text
https://sub-a.example/api/v1/client/subscribe?token=...#flowDedup=airport-alpha
https://sub-b.example/mirror/subscribe?token=...#flowDedup=airport-alpha
```

Within one group, use maximum `upload`, `download`, `total`, and latest expiry. Independent providers still add. If identical traffic headers belong to independently billed accounts, use `#flowDedup=off` to disable automatic deduplication. Logs do not print subscription URLs or `flowDedup` values.

<a id="常见问题"></a>

## Troubleshooting

### Why Sub-Store when FlClash stores multiple subscriptions?

Profiles support switching. Sub-Store merges nodes into one pool so one override can classify them together.

### Empty groups or only one provider after aggregation?

Confirm you imported the collection output URL, associated the override and refreshed that same profile.

### Duplicate names or unclear sources?

Use `flag-airport-rename.js` per individual source, then `dedupe-node-names.js` on the collection. The former preserves provenance; the latter handles remaining duplicate names.

### Why not put private URLs directly in the repository JS?

Public overrides do not store private URLs. Sub-Store manages credentials, refresh, traffic and deduplication; the repository provides redacted templates only.

## Advanced snapshots and Worker integration

Validate source updates, snapshot storage, collection/Gist publication and phone retrieval separately. The capabilities below are source-restricted helpers; see the extension guide for complete permissions/recovery details.

### Raw source snapshots when Cloudflare egress is blocked

For the reviewed adapter, the extension can send single-provider unprocessed `original` nodes from a strict local `noCache` preview to a private snapshot endpoint. Cloudflare then applies its own saved original `process`. Only server-policy-allowed sources with confirmed HTTP 403 challenge blocking qualify. Healthy sources remain cloud-fetched; local final Fusion output is not a cloud raw source.

Policies validate source allowlist, minimum nodes, exact URL and configuration binding. Snapshots last 24 hours; unpersisted candidate URLs allow preview only within 120 seconds after upload. Local preparation removes only non-node metadata with exact `剩余流量[:：]` / `套餐到期[:：]` prefixes, preserving every real original node. Other invalid/device-limit placeholders remain failures; the server rejects mixed fake-node snapshots and does not lower minimum counts.

Fallback covers only confirmed direct 403 challenges, or confirmed direct 403 challenges after gateway 530 recovery. It does not cover gateways wrapping upstream 403 as HTTP 200. Expired/missing/misbound snapshots or error placeholders fail closed; other download errors do not trigger generic fallback. No VPS is required. Cloudflare can independently retain/process accepted snapshots, but refreshing a blocked source still requires local service and a new upload. This is not restored direct access or fully independent refresh. See the [extension guide](edge-extension/README.md#cloudflare-下载受阻源的原始快照).

### Persistent local content for one-time sources

Explicitly allowed one-time sources retain `source: "local"`, empty `url` and node `content`. They do not participate in ordinary remote-URL matching. The extension requires a trusted site, exact unique name and source policy. One temporary local remote preview retrieves originals, then the same in-memory nodes are validated through each target's original local processors. Each target updates/readbacks only `content`, not source type, URL, processors or collection relationships.

The dedicated Cloudflare local endpoint limits updates/recovery using server-side names, minimum counts and full configuration revisions. Local updates also compare the latest configuration first. Sensitive old `content` is backed up in local extension storage for conditional recovery; changed configuration refuses overwrite. Saved local content has no remote-snapshot 24-hour TTL and remains available from Cloudflare when the local service closes. Obtaining a new one-time link still needs the local service. Existing Gist/Fusion publication and phone retrieval do not change automatically. See [controlled local snapshots](edge-extension/README.md#一次性链接的受控本地内容快照). This is source-restricted, not generic automatic overwrite of arbitrary local entries.

## Directory and references

```text
SubStore/
  README.md                 This guide
  scripts/
    README.md               Script purposes and processing order
    local/                  Redacted scripts extracted from local configuration
    common/                 Reusable scripts
    community/              Upstream script index
```

- [Official Sub-Store](https://github.com/sub-store-org/Sub-Store): conversion, subscription management, script operators and collections.
- [Official Docker image](https://hub.docker.com/r/xream/sub-store): local port binding, persistence, backend paths, CORS and health checks.
- [Official Wiki](https://github.com/sub-store-org/Sub-Store/wiki): Docker entry point; image documentation governs environment variables.
- [Official domain safety notice](https://github.com/sub-store-org/Sub-Store#substore-domain-safety-notice): data-exposure boundaries before using modules/public frontends.
- [FlClash override guide](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/README.md): associate the combined URL with the repository override.
