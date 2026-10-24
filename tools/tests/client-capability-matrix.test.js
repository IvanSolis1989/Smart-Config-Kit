#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  COLUMN_IDS,
  MATRIX_OUTPUT,
  PRODUCT_IDS,
  readClientCapabilityMatrix,
  renderClientCapabilityMatrix,
  validateClientCapabilityMatrix,
} = require('../lib/client-capability-matrix');

const REPOSITORY_ROOT = path.resolve(__dirname, '..', '..');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('client capability matrix covers every published product and has verified evidence', () => {
  const matrix = readClientCapabilityMatrix(REPOSITORY_ROOT);
  const validation = validateClientCapabilityMatrix(matrix, REPOSITORY_ROOT);
  assert.equal(validation.ok, true, validation.issues.map((issue) => `${issue.id}: ${issue.message}`).join('\n'));
  assert.deepEqual(matrix.columns, COLUMN_IDS);
  assert.deepEqual(matrix.products.map((product) => product.id), PRODUCT_IDS);
});

test('Karing is an explicit native-rule import with manual node groups and DNS', () => {
  const matrix = readClientCapabilityMatrix(REPOSITORY_ROOT);
  const product = matrix.products.find(item => item.id === 'karing');
  assert.ok(product, 'Karing must have its own capability record');
  assert.equal(product.capabilities.subscription_input.state, 'documented_manual');
  assert.equal(product.capabilities.dynamic_grouping.state, 'documented_manual');
  assert.equal(product.capabilities.node_dns_hint.state, 'documented_manual');
  assert.equal(product.capabilities.optional_node_dns_sidecar.state, 'not_available');
  assert.ok(product.artifacts.some(file => file.endsWith('/Karing/diversion_rules_custom.json')));
});

test('client capability matrix rejects missing capability columns and stale evidence markers', () => {
  const matrix = clone(readClientCapabilityMatrix(REPOSITORY_ROOT));
  delete matrix.products[0].capabilities.node_dns_hint;
  matrix.products[1].capabilities.dynamic_grouping.evidence[0].contains = 'missing matrix marker';
  const validation = validateClientCapabilityMatrix(matrix, REPOSITORY_ROOT);
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((issue) => issue.id.endsWith('capabilities.columns')));
  assert.ok(validation.issues.some((issue) => issue.id.endsWith('dynamic_grouping.evidence[0]')));
});

test('generated Markdown is deterministic and checked in', () => {
  const matrix = readClientCapabilityMatrix(REPOSITORY_ROOT);
  const rendered = renderClientCapabilityMatrix(matrix);
  const checkedIn = fs.readFileSync(path.join(REPOSITORY_ROOT, ...MATRIX_OUTPUT.split('/')), 'utf8');
  assert.equal(checkedIn, rendered);
  assert.match(rendered, /## Mihomo 内核系列/);
  assert.doesNotMatch(rendered, /\| 产品 \|/);
  for (const product of matrix.products) {
    assert.ok(rendered.includes(`<a id="${product.id}"></a>`));
    for (const column of COLUMN_IDS) {
      const capability = product.capabilities[column];
      assert.ok(rendered.includes(`\`${column}\` → \`${capability.mode}\``));
      assert.ok(rendered.includes(capability.summary));
    }
  }
  assert.match(rendered, /Clash Party/);
  assert.match(rendered, /Passwall2/);
});
