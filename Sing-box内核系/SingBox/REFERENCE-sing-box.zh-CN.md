# Sing-Box 配置参考文档

[English](REFERENCE-sing-box.md) | **简体中文**


> 更新于 2026-11-28（上次复核 2026-10-28）。官方稳定版已到 1.14.6，1.15 预发布改变了默认 TUN 协议栈。版本及导入边界见下文。

<a id="compatibility-review-2026-11-28"></a>

## 2026-11-28 兼容性复核

- 官方发布 [1.14.6 稳定版](https://github.com/SagerNet/sing-box/releases/tag/v1.14.6)、[1.15.0-alpha.15 预发布](https://github.com/SagerNet/sing-box/releases/tag/v1.15.0-alpha.15)及上一系列的 [1.13.21](https://github.com/SagerNet/sing-box/releases/tag/v1.13.21)。既有基线分别使用官方 1.14.3 和 1.13.14 检查。1.14.6 已拒绝组内重复成员并修正嵌套组解析，两份生成配置都没有组内重复成员。[1.14.3 至 1.14.6 源码差异](https://github.com/SagerNet/sing-box/compare/v1.14.3...v1.14.6)
- 两份 JSON 都设有 `stack: mixed`。官方 1.15 构建默认不带 `with_gvisor`，`mixed` 与 `gvisor` 均依赖该构建标记。`stack` 从 1.15 起弃用，计划在 1.17 移除。为 1.15 准备配置时，需单独检查使用新默认协议栈的配置和实际 TUN。[TUN 迁移说明](https://sing-box.sagernet.org/migration/#migrate-tun-stack)
- Full 使用命名 `http_clients` 和 DNS 响应匹配，1.13 变体使用 `download_detour`。后者从 1.14 起弃用，计划在 1.16 移除。对 `485453aa` 的 78 个融合 `.srs` 读回，文件头均为二进制格式 2。客户端升级无需为此重编共享资产。[规则集配置](https://sing-box.sagernet.org/configuration/rule-set/) · [规则集格式](https://sing-box.sagernet.org/configuration/rule-set/source-format/)
- 美国 App Store 为 10 月 24 日发布的 [sing-box MT 1.14.8](https://apps.apple.com/us/app/sing-box-mt/id6785326793)，F-Droid 为 10 月 27 日收录的 [SFA 1.14.4](https://f-droid.org/packages/io.nekohasekai.sfa/)。商店渠道按实际安装版本核对。Apple 配置迁移见[账户变更说明](https://sing-box.sagernet.org/migration/#migrate-the-macos-standalone-client-data)。[官方桌面客户端](https://sing-box.sagernet.org/clients/desktop/)支持本地或远端完整配置，Linux 图形包自 1.14.5 起命名为 `sfl`。

<a id="hiddify-profile-builder"></a>

### Hiddify 配置生成

GitHub 与美国 App Store 均已发布 Hiddify 5.9.15。App 固定 Hiddify Core 5.9.15，实际替换的 sing-box 模块是 fork `a26e58b3`，其提交历史包含上游 1.15.0-alpha.13。该 fork 已包含 1.14 的 HTTP 客户端和 DNS 响应结构，Hiddify 构建另带 `with_gvisor`。[App 依赖](https://github.com/hiddify/hiddify-app/blob/v5.9.15/dependencies.properties) · [Core 依赖](https://github.com/hiddify/hiddify-core/blob/b736fe9926bea6680b429e0900f040eed2aeee45/go.mod#L329-L345) · [fork 祖先提交](https://github.com/SagerNet/sing-box/compare/824dbcfb4dd0a95921840b1737b950cde590241e...hiddify:a26e58b376987a3305b201ec87fbc8918f620ad3)

常规订阅配置构建器读取输入后替换 `RouteOptions`，并重建出站选择组。App 发布时固定的源提交和 Windows Core 发行版均包含这段实现。原始配置分支直接调用 `ReadSingOptions`。[App 固定源码中的路由生成](https://github.com/hiddify/hiddify-core/blob/b736fe9926bea6680b429e0900f040eed2aeee45/v2/config/builder.go#L1119-L1137) · [原始配置分支](https://github.com/hiddify/hiddify-core/blob/b736fe9926bea6680b429e0900f040eed2aeee45/v2/hcore/buildconfighelper.go#L28-L43)

[官方 Windows Core 5.9.15 发行物](https://github.com/hiddify/hiddify-core/releases/tag/v5.9.15) 自报 fork 1.15.0-alpha.13、`with_gvisor` 和构建提交 `4e5a9a35`。对 `485453aa` 的两份 JSON 离线执行 `HiddifyCore.exe build --full-config` 均成功退出。读回两份生成结果，85 个源规则集和 54 个源组均未保留，98 条路由缩为 4 条，Full 的顶层 `rules-download` 客户端消失，兜底出口改为 `select`。使用显式 `enable-full-config: true` 并填入回环 DNS 的设置文件复测，两份结果均为 6 条路由及 2 个 Hiddify 自有规则集，仍未保留源规则集或源组。

本次只在本机执行生成并读回，未启动代理或在 App 真机连接。请通过官方 sing-box 客户端加载本仓配置，或使用原始配置入口并读回生效结果。独立 Hiddify Core 的 `srun` 可直接加载完整 JSON。[Hiddify Core 命令说明](https://hiddify.com/core/cli/#srun)

<a id="homeproxy-package-and-uci"></a>

### HomeProxy 软件包与 UCI

HomeProxy master `fadaa676` 依赖软件源提供的 `sing-box` 包。复核时 ImmortalWrt master 为 1.14.3，24.10 和 25.12 软件源为 1.12.25。以路由器实际安装为准。HomeProxy 的 1.14 适配以及经 VPN 连接节点时的启动修复仍在开放 PR 中。验收以 LuCI 经 UCI 生成的配置为准，核对启动及实际规则下载。[软件包依赖](https://github.com/immortalwrt/homeproxy/blob/fadaa676104f59ff6ace480a780a258d846d0aec/Makefile) · [master 软件源](https://github.com/immortalwrt/packages/blob/master/net/sing-box/Makefile) · [25.12 软件源](https://github.com/immortalwrt/packages/blob/openwrt-25.12/net/sing-box/Makefile) · [1.14 适配](https://github.com/immortalwrt/homeproxy/pull/671) · [启动修复](https://github.com/immortalwrt/homeproxy/pull/673)

> 核对于 2026-10-28：本次仅将 GoogleFCM 由下载更新归入 Google 服务；复核 [sing-box Route Rule](https://sing-box.sagernet.org/configuration/route/rule/)，沿用现有 rule_set 与 route 目标出站映射，保留 1.13/1.14 两个既有产物。不改变 DNS、fake-IP、嗅探、其他推送或节点组；未新增字段、最低版本或真机通过声明。

> 更新于 2026-10-19：完成本次涉及字段的官方原文核验，详见[版本、源码、适配与验证报告](../../docs/upstream/2026-10-19/singbox/report.md)及其原文缓存。下方旧摘要未整篇当前化；存在冲突时以下列核验结论为准。

## 2026-10-19 现行核验

- 稳定版为 [1.14.3](https://github.com/SagerNet/sing-box/releases/tag/v1.14.3)（2026-10-09），预发布为 [1.15.0-alpha.12](https://github.com/SagerNet/sing-box/releases/tag/v1.15.0-alpha.12)（2026-10-11）；不将 alpha 能力作为稳定版依据。
- [`http_client`](https://sing-box.sagernet.org/configuration/rule-set/#http_client) **1.14.0 才引入**；支持命名 HTTP client 或内联对象。旧摘要“迁到 `http_client` 后兼容 1.11–1.13”的说法错误。`download_detour` 从 1.14 废弃，计划 1.16 移除，仍是 1.13 兼容产物的合法字段。
- [typed DNS server](https://sing-box.sagernet.org/configuration/dns/server/https/) 从 **1.12** 引入；旧 `address` / `address_resolver` 格式在 1.14 移除。旧 inbound `sniff` / `sniff_override_destination` 在 1.13 移除，改用路由 `action: sniff`。
- 当前 Full 要求 1.14.3；同一生成器另产出 `SingBox(sing-box)-1.13.json`。两者分别通过官方 1.14.3 / 1.13.14 `check`，无废弃功能环境变量。非标准 `_meta` 已移出运行时 JSON。
- Full 的 CN IP DNS 过滤迁为 `evaluate` → `match_response` → `respond`；1.13 变体保持该系列支持的 GeoIP 接受过滤。二者规则 URL、出站拓扑和业务路由相对次序一致。
- 当前官方 [Block](https://sing-box.sagernet.org/configuration/outbound/block/) 页面与 1.14.3 实际检查均支持 `type: block`，保留供组成员引用；不照搬旧迁移摘要推断其已移除。
- Hiddify app 4.1.1 构建固定 core 4.1.0 / 1.13 派生源码；完整配置保留还受 App 解析模式约束。HomeProxy 根据 UCI 生成配置，未证明可直接把本仓库 Full JSON 当订阅完整导入。详见报告相应章节。
- 嗅探迁移仅保留 SNI/Host 辅助匹配；上游新动作没有等价的动态目的地址重写开关。旧 `sniff_override_destination=true` 的拨号语义无法完整保留，IP 目的仍拨原 IP；不得用未知字段或固定 `override_address` 假装等价。详见[固定源码核对](../../docs/upstream/2026-10-19/singbox/report.md#嗅探迁移的行为边界)。

## 历史摘要（保留原获取日期，未整篇复核）

> 2026-10-15 URL 兼容性复核：[官方 rule-set 文档](https://sing-box.sagernet.org/configuration/rule-set/)定义 `type: remote` 的 `url` 下载字段；官方当前文本没有明确限定 URL scheme。本次只替换远程资产 URL 主机，保留 `.srs`、`format: binary` 与其他字段；详见 [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md)。

> 更新于 2026-07-14：复核官方 Route Rule 文档。`process_name` 仍为 Linux、Windows、macOS 支持的正式字段，语义为匹配进程名；本仓库将 `WorkPro.exe` / `WorkProWebProcess.exe` 编译至 Windows 桌面直连 rule-set，不下放到移动端。
>
> 更新于 2026-05-31（上次获取 2026-04-30）：1.14.0-alpha.26 新增 Hysteria2 gecko 混淆（QUIC 流量伪装，`min_packet_size`/`max_packet_size` 字段）。alpha.20-25 为 mDNS DNS servers、Windows Schannel TLS 引擎、Hysteria2 NAT traversal、自定义 TUN DNS 模式等。稳定版仍为 1.13.12。本仓库 SingBox JSON 已完成 `download_detour` → `http_client` 迁移，兼容当前 1.11-1.13 稳定版；alpha 新功能不影响现有配置。
>
> 更新于 2026-04-30（上次获取 2026-04-26）：1.14.0-alpha.19 引入 `http_clients` 顶层字段（替代内联 `http_client`）、DNS 旧格式兼容将于 1.14 移除、TLS spoof/NaiveProxy/Tailscale 新能力、`default_http_client` 字段。本仓库 SingBox JSON 已完成 `download_detour` → `http_client` 迁移，兼容当前 1.11-1.13 稳定版。
>
> 来源 URL：
> - https://sing-box.sagernet.org/configuration/ (配置索引)
> - https://sing-box.sagernet.org/configuration/outbound/ (出站)
> - https://sing-box.sagernet.org/configuration/outbound/selector (Selector)
> - https://sing-box.sagernet.org/configuration/outbound/urltest (URLTest)
> - https://sing-box.sagernet.org/configuration/route/ (路由)
> - https://sing-box.sagernet.org/configuration/route/rule_set (规则集)
> - https://sing-box.sagernet.org/configuration/dns/ (DNS)
> - https://sing-box.sagernet.org/configuration/experimental/ (实验性功能)
>
> 获取日期：2026-04-26

---

## 1. 配置结构总览

顶层配置键：

```json
{
  "log": {},
  "dns": {},
  "inbounds": [],
  "outbounds": [],
  "route": {},
  "experimental": {},
  "ntp": {},
  "endpoints": [],
  "services": []
}
```

---

## 2. DNS 配置 (dns)

### 2.1 顶层字段

```json
{
  "dns": {
    "servers": [],
    "rules": [],
    "final": "",
    "strategy": "",
    "disable_cache": false,
    "disable_expire": false,
    "independent_cache": false,
    "cache_capacity": 0,
    "optimistic": false,
    "reverse_mapping": false,
    "client_subnet": "",
    "fakeip": {}
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `servers` | `[]DNS Server` | DNS 服务器列表 |
| `rules` | `[]DNS Rule` | DNS 规则列表 |
| `final` | `string` | 默认 DNS 服务器 tag；空时使用 `servers[0]` |
| `strategy` | `string` | 默认域名策略：`prefer_ipv4` / `prefer_ipv6` / `ipv4_only` / `ipv6_only` |
| `disable_cache` | `bool` | 禁用 DNS 缓存 |
| `disable_expire` | `bool` | 禁用 DNS 缓存过期 |
| `independent_cache` | `bool` | 已弃用 (1.14.0)，不要使用 |
| `cache_capacity` | `int` | LRU 缓存容量 (1.11+)；<1024 忽略 |
| `optimistic` | `bool|object` | 乐观 DNS 缓存 (1.14+) |
| `reverse_mapping` | `bool` | 存储 DNS 响应的 IP 到域名的反向映射 |
| `client_subnet` | `string` | 默认 EDNS0 客户端子网 (1.9+) |

### 2.2 DNS 服务器 (servers[])

```json
{
  "tag": "my-dns",
  "address": "udp://223.5.5.5:53",
  "address_resolver": "bootstrap",
  "address_strategy": "prefer_ipv4",
  "strategy": "prefer_ipv4",
  "detour": "DIRECT",
  "client_subnet": "1.2.3.4/24"
}
```

**`address` 格式：**
- 纯 IP 地址：`223.5.5.5` (自动推断 UDP)
- UDP：`udp://1.1.1.1:53`
- TCP：`tcp://1.1.1.1:53`
- TLS：`tls://1.1.1.1:853`
- HTTPS：`https://cloudflare-dns.com/dns-query`
- DHCP：`dhcp://auto`
- 本地：`localhost` (使用系统 DNS)
- Fakedns：`fakedns://` 或 `fakedns://:53`

**注意：** DNS 服务器配置中**没有** `type`、`server`、`server_port` 字段。这些字段是 Clash/Mihomo 的语法，在 sing-box 中无效。

### 2.3 DNS 规则 (rules[])

```json
{
  "rule_set": ["geosite-cn"],
  "inbound": ["tun-in"],
  "server": "dns-direct",
  "action": "route" | "reject",
  "disable_cache": false,
  "strategy": "prefer_ipv4",
  "client_subnet": ""
}
```

- `rule_set`：引用 `route.rule_set` 中定义的标签
- `action`：`route` (转发到 `server`) 或 `reject` (拒绝查询)
- 支持的匹配字段：`rule_set`, `inbound`, `port`, `network`, `protocol`, `query_type`, ...

---

## 3. 出站配置 (outbounds)

### 3.1 通用字段

所有出站共享：
```json
{
  "type": "selector|urltest|direct|block|dns|...",
  "tag": "唯一标签",
  ...
}
```

### 3.2 Selector

```json
{
  "type": "selector",
  "tag": "🚀 节点选择",
  "outbounds": ["🌍 全球节点", "DIRECT"],
  "default": "🌍 全球节点",
  "interrupt_exist_connections": false
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 必须为 `selector` |
| `tag` | `string` | 唯一标签 |
| `outbounds` | `[]string` | 可选择的出站标签列表 |
| `default` | `string` | 默认选中项 (可选项) |
| `interrupt_exist_connections` | `bool` | 切换时中断已有连接 |

### 3.3 URLTest

```json
{
  "type": "urltest",
  "tag": "🌍 全球节点",
  "outbounds": ["🇭🇰 香港节点", "🇹🇼 台湾节点", ...],
  "interval": "3m",
  "tolerance": 50,
  "idle_timeout": "30m",
  "interrupt_exist_connections": false
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 必须为 `urltest` |
| `tag` | `string` | 唯一标签 |
| `outbounds` | `[]string` | 测试候选列表 |
| `interval` | `duration` | 测试间隔 (如 `3m`) |
| `tolerance` | `int` | 延迟容差 (ms)，同一容差内的节点随机选择 |

### 3.4 Direct / Block / DNS

```json
{ "type": "direct", "tag": "DIRECT" }
{ "type": "block", "tag": "REJECT" }
{ "type": "dns", "tag": "dns-out" }
```

---

## 4. 路由配置 (route)

### 4.1 顶层字段

```json
{
  "route": {
    "rules": [],
    "rule_set": [],
    "final": "",
    "auto_detect_interface": true,
    "override_android_vpn": true,
    "default_domain_strategy": ""
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `rules` | `[]Route Rule` | 路由规则列表 |
| `rule_set` | `[]Rule Set` | 规则集定义 |
| `final` | `string` | 默认出站 (无规则匹配时使用) |
| `auto_detect_interface` | `bool` | 自动检测网络接口 |
| `override_android_vpn` | `bool` | Android VPN 覆盖 (需要 `auto_detect_interface`) |
| `default_domain_strategy` | `string` | 默认域名策略 |

### 4.2 路由规则 (rules[])

```json
{
  "action": "route",
  "outbound": "🐟 漏网之鱼",
  "rule_set": ["geosite-cn"],
  "inbound": ["tun-in"],
  "network": "tcp",
  "port": [80, 443],
  "port_range": "1000:2000",
  "domain": ["example.com"],
  "domain_suffix": [".example.com"],
  "domain_keyword": ["example"],
  "domain_regex": ["^example\.com$"],
  "geoip": ["CN"],
  "geosite": ["cn"],
  "ip_cidr": ["1.1.1.0/24"],
  "ip_is_private": true,
  "source_ip_cidr": ["10.0.0.0/8"],
  "source_port": [1234],
  "process_name": ["curl"],
  "process_path": ["/usr/bin/curl"],
  "user_id": [1000],
  "user": ["user1"],
  "clash_mode": "direct",
  "protocol": ["http", "tls", "quic", "bittorrent"],
  "invert": false
}
```

**支持的操作：**
- `action: "route"` + `outbound: "tag"` — 转发到指定出站
- `action: "reject"` — 拒绝连接
- `action: "hijack_dns"` — 劫持 DNS 请求

**支持的匹配字段 (`route`)：**
- `rule_set`, `inbound`, `protocol`, `network`, `port`, `port_range`
- `domain`, `domain_suffix`, `domain_keyword`, `domain_regex`
- `geoip`, `geosite`, `ip_cidr`, `ip_is_private`
- `source_ip_cidr`, `source_port`
- `process_name`, `process_path`, `user_id`, `user`
- `clash_mode`, `network_type`, `device`, `metadata`

### 4.3 规则集 (rule_set[])

```json
{
  "type": "remote",
  "tag": "geosite-cn",
  "format": "binary",
  "url": "https://...geosite-cn.srs",
  "download_detour": "DIRECT",
  "http_client": {
    "detour": "🌍 全球节点"
  },
  "update_interval": "1d"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | `remote` (远程) 或 `local` (本地) |
| `tag` | `string` | 唯一标签，被 `rule_set` 引用 |
| `format` | `string` | `binary` (`.srs`) 或 `source` (`.json`) |
| `url` | `string` | 仅 `remote` 类型：规则集 URL |
| `path` | `string` | 仅 `local` 类型：本地文件路径 |
| `download_detour` | `string` | 下载规则集时使用的出站 |
| `http_client.detour` | `string` | HTTP 客户端的出站 (覆盖 download_detour) |
| `update_interval` | `duration` | 更新间隔 |

---

## 5. 实验性功能 (experimental)

### 5.1 合法字段

```json
{
  "experimental": {
    "cache_file": {},
    "clash_api": {},
    "v2ray_api": {}
  }
}
```

`experimental` 块**仅支持** `cache_file`、`clash_api`、`v2ray_api` 三个字段。添加未知字段会导致配置告警。

### 5.2 Cache File

```json
{
  "cache_file": {
    "enabled": true,
    "path": "cache.db",
    "store_fakeip": true,
    "cache_id": "",
    "password": ""
  }
}
```

### 5.3 Clash API

```json
{
  "clash_api": {
    "external_controller": "0.0.0.0:9090",
    "external_ui": "",
    "external_ui_download_url": "",
    "external_ui_download_detour": "",
    "secret": "",
    "default_mode": "",
    "access_control_allow_origin": [],
    "access_control_allow_private_network": false,
    "store_selected": true,
    "store_fakeip": false,
    "cache_file": ""
  }
}
```

---

## 6. 语法要点

1. **`rule_set` 引用**：路由规则中的 `rule_set` 字段引用 `route.rule_set[]` 中定义的 `tag`，而非文件名。
2. **`domain_suffix` 匹配**：`domain_suffix: [".example.com"]` 匹配 `example.com` 和 `*.example.com`，**需要 `.` 前缀**表示匹配子域名。
3. **`geoip` 字段**：`geoip: ["CN"]` 是 `route.rules[]` 中的内联 GeoIP 匹配，无需额外 rule_set。也可使用 `ip_cidr`。
4. **`outbound` 字段**：规则中使用 `outbound`（非 `outboundTag`，后者是 Xray 语法）。
5. **DNS `address` 字段**：DNS 服务器使用 `address`（非 `server`），类型编码在地址前缀中。
6. **Selector `default` 字段**：非必需，但强烈推荐。如果不设，默认选中 `outbounds[0]`。
7. **Selector/URLTest 没有 `{all}` 占位符**：与 Clash 不同，sing-box 不支持 `{all}` 展开占位符；必须显式列出。
