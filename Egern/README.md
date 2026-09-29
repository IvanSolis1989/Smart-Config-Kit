# Egern 使用教程

> 版本：**v6.0.14-egern.5**（Build 2026-09-29；正式跟随 Clash Party v6.0.14 / CMFA 融合规则顺序，原生规则集使用发布版本缓存键）

## 定位

Egern 已纳入正式同步产物，但不能直接复制 Mihomo/Clash 的 `rule-providers`。

原因很明确：Mihomo 的 `.mrs` 是 Clash Party / CMFA 最小、加载更快的规则集格式，应继续保留；Egern 官方文档没有声明可直接消费 `.mrs`，它的 `rule_set` 使用 Egern 自己的远端规则集结构。所以本目录提供 Egern 正式 Profile，由融合后的 CMFA 规则顺序生成 Egern 可导入语法：

- `Egern.yaml`：Egern Profile，可导入，可接订阅，包含 22 个 `smart` 区域组、33 个业务组；规则、顶层 `rule_set` 和非空资产的实际数量由本次上游输入决定，Profile 头部和生成清单会记录结果。
- `rulesets/generated/egern/*.yaml`：由融合 rule-provider 生成的 Egern 原生规则集。
- `rulesets/generated/egern/manifest.json`：无时间戳的生成合同，记录 CMFA / source graph / Profile / 每个原生 YAML 的内容哈希与引用顺序，供全产物 validator 检查陈旧、漏引用和重复资产。
- `tools/generate-egern-supplemental.js`：保留补充规则集的独立格式转换工具；正式 Profile 以 `tools/generate-egern-from-cmfa.js` 的 generated 输出为准。
- `tools/generate-egern-from-cmfa.js`：从 `Clash Meta For Android/CMFA(mihomo).yaml` 生成正式 Egern Profile。

## 快速导入

1. 打开 `Egern/Egern.yaml`。
2. 把 `policy_groups -> Subscribe -> urls` 里的示例订阅改成你的订阅地址。
3. 导入 Egern。
4. 在 Egern 里检查远端 `rule_set` 是否下载成功。

## 平台边界

- Egern Profile 正式跟随 CMFA 的 113 个融合 rule-provider 和 130 条规则顺序生成；每次上游同步后的实际渲染规模以 `rulesets/generated/egern/manifest.json` 为准，不靠固定快照数字判断成功或失败。
- 国家 GEOIP 使用原生 `geoip_set`，服务型 GEOIP 转换为 CIDR；桌面 `PROCESS-NAME` 及目标为空规则集是明确的平台/优化例外。所有已生成资产必须恰好被 Profile 引用一次。
- Mihomo `.mrs` 不在 Egern 中直接引用；生成器会映射到 `rulesets/generated/egern/*.yaml` 的 Egern 原生规则集。

## 官方依据

- Egern Policy Groups：支持 `select`、`auto_test`、`smart`、`fallback`、`load_balance`、`external`、`conditional`。
- Egern Rules：规则按顺序首个命中生效，支持 `rule_set` 引用本地或远端规则集。
- Egern DNS：支持 `bootstrap`、`upstreams`、`forward`、`proxy_nameservers`。
- MetaCubeX Rule Providers：Mihomo `format` 支持 `yaml` / `text` / `mrs`，其中 `.mrs` 当前支持 `domain` / `ipcidr`。

详见 [REFERENCE-Egern.md](./REFERENCE-Egern.md)。
