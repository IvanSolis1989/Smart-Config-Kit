# Shadowrocket（小火箭）使用教程

> 配置文件：`Shadowrocket.conf`
> 版本：**v5.2.5-SR.3**（Build 2026-04-22，删除 72 条 Clash yaml 规则集 + anti-AD/Sukka 兼容修复，详见 `Shadowrocket/CHANGELOG.md`）
> 目标：**Shadowrocket iOS（App Store 正版）** / macOS 通用
> 架构：9 区域组（`url-test` + `policy-regex-filter` 按节点名自动分类）+ 31 业务策略组 + ~290 rule-set

---

## 🚀 零基础 5 分钟快速开始

> 第一次在 iPhone 上用代理？先看这段。

### 这是什么？
一份 **Shadowrocket（SR，俗称"小火箭"）配置文件**。把它塞给 SR，SR 就会按这份规则帮你：
- 访问 Google / YouTube / Netflix 走代理
- 访问淘宝 / 支付宝 / 国内银行 App 直连（更快、不被误伤）
- 屏蔽广告 / 钓鱼网站

你**不需要**懂任何技术，只需要把配置文件托管到一个 URL，让 SR 自己去拉。

### 我要准备什么？
1. **一部 iPhone / iPad**（iOS 15+）或一台 **Apple Silicon / Intel Mac**（Mac 也能装 iOS 版 SR）
2. **一个「非中国区」的 Apple ID**（香港、美国、日本都行），因为 SR 在中国区下架了
3. **¥2.99 美元约 ¥20 人民币**（SR 是一次性付费 App）
4. **一个机场订阅 URL**（代理服务商给你的）
5. **一个能托管文件的 URL**（GitHub 个人仓库最方便，免费）

### 术语速查
- **机场订阅**：代理服务商给你的 URL。里面是节点列表。
- **SR 配置（.conf 文件）**：本仓库提供的这个文件。里面是**规则**（哪些流量走代理、哪些直连），**不包含节点**。节点是你从机场订阅导入的。
- **节点 + 规则 = 可用的代理**。SR 里两者分开管理：节点从"首页-子网"导入，规则从"配置"导入。
- **TUN 模式**：SR 接管全系统流量。iOS 用 `VPN` 权限实现，首次启动会弹出「是否允许添加 VPN 配置」→ **允许**。

### 3 步走完
1. **买并安装 SR**：App Store → 搜 "Shadowrocket" → 购买 ¥20 → 安装 → 首次启动允许 VPN 权限。
2. **把本仓库的 `Shadowrocket.conf` 托管到 URL**：
   - **最简单的方法**：把这个文件上传到你自己的 GitHub 仓库（Public 就行），点文件 → 「Raw」按钮 → 复制那个 URL。格式大概是 `https://raw.githubusercontent.com/你用户名/仓库名/main/Shadowrocket.conf`
   - 或者用 jsDelivr 加速：`https://cdn.jsdelivr.net/gh/你用户名/仓库名@main/Shadowrocket.conf`
3. **导入 SR**：
   - 导入配置：打开 SR → 底部「**配置**」标签 → 右上角 ➕ → 粘贴上一步的 URL → 下载 → 点下载完的那条 → **使用配置**。
   - 导入节点：回到底部「**首页**」→ 上方「**子网**」 → ➕ → 粘贴你机场给的订阅 URL → 下载。
   - 回到「首页」最上面，点那个大按钮从 **Not Connected** 变 **Connected**。

### 跑起来之后怎么验证？
- Safari 打开 `https://www.google.com` 能打开 = 代理通了。
- SR「首页」最上方显示绿色的"Connected"。
- SR「首页 → 代理组」应能看到 **9 区域 + 31 业务 = 34 个组**。
- SR「首页 → 连接信息（Connections）」能看到每次请求走了哪个组/节点。

