import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { prepareArtifacts, uploadArtifacts, validateUploadConfiguration } from './telegram-artifacts.mjs';

const repositories = new Set(['IvanSolis1989/Aerove', 'IvanSolis1989/Smart-Config-Kit']);
const channelId = '-1003974315707';
const channelUrl = 'https://t.me/IvanSolis89';
const discussionUrl = 'https://t.me/Olympus_Habitue';
const html = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function summarizeChanges(release) {
  const source = (release.detail_body || release.body || '').replace(/<!--[\s\S]*?-->/g, '');
  const changes = [];
  let skip = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^#{1,6}\s/.test(line)) {
      skip = /^#{1,6}\s*(独立维护|构建与发布|构建信息|Build|Source)/i.test(line);
      continue;
    }
    if (skip || !/^\s*[-*•]\s+/.test(line)) continue;
    const text = line.replace(/^\s*[-*•]\s+/, '')
      .replace(/(?:详见|参见)\s*\[[^\]]+\]\([^)]+\)[。；]?/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*|__|`/g, '').replace(/完整版/g, '标准版').trim();
    if (/两版工程分别归入|同一提交验证并构建|^版本[：:]|^源码[：:]/.test(text)) continue;
    for (let change of text.split(/；/)) {
      change = change.trim().replace(/[。；]+$/, '');
      if (!change || changes.some(previous => previous.includes(change) || change.includes(previous))) continue;
      changes.push(change.length > 100 ? change.slice(0, 96) + '…' : change);
      if (changes.length === 4) return changes;
    }
  }
  return changes.length ? changes : ['本次更新内容见发布页'];
}

export function formatMessage(repository, release, limit = 650) {
  const product = repository.endsWith('/Aerove')
    ? (/lite/i.test(release.tag_name) ? 'AEROVE Lite' : 'AEROVE 标准版')
    : 'Smart-Config-Kit';
  const channel = release.kind === 'changelog' ? '配置更新' : release.prerelease ? '预览版' : '正式版';
  const title = `${product} ${release.tag_name} · ${channel}`;
  const footer = `\n\n<a href="${html(release.html_url)}">发布页</a>`;
  const rows = summarizeChanges(release).map(change => `• ${html(change)}`);
  const budget = Math.min(limit, 650) - html(title).length - footer.length - 2;
  while (rows.length > 1 && rows.join('\n').length > budget) rows.pop();
  return `${html(title)}\n\n${rows.join('\n')}${footer}`;
}

export function changelogAnnouncement(repository, sha, text, date) {
  const section = text.match(/^## ([^\r\n]+)\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/m);
  if (!section) throw new Error('Root CHANGELOG.md has no version section');
  return {
    kind: 'changelog', id: sha, sha, tag_name: section[1].trim(), body: section[2].trim(),
    html_url: `https://github.com/${repository}/blob/${sha}/CHANGELOG.md`, published_at: date,
  };
}

