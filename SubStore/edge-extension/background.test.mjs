import test from 'node:test';
import assert from 'node:assert/strict';
const ID='fixture-extension';
const ORIGIN='http://192.0.2.8:8443';
const CANDIDATE='http://198.51.100.20/sub?token=NEW-PRIVATE-FIXTURE';
const OLD='http://198.51.100.20/sub?token=OLD-PRIVATE-FIXTURE#flowDedup=fixture';
const NODE={name:'香港 01',type:'trojan',server:'hk.example.com',port:443,password:'NODE-PRIVATE-FIXTURE'};
const clone=value=>value===undefined?undefined:structuredClone(value);
const PAGE={id:ID,url:ORIGIN+'/dashboard',origin:ORIGIN,frameId:0,tab:{id:20,url:ORIGIN+'/dashboard'}};
const POPUP={id:ID,url:'chrome-extension://'+ID+'/popup.html'};
const source=(name='星海')=>({name,displayName:name,source:'remote',url:OLD,mergeSources:'localFirst',content:'',process:[{type:'Flag Operator'},{type:'Sort Operator'}],custom:{keep:true}});
function deferred(){let resolve;const promise=new Promise(done=>{resolve=done});return{promise,resolve}}

test('automatic authorized-site matching and local relay',async t=>{
 const originalChrome=globalThis.chrome, originalFetch=globalThis.fetch;
 let listener, state, resetNumber=0, background, tabUpdated, tabRemoved;
 const area=kind=>({async get(keys){const names=typeof keys==='string'?[keys]:keys;return Object.fromEntries(names.filter(key=>Object.hasOwn(state[kind],key)).map(key=>[key,clone(state[kind][key])]))},async set(value){if(kind==='local'&&value.backups&&state.pauseStage==='backup'&&!state.paused){state.paused=true;state.entered.resolve();await state.release.promise}Object.assign(state[kind],clone(value))}});
 const reset=(overrides={})=>{PAGE.documentId='fixture-document-'+(++resetNumber);return state={local:{settings:{enabled:true,backendUrl:'http://127.0.0.1:38324',frontendUrl:'http://127.0.0.1:14122'}},session:{},subs:new Map([['星海',source()]]),calls:[],allowed:true,preview:{original:[NODE],processed:[NODE]},...overrides}};
 reset();
 globalThis.fetch=()=>{throw Error('Native extension fetch is forbidden');};
 globalThis.chrome={runtime:{id:ID,getManifest:()=>({version:'1.3.0'}),getURL:p=>'chrome-extension://'+ID+'/'+p,onMessage:{addListener(fn){listener=fn}},onInstalled:{addListener(){}},onStartup:{addListener(){}}},permissions:{async contains(){if(state.permissionGate&&!state.permissionPaused){state.permissionPaused=true;state.permissionGate.entered.resolve();await state.permissionGate.release.promise;return state.permissionGate.granted}return state.allowed}},storage:{local:area('local'),session:area('session')},action:{async setBadgeText(){},async setBadgeBackgroundColor(){}},tabs:{onUpdated:{addListener(fn){tabUpdated=fn}},onRemoved:{addListener(fn){tabRemoved=fn}},async create(){if(state.createFailures){state.createFailures--;throw Error('PRIVATE-CREATE-FAILURE')}return{id:77}},async sendMessage(_id,m){
  if(m.type==='LOCAL_TRANSPORT_PING'){if(state.pauseStage==='patch_transport'&&!state.paused&&state.calls.at(-1)?.method==='GET'&&state.calls.some(call=>call.method==='POST')){state.paused=true;state.entered.resolve();await state.release.promise}return{ready:true,origin:m.frontendUrl}}
  assert.equal(m.type,'LOCAL_BACKEND_REQUEST');
  const body=m.body===undefined?undefined:JSON.parse(m.body);
  state.calls.push({method:m.method,path:m.path,body});
  if(!state.paused&&((state.pauseStage==='catalog'&&m.path==='/api/subs')||(state.pauseStage==='preview'&&m.method==='POST'))){state.paused=true;state.entered.resolve();await state.release.promise}
  let data;
  if(m.method==='GET'&&m.path==='/api/subs')data=state.catalog===undefined?[...state.subs.values()]:state.catalog;
  else if(m.method==='POST'&&m.path==='/api/preview/sub?target=JSON'){assert.equal(body.name,m.subscriptionName);data=state.preview;}
  else if(m.path==='/api/sub/'+encodeURIComponent(m.subscriptionName)&&state.subs.has(m.subscriptionName)){
    if(m.method==='GET')data=state.subs.get(m.subscriptionName);
    else if(m.method==='PATCH'){assert.deepEqual(Object.keys(body),['url']);state.subs.get(m.subscriptionName).url=body.url;data={};}
    else assert.fail('Unexpected mutation');
  }else assert.fail('Unexpected API route');
  if(state.pauseStage==='patch_response'&&m.method==='PATCH'&&!state.paused){state.paused=true;state.entered.resolve();await state.release.promise}
  return{ok:true,status:200,contentType:'application/json',bodyText:JSON.stringify({status:'success',data})};
 }}};
 const send=(m,s=PAGE)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('callback timeout')),2000);const accepted=listener(m,s,r=>{clearTimeout(timer);resolve({accepted:true,reply:clone(r)})});if(accepted!==true){clearTimeout(timer);resolve({accepted:false})}});
 const observe=()=>send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:CANDIDATE,siteNames:['仪表盘 - 星海机场']});
 try{
  background=await import('./background.js?auto='+Date.now());
  t.afterEach(async()=>{await background.whenIdle()});
  await t.test('opening any authorized HTTP IP panel automatically matches a differently named existing source and writes URL only',async()=>{
    reset();const before=clone(state.subs.get('星海'));await send({type:'PAGE_CONTEXT'});await send({type:'PAGE_OBSERVER_STATUS',stage:'observer_ready'});await observe();
    assert.equal(state.subs.get('星海').url,CANDIDATE+'#flowDedup=fixture');
    assert.deepEqual({...state.subs.get('星海'),url:before.url},before);
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');assert.equal(state.local.sites[ORIGIN].subscriptionName,'星海');
    assert.equal(state.local.sites[ORIGIN].lastResult.extensionVersion,'1.3.0');assert.equal(state.local.backups.length,1);
    assert.equal(state.calls.filter(c=>c.method==='PATCH').length,1);
  });
  await t.test('a transient local tab-creation failure recovers automatically before any write',async()=>{reset();state.createFailures=1;await observe();assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');assert.equal(state.calls.filter(c=>c.method==='PATCH').length,1);});
  await t.test('permissions, own frontend/backend, invalid sources and subframes cannot read catalog or mutate',async()=>{
    for(const sender of [{...PAGE,id:'other'},{...PAGE,frameId:1},{...PAGE,tab:{id:20,url:'http://other.example.com'}},{...PAGE,url:'file:///tmp/a'},{...PAGE,tab:{id:'20'}}]){reset();await send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:CANDIDATE},sender);assert.equal(state.calls.length,0);}
    reset();state.allowed=false;assert.equal((await send({type:'PAGE_CONTEXT'})).reply.allowed,false);await observe();assert.equal(state.calls.length,0);
    for(const origin of ['http://127.0.0.1:38324','http://127.0.0.1:14122']){reset();const sender={...PAGE,url:origin+'/',origin,tab:{id:20,url:origin+'/'}};assert.equal((await send({type:'PAGE_CONTEXT'},sender)).reply.allowed,false);assert.equal(state.session.pageObservations,undefined);}
  });
  await t.test('no catalog match and ambiguous accounts stop before preview/PATCH',async()=>{
    reset();state.subs=new Map([['无关',{...source('无关'),url:'https://other.example.com/sub?token=x'}]]);await observe();assert.equal(state.local.sites[ORIGIN].lastResult.code,'auto_match_none');assert.deepEqual(state.calls.map(c=>c.path),['/api/subs']);
    reset();state.subs.set('另一账号',source('另一账号'));await send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:CANDIDATE,siteNames:[]});assert.equal(state.local.sites[ORIGIN].lastResult.code,'auto_match_ambiguous');assert.equal(state.calls.length,1);
  });
  await t.test('shared URL copies are resolved only by a unique exact brand name',async()=>{
    reset();state.subs.set('星海-copy5806',source('星海-copy5806'));await observe();assert.equal(state.local.sites[ORIGIN].subscriptionName,'星海');assert.equal(state.subs.get('星海-copy5806').url,OLD);
  });
  await t.test('sentinel nodes and malformed catalog never write',async()=>{
    reset();state.preview={original:[{...NODE,server:'127.0.0.1',port:65535}],processed:[NODE]};await observe();assert.equal(state.local.sites[ORIGIN].lastResult.code,'candidate_has_no_real_nodes');assert.equal(state.calls.filter(c=>c.method==='PATCH').length,0);
    reset();state.catalog={token:'PRIVATE-CATALOG-ERROR'};await observe();assert.equal(state.local.sites[ORIGIN].lastResult.code,'catalog_unavailable');
  });
  await t.test('duplicates serialize and update once, while another arbitrary domain is independent',async()=>{
    reset();await Promise.all([observe(),observe(),observe()]);assert.equal(state.calls.filter(c=>c.method==='PATCH').length,1);
    const other='https://never-hardcoded.example.com';await send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:CANDIDATE,siteNames:['星海']},{...PAGE,url:other+'/',origin:other,tab:{id:21,url:other+'/'}});assert.equal(state.local.sites[other].lastResult.status,'unchanged');
  });
  await t.test('page ambiguity clears only that origin and status returns metadata without private URLs',async()=>{
    reset();await observe();const other='http://192.0.2.9';state.session.pendingByOrigin[other]={candidateUrl:CANDIDATE,at:Date.now()};await send({type:'OBSERVATION_AMBIGUOUS'});assert.equal(state.session.pendingByOrigin[ORIGIN],undefined);assert.ok(state.session.pendingByOrigin[other]);
    const result=(await send({type:'GET_STATUS'},POPUP)).reply;const serialized=JSON.stringify(result);for(const secret of ['NEW-PRIVATE-FIXTURE','OLD-PRIVATE-FIXTURE','NODE-PRIVATE-FIXTURE','candidateUrl','previousURL'])assert.ok(!serialized.includes(secret));assert.equal(result.sites[ORIGIN].lastResult.code,'candidate_ambiguous');
  });
  await t.test('later ambiguity supersedes catalog, preview and backup in flight before any PATCH',async()=>{
    for(const pauseStage of ['catalog','preview','backup','patch_transport']){
      const entered=deferred(),release=deferred();reset({pauseStage,entered,release});
      const initial=observe();await entered.promise;
      const ambiguous=send({type:'OBSERVATION_AMBIGUOUS',siteNames:['星海']});release.resolve();
      await Promise.all([initial,ambiguous]);
      assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0,pauseStage+' must stop the old candidate');
      assert.equal(state.subs.get('星海').url,OLD);
      assert.equal(state.local.sites[ORIGIN].lastResult.code,'candidate_ambiguous');
      assert.equal(state.session.pendingByOrigin?.[ORIGIN],undefined);
      assert.equal((state.local.backups||[]).length,0,'an obsolete candidate must not leave an unapplied backup');
      assert.equal((await send({type:'SYNC_PENDING',origin:ORIGIN},POPUP)).reply.code,'open_dashboard_first');
    }
  });
  await t.test('a different candidate supersedes the paused candidate while identical duplicates keep one operation',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;
    const next=CANDIDATE.replace('NEW-','NEWER-');
    const replacement=send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:next,siteNames:['星海']});
    const duplicate=send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:next,siteNames:['星海']});
    release.resolve();await Promise.all([initial,replacement,duplicate]);
    const patches=state.calls.filter(call=>call.method==='PATCH');assert.equal(patches.length,1);
    assert.equal(patches[0].body.url,next+'#flowDedup=fixture');
    assert.equal(state.session.pendingByOrigin[ORIGIN].candidateUrl,next);
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
    assert.equal(state.local.backups.length,1);
  });
  await t.test('identical observations during a held preview do not cancel or repeat that preview',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;const duplicate=observe();release.resolve();await Promise.all([initial,duplicate]);
    assert.equal(state.calls.filter(call=>call.method==='POST').length,1);
    assert.equal(state.calls.filter(call=>call.path==='/api/subs').length,1);
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.ok(Number.isInteger(state.session.pendingByOrigin[ORIGIN].generation));
    assert.equal(state.session.pendingByOrigin[ORIGIN].documentKey,PAGE.tab.id+':'+PAGE.documentId);
  });
  await t.test('a pending permission check blocks the old write and only granted ambiguity supersedes it',async()=>{
    for(const granted of [true,false]){
      const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
      const initial=observe();await entered.promise;
      const permissionGate={entered:deferred(),release:deferred(),granted};state.permissionGate=permissionGate;
      const ambiguous=send({type:'OBSERVATION_AMBIGUOUS'});await permissionGate.entered.promise;
      release.resolve();await new Promise(resolve=>setImmediate(resolve));
      assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0,'no PATCH may race a permission decision');
      permissionGate.release.resolve();await Promise.all([initial,ambiguous]);await background.whenIdle();
      assert.equal(state.calls.filter(call=>call.method==='PATCH').length,granted?0:1);
      assert.equal(state.local.sites[ORIGIN].lastResult[granted?'code':'status'],granted?'candidate_ambiguous':'updated');
    }
  });
  await t.test('another origin and rejected senders cannot cancel an unrelated paused candidate',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;
    const other='https://other-fixture.example.com';
    const otherMessage=send({type:'OBSERVATION_AMBIGUOUS'},{...PAGE,url:other+'/',origin:other,tab:{id:21,url:other+'/'}});
    const attempts=[{...PAGE,id:'other-extension'},{...PAGE,frameId:1},{...PAGE,documentLifecycle:'cached'},{...PAGE,documentId:{}},{...PAGE,tab:{id:20,url:other+'/'}}];
    for(const sender of attempts)assert.equal((await send({type:'OBSERVATION_AMBIGUOUS'},sender)).accepted,false);
    await send({type:'PAGE_OBSERVER_STATUS',stage:'candidate_ambiguous'});
    await send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:'not-a-url'});
    release.resolve();await Promise.all([initial,otherMessage]);
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
    assert.equal(state.local.sites[other].lastResult.code,'candidate_ambiguous');
  });
  await t.test('a new same-origin document retires the old one and cannot revive its pending candidate',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const oldSender=clone(PAGE),initial=observe();await entered.promise;
    const nextSender={...clone(PAGE),documentId:PAGE.documentId+'-next',url:ORIGIN+'/next',tab:{id:20,url:ORIGIN+'/next'}};
    const changed=send({type:'PAGE_CONTEXT',siteNames:['星海']},nextSender);release.resolve();await Promise.all([initial,changed]);
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    assert.equal(state.session.pendingByOrigin?.[ORIGIN],undefined);
    assert.equal(state.local.sites?.[ORIGIN]?.lastResult,undefined,'old cancellation must not record stale success or error');
    assert.equal((await send({type:'SYNC_PENDING',origin:ORIGIN},POPUP)).reply.code,'open_dashboard_first');
    const before=state.calls.length;await send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:CANDIDATE,siteNames:['星海']},oldSender);
    assert.equal(state.calls.length,before,'retired document cannot become current again');
    assert.equal((await send({type:'PAGE_CONTEXT'},oldSender)).reply.allowed,false);
    await send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:CANDIDATE,siteNames:['星海']},nextSender);
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
  });
  await t.test('closing a retired same-origin tab cannot cancel the newer document in another tab',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const oldSender=clone(PAGE),initial=observe();await entered.promise;
    const nextSender={...clone(PAGE),documentId:PAGE.documentId+'-tab-two',tab:{id:22,url:PAGE.url}};
    const changed=send({type:'PAGE_CONTEXT'},nextSender);release.resolve();await Promise.all([initial,changed]);await background.whenIdle();
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    state.paused=false;state.entered=deferred();state.release=deferred();
    const next=send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:CANDIDATE,siteNames:['星海']},nextSender);await state.entered.promise;
    tabRemoved(oldSender.tab.id);state.release.resolve();await next;await background.whenIdle();
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
    assert.equal(state.session.pendingByOrigin[ORIGIN].candidateUrl,CANDIDATE);
  });
  await t.test('a newer valid candidate after ambiguity wins without an obsolete ambiguity clearing it',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;
    const ambiguous=send({type:'OBSERVATION_AMBIGUOUS'}),next=CANDIDATE.replace('NEW-','LATEST-');
    const replacement=send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:next,siteNames:['星海']});
    release.resolve();await Promise.all([initial,ambiguous,replacement]);
    const patches=state.calls.filter(call=>call.method==='PATCH');assert.equal(patches.length,1);
    assert.equal(patches[0].body.url,next+'#flowDedup=fixture');
    assert.equal(state.session.pendingByOrigin[ORIGIN].candidateUrl,next);
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
    assert.equal(state.session.pageObservations[ORIGIN].observation.stage,'candidate_received');
  });
  await t.test('the same URL recovers after in-flight ambiguity instead of deduplicating unfinished older work',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;
    const ambiguous=send({type:'OBSERVATION_AMBIGUOUS'}),replacement=observe();
    release.resolve();await Promise.all([initial,ambiguous,replacement]);
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.equal(state.subs.get('星海').url,CANDIDATE+'#flowDedup=fixture');
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
    assert.ok(state.session.pendingByOrigin[ORIGIN].finishedAt);
  });
  await t.test('an unfinished same-generation pending entry does not swallow a new valid observation',async()=>{
    reset();await observe();state.subs.get('星海').url=OLD;state.calls=[];
    delete state.session.pendingByOrigin[ORIGIN].finishedAt;
    await observe();
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
    assert.ok(state.session.pendingByOrigin[ORIGIN].finishedAt);
  });
  await t.test('completed errors from an older generation cannot suppress same-URL recovery after ambiguity',async()=>{
    reset();state.preview={original:[],processed:[]};await observe();
    assert.equal(state.local.sites[ORIGIN].lastResult.code,'candidate_has_no_real_nodes');
    assert.ok(state.session.pendingByOrigin[ORIGIN].finishedAt);
    state.preview={original:[NODE],processed:[NODE]};state.calls=[];
    await Promise.all([send({type:'OBSERVATION_AMBIGUOUS'}),observe()]);
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
  });
  await t.test('a completed record from another document never deduplicates the current document',async()=>{
    reset();await observe();state.subs.get('星海').url=OLD;state.calls=[];
    state.session.pendingByOrigin[ORIGIN].documentKey+='-old-document';
    await observe();
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.equal(state.session.pendingByOrigin[ORIGIN].documentKey,PAGE.tab.id+':'+PAGE.documentId);
  });
  await t.test('late loading notification cannot retire the already admitted current document',async()=>{
    reset();await send({type:'PAGE_CONTEXT'});tabUpdated?.(PAGE.tab.id,{status:'loading'});await observe();
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
  });
  await t.test('an authorized cross-origin navigation in the same tab waits for permission before retiring its old document',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;
    const permissionGate={entered:deferred(),release:deferred(),granted:true};state.permissionGate=permissionGate;
    const other='https://next-fixture.example.com';
    const changed=send({type:'PAGE_CONTEXT'},{...PAGE,documentId:PAGE.documentId+'-next',url:other+'/',origin:other,tab:{id:20,url:other+'/'}});
    await permissionGate.entered.promise;release.resolve();await new Promise(resolve=>setImmediate(resolve));
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    permissionGate.release.resolve();await Promise.all([initial,changed]);await background.whenIdle();
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    assert.equal(state.session.pendingByOrigin?.[ORIGIN],undefined);
    assert.equal(state.session.pageObservations[other].observation.stage,'bridge_ready');
  });
  await t.test('tab removal invalidates in-flight work and clears only the retired pending candidate',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;tabRemoved(PAGE.tab.id);
    release.resolve();await initial;await background.whenIdle();
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    assert.equal(state.local.sites?.[ORIGIN]?.lastResult,undefined);
    assert.equal(state.session.pendingByOrigin?.[ORIGIN],undefined);
    assert.equal((await send({type:'SYNC_PENDING',origin:ORIGIN},POPUP)).reply.code,'open_dashboard_first');
  });
  await t.test('manual retry is superseded by later ambiguity without reviving the cleared candidate',async()=>{
    reset();await observe();state.subs.get('星海').url=OLD;state.calls=[];
    state.pauseStage='preview';state.entered=deferred();state.release=deferred();
    const retry=send({type:'SYNC_PENDING',origin:ORIGIN},POPUP);await state.entered.promise;
    const ambiguous=send({type:'OBSERVATION_AMBIGUOUS'});state.release.resolve();await Promise.all([retry,ambiguous]);
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    assert.equal(state.session.pendingByOrigin?.[ORIGIN],undefined);
    assert.equal(state.local.sites[ORIGIN].lastResult.code,'candidate_ambiguous');
  });
  await t.test('an already dispatched PATCH is never resent and keeps its conditional backup when later superseded',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'patch_response',entered,release});
    const initial=observe();await entered.promise;
    const ambiguous=send({type:'OBSERVATION_AMBIGUOUS'});release.resolve();await Promise.all([initial,ambiguous]);
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.equal(state.subs.get('星海').url,CANDIDATE+'#flowDedup=fixture');
    assert.equal(state.local.backups.length,1,'a dispatched write must keep its conditional restore evidence');
    assert.equal(state.session.pendingByOrigin?.[ORIGIN],undefined);
    assert.equal(state.local.sites[ORIGIN].lastResult.code,'candidate_ambiguous');
  });
  await t.test('whenIdle waits for received admissions and the original queued operation to finish',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;let idle=false;
    const barrier=background.whenIdle().then(()=>{idle=true});
    const ambiguous=send({type:'OBSERVATION_AMBIGUOUS'});
    await new Promise(resolve=>setImmediate(resolve));assert.equal(idle,false);
    release.resolve();await Promise.all([initial,ambiguous,barrier]);
    assert.equal(idle,true);assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    assert.equal(state.local.sites[ORIGIN].lastResult.code,'candidate_ambiguous');
  });
  await t.test('only exact popup can save global settings, retry and conditionally restore its matched source',async()=>{
    reset();await observe();assert.equal((await send({type:'GET_STATUS'})).accepted,false);
    assert.equal((await send({type:'SAVE_SETTINGS',settings:{enabled:false}}, {...POPUP,url:POPUP.url+'?fake'})).accepted,false);
    const restore=(await send({type:'RESTORE_LATEST',origin:ORIGIN},POPUP)).reply;assert.equal(restore.status,'restored');assert.equal(state.subs.get('星海').url,OLD);assert.equal(state.local.backups.length,0);
    const save=(await send({type:'SAVE_SETTINGS',settings:{enabled:false,backendUrl:'http://127.0.0.1:38324',frontendUrl:'http://127.0.0.1:14122',subscriptionName:'attacker'}},POPUP)).reply;assert.deepEqual(Object.keys(save.settings).sort(),['backendUrl','enabled','frontendUrl']);
    state.calls=[];await observe();assert.equal(state.calls.length,0);
  });
 }finally{if(originalChrome===undefined)delete globalThis.chrome;else globalThis.chrome=originalChrome;globalThis.fetch=originalFetch;}
});
