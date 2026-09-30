# Smart-Config-Kit — 变更日志

> 仓库级变更摘要。各产物的详细变更见对应子目录 `CHANGELOG.md`。
> 主版本号由 `rulesets/source/routing-graph.js` 的 `SOURCE_GRAPH_VERSION` 与客户端产物版本共同维护；规则权威源是 `rulesets/source/routing-graph.js`。
> 覆盖 14 个客户端形态的等价实现：Clash Party JS / CMFA / Stash / OpenClash(Normal+Smart) / Shadowrocket / Surge / Loon / Quantumult X / SingBox / Egern / v2rayN / Passwall / Passwall2 / FlClash。

---

## v6.0.14 — 订阅节点预检与可选倍率筛选 (2026-09-30)

- 研究 MyClash 等分流仓库后，统一三个 JS 与两个 OpenClash 脚本的预检、默认关闭的倍率上限及空节点处理，修复 OpenClash 对正常线路的误过滤。规则权威源与融合资产保持 v6.0.14；逐端适用性及源码取舍见 [研究报告](./docs/research/2026-09-30-routing-script-research.md)。
- 详情：[Clash Party](./Clash%20Party/CHANGELOG.md)、[FlClash](./FlClash/CHANGELOG.md)、[OpenClash](./OpenClash/CHANGELOG.md)；使用方法见 [节点筛选指南](./docs/subscription-node-filter.md)。

## v6.0.14 — 微信 HTTPDNS 精确直连例外 (2026-09-29)

- FIX：将 `dns.weixin.qq.com` 与 `dns.weixin.qq.com.cn` 放入最前置 DIRECT 补充规则，避免命中 BlockHttpDNS 拒绝规则；其他 HTTPDNS 条目仍保持现有拦截策略。
- SYNC：按规则权威源重建 14 种客户端产物及融合资产；source 统计保持 514 providers / 973 rules，fused 保持 132 providers / 151 rules。
- VERIFY：新增首命中回归检查，两个域名均命中 `scki-fused-001-direct`。

## v6.0.13-dns.8 / v6.0.13-normal.9 (2026-09-21)

- FIX#183：兼容 Clash Party v2.0.3+ 订阅 DNS 覆写保护；明确客户端内置 `controlDns` 自动关闭与本仓库 JS DNS 写入是两个不同层次。
- SYNC：Smart / Normal JS 在原始订阅含受保护 DNS 字段时输出脱敏边界诊断，随后继续应用仓库 DNS 基线；FlClash 不引入 Clash Party 专属 guard。
- VERIFY：新增受保护源 DNS 字段 fixture，确认 `nameserver`、`proxy-server-nameserver`、`nameserver-policy` 等最终字段仍由仓库脚本控制。
- DOCS：同步 Clash Party 使用教程、根 DNS 指南、私有节点 DNS 指南及 `AGENTS.md` 陷阱/自检条目；详见 [Clash Party 变更日志](./Clash%20Party/CHANGELOG.md)。

## v6.0.13-dns.7 / v6.0.13-normal.8 / v6.0.13-flclash.10 (2026-09-21)

- FIX#182：修复 Clash Party v2.0.3 更新后 `dns.fake-ip-filter[3]` 的 `rule-set:cn domain` 悬空/非法引用导致覆写载入失败。
- SYNC：Clash Party Smart、Normal 与 FlClash 统一输出 `fake-ip-filter-mode: blacklist`，清理会被覆写重建流程淘汰的源 provider 引用；静态 CMFA / Stash / OpenClash 产物无同构订阅继承路径，保持不变。
- VERIFY：三端回归通过，策略组/规则/provider 数量保持 `55 / 151 / 132`。
- CONTRACT：按 `AGENTS.md` §3.5.1 / §8.4 固化该运行时语法陷阱；官方 Mihomo DNS 语法以 `fake-ip-filter-mode` 与单 token `rule-set:xxx` / `geosite:xxx` 为准。

## v6.0.13 LINUX DO 大陆备用域名国内路由 (2026-09-03)

- FIX-LINUXDO-CN-ROUTE：将 `linuxdo.org` 及全部子域加入前置的 `🏠 国内网站` 融合段，避免落入通用国际站点/IP 兜底。
- GUARD：主站 `linux.do` 保持 `🚫 受限网站`；新增回归固定 apex、`connect`、`invite` 子域的首命中和两类域名的分离语义。
- SYNC：以 `39b9a1e` 固定载荷定向重放全部客户端，仅第 013 段新增一个域名，不发布 fresh-cache 的无关上游漂移。

## v6.0.12 NVIDIA 中国账号登录精确直连 (2026-09-01)

- FIX#181-PC：`login.nvidia.cn` 加入最前置的精确 `DIRECT` 融合资产，避开 Smart 通用健康检查无法识别的目标站点 TLS 失败。
- SCOPE：仅处理 NVIDIA 中国账号登录主机；`download.nvidia.com`、`developer.nvidia.com` 与其余 NVIDIA 域名继续由下载组接管。
- SYNC：以 `HEAD` 固定载荷受控重放 132 个融合 provider / 151 条主规则并同步全部客户端；未发布缓存中的无关上游规则漂移。

## v6.0.11-flclash.7 应用层配置修正 (2026-08-31)

- FIX#181：纠正 FlClash DNS 二次覆盖、Android VPN HTTP 代理与应用排除的使用说明；保留规则与 DNS 运行时基线。详见 [FlClash 变更日志](./FlClash/CHANGELOG.md)。

## v6.0.11 Gemini / Accademia Gemini Google 路由 (2026-08-22)

- ROUTING：仅将 `RULE-SET,gemini` 与 `RULE-SET,acc-gemini` 的目标从 `🤖 AI 服务` 调整为 `🔍 Google 服务`；`szkane-ai` 的顺序与 AI 目标保持不变。
- SYNC：以 `HEAD` 固定载荷受控重放并重建 72 个策略段（69 个非空原生资产）及全部客户端派生产物；未引入上游规则刷新。

## 2026-08-22 仓库自动化修复

- AUTOMATION：Issue 自动回复切换至 Xiaomi MiMo，统一首轮 / 追问模型与可选 Token Plan 端点配置；本次不修改规则源或客户端产物版本。

## v6.0.10 网易游戏精确直连修复 (2026-08-08)

- FIX#179-NETEASE-GAME-DIRECT：`drpf-g10.proxima.nie.netease.com` 与 `sigma-performance-g10.proxima.nie.netease.com` 加入仓库自有的首段精确直连规则集。
  - 此前两个主机会落入 `DOMAIN-SUFFIX,netease.com` 的“国内游戏”宽规则；现在在规则开头命中 `DIRECT`，不再继承该策略组的手动代理选择。
  - 只豁免报告中的两个精确主机名；`proxima.nie.netease.com` 父域的广告/隐私规则不被整体放宽。
- VERIFY：重建 MRS、融合文本/MRS/SRS、CMFA、Stash、Egern、SingBox、Xray 与 Passwall / Passwall2 派生产物，并新增首命中回归。

## v6.0.9 Actions 与 CMFA/Stash 正则修复 (2026-08-08)

- FIX-CMFA-APAC-HOME-REGEX：修复 `🏡 亚太家宽` 的末尾多余右括号；此前会让 CMFA 载入该策略组筛选正则时失败，并由 Stash 生成链路同步带入。
- GUARD：产物合同验证现逐一编译 CMFA 与 Stash 的全部策略组 `filter`，拒绝 Go RE2 不支持的 lookaround / backreference，不再只依赖地区样例命中来间接发现语法错误。
- ACTIONS：同步任务的 cron 重新登记为每周一 05:23 JST；历史 run 默认保留从 1 天调整为 30 天，清理器升级到 Node 24 运行时、保留 `0` 的全删语义、拒绝非法输入，并将删除失败作为失败状态上报。
- AUTO-SYNC-GUARD：Egern Issue #176 回归不再冻结上游规则库的条目数量，改为验证原生资产的非空、no-resolve 语义与国内权威段先于最终国际兜底的顺序，允许正常上游更新自动发布。

## v6.0.9 节点命名归类兼容 (2026-08-02)

