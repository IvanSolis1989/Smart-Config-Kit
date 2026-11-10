<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-claude-dependencies-mobile.svg">
  <img src="assets/readme/page-claude-dependencies.svg" width="100%" alt="Technical guide">
</picture>

<a id="claude-服务依赖台账与静态分流核验"></a>
# Claude service-dependency ledger and static routing checks

**English** | [简体中文](claude-service-dependencies.zh-CN.md)

Check the roles, evidence, and static first-match results for Claude network dependencies. To inspect existing receipts, start with the read-only commands under “Usage and receipts.”

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="Downloads"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="Documentation"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="Checks and troubleshooting"></a>
</p>

[Downloads](guide/downloads.md) · [Documentation](README.md) · [Checks and troubleshooting](guide/dns-and-verification.md)

<a id="使用入口"></a>
## Entry points

1. Identify the service stage and ledger scope, distinguishing required, optional, and unverified endpoints.
2. Run `node tools/validate-claude-service-dependencies.js --check` to read back the receipt.
3. To locate domain-coverage gaps, inspect first-match semantics and the limits of `--strict-coverage`.

Standalone validator version **1.0.0**. Official references checked on **2026-10-13**. This tool does not generate domain exceptions, change client policies, or access real accounts.

The authoritative inventory is [claude-service-dependencies.json](../rulesets/source/claude-service-dependencies.json); its generated receipt is [rulesets/generated/claude-service-dependencies.json](../rulesets/generated/claude-service-dependencies.json).

The inventory records endpoint roles. Routing facts still come from current fused outputs of `rulesets/source/routing-graph.js`.

<a id="服务阶段与证据"></a>
## Service stages and evidence

<a id="登录"></a>
### Login

- **Confirmed scope**: `claude.ai`, `claude.com`, `platform.claude.com`.
- **Acceptance boundary**: authentication, redirects, and OAuth; `anthropic.auth0.com` is only an unverified lead.

<a id="api"></a>
### API

- **Confirmed scope**: `api.anthropic.com`; feature-dependent connectors and Chrome bridge.
- **Acceptance boundary**: enterprise gateways and third-party model providers require separate checks against actual configuration.

<a id="上传"></a>
### Uploads

- **Confirmed scope**: Files API at `api.anthropic.com/v1/files`.
- **Acceptance boundary**: this does not verify every request host used by ordinary web uploads.

<a id="更新cdn"></a>
### Updates/CDN

- **Confirmed scope**: Code native-distribution hosts, Desktop’s official restricted host list, and controlled dynamic-content suffixes.
- **Acceptance boundary**: applicability depends on installation method, version, and feature; suffixes use finite synthetic-host witnesses.

<a id="遥测"></a>
### Telemetry

- **Confirmed scope**: two exact Datadog ingestion hosts.
- **Acceptance boundary**: telemetry can officially be disabled; blocking it does not imply core-service failure.

