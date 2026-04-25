# Clash Meta For Android (CMFA) — 变更日志

> `Clash Meta For Android/CMFA(mihomo).yaml` 的变更日志。
> 主版本号跟随 Clash Party 主线。

---

## v5.2.8-cmfa.6 (2026-04-25) — 补齐 18 区域 filter 中缺失的裸 ISO alpha-2 代码

- ★ **FIX#29-P2**：CMFA 区域 filter 缺少裸 ISO alpha-2 代码（`HK`/`TW`/`JP`/`KR`/`SG`/`US`/`CA`/`EU`/`AF`）
  - 现象：节点命名为 `HK-01` / `JP-01` / `US-01`（无旗帜 emoji 且无 alpha-3 代码）时，
    CMFA `filter:` 因缺少裸 2 字母代码而无法分类 → 节点落入默认全局组。
    其他产物（Clash Party JS word-boundary regex、OpenClash Ruby 子串、SR/Surge/Loon/QX 显式罗列）
    均能正确分类此类命名。
  - 根因：CMFA filter 使用 Go RE2 子串匹配，裸 `US` 会误命中 `MUSIC`/`FOCUS`/`JUST` 等
    含 `US` 子串的单词。早期版本为规避此问题故意省略了裸代码。
  - 修复：对 18 个区域 filter（9 全部 + 9 家宽）添加 `(^|[^a-zA-Z])CODE([^a-zA-Z]|$)` 字边界模拟模式。
    该模式在 Go RE2 中正常工作（标准捕获组 + 锚点 + 字符类组合，不依赖 `\b`/lookahead 等 RE2 不支持的语法）。
    - `(^|[^a-zA-Z])` 匹配字符串开头或非字母字符
    - `CODE` 为具体的 2 字母 ISO 代码
    - `([^a-zA-Z]|$)` 匹配非字母字符或字符串结尾
    - 效果：`HK-01` ✅ / `NODE_US` ✅ / `JP01` ✅ / `MUSIC` ❌ / `FOCUS` ❌ / `TWD` ❌
  - 影响区域：🇭🇰 香港 / 🇹🇼 台湾 / 🇯🇵 日韩 / 🌏 亚太 / 🇺🇸 美国 / 🇪🇺 欧洲 / 🌎 美洲 / 🌍 非洲
    （9 全部 + 9 家宽 = 18 处 filter，含 2 组 AND 复合 home filter 各两侧同时补齐）
  - 全量审计跳过：OpenClash Ruby 已含裸代码（子串匹配）；JS baseline 已有 word-boundary；
    SR/Surge/Loon/QX 已有显式罗列；SingBox/v2rayN 无运行时分类（N/A）。
  - 版本号 `v5.2.8-cmfa.5` → `v5.2.8-cmfa.6`

## v5.2.8-cmfa.5 (2026-04-24) — DNSPod DoH 端点切换为纯 IP 形式

- ★ `nameserver` / `proxy-server-nameserver` / `direct-nameserver` 三段里的
  `https://doh.pub/dns-query` 全部替换为 `https://1.12.12.12/dns-query`
  - DNSPod 同时提供 `doh.pub` 域名形式与 `1.12.12.12` 纯 IP 形式两种 DoH 端点
  - 纯 IP 形式**无需 bootstrap DNS 解析 `doh.pub`**，消除"冷启动时 DoH 自依赖"的
    潜在死锁（bootstrap 阶段 `default-nameserver` 只需解析 `dns.alidns.com` 和
    `dns.cloudflare.com`，不再需要解析 `doh.pub`）
- 版本号 `v5.2.8-cmfa.4` → `v5.2.8-cmfa.5`

## v5.2.8-cmfa.4 (2026-04-24)

- ★ **删除 2 个离线 rule-provider**（与 Clash Party v5.2.1 对齐）
  - `ckrvxr-antifraud`（`Ckrvxr/MihomoRules/.../AntiAntiFraud.yaml`）—— 源仓库持续 404，Clash Party JS 在 v5.2.1 已删除并注释 `v5.2.1 REMOVED`
  - `ckrvxr-antipcdn`（`Ckrvxr/MihomoRules/.../AntiPCDN.yaml`）—— 同上
  - 同时删除 `rules:` 段中对应的 2 条 `RULE-SET,ckrvxr-antifraud,🛑 广告拦截` / `RULE-SET,ckrvxr-antipcdn,🛑 广告拦截`
  - rule-providers 数量 386 → 384（与 OpenClash 对齐）
