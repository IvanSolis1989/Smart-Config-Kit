<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Loon changelog" width="100%">
</picture>

<a id="loon--变更日志"></a>

# Loon — Changelog

> Changelog for `独立内核系/Loon/Loon.conf`. Major versions follow Clash Party; the `-Loon.N` suffix increments independently.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Project README](../../README.md) · [Documentation index](../../docs/README.md)

## v6.0.21-Loon.11 (2026-10-28)

- Moved Google FCM from downloads to Google services. The 15 domains, 26 IPv4 predicates, rule order and 55 groups were unchanged, as were other push services, DNS and fake-IP.

## v6.0.20-Loon.10 (2026-10-24)

- Organized client directories by core family, retaining files/guides within client subdirectories. Rule semantics/fields were unchanged. Raw configuration URLs changed with paths, requiring reimport; shared `rulesets/` URLs remained unchanged.

<a id="2026-10-19--官方文档与版本核对"></a>

## 2026-10-19 — Official documentation and version review

- Cached official release records, configuration documentation and relevant source, updating REFERENCE currency/capability boundaries. See the [review report](../../docs/upstream/2026-10-19/apple/report.md). This documentation review changed no rules, policy groups or generated payloads.

## v6.0.20-Loon.9 (2026-10-16)

- Issue #187: added exact DIRECT exceptions in existing `scki-adfp-direct` for `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, `hkshort.weixin.qq.com`, preventing WeChat connection endpoints from matching ads first.
- No parent/subdomain expansion; `ad.weixin.qq.com` and `log.weixin.qq.com` remained rejected. Other policies and ordering were unchanged.
- See [WeChat review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence and bounded static acceptance. Reporter-device recovery still required retesting.

## v6.0.19-Loon.8 (2026-10-15)

- FIX#186: unified repository-owned remote assets on GitHub raw HTTPS to avoid jsDelivr repository-size limits, preserving version queries and native formats.
- Reused verified fused payloads; content, ordering and policies were unchanged. Added raw/CDN-reference regressions. See [delivery guidance](../../docs/rule-asset-delivery.md) for cause, download prerequisites and official fields.

## v6.0.18-Loon.7 (2026-10-14)

- Fixed cross-service first-match misclassification: narrowed broad Apple/Microsoft keywords and shared AWS/Azure/CDN suffixes, adding eight guard classes: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social, bytedance-app. Six ADFP records for exact CA revocation/status hosts via DIRECT and exact Microsoft international-mail policy brought the total to 35. `api.byteoversea.com` was an exact TikTok rule, not a shared-suffix expansion. Existing Claude Desktop `a-api`/`a-cdn` exceptions, QUIC/latency options and default-off ZeroTier proxy remained. Crisp relay was a static ASN-overlap risk inference, not a measured incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 nonempty SRS across 81 segments.

## v6.0.17-Loon.6 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to `scki-adfp-ai` for Claude Desktop application-code/user-content loading through AI policy. Based on [official requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Existing rule sets/native syntax remained. Source-semantic gates, 29 ADFP checks, Claude stage inventory and file-level release-batch checks joined the publication chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device reproduction or measurement occurred.

## v6.0.16-Loon.6 (2026-10-12)

- Following v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional ADFP validation. Conversion format, order and target policies remained; no runtime rules were added. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording only observable bytes and conversion receipts. Original remote-input SHA values cannot be reconstructed from old outputs; no claim of complete historical provenance or real-device traffic measurement was made.

## v6.0.15-Loon.6 (2026-10-07)

- Managed configuration supported a 900-second latency-testing profile and non-CN UDP/443 policy selection.
- See [latency and QUIC options](../../docs/traffic-options.md) for switching commands, capabilities and verification.

## v6.0.14-Loon.5 (2026-09-29)

- FIX: remote DIRECT Rule 001 gained the two exact WeChat HTTPDNS hosts before BlockHttpDNS rejection.

## v6.0.13-Loon.4 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE: Remote Rule 013 gained the `linuxdo.org` suffix targeting `🏠 国内网站`; `linux.do` retained restricted-sites routing.

## v6.0.12-Loon.3 (2026-09-01)

- FIX#181-PC: the first fused Remote Rule gained exact direct routing for `login.nvidia.cn` before broad NVIDIA download rules. Other NVIDIA domains were unchanged.

## v6.0.11-Loon.2 (2026-08-22)

- ROUTING: synchronized 69 fused Remote Rules; Gemini and Accademia Gemini moved to `🔍 Google 服务`, while the szkane AI segment retained its position.

## v6.0.10-Loon.2 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: synchronized the leading exact-direct fused rules; the two NetEase game-service hosts matched `DIRECT` before anti-AD and broad CN-game rules.

## v6.0.9-Loon.1 (2026-07-19)

- Remote Rule ordering adds the general GitHub API tools segment before broad AI rules can capture ordinary requests.

## v6.0.8-Loon.1 (2026-07-15)

- Remote Rule synchronizes authoritative domestic precedence and references self-hosted assets using release-version cache keys.

## v6.0.7-Loon.1 (2026-07-14)

- FIX#176: `[Remote Rule]` fused-asset order puts domestic domains before general international CDN / GeoIP fallbacks.

## v6.0.6-Loon.1 (2026-07-14)

- PLATFORM: Desktop outputs handle Windows `WorkPro.exe` / `WorkProWebProcess.exe` direct-process routing; Loon iOS adds no active process rules and continues consuming synchronized fused remote sets.

## v6.0.5-Loon.1 (2026-07-14)

- PLATFORM: Outputs supporting process matching handle WorkPro.exe Windows direct routing; Loon iOS adds no active process rules.

## v6.0.4-Loon.1 (2026-07-13)

- DIRECT-ITWDB: Default `DIRECT` fused sets consumed by `[Remote Rule]` add `itwdb.com`, covering WorkPro subdomains.

## v6.0.3-Loon.1 (2026-07-12)

- SYNC: Upgrades to Clash Party v6.0.3; `[Remote Rule]` contains 64 nonempty fused assets.
- AI-PRECEDENCE: Source-graph early ordering sends ChatGPT/OpenAI and required associated hosts to `🤖 AI 服务`, not ads or overseas-site fallbacks.

## v6.0.2-Loon.1 (2026-07-10)

- FIX#175: `[Remote Rule]` contracts from 71 expanded shards to 63 nonempty fused segments, totaling about 16.06 MiB / 575,499 entries.
- GEOIP: Country codes retain native Loon GEOIP; only service labels become CIDRs, avoiding hundreds of thousands of expanded regional GeoRouting networks.
- BUDGET: Adds aggregate iOS gates of 32 MiB / one million entries and an 18 MiB per-file gate.

## v6.0.1-Loon.1 (2026-07-10)

- FIX#174: Splits the over-budget ad segment into three `[Remote Rule]` entries and the overseas-site tail into two; each remote text shard stays within 18 MiB.
- SEMANTICS: Shards preserve original tag policies/order without changing Loon's final routing precedence.

## v6.0.0-Loon.1 (2026-07-09)

- FUSED-RULESETS: Migrates to 68 fused `[Remote Rule]` entries, retaining necessary local port/fallback rules.
- META: updated version metadata to Clash Party v6.0.0; policy groups were unchanged.

## v5.4.39-Loon.1 (2026-07-09)

- META: updated version metadata to Clash Party v5.4.39.
- N/A: Loon cannot consume Mihomo `.mrs` providers; semantics continue from v5.4.38-Loon.1.

## v5.4.38-Loon.1 (2026-07-09)

- SCKI-SUPPLEMENTAL: Adds 13 repository-maintained supplemental sets to `[Remote Rule]`, replacing scattered inline rules.
- SYNC: aligned version metadata with Clash Party v5.4.38.

## v5.4.37-Loon.1 (2026-06-29)

- META#170-DNS-POLICY: updated version metadata to Clash Party v5.4.37.
- N/A: Loon uses `dns-server` / `doh-server` / `[Host]`, without an equivalent Mihomo `nameserver-policy` field; rules/DNS semantics remain unchanged.

## v5.4.36-Loon.1 (2026-06-29)

- CLEAN#171-DIRECT: removed 22 individually confirmed redundant `DOMAIN` / `DOMAIN-SUFFIX` rules; remote rule sets were unchanged.
- AI / Binance / Microsoft-login candidates remained because earlier different-policy MRS prevented safe deletion.

## v5.4.35-Loon.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM: Removes five Remote Rules covered by earlier same-target rules: Marketing, EncoreTVB, FindMy, WildRift, AcFun.
- CLEAN#170-DIRECT: removed three later inline rules already covered by the earlier same-target Douyin China-streaming guard: `douyin.com`, `douyinpic.com`, `douyinvod.com`.
- Measured `[Remote Rule]` count: 288 → 283; Loon-specific `DEST-PORT` and segmented-rule semantics remain unchanged.

## v5.4.34-Loon.1 (2026-06-28)

- ★ FIX#169-AMAP: Adds blackmatrix7 Loon `GaoDe.list` Remote Rule targeting `🏠 国内网站`.
- Kept it after advertising/threat rules and before the international-site fallback, addressing the risk of the `webapi.amap.com` Amap API matching that fallback.

## v5.4.33-Loon.1 (2026-06-27)

- ★ FEAT#169-AI-CODING: Adds VPSDance Loon `coding.list` Remote Rule targeting `🤖 AI 服务`.

## v5.4.32-Loon.1 (2026-06-25)

- ★ FIX#168-CN-GAME: Moves domestic-game segments before overseas games in both `[Remote Rule]` and `[Rule]`, preserving first-match precedence in Loon-native syntax.
- Aligned the file header and README with Clash Party v5.4.32.

## v5.4.31-Loon.1 (2026-06-20)

- ★ FIX#167-DOUYIN: added leading Douyin Web CN-streaming rules so `douyin.com`, `zjcdn.com` and related domains matched `📺 国内流媒体` before TikTok and international rule sets.
- Aligned the file header and README with Clash Party v5.4.31.

## v5.4.30-Loon.1 (2026-06-17)

- ★ FEAT#166-GOOGLE: Adds `🔍 Google 服务` before `🔧 工具与服务`.
- Google Search / Drive / Earth / Google / Scholar sets move to the new group; tools retain non-Google search/developer services.

## v5.4.29-Loon.1 (2026-06-10)

- ★ PERF#165-LATENCY: changed 22 regional `url-test` groups from `interval=180 -> interval=300`.
- README regional-group examples synchronize to `interval=300,tolerance=50`.
- Rules, Remote Filters, and business-group candidates remain unchanged.

## v5.4.27-Loon.1 (2026-06-07)

- ★ CLEAN#165: Removes seven local inline domains already covered by `[Remote Rule]` for Claude / PayPal / HBO / Hulu / Xbox; matches retain the same policy.

## v5.4.26-Loon.1 (2026-06-07)

- ★ FIX#164: Protects Tencent WorkBuddy `copilot.tencent.com` from szkane `AiDomain.list` substring `DOMAIN-KEYWORD,copilot`, which wrongly routed it through overseas `🤖 AI 服务` and caused conversation errors. Inserts `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站` before szkane AiDomain in [Rule], alongside the RustDesk guard. Baseline: Clash Party v5.4.26.

## v5.4.25-Loon.1 (2026-06-04)

- ★ SYNC: Aligns artifact-header versions/baseline statements with Clash Party v5.4.25; rule semantics remain v5.4.23-Loon.2, with no new Loon-specific rule changes.

## v5.4.23-Loon.2 (2026-06-02)

- ★ FIX#162: Addresses remote-rule-list loading failures:
  - `ruleset.skk.moe/List/non_ip/reject_phishing.conf` returned 404; Loon continues avoiding Surge `domainset` and uses same-format non_ip `reject.conf` instead.
  - Removes obsolete HaGeZi `share/surge-tif-medium.txt`, returning jsDelivr 403; no equivalent Loon RULE-SET format was available from HaGeZi at that release.
  - Removes nonexistent upstream `独立内核系/Loon/RemoteDesktop/RemoteDesktop.list`; only Clash retained process-name rules, inapplicable to Loon.
  - Corrected `BiliIntl/BiliIntl.list` to the then-current upstream `BiliBiliIntl/BiliBiliIntl.list` path.

## v5.4.23-Loon.1 (2026-06-02)

- ★ FIX#161: `DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` targeted `🏠 国内网站` direct routing for Zhihu image CDN/short links, matching the baseline.

## v5.4.22-Loon.1 (2026-05-31)

- ★ Added GeTui push SDK `getui.com` / `getui.net` / `gepush.com` to direct exceptions after review. Continuing #2, generic ad/privacy feeds treated them as trackers despite carrying application push such as Mi Home; the owner chose to allow them.

- N/A#1 Fine-grained QUIC: Loon disable-udp-ports lacks AND/NOT allowlist exemptions; see in-file engine notes.

## v5.4.21-Loon.1 (2026-05-31)

#4 Adapted from Proxy-override: Changes `doh-server` from domain-host DoH to IP-host DoH to reduce bootstrap exposure. The historical entry claimed leak elimination, but plaintext `dns-server` IP fallbacks remain because Loon does not accept DoH URLs there; this is not an unconditional no-leak guarantee.

## v5.4.20-Loon.1 (2026-05-30)

- N/A#6 Node-filter keywords (batch B): Loon has no runtime subscription-junk filter, so #6 does not apply; version aligns with Clash Party v5.4.20.

## v5.4.19-Loon.1 (2026-05-30)

Proxy-override adoption batch A · #2 leading CN SDK/CDN direct rules (following Clash Party v5.4.19; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`):

- Placed jpush / `msg.umeng.com` before advertising RULE-SETs with forced DIRECT to carry legitimate application push/messages, aligning with the Mihomo family.
- Added `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com` to the `🏠 国内网站` segment.
- N/A: #3 fake-ip-filter (field absent in Loon) and #5 direct-nameserver-follow-policy (not a Mihomo core).
- 🔢 Version: v5.4.17-Loon.1 → v5.4.19-Loon.1; all outputs skip invalidated .18 and align at v5.4.19.
## v5.4.17-Loon.2 (2026-05-30)

- ★ FIX#KR-WB: Adds `(?<![a-zA-Z])KR(?![a-zA-Z])` boundaries to bare KR in `JPKR_Filter` / `APAC_Filter` and residential equivalents, matching existing US/SG syntax.
  - Loon `NameRegex` uses `(?i)`, so bare KR also matched lowercase kr in Ukraine/Krakow/Kraken, misclassifying them into Japan/Korea; boundaries prevent this.
  - Covers JPKR_Filter / JPKR_HOME_Filter / APAC_Filter / APAC_HOME_Filter; full KOR/Korea/Seoul/🇰🇷 labels remain unaffected.
  - §1.5 parallel audit: mainline JS + CMFA already had boundaries and were unchanged.
  - Regression tests: `tools/test-kr-boundary.js`.

## v5.4.17-Loon.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP: Synchronizes v5.4.17 DNS using Loon-native equivalents.
  - `dns-server` retains only IP-literal bootstrap entries; DoH URLs appear only in `doh-server`.
  - Loon lacks Mihomo's four-way separation including `direct-nameserver` / `proxy-server-nameserver`; native fields provide a best-effort mapping.

## v5.4.16-Loon.1 (2026-05-20)

- ✅ FIX#149-P0: Inserts early local `[Rule]` entry `DOMAIN-SUFFIX,paddle.com,🏦 金融支付`.
  - Local Loon rules precede remote rules, overriding anti-AD/DustinWin false-positive blocking of `analytics.paddle.com`.

## v5.4.15-Loon.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER: synchronized v5.4.15 metadata and added GEOSITE coverage references.
- ♻️ REFACTOR#AD-FP-MODULE: Labels the Anti-ad false-positive allowlist at the top of local [Rule]; local rules still precede remote rules.

## v5.4.14-Loon.1 (2026-05-20)

- ✅ FIX#CF-R2-P0: Inserts early local `[Rule]` entry `DOMAIN-SUFFIX,cloudflarestorage.com,🌐 国外网站`.
  - Local rules precede subscribed rules, overriding Sukka phishing's false-positive Cloudflare R2 storage-domain block.
  - Removed the duplicate later `🌐 国外网站` entry.

## v5.4.13-Loon.1 (2026-05-19)

- ✅ FIX#STUN-PORTS: Adds standard STUN/TURN ports `5349 / 19302 / 19305 / 19307 -> DIRECT` using native Loon `DEST-PORT`.
- N/A#FAKE-IP: Loon lacks Mihomo `fake-ip-filter`; `disable-udp-ports = 443` continues excluding UDP/443 from default TURN exceptions.

## v5.4.12-Loon.2 (2026-05-16)

- ✅ FIX#LOON-REMOTE-RULE: Restores all 288 remote rule-set URLs to `[Remote Rule]`, preventing Loon from treating `https://...` inside `[Rule]` as syntax errors.
- ✅ FIX#LOON-LOCAL-RULE: Xiaomi DIRECT allowlist and local `DOMAIN` / `GEOIP` / `FINAL` stay in `[Rule]`; groups, sources, and business semantics remain unchanged.

## v5.4.12-Loon.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 documentation for the RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Loon has no Mihomo fake-ip-filter field; existing rustdesk.com meeting-collaboration routing is unchanged.

## v5.4.11-Loon.1 (2026-05-12)

- ✅ FIX#RD-DOMAIN: retained the collaboration-domain fallback for `rustdesk.com`, avoiding broad Copilot matches on mobile without process matching.
- ✅ FIX#DNS-BOOTSTRAP: Reorders `doh-server` with AliDNS first, aligning with this DNS-bootstrap fix.

## v5.4.9-Loon.1 (2026-05-11)

- ★ META#LOCAL-TOOLS: Follows Clash Party v5.4.9; Loon is an iOS output, so no desktop PROCESS-NAME rules are copied into mobile configuration.
- Recorded the direct-tool list in `docs/process-name-compatibility.md` and test fixtures; desktop Mihomo / sing-box / Surge Mac handled it.

## v5.4.8-Loon.2 (2026-05-11)

- ★ META#GROUP-COUNT: aligned header/README regional-group counts at 22 (11 all-node + 11 residential).
  - `[Proxy Group]` / `[Remote Rule]` / `[Rule]` semantics remain unchanged.

## v5.4.8-Loon.1 (2026-05-09)

- ★ ORDER#RULE-TAIL: synchronized v5.4.8 tail-rule order.
  - UI group order stays unchanged; only rule matching order changes.

## v5.4.7-Loon.1 (2026-05-09)

- ★ FEAT#TikTok: added independent `🎵 TikTok` group (32 service groups), between `📺 国内流媒体` and `🎥 Netflix`.
- ★ FIX#HK: Appends `|广港` to `HK_Filter` / `HK_HOME_Filter`, completing IEPL/IPLC cross-border dedicated-link classification.

## v5.4.6-Loon.1 (2026-05-08)

- ★ FEAT#145: added WeChat CDN direct rule `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT`.
  - Added after `mail.qq.com` in stage 7 (CN mail direct routing), routing the WeChat CDN domain directly.
  - Followed v5.4.6 baseline.

## v5.4.5-Loon.1 (2026-05-07)

- ★ Moved global nodes first and synchronized group ordering across products, following v5.4.5.

## v5.4.4-Loon.1 (2026-05-07)

- ★ FIX#144: added a direct rule for bbys.app, recorded in this version as direct CDN access for that video site.
  - Added `DOMAIN-SUFFIX,bbys.app,DIRECT` at the end of stage 28 (CN-site fallback).
  - Followed Clash Party v5.4.4.
- ★ FEAT#143: Residential NameRegex FilterKey recognizes IEPL/IPLC/dedicated links.
  - Appends `iplc|iepl|专线` to residential subpatterns in all ten `*_HOME_Filter` FilterKeys.
  - Matched residential-type node names containing IPLC/IEPL/`专线` identifiers.
- ★ Major version v5.4.3 → v5.4.4; Build 2026-05-06 → 2026-05-07.
- FIX#142 (DNS cold start) was specific to Clash Party JS; static configuration files were exempt.

## v5.4.3-Loon.1 (2026-05-06)

- ★ FEAT: Adds `|home` to residential FilterKey, following Clash Party v5.4.3.
  - Appends `|home` to all nine `*_HOME_Filter` FilterKeys, matching names whose only residential marker is Home.

## v5.4.2-Loon.1 (2026-05-05)

- ★ FIX#41-P0: Xiaomi core-service DIRECT exceptions, following v5.4.2.
  - Adds 11 DOMAIN/DOMAIN-SUFFIX DIRECT rules before [Remote Rule].

## v5.4.0-Loon.1 (2026-05-05)

- ★ FEAT#SG: added independent `🇸🇬 狮城节点` and `🏡 狮城家宽` groups.
  - Split Singapore into a separate region from `🌏 亚太节点`.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Followed Clash Party v5.4.0.

## v5.3.0-Loon.1 (2026-04-26)

- ★ REFACTOR#2: changed streaming grouping from region-based to platform-based (7 → 13 groups).
  - Added independent Netflix / Disney+ / HBO/Max / Hulu / Prime Video groups.
  - Split global YouTube / music-streaming groups.
  - Retained Hong Kong / Taiwan / Japan-Korea / Europe regional streaming groups.
  - Added other-international-streaming fallback for long-tail platforms and former Southeast Asia streaming.
  - Service groups: 25 → 31; total groups: 43 → 49.

<a id="v5211-loon1-2026-04-26--业务组合并精简-2825降低用户认知负担"></a>

## v5.2.11-Loon.1 (2026-04-26) — Business groups consolidated 28 → 25 to reduce complexity

- ★ REFACTOR#1: followed v5.2.11 to consolidate service groups and reduce selection complexity.
  - Merged search engines and developer services into tools/services.
  - Merged mail services into international sites.
  - Merged cloud/CDN into international sites.
  - Changed downloads/updates from DIRECT-first to proxy-first.
  - Retained independent BT/PT Tracker.
- Bump: `v5.2.10-Loon.2` → `v5.2.11-Loon.1`

<a id="v5210-loon2-2026-04-25--修复-loon-弹窗第-559-行语法错误dst-port7680reject"></a>

## v5.2.10-Loon.2 (2026-04-25) — Fixes line 559 syntax error: DST-PORT,7680,REJECT

- ★ **FIX#40** (Loon-specific syntax): Loon port-rule names differ from Surge/Shadowrocket/Clash.
  - Symptom: Loading configuration displayed original error `第 559 行出现语法错误：DST-PORT,7680,REJECT`.
  - Cause: Official Loon port rules are `DEST-PORT` / `SRC-PORT`; see [nsloon.app/docs/Rule/port_rule/](https://nsloon.app/docs/Rule/port_rule/).
    The repository had copied Surge/SR `DST-PORT`, which Loon rejected.
  - Fix: Changes all four port rules to `DEST-PORT`.
    - `DST-PORT,7680,REJECT` → `DEST-PORT,7680,REJECT`（Windows Delivery Optimization）
    - `DST-PORT,123,DIRECT` → `DEST-PORT,123,DIRECT`（NTP）
    - `DST-PORT,3478,DIRECT` → `DEST-PORT,3478,DIRECT`（STUN）
    - `DST-PORT,3479,DIRECT` → `DEST-PORT,3479,DIRECT`（STUN-alt）
  - Regression prevention: Adds a warning in the header's [Rule] explanation stating Loon uses DEST-PORT, not DST-PORT.
- Equivalent-case audit under historical CLAUDE.md §1.5:
  - Surge / Shadowrocket officially support `DST-PORT`; unchanged. ✓
  - Quantumult X configuration contains no DST-PORT rules, only comments mentioning it; unchanged. ✓
  - Clash family (CMFA / OpenClash Normal+Smart / Clash Party JS) uses Mihomo supporting `DST-PORT`; unchanged. ✓
  - SingBox / v2rayN / Passwall* use native port fields and are unaffected. ✓
- Bump: `v5.2.10-Loon.1` → `v5.2.10-Loon.2`

<a id="v5210-loon1-2026-04-25--境外-doh-端点改路由到--受限网站"></a>

## v5.2.10-Loon.1 (2026-04-25) — Overseas DoH endpoints routed to restricted sites

- ★ FIX#39: synchronized shared behavior with v5.2.10.
  - `DOMAIN,dns.google,☁️ 云与CDN` → `🚫 受限网站`.
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `🚫 受限网站`.
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `🚫 受限网站`.
  - `[General] doh-server` keeps cloudflare/google DoH unchanged as Loon's own upstream configuration.
- Bump: `v5.2.8-Loon.7` → `v5.2.10-Loon.1`, catching up to mainline v5.2.10.

<a id="v528-loon7-2026-04-25--欧洲节点-filter-补全-grrohucz-及多国关键词扩充"></a>

## v5.2.8-Loon.7 (2026-04-25) — Europe filters add GR/RO/HU/CZ and expand country keywords

- ★ **FIX#29-P2** (parallel bug): completed missing European countries in `🇪🇺 欧洲节点` + `🏡 欧洲家宽` filters.
  - The previous OpenClash update added 15 European countries to REGIONS, but iOS artifact EU filters had not followed.
  - Fix: added GR/RO/HU/CZ codes and full keywords to SR/Surge/Loon/QX EU node + residential filters
    (Greece/Athens/Romania/Bucharest/Hungary/Budapest/Czech/Prague + Chinese names + flag emoji).
  - Also expanded PT/BE/IE/DK/NO keywords (city names + Chinese names + 🇵🇹/🇧🇪/🇮🇪/🇩🇰/🇳🇴).
  - Parallel audit: Clash Party JS / OpenClash already covered these; CMFA used include-all-proxies as a global fallback (N/A); SingBox/v2rayN had no runtime node classification (N/A).
- Version `v5.2.8-Loon.6` → `v5.2.8-Loon.7`.

<a id="v528-loon6-2026-04-24--dnspod-doh-端点切换为纯-ip-形式"></a>

## v5.2.8-Loon.6 (2026-04-24) — DNSPod DoH endpoint changed to an IP literal

- ★ Replaces `https://doh.pub/dns-query` with `https://1.12.12.12/dns-query` in `doh-server`.
  - a DNSPod IP-host DoH endpoint, **avoiding bootstrap resolution of `doh.pub`** for a more reliable iOS cold start.
- Version `v5.2.8-Loon.5` → `v5.2.8-Loon.6`.

<a id="v528-loon5-2026-04-23--基线对齐-clash-party-v528无代码改动"></a>

## v5.2.8-Loon.5 (2026-04-23) — Aligns with Clash Party v5.2.8 without code changes

- Baseline bump: `v5.2.4-Loon.4` → `v5.2.8-Loon.5`.
- v5.2.5 Accademia pruning: Loon v5.2.4-Loon.2/.3 already independently performed equivalent pruning; unchanged.
- v5.2.6 alpha-3/fallback/cleanupSubscription fixes: Loon `NameRegex FilterKey` already fully covers TWN/JPN/KOR/SGP; unchanged.
- v5.2.7 mirror-URL switch: Loon directly uses upstream URLs, not mirrors; unchanged.
- v5.2.8 CMFA/OpenClash APAC-filter fix: Loon `NameRegex FilterKey` already fully covers HK/TW/JP/KR; unchanged.

<a id="v524-loon4-2026-04-22--根治第-229-行语法错误288-条-rule-set-迁移到-remote-rule"></a>

## v5.2.4-Loon.4 (2026-04-22) — Fixes line 229 syntax error: moves 288 RULE-SETs into [Remote Rule]

Users reported v5.2.4-Loon.3 still displayed a syntax error at line 229 (anti-ad-surge.txt); a user's friend supplied the correct Loon
subscription rule-set syntax that day:

    URL, policy=<policy-group>, tag=<display-name>, enabled=true

It belongs in `[Remote Rule]`, not Surge-style `RULE-SET,URL,policy` inside `[Rule]`.

Reviewing fmz200/wool_scripts Loon.conf and the YueChan/Loon examples confirmed:

- Loon `[Rule]` accepts only **inline rules** such as `DOMAIN-SUFFIX,x,p` / `IP-CIDR,x,p` / `GEOIP,CN,p` / `FINAL,p`.
- **Remote subscribed RULE-SETs belong in `[Remote Rule]`**, using URL-first key=value syntax; Surge-style
  `RULE-SET,URL,policy` triggers a syntax error from the first such line.

The repository had used the wrong section since v5.2.3-Loon.1 and missed it during v5.2.4-Loon.2's overhaul. The historical review considered the documentation unclear:
of three reference examples, only YueChan had a clean [Rule] section, while fmz200's [Remote Rule] supplied the complete syntax.

<a id="本次改动一次性彻底修"></a>

### Changes in this fix

- ★ FIX#Loon-15-P0: **Adds `[Remote Rule]`** between `[Proxy Group]` and `[Rule]`.
- ★ FIX#Loon-16-P0: **Migrates all 288 RULE-SETs** into `[Remote Rule]`:
  - `RULE-SET,<URL>,<policy>` → `<URL>, policy=<policy>, tag=<file_basename>, enabled=true`
  - Derives tags from the final URL path component, such as `Advertising.list` / `anti-ad-surge.txt`, making Loon's rule-source panel easier to identify.
  - All 288 tags are unique, verified with `uniq -c`.
- ★ `[Rule]` now retains only **inline rules** (DOMAIN / DOMAIN-SUFFIX / IP-CIDR / DST-PORT / HOST / GEOIP / FINAL, as recorded at that release;
  DST-PORT is corrected in a later entry), totaling 614 lines and matching fmz200 / YueChan configuration structure.
- ★ Header architecture summary changes from `... + 250+ RULE-SET` to `... + 288 [Remote Rule] subscribed rule sets`.

<a id="迁移自动化"></a>

### Migration automation

Python script `tmp/migrate_loon.py` performs the bulk migration, avoiding error-prone manual edits to 288 entries:

1. Scans `^RULE-SET,(https?://[^,]+),(.+)$` to extract URL and policy.
2. Generates `tag=` from the final URL component.
3. Inserts entries into `[Remote Rule]` grouped by stage comments, preserving comment context.
4. Leaves only non-RULE-SET lines in `[Rule]`.

<a id="自检"></a>

### Self-checks

- 37 proxy groups ✓
- Nine regional filters match nine url-test references one to one. ✓
- `[Remote Rule]`: 288 entries. ✓
- Remaining `RULE-SET,` entries inside `[Rule]`: zero. ✓
- `IP-CIDR6` / `FINAL,...,dns-failed` / `bypass-system` / `ipv6-enabled` / `tun-excluded-routes` /
  `hijack-dns` / `udp-policy-not-supported`: zero occurrences. ✓
- All 288 tags are unique. ✓

<a id="官方文档证据"></a>

### Official documentation evidence

- `[Remote Rule]` syntax: [fmz200/wool_scripts Loon.conf](https://raw.githubusercontent.com/fmz200/wool_scripts/main/Loon/config/Loon.conf).
- Original example supplied by the user's friend:
  ```
  https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Duckduckgo/Duckduckgo.list, policy=美国节点-兔子, tag=Duckduckgo.list, enabled=true
  ```

---

<a id="v524-loon3-2026-04-22--anti-ad-规则源改用-jsdelivr-镜像"></a>

## v5.2.4-Loon.3 (2026-04-22) — anti-AD source switched to a jsDelivr mirror

- ★ FIX#Loon-14-P0：`RULE-SET,https://anti-ad.net/surge.txt,🛑 广告拦截`
  → `RULE-SET,https://fastly.jsdelivr.net/gh/privacy-protection-tools/anti-AD@master/anti-ad-surge.txt,🛑 广告拦截`
  - Symptom: Enabling configuration displayed a line 229 syntax error, reported in a user screenshot.
  - The historical diagnosis suspected some ISP/DNS environments returned captive HTML or 403 for self-hosted non-CDN `anti-ad.net`;
    parsing HTML as rules would fail. The other 287 RULE-SETs used
    fastly.jsdelivr.net or ruleset.skk.moe without the same reported issue. The later .4 entry identifies the section-placement error that persisted after this change.
  - Redirects to the official GitHub repository `privacy-protection-tools/anti-AD`
    file `anti-ad-surge.txt`, with equivalent surge.txt semantics through jsDelivr.
- ★ Additional scan: Apart from anti-ad.net, all 288 RULE-SETs then in [Rule] used
  fastly.jsdelivr.net / ruleset.skk.moe; the historical scan found no similar endpoint concern, not a general reliability guarantee.

---

<a id="v524-loon2-2026-04-22--loon-原生语法兼容性大修"></a>

## v5.2.4-Loon.2 (2026-04-22) — Loon-native syntax compatibility overhaul

A user reported Loon was unusable with many configuration conflicts. Review confirmed v5.2.3-Loon.1 had copied
multiple Surge-only syntaxes into Loon, causing unrecognized sections/rules and silent failures. This release
compared YueChan/Loon, Loon0x00/LoonExampleConfig, and fmz200/wool_scripts
examples and aligned fields with Loon-native syntax.

<a id="general-段字段对齐p0"></a>

### [General] field alignment (P0)

- ★ FIX#Loon-01-P0: Changes `tun-excluded-routes = ...` to official **`bypass-tun = ...`**.
- ★ FIX#Loon-02-P0: Removes DoH URLs from `dns-server`; DoH belongs in `doh-server`, while `dns-server`
  accepts only system and IP literals. Loon discarded the v5.2.3 `https://doh.pub/dns-query` entry incorrectly placed there.
- ★ FIX#Loon-03-P0: Changes `ipv6-enabled = true` to **`ipv6 = true`**, the native field without the -enabled suffix.
- ★ FIX#Loon-04-P0：`udp-policy-not-supported-behaviour = REJECT` → **`udp-fallback-mode = REJECT`**
- ★ FIX#Loon-05-P0: Removes Surge-only `bypass-system = true`, absent in Loon.
- ★ FIX#Loon-06-P0: Removes unsupported `hijack-dns = 8.8.8.8:53, 8.8.4.4:53`.
- ★ FIX#Loon-07-P1: Adds `geoip-url = https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb`.
  Loon supports geoip-url; corrects the v5.2.3 header's false statement that configuration cannot specify MMDB,
  automating MMDB downloads without manual UI action.

<a id="remote-filter--proxy-group-结构性重构p0"></a>

### [Remote Filter] + [Proxy Group] structural refactor (P0)

- ★ FIX#Loon-08-P0: **Adds `[Remote Filter]`** with native `NameRegex + FilterKey`
  defining nine regional filters: GLOBAL / HK / TW / JPKR / APAC / US / EU / AM / AF,
  replacing unsupported Surge url-test inline policy-regex-filter=.
- ★ FIX#Loon-09-P0: Nine url-test groups reference filter names through `= url-test,<Filter>,url=...,interval=600,tolerance=50`,
  removing unsupported timeout= and select=0 parameters, which had broken parsing across regional groups and disabled aggregation.

<a id="rule-段格式对齐p0"></a>

### [Rule] syntax alignment (P0)

- ★ FIX#Loon-10-P0: **Removes 72 Clash classical `.yaml` RULE-SETs**, comprising 71 Accademia sources and one ACL4SSR Zoom.yaml.
  Loon RULE-SET expects plain-text Surge/Loon .list/.conf; YAML fails or is silently discarded.
- ★ FIX#Loon-11-P0: Changes three `IP-CIDR6,::1/128,...` rules to `IP-CIDR,::1/128,...`; Loon uses IP-CIDR for automatic IPv4/IPv6 detection.
- ★ FIX#Loon-12-P0: Changes `FINAL,🐟 漏网之鱼,dns-failed` to `FINAL,🐟 漏网之鱼`; dns-failed is a Surge-only suffix unsupported by Loon.
- ★ FIX#Loon-13-P0：`ruleset.skk.moe/List/domainset/reject_phishing.conf`
  → `ruleset.skk.moe/List/non_ip/reject_phishing.conf`; Sukka domainset/ is Surge-specific,
  while non_ip/ provides plain-text .conf rule lists shared by Surge/Loon.

<a id="rule-段兜底补丁p1最小化功能回归"></a>

### [Rule] fallback patches (P1, limiting functional regression)

After removing 72 Accademia YAML sources, bm7 / szkane / sukka cover most content; selected Accademia-only
services receive DOMAIN-SUFFIX fallbacks so key domains do not fall through FINAL:

- Financial payments: Monzo / N26 / Chime; 24 major international-bank domains (Chase / BofA / WellsFargo /
  Citi / HSBC / Barclays / Lloyds / Santander / DB / ING / BNP / SG / OCBC / UOB /
  DBS / MUFG / SMBC / Mizuho / RBC / TD / Scotia / CBA / ANZ / Westpac）
- Collaboration: Zoom (five domains), RustDesk, Parsec (three domains).
- Overseas sites: Wayback Machine and Pornhub (three domains).
- Accepted coverage losses: Accademia `FakeLocation × 10`, intended for domestic-application IP-location presentation,
  `GeoRouting × 17 regions` for country/region ccTLD subdivisions, eMuleServer, and HomeIP.
  These were Clash-classical-specific sets with no equivalent Loon .list source;
  the historical instructions pointed users needing that coverage to CMFA / OpenClash / SingBox.

<a id="头部--元信息"></a>

### Headers and metadata

- ★ Version: `v5.2.3-Loon.1` → `v5.2.4-Loon.2`; aligns major version with Clash Party v5.2.4.
- ★ Build：2026-04-20 → 2026-04-22
- ★ Architecture summary changes from nine regional url-test groups using policy-regex-filter to nine using [Remote Filter] NameRegex.
- ★ Removes the misleading MMDB warning and configures downloads through [General] geoip-url instead.
- ★ Source description removes `acc = Accademia/Additional_Rule_For_Clash`, which has been entirely removed.

<a id="自检结果"></a>

### Self-check results

- Total groups: 37, comprising nine url-test and 28 select. ✓
- [Remote Filter] defines nine filters, matching the nine url-test references one to one. ✓
- Remaining .yaml RULE-SETs: zero. ✓
- `IP-CIDR6,` / `FINAL,...,dns-failed` / `policy-regex-filter=` / `bypass-system` /
  `tun-excluded-routes` / `ipv6-enabled` / `hijack-dns` / `udp-policy-not-supported-behaviour`
  All have zero occurrences. ✓
- bypass-tun / ipv6 = / udp-fallback-mode / geoip-url: one occurrence each. ✓
- Total lines: 1346 versus v5.2.3's 1383; removing 72 YAML entries and adding about 40 DOMAIN-SUFFIX fallbacks yields 37 fewer lines.

<a id="官方文档证据-1"></a>

### Official documentation evidence

- Official Loon0x00/LoonExampleConfig example.conf: bypass-tun / doh-server / dns-server = system,IP.
- YueChan/Loon `Default.Conf`（`ipv6` / `udp-fallback-mode` / `geoip-url` / `ipasn-url`）
- fmz200/wool_scripts Loon.conf: Eight NameRegex regions under [Remote Filter], FINAL without dns-failed.
- TiyNa/LoonManual + chiupam/tutorial: `NameRegex, FilterKey = "regex"` syntax.

---

<a id="v523-loon1-2026-04-20--初版"></a>

## v5.2.3-Loon.1 (2026-04-20) — Initial release

- ★ Migrates from Surge v5.2.3-Surge.1, retaining nine regional url-test groups, 28 business select groups, and approximately 930 rules.
- ★ This initial release kept RULE-SET in [Rule] to minimize diffs and retain Surge comparability, incorrectly claiming Loon-native compatibility. Later v5.2.4-Loon.4 records the correction to [Remote Rule].
- ★ Loon [General] fields as recorded in the initial release:
  - dns-server, then incorrectly described as concurrent DoH/system DNS, plus dedicated doh-server; later entries correct dns-server's accepted values.
  - skip-proxy for private networks and banking/payment endpoints, described then as avoiding TUN interception.
  - `ipv6-enabled = true`
- ★ Removes Surge-specific fields:
  - geoip-maxmind-url; the original release incorrectly said MMDB required manual UI download and could not be specified in configuration, corrected later through geoip-url.
  - read-etc-hosts / exclude-simple-hostnames, specific to Surge Mac.
  - encrypted-dns-follow-outbound-mode, absent in Loon.
  - block-quic = all-proxy; Loon uses disable-udp-ports instead.

<a id="与-clash-party-主线的差异loon-引擎限制"></a>

### Differences from Clash Party mainline (Loon engine limits)

- No PROCESS-NAME on iOS, which lacks the corresponding process API.
- No Smart groups or LightGBM because Loon is not Mihomo.
- No fpByPurpose TLS fingerprint injection; Loon exposes no uTLS controls.
- No GEOSITE; Loon uses RULE-SET plus built-in MMDB, with service-specific GEOIP labels depending on MMDB replacement.
