<picture>
  <source media="(max-width: 600px)" srcset="../../../docs/assets/readme/page-tools-mobile.svg">
  <img src="../../../docs/assets/readme/page-tools.svg" alt="Karing 官方 schema fixture 与人工核验边界" width="100%">
</picture>

# Karing 官方 schema fixture

`official-preset-excerpt.json` 仅节选官方预设的 Adblock 与 Apple 两项，保留字段和取值，压缩排版。

[![文档中心](../../../docs/assets/readme/nav-docs.svg)](../../../docs/README.md) [![配置下载](../../../docs/assets/readme/nav-downloads.svg)](../../../docs/guide/downloads.md)

文档中心：[docs/README.md](../../../docs/README.md) · 配置下载：[downloads.md](../../../docs/guide/downloads.md)

- 来源：https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/assets/datas/preset/default.json
- 查阅：2026-10-24。
- 用途：人工复核原生 `rules` 包装、`outbound/name/switch` 字段；它不是运行 Karing 的替身，也不能证明未经公开的当前解析器已通过实机导入。
- 复杂条件输入在测试文件中手写，明确区分于官方样例。support SRS 快照位于 `rulesets/source/karing-support/`，有独立来源和哈希收据。
