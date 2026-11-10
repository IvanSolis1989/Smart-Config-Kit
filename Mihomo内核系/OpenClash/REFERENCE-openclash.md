<a id="openclash-配置参考文档"></a>
# OpenClash configuration reference

**English** | [简体中文](REFERENCE-openclash.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

> Reviewed on 2026-10-29: rechecked [Mihomo DNS](https://wiki.metacubex.one/config/dns/) and [hosts](https://wiki.metacubex.one/config/dns/hosts/). The added hosts-only value is a trusted-local profile in this repository's shell/Ruby code. It uses existing exact-IP hosts fields, with no new UCI/core syntax. The default adaptive behavior, heredoc DNS and node identities are unchanged.

> Reviewed on 2026-10-28: only reclassified GoogleFCM from downloads/updates to Google services. Rechecked [Mihomo routing rules](https://wiki.metacubex.one/config/rules/), retaining existing heredoc RULE-SET policy-name references without new UCI fields. DNS, fake-IP, sniffing, other push services and node groups are unchanged; no fields, minimum versions or device-pass claims were added.

> Reviewed on 2026-10-23 (previous focused review 2026-10-20): reread the [official OpenClash entry](https://github.com/vernesong/OpenClash) and [Mihomo DNS](https://wiki.metacubex.one/config/dns/#nameserver-policy). The same nameserver-policy is written into the existing heredoc, with no new UCI/core fields.

> Reviewed on 2026-10-19: the then-current stable version was v0.48.002 (2026-10-12), adding module security restrictions, core verification and adjusted default TUN behavior. Checked the fixed custom-script entry and ordinary modules' INI/AST boundary against this tag. Complete Shell scripts still execute through the fixed entry. Legacy Smart `strategy` was removed. Original release records, source and adoption decisions are in the [review report](../../docs/upstream/2026-10-19/mihomo/report.md). The historical summary below was not revalidated paragraph by paragraph.

> 2026-10-15 URL compatibility review: OpenClash rule-providers use Mihomo `type: http` / `url`; the [official Mihomo documentation](https://wiki.metacubex.one/en/config/rule-providers/) provides HTTPS raw URL examples. Only the host of repository-owned rule URLs changed, not the fields; see [`docs/rule-asset-delivery.md`](../../docs/rule-asset-delivery.md).

> 2026-09-30 addition: rechecked [Mihomo inline collections](https://wiki.metacubex.one/config/proxy-providers/) and [named direct proxies](https://wiki.metacubex.one/config/proxies/direct/). Ruby flattens controlled payload and checks all nodes/references before writing YAML. direct/reject remain as dependencies; only remote proxies enter speed-test candidates. Parameters and shell/Ruby entry points are unchanged. Both actual heredoc regressions passed.

> Updated on 2026-09-30 (previous review 2026-07-25): the live release was [v0.47.156](https://github.com/vernesong/OpenClash/releases/tag/v0.47.156) (2026-08-10). Rechecked the [official override template](https://github.com/vernesong/OpenClash/blob/v0.47.156/luci-app-openclash/root/etc/openclash/custom/openclash_custom_overwrite.sh#L1-L12) and [Ruby example](https://github.com/vernesong/OpenClash/blob/v0.47.156/luci-app-openclash/root/etc/openclash/custom/openclash_custom_overwrite.sh#L89-L110). The configuration path is still the first argument, so the Ruby/YAML processing approach remains applicable. The multiplier limit is a local script parameter passed to Ruby as a quoted argument, not a new UCI/Mihomo field. Empty groups use the existing `REJECT` policy, following [Mihomo proxies / empty-fallback documentation](https://wiki.metacubex.one/config/proxy-groups/). The release's Ruby loading optimization does not change this repository's node/rule sources. Acceptance still executes actual heredocs and reads back the saved YAML.

> Updated on 2026-07-25 (previous retrieval 2026-05-31): the latest OpenClash was v0.47.133 (2026-07-18), 37 versions after v0.47.096. Release/Wiki review found no breaking change affecting the shell override entry, Ruby heredoc processing or UCI override keys used here.
>
> Updated on 2026-04-30 (previous retrieval 2026-04-26): the latest OpenClash was v0.47.088 (2026-04-10). No breaking change was found; override-script format and UCI keys were unchanged.
>
> Source URLs:
> - https://github.com/vernesong/OpenClash/wiki (official Wiki, 18 pages)
> - https://deepwiki.com/vernesong/OpenClash/4-proxy-configuration (configuration management)
> - https://deepwiki.com/vernesong/OpenClash/4.2-proxy-groups (rule providers and proxy groups)
> - https://github.com/vernesong/OpenClash (source repository)
> Retrieved: 2026-04-26

---

<a id="1-openclash-概述"></a>
## 1. OpenClash overview

OpenClash is a LuCI plugin providing a Clash client on OpenWrt, with multiple core options:

| CORE_TYPE | Core | Description |
|-----------|------|------|
| `mihomo` | MetaCubeX mihomo | Recommended in the historical summary; it states that Smart requires this core |
| `clash` | Dreamacro clash | Original Clash, no longer maintained |
| `clash-meta` | MetaCubeX mihomo | Old name, equivalent to mihomo |
| `clash-tun` | Clash Premium | Closed-source Premium core |

The historical summary describes this repository's **OpenClash Normal** as a `url-test` fallback compatible with clash, and **OpenClash Smart** as `type: smart` + `uselightgbm`, “mihomo ≥ v1.18.0 only”. These are retained historical claims, not new verification that standard MetaCubeX builds support Smart-fork features; consult the dated review above for the reviewed core/module boundary.

---

<a id="2-覆写系统overwrite-system"></a>
## 2. Overwrite system

OpenClash's central feature is injecting custom content into subscription configuration through **override scripts**, without editing the original subscription.

<a id="21-覆写脚本文件"></a>
### 2.1 Override script files

| File | Purpose |
|------|------|
| `/etc/openclash/custom/openclash_custom_overwrite.sh` | Custom override entry script |
| `overwrite/default` | Default override-rule template |

<a id="22-覆写-yaml-字段在本仓库的用法"></a>
### 2.2 Overriding YAML fields in this repository

`Mihomo内核系/OpenClash/OpenClash(mihomo).sh` and `Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh` use shell heredocs to generate **complete override YAML**, write it to `$OVERRIDE_YAML`, and reference it in OpenClash override settings. Original illustrative structure follows; comments describe provider/rule injection, and group names are unchanged configuration identifiers.

```yaml
# 覆写规则提供者（注入到配置的 rule-providers 段）
rule-providers:
  my-rules:
    type: http
    behavior: domain
    format: mrs
    url: https://...
    path: ./ruleset/...
    interval: 86400
    proxy: '🚫 受限网站'

# 覆写规则（注入到配置的 rules 段；可在 prepend/append 位置）  
rules:
  - RULE-SET,my-rules,目标组
  - MATCH,🐟 漏网之鱼
```

**Key limitations**:
- Override YAML must have only **one top-level `rule-providers`** and **one top-level `rules`** key. Ruby Psych uses `last-wins`: duplicate keys silently discard earlier content.
- Override YAML is appended/merged into the final configuration, not a complete replacement.
- Overriding `proxy-groups` requires OpenClash's built-in group management or a custom script.

<a id="22a-yaml-语法覆写脚本v047086-新能力"></a>
### 2.2a YAML-syntax override scripts (new in v0.47.086+)

Since v0.47.086 (2026-04-07), OpenClash supports **YAML-syntax override scripts** alongside traditional shell scripts, and **configuration-file-specific targeting**. This repository's shell heredoc approach remains compatible.

<a id="22b-v047096-新增配置选项"></a>
### 2.2b Configuration options added in v0.47.096

- **Global UA override** (`global_ua`): a global User-Agent override option was added and the default UA adjusted.
- **MRS default**: mainland-China bypass rules default to MRS format. This repository's rule-providers already all use MRS, so this has no effect on them.
- **Automatic firewall forwarded-port bypass removed**: users must configure it manually through source-traffic access control.

<a id="23-uci--yaml-处理管道"></a>
### 2.3 UCI → YAML processing pipeline

OpenClash's `yml_change.sh` converts UCI configuration to Clash YAML in three phases:

1. **Initialization**: validate the subscription file and prepare the environment.
2. **Parallel Processing**: process servers → `/tmp/yaml_servers.yaml`, proxy-providers → `/tmp/yaml_provider.yaml`, and groups → `/tmp/yaml_groups.yaml` concurrently.
3. **Integration**: merge and validate configuration using Ruby scripts.

---

<a id="3-uci-配置关键字段"></a>
## 3. Key UCI configuration fields

<a id="31-自定义规则提供者-uci-config-rule_providers"></a>
### 3.1 Custom rule providers (`uci config rule_providers`)

Original example retained. Its comments identify required unique name, target configuration or all, provider type/behavior, destination group, position (0: top priority; 1: bottom extension), and extra directly injected YAML parameters.

```uci
config rule_providers
    option enabled '1'
    option name 'my-rules'           # 唯一标识（必填）
    option config 'all'               # 应用到哪个配置文件（或 'all'）
    option type 'http'                # http / file / inline（必填）
    option behavior 'domain'          # domain / ipcidr / classical（必填）
    option format 'mrs'               # yaml / text / mrs
    option path './rule_provider/my.yaml'
    option url 'https://...'
    option interval '86400'
    option group '🚫 受限网站'       # 规则流量路由的目标代理组（必填）
    option position '0'              # 0=优先级顶部, 1=扩展底部（必填）
    option other_parameters ''       # 直接注入的额外 YAML 参数
```

<a id="32-预定义规则提供者-uci-config-rule_provider_config"></a>
### 3.2 Predefined rule providers (`uci config rule_provider_config`)

```uci
config rule_provider_config
    option enabled '1'
    option config 'all'
    list rule_name 'lhie1-reject'
    list rule_name 'ACL4SSR-BanAD'
    option group 'AdBlock'
    option interval '86400'
    option position '0'
```

<a id="33-订阅管理关键字段"></a>
### 3.3 Key subscription management fields

| UCI option | Description | Default |
|----------|------|--------|
| `sub_convert` | Use an online conversion service | `false` |
| `keyword` | **Include** nodes by keyword | Empty |
| `ex_keyword` | **Exclude** nodes by keyword | Empty |
| `sub_ua` | HTTP User-Agent | `clash.meta` |

<a id="34-游戏规则-uci-config-game_config"></a>
### 3.4 Game rules (`uci config game_config`)

Stored under `/etc/openclash/game_rules/`, with `type=file` and `behavior=ipcidr`.

---

<a id="4-openclash-覆写-vs-标准-clash-yaml-差异"></a>
## 4. OpenClash overrides versus standard Clash YAML

| Difference | Standard mihomo YAML | OpenClash overrides |
|--------|-----------------|---------------|
| Creating proxy-groups | Declare directly in YAML | Generate dynamically through UCI or Ruby |
| Injecting rule-providers | Declare directly in YAML | Inject through override script + heredoc YAML |
| Proxy group management | `proxies` / `use` | Additional `filter` regex + `exclude-filter` support |
| Rule position | Fixed order | `position=0` (top priority) or `position=1` (bottom extension) |
| Health checks | `health-check` field | Separately configured in UCI |
| Ruby processing | Not used | `yml_groups_set.sh` calls Ruby internally for groups |

---

<a id="5-本仓库-openclash-脚本架构"></a>
## 5. This repository's OpenClash script architecture

Original directory illustration retained: Normal uses url-test fallback; Smart uses smart + lightgbm; the legacy version is retained.

```
Mihomo内核系/OpenClash/
├── OpenClash(mihomo).sh          # Normal 版（url-test 退化）
├── OpenClash(mihomo-smart).sh    # Smart 版（type: smart + lightgbm）
├── OpenClash(mihomo)-legacy.sh   # 旧版保留
└── README.md
```

Both `.sh` scripts share this structure:

1. **Header comments**: version, Build date, architecture.
2. **Shell variables**: `VERSION_TAG`, `CORE_TYPE`, paths, etc.
3. **Heredoc override YAML**: complete generated override configuration written to `$OVERRIDE_YAML`.
4. **Ruby proxy-group generation** (Smart edition): dynamically create Smart/url-test groups with Ruby.
5. **UCI commands** (optional): configure OpenClash through `uci set`.

<a id="41-关键实现细节"></a>
### 4.1 Key implementation details

- **Writing override YAML**: `cat > "$OVERRIDE_YAML" << 'OVERRIDE_EOF'`, then append with `cat >> "$OVERRIDE_YAML" << 'OVERRIDE_EOF'`.
- **Embedding Ruby**: inline execution through `ruby -ryaml -e '...'`.
- **Dynamic group construction**: Smart uses Ruby's `make_smart_group()` to classify nodes by country.
- **rule-providers count**: both Normal and Smart have 114 final fused providers in this historical record.

---

<a id="6-openclash-校验机制"></a>
## 6. OpenClash validation mechanisms

OpenClash includes four validation layers:

| Validation | Description |
|----------|------|
| YAML Syntax | Ensure generated configuration is valid YAML |
| Reference | Check that providers/groups referenced by proxy-groups exist |
| Rule | Check that rule destination groups exist |
| Backup | Retain configuration backups for rollback |

**Common pitfalls**:
- Ruby Psych uses `last-wins` for duplicate top-level YAML keys, silently discarding earlier content. This repository previously made that mistake.
- `filter`/`exclude-filter` use Go RE2 substring matching, not word boundaries, matching mihomo behavior.

---

<a id="7-与-clash-party-基线的降级差异"></a>
## 7. Fallback differences from the Clash Party baseline

| Feature | Clash Party JS baseline | OpenClash Normal | OpenClash Smart |
|------|---------------------|-----------------|-----------------|
| Node classification | JS word-boundary regex | Ruby substring matching | Ruby substring matching |
| Regional group type | `type: smart` + lightgbm | `type: url-test` | `type: smart` + lightgbm |
| Regional group creation | JS `upsertSmartGroup()` | Ruby `make_smart_group()` → url-test | Ruby `make_smart_group()` → smart |
| Fallback chain | Empty region → apacNodes → c.ALL | Same | Same |
| Service group injection | `injectBusinessGroups()` | Hardcoded YAML anchors | Hardcoded YAML anchors |

<a id="2026-10-20-业务-dns-policy-复核"></a>
### 2026-10-20 service DNS policy review

OpenClash's Mihomo DNS policy projection follows the [official Mihomo DNS documentation](https://wiki.metacubex.one/config/dns/): policy takes precedence over nameserver/fallback, node DNS is independent, and respect-rules requires `proxy-server-nameserver`. No changes to policy groups or node selection.
