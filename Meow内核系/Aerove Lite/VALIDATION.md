[**English**](VALIDATION.md) | [中文](VALIDATION.zh-CN.md)

<a id="aerove-lite--meow-配置联调核查"></a>

# AEROVE Lite / Meow configuration integration validation

Candidate checks, historical production entry points and actual-device acceptance records referenced by the support queue. Dates and pinned revisions delimit each claim; this is not a declaration that today's application has passed every check.

[Usage](README.md) · [Support queue](../../docs/support-queue.md#aerove-lite-meow) · [Historical interface snapshot (Chinese source)](REFERENCE-AEROVE-Lite.md)

<a id="核查基线"></a>

## Review baselines

<a id="2026-10-27beta18-真实失败与新本地候选"></a>

### 2026-10-27: real beta18 failure and new local candidate

Pinned beta18 [`457fab8455ac8713fc9828e129d2050b11bf1beb`](https://github.com/IvanSolis1989/Aerove/commit/457fab8455ac8713fc9828e129d2050b11bf1beb), [run 40420651068](https://github.com/IvanSolis1989/Aerove/actions/runs/40420651068), attempt 1, executed the complete Smart case. Old three-shard `part-001` failed with `rule-provider trie exceeds 500000 nodes`. The pinned Rust reader reproduced rejection of old part-001 and part-002 and found the original 075 China-site asset also over budget. See [splitting evidence](RESOURCE-SPLITTING.md) for causes and counts.

All 111 projected MRS assets in new candidate `v6.0.20-meow.5` passed the pinned real Rust reader and unchanged application header/entry budgets. Both canonical and actual native-leaf sets have `missing=0 / added=0`; 23 component tests passed without skips. This does not include the full application checked matcher, native preflight, JNI, APK, HTTP or VPN. See [native-budget-evidence.json](native-budget-evidence.json) for pinned Rust source, reproduced old rejections and per-resource results.

<a id="历史-beta16真实资源拒绝与单项执行"></a>

### Historical beta16: real resource rejection and individual executions

The development session, pinned beta16 production source and Android execution records were reread. [Run 40335340043](https://github.com/IvanSolis1989/Aerove/actions/runs/40335340043) ended in failure. The completed items below do not mean the entire acceptance run passed.

| Completed item | Pinned source or actual execution evidence |
| --- | --- |
| Production Meow validator wiring | [LiteApplication.kt:122](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/app/src/main/java/dev/aerove/lite/LiteApplication.kt#L122) uses `CompatibilityValidator.forMeow`, injecting normal native, prepared native, rule preflight and verified features. The earlier unmigrated-factory item is resolved. |
| Three stages and prepared JNI pipeline | [ResourceBundleManager.kt:139](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/ResourceBundleManager.kt#L139) connects source → resource preflight → prepared. [MeowProfileValidator.kt:102](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/MeowProfileValidator.kt#L102) invokes real prepared native after sealing resources. Source wiring is connected, but this Smart case failed before complete prepared validation. |
| Logical rules, proxy/header and capacity wiring | [MeowCompatibilityValidator.kt:116](https://github.com/IvanSolis1989/Aerove/blob/d52726dc24756847b2b268d307a611cc37f994a3/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/MeowCompatibilityValidator.kt#L116) admits logical and Android metadata rules. Resource management passes provider proxy/header to the real JNI downloader. Resource capacity is unified at 256, with a 256-MiB bundle cap. Full logical conversion, custom-header transmission and end-to-end capacity boundaries still require execution acceptance. |
| QuickJS failure atomicity | `realQuickJsPreservesInputAndScriptFailuresCannotCommitPartialOverrides` returned 0 in actual Android execution, passing input preservation and rejection of partial overrides. |
| Real JNI named HTTP proxy and cancellation | `realJniNamedHttpProxyAndCancellationKeepWritersOwned` returned 0 in execution, covering CONNECT, no direct origin access, unknown-proxy failure and stopping writes after cancellation. Requests used empty headers, so custom-header transmission was not proven. |
| Native rule-file parsing | All four real JNI file-parse/corruption-rejection cases in `RuleFileNativeTest` returned 0 in execution. |

Actual records are under development-environment `lite125-remaining-readback/`: QuickJS and named-proxy cases in `job-0.log:6422–6428` and `:6436–6442`; file parsing in `job-0.log:6355,6369`, `job-1.log:6463`, `job-3.log:6398`. `STATUS-RECORDS.json` was checked with `phase=execution`. Discovery return 0 means only that tests were discovered.

The real Smart execution on beta16 `d52726dc24756847b2b268d307a611cc37f994a3`, [run 40335340043](https://github.com/IvanSolis1989/Aerove/actions/runs/40335340043), was rejected because an ad resource declared 411,634 records against a 250,000 per-resource admission limit. Neither discovery nor partial passes establish that case passed.

The old three-shard candidate later failed in real beta18 execution. A four-ad/two-China-site-shard candidate replaced it, preserving shared fused and official Meow YAML bytes. See [RESOURCE-SPLITTING](RESOURCE-SPLITTING.md) and [rule-assets/manifest.json](rule-assets/manifest.json) for provenance, licensing and remaining application acceptance. The new candidate has no passing pinned application/JNI/Android result yet.

Pending acceptance: integrate same-release scripts/resources into the pinned application; complete every resource preflight, trusted Geo context and prepared conversion; read back final YAML; verify custom-header transmission, resource update/recovery and final bundle budgets; finally test VPN, ads, China/international destinations and service exits. Completed source wiring is no longer listed as unimplemented.

The earlier pinned-commit review below remains historical; do not project its old production status onto beta16.

<a id="2026-10-24早期准入候选"></a>

### 2026-10-24: early admission candidate

Review time: 2026-10-24 11:06 UTC. The AEROVE development session was running. Application worktree was committed and clean at [5d2c2bb550ab54ae485837c1dec55e961e273dab](https://github.com/IvanSolis1989/Aerove/commit/5d2c2bb550ab54ae485837c1dec55e961e273dab). This records that moment; the candidate package was not necessarily integrated into that commit.

Candidate source was retained in development-environment `smart-config-meow-integration/`. The AndroidTest fixture pinned this repository to `764d275d66123e8ee6aaca393b29dbebe06a91e2`, not full APK acceptance of current file identities.

<a id="2026-10-24-历史候选检查"></a>

## 2026-10-24 historical candidate checks

| Item | Evidence and scope |
| --- | --- |
| Kotlin admission candidate | `kotlin-validator-01/tests.log`: JUnit 4.13.2, `OK (74 tests)`, 6.333 seconds. Covers three-stage admission, prepared resource-root interface, proxy/header transport contracts and logical rules. Uses injected implementations, not real native conversion. |
| AndroidTest candidate compilation | `script-android-01/verification.json`: SDK 36 AndroidTest compilation returned 0; two existing no-cast warnings retained. Android and QuickJS JNI were not run. |
| Rule fixture saved/read back | Same receipt records 149 real provider payloads read back; script and payloads total 4,387,986 bytes. Native payload parsing had not executed. |
| Native regression source | `native-schema-01/verification.json`: four new real conversion/resource/logical-rule regression sources; strict patch replay passed. `RustExecuted=false`, so this records source preparation only. |

These checks can support later integration, but do not prove production wiring or actual routing passed.

<a id="2026-10-24-历史生产接线与阻断"></a>

## 2026-10-24 historical production wiring and blockers

| Item | Pinned application source or blocker | Acceptance condition |
| --- | --- | --- |
| Import/resource-preparation validator | [LiteApplication.kt:88,96](https://github.com/IvanSolis1989/Aerove/blob/5d2c2bb550ab54ae485837c1dec55e961e273dab/apps/aerove-lite/app/src/main/java/dev/aerove/lite/LiteApplication.kt#L88) still creates/passes old `CompatibilityValidator`; its provider-field table does not admit proxy/header. | Wire candidate production factories such as `MeowProfileValidator` across import, preparation and startup. |
| Direct logical rules | Production [MeowCompatibilityValidator.kt:116](https://github.com/IvanSolis1989/Aerove/blob/5d2c2bb550ab54ae485837c1dec55e961e273dab/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/MeowCompatibilityValidator.kt#L116) does not admit AND/OR/NOT; the candidate adds them. | Integrate the candidate and pass complete native conversion with actual final configuration. |
| Trusted Geo resource context | `OPEN-BLOCKER.json`: string-only native validate reports `offline_geodata_resource_context_required` for five logical rules containing GEOSITE. | Supply a real immutable prepared-bundle directory and retain resource leases; do not delete rules or reduce validation to syntax-only. |
| Named-proxy/header downloads | Production [ResourceDownloader.kt:26](https://github.com/IvanSolis1989/Aerove/blob/5d2c2bb550ab54ae485837c1dec55e961e273dab/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/ResourceDownloader.kt#L26) fixes `Proxy.NO_PROXY`; management calls do not pass provider proxy/header. | Connect downloads to the real proxy graph and verify proxy selection, request headers, failure reporting and rule updates. |
| Resource-count limit | [ResourceBundleManager.kt:654](https://github.com/IvanSolis1989/Aerove/blob/5d2c2bb550ab54ae485837c1dec55e961e273dab/apps/aerove-lite/app/src/main/java/dev/aerove/lite/data/ResourceBundleManager.kt#L654) has `MAX_RESOURCES=128`, below the script's 149 sources; backup restore also caps at 128. | Unify bounded capacity across import/preparation/restore while keeping byte budgets and over-limit rejection. Development was in progress with no integration acceptance then. |
| Runtime assembly | Runtime composer already uses Meow schema; this does not replace import/preparation migration. | Read back host final YAML; verify rule order, resource paths and field ownership. |
| QuickJS / JNI / Android | Candidate receipts explicitly state `androidNotRun=true`, `nativeQuickJsNotExecutedLocally=true`. | Execute the current script in the target APK, read final YAML, pass complete native validation, then test VPN, ads, China/international destinations and service exits. Record emulator and physical-device results separately. |

See the [historical interface snapshot (Chinese source)](REFERENCE-AEROVE-Lite.md).

<a id="既有测试与-apk-的边界"></a>

## Boundaries of existing tests and APKs

Native [run 40080923015](https://github.com/IvanSolis1989/Aerove/actions/runs/40080923015) used source `2bfd4f0…`: 267 main tests, two child tests and 17 cfg-off tests passed, but the fourth Core command failed compilation with E0277. The remaining 22 commands and API/listener gate were not reached. Android was skipped, and the run ended in failure.

Old beta.9 APK source was `8d4bc572aa6b1984bd084e0d72d48b7c6b9f7e8e`, an earlier candidate. QA83 covered only 2/12 appearance combinations and four PNGs; functional tests included failure/cancellation. These results cannot establish current configuration wiring, physical-device VPN or routing acceptance.

Official meow-rs v0.26.1 configuration validation passed separately in this repository; see [official-core evidence (Chinese source)](../Meow/REFERENCE-meow-rs.md). It does not replace Lite host and real-connection checks.

<a id="保存证据指纹"></a>

## Saved evidence fingerprints

Paths below are relative to development-environment `smart-config-meow-integration/`. SHA-256 values came from actual reads in that review. Recheck applicability when artifacts change.

```text
kotlin-validator-01/tests.log
f101719b6caa58409c5ed15b7ddfd04ea963172f1a77d6b3fef14c82ce79f870

native-schema-01/verification.json
b51ff023e3d69a8221f3e4928e76a45cb66ba5a87a7ace6e9dda9133c2b57251

script-android-01/verification.json
c452eaf4fe6f3a5e3a66d3ba3727e95098eff93c738a2cddd7b0eb3d18e2dd14

script-android-01/OPEN-BLOCKER.json
2c37670f51ad1ffe5ab270f800eec7afb2be21ed6e00993428f80ca6781ac1d9
```
