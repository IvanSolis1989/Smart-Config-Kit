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
| `OpenClash(mihomo-smart).sh` | **Smart 内核**覆写脚本（`type: smart` + LightGBM） | 推荐上传到路由器 `/etc/openclash/overwrite/`，再在 **覆写设置 → 脚本槽位 / 覆写模块** 里启用；高内存或兼容性好的 LuCI 环境也可直接粘贴 |
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
| 业务组数量 | 31 | 31 |
| 区域组数量 | 18 | 18 |
| DNS / Sniffer / Rule-Providers | 完全一致 | 完全一致 |

一句话：**想要 ML 自动择优就选 Smart；只想稳定跑在非 Smart 内核就选 Normal。**

---

## 3. 部署步骤

### 3.1 先装好 OpenClash

参考官方文档：<https://github.com/vernesong/OpenClash/wiki>

### 3.2 进入「覆写设置」页面

LuCI → **服务 → OpenClash → 覆写设置（Overwrite Settings）**。

后续三步都在这一页里完成：导入 `.conf`（§3.3）→ 放置 `.sh` 并启用（§3.4）。

<img width="1280" height="678" alt="① 覆写设置页面入口" src="https://github.com/user-attachments/assets/3f7f16a8-f01c-4f7d-ad17-338140088a9a" />

### 3.3 导入 `.conf`（**必做**，一次性灌入全部 UI 选项）

在覆写设置页面里找到 **配置文件上传** 入口：

1. 点击 **上传** / **浏览**，选择仓库里的 `OpenClash/OpenClash(mihomo).conf`
2. 点击 **保存并应用**

这一步会把核心类型 = Smart、DNS = fake-ip、Sniffer、GeoX / LightGBM 自动更新等 30+ 项推荐选项一次性写入 OpenClash —— **导完之后你完全不用再去 LuCI WebUI 上勾任何东西**，所有 UI 上的配置都已经被 `.conf` 一次性敲定。

> `.conf` 是 OpenClash 的设置快照（UCI 格式），不是常驻在路由器文件系统里的文件 —— 上传一次就完事。

<img width="1280" height="678" alt="② .conf 上传位置（在覆写设置页面里）" src="https://github.com/user-attachments/assets/3a204b9e-ccc8-4b1f-8ed9-3dd1c1e66e7b" />

### 3.4 把 `.sh` 覆写脚本放到路由器并启用

两份 `.sh` 约 178 KB / 4400 行。R4S、x86 或部分 LuCI 组合可以直接粘贴保存，但也有一些 OpenWrt / LuCI / OpenClash WebUI 组合会在保存大文本时直接报 `HTTP error! status: 500`。这通常发生在 Web 表单解析阶段，**不是脚本内容或 mihomo 规则语法错误**。

因此推荐走文件系统部署：先把 `.sh` 放到 OpenClash 当前覆写模块目录，再到 WebUI 启用它。

#### 推荐：WinSCP / `scp` 上传到 `/etc/openclash/overwrite/`

二选一上传即可：

```bash
# Smart 内核 / Meta Alpha 用户
scp 'OpenClash/OpenClash(mihomo-smart).sh' root@192.168.1.1:/etc/openclash/overwrite/Smart-Config-Kit-smart.sh

# 普通 Meta 稳定内核用户
scp 'OpenClash/OpenClash(mihomo).sh' root@192.168.1.1:/etc/openclash/overwrite/Smart-Config-Kit-normal.sh
```

不熟悉命令行的用户，可以用 WinSCP / Cyberduck / FileZilla 登录路由器，把对应 `.sh` 拖到 `/etc/openclash/overwrite/`，文件名保持和下面启用的模块名一致。

然后回到 **覆写设置** 页面底部的"**脚本槽位 / 覆写模块**"卡片：

1. 点击 **`+`** 新建脚本槽位，名字填成上传后的文件名，例如 `Smart-Config-Kit-smart.sh`
2. 类型保持为本地文件 / file，保存
3. 打开这个槽位右侧开关，同时关闭其它覆写脚本
4. 点击页面底部 **应用**（或保存并应用）

如果 WebUI 已经先建好了同名空槽位，直接用 WinSCP / `scp` 覆盖 `/etc/openclash/overwrite/<槽位名>` 即可，不需要重复新建。

命令行用户也可以用 UCI 注册当前 OpenClash 的覆写模块：

