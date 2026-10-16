# MiMo Issue 自动回复真实验收

验收日期：2026-10-16（Asia/Tokyo）。使用本机已有 Token Plan 凭据，端点为 `https://token-plan-cn.xiaomimimo.com/v1`，与当时 GitHub Actions 的 `MIMO_BASE_URL` 变量一致。模型为 `mimo-v2.6-flash`，`thinking=enabled`。

## 对照结果

| 请求 | HTTP / finish_reason | 实际交付 |
| --- | --- | --- |
| #186 原文 + 首版 89,826-byte 修改上下文 | 200 / content_filter | 被过滤，未提交该版本 |
| #186 原文 + 调用前按完整编辑证据决定仅分析 | 200 / stop | 解释 DoingDog 退役、jsDelivr 50MB 限制、当前 raw 地址和重新导入步骤 |
| 小文档目标 + 完整维护契约仍放在 user 证据中 | 200 / content_filter | 被过滤 |
| 同一小文档任务 + 完整维护契约放入 developer 消息 | 200 / stop | 完整 AI_PATCH、中文 AI_PR；生产解析程序应用后全文一致 |

这些记录表明本次两个正常任务存在可工作的请求结构，不能由此推断所有请求均不会误拒，也不能确定供应商内部具体命中了哪条审核规则。原始 Issue 与维护契约未改写、脱敏替换或删减以影响审核；有编辑任务时维护契约全文逐字保留。

## #186 生产入口分析

- 调用链：`buildIssueContext` → `respond-ai-issue.js` → `callMiMo`。
- 请求时间：`2026-10-16T01:26:40.939Z`，完成时间：`2026-10-16T01:27:30.273Z`。
- 完整 API JSON 为 27,217 bytes，仓库上下文为 24,225 bytes。没有完整可编辑目标，所以在调用前选择仅分析；保留完整原始 Issue 标题与正文。
- `HTTP 200`、`finish_reason=stop`、`status=ok`、`hasPatch=false`。
- 响应 ID：`d9587459-3c06-45ba-a7b1-2f1e5247ede8_131a38ef85b8483e9a294b9e578c877a`。
- 请求 SHA-256：`6bf2bb0278be9fd427ad717822b92e3116112ccbcd2f4eabe5d2ab121a1435f6`。
- 回复 SHA-256：`40e53ed0845bb018a6f94a938a5744654564ad4503df439f18367d32e37ef90b`。

验收读回确认：分别说明旧 DoingDog 来源退役和 CDN 仓库大小限制，引用已提供的 `docs/rule-asset-delivery.md` 与配置片段，给出官方配置重新导入/刷新规则步骤，明确没有执行本次 HTTP 请求，不报告真机成功。当前配置已有修复，因此没有生成多余补丁。

独立复核发现回复附带的 `grep` 正则有双反斜杠过度转义；该命令示例不属于已验证可执行的通过项。根因解释、重新导入指导及下述实际应用的文档补丁已分别核验，生成的额外命令仍需维护者审读。

## 小文档补丁与保存读回

任务：仅将真实 `docs/README.md` 的第一行 `# docs` 改为 `# 文档索引`，保留其它内容和两个相对链接。真实仓库目标文件不写入；模型产物只应用到临时副本。

- 生产上下文恰含完整 `AGENTS.md` 与完整 `docs/README.md`，67,331 bytes；契约使用官方支持的 `developer` 角色，文档与具体用户任务使用 `user` 角色。
- 请求时间：`2026-10-16T01:29:30.587Z`，完成时间：`2026-10-16T01:29:48.912Z`。
- 完整 API JSON 为 71,770 bytes；`HTTP 200`、`finish_reason=stop`、`status=ok`、`hasPatch=true`。
- 响应 ID：`f4c555d6-a29a-4daa-995c-f14ebf8a3027_63020818d0db4fdcb73387aaf013ea4a`。
- 请求 SHA-256：`e7762b2fe38449c3d2843ee64f707bf494eec37c2c0017a2f310ef7e4eb4d88a`。
- 回复 SHA-256：`9c0bba16e77301abb6a64683258a5cb5ac98dc7d49addb068e79a9964192e112`。

`tools/test-ai-issue-live.js` 从当前 workflow 提取实际 Python 补丁程序，在临时副本执行并读回：实际修改清单恰为 `docs/README.md`，完整文件与预期相等。比较仅规范化 CRLF/LF 及末尾换行；预期与实际 SHA-256 均为 `c95042dc00ca79cf008ce05ff041f896d01675cea442841f58186ad2b7f2c966`。

此外，普通 JavaScript 控制任务真实返回了带 `reduce(..., 0)` 的修复函数；审读后执行 `[]`、`[1,2,3]`、`[-1,1]` 三个输入，结果分别为 `0`、`6`、`0`。

## 证据保存与范围

本机完整回复、上下文与 JSON 收据保存在系统临时目录 `scki-mimo-live-20261016-102254-3564e89d`，其中成功收据分别位于 `production-acceptance/issue-186/` 与 `developer-contract-acceptance/docs-title/`。临时证据不含 API key 或模型推理字段，未纳入 Git；本报告保存可复核的结论与哈希。

本次没有发布 Issue 评论、触发会发评论的云端 workflow、推送代码或创建 PR。真实调用证明本机端点下的请求被接受并交付产物；GitHub Secret 的账户状态、云端运行和未来请求仍以各次真实结果为准。
