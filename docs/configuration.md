<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-docs-mobile.svg">
  <img src="assets/readme/page-docs.svg" alt="Smart-Config-Kit configuration" width="100%">
</picture>

# Local options and service profiles

**English** | [中文](configuration.zh-CN.md)

The default Full configuration is unchanged. Open the [configuration page](https://ivansolis1989.github.io/Smart-Config-Kit/), select a client, service profile and supported options, then download a configuration without a CLI. You can also save the [offline HTML](configuration.html).

[Home](../README.md) · [Documentation](README.md) · [Downloads](guide/downloads.md) · [Validation](guide/dns-and-verification.md#verification) · [Limitations and licensing](disclaimer.md)

## Select and download

1. Open the [configuration page](https://ivansolis1989.github.io/Smart-Config-Kit/). It starts in English with FlClash / Full selected. Choose Chinese explicitly if preferred; browser language does not select it automatically. A locally saved `configuration.html` also works.
2. Choose **Full**, **Lite** (AI, messaging, collaboration and YouTube), or **Custom**, and adjust supported options.
3. Import the download using the matching client guide. Single files retain their extensions. Configurations with companion manifests, Passwall lists or AEROVE shards and budgets are ZIP archives: retain their directory structure. Optional-profile YAML uses JSON-compatible YAML; Full preserves published text with LF line endings.

| Client | Available options |
| --- | --- |
| Clash Party Smart / Normal, FlClash | Health checks, QUIC, endpoint DNS, multiplier cap, ZeroTier; UDP protection for selected Windows browsers |
| AEROVE Lite | Health checks, QUIC, multiplier cap, ZeroTier; DNS is app-managed and remains off |
| OpenClash, both variants | Health checks, QUIC, endpoint DNS, multiplier cap; runtime environment variables still override downloaded defaults |
| CMFA, Stash, Meow | Health checks and QUIC |
| Shadowrocket, Surge, Loon | Health checks and QUIC; native QUIC rules are broader, covering all-proxy or all UDP/443 |
| Quantumult X | Health checks; no QUIC toggle |
| sing-box 1.14 / 1.13 | Health checks at 5 / 15 minutes and native QUIC rules |
| v2rayN Xray, Karing | QUIC projection; Karing supplies routing only, with endpoints, DNS and the final action managed by the app |
| Egern, Passwall / Passwall2 | None of these options; Egern retains native smart health checks, and QUIC changes require rebuilding assets |

Unsupported options do not carry across clients. The online page loads static resources from GitHub. Its configuration selection, generation and downloads run locally: the form does not request subscriptions, read personal configuration files, upload them or include telemetry. Its CSP blocks connections, form submissions and workers. This statement describes this page's implementation, not the hosting provider's or your client's data practices. Language selection stores only the explicit interface-language preference.

The page embeds a trusted release snapshot and the separately MIT-licensed fflate ZIP library. It does not execute downloaded configurations, add arbitrary DNS entries, change server/SNI/Host values or alter proxy chains. It does not apply anything to your device automatically. Changing interface language does not translate configuration identifiers or change downloaded policy semantics.

The page updates with main. Reload to obtain the latest published snapshot; an already-open page retains its snapshot without background polling or service-worker caching. Re-download offline HTML to update it. Remote rule assets still require connectivity after client import.

Default policies and safety rules remain unchanged. Meow and AEROVE require separate device validation; there is no all-client performance benchmark. See the [capability matrix](client-capability-matrix.md) and [support queue](support-queue.md). The CLI remains available for advanced generation or updating local JS.

## Update local JS

From the repository root, preview before removing `--dry-run`:

```powershell
node tools/configure.js --target 'D:\Configs\local.js' --health-check power-save --quic follow-rules --max-multiplier 2 --dry-run
node tools/configure.js --target 'D:\Configs\local.js' --health-check power-save --quic follow-rules --max-multiplier 2
```

You can import settings downloaded from the form:

```powershell
node tools/configure.js --settings 'D:\Configs\settings.json' --target 'D:\Configs\local.js' --dry-run
```

| Option | Values | Default and limits |
| --- | --- | --- |
| `--health-check` | `standard` / `power-save` | Standard by default; power saving changes check timing, not service selection |
| `--quic` | `block-foreign` / `follow-rules` | Retains the existing non-China QUIC policy and service exceptions by default |
| `--browser-udp` | `off` / `reject` | Off by default; rejects all UDP for Windows Chrome / Edge / Firefox, potentially affecting calls and HTTP/3 |
| `--max-multiplier` | Positive number / `off` | Off by default; unknown or conflicting multiplier values do not trigger removal |
| `--dns-profile` | `off` / `policy` / `adaptive` / `hosts-only` | `adaptive` by default; trusted local settings only |
| `--zerotier` | `on` / `off` | Off by default; an explicit device-local choice |

Saving retains atomic replacement, concurrency checks, backups and readback. The target script is parsed for syntax and trusted constants, not executed.

Pass `--source` explicitly to update source code. Existing browser UDP protection, ZeroTier, endpoint DNS profile and multiplier cap are preserved automatically. `--preserve-local` additionally preserves health-check and QUIC options; explicit arguments take precedence:

```powershell
node tools/configure.js --target 'D:\Configs\local.js' --source 'D:\Configs\new.js' --preserve-local --dry-run
```

If the new source lacks the selected endpoint DNS mode, updating fails before saving. It never silently downgrades `hosts-only` to `adaptive`. AEROVE's app-managed DNS placeholder remains `off`.

These options apply only to this repository's JS scripts that implement the corresponding capabilities. Follow client guides for static configurations and system networking. The earlier `configure-traffic-options.js` entry point still works.

Browser UDP protection covers only the three specified Windows processes and requires TUN interception and working process identification. It defaults to `off` and cannot be enabled by a subscription. AEROVE Lite and other native entries do not expose it. See [WebRTC privacy and connection validation](guide/webrtc-privacy.md) for enablement, recovery and limitations.

## Generate service profiles

Profile generation uses Node.js and Ruby 3.0+ for structured YAML. Atomic directory publication supports Windows or Linux with GNU `mv`. Other build hosts fail explicitly rather than overwriting an existing directory as a fallback.

```powershell
# Preview outputs, service selection and client effects without creating an output directory.
node tools/configure.js --profile lite --output-dir 'D:\Configs\scki-lite' --dry-run

# The output directory must not exist; its parent must already exist.
node tools/configure.js --profile lite --output-dir 'D:\Configs\scki-lite'

# Retain dedicated AI and YouTube service rules.
node tools/configure.js --profile custom --enable ai,youtube --output-dir 'D:\Configs\scki-custom'

# List service identifiers from the source graph.
node tools/generate-business-profile.js --list
```

`full` copies the published entries and local dependencies byte-for-byte. `lite` retains AI, messaging, collaboration and YouTube. `custom` explicitly selects optional services. Advertising, China/non-China websites, restricted-site classification, final fallback, downloads, BT/PT, financial payments and cryptocurrency remain protected base groups.

Disabling a service removes its dedicated group and prunable rules; traffic then matches later base rules. Required logic, process and QUIC safety rules remain. Necessary targets map to surviving China/non-China base groups and are recorded in the manifest. Providers referenced by DNS, fake-IP or retained logical rules are not deleted. Endpoints, dialer chains and client DNS implementations retain their existing behavior.

`business-profile-manifest.json` records the selection, source and entry hashes, file hashes, removals, dependency closure and platform differences. Outputs reference existing published fused assets: they neither refresh upstreams nor establish a second policy source.

Xray, Passwall and Karing lack full nested policy groups; pruning is projected into their native segments and rules. App-managed endpoints, DNS and default actions remain app settings. Existing Meow/AEROVE device-validation boundaries still apply; generation success is not device validation.

Where safety predicates cannot be separated from a native binary rule set, the residual asset is conservatively retained and mapped to a base group, marked `preserved-safety-residual` in the manifest. Coexisting domains still match at the original position. This preserves safety rules but does not promise identical per-rule pruning on every platform.

## Exact endpoint hosts compatibility

Select `hosts-only` explicitly in a supported local entry only when you trust the subscription's exact endpoint-to-IP mappings:

```powershell
node tools/configure.js --target 'D:\Configs\local.js' --dns-profile hosts-only --dry-run
```

The mode accepts only exact active-endpoint FQDNs mapped to valid IPs, preserving multiple IPs and IPv6. It rejects wildcards, alias chains, unrelated hosts and invalid values. It does not inherit subscription resolver/policy settings, change endpoint `server`, SNI or Host, or overwrite repository hosts. Tampered or over-budget snapshots fail closed.

The three desktop JS variants and OpenClash Normal/Smart support this runtime. OpenClash selects it through the trusted startup environment `SCKI_SUBSCRIPTION_ADAPTER_PROFILE=hosts-only`. Other static clients do not gain runtime subscription adaptation; merge manually according to their guides.

Field references: [Mihomo DNS](https://wiki.metacubex.one/config/dns/) and [hosts](https://wiki.metacubex.one/config/dns/hosts/). See [private endpoint DNS](private-node-dns.md) for trust boundaries.

## Validate and recover

Review dry-run and save manifests, reimport, and inspect the effective configuration, rule downloads, service exits and DNS. Import optional service profiles from their new directory; default published configurations do not switch automatically.

Restore local JS from the generated `.bak` if needed. To select another service profile, use a different new directory instead of overwriting an existing configuration.

Maintenance checks:

```powershell
npm --prefix tools/js-engine-tests ci --ignore-scripts
node tools/validate-js-engines.js
node tools/generate-configuration-form.js --check
node tools/sync-node-dns-hints-adapters.js --check
```

The real QuickJS gate compares complete JSON and critical reference identity. It validates the pinned engine, not a particular app, system network or actual connection.
