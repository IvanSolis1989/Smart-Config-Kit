# Xray (v2rayN) 配置参考文档

> 核对于 2026-10-28：本次仅将 GoogleFCM 由下载更新归入 Google 服务；复核 [Xray RoutingObject](https://xtls.github.io/config/routing.html)，沿用现有 outboundTag；FCM 从下载 direct 映射迁到 Google proxy 映射。不改变 DNS、fake-IP、嗅探、其他推送或节点组；未新增字段、最低版本或真机通过声明。

> 更新于 2026-10-19：本次核验见[官方版本、原文缓存及本地适配报告](../../docs/upstream/2026-10-19/singbox/report.md)。下方旧摘要保留其获取日期，未整篇当前化。

## 2026-10-19 现行核验

- Xray 的 [GitHub Latest](https://github.com/XTLS/Xray-core/releases/latest) 仍为 v26.3.27（2026-03-27）；最新预发布为 [v26.10.17](https://github.com/XTLS/Xray-core/releases/tag/v26.10.17)（2026-10-17）。后者不能称为最新稳定版。
- v2rayN 稳定版 [7.25.6](https://github.com/2dust/v2rayN/releases/tag/7.25.6)（2026-10-11）明确支持并锁定 sing-box 1.14 系列，另有较早的 7.25.5 预发布。App 支持多核心，实际安装/更新的核心需分别核对，不能用应用版本替代核心版本。
- 当前 [RuleObject](https://xtls.github.io/config/routing.html#ruleobject) 使用原生 `domain` / `ip` / `process` / `outboundTag` 等字段；不支持 sing-box 远程 `.srs`。本仓库 Xray 路由继续从融合 source JSON 展平，未引入 `.srs` 到 Xray JSON。
- 原生 sing-box Full 与 1.13 变体的选择、Hiddify 构建内核和 HomeProxy 导入限制见报告。v2rayN App 导入与实际连接未在本次运行。

## 历史摘要（未整篇复核）

> 更新于 2026-07-09：复核 Xray routing `RuleObject` 与 v2rayN 自定义路由规则格式。Xray 路由支持 `domain` / `ip` / `port` / `process` / `outboundTag` 等原生字段，但没有 sing-box `.srs` 远程 rule-set 字段；本仓库因此把 fused sing-box JSON 展平成原生 Xray RuleObject，而不是在 Xray JSON 中引用远程 `.srs`。
>
> 更新于 2026-05-31（上次获取 2026-04-30）：Xray-core 最新稳定版仍为 v26.3.27（2026-03-27），预发布推进至 v26.5.9（2026-05-09）。稳定版无变化，本仓库 v2rayN 配置无需调整。
>
> 更新于 2026-04-30（上次获取 2026-04-26）：Xray-core 最新稳定版 v26.3.27（2026-03-27），预发布 v26.4.25（2026-04-25）。v26.3.27 新增 Hysteria2 入站/传输层、ECH 默认仅允许 ECH 连接、Finalmask HTTP 自定义头/Sudoku。`allowInsecure` 已标记废弃（2026-06 截止）——本仓库 v2rayN 配置未使用该字段，无影响。
>
> 来源 URL：
> - https://xtls.github.io/config/routing.html (路由配置)
> - https://github.com/2dust/v2rayN/wiki/Description-of-custom-routing-rules (v2rayN 自定义路由规则)
> - https://xtls.github.io/config/dns.html (DNS 配置)
> - https://xtls.github.io/config/outbound.html (出站配置)
>
> 获取日期：2026-07-09

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

**注意：** 本仓库路径 C 只使用 `proxy`、`direct`、`block` 三个出站标签。没有复杂策略组，也不在 Xray JSON 中引用远程 fused `.srs`。

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
