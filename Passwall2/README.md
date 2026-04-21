# Passwall2 使用教程（对齐 Clash Party v5.2.5 简化版）

> 配置参考：`Passwall2/` 目录  
> 版本：**v5.2.5-pw2.1**（Build 2026-04-20，初版）  
> 目标：**Passwall2**（iceeeder / xiaorouter 等社区分支），兼顾 Passwall 旧版  
> 架构：28 条 shunt rule（展平版）+ 每条支持 `geosite:xxx` / `geoip:xxx` / `domain-suffix:xxx` / `IP-CIDR,x/n` 混合匹配

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

### 3 步走完
1. **Passwall2 LuCI → 节点列表 → 添加订阅**：粘贴机场订阅 URL → 下载节点 → 分地区手动创建负载均衡组（如"🇺🇸 美国负载"把所有 US 节点加进来）
2. **Passwall2 LuCI → 分流控制 → 添加分流规则**：照下方「28 条 shunt rule 参考」每条点一次「新增」，填入 规则名 + 域名列表 + IP 列表 + 选择目标节点
3. **回首页启用 Passwall2**，流量就按 28 条规则分流了

### 跑起来怎么验证？
- 浏览器打开 `https://www.google.com` 能打开 = 代理通了
- Passwall2 → 分流控制 → 每条规则后的"命中次数"应开始累加
- 访问 `chat.openai.com` → 应命中你第 1 条（🤖 AI 服务）规则

### 最常见踩坑
- ❌ **规则多了顺序错乱**：Passwall2 按列表顺序匹配，**把"国内网站"/"广告拦截"放最前或最后**，业务规则放中间
- ❌ **geosite 关键字不识别**：确认 Passwall2 的 xray/sing-box 核已下载 `geosite.dat`（LuCI → 全局设置 → 规则资源设置里有个"更新 geosite.dat / geoip.dat"按钮）
- ❌ **节点换了规则都白写**：这是 Passwall 的固有限制，没办法。想避开就换 OpenClash
- ❌ **Passwall 旧版语法稍不同**：Passwall 老版用 "分流节点" 字段；Passwall2 用 "分流规则" 面板。本文档的 `geosite:` / `geoip:` 语法两者都支持

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

## 📋 28 条 shunt rule 参考清单

下面每一条 = Passwall2 「分流控制」面板里点一次「新增」。按顺序添加。**第 24-28 条（国内/受限/国外/FINAL/广告）顺序很关键**。

