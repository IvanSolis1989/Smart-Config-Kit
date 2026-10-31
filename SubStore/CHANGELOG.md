<picture>
  <source media="(max-width: 600px)" srcset="../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../docs/assets/readme/page-changelog.svg" alt="SubStore 变更日志" width="100%">
</picture>

# SubStore 变更日志

> SubStore 是辅助脚本目录，不参与 14 类客户端正式分流产物的生成。

[![文档中心](../docs/assets/readme/nav-docs.svg)](../docs/README.md) [返回 README](../README.md) · [仓库文档中心](../docs/README.md)

## 浏览器扩展 v1.8.1 / 证据复核与并发失败保护 (2026-10-23)

- local 快照在只读结果返回前与备份后写入前重新读回比较，阻止等待期间的配置修改被覆盖；新增客户端到实际 Worker 快照模块的合成联调及并发/失败回归。详见[扩展日志](./edge-extension/CHANGELOG.md)与[分阶段验收记录和执行标准](../docs/research/2026-10-23-substore-v1.8-validation.md)。真实服务与手机链路仍待用户环境验收；不修改 Worker API、规则图或发布者。

## 文档精简 (2026-10-19)

- 精简聚合、脚本与扩展使用说明，保留图表、命令、授权与隐私边界；辅助模块和安装产物未变。

## 浏览器扩展 v1.8.0 / 受控持久 local 内容快照 (2026-10-18)

- 为显式允许的本地空 URL 条目提供一次性抓取、双端各自 local 预览、content 单字段写入/读回及条件恢复；不将一次性链接持久化为远程来源。Cloudflare 专用策略和 revision 限制独立于既有 remote 限期快照。
- 配套 `local-snapshot.mjs` / `patch-local-snapshot-worker.mjs` v1.0.0，以 `SUB_STORE_LOCAL_SNAPSHOT_POLICIES` 和专用 `/api/local-snapshot/:name` GET/POST 约束受限入口；完整 revision 检查、原生预览与 content 单字段提交置于同一 DO 串行操作内，不开放通用内容管理权限。
- 旧内容备份属于敏感本机数据；关闭本机不影响云端输出已存 local 内容，但刷新下一份一次性来源仍需本机。原发布者、Gist 和手机副本不会自动切换；详见[扩展日志](edge-extension/CHANGELOG.md)。仅辅助订阅管理，不修改分流产物。

## 浏览器扩展 v1.7.0 / 受阻源原始快照 (2026-10-18)

- 增加策略限定的单源原始快照链路：本机严格 `noCache` 的 `original` 节点经私密入口上传，Cloudflare 校验来源、最低数量、精确 URL 与配置绑定后限期保存，并执行云端原有处理器。24 小时有效期与 120 秒候选预览窗口分离；仅直连确证 403 challenge 或网关 530 后直连得到的确证 403 challenge 回退，不覆盖网关 200 包装上游 403。
- 准备阶段仅去掉精确套餐元数据且保留全部真实原始节点；服务端只收全真实节点，其他无效、超限占位和最低数量不足继续拒绝。CI 增加扩展快照准备与 Worker 模块回归，真实 seed 和发布链路仍须独立验收。
- 原始节点不入扩展永久存储，不上传本机已处理 Fusion；受阻源刷新仍依赖本机运行一次，健康来源不依赖本机，无需 VPS。不修改 Gist / Fusion 发布者、已发布客户端副本或分流产物；详细边界见[扩展日志](edge-extension/CHANGELOG.md)。

## 浏览器扩展 v1.6.0 (2026-10-18)

- 本机中转改为 offscreen 隐藏 iframe，保留前端自然 Origin 与写入保护，不再打开可见标签；后台恢复、断线重绑定与 15 文件打包闭包同步更新。详见[扩展日志](edge-extension/CHANGELOG.md)。
- 308 项 Node 与 33 项隔离 Edge 业务流程通过，另有真实 worker 重启等 7 项探针。仅修改辅助订阅管理工具，不影响分流产物或 Gist 发布者。

## 独立网页管理别名模块 v1.0.0 (2026-10-18)

