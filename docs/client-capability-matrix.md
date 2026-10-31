<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-client-support-mobile.svg">
  <img src="assets/readme/page-client-support.svg" width="100%" alt="客户端能力与适配边界">
</picture>

# 跨客户端能力矩阵

按内核系列查找产品，再查看订阅输入、动态分组、节点 DNS 提示与可选 sidecar 四项能力。状态、mode 与证据逐项列出，便于在手机上阅读。

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="下载配置"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="文档目录"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="检查与排障"></a>
</p>

[下载配置](guide/downloads.md) · [文档目录](README.md) · [检查与排障](guide/dns-and-verification.md)

> 此文件由 `docs/client-capability-matrix.json` 生成。修改能力声明或证据后运行 `node tools/generate-client-capability-matrix.js`；CI 使用 `--check` 拒绝漂移。

这张矩阵描述的是**本仓库交付物拥有的适配 seam**，不是客户端宣传的协议支持列表：客户端能导入订阅，不等于本仓库可以在运行时读取、重写或投影该订阅。

- **内置自动**：产物有受信任的运行时 hook，能在刷新订阅时执行该能力。
- **手工文档**：仓库只提供本地配置 / Mixin / 原生字段的操作边界，不交付会读取机场源配置的自动 sidecar。
- **无 / 不适用**：该产物只拥有路由、shunt rule 或静态出站模型；不要把它当作订阅 DNS 转换器。

## 按系列查阅

