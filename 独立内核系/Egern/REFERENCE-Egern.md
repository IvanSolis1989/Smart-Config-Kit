<a id="egern-语法参考与纳入判断"></a>
# Egern syntax reference and inclusion assessment

**English** | [简体中文](REFERENCE-Egern.zh-CN.md)


> Updated on 2026-11-28 (previous review 2026-10-28). Verified the Apple storefront and the official policy group, routing rule, and DNS references.

> Reviewed on 2026-10-28: only GoogleFCM moved from downloads/updates to Google services. [Egern Rules](https://egernapp.com/docs/configuration/rules/) was rechecked; existing native targets and ordered matching were retained without introducing Mihomo MRS. DNS, fake-IP, sniffing, other push services, and node groups were unchanged. No fields, minimum versions, or device-pass claims were added.

> Updated on 2026-10-19 (previous field review: 2026-09-30). See the [Apple-client review](../../docs/upstream/2026-10-19/apple/report.md) and [cache receipt](../../docs/upstream/2026-10-19/apple/manifest.json) for complete official text, versions, and verification gaps.

<a id="当前复核结论"></a>
## Current review conclusions

- Apple US/JP lists Egern 2.21.0, published 2026-11-05 JST. The release notes confirm source IP rules, SSR, Tailscale, and a fix for Fake-IP pool exhaustion. [Apple release record](https://itunes.apple.com/lookup?id=1616105820&country=us)
- [Policy Groups](https://egernapp.com/docs/configuration/policy_groups/) allows basic groups to attach `urls` directly and mix static nodes. `external` remains compatible; existing Subscribe/flatten/filter does not require migration.
- Egern `smart` uses its own health scores and actual failure feedback. The existing 22 native smart groups consume client improvements, not Mihomo LightGBM.
- [Rules](https://egernapp.com/docs/configuration/rules/) still uses native YAML sets and remote `rule_set`. No MRS or Clash PROCESS-NAME support evidence was obtained; generated conversion and process-rule exceptions remain.
- App Store 2.21.0 release notes list `SRC-IP`, but the public routing manual still omits the native YAML field and rule-set schema. The generated profile omits that predicate. Confirm the exact syntax from a native export and verify that two sources reaching the same destination can select different policies before adding any projection. Destination `ip_cidr` matches a different connection field. [Apple release record](https://itunes.apple.com/lookup?id=1616105820&country=us) · [Official rule types](https://egernapp.com/docs/configuration/rules/#supported-rules)
- Default DNS takes the first matching `forward` entry. Explicit `proxy_nameservers` bypasses `forward` for proxy DNS and always connects directly to its resolvers. The profile uses literal DoH URLs. Version 2.21.0 also lists upstream group names in `proxy_nameservers`, while the DNS manual examples still use resolver addresses. Retain the existing explicit addresses. If evaluating a native export with group names, compare default and proxy lookups and check fallback and reachability independently. [Official DNS](https://egernapp.com/docs/configuration/dns/#proxy-nameservers-forced-upstream-for-proxy-dns) · [Apple release record](https://itunes.apple.com/lookup?id=1616105820&country=us)

<a id="历史摘要边界"></a>
## Historical-summary boundaries

The earlier summary below is retained. Fixed rule/asset counts describe old outputs, not current promises; read current counts from the profile and generated manifest. Real-app import and node-expansion acceptance have not been completed.

> 2026-10-15 URL compatibility review: [official Rules documentation](https://egernapp.com/docs/configuration/rules/) demonstrates an HTTPS URL in `rule_set.match` with `update_interval`. Only repository-owned rule URL hosts changed, not Egern’s native YAML structure. See [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md).

> 2026-09-30 review: [official proxy types](https://egernapp.com/docs/configuration/proxies/) does not list Mihomo named direct/reject types. Mihomo type-filter fields were not mapped to unconfirmed Egern fields. Only derived metadata/hash manifests were refreshed from final CMFA; native assets and service-group content were unchanged.

<a id="结论"></a>
## Conclusion

Egern warrants inclusion and is already a formally synchronized repository output.

Its capabilities can carry this repository’s routing model: subscription-backed `external` groups, regional `smart` selection, service `select` groups, ordered rules, remote `rule_set`, and DNS forwarding. The limitation is rule-set format: official Egern documentation does not claim direct Mihomo `.mrs` consumption; Egern uses its own fields.

Accordingly, v5.4.39-egern.1 established formal synchronization:

- Generate `独立内核系/Egern/Egern.yaml` from CMFA.
- Preserve 22 regional and 33 service groups.
- Render 927 Egern main rules and 484 top-level `rule_set` entries.
- Use native sets at `rulesets/generated/egern/*.yaml`, including `provider-scki-*.yaml` converted from supplemental sets.
- Do not scatter isolated domain/IP entries through main rules.

Explicit exclusions:

- Do not directly reuse Mihomo `.mrs`; map it to repository-generated native Egern YAML sets.
- Do not synchronize desktop `PROCESS-NAME` rules.

<a id="官方语法依据"></a>
## Official syntax references

- Policy Groups: Egern supports `select`, `auto_test`, `smart`, `fallback`, `load_balance`, `external`, and `conditional`; `external` can load subscriptions.
  <https://egernapp.com/docs/configuration/policy_groups/>
- Rules: first match in listed order wins; `rule_set` references local or remote sets.
  <https://egernapp.com/docs/configuration/rules/>
- Rule Sets: remote sets use YAML fields such as `domain_set`, `domain_suffix_set`, `domain_keyword_set`, `ip_cidr_set`, and `ip_cidr6_set`.
  <https://egernapp.com/docs/configuration/rules/>
- DNS: `bootstrap`, `upstreams`, `forward`, and `proxy_nameservers` can express the repository’s China/non-China/proxy DNS layers.
  <https://egernapp.com/docs/configuration/dns/>
- Profile: top-level fields include `policy_groups`, `rules`, `dns`, `default_subscription_group`, and `default_proxy_group`.
  <https://egernapp.com/docs/configuration/example/>
- Mihomo Rule Providers: `format` supports `yaml` / `text` / `mrs`; `.mrs` supports `domain` / `ipcidr`, so MRS remains for Clash Party / CMFA.
  <https://wiki.metacubex.one/en/config/rule-providers/>

<a id="转换边界"></a>
## Conversion boundaries

1. Clash Party / CMFA continue preferring `.mrs`, Mihomo’s officially supported compact format.
2. The Egern generator maps `.mrs` URLs to `rulesets/generated/egern/*.yaml`; Hagezi TIF is also generated as repository-native Egern YAML.
3. `GEOSITE` / non-country `GEOIP` use MetaCubeX YAML sources; country `GEOIP,CN` uses native Egern `geoip`.
4. `PROCESS-NAME` is not synchronized. This is a platform rule-capability limitation, not a preview omission.
5. Mihomo DNS `nameserver-policy` is not copied field by field; Egern `dns.forward` is used instead.
