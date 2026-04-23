# Clash Meta For Android（CMFA）使用教程

> 配置文件：`clash-smart-cmfa.yaml`
> 适用客户端：**Clash Meta For Android（CMFA）** / **FlClash** / **mihomo-party-android**（Android 原生）· **[ClashMi](https://github.com/KaringX/clashmi)**（跨平台 Flutter GUI，iOS/macOS/Android/Windows/Linux，复用同一 YAML；详见 §九）
> 内核要求：**Mihomo**（原生 YAML 导入；区域组用 `url-test`，**不含 Smart + LightGBM**——CMFA 的静态 YAML 不支持 JS 覆写）
> 当前版本：**v5.2.2**（跟随 Clash Party 主线）

---

## 🚀 零基础 5 分钟快速开始

> 第一次在安卓上用代理？先看这段。

### 这是什么？
一份**写死的 Clash 配置 YAML**，用安卓版 Clash 客户端打开就能用。**不需要**你懂 Clash 是什么、也**不需要**手动配任何规则。

### 我要准备什么？
1. **一部安卓 8.0+ 手机**（大部分 2018 年后的手机都支持）
2. **一个机场订阅 URL**（机场 = 代理服务商，你花钱买他们的订阅）
3. **CMFA 客户端 APK**（下面教你选）
4. **本仓库的 `clash-smart-cmfa.yaml` 文件**（你只需要改里面一行 URL）

### 术语速查
- **APK**：安卓 App 的安装包文件。不同手机要用不同的 APK。
- **arm64-v8a / armeabi-v7a**：手机 CPU 架构。下面第一章会教你怎么选。
- **订阅链接**：机场给你的一串 URL。`http`/`https` 开头，通常还带 `?token=xxx`。
- **VPN 权限**：安卓系统会弹出窗口问「是否允许 CMFA 建立 VPN 连接」，必须允许。
- **TUN 模式**：CMFA 接管手机所有流量（包括其它 App）。默认开启，别关。

### 3 步走完
1. **下载 CMFA APK**：打开 https://github.com/MetaCubeX/ClashMetaForAndroid/releases ，下最新版的 **arm64-v8a** 那个（2017 年以后的手机都用这个）。如果不确定就下 `universal`。
2. **改订阅链接**：用文本编辑器（手机上的「文件管理 → 编辑文本」也行）打开 `clash-smart-cmfa.yaml`，找到 `url:` 那行（大约第 31 行），把后面的 URL 换成你机场给你的 URL。保存。
3. **导入 + 启动**：把修改后的 YAML 传到手机（微信/QQ/AirDroid/U盘都行） → 打开 CMFA → 右下角 ➕ → **从文件导入** → 选这个 YAML → 回到首页 → 点中间那个大按钮「启动」 → 系统弹「允许建立 VPN 连接」→ **允许**。

### 跑起来之后怎么验证？
- 浏览器打开 `https://www.google.com` 能打开 = 代理通了。
- CMFA 点底部「代理」，应看到 **9 个区域组 + 28 个业务组**。
- 点底部「连接」能看到每次访问走了哪个组/节点。

### 最常见踩坑
- ❌ **APK 装不上**：没允许"来自未知来源的应用"。设置 → 安全 → 允许安装未知来源。
- ❌ **导入后节点列表是空的**：订阅链接返回的格式不对。换链接加 `?flag=clash.meta` 后缀；或用 Sub-Store 做格式转换。
- ❌ **首次启动卡在"加载规则"**：CMFA 要下 375+ 条规则约 15–30 MB。**必须在 WiFi + 已开代理**（可以先用随便一个能用的节点启动，等规则下完再切到本配置），否则 GitHub/jsdelivr 在国内会 404。
- ❌ **打开支付宝/银行 App 卡死**：已在配置里把 `+.alipay.com` / 主流银行域名排除了代理。如果你用的银行没排除，在 CMFA 的「应用 → 分应用代理」里把那个银行 App 设为"不走代理"。
- ❌ **LightGBM 自动择优不生效**：CMFA YAML 用的是 `url-test`（按延迟择优），**不是** Mihomo Smart 组。如果你想要 Smart + LightGBM，要么用 FlClash（部分支持 Alpha 内核），要么改用桌面端 Clash Verge Rev + 仓库的 JS 覆写脚本。

---

## 🔌 协议支持（Mihomo 内核）

CMFA / FlClash / mihomo-party-android 底层都是 **Mihomo 内核**，所以协议支持和桌面端的 Clash Verge Rev / Mihomo Party 完全一样：

| 协议 | 支持 | 说明 |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | 全套 AEAD + SS 2022 |
| **ShadowsocksR (SSR)** | ✅ | 兼容老机场 |
| **VMess** | ✅ | ws/grpc/h2/httpupgrade |
| **VLESS** | ✅ | 含 **REALITY** + **XTLS-Vision** |
| **Trojan** | ✅ | + Trojan-Go 扩展 |
| **Hysteria v1 / v2** | ✅ | QUIC-based，弱网友好 |
| **TUIC v5** | ✅ | QUIC-based |
| **WireGuard** | ✅ | 作为出站 |
| **AnyTLS / ShadowTLS / Snell v4 / SSH / Mieru** | ✅ | 新协议/小众协议全覆盖 |
| **SOCKS5 / HTTP(S)** | ✅ | |

**移动端上协议支持最全的组合就是 CMFA + Mihomo**，几乎没有你机场能给但它不能跑的。

### 提示
- CMFA YAML 是静态格式，区域组是 `url-test`（按延迟择优），**无 Smart + LightGBM**。LightGBM 需要 JS 覆写运行时注入，Android 目前没有客户端支持 JS 覆写。
- 想要 Smart + LightGBM 的唯一路径是桌面端 Clash Party / Clash Verge Rev / Mihomo Party。

---

## 一、下载 CMFA 客户端

1. 开源地址：https://github.com/MetaCubeX/ClashMetaForAndroid/releases
2. 根据手机 CPU 选择合适的 APK：
   - **arm64-v8a**：绝大多数 2017 年后的手机
   - **armeabi-v7a**：少数老机型
   - **universal**：不确定时的通用包
3. 安装后授权「VPN 权限」与「文件读写权限」。

---

## 二、修改订阅链接

打开 `clash-smart-cmfa.yaml`，找到 `proxy-providers` 段落（约第 137 行）：

```yaml
proxy-providers:
  Subscribe:
    type: http
    url: 'https://my.example.com/your-subscription-url'   # ← 替换为你的机场订阅链接
    interval: 86400
    path: ./proxy_providers/subscribe.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置|10x|20x|100x)'
```

**注意事项**：
- 订阅链接建议选择 `?flag=meta` 或 `?flag=clash.meta` 风格，返回 **Mihomo 兼容格式**的节点。
- `exclude-filter` 已内置过滤广告节点与高倍率节点，无需改动。
- 若你使用 **Sub-Store** 做多机场融合，可直接粘贴 Sub-Store 生成的单一 URL。

---

## 三、导入配置到 CMFA

### 方法 A：本地文件导入（推荐首次使用）

1. 将修改后的 `clash-smart-cmfa.yaml` 复制到手机存储（例如 `Download/` 目录）。
2. 打开 CMFA → **配置（Profiles）** → 右下角 ➕ → **从文件导入**。
3. 选择刚才的 YAML → 命名为 `Clash Smart` → 确定。

### 方法 B：URL 远程托管（推荐长期使用）

1. 将 YAML 托管到 GitHub Raw / Gist / 自建 HTTP 服务。
2. CMFA → **配置** → ➕ → **从 URL 导入** → 粘贴 URL → 确定。
3. 后续自动轮询更新（默认每 24 小时，可在配置设置里调整）。

---

## 四、首次启动

1. 在 CMFA 首页选择刚导入的配置，点击「**启动**」按钮。
2. 首次启动 CMFA 会自动完成以下动作（需保持网络畅通）：
   - 下载机场节点列表（`subscribe.yaml`）
   - 下载 **375+ rule-providers**（`blackmatrix7 / MetaCubeX` 等规则集）
   - 下载 **Loyalsoldier 增强版** `geoip.dat` / `Country.mmdb` / `GeoLite2-ASN.mmdb`
   - 下载 **MetaCubeX** `geosite.dat`
   - 下载 **LightGBM 模型** `Model.bin`（用于 Smart 组自动择优）
3. 初始化时间：视网络情况约 **1–3 分钟**；完成后规则集会缓存到本地。

> ⚠️ 首次启动建议在 **WiFi 环境**并开启 VPN 后进行，避免因某些 rule-provider 需代理下载而失败。

---

## 五、代理组说明

本配置共 **9 个区域组 + 28 个业务组**，进入 CMFA「**代理（Proxies）**」页面可见：

### 区域组（自动择优）

以下 9 个 `url-test` 组会按节点名称自动聚合，**无需手动维护**：

- 🌍 全球节点、🇭🇰 香港节点、🇹🇼 台湾节点、🇯🇵 日韩节点
- 🌏 亚太节点、🇺🇸 美国节点、🇪🇺 欧洲节点、🌎 美洲节点、🌍 非洲节点

### 业务组（手动选择）

28 个 `select` 业务组，每组默认候选包含所有区域组 + `DIRECT`，首次使用需为每个业务组**手动指定一个首选区域**：

| 业务组 | 推荐区域 |
|--------|----------|
| 🤖 AI 服务（ChatGPT/Claude/Gemini） | 🇺🇸 美国节点（避开 HK/CN 地区） |
| 💰 加密货币 | 🇭🇰 香港节点 |
| 📺 国内流媒体（B 站/爱奇艺/腾讯） | DIRECT（境内）或 🇭🇰 香港节点（境外） |
| 🇺🇸 美国流媒体（Netflix US / HBO） | 🇺🇸 美国节点 |
| 🇭🇰 香港流媒体（Now E / MyTV） | 🇭🇰 香港节点 |
| 🇹🇼 台湾流媒体（LiTV / 巴哈姆特） | 🇹🇼 台湾节点 |
| 📺 东南亚流媒体（爱奇艺 SEA / WeTV） | 🌏 亚太节点 |
| 💬 即时通讯（Telegram/Discord） | 🇭🇰 香港节点 或 🇯🇵 日韩节点 |
| 📱 社交媒体（X/Twitter/Instagram） | 🇯🇵 日韩节点 |
| 🧑‍💼 会议协作（Zoom/Teams） | 🇯🇵 日韩节点（低延迟） |
| 🚫 受限网站（GFW） | 境内选代理，境外选 DIRECT |
| … | … |

---

## 六、常用高级设置

### 1. 启用 TUN 模式（系统级代理）

- CMFA → **设置** → **网络** → 打开 **TUN 模式**。
- 配合配置中的 `stack: mixed` 可兼容绝大多数 App（包括 UDP / QUIC）。

### 2. 启用 Meta SideBar（仪表盘）

- CMFA → **设置** → **界面** → 开启「**显示流量图表 / 仪表盘**」，可实时查看 LightGBM 模型择优效果。

### 3. 应用分应用代理（可选）

- CMFA → **设置** → **应用过滤** → 选择模式：
  - **黑名单**：列表内 App 不走代理（推荐国内银行/支付 App 加入）
  - **白名单**：仅列表内 App 走代理

### 4. 开启后台保活

- 系统「**电池优化**」中将 CMFA 设为「**不优化**」。
- MIUI / ColorOS / HarmonyOS 需额外在「自启动」与「后台弹出」权限中允许 CMFA。

---

## 七、常见问题

### Q1：导入后提示 `list geosite not found` 或规则解析错误？
A：本配置已将所有 `GEOSITE` 高级标签替换为等效 `RULE-SET`，理论上不会出现该错误。若仍出现，请检查：
- 是否使用的是 **Mihomo Smart 内核**（而非旧版 ClashX / Clash Premium）。
- CMFA 版本是否 ≥ **2.11.x**。

### Q2：节点名称没有被正确分到区域组？
A：脚本按「中文关键字 + 城市 + IATA 机场代码 + ISO 国家代码」综合匹配，覆盖率 > 95%。若仍漏判，请将节点名贴到 Issue 中反馈。

### Q3：LightGBM 自动择优未生效？
A：确认：
- `proxy-groups` 中 `uselightgbm: true` 存在；
- 已下载 `Model.bin`（首次启动日志会显示下载进度）；
- CMFA 使用的是 **Smart 内核**而非普通 Meta 内核。

### Q4：fake-ip 模式下银行/支付 App 异常？
A：已通过 `sniffer.skip-domain` 排除主要支付域名（支付宝/微信/币安等）。若你使用的银行域名未在名单中，可在 `fake-ip-filter` 追加对应域名。

---

## 八、配置关键字段速查

| 字段 | 位置 | 说明 |
|------|------|------|
| `mixed-port: 7890` | 顶部 | HTTP / SOCKS 混合端口 |
| `mode: rule` | 顶部 | 规则模式（勿改 global/direct） |
| `find-process-mode: strict` | 顶部 | Android 14+ 可识别进程 |
| `dns.enhanced-mode: fake-ip` | `dns` | fake-ip 模式（性能最佳） |
| `sniffer.enable: true` | `sniffer` | 启用 SNI 嗅探 |
| `geodata-mode: false` | 顶部 | 使用 `.mrs` 二进制格式（体积更小） |

---

## 九、兼容客户端：ClashMi（跨平台）

**[ClashMi](https://github.com/KaringX/clashmi)**（又称 Clash Mi，KaringX 团队维护的 Flutter 跨平台 Mihomo GUI，GPL-3.0）可以**直接加载本 YAML**，无需任何修改；覆盖 **iOS 15+ / macOS 12+ / Android 8+ / Windows 10+ / Linux**。

> 与 CMFA 的关系：ClashMi bundle 的是 **MetaCubeX mihomo mainline**（[README](https://github.com/KaringX/clashmi)），与 CMFA 内核同源；但软件设置逻辑、UI、订阅管理流程和 CMFA 完全不同，因此单独列出使用说明；**配置层面（YAML schema）100% 共享**，本仓库不为 ClashMi 单开产物。

### 导入方式

ClashMi App 首页菜单 → **我的配置** → 右上角 **＋** → 选择一种：
- **添加配置链接**（订阅 URL，推荐长期使用，定时自动更新）
- **从剪贴板导入**（粘贴 YAML 内容）
- **从文件导入**（本地 `.yml` / `.yaml`）
- **扫描二维码**

命名后确定即可启用。TUN / HTTP 代理 / DNS 劫持等开关由 **App UI** 托管（不在 YAML 里手写）。

### 与 CMFA 行为一致的部分

- ✅ 37 代理组（9 区域 + 28 业务）结构 1:1 加载。
- ✅ 387 条 `RULE-SET` + 380+ `rule-providers` 全部走同一 MetaCubeX / blackmatrix7 / Loyalsoldier / szkane / Accademia 源。
- ✅ fake-ip DNS / sniffer / `proxy-providers.filter` / `exclude-filter` 行为与 CMFA 等价。
- ✅ 9 区域组使用 `type: url-test`（按延迟择优）—— 与 CMFA 完全相同。

### ClashMi 专属差异（官方 [FAQ](https://clashmi.app/guide/faq) 声明；本 YAML 均已规避）

| 项 | ClashMi 行为 | 本 YAML 的影响 |
|---|---|---|
| **GEOIP / GEOSITE 规则** | 启动时强制转换为对应 geo rule-set（内核定制） | **零触发**。本 YAML 使用 **387 条 `RULE-SET`**，**0 条 `GEOIP,`**，**0 条 `GEOSITE,`**（已在仓库自检）|
| **`GEOIP,<ASN>` ASN 规则** | iOS 版本不支持 IP-ASN 数据库 | **未使用** ASN 规则 |
| **iOS VPN Extension 50 MB 内存硬顶** | 超出即被系统杀进程 | 本 YAML 全部走 `.mrs` 二进制 ruleset + 懒加载，**不会触发** OOM |
| **`tun:` YAML 字段块** | 由 App UI 托管 TUN 开关，不建议 YAML 手写 | 本 YAML **未写** `tun:` 段（交 App 设置），对 ClashMi 天然友好 |
| **Mihomo Smart 内核 / LightGBM** | bundle 的是 mainline（**非** `vernesong/mihomo` Smart fork），不识别 `type: smart` / `uselightgbm` / `lgbm-custom-url` | 本 YAML 区域组本就是 `url-test`（CMFA 同因），此限制不适用 |
| **内核版本升级** | 跟随 App 发版，**不可独立更新**（FAQ） | 无影响；本 YAML 使用 mainline 稳定字段 |

### 一句话结论

`clash-smart-cmfa.yaml` 可在 ClashMi 上**开箱即用**，行为与 CMFA 等价；UI 操作路径不同但产物层无差异。

---

## 十、参考与致谢

- 上游内核：[MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo)
- LightGBM 模型：[vernesong/mihomo](https://github.com/vernesong/mihomo)
- 规则集：[blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)
- GeoIP：[Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip)
- 兼容客户端：[KaringX/clashmi](https://github.com/KaringX/clashmi) · [ClashMi 官方 FAQ](https://clashmi.app/guide/faq)
