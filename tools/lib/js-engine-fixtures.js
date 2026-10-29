'use strict';

const { clientDirectory } = require('./client-layout');

// Keep engine inputs small; the existing validate-js-overwrites.js retains the
// full policy/classification regressions. Both use the existing VM driver model.
const TARGETS = [
  { id: 'smart', file: `${clientDirectory('Clash Party')}/ClashParty(mihomo-smart).js` },
  { id: 'normal', file: `${clientDirectory('Clash Party')}/ClashParty(mihomo).js` },
  { id: 'flclash', file: `${clientDirectory('FlClash')}/FlClash(mihomo).js` },
];

function proxy(name, extra = {}) {
  return { name, type: 'trojan', server: 'node.fixture.test', port: 443, password: 'engine-fixture', ...extra };
}

function subscription(proxies) {
  return {
    proxies,
    'proxy-groups': [{ name: 'old-selection', type: 'select', proxies: [proxies[0].name] }],
    rules: ['MATCH,old-selection'],
    'rule-providers': { old: { type: 'http', behavior: 'domain', url: 'https://example.invalid/old.yaml' } },
    dns: {
      'fake-ip-filter-mode': 'rule',
      'fake-ip-filter': ['rule-set:old', '+.fixture.local'],
      'proxy-server-nameserver-policy': { 'node.fixture.test': ['10.0.0.53'] },
    },
    hosts: { 'node.fixture.test': '192.0.2.3' },
    tun: { 'exclude-process': [] },
  };
}

function scenarios() {
  const normal = {
    id: 'normal-subscription',
    config: subscription([
      proxy('HK IEPL x1'), proxy('US Home x3'), proxy('JP Tokyo x0.2'),
      proxy('SG Singapore'), proxy('剩余流量 10G'),
    ]),
    expectedNames: ['HK IEPL x1', 'US Home x3', 'JP Tokyo x0.2', 'SG Singapore'],
  };
  const chain = {
    id: 'valid-dialer-chain',
    config: subscription([
      { name: 'HK Interface', type: 'direct', 'interface-name': 'eth0' },
      proxy('JP Transit x1', { 'dialer-proxy': 'HK Interface' }),
      proxy('US Exit x1', { 'dialer-proxy': 'JP Transit x1' }),
    ]),
    expectedNames: ['HK Interface', 'JP Transit x1', 'US Exit x1'],
  };
  const rates = {
    id: 'multiplier-boundary',
    options: { maxMultiplier: 0.5 },
    config: subscription([
      proxy('HK 0.5x'), proxy('JP 0.59x'), proxy('US x0.2'), proxy('SG 倍率2'),
      proxy('DE x?'), proxy('TW plain'), proxy('HK 0.2x x0.5'),
    ]),
    expectedNames: ['HK 0.5x', 'US x0.2', 'DE x?', 'TW plain', 'HK 0.2x x0.5'],
  };
  const filteredChain = {
    id: 'filtered-dialer-rejected', options: { maxMultiplier: 0.5 }, unchanged: true,
    config: subscription([proxy('HK Dependent x0.5', { 'dialer-proxy': 'US x3' }), proxy('US x3')]),
  };
  const cycle = {
    id: 'dialer-cycle-rejected', unchanged: true,
    config: subscription([proxy('HK A', { 'dialer-proxy': 'US B' }), proxy('US B', { 'dialer-proxy': 'HK A' })]),
  };
  const inline = {
    id: 'mixed-inline-provider',
    config: { ...subscription([proxy('US Exit', { 'dialer-proxy': 'HK Inline' })]),
      'proxy-providers': { local: { type: 'inline', payload: [proxy('HK Inline'), proxy('JP x3')] } } },
    expectedNames: ['US Exit', 'HK Inline', 'JP x3'],
  };
  const remote = {
    id: 'remote-provider-rejected', unchanged: true,
    config: { ...subscription([proxy('HK Explicit')]),
      'proxy-providers': { remote: { type: 'http', url: 'https://example.invalid/subscription' } } },
  };
  return [normal, chain, rates, filteredChain, cycle, inline, remote];
}

module.exports = { TARGETS, proxy, subscription, scenarios };
