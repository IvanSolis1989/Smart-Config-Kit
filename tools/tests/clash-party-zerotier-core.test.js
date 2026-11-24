'use strict';

// Native, offline acceptance: only this test's core, temporary home and loopback
// SOCKS peers are used. No production controller/config/cache or system proxy.
// Core contracts: https://wiki.metacubex.one/config/general/#缓存
// https://wiki.metacubex.one/config/proxies/built-in/#pass
// https://github.com/MetaCubeX/mihomo/blob/v1.19.29/hub/route/proxies.go
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const net = require('node:net');
const dgram = require('node:dgram');
const http = require('node:http');
const { once } = require('node:events');
const { spawn, spawnSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const graph = require('../../rulesets/source/routing-graph');

const root = path.resolve(__dirname, '../..');
const policy = graph.getClashPartyZeroTierPlanetProxyPolicy();
const roots = ['103.195.103.66', '79.127.159.187', '84.17.53.155', '185.152.67.145'];
const candidates = process.platform === 'win32' ? [
  '.cache/mihomo-mrs/mihomo-v1.19.29.exe',
  '.cache/mihomo/unzip/mihomo-windows-amd64-compatible.exe',
] : [];
const explicitBinary = Object.hasOwn(process.env, 'MIHOMO_BIN');
const binary = explicitBinary ? process.env.MIHOMO_BIN : candidates.map(file => path.join(root, file)).find(file => fs.existsSync(file));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const plain = value => JSON.parse(JSON.stringify(value));
const fallbackName = 'Original route';

function socksAddress(host, port) {
  assert.equal(net.isIP(host), 4, 'The fixture accepts literal IPv4 only; DNS is never needed');
  const result = Buffer.from([1, ...host.split('.').map(Number), 0, 0]);
  result.writeUInt16BE(port, 5);
  return result;
}

function readAddress(buffer, offset) {
  const type = buffer[offset];
  const length = type === 1 ? 7 : type === 3 && buffer.length > offset + 1 ? buffer[offset + 1] + 4 : 0;
  assert.ok(length, `Unexpected SOCKS address type ${type}`);
  if (buffer.length < offset + length) return null;
  const host = type === 1 ? [...buffer.subarray(offset + 1, offset + 5)].join('.') : buffer.toString('utf8', offset + 2, offset + length - 2);
  return { host, port: buffer.readUInt16BE(offset + length - 2), end: offset + length };
}

async function localPeer(name) {
  const udp = dgram.createSocket('udp4');
  await new Promise((resolve, reject) => { udp.once('error', reject); udp.bind(0, '127.0.0.1', resolve); });
  const records = [];
  const errors = [];
  const sockets = new Set();
  udp.on('message', (packet, sender) => {
    try {
      assert.deepEqual([...packet.subarray(0, 3)], [0, 0, 0]);
      const destination = readAddress(packet, 3);
      assert.ok(destination);
      records.push({ network: 'UDP', host: destination.host, port: destination.port, token: packet.toString('utf8', destination.end) });
      // Echo the SOCKS datagram without opening any socket to its destination.
      udp.send(packet, sender.port, sender.address);
    } catch (error) { errors.push(error); }
  });
  const tcp = net.createServer(socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    // Reload/termination resets this core's idle UDP-association TCP streams on
    // Windows. A premature reset still fails the client's required echo/read.
    socket.on('error', error => { if (error.code !== 'ECONNRESET') errors.push(error); });
    let buffered = Buffer.alloc(0);
    let state = 'greeting';
    let destination;
    let streamRecord;
    socket.on('data', bytes => {
      try {
        buffered = Buffer.concat([buffered, bytes]);
        if (state === 'greeting') {
          if (buffered.length < 2 || buffered.length < 2 + buffered[1]) return;
          assert.equal(buffered[0], 5);
          buffered = buffered.subarray(2 + buffered[1]);
          socket.write(Buffer.from([5, 0]));
          state = 'request';
        }
        if (state === 'request') {
          if (buffered.length < 5) return;
          destination = readAddress(buffered, 3);
          if (!destination) return;
          const command = buffered[1];
          assert.ok(command === 1 || command === 3);
          buffered = buffered.subarray(destination.end);
          socket.write(Buffer.concat([Buffer.from([5, 0, 0]), socksAddress('127.0.0.1', command === 3 ? udp.address().port : tcp.address().port)]));
          state = command === 1 ? 'stream' : 'association';
        }
        if (state === 'stream' && buffered.length) {
          if (!streamRecord) {
            streamRecord = { network: 'TCP', host: destination.host, port: destination.port, token: '' };
            records.push(streamRecord);
          }
          streamRecord.token += buffered.toString('utf8');
          socket.write(buffered);
          buffered = Buffer.alloc(0);
        }
      } catch (error) { errors.push(error); socket.destroy(); }
    });
  });
  await new Promise((resolve, reject) => { tcp.once('error', reject); tcp.listen(0, '127.0.0.1', resolve); });
  return {
    name, records, errors,
    proxy: { name, type: 'socks5', server: '127.0.0.1', port: tcp.address().port, udp: true },
    async close() {
      for (const socket of sockets) socket.destroy();
      await Promise.all([new Promise(resolve => tcp.close(resolve)), new Promise(resolve => udp.close(resolve))]);
    },
  };
}

