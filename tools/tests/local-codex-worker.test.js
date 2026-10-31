'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { validateConfig, redact, parseResult, acquireLock, Worker, command } = require('../lib/local-codex-worker');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-worker-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repositoryPath = path.join(root, 'repo'); fs.mkdirSync(repositoryPath);
  return { schemaVersion: 1, repository: 'owner/repo', repositoryPath,
    stateDir: path.join(root, 'state'), worktreeRoot: path.join(root, 'work'),
    codexCommand: process.execPath, codexArgs: [], pollSeconds: 60, timeoutMs: 60000,
    enabledAfter: '2026-11-01T00:00:00Z', publish: true, model: 'gpt-6.1-sol', effort: 'ultra' };
}
test('configuration rejects foreign repository, relative state and implicit publication', t => {
  const config = fixture(t);
  assert.equal(validateConfig(config).repository, 'owner/repo');
  assert.throws(() => validateConfig({ ...config, repository: 'owner/repo/../../x' }));
  assert.throws(() => validateConfig({ ...config, stateDir: 'state' }));
  assert.throws(() => validateConfig({ ...config, publish: undefined }));
  assert.throws(() => validateConfig({ ...config, effort: 'high' }), /ultra/);
  assert.throws(() => validateConfig({ ...config, model: 'other-model' }), /gpt-6.1-sol/);
});
test('redacts credentials without destroying public issue links', () => {
  const text = redact('gho_abcdefghijklmnopqrstuvwxyz https://u:p@example.org/?token=private https://github.com/owner/repo/issues/1');
  assert.ok(!text.includes('abcdefghijklmnopqrstuvwxyz'));
  assert.ok(!text.includes('u:p'));
  assert.ok(!text.includes('private'));
  assert.ok(text.includes('https://github.com/owner/repo/issues/1'));
});
test('structured result fails closed on incomplete or fenced prose', () => {
  assert.equal(parseResult('{"outcome":"answered","summary":"ok","reply":"答复"}').outcome, 'answered');
  assert.throws(() => parseResult('Done!'));
  assert.throws(() => parseResult('{"outcome":"ready","reply":"ok"}'));
  assert.throws(() => parseResult('{"outcome":"success","summary":"ok","reply":"ok"}'));
});
test('exclusive lock prevents another worker and release is ownership checked', async t => {
  const config = fixture(t);
  const release = await acquireLock(config.stateDir);
  await assert.rejects(acquireLock(config.stateDir), /running/);
  await release();
  const releaseAgain = await acquireLock(config.stateDir);
  await releaseAgain();
});
test('startup marks a model run interrupted instead of silently replaying it', async t => {
  const config = fixture(t);
  fs.mkdirSync(config.stateDir, { recursive: true });
  fs.writeFileSync(path.join(config.stateDir, 'state.json'), JSON.stringify({ schemaVersion: 1,
    cursor: config.enabledAfter, tasks: { key: { status: 'running', threadId: 'saved-thread' } } }));
  const worker = new Worker(config);
  await worker.initialize();
  assert.equal(worker.state.tasks.key.status, 'interrupted');
  assert.equal(worker.state.tasks.key.threadId, 'saved-thread');
});
test('smoke records actual session result and never calls GitHub comment or publish', async t => {
  const config = fixture(t); let runs = 0;
  const worker = new Worker(config, {
    command: async () => { throw new Error('External operation during smoke'); },
    runCodexTask: async opts => { runs++; assert.equal(opts.smoke, true);
      assert.equal(opts.model, 'gpt-6.1-sol'); assert.equal(opts.effort, 'ultra');
      await opts.onThread('smoke-thread'); return { threadId: 'smoke-thread', status: 'completed', text: 'BRIDGE_SMOKE_OK' }; }
  });
  await worker.initialize();
  const result = await worker.smoke();
  assert.equal(result.status, 'completed');
  assert.equal(result.threadId, 'smoke-thread');
  assert.equal(runs, 1);
});
test('smoke fails on model refusal instead of treating nonempty output as success', async t => {
  const worker = new Worker(fixture(t), { runCodexTask: async () => ({ status: 'completed', text: 'cannot comply' }) });
  await worker.initialize();
  await assert.rejects(worker.smoke(), /BRIDGE_SMOKE_OK/);
});
test('reply marker reconciles a previously posted response without creating a duplicate', async t => {
  const config = fixture(t); const calls = [];
  const worker = new Worker(config, { command: async (cmd, args) => {
    calls.push(args);
    if (args[0] === 'api' && args.includes('--slurp')) return { stdout: JSON.stringify([[{ id: 7,
      body: '<!-- scki-local-codex:abc -->\nposted', user: { login: 'owner' } }]]) };
    throw new Error('unexpected mutation');
  } });
  await worker.initialize(); worker.actor = 'owner';
  const record = { task: { issueNumber: 1, taskKey: 'abc' }, status: 'replying', reply: 'posted' };
  await worker.reply(record);
  assert.equal(record.status, 'completed');
  assert.equal(record.commentId, 7);
  assert.equal(calls.length, 1);
});