```bash
ssh root@192.168.1.1 "uci add openclash config_overwrite"
ssh root@192.168.1.1 "uci set openclash.@config_overwrite[-1].name='Smart-Config-Kit-smart.sh'"
ssh root@192.168.1.1 "uci set openclash.@config_overwrite[-1].type='file'"
ssh root@192.168.1.1 "uci set openclash.@config_overwrite[-1].enable='1'"
ssh root@192.168.1.1 "uci set openclash.@config_overwrite[-1].order='99'"
ssh root@192.168.1.1 "uci commit openclash"
```

> **二选一**：装的是 Mihomo Smart / Meta Alpha 内核就启用 `OpenClash(mihomo-smart).sh` 对应槽位；装的是普通 Meta 稳定内核就启用 `OpenClash(mihomo).sh` 对应槽位。两份都上传也行，但**只能开一个**。

<img width="1280" height="678" alt="③ .sh 脚本上传位置（覆写设置页面底部 + 号 + 开关）" src="https://github.com/user-attachments/assets/e03460ea-606c-4e1b-b45b-a76bc8158abf" />

#### 兼容：直接粘贴 / 编辑器导入

如果你的路由器和 LuCI 组合保存稳定，也可以在脚本槽位编辑器里直接粘贴整份 `.sh`，或用编辑器右上角的"导入 / 上传"按钮选择本地 `.sh` 文件。

但只要保存时出现 `HTTP error! status: 500`，不要反复粘贴重试，直接改用上面的 `/etc/openclash/overwrite/` 文件系统部署。

### 3.5 多机场订阅合并（三选一）

如果你同时购买了多家机场（例如一家主打香港、一家主打美国、一家做家宽），需要把它们的节点合并到同一份 OpenClash 配置里。

OpenClash 的节点来源是 `.sh` 覆写脚本内 `proxy-providers` 段（通过 heredoc YAML 定义）。以下三种方式均可实现多机场合并。

#### 方式 A：Sub-Store 融合（推荐）

**Sub-Store** 是一个 Mihomo / Surge / Loon 生态的订阅管理工具，可以把你所有机场的订阅链接合并成一个 URL，统一输出。

1. 在桌面端 Mihomo Party / Clash Verge Rev 中安装 Sub-Store 插件
2. 新建「组合订阅」→ 把多个机场 URL 填进去 → 勾选「输出为 Mihomo 格式」
3. 生成一个融合后的 URL（形如 `http://127.0.0.1:19500/api/collection/xxx`）
4. 把这个 URL 填入 `.sh` 脚本 heredoc 中的 `proxy-providers.Subscribe.url`

**优点**：不需要改 `.sh` 脚本结构，一个 URL 搞定一切；支持重命名节点、按正则过滤。

#### 方式 B：在线订阅转换站（零门槛，无需安装任何工具）

如果你不想装任何 App 或插件，可以用第三方 **订阅转换站**。你把多个机场的订阅链接粘贴进去，它会输出一个合并后的 URL。

**这个方案与客户端无关**——转换站在网页上完成，输出的 URL 直接用于所有客户端。

常见转换站（社区维护，任选其一）：
- `https://acl4ssr-sub.github.io`（ACL4SSR 官方前端）
- `https://sub.v1.mk`（Sub-Store 在线版）
- `https://id9.cc`（备用）

操作步骤：
1. 打开上述任一网站
2. 把多家机场的订阅链接粘贴到「订阅链接」输入框（一行一个或用 `|` 分隔）
3. 后端/输出选 **Mihomo（Clash.Meta）**
4. 点击「生成订阅链接」→ 复制输出的新 URL
5. 把新 URL 填入 `.sh` 脚本 heredoc 中的 `proxy-providers.Subscribe.url`

> ⚠️ **隐私提醒**：转换站服务端能看到你提交的所有订阅链接（包括 token），理论上也能解密节点流量特征。**不要在转换站上提交包含敏感信息（如专属专线 IP、企业内部 VPN）的订阅链接**。如果你对隐私有要求，优先用方式 A（Sub-Store 跑在本地）或方式 C（直接改脚本）。

#### 方式 C：在 .sh 脚本内写多个 proxy-providers（无需额外工具）

OpenClash 的覆写脚本使用 heredoc 生成 YAML。你可以直接在 `.sh` 文件的 `cat > "$OVERRIDE_YAML"` 块内添加多个 `proxy-providers`。

找到脚本中 `proxy-providers:` 段，把：

