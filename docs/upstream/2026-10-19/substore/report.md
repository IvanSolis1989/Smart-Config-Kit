# Sub-Store 官方版本与本仓库边界

核对日期：2026-10-19；精确下载时间、原始响应与两层哈希见 [manifest.json](manifest.json)，来源见 [sources.json](sources.json)。7 项原文包括后端和前端最新 release、最近 10 条 release、固定 commit 的 README 与配置说明。

| 产品 | 稳定发布 | 发布时间 UTC | 固定源码 |
| --- | --- | --- | --- |
| Sub-Store 后端 | [2.42.6](https://github.com/sub-store-org/Sub-Store/releases/tag/2.42.6) | 2026-10-18 04:39:27 | `1f0318bc6feb46fbe204836f32ca7acab37ea67e` |
| Sub-Store Front-End | [2.34.1](https://github.com/sub-store-org/Sub-Store-Front-End/releases/tag/2.34.1) | 2026-10-15 08:27:03 | `8dc19320894a9dbb3569e8bf3e41057491e39b90` |

后端 2.42.6 的发布说明仅记版本递增，不据此创造新能力。较近发布包括 2.42.5 的 lifetime duration、2.42.4 的 `produceArtifact(..., { includeRaw: true })` 同时返回处理结果和原始内容、2.42.3 的 sing-box TLS certificate_sha256 转换，以及 Loon 的 tls-profile、server-dns、sing-box WireGuard/Tailscale 与 MASQUE 转换。前端 2.34.1 同步 lifetime duration；2.34.0 有 EasyTier 协议过滤。这些是订阅转换和界面能力，不能当成目标 APP 已支持相应协议或当前规则需要修改的证据。[后端发布记录](https://github.com/sub-store-org/Sub-Store/releases)、[前端发布记录](https://github.com/sub-store-org/Sub-Store-Front-End/releases)。

本仓库 `SubStore/` 的聚合脚本和浏览器同步扩展继续处理订阅管理；规则权威仍为 `rulesets/source/routing-graph.js`。现有流程没有必须采用 `includeRaw` 或 lifetime duration 的接口缺口，本次没有修改 SubStore 运行代码、部署服务或同步任何私人订阅。新协议转换能力仍须以目标客户端的真实内核版本和最终节点字段验收。

本次保存原文、核对版本与影响边界，没有进行新的 Sub-Store 服务升级、端到端订阅发布或协议拨号测试。
