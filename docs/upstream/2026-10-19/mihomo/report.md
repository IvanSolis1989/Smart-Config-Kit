<a id="mihomo-生态官方版本与适配核对2026-10-19"></a>
# Official Mihomo ecosystem version and adaptation review (2026-10-19)

**English** | [简体中文](report.zh-CN.md)


This review identified and fixed two definite mismatches: Smart outputs still emitted removed `strategy: sticky-sessions`, and OpenClash documentation deployed a complete shell script as an ordinary INI override module. It also corrected instructions confusing MetaCubeX Alpha with Smart and naming the model field `lgbm-custom-url`. No evidence justified changing global DNS, TUN defaults, groups, or rule sources merely to follow releases.

Research baseline: repository `079b546`; rule authority `rulesets/source/routing-graph.js` v6.0.20. Originals were retrieved on 2026-10-19; exact times are in [manifest.json](manifest.json). Local commands followed powershell-local-guard. No clients were installed, user devices upgraded, or core binaries downloaded.

<a id="证据与版本口径"></a>
## Evidence and version interpretation

Fifty-seven official raw responses are stored at `bodies/<SHA256>.gz`, including complete GitHub release JSON (up to 30 recent releases per repository), official configuration-page HTML, pinned source, and core-version text. The manifest records uncompressed bytes, gzip bodies, URLs, retrieval times, HTTP status, and headers. This is an original-text cache, not the report treated as source. Independent readback: [57/57](cache-verification.txt).

```text
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --verify
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --read smart-group-source
```

Each `sources.json` ID corresponds to a manifest original. Release `prerelease` status is recorded separately from stable. Rolling-release creation/publication times may be years old and do not establish current build time. Dates below are UTC. “Latest” means official public-release/rolling-asset snapshots in this review, not every regional store or installed device.

