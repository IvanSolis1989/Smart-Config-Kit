# 融合规则资产分发：切换至 GitHub raw HTTPS

## Issue 与故障证据

[Issue #186](https://github.com/IvanSolis1989/Smart-Config-Kit/issues/186) 报告客户端无法通过 jsDelivr 获取本仓库融合规则资产。排查记录如下：

- 2026-10-15，jsDelivr data API 返回 HTTP 403，错误为 `Package size exceeded configured limit of 50 MB`；Fastly 上 `ad` 资产返回 404，错误为 `Failed to fetch repository`。
- 同一 GitHub raw 文件返回 HTTP 200，大小 12,467,261 字节；仓库 tracked Git blobs 合计 206,938,573 字节。
- jsDelivr 的[公开限制](https://github.com/jsdelivr/jsdelivr#restrictions)列出 150 MB package 和 20 MB 单文件限制。这些公开限制不能抹去本次接口实际返回的 50 MB 配置门槛；把文件切到 20 MB 以下不能解决仓库级门槛。
- DoingDog 已在 2026-09-28 上游提交 [`dd2c83d`](https://github.com/DoingDog/rconvert/commit/dd2c83d42a7b9aa3f5a01d62f414cd2a2edfc5be) 退休 a1/a2。当前 `main` 的 `2b33b29` 配置/源码已不含 DoingDog；a3/a4 与已退休来源不等价，本次修复不重新引入。

## 本次变更边界

v6.0.19 将本仓库自有生成规则资产的 runtime URL 改为 `https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/...`。保留各客户端原生 URL 字段或规则语法、资产格式、规则内容、策略目标和顺序，也保留 `?scki=v6.0.19` 缓存标记。本次是分发地址变更，不改变路由策略。

平台空内容引用按客户端能力处理：`scki-fused-019-work.list` 仅包含换行，在 Shadowrocket、Loon、Quantumult X 中删除对应的空 `RULE-SET` 引用；Surge 对应的四条 `PROCESS-NAME` 规则有实际内容并继续保留。生成器只剔除平台不支持或没有有效内容的远程引用；原规则 payload 与有效策略顺序不变。按 v6.0.19 当前配置中的远程融合规则行计数：Shadowrocket 77 条、Surge 78 条、Loon 77 条、Quantumult X 77 条。其他客户端应按各自实际配置统计，不从这些客户端推算。

Xray/v2rayN 产物把规则展平在本地配置中，没有 runtime 远程 `.srs` URL；其版本 metadata 可以随版本同步，但没有 URL 需要迁移。

## 客户端语法与官方依据

| 客户端 | 当前原生语法 | 依据与本次复核限制 |
| --- | --- | --- |
| Shadowrocket | `RULE-SET,<URL>,<policy>` | 仓库 `Shadowrocket/REFERENCE-shadowrocket.md` 记录此语法。官方帮助站 <https://help.shadowrocket.net/> 本次无法读取，因此不能声称本次已从该官方页面重新确认 HTTPS 支持。 |
| Surge | `RULE-SET,<URL>,<policy>` | [官方 Rule Set 手册](https://manual.nssurge.com/rules/ruleset.html)明确外部资源可以是 `http://` 或 `https://` URL，并给出 URL 型 `RULE-SET` 示例。 |
| Loon | `[Remote Rule]` URL 条目 | [官方示例配置](https://github.com/Loon0x00/LoonExampleConfig/blob/master/example.conf)包含 HTTPS raw GitHub URL。LoonManual 官方仓库在 <https://github.com/Loon0x00/LoonManual>；其 Remote Rule 手册正文本次未能抓取，证据限于官方示例配置。 |
| Quantumult X | `[filter_remote]` URL 条目 | 上游[官方 URL Scheme](https://github.com/crossutility/Quantumult-X/blob/master/url-scheme.md)展示 `filter_remote` 中的 HTTPS raw GitHub URL；上游[官方 sample.conf](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)可供参考。具体行参数来自社区 [filter_remote 说明](https://qx.atlucky.me/shi-yong-fang-fa/pei-zhi-wen-jian-xiang-jie/filter-fen-liu-gui-ze/filterremote-yuan-cheng-fen-liu-gui-ze)，不将其称作官方手册。 |
| Clash Party、CMFA、OpenClash、FlClash | Mihomo `rule-providers` 中的 `type: http`、`url`；规则通过 provider 名称以 `RULE-SET` 引用 | [Mihomo 官方 rule-provider 文档](https://wiki.metacubex.one/en/config/rule-providers/)要求 `type: http` 时提供 `url`，并示范 HTTPS raw URL；[路由规则文档](https://wiki.metacubex.one/en/config/rules/)说明 provider-name `RULE-SET` 形式。四种客户端消费同一 Mihomo 配置字段。 |
| Stash | `rule-providers.<name>.url`；`RULE-SET,<name>,<policy>` | [官方 Rule Sets 文档](https://stash.wiki/en/rules/rule-set)提供远端 provider 的 HTTPS URL 示例及名称式 `RULE-SET` 引用。 |
| Egern | `rule_set` 规则，URL 放在 `match` | [官方 Rules 文档](https://egernapp.com/docs/configuration/rules/)以 HTTPS URL 示范远端规则集，并支持 `update_interval`。 |
| sing-box | `route.rule_set[]` 中的 `type: remote`、`format`、`url` | [官方 rule-set 文档](https://sing-box.sagernet.org/configuration/rule-set/)定义 remote `url` 下载字段；官方当前文档未明确限定 URL scheme，本次不额外声称其 scheme 约束。 |
| Passwall、Passwall2 | `domain_list` / `ip_list` 使用 `rule-set:remote:<URL>` | 两个官方解析器源码：[Passwall](https://github.com/Openwrt-Passwall/openwrt-passwall/blob/main/luci-app-passwall/luasrc/model/cbi/passwall/client/shunt_rules.lua)、[Passwall2](https://github.com/Openwrt-Passwall/openwrt-passwall2/blob/main/luci-app-passwall2/luasrc/model/cbi/passwall2/client/shunt_rules.lua)。仓库既有 Passwall REFERENCE 记录了 HTTPS `.srs` URL 语法。本次未独立抓取解析器实现行以确认 scheme 限制，因此不对限制作额外结论。 |

上述证据支持保留当前 URL 字段/规则结构并更换 URL 主机；本次不增加客户端字段。语法合法不代表任意网络环境都能连到 raw GitHub；导入或刷新时可能需要可用代理。

## 用户恢复步骤

1. 通过可用网络路由或代理，从[官方 Shadowrocket 配置](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Shadowrocket/Shadowrocket.conf)导入。
2. 替换含已退休 `a1/fin.txt` 引用的旧配置副本，再刷新规则；新版配置不要继续使用 jsDelivr 导入 URL。
3. 如果网络不能直连 GitHub raw，使用可用代理。换用同仓库的另一个 jsDelivr 域名不能绕过本次观察到的仓库级 package 限制。

当前 `main` 的配置/源码已不含已退休的 DoingDog `a1/fin.txt` 引用；不要重新添加该引用，也不要把 a3/a4 当作等价来源替代。

根 README 使用相对目录入口，没有自有 jsDelivr 导入 URL。FlClash 的自有 jsDelivr 备用导入链接已删除；Passwall/Passwall2 的规则 URL 示例与实际生成产物一并使用 raw。

## 下载验证与验收边界

本地验证器检查 Shadowrocket 配置实际 `RULE-SET` URL 的 HTTP 状态、响应非空和内容哈希：

```powershell
node tools/verify-rule-asset-downloads.js --timeout 60 --output .cache/issue-186/download-check.json
```

curl 不自动沿用 Windows 的 WinINET 系统代理。需要代理时明确指定现有 HTTP 代理端口；此选项不改变系统代理或客户端节点。比如本次主机的现有端口为 `33966`：

```powershell
node tools/verify-rule-asset-downloads.js --proxy http://127.0.0.1:33966 --timeout 60 --concurrency 1 --deadline 600 --output .cache/issue-186/download-check-final.json
```

其他机器替换为实际 HTTP 代理端口。请求超时、连接超时、整批 deadline、有限重试分别受控；传输错误优先于空正文分类，避免有错误的 HTTP 200 被遗漏重试。代理凭据不会写入报告，完整字节和内容哈希验收门槛不变。参数语义见 [curl 官方手册](https://curl.se/docs/manpage.html#--proxy)。

成功数量和失败项必须以验证器完成后保存的 `.cache/issue-186/download-check.json` 为准；未读回该文件前不报告成功数字。URL 获取成功不等于 Shadowrocket 真机导入或运行时分流已通过。是否已发布，以 commit 和远端引用状态为准；本说明本身不判定发布状态。

### 本次本地验收记录（2026-10-15）

- 严格产物合同：2483 项检查、19 个产物通过；599 个唯一远程资产和 13 个客户端聚合预算通过。正式 OpenClash `.sh` 通过；旧备用 `.conf` 的既有版本提示仍保留。
- URL 识别、空规则引用、HTTP 下载、来源收据、冻结载荷、分流与测速选项相关回归通过；独立复核未发现阻断性代码问题。
- `fused/clash`、`mihomo`、`sing-box`、`surge`、`quantumultx` 五个目录的规则载荷没有 Git 内容差异。来源语义比较的 `hasChanges=false`，before/after identity 同为 `d14fc2b9e003ad430e478ec406e117809768e2341552bdcebfa1f945a61e4821`。本次不刷新上游 provider，复用原有 MRS/SRS；生成器的来源和载荷门槛保持启用。
- 2026-10-15 07:13 JST 在线批次：77 个实际 Shadowrocket URL 中，76 个完整 GET 且内容哈希匹配；广告文件返回 HTTP 200 后发生 Schannel 提前断开，批次结果为失败。失败记录保留在 `.cache/issue-186/download-check.json`。
- 首轮对同一广告 URL 的 60 秒有界诊断也提前中断，收到 7,334,016 / 12,467,261 bytes；内置浏览器返回 `ERR_CONNECTION_CLOSED`。这些失败记录保持原样，没有被改为成功。
- 无 query 的广告 URL 在两种 curl 路径下均完整返回 12,467,261 bytes，SHA-256 为 `d0d6471c50becf0e508d494758b60a24b7ee32a103677e426c9d76457bb2fa49`，与本地 LF 规范化哈希相同。两类 URL 响应头一致且均命中缓存，现有证据不能断定 query 是原因；此对照没有覆盖或替代实际配置 URL 的失败记录，也没有放宽哈希门槛。

### 完整下载缺口闭合（2026-10-15）

- 查明工具原先没有传入已启用的系统 HTTP 代理，curl 走另一条 fake-IP/TUN 路径；实际 query URL 经现有 HTTP 代理完整下载，耗时 16.66 秒，超过原先硬编码的 15 秒请求上限。成功对照保存在 `.cache/issue-186/download-check.ad-transport-success.json`。
- 修复工具的显式代理、可配置超时、连接上限和空正文传输错误分类后，首轮完整扫描得到 72/77；仅对五个失败 URL 做一次有界串行补验，五项均首次完整 GET 并匹配哈希。小至 148/260 bytes 的文件也曾发生中断或 CONNECT 超时，因此现有证据不支持“广告文件太大”或“query 必然失效”的判断。
- 完整收据为 **77/77，通过率 100%，零内容哈希不符**，记录于 `.cache/issue-186/download-check-complete.combined.json`。这是首轮成功项与明确列出的补验项的分时收据；每项保留时间，不能描述成同一轮扫描。原失败批次及五项补验文件均保留。
- 广告文件完整响应为 12,467,261 bytes，SHA-256 为 `d0d6471c50becf0e508d494758b60a24b7ee32a103677e426c9d76457bb2fa49`；保留配置的实际 `?scki=v6.0.19`，没有删除 query、Range 拼装、忽略 TLS 错误或放宽哈希验收。

验收范围是实际配置 URL 的完整下载和内容一致性。发布状态以 Git commit、远端引用及线上配置读回为准；这份 URL 验收不声称获得了 Shadowrocket 真机运行证据。
