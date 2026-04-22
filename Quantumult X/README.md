# Quantumult X 使用教程（对齐 Clash Party v5.2.5）

> 配置文件：`Quantumult X/qx-smart.conf`
> 版本：**v5.2.5-QX.2**（Build 2026-04-22，删除 72 条 Clash yaml 规则集 + anti-AD/Sukka 兼容修复 + 主版本号对齐，详见 `Quantumult X/CHANGELOG.md`）
> 目标：**Quantumult X iOS（App Store 付费正版）**
> 架构：9 区域 `url-latency-benchmark` 组 + 28 业务 `static` 组 + ~290 filter_remote + 567 filter_local 规则

---

## 🚀 零基础快速开始

### 这是什么？
**Quantumult X（QX / 圈 X）** 是 iOS 上的付费代理客户端。最大卖点是 **`resource_parser_url`（通用订阅解析器）+ 脚本化重写生态**——几乎任何奇葩订阅格式它都能吃下，签到/VIP 破解/去广告插件社区最丰富。价位介于 Shadowrocket 和 Loon 之间（**¥68**）。

### 我要准备什么？
1. **iPhone / iPad（仅 iOS，无 macOS 版）**
2. **非中国区 Apple ID**
3. **💸 QX 付费**：约 **¥68 / 区**（~$10）
4. **一个机场订阅 URL**
5. **本仓库的 `qx-smart.conf`**，托管到 URL

### QX 适合谁？
- **适合**：折腾脚本、签到自动化、想导入非标准订阅格式的用户
- **不适合**：只要稳定转发、不做自动化 → Shadowrocket 就够；或者你在 Mac 上也要用 → Surge（有 Mac 版）

### 术语速查
- **QX 配置 `.conf`**：结构和 Surge / Loon 完全不同。关键段落：
  - `[general]` / `[dns]` / `[policy]`（策略组）/ `[server_remote]`（机场订阅）/ `[server_local]`（手动节点）/ `[filter_remote]`（远程规则集 URL）/ `[filter_local]`（内联规则）/ `[rewrite_remote]`（脚本）/ `[mitm]`
- **policy 类型**：`url-latency-benchmark=` ≈ Surge 的 `url-test`；`static=` ≈ Surge 的 `select`
- **server-tag-regex**：QX 按节点的 **tag** 字段（不是 name）做正则匹配

### 3 步走完（+ 一个 QX 特有的第 4 步）
1. **App Store 搜 "Quantumult X" → 购买 → 安装 → 允许 VPN 权限**。
2. **把 `qx-smart.conf` 托管到 URL**（GitHub Raw 最简单）→ QX → 设置 → 配置 → 下载配置 → 粘贴 URL → 下载。
3. **⚠️ QX 特有：加节点要改配置文件**！QX 不会像 SR/Surge 那样自动识别 `[server_local]` 里的节点。打开 `qx-smart.conf` 的 `[server_remote]` 段，加：
   ```
   https://your-subscription.example.com/sub, tag=YOUR_AIRPORT, update-interval=86400, opt-parser=true, enabled=true
   ```
   然后重新下载本配置即可。**或者**在 QX 首页手动扫码/添加节点。
4. **启用** ：QX 首页 → 按下圆形开关。

### 跑起来验证？
- 浏览器打开 `https://www.google.com` 能打开
- QX「策略」面板应看到 37 组（9 url-latency-benchmark + 28 static）
- QX「日志」面板看 filter_remote 下载成功无 404

### 最常见踩坑
- ❌ **加了节点但不被 9 区域组识别**：QX 用节点的 **tag 字段**做正则匹配（不是 name！）。确认订阅返回的节点 tag 含 `HK` / `JP` / `US` 等地区关键字。机场的订阅链接加 `&flag=quanx` 后缀通常能让 tag 含地区标识。
- ❌ **filter_remote 下载一半 404**：先开代理再下配置。
- ❌ **想导入非标准订阅（vless:// 分享链接列表等）**：`resource_parser_url` 已在 `[general]` 预置 KOP-XIAO 的解析脚本，能吃 vmess/vless/trojan/ss/hysteria base64 订阅。
- ❌ **想用 MITM 签到脚本**：本配置默认 `[mitm]` 留空。启用步骤：QX → 证书 → 生成 → 信任 → 在 `[rewrite_remote]` 加社区插件（例如 BoxJs），hostname 自动追加到 `[mitm]`。
- ❌ **想要 LightGBM**：QX 不是 mihomo 内核，不支持。要就用桌面端 Clash Verge Rev / Mihomo Party。

