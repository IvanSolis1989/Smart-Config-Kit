<!-- Full English translation of the historical record. -->

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Clash Meta For Android (CMFA) changelog" width="100%">
</picture>

<a id="clash-meta-for-android-cmfa--变更日志"></a>

# Clash Meta For Android (CMFA) — Changelog

> History of `Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml`.
> Major versions follow the Clash Party mainline.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Back to README](../../README.md) · [Documentation center](../../docs/README.md)

## v6.0.21-cmfa.15 (2026-10-28)

- Moved Google FCM from downloads to Google services. The 15 domains, 26 IPv4 predicates, rule order and 55 groups were unchanged, as were other push services, DNS and fake-IP.

## v6.0.20-cmfa.14 (2026-10-24)

- Organized client directories by core family, retaining files/guides within client subdirectories. Rule semantics/fields were unchanged. Raw configuration URLs changed with paths, requiring reimport; shared `rulesets/` URLs remained unchanged.

## v6.0.20-cmfa.13 (2026-10-20)

- Business DNS policy became a projection of unified source data without changing groups, node selection or rule/MRS/fused payloads.

<a id="2026-10-19--官方文档与版本核对"></a>

## 2026-10-19 — Official documentation and version review

- Cached official releases, configuration documentation and applicable source, updating REFERENCE freshness/capability boundaries. See the [review](../../docs/upstream/2026-10-19/mihomo/report.md). This documentation review changed no rules, groups or generated payloads.

## v6.0.20-cmfa.12 (2026-10-16)

