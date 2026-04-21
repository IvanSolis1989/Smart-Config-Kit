# OpenClash — 变更日志

> 覆盖 `OpenClash/openclash_custom_overwrite.sh`（Slim，轻量版）+
> `OpenClash/openclash_custom_overwrite_full.sh`（Full，完整版）。
>
> 两份脚本版本号各自独立递增，但主版本号跟随 Clash Party 主线。

---

## Slim（`openclash_custom_overwrite.sh`）

### v5.3.5-dedup-acc-china (2026-04-20)

- ★ 同步 Clash Party v5.2.5 FIX#23-P1：删除 `acc-china`（与 `geosite:cn` 纯重复；slim 从 v5.3.4 起已不含 `acc-geositecn`，本次只删 `acc-china`）
- 收益：slim provider 数 136 → 135；省 ~2 MB 内存 + 1 次冷启动 HTTP 拉取

### v5.3.4-align-dns-baseline (2026-04-20)

- ★ 对齐 Clash Party 基线 DNS（`Clash Party/README.md` 第 99-132 行）：
  - `use-hosts: true` → `false`
  - `default-nameserver` 从纯海外（1.1.1.1 / 8.8.8.8 / 9.9.9.9 …）改为基线顺序：`223.5.5.5 / 119.29.29.29 / 1.1.1.1 / 8.8.8.8`
  - `nameserver`: `223.5.5.5` DoH + `doh.pub` DoH（国内域名走国内解析）
  - `direct-nameserver`: 同 `nameserver`（走国内 DoH）
  - `proxy-server-nameserver`: `1.1.1.1` + `8.8.8.8` + `223.5.5.5` + `doh.pub`（4 项）
  - `fallback`: 仅 `1.1.1.1` + `8.8.8.8`（基线只列两个）
  - 删除非基线的 `direct-nameserver-follow-policy: false`
  - 移除"救援模式"注释（原救援模式已由 `nameserver-policy` 的 jsdelivr/github 直连策略覆盖）

### v5.3.3-align-rp-proxy-gfw (2026-04-20)

- ★ rule-providers `proxy: DIRECT` → `proxy: 🚫 受限网站`（136 处），对齐 Clash Party FIX#17-P0

### v5.3.2-dns-rescue-no-rules (之前)

- ★ 基础版本，含 DNS 冷启动救援 + 内存优化

### v5.3.1 性能基线（历史）

基于 `v5.2.4-oc` 针对 OOM 问题重构：

- **优化 #1** `geodata-loader: standard → memconservative`：节省 ~400–600 MB。`geosite.dat` / `geoip.dat` 改为 mmap 按需读取；代价：首次规则命中延迟 +几 ms（路由器场景无感）。
- **优化 #2** `rule-providers` 387 → 136（砍 65%）：节省 ~800–1,100 MB。
  - 合并 Google 家族（GoogleSearch / Drive / Earth / FCM / Voice → google 单项）
  - 合并 Apple 细分（AppleTV / News / Dev / Proxy / Siri / TestFlight / Firmware / FindMy → apple + icloud）
  - 删除区域化通讯分片（TelegramNL / SG / US、KakaoTalk、Zalo、GoogleVoice、iTalkBB）
  - 删除低频冷门（大陆长尾流媒体、欧洲 / 日本分区、非洲 / 南美 GeoRouting）
  - 删除冗余广告拦截（10+ 个功能重叠的 blackmatrix7 广告集）

保留不变：9 个 Smart 组（`uselightgbm: true + include-all-proxies: true`）、动态节点分类、DNS 多层架构、sniffer 配置、TLS 指纹注入、节点过滤、TCP 并发。

---

## Full（`openclash_custom_overwrite_full.sh`）

### v5.2.5-oc-full.1 (2026-04-20)

- ★ 同步 Clash Party v5.2.5 FIX#23-P1：删除 `acc-geositecn` + `acc-china`（与 `geosite:cn` 纯重复）
- 收益：full provider 数 387 → 385；省 ~5 MB 内存 + 2 次冷启动 HTTP 拉取
- Ruby Psych 解析验证：`providers=385 rules=975`（预期减 2 provider、减 2 rule line）

### v5.2.4-oc-full.1 (2026-04-20)

- ★ 同步 Clash Party v5.2.4 FIX#22-P0：snapchat rule-provider 拉取 403 修复
  - MetaCubeX meta-rules-dat 上游文件名是 `snap.mrs` 不是 `snapchat.mrs`
  - URL 改为 `.../geosite/snap.mrs`；path 改为 `./ruleset/meta-snap.mrs`
  - provider ID 保持 `snapchat`（`[Rule]` 段引用不变）

### v5.2.3-oc-full.2 (2026-04-20)

- ★ 对齐 Clash Party 基线 DNS（`Clash Party/README.md` 第 99-132 行）：
  - `use-hosts: true` → `false`
  - `default-nameserver`: `223.5.5.5 / 119.29.29.29 / 1.1.1.1 / 8.8.8.8`（基线顺序）
  - `nameserver / direct-nameserver`: `223.5.5.5` DoH + `doh.pub` DoH
  - `proxy-server-nameserver`: `1.1.1.1` + `8.8.8.8` + `223.5.5.5` + `doh.pub`
  - `fallback`: `1.1.1.1` + `8.8.8.8`
  - 删除非基线字段 `direct-nameserver-follow-policy`
  - 移除"救援模式"注释（功能仍在，靠 `nameserver-policy` 覆盖）

### v5.2.3-oc-full.1 (2026-04-20)

- ★ 同步 Clash Party v5.2.3 FIX#21-P1：BBC / Snapchat(Snap) 规则从 blackmatrix7 classical yaml 切换到 MetaCubeX meta-rules-dat 的 `.mrs` geosite（domain + mrs），消除 mihomo 对 `USER-AGENT,BBCiPlayer*` 与 `USER-AGENT,TikTok*` 的解析警告。
- ★ **CRITICAL FIX**：删除被意外追加在末尾的 slim `rule-providers`(136) + `rules`(678) 块（原文件 6115 行 → 4285 行）。Ruby 的 Psych YAML 解析器对重复顶层键遵循 "last-wins" 规则，之前这两个追加块会静默覆盖前面的 full 块，导致 `openclash_custom_overwrite_full.sh` 实际运行时跑的是 slim 内容，并且 slim 块里 ad-block providers 还错用了 `proxy: DIRECT`。修复后 OC full 真正实现了与 Clash Party 主线的规则数量对齐。
- ★ 头部注释按 `CLAUDE.md §1.3` 扩展（介绍 / 架构 / 变更日志 / 基线对齐声明）。

### v5.2.2-oc-full (初版)

- ★ 从 Clash Party v5.2.2 JS 主线转换为 OpenClash heredoc YAML + Ruby 处理器。