### 最常见踩坑
- ❌ **App Store 搜不到 SR**：你的 Apple ID 是中国区。换非中国区 Apple ID（注册需要一个非中国的地址 + 外国信用卡/礼品卡）。
- ❌ **导入配置时规则下载失败一半**：首次导入时 SR 要从 GitHub 拉 250+ 个规则包。**必须先开代理再下载配置**。可以先用一个简单的代理配置连上，再切到本配置。
- ❌ **国内支付/银行 App 变卡 / 登不上**：配置里已把主流支付（支付宝/微信支付）+ 5 大国行（工行/建行/农行/交行/邮储）加到 skip-proxy。你遇到的那个 App 没被排除就加进去：SR 首页往下拉到「Skip Proxy」→ 追加 `*.你遇到的域名.com`。
- ❌ **TikTok 海外版看不了**：在「📱 社交媒体」组里切到 🇯🇵 日韩节点或 🌏 亚太节点，对 TikTok 友好。
- ❌ **后台刷新后规则没更新**：iOS 设置 → 通用 → 后台 App 刷新 → 确认 Shadowrocket 是开的。

---

## 🔌 协议支持（Shadowrocket 引擎）

Shadowrocket 有自家实现的协议栈（不是 Mihomo，也不是 sing-box），但覆盖面**异常齐全**，是 iOS 付费客户端里协议支持最广的：

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

**iOS 上 ¥20 性价比之王**。如果你只是普通用户不需要脚本生态，SR 的协议支持已经超过 Surge / QX（两者都不支持 VLESS REALITY 或 Hysteria 2）。

### 和 Surge / Loon / QX 对比协议能力
| 协议 | Shadowrocket | Surge 5 | Loon | QX |
|---|:-:|:-:|:-:|:-:|
| Hysteria 2 | ✅ | ⚠️ 5.9+ | ✅ | ❌ |
| TUIC v5 | ✅ | ❌ | ✅ | ❌ |
| VLESS REALITY | ✅ | ❌ 需 External | ✅ | ⚠️ 受限 |
| XTLS-Vision | ✅ | ❌ | ✅ | ⚠️ 受限 |
| WireGuard | ✅ | ✅ | ✅ | ❌ |
| Snell v4 | ✅ | ✅ | ✅ | ❌ |
| 价格（2026-04） | **¥20** | ¥648 | ¥198 | ¥68 |

**结论**：纯看协议宽度 + 价格，SR 是 iOS 最佳选择。Loon 协议一样全但贵 10 倍（用 Loon 是为插件生态）。Surge 协议偏保守（稳定性换覆盖面）。QX 协议最窄（换 resource_parser 脚本生态）。

---

## 一、下载 Shadowrocket

- **iOS**：App Store 搜索「Shadowrocket」（需非中国大陆 Apple ID，美区 $2.99）。
- **macOS**：同一 Apple ID 登录 App Store 后可在 Mac 直接安装 iOS 版本。
- 安装后首次启动需授权 VPN 配置权限（系统会弹出添加 VPN 配置的提示）。

---

## 二、配置托管

Shadowrocket 不像桌面端那样支持本地脚本覆写；必须把配置文件放到可访问的 URL 上：

### 推荐托管方式

**A. GitHub Raw**
1. 将 `Shadowrocket.conf` 上传到你的 GitHub 仓库（public 或 private 均可，private 需生成 token URL）。
2. 获取 Raw URL：`https://raw.githubusercontent.com/<user>/<repo>/main/Shadowrocket.conf`

**B. jsDelivr CDN（国内访问更稳定）**
`https://cdn.jsdelivr.net/gh/<user>/<repo>@main/Shadowrocket.conf`

**C. 自建 HTTP 服务器**
任意可通过 HTTPS 访问的 URL 均可。

---

## 三、导入配置

1. 打开 Shadowrocket → 底部导航 **配置（Config）**。
2. 右上角 ➕。
3. 粘贴配置 URL，点击**下载**。
4. 下载完成后，点击该配置行 → 选择「**使用配置（Use Config）**」。

此时 Shadowrocket 会开始下载约 **250+ 个 rule-set**（blackmatrix7 Shadowrocket 专用 `.list` 格式），首次需要 **3–5 分钟**，期间请保持代理开启（否则 GitHub 访问不稳定会导致部分 rule-set 下载失败）。

---

## 四、修改机场订阅

Shadowrocket 的节点来源与 Clash 不同，需要在 **首页 → 子网**（Subscribe）单独添加：

1. 首页 → **子网（Subscribe）** → ➕。
2. 粘贴机场订阅链接 → 下载。
3. 下载后的节点会自动出现在**首页节点列表**和**代理组候选池**中。

本配置内的 `policy-regex-filter` 会**自动按地区聚合节点**到 9 个 Smart 区域组，无需手动拖拽。

### 多机场订阅合并

