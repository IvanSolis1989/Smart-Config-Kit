# SingBox 使用教程（对齐 Clash Party v5.2.5 Full 语义）

> 配置文件（推荐）：`SingBox/singbox-smart-full.json`（v5.2.5-sing.2）
> 基础模板：`SingBox/singbox-smart.json`（重建于 v5.2.5-sing.2，兼容 sing-box 1.12+）
> 生成脚本：`SingBox/generate-singbox-full.js`
> 目标：在 **sing-box** 上复刻 Clash Party 的「9 个区域组 + 28 个业务组 + 391 rule-providers + 975 规则」语义，并保持 sing-box 1.12/1.13/1.14 官方配置兼容。

> **v5.2.5-sing.2（2026-04-22）兼容性重要变更**：
> - 删除已废弃的 `type: "block"` 特殊 outbound（sing-box 1.11 deprecated, 1.13 removed），避免用户升到 1.13+ 后 FATAL 起不来
> - DNS server 迁移到新 schema（`{type:"https",server:"..."}` 取代 legacy `{address:"https://..."}`），避免 1.14 起被移除
> - 重建基础模板 `singbox-smart.json`（之前被误删），生成脚本重新可用

---

## 🚀 零基础快速开始

### 这是什么？
一份 **sing-box 原生 JSON 配置**。sing-box 是一个新一代跨平台代理内核，**比 Clash 内存占用更低、协议支持更新**。任何加载 sing-box 内核的客户端都能用这份配置——包括 **Hiddify**、**SFA**（sing-box for Android）、**SFM**（Mac）、**SFI**（iOS）、**Karing**、**NekoBox**、以及 **v2rayN 切到 sing-box 核**。

### 选哪份文件？
| 文件 | 规则数 | 适合 |
|---|---:|---|
| `singbox-smart.json` | 4 rule-sets + 28 条内联规则 | 快速体验 / 学习结构 |
| `singbox-smart-full.json` | 387 rule-sets + 977 规则 | **推荐**，对齐 Clash Party 全量 |

### 术语速查
- **sing-box**：一个代理内核（类比 mihomo/Xray）。**不是**一个具体的客户端 App，它是核心引擎，由各种 GUI 客户端调用。
- **rule_set**：sing-box 的"规则集"概念，等同于 Clash 的 `rule-provider`。
- **selector / urltest**：sing-box 里的策略组类型。`selector` = 手动选，`urltest` = 按延迟自动选最优。

### 3 步走完（以 Hiddify 为例，最简单）
1. **下载 Hiddify**：https://hiddify.com（Windows / Mac / Linux / Android / iOS 都有）。
2. **替换节点**：用文本编辑器打开 `singbox-smart-full.json`，`outbounds` 数组里找 `"type": "trojan"` / `"vless"` / `"vmess"` / `"hysteria2"` 的占位节点（`proxy-hk-1`、`proxy-us-1`…），换成你机场给的真实节点参数。保存。
3. **导入**：Hiddify → 添加配置 → 从文件导入 → 选这个 JSON → 启用。

### 其它客户端也一样？
基本一样。所有吃 sing-box JSON 的客户端都是"导入 JSON → 启用"。不同的仅仅是每个客户端按钮位置不同：
- **SFA**（Android）、**SFM**（Mac）、**SFI**（iOS）：官方客户端，UI 最干净
- **Karing**：跨平台，UI 更漂亮
- **NekoBox / NekoRay**：Android/PC，多核切换方便
- **v2rayN**：Windows，需要先在「设置 → 核心基础设置」切到 **sing-box**，然后「自定义配置服务器」导入本 JSON

### 跑起来怎么验证？
- 浏览器打开 `https://www.google.com` 能打开 = 代理通了
- 客户端的"出站"/"策略"面板应看到 38 个组（1 `🚀 节点选择` + 9 区域 + 28 业务）
- 首次启动后等 387 个 rule-set 下载完（约 1–3 分钟），日志不报 404 即可

### 最常见踩坑
- ❌ **客户端说 "config invalid"**：你改节点时漏了逗号/引号。用 `python3 -c 'import json; json.load(open("singbox-smart-full.json"))'` 校验 JSON 合法性。
- ❌ **rule_set 下载失败**：jsdelivr 被墙。先用任意一个能通的节点连上，再重新启用本配置，让 sing-box 把 387 个 .srs 拉下来缓存。
- ❌ **Hiddify 提示 TUN 冲突**：Hiddify 会自己管 TUN。把本 JSON 里的 `inbounds.tun` 段删掉就好。
- ❌ **配置里的节点占位跑不通**：那是示例节点（`proxy-hk-1` 等），需要你替换成真实节点。**不替换直接导入是跑不通的**。

---

## 🔌 协议支持（sing-box 核）

