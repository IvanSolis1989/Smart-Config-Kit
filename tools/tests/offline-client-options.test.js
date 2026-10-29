'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {buildClientOptionSpec, applyClientOptions, browserRuntimeSource} = require('../lib/offline-client-options');
const read = p => fs.readFileSync(p, 'utf8');
test('desktop typed slots preserve defaults and reject unknown/injected values', () => {
 const source=read('Mihomo内核系/FlClash/FlClash(mihomo).js');
 const spec=buildClientOptionSpec('flclash',source);
 assert.equal(Object.keys(spec.schema).length,5);
 assert.equal(applyClientOptions(spec,source,{}),source);
 assert.match(applyClientOptions(spec,source,{maxNodeMultiplier:2}),/SCKI_MAX_NODE_MULTIPLIER = 2/);
 assert.throws(()=>applyClientOptions(spec,source,{quicPolicy:"';evil()"}));
 assert.throws(()=>applyClientOptions(spec,source,{unknown:true}));
 assert.doesNotMatch(browserRuntimeSource(),/eval\(|new Function/);
});
test('AEROVE locks DNS while OpenClash preserves environment priority',()=>{
 const source=read('Meow内核系/Aerove Lite/AeroveLite(meow).js');
 const spec=buildClientOptionSpec('aerove-lite',source);
 assert.equal(Object.keys(spec.schema).length,4);
 assert.throws(()=>applyClientOptions(spec,source,{subscriptionAdapterProfile:'adaptive'}));
 const oc=read('Mihomo内核系/OpenClash/OpenClash(mihomo).sh');
 const out=applyClientOptions(buildClientOptionSpec('openclash-normal',oc),oc,{maxNodeMultiplier:2,healthCheckProfile:'power-save'});
 assert.match(out,/SCKI_MAX_NODE_MULTIPLIER="\$\{SCKI_MAX_NODE_MULTIPLIER:-2\}"/);
 assert.match(out,/SCKI_DEFAULT_HEALTH_CHECK_PROFILE="power-save"/);
});
test('CMFA native presets preserve source default and remove only source QUIC guards',()=>{
 const source=read('Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml');
 const spec=buildClientOptionSpec('cmfa',source);
 assert.equal(applyClientOptions(spec,source,{}),source);
 const out=applyClientOptions(spec,source,{healthCheckProfile:'power-save',quicPolicy:'follow-rules'});
 assert.match(out,/interval: 900/);
 assert.equal(source.split('\n').filter(x=>x.includes('AND,((DST-PORT,443)')).length,5);
 assert.equal(out.split('\n').filter(x=>x.includes('AND,((DST-PORT,443)')).length,0);
 assert.throws(()=>applyClientOptions(spec,source,{maxNodeMultiplier:2}));
});
test('native matrix keeps defaults exact and supported presets serialize in browser without execution',()=>{
 const vm=require('node:vm');
 const entries={cmfa:'Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml',stash:'独立内核系/Stash/Stash.yaml',meow:'Meow内核系/Meow/Meow(meow).yaml',egern:'独立内核系/Egern/Egern.yaml',shadowrocket:'独立内核系/Shadowrocket/Shadowrocket.conf',surge:'独立内核系/Surge/Surge.conf',loon:'独立内核系/Loon/Loon.conf',quantumultx:'独立内核系/Quantumult X/QuantumultX.conf','singbox-1.14':'Sing-box内核系/SingBox/SingBox(sing-box)-full.json','singbox-1.13':'Sing-box内核系/SingBox/SingBox(sing-box)-1.13.json',v2rayn:'Xray内核系/v2rayN/v2rayN(xray).json',karing:'Sing-box内核系/Karing/diversion_rules_custom.json'};
 for(const [id,path] of Object.entries(entries)) {
   const source=read(path),spec=buildClientOptionSpec(id,source);
   if(id==='v2rayn') assert(Buffer.byteLength(JSON.stringify(spec))<10000,'Xray option spec must not duplicate large source');
   assert.equal(applyClientOptions(spec,source,{}),source,id);
   const requested={};
   for(const key of Object.keys(spec.schema)) requested[key]=spec.schema[key].values[1];
   const expected=applyClientOptions(spec,source,requested);
   if(['cmfa','stash','meow'].includes(id)) assert.equal(expected.split('\n').filter(line=>line.includes('AND,((DST-PORT,443)')).length,0,id);
   const context=vm.createContext({spec:JSON.parse(JSON.stringify(spec)),source,requested});
   assert.equal(vm.runInContext(browserRuntimeSource()+'\nbindClientOptionSource(spec,source); applyClientOptions(spec,source,requested)',context),expected,id);
   assert.throws(()=>vm.runInContext("bindClientOptionSource(spec, 'X'+source.slice(1))",context),/already bound/);
   if(spec.schema.quicPolicy && ['singbox-1.14','singbox-1.13','v2rayn','karing'].includes(id)) {
     const before=JSON.parse(source),after=JSON.parse(expected);
     const n=id.startsWith('singbox')?before.route.rules.length-after.route.rules.length:id==='v2rayn'?before.length-after.length:before.rules.length-after.rules.length;
     assert.equal(n,id==='v2rayn'?5:6,id);
     if(id.startsWith('singbox')) {assert.deepEqual(after.dns,before.dns);assert.deepEqual(after.inbounds,before.inbounds);}
   }
 }
 assert.throws(()=>buildClientOptionSpec('unknown',''));
});
test('OpenClash positive decimals do not silently become unsupported exponent syntax',()=>{
 const source=read('Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh');
 const spec=buildClientOptionSpec('openclash-smart',source);
 assert.match(applyClientOptions(spec,source,{maxNodeMultiplier:1e-7}),/:-0\.0000001\}/);
 assert.throws(()=>applyClientOptions(spec,source,{maxNodeMultiplier:1e21}));
 const hostile={}; Object.defineProperty(hostile,'quicPolicy',{get(){throw Error('getter invoked');}});
 assert.throws(()=>applyClientOptions(spec,source,hostile),/data properties/);
});
test('build rejects missing advertised DNS capability and incomplete exact QUIC catalog',()=>{
 const js=read('Mihomo内核系/FlClash/FlClash(mihomo).js');
 const legacy=js.replace(/^\s*"hosts-only": \{ id: "hosts-only", nodeDnsProjection: "hosts-only" \},?\r?\n/m,'');
 assert.notEqual(legacy,js);
 assert.throws(()=>buildClientOptionSpec('flclash',legacy),/Node-DNS capability/);
 const oc=read('Mihomo内核系/OpenClash/OpenClash(mihomo).sh');
 assert.throws(()=>buildClientOptionSpec('openclash-normal',oc.replace('"hosts-only" => { "id" => "hosts-only"','"missing" => { "id" => "missing"')),/Node-DNS capability/);
 const cmfa=read('Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml');
 assert.throws(()=>buildClientOptionSpec('cmfa',cmfa.replace('(GEOSITE,youtube))','(GEOSITE,youtube-drift))')),/QUIC guard/);
 const line=cmfa.split('\n').find(line=>line.includes('AND,((DST-PORT,443)'));
 assert.throws(()=>buildClientOptionSpec('cmfa',cmfa+'\n'+line+'\n'),/QUIC guard/);
});
test('native options refuse source drift even for default selections',()=>{
 const source=read('Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml'),spec=buildClientOptionSpec('cmfa',source);
 assert.throws(()=>applyClientOptions(spec,'unrelated-source',{quicPolicy:'follow-rules'}),/source/);
 assert.throws(()=>applyClientOptions(spec,source+'\n',{}),/source/);
 assert.throws(()=>applyClientOptions(spec,'X'+source.slice(1),{}),/source/);
});
test('Xray trusted guard catalog requires every source guard exactly once',()=>{
 const {getQuicRules}=require('../../rulesets/source/routing-graph');
 const data=JSON.parse(read('Xray内核系/v2rayN/v2rayN(xray).json'));
 const managed=data.filter(rule=>getQuicRules('block-foreign').some(guard=>rule.remarks?.startsWith(`inline ${guard} -> `)));
 managed[1].remarks=managed[0].remarks;
 assert.throws(()=>buildClientOptionSpec('v2rayn',JSON.stringify(data)),/QUIC guard drift/);
});
