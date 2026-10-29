<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-docs-mobile.svg">
  <img src="assets/readme/page-docs.svg" alt="Smart-Config-Kit 配置入口" width="100%">
</picture>

# 本地参数与业务方案

默认下载仍提供完整业务分流。按需修改设备本地参数，或把可选业务方案生成到一个全新的目录；两条路径独立选择。

[项目首页](../README.md) · [文档中心](README.md) · [下载目录](guide/downloads.md) · [导入后验收](guide/dns-and-verification.md#verification)

## 先选一条路径

| 需求 | 使用入口 | 影响范围 |
| --- | --- | --- |
| 调整设备参数 | 本地 JS | 指定脚本 |
| 精简专属业务 | 全端方案 | 全新目录 |
| 用表单选择 | [离线表单](configuration.html) | 仅导出设置 |

本地 JS 保存前可预览，保存时备份并读回。业务方案独立输出，正式下载与共享规则资产不变；表单下载的设置仍须通过 CLI 显式应用。

表单从同一参数定义和源图业务目录生成，无需联网，不读取或执行本地脚本。GitHub 文件页面显示 HTML 源码；下载仓库后在本机打开该文件使用。

## 修改本地 JS

在仓库根目录先预览，再去掉 `--dry-run` 保存：

```powershell
node tools/configure.js --target 'D:\Configs\local.js' --health-check power-save --quic follow-rules --max-multiplier 2 --dry-run
node tools/configure.js --target 'D:\Configs\local.js' --health-check power-save --quic follow-rules --max-multiplier 2
```

也可导入表单下载的设置：

```powershell
node tools/configure.js --settings 'D:\Configs\settings.json' --target 'D:\Configs\local.js' --dry-run
```

| 参数 | 取值 | 默认与边界 |
| --- | --- | --- |
| `--health-check` | `standard` / `power-save` | 默认标准；省电档改变测速时机，不等于业务精简 |
| `--quic` | `block-foreign` / `follow-rules` | 默认保留现有海外 QUIC 策略及服务例外 |
| `--max-multiplier` | 正数 / `off` | 默认关闭；未知或矛盾倍率不据此删除 |
| `--dns-profile` | `off` / `policy` / `adaptive` / `hosts-only` | 默认 `adaptive`；仅可信本地设置有效 |
| `--zerotier` | `on` / `off` | 默认关闭；设备本地选择 |

保存使用原有原子替换、并发检查、原件备份和读回机制。目标脚本仅作语法及可信常量解析，不执行目标代码。

更新源码时可显式提供 `--source`。已有 ZeroTier、节点 DNS profile 和倍率上限自动保留；`--preserve-local` 同时保留测速及 QUIC，显式参数优先：

```powershell
node tools/configure.js --target 'D:\Configs\local.js' --source 'D:\Configs\new.js' --preserve-local --dry-run
```

若新源码不具备已选的节点 DNS 模式，更新会在保存前拒绝；不会把 `hosts-only` 静默降为 `adaptive`。AEROVE 的 App 托管 DNS 占位保持 `off`。

这些选项只适用于含对应能力的本仓库 JS；静态端的 DNS 与系统网络设置仍按客户端教程配置。原 `configure-traffic-options.js` 入口继续可用。

## 生成可选业务方案

业务生成使用 Node.js、Ruby ≥ 3.0 进行结构化 YAML 处理；原子目录发布支持 Windows，或具备 GNU `mv` 的 Linux。其他构建主机会明确拒绝发布，不降级覆盖已有目录。

```powershell
# 查看目录、业务选择和各端影响；不创建输出目录
node tools/configure.js --profile lite --output-dir 'D:\Configs\scki-lite' --dry-run

# 输出目录必须尚不存在，父目录需已存在
node tools/configure.js --profile lite --output-dir 'D:\Configs\scki-lite'

# 自选保留 AI 和 YouTube 的专属业务规则
node tools/configure.js --profile custom --enable ai,youtube --output-dir 'D:\Configs\scki-custom'

# 列出源图定义的服务标识
node tools/generate-business-profile.js --list
```

`full` 复制当前正式入口及其本地依赖的原字节；`lite` 保留预设的 AI、即时通讯、会议协作与 YouTube；`custom` 显式选择可选服务。广告、国内/国外网站、受限网站、最终回落、下载、BT/PT、金融支付和加密货币为受保护基础组。

关闭业务会移除该业务的专属组和可裁剪规则，流量继续匹配后续基础规则。逻辑、进程和 QUIC 安全前置保留；必要目标映射为仍存在的国内/国外基础组，并写入清单。DNS、fake-IP 和保留逻辑规则仍引用的 provider 不会被删。节点、拨号链和各客户端 DNS 保持原有实现。

`business-profile-manifest.json` 记录选择、源图及入口哈希、文件哈希、删除项、依赖闭包和平台差异。产物引用现有已发布 fused 资产，不刷新上游，也不另建一套规则事实源。

Xray、Passwall、Karing 等入口没有完整嵌套策略组，其裁剪按原生分段和规则语义投影；客户端托管的节点、DNS、默认动作仍由 App 配置。Meow/AEROVE 的既有 App 验收边界继续适用，生成成功不能代替设备验收。

无法独立拆出原生二进制规则集内安全谓词的平台，会保守保留该残余资产并回落基础组，清单标记 `preserved-safety-residual`；其中共存的域名仍在原位置匹配。这样保留安全规则，但不承诺这些平台能与结构化端逐条采用同样的精简方式。

## 精确节点 hosts 兼容

只有订阅以精确 hosts 提供节点 IP，且你信任这些记录时，才在支持的本地入口显式选择 `hosts-only`：

```powershell
node tools/configure.js --target 'D:\Configs\local.js' --dns-profile hosts-only --dry-run
```

该模式仅引入实际启用节点的精确 FQDN 到合法 IP 的映射，保留多 IP 和 IPv6；拒绝通配符、别名链、无关 hosts 及非法值。它不继承订阅 resolver/policy，不改节点 `server`、SNI 或 Host，也不覆盖仓库已有 hosts。快照篡改或超限失败关闭。

三款桌面 JS 与 OpenClash Normal/Smart 支持该运行时；OpenClash 用可信启动环境 `SCKI_SUBSCRIPTION_ADAPTER_PROFILE=hosts-only` 选择。其他静态端不会获得运行时订阅适配，仍按对应教程手动合并。

字段依据：[Mihomo DNS](https://wiki.metacubex.one/config/dns/)、[hosts](https://wiki.metacubex.one/config/dns/hosts/)；详细信任边界见[私有节点 DNS](private-node-dns.md)。

## 验证与恢复

先检查 dry-run 和保存清单，再重新导入客户端，核对实际加载配置、规则下载、业务出口及 DNS。可选业务方案必须从新目录导入；正式默认配置不会自动切换。

本地 JS 可从保存时生成的 `.bak` 恢复。业务方案需要重新选择时使用另一个新目录，避免覆盖已有配置。

维护检查：

```powershell
npm --prefix tools/js-engine-tests ci --ignore-scripts
node tools/validate-js-engines.js
node tools/generate-configuration-form.js --check
node tools/sync-node-dns-hints-adapters.js --check
```

真实 QuickJS 门禁比较完整 JSON 与关键引用身份。它验证锁定引擎，不能代替具体 App、系统网络与实际连接的验收。
