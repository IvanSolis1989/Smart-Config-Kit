#!/usr/bin/env node
'use strict';
const { resolveContractSegments } = require('./lib/fused-contract-segments');
const CONTRACT_SEGMENTS = resolveContractSegments();

const fs = require('fs');
const path = require('path');
const { repositoryAssetUrl } = require('./lib/generated-asset-url');
const { SOURCE_GRAPH_VERSION } = require('../rulesets/source/routing-graph');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'process-name-direct-tools.json');
const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));

const mihomoNames = fixture.mihomoDesktopProcessNames;
const mihomoWorkNames = fixture.mihomoWorkProcessNames || [];
const surgeNames = fixture.surgeMacProcessNames;
const surgeWorkNames = fixture.surgeWorkProcessNames || [];
const WORK_POLICY = '🧑‍💼 会议协作';
const MIHOMO_DIRECT_RULE_SET = `${CONTRACT_SEGMENTS["scki-fused-008-direct"]}-residual`;
const MIHOMO_WORK_RULE_SET = `${CONTRACT_SEGMENTS["scki-fused-009-work"]}-residual`;
const SINGBOX_DIRECT_RULE_SET = `${CONTRACT_SEGMENTS["scki-fused-008-direct"]}`;
const SINGBOX_WORK_RULE_SET = `${CONTRACT_SEGMENTS["scki-fused-009-work"]}`;
const SURGE_DIRECT_PROCESS_URL = repositoryAssetUrl(`rulesets/generated/fused/surge/${CONTRACT_SEGMENTS["scki-fused-008-direct"]}.list`, SOURCE_GRAPH_VERSION);
const SURGE_WORK_PROCESS_URL = repositoryAssetUrl(`rulesets/generated/fused/surge/${CONTRACT_SEGMENTS["scki-fused-009-work"]}.list`, SOURCE_GRAPH_VERSION);

const mihomoJsTargets = [
  'Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js',
  'Mihomo内核系/Clash Party/ClashParty(mihomo).js',
  'Mihomo内核系/FlClash/FlClash(mihomo).js',
];

const mihomoRuleTextTargets = [
  'Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml',
  'Mihomo内核系/OpenClash/OpenClash(mihomo).sh',
  'Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh',
];

const unsupportedTargets = [
  '独立内核系/Shadowrocket/Shadowrocket.conf',
  '独立内核系/Loon/Loon.conf',
  '独立内核系/Quantumult X/QuantumultX.conf',
  '双内核系/Passwall/Passwall(xray+sing-box)-apply.sh',
  '双内核系/Passwall/Passwall(xray+sing-box).conf',
  '双内核系/Passwall2/Passwall2(xray+sing-box)-apply.sh',
  '双内核系/Passwall2/Passwall2(xray+sing-box).conf',
];

for (const dir of ['双内核系/Passwall/shunt-rules', '双内核系/Passwall2/shunt-rules']) {
  for (const file of fs.readdirSync(path.join(ROOT, dir)).filter((name) => name.endsWith('.list'))) {
    unsupportedTargets.push(`${dir}/${file}`);
  }
}

const failures = [];

validateSupplementalProcessLists();

for (const target of mihomoJsTargets) {
  const text = read(target);
  validateMihomoJsTarget(target, text);
}

for (const target of mihomoRuleTextTargets) {
  const text = read(target);
  validateMihomoRuleTextTarget(target, text);
}

{
  const target = '独立内核系/Surge/Surge.conf';
  const text = read(target);
  if (!text.includes(`RULE-SET,${SURGE_DIRECT_PROCESS_URL},DIRECT`)) {
    failures.push(`${target}: missing Surge Mac supplemental DIRECT process RULE-SET`);
  }
  if (!text.includes(`RULE-SET,${SURGE_WORK_PROCESS_URL},${WORK_POLICY}`)) {
    failures.push(`${target}: missing Surge Mac supplemental WORK process RULE-SET`);
  }
}

