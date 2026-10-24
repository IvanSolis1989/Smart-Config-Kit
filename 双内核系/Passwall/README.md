# Passwall 使用教程（对齐 Clash Party v6.0.20）

## 📥 规则下载链接

[![下载 Passwall SH](../../docs/assets/readme/button-passwall-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/Passwall%28xray%2Bsing-box%29-apply.sh)

按钮打开 Raw 文件，可复制链接或另存为。

**Passwall SH 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/Passwall%28xray%2Bsing-box%29-apply.sh
```

下载的是 UCI 批量应用脚本。先在 LuCI 创建 **sing-box 分流节点**，再通过 SSH 执行；默认替换仓库管理的旧规则，需保留并存时使用 `--append`。

本目录 SRS 规则仅支持 `type=sing-box`、`protocol=_shunt` 的分流节点。脚本在任何写入前检查全部分流节点；存在 Xray、未知后端、读取失败或没有分流节点时停止。文件名保留历史 `xray+sing-box` 以保持下载链接有效，不能据此判断支持 Xray。以后切换分流后端前须先移除 SRS 规则。官方后端源码证据见[版本与兼容性研究](../../docs/upstream/2026-10-19/singbox/report.md)。

---

规则更新依赖可访问 GitHub raw 的网络或可用代理；导入与下载故障排查见[规则下载说明](../../docs/rule-asset-delivery.md)。


> 版本：**v6.0.20-pw.11**（Build 2026-10-24；基线：Clash Party v6.0.20；78 个 SRS 资产使用发布版本缓存键）。

---

## 1. 定位

Passwall 是 OpenWrt 上的全功能代理插件，带直连/屏蔽/GFW/代理四列表、shunt rules、ACL 和 TCP/UDP 节点分选。它底层走 xray-core / sing-box，不打包 mihomo，也没有 Clash Party 的 proxy-groups 嵌套选择器。

本目录因此只提供 fallback：从最终 fused 规则集生成 78 条非空 Passwall 原生 shunt rule。每条 rule 只引用一个远程 `.srs`：

```text
rule-set:remote:https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/generated/fused/sing-box/<segment>.srs
```

规则只在源规则图及融合链路维护，不在本目录手写展开。

---

## 2. 文件说明

| 文件 | 用途 |
| --- | --- |
| `Passwall(xray+sing-box)-apply.sh` | 验证 sing-box 分流后端后创建 78 条 fused shunt rule |
| `Passwall(xray+sing-box).conf` | 纯文本参考，展示 78 条 rule 的顺序、目标和 `.srs` URL |
| `shunt-rules/*.list` | 每个 fused 段一个 `.list`，方便在 LuCI 手工复制 |
| `REFERENCE-passwall.md` | Passwall 语法和官方源码参考 |

`shunt-rules/*.list` 每个文件只保留一个非注释行。不要在这里手写 `domain:` / `geoip:` / Clash 前缀。

---

## 3. 推荐导入方式

1. 在 LuCI 创建 sing-box 分流节点，确认所有分流节点均使用该后端；备份 `/etc/config/passwall`。把 `双内核系/Passwall/Passwall(xray+sing-box)-apply.sh` 复制到路由器。
2. 执行：

```sh
sh 'Passwall(xray+sing-box)-apply.sh'
```

3. 打开 LuCI 的 Passwall 分流控制。
4. 在 sing-box 分流节点内给每条 `scki-fused-*` 规则选择业务目标节点；当前稳定版全局入口为 `@global[0].node`，不能以旧版 TCP/UDP 分选说明代替实际后端设置。
5. 保存并应用。

脚本默认 `--replace`，会删除旧的 Smart-Config-Kit fused rule 以及历史 emoji remark 规则，避免重复追加。需要并存时可显式运行：

```sh
sh 'Passwall(xray+sing-box)-apply.sh' --append
```

---

## 4. 手工导入方式

不方便 SSH 时，可在 LuCI 的 **sing-box 分流节点**中逐条新增 shunt rule；手工粘贴不会执行脚本的后端检查：

1. 打开 `双内核系/Passwall/shunt-rules/<segment>.list`。
2. 将其中的 `rule-set:remote:...srs` 粘贴到 Domain List。
3. 如果 `Passwall(xray+sing-box).conf` 对该段同时标注了 IP List，把同一 URL 也粘贴到 IP List。
4. 网络类型选择 `tcp,udp`。
5. 目标节点选择你希望该业务走的节点或负载均衡组。

Passwall / Passwall2 的 sing-box 后端支持 `rule-set:remote:` / `rule-set:local:`。Xray 后端会过滤这些引用；Passwall2 还可能生成缺失域名/IP 条件的宽匹配规则。不要将 SRS 引用交给 Xray，也不要粘贴 Clash 的 `DOMAIN-SUFFIX,` 等前缀。

---

## 5. 与 OpenClash 的差异

| 能力 | Passwall fallback | OpenClash / Clash Party |
| --- | --- | --- |
| fused 规则顺序 | 78 条非空 shunt rule | 168 条 Mihomo 主规则 |
| 远程规则集 | sing-box `.srs` | Mihomo `.mrs` / residual YAML |
| 策略组嵌套 | 不支持 | 支持 |
| 自动测速 | 由你配置节点或负载均衡 | 支持区域组 url-test / Smart |
| LightGBM | 不支持 | Clash Party Smart 支持 |
| 端口/逻辑/MATCH | Passwall shunt 模型受限 | Mihomo 原生表达 |

需要嵌套策略组或 Smart 时使用 OpenClash。

---

## 6. 维护者入口

不要手工编辑 `Passwall(xray+sing-box)-apply.sh`、`Passwall(xray+sing-box).conf` 或 `shunt-rules/*.list`。生成链路：

```bash
node tools/build-fused-rule-sets.js
node tools/generate-fused-fallback-artifacts.js
node tools/validate-artifact-contracts.js --strict-ruby
```

官方语法参考：

- Passwall shunt_rules.lua：https://github.com/Openwrt-Passwall/openwrt-passwall/blob/main/luci-app-passwall/luasrc/model/cbi/passwall/client/shunt_rules.lua
- Passwall2 shunt_rules.lua：https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua
- Passwall / Passwall2 差异讨论：https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555

补充说明：[Claude 服务依赖](../../docs/claude-service-dependencies.md) · [测速与 QUIC](../../docs/traffic-options.md) · [微信连接排障](../../docs/research/2026-10-16-wechat-issue-187.md)。