- FIX-NODE-ISO-LOWERCASE：修复含编号的小写 ISO 两位地区码无法进入区域策略组的问题；yun hk01、yun us01、yun jp01、yun sg01、yun tw01 等命名现与原有大写形式等价。
- CROSS-CLIENT-AUDIT：Clash Party Smart/Normal、FlClash、OpenClash Normal/Smart、Shadowrocket、Surge、Quantumult X 同步收敛；CMFA、Stash、Egern、Loon 已有不区分大小写的筛选器，经同一组样例验证无需改动。
- GUARD：JS 与 Apple 文本产物仅为“ISO 两位码后接编号”的形式启用小写兼容，避免把自然语言中的普通小写词（如 us、in）误归类；OpenClash 仅在字母与数字交界处规范化，保留原区域正则。
- PLATFORM-BOUNDARY：sing-box Full、v2rayN Xray、Passwall / Passwall2 只消费静态出站或分流规则，不从订阅节点名动态建立地区组，因此不适用此运行时分类修复。源规则图、MRS/fused/SRS 资产与路由语义不变。

## v6.0.9 订阅适配层、profile 与能力矩阵 (2026-07-25)

- RUNTIME-ADAPTER：将五份订阅覆写的私有 Node-DNS 处理收敛为同构的 `captureNodeDns → snapshot → applyNodeDns` Module/Adapter seam；capture 与 apply 的 profile 必须匹配，缺少仓库 PSS 基线时零写入。
- PROFILE：新增唯一受信任源 `tools/runtime/subscription-adapter-profiles.json`，提供 `off / policy / adaptive` 三档，默认 `adaptive`。三档不改变 `routing-graph.js`、55 组、规则、rule-provider 或全局 DNS；机场订阅不能选择 profile。
- HARDENING：后置、大小写不同的活动节点精确 policy 可在有界扫描内优先命中；通配符扫描保持单独上限。resolver URL path/query 保持大小写，冲突 fail-closed；每条接受的 policy 与其 bootstrap resolver hosts 原子保留。
- MATRIX：新增可验证的 14 产品 × 4 能力矩阵（订阅输入、动态分组、Node-DNS、可选 sidecar），由 JSON 单一源生成 Markdown，并在 CI/产物合同中校验证据与文档漂移。
- DOCS/VERIFY：复核 Mihomo DNS、FlClash v0.8.94、OpenClash v0.47.133 官方资料；新增 JS/Ruby 三档、大小写精确 key、profile-mismatch、bootstrap 容量与矩阵回归。源规则图、MRS/fused/SRS 资产及静态路由语义不变。

## v6.0.9 私有节点 DNS 适配 (2026-07-25)

- RUNTIME-NODE-DNS：Clash Party Smart/Normal、FlClash 与 OpenClash Normal/Smart 新增同一受限 Node-DNS Adapter。它只为活动节点 FQDN 物化精确 `proxy-server-nameserver-policy` 和必要 bootstrap hosts；订阅不能替换全局业务 DNS、fake-ip 或固定 PSS 基线。
- HARDENING：保留 Mihomo hosts 的标量域名重定向语义，支持 IPv4 / IPv6 / IPv4-mapped IPv6 bootstrap，`*.` 优先于更宽的 `+.` / `.`，resolver hosts 在容量上限前收集；输入与输出均有确定性上限。
- CROSS-CLIENT-AUDIT：CMFA、Stash、Egern、Shadowrocket、Surge、Loon、Quantumult X、Sing-box、v2rayN Xray、Passwall / Passwall2 是静态或路由产物，没有订阅运行时 seam，明确不宣称自动接管私有节点 DNS；详见 [私有节点 DNS 指南](./docs/private-node-dns.md)。
- VERIFY：新增同步漂移检查、JS 运行时回归与两份真实 OpenClash Ruby heredoc 合同；源规则图、MRS/fused/SRS 资产与静态产物版本不变。

## v6.0.9 平台修复 (2026-07-24)

- FlClash v6.0.9-flclash.2：修复只关闭 `dns.ipv6`、却未关闭顶层 IPv6 的配置缺口；补充 Android VPN/系统代理设置说明和回归校验。规则源与其他客户端产物未改变。

## v6.0.9 (2026-07-19)

- FIX#176 后续全量审计：上游 `szkane-ai` 的 `api.github.com` 规则覆盖浏览器普通 GitHub API 调用，现将通用域名放入 `scki-github-api-tools` 补充规则集，并在广义 AI 规则前融合到 `🔧 工具与服务`。
- PRECISION：桌面 Mihomo、sing-box 与 Xray fallback 仅在 `Code Helper` 或 `Code Helper (Plugin)` 访问 `api.github.com` 时保留 `🤖 AI 服务`；无进程识别能力的 Egern、iOS 与路由器产物使用通用工具组回退，`api.githubcopilot.com` 继续归入 AI。
- SYNC：源图 `514 providers / 973 rules` 编译为 `69` 段、`127` 个 Mihomo provider / `146` 条主规则、`66` 个文本 / SRS 资产、`86` 条 Xray RuleObject；MRS `failed=0`、fused `unresolved=0`。

## 文档治理 (2026-07-16)

- GOVERNANCE-SINGLE-SOURCE：将原 `CLAUDE.md` 的完整维护手册与原 `AGENTS.md` 的多代理协作、受保护文件和常见错误约定合并为唯一入口 `AGENTS.md`，删除双文件优先级与同步负担。
- AUTOMATION：Issue 模板、AI 自动回复工作流、OpenClash 产物注释、测试和设计文档统一引用 `AGENTS.md`；规则权威源仍为 `rulesets/source/routing-graph.js`，本次不修改任何运行时规则或客户端版本。
- REPO-HYGIENE：将本机 `.claude/` 配置和内部 `.full-review/` 审查工作区加入 `.gitignore`，从公开仓库索引移除但保留本机文件。

## v6.0.8 (2026-07-15)

- FIX#176 全量审计：将全部共享边缘/CDN、`geolocation-!cn`、IP 与地域兜底规则置于国内权威策略之后，而非仅为已报告域名添加例外；`scki-fused-064-intl-site` 成为统一的通用国际兜底段。
- RELEASE-CACHE：自托管融合资产统一使用 `?scki=v6.0.8`，Mihomo 同时写入版本化本地 `path`，避免配置更新后继续复用旧 `.mrs` / residual 文件。
- VERIFY：新增全量泛化 fallback 顺序、Issue #176 域名族和资产缓存隔离回归；14 类派生产物均由正式链路重建，MRS `failed=0`、fused `unresolved=0`。

## v6.0.7 (2026-07-14)

- FIX#176：修复首匹配优先级倒置。`RULE-SET,cn` 及具名国内域名策略现在先于共享 Cloudflare / CloudFront / Fastly IP、`GEOIP,ID` 和 16 个非中国地域 domain/IP 兜底执行；国内域名解析到境外 CDN / GeoIP 时不再被提前送往 `🌐 国外网站`。
- REGRESSION：以 `www.mi.com`、`api-paas.yunxuetang.cn`、`apiws-phx-tc.yunxuetang.cn`、`images.yxt.com`、`stc.yxt.com` 建立回归语义，并把源图与 14 类产物的 CN 段 → 通用国际 fallback 顺序纳入合同校验。
- SYNC：按 `source graph -> MRS -> fused -> 原生派生` 重建；MRS `failed=0`、fused `unresolved=0`，输出为 126 个 Mihomo provider / 143 条主规则、65 个移动端文本资产、65 个 sing-box SRS / Passwall shunt rule、83 条 v2rayN Xray RuleObject。

## v6.0.6 (2026-07-14)

- DIRECT-WORKPRO-WEB：将 `WorkProWebProcess.exe` 纳入 `local-process-direct` 补充规则集；`WorkPro.exe` 与其 Web 子进程统一进入 TUN 后由融合 `PROCESS-NAME` 规则命中 `DIRECT`，不再以 TUN 排除或 IP 路由排除绕过规则引擎。
- SYNC：按 `source graph -> MRS -> fused -> 原生派生` 完成 14 类产物重建；Mihomo MRS `failed=0`、融合规则集 `unresolved=0`，主规则仍为 124 个融合 provider / 141 条规则。

## v6.0.5 (2026-07-14)

- DIRECT-WORKPRO：将既有的 WorkPro.exe 本地直连条目纳入永久回归清单并完成全产物重建；桌面 Mihomo、sing-box 与 Xray fallback 固定输出 DIRECT，平台不支持进程匹配的路径保持明确豁免。

## v6.0.4 (2026-07-13)

