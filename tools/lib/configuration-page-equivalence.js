'use strict';

const { inflateSync } = require('node:zlib');
const start = "const bundle = JSON.parse(fflate.strFromU8(fflate.unzlibSync(Uint8Array.from(atob('";
const end = "'), char => char.charCodeAt(0)))));";
function split(page) {
  const offset = page.indexOf(start);
  if (offset < 0 || page.indexOf(start, offset + start.length) !== -1) return null;
  const from = offset + start.length, to = page.indexOf(end, from);
  if (to < 0) return null;
  const encoded = page.slice(from, to);
  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
  const compressed = Buffer.from(encoded, 'base64');
  if (compressed.toString('base64') !== encoded) return null;
  return { before: page.slice(0, from), after: page.slice(to), compressed };
}
// Node/zlib releases can emit different valid DEFLATE streams. Only that one
// embedded stream may differ: UI, code, license and all surrounding bytes must
// match exactly, and the inflated serialized catalog must be byte-identical.
function configurationPagesEquivalent(actual, expected) {
  const a = split(actual), b = split(expected);
  if (!a || !b || a.before !== b.before || a.after !== b.after) return false;
  try {
    const reference = inflateSync(b.compressed);
    const result = inflateSync(a.compressed, { maxOutputLength: Math.max(1, reference.length + 1), info: true });
    // Reject trailing bytes even when zlib would otherwise ignore them.
    return result.engine.bytesWritten === a.compressed.length && result.buffer.equals(reference);
  } catch { return false; }
}
module.exports = { configurationPagesEquivalent };
