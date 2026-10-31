<picture>
  <source media="(max-width: 600px)" srcset="../assets/readme/page-docs-mobile.svg">
  <img src="../assets/readme/page-docs.svg" alt="WebRTC 隐私与连接验收" width="100%">
</picture>

# WebRTC 隐私与连接验收

规则分流保留直连流量。网页走代理，并不代表同页发起的 WebRTC 也使用代理出口。Windows 用户可按需拒绝指定浏览器的 UDP，并结合浏览器隐私策略和实际连接记录验收。

[文档中心](../README.md) · [DNS 与导入后验收](dns-and-verification.md) · [Clash Party](../../Mihomo内核系/Clash%20Party/README.md) · [FlClash](../../Mihomo内核系/FlClash/README.md)

## 为什么 TUN 开着仍可能显示本地公网 IP

当前源图在业务分流之前将目的端口 `3478`、`3479`、`5349`、`19302`、`19305`、`19307` 交给 `DIRECT`，用于 STUN/TURN 与 NAT 探测兼容。它们是目的端口规则，并非识别 WebRTC 的协议防火墙。`stun.l.google.com` 等域名也在 fake-IP 排除列表中。

TUN 接管连接后仍按规则选择出口，所以“进入 TUN”与“通过代理节点”是两件事。STUN 的真实 DNS 回答不强制直连；这里决定出口的是前述 `DIRECT` 规则。DNS 加密、fake-IP 或嗅探选项本身不提供 WebRTC 公网 IP 隐藏保证。

**关闭客户端「DNS 覆写」是关联本仓库脚本后的正常用法。** 关闭的是 App 的二次覆盖，脚本生成的 Mihomo DNS 仍启用。不能仅凭这个开关判定 DNS 已失效，须核对实际生效配置。

## Windows：启用浏览器 UDP 保护

适用于 **Windows 上的 Clash Party Smart / Normal 与 FlClash JS**，只匹配 `chrome.exe`、`msedge.exe`、`firefox.exe`。默认关闭；启用后拒绝这三个进程的全部 UDP，包含 UDP/19302、其他 STUN 端口及 HTTP/3，不依赖 STUN 域名清单或节点是否支持 UDP。