- DIRECT-ITWDB：将 `itwdb.com` 主域名纳入仓库维护的默认直连补充规则集，`workpro.itwdb.com` 及全部子域名随 `DOMAIN-SUFFIX` 语义直连；未新增主分流内联规则。
- SYNC：按 `source graph -> MRS -> fused -> 原生派生` 全链路重建 14 类产物；Mihomo MRS `failed=0`、融合规则集 `unresolved=0`，各端继续按原生格式消费直连段。

## v6.0.3 (2026-07-12)

- FIX#FUSED-DOMAIN-PAYLOAD：修复融合编译器把 classical `DOMAIN` / `DOMAIN-SUFFIX` 行原样写入 Mihomo `behavior: domain` YAML 的根本错误。该行为的 payload 必须是裸精确域名或 wildcard（如 `+.chatgpt.com`）；旧产物虽可编译为 `.mrs`，但实际不会命中，因而会继续落入后续的“国外网站”段。
- SEMANTIC-PRESERVATION：`DOMAIN` 转为精确 host，`DOMAIN-SUFFIX` 转为 `+.` wildcard；`DOMAIN-KEYWORD`、`DOMAIN-REGEX` 不被错误宽化为 wildcard，而是保留为 classical residual YAML。MRS 同步链与最终 fused 链共享同一转换器，避免两条生成链再次分叉。
- AI-PRECEDENCE：新增小范围 `scki-adfp-ai` 前置守卫，覆盖 ChatGPT 使用的 DataDog / Sentry telemetry host，确保它们不会被通用广告/隐私列表先拦截；`chatgpt.com`、`chat.openai.com`、`oaistatic.com` 及 `a.nel.cloudflare.com` 均在广告段与“国外网站”段之前归入 `🤖 AI 服务`。
- BUILD-CONSISTENCY：仓库自有规则 URL 在本地构建时优先读取工作区文件，再由 CI/发布使用同一 URL 映射，杜绝因 CDN 尚未包含未提交补充规则而生成陈旧 MRS。Stash 头部统计也改为从 CMFA 与 fused manifest 动态读取。
- SYNC：源图更新为 513 providers / 970 rules，最终为 68 个语义段、124 个 Mihomo provider / 141 条主规则、64 个移动端非空文本资产、65 个 sing-box SRS / Passwall shunt rule、83 条 v2rayN Xray RuleObject、82 条 sing-box route rule，`unresolved=0`。
- VERIFY：新增 domain payload / repository URL 回归测试，产物合同拒绝 classical 前缀混入 fused `*-domain.yaml`，并断言 AI 误伤守卫位于广告段之前；以 Clash Party 随附 Mihomo Smart 内核对 OpenAI 主站、子域、oaistatic、Sentry、DataDog 与 Cloudflare NEL 实际拨号命中进行回归。

## v6.0.2-region.1 (2026-07-12)

- FIX#REGION-CARRIER-PRIORITY：修复 Clash Party Smart、Clash Party Normal 与 FlClash 的节点名区域分类。运营商/线路营销词（如 `中国电信`、`电信移动联通推荐`、`China Telecom`）不再先于国旗、国家名或 ISO 代码把海外节点错误归为 `CN`。
- EFFECT：用户报告的 `🇯🇵AWS日本01 | 电信移动联通推荐` 现归为 `JP`，会同时出现在 `🇯🇵 日韩节点` 和包含日本的 `🌏 亚太节点`；此前只出现在后者是因其被误分类到 `CN`。
- CROSS-CLIENT-AUDIT：CMFA、Stash、OpenClash、Shadowrocket、Surge、Loon、Quantumult X 已核对为独立地区过滤，样例本已命中日韩组；SingBox、v2rayN、Passwall、Passwall2 为静态路由产物，无运行时订阅节点分类。本次不改 `routing-graph.js`、融合规则集、MRS/SRS、GeoIP/GeoSite/MMDB/ASN 数据库或其派生产物。
- VERIFY：新增三组分类回归和两组目标代理组成员断言，覆盖所有三份动态 JS 覆写。

## v6.0.2-substore.2 (2026-07-11)

- SUBSTORE-REAL-MIRROR-FIX：根据 Clash Party 内置 Sub-Store 的实际快照复现，确认同账户双域名镜像的总配额/到期日相同，而 `upload` / `download` 会因 CDN 缓存相差数十 KB。自动去重改为 host 无关订阅资源身份 + 相同 `total` / `expire`，组内仍取最大计数，避免整份镜像配额再次相加。
- SUBSTORE-LOGGER-FIX：修复从 `$substore` 解构后以裸函数调用 `info` 的 receiver 丢失。运行时会在最终状态日志处抛错并回退持久化，造成页面仍显示旧的 13.16 TiB 流量头；现改为保留 receiver，并将日志失败隔离在汇总路径之外。
- VERIFY：回归测试改用真实故障模型（相同镜像资源和计划元数据、不同已用流量），并模拟 receiver 敏感的 `$substore.info`，确保未来不会重新要求四个字段字节级相等或因日志失败放大为汇总失败。本次仍只改 SubStore 辅助脚本，不改变融合规则或 14 类客户端正式产物。

## v6.0.2-substore.1 (2026-07-11)

- SUBSTORE-MIRROR-FLOW：修复组合订阅含多个同账户镜像地址时，`subscription-userinfo` 被按成员逐条累加而翻倍的问题。完整流量快照且 host 无关 URL 身份一致时自动合并；路径不同或 CDN 缓存略有延迟时，可用订阅 URL 的 `flowDedup` 显式归组并取每项最大计数。
- SUBSTORE-VERIFY：新增 6 项 Node 回归测试与专属 GitHub Actions 校验，覆盖独立订阅不误合并、`flowDedup=off` 逃生开关、CDN 快照差异以及最终 `$options._res` / collection 持久化结果。本次仅修改 SubStore 辅助脚本与文档，不影响 `rulesets/source/routing-graph.js` 或 14 类客户端正式产物。

## v6.0.2-ci.1 (2026-07-11)

- CI-FUSED：修复定时 `Sync All Fused Rule Sets` 工作流，完整执行 `source graph -> MRS -> fused -> 14 类客户端派生` 链路，提交范围覆盖源图、融合产物、MRS、Egern 和全部客户端目录，并通过互斥并发组避免两个刷新任务竞争写入 `main`。
- EGERN-CONTRACT：以确定性生成清单替换会随上游去重结果漂移的 Egern 固定计数快照。清单双向校验 CMFA、规则图、Profile、原生 YAML 内容哈希与引用顺序，既允许合法上游变化，也拒绝陈旧或不完整产物。
- VERIFY：新增 `tools/tests/egern-generation-manifest.test.js`，覆盖实际失败样本 `109` 条规则 / `92` 个顶层 `rule_set` / `97` 个原生 YAML，并纳入定时工作流、完整合同、重复与远程资产预算验证。
- REPO-HYGIENE：删除历史误提交但无 `.gitmodules` 映射的 `.claude/worktrees/strict-direct-rule-clean` gitlink，并忽略本地 `.claude/worktrees/`；避免 `actions/checkout` 收尾阶段误报 submodule `git exit 128`，不删除用户本地工作树。
- ACTIONS-RUNTIME：`actions/checkout` 与 `actions/setup-node` 升级到官方 v6，消除 GitHub 托管 runner 对动作内部 Node 20 的弃用提示；工作流仍显式使用项目 Node 22 执行生成器和验证器。

## v6.0.2 (2026-07-10)

