'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { renderScript } = require('../generate-meow');
const { planLocalTrafficOptions } = require('../lib/local-traffic-options');

test('AEROVE generated adapter refuses the Windows browser UDP opt-in it cannot enforce', () => {
  const input = fs.readFileSync(path.join(__dirname, '../../Mihomo内核系/FlClash/FlClash(mihomo).js'), 'utf8');
  const generated = renderScript(input, {});
  assert.throws(() => planLocalTrafficOptions(generated, generated, { browserUdpPolicy: 'reject' }), /browser|UDP|capability|support/i);
});