---

## 🔌 协议支持（Quantumult X 自家引擎）

QX 的协议栈**是四大 iOS 付费客户端里最窄的**，换来的是脚本化 / resource_parser 生态最强：

| 协议 | 支持 | 说明 |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | 含 AEAD |
| **ShadowsocksR (SSR)** | ✅ | 兼容老机场 |
| **VMess** | ✅ | ws/grpc 传输层 |
| **VLESS** | ⚠️ | 基础支持，REALITY 兼容性随版本变化 |
| **REALITY / XTLS-Vision** | ⚠️ | 实际效果有限，不如 SR/Loon |
| **Trojan** | ✅ | |
| **Hysteria v1** | ❌ | 不支持 |
| **Hysteria 2** | ❌ | 不支持 |
| **TUIC v5** | ❌ | 不支持 |
| **WireGuard** | ❌ | 不支持 |
| **Snell** | ❌ | 不支持 |
| **AnyTLS / ShadowTLS / Mieru** | ❌ | 不支持 |
| **HTTP/2 / HTTPS / SOCKS5 / HTTP** | ✅ | |

**QX 的定位**：专注 SS/VMess/Trojan 这三类最主流协议 + 把脚本生态做到极致。如果你的机场只给这三类协议，QX 完全够用；如果主推 Hysteria 2 / TUIC / REALITY 类新协议，**建议改用 Shadowrocket 或 Loon**。

### 什么时候选 QX（不是协议原因）？
- 你有大量需要脚本化签到的订阅（BoxJs 生态、VIP 破解、去广告）
- 你订阅的机场是非标准格式，需要 `resource_parser_url` 解析
- 你不在乎新协议（Hysteria 2 / TUIC）

### iOS 四大付费客户端协议最终对比
| 协议 | SR (¥20) | Loon (¥198) | Surge (¥648) | **QX (¥68)** |
|---|:-:|:-:|:-:|:-:|
| Hysteria 2 | ✅ | ✅ | ⚠️ 5.9+ | **❌** |
| TUIC v5 | ✅ | ✅ | ❌ | **❌** |
| VLESS REALITY | ✅ | ✅ | ❌ | **⚠️** |
| WireGuard | ✅ | ✅ | ✅ | **❌** |
| Snell v4 | ✅ | ✅ | ✅ | **❌** |
| 脚本化 / 自动化 | 一般 | 好 | **极好** | **极好** |
| resource_parser 生态 | ❌ | ❌ | ❌ | **✅ 独有** |

---

## 一、下载 Quantumult X

- **iOS**：App Store 搜「Quantumult X」，约 ¥68 / 区。需要非中国区 Apple ID。
- **仅 iOS**，没有 macOS 版本。
- 安装后首次启动授权 VPN 配置权限。

---

## 二、配置托管 & 导入

QX 从 URL 导入配置（不支持本地文件直接打开）：

1. 把 `qx-smart.conf` 托管到可访问 URL（GitHub Raw / jsDelivr / 自建 HTTPS）。
2. 打开 QX → 底部「**设置**（Setting）」→ **配置** → **下载配置**。
3. 粘贴 URL → 点击 **下载**。
4. 下载完成后 QX 会自动切换到新配置。

首次启用时 QX 会拉取 **360 个 filter_remote**（blackmatrix7 QX 专用 `.list` 格式），根据网络情况约 **2–5 分钟**。**务必先开代理再下载**。

---

## 三、机场订阅 / 节点（⚠️ 必须手动配置）

**QX 不会自动识别 `[server_local]` / `[server_remote]` 的节点**，需要你手动添加：

### 方式 A：订阅（推荐）
编辑 `qx-smart.conf` 的 `[server_remote]` 段，加入：
```
https://your-subscription.example.com/sub, tag=YOUR_AIRPORT, update-interval=86400, opt-parser=true, enabled=true
```

然后重新下载/应用配置。QX 会拉取订阅节点，按节点名正则匹配到对应的 9 区域组。

### 方式 B：手动粘贴节点
在 `[server_local]` 段按 QX 格式粘贴：
```
vmess=example.com:443, method=chacha20-ietf-poly1305, password=UUID, obfs=wss, obfs-host=example.com, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=HK-01
trojan=example.com:443, password=xxx, over-tls=true, tls-host=example.com, tag=HK-02
ss=example.com:443, method=aes-256-gcm, password=xxx, tag=JP-01
```

