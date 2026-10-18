import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {buildEntries} from './build.mjs';
const root=new URL('.',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('./manifest.json',import.meta.url),'utf8'));

test('both worlds cover authorized HTTP(S) domains/IPs with disjoint generated script URLs',()=>{
 const worlds=manifest.content_scripts.filter(s=>s.js.some(file=>file.includes('.bundle.')));
 assert.equal(worlds.length,2);assert.deepEqual(worlds.map(s=>s.world).sort(),['ISOLATED','MAIN']);
 for(const entry of worlds){assert.deepEqual(entry.matches,['http://*/*','https://*/*']);assert.equal(entry.run_at,'document_start');assert.equal(entry.all_frames,false);}
 assert.deepEqual(worlds[0].js.filter(file=>worlds[1].js.includes(file)),[],'Edge deduplicates reused file URLs across worlds');
 buildEntries(undefined,{check:true});
 for(const file of [manifest.background.service_worker,manifest.action.default_popup,...manifest.content_scripts.flatMap(s=>s.js)])assert.ok(fs.existsSync(new URL(file,root)),file);
 assert.deepEqual(manifest.permissions,['storage','activeTab']);assert.deepEqual(manifest.host_permissions,['http://*/*','https://*/*']);
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
