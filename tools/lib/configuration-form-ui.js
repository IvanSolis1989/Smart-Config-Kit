// Browser-only display controller. Configuration data and export values stay unchanged.
const fields = document.getElementById('fields'), services = document.getElementById('services'), clientControl = document.getElementById('client');
const languageControl = document.getElementById('language');
const saved = Object.create(null), serviceViews = [], fieldViews = [];
let clientId = 'flclash', mode = 'business', lastError = null;
const t = source => locale.t(source);
function uiError(key, values) { const error = new Error(key); error.uiKey = key; error.uiValues = values; return error; }
function showError(error) { lastError = error; document.getElementById('error').textContent = error ? locale.error(error) : ''; }
function currentClient() { const client = bundle.clients.find(item => item.id === clientId); if (!client) throw new Error('未知客户端'); return client; }
for (const client of bundle.clients) { const option = document.createElement('option'); option.value = client.id; option.textContent = t(client.label); option.selected = client.id === clientId; clientControl.append(option); }
for (const service of bundle.services) {
  const label = document.createElement('label'); label.className = 'check';
  const box = document.createElement('input'); box.type = 'checkbox'; box.value = service.id; box.checked = true; box.addEventListener('change', render);
  const text = document.createElement('span'); text.textContent = t(service.group); label.append(box, text); services.append(label); serviceViews.push({text,source:service.group});
}
const parameterLabels = {
  healthCheckProfile: { standard:'标准（standard）', 'power-save':'省电（power-save）' },
  quicPolicy: { 'block-foreign':'拦截（block-foreign）', 'follow-rules':'按规则（follow-rules）' },
  browserUdpPolicy: { off:'关闭（off）', reject:'拒绝（reject）' },
  zeroTierPlanetProxy: { true:'开启（true）', false:'关闭（false）' },
  subscriptionAdapterProfile: { off:'关闭适配（off）', policy:'显式策略（policy）', adaptive:'自适应（adaptive）', 'hosts-only':'精确映射（hosts-only）' },
};
function parameterLabel(key, value) { const labels = parameterLabels[key], literal = String(value); return labels && Object.hasOwn(labels, literal) ? t(labels[literal]) : literal; }
function refreshFieldText() {
  for (const { key, def, label, hint, control } of fieldViews) {
    label.textContent = t(def.label);
    hint.textContent = t(def.description) + (def.max !== undefined ? locale.message('maximum',{max:def.max}) : '');
    if (def.type === 'nullable-positive-number') control.placeholder = t('留空：不筛选');
    else for (const option of control.children) option.textContent = parameterLabel(key, option.value);
  }
  if (!fieldViews.length && fields.children[0]) fields.children[0].textContent = t('此客户端没有可调整的本地参数。');
}
function buildFields() {
  fields.replaceChildren(); fieldViews.length = 0;
  for (const [key, def] of Object.entries(currentClient().localOptionSchema || {})) {
    if (def.values && def.values.length <= 1) continue;
    const row = document.createElement('div'); row.className = 'field'; const text = document.createElement('div');
    const label = document.createElement('label'); label.htmlFor = key;
    const hint = document.createElement('p'); hint.className = 'hint'; text.append(label, hint);
    let control;
    if (def.type === 'nullable-positive-number') {
      control = document.createElement('input'); control.type = 'number'; control.min = '0'; if (def.max !== undefined) control.max = String(def.max); control.step = 'any';
      control.value = saved[clientId] && saved[clientId][key] != null ? String(saved[clientId][key]) : '';
    } else {
      control = document.createElement('select');
      const selected = saved[clientId] && Object.hasOwn(saved[clientId], key) ? saved[clientId][key] : def.default;
      for (const value of def.values) { const option = document.createElement('option'); option.value = String(value); option.selected = value === selected; control.append(option); }
    }
    control.id = key; control.addEventListener('change', render); control.addEventListener('input', render); row.append(text, control); fields.append(row);
    fieldViews.push({key,def,label,hint,control});
  }
  if (!fields.children.length) { const note = document.createElement('p'); note.className = 'hint'; fields.append(note); }
  refreshFieldText();
}
function readLocalOptions() {
  const options = {};
  for (const [key, def] of Object.entries(currentClient().localOptionSchema || {})) {
    if (def.values && def.values.length <= 1) continue;
    const control = document.getElementById(key), value = control.value;
    if (def.type === 'nullable-positive-number') {
      if (control.validity && control.validity.badInput) throw uiError('multiplier',{max:def.max});
      const number = value === '' ? null : Number(value);
      if (number !== null && (!Number.isFinite(number) || number <= 0 || (def.max !== undefined && number > def.max))) throw uiError('multiplier',{max:def.max});
      options[key] = number;
    } else {
      const match = def.values.find(item => String(item) === value);
      if (match === undefined) throw uiError('invalidOption',{label:def.label}); options[key] = match;
    }
  }
  return options;
}
function businessSelection() { const profile = document.getElementById('profile').value; const selection = { client: clientId, profile }; if (profile === 'custom') selection.enable = Array.from(services.querySelectorAll('input:checked'), box => box.value); return selection; }
function render() {
  for (const name of ['local','business']) { const selected = mode === name; document.getElementById(name+'-tab').setAttribute('aria-selected', String(selected)); document.getElementById(name+'-panel').hidden = !selected; }
  const client = currentClient(), selection = businessSelection(); document.getElementById('custom').hidden = selection.profile !== 'custom';
  const enabled = selection.profile === 'full' ? bundle.services.map(s => s.id) : selection.profile === 'lite' ? bundle.presets.lite : selection.enable;
  const names = bundle.services.filter(s => enabled && enabled.includes(s.id)).map(s => t(s.group));
  const kept = selection.profile === 'custom' && names.length > 6 ? names.slice(0,4).join(locale.separator)+locale.message('more') : names.join(locale.separator);
  document.getElementById('summary').textContent = selection.profile === 'full' ? locale.message('full',{count:names.length}) : locale.message('kept',{count:names.length,names:kept});
  let changed;
  try { const local = readLocalOptions(); changed = Object.entries(local).filter(([key,value]) => value !== client.localOptionSchema[key].default).map(([key,value]) => t(client.localOptionSchema[key].label)+': '+parameterLabel(key,value)); }
  catch (_) { changed = [t('参数需检查')]; }
  document.getElementById('selection-summary').textContent = locale.message('selection',{client:t(client.label),profile:t(({full:'完整',lite:'精简',custom:'自选'}[selection.profile] || '无效')),options:changed.length ? changed.join(locale.separator) : t('默认')});
  document.getElementById('client-help').textContent = t(client.help);
  const canExport = ['smart','normal','flclash','aerove-lite'].includes(clientId); document.getElementById('download-local-json').hidden = !canExport;
  document.getElementById('local-json-note').textContent = t(canExport ? '本地参数 JSON 适用于此客户端的命令行写入。' : '此客户端的当前选项已直接包含在下载的配置中。');
  document.getElementById('baseline').textContent = locale.message('baseline',{version:'__FORM_VERSION__',baseline:bundle.sourceVersion});
}
function applyLanguage() {
  document.documentElement.lang = locale.language === 'zh' ? 'zh-CN' : 'en'; languageControl.value = locale.language;
  for (const element of document.querySelectorAll('[data-l10n]')) element.textContent = t(element.getAttribute('data-l10n'));
  for (const element of document.querySelectorAll('[data-l10n-aria]')) element.setAttribute('aria-label',t(element.getAttribute('data-l10n-aria')));
  for (let index=0; index<bundle.clients.length; index++) clientControl.children[index].textContent = t(bundle.clients[index].label);
  for (const view of serviceViews) view.text.textContent = t(view.source);
  // Update text in place: an invalid numeric draft, focus, selections and listeners survive.
  refreshFieldText(); render(); showError(lastError);
}
languageControl.addEventListener('change', () => { if (locale.choose(languageControl.value)) applyLanguage(); else languageControl.value=locale.language; });
for (const name of ['local','business']) document.getElementById(name+'-tab').addEventListener('click', () => { mode=name; render(); });
document.getElementById('profile').addEventListener('change', render);
clientControl.addEventListener('change', () => {
  try { if (!bundle.clients.some(item => item.id === clientControl.value)) throw new Error('未知客户端'); saved[clientId]=readLocalOptions(); clientId=clientControl.value; buildFields(); render(); showError(null); }
  catch (error) { clientControl.value=clientId; showError(error); }
});
function save(content,type,filename) { const url=URL.createObjectURL(new Blob([content],{type})); const link=document.createElement('a'); link.href=url; link.download=filename; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000); }
function safePath(path) { return typeof path === 'string' && path.length > 0 && !path.startsWith('/') && !path.includes('\\') && !path.includes(String.fromCharCode(0)) && !/^[A-Za-z]:/.test(path) && path.split('/').every(part => part && !['.','..','__proto__','prototype','constructor'].includes(part)); }
function bytes(file) { if (typeof file.content === 'string') return fflate.strToU8(file.content); if (typeof file.base64 === 'string') { const raw=atob(file.base64); return Uint8Array.from(raw,char => char.charCodeAt(0)); } throw new Error('无效文件内容'); }
document.getElementById('download').addEventListener('click', () => {
  try {
    showError(null); if (clientControl.value !== clientId) throw new Error('未知客户端');
    const selection=businessSelection(), options=readLocalOptions(), schema=currentClient().localOptionSchema || {};
    const changed=Object.fromEntries(Object.entries(options).filter(([key,value]) => value !== schema[key].default));
    if (Object.keys(changed).length) selection.localOptions=changed;
    const result=generateOfflineConfiguration(bundle,selection);
    if (!Array.isArray(result.files) || !result.files.length) throw new Error('没有可下载的文件');
    const paths=new Set(); for (const file of result.files) { if (!safePath(file.path) || paths.has(file.path)) throw new Error('无效或重复的文件路径'); paths.add(file.path); }
    if (result.files.length === 1) save(bytes(result.files[0]),result.mimeType,result.filename);
    else { const files=Object.create(null); for (const file of result.files) files[file.path]=bytes(file); save(fflate.zipSync(files,{mtime:new Date('2000-01-01T00:00:00Z')}),'application/zip',result.filename); }
  } catch (error) { showError(error); }
});
document.getElementById('download-business-json').addEventListener('click', () => { try { const selection=businessSelection(); delete selection.client; save(JSON.stringify({schema_version:1,business:selection},null,2)+'\n','application/json','settings.json'); } catch (error) { showError(error); } });
document.getElementById('download-local-json').addEventListener('click', () => { try { if (!['smart','normal','flclash','aerove-lite'].includes(clientId)) throw new Error('此客户端不支持本地参数 JSON'); save(JSON.stringify({schema_version:1,localOptions:readLocalOptions()},null,2)+'\n','application/json','settings.json'); } catch (error) { showError(error); } });
buildFields(); applyLanguage();