function queueRun(overrides = {}) {
  return { id: 123, path: '.github/workflows/local-codex-issue.yml', head_branch: 'main',
    head_repository: { full_name: 'owner/repo' }, head_sha: 'a'.repeat(40), actor: { login: 'owner' },
    status: 'completed', conclusion: 'success', created_at: '2026-11-01T01:00:00Z', ...overrides };
}
function queuedTask() {
  return { schemaVersion: 1, repository: 'owner/repo', issueNumber: 1,
    issueUrl: 'https://github.com/owner/repo/issues/1', taskKey: 'issue-1-opened', mode: 'handle',
    createdAt: '2026-11-01T01:00:00.000Z', actor: 'owner',
    source: { eventName: 'issues', runId: '123', runAttempt: 1, headSha: 'a'.repeat(40) } };
}
test('repeated polls deduplicate a durable artifact and bind it to the actual workflow run', async t => {
  const config = fixture(t); const task = queuedTask();
  const worker = new Worker(config, { command: async (cmd, args) => {
    if (args.includes('--slurp')) return { stdout: JSON.stringify([{ workflow_runs: [queueRun()] }]) };
    if (args.at(-1).includes('/artifacts?')) return { stdout: JSON.stringify({ artifacts: [{ name: 'local-codex-issue-1', expired: false }] }) };
    throw new Error('Unexpected network operation');
  } });
  await worker.initialize();
  const inbox = path.join(config.stateDir, 'inbox', '123'); fs.mkdirSync(inbox, { recursive: true });
  fs.writeFileSync(path.join(inbox, 'task.json'), JSON.stringify(task));
  await worker.discover(); await worker.discover();
  assert.deepEqual(Object.keys(worker.state.tasks), ['issue-1-opened']);
  task.source.headSha = 'b'.repeat(40); fs.writeFileSync(path.join(inbox, 'task.json'), JSON.stringify(task));
  await assert.rejects(worker.discover(), /headSha/);
});
test('older incomplete runs hold the cursor so an offline completion cannot be lost', async t => {
  const config = fixture(t);
  const worker = new Worker(config, { command: async (cmd, args) => {
    if (args.includes('--slurp')) return { stdout: JSON.stringify([{ workflow_runs: [queueRun({ status: 'in_progress' }),
      queueRun({ id: 124, created_at: '2026-11-01T02:00:00Z' })] }]) };
    return { stdout: JSON.stringify({ artifacts: [] }) };
  } });
  await worker.initialize(); await worker.discover();
  assert.equal(worker.state.cursor, '2026-11-01T01:00:00Z');
});
test('fork, alternate branch and alternate workflow artifacts are not consumed', async t => {
  const config = fixture(t); let calls = 0;
  const worker = new Worker(config, { command: async () => { calls++; return { stdout: JSON.stringify([{ workflow_runs: [
    queueRun({ head_branch: 'attacker' }), queueRun({ head_repository: { full_name: 'fork/repo' } }),
    queueRun({ path: '.github/workflows/other.yml' })] }]) }; } });
  await worker.initialize(); await worker.discover();
  assert.equal(calls, 1); assert.deepEqual(worker.state.tasks, {});
});
test('protected infrastructure changes are rejected before any validator or publisher runs', async t => {
  const config = fixture(t);
  const worker = new Worker(config, { command: async () => { throw new Error('Must not execute candidate code'); } });
  await worker.initialize(); const record = { task: queuedTask(), branch: 'codex/test', baseSha: 'a'.repeat(40), cwd: config.repositoryPath };
  worker.git = async args => args.includes('HEAD') ? record.baseSha : args.includes('--show-current') ? record.branch : 'https://github.com/owner/repo.git';
  worker.changes = async () => ['.github/workflows/injected.yml'];
  await assert.rejects(worker.publish(record, { summary: 'x', reply: 'x' }), /Protected publication/);
});
test('a lost push acknowledgement is reconciled without rerunning the model', async t => {
  const worker = new Worker(fixture(t)); await worker.initialize(); let replies = 0;
  const record = { task: queuedTask(), status: 'publishing', commitSha: 'b'.repeat(40), cwd: worker.config.repositoryPath };
  worker.git = async () => ''; worker.reply = async r => { replies++; r.status = 'completed'; };
  await worker.reconcile(record);
  assert.equal(record.status, 'completed'); assert.equal(replies, 1);
});

