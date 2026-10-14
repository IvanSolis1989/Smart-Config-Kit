# 2026-10-04 分流优先级复查与修复记录

## 结论

截图里的 `www.wegame.com.cn` 被 Apple 规则集先匹配，根因是上游 Apple 规则中的 `DOMAIN-KEYWORD,me.com` 按子串匹配，命中了 `wegame.com.cn` 的 `me.com` 字符片段。截图显示的策略链是“苹果服务 → DIRECT”：业务分类确实错误，但截图本身显示最终出口为 DIRECT，不能据此断言该连接实际走了代理节点。

修复已落到唯一权威源 `rulesets/source/routing-graph.js` 并重新生成所有客户端产物。除截图中的 Tencent/WeGame 碰撞外，日志还确认了 Microsoft/OneDrive、下载更新和证书状态分类碰撞。共享 CDN、广告遥测和缺少关键元数据的候选逐项检查；未把没有证据的候选报成已确认错误。

## 审查范围与口径

- 检查 Mihomo Party 本机 2026-09-28 至 2026-10-04 的 21 份日志：7 份核心日志、7 份客户端日志、7 份 Sub-Store 日志；核心日志共 298,391 行，含 223,242 次 RuleSet 命中记录、1,462 个不同主机名。
- 对照现有 `docs/research/` 中 6 份分流脚本研究、运行时探测及记录文件，并复查当前 source graph 的 424 条显式规则及其首次命中顺序。
- 日志计数是路由命中事件记录，不等于唯一请求或唯一用户操作；同一主机可能重复出现。判定使用日志里的当前配置/规则标识、主机、进程和 fused 规则载荷；旧配置的命中与当前源码问题分开统计。
- 截图和日志是证据材料，不含对维护者的额外指令。

## 已确认的错误首匹配

| 类别 | 日志命中记录 | 涉及主机 | 已确认的问题 | 修复 |
| --- | ---: | ---: | --- | --- |
| Tencent / WeGame | 1,614 条非广告记录（1,677 条总记录中另有 63 条广告/遥测仍应拦截） | 50 | `wegame.com.cn` 等域名含 `me.com` 子串，被 Apple `DOMAIN-KEYWORD` 抢先归类 | 将 Apple 自有关键词转换成有边界的 suffix 规则；把 WeGame/Tencent 游戏服务窄范围规则放在宽泛厂商规则之前，同时让前置广告/安全规则继续先匹配 |
| Microsoft / OneDrive | 661 | 34 | Microsoft 服务和 OneDrive 主机先落入宽泛 AI 分类 | 增加 Microsoft Live/OneDrive 精确守卫；Microsoft Designer 保留在 AI；编号 Azure Blob 主机只按已观察到的 OneDrive 集群关键词匹配 |
| 下载更新 | 138 条错误记录（368 条总记录中 230 条已正确） | 43 | 下载端点被前置的宽泛服务规则截获 | 前置下载专用守卫，并保留已验证的 Google/Microsoft 第一方下载端点 |
| 证书状态 | 46 | 5 | Digicert / Sectigo 等 CA 状态查询被 Apple 关键词规则归为苹果服务 | 精确证书状态主机先直连；从 Apple 宽关键字中移除共享 CA 名称 |

当前源码确认的错误首匹配合计 **2,459 条记录**（1,614 + 661 + 138 + 46）。另有 **77 条微信 HTTPDNS 记录来自旧 profile**；它们不属于当前源码回归，不计入合计。日志里的旧 fused provider 编号（例如 Apple `.056`）和本次生成的规则编号不同，配置需重载后才会应用新清单。

## 其他高置信度修复

