# Clash Party — 变更日志

> 本文件是 `Clash Party/Clash Smart内核覆写脚本.js` 的完整变更日志。
> 本 JS 覆写脚本是仓库的**主线基线**，其它所有产物（CMFA YAML / OpenClash slim+full / Shadowrocket / SingBox / Surge / Loon / Quantumult X / v2rayN）跟随本版本。
>
> 主版本号 `v5.2.X`；主版本变更必须同步传递到所有 9 份产物的子版本号。

---

## v5.2.5 (2026-04-20)

- ★ **FIX#23-P1**：去冗余（方案 B 保守优化）——删除与 `metaDomain('cn', 'cn')` 重叠的 Accademia 国内规则源
  - 删除 `acc-geositecn`（`GeositeCN/GeositeCN.yaml`）——与 geosite:cn 字节级重复
  - 删除 `acc-china`（`China/China.yaml`）——与 geosite:cn + acc-chinamax 大面积重叠
  - 保留 `acc-chinamax`（独立的 ChinaMax 列表，有独特域名覆盖）+ `metaDomain('cn', 'cn')` + `metaIpCidr('cn-ip', 'cn')`
  - 收益：减 2 个 rule-provider（373 → 371），省 ~5 MB 内存 + 2 次冷启动 HTTP 拉取
  - 精度损失：0（acc-geositecn 完全重复；acc-china 的独特域名少到可忽略）
  - 同步到 9 产物：Clash Party JS / CMFA / OC slim / OC full / SingBox full（重新生成）；Shadowrocket / Surge / Loon / QX / v2rayN 不涉及（不使用 Accademia 命名空间）

## v5.2.4 (2026-04-20)

- ★ **FIX#22-P0**：`snapchat` rule-provider 拉取 403 Forbidden
  - v5.2.3 的 `metaDomain('snapchat', 'snapchat')` 指向 `geosite/snapchat.mrs`
  - MetaCubeX meta-rules-dat 上游实际文件名是 `snap.mrs` 不是 `snapchat.mrs`
  - 改为 `metaDomain('snapchat', 'snap')`：ID 保持 `snapchat`（规则引用不变）、URL 指向 `snap.mrs`
  - 已核对：`https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/snap.mrs` → HTTP 200

## v5.2.3 (2026-04-20)

- ★ **FIX#21-P1**：替换 bm7 BBC/Snap 规则源，消除 USER-AGENT 解析警告
  - bm7 BBC.yaml 含 `USER-AGENT,BBCiPlayer*`；bm7 Snap.yaml 含 `USER-AGENT,TikTok*`
  - Clash Party / mihomo 不支持 USER-AGENT 规则类型，reload 时产生 warning
  - 改为 Meta geosite provider：`metaDomain('bbc')` + `metaDomain('snapchat')`，保持规则覆盖并兼容解析
  - 注：v5.2.3 的 `metaDomain('snapchat','snapchat')` 有 filename typo，由 v5.2.4 FIX#22-P0 修正

## v5.2.2 (2026-04-13)

- ★ **FIX#20-P2**：PI.ai（`inflection.ai` / `pi.ai`）从 🤖 AI 服务 移至 🚫 受限网站（GFW）
  - PI.ai 在中国被 GFW 封锁，应归入受限网站组统一管理
  - 在中国：GFW 组选代理节点翻墙；在印尼：GFW 组选 DIRECT 直连
  - 无第三方 rule-provider 可用（bm7 / v2fly / MetaCubeX 均无独立规则），DOMAIN-SUFFIX 覆盖足够

## v5.2.1 (基于 04-01 ~ 04-09 日志分析，5 项修复)

- ★ **FIX#17-P0**：jsdelivr CDN 永久直连，消除 rule-provider 刷新 DNS 循环依赖
  - `RP_PROXY` 从 `BIZ.CLOUD_CDN` 改为 `BIZ.GFW`（受限网站组，中国代理 / 印尼直连）
  - `DOMAIN-SUFFIX,jsdelivr.net` 从 ☁️ 云与CDN 改为 🚫 受限网站（同组统一管理）
  - 修复前：04-06 单日 4,931 条 jsdelivr 失败（DNS resolve failed + i/o timeout）
  - 在印尼选 DIRECT 直连，在中国选代理节点绕墙，灵活切换

- ★ **FIX#18-P1**：删除已死的 ckrvxr 规则源（持续 404 Not Found）
  - 移除 `ckrvxr-antipcdn`（AntiPCDN）和 `ckrvxr-antifraud`（AntiAntiFraud）
  - provider 定义 + rules 数组引用同步清理，修复前累计 221 次 404 错误

- ★ **FIX#19-P1**：`DST-PORT,7680,REJECT` 规则顺序修复
  - 原位置在 `GEOIP,private,DIRECT` 之后，私有 IP（10.x.x.x）先匹配走 DIRECT
  - 修复：提前到 `GEOIP,private` 之前，确保 Delivery Optimization 流量被 REJECT

- ★ **FIX#20-P2**：`GSCService.exe` 加入 TUN `exclude-process`
  - fake-ip 模式下 `ip.cip.cc` 被分配假 IP，DIRECT 回连时 DNS 解析失败
  - 修复：排除 TUN 拦截，GSCService 直接走系统网络栈

---

## v4.5.5 ~ v5.2.0

历史版本（v4.5.5 至 v5.2.0）的详细变更历史过于庞大，未随迁移迁入本文件。
有追溯需要时，查询 git 历史：`git log --follow "Clash Party/Clash Smart内核覆写脚本.js"`。