- FIX#175：修复 Shadowrocket 规则总量导致 Network Extension 无法稳定启用的问题。根因不是 71 个 URL 本身，而是融合编译器将 `HageziUltimate.mrs` 错换为 191 万条完整 TIF，并把 249 条运行时 GEOIP 国家规则放大为 76 万至 111 万条 CIDR；两类错误叠加使旧产物达到约 75.44 MiB / 310 万条。
- FUSED-DEDUP：新增独立规则优化器，统一大小写、尾点、CIDR 网络地址和 GEOIP/ASN 语法；段内执行精确去重、DOMAIN-SUFFIX / DOMAIN-KEYWORD 覆盖消除和父 CIDR 包含消除，并按首匹配顺序删除后续分段的精确重复。784,480 条规范化输入最终保留 575,652 条，安全删除 208,828 条。
- SOURCE-IDENTITY：不透明 `.mrs` 改为按精确 URL 映射同源文本。HaGeZi Ultimate 对应 `wildcard/ultimate-onlydomains.txt`，禁止再按 provider 名替换成语义不同的完整 TIF；嵌套 GEOSITE/GEOIP 或上游下载失败时构建直接失败，不再静默回退。
- GEOIP-NATIVE：Mihomo 与 iOS 文本目标保留 ISO 国家码 GEOIP；服务型 GEOIP 按目标能力展开；sing-box 无 headless GEOIP/ASN 字段，因此仅在 `.srs` 编译目标中物化 CIDR。Egern 使用原生 `geoip_set` / `asn_set` 并保留 `no_resolve`。
- IOS-BUDGET：Shadowrocket / Loon 只引用 63 个非空远程资产，当前约 16.06 MiB / 575,499 条；Surge 为 16.07 MiB / 575,673 条，Quantumult X 为 15.56 MiB / 575,498 条。正式 validator 同时检查 18 MiB 单资产上限和 iOS 类客户端 32 MiB / 100 万文本规则聚合预算，禁止用分片绕过总量限制。
- TARGET-NORMALIZE：provider payload 中夹带的 `DIRECT` / `REJECT-DROP` 不再被误当成规则修饰符；最终策略只由外层融合目标决定。Mihomo 用独立 bucket 承载 `no-resolve`，Sing-box 在去重前按最终 headless 字段消除该平台不表达的修饰差异，并对无法转换的目标类型直接失败，禁止静默丢规则。
- TARGET-EMPTY：源端全局精确去重后删除 1 个空分段；目标格式物化后不再发布空文本、空 YAML 或空 SRS。最终为 67 个源语义段、63 个移动端文本规则集、64 个 sing-box SRS / Passwall shunt rule。
- SINGBOX-COALESCE：Sing-box 不再把 113 个 Mihomo bucket tag 重复映射到同一 SRS；改为 64 个唯一 SRS、64 条融合路由引用，Full JSON 共 71 个 remote rule_set（含 7 个运行时 GEO 辅助）和 81 条 route rule。
- MRS-IDEMPOTENCE：修复 `apply-mihomo-mrs-overrides.js` 把“覆盖块已是最新”误判为“缺少锚点”的问题，并消除 CRLF 文件每次执行累加空行的 2 字节漂移；端到端测试要求连续执行后的源图字节完全一致。
- SYNC：14 类客户端全部升级到 v6.0.2 基线；Mihomo 为 113 个融合 provider / 130 条主规则，v2rayN Xray 为 82 条 RuleObject，Egern 为 99 个非空原生 YAML / 111 条主规则 / 94 个 rule_set 引用。

## v6.0.1 (2026-07-10)

- FIX#174：修复 Shadowrocket 加载 `scki-fused-005-ad`（原 51.10 MiB）和 `scki-fused-057-intl-site`（原 20.15 MiB）时，CDN 返回 `403/forbidden`、客户端报“文件过大”的问题。根因是融合编译器把一个策略段始终写成单个文本文件，未约束远程分发文件体积。
- FUSED-REMOTE-SHARDS：`tools/build-fused-rule-sets.js` 为 Clash / Surge / Quantumult X 文本产物增加 18 MiB UTF-8 上限，严格按规则行分片并保留源规则图的先后顺序、策略目标和段内语义。广告段生成 3 个分片，国外网站尾段生成 2 个分片；Shadowrocket、Surge、Loon、Quantumult X 自动引用所有同策略分片。
- EGERN-NATIVE：`tools/generate-egern-from-cmfa.js` 对超限 Egern 原生 YAML 规则集执行同样的有序分片；广告域名规则集从 1 个拆为 3 个，主配置从 130 条规则 / 113 个 `rule_set` 引用调整为 132 / 115，仅是同策略分片引用增加，分流语义不变。
- VERIFY：新增 `tools/validate-generated-remote-asset-size.js`，扫描所有客户端实际引用的本仓库 `rulesets/generated/` URL，缺文件或任一文件超过 18 MiB 即失败；`validate-artifact-contracts.js` 改读 fused manifest 的实际 parts，验证分片引用、顺序、Egern 映射和远程资产上限，防止再次生成无法分发的配置。
- BUILD-IDEMPOTENCE：修复融合编译器在 CRLF JS 文件上清理旧 `applyMihomoFusedRuleSets(config)` 调用时漏匹配的问题；重复构建后每个 JS 覆写只保留一个注入调用，`validate-js-overwrites.js` 对此建立静态回归断言。
- SYNC：14 个客户端产物同步至 Clash Party / source graph `v6.0.1`。Mihomo `.mrs`、sing-box `.srs`、v2rayN Xray 与 Passwall / Passwall2 原生 fallback 保持各自格式，不将二进制或原生规则格式强制转换为文本分片。

## Unreleased (2026-07-09)

- SOURCE-GRAPH：新增 `rulesets/source/routing-graph.js` 作为规则权威输入，集中记录上游 provider、原始规则顺序、MRS 归一化映射和最终分流目标。
- APP-SIMPLIFY：Clash Party Smart/Normal 与 FlClash JS 覆写脚本移除 raw provider/rule 注入和 MRS 映射表，只保留节点/策略组逻辑与最终融合规则集调用。
- FALLBACK-FUSED：v2rayN Xray 由非空 fused sing-box JSON 展平成 82 条原生 Xray RuleObject；Passwall / Passwall2 使用 64 条原生 `rule-set:remote` fused shunt rule，不再维护 33 条手写域名/IP 展平列表。
- TOOLING：`sync-mihomo-mrs-rule-providers.js` 改读 source graph raw 输入；`apply-mihomo-mrs-overrides.js` 只更新 source graph；`build-fused-rule-sets.js` 改读 source graph normalized 输入，并联动 `generate-fused-fallback-artifacts.js` 生成 v2rayN / Passwall / Passwall2 fallback 产物。
- VERIFY：全产物合同新增 source graph authority、fallback fused 映射和 Passwall 原生 `.srs` 引用检查，并禁止客户端 JS 重新携带原始上游规则框架。本次不改变最终融合规则语义，最终 Mihomo-family 输出为 `113 providers / 130 rules`。

## v6.0.0 (2026-07-09)

- FUSED-RULESETS：新增 `tools/build-fused-rule-sets.js`，将源 `474 providers / 931 rules` 编译为 `68` 个策略顺序段、`113` 个融合 provider、`130` 条主规则，保留 `17` 条必要内联规则，`unresolved=0`。
- MIHOMO-MRS：支持 `.mrs` 的 Mihomo 产物优先引用融合后的 `*-domain.mrs` / `*-ipcidr.mrs` / `*-ipcidr-no-resolve.mrs`；不可转部分落到 `*-residual.yaml`，不再依赖静态兼容映射表膨胀主配置。
- NATIVE-FUSED：Shadowrocket / Surge / Loon / Quantumult X 迁移到融合文本规则集；Egern 生成 118 个原生 YAML 规则集；SingBox 生成 68 个 `.srs` 规则集。
- GOVERNANCE：`CLAUDE.md` / `AGENTS.md` 固化 “source graph → MRS → 融合规则集 → 各端产物” 的单向链路，禁止后续把 Clash Party / CMFA 当成权威源。
- VERIFY：同步更新 JS / PROCESS-NAME / 全产物合同校验，融合 manifest 与 `.mrs` manifest 纳入验收。

## v5.4.39 (2026-07-09)

- MRS-PARTIAL：全量复查剩余 `YamlRule` / `TextRule`，可迁移部分全部迁移；`.mrs` manifest 当前为 converted=267、split=39、partial=30、existing_mrs=35、retained=20、failed=0。
- MIHOMO-MRS：Mihomo 系产物同步到 474 providers / 931 rules；424 个 provider 使用 `.mrs`，30 个 provider 使用本仓库残余 classical YAML，20 个确认为全量不可迁移保留原格式。
- SCKI-SUPPLEMENTAL：补充规则集里可表达为 domain/ipcidr 的 `scki-*` 已迁移到 `.mrs`；两个 `PROCESS-NAME` 规则集继续保留为平台例外。
- DERIVED：Egern 重新生成为 927 条主规则、484 个 rule_set；SingBox 生成器改为从 `.mrs` manifest 回溯 `scki-*` 源规则并展开为原生 route rules。
- VERIFY：`.mrs` 映射表在 JS 产物中改为压缩生成层，静态 YAML 产物直接写最终规则集地址；合同校验同步检查 partial / residual 文件数量与引用。