- ★ **修正 3 条规则目标组归属**（对齐 Clash Party JS 基线）：
  - `deepseek.com`：`🤖 AI 服务` → `🏠 国内网站`（基线 `BIZ.CN_SITE`）
  - `inflection.ai`：`🤖 AI 服务` → `🚫 受限网站`（基线 `BIZ.GFW`）
  - `pi.ai`：`🤖 AI 服务` → `🚫 受限网站`（基线 `BIZ.GFW`）
- 版本号 `v5.2.8-cmfa.3` → `v5.2.8-cmfa.4`

## v5.2.8-cmfa.3 (2026-04-23)

- ★ **FIX#28-P0**（节点分类同构 bug 补齐）：🌏 亚太节点 filter 补 HK/TW/JP/KR 子串
  - 现象：CMFA 侧用户订阅的香港/台湾/日韩节点进不了 🌏 亚太节点组。
  - 根因：L486 亚太 filter 只匹配 `新加坡|Singapore|SGP|马来西亚|...|🇸🇬|🇲🇾|...`，未包含 HK/TW/JP/KR 任何标识 → mihomo 按 Go RE2 子串匹配时，港台日韩节点全部落空。与 Clash Party JS 主线语义不一致（`apacNodes = c.HK.concat(c.TW, c.CN, c.JP, c.KR, c.SG, c.APAC_OTHER)`）。
  - 修复：
    - L486 🌏 亚太节点 filter 头部补 `香港|HongKong|Hong\s*Kong|HKG|🇭🇰|台湾|台灣|Taiwan|Taipei|TPE|TWN|🇹🇼|日本|东京|大阪|Japan|Tokyo|Osaka|NRT|KIX|JPN|🇯🇵|韩国|首尔|Korea|Seoul|ICN|KOR|🇰🇷`（与香港/台湾/日韩节点 filter 关键词一致，避免裸 `HK`/`TW`/`JP`/`KR` 误命中 HKD / TWD 等非节点字符串）
    - L495 🏡 亚太家宽 filter 同步扩展（两侧 lookahead/lookbehind 的子区域关键词都加）
  - 💡 美洲节点（L540）已包含 `美国|United\s*States|USA|LAX|...|🇺🇸`，不需要改；欧洲/非洲亦已正确覆盖所属国家。
  - 同构 bug 审计（CLAUDE.md §1.5 强制）：OpenClash Ruby Normal / Full 命中同构 bug，本 PR 一并修复（见 `OpenClash/CHANGELOG.md` v5.2.8-oc-normal.3 / v5.2.8-oc-full.3）。Clash Party JS / Normal JS / Shadowrocket / Surge / Loon / QX 核对均已有正确覆盖；SingBox / v2rayN 无运行时分类（N/A）。
  - 跟随基线：Clash Party v5.2.8 → CMFA bump 到 `v5.2.8-cmfa.3`。

## v5.2.7-cmfa.1 (2026-04-23)

- ★ **FIX#27-P1**：消除 mihomo 加载 3 个 classical rule-provider 的 parse warning（与 Clash Party v5.2.7 同步）
  - 现象（用户报告）：CMFA 启动 / reload 日志反复打印
    - `parse classical rule [USER-AGENT,TikTok*] error: unsupported rule type: USER-AGENT`
    - `parse classical rule [USER-AGENT,BBCiPlayer*] error: unsupported rule type: USER-AGENT`
    - `parse classical rule [IP-CIDR , 17.253.4.125] error: payloadRule error`
  - 根因：upstream `szkane/ClashRuleSet` 的 `CiciAi.list` / `UK.list` 各含 1 行 USER-AGENT（mihomo `classical` provider 不识别，是 Surge / iOS 遗留语法）；upstream `Accademia/Additional_Rule_For_Clash` 的 `Grok.yaml` 含 1 行 `IP-CIDR         , 17.253.4.125`（多余空格 + 缺 CIDR 掩码）。
  - 修复：把 `szkane-ciciai` / `szkane-uk` / `acc-grok` 的 URL 切到本仓库根目录新增的 `mirrors/` 子目录的清洗副本（仅删问题行，剩余规则字节级一致）。TikTok / BBC 域名分别已由 `geosite:tiktok` / `geosite:bbc` 提供 100% 覆盖；17.253.4.125 是 Apple `time.apple.com` anycast，与 Grok 路由无关。
  - 跟随基线：Clash Party v5.2.7 → CMFA bump 到 `v5.2.7-cmfa.1`。

