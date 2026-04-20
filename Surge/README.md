# Surge 使用教程（对齐 Clash Party v5.2.3）

> 配置文件：`Surge/surge-smart.conf`
> 版本：**v5.2.3-Surge.1**（Build 2026-04-20，从 Shadowrocket v5.2.2-SR.2 迁移适配）
> 目标：**Surge 5 / Surge Mac**（付费正版；iOS + macOS 通用）
> 架构：9 区域 url-test 组（policy-regex-filter 自动按地区聚合）+ 28 业务策略组 + 250+ RULE-SET

---

## 🚀 零基础快速开始

### 这是什么？
**Surge 是 iOS / macOS 上最专业、最贵的付费代理客户端**。它的强项是稳定 + 脚本化 + MITM。本仓库提供一份 Surge `.conf`，让你无需手配 900+ 条规则就能享用 9 区域 + 28 业务分流。

### 我要准备什么？
1. **iPhone/iPad（iOS 15+）或 Mac**
2. **非中国区 Apple ID**（Surge 在大陆区下架）
3. **💸 Surge 5 付费**：iOS 约 **¥648**（约 $90，贵！），macOS 约 $89.99。**许可证一次买 5 台设备共用**。
4. **一个机场订阅 URL**
5. **本仓库的 `surge-smart.conf`**，托管到 URL

### Surge 值不值这个价？
- **值**：稳定到离谱（2 年不重启不崩）、脚本生态最强、MITM 最好用、Mac/iOS 配置同步。
- **不值**：如果你只是临时用代理、不做自动化/MITM，选便宜的 **Shadowrocket（¥20）** 或 **Loon（¥198）** 就够用。

### 术语速查
- **Surge 配置 `.conf`**：`[General]` / `[Proxy Group]` / `[Rule]` / `[MITM]` 等段落的文本文件
- **RULE-SET**：外部规则列表的 URL，Surge 启动时从网上拉
- **MMDB**：GeoIP 数据库。Surge 独有的 `geoip-maxmind-url` 字段已启用，**开机自动下载** Loyalsoldier 加强版，不用手动配
- **MITM**：中间人解密，用于签到脚本 / 去广告。本配置默认关闭

### 3 步走完
1. **App Store 搜 "Surge 5" → 购买 → 安装 → 允许 VPN 权限**。
2. **把 `surge-smart.conf` 托管到 URL**（最简单：GitHub Raw：`https://raw.githubusercontent.com/你用户名/仓库/main/Surge/surge-smart.conf`）
3. **导入**：Surge → 配置 → 安装配置 → 粘贴 URL → 下载 → 启用。节点来源：机场订阅作为子配置添加（配置 → 本配置 → 子配置 / External Subscription）。

### 跑起来验证？
- 浏览器打开 `https://www.google.com` 能打开
- Surge「策略组」面板应看到 **37 组**（9 区域 + 28 业务）
- Surge「活动」面板可看每条请求命中的规则和节点

### 最常见踩坑
- ❌ **App Store 提示无法购买**：Apple ID 是中国区，换非中国区。
- ❌ **规则集下载失败 `rule-set unavailable`**：首次安装**必须先开代理**。用一个简单节点连上再导本配置。
- ❌ **MMDB 没下载**：Surge 需能访问 GitHub 才能拉 Loyalsoldier 版；失败时回退到内置 GeoIP（规则仍能跑，只是精度稍差）。
- ❌ **支付宝/银行登不上**：本配置已排除 5 大国行 + 支付宝/微信支付；没覆盖的 App 自行加 `skip-proxy`（`[General]` 段）。
- ❌ **想要 LightGBM 自动择优**：Surge 不是 mihomo 内核，做不到。要就用桌面端 Clash Verge Rev / Mihomo Party。

---

## 一、下载 Surge

Surge 是付费软件，无免费版：

- **iOS**：App Store 搜「Surge 5」，价格 ¥648 / 区（约 $90）。
- **macOS**：https://nssurge.com → Surge Mac 许可证（一次性 $89.99 起）。
- **许可证可在 5 台设备同步使用**（同一个 Apple ID / Surge 账号）。

---

## 二、配置托管

Surge 不支持本地文件直接「打开即导入」，必须把配置托管到 URL：

**A. GitHub Raw**
```
https://raw.githubusercontent.com/<user>/<repo>/main/Surge/surge-smart.conf
```

**B. jsDelivr CDN**（国内更稳）
```
https://cdn.jsdelivr.net/gh/<user>/<repo>@main/Surge/surge-smart.conf
```

**C. 自建 HTTPS**
任意可通过 HTTPS 访问的 URL 均可。

---

## 三、导入配置

1. 打开 Surge → 底部 **配置（Config）** 标签。
2. 右上角 **➕** → **从 URL 安装**。
3. 粘贴托管 URL → **下载**。
4. 下载完成后点击配置 → **启用**。

首次启用时 Surge 会拉取 **250+ 个 RULE-SET**（blackmatrix7 Surge 专用 `.list` 格式），根据网络情况约 **1–3 分钟**。**这期间务必保持代理开启**，否则 GitHub 访问不稳定会导致部分 RULE-SET 下载失败。

