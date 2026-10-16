# Windows 11 Microsoft Store 页面和图片排障

Store 页面打不开、报 `0x80072EFD`，与页面已打开但应用图标或详情图片空白，可能发生在不同的连接环节。先确认 Store 流量能否进入本机 Mihomo，再检查图片 CDN 经 `Ⓜ️ 微软服务` 策略组的实际出站。

## 1. 确认 Store 能进入本机代理

在 Clash Party 中先确认**实际运行的内核 TUN 状态**、系统代理地址和端口，以及连接面板是否出现 Store 请求。配置文件里存在 `tun:` 字段，只说明配置了该字段，不能证明当前内核已启用 TUN。如果系统代理指向 `127.0.0.1`，Store 作为 AppContainer 应用访问本机代理时还可能受 Windows 回环隔离影响。Microsoft 的 [UWP 网络故障排查文档](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/troubleshooting-uwp-firewall)说明了这一机制和按包添加客户端回环豁免的命令。

先在 PowerShell 读取 Store 的真实 Package Family Name，并检查现有豁免：

```powershell
$store = Get-AppxPackage -Name Microsoft.WindowsStore
if (-not $store) { throw '未找到 Microsoft.WindowsStore 包' }
if ($store.PackageFamilyName -ne 'Microsoft.WindowsStore_8wekyb3d8bbwe') { throw 'Store 包标识与预期不符，请先核对' }
$store.PackageFamilyName
CheckNetIsolation.exe LoopbackExempt -s
```

若确认当前 Store 包没有豁免，并且 Store 到本机代理的 TCP 连接卡在 `SYN_SENT`、Mihomo 没有对应连接记录，可在**管理员 PowerShell** 中仅为这个包添加客户端回环豁免，再读回列表：

```powershell
$store = Get-AppxPackage -Name Microsoft.WindowsStore
if (-not $store) { throw '未找到 Microsoft.WindowsStore 包' }
if ($store.PackageFamilyName -ne 'Microsoft.WindowsStore_8wekyb3d8bbwe') { throw 'Store 包标识与预期不符，请先核对' }
& CheckNetIsolation.exe LoopbackExempt -a "-n=$($store.PackageFamilyName)"
CheckNetIsolation.exe LoopbackExempt -s
```

核对列表里出现该包的 Family Name 后，重新打开 Store 并查看 Mihomo 连接日志。回环豁免针对 Store 到 `127.0.0.1` 本机代理的入口；它不决定微软图片服务器的出站能否成功。一次排障中，TUN 的实际运行状态也在验证期间发生变化，因此不能只凭页面恢复就把原因单独归给回环豁免。不要对所有 AppContainer 批量添加豁免。

## 2. 页面可打开但图片仍为空

从 Store 的 `Microsoft-Windows-Store/Operational` 事件等记录取得**实际失败的图片 URL**，再用主机名和时间对照 Mihomo 连接记录，核对命中规则、策略组和所选出站。Mihomo 的 TLS 连接记录通常只有主机和策略信息，不能从中还原完整图片 URL。若只看到图片连接命中 `Ⓜ️ 微软服务 → DIRECT`，这只能证明规则选择，不能证明 TLS 握手或图片响应成功。Mihomo 的[规则文档](https://wiki.metacubex.one/config/rules/)说明规则按顺序匹配；最终是否获取内容仍需检查连接结果。

用同一个图片 URL，在同一网络下经本地代理分别比较 `Ⓜ️ 微软服务` 选 `DIRECT` 与选**当前可用节点**时的响应。例子中的端口和 URL 应替换为自己的实际值：

```powershell
curl.exe -L --connect-timeout 8 --max-time 20 --proxy 'http://127.0.0.1:<本地代理端口>' -o NUL -w 'HTTP=%{http_code} bytes=%{size_download}' '<实际图片URL>'
```

一次实测中，相同的两张 Store 图片在 `DIRECT` 下均出现 `curl: (35)` TLS 握手失败、下载 0 字节；只把 `Ⓜ️ 微软服务` 组切到当时可用的全球节点后，两张图片均返回 HTTP 200，下载内容的文件签名也确认为 PNG，随后 Store 页面图片与图标实际恢复。这说明该网络上的图片 CDN 直连出口存在问题。可先在客户端为该业务组选择经实测可用的节点，再重新打开 Store 确认图片与详情实际渲染；不据此把整个微软服务组的仓库默认策略改为全局代理，也不推断所有地区都需要代理。

页面与图片都恢复后，再记录当时的 TUN/系统代理状态、Store 包回环豁免、命中规则、业务组选择和两次 HTTP 结果。若页面仍不显示，继续按实际失败 URL 和连接日志定位，不要仅凭连接计数判断成功。
