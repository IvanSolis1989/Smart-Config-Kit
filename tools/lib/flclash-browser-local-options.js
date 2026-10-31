'use strict';

const { definitions } = require('./configuration-schema');
const { parseLocalTrafficOptions, planLocalTrafficOptions } = require('./local-traffic-options');

// Build-time only. The maintained CLI parser compiles but never executes the
// trusted source, and supplies the exact top-level declaration offsets.
function buildFlClashLocalOptionTemplates(canonicalSource, profileSource, profilePrefixLength) {
  const schema = JSON.parse(JSON.stringify(definitions));
  const parsed = parseLocalTrafficOptions(canonicalSource, 'canonical FlClash');
  const keys = Object.keys(schema);
  for (const key of keys) {
    if (!parsed.declarations[key] || parsed.options[key] !== schema[key].default) throw new Error(`Canonical FlClash local option/default mismatch: ${key}`);
    if (schema[key].values?.some(value => typeof value === 'string' && !/^[a-z][a-z0-9-]*$/.test(value))) throw new Error(`Unsafe local option literal catalog: ${key}`);
  }
  const dnsProfiles = schema.subscriptionAdapterProfile.values.slice();
  for (const profile of dnsProfiles) {
    planLocalTrafficOptions(canonicalSource, canonicalSource, { subscriptionAdapterProfile: profile });
  }
  function template(source, parsedSource, end = source.length) {
    const ranges = keys.map(key => {
      const declaration = parsedSource.declarations[key];
      if (!declaration || parsedSource.options[key] !== parsed.options[key]) throw new Error(`Profile local option declaration differs: ${key}`);
      const literal = /^(.*?=\s*)("[^"\r\n]*"|'[^'\r\n]*'|[^;\s/]+)([ \t]*;?[ \t]*(?:\/\/[^\r\n]*)?)$/.exec(declaration.line);
      if (!literal) throw new Error(`Trusted local literal slot missing: ${key}`);
      const start = declaration.start + literal[1].length;
      const finish = start + literal[2].length;
      if (finish > end) throw new Error(`Trusted local literal slot escaped the source prefix: ${key}`);
      return { key, start, end: finish, literal: literal[2], sourceValue: parsed.options[key] };
    }).sort((a, b) => a.start - b.start);
    let cursor = 0;
    const segments = [], slots = [];
    for (const range of ranges) {
      if (range.start < cursor) throw new Error('Overlapping trusted local option slots');
      segments.push(source.slice(cursor, range.start));
      slots.push({ key: range.key, literal: range.literal, sourceValue: range.sourceValue });
      cursor = range.end;
    }
    segments.push(source.slice(cursor, end));
    return { segments, slots };
  }
  const profile = parseLocalTrafficOptions(profileSource, 'FlClash business template');
  return {
    schema,
    capabilities: { nodeDnsProfiles: dnsProfiles, constants: keys.map(key => schema[key].name) },
    templates: { canonical: template(canonicalSource, parsed), profilePrefix: template(profileSource, profile, profilePrefixLength) },
  };
}

// Accept ordinary data records from either browser/VM realm without invoking
// getters, iterators or Symbol.toStringTag. Custom prototypes are refused.
function readFlClashDataOptions(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} options must be a plain data object`);
  const prototype = Object.getPrototypeOf(value);
  const constructor = prototype && Object.getOwnPropertyDescriptor(prototype, 'constructor');
  const name = constructor && Object.prototype.hasOwnProperty.call(constructor, 'value') && typeof constructor.value === 'function'
    ? Object.getOwnPropertyDescriptor(constructor.value, 'name') : null;
  if (!prototype || Object.getPrototypeOf(prototype) !== null || !name || name.value !== 'Object') throw new Error(`${label} options must have a plain object prototype`);
  const result = {};
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !allowed.includes(key)) throw new Error(`Unknown ${label} option`);
    const property = Object.getOwnPropertyDescriptor(value, key);
    if (!property || !Object.prototype.hasOwnProperty.call(property, 'value')) throw new Error(`${label} options must be data properties`);
    result[key] = property.value;
  }
  return result;
}

function readFlClashServiceIds(value) {
  if (!Array.isArray(value)) throw new Error('Business enable must contain unique string service ids');
  const length = Object.getOwnPropertyDescriptor(value, 'length').value;
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || key !== 'length' && (!/^(?:0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)) throw new Error('Business enable must be a plain dense array');
  }
  const ids = [];
  for (let index = 0; index < length; index++) {
    const property = Object.getOwnPropertyDescriptor(value, String(index));
    if (!property || !Object.prototype.hasOwnProperty.call(property, 'value') || typeof property.value !== 'string') throw new Error('Business enable must contain only string data values without holes');
    ids.push(property.value);
  }
  if (new Set(ids).size !== ids.length) throw new Error('Business enable must contain unique string service ids');
  return ids;
}

function resolveFlClashLocalOptions(schema, requested) {
  const selected = requested === undefined ? {} : readFlClashDataOptions(requested, Object.keys(schema), 'local');
  const effective = {};
  for (const key of Object.keys(schema)) {
    const definition = schema[key];
    const value = Object.prototype.hasOwnProperty.call(selected, key) ? selected[key] : definition.default;
    const valid = definition.type === 'nullable-positive-number'
      ? value === null || typeof value === 'number' && Number.isFinite(value) && value > 0
      : definition.values.includes(value);
    if (!valid) throw new Error(`Invalid local option value: ${key}`);
    effective[key] = value;
  }
  return effective;
}

function formatFlClashLocalLiteral(value) {
  if (value === null || typeof value === 'boolean') return String(value);
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return String(value);
  if (typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value)) return `'${value}'`;
  throw new Error('Invalid typed local option literal');
}

function renderFlClashLocalOptionTemplate(template, effective) {
  if (!template || !Array.isArray(template.slots) || !Array.isArray(template.segments) || template.segments.length !== template.slots.length + 1) throw new Error('Invalid trusted local option template');
  let source = template.segments[0];
  for (let index = 0; index < template.slots.length; index++) {
    const slot = template.slots[index], value = effective[slot.key];
    source += value === slot.sourceValue ? slot.literal : formatFlClashLocalLiteral(value);
    source += template.segments[index + 1];
  }
  return source;
}

module.exports = { buildFlClashLocalOptionTemplates, readFlClashDataOptions, readFlClashServiceIds,
  resolveFlClashLocalOptions, formatFlClashLocalLiteral, renderFlClashLocalOptionTemplate };
