# Clash Party / Clash Verge / Mihomo Party 使用教程

> 覆写脚本：**两份二选一**，规则 100% 等价，仅 9 个区域组的内核选路算法不同
> - `ClashParty(mihomo-smart).js`（**v5.2.5**，2026-04-20）— Smart 内核 + LightGBM ML 评估
> - `ClashParty(mihomo).js`（**v5.2.5-normal.1**，2026-04-22）— 普通内核 url-test 延迟选路
>
> UI 补充配置：已整合到本文「四、粘贴 UI 补充配置」章节
> 架构：**SUB-STORE 多机场融合** + 9 区域组 + 28 业务策略组 + **373+ rule-providers**
> 适用客户端：
> - **Mihomo Party**（桌面端，推荐，原生支持 JS 覆写；内置 Smart 内核）
> - **Clash Verge Rev**（桌面端，支持 JS/YAML 双覆写）
> - **Clash Nyanpasu**（桌面端）
> - 任何支持 Mihomo **JavaScript 覆写引擎**的客户端

---

## 📌 Smart 版 vs 普通版：怎么选？

同目录下两个脚本**规则、策略组、rule-providers、DNS/嗅探完全一致**，唯一区别在 9 个区域组内部如何从候选节点里挑一个具体出站：

| 维度 | `ClashParty(mihomo-smart).js`（Smart 版） | `ClashParty(mihomo).js`（普通版） |
|------|---------------------------------------|-------------------------------------|
| 区域组 `type` | `smart` | `url-test` |
| 选路算法 | **LightGBM ML 模型**（历史延迟 + 丢包 + 抖动 + 粘性会话综合评分） | 纯 **URL 延迟探测**（最低延迟胜出） |
| 额外字段 | `uselightgbm: true` / `collectdata: false` / `strategy: 'sticky-sessions'` | `url` / `interval` / `tolerance` / `lazy` |
| 内核要求 | **Mihomo Alpha / Smart 分支**（需 `Model.bin` 模型文件） | **Mihomo 稳定版 / Clash.Meta 任意近期版本** |
| 首次启动 | 需额外下载 `Model.bin`（~1.5MB） | 无额外依赖 |
| 选路"粘性" | ✅ sticky-sessions：同一连接/会话尽量保留在同一节点 | ❌ 每次 interval 到期可能切换到新最低延迟节点 |
| CPU 占用 | 略高（ML 推理） | 极低 |
| 适用场景 | 追求智能选路 / 混合机场 / 节点质量差异大 | 机场节点较稳定 / 路由器低 CPU / 不想依赖 Alpha 内核 |

**选择建议：**
- **有 Mihomo Party / Clash Verge Rev（Alpha 内核可用）** → 首选 **Smart 版**，体验最好
- **用的是稳定版 Clash.Meta / OpenClash 但又装不了 Alpha / 不想折腾 Model.bin** → 用**普通版**
- **低配路由器 / NAS 上跑代理** → 用**普通版**，省 CPU 省内存
- **想对照看两种选路的实际差异** → 先用 Smart 版跑一周，再换普通版跑一周，对比「连接」页的选路命中

> 重要提醒：两份脚本**永远同步更新**（规则源 / 代理组 / DNS 改动会同时应用到两份文件）；任何行为差异只由内核算法引起，不由规则差异引起。

---

## 🚀 零基础 5 分钟快速开始

> 第一次用？先看这段，看完按顺序做就能上网。

### 这是什么？
本仓库提供一份 **JS 覆写脚本**（可以理解为"配置模板"），你把它塞给 Clash Party/Verge Rev/Mihomo Party，它会在你每次启动客户端时**自动重写你的配置**，让节点按地区分组、按业务分流、自动选最优节点。你自己不用手动配 300+ 条规则。

### 我要准备什么？
1. **一个机场订阅 URL**。机场 = 代理服务商，你花几十块一个月订阅一家，他给你一个长长的 URL（`https://xxx.com/subscribe?token=yyy` 这种）。本仓库**不提供订阅**，只提供配置模板。
2. **本仓库里的 `ClashParty(mihomo-smart).js`**（或 `ClashParty(mihomo).js`，二选一，见本文开头的对比表）。
3. **三选一的客户端**：Mihomo Party / Clash Verge Rev / Clash Nyanpasu。**推荐 Mihomo Party**（不用你自己下载 mihomo 内核，开箱即用）。

