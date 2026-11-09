#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  canonicalizeEntry,
  materializeGeoIpEntries,
  materializeIpAsnEntries,
  optimizeEntries,
  resolveOpaqueMrsSource,
} = require('../lib/fused-rule-optimizer');

test('opaque MRS source mapping preserves the exact HaGeZi Ultimate identity', () => {
  const source = resolveOpaqueMrsSource(
    'https://fastly.jsdelivr.net/gh/MiHomoer/MiHomo-Hagezi@release/HageziUltimate.mrs',
  );

  assert.deepEqual(source, {
    sourceUrl: 'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/ultimate-onlydomains.txt',
    sourceFilter: 'domain',
    identity: 'hagezi-ultimate',
  });
  assert.equal(resolveOpaqueMrsSource('https://example.com/unknown.mrs'), null);
});

test('classical entries are canonicalized before deduplication', () => {
  assert.equal(canonicalizeEntry(' GEOIP   , us '), 'GEOIP,US');
  assert.equal(canonicalizeEntry('domain-suffix,Example.COM.'), 'DOMAIN-SUFFIX,example.com');
  assert.equal(canonicalizeEntry('IP-CIDR , 192.0.2.7/24'), 'IP-CIDR,192.0.2.0/24');
  assert.equal(canonicalizeEntry('IP-CIDR6,2001:0DB8::1/32'), 'IP-CIDR6,2001:db8::/32');
  assert.equal(canonicalizeEntry('DOMAIN-SUFFIX,example.com,DIRECT'), 'DOMAIN-SUFFIX,example.com');
  assert.equal(canonicalizeEntry('IP-CIDR,192.0.2.7/24,REJECT,no-resolve'), 'IP-CIDR,192.0.2.0/24,no-resolve');
  assert.throws(() => canonicalizeEntry('GEOIP'), /requires a value/);
});

test('same-policy optimization removes exact and safely subsumed rules', () => {
  const result = optimizeEntries([
    'DOMAIN,Api.Example.COM.',
    'DOMAIN-SUFFIX,example.com',
    'DOMAIN-SUFFIX,sub.example.com',
    'DOMAIN,tracker-foo.net',
    'DOMAIN-KEYWORD,tracker',
    'DOMAIN,standalone.test',
    'DOMAIN,STANDALONE.TEST.',
    'IP-CIDR,10.1.1.0/24',
    'IP-CIDR,10.0.0.0/8',
    'IP-CIDR,192.0.2.7/24',
    'GEOIP , us',
  ]);

  assert.deepEqual(result.entries, [
    'DOMAIN-SUFFIX,example.com',
    'DOMAIN-KEYWORD,tracker',
    'DOMAIN,standalone.test',
    'IP-CIDR,10.0.0.0/8',
    'IP-CIDR,192.0.2.0/24',
    'GEOIP,US',
  ]);
  assert.deepEqual(result.stats, {
    input: 11,
    output: 6,
    exactDuplicates: 1,
    domainSubsumed: 3,
    cidrSubsumed: 1,
    normalized: 4,
  });
});

test('GEOIP expansion is target-specific and resolver failures are fatal', async () => {
  const calls = [];
  const materialized = await materializeGeoIpEntries(
    ['DOMAIN,example.com', 'GEOIP,US', 'GEOIP,PRIVATE'],
    async (name) => {
      calls.push(name);
      if (name === 'private') return ['10.0.0.0/8'];
      return ['192.0.2.0/24'];
    },
  );

  assert.deepEqual(calls, ['us', 'private']);
  assert.deepEqual(materialized, [
    'DOMAIN,example.com',
    'IP-CIDR,192.0.2.0/24',
    'IP-CIDR,10.0.0.0/8',
  ]);

  const iosMaterialized = await materializeGeoIpEntries(
    ['GEOIP,US', 'GEOIP,GOOGLE,no-resolve'],
    async () => ['203.0.113.0/24'],
    { preserve: (name) => /^[a-z]{2}$/.test(name) },
  );
  assert.deepEqual(iosMaterialized, ['GEOIP,US', 'IP-CIDR,203.0.113.0/24,no-resolve']);

  await assert.rejects(
    materializeGeoIpEntries(['GEOIP,US'], async () => {
      throw new Error('offline');
    }),
    /offline/,
  );
});

test('IP-ASN expansion is used only by targets without native ASN matching', async () => {
  const native = await materializeIpAsnEntries(
    ['IP-ASN,AS13335,no-resolve'],
    async () => ['198.51.100.0/24'],
    { preserve: true },
  );
  assert.deepEqual(native, ['IP-ASN,13335,no-resolve']);

  const expanded = await materializeIpAsnEntries(
    ['IP-ASN,13335,no-resolve'],
    async (asn) => {
      assert.equal(asn, '13335');
      return ['198.51.100.7/24'];
    },
  );
  assert.deepEqual(expanded, ['IP-CIDR,198.51.100.0/24,no-resolve']);
});

test('anti-AD opaque mapping uses only the official equivalent domain feed', () => {
  for (const host of ['jsdelivr.net', 'fastly.jsdelivr.net', 'cdn.jsdelivr.net']) {
    assert.deepEqual(resolveOpaqueMrsSource(`https://${host}/gh/DustinWin/ruleset_geodata@mihomo-ruleset/ads.mrs`), {
      sourceUrl: 'https://raw.githubusercontent.com/privacy-protection-tools/anti-AD/master/anti-ad-clash.yaml',
      sourceFilter: 'domain', identity: 'anti-ad',
    });
  }
  for (const url of [
    'https://fastly.jsdelivr.net/gh/other/ruleset_geodata@mihomo-ruleset/ads.mrs',
    'https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@other/ads.mrs',
    'https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@mihomo-ruleset/ads-lite.mrs',
    'https://fastly.jsdelivr.net.evil.test/gh/DustinWin/ruleset_geodata@mihomo-ruleset/ads.mrs',
  ]) assert.equal(resolveOpaqueMrsSource(url), null);
});
