[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-clash-party-mobile.svg">
  <img src="../../docs/assets/readme/page-clash-party.svg" alt="Clash Party / Clash Verge Rev import guide" width="100%">
</picture>

# Clash Party / Clash Verge Rev import guide

Apply a JS override to a Mihomo node subscription to generate consistent groups, routing and DNS. **Choose only one of Smart / Normal.** This repository does not provide proxy nodes.

<p><a href="../../docs/guide/downloads.md#mihomo"><img src="../../docs/assets/readme/nav-downloads.svg" alt="Downloads" width="145" height="38"></a> <a href="../../docs/README.md"><img src="../../docs/assets/readme/nav-docs.svg" alt="Documentation" width="145" height="38"></a> <a href="#verification"><img src="../../docs/assets/readme/nav-verify.svg" alt="Post-import verification" width="145" height="38"></a></p>

[Preparation](#before-you-start) · [Files](#downloads) · [Import](#import) · [Troubleshooting](#faq) · [Reference](#reference)

<a id="-smart-版-vs-普通版怎么选"></a>
<a id="before-you-start"></a>

[Optional service profiles and local parameters](../../docs/configuration.md): the complete configuration remains the default. Optional projections use separate directories; see the shared guide for supported runtime parameters.

## Before you start: client and core

Prepare a subscription returning Mihomo-format nodes and a client supporting JS overrides. Rule downloads require GitHub Raw access or a working proxy.

| Selection | Requirements |
|---|---|
| **Normal JS** | Regular Mihomo. Use this with official Clash Verge Rev builds; regional groups use url-test. |
| **Smart JS** | Installed vernesong/mihomo Smart core and Model.bin; regional groups use smart. |

MetaCubeX Alpha is not Smart. Both scripts share rules, DNS and service groups, generating up to 22 regional + 33 service groups. The scripts do not set a session-stickiness strategy.

<a id="一安装客户端"></a>

### Clash Party (formerly Mihomo Party)

- Releases: https://github.com/mihomo-party-org/clash-party/releases
- Windows / macOS (Intel + Apple Silicon) / Linux (deb/rpm/AppImage).
- Supports stable / Alpha / Smart cores and JS overrides. Before using Smart JS, confirm the Smart core is selected and check model status.

### Clash Verge Rev

- Releases: https://github.com/clash-verge-rev/clash-verge-rev/releases
- Official builds download MetaCubeX/mihomo stable / Alpha. Use **Normal JS**. Selecting Alpha does not add Smart groups. Use Smart JS only after actually installing vernesong/mihomo Smart. See [official build source](https://github.com/clash-verge-rev/clash-verge-rev/blob/4337bd85758d54d7b9044b2da3c9ac1176eae1f3/scripts/prebuild.mjs).

<a id="-规则下载链接"></a>
<a id="downloads"></a>

## Select and download files

### Online selection and local import

Open the [configuration page](https://ivansolis1989.github.io/Smart-Config-Kit/), choose Clash Party Smart or Normal for the actual core, select Full / Lite / Custom and supported parameters, then download JS. Create a JavaScript override, paste its complete content and associate the subscription as below. Normally disable secondary client DNS override. Official Clash Verge Rev cores use Normal. Generation is local without reading/uploading subscriptions or personal configuration.

To update, refresh the page, select the same profile and parameters, download and replace the local override. Official remote URLs target complete default scripts and cannot preserve customizations automatically. See the [configuration guide](../../docs/configuration.md) for service scope.

[![Download Smart JS](../../docs/assets/readme/button-smart-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js) [![Download Normal JS](../../docs/assets/readme/button-normal-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo%29.js)

Buttons open raw files. Right-click to copy a URL or save locally.

**Smart JS URL:**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js
```

**Normal JS URL:**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo%29.js
```

Choose one script matching your core. Both are JS overrides to associate with a node subscription below.

<a id="-零基础-5-分钟快速开始"></a>
<a id="import"></a>

## Import in order

<a id="二准备订阅"></a>

### 1. Add a node subscription

#### Scenario A: one provider

Add its URL directly in Subscriptions / Profiles. The script detects and classifies nodes automatically.

#### Scenario B: combine providers into one pool

Use [Sub-Store](../../SubStore/README.md) when multiple subscriptions need one node pool:

1. Self-host or use a public **Sub-Store** instance (https://github.com/sub-store-org/Sub-Store).
2. Add 2–N providers as individual subscriptions.
3. Create a **collection subscription** or **remote subscription** aggregating them.
4. Generate a **Clash (Mihomo)** subscription URL.
5. Add that URL to the client.

The client must be able to reach the URL; `127.0.0.1` works only on the same device. The script cleans informational entries and classifies nodes. Multiplier filtering is off by default.

#### Scenario C: online conversion (alternative)

Enter subscription URLs into a trusted conversion service, select Mihomo output and import the result. The service can read subscription tokens; prefer local Sub-Store for sensitive subscriptions.

<a id="三导入覆写脚本核心步骤"></a>

### 2. Create and associate the override

#### Clash Party (formerly Mihomo Party)

1. Overrides → New → JavaScript; paste the chosen JS in full and save.
2. Subscriptions → Edit → enable overrides; select the script and save.
3. Switch to that subscription and connect. Enable only Smart or Normal, never both.

#### Clash Verge Rev

1. Sidebar → **Scripts → New script → Local script**.
2. Paste the entire `.js` and save.
3. **Profiles → ⋯ → Extensions**, then select the script.
4. Restart the core (Ctrl/Cmd + R).

Interface labels may vary with client version/language.

### 3. Check DNS ownership and connect

The script generates nodes, groups, rules, DNS and sniffing. Normally disable the client's secondary DNS override. If using UI Mixin, preserve exact private-node policies and inspect final configuration. See [reference](#reference) for manual supplementary YAML.

Switch to the associated subscription and connect. Initial rule/model downloads depend on network conditions; wait for completion, then inspect logs.

<a id="五验证配置生效"></a>
<a id="verification"></a>

## Post-import verification

1. **Groups:** up to 22 regional + 33 service groups. Smart regions use smart; Normal uses url-test. Candidate nodes should match regions.
2. **Connections:** access AI, Netflix and China-streaming services separately; verify actual rules, service groups and outbounds. The advanced section describes how to verify exits against service requirements; actual group names and connection results are authoritative.
3. **Rules:** the baseline contains 168 main rules and 149 fused rule-providers. Do not compare against unfused source counts to judge completeness.
4. **Logs and DNS:** no parser or rule-set loading errors. Final DNS includes script DoH and blacklist mode. See the full [post-import checklist](../../docs/guide/dns-and-verification.md#verification).

<a id="七常见问题"></a>
<a id="faq"></a>

## Troubleshooting

### Why does WebRTC testing show my local public IP?

Default rules route common STUN/TURN ports directly for NAT discovery; TUN capture still follows those rules. Windows users can set Windows browser UDP to reject on the [configuration page](https://ivansolis1989.github.io/Smart-Config-Kit/), download and associate local JS to reject all Chrome / Edge / Firefox UDP. This is off by default and may affect HTTP/3 and UDP calls. Combine it with browser privacy controls and inspect actual STUN connections. Disabling secondary client DNS override remains normal usage. See [WebRTC privacy and acceptance](../../docs/guide/webrtc-privacy.md) for limits, recovery and comparison tests.

### Q1: Nodes or regional groups are empty?

- Confirm the subscription returns **Mihomo / Clash.Meta**, not Surge / Quantumult format.
- Confirm node names contain regional keywords, for example `香港`, `HK`, `🇭🇰` or `hkg`. Lowercase codes followed by numbers, such as `hk01`, are supported.
- Check logs for `No node classified`.

### Q2: First connection is very slow?

The initial download includes **149 fused rule-providers**, preferring `.mrs` on Mihomo, substantially smaller than expanded source rules. Complete initial downloads on Wi-Fi where possible.

### Q3: How do I upgrade?

Update the client's `.js` override from the repository. It runs again on the next subscription refresh. Do not delete or reimport the existing subscription. Customized profiles should use the regeneration procedure above rather than the full-script URL.

### Q4: Can multiple override scripts run together?

Not recommended. This script fully rebuilds `proxy-groups` and `rules`; stacking other scripts can conflict.

### Q5: LightGBM model not downloaded (Smart only)?

- Check the actual Smart core and model status. The current model download field is `lgbm-url` ([official configuration source](https://github.com/vernesong/mihomo/blob/83e67d0c4415b1114f9e01d8e9a00133caf89f6c/config/config.go)).
- Confirm the client can reach GitHub Releases, using a proxy if necessary:

```text
https://github.com/vernesong/mihomo/releases/download/LightGBM-Model/Model.bin
```

- Alternatively, use **`ClashParty(mihomo).js`**, which uses url-test and does not need LightGBM.

### Q6: Can I switch Smart / Normal without reimporting subscriptions?

Yes, provided the core supports the chosen script. Routing and rule-provider semantics are equivalent; regional selection types differ as described above. Refreshing the subscription regenerates configuration. **Never enable both scripts.** Disable the old script, select the new one, then refresh.

### Q7: Clash Party v2.0.3+ says it automatically disabled DNS override?

This protects DNS fields in the original subscription and does not mean JS failed. The guard runs before JS; from 2.0.4, client settings can control it. See [execution order and version boundaries](../../docs/upstream/2026-10-19/mihomo/report.md).

1. Keep this repository's JS enabled; disable built-in DNS override / `controlDns`.
2. Refresh and verify final `dns.enable`, repository DoH and `fake-ip-filter-mode: blacklist`. Preserve exact private-node policies.
3. If the client must manage DNS, handle protected fields at the original-subscription/aggregation layer first, then inspect the final result.

For remaining problems, provide client version, redacted DNS configuration and override logs. Do not publish subscription tokens or node passwords.

### Q8: Windows 11 Microsoft Store reports network errors or missing icons?

Check actual core TUN, system proxy and the Store's loopback access to the local proxy. Compare HTTP results for a failing image's actual URL through the outbound selected in `Ⓜ️ 微软服务`. See [Windows 11 Microsoft Store troubleshooting](../../docs/microsoft-store-windows.md) for per-package loopback checks/exemptions and image-CDN comparisons.

<a id="q9dldir1qqcom-是否已分流微信下载仍失败怎么排查"></a>

### Q9: Is dldir1.qq.com covered? Why can WeChat downloads still fail?

The exact domain is included and targets `📥 下载更新`, not ad rejection. This is a manual-selection group whose candidates start with `🌍 全球节点` and include `DIRECT`; the actual exit depends on your saved group selection. On Windows, recognized `Weixin.exe`, `WeChat.exe` or `WeChatAppEx.exe` can match an earlier process rule and go `DIRECT`. Domain inclusion therefore does not mean every connection reaches the download group, or that the default is direct.

1. Update the active JS override, refresh subscriptions/rule-sets and reload. Inspect actual domain, process, matching rule and final exit.
2. If the connection hits `📥 下载更新` and the selected proxy fails, temporarily choose `DIRECT` and compare the same download. This also affects other downloads in that group; restore the previous selection as needed. If a process rule already selected `DIRECT`, changing the download group will not affect that connection.
3. If it still fails, provide OS, client version, failure time and redacted connection logs. HTTP status and domain help distinguish stale rules, exit failures and server errors.

See [Issue #187 download-domain review](../../docs/research/2026-10-16-wechat-issue-187.md#2026-10-23-补充dldir1qqcom) for evidence and static-test limits.

<a id="reference"></a>

## Advanced reference

- [Node filtering](../../docs/subscription-node-filter.md): lowercase region codes plus numbers, multiplier filtering (off by default), remote-node flattening and dial dependencies.
- [Private-node DNS](../../docs/private-node-dns.md): adaptive by default, generating hints for active nodes.
- [Latency testing / QUIC](../../docs/traffic-options.md) · [ZeroTier UDP proxy (off by default)](../../docs/zerotier-planet-proxy.md) · [Rule downloads](../../docs/rule-asset-delivery.md).
- [Official Mihomo configuration](https://wiki.metacubex.one/config/) · [Official version/source review](../../docs/upstream/2026-10-19/mihomo/report.md).

<a id="四粘贴-ui-补充配置"></a>

<details>
<summary>Manual GeoX, DNS and Sniffer review (original screenshots and YAML)</summary>

The script already generates nodes, groups, rules, DNS and sniffing. Normally disable secondary client DNS override. These original Chinese-interface screenshots and YAML are for manual comparison. If using UI Mixin, merge private-node policies and inspect final configuration to avoid overwriting the script again.

GeoX URLs:

<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="823" height="1032" alt="Original client settings screenshot (Chinese interface)" src="https://github.com/user-attachments/assets/51c8d844-3f66-4996-a271-6167db99f66a" />

</details>

```yaml
geox-url:
  geoip: https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/geoip.dat
  mmdb: https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb
  asn: https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb
  geosite: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat
geo-auto-update: true
```

DNS:

<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="811" height="698" alt="Original client settings screenshot (Chinese interface)" src="https://github.com/user-attachments/assets/c6ad3051-17c3-43e2-8dfa-e9721bd305f8" />

</details>
<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="811" height="698" alt="Original client settings screenshot (Chinese interface)" src="https://github.com/user-attachments/assets/d2cbbbb3-ed2c-45d7-86cc-832edfbdb365" />

</details>

```yaml
hosts:
  dns.alidns.com: [223.5.5.5, 223.6.6.6]
  doh.pub: [119.29.29.29]
  dns.google: [8.8.8.8, 8.8.4.4]
  cloudflare-dns.com: [1.1.1.1, 1.0.0.1]

dns:
  use-hosts: true
  use-system-hosts: false
  respect-rules: true
  prefer-h3: false
  default-nameserver:
    - https://223.5.5.5/dns-query
    - https://223.6.6.6/dns-query
    - https://8.8.8.8/dns-query
    - https://1.1.1.1/dns-query
    - 223.5.5.5
  nameserver-policy:
    geosite:cn:
      - https://dns.alidns.com/dns-query
      - https://doh.pub/dns-query
    geosite:geolocation-!cn:
      - https://cloudflare-dns.com/dns-query
      - https://dns.google/dns-query
    '+.jsdelivr.net':
      - https://cloudflare-dns.com/dns-query
      - https://dns.google/dns-query
    '+.github.com':
      - https://cloudflare-dns.com/dns-query
      - https://dns.google/dns-query
    '+.githubusercontent.com':
      - https://cloudflare-dns.com/dns-query
      - https://dns.google/dns-query
    '+.githubassets.com':
      - https://cloudflare-dns.com/dns-query
      - https://dns.google/dns-query
    '+.fastly.net':
      - https://cloudflare-dns.com/dns-query
      - https://dns.google/dns-query
  nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  proxy-server-nameserver:
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  direct-nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  direct-nameserver-follow-policy: true
  fallback:
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4
      - 0.0.0.0/32
      - 127.0.0.0/8
      - 10.0.0.0/8
      - 192.168.0.0/16
    domain: []
```

Sniffer:

<details>
<summary>View original Chinese-interface screenshot</summary>

<img width="811" height="698" alt="Original client settings screenshot (Chinese interface)" src="https://github.com/user-attachments/assets/76bb6490-3dee-43f5-a863-96bc99546b52" />

</details>

```yaml
sniffer:
  enable: true
  parse-pure-ip: true
  force-dns-mapping: true
  override-destination: true
  sniff:
    HTTP:
      ports:
        - "80"
        - 8080-8880
      override-destination: true
    TLS:
      ports:
        - "443"
        - "8443"
    QUIC:
      ports:
        - "443"
        - "8443"
        - "4433"
  skip-domain:
    - +.push.apple.com
  skip-dst-address:
    - 91.105.192.0/23
    - 91.108.4.0/22
    - 91.108.8.0/21
    - 91.108.16.0/21
    - 91.108.56.0/22
    - 95.161.64.0/20
    - 149.154.160.0/20
    - 185.76.151.0/24
    - 2001:67c:4e8::/48
    - 2001:b28:f23c::/47
    - 2001:b28:f23f::/48
    - 2a0a:f280:203::/48
```

</details>

<a id="六业务组推荐配置"></a>

<details>
<summary>Service-group selection reference</summary>

After importing, select suitable exits for each service. Exact runtime group names remain unchanged. These are operational suggestions, not guarantees of availability or regulatory compliance; check each service's current requirements.

| Service group (runtime identifiers retained) | Selection and verification |
|---|---|
| AI (`🤖 AI 服务`) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| Cryptocurrency (`💰 加密货币`) | Follow account requirements, service terms and applicable law; an exit region does not establish eligibility or compliance. |
| Payments (`🏦 金融支付`) | Follow account requirements, service terms and applicable law; an exit region does not establish eligibility or compliance. |
| Messaging (`💬 即时通讯`) | Compare connection success, packet loss and latency; choose a stable working exit. |
| Social media (`📱 社交媒体`) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| Collaboration (`🧑‍💼 会议协作`) | Compare connection success, packet loss and latency; choose a stable working exit. |
| China streaming (`📺 国内流媒体`) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| US streaming | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| Hong Kong streaming (`🇭🇰 香港流媒体`) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| Taiwan streaming (`🇹🇼 台湾流媒体`) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| Gaming platforms | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| Google (`🔍 Google 服务`) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| Tools (`🔧 工具与服务`) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| Restricted sites (`🚫 受限网站`) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |

Some older example category labels are not exact current group names. Select the actual service group shown by your configuration.

</details>

<a id="-协议支持mihomo--clashmeta--smart-内核"></a>

<details>
<summary>Protocol reference (depends on installed core version)</summary>

Protocol support depends on the Mihomo version actually installed. Use this table for selection, then verify node/core compatibility before import.

| Protocol | Support | Notes |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | AEAD ciphers and SS 2022 (blake3) |
| **ShadowsocksR (SSR)** | ✅ | Legacy protocol compatibility |
| **VMess** | ✅ | ws / grpc / h2 / httpupgrade transports |
| **VLESS** | ✅ | REALITY, XTLS-Vision and XTLS-rprx-splice |
| **Trojan** | ✅ | Trojan-Go extension fields |
| **Hysteria v1** | ✅ | QUIC-based |
| **Hysteria 2** | ✅ | UDP-based; verify network suitability |
| **TUIC v5** | ✅ | QUIC-based, with v4 compatibility |
| **WireGuard** | ✅ | Core outbound |
| **AnyTLS** | ✅ | TLS obfuscation, Mihomo 1.18+ |
| **ShadowTLS v1/v2/v3** | ✅ | TLS camouflage layer |
| **Snell v4** | ✅ | Surge protocol, supported by Mihomo |
| **SSH** | ✅ | Outbound tunnel |
| **Mieru** | ✅ | Mihomo Alpha capability |
| **SOCKS5 / HTTP(S)** | ✅ | Basic fallback |

### Choosing a protocol

Use a provider-offered protocol supported by the current core. For UDP protocols, also verify UDP return traffic on your network and selected node.

</details>

<a id="八目录一览"></a>

The two JS files target Smart / Normal respectively. Manual supplementary YAML appears above. Business DNS authority is [business-dns-policy.json](../../rulesets/source/business-dns-policy.json). Maintain projections with `node tools/sync-business-dns-policy.js`, then verify with `--check` and business DNS tests.

<a id="九致谢"></a>

- [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo) / [vernesong/mihomo](https://github.com/vernesong/mihomo): Mihomo / Smart cores.
- [mihomo-party-org/mihomo-party](https://github.com/mihomo-party-org/mihomo-party): desktop client.
- [clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev): desktop client.
- [sub-store-org/Sub-Store](https://github.com/sub-store-org/Sub-Store): subscription aggregation.
- All upstream rule maintainers, including bm7 / MetaCubeX / Loyalsoldier / blackmatrix7.

<a id="-支持本项目"></a>

[Changelog](CHANGELOG.md) · [Support the project](../../docs/donate.md) · [Report an issue](https://github.com/IvanSolis1989/Smart-Config-Kit/issues)
