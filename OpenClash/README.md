# OpenClash 使用教程

> 覆写脚本（轻量版）：`openclash_custom_overwrite.sh`（**v5.3.5-dedup-acc-china**，135 providers）
> 覆写脚本（完整版）：`openclash_custom_overwrite_full.sh`（**v5.2.5-oc-full.1**，385 providers，对齐 Clash Party v5.2.5）
> 界面配置：`clash-smart-openclash.conf`
> 架构：提供 **Slim / Full 双版本**，分别覆盖"低 OOM 风险"与"完整规则覆盖"两种需求

---

## 🚀 零基础快速开始（适合已刷 OpenWrt 的用户）

> OpenClash 是给"已经装好 OpenWrt 的软路由 / R4S / 刷过机的路由器"用的。如果你还没装 OpenWrt、只是想在电脑上用代理，**请回仓库根目录看 Clash Party 或 v2rayN 目录**，不是这里。

### 这是什么？
一个**部署在路由器上**的 shell 脚本。装好之后路由器下所有设备（电脑、手机、电视、机顶盒）的流量都会自动分流——国内直连、国外走代理，不需要每台设备单独配。

### 我要准备什么？
1. **一台已刷 OpenWrt 的路由器**（NanoPi R4S / R5S / 小米 AX 刷机 / x86 软路由都行，内存 ≥ 1GB）
2. **OpenClash 插件已装好**（`opkg install luci-app-openclash`）
3. **SSH 能登录路由器**（`ssh root@192.168.1.1`）
4. **一个机场订阅 URL**
5. **本仓库的 `openclash_custom_overwrite.sh`（Slim）或 `openclash_custom_overwrite_full.sh`（Full）**

### Slim 还是 Full？一句话决定
- **内存 < 4GB**（小米 AX、NanoPi R4S 2GB 版）→ **Slim**（省 1GB 内存，但只有 136 条规则集）
- **内存 ≥ 4GB** 且想要完整体验 → **Full**（387 条规则集，与 Clash Party 桌面端 1:1）

### 术语速查
- **覆写脚本（Overwrite Script）**：OpenClash 在加载机场订阅 YAML 之前会调用这个脚本，用它返回的 YAML 覆盖原配置——相当于"订阅预处理器"。
- **OOM**：Out Of Memory，路由器内存爆了 Linux 会 kill 进程。小内存路由器装 Full 容易 OOM。
- **rule-provider / 规则集**：每一类域名（Netflix / GitHub / AI 等）的规则列表文件，OpenClash 首次启动会从 jsDelivr/GitHub 下载。
- **fake-ip**：一种加速技术。本脚本默认开启。
- **Smart 内核 + LightGBM**：Mihomo 的 Alpha 分支，用机器学习自动选最优节点。本脚本已启用。

### 4 步走完
1. **在 OpenClash 里切到 Smart 内核**：LuCI → 服务 → OpenClash → 版本更新 → "Meta 内核版本" 选 **Smart** → 点「一键下载」→ 重启 OpenClash。
2. **上传覆写脚本**：在本机跑 `scp openclash_custom_overwrite.sh root@192.168.1.1:/etc/openclash/` （Slim 选这个；Full 把文件名换掉）。然后 `ssh root@192.168.1.1 chmod +x /etc/openclash/openclash_custom_overwrite.sh`。
3. **启用覆写**：LuCI → 服务 → OpenClash → 覆写设置（Overwrite Settings）→ "自定义 OpenClash 脚本" 填 `/etc/openclash/openclash_custom_overwrite.sh` → 勾选"启用自定义覆写" → 保存。
4. **导入订阅 + 启动**：LuCI → 服务 → OpenClash → 配置订阅 → 添加订阅链接 → 点「下载」→ 全局设置里选中这个配置 → 启动 OpenClash。

