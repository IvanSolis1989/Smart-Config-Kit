# Client support queue

**English** | [中文](support-queue.zh-CN.md)

This page records shared adaptation and client validation separately: source support, core checks, app import and real connections are distinct evidence levels. These are recorded results, not a claim that every current app build is validated.

[Documentation](README.md) · [Client support](guide/client-support.md) · [Meow family](../Meow内核系/README.md)

| Target | Entry | Recorded stage |
| --- | --- | --- |
| [Official meow-rs core](#meow) | Native YAML / WebUI | Real v0.26.1 `-t` passed; production subscriptions, HTTP downloads and routing remain unverified |
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

meow-android stable v1.0.8 pins core v0.20.2; meow-ios stable v2.0.0 pins core `a663364469b3b7dc2b46d2e0f4530e50a54108ee`. Both have actual source consumers for MRS, provider.proxy, AND/OR/NOT and geodata. A different version number alone does not establish a missing capability.

Remaining: import native YAML into the target APK/IPA, load resources, refresh subscriptions, read back the final configuration and test connections. Android manages listeners/DNS/VPN; iOS rewrites source DNS/subscriptions, so host behavior must be checked. This review did not find an AEROVE-style JS host in the official apps; do not instruct users to import JS into them.

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

## Maintenance

```bash
node tools/generate-aerove-rule-assets.js
node tools/generate-meow.js
node tools/generate-aerove-rule-assets.js --check
node tools/generate-meow.js --check
node --test tools/tests/aerove-rule-assets.test.js tools/tests/aerove-rule-projection.test.js tools/tests/meow-generation.test.js tools/tests/meow-native-profile.test.js
```

Both outputs participate in upstream refresh and release-batch manifests. Automatic synchronization or core validation does not mark app-level pending checks as passed. Ruby is a build-time YAML dependency, not a client dependency.
