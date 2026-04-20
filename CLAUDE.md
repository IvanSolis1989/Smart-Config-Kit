# CLAUDE.md — 仓库维护契约（AI 必读）

> 本文件是 Smart-Config-Kit 仓库的**强约束维护契约**，所有自动化代理（Claude Code、Codex、Copilot 等）在修改本仓库前**必须完整阅读并遵守**。
> 违反以下任何一条，PR 必须退回重做。

---

## 0. 仓库定位

本仓库维护「**同一套 Mihomo Smart 分流策略**」在 7 个客户端形态下的等价实现：

| # | 形态 | 文件 | 角色 |
|---|------|------|------|
| 0 | **Clash Party**（JS 覆写脚本） | `Clash Party/Clash Smart内核覆写脚本.js` | **唯一主线 / 事实基线** |
| 1 | Clash Meta For Android（原生 YAML） | `Clash Meta For Android/clash-smart-cmfa.yaml` | 从属 |
| 2 | OpenClash 轻量版（shell + heredoc YAML） | `OpenClash/openclash_custom_overwrite.sh` | 从属（低内存裁剪） |
| 3 | OpenClash 完整版（shell + heredoc YAML） | `OpenClash/openclash_custom_overwrite_full.sh` | 从属（全量） |
| 4 | Shadowrocket（iOS SR 私有 conf） | `Shadowrocket/shadowrocket-smart.conf` | 从属 |
| 5 | SingBox 常规版（JSON） | `SingBox/singbox-smart.json` | 从属 |
| 6 | SingBox 完整版（JSON，由脚本生成） | `SingBox/singbox-smart-full.json` + `SingBox/generate-singbox-full.js` | 从属（生成产物） |
| 7 | v2rayN Xray 路由 JSON | `v2rayN/v2rayn-smart-xray-routing.json` | 从属（仅 Xray 核心兜底；v2rayN 推荐用 mihomo/sing-box 核心直接加载 #1 或 #5/#6） |

**基线原则：** Clash Party JS 脚本是唯一的「**策略权威源**」。其他产物必须在语义上与其一致；仅在平台能力受限处允许差异（见 §3）。

> **关于 v2rayN：** v2rayN 是多核调度器，不是独立内核。推荐使用路径是在 v2rayN 里切到 mihomo 或 sing-box 核心，然后加载 #1 / #5 / #6；这种情况下 v2rayN 本身不是独立产物，无需单独同步。仅当 v2rayN 用户坚持走 Xray 核心时才用到 `v2rayN/v2rayn-smart-xray-routing.json`（功能裁剪版，只有 proxy/direct/block 三出站），此文件是独立产物，受本文约束。

---

## 1. 每次修改「规则 / 策略组 / DNS」都必须全版本联动 ⚠️

> 这是本仓库最**核心且不可违反**的规则。

### 1.1 触发条件（任一满足即必须全版本联动）

- 新增/删除/重命名**任何代理组**（含 9 个 Smart 区域组与 28 个业务组）
- 新增/删除/修改**任何 rule-provider**（含 URL、behavior、format、interval、proxy 字段）
- 修改**规则条目的目标组**（例如把 `RULE-SET,tiktok` 从 `📱 社交媒体` 改到其他组）
- 修改**规则顺序**中影响命中优先级的段（特别是广告拦截、GFW、FINAL 前置关系）
- 修改 **DNS / Sniffer / fake-ip / GeoX URL / LightGBM URL** 等全局行为
- 修改 **规则源仓库**（MetaCubeX / blackmatrix7 / Loyalsoldier / szkane / Accademia 等）

### 1.2 强制动作清单（Per-PR Checklist）

若本次改动命中上述任一触发条件，PR 必须：

