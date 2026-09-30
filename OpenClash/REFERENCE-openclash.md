# OpenClash 配置参考文档

> 2026-09-30 补充：复核 [Mihomo inline 集合](https://wiki.metacubex.one/config/proxy-providers/) 与 [具名直连](https://wiki.metacubex.one/config/proxies/direct/)。Ruby 在写 YAML 前展平受控 payload、检查全部节点与引用；direct/reject 保留为依赖，只把远端代理计入测速候选。参数与 shell/Ruby 入口不变，两份实际 heredoc 回归通过。

> 更新于 2026-09-30（上次核对 2026-07-25）：实时 release 为 [v0.47.156](https://github.com/vernesong/OpenClash/releases/tag/v0.47.156)（2026-08-10）。复核 [官方覆写模板](https://github.com/vernesong/OpenClash/blob/v0.47.156/luci-app-openclash/root/etc/openclash/custom/openclash_custom_overwrite.sh#L1-L12) 与 [Ruby 处理示例](https://github.com/vernesong/OpenClash/blob/v0.47.156/luci-app-openclash/root/etc/openclash/custom/openclash_custom_overwrite.sh#L89-L110)，配置路径仍由首参数传入，Ruby/YAML 处理方式可继续沿用。本次倍率上限是本地脚本参数，通过有引号的参数传入 Ruby；不是新增 UCI 或 Mihomo 字段。空组采用已有 `REJECT` 策略，依据 [Mihomo proxies / empty-fallback 文档](https://wiki.metacubex.one/config/proxy-groups/)。release 的 Ruby 加载优化不改变本仓库节点规则源；本次仍以实际 heredoc 的执行与保存后 YAML 读回验收。

> 更新于 2026-07-25（上次获取 2026-05-31）：OpenClash 最新版 v0.47.133（2026-07-18）。从 v0.47.096 升级 37 个版本；复核 release 与官方 Wiki，未发现影响本仓库 shell 覆写入口、Ruby heredoc 处理或 UCI 覆写键的 breaking change。
>
> 更新于 2026-04-30（上次获取 2026-04-26）：OpenClash 最新版 v0.47.088（2026-04-10）。未发现 breaking change。覆写脚本格式、UCI 配置键无变更。
>
> 来源 URL:
> - https://github.com/vernesong/OpenClash/wiki (官方 Wiki，18 页)
> - https://deepwiki.com/vernesong/OpenClash/4-proxy-configuration (配置管理)
> - https://deepwiki.com/vernesong/OpenClash/4.2-proxy-groups (规则提供者与代理组)
> - https://github.com/vernesong/OpenClash (源码仓库)
> 获取日期: 2026-04-26

---

## 1. OpenClash 概述

OpenClash 是运行在 OpenWrt 上的 Clash 客户端 LuCI 插件，支持多内核：

| CORE_TYPE | 内核 | 说明 |
|-----------|------|------|
| `mihomo` | MetaCubeX mihomo | 推荐（Smart 版需要此内核） |
| `clash` | Dreamacro clash | 原版 Clash（已停维） |
| `clash-meta` | MetaCubeX mihomo | 旧名称，等同 mihomo |
| `clash-tun` | Clash Premium | 闭源 Premium 内核 |

本仓库的 **OpenClash Normal** 使用 `url-test` 退化（兼容 clash 内核），**OpenClash Smart** 使用 `type: smart` + `uselightgbm`（仅 mihomo ≥ v1.18.0）。

---

## 2. 覆写系统（Overwrite System）

OpenClash 最核心的特性是通过 **覆写脚本** 向订阅配置注入自定义内容，无需修改原始订阅。

### 2.1 覆写脚本文件

| 文件 | 作用 |
|------|------|
| `/etc/openclash/custom/openclash_custom_overwrite.sh` | 自定义覆写入口脚本 |
| `overwrite/default` | 默认覆写规则模板 |

### 2.2 覆写 YAML 字段（在本仓库的用法）

本仓库的 `OpenClash/OpenClash(mihomo).sh` 和 `OpenClash/OpenClash(mihomo-smart).sh` 通过 shell heredoc 生成**完整覆写 YAML**，写入 `$OVERRIDE_YAML` 文件，在 OpenClash 的覆写设置中引用。覆写 YAML 结构：

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

**关键限制**：
- 覆写 YAML 只能有 **1 个 `rule-providers`** 和 **1 个 `rules`** 顶层键（Ruby Psych `last-wins` 语义——重复键会静默丢弃前面的内容）
- 覆写 YAML 是"追加/合并"到最终配置，不是完全替换
- `proxy-groups` 的覆写需要通过 OpenClash 的内置代理组管理或自定义脚本

### 2.2a YAML 语法覆写脚本（v0.47.086+ 新能力）

自 v0.47.086（2026-04-07）起，OpenClash 支持 **YAML 语法覆写脚本**（除传统 shell 脚本外），并支持**按配置文件定向**覆写脚本。本仓库的 shell heredoc 方式仍然完全兼容。

### 2.2b v0.47.096 新增配置选项

- **全局 UA 覆写**（`global_ua`）：新增全局 User-Agent 覆写选项，默认 UA 已调整
- **MRS 默认**：绕过大陆规则默认使用 MRS 格式（本仓库 rule-providers 已全部使用 MRS，无影响）
- **移除自动防火墙转发端口绕过**：用户需通过源流量访问控制手动配置

### 2.3 UCI → YAML 处理管道

OpenClash 的 `yml_change.sh` 分三阶段将 UCI 配置转换为 Clash YAML：

1. **Initialization** — 验证订阅文件，准备环境
2. **Parallel Processing** — 并行处理 servers → `/tmp/yaml_servers.yaml`、proxy-providers → `/tmp/yaml_provider.yaml`、groups → `/tmp/yaml_groups.yaml`
3. **Integration** — 使用 Ruby 脚本合并和验证配置

---

## 3. UCI 配置关键字段

### 3.1 自定义规则提供者 (`uci config rule_providers`)

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

### 3.2 预定义规则提供者 (`uci config rule_provider_config`)

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

### 3.3 订阅管理关键字段

| UCI 选项 | 说明 | 默认值 |
|----------|------|--------|
| `sub_convert` | 使用在线转换服务 | `false` |
| `keyword` | 按关键词**包含**节点 | 空 |
| `ex_keyword` | 按关键词**排除**节点 | 空 |
| `sub_ua` | HTTP User-Agent | `clash.meta` |

### 3.4 游戏规则 (`uci config game_config`)

固定在 `/etc/openclash/game_rules/` 下，`type=file`，`behavior=ipcidr`。

---

## 4. OpenClash 覆写 vs 标准 Clash YAML 差异

| 差异点 | 标准 mihomo YAML | OpenClash 覆写 |
|--------|-----------------|---------------|
| proxy-groups 创建 | 直接在 YAML 声明 | 必须通过 UCI 或 Ruby 脚本动态生成 |
| rule-providers 注入 | 直接在 YAML 声明 | 通过覆写脚本 + heredoc YAML 注入 |
| 代理组管理 | `proxies` / `use` | 额外支持 `filter` 正则 + `exclude-filter` |
| 规则位置 | 固定顺序 | 支持 `position=0`（顶部优先）和 `position=1`（底部扩展） |
| 健康检查 | `health-check` 字段 | UCI 单独配置 |
| Ruby 处理 | 不使用 | `yml_groups_set.sh` 内部调用 Ruby 处理组 |

---

## 5. 本仓库 OpenClash 脚本架构

```
OpenClash/
├── OpenClash(mihomo).sh          # Normal 版（url-test 退化）
├── OpenClash(mihomo-smart).sh    # Smart 版（type: smart + lightgbm）
├── OpenClash(mihomo)-legacy.sh   # 旧版保留
└── README.md
```

两个 `.sh` 脚本的共同结构：

1. **头部注释** — 版本号、Build 日期、架构说明
2. **Shell 变量** — `VERSION_TAG`、`CORE_TYPE`、路径等
3. **Heredoc 覆写 YAML** — 生成的完整覆写配置写入 `$OVERRIDE_YAML`
4. **Ruby 代理组生成**（Smart 版）— 用 Ruby 脚本动态创建 Smart/url-test 组
5. **UCI 命令**（可选）— 通过 `uci set` 指令配置 OpenClash

### 4.1 关键实现细节

- **覆写 YAML 写入方式**：`cat > "$OVERRIDE_YAML" << 'OVERRIDE_EOF'` + `cat >> "$OVERRIDE_YAML" << 'OVERRIDE_EOF'` 追加
- **Ruby 嵌入方式**：`ruby -ryaml -e '...'` 行内执行
- **代理组动态构建**：Smart 版用 Ruby 的 `make_smart_group()` 函数按国家分类节点
- **rule-providers 数量**：Normal / Smart 均为 114 个最终融合 provider

---

## 6. OpenClash 校验机制

OpenClash 包含四层校验：

| 校验类型 | 说明 |
|----------|------|
| YAML Syntax | 确保生成的配置是合法的 YAML |
| Reference | 验证 proxy-group 引用的 provider/group 存在 |
| Rule | 检查规则引用的目标组存在 |
| Backup | 保留可回滚的配置备份 |

**常见陷阱**：
- Ruby Psych 对 YAML 重复顶层键使用 `last-wins`，会导致前面的内容被静默丢弃（本仓库曾在此犯错）
- `filter`/`exclude-filter` 使用 Go RE2 子串匹配，不是 word boundary（同 mihomo 行为）

---

## 7. 与 Clash Party 基线的降级差异

| 功能 | Clash Party JS 基线 | OpenClash Normal | OpenClash Smart |
|------|---------------------|-----------------|-----------------|
| 节点分类 | JS word-boundary regex | Ruby 子串匹配 | Ruby 子串匹配 |
| 区域组类型 | `type: smart` + lightgbm | `type: url-test` | `type: smart` + lightgbm |
| 区域组创建 | JS `upsertSmartGroup()` | Ruby `make_smart_group()` → url-test | Ruby `make_smart_group()` → smart |
| Fallback 链 | 区域空 → apacNodes → c.ALL | 同 | 同 |
| 业务组注入 | `injectBusinessGroups()` | 硬编码 YAML 锚点 | 硬编码 YAML 锚点 |
