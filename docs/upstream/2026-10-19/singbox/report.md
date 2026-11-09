<a id="sing-box--xray-客户端组官方核验2026-10-19"></a>
# Official review of sing-box / Xray clients (2026-10-19)

**English** | [简体中文](report.zh-CN.md)


The original sing-box JSON had reproducible decoding failures. One generator now emits 1.14 Full and a 1.13-compatible variant, each passing its official core check. Passwall/Passwall2 fused `.srs` was also confirmed to require the sing-box backend: Xray does not load these references, and Passwall2 may create overbroad matches. The coordinating thread owns the installation-gate fix.

<a id="来源缓存与时效"></a>
## Sources, cache, and time scope

- Cutoff: the user-specified 2026-10-19. Only official sites, official GitHub release metadata, and source were used. Stability follows the `prerelease` flag, not version-number guesses.
- [sources.json](sources.json) lists 105 sources. [manifest.json](manifest.json) records retrieval times, effective URLs, pinned commits, HTTP headers, and SHA256. `bodies/` contains gzip of exact original bytes, not reconstructed summaries. Independent review added six pinned old/new sniff-action source files and 1.13.14 release-asset metadata.
- All 105 sources were obtained. Early 403/network failures remain in old `manifests/`; authenticated `gh` subsequently completed retrieval without reading or printing tokens.
- Versioned source uses 40-character commit URLs; the cache tool resolves floating source to a recorded commit. Without an explicit official page-publication date, only retrieval time is recorded, not an invented publication/update time.
- Readback: `node tools/cache-official-docs.js --group docs/upstream/2026-10-19/singbox --verify`. Read an original by replacing verification with `--read SOURCE_ID`.

<a id="版本与发布时间"></a>
## Versions and publication times

Times below are official API UTC. No prerelease in a recent list describes only that returned scope. App versions, standalone cores, and actual packaged cores are checked separately.