## v5.4.38 (2026-07-09)

- SCKI-SUPPLEMENTAL：新增 `rulesets/supplemental/` 公共补充规则集，将广告误伤、抖音 Web、RustDesk、Google Workspace、下载更新等零星直写域名/IP/进程整理为规则集引用。
- MIHOMO-MRS：支持 `.mrs` 的 Mihomo 产物（Clash Party Smart/Normal、CMFA、OpenClash Normal/Smart、FlClash、Stash）迁移上游规则源：35 个复用上游 `.mrs`，255 个纯 domain/ipcidr provider 转为本仓库 `.mrs`，38 个混合 provider 拆分为 domain/ipcidr 双 `.mrs`，48 个含 GEOIP/端口/进程等不支持类型的 provider 保留原格式。
- EGERN：`Egern/` 从 Preview 升级为正式同步产物，由 CMFA 生成 22 个 `smart` 区域组、33 个业务组、882 条 Egern 主规则与 439 个顶层 `rule_set`；Egern 不直接消费 Mihomo `.mrs`，而是映射到本仓库生成的 Egern 原生 YAML 规则集。
- SYNC：Clash Party Smart/Normal、CMFA、OpenClash Normal/Smart、FlClash、Stash、Egern、Shadowrocket、Surge、Loon、Quantumult X、SingBox、v2rayN、Passwall、Passwall2 元数据和产物同步到 v5.4.38。
- VERIFY：合同校验改为检查 `scki-*` 补充规则集引用、`.mrs` 清单、正式 Egern YAML 结构；JS 产物为 55 组、884 条规则、429 providers。

## v5.4.37-stash.1 (2026-07-07)

- FEAT#173-STASH：新增 Stash 专用目录，包含由 CMFA 自动裁剪生成的 `Stash/Stash.yaml`、使用说明、CHANGELOG 与 Stash Wiki 字段参考。
- TOOLING：新增 `tools/generate-stash-from-cmfa.js`，并把 Stash YAML 纳入 `validate-artifact-contracts.js` 与 CI 路径触发。
- COMPAT：Stash 产物保留 22 区域组、33 业务组、376 rule-provider 与规则顺序；删除 Stash Wiki 未确认的 Mihomo 扩展字段和 provider 下载代理字段。

## v5.4.37 (2026-06-29)

- DNS-POLICY#170：Mihomo 系列补齐 `nameserver-policy` 的 `geosite:cn` 与 `geosite:geolocation-!cn` 绑定，国内域名固定国内 DoH，非国内域名固定 Cloudflare/Google DoH，减少先走国内递归再 fallback 的 DNS 暴露面。
- SYNC：Clash Party Smart/Normal、CMFA、OpenClash Normal/Smart、FlClash 同步；OpenClash 参考快照元数据同步到 v5.4.37。
- DOCS：根 README DNS 流程图、Clash Party / FlClash 手动 DNS 示例同步 DoH-over-IP bootstrap、hosts 预解析、geosite nameserver-policy 与 Sniffer skip 列表；清理 Clash Party README 旧业务组/规则数说明。
- VERIFY：`validate-js-overwrites.js` 与 `validate-artifact-contracts.js` 新增 geosite DNS policy 断言，覆盖 JS 输出、CMFA YAML 与 OpenClash heredoc。
- SCOPE：Shadowrocket / Surge / Loon / Quantumult X / SingBox / v2rayN / Passwall / Passwall2 没有 Mihomo `nameserver-policy` 同字段面，配置不改；PR 描述需逐项列出不适用原因。

## v5.4.36 (2026-06-29)

- CLEAN#171-DIRECT：删除 22 条经逐条确认的冗余直写规则：2 条本地前序覆盖（`video.unext.jp` / `dl.delivery.mp.microsoft.com`）+ 20 条远程 provider 同策略前序覆盖。
- CONFIRM：20 条确认可删候选覆盖 Stripe、Outlook mail、Notion/Atlassian 协作、英欧流媒体、Yandex/Python、Mozilla/Ubuntu；对应前序同策略 provider 为 `stripe`、`mail`、`notion` / `atlassian`、`all4` / `my5` / `skygo`、`yandex` / `python` / `developer`、`mozilla` / `ubuntu`。
- KEEP：12 条候选保留（AI 7 条、Binance 3 条、Microsoft login 2 条），因为同目标证明之前存在不同策略 `.mrs` 规则集，无法证明严格无行为变化。
- SYNC：Clash Party Smart/Normal、CMFA、OpenClash Normal/Smart、Shadowrocket、Surge、Loon、Quantumult X、SingBox、FlClash 已同步；Passwall / Passwall2 同步删除展平规则 `channel4.com` / `sky.com`；v2rayN 仅更新版本元数据。

## v5.4.35 (2026-06-28)

- CLEAN#170-UPSTREAM：删除 8 个经 live upstream recheck 仍被前序同目标规则 100% 覆盖的冗余上游规则集：`marketing`、`acc-vf-paypal`、`encoretvb`、`findmy`、`wildrift`、`acfun`、`acc-fl-douyin`、`acc-fl-xiaohongshu`。
- CLEAN#170-DIRECT：删除 3 条已被前置 Douyin 国内流媒体守卫同目标覆盖的后置直写规则：`douyin.com`、`douyinpic.com`、`douyinvod.com`。
- SYNC：Clash Party Smart/Normal、CMFA、OpenClash Normal/Smart、Shadowrocket、Surge、Loon、Quantumult X、SingBox、v2rayN、Passwall、Passwall2、FlClash 同步；SingBox Full 由 generator 重新生成。
- SCOPE：`privacy` 不删，因仍有 `IP-CIDR,0.0.0.1/32` 未被前序覆盖；Passwall/Passwall2 保留展平静态 `domain:encoretvb.com`，仅做基线元数据对齐。
- VERIFY：全量 Mihomo provider 数 384 → 376；SR/Surge/Loon 远程规则 288 → 283；QX `filter_remote` 285 → 280。

## v5.4.34 (2026-06-28)

- FIX#169-AMAP：新增高德地图 / AMap 专用国内规则前置，`webapi.amap.com` 等高德核心域名早于 `geolocation-!cn` / 国外兜底命中 `🏠 国内网站`。
- SYNC：Clash Party Smart/Normal、CMFA、OpenClash Normal/Smart、Shadowrocket、Surge、Loon、Quantumult X、SingBox、v2rayN、Passwall、Passwall2、FlClash 同步；SingBox Full 由 generator 重新生成。
- VERIFY：新增 AMap/GaoDe 首匹配合同断言，确认广告/威胁规则仍在前，高德国内规则早于 foreign tail。

## v5.4.33 (2026-06-27)

- FEAT#169-AI-CODING：接入 `VPSDance/ai-proxy-rules` 的 `coding` 场景，补齐 Codex / Claude Code / Cursor / Zed / Windsurf / Replit / Sourcegraph / Amazon Q / Augment 等 AI 编程工具覆盖。
- SYNC：Clash Party Smart/Normal、CMFA、OpenClash Normal/Smart、Shadowrocket、Surge、Loon、Quantumult X、SingBox、v2rayN、Passwall、Passwall2、FlClash 同步；SingBox Full 由 generator 重新生成。
- SCOPE：不新增业务组，仍归入 `🤖 AI 服务`；Passwall / Passwall2 因 VPSDance 暂无 `.srs`，使用手工域名兜底而非 `rule-set:remote`。

## v5.4.32 (2026-06-25)

- FIX#168-CN-GAME：国内游戏直连规则前置到 HoYoverse / Game / category-games 等国外游戏宽规则之前，避免国内游戏被先命中代理。
- SYNC：Clash Party Smart/Normal、CMFA、OpenClash Normal/Smart、Shadowrocket、Surge、Loon、Quantumult X、SingBox、v2rayN、Passwall、Passwall2、FlClash 同步；Passwall/v2rayN 补齐米哈游/网易/WeGame 等国内游戏域名集合。
- VERIFY：新增国内游戏优先级合同断言，覆盖 `yuanshen.com` / `mihoyo.com` 早于 HoYoverse、Game、category-games 宽规则。

## v5.4.31 (2026-06-20)

