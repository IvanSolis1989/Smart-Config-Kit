<picture>
  <source media="(max-width: 600px)" srcset="../assets/readme/page-downloads-mobile.svg">
  <img src="../assets/readme/page-downloads.svg" alt="配置下载" width="100%">
</picture>

# 配置下载

找到你的客户端，选择正确的配置格式，再按对应教程完成导入。

[![文档中心](../assets/readme/nav-docs.svg)](../README.md) [![导入后验收](../assets/readme/nav-verify.svg)](dns-and-verification.md#verification)

[项目首页](../../README.md) · [文档中心](../README.md) · [导入后验收](dns-and-verification.md#verification)

点击下载按钮打开 `main` 的 Raw 文件，右键可复制链接。**15 个客户端入口、19 个独立文件**均附导入教程；兼容入口可能指向同一文件。

[Mihomo](#mihomo) · [sing-box](#sing-box) · [Xray](#xray) · [双内核](#dual-core) · [独立客户端](#independent) · [Meow 适配](#meow)

## <a id="mihomo"></a>Mihomo 内核系

### Clash Party / Clash Verge Rev / Mihomo Party

JS 覆写需关联节点订阅；Clash Verge Rev 默认选 Normal，Smart 仅用于已安装 vernesong Smart 内核和模型的环境。

[![下载 Smart JS](../assets/readme/button-smart-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js) [![下载 Normal JS](../assets/readme/button-normal-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo%29.js) [![导入教程](../assets/readme/nav-tutorial.svg)](../../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/README.md)

### CMFA / ClashMi

原生 Mihomo YAML；ClashMi 的 TUN 由 App 托管，导入后仍需核对最终配置。

[![下载 CMFA YAML](../assets/readme/button-cmfa-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml) [![导入教程](../assets/readme/nav-tutorial.svg)](../../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/README.md)

### OpenClash

Smart / Normal SH 二选一，放入教程指定的固定自定义脚本入口；UI CONF 是配套 UCI 配置快照，分别上传，不能互换。

[![下载 Smart SH](../assets/readme/button-smart-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh) [![下载 Normal SH](../assets/readme/button-normal-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo%29.sh) [![下载 UI CONF](../assets/readme/button-ui-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo%29.conf) [![导入教程](../assets/readme/nav-tutorial.svg)](../../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/README.md)

### FlClash

推荐 JS 关联当前活动订阅，区域组使用 url-test；CMFA YAML 是静态备选，TUN 与端口由应用管理。

[![下载 FlClash JS](../assets/readme/button-flclash-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js) [![下载 备选 CMFA YAML](../assets/readme/button-cmfa-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml) [![导入教程](../assets/readme/nav-tutorial.svg)](../../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/README.md)

## <a id="sing-box"></a>sing-box 内核系

### sing-box / Hiddify / HomeProxy

Full 要求 sing-box 1.14.3+，已验官方 1.14.3；1.13 兼容文件已验官方 1.13.14。先替换示例节点，再检查实际内核和完整配置导入模式。

[![下载 sing-box JSON](../assets/readme/button-sing-box-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json) [![下载 sing-box 1.13 JSON](../assets/readme/button-sing-box-113.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-1.13.json) [![导入教程](../assets/readme/nav-tutorial.svg)](../../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/README.md)

Hiddify 4.1.1 优先核对 1.13 兼容文件与完整配置模式；官方内核检查不等于 App 导入及连接验收。HomeProxy 从 UCI 重建配置，尚无经验证的 Full JSON → UCI 转换器；不能承诺原样保留全部配置。

### Karing

仅导入自定义分流 JSON，业务代理指向 currentSelected；节点组、DNS、TUN 和默认动作在 App 手工设置。

[![下载 Karing 分流 JSON](../assets/readme/button-karing-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/diversion_rules_custom.json) [![导入教程](../assets/readme/nav-tutorial.svg)](../../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md)

## <a id="xray"></a>Xray 内核系

### v2rayN

优先按实际核心选择 Mihomo YAML 或 sing-box JSON；Xray JSON 仅用于路由设置导入，只有 proxy / direct / block 三类出口。

[![下载 mihomo YAML](../assets/readme/button-mihomo-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml) [![下载 sing-box JSON](../assets/readme/button-sing-box-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json) [![下载 Xray 路由 JSON](../assets/readme/button-xray-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/v2rayN%28xray%29.json) [![导入教程](../assets/readme/nav-tutorial.svg)](../../Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/README.md)

## <a id="dual-core"></a>Passwall 双内核系

### Passwall

全功能 LuCI 插件；本仓库 fused SRS 分流要求实际后端为 sing-box，脚本写入前会检查。

[![下载 Passwall SH](../assets/readme/button-passwall-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/Passwall%28xray%2Bsing-box%29-apply.sh) [![导入教程](../assets/readme/nav-tutorial.svg)](../../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/README.md)

### Passwall2

精简分流 LuCI 插件，与 Passwall 并行维护；本仓库 fused SRS 同样仅用于 sing-box 分流后端。

[![下载 Passwall2 SH](../assets/readme/button-passwall2-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/Passwall2%28xray%2Bsing-box%29-apply.sh) [![导入教程](../assets/readme/nav-tutorial.svg)](../../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/README.md)

## <a id="independent"></a>独立内核系

### Shadowrocket

使用 Shadowrocket 原生 CONF；按教程导入规则与策略，不与其他 Apple 客户端混用。

[![下载 Shadowrocket CONF](../assets/readme/button-shadowrocket-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/Shadowrocket.conf) [![导入教程](../assets/readme/nav-tutorial.svg)](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/README.md)

### Surge

使用 Surge 原生 CONF；DNS 字段与 Shadowrocket、Loon 不同，按本端教程设置。

[![下载 Surge CONF](../assets/readme/button-surge-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/Surge.conf) [![导入教程](../assets/readme/nav-tutorial.svg)](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/README.md)

### Loon

使用 Loon 原生 CONF；保留本端 DNS、Remote Filter 和规则语法。

[![下载 Loon CONF](../assets/readme/button-loon-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/Loon.conf) [![导入教程](../assets/readme/nav-tutorial.svg)](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/README.md)

### Quantumult X

使用 QX 原生 CONF；policy / filter_remote / filter_local 使用独立语法。

[![下载 Quantumult X CONF](../assets/readme/button-quantumult-x-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/QuantumultX.conf) [![导入教程](../assets/readme/nav-tutorial.svg)](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/README.md)

### Stash

使用从 CMFA 裁剪生成的 Stash YAML，兼容 Clash Premium；不提供 Smart + LightGBM 择路。

[![下载 Stash YAML](../assets/readme/button-stash-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash/Stash.yaml) [![导入教程](../assets/readme/nav-tutorial.svg)](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash/README.md)

### Egern

使用 Egern 原生 YAML 与适配规则集；不能直接消费 Mihomo MRS。

[![下载 Egern YAML](../assets/readme/button-egern-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Egern/Egern.yaml) [![导入教程](../assets/readme/nav-tutorial.svg)](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Egern/README.md)

## <a id="meow"></a>Meow 内核系

官方 Meow 和 AEROVE Lite 按客户端并列提供下载及教程。核心 -t 已验，各 App 完整导入与真实连接仍见[支持队列](../support-queue.md#meow)，不计入上方15个既有正式入口统计。

- **官方 Meow（Android / iOS）与官方核心**：[原生 YAML](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Meow%E5%86%85%E6%A0%B8%E7%B3%BB/Meow/Meow%28meow%29.yaml) · [导入教程](../../Meow内核系/Meow/README.md)。使用前替换模板节点订阅 URL。
- **AEROVE Lite**：[JS 覆写](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Meow%E5%86%85%E6%A0%B8%E7%B3%BB/Aerove%20Lite/AeroveLite%28meow%29.js) · [导入教程](../../Meow内核系/Aerove%20Lite/README.md)。需要 main(config) 宿主和已展开节点的订阅。

## 使用前确认

1. **客户端与内核**：以实际核心为准，v2rayN 等多核客户端尤其需要确认。
2. **导入类型**：脚本、完整配置、原生分流规则与 UCI 快照对应不同入口。
3. **已有节点**：本仓库不提供节点；先准备自己的可用订阅或节点。

客户端文件按内核系列归档，旧 Raw 地址随目录迁移而变化；使用旧地址的用户需重新导入。共享 rulesets 资产 URL 保持不变。多个机场合并可先阅读 [Sub-Store 教程](../../SubStore/README.md)。导入后执行 [运行验证清单](dns-and-verification.md#verification)，协议条件见 [客户端选择与支持](client-support.md)。

---

[← 项目首页](../../README.md) · [文档索引](../README.md)
