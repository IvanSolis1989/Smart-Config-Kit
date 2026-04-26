# Mihomo (MetaCubeX) 官方配置文档参考

> 抓取自 https://wiki.metacubex.one/ (2026-04-26)
> 本文件为本地参考，用于审核本仓库各配置文件与官方文档的兼容性。

---

## 1. 代理组配置 (proxy-groups)

**文档源**: https://wiki.metacubex.one/config/proxy-groups/

### 通用字段 (Common Options)

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 代理组名称；含特殊字符需加引号 |
| `type` | string | 是 | 代理组类型（见下方 `type` 有效值） |
| `proxies` | list | 否 | 引用出站代理或其他代理组 |
| `use` | list | 否 | 引用代理集合 (proxy-providers) |
| `url` | string | 否 | 测试地址；仅对 `proxies` 字段中的节点进行测试 |
| `interval` | int | 否 | 测试间隔（秒） |
| `lazy` | bool | 否 | 默认 true；当前组未被选择时不测试 |
| `timeout` | int | 否 | 测试超时（毫秒） |
| `max-failed-times` | int | 否 | 最大失败次数，默认 5 |
| `disable-udp` | bool | 否 | 禁用 UDP |
| `interface-name` | string | 否 | **已废弃**，请使用节点级别配置 |
| `routing-mark` | int | 否 | **已废弃**，请使用节点级别配置 |
| `include-all` | bool | 否 | 包含所有出站代理和代理集合（不含其他组） |
| `include-all-proxies` | bool | 否 | 包含所有出站代理（不含其他组） |
| `include-all-providers` | bool | 否 | 包含所有代理集合（会使 `use` 失效） |
| `filter` | string | 否 | 正则包含筛选；可用 `` ` `` 分隔多个；仅对 `use` 和 `include-all-*` 生效 |
| `exclude-filter` | string | 否 | 正则排除筛选；可用 `` ` `` 分隔多个 |
| `exclude-type` | string | 否 | 按类型排除（`|` 分隔）；不支持正则 |
| `expected-status` | string | 否 | 期望 HTTP 状态码；`/` 匹配多个，`-` 匹配范围 |
| `hidden` | bool | 否 | 在 API 中隐藏 |
| `icon` | string | 否 | 图标 URL |

### `type` 有效值

| 值 | 说明 |
|----|------|
| `select` | 手动选择 |
| `url-test` | 自动测试延迟，选最低延迟节点 |
| `fallback` | 按优先级选第一个可用节点 |
| `load-balance` | 轮询负载均衡 |
| `relay` | 中继链 |
| `smart` | AI 智能选择（Smart 内核 v1.18.0+） |

### Smart 类型特有字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `uselightgbm` | bool/string | 是否使用 LightGBM 模型预测权重；`false` 或 `smart` |
| `collectdata` | bool | 是否收集数据用于模型训练 |
| `strategy` | string | 选择策略：`sticky-sessions`（默认，基于哈希）或 `round-robin` |
| `policy-priority` | string | 手动分配权重：`"Premium:0.9;SG:1.3"` |
| `tolerance` | int | 延迟容差（毫秒），避免频繁切换 |

### `filter` 字段语法

- 使用 Go RE2 正则语法
- 多个正则用反引号 `` ` `` 分隔
- 是**子串匹配**（非 word boundary）
- 例：`TW` 会匹配 `TWN`、`TW01` 等
- 例：`(?i)港|hk|hongkong|hong kong`

### YAML 锚点/别名支持

- mihomo 使用 `gopkg.in/yaml.v3`，**支持** YAML 锚点 (`&anchor`) 和别名 (`*anchor`)
- 支持 map merging (`<<:`)
- 官方通过 `rule-anchor` 字段提供模板化支持

---

## 2. 代理集合配置 (proxy-providers)

**文档源**: https://wiki.metacubex.one/config/proxy-providers/

### 字段说明

| 字段 | 说明 |
|------|------|
| `type` | 必需：`http` / `file` / `inline` |
| `url` | type 为 `http` 时必需 |
| `path` | 文件路径，必须唯一；不填则使用 URL MD5 作为文件名 |
| `interval` | 更新间隔（秒） |
| `proxy` | 通过指定代理下载/更新 |
| `size-limit` | 最大下载大小限制（字节），0 为不限制 |
| `header` | 自定义 HTTP 请求头 |
| `health-check` | 延迟测试配置 |
| `override` | 覆盖节点内容（additional-prefix, additional-suffix, proxy-name 等） |
| `filter` | 正则包含筛选节点；可用 `` ` `` 分隔多个 |
| `exclude-filter` | 正则排除筛选节点；可用 `` ` `` 分隔多个 |
| `exclude-type` | 按类型排除（`|` 分隔，不支持正则） |
| `payload` | type 为 `inline` 时生效；也可作为 http/file 解析失败的备用 |

### health-check 子字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `enable` | bool | 是否启用 |
| `url` | string | 测试地址，推荐 `https://cp.cloudflare.com` 或 `https://www.gstatic.com/generate_204` |
| `interval` | int | 测试间隔（秒） |
| `timeout` | int | 测试超时（毫秒） |
| `lazy` | bool | 默认 true；当前节点未被使用时不做测试 |
| `expected-status` | string | 期望状态码 |

