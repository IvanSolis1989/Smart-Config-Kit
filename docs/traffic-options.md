<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-traffic-options-mobile.svg">
  <img src="assets/readme/page-traffic-options.svg" width="100%" alt="Technical guide">
</picture>

<a id="测速与-quic-策略选项"></a>
# Health-check and QUIC policy options

**English** | [简体中文](traffic-options.zh-CN.md)

Choose supported node health-check intervals and handling of non-China QUIC traffic, then inspect the effective configuration in your client.

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="Downloads"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="Documentation"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="Checks and troubleshooting"></a>
</p>

[Downloads](guide/downloads.md) · [Documentation](README.md) · [Checks and troubleshooting](guide/dns-and-verification.md)

The [unified configuration entry](configuration.md) provides an offline form and device-local JS updates, preserving health-check, QUIC, multiplier, and node-DNS choices together.

<a id="使用入口"></a>
## Entry points

1. Download and open the [offline form](configuration.html), then select a client and service profile.
2. Adjust the health-check and QUIC options available for that client, download the configuration, and import or load it.
3. Read back the effective configuration. On the same network, node, and application, inspect TCP/443, UDP/443, and rule-match logs.

The repository provides two independent options: node health-check frequency and handling of non-China QUIC traffic. They change only test timing or preliminary UDP/443 handling. Actual results still require validation with the client, node, and destination website.

<a id="维护者生成"></a>
## Maintainer generation

Run from the repository root:

```bash
# Preview which managed outputs this choice will change.
node tools/configure-traffic-options.js --health-check power-save --quic follow-rules --dry-run

# Save the choice and synchronize client outputs.
node tools/configure-traffic-options.js --health-check power-save --quic follow-rules
```

The first command previews affected managed outputs; the second saves the choice and synchronizes them. Choices are stored in `rulesets/source/traffic-options.json` for subsequent generation. Specify either parameter independently: `--health-check` accepts `standard` (default) or `power-save`; `--quic` accepts `block-foreign` (default) or `follow-rules`. Restore defaults with:

```bash
node tools/configure-traffic-options.js --health-check standard --quic block-foreign
```

With `--target <existing-local.js>`, only that device’s JS file is updated. `--source <new-JS>` updates source code; `--preserve-local` retains device-specific health-check/QUIC choices. An explicit ZeroTier boolean is always retained by default.

See [ZeroTier local proxy options](zerotier-planet-proxy.md) for device-level enable/disable and safe-update commands.

The JS runtime synchronizer preserves each file’s LF/CRLF format and the newline after the marked block. Regenerating a synchronized file leaves its contents unchanged. Run `node tools/sync-traffic-options.js --check` to compare the shared runtime and three JS copies byte for byte.

This command switches only health-check and QUIC options and reuses published fused assets. Before reuse, it verifies SHA bindings for the source graph and asset content; it does not fetch rules from mutable Geo caches or upstreams. Egern also uses the compressed native-asset snapshot stored in the repository: the default profile reuses original bytes, while `follow-rules` recalculates only affected domain portions from frozen fused/Mihomo assets and preserves non-domain portions.

If upstream sources, rule order, or rule-set content also change, run the full MRS synchronization, fused compilation, and client generation chain. This option command is not a substitute.

For a full refresh, follow the order in `AGENTS.md`: MRS synchronization, fused compilation, then client generation. Generate Egern with `node tools/generate-egern-from-cmfa.js` without `--reuse-assets`.

Regardless of the selected QUIC option, the full generator first refreshes the reusable neutral `block-foreign` snapshot, then emits Egern rules for the current option. Use `--reuse-assets` only for subsequent option-only changes. There is no need to switch manually back to `block-foreign` first.

For Clash Party Smart/Normal and FlClash JS overrides, edit the top-level `const SCKI_HEALTH_CHECK_PROFILE` and `const SCKI_QUIC_POLICY`, then reload the script in the client. These JS scripts do not read system environment variables.

OpenClash Smart/Normal shell scripts can override build defaults with `SCKI_HEALTH_CHECK_PROFILE=standard|power-save` and `SCKI_QUIC_POLICY=block-foreign|follow-rules`. The process launching the script must pass those environment variables.

Download static YAML/CONF/JSON files through the offline form and reimport them. Inspect the client’s loaded configuration and match logs to avoid testing stale cached settings.

<a id="节点健康检查"></a>
## Node health checks

`standard` is the default: supported Mihomo and Stash test groups retain a 300-second interval and `lazy: true`. Unselected groups can skip background tests while active groups retain their normal interval. `power-save` extends those groups with native `lazy` support to 900 seconds, retaining `lazy: true`.

Longer intervals may delay detection of failed nodes. Results may also be older when first selecting a region or returning to one that has not been used recently. The repository has no device-measured battery-saving result.

<a id="clash-party-smartnormalflclashcmfaopenclash-smartnormal"></a>
### Clash Party Smart/Normal, FlClash, CMFA, OpenClash Smart/Normal

