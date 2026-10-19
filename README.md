# 🚀 Smart-Config-Kit v6.0.20

**📥 [规则下载链接：直达各 APP 下载按钮](#-规则下载链接)**

> 以 `rulesets/source/routing-graph.js` 为唯一规则源，经 MRS → fused 编译为 14 种客户端配置，覆盖桌面、移动端和 OpenWrt。
>
> - 22 个区域组 + 33 个业务组；支持节点预检、inline payload 展平和[倍率筛选](./docs/subscription-node-filter.md)。
> - 分层 DoH 与[私有节点 DNS 适配](./docs/private-node-dns.md)；[测速/QUIC](./docs/traffic-options.md)可选，[ZeroTier UDP 代理](./docs/zerotier-planet-proxy.md)默认关闭。
> - 当前规模：525 源 providers / 984 rules → 149 fused providers / 168 主规则；107 MRS、78 SRS、81 个语义段。
> - [官方版本与缓存](./docs/upstream/2026-10-19/README.md)记录兼容门槛及未验收项；导入后仍需核对实际配置与流量。

<sub>💖 [支持本项目](./docs/donate.md) · ⭐ [Star](https://github.com/ivansolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues) · 🤖 [自动回复说明](./docs/ai-issue-responder.md)</sub>

---

## 📥 规则下载链接

点击对应按钮打开 `main` 的 Raw 文件；右键可复制链接，各端教程另有直链和导入步骤。

| APP / 客户端 | 原始文件下载 | 导入教程 |
| --- | --- | --- |
| Clash Party / Clash Verge Rev / Mihomo Party | [![下载规则：Smart JS](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Smart%20JS-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Clash%20Party/ClashParty%28mihomo-smart%29.js) [![下载规则：Normal JS](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Normal%20JS-0969da?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Clash%20Party/ClashParty%28mihomo%29.js) | [使用说明](./Clash%20Party/README.md) |
| CMFA / ClashMi | [![下载规则：CMFA YAML](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-CMFA%20YAML-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml) | [使用说明](./Clash%20Meta%20For%20Android/README.md) |
| Stash | [![下载规则：Stash YAML](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Stash%20YAML-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Stash/Stash.yaml) | [使用说明](./Stash/README.md) |
| OpenClash | [![下载规则：Smart SH](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Smart%20SH-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/OpenClash/OpenClash%28mihomo-smart%29.sh) [![下载规则：Normal SH](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Normal%20SH-0969da?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/OpenClash/OpenClash%28mihomo%29.sh) [![下载规则：UI CONF](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-UI%20CONF-0969da?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/OpenClash/OpenClash%28mihomo%29.conf) | [使用说明](./OpenClash/README.md) |
| Shadowrocket | [![下载规则：Shadowrocket CONF](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Shadowrocket%20CONF-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Shadowrocket/Shadowrocket.conf) | [使用说明](./Shadowrocket/README.md) |
| sing-box / Hiddify / HomeProxy | [![下载规则：sing-box JSON](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-sing--box%20JSON-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/SingBox/SingBox%28sing-box%29-full.json) | [使用说明](./SingBox/README.md) |
| v2rayN | [![下载规则：mihomo YAML](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-mihomo%20YAML-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml) [![下载规则：sing-box JSON](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-sing--box%20JSON-0969da?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/SingBox/SingBox%28sing-box%29-full.json) [![下载规则：Xray 路由 JSON](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Xray%20%E8%B7%AF%E7%94%B1%20JSON-0969da?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/v2rayN/v2rayN%28xray%29.json) | [使用说明](./v2rayN/README.md) |
| Surge | [![下载规则：Surge CONF](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Surge%20CONF-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Surge/Surge.conf) | [使用说明](./Surge/README.md) |
| Loon | [![下载规则：Loon CONF](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Loon%20CONF-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Loon/Loon.conf) | [使用说明](./Loon/README.md) |
| Quantumult X | [![下载规则：Quantumult X CONF](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Quantumult%20X%20CONF-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Quantumult%20X/QuantumultX.conf) | [使用说明](./Quantumult%20X/README.md) |
| Egern | [![下载规则：Egern YAML](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Egern%20YAML-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Egern/Egern.yaml) | [使用说明](./Egern/README.md) |
| Passwall | [![下载规则：Passwall SH](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Passwall%20SH-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Passwall/Passwall%28xray%2Bsing-box%29-apply.sh) | [使用说明](./Passwall/README.md) |
| Passwall2 | [![下载规则：Passwall2 SH](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Passwall2%20SH-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Passwall2/Passwall2%28xray%2Bsing-box%29-apply.sh) | [使用说明](./Passwall2/README.md) |
| FlClash | [![下载规则：FlClash JS](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-FlClash%20JS-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/FlClash/FlClash%28mihomo%29.js) [![下载规则：备选 CMFA YAML](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-%E5%A4%87%E9%80%89%20CMFA%20YAML-0969da?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml) | [使用说明](./FlClash/README.md) |

Clash Party / FlClash 的 JS 需要关联到节点订阅；Clash Verge Rev 默认使用 Normal JS；OpenClash 的 SH 按教程放到固定自定义脚本入口。Passwall / Passwall2 的 SRS 规则要求 sing-box 分流后端，脚本写入前会检查。v2rayN 的 Xray JSON 用于路由设置导入。

sing-box Full 要求 **1.14.3+**。仍绑定 1.13 的客户端可用[1.13 兼容配置](./SingBox/SingBox%28sing-box%29-1.13.json)，并按[导入边界](./SingBox/README.md)核对最终路由；Hiddify、HomeProxy 等 GUI 不能仅凭内核名称保证完整 JSON 原样生效。

---

## ✅ 该用哪个产物

| 使用场景 | 推荐入口 | 说明 |
|---|---|---|
| Clash Party / Mihomo Smart | `Clash Party/ClashParty(mihomo-smart).js` | Smart 内核 + LightGBM 择路；消费最终融合规则集 |
| Clash Party 普通内核 / FlClash | `Clash Party/ClashParty(mihomo).js` / `FlClash/FlClash(mihomo).js` | 同规则语义，区域组选 `url-test` |
| Android Mihomo | `Clash Meta For Android/CMFA(mihomo).yaml` | CMFA 是同步产物，不是规则基准 |
| Stash | `Stash/Stash.yaml` | 从 CMFA 自动裁剪生成，保持 Clash Premium 兼容 |
| sing-box / Hiddify / HomeProxy | `SingBox/SingBox(sing-box)-full.json` | 使用 `.srs` 融合规则集 |
| v2rayN Xray | `v2rayN/v2rayN(xray).json` | 从 78 个非空 fused sing-box SRS 资产展平成 98 项 Xray 路由规则 |
| iOS / macOS 其他客户端 | `Egern/`、`Shadowrocket/`、`Surge/`、`Loon/`、`Quantumult X/` | 按各 APP 原生语法同步 |
| OpenWrt | 优先 `OpenClash/`，Passwall / Passwall2 作为降级参考 | Passwall 系使用 78 条非空 fused `.srs` shunt rule |

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
| **📖 子目录** | [Clash Party](./Clash%20Party/) | [CMFA](./Clash%20Meta%20For%20Android/) | [Stash](./Stash/) | [OpenClash](./OpenClash/) | [Shadow<br>rocket](./Shadowrocket/) | [Surge](./Surge/) | [Loon](./Loon/) | [QX](./Quantumult%20X/) | [SingBox](./SingBox/) | [v2rayN](./v2rayN/) | [v2rayN](./v2rayN/) |

> ✅ 原生支持 · ⚠️ 部分 / 新版本才有 · ❌ 不支持
> ¹ 需 v2rayN 切到 mihomo 核心 · ² Surge iOS 5.8.0+ / Mac 5.4.0+ · ³ 需 vernesong Smart 分支 + JS 覆写，MetaCubeX Alpha 不等于 Smart · ⁴ Stash Wiki 当前 Snell 示例为 v3；v4 需以 App 实测为准 · ⁵ Surge iOS 5.17.0+ / Mac 6.4.3+ · ⁶ Loon 3.3.9+ · ⁷ QX 1.6.0+。官方证据与未验证项见[客户端能力复核](./docs/upstream/2026-10-19/apple/report.md)。

**🏷️ 缩写速查**：Clash Party = Clash Party / Clash Verge Rev / Mihomo Party · CMFA = Clash Meta For Android（含 [ClashMi](https://github.com/KaringX/clashmi)）· Stash = Clash Premium 兼容 iOS / macOS / tvOS 客户端 · FlClash = 跨平台 Flutter GUI · QX = Quantumult X · sing-box = SFA / SFM / SFI / Hiddify / Karing / HomeProxy · v2rayN Xray = v2rayN 默认核 · v2rayN mihomo = v2rayN 切 mihomo/sing-box 核

**📁 配置文件**：每个子目录的 `README.md` 内有完整说明，点击上方 📖 列进入。

**💡 选客户端**：常用协议（SS / VMess / Trojan）→ 按设备挑；VLESS + REALITY → Mihomo / sing-box / SR / Loon / v2rayN；Hysteria 2 / TUIC → 避开 Surge 旧版 / QX / Xray；想要 **LightGBM 自动择优** → 只能走 Clash Party / OpenClash + Smart Alpha 内核。

**🔌 软路由 / Apple 端**：ShellCrash（原 ShellClash，mihomo 模式）可用 CMFA YAML，但需检查启动后的覆写；HomeProxy 由 UCI 生成配置，尚未验证完整 JSON 导入；Stash / Egern 使用各自 YAML；Passwall / Passwall2 的 fused SRS fallback 仅适用于 sing-box 分流节点。Happ 的路由 Profile 与 v2rayN RuleObject 数组格式不同，不能直接导入本仓库 Xray JSON。详见[额外消费者核对](./docs/upstream/2026-10-19/consumers/report.md)与各端说明。

---

## 🧭 分流策略设计框架（重点）

```mermaid
---
config:
  flowchart:
    htmlLabels: true
    wrappingWidth: 800
---
flowchart TB
    A(["📡&nbsp;订阅节点池"])
    A --> B{{"节点清洗&nbsp;·&nbsp;命名识别&nbsp;·&nbsp;保留倍率节点&nbsp;+&nbsp;家宽识别"}}
    B --> C("🌍&nbsp;<b>区域层</b>&nbsp;Smart&nbsp;Region&nbsp;—&nbsp;按地区聚合&nbsp;+&nbsp;url-test&nbsp;/&nbsp;Smart&nbsp;自动择路")
    C --> D("🧱&nbsp;<b>业务层</b>&nbsp;Service&nbsp;Policy&nbsp;—&nbsp;AI&nbsp;/&nbsp;流媒体&nbsp;/&nbsp;社交&nbsp;/&nbsp;开发&nbsp;/&nbsp;CDN&nbsp;/&nbsp;广告&nbsp;按语义分组")
    D --> E("📚&nbsp;<b>规则层</b>&nbsp;Rule&nbsp;Provider&nbsp;—&nbsp;社区规则源拼装&nbsp;+&nbsp;按平台资源裁剪")
    E --> F("🔍&nbsp;<b>DNS·嗅探层</b>&nbsp;Resolver+Sniffer&nbsp;—&nbsp;分层&nbsp;DNS（国内/国外/回退）+&nbsp;嗅探协同")
    F --> G("🛟&nbsp;<b>兜底层</b>&nbsp;Fallback&nbsp;—&nbsp;GEOIP&nbsp;/&nbsp;GEOSITE&nbsp;/&nbsp;Private&nbsp;兜底")

    style A fill:#FFE9E9,stroke:#C0392B,stroke-width:2px,color:#000
    style B fill:#F5F5F5,stroke:#888,stroke-width:1px,color:#000
    style C fill:#FFF6E9,stroke:#F39C12,stroke-width:2px,color:#000
    style D fill:#EEF9F1,stroke:#27AE60,stroke-width:2px,color:#000
    style E fill:#EAF4FF,stroke:#4A90E2,stroke-width:2px,color:#000
    style F fill:#F3F0FF,stroke:#8E44AD,stroke-width:2px,color:#000
    style G fill:#FFEFF0,stroke:#E74C3C,stroke-width:2px,color:#000
```

节点、业务策略、规则和 DNS 分层维护，具体客户端差异以对应教程为准。

---

## 🧩 Smart 分流规则：33 业务组速览（含 14 流媒体平台组）

业务组关系与主要输入如下。

```mermaid
flowchart LR
    A(入口总控 2组) --> B(核心业务 10组)
    B --> C(区域选路 8组)
    C --> D(基础能力 5组)
    D --> E(兜底直连 3组)

    style A fill:#EAF4FF,stroke:#4A90E2,stroke-width:1px
    style B fill:#EEF9F1,stroke:#27AE60,stroke-width:1px
    style C fill:#FFF6E9,stroke:#F39C12,stroke-width:1px
    style D fill:#F3F0FF,stroke:#8E44AD,stroke-width:1px
    style E fill:#FFEFF0,stroke:#E74C3C,stroke-width:1px
```

### 🗂️ 代理组与主要 Rule-Providers 对照（source graph 输入）

> 表中仅列主要源图输入及来源，不是最终 provider 清单；编译器按策略、顺序和平台能力生成 `rulesets/generated/fused/**/scki-fused-*`。

编译保留同源语义、段内去重和原生 GEOIP；解析失败、非法残余或预算超限即停止。审计依据见[规则质量台账](./docs/rule-quality.md)。

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

> 最终配置消费 fused 产物；仅端口、逻辑组合、兜底及 DNS/geo 等必要规则保留内联。覆盖审查见[台账](./docs/GEOSITE_COVERAGE_LEDGER.md)。

| 类型 | 原生 geosite / geoip 的边界 | 本仓库的补法 | 典型例子 |
|---|---|---|---|
| **① 新兴服务** | 新 AI / Web3 / 开发工具上线后通常滞后收录 | `szkane-ai` / `vpsdance-ai-coding` / `acc-grok` / SCKI supplemental 进入 source graph，再编译成 fused | cursor.com · zed.dev · windsurf.com · openrouter.ai |
| **② 子类拆分** | `geosite:apple` / `geosite:google` 是粗分类，无法表达 AppStore 直连、Google 工作流代理等细分决策 | blackmatrix7 / Accademia / SCKI supplemental 拆成子服务输入，再按最终业务组融合 | Apple / Google / Microsoft 家族各子服务独立决策 |
| **③ 安全纵深** | `category-ads-all` 不能覆盖钓鱼、恶意软件、SDK 埋点、DNS 劫持等完整风险面 | anti-AD / Sukka / Hagezi / bm7 / Accademia 多源合并到 `🛑 广告拦截` fused 产物 | anti-AD + sukka-phishing + hagezi-tif |
| **④ 地区长尾** | 国际社区不稳定维护中国特有 SDK、港澳台细分、IoT / 支付 / 本土 CDN 长尾 | szkane / Accademia / SCKI supplemental 补齐后进入 fused 输出 | B 站港澳台版 · 绿米 IoT · 本土金融支付域名 |
| **⑤ 跨端一致性** | 不同客户端对 GEOSITE/GEOIP/ASN 支持差异大，直接散写会造成端间漂移 | 同一 source graph 编译为 `.mrs` / `.srs` / Apple 文本规则 / Egern YAML / Xray RuleObject / Passwall shunt | v2rayN Xray 与 Passwall 不再维护手写 33 组降级表 |

> **加法原则**：和原生 geosite >95% 重叠且没有顺序、平台或误伤收益 → 拒绝加入或删除；Geo 数据库保留为基础设施，普通分类沉淀到 fused 输出。

---

## 🛡️ DNS 净化

仓库区分 bootstrap、业务域名和节点域名解析，业务查询优先使用 DoH。

### 私有节点 DNS：受限适配边界

Clash Party、FlClash 和 OpenClash 覆写只投影**活动代理节点 FQDN**所需的 DNS 提示。默认 `adaptive`，本地可选 `off / policy / adaptive`，均不改变策略组、规则或业务 DNS 基线。fake-ip 仅继承缺省/`blacklist` 的合法豁免，不转换 `whitelist` 或规则模式列表。

CMFA、Stash、Egern、Apple 配置、sing-box、v2rayN Xray、Passwall / Passwall2 是静态或路由产物，不自动读取机场 DNS。IPv6 bootstrap、通配符物化、静态端 Mixin、验证方法和“不保证零泄漏”的边界见 [私有节点 DNS 指南](./docs/private-node-dns.md)；各端能力见[跨客户端能力矩阵](./docs/client-capability-matrix.md)。

**FlClash 用户：关联脚本后关闭应用层「DNS 覆写」和「追加系统 DNS」；Android 使用应用排除名单时关闭 VPN「系统代理」。** UI 二次覆盖与 VPN HTTP 代理可能破坏预期行为，完整设置和国内 APP 无法联网排查见 [FlClash 教程](./FlClash/README.md#应用层设置与-dns-所有权)。

**Clash Party v2.0.3+：** “已自动关闭 DNS 覆写”指客户端内置 `controlDns`；本仓库 JS 仍会写入 DNS。保持内置 DNS 覆写关闭，详见[教程](./Clash%20Party/README.md)。

### 本仓库的 DNS 四层分工

```mermaid
---
config:
  flowchart:
    htmlLabels: true
    wrappingWidth: 1000
    nodeSpacing: 50
    rankSpacing: 60
  themeVariables:
    fontSize: 18px
---
flowchart TB
    Start(["<b>🚀 客户端启动</b>"])

    L1["<b>① default-nameserver</b> &nbsp;·&nbsp; DoH-over-IP + 明文兜底 &nbsp;·&nbsp; 仅用于 bootstrap<br/><br/><b>https://223.5.5.5/dns-query &nbsp;·&nbsp; https://223.6.6.6/dns-query</b><br/><b>https://8.8.8.8/dns-query &nbsp;·&nbsp; https://1.1.1.1/dns-query </b><br/>启动时解析下方 DoH 服务的域名（dns.alidns.com 等）<br/>业务查询由 nameserver-policy / nameserver / fallback 接管"]

    Gate{{"<b>🔀 按域名性质分三路查询</b>"}}

    L2["<b>② nameserver-policy / nameserver</b> &nbsp;·&nbsp; 国内域名主通道 &nbsp;·&nbsp; DoH<br/><br/><b>geosite:cn</b> &nbsp;→&nbsp; AliDNS / DNSPod<br/><b>AliDNS</b> &nbsp; https://dns.alidns.com/dns-query<br/><b>DNSPod</b> &nbsp; https://doh.pub/dns-query<br/>大陆站点 / 国内 CDN 固定走国内 DoH"]

    L3["<b>③ proxy-server-nameserver</b> &nbsp;·&nbsp; 机场节点域名解析 &nbsp;·&nbsp; DoH<br/><br/><b>Cloudflare</b> &nbsp; https://cloudflare-dns.com/dns-query<br/><b>Google</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; https://dns.google/dns-query<br/><b>AliDNS</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; https://dns.alidns.com/dns-query<br/><b>DNSPod</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; https://doh.pub/dns-query<br/>解析 node.xxx-airport.com 走加密 DoH<br/>→&nbsp; ISP 可见性仍取决于 bootstrap、客户端与网络路径"]

    L4["<b>④ nameserver-policy / fallback</b> &nbsp;·&nbsp; 海外域名通道 &nbsp;·&nbsp; DoH + GeoIP 解毒<br/><br/><b>geosite:geolocation-!cn</b> &nbsp;→&nbsp; Cloudflare / Google<br/><b>Cloudflare</b> &nbsp; https://cloudflare-dns.com/dns-query<br/><b>Google</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; https://dns.google/dns-query<br/><b>fallback-filter.geoip-code: CN</b><br/>海外域名优先海外 DoH；污染结果再由 fallback-filter 兜底"]

    Start --> L1
    L1 ==>|"<b>bootstrap 成功后，所有业务查询全走加密 DoH</b>"| Gate
    Gate -->|"国内域名 / 国内 CDN"| L2
    Gate -->|"机场节点域名"| L3
    Gate -->|"海外域名"| L4
    L2 ~~~ L3
    L3 ~~~ L4

    style Start fill:#FFE9E9,stroke:#C0392B,stroke-width:3px,color:#000
    style L1 fill:#F5F5F5,stroke:#555,stroke-width:2px,color:#000
    style Gate fill:#FFF6E9,stroke:#F39C12,stroke-width:3px,color:#000
    style L2 fill:#EEF9F1,stroke:#27AE60,stroke-width:2px,color:#000
    style L3 fill:#EAF4FF,stroke:#4A90E2,stroke-width:2px,color:#000
    style L4 fill:#F3F0FF,stroke:#8E44AD,stroke-width:2px,color:#000
```

> 完整 YAML + 验证命令 + 各端 DNS 内置状态表，见 `Clash Party/README.md` 第四章；订阅私有节点 DNS 的受限投影和静态端边界见 [docs/private-node-dns.md](./docs/private-node-dns.md)。

---

## ✅ 导入后 60 秒验证清单

导入后检查节点、规则下载、命中和 DNS；此清单不能代替实际流量验收。

1. **节点与策略组存在**：Mihomo / Stash / Apple 系客户端应看到 22 区域组 + 33 业务组；sing-box Full 应看到 54 个出站；v2rayN Xray / Passwall 系没有业务策略组是正常限制。
2. **规则源下载完成**：Clash / OpenClash / CMFA / FlClash / Stash 里 `rule-providers` 不应有大面积 403 / 404；Surge / Loon / QX / Egern 看远程规则列表是否下载成功；sing-box 和 Passwall 系看 fused `.srs` 是否全部可用。
3. **广告误伤安全阀生效**：访问或规则测试 `paddle.com` 应命中 `🏦 金融支付`，`cloudflarestorage.com` 应命中 `🌐 国外网站`，都不是 `🛑 广告拦截`；小米账号/云服务域名应走 `DIRECT`。
4. **GEOSITE 基础命中正常**：`geosite:private` / 局域网应直连，`geosite:gfw` 应进入 `🚫 受限网站`，`geosite:category-ads-all` 应进入广告拦截。
5. **DNS 路径符合预期**：核对具体查询域名、解析器及出站；国内 DoH 是本仓库有意保留的路径，随机未分类域名也可能进入默认国内解析器。国家标签或 DoH 加密本身不证明“零泄漏”；排除 VPN 的 APP、浏览器安全 DNS 与 bootstrap 需分别检查。
6. **最终兜底可解释**：连接日志里落到 `🐟 漏网之鱼` 的域名要能解释；如果某个新服务长期落入 FINAL，再按 [GEOSITE 覆盖台账](./docs/GEOSITE_COVERAGE_LEDGER.md) 判断是否补 provider。
7. **地区命名归类正确**：按节点名或 tag 动态筛选的客户端中，yun hk01 / yun us01 / yun jp01 / yun sg01 / yun tw01 应进入对应地区组。sing-box Full、v2rayN Xray、Passwall / Passwall2 不从订阅节点名动态建组，属于架构限制而非匹配失败。

---

---

## 📦 多机场合并为一个订阅（Sub-Store）

多个机场需要共用一个活动节点池时，先用 Sub-Store 聚合，再导入单一 Profile；它独立于 14 类分流产物。

```text
机场 A / B / C 原生订阅 → Sub-Store 清洗、命名、去重 → 一条 Clash.Meta(mihomo) URL
→ FlClash / Clash Party 的单一 Profile → Smart-Config-Kit 统一节点分类与分流
```

FlClash 多 Profile 仅供切换；覆写只处理当前配置。聚合时保留来源标识并去重，不改规则/DNS；订阅 URL、token、密码和节点内容不得公开。

部署、脚本顺序、生成单一 URL、FlClash 导入和排障见 [Sub-Store 多机场聚合与部署教程](./SubStore/README.md)；脚本清单见 [SubStore/scripts](./SubStore/scripts/README.md)，FlClash 导入见 [FlClash 教程](./FlClash/README.md)。

机场重置订阅后，可用[浏览器同步助手](./SubStore/edge-extension/README.md)；首次允许站点并人工登录后自动匹配、验证和更新，覆盖范围及发布边界见扩展说明。

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

**🛠️ 工具**：[Sub-Store](https://github.com/sub-store-org/Sub-Store) / [PROCESS-NAME 兼容清单](./docs/process-name-compatibility.md) / [QX 脚本](https://github.com/KOP-XIAO/QuantumultX) / [Qure 图标](https://github.com/Koolson/Qure) / [domain-list-community](https://github.com/v2fly/domain-list-community)

**💳 闭源客户端**：[Shadowrocket](https://apps.apple.com/app/shadowrocket/id932747118) / [Stash](https://apps.apple.com/app/stash-rule-based-proxy/id1596063349) / [Surge](https://nssurge.com/) / [Loon](https://apps.apple.com/app/loon/id1373567447) / [Quantumult X](https://apps.apple.com/app/quantumult-x/id1443988620) / [Egern](https://egernapp.com/)

> 遗漏了你的项目？欢迎 [开 Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues) 指出——**所有真正做事的人都值得被点名**。

---

## 💖 支持本项目

→ [捐赠 / Star / PR](./docs/donate.md)

---

## 📄 免责声明

本仓库是一个**纯技术学习项目**——记录一套代理分流策略在不同客户端上的等价实现，帮助开发者理解各代理引擎的配置语法差异。仓库不提供任何节点、订阅或翻墙服务。

- 所有配置文件仅供**个人技术研究与学习**，请勿用于违反所在地法律法规的用途。
- 使用前请确认符合当地法律，风险自担。
- 本项目不鼓励也不协助任何形式的违规传播。

---

## 📄 License

默认采用 **MIT License**。第三方规则与数据资产遵循其各自许可证。
