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

document('hero-mobile.svg', 420, 230, 'Smart-Config-Kit', '同一规则源，多端原生分流。桌面、移动端与 OpenWrt。',
  `<g fill="none" stroke="#aac7e2" stroke-width="1.3" opacity=".66"><path d="M333 102L423 158L333 214L291 158ZM333 102V214M291 158H423M333 102L382 158L333 214"/><circle cx="333" cy="158" r="7" fill="#f3fbff"/></g>
  ${text(25, 72, 'Smart-Config-Kit', 34, 650)}
  ${text(26, 114, '同一规则源，多端原生分流。', 22, 500)}
  ${text(26, 160, '桌面 · 移动端 · OpenWrt', 18, 400, muted)}
  <rect x="26" y="191" width="83" height="4" rx="2" fill="url(#ribbon)"/>`);

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
  ${text(36, 534, '其他客户端遵循各自原生 DNS；Karing 的 DNS 由 App 设置维护。', 18, 400, muted)}`);

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
  ${lines(24, 817, ['业务查询优先使用加密 DoH；', 'ISP 可见性仍取决于 bootstrap、', '客户端与网络路径。', '其他客户端遵循各自原生 DNS；', 'Karing 的 DNS 由 App 设置维护。'], 18, 30)}`);

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

// Homepage navigation stays separate from download buttons and their public names.
const families = [
  ['mihomo', 'Mihomo', ['Clash Party · CMFA', 'OpenClash · FlClash'], 'blue'],
  ['sing-box', 'sing-box', ['SingBox · Karing'], 'teal'],
  ['xray', 'Xray', ['v2rayN 路由'], 'violet'],
  ['dual-core', '双内核', ['Passwall · Passwall2'], 'teal'],
  ['independent', '独立内核', ['Shadowrocket · Surge · Loon', 'Quantumult X · Stash · Egern'], 'violet'],
];
for (const [slug, label, apps, color] of families) {
  const [tint, light, accent, stroke] = colors[color];
  document(`family-${slug}.svg`, 250, 128, `${label} 配置入口`, apps.join('；'),
    `<defs><linearGradient id="family" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".65" stop-color="${tint}"/><stop offset="1" stop-color="${light}"/></linearGradient></defs>
    <rect x="1" y="1" width="248" height="126" rx="19" fill="url(#family)" stroke="${stroke}"/>
    <path d="M20 2H230" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    <path d="M222 28V49M212 38H232" stroke="${accent}" stroke-opacity=".22" stroke-width="1.5"/>
    <circle cx="222" cy="38" r="13" fill="#ffffff" fill-opacity=".54" stroke="${stroke}"/>
    <path d="M218 34L222 38L218 42M222 38H227" fill="none" stroke="${accent}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    ${text(19, 45, label, 24, 650)}
    ${lines(19, 79, apps, 14.5, 24, muted)}
    <path d="M20 115H57" stroke="${accent}" stroke-width="2" stroke-opacity=".5" stroke-linecap="round"/>`, true);
}

function sourceMark(x, y) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="#6b9ac8" stroke-width="1.6"><path d="M0 17L28 0L56 17L28 34ZM28 0V34M0 17H56"/><circle cx="28" cy="17" r="5" fill="#f5fbff"/></g>`;
}
function deviceMark(x, y) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="#7c80b0" stroke-width="1.7" stroke-linejoin="round"><rect width="43" height="28" rx="3"/><path d="M21 28V35M10 35H33"/><rect x="50" y="9" width="17" height="31" rx="3"/><path d="M56 35H61"/></g>`;
}

document('overview.svg', 1120, 300, '同一规则源，跨设备分流', '同一规则源生成各客户端原生配置，在桌面、移动端与 OpenWrt 使用。具备对应能力的客户端提供 33 业务组与 22 区域组；Karing 使用原生适配，Xray 使用三出站路由，能力和导入方式以各端指南为准。',
  `${rect(28, 29, 292, 151, '#e0edff', 23)}${sourceMark(244, 52)}
  ${text(49, 78, '同一规则源', 27, 650)}
  ${lines(49, 118, ['统一维护分流策略', '业务命中顺序保持一致'], 20, 30)}
  ${arrow(332, 105, 384, 105)}
  ${rect(398, 29, 306, 151, '#d9f2ef', 23)}
  ${text(419, 78, '各端原生配置', 27, 650)}
  ${lines(419, 118, ['选择客户端，导入对应配置', '按平台能力适配规则与节点组'], 20, 30)}
  ${arrow(716, 105, 768, 105)}
  ${rect(782, 29, 310, 151, '#eae4fc', 23)}${deviceMark(1004, 48)}
  ${text(803, 78, '跨设备分流', 27, 650)}
  ${lines(803, 118, ['桌面 · 移动端 · OpenWrt', '按业务选择策略与出口'], 20, 30)}
  <path d="M34 206H1086" stroke="#c6d9e8"/>
  ${text(36, 240, '33 业务组 / 22 区域组', 21, 650)}
  ${text(334, 240, '适用于具备对应策略组能力的客户端', 19, 400, muted)}
  ${text(36, 275, 'Karing 原生适配 · Xray 三出站路由；各端能力与导入方式见配置指南。', 19, 400, muted)}`);

