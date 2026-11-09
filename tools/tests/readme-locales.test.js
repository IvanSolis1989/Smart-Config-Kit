'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {validateReadmeLocales,sha256}=require('../validate-readme-locales');
function fixture(){const contents={'README.md':'[**English**](README.md) | [中文](README.zh-CN.md)\n\n# Import guide\n','README.zh-CN.md':'[English](README.md) | **中文**\n\n# 导入说明\n'};const manifest={schema_version:1,pairs:[{english:'README.md',chinese:'README.zh-CN.md',english_sha256:sha256(contents['README.md']),chinese_sha256:sha256(contents['README.zh-CN.md'])}]};return {contents,manifest,files:Object.keys(contents),check(){return validateReadmeLocales(this.manifest,this.files,f=>this.contents[f]);}};}
test('complete reviewed bilingual pair passes',()=>assert.deepEqual(fixture().check(),[]));
test('a new client README cannot silently escape coverage',()=>{const f=fixture();f.files.push('New Client/README.md');assert.match(f.check().join('\n'),/New README needs/);});
test('either translation changing invalidates the shared review receipt',()=>{for(const name of ['README.md','README.zh-CN.md']){const f=fixture();f.contents[name]+='changed';assert.match(f.check().join('\n'),/review is stale/);}});
test('missing Chinese edition and explicit language choice fail',()=>{const f=fixture();f.files.pop();f.contents['README.md']='# 中文默认\n';assert.match(f.check().join('\n'),/Missing tracked Chinese/);assert.match(f.check().join('\n'),/English default/);});
test('English default cannot use Chinese visual catalogs',()=>{const f=fixture();f.contents['README.md']+='![image](docs/assets/readme/zh-CN/hero.svg)';assert.match(f.check().join('\n'),/Chinese visual/);});
test('duplicate and path-traversal entries fail closed',()=>{const f=fixture();f.manifest.pairs.push({...f.manifest.pairs[0]},{english:'../README.md',chinese:'../README.zh-CN.md'});assert.match(f.check().join('\n'),/Duplicate pair/);assert.match(f.check().join('\n'),/Invalid locale pair/);});