| Product | Current stable at review | Prerelease/rolling channel | Source and key boundary |
|---|---|---|---|
| MetaCubeX/mihomo | [v1.19.32](https://github.com/MetaCubeX/mihomo/releases/tag/v1.19.32), 2026-09-30 17:09:36 | [Prerelease-Alpha](https://github.com/MetaCubeX/mihomo/releases/tag/Prerelease-Alpha), version `alpha-94b13ae`; latest asset update 2026-10-13 14:27:14 | `mihomo-releases` / `mihomo-alpha-version`; 2024-08-12 rolling publication is old release creation time |
| vernesong/mihomo Smart | No non-prerelease stable in official public list | [Prerelease-Alpha](https://github.com/vernesong/mihomo/releases/tag/Prerelease-Alpha), `alpha-smart-83e67d0`, assets updated 2026-10-14 00:28:36; [model](https://github.com/vernesong/mihomo/releases/tag/LightGBM-Model) updated 2026-08-26 11:41:19 | `smart-releases` / `smart-alpha-version`; neither Smart core nor model is MetaCubeX stable |
| Clash Party | [v2.0.4](https://github.com/mihomo-party-org/clash-party/releases/tag/v2.0.4), 2026-10-18 12:17:04 | [dev](https://github.com/mihomo-party-org/clash-party/releases/tag/dev) is an old 2.0.3 build, assets updated 2026-09-22, older than stable | `party-releases`; old `mihomo-party-org/mihomo-party` API redirects to `mihomo-party-org/clash-party` |
| CMFA | [v2.11.35](https://github.com/MetaCubeX/ClashMetaForAndroid/releases/tag/v2.11.35), 2026-09-30 16:59:35 | [Prerelease-alpha](https://github.com/MetaCubeX/ClashMetaForAndroid/releases/tag/Prerelease-alpha), 2026-10-11 05:29:38 | `cmfa-releases`; stable app gitlink is Mihomo `88dcbf7f1614a67c3b36b848ee3592dfa92ada36`, the same commit resolved for v1.19.32 |
| OpenClash | [v0.48.002](https://github.com/vernesong/OpenClash/releases/tag/v0.48.002), 2026-10-12 03:40:07 | Latest 30 include historical v0.47.071 prerelease (2026-03-13), not newer than stable | `openclash-releases`; plugin version is not selected `clash_meta` core version |
| FlClash | [v0.9.1](https://github.com/chen08209/FlClash/releases/tag/v0.9.1), 2026-10-17 10:24:48 | No prerelease among latest 30 public releases, not a claim about all history | `flclash-releases`; core gitlink is `chen08209/Clash.Meta` at `8380d0e7462f061a964323e9bf3129a236fcc5d5` |
| ClashMi | [v1.0.31.1703](https://github.com/KaringX/clashmi/releases/tag/v1.0.31.1703), 2026-10-09 04:51:17 | [v1.0.32.1800](https://github.com/KaringX/clashmi/releases/tag/v1.0.32.1800), 2026-10-19 05:26:29 | `clashmi-releases`; app version is not bundled Mihomo version; iOS store version not separately verified |
| ShellCrash (formerly ShellClash) | [1.9.4](https://github.com/juewuy/ShellCrash/releases/tag/1.9.4), 2026-02-15 11:33:00 | Public prerelease `clash.premium.latest` is a historical core archive, not a newer script candidate | `shellcrash-releases`; core repository/branch/build can be selected independently; script release does not establish core version |
| Clash Verge Rev | [v2.5.8](https://github.com/clash-verge-rev/clash-verge-rev/releases/tag/v2.5.8), 2026-10-09 02:43:45 | [autobuild](https://github.com/clash-verge-rev/clash-verge-rev/releases/tag/autobuild) text says 2.5.9; assets include `autobuild.1018.7965711`, updated 2026-10-17 22:39:44; latest numbered RC v2.5.4-rc.2 (2026-09-20) | `verge-releases-api`; `updater-alpha` is update metadata, not a new core/client |

<a id="逐项适配决定"></a>
## Per-product adoption decisions

<a id="metacubexmihomo"></a>
### MetaCubeX/mihomo

v1.19.32 adds inbound-user `hash-key` for load-balance, changes default IP stack to `mips`, and supports TUN `congestion-controller`, with TCP MSS, AnyTLS, OpenVPN, EasyTier, and other fixes. Alpha additionally includes DoH dialing constraints, preservation of fake-IP allocations on reload, submillisecond URL tests, and dialer-proxy cycle checks. These appear in rolling notes but cannot be advertised as v1.19.32 features. See [stable notes](https://github.com/MetaCubeX/mihomo/releases/tag/v1.19.32) and [Alpha notes](https://github.com/MetaCubeX/mihomo/releases/tag/Prerelease-Alpha).

Repository Normal Mihomo/CMFA uses `url-test` / `select` with no new load-balance requirement, so no `hash-key` was added. CMFA YAML lacks top-level `tun:`; Clash Party TUN is GUI-merged, and FlClash JS does not write it. A changed default stack does not justify forcing `mips` or GSO across devices. No device throughput/latency comparison supports a performance claim.

Complete originals are cached for [DNS](https://wiki.metacubex.one/config/dns/), [groups](https://wiki.metacubex.one/config/proxy-groups/), [rule providers](https://wiki.metacubex.one/config/rule-providers/), [proxy providers](https://wiki.metacubex.one/config/proxy-providers/), [rules](https://wiki.metacubex.one/config/rules/), [TUN](https://wiki.metacubex.one/config/inbound/tun/), and [sniffing](https://wiki.metacubex.one/config/sniff/) as `mihomo-dns/groups/rule-providers/proxy-providers/rules/tun/sniffer`. The DNS page is dated 2026-07-18; retrieval does not prove a later revision.

Field comparison: CMFA `dns.respect-rules: true` has nonempty `proxy-server-nameserver`. JS/Ruby private-node policies write only active-node domains and satisfy the policy’s nonempty resolver requirement. JS retains `fake-ip-filter-mode: blacklist` and cleans inherited entries. Group `use`, `include-all-proxies`, `filter`, `exclude-type` / `empty-fallback` were checked against `mihomo-stable-groupbase` without changing filter boundaries. MRS still carries only domain/ipcidr; classical residuals retain the generation chain.

<a id="vernesong-smart"></a>
### vernesong Smart

Version text and pinned [SmartOption](https://github.com/vernesong/mihomo/blob/83e67d0c4415b1114f9e01d8e9a00133caf89f6c/adapter/outboundgroup/smart.go#L89-L96) confirm `policy-priority`, `uselightgbm`, `collectdata`, `sample-rate`, `prefer-asn`, and `tolerance`, but no `strategy`. The [official guide](https://github.com/vernesong/OpenClash/releases/tag/mihomo) entry dated 2025-11-12 also explicitly removes it. That guide’s training-library information predates the 2026-08-26 model release, which states LightGBM v4.x support. No model was trained or changed here.

Removed legacy `sticky-sessions` from `upsertSmartGroup` in `Clash Party/ClashParty(mihomo-smart).js` and the Ruby constructor in `OpenClash/OpenClash(mihomo-smart).sh`. Retained `uselightgbm: true`, `collectdata: false`, and `tolerance: 30` without promising fixed sessions. JS became v6.0.20-dns.20 and OpenClash Smart v6.0.20-oc-smart.15. The source graph never had that field; base version v6.0.20 stayed unchanged.

The equivalent-pattern audit covered Clash Party Smart/Normal, CMFA, Stash, OpenClash Normal/Smart, FlClash, Shadowrocket, Surge, Loon, QX, Egern, SingBox, v2rayN, and Passwall/Passwall2. Only those two outputs build Smart groups; others use url-test/platform regex or static outbounds without this parameter. Ordinary load-balance `strategy` is a different valid field and was not globally removed.

<a id="clash-party"></a>
### Clash Party

2.0.4 adds simple mode, a DNS-protection switch, and closing only current-group connections; fixes wake-up TUN configuration, waiting for providers at startup, and mode synchronization. See [release notes](https://github.com/mihomo-party-org/clash-party/releases/tag/v2.0.4). These are app behaviors, not new routing-graph rules.

Pinned `party-factory` order is original-subscription DNS guard → ordinary overrides → rule overrides → Smart overrides → controlled-config merge. `disableDnsOverrideGuard` defaults false, but users can disable protection. `party-dns-guard` inspects three original DNS-policy fields; repository JS can still generate DNS after app DNS overriding is disabled. Decision: preserve existing boundary diagnostics; do not treat guard notices as JS failure or disable new protection by default. Read back actual `controlDns`, guard switch, and TUN routing from the app.

`party-core-prepare` separately downloads MetaCubeX stable, MetaCubeX Alpha, and vernesong Smart. App v2.0.4 does not make all three cores the same version. Documentation corrects repository renaming, Smart selection, and current `lgbm-url`. No complete 2.0.4 GUI import/wake test was performed.

<a id="cmfa"></a>
### CMFA

Visible stable-release changes are Android TV focus fixes and dependency updates; prerelease adds QR sharing of URL profiles. `cmfa-tree` and `.gitmodules` preserve the actual core gitlink rather than misreading the historical go.mod require, which is replaced by a submodule. See the [official repository](https://github.com/MetaCubeX/ClashMetaForAndroid).

Local `Clash Meta For Android/CMFA(mihomo).yaml` keeps fused MRS, existing DNS, and url-test regional groups without Smart/LightGBM or app-sharing fields. Android VPN still manages TUN; desktop stack defaults were not copied into YAML. Rule/DNS evidence is documentation and stable-core source, not Android-device import, peak-memory, or VPN-takeover testing.

<a id="openclash"></a>
### OpenClash

0.48.002 adds plugin/core SHA checks, Ruby loading optimizations, override-module security restrictions, TUN GSO/MIPS defaults, and built-in Google Play/Tailscale/WiFi Calling modules. See [release notes](https://github.com/vernesong/OpenClash/releases/tag/v0.48.002). New TUN defaults/extra rule modules were not adopted because they would change source semantics.

`openclash-overwrite-guide` requires INI section headers for ordinary modules; [YAML] merges and [Overwrite] `ruby_*` calls face new parser/AST limits. The repository’s two `.sh` files are complete Shell/Ruby scripts without those headers. Older README registration as ordinary modules therefore had a definite ignored-input path. `openclash-init` [lines 3849–3855](https://github.com/vernesong/OpenClash/blob/e553e82e01c697aefbe1555261a503f425e00ccd/luci-app-openclash/root/etc/init.d/openclash#L3849-L3855) still directly executes fixed `/etc/openclash/custom/openclash_custom_overwrite.sh` with the configuration path.

Decision: README now instructs backup, upload to the fixed entry, executable permissions, and plugin restart; incorrect ordinary-module UCI registration was removed. The existing temporary-Ruby-script execution need not be rewritten for the module allowlist. Smart cleanup and entry-point correction have separate evidence. Router OpenWrt/bash/Ruby, restart logs, and final configuration were not device-tested here.

<a id="flclash"></a>
### FlClash

0.9.0 per-key DNS/NTP overriding continues in 0.9.1. Version 0.9.1 overrides only selected desktop TUN keys, leaving unselected ones to the profile, and fixes large-config crashes, core-download CA, and system-proxy issues. See [0.9.1](https://github.com/chen08209/FlClash/releases/tag/v0.9.1) and [0.9.0](https://github.com/chen08209/FlClash/releases/tag/v0.9.0).

`flclash-setup` getProfile executes `handleEvaluate` first; `flclash-task` then merges TUN, DNS, NTP, and app patches. TUN combines source configuration, default dns-hijack, selected override keys, and runtime coreJson. DNS may still append system DNS after selected-key merging. User-selected override keys can therefore change script output; script success alone does not prove final equivalence.

Local `FlClash/FlClash(mihomo).js` leaves ports/TUN to the app and generates DNS/sniffer baselines. It adds no Smart fields or forced universal TUN stack. Reference headers record the actual chen08209 FlClash-branch gitlink, not generic latest MetaCubeX stable. Platform-specific 0.9.1 readback of final selected keys/DNS remains untested on devices in this review.

<a id="clashmi"></a>
### ClashMi

Stable updates Flutter/dependencies and fixes drag sorting; prerelease adds TrayManager integration and Android notification-permission prompts. These require no new routing fields. See [official releases](https://github.com/KaringX/clashmi/releases).

The cached [official FAQ](https://clashmi.app/guide/faq) says the core converts geosite/geoip to geo rulesets, iOS lacks IP-ASN databases, and the dashboard cannot update the core independently. Custom overrides layer onto the subscription before built-in overrides. TUN can be UI-overridden, or use subscription settings after disabling that override. “TUN is always exclusively app-managed” is too absolute; repository YAML without `tun:` relies on the app to provide VPN configuration.

Decision: reuse CMFA YAML/MRS. This repository has no GEOIP/GEOSITE/IP-ASN rules requiring a separate output for these core differences. Built-in DNS/TUN overrides, iOS’s 50 MB VPN-extension memory, and actual core version require device readback; releases/README alone do not establish them. FAQ has no readable revision date; only retrieved content is confirmed.

<a id="shellcrash"></a>
### ShellCrash

1.9.4 adds core-branch selection, a separate DNS interception port, ECS, and autostart detection, and rewrites startup/watchdog/traffic filtering. See [official release](https://github.com/juewuy/ShellCrash/releases/tag/1.9.4). `shellcrash-core-update` allows selecting core repository/branch/tag, so script versions do not identify bundled Mihomo, nor is historical `clash.premium.latest` a current recommended core.

`shellcrash-modify` rebuilds TUN/DNS and combines custom rules/override YAML; mix/route modes also write China providers/policies. Downloading CMFA YAML does not prove fields survive startup. Decision: reuse CMFA only as Mihomo input, then compare ShellCrash selection, override layers, and final `$TMPDIR/config.yaml` before claiming equivalent policy. No separate output was added, and OpenClash shell hooks are not assumed to be ShellCrash hooks. The singbox branch should use SingBox outputs. No actual script-channel/device-core runtime acceptance occurred here.

<a id="clash-verge-rev"></a>
### Clash Verge Rev

2.5.8 fixes identically named nodes across providers in selection/testing, saved versus effective ports, and DNS restoration after macOS TUN exit. Autobuild 2.5.9 remains prerelease, including reloads when importing a noncurrent subscription; this does not justify default device upgrades. See [stable](https://github.com/clash-verge-rev/clash-verge-rev/releases/tag/v2.5.8) and [autobuild](https://github.com/clash-verge-rev/clash-verge-rev/releases/tag/autobuild).

At the stable tag, `verge-core-prepare` lists only MetaCubeX stable/Alpha downloads, not vernesong Smart. README now defaults official distributions to Normal JS; switching to Alpha does not obtain Smart. `verge-dns-source` fingerprints original-profile DNS policies; `verge-enhance-source` protects GUI-managed TUN/DNS fields. Decision: retain normal `main(config)` and import through the [official script guide](https://www.clashverge.dev/guide/script.html), recognizing GUI merges. No current device import/core-version readback occurred; not every script key can be claimed to override GUI settings.

<a id="本次交付与验证"></a>
## Deliverables and validation

- Runtime changes were confined to invalid parameters/version metadata in two Smart outputs. Normal/FlClash, rule authority, generated assets, and service DNS were unchanged.
- Instructions corrected Smart-branch identification, model fields, and OpenClash deployment. Clash Party/OpenClash CHANGELOGs were synchronized. Four REFERENCE files only appended review scope/report links and retained historical date boundaries.
- [Smart JS validation](smart-validation.txt): `groups=55 rules=168 providers=149`. Independent original-cache decompression/hash/URL readback: [57/57](cache-verification.txt). This code/document group passed `git diff --check`.
- Complete cross-client validation is recorded in the overall report after integration by the coordinating thread. Official-schema and JS checks do not replace real Smart-core connections, GUI effective-config readback, OpenWrt restart, or mobile VPN acceptance.
