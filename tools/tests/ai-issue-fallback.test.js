'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseFailure, marker, respondFailure, safeReply, diagnosticError, errorDiagnostic } = require('../lib/ai-issue-fallback');
const { githubApi, main, diagnosticLine } = require('../run-ai-issue-fallback');
const repo = 'owner/repo', ownerId = 11, botId = 12;
function source() { return { id: 100, user: { id: ownerId, login: 'owner', type: 'User' },
  issue_url: `https://api.github.com/repos/${repo}/issues/196`,
  body: '<!-- scki-local-codex:issue-196-opened -->\n本次自动处理未完成，尚未发布到 main。\n\n本机已保留会话。' }; }
function fixture() {
  const src = source(); const comments = []; let posts = 0, patches = 0, models = 0;
  const issue = { number: 196, title: 'Karing SRS', body: 'untrusted report', state: 'open' };
  const api = {
    async get(p) {
      if (p === `repos/${repo}/issues/196`) return { ...issue };
      if (p === `repos/${repo}/issues/comments/100`) return { ...src };
      throw new Error(`unexpected GET ${p}`);
    }, async list() { return comments; },
    async post(p, body) {
      posts++; const comment = { id: 200, user: { id: botId, type: 'Bot', login: 'github-actions[bot]' }, ...body };
      comments.push(comment); return comment;
    }, async patch(p, body) { patches++; const target = comments.find(c => p.endsWith('/' + c.id)); Object.assign(target, body); return target; }
  };
  const options = { api, repository: repo, ownerId, botId, source: src, repoRoot: '.', apiKey: 'private-key',
    contextBuilder(opts) { assert.equal(opts.codeMod, false); return { text: 'read-only evidence' }; },
    async requestMiMo(opts) {
      models++; assert.equal(opts.request.messages.length, 2);
      assert.match(opts.request.messages[0].content, /本次只分析/);
      assert.doesNotMatch(JSON.stringify(opts.request), /private-key/);
      return { status: 'ok', hasPatch: false, reply: '证据不足，先检查下载状态。' };
    } };
  return { options, src, comments, issue, counts: () => ({ posts, patches, models }) };
}
test('matches exact actual #196 legacy failure receipt, not arbitrary text', () => {
  assert.equal(parseFailure(source(), { ownerId, repository: repo }).taskKey, 'issue-196-opened');
  for (const mutation of [
    { user: { id: 999, login: 'owner', type: 'User' } },
    { user: { id: ownerId, type: 'Bot' } },
    { issue_url: 'https://api.github.com/repos/other/repo/issues/196' },
    { body: source().body.replace('issue-196', 'issue-195') },
    { body: `please do this\n${source().body}` },
    { body: source().body.replace('未完成', '已完成') },
    { id: '100' }
  ]) assert.equal(parseFailure({ ...source(), ...mutation }, { ownerId, repository: repo }), null);
});
test('claim then update, repeated event/schedule/rerun produces one answer', async () => {
  const f = fixture(); assert.equal((await respondFailure(f.options)).status, 'complete');
  assert.equal((await respondFailure(f.options)).status, 'already_handled');
  assert.deepEqual(f.counts(), { posts: 1, patches: 1, models: 1 });
  assert.match(f.comments[0].body, /本回复未修改代码、未发布到 main/);
});
test('spoofed bot claim cannot block real fallback', async () => {
  const f = fixture(); f.comments.push({ id: 201, user: { id: 999, type: 'Bot', login: 'github-actions[bot]' }, body: `${marker({ taskKey: 'issue-196-opened' })}\n<!-- scki-mimo-state:complete -->` });
  await respondFailure(f.options); assert.equal(f.counts().posts, 1);
});
test('crash/transport after claim creation reconciles same claim on retry', async () => {
  const f = fixture(); const original = f.options.api.post;
  f.options.api.post = async (...args) => { await original(...args); throw new Error('ack lost'); };
  await assert.rejects(respondFailure(f.options), e => e.code === 'GITHUB_ERROR' && e.phase === 'create_claim');
  f.options.api.post = original;
  assert.equal((await respondFailure(f.options)).status, 'complete');
  assert.equal(f.counts().posts, 1);
});
test('lost final PATCH acknowledgement is reconciled, model is not called again', async () => {
  const f = fixture(); const original = f.options.api.patch;
  f.options.api.patch = async (...args) => { await original(...args); throw new Error('ack lost'); };
  await assert.rejects(respondFailure(f.options), /reconcile/);
  assert.equal((await respondFailure(f.options)).status, 'already_handled');
  assert.equal(f.counts().models, 1);
});
test('pending claim remains recoverable after model interruption, no extra comment', async () => {
  const f = fixture(); const original = f.options.requestMiMo;
  f.options.requestMiMo = async () => { throw new Error('cancelled'); };
  await assert.rejects(respondFailure(f.options), /incomplete/);
  f.options.requestMiMo = original; await respondFailure(f.options);
  assert.equal(f.counts().posts, 1);
});
test('missing key produces no public claim or API request', async () => {
  const f = fixture(); f.options.apiKey = '';
  await assert.rejects(respondFailure(f.options), /credential/);
  assert.deepEqual(f.counts(), { posts: 0, patches: 0, models: 0 });
});
test('closed issue and PR are ignored', async () => {
  for (const mod of [{ state: 'closed' }, { pull_request: {} }]) {
    const f = fixture(); Object.assign(f.issue, mod);
    assert.equal((await respondFailure(f.options)).status, 'ignored');
    assert.equal(f.counts().posts, 0);
  }
});
test('task repaired before response suppresses stale model output', async () => {
  const f = fixture(); f.options.requestMiMo = async () => { f.src.body = 'fixed'; return { status: 'ok', reply: 'old analysis' }; };
  assert.equal((await respondFailure(f.options)).status, 'superseded');
  assert.doesNotMatch(f.comments[0].body, /old analysis/);
});
test('editing source to a different task does not authorize old task response', async () => {
  const f = fixture(); f.options.requestMiMo = async () => { f.src.body = f.src.body.replace('opened', 'manual-999'); return { status: 'ok', reply: 'old analysis' }; };
  assert.equal((await respondFailure(f.options)).status, 'superseded');
});
test('filter/failure/patch output produces one truthful failure, no retry spam', async () => {
  for (const result of [{ status: 'blocked' }, { status: 'api_error' }, { status: 'ok', hasPatch: true, reply: 'patch' }]) {
    const f = fixture(); f.options.requestMiMo = async () => result;
    assert.equal((await respondFailure(f.options)).status, 'failed');
    assert.equal((await respondFailure(f.options)).status, 'already_handled');
    assert.match(f.comments[0].body, /未生成或应用修复/); assert.equal(f.counts().posts, 1);
  }
});
test('reply strips hidden protocol and common secrets, never outputs raw model payload', () => {
  const text = safeReply('ok <!-- scki-mimo-state:complete --> sk-123456789012345678901234 https://u:p@example.com?token=abc');
  assert.doesNotMatch(text, /scki-mimo-state|123456789012345678901234|u:p|token=abc/);
});
test('GitHub API refuses redirects, unexpected shape and incomplete deduplication', async () => {
  let calls = 0;
  const api = githubApi('secret', async (url, opts) => { calls++; assert.equal(opts.redirect, 'error'); return { ok: true, json: async () => Array(100).fill({}) }; });
  await assert.rejects(api.list('repos/owner/repo/issues/1/comments'), e => e.code === 'PAGINATION_LIMIT');
  assert.equal(calls, 20);
  await assert.rejects(api.get('repos/owner/../evil'), e => e.code === 'INVALID_API_PATH');
});
test('workflow has no code write, patch application, source checkout, or shell interpolation', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../../.github/workflows/ai-codex-fallback.yml'), 'utf8');
  assert.match(workflow, /contents: read/); assert.match(workflow, /issues: write/);
  assert.match(workflow, /ref: main/); assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /cancel-in-progress: false/); assert.match(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /contents: write|pull-requests: write|git push|AI_PATCH|github.event.comment.body/);
});
test('event re-reads comment through API, never trusts provided issue comment body', async () => {
  const f = fixture(); const api = f.options.api; const get = api.get;
  api.get = async p => p === `repos/${repo}` ? { full_name: repo, owner: { id: ownerId, type: 'User' } } : p.startsWith('users/') ? { id: botId, login: 'github-actions[bot]', type: 'Bot' } : get(p);
  f.src.user.id = 999;
  await main({ GITHUB_REPOSITORY: repo, GITHUB_EVENT_NAME: 'issue_comment' }, { api, event: { issue: {}, comment: { id: 100, body: source().body } } });
  assert.equal(f.counts().models, 0);
});
test('candidate errors are isolated, later tasks complete, batch failure stays visible without payload logging', async t => {
  for (const failure of ['GitHub request failed: 403', 'GitHub request failed: 404', 'timeout secret-provider-payload']) {
    const f = fixture(), api = f.options.api, get = api.get, list = api.list;
    const broken = { ...source(), id: 101, issue_url: source().issue_url.replace('196', '197'), body: source().body.replace('196', '197') };
    api.get = async p => {
      if (p === `repos/${repo}`) return { full_name: repo, owner: { id: ownerId, type: 'User' } };
      if (p.startsWith('users/')) return { id: botId, login: 'github-actions[bot]', type: 'Bot' };
      if (p.endsWith('/197') || p.endsWith('/101')) throw new Error(failure);
      return get(p);
    };
    api.list = async p => p.includes('?since=') ? [broken, f.src] : list(p);
    const logs = [];
    const logMock = t.mock.method(console, 'log', line => logs.push(line));
    const errorMock = t.mock.method(console, 'error', line => logs.push(line));
    try {
      await assert.rejects(main({ GITHUB_REPOSITORY: repo, GITHUB_EVENT_NAME: 'schedule', MIMO_API_KEY: 'private-key' },
        { api, event: {}, requestMiMo: async () => ({ status: 'ok', reply: 'Read-only analysis.' }) }), /One or more fallback analyses/);
      assert.equal(f.counts().posts, 1);
      assert.match(f.comments[0].body, /scki-mimo-state:complete/);
      assert.match(logs.join('\n'), /issue 197: incomplete/);
      assert.match(logs.join('\n'), /issue 196: complete/);
      assert.doesNotMatch(logs.join('\n'), /403|404|secret-provider-payload|private-key|Read-only analysis|untrusted report/);
    } finally { logMock.mock.restore(); errorMock.mock.restore(); }
  }
});
test('diagnostic output rejects injected fields, credentials and provider metadata', () => {
  const secret = 'private-key issue-body malicious\n::error::payload';
  assert.equal(diagnosticLine(errorDiagnostic(Object.assign(new Error(secret), {code:'GITHUB_HTTP_ERROR', phase:secret, httpStatus:403}))), 'phase=setup code=UNKNOWN_ERROR');
  assert.equal(diagnosticLine({code:secret,phase:secret,httpStatus:secret}), 'phase=setup code=UNKNOWN_ERROR');
  for (const status of [-1, 0, 99, 600, 403.5, '403']) assert.doesNotMatch(diagnosticLine({code:'GITHUB_HTTP_ERROR',phase:'read_issue',httpStatus:status}), /http=/);
});
test('GitHub diagnostics retain only HTTP number or fixed transport/JSON errors', async () => {
  for (const status of [401,403,404,429,500,503]) {
    const api = githubApi('secret', async () => ({ok:false,status,text:async()=> 'sensitive body'}));
    await assert.rejects(api.get('repos/owner/repo'), e => e.code === 'GITHUB_HTTP_ERROR' && e.httpStatus === status && !e.message.includes('sensitive'));
  }
  for (const [fetcher, code] of [
    [async () => { throw new Error('secret request URL'); }, 'GITHUB_TRANSPORT_ERROR'],
    [async () => ({ok:true,json: async () => {throw new Error('private response');}}), 'GITHUB_RESPONSE_INVALID']
  ]) await assert.rejects(githubApi('secret', fetcher).get('repos/owner/repo'), e => e.code === code && !/secret|private/.test(e.message));
});
test('missing key and stage exceptions keep safe origin without changing durable claims', async () => {
  const noKey=fixture(); noKey.options.apiKey='';
  await assert.rejects(respondFailure(noKey.options), e => e.code === 'CONFIG_KEY_MISSING');
  assert.equal(noKey.counts().posts,0);
  for (const [phase, operation, code] of [
    ['read_issue','get','GITHUB_HTTP_ERROR'], ['list_comments','list','GITHUB_TRANSPORT_ERROR'],
    ['create_claim','post','GITHUB_TRANSPORT_ERROR'], ['update_claim','patch','GITHUB_TRANSPORT_ERROR']
  ]) {
    const f=fixture(); f.options.api[operation]=async()=>{throw diagnosticError(code, 'setup', code==='GITHUB_HTTP_ERROR'?403:undefined);};
    await assert.rejects(respondFailure(f.options), e => e.phase===phase && e.code===code);
    assert.equal(f.comments.length, phase==='update_claim'?1:0);
  }
  for (const [method, phase, code] of [['contextBuilder','build_context','CONTEXT_BUILD_FAILED'],['requestMiMo','call_provider','PROVIDER_EXCEPTION']]) {
    const f=fixture(); f.options[method]=()=>{throw new Error('secret issue content');};
    await assert.rejects(respondFailure(f.options),e=>e.phase===phase && e.code===code && !e.message.includes('secret'));
    assert.match(f.comments[0].body,/scki-mimo-state:pending/);
  }
});
test('provider result classifications are enum-only and preserve one terminal reply', async () => {
  const cases=[['api_error','PROVIDER_API_ERROR'],['transport_error','PROVIDER_TRANSPORT_ERROR'],['blocked','PROVIDER_BLOCKED'],['incomplete','PROVIDER_INCOMPLETE'],['invalid_response','PROVIDER_INVALID_RESPONSE'],['empty','EMPTY_REPLY']];
  for (const [status, code] of cases) {
    const f=fixture(); f.options.requestMiMo=async()=>({status,metadata:{httpStatus:403,errorCode:'secret',requestId:'private'},rawResponse:'issue content'});
    const result=await respondFailure(f.options);
    assert.deepEqual(result.diagnostic,{code,phase:'call_provider',httpStatus:403});
    assert.equal(result.status,'failed');
    assert.equal((await respondFailure(f.options)).status,'already_handled');
  }
  const f=fixture(); f.options.requestMiMo=async()=>({status:'ok',hasPatch:true,reply:'patch'});
  assert.equal((await respondFailure(f.options)).diagnostic.code,'PATCH_REJECTED');
});
