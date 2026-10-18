# Sub-Store：多机场订阅聚合与部署教程

> 这里处理的是**订阅与节点管理**，不是分流规则。Smart-Config-Kit 的规则、策略组、DNS、嗅探、GeoX 与 rule-provider 仍以 `rulesets/source/routing-graph.js` 为唯一基线。

当你想把机场 A、B、C 的节点合成一份节点池，再交给 FlClash / Clash Party 的同一份覆写脚本统一分类时，Sub-Store 是推荐的聚合层。它解决“多订阅 → 一条客户端订阅 URL”；本仓库继续解决“这一条配置里的全部节点 → 区域组、业务组与分流规则”。

```text
多个机场原生订阅
  → Sub-Store：单订阅标识、组合清洗、去重、可选流量头合并
  → 一条 Clash.Meta(mihomo) 订阅 URL
  → FlClash / Clash Party 单一 Profile + Smart-Config-Kit 覆写
  → 22 区域组 + 33 业务组
```

## 先判断是否需要聚合

| 目标 | 合适方案 |
|---|---|
| 在两个机场之间手动切换 | 客户端保留多个独立 Profile 即可 |
| 多个机场节点进入同一个“香港节点 / 全球节点 / AI 服务”等策略组 | 使用本教程的 Sub-Store 组合订阅 |
| 想让覆写脚本自行保存 URL、token、拉取并合并节点 | 不推荐；这会把订阅管理、凭据保存和刷新失败处理塞进覆写脚本 |

FlClash 的覆写运行在当前选中的单份配置上：它会处理这份配置的 `proxies`，不会读取其他 Profile 的订阅内容。因此“能添加多条 Profile”不等于“能得到一个合并后的活动节点池”。

## 安全边界（先读）

- 订阅 URL、token、UUID、密码和完整节点列表都是私密数据；不要贴到 Issue、聊天记录、仓库或公共截图中。
- 优先使用你信任的本地或自托管 Sub-Store；不要把公网可访问的后端裸露出来。
- 官方 Sub-Store 已说明 `sub.store` 相关模块域名并非其持有的公共域名，错误路由可能造成数据暴露。使用模块方案前先读官方安全公告；本教程的 Docker 方案默认仅监听本机。
- `sub-store.json` / `root.json` 是个人配置备份，不应提交到本仓库。
- Cloudflare Worker 域名本身是公开入口；管理 Token 只能用于管理页面/API，客户端订阅必须使用单独的 download Token。不要把管理 URL、Token、D1 导出或配置截图公开。

## 方式一：使用客户端内置 Sub-Store（最省事）

机场重置链接后，可配合 [Edge / Chrome 自动订阅同步助手](./edge-extension/README.md)：首次明确允许域名或 IP 后，正常打开已登录面板，扩展自动提取链接、识别机场与 Sub-Store 名称、验证节点并只替换对应 URL，保留处理步骤和组合关系。默认更新本机，也可在高级设置启用独立 Cloudflare Sub-Store；两端分别匹配和验收，部分成功不回滚另一端。日常无需选名称、复制链接或点同步；覆盖、连接配置导入和安装步骤见扩展说明。源 URL 更新、云端集合/Gist 发布与手机订阅刷新是独立步骤。

如果你已有 Clash Party 或 Mihomo Party 的内置 Sub-Store，不需要额外部署服务：

1. 在内置 Sub-Store 中把每个机场作为一条独立订阅加入。
2. 按下方“单订阅处理”给每个机场加稳定前缀。
3. 创建组合订阅，按下方顺序挂清洗和去重脚本。
4. 输出目标选择 `Clash.Meta(mihomo)`，复制组合订阅生成的一条 URL。
5. 在 FlClash 或 Clash Party 中只导入这条 URL，并关联本仓库的覆写脚本。

## 方式二：自托管 Sub-Store（Docker）