### 跑起来之后怎么验证？
- 连到路由器 WiFi 的任何设备打开浏览器访问 `https://www.google.com` 能打开 = 代理通了。
- OpenClash LuCI → 运行状态，应看到 9 区域 + 28 业务组。
- `/tmp/openclash.log` 里搜 `[Clash-Smart]`，能看到 `v5.3.4-align-dns-baseline overwrite starting...` 这行就是本脚本成功被调用。

### 最常见踩坑
- ❌ **启动后路由器内存爆了被 OOM**：你用了 Full 但路由器只有 2GB。改用 Slim，或在 `clash-smart-openclash.conf` 里把 `GEODATA_LOADER` 从 `standard` 改为 `memconservative`。
- ❌ **日志报 `list geosite not found`**：`CHINA_IP_ROUTE=1` 导致 OpenClash 注入了裸 `geosite` 引用。**必须改成 `CHINA_IP_ROUTE=0`**（本仓库的 `clash-smart-openclash.conf` 已硬编码为 0）。
- ❌ **jsdelivr 大量 DNS resolve failed**：DNS 冷启动循环依赖。本版本已内置 DNS 救援，但若仍失败把 `GEOSITE_CUSTOM_URL` 改为自建镜像。
- ❌ **LightGBM Model.bin 没下**：路由器无法连外网导致。手动 `wget -O /etc/openclash/Model.bin https://github.com/vernesong/mihomo/releases/download/LightGBM-Model/Model.bin`。

---

## 🔌 协议支持（OpenClash + Mihomo 内核）

OpenClash 底层调用 **Mihomo 二进制**，所以协议支持和桌面端 Mihomo 一样齐全。切换 Smart 内核（Alpha 分支）后 LightGBM 自动择优可用。

| 协议 | 支持 | 说明 |
|---|:-:|---|
| **Shadowsocks (SS)** | ✅ | 含 AEAD 2022-blake3 |
| **ShadowsocksR (SSR)** | ✅ | 老协议 |
| **VMess** | ✅ | ws/grpc/h2/httpupgrade |
| **VLESS** | ✅ | **REALITY** + **XTLS-Vision** |
| **Trojan** | ✅ | + Trojan-Go |
| **Hysteria v1 / v2** | ✅ | UDP QUIC |
| **TUIC v5** | ✅ | UDP QUIC |
| **WireGuard** | ✅ | 作为出站 |
| **AnyTLS / ShadowTLS / Snell v4 / SSH / Mieru** | ✅ | 全覆盖 |
| **SOCKS5 / HTTP(S)** | ✅ | |

**软路由部署 OpenClash + Mihomo 是"一次配置，全家设备享用"的最佳方案**——iPhone/安卓手机/电视/游戏机连上路由器 WiFi 就自动分流，不用每台设备装客户端。

### 路由器协议兼容性提示
- **ARM64 CPU** 的路由器（R4S/R5S/AX 刷机）：所有协议都能跑
- **MIPS CPU** 的路由器（部分老路由器）：Mihomo 提供 mips 版本，但 **Hysteria 2 / TUIC / WireGuard** 的 QUIC/内核模块可能不稳定；保险起见用 SS / VMess / Trojan
- **x86 软路由**：最佳选择，协议全兼容

---

## 🔁 从 Passwall / Passwall2 / SSR+ 迁移过来？

这些插件本身没有问题；**Passwall 系底层走 xray/sing-box，`geosite` / `geoip` / remote `rule_set` 的规则匹配能力是齐的**。真正的差距在：
- ❌ **没有 mihomo 的 proxy-groups 嵌套选择器**——Clash 把"业务组 → 区域组 → 具体节点" 的两层 `select` + `url-test` 串联表达成 YAML 里 10 行配置，Passwall 需要手工展平为 ~28 条 shunt rule
- ❌ **没有 Smart + LightGBM 自动择优**（只有 mihomo Alpha 内核有）
- ❌ **没有 JS 覆写 / 订阅预处理**（机场换节点不能自动归类到区域组）
- ❌ **没有 rule-providers 的 Clash 原生结构**（Passwall2 的 rule_set 是 sing-box 风格，不同格式）