---

## 3. 规则集合配置 (rule-providers)

**文档源**: https://wiki.metacubex.one/config/rule-providers/

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | 必需：`http` / `file` / `inline` |
| `url` | string | type 为 `http` 时必需 |
| `path` | string | 可选，文件路径；不填则使用 URL MD5 作为文件名 |
| `interval` | int | 更新间隔（秒） |
| `proxy` | string | 通过指定代理下载/更新 |
| `behavior` | string | `domain` / `ipcidr` / `classical` |
| `format` | string | `yaml`（默认）/ `text` / `mrs` |
| `size-limit` | int | 最大下载大小（字节），0 为不限制 |
| `header` | object | 自定义 HTTP 请求头 |
| `payload` | list | type 为 `inline` 时有效 |

### behavior 说明

| 值 | 说明 |
|----|------|
| `domain` | 域名规则文件 |
| `ipcidr` | IP/CIDR 规则文件 |
| `classical` | 经典 Clash 规则格式（含 `DOMAIN-`/`DOMAIN-SUFFIX`/`IP-CIDR` 等类型前缀） |

### format 说明

| 值 | 说明 |
|----|------|
| `yaml` | YAML 格式（默认） |
| `text` | 文本格式（一行一条规则） |
| `mrs` | 二进制规则集格式；behavior 只能为 `domain` / `ipcidr` |

### RULE-SET 引用语法

```yaml
rules:
  - RULE-SET,google,🤖 AI 服务
  - RULE-SET,tiktok,📱 社交媒体
  - MATCH,🐟 漏网之鱼
```

---

## 4. DNS 配置

**文档源**: https://wiki.metacubex.one/config/dns/

### 字段说明

| 字段 | 说明 |
|------|------|
| `enable` | 是否启用 |
| `cache-algorithm` | 缓存算法：`lru`（默认）/ `arc` |
| `prefer-h3` | DOH 优先使用 HTTP/3 |
| `listen` | DNS 服务监听地址 |
| `ipv6` | 是否解析 IPv6 |
| `enhanced-mode` | `fake-ip` / `redir-host`（默认） |
| `fake-ip-range` | fakeip 地址范围，默认 `198.18.0.1/16` |
| `fake-ip-range6` | IPv6 fakeip 范围 |
| `fake-ip-filter` | fakeip 过滤；支持域名通配符和导入域名集 |
| `fake-ip-filter-mode` | `blacklist`（默认）/ `whitelist` / `rule` |
| `fake-ip-ttl` | fakeip 查询返回的 TTL |
| `use-hosts` | 是否响应配置的 hosts，默认 true |
| `use-system-hosts` | 是否查询系统 hosts，默认 true |
| `respect-rules` | DNS 连接遵守路由规则；需配置 `proxy-server-nameserver` |
| `default-nameserver` | 默认 DNS，必须为 IP，不能为域名 |
| `nameserver-policy` | 特定域名使用特定 DNS 服务器；key 支持域名通配符和 geosite |
| `nameserver` | 默认域名解析服务器 |
| `fallback` | 备用域名解析服务器 |
| `proxy-server-nameserver` | 代理节点域名解析服务器 |
| `proxy-server-nameserver-policy` | 节点域名解析策略 |
| `direct-nameserver` | 直连出口的 DNS 服务器 |
| `direct-nameserver-follow-policy` | 是否遵守 nameserver-policy |
| `fallback-filter` | 备用 DNS 过滤器；含 `geoip` / `geoip-code` / `geosite` / `ipcidr` / `domain` |

### fake-ip-filter-mode: rule 模式

当 `fake-ip-filter-mode` 设为 `rule` 时，`fake-ip-filter` 语法变更：

