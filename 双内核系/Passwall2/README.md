<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-passwall2-mobile.svg">
  <img src="../../docs/assets/readme/page-passwall2.svg" alt="Passwall2 导入指南" width="100%">
</picture>

# Passwall2 导入指南

<a id="passwall2-使用教程对齐-clash-party-v6020"></a>



在 OpenWrt 上将同源融合 SRS 应用到 sing-box 分流节点。先备份 UCI，再导入规则并逐项选择业务出口。

[![下载入口](../../docs/assets/readme/nav-downloads.svg)](../../docs/guide/downloads.md) [![文档导航](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) [![导入验收](../../docs/assets/readme/nav-verify.svg)](#verification)

[开始前](#before-start) · [文件选择](#files) · [脚本导入](#3-推荐导入方式) · [手工导入](#4-手工导入方式) · [导入验收](#verification) · [常见问题](#faq) · [进阶参考](#advanced)

> 配置版本：`v6.0.20-pw2.11` · Build：2026-10-24 · 规则基线：Clash Party v6.0.20。历史见 [CHANGELOG](CHANGELOG.md)。

<a id="before-start"></a>
<a id="-规则下载链接"></a>

## 开始前：确认后端并备份

本目录提供 UCI 批量应用脚本和 fused SRS 分流参考，**仅支持 `type=sing-box`、`protocol=_shunt` 的分流节点**。文件名保留历史 `xray+sing-box` 以保持下载链接有效，不能据此判断支持 Xray。

1. 在 LuCI 准备可用节点，并创建 **sing-box 分流节点**。确认全部分流节点均使用 sing-box；以后切换后端前，先移除 SRS 规则。
2. 备份 `/etc/config/passwall2`，并保存当前节点及规则设置。
3. 确认路由器能通过网络或可用代理访问 GitHub Raw；下载问题见[规则下载说明](../../docs/rule-asset-delivery.md)。

脚本在任何写入前检查全部分流节点；遇到 Xray、未知后端、读取失败或没有分流节点时会停止。默认 `--replace` 替换仓库管理的旧规则；需要并存时显式使用 `--append`。

[![下载 Passwall2 SH](../../docs/assets/readme/button-passwall2-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/Passwall2%28xray%2Bsing-box%29-apply.sh)

按钮打开 Raw 脚本，可复制链接或另存为：

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/Passwall2%28xray%2Bsing-box%29-apply.sh
```

<a id="files"></a>
<a id="2-文件说明"></a>

## 文件选择

| 文件 | 用途 |
| --- | --- |
| `Passwall2(xray+sing-box)-apply.sh` | 验证 sing-box 分流后端后创建 78 条 fused shunt rule |
| `Passwall2(xray+sing-box).conf` | 纯文本参考，展示 78 条 rule 的顺序、目标和 `.srs` URL |
| `shunt-rules/*.list` | 每个 fused 段一个 `.list`，方便在 LuCI 手工复制 |
| `REFERENCE-passwall2.md` | Passwall2 语法和官方源码参考 |

`shunt-rules/*.list` 每个文件只保留一个非注释行。不要在这里手写 `domain:` / `geoip:` / Clash 前缀。

<a id="3-推荐导入方式"></a>

## 分步导入：脚本

1. 在 LuCI 创建 sing-box 分流节点，确认所有分流节点均使用该后端；备份 `/etc/config/passwall2`。把 `双内核系/Passwall2/Passwall2(xray+sing-box)-apply.sh` 复制到路由器，并在脚本所在目录执行下一步。
2. 执行：

```sh
sh 'Passwall2(xray+sing-box)-apply.sh'
```

3. 打开 LuCI 的 Passwall2 分流控制。
4. 在 sing-box 分流节点内给每条 `scki-fused-*` 规则选择业务目标节点；当前全局入口为 `@global[0].node`。
5. 保存并应用。

脚本默认 `--replace`，会删除旧的 Smart-Config-Kit fused rule 以及历史 emoji remark 规则，避免重复追加。需要并存时可显式运行：

```sh
sh 'Passwall2(xray+sing-box)-apply.sh' --append
```

<a id="4-手工导入方式"></a>

## 分步导入：手工

不方便 SSH 时，可在 LuCI 的 **sing-box 分流节点**中逐条新增 shunt rule；手工粘贴不会执行脚本的后端检查：

1. 打开 `双内核系/Passwall2/shunt-rules/<segment>.list`。
2. 将其中的 `rule-set:remote:...srs` 粘贴到 Domain List。
3. 如果 `Passwall2(xray+sing-box).conf` 对该段同时标注了 IP List，把同一 URL 也粘贴到 IP List。
4. 网络类型选择 `tcp,udp`。
5. 目标节点选择你希望该业务走的节点或负载均衡组。

Passwall / Passwall2 的 sing-box 后端支持 `rule-set:remote:` / `rule-set:local:`。Xray 后端会过滤这些引用；Passwall2 还可能生成缺失域名/IP 条件的宽匹配规则。不要将 SRS 引用交给 Xray，也不要粘贴 Clash 的 `DOMAIN-SUFFIX,` 等前缀。

<a id="verification"></a>

## 导入验收

- LuCI 中出现 `scki-fused-*` 规则，顺序与参考 `.conf` 一致；替换模式下没有旧仓库规则重复残留。
- 所有分流节点仍为 sing-box；每条规则已绑定预期业务节点，已保存并应用，服务日志没有后端或规则下载错误。
- 检查最终生成配置确实包含远程 `route.rule_set`，用真实连接确认直连、代理、拦截与默认流量去向，再按[运行验证清单](../../docs/guide/dns-and-verification.md#verification)检查。

脚本退出成功、UCI 保存成功或服务存活都不能代替规则命中验证。官方源码与本地门禁证据见[后端核验报告](../../docs/upstream/2026-10-19/singbox/report.md#passwall--passwall2)；实际设备、网络和流量仍需在你的 OpenWrt 上验收。

<a id="faq"></a>

## 常见问题

**为什么脚本拒绝运行？** 先读报错，核对全部分流节点的 `protocol` 和 `type`。没有分流节点、混用 Xray 或读取失败都会在写入 UCI 前停止；修正后端后再执行。

**文件名有 Xray，为什么不能使用 Xray？** 插件本身支持多后端，但本仓库这条导入路径依赖 SRS。Xray 会过滤 SRS 引用，Passwall2 还可能产生缺少域名/IP 条件的宽匹配；不要以“无报错”判断兼容。

**能把 Clash 规则粘贴进去吗？** 不要使用 `DOMAIN-SUFFIX,` 等 Clash 前缀。按本页手工步骤复制 `.list` 的 `rule-set:remote:...srs`，并严格保持顺序和目标。

**需要嵌套策略组或 Smart 怎么办？** 使用 [OpenClash](../../Mihomo内核系/OpenClash/README.md)；本页 fallback 不保留 Clash Party 的嵌套选择器与 LightGBM。

<a id="advanced"></a>

## 进阶参考

<details>

<summary>插件定位、融合规则与能力差异</summary>

<a id="1-定位"></a>

### 插件定位与融合规则

Passwall2 是 OpenWrt 上的精简分流插件。它和 Passwall 由同一组织并行维护，规则语法同源，但 Passwall2 去掉了四列表和 ACL，主要保留 shunt rules。

本目录只提供 fallback：从最终 fused 规则集生成 78 条非空 Passwall2 原生 shunt rule。每条 rule 只引用一个远程 `.srs`：

```text
rule-set:remote:https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/<segment>.srs
```

`双内核系/Passwall2/shunt-rules/*.list` 与 `双内核系/Passwall/shunt-rules/*.list` 内容互通。

<a id="5-与-openclash-的差异"></a>

### 与 OpenClash 的差异

| 能力 | Passwall2 fallback | OpenClash / Clash Party |
| --- | --- | --- |
| fused 规则顺序 | 78 条非空 shunt rule | 168 条 Mihomo 主规则 |
| 远程规则集 | sing-box `.srs` | Mihomo `.mrs` / residual YAML |
| 策略组嵌套 | 不支持 | 支持 |
| 自动测速 | 由你配置节点或负载均衡 | 支持区域组 url-test / Smart |
| LightGBM | 不支持 | Clash Party Smart 支持 |
| 端口/逻辑/MATCH | Passwall2 shunt 模型受限 | Mihomo 原生表达 |

需要嵌套策略组或 Smart 时使用 OpenClash。

</details>

<details>

<summary>维护者入口与官方语法</summary>

<a id="6-维护者入口"></a>

### 维护者入口

不要手工编辑 `Passwall2(xray+sing-box)-apply.sh`、`Passwall2(xray+sing-box).conf` 或 `shunt-rules/*.list`。生成链路：

```bash
node tools/build-fused-rule-sets.js
node tools/generate-fused-fallback-artifacts.js
node tools/validate-artifact-contracts.js --strict-ruby
```

官方语法参考：

- Passwall2 shunt_rules.lua：https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua
- Passwall shunt_rules.lua：https://github.com/Openwrt-Passwall/openwrt-passwall/blob/main/luci-app-passwall/luasrc/model/cbi/passwall/client/shunt_rules.lua
- Passwall / Passwall2 差异讨论：https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555

补充说明：[Claude 服务依赖](../../docs/claude-service-dependencies.md) · [测速与 QUIC](../../docs/traffic-options.md) · [微信连接排障](../../docs/research/2026-10-16-wechat-issue-187.md)。

</details>
