# Stash — 变更日志

> 本文件记录 Stash 专用 YAML 产物的变更。详细平台字段依据见 `REFERENCE-Stash-wiki.md`。

---

## v6.0.20-stash.13 (2026-10-20)

- 从更新后的 CMFA 生成并继承业务 DNS policy；Stash 保留原生 DNS policy 语义，不改组结构、节点择路或规则载荷。参见 [Stash DNS 文档](https://stash.wiki/en/features/dns-server)。


## 2026-10-19 — 官方文档与版本核对

- 缓存当前官方发布记录、配置文档和适用源码，更新 REFERENCE 时效与能力边界；详见[核对报告](../docs/upstream/2026-10-19/apple/report.md)。本次文档核对不改变本产物的规则、策略组或生成载荷。

## v6.0.20-stash.12 (2026-10-16)

- Issue #187：在既有 `scki-adfp-direct` 中为 `szlong.weixin.qq.com`、`hklong.weixin.qq.com`、`hkshort.weixin.qq.com` 增加精确 DIRECT 例外，防止微信连接端点先命中广告集合。
- 不扩大到父域或子域，`ad.weixin.qq.com`、`log.weixin.qq.com` 保持广告拒绝；不改变其他策略或规则顺序。
- 继续通过现有生成器消费融合资产，保留本平台原生规则语法；不手工修改生成文件。
- 依据与有限静态验收范围见[微信连接复查](../docs/research/2026-10-16-wechat-issue-187.md)；报告者设备是否恢复仍待实际复测。

## v6.0.19-stash.11 (2026-10-15)

- FIX#186：自有远程规则资产统一使用 GitHub raw HTTPS，避开 jsDelivr 仓库大小门槛；保留版本查询参数与原生格式。
- 复用已验证的融合载荷，规则内容、顺序和策略不变；补充 raw/CDN 引用识别回归。原因、下载前提与官方字段依据见[规则下载说明](../docs/rule-asset-delivery.md)。

## v6.0.18-stash.10 (2026-10-14)

- 修复跨服务首匹配误归类；规范 Apple/Microsoft 过宽关键词和共享 AWS/Azure/CDN 后缀，加入 game-cn、microsoft-live、microsoft-ai、intl-site、stream-jpkr、tools、social、bytedance-app 八类 guard。证书吊销/状态查询的 CA 精确主机直连与微软邮件精确国际策略新增 6 条 ADFP 记录，总数 35。`api.byteoversea.com` 作为精确 TikTok 规则，不扩共享后缀。保留现有 Claude Desktop `a-api`/`a-cdn` 精确例外、QUIC/测速选项和默认关闭的 ZeroTier 代理开关。Crisp relay 仅为静态 ASN 覆盖风险推断，并非实测事故。
- 源规则图 v6.0.18：525 providers / 984 source rules；生成 149 Mihomo providers / 168 main rules / 19 inline rules / 107 MRS / 78 non-empty SRS across 81 segments。

## v6.0.17-stash.9 (2026-10-13)

- 在现有 `scki-adfp-ai` 精确加入 `a-api.anthropic.com` 与 `a-cdn.anthropic.com`，供 Claude Desktop 应用代码和用户内容加载所需主机走 AI 服务策略。依据 [官方 Desktop 网络要求](https://code.claude.com/docs/en/desktop#network-access-requirements)；不推断 `a-api` 的具体路径。
- 本端规则集与原生语法沿用现有实现；来源语义 gate、29 条 ADFP 例外校验、Claude 服务阶段清单及文件级发布批次检查接入同一发布链。详见 [Claude 服务依赖台账](../docs/claude-service-dependencies.md) 与 [发布批次检查](../docs/release-batch.md)。未进行真机故障复现或测量。


## v6.0.16-stash.9 (2026-10-12)

- 本端随 v6.0.16 主线登记来源/版本收据、有序 domain-projection 差分及现有 ADFP 例外双向校验；客户端转换格式、规则顺序和目标策略沿用既有实现，未新增运行时规则。详见[规则质量台账](../docs/rule-quality.md)。
- 复用当前 fused 载荷，只记录当前可观察字节及转换收据；旧资产的原始远端输入 SHA 无法从输出反推，因此不宣称完整历史来源追溯，也未进行真机流量测量。

## v6.0.15-stash.9 (2026-10-07)

- 由 CMFA 生成的可测速组在 `standard` 默认档保持 300 秒并启用官方支持的 `lazy: true`；`power-save` 仍用 900 秒加 `lazy: true`。QUIC 默认策略不变。

## v6.0.15-stash.8 (2026-10-07)

- 从 CMFA 派生的 YAML 支持 900 秒间隔、lazy 与海外 UDP/443 策略选择。
- 切换命令、平台能力及验证方法见 [测速与 QUIC 策略选项](../docs/traffic-options.md)。

## v6.0.14-stash.7 (2026-09-30)

- SYNC：从 CMFA v6.0.14-cmfa.7 重新生成；延续只使用已确认 Stash 字段的策略，裁剪其未公开支持的 `exclude-type` / `empty-fallback`，不宣称具有 Mihomo 的类型过滤与空池 REJECT 语义。
- META：修正生成器对 CMFA 无缩进规则列表的计数，头部正确显示 151 条主规则。
- DOCS：具名直连支持出站与测速 provider 分离，链路需在聚合层检查；详见 README 与 [平台取舍](../docs/research/2026-09-30-routing-runtime-followup.md)。规则内容不变。

## v6.0.14-stash.6 (2026-09-29)

- 由 CMFA v6.0.14-cmfa.6 受控重建；微信 HTTPDNS 两个精确域名通过首段 DIRECT 融合资产优先于 BlockHttpDNS 拦截。

## v6.0.13-stash.5 (2026-09-03)

- 由 CMFA v6.0.13-cmfa.5 受控重建；`linuxdo.org` 及子域通过第 013 融合资产进入 `🏠 国内网站`，`linux.do` 仍走受限网站。

## v6.0.12-stash.4 (2026-09-01)

- 由 CMFA v6.0.12-cmfa.4 受控重建；`login.nvidia.cn` 通过首段融合资产精确直连，其余 NVIDIA 域名继续走下载组。

## v6.0.11-stash.3 (2026-08-22)

- 由 CMFA v6.0.11-cmfa.3 重新生成；Gemini 与 Accademia Gemini 首命中进入 `🔍 Google 服务`，宽泛 szkane AI 规则不变。

## v6.0.10-stash.3 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：由 CMFA v6.0.10-cmfa.3 重新生成；两个网易游戏服务主机随首段融合直连资产优先于 anti-AD 与国内游戏规则。

## v6.0.9-stash.2 (2026-08-08)

- FIX-APAC-HOME-REGEX：由 CMFA v6.0.9-cmfa.2 重新生成；`🏡 亚太家宽` 的筛选正则现可正常编译。
- GUARD：CMFA/Stash 全部策略组 `filter` 均纳入合同验证的语法编译检查。

## v6.0.9-stash.1 (2026-07-19)

- 由 CMFA v6.0.9-cmfa.1 重新生成；`api.github.com` 通用请求在广义 AI 规则前进入工具组，进程例外取决于运行平台能力。

## v6.0.8-stash.1 (2026-07-15)

- 从 v6.0.8 CMFA 重新生成，继承国内权威优先级与版本化 Mihomo 规则缓存路径。

## v6.0.7-stash.1 (2026-07-14)

- FIX#176：由 CMFA v6.0.7-cmfa.1 重生成；Stash 继承国内域名优先于共享 CDN / GeoIP 国际兜底的融合规则顺序。

## v6.0.6-stash.1 (2026-07-14)

- DIRECT-WORKPRO-WEB：由 CMFA v6.0.6-cmfa.1 重新生成；fused direct residual 同时保留 WorkPro 父进程与 Web 子进程，实际命中取决于底层内核的进程匹配能力。

## v6.0.5-stash.1 (2026-07-14)

- DIRECT-WORKPRO：由 CMFA v6.0.5-cmfa.1 重新生成；同一 fused direct residual 保留 WorkPro.exe，实际进程命中取决于底层桌面内核能力。

## v6.0.4-stash.1 (2026-07-13)

- DIRECT-ITWDB：由 CMFA v6.0.4-cmfa.1 重新生成，Stash 消费同一默认 `DIRECT` 融合 MRS，覆盖 `itwdb.com` 及其子域名。

## v6.0.3-stash.1 (2026-07-12)

- SYNC：由 CMFA v6.0.3-cmfa.1 重新生成，保留 124 个融合 rule-provider 与 141 条规则。
- FIX#FUSED-DOMAIN-PAYLOAD：Stash 消费的融合 MRS 已使用原生 domain payload；不可安全转换的 keyword / regex 继续以 residual YAML 表达。
- BUILD：产物头部 provider / rule / source 统计改从 CMFA 与 fused manifest 动态读取，避免生成器遗留旧数字。

## v6.0.2-stash.1 (2026-07-10)

- SYNC：由 CMFA v6.0.2-cmfa.1 重新生成，保留 113 个融合 rule-provider 与 130 条规则。
- PERF：`.mrs` / residual 资产总量约 6.65 MiB；GEOIP 作为 residual 原生查询，不再转换为海量 CIDR。
- CONTRACT：继续按 Stash 官方兼容字段裁剪，并纳入 32 MiB 客户端聚合预算。

## v6.0.1-stash.1 (2026-07-10)

- SYNC：由 CMFA v6.0.1-cmfa.1 重新生成，继续保留融合后的 113 个 rule-provider 与 130 条规则。
- DELIVERY：Stash 仍消费 Mihomo `.mrs` / residual YAML；Issue #174 的 CDN 大文本分片不会改变 Stash 的规则语义或平台字段裁剪。

## v6.0.0-stash.1 (2026-07-09)

- SYNC：由 CMFA v6.0.0-cmfa.1 重新生成，保留融合后的 `113` 个 rule-provider 与 `130` 条规则。
- COMPAT：继续按 Stash Wiki 裁剪 Mihomo 扩展字段，Stash 不直接参与基准判定。

## v5.4.39-stash.1 (2026-07-09)

- SYNC：由 CMFA v5.4.39-cmfa.1 重新生成，保留 474 rule-provider 与 929 条规则。
- MIHOMO-MRS：继承 CMFA 的 `.mrs` partial 架构，424 个 provider 使用 `.mrs`，30 个 provider 使用残余 YAML，20 个 provider 保留原格式。
- COMPAT：继续裁剪 Stash Wiki 未确认的 Mihomo-only 字段；静态 YAML 中直接写最终 `.mrs` / 残余 YAML 地址，不保留 JS 兼容映射表。

## v5.4.38-stash.1 (2026-07-09)

- SCKI-SUPPLEMENTAL：由 CMFA v5.4.38-cmfa.1 重新生成，保留 429 rule-provider 与 884 条规则。
- MIHOMO-MRS：继承 CMFA 的 `.mrs` 迁移结果，366 个 provider 使用 `.mrs`，同时继续裁剪 Stash Wiki 未确认的 Mihomo-only 字段。
- COMPAT：Stash 继续裁剪 Mihomo-only 字段；补充规则集使用 Stash 可识别的 rule-provider 结构。

## v5.4.37-stash.1 (2026-07-07)

- FEAT#173-STASH：新增 `Stash/Stash.yaml`，由 `tools/generate-stash-from-cmfa.js` 从 CMFA 自动裁剪生成。
- SYNC：保留 Clash Party v5.4.37 / CMFA v5.4.37-cmfa.1 的 22 区域组、33 业务组、376 rule-provider 与 1000 条规则。
- COMPAT：删除 Stash Wiki 未确认的 Mihomo 扩展字段：GeoX 自动更新、sniffer、provider `health-check` / `exclude-filter`、rule-provider 下载 `proxy`、Mihomo DNS fallback / direct / proxy-server nameserver 字段。
- DNS：`default-nameserver` 改为 Stash 官方示例兼容的明文 IP；保留国内/国外 `nameserver-policy` 与完整 `fake-ip-filter`。
- VERIFY：`tools/validate-artifact-contracts.js` 新增 Stash 合同检查，CI 路径触发包含 `Stash/**/*.yaml` 与 `tools/generate-stash-from-cmfa.js`。