## docs (2026-04-23) — 追加 ClashMi 兼容说明（纯文档，YAML 未改动）

- ★ **README §一 顶部"适用客户端"行**：追加 **[ClashMi](https://github.com/KaringX/clashmi)**（KaringX 跨平台 Flutter GUI，iOS/macOS/Android/Windows/Linux）。
- ★ **README 新增 §九〈兼容客户端：ClashMi（跨平台）〉**：导入方式 + 与 CMFA 行为一致点（37 代理组 / 387 RULE-SET / fake-ip DNS / 区域组 url-test）+ ClashMi 专属差异表 6 项。
- ★ **根 `README.md`**：
  - 顶部"覆盖客户端"列表补 `ClashMi`
  - 协议矩阵"客户端列名缩写对照"里 **CMFA** 条目扩展到包含 ClashMi，指向 CMFA §九
- ★ **`CLAUDE.md` §0 备注链**：新增一段〈关于 ClashMi〉（与〈关于 Hiddify〉对称，说明"mihomo 跨平台 GUI 版"的复用模式）。
- **关键兼容性论据**（均引自 ClashMi 官方 [FAQ](https://clashmi.app/guide/faq)）：
  - ClashMi bundle 的是 MetaCubeX mihomo **mainline**（非 vernesong Smart fork）—— 与 CMFA 同源。
  - ClashMi 内核定制会把 `GEOIP,*` / `GEOSITE,*` **强制转换**为 rule-set → 本 YAML 自检 **0 条 GEOIP / 0 条 GEOSITE / 387 条 RULE-SET**，转换零触发。
  - iOS VPN Extension 50 MB 内存硬顶 → 本 YAML 使用 `.mrs` 二进制 + 懒加载，不触发 OOM。
  - iOS 端 IP-ASN 不可用 → 本 YAML 未使用 ASN 规则。
  - `tun:` 由 App UI 托管 → 本 YAML 未写 `tun:` 段，天然兼容。
- **版本号策略**：本次仅改 `README.md` / `CHANGELOG.md` / 根 `README.md` / `CLAUDE.md`，**未触及** `CMFA(mihomo).yaml`，故不 bump YAML 版本号。

## v5.2.6 (2026-04-22)

- ★ **FIX#24-P0**（同构 bug 补齐）：`filter:` 正则补 ISO alpha-3 国家代码
  - 现象：机场节点命名为 `TWN 01 / JPN 01 / KOR 01 / SGP 01` 时，mihomo 按 `filter:` 正则做子串匹配。
    原 TW 组只有 `Taiwan|Taipei|TPE|🇹🇼`；JP/KR 组只有 `Japan|Korea|Tokyo|Osaka|Seoul|NRT|KIX|ICN|🇯🇵|🇰🇷`；
    APAC 组没有 `SG/Singapore/🇸🇬`。这些 alpha-3 命名节点一律漏过滤 → 台湾/日韩/亚太组少节点
  - 修复：
    - L521 🇹🇼 台湾节点 filter：补 `TWN`
    - L548 🌏 亚太节点 filter：补 `新加坡|Singapore|SGP|🇸🇬`
    - L557 🇯🇵 日韩节点 filter：补 `JPN|KOR`
  - 同步 Clash Party v5.2.6 FIX#24（JS REGION_DB + OpenClash Ruby REGIONS 同步修复）

## v5.2.5 (2026-04-20)

- ★ 同步 Clash Party v5.2.5 FIX#23-P1：删除 `acc-geositecn` + `acc-china` 两个 rule-provider（与 `geosite:cn` 纯重复）
- 头部版本号从 v5.2.2 同步到 v5.2.5

## v5.2.2 (2026-04-20)

对齐 Clash Party FIX#17-P0：

- ★ `rule-providers` 统一 `proxy: '🚫 受限网站'`（389 处，原值 `'☁️ 云与CDN'`）
- ★ 头部版本号从 v5.2.0 同步到 v5.2.2

## v5.2.0 (初版)

- 9 url-test 区域组 + 28 业务策略组 + 375+ rule-providers
- 所有 GEOSITE / GEOIP 高级标签已用等效 RULE-SET 替代，无需等 `.dat` 下载
- 区域组使用 `type: url-test`（静态 YAML 不支持 Mihomo Smart + LightGBM；LightGBM 仅在桌面端 Clash Party JS 运行时注入）
