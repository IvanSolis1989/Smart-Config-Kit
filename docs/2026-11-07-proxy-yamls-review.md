# PROXY_YAMLS 借鉴评估与离线检查

研究日期：2026-11-07。上游固定快照：[EdisonLe12/PROXY_YAMLS@61ebe346](https://github.com/EdisonLe12/PROXY_YAMLS/tree/61ebe3465672a0c2dd945a92f047e57d479c317b)。SCK 初始对照基线：`5e28b84`；提交前已在 QX 修复后的 `63c9d1d` 重新验证。本次是维护工具更新，不改变客户端路由、DNS、策略组或发布版本。

## 结论

值得借鉴的是空组拒绝直连、稳定手选配合故障转移、倍率感知和推送流量单独考虑的设计思路。但不能直接用两份模板替换 SCK 的多客户端规则图，也不能据模板宣称已兼容 AEROVE Lite。上游没有测试/CI 或测量数据，性能与稳定性描述不是实际验收结果。

| 上游设计 | SCK 现状及本次决定 |
| --- | --- |
| `empty-fallback: REJECT` | SCK 三份 Mihomo JS 已有无存活节点时全局 `REJECT`、空地区组不生成的测试。保留现有机制，不给 Stash/Meow 等不支持的客户端添加字段。 |
| 手选 → Smart 的 fallback | 对固定出口和故障接续有价值，但会增加组层级；不是所有客户端支持 Smart。作为后续可选方案，不改现有 22 地区/33 业务组契约，也不承诺故障切换维持原 IP。 |
| 低倍率分组与优先级 | SCK 已有可选 `SCKI_MAX_NODE_MULTIPLIER` 和明确倍率解析。低价优先排序与“倍率上限”不是同一功能；前者留待跨端方案，不照抄正则或任意权重。 |
| 推送、Apple/Microsoft 与普通流量分开考虑 | 有服务场景价值；SCK 已有业务/DNS 投影。不能用“国内直连优先”笼统替代海外服务分流，需逐服务证据。 |
| 规则集复用、YAML 锚点 | SCK 已有来源图、MRS 融合及生成器。新增离线安全审计，检查 YAML 展开后的有效字段，避免只搜索原文误报。 |

## 本次具体落地

新增 `tools/audit-upstream-mihomo.py`：只读、离线审查待引入 Mihomo YAML，报告外部控制器宽监听、模板内置认证、实际生效的跳过证书验证、显式空组直连、TUN 绕过及悬空规则集引用。不访问订阅、不输出认证值/订阅 URL/节点名，不修改任何配置。解析失败也不回显可能包含密钥的原文。

```sh
# 环境依赖：Python 3 + PyYAML（仅开发检查，不进入客户端运行时）
python tools/audit-upstream-mihomo.py --format mihomo path/to/config.yaml
python -m unittest discover -s tools/tests -p 'test_upstream_mihomo_audit.py' -v
```

退出码：`0` 未发现所列问题，`1` 有人工复核项，`2` 输入/依赖/解析失败。`1` 不代表漏洞已确认；`0` 不代表配置安全或可直接导入。该工具不是核心 schema 验证器，不检查全部 TLS/DNS/分流风险，不支持 Egern schema。请仍用目标版本原生核心和实际客户端验证。

固定上游快照的实际扫描结果：4 个复核项，分别是宽监听、内置控制器 secret、内置代理认证和 TUN 排除。没有实际 provider 证书验证关闭告警，也没有悬空 TUN 引用。原因如下：

- `BaseProvider.override.skip-cert-verify: true` 确实存在于模板锚点，但当前四个 provider 都声明了自己的 `override` 映射。YAML merge 是浅合并，最终覆盖整个 `override`，所以不能把锚点中的 TLS 开关当作当前生效配置。若后续去掉该重写，风险可能重新出现。
- 该模板的 `Private-IP`、`Trackers-IP`、`China-IP` 均有定义，因此原模板引用不悬空。SCK 动态覆写保留 `tun`，却在清理/融合阶段替换 `rule-providers`，带入整份模板时必须对**变换后的输出**重新审计，不能只审源文件。本次回归覆盖了这种“替换前有效、替换后失效”的情况，没有擅自删改用户的 TUN 设置。

## 不直接采纳的内容与误判边界

1. **凭据与监听**：固定 secret/账号口令不能当成用户自己的凭据。`0.0.0.0:9090` 只说明非 loopback 监听，不证明已暴露到公网；是否可访问还取决于防火墙/网络。
2. **TUN 排除 China-IP**：绕过 TUN 后，流量不再按普通规则列表接受广告拦截或用户指定出口约束。这是路由语义变化，不是无条件的性能优化；路由集合字段和 `mips` 栈还依赖目标核心版本。
3. **倍率误判**：Mihomo 模板低倍率正则中的 `0\.[1-8]` 缺少数值边界，可把 `x10.1` 的子串 `0.1` 或节点 IP 中的同样文本识别为低倍率。“下载/实验”也不能证明计费倍率。SCK 继续使用明确倍率解析，不引入该宽泛正则。
4. **信息节点过滤**：`USE` 等子串可误伤名称如 `MUSE`，不能不加边界套用于真实节点。各正则引擎的前后查找、内联大小写标志支持不同，不能将 Mihomo/Egern 表达式直接移入所有客户端。
5. **Meta → AI**：整个 Meta 规则集指向 AI 会连带普通 Facebook/Meta 访问，不能仅凭 Muse 场景改变全部业务归属。
6. **全局 DoH 拒绝**：对 `Category-DoH`/加密 DNS IP 的拒绝可能影响合法应用；不能未经逐服务验证把防泄漏主张转成全局默认拦截。`no-resolve` 仅控制匹配 IP 规则时触发解析的行为，不能证明所有 DNS 都不泄漏。
7. **专用出口行为**：PikPak 区域检测拒绝、下载直连、个人域名和链式代理均有使用者场景，非通用默认策略。

## 客户端与来源边界

上游仅包含 `OneSmartProMCX.yaml`（Mihomo Smart 取向）和 `IOS_Egern_Yaml.yaml`（Egern）。Egern 原生 smart priorities/链式字段与 Mihomo 权重语义不同；不能平移到 Quantumult X、Surge、Stash、sing-box、Passwall 或 AEROVE Lite/Meow。此轮没有运行这些客户端，不声称新增兼容支持。

固定提交未包含 LICENSE。Mihomo 文件另外署名模板原作者 YYDS666，指向 [666OS/YYDS](https://github.com/666OS/YYDS)。本次只记录公开可观察的设计与字段并独立编写审计逻辑，**未复制分发上游模板、正则实现或规则集合**。后续若要移植具体代码/模板，应先查清原作者许可与再分发条件；有署名不等于获得许可证。

参考字段文档：[Mihomo TUN](https://wiki.metacubex.one/config/inbound/tun/)、[策略组公共字段](https://wiki.metacubex.one/config/proxy-groups/)、[代理集合](https://wiki.metacubex.one/config/proxy-providers/)。链接供后续目标版本核验，本次未将其中任何新字段写入客户端产物。

## 验证记录

- Python 单元测试 10/10 通过，含浅合并后有效配置、凭据不输出、loopback 不误报、空集合不误报、保留/替换规则集的引用差异。
- 现有订阅节点过滤测试 73/73 通过，确认既有倍率/空组保护行为。
- 固定上游 YAML 实扫完成，输出 4 个复核项。
- 未改变 QX `running_mode_trigger` 修复、客户端生成物、规则图、工作区现有修改；此维护更新不创建正式 Release。
