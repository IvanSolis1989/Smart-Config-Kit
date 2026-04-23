# Passwall / Passwall2 使用教程（对齐 Clash Party v5.2.6 简化版）

> 配置参考：`Passwall2/` 目录  
> 版本：**v5.2.6-pw2.2**（Build 2026-04-23）  
> 目标：**[Passwall](https://github.com/Openwrt-Passwall/openwrt-passwall)**（全功能版）+ **[Passwall2](https://github.com/Openwrt-Passwall/openwrt-passwall2)**（精简分流版）—— `xiaorouji` 并行维护的两款 OpenWrt 插件，**规则语法同源**（共用 [shunt_rules.lua](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua) 解析器），同一份 `.list` 两者通用。  
> 架构：28 条 shunt rule（展平版，每条对应一个业务类别）+ xray/sing-box 原生域名匹配语法（纯字符串 / `regexp:` / `domain:` / `full:` / `geosite:` / `rule-set:remote|local:` / `geoip:` / CIDR）

---

## 🚀 零基础 5 分钟快速开始

### 这是什么？
一份面向 **Passwall2 / Passwall** 的 **shunt rule（分流规则）参考清单**。**不是** Clash Party 那种自动生成的 YAML——Passwall 没有 proxy-groups 嵌套层级，所以这里把基线的"28 业务组 → 9 区域组"两层结构**手工展平成 28 条 shunt rule**，每条对应一个业务类别，用户手动指定目标节点或负载均衡组。

### 能和不能（诚实对比）
| 能力 | Passwall2（用本参考） | OpenClash（本仓库完整支持） |
|---|:-:|:-:|
| 基础分流（AI / 流媒体 / 支付 / GFW） | ✅ | ✅ |
| 28 业务分类 | ✅（手工配置）| ✅（自动）|
| 9 区域组自动 url-test 选最低延迟 | ⚠️ 用负载均衡组近似 | ✅ 原生 |
| 机场换节点自动归位到区域组 | ❌ **每次换机场要重新改 28 条规则的目标** | ✅ 自动 |
| Smart + LightGBM 机器学习择优 | ❌ | ✅ 原生 |
| JS 覆写 / 订阅预处理 | ❌ | ✅ |
| 广告拦截（纵深多源）| ⚠️ 只能导 1-2 个 list | ✅ 20+ 源 |

**功能约 OpenClash slim 的 70%**。想要完整体验，用本仓库 `OpenClash/`。

### 我要准备什么？
1. **OpenWrt / iStoreOS / ImmortalWrt** 路由器已刷好
2. **已安装 Passwall 或 Passwall2 插件**（iceeeder / xiaorouter 社区分支都行）
3. **一个机场订阅 URL**
4. **本文档的 28 条 shunt rule 参考**（往下看）

### 本目录交付的 3 种配置文件（按你的偏好选一种）

| 文件 | 适合谁 | 用法 |
|---|---|---|
| **`shunt-rules/*.list`**（28 个 `.list` 文件）| 不熟 SSH 的用户 | Passwall2 LuCI → 分流控制 → 新增 → 把对应 `.list` 里的域名/IP 列表粘贴进字段 |
| **`passwall2-smart-shunt.conf`**（单文件合并版）| 想一眼看完 28 条规则全貌 | 同上，但全部规则在一个文件里，方便参考对比 |
| **`apply-shunt-rules.sh`**（UCI 批量脚本）| 会 SSH 登录路由器的用户 | `scp` 到路由器 → `sh apply-shunt-rules.sh` → 一次性创建 28 条空节点规则 → 再到 LuCI 逐条指定节点 |

### 3 步走完
1. **Passwall2 LuCI → 节点列表 → 添加订阅**：粘贴机场订阅 URL → 下载节点 → 分地区手动创建负载均衡组（如"🇺🇸 美国负载"把所有 US 节点加进来）
2. **选一种方式导入 shunt rule**（见上表）：
   - 方式 A（手工）：为每个业务类别点「新增」→ 粘贴对应 `.list` 文件的内容 → 选择目标节点
   - 方式 B（脚本）：`sh apply-shunt-rules.sh` 一次性创建 28 条空节点规则 → 在 LuCI 里给每条指定节点
3. **回首页启用 Passwall2**，流量就按 28 条规则分流了

### 跑起来怎么验证？
- 浏览器打开 `https://www.google.com` 能打开 = 代理通了
- Passwall2 → 分流控制 → 每条规则后的"命中次数"应开始累加
- 访问 `chat.openai.com` → 应命中你第 1 条（🤖 AI 服务）规则

### 最常见踩坑
- ❌ **规则多了顺序错乱**：Passwall2 按列表顺序匹配，**把"国内网站"/"广告拦截"放最前或最后**，业务规则放中间
- ❌ **geosite 关键字不识别**：确认 Passwall2 的 xray/sing-box 核已下载 `geosite.dat`（LuCI → 全局设置 → 规则资源设置里有个"更新 geosite.dat / geoip.dat"按钮）
- ❌ **节点换了规则都白写**：这是 Passwall 的固有限制，没办法。想避开就换 OpenClash
- ❌ **混淆 Passwall 和 Passwall2**：这两款是同作者 `xiaorouji` **并行维护**的两款插件（**不是**新旧关系；最新发版仅差 4 天）。Passwall = 全功能（有直连/屏蔽/GFW/代理 4 列表 + 分流），Passwall2 = 精简分流（只有 keyword/domain/geosite/geoip 匹配）。**规则语法两者完全相同**（共用 `shunt_rules.lua` 解析器），本目录的 28 个 `.list` 同时适用。

---

## 🔌 协议支持（底层 xray / sing-box 核）

Passwall2 根据你选的核提供不同协议，与 v2rayN 同理：

| 协议 | xray 核（默认） | sing-box 核 |
|---|:-:|:-:|
| Shadowsocks (SS + 2022) | ✅ | ✅ |
| ShadowsocksR (SSR) | ❌ | ❌ |
| VMess | ✅ | ✅ |
| VLESS + REALITY + XTLS-Vision | ✅ | ✅ |
| Trojan | ✅ | ✅ |
| Hysteria v1 / v2 | ❌ | ✅ |
| TUIC v5 | ❌ | ✅ |
| WireGuard | ⚠️ 实验 | ✅ |
| AnyTLS / ShadowTLS | ❌ | ✅ |

**一句话选核**：机场主推 VLESS+REALITY → xray 核；机场主推 Hysteria 2 / TUIC → sing-box 核；都有 → sing-box 覆盖更广。

---

## 📋 28 条 shunt rule 参考清单（和 `shunt-rules/` 目录 + `passwall2-smart-shunt.conf` 内容一致）

> 下方的每一条规则也以独立 `.list` 文件形式存放于 `Passwall2/shunt-rules/`（如 `01-ai-service.list` / `06-social.list`），方便逐条复制。想一次性看全部 28 条的单文件版本：`Passwall2/passwall2-smart-shunt.conf`。

每一条 = Passwall / Passwall2「分流控制」面板里点一次「新增」。按顺序添加。**第 24-28 条（国内/受限/国外/FINAL/广告）顺序很关键**。

> **Passwall / Passwall2 分流规则语法**（两者共用同一套 xray/sing-box 域名匹配语法，`shunt_rules.lua` 权威源见文末参考）：
>
> | 前缀 | 含义 | 示例 |
> |---|---|---|
> | （无前缀） | 纯字符串**子串匹配** | `sina.com` 命中 `sina.com` / `sina.com.cn` / `www.sina.com`，**不**匹配 `sina.cn` |
> | `domain:` | **子域名匹配（推荐，等价 Clash `DOMAIN-SUFFIX`）** | `domain:v2ray.com` 命中 `v2ray.com` / `www.v2ray.com`，**不**匹配 `xv2ray.com` |
> | `full:` | 完整匹配（等价 Clash `DOMAIN`） | `full:v2ray.com` 只命中 `v2ray.com` |
> | `regexp:` | 正则 | `regexp:\.goo.*\.com$` 命中 `www.google.com` / `fonts.googleapis.com` |
> | `geosite:` | V2Ray `geosite.dat` 预定义分类 | `geosite:cn` / `geosite:google` |
> | `rule-set:remote:<url>` | sing-box 远程 `.srs` 规则集 | `rule-set:remote:https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-cn.srs` |
> | `rule-set:local:<path>` | sing-box 本地 `.srs` 规则集 | `rule-set:local:/usr/share/sing-box/geosite-cn.srs` |
> | IP 列表字段 | `geoip:<tag>` / CIDR / `rule-set:` | `geoip:cn` / `geoip:private` / `192.168.0.0/16` |
> | `#` 开头 | 注释 |  |
>
> ⚠️ **不要**用 Clash 的 `DOMAIN-SUFFIX,xxx` / `DOMAIN-KEYWORD,xxx` / `DOMAIN,xxx` / `IP-CIDR,xxx,...` 语法——Passwall / Passwall2 **不识别**这些前缀，会把整串 `DOMAIN-SUFFIX,v0.dev` 当成纯字符串子串匹配的字面量（**100% 不命中**任何域名）。本目录 v5.2.6-pw2.2 修复前曾犯此错误。
>
> **推荐节点区域** = Clash Party 基线推荐。你要在 Passwall / Passwall2 的"节点列表"里创建对应地区的负载均衡组（比如"🇺🇸 美国-LB"），然后把这里的 shunt rule 指向这个组。

---

### 1️⃣ 🤖 AI 服务
**推荐节点**：🇺🇸 美国（避开 HK/CN）

**域名列表**：
```
geosite:openai
geosite:anthropic
geosite:gemini
geosite:copilot
geosite:bard
geosite:perplexity
geosite:huggingface
domain:cursor.com
domain:v0.dev
domain:character.ai
domain:mistral.ai
domain:cohere.ai
domain:cohere.com
domain:replicate.com
domain:together.ai
domain:runpod.io
domain:openrouter.ai
domain:suno.ai
domain:suno.com
domain:midjourney.com
domain:pi.ai
domain:inflection.ai
```

### 2️⃣ 💰 加密货币
**推荐节点**：🇭🇰 香港 / 🇯🇵 日韩（合规性）

**域名列表**：
```
geosite:cryptocurrency
geosite:binance
domain:tradingview.com
domain:coinglass.com
domain:coinmarketcap.com
domain:coingecko.com
```

### 3️⃣ 🏦 金融支付
**推荐节点**：🌍 全球

**域名列表**：
```
geosite:paypal
geosite:stripe
domain:wise.com
domain:revolut.com
domain:visa.com
domain:mastercard.com
domain:amex.com
```

### 4️⃣ 📧 邮件服务
**推荐节点**：🇯🇵 日韩 / 🌍 全球

**域名列表**：
```
geosite:gmail
geosite:outlook
geosite:protonmail
domain:fastmail.com
domain:tuta.com
domain:mail.ru
```

### 5️⃣ 💬 即时通讯
**推荐节点**：🇭🇰 香港 / 🇯🇵 日韩

**域名列表**：
```
geosite:telegram
geosite:discord
geosite:whatsapp
geosite:line
geosite:signal
geosite:kakaotalk
```

**IP 列表**：
```
geoip:telegram
```

### 6️⃣ 📱 社交媒体
**推荐节点**：🇯🇵 日韩 / 🌍 全球

**域名列表**：
```
geosite:twitter
geosite:facebook
geosite:instagram
geosite:tiktok
geosite:reddit
geosite:pinterest
geosite:linkedin
geosite:snap
```

**IP 列表**：
```
geoip:twitter
geoip:facebook
```

### 7️⃣ 🧑‍💼 会议协作
**推荐节点**：🇯🇵 日韩 / 🌍 全球

**域名列表**：
```
geosite:zoom
geosite:teams
geosite:slack
geosite:notion
geosite:atlassian
domain:meet.google.com
```

### 8️⃣ 📺 国内流媒体
**推荐**：**direct**（境内）或 🇭🇰 香港（境外）

**域名列表**：
```
geosite:bilibili
geosite:iqiyi
geosite:youku
geosite:tencentvideo
geosite:mgtv
geosite:douyin
geosite:netease-music
geosite:qqmusic
```

### 9️⃣ 📺 东南亚流媒体
**推荐节点**：🌏 亚太（SG/ID）

**域名列表**：
```
geosite:viu
domain:iq.com
domain:wetv.vip
domain:vidio.com
domain:iqiyiintl.com
```

### 🔟 🇺🇸 美国流媒体
**推荐节点**：🇺🇸 美国

**域名列表**：
```
geosite:youtube
geosite:netflix
geosite:disney
geosite:hbo
geosite:hulu
geosite:spotify
geosite:primevideo
domain:paramountplus.com
domain:peacocktv.com
domain:twitch.tv
```

**IP 列表**：
```
geoip:netflix
```

### 1️⃣1️⃣ 🇭🇰 香港流媒体
**推荐节点**：🇭🇰 香港

**域名列表**：
```
geosite:mytvsuper
domain:mytvsuper.com
domain:now.com
domain:viu.tv
domain:encoretvb.com
domain:rthk.hk
```

### 1️⃣2️⃣ 🇹🇼 台湾流媒体
**推荐节点**：🇹🇼 台湾

**域名列表**：
```
geosite:bahamut
domain:bahamut.com.tw
domain:hinet.net
domain:kktv.me
domain:litv.tv
domain:hamivideo.hinet.net
domain:friday.tw
```

### 1️⃣3️⃣ 🇯🇵 日韩流媒体
**推荐节点**：🇯🇵 日韩

**域名列表**：
```
geosite:abema
geosite:niconico
domain:dazn.com
domain:dmm.com
domain:tv-tokyo.co.jp
domain:tver.jp
domain:rakuten.tv
```

### 1️⃣4️⃣ 🇪🇺 欧洲流媒体
**推荐节点**：🇪🇺 欧洲

**域名列表**：
```
geosite:bbc
domain:itv.com
domain:channel4.com
domain:my5.tv
domain:sky.com
domain:skygo.com
domain:britbox.co.uk
```

### 1️⃣5️⃣ 🕹️ 国内游戏
**推荐**：**direct**

**域名列表**：
```
geosite:steamcn
domain:wanmei.com
domain:majsoul.com
domain:battlenet.com.cn
```

### 1️⃣6️⃣ 🎮 国外游戏
**推荐节点**：🇯🇵 日韩 / 🇭🇰 香港

**域名列表**：
```
geosite:steam
geosite:epicgames
geosite:playstation
geosite:xbox
geosite:nintendo
domain:riotgames.com
domain:ea.com
domain:blizzard.com
domain:hoyoverse.com
domain:mihoyo.com
```

### 1️⃣7️⃣ 🔍 搜索引擎
**推荐节点**：🌍 全球

**域名列表**：
```
geosite:google
geosite:bing
geosite:duckduckgo
geosite:yandex
domain:scholar.google.com
```

**IP 列表**：
```
geoip:google
```

### 1️⃣8️⃣ 📟 开发者服务
**推荐节点**：🇺🇸 美国 / 🌍 全球

**域名列表**：
```
geosite:github
geosite:gitlab
geosite:docker
geosite:npmjs
geosite:pypi
geosite:python
domain:jetbrains.com
domain:stackoverflow.com
domain:stackexchange.com
```

### 1️⃣9️⃣ Ⓜ️ 微软服务
**推荐节点**：🌍 全球

**域名列表**：
```
geosite:microsoft
geosite:onedrive
domain:office.com
domain:live.com
domain:microsoftedge.com
```

### 2️⃣0️⃣ 🍎 苹果服务
**推荐**：**direct**（境内）或 🌍 全球（境外）

**域名列表**：
```
geosite:apple
geosite:icloud
domain:appstore.com
domain:mzstatic.com
domain:itunes.com
domain:applemusic.com
domain:apple-dns.net
```

### 2️⃣1️⃣ 📥 下载更新
**推荐**：**direct**

**域名列表**：
```
domain:dl.google.com
domain:play.googleapis.com
domain:msftconnecttest.com
domain:windowsupdate.com
domain:cdn-apple.com
domain:ubuntu.com
domain:mozilla.org
domain:apkpure.com
```

### 2️⃣2️⃣ ☁️ 云与CDN
**推荐节点**：🌍 全球

**域名列表**：
```
geosite:cloudflare
geosite:fastly
geosite:akamai
domain:jsdelivr.net
domain:cloudfront.net
```

**IP 列表**：
```
geoip:cloudflare
geoip:fastly
```

### 2️⃣3️⃣ 🛰️ BT/PT Tracker
**推荐**：**direct** 或 **block**

**域名列表**：
```
geosite:private-tracker
domain:opentrackr.org
domain:openbittorrent.com
domain:nyaa.si
```

### 2️⃣4️⃣ 🏠 国内网站（倒数第 5 条 — 位置重要）
**推荐**：**direct**

**域名列表**：
```
geosite:cn
```

**IP 列表**：
```
geoip:cn
geoip:private
```

### 2️⃣5️⃣ 🚫 受限网站（倒数第 4 条）
**推荐节点**：🌍 全球

**域名列表**：
```
geosite:gfw
geosite:greatfire
```

### 2️⃣6️⃣ 🌐 国外网站（倒数第 3 条）
**推荐节点**：🌍 全球

**域名列表**：
```
geosite:geolocation-!cn
domain:cnn.com
domain:nytimes.com
domain:bloomberg.com
domain:wikipedia.org
```

### 2️⃣7️⃣ 🐟 漏网之鱼 FINAL（倒数第 2 条）
**推荐节点**：🌍 全球

**域名列表**：留空（兜底规则不用显式写域名；Passwall / Passwall2 的 FINAL 走"全局设置 → 基本设置"里的**默认代理节点**开关，不是作为 shunt rule 的一条）
**IP 列表**：留空
**网络**：tcp,udp
**匹配**：Passwall2 把这条设置为**兜底规则**（通常是「其余流量默认走代理主节点」开关）

### 2️⃣8️⃣ 🛑 广告拦截（最后 1 条，但要**优先级最高**）
**推荐**：**block（拒绝）**

**域名列表**：
```
geosite:category-ads-all
```

Passwall2 有个单独的"黑名单"或"广告拦截"切换开关，直接开即可；或者本条规则的"目标节点"选 `reject` / `block`。

---

## 🔁 从 OpenClash 切过来？或反过来？

这两个插件**不能同时启用**（会互相覆盖 iptables 规则）。切换方法：

```sh
# 停 OpenClash，换 Passwall2
/etc/init.d/openclash stop
/etc/init.d/openclash disable
/etc/init.d/passwall2 enable
/etc/init.d/passwall2 start
```

想换回 OpenClash 反过来就行。配置互相独立保留，切换无数据丢失。

**想要 mihomo 的 proxy-groups 嵌套（业务组 → 区域组）+ Smart/LightGBM 自动择优？请改用 OpenClash**（本仓库 `OpenClash/`）。Passwall / Passwall2 架构上都**没有**嵌套选择器（Lua CBI 表单式 UI，无 YAML 嵌套组语义），也**都不打包** mihomo（只有 xray + sing-box 双栈）——本目录的 28 条 shunt rule 是**把两层结构手工展平**的降级方案，适合坚持用 Passwall 系的用户。

---

## 📚 参考

- **Passwall 项目（全功能）**：https://github.com/Openwrt-Passwall/openwrt-passwall
- **Passwall2 项目（精简分流）**：https://github.com/Openwrt-Passwall/openwrt-passwall2
- **Shunt rule 语法权威源（两者共用）**：https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua
- 节点类型清单（Passwall，含 `trojan-plus`）：https://github.com/Openwrt-Passwall/openwrt-passwall/tree/main/luci-app-passwall/luasrc/model/cbi/passwall/client/type
- 节点类型清单（Passwall2）：https://github.com/Openwrt-Passwall/openwrt-passwall2/tree/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/type
- 社区权威解读（两者定位差异）：https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555
- MetaCubeX geosite.dat（本参考使用的 `geosite:` 分类名称依据）：https://github.com/MetaCubeX/meta-rules-dat
- 本仓库完整体验（mihomo proxy-groups 嵌套 + Smart + LightGBM）：`OpenClash/README.md`