export async function selectAnnouncement(eventName, event, tag, api, repository) {
  if (repository.endsWith('/Smart-Config-Kit')) {
    if (eventName === 'push' && (event.ref !== 'refs/heads/main' || event.deleted)) return null;
    if (!['push', 'workflow_dispatch'].includes(eventName)) return null;
    if (eventName === 'push') {
      if (![event.before, event.after].every(sha => /^[a-f0-9]{40}$/.test(sha))) throw new Error('Invalid push commit');
      const comparison = await api(`/compare/${event.before}...${event.after}`);
      if (!comparison.files?.some(file => file.filename === 'CHANGELOG.md' && file.status !== 'removed')) return null;
    }
    const ref = eventName === 'push' ? event.after : (tag || 'main');
    const commit = await api(`/commits/${encodeURIComponent(ref)}`);
    const file = await api(`/contents/CHANGELOG.md?ref=${commit.sha}`);
    if (file.encoding !== 'base64') throw new Error('Unsupported changelog encoding');
    const announcement = changelogAnnouncement(repository, commit.sha, Buffer.from(file.content, 'base64').toString('utf8'), commit.commit.committer.date);
    const date = announcement.tag_name.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    const details = [];
    for (const match of announcement.body.matchAll(/\[[^\]]+\]\((\.\/?[^)#]*CHANGELOG\.md)(?:#[^)]*)?\)/g)) {
      const sourcePath = decodeURIComponent(match[1]).replace(/^\.\//, '');
      if (sourcePath.split('/').some(part => part === '..') || sourcePath.includes('\\')) continue;
      const linked = await api(`/contents/${sourcePath.split('/').map(encodeURIComponent).join('/')}?ref=${commit.sha}`);
      const section = changelogAnnouncement(repository, commit.sha, Buffer.from(linked.content, 'base64').toString('utf8'), commit.commit.committer.date);
      if (date && section.tag_name.includes(date)) details.push(section.body);
    }
    if (details.length) announcement.detail_body = details.join('\n');
    return announcement;
  }
  if (eventName === 'release') return api(`/releases/${event.release.id}`);
  if (eventName === 'workflow_dispatch') {
    if (!tag) throw new Error('发布预览或发送必须填写准确的 Release tag。');
    return api(`/releases/tags/${encodeURIComponent(tag)}`);
  }
  if (eventName !== 'workflow_run') throw new Error('Unsupported notification event');
  const run = event.workflow_run;
  if (run.conclusion !== 'success' || run.head_branch !== 'main' ||
      run.head_repository?.full_name !== repository ||
      !['push', 'workflow_dispatch'].includes(run.event)) return null;
  const releases = await api('/releases?per_page=100');
  for (const release of releases) {
    if (release.draft || !release.published_at || release.published_at < run.created_at) continue;
    const commit = await api(`/commits/${encodeURIComponent(release.tag_name)}`);
    if (commit.sha === run.head_sha) return release;
  }
  return null;
}

export async function publishRelease({ release, repository, api, telegram, prepare, upload, recover = false, edit = false }) {
  if (release.draft || !release.published_at) throw new Error('Refusing to announce an unpublished release');
  if (release.kind === 'changelog' && release.html_url !== `https://github.com/${repository}/blob/${release.sha}/CHANGELOG.md`) {
    throw new Error('Unexpected changelog URL');
  }
  if (release.kind !== 'changelog' && release.html_url !== `https://github.com/${repository}/releases/tag/${encodeURIComponent(release.tag_name)}` &&
      release.html_url !== `https://github.com/${repository}/releases/tag/${release.tag_name}`) {
    throw new Error('Unexpected release URL');
  }
  if (repository.endsWith('/Aerove') && !release.assets?.some(asset => /\.apk$/i.test(asset.name) && asset.state === 'uploaded' && asset.size > 0)) {
    throw new Error('Aerove Release has no uploaded APK');
  }
  const commit = release.kind === 'changelog' ? { sha: release.sha } : await api(`/commits/${encodeURIComponent(release.tag_name)}`);
  const context = `telegram/olympus/${release.kind === 'changelog' ? 'raw-changelog' : 'files-release'}-${release.id}`;
  const statuses = await api(`/commits/${commit.sha}/status?per_page=100`);
  const receipt = statuses.statuses.find(status => status.context === context);
  if (edit) {
    if (!receipt?.target_url?.startsWith(channelUrl + '/')) throw new Error('No confirmed message to edit');
    const messageId = Number(receipt.target_url.split('/').at(-1));
    await telegram('editMessageCaption', { chat_id: channelId, message_id: messageId, caption: formatMessage(repository, release), parse_mode: 'HTML' });
    return { edited: true, url: receipt.target_url };
  }
  if (receipt?.state === 'success') return { skipped: true, url: receipt.target_url };
  if (receipt && !recover) {
    throw new Error('上次发送结果不确定。请先检查频道，再用 recover 模式重试，避免重复发布。');
  }
  await telegram('getChatMember', { chat_id: channelId }, true);
  const files = await prepare(repository, release);
  if (!files.length) throw new Error('No product files prepared for Telegram');
  const statusPath = `/statuses/${commit.sha}`;
  await api(statusPath, { state: 'pending', context, description: 'Telegram delivery started; inspect channel before recovery' });
  const message = await upload(files, formatMessage(repository, release, 1000));
  const url = `${channelUrl}/${message.message_id}`;
  await api(statusPath, { state: 'success', context, description: `Telegram message ${message.message_id}`, target_url: url });
  return { skipped: false, url, files: message.files };
}

export async function main(env = process.env, fetcher = fetch) {
  const repository = env.GITHUB_REPOSITORY;
  if (!repositories.has(repository)) throw new Error('Notifications are restricted to the official repositories');
  const event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8'));
  const mode = env.GITHUB_EVENT_NAME === 'workflow_dispatch' ? (env.NOTIFY_MODE || 'preview') : 'send';
  if (!['preview', 'send', 'test', 'recover', 'edit'].includes(mode)) throw new Error('Unknown notification mode');
  const api = async (path, body) => {
    let response;
    try {
      response = await fetcher(`https://api.github.com/repos/${repository}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(30000),
      });
    } catch { throw new Error('GitHub request failed'); }
    if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}`);
    return response.json();
  };
  const telegram = async (method, body, checkPermission = false) => {
    if (!env.TELEGRAM_BOT_TOKEN?.trim()) throw new Error('Missing Actions Secret: TELEGRAM_BOT_TOKEN');
    if (checkPermission) {
      const me = await telegram('getMe', {});
      body = { ...body, user_id: me.id };
    }
    let response, data;
    try {
      response = await fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN.trim()}/${method}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000),
      });
      data = await response.json();
    } catch { throw new Error(`Telegram ${method} failed; inspect channel before retrying a send`); }
    if (!response.ok || !data.ok) throw new Error(`Telegram ${method} returned error ${data.error_code || response.status}`);
    if (checkPermission && !(data.result.status === 'creator' ||
        (data.result.status === 'administrator' && data.result.can_post_messages))) {
      throw new Error('Grant the bot channel administrator permission: Post Messages');
    }
    return data.result;
  };
  let result;
  if (mode === 'test') {
    await telegram('getChatMember', { chat_id: channelId }, true);
    const message = await telegram('sendMessage', {
      chat_id: channelId, disable_notification: true,
      text: `机器人部署测试\n\n${repository} 的 GitHub Actions 已连接 Olympus 官方频道。\n${repository.endsWith('/Aerove') ? '后续公开 Release' : '后续 main 根 CHANGELOG.md 更新'}将自动发送更新说明和下载入口。\n\n讨论群：${discussionUrl}`,
      link_preview_options: { is_disabled: true },
    });
    result = { test: true, url: `${channelUrl}/${message.message_id}` };
  } else {
    const release = await selectAnnouncement(env.GITHUB_EVENT_NAME, event, env.RELEASE_TAG, api, repository);
    if (!release) result = { skipped: true, reason: 'No release published by this workflow run' };
    else if (mode === 'preview') {
      if (release.draft || !release.published_at) throw new Error('Release is not published');
      result = { preview: formatMessage(repository, release) };
    } else {
      result = await publishRelease({
        release, repository, api, telegram,
        prepare: async (repo, announcement) => {
          const files = await prepareArtifacts(repo, announcement, fetcher);
          validateUploadConfiguration(files, env);
          return files;
        },
        upload: (files, caption) => uploadArtifacts(files, caption, env),
        recover: mode === 'recover',
        edit: mode === 'edit',
      });
    }
  }
  const output = JSON.stringify(result, null, 2);
  console.log(output);
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `\n### Telegram notification\n\n${result.url ? `[查看频道消息](${result.url})` : '```json\n' + output + '\n```'}\n`);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
