'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { normalizeMihomoMrsProviderEntries } = require('../../rulesets/source/routing-graph');
const { firstMatch, loadRepository } = require('../lib/ordered-rule-semantics');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const desktopNames = ['ChatGPT', 'ChatGPT.exe', 'Claude', 'Claude.exe', 'Claude Helper', 'Claude Helper (Renderer)'];
const desktopProcesses = new Set(desktopNames.map(name => name.toLowerCase()));
const isDesktop = value => desktopProcesses.has(value.toLowerCase());
const providers = ['szkane-ai', 'vpsdance-ai-coding'];

test('AI provider normalization drops exact desktop process names, including case variants', () => {
  const names = desktopNames.map(name => `PROCESS-NAME,${name}`);
  const keep = ['DOMAIN-SUFFIX,chatgpt.com', 'DOMAIN-SUFFIX,claude.ai',
    'PROCESS-NAME,cowork-svc.exe', 'PROCESS-NAME,Codex.exe', 'PROCESS-NAME,OtherClaude.exe'];
  for (const provider of providers) {
    assert.deepEqual(normalizeMihomoMrsProviderEntries(provider, [...names, ...names.map(name => name.toLowerCase()), ...keep]), keep, provider);
  }
});

test('no generated AI policy can select a desktop app by its standalone process name', () => {
  const native = 'rulesets/generated';
  const manifest = JSON.parse(read(`${native}/fused/manifest.json`));
  for (const provider of providers) {
    const entries = read(`${native}/mihomo-mrs/${provider}-classical.yaml`);
    for (const row of entries.matchAll(/^\s+- "PROCESS-NAME,([^"]+)"$/gm)) assert.ok(!isDesktop(row[1]), provider + ': ' + row[1]);
  }
  for (const segment of manifest.segments.filter(row => row.policy === '🤖 AI 服务')) {
    const { residual, surge, sing_box: singBox } = segment.files;
    if (residual) {
      for (const row of read(`${native}/fused/mihomo/${residual.file}`).matchAll(/^\s+- "PROCESS-NAME,([^"]+)"$/gm)) {
        assert.ok(!isDesktop(row[1]), `${segment.id}: ${row[1]}`);
      }
    }
    for (const file of surge?.parts || (surge ? [surge.file] : [])) {
      for (const row of read(`${native}/fused/surge/${file}`).matchAll(/^PROCESS-NAME,(.+)$/gm)) {
        assert.ok(!isDesktop(row[1].trim()), `${segment.id}: ${row[1]}`);
      }
    }
    if (singBox) {
      const { rules } = JSON.parse(read(`${native}/fused/sing-box/${singBox.source}`));
      for (const rule of rules) assert.ok(!(rule.process_name || []).some(isDesktop), segment.id);
    }
  }
  const xray = JSON.parse(read('Xray内核系/v2rayN/v2rayN(xray).json'));
  for (const rule of xray.filter(rule => rule.id?.endsWith('-ai'))) assert.ok(!(rule.process || []).some(isDesktop), rule.id);
});

test('AI destination rules and dedicated non-desktop process routes remain available', () => {
  const model = loadRepository();
  for (const host of ['chatgpt.com', 'claude.ai', 'openai.com', 'anthropic.com']) {
    const route = firstMatch(model, { host }, { mode: 'domain-projection' });
    assert.equal(route.status, 'match', host);
    assert.equal(route.policy, '🤖 AI 服务', host);
  }
  const { rules } = JSON.parse(read('rulesets/generated/fused/sing-box/scki-fused-035-ai.json'));
  for (const name of ['cowork-svc.exe', 'Codex.exe']) assert.ok(rules.some(rule => rule.process_name?.includes(name)), name);
});
