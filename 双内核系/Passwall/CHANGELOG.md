<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Passwall changelog" width="100%">
</picture>

<a id="passwall--变更日志"></a>

# Passwall — Changelog

> Changelog for `双内核系/Passwall/`, the full-featured Passwall reference using a three-layer architecture: four lists + shunt_rules + ACL.
> It interoperates with `双内核系/Passwall2/`, the simplified shunt reference. Both share the `shunt_rules.lua` parser and can consume the same `.list` files.
> This directory provides 78 nonempty native fused shunt-rule fallbacks generated from `rulesets/generated/fused/sing-box/*.srs`.
> The main version follows Clash Party; the `-pw.N` suffix increments independently.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Project README](../../README.md) · [Documentation index](../../docs/README.md)

<a id="v6021-pw12-2026-10-28"></a>

## v6.0.21-pw.12 (2026-10-28)

- Moved Google FCM from download updates to Google services, preserving 15 domains, 26 IPv4 predicates, rule order and 55 policy groups. Other push services, DNS and fake-IP were unchanged. Users still select actual service targets in LuCI.

<a id="v6020-pw11-2026-10-24"></a>

## v6.0.20-pw.11 (2026-10-24)

- Organized client directories by core family, retaining files/guides within client subdirectories. Rule semantics/fields were unchanged. Raw configuration URLs changed with paths, requiring reimport; shared `rulesets/` URLs remained unchanged.

<a id="v6020-pw10-2026-10-19"></a>

## v6.0.20-pw.10 (2026-10-19)

- Official stable backend source established that fused `.srs` applies only to sing-box shunt nodes. Checks examine every nodes type before writing, strictly read protocol for potential shunt backends, and allow ordinary valid Socks nodes to omit protocol. Xray shunts, unknown types, absent shunts and read failures are rejected to prevent silent rule loss; failure performs no UCI writes.
- Regenerated helper/conf from existing SRS, preserving URLs, order and contents of 78 rules. Corrected documentation for the current global node entry and legacy filenames. See the [verification report](../../docs/upstream/2026-10-19/singbox/report.md) for source, risk paths and device-acceptance boundaries; 24 real shell fixtures covered success/rejection on both variants.

<a id="v6020-pw9-2026-10-16"></a>

## v6.0.20-pw.9 (2026-10-16)

