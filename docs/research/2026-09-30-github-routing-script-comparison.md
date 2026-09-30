# GitHub 分流脚本搜索与横向比较

快照日期：2026-09-30 UTC。本报告补足首轮研究的搜索范围和直接脚本比较；本地实现基线为已推送的 `f0966c5309e4babdf9c070ff6faf7dba7ed0c67b`。首次报告混合了规则数据、配置模板、管理器和覆写脚本，不能据其项目总数判断直接脚本的覆盖程度。后续新增 direct/reject 节点保留、静态 inline provider 受限展平和 CMFA 原生类型筛选实现，见[运行时补充研究](2026-09-30-routing-runtime-followup.md)。

## 搜索方法与可核对证据

先通过 GitHub repository search 和网页搜索发现候选，再调用 GitHub REST `GET /search/repositories`，明确设置 `sort=stars&order=desc&per_page=100` 并补齐分页。以下八个查询共返回 **482 条命中，去重后 377 个仓库**；这是搜索候选数，**不是源码精读数量**。所有返回页均为 `incomplete_results=false`，每个查询抓取数量与其 `total_count` 一致。

查询、请求 URL、抓取时间、页数及每条结果的排名/仓库名/star 数保存在 [GitHub 搜索证据 JSON](2026-09-30-github-search-evidence.json)。排名只适用于记录的查询，不能声称是全 GitHub 无遗漏榜单。多个关键词查询采用交集，README 匹配又会带入大量无关项目；因此既做宽搜索，又做中文覆写、分流、语言和仓库名搜索，并阅读候选源码和目录树。

| 查询 ID | GitHub 查询 | 总命中 | 抓取页数 |
|---|---|---:|---:|
| 0 | `clash script in:name,description stars:>=100 fork:false` | 8 | 1 |
| 1 | `mihomo script in:name,description,readme stars:>=100 fork:false archived:false` | 137 | 2 |
| 2 | `clash 覆写 in:name,description,readme stars:>=100 fork:false archived:false` | 33 | 1 |
| 3 | `clash 分流 in:name,description stars:>=300 fork:false archived:false` | 17 | 1 |
| 4 | `clash-verge-script in:name,description stars:>=50 fork:false archived:false` | 2 | 1 |
| 5 | `mihomo override in:name,description,readme stars:>=100 fork:false archived:false` | 35 | 1 |
| 6 | `clash in:name,description,readme language:JavaScript stars:>=100 fork:false archived:false` | 210 | 3 |
| 7 | `mihomo in:name,description,readme language:JavaScript stars:>=100 fork:false archived:false` | 40 | 1 |

运行脚本重点筛选门槛为 100★，并对 50–99★及网页发现的更低星项目做补充审读；100★只是本次筛选门槛。规则数据/生成器的千星、万星仓库另作比较，不能将其 star 数算成 Mihomo 覆写脚本的排名。GitHub 将仓库主要语言识别为 JavaScript 也不表示其中存在分流入口。

## 直接运行的 Mihomo/Clash 覆写脚本

