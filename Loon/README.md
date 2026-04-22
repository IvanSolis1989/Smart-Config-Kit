# Loon 使用教程（对齐 Clash Party v5.2.4）

> 配置文件：`Loon/loon-smart.conf`
> 版本：**v5.2.4-Loon.2**（Build 2026-04-22，Loon 原生语法兼容性大修，见 `Loon/CHANGELOG.md`）
> 目标：**Loon iOS（App Store 付费正版）**
> 架构：9 区域 url-test 组（[Remote Filter] NameRegex）+ 28 业务策略组 + 250+ RULE-SET

---

## 🚀 零基础快速开始

### 这是什么？
**Loon 是 iOS 上的付费代理客户端**，价位比 Surge 低一半（¥198 vs ¥648）。本仓库提供 Loon 专用 `.conf`，9 区域 + 28 业务组全保留。

### 我要准备什么？
1. **iPhone / iPad（仅 iOS，无 macOS 版）**
2. **非中国区 Apple ID**
3. **💸 Loon 付费**：约 **¥198 / 区**（~$28）
4. **一个机场订阅 URL**
5. **本仓库的 `loon-smart.conf`**，托管到 URL

### Loon 值不值这个价？替代品对比
| | Shadowrocket | **Loon** | Surge | QX |
|---|---|---|---|---|
| 价格 | ¥20 | **¥198** | ¥648 | ¥68 |
| 稳定性 | 普通 | **好** | 极好 | 好 |
| macOS 版 | ✅ | ❌ | ✅ | ❌ |
| 脚本/MITM | 一般 | **好** | 极好 | 极好 |
| 插件生态 | ❌ | **✅ Plugin** | ⚠️ Modules | ⚠️ Scripts |

### 术语速查
- **Loon 配置 `.conf`**：与 Surge 有几处**关键语法差异**（详见下方第五/六章），**不能**直接喂 Surge 的 `.conf` 给 Loon
- **RULE-SET**：规则列表 URL，Loon 启动时下载。Loon 只吃 `.list` / `.conf` 纯文本格式，**不认 Clash classical `.yaml`**
- **[Remote Filter]**：Loon 原生的订阅节点过滤段，用 `NameRegex + FilterKey` 匹配节点名；url-test/select 组通过 Filter 名引用（**Loon 不支持** Surge 的 url-test 内联 `policy-regex-filter=`）
- **MMDB**：GeoIP 数据库。Loon 支持 `[General]` 里 `geoip-url` 字段自动下载（本配置已预设 Loyalsoldier 加强版）；UI 下载仍然可用作为后备

### 3 步走完
1. **App Store 搜 "Loon" → 购买 → 安装 → 允许 VPN 权限**。
2. **导入配置**：把 `loon-smart.conf` 托管到 URL → Loon → 配置 → ⊕ → 从 URL 下载 → 启用。配置里 `geoip-url` 已指向 Loyalsoldier 加强版 MMDB，首次启用会自动下载，**无需**再去 UI 手动填。
3. **加机场订阅**：底部「节点」→ ⊕ → 粘贴机场订阅 URL → 下载。Loon 会按配置里 `[Remote Filter]` 的 9 条 NameRegex 自动把节点分到 🌍 / 🇭🇰 / 🇹🇼 / 🇯🇵日韩 / 🌏亚太 / 🇺🇸 / 🇪🇺 / 🌎美洲 / 🌍非洲 九个区域组。

### 跑起来验证？
- 浏览器打开 `https://www.google.com` 能打开
- Loon「策略组」面板应看到 37 组
- Loon「过滤器」面板应看到 9 个 Filter（GLOBAL / HK / TW / JPKR / APAC / US / EU / AM / AF）
- Loon「设置 → 运行日志」看规则集 + MMDB 下载状态

### 最常见踩坑
- ❌ **规则集下载失败**：首次安装**必须先开代理**（没代理则 GitHub/jsDelivr 访问不稳定）；Loon → 设置 → 自动更新配置 调频率。
- ❌ **区域组里没有节点**：检查 Loon 是否识别了 `[Remote Filter]` 段；如果机场节点命名奇葩（例如纯英文代号），可能没匹配到 FilterKey，打开 Loon → 过滤器 → 手动 Edit 调 regex。
- ❌ **我把 Surge 的 `surge-smart.conf` 直接给 Loon 行不行**：**不行**。`bypass-system` / `tun-excluded-routes` / `ipv6-enabled` / `udp-policy-not-supported-behaviour` / `hijack-dns` / `encrypted-dns-server` / url-test 的 `policy-regex-filter=` 这些 Loon 全都不识别，配置会大面积沉默失效。**用本目录的 `loon-smart.conf`**（v5.2.4-Loon.2 已完整对齐 Loon 官方语法）。
- ❌ **想要 LightGBM**：Loon 不是 mihomo 内核，不支持。要就用桌面端 Clash Verge Rev / Mihomo Party。

