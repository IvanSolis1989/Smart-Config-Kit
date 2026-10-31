<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-rules-coverage-mobile.svg">
  <img src="assets/readme/page-rules-coverage.svg" width="100%" alt="技术指南">
</picture>

# GEOSITE 覆盖台账

查阅 GEOSITE、补充 provider 与广告误伤保护的覆盖关系。下方保留原始基线日期，现行规则事实以源图及生成收据为准。

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="下载配置"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="文档目录"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="检查与排障"></a>
</p>

[下载配置](guide/downloads.md) · [文档目录](README.md) · [检查与排障](guide/dns-and-verification.md)

## 使用入口

1. 先看维护原则，判断是否需要新增补充 provider。
2. 按业务层查覆盖关系，再检查广告误伤白名单与端侧映射。
3. 新增规则按页尾审查清单核验；现行质量检查见 [规则质量台账](rule-quality.md)。

> 基线：Clash Party `v5.4.16` / Build `2026-05-20`。
> 目的：记录本仓库在原生 `geosite.dat` / `geoip.dat` 之外为什么还需要补充 rule-provider，以及哪些广告误伤白名单必须前置保护。

---

## 维护原则

1. **先查原生 GEOSITE/GEOIP**：如果 MetaCubeX / Loyalsoldier 已有稳定分类，优先使用原生标签，不重复造本地列表。
2. **再补 rule-provider**：只有当原生分类粒度不足、更新慢、地域语义不够明确，或客户端格式需要时，才保留补充 provider。
3. **误伤白名单一等化**：确认被广告、钓鱼或威胁情报源误杀的业务域名，必须进入 `AD_FALSE_POSITIVE_ALLOWLIST` 或对应静态产物的同名前置区块。
4. **不沉默跳过端侧差异**：某端无法表达完整语义时，在本台账和对应 CHANGELOG 中写明“不适用”或“降级表达”。

---

## 当前原生 GEOSITE 使用面

<details>
<summary>展开本页基线记录的原生标签与去向</summary>

### `category-ads-all`

- **主要去向**：`🛑 广告拦截`
- **说明**：广告兜底。必须位于误伤白名单之后。

### `private`

- **主要去向**：`DIRECT`
- **说明**：局域网、私有域名直连。

### `gfw`

- **主要去向**：`🚫 受限网站`
- **说明**：受限站点基础兜底，叠加 Loyalsoldier / szkane 补充源。

### `category-dev`

- **主要去向**：`🔧 工具与服务`
- **说明**：开发者工具兜底，细分服务仍由 GitHub / npm / JetBrains 等 provider 补齐。

### `category-games`

- **主要去向**：`🎮 国外游戏`
- **说明**：游戏业务兜底，国内游戏另行直连。

### `tracker`

- **主要去向**：`🛰️ BT/PT Tracker`
- **说明**：Tracker 语义兜底，保留补充 tracker provider。

---

</details>

## 业务覆盖台账

<details>
<summary>展开按业务层记录的覆盖、补充源与结论</summary>

### `🛑 广告拦截`

- **原生 GEOSITE/GEOIP**：`category-ads-all`
- **补充 provider**：`anti-ad` / `sukka-phishing` / `hagezi-tif` / blackmatrix7 广告隐私源 / Accademia 安全源
- **本地/误伤白名单**：`AD_FALSE_POSITIVE_ALLOWLIST`
- **当前结论**：必须先白名单、再拦截；新增误伤先补白名单，再考虑删源。

### `🚫 受限网站`

- **原生 GEOSITE/GEOIP**：`gfw`
- **补充 provider**：`loyalsoldier-gfw` / `loyalsoldier-greatfire` / `szkane-proxygfw`
- **本地/误伤白名单**：无
- **当前结论**：原生 + 补充并存，用于提高墙内命中率。

### `🌐 国外网站`

- **原生 GEOSITE/GEOIP**：`geolocation-!cn` / `cloudflare` / `fastly` / `akamai`
- **补充 provider**：新闻、百科、邮件、CDN 补充源
- **本地/误伤白名单**：`cloudflarestorage.com -> 🌐 国外网站`
- **当前结论**：CDN/对象存储域容易被安全源误伤，确认后进入白名单。

