# SingBox — 变更日志

> `SingBox/singbox-smart.json`（精简）+ `SingBox/singbox-smart-full.json`（完整，由脚本生成）的变更日志。
> 主版本号跟随 Clash Party 主线。

---

## v5.2.5-sing.2 (2026-04-22) — 修复 sing-box 1.13 起起不来 + 重建基础模板

用户升级 sing-box 到 1.13+ 会直接 FATAL 起不来：遗留配置里有 `type: "block"` 特殊 outbound，
1.11 废弃 / 1.13 移除（[sing-box migration](https://sing-box.sagernet.org/migration/)）。
同时 `dns.servers[*]` 用了 legacy `"address": "https://..."` 字段，1.12 起废弃、1.14 移除
（[dns server legacy](https://sing-box.sagernet.org/configuration/dns/server/legacy/)）。

复核还发现基础模板 `SingBox/singbox-smart.json` 在 commit `da56387` 被误删（只剩生成产物
`singbox-smart-full.json`），`generate-singbox-full.js` 实际一直跑不起来。

### 本次改动

- ★ FIX#sing-01-P0：**删除 `type: "block"` 特殊 outbound**（tag `🚫 拦截`）
  - 3 个 selector（`🚀 节点选择` / `🛰️ BT/PT Tracker` / `🛑 广告拦截`）的 `outbounds` 列表同步剔除该 tag
  - 路由规则已用 `action: "reject"` 表达拒绝语义（generator 正确实现），本来就没规则引用 `🚫 拦截`，只剩级联 tag 残留
- ★ FIX#sing-02-P0：**3 个 DNS server 迁移到新 schema**（`{type, server, detour}` 取代 `{address, detour}`）
  - `dns_direct`: `address: "https://223.5.5.5/dns-query"` → `type: "https", server: "223.5.5.5"`
  - `dns_proxy`:  `address: "https://1.1.1.1/dns-query"`   → `type: "https", server: "1.1.1.1"`
  - `dns_block` (`rcode://success`)：整条删除，referring DNS rule 改用 `action: "reject"`（广告 geosite 规则）
- ★ FIX#sing-03-P1：**重建 `SingBox/singbox-smart.json` 基础模板**
  - 从 v5.2.5-sing.1 的 full.json 反推，剥掉 generator 会填的 `route.rule_set` / `route.rules` / `route.final`
  - 注入所有 sing-box 1.12+ 修复到基础模板，后续 `node SingBox/generate-singbox-full.js` 跑起来就能产出正确的 full.json
- ★ 注入 `experimental._meta`（`version=v5.2.5-sing.2`、`build=2026-04-22`、`baseline=Clash Party v5.2.5`、`changelog=见 SingBox/CHANGELOG.md`）
- 重新生成 `singbox-smart-full.json`（51 outbounds + 975 rules + 391 rule_set）

### 自检

- `sing-box check -c singbox-smart-full.json` 期望通过（1.12 / 1.13 / 1.14 均可）
- `outbounds[*].type == "block"` 出现次数：0 ✓
- `dns.servers[*].address`（legacy）出现次数：0 ✓
- 任意 selector.outbounds 列表引用 `🚫 拦截`：0 ✓
- selector+urltest 共 38 个（1 顶层 + 9 区域 + 28 业务）✓（CLAUDE.md §5 期望 38）
- rule_set 与 rules 数量：391 / 975（与 v5.2.5-sing.1 等价，仅 DNS+outbound schema 修）
- `_meta.version` 以 `v5.` 开头 ✓（CLAUDE.md §5 期望）

### 生成工作流

```
node SingBox/generate-singbox-full.js
# 读 SingBox/singbox-smart.json（本次重建好的 base）+ Clash Party 主线 JS
# 产出 SingBox/singbox-smart-full.json
```

### 官方文档证据

- [sing-box migration guide](https://sing-box.sagernet.org/migration/)（block outbound 1.11 deprecated, 1.13 removed）
- [v2rayN issue #7708](https://github.com/2dust/v2rayN/issues/7708)（用户实锤：1.13+ sing-box 因 deprecated special outbound FATAL）
- [sing-box DNS legacy schema](https://sing-box.sagernet.org/configuration/dns/server/legacy/)
- [sing-box DNS server](https://sing-box.sagernet.org/configuration/dns/server/)（new `type:"https"/"quic"/"udp"` schema）

---

## v5.2.5-sing.1 (2026-04-20)

- ★ 跟随 Clash Party v5.2.5 FIX#23-P1 重新生成：`acc-geositecn` + `acc-china` 两个 rule_set 从 `singbox-smart-full.json` 消失
- 重新生成命令：`node SingBox/generate-singbox-full.js`
- 结果：`route.rules` 977 → 975；`route.rule_set` 对应减 2 项

## v5.2.3-sing.1 (2026-04-20)

- ★ Full 版本由 `SingBox/generate-singbox-full.js` 从 Clash Party v5.2.3 JS 主线自动提取：
  - 387 rule_set 入口
  - 977 条路由规则
- ★ DNS / Sniffer / GEO 增强：
  - `dns_direct`（223.5.5.5 DoH）用于国内规则集
  - `dns_proxy`（1.1.1.1 DoH）用于代理解析
  - `dns_block`（rcode://success）用于广告域名
  - `inbounds.tun.sniff = true` + `sniff_override_destination = true`
  - `MetaCubeX/meta-rules-dat@sing` 的 geosite / geoip `.srs` 远程规则集（按日更新）
- ★ 路由规则使用 `action` + `outbound` 形式（sing-box 1.11+ 推荐）
- ★ `experimental.cache_file.enabled = true`（远程规则与 selector 选择结果可缓存）

## 初版

- 在 sing-box 上复刻 Clash Party 的 9 区域组 + 28 业务组语义
- `selector` / `urltest` 使用官方结构字段（`outbounds` / `default` / `interval` / `tolerance`）
