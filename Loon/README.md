# Loon 使用教程（对齐 Clash Party v6.0.20）

## 📥 规则下载链接

[![下载规则：Loon CONF](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Loon%20CONF-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Loon/Loon.conf)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**Loon CONF 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Loon/Loon.conf
```

复制配置直链，按下文导入并接入节点订阅。

---

规则下载需能访问 GitHub Raw；见[下载排错](../docs/rule-asset-delivery.md)。可选[测速与 QUIC 策略](../docs/traffic-options.md)、[微信连接排错](../docs/research/2026-10-16-wechat-issue-187.md)与[Claude Desktop 网络依赖](../docs/claude-service-dependencies.md)另有说明。

> 配置：`Loon.conf` · **v6.0.20-Loon.9**（Build 2026-10-16）
> 22 区域组（11 全部 + 11 家宽）+ 33 业务组；跟随 Clash Party v6.0.20 分流基线。

<sub>💖 [支持本项目](../docs/donate.md) · ⭐ [Star](https://github.com/ivansolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues)</sub>

---

## 🚀 零基础快速开始

### 这是什么？

本仓库的 `Loon.conf` 提供国内直连、海外代理和广告拦截规则；机场节点需另行添加。

### 我要准备什么？

准备 Loon、机场订阅 URL 和上方配置直链。截至 2026-10-19，官方稳定版 3.5.2 要求 iOS 15+；官方商店亦允许在 Apple Silicon Mac 上运行 iOS App，这与独立原生 Mac 版本不同。来源见[复核报告](../docs/upstream/2026-10-19/apple/report.md)。

### Loon 值不值这个价？替代品对比

按协议、插件与平台需求选择；下表的价格、主观评分和“无 Mac”是历史对照，实际价格与设备兼容性以官方商店为准。

| | Shadowrocket | **Loon** | Surge | QX |
|---|---|---|---|---|
| 价格 | ¥20 | **¥198** | ¥648 | ¥68 |
| 稳定性 | 普通 | **好** | 极好 | 好 |
| macOS 版 | ✅ | ❌ | ✅ | ❌ |
| 脚本/MITM | 一般 | **好** | 极好 | 极好 |
| 插件生态 | ❌ | **✅ Plugin** | ⚠️ Modules | ⚠️ Scripts |

### 术语速查

- `.conf`：分流配置，不含机场节点。
- `[Remote Rule]`：联网下载的远程规则。
- `NameRegex`：按节点名筛选地区。
- MMDB：GeoIP 数据库，本配置通过 `geoip-url` 指定。

### 3 步走完

1. 安装 Loon，首次连接时允许添加 VPN 配置。
2. 按第二节从上方直链导入配置。
3. 按第三节添加机场订阅，检查规则与节点后连接。

### 跑起来验证？

确认 **22 区域 + 33 业务 = 55 组**，检查远程规则下载完成，再按第九节查看实际请求的命中规则与出口。

### 最常见踩坑

不要直接导入其他客户端的配置；Loon 的 DNS、节点过滤和端口语法有差异。下载或节点分类异常见第十节；本配置不提供 Mihomo Smart / LightGBM。

## 🔌 协议支持（Loon 自家引擎）

协议与版本证据见[官方文档](https://nsloon.app/docs/intro/)和[复核报告](../docs/upstream/2026-10-19/apple/report.md)。

| 协议 | 支持 | 说明 |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | AEAD + SS 2022 |
| **ShadowsocksR (SSR)** | ✅ | 兼容老机场 |
| **VMess** | ✅ | ws/grpc/h2 |
| **VLESS** | ✅ | 含 **REALITY** |
| **XTLS-Vision** | ✅ | |
| **Trojan** | ✅ | |
| **Hysteria v1** | ✅ | |
| **Hysteria 2** | ✅ | |
| **TUIC v5** | ✅ | |
| **WireGuard** | ✅ | 作为子代理 |
| **Snell v3 / v4** | ✅ | 少有的 iOS 客户端支持 Snell |
| **AnyTLS / ShadowTLS** | ✅ | [官方版本历史](https://apps.apple.com/us/app/loon/id1373567447)：AnyTLS 3.3.9（2026-03-31）；ShadowTLS 3.2.6（2025-02-03） |
| **SOCKS5 / HTTP(S)** | ✅ | |

---

### iOS 四大付费客户端协议对比（速决表）

| 协议 | SR (¥20) | **Loon (¥198)** | Surge (¥648) | QX (¥68) |
|---|:-:|:-:|:-:|:-:|
| Hysteria 2 | ✅ | **✅** | ✅ iOS 5.8.0+ | ❌ |
| TUIC v5 | ✅ | **✅** | ✅ | ❌ |
| VLESS REALITY | ✅ | **✅** | ❌ | ✅ REALITY |
| XTLS-Vision | ✅ | **✅** | ❌ | ⚠️ |
| WireGuard | ✅ | **✅** | ✅ | ❌ |
| Snell v4 | ✅ | **✅** | ✅ | ❌ |
| 稳定性 | 普通 | **好** | 极好 | 好 |
| 插件生态 | ❌ | **✅** | ⚠️ Modules | ⚠️ Scripts |
| macOS 支持 | ✅ | ❌ | ✅ | ❌ |

按所需协议及最低版本核对；历史价格与主观比较不代表当前商店报价。

## 一、下载 Loon

从 [App Store](https://apps.apple.com/app/loon/id1373567447)安装 Loon。商店地区、系统要求和 Mac 兼容性以官方页面为准。

---

## 二、配置托管 & 导入

1. 复制上方配置直链；需要自定义时，放到自己的 HTTPS 地址。
2. 在 Loon 的配置管理中从 URL 下载，选择并启用该配置。
3. 检查远程规则是否下载完成；GitHub Raw 不可达时，先使用可用代理下载。

---

## 三、机场订阅 / 节点

在 Loon 的订阅管理中添加**机场订阅 URL**，更新后检查节点列表。地区筛选使用 `[Remote Filter]` 的 `NameRegex / FilterKey`；主配置不包含可用节点。

机场应提供 Loon 支持的订阅格式；导入后确认各区域组实际成员。

---

### 多机场订阅合并

可以分别添加订阅；如需转换或合并，输出须为 Loon 支持的格式。第三方转换服务可读取含 token 的订阅链接，使用前确认服务可信。

## 四、11 区域 × 33 业务组说明

11 个地区各有全部节点和家宽节点组，共 22 个 `url-test` 区域组；33 个业务组供手动选择上游。名称需含地区标识，具体测速参数以配置文件为准。

---

## 五、DNS 配置（Loon 原生语法，≠ Surge）

本配置使用 Loon 原生 DNS 字段，不能直接复制 Mihomo 或 Surge 的 DNS 配置。

| Loon 字段 | 值 | 说明 |
|-----------|------|------|
| `dns-server` | `223.5.5.5, 119.29.29.29, 1.1.1.1, 8.8.8.8` | ⚠️ Loon 的 `dns-server` **仅接受** `system` 与纯 IP，**不接受** DoH URL |
| `doh-server` | `alidns / doh.pub / cloudflare / google` | DoH URL **必须**放这里，不能塞进 dns-server |
| `ipv6` | `true` | Loon 字段名是 `ipv6`，不是 `ipv6-enabled` |
| `udp-fallback-mode` | `REJECT` | Loon 对应 Surge 的 `udp-policy-not-supported-behaviour` |
| `disable-udp-ports` | `443` | 对应 Surge 的 `block-quic`（封 HTTP/3） |
| `bypass-tun` | 私有网段列表 | Loon 对应 Surge 的 `tun-excluded-routes`；Loon **没有** `bypass-system` |

上表是历史字段对照；当前配置使用 `ip-mode`，不是 `ipv6`。官方注明 `ip-mode` 要求 3.2.3(754)+，`hijack-dns` 要求 3.2.5(789)+。Loon 默认在加密 DNS 失败后回退普通 DNS，可在 App 中关闭；详见[原生字段依据](./REFERENCE-loon-manual.md)。

---

## 六、MMDB 数据库（配置文件自动下载，无需 UI 手动操作）

配置已通过 `geoip-url` 指定 MMDB 来源：

```
geoip-url = https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb
```

导入后检查数据库下载状态；下载失败时先确认 URL 与网络，不以“配置已启用”代替数据库可用。

---

## 七、Loon 独有能力

| 能力 | Loon | Surge |
|---|---|---|
| `[Remote Rule]` 规则集独立管理面板 | ✅ 原生支持 | ❌ 无对应面板 |
| `[Plugin]` 插件系统（脚本 + 规则） | ✅ 支持 | ❌ 无 |
| `[Script]` JS 脚本（签到/响应改写） | ✅ 原生 | ✅ 原生 |
| `configuration-enhanced` 增强插件库 | ✅ 生态丰富 | ❌ Surge Modules 体系 |
| 在配置里设置 MMDB URL | ❌ 只能 UI 下载 | ✅ `geoip-maxmind-url` |
| macOS 版本 | ❌ 仅 iOS | ✅ Surge Mac |

上表保留历史功能对照；“MMDB 只能 UI 下载”不适用于当前配置，见第六节。Mac 兼容性见快速开始；插件与脚本需另行配置，本仓库不依赖它们。

---

## 八、与 Clash Party 主线的差异（Loon 引擎限制）

| 差异 | 原因 |
|------|------|
| ❌ 无 Mihomo Smart 组 / LightGBM | Loon 不是 Mihomo 核 |
| ❌ 无 TLS 指纹注入 | Loon 不暴露 uTLS 控制 |
| ❌ PROCESS-NAME | iOS 无进程 API |
| ❌ Clash classical `.yaml` RULE-SET | Loon 只支持 `.list` / `.conf` 纯文本；v5.2.4-Loon.2 已清理掉 72 条 Accademia YAML |
| ❌ Sukka `List/domainset/*.conf` | 该二级格式是 Surge 专属；Loon 用 `List/non_ip/*.conf` 代替 |
| ⚙️ GEOSITE → RULE-SET | Loon 只支持 RULE-SET + GEOIP（`geoip-url` 可自定义 MMDB） |
| ⚙️ Meta `.mrs` → blackmatrix7 Loon `.list` | 格式兼容性 |
| ⚙️ `policy-regex-filter=` → `[Remote Filter] NameRegex` | Loon 引擎的独立 filter 段 |

当前远程规则使用本仓库融合资产；上表中的旧上游路径与历史源替换不代表现行下载链路。iOS 不支持进程规则；官方说明含进程条件的整条逻辑规则在 iOS / tvOS 上会被忽略。

---

### 已接受的规则回归损失（v5.2.4-Loon.2）

历史规则源替换记录见 [CHANGELOG](./CHANGELOG.md)。当前平台边界与官方来源见[复核报告](../docs/upstream/2026-10-19/apple/report.md)。

## 九、验证

1. 确认启用本目录配置，55 个组已载入，区域组含可用节点。
2. 检查所有远程规则下载状态。
3. 访问 `chat.openai.com`、`www.netflix.com`、`www.bilibili.com`，在请求日志中核对 AI、Netflix、国内流媒体的规则与实际出口。
4. 继续完成根 README 的[导入后验证清单](../README.md#-导入后-60-秒验证清单)。

---

## 十、常见问题

### Q1：我能直接导入 Surge 的 `Surge.conf` 到 Loon 吗？

请使用本目录的 `Loon.conf`。DNS、`NameRegex`、端口及 MMDB 字段应按 Loon 语法填写，不能整份混用其他客户端配置。

### Q2：想要 Mihomo Smart + LightGBM 怎么办？

需使用支持该能力的 Mihomo Smart 客户端；Loon 的 `url-test` 不提供 LightGBM。

### Q3：跨境场景切换？

在策略面板切换“受限网站”“国外网站”“国内流媒体”等业务组；参考 [Surge 跨境场景](../Surge/README.md#q6跨境场景中国--海外怎么切换)。

### Q4：Loon 规则集更新周期怎么调？

在 Loon 中检查配置与远程规则的更新设置，刷新后确认下载状态。

### Q5：我想用 Loon 的插件（Plugin）生态？

可在插件面板添加所需插件；先检查其规则、重写、脚本与现有配置是否冲突，需要 MITM 时按官方流程配置证书。

## 十一、致谢

[Loon](https://apps.apple.com/app/loon/id1373567447) · [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip)

---

## 💖 支持本项目

→ [捐赠 / Star / PR](../docs/donate.md)
