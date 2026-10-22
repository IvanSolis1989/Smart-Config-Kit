# Clash Party / Clash Verge / Mihomo Party 使用教程

## 📥 规则下载链接

[![下载规则：Smart JS](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Smart%20JS-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Clash%20Party/ClashParty%28mihomo-smart%29.js)
[![下载规则：Normal JS](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Normal%20JS-0969da?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Clash%20Party/ClashParty%28mihomo%29.js)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**Smart JS 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Clash%20Party/ClashParty%28mihomo-smart%29.js
```

**Normal JS 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Clash%20Party/ClashParty%28mihomo%29.js
```

Smart 与 Normal 二选一，按所用内核选择；两者均为 JS 覆写脚本，按下文关联到节点订阅。

---

业务 DNS policy 来自 `../rulesets/source/business-dns-policy.json`；编辑源数据后运行 `node tools/sync-business-dns-policy.js`，用 `--check` 与两个 `business-dns-*.test.js` 测试核对六份投影。

本目录提供 Smart / Normal 两份 JS 覆写，二选一关联到节点订阅；规则与 DNS 相同，最多 22 区域组 + 33 业务组。版本与变更见 [CHANGELOG](./CHANGELOG.md)。

- **Smart**：需要 vernesong/mihomo Smart 内核与模型；MetaCubeX Alpha 不提供 Smart 组。
- **Normal**：适用于普通 Mihomo；Clash Verge Rev 官方发行版使用这一份。
- **节点筛选**：支持小写地区码加编号（如 hk01）；倍率筛选默认关闭。远程代理集合须先展开为节点，具名直连/拒绝出站仅保留拨号依赖。见[节点筛选指南](../docs/subscription-node-filter.md)。
- **私有节点 DNS**：默认 adaptive，只投影活动节点的 DNS 提示；UI 合并时保留精确 policy。见[私有节点 DNS](../docs/private-node-dns.md)。
- **可选功能与排错**：[测速/QUIC](../docs/traffic-options.md)、[默认关闭的 ZeroTier UDP 代理](../docs/zerotier-planet-proxy.md)、[规则下载](../docs/rule-asset-delivery.md)、[微信连接](../docs/research/2026-10-16-wechat-issue-187.md)。规则下载需能访问 GitHub Raw 或使用可用代理。

<sub>💖 [支持本项目](../docs/donate.md) · ⭐ [Star](https://github.com/ivansolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues)</sub>

---

## 📌 Smart 版 vs 普通版：怎么选？

同目录下两个脚本**规则、策略组、rule-providers、DNS/嗅探完全一致**，唯一区别在 22 区域组（11 全部 + 11 家宽）内部如何从候选节点里挑一个具体出站：

| 维度 | `ClashParty(mihomo-smart).js`（Smart 版） | `ClashParty(mihomo).js`（普通版） |
|------|---------------------------------------|-------------------------------------|
| 区域组 `type` | `smart` | `url-test` |
| 选路算法 | **LightGBM ML 模型**与 Smart 内核连接质量评分 | 纯 **URL 延迟探测**（最低延迟胜出） |
| 额外字段 | `uselightgbm: true` / `collectdata: false` | `url` / `interval` / `tolerance` / `lazy` |
| 内核要求 | **vernesong/mihomo Smart 分支**（需 `Model.bin` 模型文件） | **Mihomo 稳定版 / Clash.Meta 任意近期版本** |
| 首次启动 | 需额外下载 `Model.bin`（~1.5MB） | 无额外依赖 |
| 节点切换 | 由 Smart 内核的目标匹配、连接质量与重试机制决定 | 健康检查后可切换到延迟更低的节点 |
| CPU 占用 | 略高（ML 推理） | 极低 |
| 适用场景 | 追求智能选路 / 混合机场 / 节点质量差异大 | 机场节点较稳定 / 路由器低 CPU / 不想依赖 Alpha 内核 |

**选择建议：** 已安装 Smart 内核和模型时可选 Smart，否则用 Normal。两份脚本不要同时启用；脚本不设置会话粘性策略。字段与设备验证边界见[官方版本核对报告](../docs/upstream/2026-10-19/mihomo/report.md)。


---

## 🚀 零基础 5 分钟快速开始

按下面三步导入；已有订阅的用户可直接看第三章。

### 这是什么？

JS 覆写在订阅加载后重建节点分组、规则和 DNS；本仓库不提供代理节点。

### 我要准备什么？

1. 一个返回 Mihomo 格式的节点订阅 URL。
2. Smart 或 Normal JS 文件。
3. 支持 JS 覆写的客户端；安装入口见第一章。

### 术语速查（遇到不懂就回来翻）

- **订阅**提供节点，**代理组**选择节点，**规则**决定流量进入哪个组。
- **Smart + LightGBM**是 vernesong Smart 分支能力。
- **TUN**通过虚拟网卡接管流量，需客户端和系统权限支持。

### 3 步走完

1. 从第一章的官方入口安装客户端，按实际内核选择 Smart / Normal。
2. 客户端「订阅」中添加节点订阅 URL。
3. 按第三章创建 JS 覆写、关联到该订阅并启用；只关联一份。

### 跑起来之后怎么验证成功？

检查代理组和实际连接记录，再按第五章验证规则下载、DNS 与出站；网页能打开不能证明全部规则生效。

### 最常见的第一次踩坑

- **节点为空**：确认订阅返回 Mihomo 节点；不要把网页链接当作 Raw JS 或订阅地址。
- **规则下载失败**：先用可用节点建立网络，检查具体 HTTP 状态与 [规则下载说明](../docs/rule-asset-delivery.md)。
- **Smart 无法启动或模型缺失**：按第七章 Q5 检查，未安装 Smart 内核时使用 Normal。
- **RustDesk、STUN 或必须使用 QUIC 的应用异常**：检查连接记录和[测速/QUIC 选项](../docs/traffic-options.md)，不要直接删除规则。

---

## 🔌 协议支持（Mihomo / Clash.Meta / Smart 内核）

协议能力取决于客户端实际安装的 Mihomo 版本；下表用于选型，导入前仍需确认节点协议与核心兼容。

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

### 如何选协议？一句话建议

使用服务商提供且当前核心支持的协议；UDP 协议还需验证当前网络与所选节点的 UDP 回包。

---

## 一、安装客户端

### Clash Party（原 Mihomo Party）

- 开源地址：https://github.com/mihomo-party-org/clash-party/releases
- 支持 Windows / macOS (Intel + Apple Silicon) / Linux (deb/rpm/AppImage)
- 支持 stable / Alpha / Smart 内核与 JS 覆写；使用 Smart 脚本前在客户端确认选中 Smart 内核，并检查模型状态。

### Clash Verge Rev

- 开源地址：https://github.com/clash-verge-rev/clash-verge-rev/releases
- 官方发行构建下载 MetaCubeX/mihomo 的 stable / Alpha 内核，请使用本仓库**普通版**脚本。切换到 Alpha 不会获得 Smart 组；实际安装 vernesong/mihomo Smart 内核后，才可使用 Smart 版。依据见[官方构建源码](https://github.com/clash-verge-rev/clash-verge-rev/blob/4337bd85758d54d7b9044b2da3c9ac1176eae1f3/scripts/prebuild.mjs)。

---

## 二、准备订阅

### 场景 A：单机场订阅

直接在客户端「订阅（Subscriptions / Profiles）」中添加机场链接即可，脚本会自动识别并分类节点。

### 场景 B：多机场融合（推荐，脚本原生针对此优化）

需要把多个机场合成一个节点池时，可使用 [Sub-Store](../SubStore/README.md)：

1. 自建或使用公共 **Sub-Store**（https://github.com/sub-store-org/Sub-Store）。
2. 在 Sub-Store 中添加 2–N 个机场作为「单条订阅」。
3. 新建一个「**组合订阅**」或「**远程订阅**」，聚合所有机场。
4. 生成一个 **Clash (Mihomo)** 格式的订阅 URL。
5. 将该 URL 粘贴到客户端的订阅中。

输出地址必须能被客户端访问；127.0.0.1 只适用于同一设备。脚本会清理信息节点并分类，倍率筛选默认关闭。

### 场景 C：在线订阅转换站（备选方案）

在受信任的转换服务中输入多个订阅 URL，输出格式选 Mihomo，再把结果导入客户端。

转换服务能看到订阅 token；敏感订阅优先使用本地 Sub-Store。

---

## 三、导入覆写脚本（核心步骤）

### Mihomo Party

1. 「覆写」→ 新建 → 类型选 JavaScript，粘贴所选 JS 全文并保存。
2. 返回「订阅」→ 编辑 → 启用覆写，勾选该脚本并保存。
3. 切换到该订阅并连接；只启用 Smart / Normal 其中一份。

### Clash Verge Rev

1. 左侧 → **脚本（Scripts）** → ➕ **新建脚本** → **本地脚本**。
2. 粘贴 `.js` 全部内容，保存。
3. **订阅（Profiles）** → 右上角 ⋯ → **扩展管理（Extensions）** → 勾选刚才的脚本。
4. 重启内核（Ctrl/Cmd + R）。

---

## 四、粘贴 UI 补充配置

脚本已生成节点、组、规则、DNS 与嗅探。通常关闭客户端的二次 DNS 覆写即可；下方图片和 YAML 供手动核对使用。若使用 UI Mixin，须合并私有节点 policy，并检查最终配置，避免再次覆盖脚本。

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

1. **代理组**：最多 22 区域组 + 33 业务组；Smart 区域组为 smart，Normal 为 url-test；候选节点与区域相符。
2. **连接记录**：分别访问 AI、Netflix、国内流媒体，核对实际规则、业务组和出站。下表推荐值仅供选择，以实际组名和可用节点为准。
3. **规则**：当前基线为 168 条主规则、149 个融合 rule-providers；不要用未融合源规则数判断是否完整。
4. **日志与 DNS**：无解析错误或规则集加载失败；最终 DNS 包含脚本 DoH 与 blacklist 模式。完整清单见根 README 的[导入后验证](../README.md#-导入后-60-秒验证清单)。

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

- 首次需下载 **149 个融合 rule-providers**（Mihomo 优先 `.mrs`），体积显著低于展开源规则；
- 建议在 WiFi 环境下完成首次下载。

### Q3：如何升级到新版本？

- 将仓库里的 `.js` 文件更新，客户端会在下次刷新订阅时重新执行；
- 无需删除旧订阅或重新导入。

### Q4：能否同时启用多个覆写脚本？

- **不建议**。本脚本会完整重写 `proxy-groups` 与 `rules`，与其他脚本叠加可能导致冲突。

### Q5：LightGBM 模型未下载（仅 Smart 版）？

- 检查实际 Smart 内核与模型状态；若手动配置模型下载地址，当前字段为 `lgbm-url`（[官方配置源码](https://github.com/vernesong/mihomo/blob/83e67d0c4415b1114f9e01d8e9a00133caf89f6c/config/config.go)）；
- 确认客户端可访问 GitHub Release（可能需要代理）：
  ```
  https://github.com/vernesong/mihomo/releases/download/LightGBM-Model/Model.bin
  ```
- 或直接改用 **`ClashParty(mihomo).js`**，它用的是 url-test，不需要 LightGBM 模型。

### Q6：Smart 版与普通版可以切换吗？切换后订阅要不要重新导入？

- **可以任意切换**，两份脚本输出的 `proxy-groups / rules / rule-providers` 完全等价，客户端下次刷新订阅时自动重新生成。
- **不要同时启用两份脚本**（会互相覆盖，结果不可预期）。切换步骤：覆写列表里关掉旧的那份 → 勾选新的那份 → 刷新订阅。

### Q7：升级 Clash Party v2.0.3+ 后，每次启动都提示“自动关闭 DNS 覆写”怎么办？

这是客户端对原始订阅 DNS 的保护，不代表 JS 失败。保护先于 JS 执行；2.0.4 起可由客户端设置控制。官方顺序与版本边界见[核对报告](../docs/upstream/2026-10-19/mihomo/report.md)。

1. 保持本仓库 JS 启用，关闭客户端内置 DNS 覆写 / controlDns。
2. 刷新订阅，检查最终配置有 dns.enable、仓库 DoH 和 fake-ip-filter-mode: blacklist；同时保留私有节点的精确 policy。
3. 若必须由客户端管理 DNS，先在原始订阅/聚合层处理受保护字段，再核对最终结果。

仍异常时提供客户端版本、脱敏 DNS 配置和覆写日志；不要公开订阅 token 或节点密码。

### Q8：Windows 11 Microsoft Store 报网络错误，或页面有内容但图标为空？

先核对实际内核 TUN、系统代理及 Store 到本机代理的回环入口，再用失败图片的实际 URL 比较 `Ⓜ️ 微软服务` 组所选出站的 HTTP 结果。按包检查和添加回环豁免、图片 CDN 对照方法见 [Windows 11 Microsoft Store 排障](../docs/microsoft-store-windows.md)。

### Q9：`dldir1.qq.com` 是否已分流？微信下载仍失败怎么排查？

已收录精确域名规则，域名分流指向 `📥 下载更新`，不是广告拒绝。该组为手动选择组，候选以 `🌍 全球节点` 开头且包含 `DIRECT`；实际出口取决于你的组选择及客户端保存的选择。Windows 若识别到 `Weixin.exe`、`WeChat.exe` 或 `WeChatAppEx.exe`，更早的进程规则会先送到 `DIRECT`。因此“域名已收录”不等于所有连接都会经过下载组，也不等于默认直连。

1. 更新当前启用的 JS 覆写、刷新订阅与规则集并重载配置，确认连接记录中的实际域名、进程、命中规则和最终出口。
2. 若确实命中 `📥 下载更新` 且所选代理下载失败，可临时把该组切到 `DIRECT` 对比同一下载；这会同时影响该组的其他下载，复测后按需恢复原选择。若已命中进程 `DIRECT`，切换下载组不会改变该连接。
3. 仍失败时提供系统、客户端版本、失败时间及脱敏连接日志；HTTP 状态和域名有助于区分规则未更新、出口故障与服务端错误。

完整证据与静态验证边界见 [Issue #187 下载域名复核](../docs/research/2026-10-16-wechat-issue-187.md#2026-10-23-补充dldir1qqcom)。

---

## 八、目录一览

| 文件 | 用途 |
|------|------|
| `ClashParty(mihomo-smart).js` | **Smart 版**覆写脚本（区域组 `type: smart` + LightGBM），粘贴到客户端 JS 覆写区 |
| `ClashParty(mihomo).js` | **普通版**覆写脚本（区域组 `type: url-test`，不依赖 Alpha 内核），规则与 Smart 版等价 |
| `README.md`（本文第四章） | DNS / Sniffer / GeoX URL，粘贴到客户端 Mixin 区 |

---

## 九、致谢

- [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo) / [vernesong/mihomo](https://github.com/vernesong/mihomo) - Mihomo / Smart 内核
- [mihomo-party-org/mihomo-party](https://github.com/mihomo-party-org/mihomo-party) - 桌面客户端
- [clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev) - 桌面客户端
- [sub-store-org/Sub-Store](https://github.com/sub-store-org/Sub-Store) - 多机场融合工具
- 所有上游规则集维护者（bm7 / MetaCubeX / Loyalsoldier / blackmatrix7 等）

---

## 💖 支持本项目

→ [捐赠 / Star / PR](../docs/donate.md)
