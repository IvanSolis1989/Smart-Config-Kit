const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const moduleUrl = name => pathToFileURL(path.resolve(__dirname, '../../SubStore/scripts/' + name)).href;
const load = () => import(moduleUrl('local-snapshot.mjs'));
const loadPatcher = () => import(moduleUrl('patch-local-snapshot-worker.mjs'));
const prefix = '/ext-' + 'b'.repeat(64);
const nodes = [1, 2].map(i => ({ name: 'Node ' + i, type: 'ss', server: 'edge' + i + '.example', port: 443, cipher: 'aes-128-gcm', password: 'private-fixture' }));
const originalContent = JSON.stringify({ proxies: nodes });
const source = () => ({ name: 'Snapshot', source: 'local', url: '', content: originalContent, process: [{ type: 'Regex Rename Operator', args: [{ expr: 'Node', now: 'Renamed' }] }], remark: 'keep' });
function setup() {
  let sub = source(); const writes = [], previews = [];
  const env = { SUB_STORE_EXTENSION_BACKEND_PATH: prefix, SUB_STORE_LOCAL_SNAPSHOT_POLICIES: '[{"name":"Snapshot","minNodes":2}]' };
  const adapters = {
    readSubscription: async name => name === sub?.name ? structuredClone(sub) : null,
    previewSubscription: async candidate => { previews.push(structuredClone(candidate)); const parsed = JSON.parse(candidate.content).proxies; return { original: parsed, processed: parsed.map(n => ({ ...n, name: n.name.replace('Node', 'Renamed') })) }; },
    writeContent: async content => { writes.push(content); sub = { ...sub, content }; },
  };
  return { env, adapters, writes, previews, getSub: () => structuredClone(sub), setSub: value => { sub = value; } };
}
const operate = async (f, body = null, signal) => (await load()).executeLocalSnapshotOperation(f.env, 'Snapshot', body, f.adapters, signal);
const revision = async f => { const result = await operate(f); f.previews.length = 0; return result.data.revision; };
const fresh = () => nodes.map(n => ({ ...n, name: n.name + ' fresh' }));

test('policy GET exposes full-config revision and native validation counts without returning content', async () => {
  const f = setup(); const result = await operate(f);
  assert.equal(result.status, 200); assert.equal(result.data.allowed, true); assert.equal(result.data.minNodes, 2); assert.equal(result.data.name, 'Snapshot');
  assert.match(result.data.revision, /^[a-f0-9]{64}$/); assert.doesNotMatch(JSON.stringify(result), /private-fixture|Regex Rename|edge1/);
  assert.equal(result.data.originalNodes, 2); assert.equal(result.data.processedNodes, 2);
  assert.equal(f.previews.length, 1); assert.equal(f.writes.length, 0);
  f.setSub({ ...f.getSub(), remark: 'changed' }); assert.notEqual((await operate(f)).data.revision, result.data.revision);
});

test('explicit dry run strictly previews the proposed content and preserves the old revision without writing', async () => {
  const f = setup(), expectedRevision = await revision(f), before = f.getSub();
  const result = await operate(f, { expectedRevision, original: fresh(), dryRun: true });
  assert.equal(result.status, 200); assert.equal(result.data.status, 'dry_run'); assert.equal(result.data.revision, expectedRevision);
  assert.equal(result.data.originalNodes, 2); assert.equal(result.data.processedNodes, 2); assert.equal(f.writes.length, 0); assert.deepEqual(f.getSub(), before);
  for (const body of [{ expectedRevision, original: fresh(), dryRun: false }, { expectedRevision, restoreContent: originalContent, dryRun: true }]) assert.equal((await operate(f, body)).status, 400);
});