- **Mihomo 内核系列**：[Clash Party（Smart / Normal）](#clash-party) · [Clash Meta for Android（CMFA）](#cmfa) · [OpenClash（Normal / Smart）](#openclash) · [FlClash 覆写脚本](#flclash)
- **Sing-box 内核系列**：[sing-box（1.14 / 1.13 静态配置）](#sing-box) · [Karing（原生自定义分流适配）](#karing)
- **Xray 内核系列**：[v2rayN Xray 路由 fallback](#v2rayn-xray)
- **双内核系列**：[Passwall](#passwall) · [Passwall2](#passwall2)
- **独立内核系列**：[Shadowrocket](#shadowrocket) · [Surge](#surge) · [Loon](#loon) · [Quantumult X](#quantumult-x) · [Stash](#stash) · [Egern](#egern)

## Mihomo 内核系列

<a id="clash-party"></a>

### Clash Party（Smart / Normal）

产物：[ClashParty(mihomo-smart).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js)、[ClashParty(mihomo).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo%29.js)

- **订阅输入 · 内置自动**
  JS 覆写入口直接接收订阅配置。

  `subscription_input` → `runtime_hook`。证据：[ClashParty(mihomo-smart).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js)

- **动态分组 · 内置自动**
  刷新时分类节点并重建固定策略组。

  `dynamic_grouping` → `runtime_hook`。证据：[ClashParty(mihomo-smart).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js)

- **节点 DNS 提示 · 内置自动**
  只投影活动节点 FQDN 的受限 DNS 提示。

  `node_dns_hint` → `restricted_projection`。证据：[ClashParty(mihomo-smart).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js)

- **可选 Node-DNS sidecar · 内置自动**
  profile 内置于覆写，非机场订阅字段。

  `optional_node_dns_sidecar` → `integrated_runtime_profile`。证据：[ClashParty(mihomo-smart).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js)

<a id="cmfa"></a>

### Clash Meta for Android（CMFA）

产物：[CMFA(mihomo).yaml](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)

- **订阅输入 · 手工文档**
  编辑 proxy-provider 的订阅 URL 后由客户端拉取。

  `subscription_input` → `provider_node_feed`。证据：[CMFA(mihomo).yaml](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)

- **动态分组 · 内置自动**
  Mihomo filter 在运行时按节点名选入区域组。

  `dynamic_grouping` → `engine_filter`。证据：[CMFA(mihomo).yaml](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)

- **节点 DNS 提示 · 手工文档**
  静态 YAML 需在本地 Mixin 合并节点 DNS。

  `node_dns_hint` → `manual_mihomo_overlay`。证据：[private-node-dns.md](../docs/private-node-dns.md)

- **可选 Node-DNS sidecar · 手工文档**
  不交付读取机场源配置的自动 sidecar。

  `optional_node_dns_sidecar` → `local_overlay_only`。证据：[private-node-dns.md](../docs/private-node-dns.md)

<a id="openclash"></a>

### OpenClash（Normal / Smart）

产物：[OpenClash(mihomo).sh](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo%29.sh)、[OpenClash(mihomo-smart).sh](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh)

- **订阅输入 · 内置自动**
  Ruby 覆写在落盘前读取原订阅配置。

  `subscription_input` → `runtime_hook`。证据：[OpenClash(mihomo-smart).sh](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh)

- **动态分组 · 内置自动**
  Ruby 覆写按订阅节点重建区域组。

  `dynamic_grouping` → `runtime_hook`。证据：[OpenClash(mihomo-smart).sh](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh)

- **节点 DNS 提示 · 内置自动**
  只将活动节点私有 DNS 投影到精确 policy。

  `node_dns_hint` → `restricted_projection`。证据：[OpenClash(mihomo-smart).sh](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh)

- **可选 Node-DNS sidecar · 内置自动**
  受信任的 shell profile 控制投影深度。

  `optional_node_dns_sidecar` → `integrated_runtime_profile`。证据：[OpenClash(mihomo-smart).sh](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh)

<a id="flclash"></a>

### FlClash 覆写脚本

产物：[FlClash(mihomo).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js)

- **订阅输入 · 内置自动**
  关联覆写后，JS 接收刷新后的订阅配置。

  `subscription_input` → `runtime_hook`。证据：[README.md](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/README.md)

- **动态分组 · 内置自动**
  刷新时分类节点并重建固定策略组。

  `dynamic_grouping` → `runtime_hook`。证据：[FlClash(mihomo).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js)

- **节点 DNS 提示 · 内置自动**
  只投影活动节点 FQDN 的 DNS 提示。

  `node_dns_hint` → `restricted_projection`。证据：[FlClash(mihomo).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js)

- **可选 Node-DNS sidecar · 内置自动**
  profile 内置于覆写，不能由订阅篡改。

  `optional_node_dns_sidecar` → `integrated_runtime_profile`。证据：[FlClash(mihomo).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js)

## Sing-box 内核系列

<a id="sing-box"></a>

### sing-box（1.14 / 1.13 静态配置）

产物：[SingBox(sing-box)-full.json](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json)、[SingBox(sing-box)-1.13.json](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-1.13.json)

- **订阅输入 · 手工文档**
  静态 JSON 需替换或接入节点出站。

  `subscription_input` → `manual_outbound_wiring`。证据：[README.md](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/README.md)

- **动态分组 · 手工文档**
  selector/urltest 只选择已接入的静态出站。

  `dynamic_grouping` → `static_selector`。证据：[SingBox(sing-box)-full.json](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json)

- **节点 DNS 提示 · 手工文档**
  须用 sing-box 原生 DNS 结构手工配置。

  `node_dns_hint` → `manual_native_config`。证据：[private-node-dns.md](../docs/private-node-dns.md)

- **可选 Node-DNS sidecar · 手工文档**
  不交付订阅 DNS 转换 sidecar。

  `optional_node_dns_sidecar` → `manual_native_config`。证据：[private-node-dns.md](../docs/private-node-dns.md)

<a id="karing"></a>

### Karing（原生自定义分流适配）

产物：[diversion_rules_custom.json](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/diversion_rules_custom.json)

- **订阅输入 · 手工文档**
  导入原生分流 JSON；节点订阅独立添加。

  `subscription_input` → `native_diversion_import`。证据：[README.md](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md)

- **动态分组 · 手工文档**
  代理规则默认当前选择，业务及区域节点组在 App 中绑定。

  `dynamic_grouping` → `app_managed_node_groups`。证据：[README.md](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md)

- **节点 DNS 提示 · 手工文档**
  DNS 由 Karing App 设置，原生分流文件不接管订阅 DNS。

  `node_dns_hint` → `app_managed_dns`。证据：[README.md](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md)

- **可选 Node-DNS sidecar · 无 / 不适用**
  不提供读取机场配置的 Node-DNS sidecar。

  `optional_node_dns_sidecar` → `not_provided`。证据：[README.md](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md)

## Xray 内核系列

<a id="v2rayn-xray"></a>

### v2rayN Xray 路由 fallback

产物：[v2rayN(xray).json](../Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/v2rayN%28xray%29.json)

- **订阅输入 · 无 / 不适用**
  JSON 只承担 Xray 路由，节点由 v2rayN 管理。

  `subscription_input` → `routing_only`。证据：[README.md](../Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/README.md)

- **动态分组 · 无 / 不适用**
  三出站 Xray fallback 没有节点分组重建。

  `dynamic_grouping` → `none`。证据：[README.md](../Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/README.md)

- **节点 DNS 提示 · 无 / 不适用**
  路由 fallback 不拥有 DNS runtime。

  `node_dns_hint` → `not_owned_by_artifact`。证据：[private-node-dns.md](../docs/private-node-dns.md)

- **可选 Node-DNS sidecar · 无 / 不适用**
  不应把路由 JSON 当作订阅 sidecar。

  `optional_node_dns_sidecar` → `not_applicable`。证据：[README.md](../Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/README.md)

## 双内核系列

<a id="passwall"></a>

### Passwall

产物：[Passwall(xray+sing-box)-apply.sh](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/Passwall%28xray%2Bsing-box%29-apply.sh)

- **订阅输入 · 无 / 不适用**
  本目录只交付 UCI shunt rule fallback。

  `subscription_input` → `uci_shunt_only`。证据：[README.md](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/README.md)

- **动态分组 · 无 / 不适用**
  shunt rule 不能表达 Mihomo 嵌套分组。

  `dynamic_grouping` → `none`。证据：[README.md](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/README.md)

- **节点 DNS 提示 · 无 / 不适用**
  shunt/UCI 参考不拥有 Mihomo DNS runtime。

  `node_dns_hint` → `not_owned_by_artifact`。证据：[private-node-dns.md](../docs/private-node-dns.md)

- **可选 Node-DNS sidecar · 无 / 不适用**
  不交付订阅 Node-DNS sidecar。

  `optional_node_dns_sidecar` → `not_applicable`。证据：[README.md](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/README.md)

<a id="passwall2"></a>

### Passwall2

产物：[Passwall2(xray+sing-box)-apply.sh](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/Passwall2%28xray%2Bsing-box%29-apply.sh)

- **订阅输入 · 无 / 不适用**
  本目录只交付 UCI shunt rule fallback。

  `subscription_input` → `uci_shunt_only`。证据：[README.md](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/README.md)

- **动态分组 · 无 / 不适用**
  精简 shunt 模型不拥有节点分组重建。

  `dynamic_grouping` → `none`。证据：[README.md](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/README.md)

- **节点 DNS 提示 · 无 / 不适用**
  shunt/UCI 参考不拥有 Mihomo DNS runtime。

  `node_dns_hint` → `not_owned_by_artifact`。证据：[private-node-dns.md](../docs/private-node-dns.md)

- **可选 Node-DNS sidecar · 无 / 不适用**
  不交付订阅 Node-DNS sidecar。

  `optional_node_dns_sidecar` → `not_applicable`。证据：[README.md](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/README.md)

## 独立内核系列

<a id="shadowrocket"></a>

### Shadowrocket

产物：[Shadowrocket.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/Shadowrocket.conf)

- **订阅输入 · 手工文档**
  用户在客户端另行添加机场节点订阅。

  `subscription_input` → `client_external_node_feed`。证据：[README.md](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/README.md)

- **动态分组 · 内置自动**
  策略组按节点名正则自动聚合。

  `dynamic_grouping` → `client_regex_filter`。证据：[Shadowrocket.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/Shadowrocket.conf)

- **节点 DNS 提示 · 手工文档**
  须使用 Shadowrocket 自己的 DNS 字段手工配置。

  `node_dns_hint` → `manual_native_config`。证据：[private-node-dns.md](../docs/private-node-dns.md)

- **可选 Node-DNS sidecar · 手工文档**
  不提供能读取机场 YAML 的自动 sidecar。

  `optional_node_dns_sidecar` → `manual_native_config`。证据：[private-node-dns.md](../docs/private-node-dns.md)

<a id="surge"></a>

### Surge

产物：[Surge.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/Surge.conf)

- **订阅输入 · 手工文档**
  用户将机场订阅作为子配置接入。

  `subscription_input` → `client_external_node_feed`。证据：[README.md](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/README.md)

- **动态分组 · 内置自动**
  url-test 通过节点名正则筛选候选。

  `dynamic_grouping` → `client_regex_filter`。证据：[Surge.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/Surge.conf)

- **节点 DNS 提示 · 手工文档**
  须用 Surge 原生 DNS 字段手工配置。

  `node_dns_hint` → `manual_native_config`。证据：[private-node-dns.md](../docs/private-node-dns.md)

- **可选 Node-DNS sidecar · 手工文档**
  不提供会读取机场源配置的自动 sidecar。

  `optional_node_dns_sidecar` → `manual_native_config`。证据：[private-node-dns.md](../docs/private-node-dns.md)

<a id="loon"></a>

### Loon

产物：[Loon.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/Loon.conf)

- **订阅输入 · 手工文档**
  用户在 Node 面板粘贴机场订阅。

  `subscription_input` → `client_external_node_feed`。证据：[README.md](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/README.md)

- **动态分组 · 内置自动**
  Remote Filter 的 NameRegex 自动筛选节点。

  `dynamic_grouping` → `client_regex_filter`。证据：[Loon.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/Loon.conf)

- **节点 DNS 提示 · 手工文档**
  须使用 Loon 自己的 DNS 字段手工配置。

  `node_dns_hint` → `manual_native_config`。证据：[private-node-dns.md](../docs/private-node-dns.md)

- **可选 Node-DNS sidecar · 手工文档**
  不提供读取机场源配置的自动 sidecar。

  `optional_node_dns_sidecar` → `manual_native_config`。证据：[private-node-dns.md](../docs/private-node-dns.md)

<a id="quantumult-x"></a>

### Quantumult X

产物：[QuantumultX.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/QuantumultX.conf)

- **订阅输入 · 手工文档**
  用户在 server_remote 手工填入订阅。

  `subscription_input` → `client_external_node_feed`。证据：[README.md](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/README.md)

- **动态分组 · 内置自动**
  policy 按 server tag 正则筛选节点。

  `dynamic_grouping` → `client_regex_filter`。证据：[QuantumultX.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/QuantumultX.conf)

- **节点 DNS 提示 · 手工文档**
  须用 QX 原生 DNS 字段手工配置。

  `node_dns_hint` → `manual_native_config`。证据：[private-node-dns.md](../docs/private-node-dns.md)

- **可选 Node-DNS sidecar · 手工文档**
  不提供读取机场源配置的自动 sidecar。

  `optional_node_dns_sidecar` → `manual_native_config`。证据：[private-node-dns.md](../docs/private-node-dns.md)

<a id="stash"></a>

### Stash

产物：[Stash.yaml](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash/Stash.yaml)

- **订阅输入 · 手工文档**
  编辑 Subscribe provider 的 URL 后由客户端拉取。

  `subscription_input` → `provider_node_feed`。证据：[README.md](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash/README.md)

- **动态分组 · 内置自动**
  继承 YAML filter 选择已下载的节点。

  `dynamic_grouping` → `engine_filter`。证据：[Stash.yaml](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash/Stash.yaml)

- **节点 DNS 提示 · 手工文档**
  生成产物不可手改，需客户端本地层合并。

  `node_dns_hint` → `manual_mihomo_overlay`。证据：[private-node-dns.md](../docs/private-node-dns.md)

- **可选 Node-DNS sidecar · 手工文档**
  不交付读取机场源配置的自动 sidecar。

  `optional_node_dns_sidecar` → `local_overlay_only`。证据：[private-node-dns.md](../docs/private-node-dns.md)

<a id="egern"></a>

### Egern

产物：[Egern.yaml](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Egern/Egern.yaml)

- **订阅输入 · 手工文档**
  用户在 Egern Profile 的 Subscribe URL 接入节点。

  `subscription_input` → `profile_external_node_feed`。证据：[README.md](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Egern/README.md)

- **动态分组 · 内置自动**
  Egern smart 区域组按其引擎规则选择节点。

  `dynamic_grouping` → `engine_smart_filter`。证据：[Egern.yaml](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Egern/Egern.yaml)

- **节点 DNS 提示 · 手工文档**
  静态 Profile 需在本地原生 DNS 层配置。

  `node_dns_hint` → `manual_native_config`。证据：[private-node-dns.md](../docs/private-node-dns.md)

- **可选 Node-DNS sidecar · 手工文档**
  不交付读取机场源配置的自动 sidecar。

  `optional_node_dns_sidecar` → `local_overlay_only`。证据：[private-node-dns.md](../docs/private-node-dns.md)


## 判定边界

- `runtime_hook` / `restricted_projection` 仅在 Clash Party、OpenClash、FlClash 的本仓库覆写入口中存在；其 profile 是本地受信任设置，不从订阅读取。
- `engine_filter`、`client_regex_filter` 与 `engine_smart_filter` 说明客户端可以用本产物已声明的正则 / smart 机制选择节点；它们不表示拥有订阅 DNS 的运行时写入权。
- `manual_mihomo_overlay` / `manual_native_config` 都要求用户在客户端自己的本地配置层合并 DNS；不能覆盖仓库的全局 DNS 基线，也不能把 Mihomo 字段直接复制到 Apple 私有配置、sing-box 或 Passwall。
- 每项能力的“证据”都是仓库内可机械校验的文件与 marker；`tools/validate-artifact-contracts.js` 会验证 schema、15 个产品、4 个固定列、文件存在性与 marker。

延伸阅读：[私有节点 DNS：受限投影与跨端边界](./private-node-dns.md)。
