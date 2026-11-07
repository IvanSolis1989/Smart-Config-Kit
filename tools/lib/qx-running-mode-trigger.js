'use strict';

// Repository-supported syntax from crossutility/Quantumult-X sample.conf,
// af6fb594233ec4a3ec6d4ccb3601e9c36b75ea2d. Not a full Quantumult X parser.
const MODES = new Set(['filter', 'all_proxy', 'all_direct']);

function validateQxRunningModeTrigger(text) {
  const errors = [];
  let section = '';
  let count = 0;
  for (const [index, raw] of String(text).split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || /^(#|;|\/\/)/.test(line)) continue;
    const header = /^\[([^\]]+)\]$/.exec(line);
    if (header) { section = header[1]; continue; }
    const match = /^running_mode_trigger\s*=(.*)$/.exec(line);
    if (!match) continue;
    const at = `QX running_mode_trigger line ${index + 1}`;
    if (++count > 1) errors.push(`${at}: duplicate key`);
    if (section !== 'general') errors.push(`${at}: must be in [general]`);
    const values = match[1].split(',').map(value => value.trim());
    if (values.length < 2 || !MODES.has(values[0]) || !MODES.has(values[1])) {
      errors.push(`${at}: first two values must be filter, all_proxy or all_direct`);
    }
    const ssids = new Set();
    for (const value of values.slice(2)) {
      const colon = value.lastIndexOf(':');
      const ssid = value.slice(0, colon).trim();
      const mode = value.slice(colon + 1).trim();
      if (colon < 1 || !ssid || !MODES.has(mode)) {
        errors.push(`${at}: optional entries must be SSID:mode, not a bare mode`);
      } else if (ssids.has(ssid)) {
        errors.push(`${at}: duplicate SSID mapping`);
      } else {
        ssids.add(ssid);
      }
    }
  }
  return { ok: errors.length === 0, errors, count };
}

module.exports = { validateQxRunningModeTrigger };
