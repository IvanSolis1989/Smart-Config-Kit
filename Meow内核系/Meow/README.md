# Meow / meow-rs 分流适配

为官方 meow-rs 核心、官方 Android/iOS 客户端和提供 JS 宿主的兼容客户端生成同源分流。

[项目首页](../../README.md) · [下载目录](../../docs/guide/downloads.md#meow) · [支持队列](../../docs/support-queue.md#meow) · [变更日志](CHANGELOG.md)

## 选择入口

| 使用环境 | 文件与前提 |
| --- | --- |
| 官方 meow-rs 核心、WebUI | [Meow(meow).yaml](Meow%28meow%29.yaml)，原生 YAML；先替换节点订阅 URL。 |
| 官方 meow-android / meow-ios | 同一份原生 YAML，经本地配置或 URL 导入；App 装配后的最终配置与实际连接待分别验收。 |
| 提供 main(config) 的 JS 宿主 | [Meow(meow).js](Meow%28meow%29.js)，输入须有已展开的节点；不假定官方 App 能执行 JS。 |
| AEROVE Lite | 消费通用 JS；专属接线与待验项目见 [AEROVE Lite 说明](clients/aerove-lite.md)。 |

本仓库不提供节点或订阅。官方核心 v0.26.1 已通过实际配置校验；各 App 的完整导入、宿主改写及真实流量仍在[支持队列](../../docs/support-queue.md#meow)中。

## 官方核心与官方 App：原生 YAML

1. 下载 YAML，将 `proxy-providers.Subscribe.url` 的 `https://example.invalid/replace-with-your-subscription-url` 替换为自己的 Clash 格式节点订阅。占位 URL 故意不可用，原文件不能直接启动。
2. 官方核心保存为 config.yaml，执行 `meow -f config.yaml -t`；订阅、规则与 Geo 数据准备成功后再启动核心。
3. 官方 Android/iOS 使用本地 YAML 或配置 URL 导入入口。URL 模式须托管已经替换订阅地址的私有配置，避免公开个人订阅；不能把本仓库占位模板 URL 当成可运行的个人配置。
4. 等待订阅、MRS / residual YAML 和首轮地区健康检查完成，选择有可用节点的地区/业务出口，再启动 VPN 或本机代理。
5. 读回最终配置与连接日志，核对组、规则、下载、DNS 和出口。iOS 替换源 DNS；Android 也管理 DNS、监听与 VPN，不能假定 App 原样保留核心 YAML 的所有平台设置。

原生模板保留 33 业务组和 22 个地区/家宽组。地区通过 `use: [Subscribe]` 与 Rust regex 筛选 provider 成员，保留静态 REJECT 哨兵。空池、全故障或首轮健康检查前可能拒绝连接，不会自动切成直连。原生“其他”组沿用 CMFA 的广域备选口径，与 JS 的“未分类节点”口径不同。

原生模板只监听 127.0.0.1，不启用 TUN 或外部控制器。DNS 投影到原生字段，省略固定核心未声明的 Mihomo 扩展。规则顺序、下载代理、no-resolve、MRS 与逻辑规则保持同源。

## 提供 JS 宿主的客户端

先准备 `proxies` 已展开的订阅，将通用 JS 添加为覆写并关联。入口为 main(config)，JSON 对象入出，无网络、文件系统或定时器依赖。官方 App 本轮只核实 YAML 接口，未发现同样的 JS 接口。

JS 维护节点清洗、地区/家宽和业务组、rule-providers 与 rules。DNS、hosts、嗅探、IPv6、模式、控制器、端口和 TUN 保留输入；不注入 Smart/LightGBM、Mihomo 全局参数或 TLS 指纹。不兼容输入由目标宿主明确报错。

纯远程 proxy-providers 先经 [Sub-Store](../../SubStore/README.md) 展平。DNS 若含将被重建的订阅 rule-set 依赖，脚本明确拒绝，需先改用独立 DNS 策略。失败保持原输入不变。JS 只创建实际有节点的地区组，数量可能少于 55。

## 验证与版本

官方 v0.26.1 发布二进制在核对归档 SHA-256 后实际运行 -t，149 个本地真实规则资产、168 条规则、55 个组和实际 Geo 数据均通过，无警告或错误。节点是合成样例，没有启动代理流量；此检查不证明生产 HTTP 下载出站或真实出口。

官方 Android 稳定 v1.0.8 固定核心 v0.20.2；iOS 稳定 v2.0.0 固定核心 a663364469b3b7dc2b46d2e0f4530e50a54108ee。旧核心的 MRS、provider.proxy、逻辑规则及 geodata 已有源码支持证据，但完整模板在这些 App 上仍待验。不能用当前核心版本代替 App 版本。字段和来源见 [REFERENCE](REFERENCE-meow-rs.md)。

## 维护

生成需要 Node.js ≥ 18 和 Ruby ≥ 3.0（真实 YAML 解析/序列化）；客户端运行不需要 Ruby。

```bash
node tools/generate-meow.js
node tools/generate-meow.js --check
node --test tools/tests/meow-generation.test.js tools/tests/meow-native-profile.test.js
```

设置 MEOW_BIN、MEOW_GEOSITE_FILE、MEOW_MMDB_FILE 后，最后一条命令执行真实核心 -t；未设置时明确跳过。独立 CI 固定下载官方核心并验 SHA 后执行。

规则权威源为 rulesets/source/routing-graph.js。生成器复用 FlClash 的共享 JS 分流实现，原生组/字段从 CMFA 投影，rules/providers 使用经源指纹校验的 fused 结果。[生成清单](adapter-manifest.json)记录两种产物与输入哈希；App 验收状态独立维护。
