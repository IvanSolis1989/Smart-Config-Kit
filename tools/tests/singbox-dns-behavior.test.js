'use strict';

const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const dgram = require('node:dgram');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');
const profileDirectory = path.join(root, 'Sing-box内核系/SingBox');
const loopback = '127.0.0.1';
const directDomestic = '192.0.2.10';
const directForeign = '198.51.100.10';
const proxyAnswer = '203.0.113.10';

async function bindUdp() {
  const socket = dgram.createSocket('udp4');
  socket.bind(0, loopback);
  await once(socket, 'listening');
  return socket;
}

function dnsQuery(name, id) {
  const header = Buffer.alloc(12);
  header.writeUInt16BE(id, 0);
  header.writeUInt16BE(0x0100, 2);
  header.writeUInt16BE(1, 4);
  const labels = name.split('.').flatMap(label => [Buffer.from([label.length]), Buffer.from(label)]);
  return Buffer.concat([header, ...labels, Buffer.from([0, 0, 1, 0, 1])]);
}

function replyToQueries(socket, tag, answers, hits) {
  socket.on('message', (request, sender) => {
    const labels = [];
    let end = 12;
    while (request[end] > 0) {
      const start = end + 1;
      end = start + request[end];
      labels.push(request.toString('ascii', start, end));
    }
    const name = labels.join('.');
    hits.push({ name, tag });
    const question = Buffer.from(request.subarray(0, end + 5));
    question.writeUInt16BE(0x8180, 2);
    question.writeUInt16BE(1, 6);
    question.writeUInt16BE(0, 10);
    const address = answers[name] || directForeign;
    // An A/IN answer with TTL 60 and a compression pointer to the question.
    const answer = Buffer.from([0xc0, 12, 0, 1, 0, 1, 0, 0, 0, 60, 0, 4, ...address.split('.').map(Number)]);
    socket.send(Buffer.concat([question, answer]), sender.port, loopback);
  });
}

function makeConfig(profile, port, upstreamPorts) {
  const { dns, route } = JSON.parse(fs.readFileSync(profile, 'utf8'));
  const ruleSets = {
    'geosite-private': [{ domain: ['private.test'] }],
    'geosite-cn': [{ domain_suffix: ['domestic.test'], domain: ['dldir1.qq.com', 'dldir2.qq.com'] }],
    'geoip-cn': [{ ip_cidr: ['192.0.2.0/24'] }],
    'scki-fused-001-direct': [{ domain: ['exception.domestic.test'] }],
    'scki-fused-002-intl-site': [{ domain: ['intl-exception.test'] }],
    'scki-fused-003-payments': [{ domain: ['payment-exception.test'] }],
    'scki-fused-004-ai': [{ domain: ['origin-tracker.githubusercontent.com'] }],
    // The fused ad asset mixes query names and IP CIDRs in one headless rule.
    // Issue #187 keeps dldir1.qq.com out of the advertisement group.
    'scki-fused-010-ad': [{
      domain: ['ad-foreign.test', 'ad-domestic.test', 'private.test', 'dldir2.qq.com',
        'exception.domestic.test', 'intl-exception.test', 'payment-exception.test', 'origin-tracker.githubusercontent.com'],
      ip_cidr: ['203.0.113.0/24']
    }]
  };
  // Carry the actual DNS rules, order, strategy and final server into the
  // fixture. Only server transports and rule-set contents are isolated.
  return {
    log: { level: 'debug', disabled: false },
    dns: {
      ...dns,
      servers: Object.entries(upstreamPorts).map(([tag, server_port]) => ({
        type: 'udp', tag, server: loopback, server_port
      }))
    },
    inbounds: [{ type: 'direct', tag: 'dns-fixture', listen: loopback, listen_port: port, network: 'udp' }],
    outbounds: [{ type: 'direct', tag: 'fixture-direct' }],
    route: {
      default_domain_resolver: route.default_domain_resolver,
      rules: [{ inbound: 'dns-fixture', action: 'hijack-dns' }],
      rule_set: Object.entries(ruleSets).map(([tag, rules]) => ({ type: 'inline', tag, rules }))
    }
  };
}

const profiles = [
  ['1.13', 'SING_BOX_113_BIN', 'SingBox(sing-box)-1.13.json'],
  ['1.14', 'SING_BOX_114_BIN', 'SingBox(sing-box)-full.json']
];

