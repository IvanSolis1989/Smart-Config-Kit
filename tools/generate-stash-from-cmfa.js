#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCE_FILE = 'Clash Meta For Android/CMFA(mihomo).yaml';
const OUTPUT_FILE = 'Stash/Stash.yaml';
const FUSED_MANIFEST_FILE = 'rulesets/generated/fused/manifest.json';
const VERSION_SUFFIX = 'stash.7';
const BUILD_DATE = '2026-09-30';

const DNS_BOOTSTRAP_PLAINTEXT = ['223.5.5.5', '119.29.29.29', '1.1.1.1', '8.8.8.8'];
const DNS_DOMESTIC_DOH = ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'];

const DROP_TOP_LEVEL_SCALARS = new Set([
  'bind-address',
  'unified-delay',
  'tcp-concurrent',
  'find-process-mode',
  'keep-alive-idle',
  'keep-alive-interval',
  'geodata-mode',
  'geo-auto-update',
  'geo-update-interval',
]);

const DROP_TOP_LEVEL_BLOCKS = new Set([
  'geox-url',
  'profile',
  'sniffer',
]);

function relPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function topLevelKey(line) {
  const match = line.match(/^([A-Za-z0-9_.-]+):(?:\s|$)/);
  return match ? match[1] : null;
}

function findTopLevelBlockEnd(lines, start) {
  for (let i = start + 1; i < lines.length; i += 1) {
    if (topLevelKey(lines[i])) return i;
  }
  return lines.length;
}

function findTopLevelBlock(lines, key) {
  const start = lines.findIndex((line) => topLevelKey(line) === key);
  if (start === -1) throw new Error(`Missing top-level block: ${key}`);
  return { start, end: findTopLevelBlockEnd(lines, start) };
}

