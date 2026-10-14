'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const REPOSITORY_URL_PREFIXES = [
  'https://jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/',
  'https://fastly.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/',
  'https://cdn.jsdelivr.net/gh/IvanSolis1989/Smart-Config-Kit@main/',
  'https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/',
];

function localPathForRepositoryRuleUrl(url) {
  const text = String(url || '');
  for (const prefix of REPOSITORY_URL_PREFIXES) {
    if (!text.startsWith(prefix)) continue;
    const relativeUrl = decodeURIComponent(text.slice(prefix.length).split(/[?#]/)[0]);
    const candidate = path.resolve(REPO_ROOT, relativeUrl);
    const relativePath = path.relative(REPO_ROOT, candidate);
    if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath) && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

module.exports = {
  REPOSITORY_URL_PREFIXES,
  localPathForRepositoryRuleUrl,
};
