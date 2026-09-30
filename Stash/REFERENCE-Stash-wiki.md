# REFERENCE — Stash Wiki

> 2026-09-30 复核：官方 [协议类型](https://stash.wiki/en/proxy-protocols/proxy-types#direct-with-specified-interface) 支持具名 direct；[策略组](https://stash.wiki/en/proxy-protocols/proxy-groups) 与 [远程集合](https://stash.wiki/en/proxy-protocols/proxy-providers) 未公开 `exclude-type` / `empty-fallback` 等价字段，且空池按 DIRECT 处理。延续现有兼容裁剪，删除 CMFA 的两个新增组字段；测速 provider 与具名支持出站应在聚合层分开，并核对拨号依赖。

> 目录简介：这里记录 Stash 产物使用的官方文档依据。最后检查日期：2026-08-08。

## 官方来源

| 主题 | 官方链接 | 本仓库使用结论 |
|---|---|---|
| 配置文件结构 | https://stash.wiki/en/configuration/example-config | Stash 使用单个 YAML 配置文件，可包含 `mode`、`hosts`、`dns`、`proxy-providers`、`proxy-groups`、`rule-providers`、`rules`。 |
| 远程代理集 | https://stash.wiki/en/proxy-protocols/proxy-providers | `proxy-providers` 支持 `url`、`interval`、`path`、`filter`、`headers`，并通过 `proxy-groups.use` 引用。文档没有 `type: http`、`health-check`、`exclude-filter`。 |
| 策略组 | https://stash.wiki/en/proxy-protocols/proxy-groups | `proxy-groups` 支持 `select`、`url-test`、嵌套策略组、远程代理集、`filter` 正则筛选和 `interval: 300`。空组会按 `DIRECT` 处理。 |
| 规则集 | https://stash.wiki/en/rules/rule-set | `rule-providers` 需要在 `rules` 中用 `RULE-SET` 引用；支持 `domain`、`ipcidr`、`classical`，MRS 仅支持 `domain` / `ipcidr`。 |
| 规则类型 | https://stash.wiki/en/rules/rule-types | 支持域名、IP/端口、协议、逻辑与复合规则；规则按从上到下顺序匹配。 |
| DNS 示例 | https://stash.wiki/en/configuration/example-config | `default-nameserver` 示例要求只填 DNS 服务器 IP；`nameserver` 支持 UDP/TCP/DoT/DoH/DoQ；`nameserver-policy` 支持域名与 `geosite:cn` 等键。 |
| 内置 DNS 服务 | https://stash.wiki/en/features/dns-server | Stash 默认 DNS 查询直连；启用 follow-rule 前需避免递归解析风险。 |
| Override | https://stash.wiki/en/configuration/override | `.stoverride` 是可选覆盖文件，本仓库当前不生成 Stash override。 |
| 协议类型 | https://stash.wiki/en/proxy-protocols/proxy-types | Stash 支持 Shadowsocks / Shadowsocks2022、ShadowsocksR、SOCKS5、HTTP、VMess、Snell、Trojan、AnyTLS、TrustTunnel、Hysteria、Hysteria2、VLESS、TUIC、Juicity、WireGuard、Tailscale、SSH 等协议；ShadowTLS 以 Shadowsocks 插件形式支持 v2/v3。 |
| App Store 描述 | https://apps.apple.com/app/stash-rule-based-proxy/id1596063349 | Stash 声明兼容 Clash Premium 配置，支持 Rule Set、HTTP rewrite、MitM、SSID policy、On-Demand、TCP/UDP/ICMP、DNS over TCP/TLS/HTTPS。 |

## 生成裁剪规则

`Stash/Stash.yaml` 不直接复制 CMFA 全量 YAML，而是由 `tools/generate-stash-from-cmfa.js` 做以下固定转换：

1. 重写头部版本为 `vX.Y.Z-stash.N`，保留 Clash Party 与 CMFA 基线版本。
2. 删除未在 Stash Wiki 中确认的 Mihomo 专属顶层字段：`bind-address`、`unified-delay`、`tcp-concurrent`、`find-process-mode`、`keep-alive-*`、`geodata-mode`、`geo-auto-update`、`geo-update-interval`、`geox-url`、`profile`、`sniffer`。
3. DNS 仅保留 Stash 文档覆盖的 `enable`、`ipv6`、`enhanced-mode`、`fake-ip-range`、`fake-ip-filter`、`default-nameserver`、`nameserver`、`nameserver-policy`。
4. `default-nameserver` 改为明文 IP：`223.5.5.5`、`119.29.29.29`、`1.1.1.1`、`8.8.8.8`。
5. `proxy-providers.Subscribe` 只保留 `url`、`interval`、`path`，删除 CMFA 的 `type: http`、`health-check`、`exclude-filter`。
6. `proxy-groups` 保留 `select` / `url-test` / `use` / `filter` / `proxies`，删除未确认的 `lazy` 与 `tolerance`。
7. `rule-providers` 删除 provider 下载 `proxy` 字段，因为 Stash Wiki 的 rule set 文档未列出该字段。
8. `rules` 原样保留，仍由合同验证检查 AMap、Douyin、CN game、Cloudflare R2、STUN 端口等关键顺序。

## 未解决风险

- 本仓库尚未在真实 Stash App 内做导入截图级验收；当前验证覆盖 YAML 结构和官方文档字段面对齐。
- 因删除 rule-provider 下载代理字段，墙内网络首次拉取 GitHub / jsDelivr 规则集可能依赖 Stash 当前网络环境。
- Stash Wiki 未承诺 Mihomo Smart / LightGBM 能力；本产物不提供 Smart 自动择优。
