<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-flclash-mobile.svg">
  <img src="../../docs/assets/readme/page-flclash.svg" alt="FlClash 导入指南" width="100%">
</picture>

# FlClash 导入指南

为 Mihomo 节点订阅创建并关联专用 JS 覆写，自动生成区域与业务分组。使用 **url-test，不支持 Smart / LightGBM**；先创建，再关联。

<p><a href="../../docs/guide/downloads.md#mihomo"><img src="../../docs/assets/readme/nav-downloads.svg" alt="下载目录" width="145" height="38"></a> <a href="../../docs/README.md"><img src="../../docs/assets/readme/nav-docs.svg" alt="文档中心" width="145" height="38"></a> <a href="#verification"><img src="../../docs/assets/readme/nav-verify.svg" alt="导入后验收" width="145" height="38"></a></p>

[开始前](#before-you-start) · [选择文件](#downloads) · [导入步骤](#import) · [常见问题](#faq) · [进阶与参考](#reference)

<a id="before-you-start"></a>


[可选业务方案与本地参数](../../docs/configuration.md)：完整配置继续作为默认；可选投影输出到独立目录，运行时参数支持范围见统一指南。

## 开始前：确认版本与节点订阅

需要 **FlClash ≥ v0.8.85**、Mihomo 节点订阅及本目录 JS。[官方仓库](https://github.com/chen08209/FlClash)提供客户端；脚本 API 说明见[官方仓库教程](https://github.com/chen08209/FlClash/issues/1510)。

- 单机场优先使用原生订阅链接；多机场按 [Sub-Store 教程](../../SubStore/README.md)输出一条 `Clash.Meta(mihomo)` URL。
- 创建覆写后必须关联到对应 Profile；只粘贴或保存脚本不会生效。
- 规则下载需要 GitHub Raw 可达或可用代理。备选静态 YAML 按 [CMFA 教程](../Clash%20Meta%20For%20Android/README.md)编辑后导入。

<a id="-规则下载链接"></a>

<a id="downloads"></a>

## 选择并下载文件

[![下载 FlClash JS](../../docs/assets/readme/button-flclash-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js) [![下载 备选 CMFA YAML](../../docs/assets/readme/button-cmfa-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**FlClash JS 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js
```

**备选 CMFA YAML 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml
```

推荐下载 JS 覆写脚本，创建后关联到节点订阅；备选 YAML 的导入方法见 [CMFA 教程](../Clash%20Meta%20For%20Android/README.md)。

<a id="快速开始两步操作"></a>

<a id="import"></a>

## 按顺序创建、关联并启动

### 可选：先生成 Lite / Custom 业务方案

默认直接使用下方完整 JS。需要精简业务时，下载[离线配置表单](../../docs/configuration.html)，在本机浏览器打开并选择「全端业务」：**Lite** 保留 AI、即时通讯、会议协作和 YouTube（`ai,im,work,youtube`）；**Custom** 自行勾选要保留的业务。点击「下载 FlClash 脚本」即可保存 JS，无需 CLI、Node.js 或 Ruby。

打开下载的 JS 并复制**全文**，按下面第 1 步创建独立命名的「粘贴」覆写，再按第 2 步关联订阅。不要给这个覆写配置官方 URL 自动更新：官方 URL 指向完整方案，更新后会覆盖所选方案。保留 FlClash 对 VPN 和端口的管理，并按第 3 步关闭 DNS 覆写。

直接下载只采用业务选择，本地测速、QUIC、DNS 和倍率保持发布默认；本地参数页的选择不会自动合并。表单内嵌的是下载时的脚本快照，更新基线时需重新下载 HTML。完整边界见[统一配置指南](../../docs/configuration.md)。

<details>
<summary>仍想用 CLI，或同时生成其他客户端？</summary>

表单保留 `settings.json` 下载；它是生成设置，不能直接导入 FlClash。在仓库根目录运行以下命令，替换实际路径；输出目录的父目录须已存在，输出目录本身必须是全新目录。Node.js、Ruby 等环境要求见[统一配置指南](../../docs/configuration.md)。

```bash
node tools/configure.js --settings '.../settings.json' --output-dir '.../全新目录' --dry-run
node tools/configure.js --settings '.../settings.json' --output-dir '.../全新目录'
```

生成后使用输出目录中的 `Mihomo内核系/FlClash/FlClash(mihomo).js`。

</details>

### 第 1 步：创建覆写脚本

<img width="360" height="800" alt="c54492ae7abbfa269f1a6cceaca65a7c" src="https://github.com/user-attachments/assets/35be12b0-39a0-43a5-8b4f-01f736c93704" />

1. FlClash → 底部「配置」→ 顶部 **「覆写脚本」**
2. 点右上角 **+**
3. 输入名称（如 `Smart分流`），选择加载方式：
   - **URL**：填入 `https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js`
   - **粘贴**：浏览器打开 Raw 链接，全选复制粘贴；第一行必须是 `// FlClash 覆写脚本`
4. 保存

> 如果 FlClash 弹出 `SyntaxError: unexpected token '<'`，说明当前导入内容是 HTML 页面，不是 JS 脚本。删除这个覆写脚本，改用上面的 Raw 链接或粘贴方式重新创建。

### 第 2 步：关联到订阅

<img width="360" height="800" alt="5cea3c38d68a4f179fd4c3871052fd01" src="https://github.com/user-attachments/assets/f133d259-3841-4719-9396-db2488a507fc" />

1. 返回配置页 → 点订阅卡片右上角 ⋮
2. **更多** → **覆写**
3. 选择刚才创建的覆写脚本 → 确定
4. 返回首页 → 下拉刷新（或重启 FlClash）


<a id="应用层设置与-dns-所有权"></a>

### 第 3 步：核对 App 设置

**关联本仓库脚本后，关闭「DNS 覆写」，不需要再向 UI 粘贴一份 DNS YAML。** 关闭的是 FlClash 的二次覆盖，不是 Mihomo DNS；脚本仍会设置 `dns.enable: true`、`respect-rules: true` 和国内/海外解析策略。

订阅刷新时以 adaptive 模式投影活动节点所需的 DNS 提示；UI 合并时保留精确 node policy。详见[私有节点 DNS](../../docs/private-node-dns.md)。

#### Android 网络设置

- 开启 VPN，运行模式选「规则」；DNS 劫持开启，路由模式使用配置。
- VPN 下的「系统代理」关闭：它额外发布 HTTP 代理，关闭它不会关闭 TUN。
- VPN IPv6 与核心/进阶配置 IPv6 **分别关闭**；只关一个位置不够。
- DNS 覆写与「追加系统 DNS」都关闭；后者是独立开关，开启仍会追加 system://。

需要整个应用绕过 VPN 时使用应用访问控制排除名单；被排除应用的连接和 DNS 不受脚本控制。两种模式如下：


| 目标 | 设置与后果 |
|---|---|
| 全部 APP 交给 Mihomo 按域名分流 | 关闭应用访问控制；关闭“允许应用绕过 VPN”。国内组选择 `DIRECT`，国外组选择可用节点。 |
| 国内 APP 完全不进入 VPN | 启用应用访问控制并排除这些 APP；保留排除名单，关闭 VPN“系统代理”。排除 APP 的连接和 DNS 不受脚本控制，也不应以 Mihomo 日志缺失判定它们无网络请求。 |

[Android 官方说明](https://developer.android.com/reference/android/net/VpnService.Builder#setHttpProxy(android.net.ProxyInfo))提醒，分流 VPN 与额外 HTTP 代理组合可能影响应用联网。修改后停止再启动 VPN，并彻底重开受影响 App；仅刷新节点不会清除旧连接。


<a id="verification"></a>

## 导入后核验

点「代理」标签，应看到：
- **最多 22 个区域组**（11 全部 + 11 家宽；空区域自动跳过）：🌍 全球节点、🇭🇰 香港节点、🇸🇬 狮城节点、🌏 其他节点……
- **完整方案的 33 业务组**：🤖 AI 服务、🎵 TikTok、🎥 Netflix、📱 社交媒体……Lite / Custom 的可选业务组更少；广告、安全、直连等基础保护保留。
- 额外检查：按专题页的 [导入后 60 秒验证清单](../../docs/guide/dns-and-verification.md#verification) 确认规则下载、GEOSITE 命中与 anti-ad 误伤白名单。

检查最终配置的 DNS 与实际连接记录；脚本版本正确不能证明 App patch 后的最终配置正确。详细检查见下方 DNS 说明。

<a id="常见问题"></a>

<a id="faq"></a>

## 常见问题

### Q: 代理/规则标签消失了？

单机场先试机场的**原生订阅链接**（不经转换器）。若实际需求是多个机场合并为同一节点池，请按 [Sub-Store 多机场聚合教程](../../SubStore/README.md) 输出一条 `Clash.Meta(mihomo)` URL，再关联覆写脚本；不要使用来历不明的通用转换器。

### Q: 区域组为什么是 url-test 不是 smart？

FlClash 使用自身 Mihomo 分支，不提供 vernesong Smart 的 type: smart / LightGBM；MetaCubeX Alpha 也不等于 Smart。

### Q: 换机场后需要重新配置吗？

不需要。覆写脚本换订阅后自动重新执行。

### 国内 App 无法联网？

先保留应用排除名单，关闭 DNS 二次覆写与系统 DNS 追加，核对 VPN 和核心两个 IPv6 开关。重启 VPN 和受影响 App，再检查失败时间、域名、规则与出站。完整对照步骤见下方 DNS 说明。


<a id="reference"></a>

## 进阶与参考

- [节点筛选](../../docs/subscription-node-filter.md)：小写地区码加编号、inline 节点及拨号依赖，倍率筛选默认关闭。
- [私有节点 DNS](../../docs/private-node-dns.md) · [规则下载](../../docs/rule-asset-delivery.md) · [测速 / QUIC](../../docs/traffic-options.md)。
- [微信排错](../../docs/research/2026-10-16-wechat-issue-187.md) · [ZeroTier UDP 代理（默认关闭）](../../docs/zerotier-planet-proxy.md)。

### DNS 合并顺序与排障

### 为什么开启「DNS 覆写」会导致脚本失效？

FlClash 会在 JS 后应用 App patch。0.9.x 的 DNS/NTP 与桌面 TUN 按选中键覆盖；旧版曾使用整块 DNS 覆盖，不能混用两种说明。保留脚本 DNS 时关闭 App DNS 覆写，并核对最终值；脚本显示正确版本不等于最终配置正确。

检查最终送入核心的配置，而不是只看 UI 中保存的 DNS 表单：

- 顶层 `ipv6: false`；`dns.enable: true`；`dns.ipv6: false`；`dns.prefer-h3: false`。
- `dns.respect-rules: true`，且 `proxy-server-nameserver` 非空。
- `nameserver-policy` 同时包含 `geosite:cn` 与 `geosite:geolocation-!cn`；有私有节点时保留脚本生成的精确 `proxy-server-nameserver-policy`。
- `direct-nameserver` 保持国内 DoH；不要为了 DNS 检测页面把国内 APP 的解析全部搬到海外。
- `nameserver` 不含应用层追加的 `system://`；顶层 hosts 的同名 UI 覆写也应检查，不能只看 DNS 开关。

UI 保存的旧值不能证明当前生效状态；合并顺序与版本边界见[官方源码核对](REFERENCE-flclash.md)。

### DNS 检测出现 China server 是否就是泄漏？

不能只看国家标签。国内域名默认使用 AliDNS/DNSPod；未分类查询也可能落到国内 nameserver。DoH 加密不等于境外出口，fallback 也不保证国内解析器从未收到查询。

记录具体域名、命中策略、递归服务器和出站；排除 VPN 的 App、浏览器安全 DNS、系统 DNS、节点解析各有路径。本基线不保证整机零泄漏。

### 外部资源（GeoX URL）

自有脚本与融合规则使用配置中的 GitHub Raw HTTPS。资源页下载可能走独立 App 路径，不能只凭 rule-provider 下载代理判断是否可达。

更换前保留可用缓存，核对完整 URL、HTTP 状态、大小和核心加载结果。DNS 的 geosite policy 仍依赖 GeoSite；fallback-filter.geosite 的迁移提示不等于资源加载失败。

### 国内 APP 无法联网时的最短排查

1. 关闭 DNS 覆写、“追加系统 DNS”与 VPN“系统代理”；分别关闭 VPN IPv6 和核心/进阶配置 IPv6（`vpnProps.ipv6`、`patchClashConfig.ipv6`）。保留原应用访问控制名单，重启 VPN 和 APP。
2. 对仍进入 VPN 的 APP，检查「国内网站」「国内流媒体」「国内游戏」是否选择 `DIRECT`。人在境外时保存的选组不会因为回国自动重置。
3. 记录一次失败操作的具体时间、域名、规则、出站和错误；FlClash 自身 `checkIp` 的 502 只是出口信息服务错误，不能证明其他 APP 或所有节点不可用。
4. 仅当失败业务域名明确命中广告拦截时，才临时将广告组切到 `DIRECT` 做对照，随后恢复。不要长期关闭全部广告规则，也不要对整个 APP 的域名族做无证据白名单。

<a id="与-cmfa-yaml-的对比"></a>

<details>
<summary>专用 JS 与静态 YAML 的区别</summary>

| | 覆写脚本（推荐） | CMFA YAML（备选） |
|---|---|---|
| 节点分类 | **word-boundary 正则**，TW 不误伤 TWN | Go RE2 子串匹配 |
| 订阅垃圾清理 | 自动剔除机场无用 proxy-groups | 不支持 |
| 家宽识别 | 自动识别并建独立组 | 支持（filter 正则） |
| 空区域处理 | 无节点自动跳过不建空组 | 可能产生空组 |
| Smart + LightGBM | 不支持（内核限制） | 不支持（同） |

</details>

<a id="协议支持"></a>

<details>
<summary>协议能力参考（以实际内置核心为准）</summary>

| 协议 | 支持 |
|---|:-:|
| Shadowsocks (SS) / SSR | ✅ |
| VMess / VLESS（含 REALITY + XTLS-Vision） | ✅ |
| Trojan（含 Trojan-Go） | ✅ |
| Hysteria v1/v2 / TUIC v5 | ✅ |
| WireGuard / AnyTLS / ShadowTLS / Snell v4 | ✅ |

</details>

<details>
<summary>配置界面补充示例</summary>

<img width="160" alt="FlClash 配置示例 1" src="https://github.com/user-attachments/assets/e88e0724-2bc0-4111-851e-e8aa0a9141d3">
<img width="160" alt="FlClash 配置示例 2" src="https://github.com/user-attachments/assets/530d9f3a-e793-423b-a4d6-85a2d4a75054">
<img width="160" alt="FlClash 配置示例 3" src="https://github.com/user-attachments/assets/f2b03096-3469-4d67-ab10-60bac2b82347">
<img width="160" alt="FlClash 配置示例 4" src="https://github.com/user-attachments/assets/be31a91a-259c-47a7-b599-fa08752bef8d">
<img width="160" alt="FlClash 配置示例 5" src="https://github.com/user-attachments/assets/770eb553-86c5-49a7-80f4-4fd68594888b">

</details>

<a id="相关链接"></a>

- [FlClash GitHub](https://github.com/chen08209/FlClash)
- [覆写脚本源码](./FlClash(mihomo).js)
- [CMFA YAML（备选方案）](../Clash%20Meta%20For%20Android/CMFA(mihomo).yaml)

业务 DNS 的权威源为 [business-dns-policy.json](../../rulesets/source/business-dns-policy.json)，维护命令：

```bash
node tools/sync-business-dns-policy.js
node tools/sync-business-dns-policy.js --check
node --test tools/tests/business-dns-policy.test.js tools/tests/business-dns-sync.test.js
```

<a id="-支持本项目"></a>

[变更历史](CHANGELOG.md) · [支持本项目](../../docs/donate.md) · [反馈问题](https://github.com/IvanSolis1989/Smart-Config-Kit/issues)
