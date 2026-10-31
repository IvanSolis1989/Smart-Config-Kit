<picture>
  <source media="(max-width: 600px)" srcset="../docs/assets/readme/page-family-dual-core-mobile.svg">
  <img src="../docs/assets/readme/page-family-dual-core.svg" alt="双内核系：Passwall 与 Passwall2 OpenWrt 插件入口" width="100%">
</picture>

# 双内核系客户端入口

Passwall 与 Passwall2 是并行维护的 OpenWrt 插件。本仓库分别提供两者的配置应用脚本；两者使用 fused SRS 分流规则，应用前需按教程准备 sing-box 分流后端。

[![配置下载](../docs/assets/readme/nav-downloads.svg)](../docs/guide/downloads.md#dual-core) [![文档中心](../docs/assets/readme/nav-docs.svg)](../docs/README.md) [![DNS 与导入后验收](../docs/assets/readme/nav-verify.svg)](../docs/guide/dns-and-verification.md)

快速导航：[配置下载](../docs/guide/downloads.md#dual-core) · [文档中心](../docs/README.md) · [DNS 与导入后验收](../docs/guide/dns-and-verification.md)

## 客户端教程

- [Passwall](./Passwall/README.md) — 全功能 OpenWrt 插件入口
- [Passwall2](./Passwall2/README.md) — 精简分流 OpenWrt 插件入口

按实际安装的插件进入对应教程。脚本会写入对应插件配置，请先阅读教程中的后端准备和执行说明。
