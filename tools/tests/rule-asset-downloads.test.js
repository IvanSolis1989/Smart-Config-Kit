'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { collectRuleUrls, inspectDownload, verifyUrls, downloadWithCurl,
  parseArguments, redactTransportText } = require('../verify-rule-asset-downloads');

test('CLI proxy and timeout defaults, validation and option propagation', async () => {
  assert.equal(parseArguments([]).requestTimeoutSeconds, 60);
  const options = parseArguments(['--proxy', 'http://127.0.0.1:12345', '--timeout', '60', '--deadline', '300', '--concurrency', '1']);
  assert.equal(options.deadlineSeconds, 300);
  let received;
  const report = await verifyUrls(['http://example.com/a.list'], { ...options, localResolver: () => null,
    downloader: async (_url, transport) => { received = transport; return { status: 200, body: Buffer.from('DOMAIN,example.com\n') }; },
  });
  assert.equal(received.proxy, options.proxy);
  assert.equal(received.timeoutSeconds, 60);
  assert.equal(report.proxy, options.proxy);
  assert.equal(report.concurrency, 1);
  for (const proxy of ['socks5://localhost:1', 'file:///tmp/proxy', 'not-a-url', 'http://localhost/path']) {
    assert.throws(() => parseArguments(['--proxy', proxy]), /proxy/);
  }
  for (const timeout of ['0', '601', 'NaN', '1.5']) assert.throws(() => parseArguments(['--timeout', timeout]), /timeout/);
  for (const count of ['0', '5', '1.5']) assert.throws(() => parseArguments(['--concurrency', count]), /concurrency/);
  let bounded;
  await verifyUrls(['http://example.com/a.list'], { deadlineSeconds: 2, requestTimeoutSeconds: 60,
    localResolver: () => null, downloader: async (_url, transport) => {
      bounded = transport.timeoutSeconds; return { status: 200, body: Buffer.from('DOMAIN,example.com\n') };
    },
  });
  assert.ok(bounded >= 1 && bounded <= 2);
});

test('proxy credentials never enter receipts or transport errors', async () => {
  const proxy = 'http://testuser:secret%21@127.0.0.1:12345';
  const redacted = redactTransportText(`failed ${proxy} secret! testuser secret%21`, proxy);
  assert.ok(!redacted.includes('testuser') && !redacted.includes('secret'));
  const report = await verifyUrls(['http://example.com/a.list'], { proxy, retries: 0, localResolver: () => null,
    downloader: async () => { throw new Error(`failed ${proxy}`); },
  });
  assert.equal(report.proxy, 'http://127.0.0.1:12345');
  assert.ok(!JSON.stringify(report).includes('secret'));
  assert.ok(!JSON.stringify(report).includes('testuser'));
});

test('collect only active RULE-SET URLs and deduplicate', () => {
  assert.deepEqual(collectRuleUrls('# RULE-SET,https://example.com/old.list,REJECT\nRULE-SET,https://example.com/a.list,REJECT\nRULE-SET,https://example.com/a.list,DIRECT\nDOMAIN,example.com,DIRECT'), ['https://example.com/a.list']);
});

test('HTTP errors, empty and HTTP 200 error bodies never pass', () => {
  for (const input of [
    { status: 404, body: Buffer.from('404: Not Found') },
    { status: 200, body: Buffer.alloc(0) },
    { status: 200, body: Buffer.from('Failed to fetch repository.') },
    { status: 200, body: Buffer.from('<html>server error</html>') },
    { status: 200, body: Buffer.from('ordinary error message') },
  ]) assert.equal(inspectDownload('https://example.com/a.list', input, null).ok, false);
  assert.equal(inspectDownload('https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/rulesets/missing.list',
    { status: 200, body: Buffer.from('DOMAIN,example.com\n') }, null).match, 'missing-local-file');
});

test('DOMAIN-REGEX is a valid nonempty rule set', () => {
  assert.equal(inspectDownload('https://example.com/regex.list', {
    status: 200, body: Buffer.from('DOMAIN-REGEX,^ads\\.example\\.com$\n'),
  }, null).ok, true);
});

