[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-cmfa-mobile.svg">
  <img src="../../docs/assets/readme/page-cmfa.svg" alt="Clash Meta For Android (CMFA) import guide" width="100%">
</picture>

# Clash Meta For Android (CMFA) import guide

Import native Mihomo YAML on Android. ClashMi can reuse the same file. Enter your node subscription before importing and starting. This configuration uses **url-test, not Smart / LightGBM**.

<p><a href="../../docs/guide/downloads.md#mihomo"><img src="../../docs/assets/readme/nav-downloads.svg" alt="Downloads" width="145" height="38"></a> <a href="../../docs/README.md"><img src="../../docs/assets/readme/nav-docs.svg" alt="Documentation" width="145" height="38"></a> <a href="#verification"><img src="../../docs/assets/readme/nav-verify.svg" alt="Post-import verification" width="145" height="38"></a></p>

[Preparation](#before-you-start) · [Files](#downloads) · [Import](#import) · [Troubleshooting](#faq) · [Reference](#reference)

<a id="-零基础-5-分钟快速开始"></a>
<a id="before-you-start"></a>

[Optional service profiles and local parameters](../../docs/configuration.md): the complete configuration remains the default. Optional projections use separate directories; see the shared guide for supported runtime parameters.

## Before you start: client and subscription

Prepare an Android device, CMFA APK, Mihomo node subscription and this directory's YAML. Use the validated **Mihomo v1.19.29 baseline or a newer compatible core**.

<a id="一下载-cmfa-客户端"></a>

1. Releases: https://github.com/MetaCubeX/ClashMetaForAndroid/releases
2. Select an APK for the device CPU:
   - **arm64-v8a:** most phones released after 2017.
   - **armeabi-v7a:** some older devices.
   - **universal:** if unsure.
3. After installation, grant required VPN and file-access permissions through the device's prompts.

The Full configuration has 22 regional + 33 service groups. Empty regional groups reject connections; select a populated region or global group. Rule downloads need GitHub Raw access or a working proxy.

<a id="-规则下载链接"></a>
<a id="downloads"></a>

## Select and download files

### Online selection and local import

Open the [configuration page](https://ivansolis1989.github.io/Smart-Config-Kit/), choose CMFA / ClashMi, Full / Lite / Custom and supported parameters, then download YAML. Enter your subscription locally and import below. ClashMi uses the same YAML through its [import procedure](#九兼容客户端clashmi跨平台); inspect application overrides and real connections. Generation is local without reading/uploading subscriptions or personal configuration.

To update, refresh the page, choose the same profile and parameters, download a new copy, reconnect your nodes using the original method and replace local configuration. Official remote URLs target full defaults and cannot automatically preserve customizations. See the [configuration guide](../../docs/configuration.md) for service scope.

[![Download CMFA YAML](../../docs/assets/readme/button-cmfa-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)

The button opens the raw file. Right-click to copy the URL or save locally.

**CMFA YAML URL:**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml
```

Enter your subscription after downloading, then import. ClashMi reuses this file.

<a id="import"></a>

## Import in order

<a id="二修改订阅链接"></a>

### 1. Enter the node subscription

Open `CMFA(mihomo).yaml` and edit `proxy-providers.Subscribe.url`. Keep other fields at their existing values. Example structure:

```yaml
proxy-providers:
  Subscribe:
    type: http
    url: 'https://my.example.com/your-subscription-url'   # Replace with your provider subscription URL
    interval: 86400
    path: ./proxy_providers/subscribe.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置|10x|20x|100x)'
```

The subscription must return Mihomo-compatible nodes. For Sub-Store, use its output URL and retain existing filters and health checks.

For multiple providers, prefer one phone-accessible Mihomo URL from [Sub-Store](../../SubStore/README.md). `127.0.0.1` refers to the phone itself. To manually configure several providers, see [reference](#reference); update `use` in all 22 regional groups.

<a id="三导入配置到-cmfa"></a>

### 2. Import the edited YAML

#### Method A: local file (recommended for first use)

1. Copy edited `CMFA(mihomo).yaml` to phone storage, such as `Download/`.
2. CMFA → **Profiles → + → Import from file**.
3. Select the YAML, name it `Clash Smart` and confirm. The example profile name does not imply Smart-core functionality.

#### Method B: hosted URL (for ongoing updates)

1. Host your edited YAML using a suitable server, Gist or raw-file service. Protect it from public access because it contains your subscription URL; do not publish it in a public repository or Gist.
2. CMFA → **Profiles → + → Import from URL**, paste the private accessible URL and confirm.
3. Automatic polling is normally every 24 hours; adjust in profile settings.

Interface labels may vary by client version/language.

<a id="四首次启动"></a>

### 3. Select the profile and start VPN

Select and start the profile. Wait for nodes and fused rule-sets to download. GeoSite/GeoIP resources needed by DNS must also be available. Logs should show no parser/download errors; then inspect actual connections.

This YAML does not use LightGBM or download Model.bin. If downloads fail, preserve working caches and follow [rule download diagnostics](../../docs/rule-asset-delivery.md) for proxy and HTTP-status checks.

<a id="verification"></a>

## Post-import verification

1. Confirm 22 regional + 33 service groups in Proxies. Regions use url-test; select a populated region.
2. Confirm node and rule-set downloads, with no parser errors. DNS GeoSite / GeoIP resources must be available.
3. Access China-based and international services and inspect connection domains, matched rules, service groups and actual outbounds.
4. Follow the [complete checklist](../../docs/guide/dns-and-verification.md#verification) for DNS and rule loading. A working webpage does not prove the whole configuration is active.

<a id="七常见问题"></a>
<a id="faq"></a>

## Troubleshooting

### Q1: list geosite not found or rule parser errors?

Use current CMFA/Mihomo, identify the exact error and check rule-set downloads and GeoSite resources. Routing uses fused rules, but DNS policy still depends on GeoSite.

### Q2: Incorrect regional classification?

Regional filters match node names using regex. First confirm provider downloads and correct `use` references, then report misses with redacted node names.

### Q3: LightGBM selection is not active?

This YAML does not use Smart/LightGBM. url-test selects by latency. Do not add `uselightgbm` or download a model for this profile.

### Q4: Banking/payment applications fail in fake-ip mode?

Inspect the failing domain, rule and outbound first. Use client application filtering to exclude a whole application when necessary. Add a domain to your local fake-ip exclusions only after confirming a fake-ip compatibility issue.

### Q5: Can fake-ip distort STUN/WebRTC tests?

STUN/TURN domains use real IPs. Standard ports `3478 / 3479 / 5349 / 19302 / 19305 / 19307` use `DIRECT`. Services forcing UDP/443 TURN remain subject to QUIC-blocking policy.

<a id="reference"></a>

## Advanced reference

- [DNS and import acceptance](../../docs/guide/dns-and-verification.md) · [Rule downloads](../../docs/rule-asset-delivery.md).
- [Private-node DNS manual overlay](../../docs/private-node-dns.md) · [Latency testing / QUIC](../../docs/traffic-options.md) · [WeChat troubleshooting](../../docs/research/2026-10-16-wechat-issue-187.md).
- [Mihomo groups](https://wiki.metacubex.one/config/proxy-groups/) · [Mihomo DNS](https://wiki.metacubex.one/config/dns/) · [Official version review](../../docs/upstream/2026-10-19/mihomo/report.md).

<a id="九兼容客户端clashmi跨平台"></a>

### Import the same YAML in ClashMi

[ClashMi](https://github.com/KaringX/clashmi) reuses this YAML through its Mihomo core; no separate artifact is needed. Check application override order, bundled core version and VPN permissions separately. See the [official review](../../docs/upstream/2026-10-19/mihomo/report.md).

#### Import methods

ClashMi home menu → **My configurations → +**, then choose:

- **Add configuration link:** URL import with scheduled updates.
- **Import from clipboard:** paste YAML.
- **Import from file:** local `.yml` / `.yaml`.
- **Scan QR code**.

Save and enable. This YAML has no `tun` section; configure required TUN/VPN settings in the application. Built-in DNS/TUN overrides may change imported values, so inspect final configuration.

#### Shared behavior with CMFA

Reuses 55 groups (22 regional + 33 service), 168 main rules and 149 fused providers. Regions use url-test. Effective DNS, sniffing and rule loading depend on application overrides and bundled core.

#### ClashMi-specific differences

The official [FAQ](https://clashmi.app/guide/faq) describes these boundaries; this YAML avoids the unsupported fields where noted:

- **GEOIP / GEOSITE rules:** ClashMi converts these to corresponding geo rule-sets on startup through core customization. This YAML's GEOSITE routing is fused at compile time. A few residual providers retain GEOIP for native database lookup rather than expansion into hundreds of thousands of CIDRs.
- **`GEOIP,<ASN>`:** ClashMi iOS does not support the IP-ASN database. This YAML has no ASN rules.
- **iOS VPN Extension 50 MB memory limit:** exceeding it can terminate the extension. MRS and lazy loading do not guarantee staying below the limit; measure final memory on the device.
- **`tun:`:** the interface owns TUN controls; handwritten YAML is not recommended. This YAML omits `tun:` and relies on application settings.
- **Smart / LightGBM:** ClashMi bundles mainline, not the vernesong Smart fork, and does not recognize `type: smart`, `uselightgbm` or `lgbm-url`. This YAML uses url-test and none of those fields.
- **Core updates:** follow application releases and cannot be updated independently according to the FAQ. This YAML uses mainline stable fields; still check the actual core version.

GEOIP residual behavior, downloads and final memory require device verification. After import, inspect overrides, resource loading and real connections.

<details>
<summary>Multiple providers: Sub-Store, conversion services and manual configuration</summary>

Aggregate into one URL, or configure a separate provider for each source.

#### Method A: Sub-Store (recommended)

Follow [Sub-Store](../../SubStore/README.md), output Mihomo format and enter the **phone-accessible URL** in `Subscribe.url`. `127.0.0.1` refers to the phone, not a service running on your computer.

#### Method B: online conversion

Use a trusted service to merge URLs into Mihomo format and enter the result in `Subscribe.url`. The service can read subscription tokens. Prefer local Sub-Store or manual configuration for sensitive subscriptions.

#### Method C: several proxy-providers directly in YAML

Give each provider a unique name/cache path and reference all of them through regional-group `use` lists.

Replace the single-provider block:

```yaml
proxy-providers:
  Subscribe:
    type: http
    url: 'https://airport1.example.com/sub?token=xxx'
    interval: 86400
    path: ./proxy_providers/sub1.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置)'
```

With multiple providers:

```yaml
proxy-providers:
  Airport1:
    type: http
    url: 'https://airport1.example.com/sub?token=xxx'
    interval: 86400
    path: ./proxy_providers/airport1.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置)'

  Airport2:
    type: http
    url: 'https://airport2.example.com/sub?token=yyy'
    interval: 86400
    path: ./proxy_providers/airport2.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置)'

  Airport3:
    type: http
    url: 'https://airport3.example.com/sub?token=zzz'
    interval: 86400
    path: ./proxy_providers/airport3.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置)'