for (const [line, envName, filename] of profiles) {
  test(`official sing-box ${line} routes generated-profile DNS through the expected upstreams`, {
    skip: !Object.hasOwn(process.env, envName) && `set ${envName} to an official kernel binary`,
    timeout: 20000
  }, async t => {
    const binary = path.resolve(process.env[envName]);
    const env = { ...process.env, NO_COLOR: '1' };
    for (const key of Object.keys(env)) {
      if (key.startsWith('ENABLE_DEPRECATED_')) delete env[key];
    }
    const version = spawnSync(binary, ['version'], { env, encoding: 'utf8', timeout: 5000, windowsHide: true });
    if (version.error) throw version.error;
    assert.equal(version.status, 0, version.stderr);
    assert.match(version.stdout, new RegExp(`^sing-box version ${line.replace('.', '\\.')}\\.`));

    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-singbox-dns-'));
    const configFile = path.join(home, 'dns-fixture.json');
    const sockets = [];
    let child;
    let logs = '';
    t.after(async () => {
      try {
        if (child && child.exitCode === null && child.signalCode === null) {
          const exited = once(child, 'exit', { signal: AbortSignal.timeout(5000) });
          child.kill();
          await exited;
        }
      } finally {
        for (const socket of sockets) socket.close();
        fs.rmSync(configFile, { force: true });
        fs.rmdirSync(home);
      }
    });

    const direct = await bindUdp();
    sockets.push(direct);
    const proxy = await bindUdp();
    sockets.push(proxy);
    const client = await bindUdp();
    sockets.push(client);
    const hits = [];
    replyToQueries(direct, 'direct', { 'ip-domestic.test': directDomestic, 'ad-domestic.test': directDomestic }, hits);
    replyToQueries(proxy, 'proxy', {
      'foreign.test': proxyAnswer,
      'origin-tracker.githubusercontent.com': proxyAnswer,
      'intl-exception.test': proxyAnswer,
      'payment-exception.test': proxyAnswer
    }, hits);

    const reservation = await bindUdp();
    const port = reservation.address().port;
    try {
      fs.writeFileSync(configFile, JSON.stringify(makeConfig(path.join(profileDirectory, filename), port, {
        dns_direct: direct.address().port,
        dns_proxy: proxy.address().port
      })));
    } finally {
      await new Promise(resolve => reservation.close(resolve));
    }
    child = spawn(binary, ['run', '-c', configFile], { cwd: home, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let spawnError;
    child.on('error', error => { spawnError = error; });
    child.stdout.on('data', data => { logs += data.toString(); });
    child.stderr.on('data', data => { logs += data.toString(); });
    try {
      const listenMessage = `udp server started at ${loopback}:${port}`;
      const deadline = Date.now() + 5000;
      while (!logs.includes(listenMessage) && !spawnError && child.exitCode === null && Date.now() < deadline) {
        await delay(25);
      }
      assert.ifError(spawnError);
      assert.ok(logs.includes(listenMessage), 'Own sing-box fixture did not bind its UDP port');

      async function probe(name, id, expected) {
        const response = once(client, 'message', { signal: AbortSignal.timeout(3000) });
        client.send(dnsQuery(name, id), port, loopback);
        const [packet, sender] = await response;
        assert.equal(sender.port, port);
        assert.equal(packet.readUInt16BE(0), id, name);
        const rcode = packet[3] & 0x0f;
        const count = packet.readUInt16BE(6);
        const address = count === 1 ? Array.from(packet.subarray(-4)).join('.') : null;
        const actual = {
          rcode, count, address,
          upstreams: hits.filter(hit => hit.name === name).map(hit => hit.tag)
        };
        assert.deepEqual(actual, expected, name);
      }

      const directName = { rcode: 0, count: 1, address: directForeign, upstreams: ['direct'] };
      const directIp = { rcode: 0, count: 1, address: directDomestic, upstreams: ['direct'] };
      const fallback = { rcode: 0, count: 1, address: proxyAnswer, upstreams: ['direct', 'proxy'] };
      const blocked = { rcode: 5, count: 0, address: null, upstreams: [] };
      const probes = [
        ['private.test', directName],
        ['child.domestic.test', directName],
        ['ip-domestic.test', directIp],
        ['foreign.test', fallback],
        ['ad-foreign.test', blocked],
        ['ad-domestic.test', blocked],
        ['dldir1.qq.com', directName],
        ['dldir2.qq.com', blocked],
        ['exception.domestic.test', directName],
        ['origin-tracker.githubusercontent.com', fallback],
        ['intl-exception.test', fallback],
        ['payment-exception.test', fallback]
      ];
      for (const [index, [name, expected]] of probes.entries()) await probe(name, index + 1, expected);
    } catch (error) {
      t.diagnostic(logs);
      throw error;
    }
  });
}
