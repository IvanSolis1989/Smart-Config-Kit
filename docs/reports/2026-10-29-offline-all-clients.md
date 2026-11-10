<a id="全端离线配置表单验收"></a>
# All-client offline configuration form acceptance

**English** | [简体中文](2026-10-29-offline-all-clients.zh-CN.md)


Form tool v1.3.0 connects the existing twenty maintained entries to client selection, Full/Lite/Custom, and client-specific parameter downloads. Rule authorities, released client versions and default artifacts, and shared fused/MRS assets remain unchanged. This release delivers an offline tool, not new app support or a claim of real-connection acceptance.

<a id="实现与复用"></a>
## Implementation and reuse

`offline-configuration-export.js` consumes the existing entry inventory, source-graph service plan, and attachment closure. Pure platform functions were extracted into `business-profile-platform-core.js` and shared by CLI and browser; the Node side retains the Ruby YAML adapter. Optional YAML uses JSON-compatible YAML, read back during builds by an independent Ruby parser. The [YAML 1.2 specification](https://yaml.org/spec/1.2.2/) defines JSON compatibility. Default Full still exports the released text directly in LF form.

`offline-client-options.js` compiles parameter slots or finite presets from existing runtimes and native adapters without executing configurations. The three desktop JS entries retain five options; AEROVE retains app-managed DNS/off; OpenClash retains four existing defaults and environment-variable precedence. Native clients receive only existing field mappings. Egern and QX limitations are explained on the page; no invalid switches are generated.

The browser only decompresses trusted snapshots, assembles text, and downloads files. Single files retain native extensions and include the service-profile name. Multi-file ZIPs retain Passwall manual lists, AEROVE original-byte shards/budgets, and applicable provenance manifests. Modified configurations do not carry default adapter manifests falsely asserting that original configuration hashes remain valid. Complete OpenClash scripts use fixed custom-file entry points and retain the original tutorial’s backup, file-permission, and core-verification requirements.

ZIP support reuses [fflate 0.8.3](https://github.com/101arrowz/fflate). The official npm package was checked against SHA-512 SRI; source, version, and license are in `tools/vendor/fflate/`, and the full MIT license is embedded in HTML. Only synchronous compression/decompression and ZIP APIs are used: no runtime CDN, worker, network, or user-script execution.

<a id="验证证据"></a>
## Validation evidence

- Eighty outputs from the pre-refactor platform implementation at `5f57c598e34226da50d7cf835b99ec52f3e27426` were frozen: twenty entries × Full, Lite, Custom (AI/YouTube), and empty Custom. All new-tool comparisons passed. Twenty Full outputs were exact LF text; other profiles were compared by native structures or exact projections, with OpenClash shell outside YAML checked separately.
- Parameter regressions passed 8/8, including invalid types/unknown fields/getters, AEROVE DNS locking, OpenClash ENV precedence and decimals, missing Node-DNS capabilities, uniqueness of each QUIC guard, and rejection of trusted-source drift. WeakMap binds existing source references rather than embedding large configurations twice.
- Six export-core basics, profile filenames, and targeted mixed-parameter checks across six representative formats passed. Shared service-profile and real-QuickJS runtime regressions passed 35/35 without skips, covering in-place identity, independent candidates, proxy chains, safe rejection, atomic publication, and concurrency protection.
- Strict artifact contracts passed 2500 checks / 22 artifacts, alongside three JS overrides, PROCESS-NAME, Karing, and README visual assets. The existing secondary OpenClash `.conf` baseline notice remains; the primary `.sh` remains authoritative.
- Actually generated sing-box 1.14 Custom and 1.13 Lite configurations, both combining power-saving tests with follow-rules, passed the corresponding official core `check`.
- Six changed entry documents received eighteen actual desktop-light, desktop-dark, and 390px renders, with no page-level horizontal overflow and 110 existing local links. Existing remote attachments were outside the local preview allowlist. Tests and generation used hidden windows at Idle priority.
- Seven form-UI regressions covered 20×4 downloads, actual ZIP extraction, per-client parameter state, invalid numbers and recovery, paths, and licenses. After freezing the final backend, the form was regenerated and passed `--check`, default-filename, and cross-client-state targeted checks. HTML size was 16,797,827 bytes; the decompressed trusted bundle was 47,914,901 bytes.
- A real browser read back twelve downloads containing seventy-three files, including JS/YAML/JSON/conf/shell and Passwall/Karing/AEROVE ZIPs. Every content file and binary attachment matched the generator byte for byte. Three actual FlClash Full/Lite/Custom downloads each completed seven Node/QuickJS scenarios, twenty-one full comparisons total. Mobile-layout downloading succeeded. Network-request events remained zero during selections, tab changes, generation, and downloads.
- The form passed full-page desktop-light, desktop-dark, and 390px Custom-service checks without page-level horizontal overflow. Native badInput was actually rejected; correcting input allowed downloads. The delivery page was reopened with all client parameters at defaults, without retaining nondefault test selections.

Detailed local evidence is in ignored directories `.cache/offline-all-clients/`, `.cache/offline-configuration-20261029/`, and targeted parameter/UI test logs. Download samples and user configurations are not committed.

<a id="兼容性核对与边界"></a>
## Compatibility review and boundaries

The review read [Mihomo interval/lazy](https://wiki.metacubex.one/config/proxy-groups/), [Stash group fields](https://stash.wiki/en/proxy-protocols/proxy-groups), [Surge block-quic](https://manual.nssurge.com/profile/general.html), [Loon UDP ports](https://nsloon.app/docs/General/), [the official QX sample](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf), [sing-box urltest](https://sing-box.sagernet.org/configuration/outbound/urltest/), [Egern native groups](https://egernapp.com/docs/configuration/policy_groups/), [Karing custom routing](https://karing.app/en/tutorial/custom-diversion), and [Meow native YAML](https://meow-rs.github.io/meow-rs/guide/guide/configuration). No capability changes affecting these existing field mappings were found. Shadowrocket’s official help site was still unreadable during this review; the maintained limited mapping was retained without claiming new official compatibility evidence.

SR/Surge all-proxy behavior, Loon’s treatment of all UDP/443, QX background testing, and sing-box intervals are explained according to their actual behavior, not described as equivalent cross-client performance optimizations. Egern QUIC requires rebuilding native assets, so no independent switch is provided here. Karing is rules-only, Xray is three-outbound routing only, Passwall still requires the matching backend and LuCI targets, and Meow/AEROVE app acceptance remains separate.

Offline refers to configuration generation. Remote rules and node assets are still downloaded as configured after import. The final main pointer, worktree, and CI require post-release readback.
