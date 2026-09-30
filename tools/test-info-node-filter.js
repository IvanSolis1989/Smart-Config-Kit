#!/usr/bin/env node
'use strict';
// ============================================================================
// #6 借鉴 Proxy-override：节点过滤(junk)关键词补充 —— 6 个 mihomo 产物跨端一致性回归
// ----------------------------------------------------------------------------
// 背景：#6 给 junk 节点过滤器补充关键词 `免费/试用/应急`（中文子串）+
//       `Sign/Login/Register/Help/FAQ`（英文，必须 \b 词边界，否则 RE2/Ruby 子串
//       引擎会把 "Signal" 当 "Sign" 误伤——参见 AGENTS.md §3.5.3 正则语义差异）。
// 分工：
//   - 行为回归（junk 真被过滤 + "Signal" 不被误伤）：tools/validate-js-overwrites.js
//     的 fixture 已含正例(免费/试用/应急/Sign Up/Login/Register/Help/FAQ)与
//     负例("Signal 香港 IEPL x1")，对 3 个 JS 产物实跑 main() 断言。
//   - 本测试：静态源码一致性——确保全部 6 个 mihomo 产物（含 validator 不执行的
//     CMFA YAML / OpenClash Ruby）都补齐了关键词，且英文采用 \b 词边界形态。
// 用法：node tools/test-info-node-filter.js
// ============================================================================
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');

const CN = ['免费', '试用', '应急'];                       // 中文：子串匹配即可（无词边界问题）
const EN = ['Sign', 'Login', 'Register', 'Help', 'FAQ'];   // 英文：必须 \b 词边界

// junk 过滤器所在的 6 个 mihomo 产物（其余产物不处理订阅去 junk，#6 不适用）
const PRODUCTS = [
  'Clash Party/ClashParty(mihomo-smart).js',
  'Clash Party/ClashParty(mihomo).js',
  'FlClash/FlClash(mihomo).js',
  'Clash Meta For Android/CMFA(mihomo).yaml',
  'OpenClash/OpenClash(mihomo-smart).sh',
  'OpenClash/OpenClash(mihomo).sh',
];

// 英文关键词的词边界保护：接受两种合法形态
//   个体形态 \bSign\b          —— CMFA exclude-filter / OpenClash Ruby
//   群组形态 \b(?:Sign|...)\b   —— Clash Party / FlClash JS 的 isInfoNode infoRes
function enProtected(src, kw) {
  if (src.includes('\\b' + kw + '\\b')) return true;
  const groups = src.match(/\\b\(\?:[^)]+\)\\b/g) || [];
  if (groups.some((g) => g.split(/[(?:|)]/).includes(kw))) return true;
  // Ruby \b treats adjacent Han characters as word characters; explicit ASCII
  // boundaries match the JavaScript word-boundary behavior for English labels.
  const asciiGroups = src.match(/\(\?<!\[A-Za-z0-9_\]\)\(\?:[^)]+\)\(\?!\[A-Za-z0-9_\]\)/g) || [];
  return asciiGroups.some((g) => g.split(/[(?:|)]/).includes(kw));
}

let failures = 0;
for (const rel of PRODUCTS) {
  const abs = path.join(REPO, rel);
  let src;
  try {
    src = fs.readFileSync(abs, 'utf8');
  } catch (err) {
    console.error(`FAIL ${rel}: 无法读取（${err.message}）`);
    failures += 1;
    continue;
  }
  for (const kw of CN) {
    if (!src.includes(kw)) {
      console.error(`FAIL ${rel}: 缺中文 junk 关键词「${kw}」`);
      failures += 1;
    }
  }
  for (const kw of EN) {
    if (!enProtected(src, kw)) {
      console.error(`FAIL ${rel}: 缺英文 junk 关键词 \\b${kw}\\b（须词边界保护，防误伤 Signal 等）`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`\nFAIL #6 junk 关键词跨产物一致性：${failures} 处缺失/错误`);
  process.exit(1);
}
console.log(`PASS #6 junk 关键词跨产物一致性：${PRODUCTS.length} 产物 × (${CN.length} 中文 + ${EN.length} 英文边界) 全部就位`);
console.log('  正例(应过滤): 免费节点 / 试用1天 / 应急入口 / Sign Up / Login Panel / Register Now / Help Center / FAQ');
console.log('  负例(应保留): Signal(含 Sign 但有词边界保护) / 香港 IEPL x1 / 美国节点');
console.log('  行为回归: 见 tools/validate-js-overwrites.js（fixture 含上述正/负例，对 3 JS 产物实跑 main() 断言）');
process.exit(0);
