#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { parseFailure, respondFailure } = require('./lib/ai-issue-fallback');
function githubApi(token, fetchImpl = fetch) {
  async function request(method, endpoint, body) {
    if (!/^(repos|users)\/[A-Za-z0-9_./?=&%\[\]-]+$/.test(endpoint) || endpoint.includes('..')) throw new Error('Invalid API path');
    const response = await fetchImpl(`https://api.github.com/${endpoint}`, { method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000), redirect: 'error' });
    if (!response.ok) throw new Error(`GitHub request failed: ${response.status}`);
    return response.json();
  }
  return { get: p => request('GET', p), post: (p, b) => request('POST', p, b), patch: (p, b) => request('PATCH', p, b),
    async list(p) {
      const result = [];
      for (let page = 1; page <= 20; page++) {
        const rows = await request('GET', `${p}${p.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
        if (!Array.isArray(rows)) throw new Error('Invalid paginated API response');
        result.push(...rows); if (rows.length < 100) return result;
      }
      throw new Error('API pagination budget exceeded; refusing incomplete deduplication');
    } };
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
  for (const source of candidates) {
    const task = parseFailure(source, { repository, ownerId: repo.owner.id });
    if (!task) continue;
    try {
      const result = await respondFailure({ api, repository, ownerId: repo.owner.id, botId: bot.id, source,
        repoRoot: process.cwd(), apiKey: env.MIMO_API_KEY, baseUrl: env.MIMO_BASE_URL || undefined,
        ...(deps.requestMiMo ? { requestMiMo: deps.requestMiMo } : {}) });
      console.log(`Fallback issue ${task.issueNumber}: ${result.status}`);
      if (result.diagnostic) console.log(`Fallback diagnostic issue ${task.issueNumber}: ${JSON.stringify(result.diagnostic)}`);
      if (result.status === 'failed') incomplete = true;
      if (['complete', 'failed', 'superseded'].includes(result.status) && ++processed >= 3) break;
    } catch (error) {
      // A deleted/inaccessible receipt or an uncertain write must not starve
      // unrelated tasks. Preserve its claim for reconciliation on the next run.
      // Never log provider errors, issue content, or credential-bearing payloads.
      incomplete = true;
      console.error(`Fallback issue ${task.issueNumber}: incomplete; will reconcile on retry${error?.code === 'REPLY_LANGUAGE_UNCERTAIN' ? '; REPLY_LANGUAGE_UNCERTAIN: maintainer review required' : ''}`);
    }
  }
  if (incomplete) throw new Error('One or more fallback analyses did not complete');
}
if (require.main === module) main().catch(() => { console.error('MiMo fallback incomplete; check credential/setup and existing task reply. No code was changed.'); process.exitCode = 1; });
module.exports = { main, githubApi };
