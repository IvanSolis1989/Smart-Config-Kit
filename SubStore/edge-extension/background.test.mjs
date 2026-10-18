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
 let listener, state, resetNumber=0, background, tabUpdated, tabRemoved, permissionRemoved, installed, startup;
 const trustedFixtureOrigins=[ORIGIN,'https://never-hardcoded.example.com','https://other-fixture.example.com','https://next-fixture.example.com','http://192.0.2.9'];
 const area=kind=>({async get(keys){const names=typeof keys==='string'?[keys]:keys;return Object.fromEntries(names.filter(key=>Object.hasOwn(state[kind],key)).map(key=>[key,clone(state[kind][key])]))},async set(value){if(kind==='local'&&value.backups&&state.pauseStage==='backup'&&!state.paused){state.paused=true;state.entered.resolve();await state.release.promise}Object.assign(state[kind],clone(value))}});
 function documentFor(sender,nonce){
  const key=sender.tab.id+':'+(sender.documentId||sender.url);
  let document=state.documents.get(key);
  if(!document){document={id:sender.tab.id,url:sender.url,documentId:sender.documentId,documentNonce:nonce||'nonce:'+key,order:++state.documentOrder,present:true};state.documents.set(key,document)}
  return document;
 }
 function activate(sender,nonce){
  const document=documentFor(sender,nonce);
  if(nonce!==undefined)document.documentNonce=nonce;
  document.present=true;state.liveTabs.set(sender.tab.id,document);return document;
 }
 const reset=(overrides={})=>{
  PAGE.documentId='fixture-document-'+(++resetNumber);
  state={local:{settings:{enabled:true,backendUrl:'http://127.0.0.1:38324',frontendUrl:'http://127.0.0.1:14122'},trustedOrigins:{version:1,origins:[...trustedFixtureOrigins]}},session:{},subs:new Map([['星海',source()]]),calls:[],allowed:true,preview:{original:[NODE],processed:[NODE]},documents:new Map(),liveTabs:new Map(),documentOrder:0,activeTabId:20,scripts:new Map(),reloads:[],removedTabs:[],...overrides};
  activate(PAGE);return state;
 };
 reset();
 globalThis.fetch=()=>{throw Error('Native extension fetch is forbidden');};
 globalThis.chrome={runtime:{id:ID,getManifest:()=>({version:'1.3.0'}),getURL:p=>'chrome-extension://'+ID+'/'+p,onMessage:{addListener(fn){listener=fn}},onInstalled:{addListener(fn){installed=fn}},onStartup:{addListener(fn){startup=fn}}},permissions:{onRemoved:{addListener(fn){permissionRemoved=fn}},async contains(){if(state.permissionGate&&!state.permissionPaused){state.permissionPaused=true;state.permissionGate.entered.resolve();await state.permissionGate.release.promise;return state.permissionGate.granted}return state.allowed}},storage:{local:area('local'),session:area('session')},action:{async setBadgeText(){},async setBadgeBackgroundColor(){}},scripting:{
  async getRegisteredContentScripts({ids}={}){return[...state.scripts.values()].filter(script=>!ids||ids.includes(script.id)).map(clone)},
  async unregisterContentScripts({ids}){for(const id of ids)state.scripts.delete(id)},
  async registerContentScripts(scripts){for(const script of scripts)state.scripts.set(script.id,clone(script))},
 },tabs:{onUpdated:{addListener(fn){tabUpdated=fn}},onRemoved:{addListener(fn){tabRemoved=fn}},
  async get(id){const tab=state.liveTabs.get(id);if(!tab)throw Error('No live tab');return clone(state.detachedDocument&&id===PAGE.tab.id?{...tab,url:'https://unobserved.example/'}:tab)},
  async query(query){assert.deepEqual(query,{active:true,currentWindow:true});if(state.queryHook)return state.queryHook();const tab=state.liveTabs.get(state.activeTabId);return tab?[clone(tab)]:[]},
  async reload(id){state.reloads.push(id)},
  async remove(id){state.removedTabs.push(id);state.liveTabs.delete(id)},
  async create(options){if(state.createFailures){state.createFailures--;throw Error('PRIVATE-CREATE-FAILURE')}const id=++state.documentOrder+100;state.liveTabs.set(id,{id,url:options.url});return{id}},
  async sendMessage(id,m,options){
  if(m.type==='VERIFY_DOCUMENT'){assert.deepEqual(options,{frameId:0});const tab=state.liveTabs.get(id);return{present:!!tab?.present&&!state.detachedDocument,origin:tab?new URL(tab.url).origin:null,documentNonce:tab?.documentNonce}}
  if(m.type==='LOCAL_TRANSPORT_PING'){if(state.pauseStage==='patch_transport'&&!state.paused&&state.calls.at(-1)?.method==='GET'&&state.calls.some(call=>call.method==='POST')){state.paused=true;state.entered.resolve();await state.release.promise}return{ready:true,origin:m.frontendUrl}}
  assert.equal(m.type,'LOCAL_BACKEND_REQUEST');
  const body=m.body===undefined?undefined:JSON.parse(m.body);
  state.calls.push({method:m.method,path:m.path,body});
  if(!state.paused&&((state.pauseStage==='catalog'&&m.path==='/api/subs')||(state.pauseStage==='preview'&&m.method==='POST')||(state.pauseStage==='restore_read'&&m.method==='GET'&&m.path!=='/api/subs'))){state.paused=true;state.entered.resolve();await state.release.promise}
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
 const send=(m,s=PAGE)=>{
  m=clone(m);s=clone(s);
  const actualPage=s?.id===ID&&s.frameId===0&&Number.isInteger(s.tab?.id)&&typeof s.url==='string'&&
   (s.documentId===undefined||typeof s.documentId==='string')&&(s.documentLifecycle===undefined||s.documentLifecycle==='active')&&
   (()=>{try{return['http:','https:'].includes(new URL(s.url).protocol)&&(!s.origin||new URL(s.url).origin===s.origin)&&(!s.tab.url||new URL(s.url).origin===new URL(s.tab.url).origin)}catch{return false}})();
  if(actualPage){
   const document=documentFor(s,m.documentNonce),current=state.liveTabs.get(s.tab.id);
   // Delivery of a stale old document cannot navigate the simulated browser backwards.
   if(m.type!=='DOCUMENT_RETIRED'&&(!current||document.order>current.order))activate(s,m.documentNonce);
   if(!Object.hasOwn(m,'documentNonce'))m.documentNonce=document.documentNonce;
   if(m.type==='DOCUMENT_RETIRED'&&current?.documentNonce===m.documentNonce)current.present=false;
  }
  return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('callback timeout')),5000);const accepted=listener(m,s,r=>{clearTimeout(timer);resolve({accepted:true,reply:clone(r)})});if(accepted!==true){clearTimeout(timer);resolve({accepted:false})}});
 };
 const observe=()=>send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:CANDIDATE,siteNames:['仪表盘 - 星海机场']});
 try{
  background=await import('./background.js?auto='+Date.now());
  t.afterEach(async()=>{await background.whenIdle()});
  await t.test('a browser-wide grant and a forged brand cannot rewrite from an explicitly untrusted origin',async()=>{
    reset();state.local.trustedOrigins={version:1,origins:[]};
    state.local.sites={[ORIGIN]:{origin:ORIGIN,subscriptionName:'星海'}};
    await send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:'https://attacker-cdn.example.com/subscribe?token=ATTACKER-FIXTURE',siteNames:['星海']});
    assert.equal(state.calls.length,0,'untrusted page must not read catalog or write even with browser-wide capability');
    assert.equal(state.subs.get('星海').url,OLD);
  });
  await t.test('leaving for an unobserved document during preview prevents the old write',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;state.detachedDocument=true;release.resolve();await initial;
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    assert.equal(state.subs.get('星海').url,OLD);
  });
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
  await t.test('legacy trust arrays and historical site records cannot authorize automatic, manual or restore writes',async()=>{
    for(const legacy of [undefined,[ORIGIN],{origins:[ORIGIN]}]){
      reset();state.local.trustedOrigins=legacy;
      state.local.sites={[ORIGIN]:{origin:ORIGIN,subscriptionName:'星海'}};
      const document=state.liveTabs.get(PAGE.tab.id);
      state.session.pendingByOrigin={[ORIGIN]:{candidateUrl:CANDIDATE,siteNames:['星海'],at:Date.now(),documentKey:PAGE.tab.id+':'+PAGE.documentId,documentNonce:document.documentNonce,tabId:PAGE.tab.id}};
      await observe();
      for(const type of ['SYNC_PENDING','RESTORE_LATEST'])assert.equal((await send({type,origin:ORIGIN},POPUP)).reply.code,'site_not_trusted');
      assert.equal(state.calls.length,0);
      assert.equal(state.subs.get('星海').url,OLD);
    }
  });
  await t.test('untrust during preview invalidates immediately and cannot be bypassed by manual retry or restore',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;
    const revoked=await send({type:'UNTRUST_SITE',origin:ORIGIN},POPUP);
    assert.equal(revoked.reply.status,'site_untrusted');
    assert.ok(!state.local.trustedOrigins.origins.includes(ORIGIN));
    release.resolve();await initial;await background.whenIdle();
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    assert.equal(state.session.pendingByOrigin?.[ORIGIN],undefined);
    for(const type of ['SYNC_PENDING','RESTORE_LATEST'])assert.equal((await send({type,origin:ORIGIN},POPUP)).reply.code,'site_not_trusted');
    assert.equal(state.subs.get('星海').url,OLD);
  });
  await t.test('disabling globally while preview is held takes effect before the old backend queue can write',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;
    const disabled=await send({type:'SAVE_SETTINGS',settings:{...state.local.settings,enabled:false}},POPUP);
    assert.equal(disabled.reply.settings.enabled,false);
    release.resolve();await initial;await background.whenIdle();
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    assert.equal(state.session.pendingByOrigin?.[ORIGIN],undefined);
    assert.equal(state.subs.get('星海').url,OLD);
  });
  await t.test('browser capability revoked after preview and after PATCH transport readiness cannot reach the send',async()=>{
    for(const pauseStage of ['preview','patch_transport']){
      const entered=deferred(),release=deferred();reset({pauseStage,entered,release});
      const initial=observe();await entered.promise;
      state.allowed=false;release.resolve();await initial;await background.whenIdle();
      assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0,pauseStage);
      assert.equal(state.subs.get('星海').url,OLD);
      assert.equal(state.local.sites[ORIGIN].lastResult.code,'site_permission_required');
    }
  });
  await t.test('permission removal event prunes explicit trust and pending work instead of treating browser regrant as consent',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;
    state.allowed=false;permissionRemoved({origins:['http://192.0.2.8/*']});
    release.resolve();await initial;await background.whenIdle();
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    assert.equal(state.session.pendingByOrigin?.[ORIGIN],undefined);
    assert.deepEqual(state.local.trustedOrigins,{version:1,origins:[]});
    state.allowed=true;state.calls=[];await observe();
    assert.equal(state.calls.length,0);
  });
  await t.test('restore refuses foreign-origin and legacy unowned backups before any backend access',async()=>{
    for(const origin of [undefined,'https://other-fixture.example.com']){
      reset();await observe();state.calls=[];
      if(origin===undefined)delete state.local.backups[0].origin;else state.local.backups[0].origin=origin;
      const reply=(await send({type:'RESTORE_LATEST',origin:ORIGIN},POPUP)).reply;
      assert.equal(reply.code,'backup_not_found');
      assert.equal(state.calls.length,0);
      assert.equal(state.subs.get('星海').url,CANDIDATE+'#flowDedup=fixture');
      assert.equal(state.local.backups.length,1);
      assert.equal((await send({type:'GET_STATUS'},POPUP)).reply.sites[ORIGIN].backupCount,0,'foreign or unowned backup must not be advertised as restorable for this origin');
    }
  });
  await t.test('restore requires enabled state, explicit trust and fresh browser capability',async()=>{
    for(const [reason,code] of [['disabled','disabled'],['untrusted','site_not_trusted'],['permission','site_permission_required']]){
      reset();await observe();state.calls=[];
      if(reason==='disabled')state.local.settings.enabled=false;
      if(reason==='untrusted')state.local.trustedOrigins.origins=[];
      if(reason==='permission')state.allowed=false;
      assert.equal((await send({type:'RESTORE_LATEST',origin:ORIGIN},POPUP)).reply.code,code);
      assert.equal(state.calls.length,0,reason);
      assert.equal(state.subs.get('星海').url,CANDIDATE+'#flowDedup=fixture');
      assert.equal(state.local.backups.length,1);
    }
  });
  await t.test('restore in flight is stopped by immediate site revocation before its PATCH',async()=>{
    reset();await observe();state.calls=[];
    state.pauseStage='restore_read';state.entered=deferred();state.release=deferred();
    const restoring=send({type:'RESTORE_LATEST',origin:ORIGIN},POPUP);await state.entered.promise;
    await send({type:'UNTRUST_SITE',origin:ORIGIN},POPUP);state.release.resolve();await restoring;
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    assert.equal(state.subs.get('星海').url,CANDIDATE+'#flowDedup=fixture');
    assert.equal(state.local.backups.length,1);
  });
  await t.test('only the exact popup may grant the currently active origin and tab',async()=>{
    reset();const origin='https://first-use.example.com';
    const sender={...clone(PAGE),url:origin+'/dashboard',origin,documentId:PAGE.documentId+'-first-use',tab:{id:20,url:origin+'/dashboard'}};
    activate(sender);
    assert.equal((await send({type:'TRUST_CURRENT_SITE',origin,tabId:20},sender)).accepted,false);
    assert.equal((await send({type:'TRUST_CURRENT_SITE',origin,tabId:20},{...POPUP,url:POPUP.url+'?spoof'})).accepted,false);
    for(const request of [{origin:ORIGIN,tabId:20},{origin,tabId:21}]){
      assert.equal((await send({type:'TRUST_CURRENT_SITE',...request},POPUP)).reply.code,'document_changed');
      assert.ok(!state.local.trustedOrigins.origins.includes(origin));
    }
    state.allowed=false;
    assert.equal((await send({type:'TRUST_CURRENT_SITE',origin,tabId:20},POPUP)).reply.code,'site_permission_required');
    assert.ok(!state.local.trustedOrigins.origins.includes(origin));
    state.allowed=true;
    assert.equal((await send({type:'TRUST_CURRENT_SITE',origin,tabId:20},POPUP)).reply.status,'site_trusted');
    assert.ok(state.local.trustedOrigins.origins.includes(origin));
    assert.deepEqual(state.reloads,[20]);
    assert.equal(state.scripts.size,2);
    assert.equal(state.calls.length,0,'one-time site approval does not fabricate a candidate');
  });
  await t.test('popup manual diagnostics and restore cannot target a historical site in another active tab',async()=>{
    reset();await observe();state.calls=[];
    const other='https://other-fixture.example.com';activate({...clone(PAGE),url:other+'/',origin:other,documentId:PAGE.documentId+'-active-other',tab:{id:21,url:other+'/'}});state.activeTabId=21;
    for(const type of ['SYNC_PENDING','RESTORE_LATEST'])assert.equal((await send({type,origin:ORIGIN},POPUP)).reply.code,'document_changed');
    assert.equal(state.calls.length,0);
    assert.equal(state.local.backups.length,1);
  });
  await t.test('granting a second airport does not invalidate the first airport preview',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;
    const origin='https://new-second-airport.example';
    activate({...clone(PAGE),url:origin+'/',origin,documentId:PAGE.documentId+'-second',tab:{id:21,url:origin+'/'}});state.activeTabId=21;
    assert.equal((await send({type:'TRUST_CURRENT_SITE',origin,tabId:21},POPUP)).reply.status,'site_trusted');
    release.resolve();await initial;
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
  });
  await t.test('same-origin navigation without a new observation cancels a held candidate',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;
    activate({...clone(PAGE),documentId:PAGE.documentId+'-unobserved',url:ORIGIN+'/next',tab:{id:20,url:ORIGIN+'/next'}});
    tabUpdated(PAGE.tab.id,{status:'loading'});release.resolve();await initial;await background.whenIdle();
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    assert.equal(state.session.pendingByOrigin?.[ORIGIN],undefined);
    assert.equal(state.subs.get('星海').url,OLD);
  });
  await t.test('a changed top-frame nonce at the same URL blocks the old send even without a new PAGE_CONTEXT',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;
    state.liveTabs.set(PAGE.tab.id,{...state.liveTabs.get(PAGE.tab.id),documentNonce:'nonce:replacement-isolated-document'});
    release.resolve();await initial;await background.whenIdle();
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,0);
    assert.equal(state.session.pendingByOrigin?.[ORIGIN],undefined);
    assert.equal(state.subs.get('星海').url,OLD);
  });
  await t.test('late loading of the same live document during preview preserves a valid operation',async()=>{
    const entered=deferred(),release=deferred();reset({pauseStage:'preview',entered,release});
    const initial=observe();await entered.promise;
    tabUpdated(PAGE.tab.id,{status:'loading'});release.resolve();await initial;await background.whenIdle();
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
  });
  await t.test('late retirement from an old browser document cannot cancel the current document',async()=>{
    reset();const old=clone(PAGE);await send({type:'PAGE_CONTEXT'},old);
    const current={...clone(PAGE),documentId:PAGE.documentId+'-current',url:ORIGIN+'/current',tab:{id:20,url:ORIGIN+'/current'}};
    await send({type:'PAGE_CONTEXT'},current);
    state.pauseStage='preview';state.entered=deferred();state.release=deferred();
    const initial=send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:CANDIDATE,siteNames:['星海']},current);await state.entered.promise;
    await send({type:'DOCUMENT_RETIRED'},old);state.release.resolve();await initial;
    assert.equal(state.liveTabs.get(PAGE.tab.id).documentId,current.documentId,'stale delivery did not navigate the fixture backwards');
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
  });
  await t.test('a genuine BFcache restoration may readmit its old document only when the live top-frame nonce confirms it',async()=>{
    reset();const old=clone(PAGE);await send({type:'PAGE_CONTEXT'},old);await send({type:'DOCUMENT_RETIRED'},old);
    const next={...clone(PAGE),documentId:PAGE.documentId+'-newer',url:ORIGIN+'/newer',tab:{id:20,url:ORIGIN+'/newer'}};
    await send({type:'PAGE_CONTEXT'},next);
    assert.equal((await send({type:'PAGE_CONTEXT'},old)).reply.allowed,false,'a stale message alone cannot restore a retired document');
    activate(old);
    assert.equal((await send({type:'PAGE_CONTEXT'},old)).reply.allowed,true);
    await send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:CANDIDATE,siteNames:['星海']},old);
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.equal(state.local.sites[ORIGIN].lastResult.status,'updated');
  });
  await t.test('a worker restart accepts only a live pending document with the explicit trust registry and nonce',async()=>{
    reset();await observe();state.subs.get('星海').url=OLD;state.calls=[];
    const pending=clone(state.session.pendingByOrigin[ORIGIN]);
    background=await import('./background.js?restart='+Date.now());
    assert.equal((await send({type:'SYNC_PENDING',origin:ORIGIN},POPUP)).reply.status,'updated');
    assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
    assert.equal(state.session.pendingByOrigin[ORIGIN].documentNonce,pending.documentNonce);
  });
  await t.test('legacy pending without nonce and tab identity cannot be replayed after worker restart',async()=>{
    reset();state.session.pendingByOrigin={[ORIGIN]:{candidateUrl:CANDIDATE,siteNames:['星海'],at:Date.now(),documentKey:PAGE.tab.id+':'+PAGE.documentId}};
    background=await import('./background.js?legacy='+Date.now());
    assert.equal((await send({type:'SYNC_PENDING',origin:ORIGIN},POPUP)).reply.code,'open_dashboard_first');
    assert.equal(state.calls.length,0);
    assert.equal(state.subs.get('星海').url,OLD);
  });
  await t.test('installation and startup reconciliation keep only explicit currently capable origins',async()=>{
    for(const initialize of [()=>installed(),()=>startup()]){
      reset();state.local.trustedOrigins=[ORIGIN];state.local.sites={[ORIGIN]:{origin:ORIGIN,subscriptionName:'星海'}};
      await initialize();await background.whenIdle();
      assert.deepEqual(state.local.trustedOrigins,{version:1,origins:[]});
      assert.equal(state.scripts.size,0);
      assert.equal(state.calls.length,0);
    }
  });
  await t.test('startup reconciliation does not lose a simultaneous initial handshake from a trusted live page',async()=>{
    reset();startup();
    assert.equal((await send({type:'PAGE_CONTEXT'})).reply.allowed,true);
    await background.whenIdle();
    assert.equal(state.session.pageObservations[ORIGIN].observation.stage,'bridge_ready');
    assert.equal(state.scripts.size,2);
    await observe();assert.equal(state.calls.filter(call=>call.method==='PATCH').length,1);
  });
  await t.test('restoring after worker restart uses a saved document identity and still verifies the live document',async()=>{
    for(const detachedDocument of [false,true]){
      reset();await observe();state.calls=[];
      background=await import('./background.js?restoreRestart='+Date.now()+detachedDocument);
      assert.equal((await send({type:'GET_STATUS'},POPUP)).reply.sites[ORIGIN].backupCount,1);
      state.detachedDocument=detachedDocument;
      const reply=(await send({type:'RESTORE_LATEST',origin:ORIGIN},POPUP)).reply;
      assert.equal(reply[detachedDocument?'code':'status'],detachedDocument?'candidate_superseded':'restored');
      assert.equal(state.calls.filter(call=>call.method==='PATCH').length,detachedDocument?0:1);
      assert.equal(state.local.backups.length,detachedDocument?1:0);
      assert.equal(state.subs.get('星海').url,detachedDocument?CANDIDATE+'#flowDedup=fixture':OLD);
    }
  });
 }finally{if(originalChrome===undefined)delete globalThis.chrome;else globalThis.chrome=originalChrome;globalThis.fetch=originalFetch;}
});
