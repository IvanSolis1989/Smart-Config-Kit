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