function validationRun(record, overrides = {}) {
  return { id: 999, display_title: `Local Codex candidate ${record.commitSha}`, path: '.github/workflows/validate-local-codex-candidate.yml',
    head_repository: { full_name: 'owner/repo' }, event: 'workflow_dispatch', head_branch: 'main',
    html_url: 'https://github.com/owner/repo/actions/runs/999', status: 'completed', conclusion: 'success', ...overrides };
}
test('remote validation rejects skipped gates even if overall workflow says success', async t => {
  const worker = new Worker(fixture(t)); await worker.initialize();
  const record = { commitSha: 'b'.repeat(40), validationRunId: 999, validationRequestedAt: new Date().toISOString() };
  worker.json = async args => args.at(-1).includes('/jobs?') ? { jobs: [{ name: 'validate', conclusion: 'skipped', steps: [] }] } : validationRun(record);
  await assert.rejects(worker.validate(record), /did not all run/);
});
test('all four immutable candidate gates must pass before a validation receipt is accepted', async t => {
  const worker = new Worker(fixture(t)); await worker.initialize();
  const record = { commitSha: 'b'.repeat(40), validationRunId: 999, validationRequestedAt: new Date().toISOString() };
  const names = ['Validate JS overwrites', 'Validate artifact contracts', 'Validate process direct', 'Check Karing generation'];
  worker.json = async args => args.at(-1).includes('/jobs?') ? { jobs: [{ name: 'validate', conclusion: 'success',
    steps: names.map(name => ({ name, conclusion: 'success' })) }] } : validationRun(record);
  await worker.validate(record);
  assert.equal(record.validationConclusion, 'success'); assert.equal(record.validation.length, 4);
});
test('remote validation failure never becomes a successful local receipt', async t => {
  const worker = new Worker(fixture(t)); await worker.initialize();
  const record = { commitSha: 'b'.repeat(40), validationRunId: 999, validationRequestedAt: new Date().toISOString() };
  worker.json = async () => validationRun(record, { conclusion: 'failure' });
  await assert.rejects(worker.validate(record), /validation failure/);
  assert.equal(record.validationConclusion, 'failure');
});
test('validation cannot silently change files within an otherwise unchanged patch file set', async t => {
  const worker = new Worker(fixture(t)); await worker.initialize();
  const record = { cwd: worker.config.repositoryPath, baseSha: 'a'.repeat(40) };
  worker.command = async () => ({ stdout: 'same raw diff' }); worker.changes = async () => ['candidate.js'];
  const file = path.join(record.cwd, 'candidate.js'); fs.writeFileSync(file, 'before');
  const fingerprint = await worker.fingerprint(record); fs.writeFileSync(file, 'after');
  assert.notEqual(await worker.fingerprint(record), fingerprint);
});

