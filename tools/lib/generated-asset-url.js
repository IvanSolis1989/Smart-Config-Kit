'use strict';

const { SOURCE_REPOSITORY_ASSET_BASE } = require('../../rulesets/source/routing-graph');
const SCKI_REPOSITORY_BASE = SOURCE_REPOSITORY_ASSET_BASE;
const ASSET_REVISION_PATTERN = /^v\d+\.\d+\.\d+(?:[-.][A-Za-z0-9]+)*$/;

function normalizeAssetRevision(revision) {
  const normalized = String(revision || '').trim();
  if (!ASSET_REVISION_PATTERN.test(normalized)) {
    throw new Error(`invalid generated asset revision: ${revision}`);
  }
  return normalized;
}

function withAssetRevision(url, revision) {
  const parsed = new URL(url);
  parsed.searchParams.set('scki', normalizeAssetRevision(revision));
  return parsed.toString();
}

function repositoryAssetUrl(relativePath, revision) {
  const normalizedPath = String(relativePath || '').replace(/^\/+/, '');
  if (!normalizedPath || normalizedPath.includes('..')) {
    throw new Error(`invalid repository asset path: ${relativePath}`);
  }
  return withAssetRevision(`${SCKI_REPOSITORY_BASE}/${normalizedPath}`, revision);
}

function mihomoAssetCachePath(fileName, revision) {
  const normalizedFile = String(fileName || '');
  if (!/^[A-Za-z0-9._-]+$/.test(normalizedFile)) {
    throw new Error(`invalid Mihomo asset file name: ${fileName}`);
  }
  return `./ruleset/${normalizeAssetRevision(revision)}/${normalizedFile}`;
}

function getAssetRevisionFromUrl(url) {
  try {
    return new URL(url).searchParams.get('scki');
  } catch {
    return null;
  }
}

module.exports = {
  SCKI_REPOSITORY_BASE,
  getAssetRevisionFromUrl,
  mihomoAssetCachePath,
  normalizeAssetRevision,
  repositoryAssetUrl,
  withAssetRevision,
};
