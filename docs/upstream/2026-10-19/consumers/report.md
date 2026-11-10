<a id="karing-与-happ版本导入格式与适用边界"></a>
# Karing and Happ: versions, import formats, and scope

**English** | [简体中文](report.zh-CN.md)


Reviewed on 2026-10-19. These apps appeared among root-README client aliases and were therefore included. No independent rule authority was added for them, and complete client acceptance is not claimed. Fifteen originals, URLs, commits, timestamps, and hashes are recorded in [sources.json](sources.json) and [manifest.json](manifest.json).

| Product/channel | Verifiable version at review | Publication time UTC | Official evidence |
| --- | --- | --- | --- |
| Karing GitHub stable | v1.2.25.2802 | 2026-09-10 02:20:39 | [Stable release](https://github.com/KaringX/karing/releases/tag/v1.2.25.2802) |
| Karing iOS store | 1.2.25.2802 | 2026-09-11 07:32:05 | [Apple lookup](https://itunes.apple.com/lookup?id=6472431552&country=us) |
| Karing GitHub prerelease | v1.2.26.2908 | 2026-10-12 05:53:51 | [Prerelease](https://github.com/KaringX/karing/releases/tag/v1.2.26.2908) |
| Happ Desktop stable | 4.5.4 | 2026-10-14 13:09:51 | [Release](https://github.com/Happ-proxy/happ-desktop/releases/tag/4.5.4) |
| Happ Android stable | 4.7.1 | 2026-10-05 14:49:13 | [Release](https://github.com/Happ-proxy/happ-android/releases/tag/4.7.1) |
| Happ iOS US store | 6.1.0 | 2026-10-14 03:05:53 | [Apple lookup](https://itunes.apple.com/lookup?id=6504287215&country=us) |

Karing’s GitHub tag was pinned to `0c320dc182d095ec0d483f852169421e749c2bac`. Its pubspec still says `1.2.25+2801`; that single source field cannot replace release/store distribution versions. The conflicting originals remain cached. This review did not establish the stable app’s exact bundled-core revision and cannot infer compatibility with official sing-box 1.14.3.

<a id="karing"></a>
## Karing

The stable release fixes VLESS-related connection problems. Prereleases continue adjusting WireGuard endpoints, Tailscale/OpenVPN import, DNS detection, and Vision UDP443. Prerelease capabilities are not attributed to stable versions, nor used to upgrade a user’s app. See [official releases](https://github.com/KaringX/karing/releases).

The [official quickstart](https://karing.app/en/quickstart) explicitly supports Clash/sing-box configuration-link imports. This does not prove unchanged preservation of all custom DNS, groups, and routing. Repository static JSON contains example nodes; ordinary subscription imports or UI rebuilding may follow a different data flow. Pinned-tag README, pubspec, and configuration-management source are cached for follow-up; they do not establish actual import or final runtime configuration acceptance.

Adoption decision: retain the shared generator and both 1.13/1.14 schemas as research inputs; do not add unconfirmed Karing-specific fields. Before use, verify core version, complete custom-configuration entry, final 54 groups, and service routing. Equivalent generic-file import cannot yet be promised.

<a id="happ"></a>
## Happ

Desktop 4.5.4 addresses consistency between per-app proxying and TUN and fixes some subscriptions that appeared connected while actually bypassing VPN. Android 4.7.1 public notes describe experience fixes only; no specific routing feature is inferred. Official README confirms an Xray core and separate platform releases. See [Desktop releases](https://github.com/Happ-proxy/happ-desktop/releases) and [official README](https://github.com/Happ-proxy/happ-desktop).

[Official routing documentation](https://www.happ.su/main/dev-docs/routing) uses `happ://routing/add/...` / `onadd/...` to convey a Profile with fields such as Name, DirectSites, and ProxySites. This is not the repository’s v2rayN RuleObject array. Documentation also describes JSON-subscription Profile-binding limits, reconnection before changes take effect, and geofile update/switching. [JSON import notes](https://github.com/HappDev/happ_su/blob/main/dev-docs/examples-of-links-and-parameters.md) separately distinguish direct complete-JSON behavior.

Adoption decision: correct direct-reuse promises in root README and `v2rayN/README.md`. Existing `v2rayN/v2rayN(xray).json` remains for v2rayN routing settings; sharing Xray does not make that array a complete Happ configuration. No unverified Happ converter was added, and Xray routing content did not change. Actual Happ Profile/full-JSON import, per-app behavior, and traffic matching have not undergone device acceptance.
