# ZeroTier 根节点 UDP 的本地代理选项

在已经确认 ZeroTier 根节点的直连 UDP 无回包、且已有美国节点组支持 UDP 的设备上，可以在本地 JS 副本中启用这项选项。仓库发布值始终为 `false`，机场订阅字段和系统环境变量不能选择它。

```js
const SCKI_ZEROTIER_PLANET_PROXY = true
```

适用于 Clash Party Smart、Normal 和同构的 FlClash JS；只有确认需要该路径的设备开启。正常网络及普通手机订阅保留 `false`。使用下列命令更新已经关联的本地脚本，保留该设备的明确开启或关闭选择。客户端内存中的临时规则不代表已经保存为长期配置。

```powershell
# 更新已有本地覆写：默认保留其 ZeroTier 布尔值；preserve-local 同时保留测速/QUIC。
node tools/configure-traffic-options.js --target 'C:\path\existing-local.js' --source 'Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js' --preserve-local --dry-run
node tools/configure-traffic-options.js --target 'C:\path\existing-local.js' --source 'Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js' --preserve-local

# 仅在这台设备上明确启用或关闭；省略 source 时只调整现有本地文件。
node tools/configure-traffic-options.js --target 'C:\path\existing-local.js' --zerotier on
node tools/configure-traffic-options.js --target 'C:\path\existing-local.js' --zerotier off
```

`--target` 必须是已有普通 `.js` 文件，`--source` 可换成 Normal 或 FlClash 源码。工具严格读取唯一顶层可信 `const`，不执行目标代码；非法/重复开关拒绝写入，缺失开关按发布 `false`。显式参数优先。实际更新会保留原件备份、原子替换并读回；dry-run 和内容相同的重复更新均不写入。ZeroTier 参数必须有目标本地文件，不能修改全仓默认值。

设备应关联 **local 类型** 的覆写，再由上述入口更新其内容。订阅刷新会重新执行此本地脚本，因此沿用保存的常量；直接覆盖为远端发布脚本仍会得到发布默认 `false`。远端自动更新的 override 不能自行合并设备常量，应先转为本地副本。此工具不重新加载内核，也不修改代理组选择。

启用后只有下列四种流量进入现有 `🇺🇸 美国节点` 组，规则放在原分流规则之前：

| 目标 IP | 协议 | 目标端口 | 出站 |
| --- | --- | --- | --- |
| 103.195.103.66/32 | UDP | 9993 | 🇺🇸 美国节点 |
| 79.127.159.187/32 | UDP | 9993 | 🇺🇸 美国节点 |
| 84.17.53.155/32 | UDP | 9993 | 🇺🇸 美国节点 |
| 185.152.67.145/32 | UDP | 9993 | 🇺🇸 美国节点 |

每条使用 `AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,<地址>/32,no-resolve)),🇺🇸 美国节点`，因此 TCP/9993、其他 UDP 端口和其他 IP 不在匹配范围内。其余规则顺序、代理组成员与选择、DNS 和健康检查/QUIC 选项保持原行为。重复生成保持四条；关闭后恢复默认规则。

节点预检或筛选后没有美国节点时，脚本在写入前保留原输入并输出 `requires existing 🇺🇸 美国节点`，不会创建空美国组或改用其他区域。启用设备需检查最终生成配置的首四条规则、实际 UDP 回包与 ZeroTier ONLINE 状态；不能只检查版本号或磁盘上的开关。

