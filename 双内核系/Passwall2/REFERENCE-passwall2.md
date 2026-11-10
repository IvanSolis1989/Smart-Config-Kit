<a id="passwall2-配置参考文档"></a>
# Passwall2 configuration reference

**English** | [简体中文](REFERENCE-passwall2.zh-CN.md)


> Reviewed on 2026-10-28: only GoogleFCM moved from downloads/updates to Google services. [Official shunt_rules.lua](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua) was rechecked. rule-set:remote SRS condition syntax remains; LuCI users still configure actual service exits. DNS, fake-IP, sniffing, other push services, and node groups were unchanged. No fields, minimum versions, or device-pass claims were added.

> Updated on 2026-10-19: official stable-tag UI and backends were checked separately; see the [full report and cached originals](../../docs/upstream/2026-10-19/singbox/report.md#passwall--passwall2). Older summaries below were not fully updated; backend boundaries in this section take precedence.

<a id="2026-10-19-现行核验"></a>
## Review current as of 2026-10-19

- Official stable [26.10.1-2](https://github.com/Openwrt-Passwall/openwrt-passwall2/releases/tag/26.10.1-2) was published on 2026-10-02. The latest listed prerelease was the older 26.9.9-2 (2026-09-09), not a newer-than-stable candidate.
- Shunt nodes use `protocol='_shunt'`; `type='sing-box'` and `type='Xray'` invoke different generators. The global entry reads `@global[0].node`.
- The sing-box backend converts `rule-set:remote:...srs` into `route.rule_set`; Xray explicitly skips it. Repository fused `.srs` therefore requires the sing-box backend.
- Stable-tag `util_xray.lua` can still insert a rule lacking destination domain/IP conditions after filtering leaves `domains=nil` and `ip=nil`. Combined with repository `network='tcp,udp'`, this broadens matching. No error is not acceptance; installation must block this combination before UCI writes.
- New versions still require an actual OpenWrt device. This review establishes pinned official source data flow and isolated tests, not accepted real traffic.

<a id="历史摘要未整篇复核"></a>
## Historical summary (not fully re-reviewed)

> 2026-10-15 URL compatibility review: retains documented native `rule-set:remote:https://.../*.srs` syntax from the official Passwall2 parser. Only URL hosts changed; parser scheme limits were not rechecked. See [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md).

> Updated on 2026-07-09: rechecked current `shunt_rules.lua`. Passwall2 `domain_list` / `ip_list` still accept `rule-set:remote:` / `rule-set:local:`. Repository fallback references `rulesets/generated/fused/sing-box/*.srs` directly instead of maintaining handwritten flattened domain/IP lists.
>
> Updated on 2026-05-31 (previous retrieval: 2026-04-30): latest Passwall2 v26.5.19-1 (2026-05-18), four versions after v26.4.20-1. Shunt syntax was unchanged.
>
> Updated on 2026-04-30 (previous retrieval: 2026-04-26): latest Passwall2 v26.4.20-1 (2026-04-19), adding APK package-management support for OpenWrt’s new package manager. Shunt syntax was unchanged.
>
> Source URLs:
> - https://github.com/Openwrt-Passwall/openwrt-passwall2 (Passwall2 source)
> - https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua (shunt-rule parser)
> - https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555 (Passwall versus Passwall2)
>
> Retrieved: 2026-07-09

---

<a id="1-passwall2-简介"></a>
## 1. About Passwall2

Passwall2 is a reduced OpenWrt shunt-routing proxy plugin maintained by Openwrt-Passwall.

**Positioning:** focuses on shunt matching. It removes the four lists (direct/block/GFW/proxy) and ACLs, retaining rule-based traffic control.

**Relationship to Passwall:** separate plugins maintained **in parallel**, not old/new versions. Passwall is the full edition with four lists, ACLs, and separate TCP/UDP selection; Passwall2 is reduced. Their rule syntax is interchangeable.

---

<a id="2-分流规则-uci-配置"></a>
## 2. UCI shunt-rule configuration

<a id="21-uci-配置名"></a>
### 2.1 UCI configuration name

Use `passwall2`. Original example/comments are retained:

```bash
CONFIG_NAME="passwall2"  # Passwall2 使用 "passwall2"
```

<a id="22-分流规则操作"></a>
### 2.2 Shunt-rule operations

This adds a shunt rule, remark, domain/IP conditions, network, unified target node, and commits. Original comments and configured labels remain:

```bash
# 添加一条新分流规则
SEC="$(uci add passwall2 shunt_rules)"

# 设置备注名
uci set passwall2.${SEC}.remarks='🤖 AI 服务'

# 添加域名匹配条目
uci add_list passwall2.${SEC}.domain_list='geosite:openai'
uci add_list passwall2.${SEC}.domain_list='domain:cursor.com'

# 添加 IP 匹配条目
uci add_list passwall2.${SEC}.ip_list='geoip:telegram'

# 设置网络协议
uci set passwall2.${SEC}.network='tcp,udp'

# 设置目标节点（Passwall2 用 node，不是 tcp_node/udp_node）
uci set passwall2.${SEC}.node='NEED_CONFIG_IN_LUCI'

# 提交更改
uci commit passwall2
```

---

<a id="3-域名列表-domain_list-语法"></a>
## 3. Domain-list (domain_list) syntax

According to the `shunt_rules.lua` parser:

| Format | Example | Meaning |
|------|------|------|
| Plain string | `sina.com` | **Keyword match**: domain contains the string, validated by Lua `datatypes.hostname` |
| `domain:` | `domain:google.com` | **Subdomain match**, recommended |
| `full:` | `full:www.google.com` | **Exact match** |
| `regexp:` | `regexp:\\.goo.*\\.com$` | **Regex match** |
| `geosite:` | `geosite:cn` | **Predefined domain list**, referencing geosite.dat |
| `rule-set:remote:` | `rule-set:remote:https://...geosite-cn.srs` | **Remote Sing-Box set** |
| `rule-set:local:` | `rule-set:local:/usr/share/sing-box/geosite-cn.srs` | **Local Sing-Box set** |
| `rs:remote:` | `rs:remote:https://...` | Abbreviated remote form |
| `rs:local:` | `rs:local:/path/to/file.srs` | Abbreviated local form |
| `ext:` | `ext:geosite.dat:cn` | **External file** |
| `#` | `# 注释` | **Comment line**, beginning with `#` |

**Unsupported:** Clash comma-prefixed forms such as `DOMAIN-SUFFIX,`, `DOMAIN-KEYWORD,`, and `IP-CIDR,`.

---

<a id="4-ip-列表-ip_list-语法"></a>
## 4. IP-list (ip_list) syntax

| Format | Example | Meaning |
|------|------|------|
| Plain IP | `127.0.0.1` | Single address, validated by `datatypes.ipmask4` / `ipmask6` |
| CIDR | `10.0.0.0/8` | IP range |
| `geoip:` | `geoip:cn` | Predefined GeoIP category |
| `rule-set:remote:` | `rule-set:remote:https://...geoip-cn.srs` | Remote Sing-Box set |
| `rule-set:local:` | `rule-set:local:/usr/share/sing-box/geoip-cn.srs` | Local Sing-Box set |
| `rs:remote:` | `rs:remote:https://...` | Abbreviation |
| `rs:local:` | `rs:local:/path/to` | Abbreviation |
| `ext:` | `ext:geoip.dat:cn` | External file |
| `#` | `#注释` | **Comment line** |

---

<a id="5-其他-uci-字段"></a>
## 5. Other UCI fields

| Field | Example | Meaning |
|------|------|------|
| `remarks` | `🤖 AI 服务` | Rule remark |
| `domain_list` | Multiline text | Domain list, TextValue |
| `ip_list` | Multiline text | IP list, TextValue |
| `network` | `tcp,udp` | Network protocol; ListValue: tcp,udp / tcp / udp |
| `protocol` | `http tls bittorrent` | Sniffed protocols, multiple choices |
| `inbound` | `tproxy socks` | Inbound tags, multiple choices |
| `source` | `192.168.1.0/24 geoip:private` | Source IP, DynamicList |
| `port` | `80,443` | Destination port |
| **`node`** | `node_tag` | **Passwall2-specific** unified target, not separate TCP/UDP |
| `invert` | `1` | Inverted matching, Sing-Box only |

---

<a id="6-与-passwall-的差异"></a>
## 6. Differences from Passwall

| Feature | Passwall2 | Passwall |
|------|-----------|----------|
| UCI config name | `passwall2` | `passwall` |
| Node fields | Unified `node` | `tcp_node` / `udp_node` |
| Four lists | Unsupported | Supported |
| ACL | Unsupported | Supported |
| Separate TCP/UDP selection | Unsupported | Supported |
| trojan-plus | Unsupported | Supported |
| Rule syntax | Identical | Identical |
| `.list` files | Interchangeable | Interchangeable |

---

<a id="7-list-文件格式"></a>
## 7. `.list` file format

These are plain-text files for copying into LuCI:

- One rule entry per line.
- Blank lines and `#` comments are ignored.
- Entries use exactly the `domain_list` / `ip_list` formats.
- Original example, with an ad-blocking comment:

```
  # 🛑 广告拦截
  geosite:category-ads-all
  ```