document('overview-mobile.svg', 420, 550, '同一规则源，跨设备分流', '窄屏概览：同一规则源生成各端原生配置，在桌面、移动端与 OpenWrt 分流。33 业务组和 22 区域组只适用于具备对应能力的客户端。Karing 原生适配与 Xray 三出站路由有各自边界。',
  `${rect(22, 20, 376, 106, '#e0edff', 21)}${sourceMark(316, 38)}
  ${text(42, 58, '同一规则源', 25, 650)}
  ${text(42, 91, '统一维护策略与业务命中顺序', 19, 400, muted)}
  ${arrow(210, 134, 210, 150)}
  ${rect(22, 162, 376, 106, '#d9f2ef', 21)}
  ${text(42, 200, '各端原生配置', 25, 650)}
  ${text(42, 233, '选择客户端，导入对应配置', 19, 400, muted)}
  ${arrow(210, 276, 210, 292)}
  ${rect(22, 304, 376, 106, '#eae4fc', 21)}${deviceMark(311, 322)}
  ${text(42, 342, '跨设备分流', 25, 650)}
  ${text(42, 375, '桌面 · 移动端 · OpenWrt', 19, 400, muted)}
  ${text(24, 449, '33 业务组 / 22 区域组', 22, 650)}
  ${text(24, 478, '适用于具备对应能力的客户端', 18, 400, muted)}
  ${lines(24, 511, ['Karing 原生适配 · Xray 三出站路由', '各端能力与导入方式见配置指南'], 17, 25)}`);

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

