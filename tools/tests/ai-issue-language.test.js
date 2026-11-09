'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { POLICY,language,text,assertLanguage,assertReplyLanguage,issueComment }=require('../lib/ai-issue-language');
const { buildRequest,callMiMo }=require('../lib/ai-issue-responder');
const {parseFailure,respondFailure}=require('../lib/ai-issue-fallback');
const questions={zh:'导入配置后无法下载规则，请检查原因。',en:'The rules cannot download. Why does this fail?',ja:'設定を読み込むとエラーになります。なぜですか？',ko:'설정을 가져오면 오류가 발생합니다. 왜 그런가요?',id:'Mengapa saya tidak bisa mengunduh aturan ini?',es:'¿Por qué no puedo descargar el archivo?',fr:'Pourquoi le fichier ne fonctionne pas avec cette configuration ?',de:'Warum funktioniert die Datei nicht?',pt:'Por que não consigo baixar o arquivo?',ru:'Почему не работает файл?',ar:'لماذا لا يعمل هذا الملف؟'};
test('supported question language comes from body, not template headings, title or logs',()=>{
 for(const [locale,body] of Object.entries(questions)) assert.equal(language({body,title:'English title'}),locale);
 assert.equal(language({title:'Why does this fail?',body:'### 出问题的产物\n- [x] 我确认\nThe download does not work.\n```log\n中文错误\n```'}),'en');
 assert.equal(language({title:'Why does this fail?',body:'导入后失败，请问如何解决？\n```log\nThe download has failed\n```'}),'zh');
 assert.equal(language({title:questions.en,body:'```\n错误日志\n```'}),'en');
 for(const body of ['123 SRS', 'no', 'ภาษาไทย', 'Український файл не працює', 'فایل کار نمی‌کند']) assert.equal(language({body}),'und');
 assert.throws(()=>assertLanguage('und'),/REPLY_LANGUAGE_UNCERTAIN/);
});
test('prompts match question language without treating language as permission',()=>{
 const r=buildRequest({body:questions.en,title:'中文标题',context:'中文文档',codeMod:true});
 assert.ok(r.messages[0].content.includes(POLICY));
 assert.doesNotMatch(r.messages[0].content,/先用中文|中文分析与修改说明|中文标题/);
 assert.match(POLICY,/never grants permissions/);
 assertReplyLanguage('en','The problem is not fixed. Check `规则/配置.json` and `HTTP 403`.');
 assertReplyLanguage('zh','请检查 `HTTP 403` 与 `tools/test.js`，目前尚未修复。');
 assert.throws(()=>assertReplyLanguage('en','这是中文回答。'),/REPLY_LANGUAGE_MISMATCH/);
});
test('fixed templates and wrappers are localized; unknown languages never publish a fallback language',()=>{
 for(const locale of Object.keys(questions)) {
  for(const key of ['header','incomplete','disclaimer','localFailure','superseded','commit','verification','notReady']) { assert.ok(text(locale,key)); assertReplyLanguage(locale,text(locale,key)); }
  const comment=issueComment({locale,reply:text(locale,'incomplete'),model:'mimo-v2.6-flash'});
  assert.ok(comment.includes(text(locale,'header')));
  if(locale==='en') assert.doesNotMatch(comment,/[\u4e00-\u9fff]/);
  if(locale==='zh') assert.doesNotMatch(comment,/Model:|Status:|Tier:|Workflow:/);
 }
 assert.throws(()=>issueComment({locale:'und',reply:'x'}),/REPLY_LANGUAGE_UNCERTAIN/);
});
test('provider failures localize without changing rejection or retry semantics',async()=>{
 for(const locale of ['zh','en','ja']) {
  let calls=0;
  const result=await callMiMo({apiKey:'not-real',replyLanguage:locale,request:{},fetchImpl:async()=>{calls++;return {status:403,headers:{get:()=>''},text:async()=>JSON.stringify({error:{code:'forbidden'}})}}});
  assert.equal(calls,1);assert.equal(result.status,'api_error');assert.equal(result.reply,text(locale,'incomplete'));
 }
 let calls=0;
 await assert.rejects(callMiMo({apiKey:'not-real',replyLanguage:'und',request:{},fetchImpl:async()=>{calls++;}}),/REPLY_LANGUAGE_UNCERTAIN/);
 assert.equal(calls,0);
});
test('new language-neutral failure receipt retains owner authentication and legacy Chinese compatibility',async()=>{
 const repository='owner/repo',ownerId=11;
 const source={id:1,user:{id:ownerId,type:'User'},issue_url:'https://api.github.com/repos/owner/repo/issues/196',body:'<!-- scki-local-codex:issue-196-opened -->\n<!-- scki-local-codex-state:failed -->\n'+text('en','localFailure')};
 assert.equal(parseFailure(source,{repository,ownerId}).issueNumber,196);
 assert.equal(parseFailure({...source,user:{id:12,type:'User'}},{repository,ownerId}),null);
 assert.equal(parseFailure({...source,body:source.body.replace('state:failed','state:complete')},{repository,ownerId}),null);
 let writes=0;
 await assert.rejects(respondFailure({source,repository,ownerId,apiKey:'not-real',api:{get:async()=>({number:196,state:'open',body:'ภาษาไทย'}),list:async()=>[],post:async()=>{writes++;}}}),/REPLY_LANGUAGE_UNCERTAIN/);
 assert.equal(writes,0);
});
test('Codex runtime includes localized helper and no forced-Chinese reply prompt',()=>{
 const worker=fs.readFileSync('tools/lib/local-codex-worker.js','utf8');
 assert.doesNotMatch(worker,/reply 是可公开的中文/);
 assert.match(worker,/assertReplyLanguage\(record.replyLanguage, parsed.reply\)/);
 assert.match(worker,/scki-local-codex-state:failed/);
 assert.match(fs.readFileSync('tools/install-local-codex-issue-worker.ps1','utf8'),/ai-issue-language\.js/);
});
test('wrong-language model output is terminal invalid response, never patch publication or extra model attempt',async()=>{
 let calls=0;
 const result=await callMiMo({apiKey:'not-real',replyLanguage:'en',request:{},fetchImpl:async()=>{calls++;return {status:200,headers:{get:()=>''},text:async()=>JSON.stringify({choices:[{finish_reason:'stop',message:{content:'这是中文回答。'}}]})}}});
 assert.equal(calls,1);assert.equal(result.status,'invalid_response');assert.equal(result.hasPatch,false);assert.equal(result.rawResponse,'');
 assert.equal(result.reply,text('en','incomplete'));
});
test('Chinese logs do not override English author prose, and unnecessary bilingual glosses are rejected',()=>{
 const body='The download fails when I import this file. Why does the app not register the rule set?\nERROR 下载失败，请检查网络\n2026-11-09 12:00:00 中文错误\nThe error message is “下载规则失败”.';
 assert.equal(language({body,title:'下载失败'}),'en');
 for(const reply of ['请在 App 中检查配置。','这个 Issue 已有说明。','这可能是注册(registration)问题。']) assert.throws(()=>assertReplyLanguage('zh',reply),/REPLY_LANGUAGE_MISMATCH/);
 assertReplyLanguage('zh','请检查 Karing 应用的注册行为，原始错误为 `App registration failed`，配置键为 `rule_set`。');
});
test('English fallback claim, answer and disclaimer contain no Chinese prose',async()=>{
 const repository='owner/repo',ownerId=11,botId=12,comments=[];
 const source={id:1,user:{id:ownerId,type:'User'},issue_url:'https://api.github.com/repos/owner/repo/issues/196',body:'<!-- scki-local-codex:issue-196-opened -->\n本次自动处理未完成，尚未发布到 main。'};
 const issue={number:196,state:'open',body:questions.en};
 let models=0;const writes=[];
 const options={repository,ownerId,botId,source,apiKey:'not-real',repoRoot:'.',contextBuilder:()=>({text:'Evidence'}),
 requestMiMo:async({replyLanguage})=>{models++;assert.equal(replyLanguage,'en');return {status:'ok',reply:'The download behavior needs verification. This is not a confirmed fix.'};},
 api:{get:async p=>p.endsWith('comments/1')?source:issue,list:async()=>comments,
 post:async(p,data)=>{writes.push(data.body);const c={id:2,user:{id:botId,type:'Bot',login:'github-actions[bot]'},...data};comments.push(c);return c;},
 patch:async(p,data)=>{writes.push(data.body);Object.assign(comments[0],data);return comments[0];}}};
 assert.equal((await respondFailure(options)).status,'complete');
 assert.equal((await respondFailure(options)).status,'already_handled');
 issue.body='ภาษาไทย';
 assert.equal((await respondFailure(options)).status,'already_handled');
 assert.equal(models,1);assert.equal(comments.length,1);
 for(const body of writes) assert.doesNotMatch(body,/[\u4e00-\u9fff]/);
});
test('reply validation preserves uppercase words, headings and quoted prose',()=>{
 for(const reply of [
  '请在 APP 中检查配置。','这个 ISSUE 需要处理。',
  '## Conclusion\n目前需要检查配置。','## THE DOWNLOAD FAILED\n请检查配置。',
  '目前需要检查配置。\n"The download failed because the app is not ready."',
  '“The configuration is invalid.”\n请检查配置。',
  '> The configuration is invalid.\n请检查配置。'
 ]) assert.throws(()=>assertReplyLanguage('zh',reply),/REPLY_LANGUAGE_MISMATCH/);
 assertReplyLanguage('zh','## 结论\n请检查 Karing，错误原文为 `THE APP FAILED`。\n```text\nThe configuration is invalid.\n```');
 assert.equal(language({body:'Download failed'}),'en');
 assert.equal(language({body:'Import error'}),'en');
});
