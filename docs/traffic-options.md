# 测速与 QUIC 策略选项

本仓库提供两个彼此独立的选项：节点健康检查频率与海外 QUIC 的处理方式。它们只改变测速时机或 UDP/443 的前置处理；最终仍需由实际客户端、节点和目标网站共同验证效果。

## 选择并生成

在仓库根目录运行：

```bash
# 查看这次选择将修改哪些受管产物
node tools/configure-traffic-options.js --health-check power-save --quic follow-rules --dry-run

# 保存选择并同步客户端产物
node tools/configure-traffic-options.js --health-check power-save --quic follow-rules
```

选择写入 `rulesets/source/traffic-options.json`，供后续生成过程复用。两个参数可独立指定：`--health-check` 取 `standard`（默认）或 `power-save`，`--quic` 取 `block-foreign`（默认）或 `follow-rules`。恢复默认可运行：

```bash
node tools/configure-traffic-options.js --health-check standard --quic block-foreign
```

指定 `--target <已有本地.js>` 时只更新该设备的 JS 文件；`--source <新JS>` 更新源码，`--preserve-local` 保留该设备的测速/QUIC，ZeroTier 的明确布尔值始终默认保留。设备级启用/关闭与安全更新命令见 [ZeroTier 本地代理选项](./zerotier-planet-proxy.md)。

这个命令只切换测速与 QUIC 选项，并复用已发布的 fused 规则资产；复用前会核对源图及资产内容的 SHA 绑定，不从可变的 Geo 缓存或上游重新抓取规则。Egern 另用随仓库保存的压缩原生资产快照：默认档复用原资产字节，`follow-rules` 只按冻结的 fused/Mihomo 资产重算受影响的域名部分，同时保留非域名部分。若同时修改了上游规则源、规则顺序或规则集内容，仍需按仓库生成链完整执行 MRS 同步、fused 编译与各端产物生成，不能用此选项命令代替。

完整刷新时，按仓库 `AGENTS.md` 顺序执行 MRS 同步、fused 编译及各端生成；Egern 使用不带 `--reuse-assets` 的 `node tools/generate-egern-from-cmfa.js`。完整生成器无论当前 QUIC 选项为何，都会先更新可复用的 `block-foreign` 中立快照，再按当前选项输出 Egern 规则。后续仅切换选项时才用 `--reuse-assets`；无需先手动切回 `block-foreign`。

Clash Party Smart/Normal 与 FlClash 的 JS 覆写可分别修改文件顶部的 `const SCKI_HEALTH_CHECK_PROFILE`、`const SCKI_QUIC_POLICY`，然后在客户端重新加载脚本；这些 JS 脚本不读取系统环境变量。OpenClash Smart/Normal 的 shell 脚本可在运行环境用 `SCKI_HEALTH_CHECK_PROFILE=standard|power-save`、`SCKI_QUIC_POLICY=block-foreign|follow-rules` 覆盖构建默认值，变量须由启动脚本的进程继承。静态 YAML/CONF/JSON 文件使用上面的生成命令切换后重新导入。导入后检查客户端实际加载的配置和命中日志，避免仍在使用旧缓存。

## 节点健康检查

`standard` 是默认档：Mihomo 与 Stash 中支持该字段的测速组维持 300 秒，并启用 `lazy: true`。这样未选用的组可跳过后台测速，同时保留使用中组的原有检查间隔。`power-save` 仅将这些支持原生 `lazy` 的组延长到 900 秒，继续使用 `lazy: true`。间隔变长可能让故障节点被发现得更晚；首次选择或切换到久未使用的地区时，测速结果也可能较旧。尚无本仓库设备实测的省电幅度。

