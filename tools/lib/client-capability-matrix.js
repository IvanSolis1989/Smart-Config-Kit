'use strict';

const fs = require('node:fs');
const path = require('node:path');

const MATRIX_SOURCE = 'docs/client-capability-matrix.json';
const MATRIX_OUTPUT = 'docs/client-capability-matrix.md';
const COLUMN_IDS = [
  'subscription_input',
  'dynamic_grouping',
  'node_dns_hint',
  'optional_node_dns_sidecar',
];
const PRODUCT_IDS = [
  'clash-party',
  'cmfa',
  'openclash',
  'shadowrocket',
  'sing-box',
  'v2rayn-xray',
  'surge',
  'loon',
  'quantumult-x',
  'passwall',
  'passwall2',
  'flclash',
  'stash',
  'egern',
  'karing',
];
const STATE_LABELS = {
  built_in: '内置自动',
  documented_manual: '手工文档',
  not_available: '无 / 不适用',
};

function defaultRepositoryRoot() {
  return path.resolve(__dirname, '..', '..');
}

function normalizeRepositoryPath(relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) {
    return null;
  }
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.startsWith('/') || normalized.split('/').includes('..')) return null;
  return normalized;
}

function resolveRepositoryPath(repositoryRoot, relativePath) {
  const normalized = normalizeRepositoryPath(relativePath);
  if (!normalized) return null;
  const root = path.resolve(repositoryRoot);
  const target = path.resolve(root, ...normalized.split('/'));
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return target;
}

function readClientCapabilityMatrix(repositoryRoot = defaultRepositoryRoot()) {
  const sourcePath = resolveRepositoryPath(repositoryRoot, MATRIX_SOURCE);
  if (!sourcePath) throw new Error(`cannot resolve ${MATRIX_SOURCE}`);
  return JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
}

function formatIssues(issues) {
  return issues.map((issue) => `${issue.id}: ${issue.message}`).join('; ');
}

function validateEvidence(evidence, repositoryRoot, id, issues) {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    issues.push({ id, message: 'must provide at least one repository evidence marker' });
    return;
  }

  evidence.forEach((entry, index) => {
    const evidenceId = `${id}.evidence[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      issues.push({ id: evidenceId, message: 'must be an object' });
      return;
    }
    const relativePath = normalizeRepositoryPath(entry.file);
    if (!relativePath) {
      issues.push({ id: evidenceId, message: 'file must be a safe repository-relative path' });
      return;
    }
    if (typeof entry.contains !== 'string' || !entry.contains.trim()) {
      issues.push({ id: evidenceId, message: 'contains must be a non-empty source marker' });
      return;
    }
    const target = resolveRepositoryPath(repositoryRoot, relativePath);
    if (!target || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
      issues.push({ id: evidenceId, message: `missing evidence file ${relativePath}` });
      return;
    }
    const source = fs.readFileSync(target, 'utf8');
    if (!source.includes(entry.contains)) {
      issues.push({ id: evidenceId, message: `${relativePath} no longer contains ${JSON.stringify(entry.contains)}` });
    }
  });
}

function validateClientCapabilityMatrix(matrix, repositoryRoot = defaultRepositoryRoot()) {
  const issues = [];
  if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) {
    return { ok: false, issues: [{ id: 'matrix', message: 'must be an object' }] };
  }
  if (matrix.schema_version !== 1) {
    issues.push({ id: 'schema_version', message: 'must be 1' });
  }
  if (matrix.generated_file !== MATRIX_OUTPUT) {
    issues.push({ id: 'generated_file', message: `must be ${MATRIX_OUTPUT}` });
  }
  if (JSON.stringify(matrix.columns) !== JSON.stringify(COLUMN_IDS)) {
    issues.push({ id: 'columns', message: `must exactly be ${COLUMN_IDS.join(', ')}` });
  }
  if (!Array.isArray(matrix.products)) {
    issues.push({ id: 'products', message: 'must be an array' });
    return { ok: false, issues };
  }

  const actualIds = matrix.products.map((product) => product && product.id);
  if (JSON.stringify(actualIds) !== JSON.stringify(PRODUCT_IDS)) {
    issues.push({ id: 'products.ids', message: `must exactly be ${PRODUCT_IDS.join(', ')}` });
  }

  matrix.products.forEach((product, index) => {
    const productId = product && product.id ? product.id : `index-${index}`;
    if (!product || typeof product !== 'object' || Array.isArray(product)) {
      issues.push({ id: `product.${productId}`, message: 'must be an object' });
      return;
    }
    if (typeof product.name !== 'string' || !product.name.trim()) {
      issues.push({ id: `product.${productId}.name`, message: 'must be a non-empty display name' });
    }
    if (!Array.isArray(product.artifacts) || product.artifacts.length === 0) {
      issues.push({ id: `product.${productId}.artifacts`, message: 'must list at least one owned artifact' });
    } else {
      product.artifacts.forEach((artifact, artifactIndex) => {
        const artifactId = `product.${productId}.artifacts[${artifactIndex}]`;
        const target = resolveRepositoryPath(repositoryRoot, artifact);
        if (!target || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
          issues.push({ id: artifactId, message: `missing artifact ${artifact}` });
        }
      });
    }

    const capabilities = product.capabilities;
    if (!capabilities || typeof capabilities !== 'object' || Array.isArray(capabilities)) {
      issues.push({ id: `product.${productId}.capabilities`, message: 'must be an object' });
      return;
    }
    const actualColumns = Object.keys(capabilities).sort();
    if (JSON.stringify(actualColumns) !== JSON.stringify([...COLUMN_IDS].sort())) {
      issues.push({ id: `product.${productId}.capabilities.columns`, message: `must exactly be ${COLUMN_IDS.join(', ')}` });
    }

    for (const column of COLUMN_IDS) {
      const capability = capabilities[column];
      const capabilityId = `product.${productId}.${column}`;
      if (!capability || typeof capability !== 'object' || Array.isArray(capability)) {
        issues.push({ id: capabilityId, message: 'must be an object' });
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(STATE_LABELS, capability.state)) {
        issues.push({ id: `${capabilityId}.state`, message: `must be one of ${Object.keys(STATE_LABELS).join(', ')}` });
      }
      if (typeof capability.mode !== 'string' || !/^[a-z][a-z0-9_]*$/.test(capability.mode)) {
        issues.push({ id: `${capabilityId}.mode`, message: 'must be a lower_snake_case capability mode' });
      }
      if (typeof capability.summary !== 'string' || !capability.summary.trim() || /[\r\n|]/.test(capability.summary)) {
        issues.push({ id: `${capabilityId}.summary`, message: 'must be a concise single-line Markdown-table-safe summary' });
      }
      validateEvidence(capability.evidence, repositoryRoot, capabilityId, issues);
    }
  });

  return { ok: issues.length === 0, issues };
}

function assertValidClientCapabilityMatrix(matrix, repositoryRoot = defaultRepositoryRoot()) {
  const result = validateClientCapabilityMatrix(matrix, repositoryRoot);
  if (!result.ok) throw new Error(`invalid client capability matrix: ${formatIssues(result.issues)}`);
  return matrix;
}

function markdownEscape(value) {
  return String(value).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').trim();
}

function markdownRepositoryLink(relativePath) {
  const normalized = normalizeRepositoryPath(relativePath);
  if (!normalized) return 'invalid evidence';
  const url = `../${normalized.split('/').map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)).join('/')}`;
  const label = normalized.split('/').at(-1);
  return `[${markdownEscape(label)}](${url})`;
}

function renderCapabilityCell(capability) {
  const evidenceLinks = capability.evidence.map((entry) => markdownRepositoryLink(entry.file)).join('、');
  return [
    `**${STATE_LABELS[capability.state]}**`,
    `\`${capability.mode}\``,
    markdownEscape(capability.summary),
    `证据：${evidenceLinks}`,
  ].join('<br>');
}

