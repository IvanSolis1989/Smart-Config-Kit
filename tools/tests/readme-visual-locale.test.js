'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createVisualTranslator, assertEnglish } = require('../lib/readme-visual-locale');
const { isReviewPage, isReviewSvg, documentLanguage } = require('../lib/documentation-review-scope');
const root = path.resolve(__dirname, '../..');

test('visual translation fails closed for unregistered text in every compositional branch', () => {
  const translate = createVisualTranslator({ '已知': 'Known' });
  for (const input of ['下载 新客户端', '新客户端 原始文件', '打开新客户端 原始文件', '新客户端 配置入口', '已知；新客户端', '𠀀']) {
    assert.throws(() => translate(input), /Missing visual translation|Untranslated English/);
  }
  assert.equal(translate('下载 已知'), 'Download Known');
  assert.equal(translate('已知 原始文件'), 'Known raw file');
  assert.equal(translate('打开已知 原始文件'), 'Open Known raw file');
  assert.equal(translate('已知 配置入口'), 'Known configurations');
  assert.equal(translate('已知；Known'), 'Known; Known');
});

test('catalog values and final SVG cannot bypass English output validation', () => {
  for (const value of ['未翻译', 'Translated but 残留', '𠀀']) {
    assert.throws(() => createVisualTranslator({ '已知': value })('已知'), /Untranslated English/);
    assert.throws(() => assertEnglish('<svg><text>' + value + '</text></svg>'), /Untranslated English/);
  }
  assert.equal(createVisualTranslator({}, 'zh-CN')('下载 新客户端'), '下载 新客户端');
  assert.throws(() => createVisualTranslator({}, 'auto'), /Unsupported/);
});

test('both existing SVG catalogs are deterministic and English output contains no Han', () => {
  for (const args of [[], ['--locale=zh-CN']]) {
    execFileSync(process.execPath, ['tools/generate-readme-visuals.js', ...args, '--check'], { cwd: root });
  }
  for (const file of fs.readdirSync(path.join(root, 'docs/assets/readme')).filter(f => f.endsWith('.svg'))) {
    assertEnglish(fs.readFileSync(path.join(root, 'docs/assets/readme', file), 'utf8'));
  }
});

test('renderer includes both README languages and both SVG locales, including future clients', () => {
  for (const file of ['README.md', 'README.zh-CN.md', 'New Family/New Client/README.md', 'New Family/New Client/README.zh-CN.md', 'docs/guide/new.md', 'docs/guide/new.zh-CN.md']) assert.equal(isReviewPage(file), true, file);
  for (const file of ['docs/assets/readme/new.svg', 'docs/assets/readme/zh-CN/new.svg']) assert.equal(isReviewSvg(file), true, file);
  for (const file of ['docs/research/2026-01-01.md', 'docs/research/2026-01-01.zh-CN.md', 'Client/REFERENCE-client.md', 'Client/CHANGELOG.md', 'tools/js-engine-tests/REFERENCE.md', 'tools/js-engine-tests/REFERENCE.zh-CN.md']) assert.equal(isReviewPage(file), true);
  for (const file of ['AGENTS.md', 'Client/AGENTS.md', 'docs/upstream/date/product/bodies/source.md']) assert.equal(isReviewPage(file), false);
  assert.equal(isReviewSvg('docs/assets/readme/unrelated/new.svg'), false);
  assert.equal(documentLanguage('README.zh-CN.md'), 'zh-CN');
  assert.equal(documentLanguage('README.md'), 'en');
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  const readmes = files.filter(f => /(?:^|\/)README\.md$/.test(f));
  assert.ok(readmes.length >= 36);
  for (const file of readmes) {
    const chinese = file.replace(/\.md$/, '.zh-CN.md');
    assert.ok(fs.existsSync(path.join(root, chinese)), chinese);
    assert.equal(isReviewPage(chinese), true);
  }
});
