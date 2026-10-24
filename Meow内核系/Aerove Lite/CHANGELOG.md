<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="AEROVE Lite 变更日志" width="100%">
</picture>

# AEROVE Lite 变更日志

[使用说明](README.md) · [内核家族入口](../README.md) · [支持队列](../../docs/support-queue.md#aerove-lite-meow)

## 2026-10-24 — 准入与联调证据同步

- 核查固定 App 提交及外部候选，记录 74 项 JVM、AndroidTest 编译和 149 资产读回通过的实际范围；生产 factory、Geo 资源上下文及命名代理下载仍待整合。
- 增加 [VALIDATION](VALIDATION.md)，将当前进展与早期接口快照区分；完善 README、支持队列和独立下载按钮。未修改脚本或规则语义。

## v6.0.20-meow.3 (2026-10-24)

- 按客户端并列归档，将 AEROVE Lite JS 与使用说明、接口依据和日志放入独立目录；官方 Meow 原生 YAML 保留在其客户端目录。
- JS 入口为 `AeroveLite(meow).js`，继续使用共享 `tools/generate-meow.js`，分流实现和失败行为保持不变；两入口的共享适配清单位于内核家族目录。
- 保留接口历史快照及待验状态，AEROVE 客户端接线和 APK 联调独立推进。

## v6.0.20-meow.2 (2026-10-24)

- 分流 JS 纳入 Meow 共享生成入口，AEROVE 保留独立宿主接口与消费者说明。
- 新增官方核心及官方 Android/iOS 的原生 YAML 入口；官方 v0.26.1 实际配置校验通过，App、HTTP 下载与真实路由仍待验。

## v6.0.20-meow.1 (2026-10-24)

- 新增预适配分流 JS、生成器与输入/输出哈希清单，复用节点分类、分组和有序融合规则，不改规则权威源。
- 保留 App 的 DNS、hosts、嗅探、端口、模式、控制器与 TUN，不注入 Mihomo 全局设置或 TLS 指纹；失败抛错且保留原输入。
- 加入支持队列，状态为 `pre-adapted-awaiting-app`；App 配置准入、直接逻辑规则、Android QuickJS 及实际路由待验。
- 随共享刷新链重生成并纳入发布批次；独立 CI 验证生成漂移与本地 JS 行为，保持 App 待验状态。