- FIX#167-DOUYIN：抖音 Web / `zjcdn.com` 视频 CDN 前置到 `📺 国内流媒体`，避免被 TikTok、广告或国外兜底规则抢先命中。
- SYNC：Clash Party Smart/Normal、CMFA、OpenClash Normal/Smart、Shadowrocket、Surge、Loon、Quantumult X、SingBox、v2rayN、Passwall、Passwall2、FlClash 同步；SingBox Full 由 generator 重新生成。
- VERIFY：新增 Douyin Web guard 回归断言，覆盖 `www.douyin.com`、`v5-dy-o.zjcdn.com`、`v5-dy-ov-experiment.zjcdn.com` 这类首匹配路径。

## v5.4.30 (2026-06-17)

- FEAT#166-GOOGLE：新增 `🔍 Google 服务` 业务组，插入在 `🔧 工具与服务` 之前；Google 基础服务、Scholar、Google IP 与 Google QUIC 从工具组拆出。
- SYNC：业务组从 32 调整为 33，总组数从 54 调整为 55；SingBox selector/urltest 计数为 54；Passwall/Passwall2 展平 shunt rules 调整为 33 条。
- SCOPE：YouTube、Gemini/NotebookLM、Gmail、Google Voice、Meet、FCM、下载更新等既有专属归属保持不变。

## v5.4.29 (2026-06-10)

- PERF#165-LATENCY：全端统一区域自动测速间隔为 300s，降低高频测速对机场订阅与低端设备的压力。
- SYNC：Clash Party Smart `120s -> 300s`；Mihomo/url-test 家族、iOS 四件套与 OpenClash `180s -> 300s`；SingBox urltest `3m -> 5m`；CMFA proxy-provider health-check 保持/确认 300s。
- N/A：v2rayN Xray、Passwall、Passwall2 不承载自动区域测速字段，仅元数据对齐 v5.4.29 基线。
- VERIFY：新增 300s interval 合同守卫，防止后续产物回退到 120/180s。

## v5.4.28 (2026-06-07)

- ★ CLEAN#165 P2：全产物联动清理已被上游同策略规则集覆盖的直写域名（基线 -38 行，6 段）：
  - **🇭🇰 香港流媒体** (4): mytvsuper.com/nowe.com/rthk.hk/cabletv.com.hk
  - **🇹🇼 台湾流媒体** (5): litv.tv/friday.tw/linetv.tw/hamivideo.hinet.net
  - **🇯🇵 日韩流媒体** (6): tver.jp/dmm.com/dmm.co.jp/nicovideo.jp/nicovideo.me/dmc.nico
  - **🇪🇺 欧洲流媒体** (3): itv.com/itvstatic.com/britbox.com
  - **🌐 其他国外流媒体** (6): wetv.vip/wetvinfo.com/viki.com/viki.io/mewatch.sg/discoveryplus.com
  - **🎮 国外游戏** (12): ubisoft.com/ubi.com/riotgames.com/leagueoflegends.com/valorant.com/rockstargames.com/gog.com/gogalaxy.com/supercell.com/garena.com/hoyoverse.com/hoyolab.com
- **全产物联动**：Clash Party / FlClash / CMFA / OpenClash Normal+Smart / Shadowrocket / Surge / Loon / Quantumult X 同步清理；SingBox（需修改生成器，本轮豁免）/ v2rayN（无此冗余）/ Passwall/Passwall2（规则语法不同，不适用）。
- 详见 `Clash Party/CHANGELOG.md`。

## v5.4.27 (2026-06-07)

- CLEAN#165：全量下载 348 个可文本解析的上游规则集（`.mrs` 二进制仅计入覆盖来源、不作为删除证据），解析 244,417 条上游规则；发现 365 条直写域名/IP 与上游存在重叠。
- 本轮只删除”移除后首个命中仍为同策略上游规则集”的冗余项：Clash/mihomo 家族 7 条直写域名（Claude/PayPal/HBO/Hulu/Xbox 覆盖）+ Passwall/Passwall2 2 条 HBO/Max `geosite:hbo` 本地兜底。
- SYNC：Clash Party(Smart+Normal) / CMFA / OpenClash(Normal+Smart) / Shadowrocket / Surge / Loon / Quantumult X / FlClash 同步删除；SingBox Full 已由 generator 重新生成；v2rayN Xray 路由无本轮直写候选，仅元数据对齐。

## v5.4.26 (2026-06-07)

- FIX#164：腾讯 WorkBuddy `copilot.tencent.com` 被 szkane `AiDomain.list` 的 `DOMAIN-KEYWORD,copilot` 子串误吞到 `🤖 AI 服务`（国外代理）导致对话报错；在所有 AI rule-set 之前前置 `copilot.tencent.com → 🏠 国内网站` 防吞规则。详见各子目录 CHANGELOG。
- SYNC：Clash Party(Smart+Normal) / CMFA / OpenClash(Normal+Smart) / Shadowrocket / Surge / Loon / Quantumult X / FlClash 同步前置规则并 bump 至 `v5.4.26-*`；SingBox / v2rayN / Passwall / Passwall2 经核实不受影响（geosite 路径无 copilot 子串关键词，顺流 `geosite:cn` 直连），仅对齐版本号。
- VERIFY：`tools/validate-js-overwrites.js` 新增 FIX#164 回归守卫。

## v5.4.25-review.1 (2026-06-05)

- REVIEW：全仓代码审查修复 SingBox QUIC 规则不可达、业务组顺序偏差、QX 本地规则误放 `[filter_remote]`、OpenClash 固定 `/tmp` 临时文件风险、PROCESS-NAME 验证盲点与 CI 覆盖缺口。
- SYNC：CMFA / OpenClash / QX / SingBox / Passwall / Passwall2 按平台尾号递增并补齐 CHANGELOG；SingBox Full 已重新生成。
- VERIFY：扩展合同验证覆盖 SingBox 业务组顺序、无条件 FINAL 规则、fake-ip-filter 必需条目、QX 分段语法与 PROCESS-NAME CI 校验。

## v5.4.25 (2026-06-04)

- FIX：修复 CMFA `proxy-groups` 顶层 YAML 结构，补上 Ruby YAML 解析验证，防止导入/生成链路再次静默失效。
- SYNC：SR / Surge / Loon / QX / SingBox / v2rayN / Passwall / Passwall2 元数据对齐 Clash Party v5.4.25。
- FIX：Passwall active rules 将无效 `geosite:kakaotalk` 改为 `geosite:kakao` + Kakao 显式域名兜底，并让 apply 脚本默认 `--replace` 防重复追加。
- HARDEN：AI responder 限制 `/ai-help` 写权限触发者，并校验 `AI_PATCH` 路径边界；QX 文档移除不存在的 `srk_to_qx.py` 生成声明。
- VERIFY：扩展 `tools/validate-artifact-contracts.js` 覆盖 CMFA 解析、SingBox 生成器元数据、Passwall/Passwall2 规则同源性。

## v5.4.24 (2026-06-03)

- CLEAN：清除全产物 21 条冗余规则 + 3 个未引用 rule-provider（深度审查验证，逐条对比上游原始文件）
- 删除 Binance/Google 子/ProtonMail/音乐/社交/流媒体重复 DOMAIN-SUFFIX + GEOIP 重复条目
- 根 README 精简 + CHANGELOG 规范写入 CLAUDE.md / AGENTS.md
- 同步：全 14 文件（含 FlClash）

## v5.4.23 (2026-06-02)

- FIX#161：zhimg.com / zhihu.co 加入国内网站直连（知乎图片 CDN + 短链未被 geosite:cn 覆盖）
- FIX#162：SR/Surge/Loon/QX 修复失效远程规则 URL（HaGeZi TIF 403 / RemoteDesktop 不存在 / BiliIntl 路径更名）
- 同步：全 12 产物

## v5.4.22 (2026-05-31)

- GeTui(个推)推送 SDK getui.com / getui.net / gepush.com 加直连白名单（避免被广告/隐私表拦截导致 App 推送失败）
- 借鉴 Proxy-override #1 QUIC 精细化：AND 规则白名单豁免（YouTube/Google/MS/Apple），其余非 CN QUIC REJECT
- 首次补齐 CMFA + OpenClash + FlClash 的 QUIC AND 规则；SingBox generator 扩展 QUIC 转换
- 兜底判据 GEOIP,CN -> GEOSITE,cn（fake-ip 下更可靠）
- 配套新增 sniffer（QUIC/443 SNI 嗅探 + force-dns-mapping）
- iOS 四件套标注 N/A（block-quic/disable-udp-ports 不支持 AND/NOT 白名单豁免）

