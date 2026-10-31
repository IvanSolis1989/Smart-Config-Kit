'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const {loadQuickJS,executeNode,executeQuickJS,prepareSource}=require('../validate-js-engines');
const {TARGETS}=require('../lib/js-engine-fixtures');
const root=path.resolve(__dirname,'../..');
const input={proxies:[{name:'香港 HK',type:'ss',server:'hk.node.test',port:443,cipher:'aes-128-gcm',password:'synthetic'}],dns:{nameserver:['10.0.0.99']},hosts:{'hk.node.test':['192.0.2.10','2001:db8::10'],'unrelated.test':['192.0.2.99']}};

test('three published JS adapters apply only exact hosts in real QuickJS without changing DNS or node identity',async()=>{
  const engine=await loadQuickJS().getQuickJS();
  for(const target of TARGETS){
    const source=fs.readFileSync(path.join(root,target.file),'utf8');
    const baseline=executeNode(source,input).output;
    const modified=prepareSource(source,{profile:'hosts-only'});
    const node=executeNode(modified,input).output;
    const real=executeQuickJS(engine,modified,input,target.file).output;
    assert.deepEqual(real,node,target.file);
    assert.deepEqual(real.dns,baseline.dns,target.file);
    assert.deepEqual(real.proxies,baseline.proxies,target.file);
    assert.deepEqual(real.rules,baseline.rules,target.file);
    assert.deepEqual(real['proxy-groups'],baseline['proxy-groups'],target.file);
    assert.deepEqual(real.hosts['hk.node.test'],input.hosts['hk.node.test']);
    assert.equal(real.hosts['unrelated.test'],undefined);
    delete real.hosts['hk.node.test'];
    assert.deepEqual(real.hosts,baseline.hosts);
  }
});

test('both published OpenClash shell adapters accept hosts-only and their embedded Ruby applies it',t=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'scki-hosts-integration-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  for(const filename of ['OpenClash(mihomo).sh','OpenClash(mihomo-smart).sh']){
    const source=fs.readFileSync(path.join(root,'Mihomo内核系/OpenClash',filename),'utf8');
    assert.match(source,/^  off\|policy\|adaptive\|hosts-only\) ;;$/m);
    assert.match(source,/SCKI_SUBSCRIPTION_ADAPTER_PROFILE:-adaptive/);
    const begin=source.indexOf('# >>> SCKI NODE DNS HINTS: BEGIN');
    const end=source.indexOf('# <<< SCKI NODE DNS HINTS: END',begin);
    assert(begin>=0&&end>begin);
    const code="require 'json'\n"+source.slice(begin,end)+`\ninput = JSON.parse(STDIN.read)\nsnapshot = SckiSubscriptionAdapter.capture_node_dns(input, ['hk.node.test'], 'hosts-only')\nrepository = {'dns'=>{'proxy-server-nameserver'=>['223.5.5.5']},'hosts'=>{}}\nreport = SckiSubscriptionAdapter.apply_node_dns(repository, snapshot, 'hosts-only')\nSTDOUT.write(JSON.generate({'repository'=>repository,'report'=>report}))\n`;
    const program=path.join(directory,filename+'.rb');
    fs.writeFileSync(program,code);
    const result=cp.spawnSync('ruby',[program],{input:JSON.stringify(input),encoding:'utf8',windowsHide:true,timeout:20000});
    assert.equal(result.status,0,result.stderr||String(result.error));
    const actual=JSON.parse(result.stdout);
    assert.equal(actual.report.applied,true);
    assert.deepEqual(actual.repository.hosts,{'hk.node.test':input.hosts['hk.node.test']});
    assert.deepEqual(actual.repository.dns,{'proxy-server-nameserver':['223.5.5.5']});
  }
});
