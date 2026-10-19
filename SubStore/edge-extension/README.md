# Sub-Store 自动订阅同步助手（Edge / Chrome）

**首次允许机场网站后，打开已登录仪表盘即可自动提取、匹配并验证订阅，更新本机及可选 Cloudflare 的已有条目。**

支持用户明确允许的 HTTP/HTTPS 域名、IPv4、IPv6 和自托管面板；不以六家测试样本限制范围。浏览器访问权限和扩展内的站点信任同时有效才会同步。当前版本见 `manifest.json`，历史见 [CHANGELOG.md](./CHANGELOG.md)。

## 使用

1. 启动 Clash Party，确保已有相应机场的单条远程订阅；一次性链接来源只使用下节显式允许的本地内容快照条目。
2. 解压扩展包。在 `edge://extensions` / `chrome://extensions` 开启开发人员模式，加载包含 `manifest.json` 的扩展文件夹。
3. 正常打开机场仪表盘并人工登录。首次在该网站打开扩展弹窗，点“允许此网站自动同步”，按浏览器提示允许访问。后台会刷新当前页面开始监听；以后新标签页正常加载即可触发，不需额外按 F5。未曾明确许可的网站仍需这一次允许，原有许可随同目录升级保留。
4. 插件自动识别候选，在各启用目标独立匹配现有条目、验证原始及处理后节点。常规远程条目更新 URL；受控本地快照条目只更新 `content`，不保存一次性链接为远程 URL。云端策略允许的受阻远程源仍使用限期原始快照；其他源由云端正常下载。弹窗分别显示本机与 Cloudflare 结果；部分成功时保留已成功端的结果，核对另一端后再决定是否手动重试。

弹窗用于查看自动进度。端口和手动排查工具在默认折叠的高级选项中，不属于日常使用步骤。默认本机后端 `http://127.0.0.1:38324`，前端 `http://127.0.0.1:14122`；本机端口不同才需修改。

首次许可只针对当前标签页的完整 origin（协议、主机、端口）。即使浏览器曾授予“所有网站”权限，其他网站、历史下拉项和同主机不同端口也不会因此获准写入。高级选项可撤销站点信任；浏览器撤销访问权限后也会停止同步，重新授予浏览器权限不会自动恢复已删除的站点信任。

许可按完整 origin 保存在本机，重开网页或后台重启仍有效；权限查询异常暂停当次访问。换域名或重装需重新许可；升级请在原目录“重新加载”以保留设置。

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

导入仅填入草稿，须“保存全局设置”并授予后端访问权限。JSON 不得含其他设置、订阅或账号。地址存于本机，掩码不等于加密；私人连接文件放在安装目录外，勿提交 Git、打包或公开。

**源更新、发布与手机刷新须分别验收。** 扩展只更新已有 URL 或 `content`，后端仍须生成集合、校验并发布 Gist / Artifact，手机再拉取。高级选项可按条件恢复各端，恢复一端不回滚另一端。

### 一次性链接的受控本地内容快照

一次性链接条目保留 `source: "local"`、`url: ""` 和 `content`，不进入常规远程 URL 匹配，也不把临时链接保存为 remote。

此流程只开放实现内显式允许的站点与订阅身份：机场网站仍需已获信任及浏览器许可，页面品牌须精确匹配唯一的内部名称，目标条目须保持 local、空 URL 和有效旧内容，并满足每源最低节点数。没有开放任意本地条目批量覆盖、模糊名称匹配或 local/remote 类型转换；重复名称、错误来源类型或策略不匹配均停止。

```text
已许可网站的一次性链接
  → 本机临时 remote 预览：严格 noCache / noFlow，无持久 URL 写入
  → 同一轮只拉取一次，original 真实节点在内存共享
  → 本机与 Cloudflare 各自按原 local process 预览、校验
  → 每端独立备份旧 content，只更新 content 并读回全部其他字段
```

