'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { getRawRoutingGraph, getMihomoNormalizedRoutingGraph } = require('../../rulesets/source/routing-graph');
const { firstMatch, loadRepository, matchEntry } = require('../lib/ordered-rule-semantics');
const { parseEgernYaml } = require('../rebuild-fused-from-snapshot');
const { clientDirectory } = require('../lib/client-layout');

const ROOT = path.resolve(__dirname, '../..');
const GOOGLE = '🔍 Google 服务';
const DOWNLOAD = '📥 下载更新';
// Frozen GoogleFCM payload, independently checked against the MRS manifest:
// 15 exact domains + 26 IPv4 /32 entries. No ignored cache is needed in CI.
const HOSTS = [
  'alt1-mtalk.google.com', 'alt2-mtalk.google.com', 'alt3-mtalk.google.com',
  'alt4-mtalk.google.com', 'alt5-mtalk.google.com', 'alt6-mtalk.google.com',
  'alt7-mtalk.google.com', 'alt8-mtalk.google.com', 'android.apis.google.com',
  'device-provisioning.googleapis.com', 'firebaseinstallations.googleapis.com',
  'mtalk-dev.google.com', 'mtalk-staging.google.com', 'mtalk.google.com', 'mtalk4.google.com',
];
const IPS = [
  '108.177.125.188', '142.250.10.188', '142.250.31.188', '142.250.4.188', '142.250.96.188',
  '172.217.194.188', '172.217.218.188', '172.217.219.188', '172.253.122.188', '172.253.63.188',
  '173.194.175.188', '173.194.218.188', '209.85.233.188', '64.233.177.188', '64.233.186.188',
  '64.233.187.188', '64.233.188.188', '64.233.189.188', '74.125.127.188', '74.125.137.188',
  '74.125.203.188', '74.125.204.188', '74.125.206.188', '74.125.23.188', '74.125.24.188', '74.125.28.188',
];
const DOWNLOAD_HOSTS = ['dl.google.com', 'play.googleapis.com', 'android.clients.google.com',
  'download.microsoft.com', 'dldir1.qq.com'];
const model = loadRepository({ root: ROOT });
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const readJson = file => JSON.parse(read(file));

function fcmSegment() {
  const sources = model.manifest.source_segments.filter(segment =>
    segment.source_rules.some(rule => /^RULE-SET,googlefcm-(?:domain|ipcidr),/.test(rule)));
  assert.equal(sources.length, 1, 'FCM domain/IP must share one source policy segment');
  assert.equal(sources[0].policy, GOOGLE, 'FCM source segment must target Google');
  const segment = model.manifest.segments.find(item => item.id === sources[0].id);
  assert.ok(segment, 'the FCM source segment must have native assets');
  assert.equal(segment.policy, GOOGLE);
  return segment;
}

function assetTexts(segment, format) {
  const file = segment.files[format === 'sing-box' ? 'sing_box' : format];
  assert.ok(file, `${segment.id}: missing ${format} asset`);
  return (file.parts || [file.source || file.file]).map(part => read(`rulesets/generated/fused/${format}/${typeof part === 'string' ? part : part.source || part.file}`));
}

function hasDomain(entries, host) {
  return entries.some(entry => matchEntry(entry, { host }, { mode: 'domain-projection' }).status === 'match');
}

function hasIp(entries, ip) {
  return entries.some(entry => matchEntry(entry, { ip }).status === 'match');
}

test('FCM raw and normalized policies follow the download guard and precede broad Google rules', () => {
  for (const [graph, providers] of [
    [getRawRoutingGraph(), ['googlefcm']],
    [getMihomoNormalizedRoutingGraph(), ['googlefcm-domain', 'googlefcm-ipcidr']],
  ]) {
    const guards = graph.rules.map((rule, index) => ({ rule, index }))
      .filter(({ rule }) => /^RULE-SET,scki-download-guard(?:-domain|-classical)?,/.test(rule));
    assert.ok(guards.length);
    assert.ok(guards.every(({ rule }) => rule.endsWith(`,${DOWNLOAD}`)));
    const broadGoogle = graph.rules.indexOf(`RULE-SET,google,${GOOGLE}`);
    assert.ok(broadGoogle >= 0);
    for (const provider of providers) {
      const rows = graph.rules.map((rule, index) => ({ rule, index }))
        .filter(({ rule }) => rule.startsWith(`RULE-SET,${provider},`));
      assert.equal(rows.length, 1, provider);
      assert.equal(rows[0].rule, `RULE-SET,${provider},${GOOGLE}`);
      assert.ok(rows[0].index > Math.max(...guards.map(row => row.index)), provider);
      assert.ok(rows[0].index < broadGoogle, provider);
    }
  }
});

