<picture>
  <source media="(max-width: 600px)" srcset="../../../docs/assets/readme/page-substore-mobile.svg">
  <img src="../../../docs/assets/readme/page-substore.svg" alt="Sub-Store · 社区脚本索引：按用途寻找官方示例和社区思路；第三方脚本正文仅在明确授权且稳定时收录。" width="100%">
</picture>

# Sub-Store · 社区脚本索引

按用途寻找官方示例和社区思路；第三方脚本正文仅在明确授权且稳定时收录。

<p>
  <a href="../../../docs/guide/downloads.md"><img src="../../../docs/assets/readme/nav-downloads.svg" alt="配置下载" width="145" height="38"></a>
  <a href="../../../docs/README.md"><img src="../../../docs/assets/readme/nav-docs.svg" alt="文档中心" width="145" height="38"></a>
</p>

[官方参考](#官方语义与参数) · [社区方案](#社区方案与脚本) · [筛选原则](#筛选原则) · [脚本目录](../README.md)

---

索引记录日期：2026-05-11。链接用于参考，不代表全部脚本已在本仓库验收。

## 官方语义与参数

### Sub-Store 官方

[Sub-Store](https://github.com/sub-store-org/Sub-Store), [scripts/demo.js](https://github.com/sub-store-org/Sub-Store/blob/master/scripts/demo.js)

官方能力 / demo。官方支持脚本筛选、脚本操作、正则重命名、flag operator、sort operator 等基础能力。**收录方式：作为 API 语义参考。**

### Sub-Store Wiki

[脚本使用说明](https://github.com/sub-store-org/Sub-Store/wiki/%E8%84%9A%E6%9C%AC%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E), [链接参数说明](https://github.com/sub-store-org/Sub-Store/wiki/%E9%93%BE%E6%8E%A5%E5%8F%82%E6%95%B0%E8%AF%B4%E6%98%8E)

参数说明。`target`、`url`、`content`、`$options`、`#参数` 的使用边界。**收录方式：写入 README。**

## 社区方案与脚本

### dahaha-365/YaNet

[YaNet](https://github.com/dahaha-365/YaNet), [SubStore/readme.md](https://raw.githubusercontent.com/dahaha-365/YaNet/main/SubStore/readme.md), [Mihomo/global_script.js](https://raw.githubusercontent.com/dahaha-365/YaNet/main/Mihomo/global_script.js)

自建 SubStore + Mihomo 动态覆写。把 SubStore 当成多订阅入口；动态开关、区域定义、规则模块化。**收录方式：只记录思路，不复制脚本。**

### powerfullz/override-rules

[override-rules](https://github.com/powerfullz/override-rules)

SubStore/Mihomo 动态脚本。用 `#landing=true&loadbalance=true` 等参数控制落地、负载均衡、IPv6、fake-ip、QUIC、正则分组。**收录方式：只记录参数模式。**

### haoxianhan Gist

[sub-store-rename.js](https://gist.github.com/haoxianhan/1a0a58d5cd9826a4422e836459dfd763)

重命名脚本。地区识别、输出格式切换、保留倍率/专线/GPT/NF 标签。**收录方式：未见明确许可证，仅索引。**

### xream Gist

[cname_http_meta_beta.js](https://gist.github.com/xream/4c4083769f24f1a7b4d254aad6917cf1)

CNAME / HTTP META 查询重命名。入口/落地查询、缓存、批处理、HTTP META 参数化。**收录方式：高外部依赖，仅索引。**

### Tleon-H Gist

[substore-rename-operator-region-pack.js](https://gist.github.com/Tleon-H/336610b0973205ef633446c7438631d8)

区域重命名包。区域包、序号补齐、字段回退。**收录方式：未见明确许可证，仅索引。**

## 筛选原则

- 首选 Sub-Store 官方能力能覆盖的操作，比如 flag、regex rename、sort。
- 脚本只处理“订阅数据清洗”，不要在这里重写正式分流策略。
- 需要外部 API 的脚本默认不放进主流程，避免预览慢、失败率高、泄露节点信息。
- 没有许可证的 Gist 只放链接和借鉴点，不 vendor。
- 任何脚本参数示例都不能包含真实机场订阅 URL、token、UUID、password。
