'use strict';
function isReviewPage(file) {
  // User documentation is rendered in both editions. Raw upstream evidence
  // and executable maintenance contracts retain their original form.
  if (!file.endsWith('.md') || /(?:^|\/)(?:AGENTS|CLAUDE)\.md$/.test(file)) return false;
  if (/^docs\/upstream\/.*\/(?:bodies|snapshots)\//.test(file)) return false;
  return /(?:^|\/)(?:README(?:\.zh-CN)?|CHANGELOG|REFERENCE-[^/]+)\.md$/.test(file)
    || /^docs\//.test(file)
    || /^tools\/js-engine-tests\/REFERENCE(?:\.zh-CN)?\.md$/.test(file)
    || /(?:^|\/)(?:VALIDATION|RESOURCE-SPLITTING)(?:\.zh-CN)?\.md$/.test(file);
}
function isReviewSvg(file) {
  return /^docs\/assets\/readme\/(?:zh-CN\/)?[^/]+\.svg$/.test(file);
}
function documentLanguage(file) { return file.endsWith('.zh-CN.md') ? 'zh-CN' : 'en'; }
module.exports = { isReviewPage, isReviewSvg, documentLanguage };
