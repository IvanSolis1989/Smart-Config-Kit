# AEROVE Lite / meow-rs — 变更日志

[使用说明](README.md) · [支持队列](../../docs/support-queue.md#aerove-lite-meow)

## v6.0.20-meow.1 (2026-10-24)

- 新增预适配分流 JS、生成器与输入/输出哈希清单；复用现有节点分类、分组和有序融合规则，不改规则权威源。
- 保留 App 的 DNS、hosts、嗅探、端口、模式、控制器与 TUN；不注入 Mihomo 全局设置或 TLS 指纹。失败抛错且保留原输入。
- 加入支持队列，状态为 `pre-adapted-awaiting-app`。App 配置准入、直接逻辑规则、原生内核、Android QuickJS 及实际路由待验。
- 候选随上游刷新链重生成并纳入发布批次；独立 CI 验证生成漂移与本地 JS 行为，保持待验状态。
