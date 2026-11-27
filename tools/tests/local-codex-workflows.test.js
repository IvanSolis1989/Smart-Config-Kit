'use strict';

const vm = require('node:vm');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const workflowPath = path.resolve(__dirname, '../../.github/workflows/validate-local-codex-candidate.yml');

test('local mode suppresses both labeled and ai-help MiMo branches', () => {
  const workflow = fs.readFileSync(path.resolve(__dirname, '../../.github/workflows/ai-responder.yml'), 'utf8').replace(/\r\n/g, '\n');
  const expression = workflow.match(/respond:\s*\n\s+if: \|\n([\s\S]*?)\n\s+runs-on:/)[1];
  for (const eventName of ['issues', 'issue_comment']) {
    for (const enabled of ['true', 'false']) {
      const actual = vm.runInNewContext(expression, {
        vars: { LOCAL_CODEX_ENABLED: enabled },
        github: { event_name: eventName, event: { label: { name: 'bug' }, comment: { body: '/ai-help', author_association: 'OWNER' } } },
        contains: (body, text) => body.includes(text)
      });
      assert.equal(actual, enabled !== 'true', `${eventName} / ${enabled}`);
    }
  }
});

test('candidate workflow requires explicit enablement and serializes per repository', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  assert.match(workflow, /^name: Validate Local Codex Candidate$/m);
  assert.match(workflow, /^run-name: Local Codex candidate \$\{\{ inputs\.commit_sha \}\}$/m);
  assert.match(workflow, /workflow_dispatch:[\s\S]*?commit_sha:[\s\S]*?required: true[\s\S]*?type: string/);
  assert.match(workflow, /if:\s*vars\.LOCAL_CODEX_ENABLED == 'true'/);
  assert.match(workflow, /group: validate-local-codex-candidate-\$\{\{ github\.repository \}\}/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /timeout-minutes: 20/);
});

test('candidate validation verifies a staging branch SHA via a scoped token and checks out that immutable SHA', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  assert.match(workflow, /permissions:\s*\n\s+contents: read(?:\s*\n|$)/);
  assert.doesNotMatch(workflow, /administration:\s*(?:write|read)|contents:\s*write|issues:\s*write|pull-requests:\s*write/);
  assert.match(workflow, /COMMIT_SHA: \$\{\{ inputs\.commit_sha \}\}/);
  assert.match(workflow, /REPOSITORY: \$\{\{ github\.repository \}\}/);
  assert.match(workflow, /\^\[a-f0-9\]\{40\}\$/);
  assert.match(workflow, /git\/matching-refs\/heads\/codex\/issue-/);
  assert.match(workflow, /refs\/heads\/codex\/issue-\[0-9\]\+-\[a-f0-9\]\{20\}/);
  assert.match(workflow, /\.object\.sha == \$sha/);
  assert.match(workflow, /ref: \$\{\{ inputs\.commit_sha \}\}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.equal((workflow.match(/GH_TOKEN:/g) || []).length, 1);
  assert.doesNotMatch(workflow, /actions:\s*write|secrets\.(?:MIMO|TAVILY|GH|GITHUB)_/);
});

test('candidate workflow runs each required read-only gate as a separate blocking step', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  const commands = [
    'git diff --check HEAD^ HEAD',
    'node tools/validate-js-overwrites.js',
    'node tools/validate-artifact-contracts.js',
    'node tools/validate-process-name-direct.js',
    'node tools/generate-karing.js --check',
  ];
  for (const command of commands) assert.ok(workflow.includes(`run: ${command}`), `missing blocking command: ${command}`);
  for (const step of ['Validate JS overwrites', 'Validate artifact contracts', 'Validate process direct', 'Check Karing generation']) {
    assert.ok(workflow.includes(`- name: ${step}`), `missing expected step name: ${step}`);
  }
  assert.match(workflow, /ruby --version/);
  assert.match(workflow, /node-version: '22'/);
  assert.match(workflow, /uses: actions\/checkout@v4[\s\S]*?ref: \$\{\{ inputs\.commit_sha \}\}/);
  assert.doesNotMatch(workflow, /workflow_run:|uses:\s*\.\/|gh pr|git push|npm publish/);
});

test('queue workflow admits author metadata and preserves maintainer command permission checks', () => {
  const workflow = fs.readFileSync(path.resolve(__dirname, '../../.github/workflows/local-codex-issue.yml'), 'utf8').replace(/\r\n/g, '\n');
  const expression = workflow.match(/enqueue:\s*\n\s+if: \|\n([\s\S]*?)\n\s+runs-on:/)[1];
  const authorExpression = workflow.match(/AUTHOR_FOLLOWUP: \$\{\{ (.*) \}\}/)[1];
  function evaluate(event, script = expression) {
    return vm.runInNewContext(script.replace(/github\.event\.issue\.labels\.\*\.name/g, 'github.event.issue.labels.map(label => label.name)'), {
      vars: { LOCAL_CODEX_ENABLED: 'true' },
      github: { event_name: 'issue_comment', event },
      startsWith: (value, prefix) => String(value || '').startsWith(prefix),
      contains: (value, item) => value.includes(item),
      fromJSON: JSON.parse,
    });
  }
  const user = { id: 123, login: 'author', type: 'User' };
  const base = { issue: { state: 'open', user }, sender: user,
    comment: { body: 'Can you explain the new group?', user, author_association: 'NONE' } };
  assert.equal(evaluate(base), true);
  assert.equal(evaluate(base, authorExpression), true);
  for (const mutate of [
    event => { event.issue.state = 'closed'; },
    event => { event.comment.user.id = 124; },
    event => { delete event.issue.user.id; },
    event => { event.comment.user.type = 'Bot'; },
    event => { event.sender.type = 'Bot'; },
    event => { event.comment.author_association = 'OWNER'; },
    event => { event.comment.body = '/codex please fix'; },
  ]) {
    const event = structuredClone(base);
    // Separate identity objects so changing a sender cannot mutate the issue author.
    event.issue.user = { ...event.issue.user };
    event.comment.user = { ...event.comment.user };
    event.sender = { ...event.sender };
    mutate(event);
    assert.equal(evaluate(event), false, mutate.toString());
    assert.equal(evaluate(event, authorExpression), false, mutate.toString());
  }
  const privileged = structuredClone(base);
  privileged.comment.author_association = 'MEMBER';
  privileged.comment.body = '/codex please fix';
  assert.equal(evaluate(privileged), true);
  assert.equal(evaluate(privileged, authorExpression), false);
  assert.match(workflow, /PERMISSION=\$\(gh api "repos\/\$REPO\/collaborators\/\$ACTOR\/permission"/);
  assert.match(workflow, /write\|maintain\|admin\)/);
  assert.doesNotMatch(workflow, /run:.*\$\{\{ github\.event\.comment\.body/);
});
