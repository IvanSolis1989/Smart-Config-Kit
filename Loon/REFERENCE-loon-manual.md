# Loon 配置参考文档

> 来源 URL:
> - https://github.com/Loon0x00/LoonManual (GitHub 官方手册仓库)
> - https://nsloon.uk/tutorial/ (Loon 官方教程网站)
> - https://deepwiki.com/blackmatrix7/ios_rule_script/7.2-platform-specific-configuration (社区参考)
> 获取日期: 2026-04-26

---

## 一、配置整体结构

Loon 支持两种配置格式：
1. **Surge 兼容文本格式**（本仓库使用）：`段名 = 值` 形式，以 `[Section]` 分节
2. **YAML 格式**：App UI 内原生使用

标准节段（顺序固定）：

```
[General]        → 全局设置
[Proxy]          → 本地节点定义
[Remote Filter]  → 节点过滤规则（Loon 特有）
[Proxy Group]    → 策略组
[Remote Rule]    → 远程规则集订阅
[Rule]           → 本地规则
[Host]           → 本地 DNS 映射
[URL Rewrite]    → URL 重写
[MITM]           → HTTPS 中间人解密
[Script]         → 脚本
```

---

## 二、[General] 段字段

| 字段 | 值格式 | 说明 | 来源 |
|------|--------|------|------|
| `bypass-tun` | `IP/CIDR,域名,*.通配符` | TUN 模式旁路流量（私有网段等） | general.md |
| `skip-proxy` | `IP/CIDR,域名` | HTTP 代理模式跳过 | general.md |
| `dns-server` | `system,IP,IP,...` | DNS 服务器，`system` 表示系统 DNS | general.md |
| `doh-server` | `https://URL,https://URL,...` | DoH 服务器，逗号分隔多组 | general.md |
| `doh3-server` | `h3://IP/dns-query` | HTTP/3 DoH | general.md |
| `doq-server` | `quic://域名:784` | DNS-over-QUIC | general.md |
| `ipv6` | `true` / `false` | 启用 IPv6 DNS 查询 | general.md |
| `allow-wifi-access` | `true` / `false` | 允许局域网代理访问 | general.md |
| `wifi-access-http-port` | 端口号 | HTTP 代理端口 | general.md |
| `wifi-access-socks5-port` | 端口号 | SOCKS5 端口 | general.md |
| `proxy-test-url` | URL | 代理延迟测试 URL | general.md |
| `internet-test-url` | URL | 网络连通性测试 URL | general.md |
| `test-timeout` | 秒数 | 节点测试超时 | general.md |
| `switch-node-after-failure-times` | 次数 | 连续失败切换次数 | general.md |
| `resource-parser` | URL | 订阅解析器 | general.md |
| `ssid-trigger` | `"SSID":MODE,...` | SSID 触发模式切换 | general.md |
| `real-ip` | `域名,*.通配符` | 真实 IP 域名列表 | general.md |
| `interface-mode` | `Auto`/`Cellular`/`Performance`/`Balance` | 网络接口模式 | general.md |
| `force-http-engine-hosts` | `域名,:端口` | 强制 HTTP 引擎 | general.md |
| `disable-udp-ports` | `端口,端口,...` | 禁用 UDP 的端口 | general.md |
| `disable-stun` | `true` / `false` | 禁用 STUN 防 WebRTC 泄漏 | general.md |
| `geoip-url` | URL | GeoIP MMDB 数据库下载 URL | general.md |

### 注意点

- **`dns-server`**：仅接受 `system` 关键字与纯 IP 地址，不支持 DoH URL
- **`doh-server`**：仅接受标准 HTTPS URL 格式
- **`ipv6`**：字段名是 `ipv6`（不是 `ipv6-enabled` 或 `ipv6-enable`）
- **`geoip-url`**：用于自动更新 GeoIP 数据库；Loon 同时内置 MaxMind GeoLite2

---

## 三、[Proxy] 段 — 本地节点定义

格式（Surge 兼容）：

```
节点名=协议,地址,端口,password=密码,method=加密方式,...
```

支持协议：`ss`、`ssr`、`vmess`、`vless`、`trojan`、`hysteria2`、`http`、`socks5`

协议参数因协议而异。

---

## 四、[Remote Filter] — 节点过滤（Loon 特有）

### 语法

