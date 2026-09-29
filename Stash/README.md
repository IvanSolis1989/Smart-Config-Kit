# Stash

> 目录简介：这里提供 Stash 专用 YAML 产物。`Stash.yaml` 由 `tools/generate-stash-from-cmfa.js` 从 CMFA 自动裁剪生成，不手工维护。
> 当前版本：**v6.0.14-stash.6**（Build 2026-09-29，跟随 Clash Party v6.0.14 / CMFA v6.0.14-cmfa.6；132 个融合 rule-providers / 151 条主规则）。

## 文件

| 文件 | 用途 |
|---|---|
| `Stash.yaml` | Stash iOS / macOS / tvOS 导入用配置 |
| `CHANGELOG.md` | Stash 产物变更历史 |
| `REFERENCE-Stash-wiki.md` | Stash Wiki 字段依据与裁剪说明 |

## 使用方式

1. 打开 `Stash.yaml`。
2. 将 `proxy-providers` → `Subscribe` → `url` 替换为你的订阅链接。
3. 在 Stash 中导入该 YAML。
4. 首次导入后检查 `proxy-providers` 与 `rule-providers` 是否下载成功。

## 生成方式

```bash
node tools/generate-stash-from-cmfa.js
```

生成器只以 `Clash Meta For Android/CMFA(mihomo).yaml` 为输入，输出 `Stash/Stash.yaml`。任何规则、策略组、rule-provider、补充规则集或 DNS 语义变更，都应先同步 CMFA，再重新生成 Stash。

## 兼容范围

- 保留：22 个区域 `url-test` 组、33 个业务组、113 个融合 rule-provider、`RULE-SET` / `GEOIP` / `DST-PORT` / `PROCESS-NAME` 等规则语义。
- 保留：`proxy-providers` 远程订阅、`proxy-groups.use`、`nameserver-policy`、`fake-ip-filter`。
- 不保留：Mihomo Smart + LightGBM、GeoX 自动更新、sniffer、provider `health-check` / `exclude-filter`、rule-provider 下载代理 `proxy`、Mihomo 专用 DNS fallback 字段。

## 注意事项

- Stash Wiki 未记录 rule-provider 下载代理字段，所以本产物不写 `proxy: 🚫 受限网站`。如果你的网络无法直连 GitHub / jsDelivr，首次规则下载可能需要先让 Stash 自身具备可用代理环境。
- Stash 的 `default-nameserver` 按官方示例只放明文 IP；DoH 放在 `nameserver` 与 `nameserver-policy` 中。
- Stash 不支持本仓库的 Smart Alpha / LightGBM 自动择优；区域组使用传统 `url-test`。
- `Stash.yaml` 是生成产物，手工修改会被下次生成覆盖。

## 验证

```bash
node tools/generate-stash-from-cmfa.js
node tools/validate-artifact-contracts.js
```

CI 中 `validate-artifact-contracts.js --strict-ruby` 会检查 Stash YAML 的组数、provider 数、规则数、关键顺序、DNS 裁剪和 YAML 结构。