test('commits exact original JSON content only after trusted local preview and complete readback', async () => {
  const f = setup(), before = f.getSub(), expectedRevision = await revision(f), original = fresh();
  const result = await operate(f, { expectedRevision, original });
  assert.equal(result.status, 200); assert.equal(result.data.status, 'updated'); assert.equal(result.data.originalNodes, 2); assert.equal(result.data.processedNodes, 2);
  const expected = { ...before, content: JSON.stringify({ proxies: original }) };
  assert.deepEqual(f.getSub(), expected); assert.deepEqual(f.previews[0], { ...expected, noCache: true, ignoreFailedRemoteSub: false });
  assert.equal(f.writes.length, 1); assert.equal((await operate(f)).data.revision, result.data.revision);
});

test('unchanged content still validates processors and does not write', async () => {
  const f = setup(); const result = await operate(f, { expectedRevision: await revision(f), original: nodes });
  assert.equal(result.data.status, 'unchanged'); assert.equal(f.previews.length, 1); assert.equal(f.writes.length, 0);
});

test('restores exact old content bytes using last-written full revision', async () => {
  const f = setup(), before = f.getSub();
  const update = await operate(f, { expectedRevision: await revision(f), original: fresh() });
  const restoreContent = '  ' + before.content + '\n';
  const restored = await operate(f, { expectedRevision: update.data.revision, restoreContent });
  assert.equal(restored.status, 200); assert.equal(f.getSub().content, restoreContent);
  assert.deepEqual({ ...f.getSub(), content: before.content }, before);
  assert.equal((await operate(f, { expectedRevision: update.data.revision, restoreContent: before.content })).status, 409);
});

test('denies nonlocal, nonempty URL and unknown policy without adding remote mutations', async () => {
  const { executeLocalSnapshotOperation } = await load(); const f = setup();
  assert.deepEqual((await executeLocalSnapshotOperation(f.env, 'Other', null, f.adapters)).data, { allowed: false });
  for (const sub of [{ ...source(), source: 'remote' }, { ...source(), url: 'https://burn.example/once' }]) {
    f.setSub(sub); assert.deepEqual((await operate(f)).data, { allowed: false });
    assert.equal((await operate(f, { expectedRevision: 'a'.repeat(64), original: nodes })).status, 403);
  }
  assert.equal(f.writes.length, 0);
});

test('rejects unknown fields, warnings, unsupported and insufficient original nodes', async () => {
  const f = setup(), expectedRevision = await revision(f);
  for (const body of [
    { expectedRevision, original: nodes, url: 'https://burn.example/once' },
    { expectedRevision, original: nodes, restoreContent: originalContent },
    { expectedRevision, original: nodes.slice(0, 1) },
    { expectedRevision, original: [{ ...nodes[0], name: '使用的设备过多' }, nodes[1]] },
    { expectedRevision, original: [{ ...nodes[0], type: 'Script Operator' }, nodes[1]] },
    { expectedRevision, original: [{ ...nodes[0], server: '127.0.0.1' }, nodes[1]] },
  ]) { const result = await operate(f, body); assert.equal(result.status, 400); assert.doesNotMatch(JSON.stringify(result), /private-fixture|burn\.example|使用的设备/); }
  assert.equal(f.writes.length, 0); assert.equal(f.previews.length, 0);
});

test('processor failure or invalid restored content preserves the old snapshot', async () => {
  const f = setup(), expectedRevision = await revision(f), before = f.getSub();
  f.adapters.previewSubscription = async () => ({ original: nodes, processed: [] });
  assert.equal((await operate(f, { expectedRevision, original: fresh() })).status, 400);
  f.adapters.previewSubscription = async () => { throw new Error('private-fixture'); };
  const result = await operate(f, { expectedRevision, restoreContent: 'not-a-subscription' });
  assert.equal(result.status, 400); assert.doesNotMatch(JSON.stringify(result), /private-fixture/); assert.deepEqual(f.getSub(), before);
});

test('processed output below the policy minimum fails before any durable write', async () => {
  const f = setup(), expectedRevision = await revision(f), before = f.getSub();
  f.adapters.previewSubscription = async () => ({ original: fresh(), processed: nodes.slice(0, 1) });
  const result = await operate(f, { expectedRevision, original: fresh() });
  assert.equal(result.status, 400); assert.equal(f.writes.length, 0); assert.deepEqual(f.getSub(), before);
});

