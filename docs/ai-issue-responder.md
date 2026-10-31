<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-ai-issue-responder-mobile.svg">
  <img src="assets/readme/page-ai-issue-responder.svg" width="100%" alt="技术指南">
</picture>

# Issue 自动回复维护说明

从触发入口、凭据配置到失败处理，维护 Issue 自动回复器。先按下方顺序定位，再查看上下文与验收边界。

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="下载配置"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="文档目录"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="检查与排障"></a>
</p>

[下载配置](guide/downloads.md) · [文档目录](README.md) · [检查与排障](guide/dns-and-verification.md)

## 使用入口

当前处理后端由仓库 Actions Variable `LOCAL_CODEX_ENABLED` 选择：设为 `true` 时使用本机 Codex，旧 MiMo 自动回复器跳过；其他值继续使用下文的 MiMo 路径。两套处理器互斥，避免同一 Issue 产生两份补丁和回复。

### 本机 Codex 自动处理

`local-codex-issue.yml` 只在 GitHub 保存任务元数据 artifact，本机主动每 60 秒领取一次。每条任务建立独立工作目录及持久 Codex 会话。本机将候选提交推到 `codex/issue-*` 临时分支，调用 `validate-local-codex-candidate.yml` 在 GitHub 临时 runner 运行四项固定检查；确认每项实际通过后，才串行正常推送同一提交到 `main` 并回复 Issue，遵守现有分支保护，不强推或自动关闭 Issue。

派单模型固定为 **GPT-6.1 Sol**（`gpt-6.1-sol`），推理强度 **ultra**。配置、线程创建与每轮执行均显式指定；不继承本机默认模型，不静默降档。账号或客户端不支持时任务会报告失败并保留现场。

- 自动入口：新建或重开、带 `question`、`faq`、`help wanted`、`bug`、`enhancement` 或 `documentation` 标签的 Issue。安装前的历史 Issue 不会被自动重放。
- 维护者入口：在 Issue 评论中以 `/codex` 开头派单，或添加 `codex` 标签；事件操作者须具有仓库 write/maintain/admin 权限。
- 手动入口：Actions → **Queue Local Codex Issue Task** → Run workflow → 填写 Issue 编号。`handle` 正常处理，`smoke` 只验收派单及模型响应，不改业务代码、提交或公开回复。
- 已投递的事件以任务 key 去重；显式再次评论 `/codex` 会建立新的任务。单个仓库由一个本地 worker 串行处理。
- Issue 与评论作为非可信资料传入，不允许据此改变派单权限、读取秘密、修改维护契约、`.github/` 或派单基础设施。需要这些改动时会报告阻断。

Windows 需要 Node.js 22+、Git、已登录的 GitHub CLI 和 Codex CLI；复用本机登录，不上传或复制 `auth.json`，不需要把 OpenAI API key 放进 Actions。安装命令：

```powershell
pwsh -NoProfile -File tools\install-local-codex-issue-worker.ps1
```

默认安装到 `%LOCALAPPDATA%\Smart-Config-Kit\codex-issue-bridge`，其中 `runtime` 是受控脚本快照，`config.json` 保存本机路径，`state` 保存收据和任务状态，`worktrees` 保存独立 Git 目录。从 MSIX 桌面 App 安装时，Windows 可能将此目录重定向到包的 `LocalCache\Local`；安装器用真实文件句柄解析物理路径，确保包外运行的计划任务也能访问，实际路径以安装输出为准。当前用户登录自启任务为 `Smart-Config-Kit-Codex-Issue-Worker`；计划任务注册或启动失败时使用当前用户 HKCU Run，实际方式写入 `install-receipt.json`。电脑关机、休眠、未登录、网络或登录凭据失效时无法处理；队列 artifact 保留 90 天。

状态和无副作用验收：

```powershell
$bridge = Join-Path $env:LOCALAPPDATA 'Smart-Config-Kit\codex-issue-bridge'
node "$bridge\runtime\local-codex-issue-worker.js" --config "$bridge\config.json" --status
# 单次运行/验收前先停止常驻 worker，避免实例锁冲突。
node "$bridge\runtime\local-codex-issue-worker.js" --config "$bridge\config.json" --smoke
```

