#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const {
  PROFILE_IDS,
  readProfileContract,
  renderJavaScriptProfileRuntime,
  renderRubyProfileRuntime,
  validateProfileContract,
} = require('../lib/subscription-adapter-profiles');

const REPOSITORY_ROOT = path.resolve(__dirname, '..', '..');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('subscription adapter profile contract is closed and renders the same enum for JS and Ruby', () => {
  const contract = readProfileContract(REPOSITORY_ROOT);
  assert.deepEqual(validateProfileContract(contract), []);
  assert.equal(contract.default, 'adaptive');
  assert.deepEqual(PROFILE_IDS, ['off', 'policy', 'adaptive', 'hosts-only']);
  assert.deepEqual(Object.keys(contract.profiles).sort(), [...PROFILE_IDS].sort());

  const js = renderJavaScriptProfileRuntime(contract);
  const ruby = renderRubyProfileRuntime(contract);
  for (const id of PROFILE_IDS) {
    assert.match(js, new RegExp(`"${id}"`));
    assert.match(ruby, new RegExp(`"${id}"`));
  }
  assert.match(js, /SCKI_SUBSCRIPTION_ADAPTER_PROFILE_DEFAULT = "adaptive"/);
  assert.match(ruby, /DEFAULT = "adaptive"\.freeze/);
});

test('unrecognized JS adapter profiles retain adaptive DNS for active node endpoints', () => {
  const contract = readProfileContract(REPOSITORY_ROOT);
  const profileRuntime = renderJavaScriptProfileRuntime(contract);
  const dnsRuntime = fs.readFileSync(path.join(REPOSITORY_ROOT, 'tools/runtime/node-dns-hints.js'), 'utf8');
  const capture = vm.runInNewContext(`${profileRuntime}\n${dnsRuntime}\n;(function (profile) {
    return JSON.stringify(SckiSubscriptionAdapter.captureNodeDns({
      dns: { 'proxy-server-nameserver': ['tls://resolver.example.test'] },
      hosts: { 'resolver.example.test': '192.0.2.21' }
    }, ['node.example.test'], profile));
  })`);

  for (const profile of ['adaptive', 'invalid-profile', 'constructor', 'toString', '__proto__']) {
    const snapshot = JSON.parse(capture(profile));
    assert.equal(snapshot.profile, 'adaptive', profile);
    assert.deepEqual(snapshot.policy, { 'node.example.test': ['tls://resolver.example.test'] }, profile);
    assert.deepEqual(snapshot.hosts, { 'resolver.example.test': ['192.0.2.21'] }, profile);
  }
  assert.deepEqual(JSON.parse(capture('off')).policy, {});
});

test('subscription adapter profile contract rejects routing-affecting expansion', () => {
  const contract = clone(readProfileContract(REPOSITORY_ROOT));
  contract.profiles.adaptive.rules = 'remove';
  contract.invariants.proxy_groups = 'optional';
  const errors = validateProfileContract(contract);
  assert.ok(errors.some((error) => error.includes('profiles.adaptive.rules')));
  assert.ok(errors.some((error) => error.includes('invariants.proxy_groups')));
});

test('hosts-only does not relax the closed contract of existing profiles', () => {
  for (const id of PROFILE_IDS) {
    const contract = clone(readProfileContract(REPOSITORY_ROOT));
    contract.profiles[id].node_dns_projection = id === 'hosts-only' ? 'adaptive' : 'hosts-only';
    assert.ok(validateProfileContract(contract).some(error => error.includes(`profiles.${id}.node_dns_projection`)));
  }
  const contract = clone(readProfileContract(REPOSITORY_ROOT));
  contract.invariants.subscription_may_select_profile = true;
  assert.ok(validateProfileContract(contract).some(error => error.includes('subscription_may_select_profile')));
});