1. **先改 Clash Party JS 主线**（`Clash Party/Clash Smart内核覆写脚本.js`），作为唯一权威源。
2. **同步修改全部 7 个产物文件**（或明确在 PR 说明里标注为何某个产物不受影响）：
   - `Clash Meta For Android/clash-smart-cmfa.yaml`
   - `OpenClash/openclash_custom_overwrite.sh`
   - `OpenClash/openclash_custom_overwrite_full.sh`
   - `Shadowrocket/shadowrocket-smart.conf`
   - `SingBox/singbox-smart.json`
   - `SingBox/singbox-smart-full.json`（通过 `node SingBox/generate-singbox-full.js` 重新生成，不允许手工改）
   - `v2rayN/v2rayn-smart-xray-routing.json`（仅当业务组/规则类别发生变化时需同步；Xray 只有 proxy/direct/block 三出站，单纯区域选择/LightGBM 调整可豁免）
3. **同步更新每个产物头部的「介绍 / 更新日志 / 版本号」注释块**（见 §1.3 强制注释字段）。
4. **同步更新文档**：`README.md`、对应的 `使用方法.md` / `使用教程.md`、必要时 `CHANGELOG`。
5. **自检命令必须通过**（§2）。
6. **提交前在 PR 描述里列出「影响面」**：
   - 改动的代理组 / rule-provider / 规则行数
   - 每个产物的同步位置（行号或 commit diff 摘要）
   - 手动跳过同步的产物及原因

### 1.3 强制的「头部注释 + 更新日志 + 版本号」规范 ⚠️

每个产物文件开头都有一段**简介 + 更新日志 + 版本号**注释块。**每次改动必须同步更新此注释块**——这是本仓库追踪历史的唯一权威来源，PR 描述仅作辅助。

**必须包含的字段（按顺序）：**

1. **产物名称 + 版本号**（与 Clash Party 主版本对齐，加平台后缀）
2. **Build 日期**（YYYY-MM-DD）
3. **基线对齐声明**（写明「对齐 Clash Party vX.Y.Z」或「独立平台修复，不影响基线」）
4. **本次变更列表**（至少 1 条，用 ★ / FIX#N 等前缀做编号）
5. **保持不变的核心架构**（可选，但建议每次重写一遍，方便用户快速确认什么没被动）
6. **若有风险或代价，必须标注**（例如 OOM 风险、首次命中延迟、iOS 平台限制）

**对应到各产物文件的位置：**

| 文件 | 头部注释位置 | 版本变量/字段 |
|------|--------------|----------------|
| `Clash Party/Clash Smart内核覆写脚本.js` | 顶部 `/* ... */` 块 | JS 内 `VERSION` / `const VERSION_TAG` |
| `Clash Meta For Android/clash-smart-cmfa.yaml` | 顶部 `# ... ` 注释块 | 第一行 `# Clash Smart vX.Y.Z - CMFA` |
| `OpenClash/openclash_custom_overwrite.sh` | `#!/bin/bash` 下方 `# ==` 块 | `VERSION_TAG="vX.Y.Z-oc-slim"` |
| `OpenClash/openclash_custom_overwrite_full.sh` | `#!/bin/bash` 下方 `# ==` 块 | `VERSION_TAG="vX.Y.Z-oc-full"` |
| `Shadowrocket/shadowrocket-smart.conf` | 顶部 `# ══…` 双线框注释 | 第 2 行 `# Shadowrocket Smart vX.Y.Z-SR.N` |
| `SingBox/singbox-smart.json` | JSON 无原生注释，改在 `log.tag` 或 `experimental._meta` 里标记 | — |
| `SingBox/singbox-smart-full.json` | 由 `SingBox/generate-singbox-full.js` 自动注入 `_meta.version` + `_meta.clash_party_sync` | 生成脚本版本 |
| `SingBox/generate-singbox-full.js` | 顶部 `// ==` 注释块 | JS 内常量 |
| `v2rayN/v2rayn-smart-xray-routing.json` | 顶层 `_meta` 对象（`name` / `version` / `build` / `baseline` / `changelog`） | `_meta.version` |

**触发更新的最小粒度：**

- **任何**代码/规则/注释以外的变更 → 必须 bump 版本号尾段（例如 `v5.2.2-SR.1` → `v5.2.2-SR.2`）
- **任何** Clash Party 主线版本号 bump → 全部产物主版本号必须同步 bump
- **任何**一次提交，头部 "本次变更" 至少新增 1 行说明做了什么；不允许只改代码不改注释