---

## 🔌 协议支持（Loon 自家引擎）

Loon 的协议栈自己实现，**覆盖面比 Surge 宽、比 Shadowrocket 稍窄**，综合性价比不错：

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
| **AnyTLS / ShadowTLS** | ⚠️ | 部分版本支持，以官方更新日志为准 |
| **SOCKS5 / HTTP(S)** | ✅ | |

Loon 在 iOS 上的协议覆盖面仅次于 Shadowrocket，**比 Surge 多了 VLESS/REALITY/Hysteria 2/TUIC**。

### iOS 四大付费客户端协议对比（速决表）
| 协议 | SR (¥20) | **Loon (¥198)** | Surge (¥648) | QX (¥68) |
|---|:-:|:-:|:-:|:-:|
| Hysteria 2 | ✅ | **✅** | ⚠️ 5.9+ | ❌ |
| TUIC v5 | ✅ | **✅** | ❌ | ❌ |
| VLESS REALITY | ✅ | **✅** | ❌ | ⚠️ |
| XTLS-Vision | ✅ | **✅** | ❌ | ⚠️ |
| WireGuard | ✅ | **✅** | ✅ | ❌ |
| Snell v4 | ✅ | **✅** | ✅ | ❌ |
| 稳定性 | 普通 | **好** | 极好 | 好 |
| 插件生态 | ❌ | **✅** | ⚠️ Modules | ⚠️ Scripts |
| macOS 支持 | ✅ | ❌ | ✅ | ❌ |

**选 Loon 的场景**：协议要全 + 需要稳定 + 不差钱但不想买 Surge（¥648 太贵）+ 要插件生态（签到/去广告）。

---

## 一、下载 Loon

- **iOS**：App Store 搜「Loon」，价格约 ¥198 / 区。需要非中国区 Apple ID。
- 仅 iOS，**没有 macOS 版本**（这是 Loon 和 Surge 的主要区别）。
- 安装后首次启动授权 VPN 配置权限。

---

## 二、配置托管 & 导入

Loon 必须从 URL 安装配置（和 Surge 一样）：

1. 把 `loon-smart.conf` 托管到可访问 URL：
   - GitHub Raw：`https://raw.githubusercontent.com/<user>/<repo>/main/Loon/loon-smart.conf`
   - jsDelivr：`https://cdn.jsdelivr.net/gh/<user>/<repo>@main/Loon/loon-smart.conf`
   - 自建 HTTPS
2. 打开 Loon → 底部 **配置（Config）** 标签。
3. 右上角 **⊕** → 粘贴 URL → **下载**。
4. 点击新下载的配置 → **启用**。

首次启用时 Loon 会拉取 **250+ 个 RULE-SET**（blackmatrix7 Loon 版 `.list` 格式），根据网络情况约 **2–5 分钟**。**务必先开代理再下载**，否则 GitHub 访问不稳定会导致部分 RULE-SET 404。

---

## 三、机场订阅 / 节点

Loon 的节点来源：
1. 底部 **节点（Node）** → ⊕ → 粘贴机场订阅 URL → **下载**。
2. Loon 会按 `[Remote Filter]` 段里 9 条 NameRegex 自动把节点分到 9 个区域 Filter。
3. url-test 组（🌍 全球 / 🇭🇰 / 🇹🇼 / 🇯🇵 日韩 / 🌏 亚太 / 🇺🇸 / 🇪🇺 / 🌎 美洲 / 🌍 非洲）各自引用对应 Filter 名，组内自动选最低延迟节点。
4. 也可以在 `[Proxy]` 段直接粘贴本地节点（不推荐，手工维护麻烦）。

---

## 四、9 区域 × 28 业务组说明

- **9 区域组**：`url-test,<区域Filter>,url=...,interval=600,tolerance=50`
  - 区域 Filter 在 `[Remote Filter]` 段用 `NameRegex + FilterKey="..."` 定义
  - 测速间隔 **600s**，tolerance **50ms**（Loon 不支持 `timeout=` / `select=` 参数）
- **28 业务组**：select 手动选择，候选列表默认为所有区域组 + DIRECT

业务组语义映射与 Surge 版完全一致，参考 `Surge/README.md` 第五章。