{
  const target = 'Sing-box内核系/SingBox/SingBox(sing-box)-full.json';
  const data = JSON.parse(read(target));
  const routeRuleSets = new Set((data.route?.rule_set || []).map((ruleSet) => ruleSet.tag));
  if (!routeRuleSets.has(SINGBOX_DIRECT_RULE_SET)) {
    failures.push(`${target}: missing ${SINGBOX_DIRECT_RULE_SET} remote rule_set`);
  }
  if (!routeRuleSets.has(SINGBOX_WORK_RULE_SET)) {
    failures.push(`${target}: missing ${SINGBOX_WORK_RULE_SET} remote rule_set`);
  }
  const routeRules = data.route?.rules || [];
  if (!routeRules.some((rule) => rule.rule_set?.includes(SINGBOX_DIRECT_RULE_SET) && rule.outbound === 'DIRECT')) {
    failures.push(`${target}: ${SINGBOX_DIRECT_RULE_SET} is not routed to DIRECT`);
  }
  if (!routeRules.some((rule) => rule.rule_set?.includes(SINGBOX_WORK_RULE_SET) && rule.outbound === WORK_POLICY)) {
    failures.push(`${target}: ${SINGBOX_WORK_RULE_SET} is not routed to ${WORK_POLICY}`);
  }
  const directProcessNames = readSingBoxFusedProcessNames(`${CONTRACT_SEGMENTS["scki-fused-008-direct"]}`);
  const workProcessNames = readSingBoxFusedProcessNames(`${CONTRACT_SEGMENTS["scki-fused-009-work"]}`);
  const missing = mihomoNames.filter((name) => !directProcessNames.has(name));
  if (missing.length > 0) {
    failures.push(`rulesets/generated/fused/sing-box/${CONTRACT_SEGMENTS["scki-fused-008-direct"]}.json: missing ${missing.length} process_name entries: ${missing.join(', ')}`);
  }
  const missingWork = mihomoWorkNames.filter((name) => !workProcessNames.has(name));
  if (missingWork.length > 0) {
    failures.push(`rulesets/generated/fused/sing-box/${CONTRACT_SEGMENTS["scki-fused-009-work"]}.json: missing ${missingWork.length} RustDesk process_name entries: ${missingWork.join(', ')}`);
  }
}

{
  const target = 'Xray内核系/v2rayN/v2rayN(xray).json';
  const data = JSON.parse(read(target));
  const direct = data.find((rule) => rule.id === SINGBOX_DIRECT_RULE_SET);
  const work = data.find((rule) => rule.id === SINGBOX_WORK_RULE_SET);
  const missingDirect = mihomoNames.filter((name) => !direct?.process?.includes(name));
  const missingWork = mihomoWorkNames.filter((name) => !work?.process?.includes(name));
  if (!direct || direct.outboundTag !== 'direct' || missingDirect.length > 0) {
    failures.push(`${target}: ${SINGBOX_DIRECT_RULE_SET} direct process parity failed (${missingDirect.join(', ') || 'missing rule/target'})`);
  }
  if (!work || work.outboundTag !== 'proxy' || missingWork.length > 0) {
    failures.push(`${target}: ${SINGBOX_WORK_RULE_SET} work process parity failed (${missingWork.join(', ') || 'missing rule/target'})`);
  }
}

for (const target of unsupportedTargets) {
  const text = read(target);
  const activeProcessRules = text
    .split(/\r?\n/)
    .filter((line) => /^\s*(PROCESS-NAME|process-name),/.test(line));
  if (activeProcessRules.length > 0) {
    failures.push(`${target}: unsupported artifact contains active process rules`);
  }
}

