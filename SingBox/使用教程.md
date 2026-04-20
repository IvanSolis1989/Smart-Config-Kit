# SingBox 使用教程（对齐 Clash Party v5.2.2 Full 语义）

> 配置文件（推荐）：`SingBox/singbox-smart-full.json`  
> 基础模板：`SingBox/singbox-smart.json`  
> 生成脚本：`SingBox/generate-singbox-full.js`  
> 目标：在 **sing-box** 上复刻 Clash Party 的「9 个区域组 + 28 个业务组 + 387 rule-providers + 977 规则」语义，并保持 sing-box 官方配置兼容。

---

## 1. 设计说明（和 Clash Party 的一致性）

该 sing-box 版本与 Clash Party 主线保持以下一致：

- **区域层一致**：
  - `🌍 全球节点`
  - `🇭🇰 香港节点`
  - `🇹🇼 台湾节点`
  - `🇯🇵 日韩节点`
  - `🌏 亚太节点`
  - `🇺🇸 美国节点`
  - `🇪🇺 欧洲节点`
  - `🌎 美洲节点`
  - `🌍 非洲节点`

- **业务层一致（28 组）**：
  - `🤖 AI 服务`、`💰 加密货币`、`🏦 金融支付`、`📧 邮件服务`、`💬 即时通讯`、`📱 社交媒体`
  - `🧑‍💼 会议协作`、`📺 国内流媒体`、`📺 东南亚流媒体`、`🇺🇸 美国流媒体`、`🇭🇰 香港流媒体`
  - `🇹🇼 台湾流媒体`、`🇯🇵 日韩流媒体`、`🇪🇺 欧洲流媒体`、`🕹️ 国内游戏`、`🎮 国外游戏`
  - `🔍 搜索引擎`、`📟 开发者服务`、`Ⓜ️ 微软服务`、`🍎 苹果服务`、`📥 下载更新`
  - `☁️ 云与CDN`、`🛰️ BT/PT Tracker`、`🏠 国内网站`、`🚫 受限网站`、`🌐 国外网站`
  - `🐟 漏网之鱼`、`🛑 广告拦截`

- **规则层策略一致**：
  - AI、支付、加密货币、流媒体、即时通讯、开发者服务等关键域名前置匹配。
  - 国内/国外流量使用 `geosite-cn` + `geoip-cn` 与 `geosite-geolocation-!cn` 收口。
  - 广告使用 `category-ads-all` 统一拦截。
  - 通过生成脚本从 `Clash Party/Clash Smart内核覆写脚本.js` 自动提取 rule-providers 与 rules，确保顺序和策略定义持续跟随 Clash Party 主线。

---

## 2. 准备工作

1. 安装 sing-box 或图形客户端（如 sing-box for Android / macOS 图形端等）。
2. 将 `SingBox/singbox-smart-full.json` 导入客户端。
3. 将文件内 `proxy-xxx` 示例节点替换成你自己的真实节点（trojan/vless/vmess/hysteria2 都可以）。

> 说明：`singbox-smart-full.json` 已内置 387 个 rule_set 入口与 977 条路由规则；你只需要替换节点出站即可。

---

## 2a. Hiddify 用户看这里

**Hiddify 的内核就是 sing-box**（实际打包的是 `hiddify-sing-box` 二进制，在官方 sing-box 基础上加了 WARP+、Hiddify Profile Format 等自家扩展）。所以本目录的配置 **不需要单独开一份 Hiddify 版本**——直接把 `SingBox/singbox-smart-full.json` 或 `SingBox/singbox-smart.json` 喂给 Hiddify 即可。

### 在 Hiddify 里导入

1. 打开 Hiddify → 右上角 **配置 / Profile** → **添加新的配置** → **从剪贴板 / 从文件导入**。
2. 选择本仓库的 `SingBox/singbox-smart-full.json`（推荐）或 `SingBox/singbox-smart.json`（精简）。
3. Hiddify 会读取文件里的 `outbounds`、`route`、`dns`、`rule_set`，9 区域 + 28 业务组会全部出现在 Hiddify 的「策略」面板。

### 两个小提示

- **TUN 让 Hiddify 自己管**：Hiddify 会在系统层接管 TUN（用自己的 `tun` inbound 配置覆盖），所以本 JSON 里的 `inbounds.tun` 可以保留，也可以删掉——Hiddify 都能正常启动。
- **节点替换**：和其它 sing-box 客户端一样，把 `outbounds` 里 `"type": "trojan"` / `"vless"` / `"vmess"` / `"hysteria2"` 的占位节点（`proxy-hk-1`、`proxy-us-1`…）改成你机场给的真实节点即可。如果你在 Hiddify 里单独添加了订阅，也可以删掉 JSON 里的占位节点，让 Hiddify 用订阅节点直接填充区域组。

### Hiddify 的自家扩展字段

- Hiddify Profile Format（`.hiddify-json`）是 sing-box JSON 的超集，额外支持 `meta`、`profile` 等字段用于 UI 展示。本仓库保持**纯 sing-box 标准格式**，对 Hiddify 照样生效，只是少了一些 UI 层的美化（如订阅备注、更新周期）。
- 若你想完整享受 Hiddify 自己的 WARP+ / Fragment / Mux 能力，可以在 Hiddify 客户端里单独开启——这些是运行时设置，和我们的路由/规则不冲突。

---

## 2.1 重新生成 Full 规则（跟随 Clash Party 升级）

当 `Clash Party/Clash Smart内核覆写脚本.js` 更新后，执行：