function renderClientCapabilityMatrix(matrix) {
  assertValidClientCapabilityMatrix(matrix);
  const lines = [
    '# 跨客户端能力矩阵',
    '',
    '> 此文件由 `docs/client-capability-matrix.json` 生成。修改能力声明或证据后运行 `node tools/generate-client-capability-matrix.js`；CI 使用 `--check` 拒绝漂移。',
    '',
    '这张矩阵描述的是**本仓库交付物拥有的适配 seam**，不是客户端宣传的协议支持列表：客户端能导入订阅，不等于本仓库可以在运行时读取、重写或投影该订阅。',
    '',
    '- **内置自动**：产物有受信任的运行时 hook，能在刷新订阅时执行该能力。',
    '- **手工文档**：仓库只提供本地配置 / Mixin / 原生字段的操作边界，不交付会读取机场源配置的自动 sidecar。',
    '- **无 / 不适用**：该产物只拥有路由、shunt rule 或静态出站模型；不要把它当作订阅 DNS 转换器。',
    '',
    '| 产品 | `subscription_input`<br>订阅输入 | `dynamic_grouping`<br>动态分组 | `node_dns_hint`<br>节点 DNS 提示 | `optional_node_dns_sidecar`<br>可选 Node-DNS sidecar |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (const product of matrix.products) {
    const artifactLinks = product.artifacts.map(markdownRepositoryLink).join('<br>');
    lines.push([
      `**${markdownEscape(product.name)}**<br>${artifactLinks}`,
      renderCapabilityCell(product.capabilities.subscription_input),
      renderCapabilityCell(product.capabilities.dynamic_grouping),
      renderCapabilityCell(product.capabilities.node_dns_hint),
      renderCapabilityCell(product.capabilities.optional_node_dns_sidecar),
    ].join(' | ').replace(/^/, '| ').concat(' |'));
  }

  lines.push(
    '',
    '## 判定边界',
    '',
    '- `runtime_hook` / `restricted_projection` 仅在 Clash Party、OpenClash、FlClash 的本仓库覆写入口中存在；其 profile 是本地受信任设置，不从订阅读取。',
    '- `engine_filter`、`client_regex_filter` 与 `engine_smart_filter` 说明客户端可以用本产物已声明的正则 / smart 机制选择节点；它们不表示拥有订阅 DNS 的运行时写入权。',
    '- `manual_mihomo_overlay` / `manual_native_config` 都要求用户在客户端自己的本地配置层合并 DNS；不能覆盖仓库的全局 DNS 基线，也不能把 Mihomo 字段直接复制到 Apple 私有配置、sing-box 或 Passwall。',
    `- 每个单元格的“证据”都是仓库内可机械校验的文件与 marker；\`tools/validate-artifact-contracts.js\` 会验证 schema、${PRODUCT_IDS.length} 个产品、4 个固定列、文件存在性与 marker。`,
    '',
    '延伸阅读：[私有节点 DNS：受限投影与跨端边界](./private-node-dns.md)。',
    '',
  );
  return lines.join('\n');
}

module.exports = {
  COLUMN_IDS,
  MATRIX_OUTPUT,
  MATRIX_SOURCE,
  PRODUCT_IDS,
  STATE_LABELS,
  assertValidClientCapabilityMatrix,
  defaultRepositoryRoot,
  formatIssues,
  readClientCapabilityMatrix,
  renderClientCapabilityMatrix,
  validateClientCapabilityMatrix,
};