## v5.4.21 (2026-05-31)

- 借鉴 Proxy-override #4 DoH-over-IP bootstrap：default-nameserver 从纯明文 IP 升级为 DoH-over-IP + 1 明文兜底
- 消除 bootstrap 阶段 DNS 泄漏（阿里 + Google + Cloudflare DoH-over-IP）

## v5.4.20 (2026-05-30)

- 借鉴 Proxy-override #6 节点过滤关键词补充：isInfoNode 新增中文「免费/试用/应急」+ 英文 Sign/Login/Register/Help/FAQ（\b 词边界防误伤 Signal）
- 回归测试：新增 tools/test-info-node-filter.js（6 mihomo 产物一致性）+ 扩展 validate-js-overwrites.js fixture

## v5.4.19 (2026-05-30)

- 借鉴 Proxy-override 批 A 低风险三项：
  - #2 国内 SDK/CDN 直连前置（jpush/umeng 加入白名单；baomitu/bootcss/staticfile/upaiyun 前置国内网站段）
  - #3 fake-ip-filter 补全 10 条（远控 todesk/oray/sunlogin/teamviewer/anydesk + 游戏 battlenet + B站 P2P mcdn.bilivideo.cn）
  - #5 direct-nameserver-follow-policy: true（direct 出口域名解析遵循 nameserver-policy）
- 全产物联动：#2 全 14 产物；#3/#5 限 6 mihomo 家族
- 版本统一跳过烧毁的 v5.4.18，全产物对齐到 v5.4.19

## v5.4.17 (2026-05-26)

- FIX#DNS-SPLIT-BOOTSTRAP：DNS 固定 default-nameserver 纯 IP 自举，其它 resolver 全部 DoH
- nameserver/direct-nameserver 固定国内 DoH；proxy-server-nameserver/fallback 固定境外 DoH
- prefer-h3: false / respect-rules: true / cache-algorithm: arc 写入主线
- OpenClash FIX#KR-WB：Ruby REGIONS 裸 KR 补词边界；FIX#HOSTS-ALIGN：use-hosts 修正为 true
- SingBox DNS 冗余修复 + rule_set 去重

## v5.4.16 (2026-05-22 / 2026-05-20)

- FEAT#GAME-ACCEL：新增 16 条游戏加速器 PROCESS-NAME -> DIRECT 白名单（UU/小黑/迅游/雷神/NNer）
- FIX#149-P0：paddle.com 前置到金融支付，避免 analytics.paddle.com 被 anti-AD 误拦截
- Surge FIX#SURGE-PORT-RULE：DST-PORT -> DEST-PORT（Surge 官方语法）

## v5.4.15 (2026-05-20)

- DOC#GEOSITE-LEDGER：新增 docs/GEOSITE_COVERAGE_LEDGER.md 覆盖台账
- REFACTOR#AD-FP-MODULE：广告误伤白名单提升为 AD_FALSE_POSITIVE_ALLOWLIST，injectRules() 顶部统一注入

## v5.4.14 (2026-05-20)

- FIX#CF-R2-P0：cloudflarestorage.com 前置到国外网站，避免 Sukka phishing 把 Cloudflare R2 存储域误导向广告拦截

## v5.4.13 (2026-05-19)

- FIX#STUN-REALIP：STUN/TURN NAT 探测改为真实 IP + 标准端口直连
- fake-ip-filter 补充 stun1-4.l.google.com / STUN/TURN 通配 / global.turn.twilio.com
- DST-PORT 补齐 5349 / 19302 / 19305 / 19307

## v5.4.12 (2026-05-12)

- FIX#RD-REALIP：RustDesk 域名加入 fake-ip-filter 真实 IP 回应，避免 rendezvous/relay 在 TUN/fake-ip 下打洞失败
- Loon FIX#LOON-REMOTE-RULE：288 条远程规则集 URL 恢复到 [Remote Rule] 段

## v5.4.11 (2026-05-12)

- FIX#RD-PROC：RustDesk 桌面进程统一命中会议协作（不再归入本地工具直连白名单）
- FIX#DNS-BOOTSTRAP：DNS 自举改为 IP-first，避免 TUN/fake-ip 下 DoH 域名无法解析导致死锁

## v5.4.9 (2026-05-11)

- FEAT#LOCAL-TOOLS：新增桌面本地工具 PROCESS-NAME -> DIRECT 白名单
- 覆盖 Oray/Sunlogin/AweSun/AnyDesk/ToDesk/RustDesk/TeamViewer/ZeroTier/Tailscale/frpc/frps/ngrok/natapp/cloudflared/Navicat
- 新增 docs/process-name-compatibility.md 与 tools/validate-process-name-direct.js

## v5.4.8 (2026-05-09)

- ORDER#RULE-TAIL：重排中后段业务规则匹配顺序（UI 代理组顺序不变）
- 国内流媒体从 TikTok 之前移至国内网站之前，避免 ByteDance 共用域被抢先命中

## v5.4.7 (2026-05-09)

- FEAT#TikTok：新增独立「🎵 TikTok」业务组（32 业务组），从社交媒体独立为专属 select 组
- FIX#HK：香港节点分类补全——REGION_DB kw 追加「港」，修复广港/深港等 IEPL/IPLC 跨境专线节点名匹配

## v5.4.6 (2026-05-08)

- FEAT#145：WeChat CDN cdn.weixin.qq.com 直连（全线 14 产物同步）

## v5.4.5 (2026-05-07)

- 全球节点置顶 + 全产品组顺序同步

## v5.4.3 (2026-05-06)

- 家宽节点识别新增 \bhome\b 关键词（部分节点名仅含 Home，原 home[-_ ]?(ip|broadband) 无法匹配）

## v5.4.2 (2026-05-05)

- FIX#41-P0：小米核心服务 DIRECT 白名单——修复 miuiprivacy/advertisingmitv 误杀认证安全域名（11 条规则前置广告拦截段）

## v5.4.1-normal.2 (2026-05-05)

- FIX#FlClash-Review-P0：修复标准 Mihomo JS 运行时分类桶初始化回归（HK/TW/CN/JP/KR/SG/US/EU/AM/AF/OTHER/ALL buckets）

## v5.4.0 (2026-05-05)

- FEAT#SG：新增「🇸🇬 狮城节点」+「🏡 狮城家宽」独立区域组
- 新加坡从亚太节点中拆分为独立区域（REGION_ORDER: GLOBAL/HK/TW/SG/JPKR/APAC/...）
- 区域组 18 -> 20（10 全部 + 10 家宽），总组 49 -> 51
- 同步：全部 12 个产物

## v5.3.2 (2026-04-28)

- 微信/QQ 全系列进程强制 DIRECT（Weixin.exe / WeChatAppEx.exe / QQ.exe / WeChat.exe）

## v5.3.1 (2026-04-28)

- Weixin.exe 进程强制 DIRECT（微信进程直连，不走代理）

## v5.3.0 (2026-04-26)

- ★ REFACTOR#2：流媒体分组架构重构——按区域 -> 按平台（7 -> 13 流媒体组）
- 拆出 5 个主流平台独立组：Netflix / Disney+ / HBO/Max / Hulu / Prime Video
- 拆出 2 个全球平台独立组：YouTube / 音乐流媒体
- 保留 4 个区域锁区组：香港/台湾/日韩/欧洲流媒体
- 删除美国流媒体 + 东南亚流媒体，新增「🌐 其他国外流媒体」兜底
- 流媒体组 7 -> 13，业务组 25 -> 31，总组 43 -> 49
- 全版本联动：全部 10 产物 + 11 子目录 README + 14 CHANGELOG

## v5.2.11 (2026-04-26)

- ★ REFACTOR#1：业务组合并精简 28 -> 25（降低用户认知负担）
- 合并搜索引擎+开发者服务 -> 工具与服务；邮件服务 -> 国外网站；云与CDN -> 国外网站
- 下载更新策略从 DIRECT 优先改为代理优先；BT/PT Tracker 保留独立
- 全版本联动

## v5.2.10 (2026-04-25)

