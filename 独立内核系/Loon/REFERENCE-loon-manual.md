<a id="loon-配置参考文档"></a>
# Loon configuration reference

**English** | [简体中文](REFERENCE-loon-manual.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

> Reviewed 2026-10-28: GoogleFCM was moved only from downloads/updates to Google services. [Loon subscribed rules](https://nsloon.app/docs/Rule/sub_rule/) were reviewed; existing policy references after remote rules were retained. DNS, fake-IP, sniffing, other push traffic, and node groups were unchanged. No fields, minimum versions, or real-device success claims were added.

> Updated 2026-10-19 (previous topic summary 2026-05-31): the current official site was confirmed through the App Store developer link. Text and release metadata were cached; see the [Apple-client review](../../docs/upstream/2026-10-19/apple/report.md) and [cache receipts](../../docs/upstream/2026-10-19/apple/manifest.json).

<a id="当前复核结论"></a>
## Current review findings

- Stable 3.5.2, dated 2026-10-01 UTC. No official prerelease version/date was obtained; pending. The new Rewrite/Script syntax in 3.5.1 is backward compatible. This repository does not enable those features and does not migrate routing for them.
- Actual current official [Remote Rule](https://nsloon.app/docs/Rule/sub_rule/), [Policy Group](https://nsloon.app/docs/Policy/policygroup/), [DNS](https://nsloon.app/docs/DNS/), and [General](https://nsloon.app/docs/General/) text was saved, rather than relying on inaccessible old pages.
- interval uses seconds and tolerance milliseconds. Official `ip-mode` minimum is 3.2.3(754); `hijack-dns` is 3.2.5(789). The old blanket 3.2.0+ wording is not a valid minimum-version claim.
- [Official store history](https://apps.apple.com/us/app/loon/id1373567447) confirms AnyTLS from 3.3.9 (2026-03-31) and ShadowTLS from 3.2.6 (2025-02-03).
- [Process rules](https://nsloon.app/docs/Rule/process_rule/) apply only on Mac. iOS/tvOS ignore an entire logical rule containing a process condition; do not infer support from the old “partly supported on iOS 14+” statement.
- Encrypted DNS may fall back to ordinary DNS by default; the app can disable this. It differs from Surge encrypted DNS. New Build1007+ fields lacked a confirmed stable-version threshold and were not adopted by default.

<a id="历史摘要边界"></a>
## Historical-summary boundaries

Old summaries and their community sources remain for traceability, not as current official evidence. This section and cached original text take precedence. Real-device import, rule-source precedence, and concurrent DNS still require validation. Original illustrative code is retained below.

> URL compatibility review, 2026-10-15: official [LoonExampleConfig](https://github.com/Loon0x00/LoonExampleConfig/blob/master/example.conf) includes HTTPS raw GitHub URLs in `[Remote Rule]`. LoonManual’s Remote Rule text could not be fetched then, so evidence was limited to the official example. Issue #186 changes existing URL hosts only, not syntax. See [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md).

> Source URLs:
> - https://github.com/Loon0x00/LoonManual (official GitHub manual repository)
> - https://nsloon.uk/tutorial/ (historically identified as Loon’s official tutorial site)
> - https://deepwiki.com/blackmatrix7/ios_rule_script/7.2-platform-specific-configuration (community reference)
> Retrieved: 2026-04-26
> Updated 2026-05-31 (recheck): Loon v3.4.0 (2026-05-26), adding custom ports for DNS mapping servers and AnyTLS memory optimization. No routing-configuration syntax change; this document was recorded as baseline-compatible.
>
> Updated 2026-04-30 (recheck): no new GitHub release or syntax change was found. This document was recorded as baseline-compatible.
> Updated 2026-04-26: added then-described Loon 3.2.0+ fields (ip-mode / udp-fallback-mode / hijack-dns / domain-reject-mode / dns-reject-mode / ipasn-url) and recorded ipv6 deprecation. Version qualifications above supersede the blanket minimum.

---

<a id="一配置整体结构"></a>
## I. Overall configuration structure

The historical reference describes two Loon configuration formats:
1. **Surge-compatible text**, used here: section/value syntax organized by `[Section]`.
2. **YAML**, described as natively used in the app UI.

Standard sections in fixed order (original labels retained):

```
[General]        → 全局设置
[Proxy]          → 本地节点定义
[Remote Filter]  → 节点过滤规则（Loon 特有）
[Proxy Group]    → 策略组
[Remote Rule]    → 远程规则集订阅
[Rule]           → 本地规则
[Host]           → 本地 DNS 映射
[URL Rewrite]    → URL 重写
[MITM]           → HTTPS 中间人解密
[Script]         → 脚本
```
They represent global settings, local nodes, Loon-specific node filters, groups, remote rule subscriptions, local rules, local DNS mappings, URL rewriting, HTTPS interception, and scripts, respectively.

---

<a id="二general-段字段"></a>
## II. [General] fields

| Field | Value format | Description | Source |
|------|--------|------|------|
| `bypass-tun` | `IP/CIDR,domain,*.wildcard` | Bypass TUN for traffic such as private networks | general.md |
| `skip-proxy` | `IP/CIDR,domain` | Bypass HTTP proxy mode | general.md |
| `dns-server` | `system,IP,IP,...` | DNS servers; `system` means system DNS | general.md |
| `doh-server` | `https://URL,https://URL,...` | Comma-separated DoH servers | general.md |
| `doh3-server` | `h3://IP/dns-query` | HTTP/3 DoH | general.md |
| `doq-server` | `quic://domain:784` | DNS-over-QUIC | general.md |
| `ip-mode` | `ipv4-only`/`dual`/`ipv4-preferred`/`ipv6-preferred` | Dual-stack mode; old text says 3.2.0+ replaces deprecated `ipv6`; see corrected minimum above | general.md |
| `ipv6` | `true`/`false` | **Deprecated**; old summary says replaced by `ip-mode` in 3.2.0+ | general.md |
| `allow-wifi-access` | `true` / `false` | Allow LAN proxy access | general.md |
| `wifi-access-http-port` | Port | HTTP proxy port | general.md |
| `wifi-access-socks5-port` | Port | SOCKS5 port | general.md |
| `proxy-test-url` | URL | Proxy-latency test URL | general.md |
| `internet-test-url` | URL | Connectivity-test URL | general.md |
| `test-timeout` | Seconds | Node-test timeout | general.md |
| `switch-node-after-failure-times` | Count | Consecutive failures before switching; deprecated, handled automatically | general.md |
| `resource-parser` | URL | Subscription parser | general.md |
| `ssid-trigger` | `"SSID":MODE,...` | Mode switching by SSID | general.md |
| `real-ip` | `domain,*.wildcard` | Real-IP domains; described as equivalent to [Host] DNS mappings and recommended for FakeIP exclusions | general.md |
| `hijack-dns` | `IP:port,...` | DNS interception targets, including hardcoded DNS for FakeIP | general.md |
| `interface-mode` | `Auto`/`Cellular`/`Performance`/`Balance` | Network-interface mode | general.md |
| `force-http-engine-hosts` | `domain,:port` | Force HTTP engine; deprecated | general.md |
| `udp-fallback-mode` | `DIRECT`/`REJECT` | **3.2.0+ build 702**: when a matching node lacks UDP, REJECT drops traffic / DIRECT connects directly | general.md |
| `disable-udp-ports` | `port,port,...` | Ports with UDP disabled | general.md |
| `disable-stun` | `true` / `false` | Disable STUN, historically described as preventing WebRTC leaks | general.md |
| `domain-reject-mode` | `DNS`/`Request` | Reject domains at DNS or request stage | general.md |
| `dns-reject-mode` | `LOOPBACKIP`/`NOANSWER`/`NXDOMAIN` | DNS rejection method | general.md |
| `skip-first-packet` | `true`/`false` | Skip first-packet parsing for server-speaks-first protocols | general.md |
| `geoip-url` | URL | GeoIP MMDB download URL | general.md |
| `ipasn-url` | URL | ASN database download URL | general.md |

<a id="注意点"></a>
### Notes

- **`dns-server`**: accepts only `system` and plain IPs, not DoH URLs.
- **`doh-server`**: accepts standard HTTPS URLs only.
- **`ipv6`**: the old summary says deprecated in **Loon 3.2.0+**, recommending `ip-mode = dual`; older versions (<3.2.0) use `ipv6 = true`. Consult the corrected `ip-mode` threshold above rather than the old blanket claim.
- **`udp-fallback-mode`**: introduced in Loon 3.2.0+ build 702; versions below 3.2.0 silently ignore it.
- **`geoip-url`**: automatic GeoIP updates; Loon also bundles MaxMind GeoLite2.
- **[Host] wildcards**: the historical summary records `*.apple.com = server:system` support in Loon 3.2.0+ and the equivalent [General] option `real-ip = *.apple.com`.

---

<a id="三proxy-段--本地节点定义"></a>
## III. [Proxy]: local nodes

Surge-compatible format:

```
节点名=协议,地址,端口,password=密码,method=加密方式,...
```

Recorded protocols: `ss`, `ssr`, `vmess`, `vless`, `trojan`, `hysteria2`, `http`, and `socks5`.

Parameters depend on the protocol.

---

<a id="四remote-filter--节点过滤loon-特有"></a>
## IV. [Remote Filter]: Loon-specific node filtering

<a id="语法"></a>
### Syntax

```
Filter名称 = NameRegex, FilterKey = "(?i)正则表达式"
```

<a id="说明"></a>
### Description

- **`NameRegex`**: regex-filter node names (tag/name).
- **`FilterKey`**: regex matching a substring of the node name.
- **`(?i)`**: case-insensitive flag.
- Separate multiple keywords with `|` for OR.
- Exclude keywords with a negative-lookahead pattern, originally illustrated as `^((?!(排除词1|排除词2)).)*$`.

<a id="不支持"></a>
### Unsupported

- Loon does not support Surge’s inline `policy-regex-filter=`.
- Define filters only in [Remote Filter], then reference their names from [Proxy Group].

<a id="引用方式"></a>
### References from groups

In a [Proxy Group] url-test group, the filter name is the first parameter:

```
组名 = url-test,Filter名,url=...,interval=...,tolerance=...
```

<a id="来源"></a>
### Sources

- https://nsloon.uk/tutorial/advanced_EN/remote_filter_en.html (page hash: CrRC6t-O)
- https://nsloon.uk/tutorial/advanced/regex.html (regex syntax)

---

<a id="五proxy-group--策略组"></a>
## V. [Proxy Group]

<a id="51-select--手动选择"></a>
### 5.1 `select`: manual selection

Syntax:
```
组名 = select,候选1,候选2,..., DIRECT, REJECT
```

- The user selects manually in the app UI.
- Candidates can be individual nodes, group names, or built-in policies.
- Only `select` can select directly from the subscription-node list.

<a id="52-url-test--自动延迟测试"></a>
### 5.2 `url-test`: automatic latency testing

Syntax:
```
组名 = url-test,Filter名或节点列表,url=测试URL,interval=秒数,tolerance=毫秒
```

Parameters:
- **`url`**: test URL, default `http://www.gstatic.com/generate_204`.
- **`interval`**: seconds between tests, default 600.
- **`tolerance`**: milliseconds, default 100; a new node must be faster by more than this amount before switching.

Limits:
- **No** nested policy groups; only nodes/filter references.
- **No** `timeout=/select=/policy-regex-filter=` parameters.
- Direct references from the subscription-node list are discouraged; filter through [Remote Filter] first.

<a id="53-fallback--故障转移"></a>
### 5.3 `fallback`: failover

Syntax:
```
组名 = fallback,节点1,节点2,...
```

- Selects the first available node in order.
- **No** nested policy groups.
- Contains direct node references only.

<a id="54-load-balance--负载均衡"></a>
### 5.4 `load-balance`

Syntax:
```
组名 = load-balance,节点1,节点2,...
```

- Requests to the same hostname remain on the same node.

<a id="55-ssid--ssid-策略组"></a>
### 5.5 `ssid` groups

Select different exits according to the connected WiFi SSID.

<a id="注意"></a>
### Notes

- The historical reference says url-test / fallback / load-balance groups **must** be subgroups of select groups.
- All group names must exactly match [Rule] references, including emoji.

<a id="来源-1"></a>
### Sources

- https://nsloon.uk/tutorial/advanced_EN/Remote_Proxy_in_Proxy_Group_EN.html
- https://github.com/chiupam/tutorial/blob/master/Loon/Plus/URL-Test_EN.md
- https://nsloon.uk/tutorial/advanced/Fallback.html

---

<a id="六rule--本地规则"></a>
## VI. [Rule]: local rules

<a id="语法-1"></a>
### Syntax

```
规则类型,参数,策略组[,可选标志]
```

<a id="规则类型"></a>
### Rule types

| Type | Format | Description |
|------|------|------|
| `DOMAIN` | `DOMAIN,example.com,policy` | Exact domain |
| `DOMAIN-SUFFIX` | `DOMAIN-SUFFIX,example.com,policy` | Domain suffix, including subdomains |
| `DOMAIN-KEYWORD` | `DOMAIN-KEYWORD,keyword,policy` | Domain keyword |
| `IP-CIDR` | `IP-CIDR,ip/mask,policy,no-resolve` | IPv4 ranges; also accepts IPv6 |
| `IP-CIDR6` | Possibly absent | Loon may use IP-CIDR for both |
| `DEST-PORT` | `DEST-PORT,port,policy` | Destination port, **not** DST-PORT |
| `SRC-PORT` | `SRC-PORT,port,policy` | Source port |
| `GEOIP` | `GEOIP,CC,policy,no-resolve` | GEOIP country code |
| `RULE-SET` | Not used in [Rule] | Declared in [Remote Rule] |
| `FINAL` | `FINAL,policy` | Final fallback; must be last |

<a id="可选标志"></a>
### Optional flags

- `no-resolve`: suppress DNS resolution for IP rules (IP-CIDR / GEOIP).

<a id="规则匹配优先级"></a>
### Rule-matching priority

The historical reference records:
1. Domain rules (DOMAIN / DOMAIN-SUFFIX / DOMAIN-KEYWORD) precede IP rules for domain requests.
2. Same-type rules match top to bottom in file order.
3. Local rules > subscription rules > plugin rules.
4. No match → FINAL.

<a id="注意-1"></a>
### Notes

- Loon 3.0.3+ domain-request handling is described as domain rules → local DNS if unmatched → IP rules.
- **DEST-PORT versus DST-PORT**: Loon’s official documentation uses `DEST-PORT` (source: nsloon.app/docs/Rule/port_rule/). The original comparison calls Surge/Shadowrocket’s spelling `DST-PORT`; this historical cross-client claim is retained, not newly verified.
- IPv6: Loon may lack a separate IP-CIDR6 type and use IP-CIDR instead.

<a id="来源-2"></a>
### Sources

- https://nsloon.uk/tutorial/advanced_EN/rule_en.html (page hash: BdKSxNl4)
- LoonManual/docs/cn/rule.md (priority description)

---

<a id="七remote-rule--远程规则集"></a>
## VII. [Remote Rule]: remote rule sets

<a id="语法-2"></a>
### Syntax

```
URL, policy=策略组, tag=标签名, enabled=true
```

<a id="说明-1"></a>
### Description

- One remote rule-set URL per line.
- **`policy=`**: group selected when the set matches.
- **`tag=`**: UI display name.
- **`enabled=true/false`**: enable or disable.
- Loon manages updates automatically, without `update-interval`.
- Surge-style `RULE-SET,URL,policy` is **unsupported** and errors when placed in [Rule].

<a id="与-rule-的关系"></a>
### Relationship to [Rule]

- [Remote Rule] and [Rule] both participate in routing.
- [Rule] has higher priority than [Remote Rule] in the historical reference.
- Internal rule-set order follows file line numbers.

<a id="来源-3"></a>
### Sources

- https://nsloon.uk/tutorial/advanced_EN/remote_rule_en.html (page hash: BM-Wv5lJ)

---

<a id="八host--本地-dns-映射"></a>
## VIII. [Host]: local DNS mappings

<a id="语法-3"></a>
### Syntax

```
域名 = IP
域名 = server:system
```

<a id="说明-2"></a>
### Description

- `domain = IP`: map a domain to a fixed IP.
- `domain = server:system`: resolve a domain through system DNS.

<a id="注意-2"></a>
### Notes

- [Host] compatibility may depend on the Loon app version.
- The historical reference prefers [General] `real-ip` for system-DNS domain control.
- This section was not documented prominently in the official tutorial.

---

<a id="九url-rewrite--url-重写"></a>
## IX. [URL Rewrite]

Syntax:
```
^正则表达式 目标URL 状态码
```

The example represents a 302 redirect.

---

<a id="十geoip--mmdb-配置"></a>
## X. GEOIP / MMDB configuration

- Loon supports a custom GeoIP database URL through `[General] geoip-url`.
- Without one, it uses bundled MaxMind GeoLite2.
- The historical reference recommends the enhanced Loyalsoldier version: `https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb`.
- That version includes labels such as `cloudflare`, `telegram`, `netflix`, and `google`.

---

<a id="十一已知差异总结"></a>
## XI. Recorded differences

| Item | Loon | Surge | Shadowrocket |
|--------|------|-------|-------------|
| Filters | [Remote Filter] + NameRegex | Inline `policy-regex-filter=` | None in original comparison |
| Remote-rule section | [Remote Rule] `URL, policy=组, tag=, enabled=` | [Rule] `RULE-SET,URL,policy` | [Rule] `RULE-SET,URL,policy` |
| Port-rule name | `DEST-PORT` | `DST-PORT` in original comparison | `DST-PORT` |
| IP-CIDR6 | Possibly no separate type | `IP-CIDR6` | `IP-CIDR6` |
| GeoIP URL | `geoip-url` = URL | `geoip-url` = URL in original comparison | Unsupported; manual setup |
| FINAL | `FINAL,policy` | `FINAL,policy` | `FINAL,policy,dns-failed` |
| Nested url-test | No nested groups | Nested groups supported | Nested groups supported |
