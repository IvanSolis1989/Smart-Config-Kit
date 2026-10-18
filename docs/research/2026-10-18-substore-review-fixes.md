# Sub-Store v1.3.2 Review 修复验证

日期：2026-10-18。范围：PR #189 在 `8d38381` 上的四项 Codex Review。

| 意见 | 根因及修复 | 回归触发条件 |
|---|---|---|
| [账户查询身份](https://github.com/IvanSolis1989/Smart-Config-Kit/pull/189#discussion_r4305908395) | 表单解码合并了字面加号与编码空格。改为保留加号、等号存在性和重复顺序的 raw query 解析。 | `+` 与 `%20` 两账户保持歧义；`%2B` 与加号保持同一字面值；格式参数仍可归一。 |
| [回环占位节点](https://github.com/IvanSolis1989/Smart-Config-Kit/pull/189#discussion_r4305908397) | 文本正则漏掉展开及映射 IP。使用浏览器 URL 主机规范化后检查回环、零地址和 localhost。 | 展开 IPv6、IPv4 映射 IPv6、尾点 localhost 均不计为有效节点；公网及 LAN 节点保留。 |
| [后到歧义](https://github.com/IvanSolis1989/Smart-Config-Kit/pull/189#discussion_r4305908399) | 歧义排在整个同步队列之后。授权消息独立推进候选版本，在预览、备份及实际传输发送前检查是否仍为当前候选。 | 暂停目录、预览、备份或传输准备，加入歧义后继续；旧任务不得 PATCH 或回灌陈旧 pending/成功结果。 |
| [相对订阅锚点](https://github.com/IvanSolis1989/Smart-Config-Kit/pull/189#discussion_r4305908400) | 原始 href 没有基准地址。按 `document.baseURI` 解析，再做既有订阅语义及地址验证。 | 根相对、目录相对、协议相对及 base 标签；危险协议、凭据、无有效基准地址仍拒绝。 |

## 确定性验证

最终冻结源码通过 192 项 Node 测试及 19 项真实 Edge 独立浏览器流程；JS 覆写、PROCESS-NAME 及 2483 项跨客户端产物检查通过。构建入口与单一源码一致。

Node 回归先复现旧实现失败，再验证修复。真实 Edge 浏览器新增相对锚点、加号/空格歧义、映射/展开回环和后到歧义四个自动流程。

独立复核还复现了同 URL 恢复被未完成 pending 去重吞掉的情况：A 的预览暂停，依次收到歧义和最新有效 A，再释放旧预览。去重限定为同文档、同代且有完成时间的候选，过期任务留下的 pending 不再阻止自动恢复。

同一个独立复现入口在修复后确认恰好一次 PATCH、源已更新、最终状态 updated、最新 pending 有完成时间。

并发浏览器流程先挂起假后端预览，在页面新增第二条链接，确认后台已收到歧义，再释放预览。随后等待后台已接收的授权与串行任务全部结束，最后检查完整请求记录及存储值，要求零 PATCH。测试使用私有扩展副本中的只读完成探针；生产扩展没有新增全局探针或 runtime 消息接口。

负控仅在独立临时扩展副本换回 `8d38381` 的旧后台，保留同等完成屏障：前 18 项通过，最后一项明确失败为 `late_ambiguity_wrote_subscription`。这证明测试不会在歧义状态提前显示后关闭浏览器、截断迟到写入并误报成功。

实际浏览器还暴露 `tabs.onUpdated` 的 loading 事件可能晚于新文档初始化。它没有可绑定的 documentId，因此不再据此淘汰当前文档；文档替换使用已授权的新 documentId，关闭使用 onRemoved。

## 范围

本轮浏览器测试使用独立无账号 Edge profile 和虚构面板/假 Sub-Store，阻断外网。六家真实账号的前轮验收仍见[原记录](./2026-10-18-substore-auto-sync-acceptance.md)，不冒称这些账号已重新加载 v1.3.2。Chrome 账号环境仍未实测。

SubStore 辅助工具以外只更新相关日志；未改规则源、DNS、策略组或客户端分流配置。
