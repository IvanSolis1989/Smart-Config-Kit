'use strict';

// This page is self-contained: the trusted catalogs are embedded at build time.
const fs = require('node:fs');
const path = require('node:path');
const { buildOfflineConfigurationBundle, renderOfflineConfigurationExporter } = require('./lib/offline-configuration-export');
const output = path.join(__dirname, '../docs/configuration.html');
const FORM_VERSION = '1.5.0';
const serialize = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const { validateDisplayCatalog, renderConfigurationLocale, localizeStaticMarkup } = require('./lib/configuration-locale');
const uiSource = fs.readFileSync(path.join(__dirname, 'lib/configuration-form-ui.js'), 'utf8').replace('__FORM_VERSION__', FORM_VERSION);
const bundle = buildOfflineConfigurationBundle();
validateDisplayCatalog(bundle);
const { deflateSync } = require('node:zlib');
const { configurationPagesEquivalent } = require('./lib/configuration-page-equivalence');
// Build-time native compression reduces the self-contained delivery size without
// removing catalog data. The vendored fflate browser decoder stays unchanged.
const embeddedBundle = deflateSync(Buffer.from(serialize(bundle), 'utf8'), { level: 9 }).toString('base64');
const zipLibrary = fs.readFileSync(path.join(__dirname, 'vendor/fflate/umd/index.js'), 'utf8');
const zipLicense = fs.readFileSync(path.join(__dirname, 'vendor/fflate/LICENSE'), 'utf8');
if (/<\/script/i.test(zipLibrary) || /<\/script|\*\//i.test(zipLicense)) throw new Error('Unsafe inline ZIP library or license');
let page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark"><title>配置向导 · Smart Config Kit</title>
<style>
:root{font-family:"Microsoft YaHei UI","PingFang SC",sans-serif;color:#143351;background:#edf5fb;--panel:rgba(255,255,255,.82);--border:#cddfea;--muted:#4b6a80;--accent:#087d9b;--soft:#e5f5f7;--code:#11334b;--shadow:0 22px 60px rgba(28,75,108,.11)}
@media(prefers-color-scheme:dark){:root{color:#e4f2f7;background:#0c1b2a;--panel:rgba(20,41,59,.88);--border:#365669;--muted:#a3bfcb;--accent:#63d4e0;--soft:#183e4c;--code:#e1f3f5;--shadow:0 22px 60px rgba(0,0,0,.22)}}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 85% 0%,rgba(70,195,205,.18),transparent 35%),radial-gradient(ellipse at 0% 30%,rgba(86,140,221,.15),transparent 40%)}main{max-width:1200px;margin:auto;padding:42px 24px 64px}header{max-width:800px;margin-bottom:28px}.brand{font-size:.85rem;font-weight:700;letter-spacing:.04em;color:var(--accent)}h1{font-size:clamp(2rem,5vw,3.7rem);letter-spacing:-.045em;line-height:1.1;margin:12px 0}header p,.muted{color:var(--muted);line-height:1.7}header p{font-size:1.05rem}.layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,1fr);gap:20px;align-items:start}.panel{background:var(--panel);border:1px solid var(--border);border-radius:22px;box-shadow:var(--shadow);padding:26px;backdrop-filter:blur(18px)}.tabs{display:flex;gap:8px;border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:22px;flex-wrap:wrap}button{font:inherit;cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--accent);outline-offset:3px}.tab{border:1px solid var(--border);background:transparent;color:inherit;border-radius:12px;padding:10px 16px;font-weight:700}.tab[aria-selected=true]{background:var(--soft);border-color:var(--accent);color:var(--accent)}h2{font-size:1.35rem;margin:0 0 8px}h3{font-size:1rem;margin:24px 0 8px}.intro{margin:0 0 22px;color:var(--muted);line-height:1.65}.field{display:grid;grid-template-columns:minmax(0,1fr) minmax(140px,210px);gap:18px;align-items:center;padding:17px 0;border-top:1px solid var(--border)}label{font-weight:700}.hint{font-weight:400;color:var(--muted);font-size:.88rem;line-height:1.55;margin:5px 0 0}select,input[type=number]{width:100%;font:inherit;color:inherit;background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:10px}input[type=checkbox]{accent-color:var(--accent);width:18px;height:18px}.checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:15px}.check{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid var(--border);border-radius:10px;font-size:.9rem}.notice{padding:14px 16px;background:var(--soft);border-radius:12px;color:var(--muted);line-height:1.6;font-size:.9rem}.preview{position:sticky;top:20px}.preview pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:16px;background:var(--soft);color:var(--code);border-radius:12px;line-height:1.6;font-size:.8rem}.primary{width:100%;border:0;border-radius:12px;padding:13px 16px;color:white;background:#087d9b;font-weight:700}.primary:hover{background:#096b83}.error{color:#c73e4c;min-height:1.4em;font-size:.9rem}[hidden]{display:none!important}@media(max-width:720px){main{padding:26px 16px 48px}.layout{grid-template-columns:1fr}.panel{padding:20px;backdrop-filter:none}.preview{position:static}.field{grid-template-columns:1fr;gap:9px}.checks{grid-template-columns:1fr 1fr}}@media(max-width:360px){.checks{grid-template-columns:1fr}}
</style></head><body><main><header><div class="field"><label for="language">Language / 语言</label><select id="language" aria-label="Language / 语言"><option value="en">English</option><option value="zh">简体中文</option></select></div><div class="brand">SMART CONFIG KIT / 本地配置</div><h1>让配置适合你的使用方式</h1><p>选择客户端、业务方案和可用参数。页面加载后配置在浏览器本地生成，不上传订阅或个人配置，也不会自动应用到设备。</p></header>
<div class="layout"><section class="panel"><div class="field"><div><label for="client">客户端</label><p class="hint">切换客户端时，各自的参数选择单独保存。</p></div><select id="client"></select></div><div class="tabs" role="tablist" aria-label="配置类型"><button class="tab" id="business-tab" role="tab" aria-selected="true" aria-controls="business-panel">业务方案</button><button class="tab" id="local-tab" role="tab" aria-selected="false" aria-controls="local-panel">可选参数</button></div>
<div id="local-panel" role="tabpanel" aria-labelledby="local-tab" hidden><h2>可选参数</h2><p class="intro">这里只显示当前客户端支持的选项；默认保留现有行为。</p><div id="fields"></div></div>
<div id="business-panel" role="tabpanel" aria-labelledby="business-tab"><h2>业务方案</h2><p class="intro">选择保留专属规则与策略组的业务。</p><div class="field"><div><label for="profile">业务方案</label><p class="hint">完整保留全部业务；精简使用预设；自选可逐项配置。</p></div><select id="profile"><option value="full">完整（Full）</option><option value="lite">精简（Lite）</option><option value="custom">自选（Custom）</option></select></div><p id="summary" class="hint" aria-live="polite"></p><div id="custom" hidden><h3>保留的业务</h3><div id="services" class="checks"></div></div><p class="notice">广告、安全、直连等基础保护保留；未选业务继续匹配后续基础规则。</p></div></section>
<aside class="panel preview"><h2>下载与使用</h2><p id="baseline" class="hint"></p><p id="selection-summary" class="hint" aria-live="polite"></p><button class="primary" id="download">下载配置</button><p id="error" class="error" role="alert"></p><h3>导入方法</h3><p id="client-help" class="hint"></p><p class="hint">多文件配置以 ZIP 下载，请保留其中的目录结构。页面不会读取个人文件、运行配置或验证设备。</p><details><summary>高级：下载独立设置 JSON</summary><p class="hint">业务与本地参数分别导出，直接下载的配置已包含当前选择。</p><button class="tab" id="download-business-json">下载业务设置 JSON</button><button class="tab" id="download-local-json">下载本地参数 JSON</button><p id="local-json-note" class="hint"></p></details></aside></div></main>
<script>/*\n${zipLicense}\n*/\n${zipLibrary}</script>
<script>
'use strict';
const bundle = JSON.parse(fflate.strFromU8(fflate.unzlibSync(Uint8Array.from(atob('${embeddedBundle}'), char => char.charCodeAt(0)))));
${renderOfflineConfigurationExporter()}
${renderConfigurationLocale()}
${uiSource}
</script></body></html>\n`;
const scriptStart = page.indexOf('<script>');
page = localizeStaticMarkup(page.slice(0, scriptStart)) + page.slice(scriptStart);
if (process.argv.includes('--check')) {
  if (!fs.existsSync(output) || !configurationPagesEquivalent(fs.readFileSync(output, 'utf8'), page)) { console.error('Configuration form is out of date'); process.exitCode = 1; }
  else console.log('Configuration form is up to date');
} else { fs.writeFileSync(output, page); console.log(`Generated ${output}`); }
