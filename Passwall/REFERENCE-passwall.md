# Passwall 配置参考文档

> 来源 URL：
> - https://github.com/Openwrt-Passwall/openwrt-passwall (Passwall 源码)
> - https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua (分流规则解析器源码，Passwall2 与 Passwall 规则语法相同)
> - https://github.com/Openwrt-Passwall/openwrt-passwall2/discussions/555 (Passwall vs Passwall2 差异讨论)
>
> 获取日期：2026-04-26

---

## 1. Passwall 简介

Passwall 是 OpenWrt 上的全功能代理分流插件（由 Openwrt-Passwall 组织维护）。

**定位：** 全功能版 — 支持四列表（直连/屏蔽/GFW/代理）+ 分流规则 + ACL + TCP/UDP 节点分选 + trojan-plus 节点。

**与 Passwall2 的关系：** 两者是并行维护的独立插件，**不是**新旧关系。Passwall2 是精简分流版（砍掉了四列表 + ACL，只保留分流规则）。

---

## 2. 分流规则 UCI 配置

### 2.1 UCI 配置名

```bash
CONFIG_NAME="passwall"  # Passwall 使用 "passwall"
                        # Passwall2 使用 "passwall2"
```

### 2.2 分流规则操作

```bash
# 添加一条新分流规则
SEC="$(uci add passwall shunt_rules)"

# 设置备注名
uci set passwall.${SEC}.remarks='🤖 AI 服务'

# 添加域名匹配条目（支持多值，可用 add_list 或空格分隔）
uci add_list passwall.${SEC}.domain_list='geosite:openai'
uci add_list passwall.${SEC}.domain_list='domain:cursor.com'

# 添加 IP 匹配条目
uci add_list passwall.${SEC}.ip_list='geoip:telegram'
uci add_list passwall.${SEC}.ip_list='1.1.1.0/24'

# 设置网络协议
uci set passwall.${SEC}.network='tcp,udp'

# 设置目标节点（Passwall 全功能版用 tcp_node / udp_node）
uci set passwall.${SEC}.tcp_node='NEED_CONFIG_IN_LUCI'
uci set passwall.${SEC}.udp_node='NEED_CONFIG_IN_LUCI'

# 提交更改
uci commit passwall
```

---

## 3. 域名列表 (domain_list) 语法

根据 `shunt_rules.lua`，域名列表支持以下格式：

| 格式 | 示例 | 说明 |
|------|------|------|
| 纯字符串 | `sina.com` | **关键字匹配**。域名中包含此字符串即匹配 |
| `domain:` | `domain:google.com` | **子域名匹配**。匹配 `google.com` 和 `*.google.com` |
| `full:` | `full:www.google.com` | **完整匹配**。仅当域名完全相等时匹配 |
| `regexp:` | `regexp:\\.goo.*\\.com$` | **正则匹配** |
| `geosite:` | `geosite:cn` | **预定义域名列表**。引用 geosite.dat 分类 |
| `rule-set:remote:` | `rule-set:remote:https://.../geosite-cn.srs` | **远程 Sing-Box 规则集** |
| `rule-set:local:` | `rule-set:local:/usr/share/sing-box/geosite-cn.srs` | **本地 Sing-Box 规则集** |
| `rs:remote:` | `rs:remote:https://...` | 同上，缩写 |
| `rs:local:` | `rs:local:/path/to/file.srs` | 同上，缩写 |
| `ext:` | `ext:file:tag` | **外部文件** (略少见) |
| `#` | `# 这是注释` | **注释行** |

**不支持：** Clash 格式的 `DOMAIN-SUFFIX,` / `DOMAIN-KEYWORD,` / `DOMAIN,` / `IP-CIDR,` 等逗号前缀格式。

---

## 4. IP 列表 (ip_list) 语法

| 格式 | 示例 | 说明 |
|------|------|------|
| 纯 IP | `127.0.0.1` | 单个 IP 地址 |
| CIDR | `10.0.0.0/8` | IP 段 |
| `geoip:` | `geoip:cn` | 预定义 GeoIP 国家/地区代码 |
| `rule-set:remote:` | `rule-set:remote:https://.../geoip-cn.srs` | 远程 Sing-Box 规则集 |
| `rule-set:local:` | `rule-set:local:/usr/share/sing-box/geoip-cn.srs` | 本地 Sing-Box 规则集 |
| `ext:` | `ext:geoip.dat:cn` | 外部文件 |
| `#` | `# 注释` | **注释行** |

---

## 5. 其他 UCI 字段

| 字段 | 示例 | 说明 |
|------|------|------|
| `remarks` | `🤖 AI 服务` | 规则备注名 |
| `domain_list` | `geosite:openai` | 域名匹配列表 (多值，TextValue) |
| `ip_list` | `geoip:cn` | IP 匹配列表 (多值，TextValue) |
| `network` | `tcp,udp` | 网络协议 |
| `protocol` | `http tls` | 嗅探协议 (多值) |
| `inbound` | `tproxy socks` | 入站标识 (多值) |
| `source` | `192.168.1.0/24 geoip:private` | 来源 IP 限制 (多值) |
| `sourcePort` | `53` | 来源端口 |
| `port` | `80,443` | 目标端口 |
| **`tcp_node`** | `node_tag` | Passwall 专用：TCP 目标节点 |
| **`udp_node`** | `node_tag` | Passwall 专用：UDP 目标节点 |
| `invert` | `1` | 反选匹配结果 (仅 Sing-Box) |

---

## 6. 与 Passwall2 的差异

| 特性 | Passwall | Passwall2 |
|------|----------|-----------|
| UCI config name | `passwall` | `passwall2` |
| 节点字段 | `tcp_node` / `udp_node` | `node` (统一) |
| 四列表 | 支持 (直连/屏蔽/GFW/代理) | 不支持 |
| ACL | 支持 (按客户端) | 不支持 |
| TCP/UDP 分选 | 支持 (tcp_node ≠ udp_node) | 不支持 (同一 node) |
| trojan-plus | 支持 | 不支持 |
| 规则语法 | 完全相同 | 完全相同 |
| `.list` 文件 | 互通 | 互通 |
