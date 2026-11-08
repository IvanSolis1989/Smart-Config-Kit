'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { registrationChecklist, auditRegistration } = require('../lib/karing-registration');
const profile = {rules: [
  {name: 'A', rule_set: ['https://example.test/a.srs']},
  {name: 'B', rule_set: ['https://example.test/a.srs', 'https://example.test/b.json']}
]};
test('URL references without remote registry reproduce missing-registration state', () => {
  const result = auditRegistration(profile, {rule_set_items: []});
  assert.equal(result.registration_complete, false);
  assert.equal(result.expected_resource_count, 2);
  assert.deepEqual(result.groups_requiring_save, ['A', 'B']);
});
test('official edit-save remote registration closes registration only, not download acceptance', () => {
  const items = registrationChecklist(profile).map(({groups, ...item}) => item);
  const before = JSON.stringify(profile);
  const result = auditRegistration(profile, {rule_set_items: items});
  assert.equal(result.registration_complete, true);
  assert.equal(result.download_verified, false);
  assert.equal(JSON.stringify(profile), before);
});
test('wrong format, tag or URL do not satisfy referenced registration', () => {
  for (const field of ['type', 'tag', 'format', 'url']) {
    const items = registrationChecklist(profile).map(({groups, ...item}) => item);
    items[0][field] = 'wrong';
    assert.equal(auditRegistration(profile, {rule_set_items: items}).missing_resource_count, 1);
  }
});
test('custom-rule export is not evidence of an internal registry', () => {
  assert.throws(() => auditRegistration(profile, profile), /not registration evidence/);
});
test('registration metadata is not injected into the custom-rule schema', () => {
  const { buildKaring, readInputs } = require('../generate-karing');
  const built = buildKaring(readInputs());
  assert.deepEqual(Object.keys(built.profile), ['rules']);
  assert.equal(built.manifest.import_activation.status, 'requires-client-registration');
  assert.equal(built.manifest.import_activation.expected_resource_count, registrationChecklist(built.profile).length);
});
