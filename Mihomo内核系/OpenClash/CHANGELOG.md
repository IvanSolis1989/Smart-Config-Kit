<!-- Full English translation of the historical record. -->

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="OpenClash changelog" width="100%">
</picture>

<a id="openclash--变更日志"></a>

# OpenClash — Changelog

> Covers `Mihomo内核系/OpenClash/OpenClash(mihomo).sh` (Normal) and
> `Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh` (Full).
>
> The two scripts increment their versions independently; major versions follow the Clash Party mainline.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Back to README](../../README.md) · [Documentation center](../../docs/README.md)

## v6.0.21-oc-normal.18 / v6.0.21-oc-smart.19 (2026-10-29)

- Both shell/Ruby variants synchronize explicit hosts-only profiles and local environment options; only exact active-node IP hosts are projected, preserving node domains, repository hosts, and existing DNS/rules.
- The default remains adaptive; optional business projections update both heredocs and Ruby QUIC catalogs to avoid runtime references to disabled groups. See the [configuration guide](../../docs/configuration.md).

## v6.0.21-oc-normal.17 / v6.0.21-oc-smart.18 (2026-10-28)

- Moved Google FCM from downloads to Google services. The 15 domains, 26 IPv4 predicates, rule order and 55 groups were unchanged, as were other push services, DNS and fake-IP.

## v6.0.20-oc-normal.16 / v6.0.20-oc-smart.17 (2026-10-24)

- Organized client directories by core family, retaining files/guides within client subdirectories. Rule semantics/fields were unchanged. Raw configuration URLs changed with paths, requiring reimport; shared `rulesets/` URLs remained unchanged.

## v6.0.20-oc-normal.15 / v6.0.20-oc-smart.16 (2026-10-20)

- Normal/Smart DNS policies are now projected from shared business DNS source data; group structure, node routing, and rule payloads are unchanged.

## v6.0.20-oc-smart.15 (2026-10-19)

- The Smart shell removes `strategy: sticky-sessions`, which current vernesong/mihomo `SmartOption` no longer contains; headers, `VERSION_TAG`, and embedded Ruby versions are synchronized.
- Synchronizes the Clash Party Smart fix, retaining Smart/LightGBM, 55 groups, and existing rules/DNS; Normal uses `url-test`, never used this Smart field, and needs no matching change. Documentation distinguishes MetaCubeX Alpha from the Smart branch.
- Deployment instructions use the fixed custom-script entry point still executed by upstream and retain backup steps; complete Shell scripts are no longer incorrectly registered as ordinary override modules requiring INI section headers.
- See the [version review report](../../docs/upstream/2026-10-19/mihomo/report.md) for upstream release records, override-entry source, and verification.

## v6.0.20-oc-normal.14 / v6.0.20-oc-smart.14 (2026-10-16)

