#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { language, assertLanguage, assertReplyLanguage, text } = require('./lib/ai-issue-language');
const { buildRequest, callMiMo } = require('./lib/ai-issue-responder');

async function main(env = process.env, { requestMiMo = callMiMo } = {}) {
  const replyLanguage = assertLanguage(language({ body: env.ISSUE_BODY, title: env.ISSUE_TITLE }));
  const contextPath = env.AI_CONTEXT_PATH || '/tmp/context.txt';
  const resultPath = env.AI_RESULT_PATH || '/tmp/ai-result.json';
  const rawPath = env.AI_RESPONSE_PATH || '/tmp/ai_response.txt';
  const outputs = (values) => {
    if (env.GITHUB_OUTPUT) fs.appendFileSync(env.GITHUB_OUTPUT,
      Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(''));
  };
  if (!env.MIMO_API_KEY) {
    // Clear any stale raw file, even when reusing a local test directory.
    fs.writeFileSync(rawPath, '');
    outputs({ skipped: true, has_patch: false, status: 'missing_key' });
    return;
  }
  const context = fs.readFileSync(contextPath, 'utf8');
  if (Buffer.byteLength(context, 'utf8') > 112 * 1024) throw new Error('Context budget exceeded');
  const manifest = JSON.parse(fs.readFileSync(`${contextPath}.json`, 'utf8'));
  const codeMod = env.CODE_MOD === 'true' && manifest.codeModAllowed === true;
  const request = buildRequest({ context, title: env.ISSUE_TITLE, body: env.ISSUE_BODY,
    comment: env.COMMENT_BODY, issueUrl: env.ISSUE_URL, category: env.CATEGORY,
    tier: env.TIER_MARK, model: env.MODEL || 'mimo-v2.6-flash', thinking: env.THINKING || 'enabled', codeMod });
  const result = await requestMiMo({ apiKey: env.MIMO_API_KEY, baseUrl: env.MIMO_BASE_URL || undefined, request,
    replyLanguage, timeoutMs: Number(env.CURL_TIMEOUT || 240) * 1000,
    onAttempt: (record) => console.log(`MiMo ${JSON.stringify(record)}`) });
  if (result.status === 'ok') {
    try { assertReplyLanguage(replyLanguage, result.reply); } catch {
      result.status = 'invalid_response'; result.hasPatch = false; result.rawResponse = '';
      result.reply = text(replyLanguage, 'incomplete');
    }
  }
  else result.reply = text(replyLanguage, 'incomplete');
  result.replyLanguage = replyLanguage;
  result.hasPatch = result.status === 'ok' && codeMod && result.hasPatch;
  result.codeModAllowed = codeMod;
  result.patchableFiles = codeMod ? manifest.files.filter((file) => file.complete).map((file) => file.path) : [];
  const rawResponse = result.hasPatch ? result.rawResponse : '';
  delete result.rawResponse;
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(rawPath, rawResponse);
  outputs({ skipped: false, has_patch: result.hasPatch, status: result.status });
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY,
    `### MiMo Issue responder\n\nStatus: \`${result.status}\` · HTTP: ${result.metadata.httpStatus} · finish_reason: \`${result.metadata.finishReason || 'unavailable'}\`\n`);
}

if (require.main === module) main().catch(error => {
  // Never log a provider response, request body, URL credentials or exception text.
  console.error(error?.code === 'REPLY_LANGUAGE_UNCERTAIN' ? 'REPLY_LANGUAGE_UNCERTAIN: maintainer review required; no public reply.' : 'AI responder configuration/context failure; no analysis or patch was published.');
  process.exitCode = 1;
});

module.exports = { main };
