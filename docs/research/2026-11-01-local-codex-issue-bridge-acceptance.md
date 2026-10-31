# 本地 Codex Issue 派单验收（2026-11-01）

## 实际交付

- 代码提交：`23cea9c3`、`f62c6bf2`、`b5f6c5c2`，均已正常推送 `main`。
- 仓库变量 `LOCAL_CODEX_ENABLED=true`；本地 worker 已安装并由当前用户的 Windows 计划任务启动，实际状态为运行中。
- 固定模型 `gpt-6.1-sol`、推理强度 `ultra`。创建线程前检查账号目录，创建后检查服务端返回的模型和强度；每轮再次显式传参，不支持或发生降档时停止。
- 每个任务独立工作目录和持久会话；事件去重；候选提交在临时分支验证，确认四项门禁实际通过后，才正常推送同一 SHA 到 `main` 并幂等回复。

## 真实验收证据

| 验收 | 证据 | 结果 |
| --- | --- | --- |
| 专项离线 CI | [运行 41254023629](https://github.com/IvanSolis1989/Smart-Config-Kit/actions/runs/41254023629) | 104 tests、104 pass、0 fail；包含模型/强度不支持及降档拒绝、队列去重、发布顺序、恢复与进程树终止 |
| 候选发布门禁 | [运行 41253679257](https://github.com/IvanSolis1989/Smart-Config-Kit/actions/runs/41253679257) | staging 分支与不可变 SHA 绑定成功；JS、产物合同、进程直连、Karing 四项均实际通过 |
| 首条 GitHub → 本机会话 | [运行 41253355774](https://github.com/IvanSolis1989/Smart-Config-Kit/actions/runs/41253355774) | artifact 上传成功，本机主动领取，新会话返回 `BRIDGE_SMOKE_OK` |
| 固定 Sol ultra 的完整派单 | [运行 41254050729](https://github.com/IvanSolis1989/Smart-Config-Kit/actions/runs/41254050729) | 计划任务在 App 进程外领取，model/effort 严格核对通过；会话完成并返回 `BRIDGE_SMOKE_OK` |

本机安装目录的 `install-receipt.json` 记录代码提交及 runtime 文件 SHA256，`state/state.json` 记录任务 key、线程 ID、模型、强度、终态和完成时间。桌面 App 的会话读取接口已读回真实完成记录；不是仅检查进程存活。候选验收临时分支已清理。

## 环境问题及处理

- 本机 Windows 检查曾报告 Stash/Karing/能力矩阵生成漂移，但相同客户端输入在上述 GitHub Node.js 22 环境四项全过，不能据此判定 main 生成物过期。本次未修改客户端源和生成物。
- Windows elevated sandbox 无法满足回环网络隔离，因此外层不在本机直接执行候选验证脚本；发布门禁使用无本机凭据、仅仓库读取权限的 GitHub 临时 runner。
- MSIX 桌面 App 对 LocalAppData 的重定向使计划任务最初无法读取脚本路径。安装器现通过真实文件句柄解析物理路径，修复后计划任务已实际启动 worker 并完成固定模型派单。
- Linux 首轮 CI 的进程存在性检查不能区分运行进程与僵尸态；现等待直接子进程退出，并检查内核终态及取消后不再产生心跳。修复后的 Linux CI 已通过。

## 验收边界

smoke 不修改业务代码、不提交、不向真实 Issue 发测试评论，也不关闭 Issue。未拿真实用户问题演练自动修改并推送 main；发布顺序由真实临时 Git 仓库回归及真实 GitHub 候选门禁分别验证。计划任务已真实运行，重登录触发需在用户下次登录观察；未主动重启电脑。

接入、暂停和恢复命令见[自动处理说明](../ai-issue-responder.md)。
