# OpenClash 使用说明（Smart / Normal 双版本）

> 目录定位：本目录现在只提供 **全量规则（385 providers）** 的两种内核形态。  
> - Smart 版：`openclash_custom_overwrite_full.sh`（`type: smart` + `uselightgbm`）  
> - Normal 版：`openclash_custom_overwrite_normal.sh`（`type: url-test`，非 Smart 内核）

---

## 1. 为什么从 Slim/Full 改为 Smart/Normal？

历史上的 Slim 版本已移除。本目录改为「**同规则量、不同内核能力**」：

- 两个脚本都保持与 Clash Party 主线等价的规则覆盖（385 providers、975 rules）。
- 唯一区别是 **9 个区域组的实现方式**：
  - Smart：`type: smart`（可启用 LightGBM）
  - Normal：`type: url-test`（经典延迟测速）

这让你可以按内核能力切换，不再因为「轻量/完整版」导致规则覆盖不一致。

---

## 2. Smart 与 Normal 的区别

| 项目 | Smart 版（`openclash_custom_overwrite_full.sh`） | Normal 版（`openclash_custom_overwrite_normal.sh`） |
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
scp OpenClash/openclash_custom_overwrite_full.sh root@192.168.1.1:/etc/openclash/
scp OpenClash/openclash_custom_overwrite_normal.sh root@192.168.1.1:/etc/openclash/
ssh root@192.168.1.1 "chmod +x /etc/openclash/openclash_custom_overwrite_full.sh /etc/openclash/openclash_custom_overwrite_normal.sh"
```

### 步骤 4：在 OpenClash 启用自定义覆写脚本

LuCI → 服务 → OpenClash → 覆写设置：

- Smart 版路径：`/etc/openclash/openclash_custom_overwrite_full.sh`
- Normal 版路径：`/etc/openclash/openclash_custom_overwrite_normal.sh`

勾选「启用自定义覆写」，保存并应用。

### 步骤 5：导入订阅并启动

LuCI → 配置订阅 → 添加订阅链接 → 下载 → 全局设置选择该配置 → 启动 OpenClash。

---

## 4. 常见问题

### Q1：我现在不是 Smart 内核，还能用这套规则吗？

可以。直接用 `openclash_custom_overwrite_normal.sh`。

### Q2：我后面升级到 Smart 内核，需要重做所有配置吗？

不需要。只把覆写脚本路径从 `normal.sh` 换成 `full.sh` 即可。

### Q3：为什么 rule-provider 下载代理统一是 `🚫 受限网站`？

这是仓库基线要求（修复墙内直连拉取失败），避免在中国大陆网络下出现规则文件 404 / timeout。

### Q4：是否还有 Slim（低内存裁剪）版本？

没有。Slim 已删除。当前 OpenClash 目录仅保留 **全量规则 Smart/Normal 双版本**。

---

## 5. 配套文件

- 覆写脚本（Smart）：`openclash_custom_overwrite_full.sh`
- 覆写脚本（Normal）：`openclash_custom_overwrite_normal.sh`
- OpenClash UI 建议项：`clash-smart-openclash.conf`
- 变更日志：`CHANGELOG.md`

