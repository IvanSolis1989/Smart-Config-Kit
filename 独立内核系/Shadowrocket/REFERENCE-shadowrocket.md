<a id="shadowrocket-配置参考文档"></a>
# Shadowrocket configuration reference

**English** | [简体中文](REFERENCE-shadowrocket.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

> Scope review on 2026-10-28: this change only retargets FCM in existing RULE-SET entries, retaining current formats and platform boundaries. The old help.shadowrocket.net site remained inaccessible; it is not new official compatibility evidence. No fields or minimum versions were added. DNS, fake-IP, and other push services are unchanged; static contract success does not replace app acceptance.

> Updated 2026-10-19 (previous topic summary 2026-05-31): official release metadata and retrieved text are in the [Apple-client review](../../docs/upstream/2026-10-19/apple/report.md); download status and hashes are in the [cache receipts](../../docs/upstream/2026-10-19/apple/manifest.json).

<a id="当前复核结论"></a>
## Current review findings

- US/JP stable versions were both 2.2.92, dated 2026-09-07 UTC. No official prerelease metadata establishing a version/date was obtained; pending.
- The App Store developer link points to [Shadow Launch’s official website](https://shadowlaunch.com/). It was accessible but contained no configuration syntax. `help.shadowrocket.net` was inaccessible and its current official ownership chain was not established; the historical “official help site” label is not a newly verified fact.
- [Official version history](https://apps.apple.com/us/app/shadowrocket/id932747118) mentions Sudoku, separate DNS for direct domains, TCP/DNSCrypt, multiple Host servers, Tailscale, ping sorting, remote-rule refresh, and memory fixes, but provides insufficient new-field syntax/minimum versions. No configuration keys were guessed.
- Existing RULE-SET, policy-regex-filter, and DNS keys remain. Field support still depends on earlier evidence and later official-text/device checks. Store summaries do not prove every configuration entry compatible.
- Community sources below remain historical references, not substitutes for missing current official text. No real app import, update, or OOM measurement was performed.

<a id="历史摘要边界"></a>
## Historical-summary boundaries

Version numbers, protocol thresholds, and “based on official documentation” summaries below may be historical. Fields not confirmed by current official text are not newly verified findings.

> URL compatibility review, 2026-10-15: the repository retains `RULE-SET,<url>,<policy>`. The official-help-site URL <https://help.shadowrocket.net/> could not be read, so no renewed official confirmation of HTTPS support was claimed. Issue #186 changes only repository-owned rule URL hosts, not rule-line syntax. See [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md).

> Updated 2026-05-31 (previous retrieval 2026-04-30): latest SR v2.2.87 (late May 2026). v2.2.81–2.2.87 adds compact stream buffers (lower concurrent memory use on iOS/tvOS), DNS/HTTP/3 fixes, and other client-side capabilities. No routing-configuration syntax change; RULE-SET/group/DNS syntax was recorded as compatible with the baseline.
>
> Updated 2026-04-30 (previous retrieval 2026-04-26): latest SR v2.2.80 (2026-02-19). v2.2.78–2.2.80 adds HTTP/3, VLESS post-quantum encryption, AnyTLS session pooling, NaiveProxy UoT, gRPC chunked transfer, and other client-side capabilities. No routing-configuration syntax change; RULE-SET/group/DNS syntax was recorded as compatible with the baseline.
>
> Sources: https://help.shadowrocket.net/ (historically labeled official help site)
>       https://raw.githubusercontent.com/Shadowrocket-Notes/Shadowrocket-Notes/master/README.md (community-maintained)
>       https://github.com/zjt003/Shadowrocket (community manual)
> Retrieved: 2026-04-26
> Historical note: this document was compiled from Shadowrocket 2.x official documentation and widely used community syntax.

---

<a id="1-general-配置段"></a>
## 1. [General] section

Shadowrocket configuration, including DNS, uses [General]; there is no separate [DNS] section.

<a id="代理行为"></a>
### Proxy behavior
| Field | Type | Description | Requirement |
|------|------|------|------|
| `bypass-system` | bool | Bypass system traffic | Recommended |
| `skip-proxy` | Comma-separated | CIDRs/domains bypassing the proxy | Recommended |
| `tun-excluded-routes` | Comma-separated CIDRs | Routes excluded from TUN | Recommended |
| `dns-direct-fallback-proxy` | bool | Use proxy after direct DNS failure | Optional |
| `private-ip-answer` | bool | Return private IP answers rather than NXDOMAIN | Optional |
| `compatibility-mode` | 0/1/2/3 | Network compatibility mode (0=automatic, 3=TUN Only) | Optional |

<a id="dns"></a>
### DNS
| Field | Type | Description |
|------|------|------|
| `dns-server` | Comma-separated | Servers for ordinary DNS queries |
| `proxy-dns-server` | Comma-separated | Proxy DNS for node-domain resolution |
| `fallback-dns-server` | Comma-separated | Backup DNS after primary timeout |
| `hijack-dns` | Comma-separated | Intercept DNS, e.g. 8.8.8.8:53 |

<a id="网络栈"></a>
### Network stack
| Field | Type | Description |
|------|------|------|
| `ipv6` | bool | Enable IPv6 |
| `prefer-ipv6` | bool | Prefer IPv6 |
| `block-quic` | bool / "all-proxy" | Block QUIC |
| `icmp-auto-reply` | bool | Automatically reply to ICMP Ping |
| `udp-policy-not-supported-behaviour` | REJECT/DIRECT | UDP fallback policy |
| `allow-dns-svcb` | bool | Allow DNS SVCB/HTTPS queries |

**Historical source note, retained rather than newly endorsed:** the source first says Shadowrocket lacks `dns-direct-fallback-proxy`, then corrects itself to say Shadowrocket 2.x supports it. It also places that field in Surge’s [DNS] section; that old cross-client statement is not current verification (see the historical-summary boundary above).

<a id="shadowrocket-专用字段"></a>
### Shadowrocket-specific fields
| Field | Description |
|------|------|
| `dns-direct-fallback-proxy` | Resolve through proxy after direct DNS failure (historical comparison: Surge does not have this in [General]) |
| `private-ip-answer` | Allow private IP DNS answers |
| `compatibility-mode` | Compatibility mode (3=TUN Only; historically described as improving China-specific app compatibility) |
| `allow-dns-svcb` | Allow DNS SVCB/HTTPS queries, needed by some CDNs |

---

<a id="2-proxy-配置段"></a>
## 2. [Proxy] section

The historical summary describes this node-declaration syntax as fully compatible with Surge. Original illustrative placeholders are retained below; this is not a new cross-client compatibility claim:
```
节点名 = ss,地址,端口,password=密码,method=aes-256-gcm
节点名 = vmess,地址,端口,password=UUID,obfs=websocket,path=/xxx
节点名 = vless,地址,端口,password=UUID,tls=true,peer=xxx.com,flow=xtls-rprx-vision
节点名 = trojan,地址,端口,password=密码,peer=xxx.com
节点名 = hysteria2,地址,端口,auth=密码,peer=xxx.com,alpn=h3
```

---

<a id="3-proxy-group-策略组配置"></a>
## 3. [Proxy Group] configuration

<a id="通用语法"></a>
### General syntax
```
组名 = 类型, 成员1, 成员2, ..., 键=值
```

<a id="支持的类型"></a>
### Supported types
| Type | Description |
|------|------|
| `select` | Manual selection |
| `url-test` | Test automatically and select lowest latency |
| `fallback` | Priority-ordered fallback |
| `load-balance` | Load balancing (requires TestFlight version) |

<a id="url-test-参数"></a>
### url-test parameters
| Parameter | Type | Description | Shadowrocket | Surge |
|------|------|------|-------------|-------|
| `url` | URL | Connectivity-test URL | Yes | Yes |
| `interval` | Seconds | Test interval | Yes | Yes |
| `timeout` | Seconds | Test timeout | Yes | Yes |
| `tolerance` | Milliseconds | Switching tolerance | Yes | Yes |
| `policy-regex-filter` | Regex | Filter proxy nodes by regex | Yes | Yes |
| `include-all-proxies` | Presence flag | Include all proxy nodes | Yes (flag, no value) | Yes (=true/false) |

**Key differences:**
- Shadowrocket’s `policy-regex-filter` works in url-test and automatically scans all subscription node names.
- Shadowrocket **does not support** `select` in url-test groups.
- Shadowrocket **does not support** url-test parameters such as `persistent`, `evaluate-before-use`, and `lazy`.
- Shadowrocket **does not support** `policy-path`.
- Shadowrocket **does not support** `include-other-group`.

<a id="select-参数"></a>
### select parameters
| Parameter | Description |
|------|------|
| `include-all-proxies` | Include all proxies (flag, no value) |
| `policy-regex-filter` | Regex-filter proxies |

---

<a id="4-rule-规则配置"></a>
## 4. [Rule] configuration

<a id="支持的规则类型"></a>
### Supported rule types
| Type | Description | Example |
|------|------|------|
| `DOMAIN` | Exact domain | `DOMAIN,example.com,Policy` |
| `DOMAIN-SUFFIX` | Domain suffix | `DOMAIN-SUFFIX,example.com,Policy` |
| `DOMAIN-KEYWORD` | Domain keyword | `DOMAIN-KEYWORD,keyword,Policy` |
| `IP-CIDR` | IPv4 range | `IP-CIDR,10.0.0.0/8,Policy,no-resolve` |
| `IP-CIDR6` | IPv6 range | `IP-CIDR6,::1/128,Policy,no-resolve` |
| `GEOIP` | IP geolocation | `GEOIP,CN,Policy,no-resolve` |
| `DST-PORT` | Destination port | `DST-PORT,123,Policy` |
| `RULE-SET` | Rule-set reference | `RULE-SET,url,Policy` |
| `FINAL` | Final fallback | `FINAL,Policy,dns-failed` |

<a id="不支持的类型"></a>
### Unsupported types
| Type | Description |
|------|------|
| `DOMAIN-SET` | Surge only |
| `DOMAIN-REGEX` | Some versions may support it, but not an official standard |
| `URL-REGEX` | Support has been discussed in GitHub issues |
| `AND / OR / NOT` | Compound rules; not supported by Shadowrocket |
| `PROCESS-NAME` | Not supported by Shadowrocket (iOS limitation) |
| `SRC-PORT` | Surge only |
| `DST-PORT-RANGE` | Surge only |

<a id="rule-set-说明"></a>
### RULE-SET notes

Shadowrocket can reference a URL directly as a RULE-SET:
```
RULE-SET,https://example.com/ruleset.list,Policy
```
Rule sets are downloaded and cached locally. Each line is a rule, supporting DOMAIN-SUFFIX, DOMAIN-KEYWORD, IP-CIDR, and similar types.

**Important:** a RULE-SET argument cannot be a local file path; use a URL.

<a id="final-规则"></a>
### FINAL rule

Shadowrocket supports `dns-failed`:
```
FINAL,🐟 漏网之鱼,dns-failed
```
`dns-failed` keeps the rule applicable when DNS resolution fails.

---

<a id="5-host-本地-dns-映射"></a>
## 5. [Host] local DNS mappings

```
域名 = IP 地址
域名 = server:system  # 走系统 DNS
```
Leading `*` wildcard matching is supported, e.g. `*.apple.com = server:system`.

---

<a id="6-url-rewrite"></a>
## 6. [URL Rewrite]

```
^regex目标URL https://新地址 302
```
Actions include `302`, `307`, `reject`, `reject-200`, and `reject-json`.

---

<a id="7-mitm"></a>
## 7. [MITM]

```
hostname = *.example.com
enable = true/false
```
A root certificate must first be installed.

---

<a id="8-shadowrocket-的局限性与-surge-对比"></a>
## 8. Shadowrocket limitations compared with Surge

1. **No separate [DNS] section**: all DNS configuration is in [General].
2. **No local RULE-SET paths**: URLs only.
3. **No DOMAIN-SET** rule type.
4. **url-test lacks `select`, `persistent`, `evaluate-before-use`, and `lazy`.**
5. **No ssid policy groups.**
6. **No policy-path.**
7. **No include-other-group.**
8. **No external controller (external-controller-access).**
9. **No configuration-file URL for the MMDB database**: configure it manually in the UI.
10. **GEOIP does not support labels such as cloudflare/telegram**, except with the enhanced Loyalsoldier MMDB.
11. **No `edgetier` parameter.**

---

<a id="9-已知兼容的规则源-url"></a>
## 9. Rule-source URLs recorded as compatible

The historical reference lists these directly consumable rule formats:
- blackmatrix7’s `rule/独立内核系/Shadowrocket/` directory (historically recommended).
- Surge-format .list/.txt files (DOMAIN-SUFFIX compatible).
- Non-IP rules from sukka’s ruleset.skk.moe.
- szkane Clash rules (YAML classical; SR recognizes content).

---

> Historical attribution: compiled from the Shadowrocket help site (https://help.shadowrocket.net/),
> the Shadowrocket-Notes community manual, and long-term usage experience.
> Because of WebFetch permission limits, the author organized this reference from existing knowledge of official documentation.