Official [Code network requirements](https://code.claude.com/docs/en/network-config#network-access-requirements) support login, API, update, bridge, and optional telemetry roles. [Desktop network requirements](https://code.claude.com/docs/en/desktop#network-access-requirements) list CDN/user-content hosts; the [Files API](https://platform.claude.com/docs/en/api/files/upload) specifies the upload address; [Data usage](https://code.claude.com/docs/en/data-usage#telemetry-services) explains telemetry opt-out and user-initiated feedback boundaries.

Each inventory entry has a source ID, evidence locator, evidence level, and review date.

`a-api.anthropic.com` and `a-cdn.anthropic.com` both appear in Desktop’s official restricted-access list. The documentation uses that list for application-code and user-content loading without assigning separate business paths to these two hosts. They are recorded as required Desktop network dependencies; the name `a-api` does not establish a particular API function.

The inventory’s exact allow policy is `🤖 AI 服务` (AI services). The static report shows the current earliest matching rule and policy. An earlier ad-rule match produces `policy-gap-pending-review`; it does not automatically change routing.

Prior research from [xiaolai](https://github.com/xiaolai/anthropic-claude-surge-rules-set/blob/1e88813a20eb4bb1e3c8612ea06a70e344837d22/domains.yaml) and [VPSDance](https://github.com/VPSDance/ai-proxy-rules/blob/43fab4082a0485d0988f452c8d16a0d6477ee35a/data/providers/anthropic.yaml) supplies pinned-version leads only.

This tool neither executes their code nor automatically imports their domains. Auth0, GrowthBook, Fathom, old Statsig hosts, and Sentry/Statsig vendor apex domains remain `pending-verification`. Old official documentation also does not prove that current versions use the same endpoint.

<a id="范围限制"></a>
## Scope limits

- Accept only exact hosts or officially confirmed dynamic-origin suffixes explicitly enumerated by the tool. Controlled suffixes are `claudeusercontent.com`, `claudemcpcontent.com`, `livepreview.claude.ai`, and `livepreview.claude.app`. They exclude the apex and do not establish availability of every subdomain.
- `storage.googleapis.com` is shared. Current official references cover plugin metadata, older native updates, and user-initiated feedback. Domain rules cannot distinguish buckets/URL paths. Its current policy is observed only; the entire shared Google service is not forced through AI routing.
- Datadog is shared ingestion infrastructure, and optional telemetry may be blocked. Discovering one Claude ingestion host does not justify allowing vendor suffixes such as `datadoghq.com`.
- Pending entries have no mandatory target policy and cannot justify exception generation. Third-party suffixes `sentry.io` and `statsigapi.net` are not imported; the ledger retains apex-domain leads only, without assuming a tenant.
- Ordinary web-upload hosts/paths, unknown vendor tenants, real account/region/TLS behavior, client updates, and sessions have not been tested.

<a id="首命中语义"></a>
## First-match semantics

<details>
<summary>Static model, unknown results, and coverage semantics</summary>

The report directly reuses `loadRepository` and `firstMatch` from [ordered-rule-semantics.js](../tools/lib/ordered-rule-semantics.js), not a separate matcher.

`domainProjection` checks domain-only conditions in full rule order, preserving rule position, provider, payload entry, and policy. It excludes non-domain conditions such as process/IP/port and does not treat `MATCH` fallback as domain coverage. A domain’s presence in a later AI set cannot override an earlier ad match.

`fullStatic` supplies only the known host, without inventing process, IP, or DNS results. Earlier potential non-domain matches remain `unknown`; `policy`/`hit` are then null, and `firstDecidableMatch` is only a later decidable candidate.

This is not actual client first-match evidence. See official Mihomo [Rules](https://wiki.metacubex.one/config/rules/) for semantics.

`coverage.ok` means only that finite domain witnesses for currently officially confirmed, non-shared required/conditional entries satisfy their allowed policy without unresolved domain conditions. Optional telemetry, shared hosts, and pending entries remain in the report but are not forced allowed. `service_health_proved` is always false.

</details>

<a id="使用与收据"></a>
## Usage and receipts

```powershell
node tools/validate-claude-service-dependencies.js
node tools/validate-claude-service-dependencies.js --json
node tools/validate-claude-service-dependencies.js --check
node tools/validate-claude-service-dependencies.js --check --strict-coverage
node --test tools/tests/claude-service-dependencies.test.js
```

Default output reports counts of known gaps, unknowns, and optional blocks. Success establishes only a valid inventory and reproducible report. `--check` reads the saved receipt and compares the complete rebuilt content, not service health. `--strict-coverage` additionally rejects required/conditional domain gaps or unresolved conditions, still without proving real-service acceptance. Every CLI mode is read-only, offline, and account-free.

The main generator can reuse an already loaded semantic model:

```javascript
const { buildReport, serialize } = require('./lib/claude-service-dependencies');
const report = buildReport(inventory, model);
// The main generator owns writing rulesets/generated/claude-service-dependencies.json.
fs.writeFileSync(reportPath, serialize(report), 'utf8');
```

The report includes `inventory_identity`, `semantic_identity`, and `report_identity`. Changes to inventory content, sources/roles, or any first-match input invalidate old readback receipts. `serialize` sorts object keys and emits LF without local absolute paths, floating generation times, or checkout paths, enabling comparisons across CI runs.

Source-review dates are fixed evidence dates, not automatically refreshed on each run.

Before maintaining the inventory, verify official roles/scope, then update sources/review dates and rebuild receipts. Routing fixes require separate explicit authorization and the full repository generation chain. This inventory alone does not trigger vendor allowlisting.
