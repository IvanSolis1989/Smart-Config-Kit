<a id="meow-官方核心与客户端适配依据"></a>
# Official Meow core and client adaptation evidence

**English** | [简体中文](REFERENCE-meow-rs.zh-CN.md)


> Reviewed on 2026-11-28: verified Android v1.0.11, the iOS/tvOS v2.0.0 tunnel configuration path, and the upstream v0.30.0 release. The generated YAML still targets the existing compatibility baseline.

> Reviewed on 2026-10-28: this change moved only GoogleFCM from downloads/updates to Google services. The [official meow-rs README](https://github.com/meow-rs/meow-rs) was rechecked. Existing Clash-style routing projection was retained without expanding app/core compatibility or device-acceptance claims. DNS, fake-IP, sniffing, other push services, and node groups were unchanged; no fields, minimum versions, or device-pass claims were added.

> Updated on 2026-10-24: replaced the AEROVE-only candidate with general native YAML and optional JS. Core checks, app-interface source, and app runtime acceptance are recorded separately.

<a id="官方入口和版本"></a>
## Official entry points and versions

The Apps section of the [official core](https://github.com/meow-rs/meow-rs) lists [meow-android](https://github.com/meow-rs/meow-android) and [meow-ios](https://github.com/meow-rs/meow-ios). The official desktop core provides WebUI `/ui`, REST, and CLI; no separate desktop GUI in the same organization was found. The common base input is [Clash-style YAML](https://meow-rs.github.io/meow-rs/guide/guide/configuration).

| Component | Reviewed version | Input and pinned source |
| --- | --- | --- |
| Official core | v0.26.1 compatibility baseline; v0.30.0 diagnostic target | Native YAML, `meow -f config.yaml -t`. [Baseline release](https://github.com/meow-rs/meow-rs/releases/tag/v0.26.1) · [Current release](https://github.com/meow-rs/meow-rs/releases/tag/v0.30.0). |
| Official Android | GitHub v1.0.11, app `dc4fc20a7778bfbd69f78f5d6f0a7089e8d0a292`; core v0.29.0 | [Release and signing change](https://github.com/meow-rs/meow-android/releases/tag/v1.0.11) · [Local import and validation](https://github.com/meow-rs/meow-android/blob/dc4fc20a7778bfbd69f78f5d6f0a7089e8d0a292/core/src/main/java/io/github/madeye/meow/repo/ProfileRepository.kt) · [Core dependency](https://github.com/meow-rs/meow-android/blob/v1.0.11/core/src/main/rust/meow-android-ffi/Cargo.toml). |
| Official iOS / tvOS | App Store 2.0, GitHub v2.0.0, app `fe288b1eea60fb9a2da18a0749cce1ca0bd538f7`; core v0.21.2 at `a663364469b3b7dc2b46d2e0f4530e50a54108ee` | [App Store channel](https://apps.apple.com/us/app/meow-smart-vpn/id6778303404) · [URL/local YAML](https://github.com/meow-rs/meow-ios/blob/fe288b1eea60fb9a2da18a0749cce1ca0bd538f7/App/Sources/Services/SubscriptionService.swift) · [Core dependency](https://github.com/meow-rs/meow-ios/blob/fe288b1eea60fb9a2da18a0749cce1ca0bd538f7/core/rust/meow-ios-ffi/Cargo.toml). |

No AEROVE-style `main(config)` JS override entry was found in official apps during this review. JS applies only to clients with a matching host. See the [separate AEROVE integration page](../Aerove%20Lite/REFERENCE-AEROVE-Lite.md).

Official display names are [Meow](https://github.com/meow-rs/meow-android/blob/4740012bf0efdb8bae8fbeeefaf4937dfa309f26/mobile/src/main/res/values/strings.xml#L13) on Android and [meow](https://github.com/meow-rs/meow-ios/blob/a32df0ba845d706659cb531aa9250e769011f651/App/Info.plist#L7) on iOS. Both use this repository’s Meow client directory.

<a id="字段与语义"></a>
## Fields and semantics

- [Providers](https://meow-rs.github.io/meow-rs/guide/guide/providers): domain/ipcidr/classical, yaml/text/mrs, and HTTP `provider.proxy`. Provider health-check values are defaults for the manual interface; consuming groups perform periodic tests.
- [Rules](https://meow-rs.github.io/meow-rs/guide/guide/rules): first match, RULE-SET, MATCH, no-resolve, and AND/OR/NOT.
- [Groups](https://meow-rs.github.io/meow-rs/guide/guide/proxy-groups): select/url-test/fallback/load-balance/relay. Pinned v0.26.1 [proxy_parser.rs](https://github.com/meow-rs/meow-rs/blob/727ddcd06f592e2f12c5222c4de6cce328df808c/crates/meow-config/src/proxy_parser.rs), lines 3097–3104: filter/exclude-filter/exclude-type filter only providers; static proxies bypass them. Regions use use+filter, preserving the static REJECT sentinel. Empty/all-failed pools and the period before initial checks may reject traffic.
- Rust [regex](https://docs.rs/regex/latest/regex/) has no JS lookarounds/backreferences. Native filtering uses CMFA’s lookaround-free expressions and was parsed by the actual core. Differences between the static “other” group and JS unclassified group are recorded separately.
- [DNS](https://meow-rs.github.io/meow-rs/guide/guide/dns) and [geodata](https://meow-rs.github.io/meow-rs/guide/guide/geodata): pinned raw.rs is authoritative. v0.26.1 RawDns lacks nested ipv6; RawFallbackFilter lacks geosite. Top-level ipv6 is retained; Mihomo extensions such as respect-rules/direct-nameserver/profile are omitted. geosite.dat has an actual protobuf parser.
- iOS/tvOS v2.0.0 calls Rust `meow_patch_config` in its PacketTunnel path. It starts from the profile's DNS mapping, retains the upstream choices, fallback, fake-IP filters and nameserver policy where supported, and pins the listener, fake-IP mode, persistence and `28.0.0.0/8` pool. It relocates references to the old local DNS listener, filters `dhcp://` entries and appends built-in resolvers to the primary nameserver list. [PacketTunnel call](https://github.com/meow-rs/meow-ios/blob/fe288b1eea60fb9a2da18a0749cce1ca0bd538f7/PacketTunnel/Sources/MWTunnelEngine.m#L374-L409) · [Rust DNS composition](https://github.com/meow-rs/meow-ios/blob/fe288b1eea60fb9a2da18a0749cce1ca0bd538f7/core/rust/meow-ios-ffi/src/lib.rs#L1042-L1103).
- The Android v1.0.11 host can apply profile upstreams or use its Built-in DNS switch. Check this setting with the effective profile. GitHub v1.0.11 uses a different signing key from GitHub v1.0.8; back up profiles before changing channels or reinstalling. The [US Play listing](https://play.google.com/store/apps/details?gl=us&hl=en&id=io.github.madeye.meow) exposes earlier release notes; check the installed build before assuming v1.0.11 behavior. [Android release](https://github.com/meow-rs/meow-android/releases/tag/v1.0.11).
- Core v0.30.0 adds an IPv6 fake-IP pool, node-host DNS policy, conditional `SUB-RULE`, and WireGuard in eligible builds. Its newer routing can prioritize a live fake-IP mapping over conflicting sniffed names. Shared YAML continues to use the older baseline because platform apps embed different core builds. [Release changes](https://github.com/meow-rs/meow-rs/releases/tag/v0.30.0) · [Node DNS policy](https://github.com/meow-rs/meow-rs/blob/8e4e948464656380f46f3a98cb168fc35d7708db/docs/specs/proxy-server-dns-policy.md).

The earlier Android GitHub v1.0.8 and current iOS v2.0.0 embedded-core sources were also checked: raw.rs/rule_provider.rs/meow-rules/parser.rs in Android v0.20.2 and pinned iOS a663364… actually consume provider.proxy, MRS, logical rules, and geodata. See [Android provider](https://github.com/meow-rs/meow-rs/blob/v0.20.2/crates/meow-config/src/rule_provider.rs#L146), [iOS provider](https://github.com/meow-rs/meow-rs/blob/a663364469b3b7dc2b46d2e0f4530e50a54108ee/crates/meow-config/src/rule_provider.rs#L146), and [Android logical parser](https://github.com/meow-rs/meow-rs/blob/v0.20.2/crates/meow-rules/src/parser.rs#L81). Version differences alone do not justify assuming missing features or requiring upgrades; source support is not complete app acceptance.

<a id="实际核心验证"></a>
## Actual core validation

The [official v0.26.1 Windows x86_64 archive](https://github.com/meow-rs/meow-rs/releases/tag/v0.26.1) was downloaded and verified against its official .sha256:

```text
c212a27184973bd1eb1c8c713d919da0eaa2daaf2695afb7b73ca61705ea97a9
```

An actual `meow -d <isolated-directory> -f <absolute-config-path> -t` run returned `Configuration test passed`. Synthetic nodes replaced the subscription; 149 providers mapped to real repository MRS/residual assets in isolation, with real Country.mmdb/geosite.dat. All 168 rules and 55 groups parsed without WARN/ERROR. No proxy traffic was started; file providers did not establish production HTTP download outbounds.

On 2026-11-28, both official Windows x86_64 releases, v0.26.1 and v0.30.0, passed the same actual-core case in `tools/tests/meow-generation.test.js`. The native YAML loaded 149 providers, 168 rules and 56 groups. The Lite JS projection loaded 153 providers, 172 rules and 56 groups. Both runs used the same frozen local assets and Geo data, synthetic nodes and `-t`. CI retains v0.26.1 as the gate and checks the fixed v0.30.0 release in a non-blocking diagnostic. The Windows v0.30.0 archive SHA-256 is `c65d769bc27fabf8977a5fe901e5e4daa83dd2fce3cf6e27ac7271877eb46181`.

Full import, resource updates, effective configuration, VPN, and real routing for official Android/iOS and AEROVE Lite remain tracked in the [support queue](../../docs/support-queue.md#meow).
