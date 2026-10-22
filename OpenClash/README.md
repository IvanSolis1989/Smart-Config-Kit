# OpenClash 使用说明（Smart / Normal 双版本）

## 📥 规则下载链接

[![下载规则：Smart SH](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Smart%20SH-2ea44f?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/OpenClash/OpenClash%28mihomo-smart%29.sh)
[![下载规则：Normal SH](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-Normal%20SH-0969da?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/OpenClash/OpenClash%28mihomo%29.sh)
[![下载规则：UI CONF](https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%E8%A7%84%E5%88%99-UI%20CONF-0969da?style=for-the-badge&logo=github)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/OpenClash/OpenClash%28mihomo%29.conf)

点击按钮打开 Raw 原始文件；右键按钮可复制链接，需要本地文件时可另存为。

**Smart SH 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/OpenClash/OpenClash%28mihomo-smart%29.sh
```

**Normal SH 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/OpenClash/OpenClash%28mihomo%29.sh
```

**UI CONF 直链：**

```text
https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/OpenClash/OpenClash%28mihomo%29.conf
```

Smart 与 Normal 覆写脚本二选一，UI CONF 为配套 UCI 配置快照；按下文分别上传到对应入口。

---

业务 DNS policy 由 `../rulesets/source/business-dns-policy.json` 维护，执行 `node tools/sync-business-dns-policy.js` 生成 Normal/Smart 投影；通过该命令的 `--check` 与两个业务 DNS 测试校验。

本目录提供 OpenClash Smart / Normal 完整 Shell 覆写与配套 UCI 快照；两份脚本二选一，规则量相同。版本见 [CHANGELOG](./CHANGELOG.md)。

- Smart 需要 vernesong/mihomo Smart 核心；MetaCubeX stable / Alpha 使用 Normal。
- 输入订阅应包含已展开的节点；远程 provider 先用 Sub-Store 展开。倍率筛选默认关闭，见[节点筛选](../docs/subscription-node-filter.md)。
- 私有节点 DNS 默认 adaptive，只投影活动节点提示；LuCI Mixin 须保留这些字段。见[私有节点 DNS](../docs/private-node-dns.md)。
- 路由器通常无法识别局域网终端的进程名；PROCESS-NAME 不能替代域名规则。
- [规则下载](../docs/rule-asset-delivery.md)需要 GitHub Raw 可达或可用代理；[测速/QUIC](../docs/traffic-options.md)、[微信排错](../docs/research/2026-10-16-wechat-issue-187.md)另有说明。

<sub>💖 [支持本项目](../docs/donate.md) · ⭐ [Star](https://github.com/ivansolis1989/Smart-Config-Kit) · 🐛 [Issue](https://github.com/ivansolis1989/Smart-Config-Kit/issues)</sub>

---

## 1. 三件套定位（先搞清楚每个文件干嘛的）

| 文件 | 作用 | 上传到哪 / 在 LuCI 哪里用 |
|------|------|---------------------------|
| `OpenClash(mihomo).conf` | OpenClash **UI 配置快照（必导）**：把推荐的 UCI 选项（核心 = Smart、DNS = fake-ip、Sniffer、GeoX 自动更新、LightGBM 自动更新等 30+ 项）一次性灌进 OpenClash，**导完就不用再去 LuCI WebUI 上手动勾任何东西** | LuCI → OpenClash → **覆写设置** 页面里的 **配置文件上传**入口（一次性导入，不需要落到固定路径） |
| `OpenClash(mihomo-smart).sh` | **Smart 内核**覆写脚本（`type: smart` + LightGBM） | 备份后上传为 `/etc/openclash/custom/openclash_custom_overwrite.sh`，赋予执行权限并重启插件（见 §3.4） |
| `OpenClash(mihomo).sh` | **Normal 内核**覆写脚本（`type: url-test`，非 Smart 内核） | 同上，与 Smart 版二选一 |

> 按实际核心选择一份 .sh。UCI 快照是设置参考，导入后仍须确认核心类型、DNS 和设备网络参数；它不能自动检测环境。

---

## 2. Smart 与 Normal 的区别

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

Smart 版使用 `uselightgbm` / `collectdata` 等[官方 Smart 字段](https://github.com/vernesong/OpenClash/releases/tag/mihomo)，不设置 `strategy`；节点选择由内核目标匹配、连接质量和重试机制决定。MetaCubeX/mihomo 的 Alpha 分支不等于 Smart 内核。发布版本、覆写入口及设备验收边界见[官方版本核对报告](../docs/upstream/2026-10-19/mihomo/report.md)。

---

## 3. 部署步骤

### 3.1 先装好 OpenClash

参考官方文档：<https://github.com/vernesong/OpenClash/wiki>

### 3.2 进入「覆写设置」页面

LuCI → **服务 → OpenClash → 覆写设置（Overwrite Settings）**。

在这一页导入 `.conf`（§3.3），再按 §3.4 通过固定自定义脚本入口部署 `.sh`。

<img width="1280" height="678" alt="① 覆写设置页面入口" src="https://github.com/user-attachments/assets/3f7f16a8-f01c-4f7d-ad17-338140088a9a" />

### 3.3 导入 `.conf`（**必做**，一次性灌入全部 UI 选项）

在覆写设置页面里找到 **配置文件上传** 入口：

1. 点击 **上传** / **浏览**，选择仓库里的 `OpenClash/OpenClash(mihomo).conf`
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
scp 'OpenClash/OpenClash(mihomo-smart).sh' root@192.168.1.1:/etc/openclash/custom/openclash_custom_overwrite.sh

# 使用 MetaCubeX/mihomo stable 或 Alpha 时，改为上传这一份（二选一）
# scp 'OpenClash/OpenClash(mihomo).sh' root@192.168.1.1:/etc/openclash/custom/openclash_custom_overwrite.sh

ssh root@192.168.1.1 'chmod +x /etc/openclash/custom/openclash_custom_overwrite.sh && /etc/init.d/openclash restart'
```

也可以用 WinSCP / Cyberduck / FileZilla 先备份、再上传到同一固定路径。重启后检查 `/tmp/openclash.log` 中 `[Clash-Smart]` 或 `[Clash-Normal]` 的完成记录，并检查最终配置的策略组、规则及 DNS。

`/etc/openclash/overwrite/` 下的普通覆写模块使用[官方 INI 段格式](https://github.com/vernesong/OpenClash/blob/e553e82e01c697aefbe1555261a503f425e00ccd/.github/skills/openclash-user-guide/16-overwrite-module-format.md#162-覆写文件格式)；本仓库完整脚本应放到上述固定入口。若此前按旧指引新建了同名模块，请在界面停用它，避免混淆。两份脚本只部署一份。

### 3.5 多机场订阅合并（三选一）

节点来自 LuCI 下载的**原始订阅配置**，不是在覆写脚本内填远程 proxy-providers。当前预检仅接受 proxies 节点列表或仅含 type/payload 的 inline provider；其他 provider 先展开为节点。

#### 方式 A：Sub-Store 融合（推荐）

按 [Sub-Store 教程](../SubStore/README.md)聚合订阅，输出包含 proxies 节点列表的 Mihomo 配置，再把路由器可访问的 URL 填入 LuCI「配置订阅」。127.0.0.1 只指路由器自身。

#### 方式 B：在线订阅转换站（零门槛，无需安装任何工具）

在受信任的转换服务中合并多个订阅，输出含 proxies 的 Mihomo 配置，再交给 LuCI 下载。服务端可看到订阅 token；敏感订阅优先本地处理。

#### 方式 C：在 .sh 脚本内写多个 proxy-providers（无需额外工具）

请编辑**输入订阅配置**，合并为同一个 proxies 列表，或使用仅含 type: inline 与 payload 的 provider；不要向本仓库 Shell 的规则 heredoc 添加远程节点 provider。

预检会展平可接受的 inline 节点并重建区域组；远程、带额外字段或有歧义的 provider 会被拒绝，保留原订阅。详细输入边界见[节点筛选指南](../docs/subscription-node-filter.md)。

---

### 3.6 导入订阅并启动

LuCI → **配置订阅** → 添加订阅链接 → 下载 → **全局设置** 选择该配置 → 启动 OpenClash。

---

### 3.7 启动后验证

- OpenClash「运行状态」应显示内核正常启动，日志没有大面积 rule-provider 403 / 404。
- 策略组页面应看到 22 区域组 + 33 业务组；Smart 版区域组应为 `smart`，Normal 版应为 `url-test`。
- 额外检查：按根 README 的 [导入后 60 秒验证清单](../README.md#-导入后-60-秒验证清单) 确认规则下载、GEOSITE 命中与 anti-ad 误伤白名单。

## 4. 常见问题

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

---

## 5. 配套文件

| 文件 | 说明 |
|------|------|
| `OpenClash(mihomo-smart).sh` | 覆写脚本（Smart 内核） |
| `OpenClash(mihomo).sh` | 覆写脚本（Normal 内核） |
| `OpenClash(mihomo).conf` | OpenClash UI 配置快照（一次性导入） |

---

## 💖 支持本项目

→ [捐赠 / Star / PR](../docs/donate.md)
