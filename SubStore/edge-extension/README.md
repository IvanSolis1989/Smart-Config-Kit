# Sub-Store 自动订阅同步助手（Edge / Chrome）

**首次允许机场网站后，正常打开已登录的仪表盘，扩展自动提取订阅、识别机场与 Sub-Store 名称，分别验证并更新本机与可选独立 Cloudflare Sub-Store 的对应条目。日常无需复制链接、选择名称、保存映射或点击同步。**

支持用户明确允许的 HTTP/HTTPS 域名、IPv4、IPv6 和自托管面板；不以六家测试样本限制范围。浏览器访问权限和扩展内的站点信任同时有效才会同步。当前版本见 `manifest.json`，历史见 [CHANGELOG.md](./CHANGELOG.md)。

## 使用

1. 启动 Clash Party，确保已有相应机场的单条远程订阅。
2. 解压扩展包。在 `edge://extensions` / `chrome://extensions` 开启开发人员模式，加载包含 `manifest.json` 的扩展文件夹。
3. 正常打开机场仪表盘并人工登录。首次在该网站打开扩展弹窗，点“允许此网站自动同步”，按浏览器提示允许访问。后台会刷新当前页面开始监听；以后新标签页正常加载即可触发，不需额外按 F5。升级到本版后，历史识别记录仍需这一次明确许可。
4. 插件自动识别候选，在各启用目标独立匹配现有条目、验证原始及处理后节点、备份旧链接并只更新 URL。弹窗分别显示本机与 Cloudflare 结果；部分成功时保留已成功端的结果，核对另一端后再决定是否手动重试。

弹窗用于查看自动进度。端口和手动排查工具在默认折叠的高级选项中，不属于日常使用步骤。默认本机后端 `http://127.0.0.1:38324`，前端 `http://127.0.0.1:14122`；本机端口不同才需修改。

首次许可只针对当前标签页的完整 origin（协议、主机、端口）。即使浏览器曾授予“所有网站”权限，其他网站、历史下拉项和同主机不同端口也不会因此获准写入。高级选项可撤销站点信任；浏览器撤销访问权限后也会停止同步，重新授予浏览器权限不会自动恢复已删除的站点信任。

同一完整 origin 的许可保存在本机扩展存储中，关闭网页或后台重启不需再次允许。浏览器权限查询异常会暂停当次访问并保留许可；换域名或移除重装扩展仍需重新允许。升级请使用同一安装目录并点击“重新加载”，保留原扩展身份和设置。

## 同时连接独立 Cloudflare Sub-Store

默认仅启用本机连接，Cloudflare 开关关闭、地址为空。全局自动同步开关同时控制两端；开启 Cloudflare 后，本机与云端分别读取自己的目录并匹配已有订阅，不把本机整份配置覆盖到云端，也不自动创建缺失条目。云端须兼容原版 Sub-Store 的目录、单条订阅、原始/处理后预览及 PATCH API；不是所有同名 Workers 项目都兼容。

1. 在“高级设置与排查”打开“同时同步独立 Cloudflare Sub-Store”。
2. 填入完整 HTTPS 后端地址，包含私密管理前缀，例如 `https://substore.example.invalid/private-prefix`；不填客户端 download 链接，不附加 query 或 fragment。无需填写云端前端地址。
3. 点击“保存全局设置”，允许浏览器访问该云端主机。此权限只用于后端请求，不会将云端主机加入机场信任，也不会让该主机页面成为机场监听目标。机场网站仍须单独许可。
4. 正常打开已允许的机场仪表盘，查看两端各自的匹配名称、节点计数和结果。一个目标不匹配、离线或验证失败不会撤销另一目标的成功；PATCH 已发送或结果不明时不自动重试该目标，先核对实际配置。

也可点击“导入连接配置”选择本地 JSON 文件，只接受下面两个字段且 `cloudEnabled` 必须为 `true`：

```json
{
  "cloudEnabled": true,
  "cloudBackendUrl": "https://substore.example.invalid/private-prefix"
}
```