test('all 15 FCM domains select Google in the complete domain chronology', () => {
  for (const host of HOSTS) {
    const route = firstMatch(model, { host }, { mode: 'domain-projection' });
    assert.equal(route.status, 'match', host);
    assert.equal(route.policy, GOOGLE, host);
    assert.deepEqual(route.unknownBlockers, [], host);
  }
});

test('all 26 FCM IPs belong to the Google provider without inventing a full first-match result', () => {
  const segment = fcmSegment();
  const providers = [...model.providers.values()].filter(provider => provider.segment === segment.id && provider.kind.startsWith('ipcidr'));
  assert.ok(providers.length, 'FCM IP predicates must survive compilation');
  for (const ip of IPS) {
    assert.ok(providers.some(provider => hasIp(provider.entries, ip)), ip);
    // An IP alone does not identify a process, port, network or domain.
    // Earlier undecidable rules must remain blockers; a later match is only evidence.
    const route = firstMatch(model, { ip });
    assert.equal(route.status, 'unknown', ip);
    assert.equal(route.policy, null, ip);
    assert.ok(route.unknownBlockers.length > 0, ip);
    assert.equal(route.firstDecidableMatch?.policy, GOOGLE, ip);
  }
});

test('Xray FCM domain and IP predicates actually use proxy while download guards retain direct', () => {
  const rules = readJson('Xray内核系/v2rayN/v2rayN(xray).json').filter(rule => rule.enabled !== false);
  const domainEntries = rule => (rule.domain || []).map(value => {
    const [type, ...tail] = value.split(':');
    return `${{ full: 'DOMAIN', domain: 'DOMAIN-SUFFIX', keyword: 'DOMAIN-KEYWORD', regexp: 'DOMAIN-REGEX' }[type]},${tail.join(':')}`;
  });
  for (const [hosts, outbound] of [[HOSTS, 'proxy'], [DOWNLOAD_HOSTS, 'direct']]) {
    for (const host of hosts) {
      // Pure domain projection, matching the cross-client domain evidence above.
      const rule = rules.find(item => !(item.process?.length || item.port || item.sourcePort || item.sourceIP?.length) && hasDomain(domainEntries(item), host));
      assert.ok(rule, host);
      assert.equal(rule.outboundTag, outbound, host);
    }
  }
  const fcm = rules.find(rule => rule.id === fcmSegment().id);
  assert.ok(fcm);
  assert.equal(fcm.outboundTag, 'proxy');
  for (const ip of IPS) assert.ok(hasIp((fcm.ip || []).map(cidr => `IP-CIDR,${cidr}`), ip), ip);
});

