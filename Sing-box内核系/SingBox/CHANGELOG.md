<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="SingBox changelog" width="100%">
</picture>

<a id="singbox--变更日志"></a>

# SingBox — Changelog

> Changelog for the generated full configuration `Sing-box内核系/SingBox/SingBox(sing-box)-full.json`.
> The same generator publishes the current-stable Full configuration and the 1.13-compatible variant in this directory.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Project README](../../README.md) · [Documentation index](../../docs/README.md)

<a id="v6021-sing12-2026-10-28"></a>

## v6.0.21-sing.12 (2026-10-28)

- Moved Google FCM from downloads to Google services. The 15 domains, 26 IPv4 predicates, rule order and 55 groups were unchanged, as were other push services, DNS and fake-IP.

<a id="v6020-sing11-2026-10-24"></a>

## v6.0.20-sing.11 (2026-10-24)

- Organized client directories by core family, retaining files/guides within client subdirectories. Rule semantics/fields were unchanged. Raw configuration URLs changed with paths, requiring reimport; shared `rulesets/` URLs remained unchanged.

<a id="v6020-sing10-2026-10-19"></a>

## v6.0.20-sing.10 (2026-10-19)

- Fixed decoding by the official stable core: removed nonstandard `_meta`, migrated DNS to typed HTTPS servers / `domain_resolver`, and TUN sniffing to a nonterminal route action, preserving source-rule targets, relative order and 54 policy groups.
- Full required sing-box 1.14.3 with named `http_clients` and explicit DNS response matching. The same generator also emitted `SingBox(sing-box)-1.13.json`, retaining valid `download_detour` and matching DNS schema for Hiddify 4.1.1's core branch.
- Both variants passed official 1.14.3 / 1.13.14 `check` without deprecated-feature environment variables. Routing, outbounds and rule-set URLs compared consistently. Actual application import and connectivity remained unverified.
- Documented the migration limit after upstream removed destination rewriting: new sniffing assists matching but does not automatically replace an IP destination with SNI/Host for domain dialing. Equivalent preservation of the old behavior was not claimed.
- Corrected Hiddify full-configuration mode, HomeProxy UCI generation and Passwall backend boundaries. Official text, release dates and original failure logs are in the [verification report](../../docs/upstream/2026-10-19/singbox/report.md).
- Follow-up review added the 1.13 variant to automatic-refresh outputs. CI downloads and verifies official cores before checking both schemas; an explicitly wrong core path must fail. The README was shortened while retaining diagrams.

<a id="v6020-sing9-2026-10-16"></a>

## v6.0.20-sing.9 (2026-10-16)

