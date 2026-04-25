# OpenClash 使用说明（Smart / Normal 双版本）

> 本目录提供「同规则量、不同内核能力」的两份覆写脚本，外加一份 OpenClash UI 配置快照（`.conf`）。
>
> - Smart 版：`OpenClash(mihomo-smart).sh`（`type: smart` + `uselightgbm`）
> - Normal 版：`OpenClash(mihomo).sh`（`type: url-test`，非 Smart 内核）
> - UI 配置快照：`OpenClash(mihomo).conf`（一次性导入推荐 UCI 选项）

---

## 1. 三件套定位（先搞清楚每个文件干嘛的）

| 文件 | 作用 | 上传到哪 / 在 LuCI 哪里用 |
|------|------|---------------------------|
| `OpenClash(mihomo).conf` | OpenClash **UI 配置快照（必导）**：把推荐的 UCI 选项（核心 = Smart、DNS = fake-ip、Sniffer、GeoX 自动更新、LightGBM 自动更新等 30+ 项）一次性灌进 OpenClash，**导完就不用再去 LuCI WebUI 上手动勾任何东西** | LuCI → OpenClash → **覆写设置** 页面里的 **配置文件上传**入口（一次性导入，不需要落到固定路径） |
| `OpenClash(mihomo-smart).sh` | **Smart 内核**覆写脚本（`type: smart` + LightGBM） | 上传到路由器 `/etc/openclash/`，在 **覆写设置 → 自定义覆写脚本路径** 里引用 |
| `OpenClash(mihomo).sh` | **Normal 内核**覆写脚本（`type: url-test`，非 Smart 内核） | 同上，与 Smart 版二选一 |

> 两份 `.sh` 按你装的 mihomo 内核类型二选一；`.conf` 两种内核公用同一份。

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
| DNS / Sniffer / Rule-Providers | 完全一致 | 完全一致 |

一句话：**想要 ML 自动择优就选 Smart；只想稳定跑在非 Smart 内核就选 Normal。**

---

## 3. 部署步骤

### 3.1 先装好 OpenClash

参考官方文档：<https://github.com/vernesong/OpenClash/wiki>

### 3.2 进入「覆写设置」页面

LuCI → **服务 → OpenClash → 覆写设置（Overwrite Settings）**。

后续两步导入（`.conf` 和 `.sh` 路径）都在这一页里完成。

<img width="1280" height="678" alt="① 覆写设置页面入口" src="https://github.com/user-attachments/assets/3f7f16a8-f01c-4f7d-ad17-338140088a9a" />

### 3.3 导入 `.conf`（**必做**，一次性灌入全部 UI 选项）

在覆写设置页面里找到 **配置文件上传** 入口：

1. 点击 **上传** / **浏览**，选择仓库里的 `OpenClash/OpenClash(mihomo).conf`
2. 点击 **保存并应用**

这一步会把核心类型 = Smart、DNS = fake-ip、Sniffer、GeoX / LightGBM 自动更新等 30+ 项推荐选项一次性写入 OpenClash —— **导完之后你完全不用再去 LuCI WebUI 上勾任何东西**，所有 UI 上的配置都已经被 `.conf` 一次性敲定。

> `.conf` 是 OpenClash 的设置快照（UCI 格式），不是常驻在路由器文件系统里的文件 —— 上传一次就完事。

<img width="1280" height="678" alt="② .conf 上传位置（在覆写设置页面里）" src="https://github.com/user-attachments/assets/3a204b9e-ccc8-4b1f-8ed9-3dd1c1e66e7b" />

### 3.4 在 WebUI 里把 `.sh` 上传并启用

回到刚才 §3.2 / §3.3 的同一个 **服务 → OpenClash → 覆写设置** 页面，底部有一排"脚本槽位"卡片（`default` / 已存在的脚本 / **`+`** 新建按钮），每张卡片右侧都有一个 enable 开关。

OpenClash 在这里直接支持「**上传本地 `.sh` 当作覆写脚本**」，**不需要 SSH，也不用记 `/etc/openclash/` 路径** —— 推荐就走这条路：

1. 点击最左边的 **`+`** 卡片（新建脚本槽位）
2. 在弹出的编辑器里：
   - **方式 A（最简单）**：把仓库里的 `OpenClash/OpenClash(mihomo-smart).sh`（或 `OpenClash(mihomo).sh`）整份内容**复制粘贴**进编辑器
   - **方式 B**：用编辑器右上角的"导入 / 上传"按钮，选择本地的 `.sh` 文件
