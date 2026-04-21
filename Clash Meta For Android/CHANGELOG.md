# Clash Meta For Android (CMFA) — 变更日志

> `Clash Meta For Android/clash-smart-cmfa.yaml` 的变更日志。
> 主版本号跟随 Clash Party 主线。

---

## v5.2.5 (2026-04-20)

- ★ 同步 Clash Party v5.2.5 FIX#23-P1：删除 `acc-geositecn` + `acc-china` 两个 rule-provider（与 `geosite:cn` 纯重复）
- 头部版本号从 v5.2.2 同步到 v5.2.5

## v5.2.2 (2026-04-20)

对齐 Clash Party FIX#17-P0：

- ★ `rule-providers` 统一 `proxy: '🚫 受限网站'`（389 处，原值 `'☁️ 云与CDN'`）
- ★ 头部版本号从 v5.2.0 同步到 v5.2.2

## v5.2.0 (初版)

- 9 url-test 区域组 + 28 业务策略组 + 375+ rule-providers
- 所有 GEOSITE / GEOIP 高级标签已用等效 RULE-SET 替代，无需等 `.dat` 下载
- 区域组使用 `type: url-test`（静态 YAML 不支持 Mihomo Smart + LightGBM；LightGBM 仅在桌面端 Clash Party JS 运行时注入）
