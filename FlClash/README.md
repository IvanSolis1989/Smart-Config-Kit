# FlClash 使用教程 — 覆写脚本版

> 目录简介：这里提供 FlClash 专用 JS 覆写脚本和导入教程，用动态节点分类复刻 Clash Party Normal 语义。
>
> 覆写脚本：`FlClash(mihomo).js`
> 适用客户端：**FlClash**（Android / Windows / macOS / Linux）
> 内核要求：FlClash >= **v0.8.85**
> 当前版本：**v6.0.14-flclash.13**（22 url-test 区域组 + 33 业务策略组 + 132 融合 rule-providers / 151 rules；变更历史见 `FlClash/CHANGELOG.md`）
>
> 节点命名兼容：yun hk01 / yun us01 / yun jp01 / yun sg01 / yun tw01 等小写 ISO 两位码加编号会自动进入区域组；不对普通小写词做宽泛国家码匹配。

> 节点筛选：本地脚本 `SCKI_MAX_NODE_MULTIPLIER = null` 默认关闭倍率筛选；设为正数才启用。仅含 type/payload 的 inline 集合可直接展平；具名直连/拒绝出站保留拨号依赖但不参加测速。预检保持数组引用，遇到重名歧义、异常字段或不支持的集合时保留原订阅并输出脱敏原因。详见 [节点筛选指南](../docs/subscription-node-filter.md)。

