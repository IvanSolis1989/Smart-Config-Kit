import test from 'node:test';
import assert from 'node:assert/strict';

const backendUrl = 'https://cloud.example.invalid/private-access';
const settings = { backendUrl, subscriptionName: 'Airport A', targetId: 'cloud' };

test('durable snapshot writes are name restricted, revision guarded and marked only after final authorization', async () => {
 const {createCloudFetcher}=await import('./cloud-fetch.mjs');let writes=0,sends=0,checks=0;
 const nodes=Array.from({length:18},(_,i)=>({name:'N'+i,type:'ss',server:'node.example',port:443}));
 const api={permissions:{contains:async()=>true}};
 const make=(name='都是梦',stale=false)=>createCloudFetcher(api,{...settings,subscriptionName:name},{
  assertCurrent:()=>{checks++;if(stale&&checks%2===0)throw Object.assign(Error('candidate_superseded'),{code:'candidate_superseded'})},
  onWriteSent:()=>writes++,fetcher:async()=>{sends++;return new Response('{}')}
 });
 const path=backendUrl+'/api/local-snapshot/'+encodeURIComponent('都是梦'),body={expectedRevision:'a'.repeat(64),original:nodes};
 await make()(path,{method:'GET'});assert.equal(writes,0);
 await make()(path,{method:'POST',body:JSON.stringify(body)});assert.equal(writes,1);
 await make()(path,{method:'POST',body:JSON.stringify({expectedRevision:'a'.repeat(64),restoreContent:'OLD CONTENT'})});assert.equal(writes,2);
 await make()(path,{method:'POST',body:JSON.stringify({...body,dryRun:true})});assert.equal(writes,2);
 for(const invalid of [{...body,url:'https://burn.example'}, {...body,original:nodes.slice(1)}, {...body,expectedRevision:'wrong'}])await assert.rejects(make()(path,{method:'POST',body:JSON.stringify(invalid)}),{code:'cloud_transport_invalid_request'});
 await assert.rejects(make('Other')(path,{method:'GET'}),{code:'cloud_transport_invalid_request'});
 checks=0;await assert.rejects(make('都是梦',true)(path,{method:'POST',body:JSON.stringify(body)}),{code:'candidate_superseded'});
 assert.equal(sends,4);assert.equal(writes,2);
});
async function harness({ permitted = true, assertCurrent, onWriteSent, fetcher } = {}) {
  const { createCloudFetcher } = await import('./cloud-fetch.mjs');
  const calls = [], permissions = [];
  const chrome = { permissions: { async contains(value) { permissions.push(value); return permitted; } } };
  return { calls, permissions, fetch: createCloudFetcher(chrome, settings, {
    assertCurrent, onWriteSent,
    fetcher: fetcher || (async (...args) => { calls.push(args); return new Response('{"status":"success"}'); }),
  }) };
}

test('cloud transport preserves the private backend prefix and checks only its origin permission', async () => {
  const h = await harness();
  await h.fetch(backendUrl + '/api/subs');
  assert.equal(h.calls[0][0], backendUrl + '/api/subs');
  assert.deepEqual(h.permissions, [{ origins: ['https://cloud.example.invalid/*'] }]);
  assert.equal(h.calls[0][1].credentials, 'omit');
  assert.equal(h.calls[0][1].redirect, 'error');
});

test('cloud transport permits only the matched subscription and JSON preview', async () => {
  const h = await harness();
  await h.fetch(backendUrl + '/api/sub/Airport%20A');
  await h.fetch(backendUrl + '/api/preview/sub?target=JSON', { method: 'POST', body: JSON.stringify({ name: 'Airport A', source: 'remote', url: 'https://airport.example/sub?token=example' }) });
  assert.equal(h.calls.length, 2);
});

test('snapshot policy and raw upload are scoped to the selected name and do not mark a subscription PATCH', async () => {
  let writes = 0; const h = await harness({ onWriteSent: () => writes++ });
  const url = backendUrl + '/api/source-snapshot/Airport%20A';
  await h.fetch(url);
  await h.fetch(url, { method: 'POST', body: JSON.stringify({ url: 'https://airport.example/new', expectedUrl: 'https://airport.example/old',
    original: [{ name: 'Raw', type: 'trojan', server: 'raw.example', port: 443, password: 'PRIVATE' }] }) });
  assert.equal(h.calls.length, 2); assert.equal(writes, 0); assert.equal(h.permissions.length, 2);
  for (const body of [{ url: 'https://airport.example/new', original: [] }, { url: 'https://airport.example/new', expectedUrl: 'https://airport.example/old', original: [], process: [] }])
    await assert.rejects(h.fetch(url, { method: 'POST', body: JSON.stringify(body) }), { code: 'cloud_transport_invalid_request' });
  await assert.rejects(h.fetch(backendUrl + '/api/source-snapshot/Other'), { code: 'cloud_transport_invalid_request' });
});