test('ready publication binds the committed patch to CI then pushes that exact SHA to main', async t => {
  const config = fixture(t), cwd = config.repositoryPath;
  const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
  git(['init', '-b', 'main']); git(['config', 'core.autocrlf', 'false']); fs.writeFileSync(path.join(cwd, 'source.js'), 'before\n');
  git(['add', 'source.js']); git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'baseline']);
  const baseSha = git(['rev-parse', 'HEAD']);
  const branch = 'codex/issue-1-12345678901234567890'; git(['checkout', '-b', branch]);
  git(['remote', 'add', 'origin', 'https://github.com/owner/repo.git']);
  fs.writeFileSync(path.join(cwd, 'source.js'), 'after\n'); const calls = [];
  const worker = new Worker(config, { command: async (bin, args, opts) => {
    if (bin === 'gh') return { stdout: '{"state":"open"}' };
    if (bin === 'git' && args[0] === 'push') { calls.push(args.at(-1)); return { stdout: '' }; }
    if (bin === 'git' && args[0] === 'ls-remote') return { stdout: `${baseSha}\trefs/heads/main\n` };
    return command(bin, args, opts);
  } });
  await worker.initialize();
  worker.validate = async record => { calls.push('CI'); assert.equal(git(['rev-parse', 'HEAD']), record.commitSha);
    record.validation = ['real CI gate']; record.validationRunUrl = 'https://github.com/owner/repo/actions/runs/999'; };
  const record = { task: queuedTask(), cwd, baseSha, branch };
  await worker.publish(record, { summary: 'fix behavior', reply: '已修复。' });
  assert.equal(record.status, 'published'); assert.notEqual(record.commitSha, baseSha);
  assert.deepEqual(calls, [`${record.commitSha}:refs/heads/${branch}`, 'CI', `${record.commitSha}:refs/heads/main`]);
  assert.ok(!git(['status', '--porcelain']));
});
test('dispatch failure can be explicitly retried after checking that no accepted run exists', async t => {
  const worker = new Worker(fixture(t)); await worker.initialize(); let dispatched = 0;
  const record = { commitSha: 'b'.repeat(40), validationRequestedAt: new Date().toISOString(), validationDispatchError: 'offline' };
  worker.command = async () => { dispatched++; return { stdout: '' }; };
  let lookup = 0;
  worker.json = async args => {
    if (args.at(-1).includes('/jobs?')) return { jobs: [{ name: 'validate', conclusion: 'success', steps:
      ['Validate JS overwrites', 'Validate artifact contracts', 'Validate process direct', 'Check Karing generation'].map(name => ({ name, conclusion: 'success' })) }] };
    lookup++; return { workflow_runs: lookup === 1 ? [] : [validationRun(record, { created_at: new Date().toISOString() })] };
  };
  await worker.validate(record); assert.equal(dispatched, 1); assert.equal(record.validationConclusion, 'success');
});
test('a recovered publication updates its own failure reply instead of duplicating or keeping stale failure text', async t => {
  const worker = new Worker(fixture(t)); await worker.initialize(); worker.actor = 'owner'; const methods = [];
  worker.command = async (bin, args) => {
    if (args.includes('--slurp')) return { stdout: JSON.stringify([[{ id: 9, user: { login: 'owner' }, body: '<!-- scki-local-codex:abc -->\nfailed' }]]) };
    methods.push(args[2]); return { stdout: '{"id":9}' };
  };
  const record = { task: { taskKey: 'abc', issueNumber: 1 }, reply: 'published', status: 'published' };
  await worker.reply(record); assert.deepEqual(methods, ['PATCH']); assert.equal(record.commentId, 9);
});