### 术语速查（遇到不懂就回来翻）
- **订阅 / 机场**：服务商给你的那条 URL。
- **节点**：海外具体服务器（"美国洛杉矶-01"、"香港-02" 这样）。
- **代理组 / 策略组**：把一堆节点按地区或用途打包。例如 `🇺🇸 美国节点` = 所有美国节点的集合。
- **分流**：按规则自动决定每条流量走代理还是直连。访问国内站点直连更快，访问 Google 必须走代理。
- **Smart 组 + LightGBM**：Mihomo Smart 内核独有的"用机器学习自动选最优节点"功能。本仓库启用了它。
- **TUN 模式**：让整台电脑的所有流量都过代理（而不只是浏览器）。**建议开启**。

### 3 步走完
1. **下载客户端**（选一个，推荐 Mihomo Party）：
   - Mihomo Party：https://github.com/mihomo-party-org/mihomo-party/releases （找适合你系统的 `.exe` / `.dmg` / `.deb`）
   - Clash Verge Rev：https://github.com/clash-verge-rev/clash-verge-rev/releases
2. **导入订阅**：打开客户端 → 左侧「订阅」→ 输入机场给你的 URL → 保存。
3. **启用本仓库的覆写脚本**：详细在下面第三章「导入覆写脚本（核心步骤）」。本质就是：左侧「覆写/脚本」→ 新建 → 类型选 JavaScript → 粘贴**所选**的那份 `.js`（Smart 版或普通版）全文 → 保存 → 回到订阅页勾选启用这个脚本 → 点「连接」。**不要同时启用两份脚本**，它们会互相覆盖。

### 跑起来之后怎么验证成功？
- 浏览器打开 `https://www.google.com`，能打开说明代理通了。
- 客户端左侧「代理」页面应能看到 **37 个代理组**（9 区域 + 28 业务）。
- 左侧「连接」页面可以看每条请求走了哪个组/哪个节点。

### 最常见的第一次踩坑
- ❌ **订阅链接格式不对**：有些机场默认给的是 V2ray 格式。换链接时加 `?flag=clash.meta` 或 `?flag=meta` 后缀。
- ❌ **首次下载 rule-provider 卡住**：脚本会下载 373+ 条规则，约 15–30 MB。**必须在 WiFi 环境 + 已连接代理**（先连一个简单节点，再启动覆写），否则 GitHub/jsdelivr 在国内直连会 404。
- ❌ **LightGBM 模型没下载**（仅 Smart 版）：启动后若日志有 `Model.bin not found`，手动下 https://github.com/vernesong/mihomo/releases/download/LightGBM-Model/Model.bin 放到客户端的 mihomo 工作目录；或直接换成**普通版**脚本，不依赖 `Model.bin`。
- ❌ **Smart 版提示内核不支持 `type: smart`**：你用的不是 mihomo Alpha。要么换内核（Clash Verge Rev → 设置 → Clash 内核 → Mihomo Alpha），要么直接改用**普通版**脚本。
- ❌ **找不到业务组 / 区域组**：确认订阅返回的是 Mihomo / Clash.Meta 格式（不是 Surge / Quantumult）。

---

## 🔌 协议支持（Mihomo / Clash.Meta / Smart 内核）

Clash Party 系列（Mihomo Party / Clash Verge Rev / Clash Nyanpasu）底层都是 **Mihomo 内核**，支持的科学上网协议如下：

| 协议 | 支持 | 说明 |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | 全套 AEAD 密码 + **SS 2022 (blake3)** |
| **ShadowsocksR (SSR)** | ✅ | 旧协议，仍兼容 |
| **VMess** | ✅ | 含 ws / grpc / h2 / httpupgrade 传输层 |
| **VLESS** | ✅ | 含 **REALITY** + **XTLS-Vision** + XTLS-rprx-splice |
| **Trojan** | ✅ | 支持 Trojan-Go 扩展字段 |
| **Hysteria v1** | ✅ | QUIC-based，弱网友好 |
| **Hysteria 2** | ✅ | 当前最流行的抗审查 UDP 协议 |
| **TUIC v5** | ✅ | QUIC-based，含 v4 兼容 |
| **WireGuard** | ✅ | 作为出站，内核级别 |
| **AnyTLS** | ✅ | 新型 TLS 混淆（mihomo 1.18+） |
| **ShadowTLS v1/v2/v3** | ✅ | TLS 伪装层 |
| **Snell v4** | ✅ | Surge 自家协议，Mihomo 兼容 |
| **SSH** | ✅ | 作为出站隧道 |
| **Mieru** | ✅ | 新协议（mihomo Alpha） |
| **SOCKS5 / HTTP(S)** | ✅ | 基础兜底 |