```
Filter名称 = NameRegex, FilterKey = "(?i)正则表达式"
```

### 说明

- **`NameRegex`**：根据节点名（tag/name）正则匹配过滤
- **`FilterKey`**：正则表达式，匹配节点名的子串
- **`(?i)`**：大小写不敏感标志
- 多个关键词用 `|` 分隔（OR 逻辑）
- 排除特定关键词：`^((?!(排除词1|排除词2)).)*$`

### 不支持

- Loon 不支持 Surge 的 `policy-regex-filter=` 内联参数
- Loon 的 Filter 只能在 [Remote Filter] 段定义，在 [Proxy Group] 中按名引用

### 引用方式

在 [Proxy Group] 的 url-test 组中，Filter 名称作为第一个参数：

```
组名 = url-test,Filter名,url=...,interval=...,tolerance=...
```

### 来源

- https://nsloon.uk/tutorial/advanced_EN/remote_filter_en.html (页面 hash: CrRC6t-O)
- https://nsloon.uk/tutorial/advanced/regex.html (正则语法)

---

## 五、[Proxy Group] — 策略组

### 5.1 `select` — 手动选择

语法：
```
组名 = select,候选1,候选2,..., DIRECT, REJECT
```

- 用户手动在 App UI 中选择
- 候选可以是具体节点、组名或内置策略
- 只有 `select` 类型可以直接从"订阅节点"列表中选择

### 5.2 `url-test` — 自动延迟测试

语法：
```
组名 = url-test,Filter名或节点列表,url=测试URL,interval=秒数,tolerance=毫秒
```

参数：
- **`url`**：延迟测试 URL（默认 `http://www.gstatic.com/generate_204`）
- **`interval`**：测试间隔秒数（默认 600）
- **`tolerance`**：切换容差毫秒数（默认 100；新节点必须比当前快超过此值才切换）

限制：
- **不支持**嵌套其他策略组（只能包含节点或 Filter 引用）
- **不支持**使用 `timeout=/select=/policy-regex-filter=` 参数
- 不建议直接从订阅节点列表引用（通过 [Remote Filter] 过滤后引用）

### 5.3 `fallback` — 故障转移

语法：
```
组名 = fallback,节点1,节点2,...
```

- 按顺序选择第一个可用节点
- **不支持**嵌套策略组
- 只能包含直接节点

### 5.4 `load-balance` — 负载均衡

语法：
```
组名 = load-balance,节点1,节点2,...
```

- 同一 hostname 的请求锁定同一节点

### 5.5 `ssid` — SSID 策略组

策略组根据连接的 WiFi SSID 选择不同出口。

### 注意

- url-test / fallback / load-balance 类型的组**必须**作为 select 组的子组使用（嵌套架构）
- 所有策略组名必须与 [Rule] 中引用的组名完全一致（含 emoji）

### 来源

- https://nsloon.uk/tutorial/advanced_EN/Remote_Proxy_in_Proxy_Group_EN.html
- https://github.com/chiupam/tutorial/blob/master/Loon/Plus/URL-Test_EN.md
- https://nsloon.uk/tutorial/advanced/Fallback.html

---

## 六、[Rule] — 本地规则

### 语法

```
规则类型,参数,策略组[,可选标志]
```

### 规则类型

| 类型 | 格式 | 说明 |
|------|------|------|
| `DOMAIN` | `DOMAIN,example.com,policy` | 精确域名匹配 |
| `DOMAIN-SUFFIX` | `DOMAIN-SUFFIX,example.com,policy` | 域名后缀匹配（含子域名） |
| `DOMAIN-KEYWORD` | `DOMAIN-KEYWORD,keyword,policy` | 域名关键词匹配 |
| `IP-CIDR` | `IP-CIDR,ip/mask,policy,no-resolve` | IPv4 段匹配；也接受 IPv6 地址 |
| `IP-CIDR6` | （可能不存在） | Loon 可能用 IP-CIDR 统一处理 |
| `DEST-PORT` | `DEST-PORT,port,policy` | 目标端口匹配（**非** DST-PORT） |
| `SRC-PORT` | `SRC-PORT,port,policy` | 源端口匹配 |
| `GEOIP` | `GEOIP,CC,policy,no-resolve` | 国家码 GEOIP 匹配 |
| `RULE-SET` | 不在 [Rule] 段使用 | 在 [Remote Rule] 段声明 |
| `FINAL` | `FINAL,policy` | 兜底规则（必须最后一条） |