3. 给这个槽位起个名字（比如 `clash-smart` / `clash-normal`），保存
4. 在底部卡片列表里找到刚保存的脚本，**把右侧开关拨到开**（同时把其他覆写脚本的开关**关掉**，OpenClash 一次只用一份生效的覆写）
5. 点击页面底部 **应用**（或保存并应用）

> **二选一**：装的是 Mihomo Smart / Meta Alpha 内核就上 `OpenClash(mihomo-smart).sh`；装的是普通 Meta 稳定内核就上 `OpenClash(mihomo).sh`。两份都上传也行，但**只能开一个**。

保存成功之后，下次 OpenClash 启动 / 订阅更新时就会自动加载这份脚本，在 §3.3 用 `.conf` 灌进去的基础 UI 配置之上**再叠加** 18 区域组 / 28 业务组 / 385 rule-providers / 975 rules 的完整分流策略。

<img width="1280" height="678" alt="③ .sh 脚本上传位置（覆写设置页面底部 + 号 + 开关）" src="https://github.com/user-attachments/assets/e03460ea-606c-4e1b-b45b-a76bc8158abf" />

#### 备选：用命令行 `scp` 上传（高级用户 / 多台路由器批量部署）

如果你更习惯命令行，或者要批量同步多台路由器，可以走 SSH 直接把脚本铺到 `/etc/openclash/`：

```bash
# 路径里的 ( ) 是 shell 语法 token，必须加引号
scp 'OpenClash/OpenClash(mihomo-smart).sh' root@192.168.1.1:/etc/openclash/
scp 'OpenClash/OpenClash(mihomo).sh'       root@192.168.1.1:/etc/openclash/
# 远端一并加可执行权限
ssh root@192.168.1.1 "chmod +x '/etc/openclash/OpenClash(mihomo-smart).sh' '/etc/openclash/OpenClash(mihomo).sh'"
```

不熟悉命令行的也可以用 WinSCP / Cyberduck / FileZilla 拖拽到 `/etc/openclash/`，再 SSH 进去 `chmod +x`。

文件传上去之后**仍然要回到 WebUI 覆写设置页面，把对应槽位的开关打开**才会生效（OpenClash 不会自动启用一份新出现的脚本）。

### 3.5 导入订阅并启动

LuCI → **配置订阅** → 添加订阅链接 → 下载 → **全局设置** 选择该配置 → 启动 OpenClash。

---

## 4. 常见问题

### Q1：我现在不是 Smart 内核，还能用这套规则吗？

可以。直接用 `OpenClash(mihomo).sh` 即可，规则覆盖（385 providers / 975 rules）与 Smart 版完全一致。

### Q2：我后面升级到 Smart 内核，要重做配置吗？

不需要。把 **覆写脚本路径** 从 `OpenClash(mihomo).sh` 换成 `OpenClash(mihomo-smart).sh`，保存并应用即可。`.conf` 不用重新导入。

### Q3：是否一定要导入 `.conf`？

**是，强烈建议必做。** 推荐流程就是用 `.conf` 一次性把全部 UI 配置敲定，**导完之后不需要再去 LuCI WebUI 上手动勾任何选项**，省心也避免漏项 / 与覆写脚本不一致。

`.conf` 里的 UCI 选项（核心 = Smart / DNS = fake-ip / Sniffer / GeoX / LightGBM 自动更新等 30+ 项）正是覆写脚本默认假设的运行环境；手动一项项配既容易漏，也容易因为 OpenClash 版本差异勾错。除非你非常熟悉 OpenClash 并且坚持手动调，否则请直接导入 `.conf`。

### Q4：为什么 rule-provider 下载代理统一是 `🚫 受限网站`？

仓库基线要求（修复中国大陆网络下规则文件 404 / timeout 拉取失败），与 Clash Party / CMFA 主线对齐。

---

## 5. 配套文件

| 文件 | 说明 |
|------|------|
| `OpenClash(mihomo-smart).sh` | 覆写脚本（Smart 内核） |
| `OpenClash(mihomo).sh` | 覆写脚本（Normal 内核） |
| `OpenClash(mihomo).conf` | OpenClash UI 配置快照（一次性导入） |
| `CHANGELOG.md` | 两份脚本的变更日志（Smart 段 + Normal 段） |