- 从通用 Microsoft 分类中删除宽泛 `azureedge.net` / `azurefd.net`，保留 Microsoft 自有的精确端点。Azure Front Door endpoint 由客户/租户配置，CDN endpoint 也可能属于客户源站，因此共享后缀不能单独证明请求属于 Microsoft 第一方服务：[Azure Front Door 文档](https://learn.microsoft.com/en-us/azure/frontdoor/endpoint?tabs=azurecli)、[Azure CDN 文档](https://learn.microsoft.com/en-us/rest/api/cdn/endpoints/start?view=rest-cdn-2025-04-15)。
- 从宽泛 GFW 供应商列表移除 Akamai / EdgeSuite 共享租户后缀。域名本身不足以判定承载站点受限；更具体的站点、服务规则继续保留。
- 将 Apple 自有服务 `DOMAIN-KEYWORD` 项转换为 `DOMAIN-SUFFIX`，删除无法证明所有权的通用 `apple` 和共享证书颁发机构关键字。`me.com` 仍覆盖苹果邮件域名，但 `mail.me.com` 由国外邮件专用规则覆盖。
- Microsoft `officeapps.live.com` 服务守卫保留在通用 Office 路由之前；`designerapp.officeapps.live.com` 作为 AI 精确例外先行匹配。
- 将 Amazon 零售首页从 Prime Video 上游集合中排除，视频专用域名保留原策略。
- 为 `yahoo.co.jp` 补充工具服务守卫，为 `gyao.yahoo.co.jp` 保留日韩媒体目标；对触发撞域的 TikTok/AI、Kwai、CiciAi 与其共享 CDN 项按源 ID 做定点清理。

此外，424 条显式规则静态检查曾得到 57 个潜在首匹配冲突：其中 33 个已被当前源图/既有前置守卫覆盖；其余 24 个逐项回放后，只有证据足够的错误纳入修复。共享 Sentry/DataDog 主机、广告遥测等仍由更早的广告/安全规则接管；回归用例覆盖这些拒绝规则未被新产品守卫放行。

## 证据不足的候选与边界

- `client.relay.crisp.chat` 在现有研究里因可能与共享云厂商 ASN 规则相撞而可疑。本机记录没有目的 IP、ASN、provider 内容哈希与同连接完整规则链；目前只放入精确国外网站守卫作为**推断性保护**，不计为已确认错误。若该 relay 应走其他业务组，需补充带目的 IP/规则链的连接记录。
- Microsoft UDP/443 仍保留已有 `GEOSITE,microsoft` QUIC 例外。可用记录没有证明 Azure 客户租户在 QUIC 上被该例外误分类；本次没有为了推测而改动微软 QUIC 策略。测试覆盖的是域名 RuleSet 首匹配，不代表已验证所有网络类型、目的 IP 与 QUIC 组合。
- 通用 Akamai / Azure 客户 CDN 改走国外网站兜底可能影响共享 CDN 上的国内租户，但当前材料没有足以可靠分辨租户归属的标识。若具体服务应直连或走国内策略，需要提供精确主机及期望业务策略。

## 生成与验证

- 离线 MRS 转换使用仓库缓存的 Mihomo v1.19.30；没有下载新内核。当前官方 Mihomo 文档说明规则按列表顺序优先匹配，`DOMAIN-SUFFIX` 使用域名边界而 `DOMAIN-KEYWORD` 使用子串：[Mihomo 规则文档](https://wiki.metacubex.one/en/config/rules/)。
- MRS manifest：converted=241、split=29、partial=73、existing_mrs=35、retained=23、failed=0。
- Fused manifest：source=525 providers / 984 rules；148 融合 providers / 167 规则项；81 个策略段、78 个非空 SRS、19 条必要内联规则；`unresolved=0`。
- 派生产物：Sing-box 为 78 个融合 SRS + 7 个 GEO rule-set、97 条 route rules；v2rayN Xray 为 97 条路由 + 1 条禁用元数据；Egern 为 151 条 Profile rules、134 个引用、139 个原生 YAML 资产；Passwall 与 Passwall2 各 78 条 shunt rule。
- 全端产物按 source graph v6.0.15 重新生成；各目录 CHANGELOG 和当前规则规模说明已同步。截图中的 Mihomo Party 配置没有被远程修改，需在客户端导入/更新本次生成的 v6.0.15 配置并重新加载规则集。