> **与 Surge 版最大的结构差异**：Surge 用 url-test 内联 `policy-regex-filter="..."`，
> Loon 把 filter 拆成独立 `[Remote Filter]` 段并由 url-test 组通过 Filter 名引用。
> 这是 Loon 引擎层面的设计，不是本配置"特有"写法，所有 Loon 官方示例（YueChan / Loon0x00 / fmz200）均如此。

---

## 五、DNS 配置（Loon 原生语法，≠ Surge）

| Loon 字段 | 值 | 说明 |
|-----------|------|------|
| `dns-server` | `system, 223.5.5.5, 119.29.29.29` | ⚠️ Loon 的 `dns-server` **仅接受** `system` 与纯 IP，**不接受** DoH URL |
| `doh-server` | `doh.pub / alidns / 1.1.1.1 / 8.8.8.8` | DoH URL **必须**放这里，不能塞进 dns-server |
| `ipv6` | `true` | Loon 字段名是 `ipv6`，不是 `ipv6-enabled` |
| `udp-fallback-mode` | `REJECT` | Loon 对应 Surge 的 `udp-policy-not-supported-behaviour` |
| `disable-udp-ports` | `443` | 对应 Surge 的 `block-quic`（封 HTTP/3） |
| `bypass-tun` | 私有网段列表 | Loon 对应 Surge 的 `tun-excluded-routes`；Loon **没有** `bypass-system` |

**Loon 没有以下 Surge 字段**（v5.2.3 错误地用过，v5.2.4-Loon.2 已全部清除）：
- `bypass-system` / `tun-excluded-routes` / `ipv6-enabled` / `udp-policy-not-supported-behaviour` / `hijack-dns` / `encrypted-dns-server` / `encrypted-dns-follow-outbound-mode` / `block-quic` / `geoip-maxmind-url`

---

## 六、MMDB 数据库（配置文件自动下载，无需 UI 手动操作）

本配置在 `[General]` 里预设了：

```
geoip-url = https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb
```

Loon 启动时会自动下载这份 Loyalsoldier 加强版 MMDB（含 cloudflare / telegram / netflix / google 等精准标签），
`GEOIP,CN,🏠 国内网站` 以及其他 GEOIP 标签规则开箱即用。

> 早期版本的文档曾说 "Loon 不支持配置文件指定 MMDB"，那是误解。Loon 的 `geoip-url` 字段自 3.x 起一直可用，
> 在 YueChan/Loon `Default.Conf` 与 fmz200/wool_scripts `Loon.conf` 官方示例里均有使用。

如需回落到 UI 手动下载（例如想换其他 MMDB 源）：Loon → 设置 → GeoLite2 数据库 → 填 URL → 下载。

---

## 七、Loon 独有能力

| 能力 | Loon | Surge |
|---|---|---|
| `[Remote Rule]` 规则集独立管理面板 | ✅ 原生支持 | ❌ 无对应面板 |
| `[Plugin]` 插件系统（脚本 + 规则） | ✅ 支持 | ❌ 无 |
| `[Script]` JS 脚本（签到/响应改写） | ✅ 原生 | ✅ 原生 |
| `configuration-enhanced` 增强插件库 | ✅ 生态丰富 | ❌ Surge Modules 体系 |
| 在配置里设置 MMDB URL | ❌ 只能 UI 下载 | ✅ `geoip-maxmind-url` |
| macOS 版本 | ❌ 仅 iOS | ✅ Surge Mac |

**本配置里 RULE-SET 放在 `[Rule]` 段内**（Surge 兼容语法，Loon 原生支持），没有拆到 `[Remote Rule]` 面板——这样做的好处是和 Surge 版保持 1:1 可 diff，减少维护成本；代价是在 Loon 的「规则源」UI 里不会出现独立条目，要管理订阅更新仍可以，但无法逐个 RULE-SET 启用/禁用。如果你偏好 Loon 原生面板，可以自行把 `[Rule]` 段的 `RULE-SET,<URL>,<policy>` 行迁移到 `[Remote Rule]` 段，格式：
```
https://example.com/rule.list, policy=POLICY, tag=some-tag, enabled=true
```

---

## 八、与 Clash Party 主线的差异（Loon 引擎限制）

| 差异 | 原因 |
|------|------|
| ❌ 无 Mihomo Smart 组 / LightGBM | Loon 不是 Mihomo 核 |
| ❌ 无 TLS 指纹注入 | Loon 不暴露 uTLS 控制 |
| ❌ PROCESS-NAME | iOS 无进程 API |
| ❌ Clash classical `.yaml` RULE-SET | Loon 只支持 `.list` / `.conf` 纯文本；v5.2.4-Loon.2 已清理掉 72 条 Accademia YAML |
| ❌ Sukka `List/domainset/*.conf` | 该二级格式是 Surge 专属；Loon 用 `List/non_ip/*.conf` 代替 |
| ⚙️ GEOSITE → RULE-SET | Loon 只支持 RULE-SET + GEOIP（`geoip-url` 可自定义 MMDB） |
| ⚙️ Meta `.mrs` → blackmatrix7 Loon `.list` | 格式兼容性 |
| ⚙️ `policy-regex-filter=` → `[Remote Filter] NameRegex` | Loon 引擎的独立 filter 段 |

