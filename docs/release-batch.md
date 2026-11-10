<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-release-batch-mobile.svg">
  <img src="assets/readme/page-release-batch.svg" width="100%" alt="Technical guide">
</picture>

<a id="文件级自动刷新发布检查-v101"></a>
# File-level automatic-refresh release checks v1.0.1

**English** | [简体中文](release-batch.zh-CN.md)

Validate an automatic-refresh batch against a fixed Git baseline, exact file set, and full hashes. Generate a receipt, then check staging and commit results separately.

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="Downloads"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="Documentation"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="Checks and troubleshooting"></a>
</p>

[Downloads](guide/downloads.md) · [Documentation](README.md) · [Checks and troubleshooting](guide/dns-and-verification.md)

<a id="使用入口"></a>
## Entry points

1. Pin the pre-refresh `HEAD`, complete generation, and run existing checks.
2. Run preflight. Only after success, stage exactly the receipt’s `changedPaths`.
3. Check `--mode staged` after staging and `--mode committed` after committing.

`tools/validate-release-batch.js` binds an upstream refresh to a fixed Git baseline, exact file set, and complete output hashes. It only checks and emits receipts; it does not download, generate, stage, commit, pull, or push.

The contract at `rulesets/source/release-batch-contract.json` must already exist in the baseline and cannot change within the batch.