想要完整 OpenClash 体验，往下看迁移步骤。**想保留 Passwall/Passwall2 + 拿到约 70% 的分流能力**，用本仓库 `Passwall2/` 目录的 shunt rule 参考配置。

SSR+ 架构更老，没有 geosite 层能力，建议直接换 OpenClash，不做单独产物。

### 迁移步骤（~10 分钟）

1. **备份你现在的机场订阅 URL**（Passwall / SSR+ 的"订阅管理"里复制出来）。
2. **安装 OpenClash**：`opkg install luci-app-openclash`（没装过的话）；已装就跳过。
3. **关掉原插件的自启**：
   ```sh
   /etc/init.d/passwall2 stop; /etc/init.d/passwall2 disable
   # 或 SSR+：
   /etc/init.d/shadowsocksr stop; /etc/init.d/shadowsocksr disable
   ```
   **不要卸载**，保留配置以便回滚。
4. **按本页下方的「一、前置准备」开始走 OpenClash 部署流程**（Smart 内核切换、上传本仓库覆写脚本、导入订阅）。
5. 确认 OpenClash 稳定工作后再考虑卸载原插件。

### 替代方案：保留 Passwall2 + 在「自定义内核」里跑 mihomo

理论上 Passwall2 支持把 mihomo 作为自定义 Xray 核替代品装进去，但这相当于**用 Passwall2 模拟 OpenClash**，复杂度远高于直接换 OpenClash。**不推荐**。

### 同台路由器装多个代理插件会冲突吗？

会。它们都会修改 iptables / nftables / dnsmasq 规则，同时开启会互相覆盖导致**全部都不工作**。**永远只启用一个**。

---

## 一、前置准备

## 版本选择建议（先看这个）

| 版本 | 文件名 | 规则量 | 推荐设备 | 适用场景 |
|---|---|---:|---|---|
| 轻量版（Slim） | `openclash_custom_overwrite.sh` | 136 providers | 1GB~4GB 路由器 | 长期稳定、低内存优先 |
| 完整版（Full） | `openclash_custom_overwrite_full.sh` | 387 providers | ≥4GB（推荐 x86 / 高配 ARM） | 追求与 Clash Party 同级覆盖率 |

> 结论：先用 Slim；若设备内存充足且你明确需要更多细分规则，再切换 Full。


### 1. 硬件要求

| 设备 | 内存 | 推荐等级 |
|------|------|----------|
| NanoPi R4S 4GB | 4 GB | ✅ 官方优化目标 |
| NanoPi R5S / R6S | 4–8 GB | ✅ 推荐 |
| 小米 AX 系列（刷 OpenWrt） | 256 MB–1 GB | ⚠️ 需进一步精简 `rule-providers` |
| x86 软路由 | ≥ 2 GB | ✅ 推荐 |

### 2. 软件要求

- **OpenWrt** 21.02+ / **iStoreOS** / **ImmortalWrt**
- **OpenClash** 版本 **≥ 0.46.068**（低版本缺少 Smart 内核支持）
- **Mihomo Smart 内核**（在 OpenClash「版本更新」页切换）
- **LuCI Web UI** 可访问

---

## 二、安装 OpenClash 与 Smart 内核

### 1. 安装 OpenClash

参考官方 Wiki：https://github.com/vernesong/OpenClash/wiki

常用一键脚本（以 ARMv8 / iStoreOS 为例）：
```sh
opkg update
opkg install luci-app-openclash
/etc/init.d/openclash enable
/etc/init.d/openclash start
```

### 2. 切换到 Smart 内核

- LuCI → **服务 → OpenClash → 版本更新**
- 「Meta 内核版本」下拉选择 **Smart**（若无该选项，先升级 OpenClash 到最新）
- 点击「**一键下载**」→ 等待下载完成
- 重启 OpenClash

### 3. 下载 LightGBM 模型

