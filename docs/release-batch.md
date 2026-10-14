# 文件级自动刷新发布检查 v1.0.1

`tools/validate-release-batch.js` 将一次上游刷新绑定到固定 Git 基线、精确文件集合和完整产物哈希。它只检查、输出收据；不执行下载、生成、stage、commit、pull 或 push。合同位于 `rulesets/source/release-batch-contract.json`，必须已经存在于基线，且本批次不得改动合同。

设计参考冻结研究中 [Aethersailor 的发布路径检查机制](https://github.com/Aethersailor/Custom_OpenClash_Rules/blob/7027e18af58ac48e12a2cbbbde018dacdb2131f0/.github/workflows/auto-generate-rules.yml#L95-L230)：发布前明确允许路径并拒绝意外改动。本实现独立编写，没有复制第三方规则、脚本或 workflow 内容。

## 覆盖范围

合同的 `staticOutputs` 枚举客户端文件、派生补充规则和 quality 收据的确切路径；MRS、fused 和 Egern manifest 则分别导出动态资产文件名。两版 manifest 的并集只用于判断允许变更路径，当前版清单决定必须存在的完整输出。旧资产只有退出当前 manifest 后才允许删除，新增资产必须通过对应 provider/segment 文件名规则及既有 validator。rename 按删除和新增两端检查。

动态资产目录还会逐文件对照清单，不能留下旧资产、隐藏一个漏生成的输出或增加未声明文件。静态产物目录不提供目录级许可：例如 `Egern/unexpected.yaml` 仍会被拒绝。

整个 Git 工作集都参与检查：baseline 到工作区、index、unstaged、untracked，使用 Git NUL 输出读取路径。Git 已忽略的缓存/本地工作目录遵循仓库 `.gitignore`，不属于待提交工作集；受 Git 跟踪的 ignored 文件仍参与检查。gate 不打印未知文件内容。symlink（包括祖先目录）、submodule、未合并索引及既有文件 mode 变化均拒绝。

源图只有既有 `BEGIN/END AUTO-GENERATED MIHOMO MRS OVERRIDES` 块可以变化，其外内容按 LF 规范化后与基线逐字比较。其他源文件、生成器、工具源码、合同、文档和 workflow 的修改不属于自动刷新允许范围；它们应通过单独维护提交进入下一批基线。合同内唯一工具路径 `tools/runtime/traffic-options.js` 是生成产物。

## 预检与精确暂存

先固定刷新前的 `HEAD`，完成生成链路和既有检查，再生成仓库外收据：

```bash
node tools/validate-release-batch.js --baseline-ref HEAD --output "$RUNNER_TEMP/release-batch.json"
```

预检默认执行合同指定的离线 validators，包括 artifact contracts、JS 覆写、进程规则、资产预算、`refresh-rule-quality.js --check` 和 `validate-claude-service-dependencies.js --check`。Claude 服务依赖与 supplemental patch 收据也是确切静态输出。quality check 复用现有源图/manifest/语义收据绑定，gate 自身另外核对 Egern 源图、CMFA、profile 以及全部 Egern 资产哈希。validators 运行前后的完整工作集和覆盖哈希必须一致；失败不会产生新收据或 stage。

只在该命令成功后，从收据 JSON 的 `changedPaths` 数组用参数 API 逐路径暂存。不要重新列目录，不要将 JSON 字符串拼进 shell：

```javascript
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const receipt = JSON.parse(fs.readFileSync(process.env.RELEASE_BATCH_RECEIPT, 'utf8'));
if (receipt.changedPaths.length) {
  execFileSync('git', ['--literal-pathspecs', 'add', '--', ...receipt.changedPaths], {
    stdio: 'inherit',
  });
}
```

生成器之后发生的任何新工作集变化都会在下一步被拒绝，不能借暂存步骤自动吸收新路径。无变化批次的 `changedPaths` 是空数组，可以报告 no-op 并跳过提交。

## 暂存后与提交后检查

```bash
node tools/validate-release-batch.js --check --receipt "$RUNNER_TEMP/release-batch.json" --mode staged
```

这一步要求 `HEAD` 仍是收据基线、无 unstaged/untracked 内容、index 变更路径集合完全相等，并且每个当前产物的 blob 和 mode 与收据相符。收据既保存 baseline 全覆盖 SHA-256，也保存当前工作区原始字节 SHA-256 和经 Git clean filter 得到的 blob；CRLF 工作区与 LF index 可以正常验收，但收据之后的等长内容替换、换行变化或漏 stage 都会失败。未变化产物同样需要核对。

提交后可继续检查：

```bash
node tools/validate-release-batch.js --check --receipt "$RUNNER_TEMP/release-batch.json" --mode committed
```

提交必须是固定基线的唯一直接子提交，commit/index/worktree 内容一致，提交集合与收据一致。检查不自动接受 rebase、merge 或远端基线变化。串行 workflow、普通 fast-forward push 和远端 SHA 读回由发布 workflow 负责；需要改变基线时，应从新基线重新生成和验收批次。

`--output` 只接受明确的仓库外绝对路径（包括现存祖先目录的真实路径检查）；省略时仅输出 JSON。检查模式可选 `--baseline-ref REF`，用于再次断言收据固定的基线。没有 `--check` 的默认模式是 before-stage。

## API 与验收

`tools/lib/release-batch.js` 导出 `createReleaseBatch({ repoRoot, baselineRef, runValidators })`、`checkReleaseBatch({ repoRoot, receipt, mode, baselineRef })`、`writeExternalJson(repoRoot, output, value)`。生产 CLI 固定使用合同 validator；`runValidators` 是隔离 Git fixture 的测试注入点。收据是同一受信 workflow 内的检查证据，不是签名或抵御具有仓库/runner 写权限者的安全边界。

```bash
node --test tools/tests/release-batch.test.js
```

测试在临时 Git 仓库里核对 no-op、正常全批次、动态旧资产删除/新增、未知文件、rename 越界、漏 stage、完整产物缺失、等长篡改、源图/合同冻结、CRLF、mode/symlink、validator 失败和无自动 stage。开发分支中的工具改动本来就不属于自动刷新，因此不能把当前开发树检查当作发布成功证据。

## 合同 1.0.1 的适用范围

MRS 正式来源台账 `rulesets/generated/mihomo-mrs/source-ledger.json` 与规则资产一起纳入完整发布批次，不能遗漏或作为未登记文件混入输出目录。

合同增加了 8 个 Egern supplemental YAML 静态路径：`bytedance-app-guard.yaml`、`game-cn-guard.yaml`、`intl-site-guard.yaml`、`microsoft-ai-guard.yaml`、`microsoft-live-guard.yaml`、`social-guard.yaml`、`stream-jpkr-guard.yaml` 和 `tools-guard.yaml`。刷新时这些路径与其他静态输出一样必须按合同精确存在并参与哈希检查。

源图、工具、生成逻辑或发布合同发生维护变更时，该维护提交不适用以旧合同为基线的自动刷新 gate；先将维护提交纳入新的 Git 基线，再以该基线运行后续刷新。合同自身仍必须已存在于刷新基线，刷新批次不得修改它。
