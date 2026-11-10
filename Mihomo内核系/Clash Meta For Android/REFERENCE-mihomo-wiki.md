<a id="mihomo-metacubex-官方配置文档参考"></a>
# Mihomo (MetaCubeX) official-configuration reference

**English** | [简体中文](REFERENCE-mihomo-wiki.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

> Reviewed 2026-10-28: GoogleFCM was moved only from downloads/updates to Google services. [Mihomo routing rules](https://wiki.metacubex.one/config/rules/) were reviewed; CMFA’s existing RULE-SET policy-name references remain. DNS, fake-IP, sniffing, other push traffic, and node groups are unchanged. No fields, minimum versions, or device-success claims were added.

> Reviewed 2026-10-23 (previous topic review 2026-10-20): [Mihomo DNS](https://wiki.metacubex.one/config/dns/#nameserver-policy) and the [official CMFA repository](https://github.com/MetaCubeX/ClashMetaForAndroid) were reread. The policy table retains existing Mihomo fields and app-owned boundaries.

> Reviewed 2026-10-19: CMFA stable v2.11.35 / Prerelease-alpha were checked. Stable app core gitlink: `88dcbf7f1614a67c3b36b848ee3592dfa92ada36`. App versions are not Mihomo versions. Official DNS, group filtering, MRS, rule, and TUN documentation was reviewed. ClashMi/ShellCrash override boundaries are also in the [review report](../../docs/upstream/2026-10-19/mihomo/report.md). Summaries below belong to their historical dates and were not all revalidated paragraph by paragraph.

> URL compatibility review, 2026-10-15: [official rule-provider documentation](https://wiki.metacubex.one/en/config/rule-providers/) requires `url` for `type: http` and demonstrates HTTPS raw URLs. Only repository-owned rule URL hosts changed, not Mihomo fields. Clash Party, CMFA, OpenClash, and FlClash share this field evidence. See [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md).

> Review, 2026-09-30: [group](https://wiki.metacubex.one/config/proxy-groups/) `exclude-type` / `empty-fallback` exclude direct/reject test candidates and provide explicit REJECT empty-pool fallback. Although documentation wording about included members is ambiguous, [v1.19.31 core](https://github.com/MetaCubeX/mihomo/blob/v1.19.31/adapter/outboundgroup/groupbase.go#L211-L225) iterates merged members. Actual v1.19.29 controller tests already established effect on `use: Subscribe` while preserving provider dialer dependencies; see [follow-up acceptance](../../docs/research/2026-09-30-routing-runtime-followup.md).

> Retrieved from https://wiki.metacubex.one/ (2026-04-26).
> Updated 2026-04-30: latest stable v1.19.24 (2026-04-20). v1.19.17 removed relay groups in favor of dialer-proxy; the repository does not use relay and was unaffected. v1.19.24 added XHTTP H3/HTTP1.1 and BBR profiles. The historical entry reported no Smart/LightGBM field changes.
> Updated 2026-05-30: batch A #5 used WebFetch `wiki/config/dns` and WebSearch to confirm `direct-nameserver-follow-policy`: default `false` ignores nameserver-policy; `true` follows it for direct-outbound resolution, effective only when direct-nameserver is nonempty. The documented use case is direct resolution through China-based DoH plus domain-specific policy DNS. It belongs to the same field family as direct-nameserver; the repository already used that field, so setting true was recorded as not raising the minimum core requirement.
> Updated 2026-05-30: default-nameserver wording corrected from “IP, not hostname” to “IP; **encrypted DNS allowed**.” Host must be an IP, but tls://IP / https://IP/dns-query are valid. Original official wording retained: “必须为 IP, 可为加密 DNS”.
> Updated 2026-07-14: official routing-rules page reviewed (page updated 2026-07-08). `PROCESS-NAME,<进程名>,<策略>` remains an official exact-process rule. No field/semantic changes for `WorkPro.exe` / `WorkProWebProcess.exe`.
> Updated 2026-08-08: official group configuration reviewed (page updated 2026-07-18). `filter` remains regex filtering on `use` / `include-all-proxies`, with multiple patterns separated by `|` in this historical reference. Only input-syntax validation was added, not field changes.
> This local reference supports compatibility reviews of repository configurations against official documentation.

---

<a id="1-代理组配置-proxy-groups"></a>
## 1. Proxy groups (proxy-groups)

**Documentation source**: https://wiki.metacubex.one/config/proxy-groups/

<a id="通用字段-common-options"></a>
### Common options

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | Yes | Group name; quote special characters |
| `type` | string | Yes | Group type; values below |
| `proxies` | list | No | Reference outbounds or other groups |
| `use` | list | No | Reference proxy-providers |
| `url` | string | No | Test address; tests only nodes listed in `proxies` |
| `interval` | int | No | Test interval in seconds |
| `lazy` | bool | No | Default true; do not test an unselected group |
| `timeout` | int | No | Test timeout in milliseconds |
| `max-failed-times` | int | No | Maximum failures, default 5 |
| `disable-udp` | bool | No | Disable UDP |
| `interface-name` | string | No | **Deprecated**; configure on nodes instead |
| `routing-mark` | int | No | **Deprecated**; configure on nodes instead |
| `include-all` | bool | No | Include all outbounds and providers, excluding other groups |
| `include-all-proxies` | bool | No | Include all outbounds, excluding other groups |
| `include-all-providers` | bool | No | Include all providers; overrides `use` |
| `filter` | string | No | Regex inclusion; separate multiple patterns with `|`; applies only to `use` and `include-all-*` |
| `exclude-filter` | string | No | Regex exclusion; separate multiple patterns with `|` |
| `exclude-type` | string | No | Exclude types separated by `|`; no regex |
| `expected-status` | string | No | Expected HTTP status; `/` separates values, `-` ranges |
| `hidden` | bool | No | Hide in API |
| `icon` | string | No | Icon URL |

<a id="type-有效值"></a>
### Valid `type` values

| Value | Description |
|----|------|
| `select` | Manual selection |
| `url-test` | Test latency and choose the lowest-latency node |
| `fallback` | First available node in priority order |
| `load-balance` | Round-robin load balancing |
| `relay` | Relay chain; historical entry, see dated removal notice above |
| `smart` | AI selection (historically described as Smart core v1.18.0+) |

<a id="smart-类型特有字段"></a>
### Smart-specific fields

These historical entries are retained for traceability, not a new claim about current SmartOption:

| Field | Type | Description |
|------|------|------|
| `uselightgbm` | bool/string | Use LightGBM weight prediction; `false` or `smart` |
| `collectdata` | bool | Collect training data |
| `strategy` | string | Historical strategy: `sticky-sessions` (default, hash-based) or `round-robin` |
| `policy-priority` | string | Manual weights: `"Premium:0.9;SG:1.3"` |
| `tolerance` | int | Latency tolerance in milliseconds to reduce frequent switches |

<a id="filter-字段语法"></a>
### `filter` syntax

- Go RE2 regex syntax.
- Multiple regex patterns separated by `|`.
- **Substring matching**, not word boundaries.
- Example: `TW` matches `TWN`, `TW01`, and similar names.
- Example: `(?i)港|hk|hongkong|hong kong`.

<a id="yaml-锚点别名支持"></a>
### YAML anchor/alias support

- mihomo uses `gopkg.in/yaml.v3` and **supports** anchors (`&anchor`) and aliases (`*anchor`).
- Map merging (`<<:`) is supported.
- The historical reference records templating through `rule-anchor`.

---

<a id="2-代理集合配置-proxy-providers"></a>
## 2. Proxy providers (proxy-providers)

**Documentation source**: https://wiki.metacubex.one/config/proxy-providers/

<a id="字段说明"></a>
### Fields

| Field | Description |
|------|------|
| `type` | Required: `http` / `file` / `inline` |
| `url` | Required for `http` |
| `path` | Unique file path; defaults to URL MD5 filename if omitted |
| `interval` | Update interval in seconds |
| `proxy` | Proxy used for downloads/updates |
| `size-limit` | Maximum download bytes; 0 means unlimited |
| `header` | Custom HTTP request headers |
| `health-check` | Latency-test settings |
| `override` | Override node content, e.g. additional-prefix, additional-suffix, proxy-name |
| `filter` | Regex inclusion; multiple patterns separated by `` ` `` |
| `exclude-filter` | Regex exclusion; multiple patterns separated by `` ` `` |
| `exclude-type` | Exclude types separated by `|`, without regex |
| `payload` | Active for `inline`; can also back up failed http/file parsing |

<a id="health-check-子字段"></a>
### health-check fields

| Field | Type | Description |
|------|------|------|
| `enable` | bool | Enable testing |
| `url` | string | Test address; historical recommendations: `https://cp.cloudflare.com` or `https://www.gstatic.com/generate_204` |
| `interval` | int | Seconds between tests |
| `timeout` | int | Test timeout in milliseconds |
| `lazy` | bool | Default true; do not test an unused node |
| `expected-status` | string | Expected status code |

---

<a id="3-规则集合配置-rule-providers"></a>
## 3. Rule providers (rule-providers)

**Documentation source**: https://wiki.metacubex.one/config/rule-providers/

<a id="字段说明-1"></a>
### Fields

| Field | Type | Description |
|------|------|------|
| `type` | string | Required: `http` / `file` / `inline` |
| `url` | string | Required for `http` |
| `path` | string | Optional path; defaults to URL MD5 filename |
| `interval` | int | Update interval in seconds |
| `proxy` | string | Proxy for download/update |
| `behavior` | string | `domain` / `ipcidr` / `classical` |
| `format` | string | `yaml` (default) / `text` / `mrs` |
| `size-limit` | int | Maximum download bytes; 0 means unlimited |
| `header` | object | Custom HTTP request headers |
| `payload` | list | Active for `inline` |

<a id="behavior-说明"></a>
### behavior

| Value | Description |
|----|------|
| `domain` | Domain rule file |
| `ipcidr` | IP/CIDR rule file |
| `classical` | Classic Clash rules with type prefixes such as `DOMAIN-`/`DOMAIN-SUFFIX`/`IP-CIDR` |

<a id="format-说明"></a>
### format

| Value | Description |
|----|------|
| `yaml` | YAML, default |
| `text` | One rule per text line |
| `mrs` | Binary rule set; only `domain` / `ipcidr` behavior |

<a id="rule-set-引用语法"></a>
### RULE-SET reference syntax

```yaml
rules:
  - RULE-SET,google,🤖 AI 服务
  - RULE-SET,tiktok,📱 社交媒体
  - MATCH,🐟 漏网之鱼
```

---

<a id="4-dns-配置"></a>
## 4. DNS configuration

**Documentation source**: https://wiki.metacubex.one/config/dns/

<a id="字段说明-2"></a>
### Fields

| Field | Description |
|------|------|
| `enable` | Enable DNS |
| `cache-algorithm` | `lru` (default) / `arc` |
| `prefer-h3` | Prefer HTTP/3 for DoH |
| `listen` | DNS service listen address |
| `ipv6` | Resolve IPv6 |
| `enhanced-mode` | `fake-ip` / `redir-host` (default) |
| `fake-ip-range` | Fake-IP range, default `198.18.0.1/16` |
| `fake-ip-range6` | IPv6 Fake-IP range |
| `fake-ip-filter` | Fake-IP filtering; supports domain wildcards and imported domain sets |
| `fake-ip-filter-mode` | `blacklist` (default) / `whitelist` / `rule` |
| `fake-ip-ttl` | TTL in Fake-IP answers |
| `use-hosts` | Answer from configured hosts; default true |
| `use-system-hosts` | Query system hosts; default true |
| `respect-rules` | DNS connections follow routing rules; requires `proxy-server-nameserver` |
| `default-nameserver` | **Must use IP hosts; encrypted DNS is allowed.** Schemes may be tls:// / https://, e.g. `tls://223.5.5.5` and `https://223.5.5.5/dns-query`; hostname endpoints are invalid here |
| `nameserver-policy` | Specific DNS servers for specific domains; keys accept domain wildcards and geosite |
| `nameserver` | Default domain resolvers |
| `fallback` | Backup domain resolvers |
| `proxy-server-nameserver` | Proxy-node domain resolvers |
| `proxy-server-nameserver-policy` | Node-domain resolution policies |
| `direct-nameserver` | DNS servers for direct outbounds |
| `direct-nameserver-follow-policy` | Follow nameserver-policy; default **false**, meaning ignore it. Effective only with nonempty direct-nameserver. Repository v5.4.19+ sets `true` so direct-outbound domain resolution follows policy |
| `fallback-filter` | Backup DNS filter, including `geoip` / `geoip-code` / `geosite` / `ipcidr` / `domain` |


<a id="fake-ip-filter-mode-rule-模式"></a>
### fake-ip-filter-mode: rule

With `fake-ip-filter-mode: rule`, `fake-ip-filter` syntax changes:

```yaml
dns:
  fake-ip-filter-mode: rule
  fake-ip-filter:
    - RULE-SET,reject-domain,fake-ip
    - RULE-SET,proxy-domain,fake-ip
    - GEOSITE,gfw,fake-ip
    - DOMAIN,www.baidu.com,real-ip
    - DOMAIN-SUFFIX,qq.com,real-ip
    - DOMAIN-SUFFIX,jd.com,fake-ip
    - MATCH,fake-ip
```

<a id="dns-附加参数"></a>
### Additional DNS parameters

Append parameters to server addresses with `#`, joining them with `&`:

- `proxy`: connect through a specified proxy.
- `interface`: connect through a specified interface.
- `h3`: force HTTP/3.
- `skip-cert-verify`: skip TLS certificate verification.
- `ecs`: specify EDNS Client Subnet.
- `ecs-override`: force ECS override.
- `disable-ipv4` / `disable-ipv6`.
- `disable-qtype-<int>`.

---

<a id="5-sniffer-配置"></a>
## 5. Sniffer configuration

**Documentation source**: https://deepwiki.com/muink/mihomo/4.4-process-detection

<a id="顶层字段"></a>
### Top-level fields

| Field | Type | Description |
|------|------|------|
| `enable` | bool | Main switch |
| `sniffing` | list | Protocols: `tls` / `http` / `quic` |
| `force-domain` | list | Domains that always trigger sniffing |
| `skip-domain` | list | Domains excluded from sniffing |
| `skip-src-address` | list | Excluded source IPs |
| `skip-dst-address` | list | Excluded destination IPs |
| `port-whitelist` | list | Port ranges with sniffing enabled |
| `force-dns-mapping` | bool | Sniff connections in FakeIP/DNSMapping mode |
| `parse-pure-ip` | bool | Sniff hostless, pure-IP connections |

<a id="协议嗅探器配置"></a>
### Protocol-sniffer configuration

Each protocol (TLS / HTTP / QUIC) supports:

| Field | Type | Description |
|------|------|------|
| `override-destination` | bool | Replace metadata.Host with the sniffed domain and clear original DstIP |
| `ports` | list | Port ranges |

<a id="配置示例"></a>
### Example

```yaml
sniffer:
  enable: true
  sniffing:
    - tls:
        override-destination: true
        ports: [443, 8443]
    - http:
        override-destination: true
        ports: [80, 8080]
    - quic:
        override-destination: true
        ports: [443, 8443]
  force-domain:
    - '*.example.com'
  skip-domain:
    - '*.apple.com'
  port-whitelist:
    - 443
    - 80
  force-dns-mapping: true
  parse-pure-ip: false
```

---

<a id="6-smart-内核特有功能"></a>
## 6. Smart-core-specific features

<a id="type-smart"></a>
### type: smart

The historical summary records these claims; do not treat its MetaCubeX attribution or `strategy` field as current Smart-fork verification:

- Introduced in MetaCubeX/mihomo v1.18.0+ according to the old text.
- AI model selects an optimal node.
- `uselightgbm` enables LightGBM gradient-boosting prediction of dynamic weights.
- `collectdata` collects performance data for training.
- Historical `strategy`: `sticky-sessions` / `round-robin`.
- `policy-priority` assigns priority weights manually.

<a id="与常规-type-url-test-的区别"></a>
### Differences from ordinary `type: url-test`

| Feature | `url-test` | `smart` |
|------|-----------|---------|
| Selection | Current lowest latency | AI historical prediction |
| Trigger | Scheduled tests | Adaptive |
| Recorded use case | Large node-quality differences | Multiple unstable nodes |
| Self-learning | No | Yes |
| LightGBM | Unsupported | Supported (`uselightgbm`) |

---

<a id="7-跨版本兼容性注意事项"></a>
## 7. Cross-version compatibility notes

1. **Go RE2 regex**: filter uses Go RE2, without backreferences or lookahead.
2. **Substring matching**: mihomo `filter` matches substrings; `TW` matches `TWN`.
3. **YAML anchors**: mihomo uses `gopkg.in/yaml.v3`; the historical reference records full YAML 1.2 anchor/alias support.
4. **`MATCH` versus `FINAL`**: Clash/mihomo uses `MATCH`; Shadowrocket/Surge uses `FINAL`.
5. **GEOIP/GEOSITE**: the historical text requires `geodata-mode: true` in general settings.
6. **Group-level `interface-name`/`routing-mark` are deprecated**; use node-level configuration.
7. **`respect-rules`** requires `proxy-server-nameserver` and is not recommended together with `prefer-h3`.
8. **`include-all-providers`** overrides `use`.

---

*Historical footer last updated: 2026-08-08*
*Source documentation: https://wiki.metacubex.one/config/*

<a id="2026-10-20-业务-dns-policy-复核"></a>
### 2026-10-20 service-DNS policy review

Reviewed [official Mihomo DNS documentation](https://wiki.metacubex.one/config/dns/): `nameserver-policy` precedes `nameserver` / `fallback`; node DNS is independent; `respect-rules` requires `proxy-server-nameserver`. Synchronization only unified the policy data source.