- Issue #187: added exact DIRECT exceptions in existing `scki-adfp-direct` for `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, `hkshort.weixin.qq.com`, preventing WeChat connection endpoints from matching ads first.
- No parent/subdomain expansion; `ad.weixin.qq.com` and `log.weixin.qq.com` remained rejected. Other policies and ordering were unchanged.
- Continued consuming fused assets through the existing generator with native platform syntax; generated files were not hand-edited.
- See [WeChat review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence and bounded static acceptance. Reporter-device recovery still required retesting.

<a id="v6019-sing8-2026-10-15"></a>

## v6.0.19-sing.8 (2026-10-15)

- FIX#186: unified repository-owned remote assets on GitHub raw HTTPS to avoid jsDelivr repository-size limits, preserving version queries and native formats.
- Reused verified fused payloads; content, ordering and policies were unchanged. Added raw/CDN-reference regressions. See [delivery guidance](../../docs/rule-asset-delivery.md) for cause, download prerequisites and official fields.

<a id="v6018-sing7-2026-10-14"></a>

## v6.0.18-sing.7 (2026-10-14)

- Fixed cross-service first-match misclassification: narrowed broad Apple/Microsoft keywords and shared AWS/Azure/CDN suffixes, adding eight guard classes: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social, bytedance-app. Six ADFP records for exact CA revocation/status hosts via DIRECT and exact Microsoft international-mail policy brought the total to 35. `api.byteoversea.com` was an exact TikTok rule, not a shared-suffix expansion. Existing Claude Desktop `a-api`/`a-cdn` exceptions, QUIC/latency options and default-off ZeroTier proxy remained. Crisp relay was a static ASN-overlap risk inference, not a measured incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 nonempty SRS across 81 segments.

<a id="v6017-sing6-2026-10-13"></a>

## v6.0.17-sing.6 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to `scki-adfp-ai` for Claude Desktop application-code/user-content loading through AI policy. Based on [official requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Existing rule sets/native syntax remained. Source-semantic gates, 29 ADFP checks, Claude stage inventory and file-level release-batch checks joined the publication chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device reproduction or measurement occurred.

<a id="v6016-sing6-2026-10-12"></a>

## v6.0.16-sing.6 (2026-10-12)

- Following v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional ADFP validation. Conversion format, order and target policies remained; no runtime rules were added. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording only observable bytes and conversion receipts. Original remote-input SHA values cannot be reconstructed from old outputs; no claim of complete historical provenance or real-device traffic measurement was made.

<a id="v6015-sing6-2026-10-07"></a>

## v6.0.15-sing.6 (2026-10-07)

- Generated output supported a 15-minute urltest interval and non-China UDP/443 policy selection, preserving existing idle_timeout.
- See [latency and QUIC options](../../docs/traffic-options.md) for switching commands, capabilities and verification.

<a id="v6014-sing5-2026-09-29"></a>

## v6.0.14-sing.5 (2026-09-29)

- SYNC: added two exact WeChat HTTPDNS domains to fused SRS 001 with DIRECT outbounds, ahead of BlockHttpDNS rejection.
- VERIFY: Full JSON retained 69 fused SRS, 76 remote rule_set entries and 88 routing rules.

<a id="v6013-sing4-2026-09-03"></a>

## v6.0.13-sing.4 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE: added `linuxdo.org` domain_suffix to fused SRS 013 with the China-sites outbound; `linux.do` retained its GFW outbound.
- SYNC: Full JSON retained 69 fused SRS, 76 remote rule_set entries and 88 routing rules.

<a id="v6012-sing3-2026-09-01"></a>

## v6.0.12-sing.3 (2026-09-01)

- FIX#181-PC: added exact `login.nvidia.cn` to the initial fused SRS with `DIRECT`; other NVIDIA domains remained on the downloads outbound.
- SYNC: Full JSON retained 69 fused SRS, 76 remote rule_set entries and 88 routing rules.

<a id="v6011-sing2-2026-08-22"></a>

## v6.0.11-sing.2 (2026-08-22)

- Regenerated Full JSON from final fused SRS: Gemini and Accademia Gemini first matches moved from AI to Google; other AI policies and ordering were unchanged.

<a id="v6010-sing2-2026-08-08"></a>

## v6.0.10-sing.2 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: regenerated Full JSON and the initial fused SRS. Two NetEase game-service hosts used fixed `DIRECT`, not the selected China-games outbound.

<a id="v609-sing1-2026-07-19"></a>

## v6.0.9-sing.1 (2026-07-19)

- Regenerated Full JSON: `api.github.com` defaulted to the tools group; native `process_name + domain` rules retained AI routing only for `Code Helper` / `Code Helper (Plugin)`.

<a id="v608-sing1-2026-07-15"></a>

## v6.0.8-sing.1 (2026-07-15)

- Synchronized China-authority precedence; 65 fused remote `.srs` assets used release-version cache keys.

<a id="v607-sing1-2026-07-14"></a>

## v6.0.7-sing.1 (2026-07-14)

- FIX#176: regenerated Full JSON so China-domain SRS routes precede shared-CDN / GeoIP international SRS fallback. Generic international fallback became a separate later semantic segment.

<a id="v606-sing1-2026-07-14"></a>

## v6.0.6-sing.1 (2026-07-14)

- DIRECT-WORKPRO-WEB: regenerated Full JSON. Native SRS source for `scki-fused-008-direct` included both `process_name: WorkPro.exe` and `WorkProWebProcess.exe`; Windows / Linux / macOS process-matching paths routed to the direct outbound.

<a id="v605-sing1-2026-07-14"></a>

## v6.0.5-sing.1 (2026-07-14)

- DIRECT-WORKPRO: regenerated Full JSON. Native SRS source for scki-fused-008-direct included process_name WorkPro.exe and routed to DIRECT; the official field applies only to Linux / Windows / macOS.

<a id="v604-sing1-2026-07-13"></a>

## v6.0.4-sing.1 (2026-07-13)

- DIRECT-ITWDB: regenerated Full JSON from fused outputs. `.srs` / route semantics for `scki-fused-008-direct` included `itwdb.com` and all subdomains, targeting the direct outbound.

<a id="v603-sing1-2026-07-12"></a>

## v6.0.3-sing.1 (2026-07-12)

- SYNC: regenerated Full JSON from the fused manifest: 65 unique nonempty `.srs`, 72 remote rule_set entries (65 fused + 7 runtime GEO) and 82 route rules.
- AI-PRECEDENCE: added an early AI-guard SRS so ChatGPT Sentry/DataDog telemetry was not intercepted by later ad rules; OpenAI / oaistatic / related Cloudflare domains remained on the AI path.
- BUILD: the generator stopped hardcoding the ad fused-segment ID and located it dynamically by manifest policy, preventing route-reference drift when early semantic segments are inserted.

<a id="v602-sing1-2026-07-10"></a>

## v6.0.2-sing.1 (2026-07-10)

- SYNC: upgraded Full JSON to Clash Party v6.0.2. Manifest-based merging converted 113 Mihomo bucket providers into 64 nonempty unique `.srs`, avoiding multiple tags and duplicate routes for one SRS.
- TARGET-MATERIALIZATION: sing-box headless rule sets do not support GEOIP / IP-ASN fields, so those rules were resolved to CIDRs only for the sing-box target. Download failure or empty results aborted the build.
- PERF: the 64 `.srs` totaled about 4.06 MiB; Full JSON contained 71 remote rule_set entries (64 fused + 7 runtime GEO) and 81 route rules.

<a id="v601-sing1-2026-07-10"></a>

## v6.0.1-sing.1 (2026-07-10)

- SYNC: regenerated Full JSON and upgraded to the Clash Party v6.0.1 baseline.
- DELIVERY: sing-box retained 68 fused `.srs` rule sets. Text-rule sharding for Issue #174 did not change `.srs` paths, route semantics or GEO runtime rule_set entries.

<a id="v600-sing1-2026-07-09"></a>

## v6.0.0-sing.1 (2026-07-09)

- FUSED-RULESETS: moved the generator baseline to Clash Party v6.0.0 and mapped fused providers to `rulesets/generated/fused/sing-box/*.srs`.
- SCALE: Full JSON contained 120 route rule_set entries (113 fused + 7 GEO runtime rule_set entries) and 130 route rules at this revision.

<a id="v5439-sing1-2026-07-09"></a>

## v5.4.39-sing.1 (2026-07-09)

- SYNC: updated the generator baseline to Clash Party v5.4.39 and regenerated Full JSON.
- SCKI-MRS-BRIDGE: SingBox does not consume Mihomo `.mrs`. The generator read `rulesets/generated/mihomo-mrs/manifest.json`, traced migrated `scki-*` supplementary rules back to original `.list` sources, and expanded them into native route rules.
- VERIFY: Full JSON contained 40 remote rule_set entries and 660 route rules. Early Cloudflare R2 and Douyin / `zjcdn.com` guards remained ahead of ad rules, TikTok and international fallback.

<a id="v5438-sing1-2026-07-09"></a>

## v5.4.38-sing.1 (2026-07-09)

- SCKI-SUPPLEMENTAL: the generator read `rulesets/supplemental/clash/*.list` and expanded them into sing-box route rules.
- SYNC: regenerated Full JSON against Clash Party v5.4.38.

<a id="v5437-sing1-2026-06-29"></a>

## v5.4.37-sing.1 (2026-06-29)

- META#170-DNS-POLICY: `SingBox(sing-box)-generator.js` followed Clash Party v5.4.37 metadata and regenerated Full JSON.
- N/A: sing-box uses native `dns.rules` / `dns.servers`, not Mihomo's `nameserver-policy` field. Existing DNS semantics remained: `geosite-cn` / `cn-ip` used `dns_direct`, with final fallback through `dns_proxy`.

<a id="v5436-sing1-2026-06-29"></a>

## v5.4.36-sing.1 (2026-06-29)

- CLEAN#171-DIRECT: aligned `SingBox(sing-box)-generator.js` with Clash Party v5.4.36 and regenerated Full JSON.
- Removed 22 individually verified redundant domain / domain_suffix route rules; remote rule_set entries were unchanged.

<a id="v5435-sing1-2026-06-28"></a>

## v5.4.35-sing.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM: regenerated Full JSON with `SingBox(sing-box)-generator.js` against Clash Party v5.4.35.
- Note: none of the eight removed upstream providers belonged to SingBox remote rule_set mappings. Cleaning later duplicate Douyin inline rules reduced route rules from 687 to 684.

<a id="v5434-sing1-2026-06-28"></a>

## v5.4.34-sing.1 (2026-06-28)

- ★ FIX#169-AMAP: `SingBox(sing-box)-generator.js` followed Clash Party v5.4.34 and mapped MetaCubeX `amap` to sing-box `amap.srs` rule_set.
- Regenerated `SingBox(sing-box)-full.json`; the `amap` route preceded broad international-sites `proxy` fallback and targeted `🏠 国内网站`.

<a id="v5433-sing1-2026-06-27"></a>

## v5.4.33-sing.1 (2026-06-27)

- ★ FEAT#169-AI-CODING: `SingBox(sing-box)-generator.js` mapped `vpsdance-ai-coding` to VPSDance `rules/sing-box/coding.json`.
- Regenerated Full JSON, adding one source-JSON remote rule_set.

<a id="v5432-sing1-2026-06-25"></a>

## v5.4.32-sing.1 (2026-06-25)

- ★ FIX#168-CN-GAME: `SingBox(sing-box)-generator.js` followed Clash Party v5.4.32, placing China-games routes before broad HoYoverse / Game / category-games rules in Full JSON.
- Regenerated Full JSON, keeping meta version/build/baseline consistent.

<a id="v5431-sing1-2026-06-20"></a>

## v5.4.31-sing.1 (2026-06-20)

- ★ FIX#167-DOUYIN: `SingBox(sing-box)-generator.js` followed Clash Party v5.4.31, adding early Douyin Web China-streaming routes so `zjcdn.com` and related domains matched `📺 国内流媒体` before TikTok / international fallback.
- Regenerated `SingBox(sing-box)-full.json` with the generator.

<a id="v5430-sing1-2026-06-17"></a>

## v5.4.30-sing.1 (2026-06-17)

- ★ FEAT#166-GOOGLE: `SingBox(sing-box)-generator.js` added the `🔍 Google 服务` selector before `🔧 工具与服务`.
- Scholar, base Google services, Google IP and Google QUIC routes moved to the new group; regenerated `SingBox(sing-box)-full.json`.

<a id="v5429-sing1-2026-06-10"></a>

## v5.4.29-sing.1 (2026-06-10)

- ★ PERF#165-LATENCY: `SingBox(sing-box)-generator.js` changed `interval` on all `urltest` outbounds (two aggregate groups at the time) from the official/default `3m` to `5m`, matching the cross-client 300s setting.
- Regenerated `SingBox(sing-box)-full.json` and aligned metadata with Clash Party v5.4.29.

<a id="v5427-sing1-2026-06-07"></a>

## v5.4.27-sing.1 (2026-06-07)

- ★ CLEAN#165: regenerated Full JSON with `SingBox(sing-box)-generator.js`, removing inline domain routes already covered by upstream Claude / PayPal / HBO / Hulu / Xbox rule sets, in line with the baseline.

<a id="v5426-sing1-2026-06-07"></a>

## v5.4.26-sing.1 (2026-06-07)

- ★ FIX#164: prevented Tencent WorkBuddy `copilot.tencent.com` from being captured by AI routing instead of its China-sites direct route. `SingBox(sing-box)-generator.js` regenerated Full from the baseline Clash Party JS, translating the new pre-AI `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站` rule to `route.rules` (`domain_suffix:["copilot.tencent.com"] → outbound:"🏠 国内网站"`, before `geosite:openai`). Baseline: Clash Party v5.4.26.

<a id="v5425-sing2-2026-06-05"></a>

## v5.4.25-sing.2 (2026-06-05)

- ★ FIX#SING-QUIC-P0: the generator stopped converting Clash `MATCH` into an unconditional route rule; `route.final` provided fallback instead, avoiding interception of later fine-grained QUIC rules.
- ★ FIX#SING-QUIC-ORDER: inserted six sing-box QUIC rules at the mainline's five AND/QUIC-rule position rather than appending them.
- ★ SYNC#GROUP-ORDER: aligned service-group order with Clash Party, placing Hong Kong / Taiwan / Japan-Korea / Europe streaming groups before other international streaming.
- ★ VERIFY: added contract checks for SingBox service-group order and unconditional FINAL routes; regenerated `SingBox(sing-box)-full.json`.

<a id="v5425-sing1-2026-06-04"></a>

## v5.4.25-sing.1 (2026-06-04)

- ★ SYNC: regenerated `SingBox(sing-box)-full.json` with Clash Party v5.4.25 metadata.
- ★ CLEAN: followed baseline deduplication, removing `geoip:netflix` / `geoip:google` routes already covered in the centralized route-rule block.
- ★ FIX#SING-GEN-P2: the generator stopped using the old `SingBox(sing-box)-full.json` as its base and switched to a clean built-in baseConfig, preventing prior generated output from contaminating later builds.

<a id="v5423-sing1-2026-06-02"></a>

## v5.4.23-sing.1 (2026-06-02)

- ★ FIX#161: the generator derived `domain_suffix: zhimg.com / zhihu.co` → `🏠 国内网站` routes from mainline for Zhihu image-CDN/short links and regenerated JSON.

<a id="v5422-sing1-2026-05-31"></a>

## v5.4.22-sing.1 (2026-05-31)

- ★ Added direct GeTui push-SDK routes for `getui.com` / `getui.net` / `gepush.com` after review; automatically derived them from the mainline allowlist and regenerated route.rules.

- #1 Proxy-override adoption: fine-grained QUIC handling added six hardcoded generator.js route rules (four allowlist entries + CN allowance + remaining REJECT); AND compound rules were not passed to toSingRule().

<a id="v5421-sing1-2026-05-31"></a>

## v5.4.21-sing.1 (2026-05-31)

#4 Proxy-override adoption: upgraded bootstrap from `udp://IP:53` to `https://IP/dns-query` with TLS SNI overrides (dns.alidns.com / cloudflare-dns.com / dns.google). The historical entry described this as eliminating bootstrap-stage DNS leaks; this is not a new verification claim. Bumped generator.js and regenerated output.

<a id="v5420-sing1-2026-05-30"></a>

## v5.4.20-sing.1 (2026-05-30)

- N/A#6 node-filter keywords (batch B): sing-box uses static outbounds supplied by the user and has no subscription junk filter, so #6 did not apply. Bumped generator.js version/baseline and regenerated without changing route.rules (1077→725 conversion), aligned with Clash Party v5.4.20.

<a id="v5419-sing1-2026-05-30"></a>

## v5.4.19-sing.1 (2026-05-30)

Proxy-override batch A, #2 China SDK/CDN direct precedence, automatically derived from mainline Smart JS rules and regenerated; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`:

- Regenerated `route.rules` incorporated mainline #2 additions: `jpush.cn` / `jpush.io` / `msg.umeng.com` → DIRECT; `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` → `🏠 国内网站`.
- #3 fake-ip-filter did not apply because this sing-box configuration did not use fake-IP enhanced mode. #5 `direct-nameserver-follow-policy` did not apply because the generator builds native sing-box DNS, not Mihomo fields.
- 🔢 Version: v5.4.18-sing.1 → v5.4.19-sing.1, synchronizing generator VERSION / BUILD / BASELINE and all artifacts to v5.4.19.

<a id="v5418-sing1-2026-05-27"></a>

## v5.4.18-sing.1 (2026-05-27)

- ✅ FIX#SING-DNS-REDUNDANCY: added redundancy on each DNS-server path to address single-server failure points.
  - Added `dns_bootstrap2` / `dns_bootstrap3` / `dns_bootstrap4` alongside `dns_bootstrap` (119.29.29.29 / 1.1.1.1 / 8.8.8.8).
  - Added `dns_direct2` (doh.pub DoH) alongside `dns_direct`, and `dns_proxy2` (dns.google DoH) alongside `dns_proxy`.
  - Aligned with Clash Party's four `default-nameserver` IPs, two `nameserver` DoH endpoints and four `proxy-server-nameserver` DoH endpoints.
- ✅ FIX#SING-RULESET-DEDUP: removed duplicate .srs downloads from route.rule_set.
  - Removed `geosite-cn` / `geoip-cn`, whose URLs duplicated provider-derived `cn` / `cn-ip`.
  - DNS rules reused existing `cn` / `cn-ip` tags, reducing redundant downloads by approximately 2–5 MB.

<a id="v5417-sing2-2026-05-26"></a>

## v5.4.17-sing.2 (2026-05-26)

- ✅ FIX#DNS-SINGBOX-SELECTOR: changed `dns_proxy.detour` back to `🚀 节点选择`.
  - Prevented default international DNS from bypassing the user's main selector and entering the `🌍 全球节点` urltest chain directly.
  - Preserved Cloudflare DoH and the `dns_bootstrap` bootstrap structure.

<a id="v5417-sing1-2026-05-26"></a>

## v5.4.17-sing.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP: regenerated Full JSON with the generator to synchronize v5.4.17 split-bootstrap DNS semantics.
  - Kept IP-only `dns_bootstrap`; changed `dns_direct` to AliDNS DoH and `dns_proxy` to Cloudflare DoH.
  - Added `geosite-private` / `geosite-cn` / `geoip-cn` DNS rule sets, explicitly routing China and private domains through `dns_direct`.
  - Kept `dns.final` as `dns_proxy`.

<a id="v5416-sing2-2026-05-22"></a>

## v5.4.16-sing.2 (2026-05-22)

- ✅ FEAT#GAME-ACCEL: regenerated Full JSON and added game-accelerator `process_name -> DIRECT` rules.
  - Added 16 process_name rules for UU / Xiaohei / Xunyou / Leishen / NNer accelerators.
  - The generator converted these automatically from Clash Party JS rules.

<a id="v5416-sing1-2026-05-20"></a>

## v5.4.16-sing.1 (2026-05-20)

- ✅ FIX#149-P0: regenerated Full JSON, adding an early `paddle.com -> 🏦 金融支付` route.
  - The Paddle route in `route.rules` preceded `anti-ad` / `category-ads-all` rejection rules.
  - Aligned `_meta` with Clash Party v5.4.16.

<a id="v5415-sing1-2026-05-20"></a>

## v5.4.15-sing.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER: synchronized Clash Party v5.4.15 metadata and moved the generator baseline to Clash Party v5.4.15.
- ♻️ REFACTOR#AD-FP-MODULE: regenerated Full JSON, preserving early ad-false-positive allowlist ordering at the top of route.rules.

<a id="v5414-sing1-2026-05-20"></a>

## v5.4.14-sing.1 (2026-05-20)

- ✅ FIX#CF-R2-P0: regenerated Full JSON with early `cloudflarestorage.com -> 🌐 国外网站` routing.
  - Generated `route.rules` placed the Cloudflare R2 storage domain before `anti-ad` / `category-ads-all` rejection rules.
  - Aligned `_meta` with Clash Party v5.4.14.

<a id="v5413-sing1-2026-05-19"></a>

## v5.4.13-sing.1 (2026-05-19)

- ✅ FIX#STUN-PORTS: regenerated Full JSON and completed direct-routing rules for standard STUN/TURN ports.
  - Added `5349 / 19302 / 19305 / 19307 -> DIRECT` routes, retaining `3478 / 3479`.
- N/A#FAKE-IP: the static sing-box artifact had no equivalent of Mihomo `fake-ip-filter`.

<a id="v5412-sing1-2026-05-12"></a>

## v5.4.12-sing.1 (2026-05-12)

- META#RD-REALIP: Regenerated Full JSON against Clash Party v5.4.12 after the Mihomo RustDesk real-IP DNS fix.
- N/A#FAKE-IP: sing-box has no Mihomo fake-ip-filter equivalent in this static artifact; RustDesk route semantics are unchanged.

<a id="v5411-sing1-2026-05-12"></a>

## v5.4.11-sing.1 (2026-05-12)

- ✅ FIX#RD-PROC: the generator routed RustDesk `process_name` to `🧑‍💼 会议协作` instead of `DIRECT`.
- ✅ FIX#RD-DOMAIN: retained collaboration-group fallback for `domain_suffix: rustdesk.com`.
- ✅ FIX#DNS-BOOTSTRAP: changed `dns_direct` to `udp://223.5.5.5:53` and regenerated Full JSON (39 rule_set entries / 697 route rules).

<a id="v549-sing1-2026-05-11"></a>

## v5.4.9-sing.1 (2026-05-11)

- ✅ FEAT#LOCAL-TOOLS: the generator synchronized the desktop local-tool direct allowlist from Clash Party v5.4.9.
  - Converted `PROCESS-NAME` automatically to sing-box `route.rules[].process_name -> DIRECT`.
  - Official sing-box `process_name` matching supports only Linux / Windows / macOS; mobile clients did not depend on this list.


<a id="v548-sing1-2026-05-09"></a>

## v5.4.8-sing.1 (2026-05-09)

- ★ ORDER#RULE-TAIL: synchronized trailing route.rules match order with Clash Party v5.4.8.
  - Outbound/UI order was unchanged; only route.rules order changed.

<a id="v547-sing1-2026-05-09"></a>

## v5.4.7-sing.1 (2026-05-09)

- ★ FEAT#TikTok: added independent `🎵 TikTok` group (32 service groups), between `📺 国内流媒体` and `🎥 Netflix`.
  - Added `TOK: '🎵 TikTok'` to BIZ and the corresponding selector to businessOutbounds, then regenerated Full JSON.
- ★ FIX#HK: SingBox uses static outbounds without runtime node classification, so it was exempt under §1.4.

<a id="v546-sing1-2026-05-08"></a>

## v5.4.6-sing.1 (2026-05-08)

- ★ FEAT#145: added direct WeChat CDN routing: `domain_suffix: cdn.weixin.qq.com` → `outbound: DIRECT`.
  - Placed after iwipwedabay.com and before binance.
  - Followed v5.4.6 baseline.

<a id="v545-sing1-2026-05-07"></a>

## v5.4.5-sing.1 (2026-05-07)

- ★ Moved global nodes first and synchronized group ordering across products, following v5.4.5.

<a id="v544-sing1-2026-05-07"></a>

## v5.4.4-sing.1 (2026-05-07)

- ★ FIX#144: routed bbys.app video playback directly with `domain_suffix: bbys.app` → `outbound: DIRECT`.
  - Existing rule providers did not cover this domain. Video-CDN subdomains could resolve to non-CN IPs and use a proxy, potentially producing a black screen.
  - Regenerated automatically from the Clash Party v5.4.4 baseline.
- ★ FIX#142 (DNS nameserver fallback): SingBox has no runtime DNS-creation logic and was exempt.
- ★ FEAT#143 (IEPL/IPLC residential classification): SingBox uses static outbounds rather than runtime node classification and was exempt.
- Bump: `v5.4.0-sing.1` → `v5.4.4-sing.1`

<a id="v540-sing1-2026-05-05"></a>

## v5.4.0-sing.1 (2026-05-05)

- ★ FEAT#SG: added independent `🇸🇬 狮城节点` and `🏡 狮城家宽` groups.
  - Split Singapore into a separate region from `🌏 亚太节点`.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Followed Clash Party v5.4.0.

<a id="v532-sing1-2026-04-28"></a>

## v5.3.2-sing.1 (2026-04-28)

- ★ **Forced DIRECT for the WeChat/QQ process family**, following Clash Party v5.3.2 and regenerated automatically.
  - Added WeChatAppEx.exe / QQ.exe / WeChat.exe → `DIRECT` in `route.rules[].outbound`.
  - Version `v5.3.1-sing.1` → `v5.3.2-sing.1`.

<a id="v531-sing1-2026-04-28"></a>

## v5.3.1-sing.1 (2026-04-28)

- ★ **Forced DIRECT for Weixin.exe**, following Clash Party v5.3.1 and regenerated automatically.
  - Changed Weixin.exe in `route.rules[].outbound` to `DIRECT` from `🏠 国内网站`.
  - Version `v5.3.0-sing.1` → `v5.3.1-sing.1`.

<a id="v530-sing1-2026-04-26"></a>

## v5.3.0-sing.1 (2026-04-26)

- ★ REFACTOR#2: changed streaming grouping from region-based to platform-based (7 → 13 groups).
  - Added independent Netflix / Disney+ / HBO/Max / Hulu / Prime Video groups.
  - Split global YouTube / music-streaming groups.
  - Retained Hong Kong / Taiwan / Japan-Korea / Europe regional streaming groups.
  - Added other-international-streaming fallback for long-tail platforms and former Southeast Asia streaming.
  - Service groups: 25 → 31; total groups: 43 → 49.
<a id="v5211-sing1-2026-04-26--业务组合并精简-2825降低用户认知负担"></a>

## v5.2.11-sing.1 (2026-04-26) — Consolidated service groups 28→25 to simplify selection

- ★ REFACTOR#1: followed v5.2.11 to consolidate service groups and reduce selection complexity.
  - Merged search engines and developer services into tools/services.
  - Merged mail services into international sites.
  - Merged cloud/CDN into international sites.
  - Changed downloads/updates from DIRECT-first to proxy-first.
  - Retained independent BT/PT Tracker.
- Bump: `v5.2.10-sing.1` → `v5.2.11-sing.1`

<a id="v5210-sing1-2026-04-25--境外-doh-端点改路由到--受限网站"></a>

## v5.2.10-sing.1 (2026-04-25) — Routed international DoH endpoints through `🚫 受限网站`

- ★ **FIX#39** (cross-client synchronization): regenerated automatically against Clash Party v5.2.10.
  - `route.rules[].outbound`：
    - `dns.google` / `dns.google.com`: `☁️ 云与CDN` → `🚫 受限网站`.
    - `cloudflare-dns.com` (domain_suffix): `☁️ 云与CDN` → `🚫 受限网站`.
  - Kept `dns.servers[].server: cloudflare-dns.com`, which defines a DoH upstream server rather than a routing rule.
- ★ Synchronized the generator's top-level `VERSION` / `BASELINE` constants in `SingBox(sing-box)-generator.js`.
- Bump: `v5.2.9-sing.3` → `v5.2.10-sing.1`, aligning the main version with v5.2.10.

---

<a id="v529-sing3-2026-04-25--兼容性审计修复"></a>

## v5.2.9-sing.3 (2026-04-25) — Compatibility-audit fixes

- ★ FIX-Sing-01: added DNS `domain_resolver` to avoid circular domain-resolution dependencies.
  - Added bootstrap `dns_bootstrap` (UDP 53 → 223.5.5.5).
  - Added `domain_resolver: "dns_bootstrap"` to `dns_direct` / `dns_proxy`.
  - Official documentation requires `domain_resolver` when HTTPS DNS uses a domain name.
- ★ FIX-Sing-02: migrated `download_detour` to `http_client`, recorded as deprecated in sing-box v1.14.0+.
  - Replaced all approximately 50+ rule_set entries with `http_client: { detour: "🌍 全球节点" }`.
  - Updated `SingBox(sing-box)-generator.js` accordingly.
- ★ FIX-Sing-03: removed deprecated `cache_file.store_rdrc` (deprecated in v1.14.0, removed in v1.16.0).
- Bump: `v5.2.8-sing.2` → `v5.2.9-sing.3`, build 2026-04-25

<a id="v528-sing2-2026-04-23--修复港澳台-b-站szkane-bilihmt缺失"></a>

## v5.2.8-sing.2 (2026-04-23) — Restored missing Bilibili HMT rules (szkane-bilihmt)

- ★ FIX: the Full configuration had **silently omitted** `szkane-bilihmt`, the Bilibili Hong Kong/Macao/Taiwan rule set.
  - Cause: `toSrsUrl()` in `SingBox(sing-box)-generator.js` recognized only MetaCubeX `meta-rules-dat@meta/*.mrs` and DustinWin ads URLs. szkane `ClashRuleSet@main/Clash/Ruleset/BilibiliHMT.list` did not match, so `filter(Boolean)` dropped its provider and `availableRuleSets` reduced `RULE-SET,szkane-bilihmt,🇭🇰 香港流媒体` to `null`.
  - Consequently, domains such as `p.bstarstatic.com` / `upos-bstar-*.akamaized.net` matched later rules or FINAL rather than `🇭🇰 香港流媒体`, potentially triggering Bilibili HMT 412 checks. This records historical routing behavior, not an access recommendation.
- ★ Fix: special-cased `szkane-bilihmt` in the `RULE-SET` branch of `toSingRule()`, replacing its remote rule_set reference with inline default rules: five `domain`, three `domain_suffix` and 13 `ip_cidr` values, 21 total matching szkane upstream.
  - The historical verification relied on OR combination of `domain` / `domain_suffix` / `ip_cidr` within a sing-box default rule; see [sing-box Route Rule](https://sing-box.sagernet.org/configuration/route/rule/).
- ★ Bumped Full `_meta.version` to `v5.2.8-sing.2`.

<a id="自检摘要"></a>

### Self-check summary

- After regeneration with `node Sing-box内核系/SingBox/SingBox(sing-box)-generator.js`:
  - `route.rules` = 624, one more than sing.1's 623, representing the restored HMT rule.
  - One inline rule had `outbound: "🇭🇰 香港流媒体"` and `domain_suffix` containing `bilibili.com` / `bilibili.tv` / `acgvideo.com`.
  - The selector/urltest `outbounds` count remained 47.
- JSON validity passed: `python3 -c 'import json;json.load(open("Sing-box内核系/SingBox/SingBox(sing-box)-full.json"))'`.

<a id="官方文档证据"></a>

### Official documentation evidence

- [sing-box Route Rule](https://sing-box.sagernet.org/configuration/route/rule/): fields in the same default-rule category (`domain` / `domain_suffix` / `domain_keyword` / `ip_cidr` / `ip_is_private`, etc.) combine with `||`, while categories combine with `&&`. The record therefore accepted OR semantics for domain/ip_cidr in one inline rule.

---

<a id="v526-sing5-2026-04-23--删除-singbox-非-full-产物"></a>

## v5.2.6-sing.5 (2026-04-23) — Removed non-Full SingBox artifacts

- ★ Removed the old non-Full SingBox JSON artifact, retaining only Full in this directory.
- ★ Changed `Sing-box内核系/SingBox/SingBox(sing-box)-generator.js` to read and rewrite `Sing-box内核系/SingBox/SingBox(sing-box)-full.json`, using Full as the layout template instead of retaining a second importable configuration.
- ★ Removed references to the deleted SingBox file from its README, root README, project contract, issue templates and workflows.
- ★ Bumped Full `_meta.version` to `v5.2.6-sing.5`.

<a id="自检摘要-1"></a>

### Self-check summary

- `node Sing-box内核系/SingBox/SingBox(sing-box)-generator.js` could regenerate Full.
- JSON parsing passed for `Sing-box内核系/SingBox/SingBox(sing-box)-full.json`.
- Full retained 38 selector/urltest outbound groups, 39 remote rule_set entries and 623 routing rules.

---

<a id="v526-sing4-2026-04-23--修复-dns-rule_set-引用--full-规则集-url-兼容"></a>

## v5.2.6-sing.4 (2026-04-23) — Fixed DNS rule_set references and Full rule-set URL compatibility

- ★ Aligned `dns.rules[*].rule_set` with Full's `route.rule_set` tags to avoid references to undefined sets.
- ★ Stopped mechanically converting Clash/Mihomo source URLs to `.srs` in the Full generator.
  - Mapped MetaCubeX `meta-rules-dat@meta/*.mrs` correctly to `meta-rules-dat@sing/*.srs`.
  - Switched DustinWin `anti-ad` to its `sing-box-ruleset/ads.srs`.
  - Stopped presenting Clash YAML/list sources from blackmatrix7 / ACL4SSR / Accademia and others as `.srs`.
- ★ Generated ad routes uniformly with `action: "reject"` rather than directing them to an ad selector containing only `DIRECT`.

<a id="官方文档证据-1"></a>

### Official documentation evidence

- [sing-box Rule Set](https://sing-box.sagernet.org/configuration/rule-set/): remote rule sets require `tag` / `format` / `url`; `format` is `source` or `binary`.
- [sing-box Source Format](https://sing-box.sagernet.org/configuration/rule-set/source-format/): `source` means sing-box JSON `{version,rules}`, not Clash YAML.
- [sing-box DNS Rule](https://sing-box.sagernet.org/configuration/dns/rule/): DNS rules can match defined rule sets using `rule_set`.
- [sing-box Route Rule Action](https://sing-box.sagernet.org/configuration/route/rule_action/): `reject` is a native action.
