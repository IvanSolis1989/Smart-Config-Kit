<a id="quantumult-x-配置参考文档"></a>
# Quantumult X configuration reference

**English** | [简体中文](REFERENCE-quantumultx.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

> Reviewed 2026-10-28: GoogleFCM was moved only from downloads/updates to Google services. The [official sample.conf](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf) was reviewed; existing filter_remote tag/force-policy and local-rule policies were retained. DNS, fake-IP, sniffing, other push traffic, and node groups did not change. No fields, minimum versions, or real-device success claims were added.

> Updated 2026-10-19 (previous topic summary 2026-05-31): the official sample was pinned to a Git commit and its actual text saved. Versions, decisions, and validation gaps are in the [Apple-client review](../../docs/upstream/2026-10-19/apple/report.md) and [cache receipts](../../docs/upstream/2026-10-19/apple/manifest.json).

> Correction, 2026-11-07: both `auto, auto, auto` and the interpretation “three values correspond to WiFi/cellular/other” in the old summary below are wrong. The pinned official sample says `filter, filter, LINK_22E171:all_proxy, LINK_22E172:all_direct`. This repository has no SSID exceptions and uses `filter, filter`. The pinned text was fetched again and its SHA-256 matched the 2026-10-19 cache. This corrects an old summary; it does not claim an upstream syntax change. QX device-import retesting remains pending.

<a id="当前复核结论"></a>
## Current review findings

- Stable 1.8.1, dated 2026-10-07 UTC; 1.8.0+ requires iOS 15. No confirmed official prerelease version/date was obtained; pending.
- The [official sample.conf](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf) places concurrent DoH URLs on one comma-separated line. This repository’s four URLs were consolidated onto one line in their original order. No claim was made that old duplicate-key last-wins behavior had been reproduced on a device.
- [Official version history](https://apps.apple.com/us/app/quantumult-x/id1443988620) confirms VLESS from 1.5.0, REALITY from 1.5.5 (2026-01-14), and AnyTLS from 1.6.0 (2026-05-21). REALITY is not XTLS-Vision; support for the latter remains pending.
- Remote filters, policy, and server-tag-regex retain native example syntax. Older comments about which groups accept regex conflict with a concrete url-latency-benchmark example; real-app acceptance remains necessary.
- Text cache ID `qx-sample-conf`, pinned commit `af6fb594233ec4a3ec6d4ccb3601e9c36b75ea2d`; server-complete.snippet and URL Scheme were saved separately.

<a id="历史摘要边界"></a>
## Historical-summary boundaries

The following community wiki and old summaries remain for traceability, not as current official commitments. New syntax was not automatically treated as a performance improvement. Real app import and four-server concurrent queries remain unverified. The original examples are retained below, including claims superseded by the corrections above.

> URL compatibility review, 2026-10-15: the upstream official [URL Scheme](https://github.com/crossutility/Quantumult-X/blob/master/url-scheme.md) example uses HTTPS raw GitHub URLs in `filter_remote`. Remote-entry option references still come from a locally recorded community wiki, not official documentation. Issue #186 changes existing URL hosts only, not syntax. See [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md).

> Source URLs:
> - https://github.com/crossutility/Quantumult-X (official GitHub repository; limited documentation)
> - https://qx.atlucky.me/ (historically described as an authoritative community wiki with page-hash verification)
> - https://blackmatrix7.github.io/ios_rule_script/7.2-platform-specific-configuration (community reference)
> - Retrieved: 2026-04-26
> Updated 2026-05-31 (recheck): QX v1.6.0 (2026-05-21), adding AnyTLS. No routing-configuration syntax change; syntax was recorded as compatible with the baseline.
>
> Updated 2026-04-30 (recheck): the crossutility/Quantumult-X GitHub repository had no new release. Syntax was recorded as compatible with the baseline.

---

<a id="一配置整体结构"></a>
## I. Overall configuration structure

Quantumult X uses its own `.conf` format, **not fully compatible** with Surge/Shadowrocket/Loon.

All section names **must be lowercase**, unlike Surge-style sections. Original illustrative labels are retained:

```
[general]          → 全局设置
[dns]              → DNS 配置
[policy]           → 策略组（策略 + 节点筛选）
[server_local]     → 本地节点
[server_remote]    → 远程节点（订阅）
[filter_remote]    → 远程规则订阅
[filter_local]     → 本地规则
[rewrite_local]    → 本地重写
[rewrite_remote]   → 远程重写
[task_local]       → 本地定时任务
[mitm]             → HTTPS 中间人解密
```
These sections respectively provide global settings, DNS, policy groups/node filtering, local nodes, remote subscriptions, remote rules, local rules, local rewrites, remote rewrites, scheduled tasks, and HTTPS interception.

<a id="关键差异与-独立内核系surgeclash-对比"></a>
### Key differences compared with Surge/Clash

| Item | Quantumult X | Surge | Shadowrocket |
|--------|-------------|-------|-------------|
| Section names | Lowercase `[general]` | Capitalized `[General]` | Capitalized `[General]` |
| Groups | `[policy]` | `[Proxy Group]` | `[Proxy Group]` |
| Node subscriptions | `[server_remote]` | `[Proxy]` + subscription management | `[Proxy]` + subscription management |
| Rules | `[filter_remote]` + `[filter_local]` | `[Rule]` | `[Rule]` |
| Node filtering | `server-tag-regex=` | `policy-regex-filter=` | `policy-regex-filter=` |
| Filter location | Directly in policy lines | url-test line parameter | url-test line parameter |

---

<a id="二general-段字段"></a>
## II. [general] fields

| Field | Value format | Description |
|------|--------|------|
| `server_check_url` | URL | Node-latency test URL |
| `resource_parser_url` | URL | Subscription parser (KOP-XIAO historically recommended) |
| `geo_location_checker` | URL | GeoIP location check |
| `running_mode_trigger` | auto, auto, auto | Historical incorrect mode-trigger example; superseded by the 2026-11-07 correction above |
| `ssid_suspended_list` | String list | SSIDs that suspend proxying |
| `dns_exclusion_list` | Domain list | DNS exclusions, not resolved through proxy DNS |
| `network_check_url` | URL | Network-connectivity test |
| `fallback_udp_policy` | reject / none | UDP fallback policy |

<a id="注意点"></a>
### Notes

- **Section names must be lowercase**: `[general]`, not `[General]`.
- **`running_mode_trigger`**: the old claim that three values mean WiFi/cellular/other is retained as a historical error and superseded by the correction above.
- **`dns_exclusion_list`**: matching domains use system DNS rather than proxy DNS.
- **`fallback_udp_policy`**: historically compared with Surge’s `udp-fallback-mode`, with different spelling/values.

---

<a id="三dns-段--dns-配置"></a>
## III. [dns] section

<a id="语法"></a>
### Syntax

```
server=IP
server=/域名/IP
doh-server=https://URL
```

<a id="说明"></a>
### Description

- **`server=`**: accepts plain IP, `IP:port`, and `/domain/IP` for domain-specific DNS.
- **`doh-server=`**: DoH URL. The old summary claimed that only the first of multiple entries was used and later entries ignored; consult the current one-line comma-separated correction above rather than treating this as new verification.
- **`no-ipv6`**: disable IPv6 DNS queries.
- **`system`**: valid in `server=/domain/system`, selecting system DNS for that domain.

<a id="注意"></a>
### Notes

- QX `server=` **does not accept a DoH URL** (the historical text compares it with Surge syntax).
- The old claim “only the first `doh-server=` entry takes effect” is historical, not newly established; use the current reviewed multi-URL syntax above.
- Use `system` in place of the IP value: `server=/example.com/system`.

<a id="v160-新增-dns-选项"></a>
### DNS options added in v1.6.0

| Field | Description |
| ---- | ---- |
| `prefer-doh3` | Prefer DNS over HTTP/3, falling back to HTTP/2 |
| `dns-reject-domain-behavior` | DNS rejection: `loopback` / `no-error-no-answer` / `nxdomain` / `none` |
| `doh-server = URL, excluded_ssids=SSID1` | Exclude DoH by SSID |
| `doh-server = URL, included_ssids=SSID2` | Include DoH by SSID |

<a id="v160-新增代理协议"></a>
### Proxy protocol added in v1.6.0

- **anytls**: native UDP-over-TCP without a separate `udp-over-tcp` setting.

---

<a id="四policy-段--策略组"></a>
## IV. [policy] groups

<a id="41-static--手动选择"></a>
### 4.1 `static`: manual selection

Syntax:
```
static=策略组名, 候选1, 候选2, ..., img-url=图标URL
```

- Selected manually by the user.
- Candidates can be regional policy-group names, DIRECT, and REJECT.
- The historical summary says static groups **cannot directly reference nodes**, only other policy groups.
- Actual nodes are filtered through `server-tag-regex` in url-latency-benchmark groups.

<a id="42-url-latency-benchmark--自动延迟测试按需"></a>
### 4.2 `url-latency-benchmark`: on-demand latency testing

Syntax:
```
url-latency-benchmark=组名, server-tag-regex=正则, check-interval=秒, tolerance=毫秒, alive-checking=false, img-url=URL
```

Parameters:
- **`server-tag-regex`**: regex matching against node tags, the central filtering mechanism.
- **`check-interval`**: seconds between tests; interval-based testing is considered after a request activates the policy.
- **`tolerance`**: switching tolerance in milliseconds.
- **`alive-checking`**: `true` also tests idle groups on the interval; the power-save profile uses `false`. See the [official Quantumult X example](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf) for field spelling/semantics.
- **`img-url`**: icon URL.

<a id="43-available--故障转移"></a>
### 4.3 `available`: failover

Similar syntax to url-latency-benchmark; selects the first available node in order.

<a id="44-其他类型"></a>
### 4.4 Other types

- `round-robin`: round-robin selection.
- `ssid`: SSID policy.
- `dest-hash`: destination hashing.

<a id="关键限制"></a>
### Key limitations

- The historical summary says QX **does not support** nested url-test/select groups and therefore cannot reproduce Clash’s service-group → regional-group → node hierarchy.
- It says **static groups contain only other policy groups/DIRECT/REJECT, not individual nodes**.
- Node filtering is performed entirely by `server-tag-regex` in url-latency-benchmark groups.

---

<a id="五server_remote--远程节点订阅"></a>
## V. [server_remote]: remote node subscriptions

Syntax:
```
URL, tag=标签, update-interval=秒, opt-parser=true/false, enabled=true/false
```

Description:
- One subscription URL per line.
- **`tag=`**: subscription name in the UI.
- **`update-interval=`**: update interval.
- **`opt-parser=true`**: enable the resource parser specified by `resource_parser_url`.

---

<a id="六filter_remote--远程规则订阅"></a>
## VI. [filter_remote]: remote rule subscriptions

Syntax:
```
URL, tag=标签, force-policy=策略组, update-interval=秒, opt-parser=true/false, enabled=true/false
```

Description:
- One remote rule-set URL per line.
- **`tag=`**: rule-set name in the UI.
- **`force-policy=`**: group used when the set matches, equivalent in intent to Clash’s policy parameter.
- **`update-interval=`**: update interval, compared with Surge’s `update-interval`.
- **`opt-parser=true`**: enable the resource parser.

<a id="注意-1"></a>
### Notes

- QX filter_remote uses `force-policy=`, not Surge’s `RULE-SET,URL,policy` syntax.
- Rules match in file order; `force-policy` determines the matching group.

---

<a id="七filter_local--本地规则"></a>
## VII. [filter_local]: local rules

<a id="支持的规则类型"></a>
### Supported rule types

| Type | Format | Description |
|------|------|------|
| `host` | `host, example.com, policy` | Exact domain |
| `host-suffix` | `host-suffix, example.com, policy` | Domain suffix |
| `host-keyword` | `host-keyword, keyword, policy` | Domain keyword |
| `ip-cidr` | `ip-cidr, ip/mask, policy, no-resolve` | IP range |
| `ip6-cidr` | `ip6-cidr, ip/mask, policy, no-resolve` | IPv6 range |
| `geoip` | `geoip, CC, policy, no-resolve` | GEOIP country code |
| `dst-port` | `dst-port, port, policy` | Destination port |
| `src-port` | `src-port, port, policy` | Source port |
| `final` | `final, policy` | Final fallback |

<a id="注意-2"></a>
### Notes

- QX rule types are **all lowercase**, e.g. `host-suffix`, not `DOMAIN-SUFFIX`.
- `no-resolve` prevents DNS resolution for IP rules.
- `final` must be the final rule.
- Surge’s inline `RULE-SET,URL,policy` syntax is unsupported; declare remote rules in `[filter_remote]`.

---

<a id="八geoip-支持"></a>
## VIII. GEOIP support

- QX natively supports `geoip, CC, policy, no-resolve`.
- The historical reference records support for enhanced Loyalsoldier MMDB labels such as cloudflare/telegram/netflix/google.
- It describes custom MMDB configuration indirectly through `[general] resource_parser_url`, or manual replacement in system settings. This remains a historical statement, not newly verified behavior.

---

<a id="九已知差异总结"></a>
## IX. Recorded differences

| Item | Quantumult X | Surge | Shadowrocket |
|--------|-------------|-------|-------------|
| Section case | Lowercase | Case-sensitive, initial capital | Case-sensitive, initial capital |
| Node filtering | `server-tag-regex=` | `policy-regex-filter=` | `policy-regex-filter=` |
| Nested groups | **Unsupported** in the old summary (static + url-latency-benchmark only) | Supported | Supported |
| Remote rules | `[filter_remote]` tag=/force-policy= | `[Rule] RULE-SET,URL,policy` | `[Rule] RULE-SET,URL,policy` |
| Local types | Lowercase `host`/`host-suffix`/`ip-cidr` | Uppercase `DOMAIN`/`DOMAIN-SUFFIX`/`IP-CIDR` | Uppercase `DOMAIN`/`DOMAIN-SUFFIX`/`IP-CIDR` |
| Port rule | `dst-port` | `DEST-PORT` | `DST-PORT` |
| IPv6 CIDR | Separate `ip6-cidr` | Original table says possibly combined under `IP-CIDR` and names Loon | `IP-CIDR6` |
| DNS server | `server=IP` + `doh-server=URL` | `dns-server=IP` + `encrypted-dns-server=URL` | `dns-server=URL` + `proxy-dns-server=URL` |
| Multiple doh-server entries | Original table says iOS-version dependent, concurrent support on iOS 15+; use the reviewed syntax above | All effective | All effective |
| Final fallback | `final, policy` | `FINAL,policy` | `FINAL,policy,dns-failed` |
| Idle testing | `alive-checking=true/false` | None recorded | None recorded |
