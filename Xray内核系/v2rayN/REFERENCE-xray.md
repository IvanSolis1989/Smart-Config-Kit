<a id="xray-v2rayn-配置参考文档"></a>
# Xray (v2rayN) configuration reference

**English** | [简体中文](REFERENCE-xray.zh-CN.md)


> Reviewed on 2026-10-28: only GoogleFCM moved from downloads/updates to Google services. [Xray RoutingObject](https://xtls.github.io/config/routing.html) was rechecked; existing outboundTag mapping remains, with FCM moving from downloads/direct to Google/proxy. DNS, fake-IP, sniffing, other push services, and node groups were unchanged. No fields, minimum versions, or device-pass claims were added.

> Updated on 2026-10-19: see the [official-version, cached-original, and local-adaptation report](../../docs/upstream/2026-10-19/singbox/report.md). Older summaries below retain their retrieval dates and were not wholly updated.

<a id="2026-10-19-现行核验"></a>
## Review current as of 2026-10-19

- Xray’s [GitHub Latest](https://github.com/XTLS/Xray-core/releases/latest) remained v26.3.27 (2026-03-27); latest prerelease was [v26.10.17](https://github.com/XTLS/Xray-core/releases/tag/v26.10.17) (2026-10-17). The latter is not the latest stable release.
- v2rayN stable [7.25.6](https://github.com/2dust/v2rayN/releases/tag/7.25.6) (2026-10-11) explicitly supports and pins sing-box 1.14; an older 7.25.5 prerelease also exists. The app supports multiple cores. Check installed/updated cores separately; app version is not core version.
- Current [RuleObject](https://xtls.github.io/config/routing.html#ruleobject) uses native `domain` / `ip` / `process` / `outboundTag` fields and does not support sing-box remote `.srs`. Repository Xray routing continues flattening fused source JSON, without adding `.srs` to Xray JSON.
- See the report for native sing-box Full versus 1.13 selection, Hiddify bundled cores, and HomeProxy import limits. v2rayN app import and real connections were not run in this review.

<a id="历史摘要未整篇复核"></a>
## Historical summary (not fully re-reviewed)

> Updated on 2026-07-09: rechecked Xray routing `RuleObject` and v2rayN custom-route format. Native fields include `domain` / `ip` / `port` / `process` / `outboundTag`, but not sing-box remote `.srs` rule sets. The repository therefore flattens fused sing-box JSON into native Xray RuleObject rather than referencing remote `.srs` in Xray JSON.
>
> Updated on 2026-05-31 (previous retrieval: 2026-04-30): latest stable Xray-core remained v26.3.27 (2026-03-27), with prerelease v26.5.9 (2026-05-09). Stable was unchanged, requiring no repository v2rayN adjustment.
>
> Updated on 2026-04-30 (previous retrieval: 2026-04-26): latest stable v26.3.27 (2026-03-27), prerelease v26.4.25 (2026-04-25). v26.3.27 added Hysteria2 inbound/transport, ECH-only connections by default for ECH, and Finalmask HTTP custom headers/Sudoku. `allowInsecure` was deprecated with a 2026-06 deadline; this repository does not use it and was unaffected.
>
> Source URLs:
> - https://xtls.github.io/config/routing.html (routing)
> - https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules (v2rayN custom rules)
> - https://xtls.github.io/config/dns.html (DNS)
> - https://xtls.github.io/config/outbound.html (outbounds)
>
> Retrieved: 2026-07-09

---

<a id="1-v2rayn-路由格式"></a>
## 1. v2rayN routing format

v2rayN routing configuration is a JSON array; each item represents a rule. Original illustrative placeholder strings are retained below:

```json
[
  {
    "id": "scki-000-meta",
    "enabled": false,
    "remarks": "规则备注/说明",
    "outboundTag": "proxy|direct|block",
    "domain": [],
    "ip": [],
    "port": "",
    "protocol": [],
    "inboundTag": [],
    "network": "tcp,udp"
  }
]
```

**Note:** repository path C uses only `proxy`, `direct`, and `block`. It has no complex policy groups and references no remote fused `.srs` in Xray JSON.

---

<a id="2-路由规则字段"></a>
## 2. Routing-rule fields

<a id="21-domain-域名匹配"></a>
### 2.1 domain (domain matching)

`domain` is a string array supporting these prefixes:

| Prefix | Example | Meaning |
|------|------|------|
| None | `"sina.com"` | **Keyword match**, equivalent to `keyword:`; matches any domain containing the string |
| `domain:` | `"domain:xray.com"` | **Subdomain match**: `xray.com` and `*.xray.com` |
| `full:` | `"full:xray.com"` | **Exact match**: entire domain must equal the value |
| `regexp:` | `"regexp:\\.goo.*\\.com$"` | **Regex match**, case-sensitive |
| `keyword:` | `"keyword:sina.com"` | **Keyword match**: domain contains the string |
| `geosite:` | `"geosite:cn"` | **Predefined domain list**, referencing a geosite.dat category |
| `ext:` | `"ext:file:tag"` | **External file**, loaded from the resource directory |
| `dotless:` | `"dotless:pc-"` | **Dotless domain**, matching names without `.` |

**Important:**
- Bare strings are treated as `keyword:`, potentially matching more broadly than intended.
- `geosite:private` includes private domains.
- Matching is case-sensitive.

<a id="22-ip-ip-匹配"></a>
### 2.2 ip (IP matching)

```json
"ip": ["geoip:cn", "10.0.0.0/8", "127.0.0.1"]
```

| Format | Example | Meaning |
|------|------|------|
| `geoip:xx` | `"geoip:cn"` | Predefined IP list, by country code |
| `geoip:private` | `"geoip:private"` | Private addresses |
| `CIDR` | `"10.0.0.0/8"` | IP range |
| Plain IP | `"127.0.0.1"` | Single IP |
| `ext:` | `"ext:geoip.dat:cn"` | External file |
| `!` negation | `"!geoip:cn"` | NOT match |

<a id="23-其他匹配字段"></a>
### 2.3 Other match fields

| Field | Format | Meaning |
|------|------|------|
| `port` | `"53"`, `"443"`, `"1000-2000"`, `"53,443,1000-2000"` | Destination port |
| `sourcePort` | Same as above | Source port |
| `network` | `"tcp"`, `"udp"`, `"tcp,udp"` | Network protocol |
| `protocol` | `["http", "tls", "quic", "bittorrent"]` | Sniffed protocol; requires sniffing |
| `inboundTag` | `["socks-in"]` | Inbound-tag match |
| `sourceIP` | `["geoip:private"]` | Source IP; alias `source` |
| `localPort` | `"1080"` | Local inbound port |
| `user` | `["user@example.com"]` | User-email match |
| `process` | `["curl"]` | Process-name match, local only |

---

<a id="3-出站配置-outbounds"></a>
## 3. Outbound configuration (outbounds)

Original illustrative protocol/tag placeholders are retained:

```json
{
  "outbounds": [
    {
      "sendThrough": "0.0.0.0",
      "protocol": "协议名称",
      "settings": {},
      "tag": "标识",
      "streamSettings": {},
      "proxySettings": {},
      "mux": {},
      "targetStrategy": "AsIs"
    }
  ]
}
```

The first outbound is the **primary outbound**, used when no routing rule matches.

<a id="31-本仓库用的三类出站"></a>
### 3.1 The repository’s three outbound types

| Tag | protocol | Purpose |
|-----|----------|------|
| `proxy` | `socks` or `vmess/trojan/vless` | Proxied outbound |
| `direct` | `freedom` | Direct traffic |
| `block` | `blackhole` | Blocking |

---

<a id="4-dns-配置"></a>
## 4. DNS configuration

```json
{
  "dns": {
    "hosts": {},
    "servers": [],
    "clientIp": "",
    "tag": "dns-tag",
    "queryStrategy": "UseIP",
    "disableCache": true,
    "disableFallback": false
  }
}
```

- Set `domainStrategy` in the routing block: `"AsIs"`, `"IPIfNonMatch"`, or `"IPOnDemand"`.
- DNS-server configuration accepts `localhost`, `geosite:cn@localhost`, `https://dns.alidns.com/dns-query`, `"223.5.5.5"`, and related forms.

---

<a id="5-语法要点"></a>
## 5. Syntax notes

1. **Bare domain strings**: unprefixed strings in `domain` mean `keyword:` substring matching, not `domain:` subdomain matching. Prefer an explicit `domain:` prefix.
2. **Three-outbound limitation**: imported v2rayN routing rules have only `proxy` / `direct` / `block` targets. All service groups reduce to these categories.
3. **geosite dependency**: `geosite:xxx` requires geosite.dat in the resource directory.
4. **geoip dependency**: `geoip:xxx` requires geoip.dat in the resource directory.
5. **`ext:` syntax**: `ext:<filename>:<tag>`, with no `.dat` suffix on the filename.