- Issue #187: added exact DIRECT exceptions in existing `scki-adfp-direct` for `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, `hkshort.weixin.qq.com`, preventing WeChat connection endpoints from matching ads first.
- No parent/subdomain expansion; `ad.weixin.qq.com` and `log.weixin.qq.com` remained rejected. Other policies and ordering were unchanged.
- Synchronizes version metadata across Normal/Smart and override-module reference snapshots; no platform fields are added.
- See [WeChat review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence and bounded static acceptance. Reporter-device recovery still required retesting.

## v6.0.19-oc-normal.13 / v6.0.19-oc-smart.13 (2026-10-15)

- FIX#186: unified repository-owned remote assets on GitHub raw HTTPS to avoid jsDelivr repository-size limits, preserving version queries and native formats.
- Reused verified fused payloads; content, ordering and policies were unchanged. Added raw/CDN-reference regressions. See [delivery guidance](../../docs/rule-asset-delivery.md) for cause, download prerequisites and official fields.

## v6.0.18-oc-normal.12 / v6.0.18-oc-smart.12 (2026-10-14)

- Fixed cross-service first-match misclassification: narrowed broad Apple/Microsoft keywords and shared AWS/Azure/CDN suffixes, adding eight guard classes: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social, bytedance-app. Six ADFP records for exact CA revocation/status hosts via DIRECT and exact Microsoft international-mail policy brought the total to 35. `api.byteoversea.com` was an exact TikTok rule, not a shared-suffix expansion. Existing Claude Desktop `a-api`/`a-cdn` exceptions, QUIC/latency options and default-off ZeroTier proxy remained. Crisp relay was a static ASN-overlap risk inference, not a measured incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 nonempty SRS across 81 segments.
- This entry covers the Normal/Smart shell override scripts; unchanged `.conf` templates are not part of this release.

## v6.0.17-oc-normal.12 / v6.0.17-oc-smart.12 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to `scki-adfp-ai` for Claude Desktop application-code/user-content loading through AI policy. Based on [official requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Existing rule sets/native syntax remained. Source-semantic gates, 29 ADFP checks, Claude stage inventory and file-level release-batch checks joined the publication chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device reproduction or measurement occurred.

## v6.0.16-oc-normal.12 / v6.0.16-oc-smart.12 (2026-10-12)

- Following v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional ADFP validation. Conversion format, order and target policies remained; no runtime rules were added. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording only observable bytes and conversion receipts. Original remote-input SHA values cannot be reconstructed from old outputs; no claim of complete historical provenance or real-device traffic measurement was made.

## v6.0.15-oc-normal.12 / v6.0.15-oc-smart.12 (2026-10-07)

- Normal/Smart default to 300-second testing with `lazy: true`; the 900-second tier remains optional. Default QUIC policy is unchanged.

## v6.0.15-oc-normal.11 / v6.0.15-oc-smart.11 (2026-10-07)

- Normal/Smart scripts support managed defaults and runtime environment variables, linking test intervals to overseas UDP/443 rules.
- See [latency and QUIC options](../../docs/traffic-options.md) for switching commands, capabilities and verification.

## v6.0.14-oc-normal.10 / v6.0.14-oc-smart.10 (2026-09-30)

- INLINE: Both Ruby processors flatten only inline providers containing just type/payload; explicit and payload nodes share validation, and payloads are deep-copied. Failures leave the source file untouched; successful flattening removes the provider.
- CANDIDATES: Named direct/reject outbounds remain available for chained dialing; only remote proxies enter global/regional/residential pools and node-domain collection. Mixed-input global groups explicitly list remote nodes to stop include-all-proxies from reintroducing support outbounds. Support-only input makes the global group REJECT.
- GUARD: Reserves PASS-RULE; behavioral regressions comparing both actual heredocs with JS/Ruby passed. Rules, business selection, and global DNS baselines remain unchanged; see [follow-up research](../../docs/research/2026-09-30-routing-runtime-followup.md).

## v6.0.14-oc-normal.9 / v6.0.14-oc-smart.9 (2026-09-30)

- FIX: Aligns information filtering with all three JS clients, retaining legitimate IPLC, DNS, relay, and Telegram route labels; English announcement keywords use boundary matching.
- PREFLIGHT: Checks node fields, duplicate names, and name/chained-dependency conflicts before writing source YAML. Provider input must first be aggregated and flattened rather than deleting providers and generating a partial pool.
- FILTER: Local `SCKI_MAX_NODE_MULTIPLIER` is empty and disabled by default; only nodes clearly exceeding a positive threshold are removed, retaining unknown/ambiguous multipliers. Empty pools explicitly use `REJECT`, avoiding `COMPATIBLE` fallback.
- SCOPE: Shared Ruby runtime changes reach both variants and pass actual-heredoc execution/YAML readback acceptance; source graph and fused assets remain v6.0.14. Other static outputs lack an equivalent subscription-processing entry point; see the [research matrix](../../docs/research/2026-09-30-routing-script-research.md).
- REFERENCE: Reviews upstream OpenClash v0.47.156 override templates and Mihomo proxy-group fields; updates references, parameter tutorials, and CI checks.

## v6.0.14-oc-normal.8 / v6.0.14-oc-smart.8 (2026-09-29)

- FIX: Synchronizes the first DIRECT fused asset, adding early direct exceptions for two exact WeChat HTTPDNS domains.
- SYNC: Normal/Smart follow source graph v6.0.14; other BlockHttpDNS entries retain their blocking policy.

## v6.0.13-oc-normal.7 / v6.0.13-oc-smart.7 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE: Normal and Smart synchronize fused domain asset 013, sending `linuxdo.org` and subdomains to `🏠 国内网站`.
- GUARD: Main site `linux.do` remains handled by GFW segment 059; other fused segments retain fixed v6.0.12 payloads.

## v6.0.12-oc-normal.6 / v6.0.12-oc-smart.6 (2026-09-01)

- FIX#181-PC: Normal and Smart synchronize the first-segment exact direct asset for `login.nvidia.cn`, ahead of broad NVIDIA download rules.
- SCOPE: Only the China-account login host changes; other NVIDIA domains retain their download-group policy.

## v6.0.11-oc-normal.5 / v6.0.11-oc-smart.5 (2026-08-22)

- ROUTING: Normal and Smart synchronize the Google fused segment for Gemini / Accademia Gemini; `szkane-ai` retains its original AI routing order.
- SYNC: Upgrades to 132 fused providers / 151 rules, with release cache key `v6.0.11`.

## v6.0.10-oc-normal.5 / v6.0.10-oc-smart.5 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: Normal and Smart synchronize the first fused direct asset; two NetEase game-service hosts receive fixed direct routing before anti-AD and broad `netease.com` domestic-game rules.

## v6.0.9-oc-normal.4 / v6.0.9-oc-smart.4 (2026-08-02)

- FIX-NODE-ISO-LOWERCASE: The Ruby classifier applies bounded normalization at letter/digit transitions because Ruby word boundaries treat digits as word characters and previously missed hk01; all 12 user-provided lowercase ISO-numbered nodes reach the expected regions.
- GUARD/VERIFY: Preserves original REGIONS country regexes and case-insensitive semantics; contracts extract classifiers from both real heredocs and execute regression samples in Ruby.

## v6.0.9-oc-normal.3 / v6.0.9-oc-smart.3 (2026-07-25)

- PROFILE: The shell reads and allowlists `off / policy / adaptive` only from trusted local environment variables before passing the profile to the Ruby Adapter; it never reads profiles from subscription YAML or changes rules, groups, or the router-wide DNS baseline.
- ADAPTER-HARDENING: The Ruby Module uses a capture/apply seam; profile mismatch or missing PSS baseline causes zero writes. Later case-variant exact active-node policies are retained within bounds; resolver path/query conflicts fail closed, and bootstrap hosts required by accepted policies are retained together.
- VERIFY/DOCS: Actual-heredoc contracts cover all three profiles, exact case-sensitive keys, 13 independent resolver bootstraps, profile mismatch, and zero writes; review of OpenClash v0.47.133 (2026-07-18) found no breaking change to override entry points or UCI keys.

## v6.0.9-oc-normal.2 / v6.0.9-oc-smart.2 (2026-07-25)

- NODE-DNS: After reading subscriptions and writing the fixed DNS baseline, both Ruby overrides project private resolver policies and bootstrap hosts only for active-node FQDNs; source PSS no longer becomes the global default node DNS.
- HARDENING: Preserves Mihomo scalar-host redirects; supports IPv4 / IPv6 / IPv4-mapped IPv6, prioritizes `*.` over `+.` / `.`, and retains resolver bootstrap entries before applying the 64-host limit.
- VERIFY: Adds actual-heredoc Ruby contracts for policy scope, wildcards, private resolvers, output limits, idempotence, and log redaction.

<a id="文档维护-2026-07-16"></a>

## Documentation maintenance (2026-07-16)

- MAINT#AGENTS-SINGLE-SOURCE: Normal/Smart headers point to the sole root maintenance contract `AGENTS.md` and state source-graph precedence; comments only, without runtime, rule, or version changes.

## v6.0.9-oc-normal.1 / v6.0.9-oc-smart.1 (2026-07-19)

- Synchronizes the general-tool fused segment for `api.github.com`; routers lack desktop process identity, so no Copilot process exception is fabricated.

## v6.0.8-oc-normal.1 / v6.0.8-oc-smart.1 (2026-07-15)

- Normal/Smart synchronize domestic authoritative precedence and use versioned fused-provider URLs and local cache paths.

## v6.0.7-oc-normal.1 / v6.0.7-oc-smart.1 (2026-07-14)

- FIX#176: Normal/Smart heredoc YAML synchronizes fused order with domestic domains first and general international CDN/GeoIP rules later; routers follow source-graph first-match precedence rather than guessing DNS ownership.

## v6.0.6-oc-normal.1 / v6.0.6-oc-smart.1 (2026-07-14)

- SYNC: Rebuilds Normal/Smart heredoc YAML from the same fused chain. The `PROCESS-NAME` patch remains a Windows-desktop capability; routers cannot see a LAN client's WorkPro parent or Web subprocess, preserving an explicit platform exemption.

## v6.0.5-oc-normal.1 / v6.0.5-oc-smart.1 (2026-07-14)

- DIRECT-WORKPRO: Both heredoc YAML variants consume the same fused direct residual under the source graph's permanent-direct contract; routers cannot identify LAN-client process names, retaining the platform exception.

## v6.0.4-oc-normal.1 / v6.0.4-oc-smart.1 (2026-07-13)

- DIRECT-ITWDB: Normal/Smart heredoc YAML synchronizes default `DIRECT` fused MRS; `itwdb.com` and `workpro.itwdb.com` no longer depend on scattered inline rules.

## v6.0.3-oc-normal.1 / v6.0.3-oc-smart.1 (2026-07-12)

- SYNC: Normal/Smart upgrade together to Clash Party v6.0.3, consuming 124 fused providers and 141 rules.
- FIX#FUSED-DOMAIN-PAYLOAD: Both heredoc YAML variants synchronize correct MRS domain wildcards and classical-residual separation, preventing ChatGPT/OpenAI from falling into the final overseas-site segment.

## v6.0.2-oc-normal.1 / v6.0.2-oc-smart.1 (2026-07-10)

- SYNC: Normal/Smart synchronize to Clash Party v6.0.2 with 113 fused providers, 130 rules, and 55 groups.
- PERF: `.mrs` carries only normalized domains/IPs; GEOIP remains a native query in residual YAML. Removes same-policy duplicates and provably shadowed rules.
- FAIL-CLOSED: Generation fails on incorrect upstream substitutions, unresolved nested sources, and invalid residual syntax; OpenClash no longer receives partial builds.

## v6.0.1-oc-normal.1 / v6.0.1-oc-smart.1 (2026-07-10)

- SYNC: Normal/Smart heredocs synchronize to Clash Party v6.0.1, still referencing fused `.mrs` / residual YAML with unchanged totals of 113 providers, 130 rules, and 55 groups.
- DELIVERY: OpenClash does not consume the mobile text-rule format involved in Issue #174; the fused compiler and manifest continue to enforce cross-client rule order.

## v6.0.0-oc-normal.1 / v6.0.0-oc-smart.1 (2026-07-09)

- FUSED-RULESETS: Normal/Smart heredocs synchronize to Clash Party v6.0.0 fused rule sets, directly consuming fused `.mrs` / residual YAML.
- SCALE: Reduces `474 providers / 931 rules` to `113` fused providers and `130` rules.
- META: Synchronizes `VERSION_TAG` and embedded Ruby `VERSION` to v6.0.0.

## v5.4.39-oc-normal.1 / v5.4.39-oc-smart.1 (2026-07-09)

- MRS-PARTIAL: Normal/Smart heredocs synchronize all remaining migratable sources, reaching 474 providers and 929 rules.
- MIHOMO-MRS: 424 providers use `.mrs`, 30 use residual classical YAML, and 20 retain their original format because their types do not support `.mrs`.
- SCKI-SUPPLEMENTAL: Supplemental domain/ipcidr rules switch to `.mrs`; process rules remain classical text. Routers can import them, but only Mihomo recognizes the associated semantics.
- META: Synchronizes `VERSION_TAG` and embedded Ruby `VERSION` to v5.4.39.

## v5.4.38-oc-normal.1 / v5.4.38-oc-smart.1 (2026-07-09)

- SCKI-SUPPLEMENTAL: Normal/Smart heredocs synchronize 15 `scki-*` rule providers.
- MIHOMO-MRS: Normal/Smart heredocs synchronize 429 providers and 884 rules; 366 providers use `.mrs`, and 38 mixed classical providers split into domain/ipcidr `.mrs` pairs.
- META: Synchronizes `VERSION_TAG` and embedded Ruby `VERSION` to v5.4.38.

## v5.4.37-oc-normal.1 / v5.4.37-oc-smart.1 (2026-06-29)

- ★ DNS-POLICY#170: Normal/Smart heredoc YAML synchronizes these `dns.nameserver-policy` additions:
  - `geosite:cn` → AliDNS / DNSPod DoH。
  - `geosite:geolocation-!cn` → Cloudflare / Google DoH。
- Both `.sh` files synchronize `VERSION_TAG` and embedded Ruby `VERSION` to v5.4.37; the `OpenClash(mihomo).conf` reference snapshot synchronizes metadata to v5.4.37.
- Keeps `direct-nameserver-follow-policy: true` enabled and updates its explanation to CDN + geosite policy.

## v5.4.36-oc-normal.1 / v5.4.36-oc-smart.1 (2026-06-29)

- CLEAN#171-DIRECT: Normal/Smart remove 22 individually verified redundant inline rules, retaining 376 providers and semantics aligned with Clash Party v5.4.36.
- Synchronizes the `OpenClash(mihomo).conf` reference snapshot to v5.4.36; AI / Binance / Microsoft login candidates remain because earlier different-policy `.mrs` rules block their removal.

## v5.4.35-oc-normal.1 / v5.4.35-oc-smart.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM: Normal/Smart remove eight redundant rule providers and corresponding `RULE-SET` lines: `marketing`, `acc-vf-paypal`, `encoretvb`, `findmy`, `wildrift`, `acfun`, `acc-fl-douyin`, and `acc-fl-xiaohongshu`.
- CLEAN#170-DIRECT: removed three later inline rules already covered by the earlier same-target Douyin China-streaming guard: `douyin.com`, `douyinpic.com`, `douyinvod.com`.
- Provider count: 384 → 376; rule order in both `.sh` files stays aligned with Clash Party v5.4.35.
- Aligns `OpenClash(mihomo).conf` reference-snapshot metadata with v5.4.35.

## v5.4.34-oc-normal.1 / v5.4.34-oc-smart.1 (2026-06-28)

- ★ FIX#169-AMAP: Normal/Smart add the MetaCubeX `amap.mrs` provider, retaining `🚫 受限网站` as the download proxy.
- Rule order: `RULE-SET,amap,🏠 国内网站` follows ad/threat rules but precedes `proxy` / `geolocation-!cn` overseas fallbacks, so `webapi.amap.com` does not rely on the final CN fallback.
- Aligns `OpenClash(mihomo).conf` reference-snapshot metadata with v5.4.34.

## v5.4.33-oc-normal.1 / v5.4.33-oc-smart.1 (2026-06-27)

- ★ FEAT#169-AI-CODING: Normal/Smart add the `vpsdance-ai-coding` provider and AI-service rule matching.
- Retains the v5.4.32 domestic-game precedence fix.

## v5.4.32-oc-normal.1 / v5.4.32-oc-smart.1 (2026-06-25)

- ★ FIX#168-CN-GAME: Normal/Smart heredoc YAML moves the domestic-game block ahead of overseas games, preventing HoYoverse / Game / category-games from matching a proxy first.
- Aligns `OpenClash(mihomo).conf` reference-snapshot metadata with v5.4.32.

## v5.4.31-oc-normal.1 / v5.4.31-oc-smart.1 (2026-06-20)

- ★ FIX#167-DOUYIN: Normal and Smart add a Douyin Web domestic-streaming guard before ads/TikTok/overseas-tail rules, covering `douyin.com` and video CDNs such as `zjcdn.com`.
- Aligns `OpenClash(mihomo).conf` reference-snapshot metadata with v5.4.31.

## v5.4.30-oc-normal.1 / v5.4.30-oc-smart.1 (2026-06-17)

- ★ FEAT#166-GOOGLE: Normal and Smart add business group `🔍 Google 服务` before `🔧 工具与服务`.
- Scholar, core Google services, Google IP, and Google QUIC rules target the new group; Ruby/static-fragment business-group counts become 33.

## v5.4.29-oc-normal.1 / v5.4.29-oc-smart.1 (2026-06-10)

- ★ PERF#165-LATENCY: Both OpenClash Normal/Smart Ruby generators set regional automatic-test `interval` to 300s.
- Keeps rule-provider downloads on `🚫 受限网站`; FINAL fallback semantics do not change in this round.
- Aligns `OpenClash(mihomo).conf` reference-snapshot metadata with v5.4.29.

## v5.4.27-oc-normal.1 / v5.4.27-oc-smart.1 (2026-06-07)

- ★ CLEAN#165: Both overrides remove baseline inline domains already covered by Claude / PayPal / HBO / Hulu / Xbox upstream providers.
- Additional fix: Removes unreachable `hulu.jp` / `happyon.jp` Japanese/Korean streaming fallbacks after `RULE-SET,hulu`; the first match remains `RULE-SET,hulu → 📺 Hulu`.

## v5.4.26-oc-normal.1 / v5.4.26-oc-smart.1 (2026-06-07)

- ★ FIX#164: Protects domestic direct routing for Tencent WorkBuddy `copilot.tencent.com`: szkane `AiDomain.list` uses substring `DOMAIN-KEYWORD,copilot`, which incorrectly sent it to `🤖 AI 服务` (an overseas proxy), causing conversation errors. Both overrides insert `DOMAIN-SUFFIX,copilot.tencent.com,\U0001F3E0 国内网站` before AI rule sets such as `RULE-SET,openai`. Baseline: Clash Party v5.4.26.

## v5.4.25-oc-normal.2 / v5.4.25-oc-smart.2 (2026-06-05)

- ★ SECURITY#OC-TMP: Both overrides use private `mktemp` files and `trap` cleanup, preventing concurrent fixed `/tmp/clash_*` overwrites or pre-planted symlinks.
- ★ SYNC#FAKE-IP-FILTER: Adds `+.pub.3gppnetwork.org` / `+.bing.com` / `+.miwifi.com` plus real-IP entries for Apple Push / Xiaomi / Getui, matching the 57-entry fake-ip-filter in all three JS clients.
- ★ VERIFY: Contract validation checks required OpenClash fake-ip-filter entries.

## v5.4.25-oc-normal.1 / v5.4.25-oc-smart.1 (2026-06-04)

- ★ Review fix: Deduplicates GEOIP rules (`GEOIP,netflix` / `GEOIP,google` each appeared twice), retaining the centralized GEOIP-label routing block.
- ★ SYNC: Aligns `OpenClash(mihomo).conf` reference-header metadata with Clash Party v5.4.25; the two Normal/Smart `.sh` files remain authoritative runtime outputs.

## v5.4.23-oc-normal.1 / v5.4.23-oc-smart.1 (2026-06-02)

- ★ FIX#161: `DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` targeted `🏠 国内网站` direct routing for Zhihu image CDN/short links, matching the baseline.

## v5.4.22-oc-normal.1 / v5.4.22-oc-smart.1 (2026-05-31)

- ★ Added GeTui push SDK `getui.com` / `getui.net` / `gepush.com` to direct exceptions after review. Continuing #2, generic ad/privacy feeds treated them as trackers despite carrying application push such as Mi Home; the owner chose to allow them.

#1 Adapted from Proxy-override: Fine-grained QUIC handling with AND-rule exemptions for YouTube/Google/MS/Apple; other non-CN QUIC is REJECT. Adds OpenClash's previously missing QUIC AND rules.

- ★ FIX#HOSTS-DEDUP (review fix): Removes duplicate `use-hosts: false` introduced by v5.4.21 (#4), which silently overrode v5.4.17 FIX#HOSTS-ALIGN's `use-hosts: true` under YAML last-wins semantics (duplicate keys in the same DNS block of both scripts). Restores hosts pre-resolution and removes the fake-IP cold-start circular dependency.
- Fallback criterion changes from `GEOIP,CN` to `GEOSITE,cn`, following mainline for more reliable fake-IP behavior.

## v5.4.21-oc-normal.1 / v5.4.21-oc-smart.1 (2026-05-31)

#4 Adapted from Proxy-override: Upgrades `default-nameserver` from plaintext IPs to DoH-over-IP plus one plaintext fallback (two Alibaba entries + Google + CF). The historical entry described this as eliminating bootstrap DNS leaks; the retained plaintext fallback means it is not an unconditional no-leak guarantee.

## v5.4.20-oc-normal.1 / v5.4.20-oc-smart.1 (2026-05-30)

Proxy-override adaptations, batch B · #6 node-filter keywords (Normal/Smart synchronized; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`):

- Ruby `INFO_PATTERNS` reject-array additions: Chinese `/免费/` `/试用/` `/应急/`; English `/\bSign\b/i` `/\bLogin\b/i` `/\bRegister\b/i` `/\bHelp\b/i` `/\bFAQ\b/i` (`\b` boundaries avoid matching Signal; Chinese `/注册/` already existed).
- Excluded `更新` / `地址` due to false-positive risk, as specified by the owner.
- Consistency regression: `tools/test-info-node-filter.js` covers Ruby INFO_PATTERNS in both `.sh` files.
- 🔢 Version: v5.4.19-oc-* → v5.4.20-oc-*.

## v5.4.19-oc-normal.1 / v5.4.19-oc-smart.1 (2026-05-30)

Proxy-override adaptations, batch A (Normal/Smart synchronized; follows Clash Party v5.4.19; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`):

- ✅ #2 Added leading China SDK/CDN direct rules.
  - Forces jpush / `msg.umeng.com` DIRECT before ad rules `RULE-SET,jiguangtuisong` / `youmengchuangxiang`, using the existing early false-positive allowlist for Paddle / Xiaomi.
  - Placed `baomitu.com`, `bootcss.com`, `staticfile.org`, `upaiyun.com` before `RULE-SET,cn` in the China-site segment.
- ✅ #3 Added ten fake-ip-filter entries: remote access todesk/oray/sunlogin/teamviewer/anydesk; games battlenet.com.cn/wotgame.cn/wggames.cn/wowsgame.cn; Bilibili P2P mcdn.bilivideo.cn.
- ✅ #5 Added `direct-nameserver-follow-policy: true` so direct-outbound domain resolution followed nameserver-policy. That release recorded the policy as containing only international CDNs, with no China-domain false positives.
- 🔢 Version: v5.4.17-oc-* → v5.4.19-oc-* (all outputs skip the invalidated .18 and converge on v5.4.19, updating both VERSION_TAG and embedded Ruby VERSION).
## v5.4.17-oc-normal.2 / v5.4.17-oc-smart.2 (2026-05-30)

- ★ FIX#KR-WB: Adds word boundaries to bare Ruby `REGIONS` code `KR`: `\bKR\b`, matching HK/TW/JP/SG/US in the same file.
  - The old `/KR/i` substring match incorrectly classified Ukraine / Krakow / Kraken and other names containing kr into `🇯🇵 日韩节点`.
  - `\b` treats digits as word characters, so adjacent digits in "KR01" do not match (as with HK01/TW01). Conf outputs use lookbehind permitting digit boundaries, so KR01 matches there; this existing cross-client difference is documented.
  - §1.5 audit: Normal and Full are structurally equivalent and both fixed; all three mainline Clash Party JS scripts and CMFA already had boundaries and were unchanged.
- ★ FIX#DEDUP: Removes duplicate dead rules at the end of rules: noip.com / GEOIP,cloudflare / GEOIP,CN (one each).
  - Each was a literal duplicate of an earlier same-target entry, unreachable under first-match order; removal has no routing effect.
- ★ FIX#HOSTS-ALIGN: Changes `use-hosts: false` to `true` and adds missing `dns.alidns.com` / `doh.pub` hosts.
  - Mainline alignment: Hosts pin IPs for all internally used DoH domains (alidns/doh.pub/google/cloudflare), removing the fake-IP cold-start circular dependency.
  - Previously `use-hosts:false` disabled the hosts block; the report incorrectly proposed deleting hosts instead of enabling it. §1 DNS changes also synchronize CMFA.
- Regression tests: `tools/test-kr-boundary.js`.

## v5.4.17-oc-normal.1 / v5.4.17-oc-smart.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP: Normal/Smart synchronize the Clash Party v5.4.17 DNS contract.
  - `default-nameserver` uses IP literals; `nameserver` / `direct-nameserver` use fixed domestic DoH.
  - `proxy-server-nameserver` uses fixed Cloudflare + Google DoH with AliDNS + DNSPod DoH fallback.
  - `fallback` uses fixed Cloudflare + Google DoH; disables `prefer-h3`, enables `respect-rules: true`, and completes `fallback-filter.geosite`.

## v5.4.16-oc-normal.2 / v5.4.16-oc-smart.2 (2026-05-22)

- ✅ FEAT#GAME-ACCEL: added game-accelerator `PROCESS-NAME -> DIRECT` exceptions.
  - Added 16 PROCESS-NAME rules for UU / Xiaohei / Xunyou / Leishen / NNer accelerators.
  - Normal and Smart synchronized.

## v5.4.16-oc-normal.1 / v5.4.16-oc-smart.1 (2026-05-20)

- ✅ FIX#149-P0: Normal/Smart insert an early `paddle.com -> 🏦 金融支付` rule.
  - Overrides anti-AD/DustinWin false-positive blocking of `analytics.paddle.com`.
  - In heredoc YAML, this rule precedes every ad/phishing/threat-intelligence `RULE-SET`, preventing Antigravity account-settings return-navigation failures.

## v5.4.15-oc-normal.1 / v5.4.15-oc-smart.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER: Normal/Smart synchronize Clash Party v5.4.15 metadata and ledger references.
- ♻️ REFACTOR#AD-FP-MODULE: Explicitly labels the Anti-ad false-positive allowlist at the top of heredoc YAML rules; it still precedes ad/phishing/threat-intelligence rules.

## v5.4.14-oc-normal.1 / v5.4.14-oc-smart.1 (2026-05-20)

- ✅ FIX#CF-R2-P0: Normal/Smart insert an early `cloudflarestorage.com -> 🌐 国外网站` rule.
  - At that release, Sukka's phishing source included the Cloudflare R2 storage domain, so first-match ad rules shadowed the later overseas-site rule.
  - Adds the allowlist before ad/phishing/threat-intelligence rules in heredoc YAML and removes the later duplicate.

## v5.4.13-oc-normal.1 / v5.4.13-oc-smart.1 (2026-05-19)

- ✅ FIX#STUN-REALIP: OpenClash Normal/Smart synchronize STUN/TURN real-IP resolution and direct-port routing.
  - Heredoc DNS `fake-ip-filter` adds STUN/TURN wildcards, `stun1-4.l.google.com`, and `global.turn.twilio.com`.
  - Adds `DST-PORT 5349 / 19302 / 19305 / 19307 -> DIRECT` near the end of rules.
  - UDP/443 retains the QUIC-blocking policy and is not a default STUN/TURN exception.

## v5.4.12-oc-normal.1 / v5.4.12-oc-smart.1 (2026-05-12)

- ✅ FIX#RD-REALIP: OpenClash Normal/Smart heredoc DNS `fake-ip-filter` adds `+.rustdesk.com`.
  - RustDesk relay/API traffic still uses `🧑‍💼 会议协作`, but domains resolve to real IPs to avoid fake-IP interference with rendezvous and relay stages.

## v5.4.11-oc-normal.1 / v5.4.11-oc-smart.1 (2026-05-12)

- ✅ FIX#RD-PROC: RustDesk process rules change from `DIRECT` to `🧑‍💼 会议协作`; `rustdesk.com` domain protection remains ahead of Copilot rules.
- ✅ FIX#DNS-BOOTSTRAP: Heredoc YAML DNS servers become IP-first to avoid DoH bootstrap failure during router cold starts.

## v5.4.9-oc-normal.1 / v5.4.9-oc-smart.1 (2026-05-11)

- ✅ FEAT#LOCAL-TOOLS: Synchronizes the desktop-local-tool `PROCESS-NAME -> DIRECT` allowlist syntax from Clash Party v5.4.9.
  - OpenClash routers generally cannot see LAN-client process names, so this list primarily preserves Mihomo rule-shape consistency.
  - Does not change proxy-groups / rule-providers / DNS semantics.

## v5.4.8-oc-normal.2 / v5.4.8-oc-smart.2 (2026-05-11)

- ★ META#VERSION: Synchronizes script headers, `VERSION_TAG`, and embedded Ruby `VERSION`.
  - Normal and Smart both explicitly align with Clash Party v5.4.8.
  - No change to proxy-groups/rule-providers/rules semantics.

## v5.4.8-oc-normal.1 / v5.4.8-oc-smart.1 (2026-05-09)

- ★ ORDER#RULE-TAIL: synchronized v5.4.8 tail-rule order.
  - Normal and Smart heredoc YAML synchronized.
  - Changes only `rules:` order, not proxy-groups or Ruby regional classification.

## v5.4.7-oc-normal.1 / v5.4.7-oc-smart.1 (2026-05-09)

- ★ FEAT#TikTok: added independent `🎵 TikTok` group (32 service groups), between `📺 国内流媒体` and `🎥 Netflix`.
  - Synchronizes heredoc YAML proxy-groups / rules and Smart Ruby `REGIONS`.
- ★ FIX#HK: Adds `|港` to Ruby `REGIONS["HK"]` regex, covering IEPL/IPLC cross-border dedicated-link names such as `广港` / `深港`.

## v5.4.6-oc-normal.1 / v5.4.6-oc-smart.1 (2026-05-08)

- ★ FEAT#145: WeChat CDN direct routing.
  - Adds `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT` to both shell scripts after iwipwedabay.com and before binance.
  - Followed v5.4.6 baseline.

## v5.4.5-oc-normal.1 / v5.4.5-oc-smart.1 (2026-05-07)

- ★ Moved global nodes first and synchronized group ordering across products, following v5.4.5.

## v5.4.4-oc-normal.1 / v5.4.4-oc-smart.1 (2026-05-07)

- ★ FIX#144: bbys.app DIRECT rule.
  - Adds `DOMAIN-SUFFIX,bbys.app,DIRECT` to both shell scripts after acc-chinamax and before GFW, routing the bbys.app video domain directly.
- ★ FEAT#143: Residential Ruby RESIDENTIAL_PATTERNS adds IPLC/IEPL/dedicated-link recognition.
  - Both shell scripts append `/\biplc\b/i`, `/\biepl\b/i`, and keyword `专线` to `RESIDENTIAL_PATTERNS`, matching residential-type nodes bearing those labels.
- ★ FIX#142 DNS cold-start repair was JS-specific; static configuration was exempt with no shared runtime change.
- Bump: `v5.4.3-oc-normal.1` → `v5.4.4-oc-normal.1` / `v5.4.3-oc-smart.1` → `v5.4.4-oc-smart.1`

## v5.4.3-oc-normal.1 / v5.4.3-oc-smart.1 (2026-05-06)

- ★ FEAT: Residential Ruby RESIDENTIAL_PATTERNS adds `\bhome\b`, following the Clash Party v5.4.3 baseline.
  - Both shell scripts append `/\bhome\b/i` to `RESIDENTIAL_PATTERNS`, matching node names whose only residential marker is Home.

## v5.4.2-oc-normal.1 / v5.4.2-oc-smart.1 (2026-05-05)

- ★ FIX#41-P0: Xiaomi core-service DIRECT exceptions, following v5.4.2.
  - Added 11 DIRECT rules before ad blocking, correcting miuiprivacy/advertisingmitv rejection of authentication/security domains.
  - Both Normal and Smart shell scripts synchronized.

<a id="v540-2026-05-05--新增--狮城节点---狮城家宽-独立区域组"></a>

## v5.4.0 (2026-05-05) — Separate Singapore node and residential groups

- ★ FEAT#SG: Follows the Clash Party v5.4.0 baseline, adding Singapore node groups.
  - Split Singapore into a separate region from `🌏 亚太节点`.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.

<a id="v530-2026-04-26--流媒体分组架构重构"></a>

## v5.3.0 (2026-04-26) — Streaming-group architecture refactor

- ★ REFACTOR#2: Follows Clash Party v5.3.0, expanding streaming groups from 7 to 13, split by platform.
  - Separates: `🎥 Netflix` / `🎬 Disney+` / `📡 HBO/Max` / `📺 Hulu` / `🎬 Prime Video` / `📹 YouTube` / `🎵 音乐流媒体`.
  - Adds fallback group `🌐 其他国外流媒体`.
  - Service groups: 25 → 31; total groups: 43 → 49.

<a id="normalopenclashmihomosh非-smart-内核--url-test-版"></a>

## Normal (`OpenClash(mihomo).sh`, non-Smart kernel / url-test variant)

### v5.4.0-oc-normal.1 (2026-05-05)

- ★ FEAT#SG: added independent `🇸🇬 狮城节点` / `🏡 狮城家宽` url-test groups.
  - Split Singapore into a separate region from `🌏 亚太节点`.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Followed Clash Party v5.4.0.

<a id="v530-oc-normal2-2026-04-26--fix-fake-ip-filter-清理--sniffer-skip-domain-无效条目"></a>

### v5.3.0-oc-normal.2 (2026-04-26) — FIX: fake-ip-filter cleanup and invalid sniffer skip-domain entry

- ★ FIX: Removes three leftover Binance domains from `fake-ip-filter`, resolving inconsistency with Smart/CMFA, which lacked them.
  - Removes `+.binance.com` / `+.binancefuture.com` / `+.binance.vision`.
  - Sniffer SNI identification plus `DOMAIN-SUFFIX` rules already handled Binance routing correctly, making these fake-ip-filter exemptions redundant.
- ★ FIX: Removes invalid `Mijia Cloud` from `sniffer.skip-domain`: its space makes it an invalid domain that cannot match an SNI hostname.
- Version `v5.3.0-oc-normal.1` → `v5.3.0-oc-normal.2`.

<a id="v530-oc-normal1-2026-04-26--同上"></a>

### v5.3.0-oc-normal.1 (2026-04-26) — Same changes as above

<a id="v5211-oc-normal1-2026-04-26--业务组合并4-个冗余组--保留组--新增-工具与服务"></a>

### v5.2.11-oc-normal.1 (2026-04-26) — Business-group consolidation: four redundant groups merged, tools/services added

- ★ **Consolidates business groups (28 → 25):** follows the Clash Party v5.2.11 baseline cleanup.
  - Removes `📧 邮件服务`: all its rules now route to `🌐 国外网站`.
  - Removes `🔍 搜索引擎` and `📟 开发者服务`, merging them into `🔧 工具与服务`.
  - Removes `☁️ 云与CDN`: all its rules now route to `🌐 国外网站`.
  - `📥 下载更新`: `*id003` → `*id002`, increasing default proxy priority.
- Bump: `v5.2.10-oc-normal.2` → `v5.2.11-oc-normal.1`
- Synchronizes OpenClash Full with identical changes.

<a id="v5210-oc-normal2-2026-04-25--fix-snifferskip-domain-误含币安域名导致-tls-流量按-ip-路由"></a>

### v5.2.10-oc-normal.2 (2026-04-25) — FIX: Binance domains in sniffer.skip-domain caused IP-based TLS routing

- ★ **FIX: Three Binance domains incorrectly present in OpenClash sniffer.skip-domain prevented TLS SNI rewriting.**
  - Symptom: freqtrade / quantitative-trading containers accessing `data.binance.vision`, `fapi.binance.com`, and similar hosts encountered:
    `ContentLengthError` / `Cannot connect` / `TimeoutError`
  - Cause: `sniffer.skip-domain` contained `+.binance.com` / `+.binancefuture.com` / `+.binance.vision`;
    after detecting SNI, the sniffer skipped domain rewriting, routing traffic by its original IP instead of matching
    `DOMAIN-SUFFIX,binance.*,💰 加密货币` → `MATCH` → `🐟 漏网之鱼` → proxy rejection or timeout on traffic without SNI.
  - Fix: Removes the three Binance entries from `skip-domain`, retaining `+.push.apple.com` and `Mijia Cloud` at that release.
    The fake-IP layer still assigned real IPs to Binance; after SNI detection, `DOMAIN-SUFFIX` correctly routed it to `💰 加密货币`.
  - Version `v5.2.10-oc-normal.1` → `v5.2.10-oc-normal.2`.

<a id="v5210-oc-normal1-2026-04-25--境外-doh-端点改路由到--受限网站"></a>

### v5.2.10-oc-normal.1 (2026-04-25) — Overseas DoH endpoints routed to `🚫 受限网站`

- ★ FIX#39: synchronized shared behavior with v5.2.10.
  - `DOMAIN,dns.google,☁️ 云与CDN` → `"DOMAIN,dns.google,\U0001F6AB 受限网站"`
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `"DOMAIN,dns.google.com,\U0001F6AB 受限网站"`
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `"DOMAIN-SUFFIX,cloudflare-dns.com,\U0001F6AB 受限网站"`
  - Uses `\U0001F6AB` escapes consistently with other `🚫 受限网站` rules in this file.
- ★ Synchronizes the Ruby script `VERSION` constant and heredoc-header `VERSION_TAG`.
- Bump: `v5.2.9-oc-normal.5` → `v5.2.10-oc-normal.1`, catching up to mainline v5.2.10.

<a id="v529-oc-normal5-2026-04-25--兼容性审计修复"></a>

### v5.2.9-oc-normal.5 (2026-04-25) — Compatibility-audit fixes

- ★ FIX-OC-01: Adds `\b` word boundaries for HK/TW/JP/SG/US in REGIONS regexes.
  - `HK` → `\bHK\b` (avoids HKG/HKUST); `TW` → `\bTW\b` (avoids TWN/TWICE).
  - `JP` → `\bJP\b` (avoids JPG/JPMorgan); `SG` → `\bSG\b` (avoids SGP).
  - `US\b` → `\bUS\b`, adding the initial boundary to avoid words containing US, such as FOCUS.
  - Synchronizes OpenClash Full.
- ★ FIX-OC-01α: Explicitly adds alpha-3 codes `HKG`/`TWN`/`JPN`/`SGP`, necessary after `\b` removes substring matching, matching FIX#24's treatment of `KOR`.
- Bump: `v5.2.8-oc-normal.4` → `v5.2.9-oc-normal.5`

<a id="v528-oc-normal4-2026-04-24--dnspod-doh-端点切换为纯-ip-形式"></a>

### v5.2.8-oc-normal.4 (2026-04-24) — DNSPod DoH endpoint changed to an IP literal

- ★ In nameserver / proxy-server-nameserver / direct-nameserver,
  replaced `https://doh.pub/dns-query` with `https://1.12.12.12/dns-query`.
  - The IP-literal DNSPod DoH endpoint **does not need bootstrap resolution of `doh.pub`**, removing the cold-start
    potential DoH self-dependency deadlock.
- Version `v5.2.8-oc-normal.3` → `v5.2.8-oc-normal.4`.

### v5.2.8-oc-normal.3 (2026-04-23)

- ★ **FIX#28-P0** (multiple node-classification memberships): The APAC group lacked HK/TW/JP/KR and the Americas group lacked US.
  - User-reported symptom: Hong Kong/Taiwan/Japan/Korea nodes were missing from OpenClash APAC, and US nodes from Americas.
  - Cause: Ruby classification used `GROUP_MAP.each { ... break }`, so a node's region code matched only the first containing entry: HK stopped at `"HK" => ["HK"]` and US at `"US" => ["US"]`, never reaching `"APAC"` / `"AM"`. Mainline Clash Party JS instead uses `apacNodes = c.HK.concat(c.TW, c.CN, c.JP, c.KR, c.SG, c.APAC_OTHER)` / `americasNodes = c.US.concat(c.AM)`, giving nodes **both subregion and continent membership**.
  - Fix (L4275–L4332):
    - Expands `GROUP_MAP["APAC"]` to `["HK", "TW", "JP", "KR", "SG", "IN", "TH", "VN", "MY", "ID", "PH", "AU", "NZ", "TR", "AE"]`.
    - Expands `GROUP_MAP["AM"]` to `["US", "CA", "MX", "BR", "AR"]`.
    - Removes `break` from the classification loop so each node may enter both its subregion (Hong Kong/Taiwan/Japan-Korea/US) and continent (APAC/Americas).
  - Equivalent-bug audit (required by historical CLAUDE.md §1.5): Both Ruby scripts and CMFA YAML had the bug and were fixed in this PR (OpenClash Normal / OpenClash Full / CMFA). Clash Party JS / Clash Party Normal JS / Shadowrocket / Surge / Loon / QX already had correct coverage and needed no changes; SingBox / v2rayN have no runtime node classification (N/A).

### v5.2.7-oc-normal.1 (2026-04-23)

- ★ **FIX#27-P1** (synchronized with Clash Party v5.2.7): Eliminates parse warnings when Mihomo loads three classical rule providers.
  - Symptom: OpenClash → Mihomo startup/reload logs repeatedly printed:
    - `parse classical rule [USER-AGENT,TikTok*] error: unsupported rule type: USER-AGENT`
    - `parse classical rule [USER-AGENT,BBCiPlayer*] error: unsupported rule type: USER-AGENT`
    - `parse classical rule [IP-CIDR , 17.253.4.125] error: payloadRule error`
  - Cause: Upstream `szkane/ClashRuleSet` files `CiciAi.list` / `UK.list` each contained one USER-AGENT line unsupported by Mihomo; upstream `Accademia/.../Grok.yaml` contained `IP-CIDR         , 17.253.4.125` with extra spaces and a missing mask.
  - Fix: Redirects `szkane-ciciai` / `szkane-uk` / `acc-grok` URLs to sanitized copies under this repository's `mirrors/`, removing only the problematic lines and retaining all other rule bytes.
  - Baseline: Clash Party v5.2.7 → Normal bumped to `v5.2.7-oc-normal.1`.

### v5.2.6-oc-normal.1 (2026-04-22)

- ★ **FIX#24-P0** (equivalent-bug coverage): Adds literal `KOR` to the Ruby `REGIONS` hash.
  - Symptom: `KR  => /韩国|韓國|KR|Korea|Korean|🇰🇷|Seoul/i`. When Ruby matches substrings in `"KOR 01"`,
    `KR` is not a substring of `KOR` (K-O-R has no consecutive K-R), nor is `Korea`; therefore `KOR` nodes
    were classified as `nil` (UNCLASSIFIED), excluding them from `🇯🇵 日韩节点`.
  - Fix: Appends literal `KOR` at L4086 → `KR  => /韩国|韓國|KR|KOR|Korea|Korean|🇰🇷|Seoul/i`.
  - Note: `TW` already matched `TWN` through `/TW/i`, `JP` matched `JPN` through `/JP/i`, and `SG`
    matched `SGP` through `/SG/i`; those three needed no changes in this release (Ruby regexes lacked word boundaries, unlike JS).
  - Synchronizes Clash Party v5.2.6 FIX#24.

## Normal（`OpenClash(mihomo).sh`）

### v5.3.5-dedup-acc-china (2026-04-20)

- ★ Synchronizes Clash Party v5.2.5 FIX#23-P1: Removes `acc-china`, fully redundant with `geosite:cn`; Normal had already lacked `acc-geositecn` since v5.3.4, so only `acc-china` is removed here.
- Recorded benefit: Normal providers 136 → 135, approximately 2 MB less memory and one fewer cold-start HTTP fetch.

### v5.3.4-align-dns-baseline (2026-04-20)

- ★ Aligns with the Clash Party DNS baseline (`Mihomo内核系/Clash Party/README.md`, historical lines 99–132):
  - `use-hosts: true` → `false`
  - `default-nameserver` changes from exclusively overseas resolvers (1.1.1.1 / 8.8.8.8 / 9.9.9.9 …) to baseline order `223.5.5.5 / 119.29.29.29 / 1.1.1.1 / 8.8.8.8`.
  - `nameserver`: `223.5.5.5` DoH + `doh.pub` DoH, resolving domestic domains through domestic resolvers.
  - `direct-nameserver`: Same domestic DoH as `nameserver`.
  - `proxy-server-nameserver`: `1.1.1.1` + `8.8.8.8` + `223.5.5.5` + `doh.pub` (four entries).
  - `fallback`: Only `1.1.1.1` + `8.8.8.8`, the two baseline entries.
  - Removes non-baseline `direct-nameserver-follow-policy: false`.
  - Removes the "rescue mode" comment; its behavior was already covered by jsdelivr/github direct policies in `nameserver-policy`.

### v5.3.3-align-rp-proxy-gfw (2026-04-20)

- ★ Changes rule-provider `proxy: DIRECT` to `proxy: 🚫 受限网站` in 136 places, aligning with Clash Party FIX#17-P0.

<a id="v532-dns-rescue-no-rules-之前"></a>

### v5.3.2-dns-rescue-no-rules (earlier)

- ★ Base version with DNS cold-start recovery and memory optimization.

<a id="v531-性能基线历史"></a>

### v5.3.1 performance baseline (historical)

Refactored from `v5.2.4-oc` to address OOM:

- **Optimization #1:** `geodata-loader: standard → memconservative`. The historical entry estimated 400–600 MB savings, described `geosite.dat` / `geoip.dat` as demand-read through mmap, and recorded a first-match latency cost of a few milliseconds described as unnoticeable on routers. These are historical estimates, not current measurements or guarantees.
- **Optimization #2:** `rule-providers` 387 → 136 (65% fewer); the historical entry estimated 800–1,100 MB memory savings.
  - Consolidates the Google family (GoogleSearch / Drive / Earth / FCM / Voice → google).
  - Consolidates Apple subdivisions (AppleTV / News / Dev / Proxy / Siri / TestFlight / Firmware / FindMy → apple + icloud).
  - Removes regional messaging fragments (TelegramNL / SG / US, KakaoTalk, Zalo, GoogleVoice, iTalkBB).
  - Removes low-frequency categories (long-tail mainland-China streaming, European/Japanese regional splits, African/South American GeoRouting).
  - Removes redundant ad blocking (10+ overlapping blackmatrix7 ad sets).

Retained unchanged at that release: nine Smart groups (`uselightgbm: true + include-all-proxies: true`), dynamic node classification, multilayer DNS, sniffer settings, TLS fingerprint injection, node filtering, and concurrent TCP.

---

## Full（`OpenClash(mihomo-smart).sh`）

### v5.4.0-oc-smart.1 (2026-05-05)

- ★ FEAT#SG: Adds separate Smart regional groups `🇸🇬 狮城节点` and `🏡 狮城家宽`.
  - Split Singapore into a separate region from `🌏 亚太节点`.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Followed Clash Party v5.4.0.

<a id="v530-oc-full2-2026-04-26--fix-sniffer-skip-domain-无效条目"></a>

### v5.3.0-oc-full.2 (2026-04-26) — FIX: invalid sniffer skip-domain entry

- ★ FIX: Removes invalid `Mijia Cloud` from `sniffer.skip-domain`; its space makes it an invalid domain unable to match any SNI hostname. Aligns with CMFA.
- Version `v5.3.0-oc-full.1` → `v5.3.0-oc-full.2`.

<a id="v530-oc-full1-2026-04-26--同上"></a>

### v5.3.0-oc-full.1 (2026-04-26) — Same changes as above

<a id="v5211-oc-full1-2026-04-26--业务组合并28--25与-normal-同步"></a>

### v5.2.11-oc-full.1 (2026-04-26) — Business-group consolidation: 28 → 25, synchronized with Normal

- ★ **Business-group consolidation (28 → 25):** synchronized with Normal.
  - Removes `📧 邮件服务`, routing its rules to `🌐 国外网站`.
  - Removes `🔍 搜索引擎` and `📟 开发者服务`, merging them into `🔧 工具与服务`.
  - Removes `☁️ 云与CDN`, routing its rules to `🌐 国外网站`.
  - Changes `📥 下载更新` from DIRECT-first to proxy-first by default.
- Bump: `v5.2.10-oc-full.2` → `v5.2.11-oc-full.1`

<a id="v5210-oc-full2-2026-04-25--fix-snifferskip-domain-误含币安域名导致-tls-流量按-ip-路由"></a>

### v5.2.10-oc-full.2 (2026-04-25) — FIX: Binance domains in sniffer.skip-domain caused IP-based TLS routing

- ★ Removes three Binance domains from sniffer.skip-domain, synchronized with Normal.
  - Cause / fix / impact are identical to Normal `v5.2.10-oc-normal.2`.
  - Version `v5.2.10-oc-full.1` → `v5.2.10-oc-full.2`.

<a id="v5210-oc-full1-2026-04-25--境外-doh-端点改路由到--受限网站"></a>

### v5.2.10-oc-full.1 (2026-04-25) — Overseas DoH endpoints routed to `🚫 受限网站`

- ★ **FIX#39** (equivalent change, identical to Normal): follows the Clash Party v5.2.10 baseline.
  - `DOMAIN,dns.google,☁️ 云与CDN` → `"DOMAIN,dns.google,\U0001F6AB 受限网站"`
  - `DOMAIN,dns.google.com,☁️ 云与CDN` → `"DOMAIN,dns.google.com,\U0001F6AB 受限网站"`
  - `DOMAIN-SUFFIX,cloudflare-dns.com,☁️ 云与CDN` → `"DOMAIN-SUFFIX,cloudflare-dns.com,\U0001F6AB 受限网站"`
- Bump: `v5.2.9-oc-full.5` → `v5.2.10-oc-full.1`, catching up to mainline v5.2.10.

<a id="v529-oc-full5-2026-04-25--兼容性审计修复"></a>

### v5.2.9-oc-full.5 (2026-04-25) — Compatibility-audit fixes

- ★ FIX-OC-01: Adds `\b` word boundaries for HK/TW/JP/SG/US in REGIONS regexes, synchronized with Normal.
- ★ FIX-OC-01α: Explicitly adds alpha-3 codes `HKG`/`TWN`/`JPN`/`SGP`, synchronized with Normal.
- Bump: `v5.2.8-oc-full.4` → `v5.2.9-oc-full.5`

<a id="v528-oc-full4-2026-04-24--dnspod-doh-端点切换为纯-ip-形式"></a>

### v5.2.8-oc-full.4 (2026-04-24) — DNSPod DoH endpoint changed to an IP literal

- ★ In nameserver / proxy-server-nameserver / direct-nameserver,
  Replaces every `https://doh.pub/dns-query` with `https://1.12.12.12/dns-query`, synchronized with Normal.
  - The IP-literal DNSPod DoH endpoint **does not need bootstrap resolution of `doh.pub`**, removing the cold-start
    potential DoH self-dependency deadlock.
- Version `v5.2.8-oc-full.3` → `v5.2.8-oc-full.4`; both shell and Ruby VERSION values bumped together.

### v5.2.8-oc-full.3 (2026-04-23)

- ★ **FIX#28-P0** (multiple node-classification memberships, synchronized with Normal):
  - Symptoms / cause / fix match `v5.2.8-oc-normal.3`, at corresponding L4273–L4325 positions.
  - Expands `GROUP_MAP["APAC"]` to HK+TW+JP+KR+SG+other APAC countries and `GROUP_MAP["AM"]` to US+CA+MX+BR+AR; removes `break` from the loop.
  - Equivalent-bug audit: See Normal v5.2.8-oc-normal.3.

### v5.2.7-oc-full.1 (2026-04-23)

- ★ **FIX#27-P1** (synchronized with Clash Party v5.2.7): Eliminates parse warnings when Mihomo loads three classical rule providers.
  - Symptom / cause: Same as Normal v5.2.7-oc-normal.1; upstream `CiciAi.list` / `UK.list` each have one `USER-AGENT,*` line, while `Grok.yaml` has `IP-CIDR         , 17.253.4.125` with extra spaces and no mask.
  - Fix: Redirects `szkane-ciciai` / `szkane-uk` / `acc-grok` URLs to sanitized copies in this repository's `mirrors/` directory.
  - Baseline: Clash Party v5.2.7 → Full bumped to `v5.2.7-oc-full.1`.

### v5.2.6-oc-full.1 (2026-04-22)

- ★ **FIX#24-P0** (equivalent-bug coverage): Adds literal `KOR` to the Ruby `REGIONS` hash.
  - Same as Normal v5.2.6-oc-normal.1: appends `KOR` to the `KR` regex at L4085.
  - Synchronizes Clash Party v5.2.6 FIX#24.

### v5.2.5-oc-full.1 (2026-04-20)

- ★ Synchronizes Clash Party v5.2.5 FIX#23-P1: Removes `acc-geositecn` and `acc-china`, both fully redundant with `geosite:cn`.
- Recorded benefit: Full providers 387 → 385; approximately 5 MB less memory and two fewer cold-start HTTP fetches.
- Ruby Psych parsing verification: `providers=385 rules=975`, as expected after removing two providers and two rule lines.

### v5.2.4-oc-full.1 (2026-04-20)

- ★ Synchronizes Clash Party v5.2.4 FIX#22-P0: Fixes 403 fetching the snapchat rule provider.
  - MetaCubeX meta-rules-dat names the upstream file `snap.mrs`, not `snapchat.mrs`.
  - Changes URL to `.../geosite/snap.mrs` and path to `./ruleset/meta-snap.mrs`.
  - Keeps provider ID `snapchat`, leaving `[Rule]` references unchanged.

### v5.2.3-oc-full.2 (2026-04-20)

- ★ Aligns with the Clash Party DNS baseline (`Mihomo内核系/Clash Party/README.md`, historical lines 99–132):
  - `use-hosts: true` → `false`
  - `default-nameserver`: `223.5.5.5 / 119.29.29.29 / 1.1.1.1 / 8.8.8.8`, in baseline order.
  - `nameserver / direct-nameserver`: `223.5.5.5` DoH + `doh.pub` DoH
  - `proxy-server-nameserver`: `1.1.1.1` + `8.8.8.8` + `223.5.5.5` + `doh.pub`
  - `fallback`: `1.1.1.1` + `8.8.8.8`
  - Removes non-baseline field `direct-nameserver-follow-policy`.
  - Removes the "rescue mode" comment; its functionality remains through `nameserver-policy`.

### v5.2.3-oc-full.1 (2026-04-20)

- ★ Synchronizes Clash Party v5.2.3 FIX#21-P1: BBC / Snapchat (Snap) rules switch from blackmatrix7 classical YAML to MetaCubeX meta-rules-dat `.mrs` geosite (domain + mrs), eliminating Mihomo parse warnings for `USER-AGENT,BBCiPlayer*` and `USER-AGENT,TikTok*`.
- ★ **CRITICAL FIX:** Removes Normal `rule-providers` (136) and `rules` (678) blocks accidentally appended at the end (6,115 → 4,285 lines). Ruby Psych uses last-wins behavior for duplicate top-level YAML keys, so those blocks silently overrode Smart, causing `OpenClash(mihomo-smart).sh` to run Normal content; the appended Normal ad-block providers also incorrectly used `proxy: DIRECT`. This fix restores actual OpenClash Smart rule-count alignment with mainline Clash Party.
- ★ Expands header comments under historical `CLAUDE.md §1.3`: introduction, architecture, changelog, and baseline-alignment statement.

<a id="v522-oc-full-初版"></a>

### v5.2.2-oc-full (initial release)

- ★ Converts Clash Party v5.2.2 JS mainline into OpenClash heredoc YAML plus a Ruby processor.