- 增加独立完整管理前缀选择与精确 Worker 补丁；保留旧入口和扩展受限入口，原始环境不变。新 secret 由部署所有者单独授权启用，不复用扩展 URL 单字段权限。
- 补充前端 `api` 深链的官方参数依据、私密地址交付边界和旧/新入口并存回归；不修改规则图、客户端产物或发布者。

## 下载网关 530 恢复模块 v1.0.0 (2026-10-18)

- 新增独立恢复模块和精确 Worker 源码补丁：已有网关返回 HTTP 530 时，仅对 GET/HEAD 以原目标、上游请求头和取消信号尝试一次直连，拒绝重定向及非成功响应；其他状态与错误继续失败。
- 保留网关秘密与来源 allowlist，不修改订阅写入、处理器、发布者或规则产物；增加故障分支回归和 CI。实际来源仍须独立预览与完整性验收。

## 浏览器扩展 v1.5.1 / 受限同步入口 v1.0.1 (2026-10-18)

- 修复云端真实请求暴露的运行时兼容问题：无 body GET 不声明 JSON Content-Type，Worker 内部转发和预览条目查询使用 `redirect: manual`，保留 3xx 非成功响应检查。依据 [Cloudflare workerd Request 实现](https://github.com/cloudflare/workerd/blob/main/src/workerd/api/http.c%2B%2B) 及实际 Worker 调用日志，补充拒绝 `redirect: error` 的回归。
- 仅涉及辅助订阅管理通信，不更改规则图、DNS、客户端分流产物或 Gist 发布者。

## 扩展受限同步入口模块 v1.0.0 (2026-10-18)

- 新增 `extension-sync-route.mjs` 与 `patch-extension-sync-worker.mjs`：为已审查的 Worker wrapper 提供独立 secret `SUB_STORE_EXTENSION_BACKEND_PATH` 前缀，仅允许订阅目录/单条 GET、JSON 预览和仅含 `url` 的单条 PATCH，保留旧路由；拒绝专用前缀下其他业务接口与参数。
- 预览必须从同一服务端读取持久条目，处理器、内容和其他字段须完整一致，仅允许替换 URL 与固定刷新标志；服务端查询失败时拒绝请求，防止预览绕过受限入口执行任意处理脚本。
- patcher 只做匹配后的源码变换，不生成或读取部署秘密，不自行部署；私人连接 JSON 单独交付，不进入 Git 或公共安装包。该范围属于辅助订阅管理，不修改规则图或客户端产物。

## 浏览器扩展 v1.5.0 (2026-10-18)

- 新增默认关闭的独立 Cloudflare Sub-Store 目标、私密后端连接配置与 JSON 导入；两端分别验证、更新和恢复，支持部分成功且不自动重试已发送 PATCH。详见[扩展日志](edge-extension/CHANGELOG.md)。仅更新辅助订阅管理工具，不改分流产物。
- 修复浏览器权限查询异常造成已许可站点记录被永久删除的问题，异常时暂停访问并保留许可；同 origin 新文档和后台重启无需再次授予。
- 增加从已提交 Git ref 生成 13 文件安装目录的打包 CLI 和只读检查；33 项隔离 Edge 流程通过，包含双端成功与部分成功，真实账号和权限对话框仍独立验收。

## Fusion 发布完整性模块 v1.0.0 (2026-10-18)

- 新增 `fusion-publication-guard.mjs`：提供独立合同验证 `validateFusionContract`，并以私有合同检查最低节点数、必需逻辑来源前缀和五种已确认的 HTTP 200 错误占位提示，错误仅报告类别或计数，不输出节点或凭据。
- 新增纯源码 patcher：只接受已审查的精确 Worker wrapper；生成的 wrapper 在请求 Gist 前验证严格 KV 合同 `static:fusion:contract:v1`，缺失或非法即 503，新 Gist 只有满足严格合同才能写入缓存。可选 `static:fusion:recovery-contract:v1` 仅用于保存副本回退，缺省或读取失败回用严格合同，显式非法时拒绝缓存；恢复要求须单独验收，不降低新发布标准。patcher 不自行部署或写入任何外部状态。
- 文档补充本地所有参与单订阅/组合的严格失败模式、持久化下载代理、最终 ScriptOperator 接入，以及恢复数据与完整新发布的验收区别；公共示例不含私人来源合同。
- CI 增加 ESM 路径与两套回归测试触发、语法检查和完整性测试，保留浏览器扩展已有构建、Node 与 Windows Edge 端到端检查。本模块独立版本，不改路由或客户端产物，无需全端重生成。

## 浏览器扩展 v1.4.1 (2026-10-18)

- DOM 控件撤下会失效并清空待办；预渲染激活重新握手，正常恢复无需刷新。缓存编码审查项的实际后端验证与范围见[扩展日志](edge-extension/CHANGELOG.md)。

## 浏览器扩展 v1.4.0 (2026-10-18)

- 处理 PR #189 第二轮审查：站点信任与浏览器访问权限分开，首次许可后继续自动提取、匹配和写回；修复跨响应歧义、未监听目标页面的文档失效及失败中转页泄漏。详见[扩展日志](edge-extension/CHANGELOG.md)。

## 浏览器扩展 v1.3.2 (2026-10-18)

- 处理 PR #189 的四项 Codex Review：晚到歧义取消尚未发送的写入、账户参数保真、相对锚点及完整回环地址识别。实现与回归详见[扩展日志](edge-extension/CHANGELOG.md)。

## 浏览器扩展 v1.3.1 (2026-10-18)

- 新增 `edge-extension/`：授权域名/IP上的通用订阅与品牌提取，自动匹配本机 Sub-Store 现有名称；验证原始及处理后节点后仅 PATCH 对应 URL，备份并独立读回其他字段。不依赖六家预设，不需正常流程手动点按钮。
- 使用本机 Sub-Store 前端标签页的正常 Origin 完成通信，兼容内置后端 CORS；六家实际账号均完成自动流程验收，处理步骤及其他字段保持一致。
- 新增 Node 提取、消息、路由、权限、通信与回写回归及 CI。详细历史见 [扩展 CHANGELOG](edge-extension/CHANGELOG.md)。不包含已取消的密码/API 登录脚本或私人配置。
- 同步结果绑定当前版本并展示页面阶段；升级后的历史成功记录不计为本轮验收。真实 Edge 复现跨 world 文件 URL 去重后，改为源码生成两个独立入口并加入真实无账号浏览器自动流程回归；逐站实测通过后才提交或推送。
- 六家真实自动流程均有成功收据，处理步骤和非 URL 字段保持一致；158 项 Node 回归及 15 项真实 Edge 独立流程通过。[验收范围](../docs/research/2026-10-18-substore-auto-sync-acceptance.md)明确复用记录与 Chrome 未实测边界。

## v6.0.2-substore.2 (2026-07-11)

- 修复真实 CDN 镜像的计数漂移：同一账户的镜像可有几 KB 级 `upload` / `download` 缓存差异，不能以四项流量头逐字节相等作为自动去重前提。
- 自动身份改为 host 无关的订阅路径/参数 + 相同 `total` / `expire`；镜像组内继续取每个计数最大值。不同账户仍要求路径/参数身份一致，路径或计划元数据不同的镜像继续使用 `flowDedup` 显式归组。
- 修复 Clash Party 内置 Sub-Store 的 logger receiver 问题：`$substore.info` 必须以 `$substore` 为 receiver 调用。此前最终状态日志会抛错并使脚本事务回退，导致旧流量头没有被新汇总结果覆盖。

## v6.0.2-substore.1 (2026-07-11)

- `merge-subscription-userinfo.js` 新增镜像订阅流量去重：完整且同源路径/参数的相同流量快照自动合并；不同镜像地址可通过订阅 URL 的 `flowDedup` 显式归组。
- 显式归组内对流量计数和到期时间取最新值，防止 CDN 缓存延迟使同一账户被重复累加或提前显示到期；`flowDedup=off` 可保留两个相同流量头的独立订阅。
- 新增 Node 回归测试，覆盖自动去重、独立订阅保护、显式归组、关闭去重和 SubStore runtime 持久化路径。
