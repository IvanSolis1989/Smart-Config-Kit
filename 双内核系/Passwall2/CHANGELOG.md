<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Passwall / Passwall2 changelog" width="100%">
</picture>

<a id="passwall--passwall2--变更日志"></a>

# Passwall / Passwall2 — Changelog

> Changelog for `双内核系/Passwall2/`. The directory retains its historical name; its artifacts support both full-featured Passwall and simplified Passwall2 through their shared `shunt_rules.lua` parser and interoperable `.list` files.
> This directory provides 78 nonempty native fused shunt-rule fallbacks generated from `rulesets/generated/fused/sing-box/*.srs`.
> The main version follows Clash Party; the `-pw2.N` suffix increments independently.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Project README](../../README.md) · [Documentation index](../../docs/README.md)

<a id="v6021-pw212-2026-10-28"></a>

## v6.0.21-pw2.12 (2026-10-28)

- Moved Google FCM from download updates to Google services, preserving 15 domains, 26 IPv4 predicates, rule order and 55 policy groups. Other push services, DNS and fake-IP were unchanged. Users still select actual service targets in LuCI.

<a id="v6020-pw211-2026-10-24"></a>

## v6.0.20-pw2.11 (2026-10-24)

- Organized client directories by core family, retaining files/guides within client subdirectories. Rule semantics/fields were unchanged. Raw configuration URLs changed with paths, requiring reimport; shared `rulesets/` URLs remained unchanged.

<a id="v6020-pw210-2026-10-19"></a>

## v6.0.20-pw2.10 (2026-10-19)

- The official Xray backend filters SRS references, potentially broadening an SRS-only shunt into a network match. The generator checks every shunt node before any UCI write and accepts only sing-box. Read failure, Xray, unknown/missing backends or no shunt nodes all stop processing.
- Regenerated helper/conf from existing SRS, preserving URLs, order and contents of 78 rules. Documented removal of SRS before future backend switching and backend limits on manual imports. See the [verification report](../../docs/upstream/2026-10-19/singbox/report.md). Twenty-four real shell fixtures covered both variants' success/rejection branches; actual router acceptance remained pending.

<a id="v6020-pw29-2026-10-16"></a>

## v6.0.20-pw2.9 (2026-10-16)

