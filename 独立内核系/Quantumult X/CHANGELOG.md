<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Quantumult X changelog" width="100%">
</picture>

<a id="quantumult-x--变更日志"></a>

# Quantumult X — Changelog

> Changelog for `独立内核系/Quantumult X/QuantumultX.conf`. Major versions follow Clash Party; the `-QX.N` suffix increments independently.
>
> The repository has no `tools/srk_to_qx.py`; this artifact is independently maintained by hand, with structural/baseline validation by `tools/validate-artifact-contracts.js`.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Project README](../../README.md) · [Documentation index](../../docs/README.md)

## v6.0.21-QX.14 (2026-11-07)

- Fixed line 13 import failure from `running_mode_trigger=auto, auto, auto`, changing it to `filter, filter` according to the pinned official example without adding SSID exceptions.
- Corrected QX.2 / #114's mistaken assessment of legal modes: `filter` is the official rule mode; subsequent entries must be `SSID:mode`, not a third bare mode. Historical entries remain for traceability, not as current syntax guidance.
- The validator parsed two default modes plus optional SSID mappings. Added positive/negative cases for official examples, old invalid values, empty items, duplicate keys and incorrect sections so tests prohibiting a correct value could not conceal the error again.
- Official basis: [sample.conf at a pinned commit](https://github.com/crossutility/Quantumult-X/blob/af6fb594233ec4a3ec6d4ccb3601e9c36b75ea2d/sample.conf). Refetched content SHA-256 matched the saved official cache. The rule graph, 55 groups, DNS, remote rules and other clients were unchanged; this was a QX-specific mode-trigger fix. Static validation did not replace QX physical-device import.

## v6.0.21-QX.13 (2026-10-28)

- Moved Google FCM from downloads to Google services. The 15 domains, 26 IPv4 predicates, rule order and 55 groups were unchanged, as were other push services, DNS and fake-IP.

## v6.0.20-QX.12 (2026-10-24)

- Organized client directories by core family, retaining files/guides within client subdirectories. Rule semantics/fields were unchanged. Raw configuration URLs changed with paths, requiring reimport; shared `rulesets/` URLs remained unchanged.

## v6.0.20-QX.11 (2026-10-19)

- Following official `sample.conf`, merged four DoH URLs into one `doh-server` entry, preserving servers, order and other DNS settings. This matched official multi-DoH syntax without claiming to reproduce duplicate-key override behavior on-device.
- Corrected AnyTLS / REALITY protocol documentation and saved official text/version metadata; see the [Apple client review](../../docs/upstream/2026-10-19/apple/report.md). Rules, groups and remote-filter contents were unchanged; real-device concurrent resolution remained unverified.

## v6.0.20-QX.10 (2026-10-16)

- Issue #187: added exact DIRECT exceptions in existing `scki-adfp-direct` for `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, `hkshort.weixin.qq.com`, preventing WeChat connection endpoints from matching ads first.
- No parent/subdomain expansion; `ad.weixin.qq.com` and `log.weixin.qq.com` remained rejected. Other policies and ordering were unchanged.
- See [WeChat review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence and bounded static acceptance. Reporter-device recovery still required retesting.

## v6.0.19-QX.9 (2026-10-15)

- FIX#186: unified repository-owned remote assets on GitHub raw HTTPS to avoid jsDelivr repository-size limits, preserving version queries and native formats.
- Reused verified fused payloads; content, ordering and policies were unchanged. Added raw/CDN-reference regressions. See [delivery guidance](../../docs/rule-asset-delivery.md) for cause, download prerequisites and official fields.

## v6.0.18-QX.8 (2026-10-14)

- Fixed cross-service first-match misclassification: narrowed broad Apple/Microsoft keywords and shared AWS/Azure/CDN suffixes, adding eight guard classes: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social, bytedance-app. Six ADFP records for exact CA revocation/status hosts via DIRECT and exact Microsoft international-mail policy brought the total to 35. `api.byteoversea.com` was an exact TikTok rule, not a shared-suffix expansion. Existing Claude Desktop `a-api`/`a-cdn` exceptions, QUIC/latency options and default-off ZeroTier proxy remained. Crisp relay was a static ASN-overlap risk inference, not a measured incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 nonempty SRS across 81 segments.

## v6.0.17-QX.7 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to `scki-adfp-ai` for Claude Desktop application-code/user-content loading through AI policy. Based on [official requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Existing rule sets/native syntax remained. Source-semantic gates, 29 ADFP checks, Claude stage inventory and file-level release-batch checks joined the publication chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device reproduction or measurement occurred.

## v6.0.16-QX.7 (2026-10-12)

- Following v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional ADFP validation. Conversion format, order and target policies remained; no runtime rules were added. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording only observable bytes and conversion receipts. Original remote-input SHA values cannot be reconstructed from old outputs; no claim of complete historical provenance or real-device traffic measurement was made.

## v6.0.15-QX.7 (2026-10-07)

- Managed configuration supported a 900-second automatic-group checking profile and non-CN UDP/443 policy selection.
- See [latency and QUIC options](../../docs/traffic-options.md) for switching commands, capabilities and verification.

## v6.0.14-QX.6 (2026-09-29)

- FIX: remote filter 001 gained the two exact WeChat HTTPDNS hosts with DIRECT, before BlockHttpDNS rejection.

## v6.0.13-QX.5 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE: remote filter 013 gained `host-suffix, linuxdo.org` targeting `🏠 国内网站`; `linux.do` retained restricted-sites filter 059.

## v6.0.12-QX.4 (2026-09-01)

- FIX#181-PC: the first remote URL filter gained `host, login.nvidia.cn` targeting `direct`; other NVIDIA domains retained the download-group filter.

## v6.0.11-QX.3 (2026-08-22)

- ROUTING: updated 69 remote URL filters in fused order; Gemini and Accademia Gemini moved to `🔍 Google 服务`, with advertising rules still earlier.

## v6.0.10-QX.3 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: synchronized the leading exact-direct fused URL; two NetEase game-service hosts matched `direct` before anti-AD and broad CN-game rules.

## v6.0.9-QX.2 (2026-08-02)

- FIX-NODE-ISO-LOWERCASE: server-tag-regex gained lowercase two-letter ISO codes immediately followed by numbers alongside uppercase matching. When subscription parsers put names in tags, yun hk01, yun us01, yun jp01, yun sg01 and yun tw01 entered expected regions.
- GUARD/VERIFY: ordinary short lowercase words were not broadened into region codes; cross-client contracts checked 12 raw tags across main/aggregate/residential groups and unnumbered-word protection.

## v6.0.9-QX.1 (2026-07-19)

- Added the generic GitHub API tools-group fused asset earlier in `filter_remote`, providing a generic fallback on iOS without desktop-process identification.

## v6.0.8-QX.1 (2026-07-15)

- Remote filters synchronized authoritative CN-policy precedence and referenced self-hosted assets using release-version cache keys.

## v6.0.7-QX.1 (2026-07-14)

- FIX#176: synchronized `filter_remote` order with CN domains before generic international CDN / GeoIP fallback, adding a later fallback filter while retaining first-match semantics.

## v6.0.6-QX.1 (2026-07-14)

- PLATFORM: desktop artifacts handled Windows `WorkPro.exe` / `WorkProWebProcess.exe` direct routing; Quantumult X iOS added no active process rules and kept consuming synchronized fused remote filters.

## v6.0.5-QX.1 (2026-07-14)

- PLATFORM: process-aware artifacts handled Windows WorkPro.exe direct routing; Quantumult X iOS added no active process rules.

## v6.0.4-QX.1 (2026-07-13)

- DIRECT-ITWDB: the default direct fused asset in `filter_remote` gained `host-suffix, itwdb.com`, covering WorkPro subdomains.

## v6.0.3-QX.1 (2026-07-12)

- SYNC: upgraded to Clash Party v6.0.3 with 64 nonempty fused assets in `filter_remote`, retaining native QX GEOIP / IP-ASN forms.
- AI-PRECEDENCE: ChatGPT/OpenAI and verified related Sentry/DataDog/Cloudflare hosts entered `🤖 AI 服务` before advertising and international-site rules.

## v6.0.2-QX.1 (2026-07-10)

- FIX#175: reduced `filter_remote` to 63 nonempty fused segments, totaling about 15.56 MiB / 575,498 text rules.
- NATIVE: country GEOIP used native QX `geoip`, IP-ASN used `ip-asn`, and `no-resolve` was retained; only service GEOIP expanded into CIDRs.
- DEDUP/BUDGET: inherited safe same-policy deduplication and added a 32 MiB / 1 million-rule aggregate gate.

## v6.0.1-QX.1 (2026-07-10)

- FIX#174: split oversized advertising and international-site-tail remote filters into ordered same-policy shards bounded by 18 MiB.
- SEMANTICS: every added `filter_remote` retained its original `force-policy`; routing contents and precedence were unchanged.

## v6.0.0-QX.1 (2026-07-09)

- FUSED-RULESETS: migrated to 68 fused remote URL filters, retaining necessary local QX port/fallback rules.
- META: updated version metadata to Clash Party v6.0.0; policy groups were unchanged.

## v5.4.39-QX.1 (2026-07-09)

- META: updated version metadata to Clash Party v5.4.39.
- N/A: Quantumult X did not support Mihomo `.mrs` rule-providers; rule semantics remained v5.4.38-QX.1.

## v5.4.38-QX.1 (2026-07-09)

- SCKI-SUPPLEMENTAL: added 13 native Quantumult X supplemental rule sets to `[filter_remote]`, replacing scattered `filter_local` allowlist entries.
- SYNC: aligned version metadata with Clash Party v5.4.38.

## v5.4.37-QX.1 (2026-06-29)

- META#170-DNS-POLICY: updated version metadata to Clash Party v5.4.37.
- N/A: Quantumult X used its own `[dns]` / `[filter_remote]` / `[filter_local]` syntax without an equivalent Mihomo `nameserver-policy` surface; rule/DNS semantics were unchanged.

## v5.4.36-QX.1 (2026-06-29)

- CLEAN#171-DIRECT: removed 22 individually confirmed redundant `host` / `host-suffix` rules; `filter_remote` was unchanged.
- AI / Binance / Microsoft-login candidates remained because earlier different-policy MRS prevented safe deletion.

## v5.4.35-QX.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM: removed 5 `filter_remote` entries already covered by earlier same-target rules: Marketing, EncoreTVB, FindMy, WildRift and AcFun.
- CLEAN#170-DIRECT: removed 3 later `filter_local` entries already covered by leading same-target Douyin CN-streaming guards: `douyin.com`, `douyinpic.com`, `douyinvod.com`.
- Measured `filter_remote` count 285 → 280; `filter_local` 556 → 553. QX local rules remained only in `[filter_local]`.

## v5.4.34-QX.1 (2026-06-28)

- ★ FIX#169-AMAP: added blackmatrix7 Quantumult X `GaoDe.list` filter_remote targeting `🏠 国内网站`.
- Kept it after advertising/threat rules and before the international-site fallback, addressing the risk of the `webapi.amap.com` Amap API matching that fallback.

## v5.4.33-QX.1 (2026-06-27)

- ★ FEAT#169-AI-CODING: added VPSDance Quantumult X `coding.list` filter_remote targeting `🤖 AI 服务`.

## v5.4.32-QX.1 (2026-06-25)

- ★ FIX#168-CN-GAME: moved the CN-game segment before international games in `filter_local`; `filter_remote` retained CN-game sets before international-game sets.
- Aligned the file header and README with Clash Party v5.4.32.

## v5.4.31-QX.1 (2026-06-20)

- ★ FIX#167-DOUYIN: added a leading Douyin Web CN-streaming guard to `[filter_local]`, with `douyin.com`, `zjcdn.com` and related hosts matching `📺 国内流媒体`.
- Updated `filter_local` count for 10 new leading rules and aligned header/README with Clash Party v5.4.31.

## v5.4.30-QX.1 (2026-06-17)

- ★ FEAT#166-GOOGLE: added `static=🔍 Google 服务` before `🔧 工具与服务`.
- Google / Scholar remote rules moved to the new group; tools retained non-Google rules including Bing / Yandex / GitHub / Docker / GitLab / Python / developer.

## v5.4.29-QX.1 (2026-06-10)

- ★ PERF#165-LATENCY: changed 22 regional `url-latency-benchmark` groups from `check-interval=180 -> check-interval=300`.
- Updated README testing guidance to 300s / 5 minutes; `filter_remote` / `filter_local` contents were unchanged.
- Aligned the file header with Clash Party v5.4.29.

## v5.4.28-QX.1 (2026-06-07)

- ★ CLEAN#165 (continued): removed 35 inline domain entries in `[filter_local]` already covered by same-policy `[filter_remote]` sets.
  - `🇭🇰 香港流媒体`: mytvsuper.com, nowe.com, rthk.hk, cabletv.com.hk (covered by myTVSUPER/NowE/RTHK/CableTV).
  - `🇹🇼 台湾流媒体`: litv.tv, video.friday.tw, friday.tw, linetv.tw, hamivideo.hinet.net (LiTV/friDay/LineTV/HamiVideo).
  - `🇯🇵 日韩流媒体`: tver.jp, dmm.com, dmm.co.jp, nicovideo.jp, nicovideo.me (TVer/DMM/Niconico).
  - `🇪🇺 欧洲流媒体`: itv.com, itvstatic.com, britbox.com (ITV/BritboxUK).
  - `🌐 其他国外流媒体`: discoveryplus.com, wetv.vip, wetvinfo.com, viki.com, viki.io, mewatch.sg (DiscoveryPlus/WeTV/Viki/MeWatch).
  - `🎮 国外游戏`: ubisoft.com, ubi.com, riotgames.com, leagueoflegends.com, valorant.com, rockstargames.com, gog.com, gogalaxy.com, supercell.com, garena.com, hoyoverse.com, hoyolab.com (UBI/Riot/Rockstar/Gog/Supercell/Garena/HoYoverse).
  - Retained `# CLEAN#165:` comments at each removal location identifying the covering source.

## v5.4.27-QX.1 (2026-06-07)

- ★ CLEAN#165 (batch 1): removed 7 inline `[filter_local]` domains already covered by `[filter_remote]` (Claude / PayPal / HBO / Hulu / Xbox); targets remained unchanged. See v5.4.28-QX.1 for batch 2.

## v5.4.26-QX.1 (2026-06-07)

- ★ FIX#164: protected Tencent WorkBuddy `copilot.tencent.com` from misclassification. szkane `AiDomain.list` (`[filter_remote]` tag=aidomain, force-policy=`🤖 AI 服务`) contained `DOMAIN-KEYWORD,copilot`, incorrectly proxying the host and causing conversation errors. Added `host-suffix, copilot.tencent.com, 🏠 国内网站` early in `[filter_local]` alongside RustDesk (local rules precede remote resources). Baseline: Clash Party v5.4.26.

## v5.4.25-QX.2 (2026-06-05)

- ★ FIX#QX-FILTER-SECTION: moved Xiaomi / Cloudflare R2 / Paddle / push SDK / RustDesk local exceptions from `[filter_remote]` into `[filter_local]`, preventing QX from interpreting local `host/host-suffix` rules as remote-resource declarations.
- ★ VERIFY: contracts rejected local rules in `[filter_remote]` and required critical exceptions in `[filter_local]`.

## v5.4.25-QX.1 (2026-06-04)

- ★ SYNC: aligned artifact header/version and baseline with Clash Party v5.4.25; semantics remained v5.4.23-QX.2.
- ★ DOC#QX-P2: removed the false automatic-conversion claim for nonexistent `tools/srk_to_qx.py`; restoring automatic conversion first required committing and validating the script.

## v5.4.23-QX.2 (2026-06-02)

- ★ FIX#162: addressed QX `[filter_remote]` list-loading failures:
  - `ruleset.skk.moe/List/non_ip/reject_phishing.conf` returned 404. QX continued avoiding Surge `domainset` and switched to `reject.conf` in the same generic non_ip format.
  - Removed expired HaGeZi `share/surge-tif-medium.txt` (jsDelivr 403; no equivalent HaGeZi QX filter_remote format then existed).
  - Removed upstream-deleted `QuantumultX/RemoteDesktop/RemoteDesktop.list` (only Clash retained process-name rules, not applicable to QX).
  - Corrected `BiliIntl/BiliIntl.list` to the then-current upstream `BiliBiliIntl/BiliBiliIntl.list` path.

## v5.4.23-QX.1 (2026-06-02)

- ★ FIX#161: `host-suffix, zhimg.com` + `host-suffix, zhihu.co` → direct through `🏠 国内网站` (Zhihu image CDN + short URLs, synchronized baseline).

## v5.4.22-QX.1 (2026-05-31)

- ★ Added GeTui push SDK `getui.com` / `getui.net` / `gepush.com` as direct exceptions in `[filter_remote]` (after review, continuing #2, before advertising URLs; the owner chose to allow application push such as Mi Home).

- N/A#1 QUIC refinement: QX fallback_udp_policy did not support AND/NOT allowlist exemptions. See engine annotations in the file.

## v5.4.21-QX.1 (2026-05-31)

#4 Adopted from Proxy-override: changed `doh-server` from domain-host DoH to IP-host DoH (Ali × 2 + Google + CF DoH-over-IP). The historical entry recorded elimination of bootstrap DNS leakage while retaining plain-IP `server=` fallback; this is not a new universal leak-free guarantee.

## v5.4.20-QX.1 (2026-05-30)

- N/A#6 additional node-filter keywords (batch B): Quantumult X did not remove subscription junk at runtime (regional classification used server-tag-regex without a junk exclusion filter), so #6 did not apply. Version followed Clash Party v5.4.20.

## v5.4.19-QX.1 (2026-05-30)

Proxy-override adoption batch A · #2 leading CN SDK/CDN direct rules (following Clash Party v5.4.19; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`):

- Placed jpush / `msg.umeng.com` earlier in `[filter_remote]` with forced `direct`, ahead of `jiguangtuisong` / `youmengchuangxiang` blocking resources (QX first-matched by file order; this was the only product outside Mihomo with this tracker-blocking conflict).
- Added `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` to the `[filter_local]` CN-site fallback segment.
- Manually synchronized with Shadowrocket (in the historical `srk_to_qx` conversion style); #3 fake-ip-filter / #5 direct-nameserver-follow-policy did not apply (not Mihomo).
- 🔢 Version: v5.4.17-QX.1 → v5.4.19-QX.1 (all products skipped invalidated .18 and aligned at v5.4.19).
## v5.4.17-QX.2 (2026-05-30)

- ★ FIX#KR-WB: added `(?<![a-zA-Z])KR(?![a-zA-Z])` word boundaries to bare `KR` in Japan/Korea and APAC `server-tag-regex`, matching this file's US/SG style.
  - Under case-sensitive matching, only uppercase `KR` substrings were false positives (KRAKEN / DARKROOM → `🇯🇵 日韩节点`); boundaries removed those matches.
  - Covered four Japan/Korea, Japan/Korea residential, APAC and APAC residential lines; complete KOR/Korea/Seoul/🇰🇷 matches were unaffected.
  - §1.5 parallel audit: mainline JS + CMFA already had boundaries and were unchanged (the historical entry described QX as converted from Shadowrocket, with equivalent changes synchronized).
  - Regression tests: `tools/test-kr-boundary.js`.

## v5.4.17-QX.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP: Quantumult X DNS synchronized the platform-equivalent v5.4.17 representation.
  - `server=` retained only the plain-IP bootstrap list; DoH URLs still used `doh-server=`.
  - QX lacked Mihomo's four-part DNS model; failover across multiple `doh-server` entries depended on client implementation.

## v5.4.16-QX.1 (2026-05-20)

- ✅ FIX#149-P0: placed `host-suffix, paddle.com, 🏦 金融支付` earlier.
  - Overrides anti-AD/DustinWin false-positive blocking of `analytics.paddle.com`.
  - At this historical version, the rule was placed atop `[filter_remote]`, before anti-AD / phishing / TIF remote rules.

## v5.4.15-QX.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER: synchronized v5.4.15 metadata and added GEOSITE coverage references.
- ♻️ REFACTOR#AD-FP-MODULE: explicitly labeled Anti-ad false-positive allowlist at the top of [filter_remote]; local host/host-suffix exceptions still preceded remote advertising filters in this historical entry.

## v5.4.14-QX.1 (2026-05-20)

- ✅ FIX#CF-R2-P0: placed `host-suffix, cloudflarestorage.com, 🌐 国外网站` before remote advertising rules.
  - Corrected Sukka phishing false positives for Cloudflare R2 storage domains.
  - Removed the duplicate later `🌐 国外网站` entry.

## v5.4.13-QX.1 (2026-05-19)

- ✅ FIX#STUN-PORTS: completed standard STUN/TURN ports `5349 / 19302 / 19305 / 19307 -> DIRECT` using native QX `dst-port`.
- N/A#FAKE-IP: Quantumult X had no Mihomo `fake-ip-filter`; UDP fallback policy was unchanged.

## v5.4.12-QX.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 documentation for the RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Quantumult X has no Mihomo fake-ip-filter field; existing rustdesk.com meeting-collaboration routing is unchanged.

## v5.4.11-QX.1 (2026-05-12)

- ✅ FIX#RD-DOMAIN: retained the collaboration-domain fallback for `rustdesk.com`, avoiding broad Copilot matches on mobile without process matching.
- ✅ FIX#DNS-BOOTSTRAP: ordinary DNS retained IP fields and DoH order preferred AliDNS; inline-rule count updated to 568.

## v5.4.9-QX.1 (2026-05-11)

- ★ META#LOCAL-TOOLS: followed Clash Party v5.4.9. As an iOS product, Quantumult X did not gain PROCESS-NAME rules that its configuration structure would not consume.
- Recorded the direct-tool list in `docs/process-name-compatibility.md` and test fixtures; desktop Mihomo / sing-box / Surge Mac handled it.

## v5.4.8-QX.2 (2026-05-11)

- ★ META#GROUP-COUNT: aligned header/README regional-group counts at 22 (11 all-node + 11 residential).
  - Did not change `[policy]` / `[filter_remote]` / `[filter_local]` semantics.

## v5.4.8-QX.1 (2026-05-09)

- ★ ORDER#RULE-TAIL: synchronized v5.4.8 tail-rule order.
  - `[policy]` UI order was unchanged; only `[filter_remote]` / `[filter_local]` order changed.

## v5.4.7-QX.1 (2026-05-09)

- ★ FEAT#TikTok: added independent `🎵 TikTok` group (32 service groups), between `📺 国内流媒体` and `🎥 Netflix`.
  - Added `static=🎵 TikTok,...` to `[policy]`; changed the TikTok filter's `force-policy` in `[filter_remote]` to `🎵 TikTok`.
- ★ FIX#HK: appended `|广港` to Hong Kong node `server-tag-regex`.

## v5.4.6-QX.1 (2026-05-08)

- ★ FEAT#145: WeChat CDN direct routing, adding `host-suffix, cdn.weixin.qq.com, DIRECT`.
  - Added after `iwipwedabay.com` in stage 28 (Chiphell direct routing), routing the WeChat CDN domain directly.
  - Followed v5.4.6 baseline.

## v5.4.5-QX.1 (2026-05-07)

- ★ Moved global nodes first and synchronized group ordering across products, following v5.4.5.

## v5.4.4-QX.1 (2026-05-07)

- ★ FIX#144: added a direct rule for bbys.app, recorded in this version as direct CDN access for that video site.
  - Added `host-suffix, bbys.app, DIRECT` at the end of stage 28 (CN-site fallback).
  - Followed Clash Party v5.4.4.
- ★ FEAT#143: residential server-tag-regex gained IEPL/IPLC/dedicated-line recognition.
  - Appended `[Ii][Pp][Ll][Cc]|[Ii][Ee][Pp][Ll]|专线` to the residential subpattern in all 10 residential regional groups' `server-tag-regex`.
  - Matched residential-type node names containing IPLC/IEPL/`专线` identifiers.
- ★ Major version v5.4.3 → v5.4.4; Build 2026-05-06 → 2026-05-07.
- FIX#142 (DNS cold start) was specific to Clash Party JS; static configuration files were exempt.

## v5.4.3-QX.1 (2026-05-06)

- ★ FEAT: residential server-tag-regex gained `|[Hh]ome` (following Clash Party v5.4.3).
  - Appended `|[Hh]ome` to all 9 residential regional filters, matching names containing only Home as the residential indicator.

## v5.4.2-QX.1 (2026-05-05)

- ★ FIX#41-P0: Xiaomi core-service DIRECT exceptions, following v5.4.2.
  - Added 11 host/host-suffix direct rules before [filter_remote].

## v5.4.0-QX.1 (2026-05-05)

- ★ FEAT#SG: added independent `🇸🇬 狮城节点` and `🏡 狮城家宽` groups.
  - Split Singapore into a separate region from `🌏 亚太节点`.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Followed Clash Party v5.4.0.

## v5.3.0-QX.1 (2026-04-26)

- ★ REFACTOR#2: changed streaming grouping from region-based to platform-based (7 → 13 groups).
  - Added independent Netflix / Disney+ / HBO/Max / Hulu / Prime Video groups.
  - Split global YouTube / music-streaming groups.
  - Retained Hong Kong / Taiwan / Japan-Korea / Europe regional streaming groups.
  - Added other-international-streaming fallback for long-tail platforms and former Southeast Asia streaming.
  - Service groups: 25 → 31; total groups: 43 → 49.

<a id="v5211-qx1-2026-04-26--业务组合并精简-2825降低用户认知负担"></a>

## v5.2.11-QX.1 (2026-04-26) — Business groups consolidated 28→25 to reduce navigation complexity

- ★ REFACTOR#1: followed v5.2.11 to consolidate service groups and reduce selection complexity.
  - Merged search engines and developer services into tools/services.
  - Merged mail services into international sites.
  - Merged cloud/CDN into international sites.
  - Changed downloads/updates from DIRECT-first to proxy-first.
  - Retained independent BT/PT Tracker.
- Bump: `v5.2.10-QX.3` → `v5.2.11-QX.1`

<a id="v5210-qx3-2026-04-25--bugfix-dns-doh-字段名错误导致-line-22-语法错误"></a>

## v5.2.10-QX.3 (2026-04-25) — Bugfix: incorrect [dns] DoH field caused line 22 syntax error

- ★ **FIX#QX-08-P0**：`[dns] server=https://...` → `doh-server=https://...`
  - QX `[dns]` `server=` accepted only IP / `IP:port` / `/domain/IP`; DoH URLs required a separate `doh-server=` field.
    `server=https://doh.pub/dns-query` was invalid and caused the import error reporting a configuration syntax error on line 22.
  - Changed all 4 affected lines (`doh.pub` / `dns.alidns.com` / `cloudflare-dns.com` / `dns.google`) to `doh-server=`.
  - The previous QX.2 CHANGELOG incorrectly dismissed this as a cascading effect of line 13 `running_mode_trigger` requiring no change;
    actual testing still showed an independent error. This version fixed it and corrected that assessment.
  - Updated `README.md §5` (DoH field documentation + official crossutility sample.conf link).
- Authoritative source: `[dns]` in QX author [crossutility/Quantumult-X sample.conf](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf).
- §1.5 parallel audit: only QX was affected. Clash used YAML `dns.nameserver: [https://...]`,
  SR/Surge/Loon accepted URLs in `dns-server=`, and sing-box used JSON `dns.servers[].address`;
  these DoH representations did not share QX's implementation or bug.
- Bump: `v5.2.10-QX.2` → `v5.2.10-QX.3`

<a id="v5210-qx2-2026-04-25--bugfix-running_mode_trigger-语法错误"></a>

## v5.2.10-QX.2 (2026-04-25) — Historical running_mode_trigger syntax diagnosis, later corrected

- ★ **FIX#QX-07-P0**（#114）：`running_mode_trigger=filter, filter, auto` → `auto, auto, auto`
  - This version incorrectly recorded `filter` as invalid in QX `running_mode_trigger`, listed `direct`/`proxy`/`auto`/`follower`/`none` as legal values, attributed line 13 import failure to `filter`, and dismissed line 22 DNS failure as a cascade requiring no change. Those historical conclusions were corrected by QX.3 and QX.14; they are not current syntax guidance.
- Bump: `v5.2.10-QX.1` → `v5.2.10-QX.2`

<a id="v5210-qx1-2026-04-25--境外-doh-端点改路由到--受限网站"></a>

## v5.2.10-QX.1 (2026-04-25) — Non-CN DoH endpoints moved to restricted-sites routing

- ★ FIX#39: synchronized shared behavior with v5.2.10.
  - `host, dns.google, ☁️ 云与CDN` → `🚫 受限网站`
  - `host, dns.google.com, ☁️ 云与CDN` → `🚫 受限网站`
  - `host-suffix, cloudflare-dns.com, ☁️ 云与CDN` → `🚫 受限网站`
  - `[dns] server=https://cloudflare-dns.com/dns-query` / `https://dns.google/dns-query`
    were retained unchanged (QX's own upstream DoH configuration).
- Bump: `v5.2.8-QX.5` → `v5.2.10-QX.1` (major version aligned at v5.2.10).

<a id="v528-qx5-2026-04-25--欧洲节点-filter-补全-grrohucz-及多国关键词扩充"></a>

## v5.2.8-QX.5 (2026-04-25) — Completed European filters with GR/RO/HU/CZ and additional country keywords

- ★ **FIX#29-P2** (parallel bug): completed missing European countries in `🇪🇺 欧洲节点` + `🏡 欧洲家宽` filters.
  - The previous OpenClash update added 15 European countries to REGIONS, but iOS artifact EU filters had not followed.
  - Fix: added GR/RO/HU/CZ codes and full keywords to SR/Surge/Loon/QX EU node + residential filters
    (Greece/Athens/Romania/Bucharest/Hungary/Budapest/Czech/Prague + Chinese names + flag emoji).
  - Also expanded PT/BE/IE/DK/NO keywords (city names + Chinese names + 🇵🇹/🇧🇪/🇮🇪/🇩🇰/🇳🇴).
  - Parallel audit: Clash Party JS / OpenClash already covered these; CMFA used include-all-proxies as a global fallback (N/A); SingBox/v2rayN had no runtime node classification (N/A).
- Version `v5.2.8-QX.4` → `v5.2.8-QX.5`.

<a id="v528-qx4-2026-04-24--dnspod-doh-端点切换为纯-ip-形式"></a>

## v5.2.8-QX.4 (2026-04-24) — DNSPod DoH endpoint changed to IP-only form

- ★ At this historical version, replaced `server=https://doh.pub/dns-query` in `[dns]` with
  `server=https://1.12.12.12/dns-query`
  - a DNSPod IP-host DoH endpoint, **avoiding bootstrap resolution of `doh.pub`** for a more reliable iOS cold start.
- Version `v5.2.8-QX.3` → `v5.2.8-QX.4`.

<a id="v528-qx3-2026-04-23--基线对齐-clash-party-v528无代码改动"></a>

## v5.2.8-QX.3 (2026-04-23) — Aligned with Clash Party v5.2.8 (no code changes)

- Baseline bump: `v5.2.5-QX.2` → `v5.2.8-QX.3`.
- v5.2.6 (alpha-3 / fallback / cleanupSubscription fixes): QX `server-tag-regex` already fully covered TWN/JPN/KOR/SGP and needed no change.
- v5.2.7 (mirror URL change): QX fetched upstream URLs directly without the mirror and needed no change.
- v5.2.8 (CMFA/OpenClash APAC-filter fix): QX `server-tag-regex` already fully covered HK/TW/JP/KR and needed no change.

<a id="v525-qx2-2026-04-22--移除-72-条-clash-yaml--anti-adsukka-兼容修复--版本对齐"></a>

## v5.2.5-QX.2 (2026-04-22) — Removed 72 Clash YAML entries, fixed anti-AD/Sukka compatibility and aligned versions

The same inherited Clash Party baseline problems affected Loon v5.2.4-Loon.2/.3 and Shadowrocket v5.2.5-SR.3:

<a id="改动"></a>

### Changes

- ★ FIX#QX-01-P0: **removed 72 Clash classical `.yaml` `[filter_remote]` entries** (71 Accademia + 1 ACL4SSR Zoom.yaml).
  - QX `[filter_remote]` with `opt-parser=true` parsed Surge/QX plain text, not classical YAML `payload:`; subscribed rule sets displayed 0 matches.
- ★ FIX#QX-02-P0：`anti-ad.net/surge.txt` → `fastly.jsdelivr.net/gh/privacy-protection-tools/anti-AD@master/anti-ad-surge.txt`
  - Loon v5.2.4-Loon.3 had confirmed anti-ad.net without CDN returning HTML through DNS interception on affected CN ISP networks; QX parsing failed too.
- ★ FIX#QX-03-P0：Sukka `List/domainset/reject_phishing.conf` → `List/non_ip/reject_phishing.conf`
  - `domainset/` was Surge's specific secondary format (plain domains without RULE prefixes); QX `opt-parser=true` was expected to recognize it but lacked an official guarantee. `non_ip/` used generic Surge/QX `DOMAIN-SUFFIX,...` format.
- ★ FIX#QX-04-P1: **aligned the major version**, `v5.2.3-QX.1` → **`v5.2.5-QX.2`** (Clash Party JS `VERSION='v5.2.5'`; previously two minor versions behind).
- ★ FIX#QX-05-P2: Build `2026-04-20` → `2026-04-22`; architecture summary `360 filter_remote` → `~290 filter_remote`.
- ★ FIX#QX-06-P2: **removed the header warning claiming automatic conversion by tools/srk_to_qx.py**.
  - Verified that `tools/srk_to_qx.py` did not exist in the repository and had never been committed; the unsupported warning had misled users.
  - Allowed manual edits, as in this PR. Restoring automatic conversion would require adding the script before restoring the warning.

<a id="结构性核查之前-audit-agent-漏查这次独立核对"></a>

### Structural review (independently checked after the earlier audit missed it)

Manual review found **section headings, rule tokens and line formats correct**, requiring no changes:

- Lowercase sections `[general] [dns] [policy] [server_local] [server_remote] [filter_remote] [filter_local] [rewrite_local] [rewrite_remote] [task_local] [mitm]` ✓
- Native QX `[policy]` syntax `url-latency-benchmark=<Name>, server-tag-regex=..., check-interval=..., tolerance=..., alive-checker-enabled=true, img-url=...` ✓
- Native QX `[filter_remote]` syntax `URL, tag=..., force-policy=..., update-interval=..., opt-parser=true, enabled=true` (not Surge-style `RULE-SET,URL,policy`) ✓
- Native lowercase QX `[filter_local]` tokens: `host-suffix, xxx, policy` / `host, xxx, policy` / `ip-cidr, xxx, policy` / `dst-port, xxx, policy` / `geoip, xx, policy` / `final, policy` ✓
- FINAL without `,dns-failed` suffix ✓

<a id="自检"></a>

### Self-checks

- 37 proxy groups (`url-latency-benchmark` × 9 + `static` × 28) ✓
- Remaining `[filter_remote]` YAML entries: 0 ✓
- Remaining `anti-ad.net` references: 0 ✓
- Remaining `domainset/`: 0; `non_ip/` uses: 1 ✓
- `final, 🐟 漏网之鱼` without suffix ✓
- File lines 1197 → 1125 (net -72).

<a id="已接受的回归损失与-loon--sr-一致"></a>

### Accepted coverage regression (same as Loon / SR)

Accademia `Bank × 10 countries` / `FakeLocation × 10` / `GeoRouting × 17 regions` / `eMuleServer` / `HomeIP` had no equivalent `.list` sources. The historical entry identified CMFA / OpenClash / SingBox as alternatives retaining full coverage.

---

<a id="v523-qx1-2026-04-20--初版"></a>

## v5.2.3-QX.1 (2026-04-20) — Initial version

- ★ The initial entry recorded automatic conversion from Shadowrocket v5.2.2-SR.2 + Surge v5.2.3-Surge.1; later entries corrected the missing-script claim.
- ★ Mapped `[Proxy Group]` to QX `[policy]`:
  - `url-test` → `url-latency-benchmark` (QX latency selection).
  - `select` → `static` (QX manual selection).
- ★ Split `[Rule]` into:
  - `[filter_local]` (inline rules).
  - `[filter_remote]`（RULE-SET URL）
- ★ Rule-type conversion:
  - `DOMAIN-SUFFIX` → `host-suffix`
  - `DOMAIN-KEYWORD` → `host-keyword`
  - `DOMAIN` → `host`
  - `IP-CIDR` → `ip-cidr`
  - `GEOIP` → `geoip`
  - `FINAL` → `final`
  - `REJECT` → `reject`, `DIRECT` → `direct` (QX lowercase policy conventions).
- ★ Automatically rewrote rule-set URL path `/rule/独立内核系/Shadowrocket/` to `/rule/QuantumultX/` (blackmatrix7 supplied QX-specific `.list` files there with matching syntax).

<a id="与-clash-party-主线的差异qx-引擎限制"></a>

### Differences from Clash Party mainline (QX engine limits)

- No Mihomo Smart groups / LightGBM (QX was not Mihomo).
- No TLS fingerprint injection (QX did not expose uTLS controls).
- No PROCESS-NAME (iOS lacked process APIs; skipped during the recorded conversion).
- No URL-REGEX (unsupported in QX `filter_local`; skipped during the recorded conversion).
- Replaced all GEOSITE with `filter_remote` RULE-SETs.
- Meta `.mrs` binaries → blackmatrix7 QuantumultX `.list`.

<a id="重要使用提示"></a>

### Important usage notes recorded for this version

- ⚠️ **Subscription nodes**: QX did not populate `[server_local]` / `[server_remote]` automatically; the configuration required a provider subscription URL in `[server_remote]` or manually pasted nodes in `[server_local]`.
- `resource_parser_url` was preset to KOP-XIAO's generic parser for nonstandard subscription formats.
- `rewrite_local` / `rewrite_remote` / `task_local` / `mitm` were empty by default for optional extension.