1. 打开[在线配置页面](https://ivansolis1989.github.io/Smart-Config-Kit/)，选择对应客户端，在本地参数中将 **「Windows 浏览器 UDP」** 设为 **「拒绝（reject）」**，下载 JS。也可使用[离线配置页](../configuration.html)。
2. 将下载内容保存为独立命名的本地覆写并关联节点订阅，保留这次选择；不要用官方 Raw URL 的自动更新覆盖本地选项。Clash Party Smart / Normal 选用其一，导入步骤见各客户端教程。
3. 开启 TUN、使用规则模式，重新应用配置；确认最终配置的 `find-process-mode: strict` 仍生效，并能识别浏览器进程。客户端排除浏览器、进程识别失败或绕过 TUN 时，此规则无法提供保护。
4. 重测并核对浏览器 UDP 连接命中 `AND` 拒绝规则、出站为 `REJECT`；网页 TCP 请求继续按业务规则处理。随后检查日常网页通话与屏幕共享是否可用。

此选项来自可信本地常量 `SCKI_BROWSER_UDP_POLICY`，订阅内容和环境变量不能代为开启。它在常规分流和 QUIC 服务例外之前拒绝浏览器 UDP；其他应用继续使用原规则，包括默认的 STUN/TURN 兼容直连。需要恢复时改为「关闭（off）」并重新下载、关联、应用。

高级用户可对已有支持该选项的本地 JS 先预览，再保存；保存会备份原文件并读回：

```powershell
node tools/configure.js --target 'D:\Configs\local.js' --browser-udp reject --dry-run
node tools/configure.js --target 'D:\Configs\local.js' --browser-udp reject
```

旧脚本缺少此能力时，工具会拒绝开启；应先更新到支持该选项的版本。更新本地脚本时会保留已选择的保护，不能静默降为关闭。

**这不是禁用全部 WebRTC。** UDP 通话可能失败或改用 TCP/TURN；TCP/TURN、浏览器 host candidate 与未进入核心的连接仍需浏览器策略和实际验收。Android / macOS / Linux 的浏览器进程名称和识别能力不同，此 Windows 选项不适用；AEROVE Lite、OpenClash 及其他原生配置本轮不提供此选项，不能把它们的导入成功当作已启用保护。

## 选择适合自己的方式

| 需求 | 做法 | 代价 |
| --- | --- | --- |
| 通话、打洞优先 | 保持默认分流 | STUN 可显示本地公网 IP |
| Windows 指定浏览器不发 UDP | 开启上面的浏览器 UDP 保护 | 浏览器 HTTP/3 和 UDP 通话受影响 |
| 限制浏览器 UDP | 使用浏览器 WebRTC 策略 | 部分通话失败或改用中继 |
| 完全不使用 WebRTC | 在支持的浏览器禁用 PeerConnection | 网页通话和屏幕共享会受影响 |

Chrome 提供 `WebRtcIPHandling` 企业策略，可选 `disable_non_proxied_udp`，限制未通过浏览器代理的 UDP。按 [Chrome 官方策略](https://chromeenterprise.google/policies/#WebRtcIPHandling)在需要保护的浏览器配置，随后打开 `chrome://policy` 重新加载并确认策略已接受，完全退出浏览器后重开测试。已有受管策略的设备应由管理员配置，不覆盖现有管理值。Chrome 扩展也可通过官方 [privacy API](https://developer.chrome.com/docs/extensions/reference/api/privacy#property-network-webRTCIPHandlingPolicy)管理同一隐私取舍。

Windows Chrome 的手工配置入口为注册表 `HKEY_CURRENT_USER\Software\Policies\Google\Chrome`，字符串值 `WebRtcIPHandling` 设为 `disable_non_proxied_udp`。修改前导出该键并记录原值；只改这一项，恢复时还原原值，原来不存在时只删除新增值。策略页面若报错或未接受该值，不视为生效。这是需要用户主动选择的浏览器设置，仓库脚本和离线表单不会代为写入。

这不是修改 Mihomo DNS 的选项。只有 TUN 时，浏览器未必将它视为已配置的代理；必须验证最终候选和连接，不能仅凭策略名称宣称所有流量都走代理。保留 WebRTC 通话时，还须验证代理路径、节点 UDP 或 TCP/TURN 中继是否可用。

Firefox 支持限制或关闭 PeerConnection；其 [官方隐私 API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/privacy/network)区分 `peerConnectionEnabled` 与 IP handling policy。完全关闭会阻止网页建立 WebRTC 对等连接；不同浏览器的可用界面、策略和值以各自官方文档为准。恢复时还原原有浏览器设置，并重新验收通话功能。

Firefox 桌面版需要完全关闭时，可在 `about:config` 记录 `media.peerconnection.enabled` 原值，再改为 `false`，完全退出并重开浏览器；恢复时还原原值。[Mozilla 的 WebRTC 隐私说明](https://wiki.mozilla.org/Media/WebRTC/Privacy)定义了此项控制 PeerConnection 的能力。

**只隐藏局域网 host candidate 不等于隐藏 STUN 得到的公网地址。** 也不要把封禁几个常用端口当作完整保障：服务器可以使用其他端口，TURN 还可以使用 TCP/443。仅把已知 STUN 流量指向代理也不充分；[Mihomo 官方规则说明](https://wiki.metacubex.one/config/rules/)指出，UDP 选中不支持 UDP 的节点时可能继续匹配后续规则。

## 按这个顺序验收

1. 在同一浏览器和网络下打开 [BrowserLeaks WebRTC](https://browserleaks.com/webrtc)，区分网页的 `Remote IP`、WebRTC 的 `Public IP Address` 和 `Local IP Address`。先记录候选是否存在，以及公网地址是否一致。
2. 打开客户端连接记录，重测并查 `stun.l.google.com`、UDP/19302 或实际 STUN/TURN 目的地址；记录网络协议、目的端口、命中规则与出站链。TCP 网页请求的出口不能代替这条记录。
3. 可短暂使用全局模式作对照：明确选择可用且支持所需协议的代理节点，彻底关闭旧测试页面后重测，记录候选和连接差异，随后恢复规则模式。全局模式不是持续的隐私承诺。
4. 应用浏览器隐私设置，完全退出并重启浏览器后再测；网页 IP 正常、候选未暴露本地公网 IP 后，再检查日常通话是否仍可用。

`No Leak` 可能表示候选地址与网页出口相符，也可能只是没有收集到候选；它不单独证明 UDP 已被代理。IPv6、VPN 排除应用、系统路由和浏览器扩展也须在实际设备上核查。

## 向维护者提供什么

反馈时附上操作系统、浏览器版本、客户端及核心版本、脚本版本、TUN/规则模式，以及上面两次测试的候选类型和一条 STUN 连接记录。实际生效配置只需相关 DNS、规则和出站片段；删除订阅 URL、token、密码及设备路径，脱敏本机和代理出口公网 IP。保留公开 STUN 目的域名/IP、端口、命中规则与出站链，方便定位。

[Issue #193 的补充截图](https://github.com/IvanSolis1989/Smart-Config-Kit/issues/193#issuecomment-6499914068)已确认三条 Chrome 到 `stun.l.google.com` 的 UDP/19302 连接通过 TUN、命中 `DstPort(19302) → DIRECT`，且有实际收发；同页 HTTPS 请求使用代理。这支持前述路由原因，但不能把截图之外的全部流量或本次保护启用后的设备状态视为已验证。截图含公网地址和节点信息，反馈时请按需进一步脱敏。
