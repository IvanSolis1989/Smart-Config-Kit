# 订阅节点预检与倍率筛选

Clash Party Smart / Normal、FlClash 和 OpenClash Smart / Normal 共用相同的筛选语义：先检查订阅节点，再生成仓库的地区组、业务组、规则和 DNS。默认保留所有倍率节点，信息节点按明确的公告模式清理。

## 配置倍率上限

JS 覆写脚本中的本地参数默认是：

```javascript
const SCKI_MAX_NODE_MULTIPLIER = null
```

如需排除超过 2 倍的节点，改为 `2`。恰好 2 倍的节点继续保留。该参数只从你维护的脚本读取，机场订阅不能替你设置它。使用 URL 自动更新脚本时，建议维护本地副本以保留自定义参数。

OpenClash 的环境变量默认空值，表示关闭：

```sh
SCKI_MAX_NODE_MULTIPLIER=2 bash /etc/openclash/overwrite/OpenClash\(mihomo\).sh /path/to/subscription.yaml
```

由 OpenClash 启动脚本时，可在本地覆写脚本调用处设置这个环境变量。上限必须是有限正数，非法参数会拒绝本次处理。此参数不是 LuCI 的 UCI 配置键。

解析只接受明确的倍率标签，如 `x2`、`2x`、`×0.5`、`2倍`、`倍率2`。普通地区编号、端口、IP 地址不会作为倍率。没有标签、零倍率和相互矛盾的标签保留，不根据延迟或线路名字猜测计费倍率。解析结果只是节点名称里的声明，实际计费以机场说明为准。

## 预检与引用

完全等价的重复节点保留首次出现的对象；同名但配置不同的节点会拒绝本次处理，需要先在订阅聚合处解决身份歧义。节点名与仓库组名、内置策略名冲突，或节点字段类型无法安全处理时，同样先拒绝处理。JS 保持原始订阅对象，OpenClash 不写回源 YAML；原始订阅能否运行仍取决于其本身是否有效。日志只记录原因和计数，不记录节点端点、名称或凭证。

节点不会被自动改名。保留节点的 `dialer-proxy` 引用必须保持可解析；如果筛选会移除其依赖节点，或链路存在自引用、循环引用，先拒绝这次处理，调整上限或在聚合层修正链路后再试。正常多跳链保留。所有节点被筛除时，全球组显式使用 `REJECT`，避免空测速组依赖默认回退。合法的 IPLC、IEPL、中转、Telegram 等线路名称保留；这些词本身不说明节点是公告。

非空 `proxy-providers` 需要先使用 [Sub-Store](../SubStore/README.md) 展平为 `proxies` 后再关联本仓库的动态脚本。动态地区组需要知道实际节点名称，单凭远程 provider URL 无法在脚本运行时完成同样的分类。预检会保留原始配置并提示展平；不会只选出混合输入中的显式节点而遗漏其余 provider 节点。

## 适用端与维护

此功能属于五个订阅处理脚本的运行时。静态 CMFA / Stash、iOS 原生配置和 SingBox / v2rayN / Passwall 系没有同构的订阅脚本入口。使用静态产物时，应在订阅聚合处进行同样的节点筛选；本次不改变这些产物的规则、组名或 DNS。完整逐端分析与外部源码依据见 [研究报告](./research/2026-09-30-routing-script-research.md)。

规则权威源保持 `rulesets/source/routing-graph.js` v6.0.14；融合规则和发布缓存键保持原值。共享节点筛选源码位于 `tools/runtime/subscription-node-filter.js` 与 `.rb`，修改后运行对应同步工具，并检查实际客户端脚本中的嵌入块，防止三个 JS 或两个 Ruby 副本漂移。

官方语义依据：[Mihomo 代理组](https://wiki.metacubex.one/config/proxy-groups/) 的 `proxies`、`use`、`include-all-proxies`、`empty-fallback` 与 [dialer-proxy](https://wiki.metacubex.one/en/config/proxies/dialer-proxy/)。倍率上限在脚本中解析，不引入新的内核配置字段。
