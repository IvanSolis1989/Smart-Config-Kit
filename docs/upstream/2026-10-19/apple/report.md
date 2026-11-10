<a id="苹果客户端官方能力复核2026-10-19"></a>
# Official Apple-client capability review (2026-10-19)

**English** | [简体中文](report.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

This review concerns current repository configurations. Versions reflect official release information readable during this review, not completed app import or traffic acceptance. Times use UTC; original API times/time zones remain in the cache.

<a id="已完成与证据位置"></a>
## Completed work and evidence locations

- Corrected Surge’s invalid DNS section and Quantumult X’s multi-DoH syntax. Rules, policy groups, and server order were unchanged.
- Updated freshness notices in six REFERENCE files and demonstrably incorrect protocol descriptions in Surge / Loon / Quantumult X / Shadowrocket READMEs.
- [sources.json](sources.json) lists 57 official sources. [manifest.json](manifest.json) records download status, actual URLs, times, content SHA-256, gzip SHA-256, and receipts: 56 succeeded and one optional source failed. Bodies are stored as `bodies/<content-sha256>.gz`; historical REFERENCE summaries and the previous manifest remain.
- Read decompressed text with `node tools/cache-official-docs.js --group docs/upstream/2026-10-19/apple --read <id>`. `--verify` independently checks the manifest and both hash layers. GitHub raw sources are pinned through receipts to actual commits.
- `help.shadowrocket.net` was inaccessible and current developer pages did not establish its ownership; optional/pending. Community manuals were not substituted for official text. The developer site currently linked from the App Store is [shadowlaunch.com](https://shadowlaunch.com/).

<a id="最新版本与地区"></a>
## Latest versions and regions

The six iOS apps were compared individually through [Apple US lookup](https://itunes.apple.com/lookup?id=1442620678,1596063349,1616105820,1373567447,1443988620,932747118&country=us) and [JP lookup](https://itunes.apple.com/lookup?id=1442620678,1596063349,1616105820,1373567447,1443988620,932747118&country=jp): versions/release times matched. [CN lookup](https://itunes.apple.com/lookup?id=1442620678,1596063349,1616105820,1373567447,1443988620,932747118&country=cn) returned `resultCount=0`. This establishes only that this query found no visible China-store entries, not availability in other regions or purchase status. Cache IDs: `apple-lookup-us/jp/cn`.

| Product/platform | Stable version | Official release UTC | Prerelease and notes |
|---|---|---|---|
| Surge iOS | 5.23.0 | 2026-10-12 23:54:04 | No publicly confirmable iOS TestFlight version/date metadata; pending |
| Surge Mac | 6.10.0 / 12500 | 2026-10-12 15:24:34 | Beta feed: 6.11.0 / 12560, 2026-10-16 16:34:32 |
| Stash iOS/tvOS | 3.6.4 | 2026-10-19 06:27:11 | Official TestFlight page did not identify a verifiable current build; pending |
| Stash Mac | 4.3.3 / 564 | 2026-10-14 03:48:16 | Same feed explicitly marks beta channel: 4.4.0 / 569, 2026-10-16 21:22:08 |
| Egern | 2.20.0 | 2026-07-23 17:04:21 | No confirmable official prerelease version/date metadata; pending |
| Loon | 3.5.2 | 2026-10-01 18:11:07 | Same; the store app runs on Apple Silicon Mac, without inventing a separate Mac version |
| Quantumult X | 1.8.1 | 2026-10-07 11:43:14 | No confirmable official prerelease version/date metadata; pending |
| Shadowrocket | 2.2.92 | 2026-09-07 04:14:10 | Same; community build numbers were not treated as official prereleases |

Latest-app system requirements (`minimumOsVersion` from Apple lookup): Surge iOS 17, Stash iOS 16, Egern iOS 16, Loon iOS 15, Quantumult X iOS 15, and Shadowrocket iOS 13. Mac-feed `minimumSystemVersion`: Surge macOS 12.0 and Stash macOS 12.4. These are current app requirements, not first-introduced versions of fields, and do not automatically raise the repository configuration baseline. README prerequisites were updated against current channel evidence.

Surge Mac sources are the [stable Sparkle feed](https://nssurge.com/mac/latest/appcast-signed.xml) and [beta feed](https://nssurge.com/mac/latest/appcast-signed-beta.xml), cached as `surge-mac-stable/beta`. The first beta title still says “Version 6.10.0”, while enclosure has `sparkle:shortVersionString=6.11.0`, build=12560. The report uses the actual enclosure version and retains the conflict without silently editing source text. The website release page is a JS container; its [official frontend](https://nssurge.com/static/js/main.367b5fb6.js) reads those feeds directly. Cached evidence is not merely an empty-container summary.

Stash Mac uses the [official update feed](https://releases.stash.ws/appcast.xml), cache `stash-mac-appcast`, distinguishing stable/beta by `sparkle:channel`. The iOS Wiki release page reaches only 3.4.0, Mac Wiki 4.2.0, and [previous-version downloads](https://stash.ws/macos/previous-versions) 4.2.1. None supersedes the actual update feed/Apple metadata. No client binary was downloaded.

<a id="surge-ios--mac"></a>
## Surge iOS / Mac

**Current adaptation:** `Surge/Surge.conf` uses 22 regional `url-test` groups, 33 service `select` groups, `include-all-proxies`, `policy-regex-filter`, and remote text `RULE-SET`. Native format is retained. [Official RULE-SET documentation](https://manual.nssurge.com/rules/ruleset.html) describes indexed optimization and remote caching; a new version alone does not justify claiming another format faster.

**Required correction implemented:** old `[DNS]` keys `fallback-dns-server` / `dns-direct-fallback-proxy` lacked official syntax support. [Profile Format](https://manual.nssurge.com/profile/format.html) enumerates recognized sections; unknown sections retain raw text without errors. [General](https://manual.nssurge.com/profile/general.html) lists configurable DNS keys. Therefore successful import did not establish that the old section worked. The section and misleading explanation were removed in **v6.0.20-Surge.11**, Build 2026-10-19.

[Official encrypted DNS documentation](https://manual.nssurge.com/dns/encrypted-dns.html) specifies concurrent first response. With encrypted DNS enabled, ordinary DNS serves connectivity tests and encrypted-server-domain bootstrap only. All four original DoH servers (223.5.5.5, 223.6.6.6, 8.8.8.8, 1.1.1.1), the ordinary DNS list, and `encrypted-dns-follow-outbound-mode=false` remain. Both old fallback DoH entries were already among the four; no duplicates were needed. No official equivalent exists for “proxy DNS only after direct failure.” Setting true routes encrypted DNS through rules globally and risks proxy-domain resolution loops; it is not an equivalent fix.

**New capabilities and decisions:** [category](https://manual.nssurge.com/policy-groups/parameters.html) and HTTPS testing require iOS 5.23.0+ / Mac 6.10.0+. Categories affect display only and may be deferred. Group-level `underlying-proxy` requires 5.22.0+ / 6.9.0+; there is no explicit chaining requirement here, so it remains disabled. [Surge smart](https://manual.nssurge.com/policy-groups/smart.html) requires iOS 5.11.0+ / Mac 5.7.0+ and uses real connection quality/site memory; saying “Surge has no Smart” is wrong. It is not Mihomo LightGBM either; changing regional selection algorithms needs separate behavior validation. Beta `block-quic=adaptive` and inbound Tailscale/WireGuard were not added to stable configurations.

**Protocol corrections:** [TUIC](https://manual.nssurge.com/policies/tuic.html) natively supports `tuic-v5`; that page gives no first-introduced version. [Hysteria 2](https://manual.nssurge.com/policies/hysteria2.html) requires iOS 5.8.0+ / Mac 5.4.0+; [AnyTLS v2](https://manual.nssurge.com/policies/anytls.html) requires iOS 5.17.0+ / Mac 6.4.3+. [Snell v6](https://manual.nssurge.com/policies/snell.html) requires iOS 5.20.0+ / Mac 6.7.0+, with the protocol still officially labeled beta. [External](https://manual.nssurge.com/policies/external.html) is Mac-only and REJECT on iOS. Node-protocol upgrades do not require changing repository rules.

**Validation gaps:** no Surge iOS/Mac device parsing or DNS fault injection; no upgraded throughput/memory measurements. Current official [url-test](https://manual.nssurge.com/policy-groups/url-test.html) says old group-level `url=` is ignored; the same-valued global `proxy-test-url` still supplies the test address. This is a future comment-cleanup candidate, not a measured fault. `timeout` filters candidate latency, not test-connection timeout; old descriptions must not conflate them.

<a id="stash"></a>
## Stash

**Current adaptation:** protected generation trims CMFA into `Stash/Stash.yaml`, using `url-test`, `lazy: true`, `interval: 300`, MRS/domain/ipcidr, and YAML/classical. [Stash-native rule-set documentation](https://stash.wiki/en/rules/rule-set) independently confirms MRS for domain/ipcidr only; this is not inferred from Mihomo. Large sets need not become inline; inline is explicitly iOS/tvOS 3.6+ / Mac 4.3+ and mainly for small custom rules.

**New capabilities and decisions:** [DNS documentation](https://stash.wiki/en/features/dns-server) now explicitly permits encrypted `default-nameserver` (IP addresses except `system`), independently direct `proxy-server-nameserver`, and `rule-set:` references in `nameserver-policy` / `fake-ip-filter` on iOS/tvOS 3.6+ / Mac 4.3+. Old claims that default servers must be plaintext IPs and proxy-server is unavailable are historical. Existing conservative configuration remains usable; no generator allowlist expansion or raised minimum occurred. Adoption requires coordinated minimum versions, source semantics, resolution-loop regressions, and app import checks.

[Policy-group documentation](https://stash.wiki/en/proxy-protocols/proxy-groups) defines `tolerance` in milliseconds as the switching delta. CMFA currently uses 10ms, with matching units, but Stash generation still removes the field. The official page gives no first-introduced version; publication dates are not minimum-version evidence. This remains a deferred optional optimization. Empty groups still use DIRECT; new documentation was not treated as support for Mihomo `empty-fallback`, `exclude-type`, or Smart LightGBM.

**Release changes:** [store version history](https://apps.apple.com/us/app/stash-rule-based-proxy/id1596063349) lists rule-set DNS references, MASQUE, XHTTP, and more REALITY combinations in 3.6.0, followed by VLESS Vision, cache, and memory improvements. Actual subscription nodes determine most applicability. Current protocols are on the [native protocol page](https://stash.wiki/en/proxy-protocols/proxy-types). Mac 4.4.0 beta gun/splithttp capabilities are not stable prerequisites. Publisher performance claims were not retested here.

**Validation gaps:** no Stash app import; earliest `tolerance` version pending. New DNS capabilities require actual proxy-domain bootstrap and rule-match tests.

<a id="egern"></a>
## Egern

**Current adaptation:** `Egern/Egern.yaml` uses `external` subscriptions, 22 regional `smart` groups, `flatten/filter`, service `select` groups, `dns.bootstrap/upstreams/proxy_nameservers/forward`, and repository-generated native YAML `rule_set`. These were checked against [Egern policy groups](https://egernapp.com/docs/configuration/policy_groups/), [DNS](https://egernapp.com/docs/configuration/dns/), and [rules](https://egernapp.com/docs/configuration/rules/). No official evidence justified directly replacing them with MRS.

**New capabilities and decisions:** 2.20.0 release metadata says all basic groups can attach `urls` and mix static/subscribed nodes; `external` remains compatible. New syntax did not justify duplicate subscriptions or restructuring groups. Smart already records actual connection failures; existing native smart benefits from client changes without mapping to Mihomo parameters. New local-listening-port rules, DNS `tcp://`, Snell v1–v5, SSH, SOCKS5-TLS, and more REALITY/gRPC are optional capabilities without new requirements in current configuration. Native smart priority coefficients follow Egern’s definitions.

**Validation gaps:** official rules do not expose the repository’s Clash-style PROCESS-NAME. Whole logical rules containing those conditions continue to be omitted; desktop support was not inferred from iOS capability. No app import or actual subscription expansion acceptance; native YAML assets were not migrated.

<a id="loon"></a>
## Loon

**Current adaptation:** `Loon/Loon.conf` uses [Remote Filter] NameRegex, 22 url-test groups, 33 select groups, native text [Remote Rule] lists, and [General] dns-server/doh-server/ip-mode. The [current official site](https://nsloon.app/docs/intro/) was confirmed through App Store descriptions/developer links, closing the gap previously served only by old GitHub summaries. [Policy groups](https://nsloon.app/docs/Policy/policygroup/) confirms interval in seconds and tolerance in milliseconds. [Remote rules](https://nsloon.app/docs/Rule/sub_rule/) require native Loon syntax, not direct repository MRS consumption.

**Release changes and decisions:** [store history](https://apps.apple.com/us/app/loon/id1373567447) records reworked UDP/QUIC, Hysteria2 port hopping/chaining, and more REALITY combinations in 3.5.0. New Rewrite/Script syntax in 3.5.1 retains compatibility; 3.5.2 fixes platform stability. Current configuration enables no new rewriting/scripts, so routing need not change. AnyTLS is explicitly supported from 3.3.9 (2026-03-31) and ShadowTLS from 3.2.6 (2025-02-03); README uncertainties were corrected.

**DNS and limits:** [DNS](https://nsloon.app/docs/DNS/) says encrypted failures fall back to ordinary DNS by default, with an app DNS-page opt-out. This differs from Surge. [General](https://nsloon.app/docs/General/) specifies `ip-mode` from 3.2.3(754), `hijack-dns` from 3.2.5(789); old “3.2.0+” wording is not a minimum-version basis. The page also lists include-tun and other Build1007+ options, but the relationship to current stable builds was unconfirmed, so they were not adopted. [Process rules](https://nsloon.app/docs/Rule/process_rule/) apply only on Mac; iOS/tvOS ignore whole logical rules containing process conditions.

**Validation gaps:** no app import. Actual clients must establish precedence among local/plugin/subscription rules; display order is not global match order. No reproduced case currently requires routing changes.

<a id="quantumult-x"></a>
## Quantumult X

**Current adaptation and correction:** official [sample.conf](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf) explicitly puts concurrent DoH URLs on one comma-separated line. Four lines were merged without changing the four URLs/order, in **v6.0.20-QX.11**, Build 2026-10-19. The sample cache is pinned to `af6fb594233ec4a3ec6d4ccb3601e9c36b75ea2d`, evidence ID `qx-sample-conf`. This establishes conformance with official syntax, not proof that duplicate keys previously behaved last-wins.

`[filter_remote]`, `url-latency-benchmark`, and `server-tag-regex` retain native QX structure. The official sample contains both an old comment limiting regex to three policy types and an example using url-latency-benchmark. Those conflict; following the concrete example is not real-device proof. No parser was added or rule format replaced.

**Protocols/releases:** [official version history](https://apps.apple.com/us/app/quantumult-x/id1443988620) records VLESS from 1.5.0, REALITY from 1.5.5 (2026-01-14), and AnyTLS from 1.6.0 (2026-05-21). REALITY does not prove XTLS-Vision; the latter remains pending. Minimum iOS 15 starts with 1.8.0; 1.8.1 adapts device UI. Current official `server-complete.snippet` was cached; uncertain protocol claims were not expanded from community lists.

**Validation gaps:** no QX app concurrent-DNS, import, match, or battery validation. No claim that all four servers were queried by an actual client. A new version is not throughput-benefit evidence.

<a id="shadowrocket"></a>
## Shadowrocket

**Current adaptation:** [Proxy Group], policy-regex-filter, URL-style RULE-SET, and dns-server/fallback-dns-server in `Shadowrocket/Shadowrocket.conf` remain. The current official developer homepage has no syntax text; earlier field conclusions drawn from community documentation are not promoted to newly official-confirmed findings.

**Release changes and decisions:** [official store history](https://apps.apple.com/us/app/shadowrocket/id932747118) for 2.2.92 mentions Sudoku, independent DNS for direct domains, TCP/DNSCrypt, Tailscale subnet/exit nodes, group ping sorting, remote-rule refresh, and memory-allocation fixes. They demonstrate client capability changes but provide no required new-key syntax/minimum thresholds for this repository; no fields were guessed or added. Obsolete README comparisons with Surge/QX were corrected using those clients’ official documentation.

**Validation gaps:** Shadowrocket help text and official ownership remain pending; no real-device import, rule-set updates, or OOM measurements. Static contracts cannot close this evidence gap.

<a id="采用决策与检查"></a>
## Adoption decisions and checks

| Item | Status in this review | Prerequisites |
|---|---|---|
| Invalid Surge DNS section | Removed; servers/order/outbound values retained | Device DNS offline/failure tests |
| QX multi-DoH | Corrected to official single-line form | Device concurrent-query tests |
| Confirmed protocol-description errors | Related README / REFERENCE updated | Documentation corrections need no routing changes |
| Stash tolerance 10ms | Deferred; generator unchanged | Minimum-version evidence or explicit new baseline, maintainer authorization, import/switching tests |
| Stash new DNS/inline | Deferred | iOS3.6+/Mac4.3+ thresholds, generator design, semantic regressions |
| Surge Smart/category/new chaining | Optional, disabled | User need, version thresholds, behavior acceptance |
| Surge/Stash beta features | Recorded only | Stable-release evidence or explicit prerelease-adoption authorization |
| Egern unified URLs syntax | Compatible external retained | No necessary migration or duplicate downloads |
| New Shadowrocket DNS options | Pending | Official field text and version evidence |

Official-cache manifests/hashes were read back after saving. Local comparisons of the two configuration changes established only authorized fields/metadata changed, with rule and policy sections identical. The coordinating thread runs repository-wide contract regressions once to avoid repeated full checks of identical stable input. Real Apple-client acceptance remains incomplete.
