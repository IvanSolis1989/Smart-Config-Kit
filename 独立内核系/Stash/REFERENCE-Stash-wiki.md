# REFERENCE — Stash Wiki

> 核对于 2026-10-23（上次专项核对 2026-10-20）：重新读取 [DNS](https://stash.wiki/en/features/dns-server#domain-based-custom-dns-service) 与[配置示例](https://stash.wiki/en/configuration/example-config)；既有 nameserver-policy 的域名/geosite 键与服务器数组继续受支持，本次不启用新字段。

> 更新于 2026-10-19（原字段摘要 2026-08-08）：官方实际正文、版本和采用边界见[苹果客户端复核](../../docs/upstream/2026-10-19/apple/report.md)，[缓存收据](../../docs/upstream/2026-10-19/apple/manifest.json)可独立读回。

## 当前复核结论

- iOS/tvOS 商店稳定版 3.6.4（2026-10-19 UTC）；Mac 官方 feed 稳定版 4.3.3/564（2026-10-14 UTC），beta 4.4.0/569（2026-10-16 UTC）。Wiki release-notes 的3.4.0/4.2.0是历史页面，不能当最新版本。
- [Rule Set](https://stash.wiki/en/rules/rule-set)确认 domain/ipcidr MRS；现有 fused MRS 保持。inline provider 是 iOS/tvOS3.6+/Mac4.3+ 可选能力，不替代大型远程集合。
- [DNS](https://stash.wiki/en/features/dns-server)现明确 iOS/tvOS3.6+/Mac4.3+ 可用加密 `default-nameserver`（除system外使用IP）、`proxy-server-nameserver`、`rule-set:` DNS引用。旧文“只能明文IP/没有proxy-server”的概括已经过时；当前生成器尚未启用这些字段，本次保持原有保守输出。
- [策略组](https://stash.wiki/en/proxy-protocols/proxy-groups)已明确 `tolerance` 单位毫秒；CMFA值10ms可表达，但官方最初引入版本未取得，本次不修改受保护生成器。旧“未确认tolerance”的原因仅能解释历史裁剪。
- `lazy`、`interval`、空组DIRECT按 Stash 原生文档判断；不从 Mihomo 推导 Smart/LightGBM、empty-fallback、exclude-type。

## 历史摘要边界

以下保留此前依据和裁剪行为；与本节冲突的“未支持/未确认”是历史结论。新能力采用需另行确定最低版本、生成器授权和真实 App 导入验证。


> 2026-10-15 URL 兼容性复核：[官方 Rule Sets 文档](https://stash.wiki/en/rules/rule-set)示范 remote provider 的 HTTPS `url` 与名称式 `RULE-SET` 引用。本次只替换仓库自有规则 URL 主机，不增删字段；详见 [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md)。

> 2026-10-07 复核：官方 [协议类型](https://stash.wiki/en/proxy-protocols/proxy-types#direct-with-specified-interface) 支持具名 direct；[策略组](https://stash.wiki/en/proxy-protocols/proxy-groups) 明确支持 `interval` 与 `lazy`，空池按 DIRECT 处理；策略组与[远程集合](https://stash.wiki/en/proxy-protocols/proxy-providers)未公开 `exclude-type` / `empty-fallback` 等价字段。延续兼容裁剪，测速 provider 与具名支持出站应在聚合层分开，并核对拨号依赖。

> 目录简介：这里记录 Stash 产物使用的官方文档依据。最后检查日期：2026-08-08。

## 官方来源

| 主题 | 官方链接 | 本仓库使用结论 |
|---|---|---|
| 配置文件结构 | https://stash.wiki/en/configuration/example-config | Stash 使用单个 YAML 配置文件，可包含 `mode`、`hosts`、`dns`、`proxy-providers`、`proxy-groups`、`rule-providers`、`rules`。 |
| 远程代理集 | https://stash.wiki/en/proxy-protocols/proxy-providers | `proxy-providers` 支持 `url`、`interval`、`path`、`filter`、`headers`，并通过 `proxy-groups.use` 引用。文档没有 `type: http`、`health-check`、`exclude-filter`。 |
| 策略组 | https://stash.wiki/en/proxy-protocols/proxy-groups | `proxy-groups` 支持 `select`、`url-test`、嵌套策略组、远程代理集、`filter` 正则筛选、`interval` 与 `lazy`。空组会按 `DIRECT` 处理。 |
| 规则集 | https://stash.wiki/en/rules/rule-set | `rule-providers` 需要在 `rules` 中用 `RULE-SET` 引用；支持 `domain`、`ipcidr`、`classical`，MRS 仅支持 `domain` / `ipcidr`。 |
| 规则类型 | https://stash.wiki/en/rules/rule-types | 支持域名、IP/端口、协议、逻辑与复合规则；规则按从上到下顺序匹配。 |
| DNS 示例 | https://stash.wiki/en/configuration/example-config | `default-nameserver` 示例要求只填 DNS 服务器 IP；`nameserver` 支持 UDP/TCP/DoT/DoH/DoQ；`nameserver-policy` 支持域名与 `geosite:cn` 等键。 |
| 内置 DNS 服务 | https://stash.wiki/en/features/dns-server | Stash 默认 DNS 查询直连；启用 follow-rule 前需避免递归解析风险。 |
| Override | https://stash.wiki/en/configuration/override | `.stoverride` 是可选覆盖文件，本仓库当前不生成 Stash override。 |
| 协议类型 | https://stash.wiki/en/proxy-protocols/proxy-types | Stash 支持 Shadowsocks / Shadowsocks2022、ShadowsocksR、SOCKS5、HTTP、VMess、Snell、Trojan、AnyTLS、TrustTunnel、Hysteria、Hysteria2、VLESS、TUIC、Juicity、WireGuard、Tailscale、SSH 等协议；ShadowTLS 以 Shadowsocks 插件形式支持 v2/v3。 |
| App Store 描述 | https://apps.apple.com/app/stash-rule-based-proxy/id1596063349 | Stash 声明兼容 Clash Premium 配置，支持 Rule Set、HTTP rewrite、MitM、SSID policy、On-Demand、TCP/UDP/ICMP、DNS over TCP/TLS/HTTPS。 |

## 生成裁剪规则

`独立内核系/Stash/Stash.yaml` 不直接复制 CMFA 全量 YAML，而是由 `tools/generate-stash-from-cmfa.js` 做以下固定转换：

1. 重写头部版本为 `vX.Y.Z-stash.N`，保留 Clash Party 与 CMFA 基线版本。
2. 删除未在 Stash Wiki 中确认的 Mihomo 专属顶层字段：`bind-address`、`unified-delay`、`tcp-concurrent`、`find-process-mode`、`keep-alive-*`、`geodata-mode`、`geo-auto-update`、`geo-update-interval`、`geox-url`、`profile`、`sniffer`。
3. DNS 仅保留 Stash 文档覆盖的 `enable`、`ipv6`、`enhanced-mode`、`fake-ip-range`、`fake-ip-filter`、`default-nameserver`、`nameserver`、`nameserver-policy`。
4. `default-nameserver` 改为明文 IP：`223.5.5.5`、`119.29.29.29`、`1.1.1.1`、`8.8.8.8`。
5. `proxy-providers.Subscribe` 只保留 `url`、`interval`、`path`，删除 CMFA 的 `type: http`、`health-check`、`exclude-filter`。
6. `proxy-groups` 保留 `select` / `url-test` / `use` / `filter` / `proxies` / `interval`。`standard`（300 秒）与 `power-save`（900 秒）两档均保留源配置显式设置的 `lazy: true`；该字段已由 Stash 官方策略组文档确认支持。仅删除未确认的 `tolerance`。
7. `rule-providers` 删除 provider 下载 `proxy` 字段，因为 Stash Wiki 的 rule set 文档未列出该字段。
8. `rules` 原样保留，仍由合同验证检查 AMap、Douyin、CN game、Cloudflare R2、STUN 端口等关键顺序。

## 未解决风险

- 本仓库尚未在真实 Stash App 内做导入截图级验收；当前验证覆盖 YAML 结构和官方文档字段面对齐。
- 因删除 rule-provider 下载代理字段，墙内网络首次拉取 GitHub / jsDelivr 规则集可能依赖 Stash 当前网络环境。
- Stash Wiki 未承诺 Mihomo Smart / LightGBM 能力；本产物不提供 Smart 自动择优。

### 2026-10-20 业务 DNS policy 复核

Stash 保留原生 DNS policy 表达与处理；依据 [Stash DNS server 文档](https://stash.wiki/en/features/dns-server)。本次从 CMFA 派生 policy 投影，不把 Mihomo 源表直接注入其他客户端，也不改变组结构或节点择路。