// Buffered reads tolerate TCP fragmentation in both native-core SOCKS handshakes.
function reader(socket) {
  let buffered = Buffer.alloc(0);
  let pending = null;
  let failure;
  function flush() {
    if (!pending) return;
    if (failure) { const next = pending; pending = null; next.reject(failure); }
    else if (buffered.length >= pending.length) {
      const next = pending; pending = null;
      const result = buffered.subarray(0, next.length); buffered = buffered.subarray(next.length);
      next.resolve(result);
    }
  }
  socket.on('data', bytes => { buffered = Buffer.concat([buffered, bytes]); flush(); });
  socket.on('error', error => { failure = error; flush(); });
  socket.on('end', () => { failure = new Error('SOCKS stream ended before the requested bytes'); flush(); });
  return length => new Promise((resolve, reject) => { assert.equal(pending, null); pending = { length, resolve, reject }; flush(); });
}

async function openSocks(port, command, host, destinationPort) {
  const socket = net.createConnection({ host: '127.0.0.1', port });
  socket.setTimeout(5000, () => socket.destroy(new Error('Loopback SOCKS timeout')));
  const read = reader(socket);
  try {
    await once(socket, 'connect');
    socket.write(Buffer.from([5, 1, 0]));
    assert.deepEqual([...(await read(2))], [5, 0]);
    socket.write(Buffer.concat([Buffer.from([5, command, 0]), socksAddress(host, destinationPort)]));
    const header = await read(4);
    assert.deepEqual([...header.subarray(0, 3)], [5, 0, 0]);
    assert.equal(header[3], 1, 'This test only accepts an IPv4 loopback relay');
    const address = await read(6);
    const relayHost = [...address.subarray(0, 4)].join('.');
    assert.ok(relayHost === '127.0.0.1' || relayHost === '0.0.0.0');
    return { socket, read, relayPort: address.readUInt16BE(4) };
  } catch (error) { socket.destroy(); throw error; }
}

async function sendProbe(socksPort, network, host, port) {
  const token = randomUUID();
  const connection = await openSocks(socksPort, network === 'UDP' ? 3 : 1, network === 'UDP' ? '0.0.0.0' : host, network === 'UDP' ? 0 : port);
  try {
    if (network === 'TCP') {
      connection.socket.write(token);
      assert.equal((await connection.read(Buffer.byteLength(token))).toString(), token);
    } else {
      const udp = dgram.createSocket('udp4');
      try {
        await new Promise((resolve, reject) => { udp.once('error', reject); udp.bind(0, '127.0.0.1', resolve); });
        const response = once(udp, 'message', { signal: AbortSignal.timeout(5000) });
        udp.send(Buffer.concat([Buffer.from([0, 0, 0]), socksAddress(host, port), Buffer.from(token)]), connection.relayPort, '127.0.0.1');
        const [packet] = await response;
        const address = readAddress(packet, 3);
        assert.equal(address.host, host); assert.equal(address.port, port);
        assert.equal(packet.toString('utf8', address.end), token);
      } finally { udp.close(); }
    }
  } finally { connection.socket.destroy(); }
  return token;
}

async function unusedPort(udpToo = false) {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  let udp;
  try {
    if (udpToo) {
      udp = dgram.createSocket('udp4');
      await new Promise((resolve, reject) => { udp.once('error', reject); udp.bind(port, '127.0.0.1', resolve); });
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (udp) await new Promise(resolve => udp.close(resolve));
  }
  return port;
}

function api(port, secret, method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const request = http.request({ host: '127.0.0.1', port, path: endpoint, method,
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' } }, response => {
      let text = '';
      response.setEncoding('utf8'); response.on('data', bytes => { text += bytes; });
      response.on('end', () => response.statusCode >= 200 && response.statusCode < 300
        ? resolve(text ? JSON.parse(text) : null) : reject(new Error(`${method} ${endpoint}: ${response.statusCode} ${text}`)));
    });
    request.setTimeout(1000, () => request.destroy(new Error('Test controller timeout')));
    request.on('error', reject); request.end(body === undefined ? undefined : JSON.stringify(body));
  });
}