sing-box 由 SagerNet 团队开发，是目前**新协议实现最前沿**的代理内核（Hysteria 2 / TUIC v5 / AnyTLS 都最早或同步实现在 sing-box）。

| 协议 | 支持 | 说明 |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | 全套 AEAD + **SS 2022-blake3**（sing-box 是 2022 协议的参考实现）|
| **ShadowsocksR (SSR)** | ❌ | 已废弃，sing-box 不实现 |
| **VMess** | ✅ | ws/grpc/h2 |
| **VLESS** | ✅ | **REALITY** + **XTLS-Vision** |
| **Trojan** | ✅ | |
| **Hysteria v1** | ✅ | |
| **Hysteria 2** | ✅ | 协议最权威实现 |
| **TUIC v5** | ✅ | 协议最权威实现 |
| **WireGuard** | ✅ | 作为出站 |
| **AnyTLS** | ✅ | 较新 |
| **ShadowTLS v1/v2/v3** | ✅ | 协议原作者也在 sing-box |
| **Naive** | ⚠️ | 旧协议，保留兼容 |
| **Tor** | ✅ | 作为特殊出站 |
| **SSH** | ✅ | 作为出站隧道 |
| **SOCKS5 / HTTP(S)** | ✅ | |

**如果你的机场给的是 Hysteria 2 / TUIC / AnyTLS / ShadowTLS 等新协议，优先选 sing-box**——它往往比 Mihomo 更早实现最新的协议变种。

### 和 Mihomo 核对比一张图
| 维度 | Mihomo | sing-box |
|---|---|---|
| SSR 兼容 | ✅ | ❌ |
| Snell | ✅ | ❌ |
| Mieru | ✅ | ❌ |
| LightGBM 自动择优 | ✅（Smart 分支） | ❌ |
| 新协议首发速度 | 慢一步 | **快，参考实现** |
| 内存占用 | 较高 | **较低** |
| JS 覆写（脚本化配置） | ✅（Clash Verge/Mihomo Party）| ❌ |
| 规则集热更新 | ✅（rule-providers）| ✅（rule_set remote）|
| Clash API 兼容 | ✅ 原生 | ✅ 兼容 |

**一句话选核**：有 SSR / 想要 LightGBM → Mihomo；只跑新协议、看重内存/性能 → sing-box。

---

## 1. 设计说明（和 Clash Party 的一致性）

该 sing-box 版本与 Clash Party 主线保持以下一致：

- **区域层一致**：
  - `🌍 全球节点`
  - `🇭🇰 香港节点`
  - `🇹🇼 台湾节点`
  - `🇯🇵 日韩节点`
  - `🌏 亚太节点`
  - `🇺🇸 美国节点`
  - `🇪🇺 欧洲节点`
  - `🌎 美洲节点`
  - `🌍 非洲节点`

- **业务层一致（28 组）**：
  - `🤖 AI 服务`、`💰 加密货币`、`🏦 金融支付`、`📧 邮件服务`、`💬 即时通讯`、`📱 社交媒体`
  - `🧑‍💼 会议协作`、`📺 国内流媒体`、`📺 东南亚流媒体`、`🇺🇸 美国流媒体`、`🇭🇰 香港流媒体`
  - `🇹🇼 台湾流媒体`、`🇯🇵 日韩流媒体`、`🇪🇺 欧洲流媒体`、`🕹️ 国内游戏`、`🎮 国外游戏`
  - `🔍 搜索引擎`、`📟 开发者服务`、`Ⓜ️ 微软服务`、`🍎 苹果服务`、`📥 下载更新`
  - `☁️ 云与CDN`、`🛰️ BT/PT Tracker`、`🏠 国内网站`、`🚫 受限网站`、`🌐 国外网站`
  - `🐟 漏网之鱼`、`🛑 广告拦截`

- **规则层策略一致**：
  - AI、支付、加密货币、流媒体、即时通讯、开发者服务等关键域名前置匹配。
  - 国内/国外流量使用 `geosite-cn` + `geoip-cn` 与 `geosite-geolocation-!cn` 收口。
  - 广告使用 `category-ads-all` 统一拦截。
  - 通过生成脚本从 `Clash Party/Clash Smart内核覆写脚本.js` 自动提取 rule-providers 与 rules，确保顺序和策略定义持续跟随 Clash Party 主线。

---

## 2. 准备工作

1. 安装 sing-box 或图形客户端（如 sing-box for Android / macOS 图形端等）。
2. 将 `SingBox/singbox-smart-full.json` 导入客户端。
3. 将文件内 `proxy-xxx` 示例节点替换成你自己的真实节点（trojan/vless/vmess/hysteria2 都可以）。

> 说明：`singbox-smart-full.json` 已内置 387 个 rule_set 入口与 977 条路由规则；你只需要替换节点出站即可。