<sub>💖 [支持本项目](../docs/donate.md) · ⭐ [Star](https://github.com/ivansolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues)</sub>

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
> 2. 单机场优先使用机场**原生订阅链接**。若要把多个机场合成为同一节点池，请按 [Sub-Store 多机场聚合教程](../SubStore/README.md) 输出一条 `Clash.Meta(mihomo)` URL，再将覆写关联到这一个 Profile；不要使用来历不明的通用转换器。

### 第 1 步：创建覆写脚本

<img width="360" height="800" alt="c54492ae7abbfa269f1a6cceaca65a7c" src="https://github.com/user-attachments/assets/35be12b0-39a0-43a5-8b4f-01f736c93704" />

1. FlClash → 底部「配置」→ 顶部 **「覆写脚本」**
2. 点右上角 **+**
3. 输入名称（如 `Smart分流`），选择加载方式：
   - **URL**：填入 `https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/FlClash/FlClash%28mihomo%29.js`
   - **jsdelivr CDN**（备用，速度与可达性取决于网络）：`https://cdn.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/FlClash/FlClash%28mihomo%29.js`
   - **粘贴**：浏览器打开 Raw 链接，全选复制粘贴；第一行必须是 `// FlClash 覆写脚本`
4. 保存

> 如果 FlClash 弹出 `SyntaxError: unexpected token '<'`，说明当前导入内容是 HTML 页面，不是 JS 脚本。删除这个覆写脚本，改用上面的 Raw / jsdelivr 链接重新创建。

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
- 额外检查：按根 README 的 [导入后 60 秒验证清单](../README.md#-导入后-60-秒验证清单) 确认规则下载、GEOSITE 命中与 anti-ad 误伤白名单。

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

订阅刷新时，脚本默认以 `adaptive` 模式投影活动节点 FQDN 所需的私有 resolver、精确 node policy 与 bootstrap hosts；`off / policy / adaptive` 只影响这层投影，不影响业务组、规则或全局业务 DNS。应用层重新覆盖 DNS 会破坏这一配置来源边界。完整说明见 [私有节点 DNS 指南](../docs/private-node-dns.md)。

### Android 网络设置

- 「VPN」：开启；运行模式使用「规则」。
- VPN 分组下的「系统代理」：关闭（`vpnProps.systemProxy`）。它是在 VPN 网络上额外发布 HTTP 代理，**不会关闭 TUN，也不是“仅代理”模式**；使用应用访问控制时尤其不应同时开启。
- Android VPN 的 IPv6：关闭（`vpnProps.ipv6`）。
- 核心/进阶配置的 IPv6：也关闭（`patchClashConfig.ipv6`）。这是独立位置，App 会在脚本运行后把它写回顶层 `ipv6`，不能只关闭 VPN IPv6 或只依赖脚本。
- 「DNS 劫持」：开启；「路由模式」选择「使用配置」。
- 「DNS 覆写」：关闭；保留脚本 DNS 的 `prefer-h3: false`、`ipv6: false`。
- 「追加系统 DNS」：关闭（备份字段 `networkProps.appendSystemDns`）。它独立于 DNS 覆写，开启后仍会向最终 `nameserver` 加入 `system://`。

应用访问控制有两种不同用法，请保留自己需要的那一种：

| 目标 | 设置与后果 |
|---|---|
| 全部 APP 交给 Mihomo 按域名分流 | 关闭应用访问控制；关闭“允许应用绕过 VPN”。国内组选择 `DIRECT`，国外组选择可用节点。 |
| 国内 APP 完全不进入 VPN | 启用应用访问控制并排除这些 APP；保留排除名单，关闭 VPN“系统代理”。排除 APP 的连接和 DNS 不受脚本控制，也不应以 Mihomo 日志缺失判定它们无网络请求。 |

[Android 官方说明](https://developer.android.com/reference/android/net/VpnService.Builder#setHttpProxy(android.net.ProxyInfo)) 明确指出：使用 HTTP 代理的 APP 无法区分 VPN 内外的路由，分流 VPN 与 HTTP 代理组合可能无法正常联网。这个风险与广告规则是否误拦是两回事；只有实际连接日志才能确认具体 APP 走了哪条路径。

改完设置应**停止再启动 VPN，并彻底退出后重开受影响 APP**。不要只刷新节点列表；已建立的连接、系统代理设置和 DNS 缓存可能仍沿用旧状态。

### 为什么开启「DNS 覆写」会导致脚本失效？

FlClash 在脚本运行后还会合并应用层配置。开启 `overrideDns` 时，UI 的 `patchClashConfig.dns` 会**整体替换**脚本 DNS，并重新构建 `nameserver-policy`。v0.8.96 的 UI DNS 模型还不支持 `proxy-server-nameserver-policy`、`direct-nameserver`、`direct-nameserver-follow-policy`，因此把完整 YAML 粘贴进 UI 也不能保留这些字段。UI 保存值与脚本不一致时，还会重新打开 PreferH3/IPv6、替换解析器与过滤列表。脚本更新或显示正确版本并不能证明最终 DNS 正确。

检查最终送入核心的配置，而不是只看 UI 中保存的 DNS 表单：

- 顶层 `ipv6: false`；`dns.enable: true`；`dns.ipv6: false`；`dns.prefer-h3: false`。
- `dns.respect-rules: true`，且 `proxy-server-nameserver` 非空。
- `nameserver-policy` 同时包含 `geosite:cn` 与 `geosite:geolocation-!cn`；有私有节点时保留脚本生成的精确 `proxy-server-nameserver-policy`。
- `direct-nameserver` 保持国内 DoH；不要为了 DNS 检测页面把国内 APP 的解析全部搬到海外。
- `nameserver` 不含应用层追加的 `system://`；顶层 hosts 的同名 UI 覆写也应检查，不能只看 DNS 开关。

`overrideDns: false` 时，UI 仍可能显示以前保存的 PreferH3/DNS 参数，它们不是当前脚本 DNS 的生效证明。具体合并顺序和版本边界见 [官方源码核对](./REFERENCE-flclash.md)。

### DNS 检测出现 China server 是否就是泄漏？

不能只凭国家标签判断。国内域名使用 AliDNS/DNSPod 是本仓库的默认策略；DNS 检测站的随机域名也可能没有收录在 `geolocation-!cn`，从而落到默认国内 `nameserver`。`fallback` 不代表查询从未发送给国内解析器，DoH 加密也不代表境外出口。

另一方面，不能把这些现象一概当成“没有泄漏”：若你的目标是让所有代理业务域名只向境外解析器查询，当前通用基线并不提供这一保证。排除 VPN 的 APP、浏览器自带安全 DNS、系统 DNS 和节点 bootstrap 还各有独立路径。检测时应记录具体查询域名、命中策略、递归服务器及出站；“页面出现 China”不足以区分这些情况。

需要“未分类域名也只用海外 DoH”的高级用户，可以在**本地脚本的 `overwriteGeneral` 函数**里将 `config.dns.nameserver = domesticDoH.slice()` 改成 `config.dns.nameserver = foreignDoH.slice()`，但保留 `geosite:cn`、国内 `direct-nameserver` 和节点解析器。此选项会让未分类查询依赖海外路径，应单独测试，且仍不承诺整机零泄漏。不要只填字符串 `foreignDoH` 到 UI，也不要删除国内 DNS 策略。

### 外部资源（GeoX URL）

**优先保留 FlClash 默认 URL，不要求换成 jsdelivr。** 资源下载有独立的应用层路径；脚本中的 rule-provider 下载代理不保证覆盖资源页面。GitHub、Raw、jsdelivr 在不同网络下的可达性不同，没有一个固定 CDN 保证更快。

需要更换时，在资源页逐项检查完整 URL、HTTP 状态、下载大小和核心加载结果；先保留可用缓存，不要为了排障删除全部 GeoX 文件。`geosite:cn` / `geolocation-!cn` DNS 策略仍依赖 GeoSite 数据，即使路由已使用 fused MRS，也不能认为 GeoSite 完全不用了。当前内核关于 `fallback-filter.geosite` 的迁移 warning 不等于资源加载失败或 APP 被拒绝。

### 国内 APP 无法联网时的最短排查

1. 关闭 DNS 覆写、“追加系统 DNS”与 VPN“系统代理”；分别关闭 VPN IPv6 和核心/进阶配置 IPv6（`vpnProps.ipv6`、`patchClashConfig.ipv6`）。保留原应用访问控制名单，重启 VPN 和 APP。
2. 对仍进入 VPN 的 APP，检查「国内网站」「国内流媒体」「国内游戏」是否选择 `DIRECT`。人在境外时保存的选组不会因为回国自动重置。
3. 记录一次失败操作的具体时间、域名、规则、出站和错误；FlClash 自身 `checkIp` 的 502 只是出口信息服务错误，不能证明其他 APP 或所有节点不可用。
4. 仅当失败业务域名明确命中广告拦截时，才临时将广告组切到 `DIRECT` 做对照，随后恢复。不要长期关闭全部广告规则，也不要对整个 APP 的域名族做无证据白名单。

---

## 常见问题

### Q: 代理/规则标签消失了？
单机场先试机场的**原生订阅链接**（不经转换器）。若实际需求是多个机场合并为同一节点池，请按 [Sub-Store 多机场聚合教程](../SubStore/README.md) 输出一条 `Clash.Meta(mihomo)` URL，再关联覆写脚本；不要使用来历不明的通用转换器。

### Q: 区域组为什么是 url-test 不是 smart？
FlClash 内核是标准 Mihomo，不支持 `type: smart` + LightGBM。

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

→ [捐赠 / Star / PR](../docs/donate.md)
