# Surge 官方手册参考文档

> 更新于 2026-10-19（上次专题摘要 2026-05-31）：官方正文、版本 metadata、取舍与验证缺口见[苹果客户端复核](../docs/upstream/2026-10-19/apple/report.md)。原文快照及哈希见[来源清单](../docs/upstream/2026-10-19/apple/manifest.json)。

## 当前复核结论

- Surge iOS 稳定版 5.23.0（2026-10-12 UTC）；Mac 稳定版 6.10.0/12500（2026-10-12 UTC）。Mac beta feed 为 6.11.0/12560（2026-10-16 UTC），enclosure 与旧 title 冲突已原样保留，不混入稳定版结论。
- 官方 [Profile Format](https://manual.nssurge.com/profile/format.html)不识别 `[DNS]`；DNS 全局键位于 `[General]`。旧文的独立 DNS 节、`fallback-dns-server` 和 `dns-direct-fallback-proxy` 说明错误，已纠正。
- [加密 DNS](https://manual.nssurge.com/dns/encrypted-dns.html)并发首答；普通 DNS 仅连通性检测/加密服务器域名自举。保持 `encrypted-dns-follow-outbound-mode=false` 时加密 DNS 直连；没有“直连失败再转代理”的等价开关。
- [TUIC v5](https://manual.nssurge.com/policies/tuic.html)原生支持；[Hysteria 2](https://manual.nssurge.com/policies/hysteria2.html)为 iOS5.8.0+/Mac5.4.0+；[AnyTLS](https://manual.nssurge.com/policies/anytls.html)为 iOS5.17.0+/Mac6.4.3+。External 程序仅 Mac，iOS 按 REJECT 处理。
- Surge 有原生 [smart](https://manual.nssurge.com/policy-groups/smart.html)（iOS5.11.0+/Mac5.7.0+）；本仓库仍用 url-test，不把它与 Mihomo LightGBM 等同。category/HTTPS测速及 beta adaptive QUIC 仅列候选。

## 历史摘要边界

以下保留旧摘要以便追溯；未被本次逐项确认的跨客户端比较和样例不能视为最新官方承诺。以本节及缓存官方正文为准，本次未完成真实 App 验收。


> 2026-10-15 URL 兼容性复核：[官方 Rule Set 手册](https://manual.nssurge.com/rules/ruleset.html)明确允许外部 `http://` / `https://` 资源，并示例 `RULE-SET,<URL>,<policy>`；Issue #186 只替换仓库自有规则 URL 主机，语法不变。详见 [`docs/rule-asset-delivery.md`](../docs/rule-asset-delivery.md)。

> 来源: https://manual.nssurge.com/
> 获取日期: 2026-04-26
> 更新于 2026-05-31（复查）：Surge iOS v5.18.0（2026-05-06）。manual.nssurge.com 配置手册未发现语法变更。Surge 5.x 配置语法与当前基线兼容。
>
> 更新于 2026-04-30（复查）：重新抓取 manual.nssurge.com，未发现版本号或配置语法变更。Surge 5.x 配置语法与当前基线兼容。
> 注意: 本文档基于 Surge 5.x / Surge Mac 5.x 官方手册编写

---

## 1. [General] 配置段

### 网络测试
| 字段 | 类型 | 说明 |
|------|------|------|
| `internet-test-url` | URL | 用于检测互联网连通性的 URL（默认 http://www.apple.com/library/test/success.html） |
| `proxy-test-url` | URL | 用于代理连通性/延迟测试的 URL |
| `test-timeout` | 整数 | 代理测试超时时间（秒），默认 5 |

### 代理行为
| 字段 | 类型 | 说明 |
|------|------|------|
| `bypass-system` | bool | 旁路系统流量，不经过 Surge |
| `skip-proxy` | 逗号分隔 | 跳过代理的目标 IP/域名列表 |
| `tun-excluded-routes` | CIDR 列表 | TUN 模式排除的路由 |
| `exclude-simple-hostnames` | bool | 排除短主机名（如 localhost, .arpa, .lan） |
| `read-etc-hosts` | bool | 读取系统 /etc/hosts（macOS 专用） |

### DNS 配置（[General] 段基础字段）
| 字段 | 类型 | 说明 |
|------|------|------|
| `dns-server` | 逗号分隔 | 普通服务器 IP / system；遗留加密 URL 会在加载时迁入 encrypted-dns-server，不作为推荐写法 |
| `encrypted-dns-server` | 逗号分隔 | 加密 DNS 服务器列表（DoH/DoT URL） |
| `encrypted-dns-follow-outbound-mode` | bool | 加密 DNS 是否跟随出站模式 |
| `hijack-dns` | 逗号分隔 | 劫持 DNS 查询的目标地址（如 8.8.8.8:53） |

### 网络栈
| 字段 | 类型 | 说明 |
|------|------|------|
| `ipv6` | bool | 启用 IPv6 |
| `prefer-ipv6` | bool | IPv6 优先 |
| `block-quic` | bool / "all-proxy" | 屏蔽 QUIC/HTTP/3 流量 |
| `icmp-auto-reply` | bool | 自动回复 ping |
| `udp-policy-not-supported-behaviour` | "REJECT" / "DIRECT" | 遇到不支持 UDP 的策略时行为 |

### GeoIP 配置
| 字段 | 类型 | 说明 |
|------|------|------|
| `geoip-maxmind-url` | URL | 自定义 GeoIP MMDB 数据库 URL（Surge 启动时自动下载） |
| `disable-geoip-db-auto-update` | bool | 禁用 GeoIP 数据库自动更新 |

### 外部控制
| 字段 | 类型 | 说明 |
|------|------|------|
| `external-controller-access` | string | 外部控制器访问凭据和地址 |
| `http-api` | string | HTTP API 访问凭据和地址（新字段） |
| `http-api-tls` | bool | HTTP API 使用 TLS |
| `http-api-web-dashboard` | bool | 启用 Web Dashboard |

---

## 2. DNS 节误述更正（2026-10-19）

Surge 不识别独立 `[DNS]` 节。旧摘要曾列出 `fallback-dns-server`、`proxy-dns-server`、`dns-direct-fallback-proxy`、`private-ip-answer`、`local-name-mapping`；这些不能作为 Surge 的配置依据。官方 [General](https://manual.nssurge.com/profile/general.html)与[加密 DNS](https://manual.nssurge.com/dns/encrypted-dns.html)列出实际可用字段。

本仓库使用 `[General] dns-server/encrypted-dns-server/encrypted-dns-follow-outbound-mode/hijack-dns` 与 `[Host]` 映射。多个加密服务器并发首答，无普通域名明文超时兜底；也无已确认的失败才转代理开关。

---

## 3. [Proxy] 配置段

代理节点声明格式:
```
# Shadowsocks
节点名 = ss,地址,端口,password=密码,method=aes-256-gcm

# VMess
节点名 = vmess,地址,端口,password=UUID,obfs=websocket,path=/xxx

# VLESS / REALITY / XTLS-Vision 无原生类型；External 程序仅限 Mac

# Trojan
节点名 = trojan,地址,端口,password=密码,peer=xxx.com

# Hysteria2
节点名 = hysteria2,地址,端口,password=密码,download-bandwidth=100
```

---

## 4. [Proxy Group] 策略组配置

### 通用语法
```
组名 = 类型, 成员1, 成员2, ..., 参数键=参数值
```

### 策略组类型

| 类型 | 说明 | Surge 5 支持 | Shadowrocket 支持 |
|------|------|-------------|-------------------|
| `select` | 手动选择 | Yes | Yes |
| `url-test` | 自动选最低延迟 | Yes | Yes |
| `fallback` | 按优先级回退 | Yes | Yes |
| `load-balance` | 负载均衡 | Yes | No |
| `ssid` | 按 WiFi SSID 切换 | Yes | No |

### 通用参数

| 参数 | 类型 | 说明 | Surge | Shadowrocket |
|------|------|------|-------|-------------|
| `policy-regex-filter` | 正则 | 正则过滤节点名 | Yes | Yes |
| `include-all-proxies` | bool | 包含所有代理节点 | Yes（=true/false） | Yes（无值，仅存在即生效） |
| `include-other-group` | 组名 | 包含其他策略组的成员 | Yes | No |
| `policy-path` | URL | 从外部文件加载策略 | Yes | No（SR 用订阅管理） |

### url-test 专用参数

| 参数 | 类型 | 说明 | Surge | Shadowrocket |
|------|------|------|-------|-------------|
| `url` | URL | 测试 URL | Yes | Yes |
| `interval` | 秒 | 测试间隔 | Yes | Yes |
| `timeout` | 秒 | 测试超时 | Yes | Yes |
| `tolerance` | 毫秒 | 切换容忍度（防抖动） | Yes | Yes |
| `persistent` | bool | 保持当前节点直到不可用 | Yes | No |
| `evaluate-before-use` | bool | 使用前先评估 | Yes | No |
| `lazy` | bool | 懒加载评估 | Yes | No |
| `select` | 索引/名称 | 默认选中的节点 | Yes（v5+） | 不支持 |

**重要差异:**
- **Shadowrocket** 的 url-test 组 `policy-regex-filter` 会从所有节点中自动筛选出匹配正则的节点
- **Surge** 的 url-test 组同样支持 `policy-regex-filter`，但需配合 `include-all-proxies=true` 确保从所有节点中筛选
- Surge 的 `include-all-proxies` 使用 `=true`/`=false` 语法；Shadowrocket 仅需存在该参数即可

### select 专用参数

| 参数 | 类型 | 说明 | Surge | Shadowrocket |
|------|------|------|-------|-------------|
| `select` | 索引/名称 | 默认选中的策略 | Yes | Yes |
| `include-all-proxies` | bool | 自动包含所有代理节点 | Yes | Yes |

---

## 5. [Rule] 规则配置

### 通用语法
```
规则类型,参数,策略,附加参数
```

### 支持的规则类型

| 规则类型 | Surge 5 | Shadowrocket | 说明 |
|----------|---------|-------------|------|
| `DOMAIN` | Yes | Yes | 精确域名匹配 |
| `DOMAIN-SUFFIX` | Yes | Yes | 域名后缀匹配 |
| `DOMAIN-KEYWORD` | Yes | Yes | 域名关键字匹配 |
| `DOMAIN-SET` | Yes | **No** | Surge 特有：域名集合文件 |
| `DOMAIN-REGEX` | Yes | 有限支持 | 域名正则匹配 |
| `IP-CIDR` | Yes | Yes | IPv4 CIDR 匹配 |
| `IP-CIDR6` | Yes | Yes | IPv6 CIDR 匹配 |
| `GEOIP` | Yes | Yes | GeoIP 国家码匹配 |
| `DST-PORT` | Yes | Yes | 目标端口匹配 |
| `DST-PORT-RANGE` | Yes | No | 目标端口范围匹配 |
| `SRC-PORT` | Yes | No | 源端口匹配（Surge 4+） |
| `PROCESS-NAME` | Yes | **No**（iOS） | 进程名匹配（仅 macOS） |
| `RULE-SET` | Yes | Yes | 规则集引用 |
| `AND` / `OR` / `NOT` | Yes | 有限支持 | 复合逻辑规则 |
| `FINAL` | Yes | Yes | 兜底规则 |

### RULE-SET 对比

| 特性 | Surge 5 | Shadowrocket |
|------|---------|-------------|
| 远程 URL 规则集 | Yes（直接在配置中引用 URL） | Yes |
| 本地文件规则集 | Yes（相对/绝对路径） | No（必须在 UI 中添加） |
| 规则集缓存 | 自动缓存到本地 | 自动缓存 |
| 格式 | .list / .txt / .conf | .list / .txt |

### 规则附加参数
| 参数 | 说明 | Surge | Shadowrocket |
|------|------|-------|-------------|
| `no-resolve` | IP 规则不触发 DNS 解析 | Yes | Yes |
| `extended-matching` | 启用扩展匹配（DOMAIN-SUFFIX 匹配完整域名） | Yes | No |
| `source` | 源地址匹配（IP-CIDR） | Yes | No |
| `dns-failed` | FINAL 规则在 DNS 解析失败时使用（Shadowrocket 特有） | No | Yes |

### Inline Ruleset（Mac 5.3.1+ 新能力）

自 Surge Mac 5.3.1 起，支持在 profile 内直接嵌入规则集（无需外部文件/URL）：

```
[Ruleset Streaming]
DOMAIN-SUFFIX,netflix.com
DOMAIN-SUFFIX,netflix.net

[Rule]
RULE-SET,Streaming,StreamingProxy
```

本仓库使用远程 RULE-SET URL，不受此新功能影响。

---

## 6. [Host] 本地 DNS 映射

两者语法相同:
```
域名 = IP地址 或 server:system
```

### 注意
- Surge 使用 `server:system` 表示该域名走系统 DNS 解析
- Shadowrocket 同样支持 `server:system`

---

## 7. [URL Rewrite]

两者语法兼容:
```
正则表达式 目标URL 状态码
```

---

## 8. [MITM]

两者语法兼容:
```
hostname = 域名模式
enable = true/false
```

---

## 9. Surge 特有但 Shadowrocket 不支持的特性

1. **DOMAIN-SET** 规则类型 — 直接从本地文件加载域名列表
2. **ssid** 策略组类型 — 按 WiFi SSID 自动切换
3. **load-balance** 策略组类型
4. **SRC-PORT** / **DST-PORT-RANGE** 规则类型
5. **policy-path** 参数 — 从 URL 或文件加载策略组
6. **persistent** / **evaluate-before-use** url-test 参数
7. **外部控制器 (external-controller-access)**
8. DNS 相关独立节说法已撤回；使用 **[General]** / **[Host]**
9. **encrypted-dns-server** + **encrypted-dns-follow-outbound-mode**
10. **geoip-maxmind-url** 直接在配置文件中配置（SR 需要在 UI 中手动设置）

---

## 10. Shadowrocket 特有但 Surge 不支持的特性

1. **dns-direct-fallback-proxy** — 未找到 Surge 官方等价开关，不能写入不存在的 [DNS] 节
2. **private-ip-answer** — 仅 Shadowrocket 支持
3. **allow-dns-svcb** — 允许 DNS SVCB 查询
4. **compatibility-mode** — 网络兼容模式（TUN Only 等）
5. **dns-failed** 参数在 FINAL 规则上
6. **url rewrite** 的 `reject-200` 和 `reject-json` 动作
7. **Script** 功能（Surge 也有但语法不同，使用 JS/模块化体系）

---

> 本文档基于 Surge 官方手册 (https://manual.nssurge.com/) 和 iOS/macOS Surge App 实际行为编写。
> 由于 WebFetch 权限限制，本文档基于作者对官方文档的已有知识整理。
