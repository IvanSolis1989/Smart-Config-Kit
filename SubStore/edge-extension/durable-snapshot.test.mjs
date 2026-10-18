import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotPolicy, chooseSnapshotSubscription, captureSnapshot, syncDurableSnapshot, verifyDurableSnapshot } from './durable-snapshot.mjs';
import { settingsFrom } from './core.mjs';
const origin = 'https://therun.6128888.xyz', name = '都是梦';
const nodes = Array.from({ length: 18 }, (_, i) => ({name:'Node '+i,type:'ss',server:'node.example',port:443,password:'SECRET'}));
const sub = () => ({name,source:'local',url:'',content:JSON.stringify({proxies:nodes.map(n=>({...n,password:'OLD'}))}),process:[{type:'Sort Operator'}],custom:{keep:true}});
const settings = {...settingsFrom(),subscriptionName:name};
const reply = data => new Response(JSON.stringify({status:'success',data}));
test('snapshot matching is restricted to exact site, brand and local-only empty-URL subscription', () => {
 const catalog=[sub()];assert.equal(chooseSnapshotSubscription({origin,siteNames:[name],catalog}).status,'matched');
 for(const input of [{origin:'https://other.example'},{siteNames:['Other']},{catalog:[{...sub(),source:'remote'}]},{catalog:[{...sub(),url:'https://old.example'}]}])assert.equal(chooseSnapshotSubscription({origin,siteNames:[name],catalog,...input}).status,'none');
 assert.equal(chooseSnapshotSubscription({origin,siteNames:[name],catalog:[sub(),sub()]}).status,'ambiguous');
});
test('one strict remote capture is shared and content transaction preserves all other configuration', async () => {
 const policy=snapshotPolicy(origin,name), calls=[];let current=sub(),backup;
 const fetcher=async(url,req)=>{const body=req.body?JSON.parse(req.body):undefined;calls.push({url,...req,body});
  if(req.method==='POST')return reply({original:nodes,processed:nodes});
  if(req.method==='PATCH'){assert.deepEqual(Object.keys(body),['content']);current.content=body.content;return reply({});}
  return reply(current);
 };
 const original=await captureSnapshot({settings,candidateUrl:'https://burn.example/once',fetcher,policy});
 const before=sub();
 const result=await syncDurableSnapshot({settings,policy,capture:async()=>original,fetcher,saveBackup:async b=>{backup=b}});
 assert.equal(result.status,'updated');assert.equal(result.mode,'local_snapshot');assert.equal(result.originalNodes,18);
 assert.equal(backup.previousContent,before.content);assert.equal(backup.kind,'content');
 assert.deepEqual({...current,content:before.content},before);
 const remote=calls.filter(c=>c.method==='POST'&&c.body.source==='remote');assert.equal(remote.length,1);
 assert.equal(remote[0].body.noCache,true);assert.equal(remote[0].body.noFlow,true);assert.deepEqual(remote[0].body.process,[]);
 assert.equal(calls.filter(c=>c.method==='POST'&&c.body.source==='local').length,1);
});
test('low count, warning, empty processed or concurrent edit retains the old content', async () => {
 for(const mode of ['small','warning','empty','concurrent']){
  let current=sub(),reads=0,writes=0;const old=current.content;
  const fetcher=async(url,req)=>{if(req.method==='POST')return reply({original:nodes,processed:mode==='empty'?[]:nodes});if(req.method==='PATCH'){writes++;return reply({})}reads++;if(mode==='concurrent'&&reads===2)current.custom.keep=false;return reply(current)};
  const original=mode==='small'?nodes.slice(1):mode==='warning'?[...nodes,{...nodes[0],name:'设备超过上限'}]:nodes;
  await assert.rejects(syncDurableSnapshot({settings,policy:snapshotPolicy(origin,name),capture:async()=>original,fetcher}));
  assert.equal(writes,0);assert.equal(current.content,old);
 }
});
test('dry run preserves content and backups, while replay verification requires the complete unchanged revision', async () => {
 const current=sub();let writes=0,backups=0;
 const fetcher=async(url,req)=>{if(req.method==='POST')return reply({original:nodes,processed:nodes});if(req.method==='PATCH')writes++;return reply(current)};
 const policy=snapshotPolicy(origin,name);
 const result=await syncDurableSnapshot({settings,policy,capture:async()=>nodes,fetcher,dryRun:true,saveBackup:()=>backups++});
 assert.equal(result.status,'dry_run');assert.equal(writes,0);assert.equal(backups,0);
 const {sha256}=await import('./core.mjs');const revision=await sha256(current);
 assert.equal((await verifyDurableSnapshot({settings,policy,fetcher,expectedRevision:revision})).status,'unchanged');
 current.process.push({type:'Changed Operator'});
 await assert.rejects(verifyDurableSnapshot({settings,policy,fetcher,expectedRevision:revision}),{code:'snapshot_capture_retry_blocked'});
 await assert.rejects(captureSnapshot({settings,policy:{...policy,minNodes:1},candidateUrl:'https://burn.example/once',fetcher}),{code:'unsupported_subscription'});
});
test('cloud dry run and replay verification use only the restricted route, never general local preview or persistent writes', async () => {
 const {sha256}=await import('./core.mjs');const current=sub(),revision=await sha256(current),calls=[];
 const cloud={...settings,targetId:'cloud',backendUrl:'https://cloud.example/private'};
 const policy=snapshotPolicy(origin,name);
 const fetcher=async(url,req)=>{
  const body=req.body&&JSON.parse(req.body);calls.push({url,method:req.method,body});
  assert.ok(!url.includes('/api/preview/'),'generic cloud local preview is forbidden');
  if(url.includes('/api/local-snapshot/'))return reply(req.method==='POST'?{status:'dry_run',name,revision,originalNodes:18,processedNodes:18}:{allowed:true,name,minNodes:18,revision,originalNodes:18,processedNodes:18});
  assert.equal(req.method,'GET');return reply(current);
 };
 const result=await syncDurableSnapshot({settings:cloud,policy,capture:async()=>nodes,fetcher,dryRun:true,saveBackup:()=>assert.fail('dry run cannot back up or persist')});
 assert.equal(result.status,'dry_run');assert.deepEqual(calls.find(c=>c.method==='POST').body,{expectedRevision:revision,original:nodes,dryRun:true});
 assert.equal((await verifyDurableSnapshot({settings:cloud,policy,expectedRevision:revision,fetcher})).status,'unchanged');
 assert.equal(calls.filter(c=>c.method==='POST').length,1);
});
