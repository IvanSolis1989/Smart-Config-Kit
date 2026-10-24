<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-docs-mobile.svg">
  <img src="assets/readme/page-docs.svg" alt="Smart-Config-Kit 文档中心" width="100%">
</picture>

# 文档中心

从选配置、完整导入到运行验收，按当前任务选择阅读路径。专题与客户端教程随仓库版本统一维护。

[![下载目录](assets/readme/nav-downloads.svg)](guide/downloads.md) [![导入后验收](assets/readme/nav-verify.svg)](guide/dns-and-verification.md#verification)

[项目首页](../README.md) · [下载目录](guide/downloads.md) · [客户端选择](guide/client-support.md) · [提交问题](https://github.com/IvanSolis1989/Smart-Config-Kit/issues)

## 先完成这三步

1. **[找到配置](guide/downloads.md)**：按内核系列查找全部客户端、Raw 文件与导入教程。
2. **[确认客户端能力](guide/client-support.md)**：按平台选客户端，核对协议、最低版本和 GUI 导入边界。
3. **[完成导入后验收](guide/dns-and-verification.md)**：了解解析路径，检查规则下载、实际命中与最终出口。

## 理解分流设计

- **[策略与规则来源](guide/routing-policy.md)**：架构、33 业务组、区域选择和规则来源。
- [跨客户端能力矩阵](client-capability-matrix.md)：15 个语义产品的订阅输入、动态分组、Node-DNS 与可选能力。
- [规则质量与来源台账](rule-quality.md)：来源收据、有序语义、例外治理与发布约束。
- [GEOSITE 覆盖台账](GEOSITE_COVERAGE_LEDGER.md)：已有分类、补充规则与覆盖依据。

## 订阅与高级选项

- **[Sub-Store 多机场聚合](../SubStore/README.md)**：清洗、命名、去重并生成单一订阅。
- [浏览器订阅同步助手](../SubStore/edge-extension/README.md)：账号登录、站点授权与订阅更新边界。
- [节点过滤与倍率筛选](subscription-node-filter.md)：订阅清洗、家宽识别和筛选语义。
- [私有节点 DNS](private-node-dns.md)：活动节点域名的受限投影及静态端边界。
- [测速与 QUIC 选项](traffic-options.md)：可选流量行为与跨端支持范围。
- [ZeroTier UDP 代理](zerotier-planet-proxy.md)：默认关闭的可选方案与验证方式。
- [PROCESS-NAME 兼容性](process-name-compatibility.md)：各平台进程规则限制。

## 维护与证据

- **[仓库维护契约](../AGENTS.md)**：生成链路、版本同步和 README 编写与视觉验收要求。
- [维护工具](../tools/README.md)：官方文档缓存、生成与验证工具。
- [客户端支持队列](support-queue.md)：预适配候选、接口边界与正式支持的剩余验收。
- [Meow 通用适配](../Meow内核系/Meow/README.md)：官方核心/官方 App 原生 YAML 与可选 JS，AEROVE 专属接入单列。
- [规则资产交付](rule-asset-delivery.md)：下载 URL 与完整内容校验。
- [发布批次](release-batch.md)：生成物、版本与发布验收。
- [官方参考与历史核验](archive/README.md)：客户端 REFERENCE、注明日期的官方版本复核和专题验收原文。
- [AI Issue 自动回复](ai-issue-responder.md) · [通知说明](telegram.md) · [变更日志](../CHANGELOG.md)

历史核验档案 `upstream/2026-10-19/` 按当时的 `base_commit` 保留原路径；当前客户端位置以[下载目录](guide/downloads.md)为准。

## 社区与支持

[上游项目与致谢](guide/acknowledgements.md) · [使用边界](guide/acknowledgements.md#usage) · [支持项目](donate.md)