### `🤖 AI 服务`

- **原生 GEOSITE/GEOIP**：`openai` / `anthropic` / `gemini` / `copilot`
- **补充 provider**：`szkane-ai` / `szkane-ciciai` / Accademia AI 源
- **本地/误伤白名单**：无
- **当前结论**：原生覆盖主平台，补充源覆盖新服务和区域化入口。

### `📺/🎬/📹 流媒体`

- **原生 GEOSITE/GEOIP**：`youtube` / `netflix` / `disney` / `hbo` / `hulu` / `primevideo` / `spotify`
- **补充 provider**：blackmatrix7 / szkane Netflix IP / 区域媒体源
- **本地/误伤白名单**：无
- **当前结论**：平台组优先，区域流媒体作为兜底。

### `🎮 游戏`

- **原生 GEOSITE/GEOIP**：`category-games`
- **补充 provider**：Steam / Epic / Nintendo / PlayStation / Xbox 等 provider
- **本地/误伤白名单**：无
- **当前结论**：国内游戏直连，国外游戏进业务组。

### `🔧 工具与服务`

- **原生 GEOSITE/GEOIP**：`category-dev`
- **补充 provider**：GitHub / npm / JetBrains / Docker / developer 补充源
- **本地/误伤白名单**：本地工具进程白名单另管
- **当前结论**：域名与进程是两层语义，进程白名单不替代 GEOSITE。

### `🏦 金融支付`

- **原生 GEOSITE/GEOIP**：`paypal` / `stripe`
- **补充 provider**：`acc-bank-*` / Visa / Mastercard / Wise / Revolut
- **本地/误伤白名单**：`paddle.com -> 🏦 金融支付`
- **当前结论**：金融语义按地区与服务拆分，避免落入普通国外网站；Paddle 许可/支付链路需覆盖 anti-AD 误伤。

### `🏠 国内网站`

- **原生 GEOSITE/GEOIP**：`cn` / `geoip:cn` / `private`
- **补充 provider**：少量本地直连域名
- **本地/误伤白名单**：小米核心服务 `DIRECT`
- **当前结论**：国内直连不能放在广告拦截之后依赖兜底；误伤域名必须前置。

### `🛰️ BT/PT Tracker`

- **原生 GEOSITE/GEOIP**：`tracker`
- **补充 provider**：tracker 补充 provider
- **本地/误伤白名单**：无
- **当前结论**：保持独立业务组，便于用户选择限速或代理策略。

---

</details>

## Anti-ad 误伤白名单

这些条目是“规则安全阀”，所有可表达顺序的产物必须放在广告 / 钓鱼 / TIF / 隐私规则之前。

### `account.xiaomi.com`

<!-- ADFP evidence anchor retained for the source registry: `account.xiaomi.com` | `DIRECT` | 小米账号认证被 `miuiprivacy` 类规则误伤。 -->

- **目标策略**：`DIRECT`
- **来源/原因**：小米账号认证被 `miuiprivacy` 类规则误伤。

### `passport.xiaomi.com`

<!-- ADFP evidence anchor retained for the source registry: `passport.xiaomi.com` | `DIRECT` | 小米账号认证链路。 -->

- **目标策略**：`DIRECT`
- **来源/原因**：小米账号认证链路。

### `micloud.xiaomi.com`

<!-- ADFP evidence anchor retained for the source registry: `micloud.xiaomi.com` | `DIRECT` | 小米云服务。 -->

- **目标策略**：`DIRECT`
- **来源/原因**：小米云服务。

### `i.mi.com`

<!-- ADFP evidence anchor retained for the source registry: `i.mi.com` | `DIRECT` | 小米云服务入口。 -->

- **目标策略**：`DIRECT`
- **来源/原因**：小米云服务入口。

### `auth.be.sec.miui.com`

<!-- ADFP evidence anchor retained for the source registry: `auth.be.sec.miui.com` | `DIRECT` | MIUI 安全认证误伤。 -->

- **目标策略**：`DIRECT`
- **来源/原因**：MIUI 安全认证误伤。

