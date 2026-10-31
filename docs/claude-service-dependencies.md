<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-claude-dependencies-mobile.svg">
  <img src="assets/readme/page-claude-dependencies.svg" width="100%" alt="技术指南">
</picture>

# Claude 服务依赖台账与静态分流核验

核对 Claude 网络依赖的角色、证据与静态首命中结果。需要检查已有收据时，从“使用与收据”中的只读命令开始。

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="下载配置"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="文档目录"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="检查与排障"></a>
</p>

[下载配置](guide/downloads.md) · [文档目录](README.md) · [检查与排障](guide/dns-and-verification.md)

## 使用入口

1. 先确认服务阶段与台账范围，区分必需、可选和待验证端点。
2. 运行 `node tools/validate-claude-service-dependencies.js --check` 读回收据。
3. 需要定位域名缺口时，再查看首命中语义与 `--strict-coverage` 边界。

独立核验工具 Version **1.0.0**。官方资料核对日期：**2026-10-13**。本工具不生成域名例外，不修改客户端策略，也不访问真实账户。

权威台账是 [claude-service-dependencies.json](../rulesets/source/claude-service-dependencies.json)，生成收据为 [rulesets/generated/claude-service-dependencies.json](../rulesets/generated/claude-service-dependencies.json)。

台账记录端点角色，规则事实仍来自 `rulesets/source/routing-graph.js` 的现行融合产物。

## 服务阶段与证据

### 登录

- **本次证实的范围**：`claude.ai`、`claude.com`、`platform.claude.com`
- **验收边界**：认证、跳转及 OAuth；`anthropic.auth0.com` 仅为待验证线索

### API

- **本次证实的范围**：`api.anthropic.com`；按功能启用的连接器与 Chrome bridge
- **验收边界**：企业 gateway/第三方模型 provider 需按实际配置另验

### 上传

- **本次证实的范围**：Files API 的 `api.anthropic.com/v1/files`
- **验收边界**：不代表普通网页上传的全部实际请求主机已经核实

### 更新/CDN

- **本次证实的范围**：Code 原生分发主机、Desktop 官方缩窄主机清单和受控动态内容后缀
- **验收边界**：按安装方式、版本和功能适用；后缀使用有限合成主机见证

### 遥测

- **本次证实的范围**：两个精确 Datadog 接收主机
- **验收边界**：官方可关闭；拒绝不等于核心服务故障