本机侧在比较最新配置后只发送 `PATCH {content}`；Cloudflare 使用下节专用受限接口，在串行处理内校验完整配置 revision，再预览、只更新 `content` 并读回。两端保留原 `source`、空 `url`、处理器和组合关系。它们不是跨后端的原子事务，一端成功、一端失败时会分别显示结果；已发送或结果不明的写入不自动重试。

一次性 URL 仅作为本轮临时拉取输入，不写入 Sub-Store 的远程 URL 字段；现有待办仍可能在扩展会话存储短期保留，最长 30 分钟。新拉取的原始节点只由当前任务内存共享，不保存为扩展会话中的原始节点缓存。为支持条件恢复，**旧 `content` 完整备份会保存在扩展本机 `storage.local.backups`**，与旧订阅 URL 备份同属敏感数据；每个订阅及目标地址最多保留三份，总记录上限 64 条，备份保存失败会阻止后续写入。不要公开或导出这些节点备份。

高级选项中的本机/Cloudflare 恢复按钮按对应目标恢复原 `content`；要求当前内容和其他字段仍匹配该目标上次写入结果，配置已变化则拒绝覆盖。正常同步显示“本地快照已更新”或“内容已一致”，恢复显示“旧快照已恢复”。Cloudflare 已保存的 local 内容不使用下节远程快照的 24 小时 TTL，可在本机关闭后继续输出；获取下一份一次性链接并刷新内容仍需本机服务运行，不能称为云端独立拉取一次性源。

原有受阻**远程**来源的 24 小时快照与 120 秒候选窗口保持独立；本地内容更新不会自动修改 Gist / Fusion 发布者或手机已发布副本。需分别验收单源内容、云端处理、集合生成和实际发布路径。

### Cloudflare 下载受阻源的原始快照

部分机场对 Cloudflare 出口返回带 challenge 标记的 HTTP 403，下载网关也可能不可用。若本机可以获取该源，部署者可只为已确认受阻的来源启用原始快照策略，不需要 VPS。它不是修复机场对 Cloudflare 的访问限制，也不让受阻来源获得完全独立的云端刷新能力。

```text
本机单订阅严格 noCache 预览的 original 原始节点
  → 私密受限入口上传该源快照
  → Cloudflare 按原 URL / 配置核对并限期保存
  → 确认 403 challenge 时使用该源原始节点
  → 云端执行自己保存的原 process，再参与集合生成
```

- 云端策略控制来源 allowlist 和每源最低节点数；没有获准的源不能上传或借此降级。上传对象必须是单机场的 `original` 未处理节点，不是本机 `processed` 结果，也不是最终 Fusion 配置。
- 单源 `original` 若混有套餐说明，只剔除名称以 `剩余流量:` / `剩余流量：` 或 `套餐到期:` / `套餐到期：` 开头、且不属于真实节点的记录；全部真实原始节点保留。其他无效记录、设备超限或订阅错误占位仍拒绝，不降低服务端最低节点数；服务端只接收全部由真实节点组成的 `original`。
- 扩展在当前已许可网站的同步流程中，从运行中的本机 Sub-Store 取得严格 `noCache` 原始预览，经既有节点校验后上传。原始节点只在传输期间使用，不写入扩展永久 `storage.local` 或浏览器云同步。
- 快照绑定精确 URL 和订阅配置，有效期为 **24 小时**。新候选 URL 尚未成为云端持久 URL 时，只能在上传后的 **120 秒**候选预览窗口内使用；不能拿某个候选的旧数据验证另一个 URL，或绕过正常预览、PATCH 与写后读回。
- 仅**直连得到已确认的 HTTP 403 challenge**，或**网关 HTTP 530 触发一次直连后又得到确证的 403 challenge**，才回退到有效快照。网关以 HTTP 200 包装上游 403 的情况不在支持范围；普通 403、其他网关错误、其他 HTTP 错误或解析失败不因此变成成功。快照缺失、过期、绑定不一致、节点不足或含错误占位节点时失败关闭，不用残缺结果补齐。
- Cloudflare 独立保存和处理快照；取得有效快照后，云端不需要在每次消费时访问本机。受阻源要刷新到新数据，仍需在本机服务运行时再次执行这一流程。没有受阻且保持健康的来源继续由 Cloudflare 自行拉取，不依赖本机快照。

