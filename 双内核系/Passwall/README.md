[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-passwall-mobile.svg">
  <img src="../../docs/assets/readme/page-passwall.svg" alt="Passwall import guide" width="100%">
</picture>

# Passwall import guide

<a id="passwall-使用教程对齐-clash-party-v6020"></a>



Apply same-source fused SRS to sing-box shunt nodes on OpenWrt. Back up UCI first, import rules, then select each service exit.

[![Downloads](../../docs/assets/readme/nav-downloads.svg)](../../docs/guide/downloads.md) [![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [![Import verification](../../docs/assets/readme/nav-verify.svg)](#verification)

[Preparation](#before-start) · [Files](#files) · [Script import](#3-推荐导入方式) · [Manual import](#4-手工导入方式) · [Import verification](#verification) · [Troubleshooting](#faq) · [Advanced reference](#advanced)

> Configuration version: `v6.0.21-pw.12` · Build：2026-10-28 · Routing baseline: Clash Party v6.0.21 History: [CHANGELOG](CHANGELOG.md)。

<a id="before-start"></a>
<a id="-规则下载链接"></a>


[Optional service profiles and local parameters](../../docs/configuration.md): the complete configuration remains the default. Optional projections use separate directories; see the shared guide for supported runtime parameters.

## Preparation: verify the backend and back up

This directory provides a UCI batch-application script and fused SRS routing references. **Only shunt nodes with `type=sing-box` and `protocol=_shunt` are supported.** Filenames retain historical `xray+sing-box` for URL compatibility; this does not imply Xray support.

1. Prepare working nodes in LuCI and create a **sing-box shunt node**. Confirm every shunt node uses sing-box. Remove SRS rules before switching backends later.
2. Back up `/etc/config/passwall` and retain current node/rule settings.
3. Confirm the router can access GitHub Raw directly or through a working proxy. See [rule download troubleshooting](../../docs/rule-asset-delivery.md).

The script checks all shunt nodes before any write, stopping on Xray, unknown backends, read failures or no shunt nodes. Default `--replace` replaces old repository-managed rules; explicitly use `--append` for coexistence.

[![Download Passwall SH](../../docs/assets/readme/button-passwall-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/Passwall%28xray%2Bsing-box%29-apply.sh)

The button opens the raw script. Copy its URL or save it locally:

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/Passwall%28xray%2Bsing-box%29-apply.sh
```

<a id="files"></a>
<a id="2-文件说明"></a>

## Files

| File | Purpose |
| --- | --- |
| `Passwall(xray+sing-box)-apply.sh` | Creates 78 fused shunt rules after verifying sing-box shunt backends |
| `Passwall(xray+sing-box).conf` | Plain-text reference with order, targets and `.srs` URLs for 78 rules |
| `shunt-rules/*.list` | One `.list` per fused segment for manual copying into LuCI |
| `REFERENCE-passwall.md` | Passwall syntax and official source reference |

Each `shunt-rules/*.list` contains one non-comment line. Do not manually add `domain:` / `geoip:` / Clash prefixes.

### Online selection and local import

Open the [configuration page](https://ivansolis1989.github.io/Smart-Config-Kit/), select **Passwall** and Full / Lite / Custom. This entry has no latency-test or QUIC parameters. Fully extract the ZIP, preserving directory structure and `shunt-rules/` lists. Apply its local `Passwall(xray+sing-box)-apply.sh` using the script steps below, or import each list manually into LuCI. Confirm the sing-box shunt backend and select target nodes for each rule.

To update, refresh the page, reselect services and download. Back up UCI, replace equivalent local rules from the new package, verify node mappings, save and apply. Do not fetch the default script from the official URL over customized content. Selection/generation run locally in the browser without reading or uploading subscriptions or personal configuration.

<a id="3-推荐导入方式"></a>

## Step-by-step script import

1. Create a sing-box shunt node in LuCI and confirm all shunt nodes use that backend. Back up `/etc/config/passwall`. Copy `双内核系/Passwall/Passwall(xray+sing-box)-apply.sh` to the router and run the next step from its directory.
2. Run:

```sh
sh 'Passwall(xray+sing-box)-apply.sh'
```

3. Open Passwall routing controls in LuCI.
4. Within the sing-box shunt node, select a service target node for every `scki-fused-*` rule. The current stable global entry is `@global[0].node`; old TCP/UDP split-selection instructions do not replace actual backend settings.
5. Save and apply.

Default `--replace` removes old Smart-Config-Kit fused rules and legacy emoji-remark rules to prevent duplicate appends. For coexistence, explicitly run:

```sh
sh 'Passwall(xray+sing-box)-apply.sh' --append
```

<a id="4-手工导入方式"></a>

## Step-by-step manual import

Without SSH, add shunt rules individually inside a **sing-box shunt node** in LuCI. Manual pasting does not perform the script backend checks:

1. Open `双内核系/Passwall/shunt-rules/<segment>.list`.
2. Paste its `rule-set:remote:...srs` into Domain List.
3. If `Passwall(xray+sing-box).conf` also marks IP List for that segment, paste the same URL into IP List.
4. Select network types `tcp,udp`.
5. Select the desired node or load-balancing group for the service.

The sing-box backends in Passwall / Passwall2 support `rule-set:remote:` / `rule-set:local:`. Xray filters out these references; Passwall2 can also generate broad rules missing domain/IP conditions. Do not pass SRS references to Xray or paste Clash prefixes such as `DOMAIN-SUFFIX,`.

<a id="verification"></a>

## Import verification

- LuCI shows `scki-fused-*` rules in reference `.conf` order, with no duplicate old repository rules after replacement.
- All shunt nodes still use sing-box; every rule targets the intended service node, settings are saved/applied, and service logs show no backend or rule-download errors.
- Confirm the final generated configuration contains remote `route.rule_set`. Use real connections to verify direct, proxy, block and default traffic, then follow the [runtime checklist](../../docs/guide/dns-and-verification.md#verification).

Successful script exit, saved UCI or a running service does not replace rule-match verification. See [backend review](../../docs/upstream/2026-10-19/singbox/report.md#passwall--passwall2) for official source and local gate evidence. Real device, network and traffic acceptance still belongs on your OpenWrt router.

<a id="faq"></a>

## Troubleshooting

**Why does the script refuse to run?** Read the error and check every shunt node’s `protocol` and `type`. No shunt nodes, mixed Xray backends or read failures stop before UCI writes. Correct the backend before retrying.

**Why does the filename mention Xray when Xray is unsupported?** The plugin supports multiple backends, but this import path depends on SRS. Xray drops SRS references, and Passwall2 may produce broad matches without domain/IP conditions. Absence of errors does not prove compatibility.

**Can I paste Clash rules?** Do not use Clash prefixes such as `DOMAIN-SUFFIX,`. Follow the manual steps to copy `rule-set:remote:...srs` from `.list`, preserving order and targets.

**Need nested policy groups or Smart?** Use [OpenClash](../../Mihomo内核系/OpenClash/README.md). This fallback does not preserve Clash Party nested selectors or LightGBM.

<a id="advanced"></a>

## Advanced reference

<details>

<summary>Plugin scope, fused rules and capability differences</summary>

<a id="1-定位"></a>

### Plugin scope and fused rules

Passwall is a full-featured OpenWrt proxy plugin with direct/block/GFW/proxy lists, shunt rules, ACL and separate TCP/UDP node selection. It uses xray-core / sing-box, does not bundle Mihomo, and has no Clash Party nested proxy-groups selectors.

This directory therefore provides only a fallback: 78 nonempty native Passwall shunt rules generated from final fused rule sets. Each references one remote `.srs`:

```text
rule-set:remote:https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/<segment>.srs
```

Rules are maintained only in the source graph and fusion pipeline, not expanded manually here.

<a id="5-与-openclash-的差异"></a>

### Differences from OpenClash

| Capability | Passwall fallback | OpenClash / Clash Party |
| --- | --- | --- |
| Fused rule order | 78 nonempty shunt rules | 168 Mihomo main rules |
| Remote rule sets | sing-box `.srs` | Mihomo `.mrs` / residual YAML |
| Nested policy groups | Unsupported | Supported |
| Automatic latency testing | Configure nodes or load balancing yourself | Regional url-test / Smart supported |
| LightGBM | Unsupported | Supported by Clash Party Smart |
| Ports / logic / MATCH | Limited by the Passwall shunt model | Native Mihomo expressions |

Use OpenClash for nested policy groups or Smart.

</details>

<details>

<summary>Maintainer entry points and official syntax</summary>

<a id="6-维护者入口"></a>

### Maintainer entry points

Do not manually edit `Passwall(xray+sing-box)-apply.sh`, `Passwall(xray+sing-box).conf` or `shunt-rules/*.list`. Generation pipeline:

```bash
node tools/build-fused-rule-sets.js
node tools/generate-fused-fallback-artifacts.js
node tools/validate-artifact-contracts.js --strict-ruby
```

Official syntax references:

- Passwall shunt_rules.lua：https://github.com/Openwrt-Passwall/openwrt-passwall/blob/main/luci-app-passwall/luasrc/model/cbi/passwall/client/shunt_rules.lua
- Passwall2 shunt_rules.lua：https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua
- Passwall / Passwall2 differences discussion：https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555

Further reading: [Claude service dependencies](../../docs/claude-service-dependencies.md) · [Latency testing and QUIC](../../docs/traffic-options.md) · [WeChat troubleshooting](../../docs/research/2026-10-16-wechat-issue-187.md)。

</details>