---

## 2a. Hiddify 用户看这里

**Hiddify 的内核就是 sing-box**（实际打包的是 `hiddify-sing-box` 二进制，在官方 sing-box 基础上加了 WARP+、Hiddify Profile Format 等自家扩展）。所以本目录的配置 **不需要单独开一份 Hiddify 版本**——直接把 `SingBox/singbox-smart-full.json` 或 `SingBox/singbox-smart.json` 喂给 Hiddify 即可。

### 在 Hiddify 里导入

1. 打开 Hiddify → 右上角 **配置 / Profile** → **添加新的配置** → **从剪贴板 / 从文件导入**。
2. 选择本仓库的 `SingBox/singbox-smart-full.json`（推荐）或 `SingBox/singbox-smart.json`（精简）。
3. Hiddify 会读取文件里的 `outbounds`、`route`、`dns`、`rule_set`，9 区域 + 28 业务组会全部出现在 Hiddify 的「策略」面板。

### 两个小提示

- **TUN 让 Hiddify 自己管**：Hiddify 会在系统层接管 TUN（用自己的 `tun` inbound 配置覆盖），所以本 JSON 里的 `inbounds.tun` 可以保留，也可以删掉——Hiddify 都能正常启动。
- **节点替换**：和其它 sing-box 客户端一样，把 `outbounds` 里 `"type": "trojan"` / `"vless"` / `"vmess"` / `"hysteria2"` 的占位节点（`proxy-hk-1`、`proxy-us-1`…）改成你机场给的真实节点即可。如果你在 Hiddify 里单独添加了订阅，也可以删掉 JSON 里的占位节点，让 Hiddify 用订阅节点直接填充区域组。

### Hiddify 的自家扩展字段

- Hiddify Profile Format（`.hiddify-json`）是 sing-box JSON 的超集，额外支持 `meta`、`profile` 等字段用于 UI 展示。本仓库保持**纯 sing-box 标准格式**，对 Hiddify 照样生效，只是少了一些 UI 层的美化（如订阅备注、更新周期）。
- 若你想完整享受 Hiddify 自己的 WARP+ / Fragment / Mux 能力，可以在 Hiddify 客户端里单独开启——这些是运行时设置，和我们的路由/规则不冲突。

---

## 2.1 重新生成 Full 规则（跟随 Clash Party 升级）

当 `Clash Party/Clash Smart内核覆写脚本.js` 更新后，执行：

```bash
node SingBox/generate-singbox-full.js
```

脚本会自动：

- 调用 Clash Party 的 `main(config)` 构建完整规则；
- 同步导出 sing-box `route.rule_set`（387 项）；
- 同步导出 sing-box `route.rules`（977 条）。
2. 将 `SingBox/singbox-smart.json` 导入客户端。
3. 将文件内 `proxy-xxx` 示例节点替换成你自己的真实节点（trojan/vless/vmess/hysteria2 都可以）。

> 说明：我在模板中提供了可运行结构和占位节点，便于你快速迁移 Clash Party 的组策略；实际连接能力由你替换后的节点决定。

---

## 2b. HomeProxy（OpenWrt 软路由）用户看这里

**HomeProxy（`immortalwrt/homeproxy`）是 sing-box 团队官方推荐的 OpenWrt LuCI 插件**，内核就是 sing-box。本仓库的 JSON 原生可用，**不需要任何转换**。

### 在 HomeProxy 里导入

1. LuCI → 服务 → HomeProxy → **订阅** 面板（或 Subscriptions 标签）。
2. 选择 **本地文件导入** 或 **URL 订阅**，指向 `SingBox/singbox-smart-full.json`。
3. HomeProxy 会自动读取 JSON 里的 `outbounds`、`route`、`dns`、`rule_set`，然后把 9 区域 + 28 业务组全部展示在"出站组"面板里。

### 小提示

- **TUN 由 HomeProxy 接管**：和 Hiddify 一样，HomeProxy 会用自己的 `tun` inbound 配置覆盖 JSON 里的 `inbounds.tun` 段，保留或删除都能跑。
- **节点替换**：HomeProxy 支持直接订阅机场 URL，让机场节点自动填充本 JSON 里的占位出站（`proxy-hk-1` / `proxy-us-1` 等）——省去手工改 JSON。
- **与 Passwall / Passwall2 / SSR+ 的对比**：这三个插件**不能**消费本仓库的 JSON（它们没有 sing-box 核）。HomeProxy 是软路由用户想跑"官方 sing-box + 完整 28+9 架构"的最佳选择；另一个选择是本仓库 `OpenClash/`（mihomo 核 + 功能更全，但内存占用更高）。

---

## 3. 关键兼容性（按 sing-box 官方文档）

