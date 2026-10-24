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

## AEROVE Lite

使用 `main(config)` JS 覆写宿主；先导入已展开节点的订阅，再关联脚本。

[覆写脚本](Aerove%20Lite/AeroveLite%28meow%29.js) · [导入教程](Aerove%20Lite/README.md) · [宿主接口依据](Aerove%20Lite/REFERENCE-AEROVE-Lite.md) · [变更日志](Aerove%20Lite/CHANGELOG.md)

## 共享维护

两个客户端目录并列，配置由 `node tools/generate-meow.js` 统一生成，[适配清单](adapter-manifest.json)记录输入、输出和各客户端入口。规则权威源仍为 `rulesets/source/routing-graph.js`。

官方核心配置校验已通过；官方 App 和 AEROVE Lite 的完整导入及真实路由状态分别记录在[支持队列](../docs/support-queue.md#meow)，不因共享规则而自动视为通过。
