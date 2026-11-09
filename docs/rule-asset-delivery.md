<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-rule-asset-delivery-mobile.svg">
  <img src="assets/readme/page-rule-asset-delivery.svg" width="100%" alt="Technical guide">
</picture>

<a id="融合规则资产分发切换至-github-raw-https"></a>
# Fused rule-asset delivery: migration to GitHub raw HTTPS

**English** | [简体中文](rule-asset-delivery.zh-CN.md)

Understand GitHub raw delivery for fused assets and verify the complete content at actual configuration URLs. Start with download validation; historical failure evidence and receipts are expandable below.

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="Downloads"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="Documentation"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="Checks and troubleshooting"></a>
</p>

[Downloads](guide/downloads.md) · [Documentation](README.md) · [Checks and troubleshooting](guide/dns-and-verification.md)

<a id="使用入口"></a>
## Entry points

1. Confirm that the client uses its own native remote-rule syntax.
2. Run the validator under “Download validation and acceptance boundaries” with the machine’s actual proxy port.
3. Read back complete-download/hash receipts. Validate client import and runtime separately.

<a id="本次变更边界"></a>
## Change scope

v6.0.19 changed runtime URLs for repository-owned generated rule assets to `https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/...`.

Native client URL fields/rule syntax, asset formats, rule contents, policy targets/order, and the `?scki=v6.0.19` cache marker were retained. This changed delivery addresses, not routing policy.

Empty-content references were handled by platform capability. `scki-fused-019-work.list` contains only a newline, so its empty `RULE-SET` reference was removed from Shadowrocket, Loon, and Quantumult X. Surge’s corresponding four `PROCESS-NAME` rules have actual content and were retained.

The generator removes only unsupported or content-free remote references. Original payloads and effective policy order are unchanged. In v6.0.19 configurations, remote fused-rule line counts are Shadowrocket 77, Surge 78, Loon 77, and Quantumult X 77.

Count other clients from their own effective configurations rather than extrapolating these figures.

Xray/v2rayN outputs flatten rules into local configuration and have no runtime remote `.srs` URL. Version metadata can advance with a release, but there is no URL to migrate.

<a id="客户端语法与官方依据"></a>
## Client syntax and official references

<a id="shadowrocket"></a>
### Shadowrocket

- **Current native syntax**: `RULE-SET,<URL>,<policy>`.
- **Evidence and review limits**: the repository’s [Shadowrocket reference](../独立内核系/Shadowrocket/REFERENCE-shadowrocket.md) records this syntax. Official help site `help.shadowrocket.net` was unavailable during this review, so HTTPS support was not freshly reconfirmed from that official page.

<a id="surge"></a>
### Surge

