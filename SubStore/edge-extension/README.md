# Sub-Store 自动订阅同步助手（Edge / Chrome）

**首次允许机场网站后，正常打开已登录的仪表盘，扩展自动提取订阅、识别机场与 Sub-Store 名称，验证后填入对应条目。日常无需复制链接、选择名称、保存映射或点击同步。**

支持用户明确允许的 HTTP/HTTPS 域名、IPv4、IPv6 和自托管面板；不以六家测试样本限制范围。浏览器访问权限和扩展内的站点信任同时有效才会同步。当前版本见 `manifest.json`，历史见 [CHANGELOG.md](./CHANGELOG.md)。

## 使用

1. 启动 Clash Party，确保已有相应机场的单条远程订阅。
2. 解压扩展包。在 `edge://extensions` / `chrome://extensions` 开启开发人员模式，加载包含 `manifest.json` 的扩展文件夹。
3. 正常打开机场仪表盘并人工登录。首次在该网站打开扩展弹窗，点“允许此网站自动同步”，按浏览器提示允许访问。后台会刷新当前页面开始监听；以后新标签页正常加载即可触发，不需额外按 F5。升级到本版后，历史识别记录仍需这一次明确许可。
4. 插件自动识别候选、匹配现有条目、验证原始及处理后节点、备份旧链接并只更新 URL。成功徽标 `OK`；客户端下次刷新订阅时取得新节点。

弹窗用于查看自动进度。端口和手动排查工具在默认折叠的高级选项中，不属于日常使用步骤。默认本机后端 `http://127.0.0.1:38324`，前端 `http://127.0.0.1:14122`；本机端口不同才需修改。

首次许可只针对当前标签页的完整 origin（协议、主机、端口）。即使浏览器曾授予“所有网站”权限，其他网站、历史下拉项和同主机不同端口也不会因此获准写入。高级选项可撤销站点信任；浏览器撤销访问权限后也会停止同步，重新授予浏览器权限不会自动恢复已删除的站点信任。

## 自动识别与名称匹配

- 在明确的订阅接口中识别 `subscribe_url` / `subscription_url` / `sub_url`；支持 V2Board/XBoard v1、Kitty v3 等路径，但不主动请求机场 API。
- 从订阅复制控件、带订阅标签的输入框及 Clash / sing-box / Hiddify / Surge / Loon 导入链接提取候选。支持有限 open shadow DOM；可见页面控件每三秒检查一次，以捕获延迟赋值，收到明确接口候选后停止。
- 相对订阅锚点按页面 base URI 解析，仍须通过订阅语义与 HTTP(S) 地址检查。账户参数保留字面加号、空格和重复参数差异，不将不同账户静默合并。
- 从站点品牌 meta、标题和有限品牌控件识别机场名，过滤邮箱、URL、长 token 及账号敏感内容。
- 通过本机只读 `GET /api/subs` 获取现有订阅目录。先比对订阅 URL 的账户参数（忽略 fragment 和明确的客户端格式参数），再比对相同 origin/path；若路径发生变化，则要求同 origin 且名称唯一匹配。
- 多个条目或副本共享地址时，用网页品牌与 Sub-Store 内部名称 / 显示名精确归一匹配。保留 `copy`、个人、工作等账户区分后缀，不做模糊猜测。没有匹配或存在歧义时停止写入，弹窗说明原因。
- 若机场更换订阅 CDN 域名，地址阶段没有候选时，在已明确允许的网站上使用网页品牌与目录名称的唯一精确匹配；随后重新读取该源，确认 URL 仍与匹配目录快照一致，再验证原始和处理后节点。多个同名账户仍停止。

因此可以适配新的授权域名或 IP，而不必逐家添加预设。自定义加密响应、closed shadow DOM 或非标准控件仍可能需要新增提取适配；不能承诺覆盖所有网站。六家真实账号验收与新域名/IP模拟验收分别记录，模拟通过不能代替真实登录测试。

## 写入及隐私

扩展保留一个非活动的本机 Sub-Store 前端标签页，由浏览器的正常前端 Origin 完成通信，不改 Origin、CORS、安装包、注册表或系统服务。自身前后端页面不会作为机场处理。

只更新现有的一条远程 HTTP(S) URL。同 origin 地址匹配或唯一品牌名称匹配通过后才允许写入；跨域必须由唯一品牌名称证据放行。非空本地合并、多源、fragment 冲突、空节点或设备超限回环告警节点均停止。临时预览保留 UA、代理和处理步骤，仅移除 `cacheKey` 并强制新鲜下载。

写前重新比较配置，仅 `PATCH {url}`，写后独立 GET 核对链接及所有其他字段。每条订阅保留最近三次本机旧链接；撤销要求当前链接与其他字段仍匹配上次写入结果。Sub-Store 不提供原子条件更新接口，比较与 PATCH 间仍有窄并发窗口，应避免同时编辑同一条订阅。

同一文档不同 fetch / XHR 响应中的候选会累计判断；不同账户形成持续歧义，只有新文档才重新开始。验证期间出现新的候选或歧义，会使旧验证失效；写入发送前再次检查，歧义不会排在旧写入之后才生效。已经发送的请求不能由后来才出现的候选或页面变化撤回。

不读取密码、Cookie、登录 token、浏览器保存的账号、剪贴板或整页脚本。现有订阅目录仅在扩展内部内存中用于匹配。待办链接、未确认页面观察状态保存在会话存储；成功/失败诊断只保留安全名称、origin、时间和计数。旧链接备份在本机扩展存储中含私密订阅 URL，勿导出或公开；不使用云同步或上传服务。

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

[Sub-Store 单条 PATCH](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/restful/subscriptions.js#L296-L349)、[original / processed 预览](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/restful/preview.js#L79-L174)、[fragment 和缓存](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/utils/download.js#L133-L289)。
