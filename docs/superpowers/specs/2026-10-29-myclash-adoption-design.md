# MyClash 可取能力的受控吸收

用户已授权实施、全端同步验证并推送 main。默认分流行为与现有安全边界必须保持。

- 第一阶段增加锁定依赖的真实 QuickJS 验证，复用 Node VM 对照，比较完整配置语义；不以通过 Node 代替真实 JS 引擎，也不把 WASM QuickJS 当作 App 真机。
- 第二阶段新增 full/lite/custom 业务投影。选择来自可信本地参数，源规则图为唯一事实源；只向新输出目录生成，不覆盖默认入口及共享 fused。full 复制原字节；可选精简保留基础组、安全前置、DNS、节点链及默认回落，裁剪未再引用的 provider，并记录平台差异与文件哈希。
- 第三阶段在现有本地参数解析、预览、备份及读回机制上建立统一 CLI 和离线表单。表单只保存配置选择，CLI 显式应用；不在浏览器执行上传脚本，不启动网络服务，不从订阅接收本地参数。
- 第四阶段新增显式 hosts-only Node-DNS profile。默认仍为 adaptive；只允许活动节点精确 FQDN 到合法 IP 的映射，保留全部有效多 IP。不修改 server/SNI/Host，不接受通配、别名链、普通 nameserver/fallback，不覆盖仓库 hosts。JS/Ruby 同源验证和同步。

不引入上游规则刷新、整段订阅 DNS 继承、节点自动重命名、静默解除 dialer-proxy 或倍率正则替换。已有相关研究固定于 MyClash bf6c2dbc3b007b791284b437e5283854ce9c0f1a；新增验证依赖优先使用 quickjs-emscripten 官方实现，其余复用仓库编译和写入模块。

验收包括默认配置语义前后对照、所有产品 full/lite/custom 投影与引用完整性、JS/Ruby 新旧 profile、真实 QuickJS、现有 JS/格式/生成合同、必要内核 schema 检查、文档实际渲染，以及 main/远端/CI 读回。平台不具备运行时 Node-DNS 的入口明确不适用，不添加无效字段。
