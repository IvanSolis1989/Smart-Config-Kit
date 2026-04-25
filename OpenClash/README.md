# OpenClash 使用说明（Smart / Normal 双版本）

> 目录定位：本目录现在只提供 **全量规则（385 providers）** 的两种内核形态。  
> - Smart 版：`OpenClash(mihomo-smart).sh`（`type: smart` + `uselightgbm`）  
> - Normal 版：`OpenClash(mihomo).sh`（`type: url-test`，非 Smart 内核）

---

## 1. 为什么分为 Smart/Normal？

本目录采用「**同规则量、不同内核能力**」：

- 两个脚本都保持与 Clash Party 主线等价的规则覆盖（385 providers、975 rules）。
- 唯一区别是 **9 个区域组的实现方式**：
  - Smart：`type: smart`（可启用 LightGBM）
  - Normal：`type: url-test`（经典延迟测速）

这让你可以按内核能力切换，不再因为「轻量/完整版」导致规则覆盖不一致。

---

## 2. Smart 与 Normal 的区别

| 项目 | Smart 版（`OpenClash(mihomo-smart).sh`） | Normal 版（`OpenClash(mihomo).sh`） |
|---|---|---|
| 适用内核 | Mihomo Smart / Meta Alpha | Mihomo Meta 稳定内核（非 Smart） |
| 区域组类型 | `type: smart` | `type: url-test` |
| LightGBM | 支持（`uselightgbm: true`） | 不支持 |
| 规则覆盖 | 385 providers / 975 rules | 385 providers / 975 rules |
| 业务组数量 | 28 | 28 |
| 区域组数量 | 9 | 9 |
| 其他 DNS / Sniffer / Rule-Providers | 完全一致 | 完全一致 |

一句话：**想要 ML 自动择优就选 Smart；只想稳定跑在非 Smart 内核就选 Normal。**

---

## 3. 快速部署（5 步）

### 步骤 1：安装 OpenClash

参考官方文档：<https://github.com/vernesong/OpenClash/wiki>

### 步骤 2：确认你使用的内核类型

- 用 Smart 内核（Meta Alpha）→ 选 **Smart 版脚本**
- 用普通 Meta 内核（非 Smart）→ 选 **Normal 版脚本**

### 步骤 3：上传脚本到路由器

在仓库根目录执行（示例 IP 为 `192.168.1.1`）：

```bash
# 路径里的 ( ) 是 shell 语法 token，必须加引号
scp 'OpenClash/OpenClash(mihomo-smart).sh' root@192.168.1.1:/etc/openclash/
scp 'OpenClash/OpenClash(mihomo).sh' root@192.168.1.1:/etc/openclash/
# ssh 远端 chmod：外层双引号 + 内层单引号
ssh root@192.168.1.1 "chmod +x '/etc/openclash/OpenClash(mihomo-smart).sh' '/etc/openclash/OpenClash(mihomo).sh'"
```

### 步骤 4：在 OpenClash 启用自定义覆写脚本

LuCI → **服务 → OpenClash → 覆写设置（Overwrite Settings）**：

1. 找到 **「自定义 OpenClash 脚本（Custom Overwrite Script）」**
2. 填写覆写脚本路径（二选一）：
   - Smart 版：`/etc/openclash/OpenClash(mihomo-smart).sh`
   - Normal 版：`/etc/openclash/OpenClash(mihomo).sh`
3. 勾选「**启用自定义覆写**」
4. 点击「**保存并应用**」

> 以下截图展示覆写设置页面的入口和配置位置，供参考：

<img width="1280" height="678" alt="覆写设置入口" src="https://github.com/user-attachments/assets/3f7f16a8-f01c-4f7d-ad17-338140088a9a" />
<img width="1280" height="678" alt="覆写脚本配置" src="https://github.com/user-attachments/assets/e03460ea-606c-4e1b-b45b-a76bc8158abf" />
<img width="1280" height="678" alt="保存并应用" src="https://github.com/user-attachments/assets/3a204b9e-ccc8-4b1f-8ed9-3dd1c1e66e7b" />

### 步骤 5：导入订阅并启动

LuCI → 配置订阅 → 添加订阅链接 → 下载 → 全局设置选择该配置 → 启动 OpenClash。

---

## 4. 常见问题

### Q1：我现在不是 Smart 内核，还能用这套规则吗？

可以。直接用 `OpenClash(mihomo).sh`。

### Q2：我后面升级到 Smart 内核，需要重做所有配置吗？

不需要。只把覆写脚本路径从 `normal.sh` 换成 `full.sh` 即可。

### Q3：为什么 rule-provider 下载代理统一是 `🚫 受限网站`？

这是仓库基线要求（修复墙内直连拉取失败），避免在中国大陆网络下出现规则文件 404 / timeout。

---

## 5. 配套文件

- 覆写脚本（Smart）：`OpenClash(mihomo-smart).sh`
- 覆写脚本（Normal）：`OpenClash(mihomo).sh`
- OpenClash UI 建议项：`OpenClash(mihomo).conf`
- 变更日志：`CHANGELOG.md`

