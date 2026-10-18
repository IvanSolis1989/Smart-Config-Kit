import { settingsFrom, SyncError } from './core.mjs';

const errors = {
  invalid_settings: '请使用 http://127.0.0.1:端口作为本机前后端地址。',
  invalid_candidate: '页面返回的链接格式不符合要求。',
  candidate_ambiguous: '检测到多个不同订阅链接，已停止自动写入，请核对网页内容。',
    candidate_superseded: '页面候选已变化，本次验证已取消，等待最新结果。',
  candidate_origin_changed: '新旧链接的域名或端口不同，已保留原链接，请人工核对。',
  fragment_conflict: '新旧链接包含冲突的附加参数，已保留原链接。',
  invalid_fragment: '附加参数无法安全解析，已保留原链接。',
  auto_match_none: '未能在 Sub-Store 中唯一匹配该机场的现有订阅，未写入。',
  auto_match_ambiguous: 'Sub-Store 中存在多个可能匹配的订阅，未写入。',
  catalog_unavailable: '无法读取 Sub-Store 订阅目录，请检查本机服务与端口。',
  backend_unavailable: '无法连接本机 Sub-Store，请启动客户端并核对端口。',
  backend_timeout: 'Sub-Store 验证超时，请稍后重试。',
  backend_http_error: 'Sub-Store 接口未成功，请核对本机服务与端口。',
  backend_rejected: 'Sub-Store 无法完成预览，请检查该订阅的处理脚本与网络。',
  backend_invalid_json: '该地址未返回 Sub-Store API 数据，请核对后端端口。',
  backend_response_too_large: '返回内容超过安全大小，已停止。',
  unsupported_subscription: '仅支持现有的一条远程订阅；多源合并或本地订阅需人工处理。',
  preview_invalid: 'Sub-Store 预览结果不完整，已保留原链接。',
  candidate_has_no_real_nodes: '新链接仍为空或只有超限告警节点，未写入。',
  concurrent_change: '订阅在同步期间发生变化，已停止，请重新检查。',
  writeback_verification_failed: '写入后的读回不一致，请检查；旧链接备份已保留。',
  open_dashboard_first: '该网站尚无可重试的订阅链接，请打开已登录的仪表盘。',
  backup_not_found: '当前网站没有可用备份。',
  settings_unavailable: '无法读取扩展设置，请重新打开弹窗。',
  site_permission_required: '浏览器尚未允许扩展访问该网站，请检查扩展的站点访问权限。',
  local_transport_invalid_settings: '本机前端或后端地址设置不正确。',
  local_transport_invalid_request: '本机通信请求不符合允许范围，已停止。',
  local_transport_storage_failed: '无法保存本机通信标签页状态。',
  local_transport_unavailable: '无法打开本机 Sub-Store 前端，请核对前端端口。',
  local_transport_not_ready: '本机 Sub-Store 前端尚未就绪，请重新加载扩展后重试。',
  local_transport_invalid_response: '本机前端通信返回异常，已停止。',
  local_backend_request_failed: '本机 Sub-Store 前端无法完成请求，请核对端口后重试。',
  unexpected_error: '操作未完成，请重新检查。',
};
const GLOBAL_FIELDS = ['enabled', 'backendUrl', 'frontendUrl'];
const PAGE_STAGES = {
  bridge_ready: '已检测到网页',
  observer_ready: '页面监听已就绪',
  candidate_received: '已收到订阅链接',
  candidate_ambiguous: '检测到多个订阅链接，请人工核对',
};
const WAITING_TITLES = { ...PAGE_STAGES,
  bridge_ready: PAGE_STAGES.bridge_ready + '，等待自动识别',
  observer_ready: PAGE_STAGES.observer_ready + '，等待订阅链接',
  candidate_received: PAGE_STAGES.candidate_received + '，正在匹配与验证',
};

