<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-quantumult-x-mobile.svg">
  <img src="../../docs/assets/readme/page-quantumult-x.svg" alt="Quantumult X 导入指南" width="100%">
</picture>

# Quantumult X 使用教程

QX 原生分流教程：导入配置，填写节点订阅，再检查 policy 与 filter_remote。资源解析器只转换格式，不能扩展核心协议能力。

[![下载目录](../../docs/assets/readme/nav-downloads.svg)](../../docs/guide/downloads.md) [![文档导航](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [![导入步骤](../../docs/assets/readme/nav-tutorial.svg)](#import) [![导入验收](../../docs/assets/readme/nav-verify.svg)](#verification)

[开始前](#before-start) · [获取配置](#download) · [顺序导入](#import) · [必要设置](#settings) · [验收](#verification) · [常见问题](#faq) · [进阶与参考](#reference)

> 配置：`QuantumultX.conf` · **v6.0.21-QX.13**（Build 2026-10-28）
> 22 区域组（11 全部 + 11 家宽）+ 33 业务组；跟随 Clash Party v6.0.21 分流基线。

<a id="before-start"></a>


## 开始前

准备 Quantumult X、机场订阅 URL 和下方配置直链。截至 2026-10-19，官方稳定版 1.8.1 要求 iOS 15+；其他设备兼容性以[官方商店](https://apps.apple.com/us/app/quantumult-x/id1443988620)为准。

- 从 [App Store](https://apps.apple.com/app/quantumult-x/id1443988620)安装，首次连接需允许添加 VPN 配置。
- `[server_remote]` / `[server_local]` 分别填写订阅 / 手动节点，本模板没有可用节点。
- `[policy]` 定义策略；`[filter_remote]` / `[filter_local]` 是远程 / 本地规则。
- QX 不提供 Mihomo Smart / LightGBM。

<a id="download"></a>

## 获取配置

[![下载 Quantumult X CONF](../../docs/assets/readme/button-quantumult-x-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/QuantumultX.conf)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**Quantumult X CONF 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/QuantumultX.conf
```

复制配置直链，按下文导入并接入节点订阅。

配置下载和远程规则更新需要访问 GitHub Raw；失败时参见[下载排错](../../docs/rule-asset-delivery.md)。本地定制先保留副本，远程更新可能覆盖修改。

### 在线选择与本地导入

打开[在线配置页面](https://ivansolis1989.github.io/Smart-Config-Kit/)，选择 **Quantumult X** 和 Full、Lite 或 Custom 业务方案，可按需设置测速；此端不提供 QUIC 开关，也不提供运行时节点 DNS 或倍率适配。

下载 `.conf` 后，按下文填写 `[server_remote]` 或手动节点；可将副本放到自己的 HTTPS 地址，使用下方 **设置 → 配置 → 下载配置** 入口下载并应用。

Lite / Custom 的业务组按所选方案裁剪；下方组数量为 Full 基线。更新时刷新在线页面，重新选择相同业务方案和参数并下载；先备份已有配置及节点定制，再按上述方式替换或重新导入。不要用本仓库完整配置直链刷新覆盖定制文件。选择和生成在本机完成，不读取或上传订阅和个人配置。含订阅地址的配置应妥善保管，托管时避免公开暴露。详见[在线配置指南](../../docs/configuration.md)。

<a id="import"></a>

## 按顺序导入

### 1. 导入分流配置

1. 复制上方 Raw URL；需要自定义时，放到自己的 HTTPS 地址。
2. QX → **设置** → **配置** → **下载配置**，粘贴 URL 并应用。
3. 确认所有 `filter_remote` 下载完成；GitHub Raw 不可达时，先使用可用代理下载。

### 2. 机场订阅 / 节点（⚠️ 必须手动配置）

模板不含可用节点。任选以下方式接入；订阅内容需符合 QX 支持的格式与协议。

#### 方式 A：订阅（推荐）

编辑 `[server_remote]`，填入机场订阅并重新应用配置：

```
https://your-subscription.example.com/sub, tag=YOUR_AIRPORT, update-interval=86400, opt-parser=true, enabled=true
```

检查订阅节点的 `tag` 是否包含 HK / JP / US 等地区标识。

#### 方式 B：手动粘贴节点

在 `[server_local]` 中填写 QX 原生节点定义，将示例主机、凭据和 `tag` 换成实际值：

```
vmess=example.com:443, method=chacha20-ietf-poly1305, password=UUID, obfs=wss, obfs-host=example.com, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=HK-01
trojan=example.com:443, password=xxx, over-tls=true, tls-host=example.com, tag=HK-02
ss=example.com:443, method=aes-256-gcm, password=xxx, tag=JP-01
```

#### 方式 C：QX UI 扫码导入

在 QX 首页通过 ➕ 扫码或手动添加节点，再确认策略组可引用。

#### 方式 D：在线订阅转换站（多机场合并）

如需转换或合并，输出须为 QX 支持的格式。第三方服务可读取含 token 的订阅链接；解析器转换格式后仍需核对协议支持。

### 3. 应用并连接

保存并重新应用配置，确认订阅、远程规则和区域组内节点，再开启首页连接开关。

<a id="settings"></a>

## 必要设置

### 区域与业务策略

11 个地区各有全部节点与家宽节点组，共 22 个区域组，另有 33 个业务组。

#### 11 区域组（QX: `url-latency-benchmark`）

使用 `server-tag-regex` 匹配节点 `tag`；当前 `check-interval=300`、`tolerance=10`。官方示例中的正则过滤注释与具体示例存在冲突，组内实际展开仍需 App 验收。

#### 33 业务组（QX: `static`）

在策略面板手动选择节点或区域组；参考 [Surge 业务组说明](../Surge/README.md#业务策略组select-手动)，服务是否可用仍取决于实际出口。

### DNS

普通 DNS 使用 `server=`，DoH 使用 `doh-server=`。当前配置按官方多 DoH 写法放在**同一行，以逗号分隔**：

```
server=223.5.5.5
server=119.29.29.29
server=1.1.1.1
server=8.8.8.8
doh-server=https://223.5.5.5/dns-query, https://223.6.6.6/dns-query, https://8.8.8.8/dns-query, https://1.1.1.1/dns-query
no-ipv6
```

Apple / iCloud 等系统 DNS 例外由 `[general] dns_exclusion_list` 配置。此处不宣称等价实现 Mihomo 的 `fallback-filter`、`respect-rules` 或独立 `proxy-server-nameserver`；官方写法及真实并发查询的待验边界见[复核报告](../../docs/upstream/2026-10-19/apple/report.md)。

<a id="verification"></a>

## 导入验收

1. 确认当前启用本目录配置，22 个区域组与 33 个业务组已载入；检查区域组内确有可用节点。
2. 确认订阅与全部 `filter_remote` 下载成功；连接开关开启不能代替下载检查。
3. 访问 `chat.openai.com`、`www.netflix.com`、`www.bilibili.com`，在请求或连接日志中核对 AI、Netflix、国内流媒体的命中规则与实际出口。
4. 完成[DNS 与导入后验证清单](../../docs/guide/dns-and-verification.md#verification)，按需复测 Wi-Fi / 蜂窝切换。

若日志没有请求、组内为空或出口不符，继续按下方 FAQ 排查。

<a id="faq"></a>

## 常见问题

### Q1：filter_remote 下载失败？

确认 GitHub Raw 可达，必要时先使用可用代理，再刷新配置与远程规则。详见[下载排错](../../docs/rule-asset-delivery.md)。

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

<a id="reference"></a>

## 进阶与参考

<details>
<summary>协议支持与待核项</summary>

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

REALITY 支持不能推导为 XTLS-Vision 支持，后者及 ShadowTLS / Mieru 仍待官方证据确认。完整来源见[复核报告](../../docs/upstream/2026-10-19/apple/report.md)。

</details>

QX 的 `resource_parser_url` 用于资源解析，`[rewrite_local]` / `[rewrite_remote]` 用于重写，`[task_local]` 支持 cron 任务；本配置不默认启用重写、任务或 MITM。策略类型还包括 available、ssid、round-robin 和 dest-hash，按官方示例配置。

当前远程规则为融合 `filter_remote`，不直接使用 Mihomo `.mrs`；iOS PROCESS-NAME 与 QX `filter_local` 的 URL-REGEX 为平台例外，不提供 Mihomo TLS 指纹控制。

官方依据：[sample.conf](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)、[REFERENCE](REFERENCE-quantumultx.md)。配置更新后重新应用，本地定制先备份。

[Quantumult X](https://apps.apple.com/app/quantumult-x/id1443988620) · [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) · [KOP-XIAO/QuantumultX](https://github.com/KOP-XIAO/QuantumultX) · [Koolson/Qure](https://github.com/Koolson/Qure)

[分流策略](../../docs/guide/routing-policy.md) · [客户端支持](../../docs/guide/client-support.md) · [DNS 与验收](../../docs/guide/dns-and-verification.md)

[测速与 QUIC](../../docs/traffic-options.md) · [微信连接排错](../../docs/research/2026-10-16-wechat-issue-187.md) · [Claude Desktop 网络依赖](../../docs/claude-service-dependencies.md)

[配置变更记录](CHANGELOG.md) · [官方资料复核与待验边界](../../docs/upstream/2026-10-19/apple/report.md) · [支持本项目](../../docs/donate.md)