function extractNestedList(lines, parentKey, childKey) {
  const { start, end } = findTopLevelBlock(lines, parentKey);
  const output = [];
  let inList = false;
  const childPattern = new RegExp(`^  ${childKey}:\\s*$`);
  for (let i = start + 1; i < end; i += 1) {
    const line = lines[i];
    if (childPattern.test(line)) {
      inList = true;
      output.push(line);
      continue;
    }
    if (!inList) continue;
    if (/^  - /.test(line)) {
      output.push(line);
      continue;
    }
    if (/^  #/.test(line) || line.trim() === '') continue;
    break;
  }
  if (output.length === 0) throw new Error(`Missing nested list: ${parentKey}.${childKey}`);
  return output;
}

function extractNestedBlock(lines, parentKey, childKey) {
  const { start, end } = findTopLevelBlock(lines, parentKey);
  const output = [];
  let inBlock = false;
  const childPattern = new RegExp(`^  ${childKey}:\\s*$`);
  for (let i = start + 1; i < end; i += 1) {
    const line = lines[i];
    if (childPattern.test(line)) {
      inBlock = true;
      output.push(line);
      continue;
    }
    if (!inBlock) continue;
    if (/^  [A-Za-z0-9_.+-]+:/.test(line)) break;
    output.push(line);
  }
  if (output.length === 0) throw new Error(`Missing nested block: ${parentKey}.${childKey}`);
  return output;
}

function extractSubscribeField(lines, field, fallback) {
  const { start, end } = findTopLevelBlock(lines, 'proxy-providers');
  const pattern = new RegExp(`^    ${field}:\\s*(.+?)\\s*$`);
  for (let i = start + 1; i < end; i += 1) {
    const match = lines[i].match(pattern);
    if (match) return match[1];
  }
  return fallback;
}

function extractVersions(source) {
  const baselineMatch = source.match(/Clash Party (v\d+\.\d+\.\d+)/);
  const cmfaMatch = source.match(/Clash Smart (v\d+\.\d+\.\d+-cmfa\.\d+)/);
  if (!baselineMatch) throw new Error('Missing Clash Party baseline version in CMFA header');
  if (!cmfaMatch) throw new Error('Missing CMFA version in CMFA header');
  const baselineVersion = baselineMatch[1];
  return {
    baselineVersion,
    cmfaVersion: cmfaMatch[1],
    stashVersion: `${baselineVersion}-${VERSION_SUFFIX}`,
  };
}

function countRuleProviders(lines) {
  const { start, end } = findTopLevelBlock(lines, 'rule-providers');
  return lines.slice(start + 1, end).filter((line) => /^  [^\s#][^:]*:\s*$/.test(line)).length;
}

function countRules(lines) {
  const { start, end } = findTopLevelBlock(lines, 'rules');
  return lines.slice(start + 1, end).filter((line) => /^(?:  )?- /.test(line)).length;
}

function extractCounts(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const manifest = JSON.parse(fs.readFileSync(relPath(FUSED_MANIFEST_FILE), 'utf8'));
  return {
    fusedProviders: countRuleProviders(lines),
    fusedRules: countRules(lines),
    sourceProviders: manifest.source_provider_count,
    sourceRules: manifest.source_rule_count,
  };
}

function buildHeader(versions, counts) {
  return [
    '# ================================================================',
    `# Stash Smart ${versions.stashVersion} - Stash (Clash Premium) 配置`,
    `# Build: ${BUILD_DATE}`,
    `# 架构：由 CMFA 自动裁剪生成；22 url-test 区域组（11 全部 + 11 家宽）+ 33 业务策略组 + ${counts.fusedProviders} 融合 rule-providers / ${counts.fusedRules} rules（源 ${counts.sourceProviders}/${counts.sourceRules}）`,
    `# 规则源：rulesets/source/routing-graph.js ${versions.baselineVersion} / 派生：CMFA ${versions.cmfaVersion}`,
    '# 生成：node tools/generate-stash-from-cmfa.js（禁止手工修改 Stash/Stash.yaml）',
    '# 变更历史：见 `Stash/CHANGELOG.md`',
    '# 注意：Stash 不支持 Mihomo Smart + LightGBM；本产物使用 url-test 区域组',
    '# ================================================================',
    '# ★ 快速上手：',
    '#   1. 将 proxy-providers → Subscribe → url 替换为你的机场订阅链接',
    '#   2. 导入 Stash 即可使用；首次导入后在 Stash 内检查 rule-providers 下载状态',
    '#   3. 兼容取舍见 `Stash/REFERENCE-Stash-wiki.md`',
    '# ================================================================',
  ];
}

function buildDns(lines) {
  const fakeIpFilter = extractNestedList(lines, 'dns', 'fake-ip-filter');
  const nameserverPolicy = extractNestedBlock(lines, 'dns', 'nameserver-policy');
  return [
    'dns:',
    '  enable: true',
    '  ipv6: false',
    '  enhanced-mode: fake-ip',
    '  fake-ip-range: 198.18.0.1/16',
    ...fakeIpFilter,
    '  default-nameserver:',
    ...DNS_BOOTSTRAP_PLAINTEXT.map((server) => `  - ${server}`),
    '  nameserver:',
    ...DNS_DOMESTIC_DOH.map((server) => `  - '${server}'`),
    ...nameserverPolicy,
  ];
}

function buildProxyProviders(lines) {
  const url = extractSubscribeField(lines, 'url', "'https://my.example.com/your-subscription-url'");
  const interval = extractSubscribeField(lines, 'interval', '86400');
  const providerPath = extractSubscribeField(lines, 'path', './proxy_providers/subscribe.yaml');
  return [
    'proxy-providers:',
    '  Subscribe:',
    `    url: ${url}`,
    `    interval: ${interval}`,
    `    path: ${providerPath}`,
  ];
}

function transformBody(source, versions, counts) {
  const sourceLines = source.replace(/\r\n/g, '\n').split('\n');
  const firstTopLevel = sourceLines.findIndex((line) => topLevelKey(line));
  if (firstTopLevel === -1) throw new Error('CMFA source has no top-level YAML body');
  const lines = sourceLines.slice(firstTopLevel);
  const output = buildHeader(versions, counts);

  for (let i = 0; i < lines.length; i += 1) {
    const key = topLevelKey(lines[i]);
    if (key && DROP_TOP_LEVEL_SCALARS.has(key)) continue;
    if (key && DROP_TOP_LEVEL_BLOCKS.has(key)) {
      i = findTopLevelBlockEnd(lines, i) - 1;
      continue;
    }
    if (key === 'dns') {
      output.push(...buildDns(lines));
      i = findTopLevelBlockEnd(lines, i) - 1;
      continue;
    }
    if (key === 'proxy-providers') {
      output.push(...buildProxyProviders(lines));
      i = findTopLevelBlockEnd(lines, i) - 1;
      continue;
    }

    const line = lines[i];
    if (/^\s+proxy:\s*['"]?\u{1F6AB} \u53D7\u9650\u7F51\u7AD9['"]?\s*$/u.test(line)) continue;
    // Preserve the existing Stash compatibility policy: do not forward undocumented Mihomo group fields.
    if (/^  (lazy|tolerance|exclude-type|empty-fallback):\s*/.test(line)) continue;
    output.push(line);
  }

  while (output.length && output[output.length - 1] === '') output.pop();
  return `${output.join('\n')}\n`;
}

function main() {
  const source = fs.readFileSync(relPath(SOURCE_FILE), 'utf8');
  const versions = extractVersions(source);
  const counts = extractCounts(source);
  const output = transformBody(source, versions, counts);
  const target = relPath(OUTPUT_FILE);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, output, 'utf8');
  console.log(`Generated ${OUTPUT_FILE} from ${SOURCE_FILE} (${versions.stashVersion})`);
}

main();
