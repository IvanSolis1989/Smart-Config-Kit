<a id="myclash-设计吸收与验证记录"></a>
# MyClash design adoption and validation record

**English** | [简体中文](2026-10-29-myclash-adoption.zh-CN.md)


The implementation covers real JS-engine validation, optional service profiles, a unified local-configuration entry, and exact-hosts compatibility. The default routing baseline remains v6.0.21; optional behavior requires explicit trusted local parameters.

<a id="来源与复用"></a>
## Sources and reuse

The [pinned MyClash source](https://github.com/AIsouler/MyClash/blob/bf6c2dbc3b007b791284b437e5283854ce9c0f1a/Script/mihomoScript.js) informed on-demand service generation and configuration UX. Its node renaming, server-to-IP replacement, wholesale subscription-DNS inheritance, and proxy-chain cleanup were not ported. This repository already had strict preflight checks, a rule graph, fused assets, Node-DNS, and atomic parameter writing; this change extends those modules. The real engine uses pinned MIT dependency quickjs-emscripten 0.32.0; see the [engine reference](../../tools/js-engine-tests/REFERENCE.md) for sources and installation boundaries.

<a id="交付与同步范围"></a>
## Deliverables and synchronization scope

| Capability | Location and scope |
| --- | --- |
| Real-engine comparison | `tools/validate-js-engines.js`; compares complete outputs of three Mihomo JS scripts with Node, integrated into CI |
| Full / Lite / Custom | Service catalog exported from the source graph; twenty entries and their dependencies projected into a new directory; Full copies original bytes |
| Unified entry | `tools/configure.js` and the offline form share parameter definitions, retaining preview, backup, conflict checks, and readback |
| hosts-only | Three Mihomo JS scripts and two OpenClash Ruby implementations; retains only exact active-node FQDN-to-valid-IP mappings |
| Metadata maintenance | Deduplicated Egern generator headers; clarified AEROVE app-managed DNS comments; synchronized versions and CHANGELOG |

Static clients without the corresponding Node-DNS runtime receive no invalid modes. Service generation covers existing clients, Karing, and Meow/AEROVE entries while retaining capability limitations. Passwall targets still require manual selection in LuCI. Shared MRS/fused assets are not downloaded again or refreshed.

<a id="默认行为证据"></a>
## Default-behavior evidence

Compared with pre-implementation commit `ca555e8c53cb0f1a5ea6753c11e0d601f0f6568d`:

- Complete structures were identical for the raw graph of 401 providers / 860 rules and the Mihomo-normalized graph of 525 providers / 984 rules.
- Nine default full-output cases across three Mihomo JS scripts were identical; existing off / policy / adaptive capture, application, and report golden fixtures were unchanged.
- Shared rule-payload fingerprint remained `416754f307ca6319793458ccf65141196a3ee9a47985ff32e2168c112975235e`; parsed Egern YAML configuration structures matched.
- Ordered semantic auditing confirmed unchanged provider payloads and rule order: zero changed entries and routes. This conclusion comes from structural equality; finite domain probes alone do not prove equivalence for all domains/IPs.

<a id="验证结果"></a>
## Validation results

- Strict artifact contracts passed 2500 checks / 22 artifacts, including Ruby YAML parsing. The old secondary `OpenClash(mihomo).conf` version notice remains.
- Real QuickJS completed twenty-one default-script full-output comparisons. Sixteen additional real-engine service-profile tests passed, including reference identity, unchanged input on rejection, and the AEROVE clone boundary.
- Nineteen service-generation tests passed, covering safety-rule closure, node chains, write failures, hash readback, and publication races. A second write, existing directory, or symlink is rejected rather than overwritten.
- Settings actually exported from the offline form were read back through the CLI. Lite generated 133 files with per-file hash verification. Two SingBox outputs passed checks with official cores 1.14.3 and 1.13.14 respectively.
- Of 672 full local regressions, initially 662 passed, eight were skipped, and two failed. Both failures came from fixed-title assumptions in old AI-sandbox fixtures. After replacing the unique H1 in place, all thirty-four combined follow-up parameter, engine, and fixture regressions passed. Earlier passing results were reused only where inputs had not changed.
- The eight skips were optional native-core cases: seven Mihomo MRS cases and one Meow App/core combination. They were not counted as passes. AEROVE asset generation and budget contracts were checked separately.
- Node-DNS JS/Ruby comparisons, adapter synchronization, JS overrides, the direct-routing process allowlist, service DNS/traffic parameter synchronization, Karing/Meow generation, rule quality, and service dependencies passed.
- Twenty-one entry documents passed desktop light/dark and 390px rendering checks; the configuration form and guide also received actual visual and interaction checks. New entries had no horizontal overflow. Historical external attachment images were outside the local allowlisted server.

Tests, generation, and batch operations ran in hidden Windows windows at Idle priority. Detailed local logs are in ignored directory `.cache/myclash-adoption/`; test downloads and local settings are not committed. The temporary preview listened only on 127.0.0.1, served allowlisted static files, and was closed after acceptance.

<a id="验收边界"></a>
## Acceptance boundaries

Real QuickJS, core configuration checks, and generation contracts do not replace per-app device import, real connections, or performance benchmarks. Disabling services preserves required safety residual predicates; some native AND predicates must remain whole, explicitly marked `preserved-safety-residual` in manifests. Reduced counts are not claimed to equal actual memory or battery savings.

See [local parameters and service profiles](../configuration.md). Post-release commits, remote pointers, and CI status require delivery readback.
