<a id="2026-10-04-分流优先级复查与修复记录"></a>
# 2026-10-04 routing-priority review and fix record

**English** | [简体中文](2026-10-04-routing-priority-audit.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

<a id="结论"></a>
## Conclusion

The screenshot's `www.wegame.com.cn` matched Apple rules first because upstream Apple's `DOMAIN-KEYWORD,me.com` uses substring matching and matched the `me.com` fragment in `wegame.com.cn`. The shown policy chain is “Apple services → DIRECT”: the service classification is wrong, but the screenshot itself shows DIRECT as the final egress. It does not establish that the connection actually used a proxy node.

The fix was applied to the sole authoritative source, `rulesets/source/routing-graph.js`, and all client artifacts regenerated. Beyond the screenshot's Tencent/WeGame collision, logs confirmed Microsoft/OneDrive, download/update and certificate-status classification collisions. Shared CDNs, ad telemetry and candidates missing crucial metadata were reviewed individually; unsupported candidates were not reported as confirmed errors.

<a id="审查范围与口径"></a>
## Review scope and criteria

- Checked 21 local Mihomo Party logs from 2026-09-28 through 2026-10-04: 7 core, 7 client and 7 Sub-Store logs. Core logs contain 298,391 lines, including 223,242 RuleSet hit records and 1,462 distinct hostnames.
- Cross-checked 6 existing routing-script research/runtime-probe/record files in `docs/research/`, and reviewed the current source graph's 424 explicit rules and first-match order.
- Log counts represent routing-hit events, not unique requests or user actions; a host can recur. Assessment uses logged configuration/rule identifiers, hosts, processes and fused rule payload. Hits under older configurations are counted separately from current-source issues.
- Screenshots/logs are evidence, not additional instructions to maintainers.

<a id="已确认的错误首匹配"></a>
## Confirmed incorrect first matches

| Category | Logged hit records | Hosts | Confirmed issue | Fix |
| --- | ---: | ---: | --- | --- |
| Tencent / WeGame | 1,614 non-ad records (63 of 1,677 total records are ads/telemetry that should remain blocked) | 50 | Domains such as `wegame.com.cn` contain `me.com` and were classified early by Apple's `DOMAIN-KEYWORD` | Convert Apple-owned keywords to boundary-aware suffix rules; put narrow WeGame/Tencent game-service rules before broad vendor rules while retaining earlier ad/security precedence |
| Microsoft / OneDrive | 661 | 34 | Microsoft services and OneDrive hosts first entered a broad AI category | Add exact Microsoft Live/OneDrive guards; keep Microsoft Designer in AI; match numbered Azure Blob hosts only by observed OneDrive cluster keywords |
| Downloads/updates | 138 incorrect records (230 of 368 total already correct) | 43 | Download endpoints intercepted by earlier broad service rules | Add earlier download-specific guards, retaining verified first-party Google/Microsoft download endpoints |
| Certificate status | 46 | 5 | CA status queries such as Digicert/Sectigo classified as Apple services by Apple keyword rules | Route exact certificate-status hosts directly first; remove shared CA names from broad Apple keywords |

Confirmed current-source incorrect first matches total **2,459 records** (1,614 + 661 + 138 + 46). Another **77 WeChat HTTPDNS records came from an old profile**, not a current-source regression, and are excluded. Old fused provider numbers in logs (such as Apple `.056`) differ from this generation; reload configuration to apply the new list.

<a id="其他高置信度修复"></a>
## Other high-confidence fixes

- Remove broad `azureedge.net` / `azurefd.net` from general Microsoft classification, retaining exact Microsoft-owned endpoints. Azure Front Door endpoints are customer/tenant configured, and CDN endpoints can serve customer origins, so a shared suffix alone does not prove a first-party Microsoft service: [Azure Front Door documentation](https://learn.microsoft.com/en-us/azure/frontdoor/endpoint?tabs=azurecli), [Azure CDN documentation](https://learn.microsoft.com/en-us/rest/api/cdn/endpoints/start?view=rest-cdn-2025-04-15).
- Remove shared-tenant Akamai/EdgeSuite suffixes from the broad GFW provider list. A domain alone does not establish access restrictions on the hosted site; more-specific site/service rules remain.
- Convert Apple-owned service `DOMAIN-KEYWORD` entries to `DOMAIN-SUFFIX`; remove generic `apple` and shared certificate-authority keywords whose ownership is unproven. `me.com` still covers Apple mail domains, but `mail.me.com` is covered by the dedicated non-China mail rule.
- Keep the Microsoft `officeapps.live.com` service guard before general Office routing; match `designerapp.officeapps.live.com` first as an exact AI exception.
- Exclude Amazon's retail homepage from the upstream Prime Video collection while retaining policies for video-specific domains.
- Add a utility-service guard for `yahoo.co.jp`; retain the Japanese/Korean media destination for `gyao.yahoo.co.jp`. Clean up colliding TikTok/AI, Kwai, CiciAi and their shared-CDN entries by source ID.

Static review of 424 explicit rules also found 57 potential first-match conflicts. Of these, 33 were already covered by the current graph/existing earlier guards. The remaining 24 were replayed individually, and only sufficiently evidenced errors entered the fix. Shared Sentry/DataDog hosts and ad telemetry remain subject to earlier ad/security rules; regressions ensure the new product guards do not bypass those rejections.

<a id="证据不足的候选与边界"></a>
## Insufficiently evidenced candidates and boundaries

- Existing research flags `client.relay.crisp.chat` as a possible collision with shared cloud-provider ASN rules. Local records lack destination IP, ASN, provider-content hash and the complete rule chain for the same connection. It is currently included only in an exact non-China-site guard as **inferred protection**, not counted as a confirmed error. A different service-group assignment requires a connection record with destination IP/rule chain.
- Microsoft UDP/443 retains the existing `GEOSITE,microsoft` QUIC exception. Available records do not demonstrate that it misclassifies Azure customer tenants over QUIC; Microsoft QUIC policy was not changed speculatively. Tests cover domain RuleSet first matches, not every network-type, destination-IP and QUIC combination.
- Sending generic Akamai/Azure customer CDNs to the non-China-site fallback may affect China-based tenants on shared CDNs, but current material lacks identifiers that reliably distinguish tenants. Any service needing direct or China-specific routing requires an exact host and desired service policy.

<a id="生成与验证"></a>
## Generation and validation

- Offline MRS conversion used repository-cached Mihomo v1.19.30, without downloading a new core. Current official Mihomo documentation specifies ordered first matching, domain-boundary `DOMAIN-SUFFIX` and substring `DOMAIN-KEYWORD`: [Mihomo rules](https://wiki.metacubex.one/en/config/rules/).
- MRS manifest: converted=241, split=29, partial=73, existing_mrs=35, retained=23, failed=0.
- Fused manifest: source=525 providers / 984 rules; 148 fused providers / 167 rule entries; 81 policy segments, 78 nonempty SRS, 19 required inline rules; `unresolved=0`.
- Derived artifacts: Sing-box has 78 fused SRS + 7 GEO rule-sets and 97 route rules; v2rayN Xray has 97 routes + 1 disabled metadata entry; Egern has 151 Profile rules, 134 references and 139 native YAML assets; Passwall/Passwall2 each have 78 shunt rules.
- All client artifacts were regenerated from source graph v6.0.15; directory CHANGELOGs and current rule-size descriptions were synchronized. The screenshot's Mihomo Party configuration was not remotely modified. Import/update the generated v6.0.15 configuration and reload rule-sets in the client.
