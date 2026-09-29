# Stash — 变更日志

> 本文件记录 Stash 专用 YAML 产物的变更。详细平台字段依据见 `REFERENCE-Stash-wiki.md`。

---

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