```

New providers are not automatically added to existing groups. Update `use` in **all 22 regional groups** and never duplicate provider names.

Replace:

```yaml
  use:
  - Subscribe
```

With (three-provider example):

```yaml
  use:
  - Airport1
  - Airport2
  - Airport3
```

Update all 22 regional groups. With one Sub-Store URL, retain `Subscribe`; no `use` change is needed.

</details>

<a id="五代理组说明"></a>

<details>
<summary>Regional and service-group selection reference</summary>

The configuration contains **22 regional groups (11 all-node + 11 residential) and 33 service groups**, visible in CMFA's Proxies page.

### Regional groups (automatic selection)

The 22 url-test groups filter by node name, including regional and residential groups. Update `use` when adding providers. Empty groups reject connections; select a populated region or global group.

### Service groups (manual selection)

Select candidates manually in the 33 service groups. These suggestions do not guarantee access or compliance with a service's regional restrictions. Actual configuration candidates are authoritative; exact runtime identifiers remain unchanged.

| Service group (runtime identifiers retained) | Selection and verification |
|---|---|
| `🤖 AI 服务` (ChatGPT/Claude/Gemini) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `💰 加密货币` | Follow account requirements, service terms and applicable law; an exit region does not establish eligibility or compliance. |
| `🏦 金融支付` | Follow account requirements, service terms and applicable law; an exit region does not establish eligibility or compliance. |
| `💬 即时通讯` (Telegram/Discord) | Compare connection success, packet loss and latency; choose a stable working exit. |
| `📱 社交媒体` (X/Twitter/Instagram) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🧑‍💼 会议协作` (Zoom/Teams) | Compare connection success, packet loss and latency; choose a stable working exit. |
| `📺 国内流媒体` (Bilibili/iQIYI/Tencent) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🎥 Netflix` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🎬 Disney+` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `📡 HBO/Max` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `📺 Hulu` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🎬 Prime Video` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `📹 YouTube` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🎵 音乐流媒体` (Spotify/Apple Music) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🇭🇰 香港流媒体` (Now E / MyTV) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🇹🇼 台湾流媒体` (LiTV / Bahamut) | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
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
| `🚫 受限网站` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🌐 国外网站` | Choose a working exit that meets service requirements and verify actual requests; do not infer it from the user’s location. |
| `🐟 漏网之鱼` | Final fallback group; inspect unmatched traffic and the selected exit. |
| `🛑 广告拦截` | The existing configuration targets `REJECT`; verify actual rules and requirements. |

</details>

<a id="六常用高级设置"></a>

<details>
<summary>Application filtering, VPN and background settings</summary>

### 1. Enable VPN / system-level capture

Start VPN in the client and approve the system prompt. This YAML has no `tun` section; the client manages Android traffic capture.

### 2. Dashboard / Meta SideBar

Use client proxies, connections or dashboard views to inspect url-test latency and actual outbounds. There is no LightGBM model status for this configuration.

### 3. Optional per-application filtering

CMFA → **Settings → Application filtering**:

- **Blacklist:** listed applications bypass the proxy. This can be appropriate for banking/payment applications requiring direct access.
- **Whitelist:** only listed applications use the proxy.

### 4. Background operation

- In system Battery optimization, set CMFA to **Not optimized**.
- MIUI / ColorOS / HarmonyOS may also require CMFA permissions for autostart and background pop-ups.

</details>

<a id="八配置关键字段速查"></a>

<details>
<summary>Key configuration fields</summary>

| Field | Location | Meaning |
|---|---|---|
| `mixed-port: 7890` | Top level | Combined HTTP / SOCKS port |
| `mode: rule` | Top level | Rule mode; do not change to global/direct |
| `find-process-mode: strict` | Top level | Process matching still depends on system/client permissions |
| `dns.enhanced-mode: fake-ip` | `dns` | fake-ip mode |
| `sniffer.enable: true` | `sniffer` | Enable SNI sniffing |
| `rule-providers.*.format: mrs` | `rule-providers` | Select MRS for the corresponding provider |

MRS is selected by provider `format`; `geodata-mode` is not the MRS switch. Android process matching depends on system/client permissions.

</details>

<a id="-协议支持mihomo-内核"></a>

<details>
<summary>Protocol reference (actual core is authoritative)</summary>

Support depends on the bundled Mihomo version. This is selection guidance, not a claim that every version sharing a client name has identical capabilities.

| Protocol | Support | Notes |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | AEAD and SS 2022 |
| **ShadowsocksR (SSR)** | ✅ | Legacy-provider compatibility |
| **VMess** | ✅ | ws/grpc/h2/httpupgrade |
| **VLESS** | ✅ | REALITY and XTLS-Vision |
| **Trojan** | ✅ | Trojan-Go extensions |
| **Hysteria v1 / v2** | ✅ | QUIC-based |
| **TUIC v5** | ✅ | QUIC-based |
| **WireGuard** | ✅ | Outbound |
| **AnyTLS / ShadowTLS / Snell v4 / SSH / Mieru** | ✅ | Check exact core version for these protocols |
| **SOCKS5 / HTTP(S)** | ✅ | |

### Note

This YAML uses url-test regions. CMFA does not execute JS overrides. FlClash supports its dedicated JS, but likewise does not provide vernesong Smart groups.

</details>

Business DNS authority: [business-dns-policy.json](../../rulesets/source/business-dns-policy.json). Maintenance:

```bash
node tools/sync-business-dns-policy.js
node tools/sync-business-dns-policy.js --check
node --test tools/tests/business-dns-policy.test.js tools/tests/business-dns-sync.test.js
```

<a id="十参考与致谢"></a>

- Core: [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo).
- LightGBM model project (not used by this YAML): [vernesong/mihomo](https://github.com/vernesong/mihomo).
- Rules: [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat).
- GeoIP: [Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip).
- Compatible client: [KaringX/clashmi](https://github.com/KaringX/clashmi) · [ClashMi FAQ](https://clashmi.app/guide/faq).

<a id="-支持本项目"></a>

[Changelog](CHANGELOG.md) · [Support the project](../../docs/donate.md) · [Report an issue](https://github.com/IvanSolis1989/Smart-Config-Kit/issues)
