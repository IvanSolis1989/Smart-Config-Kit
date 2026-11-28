**English** | [简体中文](2026-11-28-blackmatrix7-source-resilience.zh-CN.md)

# Blackmatrix7 rule-source resilience

Reviewed on 2026-11-28 against `485453aa06f94db8453209a125f204c9fd0553a1`. GitHub marks the upstream repository as archived. Its default branch ends at `0b6897dc`. The current release continues to use validated fused assets. Migrate by service and record the bytes and source of each new input. [Archived repository](https://github.com/blackmatrix7/ios_rule_script) · [Frozen source](https://github.com/blackmatrix7/ios_rule_script/tree/0b6897dc17e0c513d25449c935a9694818e32f0c)

## Exposure

Blackmatrix7 supplies 245 of 401 raw providers, corresponding to 326 of 525 normalized entries. All 245 map to direct source-rule references in the fused segments across 28 policies. For 243 providers the available receipts cover legacy outputs. Two are content-addressed. None binds an original input to an upstream commit. Optimization and first-match order determine which predicates actually survive and win. [Source ledger](../../rulesets/generated/source-ledger.json) · [Fused manifest](../../rulesets/generated/fused/manifest.json)

| Priority services | Raw providers | Evidence to retain in migration |
| --- | ---: | --- |
| Ad blocking | 10 | Legitimate domains that must work and blocking witnesses |
| Payments | 4 | Order and scope for payment, authentication, and shared CDNs |
| AI | 3 | Separate evidence for login, API, preview, content, and telemetry |
| Apple, Google, Microsoft | 9, 3, 1 | Account, updates, push notifications, and service endpoints |
| Updates and downloads, tools and services | 12, 15 | Distribution, app login, and shared hosting |
| Mainland Chinese streaming | 41 | Mainland CDN and international service checks before the long tail |

The pinned MetaCubeX workflow contains 26 literal Blackmatrix7 raw references. They include lite files for Google, GitHub, Apple, Microsoft, OpenAI, and Netflix. Some paths also feed China domain selection and other preprocessing. Alternate transports improve availability while these categories still depend on the same archived origin. The workflow establishes the relationships and build receipts establish consumed bytes. [MetaCubeX workflow](https://github.com/MetaCubeX/meta-rules-dat/blob/4178770badecb1b349fbcd62c737e0d7a2079729/.github/workflows/run.yml)

## Claude pilot

The comparison uses 18 finite host witnesses with official evidence and an AI-only expected policy. The standalone lists were evaluated for domain predicate coverage. The current fused baseline was evaluated for static first match. Additional witnesses covered telemetry, shared services, and synthetic scope checks. [Project service registry](../../rulesets/source/claude-service-dependencies.json) · [Claude Code network requirements](https://code.claude.com/docs/en/network-config#network-access-requirements) · [Claude Desktop network requirements](https://code.claude.com/docs/en/desktop#network-access-requirements)

| Input | Hits out of 18 | Evidence and scope |
| --- | ---: | --- |
| Current Smart-Config-Kit | 18 | Static first match is AI. Shared `storage.googleapis.com` still uses the Google policy. |
| Blackmatrix7 Claude | 11 | Three domain predicates. The list matches the unverified Fathom host, which currently reaches the ad block policy first. [Pinned list](https://github.com/blackmatrix7/ios_rule_script/blob/0b6897dc17e0c513d25449c935a9694818e32f0c/rule/Clash/Claude/Claude.yaml) |
| v2fly Anthropic | 18 | MIT repository. Useful for discovery. Its broad `claude.app` suffix matches a synthetic non-preview subdomain, and the list includes third-party telemetry. [Pinned list](https://github.com/v2fly/domain-list-community/blob/f68dab92e2ce656bbd81a4ae424de79b179f0f77/data/anthropic) |
| ma-wenqian Claude | 17 | MIT repository. Misses the `*.livepreview.claude.app` witness and includes shared Segment suffixes and wider IP ranges. IP rules are outside this domain projection. [Pinned list](https://github.com/ma-wenqian/ai-proxy-rules/blob/b8054cd055813f9a1b04f5113eef3f0ca13022f2/rules/claude.list) |

VPSDance imports the v2fly Anthropic list, so overlaps between them share a source. A pilot migration can use verified exact hosts and officially scoped suffixes from the service registry. Compare a single provider's frozen inputs and check required first matches, shared services, and telemetry before testing real client operation. The synthetic `unrelated.claude.app` host already reaches AI in the current fused baseline, through `DOMAIN-KEYWORD,claude`. That broad keyword also merits a scope regression check. This pilot preserves the existing production rules. [VPSDance source declaration](https://github.com/VPSDance/ai-proxy-rules/blob/8e4fadcb035738b0f80f1379b501723ee39490f8/data/sources/anthropic.yaml)

## Reproduce the exposure audit

Run `node tools/audit-blackmatrix7-exposure.js` from the baseline. It emits JSON with each source, hash state, normalized entries, policies, and fused segments. Pass a saved MetaCubeX workflow as the optional argument to include literal upstream references and destination paths.

The registry now records the Accademia, szkane, and MiHomo-Hagezi repository LICENSE files with their commit, byte count, SHA-256, and license name. Review upstream components under their own terms. [License registry](../../rulesets/source/upstream-sources.json)