| 客户端产物 | `standard` / `power-save` 的实现 |
| --- | --- |
| Clash Party Smart/Normal、FlClash、CMFA、OpenClash Smart/Normal | Mihomo 可测速组分别为 `interval: 300` / `900`，两档均设 `lazy: true`；`lazy` 在组未被选择时跳过测试。Smart 组的实际选路还取决于 Smart 内核。CMFA 静态 YAML 中 `Subscribe` 代理集合的 `health-check.interval` 也分别为 300 / 900 秒并启用 `lazy`。JS 和 OpenClash 会展开/重建订阅节点，因此不对已消失的原始 provider 增添字段。 |
| Stash | 支持的策略组分别使用 `interval: 300` / `900`，两档均设 `lazy: true`。 |
| Surge | 两档均保留现有原生按使用触发的复测方式和间隔；网络变化仍可能触发复测。本次不添加 Mihomo 的 `lazy` 字段。 |
| Shadowrocket、Loon | 两档均维持各自现有测速间隔和调度；两端没有本次采用的原生 `lazy` 字段。 |
| Quantumult X | 两档均维持现有 `url-latency-benchmark` 调度和参数；不将 Mihomo `lazy` 字段移植到 QX。 |
| sing-box | 两档均维持现有 `urltest.interval` 与 `idle_timeout`；后者是空闲超时，不等于 Mihomo `lazy`。 |
| Egern | 两档均保留当前原生 `smart` 组的自适应探测。官方 `interval` 适用于 `auto_test`，因此不强行改变组类型。仅因 CMFA 源元数据更新而重新生成时，Egern 的生成清单哈希会刷新。 |
| v2rayN Xray 路由 JSON、Passwall/Passwall2 shunt 产物 | 这些产物只描述路由或分流规则，节点测速由客户端其他设置管理。 |

字段依据：[Mihomo 代理组 `interval`/`lazy`](https://wiki.metacubex.one/config/proxy-groups/)、[Stash 定时测速](https://stash.wiki/en/proxy-protocols/proxy-groups)、[Surge 自动测速组](https://manual.nssurge.com/policy-groups/url-test.html)、[sing-box URLTest](https://sing-box.sagernet.org/configuration/outbound/urltest/)、[Egern 策略组](https://egernapp.com/docs/configuration/policy_groups/)、[Quantumult X 官方示例](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)。各客户端还有自身的后台限制、应用休眠与手动测速行为，不能仅凭字段推断电量收益。

## 海外 UDP/443 与 QUIC

`block-foreign` 以源规则图的原有四项服务例外加非国内 UDP/443 拒绝为基准；`follow-rules` 去掉这条专用拒绝，让 UDP/443 进入后续正常业务规则。它并不保证目标网站一定使用 HTTP/3，也不改变节点本身的 UDP 能力。受客户端语法所限，各端的 `block-foreign` 并非都能精确表达源规则图的地址与端口组合。

| 平台 | `block-foreign` 的实际边界与切到 `follow-rules` 后的处理 |
| --- | --- |
| Mihomo、Stash、sing-box、Egern | 在其支持的规则语法内保留前置 UDP/443 处理；切换后移除专用拒绝规则。 |
| Shadowrocket、Surge | 旧配置使用 `block-quic = all-proxy` 引擎开关，无法表达四项服务例外和“非国内”条件，因此旧行为覆盖面比源规则图更宽；`follow-rules` 需取消受管的全局拦截。 |
| Loon | 旧配置的 `disable-udp-ports = 443` 禁用全部 UDP/443，包含国内地址和四项服务例外；`follow-rules` 需移除这一受管限制。 |
| Quantumult X | 两档都保留 `fallback_udp_policy=reject`：它只在所选节点不支持 UDP 时拒绝能力回退，不按目的地址和 UDP/443 执行源图的条件拒绝；因此不能声称与源图等价。 |
| Passwall、Passwall2 | 本仓库产物是 shunt 规则集与应用脚本，没有独立的端口检查器；实际 UDP 能力还取决于 LuCI 设置及所选核心。 |
| v2rayN Xray | 仅提供路由规则，实际流量捕获与 UDP 能力取决于 v2rayN/Xray 配置。 |

两种模式都可能改变访问体验。拒绝海外 UDP/443 可能让应用回退到 TCP；放行后，无法承载 UDP 的节点可能出现超时，或使应用走到与 TCP 不同的连接路径。尤其在上述降级平台，以具体客户端的连接日志判断实际命中，不能推断 14 端精确等价。

切换后，在同一网络、同一节点和同一目标应用上分别观察 TCP/443 与 UDP/443 的连接和规则命中，并记录失败或回退路径。目前没有设备对照结果，不能把这项选项描述为已修复某个应用的历史故障。