- Issue #187: added exact DIRECT exceptions in existing `scki-adfp-direct` for `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, `hkshort.weixin.qq.com`, preventing WeChat connection endpoints from matching ads first.
- No parent/subdomain expansion; `ad.weixin.qq.com` and `log.weixin.qq.com` remained rejected. Other policies and ordering were unchanged.
- See [WeChat review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence and bounded static acceptance. Reporter-device recovery still required retesting.

## v6.0.19-cmfa.11 (2026-10-15)

- FIX#186: unified repository-owned remote assets on GitHub raw HTTPS to avoid jsDelivr repository-size limits, preserving version queries and native formats.
- Reused verified fused payloads; content, ordering and policies were unchanged. Added raw/CDN-reference regressions. See [delivery guidance](../../docs/rule-asset-delivery.md) for cause, download prerequisites and official fields.

## v6.0.18-cmfa.10 (2026-10-14)

- Fixed cross-service first-match misclassification: narrowed broad Apple/Microsoft keywords and shared AWS/Azure/CDN suffixes, adding eight guard classes: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social, bytedance-app. Six ADFP records for exact CA revocation/status hosts via DIRECT and exact Microsoft international-mail policy brought the total to 35. `api.byteoversea.com` was an exact TikTok rule, not a shared-suffix expansion. Existing Claude Desktop `a-api`/`a-cdn` exceptions, QUIC/latency options and default-off ZeroTier proxy remained. Crisp relay was a static ASN-overlap risk inference, not a measured incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 nonempty SRS across 81 segments.

## v6.0.17-cmfa.9 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to `scki-adfp-ai` for Claude Desktop application-code/user-content loading through AI policy. Based on [official requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Existing rule sets/native syntax remained. Source-semantic gates, 29 ADFP checks, Claude stage inventory and file-level release-batch checks joined the publication chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device reproduction or measurement occurred.

## v6.0.16-cmfa.9 (2026-10-12)

- Following v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional ADFP validation. Conversion format, order and target policies remained; no runtime rules were added. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording only observable bytes and conversion receipts. Original remote-input SHA values cannot be reconstructed from old outputs; no claim of complete historical provenance or real-device traffic measurement was made.

## v6.0.15-cmfa.9 (2026-10-07)

- Default `standard` url-test groups and `Subscribe.health-check` retained 300 seconds with `lazy: true`; 900 seconds remained optional. QUIC defaults were unchanged.

## v6.0.15-cmfa.8 (2026-10-07)

- Managed options switched static-YAML latency intervals, lazy behavior and leading international UDP/443 rules.
- See [latency and QUIC options](../../docs/traffic-options.md) for switching commands, capabilities and verification.

## v6.0.14-cmfa.7 (2026-09-30)

- CANDIDATES: all 22 native regional/global/residential url-test groups used `exclude-type: direct|reject`, preserving named support outbounds and dial dependencies without treating them as remote latency candidates.
- EMPTY: configured `empty-fallback: REJECT` for every test group, avoiding default direct fallback after support outbounds were excluded.
- VERIFY: a local Mihomo v1.19.29 controller verified actual use-provider members and empty-pool fallback, cross-checked against official v1.19.31 source. See [follow-up research](../../docs/research/2026-09-30-routing-runtime-followup.md). Names of all 55 groups, rules and DNS were unchanged.

## v6.0.14-cmfa.6 (2026-09-29)

- FIX: synchronized first-segment DIRECT assets, routing two exact WeChat HTTPDNS domains directly before BlockHttpDNS.
- SYNC: followed Clash Party v6.0.14, retaining 132 fused providers / 151 main rules.

## v6.0.13-cmfa.5 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE: synchronized segment 013 so `linuxdo.org` and subdomains targeted `🏠 国内网站`; `linux.do` retained restricted-site routing.
- SYNC: retained 132 fused providers / 151 rules, upgrading only release-cache keys and the target asset's single-domain addition.

## v6.0.12-cmfa.4 (2026-09-01)

- FIX#181-PC: synchronized exact direct assets so `login.nvidia.cn` preceded NVIDIA download rules; other NVIDIA download/developer domains were unchanged.
- SYNC: retained 132 fused providers / 151 rules, upgrading cache keys and replaying the authorized diff only.

## v6.0.11-cmfa.3 (2026-08-22)

- ROUTING: synchronized Gemini / Accademia Gemini fused references to `🔍 Google 服务` without moving or rewriting `szkane-ai`.
- SYNC: upgraded rule-cache paths to `v6.0.11`, with 132 fused providers / 151 rules.

## v6.0.10-cmfa.3 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: synchronized first-segment assets; two reported NetEase game hosts matched `DIRECT` before anti-AD and broad China-game rules.

## v6.0.9-cmfa.2 (2026-08-08)

- FIX-APAC-HOME-REGEX: removed an extra closing parenthesis from `🏡 亚太家宽` filter that prevented Mihomo regex compilation, restoring selection of CN / Hong Kong / Taiwan / Japan / Korea / Singapore / Malaysia and other APAC residential nodes.
- GUARD: contracts compiled every CMFA group filter and rejected Go RE2-unsupported lookaround/backreferences instead of testing only fixed regional samples.

## v6.0.9-cmfa.1 (2026-07-19)

- Synchronized generic `api.github.com` tools routing before broad AI rules, preserving desktop-process exceptions in Mihomo ordering.

## v6.0.8-cmfa.1 (2026-07-15)

- Fully synchronized China-authority priority and added versioned URLs/local cache paths to every fused provider.

## v6.0.7-cmfa.1 (2026-07-14)

- FIX#176: placed authoritative China-domain segments before generic international CDN / GeoIP fallback; China sites on international CDN IPs still matched `🏠 国内网站`.

## v6.0.6-cmfa.1 (2026-07-14)

- DIRECT-WORKPRO-WEB: fused direct residuals from `scki-local-process-direct` included `WorkPro.exe` and `WorkProWebProcess.exe`, routing supporting desktop Mihomo clients to `DIRECT`.

## v6.0.5-cmfa.1 (2026-07-14)

- DIRECT-WORKPRO: kept WorkPro.exe in default direct residuals; regressions required DIRECT on desktop Mihomo consumers.

## v6.0.4-cmfa.1 (2026-07-13)

- DIRECT-ITWDB: compiled `itwdb.com` from `scki-local-direct` into `+.itwdb.com` domain-MRS payload, covering WorkPro subdomains through default DIRECT.
- SYNC: regenerated fused providers/order from source graph v6.0.4 with `unresolved=0`.

## v6.0.3-cmfa.1 (2026-07-12)

- FIX#FUSED-DOMAIN-PAYLOAD: domain providers retained only native exact/wildcard payloads; keyword/regex remained classical residuals, preventing silent misses or semantic expansion.
- AI-PRECEDENCE: OpenAI/ChatGPT and required telemetry/Cloudflare-associated domains matched `🤖 AI 服务` before ads/international sites.
- SYNC: source graph v6.0.3 generated 124 fused providers / 141 rules with `unresolved=0`.

## v6.0.2-cmfa.1 (2026-07-10)

- SYNC: followed source graph / Clash Party v6.0.2 with 113 fused providers, 130 rules and 55 groups.
- PERF: normalized and semantically deduplicated domain/IP MRS within same-policy segments. Country/service GEOIP remained small residual YAML instead of expanding runtime database queries into CIDR lists.
- FAIL-CLOSED: refused generation when the fused manifest had unresolved sources, invalid residuals or exceeded aggregate budgets.

## v6.0.1-cmfa.1 (2026-07-10)

- SYNC: followed Clash Party/source graph v6.0.1, retaining fused MRS/residual YAML, 113 providers and 130 rules.
- DELIVERY: this client did not consume large text sets, so semantics remained unchanged; the same pipeline supplied text-splitting fixes to Shadowrocket / Surge / Loon / Quantumult X.

## v6.0.0-cmfa.1 (2026-07-09)

- FUSED-RULESETS: followed v6.0.0 architecture, referencing fused MRS / residual YAML directly.
- SCALE: reduced `474 providers / 931 rules` to `113` fused providers and `130` rules.
- BASELINE: CMFA remained derived, not authoritative. This historical release recorded Clash Party Smart runtime output as its fixed authority input.

## v5.4.39-cmfa.1 (2026-07-09)

- MRS-PARTIAL: reviewed/migrated remaining convertible YamlRule/TextRule inputs; CMFA had 474 providers and 929 rules.
- MIHOMO-MRS: 424 providers used MRS; 30 used `rulesets/generated/mihomo-mrs/*-classical.yaml` residuals; 20 wholly unconvertible providers retained their formats.
- SCKI-SUPPLEMENTAL: domain/ipcidr supplemental sets switched to repository-generated MRS. `scki-local-process-direct` / `scki-work-process` retained Clash classical text.
- VERIFY: added partial/residual counts and `scki-*` MRS-reference checks.

## v5.4.38-cmfa.1 (2026-07-09)

- SCKI-SUPPLEMENTAL: synchronized 15 `scki-*` providers from v5.4.38.
- MIHOMO-MRS: migrated upstream sources to 429 providers / 884 rules, including 366 MRS providers and 38 mixed classical providers split into domain/ipcidr MRS pairs.
- VERIFY: contracts checked supplemental references rather than requiring scattered inline exceptions.

## v5.4.37-cmfa.1 (2026-06-29)

- ★ DNS-POLICY#170: added `geosite:cn` → AliDNS/DNSPod DoH and `geosite:geolocation-!cn` → Cloudflare/Google DoH in `dns.nameserver-policy`.
- Aligned DNS with v5.4.37, retaining `direct-nameserver-follow-policy: true`; descriptions covered CDN + geosite policies.

## v5.4.36-cmfa.1 (2026-06-29)

- CLEAN#171-DIRECT: removed 22 individually verified redundant inline rules, retaining 376 providers and v5.4.36 semantics.
- AI / Binance / Microsoft-login candidates remained because earlier different-policy MRS prevented safe deletion.

## v5.4.35-cmfa.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM: removed eight redundant providers and RULE-SET lines: `marketing`, `acc-vf-paypal`, `encoretvb`, `findmy`, `wildrift`, `acfun`, `acc-fl-douyin`, `acc-fl-xiaohongshu`.
- CLEAN#170-DIRECT: removed three later inline rules already covered by the earlier same-target Douyin China-streaming guard: `douyin.com`, `douyinpic.com`, `douyinvod.com`.
- Measured provider / RULE-SET count: 384 → 376. Remaining download proxies stayed `🚫 受限网站`.
- Retained `privacy` because earlier rules did not cover `IP-CIDR,0.0.0.1/32`.

## v5.4.34-cmfa.1 (2026-06-28)

- ★ FIX#169-AMAP: added MetaCubeX `amap.mrs`, retaining download proxy `🚫 受限网站`.
- Placed `RULE-SET,amap,🏠 国内网站` after ads/threats but before proxy/geolocation-!cn fallback, preventing first-match international misrouting of `webapi.amap.com`.

## v5.4.33-cmfa.1 (2026-06-27)

- ★ FEAT#169-AI-CODING: added `vpsdance-ai-coding` from VPSDance `rules/clash/coding.yaml`.
- Preserved China-game priority; AI coding tools remained in `🤖 AI 服务`.

## v5.4.32-cmfa.1 (2026-06-25)

- ★ FIX#168-CN-GAME: moved `🕹️ 国内游戏` before `🎮 国外游戏`; returned early scattered `GEOSITE,category-games` to international games to avoid premature China-game matches.
- Contracts checked `yuanshen.com` / `mihoyo.com` before broad HoYoverse/Game/category-games rules.

## v5.4.31-cmfa.1 (2026-06-20)

- ★ FIX#167-DOUYIN: added a Douyin Web China-streaming guard before ads/TikTok/international tail rules, covering `douyin.com`, `zjcdn.com` and related video CDN domains.
- Header/README aligned with v5.4.31; added cross-client contracts.

## v5.4.30-cmfa.1 (2026-06-17)

- ★ FEAT#166-GOOGLE: added `🔍 Google 服务` before `🔧 工具与服务`.
- Moved scholar/google/google-ip and Google QUIC to the new group; tools retained only non-Google search/developer services.

## v5.4.29-cmfa.1 (2026-06-10)

- ★ PERF#165-LATENCY: all 22 regional url-test groups used `interval: 300` instead of 180.
- Confirmed `proxy-providers.Subscribe.health-check.interval` remained 300 to align provider/group test cadence.
- Header/README aligned with v5.4.29.

## v5.4.28-cmfa.1 (2026-06-07)

- ★ CLEAN#165 P2: removed 38 inline DOMAIN-SUFFIX rules already covered by same-policy sets across six streaming/game segments.
  - Segments: Hong Kong streaming (-4), Taiwan (-5), Japan/Korea (-6), Europe (-3), other international streaming (-6), international games (-12); two remaining entries documented earlier v5.4.27 cleanup.
  - Added `# CLEAN#165:` comments listing removed domains and covering RULE-SETs above each segment.

## v5.4.27-cmfa.1 (2026-06-07)

- ★ CLEAN#165: removed seven inline domains already covered by claude/paypal/hbo/hulu/xbox providers, preserving matching policy.

## v5.4.26-cmfa.1 (2026-06-07)

- ★ FIX#164: prevented szkane `AiDomain.list` substring `DOMAIN-KEYWORD,copilot` sending Tencent WorkBuddy `copilot.tencent.com` to `🤖 AI 服务` and causing conversation errors. Inserted `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站` before `RULE-SET,openai` and all AI sets. Baseline: v5.4.26.

## v5.4.25-cmfa.3 (2026-06-05)

- ★ SYNC#FAKE-IP-FILTER: added `+.courier.push.apple.com`, `+.miui.com`, `+.xiaomi.com`, `+.xiaomi.net`, `+.mijia.tech`, `+.gotui.com`, matching all 57 entries in Smart/Normal/FlClash.
- ★ VERIFY: added required fake-ip-filter checks in `tools/validate-artifact-contracts.js` to prevent Mihomo-family drift.

## v5.4.25-cmfa.2 (2026-06-04)

- ★ FIX#CMFA-YAML-P0: fixed missing list indentation on the first url-test group under proxy-groups, which caused YAML parse failure.
- ★ Validation: `tools/validate-artifact-contracts.js --strict-ruby` actually parsed CMFA YAML and checked 54 groups / 382+ providers / 900+ rules.

## v5.4.25-cmfa.1 (2026-06-03)

- ★ Review fix: deduplicated two trailing `GEOIP,CN` rules to one.

## v5.4.23-cmfa.1 (2026-06-02)

- ★ FIX#161: `DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` targeted `🏠 国内网站` direct routing for Zhihu image CDN/short links, matching the baseline.

## v5.4.22-cmfa.1 (2026-05-31)

- ★ Added GeTui push SDK `getui.com` / `getui.net` / `gepush.com` to direct exceptions after review. Continuing #2, generic ad/privacy feeds treated them as trackers despite carrying application push such as Mi Home; the owner chose to allow them.

#1 Proxy-override adaptation: refined QUIC through AND-rule exceptions for YouTube/Google/MS/Apple service groups; rejected other non-CN QUIC. Added previously missing CMFA QUIC AND rules.

- Changed fallback from `GEOIP,CN` to `GEOSITE,cn`, an intentional semantic change recorded as more reliable with fake-ip. Existing force-dns-mapping sniffing supported real-IP QUIC GEOSITE matches.

## v5.4.21-cmfa.1 (2026-05-31)

#4 Proxy-override adaptation: replaced plaintext-IP-only `default-nameserver` with DoH-over-IP plus one plaintext fallback. The historical release described this as eliminating bootstrap DNS leakage; the retained plaintext fallback means it is not a general zero-leak guarantee.

## v5.4.20-cmfa.1 (2026-05-30)

Proxy-override batch B, #6 node-filter keywords; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`:

- Added exclude-filter keywords `免费` / `试用` / `应急`, and `\bSign\b` / `\bLogin\b` / `\bRegister\b` / `\bHelp\b` / `\bFAQ\b`. Go RE2 substring matching used word boundaries to protect names such as Signal.
- Excluded `更新` / `地址` due to false-positive risk, as specified by the owner.
- `tools/test-info-node-filter.js` covered this artifact's exclude-filter.
- 🔢 Version: v5.4.19-cmfa.1 → v5.4.20-cmfa.1.

## v5.4.19-cmfa.1 (2026-05-30)

Proxy-override batch A, following Clash Party v5.4.19; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`:

- ✅ #2 Added leading China SDK/CDN direct rules.
  - Forced jpush / `msg.umeng.com` DIRECT before jiguangtuisong / youmengchuangxiang ad sets, reusing Paddle/Xiaomi false-positive guards.
  - Placed `baomitu.com`, `bootcss.com`, `staticfile.org`, `upaiyun.com` before `RULE-SET,cn` in the China-site segment.
- ✅ #3 Added ten fake-ip-filter entries: remote access todesk/oray/sunlogin/teamviewer/anydesk; games battlenet.com.cn/wotgame.cn/wggames.cn/wowsgame.cn; Bilibili P2P mcdn.bilivideo.cn.
- ✅ #5 Added `direct-nameserver-follow-policy: true` so direct-outbound domain resolution followed nameserver-policy. That release recorded the policy as containing only international CDNs, with no China-domain false positives.
- 🔢 Version: v5.4.17-cmfa.1 → v5.4.19-cmfa.1; all artifacts skipped invalid .18 and converged on v5.4.19.
## v5.4.17-cmfa.2 (2026-05-30)

- ★ FIX#HOSTS-ALIGN: changed use-hosts false → true to enable baseline hosts pre-resolution.
  - Main Smart JS defaulted use-hosts to true and pinned DoH-host IPs, intended to break fake-ip cold-start loops and resist DoH hostname poisoning.
  - CMFA previously disabled its aligned hosts block for dns.alidns.com / doh.pub / dns.google / cloudflare-dns.com; true activated it.
  - §1 DNS synchronization also updated OpenClash Normal/Full and completed their missing alidns/doh.pub hosts.

## v5.4.17-cmfa.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP: synchronized v5.4.17 DNS contract.
  - default-nameserver retained only `223.5.5.5 / 119.29.29.29 / 1.1.1.1 / 8.8.8.8`.
  - That release used China DoH for nameserver/direct-nameserver and international DoH for proxy-server-nameserver/fallback.
  - Disabled prefer-h3, enabled respect-rules and completed nameserver-policy/fallback-filter.geosite.

## v5.4.16-cmfa.2 (2026-05-22)

- ✅ FEAT#GAME-ACCEL: added game-accelerator `PROCESS-NAME -> DIRECT` exceptions.
  - Added 16 PROCESS-NAME rules for UU / Xiaohei / Xunyou / Leishen / NNer accelerators.
  - Synchronized v5.4.16 baseline.

## v5.4.16-cmfa.1 (2026-05-20)

- ✅ FIX#149-P0: placed `DOMAIN-SUFFIX,paddle.com,🏦 金融支付` at the start of rules.
  - anti-AD/DustinWin then included `analytics.paddle.com`, requiring the exception before `RULE-SET,anti-ad`.
  - Repaired ad rejection of Paddle licensing/payment paths during Antigravity login/account settings.

## v5.4.15-cmfa.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER: synchronized v5.4.15 metadata and added GEOSITE coverage references.
- ♻️ REFACTOR#AD-FP-MODULE: labelled the leading ad false-positive allowlist explicitly; ordering remained equivalent to v5.4.14.

## v5.4.14-cmfa.1 (2026-05-20)

- ✅ FIX#CF-R2-P0: placed `DOMAIN-SUFFIX,cloudflarestorage.com,🌐 国外网站` early.
  - Corrected Sukka reject_phishing false positives for Cloudflare R2.
  - Removed the later CDN/international duplicate, ensuring first-match international routing.

## v5.4.13-cmfa.1 (2026-05-19)

- ✅ FIX#STUN-REALIP: STUN/TURN domains stopped receiving fake-ip; standard detection ports went direct.
  - Restored blacklist mode and removed nonexistent `RULE-SET,Google` / `RULE-SET,AI` references.
  - Added stun1-4.l.google.com, STUN/TURN wildcards and DST-PORT 5349 / 19302 / 19305 / 19307.

## v5.4.12-cmfa.1 (2026-05-12)

- ✅ FIX#RD-REALIP: added `DOMAIN-SUFFIX,rustdesk.com,real-ip` to historical fake-ip-filter rule mode.
  - RustDesk domains retained collaboration proxy routing but received real DNS IPs instead of 198.18.x for rendezvous/relay.

## v5.4.11-cmfa.1 (2026-05-12)

- ✅ FIX#RD-PROC: moved RustDesk processes from DIRECT to `🧑‍💼 会议协作`, retaining the leading rustdesk.com guard.
- ✅ FIX#DNS-BOOTSTRAP: nameserver/direct-nameserver/proxy-server-nameserver became IP-first to avoid DoH bootstrap deadlock.

## v5.4.9-cmfa.1 (2026-05-11)

- ✅ FEAT#LOCAL-TOOLS: synchronized v5.4.9 desktop local-tool PROCESS-NAME → DIRECT exceptions.
  - Targeted ClashMi Windows/macOS/Linux and other desktop Mihomo consumers. Android accepted import but did not rely primarily on desktop process names.
  - Used exact names only, not broad PROCESS-NAME-REGEX.

## v5.4.8-cmfa.2 (2026-05-11)

- ★ META#BASELINE: aligned header baseline to v5.4.8.
  - No change to proxy-groups/rule-providers/rules semantics.

## v5.4.8-cmfa.1 (2026-05-09)

- ★ ORDER#RULE-TAIL: synchronized v5.4.8 tail-rule order.

## v5.4.7-cmfa.1 (2026-05-09)

- ★ FEAT#TikTok: added independent `🎵 TikTok` group (32 service groups), between `📺 国内流媒体` and `🎥 Netflix`.
  - Added `🎵 TikTok` select group referencing `*id002`; split its rules from social media and moved them earlier.
- ★ FIX#HK: appended `|港` to Hong Kong node/residential filters for Guangzhou/Shenzhen-to-Hong-Kong IEPL/IPLC labels.

## v5.4.6-cmfa.1 (2026-05-08)

- ★ FEAT#145: WeChat CDN direct routing.
  - Added `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT` after iwipwedabay.com and before binance.
  - Followed v5.4.6 baseline.

## v5.4.5-cmfa.1 (2026-05-07)

- ★ Moved global nodes first and synchronized group ordering across products, following v5.4.5.

## v5.4.4-cmfa.1 (2026-05-07)

- ★ FIX#144: bbys.app DIRECT rule.
  - Added `DOMAIN-SUFFIX,bbys.app,DIRECT` after acc-chinamax and before GFW for direct video access.
- ★ FEAT#143: added IEPL/IPLC/dedicated-line residential detection.
  - Appended `iplc|iepl|专线` to all residential-region filters.
- ★ FIX#142 DNS cold-start repair was JS-specific; static configuration was exempt with no shared runtime change.
- Bump: `v5.4.3-cmfa.1` → `v5.4.4-cmfa.1`

## v5.4.3-cmfa.1 (2026-05-06)

- ★ FEAT: added `|home` to residential filters, following v5.4.3.
  - Appended it after `resi(dential)?|...|broadband|isp` in all 11 residential filters to match Home-only indicators.

## v5.4.2-cmfa.1 (2026-05-05)

- ★ FIX#41-P0: Xiaomi core-service DIRECT exceptions, following v5.4.2.
  - Added 11 DIRECT rules before ad blocking, correcting miuiprivacy/advertisingmitv rejection of authentication/security domains.

## v5.4.0-cmfa.1 (2026-05-05)

- ★ FEAT#SG: added independent `🇸🇬 狮城节点` / `🏡 狮城家宽` url-test groups.
  - Removed Singapore from APAC filtering and created its separate group.
  - Added Singapore to proxy candidates for all 31 service groups.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Followed Clash Party v5.4.0.

## v5.3.0-cmfa.1 (2026-04-26)

- ★ REFACTOR#2: changed streaming grouping from region-based to platform-based (7 → 13 groups).
  - Added independent Netflix / Disney+ / HBO/Max / Hulu / Prime Video groups.
  - Split global YouTube / music-streaming groups.
  - Retained Hong Kong / Taiwan / Japan-Korea / Europe regional streaming groups.
  - Added other-international-streaming fallback for long-tail platforms and former Southeast Asia streaming.
  - Service groups: 25 → 31; total groups: 43 → 49.

<a id="v5211-cmfa1-2026-04-26--业务组合并精简-2825降低用户认知负担"></a>

## v5.2.11-cmfa.1 (2026-04-26) — Service groups consolidated 28 → 25

- ★ REFACTOR#1: followed v5.2.11 to consolidate service groups and reduce selection complexity.
  - Merged search engines and developer services into tools/services.
  - Merged mail services into international sites.
  - Merged cloud/CDN into international sites.
  - Changed downloads/updates from DIRECT-first to proxy-first.
  - Retained independent BT/PT Tracker.
- Bump: `v5.2.10-cmfa.1` → `v5.2.11-cmfa.1`

<a id="v5210-cmfa1-2026-04-25--境外-doh-端点改路由到--受限网站"></a>

## v5.2.10-cmfa.1 (2026-04-25) — International DoH endpoints routed to restricted sites

- ★ FIX#39: synchronized shared behavior with v5.2.10.
  - `DOMAIN,dns.google,☁️ 云与CDN` → `🚫 受限网站`.
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `🚫 受限网站`.
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `🚫 受限网站`.
  - That release recorded dns.google/cloudflare-dns.com as blocked from China, classifying them as restricted sites rather than CDN.
    This kept DoH proxied even if the cloud/CDN group was manually changed to direct.
  - China DoH endpoints doh.pub/dns.alidns.com retained nameserver/direct-nameserver settings.
- Bump: `v5.2.8-cmfa.6` → `v5.2.10-cmfa.1`, aligning the major version.

<a id="v528-cmfa6-2026-04-25--补齐-18-区域-filter-中缺失的裸-iso-alpha-2-代码"></a>

## v5.2.8-cmfa.6 (2026-04-25) — Completed bare ISO alpha-2 codes in 18 regional filters

- ★ FIX#29-P2: filters lacked bare `HK`/`TW`/`JP`/`KR`/`SG`/`US`/`CA`/`EU`/`AF` codes.
  - Names such as HK-01 / JP-01 / US-01, without flags or alpha-3 codes,
    could not be classified and fell into the global group.
    Other artifacts used JS word boundaries, OpenClash Ruby substrings or explicit SR/Surge/Loon/QX alternatives
    and classified these names correctly.
  - Go RE2 substring filters made bare US also match MUSIC/FOCUS/JUST;
    earlier versions had therefore deliberately omitted bare codes.
  - Added `(^|[^a-zA-Z])CODE([^a-zA-Z]|$)` to 18 filters (9 all-node + 9 residential).
    This uses standard capture groups, anchors and character classes supported by Go RE2, avoiding unsupported lookahead. The historical note also mentioned avoiding reliance on `\b`.
    - `(^|[^a-zA-Z])` matches start or a nonletter.
    - CODE is the two-letter ISO code.
    - `([^a-zA-Z]|$)` matches a nonletter or end.
    - Results: HK-01 ✅ / NODE_US ✅ / JP01 ✅ / MUSIC ❌ / FOCUS ❌ / TWD ❌.
  - Regions: Hong Kong / Taiwan / Japan-Korea / APAC / US / Europe / Americas / Africa.
    Nine all-node plus nine residential filters were updated, including both sides of two compound home filters.
  - Other artifacts required no update: OpenClash already had bare substrings; JS had word boundaries;
    SR/Surge/Loon/QX listed alternatives; SingBox/v2rayN had no runtime classification (N/A).
  - Version: v5.2.8-cmfa.5 → v5.2.8-cmfa.6.

<a id="v528-cmfa5-2026-04-24--dnspod-doh-端点切换为纯-ip-形式"></a>

## v5.2.8-cmfa.5 (2026-04-24) — DNSPod DoH switched to an IP endpoint

- ★ In nameserver / proxy-server-nameserver / direct-nameserver,
  replaced `https://doh.pub/dns-query` with `https://1.12.12.12/dns-query`.
  - DNSPod offered both hostname and IP endpoints.
  - IP-form DoH avoided bootstrap resolution of doh.pub, removing that potential
    cold-start self-dependency; default-nameserver then needed only dns.alidns.com and
    dns.cloudflare.com, not doh.pub, according to the recorded configuration.
- Version: v5.2.8-cmfa.4 → v5.2.8-cmfa.5.

## v5.2.8-cmfa.4 (2026-04-24)

- ★ Removed two offline providers, matching Clash Party v5.2.1.
  - ckrvxr-antifraud (`Ckrvxr/MihomoRules/.../AntiAntiFraud.yaml`): persistent source 404; JS had removed it in v5.2.1 with a REMOVED comment.
  - ckrvxr-antipcdn (`Ckrvxr/MihomoRules/.../AntiPCDN.yaml`): same reason.
  - Removed corresponding `RULE-SET,ckrvxr-antifraud,🛑 广告拦截` / `RULE-SET,ckrvxr-antipcdn,🛑 广告拦截`.
  - Providers: 386 → 384, matching OpenClash.
- ★ Corrected three targets to match JS baseline:
  - deepseek.com: AI → China sites (`BIZ.CN_SITE`).
  - inflection.ai: AI → restricted sites (`BIZ.GFW`).
  - pi.ai: AI → restricted sites (`BIZ.GFW`).
- Version: v5.2.8-cmfa.3 → v5.2.8-cmfa.4.

## v5.2.8-cmfa.3 (2026-04-23)

- ★ FIX#28-P0: completed shared regional-classification repair by adding HK/TW/JP/KR substrings to APAC.
  - Hong Kong/Taiwan/Japan/Korea subscription nodes were absent from the APAC group.
  - At L486, the filter matched only `新加坡|Singapore|SGP|马来西亚|...|🇸🇬|🇲🇾|...`, omitting HK/TW/JP/KR. Go RE2 therefore missed them, unlike JS `apacNodes = c.HK.concat(c.TW, c.CN, c.JP, c.KR, c.SG, c.APAC_OTHER)`.
  - Fix:
    - Prepended L486 APAC filter with `香港|HongKong|Hong\s*Kong|HKG|🇭🇰|台湾|台灣|Taiwan|Taipei|TPE|TWN|🇹🇼|日本|东京|大阪|Japan|Tokyo|Osaka|NRT|KIX|JPN|🇯🇵|韩国|首尔|Korea|Seoul|ICN|KOR|🇰🇷`, matching regional keywords while avoiding bare HK/TW/JP/KR collisions with HKD/TWD.
    - Expanded both sides of the L495 APAC residential composite filter (the original record called them lookahead/lookbehind).
  - Americas L540 already included `美国|United\s*States|USA|LAX|...|🇺🇸`; Europe/Africa already covered their countries.
  - Historical CLAUDE.md §1.5 audit: OpenClash Normal/Full had the same bug and were fixed in the PR (OpenClash CHANGELOG v5.2.8-oc-normal.3 / v5.2.8-oc-full.3). Party Smart/Normal, Shadowrocket, Surge, Loon and QX already covered them. SingBox/v2rayN had no runtime classification.
  - Followed Clash Party v5.2.8; CMFA bumped to v5.2.8-cmfa.3.

## v5.2.7-cmfa.1 (2026-04-23)

- ★ FIX#27-P1: removed parse warnings from three classical providers, matching v5.2.7.
  - Users reported repeated startup/reload logs:
    - `parse classical rule [USER-AGENT,TikTok*] error: unsupported rule type: USER-AGENT`
    - `parse classical rule [USER-AGENT,BBCiPlayer*] error: unsupported rule type: USER-AGENT`
    - `parse classical rule [IP-CIDR , 17.253.4.125] error: payloadRule error`
  - Upstream szkane CiciAi.list / UK.list each contained one USER-AGENT line unsupported by Mihomo classical (legacy Surge/iOS syntax). Accademia Grok.yaml contained `IP-CIDR         , 17.253.4.125` with extra spaces and no mask.
  - Switched szkane-ciciai / szkane-uk / acc-grok to cleaned repository mirrors, removing only invalid lines with remaining bytes unchanged. geosite:tiktok / geosite:bbc already fully covered TikTok/BBC domains. 17.253.4.125 was Apple time.apple.com anycast, unrelated to Grok.
  - Followed v5.2.7; CMFA bumped to v5.2.7-cmfa.1.

<a id="docs-2026-04-23--追加-clashmi-兼容说明纯文档yaml-未改动"></a>

## docs (2026-04-23) — ClashMi compatibility documentation; YAML unchanged

- ★ Added [ClashMi](https://github.com/KaringX/clashmi), the KaringX Flutter GUI for iOS/macOS/Android/Windows/Linux, to README section 1's client list.
- ★ Added README section 9: import methods, shared CMFA behavior (then recorded as 37 groups / 387 RULE-SETs / fake-ip / url-test), and six ClashMi differences.
- ★ Root README:
  - Added ClashMi to the covered-client list.
  - Extended the CMFA abbreviation in the protocol matrix to include ClashMi and link section 9.
- ★ Historical CLAUDE.md §0 added a ClashMi note, parallel to Hiddify, explaining reuse by a cross-platform Mihomo GUI.
- Compatibility evidence was drawn from the official [FAQ](https://clashmi.app/guide/faq):
  - Bundled MetaCubeX mainline, not vernesong Smart, shared CMFA's core lineage.
  - Forced GEOIP/GEOSITE conversion to rule sets did not trigger: that YAML had 0 GEOIP / 0 GEOSITE / 387 RULE-SETs.
  - The historical entry claimed MRS plus lazy loading avoided the iOS extension's 50 MB OOM limit. This was a recorded claim, not device-memory proof or a current guarantee.
  - iOS lacked IP-ASN; YAML used no ASN rules.
  - Application-managed TUN matched the YAML's absence of a tun section.
- Version policy: README/CHANGELOG/root README/historical CLAUDE.md changed, but CMFA YAML did not, so no YAML version bump.

## v5.2.6 (2026-04-22)

- ★ FIX#24-P0: added ISO alpha-3 country codes to filter regexes.
  - Provider names TWN 01 / JPN 01 / KOR 01 / SGP 01 were matched by Mihomo substring regex.
    Original Taiwan alternatives were only `Taiwan|Taipei|TPE|🇹🇼`; Japan/Korea had `Japan|Korea|Tokyo|Osaka|Seoul|NRT|KIX|ICN|🇯🇵|🇰🇷`;
    APAC lacked SG/Singapore/🇸🇬, so alpha-3 nodes were missing from these regional groups.
  - Fix:
    - Added TWN to L521 Taiwan filter.
    - Added `新加坡|Singapore|SGP|🇸🇬` to L548 APAC filter.
    - Added JPN/KOR to L557 Japan/Korea filter.
  - Synchronized v5.2.6 FIX#24 alongside JS REGION_DB and OpenClash Ruby REGIONS.

## v5.2.5 (2026-04-20)

- ★ Synchronized v5.2.5 FIX#23-P1: removed acc-geositecn / acc-china providers as pure duplicates of geosite:cn.
- Header version: v5.2.2 → v5.2.5.

## v5.2.2 (2026-04-20)

Aligned with Clash Party FIX#17-P0:

- ★ Unified 389 provider entries to `proxy: '🚫 受限网站'`, formerly `'☁️ 云与CDN'`.
- ★ Header version: v5.2.0 → v5.2.2.

<a id="v520-初版"></a>

## v5.2.0 (initial release)

- Nine url-test regions, 28 service groups and 375+ providers.
- The release replaced advanced GEOSITE/GEOIP labels with equivalent RULE-SETs, recording that no .dat download wait was needed.
- Regional groups used url-test. The historical entry described Smart/LightGBM as absent from static YAML and injected only at desktop Clash Party JS runtime; this records that artifact's design, not a universal core-format restriction.
