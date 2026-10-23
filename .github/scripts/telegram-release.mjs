import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const repositories = new Set(['IvanSolis1989/Aerove', 'IvanSolis1989/Smart-Config-Kit']);
const channelId = '-1003974315707';
const channelUrl = 'https://t.me/IvanSolis89';
const discussionUrl = 'https://t.me/Olympus_Habitue';

export function formatMessage(repository, release) {
  const product = repository.endsWith('/Aerove')
    ? (/lite/i.test(release.tag_name) ? 'AEROVE Lite' : 'AEROVE 标准版')
    : 'Smart-Config-Kit';
  const channel = release.kind === 'changelog' ? '配置更新' : release.prerelease ? '预览版' : '正式版';
  const title = `${product} ${release.tag_name} · ${channel}`;
  const notes = (release.body || '更新详情请查看发布页面。')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*|__|`/g, '')
    .trim();
  const footer = release.kind === 'changelog'
    ? `\n\n更新详情：${release.html_url}\n配置下载：https://github.com/${repository}\n交流讨论：${discussionUrl}`
    : `\n\n发布与下载：${release.html_url}\n交流讨论：${discussionUrl}`;
  const budget = Math.max(0, 3800 - title.length - footer.length - 2);
  const summary = notes.length > budget ? notes.slice(0, budget - 12) + '\n…详见发布页面' : notes;
  return `${title}\n\n${summary}${footer}`;
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
    return changelogAnnouncement(repository, commit.sha, Buffer.from(file.content, 'base64').toString('utf8'), commit.commit.committer.date);
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

export async function publishRelease({ release, repository, api, telegram, recover = false }) {
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
  const context = `telegram/olympus/${release.kind === 'changelog' ? 'changelog' : 'release'}-${release.id}`;
  const statuses = await api(`/commits/${commit.sha}/status?per_page=100`);
  const receipt = statuses.statuses.find(status => status.context === context);
  if (receipt?.state === 'success') return { skipped: true, url: receipt.target_url };
  if (receipt && !recover) {
    throw new Error('上次发送结果不确定。请先检查频道，再用 recover 模式重试，避免重复发布。');
  }
  await telegram('getChatMember', { chat_id: channelId }, true);
  const statusPath = `/statuses/${commit.sha}`;
  await api(statusPath, { state: 'pending', context, description: 'Telegram delivery started; inspect channel before recovery' });
  const message = await telegram('sendMessage', {
    chat_id: channelId,
    text: formatMessage(repository, release),
    link_preview_options: { is_disabled: true },
  });
  const url = `${channelUrl}/${message.message_id}`;
  await api(statusPath, { state: 'success', context, description: `Telegram message ${message.message_id}`, target_url: url });
  return { skipped: false, url };
}

export async function main(env = process.env, fetcher = fetch) {
  const repository = env.GITHUB_REPOSITORY;
  if (!repositories.has(repository)) throw new Error('Notifications are restricted to the official repositories');
  const event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8'));
  const mode = env.GITHUB_EVENT_NAME === 'workflow_dispatch' ? (env.NOTIFY_MODE || 'preview') : 'send';
  if (!['preview', 'send', 'test', 'recover'].includes(mode)) throw new Error('Unknown notification mode');
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
    } else result = await publishRelease({ release, repository, api, telegram, recover: mode === 'recover' });
  }
  const output = JSON.stringify(result, null, 2);
  console.log(output);
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `\n### Telegram notification\n\n${result.url ? `[查看频道消息](${result.url})` : '```json\n' + output + '\n```'}\n`);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
