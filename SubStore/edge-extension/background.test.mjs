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

test('automatic authorized-site matching and local relay',async t=>{
 const originalChrome=globalThis.chrome, originalFetch=globalThis.fetch;
 let listener, state;
 const area=kind=>({async get(keys){const names=typeof keys==='string'?[keys]:keys;return Object.fromEntries(names.filter(key=>Object.hasOwn(state[kind],key)).map(key=>[key,clone(state[kind][key])]))},async set(value){Object.assign(state[kind],clone(value))}});
 const reset=(overrides={})=>state={local:{settings:{enabled:true,backendUrl:'http://127.0.0.1:38324',frontendUrl:'http://127.0.0.1:14122'}},session:{},subs:new Map([['星海',source()]]),calls:[],allowed:true,preview:{original:[NODE],processed:[NODE]},...overrides};
 reset();
 globalThis.fetch=()=>{throw Error('Native extension fetch is forbidden');};
 globalThis.chrome={runtime:{id:ID,getManifest:()=>({version:'1.3.0'}),getURL:p=>'chrome-extension://'+ID+'/'+p,onMessage:{addListener(fn){listener=fn}},onInstalled:{addListener(){}},onStartup:{addListener(){}}},permissions:{async contains(){return state.allowed}},storage:{local:area('local'),session:area('session')},action:{async setBadgeText(){},async setBadgeBackgroundColor(){}},tabs:{async create(){if(state.createFailures){state.createFailures--;throw Error('PRIVATE-CREATE-FAILURE')}return{id:77}},async sendMessage(_id,m){
  if(m.type==='LOCAL_TRANSPORT_PING')return{ready:true,origin:m.frontendUrl};
  assert.equal(m.type,'LOCAL_BACKEND_REQUEST');
  const body=m.body===undefined?undefined:JSON.parse(m.body);
  state.calls.push({method:m.method,path:m.path,body});
  let data;
  if(m.method==='GET'&&m.path==='/api/subs')data=state.catalog===undefined?[...state.subs.values()]:state.catalog;
  else if(m.method==='POST'&&m.path==='/api/preview/sub?target=JSON'){assert.equal(body.name,m.subscriptionName);data=state.preview;}
  else if(m.path==='/api/sub/'+encodeURIComponent(m.subscriptionName)&&state.subs.has(m.subscriptionName)){
    if(m.method==='GET')data=state.subs.get(m.subscriptionName);
    else if(m.method==='PATCH'){assert.deepEqual(Object.keys(body),['url']);state.subs.get(m.subscriptionName).url=body.url;data={};}
    else assert.fail('Unexpected mutation');
  }else assert.fail('Unexpected API route');
  return{ok:true,status:200,contentType:'application/json',bodyText:JSON.stringify({status:'success',data})};
 }}};
 const send=(m,s=PAGE)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('callback timeout')),2000);const accepted=listener(m,s,r=>{clearTimeout(timer);resolve({accepted:true,reply:clone(r)})});if(accepted!==true){clearTimeout(timer);resolve({accepted:false})}});
 const observe=()=>send({type:'OBSERVED_SUBSCRIPTION',candidateUrl:CANDIDATE,siteNames:['仪表盘 - 星海机场']});
 try{
  await import('./background.js?auto='+Date.now());
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
  await t.test('only exact popup can save global settings, retry and conditionally restore its matched source',async()=>{
    reset();await observe();assert.equal((await send({type:'GET_STATUS'})).accepted,false);
    assert.equal((await send({type:'SAVE_SETTINGS',settings:{enabled:false}}, {...POPUP,url:POPUP.url+'?fake'})).accepted,false);
    const restore=(await send({type:'RESTORE_LATEST',origin:ORIGIN},POPUP)).reply;assert.equal(restore.status,'restored');assert.equal(state.subs.get('星海').url,OLD);assert.equal(state.local.backups.length,0);
    const save=(await send({type:'SAVE_SETTINGS',settings:{enabled:false,backendUrl:'http://127.0.0.1:38324',frontendUrl:'http://127.0.0.1:14122',subscriptionName:'attacker'}},POPUP)).reply;assert.deepEqual(Object.keys(save.settings).sort(),['backendUrl','enabled','frontendUrl']);
    state.calls=[];await observe();assert.equal(state.calls.length,0);
  });
 }finally{if(originalChrome===undefined)delete globalThis.chrome;else globalThis.chrome=originalChrome;globalThis.fetch=originalFetch;}
});
