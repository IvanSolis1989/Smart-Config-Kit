'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { normalizeMihomoMrsProviderEntries } = require('../../rulesets/source/routing-graph');
const { firstMatch, loadRepository } = require('../lib/ordered-rule-semantics');

const generated = path.resolve(__dirname, '../../rulesets/generated');
const segment = 'scki-fused-033-ai';
const excessiveRule = 'DOMAIN-KEYWORD,copilot';
const knownCopilot = [
  'DOMAIN-SUFFIX,copilot.microsoft.com',
  'DOMAIN-SUFFIX,githubcopilot.com',
];
const dedicatedMicrosoftHosts = ['copilot.cloud.microsoft', 'cr.m365copilotapp.svc.cloud.microsoft'];
const read = relative => fs.readFileSync(path.join(generated, relative), 'utf8');

test('szkane refresh preserves scoped Copilot domains and drops the bare keyword', () => {
  assert.deepEqual(normalizeMihomoMrsProviderEntries('szkane-ai', [
    'domain-keyword, COPILOT', ...knownCopilot, 'DOMAIN-KEYWORD,openai',
  ]), [...knownCopilot, 'DOMAIN-KEYWORD,openai']);
  assert.doesNotMatch(read('mihomo-mrs/szkane-ai-classical.yaml'), /DOMAIN-KEYWORD,copilot"/i);
});

test('the ordered domain projection still routes real Copilot and removes the unintended AI hit', () => {
  const model = loadRepository();
  assert(!model.providers.get(segment + '-residual').entries.includes(excessiveRule));
  for (const host of ['copilot.microsoft.com', 'api.githubcopilot.com', ...dedicatedMicrosoftHosts]) {
    const result = firstMatch(model, { host }, { mode: 'domain-projection' });
    assert.equal(result.status, 'match', host);
    assert.equal(result.policy, '🤖 AI 服务', host);
  }
  const guard = model.providers.get('scki-fused-013-ai-domain');
  for (const host of dedicatedMicrosoftHosts) assert.ok(guard.entries.includes(`DOMAIN,${host}`), host);
  for (const host of ['uncopilotsite.example.org', 'decoy-copilot.example.net', 'nocopilot.example.com']) {
    const result = firstMatch(model, { host }, { mode: 'domain-projection', collectOverlaps: true });
    assert.notEqual(result.policy, '🤖 AI 服务', host);
    assert(!result.unknownBlockers.some(blocker => blocker.entry === excessiveRule), host);
    assert(!result.overlaps.some(match => match.entry === excessiveRule), host);
  }
});

test('portable projections restore Copilot suffixes suppressed by the old keyword', () => {
  for (const platform of ['clash', 'surge', 'quantumultx']) {
    const list = read('fused/' + platform + '/' + segment + '.list').trim().split(/\r?\n/);
    const qx = platform === 'quantumultx';
    assert(!list.includes(qx ? 'host-keyword, copilot' : excessiveRule), platform);
    for (const rule of knownCopilot) {
      assert(list.includes(qx ? rule.replace('DOMAIN-SUFFIX,', 'host-suffix, ') : rule), platform + ': ' + rule);
    }
  }
  const native = JSON.parse(read('fused/sing-box/' + segment + '.json')).rules;
  for (const row of native) assert(!row.domain_keyword?.includes('copilot'));
  for (const rule of knownCopilot) assert(native.some(row => row.domain_suffix?.includes(rule.split(',')[1])));
  const egern = read('egern/provider-' + segment + '-residual.yaml');
  assert(!egern.split(/\r?\n/).includes('  - "copilot"'));
});
