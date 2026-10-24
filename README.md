# Smart-Config-Kit

![Smart-Config-Kit — 同一规则源，跨端一致分流](docs/assets/readme/hero.svg)

**[下载配置](#downloads)　/　[选择客户端](#clients)　/　[分流架构](#routing)　/　[DNS 设计](#dns)**

> 以 `rulesets/source/routing-graph.js` 为唯一规则源，经 MRS → fused 编译为 14 种既有客户端产物，并提供 Karing 原生适配入口，覆盖桌面、移动端和 OpenWrt。
>
> - 22 个区域组 + 33 个业务组；支持节点预检、inline payload 展平和[倍率筛选](docs/subscription-node-filter.md)。
> - 分层 DoH 与[私有节点 DNS 适配](docs/private-node-dns.md)；[测速/QUIC](docs/traffic-options.md)可选，[ZeroTier UDP 代理](docs/zerotier-planet-proxy.md)默认关闭。
> - 当前规模：525 源 providers / 984 rules → 149 fused providers / 168 主规则；107 MRS、78 SRS、81 个语义段。
> - [官方版本与缓存](docs/upstream/2026-10-19/README.md)记录兼容门槛及未验收项；导入后仍需核对实际配置与流量。

<sub>💖 [支持本项目](docs/donate.md) · ⭐ [Star](https://github.com/ivansolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues) · 🤖 [自动回复说明](docs/ai-issue-responder.md)</sub>

---

<a name="downloads"></a>

## 📥 规则下载链接

点击对应按钮打开 `main` 的 Raw 文件；右键可复制链接，各端教程另有直链和导入步骤。客户端配置已按内核系列归档，旧配置 Raw 地址随目录迁移而变化；已导入用户需重新导入。共享 `rulesets/` 规则资产 URL 保持不变。

### 按内核系列浏览

- [Mihomo 内核系](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/README.md)：Clash Party、Clash Meta For Android（CMFA）、OpenClash、FlClash
- [sing-box 内核系](Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/README.md)：SingBox、Karing
- [Xray 内核系](Xray%E5%86%85%E6%A0%B8%E7%B3%BB/README.md)：v2rayN Xray 路由
- [Passwall 双内核系](%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/README.md)：Passwall、Passwall2
- [独立客户端内核系列](%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/README.md)：Shadowrocket、Surge、Loon、Quantumult X、Stash、Egern（各自使用独立配置格式）

| 客户端 · 教程 | 下载配置 · Raw |
| --- | --- |
| **Clash Party / Clash Verge Rev / Mihomo Party**<br>[导入教程 ↗](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/README.md) | [![下载 Smart JS](docs/assets/readme/button-smart-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js) [![下载 Normal JS](docs/assets/readme/button-normal-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo%29.js) |
| **CMFA / ClashMi**<br>[导入教程 ↗](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/README.md) | [![下载 CMFA YAML](docs/assets/readme/button-cmfa-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml) |
| **Stash**<br>[导入教程 ↗](%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash/README.md) | [![下载 Stash YAML](docs/assets/readme/button-stash-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash/Stash.yaml) |
| **OpenClash**<br>[导入教程 ↗](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/README.md) | [![下载 Smart SH](docs/assets/readme/button-smart-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh) [![下载 Normal SH](docs/assets/readme/button-normal-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo%29.sh) [![下载 UI CONF](docs/assets/readme/button-ui-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo%29.conf) |
| **Shadowrocket**<br>[导入教程 ↗](%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/README.md) | [![下载 Shadowrocket CONF](docs/assets/readme/button-shadowrocket-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/Shadowrocket.conf) |
| **sing-box / Hiddify / HomeProxy**<br>[导入教程 ↗](Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/README.md) | [![下载 sing-box JSON](docs/assets/readme/button-sing-box-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json) |
| **Karing**<br>[导入教程 ↗](Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md) | [![下载 Karing 分流 JSON](docs/assets/readme/button-karing-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/diversion_rules_custom.json) |
| **v2rayN**<br>[导入教程 ↗](Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/README.md) | [![下载 mihomo YAML](docs/assets/readme/button-mihomo-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml) [![下载 sing-box JSON](docs/assets/readme/button-sing-box-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json) [![下载 Xray 路由 JSON](docs/assets/readme/button-xray-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/v2rayN%28xray%29.json) |
| **Surge**<br>[导入教程 ↗](%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/README.md) | [![下载 Surge CONF](docs/assets/readme/button-surge-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/Surge.conf) |
| **Loon**<br>[导入教程 ↗](%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/README.md) | [![下载 Loon CONF](docs/assets/readme/button-loon-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/Loon.conf) |
| **Quantumult X**<br>[导入教程 ↗](%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/README.md) | [![下载 Quantumult X CONF](docs/assets/readme/button-quantumult-x-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/QuantumultX.conf) |
| **Egern**<br>[导入教程 ↗](%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Egern/README.md) | [![下载 Egern YAML](docs/assets/readme/button-egern-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Egern/Egern.yaml) |
| **Passwall**<br>[导入教程 ↗](%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/README.md) | [![下载 Passwall SH](docs/assets/readme/button-passwall-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/Passwall%28xray%2Bsing-box%29-apply.sh) |
| **Passwall2**<br>[导入教程 ↗](%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/README.md) | [![下载 Passwall2 SH](docs/assets/readme/button-passwall2-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/Passwall2%28xray%2Bsing-box%29-apply.sh) |
| **FlClash**<br>[导入教程 ↗](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/README.md) | [![下载 FlClash JS](docs/assets/readme/button-flclash-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js) [![下载 备选 CMFA YAML](docs/assets/readme/button-cmfa-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml) |

> **Karing 导入**：在自定义分流组中导入专用 JSON；业务代理统一指向 `currentSelected`。节点组、DNS、TUN 和默认兜底在 App 内设置，详见 [Karing 教程](Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md)。

Clash Party / FlClash 的 JS 需要关联到节点订阅；Clash Verge Rev 默认使用 Normal JS；OpenClash 的 SH 按教程放到固定自定义脚本入口。Passwall / Passwall2 的 SRS 规则要求 sing-box 分流后端，脚本写入前会检查。v2rayN 的 Xray JSON 用于路由设置导入。

sing-box Full 要求 **1.14.3+**。仍绑定 1.13 的客户端可用[1.13 兼容配置](Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-1.13.json)，并按[导入边界](Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/README.md)核对最终路由；Hiddify、HomeProxy 等 GUI 不能仅凭内核名称保证完整 JSON 原样生效。

---

<a name="clients"></a>

## ✅ 该用哪个产物

| 使用场景 | 推荐入口 | 说明 |
|---|---|---|
| Clash Party / Mihomo Smart | `Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js` | Smart 内核 + LightGBM 择路；消费最终融合规则集 |
| Clash Party 普通内核 / FlClash | `Mihomo内核系/Clash Party/ClashParty(mihomo).js` / `Mihomo内核系/FlClash/FlClash(mihomo).js` | 同规则语义，区域组选 `url-test` |
| Android Mihomo | `Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml` | CMFA 是同步产物，不是规则基准 |
| Stash | `独立内核系/Stash/Stash.yaml` | 从 CMFA 自动裁剪生成，保持 Clash Premium 兼容 |
| Karing | [Karing 原生分流 JSON](Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md) | 按源顺序适配 direct / block / currentSelected；节点组、DNS 与默认动作在 App 中设置 |
| sing-box / Hiddify / HomeProxy | `Sing-box内核系/SingBox/SingBox(sing-box)-full.json` | 使用 `.srs` 融合规则集 |
| v2rayN Xray | `Xray内核系/v2rayN/v2rayN(xray).json` | 从 78 个非空 fused sing-box SRS 资产展平成 98 项 Xray 路由规则 |
| iOS / macOS 其他客户端 | `独立内核系/Egern/`、`独立内核系/Shadowrocket/`、`独立内核系/Surge/`、`独立内核系/Loon/`、`独立内核系/Quantumult X/` | 按各 APP 原生语法同步 |
| OpenWrt | 优先 `Mihomo内核系/OpenClash/`，Passwall / Passwall2 作为降级参考 | Passwall 系使用 78 条非空 fused `.srs` shunt rule |

### 🔌 各端协议支持 + 快速导入速查

一张表搞定："**机场给什么协议 → 选哪个端 → 去哪看教程**"。列名缩写 + 具体配置文件 → 见表下方。

| 协议 | Clash<br>Party | CMFA | Stash | Open<br>Clash | Shadow<br>rocket | Surge | Loon | QX | sing-<br>box | v2rayN<br>Xray | v2rayN<br>mihomo |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **SS (+ 2022)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **SSR** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅¹ |
| **VMess** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **VLESS** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| **REALITY + Vision** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| **Trojan** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Hysteria 1** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Hysteria 2** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅² | ✅ | ❌ | ✅ | ❌ | ✅ |
| **TUIC v5** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **WireGuard** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ⚠️ | ✅ |
| **AnyTLS** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅⁵ | ✅⁶ | ✅⁷ | ✅ | ❌ | ✅ |
| **ShadowTLS** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ✅ | ❌ | ✅ |
| **Snell v4** | ✅ | ✅ | ⚠️⁴ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅¹ |
| **Mieru** | ✅ | ✅ | ❌ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅¹ |
| **SSH 出站** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **HTTP / SOCKS5** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **LightGBM 自动择优** | ✅³ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **📖 子目录** | [Clash Party](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party) | [CMFA](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android) | [Stash](%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash) | [OpenClash](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash) | [Shadow<br>rocket](%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket) | [Surge](%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge) | [Loon](%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon) | [QX](%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X) | [SingBox](Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox) | [v2rayN](Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN) | [v2rayN](Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN) |

> ✅ 原生支持 · ⚠️ 部分 / 新版本才有 · ❌ 不支持
> ¹ 需 v2rayN 切到 mihomo 核心 · ² Surge iOS 5.8.0+ / Mac 5.4.0+ · ³ 需 vernesong Smart 分支 + JS 覆写，MetaCubeX Alpha 不等于 Smart · ⁴ Stash Wiki 当前 Snell 示例为 v3；v4 需以 App 实测为准 · ⁵ Surge iOS 5.17.0+ / Mac 6.4.3+ · ⁶ Loon 3.3.9+ · ⁷ QX 1.6.0+。官方证据与未验证项见[客户端能力复核](docs/upstream/2026-10-19/apple/report.md)。

**🏷️ 缩写速查**：Clash Party = Clash Party / Clash Verge Rev / Mihomo Party · CMFA = Clash Meta For Android（含 [ClashMi](https://github.com/KaringX/clashmi)）· Stash = Clash Premium 兼容 iOS / macOS / tvOS 客户端 · FlClash = 跨平台 Flutter GUI · QX = Quantumult X · sing-box = SFA / SFM / SFI / Hiddify / Karing / HomeProxy · v2rayN Xray = v2rayN 默认核 · v2rayN mihomo = v2rayN 切 mihomo/sing-box 核

**📁 配置文件**：每个子目录的 `README.md` 内有完整说明，点击上方 📖 列进入。

**💡 选客户端**：常用协议（SS / VMess / Trojan）→ 按设备挑；VLESS + REALITY → Mihomo / sing-box / SR / Loon / v2rayN；Hysteria 2 / TUIC → 避开 Surge 旧版 / QX / Xray；想要 **LightGBM 自动择优** → 只能走 Clash Party / OpenClash + Smart Alpha 内核。

**🔌 软路由 / Apple 端**：ShellCrash（原 ShellClash，mihomo 模式）可用 CMFA YAML，但需检查启动后的覆写；HomeProxy 由 UCI 生成配置，尚未验证完整 JSON 导入；Stash / Egern 使用各自 YAML；Passwall / Passwall2 的 fused SRS fallback 仅适用于 sing-box 分流节点。Happ 的路由 Profile 与 v2rayN RuleObject 数组格式不同，不能直接导入本仓库 Xray JSON。详见[额外消费者核对](docs/upstream/2026-10-19/consumers/report.md)与各端说明。

---

<a name="routing"></a>

## 🧭 分流策略设计框架（重点）

<picture>
  <source media="(max-width: 600px)" srcset="docs/assets/readme/routing-flow-mobile.svg">
  <img alt="分流架构：单一规则源编译为各客户端产物，策略与节点分层选择" src="docs/assets/readme/routing-flow.svg" width="1120">
</picture>

订阅节点先清洗、识别地区与家宽，再由区域层负责择路、业务层表达用途。`routing-graph.js` 按原顺序编译规则，各端消费对应原生格式；DNS、嗅探和最终兜底按平台能力设置。Smart / url-test、静态出站和 Karing 的导入边界以各端教程为准。

---

## 🧩 Smart 分流规则：33 业务组速览（含 14 流媒体平台组）

业务组负责选择用途，区域组负责选择出口；两层各自维护，规则按顺序命中。Karing 将业务代理适配为当前选择节点，不自动导入此嵌套组结构。

<picture>
  <source media="(max-width: 600px)" srcset="docs/assets/readme/policy-map-mobile.svg">
  <img alt="策略关系：33业务组选择区域或家宽，区域组选择实际节点" src="docs/assets/readme/policy-map.svg" width="1120">
</picture>

### 🗂️ 代理组与主要 Rule-Providers 对照（source graph 输入）

> 表中仅列主要源图输入及来源，不是最终 provider 清单；编译器按策略、顺序和平台能力生成 `rulesets/generated/fused/**/scki-fused-*`。

编译保留同源语义、段内去重和原生 GEOIP；解析失败、非法残余或预算超限即停止。审计依据见[规则质量台账](docs/rule-quality.md)。

| 代理组（最终目标） | source graph 主要输入（示例，非最终调用） | 主要来源仓库 / 来源类型 |
|---|---|---|
| 🤖 AI 服务 | `openai` `claude` `gemini` `copilot` `szkane-ai` `acc-copilot` `vpsdance-ai-coding` | MetaCubeX / blackmatrix7 / szkane / Accademia / VPSDance |
| 💰 加密货币 | `cryptocurrency` `binance` `szkane-web3` | blackmatrix7 / szkane |
| 🏦 金融支付 | `paypal` `stripe` `paddle.com` `visa` `tigerfintech` `acc-bank-*` `acc-vf-*` | blackmatrix7 / Accademia / SCKI supplemental / 本地误伤白名单 |
| 💬 即时通讯 | `telegram` `telegram-ip` `discord` `whatsapp` `line` `kakaotalk` `kakaotalk.com` `acc-signal` | MetaCubeX / blackmatrix7 / Accademia / SCKI supplemental |
| 📱 社交媒体 | `twitter` `twitter-ip` `tiktok` `facebook` `instagram` `snapchat` `reddit` | MetaCubeX / blackmatrix7 |
| 🧑‍💼 会议协作 | `zoom` `slack` `teams` `atlassian` `notion` `remotedesktop` `acc-rustdesk` `rustdesk.com` | ACL4SSR / blackmatrix7 / Accademia / SCKI supplemental |
| 📺 国内流媒体 | `bilibili` `iqiyi` `youku` `tencentvideo` `douyin` `zjcdn.com` `neteasemusic` | blackmatrix7 / SCKI supplemental / 本地前置守卫 |
| 🎵 TikTok | `tiktok` | MetaCubeX |
| 🎥 Netflix | `netflix` `netflix-ip` `szkane-netflixip` | MetaCubeX / szkane |
| 🎬 Disney+ | `disney` | blackmatrix7 |
| 📡 HBO/Max | `hbo` | blackmatrix7 |
| 📺 Hulu | `hulu` | blackmatrix7 |
| 🎬 Prime Video | `primevideo` `amazon` | blackmatrix7 |
| 📹 YouTube | `youtube` | MetaCubeX |
| 🎵 音乐流媒体 | `spotify` `tidal` `deezer` `soundcloud` `pandora` `lastfm` `qobuz` `overcast` | blackmatrix7 |
| 🇭🇰 香港流媒体 | `mytvsuper` `tvb` `nowe` `rthk` `szkane-bilihmt` | blackmatrix7 / szkane |
| 🇹🇼 台湾流媒体 | `bahamut` `kktv` `litv` `hamivideo` `linetv` `friday` | blackmatrix7 |
| 🇯🇵 日韩流媒体 | `abema` `dazn` `dmm` `tver` `niconico` `rakuten` | blackmatrix7 |
| 🇪🇺 欧洲流媒体 | `bbc` `itv` `all4` `my5` `skygo` `britboxuk` `szkane-uk` | MetaCubeX / blackmatrix7 / szkane |
| 🌐 其他国外流媒体 | `viu` `biliintl` `iqiyiintl` `wetv` `viki` `paramount` `peacock` `twitch` `vimeo` `dailymotion` `acc-kwai` | blackmatrix7 / Accademia |
| 🕹️ 国内游戏 | `mihoyo/yuanshen` `netease` `wegame` `steamcn` `majsoul` `battlenet.com.cn` | 本地前置 + blackmatrix7 / SCKI supplemental |
| 🎮 国外游戏 | `steam` `epic` `playstation` `xbox` `riot` `ea` `hoyoverse` | blackmatrix7（宽规则在国内游戏之后） |
| 🔍 Google 服务 | `google` `google-ip` `scholar`（Apple 端另含 `GoogleSearch` `GoogleDrive` `GoogleEarth`） | MetaCubeX / blackmatrix7 |
| 🔧 工具与服务 | `bing` `yandex` `github` `docker` `gitlab` `python` `developer` `szkane-developer` | blackmatrix7 / szkane |
| Ⓜ️ 微软服务 | `onedrive` `microsoft` `microsoftedge` `acc-microsoftapps` | blackmatrix7 / Accademia |
| 🍎 苹果服务 | `apple` `icloud` `appstore` `appletv` `applemusic` `acc-apple` `acc-applenews` | blackmatrix7 / Accademia |
| 📥 下载更新 | `googlefcm` `systemota` `download` `ubuntu` `mozilla` `android` `acc-macappupgrade` | blackmatrix7 / Accademia |
| 🛰️ BT/PT Tracker | `privatetracker` `acc-emuleserver` | blackmatrix7 / Accademia |
| 🏠 国内网站 | `amap` / `GaoDe` `cn` `cn-ip` `acc-chinamax` `acc-geo-d-asia-china` | MetaCubeX / blackmatrix7 / Accademia |
| 🚫 受限网站 | `loyalsoldier-gfw` `loyalsoldier-greatfire` `GEOSITE,gfw` `szkane-proxygfw` | Loyalsoldier / MetaCubeX / szkane |
| 🌐 国外网站 | `proxy` `cnn` `nytimes` `bloomberg` `ebay` `wikipedia` `acc-waybackmachine` `mail` `protonmail` `cloudflare` `fastly` `akamai` | blackmatrix7 / Accademia / szkane / MetaCubeX |
| 🐟 漏网之鱼 | `MATCH` / `FINAL`，以及平台原生兜底能力 | 内核兜底（非固定 provider） |
| 🛑 广告拦截 | `anti-ad` `sukka-phishing` `hagezi-tif` `advertising` `privacy` `GEOSITE,category-ads-all` `acc-unsupportvpn` | DustinWin / SukkaW / Hagezi / blackmatrix7 / MetaCubeX / Accademia |

最终编译输出按平台分发：

- Mihomo / CMFA / OpenClash / FlClash / Stash：`scki-fused-*-domain.mrs`、`scki-fused-*-ipcidr.mrs`、`scki-fused-*-residual.yaml`
- Shadowrocket / Surge / Loon / Quantumult X / Egern：`rulesets/generated/fused/<platform>/scki-fused-*`
- sing-box：`rulesets/generated/fused/sing-box/scki-fused-*.srs`；GUI 导入边界见对应教程
- v2rayN Xray：由 fused sing-box JSON 展平成 Xray `RuleObject`
- Passwall / Passwall2：78 条 `rule-set:remote` fused `.srs`，仅用于 sing-box 分流后端


---

## 🎯 差异化价值：source graph + fused compiler，而不是堆上游

> 最终配置消费 fused 产物；仅端口、逻辑组合、兜底及 DNS/geo 等必要规则保留内联。覆盖审查见[台账](docs/GEOSITE_COVERAGE_LEDGER.md)。

| 类型 | 原生 geosite / geoip 的边界 | 本仓库的补法 | 典型例子 |
|---|---|---|---|
| **① 新兴服务** | 新 AI / Web3 / 开发工具上线后通常滞后收录 | `szkane-ai` / `vpsdance-ai-coding` / `acc-grok` / SCKI supplemental 进入 source graph，再编译成 fused | cursor.com · zed.dev · windsurf.com · openrouter.ai |
| **② 子类拆分** | `geosite:apple` / `geosite:google` 是粗分类，无法表达 AppStore 直连、Google 工作流代理等细分决策 | blackmatrix7 / Accademia / SCKI supplemental 拆成子服务输入，再按最终业务组融合 | Apple / Google / Microsoft 家族各子服务独立决策 |
| **③ 安全纵深** | `category-ads-all` 不能覆盖钓鱼、恶意软件、SDK 埋点、DNS 劫持等完整风险面 | anti-AD / Sukka / Hagezi / bm7 / Accademia 多源合并到 `🛑 广告拦截` fused 产物 | anti-AD + sukka-phishing + hagezi-tif |
| **④ 地区长尾** | 国际社区不稳定维护中国特有 SDK、港澳台细分、IoT / 支付 / 本土 CDN 长尾 | szkane / Accademia / SCKI supplemental 补齐后进入 fused 输出 | B 站港澳台版 · 绿米 IoT · 本土金融支付域名 |
| **⑤ 跨端一致性** | 不同客户端对 GEOSITE/GEOIP/ASN 支持差异大，直接散写会造成端间漂移 | 同一 source graph 编译为 `.mrs` / `.srs` / Apple 文本规则 / Egern YAML / Xray RuleObject / Passwall shunt | v2rayN Xray 与 Passwall 不再维护手写 33 组降级表 |

> **加法原则**：和原生 geosite >95% 重叠且没有顺序、平台或误伤收益 → 拒绝加入或删除；Geo 数据库保留为基础设施，普通分类沉淀到 fused 输出。

---

<a name="dns"></a>

## 🛡️ DNS 净化

仓库区分 bootstrap、业务域名和节点域名解析，业务查询优先使用 DoH。

### 私有节点 DNS：受限适配边界

Clash Party、FlClash 和 OpenClash 覆写只投影**活动代理节点 FQDN**所需的 DNS 提示。默认 `adaptive`，本地可选 `off / policy / adaptive`，均不改变策略组、规则或业务 DNS 基线。fake-ip 仅继承缺省/`blacklist` 的合法豁免，不转换 `whitelist` 或规则模式列表。

CMFA、Stash、Egern、Apple 配置、sing-box、v2rayN Xray、Passwall / Passwall2 是静态或路由产物，不自动读取机场 DNS。IPv6 bootstrap、通配符物化、静态端 Mixin、验证方法和“不保证零泄漏”的边界见 [私有节点 DNS 指南](docs/private-node-dns.md)；各端能力见[跨客户端能力矩阵](docs/client-capability-matrix.md)。

**FlClash 用户：关联脚本后关闭应用层「DNS 覆写」和「追加系统 DNS」；Android 使用应用排除名单时关闭 VPN「系统代理」。** UI 二次覆盖与 VPN HTTP 代理可能破坏预期行为，完整设置和国内 APP 无法联网排查见 [FlClash 教程](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/README.md#应用层设置与-dns-所有权)。

**Clash Party v2.0.3+：** “已自动关闭 DNS 覆写”指客户端内置 `controlDns`；本仓库 JS 仍会写入 DNS。保持内置 DNS 覆写关闭，详见[教程](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/README.md)。

**微信下载：** `dldir1.qq.com` 已有精确下载分流；下载组的实际出口和 Windows 进程 DIRECT 优先级见 [Clash Party 排障 Q9](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/README.md#q9dldir1qqcom-是否已分流微信下载仍失败怎么排查)。

### 业务 DNS 策略来源与维护

业务域名 DNS policy 的唯一源数据是 `rulesets/source/business-dns-policy.json`，由 `routing-graph.getBusinessDnsPolicy()` 导出，编译器校验 provider、目标规则及 URL 后缀引用，再由同步器生成 Clash Party Smart/Normal、FlClash、CMFA 和 OpenClash Normal/Smart 六份投影。需要调整时先改源 JSON，并运行：

```bash
node tools/sync-business-dns-policy.js
node tools/sync-business-dns-policy.js --check
node --test tools/tests/business-dns-policy.test.js tools/tests/business-dns-sync.test.js
```

Stash 继续从 CMFA 生成器继承该 DNS policy。`routingReferences` 仅记录来源关联，不代表已证明远程规则集含有对应域名。Egern、SingBox 两个版本、Shadowrocket、Surge、Loon、Quantumult X 保留各自原生 DNS，不注入这份 Mihomo 业务表；v2rayN Xray 与 双内核系/Passwall/Passwall2 只交付路由/分流资产，不拥有 DNS 配置，不适用此 policy 投影。该变更不调整策略组结构或节点择路。

### 本仓库的 DNS 四层分工

<picture>
  <source media="(max-width: 600px)" srcset="docs/assets/readme/dns-flow-mobile.svg">
  <img alt="Mihomo DNS四层分工：bootstrap后区分国内、节点和海外域名" src="docs/assets/readme/dns-flow.svg" width="1120">
</picture>

此图展示 Mihomo 系配置。`default-nameserver` 仅负责启动解析，优先 DoH-over-IP，并保留明文兜底；业务由 `nameserver-policy`、`nameserver` 和 `fallback` 接管。国内使用 AliDNS / DNSPod；节点域名可用 Cloudflare、Google、AliDNS、DNSPod；海外优先 Cloudflare / Google，并由 `fallback-filter.geoip-code: CN` 辅助过滤。实际 ISP 可见性仍取决于 bootstrap、客户端与网络路径。

<details>
<summary>查看完整 DNS 解析器地址</summary>

| 用途 | 加密解析地址 |
| --- | --- |
| Bootstrap · DoH-over-IP | `https://223.5.5.5/dns-query` · `https://223.6.6.6/dns-query` · `https://8.8.8.8/dns-query` · `https://1.1.1.1/dns-query` |
| AliDNS | `https://dns.alidns.com/dns-query` |
| DNSPod | `https://doh.pub/dns-query` |
| Cloudflare | `https://cloudflare-dns.com/dns-query` |
| Google | `https://dns.google/dns-query` |

启动解析成功后，业务查询交给对应加密解析器；可用性和实际出站仍需查看客户端日志。

</details>

> 完整地址、YAML、验证命令及各端 DNS 状态表，见 [Clash Party 教程](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/README.md)；订阅私有节点 DNS 的受限投影和静态端边界见 [docs/private-node-dns.md](docs/private-node-dns.md)。

---

## ✅ 导入后 60 秒验证清单

导入后检查节点、规则下载、命中和 DNS；此清单不能代替实际流量验收。

1. **节点与策略组存在**：Mihomo / Stash / Apple 系客户端应看到 22 区域组 + 33 业务组；sing-box Full 应看到 54 个出站；v2rayN Xray / Passwall 系没有业务策略组是正常限制。
2. **规则源下载完成**：Clash / OpenClash / CMFA / FlClash / Stash 里 `rule-providers` 不应有大面积 403 / 404；Surge / Loon / QX / Egern 看远程规则列表是否下载成功；sing-box 和 Passwall 系看 fused `.srs` 是否全部可用。
3. **广告误伤安全阀生效**：访问或规则测试 `paddle.com` 应命中 `🏦 金融支付`，`cloudflarestorage.com` 应命中 `🌐 国外网站`，都不是 `🛑 广告拦截`；小米账号/云服务域名应走 `DIRECT`。
4. **GEOSITE 基础命中正常**：`geosite:private` / 局域网应直连，`geosite:gfw` 应进入 `🚫 受限网站`，`geosite:category-ads-all` 应进入广告拦截。
5. **DNS 路径符合预期**：核对具体查询域名、解析器及出站；国内 DoH 是本仓库有意保留的路径，随机未分类域名也可能进入默认国内解析器。国家标签或 DoH 加密本身不证明“零泄漏”；排除 VPN 的 APP、浏览器安全 DNS 与 bootstrap 需分别检查。
6. **最终兜底可解释**：连接日志里落到 `🐟 漏网之鱼` 的域名要能解释；如果某个新服务长期落入 FINAL，再按 [GEOSITE 覆盖台账](docs/GEOSITE_COVERAGE_LEDGER.md) 判断是否补 provider。
7. **地区命名归类正确**：按节点名或 tag 动态筛选的客户端中，yun hk01 / yun us01 / yun jp01 / yun sg01 / yun tw01 应进入对应地区组。sing-box Full、v2rayN Xray、Passwall / Passwall2 不从订阅节点名动态建组，属于架构限制而非匹配失败。

---

---

## 📦 多机场合并为一个订阅（Sub-Store）

多个机场需要共用一个活动节点池时，先用 Sub-Store 聚合，再导入单一 Profile；它独立于 14 种既有客户端产物与 Karing 适配。

```text
机场 A / B / C 原生订阅 → Sub-Store 清洗、命名、去重 → 一条 Clash.Meta(mihomo) URL
→ FlClash / Clash Party 的单一 Profile → Smart-Config-Kit 统一节点分类与分流
```

FlClash 多 Profile 仅供切换；覆写只处理当前配置。聚合时保留来源标识并去重，不改规则/DNS；订阅 URL、token、密码和节点内容不得公开。

部署、脚本顺序、生成单一 URL、FlClash 导入和排障见 [Sub-Store 多机场聚合与部署教程](SubStore/README.md)；脚本清单见 [SubStore/scripts](SubStore/scripts/README.md)，FlClash 导入见 [FlClash 教程](Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/README.md)。

机场重置订阅后，可用[浏览器同步助手](SubStore/edge-extension/README.md)；首次允许站点并人工登录后自动匹配、验证和更新，覆盖范围及发布边界见扩展说明。

---

## 📌 适用人群

- 想“一套配置跑多端”的用户；
- 不想手工维护大量策略组但又追求精细分流的用户；
- 希望借助 AI 持续优化配置工程质量的用户。

---

## 🙏 致谢

本仓库做**编排、覆写、适配**，真正的重活靠这些项目：

**🧠 内核**：[mihomo](https://github.com/MetaCubeX/mihomo) / [Smart Alpha](https://github.com/vernesong/mihomo) / [LightGBM](https://github.com/vernesong/mihomo/releases/download/LightGBM-Model/Model.bin) / [sing-box](https://github.com/SagerNet/sing-box) / [Xray](https://github.com/XTLS/Xray-core) / [hiddify-sing-box](https://github.com/hiddify/hiddify-sing-box)

**📱 客户端**：[mihomo-party](https://github.com/mihomo-party-org/mihomo-party) / [Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev) / [CMFA](https://github.com/MetaCubeX/ClashMetaForAndroid) / [Stash](https://stash.wiki/) / [FlClash](https://github.com/chen08209/FlClash) / [OpenClash](https://github.com/vernesong/OpenClash) / [HomeProxy](https://github.com/immortalwrt/homeproxy) / [ShellCrash](https://github.com/juewuy/ShellCrash) / [Passwall2](https://github.com/Openwrt-Passwall/openwrt-passwall2) / [v2rayN](https://github.com/2dust/v2rayN) / [Hiddify](https://github.com/hiddify/hiddify-app)

**📚 规则库**：[geosite](https://github.com/MetaCubeX/meta-rules-dat) / [geoip](https://github.com/Loyalsoldier/geoip) / [clash-rules](https://github.com/Loyalsoldier/clash-rules) / [v2ray-rules-dat](https://github.com/Loyalsoldier/v2ray-rules-dat)

**📦 规则集**：[bm7](https://github.com/blackmatrix7/ios_rule_script) / [Accademia](https://github.com/Accademia/Additional_Rule_For_Clash) / [DustinWin](https://github.com/DustinWin/ruleset_geodata) / [ACL4SSR](https://github.com/ACL4SSR/ACL4SSR) / [SukkaW](https://github.com/SukkaW/Surge) / [Hagezi](https://github.com/hagezi/dns-blocklists) / [MiHomo-Hagezi](https://github.com/MiHomoer/MiHomo-Hagezi) / [szkane](https://github.com/szkane/Rules) / [VPSDance AI Rules](https://github.com/VPSDance/ai-proxy-rules) / [anti-AD](https://github.com/privacy-protection-tools/anti-AD)

**🛠️ 工具**：[Sub-Store](https://github.com/sub-store-org/Sub-Store) / [PROCESS-NAME 兼容清单](docs/process-name-compatibility.md) / [QX 脚本](https://github.com/KOP-XIAO/QuantumultX) / [Qure 图标](https://github.com/Koolson/Qure) / [domain-list-community](https://github.com/v2fly/domain-list-community)

**💳 闭源客户端**：[Shadowrocket](https://apps.apple.com/app/shadowrocket/id932747118) / [Stash](https://apps.apple.com/app/stash-rule-based-proxy/id1596063349) / [Surge](https://nssurge.com/) / [Loon](https://apps.apple.com/app/loon/id1373567447) / [Quantumult X](https://apps.apple.com/app/quantumult-x/id1443988620) / [Egern](https://egernapp.com/)

> 遗漏了你的项目？欢迎 [开 Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues) 指出——**所有真正做事的人都值得被点名**。

---

## 💖 支持本项目

→ [捐赠 / Star / PR](docs/donate.md)

---

## 📄 免责声明

本仓库是一个**纯技术学习项目**——记录一套代理分流策略在不同客户端上的等价实现，帮助开发者理解各代理引擎的配置语法差异。仓库不提供任何节点、订阅或翻墙服务。

- 所有配置文件仅供**个人技术研究与学习**，请勿用于违反所在地法律法规的用途。
- 使用前请确认符合当地法律，风险自担。
- 本项目不鼓励也不协助任何形式的违规传播。

---

## 📄 License

默认采用 **MIT License**。第三方规则与数据资产遵循其各自许可证。
