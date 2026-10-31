# Proxy-override 借鉴设计方案（spec）

> 研究对象：https://github.com/Sgraqwq/Proxy-override
> 日期：2026-05-30 ｜ 状态：设计已定，待分批实现
> 决策人：仓库 owner ｜ 研究/设计：Claude Code

---

## 0. 背景

`Sgraqwq/Proxy-override` 是一个"极简零配置"分流仓库（3 文件、16 组、9 规则集，面向 Mihomo内核系/FlClash/Mihomo/Egern）。两轮深度研究后，其 80% 设计我们已具备且更强（区域分组、Smart/LightGBM、家宽细分、52 组、384 providers 全是我们的优势，**绝不退化**）。真正的"净增量"是 7 个借鉴点，owner 决定落地其中 6 个（#7 Egern 暂不做）。

---

## 1. 借鉴点清单与决策

| # | 借鉴点 | 价值 | 风险 | 落地决策 |
|---|------|:---:|:---:|------|
| #2 | 国内 SDK/CDN 直连前置 | ⭐⭐⭐ | 🟢低 | ✅ 做 |
| #3 | fake-ip-filter 补全（远控/游戏/P2P） | ⭐⭐ | 🟢低 | ✅ 做 |
| #5 | `direct-nameserver-follow-policy: true` | ⭐ | 🟢低 | ✅ 做（先查文档）|
| #6 | 节点过滤关键词补充 | ⭐ | 🟡中 | ✅ 做 |
| #4 | DoH-over-IP 加密 bootstrap | ⭐⭐ | 🟡中 | ✅ 做（先研究透）|
| #1 | QUIC 精细化（白名单豁免+拒绝） | ⭐⭐⭐ | 🟡中 | ✅ 做（最后）|
| #7 | Egern 客户端支持 | ⭐ | 🔴高 | ❌ 暂不做 |

**实施顺序（owner 指定，易→难）**：#2 → #3 → #5 → #6 → **#4** → **#1**

---

## 2. 各项详细设计

### #2 国内 SDK/CDN 直连前置（批 A）
**改法**：在「🏠 国内网站」段或新增「国内直连前置」段，加 DIRECT 规则：
```
DOMAIN,msg.umeng.com,DIRECT        # 友盟（阿里，国内）
DOMAIN-SUFFIX,jpush.cn,DIRECT       # 极光推送（国内）
DOMAIN-SUFFIX,jpush.io,DIRECT
DOMAIN-SUFFIX,baomitu.com,DIRECT    # 360 前端 CDN
DOMAIN-SUFFIX,bootcss.com,DIRECT    # BootCDN
DOMAIN-SUFFIX,staticfile.org,DIRECT # 七牛 CDN
DOMAIN-SUFFIX,upaiyun.com,DIRECT    # 又拍云
```
**甄别**：`adjust.com`/`appsflyer.com` 是海外归因 SDK，**不加**（避免把海外流量误判直连）。
**产物范围**：全 12 产物（各自规则语法）。
**现状**：主线仅 2 处命中（baomitu/bootcss/staticfile/upaiyun 全 0）。
**风险**：低。需确认不与现有规则冲突（放在 RULE-SET,cn 之前）。

### #3 fake-ip-filter 补全（批 A）
**改法**：给 fake-ip-filter 增补（这些需真实 IP 才能打洞/直连）：
```
+.todesk.com  +.oray.com  +.sunlogin.com  +.teamviewer.com  +.anydesk.com   # 远控
+.battlenet.com.cn  +.wotgame.cn  +.wggames.cn  +.wowsgame.cn               # 游戏
+.mcdn.bilivideo.cn                                                          # B站P2P
```
**产物范围**：mihomo 家族（Clash Party/CMFA/OpenClash×2/FlClash）+ SingBox（有 fake-ip 的）。
**现状**：主线/OpenClash 远控仅 2 个，游戏 CDN/P2P = 0。
**风险**：极低，纯增量。

### #5 direct-nameserver-follow-policy（批 A）
**改法**：DNS 块加 `direct-nameserver-follow-policy: true`（让 direct-nameserver 也遵守 nameserver-policy）。
**产物范围**：mihomo 家族。
**前置**：⚠️ 先 WebFetch 官方文档确认该字段语义 + 最低版本（§2.4），本地 REFERENCE 未收录。
**风险**：低。

### #6 节点过滤关键词补充（批 B）
**改法**：INFO_PATTERNS / 各产物 exclude 增补：`免费 | 试用 | 应急 | Sign | Login | Register | Help | FAQ`。
**不加**：`更新`（误伤"更新节点"）、`地址`（误伤）——Proxy-override 有但对我们风险高。
**产物范围**：§1.5 全产物同构（JS REGION_DB/INFO_PATTERNS + CMFA filter + OpenClash Ruby + SR/独立内核系/Surge/Loon/QX exclude）。
**风险**：中。可能误伤含 Login/Sign 的合法节点名（罕见）。**需写回归测试**（仿 test-kr-boundary.js）。