- Issue #187: added exact DIRECT exceptions in existing `scki-adfp-direct` for `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, `hkshort.weixin.qq.com`, preventing WeChat connection endpoints from matching ads first.
- No parent/subdomain expansion; `ad.weixin.qq.com` and `log.weixin.qq.com` remained rejected. Other policies and ordering were unchanged.
- Continued consuming fused assets through the existing generator with native platform syntax; generated files were not hand-edited.
- See [WeChat review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence and bounded static acceptance. Reporter-device recovery still required retesting.

<a id="v6019-pw8-2026-10-15"></a>

## v6.0.19-pw.8 (2026-10-15)

- FIX#186: unified repository-owned remote assets on GitHub raw HTTPS to avoid jsDelivr repository-size limits, preserving version queries and native formats.
- Reused verified fused payloads; content, ordering and policies were unchanged. Added raw/CDN-reference regressions. See [delivery guidance](../../docs/rule-asset-delivery.md) for cause, download prerequisites and official fields.

<a id="v6018-pw7-2026-10-14"></a>

## v6.0.18-pw.7 (2026-10-14)

- Fixed cross-service first-match misclassification: narrowed broad Apple/Microsoft keywords and shared AWS/Azure/CDN suffixes, adding eight guard classes: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social, bytedance-app. Six ADFP records for exact CA revocation/status hosts via DIRECT and exact Microsoft international-mail policy brought the total to 35. `api.byteoversea.com` was an exact TikTok rule, not a shared-suffix expansion. Existing Claude Desktop `a-api`/`a-cdn` exceptions, QUIC/latency options and default-off ZeroTier proxy remained. Crisp relay was a static ASN-overlap risk inference, not a measured incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 nonempty SRS across 81 segments.

<a id="v6017-pw6-2026-10-13"></a>

## v6.0.17-pw.6 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to `scki-adfp-ai` for Claude Desktop application-code/user-content loading through AI policy. Based on [official requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Existing rule sets/native syntax remained. Source-semantic gates, 29 ADFP checks, Claude stage inventory and file-level release-batch checks joined the publication chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device reproduction or measurement occurred.

<a id="v6016-pw6-2026-10-12"></a>

## v6.0.16-pw.6 (2026-10-12)

- Following v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional ADFP validation. Conversion format, order and target policies remained; no runtime rules were added. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording only observable bytes and conversion receipts. Original remote-input SHA values cannot be reconstructed from old outputs; no claim of complete historical provenance or real-device traffic measurement was made.

<a id="v6015-pw6-2026-10-07"></a>

## v6.0.15-pw.6 (2026-10-07)

- Synchronized shunt rules with non-China UDP/443 policy selection; this artifact does not manage node latency testing.
- See [latency and QUIC options](../../docs/traffic-options.md) for switching commands, capabilities and verification.

<a id="v6014-pw5-2026-09-29"></a>

## v6.0.14-pw.5 (2026-09-29)

- SYNC: added two exact WeChat HTTPDNS domains to fused SRS shunt rule 001, retaining China-sites direct semantics.
- VERIFY: continued publishing 69 nonempty shunt rules, updating remote-asset cache keys to `v6.0.14`.

<a id="v6013-pw4-2026-09-03"></a>

## v6.0.13-pw.4 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE: added suffix `linuxdo.org` to fused SRS shunt rule 013 with its existing China-sites direct semantics; `linux.do` retained proxy semantics in rule 059.
- SYNC: continued publishing 69 nonempty shunt rules, updating release cache keys to `v6.0.13`.

<a id="v6012-pw3-2026-09-01"></a>

## v6.0.12-pw.3 (2026-09-01)

- FIX#181-PC: rebuilt the initial fused SRS shunt rule so `login.nvidia.cn` received early `direct` handling; other NVIDIA domains retained downloads-group semantics.
- SYNC: continued publishing 69 nonempty shunt rules, updating release cache keys to `v6.0.12`.

<a id="v6011-pw2-2026-08-22"></a>

## v6.0.11-pw.2 (2026-08-22)

- Rebuilt 69 fused SRS shunt rules from the final manifest. Gemini and Accademia Gemini segments adopted Google semantics; szkane AI and its order were unchanged.

<a id="v6010-pw2-2026-08-08"></a>

## v6.0.10-pw.2 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: rebuilt the initial fused SRS shunt rule, fixing two NetEase game-service hosts to `direct` before the China-games shunt rule.

<a id="v609-pw1-2026-07-19"></a>

## v6.0.9-pw.1 (2026-07-19)

- Rebuilt 66 fused shunt rules. Routers lack desktop-process identity, so `api.github.com` used an early generic tools-group segment.

<a id="v608-pw1-2026-07-15"></a>

## v6.0.8-pw.1 (2026-07-15)

- Synchronized China-authority precedence across 65 fused shunt rules, with release-version cache keys for remote `.srs`.

<a id="v607-pw1-2026-07-14"></a>

## v6.0.7-pw.1 (2026-07-14)

- FIX#176: regenerated 65 fused SRS shunt rules. China-domain segments preceded generic international CDN / GeoIP fallback, preserving the source graph's first-match order on routers.

<a id="v606-pw1-2026-07-14"></a>

## v6.0.6-pw.1 (2026-07-14)

- SYNC: rebuilt fused SRS shunt rules with v6.0.6. A Passwall router cannot observe LAN-client `WorkPro.exe` / `WorkProWebProcess.exe`, so process-level matching was not promised.

<a id="v605-pw1-2026-07-14"></a>

## v6.0.5-pw.1 (2026-07-14)

- PLATFORM: rebuilt fused SRS shunt rules. A Passwall router cannot observe LAN-client WorkPro.exe, so process-level matching was not promised.

<a id="v604-pw1-2026-07-13"></a>

## v6.0.4-pw.1 (2026-07-13)

- DIRECT-ITWDB: rebuilt the default direct shunt rule from `scki-fused-008-direct.srs`; `itwdb.com` and WorkPro subdomains no longer required handwritten Passwall domain lists.

<a id="v603-pw1-2026-07-12"></a>

## v6.0.3-pw.1 (2026-07-12)

- SYNC: regenerated 65 nonempty `rule-set:remote` shunt rules, apply script and reference configuration from the v6.0.3 fused sing-box target.
- AI-PRECEDENCE: the added AI telemetry guard retained precedence before ad rules and international-sites fallback; every shunt URL referenced only repository fused `.srs`.

<a id="v602-pw1-2026-07-10"></a>

## v6.0.2-pw.1 (2026-07-10)

- SYNC: regenerated 64 nonempty `rule-set:remote` shunt rules, apply script and reference configuration from the v6.0.2 fused sing-box target.
- PERF: 64 `.srs` totaled approximately 4.06 MiB, inheriting target GEOIP/ASN materialization and global exact deduplication. Domain/IP dual-list flags followed final SRS IP contents, with no direct upstream rule-set calls.

<a id="v601-pw1-2026-07-10"></a>

## v6.0.1-pw.1 (2026-07-10)

- SYNC: regenerated the apply script, reference configuration and 68 shunt rules from fused sing-box JSON, advancing the baseline to Clash Party v6.0.1.
- DELIVERY: Passwall retained native `rule-set:remote` `.srs` fallback; mobile text sharding for Issue #174 did not change its 68 shunt mappings or policy semantics.

<a id="v600-pw2-2026-07-09"></a>

## v6.0.0-pw.2 (2026-07-09)

- FUSED-PASSWALL: `tools/generate-fused-fallback-artifacts.js` began generating `Passwall(xray+sing-box)-apply.sh`, reference `.conf` and `shunt-rules/*.list`.
- SCOPE: each shunt rule referenced its corresponding remote `rulesets/generated/fused/sing-box/*.srs`. Removed all 33 old handwritten flattened domain/IP lists, ending separate Passwall rule-content maintenance.

<a id="v600-pw1-2026-07-09"></a>

## v6.0.0-pw.1 (2026-07-09)

- META: updated version metadata with Clash Party v6.0.0.
- SCOPE: Passwall remained a flattened shunt_rules fallback reference; fused mainline rule sets were not generated back from Passwall.

<a id="v5439-pw1-2026-07-09"></a>

## v5.4.39-pw.1 (2026-07-09)

- META: updated version metadata with Clash Party v5.4.39.
- N/A: flattened Passwall shunt rules do not consume Mihomo `.mrs` providers; `.list` semantics continued from v5.4.38-pw.1.

<a id="v5438-pw1-2026-07-09"></a>

## v5.4.38-pw.1 (2026-07-09)

- META: updated version metadata with Clash Party v5.4.38.
- SCOPE: flattened Passwall shunt rules retained local `.list` structure without direct references to public supplemental URLs.

<a id="v5437-pw1-2026-06-29"></a>

## v5.4.37-pw.1 (2026-06-29)

- META#170-DNS-POLICY: updated version metadata with Clash Party v5.4.37.
- N/A: flattened Passwall shunt rules do not contain Mihomo `nameserver-policy` DNS fields; `.list` semantics were unchanged.

<a id="v5436-pw1-2026-06-29"></a>

## v5.4.36-pw.1 (2026-06-29)

- CLEAN#171-DIRECT: followed Clash Party v5.4.36 cleanup by removing flattened `channel4.com` / `sky.com` rules. Other candidates did not apply to Passwall's flattened layer or still needed retention.
- Synchronized version metadata; the shunt-rule count decreased accordingly.

<a id="v5435-pw1-2026-06-28"></a>

## v5.4.35-pw.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM: updated version metadata against Clash Party v5.4.35.
- N/A: Passwall's flattened fallback does not consume Mihomo providers. `domain:encoretvb.com` remained static Hong Kong-streaming coverage; semantics of 33 shunt rules were unchanged.

<a id="v5434-pw1-2026-06-28"></a>

## v5.4.34-pw.1 (2026-06-28)

- ★ FIX#169-AMAP: added direct fallback for AMap core domains to `27-cn-site.list`, the apply script and reference `.conf`.
- Covered `a-map.cn` / `amap.com` / `amapauto.com` / `anav.com` / `autonavi.com` / `gaode.com`, avoiding reliance on broad CN classification for `webapi.amap.com`.

<a id="v5433-pw1-2026-06-27"></a>

## v5.4.33-pw.1 (2026-06-27)

- ★ FEAT#169-AI-CODING: added AI coding-tool domain fallback to `02-ai-service.list`, the apply script and reference `.conf`.
- N/A: VPSDance had no sing-box `.srs` output at this revision, so the Passwall fallback did not use `rule-set:remote` directly.

<a id="v5432-pw1-2026-06-25"></a>

## v5.4.32-pw.1 (2026-06-25)

- ★ FIX#168-CN-GAME: reordered Passwall shunt creation so China games preceded international games/sites; completed domains for miHoYo, NetEase, WeGame, Perfect World, TapTap and other China-game services.
- `shunt-rules/21-cn-game.list` / `22-intl-game.list` remained same-source with Passwall2; moved `domain:mihoyo.com` from international games to China games.

<a id="v5431-pw1-2026-06-20"></a>

## v5.4.31-pw.1 (2026-06-20)

- ★ FIX#167-DOUYIN: added explicit `domain:` fallback for Douyin Web / `zjcdn.com` video-CDN traffic to `08-cn-media.list`, the apply script and reference `.conf`.
- Passwall fallback continued using flattened shunt rules rather than client-rule ordering; this revision only expanded China-streaming domain coverage.

<a id="v5430-pw1-2026-06-17"></a>

## v5.4.30-pw.1 (2026-06-17)

- ★ FEAT#166-GOOGLE: added `30-google.list` and the 20th `🔍 Google 服务` shunt rule for `geosite:google` / `geoip:google` / `domain:scholar.google.com`.
- Renamed the tools list to `31-tools.list`, retaining non-Google search and developer services; shifted fallback to `32-final.list`, increasing flattened shunt rules to 33.

<a id="v5429-pw1-2026-06-10"></a>

## v5.4.29-pw.1 (2026-06-10)

- N/A#165-LATENCY: Passwall fallback uses flattened shunt rules without regional auto-testing/health-check fields; only metadata and README aligned with Clash Party v5.4.29.

<a id="v5427-pw1-2026-06-07"></a>

## v5.4.27-pw.1 (2026-06-07)

- ★ CLEAN#165: removed local `domain:max.com` / `domain:hbomax.com` fallbacks from `11-hbo-max.list` and the apply script because `geosite:hbo` already covered them; both v2fly domain-list-community and MetaCubeX geosite hbo contained the domains at review time.

<a id="v5426-pw1-2026-06-07"></a>

## v5.4.26-pw.1 (2026-06-07)

- Aligned with v5.4.26 (FIX#164). This artifact was **unaffected** by `copilot.tencent.com` misclassification: Passwall AI shunting used `geosite:copilot`, not a copilot substring, and did not consume szkane `AiDomain.list`. The domain fell through to China-sites direct routing, so no `.list`/`.sh` change was needed; only the version increased.

<a id="v5425-pw2-2026-06-05"></a>

## v5.4.25-pw.2 (2026-06-05)

- ★ MAINT#HEADER-LITE: removed multi-version history from the apply-script header, retaining lightweight metadata and a link to `双内核系/Passwall/CHANGELOG.md`, matching repository CLAUDE.md §1.3.

<a id="v5425-pw1-2026-06-04"></a>

## v5.4.25-pw.1 (2026-06-04)

- ★ FIX#PW-KAKAO-P1: replaced invalid active Passwall `geosite:kakaotalk` with `geosite:kakao`, adding `domain:kakao.com` / `domain:kakaocorp.com` / `domain:kakaotalk.com` fallbacks.
- ★ FIX#PW-IDEMPOTENT-P3: made `--replace` the apply-script default, deleting same-name Smart-Config-Kit shunt rules before applying to avoid adding 32 duplicates on repeated runs; retained explicit `--append`.
- ★ SYNC: aligned version headers and reference `.conf` with Clash Party v5.4.25.

<a id="v5423-pw1-2026-06-02"></a>

## v5.4.23-pw.1 (2026-06-02)

- ★ FIX#161: added `domain:zhimg.com` / `domain:zhihu.co` to `27-cn-site.list` for direct shunting of Zhihu image-CDN/short links, matching the baseline.

<a id="v5422-pw1-2026-05-31"></a>

## v5.4.22-pw.1 (2026-05-31)

- ★ Added GeTui push-SDK domains `getui.com` / `getui.net` / `gepush.com` to `27-cn-site.list` after review. This extended #2's direct shunt; the recorded owner decision favored preserving application push traffic such as Mi Home.

- N/A#1 fine-grained QUIC: Passwall did not implement QUIC blocking, so #1 did not apply; its version followed the baseline.

<a id="v5421-pw1-2026-05-31"></a>

## v5.4.21-pw.1 (2026-05-31)

- N/A#4 DoH-over-IP bootstrap: Passwall shunt_rules contains no DNS resolver, so #4 did not apply; its version followed the baseline.

<a id="v5420-pw1-2026-05-30"></a>

## v5.4.20-pw.1 (2026-05-30)

- N/A#6 node-filter keywords (batch B): Passwall uses static shunt_rules without runtime classification/junk filtering. #6 did not apply; its version aligned with Clash Party v5.4.20.

<a id="v5419-pw1-2026-05-30"></a>

## v5.4.19-pw.1 (2026-05-30)

Proxy-override batch A, #2 China SDK/CDN direct precedence, following Clash Party v5.4.19; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`:

- Added to `27-cn-site.list` [Domain List]: `full:msg.umeng.com`, `domain:jpush.cn` / `jpush.io` for application push traffic (no jiguang/youmeng blocking source in Passwall, so no recorded conflict), and frontend-CDN domains `domain:baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com`; all used direct shunting.
- #3 fake-ip-filter and #5 direct-nameserver-follow-policy did not apply because Passwall shunt_rules contains neither fake-IP nor Mihomo DNS fields.
- 🔢 Version: v5.4.17-pw.1 → v5.4.19-pw.1; all artifacts skipped the discarded .18 release and aligned with v5.4.19.

<a id="v5417-pw1-2026-05-26"></a>

## v5.4.17-pw.1 (2026-05-26)

- N/A#DNS-SPLIT-BOOTSTRAP: Passwall shunt_rules contains routing rules only, not DNS-resolver configuration.
  - Aligned apply-script and reference `.conf` metadata with Clash Party v5.4.17.
  - DNS split-bootstrap remained a user-managed setting in Passwall node/global-DNS pages, according to the local environment.

<a id="v5416-pw1-2026-05-20"></a>

## v5.4.16-pw.1 (2026-05-20)

- ✅ FIX#149-P0: added `domain:paddle.com` to the financial-payments shunt rule.
  - Passwall does not consume anti-AD/DustinWin remote sources; its fallback reference assigned Paddle licensing/payment traffic to `🏦 金融支付`.

<a id="v5415-pw1-2026-05-20"></a>

## v5.4.15-pw.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER: synchronized v5.4.15 metadata and added GEOSITE coverage references.
- N/A#AD-FP-MODULE: Passwall shunt_rules is a fallback reference and does not consume Sukka phishing / blackmatrix7 MIUI remote sources; rule-list semantics remained at v5.4.14.

<a id="v5414-pw1-2026-05-20"></a>

## v5.4.14-pw.1 (2026-05-20)

- ✅ FIX#CF-R2-P0: explicitly added `domain:cloudflarestorage.com` to `29-intl-site.list`.
  - Passwall shunt_rules did not consume Sukka phishing, and its current `geosite:category-ads-all` did not match this domain; recorded as cross-client synchronization.
  - Aligned the version/baseline of `Passwall(xray+sing-box)-apply.sh` with Clash Party v5.4.14.

<a id="v5413-pw1-2026-05-19"></a>

## v5.4.13-pw.1 (2026-05-19)

- N/A#STUN-PORTS: Passwall shunt_rules uses domain/IP lists without a port-routing field this repository could safely write.
- META#BASELINE: aligned metadata with Clash Party v5.4.13; flattened domain/IP lists were unchanged.

<a id="v5412-pw1-2026-05-12"></a>

## v5.4.12-pw.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 baseline metadata after the Mihomo RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Passwall uses router-side shunt rules and LuCI DNS; no Mihomo fake-ip-filter rule is applicable.

<a id="v5411-pw1-2026-05-12"></a>

## v5.4.11-pw.1 (2026-05-12)

- ✅ FIX#RD-DOMAIN: added `domain:rustdesk.com` to collaboration shunting.
- ℹ️ PROCESS-NAME / DNS bootstrap did not apply: Passwall runs on an OpenWrt router and cannot see LAN-client process names; global DNS is managed through LuCI.

<a id="v549-pw1-2026-05-11"></a>

## v5.4.9-pw.1 (2026-05-11)

- ★ META#LOCAL-TOOLS: followed Clash Party v5.4.9. Because the router cannot observe LAN-client process names, PROCESS-NAME entries were not flattened into Passwall shunt rules.
- Service semantics in `shunt-rules/*.list` were unchanged; the direct-tool list was maintained only as a PC-client compatibility test set.

<a id="v548-pw1-2026-05-09"></a>

## v5.4.8-pw.1 (2026-05-09)

- ★ ORDER#RULE-TAIL: synchronized shunt-rule creation order with Clash Party v5.4.8.
  - LuCI shunt rules followed the revised middle/later service order.

<a id="v547-pw1-2026-05-09"></a>

## v5.4.7-pw.1 (2026-05-09)

- ★ FEAT#TikTok: removed `geosite:tiktok` from `06-social.list` and created independent `06b-tiktok.list` shunting.
- ★ FIX#HK: Passwall has no runtime node classification and was exempt under §1.4.

<a id="v546-pw1-2026-05-08"></a>

## v5.4.6-pw.1 (2026-05-08)

- ★ FEAT#145: WeChat CDN direct routing.
  - Added `domain:cdn.weixin.qq.com` to `shunt-rules/27-cn-site.list`, after bbys.app and before geosite:cn.
  - Followed v5.4.6 baseline.

<a id="v545-pw1-2026-05-07"></a>

## v5.4.5-pw.1 (2026-05-07)

- ★ Moved global nodes first and synchronized group ordering across products, following v5.4.5.

<a id="v544-pw1-2026-05-07"></a>

## v5.4.4-pw.1 (2026-05-07)

- ★ FIX#144: routed bbys.app video playback directly.
  - Added `domain:bbys.app` to `shunt-rules/27-cn-site.list`, before geosite:cn for earlier matching.
- ★ FEAT#143 (IEPL/IPLC residential classification) and FIX#142 (DNS cold start) concern Clash Party JS runtime behavior; static Passwall rules were exempt.
- Bump: `v5.4.0-pw.1` → `v5.4.4-pw.1`

<a id="v540-pw1-2026-05-05"></a>

## v5.4.0-pw.1 (2026-05-05)

- ★ FEAT#SG: added independent `🇸🇬 狮城节点` and `🏡 狮城家宽` groups.
  - Split Singapore into a separate region from `🌏 亚太节点`.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Followed Clash Party v5.4.0.
  - Note: SG/Singapore node-name changes did not apply because this path uses geosite routing, not node-name matching.

<a id="v530-pw3-2026-04-26"></a>

## v5.3.0-pw.3 (2026-04-26)

- ★ REFACTOR#2: changed streaming grouping from region-based to platform-based (7 → 13 groups).
  - Added independent Netflix / Disney+ / HBO/Max / Hulu / Prime Video groups.
  - Split global YouTube / music-streaming groups.
  - Retained Hong Kong / Taiwan / Japan-Korea / Europe regional streaming groups.
  - Added other-international-streaming fallback for long-tail platforms and former Southeast Asia streaming.
  - Service groups: 25 → 31; total groups: 43 → 49.
<a id="v5210-pw2-2026-04-26---跟随基线合并-4-组为-2-组"></a>

## v5.2.10-pw.2 (2026-04-26) — ★ Followed baseline consolidation of four groups into two

- ★ **Policy-group consolidation (baseline synchronization):** reduced 28 shunt rules to 25.
  - Merged `📧 邮件服务` + `☁️ 云与CDN` into `🌐 国外网站`, combining domain fields into `23-intl-site.list`.
  - Merged `🔍 搜索引擎` + `📟 开发者服务` into `🔧 工具与服务`, creating `24-tools.list`.
  - The historical recommended policy for `📥 下载更新` changed from `direct` to `proxy`.
- Changed files:
  - `Passwall(xray+sing-box)-apply.sh`: removed four old group blocks, added one group, renumbered 28→25 and set version `v5.2.10-pw.2`.
  - `Passwall(xray+sing-box).conf`: removed old group sections, added `[24] 工具与服务` and renumbered all entries.
  - `shunt-rules/*.list`: deleted `05-email.list` / `18-search.list` / `19-dev.list` / `23-cloud-cdn.list`; renamed the remaining 20 files under the new numbering; merged `27-intl-site.list` → `23-intl-site.list`, changed `22-download.list` → `19-download.list` with the policy update, and created `24-tools.list`.
- Updated README.md by removing four old group sections, adding `🔧 工具与服务`, renumbering sections and recording proxy as the downloads policy.
- Updated CHANGELOG with this entry.

<a id="v5210-pw1-2026-04-25--主版本追平fix39-平台例外"></a>

## v5.2.10-pw.1 (2026-04-25) — Aligned main version (FIX#39 platform exception)

- ★ **FIX#39 cross-client audit — platform exception (CLAUDE.md §1.4):** mainline moved `dns.google` /
  `cloudflare-dns.com` from `☁️ 云与CDN` to `🚫 受限网站`, but Passwall shunt rules
  had **no specialized entries for these domains**. They were covered by broader `geosite:google` in `18-search.list`
  and `geosite:cloudflare` in `23-cloud-cdn.list`.
  - Moving an individual domain into `26-gfw.list` would require an earlier specialized match in a list numbered below 18,
    because Passwall shunt rules use numeric-prefix order and the first match determines the route.
    That would require restructuring 18-search / 23-cloud-cdn coverage, **outside this minimal fix's scope**.
  - Classified as a platform-specific/limited-capability exception under §1.4; only the version was bumped to match the baseline.
- Only change: script-header `Version` comment `v5.2.8-pw.4` → `v5.2.10-pw.1`.
- The historical follow-up proposal was a separate PR to reorder `shunt-rules/` prefixes if requested, for example adding
  `19-gfw-priority.list` before Google/Cloudflare matches.

<a id="v528-pw4-2026-04-24---广告拦截规则置顶--applysh-路径加引号"></a>

## v5.2.8-pw.4 (2026-04-24) — ★ Moved ad blocking first and quoted the apply.sh path

Reviewed two Codex suggestions for `双内核系/Passwall/`; both were confirmed as actual issues and fixed together:

- ★ **FIX#CODEX-1 (P1, CLAUDE.md §3.4 violation):** moved `🛑 广告拦截` from the end (`#28`) to the beginning (`#01`), shifting the other 27 rules down by one.
  - Background: CLAUDE.md §3.4 required ad blocking first. The previous order, `[01] 🤖 AI 服务 … [28] 🛑 广告拦截`, directly contradicted that contract.
  - Runtime effect: `shunt_rules.lua` evaluates UCI lists top-down. Earlier matches before `🐟 漏网之鱼 FINAL` could prevent reaching ad blocking. This directory's FINAL had an empty domain_list and tcp/udp network fields and was not strictly catch-all, but ad blocking moved first to satisfy §3.4 and avoid ambiguity from future FINAL implementations.
  - Files updated together:
    - `Passwall(xray+sing-box)-apply.sh`: renumbered all 28 `# [NN]` blocks. Before `uci commit`, the status message changed from keeping #24–#28 last to placing ad blocking at #01 and keeping #25–#28 (China/restricted/international/FINAL) last.
    - `Passwall(xray+sing-box).conf`: renumbered 28 banner blocks and matching `slug    : NN-xxx` fields.
    - `shunt-rules/*.list`: renumbered all 28 filenames: `28-ads.list` → `01-ads.list`, `01-ai-service.list` → `02-ai-service.list`, …, `27-final.list` → `28-final.list`.
    - `README.md`: renumbered the 28 `### 1️⃣ … 2️⃣8️⃣` section headings, changed filename examples from `01-ai-service.list / 06-social.list` to `02-ai-service.list / 07-social.list`, and replaced the old 24–28 ordering note with ad blocking first and rules 25–28 last.
- ★ **FIX#CODEX-2 (P2, shell metacharacters):** changed every README invocation from `sh Passwall(xray+sing-box)-apply.sh` to `sh 'Passwall(xray+sing-box)-apply.sh'`. Unquoted shell-reserved `(` / `)` produced `syntax error near unexpected token '('`. Script-header usage at lines 20–23 already quoted the filename correctly; the README quick start was aligned with it.

<a id="同构审计按-claudemd-15"></a>

### Cross-client audit under CLAUDE.md §1.5

The runtime changes concerned **rule precedence/order**, outside the five listed node-classification/fallback/subscription-merge categories. Review nevertheless followed trigger 2, changing rule target groups, and trigger 3, changing order that affects match precedence, especially ad-block/GFW/FINAL relationships:

| Artifact | Ad-block rule position | Synchronized change needed? |
|------|------------------|--------------------------|
| Clash Party JS baseline | First in `rules:`, around line 3315: `RULE-SET, … , 🛑 广告拦截`, before all service rules | ✅ Already satisfied; baseline was correct |
| CMFA YAML | Same as JS baseline | ✅ Already satisfied |
| OpenClash Normal / Smart | Same; first Ruby-generated rules segment was ad-block | ✅ Already satisfied |
| Shadowrocket / Surge / Loon / Quantumult X | First `[Rule]` entry: `RULE-SET, … , 🛑 广告拦截 / REJECT` | ✅ Already satisfied |
| SingBox Full | First `route.rules` entry: `rule_set: [advertising, …]` | ✅ Already satisfied |
| v2rayN Xray | First `routing.rules` entry targeted `block` | ✅ Already satisfied |
| **Passwall, this directory** | Previously `#28`, last, **violating §3.4** | ✅ **Fixed to `#01` in this change** |
| **Passwall2** | Previously `#28`, last, **the same defect** | ✅ **Also fixed to `#01`**; see `双内核系/Passwall2/CHANGELOG.md` |

Conclusion: Passwall and Passwall2 shared this defect, classified under §1.5 category 5 (node filtering/rule order); both were fixed in this PR.

<a id="主动放弃的-codex-建议"></a>

### Codex recommendation deliberately not adopted

- Codex also proposed changing CMFA `https://1.12.12.12/dns-query` back to `https://doh.pub/dns-query` as a P1 issue in `Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml`. This change **was not adopted** because:
  - `1.12.12.12` was the common DNS baseline for seven artifacts: CMFA / OpenClash Normal / OpenClash Smart / Shadowrocket / Surge / Loon / Quantumult X, not a CMFA-only regression.
  - Changing CMFA alone would create a 7:1 inconsistency and violate §1 cross-artifact synchronization.
  - Any DNS change required a separate repository-wide PR rather than inclusion in the Passwall ad-block ordering fix.

<a id="v528-pw3-2026-04-24---版本号对齐-v528-基线"></a>

## v5.2.8-pw.3 (2026-04-24) — ★ Aligned with the v5.2.8 baseline

Aligned the version with Clash Party v5.2.8 without functional changes, for the following reasons:

| FIX# | Description | Passwall impact |
|------|------|--------------|
| #27 | Created `mirrors/` to silence classical-provider warnings | **N/A:** Passwall has no rule-provider mechanism; it uses static shunt_rules local domain/IP matching |
| #28 | Expanded APAC classification: HK/TW/JP/KR joined APAC; US joined AMERICAS | **N/A:** Passwall has no automatic runtime node classification, using user geosite/geoip and UCI node lists |
| #24–#26 | Node-name classification / fallback / subscription cleanup | **N/A:** Passwall has no proxy-group nesting or subscription preprocessing |

<a id="v526-pw2-2026-04-24---passwall-专属目录初版"></a>

## v5.2.6-pw.2 (2026-04-24) — ★ Initial dedicated Passwall directory

This PR created `双内核系/Passwall/` with 28 shunt-rule references for full-featured Passwall. It interoperated with `双内核系/Passwall2/` while documenting their different scopes.

<a id="新建内容"></a>

### Added contents

- ★ **Created `双内核系/Passwall/`**, containing:
  - `Passwall(xray+sing-box).conf`: a combined single-file reference for 28 rules.
  - `Passwall(xray+sing-box)-apply.sh`: a batch UCI script using `CONFIG_NAME="passwall"`.
  - `shunt-rules/01-ai-service.list` through `28-ads.list`: 28 individual `.list` files.
  - `README.md`: a Passwall-specific usage guide.
  - `CHANGELOG.md`: this file.

<a id="passwall-专有差异化"></a>

### Passwall-specific distinctions

- ★ **Selection guide:** added a Passwall/Passwall2 comparison table describing plugin differences.
- ★ **Four-list system:** documented `use_direct_list` / `use_proxy_list` / `use_block_list` / `use_gfw_list` and combining these four lists with shunt rules.
- ★ **Separate TCP/UDP node selection:** documented distinct `tcp_node` / `udp_node` selection, with historical examples including direct China-game UDP and BT DHT.
- ★ **ACL rules:** documented policy isolation by client IP/MAC.
- ★ **trojan-plus nodes:** documented Passwall-specific `trojan-plus` support, unavailable in Passwall2.
- ★ **apply.sh comments:** documented `tcp_node`; Passwall used `tcp_node`, while Passwall2 used unified `node`.
- ★ **Completion messages:** the script printed Passwall-specific configuration notes for four lists, TCP/UDP selection and ACL.

<a id="与-passwall2-的关系"></a>

### Relationship to Passwall2

- `.list` contents shared the same source as `双内核系/Passwall2/shunt-rules/`, with identical syntax and the shared `shunt_rules.lua` parser.
- `.sh` scripts differed only in `CONFIG_NAME` and field comments (`tcp_node` versus `node`).
- README scopes differed: Passwall covered four lists, ACL and TCP/UDP selection; Passwall2 covered its simpler shunt-only model.

<a id="对其他产物的联动评估按-claudemd-15-同构审计"></a>

### Cross-artifact assessment under CLAUDE.md §1.5

Adding `双内核系/Passwall/` introduced files only, without runtime logic, group-name, rule-provider or DNS changes. The other 10 artifacts were unaffected. Future `.list` content changes were required to stay synchronized between `双内核系/Passwall/` and `双内核系/Passwall2/`.

<a id="设计原则"></a>

### Design principles

- Rule syntax followed official `shunt_rules.lua` source, including `geosite:` / `domain:` / `geoip:` prefixes; Clash syntax was not accepted.
- Aligned 28 rules with Clash Party's 28 service groups, preserving semantics.
- Historical tail-order constraint: #24 China → #25 restricted → #26 international → #27 FINAL → #28 ads.
- Three delivery formats supported manual paste, single-file reference and batch SSH-script import.

<a id="根-readme--claudemd-同步后续-pr"></a>

### Root README and CLAUDE.md follow-up PR

- Add a `Passwall` entry to the CLAUDE.md §0 table.
- Add a `双内核系/Passwall/` reference to the root README directory description.

---

<a id="维护同步策略"></a>

## Maintenance synchronization policy

When Clash Party mainline changes rules/groups/services, such as adding/removing service groups or changing providers, `双内核系/Passwall/` and `双内核系/Passwall2/` require **joint synchronization**:

1. New service group: add a shunt-rule section and matching `.list` in both directories.
2. Removed service group: remove its section and `.list` in both directories.
3. New domain within a service group: update the corresponding `.list`, `.conf` and `.sh` in both directories.

**Exception:** pure Clash Party regional/LightGBM adjustments, such as `uselightgbm` tuning or Smart-group url-test intervals, **do not require synchronization** because Passwall cannot express them; see CLAUDE.md §1.4 platform exceptions.
