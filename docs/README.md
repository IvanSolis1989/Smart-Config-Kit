# docs

> 目录简介：这里存放仓库设计说明、兼容性台账、进程名白名单和捐赠图片等长期维护文档。

- [私有节点 DNS：受限投影与跨端边界](private-node-dns.md)
- [跨客户端能力矩阵](client-capability-matrix.md)（15 个语义产品的订阅输入、动态分组、Node-DNS 与可选 sidecar 边界；含 Karing 适配入口）
- 根 README 的按钮与图表位于 `assets/readme/`；修改 `tools/generate-readme-visuals.js` 后运行生成命令，使用 `--check` 校验。SVG 只使用内置文字、渐变和图形；README 修改后须先渲染并做视觉检查，再推送 GitHub。

`docs/upstream/2026-10-19/` 保存按原 `base_commit` 记录的历史路径上下文；当前客户端目录请查看[仓库根 README 的内核系列导航](../README.md#按内核系列浏览)。
