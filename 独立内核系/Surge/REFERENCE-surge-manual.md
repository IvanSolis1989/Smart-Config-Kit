<a id="surge-官方手册参考文档"></a>
# Surge official-manual reference

**English** | [简体中文](REFERENCE-surge-manual.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

> Reviewed 2026-10-28: GoogleFCM was moved only from downloads/updates to Google services. [Surge rules](https://manual.nssurge.com/rule.html) were reviewed; existing RULE-SET targets were retained without new rule types. DNS, fake-IP, sniffing, other push traffic, and node groups were unchanged. No new fields, minimum versions, or device-success claims were added.

> Updated 2026-10-20 (previous retrieval 2026-10-19): for Issue #190, official [Advanced DNS](https://manual.nssurge.com/dns/advanced.html) and [General](https://manual.nssurge.com/profile/general.html#tun-excluded-routes) were reread to document VIF/Fake IP interception constraints. Old `others/misc-options.html` returned 404; use General for those options.

<a id="vif-与-fake-ip-接管约束"></a>
## VIF and Fake IP interception constraints

- Surge allocates IPv4 Fake IPs from `198.18.0.0/15`; its DNS responder uses `198.18.0.2` on Mac / `198.18.0.4` on iOS. Connections must return through VIF to recover original domains and match policies. `tun-excluded-routes` bypasses VIF and must not intersect that pool. Rule-level `DIRECT` selects an exit after interception and is not a TUN exclusion.
- `skip-proxy` bypasses the system HTTP proxy and hands traffic to VIF; it is not a TUN exclusion. `always-real-ip` changes DNS answers for specified domains and need not be set to `*` for this issue. This revision removed only existing IPv4 CIDRs, without new fields or higher minimum versions. No Surge real-device acceptance was performed.
- Cross-client static audit: Clash Party Smart/Normal, CMFA, OpenClash Normal/Smart, FlClash, and Stash had no IP-route exclusions for their Fake IP pools; Egern bypassed only local/private networks; QX did not exclude this range; both SingBox versions enabled `auto_route` without `route_exclude_address`; v2rayN/dual-core-family/Passwall/Passwall2 rule assets had no OS TUN exclusions. Their source graph, fused assets, and outputs were therefore unchanged.
- Loon and Shadowrocket also contained the same `/15` text, but that alone did not establish an equivalent defect. Loon’s [official example](https://raw.githubusercontent.com/Loon0x00/LoonExampleConfig/master/example.conf) itself includes the range; [current General documentation](https://nsloon.app/docs/General/#bypass-tun) does not publish a Fake IP pool. Shadowrocket’s help site was unavailable and its developer website supplied no verifiable pool/override-priority explanation. Both were retained; this is not completed real-device validation.

> Updated 2026-10-19 (previous topic summary 2026-05-31): official text, version metadata, decisions, and validation gaps are in the [Apple-client review](../../docs/upstream/2026-10-19/apple/report.md). Original snapshots and hashes are in the [source manifest](../../docs/upstream/2026-10-19/apple/manifest.json).

<a id="当前复核结论"></a>
## Current review findings

- Surge iOS stable 5.23.0 (2026-10-12 UTC); Mac stable 6.10.0/12500 (2026-10-12 UTC). The Mac beta feed reported 6.11.0/12560 (2026-10-16 UTC). The enclosure/old-title conflict was retained, not mixed into stable findings.
- Official [Profile Format](https://manual.nssurge.com/profile/format.html) does not recognize `[DNS]`; global DNS keys belong in `[General]`. Earlier descriptions of a separate DNS section, `fallback-dns-server`, and `dns-direct-fallback-proxy` were wrong and corrected.
- [Encrypted DNS](https://manual.nssurge.com/dns/encrypted-dns.html) uses concurrent first response. Plain DNS serves connectivity checks/encrypted-server-domain bootstrap only. With `encrypted-dns-follow-outbound-mode=false`, encrypted DNS connects directly; there is no equivalent “proxy only after direct failure” switch.
- [TUIC v5](https://manual.nssurge.com/policies/tuic.html) is native. [Hysteria 2](https://manual.nssurge.com/policies/hysteria2.html) requires iOS 5.8.0+/Mac 5.4.0+; [AnyTLS](https://manual.nssurge.com/policies/anytls.html) requires iOS 5.17.0+/Mac 6.4.3+. External programs are Mac-only and treated as REJECT on iOS.
- Surge has native [smart](https://manual.nssurge.com/policy-groups/smart.html) (iOS 5.11.0+/Mac 5.7.0+). This repository still uses url-test; smart is not equated with Mihomo LightGBM. Category/HTTPS testing and beta adaptive QUIC remain candidates only.

<a id="历史摘要边界"></a>
## Historical-summary boundaries

Older summaries are retained for traceability. Cross-client comparisons/examples not individually confirmed in this review are not current official promises. The current section and cached official text take precedence. No real app acceptance was completed.

> URL compatibility review, 2026-10-15: the [official Rule Set manual](https://manual.nssurge.com/rules/ruleset.html) explicitly permits external `http://` / `https://` resources and demonstrates `RULE-SET,<URL>,<policy>`. Issue #186 changes only repository-owned rule URL hosts, not syntax. See [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md).

> Source: https://manual.nssurge.com/
> Retrieved: 2026-04-26
> Updated 2026-05-31 (recheck): Surge iOS v5.18.0 (2026-05-06). No syntax changes were found in manual.nssurge.com. Surge 5.x configuration syntax was recorded as compatible with the baseline.
>
> Updated 2026-04-30 (recheck): manual.nssurge.com was fetched again; no version-number or configuration-syntax changes were found. Surge 5.x syntax was recorded as compatible with the baseline.
> Historical note: compiled from official Surge 5.x / Surge Mac 5.x manuals.

---

<a id="1-general-配置段"></a>
## 1. [General] section

<a id="网络测试"></a>
### Network testing
| Field | Type | Description |
|------|------|------|
| `internet-test-url` | URL | Internet-connectivity URL (default http://www.apple.com/library/test/success.html) |
| `proxy-test-url` | URL | Proxy connectivity/latency URL |
| `test-timeout` | Integer | Proxy-test timeout in seconds; default 5 |

<a id="代理行为"></a>
### Proxy behavior
| Field | Type | Description |
|------|------|------|
| `bypass-system` | bool | Bypass system traffic outside Surge |
| `skip-proxy` | Comma-separated | Destination IPs/domains bypassing the proxy |
| `tun-excluded-routes` | CIDR list | Routes excluded from TUN |
| `exclude-simple-hostnames` | bool | Exclude short hostnames, e.g. localhost, .arpa, .lan |
| `read-etc-hosts` | bool | Read system /etc/hosts (macOS only) |

<a id="dns-配置general-段基础字段"></a>
### DNS configuration (basic [General] fields)
| Field | Type | Description |
|------|------|------|
| `dns-server` | Comma-separated | Ordinary server IPs / system; legacy encrypted URLs migrate to encrypted-dns-server on load and are not recommended syntax |
| `encrypted-dns-server` | Comma-separated | Encrypted DNS servers (DoH/DoT URLs) |
| `encrypted-dns-follow-outbound-mode` | bool | Whether encrypted DNS follows outbound mode |
| `hijack-dns` | Comma-separated | DNS-query destinations to intercept, e.g. 8.8.8.8:53 |

<a id="网络栈"></a>
### Network stack
| Field | Type | Description |
|------|------|------|
| `ipv6` | bool | Enable IPv6 |
| `prefer-ipv6` | bool | Prefer IPv6 |
| `block-quic` | bool / "all-proxy" | Block QUIC/HTTP/3 |
| `icmp-auto-reply` | bool | Automatically reply to ping |
| `udp-policy-not-supported-behaviour` | "REJECT" / "DIRECT" | Behavior when a policy lacks UDP support |

<a id="geoip-配置"></a>
### GeoIP configuration
| Field | Type | Description |
|------|------|------|
| `geoip-maxmind-url` | URL | Custom GeoIP MMDB URL, downloaded automatically on Surge startup |
| `disable-geoip-db-auto-update` | bool | Disable automatic GeoIP database updates |

<a id="外部控制"></a>
### External control
| Field | Type | Description |
|------|------|------|
| `external-controller-access` | string | External-controller credentials and address |
| `http-api` | string | HTTP API credentials and address (then-new field) |
| `http-api-tls` | bool | Use TLS for HTTP API |
| `http-api-web-dashboard` | bool | Enable Web Dashboard |

---

<a id="2-dns-节误述更正2026-10-19"></a>
## 2. Correction of DNS-section descriptions (2026-10-19)

Surge does not recognize a separate `[DNS]` section. Older summaries listed `fallback-dns-server`, `proxy-dns-server`, `dns-direct-fallback-proxy`, `private-ip-answer`, and `local-name-mapping`; these are not a basis for Surge configuration. Official [General](https://manual.nssurge.com/profile/general.html) and [encrypted DNS](https://manual.nssurge.com/dns/encrypted-dns.html) document actual fields.

This repository uses `[General] dns-server/encrypted-dns-server/encrypted-dns-follow-outbound-mode/hijack-dns` and `[Host]` mappings. Multiple encrypted servers race for the first response; ordinary domains have no plaintext timeout fallback and no confirmed proxy-after-failure switch.

---

<a id="3-proxy-配置段"></a>
## 3. [Proxy] section

Proxy-node declaration format (original illustrative placeholders retained):
```
# Shadowsocks
节点名 = ss,地址,端口,password=密码,method=aes-256-gcm

# VMess
节点名 = vmess,地址,端口,password=UUID,obfs=websocket,path=/xxx

# VLESS / REALITY / XTLS-Vision 无原生类型；External 程序仅限 Mac

# Trojan
节点名 = trojan,地址,端口,password=密码,peer=xxx.com

# Hysteria2
节点名 = hysteria2,地址,端口,password=密码,download-bandwidth=100
```
The original comment states that VLESS / REALITY / XTLS-Vision have no native type and External programs are Mac-only.

---

<a id="4-proxy-group-策略组配置"></a>
## 4. [Proxy Group] configuration

<a id="通用语法"></a>
### General syntax
```
组名 = 类型, 成员1, 成员2, ..., 参数键=参数值
```

<a id="策略组类型"></a>
### Policy-group types

| Type | Description | Surge 5 | Shadowrocket |
|------|------|-------------|-------------------|
| `select` | Manual selection | Yes | Yes |
| `url-test` | Automatically choose lowest latency | Yes | Yes |
| `fallback` | Priority-ordered fallback | Yes | Yes |
| `load-balance` | Load balancing | Yes | No |
| `ssid` | Switch by WiFi SSID | Yes | No |

<a id="通用参数"></a>
### Common parameters

| Parameter | Type | Description | Surge | Shadowrocket |
|------|------|------|-------|-------------|
| `policy-regex-filter` | Regex | Regex-filter node names | Yes | Yes |
| `include-all-proxies` | bool | Include all proxy nodes | Yes (=true/false) | Yes (presence only, no value) |
| `include-other-group` | Group name | Include members of another group | Yes | No |
| `policy-path` | URL | Load policies from an external file | Yes | No (SR uses subscription management) |

<a id="url-test-专用参数"></a>
### url-test-specific parameters

| Parameter | Type | Description | Surge | Shadowrocket |
|------|------|------|-------|-------------|
| `url` | URL | Test URL | Yes | Yes |
| `interval` | Seconds | Test interval | Yes | Yes |
| `timeout` | Seconds | Test timeout | Yes | Yes |
| `tolerance` | Milliseconds | Switching tolerance to reduce flapping | Yes | Yes |
| `persistent` | bool | Retain current node until unavailable | Yes | No |
| `evaluate-before-use` | bool | Evaluate before use | Yes | No |
| `lazy` | bool | Lazy evaluation | Yes | No |
| `select` | Index/name | Initially selected node | Yes (v5+) | Unsupported |

**Important differences:**
- **Shadowrocket** url-test `policy-regex-filter` automatically selects matching nodes from all nodes.
- **Surge** url-test also supports `policy-regex-filter`, but use `include-all-proxies=true` to ensure all nodes are considered.
- Surge uses `include-all-proxies=true`/`false`; Shadowrocket needs only the parameter’s presence.

<a id="select-专用参数"></a>
### select-specific parameters

| Parameter | Type | Description | Surge | Shadowrocket |
|------|------|------|-------|-------------|
| `select` | Index/name | Initially selected policy | Yes | Yes |
| `include-all-proxies` | bool | Automatically include all proxies | Yes | Yes |

---

<a id="5-rule-规则配置"></a>
## 5. [Rule] configuration

<a id="通用语法-1"></a>
### General syntax
```
规则类型,参数,策略,附加参数
```

<a id="支持的规则类型"></a>
### Supported rule types

| Rule type | Surge 5 | Shadowrocket | Description |
|----------|---------|-------------|------|
| `DOMAIN` | Yes | Yes | Exact domain |
| `DOMAIN-SUFFIX` | Yes | Yes | Domain suffix |
| `DOMAIN-KEYWORD` | Yes | Yes | Domain keyword |
| `DOMAIN-SET` | Yes | **No** | Surge-specific domain-set file |
| `DOMAIN-REGEX` | Yes | Limited | Domain regex |
| `IP-CIDR` | Yes | Yes | IPv4 CIDR |
| `IP-CIDR6` | Yes | Yes | IPv6 CIDR |
| `GEOIP` | Yes | Yes | GeoIP country code |
| `DST-PORT` | Yes | Yes | Destination port |
| `DST-PORT-RANGE` | Yes | No | Destination-port range |
| `SRC-PORT` | Yes | No | Source port (Surge 4+) |
| `PROCESS-NAME` | Yes | **No** (iOS) | Process name (macOS only) |
| `RULE-SET` | Yes | Yes | Rule-set reference |
| `AND` / `OR` / `NOT` | Yes | Limited | Compound logical rules |
| `FINAL` | Yes | Yes | Final fallback |

<a id="rule-set-对比"></a>
### RULE-SET comparison

| Feature | Surge 5 | Shadowrocket |
|------|---------|-------------|
| Remote URL sets | Yes (URL directly in configuration) | Yes |
| Local-file sets | Yes (relative/absolute paths) | No (must be added in UI) |
| Cache | Automatic local cache | Automatic cache |
| Format | .list / .txt / .conf | .list / .txt |

<a id="规则附加参数"></a>
### Additional rule parameters
| Parameter | Description | Surge | Shadowrocket |
|------|------|-------|-------------|
| `no-resolve` | IP rules do not trigger DNS resolution | Yes | Yes |
| `extended-matching` | Enable extended matching (DOMAIN-SUFFIX matches the complete domain) | Yes | No |
| `source` | Source-address matching (IP-CIDR) | Yes | No |
| `dns-failed` | Use FINAL on DNS failure (Shadowrocket-specific) | No | Yes |

<a id="inline-rulesetmac-531-新能力"></a>
### Inline Ruleset (new in Mac 5.3.1+)

Surge Mac 5.3.1+ can embed rule sets directly in profiles without an external file/URL:

```
[Ruleset Streaming]
DOMAIN-SUFFIX,netflix.com
DOMAIN-SUFFIX,netflix.net

[Rule]
RULE-SET,Streaming,StreamingProxy
```

This repository uses remote RULE-SET URLs and is unaffected by this feature.

---

<a id="6-host-本地-dns-映射"></a>
## 6. [Host] local DNS mappings

Both clients use the same syntax:
```
域名 = IP地址 或 server:system
```

<a id="注意"></a>
### Notes
- Surge uses `server:system` to resolve that domain through system DNS.
- Shadowrocket also supports `server:system`.

---

<a id="7-url-rewrite"></a>
## 7. [URL Rewrite]

The syntax is compatible between the two:
```
正则表达式 目标URL 状态码
```

---

<a id="8-mitm"></a>
## 8. [MITM]

The syntax is compatible between the two:
```
hostname = 域名模式
enable = true/false
```

---

<a id="9-surge-特有但-shadowrocket-不支持的特性"></a>
## 9. Surge features not supported by Shadowrocket

1. **DOMAIN-SET**: load domain lists directly from local files.
2. **ssid** groups: switch automatically by WiFi SSID.
3. **load-balance** groups.
4. **SRC-PORT** / **DST-PORT-RANGE** rules.
5. **policy-path**: load groups from a URL/file.
6. **persistent** / **evaluate-before-use** url-test parameters.
7. **External controller (external-controller-access).**
8. The claim of a separate DNS section was withdrawn; use **[General]** / **[Host]**.
9. **encrypted-dns-server** + **encrypted-dns-follow-outbound-mode**.
10. **geoip-maxmind-url** directly in configuration (SR requires manual UI setup).

---

<a id="10-shadowrocket-特有但-surge-不支持的特性"></a>
## 10. Shadowrocket features not supported by Surge

1. **dns-direct-fallback-proxy**: no official Surge equivalent found; do not put it in a nonexistent [DNS] section.
2. **private-ip-answer**: Shadowrocket only.
3. **allow-dns-svcb**: allow DNS SVCB queries.
4. **compatibility-mode**: network compatibility mode, such as TUN Only.
5. **dns-failed** on FINAL rules.
6. URL-rewrite actions **reject-200** and **reject-json**.
7. **Script** functionality (Surge also has scripts, but different syntax and a JS/module system).

---

> Historical attribution: based on the Surge official manual (https://manual.nssurge.com/) and observed iOS/macOS Surge behavior.
> Because of WebFetch permission limits, the author organized this reference from existing knowledge of official documentation.