适用于没有内置 Sub-Store、希望控制数据位置，或要让多个客户端共同使用同一条组合订阅的用户。下面采用 [官方 Docker 镜像说明](https://hub.docker.com/r/xream/sub-store) 的本机监听、持久化目录和前后端路径配置；先在可信设备上部署，再决定是否需要受控的远程访问。

### 1. 准备环境

- 安装并启动 Docker。Windows 用户可使用 Docker Desktop + WSL；Linux / macOS / WSL 用户可直接在 shell 中操作。
- 新建一个**不在本仓库、不会同步或公开**的目录，例如 `scki-substore/`。容器的数据会放在该目录的 `data/` 中。
- 先准备一个仅由字母、数字和连字符组成的随机路径，例如 `/scki-7gC2kY9mQ4pL`。它用于隔离后端路径，**不是身份验证**；不要复用教程示例或把它当作唯一防护。
- 保持服务只在本机监听；除非你能自行配置 HTTPS、认证、访问控制和反向代理，不要暴露到公网。

### 2. 写入 Compose 配置

在私有目录创建 `compose.yaml`。请把 `SUB_STORE_FRONTEND_BACKEND_PATH` 中的示例路径替换为自己生成的路径，并在下方所有 URL 中保持一致；镜像 tag 固定是为了可复现，升级前请到 [官方 Tags](https://hub.docker.com/r/xream/sub-store/tags) 查看可用版本。

```yaml
services:
  sub-store:
    image: xream/sub-store:2.36.23
    container_name: scki-substore
    restart: always
    environment:
      # 自行生成；必须以 / 开头，且只使用字母、数字、连字符
      SUB_STORE_FRONTEND_BACKEND_PATH: /scki-7gC2kY9mQ4pL
      # 仅允许本机前端访问本机后端
      SUB_STORE_CORS_ALLOWED_ORIGINS: http://127.0.0.1:3001,http://localhost:3001
    ports:
      # 仅暴露前端端口到回环地址；不要映射 3000 到公网
      - "127.0.0.1:3001:3001"
    volumes:
      # 私密持久化数据；不要提交、同步或公开该目录
      - ./data:/opt/app/data
```

### 3. 启动并验证

在 `compose.yaml` 所在目录运行：

```bash
docker compose up -d
docker compose ps
docker compose logs --tail=100 sub-store
```

健康检查应返回当前环境信息（PowerShell 可把 `curl` 换成 `curl.exe`）：

```bash
curl -fsS http://127.0.0.1:3001/scki-7gC2kY9mQ4pL/api/utils/env
```

随后在同一台设备打开：

```text
http://127.0.0.1:3001?api=http://127.0.0.1:3001/scki-7gC2kY9mQ4pL
```

页面能打开、健康检查返回成功，才开始添加订阅。若显示后端不可达，逐项核对端口、`SUB_STORE_FRONTEND_BACKEND_PATH` 和浏览器 URL 里的路径是否完全相同。

### 4. 日常维护、升级与备份

```bash
# 查看状态与日志
docker compose ps
docker compose logs --tail=100 sub-store

# 升级：先确认目标 tag，再拉取和重建；./data 会保留
docker compose pull
docker compose up -d

# 停止服务但保留私密数据
docker compose stop
```

`./data` 中会保存个人配置和订阅数据。升级前把它备份到私有、加密的位置；不要把该目录提交到 Git、同步到公共网盘或贴进排障截图。若确需跨设备使用，不要简单把 `127.0.0.1` 改成 `0.0.0.0`：请使用自己的 HTTPS 反向代理，并加认证或 VPN；官方文档特别提示后端主机设置不应直接暴露，随机路径不能替代访问控制。

## 方式三：Cloudflare Workers（无服务器兼容版）

这里介绍的是社区项目 [Sub-Store Cloudflare](https://github.com/realchendahuang/sub-store-cloudflare)：它把 Source、Collection 和最终下载链接部署到你自己的 Cloudflare Worker，数据保存在 D1。它适合“多个机场 → 一条 `mihomo` URL → FlClash / Clash Party 单一 Profile”的轻量需求，但**不是**官方 Docker / Node 版 Sub-Store 的等价替代；默认仍优先方式一或方式二。

| 选择 | 脚本能力 | 适合场景 |
|---|---|---|
| 方式一 / 方式二（内置或 Docker 原版） | 可按原版能力使用本仓库 Raw 脚本 | 需要完整 Script Operator、`$substore` / `flowUtils`、流量头合并、Gist / Artifact 或 Node 本地能力 |
| 本节 `realchendahuang/sub-store-cloudflare` | 仅受信任的**构建期静态** Filter / Operator | 不想维护 VPS，只要多机场聚合、常规清理、重命名、去重、排序和单一订阅 URL |
| [`Yu9191/sub-store-workers`](https://github.com/Yu9191/sub-store-workers) | 当前通过 QuickJS WASM 提供 Script Operator 兼容层 | 愿意本地构建、理解 Workers 平台边界，并能逐个脚本实测的进阶用户 |

### 先理解“不能运行脚本”的准确含义

你记得的限制对应本节的 Cloudflare-native 兼容版：它支持多 Source / Collection、区域或正则过滤、重命名、删除、端点去重、排序、旗帜、域名解析及多客户端输出，但不从网页、D1 或远程 URL 动态执行任意 JavaScript。运行时脚本、远程脚本和脚本市场均不支持；个人 Filter / Operator 必须作为受信任代码在本地打包并重新部署后才可用。[上游兼容矩阵](https://github.com/realchendahuang/sub-store-cloudflare/blob/main/docs/upstream-compatibility.md)

原因不是 Worker 没有 `fetch` 或缓存能力，而是 Cloudflare Workers 在请求期禁止 `eval()` / `new Function()`；原版 Sub-Store 的动态脚本还会注入 `$substore`、`flowUtils`、`$httpClient`、`produceArtifact`、`require` 等宿主能力。[Cloudflare 运行时约束](https://developers.cloudflare.com/workers/runtime-apis/web-standards/) · [原版动态脚本宿主](https://github.com/sub-store-org/Sub-Store/blob/30b9113d3e1d82b7af70cf8f66c79a08b54377bd/backend/src/core/proxy-utils/processors/index.js#L1748-L1832)

所以本仓库的 `flag-airport-rename.js`、`drop-invalid-nodes.js`、`merge-subscription-userinfo.js` 等 **Raw 脚本不能直接填入本节项目**。在它的管理界面中改用内置的“清理信息节点、正则重命名、端点去重、名称排序”等操作；若必须运行这些 Raw 脚本，使用方式一/二。

> 不要把“所有 Worker 版都无法运行脚本”写成绝对结论。当前 [`Yu9191/sub-store-workers`](https://github.com/Yu9191/sub-store-workers) 已用 QuickJS WASM 兼容部分 Script Operator / Filter，但仍不是完整 Node 版；本地 MMDB、文件系统、`child_process` / shoutrrr、自定义 HTTP/SOCKS 出站代理等仍受限，且应以其 `worker-status` 能力输出与实际脚本结果为准。

### 部署与首次多机场聚合

#### 1. 准备两个不同的 Token

使用密码管理器生成两个不同的随机值，分别作为 `SUB_STORE_ADMIN_TOKEN` 与 `SUB_STORE_PUBLIC_DOWNLOAD_TOKEN`。也可以在可信本机运行：

```bash
node -e "const{randomBytes:r}=require('node:crypto');console.log(r(32).toString('base64url'));console.log(r(32).toString('base64url'))"
```

第一行只用于管理端，第二行只用于客户端下载。两者不能相同，也不能写进本仓库、截图、Issue 或聊天记录。

#### 2. 部署到自己的 Cloudflare 账号

打开 [项目主页](https://github.com/realchendahuang/sub-store-cloudflare)，点击其 **Deploy to Cloudflare**。部署向导中：

1. 导入到自己的 GitHub / GitLab 账号，不要使用来历不明的第三方部署地址。
2. 为新部署创建 D1 数据库；只有升级既有实例时才选择旧数据库。
3. 分别填入上一步生成的 `SUB_STORE_ADMIN_TOKEN` 与 `SUB_STORE_PUBLIC_DOWNLOAD_TOKEN` Secret。
4. 确认构建命令为 `pnpm run build`、部署命令为 `pnpm run deploy`，然后完成部署。

此项目按 Workers 免费版边界设计，但实际额度、可用性与账单始终以你自己的 Cloudflare 控制台为准。需要终端部署时，按其 [五分钟快速开始](https://github.com/realchendahuang/sub-store-cloudflare/blob/main/docs/quick-start.md) 的 Node.js 22+ / Corepack 流程执行；不要把 Token 写进 Git 配置或 `.env` 后提交。

#### 3. 只用管理 Token 打开后台

Worker 部署成功后，首次访问管理界面：

```text
https://<你的-worker>/?token=<SUB_STORE_ADMIN_TOKEN>
```

管理 Token 只用于这一步和管理 API。前端会保存当前浏览器的管理状态；若无法加载数据，核对输入的是 admin Token，而不是 download Token。

#### 4. 建立多机场 Source 与 Collection

1. 每个机场分别建立一个远程 Source，使用不含敏感信息的来源 ID，例如 `airport-a`、`airport-b`。
2. 第一次仅启用“清理信息节点”；需要标记来源时，使用该项目内置的正则重命名，不要粘贴本仓库 Raw JS。
3. 编辑预置的 `Daily` Collection：先启用端点去重和名称排序，并在预览中确认所有机场节点都在。
4. 第一次不要启用地区 include 过滤，避免把其它地区节点提前删掉。
5. 选择输出目标 **`mihomo`**，从 Collection 复制下载链接。

#### 5. 导入客户端并验收

1. 给 FlClash / Clash Party 新建**一条**远程 Profile，填上 `mihomo` 下载链接。
2. 链接必须使用 `SUB_STORE_PUBLIC_DOWNLOAD_TOKEN`，**绝不能**含管理 Token。
3. 在 FlClash 关联本仓库 `FlClash(mihomo).js`，刷新这一个 Profile。
4. 核对所有机场节点都出现在同一节点池，再检查区域组与业务组；来源前缀、无效节点过滤和脚本式流量头合并不适用时，应回到方式一/二处理。
5. 在 Cloudflare 管理界面导出一次配置备份；Deploy Button 创建的仓库副本不会自动合并上游更新，升级请遵循该项目的 [升级指南](https://github.com/realchendahuang/sub-store-cloudflare/blob/main/docs/upgrading.md)。

### 需要脚本时的选择

- 需要本仓库现成 Raw 脚本、`flowDedup`、`merge-subscription-userinfo.js` 或原版的动态宿主 API：选择方式一或 Docker 原版。
- 想试验上游后端的 Workers / Pages 适配：可研究 [`Yu9191/sub-store-workers`](https://github.com/Yu9191/sub-store-workers)。它需要把原版 `Sub-Store` 与适配仓库克隆到同一父目录、本地构建并绑定 KV；部署后先访问 `<worker>/<路径密码>/api/utils/worker-status`，确认鉴权、KV 与脚本能力，再导入生产订阅。其详细限制与部署步骤以该项目 README 为准。

继续使用下方的 Raw 脚本链前，请确认你的部署是方式一、方式二，或已实测支持相同脚本宿主能力的 Worker 适配；Cloudflare-native 兼容版应使用其内置节点操作。

## 聚合步骤：从多条机场订阅到一条 Mihomo URL

### 第 1 步：逐条添加机场原生订阅

每个机场单独创建一条订阅，优先使用机场提供的原生订阅链接。不要先经过来历不明的在线转换器，也不要把 URL、token 或节点截图发到公开 Issue。

### 第 2 步：单订阅先加机场前缀

给每个机场挂一次 [`flag-airport-rename.js`](./scripts/local/flag-airport-rename.js)。它输出“国旗 + 机场名 + 原节点名”，能保留来源、避免名称冲突，也不会妨碍地区识别。

脚本 URL 示例（把 `Airport-A` 改为你的本地标识，不要使用真实 token）：

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/SubStore/scripts/local/flag-airport-rename.js#name=Airport-A&separator=%20-%20&fallback=%F0%9F%8C%90
```

对 Airport-B、Airport-C 使用不同的 `name`。参数放在 `#` 后，不会随脚本请求发送给 GitHub。

### 第 3 步：创建组合订阅并按顺序处理

将所有单订阅加入一个组合订阅，然后按下面顺序添加脚本。前三项是常规清洗；名称样式不一致时再规范化，随后处理重复名称与可选流量头。需要自动发布到 Gist / Artifact 时，再添加下节的最终完整性检查。

| 顺序 | 脚本 | 作用 |
|---|---|---|
| 1 | [`drop-invalid-nodes.js`](./scripts/local/drop-invalid-nodes.js) | 移除缺少 server/port 或使用已淘汰 SS/SSR 加密的节点 |
| 2 | [`cleanup-vless-vmess-fields.js`](./scripts/local/cleanup-vless-vmess-fields.js) | 去掉 VLESS 节点混入的 VMess 残留字段 |
| 3 | [`drop-info-nodes.js`](./scripts/common/drop-info-nodes.js) | 移除“剩余流量 / 到期 / 官网”等伪节点 |
| 4（可选） | [`normalize-node-names.js`](./scripts/common/normalize-node-names.js) | 统一常见命名样式；保留默认参数即可，只有明确需要时再启用附加改写 |
| 5（名称仍有重复时） | [`dedupe-node-names.js`](./scripts/common/dedupe-node-names.js) | 为仍然重名的节点追加稳定序号，避免客户端覆盖 |
| 6（可选） | [`merge-subscription-userinfo.js`](./scripts/local/merge-subscription-userinfo.js) | 汇总独立机场的流量头，并防止镜像订阅重复计量 |

从 GitHub 打开脚本后复制 **Raw** 地址填入 Sub-Store。不要直接修改仓库脚本来写入机场 URL 或 token。

### 第 4 步：输出单一订阅 URL

组合订阅的目标格式选择 **`Clash.Meta(mihomo)`**。Sub-Store 生成的一条下载/订阅 URL 才是给 FlClash 或 Clash Party 使用的入口；不要把多条原始机场 URL 分别关联到同一覆写逻辑，期望它们自动变成一个节点池。

### 第 5 步：导入 FlClash 或 Clash Party

1. 新建或更新**一条**远程 Profile，URL 填组合订阅输出。
2. FlClash：按 [`FlClash/README.md`](../FlClash/README.md) 创建并关联 `FlClash(mihomo).js` 覆写脚本。
3. Clash Party：导入组合订阅后，使用对应 Smart / Normal 覆写脚本。
4. 刷新订阅并查看节点：每个机场都应能通过前缀追溯来源，区域组应同时看到各机场符合地区条件的节点。

## 自动发布前的完整性保护

HTTP 200、YAML 合法、节点总数非零，都不能证明所有机场已成功聚合。下载失败可能被忽略，机场也可能返回语法正确的“设备过多 / 更新订阅链接”占位节点。完整性检查应处于生成完成、上传 Gist / Artifact 之前；失败时保留已验证的上一份完整发布物。

### 本地 Sub-Store：严格下载并在最后检查

1. 对所有参与聚合的单订阅和组合订阅显式保存 `ignoreFailedRemoteSub: "disabled"`。只改组合不足以阻止子订阅吞掉失败；`quiet` 和 `fallbackQuiet` 也不能代替严格失败处理，后者可能返回空结果，并非自动复用上次完整数据。
2. 为需要代理下载的源固定保存其 `proxy`，并在自动同步环境验证该代理可用。不要依赖预览请求临时追加的 `proxy` / `noCache`：当前核验的原版 artifact 同步入口不会将这些 query 传给生成器，其他版本应核对实际实现。
3. 在来源重命名、清洗、去重和可选流量头处理之后，设置**最终 ScriptOperator**，调用 [`validateFusionPublication`](./scripts/fusion-publication-guard.mjs)。部署者需要将校验函数及私有合同适配进该操作器，并确认抛错确实使本次 artifact 生成失败、停止上传。这个 ESM `.mjs` 不是可直接粘贴 Raw URL 的 Sub-Store 操作器；接入示意见[脚本说明](./scripts/README.md#fusion-发布完整性模块)。
4. 合同同时设置合理的最低节点数与每个必需逻辑来源的稳定名称前缀。镜像链接可属于同一逻辑来源；多条输入记录不等于覆盖全部来源。节点下限应根据已验收基线制定，不能通过调低门槛掩盖缺失来源。

合同只接受这三个字段，以下数值和来源均为通用演示：

```json
{
  "schemaVersion": 1,
  "minimumNodes": 10,
  "requiredNamePrefixes": ["SOURCE-A-", "SOURCE-B-"]
}
```

前缀按字面量、区分大小写、从名称起始位置匹配，不是正则；本地合同须与最终处理后的名称一致。模块还拒绝名称中包含以下五种已确认的 HTTP 200 错误占位提示：`在线设备数量超过套餐允许值`、`打开官网获取新订阅链接`、`请复制新订阅链接重新导入更新`、`使用的设备过多`、`请去官网获取新订阅链接`。普通流量与到期信息不会仅因这些通用词被该检查误判。若前置清洗已移除错误节点，最终检查仍须依靠必需来源覆盖发现缺口；它不证明节点实际可连接，也不能识别所有未知错误文案。

**恢复与新发布分开验收。** 某个源仍返回 403 时，可保留其订阅记录并检查已验证旧数据的恢复路径；恢复物即使暂时可供客户端使用，也不能声明满足仍包含该源的完整合同。严格新发布须覆盖全部必需逻辑来源。改变必需来源集合属于单独的明确决定，不应在重试时自动删除缺失项或放宽门槛。配置中的节点数、客户端当前内存节点数与发布文件应分别核对，避免把旧活动配置当成新发布验收。

### 已审查的 Gist → KV Worker wrapper

[`patch-fusion-worker.mjs`](./scripts/patch-fusion-worker.mjs) 只对已审查、精确匹配的 `sckiValidFusion` / `sckiPublishedFusion` wrapper 做纯源码变换。它不是通用 Workers 安装器，也不自行部署、写 KV 或同步 Gist；上游 wrapper 改动、重复匹配或已打补丁时会拒绝处理。标准 Sub-Store、上述不同 Workers 项目不能未经审查直接套用。

接入方须提供同目录模块 `scki-fusion-publication-guard.mjs`，并在 `SUB_STORE_DATA` KV 的 `static:fusion:contract:v1` 存入上述**严格发布合同**。wrapper 先用 `validateFusionContract` 验证它；缺失、读取失败或非法时，在请求 Gist 前直接返回 503，即使存在恢复合同也不能回退。新 Gist 内容只有同时通过原有 YAML / 节点字段校验和严格发布合同，才能更新 `static:fusion:clashmeta`；坏 Gist 不覆盖好缓存。

上游不可用或不符合严格发布合同时，wrapper 才尝试读取保存副本。可选 KV `static:fusion:recovery-contract:v1` 专用于验收这份缓存；缺省或读取失败时回用严格发布合同，显式提供非法恢复合同时拒绝缓存。缓存通过相应恢复检查才可返回，否则返回 503。恢复合同须基于已验证旧数据单独审阅与验收，可以与严格发布合同相同；若为恢复旧数据设置不同要求，它也只允许读取缓存，不能放行缺源的新 Gist、写入新缓存或降低新发布标准。提高合同要求前应分别验收候选与回退数据，避免误把旧缓存当成符合新发布要求的产物。

Worker 仅为来源覆盖检查移除名称开头的一枚国旗、白旗或地球符号及其后空白，原始输出保持不变；其他 emoji 不会被任意去除。此保护只覆盖该 wrapper 的发布读取路径；本地 artifact 上传和绕过 wrapper 的原生下载路径仍需各自校验。使用与测试入口见[脚本说明](./scripts/README.md#fusion-发布完整性模块)。

## 验证清单

- 组合订阅只有一条客户端导入 URL，且输出格式为 `Clash.Meta(mihomo)`。
- Airport-A / Airport-B 等前缀都能在代理列表中找到；没有“流量、到期、官网”等伪节点。
- FlClash 日志中的处理节点数等于组合后的节点总数，而不是某一个机场的数量。
- 区域组和业务组正常出现；FlClash 使用覆写脚本时应看到最多 22 个区域组和 33 个业务组。
- 同名节点没有被静默覆盖；必要时检查 `dedupe-node-names.js` 的日志。
- 流量统计仅在使用可选脚本后检查：独立机场应相加，镜像订阅应只计一次。
- 自动发布时，必需源故障、来源缺失、低于节点下限或错误占位节点均应阻止新发布；Worker 的坏上游不得覆盖已验收缓存。

## 镜像订阅流量去重

[`merge-subscription-userinfo.js`](./scripts/local/merge-subscription-userinfo.js) 只处理组合订阅的流量头，不改变节点去重逻辑。

1. 自动去重：两个订阅去掉域名后路径和查询参数一致，且 `total`、`expire` 相同，按同一镜像账户处理；`upload`、`download` 允许存在小幅 CDN 缓存差异。
2. 显式去重：镜像 URL 路径不同或元数据不同，在每条订阅 URL 的 `#` 参数中设置同一个 `flowDedup` 键。

```text
https://sub-a.example/api/v1/client/subscribe?token=...#flowDedup=airport-alpha
https://sub-b.example/mirror/subscribe?token=...#flowDedup=airport-alpha
```

同一 `flowDedup` 组内，`upload`、`download`、`total` 取最大值，到期时间取最新值；独立机场仍相加。若两条相同流量头确实是独立计费，使用 `#flowDedup=off` 禁用自动去重。脚本日志不会输出订阅 URL 或 `flowDedup` 值。

## 常见问题

### FlClash 里能存多条订阅，为什么还要 Sub-Store？

多条 Profile 用于切换；覆写脚本只处理当前活动 Profile 的配置。Sub-Store 的作用是先把多个机场变为一份 `proxies` 列表，让同一覆写脚本能一次完成分类。

### 组合后策略组为空或只剩一个机场的节点？

确认客户端导入的是组合订阅的一条输出 URL，并且覆写脚本关联在这条 Profile 上。随后刷新该 Profile；不要分别刷新多个原始机场 Profile 后期待客户端自动合并。

### 节点名称重复、来源看不出来怎么办？

先对每个单订阅使用 `flag-airport-rename.js`，再在组合订阅使用 `dedupe-node-names.js`。前者保留来源，后者处理仍然重复的名称。

### 为什么不把订阅 URL 直接写进 Smart-Config-Kit 的 JS？

订阅管理需要处理凭据、刷新、故障隔离、流量头和节点去重；将私密 URL 放进公开脚本既不安全，也让覆写脚本承担不属于它的职责。仓库只提供脱敏的聚合脚本模板。

## 目录与参考

```text
SubStore/
  README.md                 本教程
  scripts/
    README.md               脚本用途与推荐顺序
    local/                  从本机配置脱敏抽出的聚合脚本
    common/                 可复用通用脚本
    community/              上游脚本索引
```

- [Sub-Store 官方仓库](https://github.com/sub-store-org/Sub-Store)：格式转换、订阅整理、脚本操作与多订阅收集能力。
- [Sub-Store 官方 Docker 镜像说明](https://hub.docker.com/r/xream/sub-store)：本机端口绑定、数据持久化、后端路径、CORS 与健康检查参数。
- [Sub-Store 官方 Wiki](https://github.com/sub-store-org/Sub-Store/wiki)：Docker 部署入口；环境变量以 Docker 镜像说明为准。
- [Sub-Store 官方安全公告](https://github.com/sub-store-org/Sub-Store#substore-domain-safety-notice)：使用模块或公共前端前应理解的数据暴露边界。
- [FlClash 覆写教程](../FlClash/README.md)：将组合后的单一 URL 接入本仓库 FlClash 覆写。
