# 本地 Codex Issue 派单实施计划

> **For agentic workers:** 使用 superpowers:executing-plans 按责任域实现；先验证一条无副作用任务，再启用。

**Goal:** Issue 自动进入持久队列，本机领取后创建独立 Codex 会话，完成相关修改、验证、正常推送 main 与结果回复。

**Architecture:** GitHub Actions 保存白名单元数据 artifact；Windows 本机主动轮询领取，使用官方 App Server stdio 协议执行。每任务独立工作目录，候选提交在 GitHub 临时 runner 验证后由外层串行发布和回复；本地状态持久化，遇到不确定终态禁止自动重放。

**Tech Stack:** Node.js 22、内置 node:test、GitHub CLI、Codex CLI、PowerShell；不引入 npm 依赖。

**Spec:** 本聊天中已获用户确认的实现建议；默认自动处理新建/重开的受支持分类 Issue，维护者可用 `/codex` 再派单。

## 约束与复用判断

- 已查官方 App Server、codex queue、codex-action，以及 MIT 项目 Wake/WakeWire。Wake 主要面向 macOS/Linux 且发布路径不同；WakeWire 多平台 webhook/路由层超过本仓库需要。复用官方 RPC 与 GitHub artifact，仅自研本项目 Windows 领取、持久状态和发布约束。
- 不复制 CLI 登录凭据；复用本机登录。Issue 内容只作资料，不拼进 shell，不授权扩大权限、读取秘密或修改桥接基础设施。
- 规则权威源、跨客户端同步与验证遵守 AGENTS.md；本次派单工具本身不改变客户端产物。
- 首次安装仅接收安装后任务；离线任务保留，事件去重；单个发布者串行写 main，不强推。
- smoke 任务只验证派单和模型响应，不修改业务代码、不提交、不公开回复。

## Review Focus

- 同一事件重跑、多个标签、轮询重复不能重复执行或回复。
- 下载失败、进程崩溃、超时、推送后崩溃等不确定终态保留证据，禁止无条件重放。
- 外来仓库 URL、PR 伪装、未授权评论、错误 artifact 与任务元数据均须拒绝。
- main 前进时拒绝旧基线发布，保留分支与恢复入口。
- 本机登录重启、任务仍在运行、日志和状态落盘必须可核验。

## 任务与验收

- [ ] 队列：`local-codex-issue.yml`、`local-codex-queue.js`、入口及测试；确认触发/权限/模式/metadata校验；MiMo 模式互斥。
- [ ] 协议：`local-codex-app-server.js` 及测试；真实 JSONL RPC、终态/超时/审批拒绝、保存 threadId。
- [ ] Worker：`local-codex-worker.js`、CLI及测试；轮询、持久状态/单实例锁、独立 checkout、验证发布、幂等回复和中断恢复。
- [ ] Windows：安装/卸载、隐藏运行、登录自启、独立 runtime/config；保留 state 与 enabledAfter。
- [ ] 文档：更新现有自动处理说明与仓库变更摘要；给出状态/暂停/重试入口及边界。
- [ ] 验收：相关离线测试、仓库规定提交前检查；本机真实只读会话；云端 smoke artifact→本机 session→成功收据；检查无公开评论或业务修改。
- [ ] 发布启用：提交本次路径并推 main，核对 CI，配置 `LOCAL_CODEX_ENABLED`，注册并启动本地 worker，保留真实状态。

## 当前状态

队列、协议、Worker、Windows 脚本及文档已实现并复核；本机真实只读会话通过，桌面 App 可读取。Windows 沙箱无法禁止回环连接，发布门禁改用 GitHub 临时 runner。相关测试已通过；原 main 的 Stash/Karing/能力矩阵生成漂移仍存在（相关源及生成物本次均无修改），不能将全仓库合同检查声称为通过。待发布及云端派单验收，尚未启用。