### 已接受的规则回归损失（v5.2.4-Loon.2）

以下 Accademia Clash classical 规则集没有 Loon `.list` 等价源，已随 72 条 YAML
一并移除；关键域名已补 DOMAIN-SUFFIX 兜底（见 [Rule] 段 Monzo / Bank×24 / RustDesk /
Parsec / Zoom / Pornhub / Wayback）：

- `Bank/Bank<国家>.yaml × 10`（各国本地银行细粒度，用 24 条 DOMAIN-SUFFIX 代替主流国际银行）
- `FakeLocation × 10`（国内 APP IP 归属地伪装）
- `GeoRouting × 17 区域`（ccTLD 细分）
- `HomeIP/HomeIP<JP|US>.yaml`、`eMuleServer`、`MacAppUpgrade`、`Fastly`、`Kwai`、
  `MicrosoftAPPs`、`AppleNews`、`Alipan/BaiduNetDisk/WeiYun`、`AqaraCN/AqaraGlobal`、
  `HijackingPlus/BlockHttpDNSPlus/PreRepairEasyPrivacy/UnsupportVPN`、
  `AppleAI/Grok/Gemini/Copilot`、`Signal`、`RustDesk/Parsec`、`Pornhub`、`WaybackMachine`

**需要完整的 Accademia 覆盖？** 请切到 CMFA / OpenClash / SingBox —— 这些平台原生支持 Clash classical YAML RULE-SET。

---

## 九、验证

1. Loon → **首页** → 应显示 `Loon Smart v5.2.4-Loon.2`，协议已启用。
2. **策略组** 面板应出现 37 组（9 区域 + 28 业务）。
3. **过滤器** 面板应出现 9 个 Filter（GLOBAL_Filter / HK_Filter / TW_Filter / JPKR_Filter / APAC_Filter / US_Filter / EU_Filter / AM_Filter / AF_Filter）。
4. 测试分流：
   - `chat.openai.com` → 🤖 AI 服务
   - `www.netflix.com` → 🇺🇸 美国流媒体（需 geoip-url 下载完成后精准命中；否则靠 RULE-SET）
   - `www.bilibili.com` → DIRECT / 📺 国内流媒体
   - `raw.githubusercontent.com` → 📟 开发者服务

---

## 十、常见问题

### Q1：我能直接导入 Surge 的 `surge-smart.conf` 到 Loon 吗？
- **不能**。Surge 的 `bypass-system` / `tun-excluded-routes` / `ipv6-enabled` / `udp-policy-not-supported-behaviour` / `hijack-dns` / `encrypted-dns-server` / `geoip-maxmind-url` 都不是 Loon 字段；url-test 内联 `policy-regex-filter=` / `select=0` / `timeout=5` Loon 也不认；Clash classical `.yaml` RULE-SET Loon 解析不了。本目录的 `loon-smart.conf` 已经完整对齐 Loon 官方语法。

### Q2：想要 Mihomo Smart + LightGBM 怎么办？
- Loon 做不到，需换客户端。iOS 上目前没有支持 JS 覆写 + LightGBM 的客户端；桌面端用 Clash Verge Rev / Mihomo Party。

### Q3：跨境场景切换？
参考 Surge 教程第十章「跨境场景」——操作完全一致。

### Q4：Loon 规则集更新周期怎么调？
- Loon → **设置** → **自动更新配置**。默认每次启动都会轮询。

### Q5：我想用 Loon 的插件（Plugin）生态？
- 本仓库的 `loon-smart.conf` 不依赖任何插件即可工作。你可以在 Loon 的「插件」面板额外叠加（例如去广告增强、签到脚本），不会冲突。

---

## 十一、致谢

- [Loon](https://apps.apple.com/app/loon/id1373567447)
- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) - Loon `.list` 规则源
- [Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip) - GeoIP MMDB
- Clash Party v5.2.4 主线基线
- [YueChan/Loon](https://github.com/YueChan/Loon) / [Loon0x00/LoonExampleConfig](https://github.com/Loon0x00/LoonExampleConfig) / [fmz200/wool_scripts](https://github.com/fmz200/wool_scripts) — 三份 Loon 官方/权威示例，v5.2.4-Loon.2 语法对齐的对照来源
