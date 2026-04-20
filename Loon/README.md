# Loon 使用教程（对齐 Clash Party v5.2.3）

> 配置文件：`Loon/loon-smart.conf`
> 版本：**v5.2.3-Loon.1**（Build 2026-04-20，从 Surge v5.2.3-Surge.1 迁移）
> 目标：**Loon iOS（App Store 付费正版）**
> 架构：9 区域 url-test 组 + 28 业务策略组 + 250+ RULE-SET

---

## 一、下载 Loon

- **iOS**：App Store 搜「Loon」，价格约 ¥198 / 区。需要非中国区 Apple ID。
- 仅 iOS，**没有 macOS 版本**（这是 Loon 和 Surge 的主要区别）。
- 安装后首次启动授权 VPN 配置权限。

---

## 二、配置托管 & 导入

Loon 必须从 URL 安装配置（和 Surge 一样）：

1. 把 `loon-smart.conf` 托管到可访问 URL：
   - GitHub Raw：`https://raw.githubusercontent.com/<user>/<repo>/main/Loon/loon-smart.conf`
   - jsDelivr：`https://cdn.jsdelivr.net/gh/<user>/<repo>@main/Loon/loon-smart.conf`
   - 自建 HTTPS
2. 打开 Loon → 底部 **配置（Config）** 标签。
3. 右上角 **⊕** → 粘贴 URL → **下载**。
4. 点击新下载的配置 → **启用**。

首次启用时 Loon 会拉取 **250+ 个 RULE-SET**（blackmatrix7 Loon 版 `.list` 格式），根据网络情况约 **2–5 分钟**。**务必先开代理再下载**，否则 GitHub 访问不稳定会导致部分 RULE-SET 404。

---

## 三、机场订阅 / 节点

Loon 的节点来源：
1. 底部 **节点（Node）** → ⊕ → 粘贴机场订阅 URL → **下载**。
2. Loon 会解析节点并自动填充到 9 区域组（按 `policy-regex-filter` 匹配地区名）。
3. 也可以在 `[Proxy]` 段直接粘贴节点（不推荐，手工维护麻烦）。

---

## 四、9 区域 × 28 业务组说明

结构与 Surge 版完全一致（本文件从 Surge 版迁移而来）：

- **9 区域组**：url-test + `policy-regex-filter` 自动按地区聚合节点；测速间隔 **600s**，tolerance **50ms**。
- **28 业务组**：select 手动选择，候选列表默认为所有区域组 + DIRECT。

推荐配置参考 `Surge/README.md` 第五章（映射关系完全一致，不在此重复）。

---

## 五、DNS 配置（与 Clash Party 对齐）

| Loon 字段 | 对应 Clash 字段 | 值 |
|-----------|-----------------|------|
| `dns-server` | `default-nameserver` + `nameserver` | `223.5.5.5, 119.29.29.29, https://doh.pub/dns-query, https://dns.alidns.com/dns-query` |
| `doh-server` | `nameserver` + `fallback` | `doh.pub / alidns / 1.1.1.1 / 8.8.8.8` |
| `hijack-dns` | `hijack-dns` | `8.8.8.8:53, 8.8.4.4:53` |

**Loon 与 Surge 的 DNS 差异**：
- Loon 用 `doh-server` 作为 DoH 专用通道（Surge 用 `encrypted-dns-server`）。
- Loon 没有 `encrypted-dns-follow-outbound-mode`（Surge 独有）。

---

## 六、MMDB 数据库（⚠️ 必须 UI 操作）

**Loon 不支持在配置文件里指定 MMDB URL**（Surge 的独有优势）。你必须：

1. Loon → **设置** → **GeoLite2 数据库**。
2. 填入：
   ```
   https://fastly.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb
   ```
3. 点击 **下载**。

下载完成后，`GEOIP,CN,DIRECT` / `GEOIP,netflix,🇺🇸 美国流媒体` 等精准标签路由才会生效。若不替换 MMDB，只有 `GEOIP,CN` 能命中（Loon 内置库），其他标签规则会空跑。

---

