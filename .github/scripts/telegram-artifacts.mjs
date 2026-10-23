import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const helper = fileURLToPath(new URL('./telegram-files.py', import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function runHelper(arguments_, env = process.env) {
  const result = spawnSync(env.TELEGRAM_PYTHON || 'python3', [helper, ...arguments_], {
    encoding: 'utf8', env, timeout: 15 * 60 * 1000, maxBuffer: 1024 * 1024, windowsHide: true,
  });
  for (const line of (result.stderr || '').split(/\r?\n/)) {
    try {
      const diagnostic = JSON.parse(line);
      if (['inspect', 'sent', 'verified'].includes(diagnostic.stage)) console.error(JSON.stringify(diagnostic));
    } catch {}
  }
  if (result.error || result.status !== 0) throw new Error('Telegram artifact helper failed; inspect channel before retrying');
  return JSON.parse(result.stdout);
}

export async function prepareArtifacts(repository, release, fetcher = fetch, root = process.cwd()) {
  const directory = mkdtempSync(path.join(process.env.RUNNER_TEMP || tmpdir(), 'telegram-artifacts-'));
  if (release.kind === 'changelog') {
    return runHelper(['prepare', '--root', root, '--source', release.sha, '--output', directory]);
  }
  if (!release.assets?.length) throw new Error('Release has no downloadable artifacts');
  const files = [];
  for (const asset of release.assets) {
    if (path.basename(asset.name) !== asset.name || /[\\/:\x00-\x1f]/.test(asset.name) ||
        asset.state !== 'uploaded' || !Number.isSafeInteger(asset.size) || asset.size <= 0 || asset.size > 2_000_000_000 ||
        !/^sha256:[a-f0-9]{64}$/.test(asset.digest || '')) throw new Error('Invalid release artifact metadata');
    const url = new URL(asset.browser_download_url);
    if (url.origin !== 'https://github.com' || !url.pathname.startsWith(`/${repository}/releases/download/`)) {
      throw new Error('Artifact download URL is outside the official release');
    }
    let response;
    try { response = await fetcher(url, { signal: AbortSignal.timeout(180000) }); }
    catch { throw new Error('Release artifact download failed'); }
    if (!response.ok) throw new Error(`Artifact download returned HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const digest = sha256(bytes);
    if (bytes.length !== asset.size || `sha256:${digest}` !== asset.digest) throw new Error('Release artifact size/SHA256 mismatch');
    const destination = path.join(directory, asset.name);
    writeFileSync(destination, bytes);
    files.push({ path: destination, name: asset.name, size: bytes.length, sha256: digest });
  }
  return files;
}

export function validateUploadConfiguration(files, env) {
  const id = env.TELEGRAM_API_ID?.trim(), hash = env.TELEGRAM_API_HASH?.trim();
  if (id && hash) {
    if (!/^\d+$/.test(id) || !/^[a-fA-F0-9]{32}$/.test(hash)) throw new Error('Invalid Telegram API ID / API Hash format');
    return;
  }
  const maximum = env.VERIFY_FILES === 'true' ? 20_000_000 : 50_000_000;
  if (files.some(file => file.size > maximum)) {
    throw new Error('Large files require Actions Secrets: TELEGRAM_API_ID and TELEGRAM_API_HASH');
  }
  if (!env.TELEGRAM_BOT_TOKEN?.trim()) throw new Error('Missing Actions Secret: TELEGRAM_BOT_TOKEN');
}

export async function uploadArtifacts(files, caption, env = process.env, fetcher = fetch) {
  validateUploadConfiguration(files, env);
  const maximum = env.VERIFY_FILES === 'true' ? 20_000_000 : 50_000_000;
  if (env.NOTIFY_MODE !== 'verify' && files.every(file => file.size <= maximum)) return uploadCloud(files, caption, env, fetcher);
  const directory = mkdtempSync(path.join(env.RUNNER_TEMP || tmpdir(), 'telegram-upload-'));
  const manifest = path.join(directory, 'manifest.json');
  writeFileSync(manifest, JSON.stringify({ files, caption, verify_download: env.VERIFY_FILES === 'true' || env.NOTIFY_MODE === 'verify',
    verify_only: env.NOTIFY_MODE === 'verify', first_message_id: env.FIRST_MESSAGE_ID }));
  return runHelper(['upload', '--manifest', manifest], env);
}

async function uploadCloud(files, caption, env, fetcher) {
  const base = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN.trim()}`;
  const request = async (method, body) => {
    let response, data;
    try {
      response = await fetcher(`${base}/${method}`, { method: 'POST', body, signal: AbortSignal.timeout(600000) });
      data = await response.json();
    } catch { throw new Error(`Telegram ${method} failed; inspect channel before retrying`); }
    if (!response.ok || !data.ok) throw new Error(`Telegram ${method} failed with code ${data.error_code || response.status}`);
    return data.result;
  };
  const receipts = [];
  for (let offset = 0; offset < files.length; offset += 10) {
    const batch = files.slice(offset, offset + 10);
    const form = new FormData();
    form.set('chat_id', '-1003974315707');
    const media = [];
    for (const [index, file] of batch.entries()) {
      const bytes = readFileSync(file.path);
      if (bytes.length !== file.size || sha256(bytes) !== file.sha256) throw new Error('Prepared document SHA256 mismatch');
      const field = batch.length === 1 ? 'document' : `file${index}`;
      form.set(field, new Blob([bytes]), file.name);
      media.push({ type: 'document', media: `attach://${field}`, parse_mode: 'HTML', ...(index === 0 && offset === 0 ? { caption } : {}) });
    }
    if (batch.length === 1 && offset === 0) { form.set('caption', caption); form.set('parse_mode', 'HTML'); }
    if (batch.length > 1) form.set('media', JSON.stringify(media));
    const result = await request(batch.length === 1 ? 'sendDocument' : 'sendMediaGroup', form);
    const messages = Array.isArray(result) ? result : [result];
    if (messages.length !== batch.length) throw new Error('Incomplete Telegram document group');
    for (const [index, message] of messages.entries()) {
      const file = batch[index];
      if (message.document?.file_name !== file.name || message.document?.file_size !== file.size) throw new Error('Telegram document metadata mismatch');
      let verified = false;
      if (env.VERIFY_FILES === 'true') {
        const parameters = new FormData();
        parameters.set('file_id', message.document.file_id);
        const remote = await request('getFile', parameters);
        let bytes;
        try {
          const response = await fetcher(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN.trim()}/${remote.file_path}`, { signal: AbortSignal.timeout(180000) });
          if (!response.ok) throw new Error('Download failed');
          bytes = Buffer.from(await response.arrayBuffer());
        } catch { throw new Error('Telegram document read-back download failed'); }
        if (bytes.length !== file.size || sha256(bytes) !== file.sha256) throw new Error('Telegram document read-back SHA256 mismatch');
        verified = true;
      }
      receipts.push({ name: file.name, size: file.size, sha256: file.sha256, message_id: message.message_id, download_verified: verified });
    }
  }
  return { message_id: receipts[0].message_id, files: receipts };
}
