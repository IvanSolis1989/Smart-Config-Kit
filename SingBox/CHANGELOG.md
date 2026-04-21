# SingBox — 变更日志

> `SingBox/singbox-smart.json`（精简）+ `SingBox/singbox-smart-full.json`（完整，由脚本生成）的变更日志。
> 主版本号跟随 Clash Party 主线。

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
