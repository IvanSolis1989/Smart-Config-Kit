#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { renderProfile } = require('../generate-egern-from-cmfa');

test('Egern explanatory source header stays a single block when rendered repeatedly', () => {
  const { output } = renderProfile([], new Map(), new Map(), { assetCount: 0 });
  const generatedFromLines = output.match(/^# Generated from .*CMFA\(mihomo\)\.yaml\.$/gm) || [];

  assert.equal(generatedFromLines.length, 1, 'profile should contain one Generated from header');
  assert.match(output, /# Generated from Mihomo内核系\/Clash Meta For Android\/CMFA\(mihomo\)\.yaml\./);
});