导入只将内容放入草稿；仍需点击“保存全局设置”完成相同的地址验证和浏览器权限申请。文件不得含其他设置、订阅数据或账号字段。私密地址使用密码样式输入并保存在本机扩展存储；掩码不是加密，不要公开连接配置、管理前缀或扩展存储。私人连接 JSON 应保存在安装目录之外，不提交 Git、不加入 ZIP；公共安装包没有预置个人云地址。

**链接更新不等于订阅发布或手机立即刷新。** 扩展只修改两个后端已有记录的源 URL；云端集合重新生成、完整性校验、Gist / Artifact 发布是后端的独立流程，手机仍按自身订阅刷新时机取回已发布内容。若客户端使用 Gist 或 Worker 保存副本，请分别检查该发布路径；不能用扩展的“已更新”代替发布验收。高级选项提供本机和 Cloudflare 各自的条件恢复按钮，恢复一端不回滚另一端。

### 已审查 Worker 的专用受限入口

对于本仓库已审查的 Worker wrapper，可使用 [`extension-sync-route.mjs`](../scripts/extension-sync-route.mjs) 与纯源码补丁 [`patch-extension-sync-worker.mjs`](../scripts/patch-extension-sync-worker.mjs) 增加独立扩展连接。部署者通过 secret `SUB_STORE_EXTENSION_BACKEND_PATH` 配置 `/ext-` 后接 64 位小写十六进制随机值的专用前缀；用户导入的 `cloudBackendUrl` 使用 Worker HTTPS origin 加此前缀，不复用客户端 download 链接。旧管理前缀不能通过现有 API 读回时，也不应猜测或公开它。

专用前缀下仅允许以下业务接口及必要的 OPTIONS 预检：

| 方法与路径 | 用途与限制 |
|---|---|
| `GET /api/subs` | 读取现有订阅目录 |
| `GET /api/sub/:name` | 读取单条订阅及写后核对 |
| `POST /api/preview/sub?target=JSON` | 原始与处理后节点预览，JSON 请求须含有效名称与订阅 URL |
| `PATCH /api/sub/:name` | 请求体只能有 `url` 字段；不允许修改处理器等其他字段 |

此前缀下的其他路径、方法或 query 被拒绝，不能借此调用删除、设置、集合修改或 Gist 发布接口；Worker 原有入口保留原路由。route 模块按界限检查请求并交给原后端，patcher 只改审查匹配的源码，不生成 secret、不部署或写配置。部署与连接配置须由部署者另行准备；这两个模块不是任意第三方 Worker 的通用安装器。

## 自动识别与名称匹配

- 在明确的订阅接口中识别 `subscribe_url` / `subscription_url` / `sub_url`；支持 V2Board/XBoard v1、Kitty v3 等路径，但不主动请求机场 API。
- 从订阅复制控件、带订阅标签的输入框及 Clash / sing-box / Hiddify / Surge / Loon 导入链接提取候选。支持有限 open shadow DOM；可见页面控件每三秒检查一次，以捕获延迟赋值，收到明确接口候选后停止。
- 相对订阅锚点按页面 base URI 解析，仍须通过订阅语义与 HTTP(S) 地址检查。账户参数保留字面加号、空格和重复参数差异，不将不同账户静默合并。
- 从站点品牌 meta、标题和有限品牌控件识别机场名，过滤邮箱、URL、长 token 及账号敏感内容。
- 通过各目标的只读 `GET /api/subs` 分别获取现有订阅目录。先比对订阅 URL 的账户参数（忽略 fragment 和明确的客户端格式参数），再比对相同 origin/path；若路径发生变化，则要求同 origin 且名称唯一匹配。
- 多个条目或副本共享地址时，用网页品牌与 Sub-Store 内部名称 / 显示名精确归一匹配。保留 `copy`、个人、工作等账户区分后缀，不做模糊猜测。没有匹配或存在歧义时停止写入，弹窗说明原因。
- 若机场更换订阅 CDN 域名，地址阶段没有候选时，在已明确允许的网站上使用网页品牌与目录名称的唯一精确匹配；随后重新读取该源，确认 URL 仍与匹配目录快照一致，再验证原始和处理后节点。多个同名账户仍停止。

