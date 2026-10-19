# 官方版本、能力研究与文档缓存（2026-10-19）

研究从干净的 `main` 基线 `079b5463c206271ade7b563661f49832f18e25c4` 开始，覆盖全部 14 类客户端及相关内核、GUI。初次缓存 241 项中的 240 项；二次复核补存 7 份 Passwall 普通节点类型源码，当前 **248 项中 247 项成功**，仅 Shadowrocket 帮助站仍待核。

范围包括稳定/预发布渠道、规则与 DNS 文档、生成/导入源码及核心绑定关系。缓存限于来源清单，**不是官网完整镜像**；版本不代表设备已安装。报告保留 UTC 发布时间，任务日期采用 Asia/Tokyo。

## 研究与原文入口

| 责任范围 | 原始来源 | 成功 / 未取得 | 报告 |
| --- | --- | --- | --- |
| Mihomo、Smart、Clash Party、CMFA、OpenClash、FlClash、ClashMi、ShellCrash、Clash Verge Rev | [清单](mihomo/sources.json) / [收据](mihomo/manifest.json) | 57 / 0 | [版本、运行时和采用决定](mihomo/report.md) |
| sing-box、原生 SFA/SFI/SFM、Xray、v2rayN、Passwall/PW2、Hiddify、HomeProxy | [清单](singbox/sources.json) / [收据](singbox/manifest.json) | 105 / 0 | [schema、后端与导入边界](singbox/report.md) |
| Surge、Stash、Egern、Loon、Quantumult X、Shadowrocket | [清单](apple/sources.json) / [收据](apple/manifest.json) | 56 / 1 | [苹果客户端能力复核](apple/report.md) |
| Karing、Happ（Desktop/Android/iOS 分别核对） | [清单](consumers/sources.json) / [收据](consumers/manifest.json) | 15 / 0 | [额外消费者与格式](consumers/report.md) |
| Sub-Store 后端与前端 | [清单](substore/sources.json) / [收据](substore/manifest.json) | 7 / 0 | [订阅管理边界](substore/report.md) |

表格保留初次快照；二次补存后 singbox 组为 **112 / 0**，总计 **247 / 1**，以当前 manifest 为准。

原文位于 `bodies/<SHA256>.gz`；收据绑定 URL、时间、HTTP 元数据与原文/gzip 哈希。GitHub raw 固定 commit，清单按 LF 计算哈希，远程正文保留原字节。旧收据存于 `manifests/`。

14 份原 REFERENCE 均保留历史正文并追加本次核对范围；不把旧摘要的所有字段冒称为当前事实。[baseline.json](baseline.json)记录原 Git blob 与原文字节哈希；原参考文档 ZIP 位于本机 `.cache/official-docs-20261019/references-before.zip`，也可从上述基线 commit 恢复。

## 主要稳定版本与渠道区分

| 产品 | 当前稳定/公开 Latest | 需另行区分 |
| --- | --- | --- |
| Mihomo | 1.19.32 | MetaCubeX Alpha 与 vernesong Smart 是不同分支；Smart 无非预发布 stable |
| Clash Party / CMFA | 2.0.4 / 2.11.35 | App 号不能替代其打包核心 revision |
| OpenClash / FlClash | 0.48.002 / 0.9.1 | OpenClash 可独立选核；FlClash 绑定自己的核心 fork |
| ClashMi / Clash Verge Rev / ShellCrash | 1.0.31.1703 / 2.5.8 / 1.9.4 | ClashMi 1.0.32.1800、Verge autobuild 属预发布 |
| sing-box | 1.14.3 | 1.15.0-alpha.12 是预发布；各 GUI 另核实际核心 |
| Xray | 26.3.27 | 26.10.17 被官方标记预发布，不能按数字更大视为稳定 |
| v2rayN / Passwall / Passwall2 | 7.25.6 / 26.10.16-2 / 26.10.1-2 | Passwall 插件双后端不代表两者都支持 SRS |
| Hiddify app / 独立 hiddify-core | 4.1.1 / 5.0.3 | App stable 仍固定 4.1.0 核心依赖及 1.13 分支；不能拼接两个 latest |
| HomeProxy | 无公开 GitHub release | 记录固定源码 commit，不虚构版本号 |
| Surge iOS / Mac | 5.23.0 / 6.10.0 | Mac beta 6.11.0 单列，feed title 与 enclosure 冲突保留 |
| Stash iOS / Mac | 3.6.4 / 4.3.3 | Mac beta 4.4.0；Wiki 更新页落后于 App Store / feed |
| Egern / Loon / QX / Shadowrocket | 2.20.0 / 3.5.2 / 1.8.1 / 2.2.92 | 未取得官方预发布信息时标 pending，不凭社区推断 |
| Karing | 1.2.25.2802 | 1.2.26.2908 是预发布 |
| Happ Desktop / Android / iOS US | 4.5.4 / 4.7.1 / 6.1.0 | 各平台独立发版 |
| Sub-Store 后端 / 前端 | 2.42.6 / 2.34.1 | 转换能力不等于目标客户端已支持该协议 |

每个版本的官方链接、精确发布时间、固定源码和采用决定见各组报告；本表不复制全部发布说明。

## 已采用的兼容修复

