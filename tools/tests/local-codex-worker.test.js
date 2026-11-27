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
    if (bin === 'gh') return { stdout: '{"state":"open","body":"请检查问题。"}' };
    if (bin === 'git' && args[0] === 'push') { calls.push(args.at(-1)); return { stdout: '' }; }
    if (bin === 'git' && args[0] === 'ls-remote') return { stdout: `${baseSha}\trefs/heads/main\n` };
    return command(bin, args, opts);
  } });
  await worker.initialize();
  worker.validate = async record => { calls.push('CI'); assert.equal(git(['rev-parse', 'HEAD']), record.commitSha);
    record.validation = ['real CI gate']; record.validationRunUrl = 'https://github.com/owner/repo/actions/runs/999'; };
  git(['add', 'source.js']);
  const record = { task: queuedTask(), cwd, baseSha, branch, seedTree: git(['write-tree']) };
  fs.writeFileSync(path.join(cwd, 'source.js'), 'changed by session\n');
  await assert.rejects(worker.publish(record, { summary: 'fix behavior', reply: '已修复。' }), /approved retry patch changed/);
  assert.deepEqual(calls, []);
  assert.equal(git(['rev-parse', 'HEAD']), baseSha);
  fs.writeFileSync(path.join(cwd, 'source.js'), 'after\n');
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
  const record = { task: { taskKey: 'abc', issueNumber: 1 }, reply: 'The fix is published.', status: 'published' };
  worker.snapshot = async () => ({body:'The download does not work.'});
  await worker.reply(record); assert.deepEqual(methods, ['PATCH']); assert.equal(record.commentId, 9);
});
test('Chinese and English full publish/resume receipts pass the final public reply language gate', async t => {
  const { assertReplyLanguage } = require('../lib/ai-issue-language');
  for (const locale of ['zh', 'en']) for (const mode of ['publish', 'resume']) {
    await t.test(`${locale} ${mode}`, async st => {
      const config = fixture(st), worker = new Worker(config);
      await worker.initialize(); worker.actor = 'owner';
      const issue = { state: 'open', body: locale === 'zh' ? '请检查下载失败问题。' : 'The download failed. Please check this issue.' };
      const answer = locale === 'zh' ? '已修复配置问题，检查通过。' : 'The configuration is fixed and the checks passed.';
      const baseSha = '1'.repeat(40), commitSha = 'abc123ef' + 'a'.repeat(32);
      const record = { task: queuedTask(), cwd: config.repositoryPath, baseSha, branch: 'codex/issue-1-test',
        status: 'failed', draftReply: answer, ...(mode === 'resume' ? { commitSha } : {}) };
      worker.state.tasks[record.task.taskKey] = record;
      let committed = mode === 'resume', posted = '', pushes = [];
      worker.snapshot = async () => issue;
      worker.changes = async () => ['source.js'];
      worker.fingerprint = async () => 'unchanged';
      worker.validate = async target => { target.validation = ['node tools/check.js']; target.validationRunUrl = 'https://github.com/owner/repo/actions/runs/99'; };
      worker.git = async args => {
        if (args[0] === 'rev-parse') return args[1] === 'FETCH_HEAD' ? baseSha : committed ? commitSha : baseSha;
        if (args[0] === 'branch') return record.branch;
        if (args[0] === 'remote') return 'https://github.com/owner/repo.git';
        if (args[0] === 'ls-remote') return `${baseSha}\trefs/heads/main`;
        if (args[0] === 'push') pushes.push(args.at(-1));
        if (args.includes('commit')) committed = true;
        return '';
      };
      worker.json = async args => {
        if (args.includes('--slurp')) return [[]];
        if (args.includes('--method')) {
          posted = JSON.parse(fs.readFileSync(args[args.indexOf('--input') + 1], 'utf8')).body;
          return { id: 99 };
        }
        return issue;
      };
      if (mode === 'publish') { await worker.publish(record, { summary: 'fix', reply: answer }); await worker.reply(record); }
      else await worker.resumePublication(record.task.taskKey);
      assert.equal(record.status, 'completed'); assert.equal(record.commentId, 99);
      assert.ok(pushes.includes(`${commitSha}:refs/heads/main`));
      assert.match(posted, /\[`abc123ef`\]\(https:\/\/github\.com\/owner\/repo\/commit\//);
      assertReplyLanguage(locale, posted);
      if (locale === 'zh') assert.throws(() => assertReplyLanguage(locale, posted + '\n## English explanation'), /REPLY_LANGUAGE_MISMATCH/);
      else assert.doesNotMatch(posted, /提交|验证/);
    });
  }
});

test('commit metadata stays English independently of Chinese issue replies', () => {
  const {formatCommitMessage}=require('../lib/local-codex-worker');
  assert.equal(formatCommitMessage(196),'[agent: codex] fix(#196): apply verified issue changes');
  assert.throws(()=>formatCommitMessage('196\nother'),/Invalid issue number/);
  assert.throws(()=>formatCommitMessage(-1),/Invalid issue number/);
});

const checkoutTransportFailure = 'git failed (128): error: RPC failed; curl 56 schannel: server closed abruptly (missing close_notify)\nerror: 8192 bytes of body are still expected\nfatal: early EOF\nfatal: could not fetch 8e3f47288327a2bc43e978703ebf28b4e7e2c411 from promisor remote';

async function checkoutFixture(t, resetFailure, failures = 1) {
  const config = fixture(t);
  const calls = [], delays = [];
  const worker = new Worker(config, { delay: async ms => delays.push(ms) });
  await worker.initialize();
  fs.mkdirSync(path.join(config.worktreeRoot, 'repository.git'));
  const record = { task: queuedTask(), attempt: 1 };
  worker.state.tasks[record.task.taskKey] = record;
  let resetAttempts = 0;
  worker.git = async (args, cwd) => {
    calls.push({ args, cwd });
    if (args.includes('get-url')) return 'https://github.com/owner/repo.git';
    if (args.includes('rev-parse')) return 'a'.repeat(40);
    if (args.includes('worktree')) {
      assert.ok(args.includes('--no-checkout'));
      assert.ok(args.includes('-b'));
      fs.mkdirSync(record.cwd);
    }
    if (args[0] === 'reset') {
      assert.deepEqual(args, ['reset', '--hard', '--quiet', record.baseSha]);
      assert.equal(cwd, record.cwd);
      resetAttempts++;
      if (resetAttempts <= failures) throw new Error(resetFailure);
    }
    return '';
  };
  return { worker, record, calls, delays };
}

test('checkout retries lazy blob transport in its fresh directory before starting Codex', async t => {
  const { worker, record, calls, delays } = await checkoutFixture(t, checkoutTransportFailure);
  let runs = 0;
  worker.snapshot = async () => ({ number: 1, state: 'open', title: '请检查配置', body: '请检查配置。' });
  worker.runCodexTask = async opts => {
    runs++;
    assert.equal(opts.cwd, record.cwd);
    assert.equal(calls.filter(call => call.args[0] === 'reset').length, 2);
    const longPathConfig = calls.find(call => call.args.includes('core.longpaths'));
    const lineEndingConfig = calls.find(call => call.args.includes('core.autocrlf'));
    if (process.platform === 'win32') {
      const localConfig = ['--git-dir', path.join(worker.config.worktreeRoot, 'repository.git'), 'config', '--local'];
      assert.deepEqual(longPathConfig?.args, [...localConfig, 'core.longpaths', 'true']);
      assert.deepEqual(lineEndingConfig?.args, [...localConfig, 'core.autocrlf', 'false']);
    } else {
      assert.equal(longPathConfig, undefined);
      assert.equal(lineEndingConfig, undefined);
    }
    assert.ok(calls.some(call => call.args[0] === 'status'));
    await opts.onThread('recovered-checkout-thread');
    return { status: 'completed', text: JSON.stringify({ outcome: 'answered', summary: 'verified', reply: '检查通过。' }) };
  };
  worker.changes = async () => [];
  worker.reply = async target => { target.status = 'completed'; };
  await worker.process(record);
  assert.equal(record.status, 'completed');
  assert.equal(record.threadId, 'recovered-checkout-thread');
  assert.equal(runs, 1);
  assert.equal(calls.filter(call => call.args.includes('worktree')).length, 1);
  assert.equal(delays.length, 1);
});

test('checkout does not retry certificate, authentication or ownership failures', async t => {
  for (const message of [
    'fatal: SSL certificate problem: unable to get local issuer certificate',
    'fatal: Authentication failed for https://github.com/owner/repo.git',
    'fatal: detected dubious ownership in repository',
  ]) {
    await t.test(message, async st => {
      const { worker, record, calls, delays } = await checkoutFixture(st, message, 3);
      await assert.rejects(worker.prepare(record), error => error.message === message);
      assert.equal(calls.filter(call => call.args[0] === 'reset').length, 1);
      assert.equal(calls.filter(call => call.args.includes('worktree')).length, 1);
      assert.equal(delays.length, 0);
      assert.ok(fs.existsSync(record.cwd));
    });
  }
});

test('checkout transport exhaustion preserves the original diagnostic and checkout', async t => {
  const { worker, record, calls, delays } = await checkoutFixture(t, checkoutTransportFailure, 3);
  worker.snapshot = async () => ({ number: 1, state: 'open', title: '请检查配置', body: '请检查配置。' });
  worker.runCodexTask = async () => { assert.fail('Codex must not start after checkout exhaustion'); };
  worker.reply = async () => {};
  await worker.process(record);
  assert.equal(record.status, 'failed');
  assert.equal(record.error, checkoutTransportFailure);
  const saved = JSON.parse(fs.readFileSync(worker.stateFile, 'utf8')).tasks[record.task.taskKey];
  assert.equal(saved.error, checkoutTransportFailure);
  assert.equal(saved.cwd, record.cwd);
  assert.equal(saved.threadId, undefined);
  assert.equal(calls.filter(call => call.args[0] === 'reset').length, 3);
  assert.equal(calls.filter(call => call.args.includes('worktree')).length, 1);
  assert.equal(delays.length, 2);
  assert.ok(fs.existsSync(record.cwd));
  assert.ok(!calls.some(call => call.args[0] === 'status'));
});

test('preexisting task directory is rejected before registration or hard reset', async t => {
  const { worker, record, calls } = await checkoutFixture(t, checkoutTransportFailure);
  // Discover the same deterministic target without completing its registration.
  worker.git = async args => {
    if (args.includes('get-url')) return 'https://github.com/owner/repo.git';
    if (args.includes('rev-parse')) return 'a'.repeat(40);
    if (args.includes('worktree')) { fs.mkdirSync(record.cwd); throw new Error('registration interrupted'); }
    return '';
  };
  await assert.rejects(worker.prepare(record), /registration interrupted/);
  const sentinel = path.join(record.cwd, 'existing-user-file');
  fs.writeFileSync(sentinel, 'preserve');
  calls.length = 0;
  worker.git = async args => {
    calls.push({ args });
    if (args.includes('get-url')) return 'https://github.com/owner/repo.git';
    if (args.includes('rev-parse')) return 'a'.repeat(40);
    return '';
  };
  await assert.rejects(worker.prepare(record), /already exists/);
  assert.ok(!calls.some(call => call.args.includes('worktree') || call.args[0] === 'reset'));
  assert.equal(fs.readFileSync(sentinel, 'utf8'), 'preserve');
});

test('explicit retry archives the failed attempt and clears its completion status', async t => {
  const worker = new Worker(fixture(t));
  await worker.initialize();
  const record = { task: queuedTask(), status: 'failed', completionStatus: 'failed', attempt: 1,
    threadId: 'old-thread', cwd: 'old-checkout', error: checkoutTransportFailure };
  worker.state.tasks[record.task.taskKey] = record;
  worker.retry(record.task.taskKey);
  assert.equal(record.status, 'queued');
  assert.equal(record.completionStatus, undefined);
  assert.equal(record.threadId, undefined);
  assert.equal(record.error, undefined);
  assert.equal(record.history.length, 1);
  assert.equal(record.history[0].status, 'failed');
  assert.equal(record.history[0].threadId, 'old-thread');
  assert.equal(record.history[0].cwd, 'old-checkout');
  assert.equal(record.history[0].error, checkoutTransportFailure);
});
