[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../../../docs/assets/readme/page-tools-mobile.svg">
  <img src="../../../docs/assets/readme/page-tools.svg" alt="Karing official schema fixture and manual verification limits" width="100%">
</picture>

# Karing official schema fixture

`official-preset-excerpt.json` contains only the Adblock and Apple entries from the official preset, preserving fields and values with compact formatting.

[![Documentation](../../../docs/assets/readme/nav-docs.svg)](../../../docs/README.md) [![Downloads](../../../docs/assets/readme/nav-downloads.svg)](../../../docs/guide/downloads.md)

Documentation：[docs/README.md](../../../docs/README.md) · Downloads：[downloads.md](../../../docs/guide/downloads.md)

- Source: https://github.com/KaringX/karing/blob/60cfb75daaabd179305a1e6c5201c35c91a63cf2/assets/datas/preset/default.json
- Reviewed: 2026-10-24.
- Purpose: manual review of the native `rules` wrapper and `outbound/name/switch` fields. It does not replace running Karing or prove real-device import through an unpublished current parser.
- Complex-condition inputs are handwritten in tests and explicitly distinct from official examples. Support SRS snapshots under `rulesets/source/karing-support/` have separate provenance and hash receipts.
