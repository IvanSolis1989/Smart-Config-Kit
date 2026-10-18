# Sub-Store 自动订阅同步助手（Edge / Chrome）

**打开已登录的机场仪表盘，扩展自动提取订阅、识别机场与 Sub-Store 名称，验证后填入对应条目。无需复制链接、选择名称、保存映射或点击同步。**

识别范围由浏览器授予的站点权限决定，支持 HTTP/HTTPS 域名、IPv4、IPv6 和自托管面板；不以六家测试样本限制范围。当前版本见 `manifest.json`，历史见 [CHANGELOG.md](./CHANGELOG.md)。

## 使用

1. 启动 Clash Party，确保已有相应机场的单条远程订阅。
2. 解压扩展包。在 `edge://extensions` / `chrome://extensions` 开启开发人员模式，加载包含 `manifest.json` 的扩展文件夹。按浏览器提示授予所需网站访问权限；可在浏览器中限制站点访问范围。
3. 正常打开机场仪表盘并人工登录。新标签页的正常加载即可触发，不需额外按 F5。扩展更新后，之前已打开的页面需重新打开或刷新一次。
4. 插件自动识别候选、匹配现有条目、验证原始及处理后节点、备份旧链接并只更新 URL。成功徽标 `OK`；客户端下次刷新订阅时取得新节点。

弹窗用于查看自动进度。端口和手动排查工具在默认折叠的高级选项中，不属于日常使用步骤。默认本机后端 `http://127.0.0.1:38324`，前端 `http://127.0.0.1:14122`；本机端口不同才需修改。

## 自动识别与名称匹配

- 在明确的订阅接口中识别 `subscribe_url` / `subscription_url` / `sub_url`；支持 V2Board/XBoard v1、Kitty v3 等路径，但不主动请求机场 API。
- 从订阅复制控件、带订阅标签的输入框及 Clash / sing-box / Hiddify / Surge / Loon 导入链接提取候选。支持有限 open shadow DOM；可见页面控件每三秒检查一次，以捕获延迟赋值，收到明确接口候选后停止。
- 从站点品牌 meta、标题和有限品牌控件识别机场名，过滤邮箱、URL、长 token 及账号敏感内容。
- 通过本机只读 `GET /api/subs` 获取现有订阅目录。先比对订阅 URL 的账户参数（忽略 fragment 和明确的客户端格式参数），再比对相同 origin/path；若路径发生变化，则要求同 origin 且名称唯一匹配。
- 多个条目或副本共享地址时，用网页品牌与 Sub-Store 内部名称 / 显示名精确归一匹配。保留 `copy`、个人、工作等账户区分后缀，不做模糊猜测。没有匹配或存在歧义时停止写入，弹窗说明原因。
- 若机场更换订阅 CDN 域名，地址阶段没有候选时，允许网页品牌与目录名称的唯一精确匹配；随后重新读取该源，确认 URL 仍与匹配目录快照一致，再验证原始和处理后节点。多个同名账户仍停止。

因此可以适配新的授权域名或 IP，而不必逐家添加预设。自定义加密响应、closed shadow DOM 或非标准控件仍可能需要新增提取适配；不能承诺覆盖所有网站。六家真实账号验收与新域名/IP模拟验收分别记录，模拟通过不能代替真实登录测试。

## 写入及隐私

扩展保留一个非活动的本机 Sub-Store 前端标签页，由浏览器的正常前端 Origin 完成通信，不改 Origin、CORS、安装包、注册表或系统服务。自身前后端页面不会作为机场处理。

只更新现有的一条远程 HTTP(S) URL。同 origin 地址匹配或唯一品牌名称匹配通过后才允许写入；跨域必须由唯一品牌名称证据放行。非空本地合并、多源、fragment 冲突、空节点或设备超限回环告警节点均停止。临时预览保留 UA、代理和处理步骤，仅移除 `cacheKey` 并强制新鲜下载。

写前重新比较配置，仅 `PATCH {url}`，写后独立 GET 核对链接及所有其他字段。每条订阅保留最近三次本机旧链接；撤销要求当前链接与其他字段仍匹配上次写入结果。Sub-Store 不提供原子条件更新接口，比较与 PATCH 间仍有窄并发窗口，应避免同时编辑同一条订阅。

不读取密码、Cookie、登录 token、浏览器保存的账号、剪贴板或整页脚本。现有订阅目录仅在扩展内部内存中用于匹配。待办链接、未确认页面观察状态保存在会话存储；成功/失败诊断只保留安全名称、origin、时间和计数。旧链接备份在本机扩展存储中含私密订阅 URL，勿导出或公开；不使用云同步或上传服务。

插件不自动登录、重置机场订阅、解除超限或增加设备额度。页面关闭后不巡检机场；后端离线时会话候选保留30分钟，期间重开页面可自动重试。目录读取前的本机通信初始化失败会有限自动重试，不对可能已经执行的 PATCH 自动重试。

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

可用 `PLAYWRIGHT_MODULE_PATH` 指定 Playwright 模块路径，`BROWSER_EXECUTABLE` 指定浏览器。测试创建独立无账号 profile、随机端口的假前后端和虚构面板，阻止外网，不连接现有浏览器或真实 Sub-Store。验证不打开弹窗、不按 F5、不点按钮时的提取、匹配、自然 Origin 通信、只写 URL 和读回；另测歧义及无效节点停止。

本目录是独立辅助工具，不改变规则源、分流、DNS 或客户端产物版本。

## 官方接口依据

[Chrome content scripts 的两个 world](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)、[内容脚本与页面通信](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)、[站点权限](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)、[Edge 扩展兼容](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension)。

[Sub-Store 单条 PATCH](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/restful/subscriptions.js#L296-L349)、[original / processed 预览](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/restful/preview.js#L79-L174)、[fragment 和缓存](https://github.com/sub-store-org/Sub-Store/blob/832d3a0412bf92e79b46d6610217117010c589ec/backend/src/utils/download.js#L133-L289)。