- Issue #187: added exact DIRECT exceptions in existing `scki-adfp-direct` for `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, `hkshort.weixin.qq.com`, preventing WeChat connection endpoints from matching ads first.
- No parent/subdomain expansion; `ad.weixin.qq.com` and `log.weixin.qq.com` remained rejected. Other policies and ordering were unchanged.
- Continued consuming fused assets through the existing generator with native platform syntax; generated files were not hand-edited.
- See [WeChat review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence and bounded static acceptance. Reporter-device recovery still required retesting.

<a id="v6019-pw28-2026-10-15"></a>

## v6.0.19-pw2.8 (2026-10-15)

- FIX#186: unified repository-owned remote assets on GitHub raw HTTPS to avoid jsDelivr repository-size limits, preserving version queries and native formats.
- Reused verified fused payloads; content, ordering and policies were unchanged. Added raw/CDN-reference regressions. See [delivery guidance](../../docs/rule-asset-delivery.md) for cause, download prerequisites and official fields.

<a id="v6018-pw27-2026-10-14"></a>

## v6.0.18-pw2.7 (2026-10-14)

- Fixed cross-service first-match misclassification: narrowed broad Apple/Microsoft keywords and shared AWS/Azure/CDN suffixes, adding eight guard classes: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social, bytedance-app. Six ADFP records for exact CA revocation/status hosts via DIRECT and exact Microsoft international-mail policy brought the total to 35. `api.byteoversea.com` was an exact TikTok rule, not a shared-suffix expansion. Existing Claude Desktop `a-api`/`a-cdn` exceptions, QUIC/latency options and default-off ZeroTier proxy remained. Crisp relay was a static ASN-overlap risk inference, not a measured incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 nonempty SRS across 81 segments.

<a id="v6017-pw26-2026-10-13"></a>

## v6.0.17-pw2.6 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to `scki-adfp-ai` for Claude Desktop application-code/user-content loading through AI policy. Based on [official requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Existing rule sets/native syntax remained. Source-semantic gates, 29 ADFP checks, Claude stage inventory and file-level release-batch checks joined the publication chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device reproduction or measurement occurred.

<a id="v6016-pw26-2026-10-12"></a>

## v6.0.16-pw2.6 (2026-10-12)

- Following v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional ADFP validation. Conversion format, order and target policies remained; no runtime rules were added. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording only observable bytes and conversion receipts. Original remote-input SHA values cannot be reconstructed from old outputs; no claim of complete historical provenance or real-device traffic measurement was made.

<a id="v6015-pw26-2026-10-07"></a>

## v6.0.15-pw2.6 (2026-10-07)

- Synchronized shunt rules with non-China UDP/443 policy selection; this artifact does not manage node latency testing.
- See [latency and QUIC options](../../docs/traffic-options.md) for switching commands, capabilities and verification.

<a id="v6014-pw25-2026-09-29"></a>

## v6.0.14-pw2.5 (2026-09-29)

- SYNC: added two exact WeChat HTTPDNS domains to fused SRS shunt rule 001, retaining China-sites direct semantics.
- VERIFY: continued publishing 69 nonempty shunt rules, updating remote-asset cache keys to `v6.0.14`.

<a id="v6013-pw24-2026-09-03"></a>

## v6.0.13-pw2.4 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE: added suffix `linuxdo.org` to fused SRS shunt rule 013 with its existing China-sites direct semantics; `linux.do` retained proxy semantics in rule 059.
- SYNC: continued publishing 69 nonempty shunt rules, updating release cache keys to `v6.0.13`.

<a id="v6012-pw23-2026-09-01"></a>

## v6.0.12-pw2.3 (2026-09-01)

- FIX#181-PC: rebuilt the initial fused SRS shunt rule so `login.nvidia.cn` received early `direct` handling; other NVIDIA domains retained downloads-group semantics.
- SYNC: continued publishing 69 nonempty shunt rules, updating release cache keys to `v6.0.12`.

<a id="v6011-pw22-2026-08-22"></a>

## v6.0.11-pw2.2 (2026-08-22)

- Rebuilt 69 fused SRS shunt rules from the final manifest. Gemini and Accademia Gemini segments adopted Google semantics; szkane AI and its order were unchanged.

<a id="v6010-pw22-2026-08-08"></a>

## v6.0.10-pw2.2 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: rebuilt the initial fused SRS shunt rule, fixing two NetEase game-service hosts to `direct` before the China-games shunt rule.

<a id="v609-pw21-2026-07-19"></a>

## v6.0.9-pw2.1 (2026-07-19)

- Rebuilt 66 fused shunt rules; as in Passwall, router requests without process identity used the generic GitHub API tools-group segment.

<a id="v608-pw21-2026-07-15"></a>

## v6.0.8-pw2.1 (2026-07-15)

- Synchronized China-authority precedence across 65 fused shunt rules, with release-version cache keys for remote `.srs`.

<a id="v607-pw21-2026-07-14"></a>

## v6.0.7-pw2.1 (2026-07-14)

- FIX#176: regenerated 65 fused SRS shunt rules, keeping China-domain precedence over generic international CDN / GeoIP fallback in both Passwall2 and Passwall.

<a id="v606-pw21-2026-07-14"></a>

## v6.0.6-pw2.1 (2026-07-14)

- SYNC: rebuilt fused SRS shunt rules with v6.0.6. A Passwall2 router cannot observe LAN-client `WorkPro.exe` / `WorkProWebProcess.exe`, so process-level matching was not promised.

<a id="v605-pw21-2026-07-14"></a>

## v6.0.5-pw2.1 (2026-07-14)

- PLATFORM: rebuilt fused SRS shunt rules. A Passwall2 router cannot observe LAN-client WorkPro.exe, so process-level matching was not promised.

<a id="v604-pw21-2026-07-13"></a>

## v6.0.4-pw2.1 (2026-07-13)

- DIRECT-ITWDB: rebuilt the default direct shunt rule from `scki-fused-008-direct.srs`; `itwdb.com` and WorkPro subdomains retained native Passwall2 rule semantics.

<a id="v603-pw21-2026-07-12"></a>

## v6.0.3-pw2.1 (2026-07-12)

- SYNC: regenerated 65 nonempty `rule-set:remote` shunt rules, apply script and reference configuration from the v6.0.3 fused sing-box target.
- AI-PRECEDENCE: the added AI telemetry guard retained precedence before ad rules and international-sites fallback; every shunt URL referenced only repository fused `.srs`.

<a id="v602-pw21-2026-07-10"></a>

## v6.0.2-pw2.1 (2026-07-10)

- SYNC: regenerated 64 nonempty `rule-set:remote` shunt rules, apply script and reference configuration from the v6.0.2 fused sing-box target.
- PERF: 64 `.srs` totaled approximately 4.06 MiB, inheriting target GEOIP/ASN materialization and global exact deduplication. Domain/IP dual-list flags followed final SRS IP contents, with no direct upstream rule-set calls.

<a id="v601-pw21-2026-07-10"></a>

## v6.0.1-pw2.1 (2026-07-10)

- SYNC: regenerated the apply script, reference configuration and 68 shunt rules from fused sing-box JSON, advancing the baseline to Clash Party v6.0.1.
- DELIVERY: Passwall2 retained native `rule-set:remote` `.srs` fallback; mobile text sharding for Issue #174 did not change its 68 shunt mappings or policy semantics.

<a id="v600-pw22-2026-07-09"></a>

## v6.0.0-pw2.2 (2026-07-09)

- FUSED-PASSWALL2: `tools/generate-fused-fallback-artifacts.js` began generating `Passwall2(xray+sing-box)-apply.sh`, reference `.conf` and `shunt-rules/*.list`.
- SCOPE: each shunt rule referenced its corresponding remote `rulesets/generated/fused/sing-box/*.srs`. Removed all 33 old handwritten flattened domain/IP lists while preserving same-source `.list` interoperability with Passwall.

<a id="v600-pw21-2026-07-09"></a>

## v6.0.0-pw2.1 (2026-07-09)

- META: updated version metadata with Clash Party v6.0.0.
- SCOPE: Passwall2 remained a flattened shunt_rules fallback reference; fused mainline rule sets were not generated back from Passwall2.

<a id="v5439-pw21-2026-07-09"></a>

## v5.4.39-pw2.1 (2026-07-09)

- META: updated version metadata with Clash Party v5.4.39.
- N/A: flattened Passwall2 shunt rules do not consume Mihomo `.mrs` providers; `.list` semantics continued from v5.4.38-pw2.1.

<a id="v5438-pw21-2026-07-09"></a>

## v5.4.38-pw2.1 (2026-07-09)

- META: updated version metadata with Clash Party v5.4.38.
- SCOPE: flattened Passwall2 shunt rules retained local `.list` structure without direct references to public supplemental URLs.

<a id="v5437-pw21-2026-06-29"></a>

## v5.4.37-pw2.1 (2026-06-29)

- META#170-DNS-POLICY: updated version metadata with Clash Party v5.4.37.
- N/A: flattened Passwall2 shunt rules do not contain Mihomo `nameserver-policy` DNS fields; `.list` semantics were unchanged.

<a id="v5436-pw21-2026-06-29"></a>

## v5.4.36-pw2.1 (2026-06-29)

- CLEAN#171-DIRECT: followed Clash Party v5.4.36 cleanup by removing flattened `channel4.com` / `sky.com` rules. Other candidates did not apply to Passwall2's flattened layer or still needed retention.
- Synchronized version metadata; the shunt-rule count decreased accordingly.

<a id="v5435-pw21-2026-06-28"></a>

## v5.4.35-pw2.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM: updated version metadata against Clash Party v5.4.35.
- N/A: Passwall2's flattened fallback does not consume Mihomo providers. `domain:encoretvb.com` remained static Hong Kong-streaming coverage; semantics of 33 shunt rules were unchanged.

<a id="v5434-pw21-2026-06-28"></a>

## v5.4.34-pw2.1 (2026-06-28)

- ★ FIX#169-AMAP: added direct fallback for AMap core domains to `27-cn-site.list`, the apply script and reference `.conf`.
- Covered `a-map.cn` / `amap.com` / `amapauto.com` / `anav.com` / `autonavi.com` / `gaode.com`, avoiding reliance on broad CN classification for `webapi.amap.com`.

<a id="v5433-pw21-2026-06-27"></a>

## v5.4.33-pw2.1 (2026-06-27)

- ★ FEAT#169-AI-CODING: added AI coding-tool domain fallback to `02-ai-service.list`, the apply script and reference `.conf`.
- N/A: VPSDance had no sing-box `.srs` output at this revision, so the Passwall2 fallback did not use `rule-set:remote` directly.

<a id="v5432-pw21-2026-06-25"></a>

## v5.4.32-pw2.1 (2026-06-25)

- ★ FIX#168-CN-GAME: reordered Passwall2 shunt creation so China games preceded international games/sites; completed domains for miHoYo, NetEase, WeGame, Perfect World, TapTap and other China-game services.
- `shunt-rules/21-cn-game.list` / `22-intl-game.list` remained same-source with Passwall; moved `domain:mihoyo.com` from international games to China games.

<a id="v5431-pw21-2026-06-20"></a>

## v5.4.31-pw2.1 (2026-06-20)

- ★ FIX#167-DOUYIN: added explicit `domain:` fallback for Douyin Web / `zjcdn.com` video-CDN traffic to `08-cn-media.list`, the apply script and reference `.conf`.
- Maintained interoperable `.list` rule contents with Passwall.

<a id="v5430-pw21-2026-06-17"></a>

## v5.4.30-pw2.1 (2026-06-17)

- ★ FEAT#166-GOOGLE: added `30-google.list` and the 20th `🔍 Google 服务` shunt rule for `geosite:google` / `geoip:google` / `domain:scholar.google.com`.
- Renamed the tools list to `31-tools.list`, retaining non-Google search and developer services; shifted fallback to `32-final.list`, increasing flattened shunt rules to 33.

<a id="v5429-pw21-2026-06-10"></a>

## v5.4.29-pw2.1 (2026-06-10)

- N/A#165-LATENCY: Passwall2 fallback uses flattened shunt rules without regional auto-testing/health-check fields; only metadata and README aligned with Clash Party v5.4.29.

<a id="v5427-pw21-2026-06-07"></a>

## v5.4.27-pw2.1 (2026-06-07)

- ★ CLEAN#165: removed local `domain:max.com` / `domain:hbomax.com` fallbacks from `11-hbo-max.list` and the apply script because `geosite:hbo` already covered them, retaining `.list` interoperability with Passwall.

<a id="v5426-pw21-2026-06-07"></a>

## v5.4.26-pw2.1 (2026-06-07)

- Aligned with v5.4.26 (FIX#164). This artifact was **unaffected** by `copilot.tencent.com` misclassification: Passwall2 AI shunting used `geosite:copilot`, not a copilot substring, and did not consume szkane `AiDomain.list`. The domain fell through to China-sites direct rules, so no `.list`/`.sh` change was needed; only the version increased.

<a id="v5425-pw22-2026-06-05"></a>

## v5.4.25-pw2.2 (2026-06-05)

- ★ MAINT#HEADER-LITE: removed multi-version history from the apply-script header, retaining lightweight metadata and a link to `双内核系/Passwall2/CHANGELOG.md`, matching repository CLAUDE.md §1.3.

<a id="v5425-pw21-2026-06-04"></a>

## v5.4.25-pw2.1 (2026-06-04)

- ★ FIX#PW2-IDEMPOTENT-P3: made `--replace` the apply-script default, deleting same-name Smart-Config-Kit shunt rules first to avoid adding 32 duplicates on repeated runs; retained explicit `--append`.
- ★ SYNC: aligned version headers and reference `.conf` with Clash Party v5.4.25; `.list` rules retained the same source as Passwall.

<a id="v5423-pw21-2026-06-02"></a>

## v5.4.23-pw2.1 (2026-06-02)

- ★ FIX#161: added `domain:zhimg.com` / `domain:zhihu.co` to `27-cn-site.list` for direct shunting of Zhihu image-CDN/short links, matching the baseline.

<a id="v5422-pw21-2026-05-31"></a>

## v5.4.22-pw2.1 (2026-05-31)

- ★ Added GeTui push-SDK domains `getui.com` / `getui.net` / `gepush.com` to `27-cn-site.list` after review. This extended #2's direct shunt; the recorded owner decision favored preserving application push traffic such as Mi Home.

- N/A#1 fine-grained QUIC: Passwall2 did not implement QUIC blocking, so #1 did not apply; its version followed the baseline.

<a id="v5421-pw21-2026-05-31"></a>

## v5.4.21-pw2.1 (2026-05-31)

- N/A#4 DoH-over-IP bootstrap: Passwall2 shunt_rules contains no DNS resolver, so #4 did not apply; its version followed the baseline.

<a id="v5420-pw21-2026-05-30"></a>

## v5.4.20-pw2.1 (2026-05-30)

- N/A#6 node-filter keywords (batch B): Passwall2 uses static shunt_rules without runtime classification/junk filtering. #6 did not apply; its version aligned with Clash Party v5.4.20.

<a id="v5419-pw21-2026-05-30"></a>

## v5.4.19-pw2.1 (2026-05-30)

Proxy-override batch A, #2 China SDK/CDN direct precedence, following Clash Party v5.4.19; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`:

- Added to `27-cn-site.list` [Domain List]: `full:msg.umeng.com`, `domain:jpush.cn` / `jpush.io` for application push traffic (no jiguang/youmeng blocking source in Passwall2, so no recorded conflict), and frontend-CDN domains `domain:baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com`; all used direct shunting.
- #3 fake-ip-filter and #5 direct-nameserver-follow-policy did not apply because Passwall2 shunt_rules contains neither fake-IP nor Mihomo DNS fields.
- 🔢 Version: v5.4.17-pw2.1 → v5.4.19-pw2.1; all artifacts skipped discarded .18 and aligned with v5.4.19.

<a id="v5417-pw21-2026-05-26"></a>

## v5.4.17-pw2.1 (2026-05-26)

- N/A#DNS-SPLIT-BOOTSTRAP: Passwall2 shunt_rules contains routing rules only, not DNS-resolver configuration.
  - Aligned apply-script and reference `.conf` metadata with Clash Party v5.4.17.
  - DNS split-bootstrap remained a user-managed setting in Passwall2 node/global-DNS pages, according to the local environment.

<a id="v5416-pw21-2026-05-20"></a>

## v5.4.16-pw2.1 (2026-05-20)

- ✅ FIX#149-P0: added `domain:paddle.com` to the financial-payments shunt rule.
  - Passwall2 does not consume anti-AD/DustinWin remote sources; its fallback reference assigned Paddle licensing/payment traffic to `🏦 金融支付`.

<a id="v5415-pw21-2026-05-20"></a>

## v5.4.15-pw2.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER: synchronized v5.4.15 metadata and added GEOSITE coverage references.
- N/A#AD-FP-MODULE: Passwall2 shunt_rules is a fallback reference and does not consume Sukka phishing / blackmatrix7 MIUI remote sources; rule-list semantics remained at v5.4.14.

<a id="v5414-pw21-2026-05-20"></a>

## v5.4.14-pw2.1 (2026-05-20)

- ✅ FIX#CF-R2-P0: explicitly added `domain:cloudflarestorage.com` to `29-intl-site.list`.
  - Passwall2 shunt_rules did not consume Sukka phishing, and its current `geosite:category-ads-all` did not match this domain; recorded as cross-client synchronization.
  - Aligned the version/baseline of `Passwall2(xray+sing-box)-apply.sh` with Clash Party v5.4.14.

<a id="v5413-pw21-2026-05-19"></a>

## v5.4.13-pw2.1 (2026-05-19)

- N/A#STUN-PORTS: Passwall2 shunt_rules uses domain/IP lists without a port-routing field this repository could safely write.
- META#BASELINE: aligned metadata with Clash Party v5.4.13; flattened domain/IP lists were unchanged.

<a id="v5412-pw21-2026-05-12"></a>

## v5.4.12-pw2.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 baseline metadata after the Mihomo RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Passwall2 uses router-side shunt rules and LuCI DNS; no Mihomo fake-ip-filter rule is applicable.

<a id="v5411-pw21-2026-05-12"></a>

## v5.4.11-pw2.1 (2026-05-12)

- ✅ FIX#RD-DOMAIN: added `domain:rustdesk.com` to collaboration shunting.
- ℹ️ PROCESS-NAME / DNS bootstrap did not apply: Passwall2 runs on an OpenWrt router and cannot see LAN-client process names; global DNS is managed through LuCI.

<a id="v549-pw21-2026-05-11"></a>

## v5.4.9-pw2.1 (2026-05-11)

- ★ META#LOCAL-TOOLS: followed Clash Party v5.4.9. Because the router cannot observe LAN-client process names, PROCESS-NAME entries were not flattened into Passwall2 shunt rules.
- Service semantics in `shunt-rules/*.list` were unchanged; the direct-tool list was maintained only as a PC-client compatibility test set.

<a id="v548-pw21-2026-05-09"></a>

## v5.4.8-pw2.1 (2026-05-09)

- ★ ORDER#RULE-TAIL: synchronized shunt-rule creation order with Clash Party v5.4.8.
  - LuCI shunt rules followed the revised middle/later service order.

<a id="v547-pw21-2026-05-09"></a>

## v5.4.7-pw2.1 (2026-05-09)

- ★ FEAT#TikTok: removed `geosite:tiktok` from `06-social.list` and created independent `06b-tiktok.list` shunting.
- ★ FIX#HK: Passwall2 has no runtime node classification and was exempt under §1.4.

<a id="v546-pw21-2026-05-08"></a>

## v5.4.6-pw2.1 (2026-05-08)

- ★ FEAT#145: WeChat CDN direct routing.
  - Added `domain:cdn.weixin.qq.com` to `shunt-rules/27-cn-site.list`, after bbys.app and before geosite:cn.
  - Followed v5.4.6 baseline.

<a id="v545-pw21-2026-05-07"></a>

## v5.4.5-pw2.1 (2026-05-07)

- ★ Moved global nodes first and synchronized group ordering across products, following v5.4.5.

<a id="v544-pw21-2026-05-07"></a>

## v5.4.4-pw2.1 (2026-05-07)

- ★ FIX#144: routed bbys.app video playback directly.
  - Added `domain:bbys.app` to `shunt-rules/27-cn-site.list`, before geosite:cn for earlier matching.
- ★ FEAT#143 (IEPL/IPLC residential classification) and FIX#142 (DNS cold start) concern Clash Party JS runtime behavior; static Passwall2 rules were exempt.
- Bump: `v5.4.0-pw2.1` → `v5.4.4-pw2.1`

<a id="v540-pw21-2026-05-05"></a>

## v5.4.0-pw2.1 (2026-05-05)

- ★ FEAT#SG: added independent `🇸🇬 狮城节点` and `🏡 狮城家宽` groups.
  - Split Singapore into a separate region from `🌏 亚太节点`.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Followed Clash Party v5.4.0.
  - Note: SG/Singapore node-name changes did not apply because this path uses geosite routing, not node-name matching.

<a id="v530-pw24-2026-04-26"></a>

## v5.3.0-pw2.4 (2026-04-26)

- ★ FIX: corrected line-five comments in eight streaming `.list` files, 09–16, from "Passwall LuCI" to "Passwall2 LuCI".
  - Affected files: 09-netflix / 10-disney-plus / 11-hbo-max / 12-hulu / 13-prime-video / 14-youtube / 15-music-streaming / 16-other-streaming.

<a id="v530-pw23-2026-04-26"></a>

## v5.3.0-pw2.3 (2026-04-26)

- ★ REFACTOR#2: changed streaming grouping from region-based to platform-based (7 → 13 groups).
  - Added independent Netflix / Disney+ / HBO/Max / Hulu / Prime Video groups.
  - Split global YouTube / music-streaming groups.
  - Retained Hong Kong / Taiwan / Japan-Korea / Europe regional streaming groups.
  - Added other-international-streaming fallback for long-tail platforms and former Southeast Asia streaming.
  - Service groups: 25 → 31; total groups: 43 → 49.
<a id="v5210-pw22-2026-04-26---跟随基线合并-4-组为-2-组"></a>

## v5.2.10-pw2.2 (2026-04-26) — ★ Followed baseline consolidation of four groups into two

- ★ **Policy-group consolidation (baseline synchronization):** equivalent to `双内核系/Passwall/v5.2.10-pw.2`, reducing 28 shunt rules to 25.
  - Merged `📧 邮件服务` + `☁️ 云与CDN` into `🌐 国外网站`, combining domain fields into `23-intl-site.list`.
  - Merged `🔍 搜索引擎` + `📟 开发者服务` into `🔧 工具与服务`, creating `24-tools.list`.
  - The historical recommended policy for `📥 下载更新` changed from `direct` to `proxy`.
- Changed files:
  - `Passwall2(xray+sing-box)-apply.sh`: removed four old group blocks, added one group, renumbered 28→25 and set version `v5.2.10-pw2.2`.
  - `Passwall2(xray+sing-box).conf`: removed old group sections, added `[24] 工具与服务` and renumbered all entries.
  - `shunt-rules/*.list`: deleted `05-email.list` / `18-search.list` / `19-dev.list` / `23-cloud-cdn.list`; renamed the remaining 20 files under the new numbering; merged `27-intl-site.list` → `23-intl-site.list`, changed `22-download.list` → `19-download.list` with the policy update, and created `24-tools.list`.
- Updated README.md accordingly.
- Updated CHANGELOG with this entry.

<a id="v5210-pw21-2026-04-25--主版本追平fix39-平台例外"></a>

## v5.2.10-pw2.1 (2026-04-25) — Aligned main version (FIX#39 platform exception)

- ★ **FIX#39 cross-client audit — platform exception (CLAUDE.md §1.4):** the same reason as `双内核系/Passwall/v5.2.10-pw.1`.
  Passwall2 shares Passwall's `.list` sources and likewise has no specialized entries for `dns.google` /
  `cloudflare-dns.com`, which broader `geosite:google` / `geosite:cloudflare` categories cover.
  Applied the §1.4 exception and only aligned the version. See the matching section in `双内核系/Passwall/CHANGELOG.md`.
- Only change: script-header `Version` comment `v5.2.9-pw2.1` → `v5.2.10-pw2.1`.

<a id="v528-pw24-2026-04-24---广告拦截规则置顶--applysh-路径加引号"></a>

## v5.2.8-pw2.4 (2026-04-24) — ★ Moved ad blocking first and quoted the apply.sh path

Equivalent to the defect fix in `双内核系/Passwall/v5.2.8-pw.4`, synchronizing both artifacts under CLAUDE.md §1.5. See that version in `双内核系/Passwall/CHANGELOG.md` for rationale; this section lists the changed files.

- ★ **FIX#CODEX-1 (P1, CLAUDE.md §3.4 violation):** moved `🛑 广告拦截` from last (`#28`) to first (`#01`), shifting the other 27 rules down by one.
  - `Passwall2(xray+sing-box)-apply.sh`: renumbered all 28 `# [NN]` blocks and updated completion messages.
  - `Passwall2(xray+sing-box).conf`: renumbered 28 banner blocks and matching `slug    : NN-xxx` fields.
  - `shunt-rules/*.list`: renumbered filenames: `28-ads.list` → `01-ads.list`, `01-ai-service.list` → `02-ai-service.list`, …, `27-final.list` → `28-final.list`.
  - `README.md`: renumbered 28 `### <keycap>` headings, changed filename examples from `01-ai-service.list / 06-social.list` to `02-ai-service.list / 07-social.list`, and documented ad blocking first with rules 25–28 (China/restricted/international/FINAL) last.
- ★ **FIX#CODEX-2 (P2, shell metacharacters):** quoted the README invocation as `sh 'Passwall2(xray+sing-box)-apply.sh'` instead of `sh Passwall2(xray+sing-box)-apply.sh`. Script-header usage at lines 20–23 already used the correct form; the README was aligned with it.

<a id="同构审计结论按-claudemd-15"></a>

### Cross-client audit conclusion under CLAUDE.md §1.5

This fix concerned rule target groups and match precedence, particularly ad-block/FINAL ordering. The audit matrix is in the matching `双内核系/Passwall/CHANGELOG.md` section. **Ad blocking was already first in the other nine artifacts**; only Passwall and Passwall2 shared the defect, and both were fixed in this PR.

<a id="放弃-codex-dns-建议"></a>

### Codex DNS recommendation not adopted

Codex's other P1 suggestion, reverting `CMFA(mihomo).yaml` from `1.12.12.12` to `doh.pub`, **was not adopted**. `1.12.12.12` was the common DNS baseline for seven artifacts (CMFA / OC Normal / OC Smart / SR / Surge / Loon / QX); changing CMFA alone would violate §1 consistency. Any repository-wide return to `doh.pub` required a separate synchronized PR.

<a id="v528-pw23-2026-04-24---版本号对齐-v528-基线"></a>

## v5.2.8-pw2.3 (2026-04-24) — ★ Aligned with the v5.2.8 baseline

Aligned the version with Clash Party v5.2.8 without functional changes, for the same cross-client N/A reasons as Passwall `v5.2.8-pw.3`.

<a id="v526-pw22-2026-04-23---致命-bug-修复--定位纠正"></a>

## v5.2.6-pw2.2 (2026-04-23) — ★ Critical bug fixes and corrected product positioning

This PR fixed two user-reported errors after reviewing the official Passwall / Passwall2 repositories in `Openwrt-Passwall` and `shunt_rules.lua` source.

<a id="fixp2-01致命分流规则语法完全错误"></a>

### FIX#P2-01 (critical): incorrect shunt-rule syntax

- **Problem:** the initial version used the `domain-suffix:xxx` prefix from Clash/Shadowrocket syntax. Passwall / Passwall2 `shunt_rules.lua` does **not recognize** it, so LuCI treated `domain-suffix:v0.dev` as a literal substring rather than a domain suffix, producing **no matches** for actual domains in the reported case.
- **Fix:** replaced `domain-suffix:` with `domain:` throughout, providing subdomain matching equivalent to Clash `DOMAIN-SUFFIX`:
  - Approximately 94 lines across 28 `shunt-rules/*.list` files.
  - 96 occurrences in `README.md`.
  - 94 occurrences in `Passwall2(xray+sing-box).conf`.
  - 94 occurrences in `Passwall2(xray+sing-box)-apply.sh`.
  - **Approximately 378 occurrences total.**
- **Added a complete eight-prefix syntax table to README**, with a warning against using Clash `DOMAIN-SUFFIX,` / `DOMAIN-KEYWORD,` / `DOMAIN,` / `IP-CIDR,` prefixes.
- **Authoritative source:** https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua

<a id="fixp2-02定位关系说反"></a>

### FIX#P2-02: incorrect relationship between products

- **Problem:** the initial README called Passwall the old version and Passwall2 the newer/downgraded version, incorrectly implying linear succession.
- **Official facts recorded at review time:** both were actively released in 2025–2026 and maintained **in parallel** by [`Openwrt-Passwall`](https://github.com/Openwrt-Passwall). Former `xiaorouji` repositories moved around 2025, with old `github.com/xiaorouji/openwrt-passwall*` URLs redirecting via 301. Passwall's latest was `26.4.15-1` (2026-04-15), Passwall2's `26.4.20-1` (2026-04-19), four days apart. [Discussion #555](https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555) described Passwall2 as an Xray/sing-box UI that removed direct/block/GFW lists and retained keyword/domain/geosite/geoip shunting.
- **Fixes:**
  - Rewrote the README introduction to describe full-featured Passwall and simplified-shunting Passwall2 as parallel projects with shared rule syntax.
  - Replaced the warning about different old Passwall syntax with an explanation of Passwall/Passwall2 confusion.
  - Removed the downgraded-version wording and explained architectural differences: neither has nested groups or Mihomo.
  - Updated reference links to `Openwrt-Passwall`, adding `shunt_rules.lua` source and Discussion #555.

<a id="附带修正"></a>

### Additional corrections

- **Ownership clarification after a second user report:** Passwall/Passwall2 had already moved from `xiaorouji` to [`Openwrt-Passwall`](https://github.com/Openwrt-Passwall), with old URLs returning 301. Corrected two remaining omissions:
  - Changed the root `README.md:407` acknowledgement link from `github.com/xiaorouji/openwrt-passwall2` to `github.com/Openwrt-Passwall/openwrt-passwall2`.
  - Replaced wording that credited current maintenance to xiaorouji in README / CHANGELOG / CLAUDE.md / Passwall2(xray+sing-box)-apply.sh with maintenance by `Openwrt-Passwall`, following migration from `xiaorouji`.
- Removed comments presenting iceeeder / xiaorouter community forks as the maintenance context; the record identified `Openwrt-Passwall` as the maintained upstream instead of personal forks.
- Added a comment to `Passwall2(xray+sing-box)-apply.sh` documenting reuse with Passwall by setting `CONFIG_NAME` to `passwall`.
- Header version: `v5.2.5-pw2.1` → `v5.2.6-pw2.2`, aligned with Clash Party v5.2.6.

<a id="对其他产物的联动评估按-claudemd-15-同构审计"></a>

### Cross-artifact assessment under CLAUDE.md §1.5

This change affected only Passwall/Passwall2 shunt syntax under `双内核系/Passwall/`. It did **not involve any of §1.5's five runtime behaviors**: static shunt rules have no node-name classification, fallback chains, subscription merging, proxy-provider filters or node filtering. The other nine artifacts, Clash Party / CMFA / OpenClash / Shadowrocket / Surge / Loon / QX / SingBox / v2rayN, were unaffected.

<a id="根-readme--claudemd-同步"></a>

### Root README and CLAUDE.md synchronization

- Rewrote CLAUDE.md §0's Passwall/Passwall2 paragraph, removing the implication that Passwall2 is merely a reduced version and describing parallel maintenance/shared syntax instead.
- Synchronized Passwall descriptions in root README lines L386 / L389.

---

<a id="v525-pw21-2026-04-20--初版"></a>

## v5.2.5-pw2.1 (2026-04-20) — Initial version

- ★ Initial version: manually flattened Clash Party v5.2.5 into Passwall2 shunt-rule format.
- ★ **Three delivery formats:**
  - `shunt-rules/01-ai-service.list` through `28-ads.list`: 28 separate files with domain lists and IP-list comments for individual LuCI copy/paste.
  - `Passwall2(xray+sing-box).conf`: one combined reference showing all 28 rules.
  - `Passwall2(xray+sing-box)-apply.sh`: batch UCI script. The initial instructions used `scp` and the unquoted `sh Passwall2(xray+sing-box)-apply.sh` to create 28 rules without target nodes, followed by node selection in LuCI. Later entries record the quoting correction.
- ★ Twenty-eight shunt rules covered 28 service categories; each included:
  - Historical regional-node suggestions corresponding to Clash Party's nine regional groups for manual Passwall2 balancing-group setup.
  - A domain list, primarily `geosite:xxx` with `domain-suffix:xxx` additions at this initial revision.
  - Optional IP lists using `geoip:xxx`.
- ★ Recorded rule-order constraints:
  - Ad blocking had highest intended priority, through the Passwall2 switch or a shunt target of block.
  - China sites (`geosite:cn` + `geoip:cn`) were fifth from last.
  - Restricted sites (`geosite:gfw`) were fourth from last.
  - International sites (`geosite:geolocation-!cn`) were third from last.
  - FINAL fallback was second from last.
- ★ Protocol support followed the user's chosen xray / sing-box core rather than an independent implementation; users supplied geosite.dat / geoip.dat.

<a id="与-clash-party-主线的差异passwall-引擎限制"></a>

### Differences from Clash Party mainline due to the Passwall engine

- ❌ **No nested proxy groups:** the Clash service → region → url-test structure was manually flattened into 28 shunt rules, each selecting a node or balancing group directly.
- ❌ **No LightGBM automatic selection:** Passwall balancing used xray/sing-box `balancer` with simple `round-robin` / `random` / `leastLoad`, not machine learning.
- ❌ **No automatic classification after subscription-node changes:** node labels were maintained manually; changed nodes had to be assigned to regional balancing groups again.
- ❌ **No JS override:** subscription updates provided no preprocessing stage.
- ❌ **No native Clash rule-provider format:** Passwall2 supports sing-box remote `rule_set` URLs when configured, but their format differs from Clash.
- ⚠️ **Reduced ad-block coverage in the initial reference:** one or two lists such as `geosite:category-ads-all`, rather than OpenClash's union of 20+ DustinWin / SukkaW / Hagezi / Accademia / bm7 sources.

<a id="推荐使用场景"></a>

### Initial suitability assessment recorded in this release

- ✅ Existing Passwall2 installations whose users did not want to move to OpenClash.
- ✅ Basic shunting without a requirement for LightGBM or automatic node regrouping.
- ✅ Memory-constrained routers where OpenClash was not selected.

<a id="不推荐的场景请换-openclash"></a>

### Requirements the initial assessment considered better suited to OpenClash

- ❌ Smart + LightGBM automatic selection.
- ❌ Frequent subscription-provider changes with automatic assignment into regional groups.
- ❌ Multi-source ad/security coverage for phishing, threat intelligence, DNS interception and privacy trackers.
- ❌ Exact parity with the Clash Party desktop configuration.

<a id="维护同步策略"></a>

### Maintenance synchronization policy

When Clash Party mainline changes rules/groups/services, such as adding/removing groups or changing providers, the 28 shunt rules in `双内核系/Passwall2/README.md` required **manual synchronization** at this revision:

1. New service group: add a README shunt-rule section with its node recommendation and domain/IP lists.
2. Removed service group: remove that section and record the change in this CHANGELOG.
3. New domain within a service group: update its domain-list field.

**Exception:** pure Clash Party regional/LightGBM adjustments, such as `uselightgbm` tuning or Smart-group url-test intervals, **do not require synchronization** because Passwall cannot express them; see CLAUDE.md §1.4 platform exceptions.
