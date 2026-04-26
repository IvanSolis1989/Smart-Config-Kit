# Quantumult X 配置参考文档

> 来源 URL:
> - https://github.com/crossutility/Quantumult-X (官方 GitHub 仓库 — 文档较少)
> - https://qx.atlucky.me/ (社区权威 Wiki，页面 hash 认证)
> - https://blackmatrix7.github.io/ios_rule_script/7.2-platform-specific-configuration (社区参考)
> - 获取日期: 2026-04-26

---

## 一、配置整体结构

Quantumult X 使用自己独有的 `.conf` 配置格式，与 Surge/Shadowrocket/Loon **不完全兼容**。

所有节段名**必须小写**（与 Surge 风格不同）：

```
[general]          → 全局设置
[dns]              → DNS 配置
[policy]           → 策略组（策略 + 节点筛选）
[server_local]     → 本地节点
[server_remote]    → 远程节点（订阅）
[filter_remote]    → 远程规则订阅
[filter_local]     → 本地规则
[rewrite_local]    → 本地重写
[rewrite_remote]   → 远程重写
[task_local]       → 本地定时任务
[mitm]             → HTTPS 中间人解密
```

### 关键差异（与 Surge/Clash 对比）

| 对比项 | Quantumult X | Surge | Shadowrocket |
|--------|-------------|-------|-------------|
| 节段名 | 小写 `[general]` | 大写 `[General]` | 大写 `[General]` |
| 策略组 | `[policy]` 段 | `[Proxy Group]` 段 | `[Proxy Group]` 段 |
| 节点订阅 | `[server_remote]` | `[Proxy]` + 订阅管理 | `[Proxy]` + 订阅管理 |
| 规则 | `[filter_remote]` + `[filter_local]` | `[Rule]` | `[Rule]` |
| 节点筛选 | `server-tag-regex=` 参数 | `policy-regex-filter=` 参数 | `policy-regex-filter=` 参数 |
| 筛选位置 | 直接在 policy 行内 | url-test 行内参数 | url-test 行内参数 |

---

## 二、[general] 段字段

| 字段 | 值格式 | 说明 |
|------|--------|------|
| `server_check_url` | URL | 节点延迟测试 URL |
| `resource_parser_url` | URL | 订阅解析器（推荐 KOP-XIAO 版） |
| `geo_location_checker` | URL | GeoIP 位置检测 |
| `running_mode_trigger` | auto, auto, auto | 模式触发（SSID 自动切换） |
| `ssid_suspended_list` | 字符串列表 | 挂起代理的 SSID |
| `dns_exclusion_list` | 域名列表 | DNS 排除列表（不走代理解析） |
| `network_check_url` | URL | 网络连通性测试 |
| `fallback_udp_policy` | reject / none | UDP 回退策略 |

### 注意点

- **节段名必须小写**：`[general]` 不是 `[General]`
- **`running_mode_trigger`**：三个值分别对应 WiFi/蜂窝/其他
- **`dns_exclusion_list`**：匹配的域名走系统 DNS 而非代理 DNS
- **`fallback_udp_policy`**：对应 Surge 的 `udp-fallback-mode`（拼写和取值不同）

---

## 三、[dns] 段 — DNS 配置

### 语法

```
server=IP
server=/域名/IP
doh-server=https://URL
```

### 说明

- **`server=`**：接受纯 IP、`IP:port`、`/域名/IP`（按域名区分 DNS）
- **`doh-server=`**：DoH URL（多个条目，但 QX **只使用第一条**，后续被忽略）
- **`no-ipv6`**：禁用 IPv6 DNS 查询
- **`system` 关键字**：在 `server=/域名/system` 中有效，表示该域名走系统 DNS

### 注意

- QX 的 `server=` **不接受 DoH URL**（那是 Surge 的语法）
- 多个 `doh-server=` 条目中，**只有第一个生效**
- `system` 关键字作为 IP 值使用：`server=/example.com/system`

---

## 四、[policy] 段 — 策略组

### 4.1 `static` — 手动选择

语法：
```
static=策略组名, 候选1, 候选2, ..., img-url=图标URL
```

- 用户手动选择
- 候选可以是区域策略组名、DIRECT、REJECT
- **不支持**在 static 组内直接引用节点（只能引用其他 policy 组）
- 实际节点通过 `server-tag-regex` 在 url-latency-benchmark 组中筛选

### 4.2 `url-latency-benchmark` — 自动延迟测试（按需）

语法：
```
url-latency-benchmark=组名, server-tag-regex=正则, check-interval=秒, tolerance=毫秒, alive-checker-enabled=true, img-url=URL
```

参数：
- **`server-tag-regex`**：按节点 tag 字段正则匹配（核心筛选机制）
- **`check-interval`**：测试间隔秒数（默认 1800）
- **`tolerance`**：切换容差毫秒数
- **`alive-checker-enabled`**：启用存活检测（注：文档中可能为 `alive-checking`，需确认）
- **`img-url`**：图标 URL

### 4.3 `available` — 故障转移

