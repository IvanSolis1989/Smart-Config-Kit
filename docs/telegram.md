# Olympus 官方频道自动通知

频道：[Olympus](https://t.me/IvanSolis89)；讨论群：[Olympus_Habitue](https://t.me/Olympus_Habitue)；
机器人：`@Olympus_TL_bot`。

`.github/workflows/telegram-release.yml` 仅在 main 的根 `CHANGELOG.md` 改动时自动通知。
普通提交、子目录日志和 GitHub Release 不触发频道更新；通知脚本自身的提交只执行测试和差异检查。
脚本比较完整 push 的 before/after，只有根日志实际修改才发送，正文取该提交根日志的第一节，
直接附上各客户端的原始配置文件，多个文件合并发送。不压缩，不改文件名，不改文件内容。
从现有 release-batch contract 的客户端 staticOutputs 选择产物，读取指定提交的 Git blob，
不混入本地未提交改动，也不重新生成配置。保存和上传后核对逐文件 SHA256。
正文只保留一次标题、最多四条实际变化和一个短文本“发布页”链接；
根日志引用的同日子目录日志会展开为实际描述，合并重复内容，不机械转发“详见某日志”。

在 Settings → Secrets and variables → Actions 保存 `TELEGRAM_BOT_TOKEN`、`TELEGRAM_API_ID`、`TELEGRAM_API_HASH`，
后两者从 [Telegram API 开发页面](https://my.telegram.org/apps) 获取。
将机器人设为频道管理员并授予“发布消息”。Token 不进入源码、日志和文档，无须部署常驻服务器。
Telegram 自动把频道新帖转发至关联讨论群，机器人无须群管理权限。

## 手动验证与恢复

Actions → **Telegram release notification** → Run workflow，选择 main：

- `preview`：只预览根日志最新节；tag 可填写提交 SHA，留空取 main，不发消息。
- `test`：发送一条静音“机器人部署测试”，验证 Secret 和频道权限。
- `send`：发送指定提交的各客户端原文件和本次更新摘要；tag 留空取 main。
- `recover`：先检查频道确认上次没有成功发送，再使用此模式；它允许重试不确定发送，可能造成重复消息。
- `edit`：仅精简已有成功消息的说明，不重新上传文件。
- `verify`：指定 `first_message_id`，只读取已有附件并下载核对 SHA256，补齐回执，不发新文件。

勾选 `verify_files` 会从 Telegram 下载发送的文件并核对 SHA256。
上传使用 Telethon 的机器人账号 MTProto，session 只存在内存并在结束后登出。
不登录个人用户账号，不运行常驻服务；依赖版本与 PyPI 文件哈希固定在 telegram-requirements.txt。
小于 50 MB 的原文件可直接通过云端 Bot API 发送；
需要下载回验时云端文件上限为 20 MB。更大的产物必须补齐 API 凭据，不降级成链接。

原文件发送回执保存在来源提交的 GitHub commit status：`telegram/olympus/raw-changelog-<SHA>`。
同一提交已有 success 回执时跳过；首次发送前写 pending，消息发送成功后写 success 和频道消息链接。
网络失败或回执保存失败保留 pending，自动重跑不会盲目再发。
确认原消息已存在时，可将该 context 改为 success 并附原消息链接，无须重发。
通知按仓库串行，失败在 Actions 明确显示，不更改规则、配置、版本号或用户数据。

脚本和行为测试位于 `.github/scripts/telegram-release*.mjs`，使用 Node 自带测试运行器：

```sh
node --test .github/scripts/telegram-release.test.mjs .github/scripts/telegram-artifacts.test.mjs
python3 .github/scripts/telegram-files.test.py
```

Aerove 共用发布机器人，按自己的公开 Release 通知，独立维护工作流。
频道 numeric ID 固定，改公开用户名时需同步消息链接。

依据：[Telegram sendMessage](https://core.telegram.org/bots/api#sendmessage)、
[关联讨论群](https://core.telegram.org/api/discussion)、
[GitHub 路径过滤](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpushpull_requestpull_request_targetpathspaths-ignore)、
[发送回执的 commit statuses API](https://docs.github.com/en/rest/commits/statuses)。
上传依据：[机器人 MTProto 登录](https://core.telegram.org/method/auth.importBotAuthorization)、
[Telethon 机器人账号](https://docs.telethon.dev/en/stable/basic/signing-in.html#signing-in-as-a-bot)。
