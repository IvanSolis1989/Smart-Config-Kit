<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="v2rayN changelog" width="100%">
</picture>

<a id="v2rayn--变更日志"></a>

# v2rayN — Changelog

> Changelog for `Xray内核系/v2rayN/v2rayN(xray).json`.
> The main version follows Clash Party; the `-v2n.N` suffix increments independently.
>
> v2rayN is a multi-core controller. Path A (Mihomo) and path B (sing-box) reuse CMFA / SingBox artifacts and are not recorded here. This file covers only `v2rayN(xray).json` for **path C (Xray)**.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Project README](../../README.md) · [Documentation index](../../docs/README.md)

<a id="v6021-v2n11-2026-10-28"></a>

## v6.0.21-v2n.11 (2026-10-28)

- Moved Google FCM from download updates to Google services, preserving 15 domains, 26 IPv4 predicates, rule order and 55 policy groups. Other push services, DNS and fake-IP were unchanged. In Xray's three-outbound projection, FCM changed from direct to proxy by default.

<a id="v6020-v2n10-2026-10-24"></a>

## v6.0.20-v2n.10 (2026-10-24)

- Organized client directories by core family, retaining files/guides within client subdirectories. Rule semantics/fields were unchanged. Raw configuration URLs changed with paths, requiring reimport; shared `rulesets/` URLs remained unchanged.

<a id="2026-10-19--官方文档与版本核对"></a>

## 2026-10-19 — Official documentation and version review

- Cached official release records, configuration documentation and relevant source, updating REFERENCE currency and capability boundaries. See the [review report](../../docs/upstream/2026-10-19/singbox/report.md). This documentation review changed no artifact rules, groups or generated payloads.

<a id="v6020-v2n9-2026-10-16"></a>

## v6.0.20-v2n.9 (2026-10-16)