tag 里最好含地区标识（`HK` / `JP` / `US` 等），让正则能自动归类。

### 方式 C：QX UI 扫码导入
QX 首页 → ➕ → 扫描 QR / 手动添加。这种方式节点单独管理，不在配置文件里，重装 QX 会丢。

---

## 四、9 区域 × 28 业务组结构

结构与 Surge / Shadowrocket 一致，但 QX 使用自家的 policy 类型名：

### 9 区域组（QX: `url-latency-benchmark`）
- 使用 `server-tag-regex=<正则>` 按节点 tag 自动匹配
- `check-interval=600` 每 10 分钟重测延迟
- `tolerance=100` ms 防抖
- 选最低延迟

### 28 业务组（QX: `static`）
- 手动选择候选项（包含 9 区域组 + direct + reject）
- 首次导入后建议在 QX UI 里逐组指定偏好区域

业务组推荐配置参考 `Surge/README.md` 第五章，完全通用。

---

## 五、[dns] 配置（与 Clash Party 对齐）

QX 的 DNS 配置用多行 `server=` 声明：

```
server=223.5.5.5
server=119.29.29.29
server=https://doh.pub/dns-query
server=https://dns.alidns.com/dns-query
server=https://1.1.1.1/dns-query
server=https://8.8.8.8/dns-query
server=/*.apple.com/system     # 系统 DNS 处理 Apple 服务
server=/*.icloud.com/system
no-ipv6                        # QX 的 IPv6 策略（与 Clash `ipv6: false` 对齐）
```

**与 Clash Party 对比**：
- 国内/国外 DoH 用多行 `server=` 实现（Clash 的 `nameserver` + `direct-nameserver` + `fallback` 语义合并）
- `server=/<domain>/system` 是 QX 特有语法，把特定域名的解析交给 iOS 系统 DNS（解决 Apple/iCloud 推送 DNS 敏感问题）

**QX 不支持的 Clash 字段**：
- `fallback-filter.geoip-code: CN`（QX 无 DNS GeoIP 过滤层）
- `respect-rules: true`（QX 设计上默认尊重规则）
- `proxy-server-nameserver` 作为独立通道（QX 和 nameserver 合并）

---

## 六、QX 独有能力 / 与 Surge/Loon 差异

| 能力 | QX | Surge | Loon |
|---|---|---|---|
| `resource_parser_url` 脚本化订阅解析 | ✅ 核心特性 | ❌ 无 | ❌ 无 |
| `[rewrite_local]` + `[rewrite_remote]` 脚本化签到 | ✅ 强 | ✅ 支持 | ✅ 支持 |
| `[task_local]` 定时任务（cron 格式） | ✅ 原生 | ❌ 无等价 | ⚠️ 部分 |
| `[policy]` 类型：`url-latency-benchmark`、`available`、`static`、`ssid`、`round-robin`、`dest-hash` | ✅ 丰富 | ✅ 类似 | ✅ 类似 |
| `server-tag-regex` 正则过滤 | ✅ 原生 | ✅ `policy-regex-filter` | ✅ `policy-regex-filter` |
| MMDB 配置位置 | ⚠️ UI 下载 | ✅ 配置文件指定 | ⚠️ UI 下载 |
| macOS 版本 | ❌ 仅 iOS | ✅ Surge Mac | ❌ 仅 iOS |
| 价格（2026-04） | 约 ¥68 | ¥648 | ¥198 |

QX 的真正优势是 **`resource_parser_url`（通用资源解析器）+ `rewrite_local/remote`（脚本化重写）** 生态，对"签到自动化 / VIP 破解 / 小众订阅格式支持"最强。本仓库默认不启用这些高阶特性（量化/交易场景不需要），用户可在 `[rewrite_remote]` 自行追加社区插件（例如 `https://...boxjs.conf`）。

---

## 七、与 Clash Party 主线的差异（QX 引擎限制）

| 差异 | 原因 |
|------|------|
| ❌ 无 Mihomo Smart 组 / LightGBM | QX 核心不是 Mihomo |
| ❌ 无 TLS 指纹注入 | QX 不暴露 uTLS 控制 |
| ❌ PROCESS-NAME 规则 | iOS 无进程 API（自动跳过，见 filter_local 注释） |
| ❌ URL-REGEX 规则 | QX 的 filter_local 不支持 URL-REGEX（自动跳过） |
| ⚙️ GEOSITE → filter_remote URL | QX 只支持 RULE-SET 样的远程 filter |
| ⚙️ Meta `.mrs` → blackmatrix7 QuantumultX `.list` | 格式兼容性（转换脚本自动改路径） |

