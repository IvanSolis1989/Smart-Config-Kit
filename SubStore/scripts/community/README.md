[**English**](README.md) | [中文](README.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../../../docs/assets/readme/page-substore-mobile.svg">
  <img src="../../../docs/assets/readme/page-substore.svg" alt="Sub-Store community script index：Find official examples and community approaches by purpose. Third-party script bodies are included only with clear permission and sufficient stability." width="100%">
</picture>

# Sub-Store community script index

Find official examples and community approaches by purpose. Third-party script bodies are included only with clear permission and sufficient stability.

<p>
  <a href="../../../docs/guide/downloads.md"><img src="../../../docs/assets/readme/nav-downloads.svg" alt="Downloads" width="145" height="38"></a>
  <a href="../../../docs/README.md"><img src="../../../docs/assets/readme/nav-docs.svg" alt="Documentation" width="145" height="38"></a>
</p>

[Official references](#official-semantics-and-parameters) · [Community approaches](#community-approaches-and-scripts) · [Selection criteria](#selection-criteria) · [Script directory](../README.md)

---

Index date: 2026-05-11. Links are references, not evidence that all scripts passed acceptance in this repository.

<a id="官方语义与参数"></a>

## Official semantics and parameters

### Official Sub-Store

[Sub-Store](https://github.com/sub-store-org/Sub-Store), [scripts/demo.js](https://github.com/sub-store-org/Sub-Store/blob/master/scripts/demo.js)

Official capabilities / demo: script filters, script operators, regex renaming, flag operators and sort operators. **Use here: API semantics reference.**

### Sub-Store Wiki

[Script usage (Chinese source)](https://github.com/sub-store-org/Sub-Store/wiki/%E8%84%9A%E6%9C%AC%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E), [Link parameters (Chinese source)](https://github.com/sub-store-org/Sub-Store/wiki/%E9%93%BE%E6%8E%A5%E5%8F%82%E6%95%B0%E8%AF%B4%E6%98%8E)

Parameter reference: scope of `target`, `url`, `content`, `$options` and fragment parameters (`#参数`). **Use here: documented in the README.**

<a id="社区方案与脚本"></a>

## Community approaches and scripts

### dahaha-365/YaNet

[YaNet](https://github.com/dahaha-365/YaNet), [SubStore/readme.md](https://raw.githubusercontent.com/dahaha-365/YaNet/main/SubStore/readme.md), [Mihomo/global_script.js](https://raw.githubusercontent.com/dahaha-365/YaNet/main/Mihomo/global_script.js)

Self-hosted SubStore + dynamic Mihomo overrides: a multi-subscription entry point, dynamic switches, regional definitions and modular rules. **Use here: ideas only; scripts are not copied.**

### powerfullz/override-rules

[override-rules](https://github.com/powerfullz/override-rules)

Dynamic SubStore/Mihomo scripts use parameters such as `#landing=true&loadbalance=true` to control landing nodes, load balancing, IPv6, fake-ip, QUIC and regex groups. **Use here: parameter patterns only.**

### haoxianhan Gist

[sub-store-rename.js](https://gist.github.com/haoxianhan/1a0a58d5cd9826a4422e836459dfd763)

Renaming script: region detection, output-format switching and preservation of multiplier / dedicated-line / GPT / NF labels. **Use here: index only; no clear license was found.**

### xream Gist

[cname_http_meta_beta.js](https://gist.github.com/xream/4c4083769f24f1a7b4d254aad6917cf1)

CNAME / HTTP META lookup-based renaming: entry/exit lookups, caching, batching and HTTP META parameters. **Use here: index only because of substantial external dependencies.**

### Tleon-H Gist

[substore-rename-operator-region-pack.js](https://gist.github.com/Tleon-H/336610b0973205ef633446c7438631d8)

Regional renaming package: region packs, padded sequence numbers and field fallbacks. **Use here: index only; no clear license was found.**

<a id="筛选原则"></a>

## Selection criteria

- Prefer built-in Sub-Store capabilities such as flag, regex rename and sort.
- Scripts clean subscription data only; do not rewrite production routing policy here.
- Scripts requiring external APIs are excluded from the default main flow to avoid slow previews, increased failures and exposure of node information.
- For Gists without a license, retain links and design notes only; do not vendor their code.
- Script parameter examples must never contain real provider subscription URLs, tokens, UUIDs or passwords.