export function globalSettingsFrom(value) {
  const validated = settingsFrom(value);
  return Object.fromEntries(GLOBAL_FIELDS.map(key => [key, validated[key]]));
}

// Domain names, IPv4 and IPv6 are all valid. Paths, queries and credentials never enter UI state.
export function pageOrigin(tabUrl, settings = {}) {
  try {
    const url = new URL(tabUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if ([settings.backendUrl, settings.frontendUrl].some(value => value && new URL(value).origin === url.origin)) return null;
    return url.origin;
  } catch { return null; }
}

function dateText(at) {
  const date = new Date(at);
  return at && Number.isFinite(date.getTime()) ? date.toLocaleString('zh-CN') : '';
}

function safeName(value, fallback) {
  if (typeof value !== 'string' || !value.trim() || value.length > 100 ||
      /[\u0000-\u001f\u007f-\u009f]|https?:\/\/|[?&#](?:token|key|password|auth)=/i.test(value)) return fallback;
  return value.trim();
}

export function resultView(result, settings, { extensionVersion, observation, subscriptionName } = {}) {
  if (subscriptionName && result?.subscriptionName && result.subscriptionName !== subscriptionName) result = null;
  const status = result?.status;
  const outcome = ({ updated: '已更新并读回验证', unchanged: '当前链接已一致', dry_run: '验证通过，未写入',
    restored: '已恢复上次链接', disabled: '自动同步已关闭', error: '暂未同步' })[status];
  let title = outcome || '等待网站自动返回订阅';
  let detail = status === 'error' ? errors[result.code] || errors.unexpected_error : '打开已登录的机场仪表盘，扩展会自动识别并匹配已有订阅。';
  if (status !== 'error' && Number.isInteger(result?.originalNodes) && Number.isInteger(result?.processedNodes)) {
    detail = `有效节点：原始 ${result.originalNodes}，处理后 ${result.processedNodes}。` +
      (status === 'updated' ? '客户端下次刷新订阅时生效。' : '');
  }
  const hasStage = Object.hasOwn(PAGE_STAGES, observation?.stage) && !!dateText(observation?.at);
  const currentPage = hasStage && (!extensionVersion || observation.extensionVersion === extensionVersion);
  const staleVersion = !!result && !!extensionVersion && result.extensionVersion !== extensionVersion;
  const resultAt = Date.parse(result?.at), pageAt = Date.parse(observation?.at);
  const awaitingResult = currentPage && (!result || staleVersion || !Number.isFinite(resultAt) || pageAt > resultAt);
  const history = !!result && (staleVersion || awaitingResult);
  if (history) {
    title = staleVersion ? '上次同步记录，当前版本待验证' : '等待本轮网页的同步结果';
    detail = (staleVersion ? '上次同步记录，当前版本待验证。' : '尚无本轮网页的同步结果。') +
      `上次结果：${outcome || '未完成'}。${detail} 以上仅供参考。`;
  }
  if (awaitingResult) {
    title = WAITING_TITLES[observation.stage];
    if (!history) detail = observation.stage === 'candidate_ambiguous' ? errors.candidate_ambiguous :
      observation.stage === 'candidate_received' ? '正在自动匹配 Sub-Store 条目，等待节点验证及同步结果。' : '网页已被检测到，等待自动识别机场与订阅链接。';
  }
  if (!settings.enabled) title = '全局自动同步已关闭';
  const pageStage = !hasStage ? '本轮阶段：尚未检测到网页，等待已授权的仪表盘加载。' :
    currentPage ? '本轮阶段：' + PAGE_STAGES[observation.stage] : '本轮阶段：上次网页记录来自旧版本，本版尚未就绪。';
  const recordedTime = dateText(result?.at);
  return { title, detail, time: recordedTime ? (history ? '上次同步时间：' : '同步时间：') + recordedTime : '',
    pageStage, pageTime: hasStage ? '阶段时间：' + dateText(observation.at) : '' };
}

export function createPopup(document, chromeApi) {
  const $ = id => document.getElementById(id);
  let saved = null, state = {}, activeOrigin = null, selectedOrigin = '', working = false, refreshing = false;

  async function send(message) {
    try { return await chromeApi.runtime.sendMessage(message); }
    catch { return { status: 'error', code: 'unexpected_error' }; }
  }
  function notice(message = '', error = false) {
    $('notice').textContent = message;
    $('notice').hidden = !message;
    $('notice').className = error ? 'error' : '';
  }
  function errorNotice(result, prefix = '') { notice(prefix + (errors[result?.code] || errors.unexpected_error), true); }
  function globals() { return { enabled: $('enabled').checked, backendUrl: $('backend').value.trim(), frontendUrl: $('frontend').value.trim() }; }
  function dirty() { return !!saved && GLOBAL_FIELDS.some(key => globals()[key] !== saved[key]); }
  function site() { return selectedOrigin ? state.sites?.[selectedOrigin] : null; }
  function backupCount() { const count = site()?.backupCount; return Number.isInteger(count) && count > 0 ? count : 0; }
  function origins() {
    return [...new Set([activeOrigin, ...Object.keys(state.sites || {})].filter(origin => origin && pageOrigin(origin, saved) === origin))];
  }
  function renderChoices() {
    const entries = [['', '等待打开已授权的机场网站'], ...origins().map(origin => {
      const name = safeName(state.sites?.[origin]?.siteName, '');
      return [origin, (origin === activeOrigin ? '当前 · ' : '') + (name ? name + ' · ' : '') + origin];
    })];
    $('site').replaceChildren(...entries.map(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      return option;
    }));
    if (!origins().includes(selectedOrigin)) selectedOrigin = activeOrigin || '';
    $('site').value = selectedOrigin;
  }
  function renderStatus() {
    $('currentSite').textContent = activeOrigin ? '当前网站：' + activeOrigin : '当前网站：等待打开已授权的机场网页。';
    $('automatic').textContent = saved?.enabled ? '自动同步：已开启' : '自动同步：已关闭';
    const current = site();
    $('siteName').textContent = safeName(current?.siteName, selectedOrigin ? '等待自动识别' : '等待打开网站');
    $('subscriptionName').textContent = safeName(current?.subscriptionName, '等待自动匹配');
    // A legacy global record without origin must never be assigned to an unrelated website.
    const result = current?.lastResult || (selectedOrigin && state.lastResult?.origin === selectedOrigin ? state.lastResult : null);
    const view = resultView(result, saved || { enabled: true }, {
      extensionVersion: state.extensionVersion || chromeApi.runtime.getManifest?.()?.version,
      observation: current?.observation, subscriptionName: current?.subscriptionName,
    });
    if (!selectedOrigin) {
      view.title = saved?.enabled ? '等待打开机场网站' : '全局自动同步已关闭';
      view.detail = '打开浏览器已授权的机场仪表盘，扩展将自动识别名称并匹配 Sub-Store 订阅。';
    }
    for (const key of ['title', 'detail', 'time', 'pageStage', 'pageTime']) $(key === 'title' ? 'status' : key).textContent = view[key];
    $('pending').textContent = current?.hasPending ? '已捕获此网站的订阅链接，扩展自动处理。' : '等待此网站自动返回订阅链接。';
    const count = backupCount();
    $('backup').textContent = count ? `此网站可用备份：${count} 份。` : '此网站暂无可用备份。';
  }
  function renderControls() {
    document.body.setAttribute('aria-busy', String(working));
    for (const id of ['site', 'enabled', 'backend', 'frontend', 'save']) $(id).disabled = working || !saved;
    const canSync = !!saved?.enabled && !!selectedOrigin && !!site()?.hasPending && !dirty() && !working;
    $('sync').disabled = !canSync;
    $('check').disabled = !canSync;
    $('restore').disabled = working || !selectedOrigin || dirty() || !backupCount();
    $('dirty').hidden = !dirty();
    $('dirty').textContent = '全局设置尚未保存；网站切换会保留这些编辑。';
  }
  function render() { renderChoices(); renderStatus(); renderControls(); }
  function acceptSettings(settings) {
    saved = globalSettingsFrom(settings);
    activeOrigin = pageOrigin(activeOrigin, saved);
    $('enabled').checked = saved.enabled;
    $('backend').value = saved.backendUrl;
    $('frontend').value = saved.frontendUrl;
    render();
  }
  async function freshState() {
    const latest = await send({ type: 'GET_STATUS' });
    if (!latest?.settings) throw new SyncError(latest?.code || 'settings_unavailable');
    return latest;
  }
  async function busy(action) {
    if (working || !saved) return;
    working = true;
    notice();
    renderControls();
    try { await action(); }
    catch (error) { errorNotice(error); }
    finally { working = false; renderControls(); }
  }
  async function save() {
    const baseline = saved, draft = globals();
    globalSettingsFrom(draft);
    const latest = await freshState();
    const settings = globalSettingsFrom(latest.settings);
    for (const key of GLOBAL_FIELDS) if (draft[key] !== baseline[key]) settings[key] = draft[key];
    const result = await send({ type: 'SAVE_SETTINGS', settings: globalSettingsFrom(settings) });
    if (!result?.settings) { errorNotice(result, '保存失败：'); return; }
    state = latest;
    acceptSettings(result.settings);
    notice('全局设置已保存，扩展继续自动识别与同步。');
  }
  async function run(type, dryRun) {
    const origin = selectedOrigin;
    const result = await send({ type, origin, ...(type === 'SYNC_PENDING' ? { dryRun } : {}) });
    try { state = await freshState(); }
    catch {
      state.sites = { ...state.sites, [origin]: { ...state.sites?.[origin], origin, backupCount: 0 } };
      notice('操作已返回，但状态刷新失败，请重新打开弹窗确认。', true);
    }
    state.sites = { ...state.sites, [origin]: { ...state.sites?.[origin], origin, lastResult: result } };
    render();
  }
  async function refreshDiagnostics() {
    if (!saved || refreshing) return;
    refreshing = true;
    try { state = await freshState(); render(); }
    catch { notice('状态更新暂不可用，请重新打开弹窗确认。', true); }
    finally { refreshing = false; }
  }

  $('site').addEventListener('change', () => { selectedOrigin = $('site').value; notice(); renderStatus(); renderControls(); });
  for (const id of ['enabled', 'backend', 'frontend']) $(id).addEventListener('input', renderControls);
  $('save').addEventListener('click', () => busy(save));
  $('sync').addEventListener('click', () => busy(() => run('SYNC_PENDING', false)));
  $('check').addEventListener('click', () => busy(() => run('SYNC_PENDING', true)));
  $('restore').addEventListener('click', () => busy(() => run('RESTORE_LATEST')));
  // Read diagnostic changes through the sanitized GET_STATUS contract, not raw stored candidates/backups.
  chromeApi.storage?.onChanged?.addListener((changes, area) => {
    if (area === 'local' && ['sites', 'lastResult', 'observations', 'lastResults'].some(key => Object.hasOwn(changes, key))) return refreshDiagnostics();
  });

  return {
    async load() {
      try {
        const [latest, tabs] = await Promise.all([freshState(), chromeApi.tabs.query({ active: true, currentWindow: true }).catch(() => [])]);
        state = latest;
        const settings = globalSettingsFrom(latest.settings);
        activeOrigin = pageOrigin(tabs?.[0]?.url, settings);
        selectedOrigin = activeOrigin || '';
        acceptSettings(settings);
      } catch (error) {
        $('status').textContent = '无法读取状态';
        errorNotice(error);
        renderControls();
      }
    },
  };
}

if (typeof document !== 'undefined' && typeof chrome !== 'undefined') createPopup(document, chrome).load();
