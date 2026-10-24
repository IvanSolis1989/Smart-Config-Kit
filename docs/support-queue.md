# 客户端支持队列

这里记录尚未进入正式支持清单的适配工作。候选脚本通过本地检查后，还需目标内核及 App 验收。

[文档中心](README.md) · [正式客户端与导入边界](guide/client-support.md)

| 客户端 | 内核 | 当前阶段 |
| --- | --- | --- |
| [AEROVE Lite](#aerove-lite-meow) | meow-rs | 分流覆写候选已生成；等待 App 配置准入迁移与 Android 联调 |

## <a id="aerove-lite-meow"></a>AEROVE Lite / meow-rs

核对日期：2026-10-24。目标为原生 Android 13+ 的 AEROVE Lite；AEROVE 标准版仍使用 Mihomo，应继续使用对应 Mihomo 入口。

候选文件：[AeroveLite(meow).js](../Meow内核系/Aerove%20Lite/AeroveLite%28meow%29.js)。[使用前提与操作](../Meow内核系/Aerove%20Lite/README.md)及[固定源码依据](../Meow内核系/Aerove%20Lite/REFERENCE-meow-rs.md)随适配维护。此入口尚未计入正式客户端数量，也未声称当前 APK 可直接导入。

已完成：

- 复用现有节点清洗、地区和家宽识别、空区域处理、33 业务组及融合规则；完整样例最多生成 22 个区域组。
- 输出 `main(config)` JS 脚本，使用 JSON 对象入出；不依赖网络、文件系统或定时器。
- 分流脚本保留输入 DNS、hosts、TUN、端口、嗅探、模式与控制器配置；不会注入 Mihomo 全局设置、Smart/LightGBM 或 TLS 指纹。
- 保留原始规则顺序、`no-resolve`、provider 下载代理和 MRS / residual YAML；记录输入、脚本及生成器哈希。
- 本地 Node VM 回归覆盖共享规则/分组一致性、App 字段保留、失败原子性、未展开 provider 拒绝及生成物漂移。
- 保留的 DNS 若含订阅 `rule-set:` 依赖则明确拒绝，防止重建 provider 后留下悬空引用。

正式支持的剩余条件：

1. App 的导入、资源准备及运行路径统一使用 Meow 配置准入。核对快照中的生产入口仍使用旧 `CompatibilityValidator`，会拒绝新内核支持的 `rule-providers.proxy` 等字段。
2. App 校验器与原生内核对直接 `AND` / `OR` / `NOT` 规则达成一致；本仓库候选保留这些规则，避免丢失 QUIC 等行为。
3. 使用目标 APK 的真实 QuickJS 执行此脚本，读回最终 YAML，确认所有规则/provider/组引用及资源下载完整；保留输入 DNS 的前提是其本身已兼容目标 App。
4. 由目标 meow-rs 内核验证生成配置，并完成 Android VPN、MRS 更新、广告拦截、国内直连、国外分流与业务出口的真实连接验收。

核对时本机没有可用 meow CLI；Node VM 的结果只证明脚本行为。App、原生内核、Android QuickJS 与实际连接仍为待验。

候选维护命令：

```bash
node tools/generate-aerove-meow.js
node tools/generate-aerove-meow.js --check
node --test tools/tests/aerove-meow-generation.test.js
```

共享分流运行时或源规则生成链更新后，重新生成候选并运行以上检查；候选状态持续保留为 `pre-adapted-awaiting-app`，正式接入须根据上述验收另行更新。

候选生成物已进入上游刷新链及发布批次哈希清单，并有独立 Node CI 检查。自动同步会随规则刷新候选，但不会自动把 App/内核验收状态改为通过。
