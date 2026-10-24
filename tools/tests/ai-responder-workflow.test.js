'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const workflow = fs.readFileSync(path.resolve(__dirname, '../../.github/workflows/ai-responder.yml'), 'utf8');
const { clientDirectory } = require('../lib/client-layout');

test('AI patch allowlist names complete client directories and keeps family roots closed', () => {
  const block = workflow.match(/ALLOWED_PREFIXES = \[([\s\S]*?)\]/)[1];
  const prefixes = [...block.matchAll(/'([^']+)'/g)].map(match => match[1]);
  for (const client of ['Clash Party', 'Clash Meta For Android', 'OpenClash', 'Shadowrocket', 'Stash',
    'SingBox', 'v2rayN', 'Surge', 'Loon', 'Quantumult X', 'Passwall', 'Passwall2', 'FlClash']) {
    const directory = clientDirectory(client);
    assert.ok(prefixes.includes(`${directory}/`));
    assert.ok(!prefixes.includes(`${directory.split('/')[0]}/`));
  }
  assert.ok(!prefixes.includes(`${clientDirectory('Egern')}/`));
  assert.ok(!prefixes.includes(`${clientDirectory('Karing')}/`));
});

test('workflow uses bounded context after category selection and the tested Node API runner', () => {
  assert.ok(workflow.indexOf('Determine category & model') < workflow.indexOf('Build bounded AI context'));
  assert.match(workflow, /run: node tools\/build-ai-issue-context\.js --output \/tmp\/context\.txt/);
  assert.match(workflow, /run: node tools\/respond-ai-issue\.js/);
  assert.doesNotMatch(workflow, /find "\$FOLDER"|head -260 AGENTS|PROMPT_BASE|steps\.llm\.outputs\.raw_response/);
  assert.match(workflow, /if: steps\.llm\.outputs\.status == 'ok'.*has_patch == 'true'/);
  assert.match(workflow, /if result\.get\('status'\) != 'ok' or not result\.get\('hasPatch'\)/);
  assert.match(workflow, /any\(raw_path\.strip\(\) not in patchable/);
});

test('embedded github-script programs compile and publish a status-aware result from file', () => {
  const blocks = [...workflow.matchAll(/^          script: \|\r?\n((?:            .*\r?\n|\r?\n)+)/gm)];
  assert.equal(blocks.length, 2);
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  for (const [, block] of blocks) {
    assert.doesNotThrow(() => new AsyncFunction('require', 'github', 'context', block.replace(/^            /gm, '')));
  }
  assert.match(blocks[0][1], /result\.status !== 'ok'/);
  assert.match(blocks[0][1], /readFileSync\('\/tmp\/ai-result\.json'/);
});

test('incomplete results publish a useful notice and then fail the workflow explicitly', () => {
  assert.ok(workflow.indexOf('Post reply to issue') < workflow.indexOf('Mark incomplete AI analysis'));
  assert.match(workflow, /name: Mark incomplete AI analysis\r?\n\s+if: .*status != 'ok'/);
  assert.match(workflow, /MiMo analysis did not complete[\s\S]*exit 1/);
});
