# Shadowrocket（小火箭）使用方法

> 配置文件：`shadowrocket-smart.conf`
> 版本：**v5.2.2-SR.1**（Build 2026-04-16，从 Clash Party v5.2.2 迁移重构）
> 目标：**Shadowrocket iOS（App Store 正版）** / macOS 通用
> 架构：9 Smart 区域组（`url-test` + `policy-regex-filter`）+ 28 业务策略组 + 250+ rule-set

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
1. 将 `shadowrocket-smart.conf` 上传到你的 GitHub 仓库（public 或 private 均可，private 需生成 token URL）。
2. 获取 Raw URL：`https://raw.githubusercontent.com/<user>/<repo>/main/shadowrocket-smart.conf`

**B. jsDelivr CDN（国内访问更稳定）**
`https://cdn.jsdelivr.net/gh/<user>/<repo>@main/shadowrocket-smart.conf`

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

---

## 五、9 区域组 × 28 业务组说明

Shadowrocket 不支持 JavaScript，改用 `policy-regex-filter` 在导入/编译时一次性匹配节点名：

### 区域组（url-test 自动择优）
- 🌍 全球节点 / 🇭🇰 香港节点 / 🇹🇼 台湾节点 / 🇯🇵 日韩节点
- 🌏 亚太节点 / 🇺🇸 美国节点 / 🇪🇺 欧洲节点 / 🌎 美洲节点 / 🌍 非洲节点

### 业务组（select 手动选择）
- 🤖 AI 服务、💰 加密货币、🏦 金融支付、📧 邮件、💬 即时通讯、📱 社交媒体
- 🧑‍💼 会议协作、📺 国内流媒体、📺 东南亚流媒体、🇺🇸 美国流媒体、🇭🇰 香港流媒体、🇹🇼 台湾流媒体
- 🎮 游戏、☁️ 云与 CDN、🚫 受限网站（GFW）、🛡️ 广告拦截、🔒 隐私追踪
- 🍎 Apple、🪟 Microsoft、🔍 Google、📦 GitHub / 开发工具 等

首次导入后，建议在「**首页 → 代理组**」为 **28 个业务组**逐一选择一个默认上游节点或区域组。

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
- 访问 `www.netflix.com` → 应通过「🇺🇸 美国流媒体」组；
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
| ☁️ 云与 CDN（jsDelivr） | 选代理 | 选 DIRECT |
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
- 手动在「📺 东南亚流媒体」或「🇺🇸 美国流媒体」中切换合适区域即可。

### Q4：Netflix 显示「You seem to be using a proxy」？
- 切换到「🇺🇸 美国流媒体」组中的其他节点；
- Shadowrocket 无法自动检测 Netflix 解锁状态，需手动尝试。

### Q5：修改配置后如何同步到 SR？
- 修改 → 推送到托管 URL → Shadowrocket 配置页 → 长按 → **更新**。

---

## 十三、致谢

- [Shadowrocket](https://apps.apple.com/app/shadowrocket/id932747118)
- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) - Shadowrocket `.list` 规则源
- [szkane](https://github.com/szkane) - 补充规则
- 原版 Clash Party v5.2.2 所有参考作者