如果你同时买了多家机场，可以用**在线订阅转换站**把多个链接合并成一个 URL，无需安装任何工具，所有客户端通用。

1. 打开 https://acl4ssr-sub.github.io （或 https://sub.v1.mk）
2. 把多家机场订阅链接粘贴进去（一行一个或用 `|` 分隔）
3. 后端选 **Mihomo（Clash.Meta）**
4. 生成新 URL → 粘贴到 SR 首页 → 子网 → ➕

> ⚠️ **隐私提醒**：转换站能看到你提交的订阅链接（含 token）。不要提交含专线 IP 等敏感信息的订阅链接。

---

## 五、9 区域组 × 31 业务组说明

Shadowrocket 不支持 JavaScript，改用 `policy-regex-filter` 在导入/编译时一次性匹配节点名：

### 区域组（url-test 自动择优）
- 🌍 全球节点 / 🇭🇰 香港节点 / 🇹🇼 台湾节点 / 🇯🇵 日韩节点
- 🌏 亚太节点 / 🇺🇸 美国节点 / 🇪🇺 欧洲节点 / 🌎 美洲节点 / 🌍 非洲节点

### 业务组（select 手动选择）
- 🤖 AI 服务、💰 加密货币、🏦 金融支付、💬 即时通讯、📱 社交媒体
- 🧑‍💼 会议协作、📺 国内流媒体
- 🎥 Netflix、🎬 Disney+、📡 HBO/Max、📺 Hulu、🎬 Prime Video
- 📹 YouTube、🎵 音乐流媒体
- 🇭🇰 香港流媒体、🇹🇼 台湾流媒体、🇯🇵 日韩流媒体、🇪🇺 欧洲流媒体
- 🌐 其他国外流媒体、🕹️ 国内游戏、🎮 国外游戏
- 🔧 工具与服务、Ⓜ️ 微软服务、🍎 Apple、📥 下载更新
- 🛰️ BT/PT Tracker、🏠 国内网站、🚫 受限网站、🌐 国外网站
- 🐟 漏网之鱼、🛑 广告拦截

首次导入后，建议在「**首页 → 代理组**」为 **31 个业务组**逐一选择一个默认上游节点或区域组。

---

## 六、DNS 配置说明（v5.2.2-SR.1 重构）

本版本 DNS 段已重构以**尽量贴合 Clash 原版行为**，但受 SR 引擎限制有部分功能无法迁移：

| 字段 | 对应 Clash 字段 | 内容 |
|------|----------------|------|
| `dns-server` | `nameserver` + `direct-nameserver` | 国内 DoH（AliDNS / DNSPod） |
| `proxy-dns-server` | `proxy-server-nameserver` | 代理服务器域名解析（国外 DoH） |
| `fallback-dns-server` | `fallback` | 国外 DoH（Cloudflare / Google） |

### 无法迁移的功能（已在配置内标注）
- Clash 的 `default-nameserver` **bootstrap**（SR 使用 iOS 系统 DNS 作为 bootstrap）
- `respect-rules: true`（SR 无等价字段）
- `fallback-filter.geoip-code: CN`（SR fallback 始终无条件启用）
- GeoX `.dat` 格式（SR 只支持内置 `GEOIP`，不支持 `GEOSITE`）

---

## 七、与 Clash Party 原版的差异

由于 iOS 平台与 SR 引擎限制，本配置相对桌面原版有以下调整：

| 差异 | 原因 |
|------|------|
| ❌ 删除 `PROCESS-NAME` 规则 | iOS 无进程识别 API |
| ❌ 删除 TUN `exclude-process` | SR 无该机制 |
| ❌ 删除 Smart fingerprint 注入 | SR 不暴露 TLS 指纹控制 |
| ⚙️ `GEOSITE` 全部替换为 `RULE-SET` | SR 不原生支持 GEOSITE |
| ⚙️ Meta `.mrs` 二进制格式 → blackmatrix7 Shadowrocket `.list` | 格式兼容性 |
| ⚙️ 部分 YAML classical 保留 | SR 按内容识别可解析 |
| ⚙️ `rule-provider` 周期刷新 → SR 自动更新配置 | 统一由 SR 管理 |

---

## 八、启动与验证

