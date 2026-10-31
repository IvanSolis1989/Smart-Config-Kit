'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

// The lazy import lets the first test describe the missing public contract.
const build = (...args) => require('../lib/meow-native-profile').buildNativeProfile(...args);

function fixture() {
  return {
    'mixed-port': 7890, 'allow-lan': true, 'bind-address': '*', mode: 'rule',
    'log-level': 'info', ipv6: false, 'unified-delay': true, 'tcp-concurrent': true,
    'find-process-mode': 'strict', 'geodata-mode': true,
    'geo-auto-update': true, 'geo-update-interval': 24,
    'geox-url': { mmdb: 'https://assets.example/Country.mmdb', asn: 'https://assets.example/ASN.mmdb', geosite: 'https://assets.example/geosite.dat', geoip: 'https://assets.example/geoip.dat' },
    hosts: { 'dns.example': ['192.0.2.53'] },
    profile: { 'store-selected': true, 'store-fake-ip': true },
    tun: { enable: true }, 'external-controller': '0.0.0.0:9090',
    sniffer: { enable: true, sniff: { QUIC: { ports: [443] } } },
    dns: {
      enable: true, listen: '0.0.0.0:53', ipv6: false, 'enhanced-mode': 'fake-ip',
      'fake-ip-range': '198.18.0.1/16', 'fake-ip-filter-mode': 'blacklist',
      'fake-ip-filter': ['+.lan'], 'use-hosts': true, 'use-system-hosts': false,
      nameserver: ['https://dns.example/dns-query'], 'default-nameserver': ['192.0.2.53'],
      'proxy-server-nameserver': ['https://192.0.2.53/dns-query'],
      'nameserver-policy': { 'geosite:cn': ['https://dns.example/dns-query'] },
      fallback: ['https://192.0.2.54/dns-query'],
      'fallback-filter': { geoip: true, 'geoip-code': 'CN', geosite: ['gfw'], ipcidr: ['240.0.0.0/4'], domain: ['+.example'] },
      'respect-rules': true, 'prefer-h3': true, 'cache-algorithm': 'arc', 'direct-nameserver': ['192.0.2.53'],
    },
    'proxy-providers': {
      Subscribe: { type: 'http', url: 'https://private.example/token', interval: 86400,
        path: './proxy_providers/subscribe.yaml', 'exclude-filter': '(?i)(剩余|\\bLogin\\b)',
        'health-check': { enable: true, url: 'https://www.gstatic.com/generate_204', interval: 300, lazy: true } },
    },
    'proxy-groups': [
      { name: '🇯🇵 日韩节点', type: 'url-test', use: ['Subscribe'], filter: '(?i)(JPN|KOR|(^|[^a-zA-Z])KR([^a-zA-Z]|$))',
        'exclude-type': 'direct|reject', 'empty-fallback': 'REJECT', interval: 300, tolerance: 10, lazy: true,
        url: 'https://www.gstatic.com/generate_204', uselightgbm: true },
      { name: '🏡 日韩家宽', type: 'url-test', use: ['Subscribe'], filter: '(?i)((JPN|KOR).*(家宽|住宅)|(家宽|住宅).*(JPN|KOR))', 'empty-fallback': 'REJECT' },
      { name: '🤖 AI 服务', type: 'select', proxies: ['🏡 日韩家宽', '🇯🇵 日韩节点', 'DIRECT'] },
    ],
    'rule-providers': { stale: { type: 'inline' } }, rules: ['MATCH,DIRECT'],
  };
}

const routing = () => ({
  providers: { fused: { type: 'http', behavior: 'domain', format: 'mrs', url: 'https://assets.example/fused.mrs', path: './rules/fused.mrs', interval: 86400, proxy: '🤖 AI 服务', header: { Accept: ['*/*'] } } },
  rules: ['RULE-SET,fused,🤖 AI 服务', 'MATCH,🤖 AI 服务'], business: { AI: '🤖 AI 服务' },
});

