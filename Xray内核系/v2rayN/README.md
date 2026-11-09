[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-v2rayn-mobile.svg">
  <img src="../../docs/assets/readme/page-v2rayn.svg" alt="v2rayN import guide" width="100%">
</picture>

# v2rayN import guide

<a id="v2rayn-使用教程对齐-clash-party-v6020"></a>

Choose the core before the file. Mihomo / sing-box use complete configurations; Xray uses a three-outbound routing-rule array.

[![Downloads](../../docs/assets/readme/nav-downloads.svg)](../../docs/guide/downloads.md) [![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [![Verification](../../docs/assets/readme/nav-verify.svg)](#verification)

[Choose core/file](#before-start) · [Download](#download) · [A: mihomo](#2-路径-amihomo-核心) · [B: sing-box](#3-路径-bsing-box-核心) · [C: Xray](#4-路径-cxray-核心-fallback) · [Troubleshooting](#faq) · [Advanced](#advanced)

> Xray routing version: `v6.0.21-v2n.11` · Build: 2026-10-28 · Baseline: Clash Party v6.0.21. See [CHANGELOG](CHANGELOG.md).

<a id="before-start"></a>
<a id="1-先选核心"></a>

[Optional service profiles and local parameters](../../docs/configuration.md): the complete configuration remains the default. Optional projections use separate directories; see the shared guide for runtime parameter support.

## Before you start: core and file

v2rayN manages multiple cores; a single file does not work with all of them. Prepare working nodes/subscriptions, then check the selected core and its actual version in the application.

| Core path | File | Import boundary |
| --- | --- | --- |
| A · mihomo | CMFA YAML | Static routing template; add real nodes or a subscription provider, retaining 22 regional and 33 service groups |
| B · sing-box | Full / 1.13-compatible JSON | Replace example nodes and load through a custom configuration server; choose according to actual core version |
| C · Xray | Xray routing JSON in this directory | Routing-rule array only, with `proxy` / `direct` / `block` targets; nodes remain application-managed |

v2rayN cannot execute Clash Party JS. For Smart / LightGBM, use an override-capable client with the vernesong Smart core. Ordinary Mihomo / Alpha is not Smart.

<a id="download"></a>
<a id="-规则下载链接"></a>

## Download the matching file

[![Download mihomo YAML](../../docs/assets/readme/button-mihomo-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)
[![Download sing-box JSON](../../docs/assets/readme/button-sing-box-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json)
[![Download Xray routing JSON](../../docs/assets/readme/button-xray-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/v2rayN%28xray%29.json)

Buttons open raw files for copying URLs or saving locally.

**mihomo YAML URL:**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml
```

**sing-box JSON URL:**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json
```

**Xray routing JSON URL:**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/v2rayN%28xray%29.json
```

Downloads require GitHub Raw access directly or through a working proxy. See [rule downloads](../../docs/rule-asset-delivery.md).

### Online selection and local import

Open the [configuration page](https://ivansolis1989.github.io/Smart-Config-Kit/). For path A select **CMFA / ClashMi**; for B select **sing-box 1.14** or **sing-box 1.13** according to the core; for C select **v2rayN · Xray routing**. Choose Full / Lite / Custom and offered client parameters, download, then load the local file using the corresponding path below. Xray output contains only rules targeting `proxy`, `direct` and `block`; import it in routing settings. Nodes and DNS remain application-managed. It is neither a subscription nor a complete runnable configuration.

To update, refresh, reselect client/profile/parameters and download. Back up configuration and node settings before replacing the corresponding local configuration or routing file; verify the loaded result. Do not overwrite customized files with the official full-configuration URL. Selection and generation run locally in the browser without reading or uploading subscriptions or personal configurations.

<a id="2-路径-amihomo-核心"></a>

## Path A: complete mihomo configuration

1. Use the mihomo custom-configuration entry to load `Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml`.
2. Add real nodes or a subscription provider first. Verify final configuration contains 22 regional groups, 33 service groups and valid node references. The static template contains no provider nodes and cannot connect as a node subscription.

This path is closest to the repository's main routing model, but CMFA is static YAML and does not execute Clash Party JS; it has no LightGBM Smart groups.

<a id="3-路径-bsing-box-核心"></a>

## Path B: complete sing-box configuration

1. Confirm core version and load the [matching SingBox JSON](../../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/README.md) through a **custom configuration server**. Full requires 1.14.3+; a separate 1.13-compatible file is available.
2. Replace example nodes, check group references and follow the SingBox guide to verify final configuration.

SingBox Full natively consumes repository fused assets at `rulesets/generated/fused/sing-box/*.srs`.

<a id="4-路径-cxray-核心-fallback"></a>

## Path C: Xray routing

`Xray内核系/v2rayN/v2rayN(xray).json` is a fallback routing-rule array for Xray. `tools/generate-fused-fallback-artifacts.js` flattens `rulesets/generated/fused/sing-box/*.json` into native Xray RuleObjects.

It contains 98 entries: 78 nonempty fused segments, 19 expressible inline rules and one disabled metadata rule, preserving first-match order. Targets are only `proxy`, `direct` and `block`.

Xray has no remote sing-box `.srs` field, so expansion into native RuleObjects makes the file larger.

Local Windows / Linux process rules arrive through the fused direct segment. Permanent `local-process-direct` regression contracts keep `WorkPro.exe` and `WorkProWebProcess.exe` on `direct`. These rules apply only to the machine running Xray.

### Import steps

1. Keep v2rayN on the Xray core.
2. Open routing settings and import `Xray内核系/v2rayN/v2rayN(xray).json`.
3. Confirm main configuration contains outbound tags `proxy`, `direct` and `block`.
4. Continue managing nodes through normal v2rayN subscriptions; this file handles routing only.

### Capability limits

- Three-outbound routing does not preserve regional/service policy groups. It has no URLTest, Smart, LightGBM, node filtering or subscription-group rebuilding.
- Port/logical rules cover only what Xray can express. The generator and validator record exceptions.

<a id="verification"></a>

## Import verification

- **A:** real nodes/providers are added, all 55 regional/service groups and references are intact, and rule downloads succeed.
- **B:** core version matches JSON; complete configuration retains `route`, `dns`, `rule_set` and group references; example nodes are replaced. Continue with [SingBox verification](../../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/README.md#verification).
- **C:** imported routing is enabled in full order, main configuration has `proxy`, `direct`, `block`, and real services use expected exits.

All three require real connections, final configuration and logs. Follow the [runtime checklist](../../docs/guide/dns-and-verification.md#verification). Existing official-source and configuration checks do not equal v2rayN application import or connection acceptance.

<a id="faq"></a>

## Troubleshooting

**Why are there no nodes after downloading JSON?** C contains routing only; A is static and B has examples to replace. Add real subscriptions/nodes using the matching path and verify outbound references.

**Can the Xray file be loaded as a complete configuration?** No. It is a v2rayN custom routing-rule array for routing settings. Complete-configuration entry points are for matching mihomo / sing-box files.

**Can Xray consume this repository's SRS?** No. Its path expands fused source JSON into RuleObjects and does not preserve nested regional/service groups.

<a id="advanced"></a>

## Advanced reference

<a id="5-happ-用户"></a>

### Happ users

Happ uses Xray-core, but its native routing profile, complete Xray JSON and v2rayN RuleObject arrays are different formats. **Do not directly import this JSON into Happ and assume equivalent policy.** Official Happ profiles use `happ://routing/...`; JSON subscriptions have separate routing-binding restrictions. See [official import documentation](https://www.happ.su/main/dev-docs/routing) and the [historical review](../../docs/upstream/2026-10-19/consumers/report.md). This repository has no acceptance-tested native Happ artifact or converter.

<details>
<summary>Maintainer entry points and official format</summary>

<a id="6-维护者入口"></a>

### Maintenance

Do not manually edit `Xray内核系/v2rayN/v2rayN(xray).json`. Rules originate in `rulesets/source/routing-graph.js`. Generate fallback artifacts with:

```bash
node tools/build-fused-rule-sets.js
node tools/generate-fused-fallback-artifacts.js
node tools/validate-artifact-contracts.js --strict-ruby
```

Official syntax:

- v2rayN custom routing: https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules
- Xray RuleObject: https://xtls.github.io/config/routing.html

Further reading: [Claude dependencies](../../docs/claude-service-dependencies.md) · [Latency testing and QUIC](../../docs/traffic-options.md) · [WeChat troubleshooting](../../docs/research/2026-10-16-wechat-issue-187.md).

</details>
