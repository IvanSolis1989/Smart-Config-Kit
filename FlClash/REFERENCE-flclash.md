# FlClash 参考文档

> 更新于 2026-09-30（上次核对 2026-08-31）：实时 release 为 [v0.8.98](https://github.com/chen08209/FlClash/releases/tag/v0.8.98)（2026-09-14）。复核该 tag 的 [getProfile](https://github.com/chen08209/FlClash/blob/v0.8.98/lib/providers/actions/setup.dart#L315-L368) 和 [配置 patch](https://github.com/chen08209/FlClash/blob/v0.8.98/lib/common/task.dart#L109-L245)，仍先执行脚本，再应用 App patch；DNS 覆写/追加系统 DNS 的边界延续下述说明。本次节点预检和倍率筛选只使用已有 JS 语法并保持数组引用；未抬高声明的 v0.8.85 最低版本。本次验证为 VM 回归，未代替设备上的 App patch 验收。

> 来源：https://github.com/chen08209/FlClash
> 获取日期：2026-05-03
> 更新于 2026-07-25（复查）：FlClash 最新版 v0.8.94（2026-07-11）。相对 v0.8.93 未见影响本仓库 JS 覆写入口、DNS 配置对象或订阅关联流程的 breaking change；当前基线兼容。
> 更新于 2026-08-31：核对稳定版 v0.8.96（2026-08-17），commit `e2f678909dd9738015a5c032a8e25288ed79d4f1`。纠正脚本与 App patch 的先后顺序、DNS 整体替换、系统 DNS 追加及 Android HTTP 代理边界。
> 版本：v0.8.96（本次核对的最新稳定版；未将这一行为无条件外推至所有旧版或预发布版）

---

## 1. 项目概述

FlClash 是基于 Flutter 的多平台 Mihomo（原 ClashMeta）客户端。

- **平台**：Android / Windows / macOS / Linux
- **内核**：标准 Mihomo（修改版，增加 FFI 桥接层）
- **许可证**：GPL-3.0
- **仓库**：https://github.com/chen08209/FlClash

---

## 2. 配置架构

FlClash 采用双配置系统：

| 层 | 类 | 职责 |
|---|---|---|
| 应用层 | `AppSettingProps` | UI、主题、语言、VPN 选项、自动启动等 |
| 代理引擎层 | `ClashConfig` | 端口、模式、DNS、TUN、代理组、规则等 |

### ClashConfig 关键字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `mixed-port` | int | 混合代理端口（默认 7890） |
| `mode` | Mode | 路由模式：rule / global / direct |
| `allow-lan` | bool | 允许局域网连接 |
| `log-level` | LogLevel | 日志级别 |
| `ipv6` | bool | IPv6 支持 |
| `find-process-mode` | FindProcessMode | 进程匹配模式 |
| `unified-delay` | bool | 统一延迟测试 |
| `tcp-concurrent` | bool | TCP 并发连接 |
| `tun` | Tun | TUN 设备配置 |
| `dns` | Dns | DNS 解析配置 |
| `proxy-groups` | List\<ProxyGroup\> | 代理组列表 |
| `rules` | List\<String\> | 路由规则列表 |
| `rule-providers` | Map\<String,RuleProvider\> | 规则提供者 |
| `hosts` | Map\<String,String\> | 主机映射 |
| `geox-url` | GeoXUrl | GeoIP/GeoSite/ASN 数据库 URL |

### Android 应用层与内核层边界

Android 的 VPN、HTTP 代理、应用访问控制和“允许应用绕过 VPN”属于应用层设置。`vpnProps.systemProxy=true` 会发布指向本地端口的 HTTP 代理，并非国外流量开关。`rejectSelected` 通过 `addDisallowedApplication` 排除 APP，`allowBypass` 则允许应用主动选择底层网络，二者不是同一个选项。

v0.8.96 [Android VPN 页面](https://github.com/chen08209/FlClash/blob/v0.8.96/lib/views/config/network.dart#L70-L88) 的名称是“系统代理”，不是“仅代理”。它附加 HTTP proxy，但 TUN 仍会建立并运行；不要把它解释成关闭 VPN 的 HTTP-only 模式。

顶层 `ipv6`、`dns.ipv6` 与 Android VPN `ipv6` 是三个配置位置。App patch 会在脚本后重新写入顶层 IPv6；DNS 覆写开启时又会覆盖 DNS 的 IPv6/PreferH3。脚本单独设置 false 不等于最终关闭；应用层也要明确关闭。

官方依据：[VpnService.kt](https://github.com/chen08209/FlClash/blob/v0.8.96/android/service/src/main/java/com/follow/clash/service/VpnService.kt#L109-L146)、[应用排除](https://github.com/chen08209/FlClash/blob/v0.8.96/android/service/src/main/java/com/follow/clash/service/VpnService.kt#L200-L209)、[Android setHttpProxy](https://developer.android.com/reference/android/net/VpnService.Builder#setHttpProxy(android.net.ProxyInfo))。Android 明确提醒 HTTP 代理与 split tunnel 组合可能影响联网；它是风险说明，不能代替某个 APP 的实测连接证据。

---

## 3. 覆写系统

### 3.1 配置应用流水线

```
读取 Profile → 按覆写类型选择 JS/规则/分组 → JS main(config)
→ makeRealProfileTask 应用 App patch → YAML 编码 → 核心设置
```

以 [setup.dart 的 getProfile](https://github.com/chen08209/FlClash/blob/v0.8.96/lib/providers/actions/setup.dart#L251-L301) 为准：先评估脚本，再调用 [task.dart 的 _makeRealProfileTask](https://github.com/chen08209/FlClash/blob/v0.8.96/lib/common/task.dart#L108-L213)。脚本不是最后写入者。

| 后置操作 | 结果 |
|---|---|
| 顶层 IPv6、端口、模式、进程匹配、TUN、GeoX | 从 App patch 写回，覆盖脚本相同字段 |
| hosts | App 同名条目覆盖，其他脚本 hosts 保留 |
| DNS 覆写开启，或源 DNS 未启用 | 整个 DNS 由 App 模型重新序列化，并重建 nameserver-policy |
| DNS 覆写关闭且脚本 DNS 已启用 | 保留脚本 DNS map |
| appendSystemDns 开启 | 上述操作之后再追加系统解析器；Android 也适用 |

[Dns 模型](https://github.com/chen08209/FlClash/blob/v0.8.96/lib/models/clash_config.dart#L255-L303) 未声明 `proxy-server-nameserver-policy`、`direct-nameserver`、`direct-nameserver-follow-policy`。因此把完整脚本 DNS 粘贴进 UI 仍会丢失这些键；关闭 DNS 覆写才能保留脚本提供的字段。App 表单中保留的旧值不代表最终 DNS。

Mihomo 对 [respect-rules、节点 DNS、直连 DNS 与 PreferH3](https://wiki.metacubex.one/config/dns/) 的说明是内核语义依据，不代表 FlClash UI 能无损保存全部字段。

### 3.2 图形化覆写规则（v0.8.81+）

UI 支持添加的规则类型：
- `DOMAIN-SUFFIX` — 域名后缀匹配
- `DOMAIN-KEYWORD` — 域名关键词匹配
- `DOMAIN` — 域名精确匹配
- `IP-CIDR` — IP CIDR 段匹配
- `GEOIP` — GeoIP 地理位置匹配（如 CN）
- `PROCESS-NAME` — 进程名匹配（Windows 专属）

### 3.3 JavaScript 覆写脚本（v0.8.85+）

#### 入口函数

```javascript
function main(config) {
  // 修改 config 对象
  return config;
}
```

`config` 是读入 Profile 后交给 JS 的配置 map；脚本返回值还会经过上面的 App patch，不能当成最终 YAML。

#### 支持的操作

| 操作 | 示例 |
|------|------|
| 修改代理组 | `config["proxy-groups"].push({name:"MyGroup", type:"select", proxies:[...]})` |
| 添加/替换规则 | `config.rules = ["DOMAIN-SUFFIX,example.com,DIRECT", ...config.rules]` |
| 注入规则提供者 | `config["rule-providers"]["my-rules"] = {type:"http", ...}` |
| 修改全局设置 | `config["unified-delay"] = true` |
| 修改 DNS | `config.dns = {...}` |
| 修改 TUN | `config.tun = {...}` |
| 节点过滤/注入 | `config.proxies = config.proxies.filter(...)` |

#### 覆写合并语义

| 配置段 | 操作 |
|--------|------|
| `rules` | prefix（前置插入）/ suffix（后置追加） |
| `proxies` | prefix / suffix / override（按 name 匹配覆盖） |
| `proxy-groups` | prefix / suffix / override（按 name 匹配覆盖） |
| 其他字段 | 不可统一假定深度合并；DNS 整体替换、hosts 同名合并等以 §3.1 的 App patch 为准 |

#### 代理组类型

- `select` — 手动选择
- `url-test` — 自动测速择优（需 `url`、`interval`、`tolerance` 字段）
- `relay` — 链式代理
- `load-balance` — 负载均衡
- `fallback` — 故障转移

#### 特殊字段

- `hidden: true` — 在代理页面隐藏该组
- `lazy: true` — 延迟测速（仅在需要时测速）

---

## 4. JS 引擎环境

FlClash 使用内置 JS 引擎（推测为 QuickJS，来自 Flutter 集成），支持：
- ES5/ES6 基础语法（`const`/`let`、箭头函数、模板字面量）
- `RegExp`（正则表达式）
- `Array` / `Object` / `Map` / `Set`
- `String` / `Number` / `Boolean`

**不确定支持的特性**：
- `console.log` — 可能不支持（本仓库脚本已做条件包装）

---

## 5. 与 Clash Party JS 的关键差异

| 维度 | Clash Party JS | FlClash 覆写脚本 |
|------|:---:|:---:|
| 执行环境 | Sub-Store JS 引擎 | FlClash 内置 QuickJS |
| `type: smart` | Smart 版支持 | 不支持（内核限制） |
| LightGBM | Smart 版支持 | 不支持（内核限制） |
| 多机场融合 | Sub-Store 合并后传入 | FlClash 单订阅传入 |
| TUN 管理 | 脚本覆写 | App UI 管理 |
| 端口管理 | 脚本覆写 | App UI 管理 |
| `config` 结构 | 标准 mihomo config | JS 收到配置 map，但 App UI 的字段模型及后置 patch 并非无损透传 |

## GeoX 资源路径

[资源页](https://github.com/chen08209/FlClash/blob/v0.8.96/lib/views/resources.dart#L115-L147) 修改的 URL 保存到 App patch，生成配置时再写入核心；同步由 [core controller](https://github.com/chen08209/FlClash/blob/v0.8.96/lib/core/controller.dart#L152-L154) 的 `updateGeoData` 处理。不能声称资源页使用普通 UI HTTP 下载，也不能假定脚本 rule-provider 的 proxy 字段决定 GeoX 下载出口。保留可用默认 URL 与缓存，按实际下载/加载结果排障。

---

## 6. 相关资源

| 资源 | URL |
|------|-----|
| GitHub 仓库 | https://github.com/chen08209/FlClash |
| Releases | https://github.com/chen08209/FlClash/releases |
| DeepWiki 配置管理 | https://deepwiki.com/chen08209/FlClash/6-build-and-deployment |
| DeepWiki 核心引擎 | https://deepwiki.com/chen08209/FlClash/3.1-core-network-engine |
| 覆写脚本教程 (Issue #1510) | https://github.com/chen08209/FlClash/issues/1510 |
| 进阶配置教程 (bwgss.org) | https://www.bwgss.org/4226.html |
