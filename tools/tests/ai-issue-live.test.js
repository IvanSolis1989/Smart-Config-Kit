'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { applySandboxPatch } = require('../test-ai-issue-live');

const repoRoot = path.resolve(__dirname, '../..');

function fixture(t, transform = (value) => value) {
  const caseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-live-parser-'));
  t.after(() => fs.rmSync(caseDir, { recursive: true, force: true }));
  const original = fs.readFileSync(path.join(repoRoot, 'docs/README.md'), 'utf8');
  const updated = transform(original.replace(/^# docs(?=\r?\n|$)/, '# 文档索引'));
  const rawResponse = `<!-- AI_REPLY -->\n修改标题。\n<!-- /AI_REPLY -->\n<!-- AI_PATCH:docs/README.md -->\n${updated}\n<!-- /AI_PATCH -->\n<!-- AI_PR -->\n文档：修正索引标题\n|\n仅修改标题。\n<!-- /AI_PR -->`;
  const result = { status: 'ok', hasPatch: true, patchableFiles: ['docs/README.md'] };
  fs.writeFileSync(path.join(caseDir, 'response.txt'), rawResponse);
  fs.writeFileSync(path.join(caseDir, 'result.json'), JSON.stringify(result));
  return { repoRoot, caseDir, result, rawResponse, original };
}

test('live acceptance uses production Python to apply and read back a complete sandbox patch', (t) => {
  const result = applySandboxPatch(fixture(t));
  assert.deepEqual(result.appliedFiles, ['docs/README.md']);
  assert.equal(result.expectedSha256, result.actualSha256);
});

test('live acceptance rejects a successful API response that changed unrelated content', (t) => {
  assert.throws(() => applySandboxPatch(fixture(t, (value) => `${value}\nunauthorized extra content\n`)), /preserve all other contents/);
});

test('live acceptance requires the production context to provide the whole editable target', (t) => {
  const data = fixture(t);
  data.result.patchableFiles = [];
  assert.throws(() => applySandboxPatch(data), /entire target/);
});
