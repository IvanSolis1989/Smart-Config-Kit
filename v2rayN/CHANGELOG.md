# v2rayN — 变更日志

> `v2rayN/v2rayN(xray).json` 的变更日志。
> 主版本号跟随 Clash Party 主线；尾段 `-v2n.N` 独立递增。
>
> v2rayN 本身是多核调度器，路径 A（mihomo 核）和路径 B（sing-box 核）直接复用 CMFA / SingBox 产物，不在此记录；本文件仅针对**路径 C（Xray 核）** 的 `v2rayN(xray).json`。

---

## v5.2.8-v2n.1 (2026-04-23) — 补齐港澳台 / 国际版 B 站分流，主线对齐 v5.2.8

本轮补齐与 Clash Party v5.2.7 / v5.2.8 的主线同步欠账，以及港澳台 / 国际版 B 站在 Xray 路径的规则缺失。

### 改动

- ★ **FIX#v2n-07**：新增 `scki-019-hmt-media`（港澳台 B 站 → 代理）
  - 基线 `Clash Party/ClashParty(mihomo-smart).js:1555` 将 `RULE-SET,szkane-bilihmt` 归入 `🇭🇰 香港流媒体`；Xray 三出站模型下降级为 `proxy`。
  - szkane 的 `ClashRuleSet@main/Clash/Ruleset/BilibiliHMT.list` 是 Clash 私有 `.list`，xray 的 `geosite.dat` 不含对应分类，因此**内联**上游 21 条（5 DOMAIN / 3 DOMAIN-SUFFIX / 13 IP-CIDR）。
  - **放置在 `scki-018-cn-media` 之前**：xray 与 mihomo 一样按数组顺序评估，`geosite:bilibili` 里包含 `bilibili.com` 后缀，若 HMT 排在 018 之后会先被 018 捕获命中直连 → 港澳台番剧 412。
- ★ **FIX#v2n-08**：新增 `scki-019a-sea-media`（国际版 B 站 → 代理）
  - 基线将 `RULE-SET,biliintl` 归入 `📺 东南亚流媒体`；v2rayN Xray 三出站下降级为 `proxy`。
  - 用 `geosite:biliintl`（v2fly `geosite.dat` 标准分类）；若用户 geosite 不含该分类，会自然回落到 `scki-040-gfw` → proxy，语义不变。
- ★ 主线对齐：`scki-000-meta` remarks 由 `v5.2.6-v2n.3` / `Baseline Clash Party v5.2.6` bump 到 `v5.2.8-v2n.1` / `Baseline Clash Party v5.2.8`（前两次 v5.2.7 / v5.2.8 主线 bump 未同步 v2rayN，一并补上）。

### 官方文档证据