**Mihomo 是目前协议支持最全面的开源内核**，几乎覆盖所有主流方案。付费的 Surge / Quantumult X 反而不如它全。

### 如何选协议？一句话建议
- **首选 VLESS + REALITY + XTLS-Vision**：目前抗审查最强、速度最快的组合
- **弱网 / 跨运营商 → Hysteria 2 或 TUIC v5**：UDP-based，QUIC 多路复用
- **老机场只给 SS / VMess → 照样能用**，别追新协议
- **机场给 Snell（通常是 Surge 机场）→ 也能跑**，但少见

---

## 一、安装客户端

### Mihomo Party（推荐）
- 开源地址：https://github.com/mihomo-party-org/mihomo-party/releases
- 支持 Windows / macOS (Intel + Apple Silicon) / Linux (deb/rpm/AppImage)
- 特性：**内置 Smart 内核**，默认开启 TUN，UI 中直接支持 JS 覆写。

### Clash Verge Rev
- 开源地址：https://github.com/clash-verge-rev/clash-verge-rev/releases
- 需要在「设置 → Clash 内核」中切换到 **Mihomo Alpha**（Smart 内核当前仍在 Alpha 分支）。

---

## 二、准备订阅

### 场景 A：单机场订阅
直接在客户端「订阅（Subscriptions / Profiles）」中添加机场链接即可，脚本会自动识别并分类节点。

### 场景 B：多机场融合（推荐，脚本原生针对此优化）
本脚本**针对 Sub-Store 环境做了大量优化**，强烈建议搭配使用：

1. 自建或使用公共 **Sub-Store**（https://github.com/sub-store-org/Sub-Store）。
2. 在 Sub-Store 中添加 2–N 个机场作为「单条订阅」。
3. 新建一个「**组合订阅**」或「**远程订阅**」，聚合所有机场。
4. 生成一个 **Clash (Mihomo)** 格式的订阅 URL。
5. 将该 URL 粘贴到客户端的订阅中。

脚本会自动为所有节点：
- 剔除信息类节点（导航/流量/到期/官网…）
- 剔除高倍率节点（10x/20x/100x）
- 按地区/城市/IATA 代码/ISO 代码**多维度分类**到 9 个区域组

---

## 三、导入覆写脚本（核心步骤）

### Mihomo Party

1. 左侧菜单 → **覆写（Override）** → 右上角 ➕。
2. 类型选择 **JavaScript（.js）**。
3. 名称：`Clash Smart v5.2.5` 或 `Clash Normal v5.2.5`（根据你粘贴的那份）。
4. 内容：复制 `Clash Party/ClashParty(mihomo-smart).js` **或** `Clash Party/ClashParty(mihomo).js` 的**全文**粘贴进去（两份脚本都在 2200+ 行左右）。
5. 保存。
6. 返回「订阅」页面，右键你的订阅 → **编辑** → **启用覆写** → 勾选刚才的脚本 → 保存（**只勾一份**，不要同时启用）。
7. 切换到该订阅，点击「**连接**」。

### Clash Verge Rev

1. 左侧 → **脚本（Scripts）** → ➕ **新建脚本** → **本地脚本**。
2. 粘贴 `.js` 全部内容，保存。
3. **订阅（Profiles）** → 右上角 ⋯ → **扩展管理（Extensions）** → 勾选刚才的脚本。
4. 重启内核（Ctrl/Cmd + R）。

---

## 四、粘贴 UI 补充配置

脚本主要处理 **proxies / proxy-groups / rules** 三大块，但不覆盖 **DNS / Sniffer / GeoX URL**（这些字段若写入 JS 会被机场订阅覆盖）。因此需要把下方内容粘贴到客户端的 **Mixin / 覆盖字段**：

