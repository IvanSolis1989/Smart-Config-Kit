# Clash Meta For Android（CMFA）使用教程

> 目录简介：这里提供 CMFA/mihomo 原生 YAML 配置和 Android/ClashMi 导入教程，用于复用 Clash Party 基线策略的静态版本。
>
> 配置文件：`CMFA(mihomo).yaml`
> 适用客户端：**Clash Meta For Android（CMFA）** / **FlClash** / **mihomo-party-android**（Android 原生）· **[ClashMi](https://github.com/KaringX/clashmi)**（跨平台 Flutter GUI，iOS/macOS/Android/Windows/Linux，复用同一 YAML；详见 §九）
> 内核要求：**Mihomo**（原生 YAML 导入；区域组用 `url-test`，**不含 Smart + LightGBM**——CMFA 的静态 YAML 不支持 JS 覆写）
> **FlClash 用户**：推荐使用 [FlClash 覆写脚本](../FlClash/FlClash(mihomo).js)（动态节点分类 + 家宽识别 + 订阅清理）。详见 [`FlClash/README.md`](../FlClash/README.md)。
> 当前版本：**v6.0.14-cmfa.7**（Build 2026-09-30，跟随 Clash Party v6.0.14 主线；融合规则集使用版本化本地缓存路径）

> 测速候选：具名 direct/reject 支持出站留在 provider 中供拨号链引用，22 个测速组按类型排除它们；空组使用 REJECT。业务组中的显式 DIRECT 选择仍可使用。[官方代理组字段](https://wiki.metacubex.one/config/proxy-groups/)与[实核验收](../docs/research/2026-09-30-routing-runtime-followup.md)。

> 使用已验收的 Mihomo v1.19.29 或更新内核。空地区组会拒绝连接，请在业务组选择有节点的地区或全球组；不要依赖空组隐式直连。

<sub>💖 [支持本项目](../docs/donate.md) · ⭐ [Star](https://github.com/ivansolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues)</sub>

---

## 🚀 零基础 5 分钟快速开始

> 第一次在安卓上用代理？先看这段。

### 这是什么？
一份**写死的 Clash 配置 YAML**，用安卓版 Clash 客户端打开就能用。**不需要**你懂 Clash 是什么、也**不需要**手动配任何规则。

### 我要准备什么？
1. **一部安卓 8.0+ 手机**（大部分 2018 年后的手机都支持）
2. **一个机场订阅 URL**（机场 = 代理服务商，你花钱买他们的订阅）
3. **CMFA 客户端 APK**（下面教你选）
4. **本仓库的 `CMFA(mihomo).yaml` 文件**（你只需要改里面一行 URL）

### 术语速查
- **APK**：安卓 App 的安装包文件。不同手机要用不同的 APK。
- **arm64-v8a / armeabi-v7a**：手机 CPU 架构。下面第一章会教你怎么选。
- **订阅链接**：机场给你的一串 URL。`http`/`https` 开头，通常还带 `?token=xxx`。
- **VPN 权限**：安卓系统会弹出窗口问「是否允许 CMFA 建立 VPN 连接」，必须允许。
- **TUN 模式**：CMFA 接管手机所有流量（包括其它 App）。默认开启，别关。

### 3 步走完
1. **下载 CMFA APK**：打开 https://github.com/MetaCubeX/ClashMetaForAndroid/releases ，下最新版的 **arm64-v8a** 那个（2017 年以后的手机都用这个）。如果不确定就下 `universal`。
2. **改订阅链接**：用文本编辑器（手机上的「文件管理 → 编辑文本」也行）打开 `CMFA(mihomo).yaml`，找到 `url:` 那行（大约第 31 行），把后面的 URL 换成你机场给你的 URL。保存。
3. **导入 + 启动**：把修改后的 YAML 传到手机（微信/QQ/AirDroid/U盘都行） → 打开 CMFA → 右下角 ➕ → **从文件导入** → 选这个 YAML → 回到首页 → 点中间那个大按钮「启动」 → 系统弹「允许建立 VPN 连接」→ **允许**。

### 跑起来之后怎么验证？
- 浏览器打开 `https://www.google.com` 能打开 = 代理通了。
- CMFA 点底部「代理」，应看到 **22 区域组（11 全部 + 11 家宽）+ 33 业务组**。
- 点底部「连接」能看到每次访问走了哪个组/节点。
- 额外检查：按根 README 的 [导入后 60 秒验证清单](../README.md#-导入后-60-秒验证清单) 确认规则下载、GEOSITE 命中与 anti-ad 误伤白名单。

### 最常见踩坑
- ❌ **APK 装不上**：没允许"来自未知来源的应用"。设置 → 安全 → 允许安装未知来源。
- ❌ **导入后节点列表是空的**：订阅链接返回的格式不对。换链接加 `?flag=clash.meta` 后缀；或用 Sub-Store 做格式转换。
- ❌ **首次启动卡在"加载规则"**：CMFA 要下载 113 个融合规则源。**必须在 WiFi + 已开代理**（可以先用随便一个能用的节点启动，等规则下完再切到本配置），否则 GitHub/jsdelivr 在国内会 404。
- ❌ **打开支付宝/银行 App 卡死**：已在配置里把 `+.alipay.com` / 主流银行域名排除了代理。如果你用的银行没排除，在 CMFA 的「应用 → 分应用代理」里把那个银行 App 设为"不走代理"。
- ❌ **LightGBM 自动择优不生效**：CMFA YAML 用的是 `url-test`（按延迟择优），**不是** Mihomo Smart 组。Smart + LightGBM 需要 Mihomo Smart Alpha 内核，**目前仅桌面端 Clash Verge Rev / Mihomo Party + Clash Party Smart JS 支持**。FlClash 覆写脚本 (`../FlClash/FlClash(mihomo).js`) 也是 url-test（标准 Mihomo 内核限制），但提供动态节点分类/家宽识别/订阅清理等 YAML 没有的能力。

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

打开 `CMFA(mihomo).yaml`，找到 `proxy-providers` 段落（约第 137 行）：

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

### 多机场订阅：三种方式

如果你同时购买了多家机场（例如一家主打香港、一家主打美国、一家做家宽），需要把它们的节点合并到同一份 CMFA 配置里。

#### 方式 A：Sub-Store 融合（推荐）

**Sub-Store** 是一个 Mihomo / Surge / Loon 生态的订阅管理工具，可以把你所有机场的订阅链接合并成一个 URL，统一输出。

1. 在桌面端 Mihomo Party / Clash Verge Rev 中安装 Sub-Store 插件
2. 新建「组合订阅」→ 把多个机场 URL 填进去 → 勾选「输出为 Mihomo 格式」
3. 生成一个融合后的 URL（形如 `http://127.0.0.1:19500/api/collection/xxx`）
4. 把这个 URL 填到上面 `proxy-providers.Subscribe.url` 里

**优点**：不需要改 YAML 结构，一个 URL 搞定一切；支持重命名节点、按正则过滤、全平台通用。

#### 方式 B：在线订阅转换站（零门槛，无需安装任何工具）

如果你不想装任何 App 或插件，可以用第三方 **订阅转换站**。你把多个机场的订阅链接粘贴进去，它会输出一个合并后的 URL。

**这个方案与客户端无关**——转换站在网页上完成，输出的 URL 直接用于 Shadowrocket / Surge / Loon / Quantumult X / SingBox / v2rayN 等**所有客户端**。

常见转换站（社区维护，任选其一）：
- `https://acl4ssr-sub.github.io`（ACL4SSR 官方前端）
- `https://sub.v1.mk`（Sub-Store 在线版）
- `https://id9.cc`（备用）

操作步骤：
1. 打开上述任一网站
2. 把多家机场的订阅链接粘贴到「订阅链接」输入框（一行一个或用 `|` 分隔）
3. 后端/输出选 **Mihomo（Clash.Meta）**
4. 点击「生成订阅链接」→ 复制输出的新 URL
5. 把新 URL 填到 `proxy-providers.Subscribe.url` 里

> ⚠️ **隐私提醒**：转换站服务端能看到你提交的所有订阅链接（包括 token），理论上也能解密节点流量特征。**不要在转换站上提交包含敏感信息（如专属专线 IP、企业内部 VPN）的订阅链接**。如果你对隐私有要求，优先用方式 A（Sub-Store 跑在本地）或方式 C（手动 YAML）。

#### 方式 C：YAML 直接写多个 proxy-providers（无需额外工具）

如果你不想装 Sub-Store，可以直接在 YAML 里写多个 `proxy-providers`，Mihomo 会自动合并所有来源的节点到同一个代理组中。

把单机场的 `proxy-providers` 块：

```yaml
proxy-providers:
  Subscribe:
    type: http
    url: 'https://airport1.example.com/sub?token=xxx'
    interval: 86400
    path: ./proxy_providers/sub1.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置)'
```

改为多机场版本：

```yaml
proxy-providers:
  Airport1:
    type: http
    url: 'https://airport1.example.com/sub?token=xxx'
    interval: 86400
    path: ./proxy_providers/airport1.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置)'

  Airport2:
    type: http
    url: 'https://airport2.example.com/sub?token=yyy'
    interval: 86400
    path: ./proxy_providers/airport2.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置)'

  Airport3:
    type: http
    url: 'https://airport3.example.com/sub?token=zzz'
    interval: 86400
    path: ./proxy_providers/airport3.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置)'
```

**关键机制**：本配置中所有 `url-test` 区域组（🌍 全球节点、🇭🇰 香港节点等）使用 `use:` 字段引用 proxy-provider 名称来获取节点，并通过 `filter:` 正则按节点名自动归类（例如「香港节点」组的 `filter:` 匹配 "香港/HongKong/HKG/HK"）。

**如果你用了上面「方式 C」的多机场写法，必须把每个区域组的 `use:` 也更新**，加上所有新的 provider 名。否则新加的机场节点不会出现在任何组里。

在 YAML 中找到所有 `use:` 行（约第 538 行起），把：

```yaml
  use:
  - Subscribe
```

改为（以 3 个机场为例）：

```yaml
  use:
  - Airport1
  - Airport2
  - Airport3
```

每个 `url-test` 区域组（🌍 全球节点、🏡 全球家宽、🇭🇰 香港节点 … 共 18 个组）都要做同样的修改。可以用文本编辑器的「查找替换」功能：把所有 `- Subscribe` 替换为 `- Airport1\n  - Airport2\n  - Airport3`。

> 💡 **更省事的做法**：把所有 proxy-provider 的名字统一为 `Subscribe`，在不同机场之间用注释分隔——这样 `use: [Subscribe]` 不用改。但 Mihomo **不允许**两个 provider 重名（后定义的会覆盖前面的）。所以多机场还是得用不同名字 + 改 `use:`。

**方式 A（Sub-Store）没有这个问题**——因为 Sub-Store 输出的是单一 URL，填到 `Subscribe` 这一个 provider 里即可，`use: [Subscribe]` 完全不用动。

---

## 三、导入配置到 CMFA

### 方法 A：本地文件导入（推荐首次使用）

1. 将修改后的 `CMFA(mihomo).yaml` 复制到手机存储（例如 `Download/` 目录）。
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
   - 下载 **113 个融合 rule-providers**（源规则来自 `blackmatrix7 / MetaCubeX` 等上游）
   - 下载 **Loyalsoldier 增强版** `geoip.dat` / `Country.mmdb` / `GeoLite2-ASN.mmdb`
   - 下载 **MetaCubeX** `geosite.dat`
   - 下载 **LightGBM 模型** `Model.bin`（用于 Smart 组自动择优）
3. 初始化时间：视网络情况约 **1–3 分钟**；完成后规则集会缓存到本地。

> ⚠️ 首次启动建议在 **WiFi 环境**并开启 VPN 后进行，避免因某些 rule-provider 需代理下载而失败。

---

## 五、代理组说明

本配置共 **22 区域组（11 全部 + 11 家宽）+ 33 业务组**，进入 CMFA「**代理（Proxies）**」页面可见：

### 区域组（自动择优）

以下 18 个 `url-test` 组会按节点名称自动聚合，**无需手动维护**：

- 🌍 全球节点、🏡 全球家宽、🇭🇰 香港节点、🏡 香港家宽
- 🇹🇼 台湾节点、🏡 台湾家宽、🇯🇵 日韩节点、🏡 日韩家宽
- 🌏 亚太节点、🏡 亚太家宽、🇺🇸 美国节点、🏡 美国家宽
- 🇪🇺 欧洲节点、🏡 欧洲家宽、🌎 美洲节点、🏡 美洲家宽
- 🌍 非洲节点、🏡 非洲家宽

### 业务组（手动选择）

31 个 `select` 业务组，每组默认候选包含所有区域组 + `DIRECT`，首次使用需为每个业务组**手动指定一个首选区域**：

| 业务组 | 推荐区域 |
|--------|----------|
| 🤖 AI 服务（ChatGPT/Claude/Gemini） | 🇺🇸 美国节点（避开 HK/CN 地区） |
| 💰 加密货币 | 🇭🇰 香港节点 |
| 🏦 金融支付 | 🌍 全球节点 |
| 💬 即时通讯（Telegram/Discord） | 🇭🇰 香港节点 或 🇯🇵 日韩节点 |
| 📱 社交媒体（X/Twitter/Instagram） | 🇯🇵 日韩节点 |
| 🧑‍💼 会议协作（Zoom/Teams） | 🇯🇵 日韩节点（低延迟） |
| 📺 国内流媒体（B 站/爱奇艺/腾讯） | DIRECT（境内）或 🇭🇰 香港节点（境外） |
| 🎥 Netflix | 🇺🇸 美国节点 |
| 🎬 Disney+ | 🇺🇸 美国节点 |
| 📡 HBO/Max | 🇺🇸 美国节点 |
| 📺 Hulu | 🇺🇸 美国节点 |
| 🎬 Prime Video | 🇺🇸 美国节点 |
| 📹 YouTube | 🌍 全球节点 |
| 🎵 音乐流媒体（Spotify/Apple Music） | 🌍 全球节点 |
| 🇭🇰 香港流媒体（Now E / MyTV） | 🇭🇰 香港节点 |
| 🇹🇼 台湾流媒体（LiTV / 巴哈姆特） | 🇹🇼 台湾节点 |
| 🇯🇵 日韩流媒体 | 🇯🇵 日韩节点 |
| 🇪🇺 欧洲流媒体 | 🇪🇺 欧洲节点 |
| 🌐 其他国外流媒体 | 🌍 全球节点 |
| 🕹️ 国内游戏 | DIRECT |
| 🎮 国外游戏 | 🌍 全球节点 或 🇯🇵 日韩节点（低延迟） |
| 🔍 Google 服务 | 🌍 全球节点 |
| 🔧 工具与服务 | 🌍 全球节点 |
| Ⓜ️ 微软服务 | 🌍 全球节点 |
| 🍎 苹果服务 | DIRECT（境内） |
| 📥 下载更新 | 🌍 全球节点 |
| 🛰️ BT/PT Tracker | REJECT |
| 🏠 国内网站 | DIRECT |
| 🚫 受限网站（GFW） | 境内选代理，境外选 DIRECT |
| 🌐 国外网站 | 🌍 全球节点 |
| 🐟 漏网之鱼 | 🌍 全球节点（FINAL） |
| 🛑 广告拦截 | REJECT |

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

### Q5：fake-ip 会不会让 STUN/WebRTC 测试失真？
A：v5.4.13 后 STUN/TURN 域名已进入 `fake-ip-filter`，标准端口 `3478 / 3479 / 5349 / 19302 / 19305 / 19307` 走 `DIRECT`。若测试服务强制使用 UDP/443 TURN，仍会受 QUIC 屏蔽策略影响。

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

- ✅ 54 代理组（22 区域 + 33 业务）结构 1:1 加载。
- ✅ 151 条主规则 + 132 个融合 `rule-providers` 全部由 source graph 顺序编译生成。
- ✅ fake-ip DNS / sniffer / `proxy-providers.filter` / `exclude-filter` 行为与 CMFA 等价。
- ✅ 22 区域组使用 `type: url-test`（按延迟择优）—— 与 CMFA 完全相同。

### ClashMi 专属差异（官方 [FAQ](https://clashmi.app/guide/faq) 声明；本 YAML 均已规避）

| 项 | ClashMi 行为 | 本 YAML 的影响 |
|---|---|---|
| **GEOIP / GEOSITE 规则** | 启动时强制转换为对应 geo rule-set（内核定制） | GEOSITE 在编译期融合；GEOIP 保留在少量 residual provider 中由 GeoIP 数据库原生查询，避免展开成几十万 CIDR |
| **`GEOIP,<ASN>` ASN 规则** | iOS 版本不支持 IP-ASN 数据库 | **未使用** ASN 规则 |
| **iOS VPN Extension 50 MB 内存硬顶** | 超出即被系统杀进程 | 本 YAML 全部走 `.mrs` 二进制 ruleset + 懒加载，**不会触发** OOM |
| **`tun:` YAML 字段块** | 由 App UI 托管 TUN 开关，不建议 YAML 手写 | 本 YAML **未写** `tun:` 段（交 App 设置），对 ClashMi 天然友好 |
| **Mihomo Smart 内核 / LightGBM** | bundle 的是 mainline（**非** `vernesong/mihomo` Smart fork），不识别 `type: smart` / `uselightgbm` / `lgbm-custom-url` | 本 YAML 区域组本就是 `url-test`（CMFA 同因），此限制不适用 |
| **内核版本升级** | 跟随 App 发版，**不可独立更新**（FAQ） | 无影响；本 YAML 使用 mainline 稳定字段 |

### 一句话结论

`CMFA(mihomo).yaml` 可在 ClashMi 上**开箱即用**，行为与 CMFA 等价；UI 操作路径不同但产物层无差异。

---

## 十、参考与致谢

- 上游内核：[MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo)
- LightGBM 模型：[vernesong/mihomo](https://github.com/vernesong/mihomo)
- 规则集：[blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)
- GeoIP：[Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip)
- 兼容客户端：[KaringX/clashmi](https://github.com/KaringX/clashmi) · [ClashMi 官方 FAQ](https://clashmi.app/guide/faq)

---

## 💖 支持本项目

→ [捐赠 / Star / PR](../docs/donate.md)
