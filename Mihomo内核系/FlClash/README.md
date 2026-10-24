# FlClash 使用教程 — 覆写脚本版

## 📥 规则下载链接

[![下载 FlClash JS](../../docs/assets/readme/button-flclash-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js)
[![下载 备选 CMFA YAML](../../docs/assets/readme/button-cmfa-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)

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

---

业务 DNS policy 来自 `../rulesets/source/business-dns-policy.json`，运行 `node tools/sync-business-dns-policy.js` 更新投影，并用 `--check` 与 `node --test tools/tests/business-dns-policy.test.js tools/tests/business-dns-sync.test.js` 验收。

本目录提供 FlClash 专用 JS，要求 **FlClash ≥ v0.8.85**；使用 url-test，最多 22 区域组 + 33 业务组，**不支持 Smart + LightGBM**。版本见 [CHANGELOG](CHANGELOG.md)。

- 创建脚本后须**关联到订阅**；多机场先用 [Sub-Store](../../SubStore/README.md)输出一条 Mihomo 节点订阅。
- 倍率筛选默认关闭；支持小写地区码加编号，inline 节点与拨号依赖边界见[节点筛选](../../docs/subscription-node-filter.md)。
- 关闭 App 二次 DNS 覆写与追加系统 DNS，保留脚本的[私有节点 DNS](../../docs/private-node-dns.md)。
- [规则下载](../../docs/rule-asset-delivery.md)需 GitHub Raw 可达或可用代理；另见[测速/QUIC](../../docs/traffic-options.md)、[微信排错](../../docs/research/2026-10-16-wechat-issue-187.md)及[默认关闭的 ZeroTier UDP 代理](../../docs/zerotier-planet-proxy.md)。

<sub>💖 [支持本项目](../../docs/donate.md) · ⭐ [Star](https://github.com/ivansolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues)</sub>

<table><tr>
<td><img width="160" alt="FlClash 截图1" src="https://github.com/user-attachments/assets/e88e0724-2bc0-4111-851e-e8aa0a9141d3"></td>
<td><img width="160" alt="FlClash 截图2" src="https://github.com/user-attachments/assets/530d9f3a-e793-423b-a4d6-85a2d4a75054"></td>
<td><img width="160" alt="FlClash 截图3" src="https://github.com/user-attachments/assets/f2b03096-3469-4d67-ab10-60bac2b82347"></td>
<td><img width="160" alt="FlClash 截图4" src="https://github.com/user-attachments/assets/be31a91a-259c-47a7-b599-fa08752bef8d"></td>
<td><img width="160" alt="FlClash 截图5" src="https://github.com/user-attachments/assets/770eb553-86c5-49a7-80f4-4fd68594888b"></td>
</tr></table>

---

## 快速开始（两步操作）

> ⚠️ **注意**：
> 1. 必须先「创建」脚本再「关联」到订阅，只粘贴不关联不会生效
> 2. 单机场优先使用机场**原生订阅链接**。若要把多个机场合成为同一节点池，请按 [Sub-Store 多机场聚合教程](../../SubStore/README.md) 输出一条 `Clash.Meta(mihomo)` URL，再将覆写关联到这一个 Profile；不要使用来历不明的通用转换器。

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

### 验证

点「代理」标签，应看到：
- **最多 22 个区域组**（11 全部 + 11 家宽；空区域自动跳过）：🌍 全球节点、🇭🇰 香港节点、🇸🇬 狮城节点、🌏 其他节点……
- **33 业务组**：🤖 AI 服务、🎵 TikTok、🎥 Netflix、📱 社交媒体……
- 额外检查：按专题页的 [导入后 60 秒验证清单](../../docs/guide/dns-and-verification.md#verification) 确认规则下载、GEOSITE 命中与 anti-ad 误伤白名单。

---

## 与 CMFA YAML 的对比

| | 覆写脚本（推荐） | CMFA YAML（备选） |
|---|---|---|
| 节点分类 | **word-boundary 正则**，TW 不误伤 TWN | Go RE2 子串匹配 |
| 订阅垃圾清理 | 自动剔除机场无用 proxy-groups | 不支持 |
| 家宽识别 | 自动识别并建独立组 | 支持（filter 正则） |
| 空区域处理 | 无节点自动跳过不建空组 | 可能产生空组 |
| Smart + LightGBM | 不支持（内核限制） | 不支持（同） |

---

## 应用层设置与 DNS 所有权

**关联本仓库脚本后，关闭「DNS 覆写」，不需要再向 UI 粘贴一份 DNS YAML。** 关闭的是 FlClash 的二次覆盖，不是 Mihomo DNS；脚本仍会设置 `dns.enable: true`、`respect-rules: true` 和国内/海外解析策略。

订阅刷新时以 adaptive 模式投影活动节点所需的 DNS 提示；UI 合并时保留精确 node policy。详见[私有节点 DNS](../../docs/private-node-dns.md)。

### Android 网络设置

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

---

## 常见问题

### Q: 代理/规则标签消失了？

单机场先试机场的**原生订阅链接**（不经转换器）。若实际需求是多个机场合并为同一节点池，请按 [Sub-Store 多机场聚合教程](../../SubStore/README.md) 输出一条 `Clash.Meta(mihomo)` URL，再关联覆写脚本；不要使用来历不明的通用转换器。

### Q: 区域组为什么是 url-test 不是 smart？

FlClash 使用自身 Mihomo 分支，不提供 vernesong Smart 的 type: smart / LightGBM；MetaCubeX Alpha 也不等于 Smart。

### Q: 换机场后需要重新配置吗？

不需要。覆写脚本换订阅后自动重新执行。

---

## 协议支持

| 协议 | 支持 |
|---|:-:|
| Shadowsocks (SS) / SSR | ✅ |
| VMess / VLESS（含 REALITY + XTLS-Vision） | ✅ |
| Trojan（含 Trojan-Go） | ✅ |
| Hysteria v1/v2 / TUIC v5 | ✅ |
| WireGuard / AnyTLS / ShadowTLS / Snell v4 | ✅ |

---

## 相关链接

- [FlClash GitHub](https://github.com/chen08209/FlClash)
- [覆写脚本源码](./FlClash(mihomo).js)
- [CMFA YAML（备选方案）](../Clash%20Meta%20For%20Android/CMFA(mihomo).yaml)

---

## 💖 支持本项目

→ [捐赠 / Star / PR](../../docs/donate.md)
