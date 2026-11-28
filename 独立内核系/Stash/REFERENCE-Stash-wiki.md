<a id="reference--stash-wiki"></a>
# REFERENCE — Stash Wiki

**English** | [简体中文](REFERENCE-Stash-wiki.zh-CN.md)


> Updated on 2026-11-28 (previous review 2026-10-28). Verified the current Apple storefront, Mac update feed, and official DNS, policy group, rule, and HTTP API references.

> Reviewed on 2026-10-28: only GoogleFCM moved from downloads/updates to Google services. [Stash rule types](https://stash.wiki/rules/rule-types) was rechecked; rule targets and existing domain/ipcidr formats were retained. DNS, fake-IP, sniffing, other push services, and node groups were unchanged; no fields, minimum versions, or device-pass claims were added.

> Reviewed on 2026-10-23 (previous focused review: 2026-10-20): [DNS](https://stash.wiki/en/features/dns-server#domain-based-custom-dns-service) and the [configuration example](https://stash.wiki/en/configuration/example-config) were reread. Existing nameserver-policy domain/geosite keys and server arrays remain supported; no new field was enabled.

> Updated on 2026-10-19 (original field summary: 2026-08-08). See the [Apple-client review](../../docs/upstream/2026-10-19/apple/report.md) for actual official text, versions, and adoption boundaries; the [cache receipt](../../docs/upstream/2026-10-19/apple/manifest.json) supports independent readback.

<a id="当前复核结论"></a>
## Current review conclusions

- The Apple storefront lists 5.0.0 for iOS/iPadOS/tvOS (2026-11-15 JST). The Mac update feed lists 5.0.0 build 607 on the stable channel (2026-11-15 JST) and 5.1.0 build 609 on the beta channel (2026-11-18 JST). [Apple App Store](https://apps.apple.com/us/app/stash-rule-based-proxy/id1596063349?platform=appleTV) · [Mac update feed](https://releases.stash.ws/appcast.xml)
- [Rule Set](https://stash.wiki/en/rules/rule-set) confirms domain/ipcidr MRS; existing fused MRS is retained. Inline providers are optional on iOS/tvOS 3.6+/Mac 4.3+, not a replacement for large remote sets.
- Stable Stash supports encrypted `default-nameserver` with IP endpoints (or the special value `system`), an independent `proxy-server-nameserver`, and `rule-set:` selectors in DNS. `fallback-filter` applies only when `fallback` is configured. With `follow-rule` enabled, use an independent bootstrap path for proxy hostnames to avoid DNS dependency loops. The generated profile selects plaintext bootstrap IPs and uses `nameserver-policy` for service DNS. [DNS reference](https://stash.wiki/en/features/dns-server)
- [Policy groups](https://stash.wiki/en/proxy-protocols/proxy-groups) now explicitly specifies `tolerance` in milliseconds. CMFA’s 10 ms value is expressible, but the initial introducing version was not obtained; the protected generator is unchanged. Earlier “tolerance unconfirmed” reasoning explains historical trimming only.
- Stash 5.1 beta documents native `smart`, `policy-priority`, `include-all-proxies`, `include-all-providers`, `exclude-filter`, and `exclude-type` on groups. Native `smart` uses traffic observations and on-demand probes and omits `interval` and `lazy`. Group-level `exclude-type` uses full protocol names and applies across the assembled member list. Empty groups resolve to `DIRECT`. The shipped profile uses `url-test` and explicit provider membership. The beta `proxy-server-nameserver-policy` requires `proxy-server-nameserver` alongside it. [Smart groups](https://stash.wiki/en/proxy-protocols/smart-group) · [Group fields](https://stash.wiki/en/proxy-protocols/proxy-groups#member-assembly-and-filtering) · [Proxy DNS policy](https://stash.wiki/en/features/dns-server#proxy-server-nameserver-policy)
- Stash 5.0 `pre-matching` evaluates at DNS or ingress before ordinary rule evaluation. Only built-in rejection targets are valid. A normal earlier rule cannot shield a domain from an early rejection. Keep ordinary matching for the profile’s selectable ad group and its preceding DIRECT, payment, and AI exceptions. For a routing check on a trusted controller, `GET /rules/match?target=example.com&resolve=false` reports the simulated rule and outbound and exposes `stage` for early rejection. Compare representative protected and blocked destinations. The simulation omits live application behavior and does not open a connection. [Rule options](https://stash.wiki/en/rules/rule-types#pre-matching) · [HTTP API](https://stash.wiki/en/features/http-api#rules)

<a id="历史摘要边界"></a>
## Historical-summary boundaries

Earlier evidence and trimming behavior are retained below. Conflicting unsupported/unconfirmed claims are historical conclusions. Adopting new capabilities requires separate minimum-version decisions, generator authorization, and actual-app import validation.

> 2026-10-15 URL compatibility review: [official Rule Sets documentation](https://stash.wiki/en/rules/rule-set) demonstrates remote-provider HTTPS `url` and name-based `RULE-SET`. Only repository-owned URL hosts changed; no fields were added/removed. See [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md).

> 2026-10-07 review: official [proxy types](https://stash.wiki/en/proxy-protocols/proxy-types#direct-with-specified-interface) supports named direct outbounds. [Policy groups](https://stash.wiki/en/proxy-protocols/proxy-groups) explicitly supports `interval` / `lazy` and treats empty pools as DIRECT. Groups and [remote providers](https://stash.wiki/en/proxy-protocols/proxy-providers) do not document equivalents of `exclude-type` / `empty-fallback`. Compatibility trimming remains; separate health-check providers from named support outbounds in aggregation, and verify dialer dependencies.

> Directory purpose: official documentation evidence for the Stash output. Last checked: 2026-08-08.

<a id="官方来源"></a>
## Official sources

| Topic | Official link | Repository interpretation |
|---|---|---|
| Configuration structure | https://stash.wiki/en/configuration/example-config | One YAML file may contain `mode`, `hosts`, `dns`, `proxy-providers`, `proxy-groups`, `rule-providers`, and `rules`. |
| Remote proxy providers | https://stash.wiki/en/proxy-protocols/proxy-providers | `proxy-providers` supports `url`, `interval`, `path`, `filter`, and `headers`, referenced via `proxy-groups.use`. Documentation does not list `type: http`, `health-check`, or `exclude-filter`. |
| Policy groups | https://stash.wiki/en/proxy-protocols/proxy-groups | Supports `select`, `url-test`, nested groups, remote providers, regex `filter`, `interval`, and `lazy`. Empty groups use `DIRECT`. |
| Rule sets | https://stash.wiki/en/rules/rule-set | `rule-providers` must be referenced by `RULE-SET` in `rules`; supports `domain`, `ipcidr`, and `classical`. MRS supports only `domain` / `ipcidr`. |
| Rule types | https://stash.wiki/en/rules/rule-types | Domain, IP/port, protocol, logical, and compound rules; top-to-bottom matching. |
| DNS example | https://stash.wiki/en/features/dns-server | `default-nameserver` accepts plaintext or encrypted IP endpoints and `system`. `nameserver-policy` accepts domains, `geosite:`, and `rule-set:` selectors. |
| Built-in DNS | https://stash.wiki/en/features/dns-server | DNS queries are direct by default; avoid recursive-resolution risks before enabling follow-rule. |
| Override | https://stash.wiki/en/configuration/override | `.stoverride` is optional; this repository does not currently generate it. |
| Proxy types | https://stash.wiki/en/proxy-protocols/proxy-types | Shadowsocks / Shadowsocks2022, ShadowsocksR, SOCKS5, HTTP, VMess, Snell, Trojan, AnyTLS, TrustTunnel, Hysteria, Hysteria2, VLESS, TUIC, Juicity, WireGuard, Tailscale, SSH, and others. ShadowTLS v2/v3 is supported as a Shadowsocks plugin. |
| App Store description | https://apps.apple.com/app/stash-rule-based-proxy/id1596063349 | Claims Clash Premium compatibility, Rule Set, HTTP rewrite, MitM, SSID policy, On-Demand, TCP/UDP/ICMP, and DNS over TCP/TLS/HTTPS. |

<a id="生成裁剪规则"></a>
## Generator trimming rules

`独立内核系/Stash/Stash.yaml` is not a wholesale CMFA copy. `tools/generate-stash-from-cmfa.js` applies these fixed transformations:

1. Rewrite the header version to `vX.Y.Z-stash.N`, retaining Clash Party and CMFA baselines.
2. Remove Mihomo-specific top-level fields not confirmed in Stash Wiki: `bind-address`, `unified-delay`, `tcp-concurrent`, `find-process-mode`, `keep-alive-*`, `geodata-mode`, `geo-auto-update`, `geo-update-interval`, `geox-url`, `profile`, and `sniffer`.
3. Retain only documented DNS fields: `enable`, `ipv6`, `enhanced-mode`, `fake-ip-range`, `fake-ip-filter`, `default-nameserver`, `nameserver`, and `nameserver-policy`.
4. Set `default-nameserver` to plaintext IPs: `223.5.5.5`, `119.29.29.29`, `1.1.1.1`, `8.8.8.8`.
5. Keep only `url`, `interval`, and `path` in `proxy-providers.Subscribe`; remove CMFA’s `type: http`, `health-check`, and `exclude-filter`.
6. Retain `select` / `url-test` / `use` / `filter` / `proxies` / `interval` in `proxy-groups`. Both `standard` (300 seconds) and `power-save` (900 seconds) preserve explicitly set `lazy: true`, confirmed by official group documentation. The current projection omits `tolerance`, `exclude-type`, and `empty-fallback`.
7. Remove rule-provider download `proxy`, which Stash Wiki’s rule-set documentation does not list.
8. Preserve `rules`; contract checks still validate critical ordering for AMap, Douyin, China games, Cloudflare R2, STUN ports, and related rules.

<a id="未解决风险"></a>
## Unresolved risks

- No screenshot-level import acceptance in a real Stash app has been completed. Current checks cover YAML structure and documented field alignment.
- Without the rule-provider download proxy field, initial GitHub/jsDelivr rule downloads on restricted networks depend on Stash’s effective network environment.
- A Stash 5.1 beta configuration needs separate App checks for member assembly, empty groups, DNS bootstrap, and switching between healthy and failed nodes. The published profile uses stable `url-test` groups.

<a id="2026-10-20-业务-dns-policy-复核"></a>
### 2026-10-20 service-DNS policy review

Stash retains native DNS-policy expression/handling based on [Stash DNS server documentation](https://stash.wiki/en/features/dns-server). This revision derives policy projection from CMFA, without directly injecting Mihomo’s source table into other clients or changing group structure/node selection.
