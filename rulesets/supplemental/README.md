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

## Routing audit CA and Microsoft mail exceptions

The 2026-10-04 logged routing audit records shared certificate-status endpoints misclassified by Apple vendor keywords and Microsoft mail category collisions. Its source evidence is retained in [the historical audit](../../docs/research/2026-10-04-routing-priority-audit.md). The four exact hosts crl3.digicert.com, crl4.digicert.com, ocsp.digicert.com, and ocsp.sectigo.com use DIRECT; sibling CA hosts are not exempted. mail.live.com and the bounded outlook.live.com suffix retain the reviewed foreign-mail category. Registry records include positive and negative boundary examples; the regression named confirmed routing audit collisions retain their declared business policy also preserves game/Microsoft advertising rejection. These finite checks do not establish live traffic behavior.

## WeChat connection endpoint exceptions

`clash/adfp-direct.list` protects only the exact `DOMAIN` hosts `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, and `hkshort.weixin.qq.com` with DIRECT before the ad feeds. Tencent's first-party [WeChat service-discovery response](https://dns.weixin.qq.com/cgi-bin/micromsg-bin/newgetdns) lists all three connection endpoints; the captured response, hash and [Huawei's independent connection allowance](https://support.huaweicloud.com/qiankuncmn-qiankuncs/qiankuncs_cmn_uaa_01_1011.html) for `szlong.weixin.qq.com` are documented in the [bounded Issue #187 review](../../docs/research/2026-10-16-wechat-issue-187.md).

These exceptions do not cover `weixin.qq.com` or child hosts. The advertising neighbours `ad.weixin.qq.com` and `log.weixin.qq.com` remain rejected. The regression checks first-match policy and matching boundaries; the reporter's real-device recovery still requires verification after reloading the configuration.
