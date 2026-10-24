# Karing、短目录与 README 发布状态

目标：新增 Karing 原生分流适配，按短内核系列归档客户端，美化 README，提交推送 main 并确认 CI 与新链接可用。用户已明确授权提交和推送 main；发布前必须完成 Markdown 渲染视觉检查。

- 目录映射：`tools/client-layout.json`。五个顶层系列目录，下层保留原客户端目录；公共 rulesets URL 不变。
- Karing：97 条规则、19 个复杂匹配 source 资产。文本输入哈希归一 LF，二进制保持原字节。DNS、节点组、默认动作由 App 设置；尚无 Karing 实机导入/连接验收。
- 运行内容保留：177 个运行文件全部映射存在；175 个归一后相同，另外2个只涉及生成路径或元信息。三份 JS 相同 fixture 完整输出一致。
- README：28 个自包含玻璃 SVG，包含3张桌面图及3张手机图。根 README 已检查桌面亮暗、390px窄屏；27份 README 经 GitHub GFM API 渲染并检查，312 个本地链接目标存在。截图与报告在忽略目录 `.cache/readme-preview/`。
- 验证：全仓 Node 前次 601 项，595通过、0失败、6跳过；新增跨行尾回归后Karing及布局11项通过；产物合同2498项/22产物通过；生成资产、质量收据与Karing --check通过。CI将实际执行两版官方sing-box核心检查。
- 历史证据：`docs/upstream/2026-10-19/**` 已还原原始内容，该子树无diff。9个档案哈希、14条历史路径绑定通过。
- 上游规则未刷新；Egern原140个资产与两份SingBox JSON的运行内容保持。构建依赖及新路径已同步到CI。

下一步：审查暂存重命名差异，提交到main，推送后检查该提交的CI、在线README图像及新下载URL完整响应哈希。