test('native projection preserves routing authority and detaches both inputs', () => {
  const cmfa = fixture();
  const input = routing();
  const before = structuredClone({ cmfa, input });
  const result = build(cmfa, input);
  assert.deepEqual(result['rule-providers'], input.providers);
  assert.deepEqual(result.rules, input.rules);
  assert.deepEqual(result['proxy-groups'].map(group => group.name), cmfa['proxy-groups'].map(group => group.name));
  result['rule-providers'].fused.header.Accept.push('changed');
  result.rules.push('MATCH,DIRECT');
  result['proxy-groups'][2].proxies.push('REJECT');
  result.hosts['dns.example'].push('192.0.2.1');
  assert.deepEqual({ cmfa, input }, before);
});

test('native regional groups retain filters and fail closed with a static REJECT sentinel', () => {
  const cmfa = fixture();
  const groups = build(cmfa, routing())['proxy-groups'];
  for (const group of groups.slice(0, 2)) {
    assert.deepEqual(group.proxies, ['REJECT']);
    assert.deepEqual(group.use, ['Subscribe']);
    assert.deepEqual(group['exclude-type'], ['direct', 'reject']);
    assert.equal(group.filter, cmfa['proxy-groups'].find(source => source.name === group.name).filter);
    assert.equal(Object.hasOwn(group, 'empty-fallback'), false);
    assert.equal(Object.hasOwn(group, 'uselightgbm'), false);
  }
  assert.deepEqual(groups[2].proxies, ['🏡 日韩家宽', '🇯🇵 日韩节点', 'DIRECT']);
});

test('native profile scopes listeners locally and projects only supported DNS and geodata fields', () => {
  const cmfa = fixture();
  const result = build(cmfa, routing());
  assert.equal(result['bind-address'], '127.0.0.1');
  assert.equal(result['allow-lan'], false);
  assert.equal(result.dns.listen, '127.0.0.1:1053');
  assert.equal(result['mixed-port'], 7890);
  assert.equal(result.strict, true);
  for (const key of ['tun', 'external-controller', 'profile', 'sniffer', 'unified-delay', 'tcp-concurrent', 'find-process-mode', 'geox-url', 'geodata-mode']) assert.equal(Object.hasOwn(result, key), false, key);
  for (const key of ['ipv6', 'respect-rules', 'prefer-h3', 'cache-algorithm', 'direct-nameserver']) assert.equal(Object.hasOwn(result.dns, key), false, key);
  assert.deepEqual(result.dns['nameserver-policy'], cmfa.dns['nameserver-policy']);
  assert.deepEqual(result.dns['fake-ip-filter'], ['+.lan']);
  assert.equal(result.dns['store-fake-ip'], true);
  assert.deepEqual(result.dns['fallback-filter'], { geoip: true, 'geoip-code': 'CN', ipcidr: ['240.0.0.0/4'], domain: ['+.example'] });
  assert.deepEqual(result.geodata, { 'auto-update': true, 'auto-update-interval': 24, url: { mmdb: 'https://assets.example/Country.mmdb', asn: 'https://assets.example/ASN.mmdb', geosite: 'https://assets.example/geosite.dat' } });
  const subscription = result['proxy-providers'].Subscribe;
  assert.equal(new URL(subscription.url).hostname, 'example.invalid');
  assert.deepEqual(subscription['health-check'], cmfa['proxy-providers'].Subscribe['health-check']);
  assert.equal(subscription['exclude-filter'], cmfa['proxy-providers'].Subscribe['exclude-filter']);
});

test('native projection refuses unsupported group types and missing subscription edges', () => {
  const cmfa = fixture();
  cmfa['proxy-groups'][0].type = 'smart';
  assert.throws(() => build(cmfa, routing()), /unsupported.*smart/i);
  cmfa['proxy-groups'][0].type = 'url-test';
  cmfa['proxy-groups'][0].use = ['Missing'];
  assert.throws(() => build(cmfa, routing()), /unknown.*provider.*Missing/i);
});
