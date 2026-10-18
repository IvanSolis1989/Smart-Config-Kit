# Sub-Store Scripts

这里放 Sub-Store 的“脚本操作 / 脚本筛选”辅助脚本。

## local

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

## Fusion 发布完整性模块

这两个 ESM 模块只处理订阅发布，独立于路由图和客户端覆写：

| 模块 | 接口与边界 |
|---|---|
| [`fusion-publication-guard.mjs`](./fusion-publication-guard.mjs) | `validateFusionContract(contract)`：独立验证合同结构和值，非法时抛错；`validateFusionPublication(document, contract)`：先验证合同，再对已解析且通过字段校验的 `document.proxies` 检查最低数量、全部必需名称前缀及五种错误占位提示；失败抛错，成功只返回 `{nodes, coveredPrefixes}`，不修改节点 |
| [`patch-fusion-worker.mjs`](./patch-fusion-worker.mjs) | `patchFusionWorker(source)`：返回加入合同校验的新源码；只接受已审查的精确 wrapper 基线，拒绝歧义或重复补丁；无文件、网络、部署或凭据操作 |

合同为 `{schemaVersion: 1, minimumNodes: 正整数, requiredNamePrefixes: 非空唯一字符串数组}`，不接受额外字段。来源前缀是区分大小写的字面起始匹配。错误占位提示和本地/云端完整接入要求见[发布保护](../README.md#自动发布前的完整性保护)。这些模块不会推断私人合同，不会证明机场节点连通性。

本地 ScriptOperator 要把同一校验函数和私有合同包含在实际脚本执行环境中；ESM 文件的 `export` 或相对 `import` 不应直接粘贴到原版 Sub-Store Raw 脚本框。下面只展示最终操作器的调用位置，`validateFusionPublication` 与 `publicationContract` 必须由接入方先提供：

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

以上属于辅助订阅发布保护，不修改规则、策略组、DNS 或客户端产物版本，不触发 14 类客户端同步。模块变更记录见 [SubStore CHANGELOG](../CHANGELOG.md)。

## common

`common/` 是仓库维护的通用模板，不绑定任何机场：

- `drop-info-nodes.js`
- `normalize-node-names.js`
- `dedupe-node-names.js`

## community

`community/` 只做 GitHub 常见脚本索引。无明确许可证、过度依赖外部 API、或容易暴露个人参数的脚本不直接复制进仓库。

