#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { repositoryAssetUrl } = require('./lib/generated-asset-url');

const REPO_ROOT = path.resolve(__dirname, '..');
const FUSED_ROOT = path.join(REPO_ROOT, 'rulesets/generated/fused');
const FUSED_SING_BOX_DIR = path.join(FUSED_ROOT, 'sing-box');
const FUSED_PASSWALL_DIR = path.join(FUSED_ROOT, 'passwall');
const MANIFEST_FILE = path.join(FUSED_ROOT, 'manifest.json');
const CLASH_SMART_FILE = path.join(REPO_ROOT, 'Clash Party/ClashParty(mihomo-smart).js');
const V2RAYN_FILE = path.join(REPO_ROOT, 'v2rayN/v2rayN(xray).json');
const PASSWALL_SHUNT_DIR = path.join(REPO_ROOT, 'Passwall/shunt-rules');
const PASSWALL2_SHUNT_DIR = path.join(REPO_ROOT, 'Passwall2/shunt-rules');

const BUILD_DATE = '2026-09-29';
const V2RAYN_VERSION = 'v6.0.14-v2n.5';
const PASSWALL_VERSION = 'v6.0.14-pw.5';
const PASSWALL2_VERSION = 'v6.0.14-pw2.5';

const DIRECT_POLICIES = new Set([
  'DIRECT',
  '📺 国内流媒体',
  '🕹️ 国内游戏',
  '🏠 国内网站',
  '🍎 苹果服务',
  '📥 下载更新',
  '🛰️ BT/PT Tracker',
]);

const BLOCK_POLICIES = new Set([
  'REJECT',
  'REJECT-DROP',
  '🛑 广告拦截',
]);

const LEGACY_PASSWALL_REMARKS = [
  '🛑 广告拦截',
  '🤖 AI 服务',
  '💰 加密货币',
  '🏦 金融支付',
  '💬 即时通讯',
  '📱 社交媒体',
  '🎵 TikTok',
  '🧑‍💼 会议协作',
  '📺 国内流媒体',
  '🎥 Netflix',
  '🎬 Disney+',
  '📡 HBO/Max',
  '📺 Hulu',
  '🎬 Prime Video',
  '📹 YouTube',
  '🎵 音乐流媒体',
  '🌐 其他国外流媒体',
  '🇭🇰 香港流媒体',
  '🇹🇼 台湾流媒体',
  '🇯🇵 日韩流媒体',
  '🇪🇺 欧洲流媒体',
  '🕹️ 国内游戏',
  '🎮 国外游戏',
  'Ⓜ️ 微软服务',
  '🍎 苹果服务',
  '📥 下载更新',
  '🛰️ BT/PT Tracker',
  '🏠 国内网站',
  '🚫 受限网站',
  '🌐 国外网站',
  '🔍 Google 服务',
  '🔧 工具与服务',
  '🐟 漏网之鱼',
];

function relPath(file) {
  return path.relative(REPO_ROOT, file).replace(/\\/g, '/');
}