### 可选标志

- `no-resolve`：阻止对 IP 规则进行 DNS 解析（用于 IP-CIDR / GEOIP）

### 规则匹配优先级

1. 域名类规则（DOMAIN / DOMAIN-SUFFIX / DOMAIN-KEYWORD）在域名请求时优先于 IP 类规则
2. 同类型规则按文件顺序从上到下匹配
3. 优先级：本地规则 > 订阅规则 > 插件规则
4. 无匹配 -> FINAL

### 注意

- Loon 3.0.3+ 域名请求处理流程：先匹配域名类规则 -> 无匹配则本地 DNS 解析 -> 匹配 IP 类规则
- **DEST-PORT 与 DST-PORT 差异**：Loon 官方文档使用 `DEST-PORT` 作为端口规则名（来源：nsloon.app/docs/Rule/port_rule/），与 Surge/Shadowrocket 的 `DST-PORT` 不同
- IPv6 地址：Loon 可能不支持独立的 IP-CIDR6 类型，IPv6 地址走 IP-CIDR

### 来源

- https://nsloon.uk/tutorial/advanced_EN/rule_en.html (页面 hash: BdKSxNl4)
- LoonManual/docs/cn/rule.md (优先级说明)

---

## 七、[Remote Rule] — 远程规则集

### 语法

```
URL, policy=策略组, tag=标签名, enabled=true
```

### 说明

- 每行一个远程规则集 URL
- **`policy=`** 参数指定该规则集匹配后使用的策略组
- **`tag=`** 在 UI 中显示的名称
- **`enabled=true/false`** 是否启用
- Loon 自动管理远程规则集的更新（无 `update-interval` 参数）
- **不支持** Surge 风格的 `RULE-SET,URL,policy`（放在 [Rule] 段会报错）

### 与 [Rule] 的关系

- [Remote Rule] 和 [Rule] 一起参与路由决策
- [Rule] 优先级高于 [Remote Rule]
- 规则集内部顺序按文件行号

### 来源

- https://nsloon.uk/tutorial/advanced_EN/remote_rule_en.html (页面 hash: BM-Wv5lJ)

---

## 八、[Host] — 本地 DNS 映射

### 语法

```
域名 = IP
域名 = server:system
```

### 说明

- `域名 = IP`：将域名映射到固定 IP 地址
- `域名 = server:system`：指定域名走系统 DNS 解析

### 注意

- Loon 中 [Host] 段的兼容性可能取决于 App 版本
- 更推荐使用 [General] 段的 `real-ip` 参数控制域名走系统 DNS
- 该段在 Loon 官方教程中未重点文档化

---

## 九、[URL Rewrite] — URL 重写

语法：
```
^正则表达式 目标URL 状态码
```

（302 跳转）

---

## 十、GEOIP / MMDB 配置

- Loon 支持 `[General]` 段中的 `geoip-url` 参数指定自定义 GeoIP 数据库 URL
- 若不指定，使用内置 MaxMind GeoLite2
- 推荐使用 Loyalsoldier 加强版：`https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb`
- 该增强版包含 `cloudflare`/`telegram`/`netflix`/`google` 等标签

---

## 十一、已知差异总结

| 对比项 | Loon | Surge | Shadowrocket |
|--------|------|-------|-------------|
| Filter 机制 | [Remote Filter] + NameRegex | `policy-regex-filter=` 内联 | 无 |
| 远程规则段 | [Remote Rule] `URL, policy=组, tag=, enabled=` | [Rule] `RULE-SET,URL,policy` | [Rule] `RULE-SET,URL,policy` |
| 端口规则名 | `DEST-PORT` | `DST-PORT` | `DST-PORT` |
| IP-CIDR6 | 可能无独立类型 | 有 `IP-CIDR6` | 有 `IP-CIDR6` |
| GeoIP URL | `geoip-url` = URL | `geoip-url` = URL | 不支持（需手动设置） |
| FINAL | `FINAL,policy` | `FINAL,policy` | `FINAL,policy,dns-failed` |
| url-test 嵌套 | 不支持嵌套组 | 支持嵌套组 | 支持嵌套组 |
