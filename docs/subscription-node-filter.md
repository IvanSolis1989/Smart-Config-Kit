<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-subscription-node-filter-mobile.svg">
  <img src="assets/readme/page-subscription-node-filter.svg" width="100%" alt="Technical guide">
</picture>

<a id="订阅节点预检与倍率筛选"></a>
# Subscription-node preflight and multiplier filtering

**English** | [简体中文](subscription-node-filter.zh-CN.md)

Set a node multiplier limit for JS and OpenClash overrides, understand preflight rejections, and check the supported scope of inline providers.

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="Downloads"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="Documentation"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="Checks and troubleshooting"></a>
</p>

[Downloads](guide/downloads.md) · [Documentation](README.md) · [Checks and troubleshooting](guide/dns-and-verification.md)

<a id="使用入口"></a>
## Entry points

1. Set a limit in local JS options or the OpenClash invocation environment. Multiplier filtering is disabled by default.
2. Refresh the subscription. If rejected, first resolve duplicate names, dialer dependencies, or unsupported provider fields.
3. Flatten HTTP/file providers with Sub-Store before dynamic regional classification.

Clash Party Smart / Normal, FlClash, and OpenClash Smart / Normal share the same semantics: validate subscription nodes before generating the repository’s regional groups, service groups, rules, and DNS. By default, all node multipliers are retained; informational entries are removed only when they match explicit announcement patterns.

<a id="配置倍率上限"></a>
## Set a multiplier limit

The local option in JS overrides defaults to:

```javascript
const SCKI_MAX_NODE_MULTIPLIER = null
```

Set it to `2` to exclude nodes above a 2× multiplier. Nodes at exactly 2× remain. The value is read only from the script you maintain; the subscription provider cannot set it. Keep a local copy when using URL-based script updates so your custom options are retained.

The OpenClash environment variable defaults to empty, meaning disabled:

```sh
SCKI_MAX_NODE_MULTIPLIER=2 bash /etc/openclash/overwrite/OpenClash\(mihomo\).sh /path/to/subscription.yaml
```

When OpenClash launches the script, set the variable at the local override invocation. The limit must be a finite positive number; invalid values reject the operation. It is not a LuCI UCI configuration key.

Parsing accepts explicit multiplier labels such as `x2`, `2x`, `×0.5`, `2倍`, and `倍率2`. Ordinary regional numbers, ports, and IP addresses are not multipliers. Missing labels, zero multipliers, and conflicting labels are retained; billing multipliers are not inferred from latency or route names. Parsed values are declarations in node names only; actual billing follows the provider’s terms.

<a id="预检与引用"></a>
## Preflight and references

Exactly equivalent duplicate nodes retain the first object. Identically named nodes with different configurations reject the operation; resolve identity ambiguity at the subscription aggregator first. Conflicts with repository group names or built-in policies, and node-field types that cannot be handled safely, also reject processing. JS preserves the original subscription object; OpenClash does not write back to the source YAML. Whether the original subscription works still depends on its own validity.

Logs record reasons and counts only, not node endpoints, names, or credentials.

Nodes are not automatically renamed. Retained nodes’ `dialer-proxy` references must remain resolvable. If filtering would remove a dependency, or a chain contains a self-reference or cycle, processing is rejected. Adjust the limit or fix the chain in the aggregation layer before retrying. Valid multihop chains remain. If all nodes are filtered out, the global group explicitly uses `REJECT`, rather than relying on the default fallback of an empty health-check group.

Valid route names containing IPLC, IEPL, relay, Telegram, or similar terms are retained; those terms alone do not identify an announcement.

Named `type: direct` / `type: reject` entries are support outbounds: their objects and `dialer-proxy` references are preserved, but they are not candidates for global, regional, or residential health-check groups, nor sources of node-server domains. If only support outbounds remain, the global group uses `REJECT`. Built-in names, including `PASS-RULE`, cannot be subscription-node names.

<a id="inline-代理集合"></a>
## Inline proxy providers

The five scripts can directly handle providers containing only `type: inline` and `payload`, for example:

```yaml
proxy-providers:
  local:
    type: inline
    payload:
      - name: HK Example
        type: trojan
        server: node.example.com
        port: 443
        password: YOUR_PASSWORD
```

With inline providers, `proxies` may be omitted. Explicit nodes come first, followed by providers flattened in input iteration order. All candidates share duplicate-name, multiplier, and dialer-chain checks; surviving nodes enter the existing regional classification and node-DNS handling. Payload nodes are copied independently so subsequent fingerprint settings do not mutate externally shared objects.

Nodes are written and flattened providers removed only after preflight succeeds. An empty payload produces global `REJECT`, not a health-check group that defaults to direct traffic.

Each inline provider accepts only the two fields above. `filter`, `exclude-filter`, `exclude-type`, `override`, `health-check`, `url`, `path`, `interval`, and any unknown field reject the entire operation rather than silently discarding their semantics. An explicit empty array without providers retains each client’s original entry-point behavior.

HTTP/file `proxy-providers`, or providers with extra fields, must first be flattened into `proxies` using [Sub-Store](../SubStore/README.md). Dynamic regional groups need actual node names. A remote URL alone cannot provide equivalent classification, chain checks, or node-specific DNS projection during script execution.

Preflight preserves the original configuration and requests flattening. It does not silently select only explicit nodes from mixed input while omitting remote providers.

<a id="适用端与维护"></a>
## Client scope and maintenance

<details>
<summary>Maintainers: per-client scope, shared source, and official references</summary>

Inline flattening and preflight run in the five subscription-processing scripts. CMFA’s native provider groups must also distinguish support outbounds, using group-level `exclude-type: direct|reject` and `empty-fallback: REJECT` while preserving dialer dependencies inside providers.

Stash has no documented equivalent fields. Its health-check providers should contain only remote proxies; place required named direct support outbounds in separate top-level `proxies`, and verify all dialer references in the aggregation layer. Empty providers/groups remain subject to Stash’s default direct-routing semantics.

See the [follow-up study](research/2026-09-30-routing-runtime-followup.md) for complete per-client analysis and actual-core evidence.

The rule authority remains `rulesets/source/routing-graph.js` v6.0.14; fused rules and release cache keys are unchanged. Shared node-filter source lives in `tools/runtime/subscription-node-filter.js` and `.rb`. After changes, run the corresponding synchronization tools and inspect embedded blocks in actual client scripts to prevent drift across the three JS and two Ruby copies.

Official semantics: [Mihomo proxy groups](https://wiki.metacubex.one/config/proxy-groups/) (`proxies`, `use`, `include-all-proxies`, `exclude-type`, `empty-fallback`), [proxy providers](https://wiki.metacubex.one/config/proxy-providers/) (`type: inline` / `payload`), [named direct outbounds](https://wiki.metacubex.one/config/proxies/direct/), and [dialer-proxy](https://wiki.metacubex.one/en/config/proxies/dialer-proxy/).

The multiplier limit is parsed by the script and introduces no new core configuration field.

</details>