### Mihomo Party
- **设置 → 覆写配置（Mixin）** → 粘贴本章「补充内容（完整可直接粘贴）」全部内容 → 保存。

### Clash Verge Rev
- **设置 → Clash 设置 → 内核 Mixin** 或「**Merge 文件**」中粘贴。

### 补充内容（完整可直接粘贴）

GeoX URL：

<img width="823" height="1032" alt="image" src="https://github.com/user-attachments/assets/51c8d844-3f66-4996-a271-6167db99f66a" />

```yaml
geox-url:
  geoip: https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/geoip.dat
  mmdb: https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb
  asn: https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb
  geosite: https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat
geo-auto-update: true
```

DNS：

<img width="811" height="698" alt="image" src="https://github.com/user-attachments/assets/c6ad3051-17c3-43e2-8dfa-e9721bd305f8" />
<img width="811" height="698" alt="image" src="https://github.com/user-attachments/assets/d2cbbbb3-ed2c-45d7-86cc-832edfbdb365" />


```yaml
dns:
  use-hosts: false
  use-system-hosts: false
  respect-rules: true
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
    - 1.1.1.1
    - 8.8.8.8
  nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  proxy-server-nameserver:
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  direct-nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  fallback:
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4
      - 0.0.0.0/32
      - 127.0.0.0/8
      - 10.0.0.0/8
      - 192.168.0.0/16
    domain: []
```

Sniffer：

<img width="811" height="698" alt="image" src="https://github.com/user-attachments/assets/76bb6490-3dee-43f5-a863-96bc99546b52" />


```yaml
sniffer:
  enable: true
  parse-pure-ip: true
  force-dns-mapping: true
  override-destination: true
  sniff:
    HTTP:
      ports:
        - "80"
        - 8080-8880
      override-destination: true
    TLS:
      ports:
        - "443"
        - "8443"
    QUIC:
      ports:
        - "443"
        - "8443"
        - "4433"
```

---

## 五、验证配置生效

连接成功后按以下步骤验证：

1. **代理组（Proxies）页面**
   - 应看到 **9 个区域组**（全球/香港/台湾/日韩/亚太/美国/欧洲/美洲/非洲），Smart 版显示为 `smart`，普通版显示为 `url-test`；
   - 每个区域组下方有对应地区的所有节点；
   - **28 个业务策略组**（AI 服务、加密货币、Netflix、Disney+、YouTube、Telegram 等）可正常选择。

2. **连接（Connections）页面**
   - 访问 `https://chat.openai.com`：Rule 应命中「🤖 AI 服务 → 🇺🇸 美国节点 → 某个 US 节点」；
   - 访问 `https://www.netflix.com`：Rule 应命中「Netflix → 🇺🇸 美国流媒体」；
   - 访问 `https://www.bilibili.com`：应命中「📺 国内流媒体 / DIRECT」。

3. **规则（Rules）页面**
   - 总规则数应 ≥ **963 条**；
   - `rule-providers` 数量 ≥ **373**。

4. **日志（Logs）页面**
   - 无 `parse error` / `list not found`；
   - 无大量 `DNS resolve failed`（若出现请检查 DNS 段粘贴）。

---

## 六、版本亮点（v5.2.2，2026-04-13）

- **FIX#17-P0**：`jsdelivr CDN` 永久直连
  - `RP_PROXY` 从「云与CDN」改为「受限网站（GFW）」组
  - 解决 04-06 单日 **4,931 条** jsdelivr 失败的 DNS 循环依赖问题
  - 在印尼选 `DIRECT`，在中国选代理，灵活切换
- **FIX#18-P1**：删除已死的 `ckrvxr` 规则源
  - 移除 AntiPCDN / AntiAntiFraud（累计 221 次 404）
- **FIX#19-P1**：`DST-PORT,7680,REJECT` 顺序修复
  - 提前到 `GEOIP,private` 之前，确保 Windows Delivery Optimization 流量被正确拦截
- **FIX#20-P2**：PI.ai 移入「🚫 受限网站（GFW）」组
- **FIX#20-P2**：`GSCService.exe` 加入 TUN `exclude-process`（避免 fake-ip 下 `ip.cip.cc` DNS 解析失败）
- **NOTE#2**：`BBC.yaml / Snap.yaml` 的 `USER-AGENT` warning 为无害提示，已由 `metaDomain('tiktok')` 独立覆盖