以下 **9 个仓库**均实际阅读过直接处理配置对象的源码，按当日 star 数降序排列。五个是首轮样本，四个是此次新增：Repcz、Perfect-Rules、selfproxy、HotKids。源码链接固定至对应默认分支快照提交；这是一组经筛选的比较样本，而不是 377 个候选的完整源码审计。powerfullz 用 TypeScript 维护源码，[实际导入的是编译后的 convert.min.js](https://github.com/powerfullz/override-rules/blob/f41f44b5b6ce54679dad0f981c82159b4f08f2e5/README.md#L33-L40)，表中 TS 是分析入口。

| 排名 | 仓库 | Stars | 分支 / 固定源码入口 | 阅读范围 | License（API SPDX） |
|---|---|---:|---|---|---|
| 1 | [Repcz/Tool](https://github.com/Repcz/Tool) | 1,166 | X / [Override.js](https://github.com/Repcz/Tool/blob/835041891c7cad2ee7edd22ede12197b77620fba/mihomo/Client/Override/Override.js) | 直接 JS；混合仓库按此单文件评估 | MIT |
| 2 | [n0de-sudo/Perfect-Rules](https://github.com/n0de-sudo/Perfect-Rules) | 953 | main / [Clash_mi.js](https://github.com/n0de-sudo/Perfect-Rules/blob/0a31165c1f70f2d548b49be5d1bb83a45ee06205/Clash/Clash_mi.js)、[FlClash.js](https://github.com/n0de-sudo/Perfect-Rules/blob/0a31165c1f70f2d548b49be5d1bb83a45ee06205/Clash/FlClash.js) | 两份实际入口及机场组保留逻辑 | API 未识别 |
| 3 | [AIsouler/MyClash](https://github.com/AIsouler/MyClash) | 897 | main / [mihomoScript.js](https://github.com/AIsouler/MyClash/blob/be777c8aaa563f0b5f83623c94f651f311559e57/Script/mihomoScript.js) | 开关、输入、倍率、重名、dialer | MIT |
| 4 | [xiaolin-007/clash-verge-script](https://github.com/xiaolin-007/clash-verge-script) | 819 | main / [扩展脚本-优化版.js](https://github.com/xiaolin-007/clash-verge-script/blob/66d3ae9937442f6e8ba97d3cf913f8da6b97966f/%E6%89%A9%E5%B1%95%E8%84%9A%E6%9C%AC-%E4%BC%98%E5%8C%96%E7%89%88.js) | Provider 检查、节点后处理、DNS | API 未识别 |
| 5 | [dahaha-365/YaNet](https://github.com/dahaha-365/YaNet) | 670 | main / [global_script.js](https://github.com/dahaha-365/YaNet/blob/0b6a25b65730732b37487e7dc3bf5b58461942c2/Mihomo/global_script.js) | 地区分类、倍率阈值 | BSD-3-Clause |
| 6 | [powerfullz/override-rules](https://github.com/powerfullz/override-rules) | 589 | main / [main.ts](https://github.com/powerfullz/override-rules/blob/f41f44b5b6ce54679dad0f981c82159b4f08f2e5/src/main.ts)、[node_parser.ts](https://github.com/powerfullz/override-rules/blob/f41f44b5b6ce54679dad0f981c82159b4f08f2e5/src/node_parser.ts) | 数组校验、节点分类、输出对象投影 | MIT |
| 7 | [yyhhyyyyyy/selfproxy](https://github.com/yyhhyyyyyy/selfproxy) | 545 | main / [script.js](https://github.com/yyhhyyyyyy/selfproxy/blob/06a98015e9803206fd72ee2b4f457f338bce4483/Mihomo/Extension_Script/script.js) | 全部 714 行；六组 VM 输入 | API 未识别 |
| 8 | [HotKids/Rules](https://github.com/HotKids/Rules) | 474 | master / [Clash/Script](https://github.com/HotKids/Rules/tree/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script) | 四个实际 JS 变体；典型入口输入比较 | API 未识别 |
| 9 | [echs-top/proxy](https://github.com/echs-top/proxy) | 184 | main / [mihomo_smart.js](https://github.com/echs-top/proxy/blob/e5e53ad5591b07d1324f802b0658d314cea91dc4/mihomo_smart.js) | inline provider、Smart、空组锚点 | API 未识别 |

YaNet 是沿首轮相关项目发现的候选，未出现在这八组查询中，因此不虚构其查询排名。它的 star/默认分支在补充阶段重新用 repository/commit API 核实。其他首轮脚本的元数据也再次核实。

License 列记录同日 API 的 `license.spdx_id`，未识别值不推断为允许复制；逐仓元数据附在搜索证据 JSON。星数保留检索快照：后续许可复核时 Perfect-Rules 为 954★、xiaolin 为 820★，与表中的 953★/819★属于不同取数时点，排序未变化。

## 源码取舍与本地适用性

### Repcz：原生 Provider 路径简洁，完整 DNS 覆盖存在取舍

入口先统计显式节点与 Provider，二者均为空即抛错：[输入门槛](https://github.com/Repcz/Tool/blob/835041891c7cad2ee7edd22ede12197b77620fba/mihomo/Client/Override/Override.js#L18-L25)。区域组用 `include-all: true` 和 `filter`，由 Mihomo 收集节点，因此能生成 Provider-only 配置，不要求 JS 先下载远程节点：[原生分组](https://github.com/Repcz/Tool/blob/835041891c7cad2ee7edd22ede12197b77620fba/mihomo/Client/Override/Override.js#L187-L232)。这是适合原生远程 Provider 的方式；本地当前分类器要处理实际节点、重名、倍率和 dialer，输入合同要求展平，不能只增加一个 `include-all` 就宣称两条路径等价。

代价是 DNS/hosts 整块覆盖，不保留样例中的机场私有解析：[覆盖代码](https://github.com/Repcz/Tool/blob/835041891c7cad2ee7edd22ede12197b77620fba/mihomo/Client/Override/Override.js#L41-L59)。VM 的香港与 Provider-only 输入各生成 17 组，无悬空静态组引用；完全空输入抛错且不修改输入；同名节点仍为两条，缺失 dialer 保留。空地区没有显式 `empty-fallback`，适用核心默认值。这是有效的原生配置生成路径，同时没有承担本仓库新增的节点歧义和链校验职责。

### HotKids：私有节点解析值得保留，主版与私人版须分别评估

主 `Script.js` 先识别有效显式节点及 Provider，空输入提前抛错：[输入](https://github.com/HotKids/Rules/blob/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script/Script.js#L39-L48)。地区组使用 `include-all-providers: true`，有 Provider 而无显式节点时去掉 `proxies` 字段交由核心收集；没有来源时用 `COMPATIBLE`：[分组与回退](https://github.com/HotKids/Rules/blob/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script/Script.js#L189-L235)。其三个私人变体则要求显式节点，例如 [MyScript.js](https://github.com/HotKids/Rules/blob/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script/MyScript.js#L41-L47)，不能按主版能力描述所有文件。

可取处是覆盖前采集私有 DNS 和当前节点的 hosts，再回填：[采集](https://github.com/HotKids/Rules/blob/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script/Script.js#L50-L69)、[回填](https://github.com/HotKids/Rules/blob/b8baf8424feda354d2079d151f868989cd3c44fa/Clash/Script/Script.js#L139-L146)。其 policy 通过公共 DNS 名称/IP 黑名单判断，不限于实际节点域名；本地已有 `SckiSubscriptionAdapter.captureNodeDns/applyNodeDns`，按活跃节点域名投影、校验值并脱敏报告，已有 JS/Ruby 回归覆盖，因此复用本地更明确的边界。

主版 VM 香港与 Provider-only 输入各生成 23 组，无悬空静态组引用；同名节点在节点池和地区组仍重复，缺失 dialer 保留；私有 DNS/hosts 样例回填成功。`MyScript.js` 另跑五种输入，Provider-only 提前抛错；其有效香港输入生成 29 组。其余两个私人变体只读源码，未声称执行 VM。主版原生 Provider 路径同样未做真实核心下载/拨号验证。

### Perfect-Rules：保留机场组有明确场景，输入预检仍需要独立处理

其可取处是按组名和实际节点组成识别机场基础组，再深拷贝并移除 `hidden`，让用户继续使用机场原有选择器。代码中的 `ratio` 是组成员的实际节点占比，不能解读成流量倍率：[机场组识别](https://github.com/n0de-sudo/Perfect-Rules/blob/0a31165c1f70f2d548b49be5d1bb83a45ee06205/Clash/Clash_mi.js#L775-L903)。这适合需要保留机场分组的用户；本仓库现有固定组体系和清理订阅组的设计没有这一需求，不直接加入另一个组保留启发式。

两个脚本从 `config.proxies` 收集名称，DNS 修改先于节点分类：[ClashMi 入口](https://github.com/n0de-sudo/Perfect-Rules/blob/0a31165c1f70f2d548b49be5d1bb83a45ee06205/Clash/Clash_mi.js#L1-L74)、[节点收集](https://github.com/n0de-sudo/Perfect-Rules/blob/0a31165c1f70f2d548b49be5d1bb83a45ee06205/Clash/Clash_mi.js#L330-L345)。对两份入口分别运行香港单节点、空数组、Provider-only、同名节点、缺失 dialer 五种输入：香港节点生成 15 组；空数组/Provider-only 生成 14 组，一键代理只含国内直连，所有组 `use` 均为空；重复同名仍出现在香港组；缺失 dialer 被保留。这说明它与本地的预检边界不同，不据此宣称上游承诺支持 Provider-only。

### selfproxy：DNS 数据生成清晰，空组回退和输入原子性需区分

生成的 fake-IP、nameserver-policy、hosts、rule-provider 块都有明确标记，并经工作流维护，便于追溯源数据：[生成字段](https://github.com/yyhhyyyyyy/selfproxy/blob/06a98015e9803206fd72ee2b4f457f338bce4483/Mihomo/Extension_Script/script.js#L16-L159)。本仓库已有 source graph → MRS → fused → 客户端生成链，可取其生成边界表达方式，不需要再建立第二套规则权威源。

入口仅检查 `proxies` 是否存在，随后先修改基础参数、DNS、hosts、TUN，再处理代理组：[入口](https://github.com/yyhhyyyyyy/selfproxy/blob/06a98015e9803206fd72ee2b4f457f338bce4483/Mihomo/Extension_Script/script.js#L1-L14)。地区匹配不到节点时返回 `["COMPATIBLE"]`，因此后面的非空过滤不会删掉这些地区组：[组过滤](https://github.com/yyhhyyyyyy/selfproxy/blob/06a98015e9803206fd72ee2b4f457f338bce4483/Mihomo/Extension_Script/script.js#L289-L301)、[回退函数](https://github.com/yyhhyyyyyy/selfproxy/blob/06a98015e9803206fd72ee2b4f457f338bce4483/Mihomo/Extension_Script/script.js#L705-L712)。实测只有香港节点时仍生成 28 组，18 个地区自动/手动组含 `COMPATIBLE`；空数组的 ALL 组节点列表为空；`proxies={}` 抛错时 DNS 已被修改；重复名进入 ALL 组；缺失 dialer 原样保留；没有 `proxies` 的 Provider-only 输入原样返回。

这里不把 `COMPATIBLE` 本身称为语法错误。Mihomo 官方明确规定 [empty-fallback 默认值为 COMPATIBLE](https://wiki.metacubex.one/config/proxy-groups/#empty-fallback)。本地筛选后全空选择 `REJECT` 是本仓库的失败行为约定；不能靠拷贝别人的 fallback 值改变它。

### 首轮直接脚本的横向结论

| 项目 | 可取之处 | 代价或边界 | 本仓库取舍 |
|---|---|---|---|
| MyClash | 配置开关、重名和 dialer 处理、明确 Provider 输入边界 | 倍率分档正则不是任意数值阈值；`0.59x` 可被 low 前缀误匹配；DNS/hosts 也会被改写 | 重新实现保守数值解析、等价去重、冲突拒绝和链校验；默认不启用倍率筛选 |
| xiaolin | 同时检查显式节点和 Provider 的存在性，后处理节点参数 | 看到 Provider 字段不等于远程节点已在 JS 内下载；同时完整覆盖 DNS | 保留实际输入形态校验，不搬整份配置 |
| YaNet | 数值阈值和单次分类流程容易理解 | 超上限分支跳过地区分类，原始节点仍留在全局池；不是实际删除节点 | 本地过滤有效节点池，随后验证 dialer 依赖 |
| powerfullz | 数组检查，模块化地区/成本分类 | 重建输出对象的字段投影不保留完整输入；Provider 兼容不能凭入口推断 | 校验先于写入，保留未知协议字段和原名 |
| echs-top | inline provider、Smart 及 `empty-fallback: REJECT` 表达简洁 | 同时改写全局配置/DNS；入口语义与本仓库不同 | 作为空组设计旁证，沿用现有本地实现 |

以上五项的逐行固定源码证据、MyClash 倍率探针、本地 14 个目录审计和实施验收见 [首轮研究报告](2026-09-30-routing-script-research.md)。特别是 MyClash 的 high 分档从 2 开始，`1.5x` 不命中 high 属于其分档定义，不能记成解析错误。

## 高星模板、规则数据与管理器

| 仓库 | Stars | 分类及证据 | 可取点和边界 |
|---|---:|---|---|
| [Lanlan13-14/Rules](https://github.com/Lanlan13-14/Rules) | 575 | main `36ac1b34ecb25e0be6b0c3d2b697d8fb003020be`；[配置定位](https://github.com/Lanlan13-14/Rules/blob/36ac1b34ecb25e0be6b0c3d2b697d8fb003020be/README.md#L46-L65)、[Substore 片段](https://github.com/Lanlan13-14/Rules/blob/36ac1b34ecb25e0be6b0c3d2b697d8fb003020be/Others/Substore.md#L56-L82) | 递归树 1,441 条中未发现独立 `.js/.mjs/.ts/.sh` 运行入口；文档供用户复制的片段不计入直接 JS 样本 |
| [mihomo-party-org/override-hub](https://github.com/mihomo-party-org/override-hub) | 572 | [覆写示例集合](https://github.com/mihomo-party-org/override-hub/blob/1c7c45c3512a22b5b3425eb2e6c101d4d45691ce/README.md#L1-L24) | 可学习字段和入口；不是统一的健壮订阅处理器，DNS 示例名称不构成系统 DNS 泄露测试证据 |
| [wangrongding/clash-kit](https://github.com/wangrongding/clash-kit) | 330 | [Node CLI 管理器](https://github.com/wangrongding/clash-kit/blob/9713cfa7662224d403ea429f5c643d967f5f6d34/README.md) | 管理内核、订阅、测速、系统代理；不将管理器职责放入覆写函数 |
| [dishao123/rules_script](https://github.com/dishao123/rules_script) | 328 | [配置链接目录](https://github.com/dishao123/rules_script/blob/262a2987cfa8f32b5c9da31765ee4c92a67829fd/README.md) | 名称有 script，但该快照提供 QX/Loon 配置，不能按名称算作 Mihomo 脚本 |
| [Accademia/Additional_Rule_For_Clash](https://github.com/Accademia/Additional_Rule_For_Clash) | 324 | [服务补充规则](https://github.com/Accademia/Additional_Rule_For_Clash/blob/0dff7831cdebc155ef57998fcd88ed20d977f788/README.md) | 本仓库已有对应规则来源；评估具体 provider 和规则顺序，不复制“零泄漏”等宣传结论 |
| [Seven1echo/Yaml](https://github.com/Seven1echo/Yaml) | 277 | [声明式 ClashMi 覆写](https://github.com/Seven1echo/Yaml/blob/08996f9236766ad7cb11ba1aace135f3e3503b1e/Seven1_fallback_Rule-Set_Clashmi_Overwrite.yaml#L1-L33)；[Sub-Store rename.js](https://github.com/Seven1echo/Yaml/blob/08996f9236766ad7cb11ba1aace135f3e3503b1e/sub-store/rename.js#L230-L249) | `empty-fallback: REJECT` 可参考；rename 提取保留倍率标签，属于订阅预处理。不能把其中 `ratio` 名称或标签处理称为实际倍率过滤；地区 lookaround 正则不直接搬入其他内核 |
| [Giveupmoon/OpenClash_Overwrite](https://github.com/Giveupmoon/OpenClash_Overwrite) | 233 | [OpenClash Smart 模块](https://github.com/Giveupmoon/OpenClash_Overwrite/blob/3ab3c170bd3303dc5f063679ca1df3383957936c/Overwrite/Overwrite-smart.conf#L1-L30)、[EN_KEY 注入](https://github.com/Giveupmoon/OpenClash_Overwrite/blob/3ab3c170bd3303dc5f063679ca1df3383957936c/Overwrite/Overwrite-smart.conf#L157-L172) | 分项开关可参考；依赖 OpenClash 装载与环境变量，不是可在 Clash Party/FlClash 直接运行的 JS |
| [chinnsenn/ClashCustomRule](https://github.com/chinnsenn/ClashCustomRule) | 158 | [规则库及订阅发布方案](https://github.com/chinnsenn/ClashCustomRule/blob/e0404bbb36258b4954b1527730413363936b22f9/README.md) | 多订阅由转换器聚合，经 Actions 校验发布；属于独立生成/发布流程 |

首轮还实际阅读了 Loyalsoldier（28,624★）、blackmatrix7（28,084★）、ShellCrash（13,321★）、ACL4SSR（6,750★）、Aethersailor（6,566★）、SukkaW/Surge（4,508★）、surgio（1,826★）和 DustinWin（1,416★）的代表源码。这些 star 数属于首轮同日快照，其类别、许可、优缺点及固定 SHA 均保留在首轮报告，不能把它们累加成九个直接脚本的榜单。

## 低于筛选门槛的补充审读

四个项目均实际读取了源码。它们不进入上述 100★ 直接脚本集合，不能用来填充“高星仓库”数量。

| 仓库 / Stars | 固定提交与源码证据 | 特点、代价和取舍 |
|---|---|---|
| [mwmi/ClashVergeGlobalScript](https://github.com/mwmi/ClashVergeGlobalScript) / 98 | `ec76f1ab79d0d5fabf49a43d948e521e4fa07a1c`；API 未识别 License；[两类输入分支](https://github.com/mwmi/ClashVergeGlobalScript/blob/ec76f1ab79d0d5fabf49a43d948e521e4fa07a1c/GlobalScript.js#L715-L851) | 仅 `proxies` 属性缺失/假值时走 Provider `use+filter` 分支；`proxies: []` 加 Provider 会走显式分支并因空名称返回，不生成这些地区组。分类子串和整套 DNS/规则覆写各有代价；本地要求 SubStore 展平，暂不加入该路径 |
| [Adsryen/clash-override](https://github.com/Adsryen/clash-override) / 57 | `b51956c511b5333282c38f68b0db0d5d7107f65b`；MIT；[开关](https://github.com/Adsryen/clash-override/blob/b51956c511b5333282c38f68b0db0d5d7107f65b/global_script.js#L31-L78)、[入口](https://github.com/Adsryen/clash-override/blob/b51956c511b5333282c38f68b0db0d5d7107f65b/global_script.js#L607-L630) | DNS override 默认关闭，倍率过滤默认开启；地区组阈值清楚，但检查 Provider 后仍直接调用 `config.proxies.map`。仅作静态观察，不宣称已执行其 Provider-only 探针 |
| [wchiway/mihomo-proxy](https://github.com/wchiway/mihomo-proxy) / 7 | `6d98bf76b04155e2194c9a07e42938e05d748197`；MIT；[FlClash 输入判断](https://github.com/wchiway/mihomo-proxy/blob/6d98bf76b04155e2194c9a07e42938e05d748197/src/flclash-main.ts#L97-L150)、[实际 include-all 分组](https://github.com/wchiway/mihomo-proxy/blob/6d98bf76b04155e2194c9a07e42938e05d748197/src/flclash-main.ts#L160-L202)、[重名处理](https://github.com/wchiway/mihomo-proxy/blob/6d98bf76b04155e2194c9a07e42938e05d748197/src/proxies.ts#L18-L65) | 有客户端专用变体；移动入口通过 Provider keys/include-all 支持两类来源，空来源回退 DIRECT，重名追加后缀，倍率用于排序。不能把移动入口支持外推到 desktop，也不采用改名和全空 DIRECT |
| [mowangmowang/clash-rule-scripts](https://github.com/mowangmowang/clash-rule-scripts) / 2 | `db5502aef1c2e4479fe0a64cabb19933298f9425`；MIT；[入口与分组](https://github.com/mowangmowang/clash-rule-scripts/blob/db5502aef1c2e4479fe0a64cabb19933298f9425/Clash_script_v1.js#L690-L770) | 客户端变体、开关注释易读；虽检查 Provider keys，后续分组仍依赖显式 proxies，并改写 DNS。可取文档组织，不移植配置全集 |

## 对本仓库的决定与验证边界

后续实现已超出本报告首轮结论：五个 JS/Ruby 运行时入口保留链引用所需的 direct/reject 定义、只将远端节点投影到自动选择组，并支持字段精确的静态 inline provider 集合；远程或附带额外语义的 provider 仍明确拒绝。CMFA 原生组使用 exclude-type 与 empty-fallback，并有 Mihomo controller 夹具收据。完整实现合同、14目录适用性和验收边界见[运行时补充研究](2026-09-30-routing-runtime-followup.md)。倍率筛选仍默认关闭；未采纳机场组保留、倍率排序、通用 Provider `use/filter` 或负载均衡。

Mihomo 的 [use / include-all / filter](https://wiki.metacubex.one/config/proxy-groups/)、[DNS 字段](https://wiki.metacubex.one/config/dns/)及 Clash Verge Rev 的 [main(config) 脚本入口](https://www.clashverge.dev/guide/script.html)在同日再次查阅。Provider 存在、节点已展开、运行时组引用覆盖三件事必须分别验证。

四个新增直接脚本仓库、六份实际文件的 **31 条 VM 探针结果**保存在 [配置变换探针证据](2026-09-30-routing-script-probes.json)，按仓库/固定 SHA/文件及输入场景记录。VM 只验证 JavaScript 配置变换，采用合成输入、不下载 Provider、不调用真实 DNS/网络、不安装依赖；不能据此断言内核启动成功或实际网络没有 DNS 泄露。上游未承诺支持的输入只用于比较其处理边界，不将行为差异一概报告为 bug。本轮未移植第三方源码、规则条目或策略全集；API 未识别 License 的仓库不推断为可自由复制。

本地结果由后续报告更新：节点筛选回归 73/73、三个 JS 覆写验证目标、严格 Ruby 合同 2,276 checks / 19 artifacts、PROCESS-NAME，以及 OpenClash 节点和 Node-DNS 测试各 2/2 通过；CMFA 有单独的 Mihomo controller 配置矩阵收据。搜索证据的分页/总数/去重/逐项 star 排序读回通过。规则权威源和 fused 基线仍为 v6.0.14；未改 source/upstream/provider/rule/DNS 内容，因而未运行远程规则同步或全规则生成。设备 UI、真实订阅下载和真实网络拨号不在这些验证范围内，具体边界见[运行时补充研究](2026-09-30-routing-runtime-followup.md)。
