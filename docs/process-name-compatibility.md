<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-process-name-mobile.svg">
  <img src="assets/readme/page-process-name.svg" width="100%" alt="技术指南">
</picture>

# PROCESS-NAME 兼容清单与测试集

查阅本地工具的进程分流范围，并核对各客户端能否实际匹配。维护入口保留清单与验证命令。

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="下载配置"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="文档目录"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="检查与排障"></a>
</p>

[下载配置](guide/downloads.md) · [文档目录](README.md) · [检查与排障](guide/dns-and-verification.md)

## 使用入口

1. 先按设计原则确认进程、系统与目标策略。
2. 在已同步和未同步清单中查客户端边界。
3. 改动清单后运行 `node tools/validate-process-name-direct.js`。

本清单用于维护“本地工具直连白名单”，覆盖远程控制、内网穿透、DDNS、P2P Mesh、数据库客户端等工具。参考来源是 YaNet 的 `global_script.js` 本地工具直连段：

- https://github.com/dahaha-365/YaNet/blob/main/Mihomo/global_script.js#L162-L186

## 设计原则

- 主规则只使用精确 `PROCESS-NAME`，不照搬宽泛 `PROCESS-NAME-REGEX,(?i).*vpn.*` / `.*vnc.*`。
- PC / 桌面端优先：Windows 使用 `.exe`，macOS / Linux 使用无扩展名进程名。
- `WorkPro.exe` 与 `WorkProWebProcess.exe` 是本仓库维护的 Windows 本地业务客户端例外，固定进入 `DIRECT` 白名单并由回归校验覆盖；不得以 TUN `exclude-process` 绕过规则引擎。
- 移动端包名暂不进入主规则，除非对应客户端路径已验证不会导入报错且确实能匹配。
- 路由器端 Passwall / Passwall2 不承载本清单，因为它们看不到局域网客户端进程名。
- RustDesk 是例外：公网 relay/API 需要走 `🧑‍💼 会议协作`，不再进入 `DIRECT` 白名单；局域网/私有 IP 连接仍由私有地址规则直连。

## 官方兼容依据

- Mihomo `PROCESS-NAME` 支持进程名；Android 平台可匹配包名：https://wiki.metacubex.one/en/config/rules/#process-name
- sing-box `process_name` 仅支持 Linux / Windows / macOS；Android 应使用独立的 `package_name` 字段，本轮不混写：https://sing-box.sagernet.org/configuration/route/rule/#process_name
- Surge `PROCESS-NAME` 仅 Surge Mac 可用，Surge iOS 会忽略该规则：https://manual.nssurge.com/rule/process.html

## 已同步的产物

### Clash Party / Mihomo Party / Clash Verge Rev

- **同步方式**：`PROCESS-NAME,<name>,DIRECT` + RustDesk → `🧑‍💼 会议协作`
- **说明**：桌面端主承载

### FlClash

- **同步方式**：`PROCESS-NAME,<name>,DIRECT` + RustDesk → `🧑‍💼 会议协作`
- **说明**：Windows/macOS/Linux 可命中；Android 不依赖本清单

### CMFA YAML / ClashMi

- **同步方式**：`PROCESS-NAME,<name>,DIRECT` + RustDesk → `🧑‍💼 会议协作`
- **说明**：Android 导入不报错；桌面 ClashMi 可命中

### OpenClash Normal / Smart

- **同步方式**：语法同步
- **说明**：路由器端通常无实际命中，仅保持规则形态一致

### sing-box Full

- **同步方式**：生成器转换为 `process_name`
- **说明**：本地工具输出 `DIRECT`；RustDesk 输出 `🧑‍💼 会议协作`

### Surge

- **同步方式**：`PROCESS-NAME,<name>,DIRECT` + RustDesk → `🧑‍💼 会议协作`
- **说明**：Surge Mac 可命中；Surge iOS 会忽略进程规则

## 未同步为主规则的产物

### Shadowrocket

- **原因**：iOS 路径，不支持本仓库需要的进程匹配

### Loon

- **原因**：本仓库 Loon 产物面向 iOS，没有桌面端进程匹配承载面

### Quantumult X

- **原因**：本仓库 QX 产物面向 iOS，没有桌面端进程匹配承载面

### v2rayN（Xray 核）

- **原因**：Xray RuleObject `process`
- **补充说明**：仅本机 Windows / Linux 可命中；融合 fallback 已携带 `WorkPro.exe -> direct`

### Passwall / Passwall2

- **原因**：OpenWrt 路由器无法看见局域网客户端进程名

## 维护入口

- 清单：`tools/fixtures/process-name-direct-tools.json`
- 验证：`node tools/validate-process-name-direct.js`

验证脚本会检查：

- Mihomo 系桌面清单是否进入 Clash Party / FlClash / CMFA / OpenClash；
- RustDesk 进程是否进入 `🧑‍💼 会议协作` 而非 `DIRECT`；
- Surge Mac 清单是否进入 Surge；
- SingBox Full 是否由生成器输出本地工具 `process_name -> DIRECT` 与 RustDesk `process_name -> 🧑‍💼 会议协作`；
- Shadowrocket / Loon / QX / v2rayN 是否没有误加入主动进程规则。