function adapterPolicy(file, proxies, legacyDefault) {
  let source = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(source, /const SCKI_ZEROTIER_PLANET_PROXY = false\b/);
  if (legacyDefault) source = source.replace('const SCKI_ZEROTIER_PLANET_PROXY = false', 'const SCKI_ZEROTIER_PLANET_PROXY = true');
  const messages = [];
  const context = { console: { log: (...args) => messages.push(args.join(' ')), error: (...args) => messages.push(args.join(' ')) } };
  vm.createContext(context);
  vm.runInContext(source + '\nthis.run = main;', context, { filename: file, timeout: 15000 });
  const result = plain(context.run({ proxies: structuredClone(proxies), rules: [], 'proxy-groups': [] }));
  const selector = result['proxy-groups'].find(group => group.name === policy.groupName);
  assert.ok(selector, messages.join('\n'));
  assert.equal(result.profile['store-selected'], true);
  assert.deepEqual(result.rules.filter(rule => rule.endsWith(',' + policy.groupName)), policy.rules);
  return { selector, profile: result.profile };
}

for (const file of ['Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js', 'Mihomo内核系/Clash Party/ClashParty(mihomo).js']) {
  test(`${path.basename(file)}: native core preserves the device selector and exact offline UDP routing`, {
    skip: !explicitBinary && !binary && 'No cached native Mihomo; set MIHOMO_BIN (no download is performed)', timeout: 60000,
  }, async t => {
    assert.ok(binary && fs.existsSync(binary) && fs.statSync(binary).isFile(), `MIHOMO_BIN points to a missing or non-file executable: ${binary}`);
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-zerotier-core-'));
    const configFile = path.join(home, 'config.json');
    const peers = [];
    let child;
    let log = '';
    async function stop() {
      if (!child || child.exitCode !== null || child.signalCode !== null) return;
      const current = child;
      const exited = once(current, 'exit'); current.kill();
      let timer;
      try {
        await Promise.race([exited, new Promise((resolve, reject) => {
          timer = setTimeout(() => { current.kill('SIGKILL'); reject(new Error('Own test core did not terminate')); }, 5000);
        })]);
      } finally { clearTimeout(timer); }
      child = null;
    }
    t.after(async () => {
      try { await stop(); }
      finally {
        for (const peer of peers) await peer.close();
        assert.equal(path.dirname(path.resolve(home)), path.resolve(os.tmpdir()));
        assert.ok(path.basename(home).startsWith('scki-zerotier-core-'));
        fs.rmSync(home, { recursive: true, force: true });
      }
    });
    const version = spawnSync(binary, ['-d', home, '-v'], { cwd: home, encoding: 'utf8', windowsHide: true, timeout: 5000 });
    assert.equal(version.status, 0, version.stderr || String(version.error));
    assert.match(version.stdout, /Mihomo/i); t.diagnostic(version.stdout.trim());
    peers.push(await localPeer('US Evidence Node'), await localPeer('HK Evidence Node'), await localPeer('JP Evidence Node'));
    const [us, original, alternate] = peers;
    const controllerPort = await unusedPort();
    let socksPort = await unusedPort(true);
    while (socksPort === controllerPort) socksPort = await unusedPort(true);
    const secret = randomUUID();
    const request = (method, endpoint, body) => api(controllerPort, secret, method, endpoint, body);
    const select = (group, name) => request('PUT', '/proxies/' + encodeURIComponent(group), { name });
    const selected = async group => (await request('GET', '/proxies/' + encodeURIComponent(group))).now;
    function writeConfig(legacyDefault = false, missingUS = false) {
      const generated = adapterPolicy(file, missingUS ? [original.proxy] : [us.proxy, original.proxy], legacyDefault);
      assert.deepEqual(generated.selector.proxies, missingUS ? ['PASS'] : legacyDefault ? [policy.targetGroup, 'PASS'] : ['PASS', policy.targetGroup]);
      const groups = [generated.selector, { name: fallbackName, type: 'select', proxies: [original.name, alternate.name] }];
      if (!missingUS) groups.push({ name: policy.targetGroup, type: 'select', proxies: [us.name] });
      const config = {
        'allow-lan': false, 'bind-address': '127.0.0.1', 'socks-port': socksPort,
        'external-controller': `127.0.0.1:${controllerPort}`, secret, mode: 'rule', 'log-level': 'info',
        ipv6: false, 'find-process-mode': 'off', 'geo-auto-update': false,
        tun: { enable: false, 'auto-route': false, 'auto-detect-interface': false },
        dns: { enable: false }, ntp: { enable: false }, profile: generated.profile,
        proxies: peers.map(peer => peer.proxy), 'proxy-groups': groups,
        rules: [...policy.rules, `MATCH,${fallbackName}`],
      };
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
      return config;
    }
    async function start() {
      log = '';
      child = spawn(binary, ['-d', home, '-f', configFile], { cwd: home, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      let spawnError;
      child.on('error', error => { spawnError = error; });
      for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { log = (log + bytes.toString()).slice(-16000); });
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        if (spawnError || child.exitCode !== null) throw new Error(`Test core failed: ${spawnError || child.exitCode}\n${log}`);
        // Confirm ownership from this child's successful bind before contacting
        // a port. A race with an existing listener must never query that client.
        if (!log.includes(`RESTful API listening at: 127.0.0.1:${controllerPort}`) ||
            !log.includes(`SOCKS proxy listening at: 127.0.0.1:${socksPort}`)) { await wait(50); continue; }
        try { await request('GET', '/version'); return; } catch { await wait(50); }
      }
      throw new Error(`Own test controller did not become ready\n${log}`);
    }
    async function assertState(expected, other = original.name) {
      assert.equal(await selected(policy.groupName), expected);
      assert.equal(await selected(fallbackName), other, 'Unrelated selector choice must survive');
      const config = await request('GET', '/configs');
      assert.equal(config.tun.enable, false);
      assert.equal(config['allow-lan'], false);
      assert.equal(config['socks-port'], socksPort);
      const rules = (await request('GET', '/rules')).rules;
      assert.equal(rules.length, 5, 'Reloads must not duplicate the four rules');
      assert.deepEqual(rules.slice(0, 4).map(rule => rule.proxy), Array(4).fill(policy.groupName));
      assert.equal(rules[4].proxy, fallbackName);
    }
    async function reload(legacyDefault, missingUS, expected, other) {
      writeConfig(legacyDefault, missingUS);
      await request('PUT', '/configs?force=true', { path: configFile });
      await assertState(expected, other);
    }
    let probes = 0;
    async function probe(network, host, port, expectedPeer) {
      const token = await sendProbe(socksPort, network, host, port);
      const received = peers.flatMap(peer => peer.records.filter(record => record.token === token).map(record => ({ peer: peer.name, ...record })));
      assert.deepEqual(received, [{ peer: expectedPeer.name, network, host, port, token }]);
      for (const peer of peers) assert.deepEqual(peer.errors, []);
      probes++;
    }
    try {
      writeConfig(false, false); await start(); await assertState('PASS');
      for (const address of roots) await probe('UDP', address, 9993, original);
      // A first-choice legacy default is not itself an explicit API cache write.
      await reload(true, false, policy.targetGroup);
      await reload(false, false, 'PASS');
      await select(fallbackName, alternate.name);
      await select(policy.groupName, policy.targetGroup);
      await assertState(policy.targetGroup, alternate.name);
      for (const address of roots) {
        await probe('UDP', address, 9993, us);
        await probe('TCP', address, 9993, alternate);
        await probe('UDP', address, 9994, alternate);
      }
      await probe('UDP', '103.195.103.67', 9993, alternate);
      assert.ok(fs.statSync(path.join(home, 'cache.db')).size > 0, 'The explicit API choice must create the isolated cache');
      await reload(false, false, policy.targetGroup, alternate.name);
      await stop(); await start(); await assertState(policy.targetGroup, alternate.name);
      await probe('UDP', roots[0], 9993, us);
      await reload(false, true, 'PASS', alternate.name);
      for (const address of roots) await probe('UDP', address, 9993, alternate);
      await reload(false, false, policy.targetGroup, alternate.name);
      await probe('UDP', roots[0], 9993, us);
      await select(policy.groupName, 'PASS');
      await reload(true, false, 'PASS', alternate.name);
      await stop(); await start(); await assertState('PASS', alternate.name);
      for (const address of roots) await probe('UDP', address, 9993, alternate);
      t.diagnostic(`${probes} native TCP/UDP echo probes; PASS fallthrough, exact roots/port/network, API cache, reload/restart, missing-US recovery and unrelated selector preserved; TUN disabled throughout.`);
    } catch (error) {
      error.message += `\nOwn isolated Mihomo log:\n${log}`;
      throw error;
    }
  });
}
