import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMessage, selectAnnouncement, publishRelease, changelogAnnouncement, summarizeChanges } from './telegram-release.mjs';

const repository = 'IvanSolis1989/Aerove';
const sha = 'a'.repeat(40);
const release = {
  id: 42, tag_name: 'v0.10.0-beta.1+123', prerelease: true,
  published_at: '2026-10-23T01:00:00Z', body: '## 更新\n\n- 修复连接\n<!-- hidden -->',
  html_url: `https://github.com/${repository}/releases/tag/v0.10.0-beta.1+123`,
  assets: [{ name: 'Aerove.apk', state: 'uploaded', size: 100 }],
};

test('formats product/channel labels, removes hidden notes and bounds message size', () => {
  const message = formatMessage(repository, release);
  assert.match(message, /AEROVE 标准版.*预览版/);
  assert.match(message, /修复连接/);
  assert.doesNotMatch(message, /hidden|##/);
  assert.match(message, /<a href="https:\/\/github.com\//);
  assert.doesNotMatch(message, /配置下载|交流讨论/);
  assert.ok(formatMessage(repository, { ...release, body: '😀内容'.repeat(5000) }).length <= 3800);
  assert.match(formatMessage(repository, { ...release, tag_name: 'lite-v1.0.0', prerelease: false }), /AEROVE Lite.*正式版/);
});

test('keeps the announcement short and removes repeated version/build metadata', () => {
  const content = { ...release, body: '# AEROVE v0.10.0\n\n## 工程与内核来源\n- 改用官方 Mihomo v1.19.33。\n- 两版工程分别归入 apps/。\n- 修复全屏启动背景。\n## 独立维护\n- 保留源码和签名。\n## 构建与发布\n- 同一提交验证并构建一次。\n版本：0.10.0\n源码：abcdef' };
  assert.deepEqual(summarizeChanges(content), ['改用官方 Mihomo v1.19.33', '修复全屏启动背景']);
  const message = formatMessage(repository, content);
  assert.equal((message.match(/AEROVE/g) || []).length, 1);
  assert.doesNotMatch(message, /源码|构建|apps\//);
  assert.ok(message.length < 350);
});

test('selects an uploaded release only from a trusted successful build of its source', async () => {
  const run = { conclusion: 'success', head_branch: 'main', head_sha: sha, event: 'push',
    created_at: '2026-10-23T00:00:00Z', head_repository: { full_name: repository } };
  const api = async path => path.startsWith('/releases?') ? [{ ...release, draft: true }, release] : { sha };
  assert.equal((await selectAnnouncement('workflow_run', { workflow_run: run }, '', api, repository)).id, 42);
  assert.equal(await selectAnnouncement('workflow_run', { workflow_run: { ...run, conclusion: 'failure' } }, '', api, repository), null);
  assert.equal(await selectAnnouncement('workflow_run', { workflow_run: { ...run, head_repository: { full_name: 'other/fork' } } }, '', api, repository), null);
  assert.equal(await selectAnnouncement('workflow_run', { workflow_run: { ...run, created_at: '2026-10-24T00:00:00Z' } }, '', api, repository), null);
});

test('records confirmed delivery and skips a duplicate trigger', async () => {
  const writes = [], sends = [];
  let receipt;
  const api = async (path, body) => {
    if (body) { writes.push(body); receipt = body; return body; }
    return path.includes('/status?') ? { statuses: receipt ? [receipt] : [] } : { sha };
  };
  const telegram = async () => ({});
  const files = [{ name: 'Aerove.apk' }];
  const prepare = async () => files;
  const upload = async (artifacts, caption) => { sends.push({ artifacts, caption }); return { message_id: 17, files }; };
  assert.deepEqual(await publishRelease({ release, repository, api, telegram, prepare, upload }), { skipped: false, url: 'https://t.me/IvanSolis89/17', files });
  assert.deepEqual(writes.map(write => write.state), ['pending', 'success']);
  assert.equal((await publishRelease({ release, repository, api, telegram, prepare, upload })).skipped, true);
  assert.equal(sends.length, 1);
  assert.deepEqual(sends[0].artifacts, files);
  assert.ok(sends[0].caption.length <= 1000);
});

test('does not automatically resend an ambiguous delivery', async () => {
  let attempts = 0;
  const api = async path => path.includes('/status?')
    ? { statuses: [{ context: 'telegram/olympus/files-release-42', state: 'pending' }] } : { sha };
  await assert.rejects(publishRelease({ release, repository, api, telegram: async () => attempts++ }), /recover/);
  assert.equal(attempts, 0);
});

test('edits the existing caption without preparing or uploading documents again', async () => {
  const calls = [];
  const api = async path => path.includes('/status?') ? { statuses: [
    { context: 'telegram/olympus/files-release-42', state: 'success', target_url: 'https://t.me/IvanSolis89/11' },
  ] } : { sha };
  const result = await publishRelease({ release, repository, api, edit: true,
    telegram: async (method, body) => calls.push({ method, body }),
    prepare: async () => { throw new Error('Must not prepare again'); },
    upload: async () => { throw new Error('Must not upload again'); },
  });
  assert.equal(result.edited, true);
  assert.equal(calls[0].method, 'editMessageCaption');
  assert.equal(calls[0].body.message_id, 11);
  assert.equal(calls[0].body.parse_mode, 'HTML');
});

test('rejects drafts and missing APKs before messaging', async () => {
  const forbidden = async () => { throw new Error('Unexpected network call'); };
  await assert.rejects(publishRelease({ release: { ...release, draft: true }, repository, api: forbidden, telegram: forbidden }), /unpublished/);
  await assert.rejects(publishRelease({ release: { ...release, assets: [] }, repository, api: forbidden, telegram: forbidden }), /APK/);
});

test('extracts only the latest root changelog section and announces its immutable source', async () => {
  const repo = 'IvanSolis1989/Smart-Config-Kit';
  const text = '# 日志\n\n## v6.1.0 (2026-10-23)\n\n- 本次更新\n\n## v6.0.0\n\n- 旧更新\n';
  const announcement = changelogAnnouncement(repo, sha, text, release.published_at);
  assert.equal(announcement.tag_name, 'v6.1.0 (2026-10-23)');
  assert.equal(announcement.body, '- 本次更新');
  assert.match(formatMessage(repo, announcement), /Smart-Config-Kit.*配置更新/);
  const api = async path => {
    if (path.startsWith('/compare/')) return { files: [{ filename: 'CHANGELOG.md', status: 'modified' }] };
    if (path.startsWith('/commits/')) return { sha, commit: { committer: { date: release.published_at } } };
    return { content: Buffer.from(text).toString('base64'), encoding: 'base64' };
  };
  const event = { ref: 'refs/heads/main', before: 'b'.repeat(40), after: sha };
  assert.equal((await selectAnnouncement('push', event, '', api, repo)).sha, sha);
  assert.equal(await selectAnnouncement('push', { ...event, ref: 'refs/heads/other' }, '', api, repo), null);
  assert.equal(await selectAnnouncement('push', event, '', async () => ({ files: [{ filename: 'README.md' }] }), repo), null);
  assert.equal(await selectAnnouncement('release', {}, '', api, repo), null);
  assert.throws(() => changelogAnnouncement(repo, sha, '# Empty', ''), /no version/);
});

test('expands the matching linked changelog instead of announcing a pointer', async () => {
  const repo = 'IvanSolis1989/Smart-Config-Kit';
  const root = '# 日志\n## 2026-10-23 下载复核\n- 详见 [Clash Party 日志](./Clash%20Party/CHANGELOG.md)。\n';
  const child = '# Clash Party\n## 2026-10-23 下载复核\n- 确认下载域名命中下载策略；补充微信进程 DIRECT 回归；规则行为不变。\n## 旧版\n- 旧更新\n';
  const api = async path => path.startsWith('/commits/') ? { sha, commit: { committer: { date: release.published_at } } }
    : { encoding: 'base64', content: Buffer.from(path.includes('Clash%20Party') ? child : root).toString('base64') };
  const announcement = await selectAnnouncement('workflow_dispatch', {}, 'main', api, repo);
  const text = formatMessage(repo, announcement);
  assert.match(text, /微信进程 DIRECT/);
  assert.match(text, /规则行为不变/);
  assert.doesNotMatch(text, /详见|旧更新|交流讨论/);
});