- FIX#39：境外 DoH 端点（dns.google / cloudflare-dns.com）从云与CDN改路由到受限网站（防 CDN 组被设直连导致 DoH 失败）
- 同构联动全产物；v2rayN/Passwall/Passwall2 标记平台例外

## v5.2.9 (2026-04-25)

- 全量代码审查：修复 3 个 P0/P1 基线 bug + 跨产物同构修复
  - P0 FIX#30：PROCESS-NAME 规则硬编码常量引用失效
  - P1 FIX#31：APAC_OTHER iso 列表缺 IN/IND（印度节点归类失败）
  - P1 FIX#32：jsdelivr 规则注释与代码矛盾
  - iOS 同构 FIX#33~#36：SR/Surge/Loon/QX 裸子串 US/PL/SE 跨匹配 + nowtv typo + 日期
  - CMFA FIX#37：补齐 nameserver-policy
  - Passwall2 FIX#38：geosite:kakaotalk -> geosite:kakao

## v5.2.8 (2026-04-23)

- FIX#28-P0：CMFA/OpenClash 亚太节点 filter 补 HK/TW/JP/KR 子串（同构 bug 补齐）
- OpenClash Ruby GROUP_MAP 扩充 + 去掉分类循环 break

## v5.2.7 (2026-04-23)

- FIX#27-P1：消除 mihomo 加载 3 个 classical rule-provider 时的 parse warning
- 新建 mirrors/ 目录托管 CiciAi.list / UK.list / Grok.yaml 清洗副本（仅删问题行）
- 4 个 mihomo-family 产物 URL 切到本仓库 jsdelivr 镜像

## v5.2.6 (2026-04-22)

- FIX#24-P0：补齐 ISO alpha-3 国家代码（TWN/JPN/KOR/SGP），修复命名节点归类失败
- FIX#25-P0：统一空区域不建 Smart 组，消除 HK/全节点污染台湾/日韩组
- FIX#26-P0：cleanupSubscription 全量清空订阅原生 proxy-groups
- 同步修正：本 PR 同步修订 CLAUDE.md/AGENTS.md，新增同构 bug 全产物审计强制动作

## v5.2.5 (2026-04-20)

- FIX#23-P1：删除 acc-geositecn + acc-china 两个与 geosite:cn 纯重复的 rule-provider（省 ~5 MB 内存）

## v5.2.4 (2026-04-20)

- FIX#22-P0：snapchat rule-provider 拉取 403 修复（meta-rules-dat 上游文件名 snap.mrs 非 snapchat.mrs）

## v5.2.3 (2026-04-20)

- FIX#21-P1：替换 bm7 BBC/Snap 规则源为 MetaCubeX geosite provider，消除 USER-AGENT 解析警告
- 初版 Loon / Surge / Quantumult X / v2rayN / Passwall2 产物

## v5.2.2 (2026-04-13)

- FIX#20-P2：PI.ai（inflection.ai/pi.ai）从 AI 服务移至受限网站（GFW 封锁）
- 初版 Shadowrocket / FlClash 产物；初版 OpenClash Full 产物

## v5.2.1 (2026-04-01 ~ 04-09)

- FIX#17-P0：jsdelivr CDN 永久直连，RP_PROXY 从云与CDN改为受限网站（修复 DNS 循环依赖，单日 4931 条失败）
- FIX#18-P1：删除已死的 ckrvxr 规则源（持续 404）
- FIX#19-P1：DST-PORT,7680,REJECT 规则顺序修复（提前到 GEOIP,private 之前）
- FIX#20-P2：GSCService.exe 加入 TUN exclude-process

## v5.1.9 (2026-03)

- CLEAN#1-P1：清理防吞盾（FIX#14）产生的 ~16 条 dead rules
- CFG#1-P2：移除覆写中的 geo-update-interval 和 geosite CDN URL（由用户 UI 管理）

## v5.1.8 (2026-03)

- FIX#11-P0：dns.google 被 szkane-ai 宽规则吞入 AI 服务（前置 DOMAIN 拦截到 CLOUD_CDN）
- FIX#14-P0：Google 全系子服务被 szkane-ai 宽规则吞入 AI 服务（防吞盾：邮件/IM/会议/下载/搜索/流媒体）
- PERF#2-P0：fastly.jsdelivr.net EOF 风暴缓解（步长 10s -> 15s + 随机抖动 + CDN 混合策略）
- FIX#12-P1：GSCService.exe -> ip.cip.cc DNS 解析失败
- FIX#13-P2：acc-copilot 误匹配微软 Delivery Optimization 遥测域名
- PERF#4-P2：geosite.dat CDN 错开 + geo-update-interval 24h -> 72h

## v5.1.7 (2026-03)

- PERF#1-P1：3 个 domain-behavior provider 升级为 .mrs 二进制格式（anti-ad / loyalsoldier-gfw / loyalsoldier-greatfire）
- FIX#10-P0：hagezi-tif URL 双修（CDN + 文件名）

## v5.1.6 (2026-03)

- FEAT#2-P0：新增 Hagezi Threat Intelligence Feeds（威胁情报：malware/cryptojacking/C2/scam/spam）

## v5.1.5 (2026-03)

- REFACTOR#1-P1：删除「🇮🇩 印尼本地」独立代理组（29 -> 28 业务策略组）
- 印尼银行/电商/出行等域名分拆到金融支付/国外网站；GEOIP,ID -> 国外网站

## v5.1.4 (2026-03)

- FEAT#1-P1：新增「🚫 受限网站」GFW 代理组（4 源覆盖：Loyalsoldier gfw/greatfire + GEOSITE,gfw + szkane ProxyGFWlist）

## v5.1.3 (2026-03)

- FIX#7-P1：Zoho 宽域名收窄为 mail.zoho.* 精确子域名
- FIX#8-P2：Kwai 国际版从国内媒体移到东南亚流媒体（海外 APP 需代理）
- FIX#9-P2：ehgallery 从美国流媒体移到国外网站（非流媒体服务）

## v5.1.2 (2026-03)

- FIX#1-P0：Asia_China GeoRouting 从国外网站修正为国内网站（.cn 域名/中国 IP 段误走代理）
- FIX#2-P1：BilibiliHMT 从国内媒体修正为香港流媒体（港澳台 B 站需代理解锁）
- FIX#3-P1：补充 5 个孤儿 provider 规则引用
- FIX#4~#6：HomeIP US/JP 归属修正 + Aqara Global 归属修正 + 删除 3 个 DNS provider

## v5.1 (2026-02 ~ 2026-03)

- 集成 Ckrvxr AntiPCDN + SukkaW reject_phishing + szkane crypto-exchanges
- 集成 Accademia 全量 35 规则目录 + szkane 全量规则
- geox-url 切换 Loyalsoldier 加强版 MMDB（含 cloudflare/telegram/netflix IP 段）
- 新增 GEOIP 精准标签路由（geoip:cloudflare/telegram/netflix）
- 所有外部规则 URL 统一 fastly.jsdelivr.net CDN

## v5.0 (2026-01 ~ 2026-02)

- ★ rule-providers 从 72 扩展到 326（+254 个 blackmatrix7 规则集）
- 实现 100% blackmatrix7 服务覆盖（排除已删除/国内兜底/聚合/重复/停服/测试规则）
- 刷新步长从 25s 缩短到 10s（冷启动窗口约 54 分钟）
- 新增 13 个广告拦截/隐私保护 provider
- 新增 42 个国内流媒体 / 22 个美国流媒体 / 30 个国外网站 / 15 个下载更新 / 15 个云与CDN / 13 个苹果服务 / 13 个开发者 / 10 个社交媒体 / 10 个国外游戏 / 8 个会议协作 / 7 个区域流媒体 / 6 个搜索引擎 / 6 个即时通讯 provider

## v4.5.8 (2025-12)

- P0 修复：AWS 域名前置于 RULE-SET,amazon 之前；Google 下载域名前置于 RULE-SET,google 之前
- P0 修复：live.com 范围收窄（DOMAIN-SUFFIX -> DOMAIN,mail.live.com）
- P1 修复：naver.com 拆分为流媒体子域名；清理 ~10 条同区块内冗余死规则
- P2 修复：TLS 指纹改用确定性哈希；台湾节点 Emoji 修正

---

> 更早版本（v4.5.7 及之前）见 `Clash Party/CHANGELOG.md`。
