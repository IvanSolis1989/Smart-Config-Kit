#!/usr/bin/env node
'use strict';
/**
 * KR 区域正则词边界回归测试 — FIX#KR-WB
 * =====================================================================
 * 背景
 *   日韩区域分类器里的两字母代码 "KR" 原为裸写（无词边界），导致含 "kr/KR"
 *   子串的非韩国节点被误分到日韩组：
 *     · Ruby `/i`（OpenClash Normal/Smart）、Loon `(?i)` —— 不区分大小写，
 *       连小写 "kr" 也误伤：Ukraine / Krakow / Kraken。
 *     · Shadowrocket / Surge / Quantumult X —— 大小写敏感，仅大写 "KR"
 *       子串误伤：KRAKEN / DARKROOM。
 *   主线 Clash Party×3 JS（_getWordBoundaryRegex）与 CMFA filter 本就带边界，未受影响。
 *
 * 修复（各自贴合所在文件既有风格，不机械统一 —— 见 AGENTS.md §3.5）
 *   · OpenClash Ruby×2  → `\bKR\b`               （同文件 HK/TW/JP/SG/US 均用 \b）
 *   · 独立内核系/Loon/SR/独立内核系/Surge/QX  → `(?<![a-zA-Z])KR(?![a-zA-Z])` （同文件 US/SG 均用此写法）
 *
 * 语义差异（故意保留，已记录）
 *   `\b` 把数字视为单词字符 → "KR01"（数字紧邻）不命中；与同文件 HK01/TW01 一致。
 *   `(?<![a-zA-Z])…(?![a-zA-Z])` 数字算边界 → "KR01" 命中；对齐主线 JS 的
 *   `(^|[^a-zA-Z])KR([^a-zA-Z]|$)`。
 *
 * 覆盖差异（既有、非本次回归）
 *   OpenClash Ruby 的 KR 分支只列 韩国/韓國/Korea/Seoul，未含中文 "首尔/釜山/仁川"；
 *   conf 产物（SR/独立内核系/Surge/独立内核系/Loon/QX）含之。故中文城市样例只对 conf 断言命中。
 *
 * 跑法：node tools/test-kr-boundary.js     （退出码 0 = 全过；1 = 有失败）
 */

// ── KR 分支隔离正则（仅取各产物日韩组里与 KR 命中相关的片段）──────────────
const OLD = {
  ruby_ci: /韩国|韓國|KR|KOR|Korea|🇰🇷|Seoul/i,                              // 旧 OpenClash Ruby / Loon
  cs:      /🇰🇷|KR|Korea|korea|KOR|Seoul|seoul|韩国|首尔/,                    // 旧 SR/独立内核系/Surge/QX（敏感）
};
const NEW = {
  ruby:    /韩国|韓國|\bKR\b|KOR|Korea|🇰🇷|Seoul/i,                          // 新 OpenClash Ruby（\b, 不敏感）
  look_ci: /🇰🇷|(?<![a-zA-Z])KR(?![a-zA-Z])|Korea|KOR|Seoul|韩国|首尔/i,      // 新 Loon（lookbehind, 不敏感）
  look_cs: /🇰🇷|(?<![a-zA-Z])KR(?![a-zA-Z])|Korea|korea|KOR|Seoul|seoul|韩国|首尔/, // 新 SR/独立内核系/Surge/QX（敏感）
};

// ── 测试样例 ──────────────────────────────────────────────────────────────
const DECOY_UPPER  = ['KRAKEN VPN', 'DARKROOM Net'];           // 含大写 KR：敏感&不敏感都应拒
const DECOY_LOWER  = ['Ukraine 01', 'Krakow IPLC', 'Sukrania']; // 含小写 kr：不敏感引擎曾误伤
const REAL_COMMON  = ['KR 01', 'KR-Seoul', '🇰🇷 Premium', 'Korea Home', 'Seoul-1']; // 各产物都覆盖，必命中
const REAL_CN_CITY = ['首尔 IPLC'];                            // 中文城市：仅 conf 覆盖（Ruby 既有差异）
const REAL_DIGIT   = ['KR01', 'KR2'];                          // 数字紧邻 KR（无其它韩国标识）

let pass = 0, fail = 0;
function expect(label, actual, wanted) {
  if (actual === wanted) { pass++; }
  else { fail++; console.log(`  ✗ ${label}  (got ${actual}, want ${wanted})`); }
}

console.log('=== 旧正则：演示 bug（误伤样例本不该命中却命中）===');
DECOY_UPPER.forEach(n => { if (OLD.ruby_ci.test(n) || OLD.cs.test(n)) console.log(`  [bug] "${n}" 旧正则误判为 KR`); });
DECOY_LOWER.forEach(n => { if (OLD.ruby_ci.test(n)) console.log(`  [bug] "${n}" 旧不敏感正则误判为 KR`); });

console.log('\n=== 新正则：OpenClash Ruby (\\bKR\\b, 不敏感) ===');
[...DECOY_UPPER, ...DECOY_LOWER].forEach(n => expect(`reject "${n}"`, NEW.ruby.test(n), false));
REAL_COMMON.forEach(n => expect(`accept "${n}"`, NEW.ruby.test(n), true));
REAL_DIGIT.forEach(n => expect(`\\b 不匹配数字紧邻 "${n}"（既有特性）`, NEW.ruby.test(n), false));

console.log('\n=== 新正则：Loon (lookbehind, 不敏感) ===');
[...DECOY_UPPER, ...DECOY_LOWER].forEach(n => expect(`reject "${n}"`, NEW.look_ci.test(n), false));
[...REAL_COMMON, ...REAL_CN_CITY].forEach(n => expect(`accept "${n}"`, NEW.look_ci.test(n), true));
REAL_DIGIT.forEach(n => expect(`lookbehind 匹配数字紧邻 "${n}"`, NEW.look_ci.test(n), true));

console.log('\n=== 新正则：SR/独立内核系/Surge/QX (lookbehind, 大小写敏感) ===');
DECOY_UPPER.forEach(n => expect(`reject "${n}"`, NEW.look_cs.test(n), false));
[...REAL_COMMON, ...REAL_CN_CITY].forEach(n => expect(`accept "${n}"`, NEW.look_cs.test(n), true));
REAL_DIGIT.forEach(n => expect(`accept "${n}"`, NEW.look_cs.test(n), true));

console.log(`\n=== 结果：${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);
