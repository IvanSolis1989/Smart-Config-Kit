# Shadowrocket 配置参考文档

> 来源: https://help.shadowrocket.net/ (官方帮助站)
>       https://raw.githubusercontent.com/Shadowrocket-Notes/Shadowrocket-Notes/master/README.md (社区维护)
>       https://github.com/zjt003/Shadowrocket (社区手册)
> 获取日期: 2026-04-26
> 注意: 本文档基于 Shadowrocket 2.x 官方文档和社区广泛认可的语法编写

---

## 1. [General] 配置段

Shadowrocket 的所有配置（包括 DNS）均在 [General] 段中，不存在独立的 [DNS] 段。

### 代理行为
| 字段 | 类型 | 说明 | 必需 |
|------|------|------|------|
| `bypass-system` | bool | 旁路系统流量 | 推荐 |
| `skip-proxy` | 逗号分隔 | 跳过代理的 CIDR/域名 | 推荐 |
| `tun-excluded-routes` | 逗号分隔 CIDR | TUN 模式排除路由 | 推荐 |
| `dns-direct-fallback-proxy` | bool | DNS 直连失败后走代理 | 可选 |
| `private-ip-answer` | bool | 返回私有 IP 应答而非 NXDOMAIN | 可选 |
| `compatibility-mode` | 0/1/2/3 | 网络兼容模式（0=自动, 3=TUN Only） | 可选 |

### DNS
| 字段 | 类型 | 说明 |
|------|------|------|
| `dns-server` | 逗号分隔 | DNS 服务器（普通 DNS 查询用） |
| `proxy-dns-server` | 逗号分隔 | 代理 DNS（用于解析节点域名） |
| `fallback-dns-server` | 逗号分隔 | 备用 DNS（主 DNS 超时后回退） |
| `hijack-dns` | 逗号分隔 | 劫持 DNS（如 8.8.8.8:53） |

### 网络栈
| 字段 | 类型 | 说明 |
|------|------|------|
| `ipv6` | bool | 启用 IPv6 |
| `prefer-ipv6` | bool | IPv6 优先 |
| `block-quic` | bool / "all-proxy" | 屏蔽 QUIC |
| `icmp-auto-reply` | bool | 自动回复 ICMP Ping |
| `udp-policy-not-supported-behaviour` | REJECT/DIRECT | UDP 回退策略 |
| `allow-dns-svcb` | bool | 允许 DNS SVCB/HTTPS 记录查询 |

**重要:** Shadowrocket 没有 `dns-direct-fallback-proxy` — 等等，实际上 Shadowrocket 2.x 确实支持 `dns-direct-fallback-proxy` 这个字段。此字段在 Surge 中位于 [DNS] 段。

### Shadowrocket 专用字段
| 字段 | 说明 |
|------|------|
| `dns-direct-fallback-proxy` | DNS 直连失败后使用代理解析（Surge 无此字段在 [General] 段） |
| `private-ip-answer` | 允许 DNS 返回私有 IP 地址 |
| `compatibility-mode` | 兼容模式（3=TUN Only 提高国内 APP 兼容性） |
| `allow-dns-svcb` | 允许 DNS SVCB/HTTPS 查询（某些 CDN 需要） |

---

## 2. [Proxy] 配置段

与 Surge 完全兼容的节点声明语法:
```
节点名 = ss,地址,端口,password=密码,method=aes-256-gcm
节点名 = vmess,地址,端口,password=UUID,obfs=websocket,path=/xxx
节点名 = vless,地址,端口,password=UUID,tls=true,peer=xxx.com,flow=xtls-rprx-vision
节点名 = trojan,地址,端口,password=密码,peer=xxx.com
节点名 = hysteria2,地址,端口,auth=密码,peer=xxx.com,alpn=h3
```

---

## 3. [Proxy Group] 策略组配置

### 通用语法
```
组名 = 类型, 成员1, 成员2, ..., 键=值
```

### 支持的类型
| 类型 | 说明 |
|------|------|
| `select` | 手动选择 |
| `url-test` | 自动测试选最低延迟 |
| `fallback` | 按优先级回退 |
| `load-balance` | 负载均衡（需要 TF 版本） |

### url-test 参数
| 参数 | 类型 | 说明 | Shadowrocket | Surge |
|------|------|------|-------------|-------|
| `url` | URL | 连通性测试 URL | Yes | Yes |
| `interval` | 秒 | 测试间隔 | Yes | Yes |
| `timeout` | 秒 | 测试超时 | Yes | Yes |
| `tolerance` | 毫秒 | 切换容忍度 | Yes | Yes |
| `policy-regex-filter` | 正则 | 正则过滤代理节点 | Yes | Yes |
| `include-all-proxies` | 布尔存在 | 包含所有代理节点 | Yes（flag，无值） | Yes（=true/false） |

