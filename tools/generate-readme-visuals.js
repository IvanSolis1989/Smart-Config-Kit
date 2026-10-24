#!/usr/bin/env node
'use strict';

// README presentation assets only. No network, rule generation or runtime changes.
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, '..', 'docs', 'assets', 'readme');
const check = process.argv.includes('--check');
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const ink = '#18324f';
const muted = '#506780';
const font = "'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
const assets = new Map();

function text(x, y, value, size = 20, weight = 400, color = ink, extra = '') {
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" ${extra}>${esc(value)}</text>`;
}
function lines(x, y, values, size = 18, gap = 28, color = muted) {
  return values.map((s, i) => text(x, y + gap * i, s, size, 400, color)).join('');
}
function rect(x, y, w, h, tint = '#e8f3ff', r = 20) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${tint}" fill-opacity=".8" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/><rect x="${x + .5}" y="${y + .5}" width="${w - 1}" height="${h - 1}" rx="${r}" fill="url(#glass)" stroke="#a8c2dd" stroke-opacity=".48"/>`;
}
function arrow(x1, y1, x2, y2, color = '#6384ac') {
  return `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" marker-end="url(#arrow)"/>`;
}
function curve(d) {
  return `<path d="${d}" fill="none" stroke="#7b99b9" stroke-width="2.2" stroke-linecap="round" marker-end="url(#arrow)"/>`;
}
function document(name, w, h, title, desc, body, button = false) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title><desc id="desc">${esc(desc)}</desc>
<defs>
 <linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eff8ff"/><stop offset=".5" stop-color="#f4f8ff"/><stop offset="1" stop-color="#e7f3f7"/></linearGradient>
 <linearGradient id="glass" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#ffffff" stop-opacity=".88"/><stop offset=".48" stop-color="#ffffff" stop-opacity=".25"/><stop offset="1" stop-color="#ffffff" stop-opacity=".57"/></linearGradient>
 <linearGradient id="ribbon" x1="0" x2="1"><stop stop-color="#166cd5"/><stop offset=".52" stop-color="#16a6b0"/><stop offset="1" stop-color="#8273cf"/></linearGradient>
 <radialGradient id="aura"><stop stop-color="#95c8ff" stop-opacity=".5"/><stop offset="1" stop-color="#95c8ff" stop-opacity="0"/></radialGradient>
 <filter id="shadow" x="-10%" y="-15%" width="120%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#51739b" flood-opacity=".09"/></filter>
 <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L7 4L1 7" fill="none" stroke="#6384ac" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>
