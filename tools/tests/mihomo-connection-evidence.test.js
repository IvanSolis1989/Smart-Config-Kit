'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const evidence = require('../lib/mihomo-connection-evidence');
const { createEvidence, collect, validateController, LIMITS } = evidence;
const { matchEntry } = require('../lib/ordered-rule-semantics');
const flow = (extra = {}) => ({ id: 'one', metadata: { host: 'Api.Example.com.', destinationIP: '203.0.113.1', destinationPort: '443', network: 'tcp', process: 'C:\\Users\\secret\\curl.exe', sourceIP: '192.168.1.1', processPath: '/secret/path' }, rule: 'Match', rulePayload: '', chains: ['node', '🐟 漏网之鱼'], upload: 10, download: 20, ...extra });

function buildEvidence(snapshots, proxies) {
  const capture = createEvidence();
  const append = capture.addSource(proxies);
  for (const snapshot of snapshots) append(snapshot);
  return capture.finish();
}
test('deduplicates IDs, keeps maxima and compatible probes without private metadata', () => {
  const { report, probes } = buildEvidence([{ connections: [flow()] }, { connections: [flow({ upload: 15, download: 18 })] }], { proxies: { node: { type: 'Shadowsocks' } } });
  assert.equal(report.connections.length, 1);
  assert.equal(report.connections[0].upload, 15);
  assert.equal(report.connections[0].download, 20);
  assert.equal(report.connections[0].outcome, 'proxy');
  assert.equal(report.connections[0].candidate, true);
  assert.equal(report.connections[0].firstSnapshot, 1);
  assert.equal(report.connections[0].lastSnapshot, 2);
  assert.deepEqual(report.connections[0].chains, ['node', '🐟 漏网之鱼']);
  assert.equal(probes[0].processName, 'curl.exe');
  assert.equal(matchEntry('DOMAIN-SUFFIX,example.com', probes[0]).status, 'match');
  assert.equal(matchEntry('DST-PORT,443', probes[0]).status, 'match');
  assert.doesNotMatch(JSON.stringify(report), /192\.168|secret|processPath/);
  assert.equal(probes[0].sourceIp, undefined);
});
test('uses leaf type evidence, preserves unknown and IP-only, matches exact fallback only', () => {
  const rows = [flow({ id: 'd', chains: ['custom', 'group'], rule: 'Domain', rulePayload: 'foo漏网之鱼bar' }), flow({ id: 'r', chains: ['REJECT'] }), flow({ id: 'u', chains: ['mystery'] }), flow({ id: 'ip', metadata: { host: '', destinationIP: '2001:db8::1' }, chains: ['DIRECT'] })];
  const { report, probes } = buildEvidence([{ connections: rows }], { proxies: { custom: { type: 'Direct' } } });
  assert.deepEqual(report.connections.map(r => r.outcome), ['direct', 'reject', 'unknown', 'direct']);
  assert.equal(report.connections[0].candidate, false);
  assert.equal(probes[3].hostAbsent, true);
  assert.equal(matchEntry('DOMAIN,example.com', probes[3]).status, 'no-match');
});
test('rejects malformed input, invalid hosts, oversized text and conflicting identity', () => {
  assert.throws(() => buildEvidence([{}]));
  assert.throws(() => buildEvidence([{ connections: [flow({ metadata: { host: 'bad.example/secret' } })] }]));
  assert.throws(() => buildEvidence([{ connections: [flow({ chains: ['x'.repeat(513)] })] }]));
  assert.throws(() => buildEvidence([{ connections: [flow(), flow({ metadata: { host: 'other.example' } })] }]));
  assert.deepEqual(buildEvidence([{ connections: [] }]).report.connections, []);
});
test('controller permits loopback only and rejects credentials/query/path', () => {
  for (const url of ['http://example.com:9090', 'http://127.0.0.1.evil:9090', 'http://u:p@127.0.0.1:9090', 'http://127.0.0.1:9090/a', 'http://127.0.0.1:9090?token=secret', 'http://127.1', 'http://2130706433', 'http://[::ffff:127.0.0.1]', 'http://127.0.0.1/#']) assert.throws(() => validateController(url));
  assert.equal(validateController('http://127.0.0.1:9090'), 'http://127.0.0.1:9090');
  assert.equal(validateController('http://localhost:9090/'), 'http://127.0.0.1:9090');
  assert.equal(validateController('http://[::1]:9090/'), 'http://[::1]:9090');
});
test('real HTTP fixture receives GET and auth; redirects and errors are redacted', async () => {
  const requests = [];
  let mode = 'ok';
  const server = http.createServer((req, res) => {
    requests.push({ method: req.method, url: req.url, auth: req.headers.authorization });
    if (mode === 'redirect') { res.writeHead(302, { Location: '/secret-token' }); return res.end(); }
    if (mode === 'bad') { res.writeHead(500); return res.end('secret-token'); }
    if (mode === 'large') { res.writeHead(200, { 'Content-Length': LIMITS.bytes + 1 }); return res.end('secret-token'); }
    if (mode === 'json') return res.end('secret-token');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(req.url === '/proxies' ? { proxies: { node: { type: 'Shadowsocks' } } } : { connections: [flow()] }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const controller = `http://127.0.0.1:${server.address().port}`;
  try {
    const result = await collect({ controller, samples: 2, intervalMs: 1, secret: 'secret-token' });
    assert.equal(result.report.connections.length, 1);
    assert.deepEqual(requests.map(row => row.url), ['/proxies', '/connections', '/connections']);
    assert.ok(requests.every(r => r.method === 'GET' && r.auth === 'Bearer secret-token'));
    for (mode of ['redirect', 'bad', 'large', 'json']) await assert.rejects(collect({ controller, samples: 1, intervalMs: 1, secret: 'secret-token' }), error => !/secret-token|127\.0|http:/.test(error.message));
    assert.deepEqual(requests.slice(3).map(row => row.url), Array(4).fill('/proxies'));
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('CLI offline reports and probes refuse overwrite', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-evidence-'));
  try {
    const input = path.join(dir, 'input.json'), output = path.join(dir, 'report.json'), probes = path.join(dir, 'probes.json');
    fs.writeFileSync(input, JSON.stringify({ connections: [flow()] }));
    const cli = path.join(__dirname, '../collect-mihomo-connections.js');
    const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, MIHOMO_SECRET: '' } });
    assert.equal(run('--input', input, '--output', output, '--probes-output', probes).status, 0);
    assert.equal(JSON.parse(fs.readFileSync(probes))[0].host, 'api.example.com');
    const fused = path.join(dir, 'rulesets/generated/fused');
    fs.mkdirSync(fused, { recursive: true });
    fs.writeFileSync(path.join(fused, 'manifest.json'), JSON.stringify({
      authority: 'fixture', segments: [], ordered_rules: ['DOMAIN,api.example.com,DIRECT', 'MATCH,REJECT'],
    }));
    const comparison = spawnSync(process.execPath, [path.join(__dirname, '../validate-ordered-rule-semantics.js'),
      '--current-root', dir, '--baseline-root', dir, '--chronology', 'manifest', '--mode', 'full', '--probes', probes], { encoding: 'utf8' });
    assert.equal(comparison.status, 0, comparison.stderr);
    assert.equal(JSON.parse(comparison.stdout).routes[0].after.policy, 'DIRECT');
    const saved = fs.readFileSync(output, 'utf8');
    assert.notEqual(run('--input', input, '--output', output).status, 0);
    assert.equal(fs.readFileSync(output, 'utf8'), saved);
    assert.notEqual(run().status, 0);
    fs.writeFileSync(input, JSON.stringify({ snapshots: [{ connections: [flow()] }, { connections: [flow({ upload: 30 })] }] }));
    const repeated = run('--input', input, '--input', input);
    assert.equal(repeated.status, 0);
    assert.equal(JSON.parse(repeated.stdout).snapshotCount, 4);
    assert.equal(JSON.parse(repeated.stdout).connections[0].upload, 30);
    assert.equal(JSON.parse(repeated.stdout).uniqueConnections, 2);
    assert.deepEqual(JSON.parse(repeated.stdout).connections.map(row => row.id), ['s1-c1', 's2-c1']);
    fs.writeFileSync(input, 'private-invalid-json');
    assert.doesNotMatch(run('--input', input).stderr, /private-invalid|scki-evidence/);
    fs.writeFileSync(input, Buffer.alloc(LIMITS.bytes + 1));
    assert.notEqual(run('--input', input).status, 0);
  } finally { fs.rmSync(dir, { recursive: true }); }
});
test('unknown shapes do not create domain or leaf evidence; input bounds fail closed', () => {
  const { report, probes } = buildEvidence([{ connections: [flow({ chains: ['selector'], metadata: {}, rule: 'Domain', rulePayload: 'MATCH' })] }], { proxies: { selector: { type: 'Selector' } } });
  assert.equal(report.connections[0].outcome, 'unknown');
  assert.equal(report.connections[0].destinationKind, 'unknown');
  assert.equal(report.connections[0].candidate, false);
  assert.deepEqual(probes, [{}]);
  assert.throws(() => buildEvidence(Array.from({ length: LIMITS.snapshots + 1 }, () => ({ connections: [] }))));
  assert.throws(() => buildEvidence([{ connections: [flow({ upload: Number.MAX_SAFE_INTEGER + 1 })] }]));
});
test('sniffHost takes precedence without hiding original host; literal hosts are explicit IP-only', () => {
  const { report, probes } = buildEvidence([{ connections: [
    flow({ id: 'sniff', metadata: { host: 'original.example', sniffHost: 'sniffed.example' } }),
    flow({ id: 'literal', metadata: { host: '203.0.113.8' } })
  ] }]);
  assert.equal(probes[0].host, 'sniffed.example');
  assert.equal(report.connections[0].ruleHostSource, 'sniffHost');
  assert.deepEqual(report.connections[0].observedHosts, { host: 'original.example', sniffHost: 'sniffed.example' });
  assert.equal(report.connections[0].hostMismatch, true);
  assert.equal(probes[1].hostAbsent, true);
  assert.equal(probes[1].host, null);
  assert.equal(probes[1].ip, '203.0.113.8');
});
test('a second output reservation race cleans the first file and preserves the competing file', t => {
  const { writeOutputs } = require('../collect-mihomo-connections');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-output-'));
  const first = path.join(dir, 'first.json'), second = path.join(dir, 'second.json');
  const original = fs.openSync;
  const mock = t.mock.method(fs, 'openSync', function(file, flags, ...rest) {
    if (file === second && flags === 'wx') fs.writeFileSync(second, 'competing file');
    return original.call(this, file, flags, ...rest);
  });
  try {
    assert.throws(() => writeOutputs([{ file: first, content: 'report' }, { file: second, content: 'probes' }]));
    assert.equal(fs.existsSync(first), false);
    assert.equal(fs.readFileSync(second, 'utf8'), 'competing file');
  } finally { mock.mock.restore(); fs.rmSync(dir, { recursive: true }); }
});
test('accepts legal single-label and underscore hosts consistently with the semantic matcher', () => {
  for (const name of ['localhost', 'router', '_service.example', 'my_router']) {
    const { probes } = buildEvidence([{ connections: [flow({ metadata: { host: name } })] }]);
    assert.equal(probes[0].host, name);
    assert.equal(matchEntry(`DOMAIN,${name}`, probes[0]).status, 'match');
  }
});
test('shared byte budget stops HTTP sampling before another snapshot is fetched', async () => {
  let requests = 0;
  const body = JSON.stringify({ connections: [flow()] });
  const server = http.createServer((req, res) => { requests++; res.end(req.url === '/proxies' ? '{"proxies":{}}' : body); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await assert.rejects(collect({ controller: `http://127.0.0.1:${server.address().port}`, samples: 3, intervalMs: 1, byteLimit: Buffer.byteLength(body) + 14 }));
    assert.equal(requests, 3); // proxies + first snapshot + rejected second snapshot; no third
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('offline reads share the budget and snapshot append checks limits immediately', () => {
  const { readJson } = require('../collect-mihomo-connections');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-budget-'));
  try {
    const file = path.join(dir, 'input.json');
    fs.writeFileSync(file, '{"connections":[]}');
    const budget = evidence.createByteBudget(20);
    readJson(file, budget);
    assert.throws(() => readJson(file, budget));
    const capture = createEvidence();
    const append = capture.addSource();
    for (let index = 0; index < LIMITS.snapshots; index++) append({ connections: [] });
    const nextSource = capture.addSource();
    assert.throws(() => nextSource({ connections: [] }));
  } finally { fs.rmSync(dir, { recursive: true }); }
});
test('missing host evidence remains unknown while explicit empty and literal hosts establish absence', () => {
  for (const [metadata, status] of [
    [{ destinationIP: '203.0.113.1' }, 'unknown'],
    [{ host: null, destinationIP: '203.0.113.1' }, 'unknown'],
    [{ host: '', destinationIP: '203.0.113.1' }, 'no-match'],
    [{ host: '203.0.113.1' }, 'no-match']
  ]) {
    const { probes } = buildEvidence([{ connections: [flow({ metadata })] }]);
    assert.equal(matchEntry('DOMAIN,example.com', probes[0]).status, status);
  }
});

test('idle snapshots and independently scoped connection IDs preserve source evidence', () => {
  const capture = createEvidence();
  const appendA = capture.addSource({ proxies: { node: { type: 'Shadowsocks' } } });
  appendA({ connections: null });
  appendA({ connections: [flow()] });
  appendA({ connections: [flow({ upload: 25 })] });
  const appendB = capture.addSource();
  appendB({ connections: [flow({ metadata: { host: 'other.example' } })] });
  const { report, probes } = capture.finish();
  assert.deepEqual(report.sources, [
    { source: 1, snapshotCount: 3, emptySnapshotCount: 1, observationCount: 2, uniqueConnections: 1, hasProxyTypeSnapshot: true },
    { source: 2, snapshotCount: 1, emptySnapshotCount: 0, observationCount: 1, uniqueConnections: 1, hasProxyTypeSnapshot: false },
  ]);
  assert.deepEqual(report.connections.map(row => [row.id, row.firstSnapshot, row.lastSnapshot, row.outcome]), [
    ['s1-c1', 2, 3, 'proxy'], ['s2-c1', 1, 1, 'unknown'],
  ]);
  assert.deepEqual(probes.map(probe => probe.host), ['api.example.com', 'other.example']);
  assert.throws(() => buildEvidence([{ connections: [flow(), flow()] }]), /Duplicate connection ID/);
  assert.throws(() => buildEvidence([{ connections: [flow()] }, { connections: [flow({ rule: 'RuleSet' })] }]), /conflicting match evidence/);
});

test('round trips usable rule evidence while obscuring sensitive payloads and controller token echoes', () => {
  const capture = createEvidence('MiXeD-token');
  const append = capture.addSource();
  append({ connections: [
    flow({ id: 'MiXeD-token-first', metadata: { host: 'MIXED-token.example', process: 'mixed-token.exe' }, rule: 'RuleSet', rulePayload: 'MiXeD-token', chains: ['https://user:hunter2@proxy.example', 'normal-group'] }),
    flow({ id: 'source-ip', rule: 'SrcIPCIDR', rulePayload: '192.168.1.1/32' }),
    flow({ id: 'source-port', rule: 'SrcPort', rulePayload: '50001' }),
    flow({ id: 'inbound-user', rule: 'InUser', rulePayload: 'private-user' }),
    flow({ id: 'process-path', rule: 'ProcessPath', rulePayload: 'C:\\Users\\owner\\curl.exe' }),
    flow({ id: 'logical', rule: 'AND', rulePayload: '((SRC-IP-CIDR,192.168.2.1/32),(DOMAIN,api.example.com))' }),
    flow({ id: 'useful', rule: 'RuleSet', rulePayload: 'scki-fused-rules' }),
  ] });
  const result = capture.finish();
  assert.doesNotMatch(JSON.stringify(result), /mixed-token|hunter2|192\.168|50001|private-user|owner/i);
  assert.deepEqual(result.probes[0], {});
  assert.equal(result.report.connections[0].outcome, 'unknown');
  assert.deepEqual(result.report.connections.map(row => row.rulePayload), [null, null, null, null, null, null, 'scki-fused-rules']);
  assert.deepEqual(result.report.connections[0].chains, [null, 'normal-group']);
});

test('a stalled response consumes the collection deadline without starting another request', async () => {
  const paths = [];
  const server = http.createServer((req, res) => {
    paths.push(req.url);
    if (req.url === '/proxies') return res.end('{"proxies":{}}');
    res.writeHead(200);
    res.write('{"connections":');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await assert.rejects(collect({ controller: 'http://127.0.0.1:' + server.address().port, samples: 3, intervalMs: 1, durationMs: 300 }), /\/connections/);
    assert.deepEqual(paths, ['/proxies', '/connections']);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
