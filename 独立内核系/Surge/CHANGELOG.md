<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Surge changelog" width="100%">
</picture>

<a id="surge--变更日志"></a>

# Surge — Changelog

> Manual links use currently accessible paths. Historical entries retain their original semantics and do not imply that old fields remain supported by current versions.

> Changelog for `独立内核系/Surge/Surge.conf`. Major versions follow Clash Party; the `-Surge.N` suffix increments independently.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Project README](../../README.md) · [Documentation index](../../docs/README.md)

## v6.0.21-Surge.14 (2026-10-28)

- Moved Google FCM from downloads to Google services. The 15 domains, 26 IPv4 predicates, rule order and 55 groups were unchanged, as were other push services, DNS and fake-IP.

## v6.0.20-Surge.13 (2026-10-24)

- Organized client directories by core family, retaining files/guides within client subdirectories. Rule semantics/fields were unchanged. Raw configuration URLs changed with paths, requiring reimport; shared `rulesets/` URLs remained unchanged.

## v6.0.20-Surge.12 (2026-10-20)

- FIX#190: removed `198.18.0.0/15` from `[General].tun-excluded-routes` to prevent Surge's own Fake IP pool and DNS responder being excluded from VIF. Other bypass routes, DNS servers and business rules were retained.
- Added regressions for the complete Fake IP pool and both traffic-option renderings. Contract validation prohibited exclusion routes overlapping the pool, including supernets/subnets, and was integrated into CI.
- Rechecked [Advanced DNS](https://manual.nssurge.com/dns/advanced.html) and [General](https://manual.nssurge.com/profile/general.html#tun-excluded-routes). See [REFERENCE](REFERENCE-surge-manual.md#vif-与-fake-ip-接管约束) for the cross-client static audit and why Loon/Shadowrocket retained their settings. This native Surge VIF fix did not change the source graph or fused assets and required no other artifact regeneration. No physical-device application acceptance was performed; recovery needed retesting on the reporter's device.

## v6.0.20-Surge.11 (2026-10-19)

- Removed the unrecognized `[DNS]` section and its two ineffective keys, preserving `[General]` DNS servers, order and outbound mode. Multiple encrypted DNS servers raced for the first response; plain DNS was neither a timeout fallback for ordinary domains nor automatic proxy failover.
- Corrected official-protocol documentation for TUIC v5, Hysteria 2, AnyTLS and Mac-only External support. Saved official text, stable-release and prerelease metadata; see the [Apple client review](../../docs/upstream/2026-10-19/apple/report.md).
- Changed only Surge native configuration and documentation; other clients did not have this `[DNS]` section. Static validation did not replace DNS-failure and traffic validation inside Surge.

## v6.0.20-Surge.10 (2026-10-16)

- Issue #187: added exact DIRECT exceptions in existing `scki-adfp-direct` for `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, `hkshort.weixin.qq.com`, preventing WeChat connection endpoints from matching ads first.
- No parent/subdomain expansion; `ad.weixin.qq.com` and `log.weixin.qq.com` remained rejected. Other policies and ordering were unchanged.
- See [WeChat review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence and bounded static acceptance. Reporter-device recovery still required retesting.

## v6.0.19-Surge.9 (2026-10-15)

- FIX#186: unified repository-owned remote assets on GitHub raw HTTPS to avoid jsDelivr repository-size limits, preserving version queries and native formats.
- Reused verified fused payloads; content, ordering and policies were unchanged. Added raw/CDN-reference regressions. See [delivery guidance](../../docs/rule-asset-delivery.md) for cause, download prerequisites and official fields.

## v6.0.18-Surge.8 (2026-10-14)

- Fixed cross-service first-match misclassification: narrowed broad Apple/Microsoft keywords and shared AWS/Azure/CDN suffixes, adding eight guard classes: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social, bytedance-app. Six ADFP records for exact CA revocation/status hosts via DIRECT and exact Microsoft international-mail policy brought the total to 35. `api.byteoversea.com` was an exact TikTok rule, not a shared-suffix expansion. Existing Claude Desktop `a-api`/`a-cdn` exceptions, QUIC/latency options and default-off ZeroTier proxy remained. Crisp relay was a static ASN-overlap risk inference, not a measured incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 nonempty SRS across 81 segments.

## v6.0.17-Surge.7 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to `scki-adfp-ai` for Claude Desktop application-code/user-content loading through AI policy. Based on [official requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Existing rule sets/native syntax remained. Source-semantic gates, 29 ADFP checks, Claude stage inventory and file-level release-batch checks joined the publication chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device reproduction or measurement occurred.

## v6.0.16-Surge.7 (2026-10-12)

- Following v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional ADFP validation. Conversion format, order and target policies remained; no runtime rules were added. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording only observable bytes and conversion receipts. Original remote-input SHA values cannot be reconstructed from old outputs; no claim of complete historical provenance or real-device traffic measurement was made.

## v6.0.15-Surge.7 (2026-10-07)

- Managed configuration supported a 900-second result-validity period and a non-CN UDP/443 policy option; automatic groups retested on use through Surge's native mechanism.
- See [latency and QUIC options](../../docs/traffic-options.md) for switching commands, capabilities and verification.

## v6.0.14-Surge.6 (2026-09-29)

- FIX: added the two exact WeChat HTTPDNS hosts to remote DIRECT RULE-SET 001, preceding BlockHttpDNS rejection.

## v6.0.13-Surge.5 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE: remote RULE-SET 013 gained `DOMAIN-SUFFIX,linuxdo.org` targeting `🏠 国内网站`; `linux.do` retained the restricted-sites policy.

## v6.0.12-Surge.4 (2026-09-01)

- FIX#181-PC: the first fused remote RULE-SET gained exact direct routing for `login.nvidia.cn`, preceding broad NVIDIA download rules. Other NVIDIA domains were unchanged.

## v6.0.11-Surge.3 (2026-08-22)

- ROUTING: synchronized 69 fused remote RULE-SETs. Gemini and Accademia Gemini first matches moved to `🔍 Google 服务`; other AI policies were unchanged.

## v6.0.10-Surge.3 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: synchronized the leading exact-direct fused rules; the two NetEase game-service hosts matched `DIRECT` before anti-AD and broad CN-game rules.

## v6.0.9-Surge.2 (2026-08-02)

- FIX-NODE-ISO-LOWERCASE: 11 region/residential policy-regex-filter entries gained a lowercase two-letter ISO code immediately followed by digits alongside uppercase matching. Numbered yun hk01, yun us01, yun jp01, yun sg01 and yun tw01 names now entered their regional policy groups.
- GUARD/VERIFY: ordinary short lowercase words were not broadened into region codes. The cross-client contract ran 12 real naming samples covering main/aggregate groups, residential filtering and protection for unnumbered short words.

## v6.0.9-Surge.1 (2026-07-19)

- Added a generic GitHub API tools-group fused segment before upstream broad AI rules; macOS/iOS used the generic fallback where Windows process rules were unavailable.

## v6.0.8-Surge.1 (2026-07-15)

- Fused RULE-SETs synchronized authoritative CN-policy precedence and referenced self-hosted assets with release-version cache keys.

## v6.0.7-Surge.1 (2026-07-14)

- FIX#176: synchronized fused remote RULE-SET order so CN-domain policies preceded generic international CDN / GeoIP fallback; placing fallback later prevented non-CN IP rules from preempting CN domains.

## v6.0.6-Surge.1 (2026-07-14)

- PLATFORM: desktop artifacts handled direct routing for Windows `WorkPro.exe` / `WorkProWebProcess.exe`. Surge did not emit Windows process rules and continued consuming synchronized fused text assets.

## v6.0.5-Surge.1 (2026-07-14)

- PLATFORM: WorkPro.exe was a Windows desktop direct-routing entry, not a Surge Mac-specific process rule. Windows Mihomo, sing-box and Xray artifacts handled the actual match.

## v6.0.4-Surge.1 (2026-07-13)

- DIRECT-ITWDB: the default `DIRECT` fused text segment gained `DOMAIN-SUFFIX,itwdb.com`, retaining source-graph first-match order and covering WorkPro subdomains.

## v6.0.3-Surge.1 (2026-07-12)

- SYNC: upgraded to Clash Party v6.0.3, consuming 64 nonempty fused RULE-SETs in source-graph first-match order.
- AI-PRECEDENCE: OpenAI / ChatGPT, oaistatic, Cloudflare NEL and necessary telemetry entered `🤖 AI 服务` before generic advertising and international-site segments.

## v6.0.2-Surge.1 (2026-07-10)

- FIX#175: reduced 71 inflated shards to 63 nonempty fused RULE-SETs, with aggregate text around 16.07 MiB / 575,673 rules, within the iOS aggregate budget.
- GEOIP/ASN: country GEOIP and IP-ASN used native Surge rules; service GEOIP converted according to platform capabilities, and `no-resolve` modifiers were no longer lost.
- DEDUP: rechecked final Surge text file by file; additional removable exact duplicates, covered domains and contained CIDRs were all 0.

## v6.0.1-Surge.1 (2026-07-10)

- FIX#174: split the advertising fused segment exceeding the CDN per-file budget into 3 RULE-SETs and the international-site tail into 2; each shard was at most 18 MiB.
- SEMANTICS: every added RULE-SET retained its original policy and order, leaving advertising, international-site and all other business-group precedence unchanged.

## v6.0.0-Surge.1 (2026-07-09)

- FUSED-RULESETS: migrated to 68 fused remote RULE-SETs, retaining necessary local port/fallback rules.
- META: updated version metadata to Clash Party v6.0.0; policy groups were unchanged.

## v5.4.39-Surge.1 (2026-07-09)

- META: updated version metadata to Clash Party v5.4.39.
- N/A: Surge did not support Mihomo `.mrs` rule-providers; rule semantics remained v5.4.38-Surge.1.

## v5.4.38-Surge.1 (2026-07-09)

- SCKI-SUPPLEMENTAL: replaced scattered inline local allowlist entries with 13 Clash supplemental `RULE-SET`s + 2 Surge process supplemental `RULE-SET`s.
- SYNC: aligned version metadata with Clash Party v5.4.38.

## v5.4.37-Surge.1 (2026-06-29)

- META#170-DNS-POLICY: updated version metadata to Clash Party v5.4.37.
- N/A: Surge used `dns-server` / `encrypted-dns-server` / `fallback-dns-server` without an equivalent Mihomo `nameserver-policy` field surface. Rule and DNS semantics were unchanged.

## v5.4.36-Surge.1 (2026-06-29)

- CLEAN#171-DIRECT: removed 22 individually confirmed redundant `DOMAIN` / `DOMAIN-SUFFIX` rules; remote rule sets were unchanged.
- AI / Binance / Microsoft-login candidates remained because earlier different-policy MRS prevented safe deletion.

## v5.4.35-Surge.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM: removed 5 remote RULE-SETs already covered by earlier same-target rules: Marketing, EncoreTVB, FindMy, WildRift and AcFun.
- CLEAN#170-DIRECT: removed three later inline rules already covered by the earlier same-target Douyin China-streaming guard: `douyin.com`, `douyinpic.com`, `douyinvod.com`.
- Measured remote RULE-SET count changed 288 → 283; matching order was unchanged.

## v5.4.34-Surge.1 (2026-06-28)

- ★ FIX#169-AMAP: added blackmatrix7 Surge `GaoDe.list` targeting `🏠 国内网站`.
- Kept it after advertising/threat rules and before the international-site fallback, addressing the risk of the `webapi.amap.com` Amap API matching that fallback.

## v5.4.33-Surge.1 (2026-06-27)

- ★ FEAT#169-AI-CODING: added VPSDance Surge `coding.list` targeting `🤖 AI 服务`.

## v5.4.32-Surge.1 (2026-06-25)

- ★ FIX#168-CN-GAME: placed CN-game inline rules and RULE-SETs such as SteamCN before international-game RULE-SETs to prevent broad HoYoverse/Game rules matching first.
- Aligned the file header and README with Clash Party v5.4.32.

## v5.4.31-Surge.1 (2026-06-20)

- ★ FIX#167-DOUYIN: added leading Douyin Web CN-streaming rules so `douyin.com`, `zjcdn.com` and related domains matched `📺 国内流媒体` before TikTok and international rule sets.
- Aligned the file header and README with Clash Party v5.4.31.

## v5.4.30-Surge.1 (2026-06-17)

- ★ FEAT#166-GOOGLE: added `🔍 Google 服务` before `🔧 工具与服务`.
- Google Search / Drive / Earth / Google / Scholar rule sets moved to the new group; the tools group retained non-Google search and developer services only.

## v5.4.29-Surge.1 (2026-06-10)

- ★ PERF#165-LATENCY: changed 22 regional `url-test` groups from `interval=180 -> interval=300`.
- Updated README regional-group descriptions to 300s / 5 minutes; business policies, DNS and RULE-SETs were unchanged.
- Aligned the file header with Clash Party v5.4.29.

## v5.4.27-Surge.1 (2026-06-07)

- ★ CLEAN#165: removed 7 inline domains already covered by earlier remote rule sets (Claude / PayPal / HBO / Hulu / Xbox); they still matched the same policy groups afterward.

## v5.4.26-Surge.1 (2026-06-07)

- ★ FIX#164: protected Tencent WorkBuddy `copilot.tencent.com` from misclassification: the `DOMAIN-KEYWORD,copilot` substring in szkane `AiDomain.list` incorrectly sent it to `🤖 AI 服务`, whose proxy routing caused conversation errors. Added `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站` before szkane AiDomain RULE-SET alongside the existing RustDesk guard. Baseline: Clash Party v5.4.26.

## v5.4.25-Surge.1 (2026-06-04)

- ★ SYNC: aligned artifact header/version and baseline statements with Clash Party v5.4.25. Rule semantics remained v5.4.23-Surge.2, without new Surge-specific rule changes.

## v5.4.23-Surge.2 (2026-06-02)

- ★ FIX#162: addressed remote-rule-list loading failures:
  - Removed expired HaGeZi `share/surge-tif-medium.txt` (jsDelivr 403; HaGeZi then had no equivalent Surge RULE-SET format).
  - Removed the upstream-deleted `独立内核系/Surge/RemoteDesktop/RemoteDesktop.list` (only Clash retained process-name rules, not applicable to Surge iOS/macOS rule sets).
  - Corrected `BiliIntl/BiliIntl.list` to the then-current upstream `BiliBiliIntl/BiliBiliIntl.list` path.
  - Sukka phishing continued using native Surge-loadable `List/domainset/reject_phishing.conf`.

## v5.4.23-Surge.1 (2026-06-02)

- ★ FIX#161: `DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` targeted `🏠 国内网站` direct routing for Zhihu image CDN/short links, matching the baseline.

## v5.4.22-Surge.1 (2026-05-31)

- ★ Added GeTui push SDK `getui.com` / `getui.net` / `gepush.com` to direct exceptions after review. Continuing #2, generic ad/privacy feeds treated them as trackers despite carrying application push such as Mi Home; the owner chose to allow them.

- N/A#1 QUIC refinement: Surge block-quic was an engine-level switch without AND/NOT allowlist exemptions. Mihomo artifacts provided fine-grained QUIC control.

## v5.4.21-Surge.1 (2026-05-31)

#4 Adopted from Proxy-override: changed `encrypted-dns-server` / `fallback-dns-server` from domain-host DoH to IP-host DoH. The historical entry recorded elimination of bootstrap-stage DNS leakage, while retaining plain-IP `dns-server` fallback; this is not a new universal leak-free guarantee.

## v5.4.20-Surge.1 (2026-05-30)

- N/A#6 additional node-filter keywords (batch B): Surge did not remove subscription junk at runtime and had no runtime junk filter, so #6 did not apply. The version followed Clash Party v5.4.20.

## v5.4.19-Surge.1 (2026-05-30)

Proxy-override adoption batch A · #2 leading CN SDK/CDN direct rules (following Clash Party v5.4.19; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`):

- Placed jpush / `msg.umeng.com` before advertising RULE-SETs with forced DIRECT to carry legitimate application push/messages, aligning with the Mihomo family.
- Added `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` to the `🏠 国内网站` segment.
- #3 fake-ip-filter did not apply (Surge had no such field), nor did #5 direct-nameserver-follow-policy (not a Mihomo core).
- 🔢 Version: v5.4.17-Surge.1 → v5.4.19-Surge.1 (all products skipped the invalidated .18 and aligned at v5.4.19).
## v5.4.17-Surge.2 (2026-05-30)

- ★ FIX#KR-WB: added `(?<![a-zA-Z])KR(?![a-zA-Z])` word boundaries to bare `KR` in Japan/Korea and APAC `policy-regex-filter`, consistent with US/SG patterns in this file.
  - Under case-sensitive matching, only uppercase `KR` substrings were false positives (KRAKEN / DARKROOM → `🇯🇵 日韩节点`); boundaries removed those matches.
  - Covered four node/residential lines for Japan/Korea and APAC; complete KOR/Korea/Seoul/🇰🇷 matches were unaffected.
  - §1.5 parallel audit: mainline JS + CMFA already had boundaries and were unchanged.
  - Regression tests: `tools/test-kr-boundary.js`.

## v5.4.17-Surge.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP: synchronized Surge DNS with the platform-equivalent v5.4.17 representation.
  - `dns-server` retained only the plain-IP bootstrap list.
  - `encrypted-dns-server` carried CN/non-CN DoH; `fallback-dns-server` was fixed to Cloudflare + Google DoH.
  - Surge lacked Mihomo's four-way `direct-nameserver` / `proxy-server-nameserver` separation, so native fields provided a best-effort mapping.

## v5.4.16-Surge.3 (2026-05-26)

- ✅ FIX#SURGE-PORT-RULE: standardized Surge port rules on official `DEST-PORT`.
  - Fixed the import error reporting invalid configuration on line 331: `DST-PORT,7680,REJECT`.
  - Based on [Surge Manual `Misc Rule / DEST-PORT`](https://manual.nssurge.com/rules/source-and-port.html#dest-port); Shadowrocket / Mihomo / OpenClash `DST-PORT` syntax was unaffected.

## v5.4.16-Surge.2 (2026-05-22)

- ✅ FEAT#GAME-ACCEL: added game-accelerator `PROCESS-NAME -> DIRECT` exceptions.
  - Added 13 PROCESS-NAME rules (UU / Xiaohei / Xunyou / Leigod / NNer accelerators, using names with only the .exe suffix removed for macOS + iOS).

## v5.4.16-Surge.1 (2026-05-20)

- ✅ FIX#149-P0: placed `DOMAIN-SUFFIX,paddle.com,🏦 金融支付` earlier.
  - Overrides anti-AD/DustinWin false-positive blocking of `analytics.paddle.com`.
  - Kept the same ordering as Shadowrocket, before anti-AD / phishing / TIF remote rules.

## v5.4.15-Surge.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER: synchronized v5.4.15 metadata and added GEOSITE coverage references.
- ♻️ REFACTOR#AD-FP-MODULE: explicitly labeled the top of stage 1 as Anti-ad false-positive allowlist and placed both Xiaomi false-positive exceptions and Cloudflare R2 exceptions before advertising/phishing/TIF rules.

## v5.4.14-Surge.1 (2026-05-20)

- ✅ FIX#CF-R2-P0: moved the `cloudflarestorage.com` rule to the top of stage 1.
  - Prevented the Sukka phishing remote source from misrouting Cloudflare R2 object-storage domains to `🛑 广告拦截`.
  - Removed the duplicate later `🌐 国外网站` entry.

## v5.4.13-Surge.1 (2026-05-19)

- ✅ FIX#STUN-PORTS: completed standard STUN/TURN ports `5349 / 19302 / 19305 / 19307 -> DIRECT`.
- N/A#FAKE-IP: Surge had no Mihomo `fake-ip-filter`; QUIC remained controlled by `block-quic = all-proxy`.

## v5.4.12-Surge.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 documentation for the RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Surge has no Mihomo fake-ip-filter field; no new RustDesk DIRECT bypass was added.

## v5.4.11-Surge.1 (2026-05-12)

- ✅ FIX#RD-PROC: Surge Mac RustDesk `PROCESS-NAME` rules moved to `🧑‍💼 会议协作` instead of forced DIRECT.
- ✅ FIX#RD-DOMAIN: kept `rustdesk.com` domain rules before Copilot to prevent broad ASN rules capturing RustDesk relay traffic.
- ✅ FIX#DNS-BOOTSTRAP: reordered CN DoH to prefer AliDNS, consistent with bootstrap semantics on IP-first platforms.

## v5.4.9-Surge.1 (2026-05-11)

- ✅ FEAT#LOCAL-TOOLS: added a Surge Mac local-tool `PROCESS-NAME -> DIRECT` allowlist.
  - Covered common desktop tools including Oray / Sunlogin / AweSun / AnyDesk / ToDesk / RustDesk / TeamViewer / ZeroTier / Tailscale / frpc / frps / ngrok / natapp / cloudflared / Navicat.
  - Official Surge documentation stated that `PROCESS-NAME` was Mac-only and ignored on Surge iOS, so these rules in the shared configuration did not cause iOS import failure.

## v5.4.8-Surge.2 (2026-05-11)

- ★ META#GROUP-COUNT: aligned header/README regional-group counts at 22 (11 all-node + 11 residential).
  - Did not change `[Proxy Group]` / `[Rule]` semantics.

## v5.4.8-Surge.1 (2026-05-09)

- ★ ORDER#RULE-TAIL: synchronized v5.4.8 tail-rule order.
  - `[Proxy Group]` UI order was unchanged; only `[Rule]` order changed.

## v5.4.7-Surge.1 (2026-05-09)

- ★ FEAT#TikTok: added independent `🎵 TikTok` group (32 service groups), between `📺 国内流媒体` and `🎥 Netflix`.
- ★ FIX#HK: appended `|广港` to Hong Kong node `policy-regex-filter`.

## v5.4.6-Surge.1 (2026-05-08)

- ★ FEAT#145: added WeChat CDN direct rule `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT`.
  - Added after `mail.qq.com` in stage 7 (CN mail direct routing), routing the WeChat CDN domain directly.
  - Followed v5.4.6 baseline.

## v5.4.5-Surge.1 (2026-05-07)

- ★ Moved global nodes first and synchronized group ordering across products, following v5.4.5.

## v5.4.4-Surge.1 (2026-05-07)

- ★ FIX#144: added a direct rule for bbys.app, recorded in this version as direct CDN access for that video site.
  - Added `DOMAIN-SUFFIX,bbys.app,DIRECT` at the end of stage 28 (CN-site fallback).
  - Followed Clash Party v5.4.4.
- ★ FEAT#143: residential policy-regex-filter gained IEPL/IPLC/dedicated-line recognition.
  - Appended `[Ii][Pp][Ll][Cc]|[Ii][Ee][Pp][Ll]|专线` to the residential subpattern in all 10 residential regional groups' `policy-regex-filter`.
  - Matched residential-type node names containing IPLC/IEPL/`专线` identifiers.
- ★ Major version v5.4.3 → v5.4.4; Build 2026-05-06 → 2026-05-07.
- FIX#142 (DNS cold start) was specific to Clash Party JS; static configuration files were exempt.

## v5.4.3-Surge.1 (2026-05-06)

- ★ FEAT: residential policy-regex-filter gained `|[Hh]ome` (following Clash Party v5.4.3).
  - Appended `|[Hh]ome` to all 9 residential regional filters, matching names containing only Home as the residential indicator.

## v5.4.2-Surge.1 (2026-05-05)

- ★ FIX#41-P0: Xiaomi core-service DIRECT exceptions, following v5.4.2.
  - Added 11 DOMAIN/DOMAIN-SUFFIX DIRECT rules before the advertising segment.

## v5.4.0-Surge.1 (2026-05-05)

- ★ FEAT#SG: added independent `🇸🇬 狮城节点` and `🏡 狮城家宽` groups.
  - Split Singapore into a separate region from `🌏 亚太节点`.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Followed Clash Party v5.4.0.

## v5.3.0-Surge.2 (2026-04-26)

- ★ FIX: corrected bm7 source URL comments (`rule/Shadowrocket` → `rule/Surge`, a copy/paste error).

## v5.3.0-Surge.1 (2026-04-26)

- ★ REFACTOR#2: changed streaming grouping from region-based to platform-based (7 → 13 groups).
  - Added independent Netflix / Disney+ / HBO/Max / Hulu / Prime Video groups.
  - Split global YouTube / music-streaming groups.
  - Retained Hong Kong / Taiwan / Japan-Korea / Europe regional streaming groups.
  - Added other-international-streaming fallback for long-tail platforms and former Southeast Asia streaming.
  - Service groups: 25 → 31; total groups: 43 → 49.

<a id="v5211-surge1-2026-04-26--业务组合并精简-2825降低用户认知负担"></a>

## v5.2.11-Surge.1 (2026-04-26) — Business groups consolidated 28→25 to reduce navigation complexity

- ★ REFACTOR#1: followed v5.2.11 to consolidate service groups and reduce selection complexity.
  - Merged search engines and developer services into tools/services.
  - Merged mail services into international sites.
  - Merged cloud/CDN into international sites.
  - Changed downloads/updates from DIRECT-first to proxy-first.
  - Retained independent BT/PT Tracker.
- Bump: `v5.2.10-Surge.1` → `v5.2.11-Surge.1`

<a id="v5210-surge1-2026-04-25--境外-doh-端点改路由到--受限网站"></a>

## v5.2.10-Surge.1 (2026-04-25) — Non-CN DoH endpoint routing moved to restricted-sites policy

- ★ FIX#39: synchronized shared behavior with v5.2.10.
  - `DOMAIN,dns.google,☁️ 云与CDN` → `🚫 受限网站`.
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `🚫 受限网站`.
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `🚫 受限网站`.
  - Kept cloudflare/google DoH unchanged in `[General] encrypted-dns-server` (Surge's own upstream DoH configuration).
- Bump: `v5.2.9-Surge.2` → `v5.2.10-Surge.1` (major version aligned at v5.2.10).

<a id="v529-surge2-2026-04-25--移除-url-test-组非法参数-select0"></a>

## v5.2.9-Surge.2 (2026-04-25) — Removed invalid `select=0` from url-test groups

- ★ **FIX-Surge-07-P1**: 18 regional url-test groups contained unsupported `select=0`.
  - Official Surge documentation did not support `select` for url-test groups (only select-type groups supported it);
    Surge could ignore the parameter or exhibit abnormal group behavior.
  - Scope: all 18 regional groups (9 all-node + 9 residential).
  - Fix: removed `select=0,`.
- ★ Corrected the header's `select=0` description accordingly.
- Version `v5.2.9-Surge.1` → `v5.2.9-Surge.2`.

<a id="官方文档证据"></a>

### Official documentation evidence

- Surge url-test group syntax supported `url` / `interval` / `timeout` / `tolerance` / `include-all-proxies` / `policy-regex-filter`, not `select`.

---

<a id="v528-surge6-2026-04-25--欧洲节点-filter-补全-grrohucz-及多国关键词扩充"></a>

## v5.2.8-Surge.6 (2026-04-25) — Completed European filters with GR/RO/HU/CZ and additional country keywords

- ★ **FIX#29-P2** (parallel bug): completed missing European countries in `🇪🇺 欧洲节点` + `🏡 欧洲家宽` filters.
  - The previous OpenClash update added 15 European countries to REGIONS, but iOS artifact EU filters had not followed.
  - Fix: added GR/RO/HU/CZ codes and full keywords to SR/Surge/Loon/QX EU node + residential filters
    (Greece/Athens/Romania/Bucharest/Hungary/Budapest/Czech/Prague + Chinese names + flag emoji).
  - Also expanded PT/BE/IE/DK/NO keywords (city names + Chinese names + 🇵🇹/🇧🇪/🇮🇪/🇩🇰/🇳🇴).
  - Parallel audit: Clash Party JS / OpenClash already covered these; CMFA used include-all-proxies as a global fallback (N/A); SingBox/v2rayN had no runtime node classification (N/A).
- Version `v5.2.8-Surge.5` → `v5.2.8-Surge.6`.

<a id="v528-surge5-2026-04-24--dnspod-doh-端点切换为纯-ip-形式"></a>

## v5.2.8-Surge.5 (2026-04-24) — DNSPod DoH endpoint changed to an IP-only form

- ★ Replaced `https://doh.pub/dns-query` in `encrypted-dns-server` with
  `https://1.12.12.12/dns-query`
  - a DNSPod IP-host DoH endpoint, **avoiding bootstrap resolution of `doh.pub`** for a more reliable cold start.
- Version `v5.2.8-Surge.4` → `v5.2.8-Surge.5`.

<a id="v528-surge4-2026-04-23--基线对齐-clash-party-v528无代码改动"></a>

## v5.2.8-Surge.4 (2026-04-23) — Aligned with Clash Party v5.2.8 (no code changes)

- Baseline bump: `v5.2.6-Surge.3` → `v5.2.8-Surge.4`.
- v5.2.7 (mirror URL change): Surge fetched upstream URLs directly, without the mirror, and needed no change.
- v5.2.8 (CMFA/OpenClash APAC-filter fix): Surge `policy-regex-filter` already fully covered HK/TW/JP/KR and needed no change.

<a id="v526-surge3-2026-04-23--修复区域-url-test-组候选池为空"></a>

## v5.2.6-Surge.3 (2026-04-23) — Fixed empty candidate pools in regional url-test groups

P0 review found 9 regional `url-test` groups with only `policy-regex-filter` and no candidate source. Official Surge documentation required regex filtering together with `include-all-proxies` / `include-other-group` / `policy-path`; otherwise groups could be empty.

<a id="改动"></a>

### Changes

- ★ **FIX#Surge-06-P0**: added `include-all-proxies=true` to all 9 regional groups.
  - `🌍 全球节点`
  - `🇭🇰 香港节点`
  - `🇹🇼 台湾节点`
  - `🇯🇵 日韩节点`
  - `🌏 亚太节点`
  - `🇺🇸 美国节点`
  - `🇪🇺 欧洲节点`
  - `🌎 美洲节点`
  - `🌍 非洲节点`
- ★ Header version `v5.2.5-Surge.2` → `v5.2.6-Surge.3`, Build `2026-04-23`, aligned with Clash Party v5.2.6.

<a id="自检"></a>

### Self-checks

- 37 proxy groups ✓
- 9 regional `url-test` groups, each with `include-all-proxies=true` ✓
- Retained `policy-regex-filter` and regional node-name filtering semantics ✓

<a id="官方文档证据-1"></a>

### Official documentation evidence

- [Surge Policy Including](https://manual.nssurge.com/policy-groups/policy-including.html): `include-all-proxies=true` included every proxy in `[Proxy]` and could be combined with `policy-regex-filter`.

<a id="v525-surge2-2026-04-22--移除-72-条-clash-yaml--anti-ad-cdn--版本对齐"></a>

## v5.2.5-Surge.2 (2026-04-22) — Removed 72 Clash YAML entries, corrected anti-AD CDN and aligned versions

The same inherited Clash Party v5.2.4 issue affected Loon v5.2.4-Loon.2 / .3. Surge's manual explicitly defined RULE-SET as
a **"text file, each line containing a rule declaration"** ([manual.nssurge.com/rule/ruleset.html](https://manual.nssurge.com/rules/ruleset.html));
Clash classical YAML `payload: \n - DOMAIN-SUFFIX,x` did not satisfy that definition. **The historical investigation recorded Surge silently loading it as empty.**

<a id="改动-1"></a>

### Changes

- ★ FIX#Surge-01-P1: **removed 72 Clash classical `.yaml` RULE-SETs** (71 Accademia + 1 ACL4SSR Zoom.yaml).
  - Surge `RULE-SET` expected one plain-text rule per line; an unrecognized YAML `payload:` prefix silently invalidated the rule set.
- ★ FIX#Surge-02-P1：`anti-ad.net/surge.txt` → `fastly.jsdelivr.net/gh/privacy-protection-tools/anti-AD@master/anti-ad-surge.txt`
  - Loon v5.2.4-Loon.3 had confirmed an anti-ad.net failure without CDN: the affected ISP's DNS interception returned HTML, which likewise failed Surge rule parsing.
- ★ FIX#Surge-03-P1: after removing 72 YAML entries, added DOMAIN-SUFFIX fallbacks for critical domains:
  - `🏦 金融支付`: Monzo / N26 / Chime + 24 international banks (Chase / BofA / HSBC / Barclays / DBS / MUFG / RBC / ANZ and others).
  - `🧑‍💼 会议协作`: Zoom × 5 / RustDesk / Parsec × 3.
  - `🌐 国外网站`: Wayback Machine / Pornhub × 3.
- ★ FIX#Surge-04-P2: removed 15 orphaned `# Accademia xxx` section comments whose YAML sections were gone.
- ★ FIX#Surge-05-P2: **aligned the major version**, `v5.2.3-Surge.1` → **`v5.2.5-Surge.2`** (Clash Party JS `VERSION='v5.2.5'`).
- ★ Build `2026-04-20` → `2026-04-22`; header architecture `250+ RULE-SET` → `~290 RULE-SET`.

<a id="保留项surge-官方支持与-loon-不同"></a>

### Retained items (officially supported by Surge, unlike Loon)

Deep review found that an agent had incorrectly treated these native Surge fields as Loon-only. Official documentation confirmed that **all were retained**:

- `FINAL,🐟 漏网之鱼,dns-failed` ✓ ([Surge manual rules](https://manual.nssurge.com/rules/overview.html): fallback on DNS failure, a Surge-specific feature).
- `bypass-system`, `tun-excluded-routes`, `hijack-dns`, `udp-policy-not-supported-behaviour` ✓ (native [misc-options](https://manual.nssurge.com/profile/general.html) fields).
- Sukka `List/domainset/reject_phishing.conf` ✓ (Surge natively supported DOMAIN-SET; Loon/QX required `non_ip/`, but Surge did not).
- `encrypted-dns-server` / `geoip-maxmind-url` / `read-etc-hosts` / `exclude-simple-hostnames` ✓ (Surge-specific fields).

<a id="自检-1"></a>

### Self-checks

- 37 proxy groups ✓
- Remaining `.yaml,` RULE-SETs: 0 ✓
- Remaining `anti-ad.net` references: 0 ✓
- Retained `FINAL,...,dns-failed`: 1 ✓ (native Surge support).
- Lines: 1391 → 1348 (net -43; removed 72 YAML + 15 orphaned comments, added about 40 DOMAIN-SUFFIX fallbacks).

<a id="已接受的回归损失"></a>

### Accepted coverage regression

As with Loon / SR / QX, Accademia `Bank × 10 countries` / `FakeLocation × 10` / `GeoRouting × 17 regions` / `eMuleServer` / `HomeIP` had no equivalent `.list` sources; critical domains received fallbacks. The historical entry identified CMFA / OpenClash / SingBox as alternatives retaining full coverage.

<a id="官方文档证据-2"></a>

### Official documentation evidence

- [Surge Ruleset manual](https://manual.nssurge.com/rules/ruleset.html): ruleset file = "text file, each line containing a rule declaration" (not YAML).
- [Surge misc-options](https://manual.nssurge.com/profile/general.html): native support for `bypass-system` / `tun-excluded-routes` / `hijack-dns` / `udp-policy-not-supported-behaviour`.
- [Surge DNS kb](https://kb.nssurge.com/surge-knowledge-base/technotes/dns): native support for `FINAL, policy, dns-failed`.

---

<a id="v523-surge1-2026-04-20--初版"></a>

## v5.2.3-Surge.1 (2026-04-20) — Initial version

- ★ Migrated from Shadowrocket v5.2.2-SR.2, retaining 9 regional url-test groups + 28 business select groups + about 930 rules.
- ★ Adapted native Surge `[General]` fields:
  - `encrypted-dns-server` (dedicated DoH field).
  - `geoip-maxmind-url` (MMDB specified directly in configuration, without manual UI download).
  - `disable-geoip-db-auto-update`
  - `read-etc-hosts` (reads system hosts).
- ★ Removed SR-specific / ineffective fields:
  - `private-ip-answer`
  - `dns-direct-fallback-proxy`
  - `proxy-dns-server`
  - `fallback-dns-server` (at this version, Surge used `encrypted-dns-server` + `dns-server` together).
- ★ `FINAL,🐟 漏网之鱼,dns-failed` (Surge-style FINAL with `dns-failed` fallback).

<a id="与-clash-party-主线的差异surge-引擎限制"></a>

### Differences from the Clash Party mainline (Surge engine limits)

- No PROCESS-NAME in this version (supported by Surge Mac but not iOS, so removed for cross-platform consistency).
- No Smart groups + LightGBM (Surge was not Mihomo).
- No fpByPurpose TLS fingerprint injection (Surge did not expose uTLS controls).
- No GEOSITE (Surge used RULE-SET + built-in MMDB; precise GEOIP labels depended on replacing MMDB).
- No independent rule-provider scheduling (Surge relied on RULE-SET URLs + unified automatic subscription updates).
