[**English**](GEOSITE_COVERAGE_LEDGER.md) | [中文](GEOSITE_COVERAGE_LEDGER.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-rules-coverage-mobile.svg">
  <img src="assets/readme/page-rules-coverage.svg" width="100%" alt="Technical guide">
</picture>

<a id="geosite-覆盖台账"></a>

# GEOSITE coverage ledger

Review coverage relationships among GEOSITE, supplemental providers and ad-filter false-positive protection. The original baseline date below is retained; the source graph and generated receipts determine current routing facts.

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="Downloads"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="Documentation"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="Verification and troubleshooting"></a>
</p>

[Downloads](guide/downloads.md) · [Documentation](README.md) · [Verification and troubleshooting](guide/dns-and-verification.md)

<a id="使用入口"></a>

## How to use this ledger

1. Read the maintenance principles before deciding whether to add a supplemental provider.
2. Review coverage by service, then false-positive allowlists and client mappings.
3. Use the checklist below for new rules; see the [rule-quality ledger](rule-quality.md) for current quality checks.

> Baseline: Clash Party `v5.4.16` / Build `2026-05-20`。
> Purpose: record why supplemental rule-providers are needed beyond native `geosite.dat` / `geoip.dat`, and which false-positive allowlists must match before blocking rules.

---

<a id="维护原则"></a>

## Maintenance principles

1. **Check native GEOSITE/GEOIP first:** prefer stable MetaCubeX / Loyalsoldier categories over duplicate local lists.
2. **Supplement only when needed:** retain additional providers when native categories lack granularity, update too slowly, have unclear regional semantics or need client-specific formats.
3. **Treat false-positive allowlists as first-class:** confirmed service domains incorrectly blocked by ad/phishing/threat feeds must enter `AD_FALSE_POSITIVE_ALLOWLIST` or the corresponding leading block in static artifacts.
4. **Document client differences explicitly:** when a client cannot express full semantics, record “not applicable” or “reduced representation” here and in its CHANGELOG.

---

<a id="当前原生-geosite-使用面"></a>

## Native GEOSITE usage recorded at this baseline

<details>
<summary>Expand native tags and targets recorded at this baseline</summary>

### `category-ads-all`

- **Primary target**：`🛑 广告拦截`
- **Notes**：Ad-blocking fallback; must follow false-positive allowlists.

### `private`

- **Primary target**：`DIRECT`
- **Notes**：Direct routing for LAN/private domains.

### `gfw`

- **Primary target**：`🚫 受限网站`
- **Notes**：Baseline restricted-site category supplemented by Loyalsoldier / szkane sources.

### `category-dev`

- **Primary target**：`🔧 工具与服务`
- **Notes**：Developer-tool fallback, with specific services supplemented by GitHub / npm / JetBrains providers.

### `category-games`

- **Primary target**：`🎮 国外游戏`
- **Notes**：Game-service fallback; China-game categories route directly separately.

### `tracker`

- **Primary target**：`🛰️ BT/PT Tracker`
- **Notes**：Tracker-category fallback, retaining supplemental tracker providers.

---

</details>

<a id="业务覆盖台账"></a>

## Service coverage ledger

<details>
<summary>Expand service coverage, supplemental sources and recorded conclusions</summary>

### `🛑 广告拦截`

- **Native GEOSITE/GEOIP**：`category-ads-all`
- **Supplemental providers**：`anti-ad` / `sukka-phishing` / `hagezi-tif` / blackmatrix7 ad/privacy sources / Accademia security sources
- **Local / false-positive allowlist**：`AD_FALSE_POSITIVE_ALLOWLIST`
- **Recorded conclusion**：Allowlists must precede blocking. For new false positives, add a bounded exception before considering source removal.

### `🚫 受限网站`

- **Native GEOSITE/GEOIP**：`gfw`
- **Supplemental providers**：`loyalsoldier-gfw` / `loyalsoldier-greatfire` / `szkane-proxygfw`
- **Local / false-positive allowlist**: None
- **Recorded conclusion**：Native and supplemental sources coexist to improve category coverage.

### `🌐 国外网站`

- **Native GEOSITE/GEOIP**：`geolocation-!cn` / `cloudflare` / `fastly` / `akamai`
- **Supplemental providers**：News, encyclopedia, mail and CDN supplemental sources
- **Local / false-positive allowlist**：`cloudflarestorage.com -> 🌐 国外网站`
- **Recorded conclusion**：CDN/object-storage domains can be false positives in security feeds; add allowlist entries after confirmation.

### `🤖 AI 服务`

- **Native GEOSITE/GEOIP**：`openai` / `anthropic` / `gemini` / `copilot`
- **Supplemental providers**：`szkane-ai` / `szkane-ciciai` / Accademia AI source
- **Local / false-positive allowlist**: None
- **Recorded conclusion**：Native tags cover major platforms; supplemental feeds cover newer services and regional endpoints.

<a id="-流媒体"></a>

### Streaming services (`📺/🎬/📹 流媒体`)

- **Native GEOSITE/GEOIP**：`youtube` / `netflix` / `disney` / `hbo` / `hulu` / `primevideo` / `spotify`
- **Supplemental providers**：blackmatrix7 / szkane Netflix IP / regional-media sources
- **Local / false-positive allowlist**: None
- **Recorded conclusion**：Platform groups match first; regional streaming categories provide fallback.

<a id="-游戏"></a>

### Games (`🎮 游戏`)

- **Native GEOSITE/GEOIP**：`category-games`
- **Supplemental providers**：Steam / Epic / Nintendo / PlayStation / Xbox providers
- **Local / false-positive allowlist**: None
- **Recorded conclusion**：China-game categories route directly; international games use their service group.

### `🔧 工具与服务`

- **Native GEOSITE/GEOIP**：`category-dev`
- **Supplemental providers**：GitHub / npm / JetBrains / Docker / developer supplemental sources
- **Local / false-positive allowlist**：Local-tool process allowlists are maintained separately
- **Recorded conclusion**：Domain and process matching are separate layers; process allowlists do not replace GEOSITE.

### `🏦 金融支付`

- **Native GEOSITE/GEOIP**：`paypal` / `stripe`
- **Supplemental providers**：`acc-bank-*` / Visa / Mastercard / Wise / Revolut
- **Local / false-positive allowlist**：`paddle.com -> 🏦 金融支付`
- **Recorded conclusion**：Financial categories are separated by region/service instead of falling through to general international websites. Paddle licensing/payment paths require protection from anti-AD false positives.

### `🏠 国内网站`

- **Native GEOSITE/GEOIP**：`cn` / `geoip:cn` / `private`
- **Supplemental providers**：A small set of locally maintained direct domains
- **Local / false-positive allowlist**：Xiaomi core services use `DIRECT`
- **Recorded conclusion**：Do not rely on a China-direct fallback after ad blocking to protect false positives; their domain exceptions must come first.

### `🛰️ BT/PT Tracker`

- **Native GEOSITE/GEOIP**：`tracker`
- **Supplemental providers**：Supplemental tracker providers
- **Local / false-positive allowlist**: None
- **Recorded conclusion**：Keep a separate service group so users can choose appropriate rate-limiting or proxy policies.

---

</details>

<a id="anti-ad-误伤白名单"></a>

## Anti-ad false-positive allowlist

These bounded exceptions protect against false positives. Every artifact capable of expressing order must place them before ad / phishing / TIF / privacy rules.

### `account.xiaomi.com`

<!-- ADFP evidence anchor retained for the source registry: `account.xiaomi.com` | `DIRECT` | 小米账号认证被 `miuiprivacy` 类规则误伤。 -->

- **Target policy**：`DIRECT`
- **Source / reason**：Xiaomi account authentication is incorrectly matched by `miuiprivacy`-type rules.

### `passport.xiaomi.com`

<!-- ADFP evidence anchor retained for the source registry: `passport.xiaomi.com` | `DIRECT` | 小米账号认证链路。 -->

- **Target policy**：`DIRECT`
- **Source / reason**：Xiaomi account-authentication path.

### `micloud.xiaomi.com`

<!-- ADFP evidence anchor retained for the source registry: `micloud.xiaomi.com` | `DIRECT` | 小米云服务。 -->

- **Target policy**：`DIRECT`
- **Source / reason**：Xiaomi cloud services.

### `i.mi.com`

<!-- ADFP evidence anchor retained for the source registry: `i.mi.com` | `DIRECT` | 小米云服务入口。 -->

- **Target policy**：`DIRECT`
- **Source / reason**：Xiaomi cloud-service entry point.

### `auth.be.sec.miui.com`

<!-- ADFP evidence anchor retained for the source registry: `auth.be.sec.miui.com` | `DIRECT` | MIUI 安全认证误伤。 -->

- **Target policy**：`DIRECT`
- **Source / reason**：MIUI security-authentication false positive.

### `idm.api.io.mi.com`

<!-- ADFP evidence anchor retained for the source registry: `idm.api.io.mi.com` | `DIRECT` | MIUI 认证 API 误伤。 -->

- **Target policy**：`DIRECT`
- **Source / reason**：MIUI authentication-API false positive.

### `api.installer.xiaomi.com`

<!-- ADFP evidence anchor retained for the source registry: `api.installer.xiaomi.com` | `DIRECT` | MIUI 安装器服务误伤。 -->

- **Target policy**：`DIRECT`
- **Source / reason**：MIUI installer-service false positive.

### `flash.sec.miui.com`

<!-- ADFP evidence anchor retained for the source registry: `flash.sec.miui.com` | `DIRECT` | MIUI 安全服务误伤。 -->

- **Target policy**：`DIRECT`
- **Source / reason**：MIUI security-service false positive.

### `mazu.sec.miui.com`

<!-- ADFP evidence anchor retained for the source registry: `mazu.sec.miui.com` | `DIRECT` | MIUI 安全服务误伤。 -->

- **Target policy**：`DIRECT`
- **Source / reason**：MIUI security-service false positive.

### `ccc.sys.miui.com`

<!-- ADFP evidence anchor retained for the source registry: `ccc.sys.miui.com` | `DIRECT` | MIUI 系统服务误伤。 -->

- **Target policy**：`DIRECT`
- **Source / reason**：MIUI system-service false positive.

### `register.xmpush.xiaomi.com`

<!-- ADFP evidence anchor retained for the source registry: `register.xmpush.xiaomi.com` | `DIRECT` | 小米推送注册被 `advertisingmitv` 类规则误伤。 -->

- **Target policy**：`DIRECT`
- **Source / reason**：Xiaomi push registration is incorrectly matched by `advertisingmitv`-type rules.

### `cloudflarestorage.com`

- **Target policy**：`🌐 国外网站`
- **Source / reason**：The recorded Sukka phishing source contains the Cloudflare R2 storage domain.

### `paddle.com`

<!-- ADFP evidence anchor retained for the source registry: `paddle.com` | `🏦 金融支付` | anti-AD/DustinWin 当前包含 `analytics.paddle.com`；Antigravity 账号设置会调用 Paddle 许可/支付链路。 -->

- **Target policy**：`🏦 金融支付`
- **Source / reason**：The recorded anti-AD/DustinWin source contains `analytics.paddle.com`; Antigravity account settings call Paddle licensing/payment paths.

<a id="端侧映射"></a>

### Client mappings

- **Clash Party Smart / Normal**：The `AD_FALSE_POSITIVE_ALLOWLIST` constant is injected at the start of `injectRules()`.
- **FlClash**：The same `AD_FALSE_POSITIVE_ALLOWLIST` constant follows Clash Party Normal.
- **CMFA / OpenClash**：The leading `Anti-ad false-positive allowlist` block in `rules:`.
- **Shadowrocket / Surge / Loon / Quantumult X**：The same leading block in local rules; Loon local rules inherently precede remote rules.
- **SingBox Full**：Generated from Clash Party rules by `SingBox(sing-box)-generator.js`, retaining the same ordered allowlist at the start of `route.rules`.
- **v2rayN Xray**：Xray routing JSON retains only expressible leading domain rules; mihomo / sing-box paths reuse their corresponding artifacts directly.
- **Passwall / Passwall2**：Reduced reference artifacts do not consume Sukka phishing; Cloudflare R2 is explicitly supplemented in the international-websites list.

---

<a id="新增-provider--规则时的审查清单"></a>

## Checklist for new providers / rules

- Does an existing native `geosite:` or `geoip:` tag already cover this?
- What does the provider add: update speed, semantic granularity, regional attribution or client format?
- Could first-match behavior with `category-ads-all`, phishing, TIF or privacy feeds cause false positives?
- Have confirmed examples entered `AD_FALSE_POSITIVE_ALLOWLIST` and been synchronized to static artifacts?
- Have root/client READMEs and CHANGELOG been updated, and available static checks completed?