test('configuration/content concurrent changes and cancellation block the content write', async () => {
  for (const changed of [{ remark: 'changed' }, { content: 'other snapshot' }]) {
    const f = setup(), expectedRevision = await revision(f);
    const preview = f.adapters.previewSubscription;
    f.adapters.previewSubscription = async candidate => { const result = await preview(candidate); f.setSub({ ...f.getSub(), ...changed }); return result; };
    assert.equal((await operate(f, { expectedRevision, original: fresh() })).status, 409); assert.equal(f.writes.length, 0);
  }
  const f = setup(), expectedRevision = await revision(f), controller = new AbortController();
  const preview = f.adapters.previewSubscription;
  f.adapters.previewSubscription = async candidate => { const result = await preview(candidate); controller.abort(); return result; };
  assert.equal((await operate(f, { expectedRevision, original: fresh() }, controller.signal)).status, 408); assert.equal(f.writes.length, 0);
});

test('write readback mismatch returns unavailable instead of claiming success', async () => {
  const f = setup(); f.adapters.writeContent = async () => { f.setSub({ ...f.getSub(), process: [] }); };
  assert.equal((await operate(f, { expectedRevision: await revision(f), original: fresh() })).status, 503);
});

test('route restricts prefix/path/query/method and streams at most four MiB', async () => {
  const { routeLocalSnapshotRequest } = await load(); const f = setup(); let calls = 0;
  const handler = async (name, body) => { calls++; return (await load()).executeLocalSnapshotOperation(f.env, name, body, f.adapters); };
  const make = (suffix, method = 'GET', body) => new Request('https://worker.example' + prefix + suffix, { method, ...body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {} });
  const path = '/api/local-snapshot/Snapshot';
  assert.equal((await routeLocalSnapshotRequest(make(path), f.env, handler)).response.status, 200);
  for (const suffix of [path + '?raw=1', path + '/extra', '/api/local-snapshot/%252f', '/api/local-snapshot/%2f']) assert.equal((await routeLocalSnapshotRequest(make(suffix), f.env, handler)).response.status, 400);
  assert.equal((await routeLocalSnapshotRequest(make(path, 'PATCH', { content: originalContent }), f.env, handler)).response.status, 405);
  assert.equal((await routeLocalSnapshotRequest(make(path, 'POST', { expectedRevision: 'a'.repeat(64), restoreContent: 'x'.repeat(4 * 1024 * 1024) }), f.env, handler)).response.status, 413);
  assert.equal(await routeLocalSnapshotRequest(new Request('https://worker.example/other/api/subs'), f.env, handler), null);
  assert.equal(calls, 1);
});

const fixture = `class LegacySubStoreDO extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.ctx=ctx; this.env=env; this.queue=Promise.resolve(); }
  enqueue(task) { const result=this.queue.then(task);this.queue=result.catch(()=>{});return result; }
  async loadUserData() { return await this.ctx.storage.get(STATE_KEY); }
  createRun(wrapped) {let staged;return {user:{data:wrapped},env:{...this.env,__saveUserData:(_id,data)=>{staged=data;}},commit:async()=>{if(staged!==undefined)await this.ctx.storage.put(STATE_KEY,staged);}};}
  // RPC only: payload comes from the owner's authenticated KV write, never HTTP input.
  async syncLocalReplica() {}
}
async function handler(request,env2) {
  const snapshotRoute = await routeSourceSnapshotRequest(request, env2, sckiReadSourceSubscription);
  return snapshotRoute;
}`;

