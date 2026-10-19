# Surge 使用教程（对齐 Clash Party v6.0.20）

## 📥 规则下载链接

[![下载规则：Surge CONF](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Surge%20CONF-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Surge/Surge.conf)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**Surge CONF 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Surge/Surge.conf
```

复制配置直链，按下文导入并接入节点订阅。

---

规则下载需能访问 GitHub Raw；见[下载排错](../docs/rule-asset-delivery.md)。可选[测速与 QUIC 策略](../docs/traffic-options.md)、[微信连接排错](../docs/research/2026-10-16-wechat-issue-187.md)与[Claude Desktop 网络依赖](../docs/claude-service-dependencies.md)另有说明。

> 配置：`Surge.conf` · **v6.0.20-Surge.12**（Build 2026-10-20）
> 22 区域组（11 全部 + 11 家宽）+ 33 业务组；跟随 Clash Party v6.0.20 分流基线。

<sub>💖 [支持本项目](../docs/donate.md) · ⭐ [Star](https://github.com/ivansolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues)</sub>

---

## 🚀 零基础快速开始

### 这是什么？

本仓库的 `Surge.conf` 提供国内直连、海外代理和广告拦截规则；节点需另行接入。

### 我要准备什么？

准备 Surge、可用的机场订阅 URL，以及上方配置直链。截至 2026-10-19，官方稳定版 Surge 5.23.0 要求 iOS 17+；Surge Mac 6.10.0 要求 macOS 12+。商店地区与版本证据见[复核报告](../docs/upstream/2026-10-19/apple/report.md)。

### Surge 值不值这个价？

按所需协议、Mac 支持、脚本与 MITM 功能选择；授权与价格以[官方商店](https://nssurge.com/)为准。

### 术语速查

- `.conf`：分流配置，不含机场节点。
- `RULE-SET`：需联网下载的规则集。
- MMDB：GeoIP 数据库，本配置使用 `geoip-maxmind-url` 指定来源。
- MITM：HTTPS 解密；本配置默认关闭。

### 3 步走完

1. 安装 Surge，首次连接时允许添加 VPN 配置。
2. 从上方直链导入并启用配置，详见第三节。
3. 按第四节接入节点，再启动连接。

### 跑起来验证？

确认策略面板有 **22 区域 + 33 业务 = 55 组**，再按第九节查看实际请求命中的规则与节点。

### 最常见踩坑

下载失败先确认 GitHub Raw 可达；节点或支付 App 异常见第十节。Surge 原生 smart 与 Mihomo Smart / LightGBM 不是同一功能，本配置使用 `url-test`。

## 🔌 协议支持（Surge 5 自家引擎）

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

TUIC 的最初引入版本未由官方页确认；Snell v6 仍标为 beta。完整来源与待核项见[复核报告](../docs/upstream/2026-10-19/apple/report.md)。

---

### 什么时候选 Surge（不是协议原因）？

需要 Surge Mac、脚本或 MITM 时，可进一步查看官方功能说明；本配置默认不启用脚本与 MITM。

## 一、下载 Surge

iOS 从 App Store 安装 Surge 5；Mac 从 [Surge 官网](https://nssurge.com/)获取。系统门槛见上方“我要准备什么”，授权条件以官方页面为准。

---

## 二、配置托管

直接使用上方本仓库 Raw URL。需要修改配置时，可放到自己的 HTTPS 地址：

```
https://raw.githubusercontent.com/<user>/<repo>/main/Surge/Surge.conf
```

以下 CDN 样例仅适用于符合 jsDelivr 包大小限制的其他仓库；本仓库配置和融合规则请使用 GitHub Raw。

```
https://cdn.jsdelivr.net/gh/<user>/<repo>@main/Surge/Surge.conf
```

---

## 三、导入配置

1. Surge → **配置** → **➕** → **从 URL 安装**。
2. 粘贴配置 URL，下载后点击配置并启用。
3. 检查全部远程 RULE-SET 下载完成；网络无法访问 GitHub Raw 时，先使用可用代理下载。

---

## 四、机场订阅 / 节点

**A. 把机场订阅作为独立子配置**：使用 Surge 支持的订阅格式接入节点，再确认主配置可引用这些节点。具体菜单随版本变化，子配置 UI 流程仍需真机核验。

**B. 手动节点**：按 `Surge.conf` 内注释，在 `[Proxy]` 中填写 Surge 原生节点定义。

区域组通过 `include-all-proxies=true` 和 `policy-regex-filter` 筛选节点；导入后检查组内实际成员。

---

### 多机场订阅合并

如需转换或合并订阅，输出必须是 Surge 支持的格式。第三方转换服务可看到含 token 的订阅链接，使用前确认服务可信。

## 五、11 区域组 × 33 业务组说明

### 区域组（url-test 自动择优）

11 个地区各有全部节点和家宽节点组，共 22 组；按节点名称筛选。组内为空或分类不符时，先检查订阅是否接入及名称是否含地区标识。测速参数以配置文件为准。

### 业务策略组（select 手动）

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
| 📥 下载更新 | 🌍 全球（策略已从 direct 调整为 proxy） |
| 🛰️ BT/PT Tracker | REJECT |
| 🏠 国内网站 | DIRECT |
| 🚫 受限网站（GFW） | 中国选代理 / 海外选 DIRECT |
| 🌐 国外网站 | 🌍 全球 |
| 🐟 漏网之鱼 | 🌍 全球（FINAL）|
| 🛑 广告拦截 | REJECT |

## 六、DNS 配置（Surge 原生行为）

DNS 位于 `[General]`。多个加密 DNS **并发查询，采用首个有效响应**；配置加密 DNS 后，普通 DNS 仅用于连通性检测与服务器域名自举。

| Surge 字段 | 本配置 | 行为 |
|------------|-----------------|------|
| `dns-server` | `223.5.5.5, 119.29.29.29, 1.1.1.1, 8.8.8.8` | 连通性检测与域名自举 |
| `encrypted-dns-server` | AliDNS 两个 IP-host DoH + Google / Cloudflare DoH | 并发查询，首答生效 |
| `encrypted-dns-follow-outbound-mode` | `false` | 加密 DNS 直连，不进入出站分流规则 |
| `hijack-dns` | `8.8.8.8:53, 8.8.4.4:53` | 劫持指定硬编码 DNS 查询 |

当前加密 DNS 均直连；全部失败时，未实现“明文兜底”或“失败再转代理”。Surge 不支持旧 `[DNS]` 节；将 `encrypted-dns-follow-outbound-mode` 改为 `true` 会改变所有加密 DNS 的路由，并可能形成代理域名解析循环。官方依据见[加密 DNS 文档](https://manual.nssurge.com/dns/encrypted-dns.html)与[复核报告](../docs/upstream/2026-10-19/apple/report.md)。

---

## 七、Surge 独有能力（相对 Shadowrocket）

| 能力 | Surge | Shadowrocket |
|---|---|---|
| `geoip-maxmind-url` 配置文件指定 MMDB | ✅ 已启用 | ❌ 必须 UI 手动下载 |
| `encrypted-dns-server`（DoH 专用通道） | ✅ 启用 | ❌ SR 合并到 `dns-server` |
| `[URL Rewrite]` + Header Rewrite + Script | ✅ 支持 | ✅ 支持但功能更少 |
| PROCESS-NAME 规则（仅 Surge Mac） | ✅ Mac 支持 / iOS 不支持 | ❌ 全平台都不支持 |
| MITM + JS 脚本（自动化签到/去广告） | ✅ 原生 | ⚠️ 部分支持 |
| External Controller（Surge Dashboard） | ✅ 支持 | ❌ 无 |

本配置默认关闭 MITM 与脚本。上表为功能对照，其他客户端能力与未确认的最小版本以[复核报告](../docs/upstream/2026-10-19/apple/report.md)为准。

---

## 八、与 Clash Party 主线的差异（iOS/Surge 引擎限制）

| 差异 | 原因 |
|------|------|
| ❌ 无 Mihomo Smart 组 / LightGBM 自动择优 | Surge 不是 Mihomo 核；退化为 url-test |
| ❌ 无 TLS 指纹注入（`client-fingerprint`） | Surge 不暴露 uTLS 控制 |
| ⚙️ PROCESS-NAME 规则 | Surge Mac 命中本地工具直连白名单；Surge iOS 会忽略进程规则 |
| ⚙️ GEOSITE 全部替换为 RULE-SET | Surge 不支持 GEOSITE（依赖 MMDB + RULE-SET）|
| ⚙️ Meta `.mrs` 二进制 → blackmatrix7 Surge `.list` | 格式兼容性 |
| ⚙️ rule-provider 独立刷新 → Surge 订阅统一更新 | Surge 引擎设计 |

上表保留历史迁移对照；当前 RULE-SET 使用本仓库发布的融合资产，DNS 行为见第六节，不能视为 Mihomo DNS 的完全等价实现。

---

## 九、验证

1. 确认启用 `Surge Smart v6.0.20-Surge.12`，策略面板有 55 个组且区域组含节点。
2. 检查所有 RULE-SET 下载完成。
3. 访问 `chat.openai.com`、`www.netflix.com`、`www.bilibili.com`，在 **活动（Activity）** 中核对 AI、Netflix、国内流媒体规则及实际出口。
4. 继续完成根 README 的[导入后验证清单](../README.md#-导入后-60-秒验证清单)。

---

## 十、常见问题

### VPN 已启动，但所有网站超时、Recent Requests 没有记录？

先检查最终配置的 `[General]`：`tun-excluded-routes` 不得包含或覆盖 `198.18.0.0/15`。这是 Surge 自身的 Fake IP 与 DNS 地址池，排除后流量会绕过 VIF，无法还原域名并进入分流。官方说明见 [Fake IP DNS](https://manual.nssurge.com/dns/advanced.html) 与 [TUN 排除路由](https://manual.nssurge.com/profile/general.html#tun-excluded-routes)。

刷新托管配置；手工维护配置时只删除冲突网段，保留所需局域网旁路。检查模块或本地覆写是否再次加入该网段，然后停止并重新启动 Surge，重新打开网页，在 Recent Requests 确认直连和代理请求均有记录。真机结果以此复测为准。

### Q1：规则集下载失败，配置里显示 `rule-set unavailable`？

确认 URL 可访问、网络权限已允许；必要时先用可用节点连接，再刷新配置与规则集。详见[下载排错](../docs/rule-asset-delivery.md)。

### Q2：导入时报 `DST-PORT,7680,REJECT` 无效配置？

请重新获取本目录配置。Surge 的端口规则名是 [`DEST-PORT`](https://manual.nssurge.com/rule/misc-rule.html#dest-port)，不能混用其他客户端的 `DST-PORT`。

### Q3：我想要 Mihomo Smart 组 + LightGBM 自动择优，怎么办？

需使用支持该能力的 Mihomo Smart 客户端；Surge 原生 smart 不等同于 LightGBM。

### Q4：iOS 支付 / 银行 App 异常？

先在活动面板确认目标域名、命中规则与出口，再检查节点和 DNS。`skip-proxy` 不能作为“保证直连”的同义配置；不要仅凭 App 名称追加通配域名。

### Q4：我想启用 MITM / JS 脚本（签到、去广告）？

在 Surge 中生成并按系统要求信任证书，仅为所需域名开启 MITM，再添加对应脚本或重写；先检查其与现有规则是否冲突。

### Q5：节点名里有地区 emoji 但没被正确聚合？

检查节点是否已接入候选池，并保留中文地区名或 HK / JP / US 等地区标识；以组内实际成员确认匹配结果。

### Q6：跨境场景（中国 ⇄ 海外）怎么切换？

在策略面板切换对应业务组；下表按所在网络作参考。

| 组 | 在中国 | 在海外 |
|---|---|---|
| 🚫 受限网站 | 选代理节点 | DIRECT |
| 🌐 国外网站（jsDelivr） | 代理 | DIRECT |
| 📺 国内流媒体 | DIRECT | 🇭🇰 香港回国节点 |

## 十一、规则更新与维护

### Surge 自动更新

在客户端确认配置与规则集的更新设置；更新后检查下载状态，不以启动成功代替规则已更新。

### 本仓库升级时同步

远程配置需在客户端刷新；本地修改应先备份，避免更新覆盖。变更记录见 [CHANGELOG](./CHANGELOG.md)。

## 十二、致谢

[Surge](https://nssurge.com/) · [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip)

---

## 💖 支持本项目

→ [捐赠 / Star / PR](../docs/donate.md)