因此可以适配新的授权域名或 IP，而不必逐家添加预设。自定义加密响应、closed shadow DOM 或非标准控件仍可能需要新增提取适配；不能承诺覆盖所有网站。六家真实账号验收与新域名/IP模拟验收分别记录，模拟通过不能代替真实登录测试。

## 写入及隐私

本机连接保留一个非活动的 Sub-Store 前端标签页，由浏览器的正常前端 Origin 完成通信。Cloudflare 由扩展 service worker 在已获主机权限后直接发送 HTTPS 请求，不需要云端前端标签页。不改 Origin、CORS、安装包、注册表或系统服务；自身本机前后端与已配置云端主机页面均不会作为机场处理。

只更新现有的一条远程 HTTP(S) URL。同 origin 地址匹配或唯一品牌名称匹配通过后才允许写入；跨域必须由唯一品牌名称证据放行。非空本地合并、多源、fragment 冲突、空节点或设备超限回环告警节点均停止。临时预览保留 UA、代理和处理步骤，仅移除 `cacheKey` 并强制新鲜下载。

写前重新比较配置，仅 `PATCH {url}`，写后独立 GET 核对链接及所有其他字段。两端分别保存旧链接备份；撤销要求当前链接与其他字段仍匹配对应目标上次写入结果。Sub-Store 不提供原子条件更新接口，比较与 PATCH 间仍有窄并发窗口，应避免同时编辑同一条订阅。

同一文档不同 fetch / XHR 响应中的候选会累计判断；不同账户形成持续歧义，只有新文档才重新开始。验证期间出现新的候选或歧义，会使旧验证失效；写入发送前再次检查，歧义不会排在旧写入之后才生效。已经发送的请求不能由后来才出现的候选或页面变化撤回。

DOM 控件是唯一来源时，页面撤下全部订阅控件会取消尚未发送的写入并清除重试待办；相同链接重新出现后也需重新验证。预渲染页面在真正激活时重新检查站点许可并重放已观察的候选，不需手动刷新。

不读取机场密码、Cookie、登录 token、浏览器保存的账号、剪贴板或整页脚本。现有订阅目录仅在扩展内部内存中用于匹配。待办链接、未确认页面观察状态保存在会话存储；成功/失败诊断只保留安全名称、origin、时间和计数，不显示云端私密路径或原始异常。旧链接备份在本机扩展存储中含私密订阅 URL，勿导出或公开；不使用浏览器云同步，订阅数据只发往用户启用的 Sub-Store 后端。

插件不自动登录、重置机场订阅、解除超限或增加设备额度。页面关闭后不巡检机场；页面存活且后端离线时，会话候选最多保留30分钟。目录读取前的本机通信初始化失败会有限自动重试，不对可能已经执行的 PATCH 自动重试。

关闭或替换文档会使该文档尚未写入的候选失效，离开到浏览器内部页、本机 Sub-Store 或其他不受监听页面也如此；发送前检查实际当前文档及权限。再次正常打开仪表盘时重新捕获。已发送的写入若遇到后续页面变化，保留条件备份并停止旧结果覆盖新的页面状态。初始化失败只清理扩展新建且尚未发送请求的中转页，不关闭用户已有页面或可能承载在途请求的页面。

## 开发与验证

Node.js 22：

```bash
node SubStore/edge-extension/build.mjs
node SubStore/edge-extension/build.mjs --check
node --test SubStore/edge-extension/*.test.mjs SubStore/edge-extension/*.test.cjs
```

`extractors.js` 是提取器唯一源码。构建器生成独立的 MAIN / ISOLATED 入口，避免 Edge 对跨 world 的相同文件 URL 去重；禁止手工修改 bundle。

### 生成可安装目录