| Product | Latest stable / Latest | Latest marked prerelease | Official source / cache ID |
| --- | --- | --- | --- |
| sing-box | 1.14.3; 2026-10-09 05:35:00Z | 1.15.0-alpha.12; 2026-10-11 06:13:25Z | [Releases](https://github.com/SagerNet/sing-box/releases), `singbox-releases-api` |
| Xray-core | v26.3.27; 2026-03-27 17:51:11Z | v26.10.17; 2026-10-17 15:32:34Z | [Latest](https://github.com/XTLS/Xray-core/releases/latest), [prerelease](https://github.com/XTLS/Xray-core/releases/tag/v26.10.17), `xray-releases-api` |
| v2rayN | 7.25.6; 2026-10-11 05:59:58Z | 7.25.5; 2026-10-05 08:55:29Z, older than stable | [Releases](https://github.com/2dust/v2rayN/releases), `v2rayn-releases-api` |
| Passwall | 26.10.16-2; 2026-10-16 13:53:39Z | None in latest 30 | [Releases](https://github.com/Openwrt-Passwall/openwrt-passwall/releases), `passwall-releases-api` |
| Passwall2 | 26.10.1-2; 2026-10-02 07:37:18Z | 26.9.9-2; 2026-09-09 05:44:31Z, older than stable | [Releases](https://github.com/Openwrt-Passwall/openwrt-passwall2/releases), `passwall2-releases-api` |
| Hiddify app | v4.1.1; 2026-03-05 17:22:57Z | Published `draft` prerelease; 2026-10-04 22:55:29Z | [Releases](https://github.com/hiddify/hiddify-app/releases), `hiddify-app-releases-api` |
| hiddify-core | v5.0.3; 2026-10-18 14:30:46Z | None in latest 30 | [Releases](https://github.com/hiddify/hiddify-core/releases), `hiddify-core-releases-api` |
| HomeProxy | Official releases API empty: no named stable/prerelease. Source fadaa676104f59ff6ace480a780a258d846d0aec, committed 2026-10-02 07:58:18Z | Same limitation | [Official repository](https://github.com/immortalwrt/homeproxy), `homeproxy-releases-api` / `homeproxy-commit` |

No user app was installed or device core read. This is not a description of device state.

<a id="sing-box"></a>
## sing-box

<a id="官方边界与原错误"></a>
### Official boundaries and original errors

Pinned 1.14.3 commit: `7054cac5124465ffdb145870d7c01885566711b1`; 1.13.14: `25a600db24f7680ad9806ce5427bd0ab8afe1114`. Cached source includes `singbox-option-dns`, `singbox-option-inbound`, `singbox-option-rule-set`, and `singbox-113-rule-set`.

| Original field / old claim | Current official evidence | Local treatment |
| --- | --- | --- |
| Nonstandard top-level `_meta` | Actual 1.14.3 check reports unknown field | Metadata moved to generator constants, README, CHANGELOG |
| Legacy DNS `address` / `address_resolver` | [Typed HTTPS server](https://sing-box.sagernet.org/configuration/dns/server/https/) introduced in 1.12; 1.14 source explicitly removes old format | Both variants use `type: https`, `server`, `path`, `domain_resolver` |
| Inbound `sniff` / `sniff_override_destination` | [Migration](https://sing-box.sagernet.org/migration/#migrate-legacy-inbound-fields-to-rule-actions) and source show removal in 1.13 | Leading nonterminal `action: sniff`; service ordering retained |
| `http_client` migration preserves 1.11–1.13 compatibility | [Rule-set](https://sing-box.sagernet.org/configuration/rule-set/#http_client) says introduced in 1.14; actual 1.13 check reports unknown field | Old claim wrong; Full uses named HTTP client, 1.13 uses `download_detour` |
| Deprecated `download_detour` is invalid on old cores too | Same page says deprecated in 1.14, removal planned for 1.16 | Retain only in explicit 1.13 variant |
| Block outbound removed | Current [Block](https://sing-box.sagernet.org/configuration/outbound/block/) has no deprecation marker; minimal/final 1.14.3 checks succeed | Retain `REJECT` group-member function rather than copying old summary |
| DNS GeoIP acceptance filtering | [1.14 response-matching migration](https://sing-box.sagernet.org/migration/#migrate-address-filter-fields-to-response-matching) | Full uses evaluate → match_response → respond; 1.13 retains its valid form |

Original failures are in [baseline-1.14.3-check.txt](baseline-1.14.3-check.txt) and [baseline-1.13.14-check.txt](baseline-1.13.14-check.txt). [verification.json](verification.json) records layered isolation: removing `_meta` exposed old DNS; migrating DNS exposed old inbound fields; on 1.13, migrating both exposed `http_client`. No deprecated-compatibility environment variables were enabled.

<a id="采用推迟与本地字段"></a>
### Adoption, deferral, and local fields

- [Full](../../../../Sing-box内核系/SingBox/SingBox(sing-box)-full.json) targets at least 1.14.3: named top-level `http_clients`; all remote sets reference `rules-download`, still through `🌍 全球节点`. Explicit `route.default_domain_resolver` points to direct DNS, avoiding implicit resolver rules for placeholder node domains.
- [1.13-compatible JSON](../../../../Sing-box内核系/SingBox/SingBox(sing-box)-1.13.json) is checked with official 1.13.14. It has no 1.14-only HTTP-client/DNS-response fields and downloads through valid `download_detour`.
- The same [generator](../../../../Sing-box内核系/SingBox/SingBox(sing-box)-generator.js), version `v6.0.20-sing.10`, emits explicit schema branches. Original 97 service rules retain content/order; adding nonterminal leading sniff gives 98.
- Full evaluates original direct DNS results first, returns only China IPs through `match_response` / `respond`, otherwise continues existing ad checks and proxy fallback. The 1.13 variant retains old GeoIP acceptance filtering; both have identical DNS servers.
- Stable 1.14 `optimistic`, DNS `race` / `speculative` may change query volume, latency, and freshness. Without a demonstrated need or measurements, they remain disabled.
- New TUN stacks and `stack` deprecation in 1.15 come from prerelease/live documentation. Stable 1.14 retains `stack: mixed`; alpha requirements are not imposed on stable configuration.
- Short 1.14.3/alpha.12 release notes say fixes/improvements only. No specific new protocol is invented; field introduction follows pinned stable documentation/source.

<a id="嗅探迁移的行为边界"></a>
### Behavioral limits of sniff migration

Independent review confirmed that new RouteActionSniff in 1.14.3 `option/rule_action.go` permits only sniffer/timeout. Construction in `route/rule/rule_action.go` does not set old OverrideDestination; `route/route.go` rewrites destinations only when that internal value is true. The same applies to 1.13.14. New sniffing preserves SNI/HTTP Host for matching but IP-destination connections still dial the original IP. The old `sniff_override_destination=true` proxy-side re-resolution effect is not fully retained. Effects of stale/manipulated IPs require target-network testing.

`route-options.override_address` is a fixed address string parsed by ParseSocksaddrHostPort, not a template for the sniffed domain. `resolve` is not equivalent destination rewriting either. This revision uses supported sniffing without unknown fields or fabricated compatibility switches. This upstream migration limitation is documented in README/REFERENCE.

Evidence: [1.14.3 options](https://github.com/SagerNet/sing-box/blob/7054cac5124465ffdb145870d7c01885566711b1/option/rule_action.go), [action construction](https://github.com/SagerNet/sing-box/blob/7054cac5124465ffdb145870d7c01885566711b1/route/rule/rule_action.go), [routing](https://github.com/SagerNet/sing-box/blob/7054cac5124465ffdb145870d7c01885566711b1/route/route.go), and corresponding 1.13.14 commit `25a600db24f7680ad9806ce5427bd0ab8afe1114`. Cache IDs: `singbox-114/113-sniff-options/construction/routing`.

<a id="实际验证"></a>
### Actual validation

[verification.json](verification.json) records core versions, executable/output SHA, exit codes, and comparisons.

- Official 1.14.3 amd64 ZIP SHA256: `d8b86ef58936dba9230ec6a57ffa4243933f3c14ef4809828b6c553440ed1518`, matching official asset digest `singbox-stable-api`.
- Cached 1.13.14 ZIP SHA256: `f580782c6dd10f7691c66cea1d7c421813c5fbf7e305d1ee7ce0c3a40d196341`, matching `singbox-113-release-api`. The ZIP’s sole exe and tested exe independently matched SHA256.
- Full → official 1.14.3 check and compatibility variant → official 1.13.14 check both exited 0. Dedicated [schema tests](../../../../tools/tests/singbox-current-schema.test.js): 4 passed, 0 skipped.
- Original outbound topology is unchanged item by item. Original 97 service routes equal Full’s sequence after removing sniff.
- Both variants share outbounds, routes, 85 rule sets’ URL/tag/format/interval, eight DNS servers, and 54 selector/urltest groups. Only explicit schema and DNS-response expression differ.
- Checks prove parsing/construction, not node connectivity, remote downloads, TUN startup, or successful/failing DNS paths. No VPN was started and no device network changed.

<a id="xray-与-v2rayn"></a>
## Xray and v2rayN

[Xray stable v26.3.27](https://github.com/XTLS/Xray-core/releases/tag/v26.3.27) includes Hysteria2 inbound/transport, Finalmask, ECH behavior, and routing webhooks. These are core protocol/optional capabilities; this repository supplies a native routing array without a node/transport/webhook need, so no such fields were added. Latest v26.10.17 is marked prerelease and its notes establish no new repository routing capability; remote SRS support is not inferred.

[Official RuleObject](https://xtls.github.io/config/routing.html#ruleobject) uses `domain` / `ip` / `process` / `outboundTag`, not sing-box remote `.srs`. Local [v2rayN(xray).json](../../../../Xray内核系/v2rayN/v2rayN(xray).json) continues flattening fused source JSON into native fields without content/target changes.

[v2rayN 7.25.6](https://github.com/2dust/v2rayN/releases/tag/7.25.6) explicitly supports and restricts sing-box to 1.14, with app-side Mux, custom subscription HTTP headers, MASQUE, and Xray-format updates. Use its native custom-configuration path, not UI fields inside the routing array. Release notes reference Xray v26.10.10, which does not prove identical bundled cores across every platform/package. Cached `v2rayn-core-info` shows separate core download/start management.

This review ran no v2rayN UI import, Xray traffic, or large-native-list performance test. Stable/prerelease and format boundaries are in [REFERENCE-xray.md](../../../../Xray内核系/v2rayN/REFERENCE-xray.md).

<a id="passwall--passwall2"></a>
## Passwall / Passwall2

<a id="官方固定源码"></a>
### Official pinned source

Passwall 26.10.16-2: `d8ec3c81988d775ba16ade9059cd972d5d5b8bc0`; Passwall2 26.10.1-2: `5901e5fea7e19dfd4219cc72513957c266587680`. Each cache includes UI, sing-box/Xray generators, node-type forms, Makefile, app.sh, and init source.

| Path | Actual behavior | Effect on repository SRS |
| --- | --- | --- |
| UI shunt_rules.lua | Accepts rule-set:remote/local; description limits it to sing-box | UI saving does not establish Xray consumption |
| sing-box util_sing-box.lua | Generates route.rule_set for .srs/.json and references tags | Supported, subject to version, reachability, and device checks |
| Passwall util_xray.lua | Explicitly skips rule-set:/rs: in domain/IP lists; remaining network without protocols does not generate intended rule | Routing fails |
| Passwall2 util_xray.lua | Same skipping; after empty lists become nil, a branch still inserts rules without domain/IP conditions | With local network=tcp,udp, may match too broadly |

Official links: [Passwall sing-box](https://github.com/Openwrt-Passwall/openwrt-passwall/blob/26.10.16-2/luci-app-passwall/luasrc/passwall/util_sing-box.lua), [Passwall Xray](https://github.com/Openwrt-Passwall/openwrt-passwall/blob/26.10.16-2/luci-app-passwall/luasrc/passwall/util_xray.lua), [Passwall2 Xray](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/26.10.1-2/luci-app-passwall2/luasrc/passwall2/util_xray.lua). Independently read cache IDs `passwall-singbox` / `passwall-xray` / `passwall2-xray`.

<a id="核心约束与采用决策"></a>
### Core constraints and adoption

Actual shunt nodes are UCI nodes sections with `protocol='_shunt'` and `type='sing-box'` or `type='Xray'`. Both app.sh implementations read global `@global[0].node`; Passwall also has ACL-specific node entries. An installed binary or old tcp_node/udp_node setting is insufficient to establish the current backend.

Official Makefiles select packages without pinning one core version. New Passwall generators choose HTTP clients by actual core version; stable Passwall2 SRS paths can still use an implicit download client. LuCI release versions do not establish installed-core capability.

Local `tools/generate-fused-fallback-artifacts.js` and both apply.sh scripts write SRS references, not flattened Xray lists. Required adaptation is to check actual shunt nodes and reject Xray before any UCI write. The root cause was handed to the coordinating thread, which owns script/tests; this report does not claim OpenWrt device acceptance on its behalf.

Do not generate huge Xray shunt lists merely because upstream released a new version. Xray needs its native rule path or a separately specified, implemented, and validated conversion. Both REFERENCE files correct backend boundaries while labeling older summaries as not fully updated.

<a id="sfa--sfi--sfm-官方客户端"></a>
## Official SFA / SFI / SFM clients

Both official app-source repositories have empty releases APIs (`sfa-releases-api` / `apple-releases-api`); their READMEs point to SagerNet client documentation. Actual assets are centralized in the main sing-box release: `singbox-stable-api` includes `SFA-1.14.3-*.apk`, `SFM-1.14.3-*.pkg`, and jailbroken `SFI-1.14.3-iphoneos-*.deb`. These explicitly named GitHub assets match main 1.14.3, not necessarily all installed store versions.

[Official Android documentation](https://sing-box.sagernet.org/clients/android/) states Android 5.0+, with legacy-android-5 builds also in the main release. [Apple documentation](https://sing-box.sagernet.org/clients/apple/) states iOS 15+ / macOS 13+ / tvOS 17+ and lists App Store, TestFlight, jailbreak, and macOS standalone channels separately. SFA manages local/remote profiles; Apple clients also provide those entry points. Actual core version determines whether repository 1.14.3 fields are supported.

Retain native JSON and document both OS and core requirements. Regional store versions, internal TestFlight builds, and installed-device state were not queried; empty source-repository releases are not filled with invented standalone latest versions. Official pages/READMEs are cached as `sfa-client-doc` / `apple-client-doc` / `sfa-readme` / `apple-readme`. UI/TUN operation still needs device acceptance.

<a id="hiddify"></a>
## Hiddify

<a id="app与核心分别固定"></a>
### Pin app and core separately

App 4.1.1 source `abbd671bf6bf05195acd4158c714bff267cada8f` has `core.version=4.1.0` in `dependencies.properties`. Makefile downloads that version for prod and mutable draft for dev (`hiddify-app-dependencies` / `hiddify-app-makefile`). The old hiddify-next-core repository redirects; it is not another core product.

The app gitlink pins hiddify-core `c9d6f0f00b2eda34e4fb71863e4e0a62b3e931a0`, which pins fork `0a02b7729f6a211436bb8bdcd8696c283eb27767`. go.mod requests sing-box 1.13.0 with a local replace; fork rule-set options contain only download_detour. Provide the 1.13-derived schema, without treating the require line as an unmodified upstream binary version.

Standalone hiddify-core 5.0.3 pins `00a84b00faaed68146ce6a32bf968c5cf7089447` and fork gitlink `5e94a4e6acf7907755f3a8588ce619d2c29b3f06`. Source has new HTTP clients and 1.14 old-DNS-removal logic (`hiddify-new-rule-set` / `hiddify-new-dns`). Release notes lack detailed features; constant/version.go is compile-time-filled unknown. Do not invent an exact upstream version or claim app 4.1.1 has already upgraded.

App draft is a published prerelease whose dev core download is mutable. Platform artifacts were not inspected; dependencies alone do not prove packaged cores or justify replacing stable configuration.

<a id="完整配置导入限制"></a>
### Full-configuration import limits

Pinned stable parser.go preserves the full input only when complete-config conditions hold; otherwise it extracts outbounds/endpoints only. Successful parsing does not guarantee route/dns preservation. Actual app entry and overrides still require testing (`hiddify-core-parser` / `hiddify-core-builder`).

README therefore points to 1.13-compatible JSON and requires complete-mode/effective-config checks. Official 1.13.14 check is schema evidence, not Hiddify end-to-end success. Unsupported promises of automatically preserving every group, arbitrary TUN retention/removal, and automatic subscription population were withdrawn.

Official sources: [stable app](https://github.com/hiddify/hiddify-app/releases/tag/v4.1.1), [standalone core](https://github.com/hiddify/hiddify-core/releases/tag/v5.0.3), [app dependencies](https://github.com/hiddify/hiddify-app/blob/v4.1.1/dependencies.properties), [pinned parser](https://github.com/hiddify/hiddify-core/blob/c9d6f0f00b2eda34e4fb71863e4e0a62b3e931a0/v2/config/parser.go).

<a id="homeproxy"></a>
## HomeProxy

There is no official GitHub release. Its Makefile depends on +sing-box without pinning a core version. The separately cached ImmortalWrt packages recipe specifies 1.14.3 at this snapshot; that establishes recipe state, not every firmware branch/device’s upgrade state.

Pinned generate_client.uc builds configuration from UCI node/routing_node/routing_rule/dns_server/dns_rule. update_subscriptions.uc parses URI/SIP008 nodes; it does not establish preservation of complete route/dns from arbitrary Full JSON subscriptions. The old one-click/all-groups import promise was removed.

Adoption: identify HomeProxy as an ImmortalWrt-maintained LuCI plugin. Migrate via UCI and inspect final output; add no unverified converter. Managing standalone native sing-box JSON services/firewall is a different path. No OpenWrt UI, firewall, or transport acceptance was performed.

Official sources: [repository](https://github.com/immortalwrt/homeproxy), [client generator](https://github.com/immortalwrt/homeproxy/blob/fadaa676104f59ff6ace480a780a258d846d0aec/root/etc/homeproxy/scripts/generate_client.uc), [subscription parser](https://github.com/immortalwrt/homeproxy/blob/fadaa676104f59ff6ace480a780a258d846d0aec/root/etc/homeproxy/scripts/update_subscriptions.uc).

<a id="交付与缺口"></a>
## Deliverables and gaps

<a id="二次核验普通节点类型与测试接线"></a>
### Follow-up validation: ordinary node types and test wiring

Valid ordinary Passwall nodes need not store `protocol`: Socks-type source explicitly removes it and runtime generation fills it by type. Preflight therefore strictly reads `type` first; only sing-box/Xray nodes require checking whether `protocol` is `_shunt`. Confirmed ordinary types need no such field. Unknown types, read failures, no shunt node, or any Xray shunt reject before writes. Added pinned sources: `passwall-type-0-socks`, `passwall-type-3-ss-rust`, `passwall-type-4-ssr`, `passwall-type-5-hysteria2`, `passwall-type-6-naive`, `passwall2-type-3-ss-rust`, `passwall2-type-4-ssr`. References: [Passwall Socks](https://github.com/Openwrt-Passwall/openwrt-passwall/blob/d8ec3c81988d775ba16ade9059cd972d5d5b8bc0/luci-app-passwall/luasrc/model/cbi/passwall/client/type/0_socks.lua), [Passwall2 SS-Rust](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/5901e5fea7e19dfd4219cc72513957c266587680/luci-app-passwall2/luasrc/model/cbi/passwall2/client/type/3_ss-rust.lua).

Both JSON variants enter the automatic-refresh contract. CI validates official-document caches, downloads/verifies official SHA-256, and runs actual schema checks with 1.14.3 / 1.13.14. Explicitly invalid core paths must fail, not silently skip. Real shell tests cover valid ordinary nodes, mixed Xray shunts, and zero-write failures.

This work changed the SingBox generator, both JSONs, README, CHANGELOG, four REFERENCE files, dedicated schema regressions, and this evidence directory. It did not change rule authority, service targets, or fused contents, nor operate the Git index or commit/push. The coordinating thread owns shared validation and Passwall installation gates.

Completed: original-cache/hash readback, version/core-boundary review, layered reproduction, dual-schema fixes/official checks, and original outbound/route sequence comparisons. Device acceptance remains for real nodes, initial remote downloads, DNS success/failure paths, TUN, Hiddify/v2rayN effective configurations/connections, Passwall/PW2 traffic, and HomeProxy UCI conversion.
