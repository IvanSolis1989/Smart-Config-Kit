# 运行时节点类型与 Provider 展平补充研究

日期：2026-09-30 UTC。本文补充 [GitHub 分流脚本横向比较](2026-09-30-github-routing-script-comparison.md) 的实施结论。上一阶段将“没有新优化”作为终点过早：新增输入形态证据后，本地运行时范围扩大为**保留接口/链式引用所需的 direct、reject 对象，同时只将可选远端代理交给地区、家宽和测速组**；对限定结构的 inline provider 做安全展平；并加强覆写前的结构预检。代码是按本地合同重新实现，未复制上游代码；GitHub 星数仍按原研究的 2026-09-30 快照记录。

## 新增证据与决策

HotKids Script.js 对有效代理来源和对象形状的识别给出有用参照：[固定源码](https://github.com/HotKids/Rules/blob/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script/Script.js#L39-L48)。Repcz 使用 Mihomo 原生 include-all / filter 消费 provider，echs-top 则演示如何从显式节点构造 inline provider；差异说明“配置含 provider”“节点已展开”“组实际纳入哪些对象”是不同层次。前两者的研究和 VM 边界见[横向比较报告](2026-09-30-github-routing-script-comparison.md#直接运行的-mihomoclash-覆写脚本)及[31 条上游 VM 探针记录](2026-09-30-routing-script-probes.json)。本地选择只接受可完整验证的静态 inline payload；远程 provider、实时 filter、override、health-check 等语义继续在覆写前拒绝，用户需先在 SubStore 展平。

另一项新增点是节点“定义”与“可自动选择的远端节点”分开：具名 `type: direct` / `type: reject` 出站可被其他配置字段或代理链引用，不能因它们不是远端线路就从节点对象中删除；但也不应进入 ALL、地区、家宽或 DNS server 候选。HotKids 的输入识别启发了这一切分。Mihomo v1.19.31 的 [adapter parser](https://github.com/MetaCubeX/mihomo/blob/v1.19.31/adapter/parser.go) 支持 direct、reject adapter；[groupbase](https://github.com/MetaCubeX/mihomo/blob/v1.19.31/adapter/outboundgroup/groupbase.go) 对组成员先应用 `exclude-type` 再执行空组 fallback。官方文档也定义 `exclude-type` 按类型过滤被引入的出站，`empty-fallback` 用作空组 fallback：[Mihomo proxy group 字段](https://wiki.metacubex.one/config/proxy-groups/)。源码说明字段行为，客户端加载能力仍按下方矩阵分别判断。

## 本地输入和输出合同

三个 JavaScript 入口与两份 OpenClash Ruby heredoc 共用同一筛选语义；实现落在 tools/runtime/subscription-node-filter.js 和 tools/runtime/subscription-node-filter.rb，由产物内嵌调用。其合同如下：

- **保留定义，限制候选。** 通过对象/名称/类型预检的 direct、reject 节点仍保留在配置中，以满足 interface 与 dialer-proxy 关系；可选择列表只包含远端类型。最终无远端候选时，全局组显式指向 REJECT。节点名 PASS-RULE 加入保留名称校验，防止和 Mihomo 内建出站歧义。
- **仅接受字段精确为 `type` / `payload` 的静态 inline provider 集合。** 每个 provider 必须恰好具有 `type: inline` 与数组 `payload` 两个字段。读取顺序是原始 `proxies` 在前，再依 JavaScript/Ruby 对象键顺序追加各 provider payload。完整列表随后统一执行对象形状、保留名、重名、可选倍率及 dialer 依赖/循环检查；跨来源同名冲突也拒绝。等价重名只留首项，冲突重名拒绝；默认倍率筛选关闭，但启用时对显式节点和 inline payload 一律按完整数值筛选，滤后重新检查 dialer 引用与环。校验通过后 payload 被独立深拷贝，避免在调用源上写入字段造成 alias 副作用。任一 provider 是 HTTP/file/未知类型，或带有任何额外键（即使值为 `null`，包括 `filter`、`override`、`health-check` 等）时，整个覆写原样拒绝；不会只处理显式节点后静默漏掉远端节点。
- **保留私有节点 DNS 的有效目标。** DNS server/proxy 字段按保留后的节点定义投影；direct/reject 不会成为 DNS 远端候选，仍可作为配置引用目标。投影只针对有效节点集合，非法/歧义输入在写配置前整体拒绝。
- **先验证容器形状，再写配置。** Clash Party 两份 JS 入口会先校验其消费的 `listeners` / `tun` 类型、可追加数组和排除进程字段，非法时不产生半成品；FlClash 的 App 托管字段不套用此检查。已有 `rule-providers` 若不是可用对象先归一为字典，再合并必需的融合 providers；避免数组/标量在运行时合并导致配置序列化或融合 providers 丢失。

该行为扩大了先前只接受 SubStore flatten 输出的合同，但仅限字段精确为 `type` / `payload` 的 inline provider 集合；它不实现通用订阅下载或 provider 过滤器兼容。Mihomo 原生 include-all 仍是其他客户端的独立配置能力，不代表这五个覆写脚本获得了远端拉取能力。

## CMFA 原生类型过滤与控制器验证

CMFA 的 22 个 url-test 区域组现在都使用 exclude-type: 'direct|reject' 和 empty-fallback: REJECT。关键语义是**组侧排除，不在 proxy-provider 源侧删除节点**：provider 中 direct/reject 仍保留，供被测 SS 的 dialer-proxy: direct 引用；组不自动选中这两类节点，且只有 direct/reject 的候选组返回 REJECT。

代码证据固定在 Mihomo v1.19.31 源码和 CMFA 当前 YAML；实际配置矩阵以本机缓存 v1.19.29 核心启动的 localhost controller 夹具做过检查。四种场景读回 /proxies 与 /providers/proxies：有 direct/reject/SS 时 provider 仍有三项、代理组只纳入 SS；只有 direct/reject 时，region group fallback 为 REJECT；带 direct dialer 的 SS 仍指向该 direct 定义。夹具关闭 DNS，测试地址为 127.0.0.1:9，只验证解析、加载、组成员与引用，不验证真实拨号或网络行为。原始收据见[CMFA native type 探针](2026-09-30-native-cmfa-type-probe.json)。这不是手机 App 真机验收。

## 14 个产物目录适用性矩阵

矩阵按仓库定义的 14 个客户端目录计数；Clash Party 两份脚本和 OpenClash 两份脚本各归一行。它区分代码层是否存在可实现的同类机制，不把 Mihomo YAML 键复制到其他客户端，也不将未知客户端行为称为已支持或已修复。

| 目录 | 本地运行时位置 / 机制 | 本次结论 |
|---|---|---|
| Clash Party | Smart / Normal JS 的 main(config)、共享 SckiSubscriptionNodeFilter、ALL/区域组生成 | **适用且已实现**：保留 direct/reject 定义，组只选远端；静态 inline provider 预检和展平，错误形状原样返回。Smart 与 Normal 共用节点合同。 |
| Clash Meta For Android | CMFA(mihomo).yaml 的 proxy-providers 和 22 个 url-test 区域组 | **适用且已实现**：组上 exclude-type + empty-fallback；provider 源未删减。v1.19.31 源码与 v1.19.29 controller 夹具分别验证机制与配置读回。 |
| OpenClash | Normal / Smart shell 中嵌入 Ruby SckiSubscriptionNodeFilter.validate_and_filter，再筛 selectable_proxies 并生成组 | **适用且已实现**：两份 Ruby 实现与 JS 同一规则，保留链引用目标，只给自动组提供远端节点。 |
| Shadowrocket | .conf 的 [Proxy] / [Proxy Group] 配置 | **不套用 Mihomo 类型字段**：其代理描述和策略组是私有语法；当前没有证据证明 Mihomo type: direct/reject 映射为合法 Proxy 记录。仅保持已有静态 policy 配置。 |
| SingBox | SingBox(sing-box)-full.json 静态 outbounds 与 selector/urltest | **不适用动态预检**：生成时代理/策略已投影为静态 outbounds，没有本次脚本收到订阅节点后运行分类的流程。 |
| v2rayN | v2rayN(xray).json 的扁平 Xray RuleObject / outboundTag | **不适用**：它是路由规则生成物，不包含动态代理订阅或测速分组。 |
| Surge | Surge.conf 的 [Proxy] / [Proxy Group] | **不宣称已解决**：当前 [Proxy] 为空，没有可改的远端节点策略路径；虽然 Surge 有 DIRECT 内建策略别名，但没有设备证据确认当前 include-all 路径是否纳入此别名，故不以此推断现存故障或实现修复。 |
| Loon | Loon.conf 的 [Proxy]、[Proxy Group] / Remote Filter | **不套用 Mihomo 类型字段**：当前 proxy/server 定义为空；未证实 type: direct/reject 在 Loon server 语法中成立，名称过滤仍走各自配置语义。 |
| Quantumult X | QuantumultX.conf 的 [server] / [policy] / server-tag-regex | **不套用 Mihomo 类型字段**：当前 server 定义为空；无同构 JS 输入清理器，也未证实 Mihomo 的命名类型可作为 QX server。 |
| Passwall | Passwall(xray+sing-box)-apply.sh 安装 UCI shunt_rules | **不适用**：管理的是 fused 规则分流，不执行节点名分类或 provider 代理组筛选。 |
| Passwall2 | Passwall2(xray+sing-box)-apply.sh 安装 UCI shunt_rules | **不适用**：与 Passwall 相同，只安装静态 shunt 规则，没有订阅节点对象。 |
| FlClash | FlClash(mihomo).js 的 JS main(config) 与 NodeFilter | **适用且已实现**：与 Clash Party Normal 共用输入合同，并保留 FlClash 的客户端专有字段边界。 |
| Stash | Stash.yaml 由 CMFA 生成，含 Subscribe provider 与静态 filter 组 | **明确限制，不等价于 CMFA 修复**：Stash 文档可见 named direct 出站，但未找到可依赖的 exclude-type / empty-fallback 合同；生成器继续移除这两个 Mihomo 键，不声称 Stash 组已经排除这些出站。使用说明将 named direct 作为独立顶层 proxy 定义；测速 provider 只含远端节点，并由订阅聚合层检查 dialer-proxy 引用。 |
| Egern | Egern.yaml 的 native proxy/policy/filter schema，由 CMFA 生成 | **不复制类型机制**：Egern 官方 proxies schema 不含 Mihomo 的 named direct 类型，名称 filter 是另一套机制；本轮只从最终 CMFA 刷新其 manifest/hash/version，不改变 native policy 语义。 |

表中“适用”仅指同一运行时脚本或 Mihomo 原生组字段；“不适用/未证实”是格式和装载证据边界，不表示这些客户端的所有内建 DIRECT/REJECT 策略都不存在。

## 派生文件、规则基线和版本

源图 SOURCE_GRAPH_VERSION 保持 v6.0.14；源 514 providers / 973 rules、fused 132 providers / 151 rules、规则顺序、DNS 基线和 55 组命名与业务默认均未重建或重定义。inline runtime 筛选改变的是输入代理成员，而非 routing graph 的规则事实；本轮没有上游 provider 内容变更，因此未运行远程 MRS 同步或全规则生成，避免引入无关上游负载漂移。

产物版本递增如下：Clash Party Smart v6.0.14-dns.11、Normal v6.0.14-normal.12、FlClash v6.0.14-flclash.13、OpenClash Normal / Smart v6.0.14-oc-normal.10 / v6.0.14-oc-smart.10、CMFA v6.0.14-cmfa.7、Stash v6.0.14-stash.7、Egern v6.0.14-egern.6。Stash 仍由 CMFA 生成；生成器改为识别顶层零缩进 rules:，因此头部正确标注 151 条规则，而不是误报 0 条。Egern 只从最终 CMFA 重新生成 manifest、hash 与版本元数据；125 份 native 资产及规则语义未改。

## 实际验证和未覆盖项

已记录的本地检查：JS 节点筛选回归 73/73；三个 JS 覆写验证目标通过；严格 Ruby artifact contract 为 2,276 checks / 19 artifacts；OpenClash 节点筛选和 Node-DNS 两个测试各 2/2；PROCESS-NAME 检查通过；CMFA 另有上述 controller 配置类型矩阵收据。结果分别验证纯 JS、Ruby 运行时、静态 artifact 合同和 Mihomo controller 的配置加载，不能相互替代。未执行真实手机 UI、真实订阅下载、公共 DNS 查询或真实代理拨号。

本轮的产品行为、配置范围和适用客户端以本 follow-up 为准；前一份 GitHub 横向报告中的 31 条 VM 探针仍只反映上游 JS 的 synthetic transform 表现，不是本地实现或客户端验收。本地源码和资产状态可在 tools/runtime/subscription-node-filter.js、tools/runtime/subscription-node-filter.rb、Clash Meta For Android/CMFA(mihomo).yaml 和各产物头部/CHANGELOG 中核对。
