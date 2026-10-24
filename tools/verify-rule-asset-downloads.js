#!/usr/bin/env node
'use strict';

// Online acceptance: download public RULE-SET assets and compare saved content.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { localPathForRepositoryRuleUrl, REPOSITORY_URL_PREFIXES } = require('./lib/repository-rule-asset');

const ROOT = path.resolve(__dirname, '..');
const TEXT_EXTENSIONS = new Set(['.txt', '.list', '.conf', '.yaml', '.yml', '.json']);
const RULE_LINE = /^(?:DOMAIN(?:-SUFFIX|-KEYWORD|-WILDCARD|-REGEX)?|IP-CIDR6?|IP-ASN|GEOIP|GEOSITE|PROCESS-NAME|PROCESS-PATH|USER-AGENT|URL-REGEX|DEST-PORT|DST-PORT|SRC-IP(?:-CIDR)?|SRC-PORT|AND|OR|NOT|NETWORK),/;
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

function validateProxy(proxy) {
  if (proxy === undefined) return;
  let parsed;
  try { parsed = new URL(proxy); } catch { throw new Error('proxy must be an HTTP(S) URL'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname
    || parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error('proxy must be an HTTP(S) host endpoint');
}

function redactProxy(proxy) {
  if (!proxy) return null;
  const parsed = new URL(proxy);
  return `${parsed.protocol}//${parsed.host}`;
}

function redactTransportText(text, proxy) {
  let result = String(text || '');
  if (proxy) {
    const parsed = new URL(proxy);
    result = result.split(proxy).join(redactProxy(proxy));
    // Curl diagnostics or a proxy may echo URL-encoded or decoded credentials.
    for (const token of [parsed.username, parsed.password]) {
      if (!token) continue;
      result = result.split(token).join('[redacted]');
      try { result = result.split(decodeURIComponent(token)).join('[redacted]'); } catch { /* already encoded */ }
    }
  }
  return result.replace(/(https?:\/\/)[^\s/]+@/g, '$1[redacted]@');
}

function validateSeconds(value, label) {
  if (!Number.isInteger(value) || value < 1 || value > 600) throw new Error(`${label} must be 1..600 seconds`);
}

function collectRuleUrls(source) {
  return [...new Set(source.split(/\r?\n/).flatMap((line) => {
    const match = line.trim().match(/^RULE-SET,\s*(https?:\/\/[^,\s]+)\s*,/i);
    return match ? [match[1]] : [];
  }))];
}

function canonicalBytes(bytes) {
  // Only CRLF -> LF; no trimming, BOM removal, sorting or rule rewriting.
  return Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
}

function inspectDownload(url, downloaded, localPath) {
  const body = downloaded.body || Buffer.alloc(0);
  const result = {
    url, status: downloaded.status || 0, bytes: body.length,
    sha256: hash(body), contentType: downloaded.contentType || null,
    effectiveUrl: downloaded.effectiveUrl || url, ok: false,
    httpVersion: downloaded.httpVersion || null,
    localPath: localPath ? path.relative(ROOT, localPath).replace(/\\/g, '/') : null,
    match: 'not-applicable',
  };
  if (downloaded.error) result.error = downloaded.error;
  if (downloaded.responseHeaders) result.responseHeaders = downloaded.responseHeaders;
  if (result.status !== 200) result.failure = `HTTP ${result.status}`;
  else if (downloaded.error) result.failure = 'download failed';
  else if (!body.length) result.failure = 'empty body';
  if (!localPath && REPOSITORY_URL_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    result.match = 'missing-local-file';
    result.failure ||= 'local repository asset missing';
  }
  const extension = path.extname(localPath || new URL(url).pathname).toLowerCase();
  const isText = TEXT_EXTENSIONS.has(extension);
  if (isText && body.length) result.canonicalSha256 = hash(canonicalBytes(body));
  if (!result.failure && isText) {
    const text = body.toString('utf8');
    if (/^\s*(?:<!doctype html|<html|404: Not Found|Failed to fetch|Package size exceeded)/i.test(text)
      || (new Set(['.list', '.txt', '.conf']).has(extension)
        && !text.split(/\r?\n/).some((line) => RULE_LINE.test(line.trim())))) {
      result.failure = 'body is not a rule set';
    }
  }
  if (localPath) {
    if (!fs.existsSync(localPath)) {
      result.match = 'missing-local-file';
      result.failure ||= 'local asset missing';
    } else {
      const local = fs.readFileSync(localPath);
      result.localBytes = local.length;
      result.localSha256 = hash(local);
      if (isText) result.localCanonicalSha256 = hash(canonicalBytes(local));
      result.match = result.sha256 === result.localSha256 ? 'byte-exact'
        : isText && result.canonicalSha256 === result.localCanonicalSha256 ? 'canonical-lf' : 'mismatch';
      if (result.match === 'mismatch') result.failure ||= 'local content hash mismatch';
    }
  }
  result.ok = !result.failure;
  return result;
}

async function downloadWithCurl(url, { timeoutSeconds = 60, proxy, captureHeaders = false, curlBin = process.env.SCKI_CURL_BIN || (process.platform === 'win32' ? 'curl.exe' : 'curl') } = {}) {
  validateProxy(proxy);
  validateSeconds(timeoutSeconds, 'timeout');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-rule-download-'));
  const file = path.join(directory, 'body');
  const headerFile = path.join(directory, 'headers');
  try {
    const processResult = await new Promise((resolve) => {
      const child = spawn(curlBin, [
        '--silent', '--show-error', '--location', '--fail-with-body',
        ...(proxy ? ['--proxy', proxy, '--noproxy', ''] : []),
        '--proto', '=http,https', '--proto-redir', '=http,https', '--max-redirs', '5',
        '--connect-timeout', String(Math.min(15, timeoutSeconds)),
        '--max-time', String(timeoutSeconds), '--max-filesize', String(32 * 1024 * 1024),
        '--output', file, '--write-out', '%{http_code}\n%{content_type}\n%{url_effective}\n%{http_version}',
        ...(captureHeaders ? ['--dump-header', headerFile] : []), '--url', url,
      ], { windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      const timer = setTimeout(() => child.kill(), (timeoutSeconds + 2) * 1000);
      child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk) => { stderr = (stderr + chunk.toString()).slice(-1500); });
      child.once('error', (error) => { clearTimeout(timer); resolve({ stdout, error: error.message }); });
      child.once('close', (code) => {
        clearTimeout(timer);
        resolve({ stdout, error: code === 0 ? null : stderr.trim() || `curl exited ${code}` });
      });
    });
    const [status, contentType, effectiveUrl, httpVersion] = processResult.stdout.split(/\r?\n/);
    return {
      status: Number(status) || 0, contentType, effectiveUrl, httpVersion,
      ...(captureHeaders && fs.existsSync(headerFile) ? { responseHeaders: redactTransportText(fs.readFileSync(headerFile, 'utf8'), proxy) } : {}),
      error: processResult.error ? redactTransportText(processResult.error, proxy) : null,
      body: fs.existsSync(file) ? fs.readFileSync(file) : Buffer.alloc(0),
    };
  } finally {
    // This directory is created by mkdtemp above and never derived from a URL.
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

async function verifyUrls(urls, options = {}) {
  const { concurrency = 3, retries = 1, deadlineSeconds = 180,
    requestTimeoutSeconds = 60, proxy, downloader = downloadWithCurl,
    localResolver = localPathForRepositoryRuleUrl, curlBin } = options;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error('concurrency must be 1..4');
  if (!Number.isInteger(retries) || retries < 0 || retries > 2) throw new Error('retries must be 0..2');
  validateSeconds(deadlineSeconds, 'deadline');
  validateSeconds(requestTimeoutSeconds, 'timeout');
  validateProxy(proxy);
  const uniqueUrls = [...new Set(urls)];
  const results = new Array(uniqueUrls.length);
  const deadline = Date.now() + deadlineSeconds * 1000;
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, uniqueUrls.length) }, async () => {
    while (cursor < uniqueUrls.length) {
      const index = cursor++;
      const url = uniqueUrls[index];
      let attempts = 0, result;
      const startedAt = new Date().toISOString();
      do {
        if (Date.now() >= deadline) {
          result = { url, status: 0, bytes: 0, ok: false, failure: 'batch deadline exceeded' };
          break;
        }
        attempts++;
        try {
          const downloaded = await downloader(url, { curlBin, proxy,
            timeoutSeconds: Math.max(1, Math.min(requestTimeoutSeconds, Math.floor((deadline - Date.now()) / 1000))) });
          if (downloaded.error) downloaded.error = redactTransportText(downloaded.error, proxy);
          if (downloaded.responseHeaders) downloaded.responseHeaders = redactTransportText(downloaded.responseHeaders, proxy);
          result = inspectDownload(url, downloaded, localResolver(url));
        } catch (error) {
          result = { url, status: 0, bytes: 0, ok: false, failure: redactTransportText(error.message, proxy) };
        }
      } while (!result.ok && attempts <= retries && (result.status === 0 || result.status === 408
        || result.status === 429 || result.status >= 500 || result.failure === 'download failed'));
      results[index] = { ...result, attempts, startedAt, completedAt: new Date().toISOString() };
    }
  }));
  return { checkedAt: new Date().toISOString(), proxy: redactProxy(proxy), requestTimeoutSeconds,
    deadlineSeconds, concurrency, retries, total: results.length,
    passed: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length, results };
}

