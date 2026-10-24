#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const profiles = require('./lib/subscription-adapter-profiles');

const REPO_ROOT = path.resolve(__dirname, '..');
const JS_RUNTIME = 'tools/runtime/node-dns-hints.js';
const RUBY_RUNTIME = 'tools/runtime/node-dns-hints.rb';
const JS_TARGETS = [
  'Mihomo内核系/Clash Party/ClashParty(mihomo-smart).js',
  'Mihomo内核系/Clash Party/ClashParty(mihomo).js',
  'Mihomo内核系/FlClash/FlClash(mihomo).js',
];
const RUBY_TARGETS = [
  'Mihomo内核系/OpenClash/OpenClash(mihomo).sh',
  'Mihomo内核系/OpenClash/OpenClash(mihomo-smart).sh',
];
const JS_MARKERS = {
  begin: '// >>> SCKI NODE DNS HINTS: BEGIN',
  end: '// <<< SCKI NODE DNS HINTS: END',
};
const RUBY_MARKERS = {
  begin: '# >>> SCKI NODE DNS HINTS: BEGIN',
  end: '# <<< SCKI NODE DNS HINTS: END',
};

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function write(relativePath, source) {
  fs.writeFileSync(path.join(REPO_ROOT, relativePath), source, 'utf8');
}

function wrap(runtimePath, source, eol, markers) {
  const body = source.trimEnd().replace(/\r?\n/g, eol);
  return [
    `${markers.begin} — generated from ${runtimePath}; edit the runtime Module, then run this synchronizer.`,
    body,
    markers.end,
  ].join(eol);
}

function buildRuntimeSource(language, contract) {
  const profileRuntime = language === 'js'
    ? profiles.renderJavaScriptProfileRuntime(contract)
    : profiles.renderRubyProfileRuntime(contract);
  const nodeDnsRuntime = read(language === 'js' ? JS_RUNTIME : RUBY_RUNTIME);
  return `${profileRuntime}\n\n${nodeDnsRuntime}`;
}

function syncTrustedProfileDefault(relativePath, language, profileDefault, checkOnly) {
  const source = read(relativePath);
  const declaration = language === 'js'
    ? /^const SCKI_SUBSCRIPTION_ADAPTER_PROFILE = '(?:off|policy|adaptive)'$/m
    : /^SCKI_SUBSCRIPTION_ADAPTER_PROFILE="\$\{SCKI_SUBSCRIPTION_ADAPTER_PROFILE:-(?:off|policy|adaptive)\}"$/m;
  const replacement = language === 'js'
    ? `const SCKI_SUBSCRIPTION_ADAPTER_PROFILE = '${profileDefault}'`
    : `SCKI_SUBSCRIPTION_ADAPTER_PROFILE="${'${'}SCKI_SUBSCRIPTION_ADAPTER_PROFILE:-${profileDefault}}"`;
  if (!declaration.test(source)) {
    throw new Error(`${relativePath}: trusted local subscription profile declaration is missing or unsupported`);
  }
  let updated = source.replace(declaration, replacement);
  if (language === 'shell') {
    const invalidFallback = /^  \*\) SCKI_SUBSCRIPTION_ADAPTER_PROFILE="(?:off|policy|adaptive)" ;;$/m;
    if (!invalidFallback.test(source)) {
      throw new Error(`${relativePath}: shell subscription profile fallback is missing or unsupported`);
    }
    updated = updated.replace(invalidFallback, `  *) SCKI_SUBSCRIPTION_ADAPTER_PROFILE="${profileDefault}" ;;`);
  }
  if (updated === source) return false;
  if (checkOnly) throw new Error(`${relativePath}: trusted local subscription profile default is out of sync with ${profiles.PROFILE_SOURCE}`);
  write(relativePath, updated);
  return true;
}

function replaceBlock(source, block, anchor, relativePath, eol, startAt, markers) {
  const begin = source.indexOf(markers.begin, startAt);
  if (begin !== -1) {
    const end = source.indexOf(markers.end, begin);
    if (end === -1) throw new Error(`${relativePath}: missing ${markers.end}`);
    const after = end + markers.end.length;
    return source.slice(0, begin) + block + source.slice(after);
  }
  const index = source.indexOf(anchor, startAt);
  if (index === -1) throw new Error(`${relativePath}: insertion anchor not found`);
  return source.slice(0, index) + block + (source.slice(index).startsWith('\r\n') || source.slice(index).startsWith('\n') ? '' : eol + eol) + source.slice(index);
}

function syncTarget(relativePath, runtimePath, runtime, anchor, checkOnly, scopeAnchor = null, markers = JS_MARKERS) {
  const source = read(relativePath);
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const startAt = scopeAnchor ? source.indexOf(scopeAnchor) : 0;
  if (startAt === -1) throw new Error(`${relativePath}: scope anchor not found`);
  const block = wrap(runtimePath, runtime, eol, markers);
  const updated = replaceBlock(source, block, anchor, relativePath, eol, startAt, markers);
  if (updated === source) return false;
  if (checkOnly) throw new Error(`${relativePath}: embedded Node-DNS hint Module is out of sync with ${runtimePath}`);
  write(relativePath, updated);
  return true;
}

function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--help') || args.has('-h')) {
    console.log('Usage: node tools/sync-node-dns-hints-adapters.js [--check]');
    return;
  }
  for (const arg of args) {
    if (arg !== '--check') throw new Error(`Unknown argument: ${arg}`);
  }
  const checkOnly = args.has('--check');
  const contract = profiles.assertValidProfileContract(profiles.readProfileContract(REPO_ROOT));
  const jsRuntime = buildRuntimeSource('js', contract);
  const rubyRuntime = buildRuntimeSource('ruby', contract);
  const jsRuntimePath = `${profiles.PROFILE_SOURCE} + ${JS_RUNTIME}`;
  const rubyRuntimePath = `${profiles.PROFILE_SOURCE} + ${RUBY_RUNTIME}`;
  const changed = [];
  for (const target of JS_TARGETS) {
    if (syncTarget(target, jsRuntimePath, jsRuntime, '//  模块 I：全局参数覆写', checkOnly)) changed.push(target);
    if (syncTrustedProfileDefault(target, 'js', contract.default, checkOnly) && !changed.includes(target)) changed.push(target);
  }
  for (const target of RUBY_TARGETS) {
    if (syncTarget(target, rubyRuntimePath, rubyRuntime, '# ---------------------------------------------------------------\n# Phase 1a:', checkOnly, 'cat > "$RUBY_SCRIPT" << \'RUBY_EOF\'', RUBY_MARKERS)) changed.push(target);
    if (syncTrustedProfileDefault(target, 'shell', contract.default, checkOnly) && !changed.includes(target)) changed.push(target);
  }
  if (checkOnly) {
    console.log('PASS Node-DNS hint runtime Modules are synchronized');
  } else {
    console.log(`SYNC Node-DNS hint runtime Modules: ${changed.length ? changed.join(', ') : 'already current'}`);
  }
}

try {
  main();
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
}
