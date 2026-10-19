# Stash

## 📥 规则下载链接

[![下载规则：Stash YAML](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Stash%20YAML-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Stash/Stash.yaml)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**Stash YAML 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Stash/Stash.yaml
```

下载 YAML 后，按下文替换 `proxy-providers.Subscribe.url` 再导入。

---

规则下载需能访问 GitHub Raw；见[下载排错](../docs/rule-asset-delivery.md)。可选[测速与 QUIC 策略](../docs/traffic-options.md)、[微信连接排错](../docs/research/2026-10-16-wechat-issue-187.md)与[Claude Desktop 网络依赖](../docs/claude-service-dependencies.md)另有说明。

> 配置：`Stash.yaml` · **v6.0.20-stash.12**（Build 2026-10-16）
> 由 CMFA 生成，22 区域组 + 33 业务组；不支持 Mihomo Smart / LightGBM。

## 文件

| 文件 | 用途 |
|---|---|
| `Stash.yaml` | Stash iOS / macOS / tvOS 导入用配置 |
| `REFERENCE-Stash-wiki.md` | Stash Wiki 字段依据与裁剪说明 |

## 使用方式

1. 下载 `Stash.yaml`，在本地副本把 `proxy-providers` → `Subscribe` → `url` 改为机场订阅。
2. 在 Stash 导入该 YAML，检查订阅节点与全部远程规则是否下载成功。
3. 确认 22 个区域组和 33 个业务组，按需要选择上游；GitHub Raw 不可达时，先使用可用代理下载。

测速订阅只应包含远端代理。Stash 空 provider 或空组会默认直连，使用前检查实际成员；具名直连等特殊出站需另行确认引用。

## 生成方式

仓库维护者通过生成器更新此产物；不要手工修改仓库中的 `Stash.yaml`：

```bash
node tools/generate-stash-from-cmfa.js
```

字段依据见 [REFERENCE](./REFERENCE-Stash-wiki.md)。

## 兼容范围

- 使用 Stash 原生 `url-test`、远程订阅与规则集；MRS 仅用于 domain / ipcidr，混合规则使用兼容格式。
- 保留 `nameserver-policy` 与 `fake-ip-filter`；本配置不提供 Mihomo Smart / LightGBM。
- 截至 2026-10-19，当前稳定版 iOS 3.6.4 要求 iOS 16+，Mac 4.3.3 要求 macOS 12.4+；这不代表各配置字段的最初支持版本。

## 注意事项

- 现有输出采用保守 DNS 配置。Stash iOS/tvOS 3.6+、Mac 4.3+ 已官方支持加密 `default-nameserver`、独立 `proxy-server-nameserver` 与 DNS 引用规则集，但本产物尚未启用这些新能力。
- 官方确认 `tolerance` 单位为毫秒，但最低引入版本未确认；本生成器暂不保留该字段，也不推断支持 Mihomo 的 `empty-fallback` / `exclude-type`。
- 本轮没有 Stash App 导入与 DNS 故障验收。新能力、版本门槛和待核项见[复核报告](../docs/upstream/2026-10-19/apple/report.md)。

## 验证

导入后检查规则下载、组内节点与实际请求出口；静态检查不能代替 App 验收。仓库维护检查：

```bash
node tools/generate-stash-from-cmfa.js
node tools/validate-artifact-contracts.js
```
