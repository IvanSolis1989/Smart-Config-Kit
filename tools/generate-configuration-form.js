'use strict';

// This page is self-contained: the trusted catalogs are embedded at build time.
const fs = require('node:fs');
const path = require('node:path');
const { definitions } = require('./lib/configuration-schema');
const { getBusinessProfileCatalog } = require('./lib/business-profiles');
const output = path.join(__dirname, '../docs/configuration.html');
const data = JSON.stringify({ definitions, business: getBusinessProfileCatalog() }).replace(/</g, '\\u003c');
const page = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark"><title>配置向导 · Smart Config Kit</title>
<style>
:root{font-family:"Microsoft YaHei UI","PingFang SC",sans-serif;color:#143351;background:#edf5fb;--panel:rgba(255,255,255,.82);--border:#cddfea;--muted:#4b6a80;--accent:#087d9b;--soft:#e5f5f7;--code:#11334b;--shadow:0 22px 60px rgba(28,75,108,.11)}
@media(prefers-color-scheme:dark){:root{color:#e4f2f7;background:#0c1b2a;--panel:rgba(20,41,59,.88);--border:#365669;--muted:#a3bfcb;--accent:#63d4e0;--soft:#183e4c;--code:#e1f3f5;--shadow:0 22px 60px rgba(0,0,0,.22)}}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 85% 0%,rgba(70,195,205,.18),transparent 35%),radial-gradient(ellipse at 0% 30%,rgba(86,140,221,.15),transparent 40%)}main{max-width:1200px;margin:auto;padding:42px 24px 64px}header{max-width:800px;margin-bottom:28px}.brand{font-size:.85rem;font-weight:700;letter-spacing:.04em;color:var(--accent)}h1{font-size:clamp(2rem,5vw,3.7rem);letter-spacing:-.045em;line-height:1.1;margin:12px 0}header p,.muted{color:var(--muted);line-height:1.7}header p{font-size:1.05rem}.layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,1fr);gap:20px;align-items:start}.panel{background:var(--panel);border:1px solid var(--border);border-radius:22px;box-shadow:var(--shadow);padding:26px;backdrop-filter:blur(18px)}.tabs{display:flex;gap:8px;border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:22px;flex-wrap:wrap}button{font:inherit;cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--accent);outline-offset:3px}.tab{border:1px solid var(--border);background:transparent;color:inherit;border-radius:12px;padding:10px 16px;font-weight:700}.tab[aria-selected=true]{background:var(--soft);border-color:var(--accent);color:var(--accent)}h2{font-size:1.35rem;margin:0 0 8px}h3{font-size:1rem;margin:24px 0 8px}.intro{margin:0 0 22px;color:var(--muted);line-height:1.65}.field{display:grid;grid-template-columns:minmax(0,1fr) minmax(140px,210px);gap:18px;align-items:center;padding:17px 0;border-top:1px solid var(--border)}label{font-weight:700}.hint{font-weight:400;color:var(--muted);font-size:.88rem;line-height:1.55;margin:5px 0 0}select,input[type=number]{width:100%;font:inherit;color:inherit;background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:10px}input[type=checkbox]{accent-color:var(--accent);width:18px;height:18px}.checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:15px}.check{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid var(--border);border-radius:10px;font-size:.9rem}.notice{padding:14px 16px;background:var(--soft);border-radius:12px;color:var(--muted);line-height:1.6;font-size:.9rem}.preview{position:sticky;top:20px}.preview pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:16px;background:var(--soft);color:var(--code);border-radius:12px;line-height:1.6;font-size:.8rem}.primary{width:100%;border:0;border-radius:12px;padding:13px 16px;color:white;background:#087d9b;font-weight:700}.primary:hover{background:#096b83}.error{color:#c73e4c;min-height:1.4em;font-size:.9rem}[hidden]{display:none!important}@media(max-width:720px){main{padding:26px 16px 48px}.layout{grid-template-columns:1fr}.panel{padding:20px}.preview{position:static}.field{grid-template-columns:1fr;gap:9px}.checks{grid-template-columns:1fr 1fr}}@media(max-width:360px){.checks{grid-template-columns:1fr}}
</style></head><body><main><header><div class="brand">SMART CONFIG KIT / 离线配置</div><h1>让配置适合你的使用方式</h1><p>选择一条路径，下载设置文件，再在本机运行对应命令。页面无需联网，设置不会自动应用到设备。</p></header>
<div class="layout"><section class="panel"><div class="tabs" role="tablist" aria-label="配置类型"><button class="tab" id="local-tab" role="tab" aria-selected="true" aria-controls="local-panel">本地 JS 参数</button><button class="tab" id="business-tab" role="tab" aria-selected="false" aria-controls="business-panel">全端业务</button></div>
<div id="local-panel" role="tabpanel" aria-labelledby="local-tab"><h2>本地 JS 参数</h2><p class="intro">为指定的本地覆写脚本设置测速、QUIC 和订阅适配等选项。默认保留现有行为。</p><div id="fields"></div></div>
<div id="business-panel" role="tabpanel" aria-labelledby="business-tab" hidden><h2>全端业务</h2><p class="intro">选择要保留专属规则与策略组的业务，由命令行生成到新的输出目录。此设置独立于本地 JS 参数。</p><div class="field"><div><label for="profile">业务方案</label><p class="hint">完整保留全部业务；精简使用预设；自选可逐项配置。</p></div><select id="profile"><option value="full">完整（默认）</option><option value="lite">精简</option><option value="custom">自选</option></select></div><div id="custom" hidden><h3>保留的业务</h3><div id="services" class="checks"></div></div><p id="fallback" class="notice"></p></div></section>
<aside class="panel preview"><h2>下载与使用</h2><p class="intro">下载的是设置 JSON。请将命令中的路径替换成你的实际路径。</p><button class="primary" id="download">下载设置 JSON</button><p id="error" class="error" role="alert"></p><h3>在仓库目录运行</h3><pre id="command"></pre><p class="hint">命令可先加 <code>--dry-run</code> 检查；页面不会读取脚本、运行命令或验证设备。</p></aside></div></main>
<script>
'use strict';
const catalog = ${data};
const fields = document.getElementById('fields');
for (const [key, def] of Object.entries(catalog.definitions)) {
  const row = document.createElement('div'); row.className = 'field';
  const text = document.createElement('div'); const label = document.createElement('label'); label.htmlFor = key; label.textContent = def.label;
  const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = def.description; text.append(label, hint);
  let control;
  if (def.type === 'nullable-positive-number') { control = document.createElement('input'); control.type = 'number'; control.min = '0'; control.step = 'any'; control.placeholder = '留空：不筛选'; }
  else { control = document.createElement('select'); for (const value of def.values) { const option = document.createElement('option'); option.value = String(value); option.textContent = String(value); option.selected = value === def.default; control.append(option); } }
  control.id = key; row.append(text, control); fields.append(row);
}
const services = document.getElementById('services');
for (const service of catalog.business.services) { const label = document.createElement('label'); label.className = 'check'; const box = document.createElement('input'); box.type = 'checkbox'; box.value = service.id; box.checked = true; const text = document.createElement('span'); text.textContent = service.group; label.append(box, text); services.append(label); }
document.getElementById('fallback').textContent = catalog.business.fallbackExplanation;
let mode = 'local';
function render() { for (const name of ['local','business']) { const selected = mode === name; document.getElementById(name + '-tab').setAttribute('aria-selected', String(selected)); document.getElementById(name + '-panel').hidden = !selected; } document.getElementById('custom').hidden = document.getElementById('profile').value !== 'custom'; document.getElementById('command').textContent = mode === 'local' ? 'node tools/configure.js --settings settings.json --target local.js' : 'node tools/configure.js --settings settings.json --output-dir <全新目录>'; document.getElementById('error').textContent = ''; }
for (const name of ['local','business']) document.getElementById(name + '-tab').addEventListener('click', () => { mode = name; render(); });
document.getElementById('profile').addEventListener('change', render);
document.getElementById('download').addEventListener('click', () => {
  let settings;
  if (mode === 'local') { const localOptions = {}; for (const [key, def] of Object.entries(catalog.definitions)) { const value = document.getElementById(key).value; if (def.type === 'nullable-positive-number') { const number = value === '' ? null : Number(value); if (number !== null && (!Number.isFinite(number) || number <= 0)) { document.getElementById('error').textContent = '节点倍率上限必须是大于 0 的数字，或留空。'; return; } localOptions[key] = number; } else localOptions[key] = def.values.find(item => String(item) === value); } settings = { schema_version: 1, localOptions }; }
  else { const profile = document.getElementById('profile').value; const business = { profile }; if (profile === 'custom') business.enable = Array.from(services.querySelectorAll('input:checked'), box => box.value); settings = { schema_version: 1, business }; }
  const url = URL.createObjectURL(new Blob([JSON.stringify(settings, null, 2) + '\\n'], {type:'application/json'})); const link = document.createElement('a'); link.href = url; link.download = 'settings.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
render();
</script></body></html>\n`;
if (process.argv.includes('--check')) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== page) { console.error('Configuration form is out of date'); process.exitCode = 1; }
  else console.log('Configuration form is up to date');
} else { fs.writeFileSync(output, page); console.log(`Generated ${output}`); }
