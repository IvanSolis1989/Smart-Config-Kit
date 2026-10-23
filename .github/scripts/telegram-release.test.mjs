import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMessage, selectAnnouncement, publishRelease, changelogAnnouncement } from './telegram-release.mjs';

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
  assert.match(message, /https:\/\/t.me\/Olympus_Habitue/);
  assert.ok(formatMessage(repository, { ...release, body: '😀内容'.repeat(5000) }).length <= 3800);
  assert.match(formatMessage(repository, { ...release, tag_name: 'lite-v1.0.0', prerelease: false }), /AEROVE Lite.*正式版/);
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
