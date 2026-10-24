<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-substore-mobile.svg">
  <img src="../../docs/assets/readme/page-substore.svg" alt="Sub-Store · 脚本与发布辅助模块：先为单订阅标记来源，再在组合订阅清洗、去重；自动发布另接完整性保护。" width="100%">
</picture>

# Sub-Store · 脚本与发布辅助模块

先为单订阅标记来源，再在组合订阅清洗、去重；自动发布另接完整性保护。

<p>
  <a href="../../docs/guide/downloads.md"><img src="../../docs/assets/readme/nav-downloads.svg" alt="配置下载" width="145" height="38"></a>
  <a href="../../docs/README.md"><img src="../../docs/assets/readme/nav-docs.svg" alt="文档中心" width="145" height="38"></a>
</p>

[接入顺序](#按顺序接入聚合脚本) · [发布保护](#fusion-发布完整性模块) · [网页管理](#独立网页管理入口) · [530 恢复](#下载网关-530-恢复) · [返回教程](../README.md)

---

<a id="local"></a>

## 按顺序接入聚合脚本

`local/` 来自本机 Mihomo Party / Clash Party 的 Sub-Store 配置，已脱敏。推荐顺序：

1. 单条机场订阅：`flag-airport-rename.js`
2. 组合订阅：`drop-invalid-nodes.js`
3. 组合订阅：`cleanup-vless-vmess-fields.js`
4. 组合订阅：`../common/drop-info-nodes.js`
5. 组合订阅（可选）：`../common/normalize-node-names.js`
6. 组合订阅（名称仍有重复时）：`../common/dedupe-node-names.js`
7. 组合订阅（可选）：`merge-subscription-userinfo.js`
8. 自动发布前的最终 ScriptOperator：按下节接入完整性校验。

`merge-subscription-userinfo.js` 会正常累加独立机场的流量；镜像订阅可在订阅 URL 中用相同的 `#flowDedup=...` 键归组，具体示例和自动去重边界见 [上级 README](../README.md#镜像订阅流量去重)。

<a id="common"></a>

## 通用清洗模板

`common/` 是仓库维护的通用模板，不绑定任何机场：

- `drop-info-nodes.js`
- `normalize-node-names.js`
- `dedupe-node-names.js`

<a id="community"></a>

## 第三方参考

[community/](community/README.md) 只做 GitHub 常见脚本索引。无明确许可证、过度依赖外部 API、或容易暴露个人参数的脚本不直接复制进仓库。


## Fusion 发布完整性模块

这两个 ESM 模块只处理订阅发布，独立于路由图和客户端覆写：

### 发布合同校验

模块：[fusion-publication-guard.mjs](fusion-publication-guard.mjs)。

```js
validateFusionContract(contract)
validateFusionPublication(
  document,
  contract
)
```

- `validateFusionContract` 独立验证合同结构和值，非法时抛错。
- `validateFusionPublication` 先验证合同，再对已解析且通过字段校验的 `document.proxies` 检查最低数量、全部必需名称前缀及五种错误占位提示。
- 校验失败时抛错；成功只返回 `{nodes, coveredPrefixes}`，不修改节点。

### Worker 源码补丁

模块：[patch-fusion-worker.mjs](patch-fusion-worker.mjs)。

```js
patchFusionWorker(source)
```

- 返回加入合同校验的新源码。
- 只接受已审查的精确 wrapper 基线，拒绝歧义或重复补丁。
- 无文件、网络、部署或凭据操作。

合同只接受 `{schemaVersion: 1, minimumNodes: 正整数, requiredNamePrefixes: 非空唯一字符串数组}`；前缀按字面起始、区分大小写匹配。模块不推断私人合同或证明连通性；错误占位及接入要求见[发布保护](../README.md#自动发布前的完整性保护)。

本地 ScriptOperator 须包含校验函数与私有合同，不能直接粘贴 ESM `export` / 相对 `import`。以下仅示调用位置，两个引用须由接入方提供：

```js
function operator(proxies) {
  validateFusionPublication({ proxies }, publicationContract);
  return proxies;
}
```

它应放在全部处理器最后，并让校验异常向上传播；同时将所有参与单订阅和组合的 `ignoreFailedRemoteSub` 保存为 `disabled`，固定保存所需下载代理。须用缺源、错误占位和全部源健康三种实际生成结果验收是否阻断/放行；单靠生成文件语法合法不能确认发布成功。

Worker patcher 会引入 `./scki-fusion-publication-guard.mjs`，调用方须以这个名称提供 guard 模块。生成的 wrapper 在请求 Gist 前读取并验证 `SUB_STORE_DATA` 中的严格合同 `static:fusion:contract:v1`；缺失、读取失败或非法时直接返回 503，恢复合同不能绕过它。新 Gist 只按严格合同验收，通过后才允许写入 `static:fusion:clashmeta`。

缓存回退另读可选 `static:fusion:recovery-contract:v1`；缺省或读取失败回用严格合同，显式非法恢复合同拒绝缓存。恢复合同只决定已保存副本能否返回，不能使缺源新 Gist 写入 KV。不同的恢复要求必须根据已验证旧数据单独验收，不降低严格新发布标准。处理原有 wrapper 源码、审阅 diff、准备合同/模块和实际部署均由调用方另行负责，运行 patcher 不会自动完成部署。

仓库根目录验证：

```bash
node --check SubStore/scripts/fusion-publication-guard.mjs
node --check SubStore/scripts/patch-fusion-worker.mjs
node --test tools/tests/fusion-publication-guard.test.js tools/tests/fusion-worker-patch.test.js
```

这些辅助模块不改变分流产物，不触发全客户端同步。历史见 [SubStore CHANGELOG](../CHANGELOG.md)。

## 独立网页管理入口

[`web-management-route.mjs`](web-management-route.mjs) 与 [`patch-web-management-worker.mjs`](patch-web-management-worker.mjs) 为已审查的 extension-aware Worker wrapper 增加独立网页管理别名。部署者通过 secret `SUB_STORE_WEB_BACKEND_PATH` 设置 `/web-` 加 64 位小写十六进制随机值；命中此前缀时，只为本轮旧路由选择克隆的环境，不改旧管理 secret 或扩展受限入口，也不改变后端使用的原始 bindings。

该路径具有完整后端管理权限，应与扩展的 URL 单字段连接分开保管。patcher 引入同目录 `scki-web-management-route.mjs`，只接受唯一审查匹配行；模块不生成凭据或执行部署。启用新管理路径须得到部署所有者授权。

官方前端支持 `https://sub-store.vercel.app/subs?api=<encodeURIComponent(完整后端地址)>`，查询参数会随首次网页请求发送给前端站点。也可在前端设置中手动保存后端地址，再使用裸 `/subs`；不应将未经支持的 `#api` 当作等效入口。参数行为见[官方前端源码](https://github.com/sub-store-org/Sub-Store-Front-End/blob/8dc19320894a9dbb3569e8bf3e41057491e39b90/src/hooks/useHostAPI.ts#L211-L308)。私人管理地址、快捷方式与连接 JSON 不提交 Git 或扩展安装包。

```bash
node --test tools/tests/web-management-route.test.js
```

## 下载网关 530 恢复

[`download-gateway-fallback.mjs`](download-gateway-fallback.mjs) 与 [`patch-download-gateway-worker.mjs`](patch-download-gateway-worker.mjs) 适用于已审查的 Worker 下载适配器。原有网关返回 HTTP 530 时，仅对 GET/HEAD 尝试一次由 Worker 直连同一目标，保持原上游请求头与取消信号；直连使用 `manual` 并拒绝重定向和非成功响应。其他网关错误继续失败，已有来源预览、节点校验和完整发布合同仍需通过。

补丁不更改网关 URL、Token、来源 allowlist、Sub-Store 配置或任何写入路径。它只接受精确的适配器源码基线，输出源码并引用同目录 `scki-download-gateway-fallback.mjs`，不自行部署。接入者须按返回的模块引用准备部署包，并以实际来源预览验收；不能把网关错误或错误占位节点当成下载成功。

```bash
node --check SubStore/scripts/download-gateway-fallback.mjs
node --check SubStore/scripts/patch-download-gateway-worker.mjs
node --test tools/tests/download-gateway-fallback.test.js
```
