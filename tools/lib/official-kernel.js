'use strict';

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { sha256 } = require('./source-provenance');

const DIGEST = /^sha256:[0-9a-f]{64}$/;
const TAG = /^v[0-9][0-9A-Za-z.+-]*$/;

function officialKernelAsset(name, platform = process.platform, arch = process.arch) {
  const cpu = { x64: 'amd64', arm64: 'arm64' }[arch];
  if (!cpu || !['win32', 'linux', 'darwin'].includes(platform) || (platform === 'win32' && arch !== 'x64')) {
    return null;
  }
  const os = platform === 'win32' ? 'windows' : platform;
  const executable = platform === 'win32' ? `${name}.exe` : name;
  if (name === 'mihomo') {
    const variant = arch === 'x64' ? '-v1' : '';
    const prefix = `mihomo-${os}-${cpu}${variant}`;
    return {
      repo: 'MetaCubeX/mihomo',
      executable,
      archivedExecutable: platform === 'win32' ? `${prefix}.exe` : executable,
      archiveName: tag => `${prefix}-${tag}.${platform === 'win32' ? 'zip' : 'gz'}`,
    };
  }
  return { repo: 'SagerNet/sing-box', executable, archiveName: tag => `sing-box-${tag.slice(1)}-${os}-${cpu}.${platform === 'win32' ? 'zip' : 'tar.gz'}` };
}

function archiveUrl(spec, tag, assetName) {
  return `https://github.com/${spec.repo}/releases/download/${tag}/${assetName}`;
}

function cachedKernelFile(record, spec) {
  return `${record.digest.slice(7)}-${spec.executable}`;
}

function readCachedKernel(cacheDir, spec, expected) {
  try {
    const receipt = JSON.parse(fs.readFileSync(path.join(cacheDir, 'binary.json'), 'utf8'));
    if (!receipt || receipt.schema !== 1 || receipt.repo !== spec.repo || !TAG.test(receipt.release_tag)
      || receipt.asset_name !== spec.archiveName(receipt.release_tag) || !DIGEST.test(receipt.digest)
      || !Number.isSafeInteger(receipt.asset_id) || receipt.asset_id < 1
      || receipt.file !== cachedKernelFile(receipt, spec)
      || (expected && (receipt.release_tag !== expected.release_tag || receipt.digest !== expected.digest
        || receipt.asset_id !== expected.asset_id))) return null;
    const target = path.join(cacheDir, receipt.file);
    const bytes = fs.readFileSync(target);
    if (sha256(bytes) === receipt.sha256 && bytes.length === receipt.bytes) return target;
    return null;
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return null;
    throw error;
  }
}

function findExtractedBinary(root, name) {
  const directories = [root];
  while (directories.length) {
    const directory = directories.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) directories.push(candidate);
      else if (entry.isFile() && entry.name.toLowerCase() === name.toLowerCase()) return candidate;
    }
  }
  throw new Error(`Missing ${name} in verified kernel archive`);
}

function extractKernel(archive, bytes, staging, spec) {
  if (archive.endsWith('.tar.gz')) {
    childProcess.execFileSync('tar', ['-xzf', archive, '-C', staging], { windowsHide: true });
  } else if (archive.endsWith('.zip')) {
    childProcess.execFileSync('powershell.exe', ['-NoProfile', '-Command',
      'Expand-Archive -LiteralPath $env:SCKI_KERNEL_ARCHIVE -DestinationPath $env:SCKI_KERNEL_STAGE -Force'],
    { env: { ...process.env, SCKI_KERNEL_ARCHIVE: archive, SCKI_KERNEL_STAGE: staging }, windowsHide: true });
  } else {
    return zlib.gunzipSync(bytes);
  }
  return fs.readFileSync(findExtractedBinary(staging, spec.archivedExecutable || spec.executable));
}

async function ensureOfficialKernel({ spec, cacheDir, offline, preferCache, getRelease, download }) {
  if (offline || preferCache) {
    const cached = readCachedKernel(cacheDir, spec);
    if (cached) return cached;
    if (offline) throw new Error(`offline ${spec.executable.replace(/\.exe$/, '')} binary cache miss or hash mismatch; populate a verified cache or specify a local binary`);
  }

  const release = await getRelease(spec.repo);
  const tag = release.tag_name;
  if (!TAG.test(tag)) throw new Error(`Invalid release tag for ${spec.repo}: ${tag}`);
  const assetName = spec.archiveName(tag);
  const asset = release.assets.find(candidate => candidate.name === assetName);
  if (!asset || !DIGEST.test(asset.digest)) throw new Error(`Missing official SHA-256 for ${spec.repo} ${tag} ${assetName}`);
  if (!Number.isSafeInteger(asset.id) || asset.id < 1) throw new Error(`Invalid official asset ID for ${spec.repo} ${assetName}`);
  const url = archiveUrl(spec, tag, assetName);
  if (asset.browser_download_url !== url) throw new Error(`Unexpected download URL for ${spec.repo} ${assetName}`);
  const record = { schema: 1, repo: spec.repo, release_tag: tag, asset_id: asset.id, asset_name: assetName, digest: asset.digest };
  const cached = readCachedKernel(cacheDir, spec, record);
  if (cached) return cached;

  const bytes = await download(url);
  if (`sha256:${sha256(bytes)}` !== asset.digest) throw new Error(`Official SHA-256 mismatch for ${spec.repo} ${tag} ${assetName}`);
  fs.mkdirSync(cacheDir, { recursive: true });
  const staging = fs.mkdtempSync(path.join(cacheDir, '.kernel-'));
  try {
    const archive = path.join(staging, assetName);
    if (archive.endsWith('.zip') || archive.endsWith('.tar.gz')) fs.writeFileSync(archive, bytes);
    const binary = extractKernel(archive, bytes, staging, spec);
    record.file = cachedKernelFile(record, spec);
    record.sha256 = sha256(binary);
    record.bytes = binary.length;
    const stagedBinary = path.join(staging, record.file);
    const stagedReceipt = path.join(staging, 'binary.json');
    fs.writeFileSync(stagedBinary, binary, { mode: 0o755 });
    fs.writeFileSync(stagedReceipt, `${JSON.stringify(record, null, 2)}\n`);
    const target = path.join(cacheDir, record.file);
    fs.renameSync(stagedBinary, target);
    fs.renameSync(stagedReceipt, path.join(cacheDir, 'binary.json'));
    return target;
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

module.exports = { officialKernelAsset, ensureOfficialKernel };