function parseArguments(args) {
  let output;
  let deadlineSeconds = 180;
  let requestTimeoutSeconds = 60;
  let concurrency = 3;
  let proxy;
  let curlBin = process.env.SCKI_CURL_BIN || (process.platform === 'win32' ? 'curl.exe' : 'curl');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) output = path.resolve(args[++i]);
    else if (args[i] === '--curl-bin' && args[i + 1]) curlBin = args[++i];
    else if (args[i] === '--proxy' && args[i + 1]) { proxy = args[++i]; validateProxy(proxy); }
    else if (args[i] === '--concurrency' && args[i + 1]) {
      concurrency = Number(args[++i]);
      if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error('concurrency must be 1..4');
    }
    else if (args[i] === '--timeout' && args[i + 1]) {
      requestTimeoutSeconds = Number(args[++i]); validateSeconds(requestTimeoutSeconds, 'timeout');
    }
    else if (args[i] === '--deadline' && args[i + 1]) {
      deadlineSeconds = Number(args[++i]);
      validateSeconds(deadlineSeconds, 'deadline');
    }
    else if (args[i] === '--help') {
      return { help: true };
    } else throw new Error('unknown or incomplete argument; see --help');
  }
  return { output, deadlineSeconds, requestTimeoutSeconds, concurrency, proxy, curlBin };
}

