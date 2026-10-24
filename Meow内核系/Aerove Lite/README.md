<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-aerove-lite-mobile.svg">
  <img src="../../docs/assets/readme/page-aerove-lite.svg" alt="AEROVE Lite 导入指南" width="100%">
</picture>

# AEROVE Lite 导入指南

为 AEROVE Lite 的 `main(config)` 脚本宿主提供 Meow 分流 JS；当前用于开发联调，生产准入、代理下载及 APK 真实路由仍待完成。

[内核家族入口](../README.md) · [下载脚本](AeroveLite%28meow%29.js) · [联调核查](VALIDATION.md) · [接口依据](REFERENCE-AEROVE-Lite.md) · [变更日志](CHANGELOG.md) · [支持队列](../../docs/support-queue.md#aerove-lite-meow)

## 开始前

本仓库不提供节点或订阅。先在 Lite 导入节点订阅，确认配置包含已展开的 `proxies`。纯远程 `proxy-providers` 须先经 [Sub-Store](../../SubStore/README.md) 展平；脚本不能代替宿主下载订阅。

输入的 DNS、hosts、嗅探、IPv6、端口、模式、控制器和 TUN 应已兼容 Lite。JS 保留这些字段，仅维护节点清洗、地区/家宽与业务组、rule-providers 和 rules，不注入 Smart/LightGBM、Mihomo 全局参数或 TLS 指纹。

标准版 AEROVE 使用 Mihomo；本页对应 AEROVE Lite 的 Meow 接入。官方 meow-rs 核心及官方 Android/iOS 的原生配置入口见[官方 Meow](../Meow/README.md)。

## 导入与关联

1. 下载 [AeroveLite(meow).js](AeroveLite%28meow%29.js)。
2. 在 Lite 的覆写管理中添加脚本，关联需要处理的节点订阅并刷新。具体界面以验收 APK 为准。
3. 确认宿主通过 `OverridePipeline` 将 YAML 转为 JSON，调用 `main(config)` 后再转回 YAML。该接口使用 QuickJS；[接口快照](REFERENCE-AEROVE-Lite.md)记录已核对的源码位置。
4. 通过宿主配置准入、资源准备与运行装配，读回最终 YAML，核对节点、业务组、有序规则和 MRS/residual 资源引用。
5. 等待资源更新与健康检查，再验收 Android VPN、广告拦截、直连、国外网站和各业务出口。

JS 只创建实际有节点的地区组，因此地区与业务组总数可能少于 55。输入为空、节点未展开或配置不兼容时应先处理明确报错，再刷新覆写。

## 失败行为与待验项目

脚本在副本上处理配置，失败抛错，原输入保持不变。若 DNS 引用将被重建的订阅 rule-set，脚本会明确拒绝；先改用独立 DNS 策略，再应用覆写。

校验器候选的 74 项 JVM 测试、AndroidTest 编译和 149 个规则资产读回已经通过。它们尚未证明生产入口完成接线，也未执行此候选的 Android QuickJS/JNI 或真实连接，证据范围见[联调核查](VALIDATION.md)。

实际剩余条件是：生产导入/资源准备/启动接入 Meow 准入；完整校验获得可信的 Geo 资源目录；接通 provider 的命名代理与 header 下载；统一资源和备份容量以容纳 149 个规则源；在目标 APK 执行当前脚本并读回最终 YAML，完成资源更新、VPN 和真实路由。对应状态见[支持队列](../../docs/support-queue.md#aerove-lite-meow)。

共享 JS 的本地行为检查与官方核心原生 YAML 校验各有独立证据，均不能替代 Lite 的最终配置和实际连接验收。官方核心验证范围见[官方依据](../Meow/REFERENCE-meow-rs.md)。

## 维护与生成

唯一规则权威源为 `rulesets/source/routing-graph.js`。JS 复用维护中的共享分流实现，由仓库根目录的生成器统一输出；不手工编辑生成脚本。

```bash
node tools/generate-meow.js
node tools/generate-meow.js --check
```

生成工具需要 Node.js ≥ 18 和 Ruby ≥ 3.0，客户端运行无需 Ruby。共享[适配清单](../adapter-manifest.json)记录官方 Meow YAML 与 AEROVE Lite JS 两个入口、输入哈希和待验状态。客户端接线在 AEROVE 仓库独立维护。