---

## 四、机场订阅 / 节点

Surge 的节点来源有两种方式，任选其一：

**A. 把机场订阅作为独立子配置**（推荐）
1. Surge → **配置** → ➕ → 粘贴机场订阅 URL → **下载**。
2. 在主配置（本文件）的 **「配置 → 本配置 → 子配置 / External Subscription」** 里把机场订阅选成「节点来源」。
3. 所有节点会自动出现在 9 区域组的候选池里，按 `policy-regex-filter` 正则匹配到对应地区。

**B. 直接在本文件 `[Proxy]` 段粘贴节点**
这种方式适合手工维护少量节点，格式参考文件第 126 行附近的注释。**不推荐**，机场订阅 A 更省事。

---

## 五、9 区域组 × 28 业务组说明

### 区域组（url-test 自动择优）
9 个组按 `policy-regex-filter` 自动按节点名聚合：
- 🌍 全球节点（剔除信息/倍率/回国节点，兜底全球最低延迟）
- 🇭🇰 香港节点、🇹🇼 台湾节点、🇯🇵 日韩节点（JP+KR 合并）、🌏 亚太节点
- 🇺🇸 美国节点、🇪🇺 欧洲节点、🌎 美洲节点、🌍 非洲节点

测速间隔 **600s**（10 分钟），tolerance **50ms**（防抖动）。

### 业务策略组（select 手动）
28 个业务组，首次导入后建议为每个组手动指定一个首选区域：

| 业务组 | 推荐区域 |
|--------|----------|
| 🤖 AI 服务 | 🇺🇸 美国节点（避开 HK / CN） |
| 💰 加密货币 | 🇭🇰 香港 / 🇯🇵 日韩 / DIRECT（视账户注册地） |
| 🏦 金融支付 | 🌍 全球 |
| 📧 邮件服务 | 🌍 全球 |
| 💬 即时通讯 | 🌍 全球 或 🇭🇰 香港 |
| 📱 社交媒体 | 🌍 全球 |
| 🧑‍💼 会议协作 | 🌍 全球 或 🇯🇵 日韩 |
| 📺 国内流媒体 | DIRECT（境内）/ 🇭🇰 香港（境外） |
| 📺 东南亚流媒体 | 🌏 亚太节点 |
| 🇺🇸 美国流媒体 | 🇺🇸 美国节点 |
| 🇭🇰 香港流媒体 | 🇭🇰 香港节点 |
| 🇹🇼 台湾流媒体 | 🇹🇼 台湾节点 |
| 🇯🇵 日韩流媒体 | 🇯🇵 日韩节点 |
| 🇪🇺 欧洲流媒体 | 🇪🇺 欧洲节点 |
| 🕹️ 国内游戏 | DIRECT |
| 🎮 国外游戏 | 🌍 全球 或 🇯🇵 日韩（低延迟） |
| 🔍 搜索引擎 | 🌍 全球 |
| 📟 开发者服务 | 🌍 全球 或 🇺🇸 美国 |
| Ⓜ️ 微软服务 | 🌍 全球 |
| 🍎 苹果服务 | DIRECT（境内）|
| 📥 下载更新 | DIRECT |
| ☁️ 云与 CDN | 🌍 全球 |
| 🛰️ BT/PT Tracker | REJECT |
| 🏠 国内网站 | DIRECT |
| 🚫 受限网站（GFW） | 中国选代理 / 海外选 DIRECT |
| 🌐 国外网站 | 🌍 全球 |
| 🐟 漏网之鱼 | 🌍 全球（FINAL）|
| 🛑 广告拦截 | REJECT |

---

## 六、DNS 配置（与 Clash Party 对齐）

本版本的 DNS 段直接映射 Clash Party `README.md` 第四节的「DNS」基线：

| Surge 字段 | 对应 Clash 字段 | 值 |
|------------|-----------------|------|
| `dns-server` | `default-nameserver` | `223.5.5.5, 119.29.29.29, system` |
| `encrypted-dns-server` | `nameserver` + `direct-nameserver` + `fallback` | 国内 DoH（doh.pub / alidns）+ 国外 DoH（1.1.1.1 / 8.8.8.8） |
| `hijack-dns` | `hijack-dns` | `8.8.8.8:53, 8.8.4.4:53` |
| `geoip-maxmind-url` | `geox-url.mmdb` | Loyalsoldier Country.mmdb（Surge 专属优势：无需 UI 手动导入）|

**无法迁移的 Clash 字段**（Surge 引擎限制）：
- `respect-rules: true`（Surge 默认尊重规则，无此开关）
- `fallback-filter.geoip-code: CN`（Surge DNS 无 GeoIP 过滤层）
- `proxy-server-nameserver`（Surge 用 `encrypted-dns-follow-outbound-mode` 统一管理）

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

本配置默认关闭 MITM / JS 脚本（量化/交易场景不需要）；如需启用签到脚本，在 `[MITM]` 段加 hostname 并把 `enable = true`。

