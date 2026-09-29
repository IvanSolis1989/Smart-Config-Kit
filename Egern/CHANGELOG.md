# Egern — 变更日志

## v6.0.14-egern.5 (2026-09-29)

- SYNC：重建 Egern 原生规则集，第 001 DIRECT provider 加入微信 HTTPDNS 两个精确域名，先于 BlockHttpDNS 拦截生效。
- VERIFY：保持 125 个原生资产、137 条规则与 120 个 rule_set 引用。

## v6.0.13-egern.4 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：以 `39b9a1e` 固定载荷重放原生 rule_set，仅在第 013 国内网站 provider 增加 `linuxdo.org`。
- SYNC：保持 125 个原生资产、137 条规则与 120 个 rule_set 引用；`linux.do` 的第 059 受限网站语义不变。

## v6.0.12-egern.3 (2026-09-01)

- FIX#181-PC：以 `HEAD` 固定载荷重放原生 rule_set，仅在首段 DIRECT provider 增加 `login.nvidia.cn`；保持 125 个原生资产、137 条规则与 120 个 rule_set 引用。

## v6.0.11-egern.2 (2026-08-22)

- Profile 与原生 rule_set 由 CMFA v6.0.11-cmfa.3 重生成；Gemini 与 Accademia Gemini 首命中为 `🔍 Google 服务`，不改 szkane AI 规则。

## v6.0.10-egern.2 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：由 CMFA v6.0.10-cmfa.3 重新生成首段原生 YAML rule_set；两个网易游戏服务主机优先于 anti-AD 与国内游戏宽规则。

## v6.0.9-egern.1 (2026-07-19)

- 正式 Profile 由 CMFA v6.0.9-cmfa.1 重生成；通用 `api.github.com` 原生规则集前置到工具组，两个 Windows 进程逻辑规则明确跳过而不伪造兼容性。

## v6.0.8-egern.1 (2026-07-15)

- 原生 YAML rule_set 同步国内权威优先级，并支持带发布缓存键的 Mihomo 融合源解析与 Egern 资产引用。

## v6.0.7-egern.1 (2026-07-14)

- FIX#176：正式 Profile 由 CMFA v6.0.7-cmfa.1 重生成；Egern 原生 `rule_set` 顺序使国内域名 guard 先于通用国际 CDN / `geoip_set` fallback。

## v6.0.6-egern.1 (2026-07-14)

- PLATFORM：正式 Profile 已由 CMFA v6.0.6-cmfa.1 重新生成；Egern 原生规则集明确跳过 Windows `PROCESS-NAME` 条目，`WorkPro.exe` / `WorkProWebProcess.exe` 不被伪装为不兼容规则。

## v6.0.5-egern.1 (2026-07-14)

- PLATFORM：正式 Profile 由 CMFA v6.0.5-cmfa.1 重新生成；Egern 官方规则不提供 Clash 风格 PROCESS-NAME，WorkPro.exe 保持明确省略而非伪装同步。

## v6.0.4-egern.1 (2026-07-13)

- DIRECT-ITWDB：正式 Profile 与 Egern 原生 YAML 规则集已从 CMFA v6.0.4 重建，默认 direct domain set 包含 `itwdb.com`，覆盖 WorkPro 子域名。

## v6.0.3-egern.1 (2026-07-12)

- SYNC：由 CMFA v6.0.3-cmfa.1 重建正式 Profile 与 Egern 原生资产；源端为 124 个融合 provider / 141 条规则，目标端按平台能力去重与空资产裁剪。
- AI-PRECEDENCE：从 CMFA 的融合顺序继承 ChatGPT/OpenAI 与必要 telemetry 的前置 AI 路由，避免落入广告或国外网站后段。
- CONTRACT：生成清单继续对 CMFA、source graph、Profile、每个原生 YAML 的内容哈希和引用顺序做确定性校验。

## v6.0.2-egern.2 (2026-07-11)

- FIX：移除 Egern 产物合同中 `111 / 94 / 99` 的固定计数快照。上游规则内容变化会影响目标端的全局去重和空资产裁剪，固定数字会把合法刷新误判为失败。
- VERIFY：生成器新增 `rulesets/generated/egern/manifest.json`，以确定性内容哈希绑定当前 CMFA、`routing-graph.js`、完整 Profile、每个原生 YAML 资产及其引用顺序；validator 同时拒绝陈旧 Profile、漏引用、重复引用和资产内容漂移。
- BUILD：修复生成说明清理模式，连续运行生成器不再累加重复注释；Profile 头升级到 `v6.0.2-egern.2`。

## v6.0.2-egern.1 (2026-07-10)

