<a id="karing-官方兼容性依据"></a>
# Official Karing compatibility evidence

**English** | [简体中文](REFERENCE-Karing.zh-CN.md)


> Updated on 2026-11-09: Issue #196 was reviewed against official main `accbdfc05a999eaa3526aadb0aea994b3eafb7f5` (2026-11-05, source version 1.2.26+2922) and the last public custom-import implementation. The current importer remains unpublished; a JSON fix for 1.2.25.2802 cannot be claimed.

> Reviewed on 2026-10-28: only GoogleFCM moved from downloads/updates to Google services. [Karing routing](https://karing.app/app-manual/diversion) was rechecked. App-managed selection and domain-probing boundaries remain; service-target labels are not imported selectors. DNS, fake-IP, sniffing, other push services, and node groups were unchanged. No fields, minimum versions, or device-pass claims were added.

> Retrieved on 2026-10-24. Karing main was `60cfb75daaabd179305a1e6c5201c35c91a63cf2` (2026-10-23), source version `1.2.26+2911`. Latest stable release then was `v1.2.25.2802` (2026-09-10).
> This adapter is not device certification for these versions. Karing and the same team’s Mihomo client Clash Mi are separate apps.

<a id="当前官方文档"></a>
## Current official documentation

- [Add profiles](https://karing.app/app-manual/add-profiles): accepts Clash, sing-box, and other subscription/configuration inputs.
- [Clash compatibility](https://karing.app/clash): DNS is app-managed, not configured by subscription URL; advanced policy capabilities differ.
- [Custom routing](https://karing.app/tutorial/custom-diversion): remote Rule Sets use `.srs` / `.json`.
- [Custom group editing](https://karing.app/app-manual/diversion-rule-edit): single-level OR/AND per component; platform capabilities include ports, domains, processes, and Android package names.

<a id="当前源码可证实的入口"></a>
## Entry points established by current source

Pinned repository paths and interfaces:

- [`lib/screens/diversion_group_custom_screen.dart` L296](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/lib/screens/diversion_group_custom_screen.dart#L296): selects JSON separately, invokes `DiversionCustomRules.getFromFile()`, and opens import confirmation. `exportRules()` from L367 exports `diversion_rules_custom.json`.
- [`lib/screens/diversion_rules_custom_set_screen.dart` L207](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/lib/screens/diversion_rules_custom_set_screen.dart#L207): accepts only direct/block/urltest/currentSelected constants; other actions become `kNone` on confirmation. L247 calls `importRules()`. Generated actions therefore cannot contain service node-group names.
- [`lib/screens/diversion_group_custom_edit_screen.dart` L1178](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/lib/screens/diversion_group_custom_edit_screen.dart#L1178): the custom Rule Set editor strictly requires HTTPS and `.srs`/`.json`; L1252 onward records binary/source by extension. This does not establish whether the unpublished subscription parser has separate MRS conversion.
- [`lib/screens/urltest_group_custom_screen.dart` L281](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/lib/screens/urltest_group_custom_screen.dart#L281): separately manages node groups, tags, and regex. Native routing JSON does not import that model together.
- [`lib/app/modules/server_manager.dart` L1717](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/lib/app/modules/server_manager.dart#L1717): node-profile import converts through `AutoConfUtils.tryConvert()` into an internal model, with routing controlled by switches. During action initialization from L1786, DIRECT/BLOCK map separately; others default to current selection. This does not prove unchanged execution of complete sing-box configuration.
- Current [`assets/datas/preset/cn.json`](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/assets/datas/preset/cn.json) and [`default.json`](https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/assets/datas/preset/default.json) show top-level `rules`, `name`, `switch`, `outbound`, and simple match fields. A minimal excerpt is stored at `tools/fixtures/karing/official-preset-excerpt.json`, with provenance documented alongside it.

<a id="未公开代码与采用的保守-schema"></a>
## Unpublished code and conservative schema

Current main lacks the called `lib/app/utils/diversion_custom_utils.dart`, `auto_conf_utils.dart`, and `singbox_config_builder.dart`. Complete current subscription conversion has therefore not been audited, and lossless full-configuration/nested-group compatibility is not claimed.

The last readable [`diversion_custom_utils.dart` (2025-05-07) L32](https://github.com/KaringX/karing/blob/e3c19f1eb1225dbd48a4862f0983b82d0af8de69/lib/app/utils/diversion_custom_utils.dart#L32) explicitly parses `name/outbound/switch/or/rule_set` and related fields. L118 reads top-level rules, L188 imports, and L317 exports. This field evidence includes historical code and may differ from later versions; app import/readback is decisive. Generation uses only this known minimal model, not fields such as network/port_range seen in newer UI without confirmed import schema.

<a id="复杂匹配的标准资产"></a>
## Standard assets for complex matches

Complex conditions use sing-box [Headless Rule](https://sing-box.sagernet.org/configuration/rule-set/headless-rule/) in standard [Source Format](https://sing-box.sagernet.org/configuration/rule-set/source-format/) version 3. It supports logical `type: logical`, `mode: and/or`, `invert`, ports, network, and process conditions. Nested `rule_set` references are forbidden, so source dependencies must be expanded exactly.

URLs, retrieval times, original binaries, and decoded/compressed hashes for five external QUIC-support SRS assets are recorded in `rulesets/source/karing-support/manifest.json`. These snapshots are actual SRS responses from those URLs, decoded by an existing standard core, not substituted with similar fused service content. Matches that cannot be expressed as headless rules stop generation instead of being silently dropped.

[Default route-rule semantics](https://sing-box.sagernet.org/configuration/route/rule/#default-fields) explains that fields of a single non-inverted default rule set may merge into the outer match. Current QUIC source-domain fields and outer port/network fields do not overlap, so AND expansion is equivalent. Future overlap between inner/outer domain/IP, port, or other field groups explicitly fails generation to avoid turning the original OR merge into AND.

Ordinary pure rule_set references retain their URLs; complex-condition assets are generated under `rulesets/generated/karing/`. no-resolve/pre-resolution differences, actual app download paths, and precedence require client readback, not merely successful schema compilation.

<a id="issue-196自定义组可见但远程资产未登记"></a>
## Issue #196: custom groups visible, remote assets unregistered

The current official [edit/save path L1252–1264](https://github.com/KaringX/karing/blob/accbdfc05a999eaa3526aadb0aea994b3eafb7f5/lib/screens/diversion_group_custom_edit_screen.dart#L1252-L1264) creates a `type=remote`, `tag=URL`, `format=binary/source`, `url=URL` entry for each URL and registers it in `ruleSetItems`. Reports that opening and immediately saving each group triggers downloads are consistent with that registration action.

The last public [importRules L188–314](https://github.com/KaringX/karing/blob/e3c19f1eb1225dbd48a4862f0983b82d0af8de69/lib/app/utils/diversion_custom_utils.dart#L188-L314) copies URLs into groups without equivalent registration. Its top-level parser consumes only `rules`; `rule_set_items` in internal [DiversionGroupConfig L198–258](https://github.com/KaringX/karing/blob/accbdfc05a999eaa3526aadb0aea994b3eafb7f5/lib/app/modules/server_manager.dart#L198-L258) belongs to another model and cannot simply be inserted into custom-import JSON and declared a fix. Current full-configuration conversion is also unpublished, and no verified bulk alternative was found.

The repository preserves URLs, order, and actions while marking the client-registration boundary. Affected clients currently activate each group by saving it as described in README. Changing mirrors, recompiling SRS, silently expanding rules, or restoring a whole-app backup is not a verified fix for this registration gap. A permanent fix belongs in Karing’s import transaction: register remote assets and save, then validate actual app import, downloads, restart, and repeated import.

`tools/audit-karing-registration.js` checks the four registration fields in a **copy** of existing internal configuration. It neither writes configuration nor downloads rules. Success proves corresponding registry entries only, not downloads or matching. Ordinary custom exports lack the registry and are rejected as evidence.