function ensureRepoPath(file) {
  const resolved = path.resolve(file);
  const root = `${REPO_ROOT}${path.sep}`;
  if (resolved !== REPO_ROOT && !resolved.startsWith(root)) {
    throw new Error(`Refusing to write outside repository: ${resolved}`);
  }
  return resolved;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeText(file, text) {
  const target = ensureRepoPath(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text, 'utf8');
}

function resetDir(dir) {
  const target = ensureRepoPath(dir);
  if (target === REPO_ROOT) throw new Error('Refusing to reset repository root');
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
}

function outboundTag(policy) {
  if (BLOCK_POLICIES.has(policy)) return 'block';
  if (DIRECT_POLICIES.has(policy)) return 'direct';
  return 'proxy';
}

function* xrayDomainsFromSingBoxRule(rule) {
  for (const value of rule.domain || []) yield `full:${value}`;
  for (const value of rule.domain_suffix || []) yield `domain:${value}`;
  for (const value of rule.domain_keyword || []) yield `keyword:${value}`;
  for (const value of rule.domain_regex || []) yield `regexp:${value}`;
}

function* xrayIpsFromSingBoxRule(rule) {
  for (const value of rule.ip_cidr || []) yield value;
}

function* xraySourceIpsFromSingBoxRule(rule) {
  for (const value of rule.source_ip_cidr || []) yield value;
}

function xrayProcessesFromSingBoxRule(rule) {
  return [...(rule.process_name || []), ...(rule.process_path || [])];
}

function parseMihomoFusedRules() {
  const source = fs.readFileSync(CLASH_SMART_FILE, 'utf8');
  const marker = 'const MIHOMO_FUSED_RULES = ';
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Missing ${marker.trim()} in ${relPath(CLASH_SMART_FILE)}`);
  const lineEnd = source.indexOf('\n', start);
  if (lineEnd === -1) throw new Error(`Cannot locate MIHOMO_FUSED_RULES line ending in ${relPath(CLASH_SMART_FILE)}`);
  return JSON.parse(source.slice(start + marker.length, lineEnd).trim());
}

function segmentIdFromRuleSet(ruleSetId) {
  return String(ruleSetId)
    .replace(/-(domain|ipcidr|ipcidr-no-resolve|residual)$/, '');
}

function writeFd(fd, text) {
  fs.writeSync(fd, text);
}

function writeJsonStringArray(fd, values, transform) {
  let first = true;
  writeFd(fd, '[');
  for (const value of values || []) {
    if (!first) writeFd(fd, ',');
    first = false;
    writeFd(fd, JSON.stringify(transform ? transform(value) : value));
  }
  writeFd(fd, ']');
}

function writeJsonArrayFromRuleFields(fd, rules, collect) {
  let first = true;
  writeFd(fd, '[');
  for (const rule of rules) {
    for (const value of collect(rule)) {
      if (!first) writeFd(fd, ',');
      first = false;
      writeFd(fd, JSON.stringify(value));
    }
  }
  writeFd(fd, ']');
}

function writeXrayRulePrefix(fd, rule, isFirst) {
  writeFd(fd, `${isFirst ? '' : ',\n'}  {\n`);
  writeFd(fd, `    "id": ${JSON.stringify(rule.id)},\n`);
  writeFd(fd, `    "enabled": ${rule.enabled === false ? 'false' : 'true'},\n`);
  writeFd(fd, `    "remarks": ${JSON.stringify(rule.remarks)},\n`);
  writeFd(fd, `    "outboundTag": ${JSON.stringify(rule.outboundTag)},\n`);
}

function writeXrayRuleSuffix(fd, rule) {
  writeFd(fd, ',\n');
  writeFd(fd, `    "port": ${JSON.stringify(rule.port || '')},\n`);
  writeFd(fd, '    "protocol": [],\n');
  writeFd(fd, '    "inboundTag": [],\n');
  writeFd(fd, `    "network": ${JSON.stringify(rule.network || 'tcp,udp')}`);
  if (rule.process) {
    writeFd(fd, ',\n    "process": ');
    writeJsonStringArray(fd, rule.process);
  }
  if (rule.sourceIP) {
    writeFd(fd, ',\n    "sourceIP": ');
    writeJsonStringArray(fd, rule.sourceIP);
  }
  writeFd(fd, '\n  }');
}

function writeStaticXrayRule(fd, rule, isFirst) {
  writeXrayRulePrefix(fd, rule, isFirst);
  writeFd(fd, '    "domain": ');
  writeJsonStringArray(fd, rule.domain || []);
  writeFd(fd, ',\n    "ip": ');
  writeJsonStringArray(fd, rule.ip || []);
  writeXrayRuleSuffix(fd, rule);
}

function writeSegmentXrayRule(fd, segment, ordinal, isFirst) {
  const sourceFile = segment.files && segment.files.sing_box && segment.files.sing_box.source;
  if (!sourceFile) throw new Error(`${segment.id}: missing sing-box source metadata`);
  const singBoxFile = path.join(FUSED_SING_BOX_DIR, sourceFile);
  const singBox = readJson(singBoxFile);
  const rules = singBox.rules || [];
  writeXrayRulePrefix(fd, {
    id: segment.id,
    remarks: `[${String(ordinal).padStart(3, '0')}] ${segment.id} | ${segment.policy} | fused -> ${outboundTag(segment.policy)}`,
    outboundTag: outboundTag(segment.policy),
  }, isFirst);
  writeFd(fd, '    "domain": ');
  writeJsonArrayFromRuleFields(fd, rules, xrayDomainsFromSingBoxRule);
  writeFd(fd, ',\n    "ip": ');
  writeJsonArrayFromRuleFields(fd, rules, xrayIpsFromSingBoxRule);
  const sourceIPs = rules.flatMap((rule) => [...xraySourceIpsFromSingBoxRule(rule)]);
  const processes = rules.flatMap(xrayProcessesFromSingBoxRule);
  const unsupportedProcessRegex = rules.flatMap((rule) => rule.process_path_regex || []);
  if (unsupportedProcessRegex.length) {
    throw new Error(`${segment.id}: Xray RuleObject cannot preserve PROCESS-PATH-REGEX`);
  }
  writeXrayRuleSuffix(fd, {
    port: '',
    network: 'tcp,udp',
    process: processes.length ? processes : null,
    sourceIP: sourceIPs.length ? sourceIPs : null,
  });
}

function splitTopLevel(rule) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of String(rule)) {
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim());
}

function splitTupleList(value) {
  const inner = String(value || '').trim().replace(/^\(/, '').replace(/\)$/, '');
  return splitTopLevel(inner)
    .map((item) => item.trim().replace(/^\(/, '').replace(/\)$/, ''))
    .filter(Boolean);
}

function xrayDomainFromCondition(condition) {
  const [type, value] = condition;
  if (!value) return null;
  if (type === 'DOMAIN') return `full:${value}`;
  if (type === 'DOMAIN-SUFFIX') return `domain:${value}`;
  if (type === 'DOMAIN-KEYWORD') return `keyword:${value}`;
  if (type === 'DOMAIN-REGEX') return `regexp:${value}`;
  return null;
}

function renderInlineXrayRule(rule, index) {
  const parts = splitTopLevel(rule);
  if (parts[0] === 'DST-PORT') {
    return {
      id: `scki-inline-${String(index).padStart(3, '0')}-port-${parts[1]}`,
      remarks: `inline ${rule} -> ${outboundTag(parts[2])}`,
      outboundTag: outboundTag(parts[2]),
      domain: [],
      ip: [],
      port: parts[1],
      network: 'tcp,udp',
    };
  }
  if (parts[0] === 'MATCH' || parts[0] === 'FINAL') {
    return {
      id: 'scki-inline-final',
      remarks: `inline ${parts[0]} ${parts[1]} -> ${outboundTag(parts[1])}`,
      outboundTag: outboundTag(parts[1]),
      domain: [],
      ip: [],
      port: '0-65535',
      network: 'tcp,udp',
    };
  }
  if (parts[0] === 'AND') {
    const conditions = splitTupleList(parts[1]).map(splitTopLevel);
    const process = conditions.find((condition) => condition[0] === 'PROCESS-NAME');
    const domainCondition = conditions.find((condition) => (
      ['DOMAIN', 'DOMAIN-SUFFIX', 'DOMAIN-KEYWORD', 'DOMAIN-REGEX'].includes(condition[0])
    ));
    const processDomain = domainCondition && xrayDomainFromCondition(domainCondition);
    if (process && processDomain && conditions.length === 2) {
      return {
        id: `scki-inline-${String(index).padStart(3, '0')}-process-domain`,
        remarks: `inline ${rule} -> ${outboundTag(parts[2])}`,
        outboundTag: outboundTag(parts[2]),
        domain: [processDomain],
        ip: [],
        port: '',
        network: 'tcp,udp',
        process: [process[1]],
      };
    }

    const body = parts[1];
    const policy = parts[2];
    const portMatch = body.match(/DST-PORT,([0-9-]+)/);
    const networkMatch = body.match(/NETWORK,([A-Z]+)/);
    const geositeMatch = body.match(/GEOSITE,([^)]+)/);
    const ruleSetMatch = body.match(/RULE-SET,([^)]+)/);
    const isNotCn = /NOT,\(\(GEOSITE,cn\)\)/.test(body);
    const domain = [];
    if (geositeMatch) domain.push(`geosite:${geositeMatch[1]}`);
    else if (ruleSetMatch && ['apple', 'microsoft'].includes(ruleSetMatch[1])) domain.push(`geosite:${ruleSetMatch[1]}`);
    else if (isNotCn) domain.push('geosite:geolocation-!cn');
    if (!portMatch || domain.length === 0) return null;
    return {
      id: `scki-inline-${String(index).padStart(3, '0')}-and`,
      remarks: `inline ${rule} -> ${outboundTag(policy)}`,
      outboundTag: outboundTag(policy),
      domain,
      ip: [],
      port: portMatch[1],
      network: networkMatch ? networkMatch[1].toLowerCase() : 'tcp,udp',
    };
  }
  return null;
}

function writeV2rayNArtifact(manifest, fusedRules) {
  const segmentsById = new Map(
    manifest.segments
      .filter((segment) => segment.files && segment.files.sing_box && segment.files.sing_box.source)
      .map((segment) => [segment.id, segment]),
  );
  const emittedSegments = new Set();
  const fd = fs.openSync(ensureRepoPath(V2RAYN_FILE), 'w');
  let count = 0;
  try {
    writeFd(fd, '[\n');
    writeStaticXrayRule(fd, {
      id: 'scki-000-meta',
      enabled: false,
      remarks: `Smart-Config-Kit ${V2RAYN_VERSION} | Build ${BUILD_DATE} | Baseline Clash Party ${manifest.baseline_version} | source rulesets/source/routing-graph.js | fused segments=${manifest.segment_count} | Xray native flatten from rulesets/generated/fused/sing-box/*.json`,
      outboundTag: 'direct',
      domain: ['domain:smart-config-kit.invalid'],
      ip: [],
      port: '',
      network: 'tcp,udp',
    }, true);
    count += 1;

    let inlineIndex = 0;
    let segmentOrdinal = 0;
    for (const rule of fusedRules) {
      const parts = splitTopLevel(rule);
      if (parts[0] === 'RULE-SET') {
        const segmentId = segmentIdFromRuleSet(parts[1]);
        if (!segmentsById.has(segmentId) || emittedSegments.has(segmentId)) continue;
        emittedSegments.add(segmentId);
        segmentOrdinal += 1;
        writeFd(fd, ',\n');
        writeSegmentXrayRule(fd, segmentsById.get(segmentId), segmentOrdinal, true);
        count += 1;
        continue;
      }
      inlineIndex += 1;
      const inlineRule = renderInlineXrayRule(rule, inlineIndex);
      if (!inlineRule) continue;
      writeFd(fd, ',\n');
      writeStaticXrayRule(fd, inlineRule, true);
      count += 1;
    }
    writeFd(fd, '\n]\n');
  } finally {
    fs.closeSync(fd);
  }
  return { ruleCount: count, emittedSegments: emittedSegments.size };
}

function passwallRuleUrl(segment, assetRevision) {
  return repositoryAssetUrl(`rulesets/generated/fused/sing-box/${segment.id}.srs`, assetRevision);
}

function hasIpPayload(segment) {
  if (segment.target_ip_counts && Number.isFinite(Number(segment.target_ip_counts.sing_box))) {
    return Number(segment.target_ip_counts.sing_box) > 0;
  }
  const counts = segment.counts || {};
  return Number(counts.ipcidr || 0) + Number(counts.ipcidr_no_resolve || 0) > 0;
}

function singBoxBinarySegments(manifest) {
  return manifest.segments.filter((segment) => (
    segment.files
    && segment.files.sing_box
    && segment.files.sing_box.format === 'binary'
    && String(segment.files.sing_box.file || '').endsWith('.srs')
    && segment.files.sing_box.source
  ));
}

function renderLegacyRemarkMatcher() {
  return LEGACY_PASSWALL_REMARKS.map((remark) => `    ${JSON.stringify(remark)} \\`).join('\n');
}

function renderPasswallScript({ appName, version, title, configName, nodeComment, segments, baselineVersion, assetRevision }) {
  const oldRemarkList = renderLegacyRemarkMatcher();
  const addCalls = segments.map((segment, index) => (
    `# [${String(index + 1).padStart(3, '0')}] ${segment.id} | ${segment.policy}\n`
    + `add_fused_shunt_rule '${segment.id} | ${segment.policy}' '${passwallRuleUrl(segment, assetRevision)}' '${hasIpPayload(segment) ? '1' : '0'}'`
  )).join('\n\n');

  return `#!/bin/sh
# ═══════════════════════════════════════════════════════════════════════════
# Smart-Config-Kit for ${title} — fused UCI batch helper
# Version: ${version} | Build ${BUILD_DATE} | Baseline: Clash Party ${baselineVersion}
#
# 用途：一次性在 ${title} 中创建 ${segments.length} 条 fused shunt rule。
#       每条规则只引用 rulesets/generated/fused/sing-box/*.srs，不再维护手写域名/IP 展平列表。
#       目标节点留空，用户之后到 LuCI 里给每条 rule 选择节点/负载均衡组。
#
# 生成：node tools/generate-fused-fallback-artifacts.js
# 变更历史：见 ${appName}/CHANGELOG.md
# ═══════════════════════════════════════════════════════════════════════════

set -e

CONFIG_NAME="${configName}"
VERSION_TAG="${version}"
MODE="\${1:---replace}"

case "\${MODE}" in
  --replace|'')
    MODE="--replace"
    ;;
  --append)
    ;;
  *)
    echo "Usage: $0 [--replace|--append]" >&2
    exit 2
    ;;
esac

is_scki_remark() {
  case "$1" in
    scki-fused-*) return 0 ;;
  esac
  printf '%s\\n' \\
${oldRemarkList}
    | grep -Fqx "$1"
}

cleanup_existing_scki_rules() {
  removed=0
  for section in $(uci show "\${CONFIG_NAME}" | sed -n "s/^\${CONFIG_NAME}\\.\\([^.=]*\\)=shunt_rules$/\\1/p"); do
    remarks="$(uci -q get "\${CONFIG_NAME}.\${section}.remarks" || true)"
    if is_scki_remark "\${remarks}"; then
      uci delete "\${CONFIG_NAME}.\${section}"
      removed=$((removed + 1))
    fi
  done
  if [ "\${removed}" -gt 0 ]; then
    echo "已删除旧 Smart-Config-Kit shunt rules: \${removed}"
  fi
}

add_fused_shunt_rule() {
  remarks="$1"
  url="$2"
  has_ip="$3"
  SEC="$(uci add "\${CONFIG_NAME}" shunt_rules)"
  uci set "\${CONFIG_NAME}".\${SEC}.remarks="\${remarks}"
  uci add_list "\${CONFIG_NAME}".\${SEC}.domain_list="rule-set:remote:\${url}"
  if [ "\${has_ip}" = "1" ]; then
    uci add_list "\${CONFIG_NAME}".\${SEC}.ip_list="rule-set:remote:\${url}"
  fi
  uci set "\${CONFIG_NAME}".\${SEC}.network='tcp,udp'
  ${nodeComment}
}

if ! command -v uci >/dev/null 2>&1; then
  echo "ERROR: uci 命令不存在，本脚本只能在 OpenWrt 路由器上运行" >&2
  exit 1
fi

if [ ! -f "/etc/config/\${CONFIG_NAME}" ]; then
  echo "ERROR: /etc/config/\${CONFIG_NAME} 不存在，请先安装 ${title}" >&2
  exit 1
fi

echo "建议先备份: cp /etc/config/\${CONFIG_NAME} /etc/config/\${CONFIG_NAME}.$(date +%s).bak"
echo "运行模式: \${MODE}（--replace 会删除旧 Smart-Config-Kit 规则；--append 会追加）"
if [ -t 0 ]; then
  echo "按 Ctrl+C 取消，回车继续..."
  read _
fi

if [ "\${MODE}" = "--replace" ]; then
  cleanup_existing_scki_rules
fi

echo "开始创建 ${segments.length} 条 fused shunt rule..."

${addCalls}

uci commit "\${CONFIG_NAME}"
echo "完成：已写入 ${segments.length} 条 Smart-Config-Kit fused shunt rule。请到 LuCI 分流控制中为各规则选择目标节点。"
`;
}

function renderPasswallConf({ title, version, readmePath, segments, baselineVersion, assetRevision }) {
  const lines = [
    '# ════════════════════════════════════════════════════════════════════════════',
    `#  Smart-Config-Kit for ${title} — Fused Shunt Rules Reference`,
    `#  Version: ${version} | Build: ${BUILD_DATE}`,
    `#  Baseline: Clash Party ${baselineVersion}`,
    '#  Source: rulesets/source/routing-graph.js -> rulesets/generated/fused/sing-box/*.srs',
    '#',
    `#  本文件为手工配置参考；推荐使用同目录 apply.sh 自动创建 ${segments.length} 条规则。`,
    '#  规则只调用 rule-set:remote:<srs-url>，不再维护手写域名/IP 展平列表。',
    `#  更多说明见 ${readmePath}`,
    '# ════════════════════════════════════════════════════════════════════════════',
    '',
  ];
  segments.forEach((segment, index) => {
    const url = passwallRuleUrl(segment, assetRevision);
    lines.push(`# [${String(index + 1).padStart(3, '0')}] ${segment.id} | ${segment.policy} | ${outboundTag(segment.policy)}`);
    lines.push('# [Domain List]');
    lines.push(`rule-set:remote:${url}`);
    if (hasIpPayload(segment)) {
      lines.push('# [IP List]');
      lines.push(`rule-set:remote:${url}`);
    }
    lines.push('');
  });
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

function renderPasswallList(segment, assetRevision) {
  return [
    `# ${segment.id} | ${segment.policy} | ${outboundTag(segment.policy)}`,
    '# Generated by tools/generate-fused-fallback-artifacts.js',
    `# Source: rulesets/generated/fused/sing-box/${segment.id}.srs`,
    '# Paste this line into Passwall / Passwall2 Domain List; for IP-bearing segments the apply.sh also writes it to IP List.',
    `rule-set:remote:${passwallRuleUrl(segment, assetRevision)}`,
    '',
  ].join('\n');
}

function writePasswallArtifacts(manifest) {
  resetDir(FUSED_PASSWALL_DIR);
  resetDir(PASSWALL_SHUNT_DIR);
  resetDir(PASSWALL2_SHUNT_DIR);
  const segments = singBoxBinarySegments(manifest);
  const assetRevision = manifest.asset_revision;

  for (const segment of segments) {
    const content = renderPasswallList(segment, assetRevision);
    writeText(path.join(FUSED_PASSWALL_DIR, `${segment.id}.list`), content);
    writeText(path.join(PASSWALL_SHUNT_DIR, `${segment.id}.list`), content);
    writeText(path.join(PASSWALL2_SHUNT_DIR, `${segment.id}.list`), content);
  }

  writeText(
    path.join(REPO_ROOT, 'Passwall/Passwall(xray+sing-box)-apply.sh'),
    renderPasswallScript({
      appName: 'Passwall',
      title: 'Passwall',
      version: PASSWALL_VERSION,
      configName: 'passwall',
      nodeComment: "# Passwall 全功能版可在 LuCI 中分别设置 tcp_node / udp_node。",
      segments,
      baselineVersion: manifest.baseline_version,
      assetRevision,
    }),
  );
  writeText(
    path.join(REPO_ROOT, 'Passwall2/Passwall2(xray+sing-box)-apply.sh'),
    renderPasswallScript({
      appName: 'Passwall2',
      title: 'Passwall2',
      version: PASSWALL2_VERSION,
      configName: 'passwall2',
      nodeComment: "# Passwall2 在 LuCI 中设置统一 node。",
      segments,
      baselineVersion: manifest.baseline_version,
      assetRevision,
    }),
  );
  writeText(
    path.join(REPO_ROOT, 'Passwall/Passwall(xray+sing-box).conf'),
    renderPasswallConf({
      title: 'Passwall',
      version: PASSWALL_VERSION,
      readmePath: 'Passwall/README.md',
      segments,
      baselineVersion: manifest.baseline_version,
      assetRevision,
    }),
  );
  writeText(
    path.join(REPO_ROOT, 'Passwall2/Passwall2(xray+sing-box).conf'),
    renderPasswallConf({
      title: 'Passwall2',
      version: PASSWALL2_VERSION,
      readmePath: 'Passwall2/README.md',
      segments,
      baselineVersion: manifest.baseline_version,
      assetRevision,
    }),
  );
  return { passwallFiles: segments.length };
}

function updateManifest(manifest, stats) {
  const updated = {
    ...manifest,
    generated_passwall_files: stats.passwallFiles,
    generated_xray_rules: stats.xray.ruleCount,
    generated_xray_fused_segments: stats.xray.emittedSegments,
  };
  updated.segments = manifest.segments.map((segment) => {
    const { passwall: _passwall, xray: _xray, ...baseFiles } = segment.files || {};
    if (!segment.files || !segment.files.sing_box) return { ...segment, files: baseFiles };
    return {
      ...segment,
      files: {
        ...baseFiles,
        passwall: {
          format: 'text',
          file: `${segment.id}.list`,
          source: `sing-box/${segment.files.sing_box.file}`,
        },
        xray: {
          format: 'inline-json',
          file: 'v2rayN/v2rayN(xray).json',
          source: `sing-box/${segment.files.sing_box.source}`,
        },
      },
    };
  });
  writeText(MANIFEST_FILE, `${JSON.stringify(updated, null, 2)}\n`);
  return updated;
}

function parseArgs(argv) {
  return {
    updateManifest: !argv.includes('--no-manifest'),
    quiet: argv.includes('--quiet'),
  };
}

function generateFusedFallbackArtifacts(options = {}) {
  const manifest = readJson(MANIFEST_FILE);
  const fusedRules = parseMihomoFusedRules();
  const xray = writeV2rayNArtifact(manifest, fusedRules);
  const passwall = writePasswallArtifacts(manifest);
  const stats = { xray, passwallFiles: passwall.passwallFiles };
  if (options.updateManifest !== false) updateManifest(manifest, stats);
  if (!options.quiet) {
    console.log(`fused fallback artifacts: xray_rules=${xray.ruleCount} xray_segments=${xray.emittedSegments} passwall_rules=${passwall.passwallFiles}`);
  }
  return stats;
}

if (require.main === module) {
  generateFusedFallbackArtifacts(parseArgs(process.argv.slice(2)));
}

module.exports = {
  generateFusedFallbackArtifacts,
};
