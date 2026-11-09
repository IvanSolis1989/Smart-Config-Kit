'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),z=require('../vendor/fflate/umd');
const {EN,createConfigurationLocale,validateDisplayCatalog,localizeStaticMarkup}=require('../lib/configuration-locale');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'docs/configuration.html'),'utf8');
const packed=html.match(/atob\('([A-Za-z0-9+/=]+)'\)/)[1],bundle=JSON.parse(z.strFromU8(z.unzlibSync(Buffer.from(packed,'base64'))));
test('every dynamic display catalog entry is translated; unknown additions fail at build time',()=>{
  validateDisplayCatalog(bundle);
  assert.throws(()=>validateDisplayCatalog({...bundle,services:[{group:'未登记新业务'}]}),/Missing/);
  for(const [source,text]of Object.entries(EN)) if(!['简体中文','Language / 语言'].includes(source)) assert.doesNotMatch(text,/[\u3400-\u9fff]/u);
  assert.throws(()=>localizeStaticMarkup('<h1>未登记页面文字</h1>'),/Missing/);
});
test('static document is English before JS; Chinese is an explicit language option',()=>{
  assert.match(html,/<html lang="en">/); const markup=html.slice(0,html.indexOf('<script>'));
  const texts=[...markup.matchAll(/>([^<>]+)</g)].map(m=>m[1].trim()).filter(x=>x && !x.includes('{'));
  for(const text of texts) if(!['Language / 语言','简体中文'].includes(text)) assert.doesNotMatch(text,/[\u3400-\u9fff]/u);
  assert.doesNotMatch(html,/navigator\.(?:language|languages)/);
  assert.match(markup,/<select id="language"/);
});
test('unknown errors are localized safely; storage failures and invalid locales do not select Chinese',()=>{
  const locale=createConfigurationLocale(EN,{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});
  assert.equal(locale.language,'en');assert.equal(locale.choose('auto'),false);
  assert.match(locale.error(Error('arbitrary hidden internals')),/Unable to generate/);
  locale.choose('zh'); assert.match(locale.error(Error('arbitrary hidden internals')),/无法生成/);
});
