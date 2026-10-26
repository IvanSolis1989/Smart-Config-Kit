<picture>
  <source media="(max-width: 600px)" srcset="../docs/assets/readme/page-family-meow-mobile.svg">
  <img src="../docs/assets/readme/page-family-meow.svg" alt="Meow 内核系客户端入口" width="100%">
</picture>

# Meow 内核系

按客户端选择配置和导入指南；官方 Meow 与 AEROVE Lite 使用同源分流，各自维护客户端接入与验收。

[项目首页](../README.md) · [下载目录](../docs/guide/downloads.md#meow) · [支持队列](../docs/support-queue.md#meow)

## 官方 Meow

官方 Android 名为 **Meow**，iOS 显示为 **meow**。两端及官方 meow-rs 核心使用原生 YAML。

[原生 YAML](Meow/Meow%28meow%29.yaml) · [导入教程](Meow/README.md) · [官方适配依据](Meow/REFERENCE-meow-rs.md) · [变更日志](Meow/CHANGELOG.md)

官方核心配置校验已通过；官方 Android/iOS 的完整导入与实际连接仍在[各自 App 队列](../docs/support-queue.md#meow-official-apps)中。

## AEROVE Lite

使用 `main(config)` JS 覆写宿主；先导入已展开节点的订阅，再关联脚本。

[覆写脚本](Aerove%20Lite/AeroveLite%28meow%29.js) · [导入教程](Aerove%20Lite/README.md) · [宿主接口依据](Aerove%20Lite/REFERENCE-AEROVE-Lite.md) · [变更日志](Aerove%20Lite/CHANGELOG.md)

专版为 Lite 的单资源预算生成无损 MRS 分片，保留共享规则与优先级。生产 Meow 校验链已接通，真实 QuickJS 失败原子性与命名 HTTP 代理用例已通过；当前分片候选已通过本地原生与预算检查，仍待固定 App 全资源重验和真实路由验收。详见[分片依据](Aerove%20Lite/RESOURCE-SPLITTING.md)与[联调核查](Aerove%20Lite/VALIDATION.md)。

## 共享维护

两个客户端目录并列：先运行 `node tools/generate-aerove-rule-assets.js` 刷新专版派生资产，再运行 `node tools/generate-meow.js` 生成配置。[适配清单](adapter-manifest.json)记录输入、输出和各客户端入口，规则权威源仍为 `rulesets/source/routing-graph.js`。

官方核心配置校验已通过；官方 App 和 AEROVE Lite 的完整导入及真实路由状态分别记录在[支持队列](../docs/support-queue.md#meow)，不因共享规则而自动视为通过。
