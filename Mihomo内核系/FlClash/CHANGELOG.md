<!-- Full English translation of the historical record. -->

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="FlClash changelog" width="100%">
</picture>

<a id="flclash--变更日志"></a>

# FlClash — Changelog

> FlClash override `FlClash(mihomo).js`, using standard Mihomo url-test regional groups.
> Routing authority: `rulesets/source/routing-graph.js`. FlClash consumes final fused rule sets; regional groups align with Clash Party Normal.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Back to README](../../README.md) · [Documentation center](../../docs/README.md)

## v6.0.21-flclash.26 (2026-10-31)

- Followed Clash Party with Windows browser UDP protection, off by default: trusted local `browserUdpPolicy=reject` rejects any Chrome / Edge / Firefox UDP. Available through online/offline forms and CLI, with selection preserved across updates.
- Default rules and DNS remained unchanged; not applicable to Android. Requires TUN and working process identification; HTTP/3 and UDP calls may be affected. This does not claim to disable all WebRTC. See [Issue #193 guidance](../../docs/guide/webrtc-privacy.md).

<a id="文档新旧界面导入指南-2026-10-31"></a>

## Documentation: old and new interface import guides (2026-10-31)

- Addressed [Issue #194](https://github.com/IvanSolis1989/Smart-Config-Kit/issues/194): documented v0.9.0 / v0.9.1 Extend → Script alongside the legacy Override entry point, adding new screenshots while retaining old steps/screenshots.
- Updated script-header import comments and official source references; clarified separate Script-mode selection and association per profile. Lite / Custom continued using local scripts to avoid URL updates overwriting customization.
- Documentation only: runtime code, client version, rules, groups and DNS unchanged. Offline configuration embedded the new comments; Meow manifests refreshed input hashes only. Other clients were unaffected; no rule regeneration was required.

<a id="配置工具-v142-2026-10-29"></a>

## Configuration tool v1.4.2 (2026-10-29)

- Added Full / Lite / Custom English names to service-profile options. Defaults, generation and client scripts remained unchanged.

<a id="配置工具-v141-2026-10-29"></a>

## Configuration tool v1.4.1 (2026-10-29)

- The form displayed latency, QUIC, ZeroTier and node-DNS options/summaries as Chinese labels with original English values. Text only; scripts, values and safety boundaries were unchanged.

<a id="配置工具-v140-2026-10-29"></a>

## Configuration tool v1.4.0 (2026-10-29)

- Added GitHub Pages configuration. Generation/download remained local without reading/uploading subscriptions; offline HTML remained available. Default client configurations and routing source were unchanged.

<a id="配置工具-v130-2026-10-29"></a>

## Configuration tool v1.3.0 (2026-10-29)

- Offline form supported 20 maintained entry points, selecting profiles/parameters according to client capabilities and downloading configuration. Default client configuration and routing source were unchanged.

<a id="离线配置表单-v121-2026-10-29"></a>

## Offline configuration form v1.2.1 (2026-10-29)

- Multiplier input also checked native `validity.badInput`; invalid incomplete exponents no longer became null through empty-string conversion. Both JS and local-parameter JSON downloads were rejected.
- A genuinely blank field still disabled multiplier filtering; correcting input restored download. Profile/parameter merging, source scripts and defaults were preserved.

<a id="离线配置表单-v120-2026-10-29"></a>

## Offline configuration form v1.2.0 (2026-10-29)

- Combined Full/Lite/Custom with latency, QUIC, node DNS, multiplier and ZeroTier downloads without CLI. Both tabs shared selection; advanced JSON export retained separate schemas.
- Reused shared definitions and trusted constant slots, allowing only existing typed allowlisted values. No network access or execution of user/embedded source. Default downloads, source scripts, shared assets and runtime rejection boundaries were preserved.
- The official default script remained `v6.0.21-flclash.25`; the tool used an independent version. Documented the different scope of cross-client profiles and direct FlClash downloads.

<a id="离线配置表单-v110-2026-10-29"></a>

## Offline configuration form v1.1.0 (2026-10-29)

- Full / Lite / Custom could directly download FlClash JS without CLI, Node.js or Ruby; other clients retained JSON + CLI entry points.
- Embedded build-validated trusted source and shared projection templates without networking, running scripts or reading personal configuration. Full preserved release content; Lite/Custom matched equivalent CLI profiles. Downloads used LF.
- Direct download used service selection only. Latency, QUIC, DNS, multiplier and application-managed boundaries retained defaults; local parameters were not implicitly merged.
- Official `v6.0.21-flclash.25` and shared assets were unchanged; independent form versions recorded tool changes.

## v6.0.21-flclash.25 (2026-10-29)

- Synchronized explicit hosts-only runtime through the same restricted module as both Clash Party scripts. Default adaptive mode, node identity, rules and application-UI ownership remained unchanged.
- Added real QuickJS full-configuration and bridge-reference identity gates. See the [configuration guide](../../docs/configuration.md) for unified parameters and optional service projections.

## v6.0.21-flclash.24 (2026-10-28)

- Moved Google FCM from downloads to Google services. The 15 domains, 26 IPv4 predicates, rule order and 55 groups were unchanged, as were other push services, DNS and fake-IP.

## v6.0.20-flclash.23 (2026-10-24)

- Organized client directories by core family, retaining files/guides within client subdirectories. Rule semantics/fields were unchanged. Raw configuration URLs changed with paths, requiring reimport; shared `rulesets/` URLs remained unchanged.

## v6.0.20-flclash.22 (2026-10-20)

- Business DNS policy became a projection of unified source data. Group structure, node selection and rule payloads were unchanged.

<a id="2026-10-19--官方文档与版本核对"></a>

## 2026-10-19 — Official documentation and version review

- Cached official releases, configuration documentation and applicable source, updating REFERENCE freshness/capability boundaries. See the [review](../../docs/upstream/2026-10-19/mihomo/report.md). This documentation review changed no rules, groups or generated payloads.

## v6.0.20-flclash.21 (2026-10-16)

- Issue #187: added exact DIRECT exceptions in existing `scki-adfp-direct` for `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, `hkshort.weixin.qq.com`, preventing WeChat connection endpoints from matching ads first.
- No parent/subdomain expansion; `ad.weixin.qq.com` and `log.weixin.qq.com` remained rejected. Other policies and ordering were unchanged.
- See [WeChat review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence and bounded static acceptance. Reporter-device recovery still required retesting.

## v6.0.19-flclash.20 (2026-10-16)

- Synchronized Smart/Normal fake-ip inheritance fix: merge valid entries only for absent or `blacklist` mode. Check original mode first; discard original `whitelist`, `rule` and invalid-mode lists while retaining fixed repository exceptions.
- Existing CI JS contracts covered mode normalization, unknown/non-string modes, invalid-entry filtering, baseline retention, deduplication and rerun stability. No new Mihomo fields or minimum-version changes.
- Shared latency-option synchronizer preserved complete CRLF after marked blocks, eliminating false Windows byte-comparison drift. Regressions covered LF/CRLF, EOF and regeneration stability without weakening checks.
- Updated reference: latest FlClash [v0.9.0](https://github.com/chen08209/FlClash/releases/tag/v0.9.0) changed per-key DNS/other override UI. Only JS configuration output was validated; no new-interface or device-import acceptance was performed.

## v6.0.19-flclash.19 (2026-10-15)

- FIX#186: unified repository-owned remote assets on GitHub raw HTTPS to avoid jsDelivr repository-size limits, preserving version queries and native formats.
- Reused verified fused payloads; content, ordering and policies were unchanged. Added raw/CDN-reference regressions. See [delivery guidance](../../docs/rule-asset-delivery.md) for cause, download prerequisites and official fields.

## v6.0.18-flclash.18 (2026-10-14)

- Fixed cross-service first-match misclassification: narrowed broad Apple/Microsoft keywords and shared AWS/Azure/CDN suffixes, adding eight guard classes: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social, bytedance-app. Six ADFP records for exact CA revocation/status hosts via DIRECT and exact Microsoft international-mail policy brought the total to 35. `api.byteoversea.com` was an exact TikTok rule, not a shared-suffix expansion. Existing Claude Desktop `a-api`/`a-cdn` exceptions, QUIC/latency options and default-off ZeroTier proxy remained. Crisp relay was a static ASN-overlap risk inference, not a measured incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 nonempty SRS across 81 segments.

## v6.0.17-flclash.17 (2026-10-14)

- Shared-JS synchronization and local deployment preserved an explicitly chosen device-local ZeroTier boolean. Repository release value stayed false; invalid/duplicate constants were rejected. Local parameters controlled latency/QUIC retention.
- Official latest remained v0.8.99. No new mobile execution syntax, default graph fields or regional algorithms. Other static clients did not consume the JS constant; see [local-option scope and checks](../../docs/zerotier-planet-proxy.md).

## v6.0.17-flclash.16 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to `scki-adfp-ai` for Claude Desktop application-code/user-content loading through AI policy. Based on [official requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Existing rule sets/native syntax remained. Source-semantic gates, 29 ADFP checks, Claude stage inventory and file-level release-batch checks joined the publication chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device reproduction or measurement occurred.

## v6.0.16-flclash.16 (2026-10-12)

- Following v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional ADFP validation. Conversion format, order and target policies remained; no runtime rules were added. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording only observable bytes and conversion receipts. Original remote-input SHA values cannot be reconstructed from old outputs; no claim of complete historical provenance or real-device traffic measurement was made.

## v6.0.15-flclash.16 (2026-10-12)

- Synchronized trusted local, default-off UDP/9993 proxying for four ZeroTier roots, prewrite target validation and idempotent insertion. Subscriptions/system environment could not enable it. Mobile defaults remained; see [per-client scope](../../docs/zerotier-planet-proxy.md).
- Reviewed official v0.8.99 script entry point and updated references. Local boolean constants and existing ordinary-function syntax preserved the v0.8.85 minimum script requirement.

## v6.0.15-flclash.15 (2026-10-07)

- Default `standard` remained 300 seconds with `lazy: true`; `power-save` remained 900 seconds with `lazy: true`. QUIC defaults were unchanged.

## v6.0.15-flclash.14 (2026-10-07)

- JS override added runtime health-check and international UDP/443 selection; power-save adjusted testable groups.
- See [latency and QUIC options](../../docs/traffic-options.md) for switching commands, capabilities and verification.

## v6.0.14-flclash.13 (2026-09-30)

- INLINE: synchronized controlled inline-payload flattening, shared-object protection and unified preflight; removed flattened providers after success while preserving the existing proxies-array reference.
- CANDIDATES: retained named direct/reject dependency outbounds but excluded them from latency classification. With support outbounds only, the global group used `REJECT`.
- FIX: rebuilt malformed `rule-providers` containers such as arrays/scalars, preventing valid-looking log counts while serialization lost all fused providers. Added reserved name `PASS-RULE`.
- VERIFY: actual main regressions and serialized readback. Rules/group names/DNS retained v6.0.14; see [follow-up research](../../docs/research/2026-09-30-routing-runtime-followup.md) for client limits.

## v6.0.14-flclash.12 (2026-09-30)

- FILTER: synchronized shared Clash Party preflight and default-off multiplier ceiling. Conservatively parsed explicit tags, retaining unknown/ambiguous multipliers; fixed English notice words matching substrings of valid names.
- GUARD: rejected malformed fields, duplicate-name ambiguity, name conflicts, provider input and filtering-broken dial dependencies before writes. Explicit `REJECT` when no usable nodes. Updated arrays in place to preserve bridge references.
- SCOPE: graph, fused rules, names and global DNS retained v6.0.14. Static clients lacked the same JS input path; see [per-client research](../../docs/research/2026-09-30-routing-script-research.md).
- REFERENCE: reviewed official v0.8.98 post-script application patch order, updated references/parameter guide, added VM regressions and embedded-runtime consistency checks.

## v6.0.14-flclash.11 (2026-09-29)

- FIX: two exact WeChat HTTPDNS domains matched the first DIRECT segment, avoiding BlockHttpDNS rejection of image-module resolution.
- SCOPE: only `dns.weixin.qq.com` and `dns.weixin.qq.com.cn` were exempted. Other BlockHttpDNS domains and FlClash DNS baseline remained unchanged.
- VERIFY: routing regressions checked DIRECT as the first match in final fused domain assets.

## v6.0.13-flclash.10 (2026-09-21)

- ★ FIX#182: synchronized repair of inherited old rule-mode `dns.fake-ip-filter` and dangling `rule-set:cn domain` references.
  - Explicitly emitted `fake-ip-filter-mode: blacklist`.
  - Discarded `rule-set:*` / `RULE-SET,...` entries invalidated by subscription-provider cleanup; retained valid domain wildcards and built-in `geosite:*`.
- VERIFY: shared Issue #182 fixtures with Clash Party Smart / Normal, preserving QuickJS/Dart in-place arrays, 55 groups, 151 rules and 132 providers.
- CONTRACT: `AGENTS.md` §3.5.1 / §8.4; official Mihomo syntax uses `fake-ip-filter-mode` and single-token `rule-set:xxx` / `geosite:xxx`.

## v6.0.13-flclash.9 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE: synchronized segment 013 China-site assets with Clash Party Normal. `linuxdo.org` and subdomains no longer fell into international sites; `linux.do` retained restricted-site routing.
- SCOPE: preserved v6.0.11-flclash.7 application DNS / Android VPN fixes without changing TUN, system proxy or exclusions.

## v6.0.12-flclash.8 (2026-09-01)

- FIX#181-PC: synchronized first-segment exact direct assets. `login.nvidia.cn` preceded broad NVIDIA download rules; other NVIDIA domains were unchanged.
- SCOPE: preserved v6.0.11-flclash.7 application DNS / Android VPN fixes without reintroducing UI DNS override or system-proxy requirements.

## v6.0.11-flclash.7 (2026-08-31)

- FIX#181-DOC: after script association, disabled application DNS override and separate Append system DNS. Removed instructions/header text requiring duplicate UI DNS YAML; documented whole-block replacement, lost unknown fields, final validation and application IPv6 boundaries.
- ANDROID: corrected the VPN System proxy label; explained the extra HTTP proxy, unchanged TUN and risks with access control/split VPN. Added diagnostics preserving excluded China-service applications.
- DNS/GEOX: distinguished China DoH, random unclassified queries, node bootstrap and actual leakage. Preferred default GeoX URLs, removing promises of faster China CDN access or mandatory replacement.
- REFERENCE: corrected explanations using official FlClash v0.8.96 source, Mihomo DNS documentation and Android VpnService API.
- SCOPE: only FlClash usage contract/version metadata changed. DNS algorithm, graph, 55 group definitions, 132 providers, 151 rules and other clients remained; upstream assets were not refreshed.

## v6.0.11-flclash.6 (2026-08-22)

- ROUTING: synchronized 132 fused providers / 151 rules. Gemini and Accademia Gemini moved to `🔍 Google 服务`; szkane AI rules retained their positions.

## v6.0.10-flclash.6 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: synchronized first-segment exact direct rules. Two NetEase game-service hosts preceded anti-AD and broad China-game rules.

## v6.0.9-flclash.5 (2026-08-02)

- FIX-NODE-ISO-LOWERCASE: synchronized support for lowercase two-letter ISO codes plus numbers, such as yun hk01 / yun us01 / yun jp01 / yun sg01 / yun tw01.
- GUARD/VERIFY: case-insensitive matching only for numbered two-letter ISO codes. Shared contracts checked classification buckets, primary regional and aggregate groups for 12 original examples.

## v6.0.9-flclash.4 (2026-07-25)

- PROFILE: synchronized trusted Node-DNS profiles `off / policy / adaptive`, defaulting to `adaptive`. All preserved QuickJS/Dart in-place-array contracts, 55 groups, rules and global DNS.
- ADAPTER-HARDENING: shared capture/apply module seam rejected profile mismatches, missing PSS baseline, conflicting resolver paths and over-budget partial policies. Later case-varied exact active-node policies received bounded precedence.
- VERIFY/DOCS: added profile, atomic bootstrap-capacity and exact-key regressions. Reviewed FlClash v0.8.94 (2026-07-11), finding no override-API / DNS-object breaking change.

## v6.0.9-flclash.3 (2026-07-25)

- NODE-DNS: synchronized the restricted private-node DNS adapter. Generated exact node policies/necessary hosts only for active-node FQDNs, preventing subscriptions replacing global DNS.
- VERIFY: shared contracts covered scalar hosts, IPv4/IPv6 bootstrap, wildcard precedence, capacity and idempotence. QuickJS in-place-update constraints remained.

## v6.0.9-flclash.2 (2026-07-24)

- FIX#FLCLASH-IPV6: added top-level `ipv6: false`. Previously only `dns.ipv6` was disabled, which did not stop core IPv6 traffic. The setting aligned with disabled AAAA resolution.
- DOC#ANDROID-NETWORK: documented the combination of Android VPN, system proxy, VPN bypass, DNS hijacking and PreferH3. Scripts cannot replace application VPN controls.
- REGRESSION: `validate-js-overwrites.js --target flclash` required disabled top-level IPv6.

## v6.0.9-flclash.1 (2026-07-19)

- Synchronized ordinary `api.github.com` routing to tools first, retaining AI routing only for the specified Code Helper process combination.

## v6.0.8-flclash.1 (2026-07-15)

- Synchronized China-authority priority and versioned Mihomo fused-rule caching, matching Clash Party Normal routing semantics.

## v6.0.7-flclash.1 (2026-07-14)

- FIX#176: synchronized fused ordering with authoritative CN domains before shared CDN / country / non-China geographic fallbacks.

## v6.0.6-flclash.1 (2026-07-14)

- DIRECT-WORKPRO-WEB: synchronized fused direct residuals; parent and web subprocesses matched exact `PROCESS-NAME` to `DIRECT`, not TUN exclusions.

## v6.0.5-flclash.1 (2026-07-14)

- DIRECT-WORKPRO: followed the permanent scki-local-process-direct regression inventory, keeping WorkPro.exe in fused direct residuals.

## v6.0.4-flclash.1 (2026-07-13)

- DIRECT-ITWDB: added `itwdb.com` to default DIRECT fused MRS, covering WorkPro subdomains without extra inline main rules.

## v6.0.3-flclash.1 (2026-07-12)

- SYNC: followed source graph v6.0.3 with 124 fused `.mrs` / residual providers and 141 main rules.
- FIX#FUSED-DOMAIN-PAYLOAD: shared corrected domain payload with Clash Party Normal, preventing OpenAI/ChatGPT from falling into international fallback because of MRS syntax mismatch.

## v6.0.2-flclash.2 (2026-07-12)

- FIX#REGION-CARRIER-PRIORITY: synchronized the fix for carrier marketing labels overriding actual exit geography. `🇯🇵AWS日本01 | 电信移动联通推荐` classified as `JP` and entered both `🇯🇵 日韩节点` and `🌏 亚太节点`.
- REGRESSION: shared tests covered Japan AWS plus Chinese carrier tags including `中国电信`, US AWS plus `China Telecom`, and carrier-only labels without geography falling back to `CN`.
- SCOPE: fused assets, source graph and business routing were unchanged; only runtime regional classification changed.

## v6.0.2-flclash.1 (2026-07-10)

- SYNC: source graph v6.0.2, with 113 fused `.mrs` / residual providers and 130 main rules.
- PERF: inherited same-policy semantic deduplication and native GEOIP residuals, avoiding incorrectly expanded HaGeZi / country CIDR data.

## v6.0.1-flclash.1 (2026-07-10)

- SYNC: continued consuming only source-graph-compiled fused Mihomo `.mrs` / residuals, retaining 113 providers and 130 rules.
- DELIVERY: the common compiler handled Issue #174 text-set splitting. No direct upstream-provider fetching or second rule framework was introduced.

## Unreleased (2026-07-09)

- SOURCE-GRAPH: removed raw provider/rule/MRS mapping tables, consuming only final fused output from `tools/build-fused-rule-sets.js`.
- RULES: final output contained `113` fused providers and `130` rules; semantics were unchanged.

## v6.0.0-flclash.1 (2026-07-09)

- FUSED-RULESETS: synchronized Clash Party Normal v6.0.0; standard Mihomo used fused `.mrs` / residual YAML.
- SCALE: reduced to `113` fused providers and `130` rules while retaining 55 groups.

## v5.4.39-flclash.1 (2026-07-09)

- SYNC: synchronized Clash Party Normal v5.4.39 with 474 providers and 929 rules.
- MIHOMO-MRS: 424 providers used `.mrs`; 30 partial providers appended residual YAML; 20 wholly unconvertible providers retained original formats.
- SOURCE-SIZE: inherited compact `.mrs` mappings to prevent multiline compatibility tables inflating QuickJS source.

## v5.4.38-flclash.1 (2026-07-09)

- SCKI-SUPPLEMENTAL: synchronized Clash Party Normal v5.4.38; main rules referenced supplemental sets.
- MIHOMO-MRS: synchronized 429 providers and 884 rules, including 366 MRS providers; preserved QuickJS/Dart in-place array/object updates.
- FIX: preserved original FlClash array references so override did not change rules-array identity.

## v5.4.37-flclash.1 (2026-06-29)

- ★ DNS-POLICY#170: synchronized Clash Party Normal v5.4.37; `overwriteGeneral()` added `geosite:cn` / `geosite:geolocation-!cn` resolver routing to `nameserver-policy`.
- Manual DNS examples gained DoH-over-IP bootstrap, hosts pre-resolution, geosite policy and `direct-nameserver-follow-policy: true`, preventing advanced UI configuration overriding the script DNS contract.

## v5.4.36-flclash.1 (2026-06-29)

- CLEAN#171-DIRECT: synchronized removal of 22 individually verified redundant inline rules.
- Retained 100% rule equivalence with Clash Party Normal. AI / Binance / Microsoft-login candidates remained because earlier different-policy MRS prevented safe deletion.

## v5.4.35-flclash.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM: synchronized v5.4.35, removing eight upstream sets already covered by earlier same-target rules.
- CLEAN#170-DIRECT: removed three later inline rules already covered by the earlier same-target Douyin China-streaming guard: `douyin.com`, `douyinpic.com`, `douyinvod.com`.
- Provider output decreased to 376. Match ordering remained; FlClash continued standard Mihomo `url-test` regions.

## v5.4.34-flclash.1 (2026-06-28)

- ★ FIX#169-AMAP: synchronized v5.4.34, adding MetaCubeX `amap` provider and `RULE-SET,amap,🏠 国内网站`.
- Placed after ad/threat rules but before broad TikTok/GFW/geolocation-!cn rules, correcting first-match risk of international routing for `webapi.amap.com`.

## v5.4.33-flclash.1 (2026-06-27)

- ★ FEAT#169-AI-CODING: added `vpsdance-ai-coding` from VPSDance `rules/clash/coding.yaml`, targeting `🤖 AI 服务`.

## v5.4.32-flclash.1 (2026-06-25)

- ★ FIX#168-CN-GAME: synchronized Normal v5.4.32; moved China games before broad international game rules so HoYoverse / Game / category-games did not proxy China-game domains first.
- Added JS regressions for China-game priority.

## v5.4.31-flclash.1 (2026-06-20)

- ★ FIX#167-DOUYIN: synchronized Normal v5.4.31 with a leading Douyin Web guard. `douyin.com` / `zjcdn.com` and related domains matched `📺 国内流媒体` before TikTok/international fallback.
- Added JS regression assertions against priority reversal.

## v5.4.30-flclash.1 (2026-06-17)

- ★ FEAT#166-GOOGLE: synchronized v5.4.30, adding `🔍 Google 服务` before `🔧 工具与服务`.
- Split Google base services, Scholar, IP and QUIC from tools; service-group count became 33.

## v5.4.29-flclash.1 (2026-06-10)

- ★ PERF#165-LATENCY: changed 22 regional `url-test` intervals `180 -> 300`, matching Normal / CMFA.
- Rules, DNS, node filtering and service-group semantics remained unchanged.

## v5.4.27-flclash.1 (2026-06-07)

- ★ CLEAN#165: synchronized removal of seven inline domains already covered by `claude` / `paypal` / `hbo` / `hulu` / `xbox` providers, without changing policies.

## v5.4.26-flclash.1 (2026-06-07)

- ★ FIX#164: protected Tencent WorkBuddy `copilot.tencent.com` from szkane `AiDomain.list` substring `DOMAIN-KEYWORD,copilot`, which incorrectly sent it through `🤖 AI 服务` and caused conversation errors. Added `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站` before every AI set. Baseline: Clash Party v5.4.26.

## v5.4.25-flclash.1 (2026-06-03)

- ★ Review fix: deduplicated `GEOIP,netflix`, `GEOIP,google`, `GEOIP,ID` (two occurrences each), retaining the consolidated GEOIP-label routing block.

## v5.4.24-flclash.1 (2026-06-03)

- ★ CLEAN: removed 18 redundant rules and three unreferenced providers, matching v5.4.24 after downloading and checking upstream files individually.
  - Removed four Binance DOMAIN-SUFFIX entries (binance.com/cloud/me/future.com), already in RULE-SET.
  - Removed three Google child RULE-SET references/providers (googlesearch/googledrive/googleearth), covered by the parent Google set.
  - Removed three ProtonMail DOMAIN-SUFFIX entries (protonmail.com/proton.me/pm.me), already in RULE-SET.
  - Removed five music DOMAIN-SUFFIX entries (soundcloud/sndcdn/pandora/deezer/tidal), covered by their sets.
  - Removed two social DOMAIN-SUFFIX entries (tumblr/clubhouse), covered by their sets.
  - Removed two streaming DOMAIN-SUFFIX entries (vimeo/dailymotion), covered by their sets.

## v5.4.23-flclash.1 (2026-06-02)

- ★ FIX#161: `DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` targeted `🏠 国内网站` direct routing for Zhihu image CDN/short links, matching the baseline.

## v5.4.22-flclash.1 (2026-05-31)

- ★ Added GeTui push SDK `getui.com` / `getui.net` / `gepush.com` to direct exceptions after review. Continuing #2, generic ad/privacy feeds treated them as trackers despite carrying application push such as Mi Home; the owner chose to allow them.

#1 Proxy-override adaptation: refined QUIC using AND-rule exceptions, sending YouTube/Google/MS/Apple QUIC through corresponding service groups and rejecting other non-CN QUIC.

- Added `config.sniffer` with QUIC/443 SNI sniffing and `force-dns-mapping`, matching CMFA/OpenClash, so real-IP QUIC for fake-ip-filter domains could match GEOSITE instead of incorrect rejection (review fix).
- Changed fallback criterion from `GEOIP,CN` to `GEOSITE,cn`, recorded as more reliable with fake-ip.

## v5.4.21-flclash.1 (2026-05-31)

#4 Proxy-override adaptation: replaced plaintext-IP-only `default-nameserver` with DoH-over-IP plus one plaintext fallback. The historical release described this as eliminating bootstrap DNS leakage; the retained plaintext fallback means it is not a general zero-leak guarantee.

## v5.4.20-flclash.1 (2026-05-30)

Proxy-override batch B, #6 node-filter keywords, following Clash Party v5.4.20:

- Added `isInfoNode` keywords: Chinese `免费` / `试用` / `应急`, and English `Sign` / `Login` / `Register` / `Help` / `FAQ` with `\b` boundaries.
- Did not add `更新` / `地址` because of false-positive risk.
- Regressions: FlClash target fixtures in `tools/validate-js-overwrites.js` (junk filtering and Signal guard) plus `tools/test-info-node-filter.js` consistency.
- 🔢 Version: v5.4.19-flclash.1 → v5.4.20-flclash.1.

## v5.4.19-flclash.1 (2026-05-30)

Proxy-override batch A, following Clash Party v5.4.19; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`:

- ✅ #2 China SDK/CDN priority: added jpush / `msg.umeng.com` to `AD_FALSE_POSITIVE_ALLOWLIST` for forced DIRECT, ahead of `jiguangtuisong` / `youmengchuangxiang` blocks. Moved `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` ahead in the China-site segment.
- ✅ #3 Added ten fake-ip-filter entries: remote access todesk/oray/sunlogin/teamviewer/anydesk; games battlenet.com.cn/wotgame.cn/wggames.cn/wowsgame.cn; Bilibili P2P mcdn.bilivideo.cn.
- ✅ #5 Added `direct-nameserver-follow-policy: true` so direct-outbound domain resolution followed nameserver-policy. That release recorded the policy as containing only international CDNs, with no China-domain false positives.
- 🔢 Aligned v5.4.18-flclash.2 → v5.4.19-flclash.1; all artifacts skipped the invalid .18 release and converged on v5.4.19.

## v5.4.18-flclash.2 (2026-05-30)
## v5.4.17-flclash.2 (2026-05-30)

- ★ FIX#VERSION-PREFIX: corrected mistaken v5.4.18 prefix to v5.4.17, matching main Smart JS and nine other artifacts (historical CLAUDE.md §4), fixing `js.flclash.version-prefix` in validate-artifact-contracts. url-test/DNS tuning was unchanged; version prefix only.
- ⚡ PERF#URLTEST-LATENCY: tuned url-test groups to address stalls, high latency and connectivity failures.
  - `lazy: false`: actively tested all group nodes instead of only the current node, avoiding remaining on degraded nodes.
  - `interval: 120 → 180`: increased interval with lazy=false to limit full-group testing bursts.
  - `tolerance: 30 → 10`: reduced switching threshold from 30 ms to 10 ms for faster movement from degraded nodes.
- ⚡ PERF#DNS-RESILIENCE: DNS bootstrap/proxy-layer tuning.
  - Removed international `1.1.1.1` / `8.8.8.8` from `default-nameserver`, using `223.5.5.5` / `119.29.29.29` / `180.76.76.76`. That release used China-based bootstrap to break fake-ip circular dependencies.
  - Removed China DoH from `proxy-server-nameserver`; that release used only Cloudflare/Google DoH for proxy-chain DNS.

## v5.4.17-flclash.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP: synchronized Normal v5.4.17 DNS contract.
  - `default-nameserver` used IPs only; all non-bootstrap resolvers used DoH.
  - Disabled `prefer-h3`, enabled `respect-rules: true`, and completed `nameserver-policy` / `fallback-filter.geosite`.

## v5.4.16-flclash.2 (2026-05-22)

- ✅ FEAT#GAME-ACCEL: added game-accelerator `PROCESS-NAME -> DIRECT` exceptions.
  - Added 16 process names for UU / Xiaohei / Xunyou / Leishen / NNer accelerators, matching Normal.

## v5.4.16-flclash.1 (2026-05-20)

- ✅ FIX#149-P0: synchronized Normal v5.4.16, placing `paddle.com -> 🏦 金融支付` early.
  - Protected `analytics.paddle.com` from anti-AD/DustinWin false positives so Antigravity account/licensing paths did not hit ads first.

## v5.4.15-flclash.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER: synchronized Normal v5.4.15 and added a GEOSITE coverage-ledger reference.
- ♻️ REFACTOR#AD-FP-MODULE: promoted ad exceptions to AD_FALSE_POSITIVE_ALLOWLIST and injected them at the start of injectRules().

## v5.4.14-flclash.1 (2026-05-20)

- ✅ FIX#CF-R2-P0: synchronized Normal v5.4.14, placing `cloudflarestorage.com -> 🌐 国外网站` early.
  - Corrected Sukka phishing false positives for Cloudflare R2 storage domains.
  - Removed the duplicate later `🌐 国外网站` entry.

## v5.4.13-flclash.1 (2026-05-19)

- ✅ FIX#STUN-REALIP: synchronized Normal v5.4.13 with STUN/TURN fake-ip exclusions and direct standard ports.
  - Merged STUN/TURN wildcards, `stun1-4.l.google.com` and `global.turn.twilio.com` into `fake-ip-filter`.
  - `DST-PORT 5349 / 19302 / 19305 / 19307` used `DIRECT`.

## v5.4.12-flclash.2 (2026-05-12)

- 📝 DOC#IMPORT-HTML: encoded FlClash import URL as `%28mihomo%29` and added `unexpected token '<'` diagnostics.
  - The error indicated GitHub/error-page HTML instead of JavaScript. Rules and DNS logic were unchanged.

## v5.4.12-flclash.1 (2026-05-12)

- ✅ FIX#RD-REALIP: retained `+.rustdesk.com` in DNS `fake-ip-filter`.
  - Aligned with Normal v5.4.12: RustDesk retained collaboration proxy routing while DNS used real IPs.

## v5.4.11-flclash.1 (2026-05-12)

- ✅ FIX#RD-PROC: removed RustDesk processes from local-tool DIRECT exceptions and routed them to `🧑‍💼 会议协作`.
- ✅ FIX#DNS-BOOTSTRAP: embedded DNS examples/output became IP-first to reduce DoH hostname-resolution deadlock risk.

## v5.4.9-flclash.1 (2026-05-11)

- ✅ FEAT#LOCAL-TOOLS: followed v5.4.9 with desktop local-tool `PROCESS-NAME -> DIRECT` exceptions.
  - Applicable on Windows/macOS/Linux; Android did not rely on this list.
  - Validated through `tools/fixtures/process-name-direct-tools.json` and `tools/validate-process-name-direct.js`.

## v5.4.8-flclash.1 (2026-05-09)

- ★ ORDER#RULE-TAIL: followed Normal v5.4.8-normal.1 to reorder tail-rule matching.

## v5.4.7-flclash.1 (2026-05-09)

- ★ FEAT#TikTok: added independent `🎵 TikTok` group (32 service groups), between `📺 国内流媒体` and `🎥 Netflix`.
  - Followed Normal v5.4.7-normal.1; synchronized BIZ, groups, rules and FP.
- ★ FIX#HK: added `'港'` to REGION_DB HK keywords for Guangzhou/Hong Kong and Shenzhen/Hong Kong IEPL/IPLC labels.

## v5.4.6-flclash.1 (2026-05-08)

- ★ FEAT#145: added WeChat CDN direct rule `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT`.
  - Placed after iwipwedabay.com and before binance.
  - Followed Normal v5.4.6-normal.1.

## v5.4.5-flclash.1 (2026-05-07)

- ★ Moved global nodes first and synchronized group ordering across products, following v5.4.5.

## v5.4.4-flclash.1 (2026-05-07)

- ★ FIX#142-CRITICAL: injected fallback nameservers to prevent empty DNS causing DIRECT timeouts.
  - overwriteGeneral added protection injecting `223.5.5.5` / `119.29.29.29` when application DNS was unconfigured.
  - Set `enhanced-mode: fake-ip` so missing external configuration did not leave resolution mode invalid.
- ★ FIX#144-P1: bbys.app DIRECT rule.
  - Added `DOMAIN-SUFFIX,bbys.app,DIRECT` after acc-chinamax in injectRules.
- ★ FEAT#143: expanded IEPL/IPLC residential detection.
  - Added `/\biplc\b/i`, `/\biepl\b/i` and `/专线/` to RESIDENTIAL_PATTERNS.
- Followed Clash Party v5.4.4.

## v5.4.3-flclash.1 (2026-05-06)

- ★ FEAT: added `\bhome\b` residential keyword, following v5.4.3.
  - Appended `/\bhome\b/i` to RESIDENTIAL_PATTERNS to match names containing only Home as the indicator.

## v5.4.2-flclash.2 (2026-05-05)

- ★ FIX#41-P0-QuickJS: changed injectRules reassignment to in-place splice/push, repairing rule loss across QuickJS ↔ Dart FFI.
  - `config.rules = [...]` created a new QuickJS array while Dart retained the old reference, losing all rules.
  - Used temporary `_newRules`, `config.rules.splice(0)` and individual in-place `push` calls.
  - The bug lost all 1000+ injected rules after cleanupSubscription cleared them.

## v5.4.2-flclash.1 (2026-05-05)

- ★ FIX#41-P0: Xiaomi core-service DIRECT exceptions, following v5.4.2.
  - Added 11 DIRECT rules before ad blocking, correcting miuiprivacy/advertisingmitv rejection of authentication/security domains.

## v5.4.1-flclash.2 (2026-05-05)

- ★ FIX#FlClash-Review-P0: restored valid UTF-8 string literals.
  - Fixed `SyntaxError` caused by mojibake in `REGION_DB` / `SMART` / `BIZ`.
  - Resynchronized clean logic from `ClashParty(mihomo).js`, retaining QuickJS log wrappers and in-place arrays.
- ★ FIX#FlClash-Review-P0: restored classifyAllNodes bucket initialization.
  - `TWN 01 AnyRoute IEPL x2.5` classified as Taiwan; `SGP 01 AnyRoute IEPL x2.5` as Singapore; unknown residential nodes as other residential.
  - Shared-bug audit: Normal received the same repair; Smart was unaffected; static/non-JS artifacts lacked this initialization regression.

## v5.4.0-flclash.1 (2026-05-05)

- ★ FEAT#SG: added independent `🇸🇬 狮城节点` and `🏡 狮城家宽` groups.
  - Split Singapore into a separate region from `🌏 亚太节点`.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Followed Clash Party v5.4.0.

## v5.3.2-flclash.1 (2026-05-03)

- Initial complete port of Clash Party Normal v5.3.2.
  - 18 url-test regional groups (9 all-node + 9 residential) plus 31 service groups, including 13 streaming groups.
  - 371+ providers covering AI, streaming, games, finance, social and development categories.
  - Word-boundary regex classification using the same REGION_DB as v5.3.2.
  - Automatic residential detection and informational-node filtering.
  - Automatic cleanup of unwanted subscription proxy-groups / rules / rule-providers.
  - Automatic TLS fingerprint injection (`client-fingerprint`).
- Adapted to FlClash's override host:
  - Wrapped `console.log` conditionally for QuickJS.
  - Removed `geox-url` / `geodata-mode` / TUN / port overrides from global settings because the UI owned them.
  - Changed arrays to in-place splice/push to avoid reassignment loss across QuickJS FFI.
- **Import confirmed:** first create the script in Override scripts, then associate it via subscription More → Override.
- Documented required GeoX URL (external resources) and DNS (advanced configuration) settings.
- Offered alongside CMFA YAML.