官方 [Mihomo 路由规则](https://wiki.metacubex.one/config/rules/) 定义了 `AND`、`NETWORK`、`DST-PORT`、`IP-CIDR`、`no-resolve` 和从上至下匹配。官方还说明不支持 UDP 的节点会继续向下匹配，因此这个选项以已有目标组可实际承载 UDP 为前提。无需抬高仓库既有脚本最低版本。

## 来源与平台范围

四地址、端口、协议及目标由 `rulesets/source/routing-graph.js` 的 `getZeroTierPlanetProxyPolicy()` 唯一定义，经 `tools/sync-traffic-options.js` 写入共享运行时和三份 JS。它不进入默认 source graph / fused 规则图，也不写入全平台 `traffic-options.json`。同步时测速/QUIC 沿用源预设，ZeroTier 的明确 `true` 或 `false` 原样保留；仓库三份发布脚本仍为 `false`。本地复制入口从目标文件保留该设备选择。

| 产物 | 本次处理 |
| --- | --- |
| Clash Party Smart / Normal | 同步本地开关、写前预检、前置规则和回归；默认关闭 |
| FlClash JS | 同步相同运行时，区域组仍为原有 url-test；默认关闭 |
| CMFA / Stash / OpenClash Normal / Smart | 本次未扩展其静态或 shell 参数入口，默认图和实际产物字节不变 |
| Shadowrocket / Surge / Loon / Quantumult X / Egern | 本次未新增其独立格式的本地选项入口，默认规则与实际资产字节不变；Egern 清单只更新源文件真实哈希 |
| SingBox / v2rayN / Passwall / Passwall2 | 本次未扩展静态出站及路由选项入口，默认规则与资产字节不变 |

这是受限设备的可信 JS 本地选项，不是跨平台默认分流策略变更。协议、端口和精确 IP 的 `AND` 组合属于维护契约允许内联的逻辑规则；放入默认补充/fused 规则集会扩大所有设备的行为，因此保持独立。原来的 55 个组定义和各平台默认广告前置不变；仅本地启用设备的四条精确例外优先。

## UDP 选路与刷新验收

美国组的 TCP 测速成功、节点声明 `udp: true` 或累计历史下载量，都不能证明当前 ZeroTier UDP 有回包。对启用设备，先实测四根 UDP 流量的本窗口下载增量，再在客户端将美国组固定到这台设备已验证的节点。固定美国组也影响其他当前引用此组的流量，但无需修改其他 Selector 的选择。不要把某台设备的一次成功节点写入全仓常量。

三份 JS 已启用 [`profile.store-selected`](https://wiki.metacubex.one/config/general/#_28)。Smart fork 的 [API 选择](https://github.com/vernesong/mihomo/blob/daf3ad03021cca6031f4a7303ca6d861a14d5a16/hub/route/proxies.go#L74) 写入缓存，[配置刷新](https://github.com/vernesong/mihomo/blob/daf3ad03021cca6031f4a7303ca6d861a14d5a16/hub/executor/executor.go#L449) 对 Smart 等可选组恢复选择；`fixed` 是 API 运行时状态，不是可新增的 Smart 配置字段。恢复要求同一缓存、同一组名和仍存在的节点名。节点消失时 [Smart 会回到自动选择](https://github.com/vernesong/mihomo/blob/daf3ad03021cca6031f4a7303ca6d861a14d5a16/adapter/outboundgroup/smart.go#L616)，应明确报验收未通过并重新实测；不能用 TCP 分数自动替代 UDP 证据或遍历未知候选。

Windows 可使用只读验收脚本，采集部署前后或订阅刷新后的状态：

```powershell
pwsh -NoProfile -File tools/verify-zerotier-planet.ps1 -OverridePath 'C:\path\existing-local.js' -Seconds 20 -RequireFixed -ReportPath '.cache\zerotier-after.json'
```

只有一个 Mihomo admin pipe 时自动发现，多实例用 `-PipeName` 明确指定。工具检查首四条规则、同节点的 ZeroTier 自有 UDP download 增量、持续 ONLINE、固定选择、TUN、Selector 及受保护文件状态；流归属必须由源端点的唯一服务 PID 证明，报告必须为独立的新 JSON 文件。`-PeerAddress`、`-SourceAddress`、`-InterfaceIndex` 可额外分别测普通与绑定接口的 22/3389。它不写 API、不清连接、不改路由/防火墙/ZeroTier 设置，也不重启服务。身份私钥不可读时只比较文件长度和修改时间，报告 `HashAvailable=false`。20 秒未观察到新增回包只表示该窗口未证实，可延长至 60 秒；不表示节点永久失效。TCP、SSH 与根 UDP 是独立验收信号。

## 仓库验证

```text
node tools/sync-traffic-options.js --check
node --test tools/tests/local-traffic-options.test.js tools/tests/zerotier-planet-proxy.test.js tools/tests/traffic-options.test.js tools/tests/traffic-cross-clients.test.js
node tools/validate-js-overwrites.js
node tools/validate-artifact-contracts.js --strict-ruby
node tools/validate-process-name-direct.js
```

回归执行三份实际 `main()`，检查原交通选项组合、默认结果、四条范围和优先级、重复生成、未信任订阅输入及无目标组时的输入保持。设备应用仍须读回最终配置和实际连接结果。
