[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-sing-box-mobile.svg">
  <img src="../../docs/assets/readme/page-sing-box.svg" alt="SingBox import guide" width="100%">
</picture>

# SingBox Full import guide

<a id="singbox-full-配置"></a>

Complete same-source sing-box configuration with 20 regional groups, 33 service groups and one node selector. Verify core version, replace example nodes, then import.

[![Downloads](../../docs/assets/readme/nav-downloads.svg)](../../docs/guide/downloads.md) [![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [![Verification](../../docs/assets/readme/nav-verify.svg)](#verification)

[Preparation](#before-start) · [Import](#import) · [Hiddify](#hiddify) · [v2rayN](#v2rayn) · [HomeProxy](#homeproxy) · [Troubleshooting](#faq) · [Advanced](#advanced)

> Version: `v6.0.24-sing.15` · Build: 2026-11-28 · Routing baseline: `rulesets/source/routing-graph.js` v6.0.24. See [CHANGELOG](CHANGELOG.md).

Private names keep their direct DNS route. The primary advertising rule rejects matches before the ordinary DNS lookup, with the same early service exceptions used by routing.

<a id="before-start"></a>
<a id="-规则下载链接"></a>

[Optional service profiles and local parameters](../../docs/configuration.md): the complete profile remains the default. Optional projections use separate directories; see the shared guide for runtime parameter support.

## Preparation: choose a file

| Environment | Configuration | Core requirement |
| --- | --- | --- |
| Current stable / v2rayN custom sing-box configuration | [Full JSON](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json) | sing-box **1.14.x from 1.14.3** |
| Clients whose actual sing-box core is 1.13 | [1.13-compatible JSON](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-1.13.json) | Official sing-box **1.13.14** passed checks |

[![Download Full JSON](../../docs/assets/readme/button-sing-box-full.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json)
[![Download 1.13 JSON](../../docs/assets/readme/button-sing-box-113.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-1.13.json)

Buttons open raw files. Copy their links or save locally. Full and 1.13-compatible URLs, respectively:

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-1.13.json
```

Rule updates require GitHub Raw access directly or through a working proxy. See [rule downloads](../../docs/rule-asset-delivery.md).

### Online selection and local import

Open the [configuration page](https://ivansolis1989.github.io/Smart-Config-Kit/). Select **sing-box 1.14** (Full JSON targets 1.14.x from 1.14.3) or **sing-box 1.13** according to the actual core, then Full / Lite / Custom and latency-test/QUIC parameters. Download JSON, replace example nodes, validate it, and load through the client's supported complete custom-configuration entry. See the Hiddify/HomeProxy sections for preservation and acceptance boundaries.

To update, refresh, reselect version/profile/parameters and download. Back up configuration and node settings, replace the matching local configuration, then verify node references and the loaded result. Do not overwrite customized files using the official full-configuration URL. Selection and generation are browser-local and do not read or upload subscriptions or personal configuration.

<a id="import"></a>
<a id="选择配置与接入节点"></a>

## Import steps

1. **Verify version.** Check the actual sing-box core version inside the client and save the matching file above. Check application and core versions separately.
2. **Replace nodes.** Edit JSON `outbounds`, replacing `trojan` examples such as `proxy-hk-1` and `proxy-us-1` with real nodes. Tags must match regional-group references. When adding or renaming nodes, update the corresponding group's `outbounds`. Example nodes cannot connect.
3. **Validate configuration.** Use a matching native core:

   ```sh
   sing-box check -c configuration.json
   ```

4. **Load the complete configuration.** Use an entry point explicitly supporting complete custom configurations. Hiddify, v2rayN and HomeProxy differ as below; normal subscription conversion may extract nodes only.
5. **Select exits and enable.** Confirm real regional members and intended service exits, then connect. When the client manages TUN, adjust inbounds according to its full-configuration mode and inspect the final configuration.

Nodes are not automatically assigned to regional groups by name. After subscription conversion, still verify tags and references.

<a id="verification"></a>

## Import verification

- Final configuration retains **54 selector/urltest groups and 85 remote rule-sets**. Both variants share outbound topology, 98 routing rules (including one nonterminal sniff action) and rule-set URLs.
- Logs show successful rule-set downloads and real nodes connect. Service rules follow source order; the final fallback is `🐟 漏网之鱼`.
- Check effective `route`, `dns`, `rule_set`, group references and TUN settings, then follow the [runtime checklist](../../docs/guide/dns-and-verification.md#verification) with real traffic.

The repository checks both JSON variants and their rule URLs against the official core. GUI import and real connections require separate checks. [Versions and evidence](REFERENCE-sing-box.md#compatibility-review-2026-11-28)

## Hiddify

[Hiddify 5.9.15](https://github.com/hiddify/hiddify-app/releases/tag/v5.9.15) can read sing-box syntax, but its ordinary profile builder replaces this repository's routes and selector groups in both the 1.14 and 1.13 variants. The released Windows Core reproduced this with full-config enabled.

To retain the source routing, use an official sing-box client with complete JSON support. The documented standalone Hiddify Core `srun` mode loads raw sing-box JSON. If you use a raw configuration path, confirm that it preserves `route`, `dns`, the rule download path and group references before connecting. [Builder verification](REFERENCE-sing-box.md#hiddify-profile-builder) · [Hiddify Core modes](https://hiddify.com/core/#run-run-or-srun)

## v2rayN

Load the matching JSON through a **custom configuration server** and check the actual sing-box version. v2rayN 7.25.6 declares support limited to sing-box 1.14; 1.15 alpha is outside that release's supported range. [Official release notes](https://github.com/2dust/v2rayN/releases/tag/7.25.6)

For the Xray core, use this repository's [v2rayN Xray routing](../../Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/README.md). Native Xray routing cannot directly consume sing-box `.srs`.

## HomeProxy

[HomeProxy](https://github.com/immortalwrt/homeproxy) generates its configuration from subscriptions and UCI. Check the sing-box version installed on the router, then configure nodes, DNS, routing and rule-sets in LuCI. Inspect the generated file with the installed core's `sing-box check` and verify startup and rule downloads. The ImmortalWrt feed supplies the core separately, and its stable branches and master may use different versions. [Feed and compatibility evidence](REFERENCE-sing-box.md#homeproxy-package-and-uci)

Passwall / Passwall2 support sing-box and Xray backends. Use controlled scripts in their respective directories; this repository's fused `.srs` path requires the actual shunt backend to be sing-box.

<a id="faq"></a>

## Troubleshooting

**Why are only nodes left after import?** The import may rebuild the input as a subscription. Use a raw or native configuration entry that preserves routes, DNS and group references. For Karing, use the [native routing adapter guide](../Karing/README.md).

**Does a secondary DNS server automatically fail over?** `dns_direct2` / `dns_proxy2` are reserved servers. Their existence does not imply automatic core failover; see below.

**Rule downloads fail?** Confirm real nodes and the rule-download exit work, then consult [rule downloads](../../docs/rule-asset-delivery.md). Keep download errors and final configuration for diagnosis.

<a id="advanced"></a>

## Advanced reference

<details>
<summary>DNS, rule downloads and sniffing</summary>

### DNS, rule downloads and sniffing

Both configurations use typed DNS servers: `type: https`, `server`, `path` and `domain_resolver`. IP-bootstrapped DoH retains certificate SNI. China-domain resolution uses `DIRECT`; proxy resolution uses `🚀 节点选择`. Reserved `dns_direct2` / `dns_proxy2` do not imply automatic failover.

Full uses 1.14 named `http_clients` for rule-set downloads and handles CN IP results explicitly with `evaluate` / `match_response` / `respond`. The 1.13-compatible file uses that stable series' `download_detour` and DNS GeoIP acceptance filtering. Both send rule downloads through `🌍 全球节点`.

TUN uses `172.19.0.1/30`, `auto_route`, `strict_route` and `stack: mixed`. Both supplied files target their 1.14 and 1.13 series. Evaluate the [TUN stack migration](https://sing-box.sagernet.org/migration/#migrate-tun-stack) separately for official 1.15 preview builds. Sniffing uses nonterminal `action: sniff`. Check the effective inbounds where the client manages TUN.

Sniffing assists SNI/Host matches but cannot restore the old `sniff_override_destination=true` dynamic destination rewriting: IP destinations still dial the original IP. `route-options.override_address` supports fixed addresses only. See [migration boundary](../../docs/upstream/2026-10-19/singbox/report.md#嗅探迁移的行为边界).

Official references: [DNS HTTPS server](https://sing-box.sagernet.org/configuration/dns/server/https/), [rule-set](https://sing-box.sagernet.org/configuration/rule-set/), [migration](https://sing-box.sagernet.org/migration/).

</details>

<details>
<summary>Other clients and verification boundaries</summary>

### Other clients and verification boundaries

The [official 1.14.6 release](https://github.com/SagerNet/sing-box/releases/tag/v1.14.6) provides Android APKs, macOS installers, jailbreak iOS packages and Windows/Linux desktop clients. On Apple platforms the current App Store app is **sing-box MT**. Export existing profiles before moving from the old app or upgrading a macOS standalone install to the new developer account. On Linux, the desktop package is now `sfl` and installs separately from the CLI. App Store, Play Store and F-Droid versions follow their own channels. [Android](https://sing-box.sagernet.org/clients/android/) · [Apple](https://sing-box.sagernet.org/clients/apple/) · [Desktop](https://sing-box.sagernet.org/clients/desktop/) · [macOS migration](https://sing-box.sagernet.org/migration/#migrate-the-macos-standalone-client-data)

Complete configurations must still match actual core version and import conditions. Karing, NekoBox and other applications' conversion, overrides and UI behavior were not verified in this review. Using sing-box does not prove unchanged full-JSON import works.

</details>

<details>
<summary>Maintenance and generation</summary>

### Maintenance and generation

```bash
node "Sing-box内核系/SingBox/SingBox(sing-box)-generator.js"
node --test tools/tests/singbox-current-schema.test.js
```

Do not hand-edit either generated JSON. Rules flow from `rulesets/source/routing-graph.js` through the fusion pipeline into the generator. See root [AGENTS.md (Chinese source)](../../AGENTS.md) for the maintenance contract.

See [Claude Desktop dependencies](../../docs/claude-service-dependencies.md) and [WeChat exact-domain troubleshooting](../../docs/research/2026-10-16-wechat-issue-187.md).

</details>

<sub>💖 [Support the project](../../docs/donate.md) · ⭐ [Star](https://github.com/IvanSolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/IvanSolis1989/Smart-Config-Kit/issues)</sub>
