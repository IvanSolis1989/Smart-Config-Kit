<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Stash changelog" width="100%">
</picture>

<a id="stash--变更日志"></a>

# Stash — Changelog

> This file records Stash-specific YAML changes. See `REFERENCE-Stash-wiki.md` for detailed platform-field evidence.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Project home](../../README.md) · [Repository documentation](../../docs/README.md)

## v6.0.21-stash.15 (2026-10-28)

- Moved Google FCM from download updates to Google services. The 15 domain and 26 IPv4 predicates, rule order and 55 policy groups were unchanged, as were other push services, DNS and fake-IP.

## v6.0.20-stash.14 (2026-10-24)

- Grouped client directories by core family, retaining configuration/documentation in client subdirectories without changing rule semantics or fields. Raw configuration URLs changed with the move, requiring existing users to reimport matching files; shared `rulesets/` asset URLs were unchanged.

## v6.0.20-stash.13 (2026-10-20)

- Generated from updated CMFA, inheriting service DNS policy. Native Stash DNS-policy semantics were retained without changing group structure, node selection or rule payloads. See [Stash DNS documentation](https://stash.wiki/en/features/dns-server).

<a id="2026-10-19--官方文档与版本核对"></a>

## 2026-10-19 — Official documentation and version review

- Cached official release records, configuration documentation and relevant source, updating REFERENCE currency/capability boundaries. See the [review report](../../docs/upstream/2026-10-19/apple/report.md). This documentation review changed no rules, policy groups or generated payloads.

## v6.0.20-stash.12 (2026-10-16)

- Issue #187: added exact DIRECT exceptions for `szlong.weixin.qq.com`, `hklong.weixin.qq.com` and `hkshort.weixin.qq.com` in existing `scki-adfp-direct`, preventing WeChat connection endpoints from matching ad sets first.
- Did not expand to parent/child domains. `ad.weixin.qq.com` and `log.weixin.qq.com` remained blocked; other policies/rule order were unchanged.
- Continued consuming fused assets through the existing generator with native platform syntax; generated files were not hand-edited.
- See [WeChat connection review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence/limited static acceptance. Recovery on the reporter’s device still required real retesting.

## v6.0.19-stash.11 (2026-10-15)

- FIX#186: standardized repository-owned remote assets on GitHub raw HTTPS, avoiding jsDelivr repository-size limits while preserving version query parameters/native formats.
- Reused verified fused payloads without changing rule contents/order/policies. Added raw/CDN reference-detection regressions. See [rule asset delivery](../../docs/rule-asset-delivery.md) for causes, download prerequisites and official field evidence.

## v6.0.18-stash.10 (2026-10-14)

- Fixed cross-service first-match misclassification. Normalized overbroad Apple/Microsoft keywords/shared AWS/Azure/CDN suffixes, adding eight guards: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social and bytedance-app. Added six ADFP records for exact CA revocation/status hosts routed directly and exact Microsoft mail international policy, totaling 35. `api.byteoversea.com` became an exact TikTok rule without broadening shared suffixes. Retained Claude Desktop `a-api`/`a-cdn` exact exceptions, QUIC/latency options and default-off ZeroTier proxy. Crisp relay was a static ASN-coverage risk inference, not an observed incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 non-empty SRS across 81 segments.

## v6.0.17-stash.9 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to existing `scki-adfp-ai`, routing hosts needed for Claude Desktop code/user-content loading through AI policy. Based on [official Desktop network requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Retained existing rule sets/native syntax. Integrated source-semantic gates, 29 ADFP exception checks, Claude service-stage inventory and file-level release-batch checks into the same release chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device failure reproduction or measurement was performed.

## v6.0.16-stash.9 (2026-10-12)

- Alongside v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional existing-ADFP checks. Client conversion formats, rule order and targets retained existing implementation, with no new runtime rules. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording observable bytes/conversion receipts only. Original remote-input SHA for old assets cannot be recovered from outputs; complete historical provenance was not claimed, nor was real-device traffic measured.

## v6.0.15-stash.9 (2026-10-07)

- CMFA-generated testable groups retain 300 seconds in default `standard`, enabling officially supported `lazy: true`. `power-save` retains 900 seconds plus `lazy: true`. Default QUIC policy was unchanged.

## v6.0.15-stash.8 (2026-10-07)

- CMFA-derived YAML added support for 900-second intervals, lazy testing and international-category UDP/443 policy selection.
- See [latency-test and QUIC options](../../docs/traffic-options.md) for switching commands, platform capabilities and verification.

## v6.0.14-stash.7 (2026-09-30)

- SYNC: regenerated from CMFA v6.0.14-cmfa.7, continuing to use confirmed Stash fields only. Removed `exclude-type` / `empty-fallback` without public support evidence; Mihomo type-filtering/empty-pool REJECT semantics were not claimed.
- META: fixed counting of unindented CMFA rule lists; the header correctly shows 151 main rules.
- DOCS: separate named-direct support outbounds from latency-test providers and check chains at the aggregation layer. See README and [platform tradeoffs](../../docs/research/2026-09-30-routing-runtime-followup.md). Rule contents were unchanged.

## v6.0.14-stash.6 (2026-09-29)

- Controlled rebuild from CMFA v6.0.14-cmfa.6. Two exact WeChat HTTPDNS domains in the first fused DIRECT asset precede BlockHttpDNS.

## v6.0.13-stash.5 (2026-09-03)

- Controlled rebuild from CMFA v6.0.13-cmfa.5. `linuxdo.org` and subdomains route to `🏠 国内网站` through fused asset 013; `linux.do` retains restricted-sites routing.

## v6.0.12-stash.4 (2026-09-01)

- Controlled rebuild from CMFA v6.0.12-cmfa.4. Exact `login.nvidia.cn` routes directly through the first fused asset; other NVIDIA domains remain in the download group.

## v6.0.11-stash.3 (2026-08-22)

- Regenerated from CMFA v6.0.11-cmfa.3. Gemini/Accademia Gemini first match `🔍 Google 服务`; broad szkane AI rules were unchanged.

## v6.0.10-stash.3 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: regenerated from CMFA v6.0.10-cmfa.3. Two NetEase game hosts in the first fused direct asset precede anti-AD/China-game rules.

## v6.0.9-stash.2 (2026-08-08)

- FIX-APAC-HOME-REGEX: regenerated from CMFA v6.0.9-cmfa.2; the filter regex for `🏡 亚太家宽` now compiles.
- GUARD: all CMFA/Stash policy-group `filter` expressions now undergo syntax compilation in contract validation.

## v6.0.9-stash.1 (2026-07-19)

- Regenerated from CMFA v6.0.9-cmfa.1. Generic `api.github.com` requests reach tools before broad AI rules; process exceptions depend on runtime platform capabilities.

## v6.0.8-stash.1 (2026-07-15)

- Regenerated from v6.0.8 CMFA, inheriting China-category authoritative precedence and versioned Mihomo rule-cache paths.

## v6.0.7-stash.1 (2026-07-14)

- FIX#176: regenerated from CMFA v6.0.7-cmfa.1. Stash inherits fused order placing China-domain rules before shared CDN / international GeoIP fallback.

## v6.0.6-stash.1 (2026-07-14)

- DIRECT-WORKPRO-WEB: regenerated from CMFA v6.0.6-cmfa.1. Fused direct residual retains WorkPro parent and Web child processes; actual matches depend on underlying core process support.

## v6.0.5-stash.1 (2026-07-14)

- DIRECT-WORKPRO: regenerated from CMFA v6.0.5-cmfa.1. The same fused direct residual retains WorkPro.exe; actual process matching depends on the underlying desktop core.

## v6.0.4-stash.1 (2026-07-13)

- DIRECT-ITWDB: regenerated from CMFA v6.0.4-cmfa.1. Stash consumes the same default DIRECT fused MRS covering `itwdb.com` and subdomains.

## v6.0.3-stash.1 (2026-07-12)

- SYNC: regenerated from CMFA v6.0.3-cmfa.1, retaining 124 fused rule-providers and 141 rules.
- FIX#FUSED-DOMAIN-PAYLOAD: consumed fused MRS uses native domain payloads. Keywords/regex that cannot safely convert remain residual YAML.
- BUILD: header provider/rule/source counts are read dynamically from CMFA/fused manifests, avoiding stale generator numbers.

## v6.0.2-stash.1 (2026-07-10)

- SYNC: regenerated from CMFA v6.0.2-cmfa.1, retaining 113 fused rule-providers and 130 rules.
- PERF: `.mrs` / residual assets total about 6.65 MiB. GEOIP remains a residual native query instead of expanding to large CIDR lists.
- CONTRACT: retained trimming to officially compatible Stash fields and included the client in the 32-MiB aggregate budget.

## v6.0.1-stash.1 (2026-07-10)

- SYNC: regenerated from CMFA v6.0.1-cmfa.1, retaining 113 fused rule-providers and 130 rules.
- DELIVERY: Stash still consumes Mihomo `.mrs` / residual YAML. Issue #174 large-text CDN sharding does not change its semantics/platform-field trimming.

## v6.0.0-stash.1 (2026-07-09)

- SYNC: regenerated from CMFA v6.0.0-cmfa.1, retaining `113` fused rule-providers and `130` rules.
- COMPAT: continued trimming Mihomo extensions according to Stash Wiki. Stash does not directly determine the baseline.

## v5.4.39-stash.1 (2026-07-09)

- SYNC: regenerated from CMFA v5.4.39-cmfa.1, retaining 474 rule-providers and 929 rules.
- MIHOMO-MRS: inherited CMFA partial `.mrs` architecture: 424 providers use `.mrs`, 30 residual YAML and 20 original formats.
- COMPAT: continued removing Mihomo-only fields not confirmed by Stash Wiki. Static YAML uses final `.mrs` / residual YAML URLs directly, without a JS compatibility map.

## v5.4.38-stash.1 (2026-07-09)

- SCKI-SUPPLEMENTAL: regenerated from CMFA v5.4.38-cmfa.1, retaining 429 rule-providers and 884 rules.
- MIHOMO-MRS: inherited CMFA migration, with 366 providers using `.mrs`, while continuing to trim unconfirmed Mihomo-only fields.
- COMPAT: Stash continues trimming Mihomo-only fields; supplemental sets use recognizable native rule-provider structures.

## v5.4.37-stash.1 (2026-07-07)

- FEAT#173-STASH: added `独立内核系/Stash/Stash.yaml`, automatically trimmed from CMFA by `tools/generate-stash-from-cmfa.js`.
- SYNC: retained Clash Party v5.4.37 / CMFA v5.4.37-cmfa.1 totals: 22 regional groups, 33 service groups, 376 rule-providers and 1000 rules.
- COMPAT: removed Mihomo extensions unconfirmed by Stash Wiki: GeoX auto-update, sniffer, provider `health-check` / `exclude-filter`, rule-provider download `proxy`, and Mihomo DNS fallback/direct/proxy-server nameserver fields.
- DNS: changed `default-nameserver` to plaintext IPs compatible with official Stash examples. Retained China/international-category `nameserver-policy` and complete `fake-ip-filter`.
- VERIFY: added Stash contracts to `tools/validate-artifact-contracts.js`; CI path triggers include `独立内核系/Stash/**/*.yaml` and `tools/generate-stash-from-cmfa.js`.
