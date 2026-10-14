# WIP 与最新 main 规则整合证据

整合基线为 `9d09baf5abe83c4a7080fe16b451594446bca108`，旧工作恢复树为 `df2bd395cf3884cf864dbb665f7efa428e75fe4d`。只迁移实际源差分与业务意图，旧客户端或生成物没有整体覆盖主线。保留 Claude Desktop 两个精确 AI 主机、测速/QUIC选项、默认关闭的 ZeroTier 开关以及来源/质量/发布治理。

源图 v6.0.18 为525归一化providers/984规则，生成149 Mihomo融合providers/168规则、81策略段、78非空SRS、107MRS和19条内联规则，unresolved=0。Egern152 profile规则/135引用/140原生资产；Sing-box97路由；Xray98项含1项禁用metadata；Passwall与Passwall2各78 shunt。

## 输入与转换边界

从已发布main的MRS与残余YAML按原Git blob身份反解冻结输入，使用核验过的Mihomo v1.19.32与sing-box v1.14.3。355个未归一化MRS文件的精确解码条目集合，以及62个未改变residual的完整谓词集合往返相等。二进制编码差异不因此被说成条目变化；它们的原始下载字节和上游commit仍未知，收据保留legacy-output-only及实际原blob清单。没有采用旧WIP的URL缓存覆盖较新的main输入。

只对无法从已发布独立输入还原的实际来源按现有provenance获取并保存字节收据，随后融合与Egern复用同hash。当前发布输入没有历史远端收据的部分不能由本次反解补成“已验证上游版本”。正常校验与quality读回使用已保存产物、代码、登记表和收据；完整离线再生需要原绑定缓存与转换器，干净克隆需要正常sync取得新的实际来源，不能推断原始远端内容。

`--source-snapshot`显式核对基线manifest的provider ID/URL、当前behavior/format、原生资产behavior和完整清单，再从绑定origin以显式官方转换器重新解码，核对包括完整residual的谓词集合。自报hash不构成转换证明；错provider、正确origin配错decoded、遗漏residual、behavior/format错配均拒绝。`--ids`采用staged输出，失败不发布，保留未修改的provider与资产收据。

## 业务范围与有限语义审阅

历史源证据与未确认候选保留在[2026-10-04审计](2026-10-04-routing-priority-audit.md)。Crisp relay仅是静态ASN重叠风险的推断性精确保护，不称已经发生真实错分。当前上游TikTok集合不再覆盖共享byteoversea后缀，故仅为旧WIP已审核案例`api.byteoversea.com`补精确TikTok规则；`vcs-sg.byteoversea.com`保留AI，不扩整个共享后缀。

带业务探针的审阅报告实际评估512个有限探针，因预算丢弃4,633,555个候选，138个结果涉及unknown；条目证据上限96且已截断。23条探针差异与WeGame、Microsoft/OneDrive、证书状态、下载、字节应用、AWS/Crisp、国内CDN及网易媒体这些业务修复对应。23不是所有真实路由变化；`foo.azureedge.net`当前仍为unknown，不能宣布确定分流。未把unknown改成匹配结论，也不声称全域或全IP等价。

报告计数1,159,347个entry changes包含段改号、重新分组、载荷去重及新增/删除，不能直接当作1,159,347条业务修复。355+62往返等价核验针对未归一化的独立已发布输入；有序语义报告针对最终重编的有限投影，两者对象与边界不同。CI默认参数另生成身份绑定的审阅报告和审批摘要；保存具体预算、unknown及截断证据，不无条件放行。

## 原生格式依据

本次沿用现有客户端语法，没有新增运行时字段。2026-10-14复核[Mihomo优先级与domain边界](https://wiki.metacubex.one/en/config/rules/)、[Stash规则集](https://stash.wiki/en/rules/rule-set)与[lazy测速](https://stash.wiki/en/proxy-protocols/proxy-groups)、[Egern规则](https://egernapp.com/docs/configuration/rules/)、[sing-box rule-set](https://sing-box.sagernet.org/configuration/rule-set/)、[Xray RuleObject](https://xtls.github.io/config/routing.html#ruleobject)、[Loon规则](https://nsloon.app/en/docs/category/%E8%A7%84%E5%88%99/)、[QX官方示例](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)，以及Passwall两版官方shunt编辑器；CMFA、OpenClash和FlClash核对各官方仓库。Surge与Shadowrocket在线规则页获取失败，保留既有格式和官方规范证据缺口，不新增其字段或声称真机兼容验收。

本次静态合同与实际原生转换器检查不替代真实设备、完整连接元数据、DNS、RE2及实时流量验收。仓库整合与云订阅静态投影也不改变这些限制。