# Quantumult X 使用教程（对齐 Clash Party v6.0.20）

## 📥 规则下载链接

[![下载规则：Quantumult X CONF](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Quantumult%20X%20CONF-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Quantumult%20X/QuantumultX.conf)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**Quantumult X CONF 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Quantumult%20X/QuantumultX.conf
```

复制配置直链，按下文导入并接入节点订阅。

---

规则下载需能访问 GitHub Raw；见[下载排错](../docs/rule-asset-delivery.md)。可选[测速与 QUIC 策略](../docs/traffic-options.md)、[微信连接排错](../docs/research/2026-10-16-wechat-issue-187.md)与[Claude Desktop 网络依赖](../docs/claude-service-dependencies.md)另有说明。

> 配置：`QuantumultX.conf` · **v6.0.20-QX.11**（Build 2026-10-19）
> 22 区域组（11 全部 + 11 家宽）+ 33 业务组；跟随 Clash Party v6.0.20 分流基线。

<sub>💖 [支持本项目](../docs/donate.md) · ⭐ [Star](https://github.com/ivansolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues)</sub>

---

## 🚀 零基础快速开始

### 这是什么？

本仓库的 `QuantumultX.conf` 提供 QX 原生分流配置；机场节点需另行接入。订阅解析器用于格式转换，不能增加客户端本身不支持的协议。

### 我要准备什么？

准备 Quantumult X、机场订阅 URL 和上方配置直链。截至 2026-10-19，官方稳定版 1.8.1 要求 iOS 15+；其他设备兼容性以[官方商店](https://apps.apple.com/us/app/quantumult-x/id1443988620)为准。

### QX 适合谁？

需要 QX 的资源解析、重写或定时任务时，可按所需功能选择；本配置主要提供分流规则。

### 术语速查

- `[server_remote]` / `[server_local]`：订阅 / 手动节点。
- `[policy]`：策略组，`url-latency-benchmark` 自动测速，`static` 手动选择。
- `[filter_remote]` / `[filter_local]`：远程 / 本地规则。
- `server-tag-regex`：按节点 `tag` 筛选地区。

### 3 步走完（+ 一个 QX 特有的第 4 步）

1. 安装 QX，首次连接时允许添加 VPN 配置。
2. 按第二节从上方直链导入配置。
3. 按第三节填写订阅或添加节点。
4. 检查规则与组内节点，再开启首页连接开关。

### 跑起来验证？

确认 **22 区域 + 33 业务 = 55 组**，远程规则已下载，再按第八节查看实际请求的规则与出口。

### 最常见踩坑

节点分类依赖 `tag` 中的地区标识；格式转换不代表协议可用。下载、解析器及 MITM 问题见第九节；QX 不提供 Mihomo Smart / LightGBM。

## 🔌 协议支持（Quantumult X 自家引擎）

按[官方版本历史](https://apps.apple.com/us/app/quantumult-x/id1443988620)与[官方示例](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)核对：

| 协议 | 支持 | 说明 |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | 含 AEAD |
| **ShadowsocksR (SSR)** | ✅ | 兼容老机场 |
| **VMess** | ✅ | ws/grpc 传输层 |
| **VLESS** | ✅ | 官方版本历史：1.5.0 引入 |
| **REALITY** | ✅ | 官方版本历史：1.5.5 引入；不等同于 XTLS-Vision |
| **XTLS-Vision** | ⚠️ | 本次未取得可确认的官方支持证据 |
| **Trojan** | ✅ | |
| **Hysteria v1** | ❌ | 不支持 |
| **Hysteria 2** | ❌ | 不支持 |
| **TUIC v5** | ❌ | 不支持 |
| **WireGuard** | ❌ | 不支持 |
| **Snell** | ❌ | 不支持 |
| **AnyTLS** | ✅ | 官方版本历史：1.6.0（2026-05-21）引入 |
| **ShadowTLS / Mieru** | ⚠️ | 本次未取得可确认的官方支持证据 |
| **HTTP/2 / HTTPS / SOCKS5 / HTTP** | ✅ | |

REALITY 支持不能推导为 XTLS-Vision 支持，后者及 ShadowTLS / Mieru 仍待官方证据确认。完整来源见[复核报告](../docs/upstream/2026-10-19/apple/report.md)。

---

### 什么时候选 QX（不是协议原因）？

除协议外，按资源解析、重写和定时任务需求选择；自动化脚本需自行配置。

### iOS 四大付费客户端协议最终对比

| 协议 | SR (¥20) | Loon (¥198) | Surge (¥648) | **QX (¥68)** |
|---|:-:|:-:|:-:|:-:|
| Hysteria 2 | ✅ | ✅ | ✅ iOS 5.8.0+ | **❌** |
| TUIC v5 | ✅ | ✅ | ✅ | **❌** |
| VLESS REALITY | ✅ | ✅ | ❌ | **✅ REALITY** |
| WireGuard | ✅ | ✅ | ✅ | **❌** |
| Snell v4 | ✅ | ✅ | ✅ | **❌** |
| 脚本化 / 自动化 | 一般 | 好 | **极好** | **极好** |
| resource_parser 生态 | ❌ | ❌ | ❌ | **✅ 独有** |

表中价格与主观评分保留为历史比较，实际报价和设备兼容性以官方商店为准。

## 一、下载 Quantumult X

从 [App Store](https://apps.apple.com/app/quantumult-x/id1443988620)安装。此教程面向 iPhone / iPad；其他设备请核对商店兼容列表。

---

## 二、配置托管 & 导入

1. 复制上方 Raw URL；需要自定义时，放到自己的 HTTPS 地址。
2. QX → **设置** → **配置** → **下载配置**，粘贴 URL 并应用。
3. 确认所有 `filter_remote` 下载完成；GitHub Raw 不可达时，先使用可用代理下载。

---

## 三、机场订阅 / 节点（⚠️ 必须手动配置）

模板不含可用节点。任选以下方式接入；订阅内容需符合 QX 支持的格式与协议。

---

### 方式 A：订阅（推荐）

编辑 `[server_remote]`，填入机场订阅并重新应用配置：

```
https://your-subscription.example.com/sub, tag=YOUR_AIRPORT, update-interval=86400, opt-parser=true, enabled=true
```

检查订阅节点的 `tag` 是否包含 HK / JP / US 等地区标识。

### 方式 B：手动粘贴节点

在 `[server_local]` 中填写 QX 原生节点定义，将示例主机、凭据和 `tag` 换成实际值：

```
vmess=example.com:443, method=chacha20-ietf-poly1305, password=UUID, obfs=wss, obfs-host=example.com, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=HK-01
trojan=example.com:443, password=xxx, over-tls=true, tls-host=example.com, tag=HK-02
ss=example.com:443, method=aes-256-gcm, password=xxx, tag=JP-01
```

### 方式 C：QX UI 扫码导入

在 QX 首页通过 ➕ 扫码或手动添加节点，再确认策略组可引用。

### 方式 D：在线订阅转换站（多机场合并）

如需转换或合并，输出须为 QX 支持的格式。第三方服务可读取含 token 的订阅链接；解析器转换格式后仍需核对协议支持。

## 四、11 区域 × 33 业务组结构

11 个地区各有全部节点与家宽节点组，共 22 个区域组，另有 33 个业务组。

---

### 11 区域组（QX: `url-latency-benchmark`）

使用 `server-tag-regex` 匹配节点 `tag`；当前 `check-interval=300`、`tolerance=10`。官方示例中的正则过滤注释与具体示例存在冲突，组内实际展开仍需 App 验收。

### 33 业务组（QX: `static`）

在策略面板手动选择节点或区域组；参考 [Surge 业务组说明](../Surge/README.md#业务策略组select-手动)，服务是否可用仍取决于实际出口。

## 五、[dns] 配置（与 Clash Party 对齐）

普通 DNS 使用 `server=`，DoH 使用 `doh-server=`。当前配置按官方多 DoH 写法放在**同一行，以逗号分隔**：

```
server=223.5.5.5
server=119.29.29.29
server=1.1.1.1
server=8.8.8.8
doh-server=https://223.5.5.5/dns-query, https://223.6.6.6/dns-query, https://8.8.8.8/dns-query, https://1.1.1.1/dns-query
no-ipv6
```

Apple / iCloud 等系统 DNS 例外由 `[general] dns_exclusion_list` 配置。此处不宣称等价实现 Mihomo 的 `fallback-filter`、`respect-rules` 或独立 `proxy-server-nameserver`；官方写法及真实并发查询的待验边界见[复核报告](../docs/upstream/2026-10-19/apple/report.md)。

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

上表为历史功能比较：“无 macOS 版本”不等于商店 App 不能在兼容 Mac 上运行；Loon 当前节点筛选使用 `NameRegex`，MMDB 使用 `geoip-url`。重写、任务和 MITM 不由本配置默认启用。

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

当前使用本仓库发布的融合 `filter_remote`；表中旧源路径与“转换脚本”描述不代表现行维护方式。平台边界见[复核报告](../docs/upstream/2026-10-19/apple/report.md)。

---

## 八、验证

1. 确认启用 `Quantumult X Smart v6.0.20-QX.11`，有 22 个区域组和 33 个 `static` 业务组，区域组含节点。
2. 检查所有 `filter_remote` 下载成功。
3. 访问 `chat.openai.com`、`www.netflix.com`、`www.bilibili.com`，在日志中核对 AI、Netflix、国内流媒体的规则与实际出口。
4. 继续完成根 README 的[导入后验证清单](../README.md#-导入后-60-秒验证清单)。

---

## 九、常见问题

### Q1：filter_remote 下载失败？

确认 GitHub Raw 可达，必要时先使用可用代理，再刷新配置与远程规则。详见[下载排错](../docs/rule-asset-delivery.md)。

### Q2：节点没被自动聚合到 11 区域组？

检查节点 `tag` 中是否含中文地区名或 HK / JP / US 等标识；也兼容 hk01 / jp01 / us01 形式。以组内实际成员确认分类，不以节点已下载代替匹配成功。

### Q3：想用 QX 的 resource_parser_url 解析非标准订阅？

配置已引用 KOP-XIAO 解析器。仅对可信订阅启用 `opt-parser=true`；转换结果仍须符合 QX 协议能力，不能借解析器获得 Hysteria 2 / TUIC 等核心未支持的协议。

### Q4：我想加入广告净化 / 签到脚本？

在 `[rewrite_remote]` 添加所需资源，以下 URL 是占位样例，使用前换为可信来源：

  ```
  https://raw.githubusercontent.com/.../BoxJs.conf, tag=BoxJs, update-interval=86400, opt-parser=true, enabled=true
  ```

需要 MITM 时，按 QX 官方流程配置并信任证书、核对目标 hostname，同时检查规则冲突。

### Q5：跨境场景切换？

在策略面板切换对应业务组；场景参考 [Surge 跨境说明](../Surge/README.md#q6跨境场景中国--海外怎么切换)。

### Q6：我想 macOS 上用 Quantumult X？

先核对[官方商店兼容列表](https://apps.apple.com/us/app/quantumult-x/id1443988620)；是否有独立原生 Mac 版与能否在兼容 Mac 运行商店 App 是两项不同条件，本教程未完成 Mac 导入验收。

## 十、维护状态

QX 使用独立原生配置；更新时刷新本仓库 URL，本地定制先备份。版本与配置变更见 [CHANGELOG](./CHANGELOG.md)，官方证据及 App 验证缺口见[复核报告](../docs/upstream/2026-10-19/apple/report.md)。

---

## 十一、致谢

[Quantumult X](https://apps.apple.com/app/quantumult-x/id1443988620) · [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [KOP-XIAO/QuantumultX](https://github.com/KOP-XIAO/QuantumultX) · [Koolson/Qure](https://github.com/Koolson/Qure)

---

## 💖 支持本项目

→ [捐赠 / Star / PR](../docs/donate.md)
