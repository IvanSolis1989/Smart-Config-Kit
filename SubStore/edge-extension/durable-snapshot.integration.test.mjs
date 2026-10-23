// Synthetic cross-module contract tests; no real Sub-Store engine or cloud I/O.
import test from 'node:test';
import assert from 'node:assert/strict';
import { settingsFrom, sha256 } from './core.mjs';
import { createCloudFetcher } from './cloud-fetch.mjs';
import { snapshotPolicy, syncDurableSnapshot } from './durable-snapshot.mjs';
import { routeLocalSnapshotRequest, executeLocalSnapshotOperation } from '../scripts/local-snapshot.mjs';

const name='都是梦',policy=snapshotPolicy('https://therun.6128888.xyz',name);
const prefix='/ext-'+'a'.repeat(64),base='https://cloud.example.invalid'+prefix;
const nodes=Array.from({length:18},(_,i)=>({name:'Synthetic '+i,type:'ss',server:'node.example.invalid',port:443,password:'synthetic-only'}));
const fresh=()=>nodes.map(n=>({...n,password:'synthetic-new'}));
function fixture(){
 let sub={name,source:'local',url:'',content:JSON.stringify({proxies:nodes}),process:[{type:'Fixture Rename',args:'CLOUD-'}],custom:{keep:true}};
 const state={reads:0,writes:0,markers:0,backups:[],requests:[],previews:[],permission:true,
  collection:{name:'Synthetic Collection',subscriptions:[name]},replica:'previous published fixture'};
 const env={SUB_STORE_EXTENSION_BACKEND_PATH:prefix,SUB_STORE_LOCAL_SNAPSHOT_POLICIES:JSON.stringify([{name,minNodes:18}])};
 const adapters={
  readSubscription:async()=>{state.reads++;return structuredClone(sub)},
  previewSubscription:async candidate=>{
   state.previews.push(structuredClone(candidate));
   const original=JSON.parse(candidate.content).proxies;
   return {original,processed:state.failProcessing?[]:original.map(n=>({...n,name:candidate.process[0].args+n.name}))};
  },
  writeContent:async content=>{state.writes++;sub={...sub,content};if(state.corruptReadback)sub.custom.keep=false},
 };
 const settings={...settingsFrom(),targetId:'cloud',backendUrl:base,subscriptionName:name};
 const fetcher=createCloudFetcher({permissions:{contains:async()=>state.permission}},settings,{
  onWriteSent:()=>{state.markers++},fetcher:async(input,req)=>{
   const request=new Request(input,req);state.requests.push({method:req.method,path:new URL(input).pathname});
   if(new URL(input).pathname===prefix+'/api/sub/'+encodeURIComponent(name)){
    assert.equal(req.method,'GET');state.reads++;
    const data=structuredClone(sub);
    if(state.clientMismatch&&state.writes)data.content='synthetic stale readback';
    return Response.json({status:'success',data});
   }
   const routed=await routeLocalSnapshotRequest(request,env,async(selected,body,signal)=>{
    const result=await executeLocalSnapshotOperation(env,selected,body,adapters,signal);
    if(body&&!body.dryRun&&state.loseResponse)throw Error('synthetic lost response');
    return result;
   });
   assert.ok(routed,'unexpected API path');return routed.response;
  },
 });
 return {state,settings,fetcher,get:()=>structuredClone(sub),edit:()=>{sub.process.push({type:'Manual Edit'})},
  run:options=>syncDurableSnapshot({settings,policy,capture:async()=>fresh(),fetcher,
   saveBackup:async backup=>{state.backups.push(backup)},...options})};
}
test('cloud client, transport, restricted route and operation agree on commit/readback/restore',async()=>{
 const f=fixture(),before=f.get(),collection=structuredClone(f.state.collection);
 const updated=await f.run();assert.equal(updated.status,'updated');assert.equal(updated.processedNodes,18);
 assert.equal(updated.revision,await sha256(f.get()));assert.equal(f.state.writes,1);assert.equal(f.state.markers,1);
 assert.deepEqual(f.get(),{...before,content:JSON.stringify({proxies:fresh()})});
 assert.ok(f.state.previews.every(p=>p.source==='local'&&p.url===''&&p.process[0].args==='CLOUD-'&&p.noCache===true&&p.ignoreFailedRemoteSub===false));
 assert.deepEqual(f.state.collection,collection);assert.equal(f.state.replica,'previous published fixture');
 assert.equal(f.state.requests.at(-1).method,'GET','success needs independent client readback');
 const backup=f.state.backups[0];assert.equal(backup.targetId,'cloud');
 const restored=await f.run({restoreContent:backup.previousContent,expectedBackup:backup,capture:()=>assert.fail('restore must not recapture')});
 assert.equal(restored.status,'restored');assert.deepEqual(f.get(),before);
});
test('cloud dry run uses real policy validation but neither write marker nor backup nor commit',async()=>{
 const f=fixture(),before=f.get();const result=await f.run({dryRun:true});
 assert.equal(result.status,'dry_run');assert.equal(result.processedNodes,18);
 assert.deepEqual(f.get(),before);assert.equal(f.state.writes,0);assert.equal(f.state.markers,0);assert.equal(f.state.backups.length,0);
});
test('cloud processor failure, revoked permission and backup-window edits fail without committing',async()=>{
 for(const fault of ['processor','permission','edit']){
  const f=fixture(),before=f.get();
  if(fault==='processor')f.state.failProcessing=true;
  if(fault==='permission')f.state.permission=false;
  await assert.rejects(f.run(fault==='edit'?{saveBackup:async()=>f.edit()}:{}),fault==='edit'?{code:'concurrent_change'}:undefined);
  assert.equal(f.state.writes,0);assert.equal(f.state.markers,0);assert.equal(f.get().content,before.content);
 }
});
test('lost server response or corrupt independent readback never becomes success or an implicit retry',async()=>{
 for(const fault of ['loseResponse','corruptReadback','clientMismatch']){
  const f=fixture();f.state[fault]=true;
  await assert.rejects(f.run(),{code:fault==='clientMismatch'?'writeback_verification_failed':'backend_http_error'});
  assert.equal(f.state.writes,1);assert.equal(f.state.markers,1);assert.equal(f.state.backups.length,1);
  assert.equal(f.state.requests.filter(r=>r.method==='POST').length,1);
 }
});