Smart 内核依赖 LightGBM 做自动择优：
```sh
# 手动下载（OpenClash 会自动管理，通常无需手动操作）
wget -O /etc/openclash/Model.bin \
  https://github.com/vernesong/mihomo/releases/download/LightGBM-Model/Model.bin
```
本脚本已在 `clash-smart-openclash.conf` 中启用 `SMART_ENABLE_LGBM=1` + `LGBM_AUTO_UPDATE=1`，72 小时自动更新。

---

## 三、部署覆写脚本

### 1. 上传覆写脚本到路由器（Slim / Full 二选一）

SSH 登录路由器：
```sh
scp openclash_custom_overwrite.sh root@192.168.1.1:/etc/openclash/
scp openclash_custom_overwrite_full.sh root@192.168.1.1:/etc/openclash/
ssh root@192.168.1.1
chmod +x /etc/openclash/openclash_custom_overwrite.sh
chmod +x /etc/openclash/openclash_custom_overwrite_full.sh
```

或直接使用 LuCI → **系统 → 文件传输** 上传到 `/etc/openclash/`。

### 2. 在 OpenClash 中启用覆写

LuCI → **服务 → OpenClash → 覆写设置（Overwrite Settings）**：

1. 找到 **「自定义 OpenClash 脚本（Custom Overwrite Script）」**
2. 选择其一：
   - 轻量：`/etc/openclash/openclash_custom_overwrite.sh`
   - 完整：`/etc/openclash/openclash_custom_overwrite_full.sh`
3. 勾选「**启用自定义覆写**」
4. 保存并应用。

---

## 四、导入界面配置（`clash-smart-openclash.conf`）

此文件的每一项都对应 LuCI **插件设置（Plugin Settings）**页的一个选项。

### 方式 A：手动对照填写（推荐首次）

打开 `clash-smart-openclash.conf`，按字段对照填入 OpenClash LuCI 对应位置。关键项：

| 字段 | 值 | 位置 |
|------|------|------|
| `CORE_TYPE` | `Smart` | 版本更新 → 选择 Smart |
| `EN_MODE` | `fake-ip` | 插件设置 → DNS 模式 |
| `ENABLE_RESPECT_RULES` | `1` | 插件设置 → 开启 Respect Rules |
| `CHINA_IP_ROUTE` | `0`（★ 关键） | 插件设置 → 绕过中国大陆 IP |
| `ENABLE_META_SNIFFER` | `1` | 插件设置 → 启用 Meta 嗅探 |
| `ENABLE_TCP_CONCURRENT` | `1` | 插件设置 → TCP 并发 |
| `FIND_PROCESS_MODE` | `off`（★ 关键） | 插件设置 → 进程匹配 → 关闭 |
| `AUTO_SMART_SWITCH` | `1` | 插件设置 → Smart 自动切换 |
| `SMART_ENABLE_LGBM` | `1` | 插件设置 → 启用 LightGBM |
| `GEODATA_LOADER` | `standard`（4GB） / `memconservative`（2GB） | 插件设置 → GeoData 加载器 |
| `GEOIP_CUSTOM_URL` | `https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/geoip.dat` | 同上 |
| `GEOSITE_CUSTOM_URL` | `https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat` | 同上 |
| `GEOASN_CUSTOM_URL` | `https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb` | 同上 |

### 方式 B：直接写入 UCI 配置（高级）

```sh
# 示例：一次性写入关键字段
uci set openclash.config.core_type='Smart'
uci set openclash.config.en_mode='fake-ip'
uci set openclash.config.china_ip_route='0'
uci set openclash.config.find_process_mode='off'
uci set openclash.config.enable_respect_rules='1'
uci set openclash.config.geodata_loader='standard'
uci set openclash.config.geosite_custom_url='https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat'
uci commit openclash
/etc/init.d/openclash restart
```

---

## 五、截图参考

<img width="1280" height="678" alt="image" src="https://github.com/user-attachments/assets/3f7f16a8-f01c-4f7d-ad17-338140088a9a" />
<img width="1280" height="678" alt="image" src="https://github.com/user-attachments/assets/e03460ea-606c-4e1b-b45b-a76bc8158abf" />
<img width="1280" height="678" alt="image" src="https://github.com/user-attachments/assets/3a204b9e-ccc8-4b1f-8ed9-3dd1c1e66e7b" />