test('patched DO serializes two same-revision writes and preserves unrelated state using native preview/PATCH', async () => {
  const { patchLocalSnapshotWorker } = await loadPatcher(); const { executeLocalSnapshotOperation, routeLocalSnapshotRequest, localSnapshotRevision } = await load();
  const f = setup(), expectedRevision = await revision(f), stateKey = 'state';
  const initial = { subs: [source()], collections: [{ name: 'Collection', subscriptions: ['Snapshot'] }], settings: { keep: true } };
  let wrapped = JSON.stringify({ 'sub-store': JSON.stringify(initial), other: 'keep' }); const nativeCalls = [];
  const scope = { Request, Response, URL, JSON, console, DurableObject: class {}, STATE_KEY: stateKey, executeLocalSnapshotOperation, routeLocalSnapshotRequest, localSnapshotRevision,
    runSubStoreHttpForUser: async ({ user, env, request, subStorePath }) => {
      const outer = JSON.parse(user.data), config = JSON.parse(outer['sub-store']); const body = await request.json(); nativeCalls.push({ method: request.method, path: subStorePath, body });
      if (request.method === 'POST') { const original = JSON.parse(body.content).proxies; return Response.json({ status: 'success', data: { original, processed: original } }); }
      assert.equal(request.method, 'PATCH'); assert.deepEqual(Object.keys(body), ['content']); config.subs[0].content = body.content; outer['sub-store'] = JSON.stringify(config); env.__saveUserData('owner', JSON.stringify(outer));
      return Response.json({ status: 'success', data: config.subs[0] });
    }, sckiReadSourceSubscription: async () => null,
  };
  const patched = patchLocalSnapshotWorker(fixture);
  vm.runInNewContext(patched.replace(/^import .*;\r?\n/gm, '') + '\nglobalThis.DO=LegacySubStoreDO;', scope);
  const object = new scope.DO({ storage: { get: async () => wrapped, put: async (_key, value) => { wrapped = value; } } }, f.env);
  const results = await Promise.all([object.localSnapshotOperation('Snapshot', { expectedRevision, original: fresh() }), object.localSnapshotOperation('Snapshot', { expectedRevision, original: nodes })]);
  assert.deepEqual(results.map(r => r.status), [200, 409]);
  const updated = JSON.parse(JSON.parse(wrapped)['sub-store']);
  assert.deepEqual(updated, { ...initial, subs: [{ ...source(), content: JSON.stringify({ proxies: fresh() }) }] });
  assert.deepEqual(nativeCalls.map(c => c.method), ['POST', 'PATCH']);
  assert.throws(() => patchLocalSnapshotWorker(patched)); assert.throws(() => patchLocalSnapshotWorker(fixture + fixture)); assert.throws(() => patchLocalSnapshotWorker(fixture.replace('const snapshotRoute =', 'let snapshotRoute =')));
});

test('abort during replica synchronization prevents dispatch of the write RPC', async () => {
  const { patchLocalSnapshotWorker } = await loadPatcher(); const { routeLocalSnapshotRequest } = await load(); const f = setup();
  let entered, resume, dispatched = 0;
  const entry = new Promise(resolve => { entered = resolve; }), gate = new Promise(resolve => { resume = resolve; });
  const scope = { Request, Response, URL, JSON, console, DurableObject: class {}, routeLocalSnapshotRequest,
    owner: () => ({ syncLocalReplica: async () => { entered(); await gate; }, localSnapshotOperation: async () => { dispatched++; return { status: 200, data: {} }; } }),
    routeSourceSnapshotRequest: async () => null, sckiReadSourceSubscription: async () => null,
  };
  vm.runInNewContext(patchLocalSnapshotWorker(fixture).replace(/^import .*;\r?\n/gm, '') + '\nglobalThis.handler=handler;', scope);
  const controller = new AbortController(); const request = new Request('https://worker.example' + prefix + '/api/local-snapshot/Snapshot', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: await revision(f), original: fresh() }), signal: controller.signal,
  });
  const pending = scope.handler(request, f.env); await entry; controller.abort(); resume();
  const result = await pending; assert.equal(result.response.status, 408); assert.equal(dispatched, 0);
});