```yaml
dns:
  fake-ip-filter-mode: rule
  fake-ip-filter:
    - RULE-SET,reject-domain,fake-ip
    - RULE-SET,proxy-domain,fake-ip
    - GEOSITE,gfw,fake-ip
    - DOMAIN,www.baidu.com,real-ip
    - DOMAIN-SUFFIX,qq.com,real-ip
    - DOMAIN-SUFFIX,jd.com,fake-ip
    - MATCH,fake-ip
```

### DNS 附加参数

DNS 服务器地址后可附加参数（用 `#` 添加，`&` 连接）：

- `proxy` — 通过指定代理连接
- `interface` — 通过指定接口连接
- `h3` — 强制 HTTP/3
- `skip-cert-verify` — 跳过 TLS 证书验证
- `ecs` — 指定 EDNS Client Subnet
- `ecs-override` — 强制覆盖 ECS
- `disable-ipv4` / `disable-ipv6`
- `disable-qtype-<int>`

---

## 5. Sniffer 配置

**文档源**: https://deepwiki.com/muink/mihomo/4.4-process-detection

### 顶层字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `enable` | bool | 主开关 |
| `sniffing` | list | 要嗅探的协议：`tls` / `http` / `quic` |
| `force-domain` | list | 始终触发嗅探的域名 |
| `skip-domain` | list | 跳过嗅探的域名 |
| `skip-src-address` | list | 排除的源 IP |
| `skip-dst-address` | list | 排除的目标 IP |
| `port-whitelist` | list | 启用嗅探的端口范围 |
| `force-dns-mapping` | bool | 在 FakeIP/DNSMapping 模式下嗅探连接 |
| `parse-pure-ip` | bool | 嗅探无主机名的连接（纯 IP） |

### 协议嗅探器配置

每个协议（TLS / HTTP / QUIC）支持：

| 字段 | 类型 | 说明 |
|------|------|------|
| `override-destination` | bool | 用嗅探到的域名替换 metadata.Host，清除原 DstIP |
| `ports` | list | 端口范围 |

### 配置示例

```yaml
sniffer:
  enable: true
  sniffing:
    - tls:
        override-destination: true
        ports: [443, 8443]
    - http:
        override-destination: true
        ports: [80, 8080]
    - quic:
        override-destination: true
        ports: [443, 8443]
  force-domain:
    - '*.example.com'
  skip-domain:
    - '*.apple.com'
  port-whitelist:
    - 443
    - 80
  force-dns-mapping: true
  parse-pure-ip: false
```

---

## 6. Smart 内核特有功能

### type: smart

- 引入版本: MetaCubeX/mihomo v1.18.0+
- 使用 AI 模型选择最优节点
- 支持 `uselightgbm` 启用 LightGBM 梯度提升模型进行动态权重预测
- 支持 `collectdata` 收集性能数据用于模型训练
- 支持 `strategy`: `sticky-sessions` / `round-robin`
- 支持 `policy-priority`: 手动分配优先级权重

### 与常规 `type: url-test` 的区别

| 特性 | `url-test` | `smart` |
|------|-----------|---------|
| 选择逻辑 | 当前最低延迟 | AI 历史预测 |
| 触发方式 | 定时测试 | 自适应 |
| 适用场景 | 节点质量差异大 | 多不稳定节点 |
| 自学习 | 否 | 是 |
| LightGBM | 不支持 | 支持 (`uselightgbm`) |

---

## 7. 跨版本兼容性注意事项

1. **Go RE2 正则**: filter 字段使用 Go RE2（不支持 backreference 和 lookahead）
2. **子串匹配**: mihomo 的 `filter` 是子串匹配，`TW` 会匹配 `TWN`
3. **YAML 锚点**: mihomo 基于 `gopkg.in/yaml.v3`，完全支持 YAML 1.2 锚点和别名
4. **`MATCH` vs `FINAL`**: Clash/mihomo 使用 `MATCH`，Shadowrocket/Surge 使用 `FINAL`
5. **GEOIP/GEOSITE**: 需要 `geodata-mode: true` 在 general 中配置
6. **`interface-name`/`routing-mark` 在 proxy-groups 级别已废弃**: 应使用节点级别配置
7. **`respect-rules`**: 需配合 `proxy-server-nameserver` 使用，且不建议与 `prefer-h3` 共用
8. **`include-all-providers`**: 会使 `use` 字段失效

---

*最后更新: 2026-04-26*
*源文档: https://wiki.metacubex.one/config/*