## 七、Loon 独有能力

| 能力 | Loon | Surge |
|---|---|---|
| `[Remote Rule]` 规则集独立管理面板 | ✅ 原生支持 | ❌ 无对应面板 |
| `[Plugin]` 插件系统（脚本 + 规则） | ✅ 支持 | ❌ 无 |
| `[Script]` JS 脚本（签到/响应改写） | ✅ 原生 | ✅ 原生 |
| `configuration-enhanced` 增强插件库 | ✅ 生态丰富 | ❌ Surge Modules 体系 |
| 在配置里设置 MMDB URL | ❌ 只能 UI 下载 | ✅ `geoip-maxmind-url` |
| macOS 版本 | ❌ 仅 iOS | ✅ Surge Mac |

**本配置里 RULE-SET 放在 `[Rule]` 段内**（Surge 兼容语法，Loon 原生支持），没有拆到 `[Remote Rule]` 面板——这样做的好处是和 Surge 版保持 1:1 可 diff，减少维护成本；代价是在 Loon 的「规则源」UI 里不会出现独立条目，要管理订阅更新仍可以，但无法逐个 RULE-SET 启用/禁用。如果你偏好 Loon 原生面板，可以自行把 `[Rule]` 段的 `RULE-SET,<URL>,<policy>` 行迁移到 `[Remote Rule]` 段，格式：
```
https://example.com/rule.list, policy=POLICY, tag=some-tag, enabled=true
```

---

## 八、与 Clash Party 主线的差异（Loon 引擎限制）

| 差异 | 原因 |
|------|------|
| ❌ 无 Mihomo Smart 组 / LightGBM | Loon 不是 Mihomo 核 |
| ❌ 无 TLS 指纹注入 | Loon 不暴露 uTLS 控制 |
| ❌ PROCESS-NAME | iOS 无进程 API |
| ⚙️ GEOSITE → RULE-SET | Loon 同样只支持 RULE-SET + GEOIP |
| ⚙️ Meta `.mrs` → blackmatrix7 Loon `.list` | 格式兼容性 |

---

## 九、验证

1. Loon → **首页** → 应显示 `Loon Smart v5.2.3-Loon.1`，协议已启用。
2. **策略组** 面板应出现 37 组（9 区域 + 28 业务）。
3. 测试分流：
   - `chat.openai.com` → 🤖 AI 服务
   - `www.netflix.com` → 🇺🇸 美国流媒体（需 MMDB 替换后精准命中；否则靠 RULE-SET）
   - `www.bilibili.com` → DIRECT / 📺 国内流媒体
   - `raw.githubusercontent.com` → 📟 开发者服务

---

## 十、常见问题

### Q1：我能直接导入 Surge 的 `surge-smart.conf` 到 Loon 吗？
- 大部分字段兼容，但 `encrypted-dns-server` / `read-etc-hosts` / `exclude-simple-hostnames` / `geoip-maxmind-url` Loon 会报未知字段警告。建议用本目录的 `loon-smart.conf`。

### Q2：想要 Mihomo Smart + LightGBM 怎么办？
- Loon 做不到，需换客户端。iOS 上目前没有支持 JS 覆写 + LightGBM 的客户端；桌面端用 Clash Verge Rev / Mihomo Party。

### Q3：跨境场景切换？
参考 Surge 教程第十章「跨境场景」——操作完全一致。

### Q4：Loon 规则集更新周期怎么调？
- Loon → **设置** → **自动更新配置**。默认每次启动都会轮询。

### Q5：我想用 Loon 的插件（Plugin）生态？
- 本仓库的 `loon-smart.conf` 不依赖任何插件即可工作。你可以在 Loon 的「插件」面板额外叠加（例如去广告增强、签到脚本），不会冲突。

---

## 十一、致谢

- [Loon](https://apps.apple.com/app/loon/id1373567447)
- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) - Loon `.list` 规则源
- [Loyalsoldier/geoip](https://github.com/Loyalsoldier/geoip) - GeoIP MMDB
- 原版 Clash Party v5.2.3 所有参考作者
