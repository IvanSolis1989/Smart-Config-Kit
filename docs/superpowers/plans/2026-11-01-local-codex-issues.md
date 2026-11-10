<a id="本地-codex-issue-派单实施计划"></a>
# Local Codex Issue dispatch implementation plan

**English** | [简体中文](2026-11-01-local-codex-issues.zh-CN.md)

> Privacy: local directories, random run/session identifiers and real subscription-source identities are redacted in this public record. Versions, test results, technical limitations and public CI links are retained.

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

> **For agentic workers:** use superpowers:executing-plans by responsibility domain; validate a side-effect-free task before enabling.

**Goal:** automatically queue Issues durably; a local worker claims them and creates isolated Codex sessions to implement relevant changes, validate, push main normally and reply with results.

**Architecture:** GitHub Actions stores allowlisted metadata artifacts. A Windows worker polls/claims and uses official App Server stdio. Each task has an isolated working directory; GitHub temporary runners validate candidates before an outer serialized publisher pushes/replies. Persist local state; uncertain terminal outcomes forbid automatic replay.

**Tech Stack:** Node.js 22, built-in node:test, GitHub CLI, Codex CLI, PowerShell; no npm dependencies.

**Spec:** implementation recommendations confirmed by the user in the conversation. Automatically handle newly opened/reopened supported-category Issues by default; maintainers can redispatch with `/codex`.

<a id="约束与复用判断"></a>
## Constraints and reuse decisions

- Reviewed official App Server, codex queue, codex-action and MIT projects Wake/WakeWire. Wake mainly targets macOS/Linux with a different publication path; WakeWire's multiplatform webhook/routing layer exceeds local needs. Reuse official RPC/GitHub artifacts; implement only project-specific Windows claiming, durable state and publication restrictions.
- Do not copy CLI login credentials; reuse local login. Issue content is data only, never shell interpolation or permission to expand access, read secrets or change bridge infrastructure.
- Authoritative rules, cross-client synchronization/validation follow AGENTS.md. Dispatch tooling itself does not change client artifacts.
- First installation accepts only later tasks; retain offline tasks and deduplicate events. One publisher serializes main writes, without force-push.
- Smoke tasks validate dispatch/model responses only: no business-code changes, commits or public replies.

<a id="review-focus"></a>
## Review Focus

- Event reruns, multiple labels and repeated polls must not duplicate execution/replies.
- Download failures, process crashes, timeouts and post-push crashes retain evidence; uncertain outcomes must not be replayed unconditionally.
- Reject external repository URLs, disguised PRs, unauthorized comments and incorrect artifacts/metadata.
- If main advances, reject stale-base publication and preserve branch/recovery entry.
- Local login/restart, still-running tasks, persisted logs/state must be verifiable.

<a id="任务与验收"></a>
## Tasks and acceptance

- [x] Queue: local-codex-issue.yml, local-codex-queue.js, entries/tests; validate triggers/permissions/modes/metadata and mutual exclusion with MiMo mode.
- [x] Protocol: local-codex-app-server.js/tests; actual JSONL RPC, terminal states/timeouts/approval rejection, saved threadId.
- [x] Worker: local-codex-worker.js, CLI/tests; polling, durable state/single-instance lock, isolated checkout, validated publication, idempotent replies/interruption recovery.
- [x] Windows: install/uninstall, hidden operation, login autostart, separate runtime/config; retain state and enabledAfter.
- [x] Documentation: update automation docs/repository changelog; provide status/pause/retry entries and boundaries.
- [x] Acceptance: relevant offline tests/repository precommit checks; actual local read-only session; cloud smoke artifact → local session → success receipt; no public comments/business changes.
- [x] Enable publication: commit scoped paths/push main, check CI, configure LOCAL_CODEX_ENABLED, register/start worker, retain actual status.

<a id="当前状态"></a>
## Current status

Pushed `23cea9c3`, `f62c6bf2` and enabled `LOCAL_CODEX_ENABLED=true`. Actual cloud queue run `41253355774` succeeded; local worker claimed `<redacted-local-task>`, and session `<redacted-local-identifier>` returned `BRIDGE_SMOKE_OK`, without an Issue test comment. After the Linux CI fix, run `41253651242` passed 99/99 tests; candidate validation `41253679257` actually passed all four repository checks. Local Windows checks reported generated drift, but the same SHA passed CI, so main artifacts cannot be deemed stale on that basis; changes were not expanded to client artifacts.

Windows autostart failure was traced to MSIX LocalAppData redirection. The installer now resolves physical paths via actual file handles; after repair, the scheduled task started outside the App process and polled successfully, with logs/install receipts retained. Login-trigger verification awaits the user's next login; do not proactively restart the computer. The user's added fixed-model requirement was delivered: `b5f6c5c2` explicitly sets GPT-6.1 Sol + ultra, validating the account catalog, thread return value and every turn request, forbidding downgrade. CI `41254023629` passed 104/104 tests. Actual cloud dispatch `41254050729` was claimed by the scheduled task; session `<redacted-local-identifier>` completed with `BRIDGE_SMOKE_OK`, recording model=gpt-6.1-sol, effort=ultra. The temporary candidate-acceptance branch was deleted. No test comments or automatic closure of real Issues occurred. See acceptance receipts.