- **Current native syntax**: `RULE-SET,<URL>,<policy>`.
- **Evidence and review limits**: the [official Rule Set manual](https://manual.nssurge.com/rules/ruleset.html) explicitly permits `http://` or `https://` external resources and provides URL-based `RULE-SET` examples.

<a id="loon"></a>
### Loon

- **Current native syntax**: URL entries under `[Remote Rule]`.
- **Evidence and review limits**: the [official example configuration](https://github.com/Loon0x00/LoonExampleConfig/blob/master/example.conf) contains HTTPS raw GitHub URLs. The official LoonManual repository is <https://github.com/Loon0x00/LoonManual>; its Remote Rule manual text could not be fetched during this review, so evidence is limited to the official example.

<a id="quantumult-x"></a>
### Quantumult X

- **Current native syntax**: URL entries under `[filter_remote]`.
- **Evidence and review limits**: the [official URL Scheme](https://github.com/crossutility/Quantumult-X/blob/master/url-scheme.md) shows HTTPS raw GitHub URLs in `filter_remote`; the [official sample.conf](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf) is also available. Specific line parameters come from the community [filter_remote guide](https://qx.atlucky.me/shi-yong-fang-fa/pei-zhi-wen-jian-xiang-jie/filter-fen-liu-gui-ze/filterremote-yuan-cheng-fen-liu-gui-ze), which is not labeled an official manual.

<a id="clash-partycmfaopenclashflclash"></a>
### Clash Party, CMFA, OpenClash, FlClash

- **Current native syntax**: `type: http` and `url` in Mihomo `rule-providers`; rules reference provider names through `RULE-SET`.
- **Evidence and review limits**: [official Mihomo rule-provider documentation](https://wiki.metacubex.one/en/config/rule-providers/) requires `url` for `type: http` and demonstrates HTTPS raw URLs. [Routing-rule documentation](https://wiki.metacubex.one/en/config/rules/) describes provider-name `RULE-SET`. All four clients consume these Mihomo fields.

<a id="stash"></a>
### Stash

- **Current native syntax**: `rule-providers.<name>.url`; `RULE-SET,<name>,<policy>`.
- **Evidence and review limits**: [official Rule Sets documentation](https://stash.wiki/en/rules/rule-set) provides remote-provider HTTPS examples and name-based `RULE-SET` references.

<a id="egern"></a>
### Egern

- **Current native syntax**: `rule_set`, with the URL in `match`.
- **Evidence and review limits**: [official Rules documentation](https://egernapp.com/docs/configuration/rules/) demonstrates HTTPS remote sets and supports `update_interval`.

<a id="sing-box"></a>
### sing-box

- **Current native syntax**: `type: remote`, `format`, and `url` in `route.rule_set[]`.
- **Evidence and review limits**: [official rule-set documentation](https://sing-box.sagernet.org/configuration/rule-set/) defines the remote `url` download field. Current official documentation does not explicitly restrict URL schemes; no additional scheme constraint is claimed here.

<a id="passwallpasswall2"></a>
### Passwall, Passwall2

- **Current native syntax**: `rule-set:remote:<URL>` in `domain_list` / `ip_list`.
- **Evidence and review limits**: official parser sources are [Passwall](https://github.com/Openwrt-Passwall/openwrt-passwall/blob/main/luci-app-passwall/luasrc/model/cbi/passwall/client/shunt_rules.lua) and [Passwall2](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua). The repository’s existing Passwall REFERENCE records HTTPS `.srs` syntax. Parser implementation lines were not independently fetched during this review to establish scheme restrictions, so none are additionally claimed.

This evidence supports retaining existing URL fields/rule structures while changing the URL host; no client fields were added. Valid syntax does not guarantee raw GitHub reachability on every network. Import/refresh may require a working proxy.

<a id="用户恢复步骤"></a>
## Recovery steps

1. Through a working network route or proxy, import the [repository’s Shadowrocket configuration](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/Shadowrocket.conf).
2. Replace old copies containing the retired `a1/fin.txt` reference, then refresh rules. Do not keep using a jsDelivr import URL for the new configuration.
3. If direct GitHub raw access fails, use a working proxy. Another jsDelivr domain for the same repository does not bypass the observed repository-level package limit.

Current `main` configuration/source no longer contains retired DoingDog `a1/fin.txt`. Do not reintroduce it or treat a3/a4 as equivalent replacements.

The root README uses relative directory entry points without repository-owned jsDelivr import URLs. FlClash’s jsDelivr fallback import link was removed. Passwall/Passwall2 examples and actual generated rules both use raw URLs.

<a id="下载验证与验收边界"></a>
## Download validation and acceptance boundaries

The local validator checks HTTP status, nonempty responses, and content hashes for actual Shadowrocket `RULE-SET` URLs:

```powershell
node tools/verify-rule-asset-downloads.js --timeout 60 --output .cache/issue-186/download-check.json
```

curl does not automatically inherit Windows WinINET system-proxy settings. When needed, explicitly supply an existing HTTP proxy port; this does not change system proxy settings or client-node selection. The investigated host’s existing port was `33966`:

```powershell
node tools/verify-rule-asset-downloads.js --proxy http://127.0.0.1:33966 --timeout 60 --concurrency 1 --deadline 600 --output .cache/issue-186/download-check-final.json
```

Use the actual HTTP proxy port on other machines. Request/connection timeouts, whole-batch deadlines, and bounded retries are controlled separately. Transport errors take precedence over empty-body classification so erroneous HTTP 200 responses are not omitted from retries. Proxy credentials are excluded from reports; full-byte and content-hash acceptance requirements remain unchanged.

See the [official curl manual](https://curl.se/docs/manpage.html#--proxy) for option semantics.

Success counts and failures must come from the completed validator’s saved `.cache/issue-186/download-check.json`; do not report counts before reading it back. Successful downloads do not establish Shadowrocket device import or runtime routing. Publication status depends on commits and remote refs, not this document.

<details>
<summary>2026-10-15 download batches and gap-closure receipts</summary>

<a id="本次本地验收记录2026-10-15"></a>
### Local acceptance record (2026-10-15)

- Strict artifact contracts passed 2483 checks across 19 outputs. Budgets passed for 599 unique remote assets and 13 client aggregates. Official OpenClash `.sh` outputs passed; the preexisting version notice for the old fallback `.conf` remained.
- Regressions for URL recognition, empty references, HTTP downloads, provenance receipts, frozen payloads, routing, and health-check options passed. Independent review found no blocking code issue.
- Rule payloads in `fused/clash`, `mihomo`, `sing-box`, `surge`, and `quantumultx` had no Git content differences. Source-semantic comparison reported `hasChanges=false`; before/after identity was `d14fc2b9e003ad430e478ec406e117809768e2341552bdcebfa1f945a61e4821`. Upstream providers were not refreshed; existing MRS/SRS were reused with generator source/payload gates enabled.
- Online batch at 2026-10-15 07:13 JST: of 77 actual Shadowrocket URLs, 76 completed full GET with matching hashes. The ad file returned HTTP 200 but Schannel disconnected early, so the batch failed. The failure remains in `.cache/issue-186/download-check.json`.
- A first bounded 60-second diagnostic of the same ad URL also ended early after 7,334,016 / 12,467,261 bytes; the built-in browser returned `ERR_CONNECTION_CLOSED`. These failed records were retained, not relabeled successful.
- Without the query, the ad URL returned all 12,467,261 bytes through two curl paths, SHA-256 `d0d6471c50becf0e508d494758b60a24b7ee32a103677e426c9d76457bb2fa49`, matching the local LF-normalized hash. Headers matched and both URL forms hit cache; evidence did not establish the query as the cause. This comparison neither overwrote/replaced actual-config URL failures nor relaxed hash requirements.

<a id="完整下载缺口闭合2026-10-15"></a>
### Complete-download gap closure (2026-10-15)

- Investigation found the tool had not passed the enabled system HTTP proxy to curl, which used another fake-IP/TUN path. The actual query URL downloaded fully through the existing HTTP proxy in 16.66 seconds, exceeding the old hardcoded 15-second request limit. The successful comparison is in `.cache/issue-186/download-check.ad-transport-success.json`.
- After explicit-proxy, configurable-timeout, connection-limit, and empty-body transport-classification fixes, the first complete scan achieved 72/77. One bounded serial retry batch covered only the five failures; all five completed full GET with matching hashes on their first supplementary attempt. Files as small as 148/260 bytes had also disconnected or hit CONNECT timeouts, so evidence did not support “the ad file is too large” or “queries always fail.”
- The complete receipt records **77/77, 100%, zero hash mismatches** in `.cache/issue-186/download-check-complete.combined.json`. It combines first-pass successes with explicitly listed supplementary checks at different times, preserving each timestamp; it must not be described as one scan. Original failures and five supplementary files remain.
- The full ad response was 12,467,261 bytes, SHA-256 `d0d6471c50becf0e508d494758b60a24b7ee32a103677e426c9d76457bb2fa49`. Actual `?scki=v6.0.19` was retained, without removing queries, assembling Range responses, ignoring TLS errors, or relaxing hash acceptance.

Acceptance covers full downloads and content consistency at actual configuration URLs. Release status depends on Git commits, remote refs, and online configuration readback. This URL validation is not Shadowrocket real-device runtime evidence.

</details>

<a id="issue-与故障证据"></a>
## Issue and failure evidence

<details>
<summary>Issue #186 investigation and source evidence</summary>

[Issue #186](https://github.com/IvanSolis1989/Smart-Config-Kit/issues/186) reported failure to retrieve repository fused assets through jsDelivr. Findings:

- On 2026-10-15, jsDelivr data API returned HTTP 403 with `Package size exceeded configured limit of 50 MB`; the `ad` asset on Fastly returned 404 with `Failed to fetch repository`.
- The same GitHub raw file returned HTTP 200 and 12,467,261 bytes. Tracked repository Git blobs totaled 206,938,573 bytes.
- jsDelivr’s [published restrictions](https://github.com/jsdelivr/jsdelivr#restrictions) list 150 MB packages and 20 MB files. Those public limits do not erase the actual API’s 50 MB configured threshold. Splitting files below 20 MB does not solve a repository-level limit.
- DoingDog retired a1/a2 in upstream commit [`dd2c83d`](https://github.com/DoingDog/rconvert/commit/dd2c83d42a7b9aa3f5a01d62f414cd2a2edfc5be) on 2026-09-28. Configuration/source at main commit `2b33b29` already excluded DoingDog. a3/a4 are not equivalent to the retired sources and were not reintroduced by this fix.

</details>
