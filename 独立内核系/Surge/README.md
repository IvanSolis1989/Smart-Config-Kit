<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-surge-mobile.svg">
  <img src="../../docs/assets/readme/page-surge.svg" alt="Surge 导入指南" width="100%">
</picture>

# Surge 使用教程

面向 Surge iOS 与 Surge Mac 的原生分流配置。先导入配置并接入节点，再检查策略、DNS 和实际请求。

[![下载目录](../../docs/assets/readme/nav-downloads.svg)](../../docs/guide/downloads.md) [![文档导航](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [![导入步骤](../../docs/assets/readme/nav-tutorial.svg)](#import) [![导入验收](../../docs/assets/readme/nav-verify.svg)](#verification)

[开始前](#before-start) · [获取配置](#download) · [顺序导入](#import) · [必要设置](#settings) · [验收](#verification) · [常见问题](#faq) · [进阶与参考](#reference)

> 配置：`Surge.conf` · **v6.0.21-Surge.14**（Build 2026-10-28）
> 22 区域组（11 全部 + 11 家宽）+ 33 业务组；跟随 Clash Party v6.0.21 分流基线。

<a id="before-start"></a>


## 开始前

准备 Surge、可用的机场订阅 URL，以及下方配置直链。截至 2026-10-19，官方稳定版 Surge 5.23.0 要求 iOS 17+；Surge Mac 6.10.0 要求 macOS 12+。商店地区与版本证据见[复核报告](../../docs/upstream/2026-10-19/apple/report.md)。

- iOS 从 App Store 安装 Surge 5，Mac 从 [Surge 官网](https://nssurge.com/)获取；授权与价格以官方页面为准。
- 本仓库 `.conf` 不包含可用机场节点；`RULE-SET` 需要联网下载。
- 区域组使用 `url-test`，Surge 原生 smart 与 Mihomo Smart / LightGBM 是不同能力。MITM 与脚本默认关闭。

<a id="download"></a>

## 获取配置

[![下载 Surge CONF](../../docs/assets/readme/button-surge-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/Surge.conf)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**Surge CONF 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/Surge.conf
```

复制配置直链，按下文导入并接入节点订阅。

配置下载和远程规则更新需要访问 GitHub Raw；失败时参见[下载排错](../../docs/rule-asset-delivery.md)。本地定制先保留副本，远程更新可能覆盖修改。

### 在线选择与本地导入

打开[在线配置页面](https://ivansolis1989.github.io/Smart-Config-Kit/)，选择 **Surge** 和 Full、Lite 或 Custom 业务方案，可按需设置测速和 QUIC。QUIC 限制使用原生 all-proxy，范围覆盖全部代理 QUIC，代价比仅限制海外规则更广。此静态配置不提供运行时节点 DNS 或倍率适配。

下载 `.conf` 后可将副本放到自己的 HTTPS 地址，按下方 **配置 → ➕ → 从 URL 安装** 启用；再按下文接入订阅或手动节点。

Lite / Custom 的业务组按所选方案裁剪；下方组数量为 Full 基线。更新时刷新在线页面，重新选择相同业务方案和参数并下载；先备份已有配置及节点定制，再按上述方式替换或重新导入。不要用本仓库完整配置直链刷新覆盖定制文件。选择和生成在本机完成，不读取或上传订阅和个人配置。详见[在线配置指南](../../docs/configuration.md)。

<a id="import"></a>

## 按顺序导入

### 1. 安装并启用配置

1. Surge → **配置** → **➕** → **从 URL 安装**。
2. 粘贴配置 URL，下载后点击配置并启用。
3. 检查全部远程 RULE-SET 下载完成；网络无法访问 GitHub Raw 时，先使用可用代理下载。

### 2. 接入节点

**A. 把机场订阅作为独立子配置**：使用 Surge 支持的订阅格式接入节点，再确认主配置可引用这些节点。具体菜单随版本变化，子配置 UI 流程仍需真机核验。

**B. 手动节点**：按 `Surge.conf` 内注释，在 `[Proxy]` 中填写 Surge 原生节点定义。

区域组通过 `include-all-proxies=true` 和 `policy-regex-filter` 筛选节点；导入后检查组内实际成员。

### 多机场订阅合并

如需转换或合并订阅，输出必须是 Surge 支持的格式。第三方转换服务可看到含 token 的订阅链接，使用前确认服务可信。

### 3. 检查并启动

确认区域组有可用成员，选择业务组上游，再启动连接；iOS 首次连接时允许添加 VPN 配置。

<a id="settings"></a>

## 必要设置

### 区域组

11 个地区各有全部节点和家宽节点组，共 22 组；按节点名称筛选。组内为空或分类不符时，先检查订阅是否接入及名称是否含地区标识。测速参数以配置文件为准。

<a id="业务策略组select-手动"></a>

### 业务组选择

首次导入后，为 33 个业务组选择适用的区域或节点；下表仅作场景参考，服务可用性还取决于实际出口。

| 业务组 | 推荐区域 |
|--------|----------|
| 🤖 AI 服务 | 🇺🇸 美国节点（避开 HK / CN） |
| 💰 加密货币 | 🇭🇰 香港 / 🇯🇵 日韩 / DIRECT（视账户注册地） |
| 🏦 金融支付 | 🌍 全球 |
| 💬 即时通讯 | 🌍 全球 或 🇭🇰 香港 |
| 📱 社交媒体 | 🌍 全球 |
| 🧑‍💼 会议协作 | 🌍 全球 或 🇯🇵 日韩 |
| 📺 国内流媒体 | DIRECT（境内）/ 🇭🇰 香港（境外） |
| 🎵 TikTok | 按目标地区选择实际可用节点 |
| 🎥 Netflix | 🇺🇸 美国节点 |
| 🎬 Disney+ | 🇺🇸 美国节点 |
| 📡 HBO/Max | 🇺🇸 美国节点 |
| 📺 Hulu | 🇺🇸 美国节点 |
| 🎬 Prime Video | 🇺🇸 美国节点 |
| 📹 YouTube | 🌍 全球节点 |
| 🎵 音乐流媒体（Spotify/Apple Music） | 🌍 全球节点 |
| 🇭🇰 香港流媒体 | 🇭🇰 香港节点 |
| 🇹🇼 台湾流媒体 | 🇹🇼 台湾节点 |
| 🇯🇵 日韩流媒体 | 🇯🇵 日韩节点 |
| 🇪🇺 欧洲流媒体 | 🇪🇺 欧洲节点 |
| 🌐 其他国外流媒体 | 🌍 全球节点 |
| 🕹️ 国内游戏 | DIRECT |
| 🎮 国外游戏 | 🌍 全球 或 🇯🇵 日韩（低延迟） |
| 🔍 Google 服务 | 🌍 全球 |
| 🔧 工具与服务 | 🌍 全球 |
| Ⓜ️ 微软服务 | 🌍 全球 |
| 🍎 苹果服务 | DIRECT（境内）|
| 📥 下载更新 | 🌍 全球 |
| 🛰️ BT/PT Tracker | REJECT |
| 🏠 国内网站 | DIRECT |
| 🚫 受限网站（GFW） | 中国选代理 / 海外选 DIRECT |
| 🌐 国外网站 | 🌍 全球 |
| 🐟 漏网之鱼 | 🌍 全球（FINAL）|
| 🛑 广告拦截 | REJECT |

### DNS 与数据库

DNS 位于 `[General]`。多个加密 DNS **并发查询，采用首个有效响应**；配置加密 DNS 后，普通 DNS 仅用于连通性检测与服务器域名自举。

- `dns-server`：223.5.5.5、119.29.29.29、1.1.1.1、8.8.8.8，用于连通性检测与域名自举。
- `encrypted-dns-server`：AliDNS 两个 IP-host DoH 加 Google / Cloudflare DoH，并发查询，首答生效。
- `encrypted-dns-follow-outbound-mode`：当前为 `false`，加密 DNS 直连，不进入出站分流规则。
- `hijack-dns`：8.8.8.8:53、8.8.4.4:53，劫持指定硬编码 DNS 查询。

当前加密 DNS 均直连；全部失败时，未实现“明文兜底”或“失败再转代理”。Surge 不支持旧 `[DNS]` 节；将 `encrypted-dns-follow-outbound-mode` 改为 `true` 会改变所有加密 DNS 的路由，并可能形成代理域名解析循环。官方依据见[加密 DNS 文档](https://manual.nssurge.com/dns/encrypted-dns.html)与[复核报告](../../docs/upstream/2026-10-19/apple/report.md)。

MMDB 由配置中的 `geoip-maxmind-url` 指定。检查数据库下载状态；本配置使用融合文本 RULE-SET，不直接导入 Mihomo `.mrs`，也不提供 Mihomo TLS 指纹注入。[PROCESS-NAME](https://manual.nssurge.com/rules/process.html) 仅适用于 Surge Mac，Surge iOS 忽略进程规则。

<a id="verification"></a>

## 导入验收

1. 确认当前启用本目录配置，22 个区域组与 33 个业务组已载入；检查区域组内确有可用节点。
2. 确认订阅与全部 `RULE-SET` 下载成功；连接开关开启不能代替下载检查。
3. 访问 `chat.openai.com`、`www.netflix.com`、`www.bilibili.com`，在**活动（Activity）/ Recent Requests**中核对 AI、Netflix、国内流媒体的命中规则与实际出口。
4. 完成[DNS 与导入后验证清单](../../docs/guide/dns-and-verification.md#verification)，按需复测 Wi-Fi / 蜂窝切换。

若日志没有请求、组内为空或出口不符，继续按下方 FAQ 排查。

<a id="faq"></a>

## 常见问题

### VPN 已启动，但所有网站超时、Recent Requests 没有记录？

先检查最终配置的 `[General]`：`tun-excluded-routes` 不得包含或覆盖 `198.18.0.0/15`。这是 Surge 自身的 Fake IP 与 DNS 地址池，排除后流量会绕过 VIF，无法还原域名并进入分流。官方说明见 [Fake IP DNS](https://manual.nssurge.com/dns/advanced.html) 与 [TUN 排除路由](https://manual.nssurge.com/profile/general.html#tun-excluded-routes)。

刷新托管配置；手工维护配置时只删除冲突网段，保留所需局域网旁路。检查模块或本地覆写是否再次加入该网段，然后停止并重新启动 Surge，重新打开网页，在 Recent Requests 确认直连和代理请求均有记录。真机结果以此复测为准。

### Q1：规则集下载失败，配置里显示 `rule-set unavailable`？

确认 URL 可访问、网络权限已允许；必要时先用可用节点连接，再刷新配置与规则集。详见[下载排错](../../docs/rule-asset-delivery.md)。

### Q2：导入时报 `DST-PORT,7680,REJECT` 无效配置？

请重新获取本目录配置。Surge 的端口规则名是 [`DEST-PORT`](https://manual.nssurge.com/rules/source-and-port.html#dest-port)，不能混用其他客户端的 `DST-PORT`。

### Q3：我想要 Mihomo Smart 组 + LightGBM 自动择优，怎么办？

需使用支持该能力的 Mihomo Smart 客户端；Surge 原生 smart 不等同于 LightGBM。

### Q4：iOS 支付 / 银行 App 异常？

先在活动面板确认目标域名、命中规则与出口，再检查节点和 DNS。`skip-proxy` 不能作为“保证直连”的同义配置；不要仅凭 App 名称追加通配域名。

### 我想启用 MITM / JS 脚本（签到、去广告）？

在 Surge 中生成并按系统要求信任证书，仅为所需域名开启 MITM，再添加对应脚本或重写；先检查其与现有规则是否冲突。

### Q5：节点名里有地区 emoji 但没被正确聚合？

检查节点是否已接入候选池，并保留中文地区名或 HK / JP / US 等地区标识；以组内实际成员确认匹配结果。

<a id="q6跨境场景中国--海外怎么切换"></a>

### 跨境场景（中国 ⇄ 海外）怎么切换？

在策略面板切换对应业务组；下表按所在网络作参考。

| 组 | 在中国 | 在海外 |
|---|---|---|
| 🚫 受限网站 | 选代理节点 | DIRECT |
| 🌐 国外网站（jsDelivr） | 代理 | DIRECT |
| 📺 国内流媒体 | DIRECT | 🇭🇰 香港回国节点 |

<a id="reference"></a>

## 进阶与参考

<details>
<summary>协议支持与平台门槛</summary>

协议与 iOS / Mac 门槛按 [Surge 官方文档](https://manual.nssurge.com/policies/overview.html)核对：

| 协议 | 支持 | 说明 |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | AEAD + SS 2022 |
| **ShadowsocksR (SSR)** | ❌ | Surge 不支持 |
| **VMess** | ✅ | ws/h2 |
| **VLESS** | ❌ | 无原生类型；External Proxy 桥接仅限 Mac |
| **REALITY / XTLS-Vision** | ❌ | 无原生类型；iOS 不支持运行 External 程序 |
| **Trojan** | ✅ | |
| **Hysteria v1** | ❌ | 官方协议列表未列此类型 |
| **Hysteria 2** | ✅ | [iOS 5.8.0+ / Mac 5.4.0+](https://manual.nssurge.com/policies/hysteria2.html) |
| **TUIC v5** | ✅ | [`tuic-v5`](https://manual.nssurge.com/policies/tuic.html)，使用 UUID + password；官方页未注明最初引入版本 |
| **AnyTLS** | ✅ | [iOS 5.17.0+ / Mac 6.4.3+](https://manual.nssurge.com/policies/anytls.html)，AnyTLS v2 |
| **WireGuard** | ✅ | 作为二级代理（完整支持）|
| **Snell** | ✅ | [v1–v6](https://manual.nssurge.com/policies/snell.html)；v6 客户端要求 iOS 5.20.0+ / Mac 6.7.0+，官方仍标注 v6 协议为 beta |
| **HTTP/2 / HTTPS / SOCKS5 / HTTP** | ✅ | |
| **External Proxy（外部代理桥接）** | Mac ✅ / iOS ❌ | [仅 Mac 可启动外部程序；iOS 将 external 策略按 REJECT 处理](https://manual.nssurge.com/policies/external.html) |

TUIC 的最初引入版本未由官方页确认；Snell v6 仍标为 beta。完整来源与待核项见[复核报告](../../docs/upstream/2026-10-19/apple/report.md)。

</details>

<details>
<summary>配置托管与更新</summary>

直接使用上方本仓库 Raw URL。需要修改配置时，可放到自己的 HTTPS 地址：

```
https://raw.githubusercontent.com/<user>/<repo>/main/独立内核系/Surge/Surge.conf
```

以下 CDN 样例仅适用于符合 jsDelivr 包大小限制的其他仓库；本仓库配置和融合规则请使用 GitHub Raw。

```
https://cdn.jsdelivr.net/gh/<user>/<repo>@main/独立内核系/Surge/Surge.conf
```

### Surge 自动更新

在客户端确认配置与规则集的更新设置；更新后检查下载状态，不以启动成功代替规则已更新。

### 本仓库升级时同步

远程配置需在客户端刷新；本地修改应先备份，避免更新覆盖。变更记录见 [CHANGELOG](CHANGELOG.md)。

</details>

Surge 提供 Header Rewrite、Script、MITM、External Controller 与 Dashboard；按需单独配置。本配置默认不启用 MITM / 脚本。官方字段见 [Surge Manual](https://manual.nssurge.com/)、[Quick Start](https://manual.nssurge.com/getting-started/quick-start.html) 与 [REFERENCE](REFERENCE-surge-manual.md)。

[Surge](https://nssurge.com/) · [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip)

[分流策略](../../docs/guide/routing-policy.md) · [客户端支持](../../docs/guide/client-support.md) · [DNS 与验收](../../docs/guide/dns-and-verification.md)

[测速与 QUIC](../../docs/traffic-options.md) · [微信连接排错](../../docs/research/2026-10-16-wechat-issue-187.md) · [Claude Desktop 网络依赖](../../docs/claude-service-dependencies.md)

[配置变更记录](CHANGELOG.md) · [官方资料复核与待验边界](../../docs/upstream/2026-10-19/apple/report.md) · [支持本项目](../../docs/donate.md)
