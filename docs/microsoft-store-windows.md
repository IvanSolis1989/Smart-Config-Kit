<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-microsoft-store-mobile.svg">
  <img src="assets/readme/page-microsoft-store.svg" width="100%" alt="Technical guide">
</picture>

<a id="windows-11-microsoft-store-页面和图片排障"></a>
# Troubleshooting Windows 11 Microsoft Store pages and images

**English** | [简体中文](microsoft-store-windows.zh-CN.md)

Investigate Windows 11 Microsoft Store in this order: proxy entry, image CDN, then actual response. Confirm page recovery and image recovery separately.

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="Downloads"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="Documentation"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="Checks and troubleshooting"></a>
</p>

[Downloads](guide/downloads.md) · [Documentation](README.md) · [Checks and troubleshooting](guide/dns-and-verification.md)

<a id="使用入口"></a>
## Entry points

1. Confirm actual TUN state, system proxy, and Store connection records.
2. Add and read back a loopback exemption for the Store package alone only if the conditions below hold.
3. Obtain the actual failing image URL and compare outbound responses for the same network and destination.

A Store page that will not open or reports `0x80072EFD` may fail at a different connection stage from a page that opens but has blank application icons/detail images. First establish whether Store traffic reaches local Mihomo, then inspect the image CDN’s actual outbound through `Ⓜ️ 微软服务` (Microsoft services).

<a id="1-确认-store-能进入本机代理"></a>
## 1. Confirm Store reaches the local proxy

In Clash Party, inspect the **running core’s actual TUN state**, system-proxy address/port, and whether Store requests appear in the connection panel. A `tun:` field in a configuration proves only that the field is configured, not that TUN is active in the current core.

If the system proxy points to `127.0.0.1`, Store, as an AppContainer application, may be affected by Windows loopback isolation when accessing the local proxy. Microsoft’s [UWP network troubleshooting documentation](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/troubleshooting-uwp-firewall) describes this mechanism and per-package client-loopback exemptions.

First read Store’s actual Package Family Name and existing exemptions in PowerShell:

```powershell
$store = Get-AppxPackage -Name Microsoft.WindowsStore
if (-not $store) { throw 'Microsoft.WindowsStore package not found' }
if ($store.PackageFamilyName -ne 'Microsoft.WindowsStore_8wekyb3d8bbwe') { throw 'Unexpected Store package identity; verify it first' }
$store.PackageFamilyName
CheckNetIsolation.exe LoopbackExempt -s
```

If the current Store package has no exemption, its TCP connection to the local proxy remains in `SYN_SENT`, and Mihomo shows no corresponding connection, use **administrator PowerShell** to add a client-loopback exemption only for that package, then read the list back:

```powershell
$store = Get-AppxPackage -Name Microsoft.WindowsStore
if (-not $store) { throw 'Microsoft.WindowsStore package not found' }
if ($store.PackageFamilyName -ne 'Microsoft.WindowsStore_8wekyb3d8bbwe') { throw 'Unexpected Store package identity; verify it first' }
& CheckNetIsolation.exe LoopbackExempt -a "-n=$($store.PackageFamilyName)"
CheckNetIsolation.exe LoopbackExempt -s
```

After confirming the package Family Name in the list, reopen Store and inspect Mihomo logs. The exemption affects Store’s entry into the local `127.0.0.1` proxy, not successful outbound access to Microsoft’s image servers. During one investigation, actual TUN state also changed during validation, so page recovery alone could not isolate the exemption as the sole cause.

Do not bulk-add exemptions for all AppContainers.

<a id="2-页面可打开但图片仍为空"></a>
## 2. The page opens but images remain blank

Obtain the **actual failing image URL** from records such as Store’s `Microsoft-Windows-Store/Operational` events. Match its hostname and time against Mihomo records to inspect the rule, policy group, and selected outbound.

Mihomo TLS records usually contain only host/policy information and cannot reconstruct a full image URL. A match to `Ⓜ️ 微软服务 → DIRECT` proves rule selection only, not a successful TLS handshake or image response. Mihomo’s [rule documentation](https://wiki.metacubex.one/config/rules/) explains ordered matching; successful content retrieval still requires connection-result evidence.

Using the same image URL and network through the local proxy, compare the `Ⓜ️ 微软服务` group set to `DIRECT` versus a **currently working node**. Replace the example port and URL with actual values:

```powershell
curl.exe -L --connect-timeout 8 --max-time 20 --proxy 'http://127.0.0.1:<local-proxy-port>' -o NUL -w 'HTTP=%{http_code} bytes=%{size_download}' '<actual-image-URL>'
```

In one actual test, the same two Store images both failed under `DIRECT` with `curl: (35)` TLS errors and zero downloaded bytes. Changing only `Ⓜ️ 微软服务` to a then-working global node produced HTTP 200 for both; downloaded file signatures confirmed PNG, and Store images/icons visibly recovered.

This demonstrates a problem with that network’s direct image-CDN path. Select a tested working node for this service group in the client, then reopen Store and confirm actual image/detail rendering. It does not justify changing the repository default for all Microsoft services to global proxying or assuming every region requires a proxy.

Once both pages and images recover, record TUN/system-proxy state, the Store package exemption, matched rules, group selection, and both HTTP results. If the page still fails to render, continue from actual failed URLs and logs rather than treating connection counts as proof of success.
