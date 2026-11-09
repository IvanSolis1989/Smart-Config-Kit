[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-flclash-mobile.svg">
  <img src="../../docs/assets/readme/page-flclash.svg" alt="FlClash import guide" width="100%">
</picture>

# FlClash import guide

Create and associate a dedicated JS override with a Mihomo node subscription to generate regional and service groups. It uses **url-test, not Smart / LightGBM**. Create the script first, then associate it.

<p><a href="../../docs/guide/downloads.md#mihomo"><img src="../../docs/assets/readme/nav-downloads.svg" alt="Downloads" width="145" height="38"></a> <a href="../../docs/README.md"><img src="../../docs/assets/readme/nav-docs.svg" alt="Documentation" width="145" height="38"></a> <a href="#verification"><img src="../../docs/assets/readme/nav-verify.svg" alt="Post-import verification" width="145" height="38"></a></p>

[Preparation](#before-you-start) · [Files](#downloads) · [Import](#import) · [Troubleshooting](#faq) · [Reference](#reference)

<a id="before-you-start"></a>

[Optional service profiles and local parameters](../../docs/configuration.md): the complete configuration remains the default. Optional projections use separate directories; see the shared guide for supported runtime parameters.

## Before you start: version and subscription

You need **FlClash ≥ v0.8.85**, a Mihomo node subscription and this directory's JS. Get the client from the [official repository](https://github.com/chen08209/FlClash), then choose the procedure for your [interface version](#ui-version).

- For one provider, prefer its native subscription URL. For several, follow [Sub-Store](../../SubStore/README.md) to produce one `Clash.Meta(mihomo)` URL.
- After creating the script, select Script mode in the relevant profile and associate it. Pasting or saving alone does not activate it. Associate each profile separately.
- Rule downloads require GitHub Raw access or a working proxy. For the static YAML alternative, edit and import using the [CMFA guide](../Clash%20Meta%20For%20Android/README.md).

<a id="-规则下载链接"></a>
<a id="downloads"></a>

## Select and download files

[![Download FlClash JS](../../docs/assets/readme/button-flclash-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js) [![Alternative CMFA YAML](../../docs/assets/readme/button-cmfa-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)

Buttons open raw files. Right-click to copy a URL or save locally.

**FlClash JS URL:**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js
```

**Alternative CMFA YAML URL:**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml
```

The JS override is recommended: create it and associate it with your subscription. See [CMFA](../Clash%20Meta%20For%20Android/README.md) for YAML import.

<a id="快速开始两步操作"></a>
<a id="import"></a>

## Create, associate and start in order

### Optional: generate a Lite / Custom service profile

Use the complete JS by default. To reduce services, open the [configuration page](https://ivansolis1989.github.io/Smart-Config-Kit/) and select a service profile. **Lite** retains AI, instant messaging, collaboration and YouTube (`ai,im,work,youtube`). **Custom** lets you select services. Choose FlClash and download the JS; no CLI, Node.js or Ruby is required.

Open the downloaded JS and copy its **entire content**. Create a separately named local script in step 1, then associate it in step 2. Do not configure official-URL automatic updates for this script: that URL targets the full profile and would overwrite your selection. Keep FlClash's VPN and port management, and disable DNS override in step 3.

Optional latency-test, QUIC, subscription-node DNS, multiplier and ZeroTier settings are embedded alongside the selected profile. Unchanged options retain release defaults. The page loads a static snapshot; reopen or refresh after updates to load the latest published version. You can also save the [offline HTML](../../docs/configuration.html). See the [shared guide](../../docs/configuration.md) for full boundaries and other clients.

To update a customized override, refresh the page, reselect the same profile and parameters and download new JS. Back up the existing override, replace its entire content, confirm the association remains, refresh the profile and inspect final DNS and exits. The page does not restore earlier selections or read/upload subscriptions and personal configuration. Subscription refresh and script updates are separate operations.

<details>
<summary>Advanced CLI generation</summary>

The form also offers `settings.json`, which contains generation settings and is not directly importable into FlClash. Run from the repository root, replacing example paths. The output directory's parent must exist; the output directory itself must be new. See the [shared guide](../../docs/configuration.md) for Node.js / Ruby requirements.

```bash
node tools/configure.js --settings '.../settings.json' --output-dir '.../new-directory' --dry-run
node tools/configure.js --settings '.../settings.json' --output-dir '.../new-directory'
```

Use `Mihomo内核系/FlClash/FlClash(mihomo).js` from the output directory.

</details>

<a id="ui-version"></a>

### Identify the interface: Extend versus legacy Override

**v0.9.0 / v0.9.1 Extend interface:** open the relevant profile menu and choose Extend. **Legacy Override interface:** manage scripts through Override scripts at the top of Profiles, then associate them through the subscription menu. Match your actual interface before following the two steps below. Translated labels may vary by client language/version.

> Official [v0.9.0 source](https://github.com/chen08209/FlClash/blob/v0.9.0/lib/views/profiles/extend/extend.dart) includes Extend → Script; [v0.9.1](https://github.com/chen08209/FlClash/releases/tag/v0.9.1) retains it. Minimum script support remains v0.8.85. New-interface screenshots below came from [Issue #194](https://github.com/IvanSolis1989/Smart-Config-Kit/issues/194); legacy screenshots are retained for comparison. These are original Chinese-interface images.

<a id="第-1-步创建覆写脚本"></a>

### Step 1: open script management and create a script

**New Extend interface (v0.9.0 / v0.9.1):**

1. Open Profiles, open the target profile's menu and choose **Extend**.
2. Select **Script** as the extension mode, then **Go to configure scripts** to open script management.
3. Choose **+**. For Full, choose **Import via URL** and enter the JS raw URL above. For local/custom profiles, choose **Start from scratch**, delete defaults, paste the **complete JS**, name it `Smart分流` and save. Existing downloads can use **Import via file**.
4. Return to this profile's Extend page and complete association in step 2.

<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="360" alt="FlClash v0.9.1 profile menu: Extend below Edit (original Chinese interface)" src="https://github.com/user-attachments/assets/e8544989-b1f2-49a1-9d6a-700e966d97bd" />

</details>

**Legacy Override interface:**

1. Profiles → **Override scripts** at the top → **+**.
2. Choose **Import via URL** and enter the raw JS URL, or choose **Start from scratch**, clear defaults, paste the entire JS, name and save it. Use **Import via file** for an existing file. Pasting is an editing action, not a menu item. v0.8.99 uses the same button names as newer versions.

<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="360" alt="Legacy FlClash Override scripts entry point and script creation (original Chinese interface)" src="https://github.com/user-attachments/assets/35be12b0-39a0-43a5-8b4f-01f736c93704" />

</details>

> Both interfaces require raw JavaScript. The first line should be `// FlClash 覆写脚本`. `SyntaxError: unexpected token '<'` usually means an HTML page was imported. Recreate using the raw URL or the complete script text.

### Step 2: associate with the subscription

**New Extend interface (v0.9.0 / v0.9.1):**

1. Profiles → relevant profile menu → **Extend**.
2. Confirm **Script** extension mode. Under **Extension scripts**, select the new `Smart分流` script and confirm a checkmark appears.
3. Return to Profiles, select this profile and reapply. If running, stop and restart. Select scripts separately for each profile.

<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="360" alt="FlClash v0.9.1 Extend page: Script selected, extension-script selection and management link (original Chinese interface)" src="https://github.com/user-attachments/assets/4afbd5d6-6c59-420b-8fab-3fe36cb06831" />

</details>

**Legacy Override interface:**

1. Profiles → **⋮** on the subscription card → **More → Override**.
2. Select Script mode and the newly created script, then save.
3. Return home and pull to refresh; stop/restart if needed.

<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="360" alt="Legacy subscription Override entry and script association (original Chinese interface)" src="https://github.com/user-attachments/assets/f133d259-3841-4719-9396-db2488a507fc" />

</details>

<a id="应用层设置与-dns-所有权"></a>

### Step 3: check application settings

**After associating this script, disable DNS override. Do not paste an additional DNS YAML into the interface.** This disables FlClash's second override, not Mihomo DNS. The script still sets `dns.enable: true`, `respect-rules: true` and China / international resolution policies.

On subscription refresh, adaptive mode projects DNS hints needed by active nodes. Preserve exact node policies during interface merging. See [private-node DNS](../../docs/private-node-dns.md).

#### Android networking settings

- Enable VPN, select Rule mode, enable DNS hijacking and use the configuration's routing mode.
- Disable **System proxy** under VPN: it publishes an additional HTTP proxy. Disabling it does not disable TUN.
- Disable both VPN IPv6 and core/advanced IPv6 separately. One switch is insufficient.
- Disable both DNS override and Append system DNS. The latter independently appends `system://` when enabled.

Use application-access-control exclusions when an entire application must bypass VPN. Excluded applications' connections and DNS are outside script control:

| Goal | Settings and consequences |
|---|---|
| Let Mihomo route all applications by domain | Disable application access control and Allow applications to bypass VPN. Select `DIRECT` for China groups and working nodes for international groups. |
| Keep selected applications entirely outside VPN | Enable access control and exclude those applications. Retain the exclusion list and disable VPN System proxy. Excluded connections/DNS are not script-controlled; absent Mihomo logs do not mean no network requests occurred. |

[Android documentation](https://developer.android.com/reference/android/net/VpnService.Builder#setHttpProxy(android.net.ProxyInfo)) warns that combining split VPN with an extra HTTP proxy can affect connectivity. After changes, stop/restart VPN and fully reopen affected applications. Refreshing nodes alone does not clear existing connections.

<a id="verification"></a>

## Post-import verification

Open Proxies and expect:

- **Up to 22 regional groups** (11 all-node + 11 residential; empty regions skipped), including `🌍 全球节点`, `🇭🇰 香港节点`, `🇸🇬 狮城节点` and `🌏 其他节点`.
- **33 service groups in Full**, including `🤖 AI 服务`, `🎵 TikTok`, `🎥 Netflix` and `📱 社交媒体`. Lite / Custom retain fewer optional services; foundational ad, safety and direct-routing protection remains.
- Use the [60-second checklist](../../docs/guide/dns-and-verification.md#verification) for downloads, GEOSITE matches and bounded anti-ad exceptions.

Inspect final DNS configuration and actual connection records. A correct script version does not prove the configuration remains correct after application patches. See DNS checks below.

<a id="常见问题"></a>
<a id="faq"></a>

## Troubleshooting

### Only Extend is visible, not Override scripts?

Follow the [new-interface steps](#ui-version): Extend → Script → Go to configure scripts. After creating it, return to the same profile and select the script. Standard mode or script creation alone will not execute this JS. Legacy users can follow the old screenshots without changing client versions solely to import.

### Proxies / Rules tabs disappeared?

For one provider, first try its **native subscription URL**, without conversion. To combine multiple subscriptions into one pool, follow [Sub-Store aggregation](../../SubStore/README.md), produce one `Clash.Meta(mihomo)` URL and associate the override. Avoid unknown general-purpose converters.

### Why url-test rather than smart?

FlClash uses its own Mihomo branch and does not expose vernesong Smart's `type: smart` / LightGBM. MetaCubeX Alpha is not Smart either.

### Windows WebRTC tests show the local public IP?

On the [configuration page](https://ivansolis1989.github.io/Smart-Config-Kit/), select FlClash, set Windows browser UDP to reject, download a separately named local script and associate it as above. This option rejects UDP only for Windows Chrome / Edge / Firefox and is off by default. It can affect HTTP/3 and UDP calls; it does not apply to Android. Enable TUN, confirm process identification and inspect rejection records. See [WebRTC privacy and acceptance](../../docs/guide/webrtc-privacy.md) for browser settings, recovery and complete limits.

### Must I reconfigure after changing providers?

No. The override reruns when the associated subscription changes.

### Selected applications cannot connect?

Retain application exclusions, disable secondary DNS override and system-DNS append, and check both VPN and core IPv6 switches. Restart VPN and affected applications, then inspect failure time, domain, rule and outbound. The detailed comparison steps appear below.

<a id="reference"></a>

## Advanced reference

- [Node filtering](../../docs/subscription-node-filter.md): lowercase region codes plus numbers, inline nodes and dial dependencies. Multiplier filtering is off by default.
- [Private-node DNS](../../docs/private-node-dns.md) · [Rule downloads](../../docs/rule-asset-delivery.md) · [Latency testing / QUIC](../../docs/traffic-options.md).
- [WeChat troubleshooting](../../docs/research/2026-10-16-wechat-issue-187.md) · [ZeroTier UDP proxy (off by default)](../../docs/zerotier-planet-proxy.md).

### DNS merge order and troubleshooting

#### Why can DNS override replace script settings?

FlClash applies application patches after JS. In 0.9.x, DNS/NTP and desktop TUN overwrite selected keys; older versions replaced the whole DNS block. Do not mix these explanations. Disable application DNS override to preserve script DNS, then check final values. A correct script version is not proof of correct final configuration.

Inspect the configuration actually sent to the core, not only the saved DNS form:

- Top-level `ipv6: false`; `dns.enable: true`; `dns.ipv6: false`; `dns.prefer-h3: false`.
- `dns.respect-rules: true` and a nonempty `proxy-server-nameserver`.
- `nameserver-policy` includes both `geosite:cn` and `geosite:geolocation-!cn`. Preserve generated exact `proxy-server-nameserver-policy` for private nodes.
- Keep China DoH in `direct-nameserver`. Do not replace application resolution policies solely to change the region shown by a DNS-test page.
- `nameserver` contains no application-appended `system://`. Check same-name top-level hosts overrides too, not only the DNS switch.

Old saved interface values do not prove current effective settings. See the [source review](REFERENCE-flclash.md) for merge order and version boundaries.

#### Does a DNS test showing a China server prove a leak?

Country labels alone are insufficient. China domains use AliDNS/DNSPod by default; unclassified queries may also reach China nameservers. DoH encryption does not imply an international exit, and fallback does not guarantee China resolvers never received a query.

Record the domain, matching policy, recursive resolver and outbound. Excluded applications, browser secure DNS, system DNS and node resolution can take separate paths. This baseline does not guarantee whole-device zero leakage.

### External resources (GeoX URLs)

Repository scripts and fused rules use the configured GitHub Raw HTTPS URLs. Resource-page downloads may follow a separate application path; rule-provider download proxy settings alone do not establish reachability.

Preserve working caches before replacement. Check complete URL, HTTP status, size and core load results. DNS geosite policies still depend on GeoSite. A `fallback-filter.geosite` migration warning does not itself mean resource loading failed.

### Short application-connectivity diagnostic

1. Disable DNS override, Append system DNS and VPN System proxy. Disable VPN and core/advanced IPv6 separately (`vpnProps.ipv6`, `patchClashConfig.ipv6`). Keep the existing access-control list, then restart VPN and the application.
2. For applications still inside VPN, check that `国内网站`, `国内流媒体` and `国内游戏` select `DIRECT`. Saved choices do not reset automatically when networks change; verify them against the failing request.
3. Record one failed action's time, domain, rule, outbound and error. A 502 from FlClash's own `checkIp` only indicates an exit-information service error; it does not prove all applications or nodes are unusable.
4. Only if the failing service domain demonstrably hits ad blocking, temporarily select `DIRECT` for the ad group as a comparison, then restore it. Do not permanently disable all ad rules or exempt a whole application's domain family without evidence.

<a id="与-cmfa-yaml-的对比"></a>

<details>
<summary>Dedicated JS versus static YAML</summary>

| Feature | Override script (recommended) | CMFA YAML (alternative) |
|---|---|---|
| Node classification | Word-boundary regex; TW does not match TWN | Go RE2 substring matching |
| Subscription cleanup | Removes unwanted provider proxy-groups | Unsupported |
| Residential detection | Automatic detection and separate groups | Supported via filter regex |
| Empty regions | Skips groups without nodes | May create empty groups |
| Smart + LightGBM | Unsupported by core | Unsupported |

</details>

<a id="协议支持"></a>

<details>
<summary>Protocol reference (actual bundled core is authoritative)</summary>

| Protocol | Support |
|---|:-:|
| Shadowsocks (SS) / SSR | ✅ |
| VMess / VLESS, including REALITY + XTLS-Vision | ✅ |
| Trojan, including Trojan-Go | ✅ |
| Hysteria v1/v2 / TUIC v5 | ✅ |
| WireGuard / AnyTLS / ShadowTLS / Snell v4 | ✅ |

</details>

<details>
<summary>Additional legacy-interface examples (original Chinese screenshots)</summary>

<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="160" alt="Legacy FlClash configuration example 1" src="https://github.com/user-attachments/assets/e88e0724-2bc0-4111-851e-e8aa0a9141d3">

</details>
<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="160" alt="Legacy FlClash configuration example 2" src="https://github.com/user-attachments/assets/530d9f3a-e793-423b-a4d6-85a2d4a75054">

</details>
<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="160" alt="Legacy FlClash configuration example 3" src="https://github.com/user-attachments/assets/f2b03096-3469-4d67-ab10-60bac2b82347">

</details>
<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="160" alt="Legacy FlClash configuration example 4" src="https://github.com/user-attachments/assets/be31a91a-259c-47a7-b599-fa08752bef8d">

</details>
<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="160" alt="Legacy FlClash configuration example 5" src="https://github.com/user-attachments/assets/770eb553-86c5-49a7-80f4-4fd68594888b">

</details>

</details>

<a id="相关链接"></a>

- [FlClash GitHub](https://github.com/chen08209/FlClash)
- [Override source](./FlClash(mihomo).js)
- [Alternative CMFA YAML](../Clash%20Meta%20For%20Android/CMFA(mihomo).yaml)

Business DNS authority: [business-dns-policy.json](../../rulesets/source/business-dns-policy.json). Maintenance:

```bash
node tools/sync-business-dns-policy.js
node tools/sync-business-dns-policy.js --check
node --test tools/tests/business-dns-policy.test.js tools/tests/business-dns-sync.test.js
```

<a id="-支持本项目"></a>

[Changelog](CHANGELOG.md) · [Support the project](../../docs/donate.md) · [Report an issue](https://github.com/IvanSolis1989/Smart-Config-Kit/issues)