- Issue #187: added exact DIRECT exceptions in existing `scki-adfp-direct` for `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, `hkshort.weixin.qq.com`, preventing WeChat connection endpoints from matching ads first.
- No parent/subdomain expansion; `ad.weixin.qq.com` and `log.weixin.qq.com` remained rejected. Other policies and ordering were unchanged.
- Continued consuming fused assets through the existing generator with native platform syntax; generated files were not hand-edited.
- See [WeChat review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence and bounded static acceptance. Reporter-device recovery still required retesting.

<a id="v6019-v2n8-2026-10-15"></a>

## v6.0.19-v2n.8 (2026-10-15)

- FIX#186: Xray routing is locally flattened and downloads no remote rules at runtime. Synchronized version metadata without changing routing contents.
- Reused verified fused payloads; content, ordering and policies were unchanged. Added raw/CDN-reference regressions. See [delivery guidance](../../docs/rule-asset-delivery.md) for cause, download prerequisites and official fields.

<a id="v6018-v2n7-2026-10-14"></a>

## v6.0.18-v2n.7 (2026-10-14)

- Fixed cross-service first-match misclassification: narrowed broad Apple/Microsoft keywords and shared AWS/Azure/CDN suffixes, adding eight guard classes: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social, bytedance-app. Six ADFP records for exact CA revocation/status hosts via DIRECT and exact Microsoft international-mail policy brought the total to 35. `api.byteoversea.com` was an exact TikTok rule, not a shared-suffix expansion. Existing Claude Desktop `a-api`/`a-cdn` exceptions, QUIC/latency options and default-off ZeroTier proxy remained. Crisp relay was a static ASN-overlap risk inference, not a measured incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 nonempty SRS across 81 segments.

<a id="v6017-v2n6-2026-10-13"></a>

## v6.0.17-v2n.6 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to `scki-adfp-ai` for Claude Desktop application-code/user-content loading through AI policy. Based on [official requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Existing rule sets/native syntax remained. Source-semantic gates, 29 ADFP checks, Claude stage inventory and file-level release-batch checks joined the publication chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device reproduction or measurement occurred.

<a id="v6016-v2n6-2026-10-12"></a>

## v6.0.16-v2n.6 (2026-10-12)

- Following v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional ADFP validation. Conversion format, order and target policies remained; no runtime rules were added. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording only observable bytes and conversion receipts. Original remote-input SHA values cannot be reconstructed from old outputs; no claim of complete historical provenance or real-device traffic measurement was made.

<a id="v6015-v2n6-2026-10-07"></a>

## v6.0.15-v2n.6 (2026-10-07)

- Synchronized the Xray routing artifact with non-China UDP/443 policy selection; latency testing remained managed separately by the chosen client/core.
- See [latency and QUIC options](../../docs/traffic-options.md) for switching commands, capabilities and verification.

<a id="v6014-v2n5-2026-09-29"></a>

## v6.0.14-v2n.5 (2026-09-29)

- SYNC: added two exact WeChat HTTPDNS domains to Xray fallback RuleObject 001, retaining its direct outbound.
- VERIFY: retained 69 nonempty fused segments + 19 expressible inline rules + one metadata object, totaling 89 RuleObjects.

<a id="v6013-v2n4-2026-09-03"></a>

## v6.0.13-v2n.4 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE: added `domain:linuxdo.org` to Xray fallback RuleObject 013 with its existing China-sites direct semantics; `linux.do` remained in proxy rule 059.
- SYNC: retained 69 nonempty fused segments + 19 expressible inline rules + one metadata object, totaling 89 RuleObjects.

<a id="v6012-v2n3-2026-09-01"></a>

## v6.0.12-v2n.3 (2026-09-01)

- FIX#181-PC: rebuilt Xray fallback from the initial fused JSON so `login.nvidia.cn` matched `direct` before the NVIDIA downloads segment.
- SYNC: the artifact contained 69 nonempty fused segments + 19 expressible inline rules + one metadata object, totaling 89 RuleObjects.

<a id="v6011-v2n2-2026-08-22"></a>

## v6.0.11-v2n.2 (2026-08-22)

- Flattened the final 69 fused sing-box segments into 89 Xray RuleObjects. Gemini and Accademia Gemini segments adopted proxy Google semantics; the szkane AI segment was not moved.

<a id="v6010-v2n2-2026-08-08"></a>

## v6.0.10-v2n.2 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: rebuilt Xray fallback from the initial fused sing-box JSON. Two NetEase game-service hosts matched the `direct` outbound before the China-games segment.

<a id="v609-v2n1-2026-07-19"></a>

## v6.0.9-v2n.1 (2026-07-19)

- Added two expressible `process + domain` RuleObjects to Xray fallback, retaining proxy AI semantics only when `Code Helper` / `Code Helper (Plugin)` accesses `api.github.com`; the generic GitHub API segment preceded upstream's broad AI segment.
- SYNC: rebuilt 86 RuleObjects (one meta + 66 fused + 19 inline).

<a id="v608-v2n1-2026-07-15"></a>

## v6.0.8-v2n.1 (2026-07-15)

- Reflattened the updated fused sing-box source, preserving equivalent order with China-authority segments before generic international fallback.

<a id="v607-v2n1-2026-07-14"></a>

## v6.0.7-v2n.1 (2026-07-14)

- FIX#176: regenerated Xray fallback from the later international SRS segment, so China-domain RuleObjects matched direct before shared-CDN / GeoIP proxy fallback.

<a id="v606-v2n1-2026-07-14"></a>

## v6.0.6-v2n.1 (2026-07-14)

- DIRECT-WORKPRO-WEB: regenerated Xray fallback with both `WorkPro.exe` and `WorkProWebProcess.exe` in the default direct RuleObject's `process`; effective only for local Windows / Linux process matching.

<a id="v605-v2n1-2026-07-14"></a>

## v6.0.5-v2n.1 (2026-07-14)

- DIRECT-WORKPRO: rebuilt Xray fallback with process WorkPro.exe and outboundTag direct; effective only on local Windows / Linux Xray process-matching paths.

<a id="v604-v2n1-2026-07-13"></a>

## v6.0.4-v2n.1 (2026-07-13)

- DIRECT-ITWDB: rebuilt Xray fallback from fused sing-box JSON. Its default direct RuleObject included `domain:itwdb.com`, covering WorkPro subdomains.

<a id="v603-v2n1-2026-07-12"></a>

## v6.0.3-v2n.1 (2026-07-12)

- SYNC: flattened 65 nonempty fused sing-box JSON sources into 83 Xray RuleObjects (one meta + 65 fused + 17 inline), retaining `proxy/direct/block` outbounds and first-match order.
- AI-PRECEDENCE: the new AI telemetry guard applied before ad rules and international-sites fallback. The Xray path did not directly download or invoke upstream rule sets.

<a id="v602-v2n1-2026-07-10"></a>

## v6.0.2-v2n.1 (2026-07-10)

- SYNC: flattened 64 nonempty v6.0.2 fused sing-box JSON sources into 82 Xray RuleObjects (one meta + 64 fused + 17 inline), retaining the three `proxy/direct/block` outbounds.
- PERF: Xray fallback inherited target-specific GEOIP/ASN CIDR materialization and same-policy deduplication without loading original upstream rule providers.

<a id="v601-v2n1-2026-07-10"></a>

## v6.0.1-v2n.1 (2026-07-10)

- SYNC: reflattened the latest fused sing-box JSON into Xray fallback, preserving 86 native Xray RuleObjects, `proxy/direct/block` outbounds and existing precedence.
- DELIVERY: Xray JSON does not remotely load the text rule sets involved in Issue #174; its synchronized version kept fallback aligned with source graph v6.0.1.

<a id="v600-v2n2-2026-07-09"></a>

## v6.0.0-v2n.2 (2026-07-09)

- FUSED-XRAY: `tools/generate-fused-fallback-artifacts.js` began flattening `rulesets/generated/fused/sing-box/*.json` into native Xray RuleObjects in `v2rayN(xray).json`.
- SCOPE: Xray has no routing field for remote `.srs` sets, unlike sing-box/Passwall. This artifact retained `proxy/direct/block` outbounds and emitted one metadata object, 68 fused segments and 17 inline port/logical/MATCH rules.

<a id="v600-v2n1-2026-07-09"></a>

## v6.0.0-v2n.1 (2026-07-09)

- META: updated version metadata with Clash Party v6.0.0.
- SCOPE: Xray routing JSON remained a flattened three-outbound proxy/direct/block fallback reference, without fused rule-set loading or influence on the Clash Party baseline.

<a id="v5439-v2n1-2026-07-09"></a>

## v5.4.39-v2n.1 (2026-07-09)

- META: updated version metadata with Clash Party v5.4.39.
- N/A: Xray routing JSON does not consume Mihomo `.mrs` providers; its Mihomo / sing-box paths reuse CMFA / SingBox artifacts respectively.

<a id="v5438-v2n1-2026-07-09"></a>

## v5.4.38-v2n.1 (2026-07-09)

- META: updated version metadata with Clash Party v5.4.38.
- SCOPE: Xray JSON continued using flattened rules, without direct `rulesets/supplemental` URL references.

<a id="v5437-v2n1-2026-06-29"></a>

## v5.4.37-v2n.1 (2026-06-29)

- META#170-DNS-POLICY: updated version metadata with Clash Party v5.4.37.
- N/A: Xray routing JSON contains no DNS-resolution policy. Mihomo / sing-box paths reuse CMFA / SingBox respectively; this file's routing semantics were unchanged.

<a id="v5436-v2n1-2026-06-29"></a>

## v5.4.36-v2n.1 (2026-06-29)

- META#171-DIRECT: updated version metadata with Clash Party v5.4.36.
- The Xray artifact did not contain these 22 inline Mihomo rules; its routing semantics were unchanged.

<a id="v5435-v2n1-2026-06-28"></a>

## v5.4.35-v2n.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM: updated version metadata against Clash Party v5.4.35.
- N/A: Xray routing JSON does not consume Mihomo providers; this cleanup did not change its 40 enabled rules.

<a id="v5434-v2n1-2026-06-28"></a>

## v5.4.34-v2n.1 (2026-06-28)

- ★ FIX#169-AMAP: added `scki-000e-amap-direct` with explicit direct routing for AMap core domains including `a-map.cn` / `amap.com` / `autonavi.com` / `gaode.com`.
- Note: v2rayN Xray routing JSON does not consume Mihomo `rule-provider`, so domain fallback provided semantics equivalent to mainline's `amap` provider.

<a id="v5433-v2n1-2026-06-27"></a>

## v5.4.33-v2n.1 (2026-06-27)

- ★ FEAT#169-AI-CODING: expanded `scki-010-ai` domain fallback in the Xray reference for AI coding tools including Augment / Amazon Q / Bolt / Continue / Devin / Kiro / Lovable / Replit / Sourcegraph / Tabnine / Windsurf / Zed.

<a id="v5432-v2n1-2026-06-25"></a>

## v5.4.32-v2n.1 (2026-06-25)

- ★ FIX#168-CN-GAME: completed `scki-025-cn-game` domains for miHoYo, NetEase, WeGame, Perfect World, TapTap, Hypergryph and Lilith, retaining their position before international-games rules.
- Aligned metadata with Clash Party v5.4.32; Mihomo / sing-box paths continued reusing their corresponding primary artifacts.

<a id="v5431-v2n1-2026-06-20"></a>

## v5.4.31-v2n.1 (2026-06-20)

- ★ FIX#167-DOUYIN: added `scki-000d-douyin-web-cnmedia` to the Xray reference, explicitly placing direct routes for Douyin Web / `zjcdn.com` video-CDN traffic early.
- Aligned metadata with Clash Party v5.4.31; Mihomo / sing-box paths continued reusing their corresponding primary artifacts.

<a id="v5430-v2n1-2026-06-17"></a>

## v5.4.30-v2n.1 (2026-06-17)

- ★ FEAT#166-GOOGLE: added `scki-027-google` to the Xray reference for `geosite:google` / `geoip:google` / `domain:scholar.google.com`.
- Split the former search-engine reference into `scki-027b-search`, retaining only non-Google search such as Bing / DuckDuckGo / Yandex.

<a id="v5429-v2n1-2026-06-10"></a>

## v5.4.29-v2n.1 (2026-06-10)

- N/A#165-LATENCY: v2rayN Xray routing JSON contains no regional auto-testing/health-check fields; only metadata and README aligned with Clash Party v5.4.29.

<a id="v5427-v2n1-2026-06-07"></a>

## v5.4.27-v2n.1 (2026-06-07)

- Aligned with v5.4.27 (CLEAN#165). Xray routing used aggregate `geosite:anthropic` / `geosite:paypal` / `geosite:hbo` / `geosite:hulu` / `geosite:xbox` entries and contained none of the removable inline domains; only version metadata changed.

<a id="v5426-v2n1-2026-06-07"></a>

## v5.4.26-v2n.1 (2026-06-07)

- Aligned with v5.4.26 (FIX#164). This artifact was **unaffected** by `copilot.tencent.com` misclassification: AI routing used `geosite:copilot`, containing exact Microsoft/GitHub Copilot domains rather than a copilot substring keyword. `copilot.tencent.com` reached `geosite:cn` (including `tencent.com`) → direct. Only version metadata changed; no routing fix was needed.

<a id="v5425-v2n1-2026-06-04"></a>

## v5.4.25-v2n.1 (2026-06-04)

- ★ SYNC: aligned Xray routing JSON metadata with Clash Party v5.4.25. Service/rule categories were unchanged, retaining v5.4.23-v2n.1 routing semantics.

<a id="v5423-v2n1-2026-06-02"></a>

## v5.4.23-v2n.1 (2026-06-02)

- ★ FIX#161: added `domain:zhimg.com` and `domain:zhihu.co` to direct routes for Zhihu image-CDN/short links, matching the baseline.

<a id="v5422-v2n1-2026-05-31"></a>

## v5.4.22-v2n.1 (2026-05-31)

- ★ Added GeTui push-SDK domains `getui.com` / `getui.net` / `gepush.com` to `scki-000c` direct routing after review. This extended #2 before ad rules; the recorded owner decision favored preserving application push traffic such as Mi Home.

- N/A#1 fine-grained QUIC: v2rayN Xray routing JSON does not implement QUIC blocking, so #1 did not apply; its version followed the baseline.

<a id="v5421-v2n1-2026-05-31"></a>

## v5.4.21-v2n.1 (2026-05-31)

- N/A#4 DoH-over-IP bootstrap: v2rayN Xray routing JSON has no DNS resolver configuration, only route/proxy/direct/block; #4 did not apply and its version followed the baseline.

<a id="v5420-v2n1-2026-05-30"></a>

## v5.4.20-v2n.1 (2026-05-30)

- N/A#6 node-filter keywords (batch B): Xray routing JSON has no runtime node classification/junk filter. #6 did not apply; its version aligned with Clash Party v5.4.20.

<a id="v5419-v2n1-2026-05-30"></a>

## v5.4.19-v2n.1 (2026-05-30)

Proxy-override batch A, #2 China SDK/CDN direct precedence, following Clash Party v5.4.19; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`:

- Added `scki-000c-cn-sdk-cdn-direct` with `outboundTag: direct`, before `scki-001-ads`: `jpush.cn` / `jpush.io`, `full:msg.umeng.com` to avoid `geosite:category-ads-all` false positives, and CDN domains `baomitu.com` / `bootcss.com` / `staticfile.org` / `upaiyun.com`.
- #3 fake-ip-filter and #5 direct-nameserver-follow-policy did not apply: Xray routing JSON contains neither fake-IP nor Mihomo DNS fields.
- 🔢 Version: v5.4.17-v2n.1 → v5.4.19-v2n.1; all artifacts skipped the discarded .18 release and aligned with v5.4.19.

<a id="v5417-v2n1-2026-05-26"></a>

## v5.4.17-v2n.1 (2026-05-26)

- N/A#DNS-SPLIT-BOOTSTRAP: path C (Xray) publishes routing-rule JSON only, not DNS-resolver configuration.
  - Synchronized metadata with Clash Party v5.4.17.
  - v2rayN's Mihomo / sing-box paths continued directly reusing CMFA / SingBox artifacts.

<a id="v5416-v2n1-2026-05-20"></a>

## v5.4.16-v2n.1 (2026-05-20)

- ✅ FIX#149-P0: added an early `paddle.com -> proxy` rule for path C (Xray).
  - v2rayN Xray does not consume the anti-AD remote source, but preserved Paddle licensing/payment precedence; Mihomo / sing-box paths reused their corresponding artifacts.

<a id="v5415-v2n1-2026-05-20"></a>

## v5.4.15-v2n.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER: synchronized v5.4.15 metadata and added GEOSITE coverage references.
- N/A#AD-FP-MODULE: path C's Xray routing JSON does not consume Sukka phishing / blackmatrix7 MIUI remote sources. It retained the existing early Cloudflare R2 rule; Mihomo / sing-box paths reused their corresponding artifacts.

<a id="v5414-v2n1-2026-05-20"></a>

## v5.4.14-v2n.1 (2026-05-20)

- ✅ FIX#CF-R2-P0: added early `cloudflarestorage.com -> proxy` routing to Xray JSON.
  - Path C does not consume the Sukka phishing remote source, but retained positive precedence for Cloudflare R2 storage domains.
  - Synchronized metadata with Clash Party v5.4.14.

<a id="v5413-v2n1-2026-05-19"></a>

## v5.4.13-v2n.1 (2026-05-19)

- ✅ FIX#STUN-PORTS: added `STUN/TURN NAT-discovery ports -> direct` to Xray routing JSON.
  - Covered `3478 / 3479 / 5349 / 19302 / 19305 / 19307`.
- N/A#FAKE-IP: Xray routing JSON has no Mihomo `fake-ip-filter`.

<a id="v5412-v2n1-2026-05-12"></a>

## v5.4.12-v2n.1 (2026-05-12)

- META#RD-REALIP: Follows Clash Party v5.4.12 baseline metadata after the Mihomo RustDesk real-IP DNS fix.
- N/A#FAKE-IP: Xray routing JSON has no Mihomo fake-ip-filter or process matching fields here; route semantics are unchanged.

<a id="v5411-v2n1-2026-05-12"></a>

## v5.4.11-v2n.1 (2026-05-12)

- ✅ FIX#RD-DOMAIN: added `domain:rustdesk.com` to Xray collaboration routing, preventing RustDesk relay/API traffic from reaching AI/Copilot or FINAL.
- ℹ️ PROCESS-NAME did not apply: the v2rayN Xray routing-import file maintained domain/IP/port rules only at this revision.

<a id="v549-v2n1-2026-05-11"></a>

## v5.4.9-v2n.1 (2026-05-11)

- ★ META#LOCAL-TOOLS: followed Clash Party v5.4.9. Xray routing JSON had no general equivalent of Mihomo PROCESS-NAME at this revision; only `_meta.remarks` changed.
- The historical note identified Mihomo (CMFA artifact) and sing-box (SingBox Full artifact) as alternative v2rayN paths for the local-tool direct allowlist.

<a id="v548-v2n1-2026-05-09"></a>

## v5.4.8-v2n.1 (2026-05-09)

- ★ ORDER#RULE-TAIL: synchronized routing-order semantics with Clash Party v5.4.8.
  - Xray retained only proxy/direct/block outbounds, without adding any.

<a id="v547-v2n1-2026-05-09"></a>

## v5.4.7-v2n.1 (2026-05-09)

- ★ FEAT#TikTok: Xray retained proxy/direct/block only; `geosite:tiktok` already used proxy, so behavior was unchanged and only `_meta.version` increased.
- ★ FIX#HK: Xray routing has no runtime node classification and was exempt.

<a id="v546-v2n1-2026-05-08"></a>

## v5.4.6-v2n.1 (2026-05-08)

- ★ FEAT#145: added direct WeChat CDN rule `scki-052-cdn-weixin`, `domain:cdn.weixin.qq.com` → `direct`.
  - Positioned after `scki-051-bbys-app` and before `scki-099-final`.
  - Followed v5.4.6 baseline.

<a id="v545-v2n1-2026-05-07"></a>

## v5.4.5-v2n.1 (2026-05-07)

- ★ Moved global nodes first and synchronized group ordering across products, following v5.4.5.

<a id="v544-v2n1-2026-05-07"></a>

## v5.4.4-v2n.1 (2026-05-07)

- ★ FIX#144: added direct bbys.app video-playback rule `scki-051-bbys-app`, `domain:bbys.app` → `direct`.
  - Existing geosite rules did not cover this domain; added one domain-matching Xray rule.
  - Positioned after `scki-050-cn-site` and before `scki-099-final`.
- ★ FIX#142 (DNS nameserver fallback): v2rayN Xray has no runtime DNS-creation logic and was exempt.
- ★ FEAT#143 (IEPL/IPLC residential classification): v2rayN Xray contains only routing rules, not node classification, and was exempt.
- Bump: `v5.4.0-v2n.1` → `v5.4.4-v2n.1`

<a id="v540-v2n1-2026-05-05"></a>

## v5.4.0-v2n.1 (2026-05-05)

- ★ FEAT#SG: added independent `🇸🇬 狮城节点` and `🏡 狮城家宽` groups.
  - Split Singapore into a separate region from `🌏 亚太节点`.
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Followed Clash Party v5.4.0.
  - Note: SG/Singapore node-name changes did not apply because this path uses geosite routing, not node-name matching.

<a id="v530-v2n1-2026-04-26"></a>

## v5.3.0-v2n.1 (2026-04-26)

- ★ REFACTOR#2: changed streaming grouping from region-based to platform-based (7 → 13 groups).
  - Added independent Netflix / Disney+ / HBO/Max / Hulu / Prime Video groups.
  - Split global YouTube / music-streaming groups.
  - Retained Hong Kong / Taiwan / Japan-Korea / Europe regional streaming groups.
  - Added other-international-streaming fallback for long-tail platforms and former Southeast Asia streaming.
  - Service groups: 25 → 31; total groups: 43 → 49.
<a id="v5211-v2n1-2026-04-26--业务组合并精简-2825基线同步"></a>

## v5.2.11-v2n.1 (2026-04-26) — Consolidated service groups 28→25 (baseline synchronization)

- ★ **REFACTOR#1 (baseline synchronization):** followed Clash Party v5.2.11, which reduced service groups from 28 to 25.
  - Merged search engines and developer services into tools/services.
  - Merged mail services into international sites.
  - Merged cloud/CDN into international sites.
  - Changed downloads/updates from DIRECT-first to proxy-first.
  - Note: the v2rayN Xray path has only proxy/direct/block outbounds; group consolidation produced no routing-rule diff.
    Only the version was synchronized to retain its baseline identifier.
- Bump: `v5.2.10-v2n.1` → `v5.2.11-v2n.1`

<a id="v5210-v2n1-2026-04-25--主版本追平无规则改动"></a>

## v5.2.10-v2n.1 (2026-04-25) — Aligned main version without rule changes

- ★ **FIX#39 cross-client audit — not applicable:** mainline moved `dns.google` / `cloudflare-dns.com`
  from `☁️ 云与CDN` to `🚫 受限网站`, but v2rayN Xray routing has only
  `proxy` / `direct` / `block` outbounds. Regardless of either domain's service-group classification,
  both map to `proxy` in v2rayN, so there was **no routing-rule diff**.
- Only change: `_meta.remarks` main version `v5.2.9` → `v5.2.10`, matching the baseline.
- Bump: `v5.2.9-v2n.1` → `v5.2.10-v2n.1`

<a id="v528-v2n1-2026-04-23--补齐港澳台--国际版-b-站分流主线对齐-v528"></a>

## v5.2.8-v2n.1 (2026-04-23) — Completed Bilibili HMT/international routing and aligned with v5.2.8

This revision closed missed Clash Party v5.2.7 / v5.2.8 synchronization work and restored missing Bilibili HMT/international routing in the Xray path.

<a id="改动"></a>

### Changes

- ★ **FIX#v2n-07:** added `scki-019-hmt-media` (Bilibili HMT → proxy).
  - Baseline `Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js:1555` assigned `RULE-SET,szkane-bilihmt` to `🇭🇰 香港流媒体`, projected to `proxy` in Xray's three-outbound model.
  - szkane `ClashRuleSet@main/Clash/Ruleset/BilibiliHMT.list` is a Clash-specific list absent from xray `geosite.dat`; therefore 21 upstream predicates were inlined (five DOMAIN / three DOMAIN-SUFFIX / 13 IP-CIDR).
  - **Placed before `scki-018-cn-media`:** xray evaluates arrays in order like Mihomo. `geosite:bilibili` includes suffix `bilibili.com`; placing HMT after 018 would let 018 capture direct traffic first, associated with Bilibili HMT 412 failures in this record.
- ★ **FIX#v2n-08:** added `scki-019a-sea-media` (international Bilibili → proxy).
  - Baseline `RULE-SET,biliintl` used `📺 东南亚流媒体`, projected to `proxy` in v2rayN Xray's three-outbound model.
  - Used `geosite:biliintl`, a standard v2fly `geosite.dat` category. If absent from the user's geosite database, matching fell through to `scki-040-gfw` → proxy with the same semantics.
- ★ Mainline alignment: bumped `scki-000-meta` remarks from `v5.2.6-v2n.3` / `Baseline Clash Party v5.2.6` to `v5.2.8-v2n.1` / `Baseline Clash Party v5.2.8`, covering the previously missed v5.2.7 and v5.2.8 mainline bumps.

<a id="官方文档证据"></a>

### Official documentation evidence

- [v2rayN Wiki — Custom routing rules](https://github.com/2dust/v2rayN/wiki/%E9%85%8D%E7%BD%AE%E6%95%99%E7%A8%8B-%E8%B7%AF%E7%94%B1): custom routing rules are an array of Xray RuleObjects; the top-level array was preserved.
- [Xray Routing — domain prefix](https://xtls.github.io/config/routing.html): matching semantics for `geosite:*` / `domain:*` / plain domains / IP-CIDR. Rules are evaluated **in array order**, with the first match selecting an outbound.

<a id="自检"></a>

### Self-checks

- Valid JSON ✓
- 32 objects total: 31 enabled + one disabled metadata object ✓
- `outboundTag` set remained `{proxy, direct, block}` ✓
- Rule order: `scki-019-hmt-media` < `scki-018-cn-media` < `scki-019a-sea-media` ✓ (Python assertion passed).

---

<a id="v526-v2n3-2026-04-23--改为官方规则数组--移除悬空-dns-out"></a>

## v5.2.6-v2n.3 (2026-04-23) — Adopted the official rule array and removed dangling dns-out

This revision addressed Xray import-format and outboundTag issues found in the P0 compatibility review of v2rayN.

<a id="改动-1"></a>

### Changes

- ★ **FIX#v2n-05-P0:** changed the top level of `v2rayN(xray).json` from an object to the official rule-array format.
  - The official v2rayN Wiki specifies an array in which each item is a rule.
  - Preserved 29 enabled rules and added one `enabled:false` `scki-000-meta` version marker so the array format did not lose artifact-version information.
- ★ **FIX#v2n-06-P0:** changed the DNS port-53 rule's `outboundTag` from `dns-out` to `direct`.
  - Repository path C promises only v2rayN/Xray `proxy` / `direct` / `block` outbounds under `Xray内核系/v2rayN/`.
  - `v2rayN(xray).json` imports routing rules and does not define Xray outbounds, so retaining `dns-out` would leave a dangling reference.
- ★ Updated the version marker to `v5.2.6-v2n.3`, Build `2026-04-23`, aligned with Clash Party v5.2.6.

<a id="自检-1"></a>

### Self-checks

- Top-level JSON array ✓
- 30 objects total: 29 enabled rules and one disabled metadata object ✓
- outboundTag set contained only `proxy` / `direct` / `block` ✓
- No remaining `dns-out` references ✓

<a id="官方文档证据-1"></a>

### Official documentation evidence

- [v2rayN Wiki: Description of custom routing rules](https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules): the official example is a JSON array.
- [Xray / V2Ray Routing RuleObject](https://xtls.github.io/config/routing.html#ruleobject): `outboundTag` refers to an existing outbound.

<a id="v525-v2n2-2026-04-22--geosite-类别兼容修复--版本对齐"></a>

## v5.2.5-v2n.2 (2026-04-22) — Fixed geosite-category compatibility and aligned versions

Deep review found that `geosite:kakaotalk` in instant-messaging routing **did not exist in v2fly/domain-list-community**.
The repository contained `kakao`, without the `talk` suffix; the Loyalsoldier extension also lacked that category. Loading the rule
silently matched zero domains, allowing KakaoTalk traffic to fall through to geoip / FINAL rather than the intended policy.

<a id="改动-2"></a>

### Changes

- ★ FIX#v2n-01-P1: changed **`geosite:kakaotalk` → `geosite:kakao`**, the official v2fly category, and added three explicit domain fallbacks.
  - `domain:kakao.com` / `domain:kakaocorp.com` / `domain:kakaotalk.com`
  - Other geosite categories, including newer AI categories `huggingface` / `anthropic` / `perplexity` / `copilot` / `gemini` / `bard` / `openai`,
    were individually checked upstream and retained; v2fly included `huggingface.co/hf.co/hf.space` and related entries.
- ★ FIX#v2n-02-P2: changed `_meta.version` from `v5.2.3-v2n.1` to **`v5.2.5-v2n.2`**, matching Clash Party JS `VERSION='v5.2.5'`.
- ★ FIX#v2n-03-P2：`_meta.build` `2026-04-20` → `2026-04-22`；`_meta.baseline` `v5.2.4` → `v5.2.5`
- ★ FIX#v2n-04-P2: changed top-level `remarks` from `v5.2.3` to `v5.2.5`.

<a id="复核其他-audit-发现保留不改"></a>

### Other audit findings reviewed and retained at this revision

- **Top-level `_meta`:** the historical review retained it for v2rayN UI display when saving; Xray-core's parser defaults to `DisallowUnknownFields=false` and ignores it.
- **`dns-out` outboundTag:** the historical review retained it on the assumption that v2rayN's main configuration supplied the outbound definition (see `Xray内核系/v2rayN/README.md`); this routing fragment itself contained no outbound definitions.
- **Other 98 geosite categories:** random sampling confirmed v2fly / Loyalsoldier coverage without identifying other missing categories.

<a id="自检-2"></a>

### Self-checks

```
python3 -c 'import json; d=json.load(open("Xray内核系/v2rayN/v2rayN(xray).json")); print(d["_meta"]["version"])'
→ v5.2.5-v2n.2 ✓
Rule count:                29 (unchanged)
kakaotalk → kakao + domain: fixed ✓
_meta.version starts v5.:   ✓ (expected by CLAUDE.md §5)
```

<a id="官方文档证据-2"></a>

### Official documentation evidence

- [v2fly/domain-list-community data/kakao](https://github.com/v2fly/domain-list-community/tree/master/data) existed; `data/kakaotalk` returned 404.
- [v2fly/domain-list-community data/huggingface](https://raw.githubusercontent.com/v2fly/domain-list-community/master/data/huggingface) existed, including hf.co / hf.space / huggingface.co.

---

<a id="v523-v2n1-2026-04-20--初版"></a>

## v5.2.3-v2n.1 (2026-04-20) — Initial version

- ★ Extracted key service domains from Clash Party v5.2.3 to generate Xray routing rules.
- ★ Distributed 29 routing rules as follows:
  - 20 `proxy` rules: AI / cryptocurrency / streaming / social / developer / GFW and other service groups projected to proxy.
  - Six `direct` rules: private networks / China sites / China streaming / China games / default Apple services / BT trackers.
  - Two `block` rules: ad blocking and Windows Delivery Optimization port 7680.
  - One `dns-out` rule for DNS interception.
- ★ Combined geosite + geoip keywords, including `geosite:openai` / `geosite:netflix` / `geoip:cn`.
- ★ Included an `_meta` block with `name` / `version` / `build` / `baseline` / `note` / `changelog` for v2rayN UI display.

<a id="已知限制xray-核的设计约束非-bug"></a>

### Known Xray design limitations, not implementation bugs

- ❌ No two-layer structure of 28 service groups → nine regional groups; Xray routing has only proxy / direct / block outbounds.
- ❌ No LightGBM automatic selection.
- ❌ No Smart-group `uselightgbm: true`.
- ❌ No automatic updates for 373+ rule providers; Xray uses `geosite.dat` / `geoip.dat` databases rather than the rule-provider mechanism.
- ⚠️ Keywords such as `geosite:snapchat` depend on v2rayN's bundled geosite database; some category names used by Clash may not exist in v2fly geosite.

The historical comparison identified path A (Mihomo) and path B (sing-box) as alternatives for broader functionality; see `Xray内核系/v2rayN/README.md`.