- FIX：Egern 派生器不再静默跳过服务型 `GEOIP`；ISO 国家码输出为原生 `geoip_set`，服务型标签展开为 CIDR，`IP-ASN` 输出为 `asn_set`。
- NO-RESOLVE：由 CMFA `RULE-SET,...,no-resolve` 或残余规则携带的解析语义写入 Egern rule-set 顶层 `no_resolve: true`。
- PERF：主配置从 CMFA 的 113 个融合 provider / 130 条规则生成；跨资产首匹配去重后省略 19 个目标为空引用，实际为 111 条主规则、94 个 `rule_set` 引用和 99 个非空 Egern 原生 YAML，聚合约 12.94 MiB / 575,957 条。
- PLATFORM：仅 `PROCESS-NAME` / `PROCESS-PATH` 因 Egern 官方规则集未提供对应字段而明确跳过，其他未知类型不再伪装成同步成功。

## v6.0.1-egern.1 (2026-07-10)

- FIX#174 同类修复：Egern 原生 `provider-scki-fused-005-ad-domain.yaml` 原为超过 CDN 单文件预算的远程 YAML，现由生成器按 18 MiB 上限拆为 3 个有序 YAML rule_set。
- SEMANTICS：三个 rule_set 均指向 `🛑 广告拦截`，保持在原时间线位置连续求值；主配置计数变为 132 条规则 / 115 个 rule_set 引用，增加的两条仅为同策略分片引用。
- VERIFY：Egern 生成器与融合 manifest / 客户端远程资产大小合同共同校验，避免出现配置可导入但远程文件无法下载的隐性故障。

## v6.0.0-egern.1 (2026-07-09)

- FUSED-RULESETS：由融合后的 CMFA 规则顺序重新生成，Egern 不直接引用 Mihomo `.mrs`。
- EGERN-NATIVE：输出 118 个 Egern 原生 YAML 规则集，主配置渲染 130 条规则、113 个 rule_set 引用。
- PLATFORM：GEOIP / PROCESS-NAME 等官方能力限制继续记录为平台例外，不当作同步遗漏。

## v5.4.39-egern.1 (2026-07-09)

- SYNC：由 CMFA v6.0.0-cmfa.1 重新生成，跟随 113 个融合 rule-provider / 130 rules 的主线顺序。
- EGERN-NATIVE：Egern 不直接引用 Mihomo `.mrs`；生成器通过 `.mrs` manifest 回溯上游来源，输出 487 个 Egern 原生 YAML 规则集。
- PARITY：`Egern/Egern.yaml` 当前渲染 927 条主规则与 484 个顶层 `rule_set`；两个桌面 `PROCESS-NAME` 补充规则继续作为官方能力限制跳过。
- VERIFY：合同校验改为检查 generated Egern `scki-*` 规则集，而不是旧的 supplemental preview 路径。

## v5.4.38-egern.2 (2026-07-09)

- EGERN-FORMAL：`Egern/Egern.yaml` 从 Preview 升级为正式同步产物，跟随 CMFA 规则顺序生成。
- SYNC：同步 CMFA 429 个 rule-provider 和 884 条规则；Egern 渲染 882 条主规则与 439 个顶层 `rule_set`，仅排除官方未支持的 2 条桌面 `PROCESS-NAME` 补充规则。
- POLICY：区域组从 `auto_test` 改为 Egern 官方 `smart`，保留 22 个区域组与 33 个业务组。
- TOOLING：新增 `tools/generate-egern-from-cmfa.js`，把 Mihomo `.mrs` 规则源映射为本仓库生成的 Egern 原生 YAML 规则集；Clash Party / CMFA / OpenClash / FlClash / Stash 继续保留 `.mrs`。
- VERIFY：`tools/validate-artifact-contracts.js` 改为校验正式 Egern 产物，不再按 Preview 范围检查。

## v5.4.38-egern.1 (2026-07-09)

- FEAT#174-EGERN：新增 Egern 目录与 `Egern.yaml` Preview 配置。
- SCKI-SUPPLEMENTAL：新增 Egern 原生 YAML 补充规则集输出，引用 `rulesets/supplemental/egern/*.yaml`，不在主规则中散写广告误伤、抖音、RustDesk、Google Workspace 等零星域名。
- TOOLING：新增 `tools/generate-egern-supplemental.js`，从 Clash classical 补充规则集生成 Egern `domain_suffix_set` / `domain_set` / `ip_cidr_set` 格式。
- SCOPE：本版不声明与 Mihomo 391 rule-provider 完全等价；Egern 完整等价迁移需要后续为上游规则源建立专用转换链路。