### `idm.api.io.mi.com`

<!-- ADFP evidence anchor retained for the source registry: `idm.api.io.mi.com` | `DIRECT` | MIUI 认证 API 误伤。 -->

- **目标策略**：`DIRECT`
- **来源/原因**：MIUI 认证 API 误伤。

### `api.installer.xiaomi.com`

<!-- ADFP evidence anchor retained for the source registry: `api.installer.xiaomi.com` | `DIRECT` | MIUI 安装器服务误伤。 -->

- **目标策略**：`DIRECT`
- **来源/原因**：MIUI 安装器服务误伤。

### `flash.sec.miui.com`

<!-- ADFP evidence anchor retained for the source registry: `flash.sec.miui.com` | `DIRECT` | MIUI 安全服务误伤。 -->

- **目标策略**：`DIRECT`
- **来源/原因**：MIUI 安全服务误伤。

### `mazu.sec.miui.com`

<!-- ADFP evidence anchor retained for the source registry: `mazu.sec.miui.com` | `DIRECT` | MIUI 安全服务误伤。 -->

- **目标策略**：`DIRECT`
- **来源/原因**：MIUI 安全服务误伤。

### `ccc.sys.miui.com`

<!-- ADFP evidence anchor retained for the source registry: `ccc.sys.miui.com` | `DIRECT` | MIUI 系统服务误伤。 -->

- **目标策略**：`DIRECT`
- **来源/原因**：MIUI 系统服务误伤。

### `register.xmpush.xiaomi.com`

<!-- ADFP evidence anchor retained for the source registry: `register.xmpush.xiaomi.com` | `DIRECT` | 小米推送注册被 `advertisingmitv` 类规则误伤。 -->

- **目标策略**：`DIRECT`
- **来源/原因**：小米推送注册被 `advertisingmitv` 类规则误伤。

### `cloudflarestorage.com`

- **目标策略**：`🌐 国外网站`
- **来源/原因**：Sukka phishing 当前包含 Cloudflare R2 存储域。

### `paddle.com`

<!-- ADFP evidence anchor retained for the source registry: `paddle.com` | `🏦 金融支付` | anti-AD/DustinWin 当前包含 `analytics.paddle.com`；Antigravity 账号设置会调用 Paddle 许可/支付链路。 -->

- **目标策略**：`🏦 金融支付`
- **来源/原因**：anti-AD/DustinWin 当前包含 `analytics.paddle.com`；Antigravity 账号设置会调用 Paddle 许可/支付链路。

### 端侧映射

- **Clash Party Smart / Normal**：`AD_FALSE_POSITIVE_ALLOWLIST` 常量，注入到 `injectRules()` 顶部。
- **FlClash**：同名 `AD_FALSE_POSITIVE_ALLOWLIST` 常量，跟随 Clash Party Normal。
- **CMFA / OpenClash**：`rules:` 顶部的 `Anti-ad false-positive allowlist` 前置区块。
- **Shadowrocket / Surge / Loon / Quantumult X**：本地规则区顶部的同名前置区块；Loon 本地规则天然优先于远程规则。
- **SingBox Full**：由 `SingBox(sing-box)-generator.js` 从 Clash Party 规则生成，`route.rules` 顶部保留同序白名单。
- **v2rayN Xray**：Xray 路由 JSON 仅保留可表达的前置域名规则；mihomo / sing-box 路径直接复用对应产物。
- **Passwall / Passwall2**：降级参考产物，不消费 Sukka phishing 源；Cloudflare R2 在国外网站列表显式补齐。

---

## 新增 provider / 规则时的审查清单

- 是否已有原生 `geosite:` 或 `geoip:` 标签可以覆盖？
- 补充 provider 相比原生标签多解决了什么：更新速度、语义粒度、地域归属，还是客户端格式？
- 是否会与 `category-ads-all`、钓鱼、TIF、隐私规则发生首匹配误伤？
- 如有误伤样例，是否已进入 `AD_FALSE_POSITIVE_ALLOWLIST` 并同步到静态产物？
- 是否更新根 README、对应子目录 README、CHANGELOG，并跑完当前可用的静态验证？
