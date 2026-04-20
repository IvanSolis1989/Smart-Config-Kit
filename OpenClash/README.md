# OpenClash 使用方法

> 覆写脚本（轻量版）：`openclash_custom_overwrite.sh`（**v5.3.4-align-dns-baseline**）
> 覆写脚本（完整版）：`openclash_custom_overwrite_full.sh`（**v5.2.3-oc-full.2**，387 providers，对齐 Clash Party v5.2.3 + DNS 基线）
> 界面配置：`clash-smart-openclash.conf`
> 架构：提供 **Slim / Full 双版本**，分别覆盖“低 OOM 风险”与“完整规则覆盖”两种需求

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

## 七、优化使用方法（Slim / Full）

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
