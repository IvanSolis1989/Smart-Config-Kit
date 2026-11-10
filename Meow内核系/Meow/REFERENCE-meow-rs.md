<a id="meow-官方核心与客户端适配依据"></a>
# Official Meow core and client adaptation evidence

**English** | [简体中文](REFERENCE-meow-rs.zh-CN.md)


> Reviewed on 2026-10-28: this change moved only GoogleFCM from downloads/updates to Google services. The [official meow-rs README](https://github.com/meow-rs/meow-rs) was rechecked. Existing Clash-style routing projection was retained without expanding app/core compatibility or device-acceptance claims. DNS, fake-IP, sniffing, other push services, and node groups were unchanged; no fields, minimum versions, or device-pass claims were added.

> Updated on 2026-10-24: replaced the AEROVE-only candidate with general native YAML and optional JS. Core checks, app-interface source, and app runtime acceptance are recorded separately.

<a id="官方入口和版本"></a>
## Official entry points and versions

The Apps section of the [official core](https://github.com/meow-rs/meow-rs) lists [meow-android](https://github.com/meow-rs/meow-android) and [meow-ios](https://github.com/meow-rs/meow-ios). The official desktop core provides WebUI `/ui`, REST, and CLI; no separate desktop GUI in the same organization was found. The common base input is [Clash-style YAML](https://meow-rs.github.io/meow-rs/guide/guide/configuration).

| Component | Reviewed version | Input and pinned source |
| --- | --- | --- |
| Official core | v0.26.1, 727ddcd06f592e2f12c5222c4de6cce328df808c | Native YAML, `meow -f config.yaml -t` |
| Official Android | Stable v1.0.8, app 0ea329a5655f2c4370862d2ec585f0ef4b353207; core v0.20.2 | [URL/addLocal/nativeValidateConfig](https://github.com/meow-rs/meow-android/blob/4740012bf0efdb8bae8fbeeefaf4937dfa309f26/core/src/main/java/io/github/madeye/meow/repo/ProfileRepository.kt), [stable core dependency](https://github.com/meow-rs/meow-android/blob/v1.0.8/core/src/main/rust/meow-android-ffi/Cargo.toml) |
| Official iOS | Stable v2.0.0, app fe288b1eea60fb9a2da18a0749cce1ca0bd538f7; core a663364469b3b7dc2b46d2e0f4530e50a54108ee | [URL/local YAML](https://github.com/meow-rs/meow-ios/blob/a32df0ba845d706659cb531aa9250e769011f651/App/Sources/Services/SubscriptionService.swift), [stable core dependency](https://github.com/meow-rs/meow-ios/blob/v2.0.0/core/rust/meow-ios-ffi/Cargo.toml) |

No AEROVE-style `main(config)` JS override entry was found in official apps during this review. JS applies only to clients with a matching host. See the [separate AEROVE integration page](../Aerove%20Lite/REFERENCE-AEROVE-Lite.md).

Official display names are [Meow](https://github.com/meow-rs/meow-android/blob/4740012bf0efdb8bae8fbeeefaf4937dfa309f26/mobile/src/main/res/values/strings.xml#L13) on Android and [meow](https://github.com/meow-rs/meow-ios/blob/a32df0ba845d706659cb531aa9250e769011f651/App/Info.plist#L7) on iOS. Both use this repository’s Meow client directory.

<a id="字段与语义"></a>
## Fields and semantics

- [Providers](https://meow-rs.github.io/meow-rs/guide/guide/providers): domain/ipcidr/classical, yaml/text/mrs, and HTTP `provider.proxy`. Provider health-check values are defaults for the manual interface; consuming groups perform periodic tests.
- [Rules](https://meow-rs.github.io/meow-rs/guide/guide/rules): first match, RULE-SET, MATCH, no-resolve, and AND/OR/NOT.
- [Groups](https://meow-rs.github.io/meow-rs/guide/guide/proxy-groups): select/url-test/fallback/load-balance/relay. Pinned v0.26.1 [proxy_parser.rs](https://github.com/meow-rs/meow-rs/blob/727ddcd06f592e2f12c5222c4de6cce328df808c/crates/meow-config/src/proxy_parser.rs), lines 3097–3104: filter/exclude-filter/exclude-type filter only providers; static proxies bypass them. Regions use use+filter, preserving the static REJECT sentinel. Empty/all-failed pools and the period before initial checks may reject traffic.
- Rust [regex](https://docs.rs/regex/latest/regex/) has no JS lookarounds/backreferences. Native filtering uses CMFA’s lookaround-free expressions and was parsed by the actual core. Differences between the static “other” group and JS unclassified group are recorded separately.
- [DNS](https://meow-rs.github.io/meow-rs/guide/guide/dns) and [geodata](https://meow-rs.github.io/meow-rs/guide/guide/geodata): pinned raw.rs is authoritative. v0.26.1 RawDns lacks nested ipv6; RawFallbackFilter lacks geosite. Top-level ipv6 is retained; Mihomo extensions such as respect-rules/direct-nameserver/profile are omitted. geosite.dat has an actual protobuf parser.
- App composition differs: [iOS EffectiveConfigWriter](https://github.com/meow-rs/meow-ios/blob/a32df0ba845d706659cb531aa9250e769011f651/MeowShared/Sources/MeowModels/EffectiveConfigWriter.swift), lines 71–79, removes source dns/subscriptions before injecting host DNS. Current Android Rust lib.rs also handles listeners, sniffing, controller, and fake-IP. Core validation does not prove apps preserve these settings unchanged.

Key older-core capabilities were also checked: raw.rs/rule_provider.rs/meow-rules/parser.rs in Android v0.20.2 and pinned iOS a663364… actually consume provider.proxy, MRS, logical rules, and geodata. See [Android provider](https://github.com/meow-rs/meow-rs/blob/v0.20.2/crates/meow-config/src/rule_provider.rs#L146), [iOS provider](https://github.com/meow-rs/meow-rs/blob/a663364469b3b7dc2b46d2e0f4530e50a54108ee/crates/meow-config/src/rule_provider.rs#L146), and [Android logical parser](https://github.com/meow-rs/meow-rs/blob/v0.20.2/crates/meow-rules/src/parser.rs#L81). Version differences alone do not justify assuming missing features or requiring upgrades; source support is not complete app acceptance.

<a id="实际核心验证"></a>
## Actual core validation

The [official v0.26.1 Windows x86_64 archive](https://github.com/meow-rs/meow-rs/releases/tag/v0.26.1) was downloaded and verified against its official .sha256:

```text
c212a27184973bd1eb1c8c713d919da0eaa2daaf2695afb7b73ca61705ea97a9
```

An actual `meow -d <isolated-directory> -f <absolute-config-path> -t` run returned `Configuration test passed`. Synthetic nodes replaced the subscription; 149 providers mapped to real repository MRS/residual assets in isolation, with real Country.mmdb/geosite.dat. All 168 rules and 55 groups parsed without WARN/ERROR. No proxy traffic was started; file providers did not establish production HTTP download outbounds.

The reproducible actual-core case is in tools/tests/meow-generation.test.js. CI pins the archive, verifies SHA, and executes it. Full import, resource updates, effective configuration, VPN, and real routing for official Android/iOS and AEROVE Lite remain tracked in the [support queue](../../docs/support-queue.md#meow).
