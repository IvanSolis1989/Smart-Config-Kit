#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { buildIssueContext } = require('./lib/ai-issue-context');
const { callMiMo } = require('./lib/ai-issue-responder');
const { main: respond } = require('./respond-ai-issue');

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const normalize = (value) => value.replace(/\r\n/g, '\n').replace(/\n*$/, '\n');

function applySandboxPatch({ repoRoot, caseDir, result, rawResponse, original }) {
  assert.equal(result.status, 'ok');
  assert.equal(result.hasPatch, true, 'a real, complete patch is required');
  assert.ok(result.patchableFiles.includes('docs/README.md'), 'production context must supply the entire target');
  assert.match(rawResponse, /<!--\s*AI_PR\s*-->\s*[^\n]+\n[\s\S]+<!--\s*\/AI_PR\s*-->/);
  const sandbox = path.join(caseDir, 'sandbox');
  fs.mkdirSync(path.join(sandbox, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(sandbox, 'docs/README.md'), original);
  const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/ai-responder.yml'), 'utf8');
  const match = workflow.match(/python3 <<'PY'[^\n]*\n([\s\S]*?)\n          PY/);
  assert.ok(match, 'use the actual production patch application program');
  let program = match[1].replace(/^          /gm, '');
  for (const [before, after] of [
    ['/tmp/ai_response.txt', path.join(caseDir, 'response.txt')],
    ['/tmp/ai-result.json', path.join(caseDir, 'result.json')],
    ['/tmp/modified_files.txt', path.join(caseDir, 'modified_files.txt')],
  ]) program = program.replaceAll(`'${before}'`, JSON.stringify(after));
  const python = process.platform === 'win32' ? 'python' : 'python3';
  const output = execFileSync(python, ['-X', 'utf8', '-c', program], { cwd: sandbox, encoding: 'utf8', timeout: 15000 });
  assert.match(output, /PATCH_COUNT=1/);
  const modified = fs.readFileSync(path.join(caseDir, 'modified_files.txt'), 'utf8').trim().split(/\r?\n/);
  assert.deepEqual(modified, ['docs/README.md']);
  const updated = fs.readFileSync(path.join(sandbox, 'docs/README.md'), 'utf8');
  const expected = original.replace(/^# docs(?=\r?\n|$)/, '# 文档索引');
  assert.notEqual(normalize(expected), normalize(original), 'the task must actually change the title');
  assert.equal(normalize(updated), normalize(expected), 'saved result must preserve all other contents');
  assert.equal(fs.readFileSync(path.join(repoRoot, 'docs/README.md'), 'utf8'), original, 'live tests must not edit the repository target');
  return { appliedFiles: modified, expectedSha256: hash(normalize(expected)), actualSha256: hash(normalize(updated)) };
}

async function runCase({ repoRoot, outputDir, spec, apiKey, baseUrl, model }) {
  const caseDir = path.join(outputDir, spec.name);
  fs.mkdirSync(caseDir, { recursive: true });
  const context = buildIssueContext({ repoRoot, title: spec.title, body: spec.body, codeMod: spec.codeMod });
  const contextPath = path.join(caseDir, 'context.txt');
  const { text, ...manifest } = context;
  fs.writeFileSync(contextPath, text);
  fs.writeFileSync(`${contextPath}.json`, JSON.stringify(manifest, null, 2));
  let requestReceipt;
  const startedAt = new Date().toISOString();
  await respond({ MIMO_API_KEY: apiKey, MIMO_BASE_URL: baseUrl, MODEL: model, THINKING: 'enabled',
    ISSUE_TITLE: spec.title, ISSUE_BODY: spec.body, ISSUE_URL: spec.url || '', COMMENT_BODY: '',
    CATEGORY: spec.category, TIER_MARK: 'FIRST', CODE_MOD: String(spec.codeMod), CURL_TIMEOUT: '240',
    AI_CONTEXT_PATH: contextPath, AI_RESULT_PATH: path.join(caseDir, 'result.json'), AI_RESPONSE_PATH: path.join(caseDir, 'response.txt'),
  }, { requestMiMo: async (args) => {
    const serialized = JSON.stringify(args.request);
    requestReceipt = { model: args.request.model, inputBytes: Buffer.byteLength(serialized), requestSha256: hash(serialized),
      codeModAllowed: manifest.codeModAllowed, contextBytes: manifest.contextBytes };
    return callMiMo(args);
  } });
  const result = JSON.parse(fs.readFileSync(path.join(caseDir, 'result.json'), 'utf8'));
  const receipt = { name: spec.name, startedAt, completedAt: new Date().toISOString(), ...requestReceipt,
    status: result.status, metadata: result.metadata, replySha256: hash(result.reply), passed: false };
  try {
    assert.equal(result.status, 'ok', 'MiMo must deliver an accepted, complete answer');
    if (spec.name === 'issue-186') {
      assert.equal(result.hasPatch, false, 'the current config is already repaired');
      for (const pattern of [/DoingDog|a1\/fin/i, /jsDelivr/i, /50\s*M|大小|体积|限制/, /raw\.githubusercontent\.com/, /导入|旧副本|旧配置/]) {
        assert.match(result.reply, pattern, `answer must address ${pattern}`);
      }
      receipt.checks = ['retired upstream', 'CDN size restriction', 'current raw endpoint', 'actionable import guidance', 'no unnecessary patch'];
    } else {
      receipt.sandbox = applySandboxPatch({ repoRoot, caseDir, result,
        rawResponse: fs.readFileSync(path.join(caseDir, 'response.txt'), 'utf8'), original: spec.original });
      receipt.checks = ['complete production source context', 'complete patch and PR metadata', 'production parser applied one file', 'exact saved-content comparison'];
    }
    receipt.passed = true;
  } catch (error) {
    receipt.failure = error instanceof assert.AssertionError ? error.message.split('\n')[0] : 'Sandbox verification failed';
  }
  fs.writeFileSync(path.join(caseDir, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify(receipt));
  return receipt;
}

async function main(argv = process.argv.slice(2), env = process.env) {
  const options = new Map();
  for (let i = 0; i < argv.length; i += 2) {
    if (!['--output', '--model', '--case'].includes(argv[i]) || !argv[i + 1]) throw new Error('Invalid live-test arguments');
    options.set(argv[i], argv[i + 1]);
  }
  const selectedCase = options.get('--case') || 'all';
  if (!['all', 'issue-186', 'docs-title'].includes(selectedCase)) throw new Error('Invalid test case');
  const apiKey = env.MIMO_API_KEY || env.MIMO_TOKEN_PLAN_API_KEY;
  if (!apiKey) throw new Error('MiMo credentials are unavailable');
  const repoRoot = path.resolve(__dirname, '..');
  const outputDir = path.resolve(options.get('--output') || fs.mkdtempSync(path.join(os.tmpdir(), 'scki-mimo-acceptance-')));
  fs.mkdirSync(outputDir, { recursive: true });
  const specs = [];
  if (selectedCase !== 'docs-title') {
    const issue = JSON.parse(execFileSync('gh', ['issue', 'view', '186', '--repo', 'IvanSolis1989/Smart-Config-Kit', '--json', 'title,body,url'], { encoding: 'utf8', timeout: 30000 }));
    specs.push({ name: 'issue-186', ...issue, codeMod: true, category: 'bug' });
  }
  if (selectedCase !== 'issue-186') specs.push({ name: 'docs-title', codeMod: true, category: 'documentation',
    title: '修正 docs/README.md 标题', body: '仅将 docs/README.md 第一行 # docs 改成 # 文档索引，其余文字、链接和顺序全部保留。请输出完整文件补丁及中文 PR 标题和正文；无需修改其它文件。',
    original: fs.readFileSync(path.join(repoRoot, 'docs/README.md'), 'utf8') });
  const receipts = [];
  for (const spec of specs) receipts.push(await runCase({ repoRoot, outputDir, spec, apiKey,
    baseUrl: env.MIMO_BASE_URL || undefined, model: options.get('--model') || 'mimo-v2.6-flash' }));
  const summary = { passed: receipts.every((receipt) => receipt.passed), outputDir, cases: receipts };
  fs.writeFileSync(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.passed) process.exitCode = 1;
  return summary;
}

if (require.main === module) main().catch(() => { console.error('Live acceptance test could not complete; no commit was made.'); process.exitCode = 1; });

module.exports = { applySandboxPatch, runCase, main };
