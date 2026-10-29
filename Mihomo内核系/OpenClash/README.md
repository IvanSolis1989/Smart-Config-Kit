<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-openclash-mobile.svg">
  <img src="../../docs/assets/readme/page-openclash.svg" alt="OpenClash 导入指南" width="100%">
</picture>

# OpenClash 导入指南

在 OpenWrt 为现有节点订阅部署 Shell 覆写，统一生成分组、规则与 DNS。**Smart / Normal 二选一**，完整脚本使用固定自定义入口。

<p><a href="../../docs/guide/downloads.md#mihomo"><img src="../../docs/assets/readme/nav-downloads.svg" alt="下载目录" width="145" height="38"></a> <a href="../../docs/README.md"><img src="../../docs/assets/readme/nav-docs.svg" alt="文档中心" width="145" height="38"></a> <a href="#verification"><img src="../../docs/assets/readme/nav-verify.svg" alt="导入后验收" width="145" height="38"></a></p>

[开始前](#before-you-start) · [选择文件](#downloads) · [导入步骤](#import) · [常见问题](#faq) · [进阶与参考](#reference)

<a id="1-三件套定位先搞清楚每个文件干嘛的"></a>

<a id="before-you-start"></a>


[可选业务方案与本地参数](../../docs/configuration.md)：完整配置继续作为默认；可选投影输出到独立目录，运行时参数支持范围见统一指南。

## 开始前：确认内核并备份

先按 [OpenClash 官方入口](https://github.com/vernesong/OpenClash)安装插件，准备路由器可访问的 Mihomo 节点订阅。备份现有插件设置和自定义脚本；已有逻辑先合并再部署。

| 选择 | 所需核心与区域组 |
|---|---|
| Smart SH | vernesong/mihomo Smart；smart + LightGBM |
| Normal SH | MetaCubeX/mihomo stable 或 Alpha；url-test |
| UI CONF | 配套 UCI 快照；偏向 Smart，导入后核对实际核心、DNS、端口与网络模式 |

两份脚本规则量相同，均为 22 区域组 + 33 业务组。MetaCubeX Alpha 不等于 Smart。输入订阅须包含展开后的节点；远程 provider 先经 Sub-Store 展开。规则下载需要 GitHub Raw 可达或可用代理。

<a id="-规则下载链接"></a>

<a id="downloads"></a>

## 选择并下载文件

[![下载 Smart SH](../../docs/assets/readme/button-smart-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh) [![下载 Normal SH](../../docs/assets/readme/button-normal-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo%29.sh) [![下载 UI CONF](../../docs/assets/readme/button-ui-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo%29.conf)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**Smart SH 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh
```

**Normal SH 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo%29.sh
```

**UI CONF 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo%29.conf
```

Smart 与 Normal 覆写脚本二选一，UI CONF 为配套 UCI 配置快照；按下文分别上传到对应入口。

<a id="3-部署步骤"></a>

<a id="import"></a>

## 按顺序部署与启动

### 3.2 进入「覆写设置」页面

LuCI → **服务 → OpenClash → 覆写设置（Overwrite Settings）**。

在这一页导入 `.conf`（§3.3），再按 §3.4 通过固定自定义脚本入口部署 `.sh`。

<img width="1280" height="678" alt="① 覆写设置页面入口" src="https://github.com/user-attachments/assets/3f7f16a8-f01c-4f7d-ad17-338140088a9a" />

### 3.3 核对或导入配套 UCI 设置

在覆写设置页面里找到 **配置文件上传** 入口：

1. 点击 **上传** / **浏览**，选择仓库里的 `Mihomo内核系/OpenClash/OpenClash(mihomo).conf`
2. 点击 **保存并应用**

导入前先备份现有插件设置。快照偏向 Smart 配置；使用 Normal 时需确认实际核心与选项匹配，导入后仍检查 DNS、端口和网络模式。

> .conf 是 UCI 设置快照，不是节点订阅；无需把它作为核心配置加载。

<img width="1280" height="678" alt="② .conf 上传位置（在覆写设置页面里）" src="https://github.com/user-attachments/assets/3a204b9e-ccc8-4b1f-8ed9-3dd1c1e66e7b" />

### 3.4 把 `.sh` 覆写脚本放到路由器并启用

两份完整 Shell 脚本均使用固定入口 /etc/openclash/custom/openclash_custom_overwrite.sh，当前配置路径由[官方启动流程](https://github.com/vernesong/OpenClash/blob/e553e82e01c697aefbe1555261a503f425e00ccd/luci-app-openclash/root/etc/init.d/openclash#L3849-L3855)传入。

先下载该固定文件留作本地备份；其中若有自己的逻辑，先合并再部署。路由器地址请换成自己的地址。

```bash
scp root@192.168.1.1:/etc/openclash/custom/openclash_custom_overwrite.sh ./openclash_custom_overwrite.sh.backup

# 使用 vernesong/mihomo Smart 内核时上传这一份
scp 'Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh' root@192.168.1.1:/etc/openclash/custom/openclash_custom_overwrite.sh

# 使用 MetaCubeX/mihomo stable 或 Alpha 时，改为上传这一份（二选一）
# scp 'Mihomo内核系/OpenClash/OpenClash(mihomo).sh' root@192.168.1.1:/etc/openclash/custom/openclash_custom_overwrite.sh

ssh root@192.168.1.1 'chmod +x /etc/openclash/custom/openclash_custom_overwrite.sh && /etc/init.d/openclash restart'
```

也可以用 WinSCP / Cyberduck / FileZilla 先备份、再上传到同一固定路径。重启后检查 `/tmp/openclash.log` 中 `[Clash-Smart]` 或 `[Clash-Normal]` 的完成记录，并检查最终配置的策略组、规则及 DNS。

`/etc/openclash/overwrite/` 下的普通覆写模块使用[官方 INI 段格式](https://github.com/vernesong/OpenClash/blob/e553e82e01c697aefbe1555261a503f425e00ccd/.github/skills/openclash-user-guide/16-overwrite-module-format.md#162-覆写文件格式)；本仓库完整脚本应放到上述固定入口。若此前按旧指引新建了同名模块，请在界面停用它，避免混淆。两份脚本只部署一份。

### 3.5 多机场订阅合并（三选一）

节点来自 LuCI 下载的**原始订阅配置**，不是在覆写脚本内填远程 proxy-providers。当前预检仅接受 proxies 节点列表或仅含 type/payload 的 inline provider；其他 provider 先展开为节点。

#### 方式 A：Sub-Store 融合（推荐）

按 [Sub-Store 教程](../../SubStore/README.md)聚合订阅，输出包含 proxies 节点列表的 Mihomo 配置，再把路由器可访问的 URL 填入 LuCI「配置订阅」。127.0.0.1 只指路由器自身。

#### 方式 B：在线订阅转换站（零门槛，无需安装任何工具）

在受信任的转换服务中合并多个订阅，输出含 proxies 的 Mihomo 配置，再交给 LuCI 下载。服务端可看到订阅 token；敏感订阅优先本地处理。

#### 方式 C：手动合并输入订阅配置

请编辑**输入订阅配置**，合并为同一个 proxies 列表，或使用仅含 type: inline 与 payload 的 provider；不要向本仓库 Shell 的规则 heredoc 添加远程节点 provider。

预检会展平可接受的 inline 节点并重建区域组；远程、带额外字段或有歧义的 provider 会被拒绝，保留原订阅。详细输入边界见[节点筛选指南](../../docs/subscription-node-filter.md)。


### 3.6 导入订阅并启动

LuCI → **配置订阅** → 添加订阅链接 → 下载 → **全局设置** 选择该配置 → 启动 OpenClash。

<a id="verification"></a>

## 启动后核验

- OpenClash「运行状态」应显示内核正常启动，日志没有大面积 rule-provider 403 / 404。
- 策略组页面应看到 22 区域组 + 33 业务组；Smart 版区域组应为 `smart`，Normal 版应为 `url-test`。
- 额外检查：按专题页的 [导入后 60 秒验证清单](../../docs/guide/dns-and-verification.md#verification) 确认规则下载、GEOSITE 命中与 anti-ad 误伤白名单。

<a id="4-常见问题"></a>

<a id="faq"></a>

## 常见问题

### Q1：我现在不是 Smart 内核，还能用这套规则吗？

可以。直接用 `OpenClash(mihomo).sh` 即可，规则覆盖（149 融合 providers / 168 rules；源 525 providers / 984 rules）与 Smart 版完全一致。

### Q2：我后面升级到 Smart 内核，要重做配置吗？

节点订阅可继续使用。按 §3.4 备份并替换固定自定义脚本，确认核心类型匹配后重启插件；不要把完整 Shell 注册成普通覆写模块。

### Q3：是否一定要导入 `.conf`？

快照可减少手工设置，但导入前须备份，导入后须确认实际核心、DNS、端口与网络模式。已有正确设置时可按快照逐项核对；不要用“导入成功”代替运行验证。

### Q4：为什么 rule-provider 下载代理统一是 `🚫 受限网站`？

用可用代理组拉取规则，避免当前网络无法直连 GitHub Raw。404、超时和代理不可用应分别排查。

### Q5：粘贴 `.sh` 后保存提示 `HTTP error! status: 500` 怎么办？

先区分 Web 表单保存失败和核心解析错误；HTTP 500 本身不能证明脚本语法有问题。

请改用 §3.4 的文件系统部署：备份后把 `.sh` 上传为 `/etc/openclash/custom/openclash_custom_overwrite.sh`，赋予执行权限并重启插件。若仍失败，再提供路由器型号、OpenWrt / LuCI / OpenClash 版本，以及 `logread | grep -Ei 'luci|uhttpd|openclash|content|maximum|POST'` 的输出。


<a id="reference"></a>

## 进阶与参考

- [节点筛选与订阅输入边界](../../docs/subscription-node-filter.md)：倍率筛选默认关闭，远程、额外字段或有歧义的 provider 会被拒绝。
- [私有节点 DNS](../../docs/private-node-dns.md)：默认 adaptive；LuCI Mixin 须保留活动节点的精确 policy。
- [规则下载](../../docs/rule-asset-delivery.md) · [测速 / QUIC](../../docs/traffic-options.md) · [微信排错](../../docs/research/2026-10-16-wechat-issue-187.md)。
- 路由器通常无法识别局域网终端进程名，PROCESS-NAME 不能替代域名规则。
- [官方版本、覆写入口与设备验收边界](../../docs/upstream/2026-10-19/mihomo/report.md) · [本地官方参考](REFERENCE-openclash.md)。

<a id="2-smart-与-normal-的区别"></a>

<details>
<summary>Smart / Normal 字段与规则覆盖对照</summary>

| 项目 | Smart 版（`OpenClash(mihomo-smart).sh`） | Normal 版（`OpenClash(mihomo).sh`） |
|---|---|---|
| 适用内核 | vernesong/mihomo Smart 分支 | MetaCubeX/mihomo 稳定内核（非 Smart） |
| 区域组类型 | `type: smart` | `type: url-test` |
| LightGBM | 支持（`uselightgbm: true`） | 不支持 |
| 规则覆盖 | 149 融合 providers / 168 rules（源 525 / 984） | 149 融合 providers / 168 rules（源 525 / 984） |
| 业务组数量 | 33 | 33 |
| 区域组数量 | 22 | 22 |
| DNS / Sniffer / Rule-Providers | 完全一致 | 完全一致 |

一句话：**想要 ML 自动择优就选 Smart；只想稳定跑在非 Smart 内核就选 Normal。**

Smart 版使用 `uselightgbm` / `collectdata` 等[官方 Smart 字段](https://github.com/vernesong/OpenClash/releases/tag/mihomo)，不设置 `strategy`；节点选择由内核目标匹配、连接质量和重试机制决定。MetaCubeX/mihomo 的 Alpha 分支不等于 Smart 内核。发布版本、覆写入口及设备验收边界见[官方版本核对报告](../../docs/upstream/2026-10-19/mihomo/report.md)。

</details>

<a id="5-配套文件"></a>

UI CONF 是 UCI 设置快照，不是节点配置；完整 Shell 应部署到 `/etc/openclash/custom/openclash_custom_overwrite.sh`，不要注册为普通 INI 覆写模块。

业务 DNS 的权威源为 [business-dns-policy.json](../../rulesets/source/business-dns-policy.json)，维护命令：

```bash
node tools/sync-business-dns-policy.js
node tools/sync-business-dns-policy.js --check
node --test tools/tests/business-dns-policy.test.js tools/tests/business-dns-sync.test.js
```

<a id="-支持本项目"></a>

[变更历史](CHANGELOG.md) · [支持本项目](../../docs/donate.md) · [反馈问题](https://github.com/IvanSolis1989/Smart-Config-Kit/issues)
