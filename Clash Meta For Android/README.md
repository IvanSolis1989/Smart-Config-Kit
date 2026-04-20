# Clash Meta For Android（CMFA）使用方法

> 配置文件：`clash-smart-cmfa.yaml`
> 适用客户端：**Clash Meta For Android（CMFA）** / **FlClash** / **mihomo-party-android**
> 内核要求：**Mihomo Smart**（已内置 LightGBM 自学习模型）
> 当前版本：**v5.2.0**（基于 `clash-smart-v5.2.0.js` 转换）

---

## 一、下载 CMFA 客户端

1. 开源地址：https://github.com/MetaCubeX/ClashMetaForAndroid/releases
2. 根据手机 CPU 选择合适的 APK：
   - **arm64-v8a**：绝大多数 2017 年后的手机
   - **armeabi-v7a**：少数老机型
   - **universal**：不确定时的通用包
3. 安装后授权「VPN 权限」与「文件读写权限」。

---

## 二、修改订阅链接

打开 `clash-smart-cmfa.yaml`，找到 `proxy-providers` 段落（约第 137 行）：

```yaml
proxy-providers:
  Subscribe:
    type: http
    url: 'https://my.example.com/your-subscription-url'   # ← 替换为你的机场订阅链接
    interval: 86400
    path: ./proxy_providers/subscribe.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置|10x|20x|100x)'
```

**注意事项**：
- 订阅链接建议选择 `?flag=meta` 或 `?flag=clash.meta` 风格，返回 **Mihomo 兼容格式**的节点。
- `exclude-filter` 已内置过滤广告节点与高倍率节点，无需改动。
- 若你使用 **Sub-Store** 做多机场融合，可直接粘贴 Sub-Store 生成的单一 URL。

---

## 三、导入配置到 CMFA

### 方法 A：本地文件导入（推荐首次使用）

1. 将修改后的 `clash-smart-cmfa.yaml` 复制到手机存储（例如 `Download/` 目录）。
2. 打开 CMFA → **配置（Profiles）** → 右下角 ➕ → **从文件导入**。
3. 选择刚才的 YAML → 命名为 `Clash Smart` → 确定。

### 方法 B：URL 远程托管（推荐长期使用）

1. 将 YAML 托管到 GitHub Raw / Gist / 自建 HTTP 服务。
2. CMFA → **配置** → ➕ → **从 URL 导入** → 粘贴 URL → 确定。
3. 后续自动轮询更新（默认每 24 小时，可在配置设置里调整）。

---

## 四、首次启动

1. 在 CMFA 首页选择刚导入的配置，点击「**启动**」按钮。
2. 首次启动 CMFA 会自动完成以下动作（需保持网络畅通）：
   - 下载机场节点列表（`subscribe.yaml`）
   - 下载 **375+ rule-providers**（`blackmatrix7 / MetaCubeX` 等规则集）
   - 下载 **Loyalsoldier 增强版** `geoip.dat` / `Country.mmdb` / `GeoLite2-ASN.mmdb`
   - 下载 **MetaCubeX** `geosite.dat`
   - 下载 **LightGBM 模型** `Model.bin`（用于 Smart 组自动择优）
3. 初始化时间：视网络情况约 **1–3 分钟**；完成后规则集会缓存到本地。

> ⚠️ 首次启动建议在 **WiFi 环境**并开启 VPN 后进行，避免因某些 rule-provider 需代理下载而失败。

---

## 五、代理组说明

本配置共 **9 个区域组 + 28 个业务组**，进入 CMFA「**代理（Proxies）**」页面可见：

### 区域组（自动择优）

以下 9 个 `url-test` 组会按节点名称自动聚合，**无需手动维护**：

- 🌍 全球节点、🇭🇰 香港节点、🇹🇼 台湾节点、🇯🇵 日韩节点
- 🌏 亚太节点、🇺🇸 美国节点、🇪🇺 欧洲节点、🌎 美洲节点、🌍 非洲节点

### 业务组（手动选择）

28 个 `select` 业务组，每组默认候选包含所有区域组 + `DIRECT`，首次使用需为每个业务组**手动指定一个首选区域**：