---

## 六、添加订阅并启动

1. LuCI → **服务 → OpenClash → 配置订阅** → 添加机场订阅链接。
2. 点击「**下载**」拉取配置。
3. 「**全局设置 → 选择配置文件**」选择刚下载的订阅。
4. 点击**启动 OpenClash**。
5. 查看日志：**运行日志（Run Log）** 页应能看到：
   ```
   [Clash-Smart] v5.3.2-dns-rescue-no-rules overwrite starting...
   [Clash-Smart] Processing: /etc/openclash/config/xxx.yaml
   [Clash-Smart] Memory-optimized build for NanoPi R4S 4GB
   ```

---

## 七、优化使用教程（Slim / Full）

### A. Slim（轻量版）优化点

**v5.3.x 对比 v5.2.4-oc** 做了以下精简：

| 优化项 | 节省 | 代价 |
|--------|------|------|
| `geodata-loader: standard → memconservative` | ~400–600 MB | 首次规则命中延迟 +几 ms（路由器无感） |
| `rule-providers` 387 → 136（砍 65%） | ~800–1,100 MB | 少数冷门域名回退到 `GEOIP,CN` 兜底 |

### 精简策略
- **Google 家族合并**：GoogleSearch/Drive/Earth/FCM/Voice → 统一 `google`
- **Apple 家族合并**：AppleTV/News/Dev/Proxy/Siri/TestFlight/Firmware/FindMy → `apple` + `icloud`
- **删除区域化通讯分片**：TelegramNL/SG/US、KakaoTalk、Zalo、GoogleVoice、iTalkBB
- **删除低频冷门**：国内小众流媒体、欧洲/日本分区、非洲/南美 GeoRouting
- **删除冗余广告拦截**：10+ 个功能重叠的 blackmatrix7 广告集

### 保留不变
- ✅ 9 个 Smart 区域组（全部 `uselightgbm: true + include-all-proxies: true`）
- ✅ 动态节点分类（HK/TW/JP/KR/SG/US/EU/AM/AF/APAC_OTHER）
- ✅ DNS 多层架构（`respect-rules` + DoH 冗余 + `default-nameserver` bootstrap）
- ✅ Sniffer 配置（HTTP/TLS/QUIC + binance/apple skip）
- ✅ TLS 指纹注入逻辑（vless/vmess/trojan 自动哈希分配）
- ✅ 节点过滤（移除信息节点 + 倍率节点）
- ✅ TCP 并发 / keep-alive / unified-delay


### B. Full（完整版）使用建议

- 与 Clash Party 保持同等规则量（387 providers），适合高覆盖需求；
- 建议设备空闲内存 ≥ 2GB 再启用；
- 若出现启动慢或内存峰值高：
  1. 先改 `GEODATA_LOADER=memconservative`；
  2. 再考虑回退到 Slim 脚本；
  3. 保留 `CHINA_IP_ROUTE=0`，避免 geosite 注入解析问题。

### C. 快速切换策略（推荐）

1. 默认用 Slim 连续观察 24~48 小时；
2. 关键业务存在误判/漏命中时切到 Full；
3. Full 若触发 OOM，再切回 Slim 并仅补充缺失规则。

---

## 八、常见问题

### Q1：日志出现 `list geosite not found` / parse error？
**原因**：`CHINA_IP_ROUTE=1` 时 OpenClash Step3 会自动注入裸 `geosite` 引用，在 `geodata-mode: true` + `geodata-loader: standard` 下可能解析失败。
**解决**：必须设置 `CHINA_IP_ROUTE=0`（已在 `clash-smart-openclash.conf` 中硬编码）。覆写脚本已有完整的中国分流规则：
`GEOIP,CN` + `RULE-SET,cn` + `cn-ip` + `acc-chinamax` + `acc-china` + `acc-geositecn` + `acc-geo-d/ip-asia-china`。