```yaml
proxy-providers:
  Subscribe:
    type: http
    url: 'https://airport1.example.com/sub?token=xxx'
    interval: 86400
    path: ./proxy_providers/subscribe.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置)'
```

改为多机场版本：

```yaml
proxy-providers:
  Airport1:
    type: http
    url: 'https://airport1.example.com/sub?token=xxx'
    interval: 86400
    path: ./proxy_providers/airport1.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置)'

  Airport2:
    type: http
    url: 'https://airport2.example.com/sub?token=yyy'
    interval: 86400
    path: ./proxy_providers/airport2.yaml
    health-check:
      enable: true
      url: 'https://www.gstatic.com/generate_204'
      interval: 300
    exclude-filter: '(?i)(导航网址|距离下次重置|剩余流量|套餐到期|网址导航|官网|订阅|到期|剩余|重置)'
```

**关键机制**：OpenClash 的区域组由 Ruby 脚本动态生成，使用 `use:` 字段引用 proxy-provider 名称。如果新增了 provider，**必须同步更新 `use:` 列表**。

在脚本中搜索各区域组的 `use:` 字段，例如：

```ruby
use: ['Subscribe']
```

改为：

```ruby
use: ['Airport1', 'Airport2']
```

每个区域组都要做同样的修改。

> 💡 方式 A（Sub-Store）没有这个问题——Sub-Store 输出单一 URL，填到一个 provider 即可，`use:` 完全不用动。

---

### 3.6 导入订阅并启动

LuCI → **配置订阅** → 添加订阅链接 → 下载 → **全局设置** 选择该配置 → 启动 OpenClash。

---

## 4. 常见问题

### Q1：我现在不是 Smart 内核，还能用这套规则吗？

可以。直接用 `OpenClash(mihomo).sh` 即可，规则覆盖（385 providers / 975 rules）与 Smart 版完全一致。

### Q2：我后面升级到 Smart 内核，要重做配置吗？

不需要。在 **覆写设置 → 脚本槽位** 里把当前脚本禁用，新建或切换到另一个脚本槽位，保存并应用即可。`.conf` 不用重新导入。

> 如果走的是文件系统部署，把新脚本放到 `/etc/openclash/overwrite/`，再在覆写设置里启用对应槽位；命令行用户更新 `config_overwrite` 段的 `name` / `type=file` / `enable=1` 即可。

### Q3：是否一定要导入 `.conf`？

**是，强烈建议必做。** 推荐流程就是用 `.conf` 一次性把全部 UI 配置敲定，**导完之后不需要再去 LuCI WebUI 上手动勾任何选项**，省心也避免漏项 / 与覆写脚本不一致。

`.conf` 里的 UCI 选项（核心 = Smart / DNS = fake-ip / Sniffer / GeoX / LightGBM 自动更新等 30+ 项）正是覆写脚本默认假设的运行环境；手动一项项配既容易漏，也容易因为 OpenClash 版本差异勾错。除非你非常熟悉 OpenClash 并且坚持手动调，否则请直接导入 `.conf`。

### Q4：为什么 rule-provider 下载代理统一是 `🚫 受限网站`？

仓库基线要求（修复中国大陆网络下规则文件 404 / timeout 拉取失败），与 Clash Party / CMFA 主线对齐。

### Q5：粘贴 `.sh` 后保存提示 `HTTP error! status: 500` 怎么办？

这是 LuCI / OpenClash Web 编辑器保存大文本时的兼容性问题，通常还没进入脚本执行阶段；不代表 `.sh` 内容错，也不代表 mihomo 无法识别规则。

请改用 §3.4 的推荐方式：把 `.sh` 上传到 `/etc/openclash/overwrite/`，然后在覆写设置里启用对应槽位。若仍失败，再提供路由器型号、OpenWrt / LuCI / OpenClash 版本，以及 `logread | grep -Ei 'luci|uhttpd|openclash|content|maximum|POST'` 的输出。

---

## 5. 配套文件

| 文件 | 说明 |
|------|------|
| `OpenClash(mihomo-smart).sh` | 覆写脚本（Smart 内核） |
| `OpenClash(mihomo).sh` | 覆写脚本（Normal 内核） |
| `OpenClash(mihomo).conf` | OpenClash UI 配置快照（一次性导入） |
| `CHANGELOG.md` | 两份脚本的变更日志（Smart 段 + Normal 段） |