| 业务组 | 推荐区域 |
|--------|----------|
| 🤖 AI 服务（ChatGPT/Claude/Gemini） | 🇺🇸 美国节点（避开 HK/CN 地区） |
| 💰 加密货币 | 🇭🇰 香港节点 |
| 📺 国内流媒体（B 站/爱奇艺/腾讯） | DIRECT（境内）或 🇭🇰 香港节点（境外） |
| 🇺🇸 美国流媒体（Netflix US / HBO） | 🇺🇸 美国节点 |
| 🇭🇰 香港流媒体（Now E / MyTV） | 🇭🇰 香港节点 |
| 🇹🇼 台湾流媒体（LiTV / 巴哈姆特） | 🇹🇼 台湾节点 |
| 📺 东南亚流媒体（爱奇艺 SEA / WeTV） | 🌏 亚太节点 |
| 💬 即时通讯（Telegram/Discord） | 🇭🇰 香港节点 或 🇯🇵 日韩节点 |
| 📱 社交媒体（X/Twitter/Instagram） | 🇯🇵 日韩节点 |
| 🧑‍💼 会议协作（Zoom/Teams） | 🇯🇵 日韩节点（低延迟） |
| 🚫 受限网站（GFW） | 境内选代理，境外选 DIRECT |
| … | … |

---

## 六、常用高级设置

### 1. 启用 TUN 模式（系统级代理）

- CMFA → **设置** → **网络** → 打开 **TUN 模式**。
- 配合配置中的 `stack: mixed` 可兼容绝大多数 App（包括 UDP / QUIC）。

### 2. 启用 Meta SideBar（仪表盘）

- CMFA → **设置** → **界面** → 开启「**显示流量图表 / 仪表盘**」，可实时查看 LightGBM 模型择优效果。

### 3. 应用分应用代理（可选）

- CMFA → **设置** → **应用过滤** → 选择模式：
  - **黑名单**：列表内 App 不走代理（推荐国内银行/支付 App 加入）
  - **白名单**：仅列表内 App 走代理

### 4. 开启后台保活

- 系统「**电池优化**」中将 CMFA 设为「**不优化**」。
- MIUI / ColorOS / HarmonyOS 需额外在「自启动」与「后台弹出」权限中允许 CMFA。

---

## 七、常见问题

### Q1：导入后提示 `list geosite not found` 或规则解析错误？
A：本配置已将所有 `GEOSITE` 高级标签替换为等效 `RULE-SET`，理论上不会出现该错误。若仍出现，请检查：
- 是否使用的是 **Mihomo Smart 内核**（而非旧版 ClashX / Clash Premium）。
- CMFA 版本是否 ≥ **2.11.x**。

### Q2：节点名称没有被正确分到区域组？
A：脚本按「中文关键字 + 城市 + IATA 机场代码 + ISO 国家代码」综合匹配，覆盖率 > 95%。若仍漏判，请将节点名贴到 Issue 中反馈。

### Q3：LightGBM 自动择优未生效？
A：确认：
- `proxy-groups` 中 `uselightgbm: true` 存在；
- 已下载 `Model.bin`（首次启动日志会显示下载进度）；
- CMFA 使用的是 **Smart 内核**而非普通 Meta 内核。

### Q4：fake-ip 模式下银行/支付 App 异常？
A：已通过 `sniffer.skip-domain` 排除主要支付域名（支付宝/微信/币安等）。若你使用的银行域名未在名单中，可在 `fake-ip-filter` 追加对应域名。

---

## 八、配置关键字段速查

| 字段 | 位置 | 说明 |
|------|------|------|
| `mixed-port: 7890` | 顶部 | HTTP / SOCKS 混合端口 |
| `mode: rule` | 顶部 | 规则模式（勿改 global/direct） |
| `find-process-mode: strict` | 顶部 | Android 14+ 可识别进程 |
| `dns.enhanced-mode: fake-ip` | `dns` | fake-ip 模式（性能最佳） |
| `sniffer.enable: true` | `sniffer` | 启用 SNI 嗅探 |
| `geodata-mode: false` | 顶部 | 使用 `.mrs` 二进制格式（体积更小） |

---

## 九、参考与致谢

- 上游内核：[MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo)
- LightGBM 模型：[vernesong/mihomo](https://github.com/vernesong/mihomo)
- 规则集：[blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)
- GeoIP：[Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip)