1. 首页顶部 → 点击 **启动（Not Connected → Connected）**。
2. 首次连接系统会弹出「允许添加 VPN 配置」→ 允许 + 输入 Touch ID / 密码。
3. 打开浏览器访问 `https://whoer.net` 或 `https://ipleak.net`：
   - IP 应显示为所选节点的出口 IP
   - DNS 泄漏检测应显示代理侧 DNS

### 验证分流是否正确

- 访问 `chat.openai.com` → 应通过「🤖 AI 服务」组出口；
- 访问 `www.netflix.com` → 应通过「🎥 Netflix」组；
- 访问 `www.bilibili.com` → 应走 DIRECT 或国内流媒体；
- 访问 `raw.githubusercontent.com` → 应走「📦 开发工具」或「🚫 受限网站」组；

首页底部「**连接信息（Connections）**」可查看每条实时请求命中的规则与上游节点。

---

## 九、iOS 系统设置建议

### 1. 开启后台刷新（**必做**）
- **iOS 设置** → **通用** → **后台 App 刷新** → 确保 Shadowrocket 开启。
- 否则 **rule-set 不会自动更新**。

### 2. 允许常驻 VPN
- **设置** → **VPN 与设备管理** → **Shadowrocket** → 开启「**按需连接**」。
- 建议搭配「**域名/IP 地址**」触发规则，避免误杀国内直连流量。

### 3. 跳过某些 App / 域名
- 配置内已预置 `skip-proxy` 列表：
  - 国内银行：建行 / 农行 / 邮储 / 工行 / 交行
  - 支付：支付宝 / 微信支付 / 财付通
  - iOS 系统：`captive.apple.com`（防 WiFi 检测异常）
  - 私有网段：`192.168.0.0/16`、`10.0.0.0/8`、`172.16.0.0/12`、`100.64.0.0/10`（CGNAT）

### 4. TUN 旁路路由（已预置）
保留组播 + 私有 + 链路本地 + 文档网段 + 广播地址，避免 TUN 过度劫持：
```
tun-excluded-routes = 10.0.0.0/8, 100.64.0.0/10, 127.0.0.0/8, 169.254.0.0/16, ...
```

---

## 十、跨境场景（中国 ⇄ 境外）

配置针对**常年跨境出差**用户做了优化：

| 组 | 在中国 | 在印尼/其他境外 |
|------|--------|----------------|
| 🚫 受限网站（GFW） | 选代理节点翻墙 | 选 DIRECT 直连 |
| 🌐 国外网站（含 jsDelivr/Cloudflare） | 选代理 | 选 DIRECT |
| 📺 国内流媒体 | DIRECT | 选 🇭🇰 香港回国节点 |

切换方式：**首页 → 代理组 → 手动切换** 即可，无需改配置。

---

## 十一、规则更新与维护

### 手动刷新所有 rule-set
- **配置页** → 长按配置 → **更新**。

### 自动更新
- 在配置页右上角齿轮 ⚙️ 中开启「**自动更新配置**」，默认每 24 小时一次。

### 检查规则失效
- 首页 → **规则（Rules）** → 滑动查看所有 rule-provider 状态；
- 若某条显示红色叉号，通常是源 URL 暂时 404，可尝试手动刷新。

---

## 十二、常见问题

### Q1：配置下载失败 / 部分 rule-set 空白？
- 首次下载需要开启代理（否则 GitHub 不稳定）。
- 可先使用一个简易直连代理下载配置后，再切回本配置。

### Q2：iOS 支付/银行 App 异常？
- 检查「**Skip Proxy**」是否包含你遇到问题的域名；
- 必要时添加到 `skip-proxy` 列表后重新导入配置。

### Q3：TikTok 海外版无法播放？
- TikTok 已由 `metaDomain('tiktok')` 独立覆盖；
- 手动在「📱 社交媒体」中切换合适区域即可。

### Q4：Netflix 显示「You seem to be using a proxy」？
- 切换到「🎥 Netflix」组中的其他节点；
- Shadowrocket 无法自动检测 Netflix 解锁状态，需手动尝试。

### Q5：修改配置后如何同步到 SR？
- 修改 → 推送到托管 URL → Shadowrocket 配置页 → 长按 → **更新**。

---

## 十三、致谢

- [Shadowrocket](https://apps.apple.com/app/shadowrocket/id932747118)
- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) - Shadowrocket `.list` 规则源
- [szkane](https://github.com/szkane) - 补充规则
- 原版 Clash Party v5.2.2 所有参考作者
