[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../docs/assets/readme/page-family-meow-mobile.svg">
  <img src="../docs/assets/readme/page-family-meow.svg" alt="Meow client configurations" width="100%">
</picture>

# Meow family

Choose the configuration and import guide for your client. Official Meow and AEROVE Lite share routing sources, but maintain separate client integration and acceptance checks.

[Project home](../README.md) · [Downloads](../docs/guide/downloads.md#meow) · [Support queue](../docs/support-queue.md#meow)

## Official Meow

The official Android application is named **Meow**; iOS displays **meow**. Both applications and the official meow-rs core use native YAML.

[Native YAML](Meow/Meow%28meow%29.yaml) · [Import guide](Meow/README.md) · [Official adaptation evidence](Meow/REFERENCE-meow-rs.md) · [Changelog](Meow/CHANGELOG.md)

Official core configuration checks have passed. Full import and actual connections in the Android/iOS applications remain in their [separate application queues](../docs/support-queue.md#meow-official-apps).

## AEROVE Lite

Uses a `main(config)` JavaScript override host. Import a subscription with expanded endpoint definitions first, then associate the script.

[Override script](Aerove%20Lite/AeroveLite%28meow%29.js) · [Import guide](Aerove%20Lite/README.md) · [Host interface evidence](Aerove%20Lite/REFERENCE-AEROVE-Lite.md) · [Changelog](Aerove%20Lite/CHANGELOG.md)

Dedicated MRS partitions fit Lite’s per-resource budgets while preserving shared rules and precedence. Earlier real QuickJS failure-atomicity and named HTTP-proxy cases passed. The pinned beta18 rejects the old partitions; the new candidate passes the pinned Rust reader and the application's unchanged header/entry budget checks. Full application-level revalidation of all resources and actual routing remain outstanding. See the [partitioning evidence](Aerove%20Lite/RESOURCE-SPLITTING.md) and [integration record](Aerove%20Lite/VALIDATION.md).

## Shared maintenance

The two client directories are peers. Run `node tools/generate-aerove-rule-assets.js` to refresh dedicated derived assets, then `node tools/generate-meow.js` to generate configurations. The [adapter manifest](adapter-manifest.json) records inputs, outputs, and client entries. `rulesets/source/routing-graph.js` remains the policy authority.

Passing official core checks does not establish that either application passed import or real routing. Official applications and AEROVE Lite have separate records in the [support queue](../docs/support-queue.md#meow).
