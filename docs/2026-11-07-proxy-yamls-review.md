**English** | [中文](2026-11-07-proxy-yamls-review.zh-CN.md)

<a id="proxy_yamls-借鉴评估与离线检查"></a>

# PROXY_YAMLS adoption review and offline checks

Review date: 2026-11-07. Pinned upstream snapshot: [EdisonLe12/PROXY_YAMLS@61ebe346](https://github.com/EdisonLe12/PROXY_YAMLS/tree/61ebe3465672a0c2dd945a92f047e57d479c317b). Initial SCK comparison baseline: `5e28b84`; revalidated against `63c9d1d` after the QX fix before submission. This maintenance-tool update did not change client routing, DNS, policy groups or release versions.

<a id="结论"></a>

## Conclusions

Useful ideas include rejecting direct fallback for empty groups, stable manual selection with failover, multiplier awareness and separate treatment of push traffic. The two templates cannot directly replace SCK's multi-client rule graph or establish AEROVE Lite compatibility. Upstream provided no tests/CI or measurements; performance and stability descriptions are not acceptance evidence.

| Upstream design | Existing SCK behavior and decision |
| --- | --- |
| `empty-fallback: REJECT` | All three Mihomo JS variants already test global `REJECT` when no live nodes exist and omission of empty regional groups. Retain that mechanism; do not add unsupported fields to Stash/Meow. |
| Manual selection → Smart fallback | Potentially useful for stable exits and recovery, but adds group layers and Smart is not universally supported. Retain as a future option without changing the 22-region/33-service contract or promising IP continuity during failover. |
| Low-multiplier grouping and priorities | SCK already has optional `SCKI_MAX_NODE_MULTIPLIER` and explicit multiplier parsing. Low-price prioritization differs from a multiplier ceiling; defer the former pending a cross-client design instead of copying regexes or arbitrary weights. |
| Separate consideration of push, Apple/Microsoft and other traffic | Useful at service level; SCK already has service/DNS projections. A blanket China-direct preference cannot replace service-specific routing evidence. |
| Reusable rule sets and YAML anchors | SCK already has a source graph, MRS fusion and generators. Add offline auditing of effective fields after YAML expansion instead of searching raw source and reporting false positives. |

<a id="本次具体落地"></a>

## Implemented work

Added `tools/audit-upstream-mihomo.py`, a read-only offline audit of candidate Mihomo YAML. It reports broad controller listeners, embedded template authentication, effective disabled certificate verification, explicit direct fallback for empty groups, TUN exclusions and dangling rule-set references. It does not access subscriptions, print authentication values/subscription URLs/node names, or modify configuration. Parse failures do not echo source text that might contain secrets.

```sh
# Development dependency: Python 3 + PyYAML; not part of the client runtime
python tools/audit-upstream-mihomo.py --format mihomo path/to/config.yaml
python -m unittest discover -s tools/tests -p 'test_upstream_mihomo_audit.py' -v
```

Exit codes: `0` no listed findings, `1` items requiring human review, `2` input/dependency/parse failure. `1` does not confirm a vulnerability; `0` does not prove safety or import readiness. This is not a core schema validator, does not cover every TLS/DNS/routing risk, and does not support Egern schema. Verification with the target native core version and actual client remains necessary.

The pinned upstream scan produced four review items: broad listener, embedded controller secret, embedded proxy authentication and TUN exclusions. It did not find effective disabled provider certificate validation or dangling TUN references:

- `BaseProvider.override.skip-cert-verify: true` exists in the template anchor, but all four current providers define their own `override` mapping. YAML merge is shallow: each replaces the entire `override`. The anchor's TLS option therefore cannot be reported as currently effective. Removing those overrides later could reintroduce the risk.
- `Private-IP`, `Trackers-IP` and `China-IP` are defined in the template, so its references are not dangling. SCK dynamic overrides preserve `tun` but replace `rule-providers` during cleanup/fusion. Importing the whole template therefore requires auditing the **transformed output**, not just its source. Regression coverage includes references that are valid before replacement but invalid afterward; user TUN settings were not removed or changed.

<a id="不直接采纳的内容与误判边界"></a>

## Designs not adopted directly and false-positive boundaries

1. **Credentials and listeners:** fixed secrets/account passwords are not the user's credentials. `0.0.0.0:9090` establishes non-loopback listening, not public Internet exposure; reachability also depends on firewall/network settings.
2. **China-IP TUN exclusion:** traffic excluded from TUN no longer follows the normal rule list's ad blocking or user-selected exit constraints. This changes routing semantics rather than providing an unconditional performance optimization. Route-set fields and the `mips` stack also depend on the target core version.
3. **Multiplier misclassification:** the low-multiplier regex `0\.[1-8]` lacks numeric boundaries. It can match `0.1` inside `x10.1` or identical text in a node IP. Labels meaning download/experimental do not establish billing multipliers. SCK retains explicit parsing rather than importing this broad regex.
4. **Information-node filtering:** substrings such as `USE` can incorrectly match names such as `MUSE`; they cannot be applied to real nodes without boundaries. Regex engines differ in lookaround and inline case-flag support, so Mihomo/Egern expressions cannot be copied to every client.
5. **Meta → AI:** assigning the entire Meta rule set to AI would also affect ordinary Facebook/Meta traffic. A Muse-specific use case does not justify changing the entire service classification.
6. **Global DoH rejection:** rejecting `Category-DoH` or encrypted-DNS IPs can affect legitimate applications. A leak-prevention claim does not justify global blocking without service-specific verification. `no-resolve` controls whether IP-rule matching triggers resolution; it does not prove absence of every DNS leak.
7. **Special-purpose exits:** rejecting PikPak regional checks, direct downloads, personal domains and chained proxies are user-specific policies, not general defaults.

<a id="客户端与来源边界"></a>

## Client and source boundaries

Upstream contains only `OneSmartProMCX.yaml` (Mihomo Smart-oriented) and `IOS_Egern_Yaml.yaml` (Egern). Native Egern smart priorities/chaining differ from Mihomo weight semantics and cannot be transferred directly to Quantumult X, Surge, Stash, sing-box, Passwall or AEROVE Lite/Meow. Those clients were not run in this review; no new compatibility support is claimed.

The pinned commit has no LICENSE. The Mihomo file also credits original template author YYDS666 and links [666OS/YYDS](https://github.com/666OS/YYDS). This work records publicly observable designs/fields and independently implements audit logic; **it does not copy or redistribute upstream templates, regex implementations or rule collections**. Any later code/template port requires checking the original author's license and redistribution conditions. Attribution is not itself a license grant.

Field references: [Mihomo TUN](https://wiki.metacubex.one/config/inbound/tun/), [common policy-group fields](https://wiki.metacubex.one/config/proxy-groups/), [proxy providers](https://wiki.metacubex.one/config/proxy-providers/). These links support later target-version verification; this review did not write new fields into client artifacts.

<a id="验证记录"></a>

## Verification record

- Python unit tests: 10/10 passed, including effective shallow-merge behavior, no credential output, no false positives for loopback or empty collections, and reference differences before/after rule-set replacement.
- Existing subscription-node filtering tests: 73/73 passed, confirming established multiplier and empty-group protections.
- The pinned upstream YAML scan completed with four review items.
- The QX `running_mode_trigger` fix, client generated files, rule graph and existing worktree changes were not modified. This maintenance update did not create a formal Release.