### Q2：`geosite.dat` 来源不对 / 更新失败？
**解决**：已显式配置 `GEOSITE_CUSTOM_URL=https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat`，确保与覆写脚本一致。

### Q3：进程匹配导致性能下降？
**解决**：OpenWrt 路由器上不需要进程匹配（Linux 侧无法准确识别移动/桌面端应用进程），强制 `FIND_PROCESS_MODE=off`。

### Q4：路由器内存不够触发 OOM / Docker 被 kill？
按激进程度依次尝试：
1. 将 `GEODATA_LOADER` 改为 `memconservative`
2. 继续精简 `rule-providers`（砍东南亚 / 香港 / 台湾流媒体板块）
3. 关闭单个不常用区域的 Smart 组（如非洲 / 美洲）
4. 最后才动 `uselightgbm: false`（会牺牲自动择优）

### Q5：DNS 冷启动失败 / jsdelivr 大量 DNS resolve failed？
本版本的 DNS 段对齐 Clash Party `README.md` 基线（国内 DoH 优先 + 海外 DoH fallback），同时保留 OpenClash 侧救援：
- `hosts` 段直接写入 `one.one.one.one` / `cloudflare-dns.com` / `dns.google` / `dns.quad9.net` 的 IP，确保 bootstrap DNS 不走规则环。
- `default-nameserver` 先 `223.5.5.5` / `119.29.29.29`（国内明文 UDP，路由冷启动可达），再 `1.1.1.1` / `8.8.8.8` 冗余。
- `nameserver` / `direct-nameserver` 用 `223.5.5.5` + `doh.pub` 的国内 DoH；`proxy-server-nameserver` 叠加海外 DoH 做机场域名解析；`fallback` 仅两条 Cloudflare / Google。
- `nameserver-policy` 把 `jsdelivr / github / githubusercontent / githubassets / fastly.net` 强制走 Cloudflare/Google DoH，规避 jsdelivr 冷启动死锁。
- 若在大陆环境仍出现 jsdelivr 大量失败，优先检查 ISP 是否对 1.1.1.1/8.8.8.8 做 UDP 劫持，必要时把 `nameserver-policy` 的上游改为自建 DoH。

### Q6：国内银行/支付异常？
`sniffer.skip-domain` 已包含 `+.binance.com / +.binancefuture.com / Mijia Cloud` 等；如仍有问题，可在 UCI 中追加对应域名到 skip 列表。

---

## 九、调试命令

```sh
# 查看运行中的 Clash 进程内存
ps | grep -i clash
cat /proc/$(pidof clash)/status | grep -E 'VmRSS|VmSize'

# 查看 OpenClash 实时日志
tail -f /tmp/openclash.log

# 验证覆写脚本是否执行
grep -E '\[Clash-Smart\]' /tmp/openclash.log

# 查看最终生效的配置
cat /etc/openclash/config/$(uci get openclash.config.config_path | xargs basename)

# 手动触发覆写（仅调试用）
bash /etc/openclash/openclash_custom_overwrite.sh /etc/openclash/config/your-config.yaml
# 或
bash /etc/openclash/openclash_custom_overwrite_full.sh /etc/openclash/config/your-config.yaml
```

---

## 十、版本回滚

若新版本出现问题，可回退到旧版本：

```sh
cd /etc/openclash/
cp openclash_custom_overwrite.sh openclash_custom_overwrite.sh.bak
cp openclash_custom_overwrite_full.sh openclash_custom_overwrite_full.sh.bak
# 用仓库 git log 回滚到上一个 tag
```

建议每次更新覆写脚本前先备份 `/etc/openclash/` 整个目录。

---

## 十一、致谢

- [vernesong/OpenClash](https://github.com/vernesong/OpenClash) - OpenWrt OpenClash 插件
- [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo) - Smart 内核
- [NanoPi R4S](https://www.friendlyelec.com/) - 参考硬件平台
