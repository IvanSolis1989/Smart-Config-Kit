import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {buildEntries} from './build.mjs';
const root=new URL('.',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('./manifest.json',import.meta.url),'utf8'));

test('dual-target release advertises both destinations without adding static cloud access',()=>{
 assert.equal(manifest.version,'1.5.1');
 assert.match(manifest.description,/本机/);
 assert.match(manifest.description,/Cloudflare/);
 assert.deepEqual(manifest.host_permissions,['http://127.0.0.1/*']);
 assert.equal(manifest.key,undefined);
 assert.equal(manifest.update_url,undefined);
});

test('fresh installation cannot inject or obtain external site access without an optional grant',()=>{
 assert.deepEqual(manifest.content_scripts,[{
   matches:['http://127.0.0.1/*'],js:['local-transport.js'],run_at:'document_start',all_frames:false,world:'ISOLATED',
 }]);
 buildEntries(undefined,{check:true});
 for(const file of [manifest.background.service_worker,manifest.action.default_popup,'site-access.mjs','page-main.bundle.js','page-bridge.bundle.js',...manifest.content_scripts.flatMap(s=>s.js)])assert.ok(fs.existsSync(new URL(file,root)),file);
 assert.deepEqual(manifest.permissions,['storage','activeTab','scripting']);assert.deepEqual(manifest.host_permissions,['http://127.0.0.1/*']);
 assert.deepEqual(manifest.optional_host_permissions,['http://*/*','https://*/*']);
 assert.equal(manifest.externally_connectable,undefined);assert.equal(manifest.web_accessible_resources,undefined);
});
test('a single helper source feeds both entries and stale generated artifacts fail the build check',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'scki-entry-test-'));
 try{
  for(const name of ['extractors.js','bridge.js','page-hook.js'])fs.copyFileSync(new URL(name,root),path.join(temporary,name));
  buildEntries(temporary);buildEntries(temporary,{check:true});
  fs.appendFileSync(path.join(temporary,'extractors.js'),'\n// fixture source change\n');
  assert.throws(()=>buildEntries(temporary,{check:true}),/Stale browser entry/);
  buildEntries(temporary);buildEntries(temporary,{check:true});
  for(const file of ['page-main.bundle.js','page-bridge.bundle.js'])assert.ok(fs.readFileSync(path.join(temporary,file),'utf8').includes('fixture source change'));
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