**若发现某文件的头部注释版本号与实际代码状态不符（或缺少变更日志）：** 当前 PR 必须顺手修正，不得留作后续 TODO。

---

### 1.4 允许的「不同步」例外

仅以下情况允许单一版本改动：

- **平台专属字段**（例如 CMFA 的 `find-process-mode: strict`，OpenClash 的 `CORE_TYPE`，SR 的 `skip-proxy`，sing-box 的 `inbounds.tun`）。
- **平台专属 bug 修复**（例如 CMFA 特定内存泄漏、SR iOS 进程限制）。
- **平台专属文档**（`使用方法.md` / `使用教程.md` 只改本目录对应的版本）。

但即便如此，PR 描述里必须写清楚「为什么其他版本无需同步」。

---

## 2. 每次修改都必须严格审查并学习对应 APP 的官方文档 ⚠️

> 口头说「已兼容」无效。必须**提供链接或官方字段名引用**作为兼容性证据。

### 2.1 强制审查的官方文档清单

| 产物 | 必读官方文档 |
|------|--------------|
| Clash Party JS | https://wiki.metacubex.one/ · https://wiki.metacubex.one/config/ · Mihomo Smart 内核（`lgbm-custom-url` 字段、`uselightgbm`、`include-all-proxies`） |
| CMFA YAML | https://wiki.metacubex.one/config/proxy-groups · https://wiki.metacubex.one/config/dns · CMFA README（GitHub `MetaCubeX/ClashMetaForAndroid`） |
| OpenClash（slim + full）| https://github.com/vernesong/OpenClash/wiki · OpenClash 覆写脚本官方模板 · UCI 配置键 |
| Shadowrocket | https://help.shadowrocket.net/ · `policy-regex-filter` / `RULE-SET` / `fallback-dns-server` 的官方文档或社区权威说明 |
| SingBox（slim + full）| https://sing-box.sagernet.org/configuration/ · 特别是 `route.rule_set`、`outbounds/selector`、`outbounds/urltest`、`dns`、`inbounds.tun`、`experimental.cache_file` |

### 2.2 必做的兼容性核对步骤

改动涉及新字段或跨版本字段时，**必须**：

1. **字段存在性核对**：在目标 APP 的官方文档里定位该字段，确认拼写、层级、取值范围。
2. **版本兼容性核对**：确认该字段在目标 APP 的**最低支持版本**，并与 `使用方法.md` 中声明的最低版本一致。
   - 例：sing-box 1.11+ 已用 `action` + `outbound` 替代旧 `outbound` 直接绑定；改动必须符合当前目标内核。
   - 例：mihomo Smart 内核的 `uselightgbm` 属于 Alpha 分支能力，不能下放到稳定分支的 Clash 核心。
3. **格式核对**：
   - Clash YAML：`rule-providers` 的 `behavior` ∈ {`domain`, `ipcidr`, `classical`}；`format` ∈ {`yaml`, `text`, `mrs`}。
   - Shadowrocket：`RULE-SET,<url>,<policy>` 不支持 `rule-provider` 节。策略名里的 emoji **必须与组定义完全一致**（含 ZWJ `\u200D`）。
   - sing-box：`rule_set` 的 `format` ∈ {`binary`, `source`}；`.srs` 必须配 `binary`。
4. **PR 描述里粘贴官方文档锚点**（URL + 字段名），审阅者可一键验证。

### 2.3 禁止事项

- ❌ 禁止凭记忆、训练数据或"经验"判定字段兼容性。
- ❌ 禁止把一份 APP 的语法（例如 Clash classical）直接复制到另一份（例如 sing-box）。
- ❌ 禁止使用已被官方标记 deprecated 的字段，除非有对应客户端版本兜底说明。
- ❌ 禁止在没有核对的情况下更改规则源（geosite.dat/geoip.dat）的 URL 或 release 分支。

---

## 3. 跨平台一致性矩阵（强制对齐项）

### 3.1 代理组命名（9 区域 + 28 业务，共 37 组）

区域组名称（emoji 必须逐字节一致，包含 RGI 旗帜序列）：