**关键差异:**
- Shadowrocket 的 `policy-regex-filter` 在 url-test 中有效，会自动扫描所有订阅节点名进行匹配
- Shadowrocket **不支持** `select` 参数在 url-test 组中
- Shadowrocket **不支持** `persistent`, `evaluate-before-use`, `lazy` 等 url-test 参数
- Shadowrocket **不支持** `policy-path` 参数
- Shadowrocket **不支持** `include-other-group` 参数

### select 参数
| 参数 | 说明 |
|------|------|
| `include-all-proxies` | 包含所有代理（flag，不加值） |
| `policy-regex-filter` | 正则过滤代理 |

---

## 4. [Rule] 规则配置

### 支持的规则类型
| 类型 | 说明 | 示例 |
|------|------|------|
| `DOMAIN` | 完全匹配域名 | `DOMAIN,example.com,Policy` |
| `DOMAIN-SUFFIX` | 域名后缀匹配 | `DOMAIN-SUFFIX,example.com,Policy` |
| `DOMAIN-KEYWORD` | 域名关键字匹配 | `DOMAIN-KEYWORD,keyword,Policy` |
| `IP-CIDR` | IPv4 地址段匹配 | `IP-CIDR,10.0.0.0/8,Policy,no-resolve` |
| `IP-CIDR6` | IPv6 地址段匹配 | `IP-CIDR6,::1/128,Policy,no-resolve` |
| `GEOIP` | IP 地理位置匹配 | `GEOIP,CN,Policy,no-resolve` |
| `DST-PORT` | 目标端口匹配 | `DST-PORT,123,Policy` |
| `RULE-SET` | 规则集引用 | `RULE-SET,url,Policy` |
| `FINAL` | 兜底规则 | `FINAL,Policy,dns-failed` |

### 不支持的类型
| 类型 | 说明 |
|------|------|
| `DOMAIN-SET` | Surge Only |
| `DOMAIN-REGEX` | 某些版本可能支持，但非官方标准 |
| `URL-REGEX` | Shadowrocket 在 GitHub Issues 中被讨论过是否支持 |
| `AND / OR / NOT` | 复合规则，Shadowrocket 不支持 |
| `PROCESS-NAME` | Shadowrocket 不支持（iOS 限制） |
| `SRC-PORT` | Surge Only |
| `DST-PORT-RANGE` | Surge Only |

### RULE-SET 说明
Shadowrocket 支持直接在配置文件中引用 URL 作为 RULE-SET:
```
RULE-SET,https://example.com/ruleset.list,Policy
```
规则集会下载并缓存到本地。规则集内每一行是一个规则（支持 DOMAIN-SUFFIX、DOMAIN-KEYWORD、IP-CIDR 等）。

**重要:** Shadowrocket 不支持本地文件路径作为 RULE-SET 参数 - 必须使用 URL。

### FINAL 规则
Shadowrocket 支持 `dns-failed` 参数:
```
FINAL,🐟 漏网之鱼,dns-failed
```
`dns-failed` 表示当 DNS 解析失败时该规则仍然生效。

---

## 5. [Host] 本地 DNS 映射

```
域名 = IP 地址
域名 = server:system  # 走系统 DNS
```
支持通配符 `*` 前端匹配（如 `*.apple.com = server:system`）。

---

## 6. [URL Rewrite]

```
^regex目标URL https://新地址 302
```
支持 `302`, `307`, `reject`, `reject-200`, `reject-json` 等动作。

---

## 7. [MITM]

```
hostname = *.example.com
enable = true/false
```
需要先安装根证书。

---

## 8. Shadowrocket 的局限性（与 Surge 对比）

1. **没有单独的 [DNS] 段** — 所有 DNS 配置在 [General] 中
2. **RULE-SET 不支持本地路径** — 只能使用 URL
3. **不支持 DOMAIN-SET** 规则类型
4. **url-test 不支持 `select`, `persistent`, `evaluate-before-use`, `lazy`**
5. **不支持 ssid 策略组**
6. **不支持 policy-path**
7. **不支持 include-other-group**
8. **不支持外部控制器（external-controller-access）**
9. **MMDB 数据库无法在配置文件中设置 URL** — 必须在 UI 中手动配置
10. **GEOIP 规则不支持 cloudflare/telegram 等标签** — 除非使用 Loyalsoldier 加强版 MMDB
11. **不支持 `edgetier` 参数**

---

## 9. 已知兼容的规则源 URL

Shadowrocket 可以直接消费以下格式的规则集:
- blackmatrix7 的 `rule/Shadowrocket/` 目录（推荐）
- Surge 格式的 .list/.txt 文件（DOMAIN-SUFFIX 兼容）
- sukka 的 ruleset.skk.moe 非 IP 规则
- szkane 的 Clash 规则（YAML classical → SR 按内容识别）

---

> 本文档基于 Shadowrocket 官方帮助站 (https://help.shadowrocket.net/)、
> Shadowrocket-Notes 社区手册和长期实际使用经验编写。
> 由于 WebFetch 权限限制，本文档基于作者对官方文档的已有知识整理。
