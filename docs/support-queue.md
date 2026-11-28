# Client support queue

**English** | [中文](support-queue.zh-CN.md)

This page records shared adaptation and client validation separately: source support, core checks, app import and real connections are distinct evidence levels. These are recorded results, not a claim that every current app build is validated.

[Documentation](README.md) · [Client support](guide/client-support.md) · [Meow family](../Meow内核系/README.md)

| Target | Entry | Recorded stage |
| --- | --- | --- |
| [Official meow-rs core](#meow) | Native YAML / WebUI | Official v0.26.1 and v0.30.0 passed `-t` with local assets; production subscriptions, HTTP downloads and routing remain unverified |
| [Official meow-android / meow-ios](#meow-official-apps) | Native YAML | Import interfaces and key older-core capabilities checked in source; complete app import and connectivity remain unverified |
| [AEROVE Lite](#aerove-lite-meow) | JS override and dedicated MRS shards | Production validation chain connected; QuickJS atomicity and named HTTP proxy cases passed; beta18 rejected the old three-shard set; the new candidate still needs all-resource app and real-routing validation |

## <a id="meow"></a>Shared Meow / meow-rs adaptation

Review date: 2026-10-24. [Official Meow](../Meow内核系/Meow/README.md) uses [Meow(meow).yaml](../Meow内核系/Meow/Meow%28meow%29.yaml); [AEROVE Lite](../Meow内核系/Aerove%20Lite/README.md) uses [AeroveLite(meow).js](../Meow内核系/Aerove%20Lite/AeroveLite%28meow%29.js). Each has a guide, references and changelog; both share generators and policy baselines.

Completed: shared fused rules, 33 service groups, 22 native regional/residential groups, generic JS, native YAML, input/output hashes, failure atomicity, empty-pool rejection, automatic refresh and CI. Official v0.26.1 `-t` loaded 149 local rule assets, 168 rules, 55 groups and real Geo data without WARN/ERROR. Endpoints were synthetic; no proxy traffic was started. See the [source-language reference](../Meow内核系/Meow/REFERENCE-meow-rs.md).

Shared remaining checks:

1. Replace the subscription placeholder with a valid authorized source and test production HTTP downloads, provider download proxies and updates.
2. Test initial health checks, empty/all-failed pools, ad blocking, China direct routing, non-China and service exits. A syntax check is not a connection test.
3. Export and read back each app's final configuration, checking host-assembled DNS, VPN, ports, process metadata and resource paths.

## <a id="meow-official-apps"></a>Official Android / iOS

Meow Android GitHub v1.0.11 embeds meow-rs v0.29.0. App Store iOS/tvOS 2.0 embeds v0.21.2. The Android GitHub signing change and the iOS/tvOS tunnel's DNS field ownership are documented in the [Meow reference](../Meow内核系/Meow/REFERENCE-meow-rs.md).

Remaining: import native YAML into the target builds, load resources, refresh subscriptions and inspect the effective configuration. Check Android with the Built-in DNS switch in the intended state. Check iOS/tvOS with the source DNS policy, host listener and fake-IP pool. On Apple TV, also verify the iCloud profile transfer. Use native YAML in the official apps.

## <a id="aerove-lite-meow"></a>AEROVE Lite

The target is native Android 13+ Lite; the standard edition still uses Mihomo. See the [Lite guide](../Meow内核系/Aerove%20Lite/README.md). The actual Smart case in pinned beta18 `457fab8…`, [run 40420651068](https://github.com/IvanSolis1989/Aerove/actions/runs/40420651068), attempt 1, rejected the old ad part-001 at the 500,000 native dotted-label budget.

Recorded integration and individual checks:

- The production factory uses `forMeow`; source, resource preflight, prepared validation and real JNI checks are connected. Logical rules and provider proxy/header fields are admitted and passed to native downloads. Resource capacity increased from the early 128 to 256 while retaining the 256 MiB bundle budget.
- Actual Android execution passed QuickJS input preservation/failure atomicity, JNI named HTTP proxy and cancellation ownership, and four JNI file-rule parsing/corruption-rejection cases.
- Custom-header delivery, full logical/Geo/prepared conversion and the complete 256-resource path do not yet have a passing result in this recorded round. See [integration evidence](../Meow内核系/Aerove%20Lite/VALIDATION.md) for pinned source and execution references.

Local candidate checks:

- Original per-resource budgets are retained. Ads are split into four shards and China-site rules into two; the other 147 sources are reused, retaining position, target and provider metadata.
- The projection contains 153 rule resources, 172 main rules and 55 fixture groups, totaling 4,496,629 rule-resource bytes. All 111 projected MRS files passed the pinned Rust reader and unchanged app header/entry budgets. Both canonical and native-leaf unions have `missing=0 / added=0` for the two split sources.
- Shared fused assets, the authoritative graph and official Meow YAML bytes are unchanged. All 23 component tests passed without skips. Those checks do not execute the full app checked matcher, native preflight, JNI, APK, HTTP or VPN. See [splitting evidence and licensing boundaries](../Meow内核系/Aerove%20Lite/RESOURCE-SPLITTING.md).

Remaining production/device checks:

1. Consume the matching script, shards and hashes in AEROVE; update bundled content, URLs and the single provenance manifest, then rerun the real Smart case in the pinned target APK.
2. Download every resource, retain per-resource preflight, immutable storage and byte verification, and complete prepared validation. Count Geo, subscription and derived records within the final 256-resource / 256 MiB bundle budget.
3. Read back final YAML; verify named proxy/header downloads, trusted Geo context, rule order, updates and recovery. Then validate Android VPN, ads, China/non-China and service exits, distinguishing emulator and physical-device results.

The early 74 JVM tests, AndroidTest compilation and old 128-resource restriction remain in the [historical integration record](../Meow内核系/Aerove%20Lite/VALIDATION.md). Its latest section supersedes earlier integration claims but does not replace full candidate acceptance.

## AEROVE Full and FlClash RS

- AEROVE Full stable `v0.13.0+2026102340` ships an Android ARM64 APK and uses Mihomo. Its original build source pins the embedded Smart-Config-Kit script to `v6.0.21-flclash.26`. Check the effective profile after composing references to nodes, providers, rules, filters and DNS settings when validating a newer script. [Full release](https://github.com/IvanSolis1989/Aerove/releases/tag/v0.13.0%2B2026102340) · [Embedded script receipt](https://github.com/IvanSolis1989/Aerove/blob/0b938396afbda83efef427a0b401d0682a404c93/apps/aerove/assets/data/smart-config-kit-flclash.source.json).
- FlClash RS `v0.9.5-rs.2+1` is a separate prerelease using Concord at `4d58934`. Concord warns that `path-in-bundle` is ignored and can use an existing local rule file or its normal URL. Its Smart groups use per-site state and real-flow failures, and ignore LightGBM settings. A compatibility candidate would need pinned app tests for the effective YAML, MRS loads, routing and TUN scope. [RS prerelease](https://github.com/Vialibrex/FlClash/releases/tag/v0.9.5-rs.2%2B1) · [Core compatibility](https://github.com/Vialibrex/concord/blob/4d5893409d1aff1b7e068510190080052398dac1/docs/compatibility.md).

## Maintenance

```bash
node tools/generate-aerove-rule-assets.js
node tools/generate-meow.js
node tools/generate-aerove-rule-assets.js --check
node tools/generate-meow.js --check
node --test tools/tests/aerove-rule-assets.test.js tools/tests/aerove-rule-projection.test.js tools/tests/meow-generation.test.js tools/tests/meow-native-profile.test.js
```

Both outputs participate in upstream refresh and release-batch manifests. Automatic synchronization or core validation does not mark app-level pending checks as passed. Ruby is a build-time YAML dependency, not a client dependency.
