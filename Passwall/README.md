# Passwall 使用教程（对齐 Clash Party v6.0.14）

> 目录简介：这里提供 Passwall 全功能版的 fused shunt rule fallback、UCI 批量脚本和 OpenWrt 导入说明。
>
> 版本：**v6.0.14-pw.5**（Build 2026-09-29；基线：Clash Party v6.0.14；生成 `.srs` 资产使用发布版本缓存键；变更历史见 `Passwall/CHANGELOG.md`）。

---

## 1. 定位

Passwall 是 OpenWrt 上的全功能代理插件，带直连/屏蔽/GFW/代理四列表、shunt rules、ACL 和 TCP/UDP 节点分选。它底层走 xray-core / sing-box，不打包 mihomo，也没有 Clash Party 的 proxy-groups 嵌套选择器。

本目录因此只提供 fallback：从最终 fused 规则集生成 69 条非空 Passwall 原生 shunt rule。每条 rule 只引用一个远程 `.srs`：

```text
rule-set:remote:https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/rulesets/generated/fused/sing-box/<segment>.srs
```

旧版 33 条手写域名/IP 展平列表已经移除。规则内容只在 `rulesets/source/routing-graph.js` 和 `rulesets/generated/fused/**` 维护。

---

## 2. 文件说明

| 文件 | 用途 |
| --- | --- |
| `Passwall(xray+sing-box)-apply.sh` | SSH 到路由器后执行，一次性创建 66 条 fused shunt rule |
| `Passwall(xray+sing-box).conf` | 纯文本参考，展示 66 条 rule 的顺序、目标和 `.srs` URL |
| `shunt-rules/*.list` | 每个 fused 段一个 `.list`，方便在 LuCI 手工复制 |
| `REFERENCE-passwall.md` | Passwall 语法和官方源码参考 |

`shunt-rules/*.list` 每个文件只保留一个非注释行。不要在这里手写 `domain:` / `geoip:` / Clash 前缀。

---

## 3. 推荐导入方式

1. 把 `Passwall/Passwall(xray+sing-box)-apply.sh` 复制到 OpenWrt 路由器。
2. 执行：

```sh
sh 'Passwall(xray+sing-box)-apply.sh'
```

3. 打开 LuCI 的 Passwall 分流控制。
4. 给每条 `scki-fused-*` 规则选择目标 `tcp_node` / `udp_node` 或负载均衡组。
5. 保存并应用。

脚本默认 `--replace`，会删除旧的 Smart-Config-Kit fused rule 以及历史 emoji remark 规则，避免重复追加。需要并存时可显式运行：

```sh
sh 'Passwall(xray+sing-box)-apply.sh' --append
```

---

## 4. 手工导入方式

不方便 SSH 时，可在 LuCI 里逐条新增 shunt rule：

1. 打开 `Passwall/shunt-rules/<segment>.list`。
2. 将其中的 `rule-set:remote:...srs` 粘贴到 Domain List。
3. 如果 `Passwall(xray+sing-box).conf` 对该段同时标注了 IP List，把同一 URL 也粘贴到 IP List。
4. 网络类型选择 `tcp,udp`。
5. 目标节点选择你希望该业务走的节点或负载均衡组。

Passwall / Passwall2 的 `shunt_rules.lua` 支持 `rule-set:remote:` / `rule-set:local:`，但不识别 Clash 的 `DOMAIN-SUFFIX,`、`DOMAIN-KEYWORD,`、`DOMAIN,`、`IP-CIDR,` 前缀。

---

## 5. 与 OpenClash 的差异

| 能力 | Passwall fallback | OpenClash / Clash Party |
| --- | --- | --- |
| fused 规则顺序 | 69 条非空 shunt rule | 151 条 Mihomo 主规则 |
| 远程规则集 | sing-box `.srs` | Mihomo `.mrs` / residual YAML |
| 策略组嵌套 | 不支持 | 支持 |
| 自动测速 | 由你配置节点或负载均衡 | 支持区域组 url-test / Smart |
| LightGBM | 不支持 | Clash Party Smart 支持 |
| 端口/逻辑/MATCH | Passwall shunt 模型受限 | Mihomo 原生表达 |

需要完整策略组体验时，建议改用 OpenClash。坚持使用 Passwall 时，本目录是最小维护面的原生 fused fallback。

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