```bash
node SingBox/generate-singbox-full.js
```

脚本会自动：

- 调用 Clash Party 的 `main(config)` 构建完整规则；
- 同步导出 sing-box `route.rule_set`（387 项）；
- 同步导出 sing-box `route.rules`（977 条）。
2. 将 `SingBox/singbox-smart.json` 导入客户端。
3. 将文件内 `proxy-xxx` 示例节点替换成你自己的真实节点（trojan/vless/vmess/hysteria2 都可以）。

> 说明：我在模板中提供了可运行结构和占位节点，便于你快速迁移 Clash Party 的组策略；实际连接能力由你替换后的节点决定。

---

## 3. 关键兼容性（按 sing-box 官方文档）

为了兼容新版本 sing-box，配置做了以下处理：

- 路由规则使用 `action` + `outbound` 形式（sing-box 1.11+ 变更后推荐）。
- 使用 `rule_set`（remote/binary）而非老 GeoIP/Geosite 旧写法。
- 启用 `experimental.cache_file.enabled`，让远程规则和 selector 选择结果可缓存。
- `selector` / `urltest` 均使用官方结构字段（`outbounds`、`default`、`interval`、`tolerance`）。

---

## 3.1 DNS / 嗅探 / GEO 增强版配置（已并入 Full 配置）

为贴近 Clash Party 使用教程中的「DNS + Sniffer + GeoX URL」补充项，`singbox-smart-full.json` 已对应实现：

- **DNS 增强**：
  - `dns_direct`（223.5.5.5 DoH）用于国内规则集；
  - `dns_proxy`（1.1.1.1 DoH）用于代理解析；
  - `dns_block`（rcode://success）用于广告域名返回空响应。
- **嗅探增强**：
  - `inbounds.tun.sniff=true`
  - `sniff_override_destination=true`
  - 与 Clash Party 的 Sniffer 覆写语义对齐（提升 SNI/域名识别命中）。
- **GEO 增强数据库**：
  - `MetaCubeX/meta-rules-dat@sing` 的 geosite/geoip `.srs` 远程规则集；
  - 按日更新（`update_interval: 1d`）。

---

## 4. 替换节点的推荐方式

在 `outbounds` 中，优先按区域替换：

- `proxy-hk-*` → 香港节点
- `proxy-tw-*` → 台湾节点
- `proxy-jp-*` / `proxy-kr-*` → 日韩节点
- `proxy-sg-*` / `proxy-id-*` → 亚太节点
- `proxy-us-*` → 美国节点
- `proxy-eu-*` → 欧洲节点
- `proxy-ca-*` → 美洲节点
- `proxy-af-*` → 非洲节点

这样业务组就不需要改动，能保留 Clash Party 的“业务语义 -> 区域出口”逻辑。

---

## 5. 首次启动检查清单

启动后请按顺序确认：

1. **出站组是否完整**：能看到 9 区域 + 28 业务组。  
2. **DNS 是否生效**：国内域名走 `dns_direct`，国外域名走 `dns_proxy`。  
3. **规则集下载是否成功**：应看到 `387+` 个 `rule_set` 被加载（与 Clash Party Provider 数量对齐）。  
3. **规则集下载是否成功**：`geosite-cn / geoip-cn / geolocation-!cn / category-ads-all`。  
4. **典型业务是否命中**：
   - ChatGPT 命中 `🤖 AI 服务`
   - Binance 命中 `💰 加密货币`
   - YouTube/Netflix 命中对应流媒体组
   - 国内站点命中 `🏠 国内网站`

---

## 6. 常见问题

### Q1：为什么不能像 Clash Party 一样“自动按节点名分类”？

Clash Party 当前使用 JS 覆写引擎做节点名称分类；sing-box 原生 JSON 配置没有同等 JS 运行时。这个版本采用“**固定区域组 + 手工节点归位**”实现同语义替代，行为更稳定、可审计。

### Q2：规则集下载失败怎么办？

- 先测试 `fastly.jsdelivr.net` 连通性；
- 若你所在网络对 CDN 有限制，可替换为你可访问的镜像地址；
- 保持 `.srs` 二进制格式和 `format: binary` 一致。

### Q3：如何保证和 Clash Party 规则保持完全一致？

使用 `generate-singbox-full.js` 从 Clash Party 脚本自动提取是最稳妥方式。只要上游 `Clash Smart内核覆写脚本.js` 更新，你重新执行脚本即可同步。
### Q3：想继续贴近 Clash Party 规则量（300+ provider）怎么办？

可以继续扩展 `route.rule_set` 与 `route.rules`，将更多服务拆分成独立 rule-set。当前版本先保证“结构一致 + 主功能一致 + sing-box 官方格式兼容”。

---

## 7. 参考文档（官方）

- sing-box Outbound（selector/urltest）  
  https://sing-box.sagernet.org/configuration/outbound/
- sing-box Selector  
  https://sing-box.sagernet.org/configuration/outbound/selector/
- sing-box URLTest  
  https://sing-box.sagernet.org/configuration/outbound/urltest/
- sing-box Route / Route Rule / Rule Action  
  https://sing-box.sagernet.org/configuration/route/
  https://sing-box.sagernet.org/configuration/route/rule/
  https://sing-box.sagernet.org/configuration/route/rule_action/
- sing-box Rule-set  
  https://sing-box.sagernet.org/configuration/rule-set/
- sing-box Cache File  
  https://sing-box.sagernet.org/configuration/experimental/cache-file/