启用前应分别核对本机原始预览、云端保存后的单源处理结果及过期拒绝行为。云端原有 Gist / Fusion 发布者与客户端已发布副本是另一条链路，快照上传成功不会自行改写发布者或促使手机立即拉取。私密入口、来源策略和节点内容不得写入公共仓库、安装包或诊断截图。

### 已审查 Worker 的专用受限入口

对于本仓库已审查的 Worker wrapper，可使用 [`extension-sync-route.mjs`](../scripts/extension-sync-route.mjs) 与纯源码补丁 [`patch-extension-sync-worker.mjs`](../scripts/patch-extension-sync-worker.mjs) 增加独立扩展连接。部署者通过 secret `SUB_STORE_EXTENSION_BACKEND_PATH` 配置 `/ext-` 后接 64 位小写十六进制随机值的专用前缀；用户导入的 `cloudBackendUrl` 使用 Worker HTTPS origin 加此前缀，不复用客户端 download 链接。旧管理前缀不能通过现有 API 读回时，也不应猜测或公开它。

专用前缀下仅允许以下业务接口及必要的 OPTIONS 预检：

| 方法与路径 | 用途与限制 |
|---|---|
| `GET /api/subs` | 读取现有订阅目录 |
| `GET /api/sub/:name` | 读取单条订阅及写后核对 |
| `POST /api/preview/sub?target=JSON` | 原始与处理后节点预览，JSON 请求须含有效名称与订阅 URL |
| `PATCH /api/sub/:name` | 请求体只能有 `url` 字段；不允许修改处理器等其他字段 |
| `GET /api/source-snapshot/:name` | 仅启用快照模块时提供；查询该源策略及快照可用性、计数和有效期，不返回原始节点或私密订阅 URL |
| `POST /api/source-snapshot/:name` | 请求体仅含 `url`、`expectedUrl`、`original`；按服务端来源策略校验全部真实的单源原始节点、URL、配置绑定、数量与有效期，不修改订阅处理器 |
| `GET /api/local-snapshot/:name` | 仅启用受控本地快照模块时提供；严格原生预览当前 content，返回是否允许、名称、最低节点数、`originalNodes` / `processedNodes` 及当前完整配置 revision |
| `POST /api/local-snapshot/:name` | 严格接受三种独立形状：写入 `{expectedRevision, original}`；恢复 `{expectedRevision, restoreContent}`；仅验证 `{expectedRevision, original, dryRun: true}`。服务端自行 local 预览，仅验证不提交 content 或备份 |

此前缀下的其他路径、方法或 query 被拒绝，不能借此调用删除、设置、集合修改或 Gist 发布接口；Worker 原有入口保留原路由。route 模块按界限检查请求并交给原后端，patcher 只改审查匹配的源码，不生成 secret、不部署或写配置。部署与连接配置须由部署者另行准备；这两个模块不是任意第三方 Worker 的通用安装器。

受控本地快照另由服务端 `SUB_STORE_LOCAL_SNAPSHOT_POLICIES` 指定名称 allowlist 和最低节点数；只允许既有 local 空 URL 条目。revision 绑定完整持久配置（含旧 `content`），写入前不一致返回冲突，不能由客户端指定 `source`、候选 URL 或处理器，也不把专用入口扩大为普通 `PATCH {content}` 管理权限。云端当前内容复核与仅验证均使用该专用入口，通用 remote preview 仍拒绝 local。恢复必须仍通过同一策略、配置版本和节点校验。

## 自动识别与名称匹配

