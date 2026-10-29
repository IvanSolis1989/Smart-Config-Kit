# FlClash 离线直接下载验证记录

离线配置表单 v1.1.0 支持 Full / Lite / Custom 直接下载 JS；正式脚本仍为 `v6.0.21-flclash.25`。本次不修改默认规则、节点/DNS 运行时、共享资源或其他客户端入口。

## 实现边界

- 构建阶段从源图目录、现有安全闭包与正式 FlClash 源生成可信 bundle。CLI 和浏览器复用 `business-profile-script.js` 中的同一个脚本 emitter，未引入新依赖。
- 浏览器只校验业务选择并组装文本；不执行嵌入的 main、不读用户脚本、不联网、不使用 eval/Function。JSON 嵌入转义 `<`、U+2028 和 U+2029，标签说明通过 textContent 填充。
- Full 下载为发布 Git 源的标准 LF 文本；不是 Windows CRLF 检出文件的原字节。原 CLI Full 的原字节复制合同保留。Lite/Custom 与 CLI 同方案输出在统一 LF 后逐字一致。
- 直接下载只使用业务选择，本地参数保持发布默认。「本地 JS 参数」和其他客户端的 JSON + CLI 路径保留。

## 验证结果

- 专项及相关回归 44/44 通过、无跳过：浏览器导出 6、表单事件 3、全端业务投影 19、真实业务 QuickJS 16。摘要显示随后调整，并重新运行表单 3/3 与生成器 `--check`。
- 30 种 Full/Lite/Custom 选择与 CLI 输出一致，包含所有 24 个单业务、自定义空/混合/全选；非法、重复、非字符串及稀疏数组拒绝。
- 共享 emitter 提取前后，Smart / Normal / FlClash / AEROVE 各 3 个方案，共 12 个输出比较一致（统一 LF）。默认客户端与 `rulesets/` 在 Git 中无修改。
- 实际浏览器分别下载 Full、Lite、Custom（AI + YouTube），读回文件名和完整内容后与生成器一致。每份实际下载文件的 7 个场景通过 Node/真实 QuickJS 完整输出、引用身份和拒绝不变对照，共 21 组。
- 浏览器下载动作期间 CDP `Network.requestWillBeSent` 为 0 条事件；页面源码检查无外部资源和网络/动态执行入口。离线约束限表单生成，客户端导入后的远程规则下载仍需网络。
- 严格产物合同 2500 checks / 22 artifacts、JS 覆写、进程直连白名单、Karing 及 README 视觉资产同步检查通过。旧非主入口 `OpenClash(mihomo).conf` 的版本提示保持。
- 表单桌面明暗、390px 窄屏、Custom 勾选及下载区域检查通过；5 份使用说明共 15 个明暗/窄屏渲染检查，无页面横向溢出，103 条本地链接有效。既有远程附件图片未包含在本机静态预览白名单内。
- 独立只读复核无阻断。测试及生成使用 Windows 隐藏窗口、Idle 优先级。

本机详细日志与读回哈希位于忽略目录 `.cache/flclash-direct-download/`、`.cache/myclash-adoption/direct-download-qa-*`；不提交本机下载文件。设备导入和真实业务连接需在 FlClash 关联订阅后验收，不把生成或 QuickJS 成功等同于真机恢复。

使用方法见[配置指南](../configuration.md)；最终 main 指针及 CI 状态以本次发布后的读回为准。
