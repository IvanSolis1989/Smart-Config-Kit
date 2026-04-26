# Xray (v2rayN) 配置参考文档

> 来源 URL：
> - https://xtls.github.io/config/routing.html (路由配置)
> - https://xtls.github.io/config/dns.html (DNS 配置)
> - https://xtls.github.io/config/outbound.html (出站配置)
>
> 获取日期：2026-04-26

---

## 1. v2rayN 路由格式

v2rayN 使用 JSON 数组格式的「路由规则」配置，每个数组项代表一条规则：

```json
[
  {
    "id": "scki-000-meta",
    "enabled": false,
    "remarks": "规则备注/说明",
    "outboundTag": "proxy|direct|block",
    "domain": [],
    "ip": [],
    "port": "",
    "protocol": [],
    "inboundTag": [],
    "network": "tcp,udp"
  }
]
```

**注意：** v2rayN 只支持 `proxy`、`direct`、`block` 三个出站标签。没有复杂策略组。

---

## 2. 路由规则字段

### 2.1 domain (域名匹配)

`domain` 是一个字符串数组，支持以下前缀格式：

| 前缀 | 示例 | 说明 |
|------|------|------|
| (无前缀) | `"sina.com"` | **关键字匹配** (等同于 `keyword:`)。只要域名中包含此字符串即匹配 |
| `domain:` | `"domain:xray.com"` | **子域名匹配**。匹配 `xray.com` 和 `*.xray.com` |
| `full:` | `"full:xray.com"` | **完整匹配**。仅当域名完全相等时匹配 |
| `regexp:` | `"regexp:\\.goo.*\\.com$"` | **正则匹配**。大小写敏感 |
| `keyword:` | `"keyword:sina.com"` | **关键字匹配**。域名中包含此字符串即匹配 |
| `geosite:` | `"geosite:cn"` | **预定义域名列表**。引用 geosite.dat 中的分类 |
| `ext:` | `"ext:file:tag"` | **外部文件**。从资源目录加载 |
| `dotless:` | `"dotless:pc-"` | **无点域名**。匹配不含 `.` 的域名 |

**特别注意：**
- 没有前缀的纯字符串会被当作 `keyword:`（关键字匹配），这可能导致比预期更宽泛的匹配
- `geosite:private` 包含私有域名
- 大小写敏感

### 2.2 ip (IP 匹配)

```json
"ip": ["geoip:cn", "10.0.0.0/8", "127.0.0.1"]
```

| 格式 | 示例 | 说明 |
|------|------|------|
| `geoip:xx` | `"geoip:cn"` | 预定义 IP 列表 (国家代码) |
| `geoip:private` | `"geoip:private"` | 私有地址 |
| `CIDR` | `"10.0.0.0/8"` | IP 段 |
| 纯 IP | `"127.0.0.1"` | 单个 IP |
| `ext:` | `"ext:geoip.dat:cn"` | 外部文件 |
| `!` 反选 | `"!geoip:cn"` | 不匹配 (NOT) |

### 2.3 其他匹配字段

| 字段 | 格式 | 说明 |
|------|------|------|
| `port` | `"53"`, `"443"`, `"1000-2000"`, `"53,443,1000-2000"` | 目标端口 |
| `sourcePort` | 同上 | 来源端口 |
| `network` | `"tcp"`, `"udp"`, `"tcp,udp"` | 网络协议 |
| `protocol` | `["http", "tls", "quic", "bittorrent"]` | 嗅探协议 (需开启 sniffing) |
| `inboundTag` | `["socks-in"]` | 入站标识匹配 |
| `sourceIP` | `["geoip:private"]` | 来源 IP (别名: `source`) |
| `localPort` | `"1080"` | 本地入站端口 |
| `user` | `["user@example.com"]` | 用户邮箱匹配 |
| `process` | `["curl"]` | 进程名匹配 (仅本地) |

---

## 3. 出站配置 (outbounds)

```json
{
  "outbounds": [
    {
      "sendThrough": "0.0.0.0",
      "protocol": "协议名称",
      "settings": {},
      "tag": "标识",
      "streamSettings": {},
      "proxySettings": {},
      "mux": {},
      "targetStrategy": "AsIs"
    }
  ]
}
```

列表中的第一个出站是**主出站**，在没有路由匹配时使用。

### 3.1 本仓库用的三类出站

| Tag | protocol | 用途 |
|-----|----------|------|
| `proxy` | `socks` 或 `vmess/trojan/vless` | 代理出站 |
| `direct` | `freedom` | 直连 |
| `block` | `blackhole` | 屏蔽 |

---

## 4. DNS 配置

```json
{
  "dns": {
    "hosts": {},
    "servers": [],
    "clientIp": "",
    "tag": "dns-tag",
    "queryStrategy": "UseIP",
    "disableCache": true,
    "disableFallback": false
  }
}
```

- `domainStrategy` 在路由块中设置：`"AsIs"`, `"IPIfNonMatch"`, `"IPOnDemand"`
- DNS 服务器配置支持：`localhost`, `geosite:cn@localhost`, `https://dns.alidns.com/dns-query`, `"223.5.5.5"` 等

---

## 5. 语法要点

1. **纯字符串域名**：在 `domain` 数组中，不带前缀的纯字符串被当作 `keyword:`（子串匹配），不是 `domain:`（子域名匹配）。推荐始终使用 `domain:` 前缀。
2. **三出站限制**：v2rayN 导入的路由规则只有 `proxy` / `direct` / `block` 三个出站目标。所有业务组在 v2rayN 中降级为这三个类别。
3. **geosite 依赖**：使用 `geosite:xxx` 需要 `geosite.dat` 文件位于资源目录。
4. **geoip 依赖**：使用 `geoip:xxx` 需要 `geoip.dat` 文件位于资源目录。
5. **`ext:` 格式**：`ext:文件名:标签`，文件名不带 `.dat` 后缀。
