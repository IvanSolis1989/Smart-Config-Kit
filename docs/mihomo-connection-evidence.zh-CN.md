# Mihomo 运行分流证据

[English](mihomo-connection-evidence.md) | **简体中文**

采集器读取 Mihomo 当前连接记录中的命中规则、策略链和目标，并可生成现有有序规则比较工具需要的样本。需要 Node.js 18 或以上版本，使用内置模块。

## 读取保存的快照

每个 `--input` 按输入顺序作为一个独立来源。文件可以是一份 `/connections` 原始对象，也可以打包同一内核、同一配置期间的多份快照。内核空闲时可能返回 `{"connections":null}`。

```json
{"snapshots":[{"connections":null},{"connections":[]}],"proxySnapshot":{"proxies":{}}}
```

```powershell
node tools/collect-mihomo-connections.js --input connections.json --proxies proxies.json
node tools/collect-mihomo-connections.js --input source-a.json --input source-b.json --output report.json --probes-output probes.json
```

单个来源可用 `--proxies` 传入 `/proxies` 原始响应。多个来源时，把对应的响应放入各自快照包的 `proxySnapshot`，以便按来源解释叶子类型。报告以输入顺序编号，并用 `s1-c1` 等编号替换原始连接 ID。两个来源的相同原始 ID 各自保留。同一来源跨快照重复看到的连接保留观测到的最大累计字节。单快照内重复 ID，或同一 ID 的命中证据互相冲突时，采集会报错。

## 采集本机控制器

使用已存在的回环 HTTP 控制器。需要认证时，在当前进程设置 `MIHOMO_SECRET`。

```powershell
node tools/collect-mihomo-connections.js --controller http://127.0.0.1:9090 --samples 3 --interval-ms 1000 --output report.json --probes-output probes.json
```

先读一次 `GET /proxies`，再顺序读取 `GET /connections`。地址仅接受 `127.0.0.1`、`[::1]` 和 `localhost`。后者直接映射 IPv4 回环，无需 DNS 查询。拒绝重定向、URL 凭据、额外路径和同时指定离线输入。若客户端使用本机 socket 或命名管道，可通过现有方式导出 JSON 后离线读取。

在线采集总时限 60 秒，单请求 5 秒。单响应或文件上限 8 MiB，合计 32 MiB。一次采集最多 120 份快照，单快照最多 10,000 行，合计最多 100,000 次观测和 10,000 条不同连接。报告输出到 stdout。指定报告和样本路径时，两者须为不同的新文件，且父目录已经存在。

## 解读报告

- `sources` 分别统计采样次数、空样本次数、连接观测次数和去重后的连接数。空样本反映采样瞬间，短连接可能没有被采到。
- `chains` 保留控制器返回顺序。Mihomo 的叶子位于索引 0。按明确的内置出口或本来源提供的叶子类型报告 `direct`、`reject`、`proxy` 或 `unknown`。这些字段描述已记录的出口，无法证明实际访问成功。
- 域名规则样本优先取 `sniffHost`，与核心的 `RuleHost` 相符。报告保留两种域名，用 `ruleHostSource` 标明选择层，并标出两者的差异。明确的空主机或 IP 字面量能说明当前没有域名，字段缺失则保持未知。看到目标 IP 时可作为 IP 样本，原规则命中时的 DNS 状态仍未知。
- `candidate` 表示观测到了 `Match`、`FINAL` 或本库的精确兜底策略组。后续应结合业务归属和最终配置判断是否需要修改规则。
- 报告剔除原始 ID、源地址、入站用户和完整进程路径等元数据，并隐去含敏感信息的源侧或逻辑规则载荷、常见内嵌凭据以及回显的控制器密钥。目标、节点名称和进程文件名仍可能涉及隐私。原始快照和报告留在 Git 之外，分享前核对内容。

## 用同一组样本比较规则

```powershell
node tools/validate-ordered-rule-semantics.js --baseline-ref HEAD --mode full --probes probes.json --output comparison.json
```

该命令将同一组采集样本用于 HEAD 和当前工作区，缺失的字段在静态比较中仍为未知。修改策略前，结合实际连接与正反样本核对。[规则质量与来源台账](rule-quality.zh-CN.md)

## 其他客户端的原生证据

- **Stash 5.0** 可用 `GET /rules/match` 配 `resolve=false` 检查合成目标，保留返回的规则、出口和可选 `stage`。`dns` 或 `ingress` 阶段的提前拒绝可能没有活动连接记录。 [Stash HTTP API](https://stash.wiki/en/features/http-api#rules) · [提前匹配选项](https://stash.wiki/en/rules/rule-types#pre-matching)
- **Surge Mac 6.9 或以上** 可用 `surge-cli rule explain` 取得当前规则和策略链，用 `surge-cli help rule explain` 看当前安装版本的用法。若有原配置、模块和规则集命中条目，随同记录。 [Surge 官方 CLI](https://manual.nssurge.com/tools/cli.html#routing-and-network-diagnostics-mac-690)

采集实现复用此前受 RouteCheck 启发的本库原型。官方 Mihomo 1.19.34 源码支持上述快照与链语义。另在隔离的 Windows Mihomo 1.19.32 localhost 测试中读到空闲时的 `connections:null`，对合成 `connect.example` 的两次采样均读回域名规则与 `DIRECT` 叶子。 [Mihomo API](https://wiki.metacubex.one/api/#connections) · [空闲快照](https://github.com/MetaCubeX/mihomo/blob/v1.19.34/tunnel/statistic/manager.go) · [域名选择](https://github.com/MetaCubeX/mihomo/blob/v1.19.34/constant/metadata.go#L262-L267) · [策略链方向](https://github.com/MetaCubeX/mihomo/blob/v1.19.34/constant/adapters.go#L76-L93) · [RouteCheck 固定源码](https://github.com/Seven1echo/RouteCheck/tree/44e5b7931660d0d106dc3ae7335f9549842cc9fc)

```powershell
node --test tools/tests/mihomo-connection-evidence.test.js
```
