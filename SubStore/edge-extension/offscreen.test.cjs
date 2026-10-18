const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, 'offscreen.js'), 'utf8');
const ID = 'fixture', FRONTEND = 'http://127.0.0.1:14122', BACKEND = 'http://127.0.0.1:38324';
function fixture() {
  let listener; const frames = [], sends = [];
  const document = { createElement(name) { assert.equal(name, 'iframe'); const listeners = []; const frame = {
    contentWindow: { postMessage: (...args) => sends.push(args) }, remove() { this.removed = true; },
    addEventListener(type, callback) { assert.equal(type, 'load'); listeners.push(callback); }, load() { for (const callback of listeners) callback(); },
  }; frames.push(frame); return frame; }, body: { append() {} } };
  const chrome = { runtime: { id: ID, getURL: path => 'chrome-extension://' + ID + '/' + path, onMessage: { addListener(fn) { listener = fn; } } } };
  vm.runInNewContext(source, { document, chrome, URL });
  const sender = { id: ID, url: chrome.runtime.getURL('background.js') };
  const message = { type: 'CONFIGURE_LOCAL_OFFSCREEN', frontendUrl: FRONTEND, backendUrl: BACKEND, nonce: 'a'.repeat(64) };
  return { frames, sends, sender, message, send(m = message, s = sender) { let reply; const accepted = listener(m, s, value => { reply = value; }); return { accepted, reply }; } };
}
test('offscreen host only accepts the exact extension background and valid local endpoint pair', () => {
  const f = fixture();
  for (const sender of [{ id: 'other' }, { ...f.sender, tab: { id: 1 } }, { ...f.sender, url: 'http://127.0.0.1:14122/' }, { ...f.sender, url: 'chrome-extension://fixture/popup.html' }]) assert.equal(f.send(f.message, sender).reply, undefined);
  for (const message of [{ ...f.message, nonce: 'bad' }, { ...f.message, frontendUrl: 'https://evil.example' }, { ...f.message, backendUrl: BACKEND + '/api' }]) assert.equal(f.send(message).reply.configured, false);
  assert.equal(f.frames.length, 0);
});
test('same configuration reuses one iframe and passes only local endpoints and nonce to its exact origin', () => {
  const f = fixture(); f.send(); f.send(); assert.equal(f.frames.length, 1); f.frames[0].load();
  assert.equal(f.frames[0].src, FRONTEND + '/?api=' + encodeURIComponent(BACKEND));
  assert.equal(f.sends.length, 1); assert.equal(f.sends[0][1], FRONTEND); assert.equal(f.sends[0][0].nonce, f.message.nonce);
});
test('a replaced iframe late load cannot bind the replacement with an old nonce', () => {
  const f = fixture(); f.send(); f.send({ ...f.message, nonce: 'b'.repeat(64) });
  assert.equal(f.frames[0].removed, true); f.frames[0].load(); assert.equal(f.sends.length, 0);
  f.frames[1].load(); assert.equal(f.sends[0][0].nonce, 'b'.repeat(64));
});