---

## 七、业务组推荐配置

建议首次导入后，按以下方式为每个业务组「指定首选」：

| 业务组 | 推荐上游 |
|--------|----------|
| 🤖 AI 服务 | 🇺🇸 美国节点（必须避开 HK / CN） |
| 💰 加密货币 | 🇭🇰 香港节点（币安合规） |
| 🏦 金融支付 | DIRECT |
| 📧 邮件服务 | 🇯🇵 日韩节点（Gmail 响应更快） |
| 💬 即时通讯 | 🇭🇰 香港 / 🇯🇵 日韩 |
| 📱 社交媒体 | 🇯🇵 日韩节点 |
| 🧑‍💼 会议协作 | 🇯🇵 日韩节点（延迟低） |
| 📺 国内流媒体 | DIRECT（境内）/ 🇭🇰 香港（境外） |
| 🇺🇸 美国流媒体 | 🇺🇸 美国节点 |
| 🇭🇰 香港流媒体 | 🇭🇰 香港节点 |
| 🇹🇼 台湾流媒体 | 🇹🇼 台湾节点 |
| 🎮 游戏平台 | 🇯🇵 日韩节点（Steam/PSN） |
| ☁️ 云与 CDN | 🌍 全球节点 |
| 🚫 受限网站（GFW） | 中国选代理 / 海外选 DIRECT |

---

## 八、常见问题

### Q1：启用脚本后节点为空 / 区域组为空？
- 确认订阅返回的是 **Mihomo / Clash.Meta** 格式（不是 Surge / Quantumult）。
- 确认机场节点名带有地区关键字（香港/HK/🇭🇰/hkg 至少其一）。
- 打开日志，查看是否有 `No node classified` 提示。

### Q2：首次连接特别慢？
- 首次需下载 **373+ rule-providers**，约 15–30 MB；
- 建议在 WiFi 环境下完成首次下载。

### Q3：如何升级到新版本？
- 将仓库里的 `.js` 文件更新，客户端会在下次刷新订阅时重新执行；
- 无需删除旧订阅或重新导入。

### Q4：能否同时启用多个覆写脚本？
- **不建议**。本脚本会完整重写 `proxy-groups` 与 `rules`，与其他脚本叠加可能导致冲突。

### Q5：LightGBM 模型未下载（仅 Smart 版）？
- 检查 `lgbm-custom-url` 字段是否被篡改；
- 确认客户端可访问 GitHub Release（可能需要代理）：
  ```
  https://github.com/vernesong/mihomo/releases/download/LightGBM-Model/Model.bin
  ```
- 或直接改用 **`ClashParty(mihomo).js`**，它用的是 url-test，不需要 LightGBM 模型。

### Q6：Smart 版与普通版可以切换吗？切换后订阅要不要重新导入？
- **可以任意切换**，两份脚本输出的 `proxy-groups / rules / rule-providers` 完全等价，客户端下次刷新订阅时自动重新生成。
- **不要同时启用两份脚本**（会互相覆盖，结果不可预期）。切换步骤：覆写列表里关掉旧的那份 → 勾选新的那份 → 刷新订阅。

---

## 九、目录一览

| 文件 | 用途 |
|------|------|
| `ClashParty(mihomo-smart).js` | **Smart 版**覆写脚本（区域组 `type: smart` + LightGBM），粘贴到客户端 JS 覆写区 |
| `ClashParty(mihomo).js` | **普通版**覆写脚本（区域组 `type: url-test`，不依赖 Alpha 内核），规则与 Smart 版等价 |
| `README.md`（本文第四章） | DNS / Sniffer / GeoX URL，粘贴到客户端 Mixin 区 |
| `CHANGELOG.md` | 变更历史（两份脚本共用，以 Clash Party 主版本号为准） |

---

## 十、致谢

- [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo) - Smart 内核
- [mihomo-party-org/mihomo-party](https://github.com/mihomo-party-org/mihomo-party) - 桌面客户端
- [clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev) - 桌面客户端
- [sub-store-org/Sub-Store](https://github.com/sub-store-org/Sub-Store) - 多机场融合工具
- 所有上游规则集维护者（bm7 / MetaCubeX / Loyalsoldier / blackmatrix7 等）
