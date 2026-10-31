# 全端离线配置表单验收

表单工具 v1.3.0 将现有 20 个维护入口接入客户端选择、Full/Lite/Custom 和按端参数下载。规则权威源、正式客户端版本与默认产物、共享 fused/MRS 资产均保持原样；本次发布的是离线交付工具，不新增 App 支持或真实连接验收承诺。

## 实现与复用

`offline-configuration-export.js` 消费原有入口清单、源图业务计划和附件闭包。平台纯函数提取到 `business-profile-platform-core.js`，CLI 与浏览器共用；Node 侧保留 Ruby YAML 适配。可选 YAML 采用 JSON 兼容 YAML，构建时用独立 Ruby 解析器读回验证；[YAML 1.2 规范](https://yaml.org/spec/1.2.2/)定义其与 JSON 的兼容关系。Full 默认仍直接导出发布文本的 LF 形式。

`offline-client-options.js` 从既有运行时与原生适配编译参数槽或有限预设，不执行配置。三份桌面 JS 保持五项；AEROVE 保持 App 托管 DNS/off；OpenClash 沿用四项既有默认值和环境优先。原生端仅提供已有字段映射，Egern 和 QX 的限制在页面中说明，不生成无效开关。

浏览器只解压可信快照、组装文本和下载。单文件保留原生扩展名并带业务方案名；多文件 ZIP 保留 Passwall 手工列表、AEROVE 原字节分片/预算及适用来源清单。被改动配置不携带声称原始配置哈希仍有效的默认 adapter 清单。OpenClash 完整脚本使用固定自定义文件入口，保留原教程中的备份、文件权限与核心核对要求。

ZIP 复用 [fflate 0.8.3](https://github.com/101arrowz/fflate)，官方 npm 包已核对 SHA-512 SRI；来源、版本和许可证位于 `tools/vendor/fflate/`，完整 MIT 许可同时内嵌 HTML。仅调用同步压缩/解压与 ZIP API，无运行期 CDN、worker、网络或用户脚本执行。

## 验证证据

- 在重构前冻结 `5f57c598e34226da50d7cf835b99ec52f3e27426` 平台实现的 80 份输出：20 入口 × Full、Lite、Custom（AI/YouTube）、Custom 空集。新工具全部对照通过；20 份 Full 为精确 LF 文本，其他方案按原生结构或精确投影对照，OpenClash 另核对 YAML 外的 shell。
- 参数回归 8/8 通过，包含非法类型/未知字段/getter、AEROVE DNS 锁定、OpenClash ENV 优先和小数、Node-DNS 能力缺失、每条 QUIC 守卫唯一性、可信源漂移拒绝。WeakMap 绑定已有原文引用，不重复嵌入大配置。
- 导出核心基础 6 项、方案文件名及六种代表格式的混合参数定向检查通过。共享业务与真实 QuickJS 运行时回归 35/35 通过、无跳过，涵盖原位身份、独立候选、代理链、安全拒绝、原子发布与并发保护。
- 严格产物合同 2500 checks / 22 artifacts、三份 JS 覆写、PROCESS-NAME、Karing 和 README 视觉资产检查通过。既有非主入口 OpenClash `.conf` 基线提示不变，主 `.sh` 仍为权威。
- 实际生成的 sing-box 1.14 Custom 与 1.13 Lite，均结合省电测速和 follow-rules，并通过对应官方核心 `check`。
- 六份改动入口文档完成桌面亮色、桌面暗色、390px 共 18 个实际渲染视图；无页面整体横向溢出，110 个本地链接存在。既有远程附件没有加入本机预览白名单。测试和生成均使用隐藏窗口、Idle 优先级。
- 表单 UI 7 项回归覆盖 20×4 下载、实际 ZIP 解包、分端参数状态、坏数值与恢复、路径及许可证；最终后端冻结后再次生成并通过 `--check`、页面默认文件名及跨端状态定向检查。HTML 为 16,797,827 字节，解压可信 bundle 为 47,914,901 字节。
- 真实浏览器读回 12 份下载、73 个文件，含 JS/YAML/JSON/conf/shell、Passwall/Karing/AEROVE ZIP；每份内容及二进制附件逐字节匹配生成器。三个实际下载的 FlClash Full/Lite/Custom 各完成 7 个 Node/QuickJS 场景，共 21 组完整对照。手机布局实际下载成功；选择、切页和生成下载期间网络请求事件为 0。
- 表单完成桌面亮色、桌面暗色和 390px 自选业务全页面检查，无整体横向溢出；原生 badInput 实际拒绝，修正输入后成功下载。交付页重新打开，所有客户端参数均从默认状态开始，未保留测试中的非默认选择。

本机详细证据位于忽略目录 `.cache/offline-all-clients/`、`.cache/offline-configuration-20261029/` 及参数/UI 的定向测试日志；不提交下载样本或用户配置。

## 兼容性核对与边界

当前读取核对了 [Mihomo interval/lazy](https://wiki.metacubex.one/config/proxy-groups/)、[Stash 组字段](https://stash.wiki/en/proxy-protocols/proxy-groups)、[Surge block-quic](https://manual.nssurge.com/profile/general.html)、[Loon UDP 端口](https://nsloon.app/docs/General/)、[QX 官方样例](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)、[sing-box urltest](https://sing-box.sagernet.org/configuration/outbound/urltest/)、[Egern 原生组](https://egernapp.com/docs/configuration/policy_groups/)、[Karing 自定义分流](https://karing.app/en/tutorial/custom-diversion)和[Meow 原生 YAML](https://meow-rs.github.io/meow-rs/guide/guide/configuration)。未发现影响本次既有字段映射的能力变化。Shadowrocket 官方帮助站本次仍不可读取，沿用已维护的受限映射，不宣称新增官方兼容性证据。

SR/Surge 的 all-proxy、Loon 的全部 UDP/443、QX 后台检测和 sing-box 的间隔均在界面按实际行为解释；不称为各端等价性能优化。Egern QUIC 需要原生资产重建，本次不提供独立切换。Karing 仅规则，Xray 仅三出站路由，Passwall 仍要求对应后端和 LuCI 目标，Meow/AEROVE 的 App 验收继续单列。

离线指配置生成阶段；导入后远程规则与节点资源仍按配置下载。最终 main 指针、工作区及 CI 由发布后读回确认。
