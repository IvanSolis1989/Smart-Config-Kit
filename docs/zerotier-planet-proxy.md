# ZeroTier 根节点 UDP 的本地代理选项

在已经确认 ZeroTier 根节点的直连 UDP 无回包、且已有美国节点组支持 UDP 的设备上，可以在本地 JS 副本中启用这项选项。仓库发布值始终为 `false`，机场订阅字段和系统环境变量不能选择它。

```js
const SCKI_ZEROTIER_PLANET_PROXY = true
```

适用于 Clash Party Smart、Normal 和同构的 FlClash JS；只有确认需要该路径的设备开启。正常网络及普通手机订阅保留 `false`。保存现有已关联本地脚本的备份，更新其内容并修改这一行，随后让客户端重新生成并加载配置。更新已有脚本内容无需添加新的覆写条目；客户端内存中的临时规则不代表已经保存为长期配置。

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

四地址、端口、协议及目标由 `rulesets/source/routing-graph.js` 的 `getZeroTierPlanetProxyPolicy()` 唯一定义，经 `tools/sync-traffic-options.js` 写入共享运行时和三份 JS。它不进入默认 source graph / fused 规则图，也不写入全平台 `traffic-options.json`。同步工具恢复发布默认值；更新本地副本后应核对该设备的启用值。

| 产物 | 本次处理 |
| --- | --- |
| Clash Party Smart / Normal | 同步本地开关、写前预检、前置规则和回归；默认关闭 |
| FlClash JS | 同步相同运行时，区域组仍为原有 url-test；默认关闭 |
| CMFA / Stash / OpenClash Normal / Smart | 本次未扩展其静态或 shell 参数入口，默认图和实际产物字节不变 |
| Shadowrocket / Surge / Loon / Quantumult X / Egern | 本次未新增其独立格式的本地选项入口，默认规则与实际资产字节不变；Egern 清单只更新源文件真实哈希 |
| SingBox / v2rayN / Passwall / Passwall2 | 本次未扩展静态出站及路由选项入口，默认规则与资产字节不变 |

这是受限设备的可信 JS 本地选项，不是跨平台默认分流策略变更。协议、端口和精确 IP 的 `AND` 组合属于维护契约允许内联的逻辑规则；放入默认补充/fused 规则集会扩大所有设备的行为，因此保持独立。原来的 55 个组定义和各平台默认广告前置不变；仅本地启用设备的四条精确例外优先。

## 验证

```text
node tools/sync-traffic-options.js --check
node --test tools/tests/zerotier-planet-proxy.test.js tools/tests/traffic-options.test.js tools/tests/traffic-cross-clients.test.js
node tools/validate-js-overwrites.js
node tools/validate-artifact-contracts.js --strict-ruby
node tools/validate-process-name-direct.js
```

回归执行三份实际 `main()`，检查原交通选项组合、默认结果、四条范围和优先级、重复生成、未信任订阅输入及无目标组时的输入保持。设备应用仍须读回最终配置和实际连接结果。