- [v2rayN Wiki — 自定义路由规则](https://github.com/2dust/v2rayN/wiki/%E9%85%8D%E7%BD%AE%E6%95%99%E7%A8%8B-%E8%B7%AF%E7%94%B1)：自定义路由规则为数组，每项是一条 Xray 路由规则对象（顶层仍为数组保持不变）。
- [Xray Routing — domain prefix](https://xtls.github.io/config/routing.html)：`geosite:*` / `domain:*` / 纯域名 / IP-CIDR 的匹配语义；路由按规则数组**顺序**评估，首条命中立即出站。

### 自检

- JSON 合法 ✓
- 对象总数 32（启用 31 + 禁用 metadata 1）✓
- `outboundTag` 集合仍为 `{proxy, direct, block}` ✓
- 规则顺序：`scki-019-hmt-media` < `scki-018-cn-media` < `scki-019a-sea-media` ✓（python 断言通过）

---

## v5.2.6-v2n.3 (2026-04-23) — 改为官方规则数组 + 移除悬空 dns-out

本轮处理 P0 兼容性审查中 v2rayN Xray 路径的导入格式与 outboundTag 问题。

### 改动

- ★ **FIX#v2n-05-P0**：`v2rayN(xray).json` 顶层从对象改为官方“规则数组”
  - v2rayN 官方 Wiki 明确：自定义路由规则是“一个数组，数组中每一项是一个规则”。
  - 保留 29 条启用规则；额外增加 1 条 `enabled:false` 的 `scki-000-meta` 版本标记，避免 JSON 数组格式下完全丢失产物版本信息。
- ★ **FIX#v2n-06-P0**：DNS 53 规则 `outboundTag` `dns-out` → `direct`
  - 本仓库路径 C 只承诺使用 v2rayN/Xray 的 `proxy` / `direct` / `block` 三个出站。
  - `v2rayN(xray).json` 是路由规则导入文件，不定义 Xray outbounds；继续指向 `dns-out` 会形成悬空引用。
- ★ 版本标记更新为 `v5.2.6-v2n.3`，Build `2026-04-23`，基线对齐 Clash Party v5.2.6。

### 自检

- JSON 顶层为数组 ✓
- 对象总数 30，其中启用规则 29、禁用 metadata 1 ✓
- outboundTag 集合只剩 `proxy` / `direct` / `block` ✓
- `dns-out` 残留 0 ✓

### 官方文档证据

- [v2rayN Wiki: Description of custom routing rules](https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules)：官方示例为 JSON 数组。
- [Xray / V2Ray Routing RuleObject](https://xtls.github.io/config/routing.html#ruleobject)：路由规则通过 `outboundTag` 指向已存在出站。

## v5.2.5-v2n.2 (2026-04-22) — geosite 类别兼容修复 + 版本对齐

深度审查发现 `即时通讯` 规则里 `geosite:kakaotalk` 在 **v2fly/domain-list-community 里不存在**
（仓库只有 `kakao` 类别，不带 `talk` 后缀；Loyalsoldier 扩展集同样没有）。规则加载后
silent match 0 domains，KakaoTalk 流量会下沉到 geoip / FINAL，分流不符预期。

### 改动

- ★ FIX#v2n-01-P1：**`geosite:kakaotalk` → `geosite:kakao`**（v2fly 官方类别）+ 补三个显式 domain 兜底
  - `domain:kakao.com` / `domain:kakaocorp.com` / `domain:kakaotalk.com`
  - 其他 geosite 类别（`huggingface` / `anthropic` / `perplexity` / `copilot` / `gemini` / `bard` / `openai` 等 AI 新类别）
    已逐一核对上游存在（v2fly 有 `huggingface.co/hf.co/hf.space` 等），保留
- ★ FIX#v2n-02-P2：`_meta.version` `v5.2.3-v2n.1` → **`v5.2.5-v2n.2`**（主版本对齐 Clash Party JS `VERSION='v5.2.5'`）
- ★ FIX#v2n-03-P2：`_meta.build` `2026-04-20` → `2026-04-22`；`_meta.baseline` `v5.2.4` → `v5.2.5`
- ★ FIX#v2n-04-P2：`remarks` 顶层字段 `v5.2.3` → `v5.2.5`

### 复核其他 audit 发现（保留，不改）

- **`_meta` 顶层键**：v2rayN 保存时需要 `_meta` 做 UI 展示；Xray-core 的 JSON 解析器默认 `DisallowUnknownFields=false`，`_meta` 会被忽略。保留。
- **`dns-out` outboundTag**：由 v2rayN 主配置补 outbound 定义（参考 `v2rayN/README.md`），本 routing 片段不包含 outbound 定义符合设计。保留。
- **其他 98 个 geosite 类别**：已随机抽样确认 v2fly / Loyalsoldier 覆盖，未发现其他缺失。

### 自检

```
python3 -c 'import json; d=json.load(open("v2rayN/v2rayN(xray).json")); print(d["_meta"]["version"])'
→ v5.2.5-v2n.2 ✓
rules 数量:                 29（不变）
kakaotalk → kakao + domain: 已修 ✓
_meta.version 以 v5. 开头:  ✓（CLAUDE.md §5 期望）
```

### 官方文档证据

- [v2fly/domain-list-community data/kakao](https://github.com/v2fly/domain-list-community/tree/master/data)（存在）vs `data/kakaotalk`（404）
- [v2fly/domain-list-community data/huggingface](https://raw.githubusercontent.com/v2fly/domain-list-community/master/data/huggingface) 存在（hf.co / hf.space / huggingface.co）

---

## v5.2.3-v2n.1 (2026-04-20) — 初版

- ★ 基于 Clash Party v5.2.3 提取关键业务域名，生成 Xray routing rule
- ★ 29 条路由规则，分发：
  - `proxy` × 20（AI / 加密货币 / 流媒体 / 社交 / 开发者 / GFW 等业务组折叠到 proxy 出站）
  - `direct` × 6（私有网段 / 国内网站 / 国内流媒体 / 国内游戏 / 苹果服务默认 / BT tracker）
  - `block` × 2（广告拦截 / Windows Delivery Optimization 端口 7680）
  - `dns-out` × 1（DNS 劫持）
- ★ 使用 geosite + geoip 关键字组合：`geosite:openai` / `geosite:netflix` / `geoip:cn` 等
- ★ 包含 `_meta` 元数据块（`name` / `version` / `build` / `baseline` / `note` / `changelog`），方便 v2rayN UI 展示

### 已知限制（Xray 核的设计约束，非 bug）

- ❌ 无 28 业务组 → 9 区域组的两层结构（Xray routing 只有 proxy / direct / block 三出站）
- ❌ 无 LightGBM 自动择优
- ❌ 无 Smart 组 `uselightgbm: true`
- ❌ 无 373+ rule-provider 自动更新（Xray 依赖 `geosite.dat` / `geoip.dat` 数据库，不是 rule-provider 机制）
- ⚠️ `geosite:snapchat` 等关键字依赖 v2rayN 集成的 geosite 数据库；少量在 Clash 里使用的分类名在 v2fly 的 geosite 里可能不存在

要完整体验请改用路径 A（mihomo 核）或路径 B（sing-box 核），详见 `v2rayN/README.md`。
