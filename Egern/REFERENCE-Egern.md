# Egern 语法参考与纳入判断

> 2026-09-30 复核：[官方代理类型](https://egernapp.com/docs/configuration/proxies/) 不列 Mihomo 具名 direct/reject；未将 Mihomo 类型过滤字段映射为未经确认的 Egern 字段。本次仅从最终 CMFA 刷新派生元信息与哈希清单，原生规则资产与业务组内容不变。

## 结论

Egern 有必要并且已经作为正式同步产物纳入仓库。

Egern 的能力足够承载本仓库的分流模型：它有订阅型 `external` 策略组、区域 `smart` 选择、业务 `select` 组、顺序匹配规则、远端 `rule_set` 和 DNS forward。限制在于规则集格式：Egern 官方文档没有声明可直接消费 Mihomo `.mrs`，而是使用 Egern 自己的规则集字段。

因此 v5.4.39-egern.1 做正式同步：

- 从 CMFA 生成 `Egern/Egern.yaml`。
- 保留 22 个区域组 + 33 个业务组。
- 渲染 927 条 Egern 主规则 + 484 个顶层 `rule_set`。
- `rulesets/generated/egern/*.yaml` 的 Egern 原生规则集，其中包含由补充规则集转换来的 `provider-scki-*.yaml`。
- 不把零星单条域名/IP散写进主规则。

明确不做：

- Mihomo `.mrs` 不直接复用，映射为本仓库生成的 Egern 原生 YAML 规则集。
- 桌面 `PROCESS-NAME` 规则同步。

## 官方语法依据

- Policy Groups：Egern 支持 `select`、`auto_test`、`smart`、`fallback`、`load_balance`、`external`、`conditional`，且 `external` 可加载订阅。
  <https://egernapp.com/docs/configuration/policy_groups/>
- Rules：规则按出现顺序首个命中生效，`rule_set` 可引用本地或远端规则集。
  <https://egernapp.com/docs/configuration/rules/>
- Rule Sets：远端规则集使用 `domain_set`、`domain_suffix_set`、`domain_keyword_set`、`ip_cidr_set`、`ip_cidr6_set` 等 YAML 字段。
  <https://egernapp.com/docs/configuration/rules/>
- DNS：Egern 支持 `bootstrap`、`upstreams`、`forward`、`proxy_nameservers`，可表达本仓库的国内/国外/代理 DNS 分层。
  <https://egernapp.com/docs/configuration/dns/>
- Profile：主配置支持 `policy_groups`、`rules`、`dns`、`default_subscription_group`、`default_proxy_group` 等顶层字段。
  <https://egernapp.com/docs/configuration/example/>
- Mihomo Rule Providers：`format` 支持 `yaml` / `text` / `mrs`，`.mrs` 当前支持 `domain` / `ipcidr`；因此 `.mrs` 保留给 Clash Party / CMFA 使用。
  <https://wiki.metacubex.one/en/config/rule-providers/>

## 转换边界

1. Clash Party / CMFA 继续优先使用 `.mrs`，因为它是 Mihomo 官方支持的紧凑格式。
2. Egern 生成器把 `.mrs` URL 映射到 `rulesets/generated/egern/*.yaml`；Hagezi TIF 也落成本仓库 Egern 原生 YAML 规则集。
3. `GEOSITE` / 非国家 `GEOIP` 通过 MetaCubeX YAML 规则源表达；国家 `GEOIP,CN` 使用 Egern 原生 `geoip`。
4. `PROCESS-NAME` 不同步；这是平台规则能力缺失，不是预览范围缺口。
5. Mihomo DNS `nameserver-policy` 不逐字段照搬，改用 Egern `dns.forward`。
