<a id="mimo-issue-自动回复真实验收"></a>
# Real acceptance of MiMo automatic Issue replies

**English** | [简体中文](2026-10-16-mimo-issue-responder-acceptance.zh-CN.md)

> Privacy: local directories, random run/session identifiers and real subscription-source identities are redacted in this public record. Versions, test results, technical limitations and public CI links are retained.


Acceptance date: 2026-10-16 (Asia/Tokyo). Existing local Token Plan credentials were used with endpoint `https://token-plan-cn.xiaomimimo.com/v1`, matching the GitHub Actions `MIMO_BASE_URL` variable at that time. The model was `mimo-v2.6-flash`, with `thinking=enabled`.

<a id="对照结果"></a>
## Comparison results

| Request | HTTP / finish_reason | Actual delivery |
| --- | --- | --- |
| Original #186 + initial 89,826-byte editing context | 200 / content_filter | Filtered; this version was not submitted |
| Original #186 + analysis-only mode selected before the call from complete editing evidence | 200 / stop | Explained DoingDog retirement, jsDelivr’s 50MB limit, current raw URLs, and reimport steps |
| Small document target + complete maintenance contract still placed in user evidence | 200 / content_filter | Filtered |
| Same small-document task + complete maintenance contract in the developer message | 200 / stop | Complete AI_PATCH and Chinese AI_PR; full text matched after application by the production parser |

These records establish working request structures for these two ordinary tasks. They do not establish that every request avoids false rejection or identify the provider’s specific internal moderation rule. The original Issue and maintenance contract were not rewritten, substituted with redactions, or shortened to influence moderation. Editing tasks retained the complete maintenance contract verbatim.

<a id="186-生产入口分析"></a>
## Production-entry analysis for #186

- Call chain: `buildIssueContext` → `respond-ai-issue.js` → `callMiMo`.
- Request time: `2026-10-16T01:26:40.939Z`; completion time: `2026-10-16T01:27:30.273Z`.
- Complete API JSON: 27,217 bytes; repository context: 24,225 bytes. No complete editable target was available, so analysis-only mode was selected before calling. The full original Issue title and body were retained.
- `HTTP 200`, `finish_reason=stop`, `status=ok`, `hasPatch=false`.
- Response ID: `<redacted-local-identifier>`.
- Request SHA-256: `6bf2bb0278be9fd427ad717822b92e3116112ccbcd2f4eabe5d2ab121a1435f6`.
- Reply SHA-256: `40e53ed0845bb018a6f94a938a5744654564ad4503df439f18367d32e37ef90b`.

Acceptance readback confirmed separate explanations of retired DoingDog sources and the CDN repository-size limit, references to supplied `docs/rule-asset-delivery.md` and configuration excerpts, and steps to reimport official configurations/refresh rules. The reply explicitly did not claim to have made the HTTP request in question or report device success. Current configurations already contained the fix, so no unnecessary patch was generated.

Independent review found over-escaped double backslashes in an accompanying `grep` regex. That command example was not counted as a verified executable pass. Root-cause explanation, reimport guidance, and the actually applied document patch below were checked separately; extra generated commands still require maintainer review.

<a id="小文档补丁与保存读回"></a>
## Small document patch and saved readback

Task: change only the first line of actual `docs/README.md` from `# docs` to `# 文档索引` (“Documentation index”), retaining all other content and both relative links. The real repository target was not written; model output was applied only to a temporary copy.

- Production context contained exactly the complete `AGENTS.md` and complete `docs/README.md`, 67,331 bytes. The contract used the officially supported `developer` role; document evidence and the specific user task used `user`.
- Request time: `2026-10-16T01:29:30.587Z`; completion time: `2026-10-16T01:29:48.912Z`.
- Complete API JSON: 71,770 bytes; `HTTP 200`, `finish_reason=stop`, `status=ok`, `hasPatch=true`.
- Response ID: `<redacted-local-identifier>`.
- Request SHA-256: `e7762b2fe38449c3d2843ee64f707bf494eec37c2c0017a2f310ef7e4eb4d88a`.
- Reply SHA-256: `9c0bba16e77301abb6a64683258a5cb5ac98dc7d49addb068e79a9964192e112`.

`tools/test-ai-issue-live.js` extracted the actual Python patch program from the current workflow, executed it on the temporary copy, and read the result back. The changed-file list was exactly `docs/README.md`; the full file matched expectations. Comparison normalized only CRLF/LF and the final newline. Expected and actual SHA-256 were both `c95042dc00ca79cf008ce05ff041f896d01675cea442841f58186ad2b7f2c966`.

A separate ordinary JavaScript control task returned a fixed function using `reduce(..., 0)`. After review, executing it with `[]`, `[1,2,3]`, and `[-1,1]` returned `0`, `6`, and `0` respectively.

<a id="证据保存与范围"></a>
## Evidence retention and scope

Complete local replies, context, and JSON receipts were saved in system temporary directory `<local-evidence-directory>`; successful receipts are under `production-acceptance/issue-186/` and `developer-contract-acceptance/docs-title/`. Temporary evidence contains no API keys or model reasoning fields and was not added to Git. This report retains reviewable conclusions and hashes.

No Issue comments were published, no cloud workflow that posts comments was triggered, and no code was pushed or PR created. Real calls establish acceptance and artifact delivery at the local endpoint. GitHub Secret account status, cloud execution, and future requests remain subject to their own actual results.