```
🌍 全球节点 · 🇭🇰 香港节点 · 🇹🇼 台湾节点 · 🇯🇵 日韩节点 · 🌏 亚太节点
🇺🇸 美国节点 · 🇪🇺 欧洲节点 · 🌎 美洲节点 · 🌍 非洲节点
```

业务组名称（顺序即 README 展示顺序）：

```
🤖 AI 服务 · 💰 加密货币 · 🏦 金融支付 · 📧 邮件服务 · 💬 即时通讯 · 📱 社交媒体
🧑‍💼 会议协作 · 📺 国内流媒体 · 📺 东南亚流媒体 · 🇺🇸 美国流媒体 · 🇭🇰 香港流媒体
🇹🇼 台湾流媒体 · 🇯🇵 日韩流媒体 · 🇪🇺 欧洲流媒体 · 🕹️ 国内游戏 · 🎮 国外游戏
🔍 搜索引擎 · 📟 开发者服务 · Ⓜ️ 微软服务 · 🍎 苹果服务 · 📥 下载更新
☁️ 云与CDN · 🛰️ BT/PT Tracker · 🏠 国内网站 · 🚫 受限网站 · 🌐 国外网站
🐟 漏网之鱼 · 🛑 广告拦截
```

**禁止**新增/删除/改名这 37 个组；若业务确有需要，必须先在 PR 描述里说明并先改 Clash Party 基线。

### 3.2 Rule-provider 下载代理（`RP_PROXY`）

- 基线（Clash Party v5.2.2 起）：`RP_PROXY = BIZ.GFW = '🚫 受限网站'`
- Clash 家族（CMFA / OpenClash slim / OpenClash full）必须全部使用 `proxy: '🚫 受限网站'`。
- Shadowrocket 不走 rule-provider，自动由 App 更新，豁免。
- sing-box 通过 `route.rule_set` 远程拉取，其走的是全局默认出站，豁免。

> 历史债务：OpenClash slim 之前用 `DIRECT`、CMFA 之前用 `☁️ 云与CDN`，已在本次对齐修复；任何未来改动**禁止回退**。

### 3.3 最终兜底（FINAL）

- Clash 家族：`MATCH,🐟 漏网之鱼`
- Shadowrocket：`FINAL,🐟 漏网之鱼,dns-failed`
- sing-box：`route.final: "🐟 漏网之鱼"`

### 3.4 广告拦截

所有版本的 `🛑 广告拦截` 组必须默认指向 `REJECT` / `block` / `action: reject`；第一条规则必须是广告拦截前置。

---

## 4. 发版与版本号规则

- Clash Party JS 顶部 VERSION 注释是**唯一主版本号**（目前 `v5.2.2`）。
- 其他 5 份产物使用同主版本号 + 平台后缀：
  - `v5.2.2-cmfa.X`、`v5.3.X-oc-slim`、`v5.2.2-oc-full`、`v5.2.2-SR.X`、`v5.2.2-sing.X`
- 平台后缀内部可独立递增，但主版本号必须与 Clash Party 对齐；若不对齐，必须在对应 `使用方法.md` 开头标明原因。

---

## 5. 自检脚本（提交前必须本地跑一遍）