The design references [Aethersailor’s release-path checks](https://github.com/Aethersailor/Custom_OpenClash_Rules/blob/7027e18af58ac48e12a2cbbbde018dacdb2131f0/.github/workflows/auto-generate-rules.yml#L95-L230) from pinned research: explicitly allow paths and reject unexpected changes before release.

This implementation was written independently, without copying third-party rules, scripts, or workflow content.

<a id="覆盖范围"></a>
## Coverage

The contract’s `staticOutputs` enumerates exact paths for client files, derived supplemental rules, and quality receipts. MRS, fused, and Egern manifests supply dynamic asset filenames. The union of old/new manifests determines only which changes are allowed; the current manifest determines the complete output that must exist.

Old assets may be deleted only after leaving the current manifest. New assets must satisfy provider/segment filename rules and existing validators. Renames are checked as both deletion and addition.

Dynamic asset directories are also compared file by file against manifests. They cannot retain old assets, conceal a missing generated output, or contain undeclared files. Static-output directories receive no directory-wide permission: `独立内核系/Egern/unexpected.yaml`, for example, is still rejected.

The full Git work set is checked: baseline-to-worktree, index, unstaged, and untracked paths, read through Git’s NUL-delimited output. Git-ignored caches/local work directories follow `.gitignore` and are not part of the pending commit set; tracked files remain checked even if their names match ignore rules.

The gate does not print unknown-file contents. Symlinks, including ancestor directories, submodules, unmerged indexes, and mode changes to existing files are rejected.

Only the existing `BEGIN/END AUTO-GENERATED MIHOMO MRS OVERRIDES` block may change in the source graph. Content outside it is compared with the baseline after LF normalization. Other source files, generators, tool source, contracts, documentation, and workflows are outside automatic-refresh scope; they must enter the next baseline through a separate maintenance commit.

The contract’s only tool path, `tools/runtime/traffic-options.js`, is a generated output.

<a id="预检与精确暂存"></a>
## Preflight and exact staging

Pin the pre-refresh `HEAD`, complete generation and existing checks, then create a receipt outside the repository:

```bash
node tools/validate-release-batch.js --baseline-ref HEAD --output "$RUNNER_TEMP/release-batch.json"
```

Preflight runs the contract’s offline validators by default, including artifact contracts, JS overrides, process rules, asset budgets, `refresh-rule-quality.js --check`, and `validate-claude-service-dependencies.js --check`.

Claude service-dependency and supplemental-patch receipts are also exact static outputs. Quality checks reuse existing source-graph/manifest/semantic bindings; the gate additionally verifies Egern source graph, CMFA, profile, and all Egern asset hashes.

The full work set and covered hashes must remain identical before and after validators. Failure creates neither a new receipt nor staged changes.

Only after this command succeeds, stage each path from the receipt JSON’s `changedPaths` through an argument API. Do not enumerate directories again or interpolate JSON strings into a shell:

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

Any subsequent work-set change is rejected at the next check; staging cannot silently absorb new paths. A no-change batch has an empty `changedPaths` array and can report no-op without a commit.

<a id="暂存后与提交后检查"></a>
## Checks after staging and committing

```bash
node tools/validate-release-batch.js --check --receipt "$RUNNER_TEMP/release-batch.json" --mode staged
```

This requires `HEAD` to remain the receipt baseline, no unstaged/untracked content, an exactly matching index-change path set, and each current output’s blob/mode to match the receipt. The receipt stores baseline-wide SHA-256, current raw-worktree SHA-256, and Git-clean-filtered blobs. A CRLF worktree with LF index can pass, but equal-length content replacement, newline changes, or incomplete staging after the receipt fail.

Unchanged outputs are checked too.

After committing, run:

```bash
node tools/validate-release-batch.js --check --receipt "$RUNNER_TEMP/release-batch.json" --mode committed
```

The commit must be the sole direct child of the fixed baseline, with matching commit/index/worktree contents and the exact receipted change set. Checks do not automatically accept rebases, merges, or changed remote baselines. The release workflow owns serialization, ordinary fast-forward push, and remote-SHA readback. A changed baseline requires regenerating and validating the batch from that baseline.

`--output` accepts only an explicit absolute path outside the repository, including real-path checks of existing ancestors. Without it, output is JSON only. Check mode optionally accepts `--baseline-ref REF` to reassert the fixed receipt baseline. Default mode without `--check` is before-stage.

<a id="api-与验收"></a>
## API and acceptance

<details>
<summary>Maintainers: API, isolated tests, and acceptance boundaries</summary>

`tools/lib/release-batch.js` exports `createReleaseBatch({ repoRoot, baselineRef, runValidators })`, `checkReleaseBatch({ repoRoot, receipt, mode, baselineRef })`, and `writeExternalJson(repoRoot, output, value)`.

Production CLI uses the contract validators. `runValidators` is an injection point for isolated Git fixtures. Receipts are checking evidence within the same trusted workflow, not signatures or a security boundary against someone with repository/runner write access.

```bash
node --test tools/tests/release-batch.test.js
```

Temporary Git repositories test no-op, normal full batches, dynamic asset removal/addition, unknown files, out-of-scope renames, missing staging, missing outputs, equal-length tampering, source-graph/contract freezing, CRLF, modes/symlinks, validator failure, and absence of automatic staging. Tool changes on development branches are inherently outside automatic-refresh scope, so checking a development tree cannot establish successful release.

</details>

<a id="合同-101-的适用范围"></a>
## Contract 1.0.1 scope

The formal MRS provenance ledger, `rulesets/generated/mihomo-mrs/source-ledger.json`, belongs to the full release batch alongside assets. It must not be omitted or treated as an undeclared output-directory file.

The contract adds eight static Egern supplemental YAML paths: `bytedance-app-guard.yaml`, `game-cn-guard.yaml`, `intl-site-guard.yaml`, `microsoft-ai-guard.yaml`, `microsoft-live-guard.yaml`, `social-guard.yaml`, `stream-jpkr-guard.yaml`, and `tools-guard.yaml`.

During refresh, these paths must exist exactly as contracted and participate in hash checks like other static outputs.

A maintenance commit changing the source graph, tools, generation logic, or release contract is not an automatic-refresh batch against the old contract. Incorporate it into the new Git baseline first, then run subsequent refreshes from that baseline. The contract must still preexist in the refresh baseline and remain unchanged within the refresh batch.