test('local hash evidence distinguishes exact bytes, LF canonical and mismatches', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-download-test-'));
  try {
    const local = path.join(directory, 'a.list');
    fs.writeFileSync(local, 'DOMAIN,example.com\r\n');
    const check = (body) => inspectDownload('https://example.com/a.list', { status: 200, body: Buffer.from(body) }, local);
    assert.equal(check('DOMAIN,example.com\r\n').match, 'byte-exact');
    const canonical = check('DOMAIN,example.com\n');
    assert.equal(canonical.match, 'canonical-lf');
    assert.equal(canonical.ok, true);
    assert.notEqual(canonical.sha256, canonical.localSha256);
    assert.equal(canonical.canonicalSha256, canonical.localCanonicalSha256);
    assert.equal(check('DOMAIN,changed.com\n').ok, false);
    assert.equal(check('error text').ok, false);
    fs.writeFileSync(local, '# empty ruleset\n');
    assert.equal(check('# empty ruleset\n').ok, false);
    const binary = path.join(directory, 'a.srs');
    fs.writeFileSync(binary, Buffer.from([1, 13, 10]));
    assert.equal(inspectDownload('https://example.com/a.srs', { status: 200, body: Buffer.from([1, 10]) }, binary).ok, false);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('finite transient retry, no retries for HTTP 404 or hash/content failures, URL dedup', async () => {
  const calls = new Map();
  const report = await verifyUrls(['https://example.com/ok.list', 'https://example.com/ok.list', 'https://example.com/missing.list'], {
    localResolver: () => null,
    downloader: async (url) => {
      calls.set(url, (calls.get(url) || 0) + 1);
      if (url.includes('missing')) return { status: 404, body: Buffer.from('missing') };
      return calls.get(url) === 1 ? { status: 503, body: Buffer.from('unavailable') }
        : { status: 200, body: Buffer.from('DOMAIN,example.com\n') };
    },
  });
  assert.equal(report.total, 2);
  assert.equal(report.passed, 1);
  assert.equal(report.failed, 1);
  assert.equal(calls.get('https://example.com/ok.list'), 2);
  assert.equal(calls.get('https://example.com/missing.list'), 1);
});

test('HTTP 200 partial transport failure is retried, content failure is not', async () => {
  let calls = 0;
  const report = await verifyUrls(['https://example.com/a.list'], {
    localResolver: () => null,
    downloader: async () => (++calls === 1
      ? { status: 200, body: Buffer.alloc(0), error: 'connection closed' }
      : { status: 200, body: Buffer.from('DOMAIN,example.com\n') }),
  });
  assert.equal(report.passed, 1);
  assert.equal(report.results[0].attempts, 2);
  const failure = await verifyUrls(['https://example.com/a.list'], {
    localResolver: () => null,
    downloader: async () => ({ status: 200, body: Buffer.from('error text') }),
  });
  assert.equal(failure.failed, 1);
  assert.equal(failure.results[0].attempts, 1);
});

test('curl performs actual GET and preserves HTTP status and payload on local server', async () => {
  const methods = [];
  const server = http.createServer((request, response) => {
    methods.push(request.method);
    response.writeHead(request.url === '/missing' ? 404 : 200, { 'Content-Type': 'text/plain' });
    response.end(request.url === '/missing' ? '404: Not Found' : 'DOMAIN,example.com\n');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const good = await downloadWithCurl(`${base}/good`, { timeoutSeconds: 3, captureHeaders: true });
    assert.equal(good.status, 200);
    assert.equal(good.body.toString(), 'DOMAIN,example.com\n');
    assert.equal(good.httpVersion, '1.1');
    assert.match(good.responseHeaders, /HTTP\/1\.1 200/);
    const bad = await downloadWithCurl(`${base}/missing`, { timeoutSeconds: 3 });
    assert.equal(bad.status, 404);
    assert.equal(bad.body.toString(), '404: Not Found');
    assert.deepEqual(methods, ['GET', 'GET']);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test('explicit HTTP proxy receives absolute GET target despite NO_PROXY', async () => {
  const targets = [];
  const server = http.createServer((request, response) => {
    targets.push(request.url);
    response.end('DOMAIN,example.com\n');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const previousNoProxy = process.env.NO_PROXY;
  process.env.NO_PROXY = '*';
  try {
    const result = await downloadWithCurl('http://example.invalid/asset.list', {
      timeoutSeconds: 3, proxy: `http://127.0.0.1:${server.address().port}`,
    });
    assert.equal(result.status, 200);
    assert.deepEqual(targets, ['http://example.invalid/asset.list']);
  } finally {
    if (previousNoProxy === undefined) delete process.env.NO_PROXY; else process.env.NO_PROXY = previousNoProxy;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('request timeout rejects a server that starts HTTP 200 but never finishes', async () => {
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.write('DOMAIN,example.com\n');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const result = await downloadWithCurl(`http://127.0.0.1:${server.address().port}/slow.list`, { timeoutSeconds: 1 });
    assert.equal(result.status, 200);
    assert.match(result.error, /(?:28|timed out)/);
    assert.equal(inspectDownload('http://example.com/slow.list', result, null).ok, false);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
