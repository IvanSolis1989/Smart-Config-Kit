# Karing 原生分流适配

> 版本：v6.0.20-karing.1 · Build：2026-10-24
> 规则源：`rulesets/source/routing-graph.js` v6.0.20，经 fused manifest 和 SingBox 1.13 路由派生。
> 变更历史：[CHANGELOG.md](CHANGELOG.md)。官方依据与证据边界：[REFERENCE-Karing.md](REFERENCE-Karing.md)。

本目录提供 Karing 的 **自定义分流组 JSON**。它复用本仓库融合 SRS，复杂匹配使用标准 sing-box source 规则集。它不执行 Clash Party/FlClash JS，也不把完整 sing-box 配置原样交给 Karing。

## 下载配置

[![下载 Karing 分流 JSON](../../docs/assets/readme/button-karing-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/diversion_rules_custom.json)

## 导入

1. 在 Karing 添加自己的节点订阅，确认节点可用。
2. 保存本目录的 [diversion_rules_custom.json](diversion_rules_custom.json)。在「设置 → 分流 → 分流规则 → 编辑 → 自定义分流组」的菜单选择「导入」，选择该 JSON 并确认启用。请使用首次导入的干净列表；更新前备份现有设置并移除旧 `SCKI` 项，防止旧名称残留或顺序错位。
3. 按名称中的序号保持顺序。每个段是独立规则，同一业务出现在多个段时不要合并。
4. `direct` 和 `block` 按源配置默认动作生成；代理业务统一使用 `currentSelected`。需要独立地区/业务出口时，在 Karing 创建自定义节点组，再逐项绑定对应分流规则。本文件不会自动创建或恢复原配置的嵌套策略组。
5. 最终默认动作在 Karing 分流设置中选择「当前选择」。导入文件没有空匹配 FINAL。DNS、TUN、嗅探和规则下载设置由 App 管理；检查 ISP/内置国家地区规则是否会抢先匹配，按需要调整。
6. 在「分流规则探测」确认远程规则下载成功，并检查实际连接与最终生成配置。进程匹配依赖桌面系统权限；IP 规则的 `no-resolve` 和先解析行为仍需实机读回确认。

生成清单 [adapter-manifest.json](adapter-manifest.json) 记录每条输入规则、动作映射、默认出口解析链、URL、输入/资产哈希、人工设置及未执行的客户端验收。当前生成结果为 97 条规则（28 直连、5 拦截、64 当前选择）和 19 个复杂条件资产；具体数量以清单为准。

## 维护

从仓库根目录执行：

```sh
node tools/generate-karing.js
node tools/generate-karing.js --check
node --test tools/tests/karing-generation.test.js
```

普通生成与 `--check` 均只读已绑定输入，不下载规则。`--check` 不写文件，遇到漂移、缺失资产、非法出站、循环默认选择或不能无损转换的匹配字段会失败。

5 个 QUIC 例外依赖外部 geosite SRS，精确解码快照存于 `rulesets/source/karing-support/*.json.gz`。只有明确刷新时才运行：

```sh
node tools/generate-karing.js --refresh-support
```

刷新需要可用网络和已有 sing-box 核心（默认 `.cache/fused-rule-sets/sing-box/sing-box.exe`，其他平台默认 `sing-box`；可设 `SING_BOX_113_BIN`）。它只下载复杂匹配实际引用的 support SRS，解码后保存 URL、取回时间及二进制/source/gzip 哈希，随后生成产物。上游规则会变化，刷新后应审查差异。生成 source JSON 使用 version 3（标准 sing-box >=1.11）；这不是 Karing 最低版本或实机兼容性承诺。

本地测试与核心编译不等同于 Karing 实机验收。当前未下载、运行或导入 Karing；发布后仍须检查实际下载、默认动作、顺序和最终运行配置。
