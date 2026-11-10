<!-- Full English translation of the historical record. -->

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Clash Party changelog" width="100%">
</picture>

<a id="clash-party--变更日志"></a>

# Clash Party — Changelog

> Records changes to the Clash Party JS override scripts.
> The authoritative rule source moved to `rulesets/source/routing-graph.js`; Clash Party is a client output consuming the final fused rule sets.
>
> Major-version changes must propagate to the subversions of every affected output.

---

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [Back to README](../../README.md) · [Documentation center](../../docs/README.md)

<a id="同步工具anti-ad-官方-git-输入恢复-2026-11-09"></a>

## Configuration form 1.5.1 (2026-11-10)

- Fix shared configuration-page mobile overflow with wrapping, shrinkable grids and bounded controls. Check every client in both languages across local parameters, custom services and advanced downloads.
- This is a presentation-only form patch; client scripts, routing, DNS and exported option semantics are unchanged.

## MiMo fallback diagnostics v1.0.1 (2026-11-09)

- Add fixed diagnostic categories and bounded numeric HTTP status to fallback CI logs. Provider messages, request IDs, credentials, issue contents and model replies are excluded.
- Distinguish response-language validation from provider failures without relaxing validation. Preserve existing terminal-claim deduplication, public notices and retry policy.
- Issue #195 run 42553809624 confirmed the fallback ran but recorded only `failed`; the original failure subtype cannot be recovered from those logs. This change does not claim that issue has been answered or repaired.
- Routing, DNS, client artifacts and existing public comments are unchanged. Local tests cover diagnostic sanitization and single-comment terminal handling; no live model request was made.

## Synchronization tools: restoring the official anti-AD Git input (2026-11-09)

