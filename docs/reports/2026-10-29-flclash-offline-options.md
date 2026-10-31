# FlClash 离线业务与本地参数合并验收

表单 v1.2.1 可把 Full / Lite / Custom 与现有五项本地参数合并为一份 FlClash JS，完整操作不需要 CLI。正式默认脚本仍为 `v6.0.21-flclash.25`，规则、共享资产和其他客户端默认产物保持。

## 实现范围

`flclash-browser-local-options.js` 从共享 schema 派生参数。构建期复用现有 CLI 解析器，仅编译不执行可信源码，确认五个顶层 const、默认值及四档 Node-DNS 能力，再提取精确字面量槽。浏览器只在可信槽中填入合法枚举、布尔、null 或有限正数，不解析或运行用户脚本，不联网。

两页共用业务及参数状态，在任一页点击主按钮均下载合并 JS；高级 JSON 按当前标签导出独立 schema。页面说明没有把 JSON 当成两页合并存档。

本次是既有本地选择的离线交付扩展，不增加任意订阅 DNS 权限、不改 server/SNI/Host、不解除代理链，也不修改原 CLI 的备份、原子替换或并发保护。节点链、DNS 快照、倍率依赖与引用身份仍由原运行时验证。

## 证据

- 综合相关回归 28/28 通过，无跳过；随后补充紧邻行内注释的 const 槽位回归，最新模块 11/11 通过。未变化的检查复用已有结果，生成器最终 `--check` 通过。
- 浏览器实际补验发现数值输入 `e` 会产生 `value=""` 与原生 `badInput=true`，旧表单误当作 null。增加先失败回归并修正为拒绝无效输入，最终表单 5/5 通过；v1.2.1 实际浏览器确认 JS 与本地 JSON 均提示错误，改为 2.5 后成功下载且源码与生成器一致。真正留空仍为 null。
- 所有既有参数枚举及代表性业务组合与 CLI 的参数写入、业务投影结果逐字一致；拒绝非法类型、未知键、非有限/非正倍率、getter、原型控制、重复及稀疏业务数组，getter 执行计数为 0。
- 对照上版 `32dc4001d882ecbda7a9a51b10899418bb1d72f8`：四个业务方案分别测试未传、空对象及显式全部默认参数，共 12 份下载源文相同；默认客户端与 `rulesets/` 在 Git 中无改动。
- 实际浏览器先从本地页设置五项参数，再切 Lite 下载；又选择 Custom（AI + YouTube），回本地页调整倍率并下载。文件中的五项值与界面、CLI 及共享生成器相同。
- 三份实际下载文件（默认 Full、Lite 非默认组合、Custom 非默认组合）各跑 7 个 Node/真实 QuickJS 场景，共 21 组完整输出及引用身份对照通过，含断链/循环/不支持 provider 的拒绝边界。
- 专项真实 QuickJS 另确认省电档 900 秒、QUIC follow-rules、hosts-only 精确活动节点 hosts、倍率依赖拒绝与 ZeroTier 规则；默认 Full 仍为原发布 LF 文本。
- 实际选择、切页及下载期间 CDP 网络请求事件为 0；表单源码及 renderer 不含联网或动态代码执行入口。离线只指表单生成，客户端规则资产仍需按配置下载。
- 严格产物合同 2500 checks / 22 artifacts、JS 覆写、PROCESS-NAME 白名单、Karing 与 README 视觉资产同步检查通过。旧的非主入口 OpenClash conf 版本提示保持。
- 表单桌面明暗和 390px 窄屏摘要/下载区域检查通过；四份入口文档完成 12 个明暗/窄屏渲染检查，无页面横向溢出。覆盖矩阵改为窄屏可读的两列表格。既有远程附件未加入本机预览白名单。
- 独立只读复核无阻断；批量测试与生成使用 Windows 隐藏窗口、Idle 优先级。

详细本机记录位于忽略目录 `.cache/flclash-offline-options/`、`.cache/flclash-local-browser-20261029/` 与 `.cache/myclash-adoption/offline-options-qa-*`；不提交本机下载或用户配置。

## 跨 App 范围

业务 Full/Lite/Custom 已覆盖 20 个维护入口，其他平台可用 CLI 生成对应配置；hosts-only 只覆盖具备相应运行时的三份 Mihomo JS 和两份 OpenClash。真实 QuickJS 属于 JS 正确性检查；离线合并参数直接下载目前为 FlClash 入口。各平台能力差异、Meow/AEROVE 设备验收与性能基准边界见[统一指南](../configuration.md)，不宣称所有 App 都获得相同功能或性能收益。

发布后的 main 指针、工作区和 CI 状态由本次交付读回确认。
