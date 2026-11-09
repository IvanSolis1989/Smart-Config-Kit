#!/usr/bin/env node
'use strict';
// Integrity and coverage guard, not a claim of semantic translation equivalence.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
function validateReadmeLocales(manifest, files, read) {
  const failures=[];
  if(manifest.schema_version!==1 || !Array.isArray(manifest.pairs)) return ['Invalid README localization manifest'];
  const actual=new Set(files.filter(f=>/(^|\/)README\.md$/.test(f)));
  const seen=new Set();
  for(const pair of manifest.pairs) {
    const en=pair.english, zh=pair.chinese;
    if(typeof en!=='string'||en.includes('..')||path.isAbsolute(en)||!/(^|\/)README\.md$/.test(en)||zh!==en.replace(/README\.md$/,'README.zh-CN.md')) {failures.push('Invalid locale pair');continue;}
    if(seen.has(en))failures.push(`Duplicate pair: ${en}`);seen.add(en);
    if(!actual.has(en))failures.push(`Untracked or stale English page: ${en}`);
    if(!files.includes(zh))failures.push(`Missing tracked Chinese edition: ${zh}`);
    for(const [file,key] of [[en,'english_sha256'],[zh,'chinese_sha256']]) {
      let content;try{content=read(file);}catch{failures.push(`Missing page: ${file}`);continue;}
      if(sha256(content)!==pair[key])failures.push(`Locale review is stale: ${file}`);
      const opening=content.split(/\r?\n/)[0];
      if(file===en) {
        if(!/^\[\*\*English\*\*\]\(README\.md\) \| \[中文\]\(README\.zh-CN\.md\)$/.test(opening))failures.push(`English default/explicit Chinese navigation missing: ${en}`);
        if(/assets\/readme\/zh-CN\//.test(content))failures.push(`English page selects Chinese visual assets: ${en}`);
      } else if(!/^\[English\]\(README\.md\) \| \*\*中文\*\*$/.test(opening))failures.push(`Chinese return navigation missing: ${zh}`);
    }
  }
  for(const f of actual)if(!seen.has(f))failures.push(`New README needs paired localization review: ${f}`);
  return failures;
}
if(require.main===module) {
  const root=path.resolve(__dirname,'..');
  const files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/readme-localization.json'),'utf8'));
  const failures=validateReadmeLocales(manifest,files,f=>fs.readFileSync(path.join(root,f),'utf8'));
  if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log(`PASS ${manifest.pairs.length} README locale pairs: coverage, explicit navigation and reviewed-content hashes`);
}
module.exports={validateReadmeLocales,sha256};
