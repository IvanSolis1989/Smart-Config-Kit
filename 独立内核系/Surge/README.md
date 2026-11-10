[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-surge-mobile.svg">
  <img src="../../docs/assets/readme/page-surge.svg" alt="Surge import guide" width="100%">
</picture>

# Surge guide

Native routing configuration for Surge iOS and Surge Mac. Import configuration and add nodes, then verify policies, DNS and actual requests.

[![Downloads](../../docs/assets/readme/nav-downloads.svg)](../../docs/guide/downloads.md) [![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [![Import](../../docs/assets/readme/nav-tutorial.svg)](#import) [![Verification](../../docs/assets/readme/nav-verify.svg)](#verification)

[Preparation](#before-start) · [Download](#download) · [Import](#import) · [Settings](#settings) · [Verification](#verification) · [Troubleshooting](#faq) · [Reference](#reference)

> File: `Surge.conf` · **v6.0.21-Surge.14** (Build 2026-10-28)
> 22 regional groups (11 all-node + 11 residential) + 33 service groups, following Clash Party v6.0.21 routing.

<a id="before-start"></a>

## Before you start

Prepare Surge, a working provider subscription URL and the configuration URL below. As checked on 2026-10-19, stable Surge 5.23.0 requires iOS 17+, and Surge Mac 6.10.0 requires macOS 12+. See [store-region and version evidence](../../docs/upstream/2026-10-19/apple/report.md).

- Install Surge 5 from the App Store on iOS or get Mac builds from [Surge](https://nssurge.com/). Official pages determine licensing and pricing.
- This repository's `.conf` contains no working provider nodes. RULE-SET assets require network downloads.
- Regional groups use `url-test`. Native Surge smart differs from Mihomo Smart / LightGBM. MITM and scripts are disabled by default.

<a id="download"></a>

## Download

[![Download Surge CONF](../../docs/assets/readme/button-surge-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/Surge.conf)

Click to open the raw file, right-click to copy its URL, or save locally.

**Direct URL:**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/Surge.conf
```

Copy this URL, import below and add subscriptions. Downloads and remote-rule updates require GitHub Raw access; see [download troubleshooting](../../docs/rule-asset-delivery.md). Back up customizations before remote updates that could overwrite them.

### Online selection and local import

Open the [configuration page](https://ivansolis1989.github.io/Smart-Config-Kit/), select **Surge**, Full / Lite / Custom and optional latency-test/QUIC settings. Native all-proxy QUIC restriction affects all proxy QUIC traffic, broader than limiting selected service rules alone. This static configuration has no runtime node DNS or multiplier adaptation.

Host a downloaded `.conf` copy at your own HTTPS address if needed. Enable it using **Configuration → ➕ → Install from URL**, then add subscriptions or manual nodes below.

Lite / Custom trim service groups; counts below describe Full. To update, refresh, reselect profile/parameters and download. Back up configuration and node customizations, then replace or reimport. Do not overwrite customized copies using the repository full-configuration URL. Selection and generation are local and do not read or upload subscriptions or personal configuration. See the [configuration guide](../../docs/configuration.md).

<a id="import"></a>

## Import in order

### 1. Install and enable configuration

1. Open Surge → **Configuration → ➕ → Install from URL**. Labels may vary by language/version.
2. Paste the URL, download, then select and enable the configuration.
3. Confirm all remote RULE-SET downloads complete. Use a working proxy if GitHub Raw is unreachable.

### 2. Add nodes

**A. Provider subscription as a separate sub-configuration:** use a Surge-supported subscription format, then confirm the main configuration can reference its nodes. Menus vary by version; the sub-configuration UI flow still needs real-device verification.

**B. Manual nodes:** follow comments in `Surge.conf` to enter native Surge definitions in `[Proxy]`.

Groups filter using `include-all-proxies=true` and `policy-regex-filter`. Inspect actual group members after import.

### Merge subscriptions

Converted/merged output must be Surge-supported. Third-party conversion services can see token-bearing URLs; verify trust before using them.

### 3. Check and start

Confirm working regional members, select service upstreams and connect. On first iOS connection, allow adding VPN configuration.

<a id="settings"></a>

## Required settings

### Regional groups

Eleven regions each have all-node and residential groups, totaling 22, filtered by node names. For empty or incorrect groups, check subscription availability and regional identifiers first. The configuration file defines latency-test parameters.

<a id="业务策略组select-手动"></a>

### Service-group selection

Select appropriate regions or nodes for all 33 service groups after import. Runtime names below are preserved exactly so they match the client. These are selection examples, not access, eligibility or compliance guarantees. Follow service terms and applicable law; low latency or an exit's country label does not establish availability.

| Service group (runtime identifiers retained) | Selection and verification |
|---|---|
| `🤖 AI 服务` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `💰 加密货币` | Follow account requirements, service terms and applicable law; an exit region does not establish eligibility or compliance. |
| `🏦 金融支付` | Follow account requirements, service terms and applicable law; an exit region does not establish eligibility or compliance. |
| `💬 即时通讯` | Compare connection success, packet loss and latency; choose a stable working exit. |
| `📱 社交媒体` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🧑‍💼 会议协作` | Compare connection success, packet loss and latency; choose a stable working exit. |
| `📺 国内流媒体` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🎵 TikTok` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🎥 Netflix` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🎬 Disney+` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `📡 HBO/Max` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `📺 Hulu` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🎬 Prime Video` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `📹 YouTube` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🎵 音乐流媒体` (Spotify/Apple Music) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🇭🇰 香港流媒体` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🇹🇼 台湾流媒体` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🇯🇵 日韩流媒体` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🇪🇺 欧洲流媒体` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🌐 其他国外流媒体` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🕹️ 国内游戏` | Compare connection success, packet loss and latency; choose a stable working exit. |
| `🎮 国外游戏` | Compare connection success, packet loss and latency; choose a stable working exit. |
| `🔍 Google 服务` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🔧 工具与服务` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `Ⓜ️ 微软服务` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🍎 苹果服务` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `📥 下载更新` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🛰️ BT/PT Tracker` | The existing configuration targets `REJECT`; verify actual rules and requirements. |
| `🏠 国内网站` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🚫 受限网站` (GFW) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🌐 国外网站` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🐟 漏网之鱼` | Final fallback group; inspect unmatched traffic and the selected exit. |
| `🛑 广告拦截` | The existing configuration targets `REJECT`; verify actual rules and requirements. |

### DNS and database

DNS resides in `[General]`. Multiple encrypted DNS endpoints are queried **concurrently, using the first valid response**. When encrypted DNS is configured, plain DNS is used only for connectivity checks and server-domain bootstrapping.

- `dns-server`: 223.5.5.5, 119.29.29.29, 1.1.1.1, 8.8.8.8 for connectivity checks and bootstrap.
- `encrypted-dns-server`: two AliDNS IP-host DoH endpoints plus Google / Cloudflare DoH; concurrent, first valid response wins.
- `encrypted-dns-follow-outbound-mode`: currently `false`; encrypted DNS connects directly, outside outbound routing rules.
- `hijack-dns`: 8.8.8.8:53 and 8.8.4.4:53, intercepting those hardcoded queries.

All current encrypted DNS is direct. If every endpoint fails, there is no implemented plain-DNS fallback or retry through a proxy. Surge does not support the old `[DNS]` section. Changing `encrypted-dns-follow-outbound-mode` to `true` changes all encrypted-DNS routing and can cause a proxy-domain resolution cycle. See [official encrypted DNS](https://manual.nssurge.com/dns/encrypted-dns.html) and [historical review](../../docs/upstream/2026-10-19/apple/report.md).

`geoip-maxmind-url` specifies MMDB. Verify its download status. This configuration uses fused text RULE-SET, not direct Mihomo `.mrs`, and has no Mihomo TLS fingerprint injection. [PROCESS-NAME](https://manual.nssurge.com/rules/process.html) applies only to Surge Mac; Surge iOS ignores process rules.

<a id="verification"></a>

## Import verification

1. Confirm this configuration is active with 22 regional and 33 service groups and working regional members.
2. Confirm subscription and all RULE-SET downloads succeed. The connection switch is not a download check.
3. Visit `chat.openai.com`, `www.netflix.com` and `www.bilibili.com`. In **Activity / Recent Requests**, verify AI, Netflix and China-streaming rule matches and exits.
4. Follow the [DNS and post-import checklist](../../docs/guide/dns-and-verification.md#verification), including Wi-Fi / cellular switching as needed.

For missing requests, empty groups or unexpected exits, continue below.

<a id="faq"></a>

## Troubleshooting

### VPN starts, but all sites time out and Recent Requests is empty?

Check final `[General]`: `tun-excluded-routes` must not contain or cover `198.18.0.0/15`. This is Surge's Fake IP and DNS pool. Excluding it bypasses VIF, preventing domain recovery and routing. See [Fake IP DNS](https://manual.nssurge.com/dns/advanced.html) and [TUN exclusions](https://manual.nssurge.com/profile/general.html#tun-excluded-routes).

Refresh hosted configuration. For manual configurations, remove only conflicting ranges while retaining required LAN bypasses. Check modules/local overrides do not re-add them. Stop and restart Surge, reopen websites and confirm both direct and proxy requests appear in Recent Requests. Real-device results require this retest.

### Q1: rule-set unavailable?

Confirm URL access and network permission. Connect through a working node if needed, then refresh configuration and rule sets. See [download troubleshooting](../../docs/rule-asset-delivery.md).

### Q2: DST-PORT,7680,REJECT is invalid?

Download this directory's current configuration. Surge uses [`DEST-PORT`](https://manual.nssurge.com/rules/source-and-port.html#dest-port), not other clients' `DST-PORT`.

### Q3: Need Mihomo Smart + LightGBM?

Use a compatible Mihomo Smart client. Native Surge smart is not LightGBM.

### Q4: Payment/banking applications malfunction on iOS?

Inspect target domains, matched rules and exits in Activity, then nodes and DNS. `skip-proxy` does not mean guaranteed direct routing. Do not add wildcard domains solely from application names.

### Enable MITM or JavaScript scripts?

Generate and trust a certificate according to Surge and system requirements. Enable MITM only for needed domains, then add scripts/rewrites after checking conflicts with current rules.

### Q5: Regional emoji names are not grouped correctly?

Confirm nodes entered the candidate pool and retain regional names or HK / JP / US identifiers. Inspect actual members to verify matches.

<a id="q6跨境场景中国--海外怎么切换"></a>

### Select routes by network and service requirements

1. Inspect request logs for the destination, matched rule, service group and actual exit.
2. Compare available direct and proxy routes for the same request, recording success, latency and errors. Do not infer availability from the user’s location.
3. Check service terms, account requirements and actual exit support. A node’s regional label does not guarantee eligibility or functionality.
4. Adjust only the relevant service group, retain other policies and revalidate after network or node changes.

Names such as `🚫 受限网站`, `🌐 国外网站` and `📺 国内流媒体` are existing runtime identifiers, not recommendations aimed at a regional audience or access guarantees.

<a id="reference"></a>

## Advanced reference

<details>
<summary>Protocol support and platform requirements</summary>

Reviewed against [official Surge documentation](https://manual.nssurge.com/policies/overview.html):

| Protocol | Support | Notes |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | AEAD + SS 2022 |
| **ShadowsocksR (SSR)** | ❌ | Unsupported |
| **VMess** | ✅ | ws/h2 |
| **VLESS** | ❌ | No native type; External Proxy bridging is Mac-only |
| **REALITY / XTLS-Vision** | ❌ | No native type; iOS cannot run external programs |
| **Trojan** | ✅ | |
| **Hysteria v1** | ❌ | Not in the official protocol list |
| **Hysteria 2** | ✅ | [iOS 5.8.0+ / Mac 5.4.0+](https://manual.nssurge.com/policies/hysteria2.html) |
| **TUIC v5** | ✅ | [`tuic-v5`](https://manual.nssurge.com/policies/tuic.html), UUID + password; first supported version not stated |
| **AnyTLS** | ✅ | [iOS 5.17.0+ / Mac 6.4.3+](https://manual.nssurge.com/policies/anytls.html), AnyTLS v2 |
| **WireGuard** | ✅ | Full secondary-proxy support |
| **Snell** | ✅ | [v1–v6](https://manual.nssurge.com/policies/snell.html); v6 requires iOS 5.20.0+ / Mac 6.7.0+, still marked beta |
| **HTTP/2 / HTTPS / SOCKS5 / HTTP** | ✅ | |
| **External Proxy** | Mac ✅ / iOS ❌ | [Only Mac launches external programs; iOS treats external policies as REJECT](https://manual.nssurge.com/policies/external.html) |

TUIC's first supported version remains unconfirmed by the official page; Snell v6 is still beta. Full sources and unresolved items: [historical review](../../docs/upstream/2026-10-19/apple/report.md).

</details>

<details>
<summary>Configuration hosting and updates</summary>

Use the repository raw URL above, or host customized files at your own HTTPS address:

```text
https://raw.githubusercontent.com/<user>/<repo>/main/独立内核系/Surge/Surge.conf
```

This CDN example is only for other repositories within jsDelivr's package-size limit. Use GitHub Raw for this repository's configuration and fused rules:

```text
https://cdn.jsdelivr.net/gh/<user>/<repo>@main/独立内核系/Surge/Surge.conf
```

### Automatic updates

Confirm configuration/rule-set update settings in the client and inspect download status afterward. Successful startup does not prove rules updated.

### Synchronize repository updates

Refresh remote configuration in the client. Back up local modifications first to avoid overwrites. See [CHANGELOG](CHANGELOG.md).

</details>

Surge offers Header Rewrite, Script, MITM, External Controller and Dashboard; configure separately when needed. MITM/scripts are off by default here. See [Surge Manual](https://manual.nssurge.com/), [Quick Start](https://manual.nssurge.com/getting-started/quick-start.html) and [REFERENCE](REFERENCE-surge-manual.md).

[Surge](https://nssurge.com/) · [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip)

[Routing policy](../../docs/guide/routing-policy.md) · [Client support](../../docs/guide/client-support.md) · [DNS and verification](../../docs/guide/dns-and-verification.md)

[Latency testing and QUIC](../../docs/traffic-options.md) · [WeChat troubleshooting](../../docs/research/2026-10-16-wechat-issue-187.md) · [Claude Desktop dependencies](../../docs/claude-service-dependencies.md)

[Changelog](CHANGELOG.md) · [Official review and pending acceptance](../../docs/upstream/2026-10-19/apple/report.md) · [Support the project](../../docs/donate.md)
