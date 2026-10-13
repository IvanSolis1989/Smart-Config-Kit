# Supplemental Rule Sets

This directory contains small repository-owned rule sets for manual overrides
that should not stay as scattered inline rules in product profiles.

- `clash/`: Clash classical syntax. Used by Mihomo, CMFA, OpenClash, Stash,
  Shadowrocket, Surge, Loon, and the SingBox generator expansion path.
- `surge/`: Surge Mac-only process rules. Mobile profiles do not consume these.
- `quantumultx/`: Quantumult X native lowercase syntax for remote filters.
- `egern/`: Egern native YAML rule-set syntax generated from `clash/` by
  `tools/generate-egern-supplemental.js`. Process rules are skipped because
  Egern does not expose Clash-style `PROCESS-NAME`.

Rules here intentionally omit policy targets. Each product binds the rule set to
the correct policy in its own syntax.

`clash/local-process-direct.list` is the exact-name Windows desktop direct
whitelist. `WorkPro.exe` and `WorkProWebProcess.exe` are repository-maintained entries guarded by
`tools/fixtures/process-name-direct-tools.json` so it cannot be lost during a
future fused-rule rebuild.

`adfp-*.list` files are deliberately narrow false-positive guards that run
before broad ad/privacy feeds. `adfp-ai.list` protects verified ChatGPT
telemetry hosts whose parent Sentry or Datadog domains occur in those feeds.

`adfp-ai.list` also protects the exact Claude Desktop hosts
`a-api.anthropic.com` and `a-cdn.anthropic.com`. Anthropic lists both in its
[Desktop network requirements](https://code.claude.com/docs/en/desktop#network-access-requirements)
for loading application code and user content (checked 2026-10-13). The current
ad feed otherwise matches both before the general AI providers. These exact
exceptions do not exempt other Anthropic subdomains or optional telemetry.

Inline single rules in main product files are allowed only when the rule cannot
be represented safely as a supplemental rule set, such as port rules, logical
AND/OR/NOT rules, platform-local syntax traps, or documented engine gaps.