if (failures.length > 0) {
  console.error('PROCESS-NAME direct whitelist validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PROCESS-NAME policy validation: OK (${mihomoNames.length} direct desktop names, ${mihomoWorkNames.length} RustDesk work names, ${surgeNames.length} Surge direct names)`);

function validateMihomoJsTarget(target, text) {
  if (!text.includes(MIHOMO_DIRECT_RULE_SET)) {
    failures.push(`${target}: missing ${MIHOMO_DIRECT_RULE_SET} supplemental process rule-set reference`);
  }
  if (!text.includes(MIHOMO_WORK_RULE_SET)) {
    failures.push(`${target}: missing ${MIHOMO_WORK_RULE_SET} supplemental work-process rule-set reference`);
  }
}

function validateMihomoRuleTextTarget(target, text) {
  if (!text.includes(`RULE-SET,${MIHOMO_DIRECT_RULE_SET},DIRECT`)) {
    failures.push(`${target}: missing ${MIHOMO_DIRECT_RULE_SET} fused process RULE-SET`);
  }
  if (!text.includes(`RULE-SET,${MIHOMO_WORK_RULE_SET},`) || !text.includes('会议协作')) {
    failures.push(`${target}: missing ${MIHOMO_WORK_RULE_SET} fused work-process RULE-SET`);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function activeProcessRuleSet(text) {
  return new Set(text
    .split(/\r?\n/)
    .map(normalizeRuleLine)
    .filter((line) => line.startsWith('PROCESS-NAME,')));
}

function normalizeRuleLine(line) {
  let value = String(line || '').trim();
  if (!value || value.startsWith('#')) return '';
  if (value.startsWith('-')) value = value.slice(1).trim();
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
    value = value.slice(1, -1);
  }
  return value;
}

function hasWorkProcessRule(activeRules, name) {
  const exact = `PROCESS-NAME,${name},${WORK_POLICY}`;
  if (activeRules.has(exact)) return true;
  for (const rule of activeRules) {
    if (rule.startsWith(`PROCESS-NAME,${name},`) && rule.includes('会议协作')) return true;
  }
  return false;
}

function validateSupplementalProcessLists() {
  const mihomoDirect = readProcessRuleSet('rulesets/supplemental/clash/local-process-direct.list');
  const mihomoWork = readProcessRuleSet('rulesets/supplemental/clash/work-process.list');
  const surgeDirect = readProcessRuleSet('rulesets/supplemental/surge/local-process-direct.list');
  const surgeWork = readProcessRuleSet('rulesets/supplemental/surge/work-process.list');

  const missingMihomo = mihomoNames.filter((name) => !mihomoDirect.has(name));
  if (missingMihomo.length > 0) {
    failures.push(`rulesets/supplemental/clash/local-process-direct.list: missing ${missingMihomo.length} names: ${missingMihomo.join(', ')}`);
  }
  const missingMihomoWork = mihomoWorkNames.filter((name) => !mihomoWork.has(name));
  if (missingMihomoWork.length > 0) {
    failures.push(`rulesets/supplemental/clash/work-process.list: missing ${missingMihomoWork.length} names: ${missingMihomoWork.join(', ')}`);
  }
  const missingSurge = surgeNames.filter((name) => !surgeDirect.has(name));
  if (missingSurge.length > 0) {
    failures.push(`rulesets/supplemental/surge/local-process-direct.list: missing ${missingSurge.length} names: ${missingSurge.join(', ')}`);
  }
  const missingSurgeWork = surgeWorkNames.filter((name) => !surgeWork.has(name));
  if (missingSurgeWork.length > 0) {
    failures.push(`rulesets/supplemental/surge/work-process.list: missing ${missingSurgeWork.length} names: ${missingSurgeWork.join(', ')}`);
  }
}

function readProcessRuleSet(relativePath) {
  return new Set(read(relativePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(','))
    .filter((parts) => parts[0] === 'PROCESS-NAME' && parts[1])
    .map((parts) => parts[1]));
}

function readSingBoxFusedProcessNames(id) {
  const file = `rulesets/generated/fused/sing-box/${id}.json`;
  const data = JSON.parse(read(file));
  return new Set((data.rules || [])
    .filter((rule) => Array.isArray(rule.process_name))
    .flatMap((rule) => rule.process_name));
}
