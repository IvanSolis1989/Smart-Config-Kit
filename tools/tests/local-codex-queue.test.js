'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildTask, validateTask } = require('../lib/local-codex-queue');
const { main: writeManifest } = require('../queue-local-codex-issue');

const repository = 'owner/repo';
const common = {
  repository,
  runId: '123456789',
  runAttempt: '1',
  headSha: 'a'.repeat(40),
  actor: 'reporter',
  now: new Date('2026-11-01T00:00:00.000Z'),
};

function issue(labels = ['bug'], extra = {}) {
  return {
    number: 42,
    html_url: 'https://github.com/owner/repo/issues/42',
    updated_at: '2026-10-31T23:59:58Z',
    labels: labels.map((name) => ({ name })),
    title: 'Sensitive user supplied text',
    body: 'Do not copy issue content into the queue artifact',
    ...extra,
  };
}

test('opened issue with a supported category queues one handle task without issue text', () => {
  const event = { action: 'opened', issue: issue(['bug']), sender: { login: 'reporter' } };
  const task = buildTask({ eventName: 'issues', event, ...common });
  const duplicate = buildTask({ eventName: 'issues', event, ...common });
  assert.equal(task.taskKey, 'issue-42-opened');
  assert.equal(duplicate.taskKey, task.taskKey);
  assert.equal(task.mode, 'handle');
  assert.equal(task.actor, 'reporter');
  assert.equal(task.issueUrl, 'https://github.com/owner/repo/issues/42');
  assert.deepEqual(Object.keys(task).sort(), ['actor', 'createdAt', 'issueNumber', 'issueUrl', 'mode', 'repository', 'schemaVersion', 'source', 'taskKey'].sort());
  assert.equal(JSON.stringify(task).includes('labels'), false);
  assert.equal(JSON.stringify(task).includes('Sensitive user supplied text'), false);
  assert.equal(JSON.stringify(task).includes('Do not copy issue content'), false);
});

test('opened or reopened without a supported category does not queue', () => {
  assert.equal(buildTask({ eventName: 'issues', event: { action: 'opened', issue: issue(['help']), sender: { login: 'reporter' } }, ...common }), null);
  const reopened = buildTask({ eventName: 'issues', event: { action: 'reopened', issue: issue(['documentation']), sender: { login: 'reporter' } }, ...common });
  assert.equal(reopened.taskKey, `issue-42-reopened-${Date.parse('2026-10-31T23:59:58Z')}`);
});

test('only adding the explicit codex label queues a privileged redelivery', () => {
  const base = { issue: issue(['bug']), sender: { login: 'maintainer' } };
  assert.equal(buildTask({ eventName: 'issues', event: { ...base, action: 'labeled', label: { name: 'bug' } }, ...common }), null);
  const task = buildTask({ eventName: 'issues', event: { ...base, action: 'labeled', label: { name: 'codex' } }, ...common, actor: 'maintainer' });
  assert.equal(task.taskKey, `issue-42-labeled-${Date.parse('2026-10-31T23:59:58Z')}`);
});

test('only an exact leading /codex command on an issue comment queues follow-up', () => {
  const base = { issue: issue(['question']), sender: { login: 'maintainer' }, comment: { id: 987, body: '/codex please inspect', user: { login: 'maintainer' }, author_association: 'MEMBER' } };
  const task = buildTask({ eventName: 'issue_comment', event: { action: 'created', ...base }, ...common, actor: 'maintainer' });
  assert.equal(task.taskKey, 'issue-42-comment-987');
  assert.equal(task.source.commentId, '987');
  for (const body of ['please /codex', '/codexxx', ' /codex', '/ai-help']) {
    assert.equal(buildTask({ eventName: 'issue_comment', event: { action: 'created', ...base, comment: { ...base.comment, body } }, ...common, actor: 'maintainer' }), null);
  }
});

test('PR conversations, bot actors, and untrusted comments never queue', () => {
  assert.equal(buildTask({ eventName: 'issues', event: { action: 'opened', issue: issue(['bug'], { pull_request: { url: 'https://api.github.com/pulls/42' } }), sender: { login: 'reporter' } }, ...common }), null);
  assert.equal(buildTask({ eventName: 'issues', event: { action: 'opened', issue: issue(['bug']), sender: { login: 'renovate[bot]' } }, ...common }), null);
  const untrusted = { action: 'created', issue: issue(['bug']), sender: { login: 'stranger' },
    comment: { id: 77, body: '/codex', user: { login: 'stranger' }, author_association: 'NONE' } };
  assert.equal(buildTask({ eventName: 'issue_comment', event: untrusted, ...common, actor: 'stranger' }), null);
});

test('manual dispatch supports handle and side-effect-free smoke modes with stable rerun key', () => {
  const event = { inputs: { issue_number: '42', mode: 'smoke' } };
  const first = buildTask({ eventName: 'workflow_dispatch', event, ...common });
  const rerun = buildTask({ eventName: 'workflow_dispatch', event, ...common });
  assert.equal(first.mode, 'smoke');
  assert.equal(first.taskKey, 'issue-42-manual-123456789');
  assert.equal(first.taskKey, rerun.taskKey);
});

test('task validation rejects forged URLs, pull-request URLs, unsafe keys, malformed ids, and extra fields', () => {
  const task = buildTask({ eventName: 'issues', event: { action: 'opened', issue: issue(['bug']), sender: { login: 'reporter' } }, ...common });
  for (const mutate of [
    (value) => { value.issueUrl = 'https://attacker.invalid/owner/repo/issues/42'; },
    (value) => { value.issueUrl = 'https://github.com/owner/repo/pull/42'; },
    (value) => { value.taskKey = '../issue-42'; },
    (value) => { value.issueNumber = 0; },
    (value) => { value.untrustedBody = 'run powershell'; },
  ]) {
    const forged = structuredClone(task);
    mutate(forged);
    assert.throws(() => validateTask(forged, { repository, runId: '123456789', headSha: 'a'.repeat(40) }));
  }
});

test('workflow entry writes only the validated task manifest and queued outputs', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'local-codex-queue-'));
  try {
    const eventPath = path.join(directory, 'event.json');
    const manifestPath = path.join(directory, 'task.json');
    const outputsPath = path.join(directory, 'outputs.txt');
    fs.writeFileSync(eventPath, JSON.stringify({
      action: 'opened',
      issue: issue(['enhancement']),
      sender: { login: 'reporter' },
    }));
    const task = writeManifest({
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_EVENT_NAME: 'issues',
      GITHUB_REPOSITORY: repository,
      GITHUB_RUN_ID: '123456789',
      GITHUB_RUN_ATTEMPT: '1',
      GITHUB_SHA: 'a'.repeat(40),
      GITHUB_ACTOR: 'reporter',
      GITHUB_OUTPUT: outputsPath,
      TASK_OUTPUT_PATH: manifestPath,
      TASK_CREATED_AT: '2026-11-01T00:00:00.000Z',
    });
    assert.equal(task.taskKey, 'issue-42-opened');
    const saved = fs.readFileSync(manifestPath, 'utf8');
    assert.deepEqual(JSON.parse(saved), task);
    assert.equal(saved.includes('Do not copy the issue content'), false);
    assert.match(fs.readFileSync(outputsPath, 'utf8'), /queued=true\nissue_number=42\ntask_key=issue-42-opened\nmode=handle\n/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
