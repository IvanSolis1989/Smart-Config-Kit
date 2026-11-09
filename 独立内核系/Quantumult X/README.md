[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-quantumult-x-mobile.svg">
  <img src="../../docs/assets/readme/page-quantumult-x.svg" alt="Quantumult X import guide" width="100%">
</picture>

# Quantumult X guide

Import native QX routing configuration, enter your node subscription, then check policy and filter_remote. A resource parser converts formats; it cannot extend core protocol support.

[![Downloads](../../docs/assets/readme/nav-downloads.svg)](../../docs/guide/downloads.md) [![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [![Import steps](../../docs/assets/readme/nav-tutorial.svg)](#import) [![Verification](../../docs/assets/readme/nav-verify.svg)](#verification)

[Preparation](#before-start) · [Download](#download) · [Import](#import) · [Settings](#settings) · [Verification](#verification) · [Troubleshooting](#faq) · [Reference](#reference)

> File: `QuantumultX.conf` · **v6.0.21-QX.14** (Build 2026-11-07)
> 22 regional groups (11 all-node + 11 residential) and 33 service groups, following the Clash Party v6.0.21 routing baseline.

<a id="before-start"></a>

## Before you start

Prepare Quantumult X, your provider subscription URL and the configuration URL below. As checked on 2026-10-19, official stable 1.8.1 requires iOS 15+. Check other device compatibility in the [official store](https://apps.apple.com/us/app/quantumult-x/id1443988620).

- Install from the [App Store](https://apps.apple.com/app/quantumult-x/id1443988620). The first connection requires permission to add a VPN configuration.
- Enter subscriptions / manual nodes under `[server_remote]` / `[server_local]`. The template contains no working nodes.
- `[policy]` defines policies; `[filter_remote]` / `[filter_local]` define remote / local rules.
- QX does not provide Mihomo Smart / LightGBM.

<a id="download"></a>

## Download

[![Download Quantumult X CONF](../../docs/assets/readme/button-quantumult-x-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/QuantumultX.conf)

The button opens the raw file. Right-click to copy its URL, or save it locally.

**Direct Quantumult X CONF URL:**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/QuantumultX.conf
```

Copy the URL, import below, and add your subscription. Configuration downloads and remote-rule updates require GitHub Raw access; see [download troubleshooting](../../docs/rule-asset-delivery.md). Keep a backup of local customizations because remote updates can overwrite them.

### Online selection and local import

Open the [configuration page](https://ivansolis1989.github.io/Smart-Config-Kit/), select **Quantumult X**, Full / Lite / Custom, and optional latency-test parameters. This client has no QUIC switch, runtime node DNS or multiplier adaptation.

After downloading `.conf`, fill `[server_remote]` or manual nodes as below. You may privately host the copy over HTTPS and use **Settings → Configuration → Download configuration** to fetch and apply it.

Lite / Custom trim service groups according to your selection; counts below describe Full. To update, refresh the page, select the same profile and parameters, download again, back up configuration and node customizations, then replace or reimport the copy. Do not overwrite a customized file using this repository's full-configuration URL. Selection and generation are local and do not read or upload subscriptions or personal configuration. Protect files containing subscription URLs; do not expose hosted copies publicly. See the [configuration guide](../../docs/configuration.md).

<a id="import"></a>

## Import in order

### 1. Import routing configuration

1. Copy the raw URL above; host a customized copy at your own HTTPS address when needed.
2. In QX, open **Settings → Configuration → Download configuration**, paste the URL and apply. Labels depend on the application language/version.
3. Confirm all `filter_remote` downloads complete. If GitHub Raw is unreachable, use a working proxy to download first.

### 2. Subscription / nodes (manual configuration required)

The template contains no working nodes. Choose a method below; subscription formats and protocols must be supported by QX.

#### Method A: subscription (recommended)

Edit `[server_remote]`, enter your subscription and reapply:

```text
https://your-subscription.example.com/sub, tag=YOUR_AIRPORT, update-interval=86400, opt-parser=true, enabled=true
```

Check that node `tag` values contain regional identifiers such as HK / JP / US.

#### Method B: manual node definitions

Enter native QX nodes in `[server_local]`, replacing example hosts, credentials and tags:

```text
vmess=example.com:443, method=chacha20-ietf-poly1305, password=UUID, obfs=wss, obfs-host=example.com, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=HK-01
trojan=example.com:443, password=xxx, over-tls=true, tls-host=example.com, tag=HK-02
ss=example.com:443, method=aes-256-gcm, password=xxx, tag=JP-01
```

#### Method C: scan in QX

Use ➕ on the home screen to scan or manually add nodes, then confirm policy groups can reference them.

#### Method D: online subscription conversion / merging

Converted or merged output must use QX-supported formats. Third-party services can read subscription links containing tokens. After conversion, still verify protocol support.

### 3. Apply and connect

Save and reapply. Verify subscriptions, remote rules and regional group members, then enable the home-screen connection switch.

<a id="settings"></a>

## Required settings

### Regional and service policies

Each of 11 regions has all-node and residential groups: 22 regional groups plus 33 service groups.

#### Regional groups (`url-latency-benchmark`)

`server-tag-regex` matches node tags. Current settings are `check-interval=300` and `tolerance=10`. Official regex-filter comments conflict with a concrete example, so actual group expansion still requires application acceptance.

#### Service groups (`static`)

Manually select a node or regional group in the policy panel. See the [Surge service-group explanation](../Surge/README.md#业务策略组select-手动). Service availability still depends on the actual exit.

### DNS

Plain DNS uses `server=` and DoH uses `doh-server=`. Following the official multi-DoH syntax, endpoints share **one comma-separated line**:

```text
server=223.5.5.5
server=119.29.29.29
server=1.1.1.1
server=8.8.8.8
doh-server=https://223.5.5.5/dns-query, https://223.6.6.6/dns-query, https://8.8.8.8/dns-query, https://1.1.1.1/dns-query
no-ipv6
```

Apple / iCloud system-DNS exceptions use `[general] dns_exclusion_list`. This does not claim equivalent Mihomo `fallback-filter`, `respect-rules` or separate `proxy-server-nameserver` behavior. See the [historical review](../../docs/upstream/2026-10-19/apple/report.md) for official syntax and pending live concurrent-query checks.

<a id="verification"></a>

## Import verification

1. Confirm this directory's configuration is active, with 22 regional and 33 service groups loaded. Verify working members within regional groups.
2. Confirm subscription and every `filter_remote` download succeeded. An enabled connection switch is not proof of successful downloads.
3. Visit `chat.openai.com`, `www.netflix.com` and `www.bilibili.com`. Check AI, Netflix and China-streaming rule matches and actual exits in request/connection logs.
4. Complete the [DNS and import checklist](../../docs/guide/dns-and-verification.md#verification), including Wi-Fi / cellular switching as needed.

If requests are absent from logs, groups are empty or exits differ, use the troubleshooting steps below.

<a id="faq"></a>

## Troubleshooting

### Q1: filter_remote download fails?

Confirm GitHub Raw access, use a working proxy if needed, then refresh configuration and remote rules. See [download troubleshooting](../../docs/rule-asset-delivery.md).

### Q2: Nodes are not grouped into the 11 regions?

Check for Chinese regional names or identifiers such as HK / JP / US in node tags. Forms such as hk01 / jp01 / us01 are supported. Inspect actual group members; downloaded nodes do not prove classification succeeded.

### Q3: Use resource_parser_url for nonstandard subscriptions?

The configuration references the KOP-XIAO parser. Enable `opt-parser=true` only for trusted subscriptions. Converted output must still fit QX protocol support; a parser cannot add unsupported core protocols such as Hysteria 2 or TUIC.

### Q4: Add ad-filtering or check-in scripts?

Add needed resources to `[rewrite_remote]`. This URL is a placeholder; replace it with a trusted source:

```text
https://raw.githubusercontent.com/.../BoxJs.conf, tag=BoxJs, update-interval=86400, opt-parser=true, enabled=true
```

If MITM is needed, follow official QX certificate configuration/trust instructions, verify target hostnames and check rule conflicts.

### Q5: Select routes for network and service requirements?

Switch the relevant service group in the policy panel. See [Surge route diagnostics](../Surge/README.md#q6跨境场景中国--海外怎么切换).

### Q6: Use Quantumult X on macOS?

Check the [official compatibility list](https://apps.apple.com/us/app/quantumult-x/id1443988620). A standalone native Mac release and running the store application on a compatible Mac are different conditions. This guide has not completed Mac import acceptance.

<a id="reference"></a>

## Advanced reference

<details>
<summary>Protocol support and unresolved items</summary>

Reviewed against [official version history](https://apps.apple.com/us/app/quantumult-x/id1443988620) and the [official sample](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf):

| Protocol | Support | Notes |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | Includes AEAD |
| **ShadowsocksR (SSR)** | ✅ | Legacy-provider compatibility |
| **VMess** | ✅ | ws/grpc transports |
| **VLESS** | ✅ | Introduced in 1.5.0, per official history |
| **REALITY** | ✅ | Introduced in 1.5.5; not equivalent to XTLS-Vision |
| **XTLS-Vision** | ⚠️ | No conclusive official evidence obtained in this review |
| **Trojan** | ✅ | |
| **Hysteria v1** | ❌ | Unsupported |
| **Hysteria 2** | ❌ | Unsupported |
| **TUIC v5** | ❌ | Unsupported |
| **WireGuard** | ❌ | Unsupported |
| **Snell** | ❌ | Unsupported |
| **AnyTLS** | ✅ | Introduced in 1.6.0 (2026-05-21), per official history |
| **ShadowTLS / Mieru** | ⚠️ | No conclusive official evidence obtained in this review |
| **HTTP/2 / HTTPS / SOCKS5 / HTTP** | ✅ | |

REALITY support does not imply XTLS-Vision support. XTLS-Vision and ShadowTLS / Mieru still await official evidence. Full sources: [historical review](../../docs/upstream/2026-10-19/apple/report.md).

</details>

`resource_parser_url` parses resources; `[rewrite_local]` / `[rewrite_remote]` configure rewrites; `[task_local]` supports cron tasks. This configuration does not enable rewrites, tasks or MITM by default. Other policy types include available, ssid, round-robin and dest-hash; follow official samples.

Remote rules use fused `filter_remote`, not Mihomo `.mrs` directly. iOS PROCESS-NAME and QX `filter_local` URL-REGEX are platform exceptions. Mihomo TLS fingerprint controls are not provided.

Official references: [sample.conf](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf), [REFERENCE](REFERENCE-quantumultx.md). Reapply after updates; back up local customizations first.

[Quantumult X](https://apps.apple.com/app/quantumult-x/id1443988620) · [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [KOP-XIAO/QuantumultX](https://github.com/KOP-XIAO/QuantumultX) · [Koolson/Qure](https://github.com/Koolson/Qure)

[Routing policy](../../docs/guide/routing-policy.md) · [Client support](../../docs/guide/client-support.md) · [DNS and verification](../../docs/guide/dns-and-verification.md)

[Latency testing and QUIC](../../docs/traffic-options.md) · [WeChat troubleshooting](../../docs/research/2026-10-16-wechat-issue-187.md) · [Claude Desktop network dependencies](../../docs/claude-service-dependencies.md)

[Changelog](CHANGELOG.md) · [Official review and pending acceptance](../../docs/upstream/2026-10-19/apple/report.md) · [Support the project](../../docs/donate.md)
