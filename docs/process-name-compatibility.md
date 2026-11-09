<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-process-name-mobile.svg">
  <img src="assets/readme/page-process-name.svg" width="100%" alt="Technical guide">
</picture>

<a id="process-name-兼容清单与测试集"></a>
# PROCESS-NAME compatibility list and tests

**English** | [简体中文](process-name-compatibility.zh-CN.md)

Check the scope of process-based routing for local tools and whether each client can actually match it. The maintenance section retains the inventory and validation command.

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="Downloads"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="Documentation"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="Checks and troubleshooting"></a>
</p>

[Downloads](guide/downloads.md) · [Documentation](README.md) · [Checks and troubleshooting](guide/dns-and-verification.md)

<a id="使用入口"></a>
## Entry points

1. Confirm the process, operating system, and target policy against the design principles.
2. Check client boundaries in the synchronized and unsynchronized lists.
3. After changing the inventory, run `node tools/validate-process-name-direct.js`.

This inventory maintains the local-tool direct-routing allowlist, covering remote control, tunneling, DDNS, P2P mesh, database clients, and related tools. Its reference is the local-tool direct-routing section of YaNet’s `global_script.js`:

- https://github.com/dahaha-365/YaNet/blob/main/Mihomo/global_script.js#L162-L186

<a id="设计原则"></a>
## Design principles

- Main rules use exact `PROCESS-NAME` only, not broad patterns such as `PROCESS-NAME-REGEX,(?i).*vpn.*` / `.*vnc.*`.
- Desktop systems take priority: Windows uses `.exe`; macOS / Linux use process names without extensions.
- `WorkPro.exe` and `WorkProWebProcess.exe` are repository-maintained exceptions for Windows business clients. They remain in the `DIRECT` allowlist with regression coverage; do not bypass the rule engine with TUN `exclude-process`.
- Mobile package names are not added to main rules unless the relevant client path has been verified both to import without errors and to match correctly.
- Router-side Passwall / Passwall2 do not carry this inventory because they cannot see LAN clients’ process names.
- RustDesk is an exception: public relay/API traffic belongs to `🧑‍💼 会议协作` (meetings and collaboration), not the `DIRECT` allowlist. LAN/private-IP connections still use direct private-address rules.

<a id="官方兼容依据"></a>
## Official compatibility references

- Mihomo `PROCESS-NAME` supports process names and Android package names: https://wiki.metacubex.one/en/config/rules/#process-name
- sing-box `process_name` supports Linux / Windows / macOS only. Android requires the separate `package_name` field; this revision does not mix the two: https://sing-box.sagernet.org/configuration/route/rule/#process_name
- Surge `PROCESS-NAME` applies only to Surge Mac; Surge iOS ignores it: https://manual.nssurge.com/rule/process.html

<a id="已同步的产物"></a>
## Synchronized outputs

<a id="clash-party--mihomo-party--clash-verge-rev"></a>
### Clash Party / Mihomo Party / Clash Verge Rev

- **Mapping**: `PROCESS-NAME,<name>,DIRECT` + RustDesk → `🧑‍💼 会议协作`
- **Scope**: primary desktop consumers.

<a id="flclash"></a>
### FlClash

- **Mapping**: `PROCESS-NAME,<name>,DIRECT` + RustDesk → `🧑‍💼 会议协作`
- **Scope**: matches on Windows/macOS/Linux; Android does not depend on this inventory.

<a id="cmfa-yaml--clashmi"></a>
### CMFA YAML / ClashMi

- **Mapping**: `PROCESS-NAME,<name>,DIRECT` + RustDesk → `🧑‍💼 会议协作`
- **Scope**: imports without error on Android; desktop ClashMi can match it.

<a id="openclash-normal--smart"></a>
### OpenClash Normal / Smart

- **Mapping**: syntax synchronized.
- **Scope**: normally no actual matches on a router; retained for consistent rule structure.

<a id="sing-box-full"></a>
### sing-box Full

- **Mapping**: converted to `process_name` by the generator.
- **Scope**: local tools use `DIRECT`; RustDesk uses `🧑‍💼 会议协作`.

<a id="surge"></a>
### Surge

- **Mapping**: `PROCESS-NAME,<name>,DIRECT` + RustDesk → `🧑‍💼 会议协作`
- **Scope**: matches in Surge Mac; Surge iOS ignores process rules.

<a id="未同步为主规则的产物"></a>
## Outputs not synchronized as main rules

<a id="shadowrocket"></a>
### Shadowrocket

- **Reason**: the iOS path does not support the process matching required here.

<a id="loon"></a>
### Loon

- **Reason**: this repository’s Loon output targets iOS, without a desktop process-matching path.

<a id="quantumult-x"></a>
### Quantumult X

- **Reason**: this repository’s QX output targets iOS, without a desktop process-matching path.

<a id="v2raynxray-核"></a>
### v2rayN (Xray core)

- **Mechanism**: Xray RuleObject `process`.
- **Additional scope**: can match only on the local Windows / Linux machine; the fused fallback already carries `WorkPro.exe -> direct`.

<a id="passwall--passwall2"></a>
### Passwall / Passwall2

- **Reason**: an OpenWrt router cannot see LAN clients’ process names.

<a id="维护入口"></a>
## Maintenance

- Inventory: `tools/fixtures/process-name-direct-tools.json`
- Validation: `node tools/validate-process-name-direct.js`

The validator checks:

- The Mihomo desktop inventory is included in Clash Party / FlClash / CMFA / OpenClash.
- RustDesk processes use `🧑‍💼 会议协作`, not `DIRECT`.
- The Surge Mac inventory is included in Surge.
- The SingBox Full generator emits `process_name -> DIRECT` for local tools and `process_name -> 🧑‍💼 会议协作` for RustDesk.
- Shadowrocket / Loon / QX / v2rayN have not accidentally gained active process rules.
