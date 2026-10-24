<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Karing 变更日志" width="100%">
</picture>

# Karing — 变更日志

> Karing 原生自定义分流产物，规则基线跟随源规则图；平台能力差异见 README 与适配清单。

[![文档中心](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [返回 README](../../README.md) · [仓库文档中心](../../docs/README.md)

## v6.0.20-karing.1 (2026-10-24)

- 增加原生 `diversion_rules_custom.json`，保留 SingBox 已生成路由顺序及每段独立名称。
- 复用 fused SRS；复杂 AND/OR/NOT、端口、network 和进程条件生成标准 headless source JSON，禁止向 Karing JSON 臆造嵌套字段。
- 依据 selector 显式默认选择递归解析直连/拦截；代理出口使用 `currentSelected`，节点组由用户在 App 绑定。
- 5 个 QUIC 外部规则来源以精确 SRS 解码 gzip 快照绑定，普通生成离线且确定；显式刷新记录来源与哈希。
- 增加清单、生成读回、只读漂移检查和错误输入回归。未进行 Karing 客户端实机导入验收。
