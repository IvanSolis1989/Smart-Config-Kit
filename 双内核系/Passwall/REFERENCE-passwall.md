<a id="passwall-配置参考文档"></a>
# Passwall configuration reference

**English** | [简体中文](REFERENCE-passwall.zh-CN.md)


> Reviewed on 2026-10-28: only GoogleFCM moved from downloads/updates to Google services. [Passwall2’s shared shunt_rules.lua](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua) was rechecked. rule-set:remote SRS condition syntax remains; users still configure actual service exits in LuCI. DNS, fake-IP, sniffing, other push services, and node groups were unchanged. No fields, minimum versions, or device-pass claims were added.

> Updated on 2026-10-19: see the [full report and cached originals](../../docs/upstream/2026-10-19/singbox/report.md#passwall--passwall2) for official stable-tag source verification. The older summary below was not fully updated. UI acceptance does not establish backend compatibility.

<a id="2026-10-19-现行核验"></a>
## Review current as of 2026-10-19

- Official stable [26.10.16-2](https://github.com/Openwrt-Passwall/openwrt-passwall/releases/tag/26.10.16-2) was published on 2026-10-16. The API’s latest 30 records contained no prerelease, which does not prove none existed historically.
- Shunt nodes use `protocol='_shunt'` with backend `type='sing-box'` or `type='Xray'`. The global node comes from `@global[0].node`; ACLs have separate node entries.
- `.srs` through `rule-set:remote:` / `rule-set:local:` is **supported only by the sing-box backend**. Stable-tag `util_xray.lua` explicitly skips both prefixes. Older summaries incorrectly combined the two cores’ capabilities.
- `shunt_rules.lua` is the UI validator; actual generation occurs in `luasrc/passwall/util_sing-box.lua` and `util_xray.lua`. Inspect the call chain: successful UI saving does not prove Xray consumes `.srs`.
- The repository fused `.srs` installer must check the actual shunt backend and reject Xray before any UCI write. Device services and actual routing still require OpenWrt acceptance. Official stable source and reproduction evidence are cached.

<a id="历史摘要未整篇复核"></a>
## Historical summary (not fully re-reviewed)

> 2026-10-15 URL compatibility review: retains the documented native `rule-set:remote:https://.../*.srs` syntax from official Passwall/Passwall2 parsers. Only URL hosts changed; parser scheme restrictions were not reverified. See [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md).

> Updated on 2026-07-09: rechecked current `shunt_rules.lua`. Passwall `domain_list` / `ip_list` still accept `rule-set:remote:` / `rule-set:local:`. Repository fallback therefore references `rulesets/generated/fused/sing-box/*.srs` directly rather than maintaining handwritten flattened domain/IP lists.
>
> Updated on 2026-05-31 (previous retrieval: 2026-04-30): latest Passwall v26.5.20-1 (2026-05-20), five versions after v26.4.15-1. Shunt syntax was unchanged.
>
> Updated on 2026-04-30 (previous retrieval: 2026-04-26): latest Passwall v26.4.15-1 (2026-04-15). Since v25.3.9, it adapts to sing-box 1.12 Geo-data removal through Geoview-generated rule sets. Shunt syntax was unchanged.
>
> Source URLs:
> - https://github.com/Openwrt-Passwall/openwrt-passwall (Passwall source)
> - https://github.com/Openwrt-Passwall/openwrt-passwall/blob/main/luci-app-passwall/luasrc/model/cbi/passwall/client/shunt_rules.lua (Passwall shunt-rule parser)
> - https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua (Passwall2 parser; same rule syntax)
> - https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555 (Passwall versus Passwall2)
>
> Retrieved: 2026-07-09

---

<a id="1-passwall-简介"></a>
## 1. About Passwall

Passwall is a full-featured OpenWrt proxy/routing plugin maintained by Openwrt-Passwall.

**Positioning:** full edition with four lists (direct/block/GFW/proxy), shunt rules, ACLs, separate TCP/UDP node selection, and trojan-plus nodes.

**Relationship to Passwall2:** independently maintained in parallel, **not** old/new versions. Passwall2 is the reduced shunt edition, removing the four lists and ACLs while retaining shunt rules.

---

<a id="2-分流规则-uci-配置"></a>
## 2. UCI shunt-rule configuration

<a id="21-uci-配置名"></a>
### 2.1 UCI configuration name

Original command examples/comments are preserved as historical evidence. Use `passwall` for Passwall and `passwall2` for Passwall2:

```bash
CONFIG_NAME="passwall"  # Passwall 使用 "passwall"
                        # Passwall2 使用 "passwall2"
```

<a id="22-分流规则操作"></a>
### 2.2 Shunt-rule operations

The example adds a rule, sets its remark, domain/IP matches, network, separate TCP/UDP target nodes, and commits. Multiple domain values can use add_list or space-separated values:

```bash
# 添加一条新分流规则
SEC="$(uci add passwall shunt_rules)"

# 设置备注名
uci set passwall.${SEC}.remarks='🤖 AI 服务'

# 添加域名匹配条目（支持多值，可用 add_list 或空格分隔）
uci add_list passwall.${SEC}.domain_list='geosite:openai'
uci add_list passwall.${SEC}.domain_list='domain:cursor.com'

# 添加 IP 匹配条目
uci add_list passwall.${SEC}.ip_list='geoip:telegram'
uci add_list passwall.${SEC}.ip_list='1.1.1.0/24'

# 设置网络协议
uci set passwall.${SEC}.network='tcp,udp'

# 设置目标节点（Passwall 全功能版用 tcp_node / udp_node）
uci set passwall.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'
uci set passwall.${SEC}.udp_node='NEED_CONFIG_IN_LUCI'

# 提交更改
uci commit passwall
```

---

<a id="3-域名列表-domain_list-语法"></a>
## 3. Domain-list (domain_list) syntax

According to `shunt_rules.lua`:

| Format | Example | Meaning |
|------|------|------|
| Plain string | `sina.com` | **Keyword match**: domain contains the string |
| `domain:` | `domain:google.com` | **Subdomain match**: `google.com` and `*.google.com` |
| `full:` | `full:www.google.com` | **Exact match** |
| `regexp:` | `regexp:\\.goo.*\\.com$` | **Regex match** |
| `geosite:` | `geosite:cn` | **Predefined domain list**, referencing geosite.dat |
| `rule-set:remote:` | `rule-set:remote:https://.../geosite-cn.srs` | **Remote Sing-Box rule set** |
| `rule-set:local:` | `rule-set:local:/usr/share/sing-box/geosite-cn.srs` | **Local Sing-Box rule set** |
| `rs:remote:` | `rs:remote:https://...` | Abbreviation of the remote form |
| `rs:local:` | `rs:local:/path/to/file.srs` | Abbreviation of the local form |
| `ext:` | `ext:file:tag` | **External file**, less common |
| `#` | `# 这是注释` | **Comment line** |

**Unsupported:** Clash comma-prefixed forms such as `DOMAIN-SUFFIX,`, `DOMAIN-KEYWORD,`, `DOMAIN,`, and `IP-CIDR,`.

---

<a id="4-ip-列表-ip_list-语法"></a>
## 4. IP-list (ip_list) syntax

| Format | Example | Meaning |
|------|------|------|
| Plain IP | `127.0.0.1` | Single address |
| CIDR | `10.0.0.0/8` | IP range |
| `geoip:` | `geoip:cn` | Predefined GeoIP country/region code |
| `rule-set:remote:` | `rule-set:remote:https://.../geoip-cn.srs` | Remote Sing-Box set |
| `rule-set:local:` | `rule-set:local:/usr/share/sing-box/geoip-cn.srs` | Local Sing-Box set |
| `ext:` | `ext:geoip.dat:cn` | External file |
| `#` | `# 注释` | **Comment line** |

---

<a id="5-其他-uci-字段"></a>
## 5. Other UCI fields

| Field | Example | Meaning |
|------|------|------|
| `remarks` | `🤖 AI 服务` | Rule remark |
| `domain_list` | `geosite:openai` | Domain matches, multiple values, TextValue |
| `ip_list` | `geoip:cn` | IP matches, multiple values, TextValue |
| `network` | `tcp,udp` | Network protocol |
| `protocol` | `http tls` | Sniffed protocols, multiple values |
| `inbound` | `tproxy socks` | Inbound tags, multiple values |
| `source` | `192.168.1.0/24 geoip:private` | Source-IP restrictions, multiple values |
| `sourcePort` | `53` | Source port |
| `port` | `80,443` | Destination port |
| **`tcp_node`** | `node_tag` | Passwall-specific TCP target |
| **`udp_node`** | `node_tag` | Passwall-specific UDP target |
| `invert` | `1` | Invert matching, Sing-Box only |

---

<a id="6-与-passwall2-的差异"></a>
## 6. Differences from Passwall2

| Feature | Passwall | Passwall2 |
|------|----------|-----------|
| UCI config name | `passwall` | `passwall2` |
| Node fields | `tcp_node` / `udp_node` | Unified `node` |
| Four lists | Supported: direct/block/GFW/proxy | Unsupported |
| ACL | Per-client support | Unsupported |
| Separate TCP/UDP selection | Supported, tcp_node may differ from udp_node | Unsupported; same node |
| trojan-plus | Supported | Unsupported |
| Rule syntax | Identical | Identical |
| `.list` files | Interchangeable | Interchangeable |
