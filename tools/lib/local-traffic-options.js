'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');

const definitions = {
  healthCheckProfile: { name: 'SCKI_HEALTH_CHECK_PROFILE', values: ['standard', 'power-save'], default: 'standard' },
  quicPolicy: { name: 'SCKI_QUIC_POLICY', values: ['block-foreign', 'follow-rules'], default: 'block-foreign' },
  zeroTierPlanetProxy: { name: 'SCKI_ZEROTIER_PLANET_PROXY', values: [true, false], default: false },
};

// Mask comments and literals without executing the script. Offsets and newlines
// remain intact so only an actual, complete const declaration can supply a value.
function maskLiterals(source) {
  let result = '';
  let i = 0;
  let previous = '';
  const blank = (text) => text.replace(/[^\r\n]/g, ' ');
  while (i < source.length) {
    const start = i;
    const c = source[i];
    if (c === '/' && source[i + 1] === '/') {
      i = source.indexOf('\n', i);
      if (i < 0) i = source.length;
      result += blank(source.slice(start, i));
    } else if (c === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 2;
      result += blank(source.slice(start, i));
    } else if (c === "'" || c === '"' || c === '`' || (c === '/' && (!previous || /[=(:,!&|?;{\[]/.test(previous)))) {
      const quote = c;
      i++;
      let inClass = false;
      while (i < source.length) {
        if (source[i] === '\\') { i += 2; continue; }
        if (quote === '/' && source[i] === '[') inClass = true;
        if (quote === '/' && source[i] === ']') inClass = false;
        if (source[i++] === quote && !inClass) break;
      }
      result += blank(source.slice(start, i));
      previous = 'v';
    } else {
      result += c;
      i++;
      if (!/\s/.test(c)) previous = c;
    }
  }
  return result;
}

function parseLocalTrafficOptions(source, label = 'script') {
  // Compile for syntax validation only. No subscription input or target code runs.
  try { new vm.Script(source, { filename: label }); }
  catch (error) { throw new Error(`${label}: invalid JavaScript: ${error.message}`); }
  const masked = maskLiterals(source);
  const options = {};
  const declarations = {};
  for (const [key, definition] of Object.entries(definitions)) {
    const matches = [...masked.matchAll(new RegExp(`\\b(?:const|let|var)\\s+${definition.name}\\b`, 'g'))];
    if (matches.length > 1) throw new Error(`${label}: duplicate ${definition.name}`);
    if (!matches.length) continue;
    const at = matches[0].index;
    const start = source.lastIndexOf('\n', at - 1) + 1;
    const endAt = source.indexOf('\n', at);
    const end = endAt < 0 ? source.length : endAt;
    const line = source.slice(start, end).replace(/\r$/, '');
    const valuePattern = key === 'zeroTierPlanetProxy' ? '(true|false)' : "(['\"])([^'\"\\r\\n]+)\\1";
    const match = line.match(new RegExp(`^[\\ufeff \\t]*const ${definition.name}\\s*=\\s*${valuePattern}[ \\t]*;?[ \\t]*(?://[^\\r\\n]*)?$`));
    // A nested declaration is never a trusted local option.
    const prefix = masked.slice(0, at);
    const depth = [...prefix].reduce((n, c) => n + (c === '{' ? 1 : c === '}' ? -1 : 0), 0);
    if (!match || depth !== 0) throw new Error(`${label}: invalid trusted const ${definition.name}`);
    const value = key === 'zeroTierPlanetProxy' ? match[1] === 'true' : match[2];
    if (!definition.values.includes(value)) throw new Error(`${label}: invalid ${definition.name} value`);
    options[key] = value;
    declarations[key] = { start, end: start + line.length, line };
  }
  return { options, declarations };
}

function setLocalTrafficOptions(source, values, label = 'script') {
  const parsed = parseLocalTrafficOptions(source, label);
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const edits = [];
  const missing = [];
  for (const [key, value] of Object.entries(values)) {
    const definition = definitions[key];
    if (!definition || !definition.values.includes(value)) throw new Error(`Invalid local traffic option: ${key}`);
    const declaration = parsed.declarations[key];
    const literal = typeof value === 'boolean' ? String(value) : `'${value}'`;
    if (declaration) {
      if (parsed.options[key] !== value) edits.push({ ...declaration, text: declaration.line.replace(/(=\s*)(?:true|false|'[^']*'|"[^"]*")/, `$1${literal}`) });
    } else missing.push(`const ${definition.name} = ${literal}`);
  }
  for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  if (missing.length) {
    // Keep a BOM and shebang at the beginning of a first-deployment script.
    let at = source.charCodeAt(0) === 0xfeff ? 1 : 0;
    if (source.slice(at).startsWith('#!')) { const end = source.indexOf('\n', at); at = end < 0 ? source.length : end + 1; }
    source = source.slice(0, at) + missing.join(eol) + eol + source.slice(at);
  }
  parseLocalTrafficOptions(source, label);
  return source;
}

function planLocalTrafficOptions(targetSource, source = targetSource, requested = {}) {
  const target = parseLocalTrafficOptions(targetSource, 'target').options;
  const incoming = parseLocalTrafficOptions(source, 'source').options;
  const options = {};
  for (const [key, definition] of Object.entries(definitions)) {
    const preserve = key === 'zeroTierPlanetProxy' || requested.preserveLocal || source === targetSource;
    options[key] = requested[key] !== undefined ? requested[key]
      : preserve && target[key] !== undefined ? target[key]
      : incoming[key] !== undefined ? incoming[key] : definition.default;
  }
  return { original: targetSource, updated: setLocalTrafficOptions(source, options), options };
}

function writeLocalTrafficOptions(file, plan) {
  const target = path.resolve(file);
  const stat = fs.lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Target must be an existing regular JS file');
  const plannedOptions = parseLocalTrafficOptions(plan.updated, target).options;
  for (const [key, value] of Object.entries(plan.options)) if (plannedOptions[key] !== value) throw new Error(`Planned ${key} mismatch`);
  if (fs.readFileSync(target, 'utf8') !== plan.original) throw new Error('Target changed after planning');
  if (plan.original === plan.updated) return { changed: false, backup: null };
  const temporary = `${target}.${randomUUID()}.tmp`;
  const backup = `${target}.${new Date().toISOString().replace(/[:.]/g, '-')}.${randomUUID()}.bak`;
  let replaced = false;
  try {
    fs.writeFileSync(temporary, plan.updated, { encoding: 'utf8', flag: 'wx', mode: stat.mode });
    const saved = fs.readFileSync(temporary, 'utf8');
    if (saved !== plan.updated) throw new Error('Temporary file readback mismatch');
    parseLocalTrafficOptions(saved, temporary);
    fs.copyFileSync(target, backup, fs.constants.COPYFILE_EXCL);
    if (fs.readFileSync(target, 'utf8') !== plan.original) throw new Error('Target changed before replacement');
    fs.renameSync(temporary, target);
    replaced = true;
    if (fs.readFileSync(target, 'utf8') !== plan.updated) throw new Error('Saved file readback mismatch');
    const actual = parseLocalTrafficOptions(fs.readFileSync(target, 'utf8'), target).options;
    for (const [key, value] of Object.entries(plan.options)) if (actual[key] !== value) throw new Error(`Saved ${key} mismatch`);
    return { changed: true, backup };
  } catch (error) {
    if (replaced) {
      const expected = Buffer.from(plan.updated, 'utf8');
      const assertOwnedOutput = () => {
        let current;
        try { current = fs.readFileSync(target); }
        catch (readError) {
          throw new Error(`Local script conflict: target cannot be read; current target and backup preserved: ${backup}`, { cause: readError });
        }
        if (!current.equals(expected)) throw new Error(`Local script conflict: target changed after replacement; current target and backup preserved: ${backup}`, { cause: error });
      };
      // A failed readback may be a concurrent writer, not our own bad output.
      // Never restore the backup over content that this invocation does not own.
      assertOwnedOutput();
      fs.copyFileSync(backup, temporary);
      assertOwnedOutput();
      fs.renameSync(temporary, target);
    }
    throw error;
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

module.exports = { definitions, parseLocalTrafficOptions, setLocalTrafficOptions, planLocalTrafficOptions, writeLocalTrafficOptions };