| 产物 | 实际改动与证据 | 当前版本 / 验证 |
| --- | --- | --- |
| Clash Party Smart / OpenClash Smart | 当前 SmartOption 已移除 `strategy`，删除两处 sticky-sessions；修正 Smart/Alpha 识别、模型字段与 OpenClash 固定自定义脚本部署入口 | `v6.0.20-dns.20` / `v6.0.20-oc-smart.15`；JS/Ruby 合同 |
| sing-box | 去非标准 `_meta`，迁 typed DNS、路由嗅探与命名 HTTP client；同一生成器输出 [Full](../../../SingBox/SingBox%28sing-box%29-full.json) 和 [1.13 兼容版](../../../SingBox/SingBox%28sing-box%29-1.13.json) | `v6.0.20-sing.10`；官方 1.14.3 / 1.13.14 实际 check，0 跳过 |
| Surge | 删除未识别的 `[DNS]` 及两无效键；四个加密 DNS、普通 DNS 和出站选项保持实际值 | `v6.0.20-Surge.11`；活动节独立比较 |
| Quantumult X | 按官方样例将四个 DoH 写为同一行，保留地址和顺序；不宣称已复现多行 last-wins | `v6.0.20-QX.11`；列表/规则段独立比较 |
| Passwall / Passwall2 | 任何 UCI 写入前检查全部 `_shunt` 节点，仅接收 sing-box；Xray、未知/缺失后端、无 shunt、整体或单节点读取失败均停止 | `v6.0.20-pw.10` / `v6.0.20-pw2.10`；18 项真实 POSIX shell 夹具测试 |

二次复核将后端预检细分为节点类型与协议：合法普通 Socks 等节点可缺少 `protocol`；潜在分流后端仍须严格读取，未知类型及 Xray 分流仍拒绝。Shell 回归已增加普通节点与混合后端场景，当前结果见验证收据。

协议与导入边界均按官方证据校正：QX REALITY/Vision 分开判断；Happ Profile 不等于 v2rayN 数组；HomeProxy 从 UCI 重建；Hiddify 需核对完整模式和绑定核心。能力矩阵同步纳入两版 sing-box 配置。

sing-box 迁移有一项上游行为限制：新嗅探辅助 SNI/Host 匹配，无法等价保留旧字段动态重写拨号目的的行为，IP 目的仍拨原 IP。已补存新旧固定源码并在[迁移边界](singbox/report.md#嗅探迁移的行为边界)明确说明；schema check 通过不代表这一旧行为恢复。

## 全产物影响与未采用功能

规则图仍为 **v6.0.20**，业务 provider、目标、顺序与融合载荷不变。仅更新生成器源码哈希及其引用收据，并将 1.13 JSON 加入自动刷新产物清单；未刷新远端规则。

| 目录 | 本次范围 / 不同步运行载荷的理由 |
| --- | --- |
| Clash Party | 仅 Smart schema 与文档；Normal 使用 url-test，无失效 Smart 参数 |
| CMFA | 参考与日志；原生 Mihomo YAML 不含本次 Smart/其他平台失配 |
| OpenClash | Smart 参数与部署文档；Normal 无相应 Smart 字段 |
| FlClash | 参考与日志；App patch 边界记录，无证据需改当前 url-test 脚本 |
| Stash | 参考与日志；保守生成结果仍有效，新 DNS/inline 能力有更高版本门槛，tolerance 最低版本证据不足 |
| Shadowrocket | 参考、协议比较与日志；帮助站官方归属/正文 pending，不猜新 DNS 字段 |
| Surge | 官方语法修复、文档与版本；不改区域算法为 Surge Smart |
| Loon | 参考、协议比较与日志；当前原生规则结构保持 |
| Quantumult X | DoH 写法、文档与版本；策略和规则结构保持 |
| Egern | 参考与日志；原生 YAML rule_set 继续使用，不猜 Mihomo MRS 支持 |
| SingBox | 同源两版 schema；保留原 97 条业务路由顺序，新增 1 条非终结嗅探，共 98 条、54 个组 |
| v2rayN | 参考、Happ 格式边界与日志；原生 Xray 数组内容保持 |
| Passwall / Passwall2 | 后端安装门禁与文档；78 个 SRS URL、列表和相对顺序保持 |

测速算法、TUN 栈、Surge Smart、Stash 新 DNS/inline、sing-box optimistic/race、Alpha 新协议等没有明确需求或运行测量，本次仅记录门槛与收益/代价，不默认启用。App 的 UI、订阅、缓存和恢复改进通常不要求修改业务分流规则。

## 验证与后续读回

[validation/](validation/)保存命令日志，[verification.json](verification.json)汇总最终检查。初轮 82 项 Node 回归和 3 项能力矩阵测试通过；二次复核补测普通节点、刷新清单、错误核心路径及完整 CI 检查，修正发现的问题后再发布。严格跨端合同为 **2,493 检查 / 20 产物**，三 JS 入口、进程直连、资产预算及两版官方核心检查通过；规则语义比较为零变化、零未决。旧格式失败保留在 [sing-box 收据](singbox/verification.json)。

README 共检查 25 份，精简其中 20 份正文；所有表格、图示、图片及徽章逐块保留。仅修正或删除有依据的过时/冗余代码示例，保留必要安装与验收步骤。详细前后哈希、范围和复核结果见验证目录。

```bash
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --verify
node tools/cache-official-docs.js --group docs/upstream/2026-10-19/mihomo --read smart-group-source
```

五组各自执行 `--verify` 即可离线解压、哈希与 URL 绑定读回。后续核对新版本建议新建日期目录；`--refresh` 才重新下载，普通重跑保留原抓取时间。`--github-cli` 仅使用本机现有 gh 登录执行公开 API 读取，收据不保存凭据。

设备侧尚未验收：苹果/Android GUI、Hiddify 完整导入、HomeProxy UCI 转换、OpenWrt 流量、DNS 故障切换、TUN 与性能。静态和核心检查不替代这些结果，Shadowrocket 帮助站缺口仍保留。本轮按用户授权复核、精简 README 并发布 main；发布结果以远端提交和 CI 读回为准。
