<a id="本地-codex-issue-派单验收2026-11-01"></a>
# Local Codex Issue dispatch acceptance (2026-11-01)

**English** | [简体中文](2026-11-01-local-codex-issue-bridge-acceptance.zh-CN.md)


<a id="实际交付"></a>
## Actual delivery

- Code commits `23cea9c3`, `f62c6bf2`, and `b5f6c5c2` were normally pushed to `main`.
- Repository variable `LOCAL_CODEX_ENABLED=true`; the local worker was installed and started by a Windows scheduled task under the current user, with an actual running state.
- Model `gpt-6.1-sol` and reasoning effort `ultra` are fixed. The account catalog is checked before thread creation; the server-returned model and effort are checked afterward. Every turn explicitly supplies them again. Unsupported settings or downgrades stop processing.
- Each task has an isolated working directory and persistent session, with event deduplication. Candidate commits are validated on temporary branches. Only after all four gates actually pass is the same SHA normally pushed to `main`, followed by an idempotent reply.

<a id="真实验收证据"></a>
## Real acceptance evidence

| Acceptance | Evidence | Result |
| --- | --- | --- |
| Focused offline CI | [Run 41254023629](https://github.com/IvanSolis1989/Smart-Config-Kit/actions/runs/41254023629) | 104 tests, 104 pass, 0 fail; includes rejection of unsupported/downgraded model or effort, queue deduplication, publication order, recovery, and process-tree termination |
| Candidate publication gates | [Run 41253679257](https://github.com/IvanSolis1989/Smart-Config-Kit/actions/runs/41253679257) | Staging branch successfully bound to immutable SHA; JS, artifact contracts, direct-process routing, and Karing all actually passed |
| First GitHub → local session | [Run 41253355774](https://github.com/IvanSolis1989/Smart-Config-Kit/actions/runs/41253355774) | Artifact upload succeeded, local worker claimed it, and a new session returned `BRIDGE_SMOKE_OK` |
| Complete dispatch with fixed Sol ultra | [Run 41254050729](https://github.com/IvanSolis1989/Smart-Config-Kit/actions/runs/41254050729) | Scheduled task claimed work outside the app process; strict model/effort verification passed; the session completed and returned `BRIDGE_SMOKE_OK` |

The local installation’s `install-receipt.json` records the code commit and runtime-file SHA256 values. `state/state.json` records task keys, thread IDs, model, effort, terminal state, and completion time. The desktop app’s session-reading interface read back actual completion records; this was not merely a process-liveness check. Temporary candidate-acceptance branches were cleaned up.

<a id="环境问题及处理"></a>
## Environment issues and remedies

- Local Windows checks reported Stash/Karing/capability-matrix generation drift, but the same client inputs passed all four gates in the GitHub Node.js 22 environment above. This alone does not establish stale main artifacts. Client sources and generated artifacts were not modified in this change.
- The Windows elevated sandbox could not satisfy loopback network isolation. The outer process therefore does not execute candidate validation scripts directly on the local machine. Publication gates use temporary GitHub runners without local credentials and with repository-read-only permissions.
- MSIX desktop-app redirection of LocalAppData initially prevented the scheduled task from reading the script path. The installer now resolves the physical path through an actual file handle. After the fix, the scheduled task started the worker and completed fixed-model dispatch.
- The initial Linux CI process-existence check could not distinguish running processes from zombies. It now waits for direct-child exit and checks the kernel terminal state and absence of post-cancellation heartbeats. The corrected Linux CI passed.

<a id="验收边界"></a>
## Acceptance boundaries

Smoke tests do not modify business code, commit changes, post test comments to real Issues, or close Issues. No real user issue was used to rehearse automatic editing and pushing to main. Publication order was validated separately through real temporary-Git-repository regressions and actual GitHub candidate gates. The scheduled task actually ran; its next-login trigger still requires observation when the user next logs in. The computer was not deliberately restarted.

See the [automatic-processing guide](../ai-issue-responder.md) for setup, pause, and resume commands.
