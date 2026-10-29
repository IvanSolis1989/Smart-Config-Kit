# 全端离线配置下载实施计划

> **For agentic workers:** Use the scoped ownership below; do not edit another owner's files.

**Goal:** 同一离线 HTML 下载 20 个入口的原生业务方案与受支持参数。

**Architecture:** 构建时读取可信仓库配置和源图，浏览器复用纯平台投影与 typed 参数模板。单文件直接导出，多文件使用随页面内置的 fflate ZIP。

**Tech Stack:** Node.js、现有 Ruby YAML 构建解析、浏览器原生 Blob、fflate 0.8.3。

**Spec:** [设计与验收](../specs/2026-10-29-offline-all-clients-design.md)

## 全局约束与审查重点

- 默认规则、正式产物、共享 fused/MRS 与安全资产不变；不下载或刷新上游规则。
- 不执行输入/下载脚本、不使用运行期网络/动态代码、不把配置生成宣称为 App 验收。
- ZIP 路径仅使用可信白名单；文件数量、二进制字节与伴随资产闭包需要读回。
- 端间参数不泄漏；未知/不支持值拒绝；空倍率与坏数值严格区分。
- QUIC 仅处理已有受管规则，保留各端能力差异；Egern/QX 限制明确显示。
- 测试与批处理隐藏 Idle 执行；只暂存确认范围，正常推 main。

## 责任与步骤

- [x] **共享导出核心（business_profiles）**：先失败回归，再提取纯平台投影、构建 20 入口可信 bundle、生成原生文件/伴随闭包。与既有 CLI 对照；不改默认产物。
- [x] **能力参数（offline_native_parameters）**：先验证支持矩阵和非法输入失败，再实现构建期受信任槽/结构字段投影，接入共享浏览器 renderer。
- [x] **ZIP 依赖（offline_export_prior_art）**：调研、固定官方 npm fflate 0.8.3、SRI 校验、保留 MIT 和来源，zip/unzip 往返验证。
- [x] **表单（configuration_form）**：先失败 UI 回归，再接客户端选择、按端参数与导入说明、单文件/ZIP下载；保留 badInput 拒绝，版本 1.3.0。
- [x] **文档和 CI（root 协调）**：更新统一入口及过时范围说明、工具日志与触发路径，记录平台例外和无影响产物原因。
- [x] **整体验收（root）**：冻结旧版参考、检查生成/ZIP/实际浏览器下载和无请求，完成明暗/390px、相关合同与独立稳定补丁复核。
**发布规程（root）**：确认范围后 commit/push main，读回远端 SHA、工作区与最终 CI，关闭临时本机服务。动态发布收据保存于 `.cache/offline-all-clients/publication.json`。
