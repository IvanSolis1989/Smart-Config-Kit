<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="AEROVE Lite 变更日志" width="100%">
</picture>

# AEROVE Lite 变更日志

[使用说明](README.md) · [内核家族入口](../README.md) · [支持队列](../../docs/support-queue.md#aerove-lite-meow)

## v6.0.21-meow.7 (2026-10-29)

- 明确候选 JS 的 DNS/hosts 由 App 托管，源参数占位固定 off；不宣称支持桌面 hosts-only 运行时。
- 更新源图及资源来源绑定，规则资产和默认路由不变。新增独立目录的可选业务投影，App 导入与实际连接验收边界保持。

## v6.0.21-meow.6 / v6.0.21-meow.4 (2026-10-28)

- Google FCM 从下载更新调整至 Google 服务；15 个域名与 26 个 IPv4 谓词、规则顺序及 55 个策略组不变。其他推送、DNS 与 fake-IP 不变。 AEROVE Lite 的 App 验收仍需独立完成。

## v6.0.20-meow.5 (2026-10-27)

- beta18 固定真实 Smart 用例拒绝旧广告分片的 500,000 原生点分标签预算；按固定 Rust reader 的实际展开重新分片，广告四片、国内站点两片，保持安全门槛。
- 全部 111 个投影 MRS 通过固定 Rust reader 和 App 原样头部/条目预算；新投影为 153 provider / 172 rules / 55 fixture groups。原生 leaf 并集核实、完整 App preflight、JNI、APK、HTTP 和 VPN 仍待验；CI 尚未运行。详见[分片依据](RESOURCE-SPLITTING.md)。
- 官方 Meow YAML v3、共享 fused 与规则源保持原字节；此为 Lite 平台专属投影。

## v6.0.20-meow.4 (2026-10-27)

- 针对 beta16 真实 MRS 单资源准入失败，将 411,634 条广告域名按 250,000 条/500,000 点分标签等保留预算无损派生为三片；完整原生往返集合与原资产一致。
- JS 在原 RULE-SET 位置连续展开同目标引用，保留 no-resolve、proxy/header 与其他 provider 元数据，其他 148 个资源复用。官方 Meow YAML 和共享 fused 字节保持。
- 增加专版资产生成/检查、固定转换器、发布批次闭合和二进制身份约束；候选资源共 151 个、主规则 170 条。实际 App 预检、完整 prepared 与 VPN/真实路由仍待 AEROVE 接取验收。
- 重新核实 beta16 生产校验链及真实 Android 单项执行结果，更新支持队列和教程；已接线项从旧待办移出，自定义 header 实传、完整资源重验及真实路由继续跟踪。

## 2026-10-24 — 准入与联调证据同步

- 核查固定 App 提交及外部候选，记录 74 项 JVM、AndroidTest 编译和 149 资产读回通过的实际范围；生产 factory、Geo 资源上下文及命名代理下载仍待整合。
- 增加 [VALIDATION](VALIDATION.md)，将当前进展与早期接口快照区分；完善 README、支持队列和独立下载按钮。未修改脚本或规则语义。

## v6.0.20-meow.3 (2026-10-24)

- 按客户端并列归档，将 AEROVE Lite JS 与使用说明、接口依据和日志放入独立目录；官方 Meow 原生 YAML 保留在其客户端目录。
- JS 入口为 `AeroveLite(meow).js`，继续使用共享 `tools/generate-meow.js`，分流实现和失败行为保持不变；两入口的共享适配清单位于内核家族目录。
- 保留接口历史快照及待验状态，AEROVE 客户端接线和 APK 联调独立推进。

## v6.0.20-meow.2 (2026-10-24)

- 分流 JS 纳入 Meow 共享生成入口，AEROVE 保留独立宿主接口与消费者说明。
- 新增官方核心及官方 Android/iOS 的原生 YAML 入口；官方 v0.26.1 实际配置校验通过，App、HTTP 下载与真实路由仍待验。

## v6.0.20-meow.1 (2026-10-24)

- 新增预适配分流 JS、生成器与输入/输出哈希清单，复用节点分类、分组和有序融合规则，不改规则权威源。
- 保留 App 的 DNS、hosts、嗅探、端口、模式、控制器与 TUN，不注入 Mihomo 全局设置或 TLS 指纹；失败抛错且保留原输入。
- 加入支持队列，状态为 `pre-adapted-awaiting-app`；App 配置准入、直接逻辑规则、Android QuickJS 及实际路由待验。
- 随共享刷新链重生成并纳入发布批次；独立 CI 验证生成漂移与本地 JS 行为，保持 App 待验状态。
