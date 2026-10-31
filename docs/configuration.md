<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-docs-mobile.svg">
  <img src="assets/readme/page-docs.svg" alt="Smart-Config-Kit 配置入口" width="100%">
</picture>

# 本地参数与业务方案

默认完整配置保持不变。打开[在线配置页面](https://ivansolis1989.github.io/Smart-Config-Kit/)，选择客户端、业务方案及该端支持的参数，直接下载配置，无需 CLI。也可下载[离线 HTML](configuration.html)在本机打开。

[项目首页](../README.md) · [文档中心](README.md) · [下载目录](guide/downloads.md) · [导入后验收](guide/dns-and-verification.md#verification)

## 选择并下载

1. 打开[在线配置页面](https://ivansolis1989.github.io/Smart-Config-Kit/)，选择客户端。默认 FlClash / Full；也可保存并打开离线 `configuration.html`。
2. 选择 **Full** 全部业务、**Lite**（AI、即时通讯、会议协作和 YouTube）或 **Custom** 自选业务，按需调整页面提供的参数。
3. 下载配置并按对应客户端教程导入。单文件保留原扩展名；需要伴随清单、Passwall 列表或 AEROVE 分片和预算的入口以 ZIP 保留目录结构。可选方案的 YAML 使用 JSON 兼容 YAML；Full 保留发布文本的 LF 换行。

| 客户端 | 可选参数 |
| --- | --- |
| Clash Party Smart / Normal、FlClash | 测速、QUIC、节点 DNS、倍率、ZeroTier；Windows 指定浏览器 UDP 保护 |
| AEROVE Lite | 测速、QUIC、倍率、ZeroTier；DNS 由 App 托管并保持 off |
| OpenClash 两版 | 测速、QUIC、节点 DNS、倍率；运行环境变量仍优先于下载副本默认值 |
| CMFA、Stash、Meow | 测速、QUIC |
| Shadowrocket、Surge、Loon | 测速、QUIC；QUIC 原生规则范围较宽，涉及 all-proxy 或全部 UDP/443 |
| Quantumult X | 测速；没有 QUIC 开关 |
| sing-box 1.14 / 1.13 | 测速 5 / 15 分钟、原生 QUIC 规则 |
| v2rayN Xray、Karing | QUIC 投影；Karing 仅提供分流，节点、DNS 和最终动作由 App 管理 |
| Egern、Passwall / Passwall2 | 无上述参数；Egern 保持原生 smart 测速，QUIC 改动需重建资产 |

切换客户端不会携带不支持的参数。首次打开在线页面时从 GitHub 加载静态资源；选择、生成和下载均在本机完成，不填写或读取订阅和个人配置，不上传数据，也不进行遥测。CSP 限制连接、表单提交和 worker。页面内嵌可信发布快照及 MIT fflate ZIP 库，不执行下载的配置，不增加任意 DNS，也不改 server/SNI/Host 或代理链；它不会自动应用到设备。

页面随 main 发布更新；重新打开或刷新可加载最新发布快照，已打开的页面保持当时快照，不进行后台轮询，也不使用 service worker 缓存。离线 HTML 是保存时的快照，更新时需重新下载。导入客户端后远程规则资源仍需联网。

完整默认值与安全规则保持不变。Meow 和 AEROVE 的设备验收仍需单独进行；没有全端性能基准。其他能力边界见[能力矩阵](client-capability-matrix.md)及[支持队列](support-queue.md)。CLI 仍可用于高级生成或更新已有本地 JS。

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
| `--browser-udp` | `off` / `reject` | 默认关闭；Windows Chrome / Edge / Firefox 全部 UDP 拒绝，通话和 HTTP/3 可能受影响 |
| `--max-multiplier` | 正数 / `off` | 默认关闭；未知或矛盾倍率不据此删除 |
| `--dns-profile` | `off` / `policy` / `adaptive` / `hosts-only` | 默认 `adaptive`；仅可信本地设置有效 |
| `--zerotier` | `on` / `off` | 默认关闭；设备本地选择 |

保存使用原有原子替换、并发检查、原件备份和读回机制。目标脚本仅作语法及可信常量解析，不执行目标代码。

更新源码时可显式提供 `--source`。已有浏览器 UDP 保护、ZeroTier、节点 DNS profile 和倍率上限自动保留；`--preserve-local` 同时保留测速及 QUIC，显式参数优先：

```powershell
node tools/configure.js --target 'D:\Configs\local.js' --source 'D:\Configs\new.js' --preserve-local --dry-run
```

若新源码不具备已选的节点 DNS 模式，更新会在保存前拒绝；不会把 `hosts-only` 静默降为 `adaptive`。AEROVE 的 App 托管 DNS 占位保持 `off`。

这些选项只适用于含对应能力的本仓库 JS；静态端的 DNS 与系统网络设置仍按客户端教程配置。原 `configure-traffic-options.js` 入口继续可用。

浏览器 UDP 保护仅适用于 Windows 三个指定进程，需 TUN 接管及有效进程识别；默认 `off`，订阅不能开启。AEROVE Lite 和其他原生入口不提供该参数。启用、恢复和 WebRTC 边界见[WebRTC 隐私与连接验收](guide/webrtc-privacy.md)。

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
