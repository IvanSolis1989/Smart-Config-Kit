<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Meow 变更日志" width="100%">
</picture>

# Meow / meow-rs — 变更日志

[使用说明](README.md) · [支持队列](../../docs/support-queue.md#meow)

## v6.0.21-meow.6 / v6.0.21-meow.4 (2026-10-28)

- Google FCM 从下载更新调整至 Google 服务；15 个域名与 26 个 IPv4 谓词、规则顺序及 55 个策略组不变。其他推送、DNS 与 fake-IP 不变。

## 2026-10-24 — 官方客户端入口补全

- README 增加官方核心、Android Meow 与 iOS meow 的项目入口；根首页和下载目录补齐 Meow 卡片及原生 YAML 按钮，官方 App 待验状态保持独立。

## v6.0.20-meow.3 (2026-10-24)

- 官方 Meow 原生 YAML 与 AEROVE Lite JS 按客户端并列归档，各自提供 README、参考文档与变更日志；共享生成器和家族适配清单。
- 本目录仅说明官方核心与官方 Android/iOS 的 YAML 导入；配置语义与验收边界保持不变。

## v6.0.20-meow.2 (2026-10-24)

- 将 AEROVE 专属目录改为 Meow 通用入口，JS 统一为 Meow(meow).js；AEROVE 仅保留消费者说明，旧 Raw 路径需更新。
- 新增官方核心/官方 Android/iOS 的原生 Meow(meow).yaml，使用 provider 筛选和 REJECT 空池哨兵，投影原生 DNS/geodata 字段。
- 官方 v0.26.1 实际 -t 通过，CI 增加归档验 SHA 与真实核心校验；App、HTTP 下载与真实路由仍待验。

## v6.0.20-meow.1 (2026-10-24)

- 新增预适配分流 JS、生成器与输入/输出哈希清单；复用现有节点分类、分组和有序融合规则，不改规则权威源。
- 保留 App 的 DNS、hosts、嗅探、端口、模式、控制器与 TUN；不注入 Mihomo 全局设置或 TLS 指纹。失败抛错且保留原输入。
- 加入支持队列，状态为 `pre-adapted-awaiting-app`。App 配置准入、直接逻辑规则、原生内核、Android QuickJS 及实际路由待验。
- 候选随上游刷新链重生成并纳入发布批次；独立 CI 验证生成漂移与本地 JS 行为，保持待验状态。
