'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { clientDirectory } = require('../lib/client-layout');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const shell = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : '/bin/sh';

function runScript(t, app, backend, mode = '--replace', options = {}) {
  assert.ok(fs.existsSync(shell), 'A real POSIX shell is required to verify generated scripts');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-passwall-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const config = path.join(temp, 'config').replace(/\\/g, '/');
  const log = path.join(temp, 'writes').replace(/\\/g, '/');
  fs.writeFileSync(config, 'fixture');
  const file = `${clientDirectory(app)}/${app}(xray+sing-box)-apply.sh`;
  let source = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
  // Redirect only the router config existence probe to the isolated fixture.
  // The generated preflight, cleanup, add calls and commit execute unmodified.
  source = source.replace('if [ ! -f "/etc/config/${CONFIG_NAME}" ]; then', `if [ ! -f '${config}' ]; then`);
  const prelude = `uci() {
    if [ "$1" = show ]; then
      [ "$SCKI_TEST_READ_FAILURE" != 1 ] || return 1
      [ "$SCKI_TEST_NO_SHUNT" != 1 ] || return 0
      printf '%s\\n' "$CONFIG_NAME.fixture=nodes"
      if [ "$SCKI_TEST_MIXED" = 1 ] || [ "$SCKI_TEST_PROTOCOL_FAILURE" = 1 ] || [ "$SCKI_TEST_TYPE_FAILURE" = 1 ]; then printf '%s\\n' "$CONFIG_NAME.other=nodes"; fi
      if [ "$SCKI_TEST_ORDINARY" = 1 ]; then
        printf '%s\\n' "$CONFIG_NAME.ordinary_socks=nodes" "$CONFIG_NAME.ordinary_ssrust=nodes" "$CONFIG_NAME.ordinary_ssr=nodes" "$CONFIG_NAME.regular_native=nodes"
        if [ "$CONFIG_NAME" = passwall ]; then printf '%s\\n' "$CONFIG_NAME.ordinary_hysteria2=nodes" "$CONFIG_NAME.ordinary_naive=nodes"; fi
      fi
      if [ "$SCKI_TEST_UNKNOWN_ORDINARY" = 1 ]; then printf '%s\\n' "$CONFIG_NAME.ordinary_unknown=nodes"; fi
      return 0
    fi
    if [ "$1" = -q ] && [ "$2" = get ]; then
      case "$3" in
        *.ordinary_*.protocol) return 1 ;;
        *.ordinary_socks.type) printf '%s\\n' Socks ;;
        *.ordinary_ssrust.type) printf '%s\\n' SS-Rust ;;
        *.ordinary_ssr.type) printf '%s\\n' SSR ;;
        *.ordinary_hysteria2.type) printf '%s\\n' Hysteria2 ;;
        *.ordinary_naive.type) printf '%s\\n' Naiveproxy ;;
        *.ordinary_unknown.type) printf '%s\\n' FutureCore ;;
        *.regular_native.protocol) printf '%s\\n' vmess ;;
        *.regular_native.type) printf '%s\\n' Xray ;;
        *.other.protocol) [ "$SCKI_TEST_PROTOCOL_FAILURE" != 1 ] || return 1; printf '%s\\n' _shunt ;;
        *.protocol) printf '%s\\n' _shunt ;;
        *.other.type) [ "$SCKI_TEST_TYPE_FAILURE" != 1 ] || return 1; printf '%s\\n' Xray ;;
        *.type) printf '%s\\n' "$SCKI_TEST_BACKEND" ;;
        *) return 1 ;;
      esac
      return 0
    fi
    printf '%s\\n' "$*" >> "$SCKI_TEST_LOG"
    [ "$1" != add ] || printf '%s\\n' new_rule
  }
`;
  const result = spawnSync(shell, ['-s', '--', mode], { input: prelude + source, encoding: 'utf8',
    env: { ...process.env, SCKI_TEST_LOG: log, SCKI_TEST_BACKEND: backend,
      SCKI_TEST_READ_FAILURE: options.readFailure ? '1' : '0', SCKI_TEST_NO_SHUNT: options.noShunt ? '1' : '0', SCKI_TEST_MIXED: options.mixed ? '1' : '0', SCKI_TEST_PROTOCOL_FAILURE: options.protocolFailure ? '1' : '0',
      SCKI_TEST_TYPE_FAILURE: options.typeFailure ? '1' : '0', SCKI_TEST_ORDINARY: options.ordinary ? '1' : '0', SCKI_TEST_UNKNOWN_ORDINARY: options.unknownOrdinary ? '1' : '0' },
    timeout: 20000, windowsHide: true });
  if (result.error) throw result.error;
  return { ...result, writes: fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : [] };
}

for (const app of ['Passwall', 'Passwall2']) {
  for (const backend of ['Xray', '', 'unknown']) test(`${app} refuses ${backend || 'missing'} backend before any UCI write`, t => {
    const result = runScript(t, app, backend);
    assert.notEqual(result.status, 0);
    assert.equal(result.writes.length, 0);
    assert.match(result.stderr, /SRS.*sing-box/);
  });
  for (const options of [{ noShunt: true }, { readFailure: true }, { mixed: true }, { protocolFailure: true }, { typeFailure: true }, { unknownOrdinary: true }]) test(`${app} fails closed for ${JSON.stringify(options)}`, t => {
    const result = runScript(t, app, 'sing-box', '--replace', options);
    assert.notEqual(result.status, 0);
    assert.equal(result.writes.length, 0);
  });
  test(`${app} accepts ordinary nodes without protocol and a non-shunt Xray node`, t => {
    const result = runScript(t, app, 'sing-box', '--append', { ordinary: true });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.writes.filter(x => x.startsWith('add ')).length, 78);
    assert.equal(result.writes.filter(x => x.startsWith('commit ')).length, 1);
  });
  for (const mode of ['--replace', '--append']) test(`${app} executes all generated rules with verified sing-box (${mode})`, t => {
    const result = runScript(t, app, 'sing-box', mode);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.writes.filter(x => x.startsWith('add ')).length, 78);
    assert.equal(result.writes.filter(x => x.startsWith('add_list ') && x.includes('.domain_list=rule-set:remote:')).length, 78);
    assert.equal(result.writes.filter(x => x.startsWith('commit ')).length, 1);
    assert.equal(result.writes.filter(x => x.startsWith('delete ')).length, 0);
  });
}
