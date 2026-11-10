<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Shadowrocket changelog" width="100%">
</picture>

<a id="shadowrocket--变更日志"></a>

# Shadowrocket — Changelog

> Changelog for `独立内核系/Shadowrocket/Shadowrocket.conf`.
> Major versions follow Clash Party; the `-SR.N` suffix increments independently.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Project README](../../README.md) · [Documentation index](../../docs/README.md)

## v6.0.21-SR.12 (2026-10-28)

- Moved Google FCM from downloads to Google services. The 15 domains, 26 IPv4 predicates, rule order and 55 groups were unchanged, as were other push services, DNS and fake-IP.

## v6.0.20-SR.11 (2026-10-24)

- Organized client directories by core family, retaining files/guides within client subdirectories. Rule semantics/fields were unchanged. Raw configuration URLs changed with paths, requiring reimport; shared `rulesets/` URLs remained unchanged.

<a id="2026-10-19--官方文档与版本核对"></a>

## 2026-10-19 — Official documentation and version review

- Cached official release records, configuration documentation and relevant source, updating REFERENCE currency/capability boundaries. See the [review report](../../docs/upstream/2026-10-19/apple/report.md). This documentation review changed no rules, policy groups or generated payloads.

## v6.0.20-SR.10 (2026-10-16)

