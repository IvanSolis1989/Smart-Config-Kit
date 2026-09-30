# Clash Party / Clash Verge / Mihomo Party 使用教程

> 目录简介：这里是 Mihomo Smart/Normal 覆写脚本的事实基线，面向 Clash Party、Clash Verge Rev、Mihomo Party 等桌面客户端。
>
> 覆写脚本：**两份二选一**，规则 100% 等价，仅 22 区域组（11 全部 + 11 家宽）的内核选路算法不同
> - `ClashParty(mihomo-smart).js`（**v6.0.14-dns.10**，2026-09-30）— Smart 内核 + LightGBM ML 评估
> - `ClashParty(mihomo).js`（**v6.0.14-normal.11**，2026-09-30）— 普通内核 url-test 延迟选路
>
> UI 补充配置：已整合到本文「四、粘贴 UI 补充配置」章节
> 架构：**SUB-STORE 多机场融合** + 22 区域组（11 全部 + 11 家宽）+ 33 业务策略组 + **132 融合 rule-providers / 151 rules**（源 514 providers / 973 rules）
> 适用客户端：
> - **Mihomo Party**（桌面端，推荐，原生支持 JS 覆写；内置 Smart 内核）
> - **Clash Verge Rev**（桌面端，支持 JS/YAML 双覆写）
> - **Clash Nyanpasu**（桌面端）
> - 任何支持 Mihomo **JavaScript 覆写引擎**的客户端

> 私有节点 DNS：覆写默认采用 `adaptive` 受限投影；可用 `off / policy / adaptive` 三档控制订阅 DNS 的投影深度，不会改变 55 组、规则或全局业务 DNS。若你另行粘贴 DNS UI 配置，请合并而不要覆盖这些字段。完整边界与静态端示例见 [私有节点 DNS 指南](../docs/private-node-dns.md)。

> **Clash Party v2.0.3+ DNS 保护（Issue #183）**：客户端会在执行 JS 覆写前检查原始订阅是否包含 `proxy-server-nameserver`、`proxy-server-nameserver-policy` 或 `nameserver-policy`。如果客户端内置 DNS 控制处于开启状态，可能提示“检测到当前订阅包含自定义 DNS 配置，已自动关闭 DNS 覆写”。这只表示客户端的 `controlDns` 被保护逻辑关闭，不表示本脚本没有执行；本脚本随后仍会写入仓库 DNS 基线和受限节点 DNS。使用本仓库时请保持客户端内置 DNS 覆写关闭，不要把这条提示当作脚本加载失败。背景见 [Clash Party v2.0.3 发布说明](https://github.com/mihomo-party-org/clash-party/releases/tag/v2.0.3) 和 [DNS 覆写保护源码](https://github.com/mihomo-party-org/clash-party/blob/v2.0.3/src/main/core/dnsOverrideGuard.ts)。

> 节点命名兼容：yun hk01 / yun us01 / yun jp01 / yun sg01 / yun tw01 这类小写 ISO 两位码加编号可正常归类。仅此形式放宽大小写，普通文本中的 us / in 不会被误判为地区。

> 节点筛选：`SCKI_MAX_NODE_MULTIPLIER = null` 默认保留全部倍率。需要上限时在本地脚本设为正数；未知或有歧义的倍率保持原样。非空 `proxy-providers` 需先通过 Sub-Store 展平。预检拒绝时保留原始订阅，日志仅报告原因和计数。详见 [节点筛选指南](../docs/subscription-node-filter.md)。