</defs>
<g font-family="${font}">
${button ? '' : `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="28" fill="url(#base)" stroke="#c8ddee"/><ellipse cx="${w * .85}" cy="15" rx="${w * .36}" ry="${h * .75}" fill="url(#aura)"/><path d="M28 1H${w - 28}" stroke="#ffffff" stroke-width="2"/>`}
${body}
</g></svg>
`;
  if (/<(?:script|foreignObject)\b|(?:href|src)\s*=\s*["']https?:/i.test(svg)) throw new Error(`Unsafe SVG: ${name}`);
  assets.set(name, svg);
}

// A restrained network prism: the same source emerges as native client formats.
document('hero.svg', 1120, 250, 'Smart-Config-Kit', '同一规则源，多端原生分流。桌面、移动端与 OpenWrt。',
  `<path d="M755 52L1000 126L755 201L682 126Z" fill="none" stroke="#98b9dc" stroke-width="1.5"/>
  <path d="M755 52L755 201M682 126H1000M755 52L895 126L755 201" fill="none" stroke="#b7cfeb"/>
  ${rect(696, 78, 140, 96, '#d8eeff', 24)}${text(766, 117, '同源', 25, 650, ink, 'text-anchor="middle"')}${text(766, 147, 'Source graph', 17, 400, muted, 'text-anchor="middle"')}
  ${[[891, 44, '.mrs'], [952, 108, '.srs'], [891, 172, 'Native']].map(([x, y, s]) => `${rect(x, y, 112, 48, '#e7e9ff', 15)}${text(x + 56, y + 31, s, 18, 600, ink, 'text-anchor="middle"')}`).join('')}
  ${text(48, 96, 'Smart-Config-Kit', 49, 650)}${text(50, 139, '同一规则源，多端原生分流。', 26, 500)}
  ${text(50, 190, '桌面 · 移动端 · OpenWrt', 19, 400, muted)}
  <rect x="50" y="214" width="104" height="4" rx="2" fill="url(#ribbon)"/>`);

document('routing-flow.svg', 1120, 460, '同源编译与规则命中', '规则源图经 MRS 归一化和 fused 编译生成各端原生格式。请求按源图规则顺序命中，UI 分组顺序不是匹配顺序。',
  `${text(36, 48, '从同一规则源，到各端原生配置', 27, 650)}
  ${rect(36, 77, 272, 103, '#e0edff')}${text(56, 111, '唯一规则源', 22, 650)}${text(56, 143, 'routing-graph.js', 20, 400, muted)}
  ${arrow(316, 129, 353, 129)}
  ${rect(364, 77, 310, 103, '#d9f4f0')}${text(384, 111, 'MRS 归一化 → fused 编译', 21, 650)}${text(384, 143, '按策略、顺序与平台能力输出', 18, 400, muted)}
  ${arrow(682, 129, 718, 129)}
  ${rect(730, 77, 354, 103, '#e9e4fc')}${text(750, 111, '各端原生规则资产', 22, 650)}${text(750, 143, '.mrs / .srs / 文本 / YAML / Xray', 18, 400, muted)}
  <path d="M36 215H1084" stroke="#c9dbea"/>
  ${text(36, 253, '运行时：先后命中，以源图顺序为准', 23, 650)}
  ${rect(36, 282, 134, 75, '#e2edff', 18)}${text(103, 327, '流量请求', 21, 600, ink, 'text-anchor="middle"')}
  ${arrow(177, 319, 208, 319)}
  ${rect(220, 282, 390, 75, '#e0f3f0', 18)}${text(415, 314, '按顺序检查 fused 规则与必要内联', 20, 600, ink, 'text-anchor="middle"')}${text(415, 340, '含安全前置、业务细分与直连规则', 18, 400, muted, 'text-anchor="middle"')}
  ${arrow(617, 319, 648, 319)}
  ${rect(660, 282, 194, 75, '#eee7fa', 18)}${text(757, 327, '命中目标策略', 21, 600, ink, 'text-anchor="middle"')}
  ${arrow(861, 319, 892, 319)}
  ${rect(904, 282, 180, 75, '#e2edf9', 18)}${text(994, 327, '选择实际出口', 21, 600, ink, 'text-anchor="middle"')}
  ${text(36, 405, '未命中 → MATCH / FINAL 漏网之鱼', 19, 550)}${text(610, 405, '界面组顺序 ≠ 规则匹配顺序', 19, 550, '#5b5e93')}`);

document('policy-map.svg', 1120, 432, '业务策略到区域节点的选择关系', '33 个业务组按主要类别展示，按候选选择 11 个区域的全部节点或家宽节点，最终到达实际节点；各端能力存在差异。',
  `${text(36, 48, '业务决定策略，区域决定出口', 27, 650)}
  ${text(36, 85, '33 个业务组', 21, 650)}${text(526, 85, '22 个区域组', 21, 650)}${text(947, 85, '实际节点', 21, 650)}
  ${rect(36, 106, 380, 230, '#e7edff')}
  ${lines(58, 143, ['AI / 金融 / 通讯 / 社交 / 协作', '国内与国外流媒体', '国内与国外游戏', '工具 / 平台服务 / 下载 / Tracker', '网站分流 / 广告拦截 / 最终兜底'], 20, 40, ink)}
  ${arrow(424, 220, 469, 220)}
  ${rect(482, 106, 386, 230, '#dcf2f0')}
  ${text(504, 142, '11 个区域 × 全部 / 家宽', 22, 650)}
  ${lines(504, 181, ['全球 · 香港 · 台湾 · 狮城', '日韩 · 亚太 · 美国 · 欧洲', '美洲 · 非洲 · 其他'], 20, 34, ink)}
  ${text(504, 307, '按候选选择；自动择路依客户端能力', 18, 400, muted)}
  ${arrow(876, 220, 922, 220)}
  ${rect(936, 160, 148, 120, '#e7e3fa')}${text(1010, 203, '订阅节点池', 20, 600, ink, 'text-anchor="middle"')}${text(1010, 238, '已清洗与分类', 18, 400, muted, 'text-anchor="middle"')}
  ${text(36, 380, '业务组也可按候选直连或拦截；图示为具备区域策略组的客户端。', 18, 400, muted)}
  ${text(36, 409, 'sing-box、Xray、Passwall 与 Karing 的组结构和节点接入边界，见正文与各端教程。', 18, 400, muted)}`);

document('dns-flow.svg', 1120, 552, 'Mihomo DNS 四层分工', '客户端启动由 default-nameserver 进行 bootstrap，随后按域名性质分为国内业务、代理节点域名与海外业务三条 DoH 通道。此图只适用于主线 Mihomo DNS 示意。',
  `${text(36, 48, 'DNS 四层分工', 27, 650)}${text(1084, 47, '主线 Mihomo 配置示意', 19, 500, muted, 'text-anchor="end"')}
  ${rect(36, 75, 1048, 100, '#e0edff')}
  ${text(58, 110, '① 启动引导 · default-nameserver', 22, 650)}
  ${text(58, 145, 'DoH-over-IP + 明文兜底；仅为 DoH 服务域名提供 bootstrap 解析', 20, 400, muted)}
  ${curve('M560 182V204M560 204H205V232')}${curve('M560 204V232')}${curve('M560 204H915V232')}
  ${[[36, '#ddf3ed'], [392, '#e0edff'], [748, '#ebe5fc']].map(([x, color]) => rect(x, 246, 336, 216, color)).join('')}
  ${text(58, 281, '② 国内业务域名', 22, 650)}
  ${lines(58, 315, ['nameserver-policy', '/ nameserver', 'geosite:cn → AliDNS / DNSPod', '大陆站点与国内 CDN'], 18, 31)}
  ${text(414, 281, '③ 代理节点域名', 22, 650)}
  ${lines(414, 315, ['proxy-server-nameserver', 'Cloudflare / Google', 'AliDNS / DNSPod', '解析活动代理节点 FQDN'], 18, 31)}
  ${text(770, 281, '④ 海外业务域名', 22, 650)}
  ${lines(770, 315, ['nameserver-policy / fallback', 'geosite:geolocation-!cn', 'Cloudflare / Google', 'fallback-filter · GeoIP CN'], 18, 31)}
  ${text(36, 504, '业务查询优先使用加密 DoH；ISP 可见性仍取决于 bootstrap、客户端与网络路径。', 18, 400, muted)}
  ${text(36, 534, '其他客户端遵循各自原生 DNS；Karing 的 DNS 由适配配置与 App 设置维护。', 18, 400, muted)}`);

// Narrow-screen alternatives preserve readable type instead of shrinking the desktop diagrams.
document('routing-flow-mobile.svg', 420, 744, '同源编译与规则命中', '窄屏版：规则源图经 MRS 与 fused 编译为原生配置；运行时按规则顺序检查并选择出口。',
  `${text(24, 42, '同源编译，按序命中', 25, 650)}
  ${rect(24, 65, 372, 69, '#e0edff', 18)}${text(44, 93, '唯一规则源', 21, 650)}${text(44, 120, 'routing-graph.js', 18, 400, muted)}
  ${arrow(210, 140, 210, 155)}
  ${rect(24, 166, 372, 76, '#d9f4f0', 18)}${text(44, 195, 'MRS 归一化 → fused 编译', 21, 650)}${text(44, 224, '按策略、顺序与平台能力输出', 18, 400, muted)}
  ${arrow(210, 249, 210, 264)}
  ${rect(24, 275, 372, 76, '#e9e4fc', 18)}${text(44, 304, '各端原生规则资产', 21, 650)}${text(44, 333, '.mrs / .srs / 文本 / YAML / Xray', 18, 400, muted)}
  ${text(24, 390, '运行时：请求按源图顺序检查', 21, 650)}
  ${rect(24, 408, 372, 87, '#e0f3f0', 18)}${text(44, 438, 'fused 规则 + 必要内联', 21, 650)}${text(44, 468, '含安全前置、业务细分与直连规则', 18, 400, muted)}
  ${arrow(210, 502, 210, 517)}
  ${rect(24, 528, 372, 58, '#eee7fa', 18)}${text(210, 564, '命中目标策略', 21, 600, ink, 'text-anchor="middle"')}
  ${arrow(210, 593, 210, 608)}
  ${rect(24, 619, 372, 58, '#e2edf9', 18)}${text(210, 655, '选择实际出口', 21, 600, ink, 'text-anchor="middle"')}
  ${text(24, 708, '未命中 → MATCH / FINAL 漏网之鱼', 18, 500)}${text(24, 733, '界面组顺序 ≠ 规则匹配顺序', 18, 500, '#5b5e93')}`);

document('policy-map-mobile.svg', 420, 768, '业务策略与区域节点', '窄屏版：33 业务组到 22 区域组，再到实际节点。业务组也可以按候选直连或拦截。',
  `${text(24, 42, '业务决定策略，区域决定出口', 24, 650)}
  ${rect(24, 65, 372, 217, '#e7edff', 18)}${text(44, 98, '33 个业务组', 22, 650)}
  ${lines(44, 133, ['AI / 金融 / 通讯 / 社交 / 协作', '国内与国外流媒体', '国内与国外游戏', '工具 / 平台服务 / 下载 / Tracker', '网站分流 / 广告拦截 / 最终兜底'], 18, 31, ink)}
  ${arrow(210, 290, 210, 309)}
  ${rect(24, 321, 372, 197, '#dcf2f0', 18)}${text(44, 354, '22 区域组 · 11 全部 + 11 家宽', 21, 650)}
  ${lines(44, 390, ['全球 · 香港 · 台湾 · 狮城', '日韩 · 亚太 · 美国 · 欧洲', '美洲 · 非洲 · 其他'], 19, 30, ink)}
  ${text(44, 494, '按候选选择，自动择路依客户端能力', 18, 400, muted)}
  ${arrow(210, 526, 210, 545)}
  ${rect(24, 557, 372, 75, '#e7e3fa', 18)}${text(44, 589, '实际节点 · 订阅节点池', 21, 650)}${text(44, 616, '已清洗与分类', 18, 400, muted)}
  ${lines(24, 668, ['业务组也可按候选直连或拦截。', '图示适用于具备区域策略组的客户端；', 'sing-box / Xray / Passwall / Karing', '的组结构与接入边界，见各端教程。'], 18, 27)}`);

document('dns-flow-mobile.svg', 420, 978, 'Mihomo DNS 四层分工', '窄屏版：启动引导完成后，国内业务、代理节点与海外业务是三个并行 DNS 通道，不是串行查询。',
  `${text(24, 42, 'DNS 四层分工', 25, 650)}${text(24, 71, '主线 Mihomo 配置示意', 18, 400, muted)}
  ${rect(24, 91, 372, 126, '#e0edff', 18)}${text(44, 122, '① 启动引导', 22, 650)}${text(44, 151, 'default-nameserver', 20, 600)}${lines(44, 180, ['DoH-over-IP + 明文兜底', '仅为 DoH 服务域名提供引导解析'], 18, 25)}
  ${text(24, 252, 'bootstrap 后，按域名性质分三路', 19, 600)}
  <path d="M210 223V229M210 263V267H31V699" fill="none" stroke="#7b99b9" stroke-width="2.2"/>
  ${[350, 524, 698].map(y => arrow(31, y, 47, y)).join('')}
  ${rect(58, 277, 338, 153, '#ddf3ed', 18)}${text(78, 310, '② 国内业务域名', 22, 650)}${lines(78, 341, ['nameserver-policy / nameserver', 'geosite:cn → AliDNS / DNSPod', '大陆站点与国内 CDN'], 18, 31)}
  ${rect(58, 451, 338, 153, '#e0edff', 18)}${text(78, 484, '③ 代理节点域名', 22, 650)}${lines(78, 515, ['proxy-server-nameserver', 'Cloudflare / Google', 'AliDNS / DNSPod · 活动节点 FQDN'], 18, 31)}
  ${rect(58, 625, 338, 153, '#ebe5fc', 18)}${text(78, 658, '④ 海外业务域名', 22, 650)}${lines(78, 689, ['nameserver-policy / fallback', 'geosite:geolocation-!cn', 'Cloudflare / Google · GeoIP CN'], 18, 31)}
  ${lines(24, 817, ['业务查询优先使用加密 DoH；', 'ISP 可见性仍取决于 bootstrap、', '客户端与网络路径。', '其他客户端遵循各自原生 DNS；', 'Karing DNS 由适配配置与 App 维护。'], 18, 30)}`);

const buttons = [
  ['smart-js', 'Smart', 'JS', 'blue'], ['normal-js', 'Normal', 'JS', 'blue'],
  ['cmfa-yaml', 'CMFA', 'YAML', 'blue'], ['stash-yaml', 'Stash', 'YAML', 'violet'],
  ['smart-sh', 'Smart', 'SH', 'blue'], ['normal-sh', 'Normal', 'SH', 'blue'],
  ['ui-conf', 'UI config', 'CONF', 'blue'], ['shadowrocket-conf', 'Shadowrocket', 'CONF', 'violet'],
  ['sing-box-json', 'sing-box', 'JSON', 'teal'], ['karing-json', 'Karing', 'JSON', 'teal'],
  ['sing-box-full', 'sing-box Full', 'JSON', 'teal'], ['sing-box-113', 'sing-box 1.13', 'JSON', 'teal'],
  ['mihomo-yaml', 'mihomo', 'YAML', 'blue'], ['xray-json', 'Xray routing', 'JSON', 'violet'],
  ['surge-conf', 'Surge', 'CONF', 'violet'], ['loon-conf', 'Loon', 'CONF', 'violet'],
  ['quantumult-x-conf', 'Quantumult X', 'CONF', 'violet'], ['egern-yaml', 'Egern', 'YAML', 'violet'],
  ['passwall-sh', 'Passwall', 'SH', 'teal'], ['passwall2-sh', 'Passwall2', 'SH', 'teal'],
  ['flclash-js', 'FlClash', 'JS', 'blue'],
];
const colors = {
  blue: ['#e0efff', '#f6fbff', '#2869b2', '#a5c9ed'],
  teal: ['#d9f2ef', '#f2fcf9', '#147e7c', '#9ecfc9'],
  violet: ['#eae4fc', '#fbf8ff', '#6f57a6', '#c8bbe9'],
};
for (const [slug, label, format, color] of buttons) {
  const [a, b, accent, stroke] = colors[color];
  document(`button-${slug}.svg`, 145, 38, `下载 ${label} ${format}`, `打开 ${label} ${format} 原始文件`,
    `<defs><linearGradient id="button" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${b}"/><stop offset=".53" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect x="1" y="1" width="143" height="36" rx="11" fill="url(#button)" stroke="${stroke}"/>
    <path d="M12 2H133" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
    ${text(13, 17, label, 14, 600)}${text(13, 30, format, 9.5, 600, accent)}
    <circle cx="126" cy="19" r="11" fill="#ffffff" fill-opacity=".55"/>
    <path d="M126 13V23M122 19L126 23L130 19M121 27H131" fill="none" stroke="${accent}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`, true);
}

let failures = 0;
if (!check) fs.mkdirSync(out, { recursive: true });
for (const [name, svg] of assets) {
  const file = path.join(out, name);
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== svg) {
      console.error(`Out of date: docs/assets/readme/${name}`);
      failures++;
    }
  } else fs.writeFileSync(file, svg, 'utf8');
}
if (failures) process.exitCode = 1;
else console.log(`${check ? 'Checked' : 'Generated'} ${assets.size} README SVG assets.`);
