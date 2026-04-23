# SingBox — 变更日志

> `SingBox/SingBox(sing-box)-full.json`（完整配置，由脚本生成）的变更日志。
> 本目录只发布 Full 配置。

---

## v5.2.8-sing.2 (2026-04-23) — 修复港澳台 B 站（szkane-bilihmt）缺失

- ★ FIX：Full 配置之前**静默丢失**了 `szkane-bilihmt`（港澳台哔哩哔哩）。
  - 根因：`SingBox(sing-box)-generator.js` 的 `toSrsUrl()` 只识别 MetaCubeX `meta-rules-dat@meta/*.mrs` 和 DustinWin ads 两种 URL；szkane 的 `ClashRuleSet@main/Clash/Ruleset/BilibiliHMT.list` 不匹配 → provider 被 `filter(Boolean)` 丢弃 → `RULE-SET,szkane-bilihmt,🇭🇰 香港流媒体` 规则也被 `availableRuleSets` 过滤成 `null`。
  - 结果：用户在 sing-box 上访问港澳台番剧域名（如 `p.bstarstatic.com` / `upos-bstar-*.akamaized.net`）会落到后续规则或 FINAL，不会路由到 🇭🇰 香港流媒体，可能触发港澳台 B 站 412 校验。
- ★ 修法：在 `toSingRule()` 的 `RULE-SET` 分支里特判 `szkane-bilihmt`，用内联默认规则（`domain` × 5 / `domain_suffix` × 3 / `ip_cidr` × 13，共 21 条，与 szkane 上游一致）替代 remote rule_set 引用。
  - sing-box 同一默认规则内 `domain` / `domain_suffix` / `ip_cidr` 默认 OR 组合（见 [sing-box Route Rule](https://sing-box.sagernet.org/configuration/route/rule/)）。
- ★ Full 产物 `_meta.version` bump 到 `v5.2.8-sing.2`。

### 自检摘要

- `node SingBox/SingBox(sing-box)-generator.js` 重新生成后：
  - `route.rules` = 624（比 sing.1 的 623 多 1 条，即恢复的 HMT 规则）
  - 其中含有 `outbound: "🇭🇰 香港流媒体"` 且 `domain_suffix` 包含 `bilibili.com`/`bilibili.tv`/`acgvideo.com` 的 1 条内联规则
  - `outbounds` selector/urltest 数仍为 47
- JSON 合法性：`python3 -c 'import json;json.load(open("SingBox/SingBox(sing-box)-full.json"))'` 通过。

### 官方文档证据

- [sing-box Route Rule](https://sing-box.sagernet.org/configuration/route/rule/)：默认规则同类字段（`domain` / `domain_suffix` / `domain_keyword` / `ip_cidr` / `ip_is_private` 等）以 `||` 组合，跨类以 `&&` 组合——单条 inline 规则里混用 domain/ip_cidr 的 OR 语义正确。

---

## v5.2.6-sing.5 (2026-04-23) — 删除 SingBox 非 Full 产物

- ★ 删除旧的非 Full SingBox JSON 产物，本目录只保留 Full 配置。
- ★ `SingBox/SingBox(sing-box)-generator.js` 改为读取并重写 `SingBox/SingBox(sing-box)-full.json`，Full 产物同时作为布局模板，避免保留第二份用户可导入配置。
- ★ 清理 SingBox README、根 README、项目契约、Issue 模板和 workflow 中对已删除 SingBox 文件的引用。
- ★ Full 产物 `_meta.version` bump 到 `v5.2.6-sing.5`。

### 自检摘要

- `node SingBox/SingBox(sing-box)-generator.js` 可重新生成 Full。
- `SingBox/SingBox(sing-box)-full.json` JSON 解析通过。
- Full 仍为 38 个 selector/urltest 出站组、39 个 remote rule_set、623 条路由规则。

---

## v5.2.6-sing.4 (2026-04-23) — 修复 DNS rule_set 引用 + Full 规则集 URL 兼容

- ★ `dns.rules[*].rule_set` 与 Full 的 `route.rule_set` tag 对齐，避免引用未定义规则集。
- ★ Full 生成器停止把 Clash/Mihomo 规则源机械改成 `.srs`。
  - MetaCubeX `meta-rules-dat@meta/*.mrs` 正确映射到 `meta-rules-dat@sing/*.srs`。
  - DustinWin `anti-ad` 改用其 `sing-box-ruleset/ads.srs`。
  - blackmatrix7 / ACL4SSR / Accademia 等 Clash YAML/list 规则源不再伪装成 `.srs`。
- ★ 广告路由生成时统一转成 `action: "reject"`，不再导向只有 `DIRECT` 的广告 selector。

### 官方文档证据

- [sing-box Rule Set](https://sing-box.sagernet.org/configuration/rule-set/)：remote rule-set 需要 `tag` / `format` / `url`，`format` 为 `source` 或 `binary`。
- [sing-box Source Format](https://sing-box.sagernet.org/configuration/rule-set/source-format/)：`source` 是 sing-box JSON `{version,rules}`，不是 Clash YAML。
- [sing-box DNS Rule](https://sing-box.sagernet.org/configuration/dns/rule/)：DNS rule 可通过 `rule_set` 匹配已定义的 rule-set。
- [sing-box Route Rule Action](https://sing-box.sagernet.org/configuration/route/rule_action/)：`reject` 是原生 action。
