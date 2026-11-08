'use strict';
// v1.0.0: failure replies are the durable bridge; never executes model output.
const { buildIssueContext } = require('./ai-issue-context');
const { buildRequest, callMiMo } = require('./ai-issue-responder');
const { redact } = require('./local-codex-worker');
const FAILURE = '本次自动处理未完成，尚未发布到 main。';
const TASK = 'issue-([1-9][0-9]*)-(opened|reopened-[0-9]+|labeled-[0-9]+|comment-[0-9]+|manual-[0-9]+)';
const SOURCE = new RegExp(`^<!-- scki-local-codex:(${TASK}) -->\\r?\\n${FAILURE}(?:\\r?\\n|$)`);
const BOT = 'github-actions[bot]';
function parseFailure(comment, { ownerId, repository }) {
  // Resolve the owner by immutable API ID, never author_association/display name.
  if (!Number.isSafeInteger(ownerId) || comment?.user?.id !== ownerId || comment.user.type !== 'User') return null;
  const match = String(comment.body || '').match(SOURCE);
  if (!match || !Number.isSafeInteger(Number(match[2]))) return null;
  const issueNumber = Number(match[2]);
  if (comment.issue_url !== `https://api.github.com/repos/${repository}/issues/${issueNumber}`) return null;
  if (!Number.isSafeInteger(comment.id) || comment.id < 1) return null;
  return { taskKey: match[1], issueNumber, commentId: comment.id };
}
function marker(task) { return `<!-- scki-mimo-fallback:${task.taskKey} -->`; }
function ownedClaim(comment, task, botId) {
  return comment?.user?.id === botId && comment.user?.type === 'Bot'
    && comment.user?.login === BOT && String(comment.body || '').startsWith(`${marker(task)}\n`);
}
function state(body) { return String(body).match(/^<!-- scki-mimo-state:(pending|complete|failed|superseded) -->$/m)?.[1]; }
function format(task, status, text) {
  return `${marker(task)}\n<!-- scki-mimo-state:${status} -->\n> 🤖 **MiMo 失败补答**（仅分析）\n\n${text}\n\n---\n<sub>Codex 自动处理未完成；本回复未修改代码、未发布到 main。请以维护者验证结果为准。</sub>`;
}
function safeReply(reply) {
  return redact(String(reply || '').replace(/<!--[^]*?-->/g, '')).trim().slice(0, 18000);
}
async function respondFailure({ api, repository, ownerId, botId, source, repoRoot, apiKey, baseUrl,
  requestMiMo = callMiMo, contextBuilder = buildIssueContext }) {
  const task = parseFailure(source, { ownerId, repository });
  if (!task) return { status: 'ignored' };
  const issue = await api.get(`repos/${repository}/issues/${task.issueNumber}`);
  if (issue.pull_request || issue.state !== 'open' || issue.number !== task.issueNumber) return { status: 'ignored' };
  const comments = await api.list(`repos/${repository}/issues/${task.issueNumber}/comments`);
  let claim = comments.find(c => ownedClaim(c, task, botId));
  if (claim && state(claim.body) !== 'pending') return { status: 'already_handled' };
  if (!apiKey) throw new Error('MiMo fallback credential is not configured');
  // Re-read the authoritative source; an already repaired/edited task must not get a stale reply.
  const current = await api.get(`repos/${repository}/issues/comments/${task.commentId}`);
  if (parseFailure(current, { ownerId, repository })?.taskKey !== task.taskKey) return { status: 'superseded' };
  if (!claim) {
    // If POST acknowledgement is lost, do not retry here. The next run reconciles the marker.
    claim = await api.post(`repos/${repository}/issues/${task.issueNumber}/comments`, {
      body: format(task, 'pending', 'Codex 自动处理未完成，已登记 MiMo 补答；分析尚未完成。') });
  }
  try {
    const context = contextBuilder({ repoRoot, title: issue.title, body: issue.body, codeMod: false });
    const request = buildRequest({ context: context.text, title: issue.title, body: issue.body,
      issueUrl: `https://github.com/${repository}/issues/${task.issueNumber}`, category: 'question', tier: 'FIRST',
      model: 'mimo-v2.6-flash', thinking: 'enabled', codeMod: false,
      comment: 'Codex 自动处理未完成。只基于仓库证据补充一次分析，区分已知事实、推测与未验证项；不要声称已经修改、合入或发布。' });
    const result = await requestMiMo({ apiKey, baseUrl, request, timeoutMs: 240000 });
    const freshSource = await api.get(`repos/${repository}/issues/comments/${task.commentId}`);
    const freshIssue = await api.get(`repos/${repository}/issues/${task.issueNumber}`);
    if (parseFailure(freshSource, { ownerId, repository })?.taskKey !== task.taskKey || freshIssue.state !== 'open') {
      await api.patch(`repos/${repository}/issues/comments/${claim.id}`, { body: format(task, 'superseded', '原任务状态已更新，本次补答已取消，请以最新维护者回复为准。') });
      return { status: 'superseded' };
    }
    // Patches/PRs are never accepted, applied, or published on this path.
    const accepted = result.status === 'ok' && !result.hasPatch && safeReply(result.reply);
    await api.patch(`repos/${repository}/issues/comments/${claim.id}`, { body: format(task, accepted ? 'complete' : 'failed',
      accepted ? safeReply(result.reply) : 'MiMo 本次未能完成可靠分析，未生成或应用修复；请维护者继续处理。') });
    return { status: accepted ? 'complete' : 'failed' };
  } catch {
    // Leave a pending marker on uncertain transport/write outcomes. A later run updates
    // the same comment, rather than creating a duplicate or pretending to know its outcome.
    throw new Error('MiMo fallback incomplete; reconcile the existing reply before retry');
  }
}
module.exports = { parseFailure, marker, ownedClaim, state, safeReply, respondFailure };
