#!/usr/bin/env node
'use strict';

// Candidate adapter: reuse the maintained JS routing runtime, with no DNS or
// platform settings projection. routing-graph.js remains the rule authority.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { SOURCE_GRAPH_VERSION } = require('../rulesets/source/routing-graph');
const { trafficSourceFingerprint } = require('./build-fused-rule-sets');
const { writeRepositoryArtifact } = require('./lib/write-repository-artifact');
const ROOT = path.resolve(__dirname, '..');
const SOURCE_PATH = 'Mihomo内核系/FlClash/FlClash(mihomo).js';
const CLIENT_DIR = 'Meow内核系/Aerove Lite';
const SCRIPT_PATH = `${CLIENT_DIR}/AeroveLite(meow).js`;
const MANIFEST_PATH = `${CLIENT_DIR}/adapter-manifest.json`;
const VERSION = `${SOURCE_GRAPH_VERSION}-meow.1`;
const BUILD = '2026-10-24';
const canonical = text => text.replace(/\r\n/g, '\n');
const hash = text => crypto.createHash('sha256').update(canonical(text)).digest('hex');
const read = file => canonical(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const insist = (condition, message) => { if (!condition) throw new Error(message); };

function replaceOnce(source, anchor, replacement) {
  const first = source.indexOf(anchor);
  insist(first >= 0 && source.indexOf(anchor, first + anchor.length) < 0, `source anchor missing or duplicated: ${anchor.slice(0, 70)}`);
  return source.slice(0, first) + replacement + source.slice(first + anchor.length);
}

function removeBetween(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  insist(a >= 0 && b > a && source.indexOf(start, a + start.length) < 0, `source anchor drift: ${start}`);
  return source.slice(0, a) + source.slice(b);
}

function renderScript(input) {
  let source = canonical(input);
  const start = source.indexOf('const VERSION = ');
  insist(start >= 0, 'source VERSION anchor missing');
  source = source.slice(start);
  source = replaceOnce(source, source.split('\n')[0], `const VERSION = '${VERSION}'`);
  // Delete the complete Node-DNS/global-settings module. Do not copy unsupported
  // Mihomo fields and then silently strip them from the user's configuration.
  source = removeBetween(source, '// >>> SCKI NODE DNS HINTS: BEGIN', 'function cleanupSubscription(config)');
  source = removeBetween(source, 'function _simpleHash(str)', 'function sortProxyGroups(config)');
  source = replaceOnce(source, 'function main(config)', 'function sckiRoutingMain(config)');
  source = replaceOnce(source, "const SCKI_SUBSCRIPTION_ADAPTER_PROFILE = 'adaptive'", "const SCKI_SUBSCRIPTION_ADAPTER_PROFILE = 'off'");
  source = replaceOnce(source, "    if (!config || typeof config !== 'object') return config", '');
  source = replaceOnce(source,
    "      log(`[${VERSION}] Node preflight rejected: ${nodePlan.reason}${nodePlan.reason === 'provider-input' ? '; flatten in SubStore for provider subscriptions' : ''}`)\n      return config",
    "      throw new Error('Node preflight rejected: ' + nodePlan.reason + '; flatten provider subscriptions in SubStore first')");
  source = replaceOnce(source, '    if (nodePlan.sourceCount === 0 && nodePlan.flattenedProviders === 0) return config',
    "    if (nodePlan.sourceCount === 0 && nodePlan.flattenedProviders === 0) throw new Error('Meow adapter requires inline proxy nodes; import or flatten a subscription first')");
  source = replaceOnce(source,
    '    var activeNodeServers = collectActiveSubscriptionNodeServers(config.proxies)\n' +
    '    var nodeDnsHints = SckiSubscriptionAdapter.captureNodeDns(config, activeNodeServers, SCKI_SUBSCRIPTION_ADAPTER_PROFILE)\n' +
    '    var nodeDnsReport = overwriteGeneral(config, nodeDnsHints)\n    logSubscriptionAdapterReport(nodeDnsReport)\n', '');
  source = replaceOnce(source, '    injectSmartFingerprint(config)\n', '');
  source = replaceOnce(source, '    log(`[${VERSION}] Error:`, e)\n    return config', '    throw e');
  source += '\n// DNS rule-set references cannot survive replacement of subscription providers.\n' +
    'function sckiAssertIndependentDns(value) {\n' +
    '  function check(text) {\n' +
    "    if (/(^|,)\\s*rule-set\\s*[:,]/i.test(text)) throw new Error('DNS rule-set dependency would be replaced: ' + text + '; use independent DNS policies before applying this adapter')\n" +
    '  }\n' +
    "  if (typeof value === 'string') check(value)\n" +
    "  else if (value && typeof value === 'object') Object.keys(value).forEach(function (key) { check(key); sckiAssertIndependentDns(value[key]) })\n" +
    '}\n' +
    '// JSON object in/out matches the Lite QuickJS bridge. Failures never commit a\n' +
    '// partly rewritten input; the App owns validation of nodes and platform fields.\n' +
    'function main(config) {\n' +
    "  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Expected a Meow configuration object')\n" +
    '  sckiAssertIndependentDns(config.dns)\n' +
    '  return sckiRoutingMain(JSON.parse(JSON.stringify(config)))\n}\n';
  return [
    '// AEROVE Lite / meow-rs 分流覆写候选（待 App 联调）',
    `// 版本：${VERSION} | Build：${BUILD}`,
    '// 架构：最多 22 个 url-test 区域组 + 33 业务组；融合 MRS / residual YAML',
    `// 规则源：rulesets/source/routing-graph.js ${SOURCE_GRAPH_VERSION}`,
    `// 生成：node tools/generate-aerove-meow.js；运行时输入：${SOURCE_PATH}`,
    `// 变更历史：${CLIENT_DIR}/CHANGELOG.md；状态：docs/support-queue.md`,
    '// 只维护节点清洗、分组、rule-providers、rules；DNS / TUN / 端口 / 嗅探由 App 管理。',
    '// 前提：已展开节点的订阅；远程 proxy-providers 请先用 SubStore 展平。',
    '// 目标接口：main(config)，JSON 对象入出；无网络、文件系统或定时器依赖。',
    '// 尚未通过目标 APK 导入、原生内核与真实连接验收，不属于正式支持清单。',
    '', source
  ].join('\n');
}

function buildOutputs() {
  const input = read(SOURCE_PATH);
  const script = renderScript(input);
  const context = vm.createContext({ console: { log() {} } });
  new vm.Script(script).runInContext(context, { timeout: 3000 });
  const routing = vm.runInContext(`(function () {
    var config = {};
    applyMihomoFusedRuleSets(config);
    return { providers: config['rule-providers'], rules: config.rules, business: Object.values(BIZ) };
  })()`, context, { timeout: 3000 });
  const fused = JSON.parse(read('rulesets/generated/fused/manifest.json'));
  insist(fused.baseline_version === SOURCE_GRAPH_VERSION, 'fused/source version mismatch');
  insist(fused.traffic_source_fingerprint === trafficSourceFingerprint(),
    'fused/source graph fingerprint mismatch; regenerate the shared routing chain first');
  insist(routing.rules.length === fused.fused_rule_count && Object.keys(routing.providers).length === fused.fused_provider_count,
    'routing consumer/fused manifest drift; regenerate the shared routing chain first');
  insist(routing.business.length === 33, 'unexpected business group topology');
  insist(routing.rules.at(-1) === 'MATCH,🐟 漏网之鱼', 'missing final routing rule');
  const inputs = [SOURCE_PATH, 'rulesets/source/routing-graph.js', 'rulesets/generated/fused/manifest.json',
    'tools/generate-aerove-meow.js'];
  const manifest = {
    schema_version: 1, version: VERSION, build: BUILD, client: 'AEROVE Lite', kernel: 'meow-rs',
    status: 'pre-adapted-awaiting-app', source_authority: 'rulesets/source/routing-graph.js',
    queue: 'docs/support-queue.md#aerove-lite-meow',
    input_sha256_lf: Object.fromEntries(inputs.map(file => [file, hash(read(file))])),
    output: { path: SCRIPT_PATH, sha256_lf: hash(script) },
    routing: { rule_count: routing.rules.length, provider_count: Object.keys(routing.providers).length,
      business_group_count: routing.business.length, maximum_region_group_count: 22 },
    managed_fields: ['proxies', 'proxy-providers (inline flattening only)', 'proxy-groups', 'rule-providers', 'rules'],
    app_owned_fields: ['dns', 'hosts', 'sniffer', 'tun', 'ports', 'mode', 'external-controller', 'secret', 'geodata'],
    verification: { node_vm: 'covered-by-tests', meow_core: 'pending', quickjs_android: 'pending', app_import: 'pending', actual_routing: 'pending' }
  };
  return { [SCRIPT_PATH]: script, [MANIFEST_PATH]: JSON.stringify(manifest, null, 2) + '\n' };
}

function checkOutputs(outputs = buildOutputs()) {
  return Object.entries(outputs).filter(([file, text]) => !fs.existsSync(path.join(ROOT, file)) || read(file) !== text).map(([file]) => file);
}

function main() {
  const args = process.argv.slice(2);
  insist(args.every(arg => arg === '--check'), 'Usage: node tools/generate-aerove-meow.js [--check]');
  const outputs = buildOutputs();
  if (!args.includes('--check')) {
    for (const [file, text] of Object.entries(outputs)) writeRepositoryArtifact(path.join(ROOT, file), text);
  }
  const drift = checkOutputs(outputs);
  insist(drift.length === 0, `AEROVE Meow generated output drift:\n${drift.join('\n')}`);
  console.log(`AEROVE Meow ${args.includes('--check') ? 'check OK' : 'generated and read back'}: ${VERSION}; App/core verification pending`);
}

module.exports = { renderScript, buildOutputs, checkOutputs, SCRIPT_PATH, MANIFEST_PATH, VERSION };
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