[`package.mjs`](./package.mjs) 从 Git 已提交版本收集 manifest、导入依赖及动态 bundle，生成仅含运行文件的安装目录。`--out` 必须是绝对路径，`--ref` 默认 `HEAD`，不会读取未提交工作区作为发布源；需要其他已审查提交时显式指定 `--ref <commit>`。Windows 通用示例：

```powershell
node SubStore/edge-extension/package.mjs --out "C:\Extensions\SubStore-AutoSync"
node SubStore/edge-extension/package.mjs --out "C:\Extensions\SubStore-AutoSync" --check
```

当前最小安装目录包含 13 个运行文件，不需要 Node、测试、构建源码或私人连接 JSON。`--check` 只读检查输出 manifest、运行依赖和文件集合；它不重新打包，也不证明目录与指定 Git 提交逐字节一致。更新现有同名扩展目录时会备份被替换文件，再逐文件替换；完成检查后由用户在扩展管理页手动 Reload，必要时刷新机场页面。使用固定、不含版本号的目录，避免每次升级另建加载位置；不要将私人连接配置放入该目录。打包命令不会自动安装扩展或修改浏览器 profile。

### 隔离浏览器验证

真实浏览器测试需要 Playwright 和已安装的 Chromium/Edge：

```bash
npm install --ignore-scripts --no-save --no-package-lock playwright@1.62.1
node SubStore/edge-extension/browser-e2e.mjs
```

可用 `PLAYWRIGHT_MODULE_PATH` 指定 Playwright 模块路径，`BROWSER_EXECUTABLE` 指定浏览器。测试创建独立无账号 profile、随机端口的假前后端和虚构面板，阻止外网，不连接现有浏览器或真实 Sub-Store。验证完成首次站点许可之后，不打开弹窗、不按 F5、不点按钮时的提取、匹配、自然 Origin 通信、只写 URL 和读回；另测未信任页面、歧义及无效节点停止。隔离测试副本预授虚构域名权限并显式设置可信站点；不将此设置带入发布包，也不以模拟浏览器权限请求代替真实账号验收。

本目录是独立辅助工具，不改变规则源、分流、DNS 或客户端产物版本。

## 官方接口依据

[Chrome content scripts 的两个 world](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)、[内容脚本与页面通信](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)、[站点权限](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)、[Edge 扩展兼容](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension)。

[MessageSender.documentId](https://developer.chrome.com/docs/extensions/reference/api/runtime#type-MessageSender) 用于区分文档；[tabs.onRemoved](https://developer.chrome.com/docs/extensions/reference/api/tabs#event-onRemoved) 使已关闭页面的候选失效。[URL 表单解码](https://url.spec.whatwg.org/#urlencoded-parsing)会将字面 `+` 转为空格，账户身份比较使用保留此差异的查询解析；[文档基准地址](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#document-base-url)用于相对锚点解析。

[permissions.request / contains / onRemoved](https://developer.chrome.com/docs/extensions/reference/api/permissions) 分别用于点击时申请、发送前检查和撤销处理；[scripting.registerContentScripts](https://developer.chrome.com/docs/extensions/reference/api/scripting#method-registerContentScripts) 只为明确允许的站点注册监听。[Chrome match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns) 的主机权限范围与扩展按完整 origin 保存的站点信任分开检查。

[扩展跨源网络请求](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)说明扩展 service worker 使用主机权限访问远程后端；后端访问许可不等于机场页面信任。[Edge 解压安装与 Reload](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/extension-sideloading)用于手动安装和原目录升级。

[Chrome 预渲染激活](https://developer.chrome.com/docs/web-platform/prerender-pages#detect-prerender-in-javascript)使用 document 的 `prerenderingchange` 事件；后台仍只接纳 active 的顶层文档。

[Sub-Store 单条 PATCH](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/restful/subscriptions.js#L296-L349)、[original / processed 预览](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/restful/preview.js#L79-L174)、[fragment 和缓存](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/utils/download.js#L133-L289)。
