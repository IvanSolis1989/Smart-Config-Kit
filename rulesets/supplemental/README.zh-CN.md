[English](README.md) | **中文**

<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/zh-CN/page-rules-source-mobile.svg">
  <img src="../../docs/assets/readme/zh-CN/page-rules-source.svg" alt="补充规则集：按客户端语法维护的仓库规则与有界例外" width="100%">
</picture>

# Supplemental Rule Sets

This directory contains small repository-owned rule sets for manual overrides
that should not stay as scattered inline rules in product profiles.

[![文档中心](../../docs/assets/readme/zh-CN/nav-docs.svg)](../../docs/README.md) [![配置下载](../../docs/assets/readme/zh-CN/nav-downloads.svg)](../../docs/guide/downloads.md)

文档中心：[docs/README.md](../../docs/README.zh-CN.md) · 配置下载：[downloads.md](../../docs/guide/downloads.zh-CN.md)

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

`adfp-ai.list` 在广泛的广告规则前放行 Copilot 的精确建议接口 `origin-tracker.githubusercontent.com`。GitHub 将它列入 [Copilot 建议接口放行清单](https://docs.github.com/en/copilot/reference/copilot-allowlist-reference#specific-required-domains)，并说明 [GHE.com 的公开代码检测](https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-allowlist-reference#copilot-on-ghecom) 需要访问这个主机。上一版在它到达业务规则前就拦截了它。Copilot 的独立统计主机仍由广告规则处理。

Inline single rules in main product files are allowed only when the rule cannot
be represented safely as a supplemental rule set, such as port rules, logical
AND/OR/NOT rules, platform-local syntax traps, or documented engine gaps.

## Routing audit CA and Microsoft mail exceptions

The 2026-10-04 logged routing audit records shared certificate-status endpoints misclassified by Apple vendor keywords and Microsoft mail category collisions. Its source evidence is retained in [the historical audit](../../docs/research/2026-10-04-routing-priority-audit.zh-CN.md). The four exact hosts crl3.digicert.com, crl4.digicert.com, ocsp.digicert.com, and ocsp.sectigo.com use DIRECT; sibling CA hosts are not exempted. mail.live.com and the bounded outlook.live.com suffix retain the reviewed foreign-mail category. Registry records include positive and negative boundary examples; the regression named confirmed routing audit collisions retain their declared business policy also preserves game/Microsoft advertising rejection. These finite checks do not establish live traffic behavior.

## WeChat connection endpoint exceptions

`clash/adfp-direct.list` protects only the exact `DOMAIN` hosts `szlong.weixin.qq.com`, `hklong.weixin.qq.com`, and `hkshort.weixin.qq.com` with DIRECT before the ad feeds. Tencent's first-party [captured WeChat service-discovery response](../../docs/research/2026-10-16-wechat-issue-187.zh-CN.md) lists all three connection endpoints; the captured response, hash and [Huawei's independent connection allowance](https://support.huaweicloud.com/qiankuncmn-qiankuncs/qiankuncs_cmn_uaa_01_1011.html) for `szlong.weixin.qq.com` are documented in the [bounded Issue #187 review](../../docs/research/2026-10-16-wechat-issue-187.zh-CN.md).

These exceptions do not cover `weixin.qq.com` or child hosts. The advertising neighbours `ad.weixin.qq.com` and `log.weixin.qq.com` remain rejected. The regression checks first-match policy and matching boundaries; the reporter's real-device recovery still requires verification after reloading the configuration.

## Issue #203 钉钉与豆包兼容性例外

`clash/adfp-direct.list` 在广告规则前仅对 `static.dingtalk.com` 和 `mcs.doubao.com` 做精确直连。[Issue #203](https://github.com/IvanSolis1989/Smart-Config-Kit/issues/203) 报告两个域名被拒绝时图片加载失败。冻结的 HaGeZi Ultimate 输入和生成规则都能复现拦截。[钉钉 CLI 讨论](https://github.com/DingTalk-Real-AI/dingtalk-workspace-cli/issues/273) 记录了 `static.dingtalk.com/media/` 图片链接。

[HaGeZi #7801](https://github.com/hagezi/dns-blocklists/issues/7801) 将 `mcs.doubao.com` 分类为遥测。本次针对报告做兼容性放行，该主机的遥测请求也可以通过。豆包图片加载是否恢复仍需在报告者的客户端验证。两个例外仅覆盖上述主机名，`log.doubao.com` 和 `resolver.dingtalk.com` 继续拦截。
