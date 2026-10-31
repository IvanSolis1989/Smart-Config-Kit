# MyClash 设计吸收与验证记录

实施范围为真实 JS 引擎验证、可选业务方案、统一本地配置入口与精确 hosts 兼容。默认分流基线仍为 v6.0.21；可选行为须由可信本地参数显式选择。

## 来源与复用

参考 [MyClash 固定源码](https://github.com/AIsouler/MyClash/blob/bf6c2dbc3b007b791284b437e5283854ce9c0f1a/Script/mihomoScript.js) 的服务按需生成与配置体验。没有移植其节点改名、server 改 IP、订阅 DNS 整段继承或代理链清理实现。仓库已有严格预检、规则图、融合资产、Node-DNS 与原子参数写入，本次在这些模块上扩展。真实引擎采用锁定的 MIT 依赖 quickjs-emscripten 0.32.0，来源和安装边界见 [引擎说明](../../tools/js-engine-tests/REFERENCE.md)。

## 交付与同步范围

| 能力 | 位置与适用范围 |
| --- | --- |
| 真实引擎对照 | `tools/validate-js-engines.js`；三份 Mihomo JS 的完整输出与 Node 对照，接入 CI |
| Full / Lite / Custom | 源图导出业务目录；20 个入口及依赖投影到全新目录，Full 原字节复制 |
| 统一入口 | `tools/configure.js` 与离线表单共用参数定义，沿用预览、备份、冲突检查及读回 |
| hosts-only | 三份 Mihomo JS 与两份 OpenClash Ruby；仅保留活动节点精确 FQDN 到合法 IP |
| 元信息维护 | Egern 生成器头部去重；AEROVE 的 App 托管 DNS 注释澄清；对应版本及 CHANGELOG 同步 |

没有相应 Node-DNS 运行时的静态端不注入无效模式。业务生成覆盖既有客户端、Karing 和 Meow/AEROVE 入口；保留各端能力限制，Passwall 目标仍需 LuCI 手工选择。共享 MRS/fused 资产不重新下载或刷新。

## 默认行为证据

与实施前提交 `ca555e8c53cb0f1a5ea6753c11e0d601f0f6568d` 对照：

- 原始规则图 401 providers / 860 rules、Mihomo 归一化图 525 providers / 984 rules 的完整结构相同。
- 三份 Mihomo JS 的 9 组默认完整输出一致；已有 off / policy / adaptive 捕获、应用及报告金样不变。
- 共享规则载荷指纹保持 `416754f307ca6319793458ccf65141196a3ee9a47985ff32e2168c112975235e`；Egern YAML 解析后的配置结构一致。
- 有序语义审计确认 provider 载荷与规则顺序未变，变更条目和路由均为 0。该结论来自结构相同；有限域名探针本身不证明全部域名/IP 等价。

## 验证结果

- 严格产物合同：2500 checks / 22 artifacts 通过，包含 Ruby YAML 解析。旧的非主入口 `OpenClash(mihomo).conf` 版本提示保留。
- 真实 QuickJS：默认脚本 21 个完整输出对照；业务方案另有 16 项真实引擎测试通过，含引用身份、拒绝时输入不变及 AEROVE clone 边界。
- 业务生成 19 项通过，覆盖安全规则闭包、节点链、写入失败、哈希读回及发布竞态。第二次写入、已有目录或符号链接均拒绝覆盖。
- 离线表单实际导出设置经 CLI 读回；Lite 实际生成 133 个文件并逐项核对哈希。两份 SingBox 输出分别由官方 1.14.3 和 1.13.14 核心检查通过。
- 全量本地回归 672 项中，最初 662 通过、8 跳过、2 失败；两项为旧 AI 沙盒夹具的固定标题假设，修复为唯一 H1 原位替换后，与最终参数及引擎回归合并补验 34 项全部通过。已通过且输入未变的检查复用结果。
- 8 项跳过为可选原生核心用例（7 项 Mihomo MRS、1 项 Meow App/core 组合），没有将其计为通过。AEROVE 资源生成与预算合同另已检查。
- Node-DNS JS/Ruby 对照、适配器同步、JS 覆写、进程直连白名单、业务 DNS/流量参数同步、Karing/Meow 生成、规则质量和服务依赖检查通过。
- 21 份入口文档完成桌面明暗与 390px 窄屏渲染检查；配置表单与指南另作实际视觉及交互检查。新增入口无横向溢出；历史外部附件图片未包含在本机白名单服务中。

测试、生成和批处理在 Windows 隐藏窗口及 Idle 优先级执行。详细本机日志位于忽略目录 `.cache/myclash-adoption/`；不提交测试下载及本机设置。临时预览仅监听 127.0.0.1、提供白名单静态文件，验收后已关闭。

## 验收边界

真实 QuickJS、核心配置检查和生成合同不能替代各 App 的设备导入、实际连接或性能基准。关闭业务后保留必要安全残余谓词；部分原生 AND 谓词须整体保留，清单明确标注 `preserved-safety-residual`。不宣称精简数量等于实际内存或耗电收益。

使用方法见 [本地参数与业务方案](../configuration.md)。发布后的提交、远端指针及 CI 状态由本次交付读回确认。