语法类似 url-latency-benchmark，按顺序选择第一个可用节点。

### 4.4 其他类型

- `round-robin`：轮询
- `ssid`：SSID 策略
- `dest-hash`：目标哈希

### 关键限制

- **QX 不支持**策略组嵌套 url-test/select → 无法实现 Clash 的「业务组 → 区域组 → 节点」三级结构
- **QX 的 `static` 组只能包含其他 policy 组/DIRECT/REJECT，不能包含具体节点**
- 节点筛选完全由 `server-tag-regex` 在 url-latency-benchmark 组中完成

---

## 五、[server_remote] — 远程节点订阅

语法：
```
URL, tag=标签, update-interval=秒, opt-parser=true/false, enabled=true/false
```

说明：
- 每行一个订阅 URL
- **`tag=`**：订阅在 UI 中的名称
- **`update-interval=`**：更新间隔
- **`opt-parser=true`**：启用资源解析器（配合 `resource_parser_url`）

---

## 六、[filter_remote] — 远程规则订阅

语法：
```
URL, tag=标签, force-policy=策略组, update-interval=秒, opt-parser=true/false, enabled=true/false
```

说明：
- 每行一个远程规则集 URL
- **`tag=`**：规则集在 UI 中的名称
- **`force-policy=`**：该规则集匹配后使用的策略组（等价于 Clash 的 policy 参数）
- **`update-interval=`**：更新间隔（等价于 Surge 的 `update-interval`）
- **`opt-parser=true`**：启用资源解析器

### 注意

- QX 的 filter_remote 使用 `force-policy=` 参数，而非 Surge 的 `RULE-SET,URL,policy` 语法
- 规则按文件顺序依次匹配，`force-policy` 决定命中的策略组

---

## 七、[filter_local] — 本地规则

### 支持的规则类型

| 类型 | 格式 | 说明 |
|------|------|------|
| `host` | `host, example.com, policy` | 精确域名匹配 |
| `host-suffix` | `host-suffix, example.com, policy` | 域名后缀匹配 |
| `host-keyword` | `host-keyword, keyword, policy` | 域名关键词匹配 |
| `ip-cidr` | `ip-cidr, ip/mask, policy, no-resolve` | IP 段匹配 |
| `ip6-cidr` | `ip6-cidr, ip/mask, policy, no-resolve` | IPv6 段匹配 |
| `geoip` | `geoip, CC, policy, no-resolve` | 国家码 GEOIP |
| `dst-port` | `dst-port, port, policy` | 目标端口匹配 |
| `src-port` | `src-port, port, policy` | 源端口匹配 |
| `final` | `final, policy` | 兜底规则 |

### 注意

- QX 规则类型**全部小写**（如 `host-suffix` 不是 `DOMAIN-SUFFIX`）
- `no-resolve` 标志阻止对 IP 规则进行 DNS 解析
- `final` 必须在规则列表的最后一条
- QX 不支持 Surge 的 `RULE-SET,URL,policy` 内联语法；远程规则必须在 `[filter_remote]` 段声明

---

## 八、GEOIP 支持

- QX 原生支持 `geoip, CC, policy, no-resolve` 格式
- 支持 Loyalsoldier 加强版 MMDB 的增强标签（cloudflare/telegram/netflix/google 等）
- 自定义 MMDB 可通过 `[general]` 段的 `resource_parser_url` 间接配置，或在系统设置中手动替换

---

## 九、已知差异总结

| 对比项 | Quantumult X | Surge | Shadowrocket |
|--------|-------------|-------|-------------|
| 节段名大小写 | 小写 | 大小写敏感（首字母大写） | 大小写敏感（首字母大写） |
| 节点筛选 | `server-tag-regex=` | `policy-regex-filter=` | `policy-regex-filter=` |
| 策略组嵌套 | **不支持**（仅 static + url-latency-benchmark） | 支持嵌套 | 支持嵌套 |
| 远程规则语法 | `[filter_remote]` tag=/force-policy= | `[Rule] RULE-SET,URL,policy` | `[Rule] RULE-SET,URL,policy` |
| 本地规则类型 | 小写 `host`/`host-suffix`/`ip-cidr` | 大写 `DOMAIN`/`DOMAIN-SUFFIX`/`IP-CIDR` | 大写 `DOMAIN`/`DOMAIN-SUFFIX`/`IP-CIDR` |
| 端口规则名 | `dst-port` | `DST-PORT` | `DST-PORT` |
| IPv6 CIDR | 支持 `ip6-cidr` 独立类型 | 可能 `IP-CIDR` 统一处理（Loon） | 有 `IP-CIDR6` |
| DNS server | `server=IP` + `doh-server=URL` | `dns-server=IP,system` + `doh-server=URL` | `dns-server=IP,system` |
| doh-server 多条目 | **仅第一条生效** | 全部生效 | 全部生效 |
| 最终兜底 | `final, policy` | `FINAL,policy` | `FINAL,policy,dns-failed` |
| alive-checker | `alive-checker-enabled=true`（需确认字段名） | 无 | 无 |