- 在明确的订阅接口中识别 `subscribe_url` / `subscription_url` / `sub_url`；支持 V2Board/XBoard v1、Kitty v3 等路径，但不主动请求机场 API。
- 从订阅复制控件、带订阅标签的输入框及 Clash / sing-box / Hiddify / Surge / Loon 导入链接提取候选。支持有限 open shadow DOM；可见页面控件每三秒检查一次，以捕获延迟赋值，收到明确接口候选后停止。
- 相对订阅锚点按页面 base URI 解析，仍须通过订阅语义与 HTTP(S) 地址检查。账户参数保留字面加号、空格和重复参数差异，不将不同账户静默合并。
- 从站点品牌 meta、标题和有限品牌控件识别机场名，过滤邮箱、URL、长 token 及账号敏感内容。
- 通过各目标的只读 `GET /api/subs` 分别获取现有订阅目录。先比对订阅 URL 的账户参数（忽略 fragment 和明确的客户端格式参数），再比对相同 origin/path；若路径发生变化，则要求同 origin 且名称唯一匹配。
- 多个条目或副本共享地址时，用网页品牌与 Sub-Store 内部名称 / 显示名精确归一匹配。保留 `copy`、个人、工作等账户区分后缀，不做模糊猜测。没有匹配或存在歧义时停止写入，弹窗说明原因。
- 若机场更换订阅 CDN 域名，地址阶段没有候选时，在已明确允许的网站上使用网页品牌与目录名称的唯一精确匹配；随后重新读取该源，确认 URL 仍与匹配目录快照一致，再验证原始和处理后节点。多个同名账户仍停止。
- 受控 local 空 URL 条目走显式站点/名称策略与唯一精确匹配，匹配后使用内容快照流程；该例外不把其他 local 条目加入常规远程匹配。

新授权域名/IP 无须逐家预设；加密响应、closed shadow DOM 或非标准控件仍可能需要适配。六家真实账号与新域名/IP 模拟测试分别记录，模拟不替代登录验收。

## 写入及隐私

本机连接使用扩展 offscreen 隐藏文档内的 localhost iframe，由浏览器自然提供前端 Origin；同步不创建可见的 Sub-Store 标签页。Clash Party 的本机前后端服务仍需运行，浏览器里的 `http://127.0.0.1:14122/` 页面可以关闭。隐藏文档在后台复用，后台重启或连接丢失后重新绑定；已发出且结果不明的 PATCH 不自动重发。Cloudflare 由扩展 service worker 在已获主机权限后直接发送 HTTPS 请求，不需要云端前端标签页。

