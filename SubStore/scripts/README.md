[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-substore-mobile.svg">
  <img src="../../docs/assets/readme/page-substore.svg" alt="Sub-Store scripts and publication helpers" width="100%">
</picture>

# Sub-Store scripts and publication helpers

Tag individual subscription sources first, then clean and deduplicate the collection. Automatic publication needs a separate completeness guard.

<p>
  <a href="../../docs/guide/downloads.md"><img src="../../docs/assets/readme/nav-downloads.svg" alt="Downloads" width="145" height="38"></a>
  <a href="../../docs/README.md"><img src="../../docs/assets/readme/nav-docs.svg" alt="Documentation" width="145" height="38"></a>
</p>

[Processing order](#按顺序接入聚合脚本) · [Publication guard](#fusion-发布完整性模块) · [Web management](#独立网页管理入口) · [530 recovery](#下载网关-530-恢复) · [Main guide](../README.md)

<a id="local"></a>
<a id="按顺序接入聚合脚本"></a>

## Add aggregation scripts in order

`local/` contains redacted scripts from a local Mihomo Party / Clash Party Sub-Store configuration. Recommended order:

1. Individual provider subscription: `flag-airport-rename.js`.
2. Collection: `drop-invalid-nodes.js`.
3. Collection: `cleanup-vless-vmess-fields.js`.
4. Collection: `../common/drop-info-nodes.js`.
5. Collection, optional: `../common/normalize-node-names.js`.
6. Collection, if duplicate names remain: `../common/dedupe-node-names.js`.
7. Collection, optional: `merge-subscription-userinfo.js`.
8. Final ScriptOperator before automatic publication: integrate the completeness guard below.

`merge-subscription-userinfo.js` adds traffic from independent providers normally. Group mirror subscriptions by placing the same `#flowDedup=...` key in their URLs. See [mirror traffic deduplication](../README.md#镜像订阅流量去重) for examples and automatic-deduplication limits.

<a id="common"></a>

## Shared cleaning templates

`common/` contains repository-maintained templates not tied to any provider:

- `drop-info-nodes.js`
- `normalize-node-names.js`
- `dedupe-node-names.js`

<a id="community"></a>

## Third-party references

[community/](community/README.md) indexes common GitHub script approaches. Scripts without clear licenses, with excessive external-API dependencies or with a high risk of exposing personal parameters are not copied into the repository.

<a id="fusion-发布完整性模块"></a>

## Fusion publication completeness modules

These two ESM modules handle subscription publication only, independently of the routing graph and client overrides.

### Publication contract validation

Module: [fusion-publication-guard.mjs](fusion-publication-guard.mjs).

```js
validateFusionContract(contract)
validateFusionPublication(
  document,
  contract
)
```

- `validateFusionContract` independently validates contract structure and values, throwing on invalid input.
- `validateFusionPublication` validates the contract, then checks parsed, field-validated `document.proxies` for minimum count, all required name prefixes and five types of error-placeholder messages.
- Failure throws. Success returns only `{nodes, coveredPrefixes}` without modifying nodes.

### Worker source patch

Module: [patch-fusion-worker.mjs](patch-fusion-worker.mjs).

```js
patchFusionWorker(source)
```

- Returns source with contract validation added.
- Accepts only the exact reviewed wrapper baseline; rejects ambiguous matches or repeated patching.
- Performs no file, network, deployment or credential operations.

The contract accepts only `{schemaVersion: 1, minimumNodes: positiveInteger, requiredNamePrefixes: nonEmptyUniqueStringArray}`. Prefixes match literal starts, case-sensitively. Modules do not infer private contracts or prove connectivity. See [publication protection](../README.md#自动发布前的完整性保护) for error placeholders and integration requirements.

A local ScriptOperator must contain the validation functions and private contract. Do not paste ESM `export` / relative `import` statements directly. This shows placement only; the integrator supplies both references:

```js
function operator(proxies) {
  validateFusionPublication({ proxies }, publicationContract);
  return proxies;
}
```

Place it after all processors and propagate validation exceptions. Save `ignoreFailedRemoteSub` as `disabled` for every participating individual subscription and collection, and persist the required download proxy. Test actual generation with a missing source, error placeholders and all sources healthy to verify blocking/acceptance. Valid generated syntax alone does not establish successful publication.

The Worker patcher imports `./scki-fusion-publication-guard.mjs`; provide the guard module under that name. Before requesting the Gist, the generated wrapper reads and validates strict contract `static:fusion:contract:v1` from `SUB_STORE_DATA`. Missing, unreadable or invalid strict contracts return 503; a recovery contract cannot bypass this. New Gist data must pass the strict contract before writing `static:fusion:clashmeta`.

Cache fallback separately reads optional `static:fusion:recovery-contract:v1`. If absent or unreadable, it uses the strict contract. An explicitly invalid recovery contract rejects the cache. Recovery contracts govern only whether a saved copy may be returned; they cannot admit an incomplete new Gist into KV. Different recovery criteria require separate acceptance against verified older data, without weakening strict new-publication standards. Processing original wrapper source, reviewing diffs, preparing contracts/modules and deployment remain the integrator's responsibility. Running the patcher does not deploy anything.

Validate from the repository root:

```bash
node --check SubStore/scripts/fusion-publication-guard.mjs
node --check SubStore/scripts/patch-fusion-worker.mjs
node --test tools/tests/fusion-publication-guard.test.js tools/tests/fusion-worker-patch.test.js
```

These helpers do not change routing artifacts or trigger all-client synchronization. See [SubStore CHANGELOG](../CHANGELOG.md).

<a id="独立网页管理入口"></a>

## Separate web-management entry point

[`web-management-route.mjs`](web-management-route.mjs) and [`patch-web-management-worker.mjs`](patch-web-management-worker.mjs) add a separate web-management alias to the reviewed extension-aware Worker wrapper. The deployer sets secret `SUB_STORE_WEB_BACKEND_PATH` to `/web-` followed by 64 random lowercase hexadecimal characters. A matching prefix selects a cloned environment only for that request's legacy routing. It does not change the old management secret, restricted extension entry point or original backend bindings.

This path grants full backend management access. Keep it separate from the extension's URL-only connection. The patcher imports adjacent `scki-web-management-route.mjs` and accepts only one reviewed matching line. It neither generates credentials nor deploys. Enabling the new management path requires the deployment owner's authorization.

The official frontend supports `https://sub-store.vercel.app/subs?api=<encodeURIComponent(fullBackendAddress)>`. That query is transmitted to the frontend site on the initial request. Alternatively, save the backend manually in frontend settings and then use bare `/subs`. Unsupported `#api` is not equivalent. See [official frontend source](https://github.com/sub-store-org/Sub-Store-Front-End/blob/8dc19320894a9dbb3569e8bf3e41057491e39b90/src/hooks/useHostAPI.ts#L211-L308). Never commit private management URLs, shortcuts or connection JSON to Git or extension packages.

```bash
node --test tools/tests/web-management-route.test.js
```

<a id="下载网关-530-恢复"></a>

## Download-gateway HTTP 530 recovery

[`download-gateway-fallback.mjs`](download-gateway-fallback.mjs) and [`patch-download-gateway-worker.mjs`](patch-download-gateway-worker.mjs) target the reviewed Worker download adapter. If the original gateway returns HTTP 530, GET/HEAD requests receive one direct Worker attempt to the same target, preserving original upstream headers and cancellation signal. Direct fetching uses `manual` redirects and rejects redirects or unsuccessful responses. Other gateway errors remain failures. Existing source previews, node validation and full publication contracts must still pass.

The patch changes no gateway URLs, tokens, source allowlists, Sub-Store configuration or write paths. It accepts only the exact adapter source baseline, outputs patched source referencing adjacent `scki-download-gateway-fallback.mjs`, and does not deploy. Prepare the deployment package using the returned module reference and validate actual source previews. Gateway errors and error-placeholder nodes are not successful downloads.

```bash
node --check SubStore/scripts/download-gateway-fallback.mjs
node --check SubStore/scripts/patch-download-gateway-worker.mjs
node --test tools/tests/download-gateway-fallback.test.js
```