### #4 DoH-over-IP 加密 bootstrap（批 D，先研究透）
**owner 指定方案**：`default-nameserver`/bootstrap 切换为 DoH-over-IP：
```
https://223.5.5.5/dns-query
https://223.6.6.6/dns-query
https://8.8.8.8/dns-query
https://1.1.1.1/dns-query
```
**为何 DoH-over-IP 而非 Proxy-override 的 DoT**：443 端口几乎不被封（853 易被封）、流量混在 HTTPS 更隐蔽、多上游冗余（阿里×2 国内低延迟 + Google/CF 国外兜底）。
**官方依据**：mihomo `default-nameserver` = "必须为 IP，**可为加密 DNS**"（host 须 IP，scheme 可 https://）。已更新两份 REFERENCE-mihomo-wiki.md。

**#4 全产物可行性表**：

| 产物 | 明文 bootstrap 字段 | 能否 DoH-over-IP | 结论 |
|------|------|:---:|------|
| Clash Party / CMFA / OpenClash×2 / FlClash | `default-nameserver` 纯 IP | ✅ 接受 https://IP/dns-query | **全加密可做** |
| Surge | `dns-server`（可 DoH）/ `encrypted-dns-server` | ✅ encrypted-dns-server 用 https://IP | **全加密可做** |
| Loon | `dns-server` 仅 system+纯 IP | ⚠️ doh-server/doh3-server 可 IP，但 dns-server 不能加密 | **DoH 服务器用 IP + 保留明文兜底** |
| Quantumult X | `server=` 仅纯 IP，`doh-server=` 仅第一条生效 | ⚠️ 同 Loon | **同 Loon** |
| SingBox | DNS server + address_resolver | ⚠️ 支持 HTTPS server，**实现时需核对 generator.js + sing-box 1.11/1.12 语法差异** | **待核对** |
| v2rayN(xray) / Passwall×2 | 取决于核心 | ⚠️ 待核对 | **待核对** |

**保留明文兜底**：建议 `default-nameserver` 混合 = DoH-over-IP 优先 + 1 个明文 IP 兜底（防 443 也被劫持/首包失败时不至断网）。需验证 mihomo 是并发还是顺序查询（影响兜底语义）。
**待办**：WebFetch 核对 ① sing-box /configuration/dns/server/https/ ② v2rayN(xray) dns ③ Passwall。

### #1 QUIC 精细化（批 C，最后）
**改法**：在广告拦截后、业务前插入 QUIC 层（mihomo 语法）：
```
AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,youtube)),📹 YouTube
AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,google)),🔧 工具与服务
AND,((DST-PORT,443),(NETWORK,UDP),(RULE-SET,microsoft)),Ⓜ️ 微软服务
AND,((DST-PORT,443),(NETWORK,UDP),(RULE-SET,apple)),🍎 苹果服务
AND,((DST-PORT,443),(NETWORK,UDP),(NOT,((GEOSITE,cn)))),REJECT
```
**协同点**：依赖我们现有 QUIC sniffer（159-163 行嗅 SNI）才能 GEOSITE 匹配——两者**配合**，不冲突。
**产物适配**：mihomo 家族用 AND/NOT；Surge/Loon 用 `AND,((...),(...))`；QX 用 `[filter] ...`；SingBox 用 route.rules network/port 逻辑；SR 需确认 AND 支持。
**trade-off**：会影响非豁免的国外 UDP 应用（部分游戏/WebRTC）。**默认开 + README 说明如何关**。
**风险**：中。需逐产物验证 AND/NOT 语法 + sniffer 协同。

---

## 3. 实施批次计划（每批一个 PR，独立 §1 联动 + §5 自检 + 版本/CHANGELOG）

| 批 | 内容 | 风险 | 前置 |
|---|------|:---:|------|
| **A** | #2 + #3 + #5 | 🟢低 | #5 先查 follow-policy 文档 |
| **B** | #6 过滤关键词 | 🟡中 | 写回归测试 |
| **C** | #1 QUIC 精细化 | 🟡中 | 逐产物核对 AND/NOT 语法 |
| **D** | #4 DoH-over-IP bootstrap | 🟡中 | 先核对 sing-box/Xray内核系/v2rayN/Passwall（见 #4 待办）|

每批必须遵守 AGENTS.md：§1 全产物联动、§1.5 同构审计（#6 节点分类）、§2 官方文档核对、§5 自检、§1.3 版本+CHANGELOG。

---

## 4. 实施前 TODO（研究未尽项）

1. **#5**：WebFetch mihomo wiki 确认 `direct-nameserver-follow-policy` 字段语义 + 最低版本，更新 REFERENCE。
2. **#4 sing-box**：WebFetch `/configuration/dns/server/https/`，确认 DoH-over-IP server 写法 + 1.11/1.12 语法差异 + 我们 generator.js 当前输出。
3. **#4 Xray内核系/v2rayN/Passwall**：核对其 DNS bootstrap 是否支持加密 IP。
4. **#4 兜底语义**：验证 mihomo default-nameserver 多上游是并发还是顺序（决定明文兜底是否有效）。
5. **#1**：逐产物核对 AND/NOT 在 独立内核系/Surge/Loon/QX/SR/SingBox 的精确语法。

---

## 5. 已完成的前置（本会话 2026-05-30）

- ✅ 两份 `REFERENCE-mihomo-wiki.md` 更新：`default-nameserver` 补充"可为加密 DNS"（#4 的文档依据）。
- ✅ 研究结论：Proxy-override 80% 设计我们已更强；净增量 = 上述 7 项。
