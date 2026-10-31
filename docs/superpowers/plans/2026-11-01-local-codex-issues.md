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

- [x] 队列：`local-codex-issue.yml`、`local-codex-queue.js`、入口及测试；确认触发/权限/模式/metadata校验；MiMo 模式互斥。
- [x] 协议：`local-codex-app-server.js` 及测试；真实 JSONL RPC、终态/超时/审批拒绝、保存 threadId。
- [x] Worker：`local-codex-worker.js`、CLI及测试；轮询、持久状态/单实例锁、独立 checkout、验证发布、幂等回复和中断恢复。
- [x] Windows：安装/卸载、隐藏运行、登录自启、独立 runtime/config；保留 state 与 enabledAfter。
- [x] 文档：更新现有自动处理说明与仓库变更摘要；给出状态/暂停/重试入口及边界。
- [x] 验收：相关离线测试、仓库规定提交前检查；本机真实只读会话；云端 smoke artifact→本机 session→成功收据；检查无公开评论或业务修改。
- [x] 发布启用：提交本次路径并推 main，核对 CI，配置 `LOCAL_CODEX_ENABLED`，注册并启动本地 worker，保留真实状态。

## 当前状态

已推送 `23cea9c3`、`f62c6bf2` 并开启 `LOCAL_CODEX_ENABLED=true`。真实云端队列运行 `41253355774` 成功，本机领取 `issue-193-manual-41253355774`，会话 `01a19454-77f8-70a2-acd5-9e98be8eb7ab` 返回 `BRIDGE_SMOKE_OK`，未向 Issue 发测试评论。Linux CI 修复后运行 `41253651242` 的 99/99 测试通过；候选验证运行 `41253679257` 的四项仓库检查均实际通过。本机 Windows 检查曾报告生成漂移，但同 SHA 在 CI 通过，不能据此判定 main 产物过期，未扩大到客户端生成物修改。

Windows 自启失败已定位为 MSIX 的 LocalAppData 重定向；安装器现用真实文件句柄解析物理路径，修复后计划任务已在 App 进程外启动并成功轮询，运行日志与安装收据保留。重登录触发仍待用户下次登录观察，不主动重启电脑。用户追加固定模型要求：GPT-6.1 Sol + ultra，账号 model/list 确认支持（默认 low）；正在完成显式配置、请求参数和该档位的最后一次云端派单验收。
