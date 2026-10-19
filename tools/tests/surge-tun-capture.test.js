'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { parseCidr } = require('../lib/fused-rule-optimizer');
const { applyMobileTrafficOptions } = require('../build-fused-rule-sets');

const source = fs.readFileSync(path.resolve(__dirname, '../../Surge/Surge.conf'), 'utf8');

function assertFakeIpCaptured(config) {
  const general = config.split(/^\s*\[General\]\s*$/mi)[1]?.split(/^\s*\[/m)[0];
  assert.ok(general, 'Surge [General] section is required');
  // Check the entire reserved block, including the DNS responders at .0.2-.0.9.
  const poolStart = parseCidr('198.18.0.0/32').network;
  const poolEnd = parseCidr('198.19.255.255/32').network;
  for (const line of general.split(/\r?\n/)) {
    const value = /^\s*tun-excluded-routes\s*=\s*([^#\r\n]*)/i.exec(line)?.[1];
    if (!value) continue;
    for (const entry of value.split(',').map(value => value.trim()).filter(Boolean)) {
      const route = parseCidr(entry);
      if (route.family !== 4) continue;
      const end = route.network + (1n << BigInt(32 - route.prefix)) - 1n;
      assert.ok(end < poolStart || route.network > poolEnd,
        `${entry} bypasses Surge's Fake IP pool or DNS responder before VIF capture`);
    }
  }
}

test('Surge keeps its entire Fake IP pool and DNS responders inside VIF capture (issue #190)', () => {
  assertFakeIpCaptured(source);
});

test('Surge traffic option rendering preserves Fake IP capture and LAN bypass routes', () => {
  for (const options of [
    { healthCheckProfile: 'standard', quicPolicy: 'block-foreign' },
    { healthCheckProfile: 'power-save', quicPolicy: 'follow-rules' },
  ]) {
    const rendered = applyMobileTrafficOptions(source, 'surge', options);
    assertFakeIpCaptured(rendered);
    const exclusions = /^tun-excluded-routes\s*=\s*(.+)$/m.exec(rendered)?.[1].trim().split(',');
    for (const cidr of ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '224.0.0.0/4']) {
      assert.ok(exclusions?.includes(cidr), `Preserve existing LAN/multicast bypass ${cidr}`);
    }
  }
});
