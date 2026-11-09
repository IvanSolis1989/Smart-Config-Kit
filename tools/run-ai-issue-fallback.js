#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { parseFailure, respondFailure, diagnostic, diagnosticError, errorDiagnostic } = require('./lib/ai-issue-fallback');
function githubApi(token, fetchImpl = fetch) {
  async function request(method, endpoint, body) {
    if (!/^(repos|users)\/[A-Za-z0-9_./?=&%\[\]-]+$/.test(endpoint) || endpoint.includes('..')) throw diagnosticError('INVALID_API_PATH');
    let response;
    try { response = await fetchImpl(`https://api.github.com/${endpoint}`, { method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000), redirect: 'error' }); } catch { throw diagnosticError('GITHUB_TRANSPORT_ERROR'); }
    if (!response.ok) throw diagnosticError('GITHUB_HTTP_ERROR', 'setup', response.status);
    try { return await response.json(); } catch { throw diagnosticError('GITHUB_RESPONSE_INVALID'); }
  }
  return { get: p => request('GET', p), post: (p, b) => request('POST', p, b), patch: (p, b) => request('PATCH', p, b),
    async list(p) {
      const result = [];
      for (let page = 1; page <= 20; page++) {
        const rows = await request('GET', `${p}${p.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
        if (!Array.isArray(rows)) throw diagnosticError('GITHUB_RESPONSE_INVALID');
        result.push(...rows); if (rows.length < 100) return result;
      }
      throw diagnosticError('PAGINATION_LIMIT');
    } };
}
function diagnosticLine(value) {
  const d = diagnostic(value?.code, value?.phase, value?.httpStatus);
  return `phase=${d.phase} code=${d.code}${d.httpStatus === undefined ? '' : ` http=${d.httpStatus}`}`;
}
async function main(env = process.env, deps = {}) {
  const repository = env.GITHUB_REPOSITORY;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || '')) throw new Error('Invalid repository');
  const api = deps.api || githubApi(env.GITHUB_TOKEN);
  const repo = await api.get(`repos/${repository}`);
  if (repo.full_name !== repository || repo.owner?.type !== 'User') throw new Error('Fallback requires the verified personal repository owner');
  const bot = await api.get('users/github-actions%5Bbot%5D');
  if (bot.login !== 'github-actions[bot]' || bot.type !== 'Bot') throw new Error('Invalid bot identity');
  const event = deps.event || JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH, 'utf8'));
  let candidates;
  if (env.GITHUB_EVENT_NAME === 'issue_comment') {
    if (event.issue?.pull_request || !Number.isSafeInteger(event.comment?.id)) return;
    candidates = [await api.get(`repos/${repository}/issues/comments/${event.comment.id}`)];
  } else if (env.GITHUB_EVENT_NAME === 'workflow_dispatch' && event.inputs?.issue_number) {
    if (!/^[1-9][0-9]{0,9}$/.test(event.inputs.issue_number)) throw new Error('Invalid issue number');
    candidates = await api.list(`repos/${repository}/issues/${event.inputs.issue_number}/comments`);
  } else if (['schedule', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME)) {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    candidates = await api.list(`repos/${repository}/issues/comments?since=${encodeURIComponent(since)}`);
  } else throw new Error('Unsupported fallback event');
  let processed = 0, incomplete = false;
  const counts = { candidates: candidates.length, eligible: 0, complete: 0, failed: 0, incomplete: 0, ignored: 0, already_handled: 0, superseded: 0 };
  for (const source of candidates) {
    const task = parseFailure(source, { repository, ownerId: repo.owner.id });
    if (!task) continue;
    counts.eligible++;
    try {
      const result = await respondFailure({ api, repository, ownerId: repo.owner.id, botId: bot.id, source,
        repoRoot: process.cwd(), apiKey: env.MIMO_API_KEY, baseUrl: env.MIMO_BASE_URL || undefined,
        ...(deps.requestMiMo ? { requestMiMo: deps.requestMiMo } : {}) });
      console.log(`Fallback issue ${task.issueNumber}: ${result.status}`);
      if (Object.hasOwn(counts, result.status)) counts[result.status]++;
      if (result.status === 'failed') { incomplete = true; console.error(`Fallback issue ${task.issueNumber}: ${diagnosticLine(result.diagnostic)}`); }
      if (['complete', 'failed', 'superseded'].includes(result.status) && ++processed >= 3) break;
    } catch (error) {
      // A deleted/inaccessible receipt or an uncertain write must not starve
      // unrelated tasks. Preserve its claim for reconciliation on the next run.
      // Never log provider errors, issue content, or credential-bearing payloads.
      incomplete = true; counts.incomplete++;
      console.error(`Fallback issue ${task.issueNumber}: incomplete; will reconcile on retry; ${diagnosticLine(errorDiagnostic(error))}`);
    }
  }
  console.log(`Fallback summary ${JSON.stringify(counts)}`);
  if (incomplete) throw new Error('One or more fallback analyses did not complete');
}
if (require.main === module) main().catch(error => { console.error(`MiMo fallback incomplete; ${diagnosticLine(errorDiagnostic(error))}. No code was changed.`); process.exitCode = 1; });
module.exports = { main, githubApi, diagnosticLine };