隐藏传输使用 [`offscreen` / `IFRAME_SCRIPTING`](https://developer.chrome.com/docs/extensions/reference/api/offscreen) 和 runtime Port，权限只增加包内隐藏文档能力，iframe 限于 `127.0.0.1`。帧身份和每轮随机值共同绑定连接；自身本机前后端与已配置云端主机页面均不会作为机场处理。保持 Chrome 111+；恢复优先使用 `runtime.getContexts`，较早版本使用官方 `clients.matchAll` 分支。

常规远程配置只更新现有的一条 HTTP(S) URL；受阻源原始快照走单独的策略受限上传入口。受控 local 快照则只更新 `content`，不修改来源类型、空 URL 或处理器。远程匹配仍要求同 origin 地址证据或唯一品牌名称证据，非空本地合并、多源、fragment 冲突、空节点或设备超限回环告警节点均停止。临时远程预览仅移除 `cacheKey` 并强制新鲜下载；受控一次性抓取使用无持久化的临时 remote 输入，目标处理仍各自使用已保存的 local 配置。

远程写前重新比较配置，仅 `PATCH {url}`，写后独立 GET 核对链接及所有其他字段。本地内容按上述受控流程更新与恢复；两端分别保存旧 URL 或旧 `content` 备份，撤销要求当前状态仍匹配对应目标上次写入结果。本机原生 Sub-Store 不提供原子条件更新接口，比较与 PATCH 间仍有窄并发窗口，应避免同时编辑同一条订阅；Cloudflare 专用 local 入口额外使用串行 revision 检查。

同一文档不同 fetch / XHR 响应中的候选会累计判断；不同账户形成持续歧义，只有新文档才重新开始。验证期间出现新的候选或歧义，会使旧验证失效；写入发送前再次检查，歧义不会排在旧写入之后才生效。已经发送的请求不能由后来才出现的候选或页面变化撤回。

DOM 控件是唯一来源时，页面撤下全部订阅控件会取消尚未发送的写入并清除重试待办；相同链接重新出现后也需重新验证。预渲染页面在真正激活时重新检查站点许可并重放已观察的候选，不需手动刷新。

不读取机场密码、Cookie、登录 token、浏览器保存的账号、剪贴板或整页脚本。现有订阅目录仅在扩展内部内存中用于匹配。待办链接、未确认页面观察状态保存在会话存储；成功/失败诊断只保留安全名称、origin、时间和计数，不显示云端私密路径或原始异常。本机扩展备份可能含旧订阅 URL 或旧 `content` 中的完整私密节点，勿导出或公开；不使用浏览器云同步，订阅数据只发往用户启用的 Sub-Store 后端。

插件不自动登录、重置机场订阅、解除超限或增加设备额度。页面关闭后不巡检机场；页面存活且后端离线时，会话候选最多保留30分钟。目录读取前的本机通信初始化失败会有限自动重试，不对可能已经执行的 PATCH 自动重试。

关闭或替换文档会使该文档尚未写入的候选失效，离开到浏览器内部页、本机 Sub-Store 或其他不受监听页面也如此；发送前检查实际当前文档及权限。再次正常打开仪表盘时重新捕获。已发送的写入若遇到后续页面变化，保留条件备份并停止旧结果覆盖新的页面状态。初始化失败会清理本次创建且尚未发送请求的隐藏文档；在途请求保留原上下文，连接失败后通过读回核对结果。

## 开发与验证

Node.js 22：

```bash
node SubStore/edge-extension/build.mjs
node SubStore/edge-extension/build.mjs --check
node --test SubStore/edge-extension/*.test.mjs SubStore/edge-extension/*.test.cjs
```

只改提取器源码 `extractors.js`，再构建 MAIN / ISOLATED 入口；禁止手改 bundle。

### 生成可安装目录

[`package.mjs`](./package.mjs) 从 Git 已提交版本收集 manifest、导入依赖及动态 bundle，生成仅含运行文件的安装目录。`--out` 必须是绝对路径，`--ref` 默认 `HEAD`，不会读取未提交工作区作为发布源；需要其他已审查提交时显式指定 `--ref <commit>`。Windows 通用示例：

```powershell
node SubStore/edge-extension/package.mjs --out "C:\Extensions\SubStore-AutoSync"
node SubStore/edge-extension/package.mjs --out "C:\Extensions\SubStore-AutoSync" --check
```

安装目录含 17 个运行文件，无需 Node、测试或私人连接 JSON。`--check` 仅检查 manifest、依赖与文件集合，不证明与提交逐字节一致。升级会备份并替换文件；请使用固定目录，检查后手动 Reload，必要时刷新机场页面。打包不自动安装或修改浏览器 profile。

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

[Chrome 扩展存储](https://developer.chrome.com/docs/extensions/reference/api/storage)区分本机持久设置与会话数据；原始快照不属于扩展永久设置。[Cloudflare KV 过期键](https://developers.cloudflare.com/kv/api/write-key-value-pairs/#expiring-keys)提供服务端限期保存，应用仍须按快照时间与绑定条件决定是否允许使用，不能把“KV 中尚有数据”当作新鲜性证明。

[Chrome 预渲染激活](https://developer.chrome.com/docs/web-platform/prerender-pages#detect-prerender-in-javascript)使用 document 的 `prerenderingchange` 事件；后台仍只接纳 active 的顶层文档。

[Sub-Store 单条 PATCH](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/restful/subscriptions.js#L296-L349)、[original / processed 预览](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/restful/preview.js#L79-L174)、[fragment 和缓存](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/utils/download.js#L133-L289)。

[Sub-Store 订阅概览](https://sub-store-org.github.io/doc/subscription/overview)与[本地内容](https://sub-store-org.github.io/doc/subscription/local)区分远程 URL 和持久节点内容；[链接参数](https://sub-store-org.github.io/doc/reference/link-params)说明 `url` / `content` 的输入用途。一次临时预览不等于把该链接保存为可持续更新的远程订阅。
