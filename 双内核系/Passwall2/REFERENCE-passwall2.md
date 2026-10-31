# Passwall2 配置参考文档

> 核对于 2026-10-28：本次仅将 GoogleFCM 由下载更新归入 Google 服务；复核 [官方 shunt_rules.lua](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua)，保持 rule-set:remote SRS 条件语法，实际业务出口仍由 LuCI 用户配置。不改变 DNS、fake-IP、嗅探、其他推送或节点组；未新增字段、最低版本或真机通过声明。

> 更新于 2026-10-19：官方稳定标签的 UI 与后端分别核验，见[完整报告与原文缓存](../../docs/upstream/2026-10-19/singbox/report.md#passwall--passwall2)。下方为历史摘要，未整篇当前化；以本节后端边界为准。

## 2026-10-19 现行核验

- 官方稳定版 [26.10.1-2](https://github.com/Openwrt-Passwall/openwrt-passwall2/releases/tag/26.10.1-2) 发布于 2026-10-02；本次列表中最新标记预发布的是较早的 26.9.9-2（2026-09-09），不能把它当成比稳定版更新的候选。
- 分流节点为 `protocol='_shunt'`；`type='sing-box'` 与 `type='Xray'` 分别进入不同生成器，全局入口读取 `@global[0].node`。
- `rule-set:remote:...srs` 由 sing-box 后端转成 `route.rule_set`，Xray 后端显式跳过该输入。因此本仓库 fused `.srs` 路径必须限定 sing-box 后端。
- 稳定标签 `util_xray.lua` 在过滤后 `domains=nil` 且 `ip=nil` 时仍可能插入无目标域/IP条件的规则；配合本仓库 `network='tcp,udp'` 会扩大匹配范围。不能把“无报错”作为兼容验收，安装脚本必须在写 UCI 前阻断该组合。
- 新版本仍需实际 OpenWrt 设备验证；本次证明为固定官方源码的数据流与隔离测试，不代表真实流量已验收。

## 历史摘要（未整篇复核）

> 2026-10-15 URL 兼容性复核：继续使用本文件已记录的 `rule-set:remote:https://.../*.srs` 原生语法，来源为 Passwall2 官方解析器源码；本次仅换 URL 主机，没有重新确认解析器对 scheme 的限制。详见 [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md)。

> 更新于 2026-07-09：复核当前 `shunt_rules.lua` 解析器。Passwall2 的 `domain_list` 与 `ip_list` 仍接受 `rule-set:remote:` / `rule-set:local:`，因此本仓库的 Passwall2 fallback 直接引用 `rulesets/generated/fused/sing-box/*.srs`，不再维护手写域名/IP 展平列表。
>
> 更新于 2026-05-31（上次获取 2026-04-30）：Passwall2 最新版 v26.5.19-1（2026-05-18）。从 v26.4.20-1 升级 4 个版本。`shunt_rules.lua` 分流规则语法无变更。
>
> 更新于 2026-04-30（上次获取 2026-04-26）：Passwall2 最新版 v26.4.20-1（2026-04-19）。新增 APK 包管理支持（OpenWrt 新包管理器）。`shunt_rules.lua` 分流规则语法无变更。
>
> 来源 URL：
> - https://github.com/Openwrt-Passwall/openwrt-passwall2 (Passwall2 源码)
> - https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua (分流规则解析器源码)
> - https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555 (Passwall vs Passwall2 差异讨论)
>
> 获取日期：2026-07-09

---

## 1. Passwall2 简介

Passwall2 是 OpenWrt 上的精简分流代理插件（由 Openwrt-Passwall 组织维护）。

**定位：** 精简分流版 — 专注分流规则匹配。砍掉了四列表（直连/屏蔽/GFW/代理）和 ACL，只保留基于分流规则的流量控制。

**与 Passwall 的关系：** 两者是**并行维护**的独立插件，不是新旧版本关系。Passwall 是全功能版（四列表 + ACL + TCP/UDP 分选），Passwall2 是精简分流版。规则语法完全互通。

---

## 2. 分流规则 UCI 配置

### 2.1 UCI 配置名

```bash
CONFIG_NAME="passwall2"  # Passwall2 使用 "passwall2"
```

### 2.2 分流规则操作

```bash
# 添加一条新分流规则
SEC="$(uci add passwall2 shunt_rules)"

# 设置备注名
uci set passwall2.${SEC}.remarks='🤖 AI 服务'

# 添加域名匹配条目
uci add_list passwall2.${SEC}.domain_list='geosite:openai'
uci add_list passwall2.${SEC}.domain_list='domain:cursor.com'

# 添加 IP 匹配条目
uci add_list passwall2.${SEC}.ip_list='geoip:telegram'

# 设置网络协议
uci set passwall2.${SEC}.network='tcp,udp'

# 设置目标节点（Passwall2 用 node，不是 tcp_node/udp_node）
uci set passwall2.${SEC}.node='NEED_CONFIG_IN_LUCI'

# 提交更改
uci commit passwall2
```

---

## 3. 域名列表 (domain_list) 语法

根据 `shunt_rules.lua` 解析器源码，域名列表支持以下格式：

| 格式 | 示例 | 说明 |
|------|------|------|
| 纯字符串 | `sina.com` | **关键字匹配**。域名中包含此字符串即匹配 (由 Lua 的 `datatypes.hostname` 校验) |
| `domain:` | `domain:google.com` | **子域名匹配**。推荐格式 |
| `full:` | `full:www.google.com` | **完整匹配** |
| `regexp:` | `regexp:\\.goo.*\\.com$` | **正则匹配** |
| `geosite:` | `geosite:cn` | **预定义域名列表**。引用 geosite.dat 文件 |
| `rule-set:remote:` | `rule-set:remote:https://...geosite-cn.srs` | **远程 Sing-Box 规则集** |
| `rule-set:local:` | `rule-set:local:/usr/share/sing-box/geosite-cn.srs` | **本地 Sing-Box 规则集** |
| `rs:remote:` | `rs:remote:https://...` | 同上，缩写 |
| `rs:local:` | `rs:local:/path/to/file.srs` | 同上，缩写 |
| `ext:` | `ext:geosite.dat:cn` | **外部文件** |
| `#` | `# 注释` | **注释行**，以 `#` 开头的行为注释 |

**不支持：** Clash 格式的 `DOMAIN-SUFFIX,` / `DOMAIN-KEYWORD,` / `IP-CIDR,` 等逗号前缀格式。

---

## 4. IP 列表 (ip_list) 语法

| 格式 | 示例 | 说明 |
|------|------|------|
| 纯 IP | `127.0.0.1` | 单个 IP 地址 (由 `datatypes.ipmask4` / `ipmask6` 校验) |
| CIDR | `10.0.0.0/8` | IP 段 |
| `geoip:` | `geoip:cn` | 预定义 GeoIP 分类 |
| `rule-set:remote:` | `rule-set:remote:https://...geoip-cn.srs` | 远程 Sing-Box 规则集 |
| `rule-set:local:` | `rule-set:local:/usr/share/sing-box/geoip-cn.srs` | 本地 Sing-Box 规则集 |
| `rs:remote:` | `rs:remote:https://...` | 缩写 |
| `rs:local:` | `rs:local:/path/to` | 缩写 |
| `ext:` | `ext:geoip.dat:cn` | 外部文件 |
| `#` | `#注释` | **注释行** |

---

## 5. 其他 UCI 字段

| 字段 | 示例 | 说明 |
|------|------|------|
| `remarks` | `🤖 AI 服务` | 规则备注名 |
| `domain_list` | (多行文本) | 域名列表 (TextValue) |
| `ip_list` | (多行文本) | IP 列表 (TextValue) |
| `network` | `tcp,udp` | 网络协议 (ListValue: tcp,udp / tcp / udp) |
| `protocol` | `http tls bittorrent` | 嗅探协议 (多选) |
| `inbound` | `tproxy socks` | 入站标识 (多选) |
| `source` | `192.168.1.0/24 geoip:private` | 来源 IP (DynamicList) |
| `port` | `80,443` | 目标端口 |
| **`node`** | `node_tag` | **Passwall2 专用**：统一目标节点 (不区分 TCP/UDP) |
| `invert` | `1` | 反选匹配结果 (仅 Sing-Box) |

---

## 6. 与 Passwall 的差异

| 特性 | Passwall2 | Passwall |
|------|-----------|----------|
| UCI config name | `passwall2` | `passwall` |
| 节点字段 | `node` (统一) | `tcp_node` / `udp_node` |
| 四列表 | 不支持 | 支持 |
| ACL | 不支持 | 支持 |
| TCP/UDP 分选 | 不支持 | 支持 |
| trojan-plus | 不支持 | 支持 |
| 规则语法 | 完全相同 | 完全相同 |
| `.list` 文件 | 互通 | 互通 |

---

## 7. `.list` 文件格式

`.list` 文件是为方便用户复制贴入 LuCI 界面而准备的纯文本文件：

- 每行一条规则条目
- 空行和 `#` 注释行被忽略
- 条目格式与 `domain_list` / `ip_list` 字段完全一致
- 示例：
  ```
  # 🛑 广告拦截
  geosite:category-ads-all
  ```