<sub>💖 [支持本项目](../docs/donate.md) · ⭐ [Star](https://github.com/ivansolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues)</sub>

---

## 📌 Smart 版 vs 普通版：怎么选？

同目录下两个脚本**规则、策略组、rule-providers、DNS/嗅探完全一致**，唯一区别在 22 区域组（11 全部 + 11 家宽）内部如何从候选节点里挑一个具体出站：

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
- 客户端左侧「代理」页面最多会看到 **55 个代理组**（22 区域 + 33 业务；空区域会自动不建组）。
- 左侧「连接」页面可以看每条请求走了哪个组/哪个节点。
- 额外检查：按根 README 的 [导入后 60 秒验证清单](../README.md#-导入后-60-秒验证清单) 确认规则下载、GEOSITE 命中与 anti-ad 误伤白名单。

### 最常见的第一次踩坑
- ❌ **订阅链接格式不对**：有些机场默认给的是 V2ray 格式。换链接时加 `?flag=clash.meta` 或 `?flag=meta` 后缀。
- ❌ **首次下载 rule-provider 卡住**：脚本会下载融合后的规则源。**必须在 WiFi 环境 + 已连接代理**（先连一个简单节点，再启动覆写），否则 GitHub/jsdelivr 在国内直连会 404。
- ❌ **LightGBM 模型没下载**（仅 Smart 版）：启动后若日志有 `Model.bin not found`，手动下 https://github.com/vernesong/mihomo/releases/download/LightGBM-Model/Model.bin 放到客户端的 mihomo 工作目录；或直接换成**普通版**脚本，不依赖 `Model.bin`。
- ❌ **Smart 版提示内核不支持 `type: smart`**：你用的不是 mihomo Alpha。要么换内核（Clash Verge Rev → 设置 → Clash 内核 → Mihomo Alpha），要么直接改用**普通版**脚本。
- ❌ **找不到业务组 / 区域组**：确认订阅返回的是 Mihomo / Clash.Meta 格式（不是 Surge / Quantumult）。
- ❌ **RustDesk 仍然超时**：RustDesk 应命中 `🧑‍💼 会议协作`，不要让该组停在 `DIRECT`；DNS 段应采用本文第四章的 split-bootstrap / DoH 配置，并且 `fake-ip-filter` 应包含 `+.rustdesk.com` 真实 IP 回应。
- ❌ **WebRTC / STUN 测出代理出口或失败**：v5.4.13 后标准 STUN/TURN 端口 `3478 / 3479 / 5349 / 19302 / 19305 / 19307` 应直连；若服务强制走 UDP/443 TURN，仍会受 QUIC 屏蔽策略影响。
- ⚙️ **QUIC 精细化**：仅放行 YouTube/Google/微软/苹果 的 QUIC（UDP/443）走对应业务组，其余海外 QUIC 一律 `REJECT` 强制回退 HTTP/2（配合 `config.sniffer` 嗅探 SNI 做 GEOSITE 匹配）。**若某海外小众 App 必须用 QUIC 且无法回退 TCP 而断连**：在 `injectRules` 中删除/注释那 5 条 `AND,((DST-PORT,443),(NETWORK,UDP),...)` 规则即可恢复全量 QUIC 透传；只想恢复一部分则保留白名单豁免行、删掉末条 `...,(NOT,((GEOSITE,cn)))),REJECT` 即可。

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
- 按地区/城市/IATA 代码/ISO 代码**多维度分类**到 22 区域组（11 全部 + 11 家宽）

### 场景 C：在线订阅转换站（备选方案）

如果你同时买了多家机场，也可以用**在线订阅转换站**把多个链接合并成一个 URL，无需安装任何工具。

1. 打开 https://acl4ssr-sub.github.io （或 https://sub.v1.mk）
2. 把多家机场订阅链接粘贴进去（一行一个或用 `|` 分隔）
3. 后端选 **Mihomo（Clash.Meta）**
4. 生成新 URL → 填入客户端「订阅」输入框

> ⚠️ **隐私提醒**：转换站能看到你提交的订阅链接（含 token）。不要提交含专线 IP 等敏感信息的订阅链接。
>
> **Clash Party 的 Sub-Store 是内置方案**：Clash Party / Clash Verge Rev / Mihomo Party 原生集成了 Sub-Store 插件（方式 B），无需额外安装。**优先用场景 B（Sub-Store）**，转换站仅作为没有 Sub-Store 环境时的备选。

---

## 三、导入覆写脚本（核心步骤）

### Mihomo Party

1. 左侧菜单 → **覆写（Override）** → 右上角 ➕。
2. 类型选择 **JavaScript（.js）**。
3. 名称：`Clash Smart` 或 `Clash Normal`（根据你粘贴的那份）。
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

脚本会写入 **proxies / proxy-groups / rules / DNS** 主体配置；但不同 GUI 仍可能用 UI Mixin 覆盖 DNS / Sniffer / GeoX URL。为避免客户端侧覆盖掉当前 DNS 合同，建议把下方内容同步粘贴到客户端的 **外部数据、DNS、嗅探覆写中**：

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
hosts:
  dns.alidns.com: [223.5.5.5, 223.6.6.6]
  doh.pub: [119.29.29.29]
  dns.google: [8.8.8.8, 8.8.4.4]
  cloudflare-dns.com: [1.1.1.1, 1.0.0.1]

dns:
  use-hosts: true
  use-system-hosts: false
  respect-rules: true
  prefer-h3: false
  default-nameserver:
    - https://223.5.5.5/dns-query
    - https://223.6.6.6/dns-query
    - https://8.8.8.8/dns-query
    - https://1.1.1.1/dns-query
    - 223.5.5.5
  nameserver-policy:
    geosite:cn:
      - https://dns.alidns.com/dns-query
      - https://doh.pub/dns-query
    geosite:geolocation-!cn:
      - https://cloudflare-dns.com/dns-query
      - https://dns.google/dns-query
    '+.jsdelivr.net':
      - https://cloudflare-dns.com/dns-query
      - https://dns.google/dns-query
    '+.github.com':
      - https://cloudflare-dns.com/dns-query
      - https://dns.google/dns-query
    '+.githubusercontent.com':
      - https://cloudflare-dns.com/dns-query
      - https://dns.google/dns-query
    '+.githubassets.com':
      - https://cloudflare-dns.com/dns-query
      - https://dns.google/dns-query
    '+.fastly.net':
      - https://cloudflare-dns.com/dns-query
      - https://dns.google/dns-query
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
  direct-nameserver-follow-policy: true
  fallback:
    - https://cloudflare-dns.com/dns-query
    - https://dns.google/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN
    geosite:
      - gfw
      - geolocation-!cn
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
  skip-domain:
    - +.push.apple.com
  skip-dst-address:
    - 91.105.192.0/23
    - 91.108.4.0/22
    - 91.108.8.0/21
    - 91.108.16.0/21
    - 91.108.56.0/22
    - 95.161.64.0/20
    - 149.154.160.0/20
    - 185.76.151.0/24
    - 2001:67c:4e8::/48
    - 2001:b28:f23c::/47
    - 2001:b28:f23f::/48
    - 2a0a:f280:203::/48
```

---

## 五、验证配置生效

连接成功后按以下步骤验证：

1. **代理组（Proxies）页面**
   - 应看到 **22 区域组**（🌍 全球 / 🏡 全球家宽 / 🇭🇰 香港 / 🏡 香港家宽 / 🇹🇼 台湾 / 🏡 台湾家宽 / 🇸🇬 狮城 / 🏡 狮城家宽 / 🇯🇵 日韩 / 🏡 日韩家宽 / 🌏 亚太 / 🏡 亚太家宽 / 🇺🇸 美国 / 🏡 美国家宽 / 🇪🇺 欧洲 / 🏡 欧洲家宽 / 🌎 美洲 / 🏡 美洲家宽 / 🌍 非洲 / 🏡 非洲家宽 / 🌏 其他 / 🏡 其他家宽），Smart 版显示为 `smart`，普通版显示为 `url-test`；
   - 每个区域组下方有对应地区的所有节点；
   - **33 个业务策略组**（AI 服务、加密货币、TikTok、Netflix、Disney+、YouTube、Telegram 等）可正常选择。

2. **连接（Connections）页面**
   - 访问 `https://chat.openai.com`：Rule 应命中「🤖 AI 服务 → 🇺🇸 美国节点 → 某个 US 节点」；
   - 访问 `https://www.netflix.com`：Rule 应命中「Netflix → 🇺🇸 美国流媒体」；
   - 访问 `https://www.bilibili.com`：应命中「📺 国内流媒体 / DIRECT」。

3. **规则（Rules）页面**
   - 总规则数应 ≥ **1000 条**；
   - `rule-providers` 数量应为 **113**。

4. **日志（Logs）页面**
   - 无 `parse error` / `list not found`；
   - 无大量 `DNS resolve failed`（若出现请检查 DNS 段粘贴）。

---

## 六、业务组推荐配置

建议首次导入后，按以下方式为每个业务组「指定首选」：

| 业务组 | 推荐上游 |
|--------|----------|
| 🤖 AI 服务 | 🇺🇸 美国节点（必须避开 HK / CN） |
| 💰 加密货币 | 🇭🇰 香港节点（币安合规） |
| 🏦 金融支付 | DIRECT |
| 💬 即时通讯 | 🇭🇰 香港 / 🇯🇵 日韩 |
| 📱 社交媒体 | 🇯🇵 日韩节点 |
| 🧑‍💼 会议协作 | 🇯🇵 日韩节点（延迟低） |
| 📺 国内流媒体 | DIRECT（境内）/ 🇭🇰 香港（境外） |
| 🇺🇸 美国流媒体 | 🇺🇸 美国节点 |
| 🇭🇰 香港流媒体 | 🇭🇰 香港节点 |
| 🇹🇼 台湾流媒体 | 🇹🇼 台湾节点 |
| 🎮 游戏平台 | 🇯🇵 日韩节点（Steam/PSN） |
| 🔍 Google 服务 | 🌍 全球节点 |
| 🔧 工具与服务 | 🌍 全球节点 |
| 🚫 受限网站（GFW） | 中国选代理 / 海外选 DIRECT |

---

## 七、常见问题

### Q1：启用脚本后节点为空 / 区域组为空？
- 确认订阅返回的是 **Mihomo / Clash.Meta** 格式（不是 Surge / Quantumult）。
- 确认机场节点名带有地区关键字（香港/HK/🇭🇰/hkg 至少其一；hk01 这类小写地区码加编号也支持）。
- 打开日志，查看是否有 `No node classified` 提示。

### Q2：首次连接特别慢？
- 首次需下载 **113 个融合 rule-providers**（Mihomo 优先 `.mrs`），体积显著低于展开源规则；
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

### Q7：升级 Clash Party v2.0.3+ 后，每次启动都提示“自动关闭 DNS 覆写”怎么办？

这是客户端新增的**订阅 DNS 覆写保护**，不是本仓库脚本的 DNS 失败。v2.0.3 的主进程会先读取原始订阅中的三个受保护字段，再执行 JS 覆写；JS 无法在这一步之前改变客户端的 `controlDns` 判定。随后本仓库脚本仍会在 `main(config)` 中写入 `dns.enable`、`nameserver`、`proxy-server-nameserver`、`nameserver-policy`、`fake-ip-filter` 等仓库基线字段。

按下面顺序处理：

1. 保持本仓库 Smart / Normal JS 覆写启用；不要因为这条提示删除脚本。
2. 让 Clash Party 的**内置 DNS 覆写 / controlDns 保持关闭**。本仓库脚本已经拥有最终 DNS 配置权，客户端 UI 再覆盖一次反而会产生竞争。
3. 刷新订阅后查看最终配置或覆写日志，应能看到 `dns.enable: true`、仓库 DoH `nameserver` 和 `fake-ip-filter-mode: blacklist`；新版本脚本还会输出不含 DNS 地址值的 `Clash Party v2.0.3+ DNS guard detected source fields=...` 诊断行。
4. 若必须使用客户端内置 DNS 控制，先在原始订阅/订阅聚合层删除上述三个字段，再由客户端单独管理 DNS；不要从本仓库 JS 中删除 DNS 基线。客户端的判断顺序见 [Clash Party v2.0.3 工厂流程](https://github.com/mihomo-party-org/clash-party/blob/v2.0.3/src/main/core/factory.ts)。

如果关闭内置 DNS 覆写后最终配置仍没有上述字段，请在 Issue 中补充客户端完整版本、原始订阅 `dns:` 段（隐藏域名、IP、token）和覆写日志；不要直接公开订阅 URL 或节点密码。

---

## 八、目录一览

| 文件 | 用途 |
|------|------|
| `ClashParty(mihomo-smart).js` | **Smart 版**覆写脚本（区域组 `type: smart` + LightGBM），粘贴到客户端 JS 覆写区 |
| `ClashParty(mihomo).js` | **普通版**覆写脚本（区域组 `type: url-test`，不依赖 Alpha 内核），规则与 Smart 版等价 |
| `README.md`（本文第四章） | DNS / Sniffer / GeoX URL，粘贴到客户端 Mixin 区 |
| `CHANGELOG.md` | 变更历史（两份脚本共用，以 Clash Party 主版本号为准） |

---

## 九、致谢

- [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo) - Smart 内核
- [mihomo-party-org/mihomo-party](https://github.com/mihomo-party-org/mihomo-party) - 桌面客户端
- [clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev) - 桌面客户端
- [sub-store-org/Sub-Store](https://github.com/sub-store-org/Sub-Store) - 多机场融合工具
- 所有上游规则集维护者（bm7 / MetaCubeX / Loyalsoldier / blackmatrix7 等）

---

## 💖 支持本项目

→ [捐赠 / Star / PR](../docs/donate.md)