`--status` 会给出真实 PID、最近领取时间、任务终态、会话链接、提交和回复 ID；进程存活本身不代表任务完成。可在桌面 App 打开记录的 `codex://threads/<threadId>`。发布前验证日志保存在对应 GitHub Actions 运行中；发布回复追加实际提交链接、通过的检查名称和运行链接。候选代码不由外层程序直接在本机执行。

暂停领取：在 `state` 目录新建空文件 `PAUSED`，删除此文件后恢复；暂停不会中断已经执行中的任务。将仓库变量改为 `false` 会恢复 MiMo 后端，切换前应先暂停并处理本地待办，避免两个后端重复处理。

崩溃或超时中的模型任务标记为 `interrupted`，保留会话、工作目录和错误；不会自动重跑。检查后可停掉常驻实例，再运行 `--retry <taskKey> --once`。已生成提交但推送确认失败时使用 `--resume-publish <taskKey>`：重新验证、核对远端基线后尝试正常推送；远端已经包含提交时只补核回复。main 已前进且不包含该提交时保留现场，须人工整合。推送或评论确认丢失会先核对真实远端状态和回复标记，不重复运行模型。

```powershell
pwsh -NoProfile -File tools\install-local-codex-issue-worker.ps1 -Uninstall
```

卸载只停止该 worker 及其子进程、移除自启，保留配置、工作目录和状态。更新脚本快照前同样先停 worker，再重新运行安装命令；安装保留原来的任务起始时间。

参考与复用：[官方 App Server](https://learn.chatgpt.com/docs/app-server)、[官方命令](https://learn.chatgpt.com/docs/developer-commands)、[WakeWire](https://github.com/glenncalleja/wakewire)（MIT）、[Wake](https://github.com/Abyssinia-Labs/wake)（MIT）。本实现使用官方协议和现有 GitHub artifact/GitHub CLI；仅实现本仓库需要的 Windows 领取、持久状态及发布约束，不引入这些项目的完整 webhook 服务或 npm 依赖。

### MiMo 后端

1. 在 Issue 标签触发首轮分析，需要深度分析时由维护者、成员或协作者评论 `/ai-help`。
2. 配置 Actions 凭据与端点，核对完整上下文和补丁权限。
3. 先运行离线测试；真实 API 验收只在显式授权后执行。

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

依照 [MiMo Chat Completions 文档](https://mimo.mi.com/docs/zh-CN/api/chat/openai-api)检查 `choices[0].finish_reason`：`stop` 才是完整回复，`content_filter` 是内容过滤，`length` 是未完成。

兼容检查 `message.refusal`，并识别 #186 实际出现的整段 high-risk 拒答文本。[官方错误码](https://mimo.mi.com/docs/zh-CN/api/guidance/error-codes)还明确区分 HTTP `421` 内容拦截、`401` 认证错误及 `429` 限流。

过滤时发送中文未完成说明，禁止补丁或 PR，并在发布说明后将 job 标记为失败。不会将供应商拒答当作技术分析，也不会声称用户问题已经被确认有风险。

过滤和认证失败不重试。超时、连接错误、HTTP 429 或 5xx 最多以相同请求重试一次；不通过改变模型、端点或输入含义来绕开过滤。日志和 job summary 仅记录状态、HTTP 状态码、完成原因、受限格式的错误码和请求 ID，不记录凭据、请求全文、响应全文或模型推理。

结果经 runner 临时文件传递，避免任意回复进入固定分隔符的 `GITHUB_OUTPUT`。文件方式与外部输入通过环境变量传递分别参照 [GitHub workflow commands](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)及 [secure use](https://docs.github.com/en/actions/reference/security/secure-use)。

## #186 的已知证据与验收边界

[运行 38619558065](https://github.com/IvanSolis1989/Smart-Config-Kit/actions/runs/38619558065)的调用与发布步骤成功，机器人正文却只有 high-risk 拒答；#182、#183、#184 也有同样现象。

旧代码仅提取 `message.content`，没有留存 HTTP 状态与完成原因，因此不能从旧日志确定供应商在何处做出过滤决定，也不能证明哪个词或文件触发过滤。

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
