# Clash Meta For Android (CMFA) — 变更日志

> `Clash Meta For Android/CMFA(mihomo).yaml` 的变更日志。
> 主版本号跟随 Clash Party 主线。

---

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