test('snapshot upload still requires current candidate and host permission immediately before raw dispatch', async () => {
  const body = JSON.stringify({ url: 'https://airport.example/new', expectedUrl: 'https://airport.example/old',
    original: [{ name: 'Raw', type: 'trojan', server: 'raw.example', port: 443, password: 'PRIVATE' }] });
  const path = backendUrl + '/api/source-snapshot/Airport%20A';
  let checks = 0;
  const h = await harness({ assertCurrent: async () => { if (++checks === 2) throw Object.assign(Error('candidate_superseded'), { code: 'candidate_superseded' }); } });
  await assert.rejects(h.fetch(path, { method: 'POST', body }), { code: 'candidate_superseded' }); assert.equal(h.calls.length, 0);
  const denied = await harness({ permitted: false });
  await assert.rejects(denied.fetch(path, { method: 'POST', body }), { code: 'cloud_permission_required' }); assert.equal(denied.calls.length, 0);
});

test('cloud transport rejects foreign hosts, prefix escape, unrelated names and methods without dispatch', async () => {
  const h = await harness();
  for (const [url, method] of [
    ['https://other.example.invalid/private-access/api/subs', 'GET'],
    ['https://cloud.example.invalid/api/subs', 'GET'],
    [backendUrl + '/../api/subs', 'GET'],
    [backendUrl + '/api/sub/Other', 'GET'],
    [backendUrl + '/api/settings', 'PATCH'],
    [backendUrl + '/api/subs', 'DELETE'],
    [backendUrl + '/api/subs?share=true', 'GET'],
  ]) await assert.rejects(h.fetch(url, { method }), { code: 'cloud_transport_invalid_request' });
  assert.equal(h.calls.length, 0);
});

test('cloud transport requires an explicit cloud host permission even for read operations', async () => {
  const h = await harness({ permitted: false });
  await assert.rejects(h.fetch(backendUrl + '/api/subs'), { code: 'cloud_permission_required' });
  assert.equal(h.calls.length, 0);
});

test('cloud PATCH sends only a URL and marks the actual send after all guards', async () => {
  const order = [];
  const h = await harness({ assertCurrent: async () => { order.push('guard'); }, onWriteSent: () => { order.push('write'); }, fetcher: async (url, options) => { order.push('fetch'); return new Response('{}'); } });
  await h.fetch(backendUrl + '/api/sub/Airport%20A', { method: 'PATCH', body: JSON.stringify({ url: 'https://airport.example/sub?token=example' }) });
  assert.deepEqual(order.slice(-3), ['guard', 'write', 'fetch']);
});

test('cloud PATCH refuses any extra mutation field before marking a write', async () => {
  let sent = false;
  const h = await harness({ onWriteSent: () => { sent = true; } });
  for (const body of [{ url: 'https://airport.example/sub', source: 'remote' }, { url: 'file:///private' }, {}]) {
    await assert.rejects(h.fetch(backendUrl + '/api/sub/Airport%20A', { method: 'PATCH', body: JSON.stringify(body) }), { code: 'cloud_transport_invalid_request' });
  }
  assert.equal(sent, false);
  assert.equal(h.calls.length, 0);
});

test('cloud stale-candidate guard stops a PATCH immediately before actual dispatch', async () => {
  const expected = Object.assign(new Error('candidate_superseded'), { code: 'candidate_superseded' });
  let sent = false;
  const h = await harness({ assertCurrent: async () => { throw expected; }, onWriteSent: () => { sent = true; } });
  await assert.rejects(h.fetch(backendUrl + '/api/sub/Airport%20A', { method: 'PATCH', body: JSON.stringify({ url: 'https://airport.example/sub' }) }), error => error === expected);
  assert.equal(sent, false);
  assert.equal(h.calls.length, 0);
});

test('cloud aborted requests never dispatch or mark writes', async () => {
  const h = await harness();
  const controller = new AbortController(); controller.abort();
  await assert.rejects(h.fetch(backendUrl + '/api/subs', { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(h.calls.length, 0);
});

test('cloud lost PATCH response is returned once without retry or leaking backend details', async () => {
  let attempts = 0, writes = 0;
  const h = await harness({ onWriteSent: () => { writes++; }, fetcher: async () => { attempts++; throw new Error(backendUrl); } });
  await assert.rejects(h.fetch(backendUrl + '/api/sub/Airport%20A', { method: 'PATCH', body: JSON.stringify({ url: 'https://airport.example/sub' }) }), error => error.code === 'cloud_backend_request_failed' && !error.message.includes('private-access'));
  assert.equal(attempts, 1);
  assert.equal(writes, 1);
});