test('FCM native assets retain all frozen predicates and download guard ownership stays separate', () => {
  const segment = fcmSegment();
  // android.apis.google.com already has an earlier Google owner; optimization
  // must preserve that owner rather than forcing a duplicate into the FCM segment.
  const movingHosts = HOSTS.filter(host => host !== 'android.apis.google.com');
  for (const format of ['clash', 'surge']) {
    const entries = assetTexts(segment, format).flatMap(text => text.split(/\r?\n/)).filter(line => line && !line.startsWith('#'));
    for (const host of movingHosts) assert.ok(hasDomain(entries, host), `${format}: ${host}`);
    for (const ip of IPS) assert.ok(hasIp(entries, ip), `${format}: ${ip}`);
  }
  const qx = assetTexts(segment, 'quantumultx').flatMap(text => text.split(/\r?\n/)).map(line =>
    line.replace(/^host-suffix,\s*/, 'DOMAIN-SUFFIX,').replace(/^host,\s*/, 'DOMAIN,').replace(/^ip-cidr,\s*/, 'IP-CIDR,'));
  for (const host of movingHosts) assert.ok(hasDomain(qx, host), `qx: ${host}`);
  for (const ip of IPS) assert.ok(hasIp(qx, ip), `qx: ${ip}`);
  const egern = parseEgernYaml(assetTexts(segment, 'egern').join('\n'));
  const egernEntries = [
    ...(egern.sets.get('domain_set') || []).map(host => `DOMAIN,${host}`),
    ...(egern.sets.get('domain_suffix_set') || []).map(host => `DOMAIN-SUFFIX,${host}`),
    ...(egern.sets.get('ip_cidr_set') || []).map(cidr => `IP-CIDR,${cidr}`),
  ];
  for (const host of movingHosts) assert.ok(hasDomain(egernEntries, host), `egern: ${host}`);
  for (const ip of IPS) assert.ok(hasIp(egernEntries, ip), `egern: ${ip}`);
  const singbox = JSON.parse(assetTexts(segment, 'sing-box').join(''));
  for (const host of movingHosts) assert.ok(singbox.rules.some(rule => hasDomain([
    ...(rule.domain || []).map(value => `DOMAIN,${value}`),
    ...(rule.domain_suffix || []).map(value => `DOMAIN-SUFFIX,${value}`),
  ], host)), `sing-box: ${host}`);
  for (const ip of IPS) assert.ok(singbox.rules.some(rule => hasIp((rule.ip_cidr || []).map(value => `IP-CIDR,${value}`), ip)), `sing-box: ${ip}`);
  for (const host of DOWNLOAD_HOSTS) {
    const route = firstMatch(model, { host }, { mode: 'domain-projection' });
    assert.equal(route.status, 'match', host);
    assert.equal(route.policy, DOWNLOAD, host);
    assert.notEqual(route.hit.provider, `${segment.id}-domain`, host);
  }
});

test('native client references assign the FCM assets to Google rather than download', () => {
  const segment = fcmSegment();
  for (const file of [
    'Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js', 'Mihomo内核系/Clash Party/ClashParty(mihomo).js',
    'Mihomo内核系/FlClash/FlClash(mihomo).js', 'Mihomo内核系/Clash Meta For Android/CMFA(mihomo).yaml',
    'Mihomo内核系/OpenClash/OpenClash(mihomo).sh', 'Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh',
    '独立内核系/Stash/Stash.yaml',
  ]) {
    const text = read(file);
    for (const kind of ['domain', 'ipcidr']) {
      assert.ok(text.includes(`RULE-SET,${segment.id}-${kind},${GOOGLE}`), `${file}: ${kind}`);
      assert.ok(!text.includes(`RULE-SET,${segment.id}-${kind},${DOWNLOAD}`), file);
    }
  }
  for (const app of ['Shadowrocket', 'Surge', 'Loon', 'Quantumult X']) {
    const file = `${clientDirectory(app)}/${app === 'Quantumult X' ? 'QuantumultX' : app}.conf`;
    const references = read(file).split(/\r?\n/).filter(line => line.includes(`${segment.id}.list`));
    assert.equal(references.length, 1, file);
    assert.ok(references[0].includes(GOOGLE), file);
  }
  for (const file of ['Sing-box内核系/SingBox/SingBox(sing-box)-full.json', 'Sing-box内核系/SingBox/SingBox(sing-box)-1.13.json']) {
    const routes = readJson(file).route.rules.filter(rule => (Array.isArray(rule.rule_set) ? rule.rule_set : [rule.rule_set]).includes(segment.id));
    assert.ok(routes.length, file);
    assert.ok(routes.every(rule => rule.outbound === GOOGLE), file);
  }
  const egernReferences = read('独立内核系/Egern/Egern.yaml').split('  - rule_set:').filter(block => block.includes(`provider-${segment.id}-`));
  assert.ok(egernReferences.length);
  assert.ok(egernReferences.every(block => block.includes(`policy: ${JSON.stringify(GOOGLE)}`)));
  for (const app of ['Passwall', 'Passwall2']) {
    const text = read(`${clientDirectory(app)}/shunt-rules/${segment.id}.list`);
    assert.ok(text.includes(`${segment.id} | ${GOOGLE} | proxy`), app);
    assert.ok(text.includes(`/${segment.id}.srs`), app);
  }
  const karing = readJson('Sing-box内核系/Karing/diversion_rules_custom.json').rules.filter(rule => rule.rule_set?.some(url => url.includes(`/${segment.id}.srs`)));
  assert.equal(karing.length, 1);
  assert.equal(karing[0].outbound, 'currentSelected');
  assert.ok(karing[0].name.includes(GOOGLE));
});