官方 [Code 网络访问要求](https://code.claude.com/docs/en/network-config#network-access-requirements) 支持登录、API、更新、bridge 和可选遥测角色；[Desktop 网络要求](https://code.claude.com/docs/en/desktop#network-access-requirements) 给出 CDN/用户内容主机清单；[Files API](https://platform.claude.com/docs/en/api/files/upload) 给出上传地址；[Data usage](https://code.claude.com/docs/en/data-usage#telemetry-services) 说明遥测关闭与用户发起反馈边界。

每条台账有来源 ID、定位说明、证据等级和核对日期。

`a-api.anthropic.com`、`a-cdn.anthropic.com` 均在官方 Desktop 缩窄访问清单中。文档将该清单用于应用代码和用户内容加载，未单独给出这两个主机的业务路径。因此将二者登记为 Desktop 必需网络依赖，不能凭名称把 `a-api` 解释成特定 API 功能。

台账的精确允许策略为 `🤖 AI 服务`。静态报告会显示当前最早命中规则与策略；若更早命中广告规则，登记 `policy-gap-pending-review`，不自动修改路由。

既有研究中的 [xiaolai](https://github.com/xiaolai/anthropic-claude-surge-rules-set/blob/1e88813a20eb4bb1e3c8612ea06a70e344837d22/domains.yaml) 和 [VPSDance](https://github.com/VPSDance/ai-proxy-rules/blob/43fab4082a0485d0988f452c8d16a0d6477ee35a/data/providers/anthropic.yaml) 只提供固定版本线索。

本工具未执行其代码，未自动导入域名。Auth0、GrowthBook、Fathom、旧 Statsig 主机、Sentry/Statsig 供应商根域名保持 `pending-verification`；旧官方文档也不能证明当前版本仍使用同一端点。

## 范围限制

- 只允许精确主机，或官方确认且本工具固定列举的动态来源后缀。受控后缀为 `claudeusercontent.com`、`claudemcpcontent.com`、`livepreview.claude.ai`、`livepreview.claude.app`，不包含 apex，也不证明所有子域均可用。
- `storage.googleapis.com` 是共享主机。当前官方资料涉及插件元数据、旧版原生更新以及用户发起反馈；域名规则无法区分 bucket/URL 路径。其现行策略只作观察，不强制整个 Google 共享服务走 AI。
- Datadog 是共享接收服务，允许可选遥测被拒绝。不能因发现一个 Claude 接收主机，便将 `datadoghq.com` 等供应商后缀放行。
- 待验证项没有强制目标策略，不能作为例外生成依据。第三方清单中的 `sentry.io`、`statsigapi.net` suffix 不导入；台账只保留根域名线索，不假定 tenant。
- 普通网页文件上传主机/路径、未知供应商 tenant、真实账号/地区/TLS、客户端更新和会话行为未实测。

## 首命中语义

<details>
<summary>展开静态模型、unknown 与覆盖判定语义</summary>

报告直接复用 [ordered-rule-semantics.js](../tools/lib/ordered-rule-semantics.js) 的 `loadRepository` 和 `firstMatch`，不另写匹配器。

`domainProjection` 在完整规则顺序中检验纯域名条件，保留规则位置、provider、payload 条目与策略。它排除进程/IP/端口等非纯域名条件，也不将 `MATCH` 兜底当作域名覆盖。后续 AI 集合中存在域名，不能推翻较早的广告命中。

`fullStatic` 只提供已知 host，没有捏造进程、IP 或 DNS 结果。更早的潜在非域名匹配会保留为 `unknown`，此时 `policy`/`hit` 为 null，`firstDecidableMatch` 仅是后续可判定候选。

它不能冒充实际客户端首命中。官方 Mihomo 规则语义见 [Rules](https://wiki.metacubex.one/config/rules/)。

`coverage.ok` 只表示有限域名见证中，官方当前证实、非共享的 required/conditional 项满足允许策略且无未决域名条件。可选遥测、共享主机、待验证项仍列入报告，但不强制放行。`service_health_proved` 始终为 false。

</details>

## 使用与收据

```powershell
node tools/validate-claude-service-dependencies.js
node tools/validate-claude-service-dependencies.js --json
node tools/validate-claude-service-dependencies.js --check
node tools/validate-claude-service-dependencies.js --check --strict-coverage
node --test tools/tests/claude-service-dependencies.test.js
```

默认打印已知缺口、未知项及可选拦截计数，成功只表示台账合法和报告能重建。`--check` 只读保存的收据，比较完整重建内容，不声称服务健康。`--strict-coverage` 额外拒绝 required/conditional 的域名缺口或未决条件，仍不代表真实服务验收。所有 CLI 模式都不写文件、不联网、不调用账户。

主生成器可以共用已加载的语义模型：

```javascript
const { buildReport, serialize } = require('./lib/claude-service-dependencies');
const report = buildReport(inventory, model);
// 主生成器统一负责写 rulesets/generated/claude-service-dependencies.json。
fs.writeFileSync(reportPath, serialize(report), 'utf8');
```

报告包含 `inventory_identity`、`semantic_identity`、`report_identity`。台账内容、来源/角色或任何首命中输入改变后，旧收据不能通过读回验证。`serialize` 对对象键排序并输出 LF，不保存本机绝对路径、浮动生成时间或 checkout 路径，便于跨 CI 比较。

来源核对日期是台账的固定证据日期，不会每次运行自动刷新。

台账维护时先核实官方角色和范围，再更新来源及核对日期、重建收据。路由修复需要另行明确授权，并遵循仓库完整生成链；本台账自身不会触发任何供应商白名单。