async function main(args = process.argv.slice(2)) {
  const options = parseArguments(args);
  if (options.help) {
    console.log('Usage: node tools/verify-rule-asset-downloads.js [--output report.json] [--proxy http(s)://host:port] [--timeout seconds] [--deadline seconds] [--concurrency 1..4] [--curl-bin executable]\nGET every unique active RULE-SET URL in 独立内核系/Shadowrocket/Shadowrocket.conf (default 3 workers, default 60s/request, one transient retry, default 180s batch). SCKI_CURL_BIN can select curl. Explicit proxy overrides NO_PROXY without changing system settings.');
    return 0;
  }
  const { output, curlBin } = options;
  const consumer = '独立内核系/Shadowrocket/Shadowrocket.conf';
  const urls = collectRuleUrls(fs.readFileSync(path.join(ROOT, consumer), 'utf8'));
  if (!urls.length) throw new Error('no active RULE-SET URLs found');
  const report = { consumer, curlBin, ...await verifyUrls(urls, options) };
  if (output) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(`${report.failed ? 'FAIL' : 'PASS'} downloaded rule assets: ${report.passed}/${report.total}; ${report.failed} failures`);
  for (const result of report.results.filter((item) => !item.ok)) console.error(`${result.url}: ${result.failure}`);
  return report.failed ? 1 : 0;
}

if (require.main === module) main().then((code) => { process.exitCode = code; }).catch((error) => {
  console.error(error.message); process.exitCode = 1;
});

module.exports = { collectRuleUrls, canonicalBytes, inspectDownload, downloadWithCurl,
  verifyUrls, parseArguments, redactProxy, redactTransportText, main };