> 使用语法：`geosite:xxx` = xray/sing-box geosite 分类；`domain-suffix:xxx` = 手工补充域名；`geoip:xxx` = geoip 分类；`IP-CIDR,x/n` = IP 段。
>
> **推荐节点区域** = Clash Party 基线推荐。你要在 Passwall2 的"节点列表"里创建对应地区的负载均衡组（比如"🇺🇸 美国-LB"），然后把这里的 shunt rule 指向这个组。

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
domain-suffix:cursor.com
domain-suffix:v0.dev
domain-suffix:character.ai
domain-suffix:mistral.ai
domain-suffix:cohere.ai
domain-suffix:cohere.com
domain-suffix:replicate.com
domain-suffix:together.ai
domain-suffix:runpod.io
domain-suffix:openrouter.ai
domain-suffix:suno.ai
domain-suffix:suno.com
domain-suffix:midjourney.com
domain-suffix:pi.ai
domain-suffix:inflection.ai
```

### 2️⃣ 💰 加密货币
**推荐节点**：🇭🇰 香港 / 🇯🇵 日韩（合规性）

**域名列表**：
```
geosite:cryptocurrency
geosite:binance
domain-suffix:tradingview.com
domain-suffix:coinglass.com
domain-suffix:coinmarketcap.com
domain-suffix:coingecko.com
```

### 3️⃣ 🏦 金融支付
**推荐节点**：🌍 全球

**域名列表**：
```
geosite:paypal
geosite:stripe
domain-suffix:wise.com
domain-suffix:revolut.com
domain-suffix:visa.com
domain-suffix:mastercard.com
domain-suffix:amex.com
```

### 4️⃣ 📧 邮件服务
**推荐节点**：🇯🇵 日韩 / 🌍 全球

**域名列表**：
```
geosite:gmail
geosite:outlook
geosite:protonmail
domain-suffix:fastmail.com
domain-suffix:tuta.com
domain-suffix:mail.ru
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
domain-suffix:meet.google.com
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
domain-suffix:iq.com
domain-suffix:wetv.vip
domain-suffix:vidio.com
domain-suffix:iqiyiintl.com
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
domain-suffix:paramountplus.com
domain-suffix:peacocktv.com
domain-suffix:twitch.tv
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
domain-suffix:mytvsuper.com
domain-suffix:now.com
domain-suffix:viu.tv
domain-suffix:encoretvb.com
domain-suffix:rthk.hk
```

### 1️⃣2️⃣ 🇹🇼 台湾流媒体
**推荐节点**：🇹🇼 台湾

**域名列表**：
```
geosite:bahamut
domain-suffix:bahamut.com.tw
domain-suffix:hinet.net
domain-suffix:kktv.me
domain-suffix:litv.tv
domain-suffix:hamivideo.hinet.net
domain-suffix:friday.tw
```

### 1️⃣3️⃣ 🇯🇵 日韩流媒体
**推荐节点**：🇯🇵 日韩

**域名列表**：
```
geosite:abema
geosite:niconico
domain-suffix:dazn.com
domain-suffix:dmm.com
domain-suffix:tv-tokyo.co.jp
domain-suffix:tver.jp
domain-suffix:rakuten.tv
```

### 1️⃣4️⃣ 🇪🇺 欧洲流媒体
**推荐节点**：🇪🇺 欧洲

**域名列表**：
```
geosite:bbc
domain-suffix:itv.com
domain-suffix:channel4.com
domain-suffix:my5.tv
domain-suffix:sky.com
domain-suffix:skygo.com
domain-suffix:britbox.co.uk
```

### 1️⃣5️⃣ 🕹️ 国内游戏
**推荐**：**direct**

**域名列表**：
```
geosite:steamcn
domain-suffix:wanmei.com
domain-suffix:majsoul.com
domain-suffix:battlenet.com.cn
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
domain-suffix:riotgames.com
domain-suffix:ea.com
domain-suffix:blizzard.com
domain-suffix:hoyoverse.com
domain-suffix:mihoyo.com
```

### 1️⃣7️⃣ 🔍 搜索引擎
**推荐节点**：🌍 全球

**域名列表**：
```
geosite:google
geosite:bing
geosite:duckduckgo
geosite:yandex
domain-suffix:scholar.google.com
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
domain-suffix:jetbrains.com
domain-suffix:stackoverflow.com
domain-suffix:stackexchange.com
```

### 1️⃣9️⃣ Ⓜ️ 微软服务
**推荐节点**：🌍 全球

**域名列表**：
```
geosite:microsoft
geosite:onedrive
domain-suffix:office.com
domain-suffix:live.com
domain-suffix:microsoftedge.com
```

### 2️⃣0️⃣ 🍎 苹果服务
**推荐**：**direct**（境内）或 🌍 全球（境外）

**域名列表**：
```
geosite:apple
geosite:icloud
domain-suffix:appstore.com
domain-suffix:mzstatic.com
domain-suffix:itunes.com
domain-suffix:applemusic.com
domain-suffix:apple-dns.net
```

### 2️⃣1️⃣ 📥 下载更新
**推荐**：**direct**

**域名列表**：
```
domain-suffix:dl.google.com
domain-suffix:play.googleapis.com
domain-suffix:msftconnecttest.com
domain-suffix:windowsupdate.com
domain-suffix:cdn-apple.com
domain-suffix:ubuntu.com
domain-suffix:mozilla.org
domain-suffix:apkpure.com
```

### 2️⃣2️⃣ ☁️ 云与CDN
**推荐节点**：🌍 全球

**域名列表**：
```
geosite:cloudflare
geosite:fastly
geosite:akamai
domain-suffix:jsdelivr.net
domain-suffix:cloudfront.net
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
domain-suffix:opentrackr.org
domain-suffix:openbittorrent.com
domain-suffix:nyaa.si
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
domain-suffix:cnn.com
domain-suffix:nytimes.com
domain-suffix:bloomberg.com
domain-suffix:wikipedia.org
```

### 2️⃣7️⃣ 🐟 漏网之鱼 FINAL（倒数第 2 条）
**推荐节点**：🌍 全球

**域名列表**：留空（或 `domain-keyword:` 通配）
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

**我们强烈推荐 OpenClash**。Passwall2 版本是降级版，用于不愿意换插件的用户兜底。

---

## 📚 参考

- Passwall2 项目：https://github.com/xiaorouji/openwrt-passwall2
- Passwall（旧版）：https://github.com/xiaorouji/openwrt-passwall
- MetaCubeX geosite.dat：https://github.com/MetaCubeX/meta-rules-dat（本参考使用的分类名称依据）
- 本仓库完整体验：`OpenClash/README.md`（强烈推荐）
