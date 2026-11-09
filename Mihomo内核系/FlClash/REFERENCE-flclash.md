<a id="flclash-参考文档"></a>
# FlClash reference

**English** | [简体中文](REFERENCE-flclash.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

> Reviewed on 2026-10-31 (Issue #193): retains the verified v0.9.0 / v0.9.1 `main(config)` extension entry. Uses `AND` / `NETWORK` / `PROCESS-NAME` / `REJECT` as documented in [Mihomo rules](https://wiki.metacubex.one/config/rules/) to add an opt-in, trusted-local Windows browser UDP rejection layer. The three `.exe` names and `find-process-mode: strict` apply only to identifiable Windows processes whose traffic reaches the core, not Android. The final configuration after the App patch and device connectivity still require checking. Default DNS/routing and the minimum script API version are unchanged.

> Reviewed on 2026-10-31 (UI wording): checked “More → Override” in the [v0.8.99 profile menu](https://github.com/chen08209/FlClash/blob/v0.8.99/lib/views/profiles/profiles.dart#L315-L354) and the [v0.9.1 script menu](https://github.com/chen08209/FlClash/blob/v0.9.1/lib/views/config/scripts.dart#L282-L320). The three creation choices in the [Chinese resources](https://github.com/chen08209/FlClash/blob/v0.9.1/arb/intl_zh_CN.arb) mean “Start from scratch”, “Import via URL”, and “Import via file”; v0.8.99 has the same choices. There is no import menu named “Paste”.

> Reviewed on 2026-10-31 (Issue #194): [v0.9.0](https://github.com/chen08209/FlClash/releases/tag/v0.9.0) (2026-10-14) already offers per-profile “Extension → Script”; [v0.9.1](https://github.com/chen08209/FlClash/releases/tag/v0.9.1) (2026-10-17) retains it. The entry change is not exclusive to v0.9.1. [Extension mode](https://github.com/chen08209/FlClash/blob/v0.9.0/lib/views/profiles/extend/extend.dart) saves `extendType`; the [script selector](https://github.com/chen08209/FlClash/blob/v0.9.0/lib/views/profiles/extend/script.dart) saves the current Profile's `scriptId` and opens script management through `goToConfigureScript`. [Script management](https://github.com/chen08209/FlClash/blob/v0.9.0/lib/views/config/scripts.dart) supports fetching and synchronizing script text by URL. Its [Rust script entry](https://github.com/chen08209/FlClash/blob/v0.9.0/plugins/rust_api/rust/src/script/mod.rs) remains `main(config)`. This change corrects documentation/header comments only, not the API or v0.8.85 minimum. New UI screenshots come from [Issue #194](https://github.com/IvanSolis1989/Smart-Config-Kit/issues/194). Source review and documentation rendering do not replace device import acceptance; memory use was not measured.

> Reviewed on 2026-10-29: rechecked [Mihomo DNS](https://wiki.metacubex.one/config/dns/) and [hosts](https://wiki.metacubex.one/config/dns/hosts/). hosts-only is an explicit trusted-local script parameter that adds only exact node-IP hosts entries. The existing QuickJS override entry and App-managed port/TUN boundaries remain. Actual pinned QuickJS validation was added; this is not a FlClash device-pass claim.

> Reviewed on 2026-10-28: only reclassified GoogleFCM from downloads/updates to Google services. Rechecked [Mihomo routing rules](https://wiki.metacubex.one/config/rules/), retaining the existing RULE-SET policy-name references emitted by the script and the App override boundary. DNS, fake-IP, sniffing, other push services and node groups are unchanged; no fields, minimum versions or device-pass claims were added.

> Reviewed on 2026-10-23 (previous focused review 2026-10-20): reread the [official FlClash repository](https://github.com/chen08209/FlClash) and [Mihomo DNS](https://wiki.metacubex.one/config/dns/#nameserver-policy). Retains JS overrides and the same policy fields without changing App-managed TUN/ports.

> Reviewed on 2026-10-19: the current stable version was v0.9.1 (2026-10-17); desktop TUN overrides became per-key selections. The App patch still follows script execution, with per-key boundaries for DNS/NTP as well. This tag actually pins `chen08209/Clash.Meta` at `8380d0e7462f061a964323e9bf3129a236fcc5d5`, not the current MetaCubeX stable. Original release, script-execution, DNS/TUN-patch and core-gitlink evidence is retained in the [review report](../../docs/upstream/2026-10-19/mihomo/report.md). Device import was not verified. The historical summary below was not revalidated paragraph by paragraph.

> Reviewed on 2026-10-16 (previously 2026-10-15): the then-latest official [v0.9.0](https://github.com/chen08209/FlClash/releases/tag/v0.9.0) changed DNS/NTP override toggles to per-key settings and adjusted the custom-configuration UI. The [Mihomo fake-IP mode definition](https://wiki.metacubex.one/config/dns/#fake-ip-filter-mode) is unchanged. This fixes list inheritance during script execution only, with no new core fields. VM validation is not v0.9.0 UI/device import acceptance; inspect the final configuration for the DNS keys actually selected.

> 2026-10-15 URL compatibility review: FlClash ultimately consumes Mihomo `rule-providers`. The [official Mihomo documentation](https://wiki.metacubex.one/en/config/rule-providers/) gives HTTPS raw URL examples for the required `url` of `type: http`. Only the host of repository-owned rule URLs changed, not the fields; see [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md).

> Reviewed on 2026-10-14 (previously 2026-10-12): [official latest](https://github.com/chen08209/FlClash/releases/latest) still pointed to v0.8.99. The fix preserves trusted JS boolean constants in Node synchronization/local-copy tooling. Mobile uses existing script syntax and association flow, defaulting to false. No core fields or increase to the v0.8.85 minimum; this does not replace mobile device acceptance.

> Updated on 2026-10-12 (previous review 2026-09-30): the then-latest official stable [v0.8.99](https://github.com/chen08209/FlClash/releases/tag/v0.8.99) was released on 2026-10-03. The [getProfile script branch](https://github.com/chen08209/FlClash/blob/v0.8.99/lib/providers/actions/setup.dart#L361-L375) still loads the associated script and calls `handleEvaluate`. The [v0.8.85 release notes](https://github.com/chen08209/FlClash/releases/tag/v0.8.85) already declare override-script support. The local ZeroTier boolean uses existing JS constructs without raising the minimum. This is source/VM configuration validation, not mobile device acceptance.

> Same-day addition: inline proxy collections containing only type/payload are flattened at the FlClash JS execution boundary, retaining [Mihomo collection fields](https://wiki.metacubex.one/config/proxy-providers/). direct/reject objects remain for dependency references and are excluded only from speed-test classification. Array identity, unknown protocol fields, shared payload and JSON serialization are read back through actual main regressions; this does not replace on-device App patch acceptance.

> Updated on 2026-09-30 (previous review 2026-08-31): the live release was [v0.8.98](https://github.com/chen08209/FlClash/releases/tag/v0.8.98) (2026-09-14). Rechecked that tag's [getProfile](https://github.com/chen08209/FlClash/blob/v0.8.98/lib/providers/actions/setup.dart#L315-L368) and [configuration patch](https://github.com/chen08209/FlClash/blob/v0.8.98/lib/common/task.dart#L109-L245): scripts still execute before the App patch; DNS override/system-DNS append boundaries remain as described below. Node preflight and multiplier filtering use existing JS syntax and preserve array identity. The stated v0.8.85 minimum is unchanged. VM regression does not replace on-device App patch acceptance.

> Source: https://github.com/chen08209/FlClash
> Retrieved: 2026-05-03
> Updated on 2026-07-25 (recheck): the latest FlClash was v0.8.94 (2026-07-11). No breaking change relative to v0.8.93 was found affecting this repository's JS override entry, DNS object or subscription association flow; the baseline was compatible.
> Updated on 2026-08-31: checked stable v0.8.96 (2026-08-17), commit `e2f678909dd9738015a5c032a8e25288ed79d4f1`. Corrected script/App patch ordering, whole-DNS replacement, system-DNS append and Android HTTP proxy boundaries.
> Historical reviewed version: v0.8.96. The original record points to the 2026-10-12 entry above for the current review; later dated entries are also retained. App patch behavior is not unconditionally extrapolated to all older/prerelease versions.

---

<a id="1-项目概述"></a>
## 1. Project overview

FlClash is a Flutter-based, multi-platform Mihomo (formerly ClashMeta) client.

- **Platforms**: Android / Windows / macOS / Linux
- **Core**: standard Mihomo, modified with an FFI bridge
- **Upstream license**: GPL-3.0
- **Repository**: https://github.com/chen08209/FlClash

---

<a id="2-配置架构"></a>
## 2. Configuration architecture

FlClash uses two configuration layers:

| Layer | Class | Responsibility |
|---|---|---|
| Application | `AppSettingProps` | UI, theme, language, VPN options, autostart, etc. |
| Proxy engine | `ClashConfig` | Ports, mode, DNS, TUN, proxy groups, rules, etc. |

<a id="clashconfig-关键字段"></a>
### Key ClashConfig fields

| Field | Type | Description |
|------|------|------|
| `mixed-port` | int | Mixed proxy port (default 7890) |
| `mode` | Mode | Routing mode: rule / global / direct |
| `allow-lan` | bool | Allow LAN connections |
| `log-level` | LogLevel | Logging level |
| `ipv6` | bool | IPv6 support |
| `find-process-mode` | FindProcessMode | Process matching mode |
| `unified-delay` | bool | Unified latency testing |
| `tcp-concurrent` | bool | Concurrent TCP connections |
| `tun` | Tun | TUN device configuration |
| `dns` | Dns | DNS resolution configuration |
| `proxy-groups` | List\<ProxyGroup\> | Proxy group list |
| `rules` | List\<String\> | Routing rule list |
| `rule-providers` | Map\<String,RuleProvider\> | Rule providers |
| `hosts` | Map\<String,String\> | Host mappings |
| `geox-url` | GeoXUrl | GeoIP/GeoSite/ASN database URLs |

<a id="android-应用层与内核层边界"></a>
### Android application/core boundary

Android VPN, HTTP proxy, app access control and “Allow apps to bypass VPN” are application-layer settings. `vpnProps.systemProxy=true` publishes an HTTP proxy pointing at the local port; it is not a switch for traffic to other countries. `rejectSelected` excludes apps through `addDisallowedApplication`, whereas `allowBypass` lets apps explicitly select an underlying network. They are different options.

The v0.8.96 [Android VPN page](https://github.com/chen08209/FlClash/blob/v0.8.96/lib/views/config/network.dart#L70-L88) calls this “System proxy”, not “Proxy only”. It adds an HTTP proxy, but TUN is still created and runs. Do not interpret it as an HTTP-only mode that disables VPN.

Top-level `ipv6`, `dns.ipv6` and Android VPN `ipv6` are three separate settings. The App patch rewrites top-level IPv6 after the script, and DNS override also replaces DNS IPv6/PreferH3. Setting false in the script alone does not establish that the final setting is disabled; explicitly disable the application-layer settings too.

Official references: [VpnService.kt](https://github.com/chen08209/FlClash/blob/v0.8.96/android/service/src/main/java/com/follow/clash/service/VpnService.kt#L109-L146), [app exclusion](https://github.com/chen08209/FlClash/blob/v0.8.96/android/service/src/main/java/com/follow/clash/service/VpnService.kt#L200-L209), [Android setHttpProxy](https://developer.android.com/reference/android/net/VpnService.Builder#setHttpProxy(android.net.ProxyInfo)). Android warns that combining an HTTP proxy with split tunneling may affect connectivity. This is a risk notice, not measured connection evidence for any particular app.

---

<a id="3-覆写系统"></a>
## 3. Override system

<a id="31-配置应用流水线"></a>
### 3.1 Configuration application pipeline

The original illustrative diagram is retained: read Profile, choose JS/rules/groups, run JS, apply App patch, encode YAML, configure core.

```
读取 Profile → 按覆写类型选择 JS/规则/分组 → JS main(config)
→ makeRealProfileTask 应用 App patch → YAML 编码 → 核心设置
```

Follow [getProfile in setup.dart](https://github.com/chen08209/FlClash/blob/v0.8.96/lib/providers/actions/setup.dart#L251-L301): evaluate the script first, then call [_makeRealProfileTask in task.dart](https://github.com/chen08209/FlClash/blob/v0.8.96/lib/common/task.dart#L108-L213). The script is not the final writer.

| Subsequent operation | Result |
|---|---|
| Top-level IPv6, ports, mode, process matching, TUN, GeoX | Written back from App patch, replacing the same script fields |
| hosts | App entries replace same-name entries; other script hosts remain |
| DNS override on, or source DNS disabled | Entire DNS reserialized from the App model; nameserver-policy rebuilt |
| DNS override off and script DNS enabled | Script DNS map retained |
| appendSystemDns on | System resolvers appended after the above operations; also applies to Android |

The [Dns model](https://github.com/chen08209/FlClash/blob/v0.8.96/lib/models/clash_config.dart#L255-L303) does not declare `proxy-server-nameserver-policy`, `direct-nameserver` or `direct-nameserver-follow-policy`. Pasting complete script DNS into the UI therefore still loses these keys. Disable DNS override to retain script-provided fields. Old values retained in App forms do not represent final DNS.

Mihomo's description of [respect-rules, node DNS, direct DNS and PreferH3](https://wiki.metacubex.one/config/dns/) defines core semantics; it does not mean the FlClash UI can preserve every field losslessly.

<a id="32-图形化覆写规则v0881"></a>
### 3.2 Graphical override rules (v0.8.81+)

Rule types the UI supports adding:
- `DOMAIN-SUFFIX`: domain suffix match
- `DOMAIN-KEYWORD`: domain keyword match
- `DOMAIN`: exact domain match
- `IP-CIDR`: IP CIDR range match
- `GEOIP`: GeoIP location match, such as CN
- `PROCESS-NAME`: process-name match (Windows only)

<a id="33-javascript-覆写脚本v0885"></a>
### 3.3 JavaScript override scripts (v0.8.85+)

<a id="入口函数"></a>
#### Entry function

Original example; its comment means “modify the config object”.

```javascript
function main(config) {
  // 修改 config 对象
  return config;
}
```

`config` is the configuration map passed to JS after reading the Profile. The returned value still goes through the App patch above and is not final YAML.

<a id="支持的操作"></a>
#### Supported operations

| Operation | Example |
|------|------|
| Modify proxy groups | `config["proxy-groups"].push({name:"MyGroup", type:"select", proxies:[...]})` |
| Add/replace rules | `config.rules = ["DOMAIN-SUFFIX,example.com,DIRECT", ...config.rules]` |
| Inject rule providers | `config["rule-providers"]["my-rules"] = {type:"http", ...}` |
| Modify global settings | `config["unified-delay"] = true` |
| Modify DNS | `config.dns = {...}` |
| Modify TUN | `config.tun = {...}` |
| Filter/inject nodes | `config.proxies = config.proxies.filter(...)` |

<a id="覆写合并语义"></a>
#### Override merge semantics

| Section | Operation |
|--------|------|
| `rules` | prefix (prepend) / suffix (append) |
| `proxies` | prefix / suffix / override (replace by matching name) |
| `proxy-groups` | prefix / suffix / override (replace by matching name) |
| Other fields | Do not assume universal deep merging; whole-DNS replacement and same-name hosts merging follow the App patch in §3.1 |

<a id="代理组类型"></a>
#### Proxy group types

- `select`: manual selection
- `url-test`: automatic latency-based selection (requires `url`, `interval`, `tolerance`)
- `relay`: proxy chain
- `load-balance`: load balancing
- `fallback`: failover

<a id="特殊字段"></a>
#### Special fields

- `hidden: true`: hide the group on the proxy page
- `lazy: true`: lazy testing, only when needed

---

<a id="4-js-引擎环境"></a>
## 4. JS engine environment

The historical summary identifies an embedded JS engine, inferred from Flutter integration to be QuickJS. This inference is retained as history, not a new verification. It lists support for:
- Basic ES5/ES6 syntax (`const`/`let`, arrow functions, template literals)
- `RegExp` (regular expressions)
- `Array` / `Object` / `Map` / `Set`
- `String` / `Number` / `Boolean`

**Support uncertain in the original review**:
- `console.log`: may be unsupported; repository scripts guard it conditionally.

---

<a id="5-与-clash-party-js-的关键差异"></a>
## 5. Key differences from Clash Party JS

The following is the historical comparison, not a newly verified statement about every current engine/fork.

| Dimension | Clash Party JS | FlClash override scripts |
|------|:---:|:---:|
| Execution environment | Sub-Store JS engine | Embedded FlClash QuickJS |
| `type: smart` | Supported by Smart edition | Unsupported (core limitation) |
| LightGBM | Supported by Smart edition | Unsupported (core limitation) |
| Multiple subscription providers | Passed in after Sub-Store merges | Single FlClash subscription passed in |
| TUN management | Script override | App UI |
| Port management | Script override | App UI |
| `config` structure | Standard mihomo config | JS receives a map, but the App UI field model and subsequent patch are not lossless passthrough |

<a id="geox-资源路径"></a>
## GeoX resource path

URLs edited on the [resources page](https://github.com/chen08209/FlClash/blob/v0.8.96/lib/views/resources.dart#L115-L147) are saved to the App patch and written to the core when configuration is generated. Synchronization is handled by `updateGeoData` in the [core controller](https://github.com/chen08209/FlClash/blob/v0.8.96/lib/core/controller.dart#L152-L154). Do not claim ordinary UI HTTP downloading or assume a script rule-provider's proxy field determines GeoX egress. Retain usable default URLs and caches, and troubleshoot actual download/load results.

---

<a id="6-相关资源"></a>
## 6. Related resources

| Resource | URL |
|------|-----|
| GitHub repository | https://github.com/chen08209/FlClash |
| Releases | https://github.com/chen08209/FlClash/releases |
| DeepWiki configuration management | https://deepwiki.com/chen08209/FlClash/6-build-and-deployment |
| DeepWiki core engine | https://deepwiki.com/chen08209/FlClash/3.1-core-network-engine |
| Override-script tutorial (Issue #1510) | https://github.com/chen08209/FlClash/issues/1510 |
| Advanced configuration tutorial (bwgss.org) | https://www.bwgss.org/4226.html |

<a id="2026-10-20-业务-dns-policy-复核"></a>
### 2026-10-20 service DNS policy review

This projection follows the `nameserver-policy` priority, independent node DNS and `proxy-server-nameserver` requirement for respect-rules in the [official Mihomo DNS documentation](https://wiki.metacubex.one/config/dns/). FlClash's DNS override boundary is unchanged.
