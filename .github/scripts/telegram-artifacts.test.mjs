import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { prepareArtifacts, uploadArtifacts, validateUploadConfiguration } from './telegram-artifacts.mjs';

test('downloads the exact original release bytes and verifies size and digest', async t => {
  const bytes = Buffer.from('original signed APK bytes');
  const asset = { name: 'Aerove.apk', state: 'uploaded', size: bytes.length,
    digest: 'sha256:' + createHash('sha256').update(bytes).digest('hex'),
    browser_download_url: 'https://github.com/IvanSolis1989/Aerove/releases/download/v1/Aerove.apk' };
  const files = await prepareArtifacts('IvanSolis1989/Aerove', { assets: [asset] }, async () => new Response(bytes));
  t.after(() => rmSync(path.dirname(files[0].path), { recursive: true }));
  assert.deepEqual(readFileSync(files[0].path), bytes);
  assert.equal(files[0].sha256, asset.digest.slice(7));
  await assert.rejects(prepareArtifacts('IvanSolis1989/Aerove', { assets: [asset] }, async () => new Response('corrupted')), /mismatch/);
  await assert.rejects(prepareArtifacts('IvanSolis1989/Aerove', { assets: [{ ...asset, name: '../escape.apk' }] }), /metadata/);
  await assert.rejects(prepareArtifacts('IvanSolis1989/Aerove', { assets: [{ ...asset, browser_download_url: 'https://other.example/a.apk' }] }), /outside/);
});

test('uploads a real small document and verifies downloaded Telegram bytes', async t => {
  const bytes = Buffer.from('configuration package');
  const hash = createHash('sha256').update(bytes).digest('hex');
  const files = await prepareArtifacts('IvanSolis1989/Aerove', { assets: [{ name: 'config.zip', state: 'uploaded', size: bytes.length,
    digest: 'sha256:' + hash, browser_download_url: 'https://github.com/IvanSolis1989/Aerove/releases/download/v1/config.zip' }] }, async () => new Response(bytes));
  t.after(() => rmSync(path.dirname(files[0].path), { recursive: true }));
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push(url);
    if (url.endsWith('/sendDocument')) {
      assert.equal(options.body.get('caption'), 'summary');
      assert.deepEqual(Buffer.from(await options.body.get('document').arrayBuffer()), bytes);
      return Response.json({ ok: true, result: { message_id: 23, document: { file_name: 'config.zip', file_size: bytes.length, file_id: 'id' } } });
    }
    if (url.endsWith('/getFile')) return Response.json({ ok: true, result: { file_path: 'documents/file.zip' } });
    return new Response(bytes);
  };
  const result = await uploadArtifacts(files, 'summary', { TELEGRAM_BOT_TOKEN: 'fake-token', VERIFY_FILES: 'true' }, fetcher);
  assert.equal(result.files[0].sha256, hash);
  assert.equal(result.files[0].download_verified, true);
  assert.equal(calls.length, 3);
  assert.throws(() => validateUploadConfiguration([{ size: 67_210_714 }], { TELEGRAM_BOT_TOKEN: 'fake-token' }), /TELEGRAM_API_ID/);
});
