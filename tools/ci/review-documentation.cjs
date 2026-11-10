'use strict';
// Read-only rendering: no credentials, comments, or repository writes outside .cache.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { isReviewPage, isReviewSvg, documentLanguage } = require('../lib/documentation-review-scope');
(async () => {
  const { marked } = await import(require.resolve('marked'));
  const out = '.cache/documentation-review'; fs.mkdirSync(out, {recursive:true});
  const files = execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
  const pages = files.filter(isReviewPage);
  const b = await chromium.launch({args:['--no-sandbox', '--allow-file-access-from-files']});
  const evidence=[]; const failures=[];
  for (const file of pages) for (const [mode,width,scheme] of [['light',1440,'light'],['dark',1440,'dark'],['mobile',390,'light']]) {
    const p=await b.newPage({viewport:{width,height:1000},colorScheme:scheme});
    await p.goto('file://'+path.resolve(file));
    await p.setContent('<html lang="'+documentLanguage(file)+'"><head><base href="file://'+path.resolve(path.dirname(file))+'/"><style>*{box-sizing:border-box}body{margin:24px auto;padding:0 16px;max-width:980px;font:16px/1.65 system-ui,sans-serif;overflow-wrap:anywhere}img{max-width:100%;height:auto}pre{overflow:auto}table{display:block;overflow:auto;max-width:100%}td,th{border:1px solid #aaa;padding:8px}summary{cursor:pointer}a{color:#0969da}@media(prefers-color-scheme:dark){body{background:#151b23;color:#ddd}a{color:#8bd}}</style></head><body>'+marked.parse(fs.readFileSync(file,'utf8'))+'</body></html>');
    await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
    const state=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src'))}));
    if(state.scroll>width||state.broken.length)failures.push({file,mode,...state});
    const name=String(pages.indexOf(file)).padStart(2,'0')+'-'+mode;
    await p.screenshot({path:`${out}/${name}.png`,fullPage:true});evidence.push({file,mode,screenshot:name+'.png',...state});await p.close();
  }
  // Verify every SVG text bounding box, including assets not currently linked.
  for(const file of files.filter(isReviewSvg)){
    const p=await b.newPage();await p.goto('file://'+path.resolve(file));
    const clipped=await p.evaluate(()=>{const s=document.documentElement, v=s.viewBox.baseVal;return [...s.querySelectorAll('text')].map(t=>{const b=t.getBBox(),m=t.getCTM();const points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));const xs=points.map(p=>p.x),ys=points.map(p=>p.y);return {text:t.textContent,b:{x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)}};}).filter(({b})=>b.x < -1||b.y < -1||b.x+b.width>v.width+1||b.y+b.height>v.height+1).map(({text})=>text)});
    if(clipped.length)failures.push({file,clipped});await p.close();
  }
  for(const [mode,width,scheme] of [['light',1440,'light'],['dark',1440,'dark'],['mobile',390,'light'],['narrow',320,'light']]){
    const p=await b.newPage({viewport:{width,height:1000},colorScheme:scheme,locale:'zh-CN'});
    const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('file://'+path.resolve('docs/configuration.html'));
    if(await p.locator('html').getAttribute('lang')!=='en')throw new Error('Fresh Chinese-browser visit must default to English');
    async function checkForm(lang,client,state){
      const layout=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,
        elements:[...document.querySelectorAll('main *')].filter(e=>e.getClientRects().length).map(e=>{
          const r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,className:e.className,left:r.left,right:r.right};
        }).filter(r=>r.right>innerWidth||r.left<0)}));
      if(layout.scroll>width)failures.push({file:'configuration.html',mode,lang,client,state,overflow:true,...layout});
    }
    for(const [step,lang] of ['en','zh','en'].entries()){
      await p.locator('#language').selectOption(lang);
      for(const client of await p.locator('#client option').evaluateAll(xs=>xs.map(x=>x.value))){
        await p.locator('#client').selectOption(client);await p.locator('#local-tab').click();
        await checkForm(lang,client,'local');
        if(width<=390&&client.startsWith('openclash-')){
          const screenshot=`form-${mode}-${step}-${lang}-${client}-local.png`;
          await p.screenshot({path:`${out}/${screenshot}`,fullPage:true});evidence.push({file:'configuration.html',mode,lang,client,state:'local',screenshot});
        }
        await p.locator('#business-tab').click();await p.locator('#profile').selectOption('custom');
        await p.locator('.preview details').evaluate(e=>{e.open=true});
        await checkForm(lang,client,'custom-and-advanced');
        await p.locator('.preview details').evaluate(e=>{e.open=false});
        await p.locator('#profile').selectOption('full');
        await checkForm(lang,client,'business');
      }
      await p.locator('#client').selectOption('flclash');await p.locator('#business-tab').click();
      await p.screenshot({path:`${out}/form-${mode}-${lang}.png`,fullPage:true});
    }
    if(errors.length)failures.push({file:'configuration.html',mode,errors});await p.close();
  }
  await b.close();fs.writeFileSync(`${out}/report.json`,JSON.stringify({evidence,failures},null,2));
  if(failures.length)throw new Error(JSON.stringify(failures));console.log(`Rendered ${pages.length} documents and both configuration locales; no overflow or broken images.`);
})().catch(error=>{console.error(error);process.exit(1)});
