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
| `OpenClash(mihomo-smart).sh` | **Smart 内核**覆写脚本（`type: smart` + LightGBM） | 上传到路由器，在 **覆写设置 → 脚本槽位** 里粘贴或导入内容并启用 |
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
| 业务组数量 | 25 | 25 |
| 区域组数量 | 9 | 9 |
| DNS / Sniffer / Rule-Providers | 完全一致 | 完全一致 |

一句话：**想要 ML 自动择优就选 Smart；只想稳定跑在非 Smart 内核就选 Normal。**

---

## 3. 部署步骤

### 3.1 先装好 OpenClash

参考官方文档：<https://github.com/vernesong/OpenClash/wiki>

### 3.2 进入「覆写设置」页面

LuCI → **服务 → OpenClash → 覆写设置（Overwrite Settings）**。

后续三步都在这一页里完成：导入 `.conf`（§3.3）→ 上传 `.sh` 并启用（§3.4）。

<img width="1280" height="678" alt="① 覆写设置页面入口" src="https://github.com/user-attachments/assets/3f7f16a8-f01c-4f7d-ad17-338140088a9a" />

### 3.3 导入 `.conf`（**必做**，一次性灌入全部 UI 选项）

在覆写设置页面里找到 **配置文件上传** 入口：

1. 点击 **上传** / **浏览**，选择仓库里的 `OpenClash/OpenClash(mihomo).conf`
2. 点击 **保存并应用**

这一步会把核心类型 = Smart、DNS = fake-ip、Sniffer、GeoX / LightGBM 自动更新等 30+ 项推荐选项一次性写入 OpenClash —— **导完之后你完全不用再去 LuCI WebUI 上勾任何东西**，所有 UI 上的配置都已经被 `.conf` 一次性敲定。

> `.conf` 是 OpenClash 的设置快照（UCI 格式），不是常驻在路由器文件系统里的文件 —— 上传一次就完事。

<img width="1280" height="678" alt="② .conf 上传位置（在覆写设置页面里）" src="https://github.com/user-attachments/assets/3a204b9e-ccc8-4b1f-8ed9-3dd1c1e66e7b" />

### 3.4 把 `.sh` 覆写脚本上传到路由器并启用

回到覆写设置页面，在底部有一排"**脚本槽位**"卡片（`default` / 已存在的脚本 / **`+`** 新建按钮），每张卡片右侧都有一个开关。

1. 点击最左边的 **`+`** 卡片（新建脚本槽位）
2. 在弹出的编辑器里：
   - **方式 A（最简单）**：把仓库里的 `OpenClash/OpenClash(mihomo-smart).sh`（或 `OpenClash(mihomo).sh`）整份内容**复制粘贴**进编辑器
   - **方式 B**：用编辑器右上角的"导入 / 上传"按钮，选择本地的 `.sh` 文件
3. 给这个槽位起个名字（比如 `clash-smart` / `clash-normal`），**保存**
4. 在底部卡片列表里找到刚保存的脚本，把右侧开关拨到 **开**（同时把其他覆写脚本的开关**关掉**，OpenClash 一次只用一份生效的覆写）
5. 点击页面底部 **应用**（或保存并应用）

> 脚本槽位保存并启用后，OpenClash 会自动通过 UCI 注册此脚本（`custom_overwrite_path` + `enable_custom_overwrite=1`），**不需要再额外填任何路径**。

> **二选一**：装的是 Mihomo Smart / Meta Alpha 内核就上 `OpenClash(mihomo-smart).sh`；装的是普通 Meta 稳定内核就上 `OpenClash(mihomo).sh`。两份都上传也行，但**只能开一个**。

<img width="1280" height="678" alt="③ .sh 脚本上传位置（覆写设置页面底部 + 号 + 开关）" src="https://github.com/user-attachments/assets/e03460ea-606c-4e1b-b45b-a76bc8158abf" />

#### 备选：用命令行 `scp` 上传 + UCI 注册（高级用户 / 多台路由器批量部署）

如果你更习惯命令行，或者要批量同步多台路由器：

```bash
# 1) 把脚本 scp 到路由器
scp 'OpenClash/OpenClash(mihomo-smart).sh' root@192.168.1.1:/etc/openclash/
scp 'OpenClash/OpenClash(mihomo).sh'       root@192.168.1.1:/etc/openclash/
ssh root@192.168.1.1 "chmod +x '/etc/openclash/OpenClash(mihomo-smart).sh' '/etc/openclash/OpenClash(mihomo).sh'"

# 2) 通过 UCI 注册脚本路径（等效于 Web 槽位的效果）
ssh root@192.168.1.1 "uci set openclash.config.custom_overwrite_path='/etc/openclash/OpenClash(mihomo-smart).sh'"
ssh root@192.168.1.1 "uci set openclash.config.enable_custom_overwrite='1'"
ssh root@192.168.1.1 "uci commit openclash"
```

不熟悉命令行的也可以用 WinSCP / Cyberduck / FileZilla 拖拽到 `/etc/openclash/`，再 SSH 进去执行 UCI 注册命令。

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

> 如果走的是 `scp` + UCI 部署，则把 `custom_overwrite_path` 的值改为新脚本的路径：`uci set openclash.config.custom_overwrite_path='/etc/openclash/OpenClash(mihomo-smart).sh' && uci commit openclash`。

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
