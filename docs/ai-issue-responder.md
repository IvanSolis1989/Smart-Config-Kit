# Issue 自动回复维护说明

入口是 [ai-responder.yml](../.github/workflows/ai-responder.yml)。标签触发首轮 `mimo-v2.6-flash` 分析；维护者、成员或协作者评论 `/ai-help` 后使用 `mimo-v2.6-pro`。自动回复仅供参考，合并与关闭仍由维护者决定。

## 请求与上下文

- `tools/build-ai-issue-context.js` 根据客户端和故障关键词选取仓库文件，不再载入关联目录内的全部配置、规则载荷、历史日志与参考文档。片段带路径、行号和省略说明，URL 与错误信息保留原意。
- 可改代码模式必须包含完整 `AGENTS.md`，全文放入 API 的 `developer` 消息。Issue 与追问放入独立的 `user` 消息；不将维护契约当成用户请求实施的全部功能。
- 若没有完整可编辑目标，调用前直接选择仅分析模式；若契约缺失或超出预算，禁用补丁。此决定取决于文件证据，不由供应商过滤结果驱动。补丁只能针对上下文中完整提供的文件；任一补丁文件不完整时整组拒绝应用。
- 明确提及的 1–2 个 `docs/*.md` 小文档可完整提供；纯文档任务只加载维护契约和目标文档。超出预算的文档继续标明片段，禁止据此整文件替换。
- `tools/respond-ai-issue.js` 调用 `tools/lib/ai-issue-responder.js`，将 Issue 和追问作为数据传入。提示词以 `rulesets/source/routing-graph.js` 为规则权威源，要求结论有证据、不猜测网络请求结果。
- 初始仓库上下文上限为 96 KiB，包含可选搜索摘录后的调用入口再检查 112 KiB 上限。输出 token 上限包含模型推理，截断回复不能用于修改文件。

## 端点与凭据

Actions Secret `MIMO_API_KEY` 必填。`MIMO_BASE_URL` 优先读取 Actions Variable，兼容同名 Secret；未设置时保留现有的 `https://token-plan-cn.xiaomimimo.com/v1` 默认值。

Token Plan 应使用控制台提供的专属 Base URL 和对应 key；按量付费 key 应显式设置 `https://api.xiaomimimo.com/v1`。手动实测可使用本机环境变量 `MIMO_TOKEN_PLAN_API_KEY`；凭据只用于请求鉴权，不写入产物或日志。

## 过滤和调用失败

依照 [MiMo Chat Completions 文档](https://mimo.mi.com/docs/zh-CN/api/chat/openai-api)检查 `choices[0].finish_reason`：`stop` 才是完整回复，`content_filter` 是内容过滤，`length` 是未完成。兼容检查 `message.refusal`，并识别 #186 实际出现的整段 high-risk 拒答文本。[官方错误码](https://mimo.mi.com/docs/zh-CN/api/guidance/error-codes)还明确区分 HTTP `421` 内容拦截、`401` 认证错误及 `429` 限流。

过滤时发送中文未完成说明，禁止补丁或 PR，并在发布说明后将 job 标记为失败。不会将供应商拒答当作技术分析，也不会声称用户问题已经被确认有风险。

过滤和认证失败不重试。超时、连接错误、HTTP 429 或 5xx 最多以相同请求重试一次；不通过改变模型、端点或输入含义来绕开过滤。日志和 job summary 仅记录状态、HTTP 状态码、完成原因、受限格式的错误码和请求 ID，不记录凭据、请求全文、响应全文或模型推理。结果经 runner 临时文件传递，避免任意回复进入固定分隔符的 `GITHUB_OUTPUT`。文件方式与外部输入通过环境变量传递分别参照 [GitHub workflow commands](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)及 [secure use](https://docs.github.com/en/actions/reference/security/secure-use)。

## #186 的已知证据与验收边界

[运行 38619558065](https://github.com/IvanSolis1989/Smart-Config-Kit/actions/runs/38619558065)的调用与发布步骤成功，机器人正文却只有 high-risk 拒答；#182、#183、#184 也有同样现象。旧代码仅提取 `message.content`，没有留存 HTTP 状态与完成原因，因此不能从旧日志确定供应商在何处做出过滤决定，也不能证明哪个词或文件触发过滤。

2026-10-16 已真实调用 `mimo-v2.6-flash`，完成 #186 原文分析以及小文档完整补丁任务。后者使用 workflow 的同一段 Python 程序在临时副本应用，读回全文与预期一致；详见[实测收据与边界](research/2026-10-16-mimo-issue-responder-acceptance.md)。测试没有向公开 Issue 发评论或创建 PR；GitHub Actions 云端运行仍需在发布后验证。

```bash
node --test tools/tests/ai-issue-*.test.js tools/tests/ai-responder-workflow.test.js
```

以下命令会实际调用 MiMo 并产生 API 用量，默认将证据写入系统临时目录。只在显式授权的手动验收中执行，离线 CI 不调用它：

```bash
node tools/test-ai-issue-live.js
node tools/test-ai-issue-live.js --case docs-title --output /tmp/mimo-docs-acceptance
```

真实验收要求模型交付具体分析或完整补丁；仅 HTTP 200、回复非空或声称愿意回答均不足。文档任务只在临时副本应用，不修改真实 `docs/README.md`。

独立工作流 `validate-ai-responder.yml` 在回复器及其测试变动时执行以上离线检查。本次只涉及自动化工具，不变更路由规则、客户端行为或产物版本，不触发客户端全量重新生成。