---

## 八、与 Clash Party 主线的差异（iOS/Surge 引擎限制）

| 差异 | 原因 |
|------|------|
| ❌ 无 Mihomo Smart 组 / LightGBM 自动择优 | Surge 不是 Mihomo 核；退化为 url-test |
| ❌ 无 TLS 指纹注入（`client-fingerprint`） | Surge 不暴露 uTLS 控制 |
| ❌ PROCESS-NAME 规则（本文件默认不用） | iOS 无进程 API；Mac 版单独支持但为了跨平台统一略过 |
| ⚙️ GEOSITE 全部替换为 RULE-SET | Surge 不支持 GEOSITE（依赖 MMDB + RULE-SET）|
| ⚙️ Meta `.mrs` 二进制 → blackmatrix7 Surge `.list` | 格式兼容性 |
| ⚙️ rule-provider 独立刷新 → Surge 订阅统一更新 | Surge 引擎设计 |

---

## 九、验证

1. Surge → **首页** → **已启用的配置**：应显示 `Surge Smart v5.2.3-Surge.1`。
2. **策略组** 面板应出现 9 区域 + 28 业务共 37 组。
3. 访问以下网站做功能验证：
   - `https://chat.openai.com` → 命中「🤖 AI 服务」
   - `https://www.netflix.com` → 命中「🇺🇸 美国流媒体」
   - `https://www.bilibili.com` → DIRECT 或「📺 国内流媒体」
   - `https://raw.githubusercontent.com` → 「📟 开发者服务」或「🚫 受限网站」
4. **活动（Activity）** 面板可查看每条实时请求命中的规则 + 上游节点。

---

## 十、常见问题

### Q1：规则集下载失败，配置里显示 `rule-set unavailable`？
- 首次安装必须**先开代理**再下载配置，否则 GitHub 不稳定 + GFW 封锁会导致部分 RULE-SET 404。
- 若已开代理仍失败，检查 **配置 → 常规 → 网络权限** 是否允许 Surge 访问 WiFi + 蜂窝。

### Q2：我想要 Mihomo Smart 组 + LightGBM 自动择优，怎么办？
- Surge 引擎不支持。Windows 上用 **Clash Verge Rev / Mihomo Party + 本仓库的 JS 覆写**。
- macOS 上可以 Surge + Clash Verge Rev 并存（前者用于跨 APP 策略，后者用于 AI/流媒体细分 + LightGBM）。

### Q3：iOS 支付 / 银行 App 异常？
- 检查 `skip-proxy` 是否已包含对应域名。本配置已包含：建行 / 农行 / 邮储 / 工行 / 交行 / 支付宝 / 微信支付 / 财付通。
- 若你用的国内银行域名未列出，在 Surge UI 的 **配置 → 当前配置 → 编辑** → `[General]` 段 `skip-proxy` 追加。

### Q4：我想启用 MITM / JS 脚本（签到、去广告）？
- 本配置默认 `[MITM] enable = false`（量化交易场景不需要）。
- 启用步骤：
  1. Surge → **设置 → 证书 → 生成新 CA 证书 → 信任**（iOS 需在系统「设置 → 通用 → VPN 与设备管理」里信任）。
  2. `[MITM]` 段改为 `enable = true` + `hostname = 你要 MITM 的域名`。
  3. 在 `[Script]` 段或 `[URL Rewrite]` 段加入具体规则。

### Q5：节点名里有地区 emoji 但没被正确聚合？
- `policy-regex-filter` 是 Unicode 正则。如果机场的节点名用了特殊 emoji 序列（如 `🇭🇰` 的 RGI 旗帜序列），建议保留原生 emoji + 加中文国名（「香港」）做兜底，已在 regex 里兼容。

### Q6：跨境场景（中国 ⇄ 海外）怎么切换？
| 组 | 在中国 | 在海外 |
|---|---|---|
| 🚫 受限网站 | 选代理节点 | DIRECT |
| ☁️ 云与 CDN（jsDelivr） | 代理 | DIRECT |
| 📺 国内流媒体 | DIRECT | 🇭🇰 香港回国节点 |

Surge 支持 **按 SSID 自动切换配置**（`[Proxy Group]` 的 `ssid` 类型）；有需要可自行改造本文件加入 SSID 组。

---

## 十一、规则更新与维护

### Surge 自动更新
Surge 订阅默认**每次启动轮询更新**规则集。可在 **配置 → 常规 → 订阅更新周期** 里调整：
- **每次启动**（默认）
- 每 6 / 12 / 24 / 48 小时
- 手动

### 本仓库升级时同步
本 `surge-smart.conf` 跟随 Clash Party 主线升级；订阅的 URL 会自动拉最新版，无需手工重新导入。

---

## 十二、致谢

- [Surge](https://nssurge.com/) - 付费、稳定、专业的 iOS/macOS 代理客户端
- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) - Surge `.list` 规则源
- [Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip) - GeoIP MMDB
- 原版 Clash Party v5.2.3 所有参考作者
