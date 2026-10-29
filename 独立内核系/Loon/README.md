<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-loon-mobile.svg">
  <img src="../../docs/assets/readme/page-loon.svg" alt="Loon 导入指南" width="100%">
</picture>

# Loon 使用教程

使用 Loon 原生配置接入同源分流规则；节点订阅单独添加，DNS、NameRegex 与 MMDB 按 Loon 语法设置。

[![下载目录](../../docs/assets/readme/nav-downloads.svg)](../../docs/guide/downloads.md) [![文档导航](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [![导入步骤](../../docs/assets/readme/nav-tutorial.svg)](#import) [![导入验收](../../docs/assets/readme/nav-verify.svg)](#verification)

[开始前](#before-start) · [获取配置](#download) · [顺序导入](#import) · [必要设置](#settings) · [验收](#verification) · [常见问题](#faq) · [进阶与参考](#reference)

> 配置：`Loon.conf` · **v6.0.21-Loon.11**（Build 2026-10-28）
> 22 区域组（11 全部 + 11 家宽）+ 33 业务组；跟随 Clash Party v6.0.21 分流基线。

<a id="before-start"></a>


[可选业务方案与本地参数](../../docs/configuration.md)：完整配置继续作为默认；可选投影输出到独立目录，运行时参数支持范围见统一指南。

## 开始前

准备 Loon、机场订阅 URL 和下方配置直链。截至 2026-10-19，官方稳定版 3.5.2 要求 iOS 15+；官方商店亦允许在 Apple Silicon Mac 上运行 iOS App，这与独立原生 Mac 版本不同。来源见[复核报告](../../docs/upstream/2026-10-19/apple/report.md)。

- 从 [App Store](https://apps.apple.com/app/loon/id1373567447)安装，首次连接时允许添加 VPN 配置。
- `.conf` 提供分流规则，不含机场节点；`[Remote Rule]` 需联网下载。
- 使用 `url-test`，不提供 Mihomo Smart / LightGBM；插件和 MITM 需另行配置。

<a id="download"></a>

## 获取配置

[![下载 Loon CONF](../../docs/assets/readme/button-loon-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/Loon.conf)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**Loon CONF 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/Loon.conf
```

复制配置直链，按下文导入并接入节点订阅。

配置下载和远程规则更新需要访问 GitHub Raw；失败时参见[下载排错](../../docs/rule-asset-delivery.md)。本地定制先保留副本，远程更新可能覆盖修改。

<a id="import"></a>

## 按顺序导入

### 1. 下载并启用配置

1. 复制下方配置直链；需要自定义时，放到自己的 HTTPS 地址。
2. 在 Loon 的配置管理中从 URL 下载，选择并启用该配置。
3. 检查远程规则是否下载完成；GitHub Raw 不可达时，先使用可用代理下载。

### 2. 添加机场订阅

在 Loon 的订阅管理中添加**机场订阅 URL**，更新后检查节点列表。地区筛选使用 `[Remote Filter]` 的 `NameRegex / FilterKey`；主配置不包含可用节点。

机场应提供 Loon 支持的订阅格式；导入后确认各区域组实际成员。

### 多机场订阅合并

可以分别添加订阅；如需转换或合并，输出须为 Loon 支持的格式。第三方转换服务可读取含 token 的订阅链接，使用前确认服务可信。

### 3. 检查并连接

确认远程规则和订阅下载完成，区域组含可用节点，选择业务组上游后启动 Loon；首次启动允许添加 VPN 配置。

<a id="settings"></a>

## 必要设置

### 策略组

11 个地区各有全部节点和家宽节点组，共 22 个 `url-test` 区域组；33 个业务组供手动选择上游。名称需含地区标识，具体测速参数以配置文件为准。

业务策略可参考 [Surge 业务组说明](../Surge/README.md#业务策略组select-手动)，选择后仍须核对实际出口。

### DNS 原生字段

| 字段 | 本配置的用法 |
|---|---|
| `dns-server` | 普通 DNS 仅放 system 或 IP：223.5.5.5、119.29.29.29、1.1.1.1、8.8.8.8 |
| `doh-server` | AliDNS / DNSPod / Cloudflare / Google 的 DoH URL；不要放进 dns-server |
| `ip-mode` | 当前 IP 模式字段；官方要求 3.2.3(754)+ |
| `hijack-dns` | DNS 劫持字段；官方要求 3.2.5(789)+ |
| `udp-fallback-mode` | REJECT |
| `disable-udp-ports` | 443，用于关闭 QUIC / HTTP/3 |
| `bypass-tun` | 私有网段旁路；不是 Surge 的 tun-excluded-routes 字段 |

Loon 默认在加密 DNS 失败后回退普通 DNS，可在 App 中关闭。不要复制 Surge 的 `encrypted-dns-server`、旧 `ipv6` / `ipv6-enabled` 或 `bypass-system` 字段；以[原生字段依据](REFERENCE-loon-manual.md)为准。

### MMDB 数据库

配置已通过 `geoip-url` 指定 MMDB 来源：

```
geoip-url = https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb
```

导入后检查数据库下载状态；下载失败时先确认 URL 与网络，不以“配置已启用”代替数据库可用。

<a id="verification"></a>

## 导入验收

1. 确认当前启用本目录配置，22 个区域组与 33 个业务组已载入；检查区域组内确有可用节点。
2. 确认订阅与全部远程规则下载成功；连接开关开启不能代替下载检查。
3. 访问 `chat.openai.com`、`www.netflix.com`、`www.bilibili.com`，在请求或连接日志中核对 AI、Netflix、国内流媒体的命中规则与实际出口。
4. 完成[DNS 与导入后验证清单](../../docs/guide/dns-and-verification.md#verification)，按需复测 Wi-Fi / 蜂窝切换。

若日志没有请求、组内为空或出口不符，继续按下方 FAQ 排查。

<a id="faq"></a>

## 常见问题

### Q1：我能直接导入 Surge 的 `Surge.conf` 到 Loon 吗？

请使用本目录的 `Loon.conf`。DNS、`NameRegex`、端口及 MMDB 字段应按 Loon 语法填写，不能整份混用其他客户端配置。

### Q2：想要 Mihomo Smart + LightGBM 怎么办？

需使用支持该能力的 Mihomo Smart 客户端；Loon 的 `url-test` 不提供 LightGBM。

### Q3：跨境场景切换？

在策略面板切换“受限网站”“国外网站”“国内流媒体”等业务组；参考 [Surge 跨境场景](../Surge/README.md#q6跨境场景中国--海外怎么切换)。

### Q4：Loon 规则集更新周期怎么调？

在 Loon 中检查配置与远程规则的更新设置，刷新后确认下载状态。

### Q5：我想用 Loon 的插件（Plugin）生态？

可在插件面板添加所需插件；先检查其规则、重写、脚本与现有配置是否冲突，需要 MITM 时按官方流程配置证书。

<a id="reference"></a>

## 进阶与参考

<details>
<summary>协议支持与版本依据</summary>

协议与版本证据见[官方文档](https://nsloon.app/docs/intro/)和[复核报告](../../docs/upstream/2026-10-19/apple/report.md)。

| 协议 | 支持 | 说明 |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | AEAD + SS 2022 |
| **ShadowsocksR (SSR)** | ✅ | 兼容老机场 |
| **VMess** | ✅ | ws/grpc/h2 |
| **VLESS** | ✅ | 含 **REALITY** |
| **XTLS-Vision** | ✅ | |
| **Trojan** | ✅ | |
| **Hysteria v1** | ✅ | |
| **Hysteria 2** | ✅ | |
| **TUIC v5** | ✅ | |
| **WireGuard** | ✅ | 作为子代理 |
| **Snell v3 / v4** | ✅ | 少有的 iOS 客户端支持 Snell |
| **AnyTLS / ShadowTLS** | ✅ | [官方版本历史](https://apps.apple.com/us/app/loon/id1373567447)：AnyTLS 3.3.9（2026-03-31）；ShadowTLS 3.2.6（2025-02-03） |
| **SOCKS5 / HTTP(S)** | ✅ | |

</details>

Loon 的 `[Remote Filter] NameRegex / FilterKey` 负责节点筛选；远程规则使用本仓库融合文本，不直接使用 Clash classical YAML、Surge 专用 domainset 或 Mihomo `.mrs`。iOS / tvOS 含进程条件的整条逻辑规则会被忽略。

Loon 的 `[Plugin]` 可组合规则、脚本和重写；`[Script]` 与插件均需自行添加并检查冲突。官方入口：[Loon 文档](https://nsloon.app/docs/intro/)、[REFERENCE](REFERENCE-loon-manual.md)。

[Loon](https://apps.apple.com/app/loon/id1373567447) · [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip)

[分流策略](../../docs/guide/routing-policy.md) · [客户端支持](../../docs/guide/client-support.md) · [DNS 与验收](../../docs/guide/dns-and-verification.md)

[测速与 QUIC](../../docs/traffic-options.md) · [微信连接排错](../../docs/research/2026-10-16-wechat-issue-187.md) · [Claude Desktop 网络依赖](../../docs/claude-service-dependencies.md)

[配置变更记录](CHANGELOG.md) · [官方资料复核与待验边界](../../docs/upstream/2026-10-19/apple/report.md) · [支持本项目](../../docs/donate.md)
