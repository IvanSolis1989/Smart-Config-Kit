# Shadowrocket（小火箭）使用教程

## 📥 规则下载链接

[![下载 Shadowrocket CONF](../../docs/assets/readme/button-shadowrocket-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/Shadowrocket.conf)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**Shadowrocket CONF 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/Shadowrocket.conf
```

复制直链到 Shadowrocket 的配置下载入口，节点订阅按下文添加。

---

规则下载需能访问 GitHub Raw；见[下载排错](../../docs/rule-asset-delivery.md)。可选[测速与 QUIC 策略](../../docs/traffic-options.md)、[微信连接排错](../../docs/research/2026-10-16-wechat-issue-187.md)与[Claude Desktop 网络依赖](../../docs/claude-service-dependencies.md)另有说明。

> 配置：`Shadowrocket.conf` · **v6.0.20-SR.11**（Build 2026-10-24）
> 22 区域组（11 全部 + 11 家宽）+ 33 业务组；跟随 Clash Party v6.0.20 分流基线。

<sub>💖 [支持本项目](../../docs/donate.md) · ⭐ [Star](https://github.com/ivansolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues)</sub>

---

## 🚀 零基础 5 分钟快速开始

> 第一次在 iPhone 上用代理？先看这段。

### 这是什么？

本仓库的 `Shadowrocket.conf` 提供国内直连、海外代理和广告拦截规则；机场节点另行导入。

### 我要准备什么？

准备 Shadowrocket、机场订阅 URL 和上方配置直链。截至 2026-10-19，官方稳定版 2.2.92 要求 iOS 13+；其他设备兼容性以[官方商店](https://apps.apple.com/us/app/shadowrocket/id932747118)为准。

### 术语速查

- **机场订阅**：代理服务商提供的节点列表 URL。
- **`.conf` 配置**：本仓库提供的分流规则，不含可用节点。
- 节点与配置分开接入；首次连接需允许系统添加 VPN 配置。

### 3 步走完

1. 安装 Shadowrocket，按第三节下载并启用上方配置。
2. 按第四节添加机场订阅。
3. 检查规则、组内节点后，在首页启动连接。

### 跑起来之后怎么验证？

确认 **22 区域 + 33 业务 = 55 组**，规则已下载、区域组含节点，再按第八节检查实际请求的规则与出口。

### 最常见踩坑

GitHub Raw 不可达时，先用可用代理下载规则。国内 App、流媒体和更新问题见第十二节；不要把“已连接”视为规则与 DNS 均已验收。

## 🔌 协议支持（Shadowrocket 引擎）

以下为协议对照；本轮官方来源主要是[App Store 版本历史](https://apps.apple.com/us/app/shadowrocket/id932747118)，未取得完整的官方字段手册。

| 协议 | 支持 | 说明 |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | 含 SS 2022 |
| **ShadowsocksR (SSR)** | ✅ | 保留支持 |
| **VMess** | ✅ | ws/grpc/h2 |
| **VLESS** | ✅ | **REALITY** + **XTLS-Vision** |
| **Trojan** | ✅ | + Trojan-Go |
| **Hysteria v1 / v2** | ✅ | UDP QUIC |
| **TUIC v5** | ✅ | UDP QUIC |
| **WireGuard** | ✅ | 作为子代理节点 |
| **Snell v3 / v4** | ✅ | 少有的 iOS 客户端支持 Snell |
| **AnyTLS** | ✅ | 较新版本支持（SR 2.2.56+）|
| **ShadowTLS** | ✅ | 较新版本支持 |
| **Mieru** | ⚠️ | 部分版本支持 |
| **SOCKS5 / HTTP(S)** | ✅ | |

部分协议组合与最低引入版本仍缺官方证据，表格不作为逐字段配置依据。最新版本及待核边界见[复核报告](../../docs/upstream/2026-10-19/apple/report.md)。

---

### 和 Surge / Loon / QX 对比协议能力

| 协议 | Shadowrocket | Surge 5 | Loon | QX |
|---|:-:|:-:|:-:|:-:|
| Hysteria 2 | ✅ | ✅ iOS 5.8.0+ | ✅ | ❌ |
| TUIC v5 | ✅ | ✅ | ✅ | ❌ |
| VLESS REALITY | ✅ | ❌（External 仅 Mac） | ✅ | ✅ REALITY |
| XTLS-Vision | ✅ | ❌ | ✅ | ⚠️ 受限 |
| WireGuard | ✅ | ✅ | ✅ | ❌ |
| Snell v4 | ✅ | ✅ | ✅ | ❌ |
| 价格（2026-04） | **¥20** | ¥648 | ¥198 | ¥68 |

价格为历史比较，实际报价以商店为准；Surge 已原生支持 TUIC v5 / AnyTLS，QX 的 REALITY 不能推导为 XTLS-Vision。

## 一、下载 Shadowrocket

从 [App Store](https://apps.apple.com/app/shadowrocket/id932747118)安装，首次连接允许添加 VPN 配置。商店地区与设备要求以官方页面为准。

---

## 二、配置托管

直接使用上方本仓库 Raw URL；需要修改配置时，可托管到自己的 HTTPS 地址。

---

### 推荐托管方式

GitHub Raw 示例：`https://raw.githubusercontent.com/<user>/<repo>/main/Shadowrocket.conf`。

本仓库配置与融合规则请使用 GitHub Raw；jsDelivr 的仓库包限制不能靠更换子域名绕过。

## 三、导入配置

1. Shadowrocket → **配置（Config）** → **➕**。
2. 粘贴配置 URL 并下载，点击下载后的条目，选择 **使用配置（Use Config）**。
3. 检查全部远程 RULE-SET 下载完成；GitHub Raw 不可达时，先使用可用代理下载。

---

## 四、修改机场订阅

在 **首页 → 子网（Subscribe）** 中添加机场订阅 URL 并更新。菜单名称可能随版本变化；导入后检查节点列表与区域组实际成员。

`policy-regex-filter` 按节点名称筛选地区，主配置不包含可用节点。

---

### 多机场订阅合并

可分别添加订阅；如需转换或合并，输出须为 Shadowrocket 支持的格式。第三方服务可读取含 token 的订阅链接，使用前确认服务可信。

## 五、11 区域组 × 33 业务组说明

地区分类依赖节点名称；首次导入后检查各组实际成员和业务组上游。

---

### 区域组（url-test 自动择优）

11 个地区各有全部节点与家宽节点组，共 22 组。节点名称需包含对应地区标识；空组或误分类先检查订阅与节点名。

### 业务组（select 手动选择）

33 个业务组供手动选择节点或区域；按所在网络及服务需求设置，不能以延迟最低代替流媒体解锁或服务可用性验证。

## 六、DNS 配置说明（v5.2.2-SR.1 重构）

当前保留现有 DNS 配置；下表为历史映射说明，**不代表已由本轮官方字段正文证实**。

| 字段 | 对应 Clash 字段 | 内容 |
|------|----------------|------|
| `dns-server` | `nameserver` + `direct-nameserver` | 国内 DoH（AliDNS + DNSPod） |
| `proxy-dns-server` | `proxy-server-nameserver` | 境外 DoH 优先，国内 DoH 兜底 |
| `fallback-dns-server` | `fallback` | 国外 DoH（Cloudflare / Google） |

官方开发者页面未提供完整语法，旧 help 站正文及官方归属仍待确认；不据此新增参数或保证 fallback 顺序。

---

### 无法迁移的功能（已在配置内标注）

没有官方证据证明与 Mihomo 的 `respect-rules`、独立 bootstrap 或 `fallback-filter` 完全等价。DNS 故障行为仍需真机验证，详见[复核报告](../../docs/upstream/2026-10-19/apple/report.md)。

## 七、与 Clash Party 原版的差异

| 差异 | 原因 |
|------|------|
| ❌ 删除 `PROCESS-NAME` 规则 | iOS 无进程识别 API |
| ❌ 删除 TUN `exclude-process` | SR 无该机制 |
| ❌ 删除 Smart fingerprint 注入 | SR 不暴露 TLS 指纹控制 |
| ⚙️ `GEOSITE` 全部替换为 `RULE-SET` | SR 不原生支持 GEOSITE |
| ⚙️ Meta `.mrs` 二进制格式 → blackmatrix7 Shadowrocket `.list` | 格式兼容性 |
| ⚙️ 部分 YAML classical 保留 | SR 按内容识别可解析 |
| ⚙️ `rule-provider` 周期刷新 → SR 自动更新配置 | 统一由 SR 管理 |

上表保留历史迁移对照；当前远程规则使用本仓库发布的融合资产，不再按表中旧上游路径下载。

---

## 八、启动与验证

首页启动连接；首次连接按系统提示允许 VPN 配置。确认节点可用、远程规则已下载，并检查实际出口。

---

### 验证分流是否正确

访问 `chat.openai.com`、`www.netflix.com`、`www.bilibili.com`，在连接信息中核对 AI、Netflix、国内流媒体的命中规则与上游节点；继续完成根 README 的[导入后验证清单](../../README.md#-导入后-60-秒验证清单)。

## 九、iOS 系统设置建议

### 1. 开启后台刷新（**必做**）

需要后台更新时，检查 iOS 是否允许 Shadowrocket 后台 App 刷新；规则是否更新仍以客户端下载状态为准。

### 2. 允许常驻 VPN

需要自动连接时，在客户端与系统设置中检查按需连接选项，并验证切换 Wi-Fi / 蜂窝后的实际行为。

### 3. 跳过某些 App / 域名

国内 App 异常先看请求日志、命中规则和出口；`skip-proxy` 的实际行为不能仅凭字段名称推断，避免盲目添加通配域名。

### 4. TUN 旁路路由（已预置）

已有路由排除项见 `[General]`；以下仅为节选，勿把省略号复制进配置：

```
tun-excluded-routes = 10.0.0.0/8, 100.64.0.0/10, 127.0.0.0/8, 169.254.0.0/16, ...
```

## 十、跨境场景（中国 ⇄ 境外）

按所在网络在策略面板切换对应业务组：

| 组 | 在中国 | 在印尼/其他境外 |
|------|--------|----------------|
| 🚫 受限网站（GFW） | 选代理节点翻墙 | 选 DIRECT 直连 |
| 🌐 国外网站（含 jsDelivr/Cloudflare） | 选代理 | 选 DIRECT |
| 📺 国内流媒体 | DIRECT | 选 🇭🇰 香港回国节点 |

---

## 十一、规则更新与维护

### 手动刷新所有 rule-set

在配置页更新当前配置，并检查远程规则下载状态。

### 自动更新

在客户端确认配置与规则的更新选项；后台权限和网络条件会影响更新，完成后核对实际结果。

### 检查规则失效

检查规则状态与错误日志；区分 URL 不存在、网络不可达和解析错误，详见[下载排错](../../docs/rule-asset-delivery.md)。

## 十二、常见问题

### Q1：配置下载失败 / 部分 rule-set 空白？

先确认 GitHub Raw 可达；必要时用可用代理下载，再刷新失败项。

### Q2：iOS 支付/银行 App 异常？

先核对目标域名命中的规则、出口与 DNS；参见第九节，勿直接以 `skip-proxy` 代替直连规则。

### Q3：TikTok 海外版无法播放？

在“📱 社交媒体”中切换适用节点，再检查规则命中和实际服务可用性。

### Q4：Netflix 显示「You seem to be using a proxy」？

在“🎥 Netflix”组更换节点；测速延迟不能证明流媒体解锁。

### Q5：修改配置后如何同步到 SR？

更新托管文件，再在配置页刷新；保留本地定制备份，防止远程更新覆盖。

## 十三、致谢

[Shadowrocket](https://apps.apple.com/app/shadowrocket/id932747118) · [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [szkane](https://github.com/szkane)

---

## 💖 支持本项目

→ [捐赠 / Star / PR](../../docs/donate.md)