- Switched the fusion-stage `anti-ad` text source from a website endpoint intermittently returning HTTP 403 to the official repository's same-format `anti-ad-clash.yaml`. Domain semantics, advertising policy and client defaults remained unchanged; empty lists or old caches did not conceal download failures.
- The [pinned official README](https://github.com/privacy-protection-tools/anti-AD/blob/2b83ce2de8e7d217385da1cee42dcaa2ea3f08f6/README.md#L19) listed both endpoints. Actual downloads on 2026-11-09 were each 2,793,901 bytes and 103,068 domain rules, with identical SHA256 `fbba61f1772422c1e83a8306e9cfafd10b8028e39dc84cfa18f173a7ced06942`. This was snapshot evidence, not a guarantee of future simultaneous updates or reachability on every network.
- Git downloads retained resolved-commit, pinned-commit fallback and byte-receipt verification. Added the official Git source's MIT declaration while retaining `component-review-required`; a repository license was not extended to all aggregated data. No upstream rule refresh occurred in this change; weekly synchronization results required separate verification.

<a id="配置工具-v144-与客户端导入排障-2026-11-09"></a>

## Configuration tool v1.4.4 and client import troubleshooting (2026-11-09)

- Regenerated the offline configuration wizard so downloads included the QX.14 fix. Scheduled synchronization rebuilt and checked the wizard before freezing a release batch, preventing Pages/client artifact drift.
- Karing adapter karing.3 documented SRS registration limitations after custom-rule import and supplied a read-only registration audit. Rule semantics were unchanged; this did not replace physical-device application acceptance. See the Karing directory changelog.
- Maintenance automation: MiMo's reply-only fallback after Codex failure ran independently, retaining identity verification, task deduplication and bounded recovery.

<a id="quantumult-x-导入修复-qx14-2026-11-07"></a>

## Quantumult X import fix QX.14 (2026-11-07)

- Corrects QX mode-trigger syntax and reverse-validation rules; shared routing rules and Clash Party outputs are unchanged. See the [Quantumult X changelog](../../独立内核系/Quantumult%20X/CHANGELOG.md).

## v6.0.21-dns.25 / v6.0.21-normal.25 (2026-10-31)

- Issue #193: Adds `SCKI_BROWSER_UDP_POLICY` / `browserUdpPolicy`, default `off`. When Windows users explicitly choose `reject`, it rejects all Chrome, Edge, and Firefox UDP before existing routing, preventing UDP/19302 and other STUN ports from being allowed by compatibility direct rules or QUIC service exceptions.
- Reuses trusted local parameters, atomic saves, backups, and readback; supports online/offline form v1.4.3 and `--browser-udp`. Updates retain local choices; sources lacking the capability cannot enable it or silently downgrade. Subscriptions and environment variables cannot enable it.
- Default providers/rules, 55 groups, DNS, and STUN/TURN compatibility direct routing remain unchanged; shared MRS/SRS semantics do not change. FlClash is synchronized; AEROVE Lite explicitly excludes this desktop capability, and other native entry points do not expose it. Source-binding manifests are regenerated without changing native configuration behavior.
- This option covers only those three Windows browser processes correctly identified by traffic entering the core. HTTP/3 and UDP calls may fail or fall back; it does not disable all WebRTC. Device retesting remains necessary; existing screenshots prove only that the reported connection was direct.

<a id="配置工具-v142-2026-10-29"></a>

## Configuration tool v1.4.2 (2026-10-29)

- Added Full / Lite / Custom English names to service-profile options. Defaults, generation and client scripts remained unchanged.

<a id="配置工具-v141-2026-10-29"></a>

## Configuration tool v1.4.1 (2026-10-29)

- The form displayed latency, QUIC, ZeroTier and node-DNS options/summaries as Chinese labels with original English values. Text only; scripts, values and safety boundaries were unchanged.

<a id="配置工具-v140-2026-10-29"></a>

## Configuration tool v1.4.0 (2026-10-29)

- Added GitHub Pages configuration. Generation/download remained local without reading/uploading subscriptions; offline HTML remained available. Default client configurations and routing source were unchanged.

<a id="配置工具-v130-2026-10-29"></a>

## Configuration tool v1.3.0 (2026-10-29)

- Offline form supported 20 maintained entry points, selecting profiles/parameters according to client capabilities and downloading configuration. Default client configuration and routing source were unchanged.

<a id="离线配置表单-v121-2026-10-29"></a>

## Offline configuration form v1.2.1 (2026-10-29)

- Fixes native rejection of invalid numeric values in the FlClash offline form; shared CLI and all client defaults remain unchanged. See the [FlClash changelog](../FlClash/CHANGELOG.md).

<a id="离线配置表单-v120-2026-10-29"></a>

## Offline configuration form v1.2.0 (2026-10-29)

- FlClash's offline entry reuses shared parameter schemas and build-time trusted-constant parsing to write business profiles and local options together. Clash Party's existing CLI, safe writes, default script, and business generation are preserved. Cross-client business profiles and platform runtime capabilities are documented separately in the [configuration guide](../../docs/configuration.md).

<a id="离线配置表单-v110-2026-10-29"></a>

## Offline configuration form v1.1.0 (2026-10-29)

- Extracts the shared optional-business script generator into a pure template for CLI and FlClash offline downloads; existing Clash Party / AEROVE optional-profile semantics and default outputs remain unchanged.
- Extends only build tools and form delivery, not rules, DNS, node runtime, or default versions across clients; see the [FlClash changelog](../FlClash/CHANGELOG.md).

## v6.0.21-dns.24 / v6.0.21-normal.24 (2026-10-29)

- Adds explicit local hosts-only mode: exact active-node FQDNs to valid multiple IPs only, preserving node identity and repository-host precedence. Tampering or exceeded limits cause zero writes; default adaptive behavior and rules remain unchanged.
- All three JS scripts gain real QuickJS/Node whole-output comparisons covering node chains, multiplier boundaries, and provider input; application/system networking still requires independent acceptance.
- The unified parameter entry reuses atomic backups/readback and retains node-DNS and multiplier choices during source updates. Business full/lite/custom outputs use separate directories; source-graph services preserve safety-first rules, DNS, and reference closure, covering all current clients and capability differences.
- Default rules and shared assets for CMFA, Stash, Egern, SingBox, SR/Surge/Loon/QX, Xray, Passwall, Karing, and Meow/AEROVE remain unchanged; static clients gain no runtime Node-DNS.
- Egern source-receipt refresh fixes duplicate provenance-comment cleanup without changing default configuration semantics; see the [Egern changelog](../../独立内核系/Egern/CHANGELOG.md).
- AEROVE Lite synchronizes source bindings and application-managed DNS documentation, retaining the off placeholder and default routing; see the [Lite changelog](../../Meow内核系/Aerove%20Lite/CHANGELOG.md).

## v6.0.21-dns.23 / v6.0.21-normal.23 (2026-10-28)

- Moved Google FCM from downloads to Google services. The 15 domains, 26 IPv4 predicates, rule order and 55 groups were unchanged, as were other push services, DNS and fake-IP.
- Quality-review records bind this FCM diff to limited sample boundaries; source ledgers and dependency-coverage reports synchronize. Karing fixtures follow the source version instead of retaining an outdated baseline after upgrades.

<a id="2026-10-27--aerove-lite-原生预算修正"></a>

## 2026-10-27 — AEROVE Lite native-budget correction

- Lite-specific resources are resharded to the pinned Rust reader's expansion budget; shared rules, fused assets, and Clash Party behavior remain unchanged, with no cross-platform regeneration. See the [AEROVE Lite changelog](../../Meow内核系/Aerove%20Lite/CHANGELOG.md).

<a id="2026-10-27--aerove-lite-专属资源投影"></a>

## 2026-10-27 — AEROVE Lite-specific resource projection

- Adapts Lite's per-resource budget using independent derived MRS shards, preserving shared rules, fused assets, and Clash Party/other-client behavior without recompiling shared rules. Provenance, pinned SHA, and platform-exception evidence are in [AEROVE resource splitting](../../Meow内核系/Aerove%20Lite/RESOURCE-SPLITTING.md).

<a id="2026-10-24--meow-与-aerove-lite-客户端归档"></a>

## 2026-10-24 — Meow and AEROVE Lite client organization

- The Meow core family provides official Meow and AEROVE Lite configurations, READMEs, and references side by side with shared generation logic; authoritative rules and Clash Party behavior remain unchanged. See the [Meow core family](../../Meow内核系/README.md).

<a id="2026-10-24--meow-通用消费者"></a>

## 2026-10-24 — General-purpose Meow consumer

- Meow changes from an AEROVE-specific candidate to general-purpose JS plus official core/application native YAML; rule sources and this client's behavior remain unchanged. See the [Meow changelog](../../Meow内核系/Meow/CHANGELOG.md).

<a id="2026-10-24--aerove-lite--meow-rs-候选消费者"></a>

## 2026-10-24 — AEROVE Lite / meow-rs candidate consumer

- Adds a candidate Meow routing consumer reusing shared node classification and fused rules, with platform settings such as DNS managed by Lite; Clash Party and other production outputs are unaffected. Candidate status and pending acceptance criteria are in the [AEROVE Lite changelog](../../Meow内核系/Aerove%20Lite/CHANGELOG.md).

## v6.0.20-dns.22 (2026-10-24)

- Organized client directories by core family, retaining files/guides within client subdirectories. Rule semantics/fields were unchanged. Raw configuration URLs changed with paths, requiring reimport; shared `rulesets/` URLs remained unchanged.

<a id="2026-10-23--substore-辅助同步验收加固"></a>

## 2026-10-23 — SubStore auxiliary-sync acceptance hardening

- Independent helper extension v1.8.1 adds concurrent-failure protection for local snapshots and full-path acceptance steps; see the [SubStore changelog](../../SubStore/CHANGELOG.md). Clash Party JS, rule sources, DNS, and other client outputs are unchanged, so AGENTS.md §0.1 requires no linked regeneration.

<a id="2026-10-23--issue-187-下载域名复核"></a>

## 2026-10-23 — Issue #187 download-domain review

- `dldir1.qq.com` already reaches download policy through an exact domain in `v6.0.20-normal.20`; no ad false positive was found. Adds native-payload, Smart/Normal/FlClash download-choice, and early Windows WeChat-process DIRECT regressions without changing rules or groups.
- Q9 explains domain routing versus final egress, rule updates, and actual-match troubleshooting; complete static verification cannot replace download acceptance on the reporter's device.

## v6.0.20-dns.21 / v6.0.20-normal.21 (2026-10-20)

- Business DNS policy is centrally maintained in `rulesets/source/business-dns-policy.json`, validated against source references, then projected to Smart/Normal; group structure, node routing, and rule payloads are unchanged.
- nameserver-policy and node DNS continue to follow native Mihomo semantics; see official [DNS documentation](https://wiki.metacubex.one/config/dns/).

<a id="2026-10-20--surge-原生-vif-修复"></a>

## 2026-10-20 — Surge native VIF fix

- FIX#190: Surge `v6.0.20-Surge.12` fixes its own fake-IP pool being excluded from TUN; see the [Surge changelog](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/CHANGELOG.md). Only Surge-native fields and regression gates change; Clash Party overrides, source graph, DNS, and fused assets remain unchanged, so no cross-client regeneration is needed. Surge REFERENCE records audit boundaries.

## v6.0.20-dns.20 (2026-10-19)

- Smart JS removes unsupported `strategy: sticky-sessions`, retaining `type: smart`, LightGBM, 22 regional groups, and 33 business groups; OpenClash Smart is synchronized. Equivalent-change review found Normal/FlClash use `url-test` and other clients lack this Smart field, requiring no rule-generation changes.
- Instructions distinguish MetaCubeX Alpha from vernesong Smart and remove session-affinity promises; authoritative rules remain v6.0.20. Upstream source, cached release records, and validation are in the [version review report](../../docs/upstream/2026-10-19/mihomo/report.md).
- The same research reviewed every client REFERENCE, generated both sing-box versions, corrected Surge/QX DNS, and checked Passwall's SRS backend; cross-client impacts and pending device acceptance are in the [research overview](../../docs/upstream/2026-10-19/README.md).
- Follow-up review completes cache/core/backend CI and the 1.13 refresh checklist; README removes duplicate prose while retaining diagrams and corrects invalid configuration examples. Mainline business rules and ordinary-core behavior are unchanged.

<a id="2026-10-18--sub-store-辅助扩展-v180"></a>

## 2026-10-18 — Sub-Store helper extension v1.8.0

- Adds controlled local-content snapshot update/restore: after one temporary local fetch, each endpoint processes independently, without saving the one-time URL as a remote source. See the [SubStore changelog](../../SubStore/CHANGELOG.md). Cloud output remains available from stored content when the local machine is off, but fresh content still needs it; overrides, routing graph, DNS, and production outputs are unchanged, requiring no cross-client regeneration.

<a id="2026-10-18--sub-store-辅助扩展-v170"></a>

## 2026-10-18 — Sub-Store helper extension v1.7.0

- Supplies local raw-preview snapshots for sources confirmed blocked in the cloud, processed by Cloudflare's own pipeline within a limited lifetime. It does not upload local Fusion, and refreshing blocked sources still requires the local service. See the [SubStore changelog](../../SubStore/CHANGELOG.md). Clash Party overrides, graph, DNS, and client-output versions are unchanged; no cross-client regeneration is required.

<a id="2026-10-18--sub-store-辅助扩展-v160"></a>

## 2026-10-18 — Sub-Store helper extension v1.6.0

- Local helper communication uses a hidden iframe, removing the need for a visible frontend tab during sync; see the [extension changelog](../../SubStore/edge-extension/CHANGELOG.md). Clash Party's local service must still run; client binaries, graph, DNS, and production outputs are unchanged, requiring no cross-client regeneration.

<a id="2026-10-18--sub-store-网页管理别名模块-v100"></a>

## 2026-10-18 — Sub-Store web-management alias module v1.0.0

- Adds an independently authorized complete management prefix for the reviewed Worker; see the [SubStore changelog](../../SubStore/CHANGELOG.md). Original entry points and extension permissions remain unchanged; helper communication needs no cross-client regeneration.

<a id="2026-10-18--sub-store-下载网关-530-恢复模块-v100"></a>

## 2026-10-18 — Sub-Store download-gateway 530 recovery module v1.0.0

- Adds a one-time same-target direct GET/HEAD recovery after gateway 530 for the reviewed Worker; see the [SubStore changelog](../../SubStore/CHANGELOG.md). Only auxiliary download communication changes; no cross-client regeneration is required.

<a id="2026-10-18--sub-store-辅助扩展-v151"></a>

## 2026-10-18 — Sub-Store helper extension v1.5.1

- Fixes redirect parameters and empty-GET JSON compatibility in Cloudflare management communication; see the [SubStore changelog](../../SubStore/CHANGELOG.md). Clash Party overrides, graph, DNS, and client-output versions are unchanged; no cross-client regeneration is required.

<a id="2026-10-18--sub-store-辅助扩展-v150"></a>

## 2026-10-18 — Sub-Store helper extension v1.5.0

- The link-sync helper can separately update local and independent Cloudflare Sub-Store instances, adding connection-profile import, partial-success diagnosis, and per-target recovery; see the [extension changelog](../../SubStore/edge-extension/CHANGELOG.md). Clash Party overrides, graph, DNS, and client-output versions are unchanged; no cross-client regeneration is required.

<a id="2026-10-18--sub-store-fusion-发布完整性模块-v100"></a>

## 2026-10-18 — Sub-Store Fusion publication-integrity module v1.0.0

- Adds independent subscription-publication protection, Worker contract patches, and CI to prevent missing sources or erroneous placeholder collections from overwriting accepted data; see the [SubStore changelog](../../SubStore/CHANGELOG.md). Clash Party overrides, graph, DNS, and client-output versions are unchanged; no cross-client regeneration is required.

<a id="2026-10-18--sub-store-辅助扩展-v141"></a>

## 2026-10-18 — Sub-Store helper extension v1.4.1

- Fixes stale writes after subscription controls disappear from the same page and the prerender-activation handshake; see the [extension changelog](../../SubStore/edge-extension/CHANGELOG.md). Client overrides and routing outputs are unchanged.

<a id="2026-10-18--sub-store-辅助扩展-v140"></a>

## 2026-10-18 — Sub-Store helper extension v1.4.0

- Automatic writeback applies only to sites explicitly allowed initially; revoking permission or leaving the document cancels unsent writes. Cross-response candidates remain ambiguity-checked, and failed intermediary tabs are cleaned up. See the [extension changelog](../../SubStore/edge-extension/CHANGELOG.md). Overrides/routing outputs are unchanged; no cross-client regeneration is required.

<a id="2026-10-18--sub-store-辅助扩展-v132"></a>

## 2026-10-18 — Sub-Store helper extension v1.3.2

- Fixes candidate changes, account parameters, relative links, and loopback-placeholder boundaries during automatic sync; only the corresponding single URL is updated, preserving processors and other fields. See the [extension changelog](../../SubStore/edge-extension/CHANGELOG.md). Overrides/routing outputs are unchanged; no cross-client regeneration is required.

<a id="2026-10-18--内置-sub-store-链接同步辅助扩展"></a>

## 2026-10-18 — Built-in Sub-Store link-sync helper extension

- Adds the [Edge / Chrome link-sync helper](../../SubStore/edge-extension/README.md), validating and updating a single remote URL in built-in Sub-Store after manual login while preserving processors and collections. Actual coverage and untested sites are documented there.
- Adds only an independent helper and documentation; Clash Party overrides, source graph, DNS, and client-output versions remain unchanged, requiring no cross-client regeneration.
- Extension v1.3.1 passed six-provider automatic flows and configuration readback, plus 158 Node tests and 15 independent real-Edge flow regressions; the [acceptance record](../../docs/research/2026-10-18-substore-auto-sync-acceptance.md) states version reuse and pending Chrome coverage.

## v6.0.20-dns.19 / v6.0.20-normal.20 (2026-10-16)

- Issue #187: added exact DIRECT exceptions in existing `scki-adfp-direct` for `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, `hkshort.weixin.qq.com`, preventing WeChat connection endpoints from matching ads first.
- No parent/subdomain expansion; `ad.weixin.qq.com` and `log.weixin.qq.com` remained rejected. Other policies and ordering were unchanged.
- See [WeChat review](../../docs/research/2026-10-16-wechat-issue-187.md) for evidence and bounded static acceptance. Reporter-device recovery still required retesting.
- Documentation adds Windows 11 Microsoft Store troubleshooting, separately verifying AppContainer loopback entry and image-CDN egress; one machine's results do not change the Microsoft group's default policy.

## v6.0.19-dns.18 / v6.0.19-normal.19 (2026-10-16)

- Reads source `fake-ip-filter-mode` before outputting `blacklist`: inherits lists only when mode is absent or normalizes to `blacklist`; discards lists from `whitelist`, `rule`, null, or invalid modes, retaining fixed repository exemptions. Follows [official Mihomo mode definitions](https://wiki.metacubex.one/config/dns/#fake-ip-filter-mode), avoiding inversion of fake-IP allowlists into real-IP exemptions.
- Synchronizes Smart/Normal/FlClash fixes; existing JS contracts add a mode matrix, entry sanitization, baseline retention, and repeated-run regressions, correcting the old rule fixture's invalid inheritance assertion.
- Fixes `tools/sync-traffic-options.js` marker-block replacement dropping CR from Windows CRLF; preserves LF/CRLF, out-of-block bytes, and trailing-newline state. Adds byte-exact block-replacement/runtime/three-client synchronization regressions; `--check` still compares entire content strictly.
- Fake-IP effects concern only subscription-list migration in three JS scripts; OpenClash replaces DNS wholesale, while other clients use static DNS or lack this field and thus have no equivalent inheritance entry. Source graph, groups, and rule assets need no regeneration.

## v6.0.19-dns.17 / v6.0.19-normal.18 (2026-10-15)

- FIX#186: unified repository-owned remote assets on GitHub raw HTTPS to avoid jsDelivr repository-size limits, preserving version queries and native formats.
- Reused verified fused payloads; content, ordering and policies were unchanged. Added raw/CDN-reference regressions. See [delivery guidance](../../docs/rule-asset-delivery.md) for cause, download prerequisites and official fields.
- Download acceptance supports explicit selection of an existing HTTP proxy, a default 60-second request limit, and serial validation; transport errors are not misread as empty bodies and skipped for retry, and proxy credentials are redacted. Full GET/hash gates remain enabled.

## v6.0.18-dns.16 / v6.0.18-normal.17 (2026-10-14)

- Release-batch checker and contracts unify on v1.0.1, adding real-repository contracts and CLI versions to regressions; adds eight Egern supplemental-output categories and official MRS provenance-ledger coverage. Only release tooling changes.
- Fixed cross-service first-match misclassification: narrowed broad Apple/Microsoft keywords and shared AWS/Azure/CDN suffixes, adding eight guard classes: game-cn, microsoft-live, microsoft-ai, intl-site, stream-jpkr, tools, social, bytedance-app. Six ADFP records for exact CA revocation/status hosts via DIRECT and exact Microsoft international-mail policy brought the total to 35. `api.byteoversea.com` was an exact TikTok rule, not a shared-suffix expansion. Existing Claude Desktop `a-api`/`a-cdn` exceptions, QUIC/latency options and default-off ZeroTier proxy remained. Crisp relay was a static ASN-overlap risk inference, not a measured incident.
- Source graph v6.0.18: 525 providers / 984 source rules; generated 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 nonempty SRS across 81 segments.

## v6.0.17-dns.15 / v6.0.17-normal.16 (2026-10-14)

- Sync tools preserve explicit trusted local ZeroTier true/false choices, using release false only when absent; deployment offers preservation, dry-run, original backup, atomic replacement, and post-save readback. Fixes source updates overwriting an enabled office setting with false.
- Adds a read-only Windows acceptance tool that uses download increments on the four owned root UDP flows to verify replies, recording ONLINE, fixed selection, and TCP separately. Preserves existing store-selected, never hardcodes a once-successful node, and does not substitute TCP latency tests for UDP health.
- Three Smart/Normal/FlClash JS scripts synchronize descriptions and versions; source rules, 55 groups, and all static clients have no local JS entry, so default assets need no regeneration. See [local-option documentation](../../docs/zerotier-planet-proxy.md) for platform matrix, cached official evidence, and updates.

## v6.0.17-dns.14 / v6.0.17-normal.15 (2026-10-13)

- Added exact `a-api.anthropic.com` and `a-cdn.anthropic.com` to `scki-adfp-ai` for Claude Desktop application-code/user-content loading through AI policy. Based on [official requirements](https://code.claude.com/docs/en/desktop#network-access-requirements), without inferring specific `a-api` paths.
- Existing rule sets/native syntax remained. Source-semantic gates, 29 ADFP checks, Claude stage inventory and file-level release-batch checks joined the publication chain. See [Claude dependencies](../../docs/claude-service-dependencies.md) and [release-batch checks](../../docs/release-batch.md). No real-device reproduction or measurement occurred.

## v6.0.16-dns.14 / v6.0.16-normal.15 (2026-10-12)

- Following v6.0.16, recorded source/version receipts, ordered domain-projection diffs and bidirectional ADFP validation. Conversion format, order and target policies remained; no runtime rules were added. See [rule-quality ledger](../../docs/rule-quality.md).
- Reused current fused payloads, recording only observable bytes and conversion receipts. Original remote-input SHA values cannot be reconstructed from old outputs; no claim of complete historical provenance or real-device traffic measurement was made.

## v6.0.15-dns.14 / v6.0.15-normal.15 (2026-10-12)

- Adds trusted local `SCKI_ZEROTIER_PLANET_PROXY`, default `false`. When enabled, only UDP/9993 to four ZeroTier root addresses is placed before existing rules and routed to the existing US group; rule facts are exported from the source graph to shared runtime.
- Rejects before writing if filtering leaves no US group; creates no empty group and changes no regional selection. Subscription fields and system environment variables cannot enable it. Repeated generation does not duplicate the four rules.
- Synchronizes equivalent JS execution points in Normal/FlClash. Default graph, DNS, 55 group names, and static assets retain original bytes; Egern updates source-file hashes only. Per-client scope, UDP requirements, and minimal application steps are in the [guide](../../docs/zerotier-planet-proxy.md).
- Regressions cover combinations with the two existing traffic options, unchanged defaults, early precedence, invalid values, missing targets, and input preservation. Existing OpenClash regression reads normalize CRLF first while retaining Ruby execution and assertions.

## v6.0.15-dns.13 / v6.0.15-normal.14 (2026-10-07)

- Smart/Normal default `standard` remains 300 seconds and sets `lazy: true`; `power-save` remains 900 seconds with `lazy: true`. Default QUIC policy is unchanged.
- See [latency-test and QUIC options](../../docs/traffic-options.md) for operation and other-platform applicability.

## v6.0.15-dns.12 / v6.0.15-normal.13 (2026-10-07)

- Smart/Normal overrides support runtime health-check and overseas UDP/443 choices; the power-saving health-check tier adjusts testable groups and enables demand-based skipping.
- See [latency and QUIC options](../../docs/traffic-options.md) for switching commands, capabilities and verification.

## v6.0.14-dns.11 / v6.0.14-normal.12 (2026-09-30)

- INLINE: Accepts providers containing only `type: inline` and `payload`; explicit and payload nodes undergo preflight, deduplication, filtering, and dependency validation before flattened providers are removed. Payload nodes are copied independently, preserving shared source objects. Providers with remote/filter/override/health-check fields still require prior aggregation and flattening.
- CANDIDATES: Named `direct/reject` outbounds remain for `dialer-proxy` but are excluded from regional/global/residential testing and node-domain collection; global groups explicitly use `REJECT` without remote proxies.
- GUARD: Reserves `PASS-RULE`; invalid listeners / TUN process-exclusion fields are rejected before DNS writes, preventing a mutated partial configuration from being returned.
- SCOPE: Synchronizes three JS runtimes, two OpenClash runtimes, and CMFA native-group filters. Stash lacks a publicly documented equivalent field, so pruning remains with its limitation documented; see [follow-up research](../../docs/research/2026-09-30-routing-runtime-followup.md) for other platforms. Rule graph, business defaults, and DNS baseline are unchanged.

## v6.0.14-dns.10 / v6.0.14-normal.11 (2026-09-30)

- PREFLIGHT: Checks node fields, duplicate/reserved names, and chained-proxy references before writing DNS and rebuilding groups/rules, preventing invalid-node partial outputs; fully equivalent duplicate nodes are stably deduplicated.
- FILTER: Uses shared node-filter runtime with precompiled information patterns and boundary-matched English announcements. Optional `SCKI_MAX_NODE_MULTIPLIER` defaults to `null`; when enabled, excludes only nodes clearly over the limit, retaining unknown/ambiguous multipliers.
- GUARD: Nonempty `proxy-providers` explicitly require aggregation/flattening; global groups use `REJECT` when filtering leaves no nodes. Preflight rejection preserves input and uses count-based diagnostics.
- SCOPE: FlClash/OpenClash synchronize runtime semantics; static clients and clients without subscription-classification entry points lack equivalent execution points. Source graph, fused assets, 55 group names, and DNS baseline remain v6.0.14; see the [research/platform matrix](../../docs/research/2026-09-30-routing-script-research.md).
- REFERENCE: Reviews Mihomo v1.19.31 and official `proxies/use/include-all-proxies/empty-fallback` fields, updating local references. Adds actual `main()` regressions for exceptions, filtering, duplicates, dependencies, and repeat runs; sync tools/CI check runtime drift.

## v6.0.14-dns.9 / v6.0.14-normal.10 (2026-09-29)

- FIX: WeChat image-related HTTPDNS domains `dns.weixin.qq.com` and `dns.weixin.qq.com.cn` match earliest exact DIRECT exceptions instead of `BlockHttpDNS → 🛑 广告拦截`.
  - Source rules still follow upstream BlockHttpDNS; exceptions contain only these two WeChat resolver domains, leaving other provider entries unchanged.
- SYNC: Updates source graph to v6.0.14 and rebuilds cross-client cache version keys; rule/group counts remain unchanged.
- VERIFY: `tools/tests/domestic-route-regression.test.js` checks that both domains first match the direct fused provider.

## v6.0.13-dns.8 / v6.0.13-normal.9 (2026-09-21)

- ★ FIX#183: Supports Clash Party v2.0.3+ subscription-DNS override-protection boundaries.
  - Cause: Before executing JS overrides, Clash Party's main process inspects original-subscription `proxy-server-nameserver`, `proxy-server-nameserver-policy`, and `nameserver-policy`; if built-in `controlDns` is enabled, it automatically disables built-in DNS control first.
  - Handling: Smart/Normal JS diagnoses only the names of detected protected fields, never resolver values, node domains, or IPs; it then writes the complete repository DNS baseline and restricted Node-DNS projection.
  - Usage: The repository owns final DNS configuration, so Clash Party's built-in DNS override should remain disabled. If the client must take ownership, remove protected fields at the original subscription/aggregation layer.
- VERIFY: `tools/validate-js-overwrites.js` adds a fixture containing all three protected source-field classes, verifying subscription input cannot replace the output DNS baseline and FlClash does not incorrectly emit the Clash Party-specific guard.
- DOCS: Synchronizes `README.md`, `Mihomo内核系/Clash Party/README.md`, `docs/private-node-dns.md`, and `AGENTS.md` §3.5.4 / §5 / §8.4. Official evidence: [Clash Party v2.0.3 release](https://github.com/mihomo-party-org/clash-party/releases/tag/v2.0.3), [`dnsOverrideGuard.ts`](https://github.com/mihomo-party-org/clash-party/blob/v2.0.3/src/main/core/dnsOverrideGuard.ts), and [`factory.ts`](https://github.com/mihomo-party-org/clash-party/blob/v2.0.3/src/main/core/factory.ts).

## v6.0.13-dns.7 / v6.0.13-normal.8 (2026-09-21)

- ★ FIX#182: Fixes Smart overrides still failing to load after confirmation on Clash Party v2.0.3 because `dns.fake-ip-filter[3]` referenced nonexistent `rule-set:cn domain`.
  - Smart/Normal overrides explicitly converge on Mihomo `fake-ip-filter-mode: blacklist` instead of inheriting cached client rule mode.
  - Removes old subscription `rule-set:*` / `RULE-SET,...` provider references invalidated by `cleanupSubscription()`, retaining valid domain wildcards and built-in `geosite:*` entries.
  - Regression covers exact reported `rule-set:cn domain` and verifies unchanged totals of 55 groups, 151 rules, and 132 fused providers.
- ★ CROSS-CLIENT-AUDIT: Synchronizes the equivalent fix to FlClash; static outputs such as CMFA/Stash/OpenClash have no subscription-runtime inheritance seam, so existing `blacklist` settings remain unchanged.
  - Contract: `AGENTS.md` §3.5.1 / §8.4; official Mihomo DNS syntax uses `fake-ip-filter-mode` with single-token `rule-set:xxx` / `geosite:xxx`.

## v6.0.13-dns.6 / v6.0.13-normal.7 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE: `linuxdo.org`, `connect.linuxdo.org`, and `invite.linuxdo.org` first match `scki-fused-013-cn-site-domain → 🏠 国内网站`.
- GUARD: `linux.do` still matches `scki-fused-059-gfw-domain → 🚫 受限网站`; domain segment 013 remains before general international-IP fallbacks.

## v6.0.12-dns.5 / v6.0.12-normal.6 (2026-09-01)

- FIX#181-PC: Adds `login.nvidia.cn` to first-segment `scki-adfp-direct`, matching exact `DIRECT` before broad NVIDIA download rules.
- SCOPE: Does not label all overseas proxies faulty; bypasses only Smart's blind spot in target-specific TLS compatibility selection. Other NVIDIA domains still use `📥 下载更新`.

<a id="2026-08-31-flclash-平台说明联动"></a>

## 2026-08-31 — FlClash platform-documentation synchronization

- FIX#181: FlClash subversion `v6.0.11-flclash.7` corrects application-layer DNS overrides and Android VPN HTTP-proxy documentation. Clash Party lacks FlClash's later `overrideDns` toggle; this changes no Clash Party output, rule source, or DNS algorithm. See the [FlClash changelog](../FlClash/CHANGELOG.md).

## v6.0.11-dns.4 / v6.0.11-normal.5 (2026-08-22)

- ROUTING: Only `gemini` and `acc-gemini` fused segments change to `🔍 Google 服务`; `szkane-ai` remains `🤖 AI 服务` in its original relative order.
- VERIFY: Gemini, Generative Language, Google APIs, and DeepMind first match Google; `cerebras.ai` stays AI, and `static.doubleclick.net` retains ad precedence.

## v6.0.10-dns.4 / v6.0.10-normal.5 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT: Adds two NetEase game-service hosts to first-segment `scki-adfp-direct`; exact `DIRECT` precedes anti-AD and broad domestic-game `netease.com` rules.
- GUARD: Adds only the two reported `DOMAIN` rules, not a broad allowlist for parent `proxima.nie.netease.com`; regressions pin both first matches to `scki-fused-001-direct-domain`.

## v6.0.9-dns.3 / v6.0.9-normal.4 (2026-08-02)

- FIX-NODE-ISO-LOWERCASE: classifyAllNodes adds case-insensitive two-letter ISO + number matching; yun hk01 / yun us01 / yun jp01 / yun sg01 / yun tw01 enter corresponding regional primary and aggregate groups.
- GUARD: Existing strict ISO word boundaries remain; arbitrary lowercase natural-language us / in do not become country matches. The compatibility branch activates only when a number follows.
- VERIFY: Override contracts regress all 12 user-provided names and verify classification buckets, primary regional groups, and aggregate memberships.

## v6.0.9-dns.2 / v6.0.9-normal.3 (2026-07-25)

- ADAPTER: Node-DNS moves from implicit script helpers to `SckiSubscriptionAdapter.captureNodeDns()` / `applyNodeDns()`. The Adapter supplies active-node server lists and logging; the runtime Module no longer depends on classifiers, `VERSION`, or UI logging functions.
- PROFILE: Synchronizes trusted `off / policy / adaptive` profiles, defaulting to `adaptive`. Profiles affect only private node-DNS projection depth, never the 55 groups, rules, providers, or repository-wide DNS. Snapshot/apply profile mismatch or a missing PSS baseline causes zero writes.
- HARDENING: Retains later/case-variant exact active-node policies within bounds; wildcards retain a separate limit. Resolver URL paths/queries are case-sensitive; conflicts fail closed, and policies/bootstrap hosts are accepted atomically.
- VERIFY/DOCS: Three JS contracts cover all profiles, case-sensitive path conflicts, later exact keys, profile mismatch, 64+ resolver/host capacity, and sync drift; official Mihomo DNS documentation updated 2026-07-18 was reviewed with no field-compatibility change.

## v6.0.9-dns.1 / v6.0.9-normal.2 (2026-07-25)

- NODE-DNS: Subscription private resolvers no longer enter global `proxy-server-nameserver`. Exact node policies materialize only for active proxy-node FQDNs; subscription PSS is a node-level fallback only when no more specific policy exists.
- HARDENING: Preserves scalar-domain redirects in `hosts`; supports IPv4 / IPv6 / IPv4-mapped IPv6 bootstrap. `*.` precedes `+.` / `.`, resolver hosts precede node hosts, and all untrusted input/capacity is bounded.
- VERIFY: Three JS overrides share `tools/runtime/node-dns-hints.js`; contracts cover wildcards, private-resolver scope, IP bootstrap, 64-entry limits, and repeated-override idempotence.

## v6.0.9 / v6.0.9-normal.1 (2026-07-19)

- FIX#176 follow-up audit: General `api.github.com` joins `🔧 工具与服务` before broad upstream AI rules; only process-plus-domain combinations for `Code Helper` / `Code Helper (Plugin)` continue matching `🤖 AI 服务`.

## v6.0.8 / v6.0.8-normal.1 (2026-07-15)

- FIX#176 complete fix: Smart/Normal place shared-edge/CDN, `geolocation-!cn`, IP, and regional fallbacks after authoritative domestic segments, no longer relying on single-domain snapshot moves.
- CACHE-ISOLATION: All fused-provider remote URLs and local Mihomo `path` values are isolated by `v6.0.8`; updating configuration creates new cache files instead of waiting for old-path refresh intervals.

## v6.0.7 / v6.0.7-normal.1 (2026-07-14)

- FIX#176: Final Smart/Normal fused rules place `scki-fused-061-cn-site` ahead of general international CDN/GEOIP fallbacks; domestic domains such as `mi.com`, `yunxuetang.cn`, and `yxt.com` are not prematurely proxied because they resolve to overseas IPs.
- REGRESSION: Contracts verify semantic segments rather than fixed numbers, requiring CN-domain segments before all general Cloudflare / CloudFront / Fastly, country, and non-China regional fallbacks.

## v6.0.6 / v6.0.6-normal.1 (2026-07-14)

- TUN-DIRECT-WORKPRO: `WorkPro.exe` and `WorkProWebProcess.exe` enter TUN then match fused `DIRECT` residual in `scki-local-process-direct`; both overrides remove WorkPro `tun.exclude-process` bypasses, preventing traffic from going straight to physical adapters.
- REGRESSION: Process-allowlist fixtures cover both parent and Web subprocesses and assert neither is excluded from TUN.

## v6.0.5 / v6.0.5-normal.1 (2026-07-14)

- DIRECT-WORKPRO: Existing WorkPro.exe in scki-local-process-direct is now enforced by process-allowlist fixtures; the fused direct segment remains before work, pinning Smart/Normal routing to DIRECT.

## v6.0.4 / v6.0.4-normal.1 (2026-07-13)

- DIRECT-ITWDB: Adds `itwdb.com` to supplemental `scki-local-direct`, retaining default `DIRECT` precedence after MRS/fused compilation. Covers `workpro.itwdb.com` and all subdomains without scattered inline domains in Smart/Normal rules.

## v6.0.3 / v6.0.3-normal.1 (2026-07-12)

- FIX#FUSED-DOMAIN-PAYLOAD: Smart/Normal consume correct fused-MRS domain wildcard payloads; `chatgpt.com`, `chat.openai.com`, and `persistent.oaistatic.com` no longer miss and fall into `🌐 国外网站`.
- AI-PRECEDENCE: ChatGPT telemetry hosts on DataDog / Sentry enter `🤖 AI 服务` before ads; AI also handles `a.nel.cloudflare.com` before Google/overseas-site segments.
- SYNC: Synchronizes to 124 fused providers / 141 main rules (513 / 970 source entries), without direct upstream-provider calls.

<a id="v602-region1smart-保持-v602-基线-v602-normal2-2026-07-12"></a>

## v6.0.2-region.1 (Smart retains v6.0.2 baseline) / v6.0.2-normal.2 (2026-07-12)

- FIX#REGION-CARRIER-PRIORITY: Fixes carrier/route marketing labels overriding actual exit regions. Previously `🇯🇵AWS日本01 | 电信移动联通推荐` first matched CN carrier keywords and entered only `🌏 亚太节点`, not `🇯🇵 日韩节点`.
- FIX: Temporarily removes nonregional carrier labels such as `中国电信/联通/移动/铁通`, `电信/联通/移动/铁通`, and `China Telecom/Unicom/Mobile` before matching full regional words, flags, and ISO codes. CN fallback applies only to carrier-only names without any region signal.
- REGRESSION: Covers Japanese AWS + Chinese carrier labels, US AWS + `China Telecom`, and carrier-only labels; all three overrides assert the Japanese sample enters both `🇯🇵 日韩节点` and `🌏 亚太节点`.
- SCOPE: `rulesets/source/routing-graph.js`, fused providers, GEO databases, and generated outputs are unchanged; this is a Clash Party runtime classifier fix.

## v6.0.2 (2026-07-10)

- FIX#175: Smart/Normal consume recompiled 113 fused providers / 130 main rules, removing incorrect HaGeZi sources and expanded GEOIP CIDR artifacts.
- FUSED-DEDUP: Compilation eliminates same-policy exact duplicates, suffix/keyword coverage, and parent-CIDR coverage; final JS still contains no raw upstream providers.
- GEOIP-NATIVE: Runtime GEOIP stays in residual providers for Mihomo GeoIP-database queries, not forced into `.mrs` or expanded into enormous CIDR lists.

## v6.0.1 (2026-07-10)

- SYNC: Authoritative source becomes `rulesets/source/routing-graph.js v6.0.1`; Smart/Normal still consume only final fused `.mrs` / residual sets, retaining 113 providers, 130 main rules, and 55 groups.
- DELIVERY: The fused compiler generates ordered mobile-text shards under 18 MiB; JS does not reintroduce upstream providers or revert to direct upstream-rule calls.
- BUILD-IDEMPOTENCE: Generators remove old fused injections in either CRLF/LF before inserting one call; repeated builds do not accumulate `applyMihomoFusedRuleSets(config)`.
- VERIFY: Cross-output contracts derive shard counts/order from fused manifests; CI checks sizes of all self-hosted generated files actually referenced by clients.

## Unreleased (2026-07-09)

- SOURCE-GRAPH: Moves raw providers, raw rules, and MRS mappings to `rulesets/source/routing-graph.js`.
- APP-SIMPLIFY: Smart/Normal JS retains only node cleanup, regional/business groups, DNS/global overrides, and final `applyMihomoFusedRuleSets(config)`.
- RULES: Final fused output has `113` providers and `130` rules with unchanged routing semantics.

## v6.0.0 / v6.0.0-normal.1 (2026-07-09)

- FUSED-RULESETS: Adds fused-rule compilation; authoritative inputs subsequently moved to `rulesets/source/routing-graph.js`.
- SCALE: Compresses source `474 providers / 931 rules` into `113` fused providers and `130` main rules, retaining only `17` necessary inline port/logical/fallback rules.
- MIHOMO-MRS: Fused providers prefer `.mrs`; unconvertible residual entries go to `*-residual.yaml`.
- GOVERNANCE: Future isolated domain/IP/process patches must enter supplemental sets and be folded by the compiler, not unnecessarily scattered as inline rules.

## v5.4.39 / v5.4.39-normal.1 (2026-07-09)

- MRS-PARTIAL: Smart/Normal review all remaining `YamlRule` / `TextRule`; every migratable part moves to `.mrs`, retaining residual YAML/original formats only for unsupported types such as `PROCESS-NAME`, `GEOIP`, and ports.
- MIHOMO-MRS: Updates totals to 474 providers / 929 rules; 424 providers use `.mrs`, and 30 partial providers add `-classical.yaml` residual sets.
- SOURCE-SIZE: Compresses the `.mrs` override map into one-line JSON, avoiding source-line inflation from multiline compatibility tables; runtime still rewrites dynamic providers to final sets.
- SCKI-SUPPLEMENTAL: Migrates representable domain/ipcidr `scki-*` supplemental sets to `.mrs`; process rules remain necessary exceptions.

## v5.4.38 / v5.4.38-normal.1 (2026-07-09)

- SCKI-SUPPLEMENTAL: Adds shared supplemental-set constants and 15 `scki-*` providers, moving isolated domain/IP/process patches out of main rules.
- MIHOMO-MRS: Smart/Normal move to 429 providers / 884 rules: reuse 35 upstream `.mrs`, convert 255 upstream YAML/TEXT sources to repository `.mrs`, and split 38 mixed classical providers into domain/ipcidr pairs.
- SYNC: Supplemental-set early precedence covers ad false positives, Douyin Web, RustDesk, Google Workspace, download updates, and related cases.

## v5.4.37 / v5.4.37-normal.1 (2026-06-29)

- ★ DNS-POLICY#170: Beyond existing GitHub / jsdelivr / Fastly CDN policies, `overwriteGeneral()` adds geosite-level resolver routing:
  - `geosite:cn` → AliDNS / DNSPod DoH。
  - `geosite:geolocation-!cn` → Cloudflare / Google DoH。
- Purpose: `nameserver-policy` precedes `nameserver/fallback`, pinning domestic/non-domestic resolver selection before non-domestic queries reach domestic recursive resolvers and require `fallback-filter` correction.
- DOCS: The UI Mixin example in `Mihomo内核系/Clash Party/README.md` synchronizes DoH-over-IP bootstrap, hosts pre-resolution, geosite policy, `direct-nameserver-follow-policy`, and Sniffer skip lists; old counts of 31 business groups / 963 rules / 373 providers become 33 / 1000+ / 376 for that release.
- VERIFY: `tools/validate-js-overwrites.js` adds geosite-policy assertions to prevent DNS-policy regression.

## v5.4.36 / v5.4.36-normal.1 (2026-06-29)

- CLEAN#171-DIRECT: Removes 22 individually verified redundant inline rules: `video.unext.jp` / `dl.delivery.mp.microsoft.com` are covered earlier locally, and 20 others by earlier same-policy providers.
- Removed candidates: `stripe.com` / `stripe.network` / `stripecdn.com` / `stripe.dev`, `outlook.office365.com`, `notion.so` / `notion.site` / `atlassian.com` / `trello.com` / `bitbucket.org`, `channel4.com` / `channel5.com` / `sky.com`, `yandex.com` / `yandex.ru` / `pypi.org` / `pythonhosted.org`, `download.mozilla.org` / `archive.mozilla.org` / `releases.ubuntu.com`.
- Retained candidates: seven AI, three Binance, and two Microsoft-login rules, because different-policy `.mrs` sets precede the proven same-target match.
- Rule count: 1023 → 1001; providers remain 376.

## v5.4.35 / v5.4.35-normal.1 (2026-06-28)

- ★ CLEAN#170-UPSTREAM: Removes eight redundant upstream sets already covered by earlier same-target rules: `marketing`, `acc-vf-paypal`, `encoretvb`, `findmy`, `wildrift`, `acfun`, `acc-fl-douyin`, `acc-fl-xiaohongshu`.
- CLEAN#170-DIRECT: removed three later inline rules already covered by the earlier same-target Douyin China-streaming guard: `douyin.com`, `douyinpic.com`, `douyinvod.com`.
- Provider generation shrinks accordingly: `VirtualFinance` 4 → 3 (removes supplemental PayPal), `FakeLocation` 10 → 8 (removes supplemental DouYin / XiaoHongShu).
- VERIFY: Total providers 384 → 376; matching order unchanged and `privacy` retained.

## v5.4.34 / v5.4.34-normal.1 (2026-06-28)

- ★ FIX#169-AMAP: Adds MetaCubeX `amap` provider and `RULE-SET,amap,🏠 国内网站` after ad/threat rules but before broad TikTok/GFW/geolocation-!cn rules.
- Coverage: Domestic AMap APIs including `webapi.amap.com`, `amap.com`, `autonavi.com`, and `gaode.com` no longer rely on final `RULE-SET,cn` for direct routing.
- VERIFY: Provider-presence/order assertions in `tools/validate-js-overwrites.js` prevent moving AMap protection after overseas fallbacks.

## v5.4.33 / v5.4.33-normal.1 (2026-06-27)

- ★ FEAT#169-AI-CODING: Adds `vpsdance-ai-coding` provider from `VPSDance/ai-proxy-rules` at `rules/clash/coding.yaml`.
- Coverage: Codex / Claude Code / Cursor / Zed / Windsurf / Replit / Sourcegraph / Amazon Q / Augment / Lovable / Bolt and other AI coding tools; rules target existing `🤖 AI 服务` without adding groups.
- Retains v5.4.32 domestic-game precedence.

## v5.4.32 / v5.4.32-normal.1 (2026-06-25)

- ★ FIX#168-CN-GAME: Moves `🕹️ 国内游戏` before `🎮 国外游戏`, ensuring `yuanshen.com` / `mihoyo.com` / NetEase / WeGame / SteamCN domains match direct policy before `RULE-SET,hoyoverse`, `RULE-SET,game`, and `GEOSITE,category-games`.
- Samples: `www.yuanshen.com`, `api-takumi.mihoyo.com`, `game.163.com`.
- Synchronizes FlClash's equivalent fix and adds JS regressions preventing ordering regressions.

## v5.4.31 / v5.4.31-normal.1 (2026-06-20)

- ★ FIX#167-DOUYIN: Adds early domestic-streaming protection for Douyin Web; `douyin.com` / `zjcdn.com` video-CDN domains match `📺 国内流媒体` before TikTok, ads, and overseas fallbacks.
- Samples: `www.douyin.com`, `v5-dy-o.zjcdn.com`, `v5-dy-ov-experiment.zjcdn.com`.
- Synchronizes FlClash's equivalent fix and adds JS regressions preventing ordering regressions.

## v5.4.30 / v5.4.30-normal.1 (2026-06-17)

- ★ FEAT#166-GOOGLE: Adds `🔍 Google 服务` before `🔧 工具与服务`, separating Google platform services from general tools.
- Core Google services, `RULE-SET,scholar`, `RULE-SET,google`, `RULE-SET,google-ip`, `GEOIP,google`, and Google QUIC rules move to `🔍 Google 服务`.
- `🔧 工具与服务` retains non-Google search/developer services: Bing / Yandex / GitHub / Docker / GitLab / Python / developer.

## v5.4.29 / v5.4.29-normal.1 (2026-06-10)

- ★ PERF#165-LATENCY: Unifies regional automatic-test intervals at 300s.
  - Smart mainline: 22 `type: smart` regional groups change `interval: 120 -> 300`, reducing LightGBM/health-check frequency.
  - Normal: 22 `type: url-test` regional groups change `interval: 180 -> 300`, aligning with CMFA/Mihomo-family OpenClash/iOS.
- FINAL stays `🐟 漏网之鱼`, not DIRECT; this round addresses only issue #165's test frequency.

## v5.4.28 / v5.4.28-normal.1 (2026-06-07)

- ★ CLEAN#165 P2: Removes streaming/game inline domains covered by upstream same-policy sets (38 lines across six segments):
  - **Hong Kong streaming** (4): `mytvsuper.com`/`nowe.com`/`rthk.hk`/`cabletv.com.hk` → corresponding RULE-SETs.
  - **Taiwan streaming** (5): `litv.tv`/`friday.tw`/`linetv.tw`/`hamivideo.hinet.net` → corresponding RULE-SETs (the historical entry recorded five removals while listing four domains).
  - **Japan/Korea streaming** (6): `tver.jp`/`dmm.com`/`dmm.co.jp`/`nicovideo.jp`/`nicovideo.me`/`dmc.nico` → corresponding RULE-SETs.
  - **European streaming** (3): `itv.com`/`itvstatic.com`/`britbox.com` → corresponding RULE-SETs.
  - **Other overseas streaming** (6): `wetv.vip`/`wetvinfo.com`/`viki.com`/`viki.io`/`mewatch.sg`/`discoveryplus.com` → corresponding RULE-SETs.
  - **Overseas games** (12): `ubisoft.com`/`ubi.com`/`riotgames.com`/`leagueoflegends.com`/`valorant.com`/`rockstargames.com`/`gog.com`/`gogalaxy.com`/`supercell.com`/`garena.com`/`hoyoverse.com`/`hoyolab.com` → corresponding RULE-SETs.
- **Audit exclusions:** Retains inline `viu.com/.tv` (RULE-SET,viu targets STREAM_OTHER rather than inline STREAM_HK), `appletv.com` (RULE-SET,appletv targets APPLE rather than STREAM_OTHER), and 163/126/126.net (`geosite:cn` is a broad geo set, not a service-specific RULE-SET with identical semantics).
- **Cross-output synchronization:** FlClash JS / CMFA YAML / OpenClash Normal+Smart / Shadowrocket / Surge / Loon / Quantumult X clean up together. SingBox is generated and needs generator changes, exempted this round; v2rayN lacks the redundancy, and Passwall/Passwall2 have different rule syntax (N/A).
- **Rule-count changes:** Clash Party ~1020 → ~982; CMFA ~1400+ → ~1360+; Shadowrocket ~1200+ → ~1160+; QX [filter_local] 568 → 513.

## v5.4.27 / v5.4.27-normal.1 (2026-06-07)

- ★ CLEAN#165 P1: Removes seven inline domains already covered by upstream same-policy sets:
  - `anthropic.com` → `RULE-SET,claude`
  - `braintreegateway.com` / `venmo.com` → `RULE-SET,paypal`
  - `max.com` → `RULE-SET,hbo`
  - `hulu.jp` / `happyon.jp` → `RULE-SET,hulu`
  - `bethesda.net` → `RULE-SET,xbox`
- Audit boundary: Retains `archive.org` despite overlap because removal would make a different policy match first; also retains `video.unext.jp`, covered only by local `unext.jp` rather than an upstream duplicate.

## v5.4.26 / v5.4.26-normal.1 (2026-06-07)

- ★ FIX#164: Protects domestic direct routing for Tencent WorkBuddy/assistant `copilot.tencent.com` ([issue #164](https://github.com/IvanSolis1989/Smart-Config-Kit/issues/164)).
  - **Cause:** szkane `AiDomain.list` contains substring rule `DOMAIN-KEYWORD,copilot`; `copilot.tencent.com` was wrongly captured by `RULE-SET,szkane-ai` into overseas `🤖 AI 服务` before domestic `RULE-SET,cn`, causing WorkBuddy conversation failures that disappeared with the system proxy disabled.
  - **Fix:** Inserts `DOMAIN-SUFFIX,copilot.tencent.com,🏠 国内网站` before every AI rule set, following the existing domestic-AI `deepseek.com` policy and preventing broad-rule capture.
  - **Regression guard:** `tools/validate-js-overwrites.js` asserts presence and precedence over `RULE-SET,szkane-ai` across Smart/Normal/FlClash JS.
  - **Equivalent-case review** (historical CLAUDE.md §1): blackmatrix7 `Copilot.list` and Accademia `Copilot.yaml` contain no copilot substring keyword, only exact `copilot.microsoft.com`; szkane AiDomain.list was the sole cause.
  - **Cross-output synchronization:** CMFA / OpenClash Normal+Smart / Shadowrocket / Surge / Loon / Quantumult X / FlClash add the early guard. SingBox / v2rayN / Passwall / Passwall2 were verified unaffected: `geosite:copilot`/`geosite:openai` lack copilot substring keywords, allowing `copilot.tencent.com` to reach `geosite:cn` (including `+.tencent.com`) and direct routing; only versions align there.

## v5.4.25 / v5.4.25-normal.1 (2026-06-04)

- ★ Review fix: Deduplicates `GEOIP,netflix` / `GEOIP,google` (two occurrences each), retaining the central GEOIP-label block and removing scattered business-block copies; continues v5.4.24 GEOIP,ID cleanup.
- ★ Review fix: Accademia GeoRouting's 34 providers (17 domain + 17 IP) change interval from `nextInterval()` (~24h) to seven days (604800s), reducing concurrent refreshes for slowly changing regional rules.

## v5.4.24 / v5.4.24-normal.1 (2026-06-03)

- ★ CLEAN: Removes 21 redundant rules and three unreferenced providers, verified through deep review and line-by-line downloaded-upstream comparison.
  - **Removes four Binance DOMAIN-SUFFIX rules:** `binance.com` / `binance.cloud` / `binance.me` / `binancefuture.com`, already in Binance RULE-SET; retains uncovered `binance.vision` / `binance.info` / `binance.org`.
  - **Removes three Google child RULE-SET references:** `googlesearch` / `googledrive` / `googleearth`, fully covered by parent `DOMAIN-SUFFIX,google.com` and `DOMAIN-KEYWORD,google`; removes their provider declarations too.
  - **Removes three ProtonMail DOMAIN-SUFFIX rules:** `protonmail.com` / `proton.me` / `pm.me`, already covered; retains uncovered `tutanota.com` / `tuta.com`.
  - **Removes five music DOMAIN-SUFFIX rules:** `soundcloud.com` / `sndcdn.com` / `pandora.com` / `deezer.com` / `tidal.com`, covered by their respective RULE-SETs.
  - **Removes two social DOMAIN-SUFFIX rules:** `tumblr.com` / `clubhouse.com`, covered by their respective RULE-SETs.
  - **Removes two streaming DOMAIN-SUFFIX rules:** `vimeo.com` / `dailymotion.com`, covered by their respective RULE-SETs.
  - **Removes one duplicate GEOIP rule:** `GEOIP,ID,🌐 国外网站`, identical to the overseas-site block's rule.
  - ✅ Verified 11 Apple child RULE-SETs (appstore/appletv/siri etc.) are **not redundant**: parent Apple.yaml contains only IP-CIDR, PROCESS-NAME, and DOMAIN-KEYWORD, with no DOMAIN-SUFFIX.
  - ✅ Verified Mail RULE-SET is **not redundant**: it contains only IMAP/SMTP/POP server hostnames, not consumer domains.

## v5.4.23 / v5.4.23-normal.1 (2026-06-02)

- ★ FIX#161: Adds Zhihu image CDN `zhimg.com` and short-link `zhihu.co` to direct `🏠 国内网站`; previously `pica.zhimg.com` lacked geosite:cn / ChinaMax coverage, fell through FINAL to a proxy, and failed to load images.
  - Clash Party JS × 2（Smart + Normal）：`DOMAIN-SUFFIX,zhimg.com` + `DOMAIN-SUFFIX,zhihu.co` → `CN_SITE`
  - Synchronizes CMFA / OpenClash×2 / SR / Surge / Loon / QX / FlClash / regenerated SingBox / v2rayN / Passwall / Passwall2.

## v5.4.22 / v5.4.22-normal.1 (2026-05-31)

- ★ Adds direct allowlist entries for Getui push SDK `getui.com` / `getui.net` / `gepush.com`, after review and following #2 jpush/umeng. Generic ad/privacy sets treat these as trackers, but they also carry application push such as Mi Home; the owner chose availability over blocking for these entries.

Proxy-override adaptations, batch C · #1 fine-grained QUIC (spec: `docs/2026-05-30-proxy-override-借鉴设计.md`):

- AND-rule exemptions route YouTube/Google/MS/Apple QUIC to corresponding business groups, relying on sniffer QUIC SNI inspection followed by GEOSITE/RULE-SET matching.
- Other non-China QUIC → REJECT, forcing HTTP/2 fallback, matching the original Proxy-override semantics.
- Adds previously missing QUIC AND rules to CMFA and both OpenClash scripts, removing mainline asymmetry.
- Extends SingBox generator QUIC conversion: compound AND rules become six first-match route rules.
- iOS engine limitation: block-quic/disable-udp-ports lack AND/NOT allowlist exemptions; marked N/A.
- Adds `config.sniffer` with QUIC/443 SNI inspection and `force-dns-mapping`, aligning with existing CMFA/OpenClash sniffers. This enables QUIC GEOSITE/RULE-SET matching for real-IP fake-ip-filter domains such as `mcdn.bilivideo.cn`; previously Smart/Normal/FlClash lacked sniffers and `NOT,((GEOSITE,cn))` incorrectly rejected real-IP QUIC (review fix).
- Fallback changes `GEOIP,CN` → `GEOSITE,cn` (**intentional semantic change**): fake-IP addresses such as 198.18.x.x cannot be identified as CN through GEOIP, whereas GEOSITE directly matches mapped domains more reliably.
- Fine-grained QUIC is enabled by default; see `Mihomo内核系/Clash Party/README.md` for disabling it.

## v5.4.21 / v5.4.21-normal.1 (2026-05-31)

Proxy-override adaptations, batch D · #4 DoH-over-IP bootstrap (spec: `docs/2026-05-30-proxy-override-借鉴设计.md`):

- Upgrades `default-nameserver` from plaintext IPs to DoH-over-IP (`https://IP/dns-query`) plus one plaintext fallback `223.5.5.5`.
- Uses two Alibaba endpoints (`223.5.5.5`/`223.6.6.6`), Google (`8.8.8.8`), and Cloudflare (`1.1.1.1`). The historical entry claimed bootstrap DNS-leak elimination; the plaintext fallback means this is not an unconditional no-leak guarantee.
- Evidence: Official Mihomo wiki explicitly supports encrypted DNS (DoH/DoT/DoQ) in `default-nameserver`; Mihomo ≥ 1.18.x.

## v5.4.20 / v5.4.20-normal.1 (2026-05-30)

Proxy-override batch B, #6 node-filter keywords; spec: `docs/2026-05-30-proxy-override-借鉴设计.md`:

- Junk-node filter `isInfoNode` adds Chinese substrings `免费` / `试用` / `应急` and English boundary-matched `Sign` / `Login` / `Register` / `Help` / `FAQ`, avoiding false positives such as Signal.
- Excluded `更新` / `地址` due to false-positive risk, as specified by the owner.
- Regressions: Adds `tools/test-info-node-filter.js` for source consistency across six Mihomo outputs; expands `tools/validate-js-overwrites.js` with three-JS behavioral fixtures: eight junk positives filtered and negative `Signal 香港 IEPL x1` retained/classified HK, verifying `\b` boundaries.
- 🔢 Version: v5.4.19 → v5.4.20.

## v5.4.19 / v5.4.19-normal.1 (2026-05-30)

Proxy-override adaptations, batch A (three low-risk items; design spec: `docs/2026-05-30-proxy-override-借鉴设计.md`):

- ✅ #2 Added leading China SDK/CDN direct rules.
  - Adds jpush / `msg.umeng.com` (Umeng) to `AD_FALSE_POSITIVE_ALLOWLIST` with forced DIRECT. They were previously blocked as trackers by `jiguangtuisong` / `youmengchuangxiang`, affecting push/messages; follows P0-FIX#41 Xiaomi precedent, with the owner's explicit decision to remove this blocking.
  - Places 360 `baomitu.com`, BootCDN `bootcss.com`, Qiniu `staticfile.org`, and Upyun `upaiyun.com` before `RULE-SET,cn` in the domestic-site segment. Uses `🏠 国内网站`, not hard DIRECT, matching neighboring 163.com behavior.
  - Does not add `adjust.com` / `appsflyer.com`, overseas attribution SDKs, avoiding unjustified direct routing.
- ✅ #3 Completes fake-ip-filter with ten real-IP entries needed for hole punching/direct connections, following RustDesk v5.4.12 semantics.
  - Remote access: `+.todesk.com` `+.oray.com` `+.sunlogin.com` `+.teamviewer.com` `+.anydesk.com`.
  - Games: `+.battlenet.com.cn` `+.wotgame.cn` `+.wggames.cn` `+.wowsgame.cn`.
  - Bilibili P2P: `+.mcdn.bilivideo.cn`.
- ✅ #5 `direct-nameserver-follow-policy: true`
  - Makes direct-outbound domain resolution follow `nameserver-policy`, ignored by Mihomo's default false setting.
  - Matches the official use case: direct uses domestic DoH while policy routes overseas CDNs through overseas DoH. At that release repository policies contained only overseas CDNs; the historical entry recorded no domestic false positives.
  - Does not raise the minimum core requirement: belongs to the already-used `direct-nameserver` field family, added together and effective only when `direct-nameserver` is nonempty.
- 📋 Cross-output scope: #2 reaches all 14 outputs in native syntax; #3 / #5 apply only to six Mihomo-family outputs (SingBox has no fake-IP here; Loon/QX/SR are not Mihomo).
- 🔢 Skips invalidated v5.4.18 (FlClash was mistakenly changed then reverted; SingBox missed the revert and stayed at .18), aligning all outputs at v5.4.19.

## v5.4.17 / v5.4.17-normal.1 (2026-05-26)

- ✅ FIX#DNS-SPLIT-BOOTSTRAP: Fixes DNS to IP-literal `default-nameserver` bootstrap and DoH for all other resolvers.
  - `nameserver` / `direct-nameserver`: fixed AliDNS + DNSPod DoH.
  - `proxy-server-nameserver`: fixed Cloudflare + Google DoH, with AliDNS + DNSPod DoH fallback.
  - `fallback`: fixed Cloudflare + Google DoH; `fallback-filter.geosite`: fixed `gfw` + `geolocation-!cn`.
  - Writes and validates `prefer-h3: false`, `respect-rules: true`, and `cache-algorithm: arc`, prioritizing rule-based proxy/direct selection for DNS upstream connections.

## v5.4.16 / v5.4.16-normal.2 (2026-05-22)

- ✅ FEAT#GAME-ACCEL: added game-accelerator `PROCESS-NAME -> DIRECT` exceptions.
  - Adds 16 accelerator process names: UU (UU.exe / NeteaseUU.exe / UUGameBooster.exe / UUService.exe / UURepair.exe / NeteaseUUBrowser.exe), XiaoHei (XiaoHeiAccelerator.exe / xhjsq.exe), XunYou (xunyou.exe / XunYouAcc.exe / XunYouUpdate.exe), Leigod (LeigodAcc.exe / LeigodAccel.exe / leigodaccel.exe), and NNer (NNer.exe / NNerClient.exe).
  - Reason: These tools already provide network-acceleration tunnels; proxying them may cause double proxying or connection failures.
  - Synchronizes Smart JS / Normal JS / CMFA YAML / OpenClash Normal / OpenClash Smart / Surge / SingBox Full / FlClash JS.
  - Skips Shadowrocket / Loon / Quantumult X on iOS, which lack PROCESS-NAME support.
  - Skips v2rayN / Passwall / Passwall2, which have no runtime process classification.

## v5.4.16 / v5.4.16-normal.1 (2026-05-20)

- ✅ FIX#149-P0: Places `DOMAIN-SUFFIX,paddle.com,🏦 金融支付` early to avoid anti-AD/DustinWin false-positive blocking of `analytics.paddle.com`.
  - Issue #149 reported `There was an unexpected issue setting up your account.` after Antigravity's Google-login return.
  - At that release anti-AD/DustinWin included `analytics.paddle.com`; the exception must precede ad/phishing/TIF rules rather than sit in the later financial-payment block.
  - Smart/Normal JS synchronize, retaining `AD_FALSE_POSITIVE_ALLOWLIST` as the single early-allowlist module.

## v5.4.15 / v5.4.15-normal.1 (2026-05-20)

- 🧾 DOC#GEOSITE-LEDGER: Adds docs/GEOSITE_COVERAGE_LEDGER.md documenting native GEOSITE/GEOIP, supplemental providers, and false-positive allowlist boundaries.
- ♻️ REFACTOR#AD-FP-MODULE: Smart/Normal JS elevate false-positive exceptions into AD_FALSE_POSITIVE_ALLOWLIST, injected centrally at the start of injectRules().
- 🧪 VERIFY#ORDER: Allowlist remains before anti-ad / phishing / TIF / privacy-ad rules; totals remain 1053 rules and 385 providers.

## v5.4.14 / v5.4.14-normal.1 (2026-05-20)

- ✅ FIX#CF-R2-P0: Stops `cloudflarestorage.com` from entering `🛑 广告拦截` through a false-positive Sukka phishing match.
  - At that release Sukka `reject_phishing` included `+.cloudflarestorage.com`; the repository's existing overseas-site rule followed ads and could not override first match.
  - Moves `DOMAIN-SUFFIX,cloudflarestorage.com,🌐 国外网站` before all ad/phishing/threat-intelligence rules and removes the later duplicate.
  - Official Cloudflare R2 documentation identifies `*.r2.cloudflarestorage.com` as a normal R2 S3 API / presigned-URL access domain.

## v5.4.13 / v5.4.13-normal.1 (2026-05-19)

- ✅ FIX#STUN-REALIP: STUN/TURN NAT discovery uses real IPs plus standard-port direct routing.
  - `fake-ip-filter` adds `stun1-4.l.google.com`, three STUN/TURN wildcard patterns, and `global.turn.twilio.com`.
  - `DST-PORT` adds `5349 / 19302 / 19305 / 19307`, retaining `3478 / 3479`.
  - UDP/443 TURN remains under QUIC-blocking policy, avoiding relaxation of global HTTP/3 blocking.

## v5.4.12 / v5.4.12-normal.1 (2026-05-12)

- ✅ FIX#RD-REALIP: Adds RustDesk domains to `fake-ip-filter` for real-IP answers.
  - `+.rustdesk.com` still matches `🧑‍💼 会议协作`, but DNS no longer returns 198.18.x fake IPs.
  - Prevents RustDesk rendezvous/relay hole-punch failure from reserved addresses under TUN/fake-IP.

## v5.4.11 / v5.4.11-normal.1 (2026-05-12)

- ✅ FIX#RD-PROC: Removes RustDesk from local-tool direct allowlists; desktop `RustDesk.exe` / `rustdesk` uniformly target `🧑‍💼 会议协作`.
  - Fixes double misrouting of `rs-ny.rustdesk.com`: first captured by `copilot` through Vultr AS20473, then forced DIRECT by the local-tool allowlist.
  - Keeps `DOMAIN-SUFFIX,rustdesk.com` before `copilot`, protecting relay/API domains from early AI matches.
- ✅ FIX#DNS-BOOTSTRAP: Uses IP-first DNS bootstrap; `nameserver` / `direct-nameserver` / `proxy-server-nameserver` initially use `223.5.5.5` / `119.29.29.29`.
  - Avoids unresolved DoH domains under TUN/fake-IP deadlocking requests to `doh.pub` / `dns.alidns.com`.

## v5.4.9 / v5.4.9-normal.1 (2026-05-11)

- ✅ FEAT#LOCAL-TOOLS: Adds a desktop-local-tool `PROCESS-NAME -> DIRECT` allowlist.
  - Covers Oray / Sunlogin / AweSun / AnyDesk / ToDesk / RustDesk / TeamViewer / ZeroTier / Tailscale / frpc / frps / ngrok / natapp / cloudflared / Navicat and other remote-access, DDNS, tunneling, and database tools.
  - Uses exact process names rather than broad `.*vpn.*` / `.*vnc.*` regexes that could incorrectly force direct routing.
  - Adds compatibility inventory `docs/process-name-compatibility.md` and tests `tools/validate-process-name-direct.js`.

## v5.4.8 (2026-05-09)

- ★ ORDER#RULE-TAIL: Reorders middle/tail business-rule matching without changing UI group order.
  - Ads stay early; `MATCH/🐟 漏网之鱼` remains last.
  - Tail order: `🇪🇺 欧洲流媒体` → `🌐 其他国外流媒体` → `🔧 工具与服务` → `Ⓜ️ 微软服务` → `🍎 苹果服务` → `📥 下载更新` → `🛰️ BT/PT Tracker` → `🚫 受限网站` → `🎮 国外游戏` → `🌐 国外网站` → `🕹️ 国内游戏` → `📺 国内流媒体` → `🏠 国内网站` → `🐟 漏网之鱼`.
  - Moves domestic streaming from before TikTok to immediately before domestic sites, avoiding early capture of shared ByteDance domains such as `snssdk.com`/`pstatp.com`.
  - TikTok remains before domestic ByteDance rules.

## v5.4.7 / v5.4.7-normal.1 (2026-05-09)

- ★ FEAT#TikTok: added independent `🎵 TikTok` group (32 service groups), between `📺 国内流媒体` and `🎥 Netflix`.
  - Separates TikTok from social media into a dedicated select group using standard global-proxy candidates.
  - TLS fingerprint changes from SOCIAL (firefox) to STREAM (chrome).
  - `RULE-SET,tiktok` changes target from `📱 社交媒体` to `🎵 TikTok` and precedes Netflix.
- ★ FIX#HK: Completes Hong Kong classification by appending `'港'` to `REGION_DB` kw.
  - Fixes unmatched IEPL/IPLC cross-border names such as `广港` and `深港`.
  - JS `indexOf` substring matching covers all X+`港` variants, including `广港/深港/沪港/京港/中港/穗港`.
  - Synchronizes all outputs: CMFA/OpenClash Ruby regexes add `|港`; SR/Surge/Loon/QX literal lists add `|广港`.

## v5.4.6 / v5.4.6-normal.1 (2026-05-08)

- ★ FEAT#145: Direct routing for WeChat CDN `cdn.weixin.qq.com`.
  - Adds `DOMAIN-SUFFIX,cdn.weixin.qq.com,DIRECT`, routing matching WeChat CDN traffic directly.
  - Synchronizes all 14 outputs.

## v5.4.5 / v5.4.5-normal.1 (2026-05-07)

- ★ FIX#142-P0: Fixes the empty-DNS-object bug introduced in v5.4.1+, where `overwriteGeneral` created `config.dns` without `nameserver`.
  - For subscriptions without DNS, `if (!config.dns) config.dns = {}` created an empty object.
  - Mihomo skipped default DNS upon seeing that object; absent nameservers caused all DIRECT DNS resolution to fail and time out.
  - Fix: Adds `enhanced-mode` and fallback `nameserver` (`223.5.5.5`, `119.29.29.29`) after creating `config.dns`.
  - Synchronizes Smart/Normal JS; static CMFA/OpenClash/SR/Surge/Loon/QX/SingBox outputs lack runtime DNS creation and are exempt.
- ★ FIX#144: Routes bbys.app video directly with `DOMAIN-SUFFIX,bbys.app,DIRECT`.
  - Existing providers did not cover this domain; video-CDN subdomains could resolve outside CN and be proxied, causing a black screen.
  - Adds to Smart/Normal JS and synchronizes all outputs; see individual changelogs.
- ★ FEAT#143: Includes IEPL/IPLC dedicated-link nodes in residential groups by adding `\biplc\b`, `\biepl\b`, and `专线` to `RESIDENTIAL_PATTERNS`.
  - The historical rationale grouped dedicated links with residential connections as high-quality nonshared links, allowing Smart to select them; labels alone do not guarantee connection quality or exclusivity.
  - Synchronizes Smart JS / Normal JS / FlClash JS.

## v5.4.3 / v5.4.3-normal.1 (2026-05-06)

- ★ FEAT: Adds standalone `\bhome\b` residential recognition for names such as `HK-Home-01`, not matched by previous `home[-_ ]?(ip|broadband)`.
  - Appends `/\bhome\b/i` to `RESIDENTIAL_PATTERNS`, using JS word boundaries to avoid `homepage` / `homebase` false positives.
  - Synchronizes Smart and Normal JS.

## v5.4.2 / v5.4.2-normal.1 (2026-05-05)

- ★ FIX#41-P0: Xiaomi core-service DIRECT allowlist fixes authentication/security domains incorrectly blocked by miuiprivacy/advertisingmitv.
  - miuiprivacy rejected `auth.be.sec.miui.com` (security authentication backend) and `idm.api.io.mi.com` (identity-management API).
  - This broke Xiaomi-account security handshakes, displayed a network error, and also disabled cloud backup.
  - Adds 11 DOMAIN/DOMAIN-SUFFIX DIRECT allowlist rules before all ad-blocking segments.
  - Synchronizes Smart/Normal JS and all ten affected outputs.

## v5.4.1-normal.2 (2026-05-05)

- ★ FIX#FlClash-Review-P0: Fixes standard-Mihomo JS classification-bucket initialization regression.
  - Restores `HK/TW/CN/JP/KR/SG/US/EU/AM/AF/OTHER/ALL` buckets in `ClashParty(mihomo).js`, preventing `result.ALL.push(...)` TypeError with node input.
  - Completes `SG` / `OTHER` residential mappings in `REGION_HOME_MAP` and removes duplicate `SG` from Southeast Asia candidate chains.
  - Equivalent-case audit: Smart mainline buckets are correct; FlClash receives the fix. CMFA/OpenClash/iOS/Passwall/sing-box/v2rayN lack this JS initialization regression.

## v5.4.0 (2026-05-05)

- ★ FEAT#SG: added independent `🇸🇬 狮城节点` and `🏡 狮城家宽` groups.
  - Separates Singapore from APAC into its own region: REGION_ORDER GLOBAL/HK/TW/SG/JPKR/APAC/....
  - Regional groups: 18 → 20 (10 all-node + 10 residential); total groups: 49 → 51.
  - Cryptocurrency groups automatically include Singapore nodes, with SG-first ordering described as low-latency at that release.
  - Southeast Asian streaming prefers Singapore nodes through SG-first buildSeaProxies.
  - Adds SG to BT/PT Tracker candidates.
  - Synchronizes all 12 applicable outputs; Passwall/Passwall2/v2rayN are exempt.

## v5.3.2 (2026-04-28)

- ★ **Forces the WeChat/QQ process family DIRECT:** Weixin.exe / WeChatAppEx.exe / QQ.exe / WeChat.exe → DIRECT.
  - Moves all four IM processes into the early DIRECT block, bypassing proxy groups.
  - Adds `PROCESS-NAME,WeChatAppEx.exe,DIRECT` for the WeChat desktop helper.
- Synchronizes Clash Party Normal / SingBox Full; CMFA / OpenClash are exempt.

## v5.3.1 (2026-04-28)

- ★ **Forces Weixin.exe DIRECT:** WeChat process uses direct routing, not a proxy.
  - `PROCESS-NAME,Weixin.exe,🏠 国内网站` → `PROCESS-NAME,Weixin.exe,DIRECT`.
  - Weixin.exe matches the early DIRECT block; QQ.exe / WeChat.exe retain `🏠 国内网站` in this release.
  - Synchronizes Clash Party Normal / SingBox Full; CMFA / OpenClash are exempt because they do not provide corresponding PROCESS-NAME visibility here.

## v5.3.0 (2026-04-26)

- ★ **REFACTOR#2:** Changes streaming architecture from regional to platform groups, addressing fragmented regional subscription access.
  - **Splits five major platforms into independent groups**, allowing a different regional node choice per platform:
    - `🎥 Netflix`: select, standardProxies; split from the former US-streaming group.
    - `🎬 Disney+`: select, standardProxies; likewise split. The historical entry cited widespread lower-priced Turkish/Indian subscriptions as motivation, not a current recommendation or access guarantee.
    - `📡 HBO/Max`: select, standardProxies; likewise split.
    - `📺 Hulu`: select, standardProxies; likewise split, also receiving Hulu JP `hulu.jp`/`happyon.jp` from Japan/Korea streaming.
    - `🎬 Prime Video`: select, standardProxies; likewise split.
  - **Splits two broadly available platforms into independent groups**, historically described as not requiring regional IPs and suitable for fastest-node selection; availability remains service-dependent:
    - `📹 YouTube`: select, standardProxies; split from US streaming. The original entry described global availability without regional locking, which is not an unconditional access guarantee.
    - `🎵 音乐流媒体`: select, standardProxies; combines Spotify/Apple Music/Tidal/Deezer/SoundCloud/Pandora/Qobuz/Overcast from US and European streaming.
  - **Retains four regional streaming groups**, historically characterized as region-IP locked without cross-region account use; actual restrictions depend on each service:
    - `🇭🇰 香港流媒体` / `🇹🇼 台湾流媒体` / `🇯🇵 日韩流媒体` / `🇪🇺 欧洲流媒体`.
  - **Removes `🇺🇸 美国流媒体`**, split into platform/fallback groups, and **removes `📺 东南亚流媒体`**, merged into the fallback.
  - **Adds fallback `🌐 其他国外流媒体`**, receiving approximately 30 platforms including Paramount+/Peacock/Twitch/Crunchyroll/Vimeo/Dailymotion/Pluto plus all former SEA platforms.
  - Streaming groups 7 → 13; business groups 25 → 31; total groups 43 → 49 (SingBox: 50).
  - Every group is `select`; candidates contain only Smart regional groups plus DIRECT, not individual nodes.
- ★ **Cross-version synchronization:** Historical §1 requires all ten outputs, 11 subdirectory READMEs, and 14 changelogs to synchronize.

## v5.2.11 (2026-04-26)

- ★ **REFACTOR#1:** Consolidates business groups 28 → 25 to reduce complexity.
  - Merges search and developer services into `🔧 工具与服务` using standardProxies.
  - Merges mail into `🌐 国外网站` using standardProxies, with no special latency requirement recorded.
  - Merges cloud/CDN into `🌐 国外网站`; the recorded rationale was that a separate low-traffic group cost too much maintenance despite CDN anycast differences.
  - Changes download updates from directFirst to proxy-first standardProxies; the historical rationale favored proxying large downloads, not a universal recommendation.
  - Retains independent BT/PT Tracker because MetaCubeX has a dedicated category and users need separate control of its REJECT → DIRECT → PROXY choices.
  - Business groups 28 → 25; total 46 → 43, including 18 regional groups.
- ★ **Cross-version synchronization:** Historical §1 requires Clash Party Normal JS / CMFA YAML / OpenClash Normal+Smart / Shadowrocket / SingBox / Surge / Loon / Quantumult X / v2rayN / Passwall / Passwall2.

## v5.2.10 (2026-04-25)

- ★ **FIX#39:** Routes overseas DoH endpoints to `🚫 受限网站`, preventing failure when cloud/CDN is set DIRECT.
  - `DOMAIN,dns.google` / `DOMAIN,dns.google.com`：`${BIZ.CLOUD_CDN}` → `${BIZ.GFW}`（line ~1197-1198）
  - `DOMAIN-SUFFIX,cloudflare-dns.com`：`${BIZ.CLOUD_CDN}` → `${BIZ.GFW}`（line ~1988）
  - Historical motivation: dns.google / cloudflare-dns.com were reported blocked by filtering in mainland China,
    so the release classified them as restricted sites rather than CDN; previous cloud/CDN placement was legacy behavior.
    If a user selected DIRECT for cloud/CDN to avoid proxying CDN traffic,
    DoH could fail and trigger system-DNS fallback, degrading resolution or exposing it to interference.
    Restricted-site placement keeps DoH proxied even when CDN is direct, improving robustness for that scenario.
  - Domestic providers DNSPod `doh.pub` / Alibaba `alidns.com` retain their configuration;
    the historical entry reported them unblocked in that environment and therefore unchanged.
- ★ **Equivalent-output synchronization:** Clash Party Normal JS (`ClashParty(mihomo).js` in this directory, shared runtime under historical §1.5),
  CMFA YAML / OpenClash Normal+Smart / Shadowrocket / SingBox / Surge / Loon / Quantumult X migrate together.
  - SingBox is regenerated with `node Sing-box内核系/SingBox/SingBox(sing-box)-generator.js`, automatically inheriting the JS baseline.
  - v2rayN: Xray has only proxy/direct/block outbounds; dns.google / cloudflare-dns.com
    target `proxy` under either grouping, so no rule diff occurs, only an `_meta` version bump.
  - Passwall / Passwall2 had no specialized `cloudflare-dns.com` / `dns.google` entries;
    broader `geosite:cloudflare` / `geosite:google` cover them in lists 23-cloud-cdn / 18-search.
    Moving individual domains into 26-gfw.list would require reordering the whole list priority ahead of 18 / 23,
    beyond this minimal fix. Historical §1.4 records a platform exception: no shunt-rule change, version bump only.
- Bump: `v5.2.9` → `v5.2.10`; all outputs align major versions at `v5.2.10`.

## v5.2.9 (2026-04-25)

- ★ **Full code review:** Fixes three P0/P1 baseline bugs and equivalent cross-output issues.
  - **P0 FIX#30:** Replaces hardcoded `'🏠 国内网站'` in QQ.exe/Weixin.exe/WeChat.exe `PROCESS-NAME` rules with `${BIZ.CN_SITE}`, avoiding dead references if the constant is renamed.
  - **P1 FIX#31:** Adds missing alpha-2/alpha-3 `IN`/`IND` to APAC_OTHER `iso`; Indian `IN 01` nodes had become UNCLASSIFIED.
  - **P1 FIX#32:** Fixes the jsdelivr comment saying direct while code targets `${BIZ.GFW}`.
  - **iOS equivalent FIX#33** (SR/Surge/Loon/QX): Bare substring `US`/`PL`/`SE` in `policy-regex-filter` caused cross-matches:
    - `US` matched `AUS`, placing Australian nodes in the US group.
    - `PL` matched `IPLC`, placing dedicated-link nodes in Europe.
    - `SE` matched `SEOUL`, placing Seoul nodes in Europe.
    - Fix: `|US|` → `|\bUS\b|`, `|PL|` → `|\bPL\b|`, `|SE|` → `|\bSE\b|`.
  - **iOS equivalent FIX#34:** Removes `AF` from Africa filters; it is Afghanistan's ISO code, not an African-country marker such as South Africa.
  - **iOS equivalent FIX#35:** Fixes `nowtv.com.uk` typo to `nowtv.co.uk`.
  - **iOS equivalent FIX#36:** SR/Surge/Loon footer dates change 2026-04-16 → 2026-04-25.
  - **CMFA FIX#37:** Adds missing `nameserver-policy` forcing jsdelivr/github through Cloudflare/Google DNS.
  - **Passwall2 FIX#38:** Changes `geosite:kakaotalk` → `geosite:kakao` plus explicit-domain fallback; v2fly geosite.dat lacks kakaotalk.
  - **Passwall2:** v5.2.6-pw2.2 → v5.2.9-pw2.1, catching up baseline and fixing kakaotalk.

## v5.2.8 (2026-04-23)

- ★ **FIX#28-P0:** Adds HK/TW/JP/KR coverage to CMFA/OpenClash APAC filters, completing equivalent-bug coverage.
  - JS mainline already correctly uses `apacNodes = c.HK.concat(c.TW, c.CN, c.JP, c.KR, c.SG, c.APAC_OTHER)` and needs no change.
  - CMFA YAML (`v5.2.8-cmfa.3`): APAC filter adds `香港|HKG|台湾|TWN|日本|JPN|韩国|KOR` and related keywords.
  - OpenClash Normal/Full (`v5.2.8-oc-normal.3` / `v5.2.8-oc-full.3`): Expands Ruby `GROUP_MAP["APAC"]` and removes classification-loop `break`.
  - ⛔ Shadowrocket / Surge / Loon / QX already have correct `policy-regex-filter` / `server-tag-regex` coverage; unchanged.
  - ⛔ SingBox / v2rayN have no runtime node classification (N/A).
- Version `v5.2.7` → `v5.2.8`, identifying the baseline for CMFA/OpenClash equivalent fixes.

## v5.2.7 (2026-04-23)

- ★ **FIX#27-P1:** Eliminates Mihomo parse warnings when loading three classical providers.
  - User-reported symptom: Mihomo startup/reload logs repeatedly printed:
    - `parse classical rule [USER-AGENT,TikTok*] error: unsupported rule type: USER-AGENT`
    - `parse classical rule [USER-AGENT,BBCiPlayer*] error: unsupported rule type: USER-AGENT`
    - `parse classical rule [IP-CIDR , 17.253.4.125] error: payloadRule error`
  - Causes:
    - `szkane-ciciai`: upstream `szkane/ClashRuleSet/Clash/Ruleset/CiciAi.list` line 52 contains `USER-AGENT,TikTok*`; Mihomo classical providers do not recognize this legacy Surge/iOS syntax.
    - `szkane-uk`: upstream `szkane/ClashRuleSet/Clash/Ruleset/UK.list` line 5 contains `USER-AGENT,BBCiPlayer*`, with the same issue.
    - `acc-grok`: upstream `Accademia/Additional_Rule_For_Clash/Grok/Grok.yaml` line 9 contains `IP-CIDR         , 17.253.4.125`; extra spaces and no CIDR mask cause parsing failure.
  - Fix: Hosts sanitized copies of these three sources under root `mirrors/`, removing problematic lines, and redirects Mihomo-family output URLs to this repository's jsdelivr mirror; the original summary referred to four outputs, while the detailed list below names five.
    - `mirrors/CiciAi.list`: Removes `USER-AGENT,TikTok*`; the historical entry considered TikTok domains fully covered by `metaDomain('tiktok','tiktok')`.
    - `mirrors/UK.list`: Removes `USER-AGENT,BBCiPlayer*`; the historical entry considered BBC domains fully covered by `metaDomain('bbc','bbc')`.
    - `mirrors/Grok.yaml`: Removes `IP-CIDR , 17.253.4.125`, identified as Apple `time.apple.com` anycast unrelated to Grok, and normalizes extra spaces around DOMAIN-SUFFIX.
  - Synchronization scope (FIX#27 equivalent-case audit):
    - ✅ **Clash Party Smart JS** (this file): Three provider URLs use mirrors; bumps to `v5.2.7`.
    - ✅ **Clash Party Normal JS** (`ClashParty(mihomo).js`): Three provider URLs use mirrors; bumps to `v5.2.7-normal.1`.
    - ✅ **CMFA YAML** (`Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml`): Three provider URLs use mirrors; bumps to `v5.2.7-cmfa.1`.
    - ✅ **OpenClash Smart sh** (heredoc YAML): Three provider URLs use mirrors; bumps to `v5.2.7-oc-full.1`.
    - ✅ **OpenClash Normal sh** (heredoc YAML): Three provider URLs use mirrors; bumps to `v5.2.7-oc-normal.1`.
    - ⛔ **Shadowrocket / Surge / Loon / Quantumult X:** The historical audit recorded native USER-AGENT support, acceptance of whitespace variants such as `IP-CIDR  , 1.2.3.4`, and implicit `/32` handling when masks were missing. It therefore retained upstream szkane/Accademia URLs without mirror changes. These recorded compatibility conclusions are not a fresh validation of every current client/version.
    - ⛔ **SingBox Full:** Uses its own `route.rule_set` (binary `.srs` / source JSON), unrelated to Clash classical; unaffected.
    - ⛔ **v2rayN Xray routing:** Uses Xray `routing.rules`, not Clash classical providers; unaffected.
  - Compatibility: The historical record estimated about five minutes for an initial jsdelivr cold fetch, followed by edge-cache hits. Apart from removed problematic lines and the Grok whitespace normalization noted above, remaining rules were recorded as byte-identical to upstream.

## v5.2.6 (2026-04-22)

- ★ **FIX#24-P0:** Adds ISO alpha-3 country codes, fixing classification of `TWN/JPN/KOR/SGP` node names.
  - Symptom: Names such as `TWN 01 AnyRoute IEPL x2.5` / `JPN 01 ...` / `KOR 01 ...` / `SGP 01 ...`
    encountered `REGION_DB` containing only alpha-2 `TW`/`JP`/`KR`/`SG` and IATA `tpe`/`nrt`/`icn`/`sin`;
    word boundaries prevent `TW` matching `TWN` because N is a letter, so all became UNCLASSIFIED.
  - Fix: Adds lowercase alpha-3 entries to `REGION_DB` kw:
    TW: `twn`; JP: `jpn`; KR: `kor`; SG: `sgp`; US already has `usa`; CN adds `chn`.
  - Also verifies existing HK alpha-3 `HKG` is correct.
  - Impact: Previously all-UNCLASSIFIED Taiwan/Japan/Korea groups fell back to `apacNodes` / `c.ALL`, mixing in HK and other nodes (see FIX#25).

- ★ **FIX#25-P0:** Does not create Smart groups for empty regions, preventing HK/all-node contamination of Taiwan/Japan groups.
  - Issue screenshots showed Taiwan and Japan/Korea Smart groups containing all 11 nodes, including `HKG 01~04`, `SGP 01`, and `KOR 01`, equal to `c.ALL`.
    The old fallback `c.TW.length > 0 ? c.TW : apacNodes.length > 0 ? apacNodes : c.ALL`, when TW/JP/KR was empty,
    silently inserted `apacNodes` (including HK) or `c.ALL`.
  - Fix: HK / TW / JPKR / APAC / US uniformly **omit empty-region groups**, as EU / AMERICAS / AFRICA already did.
    - `SMART.GLOBAL = c.ALL` always remains as fallback.
    - `STANDARD_PROXIES` filterProxies automatically removes absent Smart-group references from 28 business groups, preventing dangling references.
  - With FIX#24, a subscription containing only HKG+TWN+JPN+KOR+SGP changes from Taiwan=11 / Japan-Korea=11 to Taiwan=1 / Japan-Korea=3, as expected.

- ★ **FIX#26-P0:** `cleanupSubscription` clears all subscription-native proxy-groups.
  - Issue report: After override, users saw 60 groups instead of the script's expected 37.
  - Old logic removed only four blacklisted keywords: `负载均衡` / `自动选择` / `手动选择` / `节点选择`;
    subscription regional or streaming groups remained alongside the script's 37 injected groups.
  - Fix: Directly assigns `config['proxy-groups'] = []`.
    - Safety premise: All 28 business groups reference only `SMART.*` + `DIRECT` + `REJECT`; Smart groups reference node names in `config.proxies`.
      None relies on subscription-native groups, so the script's reinjected 37 groups become authoritative.
  - Compatibility: Leaves node objects in `config.proxies` untouched and regroups Smart candidates by node name.

- Synchronization scope (additional v5.2.6 audit revising the earlier assessment):
  - ✅ **Clash Party Smart JS** (this file): All three bugs fixed.
  - ✅ **Clash Party Normal JS** (`ClashParty(mihomo).js`): Shares REGION_DB / cleanupSubscription / fallback chains, so all three bugs are equivalent; fixed in `v5.2.6-normal.1`.
  - ✅ **CMFA YAML:** Mihomo `filter:` lacked `TWN/JPN/KOR/SGP/🇸🇬`; lists had Taiwan/Japan/Korea/Tokyo/Osaka/NRT/KIX/ICN/TPE but no alpha-3 codes. Fixed in `v5.2.6`.
  - ✅ **OpenClash normal/full:** Ruby `/TW/i`, `/JP/i`, `/SG/i` substring matches already cover TWN/JPN/SGP, unlike JS word boundaries, but `/KR/` cannot match KOR's letter order. Adds literal KOR to both scripts in `v5.2.6-oc-{normal,full}.1`.
  - ⛔ **Shadowrocket / Surge / Loon / Quantumult X:** Existing `policy-regex-filter` / `server-tag-regex` / `NameRegex` explicitly contain `TWN|JPN|KOR|TPE|NRT|ICN`; unchanged after audit, temporarily retaining v5.2.5-* versions as explained in subdirectory READMEs.
  - ⛔ **SingBox Full:** Static outbound lists receive nodes by literal tags; no runtime classifier, so these bugs do not apply.
  - ⛔ **v2rayN Xray routing:** Domain/geo-to-outbound routing only; no node classifier, so these bugs do not apply.
- Audit-contract patch: This PR revises historical `CLAUDE.md` / `AGENTS.md` §1.1 to require equivalent-bug audits across all outputs, preventing fixes in only one affected artifact.

## v5.2.5 (2026-04-20)

- ★ **FIX#23-P1:** Conservative deduplication (plan B) removes Accademia domestic sources overlapping `metaDomain('cn', 'cn')`.
  - Removes `acc-geositecn` (`GeositeCN/GeositeCN.yaml`), recorded as byte-identical to geosite:cn.
  - Removes `acc-china` (`China/China.yaml`), heavily overlapping geosite:cn + acc-chinamax.
  - Retains independent `acc-chinamax` with unique coverage, `metaDomain('cn', 'cn')`, and `metaIpCidr('cn-ip', 'cn')`.
  - Recorded benefit: Two fewer providers (373 → 371), approximately 5 MB lower memory, and two fewer cold-start HTTP fetches.
  - The historical entry claimed zero accuracy loss, describing acc-geositecn as identical and acc-china's unique domains as negligible; this is not a new proof of exact equivalence.
  - The historical summary called this nine-output synchronization and listed Clash Party JS / CMFA / OC Normal / OC Smart / regenerated SingBox Full; Shadowrocket / Surge / Loon / QX / v2rayN do not use the Accademia namespace and were unaffected.

## v5.2.4 (2026-04-20)

- ★ **FIX#22-P0:** Fixes 403 Forbidden fetching the `snapchat` provider.
  - v5.2.3 `metaDomain('snapchat', 'snapchat')` pointed to `geosite/snapchat.mrs`.
  - Upstream MetaCubeX meta-rules-dat actually names it `snap.mrs`, not `snapchat.mrs`.
  - Changes to `metaDomain('snapchat', 'snap')`: provider ID/rule references remain snapchat; URL targets snap.mrs.
  - Verified at that release: `https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/snap.mrs` returned HTTP 200.

## v5.2.3 (2026-04-20)

- ★ **FIX#21-P1:** Replaces bm7 BBC/Snap sources to remove USER-AGENT parse warnings.
  - bm7 BBC.yaml contains `USER-AGENT,BBCiPlayer*`; bm7 Snap.yaml contains `USER-AGENT,TikTok*`.
  - Clash Party / Mihomo does not support USER-AGENT rules and warned during reload.
  - Uses Meta geosite providers `metaDomain('bbc')` + `metaDomain('snapchat')`, retaining intended coverage with compatible parsing.
  - Note: v5.2.3's `metaDomain('snapchat','snapchat')` filename typo is corrected by v5.2.4 FIX#22-P0.

## v5.2.2 (2026-04-13)

- ★ **FIX#20-P2:** Moves PI.ai (`inflection.ai` / `pi.ai`) from AI services to restricted sites (GFW).
  - That release recorded PI.ai as blocked in China and placed it under unified restricted-site management.
  - The selected policy supported either a proxy or DIRECT. The former location-based usage recommendation has been removed from this documentation edition.
  - No dedicated bm7 / v2fly / MetaCubeX provider was available; DOMAIN-SUFFIX coverage was considered sufficient.

<a id="v521-基于-04-01--04-09-日志分析5-项修复"></a>

## v5.2.1 (five fixes based on 04-01–04-09 log analysis)

- ★ **FIX#17-P0:** Addresses jsdelivr provider-refresh DNS circular dependency. The original heading called this permanent direct routing, but the actual group choice below is configurable.
  - Changes `RP_PROXY` from `BIZ.CLOUD_CDN` to `BIZ.GFW`; the selected policy remained configurable.
  - Changes `DOMAIN-SUFFIX,jsdelivr.net` from cloud/CDN to restricted sites for unified group control.
  - Before the fix, logs recorded 4,931 jsdelivr failures on 04-06 alone: DNS resolve failed and i/o timeout.
  - The release exposed a choice between DIRECT and a proxy through the policy group. The former location-based usage recommendation has been removed from this documentation edition.

- ★ **FIX#18-P1:** Removes dead ckrvxr sources returning persistent 404 Not Found.
  - Removes `ckrvxr-antipcdn` (AntiPCDN) and `ckrvxr-antifraud` (AntiAntiFraud).
  - Removes provider definitions and rules-array references together; 221 pre-fix 404 errors were recorded.

- ★ **FIX#19-P1:** Fixes `DST-PORT,7680,REJECT` ordering.
  - It previously followed `GEOIP,private,DIRECT`, so private IPs such as 10.x.x.x matched DIRECT first.
  - Moves it before `GEOIP,private`, ensuring Delivery Optimization traffic is rejected.

- ★ **FIX#20-P2:** Adds `GSCService.exe` to TUN `exclude-process`.
  - Under fake-IP, `ip.cip.cc` received a synthetic address and DIRECT reconnection failed DNS resolution.
  - Excluding TUN interception lets GSCService use the system network stack directly.

---

<a id="v519-及之前版本"></a>

## v5.1.9 and earlier

v5.1.9 changes: one cleanup and one configuration adjustment.
- ★ CLEAN#1-P1: Removes approximately 16 dead rules left by the early-match shield (FIX#14).
  - That shield had promoted Google subservice rules before szkane-ai.
  - Original-position duplicates could never match under first-match-wins and only consumed processing work.
  - Removes gmail.com×2 / googlemail.com×2 / mail.google.com×2 / inbox.google.com×2.
    googlesearch×1 / googledrive×1 / googleearth×1 / google×1 / google-ip×1
    googlevoice×1 / meet.google.com×1 / meet.googleapis.com×1
    dl.google.com×1 / play.googleapis.com×1 / android.clients.google.com×1 / googlefcm×1
  - Leaves comments at original positions noting promotion to the early-match shield.
- ★ CFG#1-P2: Removes geo-update-interval and geosite CDN URL from overrides.
  - Users manage both in Clash Party UI; overrides no longer replace them.
  - geo-update-interval is removed; UI controls it, with defaults depending on subscription/UI settings.
  - geosite CDN URL is removed; UI controls fastly/cdn switching.
  - geoip/mmdb/asn URLs remain unchanged; enhanced Loyalsoldier MMDB is a core script dependency.

v5.1.8 changes: four fixes, two performance optimizations, and one annotation.
- ★ FIX#11-P0: Broad szkane-ai rules incorrectly captured dns.google into AI services.
  - dns.google / dns.google.com are Google Public DNS DoH endpoints, not AI services.
  - Log signature: `[TCP] dial 🤖 AI 服务 (match RuleSet/szkane-ai) mihomo --> dns.google:443`.
  - Inserts precise DOMAIN matches targeting CLOUD_CDN before the AI block.
- ★ FIX#14-P0: Adds an early-match shield against broad szkane-ai capture of Google subservices.
  - szkane AiDomain.list includes broad Google domains because of Gemini AI, incorrectly routing Google subservices through AI proxies.
  - Affected services: Google Search / Gmail / Google Meet / Google Drive / YouTube / Google FCM / Google Voice, among others.
  - Inserts a Google-subservice early-match shield before RULE-SET,szkane-ai:
    - Mail: gmail.com/googlemail.com/mail.google.com → EMAIL.
    - Messaging: RULE-SET,googlevoice → IM.
    - Collaboration: meet.google.com/meet.googleapis.com → WORK.
    - Downloads: dl.google.com/play.googleapis.com/RULE-SET,googlefcm → DOWNLOAD.
    - Search: RULE-SET,googlesearch/googledrive/googleearth/google/google-ip → SEARCH.
    - Streaming: youtube.com/googlevideo.com/ytimg.com/ggpht.com → STREAM_US.
  - Already protected by earlier matches: Gemini RULE-SET / NotebookLM / Copilot / dns.google.
  - Dead rules at original positions are removed in v5.1.9 CLEAN#1.
- ★ PERF#2-P0: Mitigates fastly.jsdelivr.net EOF bursts, with 40+ failed provider fetches recorded on 03-05 alone.
  - Cause recorded: 389 providers fetched the same CDN node at dense 10-second steps, triggering disconnections from transient concurrency.
  - Log signature: `[Provider] xxx pull error: ...fastly.jsdelivr.net/...xxx.yaml: EOF`.
  - Three-part optimization:
    1) RP_STEP 10 → 15, expanding the cold-start window from about 65 to 97 minutes and reducing request density.
    2) Adds 0–59s random jitter to nextInterval(), breaking periodic concurrency peaks from uniform steps.
    3) Alternates bm7 providers between primary fastly.jsdelivr.net and alternate cdn.jsdelivr.net.
- ★ FIX#12-P1: GSCService.exe → ip.cip.cc DNS resolution failed every two hours.
  - ip.cip.cc is an external-IP detection service called periodically by Gigabyte GCC.
  - Log signature: `dial DIRECT (match ProcessName/GSCService.exe) --> ip.cip.cc:80 error: dns resolve failed`.
  - Adds DOMAIN,ip.cip.cc,DIRECT to allow direct DNS resolution under TUN.
- ★ NOTE#1-P1: bm7 upstream parsing noise, recorded then as a known upstream issue rather than a script bug.
  - `USER-AGENT,BBCiPlayer*` / `USER-AGENT,TikTok*`: Mihomo does not support USER-AGENT, a leftover Surge syntax.
  - `IP-CIDR[space], 17.253.4.125`: Extra-space formatting error in an Apple-related bm7 provider, as identified by that historical entry.
  - The entry attributed three warnings on each config reload to upstream blackmatrix7/ios_rule_script data quality.
  - At that release, these were documented as nonfunctional noise awaiting upstream fixes; later entries record additional investigation and remediation.
- ★ FIX#13-P2: acc-copilot incorrectly matched a Microsoft Delivery Optimization telemetry domain.
  - geover.prod.do.dsp.mp.microsoft.com belongs to Microsoft DO, not Copilot AI.
  - Log signature: `match RuleSet/acc-copilot) --> geover.prod.do.dsp.mp.microsoft.com:443`, recorded four times daily.
  - Adds an early DOMAIN-SUFFIX match targeting DOWNLOAD.
- ★ PERF#4-P2: geosite.dat updates competed with providers for CDN bandwidth.
  - Log signature: `[GEO] Failed to update GEO database: ...geosite.dat: TLS handshake timeout`.
  - Switches geosite.dat to cdn.jsdelivr.net, identified in the historical entry as Cloudflare-backed, separating it from provider Fastly traffic.
  - geo-update-interval 24h → 72h, reducing refresh frequency for slowly changing geo data.

v5.1.7 changes: one performance optimization and one fix.
- ★ PERF#1-P1: Upgrades three domain-behavior providers to binary .mrs, reducing cold-start parsing overhead.
  - anti-ad: YAML → DustinWin/ruleset_geodata ads.mrs, with the same privacy-protection-tools/anti-AD source and a recorded daily 03:00 build.
  - loyalsoldier-gfw: Text → MetaCubeX geosite:gfw.mrs, sharing gfwlist/gfwlist → v2fly/domain-list-community provenance, approximately 4,000+ domains.
  - loyalsoldier-greatfire: Text → MetaCubeX geosite:greatfire.mrs, sharing GreatFire Analyzer → v2fly/domain-list-community provenance.
  - .mrs coverage: 29/389 providers (7.4%) → 32/389 (8.2%).
  - Remaining non-MRS domain providers (18): sukka-phishing text without an .mrs source, plus 17 acc-geo-d-* providers without Accademia .mrs.
  - Remaining classical providers (322): .mrs does not support classical behavior, a Mihomo format limitation.
  - Test environment verified CDN reachability for MetaCubeX geosite:gfw.mrs / geosite:greatfire.mrs.
- ★ FIX#10-P0: Two hagezi-tif URL fixes omitted in v5.1.6.
  - CDN: cdn.jsdelivr.net → fastly.jsdelivr.net, responding to frequent EOFs observed on the former endpoint in China/Indonesia at that time.
  - Filename: HageziTIF.mrs → HageziUltimate.mrs, the actual release-branch filename; the former returned 404.

v5.1.6 changes: one security enhancement.
- ★ FEAT#2-P0: Adds Hagezi Threat Intelligence Feeds.
  - Covers malware, cryptojacking, command-and-control (C2), scams, and spam.
  - Fills the v5.1.5 security-coverage gap beyond ads/privacy/hijacking/phishing/anti-fraud/anti-PCDN.
  - Prefers MiHomoer/MiHomo-Hagezi binary .mrs with domain behavior for low cold-start overhead.
  - Alternative: Hagezi original text-domain lists, format:text and behavior:domain.
  - Source: hagezi/dns-blocklists, historically recorded at 20k+ stars, daily builds, and aggregation of 30+ threat-intelligence sources.
  - Assigns it to `🛑 广告拦截`, default REJECT.

v5.1.5 changes: one refactor.
- ★ REFACTOR#1-P1: Removes the independent `🇮🇩 印尼本地` group, reducing business groups 29 → 28.
  - Indonesian banking/securities (11 banks including bca/bni/bri/mandiri, plus idx/ksei) → financial payments.
  - Indonesian e-commerce/transport/delivery/telecom/ISP/government/news, approximately 36 domains → overseas sites.
  - GEOIP,ID → overseas sites, symmetric with GEOIP,CN → domestic sites; the historical instructions noted manual DIRECT selection while in Indonesia.
  - Indonesian payment gateways midtrans/gopay/ovo/dana and others remain in financial payments.
  - Indonesian streaming such as vidio/rctiplus remains in Southeast Asian streaming.
  - Removes ID_LOCAL_PROXIES.

v5.1.4 changes: one addition.
- ★ FEAT#1-P1: Adds restricted-site GFW group before INTL_SITE with four-source coverage.
  - Loyalsoldier/clash-rules gfw.txt, from GFWList; historical daily 06:30 builds and approximately 4,000+ domains.
  - Loyalsoldier/clash-rules greatfire.txt, using independent GreatFire blocking detection complementary to GFWList.
  - GEOSITE,gfw, the built-in MetaCubeX geosite.dat GFW tag, supporting keyword/regexp rule types.
  - szkane ProxyGFWlist, moved from INTL_SITE as supplemental domains.
  - Includes DIRECT among choices, historically described for use outside blocked networks; distinguishes this group from INTL_SITE.
  - Source chain: gfwlist/gfwlist + GreatFire Analyzer → v2fly/domain-list-community → Loyalsoldier/v2ray-rules-dat → clash-rules.

v5.1.3 changes: three fixes.
- ★ FIX#7-P1: Narrows broad Zoho DOMAIN-SUFFIX rules to exact mail.zoho.* subdomains, avoiding capture of collaboration rules.
- ★ FIX#8-P2: Moves acc-kwai (international Kwai) from direct-first CNMEDIA to STREAM_SEA; that release's rationale favored proxy routing for the international application.
- ★ FIX#9-P2: Moves ehgallery from STREAM_US to INTL_SITE because it is not a streaming service and global candidates provide flexibility.

v5.1.2 changes: six fixes.
- ★ FIX#1-P0: Corrects Asia_China GeoRouting from INTL_SITE to CN_SITE; .cn domains/Chinese IP ranges were incorrectly proxied.
- ★ FIX#2-P1: Moves BilibiliHMT from direct-first CNMEDIA to STREAM_HK; the historical rationale was regional proxy access for Hong Kong/Macau/Taiwan content, not an access guarantee.
- ★ FIX#3-P1: Adds missing rule references for five orphan providers: googledrive/googleearth/scholar/yandex → search; naver → overseas sites.
- ★ FIX#4-P2: Moves HomeIP US/JP from CN_SITE to INTL_SITE; the release intended these US/Japanese residential-IP ranges to use overseas-site policy rather than domestic direct routing.
- ★ FIX#5-P2: Moves Aqara Global from CN_SITE to INTL_SITE; the release's rationale favored proxy routing for international Aqara services.
- ★ FIX#6-P1: Removes three DNS providers, bm7-dns/acc-globaldns/acc-chinadns, letting DNS traffic follow normal routing.

v5.1 changes: four integration steps.
- ★ Step1-P0: Adds Ckrvxr AntiPCDN for unwanted P2P-CDN traffic and AntiAntiFraud for anti-fraud-related telemetry uploads; these describe the historical lists' intended purpose, not comprehensive protection guarantees.
- ★ Step1-P0: Adds SukkaW reject_phishing, recorded then as 130,000 phishing domains.
- ★ Step1-P2: Adds szkane crypto-exchanges for Binance/OKX/Web3 routing, including the historical quantitative-trading use case.
- ★ Step2: Integrates all 35 Accademia rule directories, supplementing bm7 with AI/Bank/Signal/FakeLocation and others.
- ★ Step3: Integrates all szkane rules, including AI/CiciAI/Web3/Developer/Edu/UK.
- ★ Step4: Switches geox-url to enhanced Loyalsoldier MMDB with cloudflare/telegram/netflix IP ranges.
- ★ Step4: Adds GEOIP label routing for geoip:cloudflare/telegram/netflix.
- ★ D6: Standardizes external-rule URLs on fastly.jsdelivr.net; the v5.1.6 note records replacing raw.githubusercontent.com to address observed EOFs.

Changes v4.5.9 → v5.0:
- ★ P0 expansion: rule-providers 72 → 326, adding 254 bm7 sets.
- ★ P0 expansion: Records complete blackmatrix7 service coverage within the chosen scope, excluding removed/domestic-fallback/aggregate/duplicate/discontinued/test rules.
- ★ P1 optimization: Refresh step 25s → 10s, with an approximately 54-minute cold-start window.
- ★ P1 addition: 13 ad/privacy providers, including Advertising/EasyPrivacy/Hijacking.
- ★ P1 addition: 42 domestic-streaming providers, covering iQIYI/Youku/Douyin/WeTV and others within the release's scope.
- ★ P1 addition: 22 US-streaming providers, including CBS/NBC/PBS/Fox television networks.
- ★ P1 addition: 30 overseas-site providers, including Wikipedia/Dropbox/Airbnb/Nike/Adobe.
- ★ P1 addition: 15 download/update providers, including D2 hardware brands Intel/Nvidia/Dell/HP.
- ★ P1 addition: 15 cloud/CDN providers, including D4 certificate authorities DigiCert/GlobalSign/LetsEncrypt.
- ★ P1 addition: 13 Apple-service providers, including AppStore/AppleTV/Siri/TestFlight/FaceTime.
- ★ P1 addition: 13 developer providers, including Developer/Python/JetBrains/Oracle/WordPress.
- ★ P1 addition: Ten social providers, including Pixiv/VK/Imgur/Disqus.
- ★ P1 addition: Ten overseas-game providers, including Rockstar/Riot/GOG/Supercell/HoYoverse.
- ★ P1 addition: Eight collaboration providers, including Atlassian/Notion/TeamViewer/Salesforce.
- ★ P1 addition: Seven providers across Hong Kong/Taiwan/Southeast Asian/European streaming categories, as summarized by the historical entry.
- ★ P1 addition: Six search providers, including GoogleDrive/GoogleEarth/DuckDuckGo/Yandex/Scholar.
- ★ P1 addition: Six messaging providers, including regional Telegram IP ranges/GoogleVoice/Zalo.
- ★ P2 addition: PrivateTracker with 253 private-tracker rules at P0 precedence.
- ★ D0 decision: Skips Blizzard subgame sets covered by the parent Blizzard rules.
- ★ D1 decision: Splits Google subservices: Drive → search, FCM → downloads, Voice → IM.
- ★ D2 decision: Classifies hardware/consumer brands under download updates/overseas sites.
- ★ D3 decision: Classifies news media under overseas sites.
- ★ D4 decision: Classifies certificate-authority services under cloud/CDN.
- ★ D5 decision: Refresh step 25s → 10s.

Retains v4.5.8 → v4.5.9, with all fixes preserved:

Changes v4.5.7 → v4.5.8:
- ★ P0 fix: Removes fake-domain dead rule announce.php; DOMAIN-SUFFIX cannot match URL paths.
- ★ P0 fix: Places AWS domains before RULE-SET,amazon, preventing AWS Console capture by US streaming.
  - amazonaws.com/awsstatic.com → cloud/CDN.
  - aws.amazon.com/console.aws.amazon.com → developer services.
  - Removes corresponding dead rules in segment ⑱.
- ★ P0 fix: Places Google download domains before RULE-SET,google, preventing dl.google.com and others from entering search.
  - dl.google.com/play.googleapis.com/android.clients.google.com → downloads.
  - Removes corresponding dead rules in segment ⑱½.
- ★ P0 fix: Narrows live.com scope, preventing login.live.com/xbox.live.com capture by mail services.
  - DOMAIN-SUFFIX,live.com → DOMAIN,mail.live.com, retaining only the mail endpoint.
- ★ P1 fix: Splits naver.com into streaming subdomains, restoring the dead search.naver.com rule.
  - Segment ⑪ Japan/Korea streaming: naver.com → specific tv.naver.com/now.naver.com subdomains and others.
  - Segment ⑮ search: search.naver.com becomes effective again.
  - Broad naver.com moves to segment ㉑ overseas-site fallback.
- ★ P1 fix: Removes approximately ten redundant suffix dead rules within their blocks.
  - Segment ⑮ removes search.yahoo.com, covered by yahoo.com.
  - Segment ⑮ removes search.brave.com, covered by brave.com.
  - Segment ⑦⅔ removes tv.sohu.com, covered by sohu.com.
  - Segment ⑲½ removes seven government subdomains covered by go.id.
- ★ P2 fix: Uses deterministic node-name hashing for TLS fingerprints, avoiding fingerprint changes on long-lived WebSocket connections.
- ★ P2 fix: Changes Taiwan-node emoji from 🇨🇳 to 🇹🇼.
- ★ P2 addition: Adds GEOIP,ID fallback, symmetric with GEOIP,CN; moved into overseas sites in v5.1.5.

Retains v4.5.7:
- ★ P1 change: Removes `🏠 中国智能`, reducing Smart regional groups 10 → 9.
- ★ P1 change: Renames all `XX智能` groups to `XX节点`.

Retains v4.5.6:
- ★ P2 optimization: Staggers provider-refresh intervals in 25-second increments; the historical entry described zero concurrency, which is not a runtime scheduling guarantee.

Retains all fixes from v4.5.5 and earlier.