// Document headers share a quiet routing-prism motif, with no drifting release data.
const pages = [
  ['clash-party', 'Clash Party', '覆写脚本与导入指南', 'blue'],
  ['cmfa', 'CMFA', '原生配置与导入指南', 'blue'],
  ['openclash', 'OpenClash', '路由器配置与导入指南', 'blue'],
  ['flclash', 'FlClash', '覆写脚本与导入指南', 'blue'],
  ['sing-box', 'SingBox', '完整配置与导入指南', 'teal'],
  ['karing', 'Karing', '原生分流适配与导入指南', 'teal'],
  ['v2rayn', 'v2rayN', '路由配置与使用指南', 'violet'],
  ['passwall', 'Passwall', '分流配置与导入指南', 'teal'],
  ['passwall2', 'Passwall2', '分流配置与导入指南', 'teal'],
  ['shadowrocket', 'Shadowrocket', '配置导入与使用指南', 'violet'],
  ['surge', 'Surge', '配置导入与使用指南', 'violet'],
  ['loon', 'Loon', '配置导入与使用指南', 'violet'],
  ['quantumult-x', 'Quantumult X', '配置导入与使用指南', 'violet'],
  ['stash', 'Stash', '配置导入与使用指南', 'violet'],
  ['egern', 'Egern', '配置导入与使用指南', 'violet'],
  ['downloads', '配置下载', '选择客户端，找到对应配置', 'blue'],
  ['client-support', '客户端支持', '了解平台能力与适配边界', 'teal'],
  ['routing-policy', '分流策略', '了解业务命中与出口选择', 'blue'],
  ['dns-and-verification', 'DNS 与导入验收', '检查解析、规则与实际出口', 'teal'],
  ['acknowledgements', '来源与致谢', '规则来源、项目与贡献者', 'violet'],
  ['docs', '文档中心', '从配置导入到日常使用', 'blue'],
  ['advanced', '进阶使用', '按需配置，理解适用边界', 'violet'],
  ['substore', 'Sub-Store', '订阅处理脚本与使用指南', 'teal'],
  ['tools', '维护工具', '生成、检查与维护说明', 'blue'],
  ['family-mihomo', 'Mihomo 内核系列', '选择客户端与配置入口', 'blue'],
  ['family-sing-box', 'sing-box 内核系列', '完整配置与原生分流适配', 'teal'],
  ['family-xray', 'Xray 内核系列', '路由配置与使用入口', 'violet'],
  ['family-dual-core', '双内核系列', 'Passwall 与 Passwall2 配置入口', 'teal'],
  ['family-independent', '独立内核系列', '按客户端选择原生配置', 'violet'],
  ['changelog', '变更日志', '查看版本变化与发布记录', 'blue'],
  ['contract', '维护契约', '生成、文档与协作约定', 'blue'],
  ['archive', '参考与核验档案', '官方资料与历史证据入口', 'violet'],
  ['rules-source', '规则源与编译', '维护同源规则与生成链路', 'teal'],
  ['mirrors', '规则镜像', '备用来源与资产说明', 'blue'],
  ['ai-issue-responder', 'Issue自动回复', '回复流程与配置说明', 'blue'],
  ['claude-dependencies', 'Claude服务依赖', '服务连接与依赖排查', 'violet'],
  ['rules-coverage', '规则覆盖台账', '查看规则来源与覆盖范围', 'teal'],
  ['microsoft-store', 'Microsoft Store排障', '商店访问与下载问题排查', 'blue'],
  ['private-node-dns', '私有节点DNS', '私有节点域名与解析设置', 'teal'],
  ['process-name', '进程规则兼容', '进程匹配与平台适用边界', 'violet'],
  ['release-batch', '发布批次', '同步范围与发布记录', 'blue'],
  ['rule-asset-delivery', '规则资产交付', '规则下载与交付检查', 'teal'],
  ['rule-quality', '规则质量', '质量检查与维护说明', 'blue'],
  ['subscription-node-filter', '订阅节点筛选', '节点清理与筛选说明', 'teal'],
  ['telegram', '频道通知', '频道发布与通知配置', 'violet'],
  ['traffic-options', '测速与QUIC', '测速设置与流量选项', 'blue'],
  ['zerotier', 'ZeroTier UDP代理', '连接路径与代理配置', 'teal'],
];
function pagePrism(x, y, scale, accent, stroke) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke-linejoin="round">
    <path d="M0 50H52M160 20H210M160 50H232M160 80H210" stroke="${stroke}" stroke-width="2"/>
    <path d="M52 50L106 17L160 50L106 83Z" fill="${accent}" fill-opacity=".06" stroke="${accent}" stroke-opacity=".6" stroke-width="1.7"/>
    <path d="M106 17V83M52 50H160M106 17L133 50L106 83" stroke="${accent}" stroke-opacity=".3" stroke-width="1.3"/>
    <circle cx="106" cy="50" r="7" fill="#ffffff" fill-opacity=".8" stroke="${accent}" stroke-width="1.6"/>
    <g fill="#ffffff" stroke="${accent}" stroke-width="1.6"><circle cx="0" cy="50" r="4"/><circle cx="210" cy="20" r="4"/><circle cx="232" cy="50" r="4"/><circle cx="210" cy="80" r="4"/></g>
    </g>`;
}
for (const [slug, title, subtitle, color] of pages) {
  const [tint, , accent, stroke] = colors[color];
  // Estimate mixed CJK/Latin width conservatively, keeping mobile text readable.
  const titleUnits = [...title].reduce((sum, ch) => sum + (/[^\x00-\x7F]/.test(ch) ? 1 : .65), 0);
  const mobileTitleSize = Math.max(25, Math.min(30, Math.floor(372 / titleUnits)));
  document(`page-${slug}.svg`, 1000, 180, title, subtitle,
    `<path d="M30 148H608" stroke="${stroke}" stroke-opacity=".45"/>
    ${rect(688, 25, 280, 130, tint, 25)}${pagePrism(711, 40, 1, accent, stroke)}
    ${text(34, 76, title, 36, 650)}${text(36, 116, subtitle, 22, 400, muted)}
    <rect x="36" y="147" width="70" height="3" rx="1.5" fill="url(#ribbon)"/>`);
  document(`page-${slug}-mobile.svg`, 420, 180, title, subtitle,
    `${text(24, 59, title, mobileTitleSize, 650)}${text(25, 98, subtitle, 18, 400, muted)}
    <path d="M25 139H235" stroke="${stroke}" stroke-opacity=".5"/>
    <rect x="25" y="138" width="49" height="3" rx="1.5" fill="url(#ribbon)"/>
    ${pagePrism(275, 116, .5, accent, stroke)}`);
}

const navButtons = [
  ['downloads', '下载目录', 'blue', 'M12 12V22M8 18L12 22L16 18M7 27H17'],
  ['docs', '文档中心', 'violet', 'M6 11H11L13 13L15 11H20V27H15L13 29L11 27H6ZM13 13V29'],
  ['verify', '导入后验收', 'teal', 'M7 19L11 23L19 14'],
  ['tutorial', '导入教程', 'blue', 'M7 12H20V27H7ZM10 16H17M10 20H17M10 24H14'],
];
for (const [slug, label, color, icon] of navButtons) {
  const [tint, light, accent, stroke] = colors[color];
  document(`nav-${slug}.svg`, 145, 38, label, `打开${label}`,
    `<defs><linearGradient id="nav" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".65" stop-color="${tint}"/><stop offset="1" stop-color="${light}"/></linearGradient></defs>
    <rect x="1" y="1" width="143" height="36" rx="11" fill="url(#nav)" stroke="${stroke}"/>
    <path d="M12 2H133" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
    <path d="${icon}" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(7 0)"/>
    ${text(39, 24, label, 14, 600)}`, true);
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
