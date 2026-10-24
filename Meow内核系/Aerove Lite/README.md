# AEROVE Lite / meow-rs 分流覆写候选

为开发中的 AEROVE Lite 预备动态分组与同源分流；当前状态为**预适配完成，待 App 联调**。

[项目首页](../../README.md) · [支持队列](../../docs/support-queue.md#aerove-lite-meow) · [变更日志](CHANGELOG.md)

## 开始前

- 目标是原生 Android 13+、meow-rs 内核的 **AEROVE Lite**；标准版 AEROVE 的 Mihomo 路径应使用 Mihomo 配置。
- [AeroveLite(meow).js](AeroveLite%28meow%29.js) 是 `main(config)` 覆写脚本。由[生成器](../../tools/generate-aerove-meow.js)生成，请勿手工编辑。
- 输入需要已展开的节点列表 `proxies`。纯远程 `proxy-providers` 先通过 [Sub-Store](../../SubStore/README.md) 展平；内联 provider 可按共享节点过滤器的准入处理。
- 输入本身的 DNS、TUN 等平台设置需已兼容 Lite；脚本保留这些设置，由 App 处理宿主/VPN 与资源路径。
- DNS 不得依赖将被重建的订阅 `rule-set:`。遇到这种依赖，脚本明确报错；先在基础配置中改用独立 DNS 策略，再执行分流覆写。
- 当前 App 配置准入仍有迁移缺口，见[支持队列](../../docs/support-queue.md#aerove-lite-meow)。在这些条件完成前，仅作开发联调候选。

## 开发联调

1. 先导入有效节点订阅，确认 Lite 已获得 `proxies`。
2. 在 Lite 的覆写管理入口添加本地 JS 文件或粘贴脚本全文，并关联到该订阅；具体界面以验收 APK 为准。
3. 执行刷新，保存或导出脚本输出的最终 YAML。不要把 JS 作为 YAML 配置导入。
4. 核对最终 `proxy-groups`、`rule-providers`、`rules` 与[生成清单](adapter-manifest.json)，确认没有悬空引用。
5. 使用目标内核校验，再按[支持队列的验收条件](../../docs/support-queue.md#aerove-lite-meow)验证真实路由和资源更新。

脚本运行失败会抛出错误，原输入不被部分修改。对于未展开的远程 provider，错误会提示先展平订阅；不要以“脚本执行完成”替代有效输出。

## 分流与设置边界

脚本沿用源规则图的业务策略和顺序，使用现有融合 MRS / residual YAML；业务组使用 `select`，有节点的地区/家宽组使用 `url-test`，空地区组不创建。全局组保留兜底，最终规则仍为 `MATCH,🐟 漏网之鱼`。

脚本负责节点清洗、业务/地区组、规则提供者和主规则。DNS、hosts、嗅探、IPv6、模式、控制器、端口和 TUN 保持输入值。此边界意味着它没有提供独立 DNS 方案；对应策略由 App 的有效基础配置承担。原始订阅中的不兼容字段会继续被 App 报出，不会静默删除。

默认不承诺 Smart/LightGBM、Mihomo 专属全局参数或自动 TLS 指纹。桌面进程规则按共享源保留，Android 上是否能够命中取决于 App/内核提供的进程元数据，需实测。

## 维护

```bash
node tools/generate-aerove-meow.js
node tools/generate-aerove-meow.js --check
node --test tools/tests/aerove-meow-generation.test.js
```

规则权威源为 `rulesets/source/routing-graph.js`；生成器复用 FlClash 消费产物中的共享 JS 分流实现，移除其全局设置/Node-DNS/指纹模块，并检查 fused 源指纹和拓扑。原有正式产物的规则、DNS 与版本保持原基线。

本地测试使用 Node VM。目标 Android QuickJS、原生 meow 校验及真实路由尚未验收；不得据此宣称已正式兼容。字段依据和源码位置见 [REFERENCE](REFERENCE-meow-rs.md)。