```bash
# 1) 数代理组数（必须为 28 select + 9 url-test/smart）
grep -cE "^- name: " "Clash Meta For Android/clash-smart-cmfa.yaml"            # 期望 37
grep -cE "^- name: " "OpenClash/openclash_custom_overwrite.sh"                  # 期望 37
grep -cE "^- name: " "OpenClash/openclash_custom_overwrite_full.sh"             # 期望 37
grep -cE " = select,|= url-test," "Shadowrocket/shadowrocket-smart.conf"        # 期望 37
python3 -c 'import json;d=json.load(open("SingBox/singbox-smart.json"));print(sum(1 for o in d["outbounds"] if o["type"] in ("selector","urltest")))'       # 期望 38（含顶层 🚀）
python3 -c 'import json;d=json.load(open("SingBox/singbox-smart-full.json"));print(sum(1 for o in d["outbounds"] if o["type"] in ("selector","urltest")))'  # 期望 38

# 2) RP 代理字段
grep -c "proxy: DIRECT" "OpenClash/openclash_custom_overwrite.sh"                    # 期望 0
grep -c "proxy: '☁️ 云与CDN'" "Clash Meta For Android/clash-smart-cmfa.yaml"         # 期望 0
grep -c "proxy: '🚫 受限网站'" "Clash Meta For Android/clash-smart-cmfa.yaml"        # 期望 ≥ 300
grep -c "proxy: 🚫 受限网站" "OpenClash/openclash_custom_overwrite.sh"               # 期望 ≥ 130
grep -c "proxy: \"\\\\U0001F6AB 受限网站\"" "OpenClash/openclash_custom_overwrite_full.sh"  # 期望 ≥ 380

# 3) 禁止死引用（旗帜 emoji 与组名 emoji 必须匹配；忽略注释行）
grep -nE "^[^#].*🇸🇬 亚太节点" "Shadowrocket/shadowrocket-smart.conf"                  # 必须无输出
grep -nE "^[^#].*🎵 TikTok"   "Shadowrocket/shadowrocket-smart.conf"                  # 必须无输出

# 4) JSON 合法性（sing-box + v2rayN 路由）
python3 -c 'import json;json.load(open("SingBox/singbox-smart.json"))'
python3 -c 'import json;json.load(open("SingBox/singbox-smart-full.json"))'
python3 -c 'import json;d=json.load(open("v2rayN/v2rayn-smart-xray-routing.json"));assert d["_meta"]["version"].startswith("v5.");print("v2rayN meta:",d["_meta"]["version"]);print("rules:",len(d["rules"]))'

# 4b) OpenClash full 生成的 override YAML：必须只有 1 个 rule-providers + 1 个 rules 顶层键
#     （Ruby Psych 对重复顶层键 last-wins，会静默丢掉前面的全量内容——本仓库曾在此犯错）
awk '
  /^cat > "\$OVERRIDE_YAML" << .OVERRIDE_EOF./ { inblock=1; next }
  /^cat >> "\$OVERRIDE_YAML" << .OVERRIDE_EOF./ { inblock=1; next }
  /^OVERRIDE_EOF$/ { inblock=0; next }
  inblock { print }
' "OpenClash/openclash_custom_overwrite_full.sh" > /tmp/oc_full_override_probe.yaml
grep -cE "^rule-providers:$" /tmp/oc_full_override_probe.yaml   # 期望 1
grep -cE "^rules:$" /tmp/oc_full_override_probe.yaml             # 期望 1
ruby -ryaml -e '
  d = YAML.load_file("/tmp/oc_full_override_probe.yaml", permitted_classes: [Symbol], aliases: true)
  raise "providers < 380" if (d["rule-providers"] || {}).size < 380   # full 期望 ≈387
  raise "rules    < 900" if (d["rules"]         || []).size < 900     # full 期望 ≈977
  puts "OC full override yaml: providers=#{d["rule-providers"].size} rules=#{d["rules"].size}"
'

# 5) YAML 合法性（可选，需 pyyaml）
python3 -c 'import yaml;yaml.safe_load(open("Clash Meta For Android/clash-smart-cmfa.yaml"))'
```

若任一检查失败，PR 不得合入。

---

## 6. 修改流程（推荐）

```
① 读 Clash Party JS（基线）→ 搞清楚要改什么
② 读目标 APP 官方文档 → 确认新字段/新组在每个产物上的等价写法
③ 改 Clash Party JS → 主线先落地
④ 同步 CMFA → OpenClash(slim+full) → Shadowrocket → SingBox(slim+full)
⑤ 跑 §5 自检命令
⑥ 更新 README + 各 使用方法.md
⑦ PR 描述里写：改动摘要 / 影响矩阵 / 官方文档链接 / 自检输出
```

---

## 7. 底线

- 不同步 = 违规。
- 不核对官方文档 = 违规。
- 删除/改名 37 个代理组之一而未在 PR 说明里论证 = 违规。
- 伪造「已兼容」结论（没有引用官方文档就下结论）= 违规。

> 这些约束是仓库长期可维护性的前提，优先级高于任何「小修快改」的便利。
