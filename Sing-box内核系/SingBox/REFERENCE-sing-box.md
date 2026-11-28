<a id="sing-box-配置参考文档"></a>
# Sing-Box configuration reference

**English** | [简体中文](REFERENCE-sing-box.zh-CN.md)


> Reviewed on 2026-11-28 (previous review 2026-10-28). The official current stable is 1.14.6 and the 1.15 prerelease changes the default TUN stack. See the version-specific checks and client boundaries below.

<a id="compatibility-review-2026-11-28"></a>

## Compatibility review for 2026-11-28

- Official releases list [1.14.6 stable](https://github.com/SagerNet/sing-box/releases/tag/v1.14.6), [1.15.0-alpha.15 prerelease](https://github.com/SagerNet/sing-box/releases/tag/v1.15.0-alpha.15) and [1.13.21](https://github.com/SagerNet/sing-box/releases/tag/v1.13.21) for the previous series. The existing baseline checks use official 1.14.3 and 1.13.14. In 1.14.6, duplicate outbound-group members are rejected and nested resolution was corrected. Neither generated file contains duplicate group members. [1.14.3 to 1.14.6 source comparison](https://github.com/SagerNet/sing-box/compare/v1.14.3...v1.14.6)
- Both current JSON files have `stack: mixed`. Official 1.15 builds omit `with_gvisor` by default. The `mixed` and `gvisor` stacks require this tag, and `stack` is deprecated in 1.15 with removal planned for 1.17. A 1.15 target needs a check and a separate TUN test with the new default stack. [TUN migration](https://sing-box.sagernet.org/migration/#migrate-tun-stack)
- Full uses named `http_clients` and DNS response matching. The 1.13 variant uses `download_detour`, deprecated from 1.14 and scheduled for removal in 1.16. The 78 published fused `.srs` files checked at `485453aa` all carry binary-format version 2. The application upgrade alone does not require recompiling the shared assets. [Rule-set configuration](https://sing-box.sagernet.org/configuration/rule-set/) · [Rule-set format](https://sing-box.sagernet.org/configuration/rule-set/source-format/)
- The US App Store lists [sing-box MT 1.14.8](https://apps.apple.com/us/app/sing-box-mt/id6785326793), published October 24. F-Droid lists [SFA 1.14.4](https://f-droid.org/packages/io.nekohasekai.sfa/), added October 27. Check the installed build on store channels. Apple profiles are subject to the [account migration](https://sing-box.sagernet.org/migration/#migrate-the-macos-standalone-client-data). The official [desktop clients](https://sing-box.sagernet.org/clients/desktop/) support complete local or remote profiles, and the Linux graphical package is named `sfl` from 1.14.5.

<a id="hiddify-profile-builder"></a>

### Hiddify profile builder

The GitHub and US App Store channels list Hiddify 5.9.15. Its build pins Hiddify Core 5.9.15 and the replaced sing-box module is the fork at `a26e58b3`, which includes upstream 1.15.0-alpha.13 in its ancestry. The fork exposes the 1.14 HTTP-client and DNS-response schema. Hiddify's build separately includes `with_gvisor`. [App dependency](https://github.com/hiddify/hiddify-app/blob/v5.9.15/dependencies.properties) · [Core dependency](https://github.com/hiddify/hiddify-core/blob/b736fe9926bea6680b429e0900f040eed2aeee45/go.mod#L329-L345) · [Fork ancestry](https://github.com/SagerNet/sing-box/compare/824dbcfb4dd0a95921840b1737b950cde590241e...hiddify:a26e58b376987a3305b201ec87fbc8918f620ad3)

The ordinary profile builder replaces `RouteOptions` after reading the input, and it reconstructs the outbound selector list. Both the App-pinned revision and released Windows Core contain this code. The raw branch calls `ReadSingOptions` directly. [App-pinned route builder](https://github.com/hiddify/hiddify-core/blob/b736fe9926bea6680b429e0900f040eed2aeee45/v2/config/builder.go#L1119-L1137) · [Raw configuration branch](https://github.com/hiddify/hiddify-core/blob/b736fe9926bea6680b429e0900f040eed2aeee45/v2/hcore/buildconfighelper.go#L28-L43)

The [official Windows Core 5.9.15 asset](https://github.com/hiddify/hiddify-core/releases/tag/v5.9.15) reported fork version 1.15.0-alpha.13, build tag `with_gvisor` and revision `4e5a9a35`. Offline `HiddifyCore.exe build --full-config` returned success for both repository JSON files at `485453aa`. For each, the saved result kept none of the 85 source rule-sets or 54 source groups, reduced routing rules from 98 to 4, removed the top-level `rules-download` client where present and changed the final policy to `select`. Using a settings file with `enable-full-config: true` and loopback DNS produced 6 rules and 2 Hiddify rule-sets, still retaining none of the source rule-sets or groups.

This check exercised configuration generation without starting a proxy or connecting a device. Use an official sing-box client for the supplied profiles, or verify the effective configuration through a raw path. Standalone Hiddify Core documents `srun` for direct loading of complete JSON. [Hiddify Core command reference](https://hiddify.com/core/cli/#srun)

<a id="homeproxy-package-and-uci"></a>

### HomeProxy package and UCI

HomeProxy master `fadaa676` depends on the feed's `sing-box` package. At review time, ImmortalWrt's master feed listed 1.14.3, and the 24.10 and 25.12 feeds listed 1.12.25. Check the router's installed version. HomeProxy's 1.14 adaptation and the case where a node is reached via a VPN still have open PRs. Use generated UCI configuration for validation, including startup and actual rule downloads. [Package dependency](https://github.com/immortalwrt/homeproxy/blob/fadaa676104f59ff6ace480a780a258d846d0aec/Makefile) · [Master feed](https://github.com/immortalwrt/packages/blob/master/net/sing-box/Makefile) · [25.12 feed](https://github.com/immortalwrt/packages/blob/openwrt-25.12/net/sing-box/Makefile) · [1.14 adaptation](https://github.com/immortalwrt/homeproxy/pull/671) · [Startup fix](https://github.com/immortalwrt/homeproxy/pull/673)

> Reviewed on 2026-10-28: only GoogleFCM moved from downloads/updates to Google services. [sing-box Route Rule](https://sing-box.sagernet.org/configuration/route/rule/) was rechecked. Existing rule_set/route outbound mappings and both 1.13/1.14 outputs remain. DNS, fake-IP, sniffing, other push services, and node groups were unchanged. No fields, minimum versions, or device-pass claims were added.

> Updated on 2026-10-19: official originals were checked for the fields involved; see the [version, source, adaptation, and validation report](../../docs/upstream/2026-10-19/singbox/report.md) and its cache. Older summaries below were not fully updated. Where they conflict, the following review takes precedence. Code examples and obsolete statements remain historical evidence, not current configuration recommendations.

<a id="2026-10-19-现行核验"></a>
## Review current as of 2026-10-19

- Stable was [1.14.3](https://github.com/SagerNet/sing-box/releases/tag/v1.14.3) (2026-10-09); prerelease was [1.15.0-alpha.12](https://github.com/SagerNet/sing-box/releases/tag/v1.15.0-alpha.12) (2026-10-11). Alpha capabilities are not stable-version evidence.
- [`http_client`](https://sing-box.sagernet.org/configuration/rule-set/#http_client) was introduced **only in 1.14.0**, accepting named clients or inline objects. The old claim that migration to it preserved 1.11–1.13 compatibility was wrong. `download_detour` was deprecated in 1.14, with removal planned for 1.16, and remains valid for the 1.13 variant.
- [Typed DNS servers](https://sing-box.sagernet.org/configuration/dns/server/https/) arrived in **1.12**; old `address` / `address_resolver` forms were removed in 1.14. Old inbound `sniff` / `sniff_override_destination` were removed in 1.13, replaced by routing `action: sniff`.
- Current Full requires 1.14.3; the same generator also emits `SingBox(sing-box)-1.13.json`. Official 1.14.3 / 1.13.14 `check` passed respectively without deprecated-feature environment variables. Nonstandard `_meta` moved out of runtime JSON.
- Full’s China-IP DNS filter migrated to `evaluate` → `match_response` → `respond`; 1.13 retains that series’ supported GeoIP acceptance filtering. Rule URLs, outbound topology, and relative service-route order are the same.
- Both the current official [Block](https://sing-box.sagernet.org/configuration/outbound/block/) page and actual 1.14.3 checks support `type: block`, retained for group references. Do not infer removal from old migration summaries.
- Hiddify app 4.1.1 pins core 4.1.0 / 1.13-derived source; complete-config preservation also depends on app parsing mode. HomeProxy generates from UCI; direct full import of repository JSON as a subscription is not established. See corresponding report sections.
- Sniff migration retains only SNI/Host-assisted matching. New upstream actions have no equivalent dynamic destination-rewrite switch. Old `sniff_override_destination=true` dialing semantics cannot be fully preserved; IP destinations still dial the original IP. Unknown fields or fixed `override_address` must not pretend equivalence. See [pinned-source checks](../../docs/upstream/2026-10-19/singbox/report.md#嗅探迁移的行为边界).

<a id="历史摘要保留原获取日期未整篇复核"></a>
## Historical summary (original retrieval dates; not fully re-reviewed)

> 2026-10-15 URL compatibility review: [official rule-set documentation](https://sing-box.sagernet.org/configuration/rule-set/) defines `url` for `type: remote` without explicitly restricting schemes. Only remote-asset hosts changed; `.srs`, `format: binary`, and other fields remained. See [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md).

> Updated on 2026-07-14: official Route Rule documentation was rechecked. `process_name` remains a documented Linux/Windows/macOS process-name field. The repository compiles `WorkPro.exe` / `WorkProWebProcess.exe` into Windows desktop direct sets, not mobile outputs.
>
> Updated on 2026-05-31 (previous retrieval: 2026-04-30): 1.14.0-alpha.26 added Hysteria2 gecko obfuscation, disguising QUIC traffic through `min_packet_size`/`max_packet_size`. Alpha.20–25 included mDNS servers, Windows Schannel TLS, Hysteria2 NAT traversal, and custom TUN DNS modes. Stable remained 1.13.12. The historical summary claimed completed `download_detour` → `http_client` migration compatible with 1.11–1.13 and no effect from alpha features; that compatibility claim is corrected above.
>
> Updated on 2026-04-30 (previous retrieval: 2026-04-26): 1.14.0-alpha.19 introduced top-level `http_clients` (replacing inline `http_client`), planned removal of old DNS format in 1.14, TLS spoof/NaiveProxy/Tailscale capabilities, and `default_http_client`. The historical summary again claimed migration compatible with 1.11–1.13; see the correction above.
>
> Source URLs:
> - https://sing-box.sagernet.org/configuration/ (configuration index)
> - https://sing-box.sagernet.org/configuration/outbound/ (outbounds)
> - https://sing-box.sagernet.org/configuration/outbound/selector (Selector)
> - https://sing-box.sagernet.org/configuration/outbound/urltest (URLTest)
> - https://sing-box.sagernet.org/configuration/route/ (routing)
> - https://sing-box.sagernet.org/configuration/route/rule_set (rule sets)
> - https://sing-box.sagernet.org/configuration/dns/ (DNS)
> - https://sing-box.sagernet.org/configuration/experimental/ (experimental features)
>
> Retrieved: 2026-04-26

---

<a id="1-配置结构总览"></a>
## 1. Configuration structure

Top-level keys:

```json
{
  "log": {},
  "dns": {},
  "inbounds": [],
  "outbounds": [],
  "route": {},
  "experimental": {},
  "ntp": {},
  "endpoints": [],
  "services": []
}
```

---

<a id="2-dns-配置-dns"></a>
## 2. DNS configuration (dns)

<a id="21-顶层字段"></a>
### 2.1 Top-level fields

```json
{
  "dns": {
    "servers": [],
    "rules": [],
    "final": "",
    "strategy": "",
    "disable_cache": false,
    "disable_expire": false,
    "independent_cache": false,
    "cache_capacity": 0,
    "optimistic": false,
    "reverse_mapping": false,
    "client_subnet": "",
    "fakeip": {}
  }
}
```

| Field | Type | Meaning |
|------|------|------|
| `servers` | `[]DNS Server` | DNS-server list |
| `rules` | `[]DNS Rule` | DNS-rule list |
| `final` | `string` | Default server tag; empty uses `servers[0]` |
| `strategy` | `string` | Default domain strategy: `prefer_ipv4` / `prefer_ipv6` / `ipv4_only` / `ipv6_only` |
| `disable_cache` | `bool` | Disable DNS cache |
| `disable_expire` | `bool` | Disable cache expiration |
| `independent_cache` | `bool` | Deprecated in 1.14.0; do not use |
| `cache_capacity` | `int` | LRU capacity, 1.11+; values below 1024 ignored |
| `optimistic` | `bool|object` | Optimistic DNS cache, 1.14+ |
| `reverse_mapping` | `bool` | Store IP-to-domain mappings from DNS responses |
| `client_subnet` | `string` | Default EDNS0 client subnet, 1.9+ |

<a id="22-dns-服务器-servers"></a>
### 2.2 DNS servers (servers[])

```json
{
  "tag": "my-dns",
  "address": "udp://223.5.5.5:53",
  "address_resolver": "bootstrap",
  "address_strategy": "prefer_ipv4",
  "strategy": "prefer_ipv4",
  "detour": "DIRECT",
  "client_subnet": "1.2.3.4/24"
}
```

**Historical `address` formats:**
- Plain IP: `223.5.5.5`, inferring UDP.
- UDP: `udp://1.1.1.1:53`.
- TCP: `tcp://1.1.1.1:53`.
- TLS: `tls://1.1.1.1:853`.
- HTTPS: `https://cloudflare-dns.com/dns-query`.
- DHCP: `dhcp://auto`.
- Local: `localhost`, using system DNS.
- Fakedns: `fakedns://` or `fakedns://:53`.

**Historical note:** the older summary said DNS servers had **no** `type`, `server`, or `server_port` and labeled them invalid Clash/Mihomo syntax. This original statement is retained as historical evidence; the typed-DNS correction above takes precedence.

<a id="23-dns-规则-rules"></a>
### 2.3 DNS rules (rules[])

```json
{
  "rule_set": ["geosite-cn"],
  "inbound": ["tun-in"],
  "server": "dns-direct",
  "action": "route" | "reject",
  "disable_cache": false,
  "strategy": "prefer_ipv4",
  "client_subnet": ""
}
```

- `rule_set`: references tags defined in `route.rule_set`.
- `action`: `route` forwards to `server`; `reject` rejects the query.
- Match fields include `rule_set`, `inbound`, `port`, `network`, `protocol`, `query_type`, and others.

---

<a id="3-出站配置-outbounds"></a>
## 3. Outbounds

<a id="31-通用字段"></a>
### 3.1 Common fields

All outbounds share these fields; original placeholders remain:

```json
{
  "type": "selector|urltest|direct|block|dns|...",
  "tag": "唯一标签",
  ...
}
```

<a id="32-selector"></a>
### 3.2 Selector

```json
{
  "type": "selector",
  "tag": "🚀 节点选择",
  "outbounds": ["🌍 全球节点", "DIRECT"],
  "default": "🌍 全球节点",
  "interrupt_exist_connections": false
}
```

| Field | Type | Meaning |
|------|------|------|
| `type` | `string` | Must be `selector` |
| `tag` | `string` | Unique tag |
| `outbounds` | `[]string` | Selectable outbound tags |
| `default` | `string` | Optional default selection |
| `interrupt_exist_connections` | `bool` | Interrupt existing connections on change |

<a id="33-urltest"></a>
### 3.3 URLTest

```json
{
  "type": "urltest",
  "tag": "🌍 全球节点",
  "outbounds": ["🇭🇰 香港节点", "🇹🇼 台湾节点", ...],
  "interval": "3m",
  "tolerance": 50,
  "idle_timeout": "30m",
  "interrupt_exist_connections": false
}
```

| Field | Type | Meaning |
|------|------|------|
| `type` | `string` | Must be `urltest` |
| `tag` | `string` | Unique tag |
| `outbounds` | `[]string` | Test candidates |
| `interval` | `duration` | Test interval, e.g. `3m` |
| `tolerance` | `int` | Latency tolerance in ms; the historical summary describes random selection within the tolerance |

<a id="34-direct--block--dns"></a>
### 3.4 Direct / Block / DNS

```json
{ "type": "direct", "tag": "DIRECT" }
{ "type": "block", "tag": "REJECT" }
{ "type": "dns", "tag": "dns-out" }
```

---

<a id="4-路由配置-route"></a>
## 4. Routing (route)

<a id="41-顶层字段"></a>
### 4.1 Top-level fields

```json
{
  "route": {
    "rules": [],
    "rule_set": [],
    "final": "",
    "auto_detect_interface": true,
    "override_android_vpn": true,
    "default_domain_strategy": ""
  }
}
```

| Field | Type | Meaning |
|------|------|------|
| `rules` | `[]Route Rule` | Routing rules |
| `rule_set` | `[]Rule Set` | Rule-set definitions |
| `final` | `string` | Default outbound when no rule matches |
| `auto_detect_interface` | `bool` | Automatically detect network interface |
| `override_android_vpn` | `bool` | Android VPN override; requires `auto_detect_interface` |
| `default_domain_strategy` | `string` | Default domain strategy |

<a id="42-路由规则-rules"></a>
### 4.2 Routing rules (rules[])

```json
{
  "action": "route",
  "outbound": "🐟 漏网之鱼",
  "rule_set": ["geosite-cn"],
  "inbound": ["tun-in"],
  "network": "tcp",
  "port": [80, 443],
  "port_range": "1000:2000",
  "domain": ["example.com"],
  "domain_suffix": [".example.com"],
  "domain_keyword": ["example"],
  "domain_regex": ["^example\.com$"],
  "geoip": ["CN"],
  "geosite": ["cn"],
  "ip_cidr": ["1.1.1.0/24"],
  "ip_is_private": true,
  "source_ip_cidr": ["10.0.0.0/8"],
  "source_port": [1234],
  "process_name": ["curl"],
  "process_path": ["/usr/bin/curl"],
  "user_id": [1000],
  "user": ["user1"],
  "clash_mode": "direct",
  "protocol": ["http", "tls", "quic", "bittorrent"],
  "invert": false
}
```

**Actions listed in the historical summary:**
- `action: "route"` + `outbound: "tag"`: forward to an outbound.
- `action: "reject"`: reject the connection.
- `action: "hijack_dns"`: intercept DNS requests.

**Match fields listed for `route`:**
- `rule_set`, `inbound`, `protocol`, `network`, `port`, `port_range`
- `domain`, `domain_suffix`, `domain_keyword`, `domain_regex`
- `geoip`, `geosite`, `ip_cidr`, `ip_is_private`
- `source_ip_cidr`, `source_port`
- `process_name`, `process_path`, `user_id`, `user`
- `clash_mode`, `network_type`, `device`, `metadata`

<a id="43-规则集-rule_set"></a>
### 4.3 Rule sets (rule_set[])

```json
{
  "type": "remote",
  "tag": "geosite-cn",
  "format": "binary",
  "url": "https://...geosite-cn.srs",
  "download_detour": "DIRECT",
  "http_client": {
    "detour": "🌍 全球节点"
  },
  "update_interval": "1d"
}
```

| Field | Type | Meaning |
|------|------|------|
| `type` | `string` | `remote` or `local` |
| `tag` | `string` | Unique tag referenced by `rule_set` |
| `format` | `string` | `binary` (`.srs`) or `source` (`.json`) |
| `url` | `string` | Remote set URL only |
| `path` | `string` | Local file path only |
| `download_detour` | `string` | Outbound for set downloads |
| `http_client.detour` | `string` | HTTP-client outbound, overriding download_detour |
| `update_interval` | `duration` | Update interval |

---

<a id="5-实验性功能-experimental"></a>
## 5. Experimental features (experimental)

<a id="51-合法字段"></a>
### 5.1 Accepted fields

```json
{
  "experimental": {
    "cache_file": {},
    "clash_api": {},
    "v2ray_api": {}
  }
}
```

The historical summary lists **only** `cache_file`, `clash_api`, and `v2ray_api` in `experimental`, warning that unknown fields cause configuration warnings.

<a id="52-cache-file"></a>
### 5.2 Cache File

```json
{
  "cache_file": {
    "enabled": true,
    "path": "cache.db",
    "store_fakeip": true,
    "cache_id": "",
    "password": ""
  }
}
```

<a id="53-clash-api"></a>
### 5.3 Clash API

```json
{
  "clash_api": {
    "external_controller": "0.0.0.0:9090",
    "external_ui": "",
    "external_ui_download_url": "",
    "external_ui_download_detour": "",
    "secret": "",
    "default_mode": "",
    "access_control_allow_origin": [],
    "access_control_allow_private_network": false,
    "store_selected": true,
    "store_fakeip": false,
    "cache_file": ""
  }
}
```

---

<a id="6-语法要点"></a>
## 6. Syntax notes

These retain the original summary’s claims, not newly verified current-version guidance:

1. **`rule_set` references:** routing fields reference `tag` values in `route.rule_set[]`, not filenames.
2. **`domain_suffix` matching:** the historical summary says `domain_suffix: [".example.com"]` matches `example.com` and `*.example.com` and requires the `.` prefix for subdomains.
3. **`geoip`:** the summary describes `geoip: ["CN"]` as inline GeoIP in `route.rules[]`, without an additional rule_set; `ip_cidr` is another option.
4. **`outbound`:** rules use `outbound`, not Xray’s `outboundTag`.
5. **DNS `address`:** the historical summary describes `address`, not `server`, with type encoded in the prefix; see the current typed-DNS correction above.
6. **Selector `default`:** optional but strongly recommended; if omitted, `outbounds[0]` is selected.
7. **No `{all}` in Selector/URLTest:** unlike Clash, sing-box does not expand `{all}`; list candidates explicitly.
