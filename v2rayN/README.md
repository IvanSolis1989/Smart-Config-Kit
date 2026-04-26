# v2rayN 使用教程（对齐 Clash Party v5.2.6）

> 路径 C（Xray 核）产物：`v2rayN/v2rayN(xray).json` v5.2.6-v2n.3（详见 `v2rayN/CHANGELOG.md`）。

> 本目录提供 Windows 客户端 **v2rayN** 的接入说明。
> v2rayN 本身不是内核，它是一个「多核心调度器」——可以切换到 **mihomo（推荐）/ sing-box / Xray** 三种核心。
> 因此这里给出 **三条导入路径**，按功能完整度从高到低排列，你任选一条即可。
>
> 最低 v2rayN 版本：**7.0** 及以上（低版本不支持 mihomo / sing-box 多核切换）
> 下载地址：https://github.com/2dust/v2rayN/releases

---

## 🚀 零基础快速开始

### 这是什么？
v2rayN 是 Windows 上最流行的代理客户端，**免费、开源、中文界面**。它自己不是内核，而是调度「mihomo / sing-box / Xray」三种核心，你选哪种核，就吃对应格式的配置文件。

### 我要准备什么？
1. **Windows 10 / 11 电脑**（macOS / Linux 请看对应目录）
2. **[v2rayN 最新版](https://github.com/2dust/v2rayN/releases)**（下 `v2rayN-windows-64-SelfContained.zip` 最简单，解压双击即用）
3. **一个机场订阅 URL**
4. **v2rayN 7.0+**（低版本不支持 mihomo/sing-box 多核切换）

### 一句话决定走哪条路径
- **想要 Smart + LightGBM 自动择优** → **不要用 v2rayN**（做不到），用 **Clash Verge Rev / Mihomo Party**（看仓库 `Clash Party/README.md`）
- **想要 31 业务组 + 9 区域组的完整体验** → **路径 A**（mihomo 核）或 **路径 B**（sing-box 核）
- **只要基础上网，节点池共用一个** → **路径 C**（Xray 核，导入本目录的路由 JSON）

### 3 条路径的 3 分钟速览

| 步骤 | 路径 A（mihomo） | 路径 B（sing-box） | 路径 C（Xray） |
|---|---|---|---|
| 1. 换核心 | 设置 → 核心基础设置 → mihomo | 设置 → 核心基础设置 → sing-box | （保持默认 Xray）|
| 2. 导入配置 | 订阅 → 新增 Clash 订阅，URL 填 CMFA YAML | 自定义配置服务器 → 导入 `SingBox(sing-box)-full.json` | 路由设置 → 导入 `v2rayN(xray).json` |
| 3. 加节点 | Clash 订阅会自动带节点 | JSON 里占位节点替换成你机场的 | 正常通过 v2rayN 订阅加节点 |
| 规则数 | 375+ | 39 remote rule_set + 623 route rules | 29 启用规则 |
| 业务组 | 25 | 25 | ❌ 只有 proxy/direct/block |

详见下面的「🎯 三条路径总览」和各路径详解。

### 跑起来怎么验证？
- 浏览器打开 `https://www.google.com` 能打开 = 代理通了
- v2rayN 右下角托盘图标应该是绿色/彩色（有流量）
- 路径 A / B 下，主面板应能看到 25+ 个策略组；路径 C 下没有业务组（Xray 限制）

### 最常见踩坑
- ❌ **v2rayN 版本太旧**：6.x 以下无 mihomo/sing-box 多核支持。升级到 7.0+。
- ❌ **路径 A 报"找不到 mihomo.exe"**：首次切换到 mihomo 核心时 v2rayN 会自动下载；如果没弹下载提示，去 https://github.com/MetaCubeX/mihomo/releases 手动下 `mihomo-windows-amd64.exe`，重命名为 `mihomo.exe` 放到 `v2rayN/bin/mihomo/` 目录。
- ❌ **Windows Defender 报 mihomo.exe 是病毒**：误报。添加信任即可。
- ❌ **Codex / ChatGPT 还是 403**：这不是分流问题（你已经走美国节点了）。是机场节点是 DC IP 被 OpenAI 风控。换住宅 IP 节点或套 Cloudflare WARP。
- ❌ **我能直接加载 `ClashParty(mihomo-smart).js` 吗**：**不能**。v2rayN 没实现 JS 覆写执行器。要 LightGBM 请换 Clash Verge Rev / Mihomo Party，见 FAQ Q3。

---

## 🔌 协议支持（按 v2rayN 核心切换）

v2rayN 自己不实现协议，它调度三个下层内核，协议支持 = 你选的核支持的协议：

| 协议 | Xray 核（默认） | mihomo 核 | sing-box 核 |
|---|:-:|:-:|:-:|
| **Shadowsocks (SS) + 2022** | ✅ | ✅ | ✅ |
| **ShadowsocksR (SSR)** | ❌ | ✅ | ❌ |
| **VMess** | ✅（原产地）| ✅ | ✅ |
| **VLESS + REALITY + XTLS-Vision** | ✅（原产地）| ✅ | ✅ |
| **Trojan** | ✅ | ✅ | ✅ |
| **Hysteria v1** | ❌ | ✅ | ✅ |
| **Hysteria 2** | ❌ | ✅ | ✅ |
| **TUIC v5** | ❌ | ✅ | ✅ |
| **WireGuard** | ⚠️ 实验 | ✅ | ✅ |
| **AnyTLS / ShadowTLS** | ❌ | ✅ | ✅ |
| **Snell / Mieru** | ❌ | ✅ | ❌ |
| **SOCKS5 / HTTP(S)** | ✅ | ✅ | ✅ |

**选核一句话建议**：
- 机场给 **VLESS + REALITY** → Xray 核（原产地，性能最好）
- 机场给 **Hysteria 2 / TUIC** → mihomo 核 或 sing-box 核
- 想要**所有协议都能跑** → mihomo 核（本仓库路径 A 推荐）
- 想要**SSR 兼容** → 只有 mihomo 核支持

### 切核心的方法
v2rayN → 菜单 **设置 → 参数设置 → 核心基础设置** → 勾选要用的那个。首次切换时 v2rayN 会提示下载对应二进制（mihomo.exe / sing-box.exe），若自动下载失败到官方 release 页面手动下。

---

## 🎯 三条路径总览

| 路径 | 核心 | 使用文件 | 业务组 | 区域组 | LightGBM 自动择优 | 推荐度 |
|---|---|---|---:|---|---|---|
| **A（强烈推荐）** | mihomo (Clash.Meta) | `Clash Meta For Android/CMFA(mihomo).yaml` | 31 业务 select | 9 `url-test` | ❌（YAML 不含 `type: smart`） | ★★★★★ |
| **B** | sing-box | `SingBox/SingBox(sing-box)-full.json` | 31 业务 selector | 9 selector/urltest | ❌（sing-box 无此特性） | ★★★★ |
| **C（仅兜底）** | Xray | `v2rayN/v2rayN(xray).json` | **只有 3 出站** | — | ❌ | ★★ |

**v2rayN 不能直接加载 Clash Party 的 JS 覆写脚本**（这是本节最关键的事实）：
- `Clash Party/ClashParty(mihomo-smart).js` 顶部以 `function main(config) { … return config }` 为入口，这是 **Clash Verge Rev / Mihomo Party 的 JS 扩展格式**——客户端在解析完 YAML 之后会调用这个函数，再把返回值交给 mihomo 内核。
- **v2rayN 没有实现这套 JS 扩展执行器**。它的 Clash 通道只做 `下载 YAML → 注入 v2rayN 自用字段 → 交给 mihomo 二进制` 这三步，没有脚本预处理层。所以把 `.js` 文件丢给 v2rayN 不会起任何作用。

**推论：LightGBM / Smart 组在 v2rayN 里天然不可达**
- Clash Party JS 正是在 `main()` 里把 9 个区域组注入为 `type: smart` + `uselightgbm: true` 的；这一步 v2rayN 无法执行。
- `Clash Meta For Android/CMFA(mihomo).yaml` 是**静态 YAML 产物**（基于 JS 脚本的输出冻结而来），区域组是 `type: url-test`（按 `gstatic/generate_204` 延迟择优），**不含 smart 组，也没有 LightGBM**。这是 CMFA / FlClash / v2rayN 这类「原生 YAML」客户端的通用状态。
- 想在 Windows 上获得完整的「Smart + LightGBM」体验，正确做法是**换客户端**：用 **Clash Verge Rev / Mihomo Party / Clash Party**（都原生支持 JS 覆写 + mihomo Alpha 内核）直接加载 `Clash Party/ClashParty(mihomo-smart).js`。v2rayN 的路径 A / B / C 都达不到这个能力。

**为什么路径 C 最弱？**
Xray 核心的路由规则只能指向 `proxy / direct / block` 三个出站，无法表达 31 业务 + 9 区域 两层结构，更不能 LightGBM 择优。仅适合不想换核心、只需要基础分流的用户。

### 多机场订阅合并（所有路径通用）

如果你同时买了多家机场，可以用**在线订阅转换站**把多个链接合并成一个 URL，无需安装任何工具，所有客户端通用。

1. 打开 https://acl4ssr-sub.github.io （或 https://sub.v1.mk）
2. 把多家机场订阅链接粘贴进去（一行一个或用 `|` 分隔）
3. 后端选 **Mihomo（Clash.Meta）**
4. 生成新 URL：
   - **路径 A**：填入 CMFA YAML 的 `proxy-providers.Subscribe.url`
   - **路径 B**：将节点从新 URL 解析后填入 sing-box JSON 的 `outbounds` 段
   - **路径 C**：将新 URL 作为 v2rayN 常规订阅添加

> ⚠️ **隐私提醒**：转换站能看到你提交的订阅链接（含 token）。不要提交含专线 IP 等敏感信息的订阅链接。

---

## 路径 A：mihomo 核心 + Clash YAML（推荐）

这是 v2rayN 路径里**最接近 Clash Party 主线**的方案：31 业务组、9 区域 `url-test` 组、375+ rule-provider 全部原样生效，策略结构和 CMFA 完全一致。
> ⚠️ 注意：`CMFA(mihomo).yaml` 是静态 YAML，区域组是 `type: url-test`（延迟择优），**不含 `type: smart` / `uselightgbm: true`**。LightGBM 自动择优不会启用；若需要此特性，请参见文首「关于 LightGBM / Smart 组的重要说明」。

### 1. 在 v2rayN 里启用 mihomo 核心

1. 打开 v2rayN → 菜单栏 **设置 → 参数设置 → 核心基础设置**。
2. 勾选/切换到 **mihomo**。
3. 首次使用时 v2rayN 会提示下载 `mihomo.exe`（若没自动下载，到 https://github.com/MetaCubeX/mihomo/releases 手动下）。
4. 本 YAML 使用普通 mihomo Stable 即可；**无需** Smart Alpha 分支，因为本 YAML 里没有 `type: smart` 组。

### 2. 准备 YAML

1. 复制仓库里的 **`Clash Meta For Android/CMFA(mihomo).yaml`** 到本地。
2. 打开它，找到 `proxy-providers → Subscribe → url`，把占位 URL 改成你自己的机场订阅（`?flag=clash.meta` 或 `?flag=meta`）：
   ```yaml
   proxy-providers:
     Subscribe:
       type: http
       url: 'https://your-subscription.example.com/link'
       interval: 86400
       path: ./proxy_providers/subscribe.yaml
   ```

### 3. 导入到 v2rayN

1. v2rayN 左侧 **订阅（Subscription）** → **订阅组设置** → ➕ 新建。
2. 地址栏可以填：
   - **本地文件路径**（`file:///C:/path/to/CMFA(mihomo).yaml`），或
   - **托管 URL**（把 YAML 放到 GitHub Raw / Gist / 自建 HTTP）。
3. **订阅类型**选 **Clash**（即 mihomo 格式）。
4. 保存 → 右键新建的订阅 → **更新订阅**。
5. v2rayN 下方日志窗口应看到 mihomo 启动 + 规则加载完成。

### 4. 验证

在 v2rayN 的 **代理组/策略组** 面板里应看到：
- 9 区域 `url-test` 组（🌍 全球、🇭🇰 香港、🇹🇼 台湾、🇯🇵 日韩、🌏 亚太、🇺🇸 美国、🇪🇺 欧洲、🌎 美洲、🌍 非洲），延迟最低的节点自动被选中；无 LightGBM 自动择优
- 31 业务组（🤖 AI 服务、💰 加密货币、…、🛑 广告拦截）

然后按 `Clash Party/README.md` 第七节「业务组推荐配置」给每个业务组指定一个区域组即可。

### 5. DNS / Sniffer / GeoX URL（重要）

mihomo 会读取 YAML 里写的 dns/sniffer 块。但 v2rayN 默认用系统 DNS；如果你想 100% 复刻 Clash Party 的 DNS 行为，需要：

1. 保持 YAML 里 `dns:` / `sniffer:` / `geox-url:` 段完整（CMFA YAML 已内置）。
2. v2rayN 设置 → **参数设置 → 核心基础设置** → 勾选 **使用配置文件里的 DNS 设置**。
3. **不要**再在 v2rayN 路由规则里覆盖，否则会和 YAML 打架。

---

## 路径 B：sing-box 核心 + JSON

适合「想把 v2rayN 当 sing-box 前端」的用户。支持 31 业务组 + 9 区域组，靠 sing-box 原生 `selector` / `urltest` 实现；但没有 LightGBM 自动择优（sing-box 无此特性）。

### 1. 启用 sing-box 核心

1. v2rayN → **设置 → 参数设置 → 核心基础设置** → 切到 **sing-box**。
2. 首次使用会提示下载 `sing-box.exe`，或到 https://github.com/SagerNet/sing-box/releases 手动下。

### 2. 准备 JSON

从本仓库选一个：

| 文件 | 规则量 | 适合 |
|---|---:|---|
| `SingBox/SingBox(sing-box)-full.json`（推荐） | 39 remote rule_set + 623 route rules | 与 Clash Party 关键路径对齐且保证 SRS 兼容 |

打开 JSON，找到 `outbounds` 里 `"type": "trojan"` / `"type": "vless"` 的占位节点，替换成你自己的节点配置。

### 3. 导入

1. v2rayN → 左侧 **自定义配置服务器（Custom Config Server）** → ➕ 新建。
2. 选 **本地 sing-box JSON 文件**，指向你修改好的 `SingBox(sing-box)-full.json`。
3. 右键该条目 → **设为活动节点**。

### 4. 验证

v2rayN 主面板状态栏应显示 sing-box 已启动；打开 `http://127.0.0.1:9090/ui`（若启用了 clash dashboard）可看到 9 区域 + 31 业务组。

---

## 路径 C：Xray 核心 + 本目录的路由 JSON（功能受限）

**仅适合已有 v2rayN + Xray 配置、不想切换核心**的用户。

### 1. 导入路由规则

1. v2rayN → 菜单 **路由设置（Routing）** → **导入规则集**。
2. 选本目录的 **`v2rayN(xray).json`**。
3. 导入后在「路由设置」面板应出现 29 条启用规则（广告拦截 / DNS / 私有直连 / AI / 加密货币 / 社交 / 流媒体 / GFW / 中国直连 / FINAL），另有 1 条禁用的版本标记规则。

> 注意：v5.2.6-v2n.3 起本文件是 v2rayN 官方导入格式：JSON 顶层就是规则数组，不再包一层 `_meta` / `rules` 对象。

### 2. 节点放哪里

路径 C **不处理节点来源**——节点走 v2rayN 原来的订阅即可。路由规则生效的前提是：
- 默认 `proxy` 出站 = 你手动选中的那个节点。
- 默认 `direct` = 直连。
- 默认 `block` = Xray 内置 block outbound。
- DNS 53 规则也走 `direct`，因为本路由导入文件不定义 `dns-out` 出站。

### 3. 已知限制（相对于 Clash Party 主线）

- ❌ 无 31 业务组 → 9 区域组的两层结构。所有 `proxy` 规则指向同一个节点。
- ❌ 无 LightGBM 自动择优。
- ❌ 无 Smart 组 `uselightgbm: true`。
- ❌ 无 373+ rule-provider 自动更新（Xray 依赖 `geosite.dat` / `geoip.dat` 数据库，不是 rule-provider）。
- ⚠️ `geosite:xxx` 关键字依赖 v2rayN 集成的 geosite 数据库；少量我们在 Clash 里用的分类可能在 v2fly 的 geosite 里叫别的名字（例如 `geosite:openai` 对应 v2fly 的 `category-ai-!cn`）。

**结论：路径 C 适合作为「还没准备好换核心的用户」的过渡方案。条件允许请切到路径 A 或 B。**

---

## 常见问题（FAQ）

### Q1：v2rayN 启动后没有 31 业务组？
- 路径 A / B：确认核心选对了（mihomo 或 sing-box），而不是默认的 Xray。
- 路径 C：Xray 本身不支持多业务组，这是设计限制。

### Q2：AI 服务默认都走「🇺🇸 美国节点」了，为什么 Codex CLI 还 403？
- 这不是分流问题。`cf-ray: *-SJC` 说明流量确实从美国出去了。
- 403 通常是 Cloudflare + OpenAI 对 **机房 IP / 非住宅 ASN** 的风控。换住宅 IP 节点 / 套 Cloudflare WARP / 检查账号注册地区三选一即可。
- 详见仓库根目录 `README.md` 的「AI 服务连接问题」章节（若有）。

### Q3：v2rayN 能直接加载 `ClashParty(mihomo-smart).js` 吗？

**不能。** 这份脚本的入口是 `function main(config) { … return config }`，是 **Clash Verge Rev / Mihomo Party 的 JS 扩展格式**——由客户端在解析完 YAML 之后调用这个函数，再把返回值送进 mihomo 内核。**v2rayN 没有实现这套 JS 扩展执行器**，它的 Clash 通道只做「下载 YAML → 注入自用字段 → 交给 mihomo」三步，没有脚本预处理层。把 `.js` 直接喂给 v2rayN 不会起任何作用。

想在 Windows 上得到 Clash Party 的完整运行效果（含 Smart 组 + LightGBM），可行路径有三个，按推荐度排列：

1. **换客户端（最省事，也是我们推荐的）**：用 [**Clash Verge Rev**](https://github.com/clash-verge-rev/clash-verge-rev) 或 [**Mihomo Party**](https://github.com/mihomo-party-org/mihomo-party) 代替 v2rayN。它们原生支持加载 `.js` 覆写，开箱就是 `type: smart` + `uselightgbm: true` + LightGBM 自动择优。
2. **自己搭前置流水线**：用 Node.js 在本地把「订阅 YAML + 本脚本」跑一遍 `main(config)`，输出一份静态 YAML，再把产物交给 v2rayN 的 mihomo 核心。技术可行，但要自己维护 Node 环境和运行封装；**不在本仓库支持范围内**。
3. **手工魔改 CMFA YAML（最低保留度）**：把 `Clash Meta For Android/CMFA(mihomo).yaml` 中 9 个区域组的 `type: url-test` 改为 `type: smart`，再追加 `uselightgbm: true`。同时把 v2rayN 的 mihomo 换成 [Prerelease-Alpha](https://github.com/MetaCubeX/mihomo/releases/tag/Prerelease-Alpha)，并把 `Model.bin`（下载自 https://github.com/vernesong/mihomo/releases/download/LightGBM-Model/Model.bin）放到 `v2rayN/bin/mihomo/Model.bin`。这样只能启用 LightGBM 一项，其他 JS 脚本里的动态能力（节点过滤、指纹注入、fpByPurpose）仍然没有，**且该魔改不在仓库基线覆盖范围，未来不保证同步**。

### Q4：Windows Defender / 360 报毒？
- `mihomo.exe` / `sing-box.exe` 会被部分杀毒软件误报为代理工具。添加信任即可。
- 若路径 A 更新订阅频繁失败，检查杀软是否拦截 `v2rayN\bin\mihomo\` 写入 cache.db / ruleset 目录。

### Q5：路径 A 下，jsdelivr rule-provider 冷启动下载失败？
- CMFA YAML 的 `rule-providers.proxy` 已统一改为 `'🚫 受限网站'`（与 Clash Party FIX#17-P0 一致）。
- 确保你第一次导入时 **已经连上代理**，否则 373 个 rule-provider 会卡在 403/超时。
- 若仍失败，把 YAML 顶部 `geox-url` 段的 jsdelivr 换成 cdn.jsdelivr.net 或自建镜像。

---

## 版本与同步策略

- 本目录所有产物跟随 Clash Party 主线（`Clash Party/ClashParty(mihomo-smart).js`）。
- 路径 A / B 的实际规则来源是 `Clash Meta For Android/` 与 `SingBox/` 目录，**不在本目录重复维护**。
- 只有路径 C 的 `v2rayN(xray).json` 是本目录的独立产物，需要按仓库根目录 `CLAUDE.md` / `AGENTS.md` 的约束同步更新。

## 致谢

- [v2rayN](https://github.com/2dust/v2rayN)
- [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo)
- [SagerNet/sing-box](https://github.com/SagerNet/sing-box)
- [XTLS/Xray-core](https://github.com/XTLS/Xray-core)
- 所有本仓库上游规则维护者（MetaCubeX / blackmatrix7 / Loyalsoldier / szkane / Accademia 等）