为了兼容新版本 sing-box，配置做了以下处理：

- 路由规则使用 `action` + `outbound` 形式（sing-box 1.11+ 变更后推荐）。
- 使用 `rule_set`（remote/binary）而非老 GeoIP/Geosite 旧写法。
- 启用 `experimental.cache_file.enabled`，让远程规则和 selector 选择结果可缓存。
- `selector` / `urltest` 均使用官方结构字段（`outbounds`、`default`、`interval`、`tolerance`）。

---

## 3.1 DNS / 嗅探 / GEO 增强版配置（已并入 Full 配置）

为贴近 Clash Party 使用教程中的「DNS + Sniffer + GeoX URL」补充项，`singbox-smart-full.json` 已对应实现：

- **DNS 增强**：
  - `dns_direct`（223.5.5.5 DoH）用于国内规则集；
  - `dns_proxy`（1.1.1.1 DoH）用于代理解析；
  - `dns_block`（rcode://success）用于广告域名返回空响应。
- **嗅探增强**：
  - `inbounds.tun.sniff=true`
  - `sniff_override_destination=true`
  - 与 Clash Party 的 Sniffer 覆写语义对齐（提升 SNI/域名识别命中）。
- **GEO 增强数据库**：
  - `MetaCubeX/meta-rules-dat@sing` 的 geosite/geoip `.srs` 远程规则集；
  - 按日更新（`update_interval: 1d`）。

---

## 4. 替换节点的推荐方式

在 `outbounds` 中，优先按区域替换：

- `proxy-hk-*` → 香港节点
- `proxy-tw-*` → 台湾节点
- `proxy-jp-*` / `proxy-kr-*` → 日韩节点
- `proxy-sg-*` / `proxy-id-*` → 亚太节点
- `proxy-us-*` → 美国节点
- `proxy-eu-*` → 欧洲节点
- `proxy-ca-*` → 美洲节点
- `proxy-af-*` → 非洲节点

这样业务组就不需要改动，能保留 Clash Party 的“业务语义 -> 区域出口”逻辑。

---

## 5. 首次启动检查清单

启动后请按顺序确认：

1. **出站组是否完整**：能看到 9 区域 + 28 业务组。  
2. **DNS 是否生效**：国内域名走 `dns_direct`，国外域名走 `dns_proxy`。  
3. **规则集下载是否成功**：应看到 `387+` 个 `rule_set` 被加载（与 Clash Party Provider 数量对齐）。  
3. **规则集下载是否成功**：`geosite-cn / geoip-cn / geolocation-!cn / category-ads-all`。  
4. **典型业务是否命中**：
   - ChatGPT 命中 `🤖 AI 服务`
   - Binance 命中 `💰 加密货币`
   - YouTube/Netflix 命中对应流媒体组
   - 国内站点命中 `🏠 国内网站`

---

## 6. 常见问题

### Q1：为什么不能像 Clash Party 一样“自动按节点名分类”？

Clash Party 当前使用 JS 覆写引擎做节点名称分类；sing-box 原生 JSON 配置没有同等 JS 运行时。这个版本采用“**固定区域组 + 手工节点归位**”实现同语义替代，行为更稳定、可审计。

### Q2：规则集下载失败怎么办？

- 先测试 `fastly.jsdelivr.net` 连通性；
- 若你所在网络对 CDN 有限制，可替换为你可访问的镜像地址；
- 保持 `.srs` 二进制格式和 `format: binary` 一致。

### Q3：如何保证和 Clash Party 规则保持完全一致？

使用 `generate-singbox-full.js` 从 Clash Party 脚本自动提取是最稳妥方式。只要上游 `Clash Smart内核覆写脚本.js` 更新，你重新执行脚本即可同步。
### Q3：想继续贴近 Clash Party 规则量（300+ provider）怎么办？

可以继续扩展 `route.rule_set` 与 `route.rules`，将更多服务拆分成独立 rule-set。当前版本先保证“结构一致 + 主功能一致 + sing-box 官方格式兼容”。

---

## 7. 参考文档（官方）

- sing-box Outbound（selector/urltest）  
  https://sing-box.sagernet.org/configuration/outbound/
- sing-box Selector  
  https://sing-box.sagernet.org/configuration/outbound/selector/
- sing-box URLTest  
  https://sing-box.sagernet.org/configuration/outbound/urltest/
- sing-box Route / Route Rule / Rule Action  
  https://sing-box.sagernet.org/configuration/route/
  https://sing-box.sagernet.org/configuration/route/rule/
  https://sing-box.sagernet.org/configuration/route/rule_action/
- sing-box Rule-set  
  https://sing-box.sagernet.org/configuration/rule-set/
- sing-box Cache File  
  https://sing-box.sagernet.org/configuration/experimental/cache-file/