---

## 八、验证

1. QX → **设置** → **配置** → 查看当前配置名称，应显示 `Quantumult X Smart v5.2.5-QX.2`。
2. **策略（Policy）** 面板应出现 37 组（9 `url-latency-benchmark` + 28 `static`）。
3. **日志（Log）** 查看 filter_remote 下载状态，无 404 / timeout 即成功。
4. 访问测试：
   - `chat.openai.com` → 🤖 AI 服务
   - `www.netflix.com` → 🇺🇸 美国流媒体
   - `www.bilibili.com` → direct / 📺 国内流媒体
   - `raw.githubusercontent.com` → 📟 开发者服务

---

## 九、常见问题

### Q1：filter_remote 下载失败？
- 开代理再下配置；GitHub / jsDelivr 在国内需要代理访问。
- 若仍失败，**设置 → 配置 → 一键更新** 强制重新拉取。

### Q2：节点没被自动聚合到 9 区域组？
- QX 用 `server-tag-regex` 匹配节点的 tag 字段（不是 name）。确认你订阅返回的节点 tag 里含 `HK` / `JP` / `US` 等地区关键字 + 中文国名。
- 本仓库的 regex 兼容「中文国名 / ISO 国家代码 / IATA 机场代码 / emoji 旗帜」多种标识，覆盖率 > 95%。

### Q3：想用 QX 的 resource_parser_url 解析非标准订阅？
- 配置里已预置 `resource_parser_url=https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/resource-parser.js`（KOP-XIAO 的通用解析器）。
- 它能处理 vmess / vless / trojan / ss / hysteria / base64 订阅，自动转为 QX 格式。

### Q4：我想加入广告净化 / 签到脚本？
- 编辑 `[rewrite_remote]` 段，加入社区插件，例如：
  ```
  https://raw.githubusercontent.com/.../BoxJs.conf, tag=BoxJs, update-interval=86400, opt-parser=true, enabled=true
  ```
- 插件 MITM 的 hostname 会自动追加到 `[mitm]` 段（开启 MITM 需在 QX 生成证书并在 iOS 信任）。

### Q5：跨境场景切换？
参考 Surge 教程第十章「跨境场景」，QX 同样支持 `ssid`-based policy 做 WiFi 自动切换，本仓库未默认启用；有需要可在 `[policy]` 段追加 `ssid=...` 类型组。

### Q6：我想 macOS 上用 Quantumult X？
- QX **没有 macOS 版本**。如需跨设备统一，用 Surge（有 Mac 版）或 Clash Verge Rev。

---

## 十、转换脚本（如何自己从 Shadowrocket 重新生成 QX 配置）

`/tmp/srk_to_qx.py`（仓库内未提交的辅助脚本）可以把 `Shadowrocket/shadowrocket-smart.conf` 重新生成 QX 配置：

```python
python3 /tmp/srk_to_qx.py
# 输出:
# Generated: Quantumult X/qx-smart.conf
#   policies: 37
#   filter_remote: 360
#   filter_local: 567 rules + 167 comments
```

转换规则摘要：
- `[Proxy Group]` url-test → `[policy]` `url-latency-benchmark`
- `[Proxy Group]` select → `[policy]` `static`
- `RULE-SET,<URL>,<POLICY>` → `[filter_remote]` 条目（自动改写 `/rule/Shadowrocket/` → `/rule/QuantumultX/`）
- `DOMAIN-SUFFIX` → `host-suffix`；`DOMAIN-KEYWORD` → `host-keyword`；`DOMAIN` → `host`
- `IP-CIDR` / `IP6-CIDR` / `GEOIP` → QX 小写形式
- `FINAL` → `final`；`REJECT` → `reject`；`DIRECT` → `direct`
- `USER-AGENT` → `user-agent`
- `PROCESS-NAME` / `URL-REGEX` → 标记为注释（QX filter_local 不支持）

---

## 十一、致谢

- [Quantumult X](https://apps.apple.com/app/quantumult-x/id1443988620)
- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) - QuantumultX `.list` 规则源
- [KOP-XIAO/QuantumultX](https://github.com/KOP-XIAO/QuantumultX) - resource_parser + IP_API 脚本
- [Koolson/Qure](https://github.com/Koolson/Qure) - policy 图标库
- [Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip) - GeoIP MMDB
- 原版 Clash Party v5.2.3 所有参考作者