- **`standard` / `power-save`**: test-capable Mihomo groups use `interval: 300` / `900`, both with `lazy: true`. Lazy testing skips unselected groups; actual Smart-group selection also depends on the Smart core. In CMFA static YAML, the `Subscribe` provider’s `health-check.interval` is also 300 / 900 seconds with `lazy` enabled. JS and OpenClash expand/rebuild subscription nodes, so they do not add fields to original providers that no longer exist.

<a id="stash"></a>
### Stash

- **`standard` / `power-save`**: supported policy groups use `interval: 300` / `900`, both with `lazy: true`.

<a id="surge"></a>
### Surge

- **`standard` / `power-save`**: test intervals are 300 / 900 seconds. Network changes may still trigger retesting. This revision does not add Mihomo’s `lazy` field.

<a id="shadowrocketloon"></a>
### Shadowrocket, Loon

- **`standard` / `power-save`**: test intervals are 300 / 900 seconds. Neither client uses a native `lazy` field in this implementation.

<a id="quantumult-x"></a>
### Quantumult X

- **`standard` / `power-save`**: `alive-checking: true` / `false`. Mihomo’s `lazy` field is not transplanted into QX.

<a id="sing-box"></a>
### sing-box

- **`standard` / `power-save`**: `urltest.interval` is 5 / 15 minutes. `idle_timeout` is an idle timeout, not Mihomo’s `lazy` behavior.

<a id="egern"></a>
### Egern

- **`standard` / `power-save`**: both retain the current native `smart` group’s adaptive probing. The official `interval` field applies to `auto_test`, so the group type is not forcibly changed. Regeneration caused only by CMFA source metadata updates refreshes Egern manifest hashes.

<a id="v2rayn-xray-路由-jsonpasswallpasswall2-shunt-产物"></a>
### v2rayN Xray routing JSON and Passwall/Passwall2 shunt outputs

- **`standard` / `power-save`**: these outputs describe only routing/shunt rules; other client settings manage node testing.

Field references: [Mihomo group `interval`/`lazy`](https://wiki.metacubex.one/config/proxy-groups/), [Stash scheduled tests](https://stash.wiki/en/proxy-protocols/proxy-groups), [Surge URL-test groups](https://manual.nssurge.com/policy-groups/url-test.html), [sing-box URLTest](https://sing-box.sagernet.org/configuration/outbound/urltest/), [Egern policy groups](https://egernapp.com/docs/configuration/policy_groups/), and [Quantumult X official example](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf).

Clients also impose background restrictions, app suspension, and manual-test behavior. Configuration fields alone do not establish battery savings.

<a id="海外-udp443-与-quic"></a>
## Non-China UDP/443 and QUIC

`block-foreign` retains the source graph’s four existing service exceptions followed by rejection of non-China UDP/443. `follow-rules` removes that dedicated rejection so UDP/443 proceeds through normal service rules. It does not guarantee HTTP/3 use by a website or alter a node’s UDP capability.

Client syntax limits mean not every `block-foreign` implementation can express the source graph’s exact address-and-port combination.

The following sections describe each platform’s actual scope and the effect of `follow-rules`.

<a id="mihomostashsing-boxegern"></a>
### Mihomo, Stash, sing-box, Egern

Retain preliminary UDP/443 handling within each platform’s supported syntax. Switching removes the dedicated rejection rule.

<a id="shadowrocketsurge"></a>
### Shadowrocket, Surge

The previous configuration used the engine switch `block-quic = all-proxy`, which cannot express the four service exceptions or the non-China condition. Its scope is therefore broader than the source graph. `follow-rules` removes this managed global block.

<a id="loon"></a>
### Loon

The previous `disable-udp-ports = 443` setting disables all UDP/443, including China-classified addresses and the four service exceptions. `follow-rules` removes this managed restriction.

<a id="quantumult-x"></a>
### Quantumult X

Both modes retain `fallback_udp_policy=reject`. This rejects capability fallback only when the selected node lacks UDP support; it does not implement the source graph’s destination-address and UDP/443 condition. It must not be described as equivalent.

<a id="passwallpasswall2"></a>
### Passwall, Passwall2

Repository outputs are shunt rule sets and application scripts, without a separate port checker. Actual UDP support also depends on LuCI settings and the selected core.

<a id="v2rayn-xray"></a>
### v2rayN Xray

Only routing rules are supplied. Actual traffic capture and UDP capability depend on the Xray configuration under `Xray内核系/v2rayN`.

Either mode can change application behavior. Blocking non-China UDP/443 may cause TCP fallback. Allowing it through a node without UDP support can cause timeouts or a connection path different from TCP. Especially on the reduced-capability platforms above, use actual client connection logs rather than assuming exact equivalence across all 14 clients.

After switching, compare TCP/443 and UDP/443 connections and rule matches on the same network, node, and application; record failures or fallback paths. There are currently no controlled device comparisons, so this option cannot be described as having fixed a historical application fault.