- Issue #187: added exact DIRECT exceptions in existing `scki-adfp-direct` for `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, `hkshort.weixin.qq.com`, preventing WeChat connection endpoints from matching ads first.
- No parent/subdomain expansion; `ad.weixin.qq.com` and `log.weixin.qq.com` remained rejected. Other policies and ordering were unchanged.
- See [WeChat review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence and bounded static acceptance. Reporter-device recovery still required retesting.

## v6.0.19-SR.9 (2026-10-15)

- FIX#186: unified repository-owned remote assets on GitHub raw HTTPS to avoid jsDelivr repository-size limits, preserving version queries and native formats.
- Reused verified fused payloads; content, ordering and policies were unchanged. Added raw/CDN-reference regressions. See [delivery guidance](../../docs/rule-asset-delivery.md) for cause, download prerequisites and official fields.
- Completed full-download/hash acceptance for 77 actual configuration URLs, retaining the initial failure and five bounded follow-up checks. Tooling explicitly used the existing proxy and reasonable timeouts instead of treating Windows curl's different transport path and fixed 15-second limit as the sole configuration-availability criterion.

## v6.0.18-SR.8 (2026-10-14)

- Fixed cross-service first-match misclassification: narrowed broad Apple/Microsoft keywords and shared AWS/Azure/CDN suffixes, adding eight guard classes: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social, bytedance-app. Six ADFP records for exact CA revocation/status hosts via DIRECT and exact Microsoft international-mail policy brought the total to 35. `api.byteoversea.com` was an exact TikTok rule, not a shared-suffix expansion. Existing Claude Desktop `a-api`/`a-cdn` exceptions, QUIC/latency options and default-off ZeroTier proxy remained. Crisp relay was a static ASN-overlap risk inference, not a measured incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 nonempty SRS across 81 segments.

## v6.0.17-SR.7 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to `scki-adfp-ai` for Claude Desktop application-code/user-content loading through AI policy. Based on [official requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Existing rule sets/native syntax remained. Source-semantic gates, 29 ADFP checks, Claude stage inventory and file-level release-batch checks joined the publication chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device reproduction or measurement occurred.

## v6.0.16-SR.7 (2026-10-12)

- Following v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional ADFP validation. Conversion format, order and target policies remained; no runtime rules were added. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording only observable bytes and conversion receipts. Original remote-input SHA values cannot be reconstructed from old outputs; no claim of complete historical provenance or real-device traffic measurement was made.

## v6.0.15-SR.7 (2026-10-07)

- Managed configuration gained a 900-second latency profile and non-CN UDP/443 policy selection, retaining Shadowrocket's native syntax boundaries.
- See [latency and QUIC options](../../docs/traffic-options.md) for switching commands, capabilities and verification.

## v6.0.14-SR.6 (2026-09-29)

- FIX: added the two exact WeChat HTTPDNS hosts to remote DIRECT RULE-SET 001, preceding BlockHttpDNS rejection.

## v6.0.13-SR.5 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE: remote RULE-SET 013 gained the `linuxdo.org` suffix targeting `🏠 国内网站`; `linux.do` retained restricted-sites routing in segment 059.

## v6.0.12-SR.4 (2026-09-01)

- FIX#181-PC: the first fused `DIRECT` RULE-SET gained exact host `login.nvidia.cn`, taking precedence over NVIDIA download rules. Other NVIDIA domains retained their policies.

## v6.0.11-SR.3 (2026-08-22)

- ROUTING: after replaying 69 remote fused RULE-SETs, Gemini and Accademia Gemini entered `🔍 Google 服务`; other AI segments and szkane ordering were unchanged.

## v6.0.10-SR.3 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: `drpf-g10.proxima.nie.netease.com` and `sigma-performance-g10.proxima.nie.netease.com` were placed in the first fused `DIRECT` RULE-SET rather than the user-switchable `国内游戏` policy group.
- GUARD: only exact hosts routed directly; existing anti-AD treatment of parent `proxima.nie.netease.com` remained.

## v6.0.9-SR.2 (2026-08-02)

- FIX-NODE-ISO-LOWERCASE: 11 region/residential policy-regex-filter entries gained lowercase two-letter ISO codes immediately followed by numbers alongside uppercase matching. yun hk01, yun us01, yun jp01, yun sg01, yun tw01 and residential variants could enter the corresponding groups.
- GUARD/VERIFY: ordinary lowercase short words were not broadened into region codes; the cross-client contract checked main/aggregate/residential groups and unnumbered-word protection for 12 naming samples.

## v6.0.9-SR.1 (2026-07-19)

- Added a generic GitHub API tools-group fused segment before upstream broad AI rules. iOS lacked Windows process matching and used the generic fallback.

## v6.0.8-SR.1 (2026-07-15)

- Synchronized authoritative CN-policy precedence in 65 fused RULE-SETs and loaded self-hosted assets with release-version cache keys.

## v6.0.7-SR.1 (2026-07-14)

- FIX#176: updated iOS fused-text reference order so CN-domain segments preceded generic international CDN / GeoIP fallback. The new later fallback text asset brought the total to 65.

## v6.0.6-SR.1 (2026-07-14)

- PLATFORM: desktop Mihomo, sing-box and Xray artifacts handled direct routing for Windows `WorkPro.exe` / `WorkProWebProcess.exe`. Shadowrocket iOS did not fabricate unsupported `PROCESS-NAME` rules and continued consuming synchronized fused text assets.

## v6.0.5-SR.1 (2026-07-14)

- PLATFORM: source-graph regression contracts protected Windows desktop direct routing for WorkPro.exe; the Shadowrocket iOS path did not fabricate PROCESS-NAME rules.

## v6.0.4-SR.1 (2026-07-13)

- DIRECT-ITWDB: added `DOMAIN-SUFFIX,itwdb.com` to the default `DIRECT` fused text segment, covering WorkPro and all subdomains in Shadowrocket.

## v6.0.3-SR.1 (2026-07-12)

- SYNC: mobile text targets synchronized to 64 nonempty fused RULE-SETs. All URLs still referenced repository-generated assets, not upstream rule sets directly.
- AI-PRECEDENCE: ChatGPT/OpenAI main domains, oaistatic, Cloudflare NEL and necessary Sentry/DataDog telemetry entered `🤖 AI 服务` before advertising and international-site segments.
- SEMANTICS: preserved source-graph ordering in text rules; the Mihomo MRS grammar fix did not incorrectly broaden keywords/regexes into wildcards.

## v6.0.2-SR.1 (2026-07-10)

- FIX#175: reduced 71 inflated remote shards to 63 nonempty mobile fused segments; aggregate size fell from about 75.44 MiB to 16.06 MiB and text rules from about 3.1 million to 575,499.
- ROOT-CAUSE: fixed both HaGeZi Ultimate being incorrectly replaced by full TIF and 249 country GEOIP rules expanding into more than 760,000 CIDRs. Country GEOIP stayed native in SR; only service GEOIP converted to CIDRs.
- DEDUP: removed exact duplicates, domains covered by DOMAIN-SUFFIX / DOMAIN-KEYWORD and CIDRs covered by parent networks within each same-policy segment. A second optimization of final Clash text removed 0 rules.
- BUDGET: added a 32 MiB / 1 million-rule aggregate client gate while retaining the 18 MiB per-asset gate, preventing increased shard counts from concealing total-size regressions.

## v6.0.1-SR.1 (2026-07-10)

- FIX#174: split `scki-fused-005-ad` from one 51.10 MiB RULE-SET into 3 ordered same-policy shards and `scki-fused-057-intl-site` from 20.15 MiB into 2 ordered same-policy shards, avoiding CDN / Shadowrocket `403/forbidden` responses for oversized files.
- SEMANTICS: the 5 shards matched consecutively at their original routing positions, retaining `🛑 广告拦截` and `🌐 国外网站` targets. Rule contents, policy groups and final matching precedence were unchanged.
- VERIFY: generation limited every remote text asset to 18 MiB; contracts checked existence and byte counts for the actual URLs referenced by this configuration.

## v6.0.0-SR.1 (2026-07-09)

- FUSED-RULESETS: migrated to 68 fused remote RULE-SETs.
- META: updated version metadata to Clash Party v6.0.0; policy groups were unchanged.

## v5.4.39-SR.1 (2026-07-09)

- META: updated version metadata to Clash Party v5.4.39.
- N/A: Shadowrocket did not support Mihomo `.mrs` rule-providers; rule semantics remained v5.4.38-SR.1.

## v5.4.38-SR.1 (2026-07-09)

- SCKI-SUPPLEMENTAL: replaced scattered inline local allowlist entries with 13 repository-maintained supplemental `RULE-SET`s.
- SYNC: aligned version metadata with Clash Party v5.4.38.

## v5.4.37-SR.1 (2026-06-29)

- META#170-DNS-POLICY: updated version metadata to Clash Party v5.4.37.
- N/A: Shadowrocket `.conf` did not support Mihomo `nameserver-policy` / `geosite:*` DNS-policy fields; existing `dns-server` / `fallback-dns-server` semantics were unchanged.

## v5.4.36-SR.1 (2026-06-29)

- CLEAN#171-DIRECT: removed 22 individually confirmed redundant `DOMAIN` / `DOMAIN-SUFFIX` rules; remote rule sets were unchanged.
- AI / Binance / Microsoft-login candidates remained because earlier different-policy MRS prevented safe deletion.

## v5.4.35-SR.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM: removed 5 remote RULE-SETs already covered by earlier same-target rules: Marketing, EncoreTVB, FindMy, WildRift and AcFun.
- CLEAN#170-DIRECT: removed three later inline rules already covered by the earlier same-target Douyin China-streaming guard: `douyin.com`, `douyinpic.com`, `douyinvod.com`.
- Measured remote RULE-SET count changed 288 → 283; matching order was unchanged.

## v5.4.34-SR.1 (2026-06-28)

- ★ FIX#169-AMAP: added blackmatrix7 Shadowrocket `GaoDe.list` targeting `🏠 国内网站`.
- Kept it after advertising/threat rules and before the international-site fallback, addressing the risk of the `webapi.amap.com` Amap API matching that fallback.

## v5.4.33-SR.1 (2026-06-27)

- ★ FEAT#169-AI-CODING: added VPSDance Shadowrocket `coding.list` targeting `🤖 AI 服务`.

## v5.4.32-SR.1 (2026-06-25)

- ★ FIX#168-CN-GAME: moved all CN-game inline rules and sets such as SteamCN before international-game RULE-SETs to prevent broad HoYoverse/Game rules proxying them first.
- Aligned the file header and README with Clash Party v5.4.32.

## v5.4.31-SR.1 (2026-06-20)

- ★ FIX#167-DOUYIN: added leading Douyin Web CN-streaming rules so `douyin.com`, `zjcdn.com` and related domains matched `📺 国内流媒体` before TikTok and international rule sets.
- Aligned the file header and README with Clash Party v5.4.31.

## v5.4.30-SR.1 (2026-06-17)

- ★ FEAT#166-GOOGLE: added `🔍 Google 服务` before `🔧 工具与服务`.
- `GoogleSearch` / `GoogleDrive` / `GoogleEarth` / `Google` / `Scholar` moved to the new group; tools retained non-Google search and developer services.

## v5.4.29-SR.1 (2026-06-10)

- ★ PERF#165-LATENCY: changed 22 regional `url-test` groups from `interval=180 -> interval=300`, reducing subscription-node testing frequency.
- Rule/group semantics were unchanged; FINAL still used `🐟 漏网之鱼`.
- Aligned README/header with Clash Party v5.4.29.

## v5.4.27-SR.1 (2026-06-07)

- ★ CLEAN#165: removed 7 inline domains already covered by earlier remote rule sets (Claude / PayPal / HBO / Hulu / Xbox); they still matched the same policy groups afterward.

## v5.4.26-SR.1 (2026-06-07)

- ★ FIX#164: protected Tencent WorkBuddy `copilot.tencent.com` from misclassification: the `DOMAIN-KEYWORD,copilot` substring in szkane `AiDomain.list` incorrectly sent it to `🤖 AI 服务`, whose proxy routing caused conversation errors. Added `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站` before szkane AiDomain RULE-SET alongside the existing RustDesk guard. Baseline: Clash Party v5.4.26.

## v5.4.25-SR.1 (2026-06-04)

- ★ SYNC: aligned artifact header/version and baseline with Clash Party v5.4.25; rule semantics remained v5.4.23-SR.2, without new SR-specific rules.

## v5.4.23-SR.2 (2026-06-02)

- ★ FIX#162: fixed `Invalid status` while loading Shadowrocket remote rule lists:
  - `ruleset.skk.moe/List/non_ip/reject_phishing.conf` returned 404. SR did not support `domainset`, so it switched to `reject.conf` in the same generic non_ip format.
  - Removed expired HaGeZi `share/surge-tif-medium.txt` (jsDelivr 403; no equivalent HaGeZi SR RULE-SET format then existed).
  - Removed upstream-deleted `独立内核系/Shadowrocket/RemoteDesktop/RemoteDesktop.list` (only Clash retained process-name rules, not applicable to SR).
  - Corrected `BiliIntl/BiliIntl.list` to the then-current upstream `BiliBiliIntl/BiliBiliIntl.list` path.

## v5.4.23-SR.1 (2026-06-02)

- ★ FIX#161: `DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` targeted `🏠 国内网站` direct routing for Zhihu image CDN/short links, matching the baseline.

## v5.4.22-SR.1 (2026-05-31)

- ★ Added GeTui push SDK `getui.com` / `getui.net` / `gepush.com` to direct exceptions after review. Continuing #2, generic ad/privacy feeds treated them as trackers despite carrying application push such as Mi Home; the owner chose to allow them.

- N/A#1 QUIC refinement: SR block-quic was engine-level without AND/NOT allowlist exemptions. See engine annotations in the file.

## v5.4.21-SR.1 (2026-05-31)

#4 Adopted from Proxy-override: changed every DoH URL (dns-server / proxy-dns-server / fallback-dns-server) from domain-host to IP-host DoH. The historical entry recorded elimination of bootstrap DNS leakage: SR had no independent bootstrap field, and IP DoH avoided hostname bootstrapping. This is not a new universal leak-free guarantee.

## v5.4.20-SR.1 (2026-05-30)

- N/A#6 additional node-filter keywords (batch B): Shadowrocket did not remove subscription junk at runtime and lacked filters such as isInfoNode / exclude-filter, so #6 did not apply. The version followed Clash Party v5.4.20.

## v5.4.19-SR.1 (2026-05-30)

Proxy-override adoption batch A · #2 leading CN SDK/CDN direct rules (following Clash Party v5.4.19; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`):

- Placed jpush / `msg.umeng.com` before advertising RULE-SETs with forced DIRECT for legitimate push/messages, aligning the Mihomo family and avoiding cross-client inconsistency.
- Added `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` to the `🏠 国内网站` segment.
- #3 fake-ip-filter did not apply (iOS Shadowrocket had no such field), nor did #5 direct-nameserver-follow-policy (not Mihomo).
- 🔢 Version: v5.4.17-SR.1 → v5.4.19-SR.1 (all products skipped invalidated .18 and aligned at v5.4.19).
## v5.4.17-SR.2 (2026-05-30)

- ★ FIX#KR-WB: added `(?<![a-zA-Z])KR(?![a-zA-Z])` word boundaries to bare `KR` in Japan/Korea and APAC `policy-regex-filter`, consistent with US/SG patterns in this file.
  - Under case-sensitive matching, only uppercase `KR` substrings were false positives (KRAKEN / DARKROOM → `🇯🇵 日韩节点`); boundaries removed those matches.
  - Covered four node/residential lines for Japan/Korea and APAC; complete KOR/Korea/Seoul/🇰🇷 matches were unaffected.
  - §1.5 parallel audit: all three mainline Clash Party JS scripts + CMFA already had boundaries and were unchanged; OpenClash/Loon/Surge/QX were fixed together.
  - Regression tests: `tools/test-kr-boundary.js`.

## v5.4.17-SR.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP: Shadowrocket DNS synchronized v5.4.17 split-bootstrap semantics.
  - `dns-server` retained CN DoH only; `proxy-dns-server` used fixed non-CN DoH + CN DoH fallback.
  - `fallback-dns-server` was fixed to Cloudflare + Google DoH.
  - Shadowrocket had no separate `default-nameserver`; the client implemented DoH-hostname bootstrap.

## v5.4.16-SR.1 (2026-05-20)

- ✅ FIX#149-P0: placed `DOMAIN-SUFFIX,paddle.com,🏦 金融支付` earlier.
  - Issue #149 reported Antigravity failing to redirect back after Google login, with `analytics.paddle.com` frequently blocked in logs.
  - The anti-AD/DustinWin source then included `analytics.paddle.com`; Shadowrocket's local exception needed to precede the anti-AD remote rules.

## v5.4.15-SR.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER: synchronized v5.4.15 metadata and added GEOSITE coverage references.
- ♻️ REFACTOR#AD-FP-MODULE: explicitly labeled the top of stage 1 as Anti-ad false-positive allowlist and placed both Xiaomi false-positive exceptions and Cloudflare R2 exceptions before advertising/phishing/TIF rules.

## v5.4.14-SR.1 (2026-05-20)

- ✅ FIX#CF-R2-P0: moved the `cloudflarestorage.com` rule to the top of stage 1.
  - Prevented the Sukka phishing remote source from misrouting Cloudflare R2 object-storage domains to `🛑 广告拦截`.
  - Removed the duplicate later `🌐 国外网站` entry.

## v5.4.13-SR.1 (2026-05-19)

- ✅ FIX#STUN-PORTS: completed standard STUN/TURN ports `5349 / 19302 / 19305 / 19307 -> DIRECT`.
- N/A#FAKE-IP: Shadowrocket had no Mihomo `fake-ip-filter`; QUIC remained controlled by `block-quic = all-proxy`.

## v5.4.12-SR.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 documentation for the RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Shadowrocket has no Mihomo fake-ip-filter field; existing rustdesk.com meeting-collaboration routing is unchanged.

## v5.4.11-SR.1 (2026-05-12)

- ✅ FIX#RD-DOMAIN: `rustdesk.com` remained in `🧑‍💼 会议协作`, supplying a domain fallback where iOS lacked process matching.
- ✅ FIX#DNS-BOOTSTRAP: changed `dns-server` / `proxy-dns-server` to IP-first + DoH fallback to reduce first-resolution failures.

## v5.4.9-SR.1 (2026-05-11)

- ★ META#LOCAL-TOOLS: followed Clash Party v5.4.9. Did not enable the new PROCESS-NAME direct list here, avoiding nonequivalent or ignored process matching in the shared Shadowrocket iOS/macOS configuration.
- Recorded the direct-tool list in `docs/process-name-compatibility.md` and test fixtures; desktop Mihomo / sing-box / Surge Mac handled it.

## v5.4.8-SR.2 (2026-05-11)

- ★ FIX#SR-AF-P1: restored the undefined `🌍 非洲节点` url-test group referenced by business groups.
  - Restored `🌍 非洲节点` / `🏡 非洲家宽` to regional groups, preventing African-candidate references to nonexistent policies.
  - Parallel audit: Surge / Loon / QX / CMFA already defined the African node group; only Shadowrocket had missed synchronization.

## v5.4.8-SR.1 (2026-05-09)

- ★ ORDER#RULE-TAIL: synchronized v5.4.8 tail-rule order.
  - `[Proxy Group]` UI order was unchanged; only `[Rule]` order changed.
  - Kept `🎵 TikTok` earlier to prevent CN-streaming rules from capturing shared ByteDance domains first.

## v5.4.7-SR.1 (2026-05-09)

- ★ FEAT#TikTok: added independent `🎵 TikTok` group (32 service groups), between `📺 国内流媒体` and `🎥 Netflix`.
  - Split TikTok from `📱 社交媒体` into its own select group using the standard global proxy chain.
  - Changed `RULE-SET,TikTok.list` from `📱 社交媒体` to `🎵 TikTok`, before the Netflix block.
- ★ FIX#HK: appended `|广港` to Hong Kong node `policy-regex-filter`, completing classification of IEPL/IPLC cross-border dedicated-line node names.

## v5.4.6-SR.1 (2026-05-08)

- ★ FEAT#145: added WeChat CDN direct rule `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT`.
  - Added after `mail.qq.com` in stage 7 (CN mail direct routing), routing the WeChat CDN domain directly.
  - Followed v5.4.6 baseline.

## v5.4.5-SR.1 (2026-05-07)

- ★ Moved global nodes first and synchronized group ordering across products, following v5.4.5.

## v5.4.4-SR.1 (2026-05-07)

- ★ FIX#144: added a direct rule for bbys.app, recorded in this version as direct CDN access for that video site.
  - Added `DOMAIN-SUFFIX,bbys.app,DIRECT` at the end of stage 28 (CN-site fallback).
  - Followed Clash Party v5.4.4.
- ★ FEAT#143: residential policy-regex-filter gained IEPL/IPLC/dedicated-line recognition.
  - Appended `[Ii][Pp][Ll][Cc]|[Ii][Ee][Pp][Ll]|专线` to the residential subpattern in all 10 residential regional groups' `policy-regex-filter`.
  - Matched residential-type node names containing IPLC/IEPL/`专线` identifiers.
- ★ Major version v5.4.3 → v5.4.4; Build 2026-05-06 → 2026-05-07.
- FIX#142 (DNS cold start) was specific to Clash Party JS; static configuration files were exempt.

## v5.4.3-SR.1 (2026-05-06)

- ★ FEAT: residential policy-regex-filter gained `|[Hh]ome` (following Clash Party v5.4.3).
  - Appended `|[Hh]ome` to all 9 residential regional filters, matching names containing only Home as the residential indicator.

## v5.4.2-SR.1 (2026-05-05)

- ★ FIX#41-P0: Xiaomi core-service DIRECT exceptions, following v5.4.2.
  - Added 11 DOMAIN/DOMAIN-SUFFIX DIRECT rules before the advertising segment.

## v5.4.0-SR.1 (2026-05-05)

- ★ FEAT#SG: added independent `🇸🇬 狮城节点` and `🏡 狮城家宽` groups.
  - Split Singapore into a separate region from `🌏 亚太节点`.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Followed Clash Party v5.4.0.

## v5.3.0-SR.1 (2026-04-26)

- ★ REFACTOR#2: changed streaming grouping from region-based to platform-based (7 → 13 groups).
  - Added independent Netflix / Disney+ / HBO/Max / Hulu / Prime Video groups.
  - Split global YouTube / music-streaming groups.
  - Retained Hong Kong / Taiwan / Japan-Korea / Europe regional streaming groups.
  - Added other-international-streaming fallback for long-tail platforms and former Southeast Asia streaming.
  - Service groups: 25 → 31; total groups: 43 → 49.

<a id="v5211-sr1-2026-04-26--业务组合并精简-2825降低用户认知负担"></a>

## v5.2.11-SR.1 (2026-04-26) — Business groups consolidated 28→25 to reduce navigation complexity

- ★ REFACTOR#1: followed v5.2.11 to consolidate service groups and reduce selection complexity.
  - Merged search engines and developer services into tools/services.
  - Merged mail services into international sites.
  - Merged cloud/CDN into international sites.
  - Changed downloads/updates from DIRECT-first to proxy-first.
  - Retained independent BT/PT Tracker.
- Bump: `v5.2.10-SR.1` → `v5.2.11-SR.1`

<a id="v5210-sr1-2026-04-25--境外-doh-端点改路由到--受限网站"></a>

## v5.2.10-SR.1 (2026-04-25) — Non-CN DoH endpoints moved to restricted-sites routing

- ★ FIX#39: synchronized shared behavior with v5.2.10.
  - `DOMAIN,dns.google,☁️ 云与CDN` → `🚫 受限网站`.
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `🚫 受限网站`.
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `🚫 受限网站`.
  - Note: retained cloudflare/google DoH URLs in `[General] proxy-dns-server` / `fallback-dns-server`.
    (These were SR's own upstream DoH settings, independent of policy-group routing.)
- Bump: `v5.2.8-SR.7` → `v5.2.10-SR.1` (major version aligned at v5.2.10).

<a id="v528-sr7-2026-04-25--欧洲节点-filter-补全-grrohucz-及多国关键词扩充"></a>

## v5.2.8-SR.7 (2026-04-25) — Completed European filters with GR/RO/HU/CZ and additional country keywords

- ★ **FIX#29-P2** (parallel bug): completed missing European countries in `🇪🇺 欧洲节点` + `🏡 欧洲家宽` filters.
  - The previous OpenClash update added 15 European countries to REGIONS, but iOS artifact EU filters had not followed.
  - Fix: added GR/RO/HU/CZ codes and full keywords to SR/Surge/Loon/QX EU node + residential filters
    (Greece/Athens/Romania/Bucharest/Hungary/Budapest/Czech/Prague + Chinese names + flag emoji).
  - Also expanded PT/BE/IE/DK/NO keywords (city names + Chinese names + 🇵🇹/🇧🇪/🇮🇪/🇩🇰/🇳🇴).
  - Parallel audit: Clash Party JS / OpenClash already covered these; CMFA used include-all-proxies as a global fallback (N/A); SingBox/v2rayN had no runtime node classification (N/A).
- Version `v5.2.8-SR.6` → `v5.2.8-SR.7`.

<a id="v528-sr6-2026-04-24--dnspod-doh-端点切换为纯-ip-形式"></a>

## v5.2.8-SR.6 (2026-04-24) — DNSPod DoH endpoints changed to IP-only form

- ★ Replaced all `https://doh.pub/dns-query` entries in `dns-server` / `proxy-dns-server` with
  `https://1.12.12.12/dns-query`
  - DNSPod IP-host DoH endpoints, **avoiding bootstrap resolution of `doh.pub`**, for more reliable iOS cold starts
    or operation under weak signal.
- Version `v5.2.8-SR.5` → `v5.2.8-SR.6`.

<a id="v528-sr5-2026-04-23--基线对齐-clash-party-v528无代码改动"></a>

## v5.2.8-SR.5 (2026-04-23) — Aligned with Clash Party v5.2.8 (no code changes)

- Baseline bump: `v5.2.6-SR.4` → `v5.2.8-SR.5`.
- v5.2.7 (mirror URL change): SR fetched upstream URLs directly without the mirror and needed no change.
- v5.2.8 (CMFA/OpenClash APAC-filter fix): SR `policy-regex-filter` already fully covered HK/TW/JP/KR and needed no change.

<a id="v526-sr4-2026-04-23--final-兜底补-dns-failed-标志"></a>

## v5.2.6-SR.4 (2026-04-23) — Added `dns-failed` to FINAL fallback

Cross-product audit (PR #65) found a violation of the then-current CLAUDE.md §3.3 requirement:

- ★ **FIX#SR-03-P1**：`FINAL,🐟 漏网之鱼` → `FINAL,🐟 漏网之鱼,dns-failed`
  - File: `独立内核系/Shadowrocket/Shadowrocket.conf:1340`.
  - Cause: Shadowrocket FINAL normally handled traffic only **after the rule table completed**; DNS timeout/resolution failure did **not** automatically enter FINAL and instead errored. Adding `dns-failed` routed DNS failures through the fallback node too.
  - Authority: CLAUDE.md §3.3 explicitly required `FINAL,🐟 漏网之鱼,dns-failed`; `独立内核系/Surge/Surge.conf:1321` in the same repository already matched.
  - The same audit found **no documented** `dns-failed` flag in official Loon / Quantumult X materials: Loon's `final_rule` page did not describe it, and QX `sample.conf` showed only `final, <policy>`. Under CLAUDE.md §2.3's conservative rule, it was **not added** there.

Header version v5.2.5-SR.3 → v5.2.6-SR.4 (aligned with mainline v5.2.6).

<a id="v525-sr3-2026-04-22--移除-72-条-clash-yaml-规则集--anti-adsukka-兼容修复"></a>

## v5.2.5-SR.3 (2026-04-22) — Removed 72 Clash YAML rule sets and fixed anti-AD/Sukka compatibility

Deep review found the same inherited Clash Party v5.2.4 problems across Loon / Shadowrocket / Quantumult X:
- 72 Accademia Clash classical `.yaml` RULE-SETs (only unofficial sources claimed SR auto-detected YAML, so conservatively treated them like the verified Loon failure).
- Bare-host `anti-ad.net/surge.txt` (Loon v5.2.4-Loon.3 had confirmed some affected CN ISPs intercepted DNS and returned HTML).
- Sukka `List/domainset/*.conf` (a Surge-specific subpath unrecognized by Loon and not guaranteed in official SR documentation either).

Applied the verified Loon v5.2.4-Loon.2 / .3 fixes:

<a id="改动"></a>

### Changes

- ★ FIX#SR-01-P1: **removed 72 Clash classical `.yaml` RULE-SETs** (71 Accademia + 1 ACL4SSR Zoom.yaml), which SR could silently load as zero rules.
- ★ FIX#SR-02-P0：`anti-ad.net/surge.txt` → `fastly.jsdelivr.net/gh/privacy-protection-tools/anti-AD@master/anti-ad-surge.txt`
- ★ FIX#SR-03-P0：Sukka `List/domainset/reject_phishing.conf` → `List/non_ip/reject_phishing.conf`
- ★ FIX#SR-04-P1: after removing 72 YAML entries, added DOMAIN-SUFFIX fallbacks for critical domains:
  - `🏦 金融支付`: Monzo / N26 / Chime + 24 international banks (Chase / BofA / HSBC / Barclays / DBS / MUFG / RBC / ANZ and others).
  - `🧑‍💼 会议协作`: Zoom × 5 / RustDesk / Parsec × 3.
  - `🌐 国外网站`: Wayback Machine / Pornhub × 3.

<a id="元信息"></a>

### Metadata

- Version: `v5.2.2-SR.2` → **`v5.2.5-SR.3`** (major version aligned with Clash Party JS `VERSION = 'v5.2.5'`).
- Build：2026-04-20 → 2026-04-22
- Architecture summary: `250+ RULE-SET` → `~290 RULE-SET`.
- Removed 15 orphaned `# Accademia xxx` comment headings whose YAML sections were gone.

<a id="已接受的回归损失与-loon-一致"></a>

### Accepted coverage regression (same as Loon)

Accademia `FakeLocation × 10` (CN-application IP presentation), `GeoRouting × 17 regions`, `eMuleServer`, `HomeIP` and country-specific banking YAML had no equivalent `.list` sources. Critical domains received DOMAIN-SUFFIX fallbacks. The historical entry identified CMFA / OpenClash / SingBox as alternatives retaining full coverage.

<a id="自检"></a>

### Self-checks

- 37 proxy groups ✓
- Remaining `.yaml,` RULE-SETs: 0 ✓
- Remaining `anti-ad.net` references: 0 ✓
- `skk.moe/List/domainset/`: 0 occurrences; `List/non_ip/`: 1 ✓

---

## v5.2.2-SR.2 (2026-04-20)

Strictly aligned business groups with Clash Party:

- ★ Removed the extra `🎵 TikTok` business group (baseline 28 groups); merged TikTok / lemon8 rules into `📱 社交媒体`.
- ★ Fixed the incorrect regional-group emoji referenced by `💬 即时通讯` (`🇸🇬 亚太节点` → `🌏 亚太节点`; the original target did not exist).

## v5.2.2-SR.1 (2026-04-16)

Refactored DNS to map the user's Clash DNS configuration:

- ★ Added `proxy-dns-server` (hidden parameter corresponding to Clash `proxy-server-nameserver`).
- ★ Changed `fallback-dns-server` from system to non-CN DoH (corresponding to Clash `fallback`).
- ★ Reduced `dns-server` to CN DoH (corresponding to Clash `nameserver + direct-nameserver`).
- ★ Documented 4 unportable Clash DNS/database features (bootstrap / respect-rules / fallback-filter / dat format).

<a id="初版-从-clash-party-v522-迁移重构"></a>

## Initial version (migrated/refactored from Clash Party v5.2.2)

- 9 regional url-test groups (`policy-regex-filter` automatically grouped node names by region).
- 28 business policy groups (1:1 with the original).
- Rule sources: `blackmatrix7/ios_rule_script/rule/独立内核系/Shadowrocket/` + szkane + native GEOIP.

<a id="与-clash-party-主线的差异ios-平台--sr-引擎限制"></a>

### Differences from Clash Party mainline (iOS platform + SR engine limits)

- Removed PROCESS-NAME rules (iOS lacked a process-identification API).
- Removed TUN `exclude-process` (SR lacked that mechanism).
- Removed Smart fingerprint injection (SR did not expose TLS fingerprint controls).
- Replaced all GEOSITE with RULE-SETs (no native SR GEOSITE support).
- Replaced all Meta `.mrs` binaries with blackmatrix7 Shadowrocket `.list` files.
- Initially retained some Accademia classical YAML under the assumption SR recognized it by content; all were removed from v5.2.5-SR.3 onward in favor of equivalent `.list` sources + DOMAIN-SUFFIX fallbacks.
- Replaced periodic rule-provider refresh with SR's unified automatic configuration-update mechanism.
